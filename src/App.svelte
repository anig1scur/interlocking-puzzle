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

<main class="relative w-full h-full overflow-hidden text-white selection:bg-white/20 selection:text-white select-none">
  
  <PuzzleScene bind:this={puzzleScene} />

  <!-- Top Left UI -->
  <div class="absolute top-4 md:top-10 left-4 md:left-10 pointer-events-none flex flex-col gap-4 md:gap-6 items-start max-w-fit z-10 transition-all duration-1000 ease-out animate-in slide-in-from-left-12 fade-in">
    <div class="pointer-events-auto z-50 relative">
      <PuzzleSelector />
    </div>
    
    <div class="pointer-events-auto hidden md:block">
      <StatsPanel />
    </div>
  </div>

  <!-- Top Right UI -->
  <div class="absolute top-4 md:top-10 right-4 md:right-10 pointer-events-none flex flex-col gap-4 md:gap-6 items-end max-w-fit z-10 transition-all duration-1000 ease-out animate-in slide-in-from-right-12 fade-in">
    <div class="pointer-events-auto md:hidden">
      <StatsPanel />
    </div>
    
    <div class="pointer-events-auto hidden md:block">
      <ViewControls on:view={handleViewChange} />
    </div>
    
    <div class="pointer-events-auto hidden md:block">
      <PieceAnalysis />
    </div>
  </div>

  <!-- Bottom Instructions - Hidden on Mobile -->
  <div class="absolute bottom-10 left-0 right-0 pointer-events-none hidden md:flex justify-center z-10 select-none animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-300">
    <div class="flex items-center gap-10 bg-black/40 backdrop-blur-3xl px-10 py-3 rounded-full border border-white/5 shadow-2xl">
      <div class="flex flex-col items-center">
        <span class="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Navigation</span>
        <span class="text-[10px] font-bold text-white/50 tracking-tight">Drag to Orbit</span>
      </div>
      
      <div class="w-px h-6 bg-white/5"></div>

      <div class="flex flex-col items-center">
        <span class="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Interaction</span>
        <span class="text-[10px] font-bold text-white/50 tracking-tight">Double Click to Select</span>
      </div>

      <div class="w-px h-6 bg-white/5"></div>

      <div class="flex flex-col items-center">
        <span class="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Manipulation</span>
        <span class="text-[10px] font-bold text-white/50 tracking-tight">Drag Piece or Arrow | WS Keys</span> 
      </div>

      <div class="w-px h-6 bg-white/5"></div>

      <div class="flex flex-col items-center">
        <span class="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Commands</span>
        <span class="text-[10px] font-bold text-white/50 tracking-tight">Space: Ghost | R: Reset</span>
      </div>
    </div>
  </div>

  <WinScreen />
  
  <div class="absolute bottom-8 left-0 right-0 pointer-events-none flex justify-center md:hidden z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500"
       style="margin-bottom: env(safe-area-inset-bottom, 0px);">
    <div class="px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-lg">
      <span class="text-[9px] font-medium text-white/60 tracking-wider">For the best experience, please use a PC.</span>
    </div>
  </div>
</main>
