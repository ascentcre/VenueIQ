'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface AddProspectModalProps {
  isOpen: boolean;
  stages: string[];
  onClose: () => void;
  onCreated?: () => void;
}

export function AddProspectModal({ isOpen, stages, onClose, onCreated }: AddProspectModalProps) {
  const [artistName, setArtistName] = useState('');
  const [stage, setStage] = useState(stages[0] || 'New Prospect');
  const [submitting, setSubmitting] = useState(false);


  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistName.trim()) {
      alert('Artist name is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: artistName.trim(),
          stage,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create prospect');
      }
      onClose();
      if (onCreated) onCreated();
      // reset form state
      setArtistName('');
      setStage(stages[0] || 'New Prospect');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create prospect';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-xl font-bold text-brown-800">Add Prospect</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Artist Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="e.g., The Midnight"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              disabled={submitting}
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stage
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
              disabled={submitting}
            >
              {stages.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

        </form>

        <div className="flex items-center justify-end gap-3 p-5 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit as any}
            className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 flex items-center gap-2"
            disabled={submitting}
          >
            <Plus className="w-4 h-4" />
            {submitting ? 'Adding…' : 'Add Prospect'}
          </button>

        </div>
      </div>
    </div>
  );
}


