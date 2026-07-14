'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Plus, Users, ClipboardList, FileText, QrCode, X, Loader2,
  Calendar, Award, CheckCircle2, UserCheck, AlertTriangle, FileSpreadsheet, Printer
} from 'lucide-react';

interface QuickActionsProps {
  onRefresh?: () => void;
}

type ModalType = 'addStudent' | 'addExam' | 'previousExams' | 'reports' | 'qrCode' | null;
type ReportType = 'absence' | 'excuse' | 'general' | 'monthly' | 'booklets' | 'daily' | null;

export default function QuickActions({ onRefresh }: QuickActionsProps) {
  const params = useParams();
  const year = params.year as string;
  const term = params.term as string;

  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  
  // App data loaded dynamically
  const [students, setStudents] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form States
  // 1. Add Student
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [studentGrade, setStudentGrade] = useState<'1' | '2' | '3'>('1');
  const [studentSubFee, setStudentSubFee] = useState('150');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // 2. Add Exam
  const [examName, setExamName] = useState('');
  const [examGrade, setExamGrade] = useState<'1' | '2' | '3'>('1');
  const [examMaxScore, setExamMaxScore] = useState('20');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);

  // 3. Previous Exams / Enter Grades
  const [selectedExamId, setSelectedExamId] = useState('');
  const [examScores, setExamScores] = useState<{ [studentId: string]: string }>({});

  // 4. Reports
  const [activeReport, setActiveReport] = useState<ReportType>(null);
  const [absenceFrom, setAbsenceFrom] = useState(0);
  const [absenceTo, setAbsenceTo] = useState(10);
  const [excuseFrom, setExcuseFrom] = useState(0);
  const [excuseTo, setExcuseTo] = useState(10);
  const [selectedReportMonth, setSelectedReportMonth] = useState('سبتمبر');
  const [selectedReportDate, setSelectedReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedReportBooklet, setSelectedReportBooklet] = useState('');
  const [allBookletNames, setAllBookletNames] = useState<string[]>([]);
  const [generalFrom, setGeneralFrom] = useState(0);
  const [generalTo, setGeneralTo] = useState(100);
  const [selectedReportGrade, setSelectedReportGrade] = useState<string>('all');
  const [reportData, setReportData] = useState<any[]>([]);

  // 5. QR Code Card
  const [selectedQrStudentId, setSelectedQrStudentId] = useState('');
  const [qrMode, setQrMode] = useState<'single' | 'grade'>('single');
  const [selectedQrGrade, setSelectedQrGrade] = useState<1 | 2 | 3>(1);

  // Fetch base database info
  const loadDatabase = async () => {
    setDbLoading(true);
    try {
      const res = await fetch('https://phpcolour.com/social/social1/mimi/api.php');
      if (res.ok) {
        const data = await res.json();
        // Filter students belonging to this year
        const yearStudents = (data.students || []).filter((s: any) => s.year === year);
        setStudents(yearStudents);
        
        // Extract booklet list
        const booklets = Array.from(
          new Set(
            yearStudents.flatMap((s: any) => (s.terms?.[term]?.materials || []).map((m: any) => m.name))
          )
        ) as string[];
        setAllBookletNames(booklets);
        if (booklets.length > 0) {
          setSelectedReportBooklet(booklets[0]);
        }

        // Filter exams belonging to this year and term
        const yearExams = (data.exams || []).filter((e: any) => e.year === year && e.term === term);
        setExams(yearExams);

        if (yearExams.length > 0) {
          setSelectedExamId(yearExams[0].id);
        }
        if (yearStudents.length > 0) {
          setSelectedQrStudentId(yearStudents[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load DB details for quick action modals', err);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('mimi_user');
    if (stored) {
      setCurrentUser(JSON.parse(stored));
    }
  }, []);

  const openModal = (type: ModalType) => {
    setActiveModal(type);
    setIsOpen(false);
    setErrorMsg('');
    setSuccessMsg('');
    loadDatabase();
  };

  // 1. Submit Add Student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentGrade) {
      setErrorMsg('الاسم والصف الدراسي حقول مطلوبة');
      return;
    }

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('https://phpcolour.com/social/social1/mimi/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addStudent',
          student: {
            name: studentName.trim(),
            phone: studentPhone.trim(),
            guardianPhone: guardianPhone.trim(),
            grade: Number(studentGrade),
            year,
            subscriptionFee: Number(studentSubFee)
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ ما');

      setSuccessMsg(`تم إضافة الطالب بنجاح! كود الطالب التلقائي الجديد هو: ${data.student.id} 🎉`);
      setStudentName('');
      setStudentPhone('');
      setGuardianPhone('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل إضافة الطالب');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Submit Add Exam
  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim() || !examMaxScore || !examDate) {
      setErrorMsg('جميع حقول الامتحان مطلوبة');
      return;
    }

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('https://phpcolour.com/social/social1/mimi/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addExam',
          name: examName.trim(),
          grade: Number(examGrade),
          maxScore: Number(examMaxScore),
          date: examDate,
          year,
          term
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ ما');

      setSuccessMsg('تم إضافة الامتحان بنجاح! 📝');
      setExamName('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل إضافة الامتحان');
    } finally {
      setActionLoading(false);
    }
  };

  // Load scores when selected exam changes
  useEffect(() => {
    if (selectedExamId) {
      const exam = exams.find(e => e.id === selectedExamId);
      if (exam) {
        const scoresMap: { [studentId: string]: string } = {};
        // Find students of the matching grade
        const targetStudents = students.filter(s => s.grade === exam.grade);
        targetStudents.forEach(s => {
          const scoreRecord = s.terms?.[term]?.exams?.find((ex: any) => ex.examId === selectedExamId);
          scoresMap[s.id] = scoreRecord ? String(scoreRecord.score) : '';
        });
        setExamScores(scoresMap);
      }
    }
  }, [selectedExamId, exams, students, term]);

  // 3. Submit Exam Scores
  const handleSaveScores = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const scoresPayload = Object.entries(examScores).map(([studentId, val]) => ({
        studentId,
        score: val.trim() === '' ? 0 : Number(val)
      }));

      const res = await fetch('https://phpcolour.com/social/social1/mimi/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enterExamScores',
          examId: selectedExamId,
          year,
          term,
          scores: scoresPayload
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ ما');

      setSuccessMsg('تم حفظ درجات الطلاب بنجاح! ✅');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل حفظ الدرجات');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Generate Reports
  const generateReport = () => {
    setErrorMsg('');
    if (!activeReport) return;

    if (activeReport === 'absence') {
      // Students with absences between absenceFrom and absenceTo
      const filtered = students.filter(s => {
        const absences = (s.terms?.[term]?.attendance || []).filter((a: any) => a.status === 'absent').length;
        return absences >= absenceFrom && absences <= absenceTo;
      }).map(s => {
        const count = (s.terms?.[term]?.attendance || []).filter((a: any) => a.status === 'absent').length;
        return { id: s.id, name: s.name, phone: s.phone, parentPhone: s.guardianPhone, val: count, grade: s.grade };
      });
      setReportData(filtered);
    }

    if (activeReport === 'excuse') {
      // Students with excuses between excuseFrom and excuseTo
      const filtered = students.filter(s => {
        const excuses = (s.terms?.[term]?.attendance || []).filter((a: any) => a.status === 'excused').length;
        return excuses >= excuseFrom && excuses <= excuseTo;
      }).map(s => {
        const count = (s.terms?.[term]?.attendance || []).filter((a: any) => a.status === 'excused').length;
        return { id: s.id, name: s.name, phone: s.phone, parentPhone: s.guardianPhone, val: count, grade: s.grade };
      });
      setReportData(filtered);
    }

    if (activeReport === 'general') {
      // Calculate general score average for each student, filter by score range generalFrom to generalTo, and sort them descending
      const computed = students.map(s => {
        const sExams = s.terms?.[term]?.exams || [];
        if (sExams.length === 0) return { id: s.id, name: s.name, phone: s.phone, parentPhone: s.guardianPhone, val: 0, grade: s.grade };

        let totalEarned = 0;
        let totalMax = 0;
        sExams.forEach((exRecord: any) => {
          const examObj = exams.find(e => e.id === exRecord.examId);
          if (examObj) {
            totalEarned += exRecord.score;
            totalMax += examObj.maxScore;
          }
        });

        const percent = totalMax > 0 ? (totalEarned / totalMax) * 105 : 0; // Wait, original had totalEarned/totalMax * 100, wait let's use 100 not 105!
        const percentCorrected = totalMax > 0 ? (totalEarned / totalMax) * 100 : 0;
        return { id: s.id, name: s.name, phone: s.phone, parentPhone: s.guardianPhone, val: percentCorrected, grade: s.grade };
      })
      .filter(s => s.val >= generalFrom && s.val <= generalTo)
      .sort((a, b) => b.val - a.val);

      setReportData(computed);
    }

    if (activeReport === 'monthly') {
      const computed = students.map(s => {
        const pay = s.terms?.[term]?.payments?.find((p: any) => p.month === selectedReportMonth);
        return {
          id: s.id,
          name: s.name,
          status: pay ? pay.status : 'unpaid',
          confirmed: pay ? pay.confirmed : false,
          grade: s.grade
        };
      });
      setReportData(computed);
    }

    if (activeReport === 'booklets') {
      const computed = students.map(s => {
        const mat = s.terms?.[term]?.materials?.find((m: any) => m.name === selectedReportBooklet);
        return {
          id: s.id,
          name: s.name,
          status: mat ? mat.status : 'unpaid',
          confirmed: mat ? mat.confirmed : false,
          price: mat ? mat.price : 50,
          grade: s.grade
        };
      });
      setReportData(computed);
    }

    if (activeReport === 'daily') {
      const computed = students.map(s => {
        const att = s.terms?.[term]?.attendance?.find((a: any) => a.date === selectedReportDate);
        return {
          id: s.id,
          name: s.name,
          status: att ? att.status : 'غائب (غير مسجل)',
          notes: att?.notes || '',
          grade: s.grade
        };
      });
      const filtered = selectedReportGrade === 'all'
        ? computed
        : computed.filter(s => String(s.grade) === selectedReportGrade);
      setReportData(filtered);
    }
  };

  useEffect(() => {
    if (activeReport) {
      generateReport();
    }
  }, [
    activeReport,
    absenceFrom,
    absenceTo,
    excuseFrom,
    excuseTo,
    selectedReportMonth,
    selectedReportDate,
    selectedReportBooklet,
    generalFrom,
    generalTo,
    selectedReportGrade,
    students,
    term,
    exams
  ]);

  const handlePrint = () => {
    window.print();
  };

  const getGradeName = (grade: number) => {
    if (grade === 1) return 'الصف الأول الإعدادي';
    if (grade === 2) return 'الصف الثاني الإعدادي';
    return 'الصف الثالث الإعدادي';
  };

  const selectedQrStudent = students.find(s => s.id === selectedQrStudentId);

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-8 right-8 z-40 no-print">
        {isOpen && (
          <div className="absolute bottom-16 right-0 mb-3 flex flex-col gap-3.5 items-end">
            
            {/* Action Buttons */}
            <button
              onClick={() => openModal('addStudent')}
              className="flex items-center gap-3.5 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 py-3 px-4.5 text-sm font-extrabold text-zinc-700 dark:text-zinc-350 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer shrink-0 transition-all hover:scale-105"
            >
              <span>إضافة طالب جديد</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                <Users className="h-5 w-5" />
              </div>
            </button>

            <button
              onClick={() => openModal('addExam')}
              className="flex items-center gap-3.5 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 py-3 px-4.5 text-sm font-extrabold text-zinc-700 dark:text-zinc-350 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer shrink-0 transition-all hover:scale-105"
            >
              <span>إضافة امتحان جديد</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                <ClipboardList className="h-5 w-5" />
              </div>
            </button>

            <button
              onClick={() => openModal('previousExams')}
              className="flex items-center gap-3.5 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 py-3 px-4.5 text-sm font-extrabold text-zinc-700 dark:text-zinc-350 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer shrink-0 transition-all hover:scale-105"
            >
              <span>رصد درجات الامتحانات</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                <Award className="h-5 w-5" />
              </div>
            </button>

            <button
              onClick={() => openModal('reports')}
              className="flex items-center gap-3.5 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 py-3 px-4.5 text-sm font-extrabold text-zinc-700 dark:text-zinc-350 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer shrink-0 transition-all hover:scale-105"
            >
              <span>تقارير الطلاب والإحصائيات</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                <FileText className="h-5 w-5" />
              </div>
            </button>

            <button
              onClick={() => openModal('qrCode')}
              className="flex items-center gap-3.5 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 py-3 px-4.5 text-sm font-extrabold text-zinc-700 dark:text-zinc-350 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer shrink-0 transition-all hover:scale-105"
            >
              <span>بطاقات الطلاب و QR Code</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400">
                <QrCode className="h-5 w-5" />
              </div>
            </button>

          </div>
        )}

        {/* Master FAB Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-2xl transition-all duration-300 transform cursor-pointer ${
            isOpen ? 'bg-zinc-700 dark:bg-zinc-800 rotate-45' : 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 shadow-blue-500/25 hover:scale-105'
          }`}
        >
          <Plus className="h-8 w-8" />
        </button>
      </div>

      {/* ========================================================
          MODAL 1: ADD STUDENT
          ======================================================== */}
      {activeModal === 'addStudent' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
              <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white">إضافة طالب جديد</h3>
              <button onClick={() => setActiveModal(null)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="p-6 space-y-4">
              {errorMsg && <div className="p-3 text-xs bg-rose-50 border border-rose-100 dark:bg-rose-950/30 dark:border-rose-950 text-rose-600 dark:text-rose-400 rounded-xl font-bold">{errorMsg}</div>}
              {successMsg && <div className="p-3 text-xs bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-950 text-emerald-600 dark:text-emerald-450 rounded-xl font-bold">{successMsg}</div>}

              <div>
                <label className="block text-xs font-bold text-zinc-655 dark:text-zinc-350 mb-1.5">الصف الدراسي</label>
                <select
                  value={studentGrade}
                  onChange={(e) => setStudentGrade(e.target.value as any)}
                  className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-blue-500"
                  disabled={actionLoading}
                >
                  <option value="1">أولى إعدادي</option>
                  <option value="2">ثانية إعدادي</option>
                  <option value="3">ثالثة إعدادي</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-655 dark:text-zinc-350 mb-1.5">اسم الطالب بالكامل</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="أدخل الاسم الرباعي"
                  className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-blue-500"
                  disabled={actionLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-655 dark:text-zinc-350 mb-1.5">رقم الهاتف (الطالب)</label>
                  <input
                    type="text"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    placeholder="مثال: 01012345678"
                    className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-blue-500"
                    disabled={actionLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-655 dark:text-zinc-350 mb-1.5">رقم هاتف ولي الأمر</label>
                  <input
                    type="text"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="مثال: 01212345678"
                    className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-blue-500"
                    disabled={actionLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-655 dark:text-zinc-350 mb-1.5">قيمة الاشتراك الشهري الافتراضية (ج.م)</label>
                <input
                  type="number"
                  value={studentSubFee}
                  onChange={(e) => setStudentSubFee(e.target.value)}
                  placeholder="مثال: 150"
                  className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-blue-500 font-bold"
                  disabled={actionLoading}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-800 mt-6">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-bold py-2.5 cursor-pointer disabled:opacity-50 text-sm"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ الطالب'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  disabled={actionLoading}
                  className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-slate-50 dark:bg-zinc-950 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 font-bold py-2.5 cursor-pointer text-sm"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: ADD EXAM
          ======================================================== */}
      {activeModal === 'addExam' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
              <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white">إضافة امتحان جديد</h3>
              <button onClick={() => setActiveModal(null)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddExam} className="p-6 space-y-4">
              {errorMsg && <div className="p-3 text-xs bg-rose-50 border border-rose-100 dark:bg-rose-950/30 dark:border-rose-950 text-rose-600 dark:text-rose-400 rounded-xl font-bold">{errorMsg}</div>}
              {successMsg && <div className="p-3 text-xs bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-950 text-emerald-600 dark:text-emerald-450 rounded-xl font-bold">{successMsg}</div>}

              <div>
                <label className="block text-xs font-bold text-zinc-655 dark:text-zinc-350 mb-1.5">اسم الامتحان</label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="مثال: اختبار الجبر الأسبوعي الثالث"
                  className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-blue-500"
                  disabled={actionLoading}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-655 dark:text-zinc-350 mb-1.5">الصف المستهدف</label>
                  <select
                    value={examGrade}
                    onChange={(e) => setExamGrade(e.target.value as any)}
                    className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-blue-500"
                    disabled={actionLoading}
                  >
                    <option value="1">أولى إعدادي</option>
                    <option value="2">ثانية إعدادي</option>
                    <option value="3">ثالثة إعدادي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-655 dark:text-zinc-350 mb-1.5">الدرجة النهائية</label>
                  <input
                    type="number"
                    value={examMaxScore}
                    onChange={(e) => setExamMaxScore(e.target.value)}
                    placeholder="20"
                    className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-blue-500"
                    disabled={actionLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-655 dark:text-zinc-350 mb-1.5">تاريخ الامتحان</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-blue-500"
                    disabled={actionLoading}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-800 mt-6">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-bold py-2.5 cursor-pointer disabled:opacity-50 text-sm"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إنشاء الامتحان'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  disabled={actionLoading}
                  className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-slate-50 dark:bg-zinc-955 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 font-bold py-2.5 cursor-pointer text-sm"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: PREVIOUS EXAMS & GRADES
          ======================================================== */}
      {activeModal === 'previousExams' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            
            <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50 shrink-0">
              <div>
                <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white">رصد وتعديل درجات الطلاب</h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">اختر امتحاناً سابقاً لتسجيل أو تعديل درجات الطلاب المستهدفين</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {dbLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
              ) : exams.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 text-sm">لا يوجد امتحانات مسجلة لهذا الترم حتى الآن</div>
              ) : (
                <>
                  {errorMsg && <div className="p-3 text-xs bg-rose-50 border border-rose-100 dark:bg-rose-950/30 dark:border-rose-950 text-rose-600 dark:text-rose-400 rounded-xl font-bold">{errorMsg}</div>}
                  {successMsg && <div className="p-3 text-xs bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-950 text-emerald-600 dark:text-emerald-450 rounded-xl font-bold">{successMsg}</div>}

                  <div>
                    <label className="block text-xs font-bold text-zinc-655 dark:text-zinc-350 mb-1.5">اختر الامتحان</label>
                    <select
                      value={selectedExamId}
                      onChange={(e) => setSelectedExamId(e.target.value)}
                      className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-blue-500"
                    >
                      {exams.map(e => (
                        <option key={e.id} value={e.id}>{e.name} ({getGradeName(e.grade)}) - الدرجة الكلية: {e.maxScore}</option>
                      ))}
                    </select>
                  </div>

                  {/* Students score entry list */}
                  <div className="space-y-3 mt-6">
                    <h4 className="text-xs font-black text-zinc-650 dark:text-zinc-400 uppercase tracking-wider">كشف درجات الطلاب:</h4>
                    <div className="border border-zinc-150 dark:border-zinc-850 rounded-2xl overflow-hidden bg-slate-50/30 dark:bg-zinc-950/30">
                      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                        <thead className="bg-slate-50 dark:bg-zinc-900">
                          <tr>
                            <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500">كود</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500">اسم الطالب</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-zinc-500">الدرجة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                          {(() => {
                            const exam = exams.find(e => e.id === selectedExamId);
                            if (!exam) return null;
                            const targetStudents = students.filter(s => s.grade === exam.grade);
                            
                            if (targetStudents.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={3} className="text-center py-6 text-xs text-zinc-400">لا يوجد طلاب مسجلين في هذا الصف الدراسي حالياً</td>
                                </tr>
                              );
                            }

                            return targetStudents.map(s => (
                              <tr key={s.id}>
                                <td className="px-4 py-3 text-xs text-zinc-500 font-bold">{s.id}</td>
                                <td className="px-4 py-3 text-sm font-bold text-zinc-800 dark:text-zinc-200">{s.name}</td>
                                <td className="px-4 py-2 text-center w-36">
                                  <div className="flex items-center justify-center gap-2">
                                    <input
                                      type="number"
                                      min={0}
                                      max={exam.maxScore}
                                      value={examScores[s.id] || ''}
                                      onChange={(e) => setExamScores(prev => ({ ...prev, [s.id]: e.target.value }))}
                                      placeholder="0"
                                      className="block w-20 text-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-1.5 px-2 text-sm text-zinc-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-zinc-450 dark:text-zinc-500 font-medium">/ {exam.maxScore}</span>
                                  </div>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-zinc-150 dark:border-zinc-800 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={handleSaveScores}
                disabled={actionLoading || exams.length === 0}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-bold py-3.5 cursor-pointer disabled:opacity-50 text-sm shadow-md"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ جميع الدرجات'}
              </button>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-slate-50 dark:bg-zinc-955 text-zinc-700 dark:text-zinc-300 font-bold py-3.5 cursor-pointer text-sm"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: REPORTS AND STATISTICS (Includes Printable Sheets)
          ======================================================== */}
      {activeModal === 'reports' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:relative print:inset-auto print:bg-transparent print:p-0">
          <div className="w-full max-w-4xl rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] print:max-h-none print:border-none print:shadow-none print:rounded-none">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50 shrink-0 no-print">
              <div>
                <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white">تقارير الطلاب التفصيلية</h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">استعرض واطبع تقارير الحضور والغياب والدرجات وحالة المدفوعات والكتب</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content - Left Sidebar & Right Grid layout */}
            <div className="flex flex-1 overflow-hidden print:overflow-visible">
              
              {/* Left Selector (Reports menu) */}
              <div className="w-64 bg-slate-50/80 dark:bg-zinc-900/30 border-l border-zinc-200 dark:border-zinc-800 p-4 space-y-2 shrink-0 overflow-y-auto no-print">
                <h4 className="text-xs font-black text-zinc-450 dark:text-zinc-500 mb-3 px-2">اختر نوع التقرير</h4>
                
                {[
                  { id: 'absence', label: 'تقرير غياب الطلاب', icon: AlertTriangle },
                  { id: 'excuse', label: 'تقرير أذونات الغياب', icon: UserCheck },
                  { id: 'general', label: 'تقرير النسبة العامة للدرجات', icon: Award },
                  { id: 'monthly', label: 'تقرير دفع الاشتراكات الشهرية', icon: FileSpreadsheet },
                  { id: 'booklets', label: 'تقرير دفع مذكرات المنهج', icon: ClipboardList },
                  { id: 'daily', label: 'تقرير الحضور اليومي للمجموعات', icon: Calendar }
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setActiveReport(r.id as any)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer text-right ${
                      activeReport === r.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-zinc-650 hover:bg-slate-200 dark:text-zinc-400 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <r.icon className="h-4.5 w-4.5 shrink-0" />
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>

              {/* Right Content Area (Parameters & Output Table) */}
              <div className="flex-1 flex flex-col overflow-y-auto p-6 print:p-0 print:overflow-visible">
                {dbLoading ? (
                  <div className="flex justify-center items-center py-24"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                ) : !activeReport ? (
                  <div className="flex flex-col items-center justify-center py-24 text-zinc-455 text-center no-print">
                    <FileText className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-4" />
                    <p className="font-extrabold text-base text-zinc-755 dark:text-zinc-300">لم يتم اختيار أي تقرير</p>
                    <p className="text-xs text-zinc-400 mt-1">الرجاء اختيار أحد التقارير من القائمة الجانبية لبدء العرض</p>
                  </div>
                ) : (
                  <>
                    {/* Report Parameters Panel */}
                    <div className="rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 p-4 mb-6 flex items-center justify-between no-print gap-4 flex-wrap">
                      <div className="flex items-center gap-4 flex-wrap">
                        {activeReport === 'absence' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-655 dark:text-zinc-400 font-bold">عدد مرات الغياب:</span>
                            <span className="text-xs text-zinc-500 font-bold">من</span>
                            <input
                              type="number"
                              min={0}
                              value={absenceFrom}
                              onChange={(e) => setAbsenceFrom(Number(e.target.value))}
                              className="w-16 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs text-center outline-none focus:border-blue-500 font-bold"
                            />
                            <span className="text-xs text-zinc-500 font-bold">إلى</span>
                            <input
                              type="number"
                              min={0}
                              value={absenceTo}
                              onChange={(e) => setAbsenceTo(Number(e.target.value))}
                              className="w-16 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs text-center outline-none focus:border-blue-500 font-bold"
                            />
                          </div>
                        )}

                        {activeReport === 'excuse' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-655 dark:text-zinc-400 font-bold">عدد مرات الأذونات:</span>
                            <span className="text-xs text-zinc-500 font-bold">من</span>
                            <input
                              type="number"
                              min={0}
                              value={excuseFrom}
                              onChange={(e) => setExcuseFrom(Number(e.target.value))}
                              className="w-16 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs text-center outline-none focus:border-blue-500 font-bold"
                            />
                            <span className="text-xs text-zinc-500 font-bold">إلى</span>
                            <input
                              type="number"
                              min={0}
                              value={excuseTo}
                              onChange={(e) => setExcuseTo(Number(e.target.value))}
                              className="w-16 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs text-center outline-none focus:border-blue-500 font-bold"
                            />
                          </div>
                        )}

                        {activeReport === 'general' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-655 dark:text-zinc-400 font-bold">النسبة العامة (%):</span>
                            <span className="text-xs text-zinc-500 font-bold">من</span>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={generalFrom}
                              onChange={(e) => setGeneralFrom(Number(e.target.value))}
                              className="w-20 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs text-center outline-none focus:border-blue-500 font-bold"
                            />
                            <span className="text-xs text-zinc-500 font-bold">إلى</span>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={generalTo}
                              onChange={(e) => setGeneralTo(Number(e.target.value))}
                              className="w-20 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs text-center outline-none focus:border-blue-500 font-bold"
                            />
                          </div>
                        )}

                        {activeReport === 'monthly' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-650 dark:text-zinc-400 font-bold">اختر الشهر الدراسي:</span>
                            <select
                              value={selectedReportMonth}
                              onChange={(e) => setSelectedReportMonth(e.target.value)}
                              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs outline-none focus:border-blue-500 font-bold"
                            >
                              <option value="سبتمبر">سبتمبر</option>
                              <option value="أكتوبر">أكتوبر</option>
                              <option value="نوفمبر">نوفمبر</option>
                              <option value="ديسمبر">ديسمبر</option>
                              <option value="يناير">يناير</option>
                              <option value="فبراير">فبراير</option>
                              <option value="مارس">مارس</option>
                              <option value="أبريل">أبريل</option>
                              <option value="مايو">مايو</option>
                            </select>
                          </div>
                        )}

                        {activeReport === 'booklets' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-650 dark:text-zinc-400 font-bold">اختر المذكرة:</span>
                            <select
                              value={selectedReportBooklet}
                              onChange={(e) => setSelectedReportBooklet(e.target.value)}
                              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs outline-none focus:border-blue-500 font-bold text-zinc-750 text-zinc-700 dark:text-zinc-300"
                            >
                              {allBookletNames.length === 0 ? (
                                <option value="">لا توجد مذكرات</option>
                              ) : (
                                allBookletNames.map(bName => (
                                  <option key={bName} value={bName}>{bName}</option>
                                ))
                              )}
                            </select>
                          </div>
                        )}

                        {activeReport === 'daily' && (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-zinc-655 dark:text-zinc-400">اختر التاريخ:</span>
                              <input
                                type="date"
                                value={selectedReportDate}
                                onChange={(e) => setSelectedReportDate(e.target.value)}
                                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs outline-none focus:border-blue-500 font-bold"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-zinc-655 dark:text-zinc-400">الصف الدراسي:</span>
                              <select
                                value={selectedReportGrade}
                                onChange={(e) => setSelectedReportGrade(e.target.value)}
                                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs outline-none focus:border-blue-500 font-bold text-zinc-700 dark:text-zinc-300"
                              >
                                <option value="all">كل الصفوف</option>
                                <option value="1">الصف الأول الإعدادي</option>
                                <option value="2">الصف الثاني الإعدادي</option>
                                <option value="3">الصف الثالث الإعدادي</option>
                              </select>
                            </div>
                          </>
                        )}
                      </div>

                      <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 text-white font-bold py-2 px-3 text-xs hover:bg-blue-700 cursor-pointer shadow-sm"
                      >
                        <Printer className="h-4 w-4" />
                        <span>طباعة التقرير</span>
                      </button>
                    </div>

                    <div className="printable-report-area flex-1 flex flex-col">
                      {/* Report Output Header (Only visible in Print or as preview) */}
                      <div className="text-center mb-8 border-b-2 border-zinc-800 pb-4 hidden print:block">
                      <h2 className="text-3xl font-extrabold text-zinc-900">أكاديمية مستر محمد حامد التعليمية</h2>
                      <p className="text-sm text-zinc-550 mt-1">السنة الدراسية: {year} | الفصل الدراسي: {term === '1' ? 'الأول' : 'الثاني'}</p>
                      <h3 className="text-xl font-bold text-zinc-850 mt-4 underline decoration-2 underline-offset-4">
                        {activeReport === 'absence' && `تقرير غياب الطلاب (الذين لديهم غياب من ${absenceFrom} إلى ${absenceTo} محاضرة)`}
                        {activeReport === 'excuse' && `تقرير أذونات الطلاب (الذين لديهم أذونات من ${excuseFrom} إلى ${excuseTo} إذن)`}
                        {activeReport === 'general' && `تقرير كشف الترتيب والنسبة العامة للطلاب (بنسبة من ${generalFrom}% إلى ${generalTo}%)`}
                        {activeReport === 'monthly' && `تقرير دفع الاشتراكات لشهر: ${selectedReportMonth}`}
                        {activeReport === 'booklets' && 'تقرير موقف دفع وتوزيع المذكرات والكتب'}
                        {activeReport === 'daily' && `كشف الحضور اليومي للمحاضرة بتاريخ: ${selectedReportDate} (${selectedReportGrade === 'all' ? 'كل الصفوف' : getGradeName(Number(selectedReportGrade))})`}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-2 text-left">تاريخ استخراج التقرير: {new Date().toLocaleDateString('ar-EG')}</p>
                    </div>

                    {/* Report Data Table */}
                    {activeReport === 'monthly' || activeReport === 'booklets' ? (
                      <div className="space-y-8 print:space-y-6">
                        {/* Summary Counts */}
                        <div className="flex gap-4 no-print flex-wrap">
                          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 rounded-xl border border-emerald-100 dark:border-emerald-900/20 font-bold text-xs">
                            عدد الذين دفعوا: {reportData.filter((r: any) => r.status === 'paid').length} طالب
                          </div>
                          <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 rounded-xl border border-rose-100 dark:border-rose-900/20 font-bold text-xs">
                            عدد الذين لم يدفعوا: {reportData.filter((r: any) => r.status !== 'paid').length} طالب
                          </div>
                        </div>

                        {/* Paid Students Table */}
                        <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-955 print:border-zinc-300">
                          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 px-4 py-3 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
                            <h4 className="text-sm font-black text-emerald-700 dark:text-emerald-450">الطلاب الذين دفعوا</h4>
                            <span className="text-xs font-bold text-emerald-600">العدد: {reportData.filter((r: any) => r.status === 'paid').length}</span>
                          </div>
                          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 print:divide-zinc-300">
                            <thead className="bg-slate-50 dark:bg-zinc-900 print:bg-slate-100">
                              <tr>
                                <th className="px-4 py-2.5 text-right text-xs font-bold text-zinc-500">كود</th>
                                <th className="px-4 py-2.5 text-right text-xs font-bold text-zinc-500">الاسم</th>
                                <th className="px-4 py-2.5 text-center text-xs font-bold text-zinc-500">الصف الدراسي</th>
                                <th className="px-4 py-2.5 text-center text-xs font-bold text-zinc-500">الحالة</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 print:divide-zinc-200">
                              {reportData.filter((r: any) => r.status === 'paid').length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="text-center py-6 text-xs text-zinc-400">لا يوجد طلاب دفعوا حتى الآن</td>
                                </tr>
                              ) : (
                                reportData.filter((r: any) => r.status === 'paid').map((row: any) => (
                                  <tr key={row.id}>
                                    <td className="px-4 py-2.5 text-xs font-bold text-zinc-500">{row.id}</td>
                                    <td className="px-4 py-2.5 text-sm font-extrabold text-black dark:text-black print:text-black">{row.name}</td>
                                    <td className="px-4 py-2.5 text-xs text-center text-zinc-500">{getGradeName(row.grade)}</td>
                                    <td className="px-4 py-2.5 text-xs text-center">
                                      <span className={`inline-block px-2.5 py-0.5 rounded-full ${row.confirmed ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'}`}>
                                        تم الدفع {row.confirmed ? '(مستلم)' : '(قيد التسليم)'}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Unpaid Students Table */}
                        <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-955 print:border-zinc-300">
                          <div className="bg-rose-50/50 dark:bg-rose-950/20 px-4 py-3 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
                            <h4 className="text-sm font-black text-rose-700 dark:text-rose-455">الطلاب الذين لم يدفعوا</h4>
                            <span className="text-xs font-bold text-rose-600">العدد: {reportData.filter((r: any) => r.status !== 'paid').length}</span>
                          </div>
                          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 print:divide-zinc-300">
                            <thead className="bg-slate-50 dark:bg-zinc-900 print:bg-slate-100">
                              <tr>
                                <th className="px-4 py-2.5 text-right text-xs font-bold text-zinc-500">كود</th>
                                <th className="px-4 py-2.5 text-right text-xs font-bold text-zinc-500">الاسم</th>
                                <th className="px-4 py-2.5 text-center text-xs font-bold text-zinc-500">الصف الدراسي</th>
                                <th className="px-4 py-2.5 text-center text-xs font-bold text-zinc-500">الحالة</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 print:divide-zinc-200">
                              {reportData.filter((r: any) => r.status !== 'paid').length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="text-center py-6 text-xs text-zinc-400">لا يوجد طلاب لم يدفعوا</td>
                                </tr>
                              ) : (
                                reportData.filter((r: any) => r.status !== 'paid').map((row: any) => (
                                  <tr key={row.id}>
                                    <td className="px-4 py-2.5 text-xs font-bold text-zinc-500">{row.id}</td>
                                    <td className="px-4 py-2.5 text-sm font-extrabold text-black dark:text-black print:text-black">{row.name}</td>
                                    <td className="px-4 py-2.5 text-xs text-center text-zinc-500">{getGradeName(row.grade)}</td>
                                    <td className="px-4 py-2.5 text-xs text-center">
                                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                                        لم يتم الدفع
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-955 print:border-zinc-300">
                        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 print:divide-zinc-300">
                          <thead className="bg-slate-50 dark:bg-zinc-900 print:bg-slate-100">
                            <tr>
                              <th className="px-4 py-2.5 text-right text-xs font-bold text-zinc-500">كود</th>
                              <th className="px-4 py-2.5 text-right text-xs font-bold text-zinc-500">الاسم</th>
                              <th className="px-4 py-2.5 text-center text-xs font-bold text-zinc-500">الصف الدراسي</th>
                              
                              {/* Dynamic column based on report type */}
                              {activeReport === 'absence' && (
                                <th className="px-4 py-2.5 text-center text-xs font-bold text-zinc-500">عدد مرات الغياب</th>
                              )}
                              {activeReport === 'excuse' && (
                                <th className="px-4 py-2.5 text-center text-xs font-bold text-zinc-500">عدد مرات الأذونات</th>
                              )}
                              {activeReport === 'general' && (
                                <th className="px-4 py-2.5 text-center text-xs font-bold text-zinc-500">النسبة العامة</th>
                              )}
                              {activeReport === 'daily' && (
                                <>
                                  <th className="px-4 py-2.5 text-center text-xs font-bold text-zinc-500">الحالة</th>
                                  <th className="px-4 py-2.5 text-right text-xs font-bold text-zinc-500">الملاحظات</th>
                                </>
                              )}

                              {activeReport !== 'daily' && (
                                <>
                                  <th className="px-4 py-2.5 text-center text-xs font-bold text-zinc-500">تليفون الطالب</th>
                                  <th className="px-4 py-2.5 text-center text-xs font-bold text-zinc-500">تليفون ولي الأمر</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 print:divide-zinc-200">
                            {reportData.length === 0 ? (
                              <tr>
                                <td colSpan={activeReport === 'daily' ? 5 : 6} className="text-center py-6 text-xs text-zinc-400">لا توجد بيانات لعرضها</td>
                              </tr>
                            ) : (
                              reportData.map((row: any) => (
                                <tr key={row.id}>
                                  <td className="px-4 py-2.5 text-xs font-bold text-zinc-500">{row.id}</td>
                                  <td className="px-4 py-2.5 text-sm font-extrabold text-black dark:text-black print:text-black">{row.name}</td>
                                  <td className="px-4 py-2.5 text-xs text-center text-zinc-500">{getGradeName(row.grade)}</td>
                                  
                                  {/* Dynamic cells */}
                                  {activeReport === 'absence' && (
                                    <td className="px-4 py-2.5 text-sm font-bold text-center text-rose-600 dark:text-rose-450">{row.val} محاضرات</td>
                                  )}
                                  {activeReport === 'excuse' && (
                                    <td className="px-4 py-2.5 text-sm font-bold text-center text-amber-600 dark:text-amber-400">{row.val} أذونات</td>
                                  )}
                                  {activeReport === 'general' && (
                                    <td className="px-4 py-2.5 text-sm font-bold text-center text-blue-600 dark:text-blue-400">{Number(row.val).toFixed(1)}%</td>
                                  )}
                                  {activeReport === 'daily' && (
                                    <>
                                      <td className="px-4 py-2.5 text-xs text-center">
                                        <span className={`inline-block px-2.5 py-0.5 rounded-full ${
                                          row.status === 'present' || row.status === 'حاضر'
                                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30'
                                            : row.status === 'absent' || row.status.includes('غائب')
                                            ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 border border-rose-100 dark:border-rose-900/30'
                                            : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                                        }`}>
                                          {row.status === 'present' ? 'حاضر' : row.status === 'absent' ? 'غائب' : row.status === 'excused' ? 'إذن' : row.status}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2.5 text-xs text-right text-zinc-650 dark:text-zinc-450 max-w-[200px] truncate">{row.notes || '-'}</td>
                                    </>
                                  )}

                                  {activeReport !== 'daily' && (
                                    <>
                                      <td className="px-4 py-2.5 text-xs text-center text-zinc-600 dark:text-zinc-450">{row.phone || '-'}</td>
                                      <td className="px-4 py-2.5 text-xs text-center text-zinc-600 dark:text-zinc-450">{row.parentPhone || '-'}</td>
                                    </>
                                  )}
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Report signatures panel (Only visible in Print) */}
                    <div className="mt-16 flex justify-between items-center text-sm font-bold border-t border-zinc-200 pt-6 hidden print:flex">
                      <div>المساعد المسؤول: _______________________</div>
                      <div>توقيع الأستاذ: _______________________</div>
                    </div>
                      </div>
                  </>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-zinc-150 dark:border-zinc-800 flex justify-end bg-slate-50/50 dark:bg-zinc-900/50 shrink-0 no-print">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-slate-50 dark:bg-zinc-955 text-zinc-755 dark:text-zinc-300 font-bold py-2.5 px-6 cursor-pointer text-sm"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 5: QR CODE CARD SYSTEM
          ======================================================== */}
      {activeModal === 'qrCode' && (() => {
        const gradeStudents = students.filter(s => s.grade === selectedQrGrade);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:relative print:inset-auto print:bg-transparent print:p-0">
            <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col print:max-w-none print:w-full print:border-none print:shadow-none print:rounded-none">
              
              {/* Modal Header */}
              <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50 shrink-0 no-print">
                <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white">بطاقة الطالب و QR Code</h3>
                <button onClick={() => setActiveModal(null)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto print:overflow-visible print:p-0">
                
                {dbLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                ) : students.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400 text-sm">لا يوجد طلاب مسجلين لإنشاء بطاقات لهم</div>
                ) : (
                  <>
                    {/* Tab Selector */}
                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-zinc-950 rounded-2xl no-print">
                      <button
                        type="button"
                        onClick={() => setQrMode('single')}
                        className={`flex-1 text-center py-2 px-3 text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                          qrMode === 'single'
                            ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        كارت طالب منفرد
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrMode('grade')}
                        className={`flex-1 text-center py-2 px-3 text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                          qrMode === 'grade'
                            ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        كروت صف كامل
                      </button>
                    </div>

                    {qrMode === 'single' ? (
                      <>
                        <div className="no-print">
                          <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-350 mb-1.5">اختر الطالب لعرض كود البطاقة</label>
                          <select
                            value={selectedQrStudentId}
                            onChange={(e) => setSelectedQrStudentId(e.target.value)}
                            className="block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 py-2.5 px-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-blue-500 font-bold"
                          >
                            {students.map(s => (
                              <option key={s.id} value={s.id}>{s.name} (كود: {s.id})</option>
                            ))}
                          </select>
                        </div>

                        {/* ID Card Display Wrapper */}
                        {selectedQrStudent && (
                          <div className="flex flex-col items-center justify-center py-6">
                            
                            {/* Printable ID Card Container */}
                            <div className="printable-report-area print-card w-80 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-800 text-white p-6 shadow-xl flex flex-col items-center justify-between text-center relative overflow-hidden border border-indigo-700 print:w-72 print:shadow-none print:border-zinc-300 print:text-zinc-900 print:from-white print:to-white">
                              
                              {/* Decorative Background for Print vs Screen */}
                              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mt-8 print:hidden" />
                              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-8 -mb-8 print:hidden" />

                              {/* Card Header */}
                              <div className="mb-4 shrink-0">
                                <h4 className="text-lg font-black tracking-wide print:text-zinc-900">أكاديمية مستر محمد حامد التعليمية</h4>
                                <p className="text-[10px] text-blue-100 dark:text-blue-200 uppercase font-black tracking-widest mt-0.5 print:text-zinc-550">بطاقة عضوية الطالب الذكية</p>
                              </div>

                              {/* QR Code Graphic */}
                              <div className="bg-white p-3.5 rounded-2xl shadow-md mb-4 flex items-center justify-center border border-zinc-150 print:border-zinc-300">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${selectedQrStudent.id}`}
                                  alt={`QR Code for ${selectedQrStudent.name}`}
                                  className="h-32 w-32 shrink-0"
                                />
                              </div>

                              {/* Student Details */}
                              <div className="w-full shrink-0">
                                <h3 className="text-xl font-extrabold truncate print:text-zinc-900">{selectedQrStudent.name}</h3>
                                <div className="mt-2 text-xs font-semibold flex items-center justify-center gap-1 bg-white/10 print:bg-slate-100 print:text-zinc-700 py-1 px-3 rounded-full mx-auto w-max">
                                  <span>كود الطالب:</span>
                                  <span className="font-extrabold text-sm tracking-wider">{selectedQrStudent.id}</span>
                                </div>
                                <p className="text-[10px] text-blue-200 mt-2 font-medium print:text-zinc-500">
                                  {getGradeName(selectedQrStudent.grade)} | السنة: {year}
                                </p>
                              </div>
                              
                            </div>

                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-4">
                        {/* Grade Selector */}
                        <div className="no-print">
                          <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-350 mb-1.5">اختر الصف الدراسي</label>
                          <div className="flex gap-2">
                            {[1, 2, 3].map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setSelectedQrGrade(g as 1 | 2 | 3)}
                                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl cursor-pointer transition-all border ${
                                  selectedQrGrade === g
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-white dark:bg-zinc-955 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-slate-50'
                                }`}
                              >
                                {getGradeName(g)}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Cards Grid Preview on Screen */}
                        <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-zinc-955/20 max-h-[300px] overflow-y-auto no-print">
                          {gradeStudents.length === 0 ? (
                            <div className="text-center py-8 text-zinc-400 text-sm">لا يوجد طلاب في هذا الصف</div>
                          ) : (
                            <div className="grid grid-cols-1 gap-3">
                              {gradeStudents.map((student) => (
                                <div
                                  key={student.id}
                                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm"
                                >
                                  <div className="flex-1 text-right">
                                    <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">{student.name}</h4>
                                    <p className="text-xs text-zinc-550 mt-1">كود الطالب: <span className="font-bold">{student.id}</span></p>
                                  </div>
                                  <div className="shrink-0 bg-white p-1 rounded-lg border border-zinc-150">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={`https://api.qrserver.com/v1/create-qr-code/?size=60x65&data=${student.id}`}
                                      alt="QR Preview"
                                      className="h-10 w-10 shrink-0"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Print-Only Grid of Cards with Crop Marks */}
                        {gradeStudents.length > 0 && (
                          <div className="hidden print:grid print:grid-cols-2 print:gap-0 print:border-t print:border-r print:border-dashed print:border-zinc-400 print:w-max print:mx-auto print:my-0">
                            {gradeStudents.map((student) => (
                              <div
                                key={student.id}
                                className="print-card print:w-[9.5cm] print:h-[6.0cm] print:border-b print:border-l print:border-dashed print:border-zinc-400 print:p-5 print:flex print:flex-row print:items-center print:justify-between print:text-zinc-900 print:bg-white print:rounded-none print:shadow-none print:break-inside-avoid print:page-break-inside-avoid"
                                style={{ direction: 'rtl' }}
                              >
                                {/* Details */}
                                <div className="flex-1 flex flex-col justify-center text-right pl-4">
                                  <h4 className="text-xs font-black text-zinc-900 mb-0.5">أكاديمية مستر محمد حامد التعليمية</h4>
                                  <p className="text-[8px] text-zinc-550 uppercase font-black tracking-widest mb-3">بطاقة عضوية الطالب الذكية</p>
                                  <h3 className="text-base font-black text-zinc-900 truncate mb-1.5">{student.name}</h3>
                                  <div className="text-[10px] font-bold text-zinc-700 bg-slate-100 py-0.5 px-2.5 rounded-full w-max mb-1.5">
                                    <span>كود الطالب: </span>
                                    <span className="font-extrabold tracking-wider">{student.id}</span>
                                  </div>
                                  <p className="text-[9px] text-zinc-450 font-bold">
                                    {getGradeName(student.grade)} | السنة: {year}
                                  </p>
                                </div>
                                {/* QR */}
                                <div className="bg-white p-1.5 rounded-xl border border-zinc-200 flex items-center justify-center shrink-0 shadow-sm">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${student.id}`}
                                    alt="QR Code"
                                    className="h-16 w-16 shrink-0"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Actions */}
              <div className="p-6 border-t border-zinc-150 dark:border-zinc-800 flex gap-3 bg-slate-50/50 dark:bg-zinc-900/50 shrink-0 no-print">
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={qrMode === 'single' ? !selectedQrStudent : gradeStudents.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-bold py-3 text-sm cursor-pointer disabled:opacity-50 hover:bg-blue-700 transition-all shadow-sm"
                >
                  <Printer className="h-4 w-4" />
                  <span>طباعة الكروت / تصدير PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-slate-50 dark:bg-zinc-955 text-zinc-700 dark:text-zinc-300 font-bold py-3 text-sm cursor-pointer"
                >
                  إغلاق
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </>
  );
}
