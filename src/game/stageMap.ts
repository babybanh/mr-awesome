import {
  GRID,
  type Direction,
  type GroundTerrain,
  type GridPoint,
  type LaneState,
  type MoveStageObjectResult,
  type RiverTuning,
  type RoadTuning,
  type StageDefinition,
  type StageEditableAssetId,
  type StageObjectKind,
  type StageParseResult,
  type StagePlacedObject,
} from "./types";

export const STAGE_1_ASSET_SKIN = {
  treePrimary: "tree03",
  treeAccent: "tree05",
  buildingPrimary: "house02",
  buildingSecondary: "house01",
} as const;

const BUILDING_ASSET_TO_TOKEN = {
  house01: "1",
  house02: "2",
  house03: "3",
  house04: "4",
  shopBar: "5",
  shopCandy: "6",
  shopCasino: "7",
  shopPizza: "8",
  industrial01: "9",
  industrial02: "10",
  industrial03: "11",
} as const satisfies Partial<Record<StageEditableAssetId, string>>;

const BUILDING_FOOTPRINTS = {
  house01: { width: 2, depth: 3 },
  house02: { width: 3, depth: 3 },
  house03: { width: 3, depth: 2 },
  house04: { width: 3, depth: 3 },
  shopBar: { width: 3, depth: 3 },
  shopCandy: { width: 2, depth: 3 },
  shopCasino: { width: 4, depth: 4 },
  shopPizza: { width: 2, depth: 3 },
  industrial01: { width: 2, depth: 4 },
  industrial02: { width: 3, depth: 4 },
  industrial03: { width: 2, depth: 4 },
} as const satisfies Partial<Record<StageEditableAssetId, { width: number; depth: number }>>;

const TREE_TOKEN_TO_ASSET = {
  "#1": "tree01",
  "#2": "tree02",
  "#3": "tree03",
  "#4": "tree04",
  "#5": "tree05",
  "#6": "parkTile01",
  "#7": "parkTile02",
  "#8": "parkTile03",
  "#9": "parkTile04",
  "#10": "grassWaterTile",
} as const satisfies Record<string, StageEditableAssetId>;

const TREE_ASSET_TO_TOKEN = {
  tree01: "1",
  tree02: "2",
  tree03: "3",
  tree04: "4",
  tree05: "5",
  parkTile01: "6",
  parkTile02: "7",
  parkTile03: "8",
  parkTile04: "9",
  grassWaterTile: "10",
} as const satisfies Partial<Record<StageEditableAssetId, string>>;

const PANCAKE_ASSET_TO_TOKEN = {
  pancake: "1",
} as const satisfies Partial<Record<StageEditableAssetId, string>>;

const BUILDING_VARIANTS = Object.keys(BUILDING_ASSET_TO_TOKEN) as StageEditableAssetId[];
const TREE_VARIANTS = Object.values(TREE_TOKEN_TO_ASSET);

export function baselineStageMap(): string {
  return `CR_STAGE_MAP v0.1
STAGE: 1
NAME: v83_apartment_groves_more_trees
MODE: authored
TARGET_MODE: fixed_goal

z=13 D  | . #5 . . . . . . B4 b4 b4 . . |
z=12 D  | . . B3 b3 b3 #5 . #5 b4 b4 b4 . #5 |
z=11 D  | . #5 b3 b3 b3 . N p b4 b4 b4 #5 . |
z=10 R> | vehicle=S speed=S gap=L density=L cover=none |
z=09 R> | vehicle=S speed=S gap=L density=L cover=none |
z=08 R> | vehicle=S speed=S gap=L density=L cover=none |
z=07 G  | #5 . . . #5 . . . p . . . #5 |
z=06 G  | . . #5 . . p . . . . #5 . . |
z=05 R< | vehicle=S speed=S gap=L density=L cover=none |
z=04 R< | vehicle=S speed=S gap=L density=L cover=none |
z=03 R< | vehicle=S speed=S gap=L density=L cover=none |
z=02 D  | . . . B6 b6 . . p . B8 b8 . . |
z=01 D  | #5 . #5 b6 b6 #5 . . . b8 b8 #5 . |
z=00 D  | . . . b6 b6 . C . p b8 b8 . . |

END`;
}

