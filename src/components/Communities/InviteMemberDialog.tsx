import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, UserPlus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  currentUserRole: string;
  existingMemberIds: string[];
  onMemberAdded: () => void;
}

interface UserResult {
  id: string;
  username: string;
  avatar_url: string | null;
  full_name: string | null;
}

export const InviteMemberDialog = ({
  open,
  onOpenChange,
  communityId,
  currentUserRole,
  existingMemberIds,
  onMemberAdded
}: InviteMemberDialogProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("member");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    setSearching(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, full_name")
      .ilike("username", `%${searchQuery}%`)
      .not("id", "in", `(${existingMemberIds.join(",")})`)
      .limit(10);

    if (!error && data) {
      setSearchResults(data);
    }
    setSearching(false);
  };

  const handleAddMember = async () => {
    if (!selectedUser) return;

    setAdding(true);
    const { error } = await supabase
      .from("community_members")
      .insert({
        community_id: communityId,
        user_id: selectedUser.id,
        role: selectedRole
      });

    if (error) {
      console.error("Error adding member:", error);
      toast({
        title: "Error",
        description: "Failed to add member",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Member added",
        description: `${selectedUser.username} has been added to the community`
      });
      setSelectedUser(null);
      setSearchQuery("");
      setSelectedRole("member");
      onMemberAdded();
      onOpenChange(false);
    }
    setAdding(false);
  };

  const canAssignRole = (role: string) => {
    if (currentUserRole === "owner") return true;
    if (currentUserRole === "admin" && role === "member") return true;
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite Member
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label>Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedUser(null);
                }}
                className="pl-10"
              />
            </div>
          </div>

          {/* Search Results */}
          {searching && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!searching && searchResults.length > 0 && !selectedUser && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  onClick={() => setSelectedUser(user)}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-medium">{user.username}</p>
                    {user.full_name && (
                      <p className="text-sm text-muted-foreground">{user.full_name}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected User */}
          {selectedUser && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback>{selectedUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{selectedUser.username}</p>
                  {selectedUser.full_name && (
                    <p className="text-sm text-muted-foreground">{selectedUser.full_name}</p>
                  )}
                </div>
                <Check className="w-5 h-5 text-primary" />
              </div>

              {/* Role Selection */}
              <div className="mt-4 space-y-2">
                <Label>Assign Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    {canAssignRole("admin") && (
                      <SelectItem value="admin">Admin</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {selectedRole === "admin" 
                    ? "Admins can manage content and invite members"
                    : "Members can view and participate in the community"}
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No users found
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleAddMember}
              disabled={!selectedUser || adding}
            >
              {adding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Add Member"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
