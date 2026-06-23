'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import QuickActions from '@/components/QuickActions';
import CircularProgress from '@/components/CircularProgress';
import {
  ArrowRight, Phone, Users, ShieldCheck, CalendarCheck2, CreditCard,
  BookOpen, ClipboardList, Plus, Trash2, Check, X, Loader2, UserCheck, UserMinus
} from 'lucide-react';

type TabType = 'attendance' | 'payments' | 'materials' | 'exams';

export default function StudentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const year = params.year as string;
  const term = params.term as string;
  const id = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('attendance');
  const [refreshToggle, setRefreshToggle] = useState(false);

  // Mutation states
  const [actionLoading, setActionLoading] = useState(false);

  // Form - New Attendance Record
  const [newAttDate, setNewAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [newAttStatus, setNewAttStatus] = useState<'present' | 'absent' | 'excused'>('present');
  const [newAttNotes, setNewAttNotes] = useState('');

  // Form - Custom Booklet
  const [newMatName, setNewMatName] = useState('');
  const [newMatPrice, setNewMatPrice] = useState('50');
  const [newMatStatus, setNewMatStatus] = useState<'paid' | 'unpaid'>('paid');

  useEffect(() => {
    const stored = localStorage.getItem('mimi_user');
    if (!stored) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(stored));

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

  const student = (db.students || []).find((s: any) => s.id === id && s.year === year);
  if (!student) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 max-w-sm">
          <p className="font-extrabold text-lg text-zinc-700 dark:text-zinc-300">الطالب غير موجود!</p>
          <p className="text-xs text-zinc-400 mt-2">عذراً، لم نتمكن من العثور على ملف الطالب المطلوب في هذه السنة الدراسية</p>
          <button
            onClick={() => router.push(`/years/${year}/terms/${term}/students`)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white font-bold py-2 px-4 text-xs cursor-pointer"
          >
            العودة لقائمة الطلاب
          </button>
        </div>
      </div>
    );
  }

  const termExams = (db.exams || []).filter((e: any) => e.year === year && e.term === term);
  const studentTermData = student.terms[term] || { attendance: [], payments: [], materials: [], exams: [] };

  // Calculate Overall Grade Percentage
  const sExams = studentTermData.exams || [];
  let totalScoreEarned = 0;
  let totalScoreMax = 0;
  sExams.forEach((exRecord: any) => {
    const examObj = termExams.find((e: any) => e.id === exRecord.examId);
    if (examObj) {
      totalScoreEarned += exRecord.score;
      totalScoreMax += examObj.maxScore;
    }
  });
  const overallPercentage = totalScoreMax > 0 ? (totalScoreEarned / totalScoreMax) * 100 : 0;

  const getGradeName = (g: number) => {
    if (g === 1) return 'الصف الأول الإعدادي';
    if (g === 2) return 'الصف الثاني الإعدادي';
    return 'الصف الثالث الإعدادي';
  };

  // Actions
  // 1. Mark Attendance
  const submitAttendance = async (dateVal: string, statusVal: string, notesVal: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('https://phpcolour.com/social/social1/mimi/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'markAttendance',
          studentId: student.id,
          year,
          term,
          date: dateVal,
          status: statusVal,
          notes: notesVal
        })
      });
      if (res.ok) {
        setNewAttNotes('');
        handleRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Mark Payment
  const togglePaymentStatus = async (monthName: string, currentStatus: 'paid' | 'unpaid', defaultAmount: number) => {
    let finalAmount = defaultAmount;
    if (currentStatus === 'unpaid') {
      const amtStr = prompt('أدخل قيمة الاشتراك المدفوعة لهذا الشهر (ج.م):', String(defaultAmount));
      if (amtStr === null) return;
      const parsed = Number(amtStr);
      if (isNaN(parsed) || parsed <= 0) {
        alert('يرجى إدخال مبلغ صحيح');
        return;
      }
      finalAmount = parsed;
    }

    setActionLoading(true);
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    try {
      const res = await fetch('https://phpcolour.com/social/social1/mimi/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'markPayment',
          studentId: student.id,
          year,
          term,
          month: monthName,
          status: newStatus,
          amount: finalAmount,
          recordedBy: user.username,
          role: user.role
        })
      });
      if (res.ok) {
        handleRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSuspension = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('https://phpcolour.com/social/social1/mimi/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggleSuspension',
          studentId: student.id,
          year
        })
      });
      if (res.ok) {
        handleRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Mark/Add Material Booklet
  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim() || !newMatPrice) return;

    setActionLoading(true);
    const matId = `mat-${Date.now()}`;
    try {
      const res = await fetch('https://phpcolour.com/social/social1/mimi/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'markMaterial',
          studentId: student.id,
          year,
          term,
          materialId: matId,
          materialName: newMatName.trim(),
          status: newMatStatus,
          price: Number(newMatPrice),
          recordedBy: user.username,
          role: user.role
        })
      });
      if (res.ok) {
        setNewMatName('');
        setNewMatPrice('50');
        handleRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleMaterialStatus = async (materialItem: any) => {
    let finalPrice = materialItem.price;
    if (materialItem.status === 'unpaid') {
      const priceStr = prompt('أدخل سعر المذكرة أو المبلغ المدفوع (ج.م):', String(materialItem.price));
      if (priceStr === null) return;
      const parsed = Number(priceStr);
      if (isNaN(parsed) || parsed <= 0) {
        alert('يرجى إدخال سعر صحيح');
        return;
      }
      finalPrice = parsed;
    }

    setActionLoading(true);
    const newStatus = materialItem.status === 'paid' ? 'unpaid' : 'paid';
    try {
      const res = await fetch('https://phpcolour.com/social/social1/mimi/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'markMaterial',
          studentId: student.id,
          year,
          term,
          materialId: materialItem.id,
          materialName: materialItem.name,
          status: newStatus,
          price: finalPrice,
          recordedBy: user.username,
          role: user.role
        })
      });
      if (res.ok) {
        handleRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans">
      
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main Container */}
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        
        {/* Breadcrumb Back Button */}
        <button
          onClick={() => router.push(`/years/${year}/terms/${term}/students`)}
          className="flex items-center gap-2 text-zinc-550 hover:text-blue-650 dark:text-zinc-400 dark:hover:text-blue-400 font-bold mb-8 cursor-pointer transition-colors"
        >
          <ArrowRight className="h-5 w-5" />
          <span>العودة لدليل الطلاب</span>
        </button>

        {/* Student Profile Header Details Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          
          {/* Details Left */}
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-black text-2xl shadow-inner shrink-0">
              {student.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight">{student.name}</h1>
                {student.isSuspended && (
                  <span className="text-rose-600 dark:text-rose-400 font-extrabold bg-rose-50 dark:bg-rose-950/20 px-3 py-0.5 rounded-full text-xs border border-rose-100 dark:border-rose-900/30">
                    مطرود
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5 mt-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                <span className="inline-block py-0.5 px-2 bg-slate-50 dark:bg-zinc-950 rounded-lg">كود: {student.id}</span>
                <span className="h-1 w-1 bg-zinc-300 rounded-full" />
                <span>{getGradeName(student.grade)}</span>
              </div>

              {/* Contact numbers */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-4 text-xs font-bold text-zinc-650 dark:text-zinc-350">
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

          {/* Stats Right */}
          <div className="flex items-center gap-6 border-t border-zinc-100 dark:border-zinc-800 pt-4 md:pt-0 md:border-t-0 w-full md:w-auto shrink-0 justify-between md:justify-end flex-wrap md:flex-nowrap">
            <button
              onClick={toggleSuspension}
              disabled={actionLoading}
              className={`flex items-center gap-2 rounded-2xl font-extrabold py-3 px-4.5 text-xs cursor-pointer shadow-sm transition-all hover:scale-105 ${
                student.isSuspended
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/10'
              }`}
            >
              {student.isSuspended ? (
                <>
                  <UserCheck className="h-4.5 w-4.5 shrink-0" />
                  <span>إلغاء الفصل (تفعيل)</span>
                </>
              ) : (
                <>
                  <UserMinus className="h-4.5 w-4.5 shrink-0" />
                  <span>فصل الطالب (طرد)</span>
                </>
              )}
            </button>
            <div className="flex items-center gap-4">
              <div>
                <span className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 text-left md:text-right">النسبة العامة</span>
                <span className="block text-[10px] text-zinc-400 mt-0.5 text-left md:text-right">متوسط درجات الامتحانات</span>
              </div>
              <CircularProgress percentage={overallPercentage} size={64} strokeWidth={6} />
            </div>
          </div>

        </div>

        {/* Tab Switcher Grid */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 flex gap-1 mb-8 overflow-x-auto no-print">
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

        {/* Tab Contents */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          
          {/* ========================================================
              TAB: ATTENDANCE & ABSENCE
              ======================================================== */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              
              {/* Daily attendance check form */}
              <div className="no-print rounded-2xl bg-slate-50 dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3.5 flex-wrap">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-zinc-450 dark:text-zinc-500">تاريخ المحاضرة</span>
                    <input
                      type="date"
                      value={newAttDate}
                      onChange={(e) => setNewAttDate(e.target.value)}
                      className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-3 text-xs outline-none focus:border-blue-505"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-zinc-455 dark:text-zinc-500">الحالة</span>
                    <select
                      value={newAttStatus}
                      onChange={(e) => setNewAttStatus(e.target.value as any)}
                      className="rounded-lg border border-zinc-205 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-3 text-xs outline-none"
                    >
                      <option value="present">حاضر</option>
                      <option value="absent">غائب</option>
                      <option value="excused">بإذن غياب</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-zinc-455 dark:text-zinc-500">ملاحظات أو عذر</span>
                    <input
                      type="text"
                      value={newAttNotes}
                      onChange={(e) => setNewAttNotes(e.target.value)}
                      placeholder="مثال: عذر طبي، سفر"
                      className="w-56 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-3 text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <button
                  onClick={() => submitAttendance(newAttDate, newAttStatus, newAttNotes)}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 text-white font-bold py-2 px-4 text-xs cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>تسجيل الحضور</span>
                </button>
              </div>

              {/* Attendance Table */}
              <div className="border border-zinc-150 dark:border-zinc-850 rounded-2xl overflow-hidden">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                  <thead className="bg-slate-50 dark:bg-zinc-900">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500">تاريخ المحاضرة</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">الحالة</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500">ملاحظات الأعذار</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500 no-print">إجراءات سريعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                    {studentTermData.attendance.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-xs text-zinc-400">لا يوجد سجل حضور مسجل لهذا الترم</td>
                      </tr>
                    ) : (
                      studentTermData.attendance.sort((a: any, b: any) => b.date.localeCompare(a.date)).map((att: any) => (
                        <tr key={att.date}>
                          <td className="px-4 py-3.5 text-xs font-bold text-zinc-650 dark:text-zinc-350">{att.date}</td>
                          <td className="px-4 py-3.5 text-xs text-center">
                            {att.status === 'present' && <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full font-extrabold">حاضر</span>}
                            {att.status === 'absent' && <span className="text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 rounded-full font-extrabold">غائب</span>}
                            {att.status === 'excused' && <span className="text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-full font-extrabold">بإذن</span>}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-zinc-500 font-medium">{att.notes || '—'}</td>
                          <td className="px-4 py-2 text-center no-print">
                            <div className="flex justify-center gap-1.5">
                              <button
                                onClick={() => submitAttendance(att.date, 'present', '')}
                                className="h-7 px-2.5 rounded-lg border border-emerald-100 hover:bg-emerald-50 dark:border-emerald-950/30 text-emerald-600 text-[10px] font-bold cursor-pointer"
                              >
                                حاضر
                              </button>
                              <button
                                onClick={() => submitAttendance(att.date, 'absent', '')}
                                className="h-7 px-2.5 rounded-lg border border-rose-100 hover:bg-rose-50 dark:border-rose-955/30 text-rose-600 text-[10px] font-bold cursor-pointer"
                              >
                                غائب
                              </button>
                              <button
                                onClick={() => {
                                  const text = prompt('ادخل سبب الإذن غياب:', att.notes || '');
                                  if (text !== null) {
                                    submitAttendance(att.date, 'excused', text);
                                  }
                                }}
                                className="h-7 px-2.5 rounded-lg border border-amber-100 hover:bg-amber-50 dark:border-amber-955/30 text-amber-600 text-[10px] font-bold cursor-pointer"
                              >
                                إذن
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ========================================================
              TAB: SUBSCRIPTION PAYMENTS
              ======================================================== */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              
              <div className="border border-zinc-150 dark:border-zinc-850 rounded-2xl overflow-hidden">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                  <thead className="bg-slate-50 dark:bg-zinc-900">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500">الشهر الدراسي</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">مبلغ الاشتراك</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">حالة الدفع</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500">تاريخ الدفع والمسجل</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500 no-print">تعديل الدفع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                    {studentTermData.payments.map((p: any) => (
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
                              {p.confirmed ? 'تم الاستلام والتسليم' : 'قيد التسليم (بانتظار المعلم)'}
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                              غير مدفوع
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-zinc-500 font-medium">
                          {p.status === 'paid' && p.paymentDate ? (
                            <div className="flex flex-col gap-0.5">
                              <span>التاريخ: {new Date(p.paymentDate).toLocaleDateString('ar-EG')}</span>
                              <span>المسجل: {p.recordedBy === 'mimi' || p.recordedBy === 'mohamed_hamed' || p.recordedBy === 'محمد حامد' ? 'مستر محمد حامد' : 'المساعد'}</span>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-2 text-center no-print">
                          <button
                            onClick={() => togglePaymentStatus(p.month, p.status, p.amount)}
                            disabled={actionLoading}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm ${
                              p.status === 'paid'
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-650 border border-rose-100'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/5'
                            }`}
                          >
                            {p.status === 'paid' ? 'إلغاء الدفع' : 'تسجيل كمدفوع'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ========================================================
              TAB: BOOKLETS & MATERIALS
              ======================================================== */}
          {activeTab === 'materials' && (
            <div className="space-y-6">
              
              {/* Add booklet form */}
              <form onSubmit={handleAddMaterial} className="no-print rounded-2xl bg-slate-50 dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3.5 flex-wrap">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-zinc-450 dark:text-zinc-555">اسم المذكرة أو الكتاب</span>
                    <input
                      type="text"
                      value={newMatName}
                      onChange={(e) => setNewMatName(e.target.value)}
                      placeholder="مثال: مذكرة مراجعة ليلة الامتحان"
                      className="w-56 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-3 text-xs outline-none focus:border-blue-500 font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-zinc-450 dark:text-zinc-555">سعر المذكرة</span>
                    <input
                      type="number"
                      value={newMatPrice}
                      onChange={(e) => setNewMatPrice(e.target.value)}
                      className="w-20 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-3 text-xs outline-none text-center font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-zinc-455 dark:text-zinc-500">الحالة</span>
                    <select
                      value={newMatStatus}
                      onChange={(e) => setNewMatStatus(e.target.value as any)}
                      className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 px-3 text-xs outline-none font-bold text-zinc-700 dark:text-zinc-350"
                    >
                      <option value="paid">مدفوع</option>
                      <option value="unpaid">غير مدفوع</option>
                    </select>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={actionLoading || !newMatName.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 text-white font-bold py-2.5 px-4 text-xs cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>إضافة وتوزيع المذكرة</span>
                </button>
              </form>

              {/* Materials Table */}
              <div className="border border-zinc-150 dark:border-zinc-850 rounded-2xl overflow-hidden">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                  <thead className="bg-slate-50 dark:bg-zinc-900">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500">اسم المذكرة</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">سعر المذكرة</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">حالة الدفع</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500">التاريخ والمسجل</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500 no-print">إجراءات سريعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                    {studentTermData.materials.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-xs text-zinc-400">لا يوجد مذكرات مسجلة للطالب</td>
                      </tr>
                    ) : (
                      studentTermData.materials.map((m: any) => (
                        <tr key={m.id}>
                          <td className="px-4 py-3.5 text-xs font-extrabold text-zinc-700 dark:text-zinc-250">{m.name}</td>
                          <td className="px-4 py-3.5 text-xs text-center font-bold text-zinc-650 dark:text-zinc-350">{m.price} ج.م</td>
                          <td className="px-4 py-3.5 text-xs text-center font-bold">
                            {m.status === 'paid' ? (
                              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold ${
                                m.confirmed 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30' 
                                  : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                              }`}>
                                {m.confirmed ? 'تم الاستلام والتسليم' : 'قيد التسليم (بانتظار المعلم)'}
                              </span>
                            ) : (
                              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                                لم يتم الدفع
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-zinc-500 font-medium">
                            {m.status === 'paid' && m.paymentDate ? (
                              <div className="flex flex-col gap-0.5">
                                <span>التاريخ: {new Date(m.paymentDate).toLocaleDateString('ar-EG')}</span>
                                <span>المسجل: {m.recordedBy === 'mimi' || m.recordedBy === 'mohamed_hamed' || m.recordedBy === 'محمد حامد' ? 'مستر محمد حامد' : 'المساعد'}</span>
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-2 text-center no-print">
                            <button
                              onClick={() => toggleMaterialStatus(m)}
                              disabled={actionLoading}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm ${
                                m.status === 'paid'
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-650 border border-rose-100'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/5'
                              }`}
                            >
                              {m.status === 'paid' ? 'إلغاء الدفع' : 'تسجيل كمدفوع'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ========================================================
              TAB: EXAM SCORES
              ======================================================== */}
          {activeTab === 'exams' && (
            <div className="space-y-6">
              
              <div className="border border-zinc-150 dark:border-zinc-850 rounded-2xl overflow-hidden">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                  <thead className="bg-slate-50 dark:bg-zinc-900">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500">اسم الامتحان</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">تاريخ الامتحان</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">الدرجة الحاصل عليها</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">الدرجة النهائية</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">النسبة المئوية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                    {studentTermData.exams.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-xs text-zinc-400">لا يوجد درجات امتحانات مرصودة لهذا الطالب حتى الآن</td>
                      </tr>
                    ) : (
                      studentTermData.exams.map((exRecord: any) => {
                        const examObj = termExams.find((e: any) => e.id === exRecord.examId);
                        if (!examObj) return null;

                        const percent = examObj.maxScore > 0 ? (exRecord.score / examObj.maxScore) * 100 : 0;
                        let textStyle = 'text-emerald-600 dark:text-emerald-450';
                        if (percent < 50) textStyle = 'text-rose-600 dark:text-rose-400';
                        else if (percent < 75) textStyle = 'text-amber-600 dark:text-amber-400';

                        return (
                          <tr key={exRecord.examId}>
                            <td className="px-4 py-3.5 text-xs font-extrabold text-zinc-700 dark:text-zinc-200">{examObj.name}</td>
                            <td className="px-4 py-3.5 text-xs text-center text-zinc-450 dark:text-zinc-500">{examObj.date}</td>
                            <td className="px-4 py-3.5 text-sm text-center font-black text-zinc-900 dark:text-white">{exRecord.score}</td>
                            <td className="px-4 py-3.5 text-xs text-center text-zinc-500">{examObj.maxScore}</td>
                            <td className={`px-4 py-3.5 text-xs text-center font-extrabold ${textStyle}`}>
                              {percent.toFixed(1)}%
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

      </main>

      {/* Floating Action Menu (FAB) */}
      <QuickActions onRefresh={handleRefresh} />

    </div>
  );
}
