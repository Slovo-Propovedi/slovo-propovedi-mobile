package ru.slovopropovedi.apkinstaller

import android.content.pm.PackageInstaller
import org.junit.Assert.assertEquals
import org.junit.Test

class ApkInstallStatusesTest {
  @Test
  fun `maps every failure constant to its exact status name`() {
    val expectedNames = mapOf(
      PackageInstaller.STATUS_FAILURE to "STATUS_FAILURE",
      PackageInstaller.STATUS_FAILURE_ABORTED to "STATUS_FAILURE_ABORTED",
      PackageInstaller.STATUS_FAILURE_BLOCKED to "STATUS_FAILURE_BLOCKED",
      PackageInstaller.STATUS_FAILURE_CONFLICT to "STATUS_FAILURE_CONFLICT",
      PackageInstaller.STATUS_FAILURE_INCOMPATIBLE to "STATUS_FAILURE_INCOMPATIBLE",
      PackageInstaller.STATUS_FAILURE_INVALID to "STATUS_FAILURE_INVALID",
      PackageInstaller.STATUS_FAILURE_STORAGE to "STATUS_FAILURE_STORAGE",
    )

    expectedNames.forEach { (status, name) ->
      assertEquals(name, ApkInstallStatuses.statusName(status))
    }
  }

  @Test
  fun `falls back to the storage name for unknown failure codes`() {
    assertEquals("STATUS_FAILURE_STORAGE", ApkInstallStatuses.statusName(Int.MAX_VALUE))
  }

  @Test
  fun `failureMessage keeps the exact shape parsed by the JS classifier`() {
    val message = ApkInstallStatuses.failureMessage(
      PackageInstaller.STATUS_FAILURE_CONFLICT,
      "INSTALL_FAILED_UPDATE_INCOMPATIBLE",
      5,
    )

    assertEquals(
      "Install failed: STATUS_FAILURE_CONFLICT, message=INSTALL_FAILED_UPDATE_INCOMPATIBLE, legacyStatus=5",
      message,
    )
  }

  @Test
  fun `failureMessage renders a missing extra message as the literal null token`() {
    val message = ApkInstallStatuses.failureMessage(PackageInstaller.STATUS_FAILURE, null, -1)

    assertEquals("Install failed: STATUS_FAILURE, message=null, legacyStatus=-1", message)
  }
}
