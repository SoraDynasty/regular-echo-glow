import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Ghost as GhostIcon, Save } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Database["public"]["Tables"]["profiles"]["Row"] | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (data) {
      setProfile(data);
      setUsername(data.username);
      setBio(data.bio || "");
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username,
          bio,
        })
        .eq("id", profile.id);

      if (error) throw error;
      toast.success("Profile updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-card border-b border-border/50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/feed")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        <Card className="glass-card border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                profile.account_type === "regulus" ? "gradient-regulus" : "gradient-ghost"
              }`}>
                {profile.account_type === "regulus" ? (
                  <Sparkles className="w-8 h-8" />
                ) : (
                  <GhostIcon className="w-8 h-8" />
                )}
              </div>
              <div>
                <CardTitle className="text-2xl">{profile.username}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    profile.account_type === "regulus"
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary/20 text-secondary"
                  }`}>
                    {profile.account_type === "regulus" ? "⚡️ Regulus" : "🌫️ GhostMode"}
                  </span>
                  {profile.ghost_type && (
                    <span className="text-sm text-muted-foreground">
                      {profile.ghost_type === "observer" && "👁️ Observer"}
                      {profile.ghost_type === "ghost" && "🌪️ Ghost"}
                      {profile.ghost_type === "echo" && "🔊 Echo"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="w-full"
                variant={profile.account_type === "regulus" ? "regulus" : "ghostmode"}
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            <div className="pt-6 border-t border-border">
              <h3 className="font-semibold mb-4">Account Type</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {profile.account_type === "regulus"
                  ? "Your Regulus account is visible to everyone. Others can follow you and see your posts."
                  : "Your GhostMode account is private. You can follow others and interact, but your profile stays hidden."}
              </p>
              <div className="p-4 rounded-lg bg-muted/50 text-sm">
                💡 Account type cannot be changed after signup. Create a new account to switch between Regulus and GhostMode.
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
