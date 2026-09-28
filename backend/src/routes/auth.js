const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const db = require('../db/db');
const { authenticate } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');
require('dotenv').config();

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, mine_id: user.mine_id, contractor_id: user.contractor_id },
    process.env.JWT_SECRET || 'dev_secret_change_me',
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

function sanitize(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.')
});

router.post('/login', (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = db.prepare(`SELECT * FROM users WHERE email = ? AND is_active = 1`).get(email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = signToken(user);
    logAudit({ user, action: 'LOGIN', module: 'auth', recordId: user.id, ip: req.ip });
    res.json({ token, user: sanitize(user) });
  } catch (err) { next(err); }
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.enum(['worker', 'contractor', 'field_inspector', 'mine_manager', 'safety_officer', 'environmental_officer']),
  mine_id: z.number().optional().nullable()
});

// Self-registration limited to field/operational roles; admin-level roles are provisioned by Super Admin.
router.post('/register', (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(body.email.toLowerCase());
    if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

    const password_hash = bcrypt.hashSync(body.password, 10);
    const info = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, mine_id) VALUES (?, ?, ?, ?, ?)
    `).run(body.name, body.email.toLowerCase(), password_hash, body.role, body.mine_id || null);

    const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(info.lastInsertRowid);
    logAudit({ user, action: 'REGISTER', module: 'auth', recordId: user.id, ip: req.ip });
    res.status(201).json({ token: signToken(user), user: sanitize(user) });
  } catch (err) { next(err); }
});

router.get('/me', authenticate, (req, res) => {
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ data: sanitize(user) });
});

router.put('/profile', authenticate, (req, res) => {
  const { name, phone, avatar } = req.body;
  db.prepare(`UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), avatar = COALESCE(?, avatar) WHERE id = ?`)
    .run(name, phone, avatar, req.user.id);
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user.id);
  res.json({ data: sanitize(user) });
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, 'New password must be at least 6 characters.')
});

router.put('/change-password', authenticate, (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user.id);
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }
    const password_hash = bcrypt.hashSync(newPassword, 10);
    db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(password_hash, req.user.id);
    logAudit({ user, action: 'CHANGE_PASSWORD', module: 'auth', recordId: user.id, ip: req.ip });
    res.json({ message: 'Password updated successfully.' });
  } catch (err) { next(err); }
});

// Forgot password (prototype): issues a reset token conceptually - real email delivery is out of scope for a local demo.
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = db.prepare(`SELECT id FROM users WHERE email = ?`).get((email || '').toLowerCase());
  // Always respond the same way whether or not the account exists, to avoid leaking which emails are registered.
  res.json({ message: 'If an account exists for this email, password reset instructions have been sent by your Super Admin (demo mode: no email service is connected).' });
});

module.exports = router;
