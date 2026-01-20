<script lang="ts">
  import { onMount } from 'svelte';
  import { isVictory, nextPuzzle, currentPuzzleId, completionTime, moveCount, startTime } from '../stores/gameStore';
  
  let name = localStorage.getItem('player_name') || '';
  let leaderboard: Array<{name: string, time: number}> = [];
  let isSubmitting = false;
  let isSubmitted = false;
  let isEditing = false;
  let error = '';

  let lastVictoryId = '';

  $: if ($isVictory && $currentPuzzleId && lastVictoryId !== $currentPuzzleId) {
    lastVictoryId = $currentPuzzleId;
    isSubmitted = false;
    isEditing = false;
    error = '';
    
    if (!$completionTime && $startTime) {
      completionTime.set(Date.now() - $startTime);
    }
    
    fetchLeaderboard();
  }

  async function fetchLeaderboard() {
    try {
      const res = await fetch(`/api/leaderboard?puzzleId=${$currentPuzzleId}`);
      if (res.ok) {
        leaderboard = await res.json();
      }
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e);
    }
  }

  async function submitScore() {
    if (!name.trim() || isSubmitting) return;
    
    isSubmitting = true;
    error = '';
    
    try {
      localStorage.setItem('player_name', name);
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzleId: $currentPuzzleId,
          name,
          time: $completionTime,
          moves: $moveCount
        })
      });
      
      if (res.ok) {
        isSubmitted = true;
        isEditing = false;
        await fetchLeaderboard();
      } else {
        error = 'Failed to submit score';
      }
    } catch (e) {
      error = 'Network error';
    } finally {
      isSubmitting = false;
    }
  }

  function formatTime(ms: number) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}.${(ms % 1000).toString().padStart(3, '0')}`;
  }
</script>


{#if $isVictory}
<div class="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
  <div class="bg-white/5 backdrop-blur-3xl border border-white/20 rounded-[30px] md:rounded-[40px] p-8 md:p-16 text-center animate-fadeIn pointer-events-auto shadow-[0_40px_100px_rgba(0,0,0,0.8)] max-w-[90vw] md:max-w-lg">
    <div class="mb-4 md:mb-6">
      <div class="text-[10px] md:text-[12px] font-black text-white/20 uppercase tracking-[0.5em] mb-3 md:mb-4">Achievement</div>
      <h2 class="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter">SOLVED</h2>
      <div class="h-1 w-12 bg-white/40 mx-auto mt-4 rounded-full"></div>
    </div>
    
    
    <div class="grid grid-cols-2 gap-4 mb-8 text-xs uppercase tracking-widest font-black">
      <div class="bg-white/5 p-4 rounded-2xl border border-white/10">
        <div class="text-white/30 mb-1">Time</div>
        <div class="text-white text-lg">{$completionTime ? formatTime($completionTime) : '--:--'}</div>
      </div>
      <div class="bg-white/5 p-4 rounded-2xl border border-white/10">
        <div class="text-white/30 mb-1">Moves</div>
        <div class="text-white text-lg">{$moveCount}</div>
      </div>
    </div>

    <!-- Leaderboard Section -->
    <div class="bg-black/20 rounded-2xl p-6 mb-8 border border-white/5 text-left ">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Leaderboard</h3>
        
        <div class="flex gap-2 items-center w-48 justify-end">
          <div class="relative flex items-center group">
            <input 
              bind:value={name}
              placeholder="your nickname"
              disabled={!isEditing && isSubmitted}
              class="bg-white/5 border border-white/10 rounded-lg px-3 py-[1px] text-[12px] text-white focus:outline-none focus:border-white/30 w-32 transition-all disabled:opacity-50 disabled:cursor-default"
              maxlength="20"
              on:dblclick={() => isEditing = true}
            />
            {#if !isEditing && isSubmitted}
              <button 
                class="absolute right-2 text-white/10 hover:text-white transition-colors"
                on:click={() => isEditing = true}
                title="Double click to edit"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              </button>
            {/if}
          </div>

          {#if isEditing || !isSubmitted}
            <button 
              on:click={submitScore}
              disabled={isSubmitting || !name.trim()}
              class="flex items-center justify-center p-1.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black disabled:opacity-20 transition-all"
              title="Submit Score"
            >
              {#if isSubmitting}
                <div class="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
              {/if}
            </button>
          {:else}
            <div class="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Saved</div>
          {/if}
        </div>
      </div>

      <div class="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
        {#each leaderboard as entry, i}
          <div class="flex justify-between items-center text-[11px] font-medium border-b border-white/5 pb-2 last:border-0 last:pb-0">
            <div class="flex gap-3 items-center">
              <span class="text-white/20 font-black w-4">{i + 1}</span>
              <span class="text-white/80 uppercase">{entry.name}</span>
            </div>
            <span class="text-white/40 font-mono tracking-tighter">{formatTime(entry.time)}</span>
          </div>
        {:else}
          <div class="text-[10px] text-white/20 py-4 text-center">Be the first to rank.</div>
        {/each}
      </div>
    </div>
    
    <button 
      class="w-full bg-white text-black font-black py-4 px-12 rounded-full transform transition-all hover:scale-[1.02] hover:bg-zinc-200 active:scale-95 shadow-xl uppercase tracking-widest text-xs"
      on:click={nextPuzzle}
    >
      Next Level
    </button>
  </div>
</div>
{/if}

<style>
  .animate-fadeIn {
    animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(40px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
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
