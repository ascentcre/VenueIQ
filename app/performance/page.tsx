'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PerformanceForm } from '@/components/performance/PerformanceForm';
import { PastEventsView } from '@/components/performance/PastEventsView';

export default function PerformancePage() {
  const [viewMode, setViewMode] = useState<'create' | 'view'>('create');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brown-800 mb-2">Event Performance Tracking</h1>
          <p className="text-gray-600">
            The more data you input, the better your analytics become. Lola, your AI assistant, 
            analyzes past events and historical data to uncover insights and trends—helping you make 
            smarter decisions for future shows.
          </p>
        </div>

        <div>
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
            <button
              onClick={() => {
                setViewMode('create');
                setEditingEventId(null);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'create'
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Create New Event
            </button>
            <button
              onClick={() => setViewMode('view')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'view'
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              View Past Events
            </button>
          </div>
        </div>

        {viewMode === 'create' ? (
          <PerformanceForm
            eventId={editingEventId}
            onSave={() => {
              setViewMode('view');
              setEditingEventId(null);
            }}
            onCancel={() => {
              setEditingEventId(null);
            }}
          />
        ) : (
          <PastEventsView
            onEdit={(eventId) => {
              setEditingEventId(eventId);
              setViewMode('create');
            }}
          />
        )}
      </div>
    </MainLayout>
  );
}

