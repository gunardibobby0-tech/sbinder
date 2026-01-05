import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, DollarSign, Package } from "lucide-react";
import { useState } from "react";

interface BudgetAndEquipmentProps {
  projectId: number;
  eventId?: number;
  assignments: Array<{ crewId: number; name?: string; pricing?: string }>;
}

export function BudgetAndEquipment({ projectId, eventId, assignments }: BudgetAndEquipmentProps) {
  const [equipment, setEquipment] = useState<Array<{ id: number; name: string; category: string; rentalCost?: string }>>([]);
  const [newEquip, setNewEquip] = useState({ name: "", category: "Camera", rentalCost: "" });
  const [adding, setAdding] = useState(false);

  const calculateBudget = () => {
    let total = 0;
    assignments.forEach(a => {
      if (a.pricing) {
        const match = a.pricing.match(/\$?([\d,]+)/);
        if (match) total += parseInt(match[1].replace(",", ""));
      }
    });
    equipment.forEach(e => {
      if (e.rentalCost) {
        const match = e.rentalCost.match(/\$?([\d,]+)/);
        if (match) total += parseInt(match[1].replace(",", ""));
      }
    });
    return total;
  };

  const handleAddEquipment = async () => {
    if (!newEquip.name) return;
    setAdding(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/equipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEquip),
      });
      if (response.ok) {
        const equip = await response.json();
        setEquipment([...equipment, equip]);
        setNewEquip({ name: "", category: "Camera", rentalCost: "" });
      }
    } finally {
      setAdding(false);
    }
  };

  const totalBudget = calculateBudget();

  return (
    <div className="space-y-4">
      {/* Budget Summary */}
      <Card className="bg-green-500/5 border-green-500/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold text-white">${totalBudget.toLocaleString()}</p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="text-muted-foreground">Crew: ${assignments.reduce((sum, a) => {
              if (a.pricing) {
                const match = a.pricing.match(/\$?([\d,]+)/);
                return sum + (match ? parseInt(match[1].replace(",", "")) : 0);
              }
              return sum;
            }, 0).toLocaleString()}</p>
          </div>
        </div>
      </Card>

      {/* Equipment */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Equipment & Resources</h3>
          </div>
        </div>

        <div className="space-y-2 bg-black/20 p-4 rounded-lg border border-white/5">
          {equipment.length === 0 ? (
            <p className="text-sm text-muted-foreground">No equipment added. Add gear to track costs.</p>
          ) : (
            equipment.map(e => (
              <div key={e.id} className="flex items-center justify-between bg-black/30 p-3 rounded border border-white/5">
                <div>
                  <p className="font-medium text-white">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{e.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{e.rentalCost || "—"}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEquipment(equipment.filter(x => x.id !== e.id))}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}

          {/* Add Equipment Form */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <Input
              placeholder="Equipment name"
              value={newEquip.name}
              onChange={(e) => setNewEquip({ ...newEquip, name: e.target.value })}
              className="bg-black/30 border-white/10 text-sm h-8"
            />
            <Input
              placeholder="Rental cost (e.g., $500/day)"
              value={newEquip.rentalCost}
              onChange={(e) => setNewEquip({ ...newEquip, rentalCost: e.target.value })}
              className="bg-black/30 border-white/10 text-sm h-8"
            />
            <Button
              size="sm"
              onClick={handleAddEquipment}
              disabled={adding || !newEquip.name}
              className="w-full bg-primary/50 hover:bg-primary/70 text-white text-xs h-8"
            >
              {adding ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
              Add Equipment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
