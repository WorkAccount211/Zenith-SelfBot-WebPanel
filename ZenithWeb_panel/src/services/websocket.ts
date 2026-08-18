import { LogEntry } from '../types/bot';
import { toast } from '../utils/toastEmitter';

export type WebSocketStatus = 'connected' | 'connecting' | 'disconnected' | 'simulated';

type LogCallback = (log: LogEntry) => void;
type StatusCallback = (status: WebSocketStatus) => void;
type MessageCallback = (data: any) => void;

const SIMULATED_LOG_TEMPLATES: Array<{
  level: LogEntry['level'];
  message: string | (() => string);
  source: string;
}> = [
  {
    level: 'DEBUG',
    message: () => `Gateway heartbeat acknowledged (seq: ${Math.floor(4000 + Math.random() * 2000)}, rtt: ${Math.floor(22 + Math.random() * 15)}ms)`,
    source: 'gateway'
  },
  {
    level: 'COMMAND',
    message: () => {
      const cmds = ['.ping', '.purge 5', '.say 🔥 Active', '.afk BRB 5m', '.userinfo', '.stats'];
      const cmd = cmds[Math.floor(Math.random() * cmds.length)];
      return `User executed command: ${cmd} (Latency: ${Math.floor(20 + Math.random() * 25)}ms)`;
    },
    source: 'commands'
  },
  {
    level: 'INFO',
    message: () => `Presences cache updated: ${Math.floor(8400 + Math.random() * 50)} members online across 14 guilds`,
    source: 'cache'
  },
  {
    level: 'DEBUG',
    message: () => `Message queue dispatched ${Math.floor(1 + Math.random() * 4)} items without rate-limit delay`,
    source: 'http'
  },
  {
    level: 'WARN',
    message: () => `Discord REST rate limit approaching bucket (reset in ${(0.3 + Math.random() * 0.4).toFixed(2)}s)`,
    source: 'rate_limiter'
  },
  {
    level: 'INFO',
    message: () => `Websocket frame processed: GUILD_MEMBER_UPDATE [user_id: 920194820194820194]`,
    source: 'discord'
  },
  {
    level: 'COMMAND',
    message: () => `Automated clean-up completed: 3 cached message objects freed`,
    source: 'cleanup'
  }
];

class BotWebSocketService {
  private socket: WebSocket | null = null;
  private logListeners: Set<LogCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private messageListeners: Set<MessageCallback> = new Set();
  private status: WebSocketStatus = 'disconnected';
  private currentApiUrl = 'http://localhost:8080';
  private currentPassword = 'GGEZ';
  private reconnectTimer: any = null;
  private simulationInterval: any = null;
  private isPaused = false;
  private candidateWsPaths = ['/ws', '/ws/logs', '/'];
  private candidateIndex = 0;

  constructor() {
    // constructor
  }

  public getStatus(): WebSocketStatus {
    return this.status;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
  }

  public onLog(callback: LogCallback): () => void {
    this.logListeners.add(callback);
    return () => {
      this.logListeners.delete(callback);
    };
  }

  public onStatusChange(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public onMessage(callback: MessageCallback): () => void {
    this.messageListeners.add(callback);
    return () => {
      this.messageListeners.delete(callback);
    };
  }

  private updateStatus(newStatus: WebSocketStatus): void {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.statusListeners.forEach((fn) => {
      try {
        fn(newStatus);
      } catch (err) {
        console.error('Status listener error', err);
      }
    });
  }

  public connect(apiUrl: string, password = 'GGEZ'): void {
    this.currentApiUrl = apiUrl;
    this.currentPassword = password;
    this.cleanup();

    this.updateStatus('connecting');
    this.tryConnectCandidate();
  }

  private tryConnectCandidate(): void {
    let base = this.currentApiUrl.replace(/^http/, 'ws').replace(/\/+$/, '');
    const path = this.candidateWsPaths[this.candidateIndex % this.candidateWsPaths.length];
    const fullWsUrl = `${base}${path}`;

    try {
      this.socket = new WebSocket(fullWsUrl);

      const connectTimeout = setTimeout(() => {
        if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
          try {
            this.socket.close();
          } catch {}
          this.candidateIndex++;
          this.fallbackToSimulation();
          this.scheduleReconnect();
        }
      }, 2200);

      this.socket.onopen = () => {
        clearTimeout(connectTimeout);
        this.updateStatus('connected');
        toast.success(`WebSocket подключен к ${fullWsUrl}`, 2500);

        if (this.simulationInterval) {
          clearInterval(this.simulationInterval);
          this.simulationInterval = null;
        }

        // Send authentication handshake
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({
            type: 'auth',
            password: this.currentPassword,
            client: 'discord-web-panel'
          }));
        }
      };

      this.socket.onmessage = (event) => {
        if (this.isPaused) return;

        try {
          const data = JSON.parse(event.data);

          // Broadcast raw parsed data to all general message listeners
          this.messageListeners.forEach((fn) => {
            try {
              fn(data);
            } catch (e) {
              console.error('Message listener error', e);
            }
          });

          // If it contains a log message or event
          if (data && (data.message || data.text || data.log)) {
            const entry: LogEntry = {
              id: data.id || `ws-log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              timestamp: data.timestamp || new Date().toLocaleTimeString('ru-RU'),
              level: data.level || (data.type === 'error' ? 'ERROR' : data.type === 'warn' ? 'WARN' : 'INFO'),
              message: data.message || data.text || data.log,
              source: data.source || 'bot'
            };
            this.broadcastLog(entry);
          }
        } catch {
          // Plain text log message
          const entry: LogEntry = {
            id: `ws-log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('ru-RU'),
            level: 'INFO',
            message: String(event.data),
            source: 'stream'
          };
          this.broadcastLog(entry);
        }
      };

      this.socket.onerror = () => {
        clearTimeout(connectTimeout);
        this.candidateIndex++;
        this.fallbackToSimulation();
        this.scheduleReconnect();
      };

      this.socket.onclose = () => {
        clearTimeout(connectTimeout);
        if (this.status === 'connected') {
          toast.warning('WebSocket бота отключен. Ожидание перезапуска...', 3000);
        }
        this.fallbackToSimulation();
        this.scheduleReconnect();
      };
    } catch {
      this.candidateIndex++;
      this.fallbackToSimulation();
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.status !== 'connected') {
        this.tryConnectCandidate();
      }
    }, 4000);
  }

  public send(data: any): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    }
    return false;
  }

  private fallbackToSimulation(): void {
    if (this.status === 'simulated') return;
    this.updateStatus('simulated');
    this.startSimulationStream();
  }

  private startSimulationStream(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }

    this.simulationInterval = setInterval(() => {
      if (this.isPaused || this.status !== 'simulated') return;

      const template = SIMULATED_LOG_TEMPLATES[Math.floor(Math.random() * SIMULATED_LOG_TEMPLATES.length)];
      const msg = typeof template.message === 'function' ? template.message() : template.message;

      const newLog: LogEntry = {
        id: `sim-ws-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleTimeString('ru-RU'),
        level: template.level,
        message: msg,
        source: template.source
      };

      this.broadcastLog(newLog);
    }, 3200);
  }

  private broadcastLog(log: LogEntry): void {
    this.logListeners.forEach((listener) => {
      try {
        listener(log);
      } catch (err) {
        console.error('Log listener error', err);
      }
    });
  }

  public disconnect(): void {
    this.cleanup();
    this.updateStatus('disconnected');
  }

  private cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }
  }
}

export const botWebSocket = new BotWebSocketService();
