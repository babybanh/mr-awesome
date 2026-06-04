import "./styles.css";
import { applyAction, createInitialState, phaseLabel, tickGame } from "./game/simulation";
import { baselineStageMap } from "./game/stageMap";
import type { GameAction, GameState, MoveAction } from "./game/types";
import { DialogueDirector, type DialoguePanel } from "./game/dialogue";
import { MusicManager } from "./game/MusicManager";
import { SfxManager } from "./game/SfxManager";
import { ThreeStageRenderer } from "./render/ThreeStageRenderer";
import { VillainAvatarRenderer, type AvatarModelDefinition } from "./render/VillainAvatarRenderer";

const MUSIC_ENABLED_STORAGE_KEY = "awesome-superhero.music-enabled.v1";
const CREDITS_CONFIG = {
  studentName: "Adam",
  studentVideoUrl: "https://youtu.be/IJtiQkQ0VVA?si=8ISjm8fkp9JLNmDm",
  contestName: "Piano Inspires Kids Composition Contest",
  contestPlaylistUrl: "https://youtube.com/playlist?list=PLhhleIn9mEjhNAztK55u86m13lu6xpqoM&si=Ck8ZBYlCjm1Crp4G",
  contestMagazineUrl: "https://kids.pianoinspires.com/magazine/",
  developerName: "Le Binh Anh Nguyen",
  developerUrl: "https://www.coastal.edu/academics/facultyprofiles/humanities/music/lebinhanhnguyen/",
} as const;
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
type AvatarCharacterId = (typeof AVATAR_CHARACTER_OPTIONS)[number]["id"];
const DEFAULT_AVATAR_CHARACTER: AvatarCharacterId = "mr-not-so-awesome";
const DEFAULT_AVATAR_FRAMING: Record<AvatarCharacterId, { verticalOffsetPercent: number; zoomPercent: number }> = {
  "mr-not-so-awesome": { verticalOffsetPercent: -48, zoomPercent: 100 },
  "mr-awesome": { verticalOffsetPercent: 0, zoomPercent: 100 },
};

const gameView = requireElement("#game-view");
const gameBoard = requireElement("#game-board");
const composition = requireElement("#game-composition");
const avatarBox = requireElement("[data-villain-avatar]");
avatarBox.dataset.avatarPortrait = DEFAULT_AVATAR_CHARACTER;
avatarBox.dataset.avatarBackground = "mint";

const renderer = new ThreeStageRenderer(gameView);
const villainAvatar = new VillainAvatarRenderer(avatarBox, avatarOptionById(DEFAULT_AVATAR_CHARACTER));
villainAvatar.setFraming(DEFAULT_AVATAR_FRAMING[DEFAULT_AVATAR_CHARACTER]);
villainAvatar.preload(AVATAR_CHARACTER_OPTIONS);
const dialogueDirector = new DialogueDirector();
const music = new MusicManager();
const sfx = new SfxManager();
const resizeObserver = new ResizeObserver(() => renderer.resize());
resizeObserver.observe(gameView);

let state = createInitialState(baselineStageMap());
let pointerStart: { x: number; y: number } | undefined;
let previousTime = performance.now();
let previousDialogueState: GameState | undefined;
let lastDialogueKey = "";
let lastDialogueSoundKey = "";
let currentDialoguePanel: DialoguePanel | undefined;
let musicEnabled = readStoredMusicEnabled();
let openingTutorialDismissed = false;
let openingTutorialAnimating = false;
let observedRunId = state.runId;
let lastUiSignature = "";
const dpadFeedbackTimers = new Map<MoveAction, number>();

const elements = {
  dialogueStrip: requireElement<HTMLElement>(".dialogue-strip"),
  dialogueContinue: requireElement<HTMLButtonElement>("[data-dialogue-continue]"),
  phase: requireElement("[data-phase]"),
  score: requireElement("[data-score]"),
  best: requireElement("[data-best]"),
  pancakes: requireElement("[data-pancakes]"),
  speaker: requireElement("[data-speaker]"),
  message: requireElement("[data-message]"),
  clearOverlay: requireElement("#stage-clear"),
  crashOverlay: requireElement("#crash-overlay"),
  creditsOpen: requireElement<HTMLButtonElement>("[data-credits-open]"),
  creditsClose: requireElement<HTMLButtonElement>("[data-credits-close]"),
  creditsModal: requireElement<HTMLElement>("[data-credits-modal]"),
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
populateCredits();
updateMusicToggle();
bindButtons();
bindKeyboard();
bindPointer();
updateUi(true);
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
  state = tickGame(state, deltaSeconds, { hazardsEnabled: true, stageCompletionEnabled: true, cheatMode: false });
  if (state.runId !== observedRunId) {
    observedRunId = state.runId;
    resetOpeningTutorial();
    previousDialogueState = undefined;
    lastDialogueKey = "";
    lastDialogueSoundKey = "";
    currentDialoguePanel = undefined;
    lastUiSignature = "";
  }
  sfx.sync(previousState, state, { cheatMode: false });
  music.sync(state, { cheatMode: false });
  renderer.render(state, deltaSeconds, undefined, { useStageCamera: true });
  updateUi(false);
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
  updateUi(true);
}

