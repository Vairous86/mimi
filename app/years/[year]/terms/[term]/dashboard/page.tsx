'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import QuickActions from '@/components/QuickActions';
import {
  Users, CalendarCheck, UserMinus, UserX, CircleDollarSign,
  TrendingUp, AlertOctagon, Loader2, ArrowRightLeft, BookOpen, Clock
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const year = params.year as string;
  const term = params.term as string;

  const [user, setUser] = useState<any>(null);
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('mimi_user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(storedUser));

    // Fetch full db
    fetch('https://phpcolour.com/social/social1/mimi/api.php')
      .then(res => res.json())
      .then(data => {
        setDb(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [router, refreshToggle]);

  const handleRefresh = () => {
    setRefreshToggle(prev => !prev);
  };

  if (loading || !db) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-500" />
      </div>
    );
  }

  // Filter students and exams for current year/term
  const yearStudents = (db.students || []).filter((s: any) => s.year === year);
  const termExams = (db.exams || []).filter((e: any) => e.year === year && e.term === term);

  // 1. Total Students
  const totalStudents = yearStudents.length;

  // 2. Attendance Stats - Today (or latest date)
  // Let's find all dates in database for this year/term
  const allAttDates = Array.from(
    new Set(
      yearStudents.flatMap((s: any) => (s.terms[term]?.attendance || []).map((a: any) => a.date.split(' ')[0]))
    )
  ).sort((a: any, b: any) => b.localeCompare(a)) as string[]; // latest first

  const targetDate = (allAttDates[0] as string) || new Date().toISOString().split('T')[0];

  let presentToday = 0;
  let absentToday = 0;
  let excusedToday = 0;

  yearStudents.forEach((s: any) => {
    const attRecord = s.terms[term]?.attendance?.find((a: any) => a.date.startsWith(targetDate));
    if (attRecord) {
      if (attRecord.status === 'present') presentToday++;
      else if (attRecord.status === 'absent') absentToday++;
      else if (attRecord.status === 'excused') excusedToday++;
    } else if (allAttDates.length > 0) {
      // If records exist but student doesn't have one on this date, assume absent/not registered
      absentToday++;
    }
  });

  // 3. Financial Stats (Subscriptions & Booklets)
  let totalPaymentsCollected = 0;
  let pendingPayments = 0;

  yearStudents.forEach((s: any) => {
    // Subscription payments
    const payments = s.terms[term]?.payments || [];
    payments.forEach((p: any) => {
      if (p.status === 'paid') {
        if (p.confirmed) {
          totalPaymentsCollected += p.amount;
        } else {
          pendingPayments += p.amount;
        }
      }
    });

    // Material payments
    const materials = s.terms[term]?.materials || [];
    materials.forEach((m: any) => {
      if (m.status === 'paid') {
        if (m.confirmed) {
          totalPaymentsCollected += m.price;
        } else {
          pendingPayments += m.price;
        }
      }
    });
  });

  // 4. Top Performing Students
  const computedStudents = yearStudents.map((s: any) => {
    const sExams = s.terms[term]?.exams || [];
    if (sExams.length === 0) return { ...s, scoreAverage: 0 };
    
    let totalScore = 0;
    let totalMax = 0;
    sExams.forEach((eRecord: any) => {
      const examObj = termExams.find((e: any) => e.id === eRecord.examId);
      if (examObj) {
        totalScore += eRecord.score;
        totalMax += examObj.maxScore;
      }
    });

    const average = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
    return { ...s, scoreAverage: average };
  });

  const topStudents = [...computedStudents]
    .filter(s => s.terms[term]?.exams?.length > 0)
    .sort((a: any, b: any) => b.scoreAverage - a.scoreAverage)
    .slice(0, 5);

  // 5. Most Absent Students
  const mostAbsentStudents = yearStudents.map((s: any) => {
    const absenceCount = (s.terms[term]?.attendance || []).filter((a: any) => a.status === 'absent').length;
    return { ...s, absenceCount };
  })
    .sort((a: any, b: any) => b.absenceCount - a.absenceCount)
    .slice(0, 5);

  // 6. Chart Data - Monthly Revenue (mocked monthly stats for rendering bars)
  // Let's count payments for each month
  const monthsList = ['سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو'];
  const monthSums = monthsList.map(month => {
    let sum = 0;
    yearStudents.forEach((s: any) => {
      const p = s.terms[term]?.payments?.find((pay: any) => pay.month === month);
      if (p && p.status === 'paid' && p.confirmed) {
        sum += p.amount;
      }
    });
    return { month, amount: sum };
  });

  const maxMonthAmount = Math.max(...monthSums.map(m => m.amount), 500); // prevent division by zero

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans">
      
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        
        {/* Welcome Section */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">لوحة التحكم والإحصائيات</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              متابعة مباشرة لأداء الطلاب والتحصيل المالي والغياب لـ {term === '1' ? 'الترم الأول' : 'الترم الثاني'} ({year})
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <Clock className="h-4 w-4" />
              <span>آخر تحديث: {new Date().toLocaleTimeString('ar-EG')}</span>
            </span>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          
          {/* Card 1: Total Students */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-5 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-inner">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <span className="block text-xs font-bold text-zinc-400 dark:text-zinc-550">إجمالي الطلاب</span>
              <span className="text-3xl font-black text-zinc-900 dark:text-white mt-0.5">{totalStudents}</span>
            </div>
          </div>

          {/* Card 2: Attendance Today */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-5 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 shadow-inner">
              <CalendarCheck className="h-7 w-7" />
            </div>
            <div>
              <span className="block text-xs font-bold text-zinc-400 dark:text-zinc-550">حضور المحاضرة الأخيرة</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black text-zinc-900 dark:text-white">{presentToday}</span>
                <span className="text-xs text-zinc-400 font-medium">من {totalStudents}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Absences & Excuses Today */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-5 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shadow-inner">
              <UserMinus className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <span className="block text-xs font-bold text-zinc-400 dark:text-zinc-555">غياب / أذونات الأخيرة</span>
              <div className="flex items-center gap-3 mt-1.5 text-sm font-bold">
                <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-lg">غائب: {absentToday}</span>
                <span className="text-amber-600 dark:text-amber-450 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-lg">إذن: {excusedToday}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Financial Collections */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-5 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 shadow-inner">
              <CircleDollarSign className="h-7 w-7" />
            </div>
            <div>
              <span className="block text-xs font-bold text-zinc-400 dark:text-zinc-550">إجمالي المدفوعات المستلمة</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-450">{totalPaymentsCollected} ج.م</span>
              </div>
              {pendingPayments > 0 && (
                <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-extrabold mt-0.5">
                  قيد التسليم: {pendingPayments} ج.م
                </span>
              )}
            </div>
          </div>

        </section>

        {/* Dynamic Interactive Panel: Graph & Top performers */}
        <div className="grid gap-8 lg:grid-cols-3 mb-8">
          
          {/* Revenue Chart Section */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-6">مخطط التحصيل الشهري للاشتراكات (ج.م)</h3>
            
            {/* SVG Native Chart */}
            <div className="relative h-64 flex items-end gap-3.5 pt-8 border-b border-zinc-150 dark:border-zinc-800 px-4">
              {monthSums.map((m, index) => {
                const barHeightPercent = (m.amount / maxMonthAmount) * 100;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-1 bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {m.amount} ج.م
                    </div>
                    
                    {/* Bar */}
                    <div
                      style={{ height: `${Math.max(barHeightPercent, 4)}%` }}
                      className="w-full rounded-t-xl bg-gradient-to-t from-blue-600 to-blue-450 hover:from-blue-500 hover:to-blue-400 transition-all duration-300 shadow-lg shadow-blue-500/10 cursor-pointer"
                    />
                    
                    {/* Month Label */}
                    <span className="text-[10px] font-black text-zinc-400 mt-2 truncate w-full text-center">
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Students Rank */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6 text-zinc-900 dark:text-white">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <h3 className="text-lg font-black">الطلاب الأعلى نسبة</h3>
              </div>

              <div className="space-y-4">
                {topStudents.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-12">لا توجد امتحانات أو درجات مرصودة حالياً</p>
                ) : (
                  topStudents.map((s, index) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg font-black text-xs ${
                          index === 0 ? 'bg-amber-100 text-amber-700' :
                          index === 1 ? 'bg-zinc-200 text-zinc-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          #{index + 1}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate max-w-[140px]">{s.name}</h4>
                          <span className="text-[10px] text-zinc-400 font-semibold">كود: {s.id}</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-450">{s.scoreAverage.toFixed(1)}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Row 2: Most absent students & Lecture Logs */}
        <div className="grid gap-8 lg:grid-cols-2">
          
          {/* Most Absent Students */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-zinc-900 dark:text-white">
              <AlertOctagon className="h-5 w-5 text-rose-500" />
              <h3 className="text-lg font-black">الطلاب الأكثر غياباً</h3>
            </div>

            <div className="space-y-4">
              {mostAbsentStudents.length === 0 || mostAbsentStudents.every((s: any) => s.absenceCount === 0) ? (
                <p className="text-xs text-zinc-400 text-center py-12">لا توجد حالات غياب مرصودة للطلاب</p>
              ) : (
                mostAbsentStudents.map((s: any, index: number) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{s.name}</h4>
                      <span className="text-[10px] text-zinc-400 font-semibold">تلفون ولي الأمر: {s.guardianPhone || 'غير مسجل'}</span>
                    </div>
                    <span className="text-xs font-black text-rose-600 bg-rose-50 dark:bg-rose-950/20 py-1 px-3 rounded-full">
                      غاب {s.absenceCount} مرات
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Info & Guidelines */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-4">تعليمات وإدارة الأكاديمية</h3>
              <p className="text-xs text-zinc-500 leading-6">
                يرجى استخدام الأزرار السريعة بالأسفل لإتمام العمليات بسرعة مثل رصد حضور اليوم، إضافة طالب جديد، طباعة بطاقة العضوية، أو تصدير التقارير.
              </p>
              
              <div className="mt-6 space-y-3.5 text-xs font-bold text-zinc-700 dark:text-zinc-350">
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>التحصيل المالي المسجل من المساعد يتم الاحتفاظ به "قيد التسليم" حتى يوافق المعلم.</span>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>التقارير تحتوي على خيار للطباعة المباشرة لملفات الورق أو حفظها كـ PDF بنسق احترافي.</span>
                </div>
              </div>
            </div>
            
            {/* Quick Stats overview */}
            <div className="mt-6 pt-6 border-t border-zinc-150 dark:border-zinc-800 flex justify-between items-center text-xs text-zinc-450 dark:text-zinc-500 font-medium">
              <span>إجمالي الامتحانات المفعلة: {termExams.length}</span>
              <span>تاريخ التشغيل: {targetDate}</span>
            </div>
          </div>

        </div>

      </main>

      {/* Floating Action Menu (FAB) */}
      <QuickActions onRefresh={handleRefresh} />

    </div>
  );
}