export function parseStageMap(text: string): StageParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lanes = new Map<number, LaneState>();
  const objects: StagePlacedObject[] = [];
  const expectedBuildingContinuations = new Map<string, string>();
  const lines = text.split(/\r?\n/);
  let sawHeader = false;
  let sawEnd = false;
  let stageId: 1 | undefined;
  let name = "tutorial_target";
  let mode = "authored";
  let targetMode = "fixed_goal";
  let playerStart: GridPoint | undefined;
  let target: GridPoint | undefined;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line === "END") {
      sawEnd = true;
      break;
    }
    if (line === "CR_STAGE_MAP v0.1") {
      sawHeader = true;
      continue;
    }
    if (line.startsWith("STAGE:")) {
      const parsed = Number.parseInt(line.slice(6).trim(), 10);
      if (parsed === 1) stageId = 1;
      else errors.push(`Invalid STAGE value: ${line.slice(6).trim()}. First pass only supports Stage 1.`);
      continue;
    }
    if (line.startsWith("NAME:")) {
      name = line.slice(5).trim() || name;
      continue;
    }
    if (line.startsWith("MODE:")) {
      mode = line.slice(5).trim();
      if (mode !== "authored") errors.push("Stage 1 MODE must be authored.");
      continue;
    }
    if (line.startsWith("TARGET_MODE:")) {
      targetMode = line.slice(12).trim();
      if (targetMode !== "fixed_goal") errors.push("Stage 1 TARGET_MODE must be fixed_goal.");
      continue;
    }

    const rowMatch = line.match(/^z=(\d+)\s+(G|D|R>|R<|TR|W>|W<)\s*\|\s*(.*?)\s*\|$/);
    if (!rowMatch) {
      errors.push(`Could not parse line: ${rawLine}`);
      continue;
    }

    const z = Number.parseInt(rowMatch[1] ?? "", 10);
    const code = rowMatch[2] ?? "";
    const content = rowMatch[3] ?? "";
    if (lanes.has(z)) {
      errors.push(`Duplicate lane z=${z}.`);
      continue;
    }

    const parsed = parseLane(z, code, content, expectedBuildingContinuations);
    errors.push(...parsed.errors);
    warnings.push(...parsed.warnings);
    lanes.set(z, parsed.lane);
    objects.push(...parsed.objects);
    for (const object of parsed.objects) {
      if (object.kind === "building") registerExpectedBuildingContinuations(expectedBuildingContinuations, object);
    }
    if (parsed.playerStart) {
      if (playerStart) errors.push("Exactly one C start is required; found duplicate C.");
      playerStart = parsed.playerStart;
    }
    if (parsed.target) {
      if (target) errors.push("Exactly one N target is required; found duplicate N.");
      target = parsed.target;
    }
  }

  if (!sawHeader) errors.push("Missing CR_STAGE_MAP v0.1 header.");
  if (!sawEnd) errors.push("Missing END line.");
  if (!stageId) errors.push("Missing STAGE: 1.");
  if (!playerStart) errors.push("Exactly one C start is required.");
  if (!target) errors.push("Exactly one N target is required.");

  const stage = stageId && playerStart && target
    ? rebuildStage({
        id: stageId,
        name,
        mode: "authored",
        targetMode: "fixed_goal",
        lanes,
        playerStart,
        target,
        objects,
        source: text,
        skin: STAGE_1_ASSET_SKIN,
      } satisfies StageDefinition)
    : undefined;

  if (stage) {
    const validation = validateStageDefinition(stage);
    errors.push(...validation.errors);
    warnings.push(...validation.warnings);
  }

  if (stage && errors.length === 0) {
    const normalized = serializeStageMap(stage);
    stage.source = normalized;
    return { ok: true, stage: { ...stage, source: normalized }, errors, warnings };
  }

  return { ok: errors.length === 0, stage, errors, warnings };
}

export function serializeStageMap(stage: StageDefinition): string {
  const rows = [
    "CR_STAGE_MAP v0.1",
    `STAGE: ${stage.id}`,
    `NAME: ${stage.name}`,
    `MODE: ${stage.mode}`,
    `TARGET_MODE: ${stage.targetMode}`,
    "",
  ];
  const maxZ = Math.max(...stage.lanes.keys());
  for (let z = maxZ; z >= 0; z -= 1) {
    const lane = stage.lanes.get(z);
    if (!lane) continue;
    rows.push(`z=${String(z).padStart(2, "0")} ${laneCode(lane)} | ${laneContent(stage, lane)} |`);
  }
  rows.push("", "END");
  return rows.join("\n");
}

export function validateStageMap(text: string): string {
  const result = parseStageMap(text);
  const warnings = result.warnings.length ? `\n${result.warnings.join("\n")}` : "";
  if (result.ok) return `OK: Stage ${result.stage?.id} ${result.stage?.name} is valid.${warnings}`;
  return `${result.errors.join("\n")}${warnings}`;
}

