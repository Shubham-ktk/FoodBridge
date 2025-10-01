export type KeyboardInput = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
};

export function createKeyboardInput(): KeyboardInput {
  const state: KeyboardInput = {
    forward: false,
    backward: false,
    left: false,
    right: false
  };

  const set = (code: string, pressed: boolean) => {
    switch (code) {
      case 'KeyW':
      case 'ArrowUp':
        state.forward = pressed; break;
      case 'KeyS':
      case 'ArrowDown':
        state.backward = pressed; break;
      case 'KeyA':
      case 'ArrowLeft':
        state.left = pressed; break;
      case 'KeyD':
      case 'ArrowRight':
        state.right = pressed; break;
      default:
        break;
    }
  };

  window.addEventListener('keydown', (e) => set(e.code, true));
  window.addEventListener('keyup', (e) => set(e.code, false));
  return state;
}

