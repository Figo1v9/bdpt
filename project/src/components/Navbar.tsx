import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, ArrowLeft, GraduationCap } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <nav className="bg-slate-800/50 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-purple-600/10 rounded-full transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={24} className="text-purple-400" />
            </button>
            <Link to="/" className="flex items-center space-x-2">
              <GraduationCap size={32} className="text-purple-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                Student Testing Platform
              </span>
            </Link>
          </div>
          
          {isAuthenticated && (
            <div className="flex items-center space-x-4">
              <span className="font-medium text-slate-300">
                Welcome, {user?.isAdmin ? `Dr. ${user.name}` : user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 
                px-4 py-2 rounded-lg transition-colors"
                aria-label="Logout"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}