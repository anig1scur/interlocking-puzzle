<script lang="ts">
  import {onMount, onDestroy} from 'svelte';
  import * as THREE from 'three';
  import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
  import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
  import gsap from 'gsap';
  import confetti from 'canvas-confetti';

  import {currentPuzzleId, puzzleData, currentStateId, activePieceId, moveCount, isVictory} from '../stores/gameStore';
  import {tryMove as tryLogicMove} from '../lib/puzzleLogic';
  import {PIECE_COLORS, createPieceMaterial, setupSceneLighting, disposeSceneObjects} from '../lib/visuals';
  import type {PuzzleData} from '../types/puzzle';

  let container: HTMLDivElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  let needsRender = false;

  let pieceGroups: Record<string, THREE.Group> = {};
  let pieceMeshes: THREE.Object3D[] = [];

  let animationFrameId: number;
  let currentVoxelSize = 0.25;
  let isLoaded = false;

  // Dragging interaction
  let raycaster = new THREE.Raycaster();
  let mouse = new THREE.Vector2();
  let dragPlane = new THREE.Plane();
  let dragOffset = new THREE.Vector3();
  let dragStartPos = new THREE.Vector3();
  let isDragging = false;
  let selectedPieceGroup: THREE.Group | null = null;
  let isGhostMode = false;
  let collisionCount = 0;
  let hitCounted = false;
  let isColliding = false;
  let winOngoing = false;
  let lastMoveTime = 0;
  const MOVE_COOLDOWN = 200; // ms between moves during drag
  let keysPressed = new Set<string>();

  // Audio
  let audioCtx: AudioContext;

  $: if ($currentPuzzleId) {
    isLoaded = false;
    winOngoing = false;
  }

  $: if ($puzzleData && $puzzleData.id) {
    loadPuzzleAssets($puzzleData);
  }

  $: if ($currentStateId && $puzzleData && isLoaded) {
    updatePiecePositions($puzzleData.states[$currentStateId]);
  }

  $: {
    $activePieceId;
    collisionCount = 0;
    if (isLoaded) playSound('select');
  }

  $: updateVisuals($activePieceId, isGhostMode, isDragging ? ($activePieceId ?? undefined) : undefined, collisionCount);
  $: if (isLoaded) requestRender();

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
      if (controls) controls.removeEventListener('change', requestRender);
      renderer.dispose();

      // Dispose materials and geometries
      disposeSceneObjects(pieceMeshes);
    };
  });

  function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(3, 3, 3);

    renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.addEventListener('change', requestRender);

    // Lights
    setupSceneLighting(scene);

    // initGizmos();
    requestRender();
    animate();
  }

  function requestRender() {
    needsRender = true;
  }

  function initAudio() {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  function playSound(type: 'success' | 'fail' | 'win' | 'thud' | 'slide' | 'pop' | 'select') {
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const currTime = audioCtx.currentTime;

    if (type === 'success' || type === 'pop') {
      // Pop / Snap sound
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, currTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, currTime + 0.1);
      gainNode.gain.setValueAtTime(0.001, currTime);
      gainNode.gain.linearRampToValueAtTime(0.5, currTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currTime + 0.1);
      oscillator.start();
      oscillator.stop(currTime + 0.1);
    } else if (type === 'fail' || type === 'thud') {
      // Dull thud
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(120, currTime);
      oscillator.frequency.exponentialRampToValueAtTime(60, currTime + 0.15);
      gainNode.gain.setValueAtTime(0.001, currTime);
      gainNode.gain.linearRampToValueAtTime(0.8, currTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currTime + 0.15);
      oscillator.start();
      oscillator.stop(currTime + 0.15);
    } else if (type === 'win') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        const startTime = currTime + i * 0.1;
        o.frequency.setValueAtTime(freq, startTime);
        g.gain.setValueAtTime(0.001, startTime);
        g.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        o.start(startTime);
        o.stop(startTime + 0.3);
      });
    } else if (type === 'slide') {
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(150, currTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, currTime + 0.04);
      gainNode.gain.setValueAtTime(0.001, currTime);
      gainNode.gain.linearRampToValueAtTime(0.1, currTime + 0.005);
      gainNode.gain.linearRampToValueAtTime(0, currTime + 0.04);
      oscillator.start();
      oscillator.stop(currTime + 0.04);
    } else if (type === 'select') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(660, currTime);
      oscillator.frequency.exponentialRampToValueAtTime(440, currTime + 0.05);
      gainNode.gain.setValueAtTime(0.001, currTime);
      gainNode.gain.linearRampToValueAtTime(0.1, currTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currTime + 0.05);
      oscillator.start();
      oscillator.stop(currTime + 0.05);
    }
  }

  async function loadPuzzleAssets(data: PuzzleData) {
    if (!scene) return;

    // Cleanup old meshes
    for (const id in pieceGroups) {
      const group = pieceGroups[id];
      disposeSceneObjects(group);
      scene.remove(group);
    }
    pieceGroups = {};
    pieceMeshes = [];
    winOngoing = false;

    currentVoxelSize = data.voxel_size || 0.25;
    const assetPath = `${import.meta.env.BASE_URL}assets/${data.id}/`;
    const loader = new OBJLoader();
    const pieceIds = Object.keys(data.states['0']);

    const loadPromises = pieceIds.map((id, index) => {
      return new Promise<void>((resolve) => {
        loader.load(
          `${assetPath}${id}.obj`,
          (object) => {
            object.traverse((child: THREE.Object3D) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.material = createPieceMaterial(PIECE_COLORS[index % PIECE_COLORS.length]);

                // Edges for outline
                const edges = new THREE.EdgesGeometry(mesh.geometry);
                const line = new THREE.LineSegments(
                  edges,
                  new THREE.LineBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.3}),
                );
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
          },
          undefined,
          (err) => {
            console.warn(`Failed to load piece ${id}`, err);
            resolve();
          },
        );
      });
    });

    await Promise.all(loadPromises);

    updatePiecePositions(data.states['0'], true);
    frameCameraToPuzzle();
    updateVisuals($activePieceId, isGhostMode);
    isLoaded = true;
  }

  function updatePiecePositions(state: Record<string, [number, number, number]>, silent = false) {
    if (!state) return;
    for (const pid in pieceGroups) {
      const group = pieceGroups[pid];
      if (state[pid]) {
        if (!group.visible) {
          group.visible = true;
          // Pop in
          if (silent) {
            group.scale.set(1, 1, 1);
          } else {
            gsap.fromTo(
              group.scale,
              {x: 0, y: 0, z: 0},
              {
                x: 1,
                y: 1,
                z: 1,
                duration: 0.5,
                ease: 'back.out(1.7)',
                onUpdate: requestRender,
              },
            );
          }
        }

        // Only update if NOT currently being dragged by user
        if (!isDragging || pid !== $activePieceId) {
          const pos = state[pid];
          const currentPos = group.position;

          const dist = currentPos.distanceTo(
            new THREE.Vector3(pos[0] * currentVoxelSize, pos[1] * currentVoxelSize, pos[2] * currentVoxelSize),
          );

          if (dist > 0.01) {
            if (silent) {
              group.position.set(pos[0] * currentVoxelSize, pos[1] * currentVoxelSize, pos[2] * currentVoxelSize);
              group.scale.set(1, 1, 1);
            } else {
              gsap.to(group.position, {
                x: pos[0] * currentVoxelSize,
                y: pos[1] * currentVoxelSize,
                z: pos[2] * currentVoxelSize,
                duration: 0.25,
                overwrite: 'auto',
                onUpdate: requestRender,
              });

              // Move pop
              gsap.fromTo(
                group.scale,
                {x: 1.05, y: 1.05, z: 1.05},
                {x: 1, y: 1, z: 1, duration: 0.3, ease: 'power2.out', onUpdate: requestRender},
              );
              playSound('slide');
            }
          }
        }
      } else if (group.visible) {
        if (!silent) playSound('pop');

        // Fly away logic: move towards camera/away from center
        const awayDir = group.position.clone().normalize().multiplyScalar(1.0);

        gsap.to(group.position, {
          x: group.position.x + awayDir.x,
          y: group.position.y + awayDir.y,
          z: group.position.z + awayDir.z,
          duration: 0.6,
          ease: 'circ.out',
          onUpdate: requestRender,
        });

        const fadeObj = {opacity: 1};
        gsap.to(fadeObj, {
          opacity: 0,
          duration: 0.6,
          ease: 'power2.in',
          onUpdate: () => {
            group.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mat = (child as THREE.Mesh).material as THREE.MeshPhongMaterial;
                mat.transparent = true;
                mat.opacity = fadeObj.opacity;
              }
            });
            requestRender();
          },
          onComplete: () => {
            group.visible = false;
            group.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mat = (child as THREE.Mesh).material as THREE.MeshPhongMaterial;
                mat.opacity = 1.0;
                mat.transparent = false;
              }
            });
            requestRender();
          },
        });
      }
    }
  }

  let axisGizmos: THREE.Group;

  function initGizmos() {
    axisGizmos = new THREE.Group();
    const length = 1.0;
    const headLength = 0.2;
    const headWidth = 0.1;

    // X - Red
    const arrowX = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      length,
      0xff3333,
      headLength,
      headWidth,
    );
    // Y - Green
    const arrowY = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      length,
      0x33ff33,
      headLength,
      headWidth,
    );
    // Z - Blue
    const arrowZ = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, 0),
      length,
      0x3333ff,
      headLength,
      headWidth,
    );

    axisGizmos.add(arrowX, arrowY, arrowZ);
    axisGizmos.visible = false;
    scene.add(axisGizmos);
  }

  function updateVisuals(activeId: string | null, ghost: boolean, draggingPieceId?: string, count: number = 0, linkedPieceIds: string[] = []) {
    if (!pieceGroups) return;

    // Conditional transparency: if spacebar is down OR we've hit enough collisions
    const effectiveGhost = ghost || count >= 5;

    for (const id in pieceGroups) {
      const isActive = id === activeId;
      const isLinked = linkedPieceIds.includes(id);

      pieceGroups[id].traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const mat = mesh.material as THREE.MeshPhongMaterial;

          const isBeingDragged = id === draggingPieceId || isLinked;
          // Apply extra transparency only if NOT in ghost mode (spacebar)
          const targetTransparent = effectiveGhost ? !isActive : isBeingDragged;

          if (mat.transparent !== targetTransparent) {
            mat.transparent = targetTransparent;
            mat.needsUpdate = true;
          }

          if (targetTransparent) {
            mat.opacity = isBeingDragged && !effectiveGhost ? 0.8 : 0.25;
            mat.depthWrite = !effectiveGhost;
            mat.side = effectiveGhost ? THREE.DoubleSide : THREE.FrontSide;
          } else {
            mat.opacity = 1.0;
            mat.depthWrite = true;
            mat.side = THREE.FrontSide;
          }

          const outline = mesh.children.find((c) => c.type === 'LineSegments') as THREE.LineSegments;
          const lineMat = outline?.material as THREE.LineBasicMaterial;

          if (isActive) {
            // Active highlighting
            mat.emissive.set(0xf2f2f2);
            mat.emissiveIntensity = 0.2;

            // Prevent Z-fighting during collision/overlap
            mat.polygonOffset = true;
            mat.polygonOffsetFactor = -1;
            mat.polygonOffsetUnits = -4;

            if (lineMat) {
              lineMat.opacity = 1.0;
              lineMat.color.set(isLinked ? 0xffcc00 : 0x00d2ff);
              lineMat.transparent = false;
            }
          } else if (isLinked) {
            mat.emissive.set(0x443300);
            mat.emissiveIntensity = 0.3;
            if (lineMat) {
              lineMat.opacity = 1.0;
              lineMat.color.set(0xffcc00); 
              lineMat.transparent = false;
            }
          } else {
            // Normal highlighting
            mat.emissive.set(0x000000);
            mat.emissiveIntensity = 0;
            mat.polygonOffset = false;

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

  // Interaction Handlers
  function onPointerDown(event: MouseEvent) {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (event.button !== 0 || !$activePieceId) return;

    // Calculate mouse position
    getNormalizedMousePos(event, renderer.domElement, mouse);

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

        if (intersectPoint) {
        } // dummy use if needed, but we used raycaster

        // Only reset hit detection flags, NOT collisionCount (it persists until success or piece change)
        hitCounted = false;
        isColliding = false;
        // Initial visual update
        updateVisuals(pieceId, isGhostMode, undefined, collisionCount);
      }
    }
  }

  function onPointerMove(event: MouseEvent) {
    if (!isDragging || !selectedPieceGroup || !$activePieceId) return;

    getNormalizedMousePos(event, renderer.domElement, mouse);

    raycaster.setFromCamera(mouse, camera);
    const intersectPoint = new THREE.Vector3();

    if (raycaster.ray.intersectPlane(dragPlane, intersectPoint)) {
      const targetPos = intersectPoint.sub(dragOffset);
      const diff = targetPos.clone().sub(dragStartPos);

      const components = [
        {axis: 'x' as const, val: diff.x, abs: Math.abs(diff.x)},
        {axis: 'y' as const, val: diff.y, abs: Math.abs(diff.y)},
        {axis: 'z' as const, val: diff.z, abs: Math.abs(diff.z)},
      ].sort((a, b) => b.abs - a.abs);

      let bestAxis: 'x' | 'y' | 'z' = components[0].axis;
      let isWin = false;
      let canMove = false;
      let foundValid = false;

      const snapThreshold = 0.3 * currentVoxelSize;

      for (const comp of components) {
        if (comp.abs < snapThreshold) continue;

        const others = components.filter((c) => c.axis !== comp.axis);
        const otherMag = Math.sqrt(others[0].val ** 2 + others[1].val ** 2);
        if (comp.abs <= otherMag) continue;

        const dir = Math.sign(comp.val);
        const winMatch = !!$puzzleData?.win_transitions?.some(
          (t) =>
            t.state_id === $currentStateId &&
            t.piece_id === $activePieceId &&
            t.axis === comp.axis &&
            Math.sign(dir) === Math.sign(t.direction),
        );

        const logicMatch = !!tryLogicMove($puzzleData!, $currentStateId, $activePieceId, comp.axis, dir);

        if (winMatch || logicMatch) {
          bestAxis = comp.axis;
          isWin = winMatch;
          canMove = true;
          foundValid = true;

          // Identify linked pieces for UI guidance
          let linkedIds: string[] = [];
          if (logicMatch) {
            const nextStateId = tryLogicMove($puzzleData!, $currentStateId, $activePieceId, comp.axis, dir);
            if (nextStateId) {
              const nextState = $puzzleData!.states[nextStateId];
              const currState = $puzzleData!.states[$currentStateId];
              linkedIds = Object.keys(nextState).filter(pid => {
                if (pid === $activePieceId) return false;
                return nextState[pid][0] !== currState[pid][0] ||
                       nextState[pid][1] !== currState[pid][1] ||
                       nextState[pid][2] !== currState[pid][2];
              });
            }
          }
          updateVisuals($activePieceId, isGhostMode, $activePieceId, collisionCount, linkedIds);

          break;
        }
      }

      if (!foundValid) {
        bestAxis = components[0].axis;
        canMove = false;
        isWin = false;
      }

      const rawDelta = diff[bestAxis];
      const snapSteps = Math.round(rawDelta / currentVoxelSize);

      if (!canMove) {
        const visualDelta = Math.tanh(rawDelta * 3) * 0.1 * currentVoxelSize;
        const newPos = dragStartPos.clone();
        newPos[bestAxis] += visualDelta;

        // Add light vibration if trying to push hard
        const impactStrength = Math.abs(rawDelta) / currentVoxelSize;
        if (impactStrength > 0.3) {
          const t = Date.now() * 0.05;
          newPos.x += Math.sin(t) * 0.005;
          newPos.y += Math.cos(t * 1.1) * 0.005;
          newPos.z += Math.sin(t * 0.9) * 0.005;

          if (!hitCounted && impactStrength > 0.4) {
            collisionCount++;
            hitCounted = true;
            updateVisuals($activePieceId, isGhostMode, $activePieceId ?? undefined, collisionCount);
          }

          if (Math.random() > 0.85) playSound('thud');
          isColliding = true;
        } else {
          hitCounted = false;
          isColliding = false;
        }
        selectedPieceGroup.position.copy(newPos);
      } else {
        isColliding = false;
        if (Math.abs(snapSteps) >= 1) {
          attemptMove($activePieceId, bestAxis, Math.sign(snapSteps));
        }

        const currentDiff = targetPos.clone().sub(dragStartPos);
        const currentRawDelta = currentDiff[bestAxis];
        const visualSnapLimit = 0.7 * currentVoxelSize;
        const clampedDelta = Math.max(-visualSnapLimit, Math.min(visualSnapLimit, currentRawDelta));

        const newPos = dragStartPos.clone();
        newPos[bestAxis] += clampedDelta;

        // Axis-specific visual offset for other axes (slight lag/follow)
        if (bestAxis !== 'x') newPos.x += currentDiff.x * 0.2;
        if (bestAxis !== 'y') newPos.y += currentDiff.y * 0.2;
        if (bestAxis !== 'z') newPos.z += currentDiff.z * 0.2;

        selectedPieceGroup.position.copy(newPos);
        requestRender();
      }
    }
  }

  function onPointerUp() {
    if (isDragging) {
      isDragging = false;
      controls.enabled = true;

      // Revert to exact grid position if we were in a "wiggle" or partial drag
      if (selectedPieceGroup && $activePieceId && $puzzleData) {
        const state = $puzzleData.states[$currentStateId];
        const pos = state[$activePieceId];
        gsap.to(selectedPieceGroup.position, {
          x: pos[0] * currentVoxelSize,
          y: pos[1] * currentVoxelSize,
          z: pos[2] * currentVoxelSize,
          duration: 0.2,
          ease: 'power2.out',
          onUpdate: requestRender,
        });
      }

      selectedPieceGroup = null;
      hitCounted = false;
      isColliding = false;
      updateVisuals($activePieceId, isGhostMode, undefined, collisionCount);
    }
  }

  function onDoubleClick(event: MouseEvent) {
    getNormalizedMousePos(event, renderer.domElement, mouse);

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
    keysPressed.delete(event.key.toLowerCase());
    if (event.code === 'Space') {
      isGhostMode = false;
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    keysPressed.add(key);

    if (event.code === 'Space') {
      if (!isGhostMode) isGhostMode = true;
      return;
    }

    if (event.repeat) return; 

    if (key === 'r') {
      controls.reset();
      return;
    }
    if (event.key === 'Escape') {
      activePieceId.set(null);
      return;
    }

    // Tab to cycle pieces
    if (event.key === 'Tab') {
      event.preventDefault();
      const pieceIds = Object.keys(pieceGroups);
      if (pieceIds.length > 0) {
        if (!$activePieceId) {
          activePieceId.set('piece1' in pieceGroups ? 'piece1' : pieceIds[0]);
        } else {
          const currentIndex = pieceIds.indexOf($activePieceId);
          let nextIndex;
          if (event.shiftKey) {
            nextIndex = (currentIndex - 1 + pieceIds.length) % pieceIds.length;
          } else {
            nextIndex = (currentIndex + 1) % pieceIds.length;
          }
          activePieceId.set(pieceIds[nextIndex]);
        }
      }
      return;
    }

    // Camera control is handled in animate()
    if (['w', 'a', 's', 'd'].includes(key)) {
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
    const lowerKey = key.toLowerCase();

    switch (key) {
      case 'ArrowUp':
      case 'i':
        targetScreenVec.copy(up);
        break;
      case 'ArrowDown':
      case 'k':
        targetScreenVec.copy(up).negate();
        break;
      case 'ArrowLeft':
      case 'j':
        targetScreenVec.copy(right).negate();
        break;
      case 'ArrowRight':
      case 'l':
        targetScreenVec.copy(right);
        break;
      case 'u':
        targetScreenVec.copy(forward);
        break;
      case 'o':
        targetScreenVec.copy(forward).negate();
        break;
    }

    if (targetScreenVec.length() === 0) return;

    let bestAxis: 'x' | 'y' | 'z' = 'x';
    let bestDot = 0;
    let delta = 0;

    const axes = [
      {name: 'x', vec: new THREE.Vector3(1, 0, 0)},
      {name: 'y', vec: new THREE.Vector3(0, 1, 0)},
      {name: 'z', vec: new THREE.Vector3(0, 0, 1)},
    ];

    axes.forEach((a) => {
      const dot = targetScreenVec.dot(a.vec);
      if (Math.abs(dot) > Math.abs(bestDot)) {
        bestDot = dot;
        bestAxis = a.name as 'x' | 'y' | 'z';
        delta = dot > 0 ? 1 : -1;
      }
    });

    if (delta !== 0) {
      attemptMove($activePieceId!, bestAxis, delta, 'keyboard');
    }
  }

  function attemptMove(pieceId: string, axis: 'x' | 'y' | 'z', delta: number, source = 'drag') {
    if (!$puzzleData) return;

    const now = Date.now();
    if (now - lastMoveTime < MOVE_COOLDOWN) return;

    const nextState = tryLogicMove($puzzleData, $currentStateId, pieceId, axis, delta);

    if (nextState) {
      currentStateId.set(nextState);
      moveCount.update((n) => n + 1);
      playSound('success');

      // Reset collision state on success (restore from ghost mode)
      collisionCount = 0;
      hitCounted = false;

      if (source === 'drag' && selectedPieceGroup) {
        dragStartPos.copy(selectedPieceGroup.position);
        lastMoveTime = Date.now();
      }

      // Sync visual feedback for "moving" state
      const nextStateData = $puzzleData.states[nextState];
      const currState = $puzzleData.states[$currentStateId];
      let linkedIds: string[] = [];
      if (nextStateData && currState) {
        linkedIds = Object.keys(nextStateData).filter(pid => {
          if (pid === pieceId) return false;
          return nextStateData[pid][0] !== currState[pid][0] ||
                 nextStateData[pid][1] !== currState[pid][1] ||
                 nextStateData[pid][2] !== currState[pid][2];
        });
      }
      
      updateVisuals(pieceId, isGhostMode, pieceId, collisionCount, linkedIds);

      // For keyboard moves, restore opaque state after animation duration
      if (source === 'keyboard') {
        setTimeout(() => {
          if (!isDragging) {
            updateVisuals(pieceId, isGhostMode, undefined, collisionCount);
          }
        }, 250);
      }
    } else {
      const winMove = $puzzleData.win_transitions?.some(
        (t) =>
          t.state_id === $currentStateId &&
          t.piece_id === pieceId &&
          t.axis === axis &&
          Math.sign(delta) === Math.sign(t.direction),
      );

      if (winMove && !$isVictory) {
        triggerWin($currentStateId, axis, delta);
      } else if (source === 'keyboard') {
        playSound('fail');

        isColliding = true;
        collisionCount++;
        updateVisuals(pieceId, isGhostMode, undefined, collisionCount);

        const group = pieceGroups[pieceId];
        if (group) {
          const shakeDir = new THREE.Vector3();
          shakeDir[axis] = delta * 0.05 * currentVoxelSize;

          gsap.to(group.position, {
            x: group.position.x + shakeDir.x,
            y: group.position.y + shakeDir.y,
            z: group.position.z + shakeDir.z,
            duration: 0.05,
            yoyo: true,
            repeat: 1,
            onComplete: () => {
              isColliding = false;
              updateVisuals(pieceId, isGhostMode, undefined, collisionCount);
            },
          });
        }
      }
    }
  }

  function triggerWin(stateId: string, axis: 'x' | 'y' | 'z', delta: number) {
    if (winOngoing) return;
    winOngoing = true;

    isDragging = false;
    selectedPieceGroup = null;
    controls.enabled = true;

    setTimeout(() => {
      isVictory.set(true);
      playSound('win');
      confetti({
        particleCount: 60,
        spread: 90,
        origin: {y: 0.6},
      });
    }, 1000);

    const winningMoves = ($puzzleData?.win_transitions || []).filter(
      (t) => t.state_id === stateId && t.axis === axis && Math.sign(delta) === Math.sign(t.direction),
    );

    winningMoves.forEach((move) => {
      const group = pieceGroups[move.piece_id];
      if (group) {
        const flyDir = new THREE.Vector3();
        flyDir[axis] = delta * 15 * currentVoxelSize;

        gsap.to(group.position, {
          x: group.position.x + flyDir.x,
          y: group.position.y + flyDir.y,
          z: group.position.z + flyDir.z,
          duration: 1.2,
          ease: 'expo.out',
          onUpdate: requestRender,
        });

        const fadeObj = {opacity: 1};
        gsap.to(fadeObj, {
          opacity: 0,
          duration: 1.2,
          ease: 'expo.out',
          onUpdate: () => {
            group.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mat = (child as THREE.Mesh).material as THREE.MeshPhongMaterial;
                mat.transparent = true;
                mat.opacity = fadeObj.opacity;
              }
            });
            requestRender();
          },
          onComplete: () => {
            group.visible = false;
            // Reset for potential reuse in the same session without reload
            group.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mat = (child as THREE.Mesh).material as THREE.MeshPhongMaterial;
                mat.opacity = 1.0;
                mat.transparent = false;
              }
            });
            requestRender();
          },
        });
      }
    });
  }

  function onWindowResize() {
    if (camera && renderer) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }
  
  function getNormalizedMousePos(event: MouseEvent, element: HTMLElement, target: THREE.Vector2) {
    const rect = element.getBoundingClientRect();
    target.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    target.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  export function snapToView(view: string) {
    if (!camera) return;
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

  function animate() {
    animationFrameId = requestAnimationFrame(animate);

    // Auto-update controls if damping is enabled
    if (controls) {
      // WASD Smooth Camera Control
      if (keysPressed.has('w') || keysPressed.has('a') || keysPressed.has('s') || keysPressed.has('d')) {
        const rotateAngle = Math.PI / 120;
        const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
        const spherical = new THREE.Spherical().setFromVector3(offset);

        if (keysPressed.has('a')) spherical.theta += rotateAngle;
        if (keysPressed.has('d')) spherical.theta -= rotateAngle;
        if (keysPressed.has('w')) spherical.phi += rotateAngle;
        if (keysPressed.has('s')) spherical.phi -= rotateAngle;

        spherical.makeSafe();
        offset.setFromSpherical(spherical);
        camera.position.addVectors(controls.target, offset);

        controls.update();
        requestRender();
      } else if (controls.enableDamping) {
        if (controls.update()) {
          requestRender();
        }
      }
    }

    // Pulse effect & Gizmos
    if ($activePieceId && pieceGroups[$activePieceId]) {
      const activeGroup = pieceGroups[$activePieceId];
      const time = Date.now() * 0.005;
      const pulse = Math.sin(time) + 1;

      // Update Gizmos
      if (axisGizmos) {
        axisGizmos.position.copy(activeGroup.position);
        axisGizmos.visible = true;
        axisGizmos.scale.setScalar(0.8 + pulse * 0.2);
      }

      activeGroup.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshPhongMaterial;
          if (mat.emissiveIntensity !== undefined) {
            const targetIntensity = (isColliding ? 0.3 : 0) + pulse * 0.1;
            if (Math.abs(mat.emissiveIntensity - targetIntensity) > 0.01) {
              mat.emissive.set(0xf2f2f2);
              mat.emissiveIntensity = targetIntensity;
              requestRender();
            }
          }
        }
      });
    } else {
      if (axisGizmos && axisGizmos.visible) {
        axisGizmos.visible = false;
        requestRender();
      }
    }

    if (needsRender) {
      renderer.render(scene, camera);
      needsRender = false;
    }
  }
</script>

<div
  bind:this={container}
  class="outline-none w-full h-full relative"
  on:pointerdown={onPointerDown}
  on:pointermove={onPointerMove}
  on:pointerup={onPointerUp}
  on:dblclick={onDoubleClick}
  role="presentation"
></div>
