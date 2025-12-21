import { useContacts, useCreateContact, useDeleteContact } from "@/hooks/use-contacts";
import { useCrew } from "@/hooks/use-crew";
import { useCrewMaster, useCreateCrewMaster, useUpdateCrewMaster, useDeleteCrewMaster } from "@/hooks/use-crew-master";
import { useCast, useCreateCast, useDeleteCast, useUpdateCast } from "@/hooks/use-cast";
import { AssignActorDialog } from "@/components/assign-actor-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCastSchema, insertContactSchema, insertCrewMasterSchema, type InsertCast, type InsertContact, type InsertCrewMaster, type Contact, type Cast, type CrewMaster } from "@shared/schema";
import { Loader2, Plus, Trash2, Mail, Phone, Search, UserCheck, Users, Briefcase } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ContactsView({ projectId }: { projectId: number }) {
  const { data: cast, isLoading: castLoading } = useCast(projectId);
  const { data: crewMasterData, isLoading: crewMasterLoading } = useCrewMaster();
  const { data: contacts, isLoading: contactsLoading } = useContacts(projectId);
  const deleteContact = useDeleteContact();
  const deleteCast = useDeleteCast();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"cast" | "crew">("cast");
  const [editingCast, setEditingCast] = useState<Cast | null>(null);

  const filteredCast = cast?.filter(c => 
    c.role.toLowerCase().includes(search.toLowerCase())
  );

  const filteredContacts = contacts?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssignActor = async (actorName: string) => {
    if (!selectedContact) return;
    
    setAssignLoading(true);
    try {
      const response = await fetch(`/api/contacts/${selectedContact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ assignedActor: actorName }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign actor");
      }

      // Refetch contacts
      window.location.reload();
    } finally {
      setAssignLoading(false);
    }
  };

  const openAssignDialog = (contact: Contact) => {
    if (contact.category === "Cast") {
      setSelectedContact(contact);
      setAssignDialogOpen(true);
    }
  };

  if (castLoading || crewMasterLoading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-6xl mx-auto">
      {/* Header with Tab Navigation */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-4 bg-card px-3 py-2 rounded-lg border border-white/5 w-full sm:w-96">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder={activeTab === "cast" ? "Search roles..." : "Search crew master..."} 
              className="border-none bg-transparent focus-visible:ring-0 h-auto p-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {activeTab === "cast" ? (
            <AddCastDialog projectId={projectId} crewMaster={crewMasterData || []} />
          ) : (
            <CrewMasterDialog crewMaster={crewMasterData || []} isLoading={crewMasterLoading} />
          )}
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab("cast"); setSearch(""); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "cast"
                ? "bg-primary text-white"
                : "bg-card border border-white/10 text-muted-foreground hover:text-white"
            }`}
          >
            <UserCheck className="w-4 h-4 inline mr-2" />
            Cast (Roles & Characters)
          </button>
          <button
            onClick={() => { setActiveTab("crew"); setSearch(""); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "crew"
                ? "bg-primary text-white"
                : "bg-card border border-white/10 text-muted-foreground hover:text-white"
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Crew Master
          </button>
        </div>
      </div>

      {/* Cast Tab Content */}
      {activeTab === "cast" && (
        <div className="bg-card rounded-lg border border-white/5 overflow-hidden shadow-lg">
          <Table>
            <TableHeader className="bg-black/20">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white">Role Type</TableHead>
                <TableHead className="text-white">Role/Character</TableHead>
                <TableHead className="text-white">Assigned Talent</TableHead>
                <TableHead className="text-white">Notes</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCast?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No cast defined yet. Add cast to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCast?.map((item) => {
                  const assignedTalent = item.crewMasterId ? crewMasterData?.find(c => c.id === item.crewMasterId) : null;
                  return (
                    <TableRow key={item.id} className="border-white/5 hover:bg-blue-500/10 transition-colors">
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                          {item.roleType}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-white">{item.role}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {assignedTalent ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6 border border-white/10">
                              <AvatarFallback className="text-xs bg-green-500/20 text-green-400">
                                {assignedTalent.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{assignedTalent.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.notes || "—"}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10"
                          onClick={() => setEditingCast(item)}
                        >
                          <span className="w-4 h-4">✏️</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteCast.mutate({ projectId, castId: item.id })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Crew Master Tab Content */}
      {activeTab === "crew" && (
        <div className="text-center py-12 bg-card rounded-lg border border-dashed border-white/10">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">Open the Crew Master dialog to manage talents/crew</p>
          <CrewMasterDialog crewMaster={crewMasterData || []} isLoading={crewMasterLoading} />
        </div>
      )}

      {/* Edit Cast Dialog */}
      {editingCast && (
        <EditCastDialog
          projectId={projectId}
          castItem={editingCast}
          crewMaster={crewMasterData || []}
          onClose={() => setEditingCast(null)}
        />
      )}
    </div>
  );
}

function AddCastDialog({ projectId, crewMaster }: { projectId: number; crewMaster?: CrewMaster[] }) {
  const [open, setOpen] = useState(false);
  const createCast = useCreateCast();
  
  const form = useForm<InsertCast>({
    resolver: zodResolver(insertCastSchema),
    defaultValues: {
      projectId,
      role: "",
      roleType: "character",
      crewMasterId: undefined,
      notes: "",
    },
  });

  const onSubmit = (data: InsertCast) => {
    createCast.mutate(
      { projectId, data },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset({
            projectId,
            roleType: "character",
            role: "",
            crewMasterId: undefined,
            notes: "",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Cast
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1c2128] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Add Cast Member</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="roleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-black/20 border-white/10">
                        <SelectValue placeholder="Select role type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#1c2128] border-white/10 text-white">
                      <SelectItem value="character">Character</SelectItem>
                      <SelectItem value="crew">Crew</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("roleType") === "character" && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Character Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-black/20 border-white/10" placeholder="e.g., John Doe" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("roleType") === "crew" && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crew Position</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-black/20 border-white/10" placeholder="e.g., Director, Cinematographer" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="crewMasterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Talent (Optional)</FormLabel>
                  <Select onValueChange={(val) => field.onChange(val ? parseInt(val) : undefined)} value={field.value ? String(field.value) : ""}>
                    <FormControl>
                      <SelectTrigger className="bg-black/20 border-white/10">
                        <SelectValue placeholder="Select talent from master" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#1c2128] border-white/10 text-white">
                      <SelectItem value="">Unassigned</SelectItem>
                      {crewMaster?.map((crew) => (
                        <SelectItem key={crew.id} value={String(crew.id)}>
                          {crew.name} - {crew.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-black/20 border-white/10" placeholder="Additional notes..." value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={createCast.isPending} className="w-full bg-primary hover:bg-primary/90 mt-2">
              {createCast.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Cast
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CrewMasterDialog({ crewMaster, isLoading }: { crewMaster: CrewMaster[]; isLoading: boolean }) {
  const [open, setOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CrewMaster | null>(null);
  const createCrewMaster = useCreateCrewMaster();
  const deleteCrewMaster = useDeleteCrewMaster();

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
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl">Crew Master Database</DialogTitle>
            <AddCrewMasterInlineDialog onCreate={() => createCrewMaster.mutate({} as any)} />
          </div>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : crewMaster.length === 0 ? (
            <div className="text-center py-12 bg-black/20 rounded-lg border border-white/5">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No talents in master database</p>
            </div>
          ) : (
            <div className="border border-white/5 rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-black/30">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-white">Name</TableHead>
                    <TableHead className="text-white">Title</TableHead>
                    <TableHead className="text-white">Department</TableHead>
                    <TableHead className="text-white">Contact</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {crewMaster.map((member) => (
                    <TableRow key={member.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="font-medium text-white">{member.name}</TableCell>
                      <TableCell className="text-muted-foreground">{member.title}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {member.department}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {member.email || member.phone || "—"}
                      </TableCell>
                      <TableCell className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 w-8 h-8"
                          onClick={() => setEditingMember(member)}
                        >
                          <span className="text-xs">✏️</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-8 h-8"
                          onClick={() => deleteCrewMaster.mutate(member.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>

      {editingMember && (
        <EditCrewMasterInlineDialog
          member={editingMember}
          onClose={() => setEditingMember(null)}
        />
      )}
    </Dialog>
  );
}

function AddCrewMasterInlineDialog({ onCreate }: { onCreate: () => void }) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateCrewMaster();
  
  const form = useForm<InsertCrewMaster>({
    resolver: zodResolver(insertCrewMasterSchema),
    defaultValues: {
      name: "",
      title: "",
      department: "",
      email: "",
      phone: "",
      notes: "",
    },
  });

  const onSubmit = (data: InsertCrewMaster) => {
    mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        onCreate();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-3 h-3 mr-1" />
          Add Talent
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1c2128] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Add Talent to Crew Master</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Name</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-black/20 border-white/10 text-sm" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Title/Position</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-black/20 border-white/10 text-sm" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Department</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-black/20 border-white/10 text-sm" />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full bg-primary hover:bg-primary/90 text-sm">
              {isPending && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
              Add Talent
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditCrewMasterInlineDialog({ member, onClose }: { member: CrewMaster; onClose: () => void }) {
  const [open, setOpen] = useState(true);
  const { mutate, isPending } = useUpdateCrewMaster();
  
  const form = useForm<InsertCrewMaster>({
    resolver: zodResolver(insertCrewMasterSchema),
    defaultValues: {
      name: member.name,
      title: member.title,
      department: member.department || "",
      email: member.email || "",
      phone: member.phone || "",
      notes: member.notes || "",
    },
  });

  const onSubmit = (data: InsertCrewMaster) => {
    mutate({ crewMasterId: member.id, data }, {
      onSuccess: () => {
        setOpen(false);
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className="bg-[#1c2128] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Edit Talent</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Name</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-black/20 border-white/10 text-sm" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Title/Position</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-black/20 border-white/10 text-sm" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Department</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-black/20 border-white/10 text-sm" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || "")} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full bg-primary hover:bg-primary/90 text-sm">
              {isPending && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditCastDialog({ projectId, castItem, crewMaster, onClose }: { projectId: number; castItem: Cast; crewMaster: CrewMaster[]; onClose: () => void }) {
  const [open, setOpen] = useState(true);
  const updateCast = useUpdateCast();
  
  const form = useForm<InsertCast>({
    resolver: zodResolver(insertCastSchema),
    defaultValues: {
      projectId,
      role: castItem.role,
      roleType: castItem.roleType as "character" | "crew",
      crewMasterId: castItem.crewMasterId || undefined,
      notes: castItem.notes || "",
    },
  });

  const onSubmit = (data: InsertCast) => {
    updateCast.mutate(
      { projectId, castId: castItem.id, data },
      {
        onSuccess: () => {
          setOpen(false);
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className="bg-[#1c2128] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Edit Cast Member</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="roleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-black/20 border-white/10">
                        <SelectValue placeholder="Select role type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#1c2128] border-white/10 text-white">
                      <SelectItem value="character">Character</SelectItem>
                      <SelectItem value="crew">Crew</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("roleType") === "character" && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Character Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-black/20 border-white/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("roleType") === "crew" && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crew Position</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-black/20 border-white/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="crewMasterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Talent</FormLabel>
                  <Select onValueChange={(val) => field.onChange(val ? parseInt(val) : undefined)} value={field.value ? String(field.value) : ""}>
                    <FormControl>
                      <SelectTrigger className="bg-black/20 border-white/10">
                        <SelectValue placeholder="Select talent" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#1c2128] border-white/10 text-white">
                      <SelectItem value="">Unassigned</SelectItem>
                      {crewMaster?.map((crew) => (
                        <SelectItem key={crew.id} value={String(crew.id)}>
                          {crew.name} - {crew.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-black/20 border-white/10" value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={updateCast.isPending} className="w-full bg-primary hover:bg-primary/90 mt-2">
              {updateCast.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AddContactDialog({ projectId }: { projectId: number }) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateContact();
  
  const form = useForm<InsertContact>({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      projectId,
      name: "",
      role: "",
      category: "Cast",
      email: "",
      phone: "",
    },
  });

  const onSubmit = (data: InsertContact) => {
    mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset({ projectId, category: "Cast" });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Cast Member
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1c2128] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Add Cast Member</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-black/20 border-white/10" placeholder="John Doe" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-black/20 border-white/10">
                          <SelectValue placeholder="Select dept" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#1c2128] border-white/10 text-white">
                        <SelectItem value="Cast">Cast</SelectItem>
                        <SelectItem value="Crew">Crew</SelectItem>
                        <SelectItem value="Production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-black/20 border-white/10" placeholder="Director, Lead Actor..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-black/20 border-white/10" placeholder="email@example.com" value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-black/20 border-white/10" placeholder="+1 (555) 000-0000" value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isPending} className="w-full bg-primary hover:bg-primary/90 mt-2">
              {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Contact
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
