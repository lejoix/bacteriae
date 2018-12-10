class Element {
    constructor(simulator, row, col, index, energy) {
        this.simulator = simulator;
        this.energy = energy;
        this.row = row;
        this.col = col;
        this.index = index;

        return this;
    }
}

class Bacteria extends Element {
    constructor(simulator, row, col, index, energy, motherBacteria, lake) {
        super(simulator, row, col, index, energy);

        //TODO: generate childs
        //generate random probabilities (sum needs to be 1)
        let numbers = [];

        for (let i = 0; i < 8; i++) {
            numbers.push(Math.random());
        }

        numbers.sort();
        var sum = numbers.reduce((a, b) => a + b, 0);
        for (let i = 0; i < 8; i++) {
            numbers[i] = numbers[i] / sum;
        }

        // numbers = [0, 0.142857143, 0.142857143, 0.142857143, 0.142857143, 0.142857143, 0.142857143, 1];

        //todo imbatranire = nu intotdeauna reuseste miscare, nu consuma toata energia
        //todo gamma = mutatia care va influenta toti parametri:
        // - energia de divizare
        // - delta de divizare
        // - energie de hibernare si cate iteratii)
        // - cate scade cand hiberneaza
        // - energie maxima
        //todo energia de diviziune sa fie per individ (mutare nivel diviziune)
        //
        //todo colors for different bacterias preloaded
        //todo random seed

        //initialize direction probabilities
        this.tn = motherBacteria.tn || numbers[0];
        this.tne = motherBacteria.tne || numbers[1];
        this.te = motherBacteria.te || numbers[2];
        this.tse = motherBacteria.tse || numbers[3];
        this.ts = motherBacteria.ts || numbers[4];
        this.tsw = motherBacteria.tsw || numbers[5];
        this.tw = motherBacteria.tw || numbers[6];
        this.tnw = motherBacteria.tnw || numbers[7];

        //mutate if needed
        let mutSign = (Math.random() < 0.5 ? -1 : 1) * this.simulator.mutation;
        if (motherBacteria.tn != null) {
            this.row = motherBacteria.row;
            this.col = motherBacteria.col;
            let mutDir = this.getDirection(0, 0.14, 0.14, 0.14, 0.14, 0.14, 0.14, 1).newdir;
            let mutAmnt = 0;

            switch (mutDir) {
                case 0:
                    mutAmnt = motherBacteria.tn * mutSign;
                    this.tn = this.tn + mutAmnt;
                    break;
                case 1:
                    mutAmnt = motherBacteria.tne * mutSign;
                    this.tne = motherBacteria.tne + mutAmnt;
                    break;
                case 2:
                    mutAmnt = motherBacteria.te * mutSign;
                    this.te = motherBacteria.te + mutAmnt;
                    break;
                case 3:
                    mutAmnt = motherBacteria.tse * mutSign;
                    this.tse = motherBacteria.tse + mutAmnt;
                    break;
                case 4:
                    mutAmnt = motherBacteria.ts * mutSign;
                    this.ts = motherBacteria.ts + mutAmnt;
                    break;
                case 5:
                    mutAmnt = motherBacteria.tsw * mutSign;
                    this.tsw = motherBacteria.tsw + mutAmnt;
                    break;
                case 6:
                    mutAmnt = motherBacteria.tw * mutSign;
                    this.tw = motherBacteria.tw + mutAmnt;
                    break;
                case 7:
                    mutAmnt = motherBacteria.tnw * mutSign;
                    this.tnw = motherBacteria.tnw + mutAmnt;
                    break;
            }

            mutAmnt = 1 / (1 + mutAmnt);

            this.tn *= mutAmnt;
            this.tne *= mutAmnt;
            this.te *= mutAmnt;
            this.tse *= mutAmnt;
            this.ts *= mutAmnt;
            this.tsw *= mutAmnt;
            this.tw *= mutAmnt;
            this.tnw *= mutAmnt;
        }

        //mutation of splitenergy
        this.splitBacteriaEnergy = this.mutation(motherBacteria.splitBacteriaEnergy || this.simulator.splitBacteriaEnergy, 10);
        this.strongness = this.mutation(motherBacteria.strongness || this.simulator.strongness, 10);
        this.noMove = false;

        // let eyeMut = 0.01;
        let eyeMut = (Math.random());
        let prevLevel = (motherBacteria.eyes && motherBacteria.eyes.level) ? motherBacteria.eyes.level : 1;
        //probability for eye level can lower also
        //1 - sees one square in all directions, 2 - sees two squares in all directions etc.
        //if mother has eyes children have eyes also
        this.eyes = (eyeMut < this.simulator.mutation * 8 || motherBacteria.eyes) ? {
            level: (Math.random() < this.simulator.mutation * 4) ? (++prevLevel): (prevLevel),
        } : null; //has some probability to develop eyes

        if (this.eyes && this.eyes.level == 0) {
            this.eyes = null;
        }
        this.curdir = 0;
        this.lake = lake;
        this.currentdir = moveDirections[this.curdir]; //set default direction to north
        this.hibernate = 0;
        this.dead = false;
        this.age = this.simulator.iteration;
        this.fill = this.eyes ? eyeColors[this.eyes.level] : '#' + colors[this.lake.lakeNumber];

        // console.log(`Giving birth to a new bacteria! ${row}, ${col}`);

        this.draw();

        return this;
    }

