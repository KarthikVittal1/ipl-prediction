import React, { useEffect, useState } from 'react';
import LiveScorecard from './live-scorecard';

interface LiveMatch {
  id: string;
  name: string;
  matchType: string;
  status: string;
  venue: string;
  date: string;
  teams: string[];
  teamInfo: Array<{
    name: string;
    img: string;
  }>;
  tossWinner: string;
  tossChoice: string;
  score: string;
  series: string;
}

const LiveDashboard: React.FC = () => {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLiveMatches = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8002/live-matches');
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
        } else {
          setLiveMatches(data.matches);
          if (data.matches.length > 0) {
            setSelectedMatch(data.matches[0].id);
          }
        }
      } catch (err) {
        setError('Failed to fetch live matches');
      } finally {
        setLoading(false);
      }
    };

    fetchLiveMatches();
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchLiveMatches, 15000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (liveMatches.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No live matches currently</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">IPL Live Match Dashboard</h1>
      
      {/* Live Matches Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Live Matches</h2>
          {liveMatches.map((match) => (
            <div
              key={match.id}
              onClick={() => setSelectedMatch(match.id)}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
                selectedMatch === match.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white hover:bg-gray-50 shadow'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase">
                  {match.matchType}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  selectedMatch === match.id
                    ? 'bg-white/20'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {match.status.toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <img
                    src={match.teamInfo[0]?.img}
                    alt={match.teamInfo[0]?.name}
                    className="w-6 h-6 mr-2"
                  />
                  <span className="text-sm font-medium">
                    {match.teamInfo[0]?.name}
                  </span>
                </div>
                <span className="text-sm font-medium">vs</span>
                <div className="flex items-center">
                  <img
                    src={match.teamInfo[1]?.img}
                    alt={match.teamInfo[1]?.name}
                    className="w-6 h-6 mr-2"
                  />
                  <span className="text-sm font-medium">
                    {match.teamInfo[1]?.name}
                  </span>
                </div>
              </div>
              
              <div className="text-sm font-semibold mb-1">{match.score}</div>
              <div className="text-xs opacity-75">{match.venue}</div>
            </div>
          ))}
        </div>

        {/* Scorecard */}
        <div className="lg:col-span-2">
          {selectedMatch && <LiveScorecard matchId={selectedMatch} />}
        </div>
      </div>
    </div>
  );
};

export default LiveDashboard;
