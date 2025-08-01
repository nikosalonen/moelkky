/**
 * Toast Notification System
 * Provides user feedback through toast notifications
 *
 * @format
 */

import { useState, useEffect, useCallback } from "preact/hooks";
import { createContext } from "preact";
import { useContext } from "preact/hooks";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

/**
 * Toast Provider component that manages toast state
 */
export function ToastProvider({ children }: { children: any }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const MAX_TOASTS = 3; // Limit maximum number of visible toasts

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      id,
      duration: 3000, // Reduced default duration to 3 seconds for faster gameplay
      priority: 'normal',
      ...toast,
    };

    setToasts((prev) => {
      // Check for duplicate toasts (same title and message)
      const isDuplicate = prev.some(
        existingToast => 
          existingToast.title === newToast.title && 
          existingToast.message === newToast.message &&
          existingToast.type === newToast.type
      );

      if (isDuplicate) {
        return prev; // Don't add duplicate
      }

      // Limit the number of toasts
      const updatedToasts = [...prev, newToast];
      if (updatedToasts.length > MAX_TOASTS) {
        // Remove oldest low-priority toasts first
        const sortedToasts = updatedToasts.sort((a, b) => {
          const priorityOrder = { high: 3, normal: 2, low: 1 };
          return (priorityOrder[b.priority || 'normal'] - priorityOrder[a.priority || 'normal']);
        });
        return sortedToasts.slice(0, MAX_TOASTS);
      }

      return updatedToasts;
    });

    // Auto-remove toast after duration (unless persistent)
    if (!newToast.persistent && newToast.duration) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

/**
 * Hook to use toast functionality
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

/**
 * Individual Toast component
 */
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 300); // Wait for exit animation
  };

  const getToastStyles = () => {
    const baseStyles = "transform transition-all duration-300 ease-in-out";
    const visibilityStyles = isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0";
    
    return `${baseStyles} ${visibilityStyles}`;
  };

  const getTypeStyles = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "💬";
    }
  };

  return (
    <div
      className={`${getToastStyles()} ${getTypeStyles()} border rounded-lg p-3 sm:p-4 shadow-lg max-w-sm w-full mb-3 mobile-card`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-2 sm:mr-3 text-base sm:text-lg">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs sm:text-sm font-medium mb-1 mobile-text-sm">{toast.title}</h4>
          {toast.message && (
            <p className="text-xs sm:text-sm opacity-90 mobile-text-sm">{toast.message}</p>
          )}
        </div>
        <div className="flex-shrink-0 ml-2 sm:ml-3">
          <button
            onClick={handleRemove}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors mobile-btn"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Toast Container that displays all toasts
 */
function ToastContainer() {
  const { toasts, removeToast, clearToasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-2 sm:top-4 right-2 sm:right-4 z-50 space-y-2 max-w-sm pointer-events-none mobile-toast">
      {/* Clear All Button */}
      {toasts.length > 1 && (
        <div className="pointer-events-auto">
          <button
            onClick={clearToasts}
            className="bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-75 hover:opacity-100 transition-opacity mobile-btn"
            title="Clear all notifications"
          >
            Clear All ({toasts.length})
          </button>
        </div>
      )}
      
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
}

/**
 * Utility functions for common toast types
 */
export const toast = {
  success: (title: string, message?: string, options?: Partial<Toast>) => {
    const { addToast } = useToast();
    addToast({ type: "success", title, message, ...options });
  },
  error: (title: string, message?: string, options?: Partial<Toast>) => {
    const { addToast } = useToast();
    addToast({ type: "error", title, message, ...options });
  },
  warning: (title: string, message?: string, options?: Partial<Toast>) => {
    const { addToast } = useToast();
    addToast({ type: "warning", title, message, ...options });
  },
  info: (title: string, message?: string, options?: Partial<Toast>) => {
    const { addToast } = useToast();
    addToast({ type: "info", title, message, ...options });
  },
}; 
