import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import EllieSidebar from "./EllieSidebar";
import { haptics } from "@/lib/haptics";
import { supabase } from "@/integrations/supabase/client";
import { useEllie } from "@/contexts/EllieContext";

const EllieFloatingIcon = () => {
  const { isEllieOpen, setIsEllieOpen } = useEllie();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleOpen = () => {
    if (!isEllieOpen) {
      haptics.light();
      setIsEllieOpen(true);
    }
  };

  const handleClose = () => {
    haptics.light();
    setIsEllieOpen(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Floating Icon - only show when sidebar is closed */}
      {!isEllieOpen && (
        <div className="fixed bottom-28 right-6 z-50">
          <Button
            onClick={handleOpen}
            size="icon"
            className="w-14 h-14 rounded-full shadow-lg ellie-idle transition-all duration-300 bg-gradient-to-br from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
          >
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </Button>
        </div>
      )}

      {/* Sidebar */}
      <EllieSidebar isOpen={isEllieOpen} onClose={handleClose} />
    </>
  );
};

export default EllieFloatingIcon;
