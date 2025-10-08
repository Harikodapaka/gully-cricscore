# Gully CricScore - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Home Page   │  │ Match Detail │  │ Umpire Pages │         │
│  │   (/)        │  │ (/matches)   │  │  (/umpire)   │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          │    HTTP/HTTPS    │                  │
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼─────────────────┐
│         ▼                  ▼                  ▼                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Next.js Server (SSR/API)                    │  │
│  │                                                          │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐       │  │
│  │  │  API Route │  │  API Route │  │  API Route │       │  │
│  │  │  /match    │  │  /innings  │  │   /ball    │       │  │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘       │  │
│  └────────┼───────────────┼───────────────┼──────────────┘  │
│           │               │               │                  │
│           │    Mongoose   │               │                  │
│           ▼               ▼               ▼                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Mongoose ODM (Object Modeling)            │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        ▼
            ┌─────────────────────┐
            │   MongoDB Database  │
            │  ┌───────────────┐  │
            │  │  Collections: │  │
            │  │  - matches    │  │
            │  │  - teams      │  │
            │  │  - innings    │  │
            │  │  - balls      │  │
            │  │  - users      │  │
            │  └───────────────┘  │
            └─────────────────────┘

External Services:
┌──────────────────┐
│  Google OAuth    │ ───► Authentication
└──────────────────┘
```

## Data Flow Diagrams

### 1. Match Creation Flow

```
┌─────────┐         ┌──────────────┐         ┌─────────────┐
│ Umpire  │────────▶│  /umpire     │────────▶│ Start Match │
│  User   │  Opens  │   Page       │ Fills   │    Form     │
└─────────┘         └──────────────┘         └──────┬──────┘
                                                     │
                                                     │ Submit
                                                     ▼
                                            ┌────────────────┐
                                            │ POST /api/match│
                                            └────────┬───────┘
                                                     │
                         ┌───────────────────────────┼───────────────────────────┐
                         │                           │                           │
                         ▼                           ▼                           ▼
                  ┌────────────┐              ┌────────────┐            ┌─────────────┐
                  │Create Team │              │Create Team │            │Create Match │
                  │     A      │              │     B      │            │  Document   │
                  └──────┬─────┘              └──────┬─────┘            └──────┬──────┘
                         │                           │                         │
                         └───────────┬───────────────┘                         │
                                     ▼                                         │
                              ┌─────────────┐                                  │
                              │Create 2     │                                  │
                              │Innings Docs │                                  │
                              └──────┬──────┘                                  │
                                     │                                         │
                                     └─────────────────┬───────────────────────┘
                                                       │
                                                       ▼
                                              ┌────────────────┐
                                              │ Return Match   │
                                              │ with _id       │
                                              └────────┬───────┘
                                                       │
                                                       ▼
                                              ┌────────────────┐
                                              │ Redirect to    │
                                              │ /umpire/[id]   │
                                              └────────────────┘
```

### 2. Ball Scoring Flow

```
┌─────────┐         ┌───────────────┐
│ Umpire  │────────▶│ /umpire/[id]  │
│  User   │  Opens  │   Page        │
└─────────┘         └────────┬──────┘
                             │
                             │ Fetch match data
                             ▼
                    ┌─────────────────┐
                    │ Display scoring │
                    │   interface     │
                    └────────┬────────┘
                             │
                             │ Click run button (e.g., "4 runs")
                             ▼
                    ┌─────────────────┐
                    │ Calculate new   │
                    │ over/ball number│
                    └────────┬────────┘
                             │
                             │ Update UI optimistically
                             ▼
                    ┌─────────────────┐
                    │ POST /api/ball  │
                    │ {               │
                    │   inningsId,    │
                    │   overNumber,   │
                    │   ballNumber,   │
                    │   runs,         │
                    │   isWicket,     │
                    │   isExtra       │
                    │ }               │
                    └────────┬────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
        ┌───────────┐ ┌──────────┐ ┌──────────────┐
        │ Validate  │ │  Create  │ │ Update Innings│
        │ Innings   │ │   Ball   │ │ score/wickets │
        │  Exists   │ │ Document │ └──────────────┘
        └───────────┘ └──────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Return success  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Continue scoring│
                    │  next ball      │
                    └─────────────────┘
