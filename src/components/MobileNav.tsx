import { Home, Camera, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Feed", path: "/feed" },
    { icon: Camera, label: "Capture", path: "/capture" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 backdrop-blur-xl safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Button
              key={path}
              variant="ghost"
              size="icon"
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 h-14 w-20 rounded-xl transition-all",
                isActive && "bg-primary/10 text-primary"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "glow-regulus")} />
              <span className="text-[10px] font-medium">{label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
