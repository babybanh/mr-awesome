import { GRID, PLAYER, type GameAction, type GamePhase, type GameState, type LaneState, type MoveAction, type MovingSpan, type StageDefinition } from "./types";
import { baselineStageMap, parseStageMap } from "./stageMap";

const BEST_SCORE_KEY = "awesome-superhero.best-score";

const MOVE_DELTAS: Record<MoveAction, { dx: number; dz: number }> = {
  forward: { dx: 0, dz: 1 },
  backward: { dx: 0, dz: -1 },
  left: { dx: 1, dz: 0 },
  right: { dx: -1, dz: 0 },
};

interface ActionOptions {
  allowMoveFromTerminal?: boolean;
}

interface TickOptions {
  hazardsEnabled?: boolean;
  stageCompletionEnabled?: boolean;
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
      target: { ...stage.target, visible: true },
      targetReachCompletesStage: true,
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
  if (action === "restart") return createInitialState(state.stageMap, state.runId + 1, Math.max(state.bestScore, state.score));
  if (action === "pause") return togglePause(state);
  if (state.phase === "paused") return state;
  if ((state.phase === "crashed" || state.phase === "complete") && !options.allowMoveFromTerminal) return state;
  const moveState = options.allowMoveFromTerminal && (state.phase === "crashed" || state.phase === "complete")
    ? { ...state, phase: "running" as GamePhase, crashReason: undefined, stage: { ...state.stage, lastEvent: undefined } }
    : state;
  if (moveState.player.hop) return { ...moveState, queuedMove: { move: action, ttl: PLAYER.inputBufferSeconds } };
  return startMove(moveState, action);
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
  next = advanceHop(next, delta);
  if (hazardsEnabled) next = detectHazards(next);
  if (stageCompletionEnabled) next = updateStageCompletion(next);

  if (!next.player.hop && next.queuedMove && next.queuedMove.ttl > 0 && next.phase !== "crashed" && next.phase !== "complete") {
    const queued = next.queuedMove.move;
    next = startMove({ ...next, queuedMove: undefined }, queued);
  } else if (next.queuedMove && next.queuedMove.ttl <= 0) {
    next = { ...next, queuedMove: undefined };
  }

  if (hazardsEnabled) next = carryOnRiver(next, delta);
  if (hazardsEnabled) next = detectHazards(next);
  if (stageCompletionEnabled) next = updateStageCompletion(next);
  return next;
}

export function applyStage(state: GameState, stage: StageDefinition, mapText: string): GameState {
  return {
    ...createInitialState(mapText, state.runId + 1, Math.max(state.bestScore, state.score)),
    stageMap: mapText,
    lanes: cloneLanes(stage.lanes),
    stageObjects: cloneObjects(stage.objects),
  };
}

export function getMovingSpans(lane: LaneState, time: number, minX = GRID.visibleMinX - 4, maxX = GRID.visibleMaxX + 4): MovingSpan[] {
  if (lane.kind !== "road" && lane.kind !== "river") return [];
  const period = Math.max(lane.length + lane.gap, lane.length + 1);
  const motion = lane.phase + lane.direction * lane.speed * time;
  const first = Math.floor((minX - motion) / period) - 2;
  const last = Math.ceil((maxX - motion) / period) + 2;
  const spans: MovingSpan[] = [];
  for (let index = first; index <= last; index += 1) {
    const centerX = motion + index * period;
    if (centerX + lane.length / 2 < minX || centerX - lane.length / 2 > maxX) continue;
    spans.push({
      kind: lane.kind === "river" ? "platform" : "vehicle",
      centerX,
      z: lane.z,
      length: lane.length,
      direction: lane.direction,
      color: lane.kind === "river" ? 0x99653d : lane.direction === 1 ? 0x4e8ed8 : 0xd85d5d,
      label: lane.kind === "river" ? "Log" : "Vehicle",
    });
  }
  return spans;
}

export function getPlayerDisplayPosition(state: GameState): { x: number; z: number; y: number; hopProgress: number } {
  const hop = state.player.hop;
  if (!hop) return { x: state.player.x, z: state.player.z, y: 0, hopProgress: 1 };
  const progress = Math.min(1, Math.max(0, hop.elapsed / hop.duration));
  return {
    x: hop.fromX + (hop.toX - hop.fromX) * progress,
    z: hop.fromZ + (hop.toZ - hop.fromZ) * progress,
    y: Math.sin(Math.PI * progress) * PLAYER.hopArcHeight,
    hopProgress: progress,
  };
}

export function pancakeKey(x: number, z: number): string {
  return `${z}:${x}`;
}

