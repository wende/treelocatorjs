<template>
  <nav class="sidebar">
    <span class="sidebar-title">Sidebar</span>
    <ul>
      <slot></slot>
    </ul>
  </nav>
</template>

<style scoped>
.sidebar {
  background-color: #333;
  color: white;
  padding: 10px;
  margin: 10px 0;
}
ul {
  list-style: none;
  padding: 0;
}
</style>
