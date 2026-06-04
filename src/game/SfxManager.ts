import type { GameState } from "./types";
import type { DialogueSpeaker } from "./dialogue";

interface SfxSyncOptions {
  cheatMode: boolean;
}

type OscillatorType = "sine" | "square" | "sawtooth" | "triangle";
type FileSfxKey = "reveal" | "escape" | "crash" | "pickup";

const FILE_SFX_PATHS: Record<FileSfxKey, string> = {
  reveal: "/assets/audio/sfx/restless-spirit-hazard-soft-boom.wav",
  escape: "/assets/audio/sfx/restless-spirit-hit.wav",
  crash: "/assets/audio/sfx/restless-spirit-hazard-low-thump.wav",
  pickup: "/assets/audio/sfx/eyecat-coin.wav",
};

const FILE_SFX_VOLUME: Record<FileSfxKey, number> = {
  reveal: 0.36,
  escape: 0.36,
  crash: 0.36,
  pickup: 0.32,
};
const PICKUP_MIN_INTERVAL_SECONDS = 0.11;

export class SfxManager {
  private context: AudioContext | undefined;
  private filePlayers = new Map<FileSfxKey, HTMLAudioElement>();
  private unlocked = false;
  private lastRunId = -1;
  private lastSummonStartedAt: number | undefined;
  private lastEscapeStartedAt: number | undefined;
  private lastCrashEvent: string | undefined;
  private lastCrashSoundAt = -Infinity;
  private lastHandoffDone = false;
  private lastPickupSoundAt = -Infinity;
  private lastOpeningTutorialSoundAt = -Infinity;
  private lastDialogueBlipAt = -Infinity;
  private enabled = true;

