'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { SettingsView } from '@/components/settings/SettingsView';

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brown-800">Settings</h1>
          <p className="text-brown-600 mt-1">Manage your venue and team</p>
        </div>
        <SettingsView />
      </div>
    </MainLayout>
  );
}

