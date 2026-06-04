import type { GameState } from "./types";

type MusicTrackId = "heroIntro" | "villainReveal" | "routeTheme";

interface MusicSyncOptions {
  cheatMode: boolean;
}

interface TrackState {
  audio: HTMLAudioElement;
  playing: boolean;
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

const VILLAIN_REVEAL_GAP_SECONDS = 1;
const ROUTE_THEME_DELAY_SECONDS = 1;
const ROUTE_THEME_LOOP_GAP_SECONDS = 2;

export class MusicManager {
  private readonly tracks: Record<MusicTrackId, TrackState>;
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

  constructor() {
    this.tracks = {
      heroIntro: this.createTrack("heroIntro"),
      villainReveal: this.createTrack("villainReveal"),
      routeTheme: this.createTrack("routeTheme"),
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
        this.playRouteTheme(state.runId);
        return;
      }
      if (this.villainEndedAt + ROUTE_THEME_DELAY_SECONDS <= state.time) this.playRouteTheme(state.runId);
    }
  }

  dispose(): void {
    document.removeEventListener("visibilitychange", this.handleVisibility);
    for (const track of Object.values(this.tracks)) {
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

  private resetRun(runId: number): void {
    this.lastRunId = runId;
    this.villainStartedRunId = undefined;
    this.villainScheduledRunId = undefined;
    this.villainStartAt = Number.POSITIVE_INFINITY;
    this.routeStartedRunId = undefined;
    this.villainEndedAt = Number.POSITIVE_INFINITY;
    this.routeEndedAt = Number.POSITIVE_INFINITY;
    this.pauseAllNow();
  }

  private pauseAllNow(): void {
    for (const track of Object.values(this.tracks)) {
      track.audio.volume = 0;
      track.audio.pause();
      track.playing = false;
    }
  }

  private handleVisibility = (): void => {
    if (document.hidden) {
      this.resumeAfterVisible = Object.values(this.tracks).some((track) => track.playing && !track.audio.paused);
      this.pauseAllNow();
      return;
    }
    if (this.enabled && this.resumeAfterVisible && this.lastState) this.sync(this.lastState, this.lastOptions);
    this.resumeAfterVisible = false;
  };

  private playLoop(id: "heroIntro" | "routeTheme"): void {
    const track = this.tracks[id];
    track.audio.loop = id === "heroIntro";
    if (id === "routeTheme") track.audio.currentTime = 0;
    track.audio.volume = TRACKS[id].volume;
    void this.safePlay(id);
  }

  private playRouteTheme(runId: number): void {
    if (this.routeStartedRunId === runId && this.tracks.routeTheme.playing) return;
    if (this.routeStartedRunId === runId && this.routeEndedAt + ROUTE_THEME_LOOP_GAP_SECONDS > (this.lastState?.time ?? 0)) return;
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

  private stopTrack(id: MusicTrackId): void {
    const track = this.tracks[id];
    track.audio.pause();
    track.audio.volume = 0;
    track.playing = false;
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
}
