/**
* @file Defines a global event bus. Include this file before others.
* @author Michael Pascale
*/

/**
* Create an event bus.
* @constructor
*/
function EventBus () {
    this.events = new Map();


    /**
     * Register an event handler.
     * @method
     * @param {String} event - The name of the event to listen to.
     * @param {Function} handler - A function to call when the event occurs.
     */
    this.register = function (event, handler) {
        if (!this.events.has(event))
            this.events.set(event, []);

        this.events.get(event).push(handler);
    };


    /**
     * Unregister an event handler.
     * @method
     * @param {String} event - The name of the event.
     * @param {Function} handler - A function to remove from the event.
     */
    this.unregister = function (event, handler) {
        if (this.events.has(event)) {
            const queue = this.events.get(event);
            if (queue.length < 1) {
                this.events.delete(event);
            } else {
                queue.splice(queue.indexOf(handler), 1);
            }
        }
    };


    /**
     * Trigger an event.
     * @method
     * @param {String} event - The name of the event to trigger.
     * @param {*} args - Arguments to be supplied to each handler.
     */
    this.emit = function (event, args) {
        // if (DEV_MODE)
        //     console.log(`Event: ${event}`);

        if (this.events.has(event)) {
            const queue = this.events.get(event);
            for (const handler of queue) {
                handler(args);
            }
        }
    };
}


self.globalBus = new EventBus();

window.onmousemove = function (ev) {
    window.MOUSE_POS = ev;
};