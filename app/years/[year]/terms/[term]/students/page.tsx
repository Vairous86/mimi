'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import QuickActions from '@/components/QuickActions';
import CircularProgress from '@/components/CircularProgress';
import { Search, Filter, SortAsc, GraduationCap, ChevronLeft, Loader2, ArrowUpDown, UserCheck, UserMinus } from 'lucide-react';

export default function StudentsDirectoryPage() {
  const router = useRouter();
  const params = useParams();
  const year = params.year as string;
  const term = params.term as string;

  const [user, setUser] = useState<any>(null);
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'percentage'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [refreshToggle, setRefreshToggle] = useState(false);

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

  const toggleSuspension = async (studentId: string) => {
    try {
      const res = await fetch('https://phpcolour.com/social/social1/mimi/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggleSuspension',
          studentId,
          year
        })
      });
      if (res.ok) {
        handleRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getGradeName = (g: number) => {
    if (g === 1) return 'الصف الأول الإعدادي';
    if (g === 2) return 'الصف الثاني الإعدادي';
    return 'الصف الثالث الإعدادي';
  };

  if (loading || !db) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-500" />
      </div>
    );
  }

  // Filter students for the current academic year
  const rawStudents = (db.students || []).filter((s: any) => s.year === year);
  const rawExams = (db.exams || []).filter((e: any) => e.year === year && e.term === term);

  // Compute student percentages dynamically
  const studentsWithStats = rawStudents.map((s: any) => {
    const sExams = s.terms[term]?.exams || [];
    if (sExams.length === 0) return { ...s, percentage: 0 };
    
    let totalScore = 0;
    let totalMax = 0;
    sExams.forEach((exRecord: any) => {
      const examObj = rawExams.find((e: any) => e.id === exRecord.examId);
      if (examObj) {
        totalScore += exRecord.score;
        totalMax += examObj.maxScore;
      }
    });

    const percent = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
    return { ...s, percentage: percent };
  });

  // Apply search query and filters
  const filteredStudents = studentsWithStats.filter((s: any) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.includes(searchQuery);
    const matchesGrade = selectedGrade === 'all' || String(s.grade) === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  // Apply sorting
  const sortedStudents = [...filteredStudents].sort((a: any, b: any) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    } else {
      return sortOrder === 'asc' ? a.percentage - b.percentage : b.percentage - a.percentage;
    }
  });

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans">
      
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main Container */}
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">دليل الطلاب</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            إدارة بيانات الطلاب، استعراض الحضور والمدفوعات والمستويات الأكاديمية
          </p>
        </header>

        {/* Filter / Search Bar Panel */}
        <section className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
          
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث بالاسم أو كود الطالب..."
              className="block w-full rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-950/50 py-3 pr-10 pl-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
              <Search className="h-5 w-5" />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 w-full md:w-auto flex-wrap">
            
            {/* Grade Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4.5 w-4.5 text-zinc-400" />
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="rounded-xl border border-zinc-205 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-xs font-bold outline-none focus:border-blue-500 text-zinc-705 dark:text-zinc-300"
              >
                <option value="all">كل الصفوف الدراسية</option>
                <option value="1">الصف الأول الإعدادي</option>
                <option value="2">الصف الثاني الإعدادي</option>
                <option value="3">الصف الثالث الإعدادي</option>
              </select>
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-2">
              <SortAsc className="h-4.5 w-4.5 text-zinc-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-xs font-bold outline-none focus:border-blue-500 text-zinc-705 dark:text-zinc-300"
              >
                <option value="name">الترتيب بحسب الاسم</option>
                <option value="percentage">الترتيب بحسب النسبة العامة</option>
              </select>
              <button
                onClick={toggleSortOrder}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-slate-55 hover:bg-slate-50 dark:hover:bg-zinc-850 text-zinc-500 dark:text-zinc-400 cursor-pointer transition-all"
                title="تغيير اتجاه الترتيب"
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
            </div>

          </div>

        </section>

        {/* Student Cards Grid */}
        {sortedStudents.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center text-zinc-450 dark:text-zinc-500 flex flex-col items-center justify-center shadow-sm">
            <GraduationCap className="h-16 w-16 text-zinc-200 dark:text-zinc-800 mb-4" />
            <p className="font-extrabold text-lg text-zinc-700 dark:text-zinc-350">لا يوجد طلاب مطابقين للبحث</p>
            <p className="text-xs text-zinc-400 mt-1">يرجى إضافة طلاب جدد أو تعديل معايير البحث والفلترة</p>
          </div>
        ) : (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedStudents.map((student: any) => {
              const groupObj = (db.groups || []).find((g: any) => g.id === student.groupId);
              return (
                <div
                  key={student.id}
                  onClick={() => router.push(`/years/${year}/terms/${term}/students/${student.id}`)}
                  className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:border-blue-500 dark:hover:border-blue-500 hover:-translate-y-1 cursor-pointer transition-all duration-300 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Decorative Initials */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-extrabold shadow-inner group-hover:scale-110 transition-transform">
                      {student.name[0]}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-extrabold text-zinc-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {student.name}
                      </h3>
                      <div className="flex items-center gap-2.5 mt-1.5 text-xs text-zinc-400 dark:text-zinc-500 font-semibold flex-wrap">
                        <span>كود: <strong className="text-zinc-650 dark:text-zinc-350">{student.id}</strong></span>
                        <span className="h-1 w-1 bg-zinc-300 rounded-full" />
                        <span>{getGradeName(student.grade)}</span>
                        {groupObj && (
                          <>
                            <span className="h-1 w-1 bg-zinc-300 rounded-full" />
                            <span className="text-purple-600 dark:text-purple-450 font-bold bg-purple-50 dark:bg-purple-950/20 px-2 py-0.5 rounded-full border border-purple-100 dark:border-purple-900/30">
                              {groupObj.name} ({groupObj.time})
                            </span>
                          </>
                        )}
                        {student.isSuspended && (
                          <>
                            <span className="h-1 w-1 bg-zinc-300 rounded-full" />
                            <span className="text-rose-600 dark:text-rose-450 font-extrabold bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/30">مطرود</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                
                {/* Score wheel & suspension/arrow indicator */}
                <div className="flex items-center gap-3">
                  <CircularProgress percentage={student.percentage} size={45} strokeWidth={4.5} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSuspension(student.id);
                    }}
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border hover:scale-105 cursor-pointer transition-all ${
                      student.isSuspended
                        ? 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-50 border-rose-100 hover:bg-rose-100 dark:bg-rose-950/30 dark:border-rose-900/30 text-rose-600 dark:text-rose-455'
                    }`}
                    title={student.isSuspended ? 'إلغاء الفصل' : 'فصل الطالب'}
                  >
                    {student.isSuspended ? (
                      <UserCheck className="h-4 w-4" />
                    ) : (
                      <UserMinus className="h-4 w-4" />
                    )}
                  </button>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 dark:bg-zinc-950 text-zinc-400 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30 transition-all">
                    <ChevronLeft className="h-4.5 w-4.5" />
                  </div>
                </div>
              </div>
            )})}
          </section>
        )}

      </main>

      {/* Floating Action Menu (FAB) */}
      <QuickActions onRefresh={handleRefresh} />

    </div>
  );
}
