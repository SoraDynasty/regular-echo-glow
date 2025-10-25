import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, Camera as CameraIcon, FlipHorizontal, Check } from "lucide-react";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";

const Capture = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      // Stop existing stream if any
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

      // Create post
      const { error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: session.user.id,
          front_media_url: publicUrl,
          post_type: "photo",
          caption: ""
        });

      if (postError) throw postError;

      haptics.success();
      toast.success("Posted! ✨");
      navigate("/feed");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to post. Please try again.");
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
                  Posting...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Post
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
