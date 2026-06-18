'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Plus, ChevronLeft, LogOut, Loader2, ArrowRightLeft, ShieldAlert } from 'lucide-react';

export default function YearsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [years, setYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newYear, setNewYear] = useState('');
  const [rollover, setRollover] = useState(true);
  const [sourceYear, setSourceYear] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('mimi_user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const u = JSON.parse(storedUser);
    setUser(u);

    // Fetch years
    fetch('https://phpcolour.com/social/social1/mimi/api.php')
      .then(res => res.json())
      .then(data => {
        setYears(data.years || []);
        if (data.years && data.years.length > 0) {
          setSourceYear(data.years[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('mimi_user');
    router.push('/login');
  };

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYear.trim()) {
      setModalError('يرجى إدخال السنة الدراسية');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      // Call api/db
      const res = await fetch('https://phpcolour.com/social/social1/mimi/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rolloverYear',
          sourceYear: rollover ? sourceYear : null,
          targetYear: newYear.trim(),
          options: {
            transferStudents: rollover
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل إضافة السنة الدراسية');
      }

      setYears(data.years);
      setShowModal(false);
      setNewYear('');
      if (data.years && data.years.length > 0) {
        setSourceYear(data.years[0]);
      }
    } catch (err: any) {
      setModalError(err.message || 'حدث خطأ ما');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-500" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">جاري تحميل السنوات الدراسية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 p-6 sm:p-10">
      <div className="mx-auto max-w-5xl">
        
        {/* Header Bar */}
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">السنوات الدراسية</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              أهلاً بك يا {user?.name} 👋 يرجى اختيار السنة الدراسية للمتابعة
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-rose-600 font-bold py-2.5 px-4 cursor-pointer transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>تسجيل الخروج</span>
          </button>
        </header>

        {/* Years Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          
          {/* Add Year Button Card (Admin Only) */}
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowModal(true)}
              className="flex flex-col items-center justify-center min-h-[180px] rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 hover:bg-white hover:border-blue-500 dark:hover:bg-zinc-900 dark:hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 cursor-pointer transition-all duration-300 group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-md">
                <Plus className="h-6 w-6" />
              </div>
              <span className="mt-4 text-base font-extrabold text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                إضافة سنة دراسية جديدة
              </span>
            </button>
          )}

          {/* Regular Year Cards */}
          {years.map((year) => (
            <div
              key={year}
              onClick={() => router.push(`/years/${year}/terms`)}
              className="flex items-center justify-between p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-inner">
                  <Calendar className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">السنة الدراسية {year}</h3>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">انقر للدخول واختيار الترم</p>
                </div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:bg-blue-600">
                <ChevronLeft className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>

        {/* Create Year Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
              
              {/* Modal Header */}
              <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
                <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">إضافة سنة دراسية جديدة</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">قم بإنشاء سنة أكاديمية جديدة مع إمكانية ترحيل الطلاب</p>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleCreateYear} className="p-6 space-y-6">
                
                {modalError && (
                  <div className="flex items-center gap-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 p-4 text-sm text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-950/50">
                    <ShieldAlert className="h-5 w-5 shrink-0" />
                    <p className="font-semibold">{modalError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    السنة الدراسية الجديدة (مثال: 2028)
                  </label>
                  <input
                    type="text"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    placeholder="أدخل السنة الجديدة"
                    className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-3 px-4 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    disabled={modalLoading}
                  />
                </div>

                {/* Rollover Toggle */}
                {years.length > 0 && (
                  <div className="rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4 space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rollover}
                        onChange={(e) => setRollover(e.target.checked)}
                        className="h-5 w-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                        disabled={modalLoading}
                      />
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 select-none">
                        ترحيل الطلاب تلقائياً من سنة سابقة
                      </span>
                    </label>

                    {rollover && (
                      <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
                            ترحيل من السنة الدراسية:
                          </label>
                          <select
                            value={sourceYear}
                            onChange={(e) => setSourceYear(e.target.value)}
                            className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2.5 px-3 text-zinc-900 dark:text-white outline-none focus:border-blue-500"
                            disabled={modalLoading}
                          >
                            {years.map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2.5 text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/20 p-3.5 rounded-xl border border-blue-100 dark:border-blue-950/30">
                          <ArrowRightLeft className="h-5 w-5 shrink-0" />
                          <div className="space-y-1">
                            <p className="font-extrabold">قواعد الترقية التلقائية:</p>
                            <p>• طلاب الصف الأول الإعدادي ينتقلون للصف الثاني.</p>
                            <p>• طلاب الصف الثاني الإعدادي ينتقلون للصف الثالث.</p>
                            <p>• طلاب الصف الثالث الإعدادي (الخريجين) لا يتم ترحيلهم.</p>
                            <p>• يتم إنشاء صف أول إعدادي فارغ لاستقبال طلاب جدد.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-800">
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold py-3.5 px-4 shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {modalLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      'إنشاء وحفظ'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={modalLoading}
                    className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold py-3.5 px-4 cursor-pointer transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
