'use client';

import React from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { LayoutDashboard, Users, Wallet, CalendarDays, LogOut, GraduationCap } from 'lucide-react';

interface SidebarProps {
  user: {
    username: string;
    name: string;
    role: 'admin' | 'assistant';
  } | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const year = params.year as string;
  const term = params.term as string;

  const handleLogout = () => {
    localStorage.removeItem('mimi_user');
    router.push('/login');
  };

  const navItems = [
    {
      label: 'لوحة التحكم',
      icon: LayoutDashboard,
      path: `/years/${year}/terms/${term}/dashboard`,
      roles: ['admin', 'assistant']
    },
    {
      label: 'إدارة الطلاب',
      icon: Users,
      path: `/years/${year}/terms/${term}/students`,
      roles: ['admin', 'assistant']
    },
    {
      label: 'الحسابات المالية',
      icon: Wallet,
      path: `/years/${year}/terms/${term}/financials`,
      roles: ['admin', 'assistant'] // both can access, but admin sees review dashboard and assistant sees logging status
    }
  ];

  return (
    <aside className="no-print w-64 shrink-0 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-screen sticky top-0 shadow-sm">
      <div className="flex flex-col">
        {/* Brand/Logo */}
        <div className="p-6 border-b border-zinc-150 dark:border-zinc-850 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-900 dark:text-white leading-tight">أكاديمية ميمي</h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">لوحة الإدارة</p>
          </div>
        </div>

        {/* Year / Term Indicator */}
        <div className="px-4 py-4">
          <div className="rounded-2xl bg-slate-50 dark:bg-zinc-950 p-3 flex flex-col gap-1 border border-zinc-150 dark:border-zinc-800/80">
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-bold">
              <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-500" />
              <span>السنة الدراسية: {year}</span>
            </div>
            <div className="text-xs font-black text-zinc-700 dark:text-zinc-300 mr-6">
              الفصل الدراسي: {term === '1' ? 'الترم الأول' : 'الترم الثاني'}
            </div>
            <button
              onClick={() => router.push(`/years/${year}/terms`)}
              className="mt-2 text-right text-xs text-blue-600 dark:text-blue-400 font-extrabold hover:underline cursor-pointer"
            >
              تغيير الترم أو السنة ←
            </button>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="px-3 py-4 space-y-1.5">
          {navItems.map((item) => {
            const isTargetActive = pathname === item.path || pathname?.startsWith(item.path + '/');
            if (user && !item.roles.includes(user.role)) return null;

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                  isTargetActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-zinc-650 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isTargetActive ? 'text-white' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-zinc-150 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-900/40">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-extrabold text-base border border-blue-200/50 dark:border-blue-900/50">
            {user?.name ? user.name[0] : 'م'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-extrabold text-zinc-950 dark:text-white truncate">{user?.name}</h4>
            <span className="inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-black tracking-wider uppercase bg-blue-100/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
              {user?.role === 'admin' ? 'مدرس (المدير)' : 'مساعد'}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-650 font-bold py-2.5 text-xs transition-all cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
