import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

type MessageType =
  | 'clients-updated'
  | 'screen_connected'
  | 'screen_disconnected'
  | 'screen_status_update'
  | 'playlist_assigned'
  | 'screen_created'
  | 'screen_deleted'
  | 'heartbeat'
  | 'deployment_request'
  | 'mobile-video';

interface WebSocketMessage {
  type: MessageType;
  screenId?: string;
  screenCustomId?: string;
  data?: any;
  timestamp: number;
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: Socket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private heartbeatInterval: number | null = null;
  private isConnecting = false;
  private _connected = false;

  constructor() {
    this.connect();
  }

  public get isWsConnected(): boolean {
    return this.ws?.connected || false;
  }

  connect() {
    if (this.isConnecting || (this.ws && this.ws.connected)) return;
    this.isConnecting = true;

    this.ws = io(SOCKET_URL, { transports: ['websocket'] });

    this.ws.on('connect', () => {
      console.log('✅ Connected to Socket.IO');
      this._connected = true;
      this.ws?.emit('register-device', { type: 'dashboard' });
      this.onOpen();
      this.broadcast({ type: 'heartbeat', timestamp: Date.now() });
    });

    this.ws.on('clients-updated', (list: any[]) => {
      this.broadcast({
        type: 'clients-updated',
        data: list,
        timestamp: Date.now(),
      });
    });

    this.ws.on('screen_status_change', (data: { screenId: string, status: 'online' | 'offline' }) => {
      this.broadcast({
        type: 'screen_status_update',
        screenId: data.screenId,
        data: { status: data.status },
        timestamp: Date.now()
      });
    });

    this.ws.on('disconnect', () => {
      this._connected = false;
      this.onClose();
    });
  }

  private onOpen() {
    this.startHeartbeat();
  }

  private onClose() {
    this.stopHeartbeat();
  }

  private startHeartbeat() {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws?.connected) {
        this.send({ type: 'heartbeat', timestamp: Date.now() });
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
  }

  send(message: WebSocketMessage) {
    if (this.ws?.connected) {
      this.ws.emit(message.type, message);
    }
  }

  subscribe(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    if (this.isWsConnected) {
      handler({ type: 'heartbeat', timestamp: Date.now() });
    }
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  private broadcast(message: WebSocketMessage) {
    this.messageHandlers.forEach(handler => handler(message));
  }

  emitDeploymentRequest(screenId: string, mediaData: any) {
    if (this.ws?.connected) {
      console.log(`🚀 Deploying component to ${screenId}`);
      this.ws.emit('deployment_request', {
        screenId,
        media: mediaData
      });
    }
  }

  broadcastToAll(mediaData: any) {
    if (this.ws?.connected) {
      this.ws.emit('broadcast_all', { media: mediaData });
    }
  }

  notifyScreenCreated(screenId: string, screenCustomId: string) {
    this.send({ type: 'screen_created', screenId, screenCustomId, timestamp: Date.now() });
  }

  notifyScreenDeleted(screenId: string) {
    this.send({ type: 'screen_deleted', screenId, timestamp: Date.now() });
  }

  notifyScreenStatusUpdate(screenId: string, status: 'online' | 'offline') {
    this.send({ type: 'screen_status_update', screenId, data: { status }, timestamp: Date.now() });
  }
}

const websocketService = new WebSocketService();
export default websocketService;
export type { WebSocketMessage, MessageHandler };