export function exportStageFeedback(buildId: string, mapText: string, state: {
  player: GridPoint;
  stage: { target: GridPoint };
  collectedPancakes: Set<string>;
  score: number;
}): string {
  return [
    "CR_FEEDBACK v0.1",
    `BUILD: ${buildId}`,
    "STAGE: 1",
    "CAMERA: map_readability",
    "ZOOM: 150%",
    "SEED: authored",
    "",
    "LIKE:",
    "  ...",
    "",
    "DISLIKE:",
    "  ...",
    "",
    "PATCH_REQUEST:",
    "  ...",
    "",
    "CURRENT_MAP:",
    mapText,
    "",
    "CURRENT_STATE:",
    `PLAYER: x=${Math.round(state.player.x)} z=${Math.round(state.player.z)}`,
    `TARGET: x=${state.stage.target.x} z=${state.stage.target.z}`,
    `PANCAKES_COLLECTED: ${state.collectedPancakes.size}`,
    `SCORE: ${state.score}`,
    "",
    "END",
  ].join("\n");
}

export function objectAt(stage: StageDefinition, point: GridPoint): StagePlacedObject | undefined {
  if (stage.target.x === point.x && stage.target.z === point.z) {
    return {
      id: `target:${stage.target.z}:${stage.target.x}`,
      kind: "target",
      x: stage.target.x,
      z: stage.target.z,
      cells: [{ ...stage.target }],
    };
  }
  return stage.objects.find((object) => object.cells.some((cell) => samePoint(cell, point)));
}

export function objectKindAt(stage: StageDefinition, point: GridPoint): StageObjectKind | undefined {
  return objectAt(stage, point)?.kind;
}

export function moveStageObject(stage: StageDefinition, from: GridPoint, to: GridPoint): MoveStageObjectResult {
  const object = objectAt(stage, from);
  if (!object) return { ok: false, message: "No editable object found at the selected tile." };
  const nextObject = shiftedObjectFromGrab(object, from, to);
  return applyObjectPlacement(stage, object, nextObject, "move");
}

export function copyStageObject(stage: StageDefinition, from: GridPoint | StagePlacedObject, to: GridPoint): MoveStageObjectResult {
  const object = "cells" in from ? from : objectAt(stage, from);
  if (!object) return { ok: false, message: "No editable object found to copy." };
  if (object.kind === "target") return { ok: false, message: "Target is unique and cannot be copied." };
  const nextObject = objectFromTemplate(object, to);
  return applyObjectPlacement(stage, undefined, nextObject, "copy");
}

export function cycleStageObjectAsset(stage: StageDefinition, point: GridPoint, delta: 1 | -1): MoveStageObjectResult {
  const object = objectAt(stage, point);
  if (!object) return { ok: false, message: "Select a house or tree first." };
  if (object.kind !== "building" && object.kind !== "tree") return { ok: false, message: "Only buildings and trees have variants right now." };

  const variants = object.kind === "building" ? BUILDING_VARIANTS : TREE_VARIANTS;
  const current = object.assetId ?? variants[0]!;
  const index = variants.indexOf(current);
  const nextAsset = variants[(index + delta + variants.length) % variants.length]! as StageEditableAssetId;
  const nextObject = object.kind === "building"
    ? {
        ...object,
        assetId: nextAsset,
        cells: buildingFootprintCells(object.x, object.z, nextAsset),
        id: objectId("building", object.x, object.z, nextAsset, buildingFootprintCells(object.x, object.z, nextAsset)),
      }
    : { ...object, assetId: nextAsset };
  return applyObjectPlacement(stage, object, nextObject, "variant");
}

