import { writable, type Writable } from 'svelte/store';
import type { PuzzleData, PuzzleManifestItem } from '../types/puzzle';

export const currentPuzzleId: Writable<string | null> = writable(null);
export const puzzleData: Writable<PuzzleData | null> = writable(null);
export const currentStateId: Writable<string> = writable("0");
export const moveCount: Writable<number> = writable(0);
export const activePieceId: Writable<string | null> = writable(null);
export const isVictory: Writable<boolean> = writable(false);
export const puzzleList: Writable<PuzzleManifestItem[]> = writable([]);

export const resetGame = () => {
    currentStateId.set("0");
    moveCount.set(0);
    activePieceId.set(null);
    isVictory.set(false);
};
