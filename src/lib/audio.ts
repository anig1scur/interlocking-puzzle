export class AudioManager {
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.init();
  }

  init() {
    if (typeof window !== 'undefined') {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  resume() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  play(type: 'success' | 'fail' | 'win' | 'thud' | 'slide' | 'pop' | 'select') {
    if (!this.audioCtx) return;
    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    const currTime = this.audioCtx.currentTime;

    if (type === 'success' || type === 'pop') {
      // Pop / Snap sound
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, currTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, currTime + 0.1);
      gainNode.gain.setValueAtTime(0.001, currTime);
      gainNode.gain.linearRampToValueAtTime(0.5, currTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currTime + 0.1);
      oscillator.start();
      oscillator.stop(currTime + 0.1);
    } else if (type === 'fail' || type === 'thud') {
      // Dull thud
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(120, currTime);
      oscillator.frequency.exponentialRampToValueAtTime(60, currTime + 0.15);
      gainNode.gain.setValueAtTime(0.001, currTime);
      gainNode.gain.linearRampToValueAtTime(0.8, currTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currTime + 0.15);
      oscillator.start();
      oscillator.stop(currTime + 0.15);
    } else if (type === 'win') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        if (!this.audioCtx) return;
        const o = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        o.connect(g);
        g.connect(this.audioCtx.destination);
        const startTime = currTime + i * 0.1;
        o.frequency.setValueAtTime(freq, startTime);
        g.gain.setValueAtTime(0.001, startTime);
        g.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        o.start(startTime);
        o.stop(startTime + 0.3);
      });
    } else if (type === 'slide') {
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(150, currTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, currTime + 0.04);
      gainNode.gain.setValueAtTime(0.001, currTime);
      gainNode.gain.linearRampToValueAtTime(0.1, currTime + 0.005);
      gainNode.gain.linearRampToValueAtTime(0, currTime + 0.04);
      oscillator.start();
      oscillator.stop(currTime + 0.04);
    } else if (type === 'select') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(660, currTime);
      oscillator.frequency.exponentialRampToValueAtTime(440, currTime + 0.05);
      gainNode.gain.setValueAtTime(0.001, currTime);
      gainNode.gain.linearRampToValueAtTime(0.1, currTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currTime + 0.05);
      oscillator.start();
      oscillator.stop(currTime + 0.05);
    }
  }
}

export const audioManager = new AudioManager();
