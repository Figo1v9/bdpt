import React, { useState, useEffect } from 'react';
import { Activity, Users, Clock } from 'lucide-react';
import { socketService } from '../services/socket';

interface ActiveExam {
  id: string;
  subject: string;
  studentsCount: number;
  startTime: string;
  duration: number;
}

export function LiveExams() {
  const [activeExams, setActiveExams] = useState<ActiveExam[]>([]);

  useEffect(() => {
    socketService.onExamStarted((exam) => {
      setActiveExams((prev) => [...prev, exam]);
    });

    socketService.onExamEnded((examId) => {
      setActiveExams((prev) => prev.filter(exam => exam.id !== examId));
    });

    return () => {
      socketService.offExamStarted();
      socketService.offExamEnded();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Live Exams</h2>
        <div className="flex items-center gap-2 text-purple-400">
          <Activity size={24} className="animate-pulse" />
          <span>{activeExams.length} Active Sessions</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeExams.map((exam) => (
          <div key={exam.id} className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{exam.subject}</h3>
              <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-sm">
                In Progress
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-300">
                <Users size={18} />
                <span>{exam.studentsCount} Students Active</span>
              </div>
              
              <div className="flex items-center gap-2 text-slate-300">
                <Clock size={18} />
                <span>Started {new Date(exam.startTime).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Duration: {exam.duration} minutes</span>
                <button className="text-purple-400 hover:text-purple-300 transition-colors">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}

        {activeExams.length === 0 && (
          <div className="col-span-full card text-center py-12">
            <Activity size={48} className="mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400">No active exams at the moment</p>
          </div>
        )}
      </div>
    </div>
  );
}