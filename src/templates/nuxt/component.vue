<template>
  <div class="<%= componentName.toLowerCase().replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() %>">
    <%- html %>
  </div>
</template>

<script setup lang="ts">
interface Props {
  className?: string;
}

withDefaults(defineProps<Props>(), {
  className: '',
});
</script>

<style scoped>
<%- css %>
</style>
