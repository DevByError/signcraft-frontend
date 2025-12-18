/**
 * WebSocket Service
 * Manages real-time communication for screen status updates
 */

type MessageType = 
  | 'screen_connected'
  | 'screen_disconnected'
  | 'screen_status_update'
  | 'playlist_assigned'
  | 'screen_created'
  | 'screen_deleted'
  | 'heartbeat';

interface WebSocketMessage {
  type: MessageType;
  screenId?: string;
  screenCustomId?: string;
  data?: any;
  timestamp: number;
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private messageHandlers: Set<MessageHandler> = new Set();
  private heartbeatInterval: number | null = null;
  private isConnecting = false;
  private shouldReconnect = true;

  constructor() {
    this.connect();
  }

  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      // For development, use a mock WebSocket server
      // In production, replace with your actual WebSocket server URL
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
      
      console.log('🔌 [WebSocket] Connecting to:', wsUrl);
      
      // Create mock WebSocket for development
      this.createMockWebSocket();
      
      this.isConnecting = false;
    } catch (error) {
      console.error('❌ [WebSocket] Connection error:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  private createMockWebSocket() {
    // Mock WebSocket for development
    console.log('🔌 [WebSocket] Using mock WebSocket (development mode)');
    
    // Simulate connection open
    setTimeout(() => {
      console.log('✅ [WebSocket] Mock connection opened');
      this.onOpen();
    }, 100);

    // Mock WebSocket object
    this.ws = {
      readyState: WebSocket.OPEN,
      send: (data: string) => {
        console.log('📤 [WebSocket] Mock send:', data);
      },
      close: () => {
        console.log('🔌 [WebSocket] Mock connection closed');
        this.onClose();
      },
      addEventListener: () => {},
      removeEventListener: () => {},
    } as any;
  }

  private onOpen() {
    console.log('✅ [WebSocket] Connected');
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    
    // Notify handlers of connection
    this.broadcast({
      type: 'heartbeat',
      timestamp: Date.now(),
    });
  }

  private onMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log('📨 [WebSocket] Received:', message);
      this.broadcast(message);
    } catch (error) {
      console.error('❌ [WebSocket] Error parsing message:', error);
    }
  }

  private onError(error: Event) {
    console.error('❌ [WebSocket] Error:', error);
  }

  private onClose() {
    console.log('🔌 [WebSocket] Connection closed');
    this.stopHeartbeat();
    
    if (this.shouldReconnect) {
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 [WebSocket] Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('❌ [WebSocket] Max reconnection attempts reached');
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'heartbeat',
          timestamp: Date.now(),
        });
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      console.log('📤 [WebSocket] Sent:', message);
    } else {
      console.warn('⚠️ [WebSocket] Cannot send, connection not open');
    }
  }

  subscribe(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    console.log('➕ [WebSocket] Handler subscribed, total:', this.messageHandlers.size);
    
    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler);
      console.log('➖ [WebSocket] Handler unsubscribed, total:', this.messageHandlers.size);
    };
  }

  private broadcast(message: WebSocketMessage) {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('❌ [WebSocket] Error in message handler:', error);
      }
    });
  }

  disconnect() {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    console.log('🔌 [WebSocket] Disconnected');
  }

  // Screen-specific methods
  notifyScreenConnected(screenId: string, screenCustomId: string) {
    this.send({
      type: 'screen_connected',
      screenId,
      screenCustomId,
      timestamp: Date.now(),
    });
  }

  notifyScreenDisconnected(screenId: string, screenCustomId: string) {
    this.send({
      type: 'screen_disconnected',
      screenId,
      screenCustomId,
      timestamp: Date.now(),
    });
  }

  notifyScreenStatusUpdate(screenId: string, status: 'online' | 'offline') {
    this.send({
      type: 'screen_status_update',
      screenId,
      data: { status },
      timestamp: Date.now(),
    });
  }

  notifyPlaylistAssigned(screenId: string, playlistId: string, playlistName: string) {
    this.send({
      type: 'playlist_assigned',
      screenId,
      data: { playlistId, playlistName },
      timestamp: Date.now(),
    });
  }

  notifyScreenCreated(screenId: string, screenCustomId: string) {
    this.send({
      type: 'screen_created',
      screenId,
      screenCustomId,
      timestamp: Date.now(),
    });
  }

  notifyScreenDeleted(screenId: string) {
    this.send({
      type: 'screen_deleted',
      screenId,
      timestamp: Date.now(),
    });
  }

  // Simulate screen status changes (for development)
  simulateScreenActivity() {
    setInterval(() => {
      // Random screen status updates for demo
      const statuses: ('online' | 'offline')[] = ['online', 'offline'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      this.broadcast({
        type: 'screen_status_update',
        screenId: `scr${String(Math.floor(Math.random() * 10) + 1).padStart(2, '0')}`,
        data: { status: randomStatus },
        timestamp: Date.now(),
      });
    }, 10000); // Every 10 seconds
  }
}

// Singleton instance
const websocketService = new WebSocketService();

// Start simulation for development
if (import.meta.env.DEV) {
  setTimeout(() => {
    websocketService.simulateScreenActivity();
  }, 5000);
}

export default websocketService;
export type { WebSocketMessage, MessageHandler };
