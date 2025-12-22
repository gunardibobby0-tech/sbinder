import { useGenerateCallSheet } from "@/hooks/use-call-sheet";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Loader2, FileDown, Calendar, Clock, Users, Wrench } from "lucide-react";
import { format } from "date-fns";
import type { Event } from "@shared/schema";
import { useState } from "react";

interface CallSheetGeneratorProps {
  projectId: number;
  event: Event;
  crew?: any[];
}

export function CallSheetGenerator({ projectId, event, crew = [] }: CallSheetGeneratorProps) {
  const { mutate: generateCallSheet, isPending } = useGenerateCallSheet();
  const [open, setOpen] = useState(false);

  // Deduplicate crew by name to prevent duplicate entries in PDF
  const uniqueCrew = Array.from(
    new Map(crew.map(item => [item.name, item])).values()
  );

  const handleGenerate = () => {
    generateCallSheet(
      {
        projectId,
        eventId: event.id,
        eventDetails: event,
        crewMembers: uniqueCrew,
        equipmentList: [],
      },
      {
        onSuccess: () => {
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          variant="outline" 
          className="border-white/10 hover:border-white/20"
          onClick={(e) => e.stopPropagation()}
        >
          <FileDown className="w-4 h-4 mr-2" />
          Call Sheet
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1c2128] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Call Sheet</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Event Preview */}
          <Card className="bg-black/30 border-white/10 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Event</p>
                <p className="font-medium text-white">{event.title}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="font-medium text-white">
                  {format(new Date(event.startTime), "MMM d, yyyy")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(event.startTime), "h:mm a")} - {format(new Date(event.endTime), "h:mm a")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Crew Members</p>
                <p className="font-medium text-white">{crew.length} assigned</p>
              </div>
            </div>

            {event.type && (
              <div className="flex items-start gap-3">
                <Wrench className="w-4 h-4 text-orange-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Event Type</p>
                  <p className="font-medium text-white">{event.type}</p>
                </div>
              </div>
            )}
          </Card>

          <p className="text-xs text-muted-foreground">
            Click generate to create a professional call sheet PDF with all event details, crew assignments, and logistics.
          </p>

          <Button
            onClick={handleGenerate}
            disabled={isPending}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                Generate & Download PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
