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
const MIN_ZOOM_PERCENT = 75;
const MAX_ZOOM_PERCENT = 160;
const MODEL_TARGET_HEIGHT = 3.25;

export class VillainAvatarRenderer {
  private readonly scene = new THREE.Scene();
  private readonly portraitRoot = new THREE.Group();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly loader = new GLTFLoader();
  private readonly modelCache = new Map<string, Promise<THREE.Object3D>>();
  private readonly resizeObserver: ResizeObserver;
  private model?: THREE.Object3D;
  private modelId = "";
  private disposed = false;
  private loadToken = 0;
  private zoomPercent = 100;
  private verticalOffset = DEFAULT_VERTICAL_OFFSET;
  private pendingRender = false;

  constructor(private readonly container: HTMLElement, initialModel: AvatarModelDefinition) {
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
    this.setModel(initialModel);
    this.render();
  }

  preload(modelDefinitions: readonly AvatarModelDefinition[]): void {
    for (const modelDefinition of modelDefinitions) {
      void this.getModelTemplate(modelDefinition).catch(() => undefined);
    }
  }

  dispose(): void {
    this.disposed = true;
    this.resizeObserver.disconnect();
    this.renderer.dispose();
    if (this.model) disposeObject(this.model);
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

  setModel(modelDefinition: AvatarModelDefinition): void {
    if (modelDefinition.id === this.modelId) return;
    const token = ++this.loadToken;
    const hasCurrentModel = Boolean(this.model);
    this.container.classList.toggle("is-loaded", hasCurrentModel);
    this.container.classList.remove("is-fallback");
    this.loadModel(modelDefinition, token);
    this.scheduleRender();
  }

  private loadModel(modelDefinition: AvatarModelDefinition, token: number): void {
    this.getModelTemplate(modelDefinition)
      .then((template) => {
        if (this.disposed || token !== this.loadToken) {
          return;
        }
        const model = cloneAvatarModel(template);
        model.name = `${modelDefinition.id}_avatar`;
        const previousModel = this.model;
        if (previousModel) this.portraitRoot.remove(previousModel);
        this.model = model;
        this.modelId = modelDefinition.id;
        this.portraitRoot.add(model);
        if (previousModel) disposeObject(previousModel);
        this.applyVerticalFrame();
        this.container.classList.add("is-loaded");
        this.render();
      })
      .catch(() => {
        if (!this.disposed && token === this.loadToken && !this.model) this.container.classList.add("is-fallback");
      });
  }

  private getModelTemplate(modelDefinition: AvatarModelDefinition): Promise<THREE.Object3D> {
    const cached = this.modelCache.get(modelDefinition.id);
    if (cached) return cached;
    const loadPromise = new Promise<THREE.Object3D>((resolve, reject) => {
      this.loader.load(
        modelDefinition.path,
        (gltf) => {
          const model = gltf.scene;
          if (modelDefinition.id === "mr-not-so-awesome") enhanceMrNotSoAwesomeMaterials(model);
          normalizeHeadPortraitModel(model);
          resolve(model);
        },
        undefined,
        (error) => reject(error),
      );
    }).catch((error) => {
      this.modelCache.delete(modelDefinition.id);
      throw error;
    });
    this.modelCache.set(modelDefinition.id, loadPromise);
    return loadPromise;
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

function cloneAvatarModel(template: THREE.Object3D): THREE.Object3D {
  const clone = template.clone(true);
  clone.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry = child.geometry.clone();
    child.material = Array.isArray(child.material)
      ? child.material.map((material) => material.clone())
      : child.material.clone();
  });
  return clone;
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
