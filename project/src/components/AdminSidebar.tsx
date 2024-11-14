import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, BookOpen, Settings, Activity, PlusCircle } from 'lucide-react';

const menuItems = [
  { path: '/admin/dashboard', icon: Users, label: 'Overview' },
  { path: '/admin/dashboard/questions', icon: BookOpen, label: 'Questions' },
  { path: '/admin/dashboard/live', icon: Activity, label: 'Live Exams' },
  { path: '/admin/dashboard/admins', icon: Settings, label: 'Manage Admins' },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <div className="card sticky top-24">
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-purple-600 text-white'
                  : 'hover:bg-purple-600/10 text-slate-300 hover:text-purple-400'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}