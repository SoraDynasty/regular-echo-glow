import { useState } from "react";
import { Sparkles, Wand2, X, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import EllieChat from "./EllieChat";
import { haptics } from "@/lib/haptics";

interface EllieSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const EllieSidebar = ({ isOpen, onClose }: EllieSidebarProps) => {
  const [isCurating, setIsCurating] = useState(false);
  const [curateMessage, setCurateMessage] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [ellieState, setEllieState] = useState<string>("idle");

  const handleCurateVibe = () => {
    haptics.medium();
    setIsCurating(true);
    setCurateMessage(null);

    // Simulate thinking for 3 seconds, then show message
    setTimeout(() => {
      setIsCurating(false);
      setCurateMessage(
        "I've scrubbed the vanity metrics. Here is what actually matters today."
      );
      haptics.success();
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="relative w-full max-w-md h-full animate-slide-in-right flex flex-col"
        style={{
          background: "linear-gradient(180deg, hsla(240, 10%, 8%, 0.92), hsla(240, 10%, 5%, 0.96))",
          backdropFilter: "blur(40px)",
          borderLeft: "1px solid hsla(211, 85%, 62%, 0.15)",
          boxShadow: "-10px 0 60px hsla(211, 85%, 62%, 0.08), -2px 0 20px hsla(280, 60%, 60%, 0.05)",
        }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg"
            style={{ boxShadow: "0 0 20px hsla(211, 85%, 62%, 0.4)" }}
          >
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-lg text-glow-regulus">Ellie</h2>
            <p className="text-xs text-muted-foreground">Autonomous Feed Curator</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {showChat ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <EllieChat
              onClose={() => setShowChat(false)}
              onStateChange={(s) => setEllieState(s)}
              embedded
            />
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="px-5 py-6 space-y-6">
              {/* Curate My Vibe */}
              <div
                className="rounded-2xl p-5 relative overflow-hidden"
                style={{
                  background: "hsla(240, 10%, 12%, 0.7)",
                  border: "1px solid hsla(211, 85%, 62%, 0.12)",
                }}
              >
                {/* Glow accent */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 blur-3xl"
                  style={{ background: "hsl(211, 85%, 62%)" }}
                />

                <div className="relative">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    Agentic Curation
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Let Ellie autonomously curate your feed — cutting noise, surfacing what resonates.
                  </p>

                  <Button
                    onClick={handleCurateVibe}
                    disabled={isCurating}
                    className="w-full rounded-xl h-12 font-semibold text-sm gap-2 transition-all"
                    variant="regulus"
                  >
                    {isCurating ? (
                      <>
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-primary-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 rounded-full bg-primary-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 rounded-full bg-primary-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        Ellie is thinking...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Curate My Vibe
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Curate result message */}
              {curateMessage && (
                <div
                  className="rounded-2xl p-4 animate-fade-in"
                  style={{
                    background: "hsla(211, 85%, 62%, 0.08)",
                    border: "1px solid hsla(211, 85%, 62%, 0.2)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <p className="text-sm leading-relaxed">{curateMessage}</p>
                  </div>
                </div>
              )}

              {/* Chat with Ellie */}
              <button
                onClick={() => setShowChat(true)}
                className="w-full rounded-2xl p-4 text-left transition-all hover:scale-[1.01]"
                style={{
                  background: "hsla(240, 10%, 12%, 0.5)",
                  border: "1px solid hsla(210, 20%, 98%, 0.06)",
                }}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Chat with Ellie</p>
                    <p className="text-xs text-muted-foreground">Ask anything — code, research, ideas</p>
                  </div>
                </div>
              </button>

              {/* GhostMode info card */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "hsla(220, 10%, 15%, 0.5)",
                  border: "1px solid hsla(220, 10%, 45%, 0.15)",
                }}
              >
                <h4 className="text-sm font-semibold mb-2 text-glow-ghost flex items-center gap-2">
                  🌫️ GhostMode Active
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your tiered privacy is on. Browse as Observer, Ghost, or Echo — your presence, your rules.
                </p>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default EllieSidebar;
