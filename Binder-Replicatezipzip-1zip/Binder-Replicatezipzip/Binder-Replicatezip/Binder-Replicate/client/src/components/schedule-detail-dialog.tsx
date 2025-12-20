import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import type { Event, Crew, CrewAssignment } from "@shared/schema";
import { Clock, MapPin, Users, Plus, Trash2, Briefcase } from "lucide-react";
import { useState } from "react";
import { useCrew, useCrewAssignments, useCreateCrewAssignment, useDeleteCrewAssignment, useCheckCrewConflicts } from "@/hooks/use-crew";
import { useQueryClient } from "@tanstack/react-query";

interface ScheduleDetailDialogProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: number;
}

export function ScheduleDetailDialog({
  event,
  open,
  onOpenChange,
  projectId,
}: ScheduleDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [assigningCrew, setAssigningCrew] = useState(false);
  const [crewConflicts, setCrewConflicts] = useState<{ [key: number]: boolean }>({});
  const { data: crew = [], isLoading: crewLoading } = useCrew(projectId || 0);
  const { data: assignments = [], isLoading: assignmentsLoading } = useCrewAssignments(projectId || 0);
  const { mutate: assignCrew, isPending: isAssigning } = useCreateCrewAssignment();
  const { mutate: deleteCrew, isPending: isDeleting } = useDeleteCrewAssignment();
  const { mutate: checkConflicts } = useCheckCrewConflicts();
  const queryClient = useQueryClient();

  const eventAssignments = assignments.filter(a => a.eventId === event?.id);

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1c2128] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Event Type & Status */}
          <div className="flex gap-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              event.type === 'Shoot' ? 'bg-red-500/20 text-red-400' :
              event.type === 'Meeting' ? 'bg-blue-500/20 text-blue-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {event.type}
            </span>
          </div>

          {/* Schedule Details */}
          <Card className="bg-black/20 border-white/10 p-4 space-y-3">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <div>
                <span className="text-sm">{format(new Date(event.startTime), "EEEE, MMMM d, yyyy")}</span>
                <span className="text-white ml-2 font-medium">
                  {format(new Date(event.startTime), "h:mm a")} - {format(new Date(event.endTime), "h:mm a")}
                </span>
              </div>
            </div>

            {event.description && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="text-white">{event.description}</span>
              </div>
            )}
          </Card>

          {/* Crew Assignments Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Crew Assignments</h3>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAssigningCrew(true)}
                className="border-primary/50 hover:border-primary text-primary hover:text-primary"
                disabled={crew.length === 0}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Crew
              </Button>
            </div>
            <Card className="bg-black/20 border-white/10 p-4">
              {eventAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No crew assigned. Click "Add Crew" to assign from master list.</p>
              ) : (
                <div className="space-y-2">
                  {eventAssignments.map((assignment) => {
                    const crewMember = crew.find(c => c.id === assignment.crewId);
                    return (
                      <div key={assignment.id} className="flex items-center justify-between bg-black/20 p-3 rounded border border-white/5">
                        <div>
                          <p className="font-medium text-white">{crewMember?.name}</p>
                          <p className="text-xs text-muted-foreground">{crewMember?.title} • {crewMember?.department}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (projectId) {
                              deleteCrew({ projectId, assignmentId: assignment.id });
                            }
                          }}
                          disabled={isDeleting}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Crew Selection Modal */}
            {assigningCrew && crew.length > 0 && (
              <Card className="bg-black/20 border border-white/10 p-4">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-white">Select crew members to assign:</p>
                  <div className="max-h-[200px] overflow-y-auto space-y-2">
                    {crew.map((crewMember) => {
                      const isAssigned = eventAssignments.some(a => a.crewId === crewMember.id);
                      return (
                        <button
                          key={crewMember.id}
                          onClick={() => {
                            if (!isAssigned && crewMember.id && event.id && projectId) {
                              checkConflicts(
                                { projectId, crewId: crewMember.id, eventId: event.id },
                                {
                                  onSuccess: (result) => {
                                    if (result.hasConflict) {
                                      setCrewConflicts({ ...crewConflicts, [crewMember.id!]: true });
                                    } else {
                                      assignCrew(
                                        { projectId, data: { projectId, eventId: event.id, crewId: crewMember.id! } },
                                        {
                                          onSuccess: () => {
                                            queryClient.invalidateQueries({ queryKey: ["crew-assignments", projectId] });
                                          },
                                        }
                                      );
                                    }
                                  },
                                }
                              );
                            }
                          }}
                          disabled={isAssigned || isAssigning}
                          className={`w-full text-left px-3 py-2 rounded border transition-colors ${
                            isAssigned
                              ? "bg-green-500/10 border-green-500/20 text-green-400 cursor-not-allowed"
                              : "bg-black/20 border-white/10 hover:border-primary hover:bg-primary/10 text-white"
                          }`}
                        >
                          <div className="font-medium">{crewMember.name}</div>
                          <div className="text-xs text-muted-foreground">{crewMember.department}</div>
                          {isAssigned && <div className="text-xs text-green-400 mt-1">✓ Assigned</div>}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAssigningCrew(false)}
                    className="w-full"
                  >
                    Done
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Event Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              className="bg-black/20 border-white/10 text-white resize-none"
              placeholder="Add any additional details about this schedule..."
              defaultValue={event.description || ""}
              disabled={!isEditing}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Save Changes" : "Edit Schedule"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
