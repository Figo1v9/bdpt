import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Trophy } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { StudentStats } from '../components/StudentStats';

const subjects = [
  { id: 'ba', name: 'Business Administration' },
  { id: 'econ', name: 'Economics' },
  { id: 'acc', name: 'Financial Accounting' },
  { id: 'eng', name: 'English' },
  { id: 'law', name: 'Law' },
];

export default function StudentDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Welcome back, {user?.name}!</h2>
        <StudentStats />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <Link
            key={subject.id}
            to={`/exam/${subject.id}`}
            className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <BookOpen size={24} className="text-purple-500" />
              <h3 className="text-xl font-semibold">{subject.name}</h3>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Trophy size={24} className="text-purple-500" />
          <h3 className="text-xl font-semibold">Achievements</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[20, 40, 60, 80, 100].map((level) => (
            <div
              key={level}
              className="bg-gray-700 rounded-lg p-4 text-center"
            >
              <p className="font-bold text-xl">{level}</p>
              <p className="text-sm text-gray-400">Questions</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}