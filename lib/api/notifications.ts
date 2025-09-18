import { supabase } from "@/lib/supabase";

export type ClubNotification = {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  event_id: string | null;
  team_id: string;
  scheduled_for: string;
  sent: boolean;
  read_by: unknown;
  created_at: string;
};

export async function fetchClubNotifications(params: {
  clubId: string;
  from?: string;
  to?: string;
  onlyUnread?: boolean;
  userId: string;
}) {
  const { clubId, userId, from, to, onlyUnread } = params;
  const { data, error } = await supabase.rpc("get_club_notifications", {
    p_club_id: clubId,
    p_from: from ?? new Date(Date.now() - 30 * 864e5).toISOString(),
    p_to: to ?? new Date(Date.now() + 30 * 864e5).toISOString(),
    p_only_unread: !!onlyUnread,
    p_user_id: userId,
  });
  if (error) throw error;
  return data as ClubNotification[];
}

export async function markNotificationRead(id: string, userId: string) {
  const { data, error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: id,
    p_user_id: userId,
  });
  if (error) throw error;
  return data as boolean;
}
