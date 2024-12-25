package com.groebe1kenobi.carevantage

import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.changes.UpsertionChange
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Instant
import kotlin.math.roundToInt

@ReactModule(name = "HealthConnectModule")
class HealthConnectModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val scope = CoroutineScope(Dispatchers.Default)
    
    override fun getName() = "HealthConnectModule"

    @ReactMethod
    fun isAvailable(promise: Promise) {
        scope.launch {
            try {
                val availability = HealthConnectClient.getSdkStatus(reactApplicationContext) == HealthConnectClient.SDK_AVAILABLE
                promise.resolve(availability)
            } catch (e: Exception) {
                promise.reject("ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun requestPermissions(permissions: ReadableArray, promise: Promise) {
        scope.launch {
            try {
                val client = HealthConnectClient.getOrCreate(reactApplicationContext)
                val permissionSet = mutableSetOf<HealthPermission>()
                
                for (i in 0 until permissions.size()) {
                    val permission = permissions.getString(i)
                    when (permission) {
                        "steps" -> permissionSet.add(HealthPermission.createReadPermission(StepsRecord::class))
                        "distance" -> permissionSet.add(HealthPermission.createReadPermission(DistanceRecord::class))
                    }
                }
                
                val granted = client.permissionController.getGrantedPermissions()
                if (granted.containsAll(permissionSet)) {
                    promise.resolve(true)
                } else {
                    promise.resolve(false)
                }
            } catch (e: Exception) {
                promise.reject("ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun getDailySteps(startTime: Double, endTime: Double, promise: Promise) {
        scope.launch {
            try {
                val client = HealthConnectClient.getOrCreate(reactApplicationContext)
                val request = ReadRecordsRequest(
                    recordType = StepsRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(
                        startTime = Instant.ofEpochMilli(startTime.toLong()),
                        endTime = Instant.ofEpochMilli(endTime.toLong())
                    )
                )
                val response = client.readRecords(request)
                val totalSteps = response.records.sumOf { it.count }
                promise.resolve(totalSteps)
            } catch (e: Exception) {
                promise.reject("ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun getDailyDistance(startTime: Double, endTime: Double, promise: Promise) {
        scope.launch {
            try {
                val client = HealthConnectClient.getOrCreate(reactApplicationContext)
                val request = ReadRecordsRequest(
                    recordType = DistanceRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(
                        startTime = Instant.ofEpochMilli(startTime.toLong()),
                        endTime = Instant.ofEpochMilli(endTime.toLong())
                    )
                )
                val response = client.readRecords(request)
                // Convert meters to kilometers and round to 2 decimal places
                val totalDistance = response.records.sumOf { it.distance.inMeters } / 1000.0
                promise.resolve(totalDistance)
            } catch (e: Exception) {
                promise.reject("ERROR", e.message)
            }
        }
    }
}
