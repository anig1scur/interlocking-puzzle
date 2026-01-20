<script lang="ts">
  import { moveCount, currentStateId } from '../stores/gameStore';
</script>

<div class="glass-panel rounded-2xl p-3 md:p-4 shadow-xl md:min-w-[220px] select-none">
  <div class="flex items-center justify-between gap-2 md:gap-6 px-1">
    <div class="flex flex-col">
      <span class="hidden md:block text-[10px] font-black text-white/20 uppercase tracking-widest">Performance</span>
      <div class="flex items-baseline gap-1.5 flex-col md:flex-row">
        <span class="text-[10px] md:text-xs text-white/40 font-medium">Moves</span>
        <span class="text-lg md:text-xl font-black text-white leading-none">{$moveCount}</span>
      </div>
    </div>
    
    <div class="h-8 w-px bg-white/5"></div>
    
    <div class="flex flex-col items-end">
      <span class="text-[8px] md:text-[10px] font-black text-white/20 uppercase tracking-widest">State</span>
      <span class="text-[10px] md:text-xs font-mono text-white/60 bg-white/5 px-2 py-0.5 rounded mt-1 border border-white/5">
        #{$currentStateId}
      </span>
    </div>
  </div>
</div>
