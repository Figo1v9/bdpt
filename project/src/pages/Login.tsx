import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

interface LoginForm {
  name: string;
}

export function Login() {
  const { register, handleSubmit } = useForm<LoginForm>();
  const navigate = useNavigate();
  const addStudent = useStore((state) => state.addStudent);

  const onSubmit = (data: LoginForm) => {
    addStudent(data.name);
    navigate('/subjects');
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8">
        <h2 className="text-2xl font-bold text-center mb-6">تسجيل الدخول</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">اسم الطالب</label>
            <input
              {...register('name', { required: true })}
              className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              placeholder="ادخل اسمك"
              dir="rtl"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition duration-200"
          >
            دخول
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/admin')}
            className="text-purple-400 hover:text-purple-300 text-sm"
          >
            دخول كمسؤول
          </button>
        </div>
      </div>
    </div>
  );
}