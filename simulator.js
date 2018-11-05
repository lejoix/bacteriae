class BacteriaeSimulator {
	constructor(canvas='canvas', bacteriacount = 10, foodcount, lakenumber) {
		this.maxiteration = 10000;
		this.iteration = 0;
		this.updateInterval = 500;
		this.bacteriaCount = bacteriacount || 10;
		this.size = 7 + Math.floor(this.bacteriaCount / 2);
		this.scale = 15 + (250 / this.bacteriaCount * 2) / 2 - 5;
		this.foodCount = foodcount || this.bacteriaCount * 10;
		this.initialbacteriaEnergy = 40;
		this.maxBacteriaEnergy = 60; //max bacteria energy
		this.splitBacteriaEnergy = 100; //energy for splitting
		this.foodEnergy = 20; //energy value of food
		this.energyLoss = 1;
		this.hibernateEnergy = 10;
		this.hibernateRounds = 20;
		this.mutation = 0.05;
		this.children = 0;
		this.layfood = 0;
		this.lake = new Lake(this, lakenumber);

        this.foodSeasons = [{ //0 - spring, 1 - summer, 2 - autumn, 3 - winter
				name: 'spring',
				iteration: 100,
				foodperiter: 5,
				trigger: 7
			},{
				name: 'summer',
				iteration: 90,
				foodperiter: 5,
				trigger: 4
			},{
				name: 'autumn',
				iteration: 90,
				foodperiter: 1,
				trigger: 4
			},{
				name: 'winter',
				iteration: 90,
				foodperiter: 1,
				trigger: 10
			}]; //number of iterations for a season and number of food per iteration
		this.seasonIteration = 0;	
		this.currentSeason = 0; //default spring
		this.deadcount = 0;
		this.bacterias = []; //all bacterias
		this.foods = []; //all foods
		this.sleep = 0; //optimization
		this.updating = false; //optimization
		this.allbacterias = 0;

		//todo seturi de anotimpuri pe zone geografice
        //todo simulari = lacuri si se deschide poarta intre lacuri, indivizii trec dintr-un lac in altul
        this.canvas = canvas;
		// this.canvas.setWidth(this.size * this.scale * this.lake.lakeNumber + 10);
		// this.canvas.setHeight(this.size * this.scale * this.lake.lakeNumber + 10);
		this.createGrid();
		var [r, c] = [this.size, this.size]; 
		this.field = Array(r).fill().map(()=>Array(c).fill({})); 

		for(let row = 0; row < this.size; row++){
			for(let col = 0; col < this.size; col++) {
				this.field[row][col] = new Object({
					bacterias: [],
					foods: []
				});
			}
		}

		//create bacterias
		for(let i = 0; i < this.bacteriaCount; i++) {
			this.createBacteria();
		}

		//create food
		this.createFood(this.foodCount);
		console.log(this.field);

		$('#bacteriacount').text('Bacteria count: ' + this.bacterias.length.toString());
		$('#foodcount').text('Food count: 		' + this.foods.length.toString());
		$('#childrencount').text('Children count: ' + (this.children).toString());
		$('#iterationcount').text('Iteration count: ' + (this.iteration).toString());

		return this;
	}

	createBacteria(motherBacteria = {}) {
		var row = getRandomInt(this.size);
		var col = getRandomInt(this.size);
		var bact = new Bacteria(this, row, col, ++this.allbacterias, this.initialbacteriaEnergy, motherBacteria, this.lake);

		this.bacterias.push(bact);
		this.field[row][col].bacterias.push(bact);
	}

	addBacteria() {

	}

	removeBacteria() {

	}

	bacteriaSwitchLakes() {

	}

	createFood(foodCount) {
		var row, col;
		for (let i = 0; i < foodCount; i++) {
			row = getRandomInt(this.size);
			col = getRandomInt(this.size);		
			var food = new Food(this, row, col, this.foods.length, this.foodEnergy, this.lake);

			this.foods.push(food);
			this.field[row][col].foods.push(food);
		}
	}
	
	createGrid() {
		for (let i = 0; i <= this.size; i++) {
			let scale = this.scale;
			if (i == 0 || i == this.size) {
				scale = this.scale * 6;
			}
			this.canvas.add(makeLine(i * this.scale + this.lake.lakeY, 0 + this.lake.lakeX,
				i * this.scale + this.lake.lakeY, this.size * this.scale + this.lake.lakeX, scale));
			this.canvas.add(makeLine(0 + this.lake.lakeY, i * this.scale + this.lake.lakeX,
				this.size * this.scale + this.lake.lakeY, i * this.scale + this.lake.lakeX, scale));
		}
	}

	start() {
		//start by updating initial state
		this.updateByRules(true);

		this.process = setInterval(() => {
			this.move();
		}, this.updateInterval);
	}

	stop() {
		clearTimeout(this.process);
	}

	move() {
		if ((this.updating || this.iteration % 30 === 0) && this.sleep < 1)  {//wait for refresh
			this.sleep++;
			//clear any leftovers;
			// for (let row = 0; row < this.size; row++) {
			// 	for(let col = 0; col < this.size; col++) {
			// 		let bacterias = this.field[row][col].bacterias;

			// 		_.forEach(bacterias, (bact, index) => {
			// 			if (bact.dead) {
			// 				if (this.field[bacteria.row][bacteria.col].bacterias.length == 1) {
			// 					this.field[bacteria.row][bacteria.col].bacterias = [];
			// 				} else {
			// 					this.field[bacteria.row][bacteria.col].bacterias.splice(index, 1);
			// 				}
							
			// 				this.canvas.remove(bact.group);
			// 			}
			// 		});
			// 	}
			// }
			return;
		}

		this.sleep = 0;
		this.iteration++;
		this.updating = true;

		if (this.iteration >= this.maxiteration) {
			window.alert('Max iteration reached! Stopping simulation!');
			$("#restart").trigger('click');		
		}
		if (this.bacterias <= 0) {
			window.alert('All bacterias are dead! Simulation over!');
			console.log('All bacterias are dead! Simulation over!');
			$("#restart").trigger('click');		
		}

		//set food 
		let nextSeason = this.currentSeason + 1;
		if (nextSeason > 3) {
			nextSeason = 0;
		}

		//...and change seasons if needed
		if (this.seasonIteration >= this.foodSeasons[nextSeason].iteration) {
			this.seasonIteration = 0;
			this.currentSeason = nextSeason;
			console.info('CHANGING SEASONS!! ', this.foodSeasons[this.currentSeason].name);
		}

		this.layfood++;
		this.seasonIteration++;

		if (this.layfood >= this.foodSeasons[this.currentSeason].trigger) {
			this.layfood = 0;
			console.log('LAYING FOOD!! SEASONS:', this.foodSeasons[this.currentSeason].name, 'foodcount:',  this.foodSeasons[this.currentSeason].foodperiter);
			this.createFood(this.foodSeasons[this.currentSeason].foodperiter);
		}

		$('#bacteriacount').text('Bacteria count: ' + this.bacterias.length.toString());
		$('#foodcount').text('Food count: ' + this.foods.length.toString());
		$('#childrencount').text('Children count: ' + (this.children).toString());
		$('#iterationcount').text('Iteration count: ' + (this.iteration).toString());
		$('#deadcount').text('Dead bacteria count: ' + (this.deadcount).toString());

		//make movement + redraw
		let moveit = 0;
		_.forEach(this.bacterias, (bact) => {
			if (bact.hibernate > 0) {
				bact.hibernate -= 1;
				bact.text.setText((this.iteration - bact.age).toString());

				return;
			}

			bact.move();
		});

		// this.canvas.renderAll();
		this.updateByRules();
		// this.updating = false;
	}

	updateByRules(noEnergyLoss = false) {
		//update simulation based on rules
		_.forEach(this.bacterias, (bacteria) => {
			var row = bacteria.row;
			var col = bacteria.col;
			let el = this.field[row][col];
			let bacterias = _.sortBy(el.bacterias, ['energy'], ['desc']);
			let foods = el.foods;
			if (bacteria.hibernate > 0) {
				return;
			} else {
				bacteria.rect.set('strokeWidth', 0);
				bacteria.text.set('fill', 'black');
			}

			//first eat food if available, starting by strongest
			//decrease if not available
			if (foods.length > 0) {
				let food = foods.pop();
				food.draw();
				bacteria.energy += food.energy;
				food.rect.remove(); //remove food and redraw
				this.foods = 
					_.filter(this.foods, (f) => {
						return f.index !== food.index;
					}) || [];
			} 

			if (!noEnergyLoss) {
				bacteria.energy -= this.energyLoss;
			}

			if (bacteria.energy > this.splitBacteriaEnergy) {
				// console.log('Max energy reached!');
				this.createBacteria(bacteria);
				this.children++;
				bacteria.energy = Math.floor(bacteria.energy / 2)
			}

			if (bacteria.energy == this.hibernateEnergy) {
				console.log('Hibernating!');
				bacteria.hibernate = this.hibernateRounds;
				bacteria.rect.set('stroke', 'red');
				bacteria.rect.set('strokeWidth', this.scale / 5);
				bacteria.rect.set('fill', 'red');
				bacteria.text.set('fill', 'red');
			}

			if (bacteria.energy < this.hibernateEnergy) {
				bacteria.rect.set('opacity', 0.5 + (bacteria.energy/100));
				bacteria.rect.set('fill', 'red');
			} else {
				bacteria.rect.set('fill', bacteria.fill);
				bacteria.rect.set('opacity', 0.2 + (bacteria.energy/100));
			}

			if (bacteria.energy <= 0) {
				console.log('Bacteria dead!');

				//delete bacteria from simulation field
				let delindex = 0;
				if (this.field[bacteria.row][bacteria.col].bacterias.length == 1) {
					this.field[bacteria.row][bacteria.col].bacterias = [];
				} else {
					this.field[bacteria.row][bacteria.col].bacterias = 
						_.filter(this.field[bacteria.row][bacteria.col].bacterias, (bact) => {
							if (bact.index == bacteria.index) {
								bact.dead = true;
							}

							return bact.index !== bacteria.index;
						}) || [];
				}

				this.bacterias = 
					_.filter(this.bacterias, (bact) => {
						return bact.index !== bacteria.index;
					}) || [];

				this.canvas.remove(bacteria.group);
				bacteria.rect.remove();
				bacteria.text.remove();
				bacteria = null;
				this.deadcount++;
			}

			if (bacteria) {
				bacteria.text.setText((this.iteration - bacteria.age).toString());
			}

		});

		this.canvas.renderAll();

		$('#bacteriacount').text('Bacteria count: ' + this.bacterias.length.toString());
		$('#foodcount').text('Food count: ' + this.foods.length.toString());
		$('#childrencount').text('Children count: ' + (this.children).toString());
		$('#deadcount').text('Dead bacteria count: ' + (this.deadcount).toString());
		$('#iterationcount').text('Iteration count: ' + (this.iteration).toString());
		$('#season').text('Season: ' + (this.foodSeasons[this.currentSeason].name));
		this.updating = false;
	}
}

