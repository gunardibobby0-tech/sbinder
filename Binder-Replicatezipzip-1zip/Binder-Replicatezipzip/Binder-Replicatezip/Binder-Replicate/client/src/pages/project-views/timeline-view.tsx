import { useEvents } from "@/hooks/use-events";
import { Card } from "@/components/ui/card";
import { Loader2, Calendar, Clock } from "lucide-react";
import { format, differenceInMinutes, startOfDay, endOfDay, parseISO } from "date-fns";
import { useMemo } from "react";

const EVENT_COLORS = {
  Shoot: "bg-red-500/30 border-red-500/60 text-red-400",
  Meeting: "bg-blue-500/30 border-blue-500/60 text-blue-400",
  Scout: "bg-green-500/30 border-green-500/60 text-green-400",
};

const EVENT_TYPE_COLORS = {
  Shoot: "bg-red-500/20 text-red-400 border-red-500/20",
  Meeting: "bg-blue-500/20 text-blue-400 border-blue-500/20",
  Scout: "bg-green-500/20 text-green-400 border-green-500/20",
};

interface GroupedEvent {
  date: string;
  events: Array<{
    id: number;
    title: string;
    type: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    offsetPercent: number;
    widthPercent: number;
  }>;
}

export default function TimelineView({ projectId }: { projectId: number }) {
  const { data: events, isLoading } = useEvents(projectId);

  const groupedEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    const grouped = new Map<string, typeof events>();
    
    events.forEach((event) => {
      const dateKey = format(parseISO(event.startTime), "yyyy-MM-dd");
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(event);
    });

    // Sort by date and convert to array
    return Array.from(grouped.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([dateStr, dayEvents]) => ({
        date: dateStr,
        events: dayEvents
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .map((event) => {
            const startDate = parseISO(event.startTime);
            const endDate = parseISO(event.endTime);
            const dayStart = startOfDay(startDate);
            const dayEnd = endOfDay(startDate);
            
            const durationMinutes = differenceInMinutes(endDate, startDate);
            const minutesInDay = 24 * 60;
            const offsetMinutes = differenceInMinutes(startDate, dayStart);
            
            return {
              id: event.id,
              title: event.title,
              type: event.type,
              startTime: event.startTime,
              endTime: event.endTime,
              durationMinutes,
              offsetPercent: (offsetMinutes / minutesInDay) * 100,
              widthPercent: Math.max((durationMinutes / minutesInDay) * 100, 5),
            };
          }),
      })) as GroupedEvent[];
  }, [events]);

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="inline-flex flex-col items-center gap-3">
          <Calendar className="w-12 h-12 text-muted-foreground/30" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">No Events Scheduled</h3>
            <p className="text-muted-foreground">Add events to your schedule to see the production timeline</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Production Timeline</h2>
        <p className="text-muted-foreground">Visual timeline of all scheduled events across your production</p>
      </div>

      <div className="space-y-6">
        {groupedEvents.map((dayGroup) => {
          const displayDate = parseISO(dayGroup.date);
          const isToday = format(new Date(), "yyyy-MM-dd") === dayGroup.date;
          const isFuture = displayDate > new Date();

          return (
            <Card
              key={dayGroup.date}
              className={`border overflow-hidden transition-colors ${
                isToday
                  ? "bg-blue-500/5 border-blue-500/30 shadow-lg shadow-blue-500/10"
                  : "bg-black/20 border-white/5 hover:border-white/10"
              }`}
            >
              {/* Day Header */}
              <div className="bg-black/30 px-6 py-4 border-b border-white/5 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground font-medium">
                        {format(displayDate, "EEE")}
                      </p>
                      <p className={`text-2xl font-bold ${
                        isToday ? "text-blue-400" : "text-white"
                      }`}>
                        {format(displayDate, "d")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(displayDate, "MMM yyyy")}
                      </p>
                    </div>
                    <div className="h-12 w-px bg-white/10" />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {dayGroup.events.length} event{dayGroup.events.length !== 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dayGroup.events.reduce((sum, e) => sum + e.durationMinutes, 0)} minutes total
                      </p>
                    </div>
                  </div>
                  {isToday && (
                    <div className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-xs font-medium text-blue-400">
                      Today
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="p-6">
                {/* Time ruler */}
                <div className="mb-4">
                  <div className="flex gap-2 text-xs text-muted-foreground mb-2">
                    {[0, 6, 12, 18, 24].map((hour) => (
                      <div
                        key={hour}
                        style={{ marginLeft: `${(hour / 24) * 100}%` }}
                        className="text-xs"
                      >
                        {hour === 0 ? "00:00" : hour === 24 ? "24:00" : `${hour}:00`}
                      </div>
                    ))}
                  </div>
                  <div className="relative h-8 bg-black/40 rounded border border-white/5 overflow-hidden">
                    {[0, 6, 12, 18].map((hour) => (
                      <div
                        key={hour}
                        className="absolute top-0 bottom-0 w-px bg-white/5"
                        style={{ left: `${(hour / 24) * 100}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Events */}
                <div className="space-y-3">
                  {dayGroup.events.map((event) => {
                    const colorClass = EVENT_COLORS[event.type as keyof typeof EVENT_COLORS] || EVENT_COLORS.Meeting;
                    const startTime = parseISO(event.startTime);
                    const endTime = parseISO(event.endTime);

                    return (
                      <div key={event.id} className="space-y-1">
                        <div className="relative h-12 bg-black/20 rounded border border-white/5 overflow-hidden">
                          <div
                            className={`absolute top-0 bottom-0 rounded border ${colorClass} flex items-center px-3 overflow-hidden group cursor-pointer transition-all hover:shadow-lg`}
                            style={{
                              left: `${event.offsetPercent}%`,
                              width: `${event.widthPercent}%`,
                            }}
                            title={`${event.title} - ${format(startTime, "HH:mm")} to ${format(endTime, "HH:mm")}`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-current truncate">
                                {event.title}
                              </p>
                              <p className="text-[10px] text-current/70 truncate">
                                {event.durationMinutes < 60
                                  ? `${event.durationMinutes}m`
                                  : `${Math.floor(event.durationMinutes / 60)}h ${event.durationMinutes % 60}m`}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Event Details */}
                        <div className="flex items-center gap-4 px-3 text-xs">
                          <span className={`px-2 py-0.5 rounded border font-medium ${
                            EVENT_TYPE_COLORS[event.type as keyof typeof EVENT_TYPE_COLORS] || EVENT_TYPE_COLORS.Meeting
                          }`}>
                            {event.type}
                          </span>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>
                              {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <Card className="bg-black/20 border-white/5 p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Event Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(EVENT_TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded border ${color}`} />
              <span className="text-sm text-muted-foreground">{type}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
