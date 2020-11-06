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
if(!(['condition', 'linkid'].every(x => parameters.has(x))))
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
    for (let p of strings['pre-task-messages'])
        $(`<p>${p}</p>`).appendTo('#pre-task-text');
    $('#pre-task-button-text')[0].innerText = strings['pre-task-button-text'];
    $('#connecting-text')[0].innerText = strings['connecting-text'];
    $('#probe-title')[0].innerText = strings['probe-title'];
    $('#probe-text')[0].innerText = strings['probe-text'];
    $('#probe-button-0-text')[0].innerText = strings['probe-button-0-text'];
    $('#end-title')[0].innerText = strings['end-title'];
    $('#end-text')[0].innerText = strings['end-text'];
    $('#survey-button-text')[0].innerText = strings['survey-button-text'];

    $('#pre-task-button')[0].addEventListener('mousedown', function () {
        $('#pre-task-page').hide();
        connecting();
    });
}


/**
 * Animate the 'connecting' screen. End after a set time and call start().
 */
function connecting() {
    $('#loading-page').show();

    const maxT = toMilliseconds(options['max-connecting-time']);
    const minT = toMilliseconds(options['min-connecting-time']);
    const totaltime = DEV_MODE ? 250 : Math.random() * (maxT - minT) + minT;

    setTimeout(()=>{ $('#connecting-text')[0].innerText = 'Waiting for 2 more participants...'; }, 750);
    setTimeout(()=>{ $('#connecting-text')[0].innerText = 'Waiting for 1 more participants...'; }, 0.72 * totaltime);
    setTimeout(()=>{ $('#connecting-text')[0].innerText = 'Starting game.'; }, totaltime - 1000);

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


    /****************************************
     * Initialize Players
     * */
    self.participant = new Participant();
    self.allPlayers = [participant];

    const maxT = toMilliseconds(options['max-confederate-time']);
    const minT = toMilliseconds(options['min-confederate-time']);
    const timedist = options['confederate-time-dist'];


    // TODO Name confederates randomly or by i +1
    self.confederates = new Array(options['confederates']);
    for (let i = 0; i < confederates.length; ++i) {
        confederates[i] =
            new Confederate(`Player ${i == 0 ? 1 : 3}`,
                function () {
                    setTimeout(

                        $.proxy(function () {
                            globalBus.emit('throwto', this, pickAnother(this, allPlayers, prob));
                        }, this),

                        // Wait a random number of seconds weighted by timedist.
                        (pickFromDist(range(0, timedist.length), timedist)
                            + noise()) * 1000
                    );
                });
    }
    allPlayers.push(...confederates);

    self.ball = new Ball();


    /****************************************
     * Setup UI Handlers
     * */
    self.halted = false;
    self.probe = 0;
    self.tosses = 0;

    const end = function () {
        $('#end-dialogue').show();
        self.halted = true;
        recorder.send(()=>$('#return-to-survey').prop('disabled', false));
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
                self.probe++;
            }, toMilliseconds(options['probe-intervals'][self.probe]));
        }
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
        if (tosses >= options.tosses) end();
        else globalBus.emit('turn', to);
    });

    globalBus.register('turn', (person)=>{
        self.currentPlayer = person;
    });

    // Record response to MW probe.
    $('#probe-form').submit(function(e) {
        $('#probe-dialogue').hide();

        const formdata = $('#probe-form').serializeArray();
        const data = {};

        for (let x of formdata) data[x.name] = x.value;

        recorder.record('probe', data);
        $('#probe-form')[0].reset();

        setTimeout(()=>{
            self.halted = false;
            setprobe();
        }, Math.random * 3000 + 750);

        setTimeout(tick, 16);

        e.preventDefault();
    });

    $('#return-to-survey')[0].addEventListener('mousedown', function () {
        window.location.href = `${options['survey-url']}?${parameters.toString()}&completed=true`;
    });


    /****************************************
     * Set events and begin the task.
     * */
    setprobe();
    setend();

    recorder.begin();
    globalBus.emit('turn', pickFromDist(allPlayers, prob));

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

    participant.setPosition(pct2px(.5, .75, canvas));
    positionConfederates(
        confederates, 0.5 * Math.min(canvas.height, canvas.width),
        participant.cx, participant.cy
    );
    confederates.forEach(c => c.hflip = c.dx + c.dw/2 > canvas.width/2 );

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
        setTimeout(tick, 1000/options['framerate']);
}