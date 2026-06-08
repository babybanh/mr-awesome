import "./styles.css";
import { advanceTargetToNextSpawn, applyAction, applyStage, createInitialState, enterCheatMode, isRevealConversationActive, jumpCheatToEnding, phaseLabel, tickGame } from "./game/simulation";
import { baselineStageMap, copyStageObject, cycleStageObjectAsset, exportStageFeedback, moveStageObject, objectAt, parseStageMap, serializeStageLane, validateStageMap } from "./game/stageMap";
import type { GameAction, GameState, GridPoint, MoveAction, MoveStageObjectResult, StageDefinition, StagePlacedObject } from "./game/types";
import { DialogueDirector, type DialoguePanel } from "./game/dialogue";
import { MusicManager } from "./game/MusicManager";
import { SfxManager } from "./game/SfxManager";
import { CAMERA_PRESET_OPTIONS, DEFAULT_CAMERA_PRESET, DEFAULT_CAMERA_ZOOM_PERCENT, ThreeStageRenderer, type CameraPresetId, type RenderEditSelection } from "./render/ThreeStageRenderer";
import { VillainAvatarRenderer, type AvatarModelDefinition } from "./render/VillainAvatarRenderer";

function syncViewportMetrics(): void {
  const viewport = window.visualViewport;
  const width = Math.max(260, Math.round(viewport?.width ?? window.innerWidth));
  const height = Math.max(300, Math.round(viewport?.height ?? window.innerHeight));
  const root = document.documentElement;
  const composition = document.getElementById("game-composition");
  const gameBoard = document.getElementById("game-board");
  const boardWidth = gameBoard?.getBoundingClientRect().width || composition?.getBoundingClientRect().width || Math.min(width, height);
  const creditsAvailableWidth = Math.max(1, Math.min(boardWidth - 28, width - 28));
  const creditsAvailableHeight = Math.max(1, height * 0.88);
  const creditsScale = Math.min(1, creditsAvailableWidth / 540, creditsAvailableHeight / 360);
  root.style.setProperty("--credits-scale", `${Math.max(0.1, creditsScale).toFixed(3)}`);
}

function scheduleViewportSync(): void {
  syncViewportMetrics();
  window.requestAnimationFrame(syncViewportMetrics);
  window.setTimeout(syncViewportMetrics, 120);
  window.setTimeout(syncViewportMetrics, 420);
  window.setTimeout(syncViewportMetrics, 900);
}

scheduleViewportSync();
window.addEventListener("resize", scheduleViewportSync, { passive: true });
window.addEventListener("orientationchange", scheduleViewportSync, { passive: true });
window.addEventListener("pageshow", scheduleViewportSync);
window.addEventListener("load", scheduleViewportSync, { once: true });
window.visualViewport?.addEventListener("resize", scheduleViewportSync, { passive: true });
window.visualViewport?.addEventListener("scroll", scheduleViewportSync, { passive: true });

document.body.classList.add("app-ready");

const STAGE_MAP_STORAGE_KEY = "awesome-superhero.stage1-map.v8";
const CONTROL_STYLE_STORAGE_KEY = "awesome-superhero.control-style.v4";
const BACKGROUND_THEME_STORAGE_KEY = "awesome-superhero.background-theme.v2";
const BORDER_STYLE_STORAGE_KEY = "awesome-superhero.border-style.v2";
const DIALOGUE_PANEL_STORAGE_KEY = "awesome-superhero.dialogue-panel.v2";
const AVATAR_CHARACTER_STORAGE_KEY = "awesome-superhero.avatar-character.v2";
const AVATAR_FRAMING_STORAGE_KEY = "awesome-superhero.avatar-framing.v1";
const AVATAR_BACKGROUND_STORAGE_KEY = "awesome-superhero.avatar-background.v2";
const MUSIC_ENABLED_STORAGE_KEY = "awesome-superhero.music-enabled.v1";
const BUILD_ID = "2026-06-02-stage1-first-pass";
const EDITOR_ENABLED = isLocalEditorUrl();
const CREDITS_CONFIG = {
  studentName: "Adam",
  studentVideoUrl: "https://youtu.be/IJtiQkQ0VVA?si=8ISjm8fkp9JLNmDm",
  contestName: "Piano Inspires Kids Composition Contest",
  contestPlaylistUrl: "https://youtube.com/playlist?list=PLhhleIn9mEjhNAztK55u86m13lu6xpqoM&si=Ck8ZBYlCjm1Crp4G",
  contestMagazineUrl: "https://kids.pianoinspires.com/magazine/",
  developerName: "Le Binh Anh Nguyen",
  developerUrl: "https://www.coastal.edu/academics/facultyprofiles/humanities/music/lebinhanhnguyen/",
} as const;
const CONTROL_STYLE_OPTIONS = [
  { id: "arcade", label: "Arcade Gold" },
  { id: "soft", label: "Soft Cream" },
  { id: "glass", label: "Mint Glass" },
  { id: "stone-mint", label: "Stone" },
  { id: "comic", label: "Comic Pop" },
  { id: "outline", label: "Round Outline" },
] as const;
const BACKGROUND_THEME_OPTIONS = [
  { id: "mint-paper", label: "Mint Paper" },
  { id: "cream-flat", label: "Cream Flat" },
  { id: "sky-wash", label: "Sky Wash" },
  { id: "peach-studio", label: "Peach Studio" },
  { id: "comic-gradient", label: "Comic Gradient" },
  { id: "ink-night", label: "Ink Night" },
  { id: "deep-teal", label: "Deep Teal" },
  { id: "plum-stage", label: "Plum Stage" },
  { id: "blackout", label: "Black" },
] as const;
const BORDER_STYLE_OPTIONS = [
  { id: "framed", label: "Framed" },
  { id: "clean", label: "No Border" },
] as const;
const DIALOGUE_PANEL_OPTIONS = [
  { id: "sky", label: "Sky Blue" },
  { id: "paper", label: "Paper" },
  { id: "cream", label: "Cream" },
  { id: "warm-cream", label: "Warm Cream" },
  { id: "mint", label: "Mint" },
  { id: "peach", label: "Peach" },
  { id: "stone", label: "Stone" },
  { id: "ink", label: "Dark Ink" },
] as const;
const AVATAR_BACKGROUND_OPTIONS = [
  { id: "gold", label: "Gold" },
  { id: "paper", label: "Paper" },
  { id: "sky", label: "Sky" },
  { id: "mint", label: "Mint" },
  { id: "peach", label: "Peach" },
  { id: "hero-red", label: "Hero Red" },
  { id: "badge-blue", label: "Badge Blue" },
  { id: "teal", label: "Teal" },
  { id: "stone", label: "Stone" },
  { id: "black", label: "Black" },
] as const;
const USE_MOBILE_CHARACTER_ASSETS = window.matchMedia("(pointer: coarse), (max-width: 820px), (max-height: 760px)").matches;
const AVATAR_CHARACTER_OPTIONS = [
  {
    id: "mr-not-so-awesome",
    label: "Mr. Not So Awesome",
    path: USE_MOBILE_CHARACTER_ASSETS
      ? "/assets/characters/MrNotSoAwesomeTexturedBright-mobile.glb"
      : "/assets/characters/MrNotSoAwesomeTexturedBright.glb",
  },
  {
    id: "mr-awesome",
    label: "Mr. Awesome",
    path: USE_MOBILE_CHARACTER_ASSETS
      ? "/assets/characters/TexturedMeshBright-mobile.glb"
      : "/assets/characters/TexturedMeshBright.glb",
  },
] as const satisfies readonly AvatarModelDefinition[];
type ControlStyleId = (typeof CONTROL_STYLE_OPTIONS)[number]["id"];
type BackgroundThemeId = (typeof BACKGROUND_THEME_OPTIONS)[number]["id"];
type BorderStyleId = (typeof BORDER_STYLE_OPTIONS)[number]["id"];
type DialoguePanelId = (typeof DIALOGUE_PANEL_OPTIONS)[number]["id"];
type AvatarBackgroundId = (typeof AVATAR_BACKGROUND_OPTIONS)[number]["id"];
type AvatarCharacterId = (typeof AVATAR_CHARACTER_OPTIONS)[number]["id"];
const DEFAULT_CONTROL_STYLE: ControlStyleId = "comic";
const DEFAULT_BACKGROUND_THEME: BackgroundThemeId = "blackout";
const DEFAULT_BORDER_STYLE: BorderStyleId = "clean";
const DEFAULT_DIALOGUE_PANEL: DialoguePanelId = "stone";
const DEFAULT_AVATAR_BACKGROUND: AvatarBackgroundId = "mint";
const DEFAULT_AVATAR_CHARACTER: AvatarCharacterId = "mr-not-so-awesome";
interface AvatarFraming {
  verticalPercent: number;
  zoomPercent: number;
}

const AVATAR_ZOOM_MIN = 55;
const AVATAR_ZOOM_MAX = 160;
const AVATAR_ZOOM_DEFAULT = 100;
const FIXED_DIALOGUE_AVATAR_FRAMING: Record<AvatarCharacterId, AvatarFraming> = {
  "mr-not-so-awesome": { verticalPercent: -50, zoomPercent: 90 },
  "mr-awesome": { verticalPercent: 0, zoomPercent: 58 },
};
const storedAvatarState = readStoredAvatarState();

