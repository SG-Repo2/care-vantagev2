package com.groebe1kenobi.carevantage.health

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.*
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.health.connect.client.units.Length
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.Instant
import java.time.ZoneOffset

class HealthConnectModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val scope = CoroutineScope(Dispatchers.Default)
    private var healthConnectClient: HealthConnectClient? = null

    override fun getName() = "HealthConnectModule"

    private fun getClient(context: Context): HealthConnectClient? {
        if (healthConnectClient == null && HealthConnectClient.isAvailable(context)) {
            healthConnectClient = HealthConnectClient.getOrCreate(context)
        }
        return healthConnectClient
    }

    @ReactMethod
    fun isAvailable(promise: Promise) {
        try {
            val isAvailable = HealthConnectClient.isAvailable(reactApplicationContext)
            promise.resolve(isAvailable)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun hasPermissions(permissions: ReadableArray, promise: Promise) {
        scope.launch {
            try {
                val client = getClient(reactApplicationContext)
                if (client == null) {
                    promise.reject("ERROR", "Health Connect is not available")
                    return@launch
                }

                val healthPermissions = mutableSetOf<String>()
                for (i in 0 until permissions.size()) {
                    when (permissions.getString(i)) {
                        "android.permission.health.READ_STEPS" -> 
                            healthPermissions.add(HealthPermission.getReadPermission(StepsRecord::class))
                        "android.permission.health.READ_DISTANCE" -> 
                            healthPermissions.add(HealthPermission.getReadPermission(DistanceRecord::class))
                        "android.permission.health.READ_HEART_RATE" -> 
                            healthPermissions.add(HealthPermission.getReadPermission(HeartRateRecord::class))
                        "android.permission.health.READ_ACTIVE_CALORIES_BURNED" -> 
                            healthPermissions.add(HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class))
                    }
                }

                val granted = withContext(Dispatchers.Main) {
                    client.permissionController.getGrantedPermissions().containsAll(healthPermissions)
                }
                promise.resolve(granted)
            } catch (e: Exception) {
                promise.reject("ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun requestPermissions(permissions: ReadableArray, promise: Promise) {
        scope.launch {
            try {
                val client = getClient(reactApplicationContext)
                if (client == null) {
                    promise.reject("ERROR", "Health Connect is not available")
                    return@launch
                }

                val healthPermissions = mutableSetOf<String>()
                for (i in 0 until permissions.size()) {
                    when (permissions.getString(i)) {
                        "android.permission.health.READ_STEPS" -> 
                            healthPermissions.add(HealthPermission.getReadPermission(StepsRecord::class))
                        "android.permission.health.READ_DISTANCE" -> 
                            healthPermissions.add(HealthPermission.getReadPermission(DistanceRecord::class))
                        "android.permission.health.READ_HEART_RATE" -> 
                            healthPermissions.add(HealthPermission.getReadPermission(HeartRateRecord::class))
                        "android.permission.health.READ_ACTIVE_CALORIES_BURNED" -> 
                            healthPermissions.add(HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class))
                    }
                }

                val granted = withContext(Dispatchers.Main) {
                    client.permissionController.getGrantedPermissions().containsAll(healthPermissions)
                }

                if (granted) {
                    promise.resolve(true)
                } else {
                    // Request permissions if not granted
                    val requestPermissionActivityContract = client.permissionController
                        .createRequestPermissionActivityContract()

                    val currentActivity = currentActivity
                    if (currentActivity == null) {
                        promise.reject("ERROR", "Activity is null")
                        return@launch
                    }

                    // Launch permission request activity
                    withContext(Dispatchers.Main) {
                        requestPermissionActivityContract.launch(healthPermissions)
                    }
                    promise.resolve(true)
                }
            } catch (e: Exception) {
                promise.reject("ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun getDailySteps(startTime: String, endTime: String, promise: Promise) {
        scope.launch {
            try {
                val client = getClient(reactApplicationContext)
                if (client == null) {
                    promise.reject("ERROR", "Health Connect is not available")
                    return@launch
                }

                val timeRangeFilter = TimeRangeFilter.between(
                    Instant.parse(startTime),
                    Instant.parse(endTime)
                )

                val response = client.readRecords(
                    ReadRecordsRequest(
                        recordType = StepsRecord::class,
                        timeRangeFilter = timeRangeFilter
                    )
                )

                var totalSteps = 0L
                response.records.forEach { record ->
                    totalSteps += record.count
                }

                promise.resolve(totalSteps)
            } catch (e: Exception) {
                promise.reject("ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun getDailyDistance(startTime: String, endTime: String, promise: Promise) {
        scope.launch {
            try {
                val client = getClient(reactApplicationContext)
                if (client == null) {
                    promise.reject("ERROR", "Health Connect is not available")
                    return@launch
                }

                val timeRangeFilter = TimeRangeFilter.between(
                    Instant.parse(startTime),
                    Instant.parse(endTime)
                )

                val response = client.readRecords(
                    ReadRecordsRequest(
                        recordType = DistanceRecord::class,
                        timeRangeFilter = timeRangeFilter
                    )
                )

                var totalDistance = 0.0
                response.records.forEach { record ->
                    totalDistance += record.distance.inMeters
                }

                promise.resolve(totalDistance)
            } catch (e: Exception) {
                promise.reject("ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun getDailyHeartRate(startTime: String, endTime: String, promise: Promise) {
        scope.launch {
            try {
                val client = getClient(reactApplicationContext)
                if (client == null) {
                    promise.reject("ERROR", "Health Connect is not available")
                    return@launch
                }

                val timeRangeFilter = TimeRangeFilter.between(
                    Instant.parse(startTime),
                    Instant.parse(endTime)
                )

                val response = client.readRecords(
                    ReadRecordsRequest(
                        recordType = HeartRateRecord::class,
                        timeRangeFilter = timeRangeFilter
                    )
                )

                var totalHeartRate = 0.0
                var count = 0
                response.records.forEach { record ->
                    record.samples.forEach { sample ->
                        totalHeartRate += sample.beatsPerMinute
                        count++
                    }
                }

                // Return average heart rate, or 0 if no readings
                val averageHeartRate = if (count > 0) totalHeartRate / count else 0.0
                promise.resolve(averageHeartRate)
            } catch (e: Exception) {
                promise.reject("ERROR", e.message)
            }
        }
    }
}
