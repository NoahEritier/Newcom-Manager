import { getDb } from './db';

export type CachedPlayer = {
  id: string;
  team_id: string;
  full_name: string;
  is_active: number;
};

// Cache de solo lectura: se reemplaza entero en cada pull, no tiene cola de sync propia.
export async function replacePlayersCache(
  teamId: string,
  players: { id: string; full_name: string }[]
): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM players_cache WHERE team_id = ?', teamId);
    for (const player of players) {
      await db.runAsync(
        'INSERT INTO players_cache (id, team_id, full_name, is_active) VALUES (?, ?, ?, 1)',
        player.id,
        teamId,
        player.full_name
      );
    }
  });
}

export async function getCachedPlayers(teamId: string): Promise<CachedPlayer[]> {
  const db = await getDb();
  return db.getAllAsync<CachedPlayer>(
    'SELECT * FROM players_cache WHERE team_id = ? ORDER BY full_name ASC',
    teamId
  );
}
