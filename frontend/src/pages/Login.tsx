import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { translations } from '../i18n/translations';
import { Languages, Moon, Sun } from 'lucide-react';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState('');
  const setToken = useAuthStore((state) => state.setToken);
  const navigate = useNavigate();
  const { language, setLanguage, theme, toggleTheme } = useSettingsStore();
  const t = translations[language];

  const onSubmit = async (data: any) => {
    try {
      const res = await api.post('/auth/login', data);
      setToken(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.msg || t.loginFailed);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors relative">
      <div className="absolute top-4 right-4 flex items-center gap-4">
        <button 
            onClick={toggleTheme} 
            className="flex items-center gap-1 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button 
            onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')} 
            className="flex items-center gap-1 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600"
        >
          <Languages size={18} /> {language.toUpperCase()}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md w-full max-w-md border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">{t.welcomeBack}</h2>
        {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.email}</label>
            <input
              {...register('email', { required: true })}
              type="email"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {errors.email && <span className="text-red-500 text-xs">{t.emailRequired}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.password}</label>
            <input
              {...register('password', { required: true })}
              type="password"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {errors.password && <span className="text-red-500 text-xs">{t.passwordRequired}</span>}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            {t.login}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          {t.dontHaveAccount} <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline">{t.register}</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
