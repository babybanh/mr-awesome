import { GRID, PLAYER, type GameAction, type GamePhase, type GameState, type GridPoint, type LaneState, type MoveAction, type MovingSpan, type StageDefinition } from "./types";
import { baselineStageMap, parseStageMap } from "./stageMap";

const BEST_SCORE_KEY = "awesome-superhero.best-score";
const ROAD_COLORS = {
  red: 0xd85d5d,
  blue: 0x4e8ed8,
  yellow: 0xf0c247,
  mint: 0x6fc8a6,
  purple: 0x9a79d9,
  orange: 0xf59655,
} as const;
const MIXED_ROAD_COLORS = [ROAD_COLORS.red, ROAD_COLORS.blue, ROAD_COLORS.yellow, ROAD_COLORS.mint, ROAD_COLORS.purple, ROAD_COLORS.orange] as const;
const INTRO_PANCAKE_TARGET_COUNT = 5;
const INTRO_TIMER_SECONDS = 5;
const SUMMON_DURATION_SECONDS = 1.2;
const BUMP_BACK_SECONDS = 0.82;
const HAZARD_RECOVERY_SECONDS = 0.42;
const PANCAKE_STEAL_DELAY_SECONDS = 0.94;
const TARGET_CATCH_HIDE_SECONDS = 0.62;
const FIRST_CATCH_CAMERA_HANDOFF_SECONDS = 1.2;
const REVEAL_LINE_DURATIONS = [3.65, 3.3, 3.05] as const;
const REVEAL_TOTAL_SECONDS = REVEAL_LINE_DURATIONS.reduce((total, duration) => total + duration, 0);
const FINAL_LINE_DURATIONS = [3.0, 2.7, 3.7, 3.4] as const;
const FINAL_LINE_GAP_SECONDS = 0.4;
const FINAL_DIALOGUE_TOTAL_SECONDS = FINAL_LINE_DURATIONS.reduce(
  (total, duration, index) => total + duration + (index < FINAL_LINE_DURATIONS.length - 1 ? FINAL_LINE_GAP_SECONDS : 0),
  0,
);
const FINAL_FADE_DELAY_SECONDS = 0.45;
const FINAL_FADE_SECONDS = 1.0;
const REVEAL_CONVERSATION_MIN_LINE_SECONDS = 1.15;
const REVEAL_CONVERSATION_INPUT_ADVANCE_SECONDS = 0.85;
const HAZARD_RESPAWN_GROUND_ROWS_BACK = 3;
const TARGET_MIN_ADVANCE_ROWS = 12;
const TARGET_MAX_ADVANCE_ROWS = 20;
const TARGET_MAX_GAP_ROWS = 21;
const TARGET_AUTO_CATCH_MAX_ROWS_BEHIND = 7;
const TARGET_MISS_PULLBACK_SECONDS = 0.72;
const PREFINAL_TARGET_Z = 453;
const TARGET_CENTER_PRIORITY = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5] as const;
const FORWARD_MOVE_SPEED_MULTIPLIER = 1.1;
const SECOND_DIFFICULTY_RAMP_Z = 127;
const POST_SECOND_RAMP_HOP_SPEED_MULTIPLIER = 1.1;

const MOVE_DELTAS: Record<MoveAction, { dx: number; dz: number }> = {
  forward: { dx: 0, dz: 1 },
  backward: { dx: 0, dz: -1 },
  left: { dx: 1, dz: 0 },
  right: { dx: -1, dz: 0 },
};

interface ActionOptions {
  allowMoveFromTerminal?: boolean;
  cheatMode?: boolean;
}

interface TickOptions {
  hazardsEnabled?: boolean;
  stageCompletionEnabled?: boolean;
  cheatMode?: boolean;
}

interface ApplyStageOptions {
  preservePlayer?: boolean;
}

export function createInitialState(mapText = baselineStageMap(), runId = 0, bestScore = readBestScore()): GameState {
  const stage = parseOrFallback(mapText);
  return {
    runId,
    phase: "ready",
    player: { ...stage.playerStart, maxZ: stage.playerStart.z },
    stage: {
      id: 1,
      name: stage.name,
      mode: "introPancakes",
      playerStart: { ...stage.playerStart },
      target: { ...stage.target, visible: false },
      summonMarker: { ...stage.target },
      stolenPancakes: new Set<string>(),
      targetSpawnHistory: [{ ...stage.target }],
      autoTargetCatchCount: 0,
      introCameraHandoffDone: false,
      catchCount: 0,
      targetReachCompletesStage: false,
    },
    stageMap: stage.source,
    lanes: cloneLanes(stage.lanes),
    stageObjects: cloneObjects(stage.objects),
    time: 0,
    score: 0,
    bestScore,
    collectedPancakes: new Set<string>(),
  };
}

export function applyAction(state: GameState, action: GameAction, options: ActionOptions = {}): GameState {
  if (action === "restart") {
    const restarted = createInitialState(state.stageMap, state.runId + 1, Math.max(state.bestScore, state.score));
    return options.cheatMode ? enterCheatMode(restarted) : restarted;
  }
  if (action === "pause") return togglePause(state);
  if (state.phase === "paused") return state;
  if ((state.phase === "crashed" || state.phase === "complete") && !options.allowMoveFromTerminal) return state;
  const moveState = options.allowMoveFromTerminal && (state.phase === "crashed" || state.phase === "complete")
    ? { ...state, phase: "running" as GamePhase, crashReason: undefined, stage: { ...state.stage, lastEvent: undefined } }
    : state;
  const actionState = options.cheatMode ? enterCheatMode(moveState) : moveState;
  if (actionState.stage.mode === "finalSequence") return actionState;
  if (actionState.stage.mode === "postVictoryTutorial") {
    return isMoveAction(action)
      ? createInitialState(actionState.stageMap, actionState.runId + 1, Math.max(actionState.bestScore, actionState.score))
      : actionState;
  }
  if (!options.cheatMode && isMoveAction(action) && isRevealConversationActive(actionState)) return advanceRevealConversation(actionState);
  if (actionState.stage.mode === "summoning") return actionState;
  if (actionState.player.hop) return { ...actionState, queuedMove: { move: action, ttl: PLAYER.inputBufferSeconds } };
  return startMove(actionState, action, options);
}

