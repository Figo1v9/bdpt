import React from 'react';
import { CheckCircle, Target, Award } from 'lucide-react';

export function StudentStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gray-700 p-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <CheckCircle className="text-green-500" size={24} />
          <div>
            <h3 className="text-sm text-gray-400">Completed Tests</h3>
            <p className="text-2xl font-bold">12</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-700 p-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <Target className="text-purple-500" size={24} />
          <div>
            <h3 className="text-sm text-gray-400">Average Score</h3>
            <p className="text-2xl font-bold">85%</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-700 p-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <Award className="text-yellow-500" size={24} />
          <div>
            <h3 className="text-sm text-gray-400">Questions Answered</h3>
            <p className="text-2xl font-bold">145</p>
          </div>
        </div>
      </div>
    </div>
  );
}