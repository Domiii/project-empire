

export function getDeviceList() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return Promise.reject('Could not get media device list - enumerateDevices() not supported.');
  }
  
  // List cameras and microphones.
  
  return navigator.mediaDevices.enumerateDevices()
  .then(function(devices) {
    return devices;
  })
  .catch(function(err) {
    throw new Error('Could not get media device list - ' + err.stack);
  });
}