<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  
  const views = ['front', 'back', 'left', 'right', 'top', 'bottom'];
  
  function setView(view: string) {
    dispatch('view', view);
  }
</script>

<div class="glass-panel backdrop-blur-md bg-puzzle-glass border border-white/10 rounded-xl p-3 shadow-lg">
  <div class="grid grid-cols-2 gap-2">
    {#each views as view}
      <button 
        class="px-3 py-1.5 text-xs font-medium uppercase tracking-wider bg-white/10 border border-white/20 rounded hover:bg-puzzle-cyan/30 hover:border-puzzle-cyan transition-colors"
        on:click={() => setView(view)}
      >
        {view}
      </button>
    {/each}
  </div>
</div>
