export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type PiecePosition = [number, number, number];

export interface PuzzleState {
  [pieceId: string]: PiecePosition;
}

export interface PuzzleData {
  id: string;
  name?: string;
  voxel_size: number;
  states: {
    [stateId: string]: PuzzleState;
  };
  transitions: [string, string][];
  goal_states?: string[];
  level?: number;
}

export interface PuzzleManifestItem {
  id: string;
  name: string;
  level?: number;
}
