package com.aya.freshflow.ionic.macrobenchmark

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
    val rule = MacrobenchmarkRule()

    @Test
    fun navigationFlow() = rule.measureRepeated(
        packageName = "com.aya.freshflow.ionic",
        metrics = listOf(FrameTimingMetric()),
        iterations = 10,
        startupMode = StartupMode.WARM,

        setupBlock = {
            pressHome()
            startActivityAndWait()
            device.waitForIdle()
            Thread.sleep(1_500)

            fun clickIfPresent(label: String) {
                val button = device.wait(
                    Until.findObject(By.textContains(label)),
                    5_000
                )

                if (button != null) {
                    button.click()
                    device.waitForIdle()
                    Thread.sleep(1_500)
                }
            }

            // Vergleichshinweis schließen.
            clickIfPresent("VERSTANDEN")

            // Willkommensseite überspringen.
            clickIfPresent("LOSLEGEN")

            // Anmeldung als Gast.
            clickIfPresent("ALS GAST FORTFAHREN")

            // Einheitlicher Ausgangspunkt: Dashboard.
            // Einheitlicher Ausgangspunkt: Dashboard.
val navigationY = device.displayHeight - 55
val dashboardX =
    (device.displayWidth * 0.11).toInt()

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
    navigateTo(0.32)

    // Liste beziehungsweise Einkaufsliste
    navigateTo(0.51)

    // Dashboard
    navigateTo(0.11)
}
    }
    @Test
fun inventoryScroll() = rule.measureRepeated(
    packageName = "com.aya.freshflow.ionic",
    metrics = listOf(FrameTimingMetric()),
    iterations = 10,
    startupMode = StartupMode.WARM,

    setupBlock = {
        pressHome()
        startActivityAndWait()
        device.waitForIdle()
        Thread.sleep(1_500)

        fun clickIfPresent(label: String) {
            val button = device.wait(
                Until.findObject(By.textContains(label)),
                5_000
            )

            if (button != null) {
                button.click()
                device.waitForIdle()
                Thread.sleep(1_500)
            }
        }

        // Mögliche Dialoge und Startseiten schließen.
        clickIfPresent("VERSTANDEN")
        clickIfPresent("LOSLEGEN")
        clickIfPresent("ALS GAST FORTFAHREN")

        // Vor der Messung zur Inventar-Seite wechseln.
        val navigationY = device.displayHeight - 55
        val inventoryX =
            (device.displayWidth * 0.32).toInt()

        device.click(inventoryX, navigationY)
        device.waitForIdle()
        Thread.sleep(1_000)

        /*
         * Die Liste vor jeder Iteration nach oben setzen.
         * Diese Bewegungen liegen im setupBlock und werden
         * daher nicht als Teil des Scrolltests gemessen.
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

    // Dreimal nach unten durch die Inventarliste scrollen.
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