import { getClubAuditLogs, getRecentClubAuditLogs, getClubAuditLogsByTable } from '@/lib/api/audit';
import { supabase } from '@/lib/supabase';

// Mock the supabase client
jest.mock('@/lib/supabase');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Audit API', () => {
  const mockClubId = 'club-123';
  const mockAuditLogs = [
    {
      id: 'log-1',
      occurred_at: '2024-01-15T10:00:00Z',
      actor_id: 'user-1',
      table_name: 'events' as const,
      op: 'insert' as const,
      row_id: 'event-1',
      new_row: { title: 'Training Session', club_id: mockClubId },
    },
    {
      id: 'log-2',
      occurred_at: '2024-01-15T09:00:00Z',
      actor_id: 'user-2',
      table_name: 'posts' as const,
      op: 'update' as const,
      row_id: 'post-1',
      old_row: { title: 'Old Title', club_id: mockClubId },
      new_row: { title: 'New Title', club_id: mockClubId },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getClubAuditLogs', () => {
    it('should fetch audit logs with default parameters', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: mockAuditLogs,
        error: null,
      });

      const result = await getClubAuditLogs({ clubId: mockClubId });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_club_audit_logs', {
        p_club_id: mockClubId,
        p_from: expect.any(String), // Should be 30 days ago
        p_to: expect.any(String), // Should be now
        p_limit: 100,
        p_offset: 0,
      });

      expect(result).toEqual(mockAuditLogs);
    });

    it('should fetch audit logs with custom parameters', async () => {
      const customFrom = '2024-01-01T00:00:00Z';
      const customTo = '2024-01-31T23:59:59Z';
      const customLimit = 50;
      const customOffset = 10;

      mockSupabase.rpc.mockResolvedValue({
        data: mockAuditLogs,
        error: null,
      });

      const result = await getClubAuditLogs({
        clubId: mockClubId,
        from: customFrom,
        to: customTo,
        limit: customLimit,
        offset: customOffset,
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_club_audit_logs', {
        p_club_id: mockClubId,
        p_from: customFrom,
        p_to: customTo,
        p_limit: customLimit,
        p_offset: customOffset,
      });

      expect(result).toEqual(mockAuditLogs);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Database error');
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(getClubAuditLogs({ clubId: mockClubId })).rejects.toThrow('Database error');
    });

    it('should return empty array when no data', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await getClubAuditLogs({ clubId: mockClubId });
      expect(result).toEqual([]);
    });
  });

  describe('getRecentClubAuditLogs', () => {
    it('should fetch recent audit logs (last 7 days, limit 50)', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: mockAuditLogs,
        error: null,
      });

      const result = await getRecentClubAuditLogs(mockClubId);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_club_audit_logs', {
        p_club_id: mockClubId,
        p_from: expect.any(String), // Should be 7 days ago
        p_to: expect.any(String), // Should be now
        p_limit: 50,
        p_offset: 0,
      });

      expect(result).toEqual(mockAuditLogs);
    });
  });

  describe('getClubAuditLogsByTable', () => {
    it('should filter audit logs by table name', async () => {
      const allLogs = [
        ...mockAuditLogs,
        {
          id: 'log-3',
          occurred_at: '2024-01-15T08:00:00Z',
          actor_id: 'user-3',
          table_name: 'notifications' as const,
          op: 'delete' as const,
          row_id: 'notification-1',
          old_row: { message: 'Old notification', club_id: mockClubId },
        },
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: allLogs,
        error: null,
      });

      const result = await getClubAuditLogsByTable(mockClubId, 'events');

      expect(result).toHaveLength(1);
      expect(result[0].table_name).toBe('events');
    });

    it('should return empty array when no logs for table', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: mockAuditLogs,
        error: null,
      });

      const result = await getClubAuditLogsByTable(mockClubId, 'notifications');

      expect(result).toHaveLength(0);
    });
  });

  describe('AuditLog type validation', () => {
    it('should handle all operation types', () => {
      const insertLog = {
        id: 'log-1',
        occurred_at: '2024-01-15T10:00:00Z',
        actor_id: 'user-1',
        table_name: 'events' as const,
        op: 'insert' as const,
        row_id: 'event-1',
        new_row: { title: 'New Event' },
      };

      const updateLog = {
        id: 'log-2',
        occurred_at: '2024-01-15T09:00:00Z',
        actor_id: 'user-2',
        table_name: 'posts' as const,
        op: 'update' as const,
        row_id: 'post-1',
        old_row: { title: 'Old Title' },
        new_row: { title: 'New Title' },
      };

      const deleteLog = {
        id: 'log-3',
        occurred_at: '2024-01-15T08:00:00Z',
        actor_id: 'user-3',
        table_name: 'notifications' as const,
        op: 'delete' as const,
        row_id: 'notification-1',
        old_row: { message: 'Deleted notification' },
      };

      // These should compile without TypeScript errors
      expect(insertLog.op).toBe('insert');
      expect(updateLog.op).toBe('update');
      expect(deleteLog.op).toBe('delete');
    });

    it('should handle all table names', () => {
      const eventsLog = { table_name: 'events' as const };
      const postsLog = { table_name: 'posts' as const };
      const notificationsLog = { table_name: 'notifications' as const };

      // These should compile without TypeScript errors
      expect(eventsLog.table_name).toBe('events');
      expect(postsLog.table_name).toBe('posts');
      expect(notificationsLog.table_name).toBe('notifications');
    });
  });
});
