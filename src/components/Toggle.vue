<script setup>
const props = defineProps({
    team: {
        type: String,
        required: true,
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
        <svg
            viewBox="0 0 512 512"
            class="w-8 h-8 mr-2"
            :class="{
                'fill-code-red-700': props.team == 'red',
                'fill-code-blue-700': props.team == 'blue',
            }"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M256 38.55c-30.5 0-55 24.52-55 55c0 30.45 24.5 54.95 55 54.95s55-24.5 55-54.95c0-30.48-24.5-55-55-55M191.3 164.4c-5.7 0-11.1.4-16 1.4c-19.9 4-34.1 15.6-43.1 35.4c-9.4 20.6-12.1 50.6-5.8 88l6 5.9c13.8 13.8 36.1 21.4 58.6 21.4c21.1 0 42.1-6.7 56-19V179.2c-21-9.8-39.8-14.5-55.7-14.8m129.4 0c-15.9.3-34.7 5-55.7 14.8v118.3c13.9 12.3 34.9 19 56 19c22.5 0 44.8-7.6 58.6-21.4l6-5.9c6.3-37.4 3.6-67.4-5.8-88c-9-19.8-23.2-31.4-43.1-35.4c-4.9-1-10.3-1.4-16-1.4m-209.1 14.4h-.2c-30 .7-55.2 12.1-70.2 32.1c-13.3 17.8-19.5 42.9-13.6 76c.9 5.1 2.1 10.5 3.7 16c24.5 18.5 54.3 18.6 78.9.3c-9.2-44.8-6.9-81.9 5.6-109.4q3.6-7.95 8.4-14.7c-2.9-.2-5.8-.3-8.6-.3h-3.9c-.1 0-.1-.1-.1 0m288.8 0c0-.1 0 0-.1 0h-3.9c-2.8 0-5.7.1-8.6.3q4.8 6.75 8.4 14.7c12.5 27.5 14.8 64.6 5.6 109.4c24.5 18.3 54.4 18.2 78.9-.3c1.5-5.5 2.8-10.9 3.7-16c5.9-33.1-.3-58.2-13.6-76c-15-20-40.2-31.4-70.2-32.1zM132.8 318.4c6.9 26.1 17.7 54.9 32.9 86.1h58.6l22.7-56.7v-28c-16.4 10-36.3 14.7-56 14.7c-20.7 0-41.5-5.2-58.2-16.1m246.4 0c-16.7 10.9-37.5 16.1-58.2 16.1c-19.7 0-39.6-4.7-56-14.7v28l22.7 56.7h58.6c15.2-31.2 26-60 32.9-86.1m-264.6 3.4c-23 13.9-50.1 16.1-74.5 6.4c9.6 23 24.1 48.5 44.5 76.3h61c-14-29.6-24.2-57.2-31-82.7m282.8 0c-6.8 25.5-17 53.1-31 82.7h61c20.4-27.8 34.9-53.3 44.5-76.3c-24.3 9.7-51.5 7.5-74.5-6.4M256 373.7l-22.1 55.4l22.1 44.3l22.1-44.3zM91.53 422.5l11.47 46h35.3l-23-23l23-23zm90.27 0l16.6 16.6l6.3 6.4l-23 23h51.7l-19.3-38.6l3-7.4zm113.1 0l1.5 3.7l1.5 3.7l-19.3 38.6h51.7l-23-23l23-23zm78.9 0l16.6 16.6l6.3 6.4l-23 23H409l11.5-46zM160 426.2l-19.3 19.3l19.3 19.3l19.3-19.3zm192 0l-19.3 19.3l19.3 19.3l19.3-19.3z"
            />
        </svg>
        <div
            :class="{
                'text-code-red-700': props.team == 'red',
                'text-code-blue-700': props.team == 'blue',
            }"
            class="pr-2 font-sans xl:text-2xl lg:text-xl md:text-sm"
        >
            <p v-if="props.team == 'red'">Red Team</p>
            <p v-if="props.team == 'blue'">Blue Team</p>
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
            class="relative w-14 h-7 rounded-full peer peer-checked:after:translate-x-full peer-checked:rtl:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border after:rounded-full after:h-6 after:w-6 after:transition-all"
        ></div>
    </label>
</template>
