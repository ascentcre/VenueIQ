'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { PipelineBoard } from '@/components/pipeline/PipelineBoard';

export default function PipelinePage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brown-800">Pipeline</h1>
          <p className="text-brown-600 mt-1">Manage your booking opportunities</p>
        </div>
        <PipelineBoard />
      </div>
    </MainLayout>
  );
}

