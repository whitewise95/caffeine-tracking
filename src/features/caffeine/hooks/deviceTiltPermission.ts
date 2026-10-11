type OrientationPermission = 'granted' | 'denied';
type OrientationConstructor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<OrientationPermission>;
};
export type DeviceTiltPermissionStatus = 'ready' | 'checking' | 'permission' | 'denied' | 'unavailable';

// This is native permission for the current document, not the persisted preference.
let permissionForDocument: OrientationPermission | null = null;
let pendingRequest: Promise<DeviceTiltPermissionStatus> | null = null;
const listeners = new Set<() => void>();

export function subscribeDeviceTiltPermission(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function deviceTiltPermissionStatus(): DeviceTiltPermissionStatus {
  if (typeof window === 'undefined' || !window.isSecureContext || typeof window.DeviceOrientationEvent !== 'function') return 'unavailable';
  if (pendingRequest) return 'checking';
  const event = window.DeviceOrientationEvent as OrientationConstructor;
  if (typeof event.requestPermission !== 'function' || permissionForDocument === 'granted') return 'ready';
  return permissionForDocument === 'denied' ? 'denied' : 'permission';
}

function requestPermission(restoring: boolean): Promise<DeviceTiltPermissionStatus> {
  if (pendingRequest) return pendingRequest;
  const current = deviceTiltPermissionStatus();
  if (current === 'ready' || current === 'unavailable') return Promise.resolve(current);
  const event = window.DeviceOrientationEvent as OrientationConstructor;
  let nativeRequest: Promise<OrientationPermission>;
  try {
    // Keep this synchronous with a settings/tab tap to retain transient activation.
    nativeRequest = event.requestPermission!.call(event);
  } catch (error) {
    nativeRequest = Promise.reject(error);
  }
  pendingRequest = nativeRequest.then(result => {
    permissionForDocument = result;
  }).catch(() => {
    // A new document may require a tap even though the user opted in earlier.
    // Failure to restore does not revoke that saved choice or imply a denial.
    permissionForDocument = restoring ? null : 'denied';
  }).then(() => {
    pendingRequest = null;
    listeners.forEach(listener => listener());
    return deviceTiltPermissionStatus();
  });
  listeners.forEach(listener => listener());
  return pendingRequest;
}

/** Request directly from a settings/tab tap, before awaiting or navigating. */
export function requestDeviceTiltPermission(): Promise<DeviceTiltPermissionStatus> {
  return requestPermission(false);
}

/** Recover saved opt-ins on entry/resume; coalesce only requests still in flight. */
export function restoreDeviceTiltPermission(): Promise<DeviceTiltPermissionStatus> {
  // An explicit denial needs the dedicated settings action, never an automatic prompt.
  if (deviceTiltPermissionStatus() === 'denied') return Promise.resolve('denied');
  return requestPermission(true);
}
