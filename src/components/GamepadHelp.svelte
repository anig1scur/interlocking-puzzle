<script lang="ts">
  import {fade, scale} from 'svelte/transition';

  let showHelp = false;

  const controls = [
    {label: 'Camera', value: 'Left Stick'},
    {label: 'Move Piece', value: 'Right Stick'},
    {label: 'Select Piece', value: 'L / R Bumpers'},
    {label: 'Ghost Mode', value: 'Hold Triggers'},
    {label: 'Next Level', value: 'B / A (Right Btn)'},
    {label: 'Prev Level', value: 'Y / X (Left Btn)'},
    {label: 'Leaderboard', value: 'Start / +'},
  ];
</script>

<!-- Floating Toggle Button -->
<button
  class="fixed bottom-10 left-6 md:left-10 z-40 text-white/70 hover:text-white cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-xl backdrop-blur-md"
  on:click={() => (showHelp = true)}
  title="Gamepad Controls"
>
  <svg
    x="0px"
    y="0px"
    width="32"
    height="32"
    viewBox="0 0 293.953 293.953"
  >
    <g fill="currentColor">
      <path
        d="M219.602,99.555h-65.125v-19.43c0-18.985-15.445-34.431-34.43-34.431H85.424c-4.143,0-7.5,3.358-7.5,7.5s3.357,7.5,7.5,7.5
		h34.623c10.714,0,19.43,8.717,19.43,19.431v19.43H74.352C33.354,99.555,0,132.909,0,173.906c0,40.998,33.354,74.353,74.352,74.353
		c29.215,0,55.804-17.355,67.75-43.692h9.751c11.945,26.338,38.533,43.692,67.749,43.692c40.998,0,74.352-33.355,74.352-74.353
		C293.953,132.909,260.6,99.555,219.602,99.555z M219.602,233.259c-24.741,0-47.122-15.589-55.691-38.791
		c-1.088-2.946-3.896-4.902-7.035-4.902H137.08c-3.14,0-5.947,1.956-7.035,4.901c-8.571,23.202-30.952,38.791-55.693,38.791
		C41.625,233.259,15,206.633,15,173.906c0-32.727,26.625-59.352,59.352-59.352h145.25c32.727,0,59.352,26.625,59.352,59.352
		C278.953,206.633,252.328,233.259,219.602,233.259z"
      />
      <path
        d="M101.957,166.406H81.852V146.07c0-4.142-3.357-7.5-7.5-7.5s-7.5,3.358-7.5,7.5v20.336H46.746c-4.143,0-7.5,3.358-7.5,7.5
		c0,4.142,3.357,7.5,7.5,7.5h20.105v20.337c0,4.142,3.357,7.5,7.5,7.5s7.5-3.358,7.5-7.5v-20.337h20.105c4.143,0,7.5-3.358,7.5-7.5
		C109.457,169.764,106.1,166.406,101.957,166.406z"
      />
      <circle
        cx="219.602"
        cy="148.203"
        r="10.668"
      />
      <circle
        cx="219.602"
        cy="199.608"
        r="10.668"
      />
      <circle
        cx="245.305"
        cy="173.907"
        r="10.668"
      />
      <circle
        cx="193.898"
        cy="173.907"
        r="10.668"
      />
    </g>
  </svg>
</button>

{#if showHelp}
  <div
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    transition:fade={{duration: 200}}
    on:click={() => (showHelp = false)}
  >
    <div
      class="bg-zinc-900 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full relative overflow-hidden"
      transition:scale={{start: 0.95, duration: 200}}
      on:click|stopPropagation
    >
      <div class="absolute -top-16 rotate-30 -right-12 p-0 opacity-5 pointer-events-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="280"
          height="280"
          viewBox="0 0 24 24"
          fill="currentColor"
          ><path
            d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H9v2H8v-2H6v-1h2v-2h1v2h2v1zM15.5 15.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm2.5-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
          /></svg
        >
      </div>

      <div class="relative z-10">
        <h2 class="text-xl font-black text-white tracking-wider mb-8 flex items-center gap-3">
          This game supports Gamepad Controls!
        </h2>

        <div class="space-y-3">
          {#each controls as ctrl}
            <div class="flex items-center justify-between text-sm group">
              <span
                class="text-white/40 font-medium group-hover:text-white/60 transition-colors uppercase tracking-wide text-xs"
                >{ctrl.label}</span
              >
              <span
                class="text-white font-mono bg-white/5 px-2 py-1 rounded border border-white/5 group-hover:border-white/20 transition-colors"
                >{ctrl.value}</span
              >
            </div>
          {/each}
        </div>

        <div class="mt-8 pt-6 border-t border-white/5 text-center">
          <button
            class="px-6 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all"
            on:click={() => (showHelp = false)}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
