import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAutoSuggest } from "@/hooks/use-script-generation";
import { useLanguage } from "@/hooks/use-language.tsx";
import { t } from "@/lib/i18n";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function AutoSuggestDialog({
  projectId,
  scriptContent,
  onSuccess,
}: {
  projectId: number;
  scriptContent: string;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useAutoSuggest();
  const { toast } = useToast();
  const { language } = useLanguage();

  const handleAutoSuggest = () => {
    if (!scriptContent.trim()) {
      toast({
        title: t('autosuggest.error', language),
        description: t('autosuggest.empty', language),
        variant: "destructive",
      });
      return;
    }

    mutate(
      {
        projectId,
        scriptContent,
      },
      {
        onSuccess: (data) => {
          setOpen(false);
          const message = t('autosuggest.success_desc', language)
            .replace('{count}', String(data.cast.length))
            .replace('{duplicates}', String(data.duplicatesSkipped.cast));
          toast({
            title: t('autosuggest.success', language),
            description: message,
          });
          onSuccess?.();
        },
        onError: (error) => {
          toast({
            title: t('autosuggest.error', language),
            description: error instanceof Error ? error.message : "Failed to auto-suggest",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-white/10">
          <Sparkles className="w-4 h-4" />
          {t('script.auto_suggest', language)}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1c2128] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">{t('autosuggest.title', language)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('autosuggest.description', language)}
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="border-white/10"
            >
              {t('button.cancel', language)}
            </Button>
            <Button onClick={handleAutoSuggest} disabled={isPending} className="gap-2">
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('autosuggest.analyzing', language)}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {t('button.autosuggest', language)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
