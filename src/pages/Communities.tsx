import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Search, Users, Lock, Globe, Loader2 } from "lucide-react";
import MobileNav from "@/components/MobileNav";
import { useToast } from "@/hooks/use-toast";
import { CreateCommunityDialog } from "@/components/Communities/CreateCommunityDialog";

interface Community {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  privacy: string;
  creator_id: string;
  created_at: string;
  member_count?: number;
}

const Communities = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchCommunities();
    }
  }, [user]);

  const fetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };

  const fetchCommunities = async () => {
    setLoading(true);
    
    // Fetch all public communities
    const { data: allCommunities, error: allError } = await supabase
      .from("communities")
      .select("*")
      .eq("privacy", "public")
      .order("created_at", { ascending: false });

    if (allError) {
      console.error("Error fetching communities:", allError);
      toast({
        title: "Error",
        description: "Failed to load communities",
        variant: "destructive"
      });
    }

    // Fetch communities user is a member of
    const { data: memberData, error: memberError } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", user.id);

    if (memberError) {
      console.error("Error fetching member data:", memberError);
    }

    const memberCommunityIds = memberData?.map(m => m.community_id) || [];

    // Fetch my communities (communities I'm a member of)
    if (memberCommunityIds.length > 0) {
      const { data: myData } = await supabase
        .from("communities")
        .select("*")
        .in("id", memberCommunityIds);
      
      setMyCommunities(myData || []);
    }

    // Fetch member counts for all communities
    const communitiesWithCounts = await Promise.all(
      (allCommunities || []).map(async (community) => {
        const { count } = await supabase
          .from("community_members")
          .select("*", { count: "exact", head: true })
          .eq("community_id", community.id);
        
        return { ...community, member_count: count || 0 };
      })
    );

    setCommunities(communitiesWithCounts);
    setLoading(false);
  };

  const handleJoinCommunity = async (communityId: string) => {
    const { error } = await supabase
      .from("community_members")
      .insert({
        community_id: communityId,
        user_id: user.id,
        role: "member"
      });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Already a member",
          description: "You're already a member of this community"
        });
      } else {
        console.error("Error joining community:", error);
        toast({
          title: "Error",
          description: "Failed to join community",
          variant: "destructive"
        });
      }
      return;
    }

    toast({
      title: "Joined!",
      description: "You've joined the community"
    });
    fetchCommunities();
  };

  const filteredCommunities = communities.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isMember = (communityId: string) => {
    return myCommunities.some(c => c.id === communityId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-card border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold">Communities</h1>
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create
          </Button>
        </div>
        
        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* My Communities */}
        {myCommunities.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">My Communities</h2>
            <div className="space-y-3">
              {myCommunities.map((community) => (
                <Card
                  key={community.id}
                  className="glass-card cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate(`/community/${community.id}`)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={community.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-lg">
                        {community.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{community.name}</h3>
                        {community.privacy === "private" ? (
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        ) : (
                          <Globe className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {community.description || "No description"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Discover Communities */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Discover Communities</h2>
          {filteredCommunities.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No communities found" : "No communities yet. Be the first to create one!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredCommunities.map((community) => (
                <Card
                  key={community.id}
                  className="glass-card overflow-hidden"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar
                        className="w-14 h-14 cursor-pointer"
                        onClick={() => navigate(`/community/${community.id}`)}
                      >
                        <AvatarImage src={community.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary text-lg">
                          {community.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => navigate(`/community/${community.id}`)}
                      >
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{community.name}</h3>
                          <Globe className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {community.description || "No description"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {community.member_count} member{community.member_count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      {!isMember(community.id) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinCommunity(community.id);
                          }}
                        >
                          Join
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <CreateCommunityDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={fetchCommunities}
      />

      <MobileNav />
    </div>
  );
};

export default Communities;
