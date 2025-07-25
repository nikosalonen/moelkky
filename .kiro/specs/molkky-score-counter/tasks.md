<!-- @format -->

# Implementation Plan

- [x] 1. Set up project structure and development environment

  - Initialize Vite project with Preact template
  - Configure Tailwind CSS for styling
  - Set up GitHub Pages deployment workflow
  - Create basic folder structure for components, utils, and tests
  - _Requirements: 9.1, 9.3_

- [x] 2. Implement core data models and types

  - Create TypeScript interfaces for Player, Game, and PenaltyRecord models
  - Implement data validation functions for player names and scores
  - Create utility functions for game state management
  - Write unit tests for data models and validation
  - _Requirements: 1.3, 1.4, 3.4_

- [x] 3. Create session storage utilities

  - Implement storage service for persisting game state and history
  - Create functions for saving and loading game data from sessionStorage
  - Add error handling for storage operations with graceful fallbacks
  - Write unit tests for storage utilities
  - _Requirements: 8.1, 8.5_

- [x] 4. Build core game logic engine

  - Implement Mölkky scoring rules (single pin, multiple pins, exact 50, over 50)
  - Create turn management system for player rotation
  - Implement win condition detection and game completion logic
  - Add penalty application logic that resets score to 25
  - Write comprehensive unit tests for all game logic functions
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.2, 6.1_

- [x] 5. Create state management with React hooks

  - Implement GameContext provider for global game state
  - Create custom hooks for player management and game flow
  - Add state persistence integration with session storage
  - Write tests for state management hooks
  - _Requirements: 2.2, 2.3, 5.4_

- [x] 6. Build PlayerManager component

  - Create component for adding new players with input validation
  - Implement player name editing functionality
  - Add player removal with confirmation
  - Include duplicate name prevention and error display
  - Style component with Tailwind CSS for responsive design
  - Write component tests for all player management features
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.4, 7.4, 9.1, 9.2_

- [x] 7. Implement GameBoard component

  - Create score display showing all players and current scores
  - Add visual indicator for current player's turn
  - Display points needed to reach 50 for each player
  - Implement responsive layout for different screen sizes
  - Style with Tailwind CSS and add visual feedback
  - Write component tests for score display and turn indication
  - Commit changes once all TS errors are dealt with and tests are passing
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 9.1, 9.2, 9.3_

- [x] 8. Build ScoreInput component

  - Create input interface for single pin scores (1-12)
  - Add input method for multiple pin counts (2-12)
  - Implement score validation and error handling
  - Add penalty button with confirmation dialog
  - Include visual feedback for score entry
  - Write component tests for all input scenarios and validation
  - Commit changes once all TS errors are dealt with and tests are passing
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 9.4, 9.5_

- [x] 9. Create game flow control system

  - Implement "Start Game" functionality with minimum player validation
  - Add turn advancement logic after score entry
  - Create game state transitions (setup → playing → finished)
  - Prevent player modifications during active gameplay
  - Write integration tests for complete game flow
  - Commit changes once all TS errors are dealt with and tests are passing
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.6_

- [x] 10. Build WinnerDisplay component

  - Create winner announcement interface when player reaches 50 points
  - Display final scores for all players
  - Add "New Game" button to restart with same players
  - Prevent further score entries after game completion
  - Style winner display with celebratory design
  - Write component tests for winner display and new game functionality
  - Commit changes once all TS errors are dealt with and tests are passing
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2_

- [x] 11. Implement GameHistory component

  - Create modal/overlay for displaying game history
  - Show list of completed games with winner, scores, and duration
  - Display penalties applied during each historical game
  - Add close/dismiss functionality for history view
  - Style history component with responsive design
  - Write component tests for history display and interaction
  - Commit changes once all TS errors are dealt with and tests are passing
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 12. Create main App component and routing

  - Build root App component that orchestrates all other components
  - Implement conditional rendering based on game state
  - Add navigation between different views (game, history)
  - Integrate all components with shared state management
  - Write integration tests for app-level functionality
  - Commit changes once all TS errors are dealt with and tests are passing
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 13. Add responsive design and mobile optimization

  - Implement mobile-first responsive layouts for all components
  - Add touch-friendly button sizes and spacing
  - Optimize input methods for mobile devices
  - Test and refine layouts across different screen sizes
  - Add CSS animations and transitions for better UX
  - Commit changes once all TS errors are dealt with and tests are passing
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 14. Implement error handling and user feedback

  - Add error boundary components for graceful error handling
  - Create toast/notification system for user feedback
  - Implement form validation with clear error messages
  - Add loading states and visual feedback for user actions
  - Write tests for error scenarios and user feedback
  - Commit changes once all TS errors are dealt with and tests are passing
  - _Requirements: 1.4, 3.4, 9.5_

- [ ] 15. Set up comprehensive testing suite

  - Configure Vitest testing environment
  - Write unit tests for all utility functions and game logic
  - Create component tests using @testing-library/preact
  - Add integration tests for complete user workflows
  - Set up test coverage reporting
  - Commit changes once all TS errors are dealt with and tests are passing
  - _Requirements: All requirements (testing coverage)_

- [ ] 16. Configure GitHub Pages deployment

  - Set up GitHub Actions workflow for automated deployment
  - Configure Vite build for GitHub Pages with correct base path
  - Add deployment scripts and environment configuration
  - Test deployment process and verify live site functionality
  - Commit changes once all TS errors are dealt with and tests are passing
  - _Requirements: 9.1, 9.3_

- [ ] 17. Add final polish and optimization
  - Optimize bundle size and implement code splitting
  - Add favicon and app metadata
  - Implement accessibility improvements (ARIA labels, keyboard navigation)
  - Add final styling touches and animations
  - Perform cross-browser testing and bug fixes
  - Commit changes once all TS errors are dealt with and tests are passing
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
