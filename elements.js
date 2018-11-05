class Element {
    constructor(simulator, row, col, index, energy) {
        this.simulator = simulator;
        this.canvas = this.simulator.canvas;
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
        if (motherBacteria.tn) {
            let mutDir = this.getDirection(0, 0.14, 0.28, 0.43, 0.57, 0.72, 0.86, 1).newdir;
            let mutSign = (Math.random() < 0.5 ? -1 : 1) * this.simulator.mutation;
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

        this.curdir = 0;
        this.lake = lake;
        this.currentdir = moveDirections[this.curdir]; //set default direction to north
        this.hibernate = 0;
        this.dead = false;
        this.age = this.simulator.iteration;
        this.fill = '#' + (this.lake.lakeNumber)*2 + (this.simulator.lake.lakeNumber*4) + '5';

        console.log(`Giving birth to a new bacteria! ${row}, ${col}`);

        this.draw();

        return this;
    }

    draw(redraw = true) {
        if (redraw) {
            this.canvas.remove(this.group);
        }

        this.rect = new fabric.Rect({
            top: this.row*this.simulator.scale + this.lake.lakeX,
            left: this.col*this.simulator.scale + this.lake.lakeY,
            width: this.simulator.scale,
            height: this.simulator.scale,
            opacity: 0.2 + this.energy / 100,
            fill: this.fill
        });

        this.text = new fabric.Text(this.age.toString(), {
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            fill: 'black',
            fontSize: this.simulator.scale/1.5,
            fontWeight: 'bold',
            left: this.rect.left + this.simulator.scale/2 + 0.5,
            top: this.rect.top + this.simulator.scale/2 + 0.5
        });

        this.group = new fabric.Group([this.rect, this.text]);

        this.canvas.add(this.group);

    }

    move() { //this part is just for drawing and updating the field, rules are applied in the simulation
        var [newrow, newcol] = this.randomizeDirection();
        this.text.setText((this.simulator.iteration - this.age).toString());

        if (newrow == 0 && newcol == 0) {
            // console.log('No movement!');
            return;
        }

        this.simulator.field[this.row][this.col].bacterias =
            _.filter(this.simulator.field[this.row][this.col].bacterias, (bact) => {
                return bact.index !== this.index;
            });

        this.row += newrow;
        this.col += newcol;

        this.simulator.field[this.row][this.col].bacterias.push(this);

        if (this.hibernate) {
            this.rect.set('stroke', 'red');
            this.rect.set('strokeWidth', this.scale / 5);
            this.rect.set('fill', 'red');
        }

        update(this.canvas, this.group,
            (this.row) * this.simulator.scale,
            (this.col) * this.simulator.scale,
            this.lake.lakeX,
            this.lake.lakeY);
    }

    getDirection(	tn = this.tn, tne = this.tne, te = this.te, tse = this.tse,
                     ts = this.ts, tsw = this.tsw, tw = this.tw, tnw = this.tnw) {
        let rand = Math.random();
        let newdir = 0;

        if (rand <= tn) { //direction up
            newdir = 0;
        } else if (rand > (tn) && rand <= (tn+tne)) { //direction northeast
            newdir = 1;
        } else if (rand > (tn+tne) && rand <= (tn+tne+te)) { //direction east
            newdir = 2;
        } else if (rand > (tn+tne+te) && rand <= (tn+tne+te+tse)) { //direction south east
            newdir = 3;
        } else if (rand > (tn+tne+te+tse) && rand <= (tn+tne+te+tse+ts)) { //direction south
            newdir = 4;
        } else if (rand > (tn+tne+te+tse+ts) && rand <= (tn+tne+te+tse+ts+tsw)) { //direction southwest
            newdir = 5;
        } else if (rand > (tn+tne+te+tse+ts+tsw) && rand <= (tn+tne+te+tse+ts+tsw+tw)) { //direction west
            newdir = 6;
        } else if (rand > (tn+tne+te+tse+ts+tsw+tw)) { //northwest
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
        if (redraw) {
            this.canvas.remove(this.rect);
        }

        this.rect = new fabric.Rect({
            top: this.row*this.simulator.scale + this.lake.lakeX,
            left: this.col*this.simulator.scale + this.lake.lakeY,
            width: this.simulator.scale,
            height: this.simulator.scale,
            opacity: 0.4,
            fill: '#801'
        });

        this.canvas.add(this.rect);
    }
}

class Lake {
    constructor(simulator, lakenumber) {
        this.lakeNumber = lakenumber;
        this.simulator = simulator;
        this.lakeRow = Math.floor(this.lakeNumber / 2);
        this.lakeX =  this.lakeRow * this.simulator.scale * this.simulator.size;
        this.lakeCol = Math.floor(this.lakeNumber % 2);
        this.lakeY = this.lakeCol  * this.simulator.scale * this.simulator.size;

    }
}
