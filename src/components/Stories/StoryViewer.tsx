import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { haptics } from "@/lib/haptics";

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

  const currentStory = stories[currentIndex];
  const isOwnStory = currentStory?.user_id === currentUserId;
  const viewCount = currentStory?.viewed_by?.length || 0;

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

      {/* View count for own stories */}
      {isOwnStory && (
        <div className="absolute bottom-0 left-0 right-0 safe-area-bottom z-20 p-4">
          <div className="flex items-center justify-center gap-2 text-white">
            <Eye className="w-5 h-5" />
            <span className="text-sm">{viewCount} {viewCount === 1 ? 'view' : 'views'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryViewer;