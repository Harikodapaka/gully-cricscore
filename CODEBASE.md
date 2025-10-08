# Gully CricScore - Codebase Documentation

## Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Data Models](#data-models)
5. [API Endpoints](#api-endpoints)
6. [UI Components](#ui-components)
7. [Pages & Routes](#pages--routes)
8. [Authentication & Authorization](#authentication--authorization)
9. [Development Workflow](#development-workflow)
10. [Known Issues](#known-issues)
11. [Improvement Recommendations](#improvement-recommendations)

---

## Overview

**Gully CricScore** is a cricket scoring application designed for gully (street) cricket matches. It allows users to:
- Create and manage cricket matches
- Track live scores ball-by-ball
- View match details and innings statistics
- Support for umpire and spectator roles

The application is built with Next.js 15 (App Router), MongoDB/Mongoose for data storage, and NextAuth for authentication.

---

## Tech Stack

### Frontend
- **Next.js 15.5.4** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Styling
- **React Hook Form 7.64.0** - Form management
- **NextAuth 4.24.11** - Authentication

### Backend
- **Next.js API Routes** - Backend API
- **MongoDB 6.20.0** - Database
- **Mongoose 8.19.0** - ODM (Object Data Modeling)

### Dev Tools
- **Biome 2.2.0** - Linter and formatter
- **TypeScript** - Type checking

---

## Architecture

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (backend)
│   │   ├── auth/         # Authentication endpoints
│   │   ├── ball/         # Ball tracking endpoints
│   │   ├── innings/      # Innings endpoints
│   │   └── match/        # Match management endpoints
│   ├── matches/          # Match details pages
│   ├── umpire/           # Umpire-specific pages
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/            # Reusable UI components
├── lib/                   # Utility functions
│   ├── auth.ts           # NextAuth configuration
│   └── mongodb.ts        # MongoDB connection
├── models/                # Mongoose schemas
│   ├── Ball.ts
│   ├── Innings.ts
│   ├── Match.ts
│   ├── Team.ts
│   └── User.ts
└── types/                 # TypeScript type definitions
```

### Key Concepts

1. **Match**: A cricket match with location, overs, teams, and innings
2. **Team**: A team with name, player count, and batting order
3. **Innings**: A single innings with batting/bowling teams, score, and wickets
4. **Ball**: Individual ball records with runs, wickets, extras

---

## Data Models

### 1. Match Model (`src/models/Match.ts`)

Represents a cricket match.

```typescript
interface IMatch {
    location: string;              // Match location
    overs: number;                // Total overs per innings
    status: "in-progress" | "completed";
    currentInnings: 1 | 2;        // Which innings is active
    createdAt: Date;
    completedAt?: Date;
    teams: Types.ObjectId[];      // References to Team documents
    innings: Types.ObjectId[];    // References to Innings documents
}
```

**Key Features:**
- Tracks match status and progress
- Links to teams and innings
- Stores match metadata (location, overs)

### 2. Team Model (`src/models/Team.ts`)

Represents a cricket team.

```typescript
interface ITeam {
    name: string;                 // Team name
    numberOfPlayers: number;      // Player count (default: 11)
    battingOrder: "1st" | "2nd";  // Batting order (determined by toss)
}
```

**Key Features:**
- Simple team representation
- Batting order determined by toss winner

### 3. Innings Model (`src/models/Innings.ts`)

Represents one innings of a match.

```typescript
interface IInnings {
    inningsNumber: 1 | 2;         // Which innings (1st or 2nd)
    battingTeamId: Types.ObjectId; // Reference to Team
    bowlingTeamId: Types.ObjectId; // Reference to Team
    score: number;                 // Total runs scored
    wickets: number;               // Total wickets fallen
    status: "in-progress" | "completed";
    startedAt: Date;
    completedAt?: Date;
}
```

**Key Features:**
- Tracks score and wickets
- Links batting and bowling teams
- Status tracking

### 4. Ball Model (`src/models/Ball.ts`)

Represents a single ball bowled in an innings.

```typescript
interface IBall {
    inningsId: Types.ObjectId;    // Reference to Innings
    overNumber: number;            // Over number (0-based)
    ballNumber: number;            // Ball number within over (1-6)
    runs: number;                  // Runs scored (including extras)
    isWicket: boolean;             // Was a wicket taken?
    isExtra: boolean;              // Is this an extra?
    extraType: "none" | "wide" | "noball";
    timestamp: Date;
}
```

**Key Features:**
- Detailed ball-by-ball tracking
- Supports extras (wides, no-balls)
- Indexed for performance: `{ inningsId: 1, overNumber: -1, ballNumber: -1 }`

### 5. User Model (`src/models/User.ts`)

Represents authenticated users.

```typescript
interface IUser {
    email: string;                // Unique email
    name: string;                 // Display name
    role: "admin" | "umpire" | "spectator";
    createdAt: Date;
}
```

**Key Features:**
- Role-based access control
- Google OAuth integration

---

## API Endpoints

### Match Endpoints

#### GET `/api/match`
Fetch all matches with populated teams and innings.

**Response:**
```json
[
  {
    "_id": "...",
    "location": "Ground A",
    "overs": 10,
    "status": "in-progress",
    "currentInnings": 1,
    "teams": [...],
    "innings": [
      {
        "inningsNumber": 1,
        "score": 45,
        "wickets": 2,
        "oversCompleted": "4.3"
      }
    ]
  }
]
```

**Logic:**
- Fetches all matches
- Populates teams and innings
- Calculates `oversCompleted` for each innings by finding the last ball

#### POST `/api/match`
Create a new match.

**Request Body:**
```json
{
  "location": "Ground A",
  "teamAName": "Team A",
  "teamBName": "Team B",
  "noOfPlayers": 11,
  "totalOvers": 10,
  "tossWonBy": "teamA"  // or "teamB"
}
```

**Logic:**
1. Creates Team A and Team B
2. Determines batting order based on toss
3. Creates two innings (one for each team)
4. Creates match document linking teams and innings

#### GET `/api/match/[matchId]`
Fetch a specific match by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "teams": [...],
    "innings": [
      {
        "oversCompleted": "4.3",
        ...
      }
    ]
  }
}
```

### Innings Endpoints

#### GET `/api/innings/[inningsId]`
Fetch innings details with calculated `oversCompleted`.

**Response:**
```json
{
  "_id": "...",
  "inningsNumber": 1,
  "score": 45,
  "wickets": 2,
  "battingTeamId": {...},
  "bowlingTeamId": {...},
  "oversCompleted": "4.3"
}
```

**Logic:**
- Finds the last ball bowled
- Calculates overs completed: `{overNumber}.{ballNumber}`

### Ball Endpoints

#### POST `/api/ball`
Record a new ball.

**Request Body:**
```json
{
  "inningsId": "...",
  "overNumber": 4,
  "ballNumber": 3,
  "runs": 4,
  "isWicket": false,
  "isExtra": false,
  "extraType": "none"
}
```

**Logic:**
1. Validates innings exists
2. Creates ball record
3. Updates innings score and wickets
4. Returns created ball

### Authentication Endpoints

#### GET/POST `/api/auth/[...nextauth]`
NextAuth authentication routes for Google OAuth.

---

## UI Components

### Core Components (`src/components/`)

#### 1. **Alert.tsx**
Displays alert messages with variants (success, error, warning, info).

**Usage:**
```tsx
<Alert 
  variant="error" 
  title="Error!" 
  message="Something went wrong"
  onClose={handleClose}
/>
```

#### 2. **Header.tsx**
Application header with navigation and authentication.

**Features:**
- Logo/Title
- Sign in/out buttons
- User role display

#### 3. **Input.tsx**
Reusable form input component with error handling.

**Props:**
- `label`, `error`, `required`
- Supports text, number, email types

#### 4. **MatchCard.tsx**
Displays match summary on the home page.

**Shows:**
- Match location
- Team names and scores
- Status badge
- Innings information

#### 5. **TeamScore.tsx**
Displays team score in format: `TeamName: Runs/Wickets (Overs)`

#### 6. **UmpireControls.tsx**
Ball-by-ball scoring interface for umpires.

**Features:**
- Run buttons (0-6)
- Wicket button
- Extra buttons (wide, no-ball)

#### 7. **TabSwitcher.tsx**
Switch between different tabs (e.g., innings).

#### 8. **RadioGroup.tsx**
Custom radio button group component.

#### 9. **Modal.tsx**
Modal dialog component.

#### 10. **StatusBadge.tsx**
Badge showing match/innings status.

#### 11. **Styles.ts**
Shared Tailwind CSS class constants.

**Exports:**
- `PageContainer`, `CardBase`, `BlueBtn`, `BlueBtnOutlined`

---

## Pages & Routes

### Public Pages

#### `/` (Home Page)
**File:** `src/app/page.tsx`

**Features:**
- Lists all matches
- Fetches from `/api/match`
- Each match is a clickable card linking to `/matches/{id}`

**Data Flow:**
```
Server Component → fetch /api/match → Display MatchCard components
```

#### `/matches/[id]` (Match Details)
**File:** `src/app/matches/[id]/page.tsx`

**Features:**
- Shows scorecard with both teams
- Tab switcher for innings
- Ball-by-ball breakdown by overs
- Currently shows mock data (TODO: fetch real data)

**Current Issue:** ⚠️ This page uses hardcoded mock data instead of fetching from API

### Authenticated Pages

#### `/umpire` (Start Match)
**File:** `src/app/umpire/page.tsx`

**Access:** Umpire/Admin role required

**Features:**
- Form to create new match
- Fields: location, team names, players, overs, toss winner
- Submits to `/api/match` POST endpoint

**Authorization Flow:**
1. Check authentication status
2. Redirect to sign-in if unauthenticated
3. Check user role
4. Show error if spectator role
5. Show match form if umpire/admin

#### `/umpire/[matchId]` (Score Match)
**File:** `src/app/umpire/[matchId]/page.tsx`

**Access:** Umpire/Admin role required

**Features:**
- Live scoring interface
- UmpireControls component for ball-by-ball scoring
- Real-time score updates
- Submits to `/api/ball` POST endpoint

**Data Flow:**
1. Fetch match data on load
2. User clicks run/wicket/extra button
3. Calculate new over/ball number
4. Update local state optimistically
5. POST to `/api/ball`

**Key Logic:**
```typescript
// Ball increment logic
let newBall = isExtra ? ball : ball + 1;
if (newBall >= 6) {
  newOver = newOver + 1;
  newBall = 0;
}
```

---

## Authentication & Authorization

### NextAuth Configuration (`src/lib/auth.ts`)

**Provider:** Google OAuth

**Sign-In Flow:**
1. User clicks "Sign In with Google"
2. Google OAuth authentication
3. Check if user exists in database
4. If new user, create with `spectator` role
5. If existing user, load their role
6. Return session with user role

**Session Callback:**
```typescript
async session({ session }) {
  const dbUser = await User.findOne({ email: session.user?.email });
  if (dbUser) {
    session.user.role = dbUser.role;
  }
  return session;
}
```

### Role-Based Access

**Roles:**
1. **Spectator** (default) - Can only view matches
2. **Umpire** - Can create and score matches
3. **Admin** - Full access (same as umpire currently)

**Protected Routes:**
- `/umpire/*` - Requires umpire or admin role

---

## Development Workflow

### Setup

1. **Install Dependencies:**
```bash
npm install
```

2. **Environment Variables:**
Create `.env.local`:
```
MONGODB_URI=mongodb://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
```

3. **Run Development Server:**
```bash
npm run dev
```

4. **Build for Production:**
```bash
npm run build
npm start
```

### Code Quality

**Linting:**
```bash
npm run lint
```

**Formatting:**
```bash
npm run format
```

**Tool:** Biome (replaces ESLint + Prettier)

### Database Connection

**File:** `src/lib/mongodb.ts`

**Features:**
- Connection pooling
- Caches connection in global scope
- Handles reconnection
- Development/production optimized

**Usage:**
```typescript
import dbConnect from '@/lib/mongodb';

async function handler() {
  await dbConnect();
  // Now use Mongoose models
}
```

---

## Known Issues

### 1. Build Failure - Font Loading
**Error:** `Failed to fetch 'Geist' from Google Fonts`

**Cause:** Sandboxed environment blocks fonts.googleapis.com

**Location:** `src/app/layout.tsx` lines 7-15

**Temporary Fix:** Comment out or replace with system fonts

### 2. Linting Issues (74 errors, 59 warnings)

**Major Issues:**
- `noExplicitAny` - Using `any` type in error handlers
- `useImportType` - Not using `type` imports for type-only imports
- `noUnusedImports` - Unused TypeScript imports
- Formatting inconsistencies (indentation, quotes)

**Affected Files:**
- `src/app/api/ball/route.ts`
- `src/app/api/innings/[inningsId]/route.ts`
- `src/app/api/match/route.ts`
- `src/models/*.ts`
- `src/types/*.ts`

### 3. Mock Data in Match Details Page

**File:** `src/app/matches/[id]/page.tsx`

**Issue:** Uses hardcoded team data instead of fetching from API

**TODO:** Implement data fetching from `/api/match/[matchId]`

### 4. Missing API Error Handling

**Issue:** Frontend doesn't handle API errors gracefully

**Example:** In `/umpire/[matchId]/page.tsx`, ball submission errors are only logged

### 5. Over Calculation Inconsistency

**Issue:** Different over completion logic in multiple places

**Locations:**
- `src/app/api/innings/[inningsId]/route.ts` - Standard calculation
- `src/app/api/match/route.ts` - Rounds up when ballNumber === 6
- `src/app/umpire/[matchId]/page.tsx` - Frontend calculation differs

**Problem:**
```typescript
// Backend (match route.ts):
if (ballNumber === 6) {
  oversCompleted = Math.ceil(+oversCompleted).toString()
}

// Frontend (umpire page):
if (newBall >= 6) {  // Note: >= vs ===
  newOver = newOver + 1;
  newBall = 0;
}
```

---

## Improvement Recommendations

### High Priority

#### 1. Fix Build Issues
- **Font Loading:** Replace Google Fonts with local or system fonts
- **Linting:** Run `npm run lint` and fix all errors

#### 2. Standardize Over Calculation
- **Issue:** Inconsistent ball/over increment logic
- **Solution:** Create a utility function:
```typescript
// src/lib/cricket-utils.ts
export function incrementBall(
  overNumber: number, 
  ballNumber: number, 
  isExtra: boolean
): { overNumber: number; ballNumber: number } {
  if (isExtra) {
    return { overNumber, ballNumber };
  }
  
  const newBall = ballNumber + 1;
  if (newBall > 6) {
    return { overNumber: overNumber + 1, ballNumber: 1 };
  }
  
  return { overNumber, ballNumber: newBall };
}

export function formatOversCompleted(
  overNumber: number, 
  ballNumber: number
): string {
  // Ball numbers are 1-6, when ball 7 is reached, move to next over
  if (ballNumber > 6) {
    return `${overNumber + 1}.0`;
  }
  return `${overNumber}.${ballNumber}`;
}
```

#### 3. Implement Real Data Fetching in Match Details
- Replace mock data in `/matches/[id]/page.tsx`
- Fetch from `/api/match/[matchId]`
- Handle loading and error states

#### 4. Add Error Handling
- Toast notifications for errors
- Retry logic for failed API calls
- Better error messages to users

#### 5. Add TypeScript Strict Mode
- Enable strict type checking
- Remove all `any` types
- Add proper type definitions

### Medium Priority

#### 6. Add Tests
- Unit tests for utility functions
- API route tests
- Component tests with React Testing Library

#### 7. Add Input Validation
- Validate ball numbers (1-6)
- Validate over numbers
- Validate runs (0-6, plus extras)
- Client-side and server-side validation

#### 8. Add Match Completion Logic
- Automatically complete innings when:
  - All overs bowled
  - All wickets fallen
  - Target achieved (2nd innings)
- Update match status to "completed"

#### 9. Improve Database Queries
- Add indexes for frequently queried fields
- Use aggregation pipelines for complex queries
- Cache frequently accessed data

#### 10. Add Real-time Updates
- WebSocket or Server-Sent Events for live scoring
- Update all viewers when umpire scores a ball

### Low Priority

#### 11. Add Player Management
- Track individual players
- Batting/bowling statistics
- Player of the match

#### 12. Add Ball Commentary
- Allow umpire to add commentary to each ball
- Display commentary on match details page

#### 13. Add Match History
- Archive completed matches
- Search and filter matches
- Match statistics and analytics

#### 14. Responsive Design
- Optimize for mobile devices
- Better tablet experience
- Touch-friendly controls

#### 15. Add More Cricket Features
- Powerplay tracking
- Extras breakdown (byes, leg-byes)
- Partnerships tracking
- Fall of wickets display

### Code Quality Improvements

#### 16. Refactor Components
- Break down large components
- Extract custom hooks
- Improve component composition

#### 17. Add Documentation
- JSDoc comments for functions
- Component prop documentation
- API endpoint documentation

#### 18. Improve Type Safety
```typescript
// Instead of:
const body: any = await req.json();

// Use:
interface CreateBallRequest {
  inningsId: string;
  overNumber: number;
  ballNumber: number;
  runs: number;
  isWicket: boolean;
  isExtra: boolean;
  extraType: "none" | "wide" | "noball";
}

const body = await req.json() as CreateBallRequest;
```

#### 19. Environment Variable Validation
- Use zod or similar for env validation
- Fail fast if required env vars missing
- Type-safe environment variables

#### 20. Add Logging
- Structured logging (e.g., Winston, Pino)
- Log levels (debug, info, warn, error)
- Request/response logging
- Error tracking (e.g., Sentry)

---

## Cricket Scoring Rules (for reference)

### Over Structure
- 1 over = 6 legal balls
- Extras don't count as balls (over repeats)
- Ball numbers: 1, 2, 3, 4, 5, 6

### Extras
- **Wide:** Ball too wide, 1 run + ball repeated
- **No-ball:** Illegal delivery, 1 run + ball repeated + free hit
- **Bye/Leg-bye:** Runs without bat contact (not implemented yet)

### Wickets
- 10 wickets max (11 players, 1 always batting)
- Innings ends when 10 wickets fall or overs complete

### Scoring
- Runs: 0, 1, 2, 3, 4 (boundary), 6 (over boundary)
- Score format: `Runs/Wickets (Overs)`
- Example: `123/4 (10.3)` = 123 runs, 4 wickets, 10.3 overs

---

## Conclusion

Gully CricScore is a functional cricket scoring application with room for improvement. The core functionality works:
- ✅ Match creation
- ✅ Ball-by-ball scoring
- ✅ Score tracking
- ✅ Authentication with roles

**Next Steps:**
1. Fix build and linting issues
2. Standardize over calculation logic
3. Implement real data fetching in match details
4. Add comprehensive error handling
5. Add tests

This documentation should serve as a guide for understanding the codebase and planning future improvements.
