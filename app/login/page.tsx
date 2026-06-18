'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Lock, User as UserIcon, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If user is already logged in, redirect to years selection
    const storedUser = localStorage.getItem('mimi_user');
    if (storedUser) {
      router.push('/years');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('https://phpcolour.com/social/social1/mimi/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username,
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'فشل تسجيل الدخول');
      }

      // Store in localStorage
      localStorage.setItem('mimi_user', JSON.stringify(data));
      router.push('/years');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-tr from-slate-100 via-slate-50 to-blue-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-slate-900 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white/80 dark:bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-xl border border-white/20 dark:border-zinc-800/50">
        
        {/* Header/Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 dark:bg-blue-500 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-500/15 mb-4 transform hover:rotate-12 transition-transform duration-300">
            <GraduationCap className="h-9 w-9" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            أكاديمية ميمي
          </h1>
          <p className="mt-2 text-sm text-zinc-550 dark:text-zinc-400">
            نظام إدارة المجموعات والطلاب والماليات الذكي
          </p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="flex items-center gap-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 p-4 text-sm text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-955/50 mb-6 animate-shake">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-350 mb-2">
              اسم المستخدم
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-400">
                <UserIcon className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white/50 dark:bg-zinc-950/50 py-3.5 pr-11 pl-4 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-350 mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white/50 dark:bg-zinc-955/50 py-3.5 pr-11 pl-4 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-extrabold py-4 px-6 shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                جاري التحميل...
              </>
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>

        {/* Parent Portal Redirect Divider & Button */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-zinc-250 dark:border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-400 dark:text-zinc-500 font-bold">أو كـ ولي أمر</span>
          </div>
        </div>

        <button
          onClick={() => router.push('/parent')}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-zinc-205 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-950/30 text-zinc-700 dark:text-zinc-300 font-extrabold py-3.5 px-6 cursor-pointer transition-all shadow-sm"
        >
          <span>بوابة أولياء الأمور (متابعة الطلاب)</span>
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>

        {/* Hints */}
        <div className="mt-8 text-center text-xs text-zinc-400 dark:text-zinc-500 space-y-1">
          <p>حساب المعلم: mimi / mimi123</p>
          <p>حساب المساعد: assistant / assistant123</p>
        </div>

      </div>
    </div>
  );
}
