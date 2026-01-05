import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink } from "lucide-react";

interface AgentIdDialogProps {
  open: boolean;
  onSave: (agentId: string) => void;
  onCancel: () => void;
}

const STORAGE_KEY = "ellie_elevenlabs_agent_id";

export const getStoredAgentId = (): string | null => {
  return localStorage.getItem(STORAGE_KEY);
};

export const saveAgentId = (agentId: string): void => {
  localStorage.setItem(STORAGE_KEY, agentId);
};

export const clearAgentId = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

const AgentIdDialog = ({ open, onSave, onCancel }: AgentIdDialogProps) => {
  const [agentId, setAgentId] = useState("");

  const handleSave = () => {
    const trimmedId = agentId.trim();
    if (trimmedId) {
      saveAgentId(trimmedId);
      onSave(trimmedId);
      setAgentId("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect ElevenLabs Agent</DialogTitle>
          <DialogDescription>
            Enter your ElevenLabs Agent ID to enable voice calls with Ellie.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Input
            placeholder="Enter Agent ID (e.g., abc123xyz)"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSave()}
          />
          
          <a
            href="https://elevenlabs.io/conversational-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Create an agent at ElevenLabs
          </a>
        </div>
        
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!agentId.trim()}>
            Save & Call
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgentIdDialog;
