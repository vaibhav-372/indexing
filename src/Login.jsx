import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
      const from = location.state?.from?.pathname || '/game';
      navigate(from, { replace: true });
    }
  }, [navigate, location]);

  // Get users from environment variables
  const getUsersFromEnv = () => {
    const users = [];

    // Get up to 4 users from environment variables
    for (let i = 1; i <= 4; i++) {
      const username = import.meta.env[`VITE_USER_${i}_USERNAME`];
      const password = import.meta.env[`VITE_USER_${i}_PASSWORD`];

      if (username && password) {
        users.push({ username, password });
      }
    }

    return users;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simple validation
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    // Get valid users from environment variables
    const validUsers = getUsersFromEnv();

    // Check if credentials match any valid user
    const isValidUser = validUsers.some(
      user => user.username === username && user.password === password
    );

    // Simulate API call delay
    setTimeout(() => {
      if (isValidUser) {
        // Store login state
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);

        // Redirect to intended page or default to /game
        const from = location.state?.from?.pathname || '/game';
        navigate(from, { replace: true });
      } else {
        setError('Invalid username or password');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2EE8B3] to-[#1a8c6e] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#2EE8B3] text-white p-6 text-center">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-white/80 mt-2">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Username Input */}
          <div className="mb-6">
            <label htmlFor="username" className="block text-gray-700 text-sm font-medium mb-2">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2EE8B3] focus:border-transparent outline-none transition"
                placeholder="Enter your username"
                autoComplete="username"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="mb-8">
            <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2EE8B3] focus:border-transparent outline-none transition"
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2EE8B3] hover:bg-[#25c89c] text-white font-semibold py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#2EE8B3] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            Secure access to the game dashboard
          </p>
        </div>
      </div>
    </div>
  );
}