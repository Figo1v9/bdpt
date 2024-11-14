import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash, AlertCircle } from 'lucide-react';
import { useQuestionStore } from '../stores/questionStore';
import { socketService } from '../services/socket';

const subjects = [
  { id: 'ba', name: 'Business Administration' },
  { id: 'econ', name: 'Economics' },
  { id: 'acc', name: 'Financial Accounting' },
  { id: 'eng', name: 'English' },
  { id: 'law', name: 'Law' },
];

export function ManageQuestions() {
  const [selectedSubject, setSelectedSubject] = useState('');
  const { questions, addQuestion, removeQuestion } = useQuestionStore();
  const [error, setError] = useState('');
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    choices: ['', '', '', ''],
    correctAnswer: 0,
    timeLimit: 60,
  });

  useEffect(() => {
    socketService.connect();
    
    socketService.onQuestionAdded((question) => {
      console.log('New question received:', question);
    });

    socketService.onError((error) => {
      setError('Connection error: ' + error.message);
    });

    return () => {
      socketService.offQuestionAdded();
      socketService.disconnect();
    };
  }, []);

  const handleAddQuestion = () => {
    setError('');

    if (!selectedSubject) {
      setError('Please select a subject');
      return;
    }

    if (!newQuestion.text.trim()) {
      setError('Question text is required');
      return;
    }

    if (newQuestion.choices.some(choice => !choice.trim())) {
      setError('All choices must be filled');
      return;
    }

    const question = {
      id: Date.now(),
      ...newQuestion,
      subjectId: selectedSubject,
    };

    try {
      addQuestion(question);
      socketService.emitQuestionAdded(question);

      // Reset form
      setNewQuestion({
        text: '',
        choices: ['', '', '', ''],
        correctAnswer: 0,
        timeLimit: 60,
      });
    } catch (err) {
      setError('Failed to add question');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manage Questions</h2>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="input-field max-w-xs"
        >
          <option value="">Select Subject...</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="card">
        <h3 className="text-lg font-medium mb-4">Add New Question</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">
              Question Text
            </label>
            <textarea
              value={newQuestion.text}
              onChange={(e) =>
                setNewQuestion({ ...newQuestion, text: e.target.value })
              }
              className="input-field min-h-[100px]"
              placeholder="Enter your question here..."
            />
          </div>

          {newQuestion.choices.map((choice, index) => (
            <div key={index}>
              <label className="block text-sm font-medium mb-2 text-slate-300">
                Choice {index + 1}
              </label>
              <input
                type="text"
                value={choice}
                onChange={(e) => {
                  const newChoices = [...newQuestion.choices];
                  newChoices[index] = e.target.value;
                  setNewQuestion({ ...newQuestion, choices: newChoices });
                }}
                className="input-field"
                placeholder={`Enter choice ${index + 1}`}
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">
              Correct Answer
            </label>
            <select
              value={newQuestion.correctAnswer}
              onChange={(e) =>
                setNewQuestion({
                  ...newQuestion,
                  correctAnswer: parseInt(e.target.value),
                })
              }
              className="input-field"
            >
              {newQuestion.choices.map((_, index) => (
                <option key={index} value={index}>
                  Choice {index + 1}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">
              Time Limit (seconds)
            </label>
            <input
              type="number"
              value={newQuestion.timeLimit}
              onChange={(e) =>
                setNewQuestion({
                  ...newQuestion,
                  timeLimit: parseInt(e.target.value),
                })
              }
              className="input-field"
              min="30"
              step="30"
            />
          </div>

          <button
            onClick={handleAddQuestion}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium mb-4">Current Questions</h3>
        <div className="space-y-4">
          {questions
            .filter((q) => q.subjectId === selectedSubject)
            .map((question) => (
              <div
                key={question.id}
                className="bg-slate-700/50 p-4 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">{question.text}</p>
                  <button
                    onClick={() => removeQuestion(question.id)}
                    className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                  >
                    <Trash size={18} />
                  </button>
                </div>
                <div className="pl-4 space-y-1">
                  {question.choices.map((choice, index) => (
                    <p
                      key={index}
                      className={
                        index === question.correctAnswer
                          ? 'text-green-400'
                          : 'text-slate-400'
                      }
                    >
                      {index + 1}. {choice}
                    </p>
                  ))}
                </div>
              </div>
            ))}

          {selectedSubject && questions.filter((q) => q.subjectId === selectedSubject).length === 0 && (
            <div className="text-center py-8 text-slate-400">
              No questions added for this subject yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}