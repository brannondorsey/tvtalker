$(document).ready(function(){
    
    var socket = io('http://127.0.0.1:3000');

    socket.on('update video', function(data){
        var video = $('#video')[0];
        var captions = $('#video track');
        var src = captions.attr('src');
        captions.attr('src', '');
        captions.attr('src', src);
        setTimeout(function(){
            video.load();
            video.play();
        }, 100);
    });

    $('#message-box').textcomplete([
        {
            match: /(\s)(\w{1,})$/,
            search: searchFunc,
            replace: function (word) {
                replaceFunc(word);
                return ' ' + word + ' ';
            }
        },
        {
            match: /(^)(\w{1,})$/,
            search: searchFunc,
            replace: function (word) {
                replaceFunc(word);
                return word + ' ';
            }
        }
    ]);

    // events
    $('#message-box').on('keypress', function(evt){
        
        var key = evt.keyCode | evt.which;

        // enter
        if (key == 13) {
            evt.preventDefault();
            send();
        }

    });

    $('#message-box').on('keyup', function(evt){
        
        var key = evt.keyCode | evt.which;

        // delete
        if (key == 8) {
            syncMatches();
        }
    });

    $('#message-box').on('keydown', function(evt){
        
        var key = evt.keyCode | evt.which;

        // left arrow key
        if (key == 37) {
            evt.preventDefault();                       
        }

    });

    $('.clear-message').on('mouseup', function(evt){
        clearMatches(getMatches().join(' '));
    });

     $('.send-message').on('mouseup', function(evt){

         send();
    });

    function send() {

        if ($('#match-container').children().length > 0) { 
            var matches = getMatches();
            clearMatches(matches.join(' '));
            $('#past-messages').prepend('<li class="list-group-item">' + matches.join(' ') + '</li>');
            sendMessage(matches);
        }
    }
    
    function searchFunc(term, callback) {
        
        $.getJSON('/autocomplete', { word: term.replace('_', ' ') })
            .done(function (resp) {
                
                var words = [];
                if (resp.error === undefined) {
                    
                    for (var i = 0; i < resp.length; i++) {
                        words.push(resp[i].word);
                    }
                }

                callback(words);
                
            }).fail(function () {
                callback([]);
            });
    }

    function sendMessage(words) {

        var data = {
            words: words
        }

        socket.emit('message', data);
    }

    function getMatches() {

        var matches = $('#match-container').children();
        var matchesContent = [];
        for (var i = 0; i < matches.length; i++) {
            matchesContent.push($(matches[i]).text());
        }
        return matchesContent;
    }

    function replaceFunc(word) {
        $('#match-container').append('<span class="label label-info">' + word + '</span>');
    }

    function clearMatches(message) {

        $('#match-container').empty();
        $('#message-box').val('');
    }

    function syncMatches() {

        var textContent = $('#message-box').val().trim();
        var textWords = textContent.split(' ');
        var matches = $('#match-container').children();
        var textWordIndex = 0;
        for (var i = 0; i < matches.length; i++) {
            var matchWords = $(matches[i]).text().split(' ');
            for (var j = 0; j < matchWords.length; j++) {
                if (matchWords[j] != textWords[textWordIndex]){
                    $(matches[i]).remove();
                }
                textWordIndex++;
            }
        }
    }

    function placeCaretAtEnd(el) {
        el.focus();
        if (typeof window.getSelection != "undefined"
                && typeof document.createRange != "undefined") {
            var range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (typeof document.body.createTextRange != "undefined") {
            var textRange = document.body.createTextRange();
            textRange.moveToElementText(el);
            textRange.collapse(false);
            textRange.select();
        }
    }

    // http://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity
    function setEndOfContenteditable(contentEditableElement) {
        var range,selection;
        if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
        {
            range = document.createRange();//Create a range (a range is a like the selection but invisible)
            range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
            range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
            selection = window.getSelection();//get the selection object (allows you to change selection)
            selection.removeAllRanges();//remove any selections already made
            selection.addRange(range);//make the range you have just created the visible selection
            
        }
        else if(document.selection)//IE 8 and lower
        { 
            range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
            range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
            range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
            range.select();//Select the range (make it the visible selection
        }
    }
});