function parseLane(z: number, code: string, content: string, expectedBuildingContinuations: Map<string, string>): {
  lane: LaneState;
  errors: string[];
  warnings: string[];
  objects: StagePlacedObject[];
  playerStart?: GridPoint;
  target?: GridPoint;
} {
  if (code === "TR") {
    return {
      lane: grassLane(z),
      errors: [`${code} is not supported in the Stage 1 first pass.`],
      warnings: [],
      objects: [],
    };
  }

  if (code === "W>" || code === "W<") {
    const parsedRiver = parseRiverProperties(content);
    return {
      lane: riverLane(z, code === "W>" ? 1 : -1, parsedRiver.river),
      errors: parsedRiver.errors,
      warnings: [],
      objects: [],
    };
  }

  if (code === "R>" || code === "R<") {
    const parsedRoad = parseRoadProperties(content);
    return {
      lane: roadLane(z, code === "R>" ? 1 : -1, parsedRoad.road),
      errors: parsedRoad.errors,
      warnings: [],
      objects: [],
    };
  }

  const tiles = content.split(/\s+/).filter(Boolean);
  const blockers: number[] = [];
  const buildings: number[] = [];
  const collectibles: number[] = [];
  const objects: StagePlacedObject[] = [];
  const consumed = new Set<number>();
  let playerStart: GridPoint | undefined;
  let target: GridPoint | undefined;
  const errors: string[] = [];

  if (tiles.length !== GRID.maxX - GRID.minX + 1) errors.push(`z=${z} grass row must contain 13 tile symbols.`);
  for (let index = 0; index < tiles.length; index += 1) {
    if (consumed.has(index)) continue;
    const symbol = tiles[index] ?? ".";
    const x = tokenIndexToX(index);

    if (symbol === ".") continue;
    if (symbol === "C") {
      playerStart = duplicatePoint(playerStart, { x, z }, "C", z, errors);
      continue;
    }
    if (symbol === "N") {
      target = duplicatePoint(target, { x, z }, "N", z, errors);
      continue;
    }
    if (symbol === "p" || symbol === "p1") {
      collectibles.push(x);
      objects.push(tileObject("pancake", x, z, "pancake"));
      continue;
    }
    if (/^p\d+$/.test(symbol)) {
      errors.push(`Unknown pancake symbol "${symbol}" at z=${z} x=${x}. Stage 1 only uses p or p1.`);
      continue;
    }
    if (symbol === "#" || /^#\d+$/.test(symbol)) {
      const assetId = symbol === "#" ? "tree03" : TREE_TOKEN_TO_ASSET[symbol as keyof typeof TREE_TOKEN_TO_ASSET];
      if (!assetId) {
        errors.push(`Unknown tree symbol "${symbol}" at z=${z} x=${x}.`);
        continue;
      }
      blockers.push(x);
      objects.push(tileObject("tree", x, z, assetId));
      continue;
    }
    if (symbol === "B" || /^B\d+$/.test(symbol)) {
      const parsedBuilding = parseBuilding(index, z, tiles, consumed);
      objects.push(parsedBuilding.object);
      buildings.push(...parsedBuilding.object.cells.filter((cell) => cell.z === z).map((cell) => cell.x));
      errors.push(...parsedBuilding.errors);
      continue;
    }
    if (/^b\d+$/.test(symbol)) {
      const expected = expectedBuildingContinuations.get(pointKey({ x, z }));
      if (expected === symbol) continue;
      if (expected) {
        errors.push(`Building continuation "${symbol}" at z=${z} x=${x} should be "${expected}".`);
        continue;
      }
      errors.push(`Building continuation "${symbol}" at z=${z} x=${x} needs a matching uppercase B anchor in its footprint.`);
      continue;
    }
    errors.push(`Unknown grass symbol "${symbol}" at z=${z} x=${x}.`);
  }

  return {
    lane: { ...grassLane(z, code === "D" ? "dirt" : "grass"), blockers, buildings, collectibles },
    errors,
    warnings: [],
    objects,
    playerStart,
    target,
  };
}

function parseBuilding(index: number, z: number, tiles: string[], consumed: Set<number>): { object: StagePlacedObject; errors: string[] } {
  const symbol = tiles[index] ?? "B";
  const x = tokenIndexToX(index);
  const errors: string[] = [];
  const assetId = symbol === "B" ? "house01" : buildingAssetFromToken(symbol);
  if (!assetId) errors.push(`Unknown building symbol "${symbol}" at z=${z} x=${x}.`);
  const cells = buildingFootprintCells(x, z, assetId ?? "house01");
  const token = assetId ? BUILDING_ASSET_TO_TOKEN[assetId as keyof typeof BUILDING_ASSET_TO_TOKEN] ?? "1" : "1";
  const footprint = buildingFootprint(assetId ?? "house01");

  for (let offset = 1; offset < footprint.width; offset += 1) {
    const next = index + offset;
    const expected = symbol === "B" ? "B" : `b${token}`;
    if ((tiles[next] ?? ".") === expected) {
      consumed.add(next);
    }
  }

  return {
    object: {
      id: objectId("building", x, z, assetId, cells),
      kind: "building",
      x,
      z,
      cells,
      assetId: assetId ?? "house01",
    },
    errors,
  };
}

function registerExpectedBuildingContinuations(expected: Map<string, string>, object: StagePlacedObject): void {
  const variant = BUILDING_ASSET_TO_TOKEN[(object.assetId ?? "house01") as keyof typeof BUILDING_ASSET_TO_TOKEN] ?? "1";
  for (const cell of object.cells) {
    if (cell.z >= object.z) continue;
    expected.set(pointKey(cell), `b${variant}`);
  }
}

function duplicatePoint<T>(existing: T | undefined, next: T, label: string, z: number, errors: string[]): T {
  if (existing) errors.push(`z=${z} contains duplicate ${label} symbols.`);
  return next;
}

