import express, { Request, Response } from 'express';
import multer, { Multer } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// 1. NEW: Import Socket.IO and HTTP modules
import { Server as SocketIOServer } from 'socket.io';
import http from 'http';


const app = express();
const PORT = process.env.PORT || 5000;
const SOCKET_PORT = 3001;


// 1. NEW: Create HTTP Server and Socket.IO Server
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"], // Adjust for your React frontend URL
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../uploads')));
// app.use(express.static('uploads'));

// Storage configuration for multer
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload: Multer = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req: Request, file: Express.Multer.File, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// In-memory storage for designs and collaboration (use database in production)
const designs = new Map();
const collaborativeSessions = new Map();
const userUploads = new Map();


// --- NEW MOCK DATA & HELPER ---

// MOCK: In a real app, this would query your Firebase/DB
// It returns a direct media URL for the screen to play
function getFirstMediaFromPlaylist(playlistId: string): { url: string; mediaType: string } | null {
  // Simple mock: Playlist 1 deploys a video, any other playlist deploys an image
  if (playlistId === 'test-playlist-video') {
    return {
      url: 'https://flutter.github.io/assets-for-api-docs/assets/videos/butterfly.mp4',
      mediaType: 'video'
    };
  }
  if (playlistId === 'test-playlist-image') {
    return {
      url: 'https://picsum.photos/1920/1080',
      mediaType: 'image'
    };
  }
  // Fallback to a default image URL
  return {
    url: 'https://cdn.pixabay.com/photo/2023/10/26/15/41/forest-8342784_1280.jpg',
    mediaType: 'image'
  };
}


// --- SOCKET.IO REAL-TIME LOGIC ---
const SCREEN_ROOM_PREFIX = 'screen-';

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Android screen clients will join a room based on their Screen ID (e.g., scr01)
  socket.on('join_screen_room', (screenId: string) => {
    socket.join(SCREEN_ROOM_PREFIX + screenId);
    console.log(`[Socket.IO] Client ${socket.id} joined room: ${SCREEN_ROOM_PREFIX + screenId}`);
  });

  // 👈 NEW: Deployment Trigger from the React Admin Panel
  socket.on('deployment_request', (data: { screenId: string, playlistId: string }) => {
    console.log(`[DEPLOYMENT] Received request for Screen ${data.screenId} with Playlist ${data.playlistId}`);

    const media = getFirstMediaFromPlaylist(data.playlistId);

    if (media) {
      const targetRoom = SCREEN_ROOM_PREFIX + data.screenId;

      // Broadcast the media update to the specific screen's room
      io.to(targetRoom).emit('media_update', {
        url: media.url,
        mediaType: media.mediaType,
        playlistId: data.playlistId,
        timestamp: new Date().toISOString()
      });
      console.log(`[DEPLOYMENT] Broadcasted ${media.mediaType} to room ${targetRoom}. URL: ${media.url}`);
    } else {
      console.warn(`[DEPLOYMENT] No media found for playlist ${data.playlistId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Routes

/**
 * Upload media file
 */
app.post('/api/media/upload', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const userId = req.body.userId || 'anonymous';
    const mediaId = uuidv4();
    const mediaUrl = `http://localhost:${PORT}/${req.file.filename}`;

    // Track upload
    if (!userUploads.has(userId)) {
      userUploads.set(userId, []);
    }
    userUploads.get(userId).push({
      id: mediaId,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId,
      serverUrl: mediaUrl,
    });

    res.status(200).json({
      id: mediaId,
      url: mediaUrl,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed', details: error });
  }
});

/**
 * Delete media file
 */
app.delete('/api/media/:mediaId', (req: Request, res: Response) => {
  try {
    const { mediaId } = req.params;
    // In production, you would delete from database and filesystem
    res.status(200).json({ message: 'Media deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

/**
 * Get user's uploaded media
 */
app.get('/api/media/user/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const uploads = userUploads.get(userId) || [];
    res.status(200).json(uploads);
  } catch (error) {
    res.status(500).json({ error: 'Fetch failed' });
  }
});

/**
 * Create or join collaborative session
 */
app.post('/api/collaboration/session', (req: Request, res: Response) => {
  try {
    const { designId, userId } = req.body;
    const sessionId = `session-${designId}`;

    if (!collaborativeSessions.has(sessionId)) {
      collaborativeSessions.set(sessionId, {
        id: sessionId,
        designId,
        users: [],
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      });
    }

    const session = collaborativeSessions.get(sessionId);
    if (!session.users.includes(userId)) {
      session.users.push(userId);
    }
    session.lastActivity = new Date().toISOString();

    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ error: 'Session creation failed' });
  }
});

/**
 * Get collaborators for a design
 */
app.get('/api/collaboration/collaborators/:designId', (req: Request, res: Response) => {
  try {
    const { designId } = req.params;
    const sessionId = `session-${designId}`;
    const session = collaborativeSessions.get(sessionId);

    res.status(200).json({
      collaborators: session ? session.users : [],
    });
  } catch (error) {
    res.status(500).json({ error: 'Fetch failed' });
  }
});

/**
 * Save design
 */
app.put('/api/designs/:designId', (req: Request, res: Response) => {
  try {
    const { designId } = req.params;
    const designData = req.body;

    designs.set(designId, {
      ...designData,
      id: designId,
      lastModified: new Date().toISOString(),
    });

    res.status(200).json({
      id: designId,
      message: 'Design saved successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Save failed' });
  }
});

/**
 * Share design with users
 */
app.post('/api/designs/:designId/share', (req: Request, res: Response) => {
  try {
    const { designId } = req.params;
    const { collaborators } = req.body;

    if (designs.has(designId)) {
      const design = designs.get(designId);
      design.collaborators = collaborators;
      design.isShared = true;
    }

    res.status(200).json({ message: 'Design shared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Share failed' });
  }
});

/**
 * Health check
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'Server is running' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: Function) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

httpServer.listen(SOCKET_PORT, () => {
  console.log(`Socket.IO Server listening on *:${SOCKET_PORT}`);
});

// Start server
app.listen(PORT, () => {
  console.log(`SignCraft Server running on http://localhost:${PORT}`);
  console.log(`Uploads directory: ${path.join(__dirname, '../uploads')}`);
});

export default app;
