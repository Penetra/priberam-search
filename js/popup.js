function handleFormSubmit(query) {
    if (query.length > 0) {
        search(query);
    } else {
        display("message", {
            type: "information",
            label: "Information",
            content: "Use esta caixa de texto para procurar palavras.",
        });
    }
}

function cleanArray(array) {
    return $.grep(array,function(n){
            return(n);
        }
    );
}

function search(query) {
    $("#search-icon").addClass("loading");
    $("#search-input").val(query);

    var searchUrl = 'http://priberam.pt/dlpo/default.aspx';

    $("#result").hide();
    //Empty current window
    $("#result-info").empty();

    //allow searching for several words
    var words = cleanArray(query.split(' '));

    var j = 0;
    for(var i = 0; i < words.length; i++) {
        $.ajax({
            url: searchUrl,
            type: "GET",
            data: {
                'pal': words[i]
            },
            success: function(data) {
                var doc = document.implementation.createHTMLDocument('');
                doc.documentElement.innerHTML = data;
                parseResponse(words[j], doc, (j++ + 1 == words.length));
                if(j == words.length) {
                    $("#search-icon").removeClass("loading");
                    $("#result-info").fadeIn(250);
                    $("#result").show();
                }
            },
            error: function() {
                display("message", {
                    type: "error",
                    label: "Error",
                    content: "Ocorreu um erro, por favor tente mais tarde.",
                });
            }
        });
    }

    //Show
    
    //
}

function parseResponse(query, response, multiple) {
    var $response = $(response);
    var first = true;
    var results = [];
    var word_of_the_day = [];
    var word = '';

    //Search for response and word of the day
    var records = $response.find('div[registo="true"]');

    //Found match
    if(records.length > 1) {
        for(var i = 0; i < records.length; i++) {
            var $record = $(records[i]);
            
            //word of the day is supposed to appear first
            if(i == 0) {
                word = $record.find('span b')[0].textContent;
            }
            //Get word meanings
            var spans = $record.find('span[ondblclick]');

            //Remove garbage and traductions
            for(var j = 0; j < spans.length; j++) {
                $content = $(spans[j]);

                var firstWord = ""

                //If special word
                var special = $content.find('span[class="varpt"]');
                if(special.length > 0) {
                    var $temp = $(special);
                    var f = $temp.find('span[class="aAO"]');
                    if(f.length > 0) {
                        firstWord = f[0].textContent; 
                    }
                }

                if($content.find('small').length == 0 && $content.attr('class') !== "dAO") {
                    var result = {
                        "definition": spans[j].textContent
                    };
                    if(i == 0) {
                        word_of_the_day.push(result);
                    }
                    else {
                        results.push(result);
                    }
                }
            }
        }
        //Display results
        display("result", results, query);
        if(multiple) {
            display("word_of_the_day", word_of_the_day, word);
        }
    }
    else{
        //Incorrect word, show suggestions
        var records = $response.find('div#FormataSugestoesENaoEncontrados a');
        if(records.length > 0) {
            for(var i = 0; i < records.length; i++) {
                var result = {
                    "definition": records[i].textContent
                }
                results.push(result);
            }
            display("suggestions", results, query);
        }
        else {
            //Should not appear because priberam always returns something
            display("message", {
                type: "error",
                label: "Error",
                content: "Nenhuma palavra encontrada, por favor verifique a palavra introduzida.",
            });
        }
    }
}

function insertInfoRow(type, label, content) {
    var $row = $("<tr>").addClass(type);
    $row.append($("<td>").addClass("label").html(label));
    $row.append($("<td>").addClass("content").html(content));
    $("#result-info").append($row);
}

//Clickable link
function insertLinkRow(type, label, content) {
    var $row = $("<tr>").addClass(type);
    $row.append($("<td>").addClass("label").html(label));

    var words = content.split(' ');
    var links = '';
    for(var i = 0; i < words.length; i++) {
        links += '<a class="link-content">'
        links += words[i];
        if(i != (words.length - 1)) {
            links+= ' ';
        }
        links += '</a>'
    }

    $row.append($("<td>").addClass("content").html(links));
    $("#result-info").append($row);
}

function display(type, content, query) {

    if (type == "result") {
        displayResult(content, "Defini&ccedil;&atilde;o", query);
    }
    else if(type == "suggestions") {
        displayResult(content, "Quis dizer", query);
    }
    else if(type == "word_of_the_day") {
        displayResult(content, "Palavra do dia", query);    
    }
    else if (type == "message") {
        displayMessage(content);
    }
}

function displayResult(fields, label, query) {

    var $expressionCell = $("<td>").attr("colspan", 2).html(query);
    var $expressionRow = $("<tr>").addClass("expression").html($expressionCell);
    $("#result-info").append($expressionRow);

    var first = true;
    for(var i = 0; i < fields.length; i++) {
        if(first) {
            first = false;
            insertLinkRow("definition", label, fields[i]["definition"]);
        }
        else {
            insertLinkRow("definition", "", fields[i]["definition"]);
        }
    }
}

function displayMessage(message) {
    insertInfoRow(message["type"], message["label"], message["content"]);
}

$(window).load(function() {
    $("#search-input").focus();

    chrome.extension.onRequest.addListener(function(selection) {
        search(selection);
    });

    chrome.tabs.executeScript(null, { file: "/js/request.js" });

    $("#search-input").keypress(function(e) {
        // if pressed key == 'Enter'
        var key = e.keyCode || e.which;
        if (key == 13) {
            handleFormSubmit($("#search-input").val());
        }
    });
});

$(document).ready(function () {
    $('a.link-content').live('mousedown', function(){
        var query = $(this).html().replace(/[\.,\/#!$%\^&\*;:{}=_`~()]/g,"");
        handleFormSubmit(query);
    });
})
