import { useState, useRef, useEffect, useCallback } from "react";
import { Send, X, Mic, Square, Volume2, Sparkles, ArrowLeft, Code, Lightbulb, FileText, Palette, Calculator, Globe, Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AudioRecorder, AudioPlayer } from "@/lib/audioUtils";
import { haptics } from "@/lib/haptics";
import ConversationHistory from "./ConversationHistory";

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

const quickPrompts = [
  { icon: Code, label: "Write code", prompt: "Help me write code for " },
  { icon: Lightbulb, label: "Brainstorm", prompt: "Help me brainstorm ideas for " },
  { icon: FileText, label: "Write content", prompt: "Help me write " },
  { icon: Palette, label: "Design ideas", prompt: "Give me design ideas for " },
  { icon: Calculator, label: "Solve problem", prompt: "Help me solve this problem: " },
  { icon: Globe, label: "Research", prompt: "Help me research " },
];

const EllieChat = ({ onClose, onStateChange }: EllieChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mood, setMood] = useState<EllieMood>("default");
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load conversation on mount
  useEffect(() => {
    loadConversation();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    audioPlayerRef.current = new AudioPlayer();
    return () => {
      audioPlayerRef.current?.stop();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Save conversation whenever messages change (debounced)
  const saveConversation = useCallback(async (msgs: Message[], currentMood: EllieMood, convId: string | null) => {
    if (msgs.length === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (convId) {
        // Update existing conversation
        await supabase
          .from('ellie_conversations')
          .update({ messages: msgs, mood: currentMood })
          .eq('id', convId);
      } else {
        // Create new conversation
        const { data, error } = await supabase
          .from('ellie_conversations')
          .insert({ user_id: user.id, messages: msgs, mood: currentMood })
          .select('id')
          .single();

        if (!error && data) {
          setConversationId(data.id);
        }
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;

    // Debounce save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveConversation(messages, mood, conversationId);
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [messages, mood, conversationId, saveConversation]);

  const loadConversation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get most recent conversation
      const { data, error } = await supabase
        .from('ellie_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setMessages(data.messages as Message[]);
        setMood(data.mood as EllieMood);
        setConversationId(data.id);
      }
    } catch (error) {
      // No conversation found, start fresh
      console.log('No existing conversation found');
    }
  };

  const clearConversation = async () => {
    try {
      if (conversationId) {
        await supabase
          .from('ellie_conversations')
          .delete()
          .eq('id', conversationId);
      }
      setMessages([]);
      setConversationId(null);
      haptics.medium();
      toast.success("Conversation cleared");
    } catch (error) {
      console.error('Error clearing conversation:', error);
      toast.error("Couldn't clear conversation");
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setMood("default");
    haptics.light();
  };

  const switchToConversation = (conv: { id: string; messages: any; mood: string }) => {
    setMessages(conv.messages as Message[]);
    setMood(conv.mood as EllieMood);
    setConversationId(conv.id);
    haptics.light();
  };

  const sendMessage = async (messageText?: string) => {
    const userMessage = messageText || input.trim();
    if (!userMessage || isLoading) return;
    
    setInput("");
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);
    setIsStreaming(true);
    onStateChange("cooking");

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Add placeholder for streaming response
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ellie-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: newMessages,
            mood,
            stream: true
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      onStateChange("responding");
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullMessage = "";

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || "";
                  if (content) {
                    fullMessage += content;
                    setMessages(prev => {
                      const updated = [...prev];
                      updated[updated.length - 1] = { role: "assistant", content: fullMessage };
                      return updated;
                    });
                  }
                } catch {
                  // Skip invalid JSON chunks
                }
              }
            }
          }
        } catch (readError) {
          if (readError instanceof Error && readError.name === 'AbortError') {
            console.log("Stream aborted by user");
          } else {
            throw readError;
          }
        }
      }

      if (fullMessage && !abortControllerRef.current?.signal.aborted) {
        await generateSpeech(fullMessage);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log("Request aborted by user");
        toast.success("Generation stopped");
      } else {
        console.error("Ellie chat error:", error);
        toast.error("Something went wrong. Try again?");
        // Remove empty assistant message on error
        setMessages(prev => prev.filter(m => m.content !== ""));
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
      onStateChange("idle");
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      haptics.medium();
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
        await sendMessage(data.text);
      }
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error("Couldn't transcribe audio");
      onStateChange("idle");
    }
  };

  const stopSpeaking = () => {
    audioPlayerRef.current?.stop();
    setIsSpeaking(false);
    onStateChange("idle");
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const currentMood = moodConfig[mood];

  const renderMessageContent = (content: string) => {
    // Parse code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith("```")) {
        const lines = part.slice(3, -3).split("\n");
        const language = lines[0] || "code";
        const code = lines.slice(1).join("\n");
        return (
          <div key={i} className="my-3 rounded-xl overflow-hidden bg-black/50">
            <div className="flex items-center justify-between px-4 py-2 bg-black/30 text-xs text-muted-foreground">
              <span>{language}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  toast.success("Copied!");
                }}
                className="hover:text-foreground transition-colors"
              >
                Copy
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code>{code}</code>
            </pre>
          </div>
        );
      }
      return <span key={i} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="safe-area-top px-4 py-3 border-b border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Ellie</h1>
              <p className="text-xs text-muted-foreground">Your AI assistant</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHistory(true)}
              className="rounded-full text-muted-foreground"
            >
              <History className="w-4 h-4" />
            </Button>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearConversation}
                className="rounded-full text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            
            <button
              onClick={() => setShowMoodSelector(!showMoodSelector)}
              className={`text-xs px-3 py-1.5 rounded-full ${currentMood.color} text-white flex items-center gap-1`}
            >
              {currentMood.emoji} {currentMood.label}
            </button>
          </div>
        </div>
        
        {/* Mood Selector */}
        {showMoodSelector && (
          <div className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border p-3 z-50">
            <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
              {(Object.keys(moodConfig) as EllieMood[]).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMood(m);
                    setShowMoodSelector(false);
                    haptics.light();
                  }}
                  className={`p-3 rounded-xl text-center transition-all ${
                    mood === m ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-muted"
                  }`}
                >
                  <span className="text-xl">{moodConfig[m].emoji}</span>
                  <p className="text-xs mt-1">{moodConfig[m].label}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Hey there! I'm Ellie</h2>
              <p className="text-muted-foreground mb-8 max-w-md">
                Your powerful AI assistant. I can write code, brainstorm ideas, solve problems, create content, and so much more.
              </p>
              
              {/* Quick Prompts */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
                {quickPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickPrompt(item.prompt)}
                    className="flex items-center gap-2 p-3 rounded-2xl transition-colors text-left bg-muted/50 hover:bg-muted"
                  >
                    <item.icon className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] ${msg.role === "user" ? "" : "w-full"}`}>
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-medium">Ellie</span>
                      </div>
                    )}
                    <div className={`rounded-2xl px-4 py-3 ${
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted"
                    }`}>
                      <div className="text-sm leading-relaxed">
                        {msg.role === "assistant" ? renderMessageContent(msg.content) : msg.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white animate-pulse" />
                    </div>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="safe-area-bottom px-4 py-4 border-t border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === "Enter" && !isRecording && sendMessage()}
            placeholder={isRecording ? "Listening..." : "Ask me anything..."}
            className="rounded-full h-12 text-base"
            disabled={isLoading || isRecording}
          />
          
          {isSpeaking ? (
            <Button onClick={stopSpeaking} size="icon" className="rounded-full w-12 h-12 bg-destructive hover:bg-destructive/90">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </Button>
          ) : isRecording ? (
            <Button onClick={stopRecording} size="icon" className="rounded-full w-12 h-12 bg-destructive hover:bg-destructive/90 animate-pulse">
              <Square className="w-5 h-5" />
            </Button>
          ) : isStreaming ? (
            <Button onClick={stopGeneration} size="icon" className="rounded-full w-12 h-12 bg-destructive hover:bg-destructive/90">
              <Square className="w-5 h-5" />
            </Button>
          ) : (
            <>
              <Button onClick={startRecording} disabled={isLoading} size="icon" className="rounded-full w-12 h-12" variant="outline">
                <Mic className="w-5 h-5" />
              </Button>
              <Button onClick={() => sendMessage()} disabled={isLoading || !input.trim()} size="icon" className="rounded-full w-12 h-12">
                <Send className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EllieChat;
