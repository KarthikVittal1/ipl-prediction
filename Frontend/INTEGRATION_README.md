# API Components Integration Architecture

## 📁 Components Added

### Backend API Service
- **File**: `src/services/api.js`
- **Contains**: 
  - Raw API functions (fetch calls)
  - React Query hooks for data fetching

### API-Consuming Components
1. **ApiTeamsComponent** (`src/components/api-teams.tsx`)
   - Displays teams from backend
   - Handles loading/error states
   - Features: Click to navigate to team details

2. **ApiMatchesComponent** (`src/components/api-matches.tsx`)
   - Displays matches with filtering (all/live/upcoming/completed)
   - Auto-refetch every 20 seconds
   - Features: Tab filtering, responsive grid

3. **ApiVenuesComponent** (`src/components/api-venues.tsx`)
   - Displays stadiums/venues
   - Shows capacity and location
   - Features: MapPin icon, location info

4. **ApiPointsTableComponent** (`src/components/api-points-table.tsx`)
   - Displays standings table
   - Shows rank, team name, games, wins, losses, points
   - Features: Hover effects, responsive scrolling

## 🔗 Integration Flow

```
┌─────────────────────────────────────────────┐
│   Routes (/matches, /teams, /points, etc.)  │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   API Components (api-*.tsx)                │
│   - Handle loading states                   │
│   - Display data                            │
│   - Manage error states                     │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   React Query Hooks (from api.js)           │
│   - useTeams()                              │
│   - useMatches()                            │
│   - useVenues()                             │
│   - usePointsTable()                        │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   Raw API Functions                         │
│   - Fetch calls to backend                  │
│   - API_BASE: http://localhost:8000         │
└─────────────────────────────────────────────┘
```

## 📋 How to Use in Routes

### Quick Start - 3 Steps:

1. **Import the component**
```tsx
import { ApiTeamsComponent } from '@/components';
```

2. **Add to your route component**
```tsx
function TeamsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1>Teams</h1>
      <ApiTeamsComponent />
    </div>
  );
}
```

3. **That's it!** The component handles:
   - Loading state
   - Error handling
   - Data fetching
   - Display formatting

## 🎯 Available Components for Each Route

| Route | Component | Props |
|-------|-----------|-------|
| `/teams` | `ApiTeamsComponent` | None |
| `/matches` | `ApiMatchesComponent` | `type`, `limit` |
| `/stadiums` | `ApiVenuesComponent` | None |
| `/points` | `ApiPointsTableComponent` | `season` |

## 🔧 Backend API Endpoints

All endpoints configured at `API_BASE = "http://localhost:8000"`

- `GET /teams` → List all teams
- `GET /matches?type=live&limit=20` → Match list
- `GET /venues` → Stadium information
- `GET /points-table?season=2026` → Points table
- `POST /predict` → AI match prediction

## 📦 Reusable Hook Pattern

For custom implementations, use the hooks directly:

```tsx
import { useMatches } from '@/services/api';

function CustomMatchDisplay() {
  const { data, isLoading, error } = useMatches('live', 10);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;
  
  return (
    // Your custom UI here
  );
}
```

## ✅ Features

- ✓ **Automatic caching** - React Query handles cache management
- ✓ **Loading states** - Built-in spinners
- ✓ **Error handling** - Displays user-friendly error messages
- ✓ **Responsive design** - Grid layouts adapt to screen size
- ✓ **Real-time updates** - Auto-refetch for live data
- ✓ **Type-safe** - Full TypeScript support

## 🚀 Next Steps

1. Update your route files to import and use these components
2. Ensure backend API is running on http://localhost:8000
3. Test each component in isolation
4. Customize styling/layout as needed
