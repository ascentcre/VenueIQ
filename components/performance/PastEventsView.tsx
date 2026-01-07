'use client';

import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Download, Search, Filter, X } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  artistName?: string;
  startDate: string;
  performance?: {
    eventName?: string;
    genre?: string;
    ticketsSold: number;
    capacity: number;
    capacityUtilization?: number;
    totalGrossRevenue?: number;
    netEventIncome?: number;
    profitMargin?: number;
    artist?: { name: string };
  };
}

interface PastEventsViewProps {
  onEdit: (eventId: string) => void;
}

export function PastEventsView({ onEdit }: PastEventsViewProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState<string[]>([]);
  const [profitFilter, setProfitFilter] = useState<'all' | 'profitable' | 'break-even' | 'loss'>('all');
  const [sortColumn, setSortColumn] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const genres = ['Rock', 'Jazz', 'Hip-Hop', 'Country', 'Electronic', 'Blues', 'Folk', 'Comedy', 'Other'];

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, startDate, endDate, searchQuery, genreFilter, profitFilter, sortColumn, sortDirection]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (searchQuery) params.append('search', searchQuery);
      if (genreFilter.length > 0) params.append('genre', genreFilter.join(','));
      if (profitFilter !== 'all') params.append('profitFilter', profitFilter);

      const res = await fetch(`/api/events/performance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => {
        const eventName = event.performance?.eventName || event.title || event.artistName || '';
        const artistName = event.performance?.artist?.name || event.artistName || '';
        return eventName.toLowerCase().includes(query) || artistName.toLowerCase().includes(query);
      });
    }

    // Genre filter
    if (genreFilter.length > 0) {
      filtered = filtered.filter(event => 
        event.performance?.genre && genreFilter.includes(event.performance.genre)
      );
    }

    // Profit filter
    if (profitFilter !== 'all') {
      filtered = filtered.filter(event => {
        const netIncome = event.performance?.netEventIncome || 0;
        switch (profitFilter) {
          case 'profitable':
            return netIncome > 0;
          case 'break-even':
            return netIncome === 0;
          case 'loss':
            return netIncome < 0;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'date':
          aValue = new Date(a.startDate).getTime();
          bValue = new Date(b.startDate).getTime();
          break;
        case 'name':
          aValue = (a.performance?.eventName || a.title || '').toLowerCase();
          bValue = (b.performance?.eventName || b.title || '').toLowerCase();
          break;
        case 'attendance':
          aValue = a.performance?.ticketsSold || 0;
          bValue = b.performance?.ticketsSold || 0;
          break;
        case 'capacity':
          aValue = a.performance?.capacityUtilization || 0;
          bValue = b.performance?.capacityUtilization || 0;
          break;
        case 'revenue':
          aValue = a.performance?.totalGrossRevenue || 0;
          bValue = b.performance?.totalGrossRevenue || 0;
          break;
        case 'profit':
          aValue = a.performance?.netEventIncome || 0;
          bValue = b.performance?.netEventIncome || 0;
          break;
        case 'margin':
          aValue = a.performance?.profitMargin || 0;
          bValue = b.performance?.profitMargin || 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredEvents(filtered);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event performance data?')) {
      return;
    }

    try {
      const res = await fetch(`/api/events/${eventId}/performance`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadEvents();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  const handleExport = () => {
    const csvRows = [];
    
    // Header
    csvRows.push([
      'Date',
      'Event Name',
      'Artist',
      'Genre',
      'Attendance',
      'Capacity',
      'Capacity %',
      'Gross Revenue',
      'Net Profit',
      'Margin %',
    ].join(','));

    // Data rows
    filteredEvents.forEach(event => {
      const perf = event.performance;
      csvRows.push([
        new Date(event.startDate).toLocaleDateString(),
        perf?.eventName || event.title || '',
        perf?.artist?.name || event.artistName || '',
        perf?.genre || '',
        perf?.ticketsSold || 0,
        perf?.capacity || 0,
        (perf?.capacityUtilization || 0).toFixed(1),
        (perf?.totalGrossRevenue || 0).toFixed(2),
        (perf?.netEventIncome || 0).toFixed(2),
        (perf?.profitMargin || 0).toFixed(1),
      ].join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-performance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setGenreFilter([]);
    setProfitFilter('all');
  };

  // Calculate summary stats
  const summaryStats = {
    totalEvents: filteredEvents.length,
    totalRevenue: filteredEvents.reduce((sum, e) => sum + (e.performance?.totalGrossRevenue || 0), 0),
    totalProfit: filteredEvents.reduce((sum, e) => sum + (e.performance?.netEventIncome || 0), 0),
    avgCapacity: filteredEvents.length > 0
      ? filteredEvents.reduce((sum, e) => sum + (e.performance?.capacityUtilization || 0), 0) / filteredEvents.length
      : 0,
    avgProfit: filteredEvents.length > 0
      ? filteredEvents.reduce((sum, e) => sum + (e.performance?.netEventIncome || 0), 0) / filteredEvents.length
      : 0,
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading events...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Events</p>
          <p className="text-2xl font-bold text-brown-800">{summaryStats.totalEvents}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-brown-800">
            ${summaryStats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Profit</p>
          <p className="text-2xl font-bold text-brown-800">
            ${summaryStats.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Avg Capacity</p>
          <p className="text-2xl font-bold text-brown-800">{summaryStats.avgCapacity.toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Avg Profit/Event</p>
          <p className="text-2xl font-bold text-brown-800">
            ${summaryStats.avgProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <select
              value={profitFilter}
              onChange={(e) => setProfitFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Events</option>
              <option value="profitable">Profitable</option>
              <option value="break-even">Break-even</option>
              <option value="loss">Loss</option>
            </select>
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {genres.map(genre => (
            <label key={genre} className="flex items-center">
              <input
                type="checkbox"
                checked={genreFilter.includes(genre)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setGenreFilter([...genreFilter, genre]);
                  } else {
                    setGenreFilter(genreFilter.filter(g => g !== genre));
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm">{genre}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('date')}
                >
                  Date {sortColumn === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Event Name {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Artist</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Genre</th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('attendance')}
                >
                  Attendance {sortColumn === 'attendance' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('capacity')}
                >
                  Capacity % {sortColumn === 'capacity' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('revenue')}
                >
                  Gross Revenue {sortColumn === 'revenue' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('profit')}
                >
                  Net Profit {sortColumn === 'profit' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('margin')}
                >
                  Margin % {sortColumn === 'margin' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEvents.map((event) => {
                const perf = event.performance;
                const isExpanded = expandedEventId === event.id;
                return (
                  <React.Fragment key={event.id}>
                    <tr
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                    >
                      <td className="px-4 py-3 text-sm">
                        {new Date(event.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {perf?.eventName || event.title || ''}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {perf?.artist?.name || event.artistName || ''}
                      </td>
                      <td className="px-4 py-3 text-sm">{perf?.genre || ''}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        {perf?.ticketsSold || 0} / {perf?.capacity || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {(perf?.capacityUtilization || 0).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        ${(perf?.totalGrossRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${
                        (perf?.netEventIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${(perf?.netEventIncome || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right ${
                        (perf?.profitMargin || 0) >= 20 ? 'text-green-600' : 
                        (perf?.profitMargin || 0) >= 10 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {(perf?.profitMargin || 0).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => onEdit(event.id)}
                            className="p-1 text-teal-600 hover:bg-teal-50 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && perf && (
                      <tr>
                        <td colSpan={11} className="px-4 py-4 bg-gray-50">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <h4 className="font-semibold mb-2">Event Details</h4>
                              <p><strong>Event Date:</strong> {new Date(event.startDate).toLocaleString()}</p>
                              <p><strong>Genre:</strong> {perf.genre || 'N/A'}</p>
                              <p><strong>Capacity:</strong> {perf.capacity}</p>
                              <p><strong>Tickets Sold:</strong> {perf.ticketsSold}</p>
                              <p><strong>Comp Tickets:</strong> {perf.compTickets || 0}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Financial Summary</h4>
                              <p><strong>Gross Revenue:</strong> ${(perf.totalGrossRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              <p><strong>Net Profit:</strong> ${(perf.netEventIncome || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              <p><strong>Profit Margin:</strong> {(perf.profitMargin || 0).toFixed(1)}%</p>
                              <p><strong>Capacity Utilization:</strong> {(perf.capacityUtilization || 0).toFixed(1)}%</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {filteredEvents.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No events found. {events.length === 0 ? 'Create your first event performance record!' : 'Try adjusting your filters.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

