<script setup>
defineProps({
  id: String
});
</script>

<template>
  <div :id="id" class="command-bar">
    <span>Command Bar Content</span>
    <button id="action-btn">Action</button>
  </div>
</template>

<style scoped>
.command-bar {
  background-color: #007bff;
  color: white;
  padding: 10px;
}
button {
  margin-left: 10px;
}
</style>
