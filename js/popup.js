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

function search(query) {
	$("#search-icon").addClass("loading");
	$("#search-input").val(query);

	var searchUrl = 'http://priberam.pt/dlpo/default.aspx';

	$.ajax({
		url: searchUrl,
		type: "GET",
		data: {
			'pal': query
		},
		success: function(data) {
			parseResponse(query, data);
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

function parseResponse(query, response) {
	var $response = $(response);
	var first = true;
	var results = [];
	var word_of_the_day = [];
	var records = $response.find('div[registo="true"]');

	if(records.length > 1) {
	    for(var i = 0; i < records.length; i++) {

	    	var $record = $(records[i]);

	    	var spans = $record.find('span[ondblclick]');

	    	for(var j = 0; j < spans.length; j++) {
	    		var result = {
	    			"definition": spans[j].textContent
	    		};
	    		if(i == 0) {
	    			word_of_the_day.push(result);
	    			display("word_of_the_day", word_of_the_day, query);
	    		}
	    		else {
	    			results.push(result);
	    			display("result", results, query);
	    		}
	    	}
	    }
	}
	else{
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
	}
}

function insertInfoRow(type, label, content) {
	var $row = $("<tr>").addClass(type);
	$row.append($("<td>").addClass("label").html(label));
	$row.append($("<td>").addClass("content").html(content));
	$("#result-info").append($row);
}

function insertLinkRow(type, label, content) {
	var $row = $("<tr>").addClass(type);
	$row.append($("<td>").addClass("label").html(label));
	$row.append($("<td>").addClass("content").html($("<a>").addClass("link-content").html(content)));
	$("#result-info").append($row);
}

function display(type, content, query) {
	$("#search-icon").removeClass("loading");
	$("#result-info").hide();
	$("#result-info").empty();

	if (type == "result") {
		displayResult(content, "Defini&ccedil;&atilde;o",query);
	}
	else if (type == "message") {
		displayMessage(content);
	}
	else if(type == "suggestions") {
		displayResult(content, "Quis dizer", query);
	}
	else if(type == "word_of_the_day") {
		displayResult(content, "Palavra do dia", query);	
	}

	$("#result-info").fadeIn(250);
	$("#result").show();
}

function displayResult(fields, label, query) {

	var $expressionCell = $("<td>").attr("colspan", 2).html(query);
	var $expressionRow = $("<tr>").addClass("expression").html($expressionCell);
	$("#result-info").append($expressionRow);

	var first = true;
	for(var i = 0; i < fields.length; i++) {
		if(first) {
			first = false;
			insertInfoRow("definition", label, fields[i]["definition"]);
		}
		else {
			insertInfoRow("definition", "", fields[i]["definition"]);
		}
	}
}

function displayMessage(message) {
	insertInfoRow(message["type"], message["label"], message["content"]);
}

function handleLinks(html) {
	// right now the anchors are being removed
	// later on I want to convert them to search links
	var tempDiv = $("<div>").html(html);
	tempDiv.find("a").contents().unwrap();
	return tempDiv.html();
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

    $("#search-input").click(function() {
    	console.log("olaaa");
		
	});
});