  unlock(): void {
    if (!this.context) {
      const AudioContextCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;
      this.context = new AudioContextCtor();
    }
    this.unlocked = true;
    if (this.context.state === "suspended") void this.context.resume();
    this.primeFileSfx();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  sync(previous: GameState, next: GameState, options: SfxSyncOptions): void {
    if (!this.enabled || !this.unlocked || !this.context) return;
    if (next.runId !== this.lastRunId) {
      this.lastRunId = next.runId;
      this.lastSummonStartedAt = undefined;
      this.lastEscapeStartedAt = undefined;
      this.lastCrashEvent = undefined;
      this.lastCrashSoundAt = -Infinity;
      this.lastHandoffDone = next.stage.introCameraHandoffDone;
      this.lastPickupSoundAt = -Infinity;
      this.lastOpeningTutorialSoundAt = -Infinity;
    }
    if (options.cheatMode) return;

    if (
      shouldPlayDesktopPickupSfx()
      && next.collectedPancakes.size > previous.collectedPancakes.size
      && next.time - this.lastPickupSoundAt >= PICKUP_MIN_INTERVAL_SECONDS
    ) {
      this.lastPickupSoundAt = next.time;
      this.playPickup();
    }

    if (next.stage.summonStartedAt !== undefined && next.stage.summonStartedAt !== this.lastSummonStartedAt) {
      this.lastSummonStartedAt = next.stage.summonStartedAt;
      this.playRevealSnap();
    }

    if (next.stage.targetEscape?.startedAt !== undefined && next.stage.targetEscape.startedAt !== this.lastEscapeStartedAt) {
      this.lastEscapeStartedAt = next.stage.targetEscape.startedAt;
      this.playEscapePop();
    }

    const nextRecoveredEvent = next.stage.lastEvent?.startsWith("Recovered from") ? next.stage.lastEvent : undefined;
    const previousRecoveredEvent = previous.stage.lastEvent?.startsWith("Recovered from") ? previous.stage.lastEvent : undefined;
    const crashEvent = nextRecoveredEvent && nextRecoveredEvent !== previousRecoveredEvent
      ? `${next.runId}:${nextRecoveredEvent}:${Math.round(next.player.x)}:${Math.round(next.player.z)}`
      : undefined;
    if (crashEvent && crashEvent !== this.lastCrashEvent && next.time - this.lastCrashSoundAt >= 0.28) {
      this.lastCrashEvent = crashEvent;
      this.lastCrashSoundAt = next.time;
      this.playCrashThump();
    }

    if (!previous.stage.introCameraHandoffDone && next.stage.introCameraHandoffDone && !this.lastHandoffDone) {
      this.lastHandoffDone = true;
      this.playRouteCue();
    } else {
      this.lastHandoffDone = next.stage.introCameraHandoffDone;
    }
  }

  dispose(): void {
    void this.context?.close();
    for (const player of this.filePlayers.values()) {
      player.pause();
      player.src = "";
    }
    this.filePlayers.clear();
    this.context = undefined;
  }

  playDialogueBlip(speaker: DialogueSpeaker, gameTime: number): boolean {
    if (!this.enabled || !this.unlocked || !this.context) return false;
    if (gameTime - this.lastDialogueBlipAt < 0.14) return false;
    this.lastDialogueBlipAt = gameTime;
    if (speaker === "A") {
      this.tone(520, 0.07, "triangle", 0.038, 0);
      this.tone(710, 0.06, "sine", 0.026, 0.045);
      return true;
    }
    this.tone(245, 0.08, "triangle", 0.04, 0);
    this.tone(170, 0.07, "sine", 0.028, 0.05);
    return true;
  }

  playOpeningTutorialTouch(gameTime: number): void {
    if (!this.enabled || !this.unlocked || !this.context) return;
    if (gameTime - this.lastOpeningTutorialSoundAt < 0.7) return;
    this.lastOpeningTutorialSoundAt = gameTime;
    if (this.playFileSfx("pickup")) return;
    this.playPickupTone();
  }

  private playRevealSnap(): void {
    if (this.playFileSfx("reveal")) return;
    this.playRevealSnapTone();
  }

  private playEscapePop(): void {
    if (this.playFileSfx("escape")) return;
    this.playEscapePopTone();
  }

  private playCrashThump(): void {
    if (this.playFileSfx("crash")) return;
    this.playCrashThumpTone();
  }

  private playPickup(): void {
    if (this.playFileSfx("pickup")) return;
    this.playPickupTone();
  }

  private playRevealSnapTone(): void {
    this.tone(142, 0.08, "triangle", 0.045, 0);
    this.tone(265, 0.14, "sine", 0.052, 0.055);
    this.noise(0.08, 0.032, 0.025, "bandpass");
  }

  private playEscapePopTone(): void {
    this.tone(218, 0.08, "triangle", 0.04, 0);
    this.tone(330, 0.1, "sine", 0.038, 0.055);
    this.noise(0.07, 0.026, 0.02, "bandpass");
  }

  private playCrashThumpTone(): void {
    this.tone(74, 0.13, "triangle", 0.07, 0);
    this.tone(46, 0.18, "sine", 0.06, 0.04);
    this.noise(0.11, 0.048, 0, "lowpass");
  }

  private playRouteCue(): void {
    this.tone(330, 0.08, "triangle", 0.06, 0);
    this.tone(440, 0.08, "triangle", 0.06, 0.08);
    this.tone(660, 0.12, "triangle", 0.07, 0.16);
  }

  private playPickupTone(): void {
    this.tone(430, 0.055, "triangle", 0.034, 0);
    this.tone(640, 0.06, "sine", 0.026, 0.045);
  }

  private tone(frequency: number, duration: number, type: OscillatorType, volume: number, delay: number): void {
    if (!this.context) return;
    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  private noise(duration: number, volume: number, delay: number, filterType: BiquadFilterType): void {
    if (!this.context) return;
    const start = this.context.currentTime + delay;
    const sampleRate = this.context.sampleRate;
    const buffer = this.context.createBuffer(1, Math.max(1, Math.floor(sampleRate * duration)), sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    filter.type = filterType;
    filter.frequency.value = filterType === "lowpass" ? 420 : 1400;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);
    source.start(start);
  }

  private primeFileSfx(): void {
    for (const key of Object.keys(FILE_SFX_PATHS) as FileSfxKey[]) {
      if (key === "pickup" && !shouldPlayDesktopPickupSfx()) continue;
      const player = this.getFilePlayer(key);
      if (!player) continue;
      player.muted = true;
      player.volume = 0;
      const playback = player.play();
      if (playback?.then) {
        playback
          .then(() => {
            player.pause();
            player.currentTime = 0;
          })
          .catch(() => undefined)
          .finally(() => {
            player.muted = false;
            player.volume = FILE_SFX_VOLUME[key];
          });
      } else {
        player.muted = false;
        player.volume = FILE_SFX_VOLUME[key];
      }
    }
  }

  private playFileSfx(key: FileSfxKey): boolean {
    const player = this.getFilePlayer(key);
    if (!player) return false;
    player.pause();
    player.currentTime = 0;
    player.muted = false;
    player.volume = FILE_SFX_VOLUME[key];
    const playback = player.play();
    if (playback?.catch) playback.catch(() => this.playFallbackForFileSfx(key));
    return true;
  }

  private getFilePlayer(key: FileSfxKey): HTMLAudioElement | undefined {
    if (typeof Audio === "undefined") return undefined;
    const existing = this.filePlayers.get(key);
    if (existing) return existing;
    const player = new Audio(FILE_SFX_PATHS[key]);
    player.preload = "auto";
    (player as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
    player.volume = FILE_SFX_VOLUME[key];
    player.load();
    this.filePlayers.set(key, player);
    return player;
  }

  private playFallbackForFileSfx(key: FileSfxKey): void {
    if (key === "reveal") this.playRevealSnapTone();
    else if (key === "escape") this.playEscapePopTone();
    else if (key === "crash") this.playCrashThumpTone();
    else if (key === "pickup") this.playPickupTone();
  }
}

function shouldPlayDesktopPickupSfx(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const noHover = window.matchMedia("(hover: none)").matches;
  return !coarsePointer && !noHover;
}
