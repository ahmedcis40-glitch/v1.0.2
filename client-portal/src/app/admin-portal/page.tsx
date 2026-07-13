'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPortalPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin-portal/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
    </div>
  );
}
