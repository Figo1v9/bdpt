import React from 'react';
import { Outlet } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <GraduationCap className="w-8 h-8 text-purple-500" />
          <h1 className="text-2xl font-bold ml-2">نظام الاختبارات</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}