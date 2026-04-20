import { useState, useCallback } from 'react';
import { loadData, saveData } from '../utils/storage';

export function useStorage() {
  const [data, setData] = useState(() => loadData());

  const updateData = useCallback((updater) => {
    setData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveData(next);
      return next;
    });
  }, []);

  const addRound = useCallback((round) => {
    updateData((prev) => ({
      ...prev,
      rounds: [...prev.rounds, round],
    }));
  }, [updateData]);

  const updateRound = useCallback((roundId, updater) => {
    updateData((prev) => ({
      ...prev,
      rounds: prev.rounds.map((r) =>
        r.id === roundId
          ? typeof updater === 'function' ? updater(r) : { ...r, ...updater }
          : r
      ),
    }));
  }, [updateData]);

  const deleteRound = useCallback((roundId) => {
    updateData((prev) => ({
      ...prev,
      rounds: prev.rounds.filter((r) => r.id !== roundId),
    }));
  }, [updateData]);

  const updateHole = useCallback((roundId, holeNumber, updater) => {
    updateRound(roundId, (round) => ({
      ...round,
      holes: round.holes.map((h) =>
        h.holeNumber === holeNumber
          ? typeof updater === 'function' ? updater(h) : { ...h, ...updater }
          : h
      ),
    }));
  }, [updateRound]);

  return { data, addRound, updateRound, deleteRound, updateHole };
}
