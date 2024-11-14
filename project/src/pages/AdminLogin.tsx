import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

interface AdminLoginForm {
  username: string;
  password: string;
}

export function AdminLogin() {
  const { register, handleSubmit, setError, formState: { errors } } = useForm<AdminLoginForm>();
  const navigate = useNavigate();

  const onSubmit = (data: AdminLoginForm) => {
    if (data.username === 'admin' && data.password === 'admin123') {
      navigate('/admin/dashboard');
    } else {
      setError('root', {
        message: 'اسم المستخدم او كلمة المرور غير صحيحة'
      });
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8">
        <h2 className="text-2xl font-bold text-center mb-6">دخول المسؤول</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">اسم المستخدم</label>
            <input
              {...register('username', { required: true })}
              className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              dir="rtl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">كلمة المرور</label>
            <input
              type="password"
              {...register('password', { required: true })}
              className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              dir="rtl"
            />
          </div>
          {errors.root && (
            <p className="text-red-500 text-sm text-center">{errors.root.message}</p>
          )}
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition duration-200"
          >
            دخول
          </button>
        </form>
      </div>
    </div>
  );
}