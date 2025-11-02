import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, MessageCircle, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import LoadingAnimation from "@/components/LoadingAnimation";

interface Notification {
  id: string;
  type: string;
  content: string;
  read: boolean;
  created_at: string;
  related_user_id: string | null;
}

interface NotificationListProps {
  onNotificationRead: () => void;
}

const NotificationList = ({ onNotificationRead }: NotificationListProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    onNotificationRead();
    loadNotifications();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'reaction':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'follow':
        return <User className="w-4 h-4 text-green-500" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <LoadingAnimation />;
  }

  if (notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No notifications yet
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-120px)] mt-4">
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            onClick={() => !notification.read && markAsRead(notification.id)}
            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
              !notification.read 
                ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' 
                : 'bg-card hover:bg-accent'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">{getIcon(notification.type)}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                  {notification.content}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default NotificationList;
