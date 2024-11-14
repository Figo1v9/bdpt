import React, { useState, useEffect } from 'react';
import { Question } from '../types';
import { getQuestions } from '../db';
import { Clock, ArrowLeft } from 'lucide-react';
import ExamResults from './ExamResults';

interface Props {
  subject: string;
  username: string;
  onComplete: (score: number) => void;
}

export default function Exam({ subject, username, onComplete }: Props) {
  const [questions] = useState<Question[]>(
    getQuestions().filter(q => q.subject === subject)
  );
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [isExamCompleted, setIsExamCompleted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleExamComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleExamComplete = () => {
    setIsExamCompleted(true);
  };

  const handleNext = () => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = selectedAnswer!;
    setUserAnswers(newAnswers);

    if (selectedAnswer === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      handleExamComplete();
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleBack = () => {
    if (window.confirm('هل أنت متأكد من الخروج من الامتحان؟ سيتم فقدان تقدمك.')) {
      onComplete(0);
    }
  };

  if (isExamCompleted) {
    return (
      <ExamResults
        questions={questions}
        userAnswers={userAnswers}
        score={score}
        subject={subject}
        onReturn={() => onComplete(score)}
      />
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">لا توجد أسئلة متاحة</h2>
          <p>يرجى التواصل مع المسؤول</p>
          <button
            onClick={() => onComplete(0)}
            className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-400 hover:text-white transition-colors duration-200"
          >
            <ArrowLeft className="mr-2" />
            خروج
          </button>
          <div className="flex items-center text-white bg-blue-600 px-4 py-2 rounded-lg">
            <Clock className="mr-2" />
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl blur opacity-30"></div>
          <div className="relative bg-gray-800 rounded-xl shadow-xl p-6 backdrop-blur-sm border border-gray-700">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
                  {subject}
                </h2>
                <p className="text-lg text-gray-400">
                  سؤال {currentQuestion + 1} من {questions.length}
                </p>
              </div>

              <p className="text-xl text-white mb-6 text-right">{questions[currentQuestion].text}</p>

              <div className="space-y-4">
                {questions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAnswer(index)}
                    className={`w-full text-right p-4 rounded-lg transition-all duration-200 transform hover:scale-[1.01] ${
                      selectedAnswer === index
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 text-white hover:bg-gray-600/50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={selectedAnswer === null}
              className={`w-full py-3 rounded-lg font-bold transition-all duration-200 ${
                selectedAnswer === null
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white transform hover:scale-[1.02]'
              }`}
            >
              {currentQuestion + 1 === questions.length ? 'إنهاء' : 'السؤال التالي'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}