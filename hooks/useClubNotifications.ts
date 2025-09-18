import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClubNotifications, markNotificationRead } from "@/lib/api/notifications";

export function useClubNotifications(clubId: string, userId: string, onlyUnread = false) {
  return useQuery({
    queryKey: ["clubNotifications", clubId, userId, onlyUnread],
    queryFn: () => fetchClubNotifications({ clubId, userId, onlyUnread }),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
  });
}

export function useMarkNotificationRead(clubId: string, userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clubNotifications", clubId, userId, false] });
      qc.invalidateQueries({ queryKey: ["clubNotifications", clubId, userId, true] });
    },
  });
}
