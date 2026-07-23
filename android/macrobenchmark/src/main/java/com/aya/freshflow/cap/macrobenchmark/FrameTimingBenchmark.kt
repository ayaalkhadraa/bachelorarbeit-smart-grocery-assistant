package com.aya.freshflow.cap.macrobenchmark

import androidx.benchmark.macro.FrameTimingMetric
import androidx.benchmark.macro.StartupMode
import androidx.benchmark.macro.junit4.MacrobenchmarkRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@LargeTest
@RunWith(AndroidJUnit4::class)
class FrameTimingBenchmark {

    @get:Rule
    val benchmarkRule = MacrobenchmarkRule()

  @Test
fun navigationFlow() = benchmarkRule.measureRepeated(
    packageName = "com.aya.freshflow.cap",
    metrics = listOf(FrameTimingMetric()),
    iterations = 10,
    startupMode = StartupMode.WARM,

    setupBlock = {
        pressHome()
        startActivityAndWait()
        device.waitForIdle()
        Thread.sleep(1_500)

        // Willkommensseite überspringen.
        val startButton = device.wait(
            Until.findObject(By.descContains("Loslegen")),
            5_000
        )

        if (startButton != null) {
            startButton.click()
            device.waitForIdle()
            Thread.sleep(1_000)
        }

        // Anmeldung als Gast.
        val guestButton = device.wait(
            Until.findObject(By.descContains("Als Gast fortfahren")),
            5_000
        )

        if (guestButton != null) {
            guestButton.click()
            device.waitForIdle()
            Thread.sleep(1_000)
        }

        // Einheitlicher Ausgangspunkt: Dashboard.
        val navigationY = device.displayHeight - 55
        val dashboardX = (device.displayWidth * 0.08).toInt()

        device.click(dashboardX, navigationY)
        device.waitForIdle()
        Thread.sleep(1_000)
    }
) {
    val navigationY = device.displayHeight - 55

    fun navigateTo(horizontalPosition: Double) {
        val navigationX =
            (device.displayWidth * horizontalPosition).toInt()

        device.click(navigationX, navigationY)
        device.waitForIdle()
        Thread.sleep(700)
    }

    repeat(3) {
        // Inventar
        navigateTo(0.23)

        // Einkaufsliste
        navigateTo(0.40)

        // Dashboard
        navigateTo(0.08)
    }
}
@Test
fun inventoryScroll() = benchmarkRule.measureRepeated(
    packageName = "com.aya.freshflow.cap",
    metrics = listOf(FrameTimingMetric()),
    iterations = 10,
    startupMode = StartupMode.WARM,

    setupBlock = {
        pressHome()
        startActivityAndWait()
        device.waitForIdle()
        Thread.sleep(1_500)

        // Willkommensseite überspringen.
        val startButton = device.wait(
            Until.findObject(By.descContains("Loslegen")),
            5_000
        )

        if (startButton != null) {
            startButton.click()
            device.waitForIdle()
            Thread.sleep(1_000)
        }

        // Anmeldung als Gast.
        val guestButton = device.wait(
            Until.findObject(By.descContains("Als Gast fortfahren")),
            5_000
        )

        if (guestButton != null) {
            guestButton.click()
            device.waitForIdle()
            Thread.sleep(1_000)
        }

        // Vor der Messung zur Inventar-Seite wechseln.
        val navigationY = device.displayHeight - 55
        val inventoryX =
            (device.displayWidth * 0.23).toInt()

        device.click(inventoryX, navigationY)
        device.waitForIdle()
        Thread.sleep(1_000)

        /*
         * Die Inventarliste vor jeder Iteration nach oben setzen.
         * Diese Bewegungen werden nicht mitgemessen,
         * da sie sich im setupBlock befinden.
         */
        val centerX = device.displayWidth / 2
        val upperY =
            (device.displayHeight * 0.30).toInt()
        val lowerY =
            (device.displayHeight * 0.78).toInt()

        repeat(5) {
            device.swipe(
                centerX,
                upperY,
                centerX,
                lowerY,
                20
            )
        }

        device.waitForIdle()
        Thread.sleep(800)
    }
) {
    val centerX = device.displayWidth / 2
    val upperY =
        (device.displayHeight * 0.30).toInt()
    val lowerY =
        (device.displayHeight * 0.78).toInt()

    // Dreimal nach unten scrollen.
    repeat(3) {
        device.swipe(
            centerX,
            lowerY,
            centerX,
            upperY,
            30
        )

        device.waitForIdle()
        Thread.sleep(500)
    }

    // Dreimal zurück nach oben scrollen.
    repeat(3) {
        device.swipe(
            centerX,
            upperY,
            centerX,
            lowerY,
            30
        )

        device.waitForIdle()
        Thread.sleep(500)
    }
}
}