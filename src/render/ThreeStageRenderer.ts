import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { GRID, type GameState, type GridPoint, type LaneState, type StageAssetId, type StageObjectKind, type StagePlacedObject } from "../game/types";
import { getMovingSpans, getPlayerDisplayPosition, isTrainWarningActive, pancakeKey } from "../game/simulation";

const USE_MOBILE_CHARACTER_ASSETS = window.matchMedia("(pointer: coarse), (max-width: 820px), (max-height: 760px)").matches;

const ASSET_PATHS = {
  player: USE_MOBILE_CHARACTER_ASSETS
    ? "/assets/characters/TexturedMeshBright-mobile.glb"
    : "/assets/characters/TexturedMeshBright.glb",
  target: USE_MOBILE_CHARACTER_ASSETS
    ? "/assets/characters/MrNotSoAwesomeTexturedBright-mobile.glb"
    : "/assets/characters/MrNotSoAwesomeTexturedBright.glb",
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
  trackBase: 0x58504c,
  railMetal: 0xb9c3c6,
  railTie: 0x5a3f31,
  trainBody: 0x222934,
  trainStripe: 0xf0c247,
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
  warningYellow: 0xffd34d,
  warningRed: 0xe14642,
  billboardPost: 0x6e4429,
  billboardFace: 0xf4efd8,
  billboardFrame: 0x523d2f,
  billboardAccent: 0xd8464a,
  carYellow: 0xf0c247,
  playerRed: 0xff4638,
  playerYellow: 0xffd84e,
  playerDark: 0x1d2327,
  villainBody: 0x676874,
  villainEye: 0xffffff,
  villainDark: 0x171821,
  shadowColor: 0x2a2e36,
} as const;

const BILLBOARD_COPY = [
  ["WELCOME TO", "AWESOME TOWN"],
  ["PANCAKE", "PLAZA"],
  ["RAILROAD", "ROW"],
  ["BIG LAKES", "DISTRICT"],
  ["LOG", "LAGOON"],
  ["FINAL BLOCK", "AHEAD"],
] as const;

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
const REVEAL_CAMERA_ZOOM_PERCENT = 150;
const CHASE_CAMERA_ZOOM_PERCENT = 118;
const CHASE_CAMERA_AHEAD_OFFSET_ROWS = 2.15;
const CHASE_CAMERA_TOP_STOP_Z = 445;
const CHASE_CAMERA_TOP_STOP_LEAD_ROWS = 17;
const ESCAPE_POP_SECONDS = 0.62;
const DECORATIVE_LOG_SPEED_MULTIPLIER = 1.2;
const PANCAKE_IDLE_BOUNCE_INTERVAL_SECONDS = 5;
const PANCAKE_IDLE_BOUNCE_SECONDS = 1.2;

