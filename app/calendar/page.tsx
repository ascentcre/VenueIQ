'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { CalendarView } from '@/components/calendar/CalendarView';
import { requireAuth } from '@/lib/auth-utils';

export default function CalendarPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brown-800">Calendar</h1>
          <p className="text-brown-600 mt-1">Manage your events in one place. Centralize documents, notes, and labels.</p>
        </div>
        <CalendarView />
      </div>
    </MainLayout>
  );
}

