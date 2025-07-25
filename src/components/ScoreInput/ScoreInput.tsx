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
  const [inputMethod, setInputMethod] = useState<InputMethod>("single");
  const [scoreValue, setScoreValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showPenaltyConfirm, setShowPenaltyConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear error after a delay
  const clearError = () => {
    setTimeout(() => setError(null), 3000);
  };

  // Handle score submission
  const handleScoreSubmit = async () => {
    if (isSubmitting) return;

    const score = parseInt(scoreValue);
    if (isNaN(score)) {
      setError("Please enter a valid number");
      clearError();
      return;
    }

    const validation = validateScore(score, inputMethod === "single");
    if (!validation.isValid) {
      setError(validation.error || "Invalid score");
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
    } catch (err) {
      setError("Failed to submit score. Please try again.");
      clearError();
    }

    // Reset submitting state after a brief delay to show loading state
    setTimeout(() => {
      setIsSubmitting(false);
    }, 100);
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
    } catch (err) {
      setError("Failed to apply penalty. Please try again.");
      clearError();
    }

    // Reset submitting state after a brief delay to show loading state
    setTimeout(() => {
      setIsSubmitting(false);
    }, 100);
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
          className="w-12 h-12 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-semibold"
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
          className="w-12 h-12 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-semibold"
        >
          {i}
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
        Score Entry
      </h2>

      {/* Current Player Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Current Player
          </h3>
          <div className="text-2xl font-bold text-blue-900">
            {currentPlayer.name}
          </div>
          <div className="text-sm text-blue-700 mt-1">
            Current Score: {currentPlayer.score} / 50
          </div>
          <div className="text-sm text-blue-600">
            Points Needed: {Math.max(0, 50 - currentPlayer.score)}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Input Method Selection */}
      <div className="mb-6">
        <h4 className="text-lg font-medium text-gray-700 mb-3">
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
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200 font-medium ${
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
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200 font-medium ${
              inputMethod === "multiple"
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Multiple Pins (2-12)
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {inputMethod === "single"
            ? "Select the number on the single pin that was knocked down"
            : "Select the count of pins that were knocked down"}
        </p>
      </div>

      {/* Number Buttons */}
      <div className="mb-6">
        <h4 className="text-lg font-medium text-gray-700 mb-3">Quick Select</h4>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
          {generateNumberButtons()}
        </div>
      </div>

      {/* Manual Input */}
      <div className="mb-6">
        <h4 className="text-lg font-medium text-gray-700 mb-3">Manual Entry</h4>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="number"
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
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={handleScoreSubmit}
            disabled={!scoreValue.trim() || isSubmitting}
            className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed min-w-[120px] font-medium transition-colors duration-200"
          >
            Submit Score
          </button>
        </div>
      </div>

      {/* Penalty Section */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-lg font-medium text-gray-700 mb-3">Penalty</h4>
        <p className="text-sm text-gray-600 mb-4">
          Apply a penalty to reset the player's score to 25 points.
        </p>
        <button
          onClick={() => setShowPenaltyConfirm(true)}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors duration-200"
        >
          Apply Penalty
        </button>
      </div>

      {/* Penalty Confirmation Modal */}
      {showPenaltyConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Confirm Penalty
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to apply a penalty to{" "}
              <span className="font-medium">{currentPlayer.name}</span>? This
              will reset their score to 25 points.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPenaltyConfirm(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePenalty()}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Applying..." : "Confirm Penalty"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
