import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { getOrCreateDefaultTeam } from '../db/supabase/team';
import { useAuth } from './useAuth';

type TeamContextValue = {
  teamId: string | null;
  isLoading: boolean;
  error: string | null;
};

const TeamContext = createContext<TeamContextValue>({
  teamId: null,
  isLoading: true,
  error: null,
});

export function TeamProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setTeamId(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    getOrCreateDefaultTeam(session.user.id)
      .then((team) => setTeamId(team.id))
      .catch((e) => setError(e instanceof Error ? e.message : 'No pudimos cargar tu equipo.'))
      .finally(() => setIsLoading(false));
  }, [session]);

  return <TeamContext.Provider value={{ teamId, isLoading, error }}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  return useContext(TeamContext);
}
