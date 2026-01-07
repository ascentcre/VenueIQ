'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { PipelineBoard } from '@/components/pipeline/PipelineBoard';

export default function PipelinePage() {
  return (
    <MainLayout>
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-shrink-0 mb-6">
          <h1 className="text-3xl font-bold text-brown-800">Pipeline</h1>
          <p className="text-brown-600 mt-1">Manage your booking opportunities</p>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <PipelineBoard />
        </div>
      </div>
    </MainLayout>
  );
}

