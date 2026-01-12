import { Home, Users, Camera, Send } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userInitial, setUserInitial] = useState("U");

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, username, full_name')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setAvatarUrl(profile.avatar_url);
          setUserInitial((profile.full_name?.[0] || profile.username?.[0] || 'U').toUpperCase());
        }
      }
    };
    fetchUserProfile();
  }, []);

  const handleNavigate = (path: string) => {
    if (location.pathname !== path) {
      haptics.light();
      navigate(path);
    }
  };

  const navItems = [
    { icon: Home, label: "Home", path: "/feed" },
    { icon: Users, label: "Friends", path: "/friends" },
    { icon: Camera, label: "", path: "/capture", isCenter: true },
    { icon: Send, label: "Chat", path: "/chat" },
    { label: "Profile", path: "/profile", isProfile: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden px-4 pb-2">
      <div className="bg-zinc-900/95 backdrop-blur-xl rounded-[28px] shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around h-20 px-4 safe-area-bottom">
          {navItems.map(({ icon: Icon, label, path, isCenter, isProfile }) => {
            const isActive = location.pathname === path;
            
            if (isCenter) {
              return (
                <button
                  key={path}
                  onClick={() => handleNavigate(path)}
                  className="flex items-center justify-center h-16 w-16 rounded-2xl bg-white -mt-4 shadow-lg transition-all duration-200 active:scale-90 hover:shadow-xl hover:scale-105"
                >
                  <Camera className="w-8 h-8 text-zinc-900" strokeWidth={1.5} />
                </button>
              );
            }

            if (isProfile) {
              return (
                <button
                  key={path}
                  onClick={() => handleNavigate(path)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 h-14 w-16 rounded-xl transition-all duration-200 active:scale-90",
                    isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Avatar className={cn(
                    "w-7 h-7 ring-2 transition-all duration-200",
                    isActive ? "ring-white" : "ring-zinc-600"
                  )}>
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="text-xs bg-zinc-700 text-white">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <span className={cn(
                    "text-xs font-medium transition-all duration-200",
                    isActive && "font-semibold"
                  )}>{label}</span>
                </button>
              );
            }
            
            return (
              <button
                key={path}
                onClick={() => handleNavigate(path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 h-14 w-16 rounded-xl transition-all duration-200 active:scale-90",
                  isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {Icon && <Icon className={cn(
                  "w-7 h-7 transition-all duration-200",
                  isActive && "drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                )} fill={isActive ? "currentColor" : "none"} />}
                <span className={cn(
                  "text-xs font-medium transition-all duration-200",
                  isActive && "font-semibold"
                )}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default MobileNav;
