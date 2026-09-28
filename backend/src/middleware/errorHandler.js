// Ensures no raw backend/stack-trace errors ever reach the client.
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'MulterError' || /Unsupported file type/.test(err.message)) {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validation failed.', details: err.errors.map(e => e.message) });
  }
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({ error: 'This record conflicts with an existing entry.' });
  }

  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Something went wrong on our end. Please try again.' : err.message
  });
}

function notFound(req, res) {
  res.status(404).json({ error: 'The requested resource was not found.' });
}

module.exports = { errorHandler, notFound };
