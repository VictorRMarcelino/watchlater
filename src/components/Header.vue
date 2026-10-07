<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import UserService from '@/services/UserService';
import menuIcon from '@/assets/imgs/dropdown-menu.png';

const router = useRouter();
const authStore = useAuthStore();

const logout = async () => {
    await UserService.logout();
    await router.push('/login');
};
</script>

<template>
    <header class="border-b border-slate-200/80 bg-[#f8f7f3]/90 backdrop-blur w-full">
        <div class="mx-auto flex w-full items-center justify-between px-5 py-5 sm:px-8">
            <RouterLink to="/" class="group flex items-center gap-3 text-slate-950 no-underline">
                <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e85d4a] text-lg font-bold text-white shadow-sm transition-transform group-hover:-rotate-6">W</span>
                <span class="font-serif text-xl font-bold tracking-tight">Watch Later</span>
            </RouterLink>
            <nav v-if="authStore.token" aria-label="Main navigation">
                <div class="flex flex-wrap justify-end gap-1">
                    <RouterLink to="/shows" class="rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-white hover:text-[#d84d3b]">Shows</RouterLink>
                    <template v-if="authStore.isAdmin">
                        <RouterLink to="/" class="rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-white hover:text-[#d84d3b]">Streamings</RouterLink>
                        <RouterLink to="/users" class="rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-white hover:text-[#d84d3b]">Users</RouterLink>
                    </template>
                    <details class="relative">
                        <summary aria-label="Account menu" class="flex h-10 w-10 list-none cursor-pointer items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-white hover:text-[#d84d3b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e85d4a]">
                            <img :src="menuIcon" alt="" class="h-5 w-5 object-contain" />
                        </summary>
                        <div class="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                            <RouterLink to="/profile" class="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 no-underline hover:bg-[#fffaf8] hover:text-[#d84d3b]">Profile</RouterLink>
                            <button type="button" class="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-[#fffaf8] hover:text-[#d84d3b]" @click="logout">Sign out</button>
                        </div>
                    </details>
                </div>
            </nav>
        </div>
    </header>
</template>