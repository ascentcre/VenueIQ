'use client';

import { useState, useEffect } from 'react';
import { X, Tag, FileText, MessageSquare, Plus, Trash2, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

interface OpportunityModalProps {
  opportunity: any;
  onClose: () => void;
}

export function OpportunityModal({ opportunity, onClose }: OpportunityModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'comments' | 'labels' | 'documents'>('overview');
  const [notes, setNotes] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDocumentName, setNewDocumentName] = useState('');
  const [newDocumentUrl, setNewDocumentUrl] = useState('');
  const [artistInfo, setArtistInfo] = useState<any | null>(opportunity?.artistInfo ?? null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [manual, setManual] = useState({
    name: opportunity?.artistName ?? '',
    genre: '',
    homebase: '',
    description: '',
  });

  useEffect(() => {
    if (opportunity) {
      setNotes(opportunity.notes || []);
      setComments(opportunity.comments || []);
      setLabels(opportunity.labels || []);
      setDocuments(opportunity.documents || []);
      setArtistInfo(opportunity.artistInfo ?? null);
      setManual((m) => ({ ...m, name: opportunity.artistName ?? '' }));
    }
  }, [opportunity]);

  const handlePopulateWithAI = async () => {
    try {
      setAiLoading(true);
      const response = await fetch('/api/artist/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: opportunity.artistName }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch artist information');
      }
      const data = await response.json();

      const patch = await fetch(`/api/opportunities/${opportunity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistInfo: data }),
      });
      if (!patch.ok) {
        const err = await patch.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save artist information');
      }

      setArtistInfo(data);
      setShowManual(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to add artist information';
      alert(msg);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveManual = async () => {
    const payload = {
      name: manual.name || opportunity.artistName,
      genre: manual.genre || null,
      homebase: manual.homebase || null,
      description: manual.description || null,
    };
    try {
      const patch = await fetch(`/api/opportunities/${opportunity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistInfo: payload }),
      });
      if (!patch.ok) {
        const err = await patch.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save artist information');
      }
      setArtistInfo(payload);
      setShowManual(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save artist information';
      alert(msg);
    }
  };


  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const response = await fetch(`/api/opportunities/${opportunity.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote }),
      });

      if (response.ok) {
        const note = await response.json();
        setNotes([...notes, note]);
        setNewNote('');
      }
    } catch (error) {
      alert('Failed to add note');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`/api/opportunities/${opportunity.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments([...comments, comment]);
        setNewComment('');
      }
    } catch (error) {
      alert('Failed to add comment');
    }
  };

  const handleAddLabel = async () => {
    if (!newLabel.trim()) return;

    try {
      const response = await fetch(`/api/opportunities/${opportunity.id}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLabel }),
      });

      if (response.ok) {
        const label = await response.json();
        setLabels([...labels, label]);
        setNewLabel('');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to add label' }));
        alert(errorData.error || errorData.details || 'Failed to add label');
      }
    } catch (error) {
      console.error('Error adding label:', error);
      alert('Failed to add label');
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    try {
      const response = await fetch(`/api/opportunities/${opportunity.id}/labels/${labelId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLabels(labels.filter((l) => l.id !== labelId));
      }
    } catch (error) {
      alert('Failed to delete label');
    }
  };

  const handleAddDocument = async () => {
    if (!newDocumentName.trim() || !newDocumentUrl.trim()) return;

    try {
      const response = await fetch(`/api/opportunities/${opportunity.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newDocumentName, 
          url: newDocumentUrl,
          type: null 
        }),
      });

      if (response.ok) {
        const document = await response.json();
        setDocuments([...documents, document]);
        setNewDocumentName('');
        setNewDocumentUrl('');
      } else {
        alert('Failed to add document');
      }
    } catch (error) {
      alert('Failed to add document');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/opportunities/${opportunity.id}/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDocuments(documents.filter((d) => d.id !== documentId));
      } else {
        alert('Failed to delete document');
      }
    } catch (error) {
      alert('Failed to delete document');
    }
  };

  const handleDeleteOpportunity = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/opportunities/${opportunity.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete opportunity' }));
        alert(errorData.error || 'Failed to delete opportunity');
        setIsDeleting(false);
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      alert('Failed to delete opportunity');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-brown-800">{opportunity.artistName}</h2>
            <p className="text-sm text-gray-500 mt-1">Stage: {opportunity.stage}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
              title="Delete opportunity"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex border-b">
          {['overview', 'notes', 'comments', 'labels', 'documents'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 font-medium capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-teal-600 text-teal-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {(() => {
                const hasArtistInfo = !!artistInfo && Object.keys(artistInfo).length > 0;
                return hasArtistInfo;
              })() ? (
                <div className="p-6 bg-gray-50 rounded-lg space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">Artist Information</h3>
                    <button
                      type="button"
                      onClick={handlePopulateWithAI}
                      disabled={aiLoading}
                      className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60"
                      title="Refresh details using AI"
                    >
                      {aiLoading ? 'Refreshing…' : 'Re-run AI'}
                    </button>
                  </div>
                  
                  {/* Basic Info */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800 border-b pb-2">Basic Information</h4>
                    {artistInfo.name && (
                      <div>
                        <span className="font-medium text-gray-700">Name: </span>
                        <span className="text-gray-900">{artistInfo.name}</span>
                      </div>
                    )}
                    {artistInfo.genre && (
                      <div>
                        <span className="font-medium text-gray-700">Genre: </span>
                        <span className="text-gray-900">{artistInfo.genre}</span>
                      </div>
                    )}
                    {artistInfo.homebase && (
                      <div>
                        <span className="font-medium text-gray-700">Homebase: </span>
                        <span className="text-gray-900">{artistInfo.homebase}</span>
                      </div>
                    )}
                    {artistInfo.description && (
                      <div>
                        <span className="font-medium text-gray-700">Description: </span>
                        <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                          {typeof artistInfo.description === 'string' 
                            ? artistInfo.description.replace(/```json[\s\S]*?```/g, '').replace(/```[\s\S]*?```/g, '').replace(/\{[\s\S]*\}/g, '').trim() || 'No description available'
                            : String(artistInfo.description)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Booking Essentials */}
                  {artistInfo.bookingEssentials && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 border-b pb-2">Booking Essentials</h4>
                      {artistInfo.bookingEssentials.touringStatus && (
                        <div>
                          <span className="font-medium text-gray-700">Touring Status: </span>
                          <span className="text-gray-900">{artistInfo.bookingEssentials.touringStatus}</span>
                        </div>
                      )}
                      {artistInfo.bookingEssentials.drawPotential && (
                        <div>
                          <span className="font-medium text-gray-700">Draw Potential: </span>
                          <span className="text-gray-900">{artistInfo.bookingEssentials.drawPotential}</span>
                        </div>
                      )}
                      {artistInfo.bookingEssentials.typicalVenueSizes && (
                        <div>
                          <span className="font-medium text-gray-700">Typical Venue Sizes: </span>
                          <span className="text-gray-900">{artistInfo.bookingEssentials.typicalVenueSizes}</span>
                        </div>
                      )}
                      {artistInfo.bookingEssentials.guaranteeRange && (
                        <div>
                          <span className="font-medium text-gray-700">Guarantee Range: </span>
                          <span className="text-gray-900">{artistInfo.bookingEssentials.guaranteeRange}</span>
                        </div>
                      )}
                      {artistInfo.bookingEssentials.averageTicketPrice && (
                        <div>
                          <span className="font-medium text-gray-700">Average Ticket Price: </span>
                          <span className="text-gray-900">${artistInfo.bookingEssentials.averageTicketPrice}</span>
                        </div>
                      )}
                      {artistInfo.bookingEssentials.bookingAgent && (
                        <div>
                          <span className="font-medium text-gray-700">Booking Agent: </span>
                          <span className="text-gray-900">{artistInfo.bookingEssentials.bookingAgent}</span>
                        </div>
                      )}
                      {artistInfo.bookingEssentials.bookingAgency && (
                        <div>
                          <span className="font-medium text-gray-700">Booking Agency: </span>
                          <span className="text-gray-900">{artistInfo.bookingEssentials.bookingAgency}</span>
                        </div>
                      )}
                      {artistInfo.bookingEssentials.recentTourDates && 
                       artistInfo.bookingEssentials.recentTourDates.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Recent Tour Dates: </span>
                          <ul className="list-disc list-inside text-gray-900 mt-1 ml-2">
                            {artistInfo.bookingEssentials.recentTourDates.map((date: string, idx: number) => (
                              <li key={idx}>{date}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Audience & Marketability */}
                  {artistInfo.audienceMarketability && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 border-b pb-2">Audience & Marketability</h4>
                      {artistInfo.audienceMarketability.spotifyListeners && (
                        <div>
                          <span className="font-medium text-gray-700">Spotify Listeners: </span>
                          <span className="text-gray-900">{artistInfo.audienceMarketability.spotifyListeners.toLocaleString()}</span>
                        </div>
                      )}
                      {artistInfo.audienceMarketability.youtubeViews && (
                        <div>
                          <span className="font-medium text-gray-700">YouTube Views: </span>
                          <span className="text-gray-900">{artistInfo.audienceMarketability.youtubeViews}</span>
                        </div>
                      )}
                      {artistInfo.audienceMarketability.demographics && (
                        <div>
                          <span className="font-medium text-gray-700">Demographics: </span>
                          <span className="text-gray-900">{artistInfo.audienceMarketability.demographics}</span>
                        </div>
                      )}
                      {artistInfo.audienceMarketability.regionalPopularity && (
                        <div>
                          <span className="font-medium text-gray-700">Regional Popularity: </span>
                          <span className="text-gray-900">{artistInfo.audienceMarketability.regionalPopularity}</span>
                        </div>
                      )}
                      {artistInfo.audienceMarketability.comparableArtists && 
                       artistInfo.audienceMarketability.comparableArtists.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Comparable Artists: </span>
                          <span className="text-gray-900">{artistInfo.audienceMarketability.comparableArtists.join(', ')}</span>
                        </div>
                      )}
                      {artistInfo.audienceMarketability.socialMedia && (
                        <div>
                          <span className="font-medium text-gray-700">Social Media: </span>
                          <div className="text-gray-900 mt-1 space-y-1">
                            {artistInfo.audienceMarketability.socialMedia.website && (
                              <div className="ml-2">Website: {artistInfo.audienceMarketability.socialMedia.website}</div>
                            )}
                            {artistInfo.audienceMarketability.socialMedia.instagram && (
                              <div className="ml-2">Instagram: {artistInfo.audienceMarketability.socialMedia.instagram}</div>
                            )}
                            {artistInfo.audienceMarketability.socialMedia.facebook && (
                              <div className="ml-2">Facebook: {artistInfo.audienceMarketability.socialMedia.facebook}</div>
                            )}
                            {artistInfo.audienceMarketability.socialMedia.twitter && (
                              <div className="ml-2">Twitter: {artistInfo.audienceMarketability.socialMedia.twitter}</div>
                            )}
                            {artistInfo.audienceMarketability.socialMedia.tiktok && (
                              <div className="ml-2">TikTok: {artistInfo.audienceMarketability.socialMedia.tiktok}</div>
                            )}
                          </div>
                        </div>
                      )}
                      {artistInfo.audienceMarketability.socialFollowing && (
                        <div>
                          <span className="font-medium text-gray-700">Social Following: </span>
                          <div className="text-gray-900 mt-1 space-y-1">
                            {artistInfo.audienceMarketability.socialFollowing.instagram && (
                              <div className="ml-2">Instagram: {artistInfo.audienceMarketability.socialFollowing.instagram.toLocaleString()} followers</div>
                            )}
                            {artistInfo.audienceMarketability.socialFollowing.facebook && (
                              <div className="ml-2">Facebook: {artistInfo.audienceMarketability.socialFollowing.facebook.toLocaleString()} followers</div>
                            )}
                            {artistInfo.audienceMarketability.socialFollowing.twitter && (
                              <div className="ml-2">Twitter: {artistInfo.audienceMarketability.socialFollowing.twitter.toLocaleString()} followers</div>
                            )}
                            {artistInfo.audienceMarketability.socialFollowing.tiktok && (
                              <div className="ml-2">TikTok: {artistInfo.audienceMarketability.socialFollowing.tiktok.toLocaleString()} followers</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Operational Considerations */}
                  {artistInfo.operationalConsiderations && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 border-b pb-2">Operational Considerations</h4>
                      {artistInfo.operationalConsiderations.technicalRequirements && (
                        <div>
                          <span className="font-medium text-gray-700">Technical Requirements: </span>
                          <p className="text-gray-900 mt-1">{artistInfo.operationalConsiderations.technicalRequirements}</p>
                        </div>
                      )}
                      {artistInfo.operationalConsiderations.showLength && (
                        <div>
                          <span className="font-medium text-gray-700">Show Length: </span>
                          <span className="text-gray-900">{artistInfo.operationalConsiderations.showLength}</span>
                        </div>
                      )}
                      {artistInfo.operationalConsiderations.setupTime && (
                        <div>
                          <span className="font-medium text-gray-700">Setup Time: </span>
                          <span className="text-gray-900">{artistInfo.operationalConsiderations.setupTime}</span>
                        </div>
                      )}
                      {(artistInfo.operationalConsiderations.loadInTime || artistInfo.operationalConsiderations.loadInTiming) && (
                        <div>
                          <span className="font-medium text-gray-700">Load In Time: </span>
                          <span className="text-gray-900">{artistInfo.operationalConsiderations.loadInTime || artistInfo.operationalConsiderations.loadInTiming}</span>
                        </div>
                      )}
                      {artistInfo.operationalConsiderations.soundcheckTime && (
                        <div>
                          <span className="font-medium text-gray-700">Soundcheck Time: </span>
                          <span className="text-gray-900">{artistInfo.operationalConsiderations.soundcheckTime}</span>
                        </div>
                      )}
                      {artistInfo.operationalConsiderations.backlineNeeds && (
                        <div>
                          <span className="font-medium text-gray-700">Backline Needs: </span>
                          <p className="text-gray-900 mt-1">{artistInfo.operationalConsiderations.backlineNeeds}</p>
                        </div>
                      )}
                      {artistInfo.operationalConsiderations.hospitality && (
                        <div>
                          <span className="font-medium text-gray-700">Hospitality: </span>
                          <p className="text-gray-900 mt-1">{artistInfo.operationalConsiderations.hospitality}</p>
                        </div>
                      )}
                      {(artistInfo.operationalConsiderations.rider || artistInfo.operationalConsiderations.riderNotes) && (
                        <div>
                          <span className="font-medium text-gray-700">Rider: </span>
                          <p className="text-gray-900 mt-1">{artistInfo.operationalConsiderations.rider || artistInfo.operationalConsiderations.riderNotes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Risk Assessment */}
                  {artistInfo.riskAssessment && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 border-b pb-2">Risk Assessment</h4>
                      {artistInfo.riskAssessment.attendanceRates && (
                        <div>
                          <span className="font-medium text-gray-700">Attendance Rates: </span>
                          <p className="text-gray-900 mt-1">{artistInfo.riskAssessment.attendanceRates}</p>
                        </div>
                      )}
                      {artistInfo.riskAssessment.reputation && (
                        <div>
                          <span className="font-medium text-gray-700">Reputation: </span>
                          <p className="text-gray-900 mt-1">{artistInfo.riskAssessment.reputation}</p>
                        </div>
                      )}
                      {artistInfo.riskAssessment.cancellationHistory && (
                        <div>
                          <span className="font-medium text-gray-700">Cancellation History: </span>
                          <p className="text-gray-900 mt-1">{artistInfo.riskAssessment.cancellationHistory}</p>
                        </div>
                      )}
                      {artistInfo.riskAssessment.promotionalCooperation && (
                        <div>
                          <span className="font-medium text-gray-700">Promotional Cooperation: </span>
                          <p className="text-gray-900 mt-1">{artistInfo.riskAssessment.promotionalCooperation}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recent Shows */}
                  {artistInfo.recentShows && artistInfo.recentShows.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 border-b pb-2">Recent Shows</h4>
                      <div className="space-y-2">
                        {artistInfo.recentShows.map((show: any, idx: number) => (
                          <div key={idx} className="text-gray-900">
                            <div className="font-medium">{show.date || 'Date TBA'}</div>
                            <div className="text-sm text-gray-700">{show.location || 'Location TBA'}</div>
                            {show.venueCapacity && (
                              <div className="text-xs text-gray-500">Capacity: {show.venueCapacity.toLocaleString()}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upcoming Shows */}
                  {artistInfo.upcomingShows && artistInfo.upcomingShows.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 border-b pb-2">Upcoming Shows</h4>
                      <div className="space-y-2">
                        {artistInfo.upcomingShows.map((show: any, idx: number) => (
                          <div key={idx} className="text-gray-900">
                            <div className="font-medium">{show.date || 'Date TBA'}</div>
                            <div className="text-sm text-gray-700">{show.location || 'Location TBA'}</div>
                            {show.venueCapacity && (
                              <div className="text-xs text-gray-500">Capacity: {show.venueCapacity.toLocaleString()}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  {artistInfo.additionalInfo && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 border-b pb-2">Additional Information</h4>
                      {typeof artistInfo.additionalInfo === 'string' ? (
                        <p className="text-gray-900 whitespace-pre-wrap">{artistInfo.additionalInfo}</p>
                      ) : (
                        Object.entries(artistInfo.additionalInfo).map(([key, value]) => {
                          if (!value) return null;
                          return (
                            <div key={key}>
                              <span className="font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}: </span>
                              <span className="text-gray-900">{String(value)}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 bg-gray-50 rounded-lg border border-gray-200 text-center space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">No artist information yet</h3>
                  <p className="text-gray-600">
                    Add details to help evaluate this prospect. You can use AI or enter basic info manually.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handlePopulateWithAI}
                      disabled={aiLoading}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60"
                    >
                      {aiLoading ? 'Fetching…' : 'Use AI to add Artist Info'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowManual((s) => !s)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      Enter manually
                    </button>
                  </div>

                  {showManual && (
                    <div className="mt-4 text-left max-w-2xl mx-auto space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          value={manual.name}
                          onChange={(e) => setManual({ ...manual, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                          <input
                            value={manual.genre}
                            onChange={(e) => setManual({ ...manual, genre: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Homebase</label>
                          <input
                            value={manual.homebase}
                            onChange={(e) => setManual({ ...manual, homebase: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={manual.description}
                          onChange={(e) => setManual({ ...manual, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[90px]"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveManual}
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <button
                  type="button"
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {notes.map((note) => (
                  <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{note.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{comment.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'labels' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Add a label (e.g., 'Rebook', 'Lost - Price')..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddLabel()}
                />
                <button
                  type="button"
                  onClick={handleAddLabel}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <span
                    key={label.id}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm"
                  >
                    {label.name}
                    <button
                      onClick={() => handleDeleteLabel(label.id)}
                      className="hover:text-teal-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2">Add Document</h3>
                <input
                  type="text"
                  value={newDocumentName}
                  onChange={(e) => setNewDocumentName(e.target.value)}
                  placeholder="Document name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddDocument()}
                />
                <input
                  type="url"
                  value={newDocumentUrl}
                  onChange={(e) => setNewDocumentUrl(e.target.value)}
                  placeholder="Document URL..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddDocument()}
                />
                <button
                  type="button"
                  onClick={handleAddDocument}
                  className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Document
                </button>
              </div>
              
              <div className="space-y-2">
                {documents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No documents yet. Add one above.</p>
                ) : (
                  documents.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <a
                            href={document.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-gray-900 hover:text-teal-600 truncate block"
                          >
                            {document.name}
                          </a>
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {document.url}
                          </p>
                          {document.type && (
                            <span className="inline-block mt-1 text-xs text-gray-500">
                              Type: {document.type}
                            </span>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            Added {new Date(document.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteDocument(document.id)}
                        className="ml-4 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete document"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Opportunity</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to delete this opportunity? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setIsDeleting(false);
                    }}
                    disabled={isDeleting}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteOpportunity}
                    disabled={isDeleting}
                    className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