function buildingAssetFromToken(token: string): StageEditableAssetId | undefined {
  const variant = token.slice(1);
  return BUILDING_VARIANTS.find((asset) => BUILDING_ASSET_TO_TOKEN[asset as keyof typeof BUILDING_ASSET_TO_TOKEN] === variant);
}

function grassLane(z: number, terrain: GroundTerrain = "grass"): LaneState {
  return {
    z,
    kind: "grass",
    terrain,
    direction: 1,
    blockers: [],
    buildings: [],
    collectibles: [],
    speed: 0,
    gap: 0,
    length: 0,
    phase: 0,
  };
}

function roadLane(z: number, direction: Direction, road: RoadTuning): LaneState {
  const speed = road.speedCode === "F" ? 3.25 : road.speedCode === "M" ? 2.35 : 1.55;
  const gap = road.gapCode === "S" ? 3.4 : road.gapCode === "M" ? 4.5 : 5.8;
  const length = road.vehicleSize === "L" ? 3.3 : road.vehicleSize === "M" ? 2.2 : 1.35;
  return {
    z,
    kind: "road",
    direction,
    blockers: [],
    buildings: [],
    collectibles: [],
    road,
    speed,
    gap,
    length,
    phase: stablePhase(z, direction),
  };
}

function riverLane(z: number, direction: Direction, river: RiverTuning): LaneState {
  const speed = river.speedCode === "F" ? 2.8 : river.speedCode === "M" ? 2 : 1.4;
  const gap = river.gapCode === "S" ? 3.4 : river.gapCode === "L" ? 7 : 5;
  const length = river.logSize === "L" ? 4.4 : river.logSize === "S" ? 1.85 : 3;
  return {
    z,
    kind: "river",
    direction,
    blockers: [],
    buildings: [],
    collectibles: [],
    river,
    speed,
    gap,
    length,
    phase: stablePhase(z, direction),
  };
}

function parseRoadProperties(content: string): { road: RoadTuning; errors: string[] } {
  const props = Object.fromEntries(content.split(/\s+/).map((part) => part.split("=")).filter((part) => part.length === 2));
  const cover = typeof props.cover === "string" ? props.cover : "none";
  const errors = cover === "none" ? [] : ["Stage 1 road cover must be cover=none."];
  return {
    road: {
      vehicleSize: props.vehicle === "M" || props.vehicle === "L" ? props.vehicle : "S",
      speedCode: props.speed === "M" || props.speed === "F" ? props.speed : "S",
      gapCode: props.gap === "S" || props.gap === "M" ? props.gap : "L",
      densityCode: props.density === "M" || props.density === "H" ? props.density : "L",
      cover: "none",
    },
    errors,
  };
}

function parseRiverProperties(content: string): { river: RiverTuning; errors: string[] } {
  const props = Object.fromEntries(content.split(/\s+/).map((part) => part.split("=")).filter((part) => part.length === 2));
  const unknownKeys = Object.keys(props).filter((key) => key !== "log" && key !== "speed" && key !== "gap");
  const errors = [
    ...unknownKeys.map((key) => `Unknown river property "${key}". Use log, speed, and gap.`),
  ];
  if (props.log && props.log !== "S" && props.log !== "M" && props.log !== "L") errors.push(`Invalid river log value "${props.log}". Use S, M, or L.`);
  if (props.speed && props.speed !== "S" && props.speed !== "M" && props.speed !== "F") errors.push(`Invalid river speed value "${props.speed}". Use S, M, or F.`);
  if (props.gap && props.gap !== "S" && props.gap !== "M" && props.gap !== "L") errors.push(`Invalid river gap value "${props.gap}". Use S, M, or L.`);
  if (containsGrassObjectSymbol(content)) errors.push("Objects, C, and N cannot be placed on river lanes.");
  return {
    river: {
      logSize: props.log === "S" || props.log === "L" ? props.log : "M",
      speedCode: props.speed === "M" || props.speed === "F" ? props.speed : "S",
      gapCode: props.gap === "S" || props.gap === "L" ? props.gap : "M",
    },
    errors,
  };
}

function containsGrassObjectSymbol(content: string): boolean {
  return content.split(/\s+/).some((token) => (
    token === "C" ||
    token === "N" ||
    token === "B" ||
    /^B\d+$/.test(token) ||
    /^b\d+$/.test(token) ||
    token === "#" ||
    /^#\d+$/.test(token) ||
    token === "p" ||
    /^p\d+$/.test(token)
  ));
}

