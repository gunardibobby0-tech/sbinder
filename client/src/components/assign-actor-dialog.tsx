import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/use-language.tsx";
import { t } from "@/lib/i18n";
import { Loader2, User } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Cast } from "@shared/schema";

export function AssignActorDialog({
  contact,
  open,
  onOpenChange,
  onAssign,
  isLoading,
}: {
  contact: Cast | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (actorName: string) => Promise<void>;
  isLoading: boolean;
}) {
  const [actorName, setActorName] = useState("");
  const { language } = useLanguage();
  const { toast } = useToast();

  if (!contact) return null;

  const handleAssign = async () => {
    if (!actorName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an actor name",
        variant: "destructive",
      });
      return;
    }

    try {
      await onAssign(actorName);
      setActorName("");
      onOpenChange(false);
      toast({
        title: "Success",
        description: `${contact.role} assigned to ${actorName}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign actor",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1c2128] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            Assign Actor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="bg-black/30 p-4 rounded-lg border border-white/10">
            <p className="text-sm text-muted-foreground mb-1">Role</p>
            <p className="text-lg font-semibold text-white">{contact.role}</p>
            <p className="text-sm text-blue-400 mt-1">{contact.roleType}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-white mb-2 block">Actor Name</label>
            <Input
              placeholder="Enter actor name..."
              className="bg-black/20 border-white/10 text-white"
              value={actorName}
              onChange={(e) => setActorName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !isLoading) {
                  handleAssign();
                }
              }}
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1 border-white/10"
            >
              {t('button.cancel', language)}
            </Button>
            <Button
              onClick={handleAssign}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Assigning...
                </>
              ) : (
                "Assign"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
