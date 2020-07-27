// Modularized version of main title and navbar
// Len Huang July 2020

const heading = [
	["Home", "./index.html"],
	["About Us", "./about.html"],
	["Members", "./members.html"],
	["Music", "./music.html"],
	["Contact", "./contact.html"],
	["Test", "./test.html"]
];

// uncomment this when contact page is implemented
heading.pop();

const subLinks = () => {
	var ul = document.createElement("ul");
	// Generate based off of list above
	heading.forEach(([text, link]) => {
		// Create list and link
		var li = document.createElement("li");
		var a = document.createElement("a");
		// set text and link
		var linkText = document.createTextNode(text);
		a.href = link;
		// add back onto list
		a.appendChild(linkText);
		li.appendChild(a);
		ul.appendChild(li);
	});
	return ul;
};

// A way to modularize the main header
const create = () => {
	// Create main heading
	var main_h1 = document.createElement("h1");
	var main_a = document.createElement("a");
	// Create nav bar
	var nav = document.createElement("nav");
	// Reference main-header in html
	var header = document.getElementById("main-header");
	// Set text and link for main title
	var main_title = document.createTextNode("Joyful Noise");
	main_a.href = "./index.html";
	// Append it on back to header
	main_a.appendChild(main_title);
	main_h1.appendChild(main_a);
	header.appendChild(main_h1);
	// Create nav and append it to header
	nav.appendChild(subLinks());
	header.appendChild(nav);
};

// Call function
create();
