package com.vanminhthuclab3

import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class CompassModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), SensorEventListener {

    private var sensorManager: SensorManager? = null
    private var accelerometer: Sensor? = null
    private var magnetometer: Sensor? = null
    private var isListening = false

    private val accelerometerReading = FloatArray(3)
    private val magnetometerReading = FloatArray(3)
    private val rotationMatrix = FloatArray(9)
    private val orientationAngles = FloatArray(3)

    override fun getName(): String = "CompassModule"

    @ReactMethod
    fun startCompass(promise: Promise) {
        sensorManager = reactContext.getSystemService(SensorManager::class.java)
        if (sensorManager == null) {
            promise.reject("NO_SENSOR_MANAGER", "SensorManager not available")
            return
        }

        accelerometer = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        magnetometer = sensorManager?.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)

        if (accelerometer == null || magnetometer == null) {
            promise.reject("MISSING_SENSOR", "Accelerometer or Magnetometer not available")
            return
        }

        sensorManager?.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_UI)
        sensorManager?.registerListener(this, magnetometer, SensorManager.SENSOR_DELAY_UI)
        isListening = true

        promise.resolve("Compass started")
    }

    @ReactMethod
    fun stopCompass(promise: Promise) {
        if (isListening) {
            sensorManager?.unregisterListener(this)
            isListening = false
        }
        promise.resolve("Compass stopped")
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (event == null) return

        when (event.sensor.type) {
            Sensor.TYPE_ACCELEROMETER -> {
                System.arraycopy(event.values, 0, accelerometerReading, 0, accelerometerReading.size)
            }
            Sensor.TYPE_MAGNETIC_FIELD -> {
                System.arraycopy(event.values, 0, magnetometerReading, 0, magnetometerReading.size)
            }
        }

        val success = SensorManager.getRotationMatrix(
            rotationMatrix,
            null,
            accelerometerReading,
            magnetometerReading
        )

        if (success) {
            SensorManager.getOrientation(rotationMatrix, orientationAngles)
            var azimuth = Math.toDegrees(orientationAngles[0].toDouble()).toFloat()
            if (azimuth < 0) {
                azimuth += 360
            }

            val params = Arguments.createMap()
            params.putDouble("heading", azimuth.toDouble())

            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("CompassUpdate", params)
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // No-op
    }

    @ReactMethod
    fun addListener(eventName: String?) {
        // Required for NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Double) {
        // Required for NativeEventEmitter
    }
}
