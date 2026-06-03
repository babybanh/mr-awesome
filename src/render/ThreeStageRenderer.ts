import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { GRID, type GameState, type GridPoint, type LaneState, type StageAssetId, type StageObjectKind, type StagePlacedObject } from "../game/types";
import { getMovingSpans, getPlayerDisplayPosition, pancakeKey } from "../game/simulation";

const ASSET_PATHS = {
  player: "/assets/characters/TexturedMeshBright.glb",
  target: "/assets/characters/MrNotSoAwesomeTexturedBright.glb",
  pancake: "/assets/collectibles/PancakeTexturedBright.glb",
  house01: {
    obj: "/assets/voxel-town-set/Houses/House01/House01.obj",
    mtl: "/assets/voxel-town-set/Houses/House01/House01.mtl",
  },
  house02: {
    obj: "/assets/voxel-town-set/Houses/House02/House02.obj",
    mtl: "/assets/voxel-town-set/Houses/House02/House02.mtl",
  },
  house03: {
    obj: "/assets/voxel-town-set/Houses/House03/House03.obj",
    mtl: "/assets/voxel-town-set/Houses/House03/House03.mtl",
  },
  house04: {
    obj: "/assets/voxel-town-set/Houses/House04/House04.obj",
    mtl: "/assets/voxel-town-set/Houses/House04/House04.mtl",
  },
  shopBar: {
    obj: "/assets/voxel-town-set/Shops/Bar/Bar.obj",
    mtl: "/assets/voxel-town-set/Shops/Bar/Bar.mtl",
  },
  shopCandy: {
    obj: "/assets/voxel-town-set/Shops/CandyShop/CandyShop.obj",
    mtl: "/assets/voxel-town-set/Shops/CandyShop/CandyShop.mtl",
  },
  shopCasino: {
    obj: "/assets/voxel-town-set/Shops/Casino/Casino.obj",
    mtl: "/assets/voxel-town-set/Shops/Casino/Casino.mtl",
  },
  shopPizza: {
    obj: "/assets/voxel-town-set/Shops/PizzaPlace/PizzaPlace.obj",
    mtl: "/assets/voxel-town-set/Shops/PizzaPlace/PizzaPlace.mtl",
  },
  industrial01: {
    obj: "/assets/voxel-town-set/IndustrialBuildings/Building01/Building01.obj",
    mtl: "/assets/voxel-town-set/IndustrialBuildings/Building01/Building01.mtl",
  },
  industrial02: {
    obj: "/assets/voxel-town-set/IndustrialBuildings/Building02/Building02.obj",
    mtl: "/assets/voxel-town-set/IndustrialBuildings/Building02/Building02.mtl",
  },
  industrial03: {
    obj: "/assets/voxel-town-set/IndustrialBuildings/Building03/Building03.obj",
    mtl: "/assets/voxel-town-set/IndustrialBuildings/Building03/Building03.mtl",
  },
  tree03: {
    obj: "/assets/voxel-town-set/GrassAndTrees/Tree03/Tree03.obj",
    mtl: "/assets/voxel-town-set/GrassAndTrees/Tree03/Tree03.mtl",
  },
  tree05: {
    obj: "/assets/voxel-town-set/GrassAndTrees/Tree05/Tree05.obj",
    mtl: "/assets/voxel-town-set/GrassAndTrees/Tree05/Tree05.mtl",
  },
  tree01: {
    obj: "/assets/voxel-town-set/GrassAndTrees/Tree01/Tree01.obj",
    mtl: "/assets/voxel-town-set/GrassAndTrees/Tree01/Tree01.mtl",
  },
  tree02: {
    obj: "/assets/voxel-town-set/GrassAndTrees/Tree02/Tree02.obj",
    mtl: "/assets/voxel-town-set/GrassAndTrees/Tree02/Tree02.mtl",
  },
  tree04: {
    obj: "/assets/voxel-town-set/GrassAndTrees/Tree04/Tree04.obj",
    mtl: "/assets/voxel-town-set/GrassAndTrees/Tree04/Tree04.mtl",
  },
  parkTile01: {
    obj: "/assets/voxel-town-set/GrassAndTrees/ParkTiles/ParkTile01/ParTile01.obj",
    mtl: "/assets/voxel-town-set/GrassAndTrees/ParkTiles/ParkTile01/ParTile01.mtl",
  },
  parkTile02: {
    obj: "/assets/voxel-town-set/GrassAndTrees/ParkTiles/PArkTile02/ParkTile02.obj",
    mtl: "/assets/voxel-town-set/GrassAndTrees/ParkTiles/PArkTile02/ParkTile02.mtl",
  },
  parkTile03: {
    obj: "/assets/voxel-town-set/GrassAndTrees/ParkTiles/ParkTile03/ParkTile03.obj",
    mtl: "/assets/voxel-town-set/GrassAndTrees/ParkTiles/ParkTile03/ParkTile03.mtl",
  },
  parkTile04: {
    obj: "/assets/voxel-town-set/GrassAndTrees/ParkTiles/ParkTile04/ParkTile04.obj",
    mtl: "/assets/voxel-town-set/GrassAndTrees/ParkTiles/ParkTile04/ParkTile04.mtl",
  },
  grassWaterTile: {
    obj: "/assets/voxel-town-set/GrassAndTrees/ParkTiles/GrassWaterTile/Grass_Water.obj",
    mtl: "/assets/voxel-town-set/GrassAndTrees/ParkTiles/GrassWaterTile/Grass_Water.mtl",
  },
} as const;

