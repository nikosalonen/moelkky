/**
 * LoadingSpinner Component
 * Provides visual feedback during loading states
 *
 * @format
 */

import { useState, useEffect } from "preact/hooks";

export type SpinnerSize = "sm" | "md" | "lg" | "xl";
export type SpinnerVariant = "primary" | "secondary" | "success" | "error" | "warning";

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

/**
 * LoadingSpinner component with different sizes and variants
 */
export function LoadingSpinner({
  size = "md",
  variant = "primary",
  text,
  fullScreen = false,
  overlay = false,
  className = "",
}: LoadingSpinnerProps) {
  const [dots, setDots] = useState("");

  // Animated dots for loading text
  useEffect(() => {
    if (!text) return;

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, [text]);

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-4 h-4";
      case "md":
        return "w-6 h-6";
      case "lg":
        return "w-8 h-8";
      case "xl":
        return "w-12 h-12";
      default:
        return "w-6 h-6";
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "text-blue-500";
      case "secondary":
        return "text-gray-500";
      case "success":
        return "text-green-500";
      case "error":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      default:
        return "text-blue-500";
    }
  };

  const getTextSizeClasses = () => {
    switch (size) {
      case "sm":
        return "text-xs";
      case "md":
        return "text-sm";
      case "lg":
        return "text-base";
      case "xl":
        return "text-lg";
      default:
        return "text-sm";
    }
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`${getSizeClasses()} ${getVariantClasses()} animate-spin rounded-full border-2 border-gray-300 border-t-current`}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <div className={`mt-2 ${getTextSizeClasses()} text-gray-600 font-medium`}>
          {text}
          {dots}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * Inline loading spinner for buttons and small areas
 */
export function InlineSpinner({ size = "sm", variant = "primary" }: { size?: SpinnerSize; variant?: SpinnerVariant }) {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-3 h-3";
      case "md":
        return "w-4 h-4";
      case "lg":
        return "w-5 h-5";
      case "xl":
        return "w-6 h-6";
      default:
        return "w-3 h-3";
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "text-white";
      case "secondary":
        return "text-gray-600";
      case "success":
        return "text-white";
      case "error":
        return "text-white";
      case "warning":
        return "text-white";
      default:
        return "text-white";
    }
  };

  return (
    <div
      className={`${getSizeClasses()} ${getVariantClasses()} animate-spin rounded-full border-2 border-transparent border-t-current`}
      role="status"
      aria-label="Loading"
    />
  );
}

/**
 * Skeleton loading component for content placeholders
 */
export function Skeleton({ className = "", lines = 1 }: { className?: string; lines?: number }) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={`bg-gray-200 rounded h-4 mb-2 ${i === lines - 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
} 
