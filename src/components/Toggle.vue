<script setup lang="ts">
const props = defineProps({
  team: {
    type: String,
    required: true,
  },
  captain: {
    type: String,
  },
  isCaptainView: {
    type: Boolean,
  },
  toggleCaptain: {
    type: Function,
  },
  disabled: {
    type: Boolean,
  },
});
</script>

<template>
  <label class="inline-flex items-center cursor-pointer" :for="props.team">
    <div
      :class="{
        'text-code-red-700': props.team == 'red',
        'text-code-blue-700': props.team == 'blue',
      }"
      class="pr-2 font-sans xl:text-2xl lg:text-xl md:text-sm"
    >
      <p>{{ captain || team }}</p>
    </div>
    <input
      type="checkbox"
      :id="props.team"
      :checked="props.isCaptainView"
      :disabled="props.disabled"
      @change="props.toggleCaptain()"
      class="sr-only peer"
    />
    <div
      :class="{
        'peer-checked:bg-code-red-700': props.team == 'red',
        'peer-checked:bg-code-blue-700': props.team == 'blue',
        'bg-zinc-200': props.disabled,
        'after:border-zinc-200': props.disabled,
        'bg-zinc-400': !props.disabled,
        'after:border-zinc-400': !props.disabled,
      }"
      class="relative w-14 h-7 rounded-full peer peer-checked:after:translate-x-full peer-checked:rtl:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:inset-s-1 after:bg-white after:border after:rounded-full after:h-6 after:w-6 after:transition-all"
    ></div>
  </label>
</template>
