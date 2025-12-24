<script>
  export let id;
</script>

<div {id} class="command-bar">
  <span>Command Bar Content</span>
  <button id="action-btn">Action</button>
</div>

<style>
  .command-bar {
    background-color: #007bff;
    color: white;
    padding: 10px;
  }
  button {
    margin-left: 10px;
  }
</style>
