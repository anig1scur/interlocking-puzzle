<script lang="ts">
  import PuzzleScene from './components/PuzzleScene.svelte';
  import PuzzleSelector from './components/PuzzleSelector.svelte';
  import StatsPanel from './components/StatsPanel.svelte';
  import ViewControls from './components/ViewControls.svelte';
  import PieceAnalysis from './components/PieceAnalysis.svelte';
  import WinScreen from './components/WinScreen.svelte';

  let puzzleScene: PuzzleScene;

  function handleViewChange(event: CustomEvent<string>) {
    if (puzzleScene) {
      puzzleScene.snapToView(event.detail);
    }
  }
</script>

<main class="relative w-full h-full bg-puzzle-bg overflow-hidden text-white font-sans selection:bg-puzzle-cyan/30">
  
  <PuzzleScene bind:this={puzzleScene} />

  <div class="absolute top-5 left-5 right-5 pointer-events-none flex flex-col gap-4 items-start max-w-fit z-10">
    <div class="pointer-events-auto">
      <PuzzleSelector />
    </div>
    
    <div class="pointer-events-auto">
      <StatsPanel />
    </div>

    <div class="pointer-events-auto">
      <ViewControls on:view={handleViewChange} />
    </div>
    
    <div class="pointer-events-auto">
      <PieceAnalysis />
    </div>
  </div>

  <div class="absolute bottom-5 left-5 text-xs text-gray-400 pointer-events-none select-none">
    <b class="text-white">Orbit</b>: Drag BG | <b class="text-white">Select</b>: Double-Click Piece | <b class="text-white">Move</b>: Drag Piece or Arrows/W/S | <b class="text-white">Ghost Mode</b>: Hold Space | <b class="text-white">Reset</b>: R
  </div>

  <WinScreen />
</main>