type ModelKey = keyof typeof ASSET_PATHS;

const PALETTE = {
  background: 0xbee8ef,
  grassBase: 0x83d178,
  grassAlt: 0x78c96e,
  grassLine: 0xcce89d,
  dirtBase: 0xc9ad68,
  dirtAlt: 0xb99b58,
  dirtMark: 0x9d7f45,
  roadBase: 0x4f545b,
  roadAlt: 0x444a50,
  roadMarking: 0xe9ece7,
  riverBase: 0x42a6d9,
  riverAlt: 0x3896ca,
  waterMark: 0xbcecff,
  logBase: 0x9b653b,
  logAlt: 0x6e4429,
  treeLeafA: 0x3fb96f,
  treeLeafB: 0x2f9d5d,
  treeTrunk: 0x765034,
  houseWallA: 0x6f735f,
  houseWallB: 0x5f675c,
  houseRoofA: 0x4e5146,
  houseRoofB: 0x4b4f45,
  windowColor: 0xd8e4da,
  pancakeBase: 0xffcf62,
  pancakeAlt: 0xe98622,
  butterColor: 0xffec6d,
  carYellow: 0xf0c247,
  playerRed: 0xff4638,
  playerYellow: 0xffd84e,
  playerDark: 0x1d2327,
  villainBody: 0x676874,
  villainEye: 0xffffff,
  villainDark: 0x171821,
  shadowColor: 0x2a2e36,
} as const;

const MR_AWESOME_PLAYER_SCALE = 0.52;
const MR_AWESOME_PLAYER_ROTATION_Y = Math.PI;
const CHARACTER_WIDTH_SCALE = 0.9;
const MR_NOT_SO_AWESOME_HEIGHT_SCALE = 1.15;
const CHARACTER_LANE_CENTER_Z_OFFSET = -0.18;
const PANCAKE_LANE_CENTER_Z_OFFSET = -0.12;
const PANCAKE_MODEL_SCALE_XZ = 0.34;
const PANCAKE_MODEL_SCALE_Y = 0.13;
const VOXEL_TOWN_SOUTH_ROTATION_Y = Math.PI * 1.5;
const VOXEL_TOWN_BUILDING_BOUNDS = { width: 1.88, height: 1.7, depth: 1.88 } as const;
const VOXEL_TOWN_BUILDING_TILE_VISUAL_SCALE = 0.62;
const VOXEL_TOWN_TREE_BOUNDS = { width: 0.86, height: 1.3, depth: 0.86 } as const;

export type CameraPresetId = "current" | "balanced" | "readability" | "lowPreview" | "topDownDebug";

interface CameraPresetSpec {
  label: string;
  elevationFromGroundDeg: number;
  yawDeg: number;
  targetHeight: number;
  orthoSize: number;
  portraitOrthoSize: number;
}

const CAMERA_PRESETS: Record<CameraPresetId, CameraPresetSpec> = {
  current: {
    label: "Current / Map View",
    elevationFromGroundDeg: 55,
    yawDeg: 0,
    targetHeight: 0,
    orthoSize: 7.3,
    portraitOrthoSize: 6.5,
  },
  balanced: {
    label: "Balanced Gameplay",
    elevationFromGroundDeg: 45,
    yawDeg: 0,
    targetHeight: 0.5,
    orthoSize: 6.7,
    portraitOrthoSize: 6,
  },
  readability: {
    label: "Character Readability",
    elevationFromGroundDeg: 38,
    yawDeg: 0,
    targetHeight: 0.56,
    orthoSize: 6.25,
    portraitOrthoSize: 5.6,
  },
  lowPreview: {
    label: "Low Character Preview",
    elevationFromGroundDeg: 30,
    yawDeg: 0,
    targetHeight: 0.55,
    orthoSize: 5.8,
    portraitOrthoSize: 5.25,
  },
  topDownDebug: {
    label: "Top-Down Debug",
    elevationFromGroundDeg: 70,
    yawDeg: 0,
    targetHeight: 0.2,
    orthoSize: 8,
    portraitOrthoSize: 7.1,
  },
} as const;

export const CAMERA_PRESET_OPTIONS = Object.entries(CAMERA_PRESETS).map(([id, preset]) => ({
  id: id as CameraPresetId,
  label: preset.label,
}));

export const DEFAULT_CAMERA_PRESET: CameraPresetId = "lowPreview";
export const DEFAULT_CAMERA_ZOOM_PERCENT = 150;

const CAMERA_SPEC = {
  smoothingSeconds: 0.14,
  sideFollowRatio: 0.45,
  sideFollowClamp: 3.25,
  targetAheadRows: 2.6,
  foregroundPadding: 0.1,
  backDistance: 9.2,
} as const;

interface LoadedModel {
  source: THREE.Group;
  center: THREE.Vector3;
  minY: number;
  size: THREE.Vector3;
}

