import React, { useState } from 'react';
import { Question } from '../types';
import { saveQuestions, getQuestions } from '../db';
import { PlusCircle, ArrowLeft, Trash2, Edit2, Search, CheckCircle2 } from 'lucide-react';

export default function AdminPanel() {
  const [questions, setQuestions] = useState<Question[]>(getQuestions());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Business Management');
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    subject: 'Business Management',
    options: ['', '', '', ''],
    correctAnswer: 0
  });

  const subjects = [
    'Business Management',
    'Economics',
    'Financial Accounting',
    'English',
    'Law'
  ];

  const filteredQuestions = questions.filter(q => 
    q.subject === selectedSubject &&
    (q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.options.some(opt => opt.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleAddQuestion = () => {
    if (newQuestion.text && newQuestion.options.every(opt => opt)) {
      const question: Question = {
        ...newQuestion,
        id: Date.now().toString()
      };
      const updatedQuestions = [...questions, question];
      setQuestions(updatedQuestions);
      saveQuestions(updatedQuestions);
      setNewQuestion({
        text: '',
        subject: selectedSubject,
        options: ['', '', '', ''],
        correctAnswer: 0
      });
    }
  };

  const handleDeleteQuestion = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
      const updatedQuestions = questions.filter(q => q.id !== id);
      setQuestions(updatedQuestions);
      saveQuestions(updatedQuestions);
    }
  };

  const handleLogout = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-400 hover:text-white transition-colors duration-200"
          >
            <ArrowLeft className="mr-2" />
            تسجيل الخروج
          </button>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
            لوحة التحكم
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subject Selection and Search */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4 text-right">اختر المادة</h3>
              <div className="space-y-2">
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => setSelectedSubject(subject)}
                    className={`w-full text-right p-3 rounded-lg transition-all duration-200 ${
                      selectedSubject === subject
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="البحث عن سؤال..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-right"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Question Form and List */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
              {/* Add New Question Form */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-4 text-right">إضافة سؤال جديد</h3>
                <div className="space-y-4">
                  <textarea
                    value={newQuestion.text}
                    onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
                    placeholder="نص السؤال"
                    className="w-full p-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-right"
                    rows={3}
                    dir="rtl"
                  />

                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <input
                        type="radio"
                        checked={newQuestion.correctAnswer === index}
                        onChange={() => setNewQuestion({...newQuestion, correctAnswer: index})}
                        className="w-5 h-5 text-blue-500 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...newQuestion.options];
                          newOptions[index] = e.target.value;
                          setNewQuestion({...newQuestion, options: newOptions});
                        }}
                        placeholder={`الخيار ${index + 1}`}
                        className="flex-1 p-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-right"
                        dir="rtl"
                      />
                    </div>
                  ))}

                  <button
                    onClick={handleAddQuestion}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transform transition-all duration-200 hover:scale-[1.02]"
                  >
                    <PlusCircle size={20} />
                    إضافة السؤال
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-4 text-right">
                  الأسئلة ({filteredQuestions.length})
                </h3>
                {filteredQuestions.map((q, index) => (
                  <div key={q.id} className="bg-gray-700/50 p-6 rounded-lg border border-gray-600 hover:border-blue-500 transition-all duration-200">
                    <div className="flex justify-between items-start">
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-red-400 hover:text-red-300 transition-colors duration-200"
                      >
                        <Trash2 size={20} />
                      </button>
                      <div className="flex-1 text-right mr-4">
                        <p className="text-white font-medium mb-2">
                          سؤال {index + 1}: {q.text}
                        </p>
                        <div className="space-y-2 mt-3">
                          {q.options.map((opt, idx) => (
                            <div key={idx} className="flex items-center justify-end gap-2">
                              <span className={`text-sm ${idx === q.correctAnswer ? 'text-green-400' : 'text-gray-300'}`}>
                                {opt}
                              </span>
                              {idx === q.correctAnswer && (
                                <CheckCircle2 className="text-green-400" size={16} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}