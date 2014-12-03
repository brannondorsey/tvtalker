var _ = require('underscore'),
timecode = require('timecode').Timecode;


function CCGenerator() {

	this._maxLineWidth = 80;

}

CCGenerator.prototype.asWebVTT = function(data) {
	
	var output = ['WEBVTT', ''];
	var message = '';
	var runningTimecode = timecode.init({ framerate: 59.94, drop_frame: true, timecode: "00:00:00;00" });

	_.each(data, function(d){
		
		message += d.word + ' ';

		var outTimecode = timecode.init({ framerate: 59.94, drop_frame: true, timecode: d.timecode_out});
		outTimecode.subtract(d.timecode_in);

		var i = formatTimecode(runningTimecode.toString());
		runningTimecode.add(outTimecode);
		var o = formatTimecode(runningTimecode.toString());
		

		output.push(i + '0 --> ' + o + '0 position:10% align:start');
		output.push(message.trim());
		output.push('');
	});

	return output.join('\n');
}

CCGenerator.prototype.asSRT = function(data) {
		
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