<script lang="ts">
  import { isVictory } from '../stores/gameStore';
  
  function reload() {
    location.reload();
  }
</script>

{#if $isVictory}
<div class="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
  <div class="bg-white/5 backdrop-blur-3xl border border-white/20 rounded-[40px] p-16 text-center animate-fadeIn pointer-events-auto shadow-[0_40px_100px_rgba(0,0,0,0.8)] max-w-lg">
    <div class="mb-6">
      <div class="text-[12px] font-black text-white/20 uppercase tracking-[0.5em] mb-4">Achievement</div>
      <h2 class="text-6xl font-black text-white mb-2 tracking-tighter">SOLVED</h2>
      <div class="h-1 w-12 bg-white/40 mx-auto mt-4 rounded-full"></div>
    </div>
    
    <p class="text-lg mb-10 text-white/50 font-medium">The interlocking sequence is complete.</p>
    
    <button 
      class="bg-white text-black font-black py-4 px-12 rounded-full transform transition-all hover:scale-105 hover:bg-zinc-200 active:scale-95 shadow-xl uppercase tracking-widest text-xs"
      on:click={reload}
    >
      Restart Sequence
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
