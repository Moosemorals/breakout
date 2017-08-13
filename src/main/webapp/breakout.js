/* 
 * The MIT License
 *
 * Copyright 2017 Osric Wilkinson (osric@fluffypeople.com).
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */


window.Breakout = (function () {
    "use strict";

    /**
     returns a DOM element of type 'type', with classes 'classes' and content 'content'.
     
     If classes or content are undefined, they are ignored.
     
     classes should be a space seperated list of CSS classes to add to the element
     
     If content is a String, it is converted to a text node before being appended to the element.
     If content is a function, the return value of the funciton is assumeed to be a DOM node, and my is appended to the element.
     Otherwise, content is assumend to be a DOM node, and my is appended to the element
     
     */

    var board = {
        width: 640,
        height: 480,
        wall: []
    };

    var constants = {
        framerate: 1000 / 25,
        blockSpacing: 5,
        blockWidth: 50,
        blockHeight: 10,
        blockRows: 6,
        blockCols: Math.floor(board.width / (50 + 5))
    };

    function clearElement(el) {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    }

    function textNode(text) {
        return document.createTextNode(text);
    }

    function getElement(selector) {
        return document.querySelector(selector);
    }

    var shape = function (spec, my) {
        my = my || {};

        my.x = spec.x || 0;
        my.y = spec.y || 0;
        my.dx = spec.dx || 0;
        my.dy = spec.dy || 0;

        return my;
    };

    var ballGenerator = function (my) {
        var size = 10;

        my = shape({
                x: size * 2,
                y: (constants.blockHeight + constants.blockSpacing) * constants.blockRows + size * 2,
                dx: 3,
                dy: 3
            }, my);

        my.tick = function () {
            if (my.x + my.dx > (board.width - size) || my.x + my.dx < size) {
                my.dx = -my.dx;
            }

            if (my.y + my.dy > paddle.y) {
                game.end();
                return;
            }

            if (my.y + my.dy < size || (my.y + my.dy > (paddle.y - size) && (my.x > (paddle.x - paddle.width / 2) && my.x < (paddle.x + paddle.width / 2)))) {
                my.dy = -my.dy;
            }

            my.x += my.dx;
            my.y += my.dy;
        };

        my.draw = function _draw(g) {
            g.beginPath();
            g.arc(my.x, my.y, size, 0, Math.PI * 2, true);
            g.closePath();
            g.fill();
        };

        return my;
    };

    var paddle = (function (my) {
        my.height = 8;
        my.width = 60;

        var direction = 0;

        my = shape({
            x: board.width / 2,
            y: board.height - (my.height * 1.5),
            dx: 0
        }, my);

        my.draw = function (g) {
            g.beginPath();
            g.moveTo(my.x, my.y);
            g.lineTo(my.x + my.width / 2, my.y);
            g.lineTo(my.x + my.width / 2, my.y + my.height);
            g.lineTo(my.x - my.width / 2, my.y + my.height);
            g.lineTo(my.x - my.width / 2, my.y);
            g.closePath();
            g.fill();
        };

        my.tick = function () {
            if (my.x + my.dx > my.width / 2 && my.x + my.dx < (board.width - my.width / 2)) {
                my.x += my.dx;
            }
        };

        function _keyHandler(e) {

            switch (e.key) {
                case "ArrowLeft":
                case "a":
                    direction = -1;
                    break;
                case "ArrowRight":
                case "d":
                    direction = 1;
                    break;
                default:
                    direction = 0;
                    break;
            }

            switch (e.type) {
                case "keydown":
                    my.dx += (direction * 1);
                    break;
                case "keyup":
                    my.dx = 0;
                    break;
            }
        }

        document.addEventListener("keydown", _keyHandler, false);
        document.addEventListener("keyup", _keyHandler, false);

        return my;

    })({});

    var block = function (spec, my) {
        my = shape(spec, my);
        my.color = spec.color || 'blue';
        my.width = spec.width || constants.blockWidth;
        my.height = spec.height || constants.blockHeight;

        my.draw = function (g) {
            var fillStyle = g.fillStyle;
            g.fillStyle = my.color;
            g.beginPath();
            g.moveTo(my.x, my.y);
            g.lineTo(my.x + my.width, my.y);
            g.lineTo(my.x + my.width, my.y + my.height);
            g.lineTo(my.x, my.y + my.height);
            g.closePath();
            g.fill();
            g.fillStyle = fillStyle;
        };

        my.collide = function (other) {
            return other.x + other.dx > my.x &&
                    other.x + other.dx < my.x + my.width &&
                    other.y + other.dy > my.y &&
                    other.y + other.dy < my.y + my.height;
        };

        return my;
    };

    var game = (function () {
        var score = 0;
        var lives = 1;
        var graphics = getElement("#board").getContext('2d');
        var scoreboard = getElement("#score");
        var liveboard = getElement("#lives");
        var running = false;

        var ball;

        function _buildWall() {
            var row, col;

            var colOffset = (board.width % constants.blockWidth) / 2;

            for (row = 0; row < constants.blockRows; row += 1) {
                for (col = 0; col < constants.blockCols; col += 1) {
                    board.wall.push(block({
                        color: "hsl(0, " + (80 - (row * 10)) + "%, 50%)",
                        x: col * (constants.blockWidth + constants.blockSpacing) + colOffset,
                        y: row * (constants.blockHeight + constants.blockSpacing)
                    }));
                }
            }
        }

        function _drawBackground(g) {
            g.clearRect(0, 0, board.width, board.height);
        }

        function _drawBlocks(g) {
            var i;
            for (i = 0; i < board.wall.length; i += 1) {
                board.wall[i].draw(g);
            }
        }

        function _tick() {
            var i, block, bounced = false;

            var g = _getGraphics();

            // Move paddle and ball
            paddle.tick();
            ball.tick();
            
            // Work out collisions
            for (i = 0; i < board.wall.length; i += 1) {
                block = board.wall[i];
                if (block.collide(ball)) {
                    board.wall.splice(i, 1);
                    i -= 1;
                    bounced = true;
                    _addScore(1);
                    continue;
                }
            }
            if (bounced) {
                ball.dy = -ball.dy;
            }

            
            // Draw eveything, in order.
            // Clear the background first, then draw the bricks, the paddle, and the ball last (so it's on top of everything else)

            if (running) {
                _drawBackground(g);
                _drawBlocks(g);
                paddle.draw(g);
                ball.draw(g);
                requestAnimationFrame(_tick);
            }
        }

        function _start() {
            score = 0;
            running = true;

            ball = ballGenerator();

            requestAnimationFrame(_tick);
        }

        function _end() {
            var g = _getGraphics();
            running = false;
            lives -= 1;
            _showLives();
            _drawBackground(g);
            _drawBlocks(g);
            paddle.draw(g);
        }

        function _getGraphics() {
            return graphics;
        }

        function _showScore() {
            clearElement(scoreboard);
            scoreboard.appendChild(textNode(score));
        }

        function _showLives() {
            clearElement(liveboard);
            liveboard.appendChild(textNode(lives));
        }

        function _addScore(points) {
            score += points;
            _showScore();
        }

        function _init() {
            var g = _getGraphics();
            _buildWall();
            _drawBackground(g);
            _drawBlocks(g);

            getElement("#start").addEventListener("click", _start, false);
        }

        return {
            start: _start,
            end: _end,
            init: _init
        };

    })();



    game.init();
})();