import { useState } from "react";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import RayChat from "./RayChat";
import { haptics } from "@/lib/haptics";

type RayState = "idle" | "listening" | "cooking" | "responding";

const RayFloatingIcon = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [rayState, setRayState] = useState<RayState>("idle");

  const handleToggle = () => {
    haptics.light();
    setIsOpen(!isOpen);
  };

  const getGlowClass = () => {
    switch (rayState) {
      case "idle":
        return "ray-idle";
      case "listening":
        return "ray-listening";
      case "cooking":
        return "ray-cooking";
      case "responding":
        return "ray-responding";
      default:
        return "ray-idle";
    }
  };

  return (
    <>
      {/* Floating Icon */}
      <div className="fixed bottom-24 right-6 z-50">
        <Button
          onClick={handleToggle}
          className={`w-14 h-14 rounded-full shadow-2xl transition-all duration-300 ${getGlowClass()}`}
          variant="default"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Send className="w-6 h-6" />
          )}
        </Button>
      </div>

      {/* Chat Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center p-4 pb-24 pointer-events-none">
          <div className="w-full max-w-md pointer-events-auto animate-fade-in">
            <RayChat 
              onClose={handleToggle} 
              onStateChange={setRayState}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default RayFloatingIcon;
