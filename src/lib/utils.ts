import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function generateAiracCycle(date: Date = new Date()): string {
  const year = date.getFullYear();
  const shortYear = year.toString().slice(-2); // Get last 2 digits of year
  const dayOfYear = Math.floor((date.getTime() - new Date(year, 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const cycle = Math.ceil(dayOfYear / 28);
  return `${shortYear}${cycle.toString().padStart(2, '0')}`;
}

export function parseAiracCycle(cycle: string): Date {
  // Handle both YYMM (4 chars) and YYYYMM (6 chars) formats for backward compatibility
  let year: number;
  let cycleNumber: number;

  if (cycle.length === 4) {
    // YYMM format
    const shortYear = parseInt(cycle.slice(0, 2));
    year = shortYear < 50 ? 2000 + shortYear : 1900 + shortYear; // Assume 2000s if < 50, else 1900s
    cycleNumber = parseInt(cycle.slice(2));
  } else if (cycle.length === 6) {
    // YYYYMM format (for backward compatibility)
    year = parseInt(cycle.slice(0, 4));
    cycleNumber = parseInt(cycle.slice(4));
  } else {
    throw new Error(`Invalid AIRAC cycle format: ${cycle}`);
  }

  const dayOfYear = (cycleNumber - 1) * 28 + 1;
  return new Date(year, 0, dayOfYear);
}

export function formatAiracCycle(cycle: string): string {
  // Convert YYYYMM format to YYMM format for display
  if (cycle.length === 6) {
    // YYYYMM format - convert to YYMM
    const year = cycle.slice(2, 4); // Get last 2 digits
    const cycleNum = cycle.slice(4);
    return `${year}${cycleNum}`;
  }
  // Already in YYMM format or invalid
  return cycle;
}