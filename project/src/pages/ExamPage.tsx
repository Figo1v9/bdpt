import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useQuestionStore } from '../stores/questionStore';
import { socketService } from '../services/socket';

export default function ExamPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(3600);
  const { questions } = useQuestionStore();

  const subjectQuestions = questions.filter(q => q.subjectId === subjectId);

  useEffect(() => {
    // Listen for new questions
    socketService.onQuestionAdded((question) => {
      if (question.subjectId === subjectId) {
        // If the new question is for the current subject, update the answers array
        setAnswers(prev => [...prev, -1]);
      }
    });

    return () => {
      socketService.disconnect();
    };
  }, [subjectId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAnswer = (choiceIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = choiceIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    // Here we would save the exam results to the database
    navigate('/dashboard');
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (subjectQuestions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold">No questions available</h2>
          <p className="mt-4">Please wait for the administrator to add questions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Exam in Progress</h2>
          <div className="flex items-center space-x-2 text-xl">
            <Clock size={24} />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        {subjectQuestions[currentQuestion] && (
          <>
            <h3 className="text-xl mb-4">
              Question {currentQuestion + 1} of {subjectQuestions.length}
            </h3>
            <p className="text-lg mb-6">{subjectQuestions[currentQuestion].text}</p>
            <div className="space-y-4">
              {subjectQuestions[currentQuestion].choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className={`w-full text-left p-4 rounded-lg transition-colors ${
                    answers[currentQuestion] === index
                      ? 'bg-purple-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {choice}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="flex justify-between mt-8">
          <button
            onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="px-6 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50"
          >
            Previous
          </button>
          {currentQuestion === subjectQuestions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={() =>
                setCurrentQuestion((prev) =>
                  Math.min(subjectQuestions.length - 1, prev + 1)
                )
              }
              className="px-6 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}