/**
 * Keyboard navigation utilities for accessibility
 * @format
 */

/**
 * Handle keyboard navigation for focusable elements
 */
export function handleKeyboardNavigation(
  event: KeyboardEvent,
  elements: HTMLElement[],
  currentIndex: number
): number {
  let newIndex = currentIndex;

  switch (event.key) {
    case "ArrowDown":
    case "ArrowRight":
      event.preventDefault();
      newIndex = (currentIndex + 1) % elements.length;
      break;
    case "ArrowUp":
    case "ArrowLeft":
      event.preventDefault();
      newIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1;
      break;
    case "Home":
      event.preventDefault();
      newIndex = 0;
      break;
    case "End":
      event.preventDefault();
      newIndex = elements.length - 1;
      break;
  }

  if (newIndex !== currentIndex && elements[newIndex]) {
    elements[newIndex].focus();
  }

  return newIndex;
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "a[href]",
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");

  return Array.from(
    container.querySelectorAll(focusableSelectors)
  ) as HTMLElement[];
}

/**
 * Trap focus within a modal or dialog
 */
export function trapFocus(event: KeyboardEvent, container: HTMLElement): void {
  const focusableElements = getFocusableElements(container);

  if (focusableElements.length === 0) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.key === "Tab") {
    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
}

/**
 * Handle escape key to close modals
 */
export function handleEscapeKey(
  event: KeyboardEvent,
  onEscape: () => void
): void {
  if (event.key === "Escape") {
    event.preventDefault();
    onEscape();
  }
}
