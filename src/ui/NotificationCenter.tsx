/**
 * Social Gravity - Notification Center
 * Shows live alerts, replay milestones, connector status, and export completions.
 */

import React, { useState, useCallback, useEffect } from "react";
import { Bell, X, CheckCircle, AlertTriangle, Info, Wifi, Download } from "lucide-react";

export type NotificationType = "info" | "success" | "warning" | "error" | "connector" | "export";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  autoClose?: number; // ms, 0 = manual close only
}

let globalEmit: ((n: Omit<Notification, "id" | "timestamp">) => void) | null = null;

export function emitNotification(n: Omit<Notification, "id" | "timestamp">): void {
  globalEmit?.(n);
}

function iconFor(type: NotificationType): React.ReactNode {
  switch (type) {
    case "success": return <CheckCircle className="w-4 h-4 text-green-400" />;
    case "warning": return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    case "error":   return <AlertTriangle className="w-4 h-4 text-red-400" />;
    case "connector": return <Wifi className="w-4 h-4 text-blue-400" />;
    case "export":  return <Download className="w-4 h-4 text-purple-400" />;
    default:        return <Info className="w-4 h-4 text-slate-400" />;
  }
}

function colorFor(type: NotificationType): string {
  switch (type) {
    case "success": return "border-green-500/30 bg-green-500/10";
    case "warning": return "border-yellow-500/30 bg-yellow-500/10";
    case "error":   return "border-red-500/30 bg-red-500/10";
    case "connector": return "border-blue-500/30 bg-blue-500/10";
    case "export":  return "border-purple-500/30 bg-purple-500/10";
    default:        return "border-slate-500/30 bg-[var(--surface)]";
  }
}

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((n: Omit<Notification, "id" | "timestamp">) => {
    const note: Notification = {
      ...n,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    };
    setNotifications(prev => [note, ...prev].slice(0, 50));
    setUnreadCount(c => c + 1);

    if (n.autoClose && n.autoClose > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(x => x.id !== note.id));
      }, n.autoClose);
    }
  }, []);

  useEffect(() => {
    globalEmit = addNotification;
    return () => { globalEmit = null; };
  }, [addNotification]);

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setIsOpen(o => !o); setUnreadCount(0); }}
        className="relative p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
        title="Notification Center (Ctrl+N)"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-bold bg-red-500 text-white rounded-full px-0.5">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-2xl z-50 text-[var(--text)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <span className="text-sm font-semibold text-[var(--text)]">Notifications</span>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text)] cursor-pointer">Clear all</button>
              )}
              <button onClick={() => setIsOpen(false)} className="cursor-pointer"><X className="w-4 h-4 text-[var(--text-tertiary)] hover:text-[var(--text)]" /></button>
            </div>
          </div>
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-[var(--text-tertiary)] text-sm">No notifications</div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {notifications.map(n => (
                <div key={n.id} className={`flex gap-3 p-3 border-l-2 ${colorFor(n.type)}`}>
                  <div className="mt-0.5 shrink-0">{iconFor(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[var(--text)] truncate">{n.title}</div>
                    <div className="text-[10px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">{n.message}</div>
                    <div className="text-[9px] text-[var(--text-tertiary)] mt-1">{new Date(n.timestamp).toLocaleTimeString()}</div>
                  </div>
                  <button onClick={() => dismiss(n.id)} className="shrink-0 mt-0.5 text-[var(--text-tertiary)] hover:text-[var(--text)] cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
