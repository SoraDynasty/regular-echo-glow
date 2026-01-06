import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus, Share2, Sparkles, Plus, Users as UsersIcon, Lock, Globe, Eye } from "lucide-react";
import { toast } from "sonner";
import MobileNav from "@/components/MobileNav";
import { CreateCommunityDialog } from "@/components/Communities/CreateCommunityDialog";
import { haptics } from "@/lib/haptics";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface Community {
  id: string;
  name: string;
  description: string | null;
  privacy: string;
  avatar_url: string | null;
  creator_id: string;
  memberCount?: number;
}

const Friends = () => {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("people");
  
  // Communities state
  const [communities, setCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [memberCommunityIds, setMemberCommunityIds] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);

  useEffect(() => {
    checkAuth();
    loadUsers();
  }, []);

  useEffect(() => {
    if (currentUserId && activeTab === "communities") {
      loadCommunities();
    }
  }, [currentUserId, activeTab]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setCurrentUserId(session.user.id);
    
    // Load following list
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", session.user.id);
    
    if (follows) {
      setFollowing(new Set(follows.map(f => f.following_id)));
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadCommunities = async () => {
    if (!currentUserId) return;
    setCommunitiesLoading(true);
    
    try {
      // Get user's memberships
      const { data: memberships } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", currentUserId);
      
      const memberIds = new Set(memberships?.map(m => m.community_id) || []);
      setMemberCommunityIds(memberIds);

      // Get public communities
      const { data: publicCommunities, error: publicError } = await supabase
        .from("communities")
        .select("*")
        .eq("privacy", "public")
        .order("created_at", { ascending: false });

      if (publicError) throw publicError;

      // Get member counts for each community
      const communitiesWithCounts: Community[] = await Promise.all(
        (publicCommunities || []).map(async (community) => {
          const { count } = await supabase
            .from("community_members")
            .select("*", { count: "exact", head: true })
            .eq("community_id", community.id);
          
          return { ...community, memberCount: count || 0 };
        })
      );

      setCommunities(communitiesWithCounts);

      // Get communities user is a member of
      if (memberIds.size > 0) {
        const { data: myComms } = await supabase
          .from("communities")
          .select("*")
          .in("id", Array.from(memberIds));
        
        const myCommsWithCounts: Community[] = await Promise.all(
          (myComms || []).map(async (community) => {
            const { count } = await supabase
              .from("community_members")
              .select("*", { count: "exact", head: true })
              .eq("community_id", community.id);
            
            return { ...community, memberCount: count || 0 };
          })
        );
        
        setMyCommunities(myCommsWithCounts);
      }
    } catch (error: any) {
      toast.error("Failed to load communities");
    } finally {
      setCommunitiesLoading(false);
    }
  };

  const handleObserve = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) return;
    
    haptics.light();
    
    try {
      if (following.has(userId)) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", userId);
        
        setFollowing(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        toast.success("Stopped observing");
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: userId });
        
        setFollowing(prev => new Set(prev).add(userId));
        haptics.success();
        toast.success("Now observing");
      }
    } catch (error: any) {
      toast.error("Action failed");
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!currentUserId) return;
    
    haptics.light();
    
    try {
      await supabase
        .from("community_members")
        .insert({ community_id: communityId, user_id: currentUserId, role: "member" });
      
      setMemberCommunityIds(prev => new Set(prev).add(communityId));
      haptics.success();
      toast.success("Joined community!");
      loadCommunities();
    } catch (error: any) {
      toast.error("Failed to join community");
    }
  };

  const handleInviteFriends = () => {
    haptics.medium();
    
    const shareText = "Join me on Regulargram! 📸✨\n\nShare your authentic moments with friends.\n\n";
    const shareUrl = window.location.origin;
    
    if (navigator.share) {
      navigator.share({
        title: "Join Regulargram",
        text: shareText,
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText + shareUrl);
      toast.success("Invite link copied!");
    }
  };

  const filteredUsers = users.filter(user => 
    user.id !== currentUserId &&
    (searchQuery === "" || 
     user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.bio?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCommunities = communities.filter(community =>
    searchQuery === "" ||
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/30">
        <div className="safe-area-top" />
        <div className="px-4 py-3">
          <h1 className="text-2xl font-bold text-center mb-3">Connect</h1>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={activeTab === "people" ? "Search users..." : "Search communities..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-12 rounded-none bg-background border-b border-border/50">
          <TabsTrigger value="people" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            People
          </TabsTrigger>
          <TabsTrigger value="communities" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            Communities
          </TabsTrigger>
        </TabsList>

        {/* People Tab */}
        <TabsContent value="people" className="mt-0">
          <div className="px-4 py-4">
            <Button
              className="w-full h-12 rounded-2xl gap-2"
              variant="outline"
              onClick={handleInviteFriends}
            >
              <Share2 className="w-5 h-5" />
              Invite Friends
            </Button>
          </div>

          <main className="px-4 pb-28">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-4 glass-card rounded-2xl hover-scale cursor-pointer"
                    onClick={() => navigate(`/user/${user.id}`)}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 border-border/50 flex-shrink-0 ${user.account_type === "regulus" ? "gradient-regulus" : "gradient-ghost"} opacity-80`}>
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : user.account_type === "regulus" ? (
                        <Sparkles className="w-7 h-7 text-muted-foreground" />
                      ) : (
                        <Eye className="w-7 h-7 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground/90 truncate">{user.username}</h3>
                      <p className="text-sm text-muted-foreground/70 truncate">
                        {user.bio || "No bio"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={following.has(user.id) ? "ghost" : "outline"}
                      onClick={(e) => handleObserve(user.id, e)}
                      className="rounded-full px-4 text-muted-foreground"
                    >
                      {following.has(user.id) ? "Observing" : "Observe"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </main>
        </TabsContent>

        {/* Communities Tab */}
        <TabsContent value="communities" className="mt-0">
          <div className="px-4 py-4">
            <Button
              className="w-full h-12 rounded-2xl gap-2"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="w-5 h-5" />
              Create Community
            </Button>
          </div>

          <main className="px-4 pb-28">
            {communitiesLoading ? (
              <div className="flex justify-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* My Communities */}
                {myCommunities.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-3">My Communities</h2>
                    <div className="space-y-3">
                      {myCommunities.map((community) => (
                        <div
                          key={community.id}
                          className="flex items-center gap-3 p-4 glass-card rounded-2xl hover-scale cursor-pointer"
                          onClick={() => navigate(`/community/${community.id}`)}
                        >
                          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-primary/20 border-2 border-primary/30 flex-shrink-0">
                            <UsersIcon className="w-7 h-7 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">{community.name}</h3>
                              {community.privacy === "private" ? (
                                <Lock className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <Globe className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {community.memberCount} members
                            </p>
                          </div>
                          {community.creator_id === currentUserId && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Discover Communities */}
                <div>
                  <h2 className="text-lg font-semibold mb-3">Discover Communities</h2>
                  {filteredCommunities.length === 0 ? (
                    <div className="text-center py-12">
                      <UsersIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No communities found</p>
                      <p className="text-sm text-muted-foreground mt-1">Create one to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredCommunities.map((community) => (
                        <div
                          key={community.id}
                          className="flex items-center gap-3 p-4 glass-card rounded-2xl hover-scale"
                        >
                          <div 
                            className="w-14 h-14 rounded-full flex items-center justify-center bg-secondary border-2 border-border flex-shrink-0 cursor-pointer"
                            onClick={() => navigate(`/community/${community.id}`)}
                          >
                            <UsersIcon className="w-7 h-7" />
                          </div>
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => navigate(`/community/${community.id}`)}
                          >
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">{community.name}</h3>
                              <Globe className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {community.description || `${community.memberCount} members`}
                            </p>
                          </div>
                          {!memberCommunityIds.has(community.id) ? (
                            <Button
                              size="sm"
                              onClick={() => handleJoinCommunity(community.id)}
                              className="rounded-full px-6"
                            >
                              Join
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground px-3 py-1 rounded-full border border-border">
                              Joined
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </TabsContent>
      </Tabs>

      <CreateCommunityDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={() => {
          loadCommunities();
          setShowCreateDialog(false);
        }}
      />

      <MobileNav />
    </div>
  );
};

export default Friends;
