'use client';

import { MapPin, Calendar, DollarSign, Music, Users, TrendingUp, Settings, AlertTriangle, ExternalLink } from 'lucide-react';

interface ArtistInfoCardProps {
  artistInfo: {
    name: string;
    homebase?: string;
    recentShows?: Array<{ date: string; location: string; venueCapacity?: number }>;
    upcomingShows?: Array<{ date: string; location: string; venueCapacity?: number }>;
    averageTicketPrice?: number;
    genre?: string;
    description?: string;
    bookingEssentials?: {
      touringStatus?: string;
      recentTourDates?: string[];
      typicalVenueSizes?: string;
      guaranteeRange?: string;
      bookingAgent?: string;
      bookingAgency?: string;
      averageTicketPrice?: number;
      drawPotential?: string;
    };
    audienceMarketability?: {
      spotifyListeners?: number;
      youtubeViews?: string;
      socialMedia?: {
        website?: string;
        instagram?: string;
        facebook?: string;
        twitter?: string;
        tiktok?: string;
      };
      socialFollowing?: {
        instagram?: number;
        facebook?: number;
        twitter?: number;
        tiktok?: number;
      };
      regionalPopularity?: string;
      demographics?: string;
      comparableArtists?: string[];
    };
    operationalConsiderations?: {
      technicalRequirements?: string;
      showLength?: string;
      supportActRequirements?: string;
      loadInTiming?: string;
      riderNotes?: string;
    };
    riskAssessment?: {
      attendanceRates?: string;
      reputation?: string;
      cancellationHistory?: string;
      promotionalCooperation?: string;
    };
    [key: string]: any;
  };
}

