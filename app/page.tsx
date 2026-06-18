'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('mimi_user');
    if (user) {
      router.push('/years');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-500" />
        <p className="text-sm text-zinc-550 dark:text-zinc-400 font-bold">جاري تحويلك إلى النظام...</p>
      </div>
    </div>
  );
}
