var _ = require('underscore'),
fs = require('fs'),
argv = require('argv'),
shell = require('shelljs'),
path = require('path'),
csv = require('csv'),
timecode = require('timecode').Timecode,
spawn = require('child_process').spawn,
exec = require('child_process'),exec,
QueueIt = require('queueit');

var clips = {
	key: {},
	data: {} // NOTE: clips data is an object not an array
};

var programs = {
	key: {},
	data: [] 
};

var segments = {
	key: {},
	data: [] 
};

// raw clip CSV data
var clipsCSV = undefined;
var videoDir = '/Volumes/Untitled/hdhomerun/video';
var maxOpenFiles = 1024;

var args = argv.option([{
	   
	    name: 'message',
	    short: 'm',
	    type: 'string',
	    description: 'Message',
	    example: "'script --message=value' or 'script -m value'"
	},{
		name: 'cut',
		short: 'c',
		type: 'string',
	    description: 'Signifies that the script should cut segments using csv',
	    example: "'script --cut' or 'script -c'"
	},{
		name: 'fromId',
		type: 'string',
		short: 'f',
	    description: 'if --cut has been specified, this value denotes the start id',
	    example: "'script --fromId=1' or 'script -f 1'"
	},{
		name: 'toId',
		type: 'string',
		short: 't',
	    description: 'if --cut has been specified, this value denotes the end id',
	    example: "'script --toId=1' or 'script -t 1'"
	},{
		name: 'outputDir',
		type: 'string',
		short: 'd',
	    description: 'if --cut has been specified, this value specifies the folder to save clips to',
	    example: "'script --outputDir=/path/to/dir' or 'script -d /path/to/dir'"
	}]).run().options;

