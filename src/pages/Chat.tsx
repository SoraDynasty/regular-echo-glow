import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Send, Sparkles, Brain } from "lucide-react";
import { toast } from "sonner";
import MobileNav from "@/components/MobileNav";
import { Button } from "@/components/ui/button";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

interface ConversationPreview {
  recipientId: string;
  recipient: Profile;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const Chat = () => {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setCurrentUserId(session.user.id);
    await Promise.all([
      loadFriends(session.user.id),
      loadConversations(session.user.id)
    ]);
  };

  const loadFriends = async (userId: string) => {
    try {
      const { data: follows, error: followsError } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId);

      if (followsError) throw followsError;

      if (follows && follows.length > 0) {
        const followingIds = follows.map(f => f.following_id);
        
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, bio")
          .in("id", followingIds);

        if (profilesError) throw profilesError;
        setFriends(profiles || []);
      } else {
        setFriends([]);
      }
    } catch (error: any) {
      console.error("Failed to load friends:", error);
    }
  };

  const loadConversations = async (userId: string) => {
    setLoading(true);
    try {
      // Get all messages for the user
      const { data: messages, error } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by conversation partner
      const conversationMap = new Map<string, { lastMessage: any; unreadCount: number }>();
      
      messages?.forEach((msg) => {
        const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            lastMessage: msg,
            unreadCount: msg.receiver_id === userId && !msg.read ? 1 : 0
          });
        } else {
          const existing = conversationMap.get(partnerId)!;
          if (msg.receiver_id === userId && !msg.read) {
            existing.unreadCount++;
          }
        }
      });

      // Fetch profiles for conversation partners
      const partnerIds = Array.from(conversationMap.keys());
      
      if (partnerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, bio")
          .in("id", partnerIds);

        const conversationPreviews: ConversationPreview[] = [];
        
        partnerIds.forEach((partnerId) => {
          const profile = profiles?.find(p => p.id === partnerId);
          const conv = conversationMap.get(partnerId)!;
          
          if (profile) {
            conversationPreviews.push({
              recipientId: partnerId,
              recipient: profile,
              lastMessage: conv.lastMessage.content,
              lastMessageTime: conv.lastMessage.created_at,
              unreadCount: conv.unreadCount
            });
          }
        });

        setConversations(conversationPreviews);
      }
    } catch (error: any) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  const filteredFriends = friends.filter(friend =>
    !conversations.some(c => c.recipientId === friend.id) &&
    (searchQuery === "" ||
      friend.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredConversations = conversations.filter(conv =>
    searchQuery === "" ||
    conv.recipient.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/30">
        <div className="safe-area-top" />
        <div className="px-4 py-3">
          <h1 className="text-2xl font-bold text-center mb-3">Messages</h1>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>

          {/* Ellie Research Button */}
          <Button
            onClick={() => navigate("/ellie-research")}
            className="w-full mt-3 h-12 gap-2 bg-ellie-primary hover:bg-ellie-primary/90"
          >
            <Brain className="w-5 h-5" />
            Ellie Research
          </Button>
        </div>
      </header>

      <main className="px-4 py-4 pb-28">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Conversations */}
            {filteredConversations.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">Recent</h2>
                <div className="space-y-2">
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv.recipientId}
                      className="flex items-center gap-3 p-4 glass-card rounded-2xl hover-scale cursor-pointer active:scale-95 transition-transform"
                      onClick={() => navigate(`/dm/${conv.recipientId}`)}
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center gradient-regulus border-2 border-border flex-shrink-0">
                        <Sparkles className="w-6 h-6" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold truncate">{conv.recipient.username}</h3>
                          <span className="text-xs text-muted-foreground">{formatTimeAgo(conv.lastMessageTime)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                      </div>

                      {conv.unreadCount > 0 && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-xs text-primary-foreground font-bold">{conv.unreadCount}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Start New Chat */}
            {filteredFriends.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">Start a conversation</h2>
                <div className="space-y-2">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-3 p-4 glass-card rounded-2xl hover-scale cursor-pointer active:scale-95 transition-transform"
                      onClick={() => navigate(`/dm/${friend.id}`)}
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center gradient-regulus border-2 border-border flex-shrink-0">
                        <Sparkles className="w-6 h-6" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{friend.username}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {friend.bio || "Tap to message"}
                        </p>
                      </div>

                      <Send className="w-5 h-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredConversations.length === 0 && filteredFriends.length === 0 && (
              <div className="text-center py-12">
                <Send className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                <p className="text-sm text-muted-foreground">
                  Start observing people to message them
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
};

export default Chat;
