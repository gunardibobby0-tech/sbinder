import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/hooks/use-settings";
import { Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { settings, models, isLoading, updateSettings, isUpdating } = useSettings();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-3.5-turbo");
  const [currency, setCurrency] = useState<"IDR" | "USD">("IDR");

  useEffect(() => {
    if (settings) {
      setModel(settings.preferredModel || "gpt-3.5-turbo");
      setCurrency((settings.currency as "IDR" | "USD") || "IDR");
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings({
      openaiKey: apiKey || undefined,
      preferredModel: model,
      currency: currency,
    }, {
      onSuccess: () => {
        setApiKey("");
        toast({
          title: "Settings Saved",
          description: "Your preferences have been updated.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to save settings",
          variant: "destructive",
        });
      },
    });
  };

  if (isLoading) {
    return (
      <LayoutShell>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="p-6 lg:p-12 max-w-2xl space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Settings</h1>
          <p className="text-muted-foreground">Configure your API keys and AI preferences.</p>
        </div>

        <Card className="bg-card border-white/5 p-8 space-y-6">
          {/* API Key Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="api-key" className="text-base font-semibold text-white mb-2 block">
                OpenRouter API Key
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Enter your OpenRouter API key to enable AI features. Leave blank to use existing key.
              </p>
              <Input
                id="api-key"
                type="password"
                placeholder={settings?.openaiKey ? "••••••••••••••••" : "sk-or-v1-..."}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-black/20 border-white/10 h-11"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Your key is encrypted and never shared.
              </p>
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-4 border-t border-white/5 pt-6">
            <div>
              <Label htmlFor="model" className="text-base font-semibold text-white mb-2 block">
                Preferred AI Model
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Choose which model to use for script generation and AI features.
              </p>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="bg-black/20 border-white/10 h-11">
                  <SelectValue />
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
          </div>

          {/* Currency Selection */}
          <div className="space-y-4 border-t border-white/5 pt-6">
            <div>
              <Label htmlFor="currency" className="text-base font-semibold text-white mb-2 block">
                Budget Currency
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Set the default currency used for budgeting across your projects.
              </p>
              <Select value={currency} onValueChange={(value) => setCurrency(value as "IDR" | "USD")}>
                <SelectTrigger className="bg-black/20 border-white/10 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1c2128] border-white/10">
                  <SelectItem value="IDR" className="text-white hover:bg-white/10">
                    IDR (Indonesian Rupiah)
                  </SelectItem>
                  <SelectItem value="USD" className="text-white hover:bg-white/10">
                    USD (US Dollar)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Save Button */}
          <div className="border-t border-white/5 pt-6 flex justify-end gap-3">
            <Button
              onClick={handleSave}
              disabled={isUpdating || (!apiKey && model === settings?.preferredModel && currency === (settings?.currency as string))}
              className="gap-2"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Info Section */}
        <Card className="bg-blue-500/10 border-blue-500/20 p-6">
          <p className="text-sm text-blue-200">
            💡 <strong>Tip:</strong> Configure your OpenRouter API key here to enable script generation, document extraction, and chat features with 100+ AI models. Get a free key at{" "}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-100">
              openrouter.ai/keys
            </a>
            {" "}— Models automatically sorted by cheapest first!
          </p>
        </Card>
      </div>
    </LayoutShell>
  );
}
