import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { SubjectList } from './pages/SubjectList';
import { Exam } from './pages/Exam';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Login />} />
          <Route path="admin" element={<AdminLogin />} />
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="subjects" element={<SubjectList />} />
          <Route path="exam/:subjectId" element={<Exam />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;