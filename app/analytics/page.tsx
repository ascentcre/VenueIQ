'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAccess() {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/user/analytics-access');
          if (response.ok) {
            const data = await response.json();
            setHasAccess(data.hasAccess);
            if (!data.hasAccess) {
              router.push('/pipeline');
            }
          }
        } catch (error) {
          console.error('Failed to check analytics access:', error);
        }
      }
    }
    checkAccess();
  }, [session, router]);

  if (hasAccess === null) {
    return (
      <MainLayout>
        <div className="text-center py-12">Loading...</div>
      </MainLayout>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brown-800">Analytics</h1>
          <p className="text-brown-600 mt-1">Track your venue's performance metrics</p>
        </div>
        <AnalyticsDashboard />
      </div>
    </MainLayout>
  );
}

