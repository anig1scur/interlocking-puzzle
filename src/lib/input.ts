import * as THREE from 'three';

export class KeyboardInput {
  public keysPressed = new Set<string>();

  constructor() {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
  }

  init() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
    }
  }

  dispose() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
    }
  }

  private onKeyDown(event: KeyboardEvent) {
    if (event.repeat && !['w','a','s','d'].includes(event.key.toLowerCase())) return; 
    // This class mostly tracks state and helper functions.
    
    this.keysPressed.add(event.key.toLowerCase());
  }

  private onKeyUp(event: KeyboardEvent) {
    this.keysPressed.delete(event.key.toLowerCase());
  }

  isPressed(key: string): boolean {
    return this.keysPressed.has(key.toLowerCase());
  }

  /**
   * Calculates the axis and direction (1 or -1) to move a piece,
   * based on the key pressed and the current camera orientation.
   */
  getPieceMoveAxis(key: string, camera: THREE.Camera): { axis: 'x' | 'y' | 'z'; delta: number } | null {
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    const forward = new THREE.Vector3();

    camera.matrixWorld.extractBasis(right, up, forward);
    forward.negate();

    let targetScreenVec = new THREE.Vector3();

    switch (key) {
      case 'ArrowUp':
      case 'i':
      case 'I':
        targetScreenVec.copy(up);
        break;
      case 'ArrowDown':
      case 'k':
      case 'K':
        targetScreenVec.copy(up).negate();
        break;
      case 'ArrowLeft':
      case 'j':
      case 'J':
        targetScreenVec.copy(right).negate();
        break;
      case 'ArrowRight':
      case 'l':
      case 'L':
        targetScreenVec.copy(right);
        break;
      case 'u':
      case 'U':
        targetScreenVec.copy(forward);
        break;
      case 'o':
      case 'O':
        targetScreenVec.copy(forward).negate();
        break;
      default:
        return null;
    }

    if (targetScreenVec.length() === 0) return null;

    let bestAxis: 'x' | 'y' | 'z' = 'x';
    let bestDot = 0;
    let delta = 0;

    const axes = [
      {name: 'x', vec: new THREE.Vector3(1, 0, 0)},
      {name: 'y', vec: new THREE.Vector3(0, 1, 0)},
      {name: 'z', vec: new THREE.Vector3(0, 0, 1)},
    ];

    axes.forEach((a) => {
      const dot = targetScreenVec.dot(a.vec);
      if (Math.abs(dot) > Math.abs(bestDot)) {
        bestDot = dot;
        bestAxis = a.name as 'x' | 'y' | 'z';
        delta = dot > 0 ? 1 : -1;
      }
    });

    if (delta !== 0) {
      return { axis: bestAxis, delta };
    }

    return null;
  }
}

export const keyboardInput = new KeyboardInput();
