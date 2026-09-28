import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/UI';

export default function Forbidden() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center px-6">
      <p className="text-6xl font-bold text-slate-200">403</p>
      <p className="text-slate-600 mt-2 mb-6">You don't have permission to access this page.</p>
      <Link to="/"><Button>Go Home</Button></Link>
    </div>
  );
}
