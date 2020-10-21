/**
* @file Initialization and main event loop. Include this file after all others.
* @author Michael Pascale
* @copyright Michael Pascale 2020
* @license MIT
*/

/*global DEV_MODE, globalBus, Fatal, Recorder, recorder */
/*global toMilliseconds, pct2px, pickFromDist, relpx, positionConfederates */
/*global pickAnother, Participant, Confederate, Ball */
/*global participant, confederates, ball, allPlayers, currentPlayer */


var condition;
var options;
var strings;
var canvas;
var ctx;

const parameters = new URLSearchParams(window.location.search);
if(!(['condition', 'id'].every(x => parameters.has(x))))
    Fatal('Condition and ID not specified.');


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
        }).fail(Fatal),
        $.getJSON(`conditions/${parameters.get('condition')}.json`).done(
            function (r) {
                condition = r;
            }
        ).fail(Fatal)
    ).then(init);

} catch (err) {
    Fatal(err);
}


/**
 * Initialize globals and set HTML text.
 */
function init() {
    self.recorder = new Recorder(parameters.get('id'), options['data-server-url']);

    $('#pre-task-title')[0].innerText = strings['pre-task-title'];
    for (let p of strings['pre-task-messages'])
        $(`<p>${p}</p>`).appendTo('#pre-task-text');
    $('#pre-task-button-text')[0].innerText = strings['pre-task-button-text'];
    $('#connecting-text')[0].innerText = strings['connecting-text'];
    $('#probe-title')[0].innerText = strings['probe-title'];
    $('#probe-text')[0].innerText = strings['probe-text'];
    $('#probe-button-0-text')[0].innerText = strings['probe-button-0-text'];
    $('#probe-button-1-text')[0].innerText = strings['probe-button-1-text'];
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

    setTimeout(function () {
        $('#loading-page').hide();
        start();
    }, DEV_MODE ? 250 : Math.random() * (maxT - minT) + minT);
}


/**
* Initialize Cyberball and kick off event loop.
*/
function start() {
    $('#canvas').show();
    canvas = $('#canvas')[0];
    ctx = canvas.getContext('2d');

    canvas.addEventListener('mousedown', function (ev) {
        globalBus.emit('click', ev);
    });

    globalBus.register('throwto', function (person) {
        console.log('person', person);
        console.log('throwto:', person.id);
        self.currentPlayer = person;
        recorder.record({
            type: 'throw',
            to: person.name
        });
    });


    /****************************************
     * Initialize Players
     * */
    self.participant = new Participant(strings['participant-text']);
    self.allPlayers = [participant];

    const maxT = toMilliseconds(options['max-confederate-time']);
    const minT = toMilliseconds(options['min-confederate-time']);

    self.confederates = new Array(options['confederates']);
    for (let i = 0; i < confederates.length; ++i)
        confederates[i] = new Confederate(`Player ${i + 1}`, function () {
            setTimeout(
                $.proxy(function () {
                    console.log(this);
                    globalBus.emit('throwto', pickAnother(this, allPlayers, options['probabilities']));
                }, this),
                Math.random() * (maxT - minT) + minT
            );
            this.turn = false;
        });
    allPlayers.push(...confederates);

    self.ball = new Ball();


    /****************************************
     * Setup UI Handlers
     * */
    self.halted = false;
    self.probe = 0;

    // Set end time.
    const setend = function () {
        setTimeout(() => {
            $('#end-dialogue').show();
            self.halted = true;
            recorder.send();
        }, toMilliseconds(options['time-limit']));
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

    // Record response to MW probe.
    const onreport = function (res) {
        $('#probe-dialogue').hide();
        recorder.record({type: 'probe', report: res});
        self.halted = false;
        setTimeout(tick, 16);
        setprobe();
    };

    $('#answer0')[0].addEventListener('mousedown', ()=>onreport(0));
    $('#answer1')[0].addEventListener('mousedown', ()=>onreport(1));

    $('#return-to-survey')[0].addEventListener('mousedown', function () {
        window.location.href = `${options['survey-url']}?${parameters.toString()}`;
    });


    /****************************************
     * Set events and begin the task.
     * */
    setprobe();
    setend();

    recorder.begin();
    globalBus.emit('throwto', pickFromDist(allPlayers, options['probabilities']));

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

    ball.setPosition(relpx(165 * scale, 48 * scale, currentPlayer));


    /****************************************
     * Emit the render event to redraw the canvas.
     * */
    globalBus.emit('render', ctx);
    globalBus.emit('turn', currentPlayer);


    /****************************************
     * Prepare next tick. Stop if halted.
     * */
    if (!self.halted)
        setTimeout(tick, 1000/options['framerate']);
}