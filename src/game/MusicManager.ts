import type { GameState } from "./types";

type MusicTrackId = "heroIntro" | "villainReveal" | "routeTheme";
type BackgroundAudioAssetId = "traffic" | "train" | "river";

interface MusicSyncOptions {
  cheatMode: boolean;
}

interface TrackState {
  audio: HTMLAudioElement;
  playing: boolean;
  fadeFrame?: number;
}

interface BackgroundAudioZone {
  startZ: number;
  endZ: number;
  sequence: readonly BackgroundAudioAssetId[];
}

const TRACKS: Record<MusicTrackId, { src: string; loop: boolean; volume: number }> = {
  heroIntro: {
    src: "/assets/audio/mr-awesome-theme.m4a",
    loop: true,
    volume: 0.58,
  },
  villainReveal: {
    src: "/assets/audio/mr-not-so-awesome-theme.m4a",
    loop: false,
    volume: 0.72,
  },
  routeTheme: {
    src: "/assets/audio/the-awesome-theme-song.m4a",
    loop: false,
    volume: 0.62,
  },
};

const BACKGROUND_AUDIO_ASSETS: Record<BackgroundAudioAssetId, { src: string; fileName: string }> = {
  traffic: {
    src: "/assets/audio/ambience/Traffic%20SFX.m4a",
    fileName: "Traffic SFX.m4a",
  },
  train: {
    src: "/assets/audio/ambience/Traffic%20Train%20SFX.m4a",
    fileName: "Traffic Train SFX.m4a",
  },
  river: {
    src: "/assets/audio/ambience/Traffic%20River%20SFX.m4a",
    fileName: "Traffic River SFX.m4a",
  },
};

const BACKGROUND_AUDIO_ZONES: readonly BackgroundAudioZone[] = [
  { startZ: 0, endZ: 68, sequence: ["traffic", "train", "river"] },
  { startZ: 69, endZ: 123, sequence: ["train", "traffic", "river"] },
  { startZ: 124, endZ: 270, sequence: ["train", "river", "train", "traffic"] },
  { startZ: 271, endZ: 352, sequence: ["river", "traffic", "river"] },
  { startZ: 353, endZ: 397, sequence: ["train", "traffic", "train"] },
  { startZ: 398, endZ: 430, sequence: ["river", "traffic", "river"] },
  { startZ: 431, endZ: 462, sequence: ["train", "traffic", "train", "river"] },
];

const VILLAIN_REVEAL_GAP_SECONDS = 1;
const ROUTE_THEME_DELAY_SECONDS = 1;
const ROUTE_THEME_LOOP_GAP_SECONDS = 0;
const AMBIENCE_VOLUME_RATIO = 0.2;
const AMBIENCE_VOLUME = TRACKS.routeTheme.volume * AMBIENCE_VOLUME_RATIO;
const AMBIENCE_FADE_IN_SECONDS = 3;
const AMBIENCE_FADE_OUT_SECONDS = 1.25;
const BACKGROUND_AUDIO_TRANSITION_GRACE_ROWS = 12;

export function getBackgroundAudioZone(z: number): BackgroundAudioZone | undefined {
  const index = getBackgroundAudioZoneIndex(z);
  return index === undefined ? undefined : BACKGROUND_AUDIO_ZONES[index];
}

export function getBackgroundAudioZoneWithGrace(
  z: number,
  activeZoneIndex: number | undefined,
): { zone: BackgroundAudioZone; index: number } | undefined {
  const candidateIndex = getBackgroundAudioZoneIndex(z);
  if (candidateIndex === undefined) return undefined;
  const candidate = BACKGROUND_AUDIO_ZONES[candidateIndex];
  if (!candidate) return undefined;
  if (activeZoneIndex === undefined) return { zone: candidate, index: candidateIndex };
  const active = BACKGROUND_AUDIO_ZONES[activeZoneIndex];
  const roundedZ = Math.round(z);
  if (!active || activeZoneIndex === candidateIndex) return { zone: candidate, index: candidateIndex };
  if (candidateIndex > activeZoneIndex && roundedZ < candidate.startZ + BACKGROUND_AUDIO_TRANSITION_GRACE_ROWS) {
    return { zone: active, index: activeZoneIndex };
  }
  if (candidateIndex < activeZoneIndex && roundedZ > candidate.endZ - BACKGROUND_AUDIO_TRANSITION_GRACE_ROWS) {
    return { zone: active, index: activeZoneIndex };
  }
  return { zone: candidate, index: candidateIndex };
}

