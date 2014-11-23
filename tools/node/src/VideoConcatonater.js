var _ = require('underscore');

function VideoConcatonator(db) {
	this.db = db;
}

VideoConcatonator.prototype.concatonate = function(message, callback) {
		
	getVideoClips(message);
	// getMatches();

	// callback();
}

function getVideoClips(message) {
	
	var words = message.split(' ');
	
	var matches = [].concat(getMatches(words, 3), 
							getMatches(words, 2), 
							getMatches(words, 1));
	
	// self.db.serialize(function(){

	// 	var stmt = self.db.prepare('SELECT ' + columnName + ' FROM ' + self.tableName + ' WHERE ' + columnName + '="?"', testMatch);

	// });
}

function getMatches(words, step) {

	var self = this;
	var matches = [];

	for (var i = 0; i + step < words.length; i++) {
		var s = [];
		for (var j = 0; j < step; j++) {
			s.push(words[i + j]);
		}
		matches.push(s.join(' '));
	}

	return matches;
}



module.exports = VideoConcatonator;