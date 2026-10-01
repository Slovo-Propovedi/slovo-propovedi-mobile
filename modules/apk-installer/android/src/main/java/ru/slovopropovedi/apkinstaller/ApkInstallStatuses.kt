package ru.slovopropovedi.apkinstaller

import android.content.pm.PackageInstaller

/**
 * Pure status mapping for the install broadcast: no Android calls, only
 * compile-time SDK int constants, so it is unit-testable on the JVM.
 */
internal object ApkInstallStatuses {
  fun statusName(status: Int): String = when (status) {
    PackageInstaller.STATUS_FAILURE -> "STATUS_FAILURE"
    PackageInstaller.STATUS_FAILURE_ABORTED -> "STATUS_FAILURE_ABORTED"
    PackageInstaller.STATUS_FAILURE_BLOCKED -> "STATUS_FAILURE_BLOCKED"
    PackageInstaller.STATUS_FAILURE_CONFLICT -> "STATUS_FAILURE_CONFLICT"
    PackageInstaller.STATUS_FAILURE_INCOMPATIBLE -> "STATUS_FAILURE_INCOMPATIBLE"
    PackageInstaller.STATUS_FAILURE_INVALID -> "STATUS_FAILURE_INVALID"
    else -> "STATUS_FAILURE_STORAGE"
  }

  fun failureMessage(status: Int, extraMessage: String?, legacyStatus: Int): String =
    "Install failed: ${statusName(status)}, message=$extraMessage, legacyStatus=$legacyStatus"
}
