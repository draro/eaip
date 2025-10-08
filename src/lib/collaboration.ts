/**
 * Collaborative Editing Utilities
 * Manages real-time collaboration state for document editing
 */

export interface EditorPresence {
  userId: string;
  userName: string;
  userColor: string;
  documentId: string;
  sectionId?: string;
  subsectionId?: string;
  cursorPosition?: number;
  lastActivity: number;
}

export interface CollaborativeEdit {
  userId: string;
  userName: string;
  documentId: string;
  sectionId?: string;
  subsectionId?: string;
  content: string;
  timestamp: number;
}

// Generate a unique color for each user
export function generateUserColor(userId: string): string {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
  ];

  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
}

// Clean up inactive users (no activity for 30 seconds)
export function cleanupInactiveUsers(presences: Map<string, EditorPresence>): void {
  const now = Date.now();
  const timeout = 30000; // 30 seconds

  for (const [key, presence] of presences.entries()) {
    if (now - presence.lastActivity > timeout) {
      presences.delete(key);
    }
  }
}
