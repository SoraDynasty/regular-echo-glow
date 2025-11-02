import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, User, LogOut, Sparkles, Ghost as GhostIcon, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import PostCard from "@/components/PostCard";
import MobileNav from "@/components/MobileNav";
import NotificationBell from "@/components/Notifications/NotificationBell";
import LoadingAnimation from "@/components/LoadingAnimation";
import { useTheme } from "@/hooks/use-theme";
import { useSwipe } from "@/hooks/use-swipe";
import type { Database } from "@/integrations/supabase/types";

type Post = Database["public"]["Tables"]["posts"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"];
  reactions: Database["public"]["Tables"]["reactions"]["Row"][];
};

const Feed = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<Database["public"]["Tables"]["profiles"]["Row"] | null>(null);

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => navigate("/profile"),
    onSwipeRight: () => {}, // Can add more swipe actions
  });

  useEffect(() => {
    checkAuth();
    loadFeed();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Load user profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
    }
  };

  const loadFeed = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles (*),
          reactions (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data as Post[]);
    } catch (error: any) {
      toast.error("Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0" {...swipeHandlers}>
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border/50 backdrop-blur-xl safe-area-top">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-glow-regulus">Regulargram</h1>
          
          <div className="flex items-center gap-2 md:gap-3">
            {profile?.account_type === "regulus" ? (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-medium">Regulus</span>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/20 text-sm">
                <GhostIcon className="w-4 h-4 text-secondary" />
                <span className="font-medium">Ghost</span>
              </div>
            )}
            
            <NotificationBell />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hidden md:flex"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/profile")}
              className="hidden md:flex"
            >
              <User className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="hidden md:flex"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Create Post Button - Hidden on mobile, shown on desktop */}
        <div className="mb-6 md:mb-8 text-center hidden md:block">
          <Button
            size="lg"
            variant={profile?.account_type === "regulus" ? "regulus" : "ghostmode"}
            className="gap-2"
            onClick={() => toast.info("Camera feature coming soon!")}
          >
            <Camera className="w-5 h-5" />
            Capture Your Regular
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            Share what you're doing right now
          </p>
        </div>

        {/* Posts Feed */}
        {loading ? (
          <LoadingAnimation />
        ) : posts.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl p-6">
            <Camera className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg md:text-xl font-semibold mb-2">No posts yet</h3>
            <p className="text-sm md:text-base text-muted-foreground">
              Be the first to share your authentic moment!
            </p>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onReaction={loadFeed} />
            ))}
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
};

export default Feed;
