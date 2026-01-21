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

  // Find all neighbors where the piece has moved to the target position
  const validNeighbors = neighbors.filter(id => {
    const state = puzzleData.states[id];
    return state && state[pieceId] && state[pieceId][axisIdx] === targetVal;
  });

  if (validNeighbors.length === 0) return null;

  // Sort by number of moving pieces (ascending) to prefer minimal movement
  validNeighbors.sort((a, b) => {
    const stateA = puzzleData.states[a];
    const stateB = puzzleData.states[b];

    let changesA = 0;
    let changesB = 0;

    // Count changes for stateA
    for (const pid in stateA) {
      if (currentState[pid]) {
        if (stateA[pid][0] !== currentState[pid][0] ||
          stateA[pid][1] !== currentState[pid][1] ||
          stateA[pid][2] !== currentState[pid][2]) {
          changesA++;
        }
      }
    }

    // Count changes for stateB
    for (const pid in stateB) {
      if (currentState[pid]) {
        if (stateB[pid][0] !== currentState[pid][0] ||
          stateB[pid][1] !== currentState[pid][1] ||
          stateB[pid][2] !== currentState[pid][2]) {
          changesB++;
        }
      }
    }

    return changesA - changesB;
  });

  return validNeighbors[0];
}
