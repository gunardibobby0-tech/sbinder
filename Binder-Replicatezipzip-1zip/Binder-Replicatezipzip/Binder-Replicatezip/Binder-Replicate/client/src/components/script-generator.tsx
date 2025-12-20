import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGenerateScript } from "@/hooks/use-script-generation";
import { useSettings } from "@/hooks/use-settings";
import { useLanguage } from "@/hooks/use-language.tsx";
import { t } from "@/lib/i18n";
import { Loader2, Wand2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function ScriptGenerator({
  docId,
  onSuccess,
}: {
  docId: number;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'id'>('id');
  const { models } = useSettings();
  const { mutate, isPending } = useGenerateScript();
  const { toast } = useToast();
  const { language } = useLanguage();

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: t('generator.error', language),
        description: t('generator.error_prompt', language),
        variant: "destructive",
      });
      return;
    }

    mutate(
      {
        docId,
        prompt,
        model: selectedModel || undefined,
        language: selectedLanguage,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setPrompt("");
          setSelectedModel("");
          toast({
            title: t('generator.success', language),
            description: t('generator.success_desc', language),
          });
          onSuccess?.();
        },
        onError: (error) => {
          toast({
            title: t('generator.error', language),
            description: error instanceof Error ? error.message : "Failed to generate script",
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
          <Wand2 className="w-4 h-4" />
          {t('script.generate_by_prompt', language)}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1c2128] border-white/10 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">{t('generator.title', language)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">{t('generator.prompt', language)}</label>
            <Textarea
              placeholder={t('generator.prompt_placeholder', language)}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="bg-black/20 border-white/10 h-32 text-white placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-white mb-2 block">{t('generator.model', language)}</label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="bg-black/20 border-white/10">
                <SelectValue placeholder={t('generator.model_placeholder', language)} />
              </SelectTrigger>
              <SelectContent className="bg-[#1c2128] border-white/10">
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-white hover:bg-white/10">
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-white mb-2 block">{t('generator.language', language)}</label>
            <Select value={selectedLanguage} onValueChange={(val) => setSelectedLanguage(val as 'en' | 'id')}>
              <SelectTrigger className="bg-black/20 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1c2128] border-white/10">
                <SelectItem value="id" className="text-white hover:bg-white/10">Bahasa Indonesia</SelectItem>
                <SelectItem value="en" className="text-white hover:bg-white/10">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="border-white/10"
            >
              {t('button.cancel', language)}
            </Button>
            <Button onClick={handleGenerate} disabled={isPending} className="gap-2">
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('generator.generating', language)}
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  {t('button.generate', language)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
