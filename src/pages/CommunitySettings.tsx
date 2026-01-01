import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Camera, Loader2, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MobileNav from "@/components/MobileNav";

const CommunitySettings = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [community, setCommunity] = useState<any>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    fetchCommunity();
  }, [id]);

  const fetchCommunity = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if user is admin
    const { data: membership } = await supabase
      .from("community_members")
      .select("role")
      .eq("community_id", id)
      .eq("user_id", session.user.id)
      .single();

    if (!membership || membership.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "Only admins can edit community settings",
        variant: "destructive"
      });
      navigate(`/community/${id}`);
      return;
    }

    const { data, error } = await supabase
      .from("communities")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      navigate("/communities");
      return;
    }

    setCommunity(data);
    setName(data.name);
    setDescription(data.description || "");
    setAvatarUrl(data.avatar_url);
    setCoverUrl(data.cover_url);
    setLoading(false);
  };

  const uploadImage = async (file: File, type: "avatar" | "cover") => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${id}/${type}-${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const url = await uploadImage(file, "avatar");
      setAvatarUrl(url);
      toast({ title: "Avatar uploaded" });
    } catch (error) {
      console.error(error);
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar",
        variant: "destructive"
      });
    }
    setUploadingAvatar(false);
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const url = await uploadImage(file, "cover");
      setCoverUrl(url);
      toast({ title: "Cover uploaded" });
    } catch (error) {
      console.error(error);
      toast({
        title: "Upload failed",
        description: "Failed to upload cover",
        variant: "destructive"
      });
    }
    setUploadingCover(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Community name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("communities")
      .update({
        name: name.trim(),
        description: description.trim() || null,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      });
    } else {
      toast({ title: "Community updated" });
      navigate(`/community/${id}`);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this community? This action cannot be undone.")) {
      return;
    }

    const { error } = await supabase
      .from("communities")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete community",
        variant: "destructive"
      });
    } else {
      toast({ title: "Community deleted" });
      navigate("/communities");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="safe-area-top px-4 py-4 flex items-center gap-3 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/community/${id}`)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold flex-1">Community Settings</h1>
        <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </Button>
      </header>

      <main className="p-4 space-y-6">
        {/* Cover Photo */}
        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cover Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="relative h-32 bg-gradient-to-br from-primary/30 to-accent/30 rounded-lg overflow-hidden cursor-pointer"
              onClick={() => coverInputRef.current?.click()}
            >
              {coverUrl && (
                <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                {uploadingCover ? (
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                ) : (
                  <Camera className="w-8 h-8 text-white" />
                )}
              </div>
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground mt-2">Tap to change cover photo</p>
          </CardContent>
        </Card>

        {/* Avatar */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Profile Photo</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div 
              className="relative cursor-pointer"
              onClick={() => avatarInputRef.current?.click()}
            >
              <Avatar className="w-20 h-20 border-4 border-background">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                {uploadingAvatar ? (
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm">Tap to change avatar</p>
              <p className="text-xs text-muted-foreground">Recommended: Square image</p>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Name & Description */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Community Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Community Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter community name"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this community about?"
                rows={3}
                className="bg-background/50 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="glass-card border-destructive/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="w-full gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Community
            </Button>
          </CardContent>
        </Card>
      </main>

      <MobileNav />
    </div>
  );
};

export default CommunitySettings;