```

### 3. Match Viewing Flow

```
┌─────────┐         ┌──────────────┐         ┌────────────────┐
│ Viewer  │────────▶│  Home Page   │────────▶│ GET /api/match │
│  User   │  Opens  │     (/)      │  Fetch  │                │
└─────────┘         └──────┬───────┘         └────────┬───────┘
                           │                          │
                           │                          │ Populate teams
                           │                          │ & innings
                           │                          │
                           │    ┌─────────────────────┘
                           │    │
                           │    │ For each innings:
                           │    │ - Find last ball
                           │    │ - Calculate oversCompleted
                           │    │
                           ▼    ▼
                    ┌──────────────────┐
                    │ Display match    │
                    │ cards with       │
                    │ scores           │
                    └────────┬─────────┘
                             │
                             │ Click on match
                             ▼
                    ┌──────────────────┐
                    │ /matches/[id]    │
                    │ (Currently mock) │
                    └──────────────────┘
```

## Component Hierarchy

```
RootLayout
│
├── Header
│   ├── Logo/Title
│   └── Auth Button
│
├── Home Page (/)
│   └── MatchCard (multiple)
│       ├── StatusBadge
│       └── MatchInfo
│
├── Match Detail (/matches/[id])
│   ├── ScoreCard
│   │   └── TeamScore (x2)
│   ├── TabSwitcher
│   └── OverDisplay (multiple)
│       └── BallDisplay (x6 per over)
│
└── Umpire Pages
    ├── Start Match (/umpire)
    │   ├── Alert (conditional)
    │   └── StartMatchForm
    │       ├── Input (multiple)
    │       └── RadioGroup
    │
    └── Score Match (/umpire/[matchId])
        ├── MatchInfo
        ├── TeamScore (x2)
        └── UmpireControls
            ├── Run Buttons (0-6)
            ├── Wicket Button
            └── Extra Buttons
```

## Database Schema Relationships

```
┌──────────────┐
│    Match     │
│              │
│ - location   │
│ - overs      │
│ - status     │
└───┬──────┬───┘
    │      │
    │      │ references (1:many)
    │      │
    │      └──────────────────┐
    │                         │
    ▼ references (many)       ▼
┌──────────────┐       ┌──────────────┐
│    Team      │       │   Innings    │
│              │       │              │
│ - name       │◀──────│ - batting    │ references
│ - players    │       │ - bowling    │
│ - order      │◀──────│ - score      │
└──────────────┘       │ - wickets    │
                       └───────┬──────┘
                               │
                               │ references (1:many)
                               │
                               ▼
                       ┌──────────────┐
                       │     Ball     │
                       │              │
                       │ - overNum    │
                       │ - ballNum    │
                       │ - runs       │
                       │ - isWicket   │
                       │ - isExtra    │
                       └──────────────┘

Separate:
┌──────────────┐
│     User     │
│              │
│ - email      │
│ - name       │
│ - role       │
└──────────────┘
```

## Authentication Flow

```
┌─────────┐                                    ┌──────────────┐
│  User   │                                    │   Google     │
│         │                                    │   OAuth      │
└────┬────┘                                    └──────┬───────┘
     │                                                │
     │ 1. Click "Sign In"                            │
     ▼                                                │
┌─────────────────┐                                  │
│ NextAuth Route  │                                  │
│ /api/auth/...   │                                  │
└────┬────────────┘                                  │
     │                                                │
     │ 2. Redirect to Google ─────────────────────▶  │
     │                                                │
     │                     ◀─────────────────────────┘
     │ 3. Return with token
     │
     ▼
┌─────────────────┐
│ signIn callback │
│                 │
│ - Check DB for  │
│   user email    │
│ - Create if new │
│   (role: spec)  │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│session callback │
│                 │
│ - Load user role│
│ - Add to session│
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Return session  │
│ with user role  │
└─────────────────┘
```

## Request/Response Flow

### Typical API Request

```
Client                 Next.js API            Database
  │                         │                    │
  │ 1. POST /api/ball       │                    │
  ├────────────────────────▶│                    │
  │                         │                    │
  │                         │ 2. dbConnect()     │
  │                         ├───────────────────▶│
  │                         │                    │
  │                         │◀───────────────────┤
  │                         │ 3. Connection ready│
  │                         │                    │
  │                         │ 4. Innings.findById│
  │                         ├───────────────────▶│
  │                         │                    │
  │                         │◀───────────────────┤
  │                         │ 5. Innings doc     │
  │                         │                    │
  │                         │ 6. Ball.create()   │
  │                         ├───────────────────▶│
  │                         │                    │
  │                         │◀───────────────────┤
  │                         │ 7. Ball doc        │
  │                         │                    │
  │                         │ 8. innings.save()  │
  │                         ├───────────────────▶│
  │                         │                    │
  │                         │◀───────────────────┤
  │                         │ 9. Updated innings │
  │                         │                    │
  │◀────────────────────────┤                    │
  │ 10. JSON response       │                    │
  │ { ball, message }       │                    │