function makeLine(x1, y1, x2, y2, scale) {
	coords = [x1, y1, x2, y2];
    return new fabric.Line(coords, {
      fill: 'grey',
      stroke: 'grey',
      strokeWidth: scale / 20,
      selectable: false,
      evented: false,
    });
}	

function update(canvas, object, row, col, lakeX, lakeY) {
	object.top = row + lakeX;
	object.left = col + lakeY;
	object.setCoords();
}

function getRandomInt(max) {
	return Math.floor(Math.random()*Math.floor(max));
}

class Simulator {
	constructor(canvas, bacteriacount, foodcount, nrOfLakes = 2) {
		this.sim = [];
		this.canvas = canvas;
		this.nrOfLakes = nrOfLakes;
		for (let i = 0; i < this.nrOfLakes; i++) {
            this.sim.push(new BacteriaeSimulator(canvas, bacteriacount, foodcount, i));
        }
    }

    start() {
		for (let i = 0; i < this.nrOfLakes; i++) {
            this.sim[i].start();
        }
    }

    move() {
		for (let i = 0; i < this.nrOfLakes; i++) {
            this.sim[i].move();
        }
    }

    stop(restart = false) {
		for (let i = 0; i < this.nrOfLakes; i++) {
			if (this.sim[i]) {
                this.sim[i].stop();
                if (restart) {
                	this.canvas.clear();
					delete this.sim[i];
					this.sim[i] = null;
                }
            }
        }
    }

