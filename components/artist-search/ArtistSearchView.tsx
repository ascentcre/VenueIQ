'use client';

import { useState } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import { ArtistInfoCard } from './ArtistInfoCard';

export function ArtistSearchView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [artistInfo, setArtistInfo] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter an artist name');
      return;
    }

    setIsLoading(true);
    setError('');
    setArtistInfo(null);

    try {
      const response = await fetch('/api/artist/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to search for artist';
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
          // Include details if available (in development)
          if (data.details) {
            console.error('API Error Details:', data.details);
            errorMessage += ` (${data.details})`;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        setError(errorMessage);
        return;
      }

      const data = await response.json();
      setArtistInfo(data);
    } catch (err) {
      console.error('Network or other error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(`Network error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProspect = async () => {
    if (!artistInfo) return;

    try {
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: artistInfo.name,
          artistInfo: artistInfo,
          stage: 'New Prospect',
        }),
      });

      if (response.ok) {
        alert('Artist added to pipeline as New Prospect!');
        setArtistInfo(null);
        setSearchQuery('');
      } else {
        alert('Failed to add artist to pipeline');
      }
    } catch (err) {
      alert('An error occurred');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for an artist (e.g., 'Holly Tucker from Waco')"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Search
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {artistInfo && (
        <div className="space-y-4">
          <ArtistInfoCard artistInfo={artistInfo} />
          <div className="flex justify-end">
            <button
              onClick={handleAddProspect}
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Prospect
            </button>
          </div>
        </div>
      )}

      {!artistInfo && !isLoading && !error && (
        <div className="text-center py-12 text-gray-500">
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>Search for an artist to get started</p>
        </div>
      )}
    </div>
  );
}

