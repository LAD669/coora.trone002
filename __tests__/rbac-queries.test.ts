import { getTeamPlayersOnly, getTeamPlayersForPOM, getTrainerTeamPlayers } from '../lib/supabase';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          neq: jest.fn(() => ({
            order: jest.fn(() => ({
              data: [],
              error: null
            }))
          })),
          order: jest.fn(() => ({
            data: [],
            error: null
          }))
        })),
        neq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [],
            error: null
          }))
        })),
        order: jest.fn(() => ({
          data: [],
          error: null
        }))
      })),
      in: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              data: [],
              error: null
            }))
          }))
        }))
      }))
    }))
  }))
};

// Mock the supabase module
jest.mock('../lib/supabaseClient', () => ({
  supabase: mockSupabase
}));

describe('RBAC Query Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTeamPlayersOnly', () => {
    it('should only return PLAYERs with active=true', async () => {
      const mockData = [
        {
          id: 'player1',
          first_name: 'John',
          last_name: 'Doe',
          team_role: 'player',
          active: true
        },
        {
          id: 'trainer1',
          first_name: 'Coach',
          last_name: 'Smith',
          team_role: 'trainer',
          active: true
        }
      ];

      mockSupabase.from().select().eq().eq().eq().order.mockReturnValue({
        data: mockData,
        error: null
      });

      const result = await getTeamPlayersOnly('team1');

      // Verify the query was called with correct filters
      expect(mockSupabase.from).toHaveBeenCalledWith('team_users_view');
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('team_id', 'team1');
      expect(mockSupabase.from().select().eq().eq).toHaveBeenCalledWith('team_role', 'player');
      expect(mockSupabase.from().select().eq().eq().eq).toHaveBeenCalledWith('active', true);
    });

    it('should exclude trainers from results', async () => {
      const mockData = [
        {
          id: 'player1',
          first_name: 'John',
          last_name: 'Doe',
          team_role: 'player',
          active: true
        }
      ];

      mockSupabase.from().select().eq().eq().eq().order.mockReturnValue({
        data: mockData,
        error: null
      });

      const result = await getTeamPlayersOnly('team1');

      // Verify only players are returned
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('player');
    });
  });

  describe('getTeamPlayersForPOM', () => {
    it('should exclude self from eligibles', async () => {
      const mockData = [
        {
          user_id: 'player2',
          users: {
            id: 'player2',
            first_name: 'Jane',
            last_name: 'Doe'
          }
        }
      ];

      mockSupabase.from().select().eq().eq().eq().neq().order.mockReturnValue({
        data: mockData,
        error: null
      });

      const result = await getTeamPlayersForPOM('team1', 'player1');

      // Verify the query excludes current user
      expect(mockSupabase.from().select().eq().eq().eq().neq).toHaveBeenCalledWith('user_id', 'player1');
    });

    it('should exclude trainers from eligibles', async () => {
      const mockData = [
        {
          user_id: 'player1',
          users: {
            id: 'player1',
            first_name: 'John',
            last_name: 'Doe'
          }
        }
      ];

      mockSupabase.from().select().eq().eq().eq().neq().order.mockReturnValue({
        data: mockData,
        error: null
      });

      const result = await getTeamPlayersForPOM('team1', 'player1');

      // Verify only players are returned (no trainers)
      expect(mockSupabase.from().select().eq().eq).toHaveBeenCalledWith('team_role', 'player');
    });

    it('should sort by name ascending', async () => {
      mockSupabase.from().select().eq().eq().eq().neq().order.mockReturnValue({
        data: [],
        error: null
      });

      await getTeamPlayersForPOM('team1', 'player1');

      // Verify sorting by first_name ascending
      expect(mockSupabase.from().select().eq().eq().eq().neq().order).toHaveBeenCalledWith('users.first_name', { ascending: true });
    });
  });

  describe('getTrainerTeamPlayers', () => {
    it('should return players only from trainer teams', async () => {
      const mockTrainerTeams = [
        { team_id: 'team1' },
        { team_id: 'team2' }
      ];

      const mockPlayers = [
        {
          id: 'player1',
          first_name: 'John',
          last_name: 'Doe',
          team_role: 'player',
          active: true
        }
      ];

      // Mock the trainer teams query
      mockSupabase.from().select().eq().eq().eq.mockReturnValueOnce({
        data: mockTrainerTeams,
        error: null
      });

      // Mock the players query
      mockSupabase.from().select().in().eq().eq().order.mockReturnValue({
        data: mockPlayers,
        error: null
      });

      const result = await getTrainerTeamPlayers('trainer1');

      // Verify trainer teams query
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('user_id', 'trainer1');
      expect(mockSupabase.from().select().eq().eq).toHaveBeenCalledWith('team_role', 'trainer');
      expect(mockSupabase.from().select().eq().eq().eq).toHaveBeenCalledWith('active', true);

      // Verify players query
      expect(mockSupabase.from().select().in).toHaveBeenCalledWith('team_id', ['team1', 'team2']);
      expect(mockSupabase.from().select().in().eq).toHaveBeenCalledWith('team_role', 'player');
      expect(mockSupabase.from().select().in().eq().eq).toHaveBeenCalledWith('active', true);
    });

    it('should return empty array if trainer has no teams', async () => {
      mockSupabase.from().select().eq().eq().eq.mockReturnValue({
        data: [],
        error: null
      });

      const result = await getTrainerTeamPlayers('trainer1');

      expect(result).toEqual([]);
    });
  });
});
