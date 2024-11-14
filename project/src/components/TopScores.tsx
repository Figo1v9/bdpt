import React from 'react';
import { ExamResult } from '../types';
import { Trophy } from 'lucide-react';

interface TopScoresProps {
  scores: ExamResult[];
  subjectName: string;
}

export function TopScores({ scores, subjectName }: TopScoresProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-6 h-6 text-yellow-500" />
        <h3 className="text-xl font-bold">أفضل النتائج - {subjectName}</h3>
      </div>
      
      <div className="space-y-3">
        {scores.map((result, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-gray-700 p-3 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-purple-500">#{index + 1}</span>
              <div>
                <p className="font-semibold">{result.studentName}</p>
                <p className="text-sm text-gray-400">
                  {new Date(result.timestamp).toLocaleDateString('ar-EG')}
                </p>
              </div>
            </div>
            <div className="text-xl font-bold text-green-500">
              {result.score}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}