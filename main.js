class Simulator {
    constructor(bacteriacount, foodcount, foodfactor, nrOfLakes = 2) {
        this.sim = [];
        this.nrOfLakes = nrOfLakes;
        for (let i = 0; i < this.nrOfLakes; i++) {
            this.sim.push(new BacteriaeSimulator(bacteriacount, foodcount, foodfactor, i));
        }
    }

    start() {
        for (let i = 0; i < this.nrOfLakes; i++) {
            if (this.sim[i]) {
                this.sim[i].start();
            }
        }
    }

    move() {
        for (let i = 0; i < this.nrOfLakes; i++) {
            if (this.sim[i].move()) {
                this.sim[i].move();
            }
        }
    }

    stop(restart = false) {
        for (let i = 0; i < this.nrOfLakes; i++) {
            if (this.sim[i]) {
                this.sim[i].stop();
                if (restart) {
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
        for (let i = 0; i < this.nrOfLakes; i++) {
            this.sim[i].updateByRules();
        }
    }

    // checkRestriction(bacteria, move) {
    //     var migrationAllowed = true;
    //
    //     if (!migrationAllowed) {
    //         return true;
    //     }
    //
    //     //calculate neighbor lakes
    //     let neighbLake = [];
    //
    //     if (bacteria.lake - 1 < 0) { //first
    //         neighbLake[0] = this.sim.length - 2;
    //         neighbLake[1] = bacteria.lake + 1;
    //     } else if (bacteria.lake - 2 < 0) { //second
    //         neighbLake[0] = this.sim.length - 1;
    //         neighbLake[1] = bacteria.lake - 1;
    //     } else { //normal case
    //
    //     }
    //
    //     neighbLake[0] = ( ? (bacteria.lake - 1): this.sim.length - 1;
    //     neighbLake[1] = ((bacteria.lake - 2 > 0) ? (bacteria.lake - 2): this.sim.length - 2;
    //     for (let i = 0; i < this.nrOfLakes; i++) {
    //         if (bacteria.row+move[0] >= this.sim[i].size || bacteria.col+move[1] >= this.sim[i].size ||
    //             bacteria.row+move[0] < 0 || this.bacteria+move[1] < 0) {
    //             this.curdir = moveDir.newdir;
    //             this.currentdir = moveDirections[this.curdir]; //update movepossibilities relatively
    //             return [0,0];
    //         }
    //
    //         // console.log('BEFORE!!! curdir: ', this.curdir, 'selecteddir: ', moveDir, 'position: ', move, 'currentdir: ', this.currentdir);
    //         this.curdir = moveDir.newdir;
    //         this.currentdir = moveDirections[this.curdir]; //update movepossibilities relatively
    //         // console.log('AFTER!!! curdir: ', this.curdir,  'selecteddir: ', moveDir, 'position: ', move, 'currentdir: ', this.currentdir);
    //         return move;
    //     }
    // }
}

$(document).ready(function(){
    var bacteriacount = parseInt($('#bacteria').val());
    var foodcount = $('#food').val();
    if (!foodcount) {
        $('#food').val(bacteriacount);
        foodcount = bacteriacount;
    }
    $('#bacteriacount').text($('#bacteriacount').text() + bacteriacount);
    $('#foodcount').text($('#foodcount').text() + foodcount);
    var initialized = true;
    var updated = false;
    let sim = new Simulator(bacteriacount, foodcount, parseInt($('#foodfactor').val()) || 1, $('#lakecount').val() || 1);
    $('#size').text('Size: ' + sim.sim[0].size.toString());

    $('#bacteria').change((el) => {
        bacteriacount = parseInt($('#bacteria').val());
        $('#food').val(bacteriacount);
        foodcount = bacteriacount;
        $('#bacteriacount').text('Bacteria count: ' + bacteriacount);
    });

    $('#configure').click(() => {
        if($('div.inputs').css('display') === 'none') {
            $('div.inputs').css('display', 'block');
        } else {
            $('div.inputs').css('display', 'none');
        }
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
        $('#canvas_div').remove();
        if ($("#restart").val() === 'Pause') {
            $("#restart").trigger('click');
        }
        let canvas = $('<div id="canvas_div" style="top:200px;position:relative;"></div>');
        $('body').append(canvas);
        sim = new Simulator(bacteriacount, foodcount, parseInt($('#foodfactor').val() || 1), $('#lakecount').val() || 1);
        $('#size').text('Size: ' + sim.sim[0].size.toString());
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