    restart() {
		this.stop(true);
	}

    updateByRules() {
		for (let i = 1; i <= this.nrOfLakes; i++) {
            this.sim[i].updateByRules();
        }
    }
}

$(document).ready(function(){

	var bacteriacount = parseInt($('#bacteria').val());
	var foodcount = parseInt($('#food').val());
	$('#bacteriacount').text($('#bacteriacount').text() + bacteriacount);
	$('#foodcount').text($('#foodcount').text() + foodcount);
	var initialized = true;
	var updated = false;
	let canvas = new fabric.Canvas('canvas', );
	let sim = new Simulator(canvas, bacteriacount, foodcount, $('#lakecount').text() || 1);

	$('#bacteria').change((el) => {
		bacteriacount = parseInt($('#bacteria').val());
		$('#bacteriacount').text('Bacteria count: ' + bacteriacount);
	});

	$('#food').change((el) => {
		foodcount = parseInt($('#food').val());
		$('#foodcount').text('Food count: ' + foodcount);
	});

	$('#create').click((el) => {
		console.log('Resetting simulation!');
		if (sim) {
			sim.restart();
		}
		$('.canvas-container').remove();
		$('<canvas id="canvas" width="1000px" height="1000px">').appendTo('body');
        sim = new Simulator(canvas, 2);
		initialized = true;
	});

	$("#restart").click((el) => {
		var buttonAttributes = el.target.attributes;
		if (el.target.value === 'Start') {
			el.target.value = 'Pause';
			console.log('Starting simulator!');
			sim.start();
		} else {
			el.target.value = 'Start';
			console.log('Stopping simulator!');
			sim.stop();
		}
	});

	$("#step").click((el) => {
		if (!updated) {//initial update
			sim.updateByRules(true);
			updated = true;
		}
		sim.move();
	});
});
