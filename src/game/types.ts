export const GRID = {
  minX: -6,
  maxX: 6,
  visibleMinX: -8,
  visibleMaxX: 8,
  tileSize: 1,
} as const;

export const PLAYER = {
  hopDuration: 0.13,
  inputBufferSeconds: 0.1,
  hopArcHeight: 0.34,
  hitboxWidth: 0.58,
} as const;

export type LaneKind = "grass" | "road" | "river" | "train";
export type GroundTerrain = "grass" | "dirt";
export type Direction = -1 | 1;
export type GamePhase = "ready" | "running" | "paused" | "crashed" | "complete";
export type StagePlayMode = "introPancakes" | "summoning" | "chase" | "finalSequence" | "postVictoryTutorial";
export type MoveAction = "forward" | "backward" | "left" | "right";
export type GameAction = MoveAction | "pause" | "restart";
export type StageObjectKind = "tree" | "building" | "pancake" | "target" | "warning" | "billboard";
export type StageAssetId =
  | "house01"
  | "house02"
  | "house03"
  | "house04"
  | "shopBar"
  | "shopCandy"
  | "shopCasino"
  | "shopPizza"
  | "industrial01"
  | "industrial02"
  | "industrial03"
  | "tree03"
  | "tree05"
  | "tree01"
  | "tree02"
  | "tree04"
  | "pancake"
  | "warningSign01"
  | "warningSign02"
  | "billboard01"
  | "billboard02";
export type StageEditableAssetId = StageAssetId;

export interface StageAssetSkin {
  treePrimary: "tree03";
  treeAccent: "tree05";
  buildingPrimary: "house02";
  buildingSecondary: "house01";
}

export interface RoadTuning {
  vehicleSize: "S" | "M" | "L";
  speedCode: "S" | "M" | "F";
  gapCode: "S" | "M" | "L";
  densityCode: "L" | "M" | "H";
  colorScheme: "direction" | "mixed" | "red" | "blue" | "yellow" | "mint" | "purple" | "orange";
  seed: number;
  cover: "none";
}

export interface RiverTuning {
  logSize: "S" | "M" | "L";
  speedCode: "S" | "M" | "F";
  gapCode: "S" | "M" | "L";
}

export interface TrainTuning {
  trainSize: "S" | "M" | "L";
  speedCode: "S" | "M" | "F";
  gapCode: "S" | "M" | "L";
  warnCode: "S" | "M" | "L";
}

export interface LaneState {
  z: number;
  kind: LaneKind;
  terrain?: GroundTerrain;
  direction: Direction;
  blockers: number[];
  buildings: number[];
  collectibles: number[];
  road?: RoadTuning;
  river?: RiverTuning;
  train?: TrainTuning;
  speed: number;
  gap: number;
  length: number;
  phase: number;
}

export interface StagePlacedObject {
  id: string;
  kind: StageObjectKind;
  x: number;
  z: number;
  cells: GridPoint[];
  assetId?: StageEditableAssetId;
}

export interface StageDefinition {
  id: 1;
  name: string;
  mode: "authored";
  targetMode: "fixed_goal";
  lanes: Map<number, LaneState>;
  playerStart: GridPoint;
  target: GridPoint;
  objects: StagePlacedObject[];
  source: string;
  skin: StageAssetSkin;
}

export interface StageRuntime {
  id: 1;
  name: string;
  mode: StagePlayMode;
  playerStart: GridPoint;
  target: GridPoint & { visible: boolean };
  summonMarker: GridPoint;
  firstPancakeAt?: number;
  summonStartedAt?: number;
  revealConversationAdvanceSeconds?: number;
  stolenPancakes: Set<string>;
  stolenPancakesStartedAt?: number;
  targetSpawnHistory: GridPoint[];
  targetEscape?: GridPoint & { startedAt: number };
  targetPending?: GridPoint;
  targetRevealAt?: number;
  introCameraHandoffDone: boolean;
  introCameraHandoffStartedAt?: number;
  introCameraHandoffReleaseAt?: number;
  catchCount: number;
  finalStartedAt?: number;
  finalRescueStartedAt?: number;
  finalPoofStartedAt?: number;
  postVictoryStartedAt?: number;
  targetReachCompletesStage: boolean;
  lastEvent?: string;
}

export interface GridPoint {
  x: number;
  z: number;
}

export interface HopState {
  fromX: number;
  fromZ: number;
  toX: number;
  toZ: number;
  elapsed: number;
  duration: number;
}

export interface PlayerState extends GridPoint {
  maxZ: number;
  hop?: HopState;
}

export interface QueuedMove {
  move: MoveAction;
  ttl: number;
}

export interface MovingSpan {
  kind: "vehicle" | "platform" | "train";
  centerX: number;
  z: number;
  length: number;
  direction: Direction;
  color: number;
  label: string;
}

export interface GameState {
  runId: number;
  phase: GamePhase;
  player: PlayerState;
  stage: StageRuntime;
  stageMap: string;
  lanes: Map<number, LaneState>;
  stageObjects: StagePlacedObject[];
  time: number;
  score: number;
  bestScore: number;
  collectedPancakes: Set<string>;
  queuedMove?: QueuedMove;
  crashReason?: string;
}

export interface StageParseResult {
  ok: boolean;
  stage?: StageDefinition;
  errors: string[];
  warnings: string[];
}

export interface MoveStageObjectResult {
  ok: boolean;
  message: string;
  stage?: StageDefinition;
  mapText?: string;
  object?: StagePlacedObject;
}
