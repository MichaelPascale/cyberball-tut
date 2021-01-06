/**
* @file Initialization and main event loop. Include this file after all others.
* @author Michael Pascale
* @copyright Michael Pascale 2020
* @license MIT
*/

/*global DEV_MODE, globalBus, Fatal, Recorder, recorder, range, noise */
/*global toMilliseconds, pct2px, pickFromDist, relpx, positionConfederates */
/*global pickAnother, Participant, Confederate, Ball */
/*global participant, confederates, ball, allPlayers, currentPlayer */


var options;
var strings;
var canvas;
var ctx;
var tosses;
var prob;

const parameters = new URLSearchParams(window.location.search);
if (!(['condition', 'linkid'].every(x => parameters.has(x))))
    Fatal('Condition and ID not specified.');

const linkid = parameters.get('linkid');
const condition = parameters.get('condition');


/****************************************
 * Fetch configuration JSON, then call init().
 * */
try {
    $.when(
        $.getJSON('options.json').done(function (r) {
            options = r;
        }).fail(Fatal),
        $.getJSON('strings.json').done(function (r) {
            strings = r;
        }).fail(Fatal)
    ).then(init);

} catch (err) {
    Fatal(err);
}


/**
 * Initialize globals and set HTML text.
 */
function init() {
    self.recorder = new Recorder(linkid, options['data-server-url'], condition);
    prob = options['probabilities'][condition];

    $('#pre-task-title')[0].innerText = strings['pre-task-title'];
    // for (let p of strings['pre-task-messages'])
    //     $(`<p>${p}</p>`).appendTo('#pre-task-text');
    $('#pre-task-button-text')[0].innerText = strings['pre-task-button-text'];
    $('#connecting-text')[0].innerText = strings['connecting-text'];
    $('#probe-title')[0].innerText = strings['probe-title'];
    // $('#probe-text')[0].innerText = strings['probe-text'];
    // $('#probe-button-0-text')[0].innerText = strings['probe-button-0-text'];
    $('#end-title')[0].innerText = strings['end-title'];
    $('#end-text')[0].innerText = strings['end-text'];
    $('#survey-button-text')[0].innerText = strings['survey-button-text'];

    $('#pre-task-button')[0].addEventListener('mousedown', function () {
        $('#pre-task-page').hide();
        connecting();
    });

    if (DEV_MODE) {
        $('#pre-task-page').hide();
        connecting();
    }
}


/**
 * Animate the 'connecting' screen. End after a set time and call start().
 */
function connecting() {
    $('#loading-page').show();

    const maxT = toMilliseconds(options['max-connecting-time']);
    const minT = toMilliseconds(options['min-connecting-time']);
    const totaltime = DEV_MODE ? 250 : Math.random() * (maxT - minT) + minT;

    setTimeout(() => { $('#connecting-text')[0].innerText = 'Waiting for 2 more participants...'; }, 750);
    setTimeout(() => { $('#connecting-text')[0].innerText = 'Waiting for 1 more participants...'; }, 0.72 * totaltime);
    setTimeout(() => { $('#connecting-text')[0].innerText = 'Starting game.'; }, totaltime - 1000);

    setTimeout(function () {
        $('#loading-page').hide();
        start();
    }, totaltime);

    // setTimeout(function () {
    //     $('#loading-page').hide();
    //     start();
    //    }, DEV_MODE ? 250 : Math.random() * (maxT - minT) + minT);
}


