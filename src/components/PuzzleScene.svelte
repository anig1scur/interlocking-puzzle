<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
  import gsap from 'gsap';
  import confetti from 'canvas-confetti';
  
  import { 
    currentPuzzleId, 
    puzzleData, 
    currentStateId, 
    activePieceId, 
    moveCount, 
    isVictory 
  } from '../stores/gameStore';
  import { calculateGoalStates, tryMove as tryLogicMove } from '../lib/puzzleLogic';
  import type { PuzzleData } from '../types/puzzle';

  let container: HTMLDivElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  
  let pieceGroups: Record<string, THREE.Group> = {};
  let pieceMeshes: THREE.Object3D[] = [];
  
  let animationFrameId: number;
  let currentVoxelSize = 0.25;
  const PIECE_COLORS = [0xE74C3C, 0x3498DB, 0x2ECC71, 0xF1C40F, 0xE67E22, 0x9B59B6, 0x1ABC9C];
  
  // Dragging interaction
  let raycaster = new THREE.Raycaster();
  let mouse = new THREE.Vector2();
  let dragPlane = new THREE.Plane();
  let dragOffset = new THREE.Vector3();
  let dragStartPos = new THREE.Vector3();
  let isDragging = false;
  let selectedPieceGroup: THREE.Group | null = null;
  let isGhostMode = false;

  // Audio
  let audioCtx: AudioContext;

  $: if ($puzzleData && $puzzleData.id) {
    loadPuzzleAssets($puzzleData);
  }

  $: if ($currentStateId && $puzzleData) {
    updatePiecePositions($puzzleData.states[$currentStateId]);
    checkWinCondition();
  }

  $: updateVisuals($activePieceId, isGhostMode);

  onMount(() => {
    initScene();
    initAudio();
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      renderer.dispose();
    };
  });

  function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(3, 3, 3);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const spotLight = new THREE.SpotLight(0xffffff, 0.5);
    spotLight.position.set(-10, 5, -10);
    scene.add(spotLight);

    animate();
  }

  function initAudio() {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  function playSound(type: 'success' | 'fail' | 'win') {
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'success') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'fail') {
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(110, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'win') {
       [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        o.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
        g.gain.setValueAtTime(0.05, audioCtx.currentTime + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.1 + 0.3);
        o.start(audioCtx.currentTime + i * 0.1);
        o.stop(audioCtx.currentTime + i * 0.1 + 0.3);
      });
    }
  }

  async function loadPuzzleAssets(data: PuzzleData) {
    if (!scene) return;
    
    // Cleanup old meshes
    for (const id in pieceGroups) {
      scene.remove(pieceGroups[id]);
    }
    pieceGroups = {};
    pieceMeshes = [];

    currentVoxelSize = data.voxel_size || 0.25;
    const assetPath = `${import.meta.env.BASE_URL}assets/${data.id}/`;
    const loader = new OBJLoader();
    const pieceIds = Object.keys(data.states["0"]);

    const loadPromises = pieceIds.map((id, index) => {
      return new Promise<void>((resolve) => {
        loader.load(`${assetPath}${id}.obj`, (object) => {
          object.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.material = new THREE.MeshPhongMaterial({
                color: PIECE_COLORS[index % PIECE_COLORS.length],
                specular: 0x111111,
                shininess: 30
              });

              // Edges for outline
              const edges = new THREE.EdgesGeometry(mesh.geometry);
              const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));
              line.raycast = () => {}; 
              mesh.add(line);

              mesh.userData.pieceId = id;
              pieceMeshes.push(mesh);
            }
          });

          object.userData.pieceId = id;
          pieceGroups[id] = object;
          scene.add(object);
          resolve();
        }, undefined, (err) => {
          console.warn(`Failed to load piece ${id}`, err);
          resolve();
        });
      });
    });

    await Promise.all(loadPromises);
    
    // Set initial positions
    updatePiecePositions(data.states["0"]);
    frameCameraToPuzzle();
    updateVisuals($activePieceId, isGhostMode);
    isLoaded = true;
  }

  function updatePiecePositions(state: Record<string, [number, number, number]>) {
    if (!state) return;
    for (const pid in pieceGroups) {
      if (state[pid]) {
        pieceGroups[pid].visible = true;
        const pos = state[pid];
        pieceGroups[pid].position.set(
          pos[0] * currentVoxelSize, 
          pos[1] * currentVoxelSize, 
          pos[2] * currentVoxelSize
        );
      } else {
        pieceGroups[pid].visible = false;
      }
    }
  }

  function updateVisuals(activeId: string | null, ghost: boolean) {
    if (!pieceGroups) return;
    
    for (const id in pieceGroups) {
      const isActive = id === activeId;
      
      pieceGroups[id].traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const mat = mesh.material as THREE.MeshPhongMaterial;

          const targetTransparent = ghost && !isActive;
          
          if (mat.transparent !== targetTransparent) {
             mat.transparent = targetTransparent;
             mat.needsUpdate = true;
          }

          if (targetTransparent) {
             mat.opacity = 0.2;
             mat.depthWrite = false;
             mat.side = THREE.DoubleSide;
          } else {
             mat.opacity = 1.0;
             mat.depthWrite = true;
             mat.side = THREE.FrontSide;
          }

          const outline = mesh.children.find(c => c.type === 'LineSegments') as THREE.LineSegments;
          const lineMat = outline?.material as THREE.LineBasicMaterial;

          if (isActive) {
            // Active highlighting
            mat.emissive.set(0xffffff);
            mat.emissiveIntensity = 0.4;

            if (lineMat) {
              lineMat.opacity = 1.0;
              lineMat.color.set(0x00d2ff);
              lineMat.transparent = false;
            }
          } else {
            // Normal highlighting
            mat.emissive.set(0x000000);
            mat.emissiveIntensity = 0;

            if (lineMat) {
              lineMat.color.set(0xffffff);
              lineMat.transparent = true;
              lineMat.opacity = ghost ? 0.05 : 0.3;
            }
          }
        }
      });
    }
  }

  function frameCameraToPuzzle() {
    if (pieceMeshes.length === 0 || !camera || !controls) return;

    const box = new THREE.Box3();
    pieceMeshes.forEach(mesh => {
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
      ease: "power2.inOut",
      onUpdate: () => {
        camera.lookAt(center);
        controls.target.copy(center);
        controls.update();
      }
    });
  }

  // Interaction Handlers
  function onPointerDown(event: MouseEvent) {
    if (event.button !== 0 || !$activePieceId) return;

    // Calculate mouse position
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(pieceMeshes, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const pieceId = hitMesh.userData.pieceId;

      if (pieceId === $activePieceId) {
        selectedPieceGroup = pieceGroups[pieceId];
        isDragging = true;
        controls.enabled = false;
        
        dragStartPos.copy(selectedPieceGroup.position);

        const normal = new THREE.Vector3();
        camera.getWorldDirection(normal);
        dragPlane.setFromNormalAndCoplanarPoint(normal.negate(), selectedPieceGroup.position);

        const intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(dragPlane, intersectPoint);
        dragOffset.copy(intersectPoint).sub(selectedPieceGroup.position);
      }
    }
  }

  function onPointerMove(event: MouseEvent) {
    if (!isDragging || !selectedPieceGroup) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersectPoint = new THREE.Vector3();

    if (raycaster.ray.intersectPlane(dragPlane, intersectPoint)) {
      const targetPos = intersectPoint.sub(dragOffset);
      const diff = targetPos.clone().sub(dragStartPos);

      // Axis Alignment
      const absDiff = {
        x: Math.abs(diff.x),
        y: Math.abs(diff.y),
        z: Math.abs(diff.z)
      };

      let bestAxis: 'x' | 'y' | 'z' = 'x';
      if (absDiff.y > absDiff.x && absDiff.y > absDiff.z) bestAxis = 'y';
      else if (absDiff.z > absDiff.x && absDiff.z > absDiff.y) bestAxis = 'z';

      const snapDiff = Math.round(diff[bestAxis] / currentVoxelSize);
      
      if (snapDiff !== 0) {
        attemptMove($activePieceId!, bestAxis, snapDiff);
      }
    }
  }

  function onPointerUp() {
    if (isDragging) {
      isDragging = false;
      selectedPieceGroup = null;
      controls.enabled = true;
    }
  }

  function onDoubleClick(event: MouseEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(pieceMeshes, false);

    if (intersects.length > 0) {
      const pieceId = intersects[0].object.userData.pieceId;
      activePieceId.set(pieceId);
    } else {
      activePieceId.set(null);
    }
  }

  function onKeyUp(event: KeyboardEvent) {
    if (event.code === 'Space') {
      isGhostMode = false;
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.code === 'Space') {
       if (!isGhostMode) isGhostMode = true;
       return;
    }

    if (event.key.toLowerCase() === 'r') {
      controls.reset();
      return;
    }
    if (event.key === 'Escape') {
      activePieceId.set(null);
      return;
    }

    if ($activePieceId) {
       handleKeyboardMove(event.key);
    }
  }

  function handleKeyboardMove(key: string) {
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    const forward = new THREE.Vector3();

    camera.matrixWorld.extractBasis(right, up, forward);
    forward.negate();

    let targetScreenVec = new THREE.Vector3();
    switch (key) {
      case 'ArrowUp': targetScreenVec.copy(up); break;
      case 'ArrowDown': targetScreenVec.copy(up).negate(); break;
      case 'ArrowLeft': targetScreenVec.copy(right).negate(); break;
      case 'ArrowRight': targetScreenVec.copy(right); break;
      case 'w': targetScreenVec.copy(forward); break;
      case 's': targetScreenVec.copy(forward).negate(); break;
    }

    if (targetScreenVec.length() === 0) return;

    let bestAxis: 'x'|'y'|'z' = 'x';
    let bestDot = 0;
    let delta = 0;

     const axes = [
      { name: 'x', vec: new THREE.Vector3(1, 0, 0) },
      { name: 'y', vec: new THREE.Vector3(0, 1, 0) },
      { name: 'z', vec: new THREE.Vector3(0, 0, 1) }
    ];

    axes.forEach(a => {
      const dot = targetScreenVec.dot(a.vec);
      if (Math.abs(dot) > Math.abs(bestDot)) {
        bestDot = dot;
        bestAxis = a.name as 'x'|'y'|'z';
        delta = dot > 0 ? 1 : -1;
      }
    });

    if (delta !== 0) {
      attemptMove($activePieceId!, bestAxis, delta, 'keyboard');
    }
  }

  function attemptMove(pieceId: string, axis: 'x'|'y'|'z', delta: number, source = 'drag') {
    if (!$puzzleData) return;
    
    const nextState = tryLogicMove($puzzleData, $currentStateId, pieceId, axis, delta);
    
    if (nextState) {
      currentStateId.set(nextState);
      moveCount.update(n => n + 1);
      playSound('success');
      
      if (source === 'drag' && selectedPieceGroup) {
         dragStartPos.copy(selectedPieceGroup.position);
      }
    } else if (source === 'keyboard') {
      playSound('fail');
    }
  }

  function checkWinCondition() {
    if (!$puzzleData) return;
    const goals = calculateGoalStates($puzzleData);
    if (goals.has($currentStateId) && !$isVictory) {
      isVictory.set(true);
      playSound('win');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }
  
  function onWindowResize() {
    if (camera && renderer) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  export function snapToView(view: string) {
    if(!camera) return;
    const distance = camera.position.length();
    let targetPos = new THREE.Vector3();

    switch (view) {
      case 'front': targetPos.set(0, 0, distance); break;
      case 'back': targetPos.set(0, 0, -distance); break;
      case 'left': targetPos.set(-distance, 0, 0); break;
      case 'right': targetPos.set(distance, 0, 0); break;
      case 'top': targetPos.set(0, distance, 0); break;
      case 'bottom': targetPos.set(0, -distance, 0); break;
    }

    gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 0.8,
      ease: "power2.inOut",
      onUpdate: () => {
        camera.lookAt(0, 0, 0);
        controls.update();
      }
    });
  }

  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    controls.update();
    
    // Pulse effect
    if ($activePieceId && pieceGroups[$activePieceId]) {
      const time = Date.now() * 0.005;
      const pulse = (Math.sin(time) + 1) / 2;
      pieceGroups[$activePieceId].traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh) {
           const mat = (child as THREE.Mesh).material as THREE.MeshPhongMaterial;
           if (mat.emissiveIntensity !== undefined) {
             mat.emissiveIntensity = 0.2 + pulse * 0.4;
           }
        }
      });
    }

    renderer.render(scene, camera);
  }
</script>

<div 
  bind:this={container} 
  class="outline-none w-full h-full"
  on:pointerdown={onPointerDown}
  on:pointermove={onPointerMove}
  on:pointerup={onPointerUp}
  on:dblclick={onDoubleClick}
  role="presentation"
></div>
