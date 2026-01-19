<script lang="ts">
  import { onMount } from 'svelte';
  import { puzzleList, currentPuzzleId, puzzleData, resetGame } from '../stores/gameStore';

  let loading = false;

  async function loadPuzzles() {
    try {
      const res = await fetch('/assets/puzzles.json');
      const data = await res.json();
      puzzleList.set(data);
      
      // Select first puzzle by default if none selected
      if (!$currentPuzzleId && data.length > 0) {
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
      const res = await fetch(`/assets/${id}/puzzle_data.json`);
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
</script>

<div class="glass-panel backdrop-blur-md bg-puzzle-glass border border-white/10 rounded-xl p-5 shadow-lg w-[300px]">
  <h1 class="text-2xl font-bold bg-gradient-to-br from-puzzle-cyan to-puzzle-blue bg-clip-text text-transparent mb-3">
    High-Level Puzzle
  </h1>
  
  <div class="text-sm opacity-80 mb-3 min-h-[1.25em]">
    {#if loading}
      Loading puzzle data...
    {:else if $puzzleData}
      Ready.
    {:else}
      Select a puzzle...
    {/if}
  </div>

  <div class="w-full">
    <select 
      class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:bg-white/15 focus:border-white/30 transition-all hover:bg-white/15"
      value={$currentPuzzleId || ""}
      on:change={handleChange}
    >
      <option value="" disabled>Choosing puzzle...</option>
      {#each $puzzleList as p}
        <option value={p.id} class="bg-gray-900">
          {p.name} {p.level ? `(Level ${p.level})` : ''}
        </option>
      {/each}
    </select>
  </div>
</div>
