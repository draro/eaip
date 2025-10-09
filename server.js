/**
 * Custom Next.js server with WebSocket support
 *
 * This server enables real-time collaborative editing features
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store active editor presences per document
const documentPresences = new Map();
const recentEdits = new Map();

// Generate a unique color for each user
function generateUserColor(userId) {
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

function cleanupInactiveUsers(presences) {
  const now = Date.now();
  const timeout = 30000; // 30 seconds

  for (const [key, presence] of presences.entries()) {
    if (now - presence.lastActivity > timeout) {
      presences.delete(key);
    }
  }
}

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      console.log(`Header:`, req.headers);
      // Normalize host header
      if (req.headers['x-forwarded-host'] === undefined && req.headers['host']) {
        req.headers['x-forwarded-host'] = req.headers['host'];
      }

      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Initialize Socket.IO with production-ready CORS
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // In development, allow all origins
        if (dev) {
          callback(null, true);
          return;
        }

        // In production, allow specific domains
        const allowedOrigins = [
          process.env.NEXTAUTH_URL,
          'https://eaip.flyclim.com',
          'https://demoaip.flyclim.com',
        ].filter(Boolean);

        // Allow custom domains (they don't contain flyclim.com in production)
        if (!origin || allowedOrigins.includes(origin) || !origin.includes('flyclim.com')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io/',
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join a document editing room
    socket.on('join-document', (data) => {
      const { documentId, userId, userName } = data;
      const roomId = `document:${documentId}`;

      socket.join(roomId);

      if (!documentPresences.has(documentId)) {
        documentPresences.set(documentId, new Map());
      }

      const presences = documentPresences.get(documentId);
      const userColor = generateUserColor(userId);

      const presence = {
        userId,
        userName,
        userColor,
        documentId,
        lastActivity: Date.now(),
      };

      presences.set(socket.id, presence);

      socket.to(roomId).emit('user-joined', presence);

      const activePresences = Array.from(presences.values());
      socket.emit('presences-update', activePresences);

      console.log(`User ${userName} joined document ${documentId}`);
    });

    // Update cursor position
    socket.on('cursor-update', (data) => {
      const { documentId, sectionId, subsectionId, cursorPosition } = data;
      const presences = documentPresences.get(documentId);

      if (presences && presences.has(socket.id)) {
        const presence = presences.get(socket.id);
        presence.sectionId = sectionId;
        presence.subsectionId = subsectionId;
        presence.cursorPosition = cursorPosition;
        presence.lastActivity = Date.now();

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
    socket.on('content-update', (data) => {
      const { documentId, sectionId, subsectionId, content } = data;
      const presences = documentPresences.get(documentId);

      if (presences && presences.has(socket.id)) {
        const presence = presences.get(socket.id);
        presence.lastActivity = Date.now();

        const edit = {
          userId: presence.userId,
          userName: presence.userName,
          documentId,
          sectionId,
          subsectionId,
          content,
          timestamp: Date.now(),
        };

        if (!recentEdits.has(documentId)) {
          recentEdits.set(documentId, []);
        }
        const edits = recentEdits.get(documentId);
        edits.push(edit);

        if (edits.length > 100) {
          edits.shift();
        }

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
    socket.on('section-focus', (data) => {
      const { documentId, sectionId, subsectionId } = data;
      const presences = documentPresences.get(documentId);

      if (presences && presences.has(socket.id)) {
        const presence = presences.get(socket.id);
        presence.sectionId = sectionId;
        presence.subsectionId = subsectionId;
        presence.lastActivity = Date.now();

        socket.to(`document:${documentId}`).emit('user-focused', {
          userId: presence.userId,
          userName: presence.userName,
          userColor: presence.userColor,
          sectionId,
          subsectionId,
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);

      for (const [documentId, presences] of documentPresences.entries()) {
        if (presences.has(socket.id)) {
          const presence = presences.get(socket.id);
          presences.delete(socket.id);

          socket.to(`document:${documentId}`).emit('user-left', {
            userId: presence.userId,
            userName: presence.userName,
          });

          console.log(`User ${presence.userName} left document ${documentId}`);
        }
      }
    });

    // Heartbeat
    socket.on('heartbeat', (data) => {
      const { documentId } = data;
      const presences = documentPresences.get(documentId);

      if (presences && presences.has(socket.id)) {
        const presence = presences.get(socket.id);
        presence.lastActivity = Date.now();
      }
    });
  });

  // Cleanup inactive users
  setInterval(() => {
    for (const [documentId, presences] of documentPresences.entries()) {
      cleanupInactiveUsers(presences);

      if (presences.size === 0) {
        documentPresences.delete(documentId);
        recentEdits.delete(documentId);
      }
    }
  }, 10000);

  // Start server
  server.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  server.listen(port, async () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server ready for collaborative editing`);

    // Initialize git repositories for active organizations in production
    if (!dev) {
      try {
        console.log('\n> Initializing git repositories...');
        const { main: initGitRepos } = require('./scripts/init-git-repos.js');
        await initGitRepos();
      } catch (error) {
        console.error('> Warning: Git repository initialization failed:', error.message);
        console.error('> Application will continue, but version control may not work properly');
      }
    }
  });
});
