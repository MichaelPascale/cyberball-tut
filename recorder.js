/**
* @file Defines a class for recording data and sending to the server.
* @author Michael Pascale
*/

/**
* Create an object for recording data.
* @constructor
* @param {String} id - Unique identifier of the participant.
* @param {String} url - URL of the server to POST data to.
* @param {Number} condition - Experimental condition number.
* @param {String} [begin=false] - Start the recorder upon creation.
*/
function Recorder(id, url, condition, begin = false) {
    this.id = id;
    this.url = url;
    this.data = [];
    this.condition = condition;
    this.started = undefined;
    this.finished = undefined;

    if (begin)
        this.begin();


    /**
     * Save a data object to the data array.
     * @method
     * @param {String} type - Name for the type of record.
     * @param {Object} data - Object containing data to be recorded.
     */
    this.record = function (type, data) {
        if (this.started && !this.finished)
            this.data.push({
                condition: this.condition,
                time: new Date() - this.started,
                id: this.id,
                type: type,
                ...data
            });
        else
            throw Error('Data recorder is not active.');
    }


    /**
     * Begin recording data and log start time.
     * @method
     */
    this.begin = function () {
        if (!this.started)
            this.started = new Date();
        else
            throw Error('Data recorder already started.');
    }


    /**
     * Stop recording data and log end time.
     * @method
     */
    this.end = function () {
        if (!this.finished)
            this.finished = new Date();
        else
            throw Error('Data recorder already stopped.');
    }


    /**
     * Send data to the server.
     * @method
     */
    this.send = function () {

        if (!this.finished)
            this.end();

        $.ajax({
            type: 'post',
            url: this.url,
            data: JSON.stringify({
                id: this.id,
                started: this.started.toISOString(),
                finished: this.finished.toISOString(),
                elapsed: this.finished - this.started,
                data: this.data
            }),
            contentType: 'application/json'
        });
    }
}