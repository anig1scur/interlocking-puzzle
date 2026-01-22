import * as THREE from 'three';

export const PIECE_COLORS = [
  0xA8D8EA, // Soft Blue
  0xAAEDBE, // Soft Mint
  0xFFFFD1, // Pale Yellow
  0xFFC7C7, // Soft Pink
  0xD6D1F5, // Soft Lavender
  0xFF9AA2  // Pastel Salmon
];

export const DEFAULT_MATERIAL_PROPS = {
  specular: 0x222222,
  shininess: 10
};

export function createPieceMaterial(color: number) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8,
    metalness: 0.1
  });
}

export function setupSceneLighting(scene: THREE.Scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);

  const spotLight = new THREE.SpotLight(0xffffff, 0.5);
  spotLight.position.set(-10, 5, -10);
  scene.add(spotLight);
}

export function disposeSceneObjects(root: THREE.Object3D | THREE.Group | THREE.Object3D[]) {
  const objects = Array.isArray(root) ? root : [root];

  objects.forEach(obj => {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            (mesh.material as THREE.Material[]).forEach((mat: THREE.Material) => mat.dispose());
          } else {
            (mesh.material as THREE.Material).dispose();
          }
        }
      }
      if (child.children) {
        child.children.forEach(c => {
          const mesh = c as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              (mesh.material as THREE.Material[]).forEach((mat: THREE.Material) => mat.dispose());
            } else {
              (mesh.material as THREE.Material).dispose();
            }
          }
        });
      }
    });
  });
}
