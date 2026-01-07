'use client';

import { Tag, Edit } from 'lucide-react';

interface OpportunityCardProps {
  opportunity: any;
  onOpen?: () => void;
}

export function OpportunityCard({ opportunity, onOpen }: OpportunityCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 cursor-grab active:cursor-grabbing hover:shadow-md border border-gray-200 relative group">
      {/* Open Modal Button */}
      {onOpen && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onOpen();
          }}
          onMouseDown={(e) => {
            // Prevent drag when clicking the button
            e.stopPropagation();
            e.preventDefault();
          }}
          onTouchStart={(e) => {
            // Prevent drag on touch devices
            e.stopPropagation();
          }}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-100 hover:bg-teal-100 text-gray-600 hover:text-teal-600 transition-colors opacity-0 group-hover:opacity-100 z-10"
          style={{ pointerEvents: 'auto' }}
          title="Open details"
        >
          <Edit className="w-4 h-4" />
        </button>
      )}
      
      <h4 className="font-semibold text-brown-800 mb-2 pr-8">{opportunity.artistName}</h4>
      
      {opportunity.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{opportunity.description}</p>
      )}

      {opportunity.labels && opportunity.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {opportunity.labels.slice(0, 3).map((label: any) => (
            <span
              key={label.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-100 text-teal-800 rounded text-xs"
            >
              <Tag className="w-3 h-3" />
              {label.name}
            </span>
          ))}
          {opportunity.labels.length > 3 && (
            <span className="text-xs text-gray-500">+{opportunity.labels.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
}

