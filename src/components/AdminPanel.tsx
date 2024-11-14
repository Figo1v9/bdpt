
// file: components/AdminPanel.tsx
import React, { useState, useEffect } from 'react';
import { PlusCircle, ArrowLeft, Trash2, Search, CheckCircle2, Loader2 } from 'lucide-react';
import { Question } from '../types';
import { questionsApi } from '../lib/db';

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
      alert('Failed to load questions');
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
      alert('Please fill in all fields');
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
        await loadQuestions();
        setNewQuestion({
          text: '',
          subject: selectedSubject,
          options: ['', '', '', ''],
          correctAnswer: 0,
          explanation: ''
        });
        alert('Question added successfully');
      }
    } catch (error) {
      alert('Failed to add question');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const success = await questionsApi.deleteQuestion(id);
      if (success) {
        await loadQuestions();
        alert('Question deleted successfully');
      }
    } catch (error) {
      alert('Failed to delete question');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
            Logout
          </button>
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subject Selection and Search */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-4">Select Subject</h3>
              <div className="space-y-2">
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => setSelectedSubject(subject)}
                    className={`w-full p-3 rounded-lg transition-all duration-200 ${
                      selectedSubject === subject
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Question Form and List */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow">
              {/* Add New Question Form */}
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">Add New Question</h3>
                <div className="space-y-4">
                  <textarea
                    value={newQuestion.text}
                    onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
                    placeholder="Question text"
                    className="w-full p-3 border rounded-lg"
                    rows={3}
                  />

                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <input
                        type="radio"
                        checked={newQuestion.correctAnswer === index}
                        onChange={() => setNewQuestion({...newQuestion, correctAnswer: index})}
                        className="w-5 h-5"
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
                        className="w-full p-3 border rounded-lg"
                      />
                    </div>
                  ))}

                  <textarea
                    value={newQuestion.explanation}
                    onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                    placeholder="Explanation (optional)"
                    className="w-full p-3 border rounded-lg"
                    rows={2}
                  />

                  <button
                    onClick={handleAddQuestion}
                    className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Add Question
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div>
                <h3 className="text-xl font-bold mb-4">
                  Questions ({filteredQuestions.length})
                </h3>
                <div className="space-y-4">
                  {filteredQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="border rounded-lg p-6"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="text-lg font-medium mb-4">{question.text}</p>
                          <div className="space-y-2">
                            {question.options.map((option, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded-lg ${
                                  idx === question.correctAnswer
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100'
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
                            <p className="mt-4 text-gray-500 text-sm">{question.explanation}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="text-red-500 hover:text-red-600 transition-colors"
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