export function tickGame(state: GameState, deltaSeconds: number, options: TickOptions = {}): GameState {
  const hazardsEnabled = options.hazardsEnabled ?? true;
  const stageCompletionEnabled = options.stageCompletionEnabled ?? true;
  const delta = Math.min(0.05, Math.max(0, deltaSeconds));
  let next: GameState = {
    ...state,
    time: state.phase === "paused" ? state.time : state.time + delta,
    queuedMove: state.queuedMove ? { ...state.queuedMove, ttl: state.queuedMove.ttl - delta } : undefined,
  };

  if (next.phase === "paused" || next.phase === "crashed" || next.phase === "complete") return next;
  next = updateStageTimers(next);
  if (next.runId !== state.runId || next.stage.mode === "finalSequence" || next.stage.mode === "postVictoryTutorial") return next;
  next = advanceHop(next, delta);
  if (hazardsEnabled) next = detectHazards(next);
  if (stageCompletionEnabled) next = updateStageProgress(next);

  if (!next.player.hop && next.queuedMove && next.queuedMove.ttl > 0 && next.phase !== "crashed" && next.phase !== "complete") {
    const queued = next.queuedMove.move;
    next = startMove({ ...next, queuedMove: undefined }, queued, { cheatMode: options.cheatMode });
  } else if (next.queuedMove && next.queuedMove.ttl <= 0) {
    next = { ...next, queuedMove: undefined };
  }

  if (hazardsEnabled) next = carryOnRiver(next, delta);
  if (hazardsEnabled) next = detectHazards(next);
  if (stageCompletionEnabled) next = updateStageProgress(next);
  next = updateRiverClearProgress(next);
  return next;
}

export function applyStage(state: GameState, stage: StageDefinition, mapText: string, options: ApplyStageOptions = {}): GameState {
  const next: GameState = {
    ...createInitialState(mapText, state.runId + 1, Math.max(state.bestScore, state.score)),
    stageMap: mapText,
    lanes: cloneLanes(stage.lanes),
    stageObjects: cloneObjects(stage.objects),
  };
  if (!options.preservePlayer) return next;

  const preservedPlayer = playerOnAppliedStage(state, stage);
  if (!preservedPlayer) return next;
  const score = Math.max(state.score, preservedPlayer.maxZ);
  const bestScore = Math.max(next.bestScore, score);
  return {
    ...next,
    phase: state.phase === "crashed" || state.phase === "complete" ? "running" : state.phase,
    player: preservedPlayer,
    score,
    bestScore,
    collectedPancakes: filterCollectedPancakes(state.collectedPancakes, next.lanes),
    queuedMove: undefined,
    crashReason: undefined,
    stage: { ...next.stage, lastEvent: undefined },
  };
}

export function getMovingSpans(lane: LaneState, time: number, minX = GRID.visibleMinX - 4, maxX = GRID.visibleMaxX + 4): MovingSpan[] {
  if (lane.kind !== "road" && lane.kind !== "river" && lane.kind !== "train") return [];
  const period = Math.max(lane.length + lane.gap, lane.length + 1);
  const motion = lane.phase + lane.direction * lane.speed * time;
  const first = Math.floor((minX - motion) / period) - 2;
  const last = Math.ceil((maxX - motion) / period) + 2;
  const spans: MovingSpan[] = [];
  for (let index = first; index <= last; index += 1) {
    const centerX = motion + index * period;
    if (centerX + lane.length / 2 < minX || centerX - lane.length / 2 > maxX) continue;
    spans.push({
      kind: lane.kind === "river" ? "platform" : lane.kind === "train" ? "train" : "vehicle",
      centerX,
      z: lane.z,
      length: lane.length,
      direction: lane.direction,
      color: spanColor(lane, index),
      label: lane.kind === "river" ? "Log" : lane.kind === "train" ? "Train" : "Vehicle",
    });
  }
  return spans;
}

