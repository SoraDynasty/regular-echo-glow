import { useState, useCallback, useEffect, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import { Phone, PhoneOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";

interface EllieCallProps {
  onClose: () => void;
  agentId: string;
}

const EllieCall = ({ onClose, agentId }: EllieCallProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const chimeAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to Ellie voice");
      haptics.medium();
      // Start call timer
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    },
    onDisconnect: () => {
      console.log("Disconnected from Ellie voice");
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    },
    onMessage: (message) => {
      console.log("Ellie message:", message);
    },
    onError: (error) => {
      console.error("Ellie call error:", error);
      toast.error("Call error. Please try again.");
    },
  });

  // Play chime sound on mount
  useEffect(() => {
    // Create a soft futuristic chime using Web Audio API
    const playChime = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create oscillators for a soft, futuristic sound
      const playNote = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, startTime);
        
        // Soft envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = audioContext.currentTime;
      // Soft ascending chime (like Gemini)
      playNote(523.25, now, 0.3);        // C5
      playNote(659.25, now + 0.1, 0.3);  // E5
      playNote(783.99, now + 0.2, 0.4);  // G5
    };

    playChime();
    startConversation();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get conversation token from edge function
      const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token", {
        body: { agentId }
      });

      if (error || !data?.token) {
        throw new Error(error?.message || "Failed to get conversation token");
      }

      // Start the conversation with WebRTC
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });
      
      setIsConnecting(false);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast.error("Couldn't start call. Check microphone permissions.");
      setIsConnecting(false);
    }
  }, [conversation, agentId]);

  const endConversation = useCallback(async () => {
    haptics.light();
    await conversation.endSession();
    onClose();
  }, [conversation, onClose]);

  const toggleMute = useCallback(async () => {
    setIsMuted(!isMuted);
    // Note: ElevenLabs SDK handles audio internally
    haptics.light();
  }, [isMuted]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-background via-background to-primary/10 flex flex-col items-center justify-center">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/20 blur-3xl transition-all duration-1000 ${
          conversation.isSpeaking ? 'scale-150 opacity-60' : 'scale-100 opacity-30'
        }`} />
        <div className={`absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl transition-all duration-1000 delay-100 ${
          conversation.isSpeaking ? 'scale-150 opacity-60' : 'scale-100 opacity-30'
        }`} />
      </div>

      {/* Call UI */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Avatar with speaking indicator */}
        <div className={`relative w-32 h-32 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center transition-all duration-300 ${
          conversation.isSpeaking ? 'scale-110 shadow-2xl shadow-primary/50' : ''
        }`}>
          {/* Ripple effect when speaking */}
          {conversation.isSpeaking && (
            <>
              <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
            </>
          )}
          <span className="text-5xl">✨</span>
        </div>

        {/* Status */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-1">Ellie</h2>
          <p className="text-muted-foreground">
            {isConnecting ? "Connecting..." : 
             conversation.status === 'connected' ? 
               (conversation.isSpeaking ? "Speaking..." : "Listening...") : 
               "Disconnected"}
          </p>
          {conversation.status === 'connected' && (
            <p className="text-sm text-primary mt-2 font-mono">
              {formatDuration(callDuration)}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 mt-8">
          <Button
            onClick={toggleMute}
            size="icon"
            variant="outline"
            className="w-14 h-14 rounded-full"
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </Button>
          
          <Button
            onClick={endConversation}
            size="icon"
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
          >
            <PhoneOff className="w-7 h-7" />
          </Button>
        </div>

        {/* Hint */}
        <p className="text-sm text-muted-foreground mt-8 text-center max-w-xs">
          Just speak naturally. Ellie is listening and will respond.
        </p>
      </div>
    </div>
  );
};

export default EllieCall;
