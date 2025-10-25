import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Share2, Sparkles, Ghost as GhostIcon } from "lucide-react";
import { toast } from "sonner";
import MobileNav from "@/components/MobileNav";
import { haptics } from "@/lib/haptics";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const Friends = () => {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadUsers();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setCurrentUserId(session.user.id);
    
    // Load following list
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", session.user.id);
    
    if (follows) {
      setFollowing(new Set(follows.map(f => f.following_id)));
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("account_type", "regulus")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!currentUserId) return;
    
    haptics.light();
    
    try {
      if (following.has(userId)) {
        // Unfollow
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", userId);
        
        setFollowing(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        toast.success("Unfollowed");
      } else {
        // Follow
        await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: userId });
        
        setFollowing(prev => new Set(prev).add(userId));
        haptics.success();
        toast.success("Following!");
      }
    } catch (error: any) {
      toast.error("Action failed");
    }
  };

  const handleInviteFriends = () => {
    haptics.medium();
    
    const shareText = "Join me on Regulargram! 📸✨\n\nShare your authentic moments with friends.\n\n";
    const shareUrl = window.location.origin;
    
    if (navigator.share) {
      navigator.share({
        title: "Join Regulargram",
        text: shareText,
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText + shareUrl);
      toast.success("Invite link copied!");
    }
  };

  const filteredUsers = users.filter(user => 
    user.id !== currentUserId &&
    (searchQuery === "" || 
     user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.bio?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="safe-area-top px-4 py-4 border-b border-border/50">
        <h1 className="text-2xl font-bold text-center mb-4">Find Friends</h1>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-2xl"
          />
        </div>
      </header>

      {/* Invite Friends Button */}
      <div className="px-4 py-4">
        <Button
          className="w-full h-12 rounded-2xl gap-2"
          variant="outline"
          onClick={handleInviteFriends}
        >
          <Share2 className="w-5 h-5" />
          Invite Friends
        </Button>
      </div>

      {/* Users List */}
      <main className="px-4 pb-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No users found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-4 glass-card rounded-2xl hover-scale"
              >
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full flex items-center justify-center gradient-regulus border-2 border-border flex-shrink-0">
                  <Sparkles className="w-7 h-7" />
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{user.username}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.bio || "No bio yet"}
                  </p>
                </div>

                {/* Follow Button */}
                <Button
                  size="sm"
                  variant={following.has(user.id) ? "outline" : "default"}
                  onClick={() => handleFollow(user.id)}
                  className="rounded-full px-6"
                >
                  {following.has(user.id) ? "Following" : "Follow"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
};

export default Friends;
