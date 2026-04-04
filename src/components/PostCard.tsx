import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import CommentSection from "@/components/Comments/CommentSection";
import { UserBadge } from "@/components/Badge/UserBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/integrations/supabase/types";

type Post = Database["public"]["Tables"]["posts"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"];
  reactions: Database["public"]["Tables"]["reactions"]["Row"][];
};

interface PostCardProps {
  post: Post;
  onReaction?: () => void;
  onPostDeleted?: () => void;
  onPostUpdated?: () => void;
}

const PostCard = ({ post, onReaction, onPostDeleted, onPostUpdated }: PostCardProps) => {
  const [reacting, setReacting] = useState(false);
  const [localReactions, setLocalReactions] = useState(post.reactions || []);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [badges, setBadges] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption || "");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const lastTapRef = useRef<number>(0);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!hasUserReacted("love")) {
        handleReaction("love");
      }
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
    }
    lastTapRef.current = now;
  }, [currentUserId, localReactions]);

  useEffect(() => {
    loadCommentCount();
    loadUserBadges();
    checkCurrentUser();
  }, [post.id]);

  const checkCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUserId(session?.user?.id || null);
  };

  const isOwner = currentUserId === post.user_id;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;

      haptics.success();
      toast.success("Post deleted");
      onPostDeleted?.();
    } catch (error: any) {
      haptics.error();
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({ caption: editCaption })
        .eq('id', post.id);

      if (error) throw error;

      haptics.success();
      toast.success("Post updated");
      setShowEditDialog(false);
      onPostUpdated?.();
    } catch (error: any) {
      haptics.error();
      toast.error("Failed to update post");
    } finally {
      setIsSaving(false);
    }
  };

  const loadCommentCount = async () => {
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);
    setCommentCount(count || 0);
  };

  const loadUserBadges = async () => {
    const { data } = await supabase
      .from('badges')
      .select('*')
      .eq('user_id', post.user_id);
    if (data) {
      setBadges(data);
    }
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

      const existingReaction = localReactions.find(
        (r) => r.user_id === session.user.id && r.reaction_type === reactionType
      );

      if (existingReaction) {
        // Optimistic remove
        setLocalReactions(prev => prev.filter(r => r.id !== existingReaction.id));
        await supabase.from("reactions").delete().eq("id", existingReaction.id);
      } else {
        // Optimistic add
        const tempId = crypto.randomUUID();
        const optimistic = {
          id: tempId,
          post_id: post.id,
          user_id: session.user.id,
          reaction_type: reactionType,
          created_at: new Date().toISOString(),
        };
        setLocalReactions(prev => [...prev, optimistic]);

        const { data } = await supabase.from("reactions").insert({
          post_id: post.id,
          user_id: session.user.id,
          reaction_type: reactionType,
        }).select().single();

        // Replace temp with real
        if (data) {
          setLocalReactions(prev => prev.map(r => r.id === tempId ? data : r));
        }

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

      onReaction?.();
    } catch {
      // Revert on error
      setLocalReactions(post.reactions || []);
      haptics.error();
      toast.error("Failed to react");
    } finally {
      setReacting(false);
    }
  };

  const getReactionCount = (type: string) => {
    return localReactions.filter((r) => r.reaction_type === type).length;
  };

  const hasUserReacted = (type: string) => {
    if (!currentUserId) return false;
    return localReactions.some(
      (r) => r.user_id === currentUserId && r.reaction_type === type
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
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm md:text-base font-semibold">{post.profiles.username}</span>
              <UserBadge badges={badges} size="sm" />
            </div>
            <div className="text-xs text-muted-foreground">
              {formatTimeAgo(post.created_at)}
            </div>
          </div>
        </div>
        
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setEditCaption(post.caption || "");
                setShowEditDialog(true);
              }}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit caption
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
            className={`gap-1 h-10 md:h-9 ${hasUserReacted("love") ? "text-red-500" : ""}`}
          >
            <Heart className={`w-4 h-4 md:w-5 md:h-5 ${hasUserReacted("love") ? "fill-current" : ""}`} />
            {getReactionCount("love") > 0 && (
              <span className="text-xs">{getReactionCount("love")}</span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={reacting}
            onClick={() => handleReaction("eyes")}
            className={`gap-1 h-10 md:h-9 ${hasUserReacted("eyes") ? "text-primary" : ""}`}
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

        {/* Comment preview when collapsed */}
        {!showComments && commentCount > 0 && (
          <button
            onClick={() => setShowComments(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
          >
            View {commentCount} comment{commentCount > 1 ? "s" : ""}
          </button>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Caption Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit caption</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editCaption}
            onChange={(e) => setEditCaption(e.target.value)}
            placeholder="Write a caption..."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PostCard;
