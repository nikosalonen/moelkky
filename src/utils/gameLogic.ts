/**
 * Core game logic engine for Mölkky Score Counter
 * Implements scoring rules, turn management, win conditions, and penalty logic
 *
 * @format
 */

import type { Player, Game, GameState, PenaltyRecord } from "./types";
import {
  applyScore,
  applyPenalty,
  hasPlayerWon,
  getNextPlayerIndex,
  findWinner,
  createPenaltyRecord,
  completeGame,
} from "./gameStateUtils";

/**
 * Scoring types for Mölkky game
 */
export enum ScoringType {
  SINGLE_PIN = "single_pin",
  MULTIPLE_PINS = "multiple_pins",
}

/**
 * Result of a score application
 */
export interface ScoreResult {
  updatedPlayer: Player;
  gameWon: boolean;
  winner: Player | null;
  scoreReset: boolean; // True if score was reset due to exceeding 50
}

/**
 * Result of a turn completion
 */
export interface TurnResult {
  updatedPlayers: Player[];
  nextPlayerIndex: number;
  gameCompleted: boolean;
  winner: Player | null;
}

/**
 * Game engine class that manages all core game logic
 */
export class GameEngine {
  /**
   * Applies a score to a player based on Mölkky scoring rules
   * @param player - The player to score for
   * @param score - The score value
   * @param scoringType - Whether it's a single pin or multiple pins
   * @returns ScoreResult with updated player and game status
   */
  static applyPlayerScore(
    player: Player,
    score: number,
    scoringType: ScoringType
  ): ScoreResult {
    // Validate score based on type
    if (!this.isValidScore(score, scoringType)) {
      throw new Error(`Invalid score ${score} for ${scoringType}`);
    }

    const updatedPlayer = applyScore(player, score);
    const scoreReset = updatedPlayer.score === 25 && player.score + score > 50;
    const gameWon = hasPlayerWon(updatedPlayer);

    return {
      updatedPlayer,
      gameWon,
      winner: gameWon ? updatedPlayer : null,
      scoreReset,
    };
  }

  /**
   * Applies a penalty to a player
   * @param player - The player to penalize
   * @param reason - Reason for the penalty
   * @returns Updated player with penalty applied
   */
  static applyPlayerPenalty(
    player: Player,
    reason: string = "Rule violation"
  ): Player {
    return applyPenalty(player);
  }

  /**
   * Processes a complete turn for a player
   * @param players - Array of all players
   * @param currentPlayerIndex - Index of the current player
   * @param score - Score to apply
   * @param scoringType - Type of scoring (single pin or multiple pins)
   * @returns TurnResult with updated game state
   */
  static processTurn(
    players: Player[],
    currentPlayerIndex: number,
    score: number,
    scoringType: ScoringType
  ): TurnResult {
    if (currentPlayerIndex < 0 || currentPlayerIndex >= players.length) {
      throw new Error("Invalid player index");
    }

    const currentPlayer = players[currentPlayerIndex];
    const scoreResult = this.applyPlayerScore(
      currentPlayer,
      score,
      scoringType
    );

    // Update players array with the scored player
    const updatedPlayers = players.map((player, index) =>
      index === currentPlayerIndex ? scoreResult.updatedPlayer : player
    );

    // If game is won, don't advance to next player
    if (scoreResult.gameWon) {
      return {
        updatedPlayers,
        nextPlayerIndex: currentPlayerIndex,
        gameCompleted: true,
        winner: scoreResult.winner,
      };
    }

    // Advance to next player
    const nextPlayerIndex = getNextPlayerIndex(
      currentPlayerIndex,
      players.length
    );

    return {
      updatedPlayers,
      nextPlayerIndex,
      gameCompleted: false,
      winner: null,
    };
  }

