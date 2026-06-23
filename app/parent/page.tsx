'use client';

import React, { useState } from 'react';
import CircularProgress from '@/components/CircularProgress';
import {
  Search, GraduationCap, Phone, Users, CalendarCheck2, CreditCard,
  BookOpen, ClipboardList, Loader2, AlertCircle, ArrowRight,
  Award, Sparkles, CheckCircle2, UserX, UserCheck
} from 'lucide-react';

type TabType = 'attendance' | 'payments' | 'materials' | 'exams';

export default function ParentPortalPage() {
  const [studentCode, setStudentCode] = useState('');
  const [student, setStudent] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('attendance');
  const [currentTerm, setCurrentTerm] = useState<'1' | '2'>('1');

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode.trim()) return;

    setLoading(true);
    setError('');
    setStudent(null);

    try {
      const res = await fetch('https://phpcolour.com/social/social1/mimi/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'parentQuery',
          studentId: studentCode.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'حدث خطأ ما أثناء الاستعلام عن البيانات');
      } else {
        setStudent(data.student);
        setExams(data.exams || []);
        // Determine active term based on available records if any
        if (data.student.terms['2']?.attendance.length > 0 || data.student.terms['2']?.exams.length > 0) {
          setCurrentTerm('2');
        } else {
          setCurrentTerm('1');
        }
      }
    } catch (err) {
      console.error(err);
      setError('تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  const getGradeName = (g: number) => {
    if (g === 1) return 'الصف الأول الإعدادي';
    if (g === 2) return 'الصف الثاني الإعدادي';
    return 'الصف الثالث الإعدادي';
  };

  // Stats Calculations
  const termData = student?.terms[currentTerm] || { attendance: [], payments: [], materials: [], exams: [] };

  // 1. Attendance stats
  const totalAtt = termData.attendance.length;
  const presentAtt = termData.attendance.filter((a: any) => a.status === 'present').length;
  const attendancePercentage = totalAtt > 0 ? (presentAtt / totalAtt) * 100 : 100;

  // 2. Exam stats
  let totalScoreEarned = 0;
  let totalScoreMax = 0;
  const sExams = termData.exams || [];
  sExams.forEach((exRecord: any) => {
    const examObj = exams.find((e: any) => e.id === exRecord.examId);
    if (examObj) {
      totalScoreEarned += exRecord.score;
      totalScoreMax += examObj.maxScore;
    }
  });
  const overallExamPercentage = totalScoreMax > 0 ? (totalScoreEarned / totalScoreMax) * 100 : 0;

  // 3. Payment stats
  const totalPayments = termData.payments.length;
  const paidPayments = termData.payments.filter((p: any) => p.status === 'paid').length;

  // 4. Materials stats
  const totalMaterials = termData.materials.length;
  const paidMaterials = termData.materials.filter((m: any) => m.status === 'paid').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans text-right" dir="rtl">
      
      {/* Top Navbar */}
      <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 py-4.5 px-6 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <GraduationCap className="h-5.5 w-5.5" />
            </div>
            <div>
              <span className="block font-black text-sm text-zinc-900 dark:text-white">أكاديمية مستر محمد حامد التعليمية</span>
              <span className="block text-[10px] text-zinc-400 font-bold">بوابة متابعة مستوى الطلاب لأولياء الأمور</span>
            </div>
          </div>
          {student && (
            <button
              onClick={() => {
                setStudent(null);
                setStudentCode('');
                setError('');
              }}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 rounded-xl cursor-pointer transition-all"
            >
              <ArrowRight className="h-4 w-4" />
              <span>بحث عن طالب آخر</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Form State (No student loaded) */}
        {!student ? (
          <div className="max-w-lg mx-auto py-12 sm:py-20 flex flex-col items-center justify-center">
            
            {/* Visual Header */}
            <div className="relative mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-750 text-white shadow-xl shadow-blue-500/10">
              <Sparkles className="absolute -top-1.5 -right-1.5 h-6 w-6 text-amber-400 animate-pulse" />
              <GraduationCap className="h-10 w-10" />
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white leading-tight">
                مرحباً بكم في بوابة متابعة الطلاب
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-450 mt-2.5 max-w-sm mx-auto leading-relaxed">
                يسرنا تقديم هذه المنصة لمساعدة أولياء الأمور الكرام في تتبع الحضور، درجات الامتحانات والمدفوعات والمستجدات الدراسية.
              </p>
            </div>

            {/* Input Card */}
            <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
              <form onSubmit={handleQuery} className="space-y-5">
                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-start gap-3 text-xs font-bold leading-relaxed">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black text-zinc-650 dark:text-zinc-350 mb-2">
                    كود الطالب التعريفي
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value)}
                      placeholder="ادخل الكود الخاص بابنكم (مثال: 1001)"
                      className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50 py-3.5 pr-11 pl-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-bold"
                      disabled={loading}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-zinc-400">
                      <Search className="h-5 w-5" />
                    </div>
                  </div>
                  <span className="block text-[10px] text-zinc-400 mt-2 font-bold leading-relaxed">
                    * الكود التعريفي يتم تسليمه للطالب من قبل الأكاديمية أو مطبوعاً على بطاقته الذكية.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading || !studentCode.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 px-4 text-sm cursor-pointer shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>جاري البحث والاستعلام...</span>
                    </>
                  ) : (
                    <span>استعلام عن بيانات الطالب</span>
                  )}
                </button>
              </form>
            </div>

          </div>
        ) : (
          /* Dashboard State (Student loaded successfully) */
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Student Profile Header Details Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/20 dark:bg-blue-950/5 rounded-full -mr-8 -mt-8" />
              
              {/* Details Left */}
              <div className="flex items-start gap-4 relative z-10">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-black text-2xl shadow-inner shrink-0">
                  {student.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight">{student.name}</h1>
                    {student.isSuspended ? (
                      <span className="text-rose-600 dark:text-rose-400 font-extrabold bg-rose-50 dark:bg-rose-950/20 px-3 py-0.5 rounded-full text-xs border border-rose-100 dark:border-rose-900/30 flex items-center gap-1">
                        <UserX className="h-3.5 w-3.5" />
                        <span>مطرود / مفصول</span>
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/20 px-3 py-0.5 rounded-full text-xs border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>نشط في الأكاديمية</span>
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2.5 mt-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                    <span className="inline-block py-0.5 px-2 bg-slate-50 dark:bg-zinc-950 rounded-lg">كود: {student.id}</span>
                    <span className="h-1 w-1 bg-zinc-300 rounded-full" />
                    <span>{getGradeName(student.grade)}</span>
                    <span className="h-1 w-1 bg-zinc-300 rounded-full" />
                    <span>السنة: {student.year}</span>
                  </div>

                  {/* Contact numbers */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-4 text-xs font-bold text-zinc-600 dark:text-zinc-300">
                    {student.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-4 w-4 text-zinc-400" />
                        <span>تلفون الطالب: {student.phone}</span>
                      </span>
                    )}
                    {student.guardianPhone && (
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-zinc-400" />
                        <span>ولي الأمر: {student.guardianPhone}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Term Selector */}
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-zinc-950 rounded-2xl relative z-10 w-full md:w-auto">
                <button
                  onClick={() => setCurrentTerm('1')}
                  className={`flex-1 md:flex-none py-2 px-4 text-xs font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    currentTerm === '1'
                      ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                >
                  الفصل الدراسي الأول
                </button>
                <button
                  onClick={() => setCurrentTerm('2')}
                  className={`flex-1 md:flex-none py-2 px-4 text-xs font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    currentTerm === '2'
                      ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                >
                  الفصل الدراسي الثاني
                </button>
              </div>

            </div>

            {/* Stats Summary Cards Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              
              {/* Card 1: Exam Percentage */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-zinc-400">النسبة العامة للدرجات</span>
                  <span className="block text-xl font-black text-zinc-900 dark:text-white">
                    {overallExamPercentage > 0 ? `${overallExamPercentage.toFixed(1)}%` : 'لا يوجد امتحانات'}
                  </span>
                  <span className="block text-[10px] text-zinc-400 font-bold">متوسط التحصيل الأكاديمي</span>
                </div>
                <CircularProgress percentage={overallExamPercentage} size={50} strokeWidth={5} />
              </div>

              {/* Card 2: Attendance Rate */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-zinc-400">نسبة حضور المحاضرات</span>
                  <span className="block text-xl font-black text-zinc-900 dark:text-white">
                    {attendancePercentage.toFixed(1)}%
                  </span>
                  <span className="block text-[10px] text-zinc-400 font-bold">
                    حضور {presentAtt} من أصل {totalAtt}
                  </span>
                </div>
                <CircularProgress percentage={attendancePercentage} size={50} strokeWidth={5} />
              </div>

              {/* Card 3: Payments */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-zinc-400">الاشتراكات الشهرية</span>
                  <span className="block text-xl font-black text-zinc-900 dark:text-white">
                    {paidPayments} / {totalPayments}
                  </span>
                  <span className="block text-[10px] text-zinc-400 font-bold">الشهور المسددة</span>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
                  <CreditCard className="h-5.5 w-5.5" />
                </div>
              </div>

              {/* Card 4: Materials */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-zinc-400">مذكرات المنهج والكتب</span>
                  <span className="block text-xl font-black text-zinc-900 dark:text-white">
                    {paidMaterials} / {totalMaterials}
                  </span>
                  <span className="block text-[10px] text-zinc-400 font-bold">المذكرات المستلمة</span>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">
                  <BookOpen className="h-5.5 w-5.5" />
                </div>
              </div>

            </div>

            {/* Tab Switcher Grid */}
            <div className="border-b border-zinc-200 dark:border-zinc-800 flex gap-1 overflow-x-auto">
              {[
                { id: 'attendance', label: 'الحضور والغياب', icon: CalendarCheck2 },
                { id: 'payments', label: 'الاشتراكات الشهرية', icon: CreditCard },
                { id: 'materials', label: 'مذكرات المنهج', icon: BookOpen },
                { id: 'exams', label: 'درجات الامتحانات', icon: ClipboardList }
              ].map((tab) => {
                const isTabActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center gap-2 px-5 py-4 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      isTabActive
                        ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500 font-extrabold'
                        : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                    }`}
                  >
                    <tab.icon className="h-4.5 w-4.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              
              {/* TAB: ATTENDANCE */}
              {activeTab === 'attendance' && (
                <div className="space-y-4">
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">جدول حضور محاضرات الترم</h3>
                  <div className="border border-zinc-150 dark:border-zinc-850 rounded-2xl overflow-hidden">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                      <thead className="bg-slate-50 dark:bg-zinc-900">
                        <tr>
                          <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500">تاريخ المحاضرة</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">الحالة</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500">ملاحظات أو عذر الغياب</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                        {termData.attendance.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="text-center py-8 text-xs text-zinc-400">لا يوجد سجلات حضور وغياب لهذا الفصل الدراسي حتى الآن.</td>
                          </tr>
                        ) : (
                          termData.attendance.sort((a: any, b: any) => b.date.localeCompare(a.date)).map((att: any) => (
                            <tr key={att.date}>
                              <td className="px-4 py-3.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">{att.date}</td>
                              <td className="px-4 py-3.5 text-xs text-center">
                                {att.status === 'present' && <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full font-extrabold">حاضر</span>}
                                {att.status === 'absent' && <span className="text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 rounded-full font-extrabold">غائب</span>}
                                {att.status === 'excused' && <span className="text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-full font-extrabold">بإذن غياب</span>}
                              </td>
                              <td className="px-4 py-3.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">{att.notes || '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: PAYMENTS */}
              {activeTab === 'payments' && (
                <div className="space-y-4">
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">موقف دفع الاشتراكات الشهرية</h3>
                  <div className="border border-zinc-150 dark:border-zinc-850 rounded-2xl overflow-hidden">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                      <thead className="bg-slate-50 dark:bg-zinc-900">
                        <tr>
                          <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500">الشهر الدراسي</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">مبلغ الاشتراك</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">حالة الاشتراك</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500">تاريخ وتأكيد الدفع</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                        {termData.payments.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-8 text-xs text-zinc-400">لا يوجد اشتراكات مدرجة لهذا الفصل الدراسي.</td>
                          </tr>
                        ) : (
                          termData.payments.map((p: any) => (
                            <tr key={p.month}>
                              <td className="px-4 py-3.5 text-xs font-extrabold text-zinc-700 dark:text-zinc-200">{p.month}</td>
                              <td className="px-4 py-3.5 text-xs text-center font-bold text-zinc-650 dark:text-zinc-350">{p.amount} ج.م</td>
                              <td className="px-4 py-3.5 text-xs text-center font-bold">
                                {p.status === 'paid' ? (
                                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold ${
                                    p.confirmed 
                                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30' 
                                      : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                                  }`}>
                                    {p.confirmed ? 'تم تأكيد الاستلام من المعلم' : 'قيد التسليم (بانتظار تأكيد المعلم)'}
                                  </span>
                                ) : (
                                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 border border-rose-100 dark:border-rose-900/30">
                                    لم يتم تسديده
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-xs text-zinc-500 font-medium">
                                {p.status === 'paid' && p.paymentDate ? (
                                  <span>تم الدفع بتاريخ: {new Date(p.paymentDate).toLocaleDateString('ar-EG')}</span>
                                ) : (
                                  '—'
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: MATERIALS */}
              {activeTab === 'materials' && (
                <div className="space-y-4">
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">موقف مذكرات المنهج والكتب المستلمة</h3>
                  <div className="border border-zinc-150 dark:border-zinc-850 rounded-2xl overflow-hidden">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                      <thead className="bg-slate-50 dark:bg-zinc-900">
                        <tr>
                          <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500">اسم المذكرة أو الكتاب</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">التكلفة</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">حالة الاستلام</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500">تاريخ وتأكيد الاستلام</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                        {termData.materials.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-8 text-xs text-zinc-400">لا توجد مذكرات أو كتب موزعة في هذا الفصل الدراسي حتى الآن.</td>
                          </tr>
                        ) : (
                          termData.materials.map((m: any) => (
                            <tr key={m.id}>
                              <td className="px-4 py-3.5 text-xs font-extrabold text-zinc-700 dark:text-zinc-200">{m.name}</td>
                              <td className="px-4 py-3.5 text-xs text-center font-bold text-zinc-650 dark:text-zinc-350">{m.price} ج.م</td>
                              <td className="px-4 py-3.5 text-xs text-center font-bold">
                                {m.status === 'paid' ? (
                                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold ${
                                    m.confirmed 
                                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30' 
                                      : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                                  }`}>
                                    {m.confirmed ? 'تم التسليم والاستلام' : 'تم السداد (قيد تسليم النسخة)'}
                                  </span>
                                ) : (
                                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 border border-rose-100 dark:border-rose-900/30">
                                    غير مستلم
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-xs text-zinc-500 font-medium">
                                {m.status === 'paid' && m.paymentDate ? (
                                  <span>تاريخ الدفع: {new Date(m.paymentDate).toLocaleDateString('ar-EG')}</span>
                                ) : (
                                  '—'
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: EXAMS */}
              {activeTab === 'exams' && (
                <div className="space-y-4">
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">كشف درجات ونتائج الامتحانات</h3>
                  <div className="border border-zinc-150 dark:border-zinc-850 rounded-2xl overflow-hidden">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                      <thead className="bg-slate-50 dark:bg-zinc-900">
                        <tr>
                          <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500">اسم الامتحان</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">تاريخ الامتحان</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">درجة الطالب</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">الدرجة النهائية</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">النسبة المئوية والتقدير</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                        {termData.exams.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-xs text-zinc-400">لا يوجد درجات امتحانات مرصودة لهذا الترم حتى الآن.</td>
                          </tr>
                        ) : (
                          termData.exams.map((exRecord: any) => {
                            const examObj = exams.find((e: any) => e.id === exRecord.examId);
                            if (!examObj) return null;

                            const percent = examObj.maxScore > 0 ? (exRecord.score / examObj.maxScore) * 100 : 0;
                            let textStyle = 'text-emerald-600 dark:text-emerald-450';
                            let gradeLabel = 'ممتاز';
                            if (percent < 50) {
                              textStyle = 'text-rose-600 dark:text-rose-400 font-extrabold';
                              gradeLabel = 'ضعيف (يحتاج متابعة)';
                            } else if (percent < 75) {
                              textStyle = 'text-amber-600 dark:text-amber-400 font-bold';
                              gradeLabel = 'مقبول';
                            } else if (percent < 85) {
                              textStyle = 'text-blue-600 dark:text-blue-400 font-bold';
                              gradeLabel = 'جيد جداً';
                            }

                            return (
                              <tr key={exRecord.examId}>
                                <td className="px-4 py-3.5 text-xs font-extrabold text-zinc-700 dark:text-zinc-200">{examObj.name}</td>
                                <td className="px-4 py-3.5 text-xs text-center text-zinc-450 dark:text-zinc-500">{examObj.date}</td>
                                <td className="px-4 py-3.5 text-sm text-center font-black text-zinc-900 dark:text-white">{exRecord.score}</td>
                                <td className="px-4 py-3.5 text-xs text-center text-zinc-500">{examObj.maxScore}</td>
                                <td className={`px-4 py-3.5 text-xs text-center font-extrabold ${textStyle}`}>
                                  {percent.toFixed(1)}% ({gradeLabel})
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Support Panel */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 text-center text-zinc-500 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3 text-right">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-zinc-900 dark:text-white">هل لديكم استفسارات أو ملاحظات؟</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5 font-bold">يمكنكم التواصل المباشر مع الأستاذ محمد حامد أو إدارة الأكاديمية</p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <a
                  href={`tel:${student.guardianPhone || '01000000000'}`}
                  className="flex-1 md:flex-none text-center bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 px-6 rounded-xl text-xs cursor-pointer transition-colors shadow-sm"
                >
                  اتصال هاتفي بالأكاديمية
                </a>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
