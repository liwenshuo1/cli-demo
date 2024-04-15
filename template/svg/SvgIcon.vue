<template>
  <svg aria-hidden="true" class="cp-icon">
    <use :href="`#icon-${name}`" />
  </svg>
</template>

<script setup>
defineProps(['name'])
</script>

<!-- # icon使用
本项目svg放到/assets/icons文件夹下，默认会移除svg的fill属性，便于通过css控制svg颜色，如有svg不想改变颜色，可放到doNotRemoveAttrs文件夹下或svg名称带有doNotRemoveAttrs即可
项目修改了vite-plugin-svg-icons源码，使用patch-package记住修改信息，参考地址
https://github.com/ds300/patch-package
<SvgIcon name="loginout" ></SvgIcon> -->
