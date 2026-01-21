import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Eye, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { haptics } from "@/lib/haptics";
import { toast } from "sonner";

const REACTION_EMOJIS = ["❤️", "🔥", "😍", "😂", "😮", "👏"];

interface StoryReaction {
  id: string;
  story_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}
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

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  currentUserId: string;
  onClose: () => void;
  onStoryViewed: (storyId: string) => void;
}

const STORY_DURATION = 5000; // 5 seconds per story

const StoryViewer = ({ 
  stories, 
  initialIndex, 
  currentUserId,
  onClose, 
  onStoryViewed 
}: StoryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [sentReaction, setSentReaction] = useState<string | null>(null);
  const [storyReactions, setStoryReactions] = useState<StoryReaction[]>([]);

  const currentStory = stories[currentIndex];
  const isOwnStory = currentStory?.user_id === currentUserId;
  const viewCount = currentStory?.viewed_by?.length || 0;

  // Load reactions for own stories
  useEffect(() => {
    if (!currentStory || !isOwnStory) {
      setStoryReactions([]);
      return;
    }

    const loadReactions = async () => {
      const { data } = await supabase
        .from("story_reactions")
        .select("*")
        .eq("story_id", currentStory.id);
      
      if (data) {
        setStoryReactions(data);
      }
    };

    loadReactions();

    // Subscribe to realtime reactions
    const channel = supabase
      .channel(`story-reactions-${currentStory.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'story_reactions',
          filter: `story_id=eq.${currentStory.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setStoryReactions(prev => [...prev, payload.new as StoryReaction]);
          } else if (payload.eventType === 'DELETE') {
            setStoryReactions(prev => prev.filter(r => r.id !== (payload.old as StoryReaction).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentStory?.id, isOwnStory]);

  // Mark story as viewed
  useEffect(() => {
    if (!currentStory || isOwnStory) return;
    
    const viewedBy = currentStory.viewed_by || [];
    if (!viewedBy.includes(currentUserId)) {
      onStoryViewed(currentStory.id);
    }
  }, [currentStory, currentUserId, isOwnStory, onStoryViewed]);

  // Progress timer
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Move to next story
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + (100 / (STORY_DURATION / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, stories.length, onClose]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  const goToPrevious = useCallback(() => {
    haptics.light();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    haptics.light();
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const handleTouchStart = () => setIsPaused(true);
  const handleTouchEnd = () => setIsPaused(false);

  const handleReaction = async (emoji: string) => {
    if (!currentStory || isOwnStory) return;
    
    haptics.medium();
    setShowReactions(false);
    setSentReaction(emoji);

    try {
      // Upsert the reaction (update if exists, insert if not)
      const { error } = await supabase
        .from("story_reactions")
        .upsert(
          { 
            story_id: currentStory.id, 
            user_id: currentUserId, 
            emoji 
          },
          { onConflict: 'story_id,user_id' }
        );

      if (error) throw error;
      
      toast.success("Reaction sent!");
      
      // Clear the visual feedback after animation
      setTimeout(() => {
        setSentReaction(null);
      }, 1500);
    } catch (error) {
      console.error("Failed to send reaction:", error);
      toast.error("Failed to send reaction");
      setSentReaction(null);
    }
  };

  const toggleReactions = () => {
    haptics.light();
    setShowReactions(prev => !prev);
  };

  if (!currentStory) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 safe-area-top z-20 px-2 pt-2">
        <div className="flex gap-1">
          {stories.map((_, index) => (
            <div 
              key={index}
              className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
            >
              <div 
                className="h-full bg-white transition-all duration-100"
                style={{ 
                  width: index < currentIndex 
                    ? '100%' 
                    : index === currentIndex 
                      ? `${progress}%` 
                      : '0%' 
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 safe-area-top z-20 pt-4 px-4">
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-white">
              <AvatarImage src={currentStory.profiles.avatar_url || undefined} />
              <AvatarFallback>
                {currentStory.profiles.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-medium text-sm">
                {currentStory.profiles.username}
              </p>
              <p className="text-white/60 text-xs">
                {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Story Image */}
      <img
        src={currentStory.media_url}
        alt="Story"
        className="absolute inset-0 w-full h-full object-contain"
      />

      {/* Navigation zones */}
      <div className="absolute inset-0 flex z-10">
        <button 
          className="w-1/3 h-full"
          onClick={goToPrevious}
          aria-label="Previous story"
        />
        <div className="w-1/3 h-full" />
        <button 
          className="w-1/3 h-full"
          onClick={goToNext}
          aria-label="Next story"
        />
      </div>

      {/* Navigation arrows - desktop */}
      {currentIndex > 0 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex text-white hover:bg-white/20"
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
      )}
      
      {currentIndex < stories.length - 1 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex text-white hover:bg-white/20"
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      )}

      {/* View count and reactions for own stories */}
      {isOwnStory && (
        <div className="absolute bottom-0 left-0 right-0 safe-area-bottom z-20 p-4">
          <div className="flex flex-col items-center gap-3">
            {/* Reactions received */}
            {storyReactions.length > 0 && (
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                <span className="text-sm text-white/80 mr-1">Reactions:</span>
                {storyReactions.slice(0, 5).map((reaction, idx) => (
                  <span key={reaction.id} className="text-lg">{reaction.emoji}</span>
                ))}
                {storyReactions.length > 5 && (
                  <span className="text-white/60 text-sm ml-1">+{storyReactions.length - 5}</span>
                )}
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-white">
              <Eye className="w-5 h-5" />
              <span className="text-sm">{viewCount} {viewCount === 1 ? 'view' : 'views'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Reaction buttons for other users' stories */}
      {!isOwnStory && (
        <div className="absolute bottom-0 left-0 right-0 safe-area-bottom z-20 p-4">
          <div className="flex flex-col items-center gap-3">
            {/* Reaction picker */}
            {showReactions && (
              <div className="flex gap-2 bg-black/60 backdrop-blur-md rounded-full px-4 py-2 animate-in slide-in-from-bottom-4 duration-200">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="text-2xl hover:scale-125 transition-transform active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
            
            {/* React button */}
            <Button
              variant="ghost"
              onClick={toggleReactions}
              className="text-white hover:bg-white/20 gap-2"
            >
              <Heart className={`w-5 h-5 ${showReactions ? 'fill-red-500 text-red-500' : ''}`} />
              <span className="text-sm">React</span>
            </Button>
          </div>
        </div>
      )}

      {/* Sent reaction animation */}
      {sentReaction && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <span className="text-8xl animate-ping">{sentReaction}</span>
        </div>
      )}
    </div>
  );
};

export default StoryViewer;