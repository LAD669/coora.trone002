import { supabase } from "@/lib/supabase";

export type AuditLog = {
  id: string;
  occurred_at: string;
  actor_id: string;
  table_name: "events" | "posts" | "notifications";
  op: "insert" | "update" | "delete";
  row_id: string;
  old_row?: unknown;
  new_row?: unknown;
};

export interface GetClubAuditLogsParams {
  clubId: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get audit logs for a specific club with optional time filtering and pagination
 * Only accessible by managers of the club due to RLS policies
 */
export async function getClubAuditLogs(params: GetClubAuditLogsParams): Promise<AuditLog[]> {
  const { 
    clubId, 
    from, 
    to, 
    limit = 100, 
    offset = 0 
  } = params;

  // Default to last 30 days if no time range specified
  const defaultFrom = new Date(Date.now() - 30 * 864e5).toISOString();
  const defaultTo = new Date().toISOString();

  const { data, error } = await supabase.rpc("get_club_audit_logs", {
    p_club_id: clubId,
    p_from: from ?? defaultFrom,
    p_to: to ?? defaultTo,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }

  return (data ?? []) as AuditLog[];
}

/**
 * Get recent audit logs for a club (last 7 days, limited to 50 entries)
 * Convenience function for dashboard/overview usage
 */
export async function getRecentClubAuditLogs(clubId: string): Promise<AuditLog[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  
  return getClubAuditLogs({
    clubId,
    from: sevenDaysAgo,
    limit: 50,
    offset: 0,
  });
}

/**
 * Get audit logs for a specific table within a club
 * Useful for filtering by table type (events, posts, notifications)
 */
export async function getClubAuditLogsByTable(
  clubId: string,
  tableName: "events" | "posts" | "notifications",
  params?: Omit<GetClubAuditLogsParams, 'clubId'>
): Promise<AuditLog[]> {
  const logs = await getClubAuditLogs({
    clubId,
    ...params,
  });

  return logs.filter(log => log.table_name === tableName);
}
