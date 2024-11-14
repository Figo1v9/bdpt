import React, { useState } from 'react';
import { useStore } from '../store';
import { Subject, Question } from '../types';
import { Trash2, Plus, Save, Edit2, Check, X } from 'lucide-react';

export function AdminDashboard() {
  const { subjects, updateSubjects } = useStore();
  const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0].id);
  const [timeLimit, setTimeLimit] = useState<number>(30);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0
  });
  const [showQuestions, setShowQuestions] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [editedCorrectAnswer, setEditedCorrectAnswer] = useState<number>(0);

  const currentSubject = subjects.find(s => s.id === selectedSubject);

  const handleAddQuestion = () => {
    if (!newQuestion.text || newQuestion.options.some(opt => !opt)) {
      alert('يرجى ملء جميع الحقول');
      return;
    }

    const updatedSubjects = subjects.map(subject => {
      if (subject.id === selectedSubject) {
        return {
          ...subject,
          questions: [
            ...subject.questions,
            {
              id: Math.random().toString(36).substr(2, 9),
              ...newQuestion
            }
          ],
          timeLimit
        };
      }
      return subject;
    });
    updateSubjects(updatedSubjects);
    setNewQuestion({
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    });
  };

  const handleDeleteQuestion = (questionId: string) => {
    const updatedSubjects = subjects.map(subject => {
      if (subject.id === selectedSubject) {
        return {
          ...subject,
          questions: subject.questions.filter(q => q.id !== questionId)
        };
      }
      return subject;
    });
    updateSubjects(updatedSubjects);
  };

  const handleEditCorrectAnswer = (questionId: string) => {
    const question = currentSubject?.questions.find(q => q.id === questionId);
    if (question) {
      setEditingQuestion(questionId);
      setEditedCorrectAnswer(question.correctAnswer);
    }
  };

  const handleSaveCorrectAnswer = (questionId: string) => {
    const updatedSubjects = subjects.map(subject => {
      if (subject.id === selectedSubject) {
        return {
          ...subject,
          questions: subject.questions.map(q => {
            if (q.id === questionId) {
              return {
                ...q,
                correctAnswer: editedCorrectAnswer
              };
            }
            return q;
          })
        };
      }
      return subject;
    });
    updateSubjects(updatedSubjects);
    setEditingQuestion(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8">
        <h2 className="text-2xl font-bold text-center mb-6">لوحة التحكم</h2>
        
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">اختر المادة</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600"
                dir="rtl"
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-32">
              <label className="block text-sm font-medium mb-2">الوقت (دقائق)</label>
              <input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600"
                dir="rtl"
                min="1"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">الأسئلة ({currentSubject?.questions.length || 0})</h3>
            <button
              onClick={() => setShowQuestions(!showQuestions)}
              className="text-purple-400 hover:text-purple-300"
            >
              {showQuestions ? 'إخفاء الأسئلة' : 'عرض الأسئلة'}
            </button>
          </div>

          {showQuestions && currentSubject?.questions.map((question, qIndex) => (
            <div key={question.id} className="bg-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <span className="font-medium">سؤال {qIndex + 1}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditCorrectAnswer(question.id)}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p>{question.text}</p>
              <div className="grid grid-cols-2 gap-2">
                {question.options.map((option, oIndex) => (
                  <div
                    key={oIndex}
                    className={`p-2 rounded relative ${
                      editingQuestion === question.id
                        ? editedCorrectAnswer === oIndex
                          ? 'bg-purple-600/20 border border-purple-500'
                          : 'bg-gray-600 hover:bg-gray-500 cursor-pointer'
                        : question.correctAnswer === oIndex
                        ? 'bg-purple-600/20 border border-purple-500'
                        : 'bg-gray-600'
                    }`}
                    onClick={() => {
                      if (editingQuestion === question.id) {
                        setEditedCorrectAnswer(oIndex);
                      }
                    }}
                  >
                    {option}
                    {question.correctAnswer === oIndex && !editingQuestion && (
                      <span className="absolute top-2 left-2 text-green-500">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {editingQuestion === question.id && (
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setEditingQuestion(null)}
                    className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => handleSaveCorrectAnswer(question.id)}
                    className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-700"
                  >
                    حفظ
                  </button>
                </div>
              )}
            </div>
          ))}

          <div className="space-y-4 bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">إضافة سؤال جديد</h3>
            <input
              value={newQuestion.text}
              onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
              className="w-full px-4 py-2 rounded-md bg-gray-600 border border-gray-500 focus:border-purple-500"
              placeholder="نص السؤال"
              dir="rtl"
            />

            {newQuestion.options.map((option, index) => (
              <div key={index} className="flex gap-4">
                <input
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...newQuestion.options];
                    newOptions[index] = e.target.value;
                    setNewQuestion({ ...newQuestion, options: newOptions });
                  }}
                  className="flex-1 px-4 py-2 rounded-md bg-gray-600 border border-gray-500 focus:border-purple-500"
                  placeholder={`الخيار ${index + 1}`}
                  dir="rtl"
                />
                <button
                  type="button"
                  onClick={() => setNewQuestion({ ...newQuestion, correctAnswer: index })}
                  className={`px-4 py-2 rounded-md ${
                    newQuestion.correctAnswer === index
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  صحيح
                </button>
              </div>
            ))}

            <button
              onClick={handleAddQuestion}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة السؤال
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}