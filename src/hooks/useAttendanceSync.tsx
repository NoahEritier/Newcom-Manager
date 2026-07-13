import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { countPendingRows } from '../db/local/attendance';
import { pullAttendance, syncAttendance } from '../sync/attendanceSync';

export function useAttendanceSync(teamId: string | null) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const teamIdRef = useRef(teamId);
  teamIdRef.current = teamId;

  const refreshPendingCount = useCallback(async () => {
    setPendingCount(await countPendingRows());
  }, []);

  const syncNow = useCallback(async () => {
    if (!teamIdRef.current) return;
    setIsSyncing(true);
    setError(null);
    try {
      await syncAttendance(teamIdRef.current);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos sincronizar.');
    } finally {
      setIsSyncing(false);
      await refreshPendingCount();
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    if (!teamId) return;
    // Pull inicial silencioso: si falla (sin señal), no bloquea la pantalla.
    pullAttendance(teamId)
      .catch(() => {})
      .finally(refreshPendingCount);
  }, [teamId, refreshPendingCount]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && teamIdRef.current) {
        syncNow();
      }
    });
    return unsubscribe;
  }, [syncNow]);

  return { isSyncing, pendingCount, error, syncNow, refreshPendingCount };
}
