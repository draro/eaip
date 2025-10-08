/**
 * useCollaboration Hook
 *
 * Manages real-time collaborative editing state and WebSocket connections
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { EditorPresence } from '@/lib/collaboration';

interface UseCollaborationOptions {
  documentId: string;
  userId: string;
  userName: string;
  onContentChange?: (data: ContentChangeData) => void;
  onPresenceUpdate?: (presences: EditorPresence[]) => void;
}

interface ContentChangeData {
  userId: string;
  userName: string;
  userColor: string;
  sectionId?: string;
  subsectionId?: string;
  content: string;
  timestamp: number;
}

export interface CursorPosition {
  userId: string;
  userName: string;
  userColor: string;
  sectionId?: string;
  subsectionId?: string;
  cursorPosition?: number;
  socketId?: string;
}

export function useCollaboration({
  documentId,
  userId,
  userName,
  onContentChange,
  onPresenceUpdate,
}: UseCollaborationOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [activeEditors, setActiveEditors] = useState<EditorPresence[]>([]);
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io({
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('Connected to collaboration server');
      setConnected(true);

      // Join the document room
      socketInstance.emit('join-document', {
        documentId,
        userId,
        userName,
      });

      // Start heartbeat
      heartbeatIntervalRef.current = setInterval(() => {
        socketInstance.emit('heartbeat', { documentId });
      }, 15000); // Every 15 seconds
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from collaboration server');
      setConnected(false);

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    });

    // Handle presences update
    socketInstance.on('presences-update', (presences: EditorPresence[]) => {
      setActiveEditors(presences);
      if (onPresenceUpdate) {
        onPresenceUpdate(presences);
      }
    });

    // Handle user joined
    socketInstance.on('user-joined', (presence: EditorPresence) => {
      setActiveEditors((prev) => [...prev, presence]);
      if (onPresenceUpdate) {
        onPresenceUpdate([...activeEditors, presence]);
      }
    });

    // Handle user left
    socketInstance.on('user-left', (data: { userId: string }) => {
      setActiveEditors((prev) => prev.filter((p) => p.userId !== data.userId));
      setCursors((prev) => {
        const newCursors = new Map(prev);
        Array.from(newCursors.entries()).forEach(([key, cursor]) => {
          if (cursor.userId === data.userId) {
            newCursors.delete(key);
          }
        });
        return newCursors;
      });
    });

    // Handle cursor movements
    socketInstance.on('cursor-moved', (data: CursorPosition & { socketId: string }) => {
      setCursors((prev) => {
        const newCursors = new Map(prev);
        newCursors.set(data.socketId, {
          userId: data.userId,
          userName: data.userName,
          userColor: data.userColor,
          sectionId: data.sectionId,
          subsectionId: data.subsectionId,
          cursorPosition: data.cursorPosition,
        });
        return newCursors;
      });
    });

    // Handle content changes
    socketInstance.on('content-changed', (data: ContentChangeData) => {
      if (onContentChange) {
        onContentChange(data);
      }
    });

    // Handle user focus changes
    socketInstance.on('user-focused', (data: {
      userId: string;
      userName: string;
      userColor: string;
      sectionId?: string;
      subsectionId?: string;
    }) => {
      setActiveEditors((prev) =>
        prev.map((editor) =>
          editor.userId === data.userId
            ? { ...editor, sectionId: data.sectionId, subsectionId: data.subsectionId }
            : editor
        )
      );
    });

    setSocket(socketInstance);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      socketInstance.disconnect();
    };
  }, [documentId, userId, userName]);

  // Emit cursor update
  const updateCursor = useCallback(
    (sectionId?: string, subsectionId?: string, cursorPosition?: number) => {
      if (socket && connected) {
        socket.emit('cursor-update', {
          documentId,
          sectionId,
          subsectionId,
          cursorPosition,
        });
      }
    },
    [socket, connected, documentId]
  );

  // Emit content update
  const updateContent = useCallback(
    (sectionId: string | undefined, subsectionId: string | undefined, content: string) => {
      if (socket && connected) {
        socket.emit('content-update', {
          documentId,
          sectionId,
          subsectionId,
          content,
        });
      }
    },
    [socket, connected, documentId]
  );

  // Emit section focus
  const focusSection = useCallback(
    (sectionId?: string, subsectionId?: string) => {
      if (socket && connected) {
        socket.emit('section-focus', {
          documentId,
          sectionId,
          subsectionId,
        });
      }
    },
    [socket, connected, documentId]
  );

  return {
    connected,
    activeEditors,
    cursors: Array.from(cursors.values()),
    updateCursor,
    updateContent,
    focusSection,
  };
}