if (!shell.which('ffmpeg')) {
	
	console.log('Please install ffmpeg.');
	process.exit(1);

} else if (!fs.existsSync(videoDir)) {

	console.log('Video directory "' + videoDir + '" does not exist');
	process.exit(1);

} else if (!_.isUndefined(args.message)) {

	console.log('Message mode activated. Ignoring any cut mode parameters.');
	
	loadData(function(){
		
		var message = args.message;
		var messageWords = message.split(' ');
		var clipData = [];
		var missingWords = [];
		var tmp = [];
		var m;

		for (var i = 0; i < messageWords.length; i++) {

			var w = clips.data[messageWords[i] + '_'];
			
			// if the word exists
			if (w !== undefined) {
			
				clipData.push(w);

			} else {
				missingWords.push(messageWords[i]);
			}
		}
 
		var output = '';

		if (missingWords.length > 0) {

			if (missingWords.length = 1) output += '"' + missingWords[0] + '"';
			else output += '"' + missingWords.join('", "');

			output += ' not found in database.';
			console.log(output);
			process.exit(1);

		} else {

			// check to make sure that all clips exist
			// and alert if they do not, suggesting that
			// the user should run script --cut to sync the
			// clip files to the database.
			
			// concatonate files.
			
			// open movie.

			for (var i = 0; i < clipData.length; i++) {
				
				var clipPath = videoDir + '/word_clips/' + clipData[i].id + '.mov';
				if (!fs.existsSync(clipPath)) {
					
					m = clipPath + ' exists in the database, but could not be found.';
					m += 'Try recutting the database with "--cut"';
					console.log(m);

					process.exit(1);

				} else {

					_.once(function(){
						
						if (fs.existsSync(__dirname + '/../data/tmp.txt')) {
							fs.unlinkSync(__dirname + '/../data/tmp.txt');
						}
					});

					tmp.push('file \'' + clipPath + '\'');
				}

				// var inTime = formatTimecode(clipData[i].timecodeIn, clipData[i].id);
				// var outTime = formatTimecode(clipData[i].timecodeOut, clipData[i].id);

				// console.log('splicing from ' + inTime + ' to ' + outTime);

				// var inputFile = args.segmentDir + '/' + segments[clipData[i].segmentId - 1];
				// var command = 'ffmpeg -y -i ' + inputFile + ' -c copy -ss ' + inTime + ' -to ' + outTime + ' ' + __dirname + '/../data/clips/' + i + path.extname(inputFile);
				// var result = shell.exec(command, {silent: true}).output;
			}

			fs.writeFile(__dirname + '/../data/tmp.txt', tmp.join('\n'), function(err){
				
				if (err) {
					console.log('error saving ' + __dirname + '/../data/tmp.txt');
				} else {
					
					var files = fs.readdirSync(__dirname + '/../data/messages');
					if (_.isUndefined(files) || _.isNull(files)) {
						console.log('Error reading files from' + __dirname + '/../data/messages');
						process.exit(1);
					}

					var outputFilePath = __dirname + '/../data/messages/' + (files.length + 1) +'.mov';
					if (shell.exec('ffmpeg -f concat -i ' + __dirname + '/../data/tmp.txt -c copy ' + outputFilePath, {silent: true}).code == 0) {
							
						console.log('Success, run the following command to open file:');
						console.log('open ' + outputFilePath + ' -a "QuickTime Player"');
					} else {
						console.log('Error concatonating videos with FFmpeg.');	
					}
				}
			});
		}
	});

} else if (!_.isUndefined(args.cut)) {

	console.log('Cut mode activated. Ignoring any message mode parameters.');

	loadData(function(){

		var fromId = 1;
		var toId = undefined;
		var outputDir = videoDir + '/word_clips';

		if (!_.isUndefined(args.fromId)) {
			fromId = parseInt(args.fromId);
			console.log('--fromId set to ' + fromId);
		}

		if (!_.isUndefined(args.toId)) {
			toId = parseInt(args.toId);
			console.log('--toId set to ' + toId);
		}

		if (!_.isUndefined(args.outputDir)) {
			
			if (fs.existsSync(path.resolve(args.outputDir))) {
				outputDir = path.resolve(args.outputDir);
			} else {
				console.log('outputDir "' + args.outputDir + '" does not exist');
				process.exit(1);
			}
		}
		
		if (toId !== undefined) console.log('cutting clips ' + fromId + ' to ' + toId);
		
		console.log('Setting system max open files to ' + maxOpenFiles + ' with "ulimit"');
		shell.exec('ulimit -S -n ' + maxOpenFiles, {silent: true}).output

		if (shell.error()) {
			console.log('error setting open file limit with ulimit');
		}

		var q = new QueueIt({ max_num_processes : 100 });

		q.start();

		var max = (toId !== undefined) ? toId + 1: clipsCSV.length;

		for (var i = fromId; i < max; i++) {

			var row = clipsCSV[i];
			var id = row[clips.key.id];
			var program = programs.data[row[clips.key.program_id] - 1].basename;
			var segment = segments.data[row[clips.key.segment_id] - 1].segment;
			var word = row[clips.key.word];
			var timecodeIn = formatTimecode(row[clips.key.timecode_in], row[clips.key.id]);
			var timecodeOut = formatTimecode(row[clips.key.timecode_out], row[clips.key.id], 2);

			var inputFile = videoDir + '/programs/segments/' + program + '/' + segment;
			var outputFile = outputDir + '/' + i + path.extname(inputFile);

			var arguments = ('-y -i ' + inputFile + ' -c:v copy -c:a libfaac -ac 2 -ss ' + timecodeIn + ' -to ' + timecodeOut + ' ' + outputFile).split(' ');		
			
			console.log(i + ' cutting "' + word + '" from file ' + program + '/' + segment + ' ' + timecodeIn + '-' + timecodeOut);
			// var result = shell.exec(command, { silent: true });
		  	var count = 0;
		  	q.push({ 
		      command: 'ffmpeg',
		      arguments: arguments,
		      cb : function (err,data) {

		      		// process error, this is behaving incorrectly
		      		// with ffmpeg
		      		if (arguments.length == 2) {

		      		} else {

		      			// process exit
		      			if (arguments[0] === null) {
		      				
		      				count++;
		      				console.log(count + ' files cut');
		      				
		      				if (count == max - fromId) {
		      					q.stop();
		      				}
		      				
		      			// data
		      			} else {
		      				
		      			}
		      		}
		        }
		    });
		}

	});

} else argv.help();