ensureEditorDom();

const gameView = requireElement("#game-view");
const gameBoard = requireElement("#game-board");
const bottomLayer = requireElement("#bottom-layer");
const composition = requireElement("#game-composition");
const avatarBox = requireElement("[data-villain-avatar]");
avatarBox.dataset.avatarPortrait = storedAvatarState.characterId;
composition.classList.add("is-booting");
const renderer = new ThreeStageRenderer(gameView);
const villainAvatar = new VillainAvatarRenderer(avatarBox, avatarOptionById(storedAvatarState.characterId), { deferInitialLoad: true });
const dialogueDirector = new DialogueDirector();
const music = new MusicManager();
const sfx = new SfxManager();
const resizeObserver = new ResizeObserver(() => renderer.resize());
resizeObserver.observe(gameView);

let state = createInitialState(readStoredStageMap());
let editMode = false;
let cheatMode = false;
let editSelection: RenderEditSelection | undefined;
let selectedObject: StagePlacedObject | undefined;
let selectedPoint: GridPoint | undefined;
let hoveredTile: GridPoint | undefined;
let hoveredLaneLine = "";
let selectedLaneZ: number | undefined;
let editClipboard: StagePlacedObject | undefined;
let dragStart:
  | {
      x: number;
      z: number;
      object: StagePlacedObject;
      copy: boolean;
    }
  | undefined;
let pointerStart: { x: number; y: number } | undefined;
let avatarCharacterId: AvatarCharacterId = storedAvatarState.characterId;
let avatarZoomPercent = storedAvatarState.framing[avatarCharacterId].zoomPercent;
const avatarFramingByCharacter = new Map<AvatarCharacterId, AvatarFraming>(
  AVATAR_CHARACTER_OPTIONS.map((option) => [option.id, { ...storedAvatarState.framing[option.id] }]),
);
let previousTime = performance.now();
let previousDialogueState: GameState | undefined;
let lastDialogueKey = "";
let musicEnabled = readStoredMusicEnabled();
type BootPhase = "loading" | "assets" | "dialogue";
let bootPhase: BootPhase = "loading";
let bootQuietTimer: number | undefined;
let openingTutorialDismissed = false;
let openingTutorialAnimating = false;
let openingTutorialSuccessVisible = false;
let openingTutorialSuccessSwapping = false;
let openingTutorialSfxTimer: number | undefined;
let openingTutorialSwapTimer: number | undefined;
let openingTutorialFinishTimer: number | undefined;
let debugControlsVisible = false;
let observedRunId = state.runId;
let bootReady = false;
let avatarWarmStarted = false;
let creditsUnlockedThisSession = false;

const elements = {
  dialogueStrip: requireElement<HTMLElement>(".dialogue-strip"),
  phase: requireElement("[data-phase]"),
  score: requireElement("[data-score]"),
  best: requireElement("[data-best]"),
  pancakes: requireElement("[data-pancakes]"),
  speaker: requireElement("[data-speaker]"),
  message: requireElement("[data-message]"),
  clearOverlay: requireElement("#stage-clear"),
  crashOverlay: requireElement("#crash-overlay"),
  mapDrawer: requireElement("#map-drawer"),
  mapStatus: requireElement("[data-map-status]"),
  stageMap: requireElement<HTMLTextAreaElement>("[data-stage-map]"),
  validation: requireElement<HTMLTextAreaElement>("[data-stage-validation]"),
  editToggle: requireElement<HTMLButtonElement>("[data-edit-toggle]"),
  cameraPanel: requireElement("[data-edit-camera-panel]"),
  avatarCharacter: requireElement<HTMLSelectElement>("[data-avatar-character]"),
  avatarBackground: requireElement<HTMLSelectElement>("[data-avatar-background]"),
  cameraPreset: requireElement<HTMLSelectElement>("[data-camera-preset]"),
  cameraZoom: requireElement<HTMLInputElement>("[data-camera-zoom]"),
  laneHover: requireElement<HTMLElement>("[data-lane-hover]"),
  laneHoverCode: requireElement<HTMLElement>("[data-lane-hover-code]"),
  laneHoverText: requireElement<HTMLTextAreaElement>("[data-lane-hover-text]"),
  laneHoverCopy: requireElement<HTMLButtonElement>("[data-lane-hover-copy]"),
  laneHoverEdit: requireElement<HTMLButtonElement>("[data-lane-hover-edit]"),
  laneHoverApply: requireElement<HTMLButtonElement>("[data-lane-hover-apply]"),
  laneHoverCancel: requireElement<HTMLButtonElement>("[data-lane-hover-cancel]"),
  avatarDrag: requireElement<HTMLButtonElement>("[data-avatar-drag]"),
  controlStyle: requireElement<HTMLSelectElement>("[data-control-style]"),
  backgroundTheme: requireElement<HTMLSelectElement>("[data-background-theme]"),
  borderStyle: requireElement<HTMLSelectElement>("[data-border-style]"),
  dialoguePanel: requireElement<HTMLSelectElement>("[data-dialogue-panel]"),
  gameplayZoomGuide: requireElement("[data-gameplay-zoom-guide]"),
  creditsOpen: requireElement<HTMLButtonElement>("[data-credits-open]"),
  creditsClose: requireElement<HTMLButtonElement>("[data-credits-close]"),
  creditsModal: requireElement<HTMLElement>("[data-credits-modal]"),
  statusStrip: requireElement<HTMLElement>(".status-strip"),
  bottomActions: requireElement<HTMLElement>(".bottom-actions"),
  creditStudentName: requireElement<HTMLElement>("[data-credit-student-name]"),
  creditStudentVideo: requireElement<HTMLAnchorElement>("[data-credit-student-video]"),
  creditContestName: requireElement<HTMLElement>("[data-credit-contest-name]"),
  creditContestPlaylist: requireElement<HTMLAnchorElement>("[data-credit-contest-playlist]"),
  creditContestMagazine: requireElement<HTMLAnchorElement>("[data-credit-contest-magazine]"),
  creditDeveloperName: requireElement<HTMLElement>("[data-credit-developer-name]"),
  creditDeveloperUrl: requireElement<HTMLAnchorElement>("[data-credit-developer-url]"),
  repeatRoute: requireElement<HTMLButtonElement>("[data-repeat-route]"),
  musicToggle: requireElement<HTMLButtonElement>("[data-music-toggle]"),
};

music.setEnabled(musicEnabled);
sfx.setEnabled(musicEnabled);
elements.stageMap.value = state.stageMap;
populateCredits();
populateCameraControls();
configureEditorAvailability();
updateMusicToggle();
bindButtons();
bindKeyboard();
bindPointer();
bindNativeGestureGuards();
updateUi();
startBootReadiness();
requestAnimationFrame(frame);

window.addEventListener("beforeunload", () => {
  if (bootQuietTimer !== undefined) window.clearTimeout(bootQuietTimer);
  if (openingTutorialSfxTimer !== undefined) window.clearTimeout(openingTutorialSfxTimer);
  if (openingTutorialFinishTimer !== undefined) window.clearTimeout(openingTutorialFinishTimer);
  resizeObserver.disconnect();
  music.dispose();
  sfx.dispose();
  renderer.dispose();
  villainAvatar.dispose();
});

