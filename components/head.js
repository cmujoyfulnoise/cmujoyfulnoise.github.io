// Modularized version of head tag
// nvm don't use this lol
// Len Huang July 2020

// Given page, create correct title
const title = (page) => {
	var title = document.createElement("title");
	var pageString = page ? " | " + page : "";
	var pageText = document.createTextNode("Joyful Noise" + pageString);
	title.appendChild(pageText);
	return title;
};

// Load style sheet
const styleSheet = (href) => {
	var link = document.createElement("link");
	link.href = href;
	link.rel = "stylesheet";
	link.type = "text/css";
	return link;
};

// meta tag
const meta = () => {
	var meta = document.createElement("meta");
	meta.name = "viewport";
	meta.content =
		"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
};

// main fn
const head = () => {
	var head = document.head;
	var page = head.getAttribute("page");
	head.appendChild(title(page));
	head.appendChild(styleSheet("./stylesheets/screen.css"));
	head.appendChild(
		styleSheet("http://fonts.googleapis.com/css?family=Amatic+SC:400,700")
	);
	head.appendChild(
		styleSheet(
			"http://fonts.googleapis.com/css?family=Playfair+Display+SC:400,700"
		)
	);
	head.appendChild(meta());
};

// call fn
head();
