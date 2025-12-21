import { useCrew, useCrewAssignments } from "@/hooks/use-crew";
import { useEvents } from "@/hooks/use-events";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, getDay, isSameDay } from "date-fns";
import type { Crew } from "@shared/schema";

interface CrewAvailabilityCalendarProps {
  projectId: number;
}

export function CrewAvailabilityCalendar({ projectId }: CrewAvailabilityCalendarProps) {
  const { data: crew = [], isLoading: crewLoading } = useCrew(projectId);
  const { data: events = [], isLoading: eventsLoading } = useEvents(projectId);
  const { data: assignments = [], isLoading: assignmentsLoading } = useCrewAssignments(projectId);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate which crew members are booked on which days
  const crewAvailability = useMemo(() => {
    const availability: Record<number, Set<string>> = {};
    
    crew.forEach((c) => {
      availability[c.id] = new Set();
    });

    // Mark days when crew are assigned
    assignments.forEach((assignment) => {
      const event = events.find((e) => e.id === assignment.eventId);
      if (event && availability[assignment.crewId]) {
        const startDate = new Date(event.startTime);
        const endDate = new Date(event.endTime);
        
        // Mark all days in the range
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dayKey = format(d, "yyyy-MM-dd");
          availability[assignment.crewId].add(dayKey);
        }
      }
    });

    return availability;
  }, [assignments, events, crew]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get starting day of week (0 = Sunday, 1 = Monday, etc.)
  const startingDayOfWeek = getDay(monthStart);
  const emptyDays = Array(startingDayOfWeek).fill(null);

  const isLoading = crewLoading || eventsLoading || assignmentsLoading;

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  if (crew.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-dashed border-white/10">
        <p className="text-muted-foreground">No crew members to display. Add crew first to see availability calendar.</p>
      </div>
    );
  }

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">Crew Availability Timeline</h3>
            <p className="text-sm text-muted-foreground mt-1">View crew booking schedule and availability</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-lg font-bold text-white min-w-[180px] text-center">
              {format(currentDate, "MMMM yyyy")}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 gap-2">
        {dayLabels.map((label) => (
          <div key={label} className="text-sm font-bold text-primary text-center py-3 bg-primary/10 rounded-lg border border-primary/20">
            {label}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-6">
        {/* Mini Calendar View */}
        <Card className="bg-gradient-to-br from-card to-card/50 border border-white/10 p-6 overflow-hidden">
          <div className="grid grid-cols-7 gap-2">
            {emptyDays.map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square" />
            ))}
            {daysInMonth.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const bookedCount = crew.filter((c) => crewAvailability[c.id].has(dayKey)).length;
              const availableCount = crew.length - bookedCount;
              const isCurrentDay = isSameDay(day, new Date());

              return (
                <div
                  key={dayKey}
                  className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-2 transition-all font-semibold ${
                    !isSameMonth(day, currentDate)
                      ? "bg-black/20 border-white/5 opacity-30"
                      : bookedCount === crew.length
                        ? "bg-gradient-to-br from-red-500/30 to-red-500/10 border-red-500/60 shadow-lg shadow-red-500/20"
                        : bookedCount > 0
                          ? "bg-gradient-to-br from-yellow-500/30 to-yellow-500/10 border-yellow-500/60 shadow-lg shadow-yellow-500/20"
                          : "bg-gradient-to-br from-green-500/30 to-green-500/10 border-green-500/60 shadow-lg shadow-green-500/20"
                  } ${isCurrentDay ? "ring-2 ring-primary" : ""}`}
                >
                  <span className={`text-lg ${isSameMonth(day, currentDate) ? "text-white" : "text-muted-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  {isSameMonth(day, currentDate) && (
                    <span className={`text-[10px] mt-1 font-bold ${
                      bookedCount === crew.length 
                        ? "text-red-400" 
                        : bookedCount > 0 
                          ? "text-yellow-400" 
                          : "text-green-400"
                    }`}>
                      {availableCount}/{crew.length}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-6 mt-8 pt-6 border-t border-white/10 flex-wrap justify-center">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-green-500/30 to-green-500/10 border-2 border-green-500/60" />
              <span className="text-sm font-medium text-green-400">All Available</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-yellow-500/30 to-yellow-500/10 border-2 border-yellow-500/60" />
              <span className="text-sm font-medium text-yellow-400">Partially Booked</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-red-500/30 to-red-500/10 border-2 border-red-500/60" />
              <span className="text-sm font-medium text-red-400">All Booked</span>
            </div>
          </div>
        </Card>

        {/* Crew Availability Details */}
        <Card className="bg-gradient-to-br from-card to-card/50 border border-white/10 p-6">
          <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded" />
            Crew Booking Details
          </h4>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {crew.map((crewMember, idx) => {
              const bookedDays = Array.from(crewAvailability[crewMember.id]);
              const upcomingBookedDays = bookedDays.filter((day) => {
                const d = new Date(day);
                return d >= monthStart && d <= monthEnd;
              });

              return (
                <div key={crewMember.id} className={`p-4 rounded-lg border ${idx === crew.length - 1 ? "" : "border-b-0"} transition-all hover:border-primary/50 bg-black/30 border-white/10`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-lg text-white">{crewMember.name}</span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      upcomingBookedDays.length === 0
                        ? "bg-green-500/20 text-green-400"
                        : upcomingBookedDays.length === bookedDays.length
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {upcomingBookedDays.length} days booked
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {upcomingBookedDays.length === 0 ? (
                      <span className="text-sm font-medium text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full">
                        ✓ Available all month
                      </span>
                    ) : (
                      upcomingBookedDays
                        .sort()
                        .map((day) => (
                          <span key={day} className="text-xs font-bold bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full border border-red-500/30">
                            {format(new Date(day), "MMM d")}
                          </span>
                        ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
