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
 * Get the position of subject's centroid were it positioned over point (x, y)
 * of relative where x and y are percentage values of relative's width and
 * height.
 * @param {Number} px
 * @param {Number} py
 * @param {Object} relative
 */
function relpct2px(px, py, relative) {
    return [px * relative.width + relative.dx,
        py * relative.height + relative.dy];
}

function pct2px(px, py, canvas) {
    return [px * canvas.width, py * canvas.height];
}

function relpx(x, y, relative) {
    return [relative.dx + x, relative.dy + y];
}

function relative2(subject, relative) {
    return [relative.dx - subject.dx, relative.dy - subject.dy];
}

function getVMin() {
    return 100 / Math.min(
        document.documentElement.clientWidth,
        document.documentElement.clientHeight
    );
}

/**
 *
 * @param {Number | Array} px
 */
function pxToVMin(px) {
    const vmin = getVMin();
    if (typeof px === 'number') {
        return px * vmin;
    } else {
        return px.map((x) => x * vmin);
    }
}

function pickAnother(item, vals, dist) {
    let ret;
    do {
        ret = pickFromDist(vals, dist);
    } while (ret.id == item.id);
    return ret;
}


function pickFromDist(vals, dist) {
    const cumulatives = new Array(dist.length);
    const total = dist.reduce((sum, curr, i) => cumulatives[i] = sum + curr, 0);
    const n = Math.random() * total;
    return vals[cumulatives.findIndex(p => (p >= n))];
}

function getPersonIndex(arr, person) {
    return arr.findIndex((el) => el.id == person.id);
}

function chooseWhomToThrowTo(person, people, probs) {
    const i = getPersonIndex(people, person);
    const p = probs[i];
    const dist = probs.slice(0,i).concat(probs.slice(i + 1)).map(x => x + p);
    let a = pickFromDist(people.slice(0, i).concat(people.slice(i + 1)), dist);
    return a;
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
