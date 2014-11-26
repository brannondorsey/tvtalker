var _ = require('underscore');

function CCGenerator() {

	this._maxLineWidth = 80;
}

CCGenerator.prototype.asWebVTT = function(data) {
		
	_.each(data, function(d){

	});
}

CCGenerator.prototype.asSRT = function(data) {
		
}

module.exports = CCGenerator;