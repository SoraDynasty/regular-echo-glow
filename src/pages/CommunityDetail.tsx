import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Settings, Users, ImageIcon, Lock, Globe, Loader2, LogOut } from "lucide-react";
import MobileNav from "@/components/MobileNav";
import { useToast } from "@/hooks/use-toast";
import PostCard from "@/components/PostCard";

interface Community {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  privacy: string;
  creator_id: string;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
}

const CommunityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userMembership, setUserMembership] = useState<Member | null>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user && id) {
      fetchCommunityData();
    }
  }, [user, id]);

  const fetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };

  const fetchCommunityData = async () => {
    setLoading(true);

    // Fetch community
    const { data: communityData, error: communityError } = await supabase
      .from("communities")
      .select("*")
      .eq("id", id)
      .single();

    if (communityError || !communityData) {
      console.error("Error fetching community:", communityError);
      toast({
        title: "Error",
        description: "Community not found",
        variant: "destructive"
      });
      navigate("/communities");
      return;
    }

    setCommunity(communityData);

    // Fetch members with profiles
    const { data: membersData } = await supabase
      .from("community_members")
      .select("*")
      .eq("community_id", id)
      .order("joined_at", { ascending: true });

    if (membersData) {
      // Fetch profiles for members
      const memberIds = membersData.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", memberIds);

      const membersWithProfiles = membersData.map(member => ({
        ...member,
        profile: profiles?.find(p => p.id === member.user_id)
      }));

      setMembers(membersWithProfiles);

      // Check if current user is a member
      const currentUserMembership = membersWithProfiles.find(
        m => m.user_id === user.id
      );
      setUserMembership(currentUserMembership || null);
    }

    // Fetch community posts
    const { data: communityPosts } = await supabase
      .from("community_posts")
      .select("post_id")
      .eq("community_id", id);

    if (communityPosts && communityPosts.length > 0) {
      const postIds = communityPosts.map(cp => cp.post_id);
      
      const { data: postsData } = await supabase
        .from("posts")
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url,
            account_type
          ),
          reactions (
            id,
            user_id,
            reaction_type
          )
        `)
        .in("id", postIds)
        .order("created_at", { ascending: false });

      setPosts(postsData || []);
    }

    setLoading(false);
  };

  const handleJoin = async () => {
    const { error } = await supabase
      .from("community_members")
      .insert({
        community_id: id,
        user_id: user.id,
        role: "member"
      });

    if (error) {
      console.error("Error joining:", error);
      toast({
        title: "Error",
        description: "Failed to join community",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Joined!",
      description: "You've joined the community"
    });
    fetchCommunityData();
  };

  const handleLeave = async () => {
    if (userMembership?.role === "admin" && members.filter(m => m.role === "admin").length === 1) {
      toast({
        title: "Cannot leave",
        description: "You're the only admin. Transfer ownership first.",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from("community_members")
      .delete()
      .eq("community_id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error leaving:", error);
      toast({
        title: "Error",
        description: "Failed to leave community",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Left community",
      description: "You've left the community"
    });
    navigate("/communities");
  };

  const handleReaction = () => {
    fetchCommunityData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!community) {
    return null;
  }

  const isAdmin = userMembership?.role === "admin";

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Cover Image */}
      <div className="relative h-32 bg-gradient-to-br from-primary/30 to-accent/30">
        {community.cover_url && (
          <img
            src={community.cover_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        
        {/* Back Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 left-3 bg-background/50 backdrop-blur-sm"
          onClick={() => navigate("/communities")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-background/50 backdrop-blur-sm"
            onClick={() => navigate(`/community/${id}/settings`)}
          >
            <Settings className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Community Info */}
      <div className="px-4 -mt-10 relative z-10">
        <div className="flex items-end gap-4">
          <Avatar className="w-20 h-20 border-4 border-background">
            <AvatarImage src={community.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-2xl">
              {community.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{community.name}</h1>
              {community.privacy === "private" ? (
                <Lock className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Globe className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {community.description && (
          <p className="mt-3 text-sm text-muted-foreground">
            {community.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex gap-3">
          {userMembership ? (
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleLeave}
            >
              <LogOut className="w-4 h-4" />
              Leave
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={handleJoin}
            >
              Join Community
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <Tabs defaultValue="posts">
          <TabsList className="w-full justify-start px-4 bg-transparent">
            <TabsTrigger value="posts" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="w-4 h-4" />
              Members
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="px-4 mt-4">
            {posts.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-8 text-center">
                  <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No posts yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onReaction={handleReaction}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="px-4 mt-4">
            <div className="space-y-3">
              {members.map((member) => (
                <Card key={member.id} className="glass-card">
                  <CardContent className="p-3 flex items-center gap-3">
                    <Avatar
                      className="w-10 h-10 cursor-pointer"
                      onClick={() => navigate(`/profile/${member.user_id}`)}
                    >
                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.profile?.username?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{member.profile?.username || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <MobileNav />
    </div>
  );
};

export default CommunityDetail;
