import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Send, ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Message {
  id: string;
  community_id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
}

interface CommunityChatProps {
  communityId: string;
  userId: string;
}

const CommunityChat = ({ communityId, userId }: CommunityChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`community-chat-${communityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `community_id=eq.${communityId}`
        },
        async (payload) => {
          // Fetch profile for the new message
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", payload.new.user_id)
            .single();
          
          const newMsg: Message = {
            ...payload.new as Message,
            profile: profile || undefined
          };
          
          setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data: messagesData, error } = await supabase
        .from("community_messages")
        .select("*")
        .eq("community_id", communityId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (messagesData) {
        // Fetch profiles for all messages
        const userIds = [...new Set(messagesData.map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds);

        const messagesWithProfiles = messagesData.map(msg => ({
          ...msg,
          profile: profiles?.find(p => p.id === msg.user_id)
        }));

        setMessages(messagesWithProfiles);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedImage) return;
    
    setSending(true);
    try {
      let imageUrl = null;

      if (selectedImage) {
        const fileName = `${userId}/${Date.now()}-${selectedImage.name}`;
        const { error: uploadError } = await supabase.storage
          .from("community-chat")
          .upload(fileName, selectedImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("community-chat")
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from("community_messages")
        .insert({
          community_id: communityId,
          user_id: userId,
          content: newMessage.trim() || null,
          image_url: imageUrl
        });

      if (error) throw error;

      setNewMessage("");
      clearImage();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[60vh] max-h-[500px]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-3 p-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user_id === userId;
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={msg.profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {msg.profile?.username?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : ""}`}>
                  <span className="text-xs text-muted-foreground mb-1">
                    {msg.profile?.username || "Unknown"}
                  </span>
                  <Card className={`${isOwn ? "bg-primary text-primary-foreground" : "glass-card"}`}>
                    <CardContent className="p-2 space-y-2">
                      {msg.image_url && (
                        <img
                          src={msg.image_url}
                          alt="Shared"
                          className="rounded-lg max-w-full max-h-48 object-cover"
                        />
                      )}
                      {msg.content && (
                        <p className="text-sm break-words">{msg.content}</p>
                      )}
                    </CardContent>
                  </Card>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {format(new Date(msg.created_at), "HH:mm")}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-3 py-2 border-t border-border">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-20 rounded-lg object-cover"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 w-6 h-6"
              onClick={clearImage}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2 items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
          >
            <ImagePlus className="w-5 h-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={sending || (!newMessage.trim() && !selectedImage)}
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommunityChat;