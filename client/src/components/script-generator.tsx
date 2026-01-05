import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGenerateScript } from "@/hooks/use-script-generation";
import { useSettings } from "@/hooks/use-settings";
import { useLanguage } from "@/hooks/use-language.tsx";
import { t } from "@/lib/i18n";
import { Loader2, Wand2, Lightbulb } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const SCRIPT_TEMPLATES = {
  en: [
    { label: "Action/Thriller", value: "Write a tense action scene with multiple characters, vehicles, and locations for a cinematic thriller production." },
    { label: "Drama", value: "Create an emotionally compelling drama scene with character development and meaningful dialogue for an indie production." },
    { label: "Comedy", value: "Write a funny comedic scene with witty dialogue and physical comedy suitable for a light-hearted production." },
    { label: "Documentary", value: "Create a structured documentary narration with key talking points and transitions for educational content." },
  ],
  id: [
    { label: "Aksi/Thriller", value: "Tulis adegan aksi yang tegang dengan banyak karakter, kendaraan, dan lokasi untuk produksi sinematik thriller." },
    { label: "Drama", value: "Buat adegan drama yang kaya emosi dengan pengembangan karakter dan dialog bermakna untuk produksi indie." },
    { label: "Komedi", value: "Tulis adegan komedi yang lucu dengan dialog cerdas dan physical comedy untuk produksi ringan." },
    { label: "Dokumenter", value: "Buat narasi dokumenter yang terstruktur dengan poin kunci dan transisi untuk konten edukatif." },
  ],
};

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
  const templates = SCRIPT_TEMPLATES[selectedLanguage as keyof typeof SCRIPT_TEMPLATES];

  const handleApplyTemplate = (templateValue: string) => {
    setPrompt(templateValue);
  };

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
      <DialogContent className="bg-[#1c2128] border-white/10 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{t('generator.title', language)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-white mb-3 block flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Quick Templates
            </label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {templates.map((template) => (
                <Button
                  key={template.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyTemplate(template.value)}
                  className="text-xs border-white/10 h-auto py-2 px-3 justify-start text-left"
                >
                  {template.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-white mb-2 block">Your Prompt</label>
            <Textarea
              placeholder="Describe the scene, genre, tone, characters, and setting you want for your script..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="bg-black/20 border-white/10 h-40 text-white placeholder:text-muted-foreground resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">Tip: Be specific about mood, locations, and character dynamics for better results</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="border-white/10"
            >
              {t('button.cancel', language)}
            </Button>
            <Button onClick={handleGenerate} disabled={isPending || !prompt.trim()} className="gap-2">
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
