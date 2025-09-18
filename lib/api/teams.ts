import { supabase } from "@/lib/supabase";

export type Team = {
  id: string;
  name: string;
  age_group: string | null;
  level: string | null;
  club_id: string | null;
  color?: string | null;
  sport?: string | null;
};

export async function getClubTeams(clubId: string): Promise<Team[]> {
  const { data, error } = await supabase.rpc("get_club_teams", { p_club_id: clubId });
  if (error) throw error;
  return (data ?? []) as Team[];
}

export default getClubTeams;
