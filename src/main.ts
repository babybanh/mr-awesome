import "./styles.css";
import { applyAction, applyStage, createInitialState, enterCheatMode, phaseLabel, tickGame } from "./game/simulation";
import { baselineStageMap, copyStageObject, cycleStageObjectAsset, exportStageFeedback, moveStageObject, objectAt, parseStageMap, serializeStageLane, validateStageMap } from "./game/stageMap";
import type { GameAction, GameState, GridPoint, MoveAction, MoveStageObjectResult, StageDefinition, StagePlacedObject } from "./game/types";
import { DialogueDirector } from "./game/dialogue";
import { MusicManager } from "./game/MusicManager";
import { SfxManager } from "./game/SfxManager";
import { CAMERA_PRESET_OPTIONS, DEFAULT_CAMERA_PRESET, DEFAULT_CAMERA_ZOOM_PERCENT, ThreeStageRenderer, type CameraPresetId, type RenderEditSelection } from "./render/ThreeStageRenderer";
import { VillainAvatarRenderer, type AvatarModelDefinition } from "./render/VillainAvatarRenderer";

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
const AVATAR_CHARACTER_OPTIONS = [
  {
    id: "mr-not-so-awesome",
    label: "Mr. Not So Awesome",
    path: "/assets/characters/MrNotSoAwesomeTexturedBright.glb",
  },
  {
    id: "mr-awesome",
    label: "Mr. Awesome",
    path: "/assets/characters/TexturedMeshBright.glb",
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

const AVATAR_VERTICAL_LIMITS: Record<AvatarCharacterId, { min: number; max: number }> = {
  "mr-not-so-awesome": { min: -60, max: 42 },
  "mr-awesome": { min: -80, max: 80 },
};
const AVATAR_ZOOM_MIN = 75;
const AVATAR_ZOOM_MAX = 160;
const AVATAR_ZOOM_DEFAULT = 100;
const DEFAULT_AVATAR_FRAMING: Record<AvatarCharacterId, AvatarFraming> = {
  "mr-not-so-awesome": { verticalPercent: -48, zoomPercent: AVATAR_ZOOM_DEFAULT },
  "mr-awesome": { verticalPercent: 0, zoomPercent: AVATAR_ZOOM_DEFAULT },
};
const storedAvatarState = readStoredAvatarState();

const gameView = requireElement("#game-view");
const gameBoard = requireElement("#game-board");
const composition = requireElement("#game-composition");
const avatarBox = requireElement("[data-villain-avatar]");
avatarBox.dataset.avatarPortrait = storedAvatarState.characterId;
const renderer = new ThreeStageRenderer(gameView);
const villainAvatar = new VillainAvatarRenderer(avatarBox, avatarOptionById(storedAvatarState.characterId));
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
let avatarVerticalPercent = storedAvatarState.framing[avatarCharacterId].verticalPercent;
let avatarZoomPercent = storedAvatarState.framing[avatarCharacterId].zoomPercent;
const avatarFramingByCharacter = new Map<AvatarCharacterId, AvatarFraming>(
  AVATAR_CHARACTER_OPTIONS.map((option) => [option.id, { ...storedAvatarState.framing[option.id] }]),
);
let avatarDragStart:
  | {
      y: number;
      verticalPercent: number;
      target: HTMLElement;
      pointerId: number;
    }
  | undefined;
let previousTime = performance.now();
let previousDialogueState: GameState | undefined;
let lastDialogueKey = "";
let musicEnabled = readStoredMusicEnabled();
let openingTutorialDismissed = false;
let openingTutorialAnimating = false;
let debugControlsVisible = false;
let observedRunId = state.runId;

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
  musicToggle: requireElement<HTMLButtonElement>("[data-music-toggle]"),
};

music.setEnabled(musicEnabled);
sfx.setEnabled(musicEnabled);
elements.stageMap.value = state.stageMap;
populateCredits();
populateCameraControls();
updateMusicToggle();
bindButtons();
bindKeyboard();
bindPointer();
updateUi();
requestAnimationFrame(frame);

window.addEventListener("beforeunload", () => {
  resizeObserver.disconnect();
  music.dispose();
  sfx.dispose();
  renderer.dispose();
  villainAvatar.dispose();
});

function frame(now: number): void {
  const deltaSeconds = Math.min(0.05, (now - previousTime) / 1000);
  previousTime = now;
  const previousState = state;
  state = tickGame(state, deltaSeconds, { hazardsEnabled: !editMode && !cheatMode, stageCompletionEnabled: !editMode, cheatMode });
  if (state.runId !== observedRunId) {
    observedRunId = state.runId;
    resetOpeningTutorial();
    previousDialogueState = undefined;
    lastDialogueKey = "";
  }
  sfx.sync(previousState, state, { cheatMode });
  music.sync(state, { cheatMode });
  renderer.render(state, deltaSeconds, editSelection, { useStageCamera: !editMode });
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

function openCreditsModal(): void {
  elements.creditsModal.hidden = false;
  composition.classList.add("is-credits-open");
  elements.creditsClose.focus();
}

function closeCreditsModal(): void {
  elements.creditsModal.hidden = true;
  composition.classList.remove("is-credits-open");
  elements.creditsOpen.focus();
}

function bindButtons(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
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
    button.addEventListener("click", () => {
      unlockMusic();
      const move = button.dataset.move as MoveAction | undefined;
      if (!move) return;
      if (handleOpeningTutorialStart()) return;
      state = applyAction(state, move, { allowMoveFromTerminal: editMode || cheatMode, cheatMode });
      syncMusicNow();
      updateUi();
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-toggle-map]").forEach((button) => {
    button.addEventListener("click", () => {
      const hidden = elements.mapDrawer.hasAttribute("hidden");
      elements.mapDrawer.toggleAttribute("hidden", !hidden);
    });
  });

  elements.creditsOpen.addEventListener("click", openCreditsModal);

  elements.creditsClose.addEventListener("click", closeCreditsModal);

  elements.creditsModal.addEventListener("click", (event) => {
    if (event.target !== elements.creditsModal) return;
    closeCreditsModal();
  });

  elements.musicToggle.addEventListener("click", () => {
    musicEnabled = !musicEnabled;
    window.localStorage.setItem(MUSIC_ENABLED_STORAGE_KEY, String(musicEnabled));
    if (musicEnabled) unlockMusic();
    music.setEnabled(musicEnabled);
    sfx.setEnabled(musicEnabled);
    syncMusicNow();
    updateMusicToggle();
  });

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

function applyAvatarCharacter(value: string, options: { persist?: boolean } = {}): void {
  const shouldPersist = options.persist ?? true;
  if (shouldPersist) {
    saveCurrentAvatarFraming();
  } else {
    avatarFramingByCharacter.set(avatarCharacterId, {
      verticalPercent: avatarVerticalPercent,
      zoomPercent: avatarZoomPercent,
    });
  }
  const nextCharacter = isAvatarCharacterId(value) ? value : DEFAULT_AVATAR_CHARACTER;
  const option = avatarOptionById(nextCharacter);
  avatarCharacterId = nextCharacter;
  elements.avatarCharacter.value = nextCharacter;
  elements.speaker.textContent = option.label;
  avatarBox.dataset.avatarPortrait = nextCharacter;
  const savedFraming = avatarFramingByCharacter.get(nextCharacter) ?? { verticalPercent: 0, zoomPercent: AVATAR_ZOOM_DEFAULT };
  avatarVerticalPercent = savedFraming.verticalPercent;
  avatarZoomPercent = savedFraming.zoomPercent;
  avatarBox.querySelector("span")?.replaceChildren(document.createTextNode(nextCharacter === "mr-awesome" ? "A" : "N"));
  villainAvatar.setModel(option);
  updateAvatarFraming();
  if (shouldPersist) persistAvatarState();
}

function applyDialogueSpeakerVisual(speaker: "A" | "B"): void {
  const nextCharacter: AvatarCharacterId = speaker === "A" ? "mr-awesome" : "mr-not-so-awesome";
  const nextBackground: AvatarBackgroundId = speaker === "A" ? "sky" : "mint";
  if (avatarCharacterId !== nextCharacter) applyAvatarCharacter(nextCharacter, { persist: false });
  applyAvatarBackground(nextBackground, { persist: false });
}

function saveCurrentAvatarFraming(): void {
  avatarFramingByCharacter.set(avatarCharacterId, {
    verticalPercent: avatarVerticalPercent,
    zoomPercent: avatarZoomPercent,
  });
  persistAvatarState();
}

function readStoredAvatarState(): { characterId: AvatarCharacterId; framing: Record<AvatarCharacterId, AvatarFraming> } {
  const characterId = isAvatarCharacterId(window.localStorage.getItem(AVATAR_CHARACTER_STORAGE_KEY))
    ? window.localStorage.getItem(AVATAR_CHARACTER_STORAGE_KEY) as AvatarCharacterId
    : DEFAULT_AVATAR_CHARACTER;
  const framing: Record<AvatarCharacterId, AvatarFraming> = {
    "mr-not-so-awesome": { ...DEFAULT_AVATAR_FRAMING["mr-not-so-awesome"] },
    "mr-awesome": { ...DEFAULT_AVATAR_FRAMING["mr-awesome"] },
  };

  try {
    const parsed = JSON.parse(window.localStorage.getItem(AVATAR_FRAMING_STORAGE_KEY) ?? "{}") as Partial<Record<AvatarCharacterId, Partial<AvatarFraming>>>;
    for (const option of AVATAR_CHARACTER_OPTIONS) {
      const saved = parsed[option.id];
      if (!saved) continue;
      const limits = AVATAR_VERTICAL_LIMITS[option.id];
      framing[option.id] = {
        verticalPercent: clampNumber(Number(saved.verticalPercent), limits.min, limits.max),
        zoomPercent: clampNumber(Number(saved.zoomPercent), AVATAR_ZOOM_MIN, AVATAR_ZOOM_MAX),
      };
    }
  } catch {
    // Ignore malformed saved avatar framing and fall back to defaults.
  }

  return { characterId, framing };
}

function persistAvatarState(): void {
  const framing: Record<AvatarCharacterId, AvatarFraming> = {
    "mr-not-so-awesome": avatarFramingByCharacter.get("mr-not-so-awesome") ?? { ...DEFAULT_AVATAR_FRAMING["mr-not-so-awesome"] },
    "mr-awesome": avatarFramingByCharacter.get("mr-awesome") ?? { ...DEFAULT_AVATAR_FRAMING["mr-awesome"] },
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
  villainAvatar.setFraming({
    verticalOffsetPercent: avatarVerticalPercent,
    zoomPercent: avatarZoomPercent,
  });
}

function beginAvatarVerticalDrag(event: PointerEvent): void {
  if (!editMode) return;
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement)) return;
  avatarDragStart = {
    y: event.clientY,
    verticalPercent: avatarVerticalPercent,
    target,
    pointerId: event.pointerId,
  };
  target.setPointerCapture?.(event.pointerId);
  document.body.classList.add("is-avatar-dragging");
  window.addEventListener("pointermove", handleAvatarVerticalDrag, { passive: false });
  window.addEventListener("pointerup", endAvatarVerticalDrag, { once: true });
  window.addEventListener("pointercancel", endAvatarVerticalDrag, { once: true });
  event.preventDefault();
}

function handleAvatarVerticalDrag(event: PointerEvent): void {
  if (!avatarDragStart) return;
  const deltaY = event.clientY - avatarDragStart.y;
  const verticalLimits = AVATAR_VERTICAL_LIMITS[avatarCharacterId];
  avatarVerticalPercent = clampNumber(avatarDragStart.verticalPercent - deltaY * 0.55, verticalLimits.min, verticalLimits.max);
  updateAvatarFraming();
  event.preventDefault();
}

function endAvatarVerticalDrag(): void {
  if (avatarDragStart) avatarDragStart.target.releasePointerCapture?.(avatarDragStart.pointerId);
  saveCurrentAvatarFraming();
  avatarDragStart = undefined;
  document.body.classList.remove("is-avatar-dragging");
  window.removeEventListener("pointermove", handleAvatarVerticalDrag);
  window.removeEventListener("pointerup", endAvatarVerticalDrag);
  window.removeEventListener("pointercancel", endAvatarVerticalDrag);
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
    if (event.key === "Tab" && !isTypingTarget(event.target)) {
      event.preventDefault();
      debugControlsVisible = !debugControlsVisible;
      updateUi();
      return;
    }
    if (event.repeat || isTypingTarget(event.target)) return;
    unlockMusic();
    if (event.key === "CapsLock") {
      event.preventDefault();
      cheatMode = !cheatMode;
      if (cheatMode) state = enterCheatMode(state);
      syncMusicNow();
      setMapStatus(cheatMode ? "Cheat Mode on. Hazards are disabled." : "Cheat Mode off.", cheatMode ? "ok" : "neutral");
      updateUi();
      return;
    }
    if (editMode && handleEditKey(event)) return;
    const mapped = keyMap.get(event.key);
    if (!mapped) return;
    event.preventDefault();
    if (mapped !== "toggleMap" && handleOpeningTutorialStart()) return;
    if (mapped === "toggleMap") {
      elements.mapDrawer.toggleAttribute("hidden");
      return;
    }
    state = applyAction(state, mapped, { allowMoveFromTerminal: editMode || cheatMode, cheatMode });
    syncMusicNow();
    updateUi();
  }, { capture: true });
}

