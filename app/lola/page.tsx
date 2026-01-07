'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { LolaChat } from '@/components/lola/LolaChat';

export default function LolaPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brown-800">Lola</h1>
          <p className="text-brown-600 mt-1">Your AI research assistant and data analyst for live music venues</p>
        </div>
        <LolaChat />
      </div>
    </MainLayout>
  );
}

