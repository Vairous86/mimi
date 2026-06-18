'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BookOpen, Calendar, ArrowRight, Loader2 } from 'lucide-react';

export default function TermsPage() {
  const router = useRouter();
  const params = useParams();
  const year = params.year as string;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('mimi_user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 p-6 sm:p-10">
      <div className="mx-auto max-w-4xl">
        
        {/* Breadcrumb / Back button */}
        <button
          onClick={() => router.push('/years')}
          className="flex items-center gap-2 text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 font-bold mb-8 cursor-pointer transition-colors"
        >
          <ArrowRight className="h-5 w-5" />
          <span>العودة للسنوات الدراسية</span>
        </button>

        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-4 py-2 text-sm font-extrabold mb-4 border border-blue-100 dark:border-blue-950/20">
            <Calendar className="h-4 w-4" />
            <span>السنة الدراسية {year}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">اختر الفصل الدراسي (الترم)</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">يرجى تحديد الترم لعرض بيانات الطلاب والامتحانات والماليات</p>
        </div>

        {/* Terms grid */}
        <div className="grid gap-8 sm:grid-cols-2">
          
          {/* Term 1 */}
          <div
            onClick={() => router.push(`/years/${year}/terms/1/dashboard`)}
            className="flex flex-col items-center justify-between p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-2xl hover:-translate-y-1 cursor-pointer transition-all duration-300 group"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 mb-6 shadow-inner group-hover:scale-110 transition-all duration-300">
              <BookOpen className="h-10 w-10" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white">الترم الأول</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                عرض وإدارة الحضور، الدرجات والمدفوعات الخاصة بالفصل الدراسي الأول
              </p>
            </div>
            <div className="mt-8 flex items-center justify-center gap-2 w-full rounded-2xl bg-slate-50 dark:bg-zinc-950 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white font-bold py-3.5 px-4 transition-all">
              <span>دخول النظام</span>
            </div>
          </div>

          {/* Term 2 */}
          <div
            onClick={() => router.push(`/years/${year}/terms/2/dashboard`)}
            className="flex flex-col items-center justify-between p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-2xl hover:-translate-y-1 cursor-pointer transition-all duration-300 group"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 mb-6 shadow-inner group-hover:scale-110 transition-all duration-300">
              <BookOpen className="h-10 w-10" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white">الترم الثاني</h3>
              <p className="text-sm text-violet-650 dark:text-zinc-400 mt-2">
                عرض وإدارة الحضور، الدرجات والمدفوعات الخاصة بالفصل الدراسي الثاني
              </p>
            </div>
            <div className="mt-8 flex items-center justify-center gap-2 w-full rounded-2xl bg-slate-50 dark:bg-zinc-950 text-violet-600 dark:text-violet-400 group-hover:bg-violet-600 group-hover:text-white font-bold py-3.5 px-4 transition-all">
              <span>دخول النظام</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
