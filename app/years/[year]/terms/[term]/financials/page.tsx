'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import QuickActions from '@/components/QuickActions';
import {
  Wallet, CheckCircle2, Hourglass, ShieldAlert,
  Loader2, Sparkles, Receipt, Coins, CalendarClock
} from 'lucide-react';

export default function FinancialsPage() {
  const router = useRouter();
  const params = useParams();
  const year = params.year as string;
  const term = params.term as string;

  const [user, setUser] = useState<any>(null);
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshToggle, setRefreshToggle] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleConfirmSingle = async (txId: string) => {
    setActionLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('https://phpcolour.com/social/social1/mimi/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirmFinancials',
          transactionIds: [txId]
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تأكيد الاستلام');

      setSuccessMsg('تم استلام المبلغ بنجاح! 💸');
      handleRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تأكيد الاستلام');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmAll = async () => {
    const pendingIds = (db.financialLogs || [])
      .filter((log: any) => log.status === 'pending')
      .map((log: any) => log.id);

    if (pendingIds.length === 0) return;

    setActionLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('https://phpcolour.com/social/social1/mimi/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirmFinancials',
          transactionIds: pendingIds
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تأكيد استلام المبالغ');

      setSuccessMsg('تم تأكيد استلام جميع المبالغ بنجاح! 💰');
      handleRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تأكيد استلام المبالغ');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !db) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-500" />
      </div>
    );
  }

  // Filter financial logs
  // Since students are filtered by year, logs should belong to students in this year
  const yearStudentIds = (db.students || []).filter((s: any) => s.year === year).map((s: any) => s.id);
  const filteredLogs = (db.financialLogs || []).filter((log: any) => yearStudentIds.includes(log.studentId));

  const pendingLogs = filteredLogs.filter((log: any) => log.status === 'pending');
  const receivedLogs = filteredLogs.filter((log: any) => log.status === 'received').sort((a: any, b: any) => b.recordedAt.localeCompare(a.recordedAt));

  const totalPendingAmount = pendingLogs.reduce((sum: number, log: any) => sum + log.amount, 0);
  const totalReceivedAmount = receivedLogs.reduce((sum: number, log: any) => sum + log.amount, 0);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans">
      
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main Container */}
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">الحسابات والماليات</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            تسوية المبالغ النقدية المستلمة من قبل المساعدين ومراقبة حركات الصندوق للأكاديمية
          </p>
        </header>

        {successMsg && (
          <div className="mb-6 p-4 text-sm bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-950/30 rounded-2xl font-bold flex items-center gap-3">
            <Sparkles className="h-5 w-5" />
            <p>{successMsg}</p>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 text-sm bg-rose-50 dark:bg-rose-950/20 text-rose-650 dark:text-rose-400 border border-rose-100 dark:border-rose-950/30 rounded-2xl font-bold flex items-center gap-3">
            <ShieldAlert className="h-5 w-5" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Audit Metrics Panel */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          
          {/* Box 1: Pending delivery */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-205 border-zinc-205 border-zinc-200 dark:border-zinc-800 flex items-center gap-5 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shadow-inner">
              <Hourglass className="h-7 w-7 animate-pulse" />
            </div>
            <div>
              <span className="block text-xs font-bold text-zinc-400 dark:text-zinc-550">أموال قيد التسليم</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{totalPendingAmount} ج.م</span>
                <span className="text-xs text-zinc-400 font-bold">({pendingLogs.length} عمليات)</span>
              </div>
            </div>
          </div>

          {/* Box 2: Total received */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-5 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 shadow-inner">
              <Coins className="h-7 w-7" />
            </div>
            <div>
              <span className="block text-xs font-bold text-zinc-400 dark:text-zinc-550">إجمالي المقبوضات المستلمة</span>
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-450 mt-0.5">{totalReceivedAmount} ج.م</span>
            </div>
          </div>

          {/* Box 3: Role Action summary */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shadow-sm sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-zinc-400 dark:text-zinc-500">حالة الصلاحية الحالية</span>
              <span className={`px-2 py-0.5 rounded-full ${user?.role === 'admin' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'}`}>
                {user?.role === 'admin' ? 'مدير النظام' : 'مساعد تسجيل'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 leading-5 mt-2.5">
              {user?.role === 'admin' 
                ? 'لديك الصلاحية الكاملة لتأكيد وتحويل المبالغ من "قيد التسليم" إلى "تم الاستلام" بعد قبضها يدوياً.'
                : 'تستطيع تسجيل دفع الاشتراكات والكتب، ولكن يتم قيدها بانتظار استلام مستر محمد حامد لتأكيدها.'}
            </p>
          </div>

        </section>

        {/* Main tables list */}
        <section className="space-y-8">
          
          {/* Pending verification list */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
              <div className="flex items-center gap-2">
                <Receipt className="h-5.5 w-5.5 text-amber-500" />
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">إيصالات معلقة وبانتظار التسوية ({pendingLogs.length})</h3>
              </div>

              {user?.role === 'admin' && pendingLogs.length > 0 && (
                <button
                  onClick={handleConfirmAll}
                  disabled={actionLoading}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 text-xs cursor-pointer shadow-md disabled:opacity-50"
                >
                  تأكيد استلام جميع المبالغ
                </button>
              )}
            </div>

            <div className="border border-zinc-150 dark:border-zinc-850 rounded-2xl overflow-hidden">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                <thead className="bg-slate-50 dark:bg-zinc-900">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500">الطالب</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">نوع البند</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500">الوصف</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">المبلغ</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500">التسجيل بواسطة وتاريخه</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">الحالة</th>
                    {user?.role === 'admin' && <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">إجراءات</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                  {pendingLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-xs text-zinc-400 font-medium">لا توجد عمليات معلقة قيد التسليم حالياً 🎉</td>
                    </tr>
                  ) : (
                    pendingLogs.map((log: any) => (
                      <tr key={log.id}>
                        <td className="px-4 py-3.5">
                          <div className="text-sm font-extrabold text-zinc-900 dark:text-white">{log.studentName}</div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">كود الطالب: {log.studentId}</div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-center">
                          {log.type === 'subscription' 
                            ? <span className="text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-0.5 rounded-lg font-bold">اشتراك شهر</span>
                            : <span className="text-purple-650 text-purple-600 bg-purple-50 dark:bg-purple-950/20 px-2.5 py-0.5 rounded-lg font-bold">كتاب / مذكرة</span>}
                        </td>
                        <td className="px-4 py-3.5 text-xs font-bold text-zinc-700 dark:text-zinc-350">{log.itemName}</td>
                        <td className="px-4 py-3.5 text-sm text-center font-black text-emerald-600 dark:text-emerald-450">{log.amount} ج.م</td>
                        <td className="px-4 py-3.5 text-xs text-zinc-500">
                          <div className="flex flex-col gap-0.5">
                            <span>بواسطة: {log.recordedBy === 'assistant' ? 'أ. أحمد (المساعد)' : log.recordedBy}</span>
                            <span className="flex items-center gap-1 mt-0.5">
                              <CalendarClock className="h-3 w-3" />
                              <span>{new Date(log.recordedAt).toLocaleString('ar-EG')}</span>
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-center font-bold">
                          <span className="inline-block px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
                            بانتظار التأكيد
                          </span>
                        </td>
                        {user?.role === 'admin' && (
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => handleConfirmSingle(log.id)}
                              disabled={actionLoading}
                              className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                            >
                              قبول الاستلام
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historical ledger of completed transactions */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 className="h-5.5 w-5.5 text-emerald-505 text-emerald-500" />
              <h3 className="text-lg font-black text-zinc-900 dark:text-white">سجل العمليات المستلمة والمؤكدة ({receivedLogs.length})</h3>
            </div>

            <div className="border border-zinc-150 dark:border-zinc-850 rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                <thead className="bg-slate-50 dark:bg-zinc-900 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500">الطالب</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">نوع البند</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500">الوصف</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">المبلغ</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500">تاريخ التسجيل والاستلام</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                  {receivedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-xs text-zinc-400 font-medium">لا توجد عمليات مؤكدة في السجل حالياً</td>
                    </tr>
                  ) : (
                    receivedLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
                        <td className="px-4 py-3.5">
                          <div className="text-sm font-extrabold text-zinc-900 dark:text-white">{log.studentName}</div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">كود الطالب: {log.studentId}</div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-center">
                          {log.type === 'subscription' 
                            ? <span className="text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-0.5 rounded-lg font-bold">اشتراك شهر</span>
                            : <span className="text-purple-600 bg-purple-50 dark:bg-purple-950/20 px-2.5 py-0.5 rounded-lg font-bold">كتاب / مذكرة</span>}
                        </td>
                        <td className="px-4 py-3.5 text-xs font-bold text-zinc-700 dark:text-zinc-350">{log.itemName}</td>
                        <td className="px-4 py-3.5 text-sm text-center font-black text-emerald-600 dark:text-emerald-450">{log.amount} ج.م</td>
                        <td className="px-4 py-3.5 text-xs text-zinc-500">
                          <div className="flex flex-col gap-0.5">
                            <span>المسجل: {log.recordedBy === 'assistant' ? 'المساعد' : log.recordedBy}</span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold">
                              التأكيد: {log.receivedAt ? new Date(log.receivedAt).toLocaleDateString('ar-EG') : '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-center font-bold">
                          <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30">
                            مستلم ومقبوض
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </section>

      </main>

      {/* Floating Action Menu (FAB) */}
      <QuickActions onRefresh={handleRefresh} />

    </div>
  );
}
