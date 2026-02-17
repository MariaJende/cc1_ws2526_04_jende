import * as THREE from "three";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// -------------------------------------
// Scene Setup
// -------------------------------------

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  400
);
//camera.position.z = 5;

const canvas = document.querySelector("#canvasThree");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// -------------------------------------
// HDR Background
// -------------------------------------

const hdrLoader = new HDRLoader();
hdrLoader.load("textures/qwantani_dawn_puresky_1k.hdr", (hdr) => {
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = hdr;
  scene.environment = hdr;
});

// -------------------------------------
// Mouse Cursor Particles
// -------------------------------------

let mouse = new THREE.Vector3(0, 0, 1);

const PARTICLE_COUNT = 150;
const positions = new Float32Array(PARTICLE_COUNT * 3);

// initial layout
for (let i = 0; i < PARTICLE_COUNT; i++) {
  positions[i * 3 + 2] = 1;
}

const cursorGeometry = new THREE.BufferGeometry();
cursorGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);

const cursorMaterial = new THREE.PointsMaterial({
  color: 0xffff00,
  size: 5
});

const cursorPoints = new THREE.Points(cursorGeometry, cursorMaterial);
scene.add(cursorPoints);

// -------------------------------------
// Mouse Move → World Space
// -------------------------------------

function handleMouseMove(event) {
  const ndc = new THREE.Vector3(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1,
    0.5
  );

  ndc.unproject(camera);
  const dir = ndc.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z;
  mouse.copy(camera.position.clone().add(dir.multiplyScalar(distance)));
}

window.addEventListener("mousemove", handleMouseMove);

// -------------------------------------
// Path
// -------------------------------------

const points = [];
const segments = 900;

for (let i = 0; i <= segments; i++) {
  const t = i / segments;
  points.push(
    new THREE.Vector3(
      -1000 * t,
      Math.sin(t * Math.PI * 2) * 50,
      Math.cos(t * Math.PI * 2) * 50
    )
  );
}

const curve = new THREE.CatmullRomCurve3(points);

// -------------------------------------
// Rectangular Cross Section
// -------------------------------------

const shape = new THREE.Shape();
shape.moveTo(-2, -0.125);
shape.lineTo(2, -0.125);
shape.lineTo(2, 0.125);
shape.lineTo(-2, 0.125);
shape.closePath();

// -------------------------------------
// Extruded Geometry
// -------------------------------------

const pathGeometry = new THREE.ExtrudeGeometry(shape, {
  steps: 300,
  extrudePath: curve,
  bevelEnabled: false
});

const pathMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transmission: 1,
  ior: 5,
  dispersion: 20,
  roughness: 0.15,
  thickness: 1,
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide
});

scene.add(new THREE.Mesh(pathGeometry, pathMaterial));


const gltfLoader = new GLTFLoader();

gltfLoader.load("/3Dobjects/SakuraFlower.glb", (gltf) => {
  const model = gltf.scene;
  model.scale.set(20, 20, 20);
  model.position.set(0, 0, 0);
  scene.add(model);
});

// -------------------------------------
// Scrolling
// -------------------------------------

let progress = 0;

window.addEventListener("scroll", () => {
  const scrollHeight =
    document.body.scrollHeight - window.innerHeight;
  progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
  progress = THREE.MathUtils.clamp(progress, 0, 1);
});

// -------------------------------------
// Animation Loop
// -------------------------------------

function animate() {
  requestAnimationFrame(animate);

  // camera path animation
  const point = curve.getPointAt(progress);
  const tangent = curve.getTangentAt(progress);
  camera.position.copy(point.clone().add(tangent.clone().multiplyScalar(-5)));
  camera.position.y += 3;
  camera.lookAt(point);

  // cursor trail update
  for (let i = PARTICLE_COUNT - 1; i > 0; i--) {
    positions[i * 3]     = positions[(i - 1) * 3];
    positions[i * 3 + 1] = positions[(i - 1) * 3 + 1];
    positions[i * 3 + 2] = positions[(i - 1) * 3 + 2];
  }

  positions[0] = mouse.x;
  positions[1] = mouse.y;
  positions[2] = mouse.z;

  cursorGeometry.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
}

animate();

// -------------------------------------
// Resize
// -------------------------------------

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