    //if mutation then return percent amount to mutate otherwise false
    mutation(value, factor = 1) {
        let mutSign = (Math.random() < 0.5 ? -1 : 1) * this.simulator.mutationAmount;
        let random = Math.random();
        return random < this.simulator.mutation * factor ? value + mutSign * value : value;
    }

    draw(redraw = true) {
        this.rect = $('<div>&nbsp</div>').css({
            position: 'absolute',
            top: this.row*this.simulator.scale + this.lake.lakeX,
            left: this.col*this.simulator.scale + this.lake.lakeY,
            width: this.simulator.scale + 'px',
            height: this.simulator.scale + 'px',
            'background-color': this.fill,
            opacity: 0.2 + this.energy / 100,
            'border-radius': this.simulator.scale + 'px',
        });
        this.newBorn = 3;
        this.rect.css({'border': this.newBorn*2+'px solid black'});

        $('#canvas_div').append(this.rect);
        //add bacteria to staticstics
        let stat = $('<div></div>').css({
            display: 'inline-block',
            position: 'relative',
            width: this.simulator.scale / 2 + 'px',
            height: this.simulator.scale / 2+ 'px',
            'background-color': this.fill,
            opacity: 1,
            'border-radius': this.simulator.scale + 'px',
            padding: '5px'
        });

        let id = '';
        let str = '';
        if (this.eyes != null) {
            // this.eyes.level = 3;
            str = 'lvl'+this.eyes.level;
            id = '#'+str;
            stat[0].id = id;
            $(id).replaceWith(stat);
        } else {
            str = 'normal';
            id = '#' + str;
            stat[0].id = id;
            $(id).replaceWith(stat);
        }
        ++this.simulator.bacteriastat[str];
    }

    move() { //this part is just for drawing and updating the field, rules are applied in the simulation
        this.noMove = false;
        var [newrow, newcol] = this.randomizeDirection();
        // this.text.setText((this.simulator.iteration - this.age).toString());

        if (newrow == 0 && newcol == 0) {
            // console.log('No movement!');
            this.noMove = true;
            return;
        }

        this.simulator.field[this.row][this.col].bacterias =
            _.filter(this.simulator.field[this.row][this.col].bacterias, (bact) => {
                return bact.index !== this.index;
            });

        this.row += newrow;
        this.col += newcol;

        this.simulator.field[this.row][this.col].bacterias.push(this);
    }