// load clips.csv and use it to fill clips array
function loadData(callback) {

	var clipsFile    = __dirname + '/../data/clips.csv';
	var programsFile = __dirname + '/../data/programs.csv';
	var segmentsFile = __dirname + '/../data/segments.csv';

	// load programs csv
	fs.readFile(programsFile, { encoding: 'utf-8' }, function(err, programsData){

		if (err) loadFileError(programsFile);

		// parse programs file
		csv.parse(programsData, function(err, programsData) {

			if (err) parseFileError(programsFile);

			// fill key for easy lookup
			for (var i = 0; i < programsData[0].length; i++) {
				programs.key[programsData[0][i]] = i;
			}

			for (var i = 1; i < programsData.length; i++) {

				var row = programsData[i];
				
				programs.data[i - 1] = {
					id: row[programs.key.id],
					program: row[programs.key.program],
					network: row[programs.key.network],
					station: row[programs.key.station],
					recordingDate: row[programs.key.recording_date],
					recordingLocation: row[programs.key.recording_location],
					basename: row[programs.key.basename],
					genre: row[programs.key.genre],
					recordingFps: row[programs.key.recording_fps],
					recordingDuration: row[programs.key.recording_duration],
					programDuration: row[programs.key.program_duration],
					local: parseInt(row[programs.key.local]) == 1
				}
			}
		});

		fs.readFile(segmentsFile, { encoding: 'utf-8' }, function(err, segmentsData){

			if (err) loadFileError(segmentsFile);

			// parse programs file
			csv.parse(segmentsData, function(err, segmentsData) {

				if (err) parseFileError(segmentsFile);

				// fill key for easy lookup
				for (var i = 0; i < segmentsData[0].length; i++) {
					segments.key[segmentsData[0][i]] = i;
				}

				for (var i = 1; i < segmentsData.length; i++) {

					var row = segmentsData[i];

					segments.data[i - 1] = {
						id: row[segments.key.id],
						programId: row[segments.key.program_id],
						segment: row[segments.key.segment]
					}
				}
			});

			fs.readFile(clipsFile, { encoding: 'utf-8' }, function(err, clipsData){

				if (err) loadFileError(clipsFile);
				
				csv.parse(clipsData, function(err, clipsData){

					if (err) parseFileError(clipsFile);

					clipsCSV = clipsData;

					// fill key for easy lookup
					for (var i = 0; i < clipsData[0].length; i++) {
						clips.key[clipsData[0][i]] = i;
					}

					console.log(clipsData.length + ' clips loaded.');
					for (var i = 1; i < clipsData.length; i++) {
						

						var row = clipsData[i];
						
						// append word with '_' to avoid overriding
						// Object.prototype methods
						clips.data[row[clips.key.word] + '_'] = {
							id: row[clips.key.id],
							programId: row[clips.key.program_id],
							segmentId: row[clips.key.segment_id],
							timecodeIn: row[clips.key.timecode_in],
							timecodeOut: row[clips.key.timecode_out],
							duringCommercial: parseInt(row[clips.key.during_commercial]) == 1,
							voiceOnscreen: parseInt(row[clips.key.voice_onscreen]) == 1
						};
					}

					callback();
				});
			});
		});
	});

	function loadFileError(filename) {
		console.log('Error loading file. "' + filename + '"" file not found.');
		process.exit(1);
	}

	function parseFileError(filename) {
		console.log('Error parsing file "' + filename + '"');
		process.exit(1);
	}
}

function formatTimecode(timestamp, clipId, offset) {

	// this is some dumb bullshit, fix this soon
	var fps = (clipId >= 239 && clipId <= 460) ? "29.97" : "59.94";
	var ts = timecode.init({framerate: fps, drop_frame: true, timecode: timestamp});
	
	if (!_.isUndefined(offset)) {
		var frameOffset = (fps == "59.94") ? offset : offset/2;
		ts.add(frameOffset);
	}

	return ts.toString().slice(0, 8) + '.' + (((parseInt(ts.toString().slice(9)))/fps).toFixed(2).toString()).substring(2);
}

