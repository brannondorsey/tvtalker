var _ = require('underscore'),
moment = require('moment'),
fs = require('fs'),
argv = require('argv'),
shell = require('shelljs'),
path = require('path'),
timecode = require('timecode').Timecode;

var args = argv.option([{
	   
	    name: 'input',
	    short: 'i',
	    type: 'string',
	    description: 'Input media file',
	    example: "'script --input=value' or 'script -i value'"
	},{
	    name: 'timestampFile',
	    short: 't',
	    type: 'string',
	    description: 'Formatted list of timestamps',
	    example: "'script --timestampFile=value' or 'script -t value'"
	},{
	    name: 'clipDir',
	    short: 'c',
	    type: 'string',
	    description: 'Clips directory',
	    example: "'script --clipDir=value' or 'script -c value'"
	},{
	    name: 'output',
	    short: 'o',
	    type: 'string',
	    description: 'Output media file',
	    example: "'script --output=value' or 'script -o value'"
	}]).run().options;

if (!_.isUndefined(args.input) &&
	!_.isUndefined(args.clipDir) &&
	!_.isUndefined(args.timestampFile)) {

	fs.readFile(args.timestampFile, { encoding: 'utf-8' },function(err, data){

		if (err) {

			console.log("Timestamp file not found");
			process.exit(1);
		}

		var lines = data.toString().split('\r');

		if (!shell.which('ffmpeg')) {
			console.log('Please install ffmpeg');
			process.exit(1);
		}

		if (!fs.existsSync(args.clipDir)) {
			console.log(args.clipDir + ' does not exist');
			process.exit(1);
		}

		// clear clip dir
		var clipDir = args.clipDir;
		if (clipDir.charAt(clipDir.length - 1) != '/') clipDir += '/';
		
		console.log(clipDir);

		shell.rm(clipDir + '*');
		
		var clipsSaved = 0;
		_.each(lines, function(line, i){
			
			if (line != '') {
				
				var timestamps = line.split(', ');

				// NOTE: The following chunk of codes should be removed. It was added to account
				// for an error where the first 100 data entries from an xml spreadsheet started
				// 5 frames to soon.
				
				// var ts = timecode.init({framerate: "29.97", drop_frame: true, timecode: timestamps[0]});
				// ts.subtract(5);

				// var str = ts.toString();
				// str = str.split('');
				// str[8] = ';';
				// timestamps[0] = str.join('');

				// var inTime = formatTimecode(ts.toString());

				// ts = timecode.init({framerate: "29.97", drop_frame: true, timecode: timestamps[1]});
				// ts.subtract(5);

				// str = ts.toString();
				// str = str.split('');
				// str[8] = ';';
				// timestamps[1] = str.join('');

				// var outTime = formatTimecode(ts.toString());


				var inTime = formatTimecode(timestamps[0]);
				var outTime = formatTimecode(timestamps[1]);

				// var command = 'ffmpeg -y -i ' + args.input + ' -c copy -g 1 -keyint_min 1 -ss ' + inTime + ' -to ' + outTime + ' ' + clipDir + i + path.extname(args.input);

				console.log('splicing video at ' + inTime);
				var command = 'ffmpeg -y -i ' + args.input + ' -c copy -ss ' + inTime + ' -to ' + outTime + ' ' + clipDir + i + path.extname(args.input);
				var result = shell.exec(command, {silent: true}).output;
				clipsSaved += 1;
			}
		});

		console.log('saved ' + clipsSaved + ' clips to ' + clipDir);
	});

} else argv.help();

function formatTimecode(timecode) {

	var beginning = timecode.slice(0, 8);
	var end = timecode.slice(9);
	// var parts = timecode.split(';');
	return beginning.replace(/;/g, ':') + '.' + (((parseInt(end))/60).toFixed(2).toString()).substring(2);
}

