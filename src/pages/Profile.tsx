import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Settings, Sparkles, Ghost as GhostIcon, Crown, X } from "lucide-react";
import MobileNav from "@/components/MobileNav";
import ShareProfileQR from "@/components/Profile/ShareProfileQR";
import LoadingAnimation from "@/components/LoadingAnimation";
import { UserBadge } from "@/components/Badge/UserBadge";
import type { Database } from "@/integrations/supabase/types";

type Post = Database["public"]["Tables"]["posts"]["Row"];
const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Database["public"]["Tables"]["profiles"]["Row"] | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsCount, setPostsCount] = useState(0);
  const [observingCount, setObservingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [subscription, setSubscription] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  useEffect(() => {
    loadProfile();
  }, []);
  const loadProfile = async () => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    const {
      data,
      error
    } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    if (data) {
      setProfile(data);

      // Load posts
      const { data: postsData, count: postsTotal } = await supabase
        .from("posts")
        .select("*", { count: "exact" })
        .eq("user_id", data.id)
        .order("created_at", { ascending: false });
      
      setPosts(postsData || []);
      setPostsCount(postsTotal || 0);

      // Load observing count (who you follow/observe) - only for regulus
      if (data.account_type === "regulus") {
        const {
          count: observing
        } = await supabase.from("follows").select("*", {
          count: "exact",
          head: true
        }).eq("follower_id", data.id);
        setObservingCount(observing || 0);

        // Load followers count (who follows you) - only for regulus
        const {
          count: followers
        } = await supabase.from("follows").select("*", {
          count: "exact",
          head: true
        }).eq("following_id", data.id);
        setFollowersCount(followers || 0);
      }

      // Load subscription status
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", data.id)
        .single();
      setSubscription(subData);

      // Load badges
      const { data: badgeData } = await supabase
        .from("badges")
        .select("*")
        .eq("user_id", data.id);
      if (badgeData) {
        setBadges(badgeData);
      }
    }
  };
  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingAnimation />
      </div>;
  }
  return <div className="min-h-screen min-h-dvh bg-background">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-xl">
        <div className="safe-area-top" />
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="rounded-full">
              <Settings className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <main className="px-4 pb-28">
        {/* Profile Picture */}
        <div className="flex justify-center mb-4">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 border-border overflow-hidden ${profile.account_type === "regulus" ? "gradient-regulus" : "gradient-ghost"}`}>
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              profile.account_type === "regulus" ? <Sparkles className="w-16 h-16" /> : <GhostIcon className="w-16 h-16" />
            )}
          </div>
        </div>

        {/* Username */}
        <h1 className="text-2xl font-bold text-center mb-2">
          {profile.full_name || profile.username}
        </h1>
        
        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex justify-center mb-2">
            <UserBadge badges={badges} size="lg" />
          </div>
        )}
        
        {/* Username handle */}
        {profile.full_name && (
          <p className="text-sm text-muted-foreground text-center mb-1">
            @{profile.username}
          </p>
        )}
        
        {/* Bio */}
        <p className="text-sm text-muted-foreground text-center mb-1">
          {profile.bio || "JUST BEING REAL"}
        </p>
        
        {/* Location/Account Type */}
        <p className="text-xs text-muted-foreground text-center mb-6">
          {profile.location && `${profile.location} • `}
          {profile.account_type === "regulus" ? "⚡️ Regulus" : "🌫️ GhostMode"}
        </p>

        {/* Stats - Followers and Observing counts shown only for Regulus accounts */}
        {profile.account_type === "regulus" && (
          <div className="flex justify-center gap-12 mb-6">
            <div className="text-center">
              <div className="text-lg font-medium text-foreground">{followersCount}</div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium text-foreground">{observingCount}</div>
              <div className="text-xs text-muted-foreground">Following</div>
            </div>
          </div>
        )}
        
        {/* Ghost type notice for ghost accounts */}
        {profile.account_type === "ghost" && (
          <div className="text-center mb-6 p-3 rounded-xl bg-muted/30">
            <p className="text-xs text-muted-foreground/70">
              GhostMode • You can follow others but won't have visible followers
            </p>
          </div>
        )}

        {/* Premium Badge */}
        {subscription?.status === 'active' && (
          <div className="glass-card p-3 rounded-2xl mb-4 text-center border border-primary/20">
            <Crown className="w-5 h-5 inline mr-2 text-primary" />
            <span className="text-sm font-semibold">
              {subscription.tier === 'ghost_premium' ? 'Ghost Premium' : 'Regulus Premium'}
            </span>
          </div>
        )}


        {/* Share Profile Button */}
        <div className="mb-6">
          <ShareProfileQR username={profile.username} userId={profile.id} />
        </div>

        {/* Privacy Notice */}
        

        {/* Posts Grid */}
        <div className="grid grid-cols-3 gap-1">
          {posts.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <span className="text-4xl opacity-30">📸</span>
              <p className="text-muted-foreground mt-2">No posts yet</p>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="aspect-[3/4] bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedPost(post)}
              >
                <img
                  src={post.front_media_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))
          )}
        </div>
      </main>

      {/* Post Modal */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-lg p-0 bg-background border-none overflow-hidden">
          {selectedPost && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 rounded-full bg-background/80 backdrop-blur-sm"
                onClick={() => setSelectedPost(null)}
              >
                <X className="w-5 h-5" />
              </Button>
              <img
                src={selectedPost.front_media_url}
                alt=""
                className="w-full aspect-[3/4] object-cover"
              />
              {selectedPost.caption && (
                <div className="p-4">
                  <p className="text-sm">{selectedPost.caption}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <MobileNav />
    </div>;
};
export default Profile;