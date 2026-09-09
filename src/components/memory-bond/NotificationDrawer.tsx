import { useState } from "react";
import {
  Bell,
  X,
  AlertTriangle,
  AlertOctagon,
  Calendar,
  Pill,
  CheckCircle2,
  Check,
  Clock,
  Volume2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore, AppNotification } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText, stopSpeaking } from "@/lib/voiceParser";

export function NotificationDrawer({
  isOpen,
  onClose,
  store,
}: {
  isOpen: boolean;
  onClose: () => void;
  store: MemoryBondStore;
}) {
  const { speechLocale } = useI18n();
  const [showOnlyUnread, setShowOnlyUnread] = useState<boolean>(false);

  if (!isOpen) return null;

  const getCategoryIcon = (category: AppNotification["category"]) => {
    switch (category) {
      case "sos":
        return <AlertOctagon className="h-5 w-5 text-destructive" />;
      case "medicine_low":
      case "medicine_missed":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case "medicine_due":
        return <Pill className="h-5 w-5 text-teal-600" />;
      case "appointment":
        return <Calendar className="h-5 w-5 text-blue-600" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  const handleSpeakNotification = (e: React.MouseEvent, notif: AppNotification) => {
    e.stopPropagation();
    stopSpeaking();
    speakText(`${notif.title}. ${notif.body}`, speechLocale || "en-IN");
  };

  const unreadCount = store.notifications.filter((n) => !n.read).length;
  const displayedNotifications = showOnlyUnread
    ? store.notifications.filter((n) => !n.read)
    : store.notifications;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-card border-l-2 border-border h-full shadow-2xl p-6 flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-extrabold text-foreground">Notification Center</h3>
              {unreadCount > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                className={`px-2.5 py-1 rounded-full font-bold transition-all ${
                  showOnlyUnread
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {showOnlyUnread ? "Showing Unread" : "Show Unread Only"}
              </button>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => store.markAllNotificationsRead()}
                className="text-primary font-bold hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto space-y-3 py-4 my-2">
          {displayedNotifications.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 font-medium">
              {showOnlyUnread ? "No unread notifications." : "No notifications at this moment."}
            </div>
          ) : (
            displayedNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => store.markNotificationRead(notif.id)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                  notif.read
                    ? "bg-secondary/20 border-border opacity-75"
                    : "bg-card border-primary/40 shadow-xs"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(notif.category)}
                    <h4 className="font-bold text-sm text-foreground">{notif.title}</h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleSpeakNotification(e, notif)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary"
                      title="Read aloud notification"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                    {!notif.read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  {notif.body}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80 font-mono">
                  <Clock className="h-3 w-3" />
                  <span>
                    {new Date(notif.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border">
          <Button onClick={onClose} className="w-full font-bold rounded-2xl h-12">
            Close Panel
          </Button>
        </div>
      </div>
    </div>
  );
}
