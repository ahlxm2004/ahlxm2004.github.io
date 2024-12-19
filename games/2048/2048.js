var score, best = 0, id, level, num, grid_size, fail, timeout;
var color_1 = ["", "#C0FF3E", "#66FF00", "#FFB90F", "#FF7F00", "#FF4040",
	"#FF0000", "#FF0099", "#FF00FF", "#9933FF", "#EEEE00"];
var color_2 = ["#505050", "#FFFFFF"];
var t1 = 200, t2 = 150, t3 = 120, t4 = 500, wait = 250;

function sleep(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

function get_key_code(e) {
	e = e || window.event;
	return e.keyCode || e.which || e.charCode;
}

function new_number_cell(x, y, container) {
	var div = document.createElement("div"), v = level[x][y];
	div.className = "number-cell";
	div.id = "number-cell-" + id[x][y];
	div.style.top = (container.offsetTop - 2) + "px";
	div.style.left = (container.offsetLeft - 2) + "px";
	div.style.width = div.style.height = grid_size + "px";
	div.style.fontSize = (grid_size * (v < 10 ? 0.45 : (v < 14 ? 0.4 : (v < 17 ? 0.32 : 0.28)))) + "px";
	div.style.borderColor = div.style.backgroundColor = color_1[v < 10 ? v : 10];
	div.style.color = color_2[v <= 2 ? 0 : 1];
	if (v > 8)
		div.style.textShadow = "0 0 5px white",
		div.style.boxShadow = "0 0 " + grid_size * 0.15 + "px " + color_1[v < 10 ? v : 10];
	div.innerHTML = (1 << v);
	return document.getElementById("grid-container").appendChild(div);
}

function emerge(div, container) {
	var _fontSize = div.style.fontSize;
	div.style.top = (container.offsetTop + 0.5 * grid_size - 4) + "px";
	div.style.left = (container.offsetLeft + 0.5 * grid_size - 4) + "px";
	div.style.height = div.style.width = div.style.fontSize = 0;
	$(div).animate({
		top: (container.offsetTop - 2) + "px",
		left: (container.offsetLeft - 2) + "px",
		height: grid_size + "px",
		width: grid_size + "px",
		fontSize: _fontSize
	}, t1);
}

function move(div, container) {
	$(div).animate({
		top: (container.offsetTop - 2) + "px",
		left: (container.offsetLeft - 2) + "px"
	}, t2);
}

function highlight(div, container) {
	var _fontSize = div.style.fontSize;
	_fontSize = parseInt(_fontSize.substr(0, _fontSize.length - 2));
	$(div).animate({
		top: (container.offsetTop - grid_size * 0.125 - 2) + "px",
		left: (container.offsetLeft - grid_size * 0.125 - 2) + "px",
		height: (grid_size * 1.25) + "px",
		width: (grid_size * 1.25) + "px",
		fontSize: (_fontSize * 1.25) + "px"
	}, t3 / 2);
	$(div).animate({
		top: (container.offsetTop - 2) + "px",
		left: (container.offsetLeft - 2) + "px",
		height: grid_size + "px",
		width: grid_size + "px",
		fontSize: _fontSize + "px"
	}, t3 / 2);
}

function emerge_cell(x, y, v) {
	id[x][y] = ++num; level[x][y] = v;
	var container = document.getElementById("grid-cell-" + x + y);
	emerge(new_number_cell(x, y, container), container);
}

function del_cell(num) {
	var div = document.getElementById("number-cell-" + num);
	document.getElementById("grid-container").removeChild(div);
}

function move_cell(x1, y1, x2, y2) {
	var div = document.getElementById("number-cell-" + id[x1][y1]);
	var container = document.getElementById("grid-cell-" + x2 + y2);
	move(div, container), id[x2][y2] = id[x1][y1], level[x2][y2] = level[x1][y1], id[x1][y1] = level[x1][y1] = 0;
}

function double_cell(x, y) {
	del_cell(id[x][y]), id[x][y] = ++num, level[x][y]++;
	var container = document.getElementById("grid-cell-" + x + y);
	highlight(new_number_cell(x, y, container), container);
	score += (1 << level[x][y]), update_score();
}

function check_move_set(set_x, set_y) {
	for (var i = 0; i < 3; i++) {
		if (!id[set_x[i]][set_y[i]] && id[set_x[i + 1]][set_y[i + 1]]) return true;
		if (id[set_x[i]][set_y[i]] && level[set_x[i]][set_y[i]] == level[set_x[i + 1]][set_y[i + 1]]) return true;
	}
	return false;
}

function move_set(set_x, set_y) {
	var set_z = [];
	for (var i = 0, p = 0; i < 4; i++) {
		if (i == 0 || level[set_x[i]][set_y[i]] == 0) continue;
		var j = i; while (j && id[set_x[j - 1]][set_y[j - 1]] == 0) j--;
		if (j != p && level[set_x[j - 1]][set_y[j - 1]] == level[set_x[i]][set_y[i]])
			p = j--, set_z.push([id[set_x[j]][set_y[j]], set_x[j], set_y[j]]);
		if (i != j) move_cell(set_x[i], set_y[i], set_x[j], set_y[j]);
	}
	if (set_z != null)
		sleep(t2).then(() => {
			for (var i = 0; i < set_z.length; i++)
				del_cell(set_z[i][0]), double_cell(set_z[i][1], set_z[i][2]);
		});
}

function check_fail() {
	for (var i = 0; i < 4; i++)
		for (var j = 0; j < 4; j++)
			if (id[i][j] == 0) return false;
	for (var i = 0; i < 4; i++)
		for (var j = 0; j < 3; j++)
			if (level[i][j] == level[i][j + 1]) return false;
	for (var i = 0; i < 3; i++)
		for (var j = 0; j < 4; j++)
			if (level[i][j] == level[i + 1][j]) return false;
	return true;
}

function check_move_left() {for (var i = 0; i < 4; i++) if (check_move_set([i, i, i, i], [0, 1, 2, 3])) return true; return false;}
function check_move_up() {for (var i = 0; i < 4; i++) if (check_move_set([0, 1, 2, 3], [i, i, i, i])) return true; return false;}
function check_move_right() {for (var i = 0; i < 4; i++) if (check_move_set([i, i, i, i], [3, 2, 1, 0])) return true; return false;}
function check_move_down() {for (var i = 0; i < 4; i++) if (check_move_set([3, 2, 1, 0], [i, i, i, i])) return true; return false;}

function move_left() {for (var i = 0; i < 4; i++) move_set([i, i, i, i], [0, 1, 2, 3]);}
function move_up() {for (var i = 0; i < 4; i++) move_set([0, 1, 2, 3], [i, i, i, i]);}
function move_right() {for (var i = 0; i < 4; i++) move_set([i, i, i, i], [3, 2, 1, 0]);}
function move_down() {for (var i = 0; i < 4; i++) move_set([3, 2, 1, 0], [i, i, i, i]);}

function update_score() {
	if (score > best) best = score;
	document.getElementById("current-score").innerHTML = "score: " + score;
	document.getElementById("best-score").innerHTML = "best: " + best;
}

function generate() {
	var x, y, v = (Math.random() < 0.9 ? 1 : 2);
	do {
		x = Math.floor(Math.random() * 4);
		y = Math.floor(Math.random() * 4);
	} while (id[x][y]);
	emerge_cell(x, y, v);
}

function reset() {
	id = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
	level = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
	num = 0; fail = false;
}

function save() {
	if (window.localStorage)
		window.localStorage.setItem("games-2048-score", score),
		window.localStorage.setItem("games-2048-best", best),
		window.localStorage.setItem("games-2048-level", JSON.stringify(level)),
		window.localStorage.setItem("games-2048-fail", fail);
}

function process(key_code) {
	if (key_code == 37 && !check_move_left()) return;
	if (key_code == 38 && !check_move_up()) return;
	if (key_code == 39 && !check_move_right()) return;
	if (key_code == 40 && !check_move_down()) return;
	switch (key_code) {
		case 37 : move_left(); break;
		case 38 : move_up(); break;
		case 39 : move_right(); break;
		case 40 : move_down(); break;
	}
	sleep(t2).then(() => {
		generate();
		if (check_fail())
			fail = true, sleep(t4).then(() => {
				alert("Game over! Final score: " + score), restart();
			});
		save();
	});
}

function restart() {
	if (id != null)
		for (var i = 0; i < 4; i++)
			for (var j = 0; j < 4; j++)
				if (id[i][j]) del_cell(id[i][j]);
	score = 0; update_score(); reset();
	generate(), generate(); save();
}

function initialize() {
	var L = window.screen.height;
	document.getElementById("game-wrapper").style.width =
		Math.min(L * 0.7, window.screen.width * 0.8).toString() + "px";
	document.getElementById("game-wrapper").style.paddingTop =
	document.getElementById("game-wrapper").style.paddingBottom =
		(L / 50) + "px";
	document.getElementById("game-wrapper").style.paddingLeft =
	document.getElementById("game-wrapper").style.paddingRight =
		(L / 100) + "px";

	L = getComputedStyle(document.getElementById("header")).getPropertyValue("width");
	L = parseInt(L.substr(0, L.length - 2));
	document.getElementById("current-score").style.fontSize =
	document.getElementById("best-score").style.fontSize =
	document.getElementById("button").style.fontSize =
		(L / 28) + "px";

	grid_size = getComputedStyle(document.getElementById("grid-cell-00")).getPropertyValue("padding-left");
	grid_size = 2 * parseInt(grid_size.substr(0, grid_size.length - 2));

	if (window.localStorage && localStorage.getItem("games-2048-best") != null)
		best = localStorage.getItem("games-2048-best");
	if (window.localStorage && localStorage.getItem("games-2048-fail") == "false") {
		var _level = JSON.parse(localStorage.getItem("games-2048-level"));
		score = parseInt(localStorage.getItem("games-2048-score")), update_score();
		reset();
		for (var i = 0; i < 4; i++)
			for (var j = 0; j < 4; j++)
				if (_level[i][j]) emerge_cell(i, j, _level[i][j]);
	}
	else restart();
}

window.onkeydown = function() {
	var key_code = get_key_code(); if (key_code < 37 || key_code > 40) return;
	if (!timeout) process(key_code), timeout = setTimeout(function() {timeout = null;}, wait);
};

$('button').on('mousedown', function(event) {event.preventDefault();});
initialize();
