/**
* @file Defines a sprite class and derived player objects.
* @author Michael Pascale
*/

/*global Fatal, MOUSE_POS, globalBus, uuidv4 */


/**
  * Create a sprite object.
  * @constructor
  * @param {String} spritesheet - URL or relative path of spritesheet image.
  * @param {String[]} spritelist - List of names for each sprite.
  * @param {Number} spritewidth - Width of a sprite on the spritesheet.
  * @param {Number} spriteheight - Height of a sprite on the spritesheet.
  */
function Sprite(spritesheet, spritelist, spritewidth, spriteheight) {
    this.id = uuidv4();

    this.spritesheet = spritesheet;
    this.spritelist = spritelist;
    this.sw = spritewidth;
    this.sh = spriteheight;

    // Index of the selected sprite and position on the spritesheet.
    this.index = 0;
    this.sx = 0;
    this.sy = 0;

    // Position and size of sprite to render on the canvas.
    this.dx = 0;
    this.dy = 0;
    this.cx = 0;
    this.cx = 0;
    this.dw = this.width = spritewidth;
    this.dh = this.height = spriteheight;

    this.el = document.createElement('img');
    this.el.setAttribute('src', spritesheet);


    /**
     * Scale the sprite by some factor.
     * @method
     * @param {Number} f - Scaling factor.
     */
    this.scale = function(f) {
        this.dw = this.width = this.sw * f;
        this.dh = this.height = this.sw * f;
    };


    /**
     * Determine whether a coordinate is within the bounds of the sprite.
     * @method
     * @param {Number} x - X-coordinate on the destination grid.
     * @param {Number} y - Y-coordinate on the destination grid.
     * @return {Boolean} - Whether the coordinate is within the sprite's bounds.
     */
    this.inBounds = function(x, y) {
        return (
            (x >= this.dx && x <= this.dx + this.width) &&
            (y >= this.dy && y <= this.dy + this.height)
        );
    };


    /**
     * Switch to another sprite.
     * @method
     * @param {String} name - Name of the sprite to switch to.
     */
    this.setSprite = function(name) {
        this.index = spritelist.indexOf(name);
        if (this.index < 0) Fatal('Sprite name not in sprite list.');
        this.sx = this.index * this.sw % this.el.width;
        this.sy = Math.floor(this.index / this.el.width);
    };


    /**
     * Set the position of the sprite on the destination grid.
     * @method
     * @param {Number} dx - X-coordinate on the destination grid.
     * @param {Number} dy - Y-coordinate on the destination grid.
     */
    this.setPosition = function(dx, dy) {
        if (typeof dx === 'number') {
            this.dx = (this.cx = dx) - this.dw / 2;
            this.dy = (this.cy = dy) - this.dh / 2;
        } else {
            this.dx = (this.cx = dx[0]) - this.dw / 2;
            this.dy = (this.cy = dx[1]) - this.dh / 2;
        }
    };


    /**
     * Render the sprite onto the destination canvas context.
     * @method
     * @param {CanvasRenderingContext2D} ctx - Context on which to render the
     * sprite.
     */
    this.render = function(ctx) {
        ctx.save();
        this.update(ctx);
        ctx.drawImage(
            this.el, this.sx, this.sy, this.sw, this.sh,
            this.dx, this.dy, this.dw, this.dh
        );
        ctx.restore();
    };


    /**
     * Stub to be overridden by derived objects. Called before each render.
     * @method
     * @param {CanvasRenderingContext2D} ctx - Context on which to render the
     * sprite.
     */
    this.update = function (ctx) {

    };


    /**
     * Stub to be overridden by derived objects. Called on each click.
     * @method
     */
    this.onclick = function () {

    };


    globalBus.register('render', $.proxy(function (ctx) {
        this.render(ctx);
    }, this));

    globalBus.register('click', $.proxy(function (ev) {
        if (this.inBounds(ev.offsetX, ev.offsetY)) {
            this.onclick();
            console.log('Clicked', this);
            globalBus.emit('clicked', this);
        }
    }, this));
}


/**
* Creates a sprite representing an individual player.
* @constructor
* @extends Sprite
* @param {String} name - A unique name for the player.
*/
function Player(name) {
    Sprite.call(this, 'assets/spritesheet.svg',
        ['idle', 'throw1', 'throw2', 'throw3', 'throw4', 'catch'], 200, 191
    );

    this.name = name;
    this.turn = false;


    /**
     * Stub to be overridden by derived objects. Called on the player's turn.
     * @method
     */
    this.onturn = function () {

    };


    globalBus.register('turn', $.proxy(function (player) {
        if (this.turn) {
            this.onturn();
            this.setSprite('throw1');
        }
    }, this));

    globalBus.register('throwto', $.proxy(function (player) {
        if (player.id === this.id)
            this.turn = true;
        else this.turn = false;
    }, this));

    globalBus.register('render', $.proxy(function () {
        if (!this.turn)
            this.setSprite('idle');
    }, this));
}

Player.prototype = Object.create(Sprite.prototype);


/**
* Creates a confederate player.
* @constructor
* @extends Player
* @param {String} name - A unique name for the confederate.
* @param {Function} onturn - A handler for the turn event.
*/
function Confederate(name, onturn) {
    Player.call(this, name);

    this.onturn = onturn;


    /**
    * Labels the confederate with its name. Called on each render.
    * @method
    * @param {CanvasRenderingContext2D} ctx - Context on which to render the
    * sprite.
    */
    this.update = function (ctx) {
        ctx.font = '1em BlinkMacSystemFont, -apple-system, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif';
        ctx.fillStyle = 'White';
        ctx.fillText(this.name, this.dx, this.dy);
    };
}

Confederate.prototype = Object.create(Player.prototype);


/**
* Creates the participant's player.
* @constructor
* @extends Player
* @param {String} name - The name of the participant.
*/
function Participant(name) {
    Player.call(this, name);


    /**
    * Faces the player towards the mouse and labels the player with its name.
    * Called on each render.
    * @method
    * @param {CanvasRenderingContext2D} ctx - Context on which to render the
    * sprite.
    */
    this.update = function (ctx) {
        ctx.font = '1em BlinkMacSystemFont, -apple-system, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif';
        ctx.fillStyle = 'White';
        ctx.fillText(this.name, this.dx, this.dy);

        if (this.turn) {
            ctx.fillText('It\'s your turn', this.dx, this.dy + this.dh + 10);
            const flip = ( self.MOUSE_POS ?
                MOUSE_POS.clientX > document.documentElement.clientWidth / 2 : 1
            ) ? 1 : -1;
            if (flip < 1) {
                ctx.translate(ctx.canvas.width, 0);
            } // this.dw, 0);
            ctx.scale(flip, 1);
        }
    };


    this.throwAnimationFrame = 0;
    this.throwAnimationStops = [
        [165, 48],
        [13, 31]
    ];

    globalBus.register('clicked', $.proxy(function (sprite) {
        //console.log(sprite instanceof Player)
        if (this.turn && sprite instanceof Player && sprite.id !== this.id)
            globalBus.emit('throwto', sprite);
    }, this));
}

Participant.prototype = Object.create(Player.prototype);


/**
* Creates a sprite representing a ball.
* @constructor
* @extends Sprite
*/
function Ball() {
    Sprite.call(this, 'assets/ball.svg', ['ball'], 78, 78);
}

Ball.prototype = Object.create(Sprite.prototype);