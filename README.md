## Process

### 1. Record Program on HDHomeRun

```
# set the channel
hdhomerun_config FFFFFFFF set /tuner<n>/channel <channel>

# set the program
hdhomerun_config FFFFFFFF set /tuner<n>/program <program>

# start recording
hdhomerun_config FFFFFFFF save /tuner<n> <YYYY-MM-DD_STATION_program-name.ts>
```

### 2. Increase the keyframe tagging

```
ffmpeg -i <input>.ts -g 1 -keyint_min 1 -c:v libx264 -r 59.94 -crf 16 <output>.mp4
```

### 3. Split keyframe tagged video into 15 min sections to edit in Premiere

```
ffmpeg -i <input>.mp4 -c copy -ss <start> -to <end> <output>.mp4
```

## Notes

### Parse Closed Caption from raw Transmission Stream (ts):

```
ccextractor filename -o filename_cc.txt
```

### Transcode raw Transmission Stream with keyframe at every frame

```
ffmpeg -i input -g 1 -keyint_min 1 output
```

### Compress raw Transmission Stream

```
ffmpeg -i input -g 1 -keyint_min 1 -vf scale=640:-1 -r 59.94 -crf 28 output
```

e.g.

```
ffmpeg -i 2014-11-09_WFLDDT_Fox-32-News-at-Nine.ts -g 1 -keyint_min 1 -vf scale=640:-1 -r 59.95 -crf 25 /Users/bdorse/Documents/code/hdhomerun/video/compressed/resolution_640/2014-11-09_WFLDDT_Fox-32-News-at-Nine.mp4 
```

### Concatenate multiple video files

Create a list of files saved like below:

```
# this is a comment
file '/path/to/file1'
file '/path/to/file2'
file '/path/to/file3'
```

This can be accomplished easily via:

```
for f in ./*.mp4; do echo "file '$f'" >> list.txt; done
```

Concatenate files:

```
ffmpeg -f concat -i mylist.txt -c copy output.mp4
```

### Split video into multiple videos

```
ffmpeg -i input -vcodec copy -acodec copy -ss 00:30:00 -t 00:30:00 output
```

### Custom Test Scripts

```
  ./splice.sh timecode_correctly_keyframed.mp4 clips
```
```
  ffmpeg -f concat -i mylist.txt -c copy concatted.mp4
```

### Detect keyframe interval

```
ffprobe -of compact -show_packets -select_streams v input | grep K$ | awk 'BEGIN{FS="|";last=0}{split($5,a,"="); print a[2]-last; last=a[2]}'
```