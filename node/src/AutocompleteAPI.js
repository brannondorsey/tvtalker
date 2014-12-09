var _ = require('underscore');

function AutocompleteAPI(db, tableName) {
	this.db = db;
	this.tableName = tableName;
}

AutocompleteAPI.prototype.getResults = function(text, columnName, callback) {
		
	var self = this;
	self.db.serialize(function() {
	  // SELECT word FROM clips WHERE word LIKE 'this%' ORDER BY LENGTH(word)
	  var stmt = self.db.prepare('SELECT ' + columnName + ' FROM ' + self.tableName + ' WHERE ' + columnName + ' LIKE "' + text + '%"');
	  stmt.all(function(err, rows) {
	  	
	  	var results = _.sortBy(rows, function(result){  
	  		return result.word.length; 
	  	});

	  	results = _.uniq(results, function(item, key, a) { 
		    return item.word;
		});

	  	callback(err, results);
	  });
	});
}

module.exports = AutocompleteAPI;