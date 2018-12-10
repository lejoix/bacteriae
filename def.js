var moveDirections = [
	[ //current dir is north
		[-1,0],
		[-1,1],
		[0,1],
		[1,1],
		[1,0],
		[1,-1],
		[0,-1],
		[-1,-1]
	],
	[ //current dir is north east
		[-1,1],
		[0,1],
		[1,1],
		[1,0],
		[1,-1],
		[0,-1],
		[-1,-1],
		[-1,0]
	],
	[ //current dir is east
		[0,1],
		[1,1],
		[1,0],
		[1,-1],
		[0,-1],
		[-1,1],
		[-1,0],
		[-1,1]
	],
	[ //current dir is south east
		[1,1],
		[1,0],
		[1,-1],
		[0,-1],
		[-1,-1],
		[-1,0],
		[-1,1],
		[0,1]
	],
	[ //current dir is south
		[1,0],
		[1,-1],
		[0,-1],
		[-1,-1],
		[-1,0],
		[-1,1],
		[0,1],
		[1,1]
	],
	[ //current dir is south west
		[1,-1],
		[0,-1],
		[-1,-1],
		[-1,0],
		[-1,1],
		[0,1],
		[1,1],
		[1,0]
	],
	[ //current dir is west
		[0,-1],
		[-1,-1],
		[-1,0],
		[-1,1],
		[0,1],
		[1,1],
		[1,0],
		[1,-1]
	],
	[ //current dir is north west
		[-1,-1],
		[-1,0],
		[-1,1],
		[0,1],
		[1,1],
		[1,0],
		[1,-1],
		[0,-1]
	]
];

var colors = [
	'669DFF',
    'FF0855',
    'A2FF12',
	'11FFBB',
	'1C65FF'
];

var eyeColors = [
	'Lime',
	'Lime',
	'DarkGreen',
	'Magenta',
	'Purple',
	'Turquoise',
];

var eatColor = 'rgb(150,150,150)';
var foodColor = 'FireBrick';