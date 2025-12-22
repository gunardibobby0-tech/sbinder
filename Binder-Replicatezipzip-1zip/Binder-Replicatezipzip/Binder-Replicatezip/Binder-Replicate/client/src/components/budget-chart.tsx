"use client";

import { Card } from "@/components/ui/card";
import type { BudgetLineItem } from "@shared/schema";

interface BudgetChartProps {
  lineItems: BudgetLineItem[];
}

const COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#eab308",
  "#6366f1", "#64748b",
];

export default function BudgetChart({ lineItems }: BudgetChartProps) {
  // Group items by category
  const categoryData = lineItems.reduce((acc, item) => {
    const existing = acc.find(i => i.category === item.category);
    const amount = parseInt(item.amount) || 0;
    
    if (existing) {
      existing.amount += amount;
      existing.items.push(item);
    } else {
      acc.push({
        category: item.category,
        amount,
        items: [item],
      });
    }
    return acc;
  }, [] as Array<{ category: string; amount: number; items: BudgetLineItem[] }>);

  const sortedData = categoryData.sort((a, b) => b.amount - a.amount);

  if (lineItems.length === 0) {
    return (
      <Card className="bg-black/20 border-white/5 p-8 text-center">
        <p className="text-muted-foreground">No budget items to display</p>
      </Card>
    );
  }

  const total = sortedData.reduce((sum, item) => sum + item.amount, 0);
  const maxAmount = Math.max(...sortedData.map(d => d.amount));

  return (
    <div className="space-y-6">
      {/* Bar Chart Visualization */}
      <Card className="bg-black/20 border-white/5 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Budget by Category</h3>
        <div className="space-y-4">
          {sortedData.map((cat, idx) => {
            const percentage = (cat.amount / maxAmount) * 100;
            return (
              <div key={idx} className="group">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-white font-medium">{cat.category}</label>
                  <span className="text-sm text-muted-foreground">${cat.amount.toLocaleString()}</span>
                </div>
                <div 
                  className="h-8 rounded-lg bg-black/40 overflow-hidden relative hover:shadow-lg transition-shadow cursor-help"
                  style={{
                    background: `linear-gradient(90deg, ${COLORS[idx % COLORS.length]} 0%, ${COLORS[idx % COLORS.length]}cc 100%)`
                  }}
                  title={`${cat.category}: ${cat.items.length} item(s)\n${cat.items.map(i => `• ${i.description}: $${parseInt(i.amount).toLocaleString()}`).join('\n')}`}
                >
                  <div className="h-full flex items-center px-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <span className="text-xs text-white font-medium">{((cat.amount / total) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Pie Chart Alternative - Category Breakdown */}
      <Card className="bg-black/20 border-white/5 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Budget Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {sortedData.map((cat, idx) => {
            const pct = ((cat.amount / total) * 100).toFixed(1);
            return (
              <div 
                key={idx}
                className="p-3 rounded-lg border-2 hover:shadow-lg transition-all cursor-help"
                style={{ borderColor: COLORS[idx % COLORS.length] }}
                title={`${cat.category}\n${cat.items.map(i => `• ${i.description}: $${parseInt(i.amount).toLocaleString()} (${i.status})`).join('\n')}`}
              >
                <div 
                  className="w-full h-1 rounded-full mb-2" 
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <p className="text-sm font-medium text-white">{cat.category}</p>
                <p className="text-lg font-bold text-white">${(cat.amount / 1000).toFixed(1)}K</p>
                <p className="text-xs text-muted-foreground">{pct}% • {cat.items.length} item(s)</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Detailed Category Breakdown */}
      <Card className="bg-black/20 border-white/5 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Detailed Breakdown</h3>
        <div className="space-y-4">
          {sortedData.map((cat, idx) => {
            const pct = ((cat.amount / total) * 100).toFixed(1);
            return (
              <div 
                key={idx} 
                className="p-4 bg-black/30 rounded-lg hover:bg-black/40 transition-colors border-l-4"
                style={{ borderLeftColor: COLORS[idx % COLORS.length] }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-semibold">{cat.category}</p>
                    <p className="text-xs text-muted-foreground">{cat.items.length} item(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">${cat.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{pct}% of total</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  {cat.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-muted-foreground">
                      <span>{item.description}</span>
                      <div className="flex gap-2 items-center">
                        <span className="text-white">${parseInt(item.amount).toLocaleString()}</span>
                        <span className={`px-1.5 py-0.5 rounded ${
                          item.status === "actual" ? "bg-green-500/30 text-green-400" :
                          item.status === "approved" ? "bg-blue-500/30 text-blue-400" :
                          "bg-yellow-500/30 text-yellow-400"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
