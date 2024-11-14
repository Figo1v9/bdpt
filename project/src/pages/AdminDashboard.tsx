import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AdminSidebar } from '../components/AdminSidebar';
import { AdminStats } from '../components/AdminStats';
import { ManageQuestions } from '../components/ManageQuestions';
import { ManageAdmins } from '../components/ManageAdmins';
import { LiveExams } from '../components/LiveExams';

export default function AdminDashboard() {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-3">
        <AdminSidebar />
      </div>
      
      <div className="col-span-12 lg:col-span-9 space-y-6">
        <Routes>
          <Route path="/" element={<AdminStats />} />
          <Route path="/questions" element={<ManageQuestions />} />
          <Route path="/admins" element={<ManageAdmins />} />
          <Route path="/live" element={<LiveExams />} />
        </Routes>
      </div>
    </div>
  );
}