function bindPointer(): void {
  gameView.addEventListener("pointerdown", (event) => {
    unlockMusic();
    if (editMode) {
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
    if (!editMode) return;
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
    if (editMode && dragStart) {
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
  let nextDialogue = dialogueDirector.update(previousDialogueState, state, { editMode, cheatMode });
  if ((openingTutorialDismissed || openingTutorialAnimating) && nextDialogue?.eventType === "OPENING_TUTORIAL") nextDialogue = undefined;
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
  elements.dialogueStrip.classList.remove("is-dialogue-hidden");
  elements.dialogueStrip.removeAttribute("aria-hidden");
  applyDialogueSpeakerVisual(nextDialogue.speaker);
  elements.speaker.textContent = nextDialogue.speakerLabel;
  elements.message.dataset.tone = nextDialogue.tone;
  const nextDialogueKey = `${nextDialogue.speaker}:${nextDialogue.text}`;
  if (nextDialogueKey !== lastDialogueKey) {
    elements.message.textContent = nextDialogue.text;
    elements.dialogueStrip.classList.remove("is-dialogue-entering");
    elements.message.classList.remove("is-message-entering");
    void elements.dialogueStrip.offsetWidth;
    elements.dialogueStrip.classList.add("is-dialogue-entering");
    elements.message.classList.add("is-message-entering");
    sfx.playDialogueBlip(nextDialogue.speaker, state.time);
    lastDialogueKey = nextDialogueKey;
  }
}

function updateOpeningTutorialVisuals(): void {
  const active = shouldShowOpeningTutorial();
  composition.classList.toggle("is-opening-tutorial", active);
  composition.classList.toggle("is-opening-tutorial-idle", active && !openingTutorialAnimating && state.time >= 3);
  composition.classList.toggle("is-opening-tutorial-exiting", active && openingTutorialAnimating);
  composition.classList.toggle("is-debug-controls-visible", debugControlsVisible);
  elements.statusStrip.hidden = !debugControlsVisible;
  elements.bottomActions.hidden = !debugControlsVisible;
}

function shouldShowOpeningTutorial(): boolean {
  if (!editMode && !cheatMode && state.stage.mode === "postVictoryTutorial") return true;
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
  if (state.stage.mode === "postVictoryTutorial") {
    state = createInitialState(state.stageMap, state.runId + 1, Math.max(state.bestScore, state.score));
    resetOpeningTutorial();
    previousDialogueState = undefined;
    lastDialogueKey = "";
    updateUi();
    return true;
  }
  if (openingTutorialAnimating) return true;
  openingTutorialAnimating = true;
  updateUi();
  window.setTimeout(() => {
    openingTutorialDismissed = true;
    openingTutorialAnimating = false;
    updateUi();
  }, 1360);
  return true;
}

function resetOpeningTutorial(): void {
  openingTutorialDismissed = false;
  openingTutorialAnimating = false;
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
