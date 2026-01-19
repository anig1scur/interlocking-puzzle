<script lang="ts">
  import { onMount } from 'svelte';
  import { puzzleList, currentPuzzleId, puzzleData, resetGame } from '../stores/gameStore';

  let loading = false;

  async function loadPuzzles() {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}assets/puzzles.json`);
      const data = await res.json();
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

<div class="glass-panel backdrop-blur-md bg-puzzle-glass border border-white/10 rounded-xl p-5 shadow-lg w-[320px] max-h-[80vh] flex flex-col relative">
  <h1 class="text-2xl font-bold bg-gradient-to-br from-puzzle-cyan to-puzzle-blue bg-clip-text text-transparent mb-3">
    Interlocking Puzzle
  </h1>

  <!-- Current Selection Display -->
  <div class="relative w-full">
    <button 
      class="w-full text-left bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl p-3 transition-all group"
      on:click={toggleOpen}
    >
      <div class="text-xs text-puzzle-cyan uppercase tracking-wider mb-2 font-semibold">Current Puzzle</div>
      <div class="flex items-center gap-3">
        <!-- Preview Image -->
        <div class="w-16 h-12 bg-black/50 rounded-lg overflow-hidden shrink-0 border border-white/10 relative">
          {#if $currentPuzzleId}
            <img 
               src="{import.meta.env.BASE_URL}previews/{$currentPuzzleId}.png" 
               alt="Preview" 
               class="w-full h-full object-cover"
               on:error={(e) => e.currentTarget.style.display = 'none'}
            />
          {/if}
        </div>
        
        <div class="overflow-hidden">
          <div class="font-medium text-white truncate group-hover:text-puzzle-cyan transition-colors">
            {$puzzleList.find(p => p.id === $currentPuzzleId)?.name.split('/').pop() || 'Select Puzzle'}
          </div>
           {#if $currentPuzzleId}
             <div class="text-xs text-white/50">
               Level {$puzzleList.find(p => p.id === $currentPuzzleId)?.level || '?'}
             </div>
           {/if}
        </div>
        
        <div class="ml-auto text-white/50">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform {isOpen ? 'rotate-180' : ''} transition-transform" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
    </button>

    <!-- Custom Dropdown -->
    {#if isOpen}
      <div class="absolute top-full left-0 right-0 mt-2 bg-[#1a1c25]/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 max-h-[65vh] overflow-y-auto custom-scrollbar flex flex-col gap-1 p-2">
         {#each $puzzleList as p}
            <button
              class="flex items-center gap-3 w-full min-h-12 p-2 rounded-lg text-left transition-colors whitespace-nowrap overflow-hidden
                     {p.id === $currentPuzzleId ? 'bg-puzzle-cyan/20 border border-puzzle-cyan/30' : 'hover:bg-white/10 border border-transparent'}"
              on:click={() => selectAndClose(p.id)}
            >
               <div class="w-10 h-8 bg-black/50 rounded overflow-hidden shrink-0 border border-white/10">
                  <img 
                     src="{import.meta.env.BASE_URL}previews/{p.id}.png" 
                     alt="" 
                     class="w-full h-full object-cover"
                     loading="lazy"
                     on:error={(e) => e.currentTarget.style.display = 'none'}
                  />
               </div>
               
               <div class="overflow-hidden">
                 <div class="text-sm font-medium text-gray-200 truncate">
                   {p.name.split('/').pop()}
                 </div>
                 {#if p.level}
                   <div class="text-[12px] text-gray-500">
                     Level {p.level}
                   </div>
                 {/if}
               </div>
            </button>
         {/each}
      </div>
    {/if}
  </div>

  <!-- Close dropdown when clicking outside (simple overlay implementation) -->
  {#if isOpen}
    <div class="fixed inset-0 z-40 bg-transparent" on:click={toggleOpen}></div>
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
