import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAutoSuggest } from "@/hooks/use-script-generation";
import { useLanguage } from "@/hooks/use-language.tsx";
import { t } from "@/lib/i18n";
import { Loader2, Sparkles, CheckCircle2, Users, Calendar } from "lucide-react";
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
  const [step, setStep] = useState<'confirm' | 'processing' | 'complete'>('confirm');
  const [suggestedData, setSuggestedData] = useState<any>(null);
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

    setStep('processing');
    mutate(
      {
        projectId,
        scriptContent,
      },
      {
        onSuccess: (data) => {
          setSuggestedData(data);
          setStep('complete');
          const message = t('autosuggest.success_desc', language)
            .replace('{count}', String(data.cast.length))
            .replace('{duplicates}', String(data.duplicatesSkipped.cast));
          toast({
            title: t('autosuggest.success', language),
            description: message,
          });
        },
        onError: (error) => {
          setStep('confirm');
          toast({
            title: t('autosuggest.error', language),
            description: error instanceof Error ? error.message : "Failed to auto-suggest",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleClose = (invokeCallback = true) => {
    setOpen(false);
    setStep('confirm');
    setSuggestedData(null);
    if (invokeCallback) {
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-white/10">
          <Sparkles className="w-4 h-4" />
          {t('script.auto_suggest', language)}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1c2128] border-white/10 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            {t('autosuggest.title', language)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'confirm' && (
            <>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  {t('autosuggest.description', language)}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-white">This will automatically:</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Extract cast and roles from your script</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span>Create a production schedule</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span>Generate cast suggestions</span>
                  </li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={() => handleClose(false)}
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
            </>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              <p className="text-sm text-muted-foreground">Analyzing your script...</p>
            </div>
          )}

          {step === 'complete' && suggestedData && (
            <>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-sm font-medium text-green-400">✓ Successfully generated suggestions!</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                  <p className="text-2xl font-bold text-blue-400">{suggestedData.cast.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Cast Members</p>
                </div>
                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                  <p className="text-2xl font-bold text-orange-400">{suggestedData.events.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Schedule Events</p>
                </div>
                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                  <p className="text-2xl font-bold text-purple-400">{suggestedData.duplicatesSkipped.cast}</p>
                  <p className="text-xs text-muted-foreground mt-1">Duplicates Skipped</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button onClick={() => handleClose(true)} className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Done
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
