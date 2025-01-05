// src/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveSession } from '../utils/sessionManager';
import { UserCircle } from 'lucide-react';

const Login = ({ setUser, socket }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Listen for login response from server
    if (socket) {
      const handleLoginSuccess = (userData) => {
        saveSession(userData);
        setUser(userData);
        setIsLoading(false);
        navigate('/groups');
      };

      const handleLoginError = (errorMessage) => {
        setError(errorMessage);
        setIsLoading(false);
      };

      socket.on('login:success', handleLoginSuccess);
      socket.on('login:error', handleLoginError);

      return () => {
        socket.off('login:success', handleLoginSuccess);
        socket.off('login:error', handleLoginError);
      };
    }
  }, [socket, setUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    try {
      setIsLoading(true);
      // Generate a unique ID for the user
      const userData = {
        id: `user_${Date.now()}`,
        username: username.trim(),
        isAdmin: false, // Set to true for admin users if needed
        createdAt: new Date().toISOString()
      };

      if (socket && socket.connected) {
        socket.emit('user:login', userData);
      } else {
        // Fallback if socket is not connected
        saveSession(userData);
        setUser(userData);
        navigate('/groups');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to login. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div className="text-center">
          <UserCircle className="mx-auto h-12 w-12 text-blue-500" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome to Chat App
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your username to continue
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="sr-only">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;