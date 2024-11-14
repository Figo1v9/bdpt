import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Here we would normally register in the database
      const studentId = 'ST' + Math.random().toString(36).substr(2, 6).toUpperCase();
      alert(`Your student ID is: ${studentId}`);
      navigate('/login');
    } catch (err) {
      setError('Registration failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Student Registration</h1>
        
        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium mb-2">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition-colors"
          >
            <UserPlus size={20} />
            <span>Register</span>
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already registered?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}