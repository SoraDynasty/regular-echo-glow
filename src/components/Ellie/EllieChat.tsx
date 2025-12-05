import { useState, useRef, useEffect } from "react";
import { Send, X, Mic, Square, Volume2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AudioRecorder, AudioPlayer } from "@/lib/audioUtils";
import { haptics } from "@/lib/haptics";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export type EllieMood = "default" | "unhinged" | "lazy_guy" | "romantic" | "formal" | "quiet" | "lazy_girl";

type EllieState = "idle" | "listening" | "cooking" | "responding" | "recording" | "transcribing" | "speaking";

interface EllieChatProps {
  onClose: () => void;
  onStateChange: (state: EllieState) => void;
}

const moodConfig: Record<EllieMood, { label: string; emoji: string; color: string }> = {
  default: { label: "Default", emoji: "✨", color: "bg-primary" },
  unhinged: { label: "Unhinged", emoji: "🔥", color: "bg-red-500" },
  lazy_guy: { label: "Lazy Guy", emoji: "😴", color: "bg-blue-500" },
  romantic: { label: "Romantic", emoji: "💕", color: "bg-pink-500" },
  formal: { label: "Formal", emoji: "🎩", color: "bg-slate-600" },
  quiet: { label: "Quiet", emoji: "🤫", color: "bg-purple-500" },
  lazy_girl: { label: "Lazy Girl", emoji: "💅", color: "bg-orange-400" },
};

const cookingMessages = [
  "Hang tight fam, I'm cooking this up 👀",
  "One sec… seasoning the answer 🔥",
  "Cooking something fresh for you 🍳",
  "Ellie is cooking 🍳",
  "Cooking something up…"
];

const EllieChat = ({ onClose, onStateChange }: EllieChatProps) => {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Yo! I'm Ellie, your Regulargram buddy 👋 What's good? Need help posting, understanding modes, or just wanna chat?"
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mood, setMood] = useState<EllieMood>("default");
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    audioPlayerRef.current = new AudioPlayer();
    return () => {
      audioPlayerRef.current?.stop();
    };
  }, []);

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
      const { data, error } = await supabase.functions.invoke("ellie-chat", {
        body: {
          messages: [...messages, { role: "user", content: userMessage }],
          mood
        }
      });

      if (error) throw error;

      onStateChange("responding");
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { role: "assistant", content: data.message };
        return newMessages;
      });

      if (data.message) {
        await generateSpeech(data.message);
      }
    } catch (error) {
      console.error("Ellie chat error:", error);
      toast.error("Yo, something went wrong. Try again?");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      onStateChange("idle");
    }
  };

  const generateSpeech = async (text: string) => {
    try {
      setIsSpeaking(true);
      onStateChange("speaking");

      const { data, error } = await supabase.functions.invoke("text-to-speech", {
        body: { text }
      });

      if (error) throw error;
      await audioPlayerRef.current?.play(data.audioContent);
    } catch (error) {
      console.error("TTS error:", error);
    } finally {
      setIsSpeaking(false);
      onStateChange("idle");
    }
  };

  const startRecording = async () => {
    try {
      haptics.light();
      audioRecorderRef.current = new AudioRecorder();
      await audioRecorderRef.current.start();
      setIsRecording(true);
      onStateChange("recording");
      toast.success("Listening...");
    } catch (error) {
      console.error("Recording error:", error);
      toast.error("Couldn't access microphone");
    }
  };

  const stopRecording = async () => {
    if (!audioRecorderRef.current) return;

    try {
      haptics.medium();
      setIsRecording(false);
      onStateChange("transcribing");
      
      const base64Audio = await audioRecorderRef.current.stop();
      
      const { data, error } = await supabase.functions.invoke("speech-to-text", {
        body: { audio: base64Audio }
      });

      if (error) throw error;

      if (data.text) {
        setInput(data.text);
        const userMessage = data.text;
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);
        onStateChange("cooking");
        
        const cookingMsg = cookingMessages[Math.floor(Math.random() * cookingMessages.length)];
        setMessages(prev => [...prev, { role: "assistant", content: cookingMsg }]);

        const { data: chatData, error: chatError } = await supabase.functions.invoke("ellie-chat", {
          body: {
            messages: [...messages, { role: "user", content: userMessage }],
            mood
          }
        });

        if (chatError) throw chatError;

        onStateChange("responding");
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: "assistant", content: chatData.message };
          return newMessages;
        });

        await generateSpeech(chatData.message);
      }
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error("Couldn't transcribe audio");
      onStateChange("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const stopSpeaking = () => {
    audioPlayerRef.current?.stop();
    setIsSpeaking(false);
    onStateChange("idle");
  };

  const currentMood = moodConfig[mood];

  return (
    <div className="bg-background/95 backdrop-blur-xl border border-border rounded-3xl shadow-2xl overflow-hidden h-[500px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-purple-500/10 relative">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-lg">Ellie</h3>
          <button
            onClick={() => setShowMoodSelector(!showMoodSelector)}
            className={`text-xs px-2 py-1 rounded-full ${currentMood.color} text-white flex items-center gap-1`}
          >
            {currentMood.emoji} {currentMood.label}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Your Regulargram AI buddy</p>
        <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-2 right-2 rounded-full w-8 h-8">
          <X className="w-4 h-4" />
        </Button>
        
        {/* Mood Selector */}
        {showMoodSelector && (
          <div className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border border-border rounded-2xl p-2 mt-2 z-50 mx-2 shadow-xl">
            <div className="grid grid-cols-4 gap-1">
              {(Object.keys(moodConfig) as EllieMood[]).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMood(m);
                    setShowMoodSelector(false);
                    haptics.light();
                  }}
                  className={`p-2 rounded-xl text-center transition-all ${
                    mood === m ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-muted"
                  }`}
                >
                  <span className="text-lg">{moodConfig[m].emoji}</span>
                  <p className="text-[10px] mt-1">{moodConfig[m].label}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                msg.role === "user" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-foreground"
              } ${isLoading && idx === messages.length - 1 && msg.role === "assistant" ? "ellie-cooking-text" : ""}`}>
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
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === "Enter" && !isRecording && sendMessage()}
            placeholder={isRecording ? "Listening..." : "Ask Ellie anything..."}
            className="rounded-full"
            disabled={isLoading || isRecording}
          />
          
          {isSpeaking ? (
            <Button onClick={stopSpeaking} size="icon" className="rounded-full bg-red-500 hover:bg-red-600">
              <Volume2 className="w-4 h-4 animate-pulse" />
            </Button>
          ) : isRecording ? (
            <Button onClick={stopRecording} size="icon" className="rounded-full bg-red-500 hover:bg-red-600 animate-pulse">
              <Square className="w-4 h-4" />
            </Button>
          ) : (
            <>
              <Button onClick={startRecording} disabled={isLoading} size="icon" className="rounded-full" variant="outline">
                <Mic className="w-4 h-4" />
              </Button>
              <Button onClick={sendMessage} disabled={isLoading || !input.trim()} size="icon" className="rounded-full">
                <Send className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EllieChat;
