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
     If content is a function, the return value of the funciton is assumeed to be a DOM node, and that is appended to the element.
     Otherwise, content is assumend to be a DOM node, and that is appended to the element
     
     */
    function buildElement(type, classes) {
        var el = document.createElement(type);
        var i, classList;
        if (classes) {
            classList = classes.split(/\s+/);
            for (i = 0; i < classList.length; i += 1) {
                if (classList[i] !== undefined && classList[i].length > 0) {
                    el.classList.add(classList[i]);
                }
            }
        }

        for (index = 2; index < arguments.length; index += 1) {
            switch (typeof arguments[index]) {
                case "undefined":
                    // do nothing
                    break;
                case "string":
                case "number":
                    el.appendChild(document.createTextNode(arguments[index]));
                    break;
                case "function":
                    el.appendChild(arguments[index]());
                    break;
                default:
                    el.appendChild(arguments[index]);
                    break;
            }
        }
        return el;
    }

    function getElement(selector) {
        return document.querySelector(selector);
    }

    var board = {
        width: 640,
        height: 480
    };

    var graphics = getElement("#board").getContext('2d');


    var ball = (function () {

        var size = 10;
        var x = size * 2, y = size * 2, dx = 5, dy = 5;
        
        var lastTick = performance.now();

        function _tick() {
            var thisTick = performance.now();
            var p = paddle.getData();
            var diff = thisTick - lastTick;

            if (x + dx >( board.width - size) || x + dx < size) {
                dx = -dx;
            }

            if (y + dy < size || (y + dy > (p.y - size) && (x > (p.x - p.width / 2) && (x < (p.x + p.width / 2))))) {
                dy = -dy;
            }
/*            
            if (y + dy > (board.height - size) || y + dy < size) {
                dy = -dy;
            }
*/
            x += dx;
            y += dy;

            lastTick = thisTick;
        }
        
        function _setDx(newDx) {
            dx = newDx;
        }
        
        function _setDy(newDy) {
            dy = newDy;
        }
        
        function _draw(g) {
            g.beginPath();
            g.arc(x, y, size, 0, Math.PI*2, true); 
            g.closePath();
            g.fill();
        }

        return {
            tick: _tick,
            setDX: _setDx,
            setDY: _setDy,
            draw: _draw
        };

    })();
    
    var paddle = (function () {
        var height = 8;
        var x = board.width / 2, dx = 8, width = 40, y = board.height - (height * 1.5);
        
        function _draw(g) {
            g.beginPath();
            g.moveTo(x, y);
            g.lineTo(x + width / 2, y);
            g.lineTo(x + width / 2, y + height);
            g.lineTo(x - width / 2, y + height);
            g.lineTo(x - width / 2, y);
            g.closePath();
            g.fill();
        }
        
        function _keyHandler(e) {
            switch (e.key) {
                case "ArrowLeft":
                    if (x - dx > 0) {
                        x -= dx;
                    }
                    return;
                case "ArrowRight":
                    if (x + dx < board.width) {
                        x += dx;
                    }
            }
        }
        
        function _getData() {
            return {x : x, y : y, width: width};
        }
        
        
        document.addEventListener("keydown", _keyHandler, false);
        
        return {
            draw: _draw,
            getData: _getData
        };
        
    })();

    function tick() {
        ball.tick();
        graphics.clearRect(0, 0, board.width, board.height);
        
        ball.draw(graphics);
        paddle.draw(graphics);
    }
    
    setInterval(tick, 1000/25);
})();