# Gully CricScore - Developer Quick Reference

## Table of Contents
1. [Getting Started](#getting-started)
2. [Common Tasks](#common-tasks)
3. [API Quick Reference](#api-quick-reference)
4. [Component Usage](#component-usage)
5. [Database Queries](#database-queries)
6. [Debugging Tips](#debugging-tips)
7. [Code Snippets](#code-snippets)

---

## Getting Started

### Initial Setup (5 minutes)

```bash
# Clone repository
git clone <repo-url>
cd gully-cricscore

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your values
MONGODB_URI=mongodb://localhost:27017/gully-cricscore
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development

# Run development server
npm run dev

# Open http://localhost:3000
```

### Project Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)

# Production
npm run build            # Build for production
npm start                # Start production server

# Code Quality
npm run lint             # Run Biome linter
npm run format           # Format code with Biome
```

---

## Common Tasks

### 1. Creating a New API Endpoint

**Example: Create `/api/players` endpoint**

```typescript
// src/app/api/players/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Player from "@/models/Player";

export async function GET() {
  try {
    await dbConnect();
    const players = await Player.find().lean();
    return NextResponse.json(players);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const player = await Player.create(body);
    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create player" },
      { status: 500 }
    );
  }
}
```

### 2. Creating a New Model

**Example: Player model**

```typescript
// src/models/Player.ts
import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IPlayer extends Document {
  name: string;
  teamId: Types.ObjectId;
  battingOrder: number;
  role: "batsman" | "bowler" | "all-rounder";
}

const PlayerSchema = new Schema<IPlayer>({
  name: { type: String, required: true },
  teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
  battingOrder: { type: Number, required: true },
  role: { type: String, enum: ["batsman", "bowler", "all-rounder"], required: true },
});

// Add index for better query performance
PlayerSchema.index({ teamId: 1, battingOrder: 1 });

const Player: Model<IPlayer> = 
  mongoose.models.Player || mongoose.model<IPlayer>("Player", PlayerSchema);

export default Player;
```

### 3. Creating a New Page

**Example: Player stats page**

```typescript
// src/app/players/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageContainer, CardBase } from '@/components/Styles';

interface PlayerData {
  name: string;
  role: string;
  // ... other fields
}

export default function PlayerPage() {
  const { id } = useParams();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlayer() {
      try {
        const res = await fetch(`/api/players/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPlayer(data);
        }
      } catch (error) {
        console.error('Failed to fetch player:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayer();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!player) return <div>Player not found</div>;

  return (
    <div className={PageContainer}>
      <div className={CardBase}>
        <h1>{player.name}</h1>
        <p>Role: {player.role}</p>
      </div>
    </div>
  );
}
```

### 4. Creating a New Component

**Example: PlayerCard component**

```typescript
// src/components/PlayerCard.tsx
interface PlayerCardProps {
  name: string;
  role: string;
  onClick?: () => void;
}

export default function PlayerCard({ name, role, onClick }: PlayerCardProps) {
  return (
    <div 
      className="p-4 border rounded-lg shadow hover:shadow-lg cursor-pointer"
      onClick={onClick}
    >
      <h3 className="font-bold text-lg">{name}</h3>
      <p className="text-gray-600">{role}</p>
    </div>
  );
}

// Usage:
// <PlayerCard name="John Doe" role="Batsman" onClick={() => {}} />
```

### 5. Adding Authentication to a Page

```typescript
// src/app/protected-page/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Roles } from '@/types/roles';

export default function ProtectedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Loading state
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    router.push('/');
    return null;
  }

  // Check role
  if (session?.user?.role !== Roles.umpire && session?.user?.role !== Roles.admin) {
    return <div>Access Denied</div>;
  }

  // Authorized
  return <div>Protected Content</div>;
}
```

---

## API Quick Reference

### Match Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/match` | List all matches | No |
| POST | `/api/match` | Create new match | No* |
| GET | `/api/match/[matchId]` | Get match details | No |

*Should be protected

### Innings Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/innings/[inningsId]` | Get innings details | No |

### Ball Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/ball` | Record a ball | No* |

*Should be protected

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth routes |

---

## Component Usage

### Alert

```typescript
import Alert from '@/components/Alert';

<Alert 
  variant="success"  // success, error, warning, info
  title="Success!"
  message="Operation completed"
  onClose={() => {}}
/>
```

### Input

```typescript
import Input from '@/components/Input';

<Input
  label="Team Name"
  type="text"
  required
  error={errors.teamName?.message}
  {...register('teamName')}
/>
```

### StatusBadge

```typescript
import StatusBadge from '@/components/StatusBadge';

<StatusBadge status="in-progress" />  // or "completed"
```

### TeamScore

```typescript
import { TeamScore } from '@/components/TeamScore';

<TeamScore
  name="Team A"
  runs={123}
  wickets={4}
  overs="10.3"
/>
// Displays: Team A: 123/4 (10.3)
```

### TabSwitcher

```typescript
import { TabSwitcher } from '@/components/TabSwitcher';

<TabSwitcher
  tabs={['1st Innings', '2nd Innings']}
  onChange={(index, label) => {
    console.log(`Switched to tab ${index}: ${label}`);
  }}
/>
```

### UmpireControls

```typescript
import UmpireControls from '@/components/UmpireControls';

<UmpireControls
  onScore={({ runs, isExtra, extraType, isWicket }) => {
    // Handle ball scoring
  }}
/>
```

---

## Database Queries

### Common Mongoose Queries

#### Find All Documents

```typescript
const matches = await Match.find();
```

#### Find by ID

```typescript
const match = await Match.findById(matchId);
```

#### Find with Conditions

```typescript
const matches = await Match.find({
  status: "in-progress",
  location: "Ground A"
});
```

#### Find One

```typescript
const lastBall = await Ball.findOne({ inningsId })
  .sort({ overNumber: -1, ballNumber: -1 });
```

#### Create Document

```typescript
const match = await Match.create({
  location: "Ground A",
  overs: 10,
  teams: [teamAId, teamBId]
});
```

#### Update Document

```typescript
// Method 1: Find and update
const innings = await Innings.findById(inningsId);
innings.score += runs;
innings.wickets += 1;
await innings.save();

// Method 2: Update directly
await Innings.findByIdAndUpdate(
  inningsId,
  { $inc: { score: runs, wickets: 1 } }
);
```

#### Populate References

```typescript
const match = await Match.findById(matchId)
  .populate("teams")
  .populate("innings");
```

#### Nested Population

```typescript
const matches = await Match.find()
  .populate({
    path: 'innings',
    populate: [
      { path: 'battingTeamId', select: 'name' },
      { path: 'bowlingTeamId', select: 'name' }
    ]
  });
```

#### Lean Queries (Plain JS Objects)

```typescript
const matches = await Match.find().lean();
// Returns plain objects, not Mongoose documents
// Faster, but no Mongoose methods
```

#### Aggregation

```typescript
const stats = await Ball.aggregate([
  { $match: { inningsId: new ObjectId(inningsId) } },
  { $group: {
    _id: "$overNumber",
    totalRuns: { $sum: "$runs" },
    wickets: { $sum: { $cond: ["$isWicket", 1, 0] } }
  }}
]);
```

---

## Debugging Tips

### 1. Database Connection Issues

```typescript
// Check connection status
import mongoose from 'mongoose';

console.log('Connection state:', mongoose.connection.readyState);
// 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
```

### 2. API Route Debugging

```typescript
// Add detailed logging
export async function POST(req: NextRequest) {
  console.log('Request received');
  
  const body = await req.json();
  console.log('Request body:', JSON.stringify(body, null, 2));
  
  try {
    // ... your code
    console.log('Success!');
  } catch (error) {
    console.error('Error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : '');
  }
}
```

### 3. Client-Side Debugging

```typescript
// React DevTools
// Check component state and props

// Network Tab
// Inspect API requests and responses

// Console logging with context
console.log('[MatchPage] Loading match:', matchId);
console.log('[MatchPage] Match data:', match);
```

### 4. Mongoose Query Debugging

```typescript
// Enable debug mode
mongoose.set('debug', true);

// Or specific query
const query = Match.find({ status: "in-progress" });
console.log('Query:', query.getQuery());
```

### 5. NextAuth Debugging

```typescript
// In .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_URL_INTERNAL=http://localhost:3000
NEXTAUTH_DEBUG=true

// Check session
import { useSession } from 'next-auth/react';
const { data: session } = useSession();
console.log('Session:', session);
```

---

## Code Snippets

### 1. Error Handler Wrapper

```typescript
// src/lib/api-handler.ts
import { NextRequest, NextResponse } from 'next/server';

export function withErrorHandler(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      console.error('API Error:', error);
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  };
}

// Usage:
export const POST = withErrorHandler(async (req: NextRequest) => {
  // Your code
});
```

### 2. Custom Hook for API Calls

```typescript
// src/hooks/useApi.ts
import { useState, useEffect } from 'react';

export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [url]);

  return { data, loading, error };
}

// Usage:
const { data: match, loading, error } = useApi<Match>(`/api/match/${matchId}`);
```

### 3. Cricket Utility Functions

```typescript
// src/lib/cricket-utils.ts

/**
 * Increment ball number, handling over completion
 */
export function incrementBall(
  overNumber: number,
  ballNumber: number,
  isExtra: boolean = false
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

/**
 * Format overs completed as string
 */
export function formatOversCompleted(
  overNumber: number,
  ballNumber: number
): string {
  if (ballNumber === 0) {
    return `${overNumber}.0`;
  }
  return `${overNumber}.${ballNumber}`;
}

/**
 * Calculate run rate
 */
export function calculateRunRate(
  runs: number,
  overs: string
): number {
  const [completedOvers, balls] = overs.split('.').map(Number);
  const totalOvers = completedOvers + balls / 6;
  
  if (totalOvers === 0) return 0;
  
  return Number((runs / totalOvers).toFixed(2));
}

/**
 * Check if innings is complete
 */
export function isInningsComplete(
  wickets: number,
  oversCompleted: string,
  totalOvers: number,
  maxWickets: number = 10
): boolean {
  const [completedOvers] = oversCompleted.split('.').map(Number);
  
  return wickets >= maxWickets || completedOvers >= totalOvers;
}
```

### 4. Form Validation Schemas

```typescript
// src/lib/validation.ts
import { z } from 'zod';  // Install: npm install zod

export const MatchSchema = z.object({
  location: z.string().min(1, "Location is required"),
  teamAName: z.string().min(1, "Team A name is required"),
  teamBName: z.string().min(1, "Team B name is required"),
  noOfPlayers: z.number().min(1).max(11),
  totalOvers: z.number().min(1).max(50),
  tossWonBy: z.enum(['teamA', 'teamB'])
});

export const BallSchema = z.object({
  inningsId: z.string(),
  overNumber: z.number().min(0),
  ballNumber: z.number().min(1).max(6),
  runs: z.number().min(0).max(7),
  isWicket: z.boolean(),
  isExtra: z.boolean(),
  extraType: z.enum(['none', 'wide', 'noball'])
});
```

### 5. Type Guards

```typescript
// src/lib/type-guards.ts

export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export function isMatchComplete(match: any): match is CompletedMatch {
  return match.status === 'completed' && match.completedAt != null;
}

export function isExtraBall(ball: any): boolean {
  return ball.isExtra && ball.extraType !== 'none';
}
```

---

## Testing Utilities

### API Route Testing

```typescript
// Example test structure (if tests were to be added)
import { POST } from '@/app/api/match/route';
import { NextRequest } from 'next/server';

describe('POST /api/match', () => {
  it('should create a new match', async () => {
    const body = {
      location: 'Test Ground',
      teamAName: 'Team A',
      teamBName: 'Team B',
      noOfPlayers: 11,
      totalOvers: 10,
      tossWonBy: 'teamA'
    };

    const request = new NextRequest('http://localhost:3000/api/match', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('_id');
  });
});
```

---

## Common Pitfalls and Solutions

### 1. MongoDB Connection Not Found

**Problem:** `Error: MongoNotConnectedError`

**Solution:**
```typescript
// Always call dbConnect() before database operations
await dbConnect();
const matches = await Match.find();
```

### 2. Reference Not Populated

**Problem:** Getting ObjectId instead of object

**Solution:**
```typescript
// Add .populate()
const match = await Match.findById(id).populate('teams');
```

### 3. Client Component Using Server-Only Code

**Problem:** `Error: createContext only works in Client Components`

**Solution:**
```typescript
// Add 'use client' at the top of file
'use client';

import { useSession } from 'next-auth/react';
```

### 4. Environment Variable Undefined

**Problem:** `process.env.MONGODB_URI` is undefined

**Solution:**
- Check `.env.local` exists
- Restart dev server after adding env vars
- For client-side vars, prefix with `NEXT_PUBLIC_`

### 5. API Route Not Found (404)

**Problem:** `/api/match` returns 404

**Solution:**
- Check file is in `src/app/api/match/route.ts`
- Export `GET` or `POST` function
- Restart dev server

---

## Useful VS Code Extensions

1. **ES7+ React/Redux/React-Native snippets** - Code snippets
2. **Tailwind CSS IntelliSense** - Tailwind autocomplete
3. **MongoDB for VS Code** - MongoDB integration
4. **Biome** - Linting and formatting
5. **Pretty TypeScript Errors** - Better TS error messages

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [MongoDB Manual](https://www.mongodb.com/docs/)

---

**Quick Help:**
- Issues? Check console logs and Network tab
- Questions? See CODEBASE.md for detailed explanations
- Architecture? See ARCHITECTURE.md for system design

Happy Coding! 🏏
