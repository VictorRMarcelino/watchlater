<script setup lang="ts">

const props = withDefaults(defineProps<{
    text?: string;
}>(), {
    text: 'Confirm'
});

</script>

<template>
    <button class="primary-button inline-flex items-center justify-center gap-2 rounded-xl bg-[#e85d4a] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(232,93,74,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#d84d3b] hover:shadow-[0_10px_24px_rgba(232,93,74,0.28)] focus:outline-none focus:ring-4 focus:ring-[#e85d4a]/20 active:translate-y-0">
        <span aria-hidden="true" class="text-lg leading-none">+</span>
        {{ props.text }}
    </button>
</template>

<style scoped>
.primary-button {
    cursor: pointer;
}
</style>