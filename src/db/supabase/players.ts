import { supabase } from './client';

export type MedicalStatus = 'vigente' | 'vencido' | 'unknown';

export type Player = {
  id: string;
  team_id: string;
  full_name: string;
  birth_date: string | null;
  phone: string | null;
  whatsapp: string | null;
  medical_status: MedicalStatus;
  medical_expiry: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PlayerInput = {
  full_name: string;
  birth_date: string | null;
  phone: string | null;
  whatsapp: string | null;
  medical_status: MedicalStatus;
  medical_expiry: string | null;
  notes: string | null;
};

export async function listPlayers(teamId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId)
    .eq('is_active', true)
    .order('full_name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getPlayer(playerId: string): Promise<Player> {
  const { data, error } = await supabase.from('players').select('*').eq('id', playerId).single();
  if (error) throw error;
  return data;
}

export async function createPlayer(teamId: string, input: PlayerInput): Promise<void> {
  const { error } = await supabase.from('players').insert({ team_id: teamId, ...input });
  if (error) throw error;
}

export async function updatePlayer(playerId: string, input: PlayerInput): Promise<void> {
  const { error } = await supabase.from('players').update(input).eq('id', playerId);
  if (error) throw error;
}

// Baja lógica: nunca delete físico (así conserva historial de asistencia/torneos).
export async function deactivatePlayer(playerId: string): Promise<void> {
  const { error } = await supabase.from('players').update({ is_active: false }).eq('id', playerId);
  if (error) throw error;
}