function spanColor(lane: LaneState, index: number): number {
  if (lane.kind === "river") return 0x99653d;
  if (lane.kind === "train") return 0x2a3037;
  if (lane.kind !== "road") return ROAD_COLORS.red;
  const scheme = lane.road?.colorScheme ?? "direction";
  if (scheme === "direction") return lane.length > 2.4 ? ROAD_COLORS.yellow : lane.direction === -1 ? ROAD_COLORS.blue : ROAD_COLORS.red;
  if (scheme !== "mixed") return ROAD_COLORS[scheme];
  const seed = lane.road?.seed ?? 0;
  const colorIndex = positiveModulo(lane.z * 37 + index * 19 + seed * 53, MIXED_ROAD_COLORS.length);
  return MIXED_ROAD_COLORS[colorIndex] ?? ROAD_COLORS.red;
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

export function isTrainWarningActive(lane: LaneState, time: number): boolean {
  if (lane.kind !== "train") return false;
  const warnSeconds = lane.train?.warnCode === "L" ? 1.35 : lane.train?.warnCode === "S" ? 0.55 : 0.9;
  const edgeX = lane.direction === 1
    ? GRID.visibleMinX - 1 - lane.length / 2
    : GRID.visibleMaxX + 1 + lane.length / 2;
  const spans = getMovingSpans(lane, time, GRID.visibleMinX - lane.length - 4, GRID.visibleMaxX + lane.length + 4);
  return spans.some((span) => {
    const isVisible = span.centerX + span.length / 2 >= GRID.visibleMinX && span.centerX - span.length / 2 <= GRID.visibleMaxX;
    if (isVisible) return true;
    const distanceToEdge = lane.direction === 1 ? edgeX - span.centerX : span.centerX - edgeX;
    if (distanceToEdge < 0) return false;
    return distanceToEdge / Math.max(0.001, lane.speed) <= warnSeconds;
  });
}

export function getPlayerDisplayPosition(state: GameState): { x: number; z: number; y: number; hopProgress: number } {
  const hop = state.player.hop;
  if (!hop) return { x: state.player.x, z: state.player.z, y: 0, hopProgress: 1 };
  const progress = Math.min(1, Math.max(0, hop.elapsed / hop.duration));
  if (hop.kind === "targetPullback") return targetPullbackDisplayPosition(state, progress);
  const moveProgress = smoothstep(progress);
  return {
    x: hop.fromX + (hop.toX - hop.fromX) * moveProgress,
    z: hop.fromZ + (hop.toZ - hop.fromZ) * moveProgress,
    y: Math.sin(Math.PI * progress) * PLAYER.hopArcHeight,
    hopProgress: progress,
  };
}

function targetPullbackDisplayPosition(state: GameState, progress: number): { x: number; z: number; y: number; hopProgress: number } {
  const hop = state.player.hop;
  if (!hop) return { x: state.player.x, z: state.player.z, y: 0, hopProgress: 1 };
  const moveProgress = targetPullbackProgress(progress);
  const arc = Math.sin(moveProgress * Math.PI);
  return {
    x: hop.fromX + (hop.toX - hop.fromX) * moveProgress + targetPullbackLateralOffset(hop.fromX, hop.fromZ, hop.toX, hop.toZ, state.stage.catchCount, progress),
    z: hop.fromZ + (hop.toZ - hop.fromZ) * moveProgress,
    y: 0.42 * arc,
    hopProgress: progress,
  };
}

function targetPullbackProgress(progress: number): number {
  if (progress < 0.34) return 0.16 * easeInCubic(progress / 0.34);
  return 0.16 + 0.84 * easeOutCubic((progress - 0.34) / 0.66);
}

function targetPullbackLateralOffset(fromX: number, fromZ: number, toX: number, toZ: number, catchCount: number, progress: number): number {
  const seed = positiveModulo(Math.round((fromX + 9) * 29 + (fromZ + 3) * 23 + (toX + 11) * 41 + (toZ + 5) * 17 + catchCount * 31), 6);
  if (seed === 0) return 0;
  const direction = seed % 2 === 0 ? 1 : -1;
  const amplitude = seed <= 2 ? 0.2 : 0.3;
  if (seed <= 2) return direction * amplitude * Math.sin(progress * Math.PI);
  return direction * amplitude * Math.sin(progress * Math.PI * 2) * 0.78;
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

function easeInCubic(value: number): number {
  return value * value * value;
}

function easeOutCubic(value: number): number {
  const inverted = 1 - value;
  return 1 - inverted * inverted * inverted;
}

export function pancakeKey(x: number, z: number): string {
  return `${z}:${x}`;
}

export function readBestScore(): number {
  if (typeof window === "undefined") return 0;
  const parsed = Number.parseInt(window.localStorage.getItem(BEST_SCORE_KEY) ?? "0", 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function writeBestScore(score: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BEST_SCORE_KEY, String(Math.max(0, Math.floor(score))));
}

function parseOrFallback(mapText: string): StageDefinition {
  const parsed = parseStageMap(mapText);
  if (parsed.ok && parsed.stage) return parsed.stage;
  const fallback = parseStageMap(baselineStageMap());
  if (!fallback.stage) throw new Error("Invalid built-in Stage 1 map.");
  return fallback.stage;
}

function togglePause(state: GameState): GameState {
  if (state.phase === "paused") return { ...state, phase: "running" };
  if (state.phase === "ready" || state.phase === "running") return { ...state, phase: "paused" };
  return state;
}

export function enterCheatMode(state: GameState): GameState {
  if (state.stage.mode === "chase" && state.stage.target.visible && state.phase !== "crashed" && state.phase !== "complete") return state;
  return {
    ...state,
    phase: state.phase === "paused" ? "paused" : "running",
    crashReason: undefined,
    stage: {
      ...state.stage,
      mode: "chase",
      target: { ...state.stage.summonMarker, visible: true },
      targetEscape: undefined,
      targetPending: undefined,
      targetRevealAt: undefined,
      introCameraHandoffDone: true,
      introCameraHandoffStartedAt: undefined,
      introCameraHandoffReleaseAt: undefined,
      revealConversationAdvanceSeconds: undefined,
      stolenPancakes: new Set<string>(),
      stolenPancakesStartedAt: undefined,
      finalStartedAt: undefined,
      finalRescueStartedAt: undefined,
      finalPoofStartedAt: undefined,
      finalFadeStartedAt: undefined,
      postVictoryStartedAt: undefined,
      lastEvent: "Cheat Mode",
    },
  };
}

function startMove(state: GameState, move: MoveAction, options: ActionOptions = {}): GameState {
  if (!options.cheatMode && isIntroCameraHandoffActive(state)) return state;
  const delta = MOVE_DELTAS[move];
  let targetX = clamp(Math.round(state.player.x) + delta.dx, GRID.minX, GRID.maxX);
  const maxLaneZ = Math.max(...state.lanes.keys());
  let targetZ = clamp(Math.round(state.player.z) + delta.dz, 0, maxLaneZ);
  let lane = state.lanes.get(targetZ);
  if (!lane) return state;
  if (state.stage.mode === "introPancakes" && !options.cheatMode && lane.kind === "river") {
    targetX = Math.round(state.player.x);
    targetZ = Math.round(state.player.z);
    lane = state.lanes.get(targetZ);
    if (!lane) return state;
  }
  if (isGroundLane(lane) && (lane.blockers.includes(targetX) || lane.buildings.includes(targetX))) return state;
  const rampSpeedMultiplier = state.stage.mode === "chase" && Math.round(state.player.z) > SECOND_DIFFICULTY_RAMP_Z
    ? POST_SECOND_RAMP_HOP_SPEED_MULTIPLIER
    : 1;
  const baseDuration = (move === "forward" ? PLAYER.hopDuration / FORWARD_MOVE_SPEED_MULTIPLIER : PLAYER.hopDuration) / rampSpeedMultiplier;
  const duration = options.cheatMode ? baseDuration / 3 : baseDuration;
  const stage = state.stage.lastEvent?.startsWith("Recovered from")
    ? { ...state.stage, lastEvent: undefined }
    : state.stage;
  return {
    ...state,
    phase: state.phase === "ready" ? "running" : state.phase,
    stage,
    player: {
      ...state.player,
      hop: {
        fromX: state.player.x,
        fromZ: state.player.z,
        toX: targetX,
        toZ: targetZ,
        elapsed: 0,
        duration,
        kind: "move",
      },
    },
  };
}

function advanceHop(state: GameState, delta: number): GameState {
  const hop = state.player.hop;
  if (!hop) return state;
  const elapsed = hop.elapsed + delta;
  if (elapsed < hop.duration) return { ...state, player: { ...state.player, hop: { ...hop, elapsed } } };

  const landedX = Math.round(hop.toX);
  const landedZ = hop.toZ;
  const maxZ = Math.max(state.player.maxZ, landedZ);
  const score = maxZ;
  const bestScore = Math.max(state.bestScore, score);
  const collected = hop.kind === "hazardRecovery" || hop.kind === "summonBump" || hop.kind === "targetPullback"
    ? { pancakes: state.collectedPancakes }
    : collectPancake(state, landedX, landedZ);
  if (bestScore > state.bestScore) writeBestScore(bestScore);
  const landed: GameState = {
    ...state,
    score,
    bestScore,
    collectedPancakes: collected.pancakes,
    player: { x: hop.toX, z: landedZ, maxZ },
  };
  return collected.key ? updateIntroAfterPancakeCollect(landed, collected.key) : landed;
}

function collectPancake(state: GameState, x: number, z: number): { pancakes: Set<string>; key?: string } {
  const lane = state.lanes.get(z);
  if (!lane?.collectibles.includes(x)) return { pancakes: state.collectedPancakes };
  const key = pancakeKey(x, z);
  if (state.collectedPancakes.has(key) || state.stage.stolenPancakes.has(key)) return { pancakes: state.collectedPancakes };
  const collected = new Set(state.collectedPancakes);
  collected.add(key);
  return { pancakes: collected, key };
}

function updateIntroAfterPancakeCollect(state: GameState, collectedKey: string): GameState {
  if (state.stage.mode !== "introPancakes" || !introPancakeKeys(state).has(collectedKey)) return state;
  const firstPancakeAt = state.stage.firstPancakeAt ?? state.time;
  const previousCollected = new Set(state.collectedPancakes);
  previousCollected.delete(collectedKey);
  const previousIntroCount = countIntroPancakes({ ...state, collectedPancakes: previousCollected });
  const introCount = countIntroPancakes(state);
  const countTrigger = introCount >= INTRO_PANCAKE_TARGET_COUNT;
  const timerTrigger = state.stage.firstPancakeAt !== undefined
    && state.time - state.stage.firstPancakeAt >= INTRO_TIMER_SECONDS
    && previousIntroCount < 4;
  if (countTrigger || timerTrigger) return startSummon(state, firstPancakeAt, collectedKey);
  return { ...state, stage: { ...state.stage, firstPancakeAt, lastEvent: "Pancake collected" } };
}

function updateStageTimers(state: GameState): GameState {
  let next = state;
  if (next.stage.mode === "finalSequence" && next.stage.finalStartedAt !== undefined) {
    const fadeStartedAt = next.stage.finalFadeStartedAt ?? next.stage.finalStartedAt + FINAL_DIALOGUE_TOTAL_SECONDS + FINAL_FADE_DELAY_SECONDS;
    if (next.time >= fadeStartedAt + FINAL_FADE_SECONDS) {
      return {
        ...next,
        queuedMove: undefined,
        crashReason: undefined,
        player: { ...next.player, hop: undefined },
        stage: {
          ...next.stage,
          mode: "postVictoryTutorial",
          target: { ...next.stage.target, visible: false },
          targetEscape: undefined,
          targetPending: undefined,
          targetRevealAt: undefined,
          postVictoryStartedAt: next.time,
          lastEvent: "Post Victory Credits Available",
        },
      };
    }
    if (next.stage.finalFadeStartedAt === undefined && next.time >= fadeStartedAt) {
      next = {
        ...next,
        stage: {
          ...next.stage,
          finalFadeStartedAt: fadeStartedAt,
          lastEvent: "Final fade",
        },
      };
    }
  }
  if (isIntroCameraHandoffActive(next) && (next.stage.introCameraHandoffReleaseAt ?? Number.POSITIVE_INFINITY) <= next.time) {
    next = {
      ...next,
      queuedMove: undefined,
      stage: {
        ...next.stage,
        introCameraHandoffDone: true,
        introCameraHandoffStartedAt: undefined,
        introCameraHandoffReleaseAt: undefined,
        lastEvent: "The chase is on",
      },
    };
  }
  if (next.stage.mode === "summoning" && (next.stage.summonStartedAt ?? Number.POSITIVE_INFINITY) + SUMMON_DURATION_SECONDS <= next.time && !next.player.hop) {
    next = {
      ...next,
      stage: {
        ...next.stage,
        mode: "chase",
        lastEvent: "The chase is on",
      },
    };
  }
  if (next.stage.targetPending && (next.stage.targetRevealAt ?? Number.POSITIVE_INFINITY) <= next.time) {
    next = {
      ...next,
      stage: {
        ...next.stage,
        target: { ...next.stage.targetPending, visible: true },
        targetEscape: undefined,
        targetPending: undefined,
        targetRevealAt: undefined,
        lastEvent: "Mr. Not So Awesome reappeared",
      },
    };
  }
  return next;
}

function startSummon(state: GameState, firstPancakeAt: number, triggerPancakeKey: string): GameState {
  const stolenPancakes = new Set<string>();
  const introKeys = introPancakeKeys(state);
  for (const key of introKeys) {
    if (!state.collectedPancakes.has(key)) stolenPancakes.add(key);
  }
  stolenPancakes.add(triggerPancakeKey);
  const collectedPancakes = new Set(state.collectedPancakes);
  collectedPancakes.delete(triggerPancakeKey);
  const marker = { ...state.stage.summonMarker };
  const bumpTarget = summonBumpBackTarget(state);
  return {
    ...state,
    phase: "running",
    collectedPancakes,
    queuedMove: undefined,
    crashReason: undefined,
    player: {
      ...state.player,
      hop: {
        fromX: state.player.x,
        fromZ: state.player.z,
        toX: bumpTarget.x,
        toZ: bumpTarget.z,
        elapsed: 0,
        duration: BUMP_BACK_SECONDS,
        kind: "summonBump",
      },
    },
    stage: {
      ...state.stage,
      mode: "summoning",
      target: { ...marker, visible: true },
      firstPancakeAt,
      summonStartedAt: state.time,
      revealConversationAdvanceSeconds: 0,
      stolenPancakes,
      stolenPancakesStartedAt: state.time + PANCAKE_STEAL_DELAY_SECONDS,
      targetSpawnHistory: [marker],
      targetEscape: undefined,
      targetPending: undefined,
      targetRevealAt: undefined,
      introCameraHandoffDone: false,
      introCameraHandoffStartedAt: undefined,
      introCameraHandoffReleaseAt: undefined,
      lastEvent: "Mr. Not So Awesome stole the pancakes",
    },
  };
}

function introPancakeKeys(state: GameState): Set<string> {
  const keys = new Set<string>();
  for (const lane of state.lanes.values()) {
    if (lane.z > state.stage.summonMarker.z) continue;
    for (const x of lane.collectibles) keys.add(pancakeKey(x, lane.z));
  }
  return keys;
}

function countIntroPancakes(state: Pick<GameState, "collectedPancakes" | "lanes" | "stage">): number {
  let count = 0;
  for (const lane of state.lanes.values()) {
    if (lane.z > state.stage.summonMarker.z) continue;
    for (const x of lane.collectibles) {
      if (state.collectedPancakes.has(pancakeKey(x, lane.z))) count += 1;
    }
  }
  return count;
}

function carryOnRiver(state: GameState, delta: number): GameState {
  if (state.phase !== "running" || state.player.hop) return state;
  const lane = state.lanes.get(Math.round(state.player.z));
  if (lane?.kind !== "river") return state;
  if (!platformUnderPlayer(state, lane.z)) return state;
  const carriedX = state.player.x + lane.direction * lane.speed * delta;
  if (carriedX < GRID.minX || carriedX > GRID.maxX) {
    return recoverFromHazard({ ...state, player: { ...state.player, x: carriedX } }, "River edge");
  }
  return { ...state, player: { ...state.player, x: carriedX } };
}

function detectHazards(state: GameState): GameState {
  if (state.phase !== "running" || state.player.hop) return state;
  const lane = state.lanes.get(Math.round(state.player.z));
  if (lane?.kind === "road" || lane?.kind === "train") {
    const hit = getMovingSpans(lane, state.time).some((span) => Math.abs(state.player.x - span.centerX) <= span.length / 2 + PLAYER.hitboxWidth / 2);
    return hit ? recoverFromHazard(state, lane.kind === "train" ? "Train" : "Traffic") : state;
  }
  if (lane?.kind === "river" && !platformUnderPlayer(state, lane.z)) return recoverFromHazard(state, "Water");
  return state;
}

function platformUnderPlayer(state: GameState, z: number): boolean {
  const lane = state.lanes.get(z);
  if (lane?.kind !== "river") return false;
  return getMovingSpans(lane, state.time).some((span) => Math.abs(state.player.x - span.centerX) <= span.length / 2 + PLAYER.hitboxWidth / 2);
}

function stageStart(state: GameState): GridPoint {
  return { ...state.stage.playerStart };
}

function summonBumpBackTarget(state: GameState): GridPoint {
  const currentZ = Math.round(state.player.z);
  const start = stageStart(state);

  let safeGroundRows = 0;
  for (let z = currentZ - 1; z >= 0; z -= 1) {
    const lane = state.lanes.get(z);
    if (!isGroundLane(lane)) continue;
    const point = firstSafeGroundPoint(state, z, xPriority(start.x));
    if (!point) continue;
    safeGroundRows += 1;
    if (safeGroundRows >= HAZARD_RESPAWN_GROUND_ROWS_BACK) return point;
  }
  return firstSafeGroundPoint(state, start.z, xPriority(start.x)) ?? start;
}

function recoverFromHazard(state: GameState, crashReason: string): GameState {
  const bestScore = Math.max(state.bestScore, state.score);
  writeBestScore(bestScore);
  const respawn = safeRespawnBeforeHazard(state);
  const fromX = state.player.x;
  const fromZ = state.player.z;
  const recovered: GameState = {
    ...state,
    phase: "running",
    bestScore,
    crashReason,
    queuedMove: undefined,
    player: {
      ...respawn,
      maxZ: state.player.maxZ,
      hop: {
        fromX,
        fromZ,
        toX: respawn.x,
        toZ: respawn.z,
        elapsed: 0,
        duration: HAZARD_RECOVERY_SECONDS,
        kind: "hazardRecovery",
      },
    },
    stage: { ...state.stage, lastEvent: `Recovered from ${crashReason}` },
  };
  return rewindTargetIfTooFar(recovered);
}

function safeRespawnBeforeHazard(state: GameState): GridPoint {
  const currentZ = Math.round(state.player.z);
  const clusterStart = hazardClusterStart(state, currentZ);
  const currentX = clamp(Math.round(state.player.x), GRID.minX, GRID.maxX);
  let safeGroundRows = 0;
  for (let z = clusterStart - 1; z >= 0; z -= 1) {
    const lane = state.lanes.get(z);
    if (!isGroundLane(lane)) continue;
    const point = firstSafeGroundPoint(state, z, xPriority(currentX));
    if (!point) continue;
    safeGroundRows += 1;
    if (safeGroundRows >= HAZARD_RESPAWN_GROUND_ROWS_BACK) return point;
  }
  return firstSafeGroundPoint(state, state.stage.playerStart.z, xPriority(state.stage.playerStart.x)) ?? stageStart(state);
}

function updateRiverClearProgress(state: GameState): GameState {
  if (state.stage.firstRiverClearedAt !== undefined) return state;
  if (state.player.maxZ < 13) return state;
  return {
    ...state,
    stage: {
      ...state.stage,
      firstRiverClearedAt: state.time,
      lastEvent: state.stage.lastEvent === "Target missed" ? state.stage.lastEvent : "First river cleared",
    },
  };
}

function hazardClusterStart(state: GameState, z: number): number {
  let start = z;
  for (let row = z; row >= 0; row -= 1) {
    const lane = state.lanes.get(row);
    if (!lane || isGroundLane(lane)) break;
    start = row;
  }
  return start;
}

function firstSafeGroundPoint(state: GameState, z: number, preferredXs: readonly number[]): GridPoint | undefined {
  for (const x of preferredXs) {
    if (isSafeGroundPoint(state, { x, z }, { avoidCollectibles: false })) return { x, z };
  }
  return undefined;
}

function findNextTargetSpawn(state: GameState): GridPoint | undefined {
  if (shouldUsePrefinalTarget(state)) {
    const point = firstSafeTargetPoint(state, PREFINAL_TARGET_Z);
    if (point) return point;
  }
  const startZ = Math.round(state.player.z) + TARGET_MIN_ADVANCE_ROWS;
  const maxPreferredZ = Math.min(Math.max(...state.lanes.keys()), Math.round(state.player.z) + TARGET_MAX_ADVANCE_ROWS);
  for (let z = startZ; z <= maxPreferredZ; z += 1) {
    const point = firstSafeTargetPoint(state, z);
    if (point) return point;
  }
  return undefined;
}

function shouldUsePrefinalTarget(state: GameState): boolean {
  const playerZ = Math.round(state.player.z);
  const currentTargetZ = state.stage.target.visible ? state.stage.target.z : state.stage.targetPending?.z;
  if (currentTargetZ === PREFINAL_TARGET_Z) return false;
  if (playerZ >= PREFINAL_TARGET_Z) return false;
  if (playerZ < PREFINAL_TARGET_Z - TARGET_MAX_ADVANCE_ROWS) return false;
  return state.lanes.has(PREFINAL_TARGET_Z);
}

function firstSafeTargetPoint(state: GameState, z: number): GridPoint | undefined {
  for (const x of TARGET_CENTER_PRIORITY) {
    if (isSafeGroundPoint(state, { x, z }, { avoidCollectibles: true, avoidPlayer: true })) return { x, z };
  }
  return undefined;
}

function targetMissPullbackPoint(state: GameState): GridPoint | undefined {
  const target = state.stage.target;
  const preferredXs = [...new Set([target.x, Math.round(state.player.x), ...xPriority(target.x)])];
  for (let z = target.z - 1; z >= 0; z -= 1) {
    const withoutPancake = firstSafeGroundPointAvoidingCollectibles(state, z, preferredXs);
    if (withoutPancake) return withoutPancake;
    const fallback = firstSafeGroundPoint(state, z, preferredXs);
    if (fallback) return fallback;
  }
  return firstSafeGroundPoint(state, state.stage.playerStart.z, preferredXs) ?? stageStart(state);
}

function firstSafeGroundPointAvoidingCollectibles(state: GameState, z: number, preferredXs: readonly number[]): GridPoint | undefined {
  for (const x of preferredXs) {
    if (isSafeGroundPoint(state, { x, z }, { avoidCollectibles: true })) return { x, z };
  }
  return undefined;
}

function isSafeGroundPoint(state: GameState, point: GridPoint, options: { avoidCollectibles: boolean; avoidPlayer?: boolean }): boolean {
  if (point.x < GRID.minX || point.x > GRID.maxX || point.z < 0) return false;
  const lane = state.lanes.get(point.z);
  if (!isGroundLane(lane)) return false;
  if (lane.blockers.includes(point.x) || lane.buildings.includes(point.x)) return false;
  if (options.avoidCollectibles && lane.collectibles.includes(point.x)) return false;
  if (options.avoidPlayer && Math.round(state.player.x) === point.x && Math.round(state.player.z) === point.z) return false;
  return true;
}

function isGroundLane(lane: LaneState | undefined): lane is LaneState {
  return lane?.kind === "grass";
}

function rewindTargetIfTooFar(state: GameState): GameState {
  const visibleTarget = state.stage.target.visible ? state.stage.target : state.stage.targetPending;
  if (!visibleTarget || state.stage.mode !== "chase") return state;
  if (visibleTarget.z - state.player.z <= TARGET_MAX_GAP_ROWS) return state;
  const history = state.stage.targetSpawnHistory;
  for (let index = history.length - 2; index >= 0; index -= 1) {
    const candidate = history[index];
    if (!candidate || candidate.z - state.player.z > TARGET_MAX_GAP_ROWS) continue;
    return {
      ...state,
      stage: {
        ...state.stage,
        target: { ...candidate, visible: true },
        targetEscape: undefined,
        targetPending: undefined,
        targetRevealAt: undefined,
        targetSpawnHistory: history.slice(0, index + 1),
        lastEvent: "Mr. Not So Awesome moved back into range",
      },
    };
  }
  return state;
}

function updateStageProgress(state: GameState): GameState {
  if (state.phase === "complete" || state.phase === "crashed") return state;
  if (state.player.hop) return state;
  if (state.stage.mode !== "chase" || !state.stage.target.visible) return state;
  const playerX = Math.round(state.player.x);
  const playerZ = Math.round(state.player.z);
  const caughtTarget = playerX === state.stage.target.x && playerZ === state.stage.target.z;
  const shouldPullBackToTarget = !caughtTarget && playerZ - state.stage.target.z > TARGET_AUTO_CATCH_MAX_ROWS_BEHIND;
  if (shouldPullBackToTarget) return startTargetMissPullback(state);
  if (!caughtTarget) return state;
  const nextTarget = findNextTargetSpawn(state);
  if (!nextTarget) return startFinalSequence(state);
  const history = [...state.stage.targetSpawnHistory, nextTarget];
  const shouldStartIntroHandoff = !state.stage.introCameraHandoffDone && state.stage.catchCount === 0;
  const targetRevealAt = shouldStartIntroHandoff
    ? state.time + TARGET_CATCH_HIDE_SECONDS + FIRST_CATCH_CAMERA_HANDOFF_SECONDS
    : state.time + TARGET_CATCH_HIDE_SECONDS;
  return {
    ...state,
    queuedMove: shouldStartIntroHandoff ? undefined : state.queuedMove,
    stage: {
      ...state.stage,
      target: { ...state.stage.target, visible: false },
      targetEscape: { x: state.stage.target.x, z: state.stage.target.z, startedAt: state.time },
      targetPending: nextTarget,
      targetRevealAt,
      introCameraHandoffStartedAt: shouldStartIntroHandoff ? state.time : state.stage.introCameraHandoffStartedAt,
      introCameraHandoffReleaseAt: shouldStartIntroHandoff ? targetRevealAt : state.stage.introCameraHandoffReleaseAt,
      targetSpawnHistory: history,
      catchCount: state.stage.catchCount + 1,
      lastEvent: shouldStartIntroHandoff
        ? "Mr. Not So Awesome is escaping"
        : "Mr. Not So Awesome slipped ahead",
    },
  };
}

function startTargetMissPullback(state: GameState): GameState {
  const pullback = targetMissPullbackPoint(state);
  if (!pullback) return state;
  return {
    ...state,
    queuedMove: undefined,
    crashReason: undefined,
    player: {
      ...state.player,
      hop: {
        fromX: state.player.x,
        fromZ: state.player.z,
        toX: pullback.x,
        toZ: pullback.z,
        elapsed: 0,
        duration: TARGET_MISS_PULLBACK_SECONDS,
        kind: "targetPullback",
      },
    },
    stage: {
      ...state.stage,
      target: { ...state.stage.target, visible: true },
      targetEscape: undefined,
      targetPending: undefined,
      targetRevealAt: undefined,
      lastEvent: "Target missed",
    },
  };
}

function startFinalSequence(state: GameState): GameState {
  const bestScore = Math.max(state.bestScore, state.score);
  writeBestScore(bestScore);
  return {
    ...state,
    phase: "running",
    bestScore,
    queuedMove: undefined,
    crashReason: undefined,
    player: { ...state.player, hop: undefined },
    stage: {
      ...state.stage,
      mode: "finalSequence",
      target: { ...state.stage.target, visible: false },
      targetEscape: { x: state.stage.target.x, z: state.stage.target.z, startedAt: state.time },
      targetPending: undefined,
      targetRevealAt: undefined,
      introCameraHandoffDone: true,
      introCameraHandoffStartedAt: undefined,
      introCameraHandoffReleaseAt: undefined,
      finalStartedAt: state.time,
      finalRescueStartedAt: state.time + finalLineStartSeconds(2),
      finalPoofStartedAt: state.time + FINAL_DIALOGUE_TOTAL_SECONDS - 0.8,
      finalFadeStartedAt: state.time + FINAL_DIALOGUE_TOTAL_SECONDS + FINAL_FADE_DELAY_SECONDS,
      postVictoryStartedAt: undefined,
      catchCount: state.stage.catchCount + 1,
      lastEvent: "Final Ending",
    },
  };
}

function finalLineStartSeconds(lineIndex: number): number {
  let seconds = 0;
  for (let index = 0; index < lineIndex; index += 1) {
    seconds += (FINAL_LINE_DURATIONS[index] ?? 0) + FINAL_LINE_GAP_SECONDS;
  }
  return seconds;
}

function isIntroCameraHandoffActive(state: GameState): boolean {
  return state.stage.mode === "chase"
    && !state.stage.introCameraHandoffDone
    && state.stage.introCameraHandoffStartedAt !== undefined
    && state.stage.introCameraHandoffReleaseAt !== undefined;
}

export function isRevealConversationActive(state: GameState): boolean {
  if (state.stage.summonStartedAt === undefined || state.stage.catchCount > 0 || state.stage.introCameraHandoffStartedAt !== undefined) return false;
  return revealConversationElapsed(state) < REVEAL_TOTAL_SECONDS;
}

function advanceRevealConversation(state: GameState): GameState {
  const elapsed = revealConversationElapsed(state);
  const window = revealLineWindow(elapsed);
  if (!window || elapsed - window.start < REVEAL_CONVERSATION_MIN_LINE_SECONDS) return state;

  const remainingTotal = REVEAL_TOTAL_SECONDS - elapsed;
  if (remainingTotal <= 0) return state;
  const remainingLine = Math.max(0, window.end - elapsed);
  const advance = Math.min(REVEAL_CONVERSATION_INPUT_ADVANCE_SECONDS, remainingLine + 0.02, remainingTotal);
  if (advance <= 0) return state;

  return {
    ...state,
    queuedMove: undefined,
    stage: {
      ...state.stage,
      revealConversationAdvanceSeconds: (state.stage.revealConversationAdvanceSeconds ?? 0) + advance,
    },
  };
}

function revealConversationElapsed(state: GameState): number {
  if (state.stage.summonStartedAt === undefined) return Number.POSITIVE_INFINITY;
  return state.time - state.stage.summonStartedAt + (state.stage.revealConversationAdvanceSeconds ?? 0);
}

function revealLineWindow(elapsed: number): { start: number; end: number } | undefined {
  let start = 0;
  for (const duration of REVEAL_LINE_DURATIONS) {
    const end = start + duration;
    if (elapsed < end) return { start, end };
    start = end;
  }
  return undefined;
}

function isMoveAction(action: GameAction): action is MoveAction {
  return action === "forward" || action === "backward" || action === "left" || action === "right";
}

function cloneLanes(lanes: Map<number, LaneState>): Map<number, LaneState> {
  return new Map(Array.from(lanes.entries()).map(([z, lane]) => [z, {
    ...lane,
    blockers: [...lane.blockers],
    buildings: [...lane.buildings],
    collectibles: [...lane.collectibles],
    road: lane.road ? { ...lane.road } : undefined,
    river: lane.river ? { ...lane.river } : undefined,
    train: lane.train ? { ...lane.train } : undefined,
  }]));
}

function cloneObjects(objects: StageDefinition["objects"]): StageDefinition["objects"] {
  return objects.map((object) => ({
    ...object,
    cells: object.cells.map((cell) => ({ ...cell })),
  }));
}

function playerOnAppliedStage(state: GameState, stage: StageDefinition): GameState["player"] | undefined {
  const maxLaneZ = Math.max(...stage.lanes.keys());
  const target = state.player.hop
    ? { x: state.player.hop.toX, z: state.player.hop.toZ }
    : getPlayerDisplayPosition(state);
  const x = clamp(Math.round(target.x), GRID.minX, GRID.maxX);
  const z = clamp(Math.round(target.z), 0, maxLaneZ);
  const lane = stage.lanes.get(z);
  if (!lane) return undefined;
  if (isGroundLane(lane) && (lane.blockers.includes(x) || lane.buildings.includes(x))) return undefined;
  return {
    x,
    z,
    maxZ: Math.max(z, Math.min(state.player.maxZ, maxLaneZ)),
  };
}

function filterCollectedPancakes(collectedPancakes: Set<string>, lanes: Map<number, LaneState>): Set<string> {
  const filtered = new Set<string>();
  for (const key of collectedPancakes) {
    const [zText, xText] = key.split(":");
    const z = Number.parseInt(zText ?? "", 10);
    const x = Number.parseInt(xText ?? "", 10);
    if (!Number.isInteger(z) || !Number.isInteger(x)) continue;
    if (lanes.get(z)?.collectibles.includes(x)) filtered.add(key);
  }
  return filtered;
}

function xPriority(primary: number): number[] {
  const ordered = [primary, 0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6]
    .map((x) => clamp(Math.round(x), GRID.minX, GRID.maxX));
  return [...new Set(ordered)];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function phaseLabel(phase: GamePhase): string {
  if (phase === "ready") return "Ready";
  if (phase === "running") return "Crossing";
  if (phase === "paused") return "Paused";
  if (phase === "complete") return "Stage Clear";
  return "Crashed";
}
