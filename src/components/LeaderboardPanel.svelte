<script lang="ts">
  import { onMount } from 'svelte';
  import { currentPuzzleId, showLeaderboard } from '../stores/gameStore';
  import { fade, fly } from 'svelte/transition';

  let leaderboard: Array<{name: string, time: number, moves?: number}> = [];
  let isLoading = false;

  $: if ($showLeaderboard && $currentPuzzleId) {
    fetchLeaderboard();
  }

  async function fetchLeaderboard() {
    isLoading = true;
    try {
      const res = await fetch(`/api/leaderboard?puzzleId=${$currentPuzzleId}`);
      if (res.ok) {
        leaderboard = await res.json();
      }
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e);
    } finally {
      isLoading = false;
    }
  }

  function formatTime(ms: number) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}.${(ms % 100).toString().padStart(2, '0')}`;
  }
</script>

{#if $showLeaderboard}
<div 
  class="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
  transition:fade={{ duration: 200 }}
>
  <div 
    class="absolute inset-0 bg-black/60 backdrop-blur-md"
    on:click={() => showLeaderboard.set(false)}
  ></div>

  <div 
    class="relative w-full max-w-lg bg-zinc-900/90 border border-white/10 rounded-[30px] p-8 md:p-12 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh]"
    transition:fly={{ y: 20, duration: 400, opacity: 0 }}
  >
    <button 
      class="absolute top-6 right-8 text-white/20 hover:text-white transition-colors text-xs uppercase tracking-widest font-black"
      on:click={() => showLeaderboard.set(false)}
    >
      Close
    </button>

    <div class="mb-8 shrink-0">
      <div class="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-3">Ranking</div>
      <h2 class="text-3xl font-black text-white tracking-tighter uppercase">Leaderboard</h2>
      <div class="h-1 w-12 bg-white/40 mt-4 rounded-full"></div>
    </div>

    <div class="space-y-3 min-h-[200px] overflow-y-auto custom-scrollbar pr-2">
      {#if isLoading}
        <div class="flex items-center justify-center h-40 text-[10px] font-black text-white/20 uppercase tracking-widest animate-pulse">
          Loading records...
        </div>
      {:else}
        {#each leaderboard as entry, i}
          <div 
            class="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group shrink-0"
            style="transition-delay: {i * 50}ms"
          >
            <div class="flex gap-4 items-center">
              <span class="text-white/20 font-black text-xs w-4">{i + 1}</span>
              <span class="text-sm font-bold text-white/80 tracking-tight group-hover:text-white transition-colors">{entry.name}</span>
            </div>
            <div class="flex gap-6 items-center">
              <div class="flex flex-col items-end">
                <span class="text-[8px] font-black text-white/10 uppercase tracking-widest leading-none mb-1">Moves</span>
                <span class="text-xs font-mono text-white/40 group-hover:text-white/60 transition-colors self-center ">{entry.moves ?? '-'}</span>
              </div>
              <div class="flex flex-col items-end min-w-[60px]">
                <span class="text-[8px] font-black text-white/10 uppercase tracking-widest leading-none mb-1">Time</span>
                <span class="text-xs font-mono text-white/40 group-hover:text-white/60 transition-colors ">{formatTime(entry.time)}</span>
              </div>
            </div>
          </div>
        {:else}
          <div class="flex flex-col items-center justify-center h-40 border border-dashed border-white/10 rounded-2xl shrink-0">
            <div class="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">No Records Yet</div>
            <div class="text-[10px] text-white/10 uppercase tracking-[0.2em]">Be the first to solve.</div>
          </div>
        {/each}
      {/if}
    </div>

    <div class="mt-8 pt-8 border-t border-white/5 shrink-0">
      <p class="text-[10px] text-zinc-500 font-medium leading-relaxed">
        Rankings are based on completion time for the current puzzle. 
        Only the top 10 fastest solvers are shown.
      </p>
    </div>
  </div>
</div>
{/if}

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 2px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }
</style>
