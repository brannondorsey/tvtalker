var _ = require('underscore');

function VideoConcatonator(db) {
	this.db = db;
}

VideoConcatonator.prototype.concatonate = function(message, callback) {
		
	this._getVideoClips(message, function(matches){
		var words = message.split(' ');
		for (var i = 2; i > -1; i--) {
			_.each(matches[i], function(matchChildren){
				if (matchChildren.rows.length > 0) {
					
				}	
			});
		}
	});

	// callback();
}

VideoConcatonator.prototype._getVideoClips = function(message, callback) {
	
	var self = this;
	var words = message.split(' ');
	
	var matches = [];

	matches[0] = getMatchGroup(words, 3);
	matches[1] = getMatchGroup(words, 2);
	matches[2] = getMatchGroup(words, 1);

	var matchCount = 0;
	for (var i = 0; i < matches.length; i++) {
		matchCount += matches[i].length;
	}

	var onLastResult = _.after(matchCount, callback);
	
	self.db.serialize(function(){

		var stmt = self.db.prepare('SELECT * FROM clips WHERE word=?');
		for (var i = 0; i < matches.length; i++) {
			for (var j = 0; j < matches[i].length; j++) {
				
				stmt.all(matches[i][j].search, function(err, rows){
					
					if (err) throw err;
					if (rows !== undefined && rows.length > 0) {
						
						_.each(rows, function(row){
							var match = matches[3 - (row.word.split(' ').length)];
							_.each(match, function(query){
								if (query.search == row.word) {
									query.rows.push(row);
								}
							});
						});
					}

					onLastResult(matches);
				});
			}
		}
	});
}

function arrangeMatchesToMessage() {

}

function getMatchGroup(words, step) {

	var self = this;
	var matches = [];

	for (var i = 0; i + step < words.length; i++) {
		
		var s = [];

		for (var j = 0; j < step; j++) {
			s.push(words[i + j]);
		}

		matches.push({ 
			search: s.join(' '),
			rows: []
		});
	}
	return matches;
}

module.exports = VideoConcatonator;