function validateStageDefinition(stage: StageDefinition): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const startLane = stage.lanes.get(stage.playerStart.z);
  const targetLane = stage.lanes.get(stage.target.z);
  const occupied = new Map<string, StagePlacedObject>();

  if (startLane?.kind !== "grass") errors.push("C must be on a ground row.");
  if (targetLane?.kind !== "grass") errors.push("N must be on a ground row.");

  for (const object of stage.objects) {
    if (object.kind === "building" && !isBuildingFootprint(object)) errors.push(`Building at x=${object.x} z=${object.z} must match its asset footprint.`);
    for (const cell of object.cells) {
      const lane = stage.lanes.get(cell.z);
      if (cell.x < GRID.minX || cell.x > GRID.maxX || lane?.kind !== "grass") {
        errors.push(`${object.kind} at x=${cell.x} z=${cell.z} must be on a ground tile inside the Stage 1 grid.`);
      }
      const key = pointKey(cell);
      const previous = occupied.get(key);
      if (previous && previous.id !== object.id) errors.push(`Multiple objects occupy x=${cell.x} z=${cell.z}.`);
      occupied.set(key, object);
    }
  }

  if (occupied.has(pointKey(stage.playerStart))) errors.push("C start must not overlap an editable object.");
  if (occupied.has(pointKey(stage.target))) errors.push("Target must not be on a blocker, building, or pancake.");
  if (isTargetBoxed(stage)) errors.push("Target is boxed in by blockers or buildings.");
  if (!hasRoughPath(stage)) errors.push("No rough forward path from C to N; check full blocker walls.");

  for (const lane of stage.lanes.values()) {
    if (lane.kind !== "grass") continue;
    const blocked = new Set([...lane.blockers, ...lane.buildings]);
    if (blocked.size >= GRID.maxX - GRID.minX + 1) errors.push(`ERROR: Full blocker wall detected at z=${lane.z}.`);
    for (const x of lane.buildings) {
      const front = stage.lanes.get(lane.z - 1);
      if (front?.kind === "grass" && (front.blockers.includes(x) || front.buildings.includes(x))) {
        warnings.push(`WARNING: Tree/building directly in front of a house at x=${x} z=${lane.z}.`);
      }
    }
  }

  return { errors, warnings };
}

function isTargetBoxed(stage: StageDefinition): boolean {
  const neighbors = [
    { x: stage.target.x, z: stage.target.z - 1 },
    { x: stage.target.x, z: stage.target.z + 1 },
    { x: stage.target.x - 1, z: stage.target.z },
    { x: stage.target.x + 1, z: stage.target.z },
  ];
  return neighbors.every((neighbor) => isBlockedTile(stage, neighbor));
}

function isBlockedTile(stage: StageDefinition, point: GridPoint): boolean {
  if (point.x < GRID.minX || point.x > GRID.maxX || point.z < 0) return true;
  const lane = stage.lanes.get(point.z);
  if (!lane) return true;
  return lane.kind === "grass" && (lane.blockers.includes(point.x) || lane.buildings.includes(point.x));
}

function hasRoughPath(stage: StageDefinition): boolean {
  let reachable = new Set([stage.playerStart.x]);
  for (let z = stage.playerStart.z + 1; z <= stage.target.z; z += 1) {
    const lane = stage.lanes.get(z);
    const blocked = new Set(lane?.kind === "grass" ? [...lane.blockers, ...lane.buildings] : []);
    const next = new Set<number>();
    for (const x of reachable) {
      for (const nx of [x - 1, x, x + 1]) {
        if (nx < GRID.minX || nx > GRID.maxX || blocked.has(nx)) continue;
        next.add(nx);
      }
    }
    if (!next.size) return false;
    reachable = next;
  }
  return reachable.has(stage.target.x);
}

function laneCode(lane: LaneState): string {
  if (lane.kind === "grass") return lane.terrain === "dirt" ? "D " : "G ";
  if (lane.kind === "river") return lane.direction === 1 ? "W>" : "W<";
  return lane.direction === 1 ? "R>" : "R<";
}

function laneContent(stage: StageDefinition, lane: LaneState): string {
  if (lane.kind === "road") {
    const road = lane.road ?? { vehicleSize: "S", speedCode: "S", gapCode: "L", densityCode: "L", cover: "none" };
    return `vehicle=${road.vehicleSize} speed=${road.speedCode} gap=${road.gapCode} density=${road.densityCode} cover=none`;
  }
  if (lane.kind === "river") {
    const river = lane.river ?? { logSize: "M", speedCode: "S", gapCode: "M" };
    return `log=${river.logSize} speed=${river.speedCode} gap=${river.gapCode}`;
  }

  const tiles = Array.from({ length: GRID.maxX - GRID.minX + 1 }, () => ".");
  for (const object of stage.objects.filter((item) => item.cells.some((cell) => cell.z === lane.z))) {
    writeObjectTokens(tiles, object, lane.z);
  }
  if (stage.playerStart.z === lane.z) tiles[xToTokenIndex(stage.playerStart.x)] = "C";
  if (stage.target.z === lane.z) tiles[xToTokenIndex(stage.target.x)] = "N";
  return tiles.join(" ");
}

