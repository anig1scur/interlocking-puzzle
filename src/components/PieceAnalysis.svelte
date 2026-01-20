<script lang="ts">
  import { onMount, afterUpdate, onDestroy, tick } from 'svelte';
  import * as THREE from 'three';
  import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
  import { puzzleData, activePieceId } from '../stores/gameStore';
  import { PIECE_COLORS, createPieceMaterial, setupSceneLighting } from '../lib/visuals';

  let container: HTMLDivElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let animationId: number;
  let currentPieceId: string | null = null;
  let pieceGroup: THREE.Group | null = null;
  

  $: if ($activePieceId !== currentPieceId) {
    handlePieceChange($activePieceId);
  }

  async function handlePieceChange(id: string | null) {
    await tick();
    updatePiece(id);
  }

  onMount(() => {
    initScene();
    return () => {
      cancelAnimationFrame(animationId);
      if (renderer) renderer.dispose();
    };
  });

  function initScene() {
    if (!container) return;
    
    if (!scene) {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000); 
      
      camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
      camera.position.set(2, 2, 2);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(200, 200);
      renderer.setPixelRatio(window.devicePixelRatio);

      setupSceneLighting(scene);
      animate();
    }

    if (container && !container.contains(renderer.domElement)) {
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
    }
  }

  function animate() {
    animationId = requestAnimationFrame(animate);
    if (!renderer || !scene || !camera) return;
    
    if ($activePieceId) {
      if (pieceGroup) {
        pieceGroup.rotation.y += 0.01;
      }
      renderer.render(scene, camera);
    }
  }

  async function updatePiece(id: string | null) {
    if (!id) {
       currentPieceId = null;
       if(pieceGroup && scene) scene.remove(pieceGroup);
       pieceGroup = null;
       return;
    }
    currentPieceId = id;
    
    // Wait for DOM update if panel just appeared
    await tick();
    
    // Safety check just in case init failed or isn't done
    if (container) {
      initScene();
    }

    if (!scene || !$puzzleData) return;

    if (pieceGroup) scene.remove(pieceGroup);

    const assetPath = `${import.meta.env.BASE_URL}assets/${$puzzleData.id}/`;
    const loader = new OBJLoader();
    
    // Find index for color
    const ids = Object.keys($puzzleData.states["0"]);
    const index = ids.indexOf(id);
    const color = PIECE_COLORS[index % PIECE_COLORS.length];

    try {
      const object = await loader.loadAsync(`${assetPath}${id}.obj`);
      
      object.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.material = createPieceMaterial(color);

          // Highlight outline for analysis view
          const edges = new THREE.EdgesGeometry(mesh.geometry);
          const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: false,
            opacity: 0.8
          }));
          mesh.add(line);
        }
      });

      object.position.set(0, 0.2, 0);
      scene.add(object);
      pieceGroup = object;
    } catch (e) {
      console.warn("Failed to load piece for analysis", e);
    }
  }
</script>

{#if $activePieceId}
<div class="glass-panel rounded-2xl p-4 shadow-xl mt-4 w-[220px] hidden md:block select-none">
  <div class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] text-center mb-4">
    Geometry Insights
  </div>
  <div bind:this={container} class="w-[188px] h-[188px] rounded-xl overflow-hidden bg-black/40 border border-white/5 mx-auto shadow-inner">
  </div>
</div>
{/if}
