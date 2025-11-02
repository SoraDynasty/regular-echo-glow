import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Eye, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import CommentSection from "@/components/Comments/CommentSection";
import type { Database } from "@/integrations/supabase/types";

type Post = Database["public"]["Tables"]["posts"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"];
  reactions: Database["public"]["Tables"]["reactions"]["Row"][];
};

interface PostCardProps {
  post: Post;
  onReaction: () => void;
}

const PostCard = ({ post, onReaction }: PostCardProps) => {
  const [reacting, setReacting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    loadCommentCount();
  }, [post.id]);

  const loadCommentCount = async () => {
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);
    setCommentCount(count || 0);
  };

  const handleReaction = async (reactionType: string) => {
    haptics.light();
    setReacting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to react");
        return;
      }

      // Check if user already reacted with this type
      const existingReaction = post.reactions.find(
        (r) => r.user_id === session.user.id && r.reaction_type === reactionType
      );

      if (existingReaction) {
        // Remove reaction
        await supabase.from("reactions").delete().eq("id", existingReaction.id);
      } else {
        // Add reaction
        await supabase.from("reactions").insert({
          post_id: post.id,
          user_id: session.user.id,
          reaction_type: reactionType,
        });
        
        // Create notification for post owner
        if (session.user.id !== post.user_id) {
          await supabase.from("notifications").insert({
            user_id: post.user_id,
            type: "reaction",
            content: `${session.user.user_metadata?.username || 'Someone'} reacted to your post`,
            related_post_id: post.id,
            related_user_id: session.user.id
          });
        }
        
        haptics.success();
      }

      onReaction();
    } catch (error: any) {
      haptics.error();
      toast.error("Failed to react");
    } finally {
      setReacting(false);
    }
  };

  const getReactionCount = (type: string) => {
    return post.reactions.filter((r) => r.reaction_type === type).length;
  };

  const hasUserReacted = async (type: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    return post.reactions.some(
      (r) => r.user_id === session.user.id && r.reaction_type === type
    );
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Card className="glass-card border-border/50 overflow-hidden transition-all hover:scale-[1.01]">
      {/* Header */}
      <div className="p-3 md:p-4 flex items-center justify-between border-b border-border/30">
        <div className="flex items-center gap-2 md:gap-3">
          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-bold ${
            post.profiles.account_type === "regulus" ? "gradient-regulus" : "gradient-ghost"
          }`}>
            {post.profiles.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm md:text-base font-semibold">{post.profiles.username}</div>
            <div className="text-xs text-muted-foreground">
              {formatTimeAgo(post.created_at)}
            </div>
          </div>
        </div>
      </div>

      {/* Media */}
      <div className="relative aspect-square bg-muted">
        <img
          src={post.front_media_url}
          alt="Post"
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop";
          }}
        />
        {post.back_media_url && (
          <div className="absolute top-2 right-2 md:top-4 md:right-4 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg">
            <img
              src={post.back_media_url}
              alt="Back camera"
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop";
              }}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 md:p-4 space-y-2 md:space-y-3">
        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={reacting}
            onClick={() => handleReaction("love")}
            className="gap-1 h-10 md:h-9"
          >
            <Heart className="w-4 h-4 md:w-5 md:h-5" />
            {getReactionCount("love") > 0 && (
              <span className="text-xs">{getReactionCount("love")}</span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={reacting}
            onClick={() => handleReaction("fire")}
            className="gap-1 h-10 md:h-9"
          >
            <Flame className="w-4 h-4 md:w-5 md:h-5" />
            {getReactionCount("fire") > 0 && (
              <span className="text-xs">{getReactionCount("fire")}</span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={reacting}
            onClick={() => handleReaction("eyes")}
            className="gap-1 h-10 md:h-9"
          >
            <Eye className="w-4 h-4 md:w-5 md:h-5" />
            {getReactionCount("eyes") > 0 && (
              <span className="text-xs">{getReactionCount("eyes")}</span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="gap-1 h-10 md:h-9"
          >
            <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
            {commentCount > 0 && (
              <span className="text-xs">{commentCount}</span>
            )}
          </Button>
        </div>

        {post.caption && (
          <p className="text-xs md:text-sm">
            <span className="font-semibold mr-2">{post.profiles.username}</span>
            {post.caption}
          </p>
        )}

        {/* Comments Section */}
        <Collapsible open={showComments} onOpenChange={setShowComments}>
          <CollapsibleContent className="mt-3 pt-3 border-t border-border/30">
            <CommentSection 
              postId={post.id} 
              postUserId={post.user_id}
              onCommentAdded={loadCommentCount}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Card>
  );
};

export default PostCard;
