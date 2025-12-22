import { useBudget, useBudgetLineItems, useCreateBudget, useCreateBudgetLineItem, useDeleteBudgetLineItem } from "@/hooks/use-budget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import BudgetChart from "@/components/budget-chart";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, DollarSign, PieChart } from "lucide-react";
import { useState } from "react";

const budgetLineItemSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(1),
  amount: z.string().min(1),
  status: z.enum(["estimated", "approved", "actual"]).default("estimated"),
});

type BudgetLineItemForm = z.infer<typeof budgetLineItemSchema>;

const CATEGORIES = [
  "Cast",
  "Crew",
  "Equipment",
  "Locations",
  "VFX",
  "Sound",
  "Catering",
  "Transportation",
  "Insurance",
  "Permits",
  "Post-Production",
  "Other",
];

export default function BudgetView({ projectId }: { projectId: number }) {
  const { data: budget, isLoading: budgetLoading } = useBudget(projectId);
  const { data: lineItems = [], isLoading: itemsLoading } = useBudgetLineItems(projectId);
  const { mutate: createBudget, isPending: creatingBudget } = useCreateBudget();
  const { mutate: createLineItem, isPending: creatingItem } = useCreateBudgetLineItem();
  const { mutate: deleteLineItem, isPending: deletingItem } = useDeleteBudgetLineItem();

  const [budgetDialogOpen, setBudgetDialogOpen] = useState(!budget);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);

  const budgetForm = useForm({
    resolver: zodResolver(z.object({ totalBudget: z.string().min(1) })),
    defaultValues: { totalBudget: budget?.totalBudget || "" },
  });

  const itemForm = useForm<BudgetLineItemForm>({
    resolver: zodResolver(budgetLineItemSchema),
    defaultValues: { category: "Equipment", status: "estimated" },
  });

  const handleCreateBudget = (data: any) => {
    createBudget(
      { projectId, totalBudget: data.totalBudget },
      {
        onSuccess: () => {
          setBudgetDialogOpen(false);
          budgetForm.reset();
        },
      }
    );
  };

  const handleAddLineItem = (data: BudgetLineItemForm) => {
    createLineItem(
      { projectId, data: { ...data, projectId } },
      {
        onSuccess: () => {
          setItemDialogOpen(false);
          itemForm.reset({ category: "Equipment", status: "estimated" });
        },
      }
    );
  };

  const calculateTotals = () => {
    const totalSpent = lineItems.reduce((sum, item) => {
      const amount = parseInt(item.amount) || 0;
      return sum + amount;
    }, 0);

    const totalBudget = parseInt(budget?.totalBudget || "0") || 0;
    const contingency = parseInt(budget?.contingency || "10") / 100;
    const budgetWithContingency = totalBudget + totalBudget * contingency;
    const remaining = budgetWithContingency - totalSpent;
    const percentUsed = totalBudget > 0 ? (totalSpent / budgetWithContingency) * 100 : 0;

    return { totalSpent, totalBudget, budgetWithContingency, remaining, percentUsed };
  };

  const { totalSpent, totalBudget, budgetWithContingency, remaining, percentUsed } = calculateTotals();

  if (budgetLoading || itemsLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Production Budget</h2>
        <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <DollarSign className="w-4 h-4 mr-2" />
              {budget ? "Edit Budget" : "Set Budget"}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1c2128] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>{budget ? "Edit" : "Create"} Project Budget</DialogTitle>
            </DialogHeader>
            <Form {...budgetForm}>
              <form onSubmit={budgetForm.handleSubmit(handleCreateBudget)} className="space-y-4 pt-4">
                <FormField
                  control={budgetForm.control}
                  name="totalBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Budget</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="500000"
                          className="bg-black/20 border-white/10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={creatingBudget} className="w-full bg-primary hover:bg-primary/90">
                  {creatingBudget && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {budget ? "Update Budget" : "Create Budget"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Summary Cards */}
      {budget && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Budget</p>
            <p className="text-3xl font-bold text-white">${(totalBudget / 1000).toFixed(0)}K</p>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20 p-4">
            <p className="text-sm text-muted-foreground mb-1">Contingency (10%)</p>
            <p className="text-3xl font-bold text-white">${((totalBudget * 0.1) / 1000).toFixed(0)}K</p>
          </Card>
          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20 p-4">
            <p className="text-sm text-muted-foreground mb-1">Spent</p>
            <p className="text-3xl font-bold text-white">${(totalSpent / 1000).toFixed(0)}K</p>
            <p className="text-xs text-muted-foreground mt-1">{percentUsed.toFixed(1)}% of total</p>
          </Card>
          <Card className={`bg-gradient-to-br p-4 border ${remaining >= 0 ? "from-green-500/10 to-green-500/5 border-green-500/20" : "from-red-500/10 to-red-500/5 border-red-500/20"}`}>
            <p className="text-sm text-muted-foreground mb-1">Remaining</p>
            <p className={`text-3xl font-bold ${remaining >= 0 ? "text-green-400" : "text-red-400"}`}>
              ${(remaining / 1000).toFixed(0)}K
            </p>
          </Card>
        </div>
      )}

      {/* Progress Bar */}
      {budget && (
        <Card className="bg-black/20 border-white/5 p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Budget Usage</span>
              <span className="text-white font-medium">{percentUsed.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${percentUsed > 100 ? "bg-red-500" : percentUsed > 80 ? "bg-yellow-500" : "bg-green-500"}`}
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Budget Charts */}
      {lineItems.length > 0 && (
        <BudgetChart lineItems={lineItems} />
      )}

      {/* Line Items */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Budget Line Items</h3>
          <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Line Item
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1c2128] border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>Add Budget Line Item</DialogTitle>
              </DialogHeader>
              <Form {...itemForm}>
                <form onSubmit={itemForm.handleSubmit(handleAddLineItem)} className="space-y-4 pt-4">
                  <FormField
                    control={itemForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-black/20 border-white/10">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#1c2128] border-white/10">
                            {CATEGORIES.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={itemForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Main Camera Rental" className="bg-black/20 border-white/10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={itemForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount ($)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="5000" className="bg-black/20 border-white/10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={itemForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-black/20 border-white/10">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#1c2128] border-white/10">
                            <SelectItem value="estimated">Estimated</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="actual">Actual</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={creatingItem} className="w-full bg-primary hover:bg-primary/90">
                    {creatingItem && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Add Line Item
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {lineItems.length === 0 ? (
          <Card className="bg-black/20 border-dashed border-white/10 p-12 text-center">
            <PieChart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No line items yet. Add your first budget item.</p>
          </Card>
        ) : (
          <Card className="bg-black/20 border-white/5 overflow-hidden">
            <Table>
              <TableHeader className="bg-black/30">
                <TableRow className="border-white/5">
                  <TableHead className="text-white">Category</TableHead>
                  <TableHead className="text-white">Description</TableHead>
                  <TableHead className="text-white text-right">Amount</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map(item => (
                  <TableRow key={item.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="font-medium text-white">{item.category}</TableCell>
                    <TableCell className="text-muted-foreground">{item.description}</TableCell>
                    <TableCell className="text-right font-medium text-white">${parseInt(item.amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.status === "actual" ? "bg-green-500/20 text-green-400" :
                        item.status === "approved" ? "bg-blue-500/20 text-blue-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteLineItem({ projectId, itemId: item.id })}
                        disabled={deletingItem}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
