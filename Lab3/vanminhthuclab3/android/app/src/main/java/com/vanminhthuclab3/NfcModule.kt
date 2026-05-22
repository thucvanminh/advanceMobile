package com.vanminhthuclab3

import android.app.Activity
import android.nfc.NfcAdapter
import android.nfc.NdefRecord
import android.nfc.Tag
import android.nfc.tech.Ndef
import android.os.Bundle
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class NfcModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), NfcAdapter.ReaderCallback {

    private var nfcAdapter: NfcAdapter? = null
    private var isListening = false

    companion object {
        private const val READER_FLAGS = NfcAdapter.FLAG_READER_NFC_A or
                NfcAdapter.FLAG_READER_NFC_B or
                NfcAdapter.FLAG_READER_NFC_F or
                NfcAdapter.FLAG_READER_NFC_V or
                NfcAdapter.FLAG_READER_NFC_BARCODE or
                NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK or
                NfcAdapter.FLAG_READER_NO_PLATFORM_SOUNDS
    }

    override fun getName(): String = "NfcModule"

    @ReactMethod
    fun startNfcListener(promise: Promise) {
        val activity = getCurrentActivity()
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity is null")
            return
        }

        nfcAdapter = NfcAdapter.getDefaultAdapter(activity)
        if (nfcAdapter == null) {
            promise.reject("NO_NFC", "NFC is not supported on this device")
            return
        }

        if (nfcAdapter?.isEnabled == false) {
            promise.reject("NFC_DISABLED", "NFC is disabled")
            return
        }

        try {
            nfcAdapter?.enableReaderMode(activity, this, READER_FLAGS, Bundle())
            isListening = true
            promise.resolve("NFC listener started")
        } catch (e: Exception) {
            promise.reject("START_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopNfcListener(promise: Promise) {
        val activity = getCurrentActivity()
        if (activity != null && isListening) {
            try {
                nfcAdapter?.disableReaderMode(activity)
            } catch (e: Exception) {
                // Ignore
            }
        }
        isListening = false
        promise.resolve("NFC listener stopped")
    }

    override fun onTagDiscovered(tag: Tag?) {
        if (tag == null) return

        val params = Arguments.createMap()

        // Tag ID
        val id = tag.id
        params.putString("tagId", bytesToHex(id))

        // Tech list
        val techList = Arguments.createArray()
        tag.techList.forEach { tech ->
            techList.pushString(tech.substringAfter("android.nfc.tech."))
        }
        params.putArray("techList", techList)

        // NDEF message
        val ndef = Ndef.get(tag)
        var messageText = ""
        if (ndef != null) {
            try {
                ndef.connect()
                val ndefMessage = ndef.ndefMessage
                if (ndefMessage != null) {
                    for (record in ndefMessage.records) {
                        if (record.tnf == NdefRecord.TNF_WELL_KNOWN &&
                            record.type.contentEquals(NdefRecord.RTD_TEXT)
                        ) {
                            messageText = readText(record.payload)
                        }
                    }
                }
                ndef.close()
            } catch (e: Exception) {
                messageText = "Error reading NDEF: ${e.message}"
            }
        }
        params.putString("message", messageText)

        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("NfcDiscovered", params)
    }

    private fun bytesToHex(bytes: ByteArray): String {
        return bytes.joinToString(":") { "%02X".format(it) }
    }

    private fun readText(payload: ByteArray): String {
        if (payload.isEmpty()) return ""
        val textEncoding = if ((payload[0].toInt() and 0x80) == 0) "UTF-8" else "UTF-16"
        val languageCodeLength = payload[0].toInt() and 0x3F
        return String(
            payload,
            languageCodeLength + 1,
            payload.size - languageCodeLength - 1,
            charset(textEncoding)
        )
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
