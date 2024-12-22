<template>
  <button @click="checkForUpdates">检查更新</button>
</template>

<script>
import { ipcRenderer } from 'electron'

export default {
  methods: {
    checkForUpdates() {
      ipcRenderer.send('check-for-update')
    }
  },
  mounted() {
    // 监听协议数据
    ipcRenderer.on('protocol-data', (event, data) => {
      console.log('Received protocol data:', data)
      // 处理协议数据
    })
  }
}
</script> 