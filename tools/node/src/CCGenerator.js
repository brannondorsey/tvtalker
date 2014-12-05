var _ = require('underscore'),
timecode = require('timecode').Timecode;


function CCGenerator() {

	this._maxLineWidth = 80;

}

CCGenerator.prototype.asWebVTT = function(data) {
	
	var output = ['WEBVTT', ''];
	var message = '';
		
	forEachWordTimecode(data, function(d, i, o){
		
		message += d.word + ' ';
		output.push(i + '0 --> ' + o + '0 position:10% align:start');
		output.push(message.trim());
		output.push('');
	});

	return output.join('\n');
}

CCGenerator.prototype.asSRT = function(data) {
		
}

CCGenerator.prototype.asJSON = function(data) {
	
	var output = [];
	var message = '';
	
	forEachWordTimecode(data, function(d, i, o){
		
		message += d.word + ' ';
		output.push({
			in: i + '0',
			out: o + '0',
			text: message.trim()
		});
	});

	return output;
}

function forEachWordTimecode(data, fn) {

	var runningTimecode = timecode.init({ framerate: 59.94, drop_frame: true, timecode: "00:00:00;00" });

	_.each(data, function(d){
	
		var outTimecode = timecode.init({ framerate: 59.94, drop_frame: true, timecode: d.timecode_out});
		outTimecode.subtract(d.timecode_in);

		var i = formatTimecode(runningTimecode.toString());
		runningTimecode.add(outTimecode);
		var o = formatTimecode(runningTimecode.toString());

		fn(d, i, o);
	});
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

module.exports = CCGenerator;