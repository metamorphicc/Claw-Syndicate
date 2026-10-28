import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export interface ClawScene {
  setPaused: (paused: boolean) => void;
  dispose: () => void;
}

/** The model and all six synchronized animation tracks are authored in Blender. */
export function createClawScene(
  host: HTMLDivElement,
  initiallyPaused: boolean,
  onReady: () => void,
  onError: () => void,
): ClawScene {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-2.3, 2.3, 2, -2, 0.1, 40);
  camera.position.set(5.5, 4.5, 7.5);
  camera.lookAt(0, 0.12, 0);
  const stage = new THREE.Group();
  scene.add(stage);
  const room = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const reflection = pmrem.fromScene(room, 0.04);
  scene.environment = reflection.texture;
  scene.environmentIntensity = 0.8;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xb8c8e8, 0x161719, 0.35));
  const key = new THREE.DirectionalLight(0xe4edff, 1.8);
  key.position.set(3, 5, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff7a68, 1.0);
  rim.position.set(-4, 2, -2);
  scene.add(rim);
  const edge = new THREE.DirectionalLight(0xdce7ff, 1.7);
  edge.position.set(2, 3, -5);
  scene.add(edge);
  const coreLight = new THREE.PointLight(0xff503f, 1.8, 4, 2);
  coreLight.position.set(0, 0.14, 0);
  scene.add(coreLight);

  let disposed = false;
  let loaded = false;
  let paused = initiallyPaused;
  let visible = true;
  let frame = 0;
  let lastTime = 0;
  let elapsed = 0;
  let mixer: THREE.AnimationMixer | undefined;
  let model: THREE.Group | undefined;
  const pointer = { x: 0, y: 0 };
  const disposeModel = (object: THREE.Object3D) =>
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => material.dispose());
      }
    });
  const draw = () => {
    if (!disposed && loaded) renderer.render(scene, camera);
  };
  function tick(time: number) {
    frame = 0;
    if (disposed || paused || !visible || document.hidden || !loaded) return;
    const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
    lastTime = time;
    elapsed += delta;
    mixer?.update(delta * 1.12);
    stage.rotation.y = THREE.MathUtils.damp(stage.rotation.y, pointer.x * 0.28 + Math.sin(elapsed * 0.32) * 0.12, 3, delta);
    stage.rotation.x = THREE.MathUtils.damp(stage.rotation.x, pointer.y * 0.16, 3, delta);
    stage.position.y = Math.sin(elapsed * 0.85) * 0.07;
    coreLight.intensity = 1.8 + Math.sin(elapsed * 1.1) * 0.35;
    draw();
    frame = requestAnimationFrame(tick);
  }
  function schedule() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    if (!paused && visible && !document.hidden && loaded && !disposed)
      frame = requestAnimationFrame(tick);
    else draw();
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    const aspect = Math.max(width, 1) / Math.max(height, 1);
    camera.left = -2 * aspect;
    camera.right = 2 * aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(Math.max(width, 1), Math.max(height, 1), false);
    draw();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      schedule();
    },
    { threshold: 0.05 },
  );
  intersectionObserver.observe(host);
  const move = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || paused) return;
    const box = host.getBoundingClientRect();
    pointer.x = ((event.clientX - box.left) / box.width - 0.5) * 2;
    pointer.y = ((event.clientY - box.top) / box.height - 0.5) * 2;
  };
  const leave = () => {
    pointer.x = 0;
    pointer.y = 0;
  };
  const contextLost = (event: Event) => {
    event.preventDefault();
    loaded = false;
    schedule();
    onError();
  };
  host.addEventListener('pointermove', move);
  host.addEventListener('pointerleave', leave);
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  document.addEventListener('visibilitychange', schedule);
  resize();
  new GLTFLoader().load(
    `${import.meta.env.BASE_URL}models/claw-core.glb`,
    (gltf) => {
      if (disposed) {
        disposeModel(gltf.scene);
        return;
      }
      model = gltf.scene;
      stage.add(model);
      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => mixer!.clipAction(clip).play());
      mixer.update(0);
      loaded = true;
      host.dataset.renderState = 'ready';
      host.dataset.animationTracks = String(gltf.animations.length);
      draw();
      onReady();
      schedule();
    },
    undefined,
    () => {
      if (!disposed) onError();
    },
  );

  return {
    setPaused(value) {
      paused = value;
      schedule();
    },
    dispose() {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', schedule);
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', leave);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      mixer?.stopAllAction();
      if (model) {
        mixer?.uncacheRoot(model);
        disposeModel(model);
      }
      reflection.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
