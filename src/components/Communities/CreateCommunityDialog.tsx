import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Globe, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreateCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export const CreateCommunityDialog = ({
  open,
  onOpenChange,
  onCreated
}: CreateCommunityDialogProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "private">("public");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a community name",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Not authenticated",
        description: "Please log in to create a community",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Create community
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        privacy,
        creator_id: session.user.id
      })
      .select()
      .single();

    if (communityError) {
      console.error("Error creating community:", communityError);
      toast({
        title: "Error",
        description: "Failed to create community",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Add creator as owner
    const { error: memberError } = await supabase
      .from("community_members")
      .insert({
        community_id: community.id,
        user_id: session.user.id,
        role: "owner"
      });

    if (memberError) {
      console.error("Error adding creator as member:", memberError);
    }

    setLoading(false);
    toast({
      title: "Community created!",
      description: `${name} has been created successfully`
    });

    // Reset form
    setName("");
    setDescription("");
    setPrivacy("public");
    onOpenChange(false);
    onCreated();

    // Navigate to the new community
    navigate(`/community/${community.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Community</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Community Name</Label>
            <Input
              id="name"
              placeholder="Enter community name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What's your community about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label>Privacy</Label>
            <RadioGroup
              value={privacy}
              onValueChange={(value) => setPrivacy(value as "public" | "private")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="flex items-center gap-2 cursor-pointer">
                  <Globe className="w-4 h-4" />
                  Public
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="flex items-center gap-2 cursor-pointer">
                  <Lock className="w-4 h-4" />
                  Private
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              {privacy === "public"
                ? "Anyone can find and join this community"
                : "Only invited members can join"}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
