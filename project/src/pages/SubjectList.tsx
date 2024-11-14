import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { BookOpen } from 'lucide-react';

export function SubjectList() {
  const navigate = useNavigate();
  const { subjects, currentStudent } = useStore();

  if (!currentStudent) {
    navigate('/');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">مرحباً {currentStudent.name}</h2>
          <p className="text-gray-400 mt-2">اختر المادة التي تريد اختبارها</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => navigate(`/exam/${subject.id}`)}
              className="bg-gray-700 hover:bg-gray-600 rounded-lg p-6 text-center transition duration-200 group"
            >
              <BookOpen className="w-12 h-12 mx-auto text-purple-500 group-hover:text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold">{subject.name}</h3>
              <p className="text-gray-400 mt-2">{subject.timeLimit} دقيقة</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}