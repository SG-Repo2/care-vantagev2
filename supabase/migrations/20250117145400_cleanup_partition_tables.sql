-- Drop the trigger and function first
DROP TRIGGER IF EXISTS health_metrics_insert_trigger ON health_metrics;
DROP FUNCTION IF EXISTS create_health_metrics_partition();

-- Drop all partition tables if they exist
DROP TABLE IF EXISTS health_metrics_2020;
DROP TABLE IF EXISTS health_metrics_2021;
DROP TABLE IF EXISTS health_metrics_2022;
DROP TABLE IF EXISTS health_metrics_2023;
DROP TABLE IF EXISTS health_metrics_2024;
DROP TABLE IF EXISTS health_metrics_2025;

-- Drop the temporary table if it exists
DROP TABLE IF EXISTS health_metrics_new;