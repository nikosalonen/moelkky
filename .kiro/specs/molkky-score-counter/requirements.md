<!-- @format -->

# Requirements Document

## Introduction

This document outlines the requirements for a Mölkky score counter web application that will be hosted on GitHub Pages. The application will allow users to manage players, track scores during games, apply penalties, and maintain game history for the current session. The app will be built using Preact and a CSS library for a clean, responsive user interface.

Mölkky is a Finnish throwing game where players attempt to knock down numbered wooden pins (skittles) by throwing a wooden stick (mölkky). Players score points based on the pins they knock down, with the goal of reaching exactly 50 points. Going over 50 points resets the player's score to 25.

## Requirements

### Requirement 1

**User Story:** As a game organizer, I want to add and manage players before starting a game, so that I can track scores for all participants.

#### Acceptance Criteria

1. WHEN the user opens the application THEN the system SHALL display an option to add players
2. WHEN the user clicks "Add Player" THEN the system SHALL provide a text input field for the player name
3. WHEN the user enters a valid player name THEN the system SHALL add the player to the game roster
4. WHEN the user attempts to add a duplicate player name THEN the system SHALL display an error message and prevent addition
5. WHEN the user wants to modify a player name THEN the system SHALL allow editing of existing player names
6. WHEN the user wants to remove a player THEN the system SHALL provide a delete option for each player

### Requirement 2

**User Story:** As a game organizer, I want to start a new game with the selected players, so that I can begin tracking scores.

#### Acceptance Criteria

1. WHEN at least 2 players are added THEN the system SHALL enable a "Start Game" button
2. WHEN the user clicks "Start Game" THEN the system SHALL initialize all player scores to 0
3. WHEN the game starts THEN the system SHALL display the current player's turn
4. WHEN the game starts THEN the system SHALL prevent adding or removing players during active gameplay

### Requirement 3

**User Story:** As a player, I want to record my throw results, so that my score is accurately tracked throughout the game.

#### Acceptance Criteria

1. WHEN it's a player's turn THEN the system SHALL display score input options for that player
2. WHEN a player knocks down a single numbered pin THEN the system SHALL add that pin's number to the player's score
3. WHEN a player knocks down multiple pins THEN the system SHALL add the count of knocked pins to the player's score
4. WHEN a player's score would exceed 50 points THEN the system SHALL reset their score to 25 points
5. WHEN a player reaches exactly 50 points THEN the system SHALL declare them the winner and end the game
6. WHEN a score is entered THEN the system SHALL advance to the next player's turn
7. WHEN a player records zero points for three consecutive turns THEN the system SHALL eliminate that player from the game and display this in the UI and game history
8. WHEN a player throws out of turn THEN the system SHALL void the result, and if their score is 37 or more, reset their score to 25, and display this in the UI

### Requirement 4

**User Story:** As a game organizer, I want to apply penalties to players, so that rule violations are properly tracked.

#### Acceptance Criteria

1. WHEN a player commits a rule violation THEN the system SHALL provide a penalty option
2. WHEN a penalty is applied THEN the system SHALL reset the player's score to 25 points
3. WHEN a penalty is applied THEN the system SHALL log the penalty in the game history
4. WHEN multiple penalties are applied to the same player THEN the system SHALL track each penalty occurrence

### Requirement 5

**User Story:** As a player, I want to see current scores and game status, so that I know the game progress.

#### Acceptance Criteria

1. WHEN the game is active THEN the system SHALL display all players' current scores
2. WHEN the game is active THEN the system SHALL highlight whose turn it is
3. WHEN the game is active THEN the system SHALL show how many points each player needs to reach 50
4. WHEN a player's score changes THEN the system SHALL update the display immediately
5. WHEN the game ends THEN the system SHALL clearly display the winner

### Requirement 6

**User Story:** As a game organizer, I want to see who won the game, so that I can announce the results.

#### Acceptance Criteria

1. WHEN a player reaches exactly 50 points THEN the system SHALL display a winner announcement
2. WHEN the game ends THEN the system SHALL show final scores for all players
3. WHEN the game ends THEN the system SHALL provide an option to start a new game
4. WHEN the winner is announced THEN the system SHALL prevent further score entries

### Requirement 7

**User Story:** As a game organizer, I want to start a new game after the current one ends, so that we can play multiple rounds.

#### Acceptance Criteria

1. WHEN a game ends THEN the system SHALL display a "New Game" button
2. WHEN "New Game" is clicked THEN the system SHALL reset all player scores to 0
3. WHEN a new game starts THEN the system SHALL maintain the same player roster
4. WHEN a new game starts THEN the system SHALL allow modification of the player roster
5. WHEN a new game starts THEN the system SHALL clear the current game's penalty history

### Requirement 8

**User Story:** As a user, I want to view game history for the current session, so that I can review past games and results.

#### Acceptance Criteria

1. WHEN games are completed THEN the system SHALL store game results in session history
2. WHEN the user requests game history THEN the system SHALL display a list of completed games
3. WHEN viewing game history THEN the system SHALL show winner, final scores, and game duration for each game
4. WHEN viewing game history THEN the system SHALL show penalties applied during each game
5. WHEN the browser session ends THEN the system SHALL clear the game history

### Requirement 9

**User Story:** As a user, I want a clean and responsive interface, so that I can easily use the app on different devices.

#### Acceptance Criteria

1. WHEN the app loads THEN the system SHALL display a clean, intuitive user interface
2. WHEN accessed on mobile devices THEN the system SHALL provide a responsive layout
3. WHEN accessed on desktop THEN the system SHALL utilize available screen space effectively
4. WHEN buttons are pressed THEN the system SHALL provide visual feedback
5. WHEN errors occur THEN the system SHALL display clear error messages to the user
