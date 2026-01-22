export interface GamepadState {
  cameraDelta: { x: number; y: number };
  moveVector: { x: number; y: number };
  actions: {
    nextPiece: boolean;
    prevPiece: boolean;
    ghostMode: boolean;
    nextLevel: boolean;
    prevLevel: boolean;
    toggleLeaderboard: boolean;
  };
}

export class GamepadInput {
  // Deadzone for sticks
  private readonly DEADZONE = 0.15;
  // State for button presses to avoid auto-repeat (trigger once)
  private lastButtons: boolean[] = [];
  
  constructor() {}

  public poll(): GamepadState {
    const state: GamepadState = {
      cameraDelta: { x: 0, y: 0 },
      moveVector: { x: 0, y: 0 },
      actions: {
        nextPiece: false,
        prevPiece: false,
        ghostMode: false,
        nextLevel: false,
        prevLevel: false,
        toggleLeaderboard: false,
      },
    };

    if (typeof navigator === 'undefined' || !navigator.getGamepads) return state;

    const gamepads = navigator.getGamepads();
    if (!gamepads) return state;

    // Standard buttons range check (up to 20 buttons should cover standard pads)
    const currentButtonsDisplay = new Array(20).fill(false);

    // Iterate all gamepads to merge inputs
    for (const gp of gamepads) {
      if (!gp) continue;

      // --- Axes ---
      // Left Stick (Now Camera) - Axes 0,1
      if (Math.abs(gp.axes[0]) > this.DEADZONE) state.cameraDelta.x += gp.axes[0];
      // User requested "cameraDelta up/down direction swap", so we invert the Y axis (Up is -, we want + or vice versa depending on definition, but swapping means negating)
      if (Math.abs(gp.axes[1]) > this.DEADZONE) state.cameraDelta.y += -gp.axes[1];

      // Right Stick (Now Movement) - Axes 2,3
      if (gp.axes.length >= 4) {
        if (Math.abs(gp.axes[2]) > this.DEADZONE) state.moveVector.x += gp.axes[2];
        if (Math.abs(gp.axes[3]) > this.DEADZONE) state.moveVector.y += -gp.axes[3];
      }

      // --- Buttons (Aggregate) ---
      for (let i = 0; i < Math.min(gp.buttons.length, currentButtonsDisplay.length); i++) {
        if (gp.buttons[i].pressed) {
            currentButtonsDisplay[i] = true;
        }
      }
    }
    
    // D-Pad override (Buttons 12-15)
    if (currentButtonsDisplay[12]) state.moveVector.y = 1;  // Up
    if (currentButtonsDisplay[13]) state.moveVector.y = -1; // Down
    if (currentButtonsDisplay[14]) state.moveVector.x = -1; // Left
    if (currentButtonsDisplay[15]) state.moveVector.x = 1;  // Right

    // Helper for Edge Detection
    const justPressed = (idx: number) => currentButtonsDisplay[idx] && !this.lastButtons[idx];
    const isPressed = (idx: number) => currentButtonsDisplay[idx];

    // Actions
    // L1 (4) / R1 (5)
    if (justPressed(4)) state.actions.prevPiece = true;
    if (justPressed(5)) state.actions.nextPiece = true;

    // Ghost (Trigger 6, 7)
    if (isPressed(6) || isPressed(7)) state.actions.ghostMode = true;

    // Next Level (Right Button 'A' - usually 1)
    if (justPressed(1)) state.actions.nextLevel = true;

    // Previous Level (Left/Top Button 'X'/'Y' - usually 2 or 3)
    // Mapping Button 2 (West) and 3 (North) to Previous just in case, but user asked for X.
    // West is usually Button 2.
    if (justPressed(2) || justPressed(3)) state.actions.prevLevel = true;

    // Leaderboard ('+' - usually 9 on Switch/Joy-Con)
    if (justPressed(9)) state.actions.toggleLeaderboard = true;

    // Select (0 - South) - Keeping just 0 for generic select if needed
    // if (justPressed(0)) state.actions.select = true;

    // Update state
    this.lastButtons = currentButtonsDisplay;

    return state;
  }

  private isBtnPressed(gp: Gamepad, index: number): boolean {
    if (!gp.buttons[index]) return false;
    return gp.buttons[index].pressed;
  }

  private wasBtnPressed(index: number): boolean {
    return !!this.lastButtons[index];
  }

  private saveButtonState(gp: Gamepad) {
    // Resize if needed
    if (this.lastButtons.length !== gp.buttons.length) {
        this.lastButtons = new Array(gp.buttons.length).fill(false);
    }
    for (let i = 0; i < gp.buttons.length; i++) {
        this.lastButtons[i] = gp.buttons[i].pressed;
    }
  }
}

export const gamepadInput = new GamepadInput();
