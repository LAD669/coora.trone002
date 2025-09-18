import { supabase } from "@/lib/supabase";

export type SoftDeleteTable = "events" | "posts" | "notifications";

/**
 * Soft delete a record (set deleted_at timestamp)
 * Only accessible by users with admin, trainer, or manager roles
 */
export async function softDeleteRecord(
  tableName: SoftDeleteTable,
  recordId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("soft_delete_record", {
    p_table_name: tableName,
    p_record_id: recordId,
  });

  if (error) {
    console.error(`Error soft deleting ${tableName} record:`, error);
    throw error;
  }

  return data === true;
}

/**
 * Restore a soft-deleted record (set deleted_at to null)
 * Only accessible by users with admin, trainer, or manager roles
 */
export async function restoreRecord(
  tableName: SoftDeleteTable,
  recordId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("restore_record", {
    p_table_name: tableName,
    p_record_id: recordId,
  });

  if (error) {
    console.error(`Error restoring ${tableName} record:`, error);
    throw error;
  }

  return data === true;
}

/**
 * Permanently delete old soft-deleted records
 * Only accessible by authenticated users (typically admins)
 */
export async function cleanupOldSoftDeletes(
  daysOld: number = 90
): Promise<Array<{ table_name: string; deleted_count: number }>> {
  const { data, error } = await supabase.rpc("cleanup_old_soft_deletes", {
    p_days_old: daysOld,
  });

  if (error) {
    console.error("Error cleaning up old soft deletes:", error);
    throw error;
  }

  return data || [];
}

/**
 * Check if a record is soft-deleted
 * Helper function to determine record status
 */
export async function isRecordSoftDeleted(
  tableName: SoftDeleteTable,
  recordId: string
): Promise<boolean> {
  let query;
  
  switch (tableName) {
    case "events":
      query = supabase
        .from("events")
        .select("deleted_at")
        .eq("id", recordId)
        .single();
      break;
    case "posts":
      query = supabase
        .from("posts")
        .select("deleted_at")
        .eq("id", recordId)
        .single();
      break;
    case "notifications":
      query = supabase
        .from("notifications")
        .select("deleted_at")
        .eq("id", recordId)
        .single();
      break;
    default:
      throw new Error(`Invalid table name: ${tableName}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`Error checking soft delete status for ${tableName}:`, error);
    throw error;
  }

  return data?.deleted_at !== null;
}
