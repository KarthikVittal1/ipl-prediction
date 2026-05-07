/**
 * API COMPONENTS INTEGRATION GUIDE
 * 
 * This guide shows how to integrate the API-consuming components into your routing structure.
 * 
 * Available Components:
 * 1. ApiTeamsComponent - Fetches and displays teams from the backend
 * 2. ApiMatchesComponent - Fetches and displays matches with filtering
 * 3. ApiVenuesComponent - Fetches and displays stadium/venue information
 * 4. ApiPointsTableComponent - Fetches and displays the points table
 * 
 * ============================================
 * USAGE IN ROUTES - Example 1: Adding to matches route
 * ============================================
 */

// In src/routes/matches.tsx
// import { ApiMatchesComponent } from '@/components';
// import { createFileRoute } from '@tanstack/react-router';
//
// export const Route = createFileRoute('/matches')({
//   component: MatchesPage,
// });
//
// function MatchesPage() {
//   return (
//     <div className="mx-auto max-w-7xl px-4 py-8">
//       <h1 className="text-2xl font-bold tracking-tight">IPL 2026 Matches</h1>
//       {/* Your API component - handles loading, errors, and data display */}
//       <ApiMatchesComponent type="all" limit={20} />
//     </div>
//   );
// }

// ============================================
// USAGE IN ROUTES - Example 2: Adding to teams route
// ============================================
//
// import { ApiTeamsComponent } from '@/components';
// import { createFileRoute } from '@tanstack/react-router';
//
// export const Route = createFileRoute('/teams')({
//   component: TeamsPage,
// });
//
// function TeamsPage() {
//   return (
//     <div className="mx-auto max-w-7xl px-4 py-8">
//       <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
//       <ApiTeamsComponent />
//     </div>
//   );
// }

// ============================================
// USAGE IN ROUTES - Example 3: Adding to points route
// ============================================
//
// import { ApiPointsTableComponent } from '@/components';
// import { createFileRoute } from '@tanstack/react-router';
//
// export const Route = createFileRoute('/points')({
//   component: PointsPage,
// });
//
// function PointsPage() {
//   return (
//     <div className="mx-auto max-w-7xl px-4 py-8">
//       <h1 className="text-2xl font-bold tracking-tight">Points Table - 2026</h1>
//       <ApiPointsTableComponent season={2026} />
//     </div>
//   );
// }

// ============================================
// USAGE IN ROUTES - Example 4: Adding to stadiums route
// ============================================
//
// import { ApiVenuesComponent } from '@/components';
// import { createFileRoute } from '@tanstack/react-router';
//
// export const Route = createFileRoute('/stadiums')({
//   component: StadiumsPage,
// });
//
// function StadiumsPage() {
//   return (
//     <div className="mx-auto max-w-7xl px-4 py-8">
//       <h1 className="text-2xl font-bold tracking-tight">IPL 2026 Venues</h1>
//       <ApiVenuesComponent />
//     </div>
//   );
// }

// ============================================
// DIRECT HOOK USAGE IN COMPONENTS - Example 5
// ============================================
// 
// import { useMatches, useTeams, usePointsTable } from '@/services/api';
//
// function CustomComponent() {
//   // Fetch matches
//   const { data: matchesData, isLoading: matchesLoading, error: matchesError } = useMatches('live', 10);
//   
//   // Fetch teams
//   const { data: teamsData, isLoading: teamsLoading, error: teamsError } = useTeams();
//   
//   // Fetch points table
//   const { data: pointsData, isLoading: pointsLoading } = usePointsTable(2026);
//
//   return (
//     <div>
//       {/* Handle loading, errors, and render your custom UI */}
//       {matchesLoading ? <p>Loading...</p> : <p>Matches: {matchesData?.matches?.length}</p>}
//     </div>
//   );
// }

// ============================================
// API ENDPOINTS AVAILABLE
// ============================================
//
// All endpoints are configured in src/services/api.js:
// 
// GET  /                    - Home page data
// GET  /teams              - List all teams
// GET  /venues             - List all venues/stadiums
// GET  /matches            - List matches (query: type, limit)
// GET  /points-table       - Points table (query: season)
// POST /predict            - AI match prediction
//
// BASE_URL: http://localhost:8000

// ============================================
// COMPONENT FEATURES
// ============================================
//
// ✓ Automatic loading states with spinners
// ✓ Error handling with error messages
// ✓ React Query integration for caching & refetching
// ✓ Responsive grid layouts
// ✓ Accessibility support
// ✓ Customizable filtering & pagination

// ============================================
// TO USE THESE COMPONENTS:
// ============================================
// 
// 1. Import the component in your route file:
//    import { ApiTeamsComponent } from '@/components';
//
// 2. Use it in your component:
//    <ApiTeamsComponent />
//
// 3. For custom hooks, import from api.js:
//    import { useTeams, useMatches } from '@/services/api';
//
// ============================================
