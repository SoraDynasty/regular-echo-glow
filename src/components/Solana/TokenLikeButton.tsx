import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useConnection } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";

interface TokenLikeButtonProps {
  tokenMint: string;
  creatorUsername: string;
}

const TokenLikeButton = ({ tokenMint, creatorUsername }: TokenLikeButtonProps) => {
  const { connected, publicKey, signTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);

  const handleTokenLike = async () => {
    haptics.medium();

    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    if (!signTransaction) {
      toast.error("Wallet doesn't support transaction signing");
      return;
    }

    setLoading(true);
    try {
      // Get swap instructions from Bags API
      const { data, error } = await supabase.functions.invoke("bags-api", {
        body: {
          action: "getSwapInstructions",
          tokenMint,
          walletAddress: publicKey.toBase58(),
        },
      });

      if (error) throw error;

      if (data?.transaction) {
        // Deserialize and sign the transaction
        const txBuffer = Uint8Array.from(atob(data.transaction), (c) => c.charCodeAt(0));
        const tx = Transaction.from(txBuffer);
        const signed = await signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(sig, "confirmed");

        haptics.success();
        toast.success(`Supported ${creatorUsername} with 0.01 SOL! 🎉`, {
          description: `TX: ${sig.slice(0, 8)}...`,
        });
      } else {
        toast.info("Swap instructions received", {
          description: "Transaction data format may need adjustment.",
        });
      }
    } catch (err: any) {
      console.error("Token like error:", err);
      haptics.error();
      if (err?.message?.includes("User rejected")) {
        toast.info("Transaction cancelled");
      } else {
        toast.error("Failed to support creator", {
          description: err?.message || "Please try again",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleTokenLike}
      disabled={loading}
      className="gap-1 h-10 md:h-9 text-primary hover:text-primary"
      title={`Support ${creatorUsername} with 0.01 SOL`}
    >
      <Coins className={`w-4 h-4 md:w-5 md:h-5 ${loading ? "animate-spin" : ""}`} />
      <span className="text-xs hidden sm:inline">
        {loading ? "Sending..." : "Support"}
      </span>
    </Button>
  );
};

export default TokenLikeButton;
