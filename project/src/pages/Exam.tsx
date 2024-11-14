import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { Timer } from '../components/Timer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { TopScores } from '../components/TopScores';
import { Check, X, AlertTriangle } from 'lucide-react';

export function Exam() {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const { subjects, currentStudent, addExamResult, getTopScores } = useStore();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [topScores, setTopScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subject = subjects.find((s) => s.id === subjectId);

  useEffect(() => {
    const loadTopScores = async () => {
      if (subjectId && isSubmitted) {
        const scores = await getTopScores(subjectId);
        setTopScores(scores);
      }
    };
    loadTopScores();
  }, [subjectId, isSubmitted, getTopScores]);

  if (!subject || !currentStudent) {
    navigate('/subjects');
    return null;
  }

  const currentQuestion = subject.questions[currentQuestionIndex];

  const handleAnswer = (optionIndex: number) => {
    if (isSubmitted) return;
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);

    // Auto-advance to next question after short delay
    if (currentQuestionIndex < subject.questions.length - 1) {
      setTimeout(() => handleNext(), 500);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < subject.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleTimeUp = useCallback(() => {
    handleSubmit();
  }, []);

  const handleSubmit = async () => {
    if (isSubmitted) return;
    setLoading(true);
    setError(null);

    try {
      let score = 0;
      answers.forEach((answer, index) => {
        if (answer === subject.questions[index].correctAnswer) {
          score++;
        }
      });

      const finalScore = (score / subject.questions.length) * 100;

      await addExamResult({
        subjectId: subject.id,
        score: finalScore,
        date: new Date().toISOString(),
        answers: answers,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        timestamp: Date.now(),
      });

      setIsSubmitted(true);
    } catch (err) {
      setError('حدث خطأ أثناء حفظ النتيجة');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" message="جاري حفظ النتيجة..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/subjects')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-md transition duration-200"
          >
            العودة للمواد
          </button>
        </div>
      </div>
    );
  }

  if (subject.questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">لا توجد أسئلة متاحة</h2>
          <p className="text-gray-400 mb-6">لم يتم إضافة أسئلة لهذه المادة بعد</p>
          <button
            onClick={() => navigate('/subjects')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-md transition duration-200"
          >
            العودة للمواد
          </button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    const score = answers.reduce((acc, answer, index) => {
      return answer === subject.questions[index].correctAnswer ? acc + 1 : acc;
    }, 0);
    const percentage = (score / subject.questions.length) * 100;

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">نتيجة الاختبار</h2>
            <div className={`text-6xl font-bold mb-6 ${
              percentage >= 70 ? 'text-green-500' : 
              percentage >= 50 ? 'text-yellow-500' : 
              'text-red-500'
            }`}>
              {percentage.toFixed(1)}%
            </div>
            <p className="text-xl mb-6">
              الإجابات الصحيحة: {score} من {subject.questions.length}
            </p>
          </div>

          <div className="space-y-8">
            {subject.questions.map((question, qIndex) => (
              <div key={qIndex} className="bg-gray-700 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold">سؤال {qIndex + 1}</h3>
                  {answers[qIndex] === question.correctAnswer ? (
                    <span className="flex items-center text-green-500">
                      <Check className="w-5 h-5 mr-1" />
                      إجابة صحيحة
                    </span>
                  ) : (
                    <span className="flex items-center text-red-500">
                      <X className="w-5 h-5 mr-1" />
                      إجابة خاطئة
                    </span>
                  )}
                </div>
                <p className="text-lg mb-4">{question.text}</p>
                <div className="space-y-3">
                  {question.options.map((option, oIndex) => (
                    <div
                      key={oIndex}
                      className={`p-4 rounded-lg ${
                        oIndex === question.correctAnswer
                          ? 'bg-green-500/20 border border-green-500'
                          : oIndex === answers[qIndex]
                          ? 'bg-red-500/20 border border-red-500'
                          : 'bg-gray-600'
                      }`}
                    >
                      {option}
                      {oIndex === question.correctAnswer && (
                        <span className="text-green-500 text-sm mr-2">(الإجابة الصحيحة)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/subjects')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-md transition duration-200"
            >
              العودة للمواد
            </button>
          </div>
        </div>

        {topScores.length > 0 && (
          <TopScores scores={topScores} subjectName={subject.name} />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">{subject.name}</h2>
          <Timer minutes={subject.timeLimit} onTimeUp={handleTimeUp} />
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-400">
              سؤال {currentQuestionIndex + 1} من {subject.questions.length}
            </span>
            <div className="h-2 flex-1 mx-4 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / subject.questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <p className="text-xl mb-6">{currentQuestion.text}</p>

          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className={`w-full text-right p-4 rounded-lg transition duration-200 ${
                  answers[currentQuestionIndex] === index
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            السابق
          </button>
          
          {currentQuestionIndex === subject.questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 rounded-md bg-purple-600 hover:bg-purple-700"
            >
              إنهاء الاختبار
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2 rounded-md bg-purple-600 hover:bg-purple-700"
            >
              التالي
            </button>
          )}
        </div>
      </div>
    </div>
  );
}