function getBackgroundAudioZoneIndex(z: number): number | undefined {
  const roundedZ = Math.round(z);
  const index = BACKGROUND_AUDIO_ZONES.findIndex((zone) => roundedZ >= zone.startZ && roundedZ <= zone.endZ);
  return index === -1 ? undefined : index;
}

export class MusicManager {
  private readonly tracks: Record<MusicTrackId, TrackState>;
  private readonly ambienceTracks: Record<BackgroundAudioAssetId, TrackState>;
  private unlocked = false;
  private resumeAfterVisible = false;
  private lastRunId = -1;
  private villainStartedRunId: number | undefined;
  private villainScheduledRunId: number | undefined;
  private villainStartAt = Number.POSITIVE_INFINITY;
  private villainEndedAt = Number.POSITIVE_INFINITY;
  private routeStartedRunId: number | undefined;
  private routeEndedAt = Number.POSITIVE_INFINITY;
  private lastState: GameState | undefined;
  private lastOptions: MusicSyncOptions = { cheatMode: false };
  private enabled = true;
  private activeAmbienceAsset: BackgroundAudioAssetId | undefined;
  private activeAmbienceZoneIndex: number | undefined;
  private activeAmbienceSequenceIndex: number | undefined;

  constructor() {
    this.tracks = {
      heroIntro: this.createTrack("heroIntro"),
      villainReveal: this.createTrack("villainReveal"),
      routeTheme: this.createTrack("routeTheme"),
    };
    this.ambienceTracks = {
      traffic: this.createAmbienceTrack("traffic"),
      train: this.createAmbienceTrack("train"),
      river: this.createAmbienceTrack("river"),
    };
    document.addEventListener("visibilitychange", this.handleVisibility);
  }

  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    if (this.lastState) this.sync(this.lastState, this.lastOptions);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.pauseAllNow();
      return;
    }
    if (this.lastState) this.sync(this.lastState, this.lastOptions);
  }

  sync(state: GameState, options: MusicSyncOptions): void {
    this.lastState = state;
    this.lastOptions = options;
    if (!this.unlocked || !this.enabled) return;

    if (state.runId !== this.lastRunId) this.resetRun(state.runId);
    if (state.phase === "paused") {
      this.pauseAllNow();
      return;
    }

    if (state.stage.mode === "introPancakes") {
      this.routeStartedRunId = undefined;
      this.villainStartedRunId = undefined;
      this.villainScheduledRunId = undefined;
      this.villainStartAt = Number.POSITIVE_INFINITY;
      this.villainEndedAt = Number.POSITIVE_INFINITY;
      this.routeEndedAt = Number.POSITIVE_INFINITY;
      this.stopTrack("villainReveal");
      this.stopTrack("routeTheme");
      this.stopAmbience();
      if (state.phase === "running") this.playLoop("heroIntro");
      return;
    }

    if (state.stage.mode === "summoning") {
      if (this.villainScheduledRunId !== state.runId) {
        this.villainScheduledRunId = state.runId;
        this.routeStartedRunId = undefined;
        this.routeEndedAt = Number.POSITIVE_INFINITY;
        this.villainEndedAt = Number.POSITIVE_INFINITY;
        this.villainStartAt = state.time + VILLAIN_REVEAL_GAP_SECONDS;
        this.stopTrack("heroIntro");
        this.stopTrack("routeTheme");
        this.stopAmbience();
      }
      if (state.time >= this.villainStartAt) this.playVillainReveal(state.runId);
      return;
    }

    if (state.stage.mode === "chase") {
      this.stopTrack("heroIntro");
      if (options.cheatMode || this.villainStartedRunId !== state.runId) {
        if (!options.cheatMode && this.villainScheduledRunId === state.runId) {
          if (state.time >= this.villainStartAt) this.playVillainReveal(state.runId);
          return;
        }
        this.stopTrack("villainReveal");
        this.syncAmbience(state);
        this.playRouteTheme(state.runId);
        return;
      }
      if (this.villainEndedAt <= state.time) this.syncAmbience(state);
      if (this.villainEndedAt + ROUTE_THEME_DELAY_SECONDS <= state.time) {
        this.playRouteTheme(state.runId);
      }
    }
  }

  dispose(): void {
    document.removeEventListener("visibilitychange", this.handleVisibility);
    for (const track of Object.values(this.tracks)) {
      this.cancelTrackFade(track);
      track.audio.pause();
      track.audio.src = "";
    }
    for (const track of Object.values(this.ambienceTracks)) {
      this.cancelTrackFade(track);
      track.audio.pause();
      track.audio.src = "";
    }
  }

  private createTrack(id: MusicTrackId): TrackState {
    const audio = new Audio(TRACKS[id].src);
    audio.loop = TRACKS[id].loop;
    audio.preload = "auto";
    audio.volume = 0;
    (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
    audio.load();
    audio.addEventListener("ended", () => {
      if (id === "villainReveal") this.villainEndedAt = this.lastState?.time ?? 0;
      if (id === "routeTheme") this.routeEndedAt = this.lastState?.time ?? 0;
      this.tracks[id].playing = false;
    });
    return { audio, playing: false };
  }

  private createAmbienceTrack(id: BackgroundAudioAssetId): TrackState {
    const audio = new Audio(BACKGROUND_AUDIO_ASSETS[id].src);
    audio.loop = false;
    audio.preload = "auto";
    audio.volume = 0;
    (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
    audio.load();
    audio.addEventListener("ended", () => {
      this.ambienceTracks[id].playing = false;
      this.advanceAmbienceSequence(id);
    });
    return { audio, playing: false };
  }

  private resetRun(runId: number): void {
    this.lastRunId = runId;
    this.villainStartedRunId = undefined;
    this.villainScheduledRunId = undefined;
    this.villainStartAt = Number.POSITIVE_INFINITY;
    this.routeStartedRunId = undefined;
    this.villainEndedAt = Number.POSITIVE_INFINITY;
    this.routeEndedAt = Number.POSITIVE_INFINITY;
    this.pauseAllNow();
    this.activeAmbienceAsset = undefined;
    this.activeAmbienceZoneIndex = undefined;
    this.activeAmbienceSequenceIndex = undefined;
  }

  private pauseAllNow(): void {
    for (const track of Object.values(this.tracks)) {
      track.audio.volume = 0;
      track.audio.pause();
      track.playing = false;
    }
    this.pauseAmbienceNow();
  }

  private pauseAmbienceNow(): void {
    for (const track of Object.values(this.ambienceTracks)) {
      this.cancelTrackFade(track);
      track.audio.volume = 0;
      track.audio.pause();
      track.playing = false;
    }
  }

  private stopAmbience(): void {
    this.pauseAmbienceNow();
    this.activeAmbienceAsset = undefined;
    this.activeAmbienceZoneIndex = undefined;
    this.activeAmbienceSequenceIndex = undefined;
  }

  private handleVisibility = (): void => {
    if (document.hidden) {
      this.resumeAfterVisible = this.isAnyAudioPlaying();
      this.pauseAllNow();
      return;
    }
    if (this.enabled && this.resumeAfterVisible && this.lastState) this.sync(this.lastState, this.lastOptions);
    this.resumeAfterVisible = false;
  };

  private isAnyAudioPlaying(): boolean {
    return Object.values(this.tracks).some((track) => track.playing && !track.audio.paused)
      || Object.values(this.ambienceTracks).some((track) => track.playing && !track.audio.paused);
  }

  private playLoop(id: "heroIntro" | "routeTheme"): void {
    const track = this.tracks[id];
    track.audio.loop = id === "heroIntro";
    if (id === "routeTheme") track.audio.currentTime = 0;
    track.audio.volume = TRACKS[id].volume;
    void this.safePlay(id);
  }

  private playRouteTheme(runId: number): void {
    if (this.routeStartedRunId === runId && this.tracks.routeTheme.playing) return;
    const isPausedMidTrack = this.routeStartedRunId === runId
      && this.routeEndedAt === Number.POSITIVE_INFINITY
      && !this.tracks.routeTheme.playing;
    if (!isPausedMidTrack && this.routeStartedRunId === runId && this.routeEndedAt + ROUTE_THEME_LOOP_GAP_SECONDS > (this.lastState?.time ?? 0)) return;
    this.routeStartedRunId = runId;
    this.routeEndedAt = Number.POSITIVE_INFINITY;
    this.playLoop("routeTheme");
  }

  private playVillainReveal(runId: number): void {
    if (this.villainStartedRunId === runId) return;
    this.villainStartedRunId = runId;
    this.playOnce("villainReveal");
  }

  private playOnce(id: "villainReveal"): void {
    const track = this.tracks[id];
    track.audio.loop = false;
    track.audio.currentTime = 0;
    track.audio.volume = TRACKS[id].volume;
    this.villainEndedAt = Number.POSITIVE_INFINITY;
    void this.safePlay(id);
  }

  private syncAmbience(state: GameState): void {
    const resolved = getBackgroundAudioZoneWithGrace(state.player.z, this.activeAmbienceZoneIndex);
    if (!resolved) {
      this.stopAmbience();
      return;
    }
    if (this.activeAmbienceZoneIndex !== resolved.index) {
      this.playAmbienceSequenceItem(resolved.index, 0, state.player.z);
      return;
    }
    if (this.activeAmbienceAsset === undefined || this.activeAmbienceSequenceIndex === undefined) {
      this.playAmbienceSequenceItem(resolved.index, 0, state.player.z);
      return;
    }

    const track = this.ambienceTracks[this.activeAmbienceAsset];
    if (!track.playing || track.audio.paused) {
      track.audio.volume = 0;
      void this.safePlayAmbience(this.activeAmbienceAsset);
      this.fadeAmbienceTrack(this.activeAmbienceAsset, AMBIENCE_VOLUME, AMBIENCE_FADE_IN_SECONDS);
      return;
    }
    this.setAmbienceTargetVolume(this.activeAmbienceAsset);
  }

  private playAmbienceSequenceItem(zoneIndex: number, sequenceIndex: number, z: number): void {
    const zone = BACKGROUND_AUDIO_ZONES[zoneIndex];
    if (!zone || zone.sequence.length === 0) {
      this.stopAmbience();
      return;
    }
    const nextSequenceIndex = positiveModulo(sequenceIndex, zone.sequence.length);
    const id = zone.sequence[nextSequenceIndex];
    const track = this.ambienceTracks[id];
    if (
      this.activeAmbienceAsset === id
      && this.activeAmbienceZoneIndex === zoneIndex
      && this.activeAmbienceSequenceIndex === nextSequenceIndex
    ) {
      if (!track.playing || track.audio.paused) {
        track.audio.volume = 0;
        void this.safePlayAmbience(id);
        this.fadeAmbienceTrack(id, AMBIENCE_VOLUME, AMBIENCE_FADE_IN_SECONDS);
      } else {
        this.setAmbienceTargetVolume(id);
      }
      return;
    }

    const previousId = this.activeAmbienceAsset;
    this.activeAmbienceAsset = id;
    this.activeAmbienceZoneIndex = zoneIndex;
    this.activeAmbienceSequenceIndex = nextSequenceIndex;
    this.pauseInactiveAmbienceTracks([id, previousId]);

    if (previousId === id && track.playing && !track.audio.paused && !track.audio.ended) {
      this.setAmbienceTargetVolume(id);
      return;
    }

    track.audio.currentTime = 0;
    track.audio.volume = 0;
    console.log(`Ambience changed to ${id}: ${BACKGROUND_AUDIO_ASSETS[id].fileName} at z=${Math.round(z)}`);
    void this.safePlayAmbience(id);
    this.fadeAmbienceTrack(id, AMBIENCE_VOLUME, AMBIENCE_FADE_IN_SECONDS);

    if (previousId && previousId !== id) {
      const previousTrack = this.ambienceTracks[previousId];
      if (previousTrack.playing && !previousTrack.audio.paused && !previousTrack.audio.ended) {
        this.fadeAmbienceTrack(previousId, 0, AMBIENCE_FADE_OUT_SECONDS, () => {
          previousTrack.audio.pause();
          previousTrack.audio.currentTime = 0;
          previousTrack.playing = false;
        });
      } else {
        this.stopAmbienceTrackNow(previousId);
      }
    }
  }

  private advanceAmbienceSequence(endedId: BackgroundAudioAssetId): void {
    if (endedId !== this.activeAmbienceAsset || this.activeAmbienceZoneIndex === undefined) return;
    if (!this.enabled || !this.unlocked || !this.lastState || this.lastState.stage.mode !== "chase") return;
    const currentIndex = this.activeAmbienceSequenceIndex ?? 0;
    this.playAmbienceSequenceItem(this.activeAmbienceZoneIndex, currentIndex + 1, this.lastState.player.z);
  }

  private stopTrack(id: MusicTrackId): void {
    const track = this.tracks[id];
    this.cancelTrackFade(track);
    track.audio.pause();
    track.audio.volume = 0;
    track.playing = false;
  }

  private pauseInactiveAmbienceTracks(keepIds: Array<BackgroundAudioAssetId | undefined>): void {
    for (const id of Object.keys(this.ambienceTracks) as BackgroundAudioAssetId[]) {
      if (keepIds.includes(id)) continue;
      this.stopAmbienceTrackNow(id);
    }
  }

  private stopAmbienceTrackNow(id: BackgroundAudioAssetId): void {
    const track = this.ambienceTracks[id];
    this.cancelTrackFade(track);
    track.audio.volume = 0;
    track.audio.pause();
    track.audio.currentTime = 0;
    track.playing = false;
  }

  private setAmbienceTargetVolume(id: BackgroundAudioAssetId): void {
    const track = this.ambienceTracks[id];
    if (track.fadeFrame === undefined) track.audio.volume = AMBIENCE_VOLUME;
  }

  private fadeAmbienceTrack(
    id: BackgroundAudioAssetId,
    targetVolume: number,
    durationSeconds: number,
    onComplete?: () => void,
  ): void {
    const track = this.ambienceTracks[id];
    this.cancelTrackFade(track);
    const startVolume = track.audio.volume;
    if (durationSeconds <= 0 || Math.abs(startVolume - targetVolume) < 0.001) {
      track.audio.volume = targetVolume;
      onComplete?.();
      return;
    }

    const startTime = performance.now();
    const durationMs = durationSeconds * 1000;
    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / durationMs);
      const eased = progress * progress * (3 - 2 * progress);
      track.audio.volume = startVolume + (targetVolume - startVolume) * eased;
      if (progress < 1) {
        track.fadeFrame = window.requestAnimationFrame(step);
        return;
      }
      track.fadeFrame = undefined;
      track.audio.volume = targetVolume;
      onComplete?.();
    };
    track.fadeFrame = window.requestAnimationFrame(step);
  }

  private cancelTrackFade(track: TrackState): void {
    if (track.fadeFrame === undefined) return;
    window.cancelAnimationFrame(track.fadeFrame);
    track.fadeFrame = undefined;
  }

  private async safePlay(id: MusicTrackId): Promise<void> {
    const track = this.tracks[id];
    try {
      await track.audio.play();
      track.playing = true;
    } catch {
      track.playing = false;
      if (id === "villainReveal") this.villainEndedAt = this.lastState?.time ?? 0;
    }
  }

  private async safePlayAmbience(id: BackgroundAudioAssetId): Promise<void> {
    const track = this.ambienceTracks[id];
    try {
      await track.audio.play();
      track.playing = true;
    } catch {
      track.playing = false;
    }
  }
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