function ensureEditorDom(): void {
  const board = document.querySelector<HTMLElement>("#game-board");
  if (board && !document.querySelector("[data-gameplay-zoom-guide]")) {
    board.insertAdjacentHTML(
      "beforeend",
      `
        <div class="gameplay-zoom-guide" data-gameplay-zoom-guide hidden aria-hidden="true"></div>
        <div class="lane-hover-card" data-lane-hover hidden>
          <span>Lane row</span>
          <code data-lane-hover-code></code>
          <textarea data-lane-hover-text spellcheck="false" aria-label="Selected lane row text" hidden></textarea>
          <button type="button" data-lane-hover-copy>Copy</button>
          <button type="button" data-lane-hover-edit>Quick Edit</button>
          <button type="button" data-lane-hover-apply hidden>Apply</button>
          <button type="button" data-lane-hover-cancel hidden>Cancel</button>
        </div>
      `,
    );
  }

  const bottomLayer = document.querySelector<HTMLElement>("#bottom-layer");
  if (bottomLayer && !document.querySelector(".bottom-actions")) {
    bottomLayer.insertAdjacentHTML(
      "beforeend",
      `
        <div class="bottom-actions">
          <button type="button" data-action="pause" aria-label="Pause">II</button>
          <button type="button" data-action="restart" aria-label="Restart">↻</button>
          <button type="button" data-toggle-map>Map</button>
        </div>
      `,
    );
  }

  const appShell = document.querySelector<HTMLElement>("#app-shell");
  if (appShell && !document.querySelector("#map-drawer")) {
    appShell.insertAdjacentHTML(
      "beforeend",
      `
        <aside id="map-drawer" hidden aria-label="Stage Map Textbox">
          <div class="drawer-head">
            <strong>Stage Map Textbox</strong>
            <span data-map-status data-tone="neutral">Ready</span>
            <button type="button" class="drawer-close" data-toggle-map aria-label="Close stage map">X</button>
          </div>
          <textarea data-stage-map spellcheck="false" aria-label="Stage 1 map text"></textarea>
          <div class="drawer-actions">
            <button type="button" data-stage-apply>Apply Map</button>
            <button type="button" data-stage-copy>Copy Map</button>
            <button type="button" data-stage-reset>Reset Stage</button>
            <button type="button" data-stage-validate>Validate Map</button>
            <button type="button" data-feedback-copy>Copy Feedback Block</button>
            <button type="button" data-edit-toggle aria-pressed="false">Edit Mode</button>
          </div>
          <div class="drawer-camera" data-edit-camera-panel hidden>
            <label>
              <span>Avatar Character</span>
              <select data-avatar-character aria-label="Dialogue avatar character"></select>
            </label>
            <label>
              <span>Avatar Background</span>
              <select data-avatar-background aria-label="Dialogue avatar background color"></select>
            </label>
            <label>
              <span>Button Style</span>
              <select data-control-style aria-label="On-screen button style"></select>
            </label>
            <label>
              <span>Background</span>
              <select data-background-theme aria-label="Temporary background color option"></select>
            </label>
            <label>
              <span>Border Style</span>
              <select data-border-style aria-label="Temporary border style option"></select>
            </label>
            <label>
              <span>Dialogue Panel</span>
              <select data-dialogue-panel aria-label="Temporary dialogue panel color option"></select>
            </label>
            <label>
              <span>Editor Angle</span>
              <select data-camera-preset aria-label="Editor camera angle"></select>
            </label>
            <label>
              <span>Editor Zoom</span>
              <span class="zoom-range-wrap">
                <input data-camera-zoom type="range" min="90" max="190" step="5" value="150" aria-label="Editor camera zoom" />
                <span class="gameplay-zoom-mark" aria-hidden="true"></span>
              </span>
            </label>
            <div class="avatar-drag-control">
              <span>Avatar Vertical</span>
              <button type="button" class="avatar-drag-pad" data-avatar-drag aria-label="Drag avatar portrait up or down">
                <span></span>
              </button>
            </div>
            <div class="avatar-zoom-control">
              <span>Avatar Zoom</span>
              <div class="avatar-zoom-buttons">
                <button type="button" data-avatar-zoom-step="-10" aria-label="Zoom avatar out">-</button>
                <button type="button" data-avatar-zoom-reset>Default</button>
                <button type="button" data-avatar-zoom-step="10" aria-label="Zoom avatar in">+</button>
              </div>
            </div>
          </div>
          <textarea data-stage-validation spellcheck="false" readonly aria-label="Stage 1 validation output"></textarea>
        </aside>
      `,
    );
  }
}

function frame(now: number): void {
  const deltaSeconds = Math.min(0.05, (now - previousTime) / 1000);
  previousTime = now;
  const creditsOpen = !elements.creditsModal.hidden;
  const previousState = state;
  if (!creditsOpen) {
    state = tickGame(state, deltaSeconds, { hazardsEnabled: !editMode && !cheatMode, stageCompletionEnabled: !editMode, cheatMode });
  }
  if (previousState.stage.mode === "finalSequence" && state.runId !== previousState.runId) {
    creditsUnlockedThisSession = true;
  }
  if (state.runId !== observedRunId) {
    observedRunId = state.runId;
    resetOpeningTutorial();
    previousDialogueState = undefined;
    lastDialogueKey = "";
  }
  if (!creditsOpen) sfx.sync(previousState, state, { cheatMode });
  music.sync(state, { cheatMode });
  renderer.render(state, creditsOpen ? 0 : deltaSeconds, editSelection, { useStageCamera: !editMode });
  updateUi();
  requestAnimationFrame(frame);
}

function populateCredits(): void {
  elements.creditStudentName.textContent = CREDITS_CONFIG.studentName;
  elements.creditContestName.textContent = CREDITS_CONFIG.contestName;
  elements.creditDeveloperName.textContent = CREDITS_CONFIG.developerName;
  applyCreditLink(elements.creditStudentVideo, CREDITS_CONFIG.studentVideoUrl);
  applyCreditLink(elements.creditContestPlaylist, CREDITS_CONFIG.contestPlaylistUrl);
  applyCreditLink(elements.creditContestMagazine, CREDITS_CONFIG.contestMagazineUrl);
  applyCreditLink(elements.creditDeveloperUrl, CREDITS_CONFIG.developerUrl);
}

function applyCreditLink(anchor: HTMLAnchorElement, url: string | undefined): void {
  if (!url) {
    anchor.hidden = true;
    anchor.removeAttribute("href");
    return;
  }
  anchor.hidden = false;
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
}

function configureEditorAvailability(): void {
  document.body.dataset.editorEnabled = String(EDITOR_ENABLED);
  composition.dataset.editorEnabled = String(EDITOR_ENABLED);
  if (EDITOR_ENABLED) {
    elements.mapDrawer.removeAttribute("aria-hidden");
    elements.mapDrawer.removeAttribute("inert");
    return;
  }

  editMode = false;
  debugControlsVisible = false;
  elements.bottomActions.hidden = true;
  elements.statusStrip.hidden = true;
  elements.mapDrawer.setAttribute("aria-hidden", "true");
  elements.mapDrawer.setAttribute("inert", "");
  elements.mapDrawer.remove();
  elements.laneHover.remove();
  elements.gameplayZoomGuide.remove();
  elements.bottomActions.remove();
}

function openCreditsModal(): void {
  scheduleViewportSync();
  elements.creditsModal.hidden = false;
  composition.classList.add("is-credits-open");
  window.requestAnimationFrame(syncViewportMetrics);
  elements.creditsClose.focus();
}

function closeCreditsModal(): void {
  elements.creditsModal.hidden = true;
  composition.classList.remove("is-credits-open");
  if (musicEnabled) {
    unlockMusic();
    syncMusicNow();
  }
  elements.creditsOpen.focus();
}

function isMoveAction(action: MoveAction | GameAction | "toggleMap"): action is MoveAction {
  return action === "forward" || action === "backward" || action === "left" || action === "right";
}

function pulseMoveButton(action: MoveAction): void {
  const button = document.querySelector<HTMLButtonElement>(`[data-move="${action}"]`);
  if (!button) return;
  button.classList.remove("is-pressing");
  // Restart the CSS state even on rapid keyboard taps.
  window.requestAnimationFrame(() => {
    button.classList.add("is-pressing");
    window.setTimeout(() => button.classList.remove("is-pressing"), 150);
  });
}

function performMoveAction(move: MoveAction): void {
  if (!bootReady) return;
  if (handleOpeningTutorialStart()) return;
  state = applyAction(state, move, { allowMoveFromTerminal: editMode || cheatMode, cheatMode });
  syncMusicNow();
  updateUi();
}

