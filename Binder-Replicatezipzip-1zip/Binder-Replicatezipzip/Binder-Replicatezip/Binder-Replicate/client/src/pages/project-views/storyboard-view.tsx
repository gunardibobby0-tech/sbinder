import { useStoryboards, useStoryboardImages, useCreateStoryboard, useDeleteStoryboard, useAddImage, useDeleteImage } from "@/hooks/use-storyboards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Images } from "lucide-react";
import { useState } from "react";
import type { Storyboard, StoryboardImage } from "@/hooks/use-storyboards";

export default function StoryboardView({ projectId }: { projectId: number }) {
  const { data: storyboards = [], isLoading } = useStoryboards(projectId);
  const createStoryboard = useCreateStoryboard();
  const deleteStoryboard = useDeleteStoryboard();
  const addImage = useAddImage();
  const deleteImage = useDeleteImage();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStoryboard, setSelectedStoryboard] = useState<Storyboard | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");

  const { data: selectedImages = [] } = useStoryboardImages(selectedStoryboard?.id || 0);

  const handleCreateStoryboard = () => {
    createStoryboard.mutate({
      projectId,
      title: newTitle,
      description: newDescription,
    }, {
      onSuccess: () => {
        setNewTitle("");
        setNewDescription("");
        setDialogOpen(false);
      },
    });
  };

  const handleAddImage = () => {
    if (!selectedStoryboard) return;
    addImage.mutate({
      storyboardId: selectedStoryboard.id,
      imageUrl,
      caption: imageCaption,
      order: selectedImages.length + 1,
    }, {
      onSuccess: () => {
        setImageUrl("");
        setImageCaption("");
        setImageDialogOpen(false);
      },
    });
  };

  if (isLoading) {
    return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;
  }

  if (!storyboards.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-background">
        <div className="max-w-md space-y-4">
          <Images className="w-16 h-16 text-muted-foreground/30 mx-auto" />
          <h3 className="text-xl font-bold text-white">No Storyboards</h3>
          <p className="text-muted-foreground">Create your first storyboard to organize visual references and scenes.</p>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Storyboard
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1c2128] border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>Create Storyboard</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Scene 1 - Opening"
                    className="bg-black/20 border-white/10 text-white mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea 
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Add notes about this storyboard..."
                    className="bg-black/20 border-white/10 text-white mt-2 resize-none h-24"
                  />
                </div>
                <Button onClick={handleCreateStoryboard} disabled={createStoryboard.isPending || !newTitle} className="w-full">
                  {createStoryboard.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Storyboards</h2>
          <p className="text-sm text-muted-foreground mt-1">Visual boards with image galleries for planning scenes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              New Storyboard
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1c2128] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Create Storyboard</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Scene 1 - Opening"
                  className="bg-black/20 border-white/10 text-white mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Add notes about this storyboard..."
                  className="bg-black/20 border-white/10 text-white mt-2 resize-none h-24"
                />
              </div>
              <Button onClick={handleCreateStoryboard} disabled={createStoryboard.isPending || !newTitle} className="w-full">
                {createStoryboard.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {storyboards.map((board) => (
          <Card key={board.id} className="bg-card border-white/5 overflow-hidden hover:border-primary/50 transition-all">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{board.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{board.description}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => deleteStoryboard.mutate({ storyboardId: board.id, projectId })}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <button
                onClick={() => setSelectedStoryboard(board)}
                className="w-full text-left px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-sm font-medium text-primary hover:bg-black/30 transition-colors"
              >
                View Gallery ({useStoryboardImages(board.id).data?.length || 0} images)
              </button>
            </div>
          </Card>
        ))}
      </div>

      {selectedStoryboard && (
        <Dialog open={!!selectedStoryboard} onOpenChange={() => setSelectedStoryboard(null)}>
          <DialogContent className="bg-[#1c2128] border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedStoryboard.title}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {selectedImages.length === 0 ? (
                <div className="text-center py-12">
                  <Images className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No images in this storyboard yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {selectedImages.sort((a, b) => a.order - b.order).map((img) => (
                    <div key={img.id} className="space-y-2 relative group">
                      <img 
                        src={img.imageUrl} 
                        alt={img.caption}
                        className="w-full h-48 object-cover rounded-lg border border-white/10 group-hover:border-primary/50 transition-colors"
                      />
                      {img.caption && (
                        <p className="text-sm text-muted-foreground px-2">{img.caption}</p>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteImage.mutate(img.id)}
                        className="absolute top-2 right-2 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/20"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Image
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1c2128] border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle>Add Image to Storyboard</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Image URL</label>
                      <Input 
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="bg-black/20 border-white/10 text-white mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Caption (optional)</label>
                      <Textarea 
                        value={imageCaption}
                        onChange={(e) => setImageCaption(e.target.value)}
                        placeholder="Describe what's in this image..."
                        className="bg-black/20 border-white/10 text-white mt-2 resize-none h-20"
                      />
                    </div>
                    <Button onClick={handleAddImage} disabled={addImage.isPending || !imageUrl} className="w-full">
                      {addImage.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      Add Image
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
