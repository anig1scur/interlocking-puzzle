<script lang="ts">
  import PuzzleScene from './components/PuzzleScene.svelte';
  import PuzzleSelector from './components/PuzzleSelector.svelte';
  import StatsPanel from './components/StatsPanel.svelte';
  import ViewControls from './components/ViewControls.svelte';
  import PieceAnalysis from './components/PieceAnalysis.svelte';
  import WinScreen from './components/WinScreen.svelte';
  import LeaderboardPanel from './components/LeaderboardPanel.svelte';

  let puzzleScene: PuzzleScene;
  let showLeaderboard = false;

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
    
    <div class="pointer-events-auto hidden md:flex items-center gap-3">
      <button 
        class="group flex items-center justify-center p-3 hover:bg-white/5 cursor-pointer rounded-2xl shadow-xl pointer-events-auto"
        on:click={() => showLeaderboard = true}
        title="Leaderboard"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
      </button>
      <StatsPanel />
    </div>
  </div>

  <!-- Top Right UI -->
  <div class="absolute top-4 md:top-10 right-4 md:right-10 pointer-events-none flex flex-col gap-4 md:gap-6 items-end max-w-fit z-10 transition-all duration-1000 ease-out animate-in slide-in-from-right-12 fade-in">
    <div class="pointer-events-auto md:hidden flex items-center gap-3">
      <button 
        class="group flex items-center justify-center p-2.5 rounded-xl bg-white/5 border border-white/10 active:bg-white active:border-white transition-all shadow-lg pointer-events-auto"
        on:click={() => showLeaderboard = true}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white group-active:text-black transition-colors"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
      </button>
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
  <LeaderboardPanel bind:show={showLeaderboard} />
  
  <div class="absolute bottom-8 left-0 right-0 pointer-events-none flex justify-center md:hidden z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500"
       style="margin-bottom: env(safe-area-inset-bottom, 0px);">
    <div class="px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-lg">
      <span class="text-[9px] font-medium text-white/60 tracking-wider">For the best experience, please use a PC.</span>
    </div>
  </div>
</main>
