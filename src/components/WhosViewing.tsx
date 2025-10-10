'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Viewer {
  userId: string;
  userName: string;
  userColor: string;
  lastActivity: number;
}

interface WhosViewingProps {
  documentId: string;
  documentType: 'document' | 'checklist_instance';
  currentUserId?: string;
}

export default function WhosViewing({ documentId, documentType, currentUserId }: WhosViewingProps) {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchViewers();

    // Poll every 10 seconds to update viewer list
    const interval = setInterval(fetchViewers, 10000);

    return () => clearInterval(interval);
  }, [documentId, documentType]);

  const fetchViewers = async () => {
    try {
      const response = await fetch(`/api/${documentType === 'document' ? 'files' : 'checklists/instances'}/${documentId}/readers`);
      const data = await response.json();

      if (response.ok) {
        // Filter out current user and deduplicate
        const uniqueViewers = new Map<string, Viewer>();

        (data.readers || []).forEach((reader: any) => {
          if (currentUserId && reader.user._id === currentUserId) {
            return; // Skip current user
          }

          const viewerId = reader.user._id;
          if (!uniqueViewers.has(viewerId)) {
            uniqueViewers.set(viewerId, {
              userId: viewerId,
              userName: reader.user.name,
              userColor: generateColor(viewerId),
              lastActivity: new Date(reader.openedAt).getTime(),
            });
          }
        });

        setViewers(Array.from(uniqueViewers.values()));
      }
    } catch (error) {
      console.error('Error fetching viewers:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateColor = (userId: string): string => {
    // Generate a consistent color based on userId
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#f97316', // orange
    ];

    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTimeSince = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Eye className="h-4 w-4 animate-pulse" />
        <span>Loading viewers...</span>
      </div>
    );
  }

  if (viewers.length === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Eye className="h-4 w-4" />
        <span>No other viewers</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Users className="h-4 w-4" />
        <span className="font-medium">{viewers.length} viewing</span>
      </div>

      <TooltipProvider>
        <div className="flex -space-x-2">
          {viewers.slice(0, 5).map((viewer) => (
            <Tooltip key={viewer.userId}>
              <TooltipTrigger>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: viewer.userColor }}
                >
                  {getInitials(viewer.userName)}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <div className="font-medium">{viewer.userName}</div>
                  <div className="text-xs text-gray-400">
                    Active {getTimeSince(viewer.lastActivity)}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}

          {viewers.length > 5 && (
            <Tooltip>
              <TooltipTrigger>
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-gray-700 text-xs font-bold border-2 border-white shadow-sm hover:scale-110 transition-transform cursor-pointer">
                  +{viewers.length - 5}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs">
                  <div className="font-medium mb-2">Other viewers:</div>
                  <div className="space-y-1">
                    {viewers.slice(5).map((viewer) => (
                      <div key={viewer.userId} className="text-sm">
                        {viewer.userName}
                      </div>
                    ))}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}
