/**
 * ScoreInput Component
 * Handles score entry based on pin selection - automatically determines scoring type
 *
 * @format
 */

import { useState } from "preact/hooks";
import type { Player } from "../../utils/types";
import { validateScore } from "../../utils/validation";
import { useGameContext } from "../../context/GameContext";
import { useToast } from "../Toast";
import { InlineSpinner } from "../LoadingSpinner";

interface ScoreInputProps {
  currentPlayer: Player;
  onScoreSubmit?: (
    playerId: string,
    score: number,
    scoringType: "single" | "multiple"
  ) => void;
  onPenalty?: (playerId: string, reason?: string) => void;
}

export function ScoreInput({
  currentPlayer,
  onScoreSubmit,
  onPenalty,
}: ScoreInputProps) {
  const { dispatch } = useGameContext();
  const { addToast } = useToast();
  const [selectedPins, setSelectedPins] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showPenaltyConfirm, setShowPenaltyConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (currentPlayer.eliminated) {
    return (
      <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center text-gray-500">
        <span className="text-lg font-semibold">
          {currentPlayer.name} has been eliminated and cannot play further
          turns.
        </span>
      </div>
    );
  }

  // Clear error after a delay
  const clearError = () => {
    setTimeout(() => setError(null), 3000);
  };

  // Get current score based on pin selection
  const getCurrentScore = () => {
    if (selectedPins.length === 1) {
      return selectedPins[0]; // Single pin: score = pin number
    } else if (selectedPins.length > 1) {
      return selectedPins.length; // Multiple pins: score = number of pins
    }
    return 0; // No pins selected = miss
  };

  // Calculate score and scoring type automatically
  const currentScore = getCurrentScore();
  const scoringType: "single" | "multiple" = selectedPins.length === 1 ? "single" : "multiple";

  const isSubmitDisabled = isSubmitting || selectedPins.length === 0;

  // Handle pin selection
  const togglePin = (pin: number) => {
    setSelectedPins((prev) =>
      prev.includes(pin) ? prev.filter((p) => p !== pin) : [...prev, pin]
    );
  };

  // Handle score submission
  const handleScoreSubmit = async () => {
    if (isSubmitting) return;

    const score = getCurrentScore();

    // If no score, always treat as miss
    if (score === 0) {
      setIsSubmitting(true);
      setError(null);
      try {
        if (onScoreSubmit) {
          onScoreSubmit(currentPlayer.id, 0, "single");
        } else {
          dispatch({
            type: "SUBMIT_SCORE",
            payload: {
              playerId: currentPlayer.id,
              score: 0,
              scoringType: "single",
            },
          });
        }
        setSelectedPins([]);
        addToast({
          type: "info",
          title: "Missed Throw",
          message: `No pins knocked down for ${currentPlayer.name}.`,
          duration: 2000,
          priority: "low",
        });
      } catch (err) {
        const errorMessage = "Failed to submit miss. Please try again.";
        setError(errorMessage);
        addToast({
          type: "error",
          title: "Failed to Submit Miss",
          message: errorMessage,
        });
        clearError();
      } finally {
        setTimeout(() => {
          setIsSubmitting(false);
        }, 100);
      }
      return;
    }

    // Validate score
    const validation = validateScore(score, scoringType === "single");
    if (!validation.isValid) {
      setError(validation.error || "Invalid score");
      addToast({
        type: "error",
        title: "Invalid Score",
        message: validation.error || "Invalid score",
      });
      clearError();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (onScoreSubmit) {
        onScoreSubmit(currentPlayer.id, score, scoringType);
      } else {
        dispatch({
          type: "SUBMIT_SCORE",
          payload: { playerId: currentPlayer.id, score, scoringType },
        });
      }
      setSelectedPins([]);
      addToast({
        type: "success",
        title: "Score Submitted",
        message: `Score of ${score} points recorded for ${currentPlayer.name}.`,
        duration: 2000,
        priority: "low",
      });
    } catch (err) {
      const errorMessage = "Failed to submit score. Please try again.";
      setError(errorMessage);
      addToast({
        type: "error",
        title: "Failed to Submit Score",
        message: errorMessage,
      });
      clearError();
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 100);
    }
  };

  // Handle penalty application
  const handlePenalty = async (reason: string = "Rule violation") => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowPenaltyConfirm(false);
    try {
      if (onPenalty) {
        onPenalty(currentPlayer.id, reason);
      } else {
        dispatch({
          type: "APPLY_PENALTY",
          payload: { playerId: currentPlayer.id, reason },
        });
      }
      addToast({
        type: "warning",
        title: "Penalty Applied",
        message: `Penalty applied to ${currentPlayer.name}. Score reset to 25.`,
        duration: 3000,
        priority: "normal",
      });
    } catch (err) {
      const errorMessage = "Failed to apply penalty. Please try again.";
      setError(errorMessage);
      addToast({
        type: "error",
        title: "Failed to Apply Penalty",
        message: errorMessage,
      });
      clearError();
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 100);
    }
  };

  // Handle out-of-turn throw
  const handleOutOfTurn = () => {
    dispatch({
      type: "OUT_OF_TURN_THROW",
      payload: { playerId: currentPlayer.id },
    });
    addToast({
      type: "info",
      title: "Out-of-Turn Throw",
      message: `${currentPlayer.name}'s throw was voided. Score reset to 25 if 37 or more.`,
      duration: 3000,
      priority: "normal",
    });
  };

  // Handle miss (zero-point throw)
  const handleMiss = async () => {
    setSelectedPins([]);
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      if (onScoreSubmit) {
        onScoreSubmit(currentPlayer.id, 0, "single");
      } else {
        dispatch({
          type: "SUBMIT_SCORE",
          payload: {
            playerId: currentPlayer.id,
            score: 0,
            scoringType: "single",
          },
        });
      }
      addToast({
        type: "info",
        title: "Missed Throw",
        message: `No pins knocked down for ${currentPlayer.name}.`,
        duration: 2000,
        priority: "low",
      });
    } catch (err) {
      const errorMessage = "Failed to submit miss. Please try again.";
      setError(errorMessage);
      addToast({
        type: "error",
        title: "Failed to Submit Miss",
        message: errorMessage,
      });
      clearError();
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 100);
    }
  };

  return (
    <div className="mobile-container">
      {/* Mobile-optimized Title */}
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 text-center mobile-text-lg">
        Score Entry
      </h3>

      {/* Mobile-optimized Current Player Info */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg mobile-card">
        <h4 className="text-base sm:text-lg font-medium text-gray-700 mb-2 mobile-text-base">
          Current Player
        </h4>
        <div className="text-gray-600 mobile-text-sm">
          <p className="font-semibold text-base sm:text-lg">{currentPlayer.name}</p>
          <p>Current Score: {currentPlayer.score} / 50</p>
          <p>Points Needed: {Math.max(0, 50 - currentPlayer.score)}</p>
          {currentPlayer.consecutiveMisses !== undefined && currentPlayer.consecutiveMisses > 0 && (
            <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded">
              <p className="text-yellow-800 text-sm font-medium">
                ⚠️ Consecutive Misses: {currentPlayer.consecutiveMisses}
              </p>
              {currentPlayer.consecutiveMisses >= 2 && (
                <p className="text-yellow-700 text-xs mt-1">
                  {currentPlayer.consecutiveMisses === 2 
                    ? "One more miss will eliminate this player!"
                    : "This player is eliminated after 3 consecutive misses."
                  }
                </p>
              )}
            </div>
          )}
          {currentPlayer.eliminated && (
            <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
              <p className="text-red-800 text-sm font-medium">
                ❌ Player Eliminated
              </p>
              <p className="text-red-700 text-xs mt-1">
                This player has been eliminated due to 3 consecutive misses.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded mb-3 sm:mb-4 text-sm"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Mobile-optimized Pin Selection Instructions */}
      <div className="mb-3 sm:mb-4 text-center">
        <h4 className="text-sm sm:text-lg font-medium text-gray-700 mb-1 sm:mb-2 mobile-text-base">
          Select Pins Knocked Down
        </h4>
        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 mobile-text-sm">
          {selectedPins.length === 0 
            ? "Tap the pins that were knocked down"
            : selectedPins.length === 1
            ? `Single pin selected: ${selectedPins[0]} points`
            : `${selectedPins.length} pins selected: ${selectedPins.length} points`
          }
        </p>
      </div>

      {/* Mobile-optimized Pin Selection Buttons */}
      <div className="mb-3 sm:mb-6">
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 sm:gap-2 justify-center mb-2 mobile-pin-grid">
          {[...Array(12)].map((_, i) => {
            const pin = i + 1;
            const selected = selectedPins.includes(pin);
            return (
              <button
                key={pin}
                type="button"
                onClick={() => togglePin(pin)}
                disabled={isSubmitting}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-bold text-base sm:text-lg border-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation mobile-btn
                  ${selected ? "bg-blue-500 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"}
                  disabled:bg-gray-300 disabled:cursor-not-allowed`}
                aria-pressed={selected}
              >
                {pin}
              </button>
            );
          })}
        </div>
        <div className="flex justify-center mt-2">
          <button
            type="button"
            onClick={handleMiss}
            disabled={isSubmitting}
            className="mobile-btn bg-gray-400 text-white hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-sm shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation"
          >
            Miss (0 points)
          </button>
        </div>
      </div>

      {/* Mobile-optimized Calculated Score Display */}
      <div className="mb-3 sm:mb-6 text-center">
        <span className="text-sm sm:text-lg font-medium text-gray-700 mobile-text-base">
          Calculated Score:{" "}
          <span className="font-bold text-blue-700">{currentScore}</span>
        </span>
        {selectedPins.length > 0 && (
          <div className="text-xs sm:text-sm text-gray-600 mt-1 mobile-text-sm">
            {scoringType === "single" 
              ? `Single Pin: ${selectedPins[0]}`
              : `Multiple Pins: ${selectedPins.length}`
            }
          </div>
        )}
      </div>

      {/* Mobile-optimized Submit Button */}
      <div className="mb-3 sm:mb-6 flex justify-center">
        <button
          type="button"
          aria-label="Submit score"
          onClick={handleScoreSubmit}
          disabled={isSubmitDisabled}
          className="mobile-btn bg-green-500 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed min-w-[120px] font-medium transition-all duration-200 text-sm shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <InlineSpinner size="sm" variant="primary" />
              <span className="ml-2">Submitting...</span>
            </>
          ) : (
            "Submit Score"
          )}
        </button>
      </div>

      {/* Mobile-optimized Penalty Section */}
      <div className="border-t border-gray-200 pt-3 sm:pt-6">
        <h4 className="text-sm sm:text-lg font-medium text-gray-700 mb-2 sm:mb-3 text-center mobile-text-base">
          Penalty
        </h4>
        <p className="text-xs text-gray-600 mb-3 sm:mb-4 text-center mobile-text-sm">
          Apply a penalty to reset the player's score to 25 points.
        </p>
        <div className="text-center">
          <button
            onClick={() => setShowPenaltyConfirm(true)}
            disabled={isSubmitting}
            className="mobile-btn w-full sm:w-auto bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-all duration-200 text-sm shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation"
          >
            Apply Penalty
          </button>
        </div>
      </div>

      {/* Mobile-optimized Out-of-Turn Throw Button */}
      <div className="mt-3 sm:mt-4 flex flex-col items-center">
        <button
          type="button"
          aria-label="Mark out-of-turn throw"
          onClick={handleOutOfTurn}
          className="mobile-btn bg-yellow-500 text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-all duration-200 text-sm shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation"
          disabled={isSubmitting}
        >
          Mark Out-of-Turn Throw
        </button>
        <span className="text-xs text-gray-500 mt-1 mobile-text-sm">
          Use if this player threw out of turn
        </span>
      </div>

      {/* Mobile-optimized Penalty Confirmation Modal */}
      {showPenaltyConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-3 sm:p-6 max-w-sm mx-2 sm:mx-4 w-full mobile-modal">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 text-center mobile-text-lg">
              Confirm Penalty
            </h3>
            <p className="text-xs sm:text-base text-gray-600 mb-4 sm:mb-6 text-center mobile-text-sm">
              Are you sure you want to apply a penalty to{" "}
              <span className="font-medium">{currentPlayer.name}</span>? This
              will reset their score to 25 points.
            </p>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowPenaltyConfirm(false)}
                disabled={isSubmitting}
                className="px-4 py-3 sm:py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePenalty()}
                disabled={isSubmitting}
                className="px-4 py-3 sm:py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <InlineSpinner size="sm" variant="primary" />
                    <span className="ml-2">Applying...</span>
                  </>
                ) : (
                  "Apply"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
