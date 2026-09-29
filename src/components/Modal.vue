<script setup lang="ts">
import PrimaryButton from './PrimaryButton.vue';
import SecondaryButton from './SecondaryButton.vue';

const props = withDefaults(defineProps<{
    title?: string;
    submitFunction?: Function;
    cancelFunction?: Function;
}>(), {
    title: 'Modal Title'
});

</script>
<template>
    <div class="modal-overlay px-5">
        <div class="modal w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
            <div class="border-b border-slate-100 px-6 py-5 sm:px-8">
                <p class="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#d84d3b]">New item</p>
                <h2 class="font-serif text-2xl font-bold text-slate-950">{{ props.title }}</h2>
            </div>
            <div class="px-6 py-6 sm:px-8">
                <slot></slot>
            </div>
            <div class="flex justify-end border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:px-8 gap-3">
                <PrimaryButton text="Confirm" @click="props.submitFunction"/>
                <SecondaryButton text="Cancel" @click="props.cancelFunction"/>
            </div>

        </div>
    </div>
</template>

<style scoped>

.modal-overlay {
    z-index: 1000;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.48);
    backdrop-filter: blur(5px);
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>