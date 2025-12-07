import { Home, Users, UsersRound, Camera, MessageCircle, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    haptics.light();
    navigate(path);
  };

  const navItems = [
    { icon: Home, label: "Home", path: "/feed" },
    { icon: Users, label: "Friends", path: "/friends" },
    { icon: Camera, label: "", path: "/capture", isCenter: true },
    { icon: MessageCircle, label: "Chat", path: "/chat" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/50 safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-20 px-2">
        {navItems.map(({ icon: Icon, label, path, isCenter }) => {
          const isActive = location.pathname === path;
          
          if (isCenter) {
            return (
              <Button
                key={path}
                variant="ghost"
                size="icon"
                onClick={() => handleNavigate(path)}
                className="h-16 w-16 rounded-2xl bg-foreground text-background hover:bg-foreground/90 -mt-4"
              >
                <Icon className="w-8 h-8" />
              </Button>
            );
          }
          
          return (
            <Button
              key={path}
              variant="ghost"
              size="icon"
              onClick={() => handleNavigate(path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 h-16 w-16 rounded-xl transition-all",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[9px] font-medium">{label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
