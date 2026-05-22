package com.thuclab2

import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class BrightnessModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "BrightnessModule"

    @ReactMethod
    fun setBrightness(value: Double, promise: Promise) {
        try {
            val activity = reactApplicationContext.currentActivity
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "No current activity found")
                return
            }

            val brightnessValue = value.coerceIn(0.0, 1.0).toFloat()

            activity.runOnUiThread {
                val layoutParams = activity.window.attributes
                layoutParams.screenBrightness = brightnessValue
                activity.window.attributes = layoutParams
            }

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("BRIGHTNESS_ERROR", "Failed to set brightness", e)
        }
    }

    @ReactMethod
    fun getBrightness(promise: Promise) {
        try {
            val activity = reactApplicationContext.currentActivity
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "No current activity found")
                return
            }

            val brightness = activity.window.attributes.screenBrightness
            val normalizedBrightness = if (brightness < 0f) 0.5f else brightness
            promise.resolve(normalizedBrightness.toDouble())
        } catch (e: Exception) {
            promise.reject("BRIGHTNESS_ERROR", "Failed to get brightness", e)
        }
    }

    @ReactMethod
    fun getSystemBrightness(promise: Promise) {
        try {
            val brightness = Settings.System.getInt(
                reactApplicationContext.contentResolver,
                Settings.System.SCREEN_BRIGHTNESS
            )
            val normalizedBrightness = brightness / 255.0
            promise.resolve(normalizedBrightness)
        } catch (e: Exception) {
            promise.reject("BRIGHTNESS_ERROR", "Failed to get system brightness", e)
        }
    }
}
