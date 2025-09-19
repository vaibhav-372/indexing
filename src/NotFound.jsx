import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-[#2EE8B3] px-4">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl font-bold mb-6">Oops! The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="text-white bg-[#2EE8B3] px-6 py-2 rounded font-semibold transition"
      >
        Go Back Home
      </Link>
    </div>
  );
}
