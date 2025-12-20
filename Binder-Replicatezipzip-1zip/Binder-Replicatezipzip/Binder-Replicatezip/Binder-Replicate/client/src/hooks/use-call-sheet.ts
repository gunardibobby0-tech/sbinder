import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@shared/schema";

export function useGenerateCallSheet() {
  return useMutation({
    mutationFn: async (data: {
      projectId: number;
      eventId: number;
      eventDetails: Event;
      crewMembers: any[];
      equipmentList: any[];
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/projects/${data.projectId}/call-sheet`,
        {
          eventId: data.eventId,
          eventDetails: data.eventDetails,
          crewMembers: data.crewMembers,
          equipmentList: data.equipmentList,
        }
      );
      
      if (!res.ok) {
        throw new Error("Failed to generate call sheet");
      }

      // Get blob and download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `call-sheet-${data.eventId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return blob;
    },
  });
}
