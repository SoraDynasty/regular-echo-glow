import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StoryRingProps {
  avatarUrl?: string | null;
  username: string;
  isViewed?: boolean;
  isOwn?: boolean;
  isAddNew?: boolean;
  onClick?: () => void;
}

const StoryRing = ({ 
  avatarUrl, 
  username, 
  isViewed = false, 
  isOwn = false,
  isAddNew = false,
  onClick 
}: StoryRingProps) => {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 min-w-[72px] tap-scale"
    >
      <div 
        className={cn(
          "relative p-0.5 rounded-full",
          isAddNew 
            ? "bg-muted" 
            : isViewed 
              ? "bg-muted/50" 
              : "bg-gradient-to-tr from-primary via-purple-500 to-pink-500"
        )}
      >
        <div className="bg-background p-0.5 rounded-full">
          <Avatar className="w-14 h-14 border-2 border-background">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="text-sm font-semibold">
              {username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {isAddNew && (
          <div className="absolute bottom-0 right-0 bg-primary rounded-full p-0.5 border-2 border-background">
            <Plus className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
      </div>
      
      <span className={cn(
        "text-xs truncate max-w-[68px]",
        isOwn ? "font-medium" : "text-muted-foreground"
      )}>
        {isOwn ? "Your story" : username}
      </span>
    </button>
  );
};

export default StoryRing;