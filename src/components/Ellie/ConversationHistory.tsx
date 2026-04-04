import { useState, useEffect, useMemo } from "react";
import { Plus, MessageSquare, Trash2, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";

type Message = {
  role: "user" | "assistant";
  content: string;
};

interface Conversation {
  id: string;
  messages: Message[];
  mood: string;
  created_at: string;
  updated_at: string;
}

interface ConversationHistoryProps {
  currentConversationId: string | null;
  onSelectConversation: (conv: Conversation) => void;
  onNewConversation: () => void;
  onClose: () => void;
}

const moodEmojis: Record<string, string> = {
  default: "✨",
  unhinged: "🔥",
  lazy_guy: "😴",
  romantic: "💕",
  formal: "🎩",
  quiet: "🤫",
  lazy_girl: "💅",
};

const ConversationHistory = ({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onClose,
}: ConversationHistoryProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("ellie_conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (!error && data) {
        setConversations(data as unknown as Conversation[]);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await supabase.from("ellie_conversations").delete().eq("id", id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      haptics.medium();
      toast.success("Conversation deleted");

      if (id === currentConversationId) {
        onNewConversation();
      }
    } catch (error) {
      toast.error("Couldn't delete conversation");
    }
  };

  const getPreview = (messages: Message[]): string => {
    if (!messages || messages.length === 0) return "Empty conversation";
    const firstUserMsg = messages.find((m) => m.role === "user");
    if (firstUserMsg) return firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? "…" : "");
    return messages[0].content.slice(0, 60) + (messages[0].content.length > 60 ? "…" : "");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((conv) =>
      conv.messages?.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl flex flex-col">
      {/* Header */}
      <header className="safe-area-top px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <h2 className="text-lg font-bold">Conversations</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => {
              onNewConversation();
              onClose();
            }}
          >
            <Plus className="w-4 h-4" />
            New
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Search */}
      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-muted/50 border-border/50"
          />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-sm">
                {searchQuery ? "No matching conversations" : "No conversations yet"}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  onSelectConversation(conv);
                  onClose();
                  haptics.light();
                }}
                className={`w-full text-left p-4 rounded-2xl transition-all ${
                  conv.id === currentConversationId
                    ? "bg-primary/10 ring-1 ring-primary/30"
                    : "bg-muted/50 hover:bg-muted"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{moodEmojis[conv.mood] || "✨"}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(conv.updated_at)}</span>
                      {conv.id === currentConversationId && (
                        <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">Active</span>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">{getPreview(conv.messages)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {conv.messages?.length || 0} messages
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                    onClick={(e) => deleteConversation(conv.id, e)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationHistory;