/**
* Initialize Cyberball and kick off event loop.
*/
function start() {
    $('#canvas').show();
    canvas = $('#canvas')[0];
    ctx = canvas.getContext('2d');

    $('#instructions').show();

    // $('#p1bt')[0].addEventListener('mousedown', function () {
    //     recorder.record('playerbt', { bt: 'p1' });
    // });

    // $('#p3bt')[0].addEventListener('mousedown', function () {
    //     recorder.record('playerbt', { bt: 'p3' });
    // });


    /****************************************
     * Initialize Players
     * */
    self.participant = new Participant();
    self.allPlayers = [participant];

    const maxT = toMilliseconds(options['max-confederate-time']);
    const minT = toMilliseconds(options['min-confederate-time']);
    const timedist = options['confederate-time-dist'];

    function Counter(n, p, prob, sched, player, allPlayers) {
        this.n = n;
        this.p = p;
        this.np = n * p;
        this.nc = n - this.np;

        this.i = 0;

        this.prob = prob;
        this.sched = sched;
        this.player = player;
        this.allPlayers = allPlayers;

        this.throw = function (from) {
            if (this.i > this.sched.length)
                return pickAnother(from, this.allPlayers, this.prob);

            let ret;
            // Player
            if (this.sched[this.i] === 'P')
                ret = this.player;

            // Confederate
            else
                ret = this.allPlayers.slice(1).reduce((acc, x) => {
                    if (x.id !== from.id)
                        return x;
                    return acc;
                });

            this.i += 1;
            return ret;
        };
    }

    const counter = new Counter(140, options['p'][condition], prob, options['sched'][condition], self.participant, self.allPlayers);


    // TODO Name confederates randomly or by i +1
    self.confederates = new Array(options['confederates']);
    for (let i = 0; i < confederates.length; ++i) {
        confederates[i] =
            new Confederate(`Player ${i == 0 ? 1 : 3}`,
                function () {
                    setTimeout(

                        $.proxy(function () {
                            globalBus.emit('throwto', this, counter.throw(this));
                        }, this),

                        // Wait a random number of seconds weighted by timedist.
                        (pickFromDist(range(0, timedist.length), timedist)
                            + noise() + 0.6) * 1000
                    );
                });
    }
    allPlayers.push(...confederates);

    self.ball = new Ball();


    /****************************************
     * Setup UI Handlers
     * */
    self.halted = false;
    self.mode = 'game';
    self.probe = 0;
    self.tosses = 0;

    const end = function () {
        $('#end-dialogue').show();
        self.halted = true;
        self.mode = false;
        recorder.send(() => $('#return-to-survey').prop('disabled', false));
    };

    // Set end time.
    const setend = function () {
        setTimeout(end, toMilliseconds(options['time-limit']));
    };

    // Set next MW probe.
    const setprobe = function () {
        if (self.probe < options['probe-intervals'].length) {
            setTimeout(() => {
                $('#probe-dialogue').show();
                self.halted = true;
                self.mode = 'probe';
                recorder.record('openprobe', { });
                self.probe++;
            }, toMilliseconds(options['probe-intervals'][self.probe]));
        }

        // If all probes done, repeatedly check whether all throws are done.
        else setTimeout(function checkdone() {
            console.log('checkdone');
            if (self.tosses >= options['tosses']) {
                end();
            }
            else setTimeout(checkdone, 1000);
        }, 1000);
    };

    // Register event listeners.
    canvas.addEventListener('mousedown', function (ev) {
        globalBus.emit('click', ev);
    });

    globalBus.register('throwto', function (from, to) {
        console.log('thrower:', to.id);
        console.log('throwto:', to.id);

        recorder.record('throw', {
            from: from instanceof Participant ? 'participant' : from.name,
            to: to instanceof Participant ? 'participant' : to.name,
        });

        // If last throw, end the game.
        tosses++;
        //if (tosses >= options.tosses) end();
        //else
        globalBus.emit('turn', to);
    });

    globalBus.register('turn', (person) => {
        self.currentPlayer = person;
    });

    // Record response to MW probe.
    function keypress (e) {
        if (self.mode === 'game') {
            switch (e.key) {
            case 'J':
            case 'j':
                globalBus.emit('clicked', self.confederates[0]);
                recorder.record('key', { bt: 'j' });
                break;

            case 'K':
            case 'k':
                globalBus.emit('clicked', self.confederates[1]);
                recorder.record('key', { bt: 'k' });
                break;

            case ' ':
            case 'Spacebar':
                recorder.record('key', { bt: 'space' });
                break;

            default:
            }

        } else if (self.mode === 'probe') {
            switch (e.key) {
            case '1':
            case '2':
            //case '3':
                recorder.record('key', { bt: e.key });
                recorder.record('probe', { q1: e.key });
                recorder.record('closeprobe', { });
                $('#probe-dialogue').hide();
                self.mode = 'game';
                self.halted = false;
                setprobe();

                setTimeout(tick, 16);
                break;

            default:
            }
        }

        e.preventDefault();
    }

    document.addEventListener('keydown', keypress);



    $('#return-to-survey')[0].addEventListener('mousedown', function () {
        window.location.href = `${options['survey-url']}?${parameters.toString()}&completed=true`;
    });


    /****************************************
     * Set events and begin the task.
     * */
    setprobe();
    setend();

    recorder.begin();

    globalBus.emit('turn', self.confederates[0]);
    tick();
}


/**
* Main event loop. Redraw the canvas at a specified rate.
*/
function tick() {


    /****************************************
     * Clear and rescale the canvas to the current window dimensions.
     * */
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;

    let scale = 0.1666 * Math.min(canvas.height, canvas.width) / participant.sh;
    allPlayers.forEach(c => c.scale(scale));
    ball.scale(0.04 * Math.min(canvas.height, canvas.width) / ball.sh);

    participant.setPosition(pct2px(.5, .6, canvas));
    positionConfederates(
        confederates, 0.5 * Math.min(canvas.height, canvas.width),
        participant.cx, participant.cy
    );
    confederates.forEach(c => c.hflip = c.dx + c.dw / 2 > canvas.width / 2);

    if (currentPlayer.hflip)
        ball.hflip = true;
    else ball.hflip = false;

    ball.setPosition(
        relpx((20 + (ball.hflip ? 150 : 0)) * scale, 48 * scale, currentPlayer)
    );


    /****************************************
     * Emit the render event to redraw the canvas.
     * */
    globalBus.emit('render', ctx);


    /****************************************
     * Prepare next tick. Stop if halted.
     * */
    if (!self.halted)
        setTimeout(tick, 1000 / options['framerate']);
}