export function readBestScore(): number {
  const parsed = Number.parseInt(window.localStorage.getItem(BEST_SCORE_KEY) ?? "0", 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function writeBestScore(score: number): void {
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

function startMove(state: GameState, move: MoveAction): GameState {
  const delta = MOVE_DELTAS[move];
  const targetX = clamp(Math.round(state.player.x) + delta.dx, GRID.minX, GRID.maxX);
  const maxLaneZ = Math.max(...state.lanes.keys());
  const targetZ = clamp(Math.round(state.player.z) + delta.dz, 0, maxLaneZ);
  const lane = state.lanes.get(targetZ);
  if (!lane) return state;
  if (lane?.kind === "grass" && (lane.blockers.includes(targetX) || lane.buildings.includes(targetX))) return state;
  return {
    ...state,
    phase: state.phase === "ready" ? "running" : state.phase,
    player: {
      ...state.player,
      hop: {
        fromX: state.player.x,
        fromZ: state.player.z,
        toX: targetX,
        toZ: targetZ,
        elapsed: 0,
        duration: PLAYER.hopDuration,
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
  const collectedPancakes = collectPancake(state, landedX, landedZ);
  if (bestScore > state.bestScore) writeBestScore(bestScore);
  return {
    ...state,
    score,
    bestScore,
    collectedPancakes,
    player: { x: hop.toX, z: landedZ, maxZ },
  };
}

function collectPancake(state: GameState, x: number, z: number): Set<string> {
  const lane = state.lanes.get(z);
  if (!lane?.collectibles.includes(x)) return state.collectedPancakes;
  const key = pancakeKey(x, z);
  if (state.collectedPancakes.has(key)) return state.collectedPancakes;
  const collected = new Set(state.collectedPancakes);
  collected.add(key);
  return collected;
}

function carryOnRiver(state: GameState, delta: number): GameState {
  if (state.phase !== "running" || state.player.hop) return state;
  const lane = state.lanes.get(Math.round(state.player.z));
  if (lane?.kind !== "river") return state;
  if (!platformUnderPlayer(state, lane.z)) return state;
  const carriedX = state.player.x + lane.direction * lane.speed * delta;
  if (carriedX < GRID.minX || carriedX > GRID.maxX) {
    return crashGame({ ...state, player: { ...state.player, x: carriedX } }, "River edge");
  }
  return { ...state, player: { ...state.player, x: carriedX } };
}

function detectHazards(state: GameState): GameState {
  if (state.phase !== "running" || state.player.hop) return state;
  const lane = state.lanes.get(Math.round(state.player.z));
  if (lane?.kind === "road") {
    const hit = getMovingSpans(lane, state.time).some((span) => Math.abs(state.player.x - span.centerX) <= span.length / 2 + PLAYER.hitboxWidth / 2);
    return hit ? crashGame(state, "Traffic") : state;
  }
  if (lane?.kind === "river" && !platformUnderPlayer(state, lane.z)) return crashGame(state, "Water");
  return state;
}

function platformUnderPlayer(state: GameState, z: number): boolean {
  const lane = state.lanes.get(z);
  if (lane?.kind !== "river") return false;
  return getMovingSpans(lane, state.time).some((span) => Math.abs(state.player.x - span.centerX) <= span.length / 2 + PLAYER.hitboxWidth / 2);
}

function crashGame(state: GameState, crashReason: string): GameState {
  const bestScore = Math.max(state.bestScore, state.score);
  writeBestScore(bestScore);
  return { ...state, phase: "crashed", bestScore, crashReason };
}

function updateStageCompletion(state: GameState): GameState {
  if (state.phase === "complete" || state.phase === "crashed") return state;
  if (!state.stage.targetReachCompletesStage) return state;
  const playerX = Math.round(state.player.x);
  const playerZ = Math.round(state.player.z);
  if (playerX !== state.stage.target.x || playerZ !== state.stage.target.z) return state;
  const bestScore = Math.max(state.bestScore, state.score);
  writeBestScore(bestScore);
  return {
    ...state,
    phase: "complete",
    bestScore,
    stage: { ...state.stage, lastEvent: "Stage clear" },
  };
}

function cloneLanes(lanes: Map<number, LaneState>): Map<number, LaneState> {
  return new Map(Array.from(lanes.entries()).map(([z, lane]) => [z, {
    ...lane,
    blockers: [...lane.blockers],
    buildings: [...lane.buildings],
    collectibles: [...lane.collectibles],
    road: lane.road ? { ...lane.road } : undefined,
    river: lane.river ? { ...lane.river } : undefined,
  }]));
}

function cloneObjects(objects: StageDefinition["objects"]): StageDefinition["objects"] {
  return objects.map((object) => ({
    ...object,
    cells: object.cells.map((cell) => ({ ...cell })),
  }));
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
