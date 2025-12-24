<script>
  import Panel from './Panel.svelte';
  import CommandBar from './CommandBar.svelte';
  import Sidebar from './Sidebar.svelte';
  import NavItem from './NavItem.svelte';
</script>

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

<style>
  .ancestry-test {
    padding: 20px;
    border: 2px solid #333;
    margin: 10px;
  }
</style>
