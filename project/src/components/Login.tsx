import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Shield, LogIn } from 'lucide-react';
import type { User as UserType } from '../types';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    if (isAdmin) {
      if (username === 'admin' && password === 'admin123') {
        onLogin({ username: 'admin', role: 'admin' });
      } else {
        setError('Invalid admin credentials');
      }
    } else {
      onLogin({ username: username.trim(), role: 'student' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="plasma-card p-8">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-center mb-8"
          >
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 bg-plasma-500/20 rounded-full animate-plasma-pulse"></div>
              <div className="relative flex items-center justify-center w-full h-full bg-plasma-600/10 rounded-full">
                {isAdmin ? (
                  <Shield className="w-10 h-10 text-plasma-400" />
                ) : (
                  <User className="w-10 h-10 text-plasma-400" />
                )}
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {isAdmin ? 'Admin Login' : 'Student Login'}
            </h2>
            <p className="text-dark-300">
              {isAdmin ? 'Enter admin credentials' : 'Enter your username to continue'}
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="plasma-input"
                autoFocus
              />
            </div>

            {isAdmin && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="plasma-input"
                />
              </motion.div>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg"
              >
                {error}
              </motion.p>
            )}

            <button type="submit" className="plasma-button w-full">
              <span className="flex items-center justify-center gap-2">
                <LogIn className="w-5 h-5" />
                Sign In
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsAdmin(!isAdmin);
                setError('');
                setUsername('');
                setPassword('');
              }}
              className="w-full text-sm text-dark-300 hover:text-plasma-400 transition-colors"
            >
              {isAdmin ? 'Switch to Student Login' : 'Switch to Admin Login'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}