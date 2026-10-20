<script setup lang="ts">
interface Props {
  team: "red" | "blue";
  captain?: string;
  isCaptainView?: boolean;
  toggleCaptain: () => void;
  disabled?: boolean;
}

const props = defineProps<Props>();

const toggle = (event: Event) => {
  // Keep the displayed role unchanged until the server accepts the command.
  (event.target as HTMLInputElement).checked = !!props.isCaptainView;
  if (!props.disabled) props.toggleCaptain();
};
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
      @change="toggle"
      class="sr-only peer"
    />
    <div
      :class="{
        'bg-code-red-700': props.isCaptainView && props.team == 'red',
        'bg-code-blue-700': props.isCaptainView && props.team == 'blue',
        'after:translate-x-full after:rtl:-translate-x-full after:border-white': props.isCaptainView,
        'bg-zinc-400 after:border-zinc-400': !props.isCaptainView,
      }"
      class="relative w-14 h-7 rounded-full peer after:content-[''] after:absolute after:top-0.5 after:inset-s-1 after:bg-white after:border after:rounded-full after:h-6 after:w-6 after:transition-all"
    ></div>
  </label>
</template>