```

## Technology Stack Details

### Frontend Layer
- **Framework:** Next.js 15 (React 19)
  - App Router (file-based routing)
  - Server Components (default)
  - Client Components (with 'use client')
- **Styling:** Tailwind CSS 4
  - Utility-first CSS
  - Custom components in Styles.ts
- **Forms:** React Hook Form
  - Form validation
  - Controlled inputs
- **Auth Client:** next-auth/react
  - useSession hook
  - Session provider

### Backend Layer
- **API Routes:** Next.js API Routes
  - RESTful endpoints
  - TypeScript support
- **ODM:** Mongoose
  - Schema validation
  - Middleware hooks
  - Population (joins)
- **Auth Server:** NextAuth.js
  - OAuth providers
  - Session management
  - Callbacks

### Data Layer
- **Database:** MongoDB
  - Document-based NoSQL
  - Flexible schema
  - Indexed queries
- **Connection:** Mongoose connection pooling
  - Cached in development
  - Auto-reconnect

## Deployment Architecture (Production)

```
┌─────────────────────────────────────────────┐
│              CDN / Edge Network             │
│         (Static Assets, Images)             │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│           Vercel / Deployment Host          │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │     Next.js Application               │ │
│  │  - Server-side Rendering              │ │
│  │  - API Routes                         │ │
│  │  - Static Generation                  │ │
│  └───────────────┬───────────────────────┘ │
│                  │                          │
└──────────────────┼──────────────────────────┘
                   │
                   │ MongoDB Connection
                   ▼
┌─────────────────────────────────────────────┐
│          MongoDB Atlas / Cluster            │
│  - Replica Set                              │
│  - Automatic Backups                        │
│  - Monitoring                               │
└─────────────────────────────────────────────┘

External:
┌──────────────┐
│ Google OAuth │
└──────────────┘
```

## Key Architectural Decisions

### 1. Why Next.js App Router?
- **SSR Support:** Better SEO and initial load performance
- **API Routes:** Backend and frontend in one repo
- **File-based Routing:** Intuitive project structure
- **React Server Components:** Reduced client bundle size

### 2. Why MongoDB?
- **Flexible Schema:** Easy to evolve data model
- **JSON-like Documents:** Natural fit for JavaScript/TypeScript
- **Mongoose ODM:** Type safety and validation
- **Scalability:** Horizontal scaling with sharding

### 3. Why NextAuth?
- **Easy OAuth:** Google integration out of the box
- **Session Management:** Built-in session handling
- **Security:** CSRF protection, secure cookies
- **Flexibility:** Custom callbacks for role management

### 4. Why Mongoose?
- **Schema Validation:** Data integrity
- **Middleware:** Hooks for business logic
- **Population:** Easy relationship handling
- **TypeScript Support:** Strong typing with interfaces

## Performance Considerations

### Current Optimizations
1. **Database Indexes:** Compound index on Ball collection
2. **Lean Queries:** Using `.lean()` for read-only data
3. **Connection Pooling:** Reusing MongoDB connections
4. **Parallel Queries:** Using Promise.all() for multiple queries

### Potential Improvements
1. **Redis Caching:** Cache frequently accessed match data
2. **GraphQL:** Reduce over-fetching with precise queries
3. **WebSockets:** Real-time updates without polling
4. **Image Optimization:** Use Next.js Image component
5. **Code Splitting:** Lazy load heavy components

## Security Measures

### Current
1. **Environment Variables:** Sensitive data not in code
2. **MongoDB URI:** Not exposed to client
3. **OAuth:** Secure Google authentication
4. **Role-based Access:** Protected routes by role
5. **HTTPS:** Enforced in production

### To Add
1. **Rate Limiting:** Prevent API abuse
2. **Input Sanitization:** Prevent injection attacks
3. **CORS Configuration:** Restrict API access
4. **CSP Headers:** Prevent XSS attacks
5. **API Key Authentication:** For external access

---

This architecture is designed for:
- ✅ **Simplicity:** Easy to understand and maintain
- ✅ **Scalability:** Can grow with user base
- ✅ **Type Safety:** TypeScript throughout
- ✅ **Developer Experience:** Fast iteration and debugging
- ⚠️ **Production Readiness:** Needs error handling and monitoring improvements
