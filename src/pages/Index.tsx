import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LoadingAnimation from "@/components/LoadingAnimation";

const Index = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        navigate("/feed", { replace: true });
      } else {
        navigate("/landing", { replace: true });
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingAnimation />
    </div>
  );
};

export default Index;
