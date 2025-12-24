<script setup>
defineProps({
  id: String,
  label: String
});
</script>

<template>
  <li :id="id" class="nav-item">
    <a href="#">{{ label }}</a>
  </li>
</template>

<style scoped>
.nav-item {
  padding: 5px 0;
}
a {
  color: #fff;
}
</style>
