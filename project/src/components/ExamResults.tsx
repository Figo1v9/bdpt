import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowLeft, Trophy, Target, Clock } from 'lucide-react';
import Confetti from 'react-confetti';
import { Question } from '../types';

interface Props {
  questions: Question[];
  userAnswers: number[];
  score: number;
  subject: string;
  onReturn: () => void;
}

export default function ExamResults({ questions, userAnswers, score, subject, onReturn }: Props) {
  const percentage = (score / questions.length) * 100;
  const isPassing = percentage >= 60;

  return (
    <div className="min-h-screen p-6">
      {isPassing && <Confetti recycle={false} numberOfPieces={200} />}
      
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-between items-center mb-8"
        >
          <button
            onClick={onReturn}
            className="flex items-center gap-2 text-dark-300 hover:text-plasma-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Return to Dashboard
          </button>
        </motion.div>

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="plasma-card p-8 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <Trophy className="w-10 h-10 mx-auto text-yellow-400" />
              <h3 className="text-dark-300">Final Score</h3>
              <p className="text-3xl font-bold">{score}/{questions.length}</p>
            </div>
            <div className="space-y-2">
              <Target className="w-10 h-10 mx-auto text-plasma-400" />
              <h3 className="text-dark-300">Percentage</h3>
              <p className="text-3xl font-bold">{percentage.toFixed(1)}%</p>
            </div>
            <div className="space-y-2">
              <Clock className="w-10 h-10 mx-auto text-green-400" />
              <h3 className="text-dark-300">Subject</h3>
              <p className="text-3xl font-bold">{subject}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold mb-6">Review Questions</h2>
          {questions.map((question, index) => {
            const isCorrect = userAnswers[index] === question.correctAnswer;
            return (
              <motion.div
                key={question.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 * index }}
                className="plasma-card"
              >
                <div className={`absolute inset-0 ${
                  isCorrect ? 'bg-green-500/5' : 'bg-red-500/5'
                } rounded-xl`} />
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-lg font-medium mb-4">{question.text}</p>
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`p-3 rounded-lg ${
                              optIndex === question.correctAnswer
                                ? 'bg-green-500/10 text-green-400'
                                : optIndex === userAnswers[index]
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-dark-700/50'
                            }`}
                          >
                            {option}
                            {optIndex === question.correctAnswer && (
                              <span className="ml-2 text-sm">(Correct Answer)</span>
                            )}
                          </div>
                        ))}
                      </div>
                      {question.explanation && (
                        <p className="mt-4 text-dark-300 text-sm">{question.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}