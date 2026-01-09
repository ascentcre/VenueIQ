'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Users, Mail, Trash2, Eye, EyeOff, Building2 } from 'lucide-react';
import { TemplateManager } from '@/components/performance/TemplateManager';

export function SettingsView() {
  const { data: session } = useSession();
  const [venueMembers, setVenueMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [venueDetails, setVenueDetails] = useState({
    name: '',
    city: '',
    state: '',
    zipcode: '',
    capacity: '',
  });
  const [isLoadingVenue, setIsLoadingVenue] = useState(true);
  const [isSavingVenue, setIsSavingVenue] = useState(false);
  const [venueError, setVenueError] = useState('');

  useEffect(() => {
    fetchMembers();
    fetchVenueDetails();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/venue/members');
      if (response.ok) {
        const data = await response.json();
        setVenueMembers(data);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVenueDetails = async () => {
    try {
      const response = await fetch('/api/venue/current');
      if (response.ok) {
        const data = await response.json();
        if (data.name) {
          setVenueDetails({
            name: data.name || '',
            city: data.city || '',
            state: data.state || '',
            zipcode: data.zipcode || '',
            capacity: data.capacity?.toString() || '',
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch venue details:', error);
    } finally {
      setIsLoadingVenue(false);
    }
  };

  const handleVenueUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setVenueError('');

    if (!venueDetails.name || !venueDetails.city || !venueDetails.state || !venueDetails.zipcode || !venueDetails.capacity) {
      setVenueError('Please fill in all fields');
      return;
    }

    setIsSavingVenue(true);
    try {
      const response = await fetch('/api/venue/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...venueDetails,
          capacity: parseInt(venueDetails.capacity),
        }),
      });

      if (response.ok) {
        alert('Venue details updated successfully!');
      } else {
        const data = await response.json();
        setVenueError(data.error || 'Failed to update venue details');
      }
    } catch (error) {
      setVenueError('An error occurred. Please try again.');
    } finally {
      setIsSavingVenue(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;

    setIsInviting(true);
    try {
      const response = await fetch('/api/venue/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newUserEmail }),
      });

      if (response.ok) {
        setNewUserEmail('');
        fetchMembers();
        alert('Invitation sent!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setIsInviting(false);
    }
  };

  const handleToggleAnalytics = async (memberId: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/venue/members/${memberId}/analytics`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canViewAnalytics: !currentValue }),
      });

      if (response.ok) {
        fetchMembers();
      }
    } catch (error) {
      alert('Failed to update analytics access');
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;

    try {
      const response = await fetch(`/api/venue/members/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMembers();
      }
    } catch (error) {
      alert('Failed to remove user');
    }
  };

  const currentUser = venueMembers.find((m) => m.user.id === session?.user?.id);
  const isAdmin = currentUser?.role === 'admin';

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Venue Details */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-brown-800 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Venue Details
          </h2>

          {isLoadingVenue ? (
            <div className="text-center py-4 text-gray-500">Loading venue details...</div>
          ) : (
            <form onSubmit={handleVenueUpdate} className="space-y-4">
              {venueError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {venueError}
                </div>
              )}

              <div>
                <label htmlFor="venueName" className="block text-sm font-medium text-gray-700 mb-1">
                  Venue Name *
                </label>
                <input
                  id="venueName"
                  type="text"
                  value={venueDetails.name}
                  onChange={(e) => setVenueDetails({ ...venueDetails, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="venueCity" className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  id="venueCity"
                  type="text"
                  value={venueDetails.city}
                  onChange={(e) => setVenueDetails({ ...venueDetails, city: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="venueState" className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    id="venueState"
                    type="text"
                    value={venueDetails.state}
                    onChange={(e) => setVenueDetails({ ...venueDetails, state: e.target.value })}
                    required
                    maxLength={2}
                    placeholder="TX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="venueZipcode" className="block text-sm font-medium text-gray-700 mb-1">
                    Zipcode *
                  </label>
                  <input
                    id="venueZipcode"
                    type="text"
                    value={venueDetails.zipcode}
                    onChange={(e) => setVenueDetails({ ...venueDetails, zipcode: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="venueCapacity" className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity *
                </label>
                <input
                  id="venueCapacity"
                  type="number"
                  value={venueDetails.capacity}
                  onChange={(e) => setVenueDetails({ ...venueDetails, capacity: e.target.value })}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingVenue}
                className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingVenue ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* User Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-brown-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Members
        </h2>

        {isAdmin && (
          <form onSubmit={handleInviteUser} className="mb-6 flex gap-2">
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="Enter email address to invite"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              required
            />
            <button
              type="submit"
              disabled={isInviting}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              {isInviting ? 'Inviting...' : 'Invite User'}
            </button>
          </form>
        )}

        <div className="space-y-3">
          {venueMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium text-brown-800">
                      {member.user.name || member.user.email}
                    </p>
                    <p className="text-sm text-gray-500">{member.user.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    member.role === 'admin'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {member.role}
                  </span>
                </div>
              </div>

              {isAdmin && member.role !== 'admin' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAnalytics(member.id, member.canViewAnalytics)}
                    className={`p-2 rounded ${
                      member.canViewAnalytics
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                    title={member.canViewAnalytics ? 'Revoke analytics access' : 'Grant analytics access'}
                  >
                    {member.canViewAnalytics ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="p-2 rounded bg-red-100 text-red-800 hover:bg-red-200"
                    title="Remove user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {member.role === 'admin' && (
                <span className="text-sm text-gray-500">Full Access</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Performance Templates */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow p-6">
          <TemplateManager />
        </div>
      )}
    </div>
  );
}

