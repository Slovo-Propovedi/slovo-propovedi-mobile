jest.mock('apk-installer', () => ({
  canRequestPackageInstalls: jest.fn(async () => true),
  installApk: jest.fn(async () => ({ status: 'success' })),
  isApkInstallerAvailable: jest.fn(() => true),
  openInstallPermissionSettings: jest.fn(async () => {}),
}))