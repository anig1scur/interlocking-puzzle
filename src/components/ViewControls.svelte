<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  
  const views = ['front', 'back', 'left', 'right', 'top', 'bottom'];
  
  function setView(view: string) {
    dispatch('view', view);
  }
</script>

<div class="glass-panel rounded-2xl p-4 shadow-xl w-[220px]">
  <div class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 text-center">Camera Perspectives</div>
  <div class="grid grid-cols-2 gap-2">
    {#each views as view}
      <button 
        class="px-2 py-2 text-[10px] font-black uppercase tracking-wider bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/20 hover:text-white transition-all text-white/40 active:scale-95"
        on:click={() => setView(view)}
      >
        {view}
      </button>
    {/each}
  </div>
</div>
