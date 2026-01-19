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
  if (!currentState) return null;

  const proposedPositions = JSON.parse(JSON.stringify(currentState));
  if (!proposedPositions[pieceId]) return null;

  proposedPositions[pieceId][axis === 'x' ? 0 : axis === 'y' ? 1 : 2] += delta;

  // Find if any existing state matches this proposed configuration
  const nextStateId = Object.keys(puzzleData.states).find(id => {
    const state = puzzleData.states[id];
    const stateKeys = Object.keys(state);
    const proposedKeys = Object.keys(proposedPositions);

    if (stateKeys.length !== proposedKeys.length) return false;

    return stateKeys.every(pid => {
      return proposedPositions[pid] &&
        state[pid][0] === proposedPositions[pid][0] &&
        state[pid][1] === proposedPositions[pid][1] &&
        state[pid][2] === proposedPositions[pid][2];
    });
  });

  if (!nextStateId) return null;

  // Check if there is a direct transition
  const isValidTransition = puzzleData.transitions.some(t =>
    (t[0] === currentStateId && t[1] === nextStateId) ||
    (t[1] === currentStateId && t[0] === nextStateId)
  );

  return isValidTransition ? nextStateId : null;
}
