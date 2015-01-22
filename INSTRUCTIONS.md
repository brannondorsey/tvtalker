# Instructions

These instructions have been separated into two sections. The first, [*Using TVTalker*](#Using-TVTalker) covers the installation and use of the TVTalker application. The second section, [*Recording, Tagging, and Preparing Data*](#Recording,-Tagging,-and-Preparing-Data) provides instructions to create and manage videos and databases used in the project.

## Using TVTalker

Todo.

## Recording, Tagging, and Preparing Data

### Record Program on HDHomeRun

```
# set the channel
hdhomerun_config FFFFFFFF set /tuner<n>/channel <channel>

# set the program
hdhomerun_config FFFFFFFF set /tuner<n>/program <program>

# start recording
hdhomerun_config FFFFFFFF save /tuner<n> <YYYY-MM-DD_STATION_program-name.ts>
```

### Transcode to Motion JPEG Codec in 15 min segments

Use the below script to splice raw transmission streams into 15 min mjpeg segments. 

```
ffmpeg -i /Volumes/Untitled/hdhomerun/video/programs/raw/<YYYY-MM-DD_STATION_program-name.ts> -c:v mjpeg -q:v 2 -r 59.94 -ss <HH:MM:SS> -to <HH:MM:SS> /Volumes/Untitled/hdhomerun/video/programs/segments/<YYYY-MM-DD_STATION_program-name>/<HH-MM-SS_HH-MM-SS.mov>
```

![Segment Files](images/segment_files.png)

It is important that for 59.94 FPS video these segments have a keyframe interval of around

```
0.016684
0.016683
0.016683
0.016684
```

This can be tested with the [detect keyframe interval command](COMMANDS.md#Detect-keyframe-interval).

### Tag words

Use Premiere Pro and Microsoft Excel (or a similar spreadsheet program) to tag words from videos using the below sequence settings.

![Premiere Pro Sequence Settings](images/sequence_settings.png)

Before videos are cut into individual clips a copy of each of the following files must exist in the `node/data` folder:

- `clips.csv`
- `programs.csv`
- `segments.csv`

### Cut segments into clips using tagged words

Use the `node/tools/clip_util.js` file to cut the words from `clips.cv` into individual .mov files in `/Untitled/hdhomerun/video/word_clips`.

```
# Increase max open file descriptors, any number may be used
ulimit -n 1024

# cut videos into word clips
node clip_util.js --cut [--fromId=n] [--toId=n]
```

### Transcode from Motion JPEG to h264 (Optional)

Currently, the TVTalker-client openFrameworks app works best when when handling h264 encoded video. For this reason, it is best to generate a copy of all clip videos that have been transcoded into the H264 codec for quick on the fly concatenation when using `ffmpeg`.

The `bash/mjpeg_to_h264.sh` script can be used quickly transcode all clip videos that have already been cut using the above steps.

Make sure that the `MPEG_DIR` and `H264_DIR` are set appropriately in the script before running.

```
./mjpeg_to_h264.sh
```

### Create/update SQLite Database


<!--
### Cut segments into words

Copy and paste all timecodes into the following format in sublime:

```
00;00;00;48, 00;00;01;2400;00;01;29, 00;00;01;5400;00;44;54, 00;00;45;2000;00;45;20, 00;00;45;3400;00;45;35, 00;00;46;18...
```

Generate a `list.txt` file to combine into a single video:

```
# if temp.txt already exists
rm temp.txt

# create list.txt
for f in ./clips/*.mov; do echo "file '$f'" >> temp.txt; done

# randomly sort list.txt
python -c "import random, sys; lines = open(sys.argv[1]).readlines(); random.shuffle(lines); print ''.join(lines)," temp.txt > list.txt

# remove temp.txt
rm temp.txt

```

Combine video using clips from list.txt:

```
# note, this uses libx264 by default. To copy as mjpeg use -c copy
ffmpeg -f concat -i list.txt -r 59.97 output_uniq.mov
```
-->