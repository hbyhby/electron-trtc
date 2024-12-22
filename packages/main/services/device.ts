import { systemPreferences } from 'electron';

export async function checkAndApplyDevicePrivilege() {
  const cameraPrivilege = systemPreferences.getMediaAccessStatus('camera');
  if (cameraPrivilege !== 'granted') {
    await systemPreferences.askForMediaAccess('camera');
  }

  const micPrivilege = systemPreferences.getMediaAccessStatus('microphone');
  if (micPrivilege !== 'granted') {
    await systemPreferences.askForMediaAccess('microphone');
  }

  const screenPrivilege = systemPreferences.getMediaAccessStatus('screen');
  const isHasScreen = screenPrivilege === 'granted';

  return { isHasScreen };
} 