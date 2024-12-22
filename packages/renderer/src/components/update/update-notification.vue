<template>
  <div v-if="showNotification" class="update-notification">
    <t-notification
      :title="notificationTitle"
      :content="notificationContent"
      :footer="notificationFooter"
      @close="closeNotification"
    >
      <template #footer>
        <t-space>
          <t-button v-if="showInstallButton" @click="installUpdate">立即安装</t-button>
          <t-button v-if="showCheckButton" @click="checkForUpdate">检查更新</t-button>
          <t-button theme="default" @click="closeNotification">关闭</t-button>
        </t-space>
        <t-progress v-if="showProgress" :percentage="downloadProgress" />
      </template>
    </t-notification>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
const { ipcRenderer } = window.require('electron');

const showNotification = ref(false);
const notificationTitle = ref('');
const notificationContent = ref('');
const notificationFooter = ref('');
const showInstallButton = ref(false);
const showCheckButton = ref(true);
const showProgress = ref(false);
const downloadProgress = ref(0);

// 监听更新事件
onMounted(() => {
  ipcRenderer.on('update-available', (_, info) => {
    showNotification.value = true;
    notificationTitle.value = '发现新版本';
    notificationContent.value = `新版本 ${info.version} 正在下载中...`;
    showCheckButton.value = false;
    showProgress.value = true; // 确保显示进度条
  });

  ipcRenderer.on('update-not-available', () => {
    showNotification.value = true;
    notificationTitle.value = '已是最新版本';
    notificationContent.value = '您当前使用的已经是最新版本。';
    showCheckButton.value = true;
    showInstallButton.value = false;
    showProgress.value = false; // 隐藏进度条
  });

  ipcRenderer.on('update-downloaded', () => {
    showNotification.value = true;
    notificationTitle.value = '更新已就绪';
    notificationContent.value = '新版本已下载完成，立即安装更新？';
    showInstallButton.value = true;
    showCheckButton.value = false;
    showProgress.value = false; // 隐藏进度条
  });

  ipcRenderer.on('update-error', (_, error) => {
    showNotification.value = true;
    notificationTitle.value = '更新出错';
    notificationContent.value = `更新过程中出现错误: ${error}`;
    showCheckButton.value = true;
    showInstallButton.value = false;
    showProgress.value = false; // 隐藏进度条
  });
  
  ipcRenderer.on('download-progress', (_, progress) => {
    showProgress.value = true;
    downloadProgress.value = Math.round(progress.percent);
  });
});

// 检查更新
const checkForUpdate = () => {
  ipcRenderer.send('check-for-update');
  showNotification.value = false;
  showProgress.value = false; // 隐藏进度条
};

// 安装更新
const installUpdate = () => {
  ipcRenderer.send('quit-and-install');
};

// 关闭通知
const closeNotification = () => {
  showNotification.value = false;
  showProgress.value = false; // 隐藏进度条
};
</script>

<style scoped>
.update-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
}
</style>