function bindButtons(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((button) => {
    if (!EDITOR_ENABLED && button.closest(".bottom-actions")) return;
    button.addEventListener("click", () => {
      button.blur();
      unlockMusic();
      const action = button.dataset.action as GameAction | undefined;
      if (!action) return;
      if (action === "restart") resetOpeningTutorial();
      state = applyAction(state, action, { cheatMode });
      syncMusicNow();
      if (action === "restart") clearEditSelection();
      updateUi();
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-move]").forEach((button) => {
    const clearPress = () => button.classList.remove("is-pressing");
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.classList.add("is-pressing");
      unlockMusic();
      const move = button.dataset.move as MoveAction | undefined;
      if (move) performMoveAction(move);
    });
    button.addEventListener("pointerup", clearPress);
    button.addEventListener("pointercancel", clearPress);
    button.addEventListener("pointerleave", clearPress);
    button.addEventListener("click", (event) => {
      if (event.detail !== 0) return;
      button.blur();
      clearPress();
      unlockMusic();
      const move = button.dataset.move as MoveAction | undefined;
      if (move) performMoveAction(move);
    });
  });

  bottomLayer.addEventListener("click", (event) => {
    const target = event.target as Element | null;
    if (target?.closest("button, a, input, textarea, select")) return;
    advanceRevealConversationFromUi(event);
  });

  if (EDITOR_ENABLED) {
    document.querySelectorAll<HTMLButtonElement>("[data-toggle-map]").forEach((button) => {
      button.addEventListener("click", () => {
        const hidden = elements.mapDrawer.hasAttribute("hidden");
        elements.mapDrawer.toggleAttribute("hidden", !hidden);
      });
    });
  }

  elements.creditsOpen.addEventListener("click", () => {
    elements.creditsOpen.blur();
    if (elements.creditsModal.hidden) {
      openCreditsModal();
      return;
    }
    closeCreditsModal();
  });

  elements.creditsClose.addEventListener("click", () => {
    elements.creditsClose.blur();
    closeCreditsModal();
  });

  elements.creditsModal.addEventListener("click", (event) => {
    if (event.target !== elements.creditsModal) return;
    closeCreditsModal();
  });

  elements.repeatRoute.addEventListener("click", () => {
    elements.repeatRoute.blur();
    unlockMusic();
    state = createInitialState(state.stageMap, state.runId + 1, Math.max(state.bestScore, state.score));
    resetOpeningTutorial();
    clearEditSelection();
    previousDialogueState = undefined;
    lastDialogueKey = "";
    syncMusicNow();
    updateUi();
  });

  elements.musicToggle.addEventListener("click", () => {
    elements.musicToggle.blur();
    musicEnabled = !musicEnabled;
    window.localStorage.setItem(MUSIC_ENABLED_STORAGE_KEY, String(musicEnabled));
    if (musicEnabled) unlockMusic();
    music.setEnabled(musicEnabled);
    sfx.setEnabled(musicEnabled);
    syncMusicNow();
    updateMusicToggle();
  });

  if (!EDITOR_ENABLED) return;

  requireElement<HTMLButtonElement>("[data-stage-apply]").addEventListener("click", () => {
    applyMapText(elements.stageMap.value, true, { preservePlayer: editMode });
  });

  requireElement<HTMLButtonElement>("[data-stage-copy]").addEventListener("click", () => {
    copyStageMap();
  });

  requireElement<HTMLButtonElement>("[data-stage-reset]").addEventListener("click", () => {
    resetOpeningTutorial();
    elements.stageMap.value = baselineStageMap();
    applyMapText(elements.stageMap.value, true, { preservePlayer: false });
    elements.validation.value = "Reset Stage 1 to v110B final candidate route.";
  });

  requireElement<HTMLButtonElement>("[data-stage-validate]").addEventListener("click", () => {
    const output = validateStageMap(elements.stageMap.value);
    elements.validation.value = output;
    setMapStatus(output.startsWith("OK:") ? "Validation passed." : "Validation failed.", output.startsWith("OK:") ? "ok" : "error");
  });

  requireElement<HTMLButtonElement>("[data-feedback-copy]").addEventListener("click", () => {
    copyText(exportStageFeedback(BUILD_ID, elements.stageMap.value, state), "Copied feedback block.");
  });

  elements.editToggle.addEventListener("click", () => {
    editMode = !editMode;
    clearEditSelection();
    hideLaneHover();
    dragStart = undefined;
    elements.cameraPanel.toggleAttribute("hidden", !editMode);
    elements.editToggle.classList.toggle("is-active", editMode);
    elements.editToggle.setAttribute("aria-pressed", String(editMode));
    updateGameplayZoomGuide();
    setMapStatus(editMode ? "Edit Mode on. Arrows move safely; Shift+Up/Down cycles variants." : "Edit Mode off.", "neutral");
  });

  elements.cameraPreset.addEventListener("change", () => {
    renderer.setCameraPreset(elements.cameraPreset.value as CameraPresetId);
    setMapStatus(`Editor camera: ${elements.cameraPreset.selectedOptions[0]?.textContent ?? elements.cameraPreset.value}.`, "neutral");
  });

  elements.cameraZoom.addEventListener("input", () => {
    renderer.setCameraZoom(Number(elements.cameraZoom.value));
    updateGameplayZoomGuide();
  });

  elements.avatarCharacter.addEventListener("change", () => {
    applyAvatarCharacter(elements.avatarCharacter.value);
    setMapStatus(`Avatar: ${elements.avatarCharacter.selectedOptions[0]?.textContent ?? elements.avatarCharacter.value}.`, "neutral");
  });
  elements.avatarBackground.addEventListener("change", () => {
    applyAvatarBackground(elements.avatarBackground.value);
    setMapStatus(`Avatar background: ${elements.avatarBackground.selectedOptions[0]?.textContent ?? elements.avatarBackground.value}.`, "neutral");
  });

  elements.avatarDrag.addEventListener("pointerdown", beginAvatarVerticalDrag);
  avatarBox.addEventListener("pointerdown", beginAvatarVerticalDrag);
  document.querySelectorAll<HTMLButtonElement>("[data-avatar-zoom-step]").forEach((button) => {
    button.addEventListener("click", () => {
      avatarZoomPercent = clampNumber(avatarZoomPercent + Number(button.dataset.avatarZoomStep), AVATAR_ZOOM_MIN, AVATAR_ZOOM_MAX);
      saveCurrentAvatarFraming();
      updateAvatarFraming();
      setMapStatus(`Avatar zoom: ${avatarZoomPercent}%.`, "neutral");
    });
  });
  requireElement<HTMLButtonElement>("[data-avatar-zoom-reset]").addEventListener("click", () => {
    avatarZoomPercent = AVATAR_ZOOM_DEFAULT;
    saveCurrentAvatarFraming();
    updateAvatarFraming();
    setMapStatus("Avatar zoom reset.", "neutral");
  });
  elements.controlStyle.addEventListener("change", () => {
    applyControlStyle(elements.controlStyle.value);
    setMapStatus(`Button style: ${elements.controlStyle.selectedOptions[0]?.textContent ?? elements.controlStyle.value}.`, "neutral");
  });
  elements.backgroundTheme.addEventListener("change", () => {
    applyBackgroundTheme(elements.backgroundTheme.value);
    setMapStatus(`Background: ${elements.backgroundTheme.selectedOptions[0]?.textContent ?? elements.backgroundTheme.value}.`, "neutral");
  });
  elements.borderStyle.addEventListener("change", () => {
    applyBorderStyle(elements.borderStyle.value);
    setMapStatus(`Border style: ${elements.borderStyle.selectedOptions[0]?.textContent ?? elements.borderStyle.value}.`, "neutral");
  });
  elements.dialoguePanel.addEventListener("change", () => {
    applyDialoguePanel(elements.dialoguePanel.value);
    setMapStatus(`Dialogue panel: ${elements.dialoguePanel.selectedOptions[0]?.textContent ?? elements.dialoguePanel.value}.`, "neutral");
  });
  elements.laneHoverCopy.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!hoveredLaneLine) return;
    copyText(hoveredLaneLine, "Copied lane row.");
  });
  elements.laneHoverEdit.addEventListener("click", (event) => {
    event.stopPropagation();
    setLanePopupEditing(true);
  });
  elements.laneHoverApply.addEventListener("click", (event) => {
    event.stopPropagation();
    applySelectedLaneEdit();
  });
  elements.laneHoverCancel.addEventListener("click", (event) => {
    event.stopPropagation();
    elements.laneHoverText.value = hoveredLaneLine;
    setLanePopupEditing(false);
  });
}

function populateCameraControls(): void {
  elements.cameraPreset.innerHTML = "";
  for (const option of CAMERA_PRESET_OPTIONS) {
    const element = document.createElement("option");
    element.value = option.id;
    element.textContent = option.label;
    elements.cameraPreset.appendChild(element);
  }
  elements.cameraPreset.value = DEFAULT_CAMERA_PRESET;
  elements.cameraZoom.value = String(DEFAULT_CAMERA_ZOOM_PERCENT);
  elements.avatarCharacter.innerHTML = "";
  for (const option of AVATAR_CHARACTER_OPTIONS) {
    const element = document.createElement("option");
    element.value = option.id;
    element.textContent = option.label;
    elements.avatarCharacter.appendChild(element);
  }
  elements.avatarCharacter.value = avatarCharacterId;
  elements.speaker.textContent = avatarOptionById(avatarCharacterId).label;
  avatarBox.querySelector("span")?.replaceChildren(document.createTextNode(avatarCharacterId === "mr-awesome" ? "A" : "N"));
  elements.avatarBackground.innerHTML = "";
  for (const option of AVATAR_BACKGROUND_OPTIONS) {
    const element = document.createElement("option");
    element.value = option.id;
    element.textContent = option.label;
    elements.avatarBackground.appendChild(element);
  }
  elements.avatarBackground.value = readAvatarBackground();
  applyAvatarBackground(elements.avatarBackground.value);
  elements.controlStyle.innerHTML = "";
  for (const option of CONTROL_STYLE_OPTIONS) {
    const element = document.createElement("option");
    element.value = option.id;
    element.textContent = option.label;
    elements.controlStyle.appendChild(element);
  }
  elements.controlStyle.value = readControlStyle();
  applyControlStyle(elements.controlStyle.value);
  elements.backgroundTheme.innerHTML = "";
  for (const option of BACKGROUND_THEME_OPTIONS) {
    const element = document.createElement("option");
    element.value = option.id;
    element.textContent = option.label;
    elements.backgroundTheme.appendChild(element);
  }
  elements.backgroundTheme.value = readBackgroundTheme();
  applyBackgroundTheme(elements.backgroundTheme.value);
  elements.borderStyle.innerHTML = "";
  for (const option of BORDER_STYLE_OPTIONS) {
    const element = document.createElement("option");
    element.value = option.id;
    element.textContent = option.label;
    elements.borderStyle.appendChild(element);
  }
  elements.borderStyle.value = readBorderStyle();
  applyBorderStyle(elements.borderStyle.value);
  elements.dialoguePanel.innerHTML = "";
  for (const option of DIALOGUE_PANEL_OPTIONS) {
    const element = document.createElement("option");
    element.value = option.id;
    element.textContent = option.label;
    elements.dialoguePanel.appendChild(element);
  }
  elements.dialoguePanel.value = readDialoguePanel();
  applyDialoguePanel(elements.dialoguePanel.value);
  updateAvatarFraming();
  updateGameplayZoomGuide();
}

function applyControlStyle(value: string): void {
  const style = isControlStyleId(value) ? value : DEFAULT_CONTROL_STYLE;
  elements.controlStyle.value = style;
  composition.dataset.controlTheme = style;
  window.localStorage.setItem(CONTROL_STYLE_STORAGE_KEY, style);
}

function readControlStyle(): ControlStyleId {
  const stored = window.localStorage.getItem(CONTROL_STYLE_STORAGE_KEY);
  return isControlStyleId(stored) ? stored : DEFAULT_CONTROL_STYLE;
}

