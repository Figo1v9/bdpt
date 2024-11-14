import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function Login() {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!studentId || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      // In production, this would validate against a backend
      if (studentId.length < 6) {
        setError('Invalid student ID format');
        return;
      }

      const user = {
        id: studentId,
        name: "John Doe", // This would come from the backend
        isAdmin: false,
        email: "student@example.com"
      };
      
      login(user);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Student Login
          </h1>
          <p className="text-slate-400 mt-2">Welcome back! Please enter your credentials.</p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="studentId" className="block text-sm font-medium mb-2 text-slate-300">
              Student ID
            </label>
            <input
              id="studentId"
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="input-field"
              placeholder="Enter your student ID"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            <LogIn size={20} />
            <span>Login</span>
          </button>
        </form>

        <div className="mt-6 text-center text-slate-400">
          <p>
            New student?{' '}
            <Link to="/register" className="text-purple-400 hover:text-purple-300 transition-colors">
              Register here
            </Link>
          </p>
          <Link
            to="/admin/login"
            className="block mt-2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}