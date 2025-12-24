<script setup>
import Panel from './Panel.vue';
import CommandBar from './CommandBar.vue';
import Sidebar from './Sidebar.vue';
import NavItem from './NavItem.vue';
</script>

<template>
  <div id="ancestry-test" class="ancestry-test">
    <h2>Ancestry Chain Test</h2>
    <Panel>
      <CommandBar id="command-bar" />
    </Panel>
    <Sidebar>
      <NavItem id="nav-home" label="Home" />
      <NavItem id="nav-settings" label="Settings" />
    </Sidebar>
  </div>
</template>

<style scoped>
.ancestry-test {
  padding: 20px;
  border: 2px solid #333;
  margin: 10px;
}
</style>