function isControlStyleId(value: unknown): value is ControlStyleId {
  return typeof value === "string" && CONTROL_STYLE_OPTIONS.some((option) => option.id === value);
}

function applyBackgroundTheme(value: string): void {
  const theme = isBackgroundThemeId(value) ? value : DEFAULT_BACKGROUND_THEME;
  elements.backgroundTheme.value = theme;
  document.body.dataset.pageBackgroundTheme = theme;
  window.localStorage.setItem(BACKGROUND_THEME_STORAGE_KEY, theme);
}

function readBackgroundTheme(): BackgroundThemeId {
  const stored = window.localStorage.getItem(BACKGROUND_THEME_STORAGE_KEY);
  return isBackgroundThemeId(stored) ? stored : DEFAULT_BACKGROUND_THEME;
}

function isBackgroundThemeId(value: unknown): value is BackgroundThemeId {
  return typeof value === "string" && BACKGROUND_THEME_OPTIONS.some((option) => option.id === value);
}

function applyBorderStyle(value: string): void {
  const style = isBorderStyleId(value) ? value : DEFAULT_BORDER_STYLE;
  elements.borderStyle.value = style;
  composition.dataset.borderStyle = style;
  window.localStorage.setItem(BORDER_STYLE_STORAGE_KEY, style);
}

function readBorderStyle(): BorderStyleId {
  const stored = window.localStorage.getItem(BORDER_STYLE_STORAGE_KEY);
  return isBorderStyleId(stored) ? stored : DEFAULT_BORDER_STYLE;
}

function isBorderStyleId(value: unknown): value is BorderStyleId {
  return typeof value === "string" && BORDER_STYLE_OPTIONS.some((option) => option.id === value);
}

function applyDialoguePanel(value: string): void {
  const panel = isDialoguePanelId(value) ? value : DEFAULT_DIALOGUE_PANEL;
  elements.dialoguePanel.value = panel;
  composition.dataset.dialoguePanel = panel;
  window.localStorage.setItem(DIALOGUE_PANEL_STORAGE_KEY, panel);
}

function readDialoguePanel(): DialoguePanelId {
  const stored = window.localStorage.getItem(DIALOGUE_PANEL_STORAGE_KEY);
  return isDialoguePanelId(stored) ? stored : DEFAULT_DIALOGUE_PANEL;
}

function isDialoguePanelId(value: unknown): value is DialoguePanelId {
  return typeof value === "string" && DIALOGUE_PANEL_OPTIONS.some((option) => option.id === value);
}

function applyAvatarBackground(value: string, options: { persist?: boolean } = {}): void {
  const shouldPersist = options.persist ?? true;
  const background = isAvatarBackgroundId(value) ? value : DEFAULT_AVATAR_BACKGROUND;
  elements.avatarBackground.value = background;
  avatarBox.dataset.avatarBackground = background;
  if (shouldPersist) window.localStorage.setItem(AVATAR_BACKGROUND_STORAGE_KEY, background);
}

function readAvatarBackground(): AvatarBackgroundId {
  const stored = window.localStorage.getItem(AVATAR_BACKGROUND_STORAGE_KEY);
  return isAvatarBackgroundId(stored) ? stored : DEFAULT_AVATAR_BACKGROUND;
}

function isAvatarBackgroundId(value: unknown): value is AvatarBackgroundId {
  return typeof value === "string" && AVATAR_BACKGROUND_OPTIONS.some((option) => option.id === value);
}

function applyAvatarCharacter(value: string, options: { persist?: boolean; updateSpeakerLabel?: boolean } = {}): void {
  const shouldPersist = options.persist ?? true;
  const shouldUpdateSpeakerLabel = options.updateSpeakerLabel ?? true;
  const nextCharacter = isAvatarCharacterId(value) ? value : DEFAULT_AVATAR_CHARACTER;
  const option = avatarOptionById(nextCharacter);
  avatarCharacterId = nextCharacter;
  elements.avatarCharacter.value = nextCharacter;
  if (shouldUpdateSpeakerLabel) elements.speaker.textContent = option.label;
  avatarBox.dataset.avatarPortrait = nextCharacter;
  avatarBox.querySelector("span")?.replaceChildren(document.createTextNode(nextCharacter === "mr-awesome" ? "A" : "N"));
  updateAvatarFraming();
  void villainAvatar.setModel(option);
  if (shouldPersist) persistAvatarState();
}

function scheduleUiAfterAvatarPaint(): void {
  requestAnimationFrame(() => requestAnimationFrame(() => updateUi()));
}

function applyDialogueSpeakerVisual(speaker: "A" | "B"): boolean {
  const nextCharacter: AvatarCharacterId = speaker === "A" ? "mr-awesome" : "mr-not-so-awesome";
  const nextBackground: AvatarBackgroundId = speaker === "A" ? "sky" : "mint";
  const option = avatarOptionById(nextCharacter);
  if (!villainAvatar.isModelReady(nextCharacter)) {
    void villainAvatar.preload(option).then(() => scheduleUiAfterAvatarPaint());
    return false;
  }
  if (avatarCharacterId !== nextCharacter) applyAvatarCharacter(nextCharacter, { persist: false, updateSpeakerLabel: false });
  else if (!villainAvatar.isShowingModel(nextCharacter)) void villainAvatar.setModel(option).then(() => scheduleUiAfterAvatarPaint());
  if (avatarBox.dataset.avatarBackground !== nextBackground) applyAvatarBackground(nextBackground, { persist: false });
  return true;
}

function saveCurrentAvatarFraming(): void {
  avatarFramingByCharacter.set(avatarCharacterId, { ...FIXED_DIALOGUE_AVATAR_FRAMING[avatarCharacterId] });
  persistAvatarState();
}

function readStoredAvatarState(): { characterId: AvatarCharacterId; framing: Record<AvatarCharacterId, AvatarFraming> } {
  const characterId = isAvatarCharacterId(window.localStorage.getItem(AVATAR_CHARACTER_STORAGE_KEY))
    ? window.localStorage.getItem(AVATAR_CHARACTER_STORAGE_KEY) as AvatarCharacterId
    : DEFAULT_AVATAR_CHARACTER;
  const framing: Record<AvatarCharacterId, AvatarFraming> = {
    "mr-not-so-awesome": { ...FIXED_DIALOGUE_AVATAR_FRAMING["mr-not-so-awesome"] },
    "mr-awesome": { ...FIXED_DIALOGUE_AVATAR_FRAMING["mr-awesome"] },
  };

  return { characterId, framing };
}

function persistAvatarState(): void {
  const framing: Record<AvatarCharacterId, AvatarFraming> = {
    "mr-not-so-awesome": { ...FIXED_DIALOGUE_AVATAR_FRAMING["mr-not-so-awesome"] },
    "mr-awesome": { ...FIXED_DIALOGUE_AVATAR_FRAMING["mr-awesome"] },
  };
  window.localStorage.setItem(AVATAR_CHARACTER_STORAGE_KEY, avatarCharacterId);
  window.localStorage.setItem(AVATAR_FRAMING_STORAGE_KEY, JSON.stringify(framing));
}

function avatarOptionById(id: AvatarCharacterId): AvatarModelDefinition {
  return AVATAR_CHARACTER_OPTIONS.find((option) => option.id === id) ?? AVATAR_CHARACTER_OPTIONS[0];
}

function isAvatarCharacterId(value: unknown): value is AvatarCharacterId {
  return typeof value === "string" && AVATAR_CHARACTER_OPTIONS.some((option) => option.id === value);
}

function updateAvatarFraming(): void {
  const fixedFraming = FIXED_DIALOGUE_AVATAR_FRAMING[avatarCharacterId];
  avatarZoomPercent = fixedFraming.zoomPercent;
  villainAvatar.setFraming({
    verticalOffsetPercent: fixedFraming.verticalPercent,
    zoomPercent: fixedFraming.zoomPercent,
  });
}

function beginAvatarVerticalDrag(event: PointerEvent): void {
  event.preventDefault();
}

function updateGameplayZoomGuide(): void {
  const currentZoom = Number(elements.cameraZoom.value);
  const scale = Math.max(0.2, Math.min(1, currentZoom / DEFAULT_CAMERA_ZOOM_PERCENT));
  elements.gameplayZoomGuide.style.setProperty("--guide-scale", String(scale));
  elements.gameplayZoomGuide.hidden = !editMode || scale >= 0.995;
}

function unlockMusic(): void {
  music.unlock();
  sfx.unlock();
}

function warmOpeningTutorialAudio(): void {
  unlockMusic();
  music.warmIntroTheme();
}

function syncMusicNow(): void {
  music.sync(state, { cheatMode });
}

function readStoredMusicEnabled(): boolean {
  return window.localStorage.getItem(MUSIC_ENABLED_STORAGE_KEY) !== "false";
}

function updateMusicToggle(): void {
  elements.musicToggle.classList.toggle("is-off", !musicEnabled);
  elements.musicToggle.setAttribute("aria-pressed", String(musicEnabled));
  elements.musicToggle.setAttribute("aria-label", musicEnabled ? "Mute music" : "Unmute music");
}

