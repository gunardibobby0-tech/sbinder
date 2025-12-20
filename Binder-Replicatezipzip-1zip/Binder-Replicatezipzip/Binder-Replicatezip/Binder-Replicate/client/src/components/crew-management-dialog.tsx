import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCrewSchema, type InsertCrew, type Crew } from "@shared/schema";
import { Loader2, Plus, Trash2, DollarSign, Briefcase, Phone } from "lucide-react";
import { useState } from "react";
import { useCreateCrew, useDeleteCrew } from "@/hooks/use-crew";

interface CrewManagementDialogProps {
  projectId: number;
  crew: Crew[] | undefined;
  isLoading: boolean;
}

export function CrewManagementDialog({
  projectId,
  crew,
  isLoading,
}: CrewManagementDialogProps) {
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-white">
          <Briefcase className="w-4 h-4 mr-2" />
          Manage Crew Master
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1c2128] border-white/10 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Crew Master Database</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Add Crew Button */}
          <div className="flex justify-end">
            <AddCrewDialog projectId={projectId} />
          </div>

          {/* Crew Table */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : crew?.length === 0 ? (
            <div className="text-center py-12 bg-black/20 rounded-lg border border-white/5">
              <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No crew members added yet</p>
              <AddCrewDialog projectId={projectId} />
            </div>
          ) : (
            <div className="border border-white/5 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-black/30">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-white">Name</TableHead>
                    <TableHead className="text-white">Title</TableHead>
                    <TableHead className="text-white">Department</TableHead>
                    <TableHead className="text-white">Pricing</TableHead>
                    <TableHead className="text-white">Contact</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {crew?.map((member) => (
                    <CrewRow key={member.id} crew={member} projectId={projectId} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CrewRow({ crew, projectId }: { crew: Crew; projectId: number }) {
  const deleteCrew = useDeleteCrew();

  return (
    <TableRow className="border-white/5 hover:bg-white/5 transition-colors">
      <TableCell className="font-medium text-white">{crew.name}</TableCell>
      <TableCell className="text-muted-foreground">{crew.title}</TableCell>
      <TableCell>
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {crew.department}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-muted-foreground">
          <DollarSign className="w-3.5 h-3.5" />
          <span className="text-sm">{crew.pricing || "—"}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          {crew.contact ? (
            <>
              <Phone className="w-3.5 h-3.5" />
              {crew.contact}
            </>
          ) : (
            "—"
          )}
        </div>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => deleteCrew.mutate({ projectId, crewId: crew.id! })}
          disabled={deleteCrew.isPending}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function AddCrewDialog({ projectId }: { projectId: number }) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateCrew();

  const form = useForm<InsertCrew>({
    resolver: zodResolver(insertCrewSchema),
    defaultValues: {
      projectId,
      name: "",
      title: "",
      department: "Camera",
      pricing: "",
      contact: "",
      notes: "",
    },
  });

  const onSubmit = (data: InsertCrew) => {
    mutate(
      { projectId, data },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset({ projectId, department: "Camera" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Crew Member
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1c2128] border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Crew Member to Master</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-black/20 border-white/10 focus-visible:ring-primary"
                      placeholder="John Smith"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title/Position</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-black/20 border-white/10 focus-visible:ring-primary"
                      placeholder="Cinematographer, Gaffer, Sound Designer..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-md text-white focus:ring-2 focus:ring-primary"
                    >
                      <option value="Camera">Camera</option>
                      <option value="Lighting">Lighting</option>
                      <option value="Sound">Sound</option>
                      <option value="Production">Production</option>
                      <option value="Grip">Grip</option>
                      <option value="Art">Art Direction</option>
                      <option value="Makeup">Makeup & Hair</option>
                      <option value="Costume">Costume</option>
                      <option value="VFX">Visual Effects</option>
                      <option value="Other">Other</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pricing"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pricing/Rate</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-black/20 border-white/10 focus-visible:ring-primary"
                      placeholder="e.g., $500/day or $5000/week"
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Info</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-black/20 border-white/10 focus-visible:ring-primary"
                      placeholder="Email or phone"
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="bg-black/20 border-white/10 focus-visible:ring-primary resize-none"
                      placeholder="Special skills, availability, etc..."
                      value={field.value || ""}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Add to Master
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