function writeObjectTokens(tiles: string[], object: StagePlacedObject, laneZ: number): void {
  if (object.kind === "pancake") {
    const token = PANCAKE_ASSET_TO_TOKEN[(object.assetId ?? "pancake") as keyof typeof PANCAKE_ASSET_TO_TOKEN] ?? "1";
    tiles[xToTokenIndex(object.x)] = `p${token}`;
    return;
  }
  if (object.kind === "tree") {
    const asset = object.assetId === "tree05" ? "tree05" : "tree03";
    const token = TREE_ASSET_TO_TOKEN[(object.assetId ?? asset) as keyof typeof TREE_ASSET_TO_TOKEN] ?? TREE_ASSET_TO_TOKEN.tree03;
    tiles[xToTokenIndex(object.x)] = `#${token}`;
    return;
  }
  if (object.kind !== "building") return;
  const variant = BUILDING_ASSET_TO_TOKEN[(object.assetId ?? "house01") as keyof typeof BUILDING_ASSET_TO_TOKEN] ?? BUILDING_ASSET_TO_TOKEN.house01;
  const cells = object.cells
    .filter((cell) => cell.z === laneZ)
    .sort((a, b) => xToTokenIndex(a.x) - xToTokenIndex(b.x));
  cells.forEach((cell) => {
    tiles[xToTokenIndex(cell.x)] = cell.x === object.x && cell.z === object.z ? `B${variant}` : `b${variant}`;
  });
}

function applyObjectPlacement(
  stage: StageDefinition,
  existing: StagePlacedObject | undefined,
  nextObject: StagePlacedObject,
  mode: "move" | "copy" | "variant",
): MoveStageObjectResult {
  const validation = canPlaceObject(stage, nextObject, existing);
  if (!validation.ok) return { ok: false, message: validation.message };

  if (nextObject.kind === "target") {
    const nextStage = rebuildStage({
      ...stage,
      target: { x: nextObject.x, z: nextObject.z },
      objects: cloneObjects(stage.objects),
    });
    const mapText = serializeStageMap(nextStage);
    return { ok: true, message: "Moved target.", stage: { ...nextStage, source: mapText }, mapText, object: nextObject };
  }

  const nextObjects = existing
    ? stage.objects.map((object) => object.id === existing.id ? nextObject : cloneObject(object))
    : [...cloneObjects(stage.objects), nextObject];
  const nextStage = rebuildStage({ ...stage, objects: nextObjects });
  const mapText = serializeStageMap(nextStage);
  const message = mode === "copy" ? "Copied object." : mode === "variant" ? "Changed asset variant." : "Moved object.";
  return { ok: true, message, stage: { ...nextStage, source: mapText }, mapText, object: nextObject };
}

function canPlaceObject(stage: StageDefinition, object: StagePlacedObject, existing?: StagePlacedObject): { ok: boolean; message: string } {
  if (!object.cells.length) return { ok: false, message: "Object has no footprint." };
  if (object.kind === "building" && !isBuildingFootprint(object)) return { ok: false, message: "Building footprint does not match its asset size." };

  const existingKeys = new Set(existing?.cells.map(pointKey) ?? []);
  const seen = new Set<string>();
  for (const cell of object.cells) {
    if (cell.x < GRID.minX || cell.x > GRID.maxX || cell.z < 0) return { ok: false, message: "Target tile is outside the Stage 1 grid." };
    const lane = stage.lanes.get(cell.z);
    if (!lane || lane.kind !== "grass") return { ok: false, message: "Objects can only be placed on ground rows." };
    const key = pointKey(cell);
    if (seen.has(key)) return { ok: false, message: "Object footprint contains duplicate tiles." };
    seen.add(key);
    if (!existingKeys.has(key) && stage.playerStart.x === cell.x && stage.playerStart.z === cell.z) return { ok: false, message: "Objects cannot overlap Mr. Awesome's start tile." };
    if (!existingKeys.has(key) && stage.target.x === cell.x && stage.target.z === cell.z && object.kind !== "target") return { ok: false, message: "Objects cannot overlap Mr. Not So Awesome." };
    const occupied = objectAt(stage, cell);
    if (occupied && occupied.id !== existing?.id) return { ok: false, message: "That tile is occupied or invalid for this object." };
  }
  return { ok: true, message: "OK" };
}

