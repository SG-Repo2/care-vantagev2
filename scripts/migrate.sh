#!/bin/bash

# Exit on error
set -e

echo "Starting database migration..."

# Reset database first
echo "Resetting database..."
supabase db reset --linked

# Apply all migrations
echo "Applying migrations..."
supabase db push

echo "Migration complete!" 