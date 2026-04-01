#!/bin/bash

# Configuration
BUCKET_NAME="gym-exercises"
R2_REMOTE_NAME="r2-gym" # Requires rclone setup with the name 'r2-gym'
LOCAL_ASSETS_DIR="./assets_mp4"

echo "🚀 Starting upload of 1300+ MP4s to Cloudflare R2..."

# Ensure rclone is installed
if ! command -v rclone &> /dev/null
then
    echo "❌ rclone could not be found. Please install it to use this script."
    exit
fi

# Upload files recursively to the /exercises/ prefix
rclone copy "$LOCAL_ASSETS_DIR" "$R2_REMOTE_NAME:$BUCKET_NAME/exercises" --progress --threads 16

echo "✅ Upload complete! Assets are now available at: https://cdn.yourdomain.com/exercises/"
