import "./styles.css";
import { applyAction, applyStage, createInitialState, phaseLabel, tickGame } from "./game/simulation";
import { baselineStageMap, copyStageObject, cycleStageObjectAsset, exportStageFeedback, moveStageObject, objectAt, parseStageMap, validateStageMap } from "./game/stageMap";
import type { GameAction, GameState, GridPoint, MoveAction, MoveStageObjectResult, StagePlacedObject } from "./game/types";
import { CAMERA_PRESET_OPTIONS, DEFAULT_CAMERA_PRESET, DEFAULT_CAMERA_ZOOM_PERCENT, ThreeStageRenderer, type CameraPresetId, type RenderEditSelection } from "./render/ThreeStageRenderer";
import { VillainAvatarRenderer, type AvatarModelDefinition } from "./render/VillainAvatarRenderer";

const STAGE_MAP_STORAGE_KEY = "awesome-superhero.stage1-map.v7";
const CONTROL_STYLE_STORAGE_KEY = "awesome-superhero.control-style.v3";
const BACKGROUND_THEME_STORAGE_KEY = "awesome-superhero.background-theme.v2";
const BORDER_STYLE_STORAGE_KEY = "awesome-superhero.border-style.v2";
const DIALOGUE_PANEL_STORAGE_KEY = "awesome-superhero.dialogue-panel.v2";
const AVATAR_CHARACTER_STORAGE_KEY = "awesome-superhero.avatar-character.v2";
const AVATAR_FRAMING_STORAGE_KEY = "awesome-superhero.avatar-framing.v1";
const AVATAR_BACKGROUND_STORAGE_KEY = "awesome-superhero.avatar-background.v2";
const BUILD_ID = "2026-06-02-stage1-first-pass";
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
const DEFAULT_CONTROL_STYLE: ControlStyleId = "stone-mint";
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
const composition = requireElement("#game-composition");
const avatarBox = requireElement("[data-villain-avatar]");
avatarBox.dataset.avatarPortrait = storedAvatarState.characterId;
const renderer = new ThreeStageRenderer(gameView);
const villainAvatar = new VillainAvatarRenderer(avatarBox, avatarOptionById(storedAvatarState.characterId));
const resizeObserver = new ResizeObserver(() => renderer.resize());
resizeObserver.observe(gameView);

let state = createInitialState(readStoredStageMap());
let editMode = false;
let editSelection: RenderEditSelection | undefined;
let selectedObject: StagePlacedObject | undefined;
let selectedPoint: GridPoint | undefined;
let hoveredTile: GridPoint | undefined;
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
let lastDialogueMessage = "";

const elements = {
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
  avatarDrag: requireElement<HTMLButtonElement>("[data-avatar-drag]"),
  controlStyle: requireElement<HTMLSelectElement>("[data-control-style]"),
  backgroundTheme: requireElement<HTMLSelectElement>("[data-background-theme]"),
  borderStyle: requireElement<HTMLSelectElement>("[data-border-style]"),
  dialoguePanel: requireElement<HTMLSelectElement>("[data-dialogue-panel]"),
  gameplayZoomGuide: requireElement("[data-gameplay-zoom-guide]"),
};

elements.stageMap.value = state.stageMap;
populateCameraControls();
bindButtons();
bindKeyboard();
bindPointer();
updateUi();
requestAnimationFrame(frame);

window.addEventListener("beforeunload", () => {
  resizeObserver.disconnect();
  renderer.dispose();
  villainAvatar.dispose();
});

function frame(now: number): void {
  const deltaSeconds = Math.min(0.05, (now - previousTime) / 1000);
  previousTime = now;
  state = tickGame(state, deltaSeconds, { hazardsEnabled: !editMode, stageCompletionEnabled: !editMode });
  renderer.render(state, deltaSeconds, editSelection);
  updateUi();
  requestAnimationFrame(frame);
}

