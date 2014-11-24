var sqlite3 = require('sqlite3').verbose(),
database = new sqlite3.Database(__dirname + '/../../data/tvtalker.sqlite'),
AutocompleteAPI = require(__dirname + '/src/AutocompleteAPI'),
// VideoConcatonator = require(__dirname + '/src/VideoConcatonator'),
express = require('express'),
app = express(),
server = require('http').Server(app);

var autocomplete = new AutocompleteAPI(database, 'clips');
// var vc = new VideoConcatonator(database);

var io = require('socket.io')(server);

io.on('connection', function(socket){ 

	socket.on('message', function(data){
		console.log("Message recieved: ");
		console.log(data.words);
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
console.log('server started on http://127.0.0.1:3000');

