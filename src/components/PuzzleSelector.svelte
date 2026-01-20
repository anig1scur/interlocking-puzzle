<script lang="ts">
  import { onMount } from 'svelte';
  import { puzzleList, currentPuzzleId, puzzleData, resetGame } from '../stores/gameStore';

  let loading = false;

  async function loadPuzzles() {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}assets/puzzles.json`);
      const data = await res.json();
      // Sort by level ascending
      data.sort((a: any, b: any) => (a.level || 0) - (b.level || 0));
      puzzleList.set(data);
      
      // Check for deep link or existing selection
      const urlParams = new URLSearchParams(window.location.search);
      const puzzleIdFromUrl = urlParams.get('puzzle');
      
      if (puzzleIdFromUrl) {
          // Verify ID exists in the list
          const exists = data.find((p: any) => p.id === puzzleIdFromUrl);
          if (exists) {
              selectPuzzle(puzzleIdFromUrl);
          } else {
              // Fallback if invalid ID
               if (!$currentPuzzleId && data.length > 0) {
                 selectPuzzle(data[0].id);
               }
          }
      } else if (!$currentPuzzleId && data.length > 0) {
        selectPuzzle(data[0].id);
      } else {
         // Default fallback usually 'cow' if exists
         const defaultP = data.find((p:any) => p.id === 'cow') || data[0];
         if(defaultP) selectPuzzle(defaultP.id);
      }
    } catch (e) {
      console.error("Failed to load puzzle list", e);
    }
  }

  async function selectPuzzle(id: string) {
    if (id === $currentPuzzleId) return;
    
    loading = true;
    currentPuzzleId.set(id);
    resetGame();
    
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}assets/${id}/puzzle_data.json`);
      const data = await res.json();
      data.id = id; // ensure ID is attached
      puzzleData.set(data);
    } catch (e) {
      console.error(`Failed to load puzzle ${id}`, e);
    } finally {
      loading = false;
    }
  }

  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectPuzzle(target.value);
  }

  onMount(() => {
    loadPuzzles();
  });

  let isOpen = false;

  function toggleOpen() {
    isOpen = !isOpen;
  }

  function selectAndClose(id: string) {
    selectPuzzle(id);
    isOpen = false;
  }
</script>

<div class="glass-panel rounded-2xl p-6 shadow-2xl w-[340px] max-h-[85vh] flex flex-col relative">
  <div class="mb-5 flex items-center justify-between">
    <h1 class="text-xl font-bold tracking-tight text-white/90">
      Interlocking
      <span class="block text-3xl font-black text-white">PUZZLES</span>
    </h1>
    <img 
      src="{import.meta.env.BASE_URL}logo.png" 
      alt="Interactive Puzzle Logo" 
      class="w-16 h-16 object-contain grayscale opacity-60 hover:opacity-100 transition-opacity"
    />
  </div>

  <!-- Current Selection Display -->
  <div class="relative w-full">
    <button 
      class="w-full text-left bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-4 transition-all group overflow-hidden relative"
      on:click={toggleOpen}
    >
      <div class="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mb-3">Collection</div>
      <div class="flex items-center gap-4">
        <!-- Preview Image -->
        <div class="w-20 h-16 bg-black rounded-xl overflow-hidden shrink-0 border border-white/5 shadow-inner flex items-center justify-center">
          {#if $currentPuzzleId}
            <img 
               src="{import.meta.env.BASE_URL}previews/{$currentPuzzleId}.png" 
               alt="Preview" 
               class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity grayscale"
               on:error={(e) => e.currentTarget.style.display = 'none'}
            />
          {:else}
            <div class="text-white/10 text-xs">NO PREVIEW</div>
          {/if}
        </div>
        
        <div class="overflow-hidden flex-1">
          <div class="font-bold text-white truncate group-hover:text-white transition-colors text-lg">
            {$puzzleList.find(p => p.id === $currentPuzzleId)?.name.split('/').pop() || 'Select...'}
          </div>
           {#if $currentPuzzleId}
             <div class="flex items-center gap-2 mt-0.5">
               <span class="px-1.5 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-black border border-white/20">
                 LV. {$puzzleList.find(p => p.id === $currentPuzzleId)?.level || '?'}
               </span>
             </div>
           {/if}
        </div>
        
        <div class="text-white/20 group-hover:text-white/60 transition-colors">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform {isOpen ? 'rotate-180' : ''} transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
    </button>

    <!-- Custom Dropdown -->
    {#if isOpen}
      <div class="absolute top-[calc(100%+12px)] left-0 right-0 bg-black/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-50 max-h-[60vh] overflow-y-auto custom-scrollbar flex flex-col p-2 gap-1 animate-in fade-in zoom-in-95 duration-200">
         {#each $puzzleList as p}
            <button
              class="flex items-center gap-4 w-full p-2.5 rounded-xl text-left transition-all
                     {p.id === $currentPuzzleId 
                       ? 'bg-white/10 border border-white/20' 
                       : 'hover:bg-white/5 border border-transparent'}"
              on:click={() => selectAndClose(p.id)}
            >
               <div class="w-12 h-9 bg-black rounded-lg overflow-hidden shrink-0 border border-white/5 grayscale group-hover:grayscale-0 transition-all">
                  <img 
                     src="{import.meta.env.BASE_URL}previews/{p.id}.png" 
                     alt="" 
                     class="w-full h-full object-cover opacity-60"
                     loading="lazy"
                     on:error={(e) => e.currentTarget.style.display = 'none'}
                  />
               </div>
               
               <div class="overflow-hidden flex-1">
                 <div class="text-sm font-bold {p.id === $currentPuzzleId ? 'text-white' : 'text-white/70'} truncate">
                   {p.name.split('/').pop()}
                 </div>
                 {#if p.level}
                   <div class="text-[9px] font-black text-white/50 uppercase tracking-widest mt-0.5">
                     Level {p.level}
                   </div>
                 {/if}
               </div>

               {#if p.id === $currentPuzzleId}
                 <div class="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
               {/if}
            </button>
         {/each}
      </div>
    {/if}
  </div>

  <!-- Close dropdown when clicking outside -->
  {#if isOpen}
    <div class="fixed inset-0 z-40 bg-black/40 backdrop-blur-[4px]" on:click={toggleOpen}></div>
  {/if}
</div>

<style>
  /* Custom Scrollbar for the list */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.4);
  }
</style>
