'use client';

import { useState, useEffect, useRef } from 'react';
import { api, NotificationItem } from '@/lib/api';

type Notification = NotificationItem;

interface NotificationCenterProps {
  userId?: string;
  partnerId?: string;
  recipientType: 'student' | 'partner' | 'admin';
}

export default function NotificationCenter({
  userId,
  partnerId,
  recipientType,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const loadNotifications = async () => {
    if (!api.hasToken()) return;
    try {
      setLoading(true);
      const res = await api.getNotifications();
      if (res?.notifications) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unread.length === 0) return;
    try {
      await api.markNotificationsRead(unread, true);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const markRead = async (id: string) => {
    try {
      await api.markNotificationsRead([id], false);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId, partnerId]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const getIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      subscription_confirmed: (
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-4 h-4 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      ),
      redemption_confirmed: (
        <div className="w-8 h-8 rounded-full bg-[#3ECBA0]/15 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-4 h-4 text-[#3ECBA0]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
      ),
      settlement_paid: (
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-4 h-4 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      ),
    };
    return (
      icons[type] || (
        <div className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
          <svg
            className="w-4 h-4 text-[#6B7280]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
      )
    );
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) loadNotifications();
        }}
        className="relative p-2 rounded-xl text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#E5E7EB] z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#F3F4F6] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Notifications</h3>
              {unreadCount > 0 && <p className="text-xs text-[#9CA3AF]">{unreadCount} unread</p>}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[#3ECBA0] font-semibold hover:text-[#2DAF87] transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 rounded-full border-2 border-[#3ECBA0] border-t-transparent animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center mb-2">
                  <svg
                    className="w-5 h-5 text-[#9CA3AF]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[#374151]">All caught up!</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#F9FAFB] transition-colors border-b border-[#F3F4F6] last:border-0 ${!n.is_read ? 'bg-[#F0FDF9]' : ''}`}
                >
                  {getIcon(n.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-xs font-semibold leading-tight ${!n.is_read ? 'text-[#111827]' : 'text-[#374151]'}`}
                      >
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#3ECBA0] flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                    <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-[#9CA3AF] mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