const CAMERA_SPEC = {
  smoothingSeconds: 0.14,
  sideFollowRatio: 0.45,
  sideFollowClamp: 3.25,
  bottomAnchorPlayerZ: 2,
  topBoundaryLeadRows: 7,
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

interface RenderWindow {
  minZ: number;
  maxZ: number;
}

interface EscapeVisual {
  yOffset: number;
  zOffset: number;
  scale: number;
  opacity: number;
}

interface TargetTravelVisual {
  x: number;
  z: number;
  visual: EscapeVisual;
}

export interface RenderEditSelection {
  x: number;
  z: number;
  kind: StageObjectKind;
  cells?: GridPoint[];
  copy?: boolean;
}

export interface RenderOptions {
  useStageCamera?: boolean;
}

export class ThreeStageRenderer {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-8, 8, 8, -8, 0.1, 80);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly world = new THREE.Group();
  private readonly staticWorld = new THREE.Group();
  private readonly dynamicWorld = new THREE.Group();
  private readonly boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  private readonly planeGeometry = new THREE.PlaneGeometry(1, 1);
  private readonly materials = new Map<string, THREE.Material>();
  private readonly billboardTextMaterials = new Map<string, THREE.MeshBasicMaterial>();
  private readonly gltfLoader = new GLTFLoader();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly frustumProbe = new THREE.Vector2();
  private readonly models = new Map<ModelKey, LoadedModel>();
  private readonly loadingModels = new Set<ModelKey>();
  private readonly failedModels = new Set<ModelKey>();
  private readonly mobileRenderer = isCoarsePointer();
  private activeWorld: THREE.Group = this.dynamicWorld;
  private staticWorldKey = "";
  private sortedLaneCache: LaneState[] = [];
  private objectsByZ = new Map<number, StagePlacedObject[]>();
  private billboardCopyById = new Map<string, readonly [string, string]>();
  private cacheRunId = -1;
  private cameraFocusX = 0;
  private cameraFocusZ = 6;
  private finalCameraLock: { runId: number; x: number; z: number } | undefined;
  private activeCameraPreset: CameraPresetId = DEFAULT_CAMERA_PRESET;
  private cameraZoomPercent = DEFAULT_CAMERA_ZOOM_PERCENT;
  private appliedCameraZoomPercent = DEFAULT_CAMERA_ZOOM_PERCENT;
  private width = 1;
  private height = 1;
  private lastRunId = -1;

  constructor(private readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.mobileRenderer ? 2 : 2.25));
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
    sunLight.shadow.mapSize.set(this.mobileRenderer ? 1024 : 1536, this.mobileRenderer ? 1024 : 1536);
    sunLight.shadow.radius = this.mobileRenderer ? 2.4 : 3;
    sunLight.shadow.camera.left = -16;
    sunLight.shadow.camera.right = 16;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    fillLight.position.set(5, 7, 6);
    rimLight.position.set(4, 5, -8);
    this.scene.fog = null;
    this.world.add(this.staticWorld, this.dynamicWorld);
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
    this.applyCameraProjection(this.appliedCameraZoomPercent);
    this.renderer.setSize(this.width, this.height, false);
  }

  render(state: GameState, deltaSeconds: number, editSelection?: RenderEditSelection, options: RenderOptions = {}): void {
    const player = getPlayerDisplayPosition(state);
    const useStageCamera = options.useStageCamera ?? true;
    const nextZoom = useStageCamera ? stageCameraZoomPercent(state) : this.cameraZoomPercent;
    this.applyCameraProjection(nextZoom);
    if (state.runId !== this.lastRunId) {
      this.cameraFocusX = targetCameraFocusX(player.x, state, useStageCamera);
      this.cameraFocusZ = targetCameraFocusZ(player.z, state, useStageCamera);
      this.finalCameraLock = undefined;
      this.lastRunId = state.runId;
    }
    if (state.stage.mode !== "finalSequence" || !useStageCamera) {
      this.finalCameraLock = undefined;
    } else if (this.finalCameraLock?.runId !== state.runId) {
      this.finalCameraLock = { runId: state.runId, x: this.cameraFocusX, z: this.cameraFocusZ };
    }
    const targetFocusX = this.finalCameraLock?.x ?? targetCameraFocusX(player.x, state, useStageCamera);
    const targetFocusZ = this.finalCameraLock?.z ?? targetCameraFocusZ(player.z, state, useStageCamera);
    const alpha = 1 - Math.exp(-deltaSeconds / CAMERA_SPEC.smoothingSeconds);
    this.cameraFocusX = lerp(this.cameraFocusX, targetFocusX, alpha);
    this.cameraFocusZ = lerp(this.cameraFocusZ, targetFocusZ, alpha);
    this.positionCamera();
    this.prepareStageCaches(state);
    const renderWindow = this.visibleRenderWindow();
    this.rebuildWorld(state, editSelection, renderWindow);
    this.renderer.render(this.scene, this.camera);
  }

  private applyCameraProjection(percent: number): void {
    const zoomPercent = clamp(percent, 90, 190);
    this.appliedCameraZoomPercent = zoomPercent;
    const aspect = this.width / this.height;
    const preset = CAMERA_PRESETS[this.activeCameraPreset];
    const orthoSize = (aspect < 0.82 ? preset.portraitOrthoSize : preset.orthoSize) * (100 / zoomPercent);
    this.camera.left = -orthoSize * aspect;
    this.camera.right = orthoSize * aspect;
    this.camera.top = orthoSize;
    this.camera.bottom = -orthoSize;
    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    this.renderer.dispose();
    this.boxGeometry.dispose();
    this.planeGeometry.dispose();
    for (const material of this.materials.values()) material.dispose();
    for (const material of this.billboardTextMaterials.values()) {
      material.map?.dispose();
      material.dispose();
    }
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

  private prepareStageCaches(state: GameState): void {
    if (state.runId === this.cacheRunId) return;
    this.sortedLaneCache = sortedLanes(state.lanes);
    this.objectsByZ = indexObjectsByZ(state.stageObjects);
    this.billboardCopyById = indexBillboardCopy(state.stageObjects);
    this.cacheRunId = state.runId;
  }

  private visibleRenderWindow(): RenderWindow {
    const zValues: number[] = [];
    for (const [x, y] of [[-1, -1], [-1, 1], [1, -1], [1, 1], [0, -1], [0, 1]] as const) {
      this.frustumProbe.set(x, y);
      this.raycaster.setFromCamera(this.frustumProbe, this.camera);
      const point = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.groundPlane, point)) zValues.push(point.z);
    }
    if (!zValues.length) return { minZ: Math.floor(this.cameraFocusZ) - 10, maxZ: Math.ceil(this.cameraFocusZ) + 10 };
    return {
      minZ: Math.floor(Math.min(...zValues)) - 4,
      maxZ: Math.ceil(Math.max(...zValues)) + 4,
    };
  }

  private rebuildWorld(state: GameState, editSelection: RenderEditSelection | undefined, renderWindow: RenderWindow): void {
    const visibleLanes = this.visibleLanes(renderWindow);
    const staticWorldKey = this.staticLayerKey(state, renderWindow);
    if (staticWorldKey !== this.staticWorldKey) {
      this.staticWorld.clear();
      this.withActiveWorld(this.staticWorld, () => {
        this.addBackdrop(renderWindow);
        for (const lane of visibleLanes) {
          this.addLane(lane);
          this.addStaticObjects(lane, this.objectsByZ.get(lane.z) ?? []);
        }
      });
      this.staticWorldKey = staticWorldKey;
    }

    this.dynamicWorld.clear();
    this.withActiveWorld(this.dynamicWorld, () => {
      this.addDecorativeLowerWaterRows(state.time, renderWindow);
      this.addDecorativeUpperExtensionRows(state.time, state.lanes, renderWindow);
      for (const lane of visibleLanes) {
        this.addDynamicObjects(lane, state, this.objectsByZ.get(lane.z) ?? []);
        if (lane.kind === "train") this.addAutomaticTrainWarningAnchors(lane, state.time);
        this.addMovingObjects(lane, state);
      }
      this.addPlayerAndTarget(state, renderWindow);
      if (editSelection) this.addEditSelection(editSelection);
    });
  }

  private staticLayerKey(state: GameState, renderWindow: RenderWindow): string {
    return [
      state.runId,
      renderWindow.minZ,
      renderWindow.maxZ,
      this.models.size,
      this.failedModels.size,
    ].join(":");
  }

  private withActiveWorld(world: THREE.Group, render: () => void): void {
    const previousWorld = this.activeWorld;
    this.activeWorld = world;
    render();
    this.activeWorld = previousWorld;
  }

  private visibleLanes(renderWindow: RenderWindow): LaneState[] {
    return this.sortedLaneCache.filter((lane) => lane.z >= renderWindow.minZ && lane.z <= renderWindow.maxZ);
  }

  private addBackdrop(renderWindow: RenderWindow): void {
    const centerZ = (renderWindow.minZ + renderWindow.maxZ) / 2;
    const depth = Math.max(8, renderWindow.maxZ - renderWindow.minZ + 4);
    this.addBox(0, -0.18, centerZ, 20.8, 0.12, depth, PALETTE.grassBase, false);
  }

  private addLane(lane: LaneState): void {
    const laneColor = lane.kind === "river"
      ? lane.z % 2 === 0 ? PALETTE.riverBase : PALETTE.riverAlt
      : lane.kind === "train"
        ? PALETTE.trackBase
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
    if (lane.kind === "train") {
      this.addTrainTrack(lane.z);
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

  private addStaticObjects(lane: LaneState, objects: StagePlacedObject[]): void {
    if (lane.kind !== "grass") return;
    for (const object of objects) {
      if (object.z !== lane.z) continue;
      if (object.kind === "tree") this.addTree(object.x, object.z, object.assetId);
      if (object.kind === "building") this.addBuilding(object);
      if (object.kind === "billboard") this.addBillboard(objectCenterX(object), object.z - 0.42, object.assetId, false, this.billboardCopyById.get(object.id));
    }
  }

  private addDynamicObjects(lane: LaneState, state: GameState, objects: StagePlacedObject[]): void {
    if (lane.kind !== "grass") return;
    for (const object of objects) {
      if (object.z !== lane.z) continue;
      if (object.kind === "warning") this.addWarningSign(object.x, this.groundEdgePropZ(object, state), object.assetId, this.isWarningPropActive(object, state));
      if (object.kind === "pancake" && !state.collectedPancakes.has(pancakeKey(object.x, object.z))) {
        const escape = pancakeVisual(object.x, object.z, state);
        if (escape !== null) this.addPancake(object.x, object.z, object.assetId, escape);
      }
    }
  }

  private addMovingObjects(lane: LaneState, state: GameState): void {
    for (const span of getMovingSpans(lane, state.time)) {
      if (span.kind === "platform") {
        this.addLogPlatform(span.centerX, span.z, span.length);
        continue;
      }
      if (span.kind === "train") {
        this.addTrain(span.centerX, span.z, span.length, span.direction);
        continue;
      }
      const isTruck = span.length > 2.4;
      const height = isTruck ? 0.74 : 0.54;
      this.addBox(span.centerX, height / 2 + 0.08, span.z, span.length, height, 0.72, span.color, true);
      this.addBox(span.centerX + span.direction * span.length * 0.18, height + 0.19, span.z, span.length * 0.42, 0.28, 0.52, 0xdff6ff, true);
      const wheelOffset = Math.min(span.length / 2 - 0.25, 1.22);
      for (const sideZ of [-0.42, 0.42]) {
        this.addBox(span.centerX - wheelOffset, 0.13, span.z + sideZ, 0.28, 0.22, 0.12, PALETTE.playerDark, true);
        this.addBox(span.centerX + wheelOffset, 0.13, span.z + sideZ, 0.28, 0.22, 0.12, PALETTE.playerDark, true);
      }
    }
  }

  private addDecorativeLowerWaterRows(time: number, renderWindow: RenderWindow): void {
    for (const z of [-2, -1]) {
      if (z < renderWindow.minZ || z > renderWindow.maxZ) continue;
      this.addBox(0, -0.055, z, 17.4, 0.1, 0.98, z % 2 === 0 ? PALETTE.riverAlt : PALETTE.riverBase, false);
      this.addWaterMarks(z);
      const direction = z === -1 ? 1 : -1;
      const speed = (z === -1 ? 1.1 : 0.8) * DECORATIVE_LOG_SPEED_MULTIPLIER;
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

  private addDecorativeUpperExtensionRows(time: number, lanes: Map<number, LaneState>, renderWindow: RenderWindow): void {
    const topZ = Math.max(...lanes.keys());
    for (let offset = 1; offset <= 3; offset += 1) {
      const z = topZ + offset;
      if (z < renderWindow.minZ || z > renderWindow.maxZ) continue;
      this.addBox(0, -0.055, z, 17.4, 0.1, 0.98, z % 2 === 0 ? PALETTE.riverBase : PALETTE.riverAlt, false);
      this.addWaterMarks(z);
      const direction = offset % 2 === 0 ? -1 : 1;
      const length = offset === 3 ? 4.4 : offset === 2 ? 1.85 : 3;
      const speed = (offset === 2 ? 1.8 : 1.25) * DECORATIVE_LOG_SPEED_MULTIPLIER;
      const gap = offset === 2 ? 4.6 : 6.5;
      this.addDecorativeMovingLogs(z, time, direction, speed, length, gap);
    }

    for (let offset = 4; offset <= 6; offset += 1) {
      const z = topZ + offset;
      if (z < renderWindow.minZ || z > renderWindow.maxZ) continue;
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

  private addTrainTrack(z: number): void {
    this.addBox(0, 0.018, z - 0.22, 17.8, 0.035, 0.055, PALETTE.railMetal, false);
    this.addBox(0, 0.018, z + 0.22, 17.8, 0.035, 0.055, PALETTE.railMetal, false);
    for (let x = -8.4; x <= 8.4; x += 0.72) {
      this.addBox(x, 0.012, z, 0.12, 0.032, 0.66, PALETTE.railTie, false);
    }
  }

  private addTrain(x: number, z: number, length: number, direction: -1 | 1): void {
    const cars = Math.max(2, Math.round(length / 1.5));
    const carLength = length / cars;
    for (let index = 0; index < cars; index += 1) {
      const offset = (index - (cars - 1) / 2) * carLength;
      const carX = x + offset;
      const isEngine = direction === 1 ? index === cars - 1 : index === 0;
      this.addBox(carX, 0.42, z, carLength * 0.92, 0.68, 0.62, isEngine ? PALETTE.trainBody : 0x303945, true);
      this.addBox(carX, 0.66, z - 0.33, carLength * 0.62, 0.12, 0.045, PALETTE.trainStripe, true);
      this.addBox(carX + direction * carLength * 0.18, 0.73, z, carLength * 0.28, 0.18, 0.5, 0xd8eef5, true);
      this.addBox(carX - carLength * 0.28, 0.12, z - 0.28, 0.18, 0.14, 0.12, PALETTE.playerDark, true);
      this.addBox(carX + carLength * 0.28, 0.12, z + 0.28, 0.18, 0.14, 0.12, PALETTE.playerDark, true);
    }
  }

  private addLogPlatform(x: number, z: number, length: number): void {
    this.addBox(x, 0.13, z, length, 0.26, 0.62, PALETTE.logBase, true);
    this.addBox(x - length * 0.35, 0.22, z, 0.12, 0.1, 0.66, PALETTE.logAlt, true);
    this.addBox(x + length * 0.35, 0.22, z, 0.12, 0.1, 0.66, PALETTE.logAlt, true);
  }

  private addWarningSign(x: number, z: number, assetId: StageAssetId | undefined, active: boolean): void {
    const flash = active && Math.floor(performance.now() / 160) % 2 === 0;
    const primary = flash ? PALETTE.warningRed : PALETTE.warningYellow;
    const height = assetId === "warningSign02" ? 0.8 : 0.64;
    this.addBox(x, height / 2, z, 0.08, height, 0.08, PALETTE.billboardPost, true);
    this.addBox(x, height + 0.16, z, 0.58, 0.36, 0.08, primary, true);
    this.addBox(x, height + 0.16, z - 0.055, 0.42, 0.06, 0.028, PALETTE.playerDark, true);
    this.addBox(x, height + 0.06, z - 0.055, 0.42, 0.06, 0.028, PALETTE.playerDark, true);
  }

  private addAutomaticTrainWarningAnchors(lane: LaneState, time: number): void {
    const active = isTrainWarningActive(lane, time);
    const flash = active && Math.floor(performance.now() / 145) % 2 === 0;
    const signalColor = flash ? PALETTE.warningRed : active ? PALETTE.warningYellow : 0xd8b760;
    const postColor = active ? PALETTE.billboardPost : 0x7b6858;
    for (const x of [GRID.visibleMinX + 0.72, GRID.visibleMaxX - 0.72]) {
      this.addBox(x, 0.36, lane.z, 0.12, 0.72, 0.12, postColor, true);
      this.addBox(x, 0.82, lane.z - 0.08, 0.46, 0.16, 0.08, signalColor, true);
      this.addBox(x, 1.04, lane.z - 0.08, 0.46, 0.16, 0.08, signalColor, true);
      this.addBox(x, 1.21, lane.z - 0.08, 0.64, 0.08, 0.06, PALETTE.railMetal, true);
    }
  }

  private addBillboard(x: number, z: number, assetId: StageAssetId | undefined, foreground = false, copy: readonly [string, string] = BILLBOARD_COPY[0]): void {
    const wide = assetId === "billboard02";
    const width = wide ? 3.35 : 2.6;
    const height = wide ? 1.28 : 1.02;
    const postHeight = wide ? 1.42 : 1.18;
    const faceY = wide ? 1.22 : 1.06;
    const faceZ = z - 0.22;
    const postOffset = width * 0.38;
    this.addBox(x, 0.04, z + 0.1, width * 0.82, 0.04, 0.34, 0x5a4638, false, foreground ? 0 : 0.18, foreground);
    this.addBox(x - postOffset, postHeight / 2, z + 0.04, 0.12, postHeight, 0.1, PALETTE.billboardPost, !foreground, 1, foreground);
    this.addBox(x + postOffset, postHeight / 2, z + 0.04, 0.12, postHeight, 0.1, PALETTE.billboardPost, !foreground, 1, foreground);
    this.addBox(x, faceY, faceZ, width, height, 0.12, PALETTE.billboardFace, !foreground, 1, foreground);
    this.addBox(x, faceY + height * 0.43, faceZ - 0.07, width * 0.94, 0.075, 0.04, PALETTE.billboardFrame, !foreground, 1, foreground);
    this.addBox(x, faceY - height * 0.43, faceZ - 0.07, width * 0.94, 0.075, 0.04, PALETTE.billboardFrame, !foreground, 1, foreground);
    this.addBox(x - width * 0.47, faceY, faceZ - 0.07, 0.075, height * 0.84, 0.04, PALETTE.billboardFrame, !foreground, 1, foreground);
    this.addBox(x + width * 0.47, faceY, faceZ - 0.07, 0.075, height * 0.84, 0.04, PALETTE.billboardFrame, !foreground, 1, foreground);
    this.addBox(x - width * 0.24, faceY + height * 0.25, faceZ - 0.09, width * 0.34, 0.06, 0.035, PALETTE.billboardAccent, !foreground, 1, foreground);
    this.addBillboardTextPanel(x, faceY, faceZ - 0.095, width * 0.82, height * 0.7, assetId, foreground, copy);
  }

  private addBillboardTextPanel(x: number, y: number, z: number, width: number, height: number, assetId: StageAssetId | undefined, foreground: boolean, copy: readonly [string, string]): void {
    const material = this.billboardTextMaterial(assetId === "billboard02" ? "billboard02" : "billboard01", foreground, copy);
    const mesh = new THREE.Mesh(this.planeGeometry, material);
    mesh.position.set(x, y - height * 0.02, z);
    mesh.rotation.y = Math.PI;
    mesh.scale.set(width, height, 1);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    if (foreground) mesh.renderOrder = 30;
    this.activeWorld.add(mesh);
  }

  private billboardTextMaterial(assetId: "billboard01" | "billboard02", foreground: boolean, copy: readonly [string, string]): THREE.MeshBasicMaterial {
    const key = `${assetId}:${foreground ? "foreground" : "world"}:${copy.join("/")}`;
    const cached = this.billboardTextMaterials.get(key);
    if (cached) return cached;
    const texture = new THREE.CanvasTexture(createBillboardCanvas(assetId, copy));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.FrontSide,
      transparent: false,
      toneMapped: false,
      depthTest: !foreground,
      depthWrite: !foreground,
    });
    this.billboardTextMaterials.set(key, material);
    return material;
  }

  private addBillboardForegroundPass(player: GridPoint, renderWindow: RenderWindow): void {
    for (let z = renderWindow.minZ; z <= renderWindow.maxZ; z += 1) {
      for (const object of this.objectsByZ.get(z) ?? []) {
        if (object.kind !== "billboard" || !shouldBillboardOverlayPlayer(object, player)) continue;
        this.addBillboard(objectCenterX(object), object.z - 0.42, object.assetId, true, this.billboardCopyById.get(object.id));
      }
    }
  }

  private isWarningPropActive(object: StagePlacedObject, state: GameState): boolean {
    if (object.kind !== "warning") return false;
    for (const lane of state.lanes.values()) {
      if (lane.kind === "train" && Math.abs(lane.z - object.z) <= 1 && isTrainWarningActive(lane, state.time)) return true;
    }
    return false;
  }

  private groundEdgePropZ(object: StagePlacedObject, state: GameState): number {
    let nearestTrainZ: number | undefined;
    for (const lane of state.lanes.values()) {
      if (lane.kind !== "train" || Math.abs(lane.z - object.z) > 1) continue;
      if (nearestTrainZ === undefined || Math.abs(lane.z - object.z) < Math.abs(nearestTrainZ - object.z)) nearestTrainZ = lane.z;
    }
    if (nearestTrainZ !== undefined) return (object.z + nearestTrainZ) / 2;
    return object.z - 0.42;
  }

  private addPlayerAndTarget(state: GameState, renderWindow: RenderWindow): void {
    const player = getPlayerDisplayPosition(state);
    if (!this.addMrAwesomePlayer(player.x, player.y, player.z)) {
      this.addPrimitiveHero(player.x, 0.08 + player.y, player.z, state.phase === "crashed");
    }

    if (state.stage.target.visible && state.stage.target.z >= renderWindow.minZ && state.stage.target.z <= renderWindow.maxZ) {
      const target = state.stage.target;
      const visual = finalTargetVisual(state);
      if (visual) {
        if (!this.addMrNotSoAwesomeTarget(target.x, target.z, visual)) {
          this.addPrimitiveTarget(target.x, target.z, visual);
        }
      }
    } else if (state.stage.targetEscape) {
      const travel = targetTravelVisual(state);
      if (travel && isZInRenderWindow(travel.z, renderWindow)) {
        if (!this.addMrNotSoAwesomeTarget(travel.x, travel.z, travel.visual)) {
          this.addPrimitiveTarget(travel.x, travel.z, travel.visual);
        }
      } else if (!state.stage.targetPending && isZInRenderWindow(state.stage.targetEscape.z, renderWindow)) {
        const escape = escapeVisual(state.stage.targetEscape.startedAt, state.time);
        if (escape) {
          const target = state.stage.targetEscape;
          if (!this.addMrNotSoAwesomeTarget(target.x, target.z, escape)) {
            this.addPrimitiveTarget(target.x, target.z, escape);
          }
        }
      }
    }
    this.addBillboardForegroundPass(player, renderWindow);
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

  private addPrimitiveTarget(x: number, z: number, visual: EscapeVisual = defaultEscapeVisual()): void {
    const visualZ = z + CHARACTER_LANE_CENTER_Z_OFFSET + visual.zOffset;
    const targetY = MR_NOT_SO_AWESOME_HEIGHT_SCALE;
    this.addBox(x, visual.yOffset + 0.38 * targetY * visual.scale, visualZ, 0.5 * visual.scale, 0.74 * targetY * visual.scale, 0.42 * visual.scale, PALETTE.villainBody, true, visual.opacity);
    this.addBox(x, visual.yOffset + 0.88 * targetY * visual.scale, visualZ - 0.04, 0.42 * visual.scale, 0.34 * targetY * visual.scale, 0.36 * visual.scale, PALETTE.villainEye, true, visual.opacity);
    this.addBox(x - 0.24 * visual.scale, visual.yOffset + 0.92 * targetY * visual.scale, visualZ - 0.02, 0.12 * visual.scale, 0.18 * targetY * visual.scale, 0.14 * visual.scale, PALETTE.villainDark, true, visual.opacity);
    this.addBox(x + 0.24 * visual.scale, visual.yOffset + 0.92 * targetY * visual.scale, visualZ - 0.02, 0.12 * visual.scale, 0.18 * targetY * visual.scale, 0.14 * visual.scale, PALETTE.villainDark, true, visual.opacity);
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

  private addPancake(x: number, z: number, assetId?: StageAssetId, visual: EscapeVisual = defaultEscapeVisual()): void {
    const visualZ = z + PANCAKE_LANE_CENTER_Z_OFFSET + visual.zOffset;
    if (!assetId || assetId === "pancake") {
      if (this.addTexturedPancake(x, z, visual)) return;
    } else if (assetId in ASSET_PATHS && this.addAssetModel(assetId as ModelKey, x, 0.025, visualZ, { width: 0.62, height: 0.28, depth: 0.62 }, Math.PI * stableQuarterTurn(x, z) / 2)) {
      return;
    }
    this.addBox(x, visual.yOffset + 0.11 * visual.scale, visualZ, 0.58 * visual.scale, 0.08 * visual.scale, 0.58 * visual.scale, PALETTE.pancakeAlt, true, visual.opacity);
    this.addBox(x, visual.yOffset + 0.18 * visual.scale, visualZ, 0.5 * visual.scale, 0.06 * visual.scale, 0.5 * visual.scale, PALETTE.pancakeBase, true, visual.opacity);
    this.addBox(x + 0.1 * visual.scale, visual.yOffset + 0.23 * visual.scale, visualZ - 0.06 * visual.scale, 0.16 * visual.scale, 0.04 * visual.scale, 0.12 * visual.scale, PALETTE.butterColor, true, visual.opacity);
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
    this.activeWorld.add(clone);
    return true;
  }

  private addMrNotSoAwesomeTarget(x: number, z: number, visual: EscapeVisual = defaultEscapeVisual()): boolean {
    const targetModel = this.models.get("target");
    const playerModel = this.models.get("player");
    if (!targetModel || !playerModel) {
      this.loadModel("target");
      this.loadModel("player");
      return false;
    }

    const clone = targetModel.source.clone(true);
    const scale = MR_AWESOME_PLAYER_SCALE;
    if (visual.opacity < 1) setObjectOpacity(clone, visual.opacity);
    const equalizer = new THREE.Vector3(
      (playerModel.size.x * MR_AWESOME_PLAYER_SCALE) / Math.max(0.001, targetModel.size.x * scale),
      (playerModel.size.y * MR_AWESOME_PLAYER_SCALE) / Math.max(0.001, targetModel.size.y * scale),
      (playerModel.size.z * MR_AWESOME_PLAYER_SCALE) / Math.max(0.001, targetModel.size.z * scale),
    );
    clone.name = "mr_not_so_awesome_target";
    clone.position.set(x, 0.025 + visual.yOffset, z + CHARACTER_LANE_CENTER_Z_OFFSET + visual.zOffset);
    clone.rotation.y = Math.PI;
    clone.scale.set(
      scale * CHARACTER_WIDTH_SCALE * equalizer.x * visual.scale,
      scale * MR_NOT_SO_AWESOME_HEIGHT_SCALE * equalizer.y * visual.scale,
      scale * equalizer.z * visual.scale,
    );
    this.activeWorld.add(clone);
    return true;
  }

  private addTexturedPancake(x: number, z: number, visual: EscapeVisual = defaultEscapeVisual()): boolean {
    const model = this.models.get("pancake");
    if (!model) {
      this.loadModel("pancake");
      return false;
    }
    const clone = model.source.clone(true);
    if (visual.opacity < 1) setObjectOpacity(clone, visual.opacity);
    clone.name = "textured_pancake_collectible";
    clone.position.set(x, 0.025 + visual.yOffset, z + PANCAKE_LANE_CENTER_Z_OFFSET + visual.zOffset);
    clone.rotation.y = Math.PI * stableQuarterTurn(x, z) / 2;
    clone.scale.set(
      PANCAKE_MODEL_SCALE_XZ * visual.scale,
      PANCAKE_MODEL_SCALE_Y * visual.scale,
      PANCAKE_MODEL_SCALE_XZ * visual.scale,
    );
    this.activeWorld.add(clone);
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
    this.activeWorld.add(group);
    return true;
  }

  private addBox(x: number, y: number, z: number, width: number, height: number, depth: number, color: number, castShadow: boolean, opacity = 1, foreground = false): void {
    const mesh = new THREE.Mesh(this.boxGeometry, this.material(color, opacity, foreground));
    mesh.position.set(x, y, z);
    mesh.scale.set(width, height, depth);
    mesh.castShadow = castShadow && !foreground;
    mesh.receiveShadow = !foreground;
    if (foreground) mesh.renderOrder = 30;
    this.activeWorld.add(mesh);
  }

  private material(color: number, opacity: number, foreground = false): THREE.Material {
    const key = `${color.toString(16)}:${opacity.toFixed(2)}:${foreground ? "foreground" : "world"}`;
    const cached = this.materials.get(key);
    if (cached) return cached;
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.78,
      metalness: 0,
      transparent: opacity < 1,
      opacity,
      depthTest: !foreground,
      depthWrite: !foreground,
    });
    this.materials.set(key, material);
    return material;
  }

  private loadInitialAssets(): void {
    this.loadModel("player");
    window.setTimeout(() => this.loadModel("target"), 260);
    window.setTimeout(() => this.loadModel("pancake"), 620);
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
    this.staticWorldKey = "";
  }

  private markModelFailed(key: ModelKey, error: unknown): void {
    this.loadingModels.delete(key);
    this.failedModels.add(key);
    this.staticWorldKey = "";
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

function indexObjectsByZ(objects: StagePlacedObject[]): Map<number, StagePlacedObject[]> {
  const indexed = new Map<number, StagePlacedObject[]>();
  for (const object of objects) {
    const existing = indexed.get(object.z);
    if (existing) existing.push(object);
    else indexed.set(object.z, [object]);
  }
  return indexed;
}

function targetCameraFocusX(playerX: number, state: GameState, useStageCamera: boolean): number {
  if (useStageCamera && (state.stage.mode === "summoning" || state.stage.mode === "finalSequence") && state.stage.target.visible) {
    return clamp(((playerX + state.stage.target.x) / 2) * CAMERA_SPEC.sideFollowRatio, -CAMERA_SPEC.sideFollowClamp, CAMERA_SPEC.sideFollowClamp);
  }
  return clamp(playerX * CAMERA_SPEC.sideFollowRatio, -CAMERA_SPEC.sideFollowClamp, CAMERA_SPEC.sideFollowClamp);
}

function targetCameraFocusZ(playerZ: number, state: GameState, useStageCamera: boolean): number {
  const laneMaxZ = Math.max(...state.lanes.keys());
  const authoredTopStopZ = laneMaxZ - CAMERA_SPEC.topBoundaryLeadRows;
  const dynamicTopStopZ = laneMaxZ - CHASE_CAMERA_TOP_STOP_LEAD_ROWS;
  const topStopPlayerZ = Math.max(
    CAMERA_SPEC.bottomAnchorPlayerZ,
    Math.min(authoredTopStopZ, CHASE_CAMERA_TOP_STOP_Z, dynamicTopStopZ),
  );
  if (useStageCamera && state.stage.mode === "introPancakes") return rawCameraFocusZ(CAMERA_SPEC.bottomAnchorPlayerZ);
  if (useStageCamera && state.stage.mode === "summoning" && state.stage.target.visible) {
    return introRevealCameraFocusZ(state, topStopPlayerZ);
  }
  if (useStageCamera && state.stage.mode === "finalSequence" && state.stage.target.visible) {
    const framedZ = (playerZ + state.stage.target.z) / 2 - 0.6;
    return rawCameraFocusZ(clamp(framedZ, CAMERA_SPEC.bottomAnchorPlayerZ, topStopPlayerZ));
  }
  if (useStageCamera && state.stage.mode === "chase" && !state.stage.introCameraHandoffDone) {
    const introFocus = introRevealCameraFocusZ(state, topStopPlayerZ);
    if (state.stage.introCameraHandoffStartedAt !== undefined && state.stage.introCameraHandoffReleaseAt !== undefined) {
      const chaseFocus = chaseCameraFocusZ(playerZ, topStopPlayerZ);
      const tweenStart = state.stage.introCameraHandoffStartedAt + ESCAPE_POP_SECONDS;
      const tweenDuration = Math.max(0.001, state.stage.introCameraHandoffReleaseAt - tweenStart);
      const progress = clamp((state.time - tweenStart) / tweenDuration, 0, 1);
      return lerp(introFocus, chaseFocus, easeInOutCubic(progress));
    }
    return introFocus;
  }
  return chaseCameraFocusZ(playerZ, topStopPlayerZ);
}

function stageCameraZoomPercent(state: GameState): number {
  if (state.stage.mode === "introPancakes" || state.stage.mode === "summoning") return REVEAL_CAMERA_ZOOM_PERCENT;
  if (state.stage.mode === "chase" && !state.stage.introCameraHandoffDone) {
    if (state.stage.introCameraHandoffStartedAt !== undefined && state.stage.introCameraHandoffReleaseAt !== undefined) {
      const tweenStart = state.stage.introCameraHandoffStartedAt + ESCAPE_POP_SECONDS;
      const tweenDuration = Math.max(0.001, state.stage.introCameraHandoffReleaseAt - tweenStart);
      const progress = clamp((state.time - tweenStart) / tweenDuration, 0, 1);
      return lerp(REVEAL_CAMERA_ZOOM_PERCENT, CHASE_CAMERA_ZOOM_PERCENT, easeInOutCubic(progress));
    }
    return REVEAL_CAMERA_ZOOM_PERCENT;
  }
  return CHASE_CAMERA_ZOOM_PERCENT;
}

function rawCameraFocusZ(playerZ: number): number {
  return Math.max(CAMERA_SPEC.bottomAnchorPlayerZ, playerZ) + CAMERA_SPEC.targetAheadRows - CAMERA_SPEC.foregroundPadding;
}

function introRevealCameraFocusZ(state: GameState, topStopPlayerZ: number): number {
  const framedPlayerZ = (state.stage.playerStart.z + state.stage.summonMarker.z) / 2 - 1.5;
  return rawCameraFocusZ(clamp(framedPlayerZ, CAMERA_SPEC.bottomAnchorPlayerZ, topStopPlayerZ));
}

function chaseCameraFocusZ(playerZ: number, topStopPlayerZ: number): number {
  const effectivePlayerZ = clamp(playerZ, CAMERA_SPEC.bottomAnchorPlayerZ, topStopPlayerZ);
  return rawCameraFocusZ(effectivePlayerZ + CHASE_CAMERA_AHEAD_OFFSET_ROWS);
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

function easeInOutCubic(value: number): number {
  const t = clamp(value, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function objectCenterX(object: StagePlacedObject): number {
  if (!object.cells.length) return object.x;
  const minX = Math.min(...object.cells.map((cell) => cell.x));
  const maxX = Math.max(...object.cells.map((cell) => cell.x));
  return (minX + maxX) / 2;
}

function indexBillboardCopy(objects: StagePlacedObject[]): Map<string, readonly [string, string]> {
  const indexed = new Map<string, readonly [string, string]>();
  const billboards = objects
    .filter((object) => object.kind === "billboard")
    .sort((a, b) => a.z - b.z || objectCenterX(a) - objectCenterX(b) || a.id.localeCompare(b.id));
  billboards.forEach((object, index) => indexed.set(object.id, BILLBOARD_COPY[index % BILLBOARD_COPY.length]));
  return indexed;
}

function shouldBillboardOverlayPlayer(object: StagePlacedObject, player: GridPoint): boolean {
  if (!object.cells.length) return false;
  const minX = Math.min(...object.cells.map((cell) => cell.x)) - 0.35;
  const maxX = Math.max(...object.cells.map((cell) => cell.x)) + 0.35;
  const inHorizontalCover = player.x >= minX && player.x <= maxX;
  const inVerticalCover = player.z >= object.z - 0.25 && player.z <= object.z + 0.35;
  return inHorizontalCover && inVerticalCover;
}

function defaultEscapeVisual(): EscapeVisual {
  return { yOffset: 0, zOffset: 0, scale: 1, opacity: 1 };
}

function finalTargetVisual(state: GameState): EscapeVisual | null {
  if (state.stage.mode !== "finalSequence") return targetNudgeVisual(state);
  if (state.stage.finalPoofStartedAt !== undefined && state.time >= state.stage.finalPoofStartedAt) {
    return escapeVisual(state.stage.finalPoofStartedAt, state.time, 0.23);
  }
  const startedAt = state.stage.finalStartedAt ?? state.time;
  const surpriseSeconds = Math.max(0, state.time - startedAt);
  const shake = surpriseSeconds < 1.2 ? Math.sin(surpriseSeconds * 48) * 0.035 : 0;
  return { ...defaultEscapeVisual(), zOffset: shake, scale: 1 + (surpriseSeconds < 0.5 ? Math.sin(surpriseSeconds * Math.PI * 4) * 0.035 : 0) };
}

function targetNudgeVisual(state: GameState): EscapeVisual {
  if (state.stage.mode !== "chase" || !state.stage.target.visible || Math.round(state.player.z) <= state.stage.target.z) {
    return defaultEscapeVisual();
  }
  const cycle = state.time % 2;
  if (cycle > 0.42) return defaultEscapeVisual();
  const pulse = Math.sin((cycle / 0.42) * Math.PI);
  return {
    yOffset: 0.03 * pulse,
    zOffset: Math.sin(cycle * 80) * 0.045 * pulse,
    scale: 1 + 0.055 * pulse,
    opacity: 1,
  };
}

function pancakeVisual(x: number, z: number, state: GameState): EscapeVisual | null {
  const key = pancakeKey(x, z);
  if (!state.stage.stolenPancakes.has(key)) return pancakeIdleBounceVisual(x, z, state);
  const startedAt = state.stage.stolenPancakesStartedAt;
  if (startedAt === undefined || state.time <= startedAt) return defaultEscapeVisual();
  return escapeVisual(startedAt, state.time, x * 0.017 + z * 0.011);
}

function pancakeIdleBounceVisual(x: number, z: number, state: GameState): EscapeVisual {
  const firstPancakeAt = state.stage.firstPancakeAt;
  if (
    state.stage.mode !== "introPancakes"
    || firstPancakeAt === undefined
    || state.stage.target.visible
    || state.stage.summonStartedAt !== undefined
    || !hasRemainingIntroPancakes(state)
  ) {
    return defaultEscapeVisual();
  }
  const elapsed = state.time - firstPancakeAt;
  if (elapsed < PANCAKE_IDLE_BOUNCE_INTERVAL_SECONDS) return defaultEscapeVisual();
  const cycle = (elapsed - PANCAKE_IDLE_BOUNCE_INTERVAL_SECONDS) % PANCAKE_IDLE_BOUNCE_INTERVAL_SECONDS;
  if (cycle > PANCAKE_IDLE_BOUNCE_SECONDS) return defaultEscapeVisual();
  const stagger = positiveModulo(x + z, 3) * 0.08;
  const progress = clamp((cycle - stagger) / PANCAKE_IDLE_BOUNCE_SECONDS, 0, 1);
  const fade = Math.sin(progress * Math.PI);
  const bounce = Math.max(0, Math.sin(progress * Math.PI * 2)) * fade;
  return {
    yOffset: 0.18 * bounce,
    zOffset: 0,
    scale: 1 + 0.045 * bounce,
    opacity: 1,
  };
}

function hasRemainingIntroPancakes(state: GameState): boolean {
  for (const lane of state.lanes.values()) {
    if (lane.z > state.stage.summonMarker.z) continue;
    for (const x of lane.collectibles) {
      const key = pancakeKey(x, lane.z);
      if (!state.collectedPancakes.has(key) && !state.stage.stolenPancakes.has(key)) return true;
    }
  }
  return false;
}

function targetTravelVisual(state: GameState): TargetTravelVisual | null {
  const from = state.stage.targetEscape;
  const to = state.stage.targetPending;
  if (!from || !to) return null;
  const revealAt = state.stage.targetRevealAt ?? from.startedAt + ESCAPE_POP_SECONDS;
  const duration = Math.max(0.18, revealAt - from.startedAt);
  const progress = clamp((state.time - from.startedAt) / duration, 0, 1);
  if (progress >= 1) return null;
  const eased = targetFlightProgress(progress);
  const arc = Math.sin(eased * Math.PI);
  const landing = progress > 0.82 ? easeOutCubic((progress - 0.82) / 0.18) : 0;
  const lateralOffset = targetFlightLateralOffset(from.x, from.z, to.x, to.z, state.stage.catchCount, progress);
  return {
    x: lerp(from.x, to.x, eased) + lateralOffset,
    z: lerp(from.z, to.z, eased),
    visual: {
      yOffset: 0.24 * easeInCubic(progress) + 0.52 * arc - 0.1 * landing,
      zOffset: 0.018 * Math.sin(progress * Math.PI * 7) * arc,
      scale: 1 + 0.08 * arc - 0.04 * landing,
      opacity: 1,
    },
  };
}

function targetFlightProgress(progress: number): number {
  if (progress < 0.38) return 0.18 * easeInCubic(progress / 0.38);
  return 0.18 + 0.82 * easeOutCubic((progress - 0.38) / 0.62);
}

function targetFlightLateralOffset(fromX: number, fromZ: number, toX: number, toZ: number, catchCount: number, progress: number): number {
  const seed = positiveModulo(Math.round((fromX + 9) * 31 + (fromZ + 3) * 17 + (toX + 11) * 43 + (toZ + 5) * 13 + catchCount * 29), 6);
  if (seed === 0) return 0;
  const direction = seed % 2 === 0 ? 1 : -1;
  const amplitude = seed <= 2 ? 0.24 : 0.34;
  if (seed <= 2) return direction * amplitude * Math.sin(progress * Math.PI);
  return direction * amplitude * Math.sin(progress * Math.PI * 2) * 0.82;
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function escapeVisual(startedAt: number, time: number, driftSeed = 0): EscapeVisual | null {
  const progress = clamp((time - startedAt) / ESCAPE_POP_SECONDS, 0, 1);
  if (progress >= 1) return null;
  const lift = easeOutCubic(progress);
  const shrink = easeInCubic(progress);
  const pop = Math.sin(progress * Math.PI);
  const endFade = progress < 0.82 ? 1 : 1 - (progress - 0.82) / 0.18;
  return {
    yOffset: 0.08 * pop + 0.78 * lift,
    zOffset: -0.16 * lift + Math.sin(driftSeed * 91.7) * 0.04 * pop,
    scale: Math.max(0.08, 1 + 0.16 * pop - 0.92 * shrink),
    opacity: clamp(endFade, 0, 1),
  };
}

function easeOutCubic(value: number): number {
  const inverted = 1 - value;
  return 1 - inverted * inverted * inverted;
}

function easeInCubic(value: number): number {
  return value * value * value;
}

function isZInRenderWindow(z: number, renderWindow: RenderWindow): boolean {
  return z >= renderWindow.minZ && z <= renderWindow.maxZ;
}

function setObjectOpacity(object: THREE.Object3D, opacity: number): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (Array.isArray(child.material)) {
      child.material = child.material.map((material) => transparentMaterial(material, opacity));
    } else {
      child.material = transparentMaterial(child.material, opacity);
    }
  });
}

function transparentMaterial(material: THREE.Material, opacity: number): THREE.Material {
  const clone = material.clone();
  clone.transparent = opacity < 1;
  clone.opacity = opacity;
  clone.depthWrite = opacity >= 0.98;
  return clone;
}

function createBillboardCanvas(assetId: "billboard01" | "billboard02", copy: readonly [string, string]): HTMLCanvasElement {
  const wide = assetId === "billboard02";
  const canvas = document.createElement("canvas");
  canvas.width = wide ? 1024 : 768;
  canvas.height = wide ? 448 : 320;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const ink = "#263338";
  const brown = "#523d2f";
  const paper = "#fff5cf";
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#d8464a";
  ctx.fillRect(wide ? 68 : 54, wide ? 52 : 42, wide ? 260 : 190, wide ? 18 : 14);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";
  ctx.lineJoin = "round";
  drawFittedText(ctx, copy[0], brown, 900, wide ? 74 : 56, wide ? 40 : 32, canvas.width / 2, wide ? 156 : 112, canvas.width * 0.86);
  drawFittedText(ctx, copy[1], ink, 900, wide ? 136 : 96, wide ? 56 : 46, canvas.width / 2, wide ? 310 : 230, canvas.width * 0.86);

  ctx.fillStyle = "rgba(82, 61, 47, 0.14)";
  ctx.fillRect(canvas.width * 0.16, canvas.height - (wide ? 52 : 38), canvas.width * 0.68, wide ? 12 : 9);
  return canvas;
}

function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  color: string,
  weight: number,
  startSize: number,
  minSize: number,
  x: number,
  y: number,
  maxWidth: number,
): void {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px Nunito, Arial, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  ctx.font = `${weight} ${size}px Nunito, Arial, sans-serif`;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y, maxWidth);
}

function enhanceLoadedAssetMaterials(key: ModelKey, source: THREE.Object3D): void {
  if (key !== "player" && key !== "target" && key !== "pancake") return;
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

function enhanceMaterialForAsset(key: "player" | "target" | "pancake", material: THREE.Material): void {
  const colorMaterial = material as THREE.Material & {
    color?: THREE.Color;
    emissive?: THREE.Color;
    emissiveIntensity?: number;
    roughness?: number;
    map?: THREE.Texture | null;
  };
  if (colorMaterial.map) {
    colorMaterial.map.colorSpace = THREE.SRGBColorSpace;
    colorMaterial.map.anisotropy = Math.max(colorMaterial.map.anisotropy, 8);
    colorMaterial.map.magFilter = THREE.LinearFilter;
    colorMaterial.map.minFilter = THREE.LinearMipmapLinearFilter;
    colorMaterial.map.needsUpdate = true;
  }
  if (colorMaterial.color) {
    if (key === "pancake") colorMaterial.color.offsetHSL(0.015, 0.16, 0.08);
    else if (key === "target") colorMaterial.color.offsetHSL(0, 0.08, 0.07);
  }
  if (colorMaterial.emissive) {
    colorMaterial.emissive.set(0x000000);
    colorMaterial.emissiveIntensity = 0;
  }
  if (typeof colorMaterial.roughness === "number") {
    colorMaterial.roughness = key === "pancake" ? Math.min(colorMaterial.roughness, 0.62) : Math.min(colorMaterial.roughness, 0.68);
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

function isCoarsePointer(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse), (hover: none)").matches;
}
