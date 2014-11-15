# Commands

A list of helpful `ffmpeg`, `hdhomerun_config`, `ccextractor` etc... commands

## Record Program on HDHomeRun

```
# set the channel
hdhomerun_config FFFFFFFF set /tuner<n>/channel <channel>

# set the program
hdhomerun_config FFFFFFFF set /tuner<n>/program <program>

# start recording
hdhomerun_config FFFFFFFF save /tuner<n> <YYYY-MM-DD_STATION_program-name.ts>
```

## Parse Closed Captions from raw Transmission Stream

```
ccextractor <input> -o <output>
```

## Add keyframe every frame

```
# watch out for compression changes with this command
# Using -c copy ignores keyframe interval changes 
ffmpeg -i <input> -g 1 -keyint_min 1 <output>
```

## Compress and scale

```
ffmpeg -i <input> -vf scale=640:-1 -r 59.94 -crf 28 <output>
```

## Split video into multiple videos

```
ffmpeg -i <input> -c copy -ss 00:30:00 -t 00:30:00 <output>
```

## Concatenate multiple video files

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

## Detect keyframe interval

```
ffprobe -of compact -show_packets -select_streams v <input> | grep K$ | awk 'BEGIN{FS="|";last=0}{split($5,a,"="); print a[2]-last; last=a[2]}'
```