export interface RenderEditSelection {
  x: number;
  z: number;
  kind: StageObjectKind;
  cells?: GridPoint[];
  copy?: boolean;
}

export class ThreeStageRenderer {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-8, 8, 8, -8, 0.1, 80);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly world = new THREE.Group();
  private readonly boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  private readonly materials = new Map<string, THREE.Material>();
  private readonly gltfLoader = new GLTFLoader();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly models = new Map<ModelKey, LoadedModel>();
  private readonly loadingModels = new Set<ModelKey>();
  private readonly failedModels = new Set<ModelKey>();
  private cameraFocusX = 0;
  private cameraFocusZ = 6;
  private activeCameraPreset: CameraPresetId = DEFAULT_CAMERA_PRESET;
  private cameraZoomPercent = DEFAULT_CAMERA_ZOOM_PERCENT;
  private width = 1;
  private height = 1;
  private lastRunId = -1;

  constructor(private readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(PALETTE.background);
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xf9fff2, 0x6f7f93, 2.2);
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.1);
    const fillLight = new THREE.DirectionalLight(0xfff0d2, 0.35);
    const rimLight = new THREE.DirectionalLight(0xc8e6ff, 0.18);
    sunLight.position.set(-5, 14, -6);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.radius = 3.1;
    sunLight.shadow.camera.left = -16;
    sunLight.shadow.camera.right = 16;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    fillLight.position.set(5, 7, 6);
    rimLight.position.set(4, 5, -8);
    this.scene.fog = null;
    this.scene.add(this.world, hemiLight, sunLight, fillLight, rimLight);
    this.resize();
    this.loadInitialAssets();
  }

  setCameraPreset(preset: CameraPresetId): void {
    this.activeCameraPreset = preset;
    this.resize();
  }

  setCameraZoom(percent: number): void {
    this.cameraZoomPercent = clamp(percent, 90, 190);
    this.resize();
  }

  resize(): void {
    const rect = this.container.getBoundingClientRect();
    this.width = Math.max(1, Math.floor(rect.width));
    this.height = Math.max(1, Math.floor(rect.height));
    const aspect = this.width / this.height;
    const preset = CAMERA_PRESETS[this.activeCameraPreset];
    const orthoSize = (aspect < 0.82 ? preset.portraitOrthoSize : preset.orthoSize) * (100 / this.cameraZoomPercent);
    this.camera.left = -orthoSize * aspect;
    this.camera.right = orthoSize * aspect;
    this.camera.top = orthoSize;
    this.camera.bottom = -orthoSize;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height, false);
  }

  render(state: GameState, deltaSeconds: number, editSelection?: RenderEditSelection): void {
    const player = getPlayerDisplayPosition(state);
    if (state.runId !== this.lastRunId) {
      this.cameraFocusX = targetCameraFocusX(player.x);
      this.cameraFocusZ = targetCameraFocusZ(player.z);
      this.lastRunId = state.runId;
    }
    const alpha = 1 - Math.exp(-deltaSeconds / CAMERA_SPEC.smoothingSeconds);
    this.cameraFocusX = lerp(this.cameraFocusX, targetCameraFocusX(player.x), alpha);
    this.cameraFocusZ = lerp(this.cameraFocusZ, targetCameraFocusZ(player.z), alpha);
    this.positionCamera();
    this.rebuildWorld(state, editSelection);
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.renderer.dispose();
    this.boxGeometry.dispose();
    for (const material of this.materials.values()) material.dispose();
    for (const model of this.models.values()) disposeModel(model.source);
  }

  getTileFromPointer(event: PointerEvent | MouseEvent): { x: number; z: number } | undefined {
    const point = this.getGroundPoint(event);
    if (!point) return undefined;
    const x = Math.round(point.x);
    const z = Math.round(point.z);
    if (x < GRID.minX || x > GRID.maxX || z < 0) return undefined;
    return { x, z };
  }

  private positionCamera(): void {
    const preset = CAMERA_PRESETS[this.activeCameraPreset];
    const elevationRadians = THREE.MathUtils.degToRad(preset.elevationFromGroundDeg);
    const yawRadians = THREE.MathUtils.degToRad(preset.yawDeg);
    const height = preset.targetHeight + Math.tan(elevationRadians) * CAMERA_SPEC.backDistance;
    const offsetX = Math.sin(yawRadians) * CAMERA_SPEC.backDistance;
    const offsetZ = -Math.cos(yawRadians) * CAMERA_SPEC.backDistance;
    const focus = new THREE.Vector3(this.cameraFocusX, preset.targetHeight, this.cameraFocusZ);
    this.camera.position.set(this.cameraFocusX + offsetX, height, this.cameraFocusZ + offsetZ);
    this.camera.lookAt(focus);
    this.camera.updateMatrixWorld();
  }

  private rebuildWorld(state: GameState, editSelection?: RenderEditSelection): void {
    this.world.clear();
    this.addBackdrop();
    this.addDecorativeLowerWaterRows(state.time);
    this.addDecorativeUpperExtensionRows(state.time, state.lanes);
    for (const lane of sortedLanes(state.lanes)) {
      this.addLane(lane);
      this.addStaticObjects(lane, state);
      this.addMovingObjects(lane, state);
    }
    this.addPlayerAndTarget(state);
    if (editSelection) this.addEditSelection(editSelection);
  }

  private addBackdrop(): void {
    this.addBox(0, -0.18, 7.2, 20.8, 0.12, 21.6, PALETTE.grassBase, false);
  }

  private addLane(lane: LaneState): void {
    const laneColor = lane.kind === "river"
      ? lane.z % 2 === 0 ? PALETTE.riverBase : PALETTE.riverAlt
      : lane.kind === "road"
        ? lane.z % 2 === 0 ? PALETTE.roadBase : PALETTE.roadAlt
        : lane.terrain === "dirt"
          ? lane.z % 2 === 0 ? PALETTE.dirtBase : PALETTE.dirtAlt
          : lane.z % 3 === 0 ? PALETTE.grassAlt : PALETTE.grassBase;
    this.addBox(0, -0.05, lane.z, 17.4, 0.1, 0.98, laneColor, false);
    if (lane.kind === "road") {
      for (let x = -8; x <= 8; x += 2) {
        this.addBox(x, 0.015, lane.z, 0.74, 0.025, 0.05, PALETTE.roadMarking, false);
      }
      return;
    }
    if (lane.kind === "river") {
      this.addWaterMarks(lane.z);
      return;
    }
    if (lane.terrain === "dirt") {
      this.addDirtMarks(lane.z);
    } else {
      this.addBox(0, 0.012, lane.z - 0.47, 17.4, 0.012, 0.018, PALETTE.grassLine, false, 0.36);
      this.addBox(0, 0.012, lane.z + 0.47, 17.4, 0.012, 0.018, PALETTE.grassLine, false, 0.28);
      for (let x = GRID.minX; x <= GRID.maxX; x += 2) {
        if ((x + lane.z) % 5 === 0) this.addBox(x + 0.34, 0.018, lane.z - 0.28, 0.12, 0.025, 0.12, PALETTE.grassLine, false, 0.64);
      }
    }
  }

  private addStaticObjects(lane: LaneState, state: GameState): void {
    if (lane.kind !== "grass") return;
    for (const object of state.stageObjects) {
      if (object.z !== lane.z) continue;
      if (object.kind === "tree") this.addTree(object.x, object.z, object.assetId);
      if (object.kind === "building") this.addBuilding(object);
      if (object.kind === "pancake" && !state.collectedPancakes.has(pancakeKey(object.x, object.z))) {
        this.addPancake(object.x, object.z, object.assetId);
      }
    }
  }

  private addMovingObjects(lane: LaneState, state: GameState): void {
    for (const span of getMovingSpans(lane, state.time)) {
      if (span.kind === "platform") {
        this.addLogPlatform(span.centerX, span.z, span.length);
        continue;
      }
      const isTruck = span.length > 2.4;
      const height = isTruck ? 0.74 : 0.54;
      const bodyColor = isTruck ? PALETTE.carYellow : span.color;
      this.addBox(span.centerX, height / 2 + 0.08, span.z, span.length, height, 0.72, bodyColor, true);
      this.addBox(span.centerX + span.direction * span.length * 0.18, height + 0.19, span.z, span.length * 0.42, 0.28, 0.52, 0xdff6ff, true);
      const wheelOffset = Math.min(span.length / 2 - 0.25, 1.22);
      for (const sideZ of [-0.42, 0.42]) {
        this.addBox(span.centerX - wheelOffset, 0.13, span.z + sideZ, 0.28, 0.22, 0.12, PALETTE.playerDark, true);
        this.addBox(span.centerX + wheelOffset, 0.13, span.z + sideZ, 0.28, 0.22, 0.12, PALETTE.playerDark, true);
      }
    }
  }

  private addDecorativeLowerWaterRows(time: number): void {
    for (const z of [-2, -1]) {
      this.addBox(0, -0.055, z, 17.4, 0.1, 0.98, z % 2 === 0 ? PALETTE.riverAlt : PALETTE.riverBase, false);
      this.addWaterMarks(z);
      const direction = z === -1 ? 1 : -1;
      const speed = z === -1 ? 1.1 : 0.8;
      const length = z === -1 ? 3.1 : 4.2;
      const gap = z === -1 ? 5.8 : 6.8;
      const phase = stableLanePhase(z, direction);
      const period = length + gap;
      const motion = phase + direction * speed * time;
      const first = Math.floor((GRID.visibleMinX - 5 - motion) / period) - 1;
      const last = Math.ceil((GRID.visibleMaxX + 5 - motion) / period) + 1;
      for (let index = first; index <= last; index += 1) {
        const centerX = motion + index * period;
        if (centerX + length / 2 < GRID.visibleMinX - 4 || centerX - length / 2 > GRID.visibleMaxX + 4) continue;
        this.addLogPlatform(centerX, z, length);
      }
    }
  }

  private addDecorativeUpperExtensionRows(time: number, lanes: Map<number, LaneState>): void {
    const topZ = Math.max(...lanes.keys());
    for (let offset = 1; offset <= 3; offset += 1) {
      const z = topZ + offset;
      this.addBox(0, -0.055, z, 17.4, 0.1, 0.98, z % 2 === 0 ? PALETTE.riverBase : PALETTE.riverAlt, false);
      this.addWaterMarks(z);
      const direction = offset % 2 === 0 ? -1 : 1;
      const length = offset === 3 ? 4.4 : offset === 2 ? 1.85 : 3;
      const speed = offset === 2 ? 1.8 : 1.25;
      const gap = offset === 2 ? 4.6 : 6.5;
      this.addDecorativeMovingLogs(z, time, direction, speed, length, gap);
    }

    for (let offset = 4; offset <= 6; offset += 1) {
      const z = topZ + offset;
      this.addBox(0, -0.05, z, 17.4, 0.1, 0.98, z % 2 === 0 ? PALETTE.roadBase : PALETTE.roadAlt, false);
      for (let x = -8; x <= 8; x += 2) {
        this.addBox(x, 0.015, z, 0.74, 0.025, 0.05, PALETTE.roadMarking, false);
      }
      const direction = offset % 2 === 0 ? 1 : -1;
      const speed = offset === 6 ? 2.6 : 1.9;
      const length = offset === 5 ? 2.2 : 1.35;
      const gap = offset === 6 ? 4.8 : 5.8;
      this.addDecorativeMovingVehicles(z, time, direction, speed, length, gap);
    }
  }

  private addDecorativeMovingLogs(z: number, time: number, direction: -1 | 1, speed: number, length: number, gap: number): void {
    const phase = stableLanePhase(z, direction);
    const period = length + gap;
    const motion = phase + direction * speed * time;
    const first = Math.floor((GRID.visibleMinX - 5 - motion) / period) - 1;
    const last = Math.ceil((GRID.visibleMaxX + 5 - motion) / period) + 1;
    for (let index = first; index <= last; index += 1) {
      const centerX = motion + index * period;
      if (centerX + length / 2 < GRID.visibleMinX - 4 || centerX - length / 2 > GRID.visibleMaxX + 4) continue;
      this.addLogPlatform(centerX, z, length);
    }
  }

  private addDecorativeMovingVehicles(z: number, time: number, direction: -1 | 1, speed: number, length: number, gap: number): void {
    const phase = stableLanePhase(z, direction);
    const period = length + gap;
    const motion = phase + direction * speed * time;
    const first = Math.floor((GRID.visibleMinX - 5 - motion) / period) - 1;
    const last = Math.ceil((GRID.visibleMaxX + 5 - motion) / period) + 1;
    for (let index = first; index <= last; index += 1) {
      const centerX = motion + index * period;
      if (centerX + length / 2 < GRID.visibleMinX - 4 || centerX - length / 2 > GRID.visibleMaxX + 4) continue;
      const isTruck = length > 2;
      const height = isTruck ? 0.72 : 0.52;
      const bodyColor = direction === 1 ? 0x4e8ed8 : 0xd85d5d;
      this.addBox(centerX, height / 2 + 0.08, z, length, height, 0.72, bodyColor, true);
      this.addBox(centerX + direction * length * 0.18, height + 0.19, z, length * 0.42, 0.28, 0.52, 0xdff6ff, true);
      const wheelOffset = Math.min(length / 2 - 0.25, 1.22);
      for (const sideZ of [-0.42, 0.42]) {
        this.addBox(centerX - wheelOffset, 0.13, z + sideZ, 0.28, 0.22, 0.12, PALETTE.playerDark, true);
        this.addBox(centerX + wheelOffset, 0.13, z + sideZ, 0.28, 0.22, 0.12, PALETTE.playerDark, true);
      }
    }
  }

  private addWaterMarks(z: number): void {
    for (let x = -8; x <= 8; x += 2.25) {
      const offset = ((x * 13 + z * 17) % 7) * 0.018;
      this.addBox(x + 0.24, 0.018, z - 0.22 + offset, 0.56, 0.018, 0.035, PALETTE.waterMark, false, 0.28);
      this.addBox(x + 0.72, 0.018, z + 0.15 - offset, 0.34, 0.018, 0.03, PALETTE.waterMark, false, 0.2);
    }
  }

  private addDirtMarks(z: number): void {
    this.addBox(0, 0.013, z - 0.47, 17.4, 0.012, 0.018, PALETTE.dirtMark, false, 0.16);
    this.addBox(0, 0.013, z + 0.47, 17.4, 0.012, 0.018, PALETTE.dirtMark, false, 0.12);
    for (let x = GRID.minX - 1; x <= GRID.maxX + 1; x += 2) {
      if ((x + z) % 4 === 0) this.addBox(x + 0.22, 0.019, z - 0.18, 0.42, 0.018, 0.036, PALETTE.dirtMark, false, 0.24);
      if ((x - z) % 5 === 0) this.addBox(x - 0.2, 0.019, z + 0.21, 0.24, 0.018, 0.032, PALETTE.dirtMark, false, 0.18);
    }
  }

  private addLogPlatform(x: number, z: number, length: number): void {
    this.addBox(x, 0.13, z, length, 0.26, 0.62, PALETTE.logBase, true);
    this.addBox(x - length * 0.35, 0.22, z, 0.12, 0.1, 0.66, PALETTE.logAlt, true);
    this.addBox(x + length * 0.35, 0.22, z, 0.12, 0.1, 0.66, PALETTE.logAlt, true);
  }

  private addPlayerAndTarget(state: GameState): void {
    const player = getPlayerDisplayPosition(state);
    if (!this.addMrAwesomePlayer(player.x, player.y, player.z)) {
      this.addPrimitiveHero(player.x, 0.08 + player.y, player.z, state.phase === "crashed");
    }

    if (state.stage.target.visible) {
      const target = state.stage.target;
      if (!this.addMrNotSoAwesomeTarget(target.x, target.z)) {
        this.addPrimitiveTarget(target.x, target.z);
      }
    }
  }

  private addPrimitiveHero(x: number, y: number, z: number, crashed: boolean): void {
    const visualZ = z + CHARACTER_LANE_CENTER_Z_OFFSET;
    const body = crashed ? 0xa8453a : PALETTE.playerRed;
    this.addBox(x, y + 0.36, visualZ, 0.52, 0.56, 0.46, body, true);
    this.addBox(x + 0.12, y + 0.78, visualZ - 0.08, 0.38, 0.36, 0.34, PALETTE.playerYellow, true);
    this.addBox(x + 0.36, y + 0.78, visualZ - 0.08, 0.24, 0.16, 0.18, PALETTE.playerYellow, true);
    this.addBox(x + 0.2, y + 0.9, visualZ - 0.2, 0.09, 0.09, 0.09, PALETTE.playerDark, true);
    this.addBox(x - 0.16, y + 0.04, visualZ - 0.12, 0.13, 0.17, 0.13, PALETTE.playerYellow, true);
    this.addBox(x + 0.16, y + 0.04, visualZ + 0.12, 0.13, 0.17, 0.13, PALETTE.playerYellow, true);
  }

  private addPrimitiveTarget(x: number, z: number): void {
    const visualZ = z + CHARACTER_LANE_CENTER_Z_OFFSET;
    const targetY = MR_NOT_SO_AWESOME_HEIGHT_SCALE;
    this.addBox(x, 0.38 * targetY, visualZ, 0.5, 0.74 * targetY, 0.42, PALETTE.villainBody, true);
    this.addBox(x, 0.88 * targetY, visualZ - 0.04, 0.42, 0.34 * targetY, 0.36, PALETTE.villainEye, true);
    this.addBox(x - 0.24, 0.92 * targetY, visualZ - 0.02, 0.12, 0.18 * targetY, 0.14, PALETTE.villainDark, true);
    this.addBox(x + 0.24, 0.92 * targetY, visualZ - 0.02, 0.12, 0.18 * targetY, 0.14, PALETTE.villainDark, true);
  }

  private addTree(x: number, z: number, assetId?: StageAssetId): void {
    const key = assetId && assetId in ASSET_PATHS ? assetId as ModelKey : "tree03";
    if (this.addAssetModel(key, x, 0.02, z, VOXEL_TOWN_TREE_BOUNDS, Math.PI * stableQuarterTurn(x, z))) return;
    this.addBox(x, 0.28, z, 0.28, 0.56, 0.28, PALETTE.treeTrunk, true);
    this.addBox(x, 0.72, z, 0.86, 0.58, 0.86, PALETTE.treeLeafB, true);
    this.addBox(x + 0.08, 1.08, z - 0.04, 0.62, 0.54, 0.62, PALETTE.treeLeafA, true);
  }

  private addBuilding(object: StagePlacedObject): void {
    const cells = object.cells.length ? object.cells : [{ x: object.x, z: object.z }];
    const minX = Math.min(...cells.map((cell) => cell.x));
    const maxX = Math.max(...cells.map((cell) => cell.x));
    const minZ = Math.min(...cells.map((cell) => cell.z));
    const maxZ = Math.max(...cells.map((cell) => cell.z));
    const x = (minX + maxX) / 2;
    const z = (minZ + maxZ) / 2;
    const width = maxX - minX + 1;
    const depth = maxZ - minZ + 1;
    const alternate = object.assetId === "house02";
    const key = object.assetId && object.assetId in ASSET_PATHS ? object.assetId as ModelKey : "house01";
    const visualWidth = Math.max(VOXEL_TOWN_BUILDING_BOUNDS.width, width * VOXEL_TOWN_BUILDING_TILE_VISUAL_SCALE);
    const visualDepth = Math.max(VOXEL_TOWN_BUILDING_BOUNDS.depth, depth * VOXEL_TOWN_BUILDING_TILE_VISUAL_SCALE);
    const bounds = {
      width: visualWidth,
      height: VOXEL_TOWN_BUILDING_BOUNDS.height,
      depth: visualDepth,
    };
    if (this.addAssetModel(key, x, 0.02, z, bounds, VOXEL_TOWN_SOUTH_ROTATION_Y)) return;
    this.addBox(x, 0.75, z, visualWidth, 1.5, visualDepth, alternate ? PALETTE.houseWallB : PALETTE.houseWallA, true);
    this.addBox(x, 1.62, z, visualWidth + 0.18, 0.24, visualDepth + 0.18, alternate ? PALETTE.houseRoofB : PALETTE.houseRoofA, true);
    this.addBox(x + 0.18, 0.78, z - visualDepth / 2 - 0.02, 0.24, 0.32, 0.04, PALETTE.windowColor, true);
  }

  private addPancake(x: number, z: number, assetId?: StageAssetId): void {
    const visualZ = z + PANCAKE_LANE_CENTER_Z_OFFSET;
    if (!assetId || assetId === "pancake") {
      if (this.addTexturedPancake(x, z)) return;
    } else if (assetId in ASSET_PATHS && this.addAssetModel(assetId as ModelKey, x, 0.025, visualZ, { width: 0.62, height: 0.28, depth: 0.62 }, Math.PI * stableQuarterTurn(x, z) / 2)) {
      return;
    }
    this.addBox(x, 0.11, visualZ, 0.58, 0.08, 0.58, PALETTE.pancakeAlt, true);
    this.addBox(x, 0.18, visualZ, 0.5, 0.06, 0.5, PALETTE.pancakeBase, true);
    this.addBox(x + 0.1, 0.23, visualZ - 0.06, 0.16, 0.04, 0.12, PALETTE.butterColor, true);
  }

  private addEditSelection(selection: RenderEditSelection): void {
    const color = selection.copy ? 0xffc247 : selection.kind === "target" ? 0xf9e151 : selection.kind === "pancake" ? 0xffa751 : 0x55c8ff;
    const cells = selection.cells?.length ? selection.cells : [{ x: selection.x, z: selection.z }];
    for (const cell of cells) this.addBox(cell.x, 0.035, cell.z, 1.08, 0.04, 1.08, color, false, selection.copy ? 0.42 : 0.34);
  }

  private addMrAwesomePlayer(x: number, y: number, z: number): boolean {
    const model = this.models.get("player");
    if (!model) {
      this.loadModel("player");
      return false;
    }
    const clone = model.source.clone(true);
    clone.name = "mr_awesome_player";
    clone.position.set(x, 0.1 + y, z + CHARACTER_LANE_CENTER_Z_OFFSET);
    clone.rotation.y = MR_AWESOME_PLAYER_ROTATION_Y;
    clone.scale.set(
      MR_AWESOME_PLAYER_SCALE * CHARACTER_WIDTH_SCALE,
      MR_AWESOME_PLAYER_SCALE,
      MR_AWESOME_PLAYER_SCALE,
    );
    this.world.add(clone);
    return true;
  }

  private addMrNotSoAwesomeTarget(x: number, z: number): boolean {
    const targetModel = this.models.get("target");
    const playerModel = this.models.get("player");
    if (!targetModel || !playerModel) {
      this.loadModel("target");
      this.loadModel("player");
      return false;
    }

    const clone = targetModel.source.clone(true);
    const scale = MR_AWESOME_PLAYER_SCALE;
    const equalizer = new THREE.Vector3(
      (playerModel.size.x * MR_AWESOME_PLAYER_SCALE) / Math.max(0.001, targetModel.size.x * scale),
      (playerModel.size.y * MR_AWESOME_PLAYER_SCALE) / Math.max(0.001, targetModel.size.y * scale),
      (playerModel.size.z * MR_AWESOME_PLAYER_SCALE) / Math.max(0.001, targetModel.size.z * scale),
    );
    clone.name = "mr_not_so_awesome_target";
    clone.position.set(x, 0.025, z + CHARACTER_LANE_CENTER_Z_OFFSET);
    clone.rotation.y = Math.PI;
    clone.scale.set(
      scale * CHARACTER_WIDTH_SCALE * equalizer.x,
      scale * MR_NOT_SO_AWESOME_HEIGHT_SCALE * equalizer.y,
      scale * equalizer.z,
    );
    this.world.add(clone);
    return true;
  }

  private addTexturedPancake(x: number, z: number): boolean {
    const model = this.models.get("pancake");
    if (!model) {
      this.loadModel("pancake");
      return false;
    }
    const clone = model.source.clone(true);
    clone.name = "textured_pancake_collectible";
    clone.position.set(x, 0.025, z + PANCAKE_LANE_CENTER_Z_OFFSET);
    clone.rotation.y = Math.PI * stableQuarterTurn(x, z) / 2;
    clone.scale.set(
      PANCAKE_MODEL_SCALE_XZ,
      PANCAKE_MODEL_SCALE_Y,
      PANCAKE_MODEL_SCALE_XZ,
    );
    this.world.add(clone);
    return true;
  }

  private addAssetModel(key: ModelKey, x: number, y: number, z: number, bounds: { width: number; height: number; depth: number }, rotationY: number): boolean {
    const model = this.models.get(key);
    if (!model) {
      this.loadModel(key);
      return false;
    }
    const clone = model.source.clone(true);
    clone.position.set(-model.center.x, -model.minY, -model.center.z);
    const group = new THREE.Group();
    group.name = `stage_asset_${String(key)}`;
    group.position.set(x, y, z);
    group.rotation.y = rotationY;
    group.scale.set(
      bounds.width / Math.max(0.001, model.size.x),
      bounds.height / Math.max(0.001, model.size.y),
      bounds.depth / Math.max(0.001, model.size.z),
    );
    group.add(clone);
    this.world.add(group);
    return true;
  }

  private addBox(x: number, y: number, z: number, width: number, height: number, depth: number, color: number, castShadow: boolean, opacity = 1): void {
    const mesh = new THREE.Mesh(this.boxGeometry, this.material(color, opacity));
    mesh.position.set(x, y, z);
    mesh.scale.set(width, height, depth);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    this.world.add(mesh);
  }

  private material(color: number, opacity: number): THREE.Material {
    const key = `${color.toString(16)}:${opacity.toFixed(2)}`;
    const cached = this.materials.get(key);
    if (cached) return cached;
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.78,
      metalness: 0,
      transparent: opacity < 1,
      opacity,
    });
    this.materials.set(key, material);
    return material;
  }

  private loadInitialAssets(): void {
    this.loadModel("player");
    this.loadModel("target");
    this.loadModel("pancake");
    this.loadModel("house01");
    this.loadModel("house02");
    this.loadModel("tree03");
    this.loadModel("tree05");
  }

  private loadModel(key: ModelKey): void {
    if (this.models.has(key) || this.loadingModels.has(key) || this.failedModels.has(key)) return;
    this.loadingModels.add(key);
    const path = ASSET_PATHS[key];
    if (typeof path === "string") {
      this.gltfLoader.load(
        path,
        (gltf) => this.storeLoadedModel(key, gltf.scene),
        undefined,
        (error) => this.markModelFailed(key, error),
      );
      return;
    }

    const basePath = path.mtl.slice(0, path.mtl.lastIndexOf("/") + 1);
    const mtlLoader = new MTLLoader();
    mtlLoader.setResourcePath(basePath);
    mtlLoader.load(
      path.mtl,
      (materials) => {
        materials.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load(
          path.obj,
          (object) => this.storeLoadedModel(key, object),
          undefined,
          (error) => this.markModelFailed(key, error),
        );
      },
      undefined,
      (error) => this.markModelFailed(key, error),
    );
  }

  private storeLoadedModel(key: ModelKey, source: THREE.Group): void {
    enhanceLoadedAssetMaterials(key, source);
    source.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
    });
    source.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(source);
    this.models.set(key, {
      source,
      center: box.getCenter(new THREE.Vector3()),
      minY: box.min.y,
      size: box.getSize(new THREE.Vector3()),
    });
    this.loadingModels.delete(key);
  }

  private markModelFailed(key: ModelKey, error: unknown): void {
    this.loadingModels.delete(key);
    this.failedModels.add(key);
    console.warn(`Could not load ${String(key)} model; using primitive fallback.`, error);
  }

  private getGroundPoint(event: PointerEvent | MouseEvent): THREE.Vector3 | undefined {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const point = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(this.groundPlane, point) ?? undefined;
  }
}

