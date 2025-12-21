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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Crew Availability Calendar</h3>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 hover:border-primary"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold text-white min-w-[150px] text-center">
            {format(currentDate, "MMMM yyyy")}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 hover:border-primary"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayLabels.map((label) => (
          <div key={label} className="text-xs font-bold text-muted-foreground text-center py-2">
            {label}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-4">
        {/* Mini Calendar View */}
        <Card className="bg-card border-white/5 p-4">
          <div className="grid grid-cols-7 gap-1">
            {emptyDays.map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square" />
            ))}
            {daysInMonth.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const bookedCount = crew.filter((c) => crewAvailability[c.id].has(dayKey)).length;
              const availableCount = crew.length - bookedCount;

              return (
                <div
                  key={dayKey}
                  className={`aspect-square rounded-lg border flex flex-col items-center justify-center text-xs p-1 ${
                    isSameMonth(day, currentDate)
                      ? bookedCount === crew.length
                        ? "bg-red-500/20 border-red-500/50"
                        : bookedCount > 0
                          ? "bg-yellow-500/20 border-yellow-500/50"
                          : "bg-green-500/20 border-green-500/50"
                      : "bg-black/20 border-white/5"
                  }`}
                >
                  <span className="font-bold text-white">{format(day, "d")}</span>
                  {isSameMonth(day, currentDate) && (
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {availableCount}/{crew.length}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/50" />
              <span className="text-muted-foreground">All Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/50" />
              <span className="text-muted-foreground">Partially Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/50" />
              <span className="text-muted-foreground">All Booked</span>
            </div>
          </div>
        </Card>

        {/* Crew Availability Details */}
        <Card className="bg-card border-white/5 p-4">
          <h4 className="font-bold text-white mb-4">Crew Booking Details</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {crew.map((crewMember) => {
              const bookedDays = Array.from(crewAvailability[crewMember.id]);
              const upcomingBookedDays = bookedDays.filter((day) => {
                const d = new Date(day);
                return d >= monthStart && d <= monthEnd;
              });

              return (
                <div key={crewMember.id} className="pb-3 border-b border-white/5 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white text-sm">{crewMember.name}</span>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                      {upcomingBookedDays.length} days booked
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {upcomingBookedDays.length === 0 ? (
                      <span className="text-xs text-green-400">Available all month</span>
                    ) : (
                      upcomingBookedDays
                        .sort()
                        .map((day) => (
                          <span key={day} className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
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
