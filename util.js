/**
* @file Utility functions. Include this file before others.
* @author Michael Pascale
*/


/**
 * Display an alert with a generic error message. Log details to the console.
 * @param {*} msg
 */
function Fatal(msg) {
    alert('An error has occured.\n\nIf you are a study participant, please leave the study and report this issue to the researcher.');
    console.log(msg);
    throw new Error('Execution Aborted.');
}


/**
 * Convert a string representing seconds, minutes, or hours to milliseconds.
 * @param {Number | String} str - String representing some amount of time with
 * units or a raw number of milliseconds.
 * @return {Number} - Number of milliseconds.
 */
function toMilliseconds(str) {
    if (typeof str === 'number') return str;
    if (typeof str === 'string') {
        if (/^[\d.]+(ms)*$/.test(str)) return parseFloat(str);
        if (/^[\d.]+(s|sec|secs)$/.test(str)) return parseFloat(str) * 1000;
        if (/^[\d.]+(m|min|mins)$/.test(str)) return parseFloat(str) * 60000;
        if (/^[\d.]+(h|hr|hrs)$/.test(str)) return parseFloat(str) * 3600000;
    }
    Fatal(`Cannot convert value "${str}" to milliseconds.`);
}


/**
 * Get the coordinates of some vertical and horizontal fraction of a canvas.
 * @param {Number} px
 * @param {Number} py
 * @param {HTMLCanvasElement} canvas
 * @return {Number[]}
 */
function pct2px(px, py, canvas) {
    return [px * canvas.width, py * canvas.height];
}


/**
 * Get the global coordinates relative to a sprite.
 * @param {Number} x - X-coordinate relative to sprite.
 * @param {Number} y - Y-coordinate relative to sprite.
 * @param {Sprite} sprite
 * @return {Number[]}
 */
function relpx(x, y, sprite) {
    return [sprite.dx + x, sprite.dy + y];
}


/**
 * Pick an item from a distribution other than that given.
 * @param {*} item - The value to exclude.
 * @param {*[]} vals - List of values to choose from.
 * @param {Number[]} dist - The probability of each value being chosen.
 * @return {*}
 */
function pickAnother(item, vals, dist) {
    let ret;
    do {
        ret = pickFromDist(vals, dist);
    } while (ret.id == item.id);
    return ret;
}


/**
 * Pick an item from a distribution.
 * @param {*[]} vals - List of values to choose from.
 * @param {Number[]} dist - The probability of each value being chosen.
 * @return {*}
 */
function pickFromDist(vals, dist) {
    const cumulatives = new Array(dist.length);
    const total = dist.reduce((sum, curr, i) => cumulatives[i] = sum + curr, 0);
    const n = Math.random() * total;
    return vals[cumulatives.findIndex(p => (p >= n))];
}


function makeDist(vals, prob) {
    // prob is probability first element is picked.
    const pOther = (1 - prob) / vals.length;
    let dist = vals.map((x, i) => i === 0 ? prob : pOther);
    return dist;
}

function norm(m, r, x = Math.random()) {
    const e  = 2.71828;
    const pi = 3.14159;

    const a = 1 / (r * Math.sqrt(2 * pi));
    const b = -1 * ((x - m)*(x - m)) / (2 * r * r);
    const c = Math.pow(e, b);
    return a * c;
}

function skewedRandomTime(min, max) {
    const t = [];
    for (let i = 0; i <= max - min; i++)
        t[i] = min + i;

    return pickFromDist(t, t.map((x,i) => norm(0.2, 0.3, i/t.length)));
}

function range(min, max) {
    const t = [];
    for (let i = 0; i <= max - min; i++)
        t[i] = min + i;
    return t;
}

/**
 * Position the confederates in a half circle.
 * @param {Confederate[]} confederates
 * @param {Number} r
 * @param {Number} x
 * @param {Number} y
 */
function positionConfederates(confederates, r, x, y) {
    // console.log('Confederates:', x, y);
    confederates.forEach((c, i) => {
        const angle =
            (i + 1) * Math.PI / (confederates.length + 1) + Math.PI / 2;
        c.setPosition(x - r * Math.sin(angle), y + r * Math.cos(angle));
    });
}
