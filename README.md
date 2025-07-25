# Mölkky Score Counter

A modern, responsive web application for tracking scores and managing Mölkky games. Built with Preact, TypeScript, and Tailwind CSS.

## 🎯 About Mölkky

Mölkky is a Finnish throwing game where players throw a wooden pin (the "mölkky") to knock down numbered wooden pins. The goal is to score exactly 50 points. If a player exceeds 50 points, their score is reset to 25.

## ✨ Features

- **Player Management**: Add, remove, and manage players for your game
- **Score Tracking**: Record scores with automatic turn advancement
- **Penalty System**: Apply penalties that reset player scores to 25
- **Game History**: View and manage previous games
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Live score updates and game state management
- **Toast Notifications**: User-friendly feedback for all game actions
- **Error Handling**: Robust error boundaries and validation

## 🚀 Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/moelkky.git
cd moelkky
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🎮 How to Use

### Starting a Game

1. **Add Players**: Enter player names and click "Add Player" (minimum 2 players required)
2. **Start Game**: Click "Start Game" to begin
3. **Track Scores**: Use the score input to record points for each player
4. **Apply Penalties**: Use the penalty button if a player violates rules

### Scoring Rules

- **Single Pin**: Score the number on the pin
- **Multiple Pins**: Score the number of pins knocked down
- **Exceeding 50**: Score resets to 25
- **Winning**: First player to reach exactly 50 points wins

### Game History

- Click "View Game History" to see previous games
- View detailed statistics including penalties and game duration

## 🛠️ Development

### Project Structure

```
src/
├── components/          # React components
│   ├── ErrorBoundary/   # Error handling
│   ├── GameBoard/       # Main game interface
│   ├── GameHistory/     # Game history modal
│   ├── PlayerManager/   # Player management
│   ├── ScoreInput/      # Score input component
│   ├── Toast/           # Notification system
│   └── WinnerDisplay/   # Winner announcement
├── context/             # React context providers
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
│   ├── gameLogic/       # Game logic
│   ├── storage/         # Data persistence
│   └── types/           # TypeScript type definitions
└── main.tsx            # Application entry point
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI

### Testing

The project includes comprehensive tests using Vitest and Testing Library:

```bash
npm test
```

Tests cover:
- Component functionality
- Game logic and state management
- User interactions
- Error handling

## 🎨 Technology Stack

- **Frontend Framework**: [Preact](https://preactjs.com/) - Fast 3kB alternative to React
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Build Tool**: [Vite](https://vitejs.dev/) - Fast build tool and dev server
- **Testing**: [Vitest](https://vitest.dev/) - Fast unit testing framework
- **Testing Library**: [@testing-library/preact](https://testing-library.com/docs/preact-testing-library/intro/) - Testing utilities


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions or changes
- `chore:` - Build process or auxiliary tool changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the traditional Finnish game Mölkky
- Built with modern web technologies for the best user experience
- Special thanks to the Preact and Tailwind CSS communities

## 📞 Support

If you encounter any issues or have questions, please:

1. Check the [Issues](https://github.com/yourusername/moelkky/issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce the problem

---

**Happy Mölkky playing! 🎯** 
