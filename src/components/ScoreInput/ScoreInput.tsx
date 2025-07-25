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
  onScoreSubmit?: (playerId: string, score: number) => void;
  onPenalty?: (playerId: string, reason?: string) => void;
}

type InputMethod = "single" | "multiple";

export function ScoreInput({
  currentPlayer,
  onScoreSubmit,
  onPenalty,
}: ScoreInputProps) {
  const { dispatch } = useGameContext();
  const { addToast } = useToast();
  const [inputMethod, setInputMethod] = useState<InputMethod>("single");
  const [scoreValue, setScoreValue] = useState<string>("");
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

  // Handle score submission
  const handleScoreSubmit = async () => {
    if (isSubmitting) return;

    const score = parseInt(scoreValue);
    if (isNaN(score)) {
      const errorMessage = "Please enter a valid number";
      setError(errorMessage);
      addToast({
        type: "error",
        title: "Invalid Score",
        message: errorMessage,
      });
      clearError();
      return;
    }

    const validation = validateScore(score, inputMethod === "single");
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
      // Use context dispatch if no callback provided
      if (onScoreSubmit) {
        onScoreSubmit(currentPlayer.id, score);
      } else {
        dispatch({
          type: "SUBMIT_SCORE",
          payload: { playerId: currentPlayer.id, score },
        });
      }

      // Clear input after successful submission
      setScoreValue("");
      
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
      // Reset submitting state after a brief delay to show loading state
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
      // Use context dispatch if no callback provided
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
      // Reset submitting state after a brief delay to show loading state
      setTimeout(() => {
        setIsSubmitting(false);
      }, 100);
    }
  };

  // Handle key press events
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleScoreSubmit();
    }
  };

  // Generate number buttons for quick input
  const generateNumberButtons = () => {
    const min = inputMethod === "single" ? 1 : 2;
    const max = 12;
    const buttons = [];

    // Add "None" button for 0 points (only in single pin mode)
    if (inputMethod === "single") {
      buttons.push(
        <button
          key="none"
          onClick={() => setScoreValue("0")}
          disabled={isSubmitting}
          className="w-14 h-14 sm:w-12 sm:h-12 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation"
        >
          None
        </button>
      );
    }

    for (let i = min; i <= max; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setScoreValue(i.toString())}
          disabled={isSubmitting}
          className="w-14 h-14 sm:w-12 sm:h-12 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation"
        >
          {i}
        </button>
      );
    }

    return buttons;
  };

  const handleOutOfTurn = () => {
    dispatch({ type: "OUT_OF_TURN_THROW", payload: { playerId: currentPlayer.id } });
    addToast({
      type: "info",
      title: "Out-of-Turn Throw",
      message: `${currentPlayer.name}'s throw was voided. Score reset to 25 if 37 or more.`,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 mb-4 sm:mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">
        Score Entry
      </h2>

      {/* Current Player Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="text-center">
          <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-2">
            Current Player
          </h3>
          <div className="text-xl sm:text-2xl font-bold text-blue-900">
            {currentPlayer.name}
          </div>
          <div className="text-xs sm:text-sm text-blue-700 mt-1">
            Current Score: {currentPlayer.score} / 50
          </div>
          <div className="text-xs sm:text-sm text-blue-600">
            Points Needed: {Math.max(0, 50 - currentPlayer.score)}
          </div>
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

      {/* Input Method Selection */}
      <div className="mb-4 sm:mb-6">
        <h4 className="text-base sm:text-lg font-medium text-gray-700 mb-2 sm:mb-3 text-center">
          Scoring Method
        </h4>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => {
              setInputMethod("single");
              setScoreValue("");
              setError(null);
            }}
            disabled={isSubmitting}
            className={`flex-1 px-3 sm:px-4 py-3 sm:py-3 rounded-lg border-2 transition-all duration-200 font-medium text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation ${
              inputMethod === "single"
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Single Pin (1-12)
          </button>
          <button
            onClick={() => {
              setInputMethod("multiple");
              setScoreValue("");
              setError(null);
            }}
            disabled={isSubmitting}
            className={`flex-1 px-3 sm:px-4 py-3 sm:py-3 rounded-lg border-2 transition-all duration-200 font-medium text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation ${
              inputMethod === "multiple"
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Multiple Pins (2-12)
          </button>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 mt-2 text-center">
          {inputMethod === "single"
            ? "Select the number on the single pin that was knocked down"
            : "Select the count of pins that were knocked down"}
        </p>
      </div>

      {/* Number Buttons */}
      <div className="mb-4 sm:mb-6">
        <h4 className="text-base sm:text-lg font-medium text-gray-700 mb-2 sm:mb-3 text-center">
          Quick Select
        </h4>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 sm:gap-2">
          {generateNumberButtons()}
        </div>
      </div>

      {/* Manual Input */}
      <div className="mb-4 sm:mb-6">
        <h4 className="text-base sm:text-lg font-medium text-gray-700 mb-2 sm:mb-3 text-center">
          Manual Entry
        </h4>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="number"
            aria-label={inputMethod === 'single' ? 'Single pin score' : 'Multiple pins score'}
            value={scoreValue}
            onInput={(e) => setScoreValue((e.target as HTMLInputElement).value)}
            onKeyDown={handleKeyPress}
            placeholder={
              inputMethod === "single" 
                ? "Enter score (0-12)" 
                : "Number of pins (2-12)"
            }
            min={inputMethod === "single" ? 0 : 2}
            max={12}
            className="flex-1 px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            disabled={isSubmitting}
          />
          <button
            type="button"
            aria-label="Submit score"
            onClick={handleScoreSubmit}
            disabled={!scoreValue.trim() || isSubmitting}
            className="px-4 sm:px-6 py-3 sm:py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed min-w-[120px] font-medium transition-all duration-200 text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation flex items-center justify-center"
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
      </div>

      {/* Penalty Section */}
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

      {/* Out-of-Turn Throw Button */}
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

      {/* Penalty Confirmation Modal */}
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
