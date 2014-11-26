var sqlite3 = require('sqlite3').verbose(),
database = new sqlite3.Database(__dirname + '/../../data/tvtalker.sqlite'),
AutocompleteAPI = require(__dirname + '/src/AutocompleteAPI'),
VideoConcatonator = require(__dirname + '/src/VideoConcatonater'),
CCGenerator = require(__dirname + '/src/CCGenerator'),
argv = require('argv'),
express = require('express'),
app = express(),
server = require('http').Server(app);

var args = argv.option([{
    name: 'videodisabled',
    short: 'd',
    type: 'string',
    description: 'Diable video processing',
    example: "'script --videodisabled' or 'script -d'"
}]).run().options;

var vc = new VideoConcatonator(database, function(){
	
	if (args.videodisabled !== undefined) {
		console.log('[Notice] Video processing has been disabled.');
		vc.setVideoEnabled(false);
	}
	

	var autocomplete = new AutocompleteAPI(database, 'clips');
	var CCGen = new CCGenerator();

	var io = require('socket.io')(server);

	io.on('connection', function(socket){ 

		socket.on('message', function(data){
			
			console.log('[Notice] Message recieved: "' + data.words.join(' ') + '"');
			var output = __dirname + '/data/DocumentRoot/media/video.mov';

			vc.concatonate(data.words, output, function(err, results){
				
				if (err) console.log('error concatonating video');
				else {
					CCGen.asWebVTT(results);
					socket.emit('update video');
				}
			});
		});
	});

	var documentRoot = __dirname + '/data/DocumentRoot';

	app.get('/autocomplete', function(req, res){
		
		var word = req.query.word;
		res.status(200);

		if (word !== undefined) {
		
			autocomplete.getResults(word, 'word', function(err, results){

				if (err) console.log(err);
				
				res.send(results);
			});

		} else {

			var err = {
				error: "API_ERROR",
				message: "You must provide a 'word' GET parameter."
			};

			res.send(err);
		}
	});

	app.use(express.static(documentRoot));

	server.listen(3000);
	console.log('[Notice] Server started on http://127.0.0.1:3000');

});