import React, { useEffect, useState } from 'react';

interface Player {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  status: string;
}

interface Team {
  name: string;
  logo: string;
  score: string;
  overs: string;
  runRate: number;
  players: Player[];
}

interface ScorecardData {
  matchId: string;
  status: string;
  tossWinner: string;
  tossChoice: string;
  venue: string;
  team1: Team;
  team2: Team;
  currentPartnership: {
    runs: number;
    balls: number;
    batsmen: string[];
  };
  recentBalls: string[];
  requiredRunRate: number;
  projectedScore: number;
}

interface LiveScorecardProps {
  matchId: string;
}

const LiveScorecard: React.FC<LiveScorecardProps> = ({ matchId }) => {
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScorecard = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/live-scorecard/${matchId}`);
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
        } else {
          setScorecard(data);
        }
      } catch (err) {
        setError('Failed to fetch scorecard');
      } finally {
        setLoading(false);
      }
    };

    fetchScorecard();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchScorecard, 10000);
    
    return () => clearInterval(interval);
  }, [matchId]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !scorecard) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <p className="text-red-500">{error || 'No scorecard data available'}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      {/* Match Header */}
      <div className="mb-6 pb-4 border-b">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">Live Scorecard</h2>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            {scorecard.status.toUpperCase()}
          </span>
        </div>
        <p className="text-sm text-gray-600">{scorecard.venue}</p>
        <p className="text-sm text-gray-600">
          Toss: {scorecard.tossWinner} chose to {scorecard.tossChoice}
        </p>
      </div>

      {/* Team Scores */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Team 1 */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center mb-2">
            <img src={scorecard.team1.logo} alt={scorecard.team1.name} className="w-8 h-8 mr-2" />
            <span className="font-semibold">{scorecard.team1.name}</span>
          </div>
          <div className="text-2xl font-bold">{scorecard.team1.score}</div>
          <div className="text-sm text-gray-600">({scorecard.team1.overs} ov)</div>
          <div className="text-sm text-gray-600">Run Rate: {scorecard.team1.runRate.toFixed(2)}</div>
        </div>

        {/* Team 2 */}
        <div className="p-4 bg-orange-50 rounded-lg">
          <div className="flex items-center mb-2">
            <img src={scorecard.team2.logo} alt={scorecard.team2.name} className="w-8 h-8 mr-2" />
            <span className="font-semibold">{scorecard.team2.name}</span>
          </div>
          <div className="text-2xl font-bold">{scorecard.team2.score}</div>
          <div className="text-sm text-gray-600">({scorecard.team2.overs} ov)</div>
          <div className="text-sm text-gray-600">Run Rate: {scorecard.team2.runRate.toFixed(2)}</div>
        </div>
      </div>

      {/* Current Partnership */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Current Partnership</h3>
        <div className="flex justify-between">
          <span>{scorecard.currentPartnership.batsmen.join(' & ')}</span>
          <span>{scorecard.currentPartnership.runs} ({scorecard.currentPartnership.balls})</span>
        </div>
      </div>

      {/* Recent Balls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Recent Balls</h3>
        <div className="flex gap-2 flex-wrap">
          {scorecard.recentBalls.map((ball, index) => (
            <span
              key={index}
              className={`px-3 py-1 rounded text-sm font-medium ${
                ball === '4' || ball === '6'
                  ? 'bg-green-200 text-green-800'
                  : ball === 'W'
                  ? 'bg-red-200 text-red-800'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {ball}
            </span>
          ))}
        </div>
      </div>

      {/* Match Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Required Run Rate:</span>
          <span className="font-semibold ml-2">{scorecard.requiredRunRate.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-600">Projected Score:</span>
          <span className="font-semibold ml-2">{scorecard.projectedScore}</span>
        </div>
      </div>
    </div>
  );
};

export default LiveScorecard;
