var sqlite3 = require('sqlite3').verbose(),
database = new sqlite3.Database(__dirname + '/data/tvtalker.sqlite'),
AutocompleteAPI = require(__dirname + '/src/AutocompleteAPI'),
VideoConcatonator = require(__dirname + '/src/VideoConcatonater'),
CCGenerator = require(__dirname + '/src/CCGenerator'),
WebRTCSignaler = require(__dirname + '/src/WebRTCSignaler'),
fs = require('fs'),
argv = require('argv'),
jayson = require('jayson'),
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

var JSONRPCclient = jayson.client.http({ port: 8954, host: '127.0.0.1', path:"/post" });

var vc = new VideoConcatonator(database, function(){
	
	if (args.videodisabled !== undefined) {
		console.log('[Notice] Video processing has been disabled.');
		vc.setVideoEnabled(false);
	}
	
	var webRTCSignaler = new WebRTCSignaler();
	var autocomplete = new AutocompleteAPI(database, 'clips');
	var CCGen = new CCGenerator();

	var io = require('socket.io')(server);

	io.on('connection', function(socket){ 

		socket.on('message', function(data){
			
			console.log('[Notice] Message recieved: "' + data.words.join(' ') + '"');
			var mediaDir = __dirname + '/data/DocumentRoot/media';
			var videoPath = mediaDir + '/video.mov';
			vc.concatonate(data.words, videoPath, function(err, results){
				
				if (err) console.log('error concatonating video');
				else {

					var captions = CCGen.asWebVTT(results);
					fs.writeFile(mediaDir + '/captions.vtt', captions, function (err) {
					  	
					  	if (err) throw err;
					  	
					  	var appData = {
							message: data.words.join(' '),
							videoPath: videoPath,
							closedCaptions: CCGen.asJSON(results),
						}
					  	
					  	JSONRPCclient.request('requestPlayVideo', appData, function(err, reply) {
							
							if (err) {
								if (err.code == 'ECONNREFUSED') appConnectionError();
								else console.log(err);
							} else console.log('[Notice] Display app recieved message');
						 	
						});
					  	
					  	console.log('[Notice] Update message sent to client');
					  	socket.emit('update video');
					});
				}
			});
		});

		socket.on('background video', function(data){
			
			console.log('[Notice] "background video" message recieved. Setting display background video to: ' + data);
			
			var method = (data.displayBackgroundVideo) ? 'backgroundVideoOn' : 'backgroundVideoOff'; 
			
			JSONRPCclient.request(method, data, function(err, reply) {

				if (err) {
					if (err.code == 'ECONNREFUSED') appConnectionError();
					else console.log(err);
				} else console.log('[Notice] "Display background video: ' + data.displayBackgroundVideo + '" sent to client');

			});
		});

		function appConnectionError() {

			console.log('[Error] Could not connect to display app');
		}

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

	webRTCSignaler.start(3002);
	server.listen(3000);

	console.log('[Notice] WebRTCSignaler server started at http://127.0.0.1:3002');
	console.log('[Notice] Web server started on http://127.0.0.1:3000');

});