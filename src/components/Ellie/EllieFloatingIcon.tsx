import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import EllieChat from "./EllieChat";
import { haptics } from "@/lib/haptics";
import { supabase } from "@/integrations/supabase/client";

type EllieState = "idle" | "listening" | "cooking" | "responding" | "recording" | "transcribing" | "speaking";

const EllieFloatingIcon = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [ellieState, setEllieState] = useState<EllieState>("idle");
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
    if (!isOpen) {
      haptics.light();
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    haptics.light();
    setIsOpen(false);
  };

  const getGlowClass = () => {
    switch (ellieState) {
      case "idle":
        return "ellie-idle";
      case "listening":
        return "ellie-listening";
      case "recording":
        return "ellie-listening";
      case "transcribing":
        return "ellie-cooking";
      case "cooking":
        return "ellie-cooking";
      case "responding":
        return "ellie-responding";
      case "speaking":
        return "ellie-responding";
      default:
        return "ellie-idle";
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Floating Icon - only show when chat is closed */}
      {!isOpen && (
        <div className="fixed bottom-28 right-6 z-50">
          <Button
            onClick={handleOpen}
            size="icon"
            className={`w-14 h-14 rounded-full shadow-lg ${getGlowClass()} transition-all duration-300`}
          >
            <Send className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* Chat Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center p-4 pb-24 pointer-events-none">
          <div className="w-full max-w-md pointer-events-auto animate-fade-in">
            <EllieChat onClose={handleClose} onStateChange={setEllieState} />
          </div>
        </div>
      )}
    </>
  );
};

export default EllieFloatingIcon;
