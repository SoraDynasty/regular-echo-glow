import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

interface CreatorFeesProps {
  tokenMint: string;
}

const CreatorFees = ({ tokenMint }: CreatorFeesProps) => {
  const [fees, setFees] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("bags-api", {
          body: { action: "getLifetimeFees", tokenMint },
        });
        if (error) throw error;
        // fees returned in lamports, convert to SOL
        const feesInSol = typeof data === "number" 
          ? data / 1_000_000_000 
          : (data?.fees ?? data?.feesLamports ?? 0) / 1_000_000_000;
        setFees(feesInSol);
      } catch (err) {
        console.error("Failed to fetch lifetime fees:", err);
        setFees(null);
      } finally {
        setLoading(false);
      }
    };

    if (tokenMint) fetchFees();
  }, [tokenMint]);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
        <Sparkles className="w-3.5 h-3.5" />
        Loading fees...
      </div>
    );
  }

  if (fees === null) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium">
      <Sparkles className="w-3.5 h-3.5 text-primary" />
      <span>{fees.toLocaleString(undefined, { maximumFractionDigits: 4 })} SOL earned</span>
    </div>
  );
};

export default CreatorFees;
