import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  MoreVertical, 
  Shield, 
  ShieldCheck, 
  Crown, 
  UserMinus, 
  Loader2 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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

interface MemberManagementProps {
  members: Member[];
  currentUserId: string;
  currentUserRole: string;
  communityId: string;
  onMemberUpdated: () => void;
}

export const MemberManagement = ({
  members,
  currentUserId,
  currentUserRole,
  communityId,
  onMemberUpdated
}: MemberManagementProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return (
          <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white gap-1">
            <Crown className="w-3 h-3" />
            Owner
          </Badge>
        );
      case "admin":
        return (
          <Badge variant="secondary" className="gap-1">
            <ShieldCheck className="w-3 h-3" />
            Admin
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Shield className="w-3 h-3" />
            Member
          </Badge>
        );
    }
  };

  const canManageMember = (memberRole: string) => {
    if (currentUserRole === "owner") return true;
    if (currentUserRole === "admin" && memberRole === "member") return true;
    return false;
  };

  const canChangeRole = () => currentUserRole === "owner";

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setUpdatingMemberId(memberId);
    const { error } = await supabase
      .from("community_members")
      .update({ role: newRole })
      .eq("id", memberId);

    if (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Role updated",
        description: `Member role has been updated to ${newRole}`
      });
      onMemberUpdated();
    }
    setUpdatingMemberId(null);
  };

  const handleRemoveMember = async (memberId: string, username: string) => {
    if (!confirm(`Remove ${username} from this community?`)) return;

    setUpdatingMemberId(memberId);
    const { error } = await supabase
      .from("community_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Member removed",
        description: `${username} has been removed from the community`
      });
      onMemberUpdated();
    }
    setUpdatingMemberId(null);
  };

  // Sort members: owner first, then admins, then members
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { owner: 0, admin: 1, moderator: 2, member: 3 };
    return (roleOrder[a.role as keyof typeof roleOrder] || 3) - (roleOrder[b.role as keyof typeof roleOrder] || 3);
  });

  return (
    <div className="space-y-3">
      {sortedMembers.map((member) => {
        const isCurrentUser = member.user_id === currentUserId;
        const showMenu = !isCurrentUser && canManageMember(member.role);

        return (
          <Card key={member.id} className="glass-card group">
            <CardContent className="p-3 flex items-center gap-3">
              <Avatar
                className="w-12 h-12 cursor-pointer ring-2 ring-transparent hover:ring-primary/50 transition-all"
                onClick={() => navigate(`/user/${member.user_id}`)}
              >
                <AvatarImage src={member.profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {member.profile?.username?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium truncate">{member.profile?.username || "Unknown"}</p>
                  {isCurrentUser && (
                    <span className="text-xs text-muted-foreground">(you)</span>
                  )}
                </div>
                <div className="mt-1">
                  {getRoleBadge(member.role)}
                </div>
              </div>

              {updatingMemberId === member.id ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : showMenu ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canChangeRole() && member.role !== "owner" && (
                      <>
                        {member.role !== "admin" && (
                          <DropdownMenuItem onClick={() => handleRoleChange(member.id, "admin")}>
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Make Admin
                          </DropdownMenuItem>
                        )}
                        {member.role === "admin" && (
                          <DropdownMenuItem onClick={() => handleRoleChange(member.id, "member")}>
                            <Shield className="w-4 h-4 mr-2" />
                            Remove Admin
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleRemoveMember(member.id, member.profile?.username || "this member")}
                    >
                      <UserMinus className="w-4 h-4 mr-2" />
                      Remove from Community
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
