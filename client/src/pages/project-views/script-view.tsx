import { useDocuments, useCreateDocument, useUpdateDocument } from "@/hooks/use-documents";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, FilePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ScriptGenerator } from "@/components/script-generator";
import { AutoSuggestDialog } from "@/components/auto-suggest-dialog";
import { useSSEProgress } from "@/hooks/use-sse-progress";
import { Progress } from "@/components/ui/progress";

export default function ScriptView({ projectId }: { projectId: number }) {
  const { data: documents, isLoading } = useDocuments(projectId);
  const createDoc = useCreateDocument();
  const updateDoc = useUpdateDocument();
  const { toast } = useToast();
  const { progress, startTracking } = useSSEProgress();
  
  const [activeDocId, setActiveDocId] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  const handleAutoSuggest = () => {
    startTracking(`/api/projects/${projectId}/auto-suggest/stream`);
  };

  // Initialize with first script or empty state
  useEffect(() => {
    if (documents && documents.length > 0) {
      const script = documents.find(d => d.type === "Script");
      if (script) {
        setActiveDocId(script.id);
        setContent(script.content || "");
      }
    }
  }, [documents]);

  const handleCreateScript = () => {
    createDoc.mutate({
      projectId,
      title: "Screenplay",
      type: "Script",
      content: "",
      status: "draft"
    }, {
      onSuccess: (newDoc) => {
        setActiveDocId(newDoc.id);
        setContent("");
      }
    });
  };

  const handleSave = () => {
    if (!activeDocId) return;
    updateDoc.mutate({
      id: activeDocId,
      content,
      projectId // Needed for query invalidation
    }, {
      onSuccess: () => {
        setIsDirty(false);
        toast({
          title: "Script Saved",
          description: "Your changes have been saved successfully.",
        });
      }
    });
  };

  if (isLoading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;

  if (!documents?.some(d => d.type === "Script")) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-background">
        <div className="max-w-md space-y-4">
          <FilePlus className="w-16 h-16 text-muted-foreground/30 mx-auto" />
          <h3 className="text-xl font-bold text-white">No Script Found</h3>
          <p className="text-muted-foreground">Start writing your masterpiece by creating a new script document.</p>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreateScript} disabled={createDoc.isPending} className="flex-1">
              {createDoc.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FilePlus className="w-4 h-4 mr-2" />}
              Create Script
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto bg-card shadow-2xl border-x border-white/5">
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#1c2128] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="font-mono text-sm text-muted-foreground">Screenplay.pdf (Draft)</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {activeDocId && <ScriptGenerator docId={activeDocId} onSuccess={() => window.location.reload()} />}
          {activeDocId && content && (
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleAutoSuggest} 
                disabled={progress.status === "running"}
                variant="outline"
                size="sm"
                className="bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary"
              >
                {progress.status === "running" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Loader2 className="w-4 h-4 mr-2" />
                )}
                {progress.status === "running" ? "Analyzing..." : "Auto-Suggest"}
              </Button>
              <AutoSuggestDialog projectId={projectId} scriptContent={content} onSuccess={() => window.location.reload()} />
            </div>
          )}
          <Button 
            onClick={handleSave} 
            disabled={!isDirty || updateDoc.isPending}
            variant={isDirty ? "default" : "secondary"}
            size="sm"
          >
            {updateDoc.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isDirty ? "Save Changes" : "Saved"}
          </Button>
        </div>
      </div>

      {progress.status === "running" && (
        <div className="px-8 py-4 bg-black/40 border-b border-white/5 animate-in">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              AI is analyzing your script...
            </span>
            <span className="text-primary font-bold">
              {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%
            </span>
          </div>
          <Progress value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0} className="h-1 bg-white/5" />
          {progress.lastItem && (
            <p className="text-[10px] text-muted-foreground mt-2 italic animate-pulse">
              Current task: {progress.lastItem.status || "Analyzing content..."}
            </p>
          )}
        </div>
      )}
      
      <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-[#e8e8e8] text-black">
        <Textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setIsDirty(true);
          }}
          className="w-full h-full min-h-[800px] resize-none border-none focus-visible:ring-0 bg-transparent text-lg font-mono leading-relaxed p-0 shadow-none text-gray-900 placeholder:text-gray-400"
          placeholder="INT. COFFEE SHOP - DAY..."
          style={{ fontFamily: "'Courier Prime', 'Courier New', monospace" }}
        />
      </div>
    </div>
  );
}