function bindKeyboard(): void {
  const keyMap = new Map<string, MoveAction | "pause" | "restart" | "toggleMap">([
    ["ArrowUp", "forward"],
    ["w", "forward"],
    ["W", "forward"],
    ["ArrowDown", "backward"],
    ["s", "backward"],
    ["S", "backward"],
    ["ArrowLeft", "left"],
    ["a", "left"],
    ["A", "left"],
    ["ArrowRight", "right"],
    ["d", "right"],
    ["D", "right"],
    ["p", "pause"],
    ["P", "pause"],
    ["r", "restart"],
    ["R", "restart"],
    ["`", "toggleMap"],
  ]);

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.creditsModal.hidden) {
      event.preventDefault();
      closeCreditsModal();
      return;
    }
    if (EDITOR_ENABLED && event.key === "Tab" && !isTypingTarget(event.target)) {
      event.preventDefault();
      debugControlsVisible = !debugControlsVisible;
      updateUi();
      return;
    }
    if (event.repeat || isTypingTarget(event.target)) return;
    unlockMusic();
    if (event.key === "CapsLock") {
      event.preventDefault();
      const nextCheatMode = !cheatMode;
      cheatMode = nextCheatMode;
      state = cheatMode ? enterCheatMode(state) : advanceTargetToNextSpawn(state);
      syncMusicNow();
      setMapStatus(cheatMode ? "Cheat Mode on. Hazards are disabled." : "Cheat Mode off.", cheatMode ? "ok" : "neutral");
      updateUi();
      return;
    }
    if (EDITOR_ENABLED && editMode && handleEditKey(event)) return;
    const mapped = keyMap.get(event.key);
    if (!mapped) return;
    event.preventDefault();
    if (!bootReady) return;
    if (isMoveAction(mapped)) pulseMoveButton(mapped);
    if (cheatMode && event.shiftKey && isMoveAction(mapped)) {
      state = jumpCheatToEnding(state);
      syncMusicNow();
      setMapStatus("Cheat Mode ending jump.", "ok");
      updateUi();
      return;
    }
    if (mapped !== "toggleMap" && handleOpeningTutorialStart()) return;
    if (mapped === "toggleMap") {
      if (EDITOR_ENABLED) elements.mapDrawer.toggleAttribute("hidden");
      return;
    }
    state = applyAction(state, mapped, { allowMoveFromTerminal: editMode || cheatMode, cheatMode });
    syncMusicNow();
    updateUi();
  }, { capture: true });
}

function bindNativeGestureGuards(): void {
  const shouldKeepNativeGesture = (target: EventTarget | null) => isTypingTarget(target);
  const blockNativeGesture = (event: Event) => {
    if (shouldKeepNativeGesture(event.target)) return;
    event.preventDefault();
  };
  const blockMultiTouch = (event: TouchEvent) => {
    if (shouldKeepNativeGesture(event.target)) return;
    if (event.touches.length > 1) event.preventDefault();
  };
  let lastTouchEndAt = 0;
  const blockRapidRetap = (event: TouchEvent) => {
    if (shouldKeepNativeGesture(event.target)) return;
    const now = window.performance.now();
    if (now - lastTouchEndAt < 320) event.preventDefault();
    lastTouchEndAt = now;
  };

  for (const eventName of ["contextmenu", "selectstart", "dragstart", "dblclick"] as const) {
    composition.addEventListener(eventName, blockNativeGesture, { capture: true });
  }

  for (const eventName of ["gesturestart", "gesturechange", "gestureend"] as const) {
    document.addEventListener(eventName, blockNativeGesture, { capture: true, passive: false });
  }

  composition.addEventListener("touchstart", blockMultiTouch, { capture: true, passive: false });
  composition.addEventListener("touchmove", blockNativeGesture, { capture: true, passive: false });
  composition.addEventListener("touchend", blockRapidRetap, { capture: true, passive: false });
}

function advanceRevealConversationFromUi(event?: Event): boolean {
  if (cheatMode || !isRevealConversationActive(state)) return false;
  event?.preventDefault();
  unlockMusic();
  state = applyAction(state, "forward", { cheatMode });
  syncMusicNow();
  updateUi();
  return true;
}

function bindPointer(): void {
  gameView.addEventListener("pointerdown", (event) => {
    unlockMusic();
    if (!bootReady) return;
    if (EDITOR_ENABLED && editMode) {
      const tile = renderer.getTileFromPointer(event);
      const stage = parseStageMap(state.stageMap).stage;
      const object = tile && stage ? objectAt(stage, tile) : undefined;
      hoveredTile = tile;
      if (tile && object) {
        hideLaneHover();
        selectedObject = object;
        selectedPoint = tile;
        dragStart = { ...tile, object, copy: event.altKey };
        editSelection = selectionForObject(object, event.altKey);
        gameView.setPointerCapture(event.pointerId);
        event.preventDefault();
        return;
      }
      clearEditSelection();
      showLaneCard(event);
      if (tile) setMapStatus(`Selected empty tile x=${tile.x} z=${tile.z}.`, "neutral");
      event.preventDefault();
      return;
    }
    pointerStart = { x: event.clientX, y: event.clientY };
    gameView.setPointerCapture(event.pointerId);
  });

  gameView.addEventListener("pointermove", (event) => {
    if (!EDITOR_ENABLED || !editMode) return;
    const tile = renderer.getTileFromPointer(event);
    hoveredTile = tile;
    if (tile && dragStart) {
      hideLaneHover();
      const previewCells = shiftedCells(dragStart.object, dragStart, tile);
      const anchor = shiftedAnchor(dragStart.object, dragStart, tile);
      editSelection = { ...anchor, kind: dragStart.object.kind, cells: previewCells, copy: dragStart.copy || event.altKey };
    }
    event.preventDefault();
  });

  gameView.addEventListener("pointerup", (event) => {
    if (EDITOR_ENABLED && editMode && dragStart) {
      const tile = renderer.getTileFromPointer(event);
      const stage = parseStageMap(state.stageMap).stage;
      if (tile && stage) {
        const shouldCopy = dragStart.copy || event.altKey;
        const edited = shouldCopy
          ? copyStageObject(stage, dragStart.object, shiftedAnchor(dragStart.object, dragStart, tile))
          : moveStageObject(stage, dragStart, tile);
        applyEditResult(edited, shouldCopy ? "copy" : "move");
      }
      dragStart = undefined;
      hideLaneHover();
      event.preventDefault();
      return;
    }

    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = undefined;
    if (handleOpeningTutorialStart()) return;
    if (advanceRevealConversationFromUi(event)) return;
    const threshold = 26;
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
      state = applyAction(state, "forward", { allowMoveFromTerminal: cheatMode, cheatMode });
    } else if (Math.abs(dx) > Math.abs(dy)) {
      state = applyAction(state, dx < 0 ? "left" : "right", { allowMoveFromTerminal: cheatMode, cheatMode });
    } else {
      state = applyAction(state, dy < 0 ? "forward" : "backward", { allowMoveFromTerminal: cheatMode, cheatMode });
    }
    syncMusicNow();
    updateUi();
  });

  gameView.addEventListener("pointercancel", () => {
    pointerStart = undefined;
    dragStart = undefined;
    hideLaneHover();
  });

  gameBoard.addEventListener("pointerleave", () => {
    hideLaneHover();
  });
}

function handleEditKey(event: KeyboardEvent): boolean {
  const key = event.key;
  if ((event.metaKey || event.ctrlKey) && key.toLowerCase() === "c") {
    event.preventDefault();
    if (!selectedObject) {
      setMapStatus("Select an object before copying.", "error");
      return true;
    }
    if (selectedObject.kind === "target") {
      setMapStatus("Target is unique and cannot be copied.", "error");
      return true;
    }
    editClipboard = cloneObject(selectedObject);
    setMapStatus("Copied selected map object.", "ok");
    return true;
  }

  if ((event.metaKey || event.ctrlKey) && key.toLowerCase() === "v") {
    event.preventDefault();
    if (!editClipboard) {
      setMapStatus("Copy an object before pasting.", "error");
      return true;
    }
    if (!hoveredTile) {
      setMapStatus("Hover a valid destination tile before pasting.", "error");
      return true;
    }
    const stage = parseStageMap(state.stageMap).stage;
    if (!stage) {
      setMapStatus("Map failed validation.", "error");
      return true;
    }
    applyEditResult(copyStageObject(stage, editClipboard, hoveredTile), "copy");
    return true;
  }

  if (event.shiftKey && (key === "ArrowUp" || key === "ArrowDown")) {
    event.preventDefault();
    if (!selectedPoint) {
      setMapStatus("Select a house, tree, warning sign, or billboard, then use Shift+Up/Down to cycle variants.", "error");
      return true;
    }
    const stage = parseStageMap(state.stageMap).stage;
    if (!stage) {
      setMapStatus("Map failed validation.", "error");
      return true;
    }
    applyEditResult(cycleStageObjectAsset(stage, selectedPoint, key === "ArrowUp" ? 1 : -1), "variant");
    return true;
  }

  if (key === "Escape") {
    event.preventDefault();
    clearEditSelection();
    setMapStatus("Cleared edit selection.", "neutral");
    return true;
  }

  return false;
}

interface ApplyMapTextOptions {
  preservePlayer?: boolean;
}

