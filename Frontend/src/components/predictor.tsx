import { useState, useEffect } from "react";
import { listTeams, listStadiums, predictMatch, listMatches } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Team {
  id: string;
  name: string;
  shortName: string;
}

interface Venue {
  id: string;
  name: string;
  city: string;
}

interface Prediction {
  winner: string;
  prob_a: number;
  prob_b: number;
  confidence: number;
  factors: { label: string; weight: number }[];
}

interface Match {
  id: string;
  teamA: { name: string; shortName: string };
  teamB: { name: string; shortName: string };
  venue: string;
  status: string;
}

const Predictor = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);

  const [form, setForm] = useState({
    team1: "",
    team2: "",
    venue: "",
    toss_winner: "",
    toss_decision: "bat",
    is_day_night: true,
  });

  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const teamsData = await listTeams();
        const venuesData = await listStadiums();
        const matchesData = await listMatches();
        
        setTeams(teamsData);
        setVenues(venuesData);
        
        // Filter for upcoming IPL matches
        const upcomingIplMatches = matchesData.filter((m: Match) => 
          m.status === "upcoming" && 
          (m.teamA.name.includes("Indians") || 
           m.teamB.name.includes("Indians") ||
           m.teamA.name.includes("Super") || 
           m.teamB.name.includes("Super") ||
           m.teamA.name.includes("Royals") || 
           m.teamB.name.includes("Royals") ||
           m.teamA.name.includes("Knights") || 
           m.teamB.name.includes("Knights") ||
           m.teamA.name.includes("Capitals") || 
           m.teamB.name.includes("Capitals") ||
           m.teamA.name.includes("Kings") || 
           m.teamB.name.includes("Kings") ||
           m.teamA.name.includes("Titans") || 
           m.teamB.name.includes("Titans") ||
           m.teamA.name.includes("Giants") || 
           m.teamB.name.includes("Giants"))
        );
        
        setUpcomingMatches(upcomingIplMatches.slice(0, 5)); // Show next 5 upcoming matches
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.team1 === form.team2) {
      alert("Please select different teams");
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        team_a: form.team1,
        team_b: form.team2,
        venue: form.venue,
        format: "T20",
        toss_winner: form.toss_winner || form.team1,
        toss_decision: form.toss_decision,
        is_day_night: form.is_day_night,
      };

      const result = await predictMatch(requestData);
      setPrediction(result);
      setShowVisualization(true);
    } catch (err) {
      console.error("Prediction failed:", err);
      alert("Prediction failed");
    }

    setLoading(false);
  };

  const predictUpcomingMatch = async (match: Match) => {
    setLoading(true);
    
    try {
      const requestData = {
        team_a: match.teamA.name,
        team_b: match.teamB.name,
        venue: match.venue,
        format: "T20",
        toss_winner: match.teamA.name,
        toss_decision: "bat",
        is_day_night: true,
      };

      const result = await predictMatch(requestData);
      setPrediction(result);
      setShowVisualization(true);
      
      // Update form with match data
      setForm({
        team1: match.teamA.name,
        team2: match.teamB.name,
        venue: match.venue,
        toss_winner: match.teamA.name,
        toss_decision: "bat",
        is_day_night: true,
      });
    } catch (err) {
      console.error("Prediction failed:", err);
      alert("Prediction failed");
    }

    setLoading(false);
  };

  // Prepare data for visualization
  const chartData = prediction ? [
    { name: form.team1, value: prediction.prob_a * 100, fill: "#ef4444" },
    { name: form.team2, value: prediction.prob_b * 100, fill: "#3b82f6" },
  ] : [];

  const pieData = prediction ? [
    { name: form.team1, value: prediction.prob_a * 100 },
    { name: form.team2, value: prediction.prob_b * 100 },
  ] : [];

  const COLORS = ['#ef4444', '#3b82f6'];

  return (
    <div className="space-y-6">
      {/* Upcoming IPL Matches */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">📅 Upcoming IPL Matches</h3>
        {upcomingMatches.length === 0 ? (
          <p className="text-muted-foreground">No upcoming IPL matches scheduled.</p>
        ) : (
          <div className="space-y-3">
            {upcomingMatches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{match.teamA.shortName}</span>
                  <span className="text-muted-foreground">vs</span>
                  <span className="font-medium">{match.teamB.shortName}</span>
                  <span className="text-sm text-muted-foreground">• {match.venue}</span>
                </div>
                <button
                  onClick={() => predictUpcomingMatch(match)}
                  disabled={loading}
                  className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? "Predicting..." : "Predict"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Prediction Form */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">🤖 AI Match Predictor</h3>
        <form onSubmit={handlePredict} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team 1 */}
            <div>
              <label className="block text-sm font-medium mb-2">Team 1</label>
              <select
                value={form.team1}
                onChange={(e) => setForm({ ...form, team1: e.target.value })}
                className="w-full p-3 border border-border rounded-lg bg-background"
                required
              >
                <option value="">Select Team 1</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Team 2 */}
            <div>
              <label className="block text-sm font-medium mb-2">Team 2</label>
              <select
                value={form.team2}
                onChange={(e) => setForm({ ...form, team2: e.target.value })}
                className="w-full p-3 border border-border rounded-lg bg-background"
                required
              >
                <option value="">Select Team 2</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Venue - Auto-selected based on teams */}
          <div>
            <label className="block text-sm font-medium mb-2">Venue</label>
            <select
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              className="w-full p-3 border border-border rounded-lg bg-background"
              required
              disabled
            >
              <option value="">Select Venue</option>
              {venues.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">Venue auto-selected based on home team</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Predicting..." : "Predict Winner"}
          </button>
        </form>
      </div>

      {/* Prediction Results with Visualization */}
      {prediction && showVisualization && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">🏆 Prediction Result</h3>
          
          <div className="text-center mb-6">
            <div className="text-2xl font-bold text-primary mb-2">
              {prediction.winner}
            </div>
            <div className="text-sm text-muted-foreground">
              Confidence: {prediction.confidence.toFixed(1)}%
            </div>
          </div>

          {/* Bar Chart */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3">Win Probability</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3">Probability Distribution</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Factors */}
          {prediction.factors && prediction.factors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Factors Considered</h4>
              <div className="space-y-2">
                {prediction.factors.map((factor, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="text-sm">{factor.label}</span>
                    <span className="text-sm font-medium">{(factor.weight * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Predictor;
