import express, { Request, Response } from 'express';
import multer, { Multer } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const SOCKET_PORT = 3002;

// Create HTTP Server and Socket.IO Server
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*", // In production, replace with your specific frontend URL
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../uploads')));

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

// In-memory storage
const designs = new Map();
const collaborativeSessions = new Map();
const userUploads = new Map();

// --- SOCKET.IO REAL-TIME LOGIC ---

interface ConnectedClient {
  socketId: string;
  type: 'dashboard' | 'android';
  screenId?: string; // e.g., 'scr01'
}

let connectedClients: ConnectedClient[] = [];

io.on('connection', (socket) => {
  console.log(`[Socket.IO] New Connection: ${socket.id}`);

  // 1. Device Registration
  socket.on('register-device', (data: { type: 'dashboard' | 'android', screenId?: string }) => {
    // Clean up any old registration for this specific socket
    connectedClients = connectedClients.filter(c => c.socketId !== socket.id);

    const newClient: ConnectedClient = {
      socketId: socket.id,
      type: data.type,
      screenId: data.screenId
    };

    connectedClients.push(newClient);
    console.log(`[REGISTRATION] ${data.type} registered (${data.screenId || 'N/A'}). Total: ${connectedClients.length}`);

    // If it's an Android device, notify Dashboards to set UI status to ONLINE
    if (data.type === 'android' && data.screenId) {
      io.emit('screen_status_change', {
        screenId: data.screenId,
        status: 'online'
      });
    }

    // Broadcast updated client list to all Dashboards for the "Total Screens" counter
    io.emit('clients-updated', connectedClients);
  });


  // 2. Targeted Deployment (Podcast a specific JSON component to ONE device)
  socket.on('deployment_request', async (data: { screenId: string, media: any }) => {
    console.log(`[PODCAST] Deploying Component to Screen: ${data.screenId}`);

    // Find the socket ID belonging to the targeted Screen ID
    const targetClient = connectedClients.find(c => c.screenId === data.screenId && c.type === 'android');

    if (targetClient) {
      let payload = data.media;
      if (payload.type === 'video' && payload.content && payload.content.startsWith('http://localhost')) {
        try {
          // Extract the filename from the URL
          const fileName = payload.content.split('/').pop();
          const filePath = path.join(__dirname, '../uploads', fileName);
          if (fs.existsSync(filePath)) {
            const fileBuffer = fs.readFileSync(filePath);
            const base64 = fileBuffer.toString('base64');
            payload = {
              ...payload,
              content: base64,
              encoding: 'base64',
              fileName,
              mimeType: 'video/mp4', // or detect from file extension
            };
          }
        } catch (e) {
          console.error('Failed to read video file for broadcast:', e);
        }
      }
      // Forward as-is, but use a different event for playlist JSON and design JSON
      if (payload.type === 'playlist-json' || payload.type === 'design-json') {
        io.to(targetClient.socketId).emit('mobile-design-json', payload);
        console.log(`[PODCAST] Successfully relayed PLAYLIST/DESIGN JSON to socket: ${targetClient.socketId}`);
      } else {
        io.to(targetClient.socketId).emit('mobile-video', payload);
        console.log(`[PODCAST] Successfully relayed VIDEO to socket: ${targetClient.socketId}`);
      }
    } else {
      console.warn(`[PODCAST] Target ${data.screenId} is not currently connected.`);
    }
  });

  // 3. Broadcast to ALL devices (Emergency or Global announcements)
  socket.on('broadcast_all', async (data: { media: any }) => {
    console.log(`[BROADCAST] Sending component to all connected Android screens`);
    const androidClients = connectedClients.filter(c => c.type === 'android');
    let payload = data.media;
    // If it's a video and the content is a local file URL, send the file as base64
    if (payload.type === 'video' && payload.content && payload.content.startsWith('http://localhost')) {
      try {
        const fileName = payload.content.split('/').pop();
        const filePath = path.join(__dirname, '../uploads', fileName);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          const base64 = fileBuffer.toString('base64');
          payload = {
            ...payload,
            content: base64,
            encoding: 'base64',
            fileName,
            mimeType: 'video/mp4',
          };
        }
      } catch (e) {
        console.error('Failed to read video file for broadcast:', e);
      }
    }
    // If already base64, just forward as-is
    androidClients.forEach(client => {
      io.to(client.socketId).emit('mobile-video', payload);
    });
  });

  // 4. Handle Disconnect
  socket.on('disconnect', () => {
    const disconnectedClient = connectedClients.find(c => c.socketId === socket.id);

    if (disconnectedClient) {
      console.log(`[Socket.IO] ${disconnectedClient.type} disconnected: ${socket.id}`);

      // If it was an active screen, notify Dashboard to flip status to OFFLINE
      if (disconnectedClient.type === 'android' && disconnectedClient.screenId) {
        io.emit('screen_status_change', {
          screenId: disconnectedClient.screenId,
          status: 'offline'
        });
      }

      // Remove from memory
      connectedClients = connectedClients.filter(c => c.socketId !== socket.id);

      // Update Dashboard client counters
      io.emit('clients-updated', connectedClients);
    }
  });
});

// --- EXPRESS ROUTES (Important: DO NOT REMOVE) ---

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
    res.status(200).json({ collaborators: session ? session.users : [] });
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
    designs.set(designId, {
      ...req.body,
      id: designId,
      lastModified: new Date().toISOString(),
    });
    res.status(200).json({ id: designId, message: 'Design saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Save failed' });
  }
});

/**
 * Share design
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

// Listen on HTTP Server for Socket.IO
httpServer.listen(SOCKET_PORT, () => {
  console.log(`🚀 Socket.IO Server listening on *:${SOCKET_PORT}`);
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`✅ Express API Server running on http://localhost:${PORT}`);
});

export default app;