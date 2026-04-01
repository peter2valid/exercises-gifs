#!/bin/bash

ASSETS_DIR="assets"
OUTPUT_DIR="assets_mp4"

echo "🚀 Starting mass conversion of GIFs to MP4s..."

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null
then
    echo "❌ ffmpeg could not be found. Please install it (e.g., sudo apt install ffmpeg) to continue."
    exit 1
fi

# Create target directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Count total for progress
TOTAL=$(ls -1q "$ASSETS_DIR"/*.gif 2>/dev/null | wc -l)
CURRENT=0

if [ "$TOTAL" -eq 0 ]; then
    echo "⚠️ No GIFs found in $ASSETS_DIR"
    exit 0
fi

for gif in "$ASSETS_DIR"/*.gif; do
    if [ -f "$gif" ]; then
        CURRENT=$((CURRENT+1))
        # Get filename without path and extension
        filename=$(basename -- "$gif")
        basename="${filename%.*}"
        
        # Target mp4 file
        target="$OUTPUT_DIR/$basename.mp4"
        
        echo "[$CURRENT/$TOTAL] Converting $filename..."
        
        # Faststart for web playback, yuv420p for wide hardware support
        ffmpeg -y -i "$gif" -movflags faststart -pix_fmt yuv420p -hide_banner -loglevel error "$target"
    fi
done

echo "✅ Conversion complete! MP4s are ready in $OUTPUT_DIR"
