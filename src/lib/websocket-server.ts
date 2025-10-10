/**
 * WebSocket Server for Real-Time Collaboration
 *
 * This module sets up a WebSocket server for handling real-time
 * collaborative editing features.
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { EditorPresence, CollaborativeEdit, generateUserColor, cleanupInactiveUsers } from './collaboration';

let io: SocketIOServer | null = null;

// Store active editor presences per document
const documentPresences = new Map<string, Map<string, EditorPresence>>();

// Store recent edits for conflict resolution
const recentEdits = new Map<string, CollaborativeEdit[]>();

export function initializeWebSocketServer(httpServer: HTTPServer) {
  if (io) {
    console.log('WebSocket server already initialized');
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    path: '/socket.io/',
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join a document editing room
    socket.on('join-document', (data: { documentId: string; userId: string; userName: string }) => {
      const { documentId, userId, userName } = data;
      const roomId = `document:${documentId}`;

      socket.join(roomId);

      // Initialize presence map for this document if not exists
      if (!documentPresences.has(documentId)) {
        documentPresences.set(documentId, new Map());
      }

      const presences = documentPresences.get(documentId)!;
      const userColor = generateUserColor(userId);

      // Add user presence
      const presence: EditorPresence = {
        userId,
        userName,
        userColor,
        documentId,
        lastActivity: Date.now(),
      };

      presences.set(socket.id, presence);

      // Notify others about new user
      socket.to(roomId).emit('user-joined', presence);

      // Send current presences to the new user
      const activePresences = Array.from(presences.values());
      socket.emit('presences-update', activePresences);

      console.log(`User ${userName} joined document ${documentId}`);
    });

    // Update cursor position
    socket.on('cursor-update', (data: { documentId: string; sectionId?: string; subsectionId?: string; cursorPosition?: number }) => {
      const { documentId, sectionId, subsectionId, cursorPosition } = data;
      const presences = documentPresences.get(documentId);

      if (presences && presences.has(socket.id)) {
        const presence = presences.get(socket.id)!;
        presence.sectionId = sectionId;
        presence.subsectionId = subsectionId;
        presence.cursorPosition = cursorPosition;
        presence.lastActivity = Date.now();

        // Broadcast cursor update to others in the room
        socket.to(`document:${documentId}`).emit('cursor-moved', {
          socketId: socket.id,
          userId: presence.userId,
          userName: presence.userName,
          userColor: presence.userColor,
          sectionId,
          subsectionId,
          cursorPosition,
        });
      }
    });

    // Content update
    socket.on('content-update', (data: { documentId: string; sectionId?: string; subsectionId?: string; content: string }) => {
      const { documentId, sectionId, subsectionId, content } = data;
      const presences = documentPresences.get(documentId);

      if (presences && presences.has(socket.id)) {
        const presence = presences.get(socket.id)!;
        presence.lastActivity = Date.now();

        const edit: CollaborativeEdit = {
          userId: presence.userId,
          userName: presence.userName,
          documentId,
          sectionId,
          subsectionId,
          content,
          timestamp: Date.now(),
        };

        // Store recent edit
        if (!recentEdits.has(documentId)) {
          recentEdits.set(documentId, []);
        }
        const edits = recentEdits.get(documentId)!;
        edits.push(edit);

        // Keep only last 100 edits
        if (edits.length > 100) {
          edits.shift();
        }

        // Broadcast content update to others
        socket.to(`document:${documentId}`).emit('content-changed', {
          userId: presence.userId,
          userName: presence.userName,
          userColor: presence.userColor,
          sectionId,
          subsectionId,
          content,
          timestamp: edit.timestamp,
        });
      }
    });

    // User is actively editing a section
    socket.on('section-focus', (data: { documentId: string; sectionId?: string; subsectionId?: string }) => {
      const { documentId, sectionId, subsectionId } = data;
      const presences = documentPresences.get(documentId);

      if (presences && presences.has(socket.id)) {
        const presence = presences.get(socket.id)!;
        presence.sectionId = sectionId;
        presence.subsectionId = subsectionId;
        presence.lastActivity = Date.now();

        // Broadcast focus change
        socket.to(`document:${documentId}`).emit('user-focused', {
          userId: presence.userId,
          userName: presence.userName,
          userColor: presence.userColor,
          sectionId,
          subsectionId,
        });
      }
    });

    // Checkbox toggle in checklist
    socket.on('checkbox-toggle', (data: {
      documentId: string;
      itemId: string;
      checked: boolean;
      checkedBy: { userId: string; userName: string; userEmail: string };
      checkedAt: string;
    }) => {
      const { documentId, itemId, checked, checkedBy, checkedAt } = data;
      const presences = documentPresences.get(documentId);

      if (presences && presences.has(socket.id)) {
        const presence = presences.get(socket.id)!;
        presence.lastActivity = Date.now();

        // Broadcast checkbox toggle to all others in the room
        socket.to(`document:${documentId}`).emit('checkbox-toggled', {
          itemId,
          checked,
          checkedBy,
          checkedAt,
          timestamp: Date.now(),
        });

        console.log(`Checkbox ${itemId} ${checked ? 'checked' : 'unchecked'} by ${checkedBy.userName} in document ${documentId}`);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);

      // Remove user from all documents
      Array.from(documentPresences.entries()).forEach(([documentId, presences]) => {
        if (presences.has(socket.id)) {
          const presence = presences.get(socket.id)!;
          presences.delete(socket.id);

          // Notify others
          socket.to(`document:${documentId}`).emit('user-left', {
            userId: presence.userId,
            userName: presence.userName,
          });

          console.log(`User ${presence.userName} left document ${documentId}`);
        }
      });
    });

    // Heartbeat to keep connection alive
    socket.on('heartbeat', (data: { documentId: string }) => {
      const { documentId } = data;
      const presences = documentPresences.get(documentId);

      if (presences && presences.has(socket.id)) {
        const presence = presences.get(socket.id)!;
        presence.lastActivity = Date.now();
      }
    });
  });

  // Cleanup inactive users every 10 seconds
  setInterval(() => {
    Array.from(documentPresences.entries()).forEach(([documentId, presences]) => {
      cleanupInactiveUsers(presences);

      // Remove empty document maps
      if (presences.size === 0) {
        documentPresences.delete(documentId);
        recentEdits.delete(documentId);
      }
    });
  }, 10000);

  console.log('WebSocket server initialized');
  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}
