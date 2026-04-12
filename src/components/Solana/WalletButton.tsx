import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { haptics } from "@/lib/haptics";

const WalletButton = () => {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const handleClick = () => {
    haptics.medium();
    if (connected) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  const truncatedAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="rounded-full px-3 h-9 text-xs font-medium gap-1.5 transition-all border border-border/30 bg-muted/50"
    >
      <Wallet className="w-3.5 h-3.5 text-secondary" />
      <span className="hidden sm:inline text-muted-foreground">
        {connected ? truncatedAddress : "Connect"}
      </span>
    </Button>
  );
};

export default WalletButton;
