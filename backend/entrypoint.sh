#!/bin/sh

# Wait for DB to be fully ready
echo "Waiting for PostgreSQL..."
sleep 3

# Ensure static folder exists and is writable
mkdir -p /app/static
chmod 777 /app/static

# Initialize migrations folder if not exists
if [ ! -d "migrations" ]; then
    echo "Initializing migrations..."
    flask db init
fi

# Attempt to generate a migration for any schema changes
echo "Generating migrations..."
flask db migrate -m "Schema update"

# Apply migrations
echo "Applying migrations..."
flask db upgrade

# Start Gunicorn
echo "Starting Server..."
exec gunicorn --bind 0.0.0.0:5000 "app:create_app()"