function rebuildStage(stage: StageDefinition): StageDefinition {
  const lanes = cloneLanesWithoutObjects(stage.lanes);
  for (const lane of lanes.values()) {
    lane.blockers = [];
    lane.buildings = [];
    lane.collectibles = [];
  }

  for (const object of stage.objects) {
    for (const cell of object.cells) {
      const lane = lanes.get(cell.z);
      if (!lane || lane.kind !== "grass") continue;
      if (object.kind === "tree") lane.blockers.push(cell.x);
      if (object.kind === "building") lane.buildings.push(cell.x);
      if (object.kind === "pancake") lane.collectibles.push(cell.x);
    }
  }

  for (const lane of lanes.values()) {
    lane.blockers.sort((a, b) => a - b);
    lane.buildings.sort((a, b) => a - b);
    lane.collectibles.sort((a, b) => a - b);
  }

  return { ...stage, lanes, objects: cloneObjects(stage.objects) };
}

function shiftedObjectFromGrab(object: StagePlacedObject, grabbed: GridPoint, to: GridPoint): StagePlacedObject {
  const dx = to.x - grabbed.x;
  const dz = to.z - grabbed.z;
  const cells = object.cells.map((cell) => ({ x: cell.x + dx, z: cell.z + dz }));
  return {
    ...object,
    x: object.x + dx,
    z: object.z + dz,
    cells,
    id: objectId(object.kind, object.x + dx, object.z + dz, object.assetId, cells),
  };
}

function objectFromTemplate(object: StagePlacedObject, to: GridPoint): StagePlacedObject {
  const dx = to.x - object.x;
  const dz = to.z - object.z;
  const cells = object.cells.map((cell) => ({ x: cell.x + dx, z: cell.z + dz }));
  return {
    ...object,
    x: to.x,
    z: to.z,
    cells,
    id: objectId(object.kind, to.x, to.z, object.assetId, cells),
  };
}

function tileObject(kind: "tree" | "pancake", x: number, z: number, assetId?: StageEditableAssetId): StagePlacedObject {
  const cells = [{ x, z }];
  return {
    id: objectId(kind, x, z, assetId, cells),
    kind,
    x,
    z,
    cells,
    assetId,
  };
}

function objectId(kind: StageObjectKind, x: number, z: number, assetId: StageEditableAssetId | undefined, cells: GridPoint[]): string {
  const footprint = cells.map((cell) => `${cell.x}:${cell.z}`).join(",");
  return `${kind}:${assetId ?? "default"}:${x}:${z}:${footprint}`;
}

function isBuildingFootprint(object: StagePlacedObject): boolean {
  const expected = buildingFootprintCells(object.x, object.z, object.assetId ?? "house01").map(pointKey).sort();
  const actual = object.cells.map(pointKey).sort();
  return expected.length === actual.length && expected.every((key, index) => key === actual[index]);
}

function buildingFootprint(assetId: StageEditableAssetId): { width: number; depth: number } {
  return BUILDING_FOOTPRINTS[assetId as keyof typeof BUILDING_FOOTPRINTS] ?? BUILDING_FOOTPRINTS.house01;
}

function buildingFootprintCells(x: number, z: number, assetId: StageEditableAssetId): GridPoint[] {
  const footprint = buildingFootprint(assetId);
  const cells: GridPoint[] = [];
  for (let dz = 0; dz < footprint.depth; dz += 1) {
    for (let dx = 0; dx < footprint.width; dx += 1) {
      cells.push({ x: x - dx, z: z - dz });
    }
  }
  return cells;
}

function tokenIndexToX(index: number): number {
  return GRID.maxX - index;
}

function xToTokenIndex(x: number): number {
  return GRID.maxX - x;
}

function cloneLanesWithoutObjects(lanes: Map<number, LaneState>): Map<number, LaneState> {
  return new Map(Array.from(lanes.entries()).map(([z, lane]) => [z, {
    ...lane,
    blockers: [...lane.blockers],
      buildings: [...lane.buildings],
      collectibles: [...lane.collectibles],
      road: lane.road ? { ...lane.road } : undefined,
      river: lane.river ? { ...lane.river } : undefined,
    }]));
}

function cloneObjects(objects: StagePlacedObject[]): StagePlacedObject[] {
  return objects.map(cloneObject);
}

function cloneObject(object: StagePlacedObject): StagePlacedObject {
  return {
    ...object,
    cells: object.cells.map((cell) => ({ ...cell })),
  };
}

function samePoint(a: GridPoint, b: GridPoint): boolean {
  return a.x === b.x && a.z === b.z;
}

function pointKey(point: GridPoint): string {
  return `${point.x}:${point.z}`;
}

function stablePhase(z: number, direction: Direction): number {
  const raw = Math.sin((z + 3) * 12.9898) * 43758.5453;
  return (raw - Math.floor(raw)) * 7 * direction;
}