  /**
   * Processes a penalty turn for a player
   * @param players - Array of all players
   * @param currentPlayerIndex - Index of the current player
   * @param game - Current game object
   * @param reason - Reason for the penalty
   * @returns TurnResult with updated game state and penalty record
   */
  static processPenaltyTurn(
    players: Player[],
    currentPlayerIndex: number,
    game: Game,
    reason: string = "Rule violation"
  ): {
    turnResult: TurnResult;
    penaltyRecord: PenaltyRecord;
    updatedGame: Game;
  } {
    if (currentPlayerIndex < 0 || currentPlayerIndex >= players.length) {
      throw new Error("Invalid player index");
    }

    const currentPlayer = players[currentPlayerIndex];
    const penalizedPlayer = this.applyPlayerPenalty(currentPlayer, reason);

    // Create penalty record
    const penaltyRecord = createPenaltyRecord(
      currentPlayer.id,
      currentPlayer.name,
      reason
    );

    // Update players array with the penalized player
    const updatedPlayers = players.map((player, index) =>
      index === currentPlayerIndex ? penalizedPlayer : player
    );

    // Update game with penalty record
    const updatedGame = {
      ...game,
      players: updatedPlayers,
      penalties: [...game.penalties, penaltyRecord],
    };

    // Advance to next player (penalties don't end the game)
    const nextPlayerIndex = getNextPlayerIndex(
      currentPlayerIndex,
      players.length
    );

    const turnResult: TurnResult = {
      updatedPlayers,
      nextPlayerIndex,
      gameCompleted: false,
      winner: null,
    };

    return {
      turnResult,
      penaltyRecord,
      updatedGame,
    };
  }

  /**
   * Checks if the game should end (someone reached exactly 50 points)
   * @param players - Array of players to check
   * @returns Winner if game should end, null otherwise
   */
  static checkWinCondition(players: Player[]): Player | null {
    return findWinner(players);
  }

  /**
   * Completes a game by setting the winner and end time
   * @param game - Game to complete
   * @param winner - The winning player
   * @returns Completed game object
   */
  static completeGame(game: Game, winner: Player): Game {
    return completeGame(game, winner);
  }

  /**
   * Validates if a score is valid for the given scoring type
   * @param score - Score to validate
   * @param scoringType - Type of scoring
   * @returns True if score is valid
   */
  static isValidScore(score: number, scoringType: ScoringType): boolean {
    if (!Number.isInteger(score)) {
      return false;
    }

    switch (scoringType) {
      case ScoringType.SINGLE_PIN:
        return score >= 1 && score <= 12;
      case ScoringType.MULTIPLE_PINS:
        return score >= 2 && score <= 12;
      default:
        return false;
    }
  }

  /**
   * Calculates the effect of a potential score on a player
   * @param player - Player to calculate for
   * @param score - Potential score
   * @returns Object describing the effect
   */
  static calculateScoreEffect(
    player: Player,
    score: number
  ): {
    newScore: number;
    willWin: boolean;
    willReset: boolean;
    pointsToWin: number;
  } {
    const potentialScore = player.score + score;
    const willReset = potentialScore > 50;
    const newScore = willReset ? 25 : potentialScore;
    const willWin = newScore === 50;
    const pointsToWin = Math.max(0, 50 - player.score);

    return {
      newScore,
      willWin,
      willReset,
      pointsToWin,
    };
  }

  /**
   * Gets the current game status
   * @param players - Array of players
   * @param gameState - Current game state
   * @returns Object describing current game status
   */
  static getGameStatus(
    players: Player[],
    gameState: GameState
  ): {
    isActive: boolean;
    winner: Player | null;
    canStart: boolean;
    playersReady: boolean;
  } {
    const winner = gameState === "finished" ? findWinner(players) : null;
    const isActive = gameState === "playing";
    const playersReady = players.length >= 2;
    const canStart = gameState === "setup" && playersReady;

    return {
      isActive,
      winner,
      canStart,
      playersReady,
    };
  }

  /**
   * Validates if a turn can be processed
   * @param players - Array of players
   * @param currentPlayerIndex - Current player index
   * @param gameState - Current game state
   * @returns True if turn can be processed
   */
  static canProcessTurn(
    players: Player[],
    currentPlayerIndex: number,
    gameState: GameState
  ): boolean {
    return (
      gameState === "playing" &&
      currentPlayerIndex >= 0 &&
      currentPlayerIndex < players.length &&
      !findWinner(players) // Game hasn't ended yet
    );
  }

  /**
   * Gets statistics for a player
   * @param player - Player to get stats for
   * @returns Player statistics
   */
  static getPlayerStats(player: Player): {
    score: number;
    penalties: number;
    pointsToWin: number;
    canWinWith: number[];
    riskScores: number[];
  } {
    const pointsToWin = Math.max(0, 50 - player.score);
    const canWinWith: number[] = [];
    const riskScores: number[] = [];

    // Calculate which scores would win or cause reset
    for (let score = 1; score <= 12; score++) {
      const effect = this.calculateScoreEffect(player, score);
      if (effect.willWin) {
        canWinWith.push(score);
      } else if (effect.willReset) {
        riskScores.push(score);
      }
    }

    return {
      score: player.score,
      penalties: player.penalties,
      pointsToWin,
      canWinWith,
      riskScores,
    };
  }
}
