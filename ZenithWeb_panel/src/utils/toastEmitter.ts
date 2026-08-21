export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

type ToastListener = (toast: ToastItem) => void;

class ToastEmitter {
  private listeners: Set<ToastListener> = new Set();

  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public show(message: string, type: ToastType = 'info', duration = 3800): void {
    const toast: ToastItem = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      message,
      type,
      duration
    };
    // Defer listener execution to macrotask queue to prevent React state update during render phase
    setTimeout(() => {
      this.listeners.forEach((listener) => {
        try {
          listener(toast);
        } catch (err) {
          console.error('Error in toast listener', err);
        }
      });
    }, 0);
  }

  public success(message: string, duration = 3800): void {
    this.show(message, 'success', duration);
  }

  public error(message: string, duration = 4500): void {
    this.show(message, 'error', duration);
  }

  public info(message: string, duration = 3800): void {
    this.show(message, 'info', duration);
  }

  public warning(message: string, duration = 4000): void {
    this.show(message, 'warning', duration);
  }
}

export const toast = new ToastEmitter();