export function ArtistInfoCard({ artistInfo }: ArtistInfoCardProps) {
  // Support both old and new structure for backward compatibility
  const ticketPrice = artistInfo.bookingEssentials?.averageTicketPrice || artistInfo.averageTicketPrice;
  const bookingEssentials = artistInfo.bookingEssentials;
  const audienceMarketability = artistInfo.audienceMarketability;
  const operationalConsiderations = artistInfo.operationalConsiderations;
  const riskAssessment = artistInfo.riskAssessment;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-brown-800 mb-2">{artistInfo.name}</h2>
        {artistInfo.genre && (
          <div className="flex items-center gap-2 text-brown-600">
            <Music className="w-4 h-4" />
            <span>{artistInfo.genre}</span>
          </div>
        )}
        {artistInfo.homebase && (
          <div className="flex items-center gap-2 text-gray-600 mt-1">
            <MapPin className="w-4 h-4" />
            <span>{artistInfo.homebase}</span>
          </div>
        )}
      </div>

      {artistInfo.description && (
        <div>
          <p className="text-gray-700">{artistInfo.description}</p>
        </div>
      )}

      {/* Booking Essentials */}
      {bookingEssentials && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-brown-800 mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-teal-600" />
            Booking Essentials
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookingEssentials.touringStatus && (
              <div>
                <span className="text-sm font-medium text-gray-600">Touring Status:</span>
                <p className="text-gray-800">{bookingEssentials.touringStatus}</p>
              </div>
            )}
            {bookingEssentials.typicalVenueSizes && (
              <div>
                <span className="text-sm font-medium text-gray-600">Typical Venue Sizes:</span>
                <p className="text-gray-800">{bookingEssentials.typicalVenueSizes}</p>
              </div>
            )}
            {bookingEssentials.guaranteeRange && (
              <div>
                <span className="text-sm font-medium text-gray-600">Guarantee Range:</span>
                <p className="text-gray-800">{bookingEssentials.guaranteeRange}</p>
              </div>
            )}
            {bookingEssentials.bookingAgent && (
              <div>
                <span className="text-sm font-medium text-gray-600">Booking Agent:</span>
                <p className="text-gray-800">{bookingEssentials.bookingAgent}</p>
              </div>
            )}
            {bookingEssentials.bookingAgency && (
              <div>
                <span className="text-sm font-medium text-gray-600">Booking Agency:</span>
                <p className="text-gray-800">{bookingEssentials.bookingAgency}</p>
              </div>
            )}
            {ticketPrice && (
              <div>
                <span className="text-sm font-medium text-gray-600">Average Ticket Price:</span>
                <p className="text-gray-800">${ticketPrice.toFixed(2)}</p>
              </div>
            )}
            {bookingEssentials.drawPotential && (
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-gray-600">Draw Potential:</span>
                <p className="text-gray-800">{bookingEssentials.drawPotential}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audience & Marketability */}
      {audienceMarketability && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-brown-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            Audience & Marketability
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {audienceMarketability.spotifyListeners && (
              <div>
                <span className="text-sm font-medium text-gray-600">Spotify Monthly Listeners:</span>
                <p className="text-gray-800">{audienceMarketability.spotifyListeners.toLocaleString()}</p>
              </div>
            )}
            {audienceMarketability.youtubeViews && (
              <div>
                <span className="text-sm font-medium text-gray-600">YouTube Views:</span>
                <p className="text-gray-800">{audienceMarketability.youtubeViews}</p>
              </div>
            )}
            {audienceMarketability.socialFollowing && (
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-gray-600 mb-2 block">Social Media Following:</span>
                <div className="flex flex-wrap gap-4">
                  {audienceMarketability.socialFollowing.instagram && (
                    <span className="text-sm text-gray-700">Instagram: {audienceMarketability.socialFollowing.instagram.toLocaleString()}</span>
                  )}
                  {audienceMarketability.socialFollowing.facebook && (
                    <span className="text-sm text-gray-700">Facebook: {audienceMarketability.socialFollowing.facebook.toLocaleString()}</span>
                  )}
                  {audienceMarketability.socialFollowing.twitter && (
                    <span className="text-sm text-gray-700">Twitter: {audienceMarketability.socialFollowing.twitter.toLocaleString()}</span>
                  )}
                  {audienceMarketability.socialFollowing.tiktok && (
                    <span className="text-sm text-gray-700">TikTok: {audienceMarketability.socialFollowing.tiktok.toLocaleString()}</span>
                  )}
                </div>
              </div>
            )}
            {audienceMarketability.socialMedia && (
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-gray-600 mb-2 block">Social Media Links:</span>
                <div className="flex flex-wrap gap-3">
                  {audienceMarketability.socialMedia.website && (
                    <a href={audienceMarketability.socialMedia.website} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 text-sm flex items-center gap-1">
                      Website <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {audienceMarketability.socialMedia.instagram && (
                    <a href={`https://instagram.com/${audienceMarketability.socialMedia.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 text-sm flex items-center gap-1">
                      Instagram <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {audienceMarketability.socialMedia.facebook && (
                    <a href={audienceMarketability.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 text-sm flex items-center gap-1">
                      Facebook <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {audienceMarketability.socialMedia.twitter && (
                    <a href={`https://twitter.com/${audienceMarketability.socialMedia.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 text-sm flex items-center gap-1">
                      Twitter <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {audienceMarketability.socialMedia.tiktok && (
                    <a href={`https://tiktok.com/@${audienceMarketability.socialMedia.tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 text-sm flex items-center gap-1">
                      TikTok <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
            {audienceMarketability.regionalPopularity && (
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-gray-600">Regional Popularity:</span>
                <p className="text-gray-800">{audienceMarketability.regionalPopularity}</p>
              </div>
            )}
            {audienceMarketability.demographics && (
              <div>
                <span className="text-sm font-medium text-gray-600">Demographics:</span>
                <p className="text-gray-800">{audienceMarketability.demographics}</p>
              </div>
            )}
            {audienceMarketability.comparableArtists && audienceMarketability.comparableArtists.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-600">Comparable Artists:</span>
                <p className="text-gray-800">{audienceMarketability.comparableArtists.join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Operational Considerations */}
      {operationalConsiderations && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-brown-800 mb-3 flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600" />
            Operational Considerations
          </h3>
          <div className="space-y-3">
            {operationalConsiderations.technicalRequirements && (
              <div>
                <span className="text-sm font-medium text-gray-600">Technical Requirements:</span>
                <p className="text-gray-800">{operationalConsiderations.technicalRequirements}</p>
              </div>
            )}
            {operationalConsiderations.showLength && (
              <div>
                <span className="text-sm font-medium text-gray-600">Show Length:</span>
                <p className="text-gray-800">{operationalConsiderations.showLength}</p>
              </div>
            )}
            {operationalConsiderations.supportActRequirements && (
              <div>
                <span className="text-sm font-medium text-gray-600">Support Act Requirements:</span>
                <p className="text-gray-800">{operationalConsiderations.supportActRequirements}</p>
              </div>
            )}
            {operationalConsiderations.loadInTiming && (
              <div>
                <span className="text-sm font-medium text-gray-600">Load-in Timing:</span>
                <p className="text-gray-800">{operationalConsiderations.loadInTiming}</p>
              </div>
            )}
            {operationalConsiderations.riderNotes && (
              <div>
                <span className="text-sm font-medium text-gray-600">Rider Notes:</span>
                <p className="text-gray-800">{operationalConsiderations.riderNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Risk Assessment */}
      {riskAssessment && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-brown-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Risk Assessment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {riskAssessment.attendanceRates && (
              <div>
                <span className="text-sm font-medium text-gray-600">Attendance Rates:</span>
                <p className="text-gray-800">{riskAssessment.attendanceRates}</p>
              </div>
            )}
            {riskAssessment.reputation && (
              <div>
                <span className="text-sm font-medium text-gray-600">Reputation:</span>
                <p className="text-gray-800">{riskAssessment.reputation}</p>
              </div>
            )}
            {riskAssessment.cancellationHistory && (
              <div>
                <span className="text-sm font-medium text-gray-600">Cancellation History:</span>
                <p className="text-gray-800">{riskAssessment.cancellationHistory}</p>
              </div>
            )}
            {riskAssessment.promotionalCooperation && (
              <div>
                <span className="text-sm font-medium text-gray-600">Promotional Cooperation:</span>
                <p className="text-gray-800">{riskAssessment.promotionalCooperation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
        {artistInfo.recentShows && artistInfo.recentShows.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              Recent Shows
            </h3>
            <div className="space-y-2">
              {artistInfo.recentShows.map((show, idx) => (
                <div key={idx} className="text-sm text-gray-600">
                  <span className="font-medium">{show.date}</span> - {show.location}
                  {show.venueCapacity && <span className="text-gray-500"> ({show.venueCapacity} cap)</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {artistInfo.upcomingShows && artistInfo.upcomingShows.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              Upcoming Shows
            </h3>
            <div className="space-y-2">
              {artistInfo.upcomingShows.map((show, idx) => (
                <div key={idx} className="text-sm text-gray-600">
                  <span className="font-medium">{show.date}</span> - {show.location}
                  {show.venueCapacity && <span className="text-gray-500"> ({show.venueCapacity} cap)</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

