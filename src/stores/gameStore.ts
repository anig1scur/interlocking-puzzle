import { writable, type Writable, get } from 'svelte/store';
import type { PuzzleData, PuzzleManifestItem } from '../types/puzzle';

export const currentPuzzleId: Writable<string | null> = writable(null);
export const puzzleData: Writable<PuzzleData | null> = writable(null);
export const currentStateId: Writable<string> = writable("0");
export const moveCount: Writable<number> = writable(0);
export const activePieceId: Writable<string | null> = writable(null);
export const isVictory: Writable<boolean> = writable(false);
export const puzzleList: Writable<PuzzleManifestItem[]> = writable([]);
export const isLoading: Writable<boolean> = writable(false);
export const startTime: Writable<number | null> = writable(null);
export const completionTime: Writable<number | null> = writable(null);

export const resetGame = () => {
    currentStateId.set("0");
    moveCount.set(0);
    activePieceId.set(null);
    isVictory.set(false);
  startTime.set(Date.now());
  completionTime.set(null);
};

export const selectPuzzle = async (id: string) => {
  if (id === get(currentPuzzleId) && get(puzzleData)) return;

  isLoading.set(true);
  currentPuzzleId.set(id);
  resetGame();

  try {
    const res = await fetch(`${ import.meta.env.BASE_URL }assets/${ id }/puzzle_data.json`);
    const data = await res.json();
    data.id = id; // ensure ID is attached
    puzzleData.set(data);
  } catch (e) {
    console.error(`Failed to load puzzle ${ id }`, e);
  } finally {
    isLoading.set(false);
  }
};

export const nextPuzzle = () => {
  const list = get(puzzleList);
  if (list.length === 0) return;

  const currentId = get(currentPuzzleId);
  const currentIndex = list.findIndex(p => p.id === currentId);

  const nextIndex = (currentIndex + 1) % list.length;
  selectPuzzle(list[nextIndex].id);
};
