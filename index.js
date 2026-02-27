// Background HDR: Qwantani Dawn (Pure Sky) by Greeg Zaal and Jarod Guest - https://polyhaven.com/a/qwantani_dawn_puresky

import * as THREE from "three";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";


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
hdrLoader.load("/textures/qwantani_dawn_puresky_1k.hdr", (hdr) => {
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = hdr;
  scene.environment = hdr;
});


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


// -------------------------------------
// Path Material
// -------------------------------------

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
