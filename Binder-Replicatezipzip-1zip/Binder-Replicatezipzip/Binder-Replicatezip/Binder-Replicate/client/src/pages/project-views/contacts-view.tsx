import { useContacts, useCreateContact, useDeleteContact } from "@/hooks/use-contacts";
import { useCrew } from "@/hooks/use-crew";
import { AssignActorDialog } from "@/components/assign-actor-dialog";
import { CrewManagementDialog } from "@/components/crew-management-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContactSchema, type InsertContact, type Contact } from "@shared/schema";
import { Loader2, Plus, Trash2, Mail, Phone, Search, UserCheck, Users } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ContactsView({ projectId }: { projectId: number }) {
  const { data: contacts, isLoading: contactsLoading } = useContacts(projectId);
  const { data: crew, isLoading: crewLoading } = useCrew(projectId);
  const deleteContact = useDeleteContact();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"cast" | "crew">("cast");

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

  if (contactsLoading || crewLoading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-6xl mx-auto">
      {/* Header with Tab Navigation */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-4 bg-card px-3 py-2 rounded-lg border border-white/5 w-full sm:w-96">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder={activeTab === "cast" ? "Search cast..." : "Search crew master..."} 
              className="border-none bg-transparent focus-visible:ring-0 h-auto p-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {activeTab === "cast" ? (
            <AddContactDialog projectId={projectId} />
          ) : (
            <CrewManagementDialog projectId={projectId} crew={crew} isLoading={crewLoading} />
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
            Cast
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
                <TableHead className="text-white">Name</TableHead>
                <TableHead className="text-white">Role</TableHead>
                <TableHead className="text-white">Department</TableHead>
                <TableHead className="text-white">Contact Info</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No cast members found. Add cast to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts?.map((contact) => (
                  <TableRow 
                    key={contact.id} 
                    className="border-white/5 hover:bg-blue-500/10 cursor-pointer transition-colors"
                    onClick={() => openAssignDialog(contact)}
                  >
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 border border-white/10">
                          <AvatarFallback className="text-xs bg-blue-500/20 text-blue-400">
                            {contact.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span>{contact.name}</span>
                          {contact.email && (
                            <span className="text-xs text-green-400">✓ {contact.email}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{contact.role}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {contact.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm text-muted-foreground gap-1">
                        {contact.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            {contact.phone}
                          </div>
                        )}
                        <div className="text-xs text-blue-400">Click to assign real actor</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteContact.mutate({ id: contact.id, projectId });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Crew Master Tab Content */}
      {activeTab === "crew" && (
        <div className="text-center py-12 bg-card rounded-lg border border-dashed border-white/10">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">Open the Crew Master dialog to manage crew members</p>
          <CrewManagementDialog projectId={projectId} crew={crew} isLoading={crewLoading} />
        </div>
      )}

      <AssignActorDialog
        contact={selectedContact}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        onAssign={handleAssignActor}
        isLoading={assignLoading}
      />
    </div>
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
