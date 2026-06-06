import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export interface AvatarModelDefinition {
  id: string;
  path: string;
  label: string;
}

const DEFAULT_VIEW_SIZE = 1.24;
const PORTRAIT_CENTER_Y = 1.78;
const PORTRAIT_CAMERA_Y = 2.58;
const PORTRAIT_CAMERA_Z = 4.62;
const DEFAULT_VERTICAL_OFFSET = -0.08;
const MAX_VERTICAL_TUNE = 0.12;
const MAX_VERTICAL_INPUT = 100;
const MIN_ZOOM_PERCENT = 55;
const MAX_ZOOM_PERCENT = 160;
const MODEL_TARGET_HEIGHT = 3.25;

export class VillainAvatarRenderer {
  private readonly scene = new THREE.Scene();
  private readonly portraitRoot = new THREE.Group();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly loader = new GLTFLoader();
  private readonly resizeObserver: ResizeObserver;
  private readonly models = new Map<string, THREE.Object3D>();
  private readonly loadingModels = new Map<string, Promise<THREE.Object3D>>();
  private model?: THREE.Object3D;
  private modelId?: string;
  private disposed = false;
  private loadToken = 0;
  private zoomPercent = 100;
  private verticalOffset = DEFAULT_VERTICAL_OFFSET;
  private pendingRender = false;
  private firstReadyResolved = false;
  private resolveFirstReady: () => void = () => undefined;
  private readonly firstReadyPromise = new Promise<void>((resolve) => {
    this.resolveFirstReady = resolve;
  });

  constructor(
    private readonly container: HTMLElement,
    initialModel: AvatarModelDefinition,
    options: { deferInitialLoad?: boolean } = {},
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = false;
    this.container.appendChild(this.renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xf9fff2, 0x7b8198, 2.5);
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
    const fillLight = new THREE.DirectionalLight(0xd7e9ff, 0.55);
    keyLight.position.set(-2.5, 4.5, 3);
    fillLight.position.set(3, 2.5, 3);
    this.scene.add(hemiLight, keyLight, fillLight, this.portraitRoot);

    this.resizeObserver = new ResizeObserver(() => this.render());
    this.resizeObserver.observe(this.container);
    if (options.deferInitialLoad) this.markFirstReady();
    else void this.setModel(initialModel);
    this.render();
  }

  dispose(): void {
    this.disposed = true;
    this.resizeObserver.disconnect();
    this.renderer.dispose();
    for (const model of this.models.values()) disposeObject(model);
    this.models.clear();
    this.loadingModels.clear();
  }

  setFraming(options: { zoomPercent?: number; verticalOffsetPercent?: number }): void {
    if (typeof options.zoomPercent === "number") {
      this.zoomPercent = clamp(options.zoomPercent, MIN_ZOOM_PERCENT, MAX_ZOOM_PERCENT);
    }
    if (typeof options.verticalOffsetPercent === "number") {
      const offsetPercent = clamp(options.verticalOffsetPercent, -MAX_VERTICAL_INPUT, MAX_VERTICAL_INPUT) / 60;
      this.verticalOffset = DEFAULT_VERTICAL_OFFSET + offsetPercent * MAX_VERTICAL_TUNE;
      this.applyVerticalFrame();
    }
    this.scheduleRender();
  }

  preload(modelDefinition: AvatarModelDefinition): Promise<void> {
    return this.ensureModel(modelDefinition)
      .then(() => undefined)
      .catch(() => undefined);
  }

  isModelReady(modelId: string): boolean {
    return this.models.has(modelId);
  }

  setModel(modelDefinition: AvatarModelDefinition): Promise<void> {
    if (this.modelId === modelDefinition.id && this.model) {
      this.container.classList.add("is-loaded");
      this.scheduleRender();
      return Promise.resolve();
    }
    const token = ++this.loadToken;
    this.container.classList.remove("is-fallback");
    if (!this.model) this.container.classList.remove("is-loaded");
    const cachedModel = this.models.get(modelDefinition.id);
    if (cachedModel) {
      this.switchModel(modelDefinition.id, cachedModel, token);
      return Promise.resolve();
    }
    this.scheduleRender();
    return this.ensureModel(modelDefinition)
      .then((nextModel) => {
        if (!this.disposed && token === this.loadToken) this.switchModel(modelDefinition.id, nextModel, token);
      })
      .catch(() => {
        if (!this.disposed && token === this.loadToken) {
          if (!this.model) this.container.classList.add("is-fallback");
          this.markFirstReady();
        }
      });
  }

