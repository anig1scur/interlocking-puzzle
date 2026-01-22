import * as THREE from 'three';
import gsap from 'gsap';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function frameCameraToPuzzle(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  pieceMeshes: THREE.Object3D[],
  requestRender: () => void
) {
  if (pieceMeshes.length === 0 || !camera || !controls) return;

  const box = new THREE.Box3();
  pieceMeshes.forEach((mesh) => {
    const meshBox = new THREE.Box3().setFromObject(mesh);
    box.union(meshBox);
  });

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
  cameraZ *= 2.0;

  // Smooth transition
  gsap.to(camera.position, {
    x: center.x + cameraZ,
    y: center.y + cameraZ,
    z: center.z + cameraZ,
    duration: 1.0,
    ease: 'power2.inOut',
    onUpdate: () => {
      camera.lookAt(center);
      controls.target.copy(center);
      controls.update();
      requestRender();
    },
  });
}

export function snapToView(
  view: string,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  requestRender: () => void
) {
  if (!camera || !controls) return;
  const distance = camera.position.length();
  let targetPos = new THREE.Vector3();

  switch (view) {
    case 'front':
      targetPos.set(0, 0, distance);
      break;
    case 'back':
      targetPos.set(0, 0, -distance);
      break;
    case 'left':
      targetPos.set(-distance, 0, 0);
      break;
    case 'right':
      targetPos.set(distance, 0, 0);
      break;
    case 'top':
      targetPos.set(0, distance, 0);
      break;
    case 'bottom':
      targetPos.set(0, -distance, 0);
      break;
  }

  gsap.to(camera.position, {
    x: targetPos.x,
    y: targetPos.y,
    z: targetPos.z,
    duration: 0.8,
    ease: 'power2.inOut',
    onUpdate: () => {
      camera.lookAt(0, 0, 0);
      controls.update();
      requestRender();
    },
  });
}
