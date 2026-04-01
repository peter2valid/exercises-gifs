#!/bin/bash

# Load environment variables from .env.local if it exists
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

BUCKET_NAME=${CLOUDFLARE_R2_BUCKET:-"gym-exercises"}
ACCESS_KEY=${CLOUDFLARE_R2_ACCESS_KEY}
SECRET_KEY=${CLOUDFLARE_R2_SECRET_KEY}
ENDPOINT="https://${CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

echo "🚀 Starting GIF upload to R2 bucket: $BUCKET_NAME..."

# Ensure r2-compatible aws cli is configured or use a dedicated tool like 'rclone' or 'wrangler'
# This script assumes 'wrangler' is available or uses a simple curl-based loop if keys are provided.
# For simplicity in this environment, we'll outline the wrangler/aws-cli approach.

if ! command -v wrangler &> /dev/null
then
    echo "❌ wrangler could not be found. Please install it with 'npm install -g wrangler' or use aws-cli."
    exit 1
fi

# Loop through all GIFs in assets/
for file in assets/*.gif; do
  filename=$(basename "$file")
  echo "Uploading $filename..."
  
  # Using wrangler r2 object put (standard way for Cloudflare)
  wrangler r2 object put "$BUCKET_NAME/exercises/$filename" --file "$file"
done

echo "🎉 All GIFs uploaded to Cloudflare R2!"