function sortedLanes(lanes: Map<number, LaneState>): LaneState[] {
  return Array.from(lanes.values()).sort((a, b) => a.z - b.z);
}

function targetCameraFocusX(playerX: number): number {
  return clamp(playerX * CAMERA_SPEC.sideFollowRatio, -CAMERA_SPEC.sideFollowClamp, CAMERA_SPEC.sideFollowClamp);
}

function targetCameraFocusZ(playerZ: number): number {
  return Math.max(2, playerZ) + CAMERA_SPEC.targetAheadRows - CAMERA_SPEC.foregroundPadding;
}

function stableQuarterTurn(x: number, z: number): number {
  return Math.abs((x * 17 + z * 11) % 4);
}

function stableLanePhase(z: number, direction: -1 | 1): number {
  const raw = Math.sin((z + 3) * 12.9898) * 43758.5453;
  return (raw - Math.floor(raw)) * 7 * direction;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function enhanceLoadedAssetMaterials(key: ModelKey, source: THREE.Object3D): void {
  if (key !== "target" && key !== "pancake") return;
  const seen = new Set<THREE.Material>();
  source.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (seen.has(material)) continue;
      seen.add(material);
      enhanceMaterialForAsset(key, material);
    }
  });
}

function enhanceMaterialForAsset(key: "target" | "pancake", material: THREE.Material): void {
  const colorMaterial = material as THREE.Material & {
    color?: THREE.Color;
    emissive?: THREE.Color;
    emissiveIntensity?: number;
    roughness?: number;
  };
  if (colorMaterial.color) {
    if (key === "pancake") colorMaterial.color.offsetHSL(0.015, 0.16, 0.08);
    else colorMaterial.color.offsetHSL(0, 0.08, 0.07);
  }
  if (colorMaterial.emissive) {
    const glow = key === "pancake" ? new THREE.Color(0xff9f2d) : new THREE.Color(0xcfd7e8);
    colorMaterial.emissive.copy(glow);
    colorMaterial.emissiveIntensity = key === "pancake" ? 0.18 : 0.1;
  }
  if (typeof colorMaterial.roughness === "number") {
    colorMaterial.roughness = key === "pancake" ? Math.min(colorMaterial.roughness, 0.62) : Math.min(colorMaterial.roughness, 0.7);
  }
  material.needsUpdate = true;
}

function disposeModel(model: THREE.Object3D | undefined): void {
  if (!model) return;
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) material.dispose();
  });
}
