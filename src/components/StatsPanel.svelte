<script lang="ts">
  import { moveCount, currentStateId } from '../stores/gameStore';
</script>

<div class="glass-panel backdrop-blur-md bg-puzzle-glass border border-white/10 rounded-xl p-4 shadow-lg min-w-[200px]">
  <div class="flex items-center justify-between gap-4 text-sm">
    <div>
      <span class="opacity-60">Moves:</span>
      <span class="font-bold ml-1">{$moveCount}</span>
    </div>
    <div class="h-4 w-px bg-white/20"></div>
    <div>
      <span class="opacity-60">State:</span>
      <span class="font-mono ml-1">{$currentStateId}</span>
    </div>
  </div>
</div>
