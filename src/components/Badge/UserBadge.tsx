import { Badge } from "@/components/ui/badge";
import { Crown, Ghost, Eye, Radio, Award } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BadgeData {
  badge_type: 'ghost' | 'observer' | 'echo' | 'regulus' | 'founders_circle';
  badge_number: number;
}

interface UserBadgeProps {
  badges: BadgeData[];
  size?: 'sm' | 'md' | 'lg';
}

const badgeConfig = {
  ghost: {
    icon: Ghost,
    label: "Ghost",
    tagline: "You were here before the noise.",
    className: "bg-white/10 text-white border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] animate-pulse",
  },
  observer: {
    icon: Eye,
    label: "Observer",
    tagline: "Seeing everything, saying nothing.",
    className: "bg-slate-200/20 text-slate-300 border-slate-300/40 shadow-[0_0_20px_rgba(203,213,225,0.3)] hover:shadow-[0_0_30px_rgba(203,213,225,0.5)]",
  },
  echo: {
    icon: Radio,
    label: "Echo",
    tagline: "You made Regulargram echo.",
    className: "bg-blue-500/20 text-blue-400 border-blue-400/40 shadow-[0_0_20px_rgba(96,165,250,0.4)] hover:shadow-[0_0_30px_rgba(96,165,250,0.6)] animate-pulse",
  },
  regulus: {
    icon: Crown,
    label: "Regulus",
    tagline: "You started the signal.",
    className: "bg-yellow-500/20 text-yellow-400 border-yellow-400/40 shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:shadow-[0_0_30px_rgba(250,204,21,0.6)] animate-pulse",
  },
  founders_circle: {
    icon: Award,
    label: "Founder's Circle",
    tagline: "You were there when it began.",
    className: "bg-gradient-to-r from-white/10 via-blue-500/20 to-yellow-500/20 text-white border-white/40 shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:shadow-[0_0_35px_rgba(255,255,255,0.6)] animate-pulse",
  },
};

const sizeConfig = {
  sm: { iconSize: 12, badgeClass: "h-5 px-1.5 text-[10px]" },
  md: { iconSize: 14, badgeClass: "h-6 px-2 text-xs" },
  lg: { iconSize: 16, badgeClass: "h-7 px-2.5 text-sm" },
};

export const UserBadge = ({ badges, size = 'md' }: UserBadgeProps) => {
  if (!badges || badges.length === 0) return null;

  const { iconSize, badgeClass } = sizeConfig[size];

  // Sort badges: Founder's Circle first, then by badge number
  const sortedBadges = [...badges].sort((a, b) => {
    if (a.badge_type === 'founders_circle') return -1;
    if (b.badge_type === 'founders_circle') return 1;
    return a.badge_number - b.badge_number;
  });

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {sortedBadges.map((badge) => {
        const config = badgeConfig[badge.badge_type];
        const Icon = config.icon;
        
        return (
          <TooltipProvider key={badge.badge_type}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={`${config.className} ${badgeClass} transition-all duration-300 cursor-help flex items-center gap-1`}
                >
                  <Icon size={iconSize} />
                  <span className="font-bold">#{badge.badge_number}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="glass-card border-border">
                <div className="text-center">
                  <div className="font-bold mb-1">{config.label}</div>
                  <div className="text-xs text-muted-foreground">{config.tagline}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {badge.badge_type === 'founders_circle' 
                      ? `First ${badge.badge_number} of 500 users`
                      : `First ${badge.badge_number} of 1,000`}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};