  whenReady(): Promise<void> {
    return this.firstReadyPromise;
  }

  private ensureModel(modelDefinition: AvatarModelDefinition): Promise<THREE.Object3D> {
    const existing = this.models.get(modelDefinition.id);
    if (existing) return Promise.resolve(existing);
    const loading = this.loadingModels.get(modelDefinition.id);
    if (loading) return loading;
    const nextLoading = new Promise<THREE.Object3D>((resolve, reject) => {
      this.loader.load(
        modelDefinition.path,
        (gltf) => {
          const nextModel = gltf.scene;
          nextModel.name = `${modelDefinition.id}_avatar`;
          if (modelDefinition.id === "mr-not-so-awesome") enhanceMrNotSoAwesomeMaterials(nextModel);
          normalizeHeadPortraitModel(nextModel);
          nextModel.visible = false;
          this.models.set(modelDefinition.id, nextModel);
          this.loadingModels.delete(modelDefinition.id);
          resolve(nextModel);
        },
        undefined,
        (error) => {
          this.loadingModels.delete(modelDefinition.id);
          reject(error);
        },
      );
    });
    this.loadingModels.set(modelDefinition.id, nextLoading);
    return nextLoading;
  }

  private switchModel(modelId: string, nextModel: THREE.Object3D, token: number): void {
    if (this.disposed || token !== this.loadToken) return;
    if (this.model && this.model !== nextModel) {
      this.model.visible = false;
      this.portraitRoot.remove(this.model);
    }
    this.model = nextModel;
    this.modelId = modelId;
    nextModel.visible = true;
    if (!this.portraitRoot.children.includes(nextModel)) this.portraitRoot.add(nextModel);
    this.applyVerticalFrame();
    this.container.classList.add("is-loaded");
    this.markFirstReady();
    this.render();
  }

  private markFirstReady(): void {
    if (this.firstReadyResolved) return;
    this.firstReadyResolved = true;
    this.resolveFirstReady();
  }

  private render(): void {
    this.pendingRender = false;
    const rect = this.container.getBoundingClientRect();
    const size = Math.max(1, Math.floor(Math.min(rect.width, rect.height)));
    this.renderer.setSize(size, size, false);

    const aspect = 1;
    const zoomT = (this.zoomPercent - 100) / 100;
    const zoomScale = clamp(1 + zoomT * 0.58, 0.82, 1.36);
    const viewSize = DEFAULT_VIEW_SIZE / zoomScale;
    this.camera.left = -viewSize * aspect;
    this.camera.right = viewSize * aspect;
    this.camera.top = viewSize;
    this.camera.bottom = -viewSize;
    this.camera.position.set(0, PORTRAIT_CAMERA_Y, PORTRAIT_CAMERA_Z);
    this.camera.lookAt(0, PORTRAIT_CENTER_Y, 0);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
    this.renderer.render(this.scene, this.camera);
  }

  private scheduleRender(): void {
    if (this.pendingRender) return;
    this.pendingRender = true;
    requestAnimationFrame(() => {
      if (!this.disposed) this.render();
    });
  }

  private applyVerticalFrame(): void {
    this.portraitRoot.position.y = this.verticalOffset;
  }
}

function normalizeHeadPortraitModel(model: THREE.Object3D): void {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  model.position.set(-center.x, -box.min.y, -center.z);
  model.rotation.y = Math.PI;
  const scale = MODEL_TARGET_HEIGHT / Math.max(0.001, size.y);
  model.scale.setScalar(scale);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function enhanceMrNotSoAwesomeMaterials(model: THREE.Object3D): void {
  const seen = new Set<THREE.Material>();
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if (seen.has(material)) continue;
      seen.add(material);
      const colorMaterial = material as THREE.Material & {
        color?: THREE.Color;
        emissive?: THREE.Color;
        emissiveIntensity?: number;
        roughness?: number;
      };
      colorMaterial.color?.offsetHSL(0, 0.08, 0.07);
      if (colorMaterial.emissive) {
        colorMaterial.emissive.set(0xcfd7e8);
        colorMaterial.emissiveIntensity = 0.1;
      }
      if (typeof colorMaterial.roughness === "number") colorMaterial.roughness = Math.min(colorMaterial.roughness, 0.7);
      material.needsUpdate = true;
    }
  });
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) material.dispose();
  });
}
