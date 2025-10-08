# Gully CricScore 🏏

A modern cricket scoring application designed for gully (street) cricket matches. Track live scores ball-by-ball, manage matches, and view detailed statistics.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Project Status](#project-status)
- [Contributing](#contributing)

## ✨ Features

- 🏏 **Live Scoring** - Track scores ball-by-ball with umpire interface
- 📊 **Match Management** - Create and manage cricket matches
- 👥 **Role-Based Access** - Umpire and spectator roles
- 🔐 **Google OAuth** - Secure authentication
- 📱 **Responsive Design** - Works on desktop and mobile
- 🎯 **Real-time Updates** - See scores update live

## 🛠 Tech Stack

- **Frontend:** Next.js 15 (React 19), TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** NextAuth.js with Google OAuth
- **Linting:** Biome

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB database (local or MongoDB Atlas)
- Google OAuth credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Harikodapaka/gully-cricscore.git
   cd gully-cricscore
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   NODE_ENV=development
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run linter
npm run format   # Format code
```

## 📚 Documentation

Comprehensive documentation is available in the following files:

- **[CODEBASE.md](./CODEBASE.md)** - Complete codebase documentation
  - Architecture overview
  - Data models and schemas
  - API endpoints reference
  - Component documentation
  - Authentication flow
  - Known issues and solutions

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture
  - System diagrams
  - Data flow diagrams
  - Component hierarchy
  - Database relationships
  - Request/response flow
  - Deployment architecture

- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Developer quick reference
  - Common tasks and code snippets
  - API quick reference
  - Component usage examples
  - Database queries
  - Debugging tips
  - Code examples

- **[ROADMAP.md](./ROADMAP.md)** - Improvement roadmap
  - Prioritized improvements
  - Bug fixes needed
  - Feature enhancements
  - Timeline and estimates

## 📊 Project Status

**Current Version:** 0.1.0 (Development)

### ✅ Working Features
- Match creation and management
- Ball-by-ball scoring
- Live score display
- Google OAuth authentication
- Role-based access control

### ⚠️ Known Issues
- Build fails in sandboxed environments (Google Fonts)
- 74 linting errors, 59 warnings
- Match details page uses mock data
- Inconsistent over calculation logic

### 🔜 Coming Soon
- Comprehensive error handling
- Input validation
- Automated tests
- Real-time updates
- Player management
- Match statistics

See [ROADMAP.md](./ROADMAP.md) for detailed improvement plans.

## 🏗️ Project Structure

```
gully-cricscore/
├── src/
│   ├── app/              # Next.js pages and API routes
│   │   ├── api/         # Backend API endpoints
│   │   ├── matches/     # Match pages
│   │   ├── umpire/      # Umpire pages
│   │   └── page.tsx     # Home page
│   ├── components/       # Reusable UI components
│   ├── lib/             # Utility functions
│   ├── models/          # Mongoose schemas
│   └── types/           # TypeScript types
├── public/              # Static assets
└── docs/                # Documentation
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style (use Biome for linting)
- Write descriptive commit messages
- Update documentation for significant changes
- Test your changes thoroughly
- See [CODEBASE.md](./CODEBASE.md) for coding standards

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

**Harikodapaka**
- GitHub: [@Harikodapaka](https://github.com/Harikodapaka)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI styled with [Tailwind CSS](https://tailwindcss.com/)
- Authentication via [NextAuth.js](https://next-auth.js.org/)
- Database with [MongoDB](https://www.mongodb.com/) and [Mongoose](https://mongoosejs.com/)

---

**Need Help?** Check out the [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for common tasks and troubleshooting.
