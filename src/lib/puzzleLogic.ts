import type { PuzzleData } from '../types/puzzle';

export function calculateGoalStates(puzzleData: PuzzleData): Set<string> {
  const goalStates = new Set<string>();
  
  if (puzzleData.goal_states && puzzleData.goal_states.length > 0) {
    puzzleData.goal_states.forEach(id => goalStates.add(id));
    console.log("Using kernel-graph derived goal states:", goalStates);
  } else {
    // Fallback to leaf node detection
    const adjacency: Record<string, Set<string>> = {};
    puzzleData.transitions.forEach(t => {
      if (!adjacency[t[0]]) adjacency[t[0]] = new Set();
      if (!adjacency[t[1]]) adjacency[t[1]] = new Set();
      adjacency[t[0]].add(t[1]);
      adjacency[t[1]].add(t[0]);
    });

    Object.keys(adjacency).forEach(id => {
      if (id !== "0" && adjacency[id].size === 1) {
        goalStates.add(id);
      }
    });
    console.log("Falling back to leaf nodes for goal states");
  }
  return goalStates;
}

export function tryMove(
  puzzleData: PuzzleData,
  currentStateId: string,
  pieceId: string,
  axis: 'x' | 'y' | 'z',
  delta: number
): string | null {
  const currentState = puzzleData.states[currentStateId];
  if (!currentState || !currentState[pieceId]) return null;

  const neighbors = puzzleData.transitions
    .filter(t => t[0] === currentStateId || t[1] === currentStateId)
    .map(t => (t[0] === currentStateId ? t[1] : t[0]));

  const axisIdx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
  const targetVal = currentState[pieceId][axisIdx] + delta;

  // Find a neighbor where the piece has moved to the target position
  const nextStateId = neighbors.find(id => {
    const state = puzzleData.states[id];
    return state && state[pieceId] && state[pieceId][axisIdx] === targetVal;
  });

  return nextStateId || null;
}