    getDirection(	tn = this.tn, tne = this.tne, te = this.te, tse = this.tse,
                     ts = this.ts, tsw = this.tsw, tw = this.tw, tnw = this.tnw) {
        let rand = Math.random();
        let newdir = null;
        let nearBacterias = [];
        let foodDirs = [];
        let nearFoods = [];
        let alreadyAte = false;

        if (this.eyes != null) {
            // console.log('Has eyes!');
            // calculate distances to other bacteria and food
            loop1:
            for(let i = -this.eyes.level; i <= this.eyes.level; i++) {
                for(let j = -this.eyes.level; j <= this.eyes.level; j++) {
                    let row = this.row + i;
                    let col = this.col + j;
                    if (!(i == 0 && j ==0) && this.simulator.field[row] && this.simulator.field[row][col] && this.simulator.field[row][col].bacterias.length > 0) {
                        _.forEach(this.currentdir, (item, index) => {
                            if ((item[0] == i) && (item[1] == j)) {
                                nearBacterias.push(parseInt(index)); //save direction
                            }
                        });
                    }

                    if (!alreadyAte && this.simulator.field[row] && this.simulator.field[row][col] && this.simulator.field[row][col].foods.length > 0) {
                        //change direction
                        for (let x = 0; x < this.currentdir.length; x++) {
                            let item=this.currentdir[x];
                            let approxI = (i / Math.abs(i)) ? i / Math.abs(i) : 0;
                            let approxJ = (j / Math.abs(j)) ? j / Math.abs(j) : 0;
                            //if food between two steps move closer to some direction
                            if ((item[0] == approxI) && (item[1] == approxJ)) {
                                newdir = parseInt(x);
                                nearFoods.push(newdir);
                                //if food on next step move to that direction
                                if (Math.abs(i) <= 1 && Math.abs(j) <= 1) {
                                    foodDirs.push(newdir);
                                }
                            }
                        }
                    }
                }
            }
            //let vision = calcVisibleObjects
            //temporarily modify probability values based on current eye properties
            //modifyProbabilities(vision, this.eyes) //return tn, tne, te etc., spread array
        }

        if (newdir == null) {
            if (rand <= tn) { //direction up
                newdir = 0;
            } else if (rand > (tn) && rand <= (tn + tne)) { //direction northeast
                newdir = 1;
            } else if (rand > (tn + tne) && rand <= (tn + tne + te)) { //direction east
                newdir = 2;
            } else if (rand > (tn + tne + te) && rand <= (tn + tne + te + tse)) { //direction south east
                newdir = 3;
            } else if (rand > (tn + tne + te + tse) && rand <= (tn + tne + te + tse + ts)) { //direction south
                newdir = 4;
            } else if (rand > (tn + tne + te + tse + ts) && rand <= (tn + tne + te + tse + ts + tsw)) { //direction southwest
                newdir = 5;
            } else if (rand > (tn + tne + te + tse + ts + tsw) && rand <= (tn + tne + te + tse + ts + tsw + tw)) { //direction west
                newdir = 6;
            } else if (rand > (tn + tne + te + tse + ts + tsw + tw)) { //northwest
                newdir = 7;
            }

            if ((this.curdir + newdir) <= 7) {
                return {
                    move: this.curdir + newdir,
                    newdir: newdir
                }
            } else {
                return {
                    move: Math.abs(8 - (this.curdir + newdir)),
                    newdir: newdir
                }
            }
        } else {
            //we need to randomize the directions we go otherwise all go to same dir
            if (foodDirs.length > 0) {
                newdir = foodDirs[getRandomInt(foodDirs.length)]
            } else if (nearFoods.length > 0) {
                newdir = nearFoods[getRandomInt(nearFoods.length)]
            } else {
                throw 'Calculation error! No directions calculated!';
            }
            return {
                move: newdir,
                newdir: newdir
            };
        }
    }

    randomizeDirection() {
        let moveDir = this.getDirection();
        let move = this.currentdir[moveDir.move];

        //check if move is in bounds
        if (this.row+move[0] >= this.simulator.size || this.col+move[1] >= this.simulator.size ||
            this.row+move[0] < 0 || this.col+move[1] < 0) {
            this.curdir = moveDir.newdir;
            this.currentdir = moveDirections[this.curdir]; //update movepossibilities relatively
            return [0,0];
        }

        // console.log('BEFORE!!! curdir: ', this.curdir, 'selecteddir: ', moveDir, 'position: ', move, 'currentdir: ', this.currentdir);
        this.curdir = moveDir.newdir;
        this.currentdir = moveDirections[this.curdir]; //update movepossibilities relatively
        // console.log('AFTER!!! curdir: ', this.curdir,  'selecteddir: ', moveDir, 'position: ', move, 'currentdir: ', this.currentdir);
        return move;
    }
}

class Food extends Element {
    constructor(simulator, row, col, index, energy, lake) {
        super(simulator, row, col, index, energy);

        // console.log(`Creating new food! ${row}, ${col}`);
        this.lake = lake;
        this.draw();

        return this;
    }

    draw(redraw = true) {
        this.rect = $('<div>&nbsp</div>').css({
            position: 'absolute',
            top: this.row*this.simulator.scale + this.lake.lakeX,
            left: this.col*this.simulator.scale + this.lake.lakeY,
            width: this.simulator.scale + 'px',
            height: this.simulator.scale + 'px',
            'background-color': foodColor,
            'opacity': 0.4,
            'border-radius': '5px',
            // 'background-image': 'url(bact.png)',
            // 'background-size': '20px'
        });
        $('#canvas_div').append(this.rect);
    }
}

class Lake {
    constructor(simulator, lakenumber) {
        this.lakeNumber = lakenumber;
        this.simulator = simulator;
        this.lakeRowMin = Math.floor(this.lakeNumber / 2);
        this.lakeRowMax = Math.floor(this.lakeNumber / 2) * this.simulator.size;
        this.lakeX =  this.lakeRowMin * this.simulator.scale * this.simulator.size;
        this.lakeColMin = Math.floor(this.lakeNumber % 2);
        this.lakeColMax = Math.floor(this.lakeNumber % 2) * this.simulator.size;
        this.lakeY = this.lakeColMin  * this.simulator.scale * this.simulator.size;

    }
}
