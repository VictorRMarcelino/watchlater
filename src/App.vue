<script setup lang="ts">
import { RouterView } from 'vue-router'
import Footer from './components/Footer.vue'
import Header from './components/Header.vue'
</script>

<template>
  <div class="min-h-screen bg-[#f8f7f3]">
    <Header />
    <RouterView />
    <Footer />
  </div>
</template>
