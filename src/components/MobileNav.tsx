import { Home, Users, Camera, Send, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden">
      {/* Background extends to screen edge, content respects safe area */}
      <div className="bg-background backdrop-blur-xl border-t border-border/30">
        <div className="flex items-center justify-around h-16 px-2 safe-area-bottom">
          {navItems.map(({ icon: Icon, label, path, isCenter }) => {
            const isActive = location.pathname === path;
            
            if (isCenter) {
              return (
                <button
                  key={path}
                  onClick={() => handleNavigate(path)}
                  className="flex items-center justify-center h-14 w-14 rounded-full bg-foreground text-background -mt-6 shadow-lg active:scale-95 transition-transform duration-150"
                >
                  <Icon className="w-7 h-7" />
                </button>
              );
            }
            
            return (
              <button
                key={path}
                onClick={() => handleNavigate(path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 h-12 w-14 rounded-xl transition-all duration-200 active:scale-95",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("w-6 h-6 transition-transform duration-200", isActive && "scale-110")} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default MobileNav;
