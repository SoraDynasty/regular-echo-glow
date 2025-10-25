import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import MobileNav from "@/components/MobileNav";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  isFollowing?: boolean;
};

const Chat = () => {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friends, setFriends] = useState<Profile[]>([]);
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
    loadFriends(session.user.id);
  };

  const loadFriends = async (userId: string) => {
    setLoading(true);
    try {
      // Get users that the current user is following
      const { data: follows, error: followsError } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId);

      if (followsError) throw followsError;

      if (follows && follows.length > 0) {
        const followingIds = follows.map(f => f.following_id);
        
        // Get profiles of followed users
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .in("id", followingIds)
          .eq("account_type", "regulus");

        if (profilesError) throw profilesError;
        setFriends(profiles || []);
      } else {
        setFriends([]);
      }
    } catch (error: any) {
      toast.error("Failed to load friends");
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(friend =>
    searchQuery === "" ||
    friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="safe-area-top px-4 py-4 border-b border-border/50">
        <h1 className="text-2xl font-bold text-center mb-4">Chats</h1>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-2xl"
          />
        </div>
      </header>

      {/* Friends List */}
      <main className="px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No chats yet</h3>
            <p className="text-sm text-muted-foreground">
              Follow friends to start chatting!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-3 p-4 glass-card rounded-2xl hover-scale cursor-pointer active:scale-95 transition-transform"
                onClick={() => toast.info("Chat feature coming soon!")}
              >
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full flex items-center justify-center gradient-regulus border-2 border-border flex-shrink-0">
                  <Sparkles className="w-7 h-7" />
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{friend.username}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    Tap to chat
                  </p>
                </div>

                {/* Unread Badge (placeholder) */}
                <div className="w-2 h-2 rounded-full bg-primary opacity-0" />
              </div>
            ))}
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
};

export default Chat;
