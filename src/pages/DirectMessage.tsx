import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

const DirectMessage = () => {
  const navigate = useNavigate();
  const { recipientId } = useParams<{ recipientId: string }>();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!currentUserId || !recipientId) return;

    // Subscribe to new messages
    const channel = supabase
      .channel('dm-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `sender_id=eq.${recipientId}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.receiver_id === currentUserId) {
            setMessages(prev => [...prev, newMsg]);
            // Mark as read
            supabase.from('direct_messages').update({ read: true }).eq('id', newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, recipientId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setCurrentUserId(session.user.id);
    await Promise.all([
      loadRecipient(),
      loadMessages(session.user.id)
    ]);
  };

  const loadRecipient = async () => {
    if (!recipientId) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .eq("id", recipientId)
      .single();

    if (error) {
      toast.error("User not found");
      navigate("/chat");
      return;
    }
    setRecipient(data);
  };

  const loadMessages = async (userId: string) => {
    if (!recipientId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${userId})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark unread messages as read
      const unreadIds = data?.filter(m => m.receiver_id === userId && !m.read).map(m => m.id) || [];
      if (unreadIds.length > 0) {
        await supabase.from("direct_messages").update({ read: true }).in("id", unreadIds);
      }
    } catch (error: any) {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentUserId || !recipientId || sending) return;

    haptics.light();
    setSending(true);
    const messageContent = input.trim();
    setInput("");

    try {
      const { data, error } = await supabase
        .from("direct_messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: recipientId,
          content: messageContent
        })
        .select()
        .single();

      if (error) throw error;
      setMessages(prev => [...prev, data]);
      haptics.success();
    } catch (error: any) {
      toast.error("Failed to send message");
      setInput(messageContent);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-xl border-b border-border/30">
        <div className="safe-area-top" />
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chat")} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center gradient-regulus border-2 border-border">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold">{recipient?.username || "Loading..."}</h1>
              <p className="text-xs text-muted-foreground">Direct Message</p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="max-w-2xl mx-auto py-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No messages yet. Say hi! 👋</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  msg.sender_id === currentUserId 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                }`}>
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${
                    msg.sender_id === currentUserId ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="bg-background/95 backdrop-blur-xl border-t border-border/30">
        <div className="px-4 py-3 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="rounded-full h-12"
            disabled={sending}
          />
          <Button 
            onClick={sendMessage} 
            disabled={sending || !input.trim()} 
            size="icon" 
            className="rounded-full w-12 h-12"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default DirectMessage;
