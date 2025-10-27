import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Camera } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

const EditProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Database["public"]["Tables"]["profiles"]["Row"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    bio: "",
    location: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

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
      setFormData({
        full_name: data.full_name || "",
        username: data.username || "",
        bio: data.bio || "",
        location: data.location || "",
      });
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        username: formData.username,
        bio: formData.bio,
        location: formData.location,
      })
      .eq("id", profile.id);

    setLoading(false);

    if (error) {
      toast.error("Failed to update profile");
      return;
    }

    toast.success("Profile updated successfully");
    navigate("/profile");
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="safe-area-top px-4 py-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/profile")}
          className="rounded-full"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-semibold">Edit Profile</h1>
        <div className="w-10" />
      </header>

      {/* Profile Picture Section */}
      <div className="px-4 mb-8">
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-muted flex items-center justify-center">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
          )}
          <button
            onClick={() => toast.info("Profile picture upload coming soon")}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm px-6 py-3 rounded-full flex items-center gap-2 hover:bg-background transition-colors"
          >
            <Camera className="w-5 h-5" />
            <span className="font-medium">Update profile picture</span>
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="px-4 space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm text-muted-foreground">
            Name
          </Label>
          <Input
            id="name"
            value={formData.full_name}
            onChange={(e) =>
              setFormData({ ...formData, full_name: e.target.value })
            }
            className="bg-card border-border rounded-xl h-14 text-base"
            placeholder="Enter your name"
          />
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm text-muted-foreground">
            Username
          </Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            className="bg-card border-border rounded-xl h-14 text-base"
            placeholder="Enter your username"
          />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio" className="text-sm text-muted-foreground">
            Bio
          </Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) =>
              setFormData({ ...formData, bio: e.target.value })
            }
            className="bg-card border-border rounded-xl min-h-[100px] text-base resize-none"
            placeholder="JUST BEING REAL"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm text-muted-foreground">
            Location
          </Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            className="bg-card border-border rounded-xl h-14 text-base"
            placeholder="Unknown"
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full rounded-2xl h-14 mt-8"
          size="lg"
        >
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};

export default EditProfile;
