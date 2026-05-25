<script>
  export let id;
  export let label;
</script>

<li {id} class="nav-item">
  <button type="button">{label}</button>
</li>

<style>
  .nav-item {
    padding: 5px 0;
  }
  button {
    background: transparent;
    border: 0;
    color: #fff;
    cursor: pointer;
    padding: 0;
  }
</style>
