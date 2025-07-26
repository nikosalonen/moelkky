/**
 * Mobile Navigation Component
 * Provides mobile-optimized navigation and quick actions
 *
 * @format
 */

import { useState } from "preact/hooks";

interface MobileNavProps {
  onViewHistory: () => void;
  onEndGame?: () => void;
  canEndGame?: boolean;
  gameState?: string;
}

export function MobileNav({ 
  onViewHistory, 
  onEndGame, 
  canEndGame = false, 
  gameState = "setup" 
}: MobileNavProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="md:hidden">
      {/* Mobile Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 mobile-nav">
        <div className="flex items-center justify-around p-2">
          {/* Quick Actions */}
          <button
            onClick={onViewHistory}
            className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 transition-colors mobile-btn"
            aria-label="View game history"
          >
            <span className="text-lg">📊</span>
            <span className="text-xs mt-1 mobile-text-sm">History</span>
          </button>

          {/* End Game Button (only show when game is playing) */}
          {gameState === "playing" && canEndGame && onEndGame && (
            <button
              onClick={onEndGame}
              className="flex flex-col items-center p-2 rounded-lg hover:bg-red-100 transition-colors mobile-btn"
              aria-label="End game"
            >
              <span className="text-lg">🏁</span>
              <span className="text-xs mt-1 mobile-text-sm">End Game</span>
            </button>
          )}

          {/* More Actions Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 transition-colors mobile-btn"
            aria-label="More actions"
          >
            <span className="text-lg">⋯</span>
            <span className="text-xs mt-1 mobile-text-sm">More</span>
          </button>
        </div>

        {/* Expanded Actions */}
        {isExpanded && (
          <div className="border-t border-gray-200 p-2 bg-gray-50 mobile-animate-in">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  // Scroll to top
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setIsExpanded(false);
                }}
                className="flex flex-col items-center p-2 rounded-lg bg-white hover:bg-gray-100 transition-colors mobile-btn"
                aria-label="Scroll to top"
              >
                <span className="text-sm">⬆️</span>
                <span className="text-xs mt-1 mobile-text-sm">Top</span>
              </button>

              <button
                onClick={() => {
                  // Refresh page
                  window.location.reload();
                }}
                className="flex flex-col items-center p-2 rounded-lg bg-white hover:bg-gray-100 transition-colors mobile-btn"
                aria-label="Refresh page"
              >
                <span className="text-sm">🔄</span>
                <span className="text-xs mt-1 mobile-text-sm">Refresh</span>
              </button>

              <button
                onClick={() => {
                  // Share game (if supported)
                  if (navigator.share) {
                    navigator.share({
                      title: 'Mölkky Score Counter',
                      text: 'Check out this Mölkky score counter app!',
                      url: window.location.href
                    });
                  } else {
                    // Fallback: copy URL
                    navigator.clipboard.writeText(window.location.href);
                  }
                  setIsExpanded(false);
                }}
                className="flex flex-col items-center p-2 rounded-lg bg-white hover:bg-gray-100 transition-colors mobile-btn"
                aria-label="Share app"
              >
                <span className="text-sm">📤</span>
                <span className="text-xs mt-1 mobile-text-sm">Share</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom padding to prevent content from being hidden behind nav */}
      <div className="h-20"></div>
    </div>
  );
} 
