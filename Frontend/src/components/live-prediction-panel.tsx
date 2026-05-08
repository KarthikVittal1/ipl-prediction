import React, { useEffect, useState } from 'react';

interface Factor {
  label: string;
  weight: number;
}

interface PredictionResult {
  status: string;
  winner: string;
  prob_a: number;
  prob_b: number;
  confidence: number;
  factors: Factor[];
  match_state?: {
    team1: { score: number; wickets: number; overs: number };
    team2: { score: number; wickets: number; overs: number };
  };
  message?: string;
}

interface LivePredictionPanelProps {
  matchId: string;
  team1Name: string;
  team2Name: string;
}

const LivePredictionPanel: React.FC<LivePredictionPanelProps> = ({
  matchId,
  team1Name,
  team2Name,
}) => {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchPrediction = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8002/live-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId }),
      });
      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      console.error('Failed to fetch prediction:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchPrediction, 10000); // Refresh every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [matchId, autoRefresh]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <p className="text-gray-600">No prediction data available</p>
      </div>
    );
  }

  const probA = prediction.prob_a * 100;
  const probB = prediction.prob_b * 100;
  const confidence = prediction.confidence * 100;

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Live Prediction</h2>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-sm">Auto-refresh</span>
        </label>
      </div>

      {/* Winner Prediction */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-lg">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600 mb-2">Predicted Winner</p>
          <p className="text-3xl font-bold text-green-600">{prediction.winner}</p>
          <p className="text-sm text-gray-600">
            Confidence: {confidence.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Win Probability Bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="font-semibold">{team1Name}</span>
          <span className="font-semibold">{team2Name}</span>
        </div>
        <div className="h-8 bg-gray-200 rounded-full overflow-hidden flex">
          <div
            className="bg-blue-500 transition-all duration-500"
            style={{ width: `${probA}%` }}
          >
            <span className="text-white text-xs font-medium pl-2">
              {probA.toFixed(1)}%
            </span>
          </div>
          <div
            className="bg-orange-500 transition-all duration-500"
            style={{ width: `${probB}%` }}
          >
            <span className="text-white text-xs font-medium pr-2 text-right block">
              {probB.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Match State */}
      {prediction.match_state && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3">Current Match State</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">{team1Name}:</span>
              <span className="font-semibold ml-2">
                {prediction.match_state.team1.score}/{prediction.match_state.team1.wickets} ({prediction.match_state.team1.overs.toFixed(1)} ov)
              </span>
            </div>
            <div>
              <span className="text-gray-600">{team2Name}:</span>
              <span className="font-semibold ml-2">
                {prediction.match_state.team2.score}/{prediction.match_state.team2.wickets} ({prediction.match_state.team2.overs.toFixed(1)} ov)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Factors */}
      <div className="mb-4">
        <h3 className="font-semibold mb-3">Prediction Factors</h3>
        <div className="space-y-2">
          {prediction.factors.map((factor, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-2 bg-gray-50 rounded"
            >
              <span className="text-sm">{factor.label}</span>
              <span className="text-sm font-semibold">{factor.weight.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Message */}
      {prediction.message && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">{prediction.message}</p>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={fetchPrediction}
        className="mt-4 w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Refresh Prediction
      </button>
    </div>
  );
};

export default LivePredictionPanel;