function closeCreditsModal(): void {
  elements.creditsModal.hidden = true;
  composition.classList.remove("is-credits-open");
  elements.creditsOpen.focus();
  updateUi(true);
}

function bindButtons(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      unlockMusic();
      const action = button.dataset.action as GameAction | undefined;
      if (!action) return;
      if (action === "restart") resetOpeningTutorial();
      state = applyAction(state, action, { cheatMode: false });
      syncMusicNow();
      updateUi(true);
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-move]").forEach((button) => {
    button.addEventListener("click", () => {
      unlockMusic();
      const move = button.dataset.move as MoveAction | undefined;
      if (!move) return;
      triggerDpadFeedback(move);
      if (handleOpeningTutorialStart()) return;
      state = applyAction(state, move, { allowMoveFromTerminal: false, cheatMode: false });
      syncMusicNow();
      updateUi(true);
    });
  });

  elements.dialogueContinue.addEventListener("click", () => {
    unlockMusic();
    if (!canAdvanceDialogue()) return;
    state = applyAction(state, "forward", { cheatMode: false });
    syncMusicNow();
    updateUi(true);
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
}

function applyDialogueSpeakerVisual(speaker: "A" | "B"): void {
  const nextCharacter: AvatarCharacterId = speaker === "A" ? "mr-awesome" : "mr-not-so-awesome";
  const nextBackground = speaker === "A" ? "sky" : "mint";
  avatarBox.dataset.avatarPortrait = nextCharacter;
  avatarBox.dataset.avatarBackground = nextBackground;
  avatarBox.querySelector("span")?.replaceChildren(document.createTextNode(nextCharacter === "mr-awesome" ? "A" : "N"));
  villainAvatar.setModel(avatarOptionById(nextCharacter));
  villainAvatar.setFraming(DEFAULT_AVATAR_FRAMING[nextCharacter]);
}

function avatarOptionById(id: AvatarCharacterId): AvatarModelDefinition {
  return AVATAR_CHARACTER_OPTIONS.find((option) => option.id === id) ?? AVATAR_CHARACTER_OPTIONS[0];
}

function unlockMusic(): void {
  music.unlock();
  sfx.unlock();
  playCurrentDialogueSound();
}

function syncMusicNow(): void {
  music.sync(state, { cheatMode: false });
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
  const keyMap = new Map<string, MoveAction | "pause" | "restart">([
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
  ]);

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.creditsModal.hidden) {
      event.preventDefault();
      closeCreditsModal();
      return;
    }
    if (event.repeat || isTypingTarget(event.target)) return;
    const mapped = keyMap.get(event.key);
    if (!mapped) return;
    event.preventDefault();
    unlockMusic();
    if (isMoveAction(mapped)) triggerDpadFeedback(mapped);
    if (mapped !== "pause" && mapped !== "restart" && handleOpeningTutorialStart()) return;
    if (mapped === "restart") resetOpeningTutorial();
    state = applyAction(state, mapped, { allowMoveFromTerminal: false, cheatMode: false });
    syncMusicNow();
    updateUi(true);
  }, { capture: true });
}

function bindPointer(): void {
  gameView.addEventListener("pointerdown", (event) => {
    unlockMusic();
    pointerStart = { x: event.clientX, y: event.clientY };
    gameView.setPointerCapture(event.pointerId);
  });

  gameView.addEventListener("pointerup", (event) => {
    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = undefined;
    if (handleOpeningTutorialStart()) return;
    const threshold = 26;
    let swipeMove: MoveAction;
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
      swipeMove = "forward";
    } else if (Math.abs(dx) > Math.abs(dy)) {
      swipeMove = dx < 0 ? "left" : "right";
    } else {
      swipeMove = dy < 0 ? "forward" : "backward";
    }
    triggerDpadFeedback(swipeMove);
    state = applyAction(state, swipeMove, { allowMoveFromTerminal: false, cheatMode: false });
    syncMusicNow();
    updateUi(true);
  });

  gameView.addEventListener("pointercancel", () => {
    pointerStart = undefined;
  });

  gameBoard.addEventListener("pointerleave", () => {
    pointerStart = undefined;
  });
}

function isMoveAction(action: MoveAction | "pause" | "restart"): action is MoveAction {
  return action === "forward" || action === "backward" || action === "left" || action === "right";
}

function triggerDpadFeedback(move: MoveAction): void {
  const button = document.querySelector<HTMLButtonElement>(`[data-move="${move}"]`);
  if (!button) return;
  const previousTimer = dpadFeedbackTimers.get(move);
  if (previousTimer !== undefined) window.clearTimeout(previousTimer);
  button.classList.remove("is-input-active");
  void button.offsetWidth;
  button.classList.add("is-input-active");
  dpadFeedbackTimers.set(
    move,
    window.setTimeout(() => {
      button.classList.remove("is-input-active");
      dpadFeedbackTimers.delete(move);
    }, 190),
  );
}

