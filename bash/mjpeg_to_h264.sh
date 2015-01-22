#!/bin/bash

MJPEG_DIR="word_clips"
H264_DIR="word_clips_h264"

for f in $(ls $MJPEG_DIR); do
	ffmpeg -y -i "$MJPEG_DIR/$f" -c:v libx264 -crf 18 -c:a copy -r 59.97 -g 1 -keyint_min 1 "$H264_DIR/$f"
done;