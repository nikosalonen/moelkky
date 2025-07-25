/**
 * Tests for GameHistory component
 *
 * @format
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/preact";
import { GameProvider } from "../../src/context/GameContext";
import { GameHistory } from "../../src/components/GameHistory";

// Mock session storage
vi.mock("../../src/utils/storage/sessionStorage", () => {
  const mockClearAll = vi.fn();
  return {
    sessionStorageUtil: {
      loadAppState: vi.fn(() => null),
      saveAppState: vi.fn(),
      saveCurrentGame: vi.fn(),
      saveGameHistory: vi.fn(),
      clearAll: mockClearAll,
    },
  };
});

// Mock window.confirm and window.alert
const mockConfirm = vi.fn();
const mockAlert = vi.fn();
Object.defineProperty(window, "confirm", {
  value: mockConfirm,
  writable: true,
});
Object.defineProperty(window, "alert", {
  value: mockAlert,
  writable: true,
});

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
Object.defineProperty(URL, "createObjectURL", {
  value: mockCreateObjectURL,
  writable: true,
});
Object.defineProperty(URL, "revokeObjectURL", {
  value: mockRevokeObjectURL,
  writable: true,
});

// Mock document.createElement for download link
const mockCreateElement = vi.fn();
Object.defineProperty(document, "createElement", {
  value: mockCreateElement,
  writable: true,
});

describe("GameHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockReturnValue("blob:mock-url");
    mockCreateElement.mockReturnValue({
      href: "",
      download: "",
      click: vi.fn(),
    });
  });

  it("should not render when not visible", () => {
    render(
      <GameProvider>
        <GameHistory isVisible={false} onClose={vi.fn()} />
      </GameProvider>
    );

    expect(screen.queryByText("Game History")).not.toBeInTheDocument();
  });

  it("should render when visible", () => {
    render(
      <GameProvider>
        <GameHistory isVisible={true} onClose={vi.fn()} />
      </GameProvider>
    );

    expect(screen.getByText("Game History")).toBeInTheDocument();
    expect(screen.getByText("0 completed games")).toBeInTheDocument();
  });

  it("should display empty state when no games", () => {
    render(
      <GameProvider>
        <GameHistory isVisible={true} onClose={vi.fn()} />
      </GameProvider>
    );

    expect(screen.getByText("No Games Yet")).toBeInTheDocument();
    expect(screen.getByText("Complete your first game to see it appear here!")).toBeInTheDocument();
    expect(screen.getByText("📝")).toBeInTheDocument();
  });

  it("should close modal when clicking close button", async () => {
    const onClose = vi.fn();
    render(
      <GameProvider>
        <GameHistory isVisible={true} onClose={onClose} />
      </GameProvider>
    );

    const closeButton = screen.getByLabelText("Close history");
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("should close modal when clicking backdrop", async () => {
    const onClose = vi.fn();
    render(
      <GameProvider>
        <GameHistory isVisible={true} onClose={onClose} />
      </GameProvider>
    );

    const backdrop = screen.getByRole("presentation");
    fireEvent.click(backdrop);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("should close modal when pressing escape key", async () => {
    const onClose = vi.fn();
    render(
      <GameProvider>
        <GameHistory isVisible={true} onClose={onClose} />
      </GameProvider>
    );

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("should handle export functionality", async () => {
    const mockClick = vi.fn();
    mockCreateElement.mockReturnValue({
      href: "",
      download: "",
      click: mockClick,
    });

    render(
      <GameProvider>
        <GameHistory isVisible={true} onClose={vi.fn()} />
      </GameProvider>
    );

    const exportButton = screen.getByText("📥 Export History");
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockCreateElement).toHaveBeenCalledWith("a");
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });

  it("should handle clear history with confirmation", async () => {
    mockConfirm.mockReturnValue(true);

    render(
      <GameProvider>
        <GameHistory isVisible={true} onClose={vi.fn()} />
      </GameProvider>
    );

    const clearButton = screen.getByText("🗑️ Clear History");
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith(
        "Are you sure you want to clear all game history? This action cannot be undone."
      );
    });
  });

  it("should not clear history when user cancels confirmation", async () => {
    mockConfirm.mockReturnValue(false);

    render(
      <GameProvider>
        <GameHistory isVisible={true} onClose={vi.fn()} />
      </GameProvider>
    );

    const clearButton = screen.getByText("🗑️ Clear History");
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
    });
  });
}); 