function applyMapText(mapText: string, persist: boolean, options: ApplyMapTextOptions = {}): void {
  const result = parseStageMap(mapText);
  elements.validation.value = result.ok ? validateStageMap(mapText) : result.errors.join("\n");
  if (!result.ok || !result.stage) {
    hideLaneHover();
    setMapStatus("Map failed validation.", "error");
    return;
  }
  const normalizedMap = result.stage.source;
  elements.stageMap.value = normalizedMap;
  state = applyStage(state, result.stage, normalizedMap, { preservePlayer: options.preservePlayer ?? false });
  clearEditSelection();
  if (persist) saveStageMap(normalizedMap);
  setMapStatus(options.preservePlayer ? "Applied Stage 1 map and kept the current edit position." : "Applied Stage 1 map.", "ok");
  updateUi();
}

function copyStageMap(): void {
  const result = parseStageMap(elements.stageMap.value);
  const mapText = result.ok && result.stage ? result.stage.source : elements.stageMap.value;
  elements.stageMap.value = mapText;
  copyText(mapText, result.ok ? "Copied normalized Stage 1 map." : "Copied Stage 1 map with validation errors.");
}

function updateUi(): void {
  elements.phase.textContent = phaseLabel(state.phase);
  if (cheatMode) elements.phase.textContent = "Cheat";
  elements.score.textContent = String(state.score);
  elements.best.textContent = String(state.bestScore);
  elements.pancakes.textContent = String(state.collectedPancakes.size);
  elements.clearOverlay.hidden = state.phase !== "complete";
  elements.crashOverlay.hidden = state.phase !== "crashed";
  updateOpeningTutorialVisuals();
  let nextDialogue: DialoguePanel | undefined = bootPhase === "dialogue"
    ? dialogueDirector.update(previousDialogueState, state, { editMode, cheatMode })
    : undefined;
  if (openingTutorialSuccessSwapping) {
    nextDialogue = undefined;
  } else if (openingTutorialSuccessVisible) {
    nextDialogue = {
      speaker: "A",
      speakerLabel: "MR. AWESOME",
      text: "Yummy~",
      tone: "success",
      eventType: "OPENING_TUTORIAL",
    };
  }
  if (!openingTutorialSuccessVisible && openingTutorialDismissed && nextDialogue?.eventType === "OPENING_TUTORIAL") nextDialogue = undefined;
  previousDialogueState = state;
  if (!nextDialogue) {
    elements.dialogueStrip.classList.add("is-dialogue-hidden");
    elements.dialogueStrip.setAttribute("aria-hidden", "true");
    elements.speaker.textContent = "";
    elements.message.textContent = "";
    elements.message.dataset.tone = "neutral";
    lastDialogueKey = "";
    return;
  }
  if (!applyDialogueSpeakerVisual(nextDialogue.speaker)) {
    if (!lastDialogueKey) {
      elements.dialogueStrip.classList.add("is-dialogue-hidden");
      elements.dialogueStrip.setAttribute("aria-hidden", "true");
    }
    return;
  }
  elements.dialogueStrip.classList.remove("is-dialogue-hidden");
  elements.dialogueStrip.removeAttribute("aria-hidden");
  elements.speaker.textContent = nextDialogue.speakerLabel;
  elements.message.dataset.tone = nextDialogue.tone;
  const nextDialogueKey = `${nextDialogue.speaker}:${nextDialogue.text}`;
  if (nextDialogueKey !== lastDialogueKey) {
    const isOpeningTutorialDialogue = nextDialogue.eventType === "OPENING_TUTORIAL";
    const suppressBootPressAnimation = nextDialogue.eventType === "OPENING_TUTORIAL"
      && openingTutorialAnimating
      && !openingTutorialSuccessVisible;
    elements.message.textContent = nextDialogue.text;
    elements.dialogueStrip.classList.remove("is-dialogue-entering");
    elements.message.classList.remove("is-message-entering");
    if (!suppressBootPressAnimation && !isOpeningTutorialDialogue) {
      void elements.dialogueStrip.offsetWidth;
      elements.dialogueStrip.classList.add("is-dialogue-entering");
      elements.message.classList.add("is-message-entering");
    } else if (!suppressBootPressAnimation && isOpeningTutorialDialogue && lastDialogueKey === "") {
      void elements.dialogueStrip.offsetWidth;
      elements.dialogueStrip.classList.add("is-dialogue-entering");
    }
    lastDialogueKey = nextDialogueKey;
  }
}

function updateOpeningTutorialVisuals(): void {
  const active = bootPhase !== "loading" && shouldShowOpeningTutorial();
  const finalConversationActive = !cheatMode && state.stage.mode === "finalSequence";
  const finalFadeActive = finalConversationActive
    && state.stage.finalFadeStartedAt !== undefined
    && state.time >= state.stage.finalFadeStartedAt;
  composition.classList.toggle("is-opening-tutorial", active);
  composition.classList.toggle("is-opening-assets", active && bootPhase === "assets");
  composition.classList.toggle(
    "is-opening-dialogue-message",
    active && bootPhase === "dialogue" && (!openingTutorialAnimating || openingTutorialSuccessVisible),
  );
  composition.classList.toggle("is-opening-tutorial-idle", active && !openingTutorialAnimating && state.time >= 3);
  composition.classList.toggle("is-opening-tutorial-exiting", active && openingTutorialAnimating);
  composition.classList.toggle("is-reveal-conversation-locked", !cheatMode && isRevealConversationActive(state));
  composition.classList.toggle("is-final-conversation", finalConversationActive);
  composition.classList.toggle("is-final-fading", finalFadeActive);
  composition.classList.toggle("is-credits-unlocked", creditsUnlockedThisSession);
  composition.classList.toggle("is-debug-controls-visible", debugControlsVisible);
  elements.statusStrip.hidden = !EDITOR_ENABLED || !debugControlsVisible;
  elements.bottomActions.hidden = !EDITOR_ENABLED || !debugControlsVisible;
}

function shouldShowOpeningTutorial(): boolean {
  const atStartTile = state.player.x === state.stage.playerStart.x
    && state.player.z === state.stage.playerStart.z
    && !state.player.hop;
  return !openingTutorialDismissed
    && !editMode
    && !cheatMode
    && state.stage.mode === "introPancakes"
    && (state.phase === "ready" || state.phase === "running")
    && state.collectedPancakes.size === 0
    && state.stage.firstPancakeAt === undefined
    && atStartTile;
}

function handleOpeningTutorialStart(): boolean {
  if (!shouldShowOpeningTutorial()) return false;
  if (openingTutorialAnimating) return true;
  warmOpeningTutorialAudio();
  const inputBeforeBootDialogue = bootPhase !== "dialogue" || lastDialogueKey === "";
  if (bootQuietTimer !== undefined) {
    window.clearTimeout(bootQuietTimer);
    bootQuietTimer = undefined;
  }
  if (inputBeforeBootDialogue) {
    bootPhase = "dialogue";
    bootReady = true;
  }
  openingTutorialAnimating = true;
  openingTutorialSuccessVisible = false;
  openingTutorialSuccessSwapping = inputBeforeBootDialogue;
  if (openingTutorialSfxTimer !== undefined) window.clearTimeout(openingTutorialSfxTimer);
  if (openingTutorialSwapTimer !== undefined) window.clearTimeout(openingTutorialSwapTimer);
  if (openingTutorialFinishTimer !== undefined) window.clearTimeout(openingTutorialFinishTimer);
  openingTutorialSfxTimer = window.setTimeout(() => {
    openingTutorialSfxTimer = undefined;
    sfx.playTutorialPickup();
    if (inputBeforeBootDialogue) {
      openingTutorialSuccessSwapping = false;
      openingTutorialSuccessVisible = true;
      previousDialogueState = undefined;
      lastDialogueKey = "";
      updateUi();
      return;
    }
    openingTutorialSuccessSwapping = false;
    openingTutorialSuccessVisible = true;
    previousDialogueState = undefined;
    updateUi();
  }, 900);
  updateUi();
  openingTutorialFinishTimer = window.setTimeout(() => {
    openingTutorialFinishTimer = undefined;
    openingTutorialDismissed = true;
    openingTutorialAnimating = false;
    openingTutorialSuccessVisible = false;
    openingTutorialSuccessSwapping = false;
    if (openingTutorialSwapTimer !== undefined) {
      window.clearTimeout(openingTutorialSwapTimer);
      openingTutorialSwapTimer = undefined;
    }
    previousDialogueState = undefined;
    lastDialogueKey = "";
    updateUi();
  }, 2700);
  return true;
}

function resetOpeningTutorial(): void {
  openingTutorialDismissed = false;
  openingTutorialAnimating = false;
  openingTutorialSuccessVisible = false;
  openingTutorialSuccessSwapping = false;
  if (openingTutorialSfxTimer !== undefined) {
    window.clearTimeout(openingTutorialSfxTimer);
    openingTutorialSfxTimer = undefined;
  }
  if (openingTutorialSwapTimer !== undefined) {
    window.clearTimeout(openingTutorialSwapTimer);
    openingTutorialSwapTimer = undefined;
  }
  if (openingTutorialFinishTimer !== undefined) {
    window.clearTimeout(openingTutorialFinishTimer);
    openingTutorialFinishTimer = undefined;
  }
}

