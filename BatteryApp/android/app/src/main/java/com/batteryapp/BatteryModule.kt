package com.batteryapp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class BatteryModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var isTracking = false
    private var batteryReceiver: BroadcastReceiver? = null

    override fun getName(): String = "BatteryModule"


    @ReactMethod
    fun getBatteryInfo(promise: Promise) {
        try {
            val batteryInfo = readBatteryData()
            promise.resolve(batteryInfo)
        } catch (e: Exception) {
            promise.reject("BATTERY_ERROR", e.message)
        }
    }


    @ReactMethod
    fun startTracking(promise: Promise) {
        if (isTracking) {
            promise.resolve("Already tracking")
            return
        }

        try {
            batteryReceiver = object : BroadcastReceiver() {
                override fun onReceive(context: Context, intent: Intent) {
                    val data = parseBatteryIntent(intent)
                    emitBatteryEvent(data)
                }
            }

            val filter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
            reactContext.registerReceiver(batteryReceiver, filter)

            // Immediately read current state
            val initialData = readBatteryData()
            emitBatteryEvent(initialData)

            isTracking = true
            promise.resolve("Tracking started")
        } catch (e: Exception) {
            promise.reject("TRACKING_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopTracking(promise: Promise) {
        if (!isTracking) {
            promise.resolve("Not tracking")
            return
        }

        try {
            batteryReceiver?.let { reactContext.unregisterReceiver(it) }
            batteryReceiver = null
            isTracking = false
            promise.resolve("Tracking stopped")
        } catch (e: Exception) {
            promise.reject("TRACKING_ERROR", e.message)
        }
    }


    @ReactMethod
    fun addListener(eventName: String?) {
        // Required for NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Double) {
        // Required for NativeEventEmitter
    }


    private fun readBatteryData(): WritableMap {
        val context = reactContext.applicationContext
        val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager

        // Battery level uses BATTERY_PROPERTY_CAPACITY (API 21+)
        val level: Int = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
                .coerceIn(0, 100)
        } else {
            readLevelFromStickyIntent()
        }

        // Status / health / plugged source only available via sticky intent
        val sticky = reactContext.registerReceiver(
            null,
            IntentFilter(Intent.ACTION_BATTERY_CHANGED),
        )
        val status: Int
        val health: Int
        val plugged: Int
        val temperature: Int
        val voltage: Int
        if (sticky != null) {
            status = sticky.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
            health = sticky.getIntExtra(BatteryManager.EXTRA_HEALTH, -1)
            plugged = sticky.getIntExtra(BatteryManager.EXTRA_PLUGGED, -1)
            temperature = sticky.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, -1)
            voltage = sticky.getIntExtra(BatteryManager.EXTRA_VOLTAGE, -1)
        } else {
            status = -1
            health = -1
            plugged = -1
            temperature = -1
            voltage = -1
        }

        return buildMap(level, status, health, plugged, temperature, voltage)
    }

    private fun readLevelFromStickyIntent(): Int {
        val sticky = reactContext.registerReceiver(
            null,
            IntentFilter(Intent.ACTION_BATTERY_CHANGED),
        )
        if (sticky != null) {
            val level = sticky.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
            val scale = sticky.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
            if (level >= 0 && scale > 0) {
                return (level * 100.0 / scale).toInt().coerceIn(0, 100)
            }
        }
        return -1
    }

    private fun parseBatteryIntent(intent: Intent): WritableMap {
        val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
        val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
        val batteryLevel = if (level >= 0 && scale > 0) {
            (level * 100.0 / scale).toInt().coerceIn(0, 100)
        } else {
            -1
        }
        val status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
        val health = intent.getIntExtra(BatteryManager.EXTRA_HEALTH, -1)
        val plugged = intent.getIntExtra(BatteryManager.EXTRA_PLUGGED, -1)
        val temperature = intent.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, -1)
        val voltage = intent.getIntExtra(BatteryManager.EXTRA_VOLTAGE, -1)
        return buildMap(batteryLevel, status, health, plugged, temperature, voltage)
    }

    private fun emitBatteryEvent(data: WritableMap) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("BatteryUpdate", data)
    }

    private fun buildMap(
        level: Int, status: Int, health: Int, plugged: Int,
        temperature: Int, voltage: Int,
    ): WritableMap {
        val map = Arguments.createMap()
        map.putInt("batteryLevel", level)
        map.putString("batteryStatus", BatteryUtil.statusToString(status))
        map.putInt("batteryStatusCode", status)
        map.putString("batteryHealth", BatteryUtil.healthToString(health))
        map.putInt("batteryHealthCode", health)
        map.putBoolean("isCharging", status == BatteryManager.BATTERY_STATUS_CHARGING ||
                status == BatteryManager.BATTERY_STATUS_FULL)
        map.putString("chargingSource", BatteryUtil.pluggedToSource(plugged))
        map.putInt("chargingSourceCode", plugged)
        // Temperature: EXTRA_TEMPERATURE returns tenths of °C
        map.putDouble("temperature", if (temperature >= 0) temperature / 10.0 else -1.0)
        // Voltage: EXTRA_VOLTAGE returns millivolts
        map.putDouble("voltage", if (voltage >= 0) voltage / 1000.0 else -1.0)
        return map
    }
}
