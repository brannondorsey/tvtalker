var _ = require('underscore'),
fs = require('fs'),
path = require('path'),
exec = require('child_process').exec;

function VideoConcatonator(db, callback) {
	
	var self = this;

	self._db = db;
	self._videoDir = '/Volumes/Untitled/hdhomerun/video';
	self._videoEnabled = true;
	self._segments = undefined;
	self._programs = undefined;

	fs.exists(self._videoDir, function(exists){
		
		if (!exists) {
			console.log('[Warning] Video directory "' + self._videoDir + '" does not exist');
		}

		// cache sequences and programs
		self._getAllRows('segments', function(err, rows){

			if (err) throw err;
			self._segments = rows;

			self._getAllRows('programs', function(err, rows){

				if (err) throw err;
				self._programs = rows;
				callback();
			});
		});
	});
}

VideoConcatonator.prototype.concatonate = function(words, outputFile, callback) {
	
	var self = this;	

	self._getResults(words, function(results){

		var orderedResults = [];
		var err = false;

		// note: results not gauranteed to be in order
		for (var i = 0; i < words.length; i++) {
			var word = words[i];
			for (var j = 0; j < results.length; j++) {

				if (results[j].length > 0) {

					if (results[j][0].word == word) {
						orderedResults[i] = _.sample(results[j]);
						continue;
					}

				} else {
					err = true;
				}
			}
		}

		if (err) callback(err, null);
		else if (!self._videoEnabled) callback(null, orderedResults);
		else self._concatonateVideo(orderedResults, outputFile, callback);
	});
}

VideoConcatonator.prototype.setVideoEnabled = function(bool) {
	this._videoEnabled = bool;
}

VideoConcatonator.prototype._concatonateVideo = function(results, outputFile, callback) {
	
	var self = this;
	var tmp = [];
	var clipsExist = true;

	var afterClipCheck = _.after(results.length, function(){

		fs.writeFile(__dirname + '/../data/tmp.txt', tmp.join('\n'), function(err){
			
			if (err) {
				console.log('[Error] could not save ' + __dirname + '/../data/tmp.txt');
				console.log(err);
			} else {
				
				console.log('[Notice] concatonating video');
				exec('ffmpeg -y -f concat -i ' + __dirname + '/../data/tmp.txt ' + outputFile, 
					function (error, stdout, stderr) {
					
				    if (error === null) {
				    	console.log('[Notice] video file saved to ' + outputFile);
					} else {
						console.log('[Error] ' + error);
					}

					callback(err, results);
				});
			}
		});
	});

	fs.unlink(__dirname + '/../data/tmp.txt', function(err){

		for (var i = 0; i < results.length; i++) {
			
			var clipPath = self._videoDir + '/word_clips/' + results[i].id + '.mov';
			tmp.push('file \'' + clipPath + '\'');

			fs.exists(clipPath, function(exists){
				
				if (!exists) {

					clipsExist = false;
					console.log('[Error] ' + clipPath + ' exists in the database but could not be found.');
				}

				afterClipCheck();
			});

		}
			// var inTime = formatTimecode(clipData[i].timecodeIn, clipData[i].id);
			// var outTime = formatTimecode(clipData[i].timecodeOut, clipData[i].id);

			// console.log('splicing from ' + inTime + ' to ' + outTime);

			// var inputFile = args.segmentDir + '/' + segments[clipData[i].segmentId - 1];
			// var command = 'ffmpeg -y -i ' + inputFile + ' -c copy -ss ' + inTime + ' -to ' + outTime + ' ' + __dirname + '/data/clips/' + i + path.extname(inputFile);
			// var result = shell.exec(command, {silent: true}).output;

	});
}

VideoConcatonator.prototype._getResults = function(words, callback) {
	
	var self = this;

	var cb = _.after(words.length, callback);
	var results = [];
	self._db.serialize(function(){

		var stmt = self._db.prepare('SELECT id, segment_id, program_id, word, timecode_in, timecode_out FROM clips WHERE word=?');
		
		_.each(words, function(word, i){
			
			stmt.all(words[i], function(err, rows){
			
				if (err) throw err;
				results.push(rows);

				cb(results);
			});
		});
	});
}

VideoConcatonator.prototype._getAllRows = function(table, callback) {

	var self = this;

	self._db.serialize(function(){

		self._db.all('SELECT * FROM ' + table, callback);
	});
}

module.exports = VideoConcatonator;