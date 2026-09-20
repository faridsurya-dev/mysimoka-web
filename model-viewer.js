import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { STLLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';

const frame = document.getElementById('viewerFrame');
const canvas = document.getElementById('modelCanvas');
const loadingEl = document.getElementById('viewerLoading');

function showError(message) {
  loadingEl.innerHTML = `<span>${message}</span>`;
  loadingEl.classList.add('is-error');
  loadingEl.style.opacity = '1';
}

if (!frame || !canvas) {
  // Section not present on this page.
} else if (!window.WebGLRenderingContext) {
  showError('3D preview needs a WebGL-capable browser.');
} else {
  init();
}

function makeContactShadowTexture() {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(0,0,0,0.55)');
  gradient.addColorStop(0.6, 'rgba(0,0,0,0.22)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

function init() {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 5000);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Lighting: soft ambient + key + cool rim, tuned for a light plastic device
  scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x0a1330, 0.9));

  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(4, 6, 5);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x8fb3ff, 0.6);
  fill.position.set(-5, 2, -3);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0x4e7ff2, 1.1);
  rim.position.set(-2, 4, -6);
  scene.add(rim);

  let controls;
  let modelGroup = new THREE.Group();
  scene.add(modelGroup);

  const loader = new STLLoader();
  loader.load(
    './models/smart_growth.stl',
    (geometry) => onModelLoaded(geometry),
    undefined,
    () => {
      // retry with a path relative to a flat/output layout
      loader.load(
        'models/smart_growth.stl',
        (geometry) => onModelLoaded(geometry),
        undefined,
        () => showError('Could not load the 3D model file.')
      );
    }
  );

  function onModelLoaded(geometry) {
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0xeef2fc,
      metalness: 0.15,
      roughness: 0.5,
    });
    const mesh = new THREE.Mesh(geometry, material);

    // PRD spec: upright pose, default rotate-x -90deg
    mesh.rotation.x = -Math.PI / 2;
    modelGroup.add(mesh);

    // Center the model and fit the camera to it
    const box = new THREE.Box3().setFromObject(modelGroup);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    modelGroup.position.set(-center.x, -box.min.y, -center.z);

    const radius = Math.max(size.x, size.y, size.z) * 0.5 || 1;

    // Contact shadow beneath the model
    const shadowTex = makeContactShadowTexture();
    const shadowGeo = new THREE.PlaneGeometry(radius * 3.6, radius * 3.6);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.002;
    scene.add(shadowMesh);

    const polarAngle = Math.PI / 2.35; // fixed elevation, drag only rotates azimuth
    const camDist = radius * 3.1;
    camera.position.set(
      camDist * Math.sin(polarAngle) * Math.sin(0.6),
      size.y * 0.55 + camDist * Math.cos(polarAngle) * 0.55 + radius * 0.4,
      camDist * Math.sin(polarAngle) * Math.cos(0.6)
    );

    const targetY = size.y * 0.42;
    camera.lookAt(0, targetY, 0);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, targetY, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = radius * 1.6;
    controls.maxDistance = radius * 6;
    controls.minPolarAngle = polarAngle;
    controls.maxPolarAngle = polarAngle;
    controls.autoRotate = false;
    controls.update();

    loadingEl.style.opacity = '0';
    setTimeout(() => loadingEl.style.display = 'none', 300);
  }

  function resize() {
    const w = frame.clientWidth;
    const h = frame.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  new ResizeObserver(resize).observe(frame);
  resize();

  function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    renderer.render(scene, camera);
  }
  animate();
}