function updateUi(force: boolean): void {
  const signature = [
    state.phase,
    state.score,
    state.bestScore,
    state.collectedPancakes.size,
    state.runId,
    state.stage.mode,
    state.stage.catchCount,
    state.stage.summonStartedAt ?? "none",
    state.stage.introCameraHandoffStartedAt ?? "none",
    openingTutorialDismissed,
    openingTutorialAnimating,
    Math.floor(state.time * 4),
    elements.creditsModal.hidden,
  ].join(":");
  if (!force && signature === lastUiSignature) return;
  lastUiSignature = signature;

  elements.phase.textContent = phaseLabel(state.phase);
  elements.score.textContent = String(state.score);
  elements.best.textContent = String(state.bestScore);
  elements.pancakes.textContent = String(state.collectedPancakes.size);
  elements.clearOverlay.hidden = state.phase !== "complete";
  elements.crashOverlay.hidden = state.phase !== "crashed";
  updateOpeningTutorialVisuals();
  updateDialogue();
}

function updateDialogue(): void {
  let nextDialogue = dialogueDirector.update(previousDialogueState, state, { editMode: false, cheatMode: false });
  if ((openingTutorialDismissed || openingTutorialAnimating) && nextDialogue?.eventType === "OPENING_TUTORIAL") nextDialogue = undefined;
  previousDialogueState = state;
  if (!nextDialogue) {
    elements.dialogueStrip.classList.add("is-dialogue-hidden");
    elements.dialogueStrip.setAttribute("aria-hidden", "true");
    elements.dialogueContinue.hidden = true;
    elements.speaker.textContent = "";
    elements.message.textContent = "";
    elements.message.dataset.tone = "neutral";
    lastDialogueKey = "";
    lastDialogueSoundKey = "";
    currentDialoguePanel = undefined;
    return;
  }
  currentDialoguePanel = nextDialogue;
  elements.dialogueStrip.classList.remove("is-dialogue-hidden");
  elements.dialogueStrip.removeAttribute("aria-hidden");
  elements.dialogueContinue.hidden = !shouldShowDialogueContinue(nextDialogue);
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
    lastDialogueKey = nextDialogueKey;
    playCurrentDialogueSound();
  }
}

function playCurrentDialogueSound(): void {
  if (!currentDialoguePanel || !lastDialogueKey || lastDialogueSoundKey === lastDialogueKey) return;
  if (sfx.playDialogueBlip(currentDialoguePanel.speaker, state.time)) lastDialogueSoundKey = lastDialogueKey;
}

function shouldShowDialogueContinue(dialogue: DialoguePanel): boolean {
  if (dialogue.eventType !== "VILLAIN_REVEAL") return false;
  return state.stage.summonStartedAt !== undefined
    && state.stage.catchCount === 0
    && state.stage.introCameraHandoffStartedAt === undefined;
}

function canAdvanceDialogue(): boolean {
  return !elements.dialogueContinue.hidden
    && state.stage.summonStartedAt !== undefined
    && state.stage.catchCount === 0
    && state.stage.introCameraHandoffStartedAt === undefined;
}

function updateOpeningTutorialVisuals(): void {
  const active = shouldShowOpeningTutorial();
  composition.classList.toggle("is-opening-tutorial", active);
  composition.classList.toggle("is-opening-tutorial-idle", active && !openingTutorialAnimating && state.time >= 3);
  composition.classList.toggle("is-opening-tutorial-exiting", active && openingTutorialAnimating);
}

function shouldShowOpeningTutorial(): boolean {
  if (state.stage.mode === "postVictoryTutorial") return true;
  const atStartTile = state.player.x === state.stage.playerStart.x
    && state.player.z === state.stage.playerStart.z
    && !state.player.hop;
  return !openingTutorialDismissed
    && state.stage.mode === "introPancakes"
    && (state.phase === "ready" || state.phase === "running")
    && state.collectedPancakes.size === 0
    && state.stage.firstPancakeAt === undefined
    && atStartTile;
}

function handleOpeningTutorialStart(): boolean {
  if (!shouldShowOpeningTutorial()) return false;
  if (state.stage.mode === "postVictoryTutorial") {
    state = createInitialState(baselineStageMap(), state.runId + 1, Math.max(state.bestScore, state.score));
    resetOpeningTutorial();
    previousDialogueState = undefined;
    lastDialogueKey = "";
    lastDialogueSoundKey = "";
    currentDialoguePanel = undefined;
    updateUi(true);
    return true;
  }
  if (openingTutorialAnimating) return true;
  openingTutorialAnimating = true;
  const tutorialRunId = state.runId;
  updateUi(true);
  window.setTimeout(() => {
    if (!openingTutorialAnimating || state.runId !== tutorialRunId) return;
    sfx.playOpeningTutorialTouch(state.time);
  }, 640);
  window.setTimeout(() => {
    openingTutorialDismissed = true;
    openingTutorialAnimating = false;
    updateUi(true);
  }, 1360);
  return true;
}

function resetOpeningTutorial(): void {
  openingTutorialDismissed = false;
  openingTutorialAnimating = false;
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
