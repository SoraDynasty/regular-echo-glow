import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import StoryRing from "./StoryRing";
import StoryViewer from "./StoryViewer";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  created_at: string;
  expires_at: string;
  viewed_by: string[];
  profiles: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

interface UserWithStories {
  userId: string;
  username: string;
  avatarUrl: string | null;
  stories: Story[];
  hasUnviewed: boolean;
}

const StoriesRow = () => {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<{
    username: string;
    avatar_url: string | null;
  } | null>(null);
  const [userStories, setUserStories] = useState<UserWithStories[]>([]);
  const [ownStories, setOwnStories] = useState<Story[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [allViewerStories, setAllViewerStories] = useState<Story[]>([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setCurrentUserId(session.user.id);

      // Get current user's profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", session.user.id)
        .single();

      if (profileData) {
        setCurrentUserProfile(profileData);
      }

      // Load all non-expired stories
      const { data: stories, error } = await supabase
        .from("stories")
        .select(`
          *,
          profiles:user_id (id, username, avatar_url)
        `)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Parse stories with proper types
      const parsedStories: Story[] = (stories || []).map(s => ({
        ...s,
        viewed_by: Array.isArray(s.viewed_by) 
          ? (s.viewed_by as (string | number)[]).map(v => String(v))
          : [],
        profiles: s.profiles as Story["profiles"]
      }));

      // Separate own stories
      const myStories = parsedStories.filter(s => s.user_id === session.user.id);
      setOwnStories(myStories);

      // Group other users' stories
      const otherStories = parsedStories.filter(s => s.user_id !== session.user.id);
      const groupedByUser = otherStories.reduce((acc, story) => {
        if (!acc[story.user_id]) {
          acc[story.user_id] = {
            userId: story.user_id,
            username: story.profiles.username,
            avatarUrl: story.profiles.avatar_url,
            stories: [],
            hasUnviewed: false
          };
        }
        acc[story.user_id].stories.push(story);
        if (!story.viewed_by.includes(session.user.id)) {
          acc[story.user_id].hasUnviewed = true;
        }
        return acc;
      }, {} as Record<string, UserWithStories>);

      // Sort by unviewed first, then by most recent story
      const sorted = Object.values(groupedByUser).sort((a, b) => {
        if (a.hasUnviewed !== b.hasUnviewed) {
          return a.hasUnviewed ? -1 : 1;
        }
        const aLatest = new Date(a.stories[a.stories.length - 1].created_at).getTime();
        const bLatest = new Date(b.stories[b.stories.length - 1].created_at).getTime();
        return bLatest - aLatest;
      });

      setUserStories(sorted);
    } catch (error) {
      console.error("Failed to load stories:", error);
    }
  };

  const handleAddStory = () => {
    navigate("/capture?mode=story");
  };

  const handleViewOwnStories = () => {
    if (ownStories.length === 0) {
      handleAddStory();
      return;
    }
    setAllViewerStories(ownStories);
    setViewerInitialIndex(0);
    setViewerOpen(true);
  };

  const handleViewUserStories = (userIndex: number) => {
    const user = userStories[userIndex];
    if (!user) return;
    
    setAllViewerStories(user.stories);
    setViewerInitialIndex(0);
    setSelectedUserIndex(userIndex);
    setViewerOpen(true);
  };

  const handleStoryViewed = useCallback(async (storyId: string) => {
    if (!currentUserId) return;

    try {
      // Get current viewed_by array
      const { data: story } = await supabase
        .from("stories")
        .select("viewed_by")
        .eq("id", storyId)
        .single();

      if (!story) return;

      const viewedBy = Array.isArray(story.viewed_by) ? story.viewed_by : [];
      if (viewedBy.includes(currentUserId)) return;

      // Update with new viewer
      await supabase
        .from("stories")
        .update({ viewed_by: [...viewedBy, currentUserId] })
        .eq("id", storyId);

      // Refresh stories
      loadStories();
    } catch (error) {
      console.error("Failed to mark story as viewed:", error);
    }
  }, [currentUserId]);

  const handleCloseViewer = () => {
    setViewerOpen(false);
    loadStories(); // Refresh to update viewed status
  };

  // Don't render if no stories and no current user
  if (!currentUserId) return null;
  if (ownStories.length === 0 && userStories.length === 0) {
    // Show just the add story button
    return (
      <div className="mb-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 px-4 py-2">
            <StoryRing
              avatarUrl={currentUserProfile?.avatar_url}
              username={currentUserProfile?.username || "You"}
              isOwn
              isAddNew
              onClick={handleAddStory}
            />
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 px-4 py-2">
            {/* Own story / Add story */}
            <StoryRing
              avatarUrl={currentUserProfile?.avatar_url}
              username={currentUserProfile?.username || "You"}
              isOwn
              isAddNew={ownStories.length === 0}
              isViewed={ownStories.length > 0}
              onClick={handleViewOwnStories}
            />
            
            {/* Other users' stories */}
            {userStories.map((user, index) => (
              <StoryRing
                key={user.userId}
                avatarUrl={user.avatarUrl}
                username={user.username}
                isViewed={!user.hasUnviewed}
                onClick={() => handleViewUserStories(index)}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      {/* Story Viewer Modal */}
      {viewerOpen && currentUserId && (
        <StoryViewer
          stories={allViewerStories}
          initialIndex={viewerInitialIndex}
          currentUserId={currentUserId}
          onClose={handleCloseViewer}
          onStoryViewed={handleStoryViewed}
        />
      )}
    </>
  );
};

export default StoriesRow;
