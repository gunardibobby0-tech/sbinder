import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import type { Event, Crew, CrewAssignment } from "@shared/schema";
import { Clock, MapPin, Users, Plus, Trash2, Briefcase, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useCrew, useCrewAssignments, useCreateCrewAssignment, useDeleteCrewAssignment, useCheckCrewConflicts } from "@/hooks/use-crew";
import { useUpdateEvent } from "@/hooks/use-events";
import { useQueryClient } from "@tanstack/react-query";
import { LocationPicker } from "@/components/location-picker";

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
  const [conflictWarnings, setConflictWarnings] = useState<Record<number, Array<{ eventTitle: string; startTime: Date; endTime: Date }>>>({});
  const [editData, setEditData] = useState<Partial<Event>>({});
  
  const { data: crew = [], isLoading: crewLoading } = useCrew(projectId || 0);
  const { data: assignments = [], isLoading: assignmentsLoading } = useCrewAssignments(projectId || 0);
  const { mutate: assignCrew, isPending: isAssigning } = useCreateCrewAssignment();
  const { mutate: deleteCrew, isPending: isDeleting } = useDeleteCrewAssignment();
  const { mutate: checkConflicts } = useCheckCrewConflicts();
  const { mutate: updateEvent, isPending: isUpdating } = useUpdateEvent();
  const queryClient = useQueryClient();

  const eventAssignments = assignments.filter(a => a.eventId === event?.id);

  if (!event) return null;

  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);

  const handleStartEdit = () => {
    setEditData({
      title: event.title,
      description: event.description,
      latitude: event.latitude,
      longitude: event.longitude,
      startTime: event.startTime,
      endTime: event.endTime,
    });
    setIsEditing(true);
  };

  const handleSaveChanges = () => {
    if (event.id && projectId) {
      const startTime = editData.startTime instanceof Date ? editData.startTime.toISOString() : (editData.startTime || event.startTime);
      const endTime = editData.endTime instanceof Date ? editData.endTime.toISOString() : (editData.endTime || event.endTime);
      
      updateEvent(
        {
          projectId,
          eventId: event.id,
          data: {
            title: editData.title || event.title,
            description: editData.description || event.description,
            latitude: editData.latitude,
            longitude: editData.longitude,
            startTime,
            endTime,
          },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["events", projectId] });
            setIsEditing(false);
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1c2128] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isEditing ? (
              <Input
                value={editData.title || event.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="bg-black/20 border-white/10 text-white text-2xl"
              />
            ) : (
              event.title
            )}
          </DialogTitle>
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
            {isEditing ? (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Start Date & Time</label>
                    <Input
                      type="datetime-local"
                      value={format(new Date(editData.startTime || event.startTime), "yyyy-MM-dd'T'HH:mm")}
                      onChange={(e) => setEditData({ ...editData, startTime: new Date(e.target.value) })}
                      className="bg-black/20 border-white/10 text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">End Date & Time</label>
                    <Input
                      type="datetime-local"
                      value={format(new Date(editData.endTime || event.endTime), "yyyy-MM-dd'T'HH:mm")}
                      onChange={(e) => setEditData({ ...editData, endTime: new Date(e.target.value) })}
                      className="bg-black/20 border-white/10 text-white mt-1"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <div>
                  <span className="text-sm">{format(startTime, "EEEE, MMMM d, yyyy")}</span>
                  <span className="text-white ml-2 font-medium">
                    {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                  </span>
                </div>
              </div>
            )}

            {isEditing ? (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Location Notes</label>
                <Textarea
                  value={editData.description || event.description || ""}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="bg-black/20 border-white/10 text-white mt-1 resize-none"
                  rows={2}
                />
              </div>
            ) : (
              event.description && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="text-white">{event.description}</span>
                </div>
              )
            )}
          </Card>

          {/* Location Picker */}
          {isEditing && (
            <Card className="bg-black/20 border-white/10 p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Location (Coordinates)
              </h3>
              <LocationPicker
                latitude={editData.latitude}
                longitude={editData.longitude}
                onLocationChange={(lat, lng) => {
                  setEditData({ ...editData, latitude: lat, longitude: lng });
                }}
              />
            </Card>
          )}

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
                disabled={crew.length === 0 || isEditing}
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
                          onClick={() => deleteCrew(assignment.id!)}
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
                      const hasConflict = conflictWarnings[crewMember.id!];
                      return (
                        <div key={crewMember.id}>
                          <button
                            onClick={() => {
                              if (!isAssigned && crewMember.id && event.id && projectId) {
                                checkConflicts(
                                  { projectId, crewId: crewMember.id, eventId: event.id },
                                  {
                                    onSuccess: (result) => {
                                      setConflictWarnings(prev => ({
                                        ...prev,
                                        [crewMember.id!]: result.conflicts
                                      }));
                                      if (!result.hasConflict) {
                                        assignCrew(
                                          { projectId, data: { projectId, eventId: event.id, crewId: crewMember.id! } },
                                          {
                                            onSuccess: () => {
                                              queryClient.invalidateQueries({ queryKey: ["crew-assignments", projectId] });
                                              setConflictWarnings(prev => {
                                                const updated = { ...prev };
                                                delete updated[crewMember.id!];
                                                return updated;
                                              });
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
                                : hasConflict
                                ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                                : "bg-black/20 border-white/10 hover:border-primary hover:bg-primary/10 text-white"
                            }`}
                          >
                            <div className="font-medium">{crewMember.name}</div>
                            <div className="text-xs text-muted-foreground">{crewMember.department}</div>
                            {isAssigned && <div className="text-xs text-green-400 mt-1">✓ Assigned</div>}
                          </button>
                          {hasConflict && (
                            <div className="mt-1 ml-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
                              <div className="flex gap-1 items-start">
                                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="font-medium">Schedule conflict:</p>
                                  {hasConflict.map((conflict, idx) => (
                                    <p key={idx}>{conflict.eventTitle} ({format(new Date(conflict.startTime), "h:mm a")})</p>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAssigningCrew(false);
                      setConflictWarnings({});
                    }}
                    className="w-full"
                  >
                    Done
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Event Notes */}
          {!isEditing && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                className="bg-black/20 border-white/10 text-white resize-none"
                placeholder="Add any additional details about this schedule..."
                defaultValue={event.description || ""}
                disabled={true}
                rows={3}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                if (isEditing) setIsEditing(false);
                else onOpenChange(false);
              }}
            >
              {isEditing ? "Cancel" : "Close"}
            </Button>
            {isEditing ? (
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={handleSaveChanges}
                disabled={isUpdating}
              >
                Save Changes
              </Button>
            ) : (
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={handleStartEdit}
              >
                Edit Schedule
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
