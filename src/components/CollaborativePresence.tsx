/**
 * Collaborative Presence Component
 *
 * Displays active editors and their current editing locations
 */

import React from 'react';
import { EditorPresence } from '@/lib/collaboration';
import { Users, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CollaborativePresenceProps {
  activeEditors: EditorPresence[];
  currentUserId: string;
}

export default function CollaborativePresence({
  activeEditors,
  currentUserId,
}: CollaborativePresenceProps) {
  // Filter out current user
  const otherEditors = activeEditors.filter((editor) => editor.userId !== currentUserId);

  if (otherEditors.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
      <Users className="w-4 h-4 text-blue-600" />
      <span className="text-sm font-medium text-blue-900">
        {otherEditors.length} {otherEditors.length === 1 ? 'editor' : 'editors'} active
      </span>
      <div className="flex items-center gap-1 ml-2">
        <TooltipProvider>
          {otherEditors.slice(0, 5).map((editor) => (
            <Tooltip key={editor.userId}>
              <TooltipTrigger>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white shadow-sm"
                  style={{ backgroundColor: editor.userColor }}
                >
                  {editor.userName.charAt(0).toUpperCase()}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <p className="font-semibold">{editor.userName}</p>
                  {editor.sectionId && (
                    <p className="text-xs text-gray-500">
                      Editing section {editor.subsectionId || editor.sectionId}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          {otherEditors.length > 5 && (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 border-2 border-white shadow-sm">
              +{otherEditors.length - 5}
            </div>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
}

interface SectionPresenceIndicatorProps {
  sectionId: string;
  subsectionId?: string;
  activeEditors: EditorPresence[];
  currentUserId: string;
}

export function SectionPresenceIndicator({
  sectionId,
  subsectionId,
  activeEditors,
  currentUserId,
}: SectionPresenceIndicatorProps) {
  const editorsInSection = activeEditors.filter(
    (editor) =>
      editor.userId !== currentUserId &&
      editor.sectionId === sectionId &&
      (!subsectionId || editor.subsectionId === subsectionId)
  );

  if (editorsInSection.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-1 ml-2">
            {editorsInSection.map((editor) => (
              <div
                key={editor.userId}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs"
                style={{ backgroundColor: editor.userColor }}
              >
                <Circle className="w-2 h-2 animate-pulse" fill="currentColor" />
                <span className="font-medium">{editor.userName}</span>
              </div>
            ))}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Currently editing this section</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
