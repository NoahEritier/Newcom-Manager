import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { getOrCreateDefaultTeam, type Team } from '../db/supabase/team';
import { useAuth } from './useAuth';

type TeamContextValue = {
  team: Team | null;
  teamId: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const TeamContext = createContext<TeamContextValue>({
  team: null,
  teamId: null,
  isLoading: true,
  error: null,
  refresh: async () => {},
});

export function TeamProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) {
      setTeam(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setTeam(await getOrCreateDefaultTeam(session.user.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cargar tu equipo.');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <TeamContext.Provider value={{ team, teamId: team?.id ?? null, isLoading, error, refresh: load }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  return useContext(TeamContext);
}
