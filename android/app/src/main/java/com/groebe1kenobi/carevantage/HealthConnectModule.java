package com.groebe1kenobi.carevantage;

import android.app.Activity;
import android.content.Intent;
import androidx.annotation.NonNull;
import com.facebook.react.bridge.*;
import com.google.android.gms.tasks.Task;
import com.google.android.gms.tasks.Tasks;
import androidx.health.connect.client.HealthConnectClient;
import androidx.health.connect.client.PermissionController;
import androidx.health.connect.client.records.HeartRateRecord;
import androidx.health.connect.client.request.ReadRecordsRequest;
import androidx.health.connect.client.time.TimeRangeFilter;
import androidx.health.connect.client.records.StepsRecord;
import androidx.health.connect.client.records.DistanceRecord;
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutionException;

public class HealthConnectModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private HealthConnectClient healthConnectClient;

    public HealthConnectModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.healthConnectClient = HealthConnectClient.getOrCreate(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "HealthConnectModule";
    }

    @ReactMethod
    public void isAvailable(Promise promise) {
        try {
            boolean available = HealthConnectClient.isAvailable(reactContext);
            promise.resolve(available);
        } catch (Exception e) {
            promise.reject("HEALTH_CONNECT_ERROR", e);
        }
    }

    @ReactMethod
    public void requestPermissions(ReadableArray permissions, Promise promise) {
        Activity currentActivity = getCurrentActivity();
        if (currentActivity == null) {
            promise.reject("NO_ACTIVITY", "No current activity");
            return;
        }

        try {
            List<String> permissionList = Collections.unmodifiableList(permissions.toArrayList());
            Intent intent = new PermissionController(healthConnectClient)
                    .createRequestPermissionResultContract()
                    .createIntent(currentActivity, permissionList);
            currentActivity.startActivityForResult(intent, 1);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("PERMISSION_ERROR", e);
        }
    }

    @ReactMethod
    public void hasPermissions(ReadableArray permissions, Promise promise) {
        try {
            List<String> permissionList = Collections.unmodifiableList(permissions.toArrayList());
            Task<Boolean> task = healthConnectClient.getPermissionController()
                    .getGrantedPermissions(permissionList)
                    .thenApply(grantedPermissions -> grantedPermissions.containsAll(permissionList));
            boolean hasPermissions = Tasks.await(task);
            promise.resolve(hasPermissions);
        } catch (Exception e) {
            promise.reject("PERMISSION_CHECK_ERROR", e);
        }
    }

    @ReactMethod
    public void getDailySteps(String startTime, String endTime, Promise promise) {
        try {
            Instant start = Instant.parse(startTime);
            Instant end = Instant.parse(endTime);
            
            ReadRecordsRequest<StepsRecord> request = new ReadRecordsRequest.Builder<>(
                    StepsRecord.class,
                    TimeRangeFilter.between(start, end)
            ).build();
            
            Task<List<StepsRecord>> task = healthConnectClient.readRecords(request);
            List<StepsRecord> records = Tasks.await(task);
            
            long totalSteps = records.stream()
                    .mapToLong(StepsRecord::getCount)
                    .sum();
            
            promise.resolve(totalSteps);
        } catch (Exception e) {
            promise.reject("STEPS_ERROR", e);
        }
    }

    @ReactMethod
    public void getDailyDistance(String startTime, String endTime, Promise promise) {
        try {
            Instant start = Instant.parse(startTime);
            Instant end = Instant.parse(endTime);
            
            ReadRecordsRequest<DistanceRecord> request = new ReadRecordsRequest.Builder<>(
                    DistanceRecord.class,
                    TimeRangeFilter.between(start, end)
            ).build();
            
            Task<List<DistanceRecord>> task = healthConnectClient.readRecords(request);
            List<DistanceRecord> records = Tasks.await(task);
            
            double totalDistance = records.stream()
                    .mapToDouble(DistanceRecord::getDistance)
                    .sum();
            
            promise.resolve(totalDistance);
        } catch (Exception e) {
            promise.reject("DISTANCE_ERROR", e);
        }
    }

    @ReactMethod
    public void getDailyHeartRate(String startTime, String endTime, Promise promise) {
        try {
            Instant start = Instant.parse(startTime);
            Instant end = Instant.parse(endTime);
            
            ReadRecordsRequest<HeartRateRecord> request = new ReadRecordsRequest.Builder<>(
                    HeartRateRecord.class,
                    TimeRangeFilter.between(start, end)
            ).build();
            
            Task<List<HeartRateRecord>> task = healthConnectClient.readRecords(request);
            List<HeartRateRecord> records = Tasks.await(task);
            
            if (records.isEmpty()) {
                promise.resolve(0);
                return;
            }
            
            // Get the most recent heart rate measurement
            HeartRateRecord latestRecord = records.get(records.size() - 1);
            double heartRate = latestRecord.getSamples().get(0).getBeatsPerMinute();
            
            promise.resolve(heartRate);
        } catch (Exception e) {
            promise.reject("HEART_RATE_ERROR", e);
        }
    }

    @ReactMethod
    public void getDailyCalories(String startTime, String endTime, Promise promise) {
        try {
            Instant start = Instant.parse(startTime);
            Instant end = Instant.parse(endTime);
            
            ReadRecordsRequest<ActiveCaloriesBurnedRecord> request = new ReadRecordsRequest.Builder<>(
                    ActiveCaloriesBurnedRecord.class,
                    TimeRangeFilter.between(start, end)
            ).build();
            
            Task<List<ActiveCaloriesBurnedRecord>> task = healthConnectClient.readRecords(request);
            List<ActiveCaloriesBurnedRecord> records = Tasks.await(task);
            
            double totalCalories = records.stream()
                    .mapToDouble(ActiveCaloriesBurnedRecord::getEnergy)
                    .sum();
            
            promise.resolve(totalCalories);
        } catch (Exception e) {
            promise.reject("CALORIES_ERROR", e);
        }
    }
}