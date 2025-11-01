import { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type RayState = "idle" | "listening" | "cooking" | "responding";

interface RayChatProps {
  onClose: () => void;
  onStateChange: (state: RayState) => void;
}

const cookingMessages = [
  "Hang tight fam, I'm cooking this up 👀",
  "One sec… seasoning the answer 🔥",
  "Cooking something fresh for you 🍳",
  "Ray is cooking 🍳",
  "Cooking something up…"
];

const RayChat = ({ onClose, onStateChange }: RayChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Yo! I'm Ray, your Regulargram buddy 👋 What's good? Need help posting, understanding modes, or just wanna chat?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    onStateChange("cooking");

    const cookingMsg = cookingMessages[Math.floor(Math.random() * cookingMessages.length)];
    setMessages(prev => [...prev, { role: "assistant", content: cookingMsg }]);

    try {
      const { data, error } = await supabase.functions.invoke("ray-chat", {
        body: { 
          messages: [...messages, { role: "user", content: userMessage }]
        }
      });

      if (error) throw error;

      onStateChange("responding");
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: data.message
        };
        return newMessages;
      });
    } catch (error) {
      console.error("Ray chat error:", error);
      toast.error("Yo, something went wrong. Try again?");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      onStateChange("idle");
    }
  };

  return (
    <div className="bg-background/95 backdrop-blur-xl border border-border rounded-3xl shadow-2xl overflow-hidden h-[500px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-purple-500/10 relative">
        <h3 className="font-bold text-lg">Ray 🤖</h3>
        <p className="text-xs text-muted-foreground">Your Regulargram AI buddy</p>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-2 right-2 rounded-full w-8 h-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                } ${isLoading && idx === messages.length - 1 && msg.role === "assistant" ? "ray-cooking-text" : ""}`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask Ray anything..."
            className="rounded-full"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="rounded-full"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RayChat;
