import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowLeft, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { Question } from '../types';
import { questionsApi, resultsApi } from '../lib/supabase';
import ExamResults from './ExamResults';

interface Props {
  subject: string;
  username: string;
  onComplete: () => void;
}

export default function Exam({ subject, username, onComplete }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes
  const [isExamCompleted, setIsExamCompleted] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    loadQuestions();
  }, [subject]);

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

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const allQuestions = await questionsApi.getQuestions();
      const subjectQuestions = allQuestions
        .filter(q => q.subject === subject)
        .sort(() => Math.random() - 0.5)
        .slice(0, 10); // Get 10 random questions

      setQuestions(subjectQuestions);
    } catch (error) {
      toast.error('Failed to load questions');
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  const handleExamComplete = async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    
    try {
      await resultsApi.saveResult({
        username,
        subject,
        score,
        date: new Date().toISOString(),
        timeSpent,
        questions,
        userAnswers
      });
    } catch (error) {
      console.error('Failed to save exam result:', error);
    }

    setIsExamCompleted(true);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = selectedAnswer;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-plasma-400 animate-spin" />
      </div>
    );
  }

  if (isExamCompleted) {
    return (
      <ExamResults
        questions={questions}
        userAnswers={userAnswers}
        score={score}
        subject={subject}
        onReturn={onComplete}
      />
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="plasma-card p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">No questions available</h2>
          <p className="text-dark-300 mb-6">Please contact the administrator</p>
          <button
            onClick={onComplete}
            className="plasma-button"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <Toaster position="top-right" />
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
                onComplete();
              }
            }}
            className="flex items-center gap-2 text-dark-300 hover:text-plasma-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Exit Exam
          </button>
          <div className="plasma-card px-4 py-2 flex items-center gap-2">
            <Clock className="w-5 h-5 text-plasma-400" />
            <span className="text-white">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="plasma-card"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-plasma-400">{subject}</h2>
              <p className="text-dark-300">
                Question {currentQuestion + 1} of {questions.length}
              </p>
            </div>

            <p className="text-xl text-white mb-6">{questions[currentQuestion].text}</p>

            <div className="space-y-4">
              {questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAnswer(index)}
                  className={`w-full p-4 rounded-lg transition-all duration-200 ${
                    selectedAnswer === index
                      ? 'plasma-button'
                      : 'bg-dark-700/50 text-white hover:bg-dark-600/50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={selectedAnswer === null}
              className={`w-full mt-6 ${
                selectedAnswer === null
                  ? 'bg-dark-600 text-dark-400 cursor-not-allowed'
                  : 'plasma-button'
              }`}
            >
              {currentQuestion + 1 === questions.length ? 'Finish Exam' : 'Next Question'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}