// Frontend/src/services/api.js
import { useQuery, useMutation } from '@tanstack/react-query';

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function request(path) {
  const res = await fetch(`${API_BASE}${path}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.status === "error") {
    throw new Error(data?.message || data?.detail || `API request failed: ${res.status}`);
  }
  return data;
}

// ============================================
// RAW API FUNCTIONS
// ============================================
export const api = {
  // Home & General
  getHome: async () => {
    return request(`/`);
  },

  // Teams
  getTeams: async () => {
    return request(`/teams`);
  },

  // Venues / Stadiums
  getVenues: async () => {
    return request(`/venues`);
  },

  // Matches
  getMatches: async (type = "all", limit = 20) => {
    return request(`/matches?type=${encodeURIComponent(type)}&limit=${encodeURIComponent(limit)}`);
  },

  // Points Table
  getPointsTable: async (season = 2026) => {
    return request(`/points-table?season=${encodeURIComponent(season)}`);
  },

  // AI Prediction
  predictMatch: async (data) => {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.status === "error") {
      throw new Error(json?.message || json?.detail || `Prediction failed: ${res.status}`);
    }
    return json;
  },
};

// ============================================
// REACT QUERY HOOKS FOR COMPONENTS
// ============================================

// Hook for fetching teams
export const useTeams = () => {
  return useQuery({
    queryKey: ['teams'],
    queryFn: () => api.getTeams(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching venues/stadiums
export const useVenues = () => {
  return useQuery({
    queryKey: ['venues'],
    queryFn: () => api.getVenues(),
    staleTime: 5 * 60 * 1000,
  });
};

// Hook for fetching matches
export const useMatches = (type = "all", limit = 20) => {
  return useQuery({
    queryKey: ['matches', type, limit],
    queryFn: () => api.getMatches(type, limit),
    refetchInterval: 20_000, // Refetch every 20 seconds
  });
};

// Hook for fetching points table
export const usePointsTable = (season = 2026) => {
  return useQuery({
    queryKey: ['pointsTable', season],
    queryFn: () => api.getPointsTable(season),
    staleTime: 5 * 60 * 1000,
  });
};

// Hook for predicting match
export const usePredictMatch = () => {
  return useMutation({
    mutationFn: (data) => api.predictMatch(data),
  });
};