function startBootReadiness(): void {
  const openingAssets = Array.from(document.querySelectorAll<HTMLImageElement>(".opening-tutorial-asset"))
    .map((image) => waitForImage(image));
  const fontReady = document.fonts?.ready ?? Promise.resolve();
  const revealAssets = () => {
    bootPhase = "assets";
    composition.classList.remove("is-booting");
    updateUi();
    warmAvatarAssetsSoon();
    if (bootQuietTimer !== undefined) window.clearTimeout(bootQuietTimer);
    const openingDelay = new Promise<void>((resolve) => {
      bootQuietTimer = window.setTimeout(() => {
        bootQuietTimer = undefined;
        resolve();
      }, 300);
    });
    Promise.allSettled([openingDelay, villainAvatar.preload(avatarOptionById("mr-awesome"))]).then(() => {
      bootQuietTimer = undefined;
      bootPhase = "dialogue";
      bootReady = true;
      previousDialogueState = undefined;
      lastDialogueKey = "";
      updateUi();
    });
  };
  Promise.allSettled([...openingAssets, fontReady])
    .then(revealAssets)
    .catch(revealAssets);
}

function warmAvatarAssetsSoon(): void {
  if (avatarWarmStarted) return;
  avatarWarmStarted = true;
  const warm = () => {
    for (const option of AVATAR_CHARACTER_OPTIONS) {
      void villainAvatar.preload(option);
    }
  };
  const requestIdle = (window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
  }).requestIdleCallback;
  if (requestIdle) {
    requestIdle(warm, { timeout: 1400 });
    return;
  }
  globalThis.setTimeout(warm, 250);
}

function waitForImage(image: HTMLImageElement): Promise<void> {
  if (image.complete && image.naturalWidth > 0) return Promise.resolve();
  return new Promise((resolve) => {
    image.addEventListener("load", () => resolve(), { once: true });
    image.addEventListener("error", () => resolve(), { once: true });
  });
}

function readStoredStageMap(): string {
  return window.localStorage.getItem(STAGE_MAP_STORAGE_KEY) ?? baselineStageMap();
}

function saveStageMap(mapText: string): void {
  window.localStorage.setItem(STAGE_MAP_STORAGE_KEY, mapText);
}

function setMapStatus(message: string, tone: "ok" | "error" | "neutral"): void {
  elements.mapStatus.textContent = message;
  elements.mapStatus.dataset.tone = tone;
}

function applyEditResult(result: MoveStageObjectResult, action: "move" | "copy" | "variant"): void {
  if (result.ok && result.stage && result.mapText) {
    hideLaneHover();
    elements.stageMap.value = result.mapText;
    state = applyStage(state, result.stage, result.mapText, { preservePlayer: editMode });
    saveStageMap(result.mapText);
    selectedObject = result.object ? cloneObject(result.object) : undefined;
    selectedPoint = selectedObject ? { x: selectedObject.x, z: selectedObject.z } : undefined;
    editSelection = selectedObject ? selectionForObject(selectedObject, action === "copy") : undefined;
    setMapStatus(result.message, "ok");
    return;
  }
  hideLaneHover();
  if (selectedObject) editSelection = selectionForObject(selectedObject);
  setMapStatus(result.message, "error");
}

function selectionForObject(object: StagePlacedObject, copy = false): RenderEditSelection {
  return {
    x: object.x,
    z: object.z,
    kind: object.kind,
    cells: object.cells.map((cell) => ({ ...cell })),
    copy,
  };
}

function shiftedAnchor(object: StagePlacedObject, grabbed: GridPoint, to: GridPoint): GridPoint {
  return {
    x: object.x + to.x - grabbed.x,
    z: object.z + to.z - grabbed.z,
  };
}

function shiftedCells(object: StagePlacedObject, grabbed: GridPoint, to: GridPoint): GridPoint[] {
  const dx = to.x - grabbed.x;
  const dz = to.z - grabbed.z;
  return object.cells.map((cell) => ({ x: cell.x + dx, z: cell.z + dz }));
}

function clearEditSelection(): void {
  editSelection = undefined;
  selectedObject = undefined;
  selectedPoint = undefined;
  hoveredTile = undefined;
  hideLaneHover();
}

function applySelectedLaneEdit(): void {
  if (selectedLaneZ === undefined) {
    setMapStatus("Click an empty lane tile before applying lane edits.", "error");
    return;
  }
  const editedLine = elements.laneHoverText.value.trim();
  const expectedPrefix = `z=${String(selectedLaneZ).padStart(2, "0")} `;
  if (!editedLine.startsWith(expectedPrefix)) {
    setMapStatus(`Keep the selected lane as ${expectedPrefix.trim()} and edit only its design/tuning.`, "error");
    return;
  }
  const currentMap = elements.stageMap.value;
  const lines = currentMap.split("\n");
  const lineIndex = lines.findIndex((line) => line.startsWith(expectedPrefix));
  if (lineIndex < 0) {
    setMapStatus(`Could not find ${expectedPrefix.trim()} in the Stage Map Textbox.`, "error");
    return;
  }
  lines[lineIndex] = editedLine;
  const nextMap = lines.join("\n");
  const result = parseStageMap(nextMap);
  elements.validation.value = result.ok ? validateStageMap(nextMap) : result.errors.join("\n");
  if (!result.ok || !result.stage) {
    setMapStatus("Lane edit failed validation.", "error");
    return;
  }
  const normalizedMap = result.stage.source;
  elements.stageMap.value = normalizedMap;
  state = applyStage(state, result.stage, normalizedMap, { preservePlayer: editMode });
  saveStageMap(normalizedMap);
  hoveredLaneLine = serializedLaneLine(result.stage, selectedLaneZ);
  elements.laneHoverCode.textContent = hoveredLaneLine;
  elements.laneHoverText.value = hoveredLaneLine;
  setLanePopupEditing(false);
  setMapStatus(`Applied ${expectedPrefix.trim()}.`, "ok");
  updateUi();
}

function showLaneCard(event: PointerEvent): void {
  if (!editMode || dragStart) {
    hideLaneHover();
    return;
  }
  const tile = renderer.getTileFromPointer(event);
  const stage = parseStageMap(state.stageMap).stage;
  if (!tile || !stage || objectAt(stage, tile)) {
    hideLaneHover();
    return;
  }
  const line = serializedLaneLine(stage, tile.z);
  if (!line) {
    hideLaneHover();
    return;
  }
  hoveredLaneLine = line;
  selectedLaneZ = tile.z;
  elements.laneHoverCode.textContent = line;
  elements.laneHoverText.value = line;
  setLanePopupEditing(false);
  elements.laneHover.hidden = false;
  const rect = gameView.getBoundingClientRect();
  const cardRect = elements.laneHover.getBoundingClientRect();
  const drawerRect = elements.mapDrawer.hasAttribute("hidden") ? undefined : elements.mapDrawer.getBoundingClientRect();
  const drawerOverlapsBoard = drawerRect
    && drawerRect.left < rect.right
    && drawerRect.right > rect.left
    && drawerRect.top < rect.bottom
    && drawerRect.bottom > rect.top;
  const maxLeft = drawerOverlapsBoard
    ? Math.max(8, drawerRect.left - rect.left - cardRect.width - 8)
    : rect.width - cardRect.width - 8;
  const left = clampNumber(event.clientX - rect.left + 14, 8, maxLeft);
  const top = clampNumber(event.clientY - rect.top - cardRect.height - 12, 8, rect.height - cardRect.height - 8);
  elements.laneHover.style.left = `${left}px`;
  elements.laneHover.style.top = `${top}px`;
}

function hideLaneHover(): void {
  hoveredLaneLine = "";
  selectedLaneZ = undefined;
  setLanePopupEditing(false);
  elements.laneHover.hidden = true;
}

function setLanePopupEditing(editing: boolean): void {
  elements.laneHover.dataset.editing = String(editing);
  elements.laneHoverCode.hidden = editing;
  elements.laneHoverText.hidden = !editing;
  elements.laneHoverEdit.hidden = editing;
  elements.laneHoverApply.hidden = !editing;
  elements.laneHoverCancel.hidden = !editing;
  if (editing) {
    elements.laneHoverText.value = hoveredLaneLine;
    elements.laneHoverText.focus();
    elements.laneHoverText.select();
  }
}

function serializedLaneLine(stage: StageDefinition, z: number): string {
  return serializeStageLane(stage, z);
}

function cloneObject(object: StagePlacedObject): StagePlacedObject {
  return {
    ...object,
    cells: object.cells.map((cell) => ({ ...cell })),
  };
}

function copyText(text: string, message: string): void {
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(text).then(
      () => setMapStatus(message, "ok"),
      () => fallbackCopyText(text, message),
    );
    return;
  }
  fallbackCopyText(text, message);
}

function fallbackCopyText(text: string, message: string): void {
  const scratch = document.createElement("textarea");
  scratch.value = text;
  scratch.setAttribute("readonly", "true");
  scratch.style.position = "fixed";
  scratch.style.left = "-9999px";
  scratch.style.top = "0";
  document.body.appendChild(scratch);
  scratch.select();
  const copied = document.execCommand("copy");
  scratch.remove();
  if (copied) {
    setMapStatus(message, "ok");
    return;
  }
  elements.validation.value = text;
  elements.validation.select();
  setMapStatus("Clipboard blocked; requested text selected below.", "error");
}

function requireElement<T extends HTMLElement = HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required DOM element: ${selector}`);
  return element;
}

function isLocalEditorUrl(): boolean {
  const host = window.location.hostname;
  return (host === "localhost" || host === "127.0.0.1" || host === "::1") && new URLSearchParams(window.location.search).get("editor") === "1";
}

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}
