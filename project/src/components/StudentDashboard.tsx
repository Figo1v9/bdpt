import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, BookOpen, Clock } from 'lucide-react';

const subjects = [
  { id: 1, name: 'Business Management', icon: '💼', color: 'from-blue-600 to-blue-400' },
  { id: 2, name: 'Economics', icon: '📊', color: 'from-green-600 to-green-400' },
  { id: 3, name: 'Financial Accounting', icon: '📝', color: 'from-purple-600 to-purple-400' },
  { id: 4, name: 'English', icon: '📚', color: 'from-red-600 to-red-400' },
  { id: 5, name: 'Law', icon: '⚖️', color: 'from-yellow-600 to-yellow-400' }
];

interface Props {
  username: string;
  onStartExam: (subject: string) => void;
}

export default function StudentDashboard({ username, onStartExam }: Props) {
  const handleLogout = () => {
    window.location.reload();
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-4"
          >
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-dark-300 hover:text-plasma-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
            <h1 className="text-2xl font-bold">
              Welcome, <span className="text-plasma-400">{username}</span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-2 text-dark-300 plasma-card px-4 py-2"
          >
            <Clock className="w-5 h-5" />
            <span>{new Date().toLocaleDateString()}</span>
          </motion.div>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {subjects.map((subject) => (
            <motion.div key={subject.id} variants={item}>
              <div className="plasma-card group hover:scale-[1.02] transition-transform duration-300">
                <div className={`absolute inset-0 bg-gradient-to-br ${subject.color} opacity-5 group-hover:opacity-10 transition-opacity rounded-xl`} />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">{subject.icon}</span>
                    <BookOpen className="w-6 h-6 text-plasma-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{subject.name}</h3>
                  <button
                    onClick={() => onStartExam(subject.name)}
                    className="plasma-button w-full"
                  >
                    Start Exam
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}