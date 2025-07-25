/**
 * ScoreInput Component
 * Handles score entry for single pins, multiple pins, and penalties
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
  onScoreSubmit?: (playerId: string, score: number, scoringType: "single" | "multiple") => void;
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
        <span className="text-lg font-semibold">{currentPlayer.name} has been eliminated and cannot play further turns.</span>
      </div>
    );
  }

  // Clear error after a delay
  const clearError = () => {
    setTimeout(() => setError(null), 3000);
  };

  // Calculate score and scoring type
  let score = 0;
  let scoringType: "single" | "multiple" = "single";
  if (selectedPins.length === 1) {
    score = selectedPins[0];
    scoringType = "single";
  } else if (selectedPins.length > 1) {
    score = selectedPins.length;
    scoringType = "multiple";
  } else {
    score = 0;
    scoringType = "single";
  }

  // Handle pin selection
  const togglePin = (pin: number) => {
    setSelectedPins((prev) =>
      prev.includes(pin) ? prev.filter((p) => p !== pin) : [...prev, pin]
    );
  };

  // Handle score submission
  const handleScoreSubmit = async () => {
    if (isSubmitting) return;

    // If no pins selected, always treat as miss
    if (selectedPins.length === 0) {
      setIsSubmitting(true);
      setError(null);
      try {
        if (onScoreSubmit) {
          onScoreSubmit(currentPlayer.id, 0, "single");
        } else {
          dispatch({
            type: "SUBMIT_SCORE",
            payload: { playerId: currentPlayer.id, score: 0, scoringType: "single" },
          });
        }
        setSelectedPins([]);
        addToast({
          type: "info",
          title: "Missed Throw",
          message: `No pins knocked down for ${currentPlayer.name}.`,
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

    // Otherwise, validate and submit as before
    if (score !== 0) {
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

  // Handle penalty application (unchanged)
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

  // Handle out-of-turn throw (unchanged)
  const handleOutOfTurn = () => {
    dispatch({ type: "OUT_OF_TURN_THROW", payload: { playerId: currentPlayer.id } });
    addToast({
      type: "info",
      title: "Out-of-Turn Throw",
      message: `${currentPlayer.name}'s throw was voided. Score reset to 25 if 37 or more.`,
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
          payload: { playerId: currentPlayer.id, score: 0, scoringType: "single" },
        });
      }
      addToast({
        type: "info",
        title: "Missed Throw",
        message: `No pins knocked down for ${currentPlayer.name}.`,
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
    <div>

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

      {/* Pin Selection */}
      <div className="mb-4 sm:mb-6">
        <h4 className="text-base sm:text-lg font-medium text-gray-700 mb-2 sm:mb-3 text-center">
          Select Pins Knocked Down
        </h4>
        <div className="grid grid-cols-6 gap-2 justify-center mb-2">
          {[...Array(12)].map((_, i) => {
            const pin = i + 1;
            const selected = selectedPins.includes(pin);
            return (
              <button
                key={pin}
                type="button"
                onClick={() => togglePin(pin)}
                disabled={isSubmitting}
                className={`w-12 h-12 rounded-lg font-bold text-lg border-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation
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
            className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-sm shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation"
          >
            Miss (0 points)
          </button>
        </div>
        <div className="text-xs sm:text-sm text-gray-600 text-center mt-1">
          Tap pins to select. If no pins were knocked down, use the Miss button.
        </div>
      </div>

      {/* Calculated Score Display */}
      <div className="mb-4 sm:mb-6 text-center">
        <span className="text-base sm:text-lg font-medium text-gray-700">
          Calculated Score: <span className="font-bold text-blue-700">{score}</span>
        </span>
        <span className="ml-4 text-sm text-gray-500">({scoringType === "single" && selectedPins.length === 1 ? `Single Pin: ${selectedPins[0]}` : scoringType === "multiple" ? `Multiple Pins: ${selectedPins.length}` : "Miss"})</span>
      </div>

      {/* Submit Button */}
      <div className="mb-4 sm:mb-6 flex justify-center">
        <button
          type="button"
          aria-label="Submit score"
          onClick={handleScoreSubmit}
          disabled={isSubmitting}
          className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed min-w-[120px] font-medium transition-all duration-200 text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation flex items-center justify-center"
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

      {/* Penalty Section (unchanged) */}
      <div className="border-t border-gray-200 pt-4 sm:pt-6">
        <h4 className="text-base sm:text-lg font-medium text-gray-700 mb-2 sm:mb-3 text-center">
          Penalty
        </h4>
        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 text-center">
          Apply a penalty to reset the player's score to 25 points.
        </p>
        <div className="text-center">
          <button
            onClick={() => setShowPenaltyConfirm(true)}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-all duration-200 text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation"
          >
            Apply Penalty
          </button>
        </div>
      </div>

      {/* Out-of-Turn Throw Button (unchanged) */}
      <div className="mt-4 flex flex-col items-center">
        <button
          type="button"
          aria-label="Mark out-of-turn throw"
          onClick={handleOutOfTurn}
          className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-all duration-200 text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation"
          disabled={isSubmitting}
        >
          Mark Out-of-Turn Throw
        </button>
        <span className="text-xs text-gray-500 mt-1">Use if this player threw out of turn</span>
      </div>

      {/* Penalty Confirmation Modal (unchanged) */}
      {showPenaltyConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm mx-4 w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 sm:mb-4 text-center">
              Confirm Penalty
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 text-center">
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
                  "Confirm Penalty"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