function bindButtons(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action as GameAction | undefined;
      if (!action) return;
      state = applyAction(state, action);
      if (action === "restart") clearEditSelection();
      updateUi();
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-move]").forEach((button) => {
    button.addEventListener("click", () => {
      const move = button.dataset.move as MoveAction | undefined;
      if (!move) return;
      state = applyAction(state, move, { allowMoveFromTerminal: editMode });
      updateUi();
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-toggle-map]").forEach((button) => {
    button.addEventListener("click", () => {
      const hidden = elements.mapDrawer.hasAttribute("hidden");
      elements.mapDrawer.toggleAttribute("hidden", !hidden);
    });
  });

  requireElement<HTMLButtonElement>("[data-stage-apply]").addEventListener("click", () => {
    applyMapText(elements.stageMap.value, true);
  });

  requireElement<HTMLButtonElement>("[data-stage-copy]").addEventListener("click", () => {
    copyText(elements.stageMap.value, "Copied Stage 1 map.");
  });

  requireElement<HTMLButtonElement>("[data-stage-reset]").addEventListener("click", () => {
    elements.stageMap.value = baselineStageMap();
    applyMapText(elements.stageMap.value, true);
    elements.validation.value = "Reset Stage 1 to v83 dirt-path test map.";
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

function applyAvatarBackground(value: string): void {
  const background = isAvatarBackgroundId(value) ? value : DEFAULT_AVATAR_BACKGROUND;
  elements.avatarBackground.value = background;
  avatarBox.dataset.avatarBackground = background;
  window.localStorage.setItem(AVATAR_BACKGROUND_STORAGE_KEY, background);
}

function readAvatarBackground(): AvatarBackgroundId {
  const stored = window.localStorage.getItem(AVATAR_BACKGROUND_STORAGE_KEY);
  return isAvatarBackgroundId(stored) ? stored : DEFAULT_AVATAR_BACKGROUND;
}

function isAvatarBackgroundId(value: unknown): value is AvatarBackgroundId {
  return typeof value === "string" && AVATAR_BACKGROUND_OPTIONS.some((option) => option.id === value);
}

function applyAvatarCharacter(value: string): void {
  saveCurrentAvatarFraming();
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
  persistAvatarState();
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
    if (event.repeat || isTypingTarget(event.target)) return;
    if (editMode && handleEditKey(event)) return;
    const mapped = keyMap.get(event.key);
    if (!mapped) return;
    event.preventDefault();
    if (mapped === "toggleMap") {
      elements.mapDrawer.toggleAttribute("hidden");
      return;
    }
    state = applyAction(state, mapped, { allowMoveFromTerminal: editMode });
    updateUi();
  }, { capture: true });
}

function bindPointer(): void {
  gameView.addEventListener("pointerdown", (event) => {
    if (editMode) {
      const tile = renderer.getTileFromPointer(event);
      const stage = parseStageMap(state.stageMap).stage;
      const object = tile && stage ? objectAt(stage, tile) : undefined;
      hoveredTile = tile;
      if (tile && object) {
        selectedObject = object;
        selectedPoint = tile;
        dragStart = { ...tile, object, copy: event.altKey };
        editSelection = selectionForObject(object, event.altKey);
        gameView.setPointerCapture(event.pointerId);
        event.preventDefault();
        return;
      }
      clearEditSelection();
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
      event.preventDefault();
      return;
    }

    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = undefined;
    const threshold = 26;
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
      state = applyAction(state, "forward");
    } else if (Math.abs(dx) > Math.abs(dy)) {
      state = applyAction(state, dx < 0 ? "left" : "right");
    } else {
      state = applyAction(state, dy < 0 ? "forward" : "backward");
    }
    updateUi();
  });

  gameView.addEventListener("pointercancel", () => {
    pointerStart = undefined;
    dragStart = undefined;
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
      setMapStatus("Select a house or tree, then use Shift+Up/Down to cycle variants.", "error");
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

function applyMapText(mapText: string, persist: boolean): void {
  const result = parseStageMap(mapText);
  elements.validation.value = result.ok ? validateStageMap(mapText) : result.errors.join("\n");
  if (!result.ok || !result.stage) {
    setMapStatus("Map failed validation.", "error");
    return;
  }
  state = applyStage(state, result.stage, mapText);
  clearEditSelection();
  if (persist) saveStageMap(mapText);
  setMapStatus("Applied Stage 1 map.", "ok");
  updateUi();
}

function updateUi(): void {
  elements.phase.textContent = phaseLabel(state.phase);
  elements.score.textContent = String(state.score);
  elements.best.textContent = String(state.bestScore);
  elements.pancakes.textContent = String(state.collectedPancakes.size);
  elements.clearOverlay.hidden = state.phase !== "complete";
  elements.crashOverlay.hidden = state.phase !== "crashed";
  elements.message.dataset.tone = dialogueToneForState(state);
  const nextMessage = messageForState(state);
  if (nextMessage !== lastDialogueMessage) {
    elements.message.textContent = nextMessage;
    elements.message.classList.remove("is-message-entering");
    void elements.message.offsetWidth;
    elements.message.classList.add("is-message-entering");
    lastDialogueMessage = nextMessage;
  }
}

function messageForState(nextState: GameState): string {
  if (nextState.phase === "complete") return "Mr. Not So Awesome is temporarily impressed.";
  if (nextState.phase === "crashed") return nextState.crashReason ? `Ouch: ${nextState.crashReason}.` : "That was less awesome.";
  if (editMode) return "Edit Mode";
  return "Mr. Not So Awesome is waiting.";
}

function dialogueToneForState(nextState: GameState): "neutral" | "instruction" | "success" | "danger" {
  if (nextState.phase === "complete") return "success";
  if (nextState.phase === "crashed") return "danger";
  if (editMode) return "instruction";
  return "neutral";
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
    elements.stageMap.value = result.mapText;
    state = applyStage(state, result.stage, result.mapText);
    saveStageMap(result.mapText);
    selectedObject = result.object ? cloneObject(result.object) : undefined;
    selectedPoint = selectedObject ? { x: selectedObject.x, z: selectedObject.z } : undefined;
    editSelection = selectedObject ? selectionForObject(selectedObject, action === "copy") : undefined;
    setMapStatus(result.message, "ok");
    return;
  }
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
