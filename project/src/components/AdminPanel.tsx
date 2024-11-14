import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, ArrowLeft, Trash2, Search, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Question } from '../types';
import { storage } from '../lib/storage';

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
      const fetchedQuestions = await storage.questions.getQuestions();
      setQuestions(fetchedQuestions);
    } catch (error) {
      toast.error('Failed to load questions. Please try again.');
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
    if (!newQuestion.text.trim()) {
      toast.error('Please enter a question');
      return;
    }

    if (newQuestion.options.some(opt => !opt.trim())) {
      toast.error('Please fill in all options');
      return;
    }

    try {
      const addedQuestion = await storage.questions.addQuestion({
        text: newQuestion.text,
        subject: selectedSubject,
        options: newQuestion.options,
        correctAnswer: newQuestion.correctAnswer,
        explanation: newQuestion.explanation
      });

      if (addedQuestion) {
        await loadQuestions();
        setNewQuestion({
          text: '',
          subject: selectedSubject,
          options: ['', '', '', ''],
          correctAnswer: 0,
          explanation: ''
        });
        toast.success('Question added successfully');
      } else {
        toast.error('Failed to add question');
      }
    } catch (error) {
      toast.error('Failed to add question. Please try again.');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const success = await storage.questions.deleteQuestion(id);
      if (success) {
        await loadQuestions();
        toast.success('Question deleted successfully');
      } else {
        toast.error('Failed to delete question');
      }
    } catch (error) {
      toast.error('Failed to delete question. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-plasma-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 text-dark-300 hover:text-plasma-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Logout
          </button>
          <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
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
                        : 'bg-dark-700/50 text-white hover:bg-dark-600/50'
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
                        className="w-5 h-5 accent-plasma-400"
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
                    className="plasma-button w-full"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <PlusCircle className="w-5 h-5" />
                      Add Question
                    </span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4">
                  Questions ({filteredQuestions.length})
                </h3>
                <div className="space-y-4">
                  {filteredQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="plasma-card p-6"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="text-lg font-medium text-white mb-4">{question.text}</p>
                          <div className="space-y-2">
                            {question.options.map((option, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded-lg ${
                                  idx === question.correctAnswer
                                    ? 'bg-green-500/10 text-green-400'
                                    : 'bg-dark-700/50 text-white'
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
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}