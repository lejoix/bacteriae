class BacteriaeSimulator {
    constructor(lakenumber) {
        this.starting = true;
        this.maxiteration = 100000;
        this.iteration = 0;
        this.updateInterval = 500;//(bacteriacount * 4 < 700) ? 700 : bacteriacount * 4;
        // this.updateInterval = (bacteriacount * 4 >100 700) ? 700 : bacteriacount * 4;
        this.bacteriaCount = parseInt($('#bacteria').val()) || 10;
        this.size = Math.floor(this.bacteriaCount / 4);
        this.size = (this.size < 10) ? 10 : this.size;
        this.size = (this.size > 100) ? 100 : this.size;
        this.scale = $(window).width() / (this.bacteriaCount / 1.83);
        this.scale = (this.scale > 50) ? 50 : this.scale;
        this.scale = (this.scale < 8) ? 8 : this.scale;
        this.foodCount = parseInt($('#food').val()) || this.bacteriaCount * 10;
        this.foodFactor = parseInt($('#foodfactor').val()) || 1;
        this.foodEnergy = parseInt($('#foodnrg').val()) || 30; //energy value of food
        this.initialbacteriaEnergy = 40;
        this.maxBacteriaEnergy = 500; //max bacteria energy
        this.splitBacteriaEnergy = parseInt($('#split').val()) || 200; //energy for splitting
        this.strongness = 1;
        this.energyLoss = 1;
        this.hibernateEnergy =  parseInt($('#hibernate').val()) || 20;
        this.hibernateRounds = 10;
        this.mutation = parseInt($('#mut').val()) || 0.05;
        this.mutationAmount = parseInt($('#mutamnt').val()) || 0.1;
        this.children = 0;
        this.layfood = 0;
        this.lake = new Lake(this, lakenumber);
        this.oldestBacteria = {age:null};
        this.newestBacteria = {};
        this.stopFlag = false;
        this.bacteriastat = {
            normal: 0,
            lvl1: 0,
            lvl2: 0,
            lvl3: 0,
            lvl4: 0,
            lvl5: 0,
            lvl6: 0,
            lvl7: 0,
            lvl8: 0,
            lvl9: 0,
            lvl10: 0
        };

        this.foodSeasons = [{ //0 - spring, 1 - summer, 2 - autumn, 3 - winter
            name: 'spring',
            iteration: 100,
            foodperiter: 4 * this.foodFactor / 2,
            trigger: 7 / this.foodFactor
        }, {
            name: 'summer',
            iteration: 90,
            foodperiter: 2 * this.foodFactor / 2,
            trigger: 3 / this.foodFactor
        }, {
            name: 'autumn',
            iteration: 40,
            foodperiter: 2 * this.foodFactor / 2,
            trigger: 4 / this.foodFactor
        }, {
            name: 'winter',
            iteration: 90,
            foodperiter: 1 * this.foodFactor / 2,
            trigger: 7 / this.foodFactor
        }]; //number of iterations for a season and number of food per iteration
        this.seasonIteration = 0;
        this.currentSeason = 0; //default spring
        this.deadcount = 0;
        this.bacterias = []; //all bacterias
        this.foods = []; //all foods
        this.sleep = 0; //optimization
        this.updating = false; //optimization
        this.allbacterias = 0;

        //todo simulari = lacuri si se deschide poarta intre lacuri, indivizii trec dintr-un lac in altul
        this.createGrid();
        var [r, c] = [this.size, this.size];
        this.field = Array(r).fill().map(() => Array(c).fill({}));

        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                this.field[row][col] = new Object({
                    bacterias: [],
                    foods: []
                });
            }
        }

        //create bacterias
        for (let i = 0; i < this.bacteriaCount; i++) {
            this.createBacteria();
        }

        //create food
        this.createFood(this.foodCount);
        // console.log(this.field);
        this.updateStat();
        this.starting = false;
        return this;
    }

    createBacteria(motherBacteria = {}) {
        var row = getRandomInt(this.size);
        var col = getRandomInt(this.size);
        var bact = new Bacteria(this, row, col, ++this.allbacterias, this.initialbacteriaEnergy, motherBacteria, this.lake);

        this.bacterias.push(bact);
        this.field[row][col].bacterias.push(bact);

        return bact;
    }

    addBacteria() {

    }

    removeBacteria() {

    }

    bacteriaSwitchLakes(bacteria) {

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
        // for (let i = 0; i <= this.size; i++) {
        // 	let scale = this.scale / 5;
        // 	// if (i == 0 || i == this.size) {
        // 	// 	scale = this.scale * 6;
        // 	// }
        // 	if (i == 0 || i == this.size) {
        // 		scale = this.scale * 2;
        //
        // 	}
        //
        // 	this.canvas.add(makeLine(i * this.scale + this.lake.lakeY, 0 + this.lake.lakeX,
        // 		i * this.scale + this.lake.lakeY, this.size * this.scale + this.lake.lakeX, scale));
        // 	this.canvas.add(makeLine(0 + this.lake.lakeY, i * this.scale + this.lake.lakeX,
        // 		this.size * this.scale + this.lake.lakeY, i * this.scale + this.lake.lakeX, scale));
        // }
    }

    proceed(step) {
        let time = Date.now();
        // console.info('Start iteration!');
        if (step) {
            this.step = false;
            this.stopFlag = false;
        }

        if (!this.step) {
            this.move(time, step);
        }
        // console.info('End Iteration! Duration:', Date.now() - time);
    }

    start() {
        //start by updating initial state
        this.step = false;
        this.stopFlag = false;
        this.updateByRules(true);
        this.refresh(this.proceed.bind(this));
        // this.process = setInterval(this.proceed.bind(this), this.updateInterval);
    }

    stop() {
        // clearTimeout(this.process);
        this.stopFlag = true;
    }

    move(time, step) {
        this.iteration++;
        this.updating = true;

        if (this.iteration >= this.maxiteration) {
            window.alert('Max iteration reached! Stopping simulation!');
            $("#restart").trigger('click');
        }
        if (this.bacterias <= 0) {
            window.alert('All bacterias are dead! Simulation over!');
            // console.log('All bacterias are dead! Simulation over!');
            $("#restart").trigger('click');
        }

        //set food rotate seasons in years
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
            this.createFood(this.foodSeasons[this.currentSeason].foodperiter * this.size / 6);
        }

        this.updateStat();

        //calculate movement
        let moveit = 0;
        _.forEach(this.bacterias, (bact) => {
            //if hibernate don't mive, but still loose energy
            if (bact.hibernate > 0) {
                bact.hibernate -= 1;
                bact.energy -= this.energyLoss / 10;
            } else {
                bact.move();
            }
        });

        //after movement update simulation by rules
        // console.info('End moving! Duration:', Date.now() - time);
        // this.refresh();
        this.updateByRules(time);
        this.refresh(this.proceed.bind(this), step);
        if (this.oldestBacteria.age != null) {
            this.oldestBacteria.rect.css({'border': '4px solid darkblue'});
        }
    }

    refresh(callback = this.proceed.bind(this), step) {
        if (this.stopFlag) return;
        this.complete = this.bacterias.length;
        for (let i = 0; i < this.bacterias.length; i++) {
            let bact = this.bacterias[i];

            //update if low energy
            if (bact.energy < this.hibernateEnergy) {
                bact.rect.css({
                    'opacity': (0.3 + (bact.energy / 100)),
                    // 'background-color': 'red',
                    'border': '2px solid red',
                    width: this.scale,
                    height: this.scale
                });

                if (bact.energy < 3) {
                    bact.rect.css({
                        'opacity': 1,
                        'background-color': 'red',
                    });
                }
            } else { //update of normal
                if (bact.eyes && bact.eyes.level > 0) {
                    bact.rect.css({'background-color': eyeColors[bact.eyes.level]});
                } else {
                    bact.rect.css({'background-color': bact.fill});
                }
                bact.rect.css({'opacity': (0.1 + (bact.energy / 100))});
            }

            //update hibernation state
            if (bact.energy == this.hibernateEnergy) {
                bact.hibernate = this.hibernateRounds;
                bact.rect.css({
                    'border': '4px solid red',
                    'opacity': '0.2'
                });
            }

            bact.rect.prop('title', `Index: ${bact.index},
Age: ${this.iteration - bact.age},
Eyes: ${bact.eyes && bact.eyes.level || 0},
Split: ${bact.splitBacteriaEnergy},
Strongness: ${bact.strongness},
tn:${bact.tn},
tne:${bact.tne},
te:${bact.te},
tse:${bact.tse},
ts:${bact.ts},
tsw:${bact.tsw},
tw:${bact.tw},
tnw:${bact.tnw}`);

            this.update(bact.rect,
                (bact.row) * this.scale,
                (bact.col) * this.scale,
                bact.lake.lakeX,
                bact.lake.lakeY, callback, step);
        }
    }

    //update by rules
    // - eat food, increase energy
    // - remove bacteria if dead,
    // - loose energy based on rules
    // - give birth to new bacteria
    updateByRules(time, noEnergyLoss = false) {
        //update simulation based on rules
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (!this.field[row][col].bacterias.length) {
                    continue;
                }
                //strongest eat first!
                //lowest energy eat then
                //more evolved eat if equal
                this.field[row][col].bacterias = this.field[row][col].bacterias.sort(function(a, b) {
                    return b.strongness - a.strongness || a["energy"] - b["energy"] || (a.eyes && b.eyes && (a["eyes"].level - b["eyes"].level));
                });

                _.forEach(this.field[row][col].bacterias, (bacteria) => {
                    //quit if problems, update hibernation color
                    if (bacteria.hibernate > 0 || bacteria.dead) {
                        return;
                    } else {
                        bacteria.rect.css({'border': bacteria.newBorn * 2 + 'px solid black'});
                        if (bacteria.newBorn > 0) bacteria.newBorn--;
                    }

                    //first eat food if available, order based on rules (strongest, then eye level, then weakest
                    let foods = this.field[row][col].foods;
                    if (foods.length > 0) {
                        let food = foods.pop();
                        // food.draw();
                        bacteria.energy += food.energy;

                        //bounce when eating food
                        bacteria.rect.css({
                            'background-color': 'brown',
                        });
                        bacteria.rect.animate({
                                width: this.scale * 1.4,
                                height: this.scale * 1.4
                            },
                            this.updateInterval / 8,
                            () => {
                                bacteria.rect.animate({
                                        width: this.scale,
                                        height: this.scale
                                    },
                                    this.updateInterval / 8);
                            });

                        food.rect.fadeOut(this.updateInterval, () => {
                            food.rect.remove()
                            // food = null;
                        }); //remove food and redraw
                        this.foods =
                            _.filter(this.foods, (f) => {
                                return f.index !== food.index;
                            }) || [];
                    }

                    //decrease energy
                    if (!noEnergyLoss) {
                        //loose less energy if low energy
                        let split = (bacteria.energy < this.hibernateEnergy) ? 5 : 1;
                        //if no movement less energy loss
                        let energyloss = this.energyLoss / (bacteria.noMove ? 2 : 1);
                        bacteria.energy -= energyloss * this.strongness / split;

                        //decrease extra energy because of eyes and level of eyes 20%
                        if (bacteria.eyes && bacteria.eyes.level) {
                            bacteria.energy -= (energyloss * 0.2 * bacteria.eyes.level) / split;
                        }
                    }

                    //create new bacteria if energy level reached
                    if (bacteria.energy > bacteria.splitBacteriaEnergy) {
                        this.newestBacteria = this.createBacteria(bacteria);
                        this.children++;
                        bacteria.energy = Math.floor(bacteria.energy - this.initialbacteriaEnergy);
                    }

                    //set oldest bacteria
                    if (this.oldestBacteria.age == null || ((this.iteration - bacteria.age) > (this.iteration - this.oldestBacteria.age))) {
                        this.oldestBacteria = bacteria;
                    }

                    //bacteria dead delete bacteria from simulation field also close simulation if last bacteria
                    if (bacteria.energy <= 0) {
                        if (this.field[row][col].bacterias.length == 1) {
                            this.field[row][col].bacterias = [];
                        } else {
                            this.field[row][col].bacterias =
                                _.filter(this.field[row][col].bacterias, (bact) => {
                                    return bact.index !== bacteria.index;
                                }) || [];
                        }

                        this.bacterias =
                            _.filter(this.bacterias, (bact) => {
                                return bact.index !== bacteria.index;
                            }) || [];

                        if (!bacteria.dead) {
                            bacteria.dead = true;
                            if (bacteria.eyes != null) {
                                --this.bacteriastat['lvl' + bacteria.eyes.level];
                            } else {
                                --this.bacteriastat.normal;
                            }
                        }
                        bacteria.rect.css('background-color', 'black');
                        bacteria.rect.animate({'opacity': 0}, this.updateInterval * 8, () => {
                            bacteria.rect.remove();
                            bacteria = null;

                            //last bacteria dead!
                            if (!this.bacterias.length) {
                                this.move(Date.now());
                            }
                        });

                        this.deadcount++;
                    }
                });
            }
        }

        this.updateStat();
    }

    updateStat() {
        $('#bacteriacount').text('Bacteria count: ' + this.bacterias.length.toString());
        $('#foodcount').text('Food count: 		' + this.foods.length.toString());
        $('#childrencount').text('Children count: ' + (this.children).toString());
        $('#iterationcount').text('Iteration count: ' + (this.iteration).toString());
        $('#deadcount').text('Dead bacteria count: ' + (this.deadcount).toString());
        $('#season').text(`Food season: ${this.foodSeasons[this.currentSeason].name.toUpperCase()}!
            Iterationtrigger: ${this.foodSeasons[this.currentSeason].trigger}!
            Food: ${this.foodSeasons[this.currentSeason].foodperiter * this.size / 2}!`);
        _.forEach(this.bacteriastat, (stat, key) => {
            $('.'+key).text(key + ' bacteria: ' + (stat.toString()));

        })
        $('#canvas_div').css({
            width: this.size * this.scale,
            height: this.size * this.scale,
            // border: '2px solid lightgrey',
        });

        $('#canvas_wrapper').css({
            width: this.size * this.scale,
            height: this.size * this.scale,
            // border: '2px solid lightgrey',
        });

        $('#oldestbacteria').text(
            `Oldest bacteria params:
            Age: ${this.iteration - this.oldestBacteria.age}
            tn:${this.oldestBacteria.tn}
            tne:${this.oldestBacteria.tne}
            te:${this.oldestBacteria.te}
            tse:${this.oldestBacteria.tse}
            ts:${this.oldestBacteria.ts}
            tsw:${this.oldestBacteria.tsw}
            tw:${this.oldestBacteria.tw}
            tnw:${this.oldestBacteria.tnw}`
        );

        $('#newestbacteria').text(
            `Newest bacteria params:
            Age: ${this.iteration - this.newestBacteria.age}
            tn:${this.newestBacteria.tn}
            tne:${this.newestBacteria.tne}
            te:${this.newestBacteria.te}
            tse:${this.newestBacteria.tse}
            ts:${this.newestBacteria.ts}
            tsw:${this.newestBacteria.tsw}
            tw:${this.newestBacteria.tw}
            tnw:${this.newestBacteria.tnw}`
        );
    }

    update(object, row, col, lakeX, lakeY, callback = this.proceed.bind(this), step = false, animate = true) {
        let finishCallback = () => {
            --this.complete;

            if (this.complete == 0) {
                // console.log('COMPLEEEETEEEEEE!');
                if (step) this.step = true;
                step = false;
                callback(false);
            }
        };

        if (animate) {
            object.animate({
                    'left': col + lakeY,
                    'top': row + lakeX,
                },
                this.updateInterval,
                finishCallback);
        } else {
            object.css({
                top: row + lakeY,
                left: col + lakeX
            });

            finishCallback();
        }
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


function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}