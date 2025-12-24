<script>
  export let id;
  export let label;
</script>

<li {id} class="nav-item">
  <a href="#">{label}</a>
</li>

<style>
  .nav-item {
    padding: 5px 0;
  }
  a {
    color: #fff;
  }
</style>
