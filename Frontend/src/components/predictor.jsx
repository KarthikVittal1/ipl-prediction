import { useState, useEffect } from "react";
import { api } from "../services/api";

const Predictor = () => {
  const [teams, setTeams] = useState([]);
  const [venues, setVenues] = useState([]);

  const [form, setForm] = useState({
    team1: "",
    team2: "",
    venue: "",
    toss_winner: "",
    toss_decision: "bat",
    is_day_night: true,
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getTeams().then((res) => setTeams(res.teams || []));
    api.getVenues().then((res) => setVenues(res.venues || []));
  }, []);

  const handlePredict = async (e) => {
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

      const result = await api.predictMatch(requestData);
      setPrediction(result);
    } catch (err) {
      console.error("Prediction failed:", err);
      alert("Prediction failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-sm p-8">

        <h1 className="text-4xl font-bold text-center text-foreground mb-2">
          IPL AI Predictor
        </h1>

        <p className="text-muted-foreground text-center mb-8">
          Predict match winner using AI
        </p>

        <form onSubmit={handlePredict} className="space-y-5">

          {/* Team 1 */}
          <div>
            <label className="block text-foreground mb-2 font-medium">
              Team 1
            </label>

            <select
              value={form.team1}
              onChange={(e) =>
                setForm({ ...form, team1: e.target.value })
              }
              className="w-full bg-background text-foreground p-4 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-red-500"
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
            <label className="block text-foreground mb-2 font-medium">
              Team 2
            </label>

            <select
              value={form.team2}
              onChange={(e) =>
                setForm({ ...form, team2: e.target.value })
              }
              className="w-full bg-background text-foreground p-4 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* Venue */}
          <div>
            <label className="block text-foreground mb-2 font-medium">
              Venue
            </label>

            <select
              value={form.venue}
              onChange={(e) =>
                setForm({ ...form, venue: e.target.value })
              }
              className="w-full bg-background text-foreground p-4 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            >
              <option value="">Select Venue</option>

              {venues.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Toss Decision */}
          <div>
            <label className="block text-foreground mb-2 font-medium">
              Toss Decision
            </label>

            <select
              value={form.toss_decision}
              onChange={(e) =>
                setForm({ ...form, toss_decision: e.target.value })
              }
              className="w-full bg-background text-foreground p-4 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="bat">Bat First</option>
              <option value="field">Field First</option>
            </select>
          </div>

          {/* Predict Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-4 rounded-xl transition duration-300 shadow-lg"
          >
            {loading ? "Predicting..." : "Predict Winner"}
          </button>
        </form>

        {/* Prediction Result */}
        {prediction && (
          <div className="mt-8 bg-muted/50 rounded-2xl p-6 border border-border">

            <h2 className="text-2xl font-bold text-green-600 text-center mb-4">
              🏆 {prediction.winner}
            </h2>

            <div className="space-y-4">

              <div>
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                  <span>{form.team1}</span>
                  <span>{(prediction.prob_a * 100).toFixed(1)}%</span>
                </div>

                <div className="w-full bg-border rounded-full h-3">
                  <div
                    className="bg-red-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${prediction.prob_a * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                  <span>{form.team2}</span>
                  <span>{(prediction.prob_b * 100).toFixed(1)}%</span>
                </div>

                <div className="w-full bg-border rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${prediction.prob_b * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-5 text-center text-muted-foreground">
              Confidence:
              <span className="ml-2 text-foreground font-semibold">
                {Math.max(prediction.prob_a, prediction.prob_b) > 0.7
                  ? "High"
                  : "Medium"}
              </span>
            </div>

            {/* Factors */}
            {prediction.factors &&
              prediction.factors.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    Factors Considered
                  </h3>

                  <div className="space-y-2">
                    {prediction.factors.map((factor, index) => (
                      <div
                        key={index}
                        className="flex justify-between bg-background p-3 rounded-lg border border-border"
                      >
                        <span className="text-muted-foreground">
                          {factor.label}
                        </span>

                        <span className="text-foreground font-medium">
                          {(factor.weight * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Predictor;