import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, ArrowLeft, Trash2, Search, CheckCircle2, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { Question } from '../types';
import { questionsApi } from '../lib/supabase';

export default function AdminPanel() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Business Management');
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    subject: 'Business Management',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  });

  const subjects = [
    'Business Management',
    'Economics',
    'Financial Accounting',
    'English',
    'Law'
  ];

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const fetchedQuestions = await questionsApi.getQuestions();
      setQuestions(fetchedQuestions);
    } catch (error) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.subject === selectedSubject &&
    (q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.options.some(opt => opt.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleAddQuestion = async () => {
    if (!newQuestion.text || newQuestion.options.some(opt => !opt)) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const addedQuestion = await questionsApi.addQuestion({
        text: newQuestion.text,
        subject: selectedSubject,
        options: newQuestion.options,
        correctAnswer: newQuestion.correctAnswer,
        explanation: newQuestion.explanation
      });

      if (addedQuestion) {
        setQuestions([addedQuestion, ...questions]);
        setNewQuestion({
          text: '',
          subject: selectedSubject,
          options: ['', '', '', ''],
          correctAnswer: 0,
          explanation: ''
        });
        toast.success('Question added successfully');
      }
    } catch (error) {
      toast.error('Failed to add question');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const success = await questionsApi.deleteQuestion(id);
      if (success) {
        setQuestions(questions.filter(q => q.id !== id));
        toast.success('Question deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete question');
    }
  };

  const handleLogout = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-plasma-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-dark-300 hover:text-plasma-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Logout
          </button>
          <h2 className="text-2xl font-bold text-plasma-400">Admin Dashboard</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subject Selection and Search */}
          <div className="lg:col-span-1">
            <div className="plasma-card p-6">
              <h3 className="text-xl font-bold text-white mb-4">Select Subject</h3>
              <div className="space-y-2">
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => setSelectedSubject(subject)}
                    className={`w-full p-3 rounded-lg transition-all duration-200 ${
                      selectedSubject === subject
                        ? 'plasma-button'
                        : 'bg-dark-700/50 text-dark-300 hover:bg-dark-600/50'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-dark-400" />
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="plasma-input pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Question Form and List */}
          <div className="lg:col-span-2">
            <div className="plasma-card p-6">
              {/* Add New Question Form */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-4">Add New Question</h3>
                <div className="space-y-4">
                  <textarea
                    value={newQuestion.text}
                    onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
                    placeholder="Question text"
                    className="plasma-input"
                    rows={3}
                  />

                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <input
                        type="radio"
                        checked={newQuestion.correctAnswer === index}
                        onChange={() => setNewQuestion({...newQuestion, correctAnswer: index})}
                        className="w-5 h-5 text-plasma-500 focus:ring-plasma-500"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...newQuestion.options];
                          newOptions[index] = e.target.value;
                          setNewQuestion({...newQuestion, options: newOptions});
                        }}
                        placeholder={`Option ${index + 1}`}
                        className="plasma-input"
                      />
                    </div>
                  ))}

                  <textarea
                    value={newQuestion.explanation}
                    onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                    placeholder="Explanation (optional)"
                    className="plasma-input"
                    rows={2}
                  />

                  <button
                    onClick={handleAddQuestion}
                    className="plasma-button w-full flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Add Question
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-4">
                  Questions ({filteredQuestions.length})
                </h3>
                {filteredQuestions.map((question, index) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="plasma-card"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="text-lg font-medium mb-4">{question.text}</p>
                          <div className="space-y-2">
                            {question.options.map((option, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded-lg ${
                                  idx === question.correctAnswer
                                    ? 'bg-green-500/10 text-green-400'
                                    : 'bg-dark-700/50'
                                }`}
                              >
                                {option}
                                {idx === question.correctAnswer && (
                                  <CheckCircle2 className="inline-block ml-2 w-4 h-4" />
                                )}
                              </div>
                            ))}
                          </div>
                          {question.explanation && (
                            <p className="mt-4 text-dark-300 text-sm">{question.explanation}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}