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
  const dayOfYear = Math.floor((date.getTime() - new Date(year, 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const cycle = Math.ceil(dayOfYear / 28);
  return `${year}${cycle.toString().padStart(2, '0')}`;
}

export function parseAiracCycle(cycle: string): Date {
  const year = parseInt(cycle.slice(0, 4));
  const cycleNumber = parseInt(cycle.slice(4));
  const dayOfYear = (cycleNumber - 1) * 28 + 1;
  return new Date(year, 0, dayOfYear);
}