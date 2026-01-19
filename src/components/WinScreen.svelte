<script lang="ts">
  import { isVictory } from '../stores/gameStore';
  
  function reload() {
    location.reload();
  }
</script>

{#if $isVictory}
<div class="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
  <div class="bg-puzzle-cyan/10 backdrop-blur-xl border-2 border-puzzle-cyan rounded-3xl p-10 text-center animate-fadeIn pointer-events-auto shadow-[0_0_50px_rgba(0,210,255,0.2)]">
    <h2 class="text-5xl font-bold text-puzzle-cyan mb-4 tracking-wider drop-shadow-lg">SOLVED!</h2>
    <p class="text-xl mb-8 text-white/90">You have successfully disassembled the puzzle.</p>
    <button 
      class="bg-puzzle-blue hover:bg-puzzle-cyan text-white font-bold py-3 px-8 rounded-lg transform transition-all hover:scale-105 hover:shadow-lg active:scale-95"
      on:click={reload}
    >
      Reset Puzzle
    </button>
  </div>
</div>
{/if}

<style>
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
