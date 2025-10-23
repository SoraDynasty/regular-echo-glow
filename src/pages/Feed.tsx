import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, User, LogOut, Sparkles, Ghost as GhostIcon } from "lucide-react";
import { toast } from "sonner";
import PostCard from "@/components/PostCard";
import type { Database } from "@/integrations/supabase/types";

type Post = Database["public"]["Tables"]["posts"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"];
  reactions: Database["public"]["Tables"]["reactions"]["Row"][];
};

const Feed = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<Database["public"]["Tables"]["profiles"]["Row"] | null>(null);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border/50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-glow-regulus">Regulargram</h1>
          
          <div className="flex items-center gap-3">
            {profile?.account_type === "regulus" ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-medium">Regulus</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/20 text-sm">
                <GhostIcon className="w-4 h-4 text-secondary" />
                <span className="font-medium">Ghost</span>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/profile")}
            >
              <User className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Create Post Button */}
        <div className="mb-8 text-center">
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
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground mt-4">Loading feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl">
            <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground">
              Be the first to share your authentic moment!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onReaction={loadFeed} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Feed;
