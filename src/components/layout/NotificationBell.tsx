"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Check, ExternalLink, Inbox } from "lucide-react";
import { subscribeToNotifications, markNotificationAsRead } from "@/lib/db/notifications";
import { AppNotification } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToNotifications((newNotifications) => {
      // Logic for unread count
      const unread = newNotifications.filter(n => !n.readBy.includes(user.uid)).length;
      
      // If unread count increases, show a toast for the newest one
      if (unread > unreadCount && newNotifications.length > 0) {
        const latest = newNotifications[0];
        if (!latest.readBy.includes(user.uid)) {
          toast.info(`${latest.creatorName}: ${latest.message}`, {
            action: {
              label: "View",
              onClick: () => {
                handleNotificationClick(latest);
              }
            }
          });
        }
      }
      
      setUnreadCount(unread);
      setNotifications(newNotifications);
    });

    return () => unsubscribe();
  }, [user, unreadCount]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: AppNotification) => {
    if (user) {
      await markNotificationAsRead(notif.id, user.uid);
    }
    setIsOpen(false);
    if (notif.targetTab) {
      router.push(notif.targetTab);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unreadNotifs = notifications.filter(n => !n.readBy.includes(user.uid));
    await Promise.all(unreadNotifs.map(n => markNotificationAsRead(n.id, user.uid)));
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
        aria-label="Notifications"
      >
        <Bell size={22} className={unreadCount > 0 ? "animate-wiggle" : ""} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 lg:left-0 lg:right-auto mt-3 w-80 lg:w-96 max-w-[calc(100vw-2rem)] rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 z-[999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-800"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="bg-slate-100 p-3 rounded-full text-slate-400 mb-3">
                  <Inbox size={24} />
                </div>
                <p className="text-sm text-slate-500 font-medium">No recent notifications</p>
                <p className="text-[10px] text-slate-400">Activity will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((notif) => {
                  const isRead = user && notif.readBy.includes(user.uid);
                  return (
                    <div
                      key={notif.id}
                      className={`w-full flex gap-4 px-6 py-4 text-left hover:bg-slate-50 transition-colors group/notif relative ${!isRead ? "bg-indigo-50/30" : ""}`}
                    >
                      <div className="flex flex-col justify-start pt-1">
                        {!isRead && user ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markNotificationAsRead(notif.id, user.uid);
                            }}
                            className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-700 transition-all shadow-sm active:scale-90"
                            title="Mark as read"
                          >
                            <Check size={14} strokeWidth={3} />
                          </button>
                        ) : (
                          <div className="w-6 h-6 flex items-center justify-center text-slate-300">
                             <Check size={14} />
                          </div>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => handleNotificationClick(notif)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {notif.creatorName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium shrink-0">
                            {notif.createdAt ? formatDistanceToNow(notif.createdAt, { addSuffix: true }) : 'just now'}
                          </p>
                        </div>
                        <p className={`text-sm leading-relaxed ${!isRead ? "text-slate-900 font-medium" : "text-slate-500"}`}>
                          {notif.message}
                        </p>
                        
                        {notif.targetTab && (
                          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                            <ExternalLink size={10} />
                            <span>View details</span>
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 text-center">
             <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Real-time alerts active</p>
          </div>
        </div>
      )}
    </div>
  );
}
