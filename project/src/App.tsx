import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import StudentDashboard from './components/StudentDashboard';
import Exam from './components/Exam';
import { User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentExam, setCurrentExam] = useState<string | null>(null);

  const handleLogin = (user: User) => {
    setUser(user);
  };

  const handleStartExam = (subject: string) => {
    setCurrentExam(subject);
  };

  const handleExamComplete = () => {
    setCurrentExam(null);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {!user ? (
          <Login onLogin={handleLogin} />
        ) : user.role === 'admin' ? (
          <AdminPanel />
        ) : currentExam ? (
          <Exam
            subject={currentExam}
            username={user.username}
            onComplete={handleExamComplete}
          />
        ) : (
          <StudentDashboard
            username={user.username}
            onStartExam={handleStartExam}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default App;