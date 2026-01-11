import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Ghost as GhostIcon, X } from "lucide-react";
import MobileNav from "@/components/MobileNav";
import LoadingAnimation from "@/components/LoadingAnimation";
import { UserBadge } from "@/components/Badge/UserBadge";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";

type PostWithProfile = Database["public"]["Tables"]["posts"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"];
  reactions: Database["public"]["Tables"]["reactions"]["Row"][];
};

const UserProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<Database["public"]["Tables"]["profiles"]["Row"] | null>(null);
  const [postsCount, setPostsCount] = useState(0);
  const [observingCount, setObservingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [badges, setBadges] = useState<any[]>([]);
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<PostWithProfile | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    if (!userId) {
      navigate("/friends");
      return;
    }

    // Check if viewing own profile
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user.id === userId) {
      setIsCurrentUser(true);
      navigate("/profile");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      navigate("/friends");
      return;
    }

    setProfile(data);

    // Load posts count
    const { count: posts } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", data.id);
    setPostsCount(posts || 0);

    // Load observing and followers count - only for regulus accounts
    if (data.account_type === "regulus") {
      const { count: observing } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", data.id);
      setObservingCount(observing || 0);

      const { count: followers } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", data.id);
      setFollowersCount(followers || 0);
    }

    // Load badges
    const { data: badgeData } = await supabase
      .from("badges")
      .select("*")
      .eq("user_id", data.id);
    if (badgeData) {
      setBadges(badgeData);
    }

    // Load user's posts with full data for viewing
    const { data: postsData } = await supabase
      .from("posts")
      .select(`
        *,
        profiles!posts_user_id_fkey(*),
        reactions(*)
      `)
      .eq("user_id", data.id)
      .order("created_at", { ascending: false })
      .limit(9);
    
    if (postsData) {
      setPosts(postsData as PostWithProfile[]);
    }

    setLoading(false);
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingAnimation />
      </div>
    );
  }

  // Ghost types (observer, ghost, echo) have view-only profiles
  const isGhostType = profile.account_type === "ghost";

  return (
    <div className="min-h-screen min-h-dvh bg-background">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-xl">
        <div className="safe-area-top" />
        <div className="px-4 py-3 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="flex-1 text-center font-semibold text-muted-foreground">
            Profile
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Profile Content */}
      <main className="px-4 pb-28">
        {/* Profile Picture */}
        <div className="flex justify-center mb-4">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center border-2 border-border/50 overflow-hidden ${profile.account_type === "regulus" ? "gradient-regulus" : "gradient-ghost"} opacity-90`}>
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              profile.account_type === "regulus" ? (
                <Sparkles className="w-12 h-12 text-muted-foreground" />
              ) : (
                <GhostIcon className="w-12 h-12 text-muted-foreground" />
              )
            )}
          </div>
        </div>

        {/* Username */}
        <h1 className="text-xl font-semibold text-center mb-1 text-foreground/90">
          {profile.full_name || profile.username}
        </h1>
        
        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex justify-center mb-2">
            <UserBadge badges={badges} size="md" />
          </div>
        )}
        
        {/* Username handle */}
        {profile.full_name && (
          <p className="text-sm text-muted-foreground text-center mb-1">
            @{profile.username}
          </p>
        )}
        
        {/* Bio */}
        <p className="text-sm text-muted-foreground text-center mb-1 max-w-xs mx-auto">
          {profile.bio || "No bio"}
        </p>
        
        {/* Account Type Indicator */}
        <p className="text-xs text-muted-foreground/70 text-center mb-6">
          {profile.account_type === "regulus" ? "⚡️ Regulus" : "🌫️ GhostMode"}
        </p>

        {/* Stats - Followers and Following counts only for Regulus accounts */}
        {profile.account_type === "regulus" && (
          <div className="flex justify-center gap-12 mb-6">
            <div className="text-center">
              <div className="text-lg font-medium text-foreground/90">{followersCount}</div>
              <div className="text-xs text-muted-foreground/70">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium text-foreground/90">{observingCount}</div>
              <div className="text-xs text-muted-foreground/70">Following</div>
            </div>
          </div>
        )}

        {/* Ghost type notice */}
        {isGhostType && (
          <div className="text-center mb-6 p-3 rounded-xl bg-muted/30">
            <p className="text-xs text-muted-foreground/70">
              View-only profile • This user prefers to remain in the shadows
            </p>
          </div>
        )}

        {/* Posts Grid - Tap to view */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="aspect-[3/4] bg-muted rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <img 
                  src={post.front_media_url} 
                  alt="" 
                  className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground/60">No posts yet</p>
          </div>
        )}

        {/* Full Post View Dialog */}
        <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
          <DialogContent className="max-w-md p-0 bg-background border-border overflow-hidden">
            {selectedPost && (
              <div className="relative">
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-2 right-2 z-10 rounded-full bg-background/80 backdrop-blur-sm"
                >
                  <X className="w-5 h-5" />
                </Button>
                
                {/* Post media */}
                <div className="relative aspect-[3/4] bg-muted">
                  <img 
                    src={selectedPost.front_media_url} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                  {selectedPost.back_media_url && (
                    <div className="absolute top-3 left-3 w-20 h-28 rounded-lg overflow-hidden border-2 border-background/50 shadow-lg">
                      <img 
                        src={selectedPost.back_media_url} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                
                {/* Post info */}
                <div className="p-4 space-y-2">
                  {selectedPost.caption && (
                    <p className="text-sm text-foreground/90">{selectedPost.caption}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(selectedPost.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>

      <MobileNav />
    </div>
  );
};

export default UserProfile;
