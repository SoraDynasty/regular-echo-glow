import { useRef, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, Camera as CameraIcon, FlipHorizontal, Check, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Community {
  id: string;
  name: string;
}

type CaptureMode = "post" | "story";

const Capture = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "story" ? "story" : "post";
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isUploading, setIsUploading] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string>("none");
  const [captureMode, setCaptureMode] = useState<CaptureMode>(initialMode);

  useEffect(() => {
    startCamera();
    loadUserCommunities();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const loadUserCommunities = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: memberships, error } = await supabase
        .from("community_members")
        .select("community_id, communities(id, name)")
        .eq("user_id", session.user.id);

      if (error) throw error;

      const userCommunities = memberships
        ?.map((m: any) => m.communities)
        .filter(Boolean) as Community[];
      
      setCommunities(userCommunities || []);
    } catch (error) {
      console.error("Failed to load communities:", error);
    }
  };

  const startCamera = async () => {
    try {
      stopCamera();

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Could not access camera. Please check permissions.");
      navigate("/feed");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    haptics.medium();
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageData);
    stopCamera();
  };

  const switchCamera = () => {
    haptics.light();
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const retake = () => {
    haptics.light();
    setCapturedImage(null);
    setSelectedCommunity("none");
    setCaptureMode(initialMode);
    startCamera();
  };

  const handlePost = async () => {
    if (!capturedImage) return;
    
    haptics.medium();
    setIsUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      // Upload to Supabase Storage
      const fileName = `${session.user.id}/${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("posts")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("posts")
        .getPublicUrl(fileName);

      if (captureMode === "story") {
        // Create story
        const { error: storyError } = await supabase
          .from("stories")
          .insert({
            user_id: session.user.id,
            media_url: publicUrl
          });

        if (storyError) throw storyError;

        haptics.success();
        toast.success("Story added! ✨");
        navigate("/feed");
      } else {
        // Create post
        const { data: postData, error: postError } = await supabase
          .from("posts")
          .insert({
            user_id: session.user.id,
            front_media_url: publicUrl,
            post_type: "photo",
            caption: ""
          })
          .select()
          .single();

        if (postError) throw postError;

        // If a community is selected, also add to community_posts
        if (selectedCommunity && selectedCommunity !== "none" && postData) {
          const { error: communityPostError } = await supabase
            .from("community_posts")
            .insert({
              community_id: selectedCommunity,
              post_id: postData.id
            });

          if (communityPostError) {
            console.error("Failed to add post to community:", communityPostError);
          }
        }

        haptics.success();
        toast.success(selectedCommunity && selectedCommunity !== "none" 
          ? "Posted to community! ✨" 
          : "Posted! ✨");
        navigate("/feed");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(captureMode === "story" ? "Failed to add story." : "Failed to post. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    haptics.light();
    navigate("/feed");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Camera View */}
      {!capturedImage ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Top Controls */}
          <div className="absolute top-0 left-0 right-0 safe-area-top p-4 flex justify-between items-center z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <X className="w-6 h-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={switchCamera}
              className="rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <FlipHorizontal className="w-6 h-6" />
            </Button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 safe-area-bottom p-8 flex justify-center">
            <Button
              size="icon"
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full bg-white hover:bg-white/90 text-black shadow-2xl"
            >
              <CameraIcon className="w-10 h-10" />
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Preview */}
          <img
            src={capturedImage}
            alt="Captured"
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Top Controls - Mode Toggle & Community */}
          <div className="absolute top-0 left-0 right-0 safe-area-top p-4 z-10">
            {/* Post/Story Toggle */}
            <div className="bg-black/70 backdrop-blur-sm rounded-2xl p-2 mb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setCaptureMode("post")}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
                    captureMode === "post" 
                      ? "bg-white text-black" 
                      : "text-white/70 hover:text-white"
                  )}
                >
                  <CameraIcon className="w-4 h-4" />
                  Post
                </button>
                <button
                  onClick={() => setCaptureMode("story")}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
                    captureMode === "story" 
                      ? "bg-white text-black" 
                      : "text-white/70 hover:text-white"
                  )}
                >
                  <Clock className="w-4 h-4" />
                  Story
                </button>
              </div>
            </div>
            
            {/* Story info */}
            {captureMode === "story" && (
              <div className="bg-black/50 backdrop-blur-sm rounded-xl px-3 py-2 mb-3">
                <p className="text-white/80 text-xs text-center">
                  Stories disappear after 24 hours
                </p>
              </div>
            )}
            
            {/* Community Selector - Only for posts */}
            {captureMode === "post" && communities.length > 0 && (
              <div className="bg-black/70 backdrop-blur-sm rounded-2xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-medium">Post to community</span>
                </div>
                <Select value={selectedCommunity} onValueChange={setSelectedCommunity}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select community (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No community (feed only)</SelectItem>
                    {communities.map((community) => (
                      <SelectItem key={community.id} value={community.id}>
                        {community.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 safe-area-bottom p-6 flex gap-4 justify-center">
            <Button
              size="lg"
              variant="outline"
              onClick={retake}
              disabled={isUploading}
              className="rounded-full px-8 bg-black/50 text-white border-white/30 hover:bg-black/70"
            >
              <X className="w-5 h-5 mr-2" />
              Retake
            </Button>
            
            <Button
              size="lg"
              onClick={handlePost}
              disabled={isUploading}
              className="rounded-full px-8 bg-white hover:bg-white/90 text-black"
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                  {captureMode === "story" ? "Adding..." : "Posting..."}
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  {captureMode === "story" ? "Add Story" : "Post"}
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default Capture;
