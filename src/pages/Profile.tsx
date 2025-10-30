import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Settings, Sparkles, Ghost as GhostIcon, QrCode, Crown } from "lucide-react";
import { toast } from "sonner";
import MobileNav from "@/components/MobileNav";
import type { Database } from "@/integrations/supabase/types";
const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Database["public"]["Tables"]["profiles"]["Row"] | null>(null);
  const [postsCount, setPostsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [subscription, setSubscription] = useState<any>(null);
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

      // Load posts count
      const {
        count: posts
      } = await supabase.from("posts").select("*", {
        count: "exact",
        head: true
      }).eq("user_id", data.id);
      setPostsCount(posts || 0);

      // Load followers count
      const {
        count: followers
      } = await supabase.from("follows").select("*", {
        count: "exact",
        head: true
      }).eq("following_id", data.id);
      setFollowersCount(followers || 0);

      // Load following count
      const {
        count: following
      } = await supabase.from("follows").select("*", {
        count: "exact",
        head: true
      }).eq("follower_id", data.id);
      setFollowingCount(following || 0);

      // Load subscription status
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", data.id)
        .single();
      setSubscription(subData);
    }
  };
  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>;
  }
  return <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="safe-area-top px-4 py-4 flex items-center justify-between">
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {(!subscription || subscription.status !== 'active') && (
            <Button 
              variant="regulus"
              size="icon"
              onClick={() => navigate("/subscribe")}
              className="rounded-full"
            >
              <Crown className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => navigate("/edit-profile")} className="rounded-full">
            <Settings className="w-6 h-6" />
          </Button>
        </div>
      </header>

      {/* Profile Content */}
      <main className="px-4 pb-6">
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

        {/* Stats */}
        <div className="flex justify-center gap-12 mb-6">
          
          
          <div className="text-center">
            <div className="text-2xl font-bold">{followingCount}</div>
            <div className="text-xs text-muted-foreground">Following</div>
          </div>
        </div>

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
        <Button className="w-full rounded-2xl h-12 mb-6" variant="outline" onClick={() => toast.info("Share profile coming soon")}>
          <QrCode className="w-4 h-4 mr-2" />
          Share Profile
        </Button>

        {/* Privacy Notice */}
        

        {/* Posts Grid */}
        <div className="grid grid-cols-3 gap-1">
          {[...Array(9)].map((_, i) => <div key={i} className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
              <span className="text-4xl opacity-20">📸</span>
            </div>)}
        </div>
      </main>

      <MobileNav />
    </div>;
};
export default Profile;