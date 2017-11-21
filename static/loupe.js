/**
* JS Loupe. IE9+ only
* How to use (Simple): new JsLoupe('.my-image'); or new JsLoupe(myImageElement);
* How to use (With settings): new JsLoupe('.my-image', {radius: 300});
* Options:
*     dataZoom - image element attribute for zoom image
*     radius {integer} - loupe radius
*     zoom - {integer} - zoom percents,
*     loupeCss - {string} - CSS class for loupe element
*     imageOnZoomCss - {string} - CSS class for image on zoom moment
*     zoomOnScroll - {boolean} - enable or desable zoom on mouse scroll
*     zoomOnScrollStep - {integer} - zoom step size on mouse scroll (only with zoomOnScroll)
*     zoomOnScrollMax - {integer} - zoom maximum value on mouse scroll (only with zoomOnScroll)
*     zoomOnScrollInvert - {integer} - invert mouse scroll away (only with zoomOnScroll)
*
* Public methods (enabled if you init plugin for single element):
* reload[[options]] - reload plugin
* destroy - destroy plugin
* setZoom[zoomValue] - set new zoom value
* setRadius[radiusValue] - set new radius value
* 
*/





/**
 * ============================================================================
 * SPECIAL FOR IE 8-9 Cross-browser full element.classList implementation.
 * 2011-06-15
 *
 * By Eli Grey, https://eligrey.com
 * Public Domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 * @source https://purl.eligrey.com/github/classList.js/blob/master/classList.js
 * ============================================================================
 */
"undefined"===typeof document||"classList"in document.createElement("a")||function(d){d=(d.HTMLElement||d.Element).prototype;var e=Object,l=String.prototype.trim||function(){return this.replace(/^\s+|\s+$/g,"")},m=Array.prototype.indexOf||function(a){for(var b=0,c=this.length;b<c;b++)if(b in this&&this[b]===a)return b;return-1},g=function(a,b){this.name=a;this.code=DOMException[a];this.message=b},f=function(a,b){if(""===b)throw new g("SYNTAX_ERR","An invalid or illegal string was specified");if(/\s/.test(b))throw new g("INVALID_CHARACTER_ERR",
"String contains an invalid character");return m.call(a,b)},h=function(a){for(var b=l.call(a.className),b=b?b.split(/\s+/):[],c=0,d=b.length;c<d;c++)this.push(b[c]);this._updateClassName=function(){a.className=this.toString()}},c=h.prototype=[],k=function(){return new h(this)};g.prototype=Error.prototype;c.item=function(a){return this[a]||null};c.contains=function(a){return-1!==f(this,a+"")};c.add=function(a){a+="";-1===f(this,a)&&(this.push(a),this._updateClassName())};c.remove=function(a){a=f(this,
a+"");-1!==a&&(this.splice(a,1),this._updateClassName())};c.toggle=function(a){a+="";-1===f(this,a)?this.add(a):this.remove(a)};c.toString=function(){return this.join(" ")};if(e.defineProperty){c={get:k,enumerable:!0,configurable:!0};try{e.defineProperty(d,"classList",c)}catch(n){-2146823252===n.number&&(c.enumerable=!1,e.defineProperty(d,"classList",c))}}else e.prototype.__defineGetter__&&d.__defineGetter__("classList",k)}(self);





(function (root) {

    "use strict";

    /**
     * Common object params
     * @type {Object}
     */
    var common = {
            publicMethods: ['reload', 'destroy', 'setZoom', 'setRadius'],
            className: 'JsLoupe'
        },

        /**
         * Main constructor
         * @return {Object} - this handle
         */
        Protected = function (selector, options) {

            var i, l;

            if (!selector) {
                return;
            }

            //default settings
            this.settings = {
                radius: 300,
                zoom: 180,
                zoomOnScroll: true,
                zoomOnScrollStep: 10,
                zoomOnScrollMax: 1000,
                zoomOnScrollInvert: true,
                dataZoom: 'data-zoom-image',
                loupeCss: 'js-loupe',
                imageOnZoomCss: 'js-loupe-active'
            };

            //cursor positions
            this.cursorY = 0;
            this.cursorX = 0;

            //if is images array
            if (typeof selector === 'object' && selector.length) {

                l = selector.length;
                for (i = 0; i < l; i += 1) {

                    common.publicMethods = [];

                    //call plugin for this image element
                    root[common.className].apply(this, [selector[i], options]);
                }
                return;
            }

            //if is css class string
            if (typeof selector === 'string') {
                common.publicMethods = [];
                root[common.className].apply(this, [document.querySelectorAll(selector), options]);
                return;
            }

            //if is single html element
            if (selector instanceof Element) {

                this.image = selector;

                //initialize
                this.init(options);

                return this;
            }
        };


    /**
     * Main prototype
     * @type {Object}
     */
    Protected.prototype = {

        /**
         * Initialization
         * @param  {object} [options] - custom options
         */
        init: function (options) {

            var self = this,
                n;

            //apply options to settings 
            if (options) {
                for (n in options) {
                    if (options.hasOwnProperty(n)) {
                        this.settings[n] = options[n];
                    }
                }
            }

            //zoom image
            this.zoomImageScr = this.image.getAttribute(this.settings.dataZoom) || this.image.getAttribute('src');

            //coefficient
            this.factor = this.settings.zoom / 100;

            //half radius
            this.halfRadius = this.settings.radius / 2;

            //bind functions to this handle
            this.mousemoveTracker = this.mousemoveTracker.bind(this);
            this.recalcLoupe = this.recalcLoupe.bind(this);
            this.mousewheelZoom = this.mousewheelZoom.bind(this);

            //set pending class
            this.image.classList.add('pending');

            //preload image
            this.preloadImages([this.image, this.zoomImageScr], function () {

                //remove pending class
                self.image.classList.remove('pending');

                //create loupe element and set styles
                self.createLoupe();

                //add event for mouse tracker
                document.body.addEventListener('mousemove', self.mousemoveTracker);

                //add event for loupe recalculate
                document.addEventListener('mousemove', self.recalcLoupe);


                if (self.settings.zoomOnScroll) {

                    //try to set mouse wheel events
                    if ('onwheel' in document) {
                        self.loupe.addEventListener('wheel', self.mousewheelZoom);
                    } else if ('onmousewheel' in document) {
                        self.loupe.addEventListener('mousewheel', self.mousewheelZoom);
                    } else {
                        self.loupe.addEventListener('MozMousePixelScroll', self.mousewheelZoom);
                    }
                }

                //paint loupe
                self.repaintLoupe();
            });
        },




        /**
         * Create loupe html element
         */
        createLoupe: function () {

            //create loupe
            this.loupe = document.createElement('div');
            this.loupe.setAttribute('class', this.settings.loupeCss);
            this.loupe.style.display = 'none';
            this.loupe.style.zIndex = 9999;

            //append loup into the body
            document.body.appendChild(this.loupe);

        },




        /**
         * Remove loupe html element
         */
        removeLoupe: function () {
            this.loupe.parentNode.removeChild(this.loupe);
        },




        /**
         * Paint and repaint loupe
         */
        repaintLoupe: function () {
            var n,
                styles = {
                    position: 'absolute',
                    cursor: 'none',
                    backgroundRepeat: 'no-repeat',
                    width: this.settings.radius + 'px',
                    height: this.settings.radius + 'px',
                    borderRadius: '100%',
                    backgroundImage: 'url(' + this.zoomImageScr + ')',
                    backgroundSize: [this.image.width * this.factor, this.image.height * this.factor].join('px ') + 'px'
                };

            //apply styles
            for (n in styles) {
                this.loupe.style[n] = styles[n];
            }
        },





        /**
         * Tracker of mousemove event for get cursor position
         * @param  {event} event - browser event
         */
        mousemoveTracker: function (event) {
            this.cursorY = event.pageX;
            this.cursorX = event.pageY;
        },





        /**
         * Get element offset position by window
         * @param  {object} element - target element
         * @return {object}         [description]
         */
        getPosition: function (element) {

            var clientRect = this.image.getBoundingClientRect(),
                offsetLeft = clientRect.left + (window.scrollX || window.pageXOffset || document.body.scrollLeft),
                offsetTop = clientRect.top + (window.scrollY || window.pageYOffset || document.body.scrollTop);

            return {
                x: offsetLeft,
                y: offsetTop
            }
        },






        /**
         * Recalculate loupe position
         */
        recalcLoupe: function () {

            var imagePosition = this.getPosition(this.image),
                offsetLeft = imagePosition.x,
                offsetTop = imagePosition.y;

            //if cursor out of image
            if(this.cursorY < offsetLeft ||  this.cursorX < offsetTop || this.cursorY > (offsetLeft + this.image.clientWidth) || this.cursorX > (offsetTop + this.image.clientHeight)) {

                //hide loupe
                this.loupe.style.display = 'none';
                this.image.classList.remove(this.settings.imageOnZoomCss);
                return;
            }

            //if cursor over of image
            this.image.classList.add(this.settings.imageOnZoomCss);

            this.loupe.style.display = 'block';                    
            this.loupe.style.left = this.cursorY - (this.halfRadius) + 'px';
            this.loupe.style.top = this.cursorX - (this.halfRadius) + 'px';
            this.loupe.style.backgroundPosition = [
                -(((this.cursorY - offsetLeft) * this.factor) - (this.halfRadius)),
                -(((this.cursorX - offsetTop) * this.factor) - (this.halfRadius))
                ].join('px ') + 'px';
        },






        /**
         * Mousewheel event for change zoom value on scroll
         * @param  {event} event - browser event
         */
        mousewheelZoom: function (event) {
            
            event = event || window.event;

            var delta = event.deltaY || event.detail || event.wheelDelta;


            if (this.settings.zoomOnScrollInvert) {
                delta = -delta;
            }

            if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) {
                delta = -delta;
            }


            delta = (Math.abs(delta).toString().length === 3) ? delta : delta * 10;




            this.settings.zoom += delta / this.settings.zoomOnScrollStep;

            if (this.settings.zoom < 100 + this.settings.zoomOnScrollStep) {
                this.settings.zoom = 100 + this.settings.zoomOnScrollStep;
            }

            if (this.settings.zoom > this.settings.zoomOnScrollMax) {
                this.settings.zoom = this.settings.zoomOnScrollMax;
            }

            this.setZoom(this.settings.zoom);
            event.preventDefault();
        },




        /**
         * Preload images
         * @param  {array} images - array of image elements or image url sources
         * @param  {function} callback - callback function
         */
        preloadImages: function (images, callback) {

            var currentCount = 0,
                allCount = images.length,
                src,
                i,
                l = images.length;

            for (i = 0; i < l; i += 1) {

                src = (typeof images[i] === 'string') ? images[i]: images[i].getAttribute('src');

                //create new image
                (function (img, src) {

                    var newImg = new Image();
                    newImg.src = src;
                    
                    //onload event
                    newImg.onload = function(){

                        currentCount += 1;

                        if (currentCount === allCount) {
                            currentCount = null;
                            allCount = null;

                            //run callback in main context
                            callback && callback.call(this);
                            return;
                        }
                    }

                    newImg = null;

                }(images[i], src));

                src = null;
            }
        },




        /**
         * Detroy plugin
         */
        destroy: function () {

            //remove listeners
            document.body.removeEventListener('mousemove', this.mousemoveTracker);
            document.removeEventListener('mousemove', this.recalcLoupe);

            if (this.settings.zoomOnScroll) {

                //try to set mouse wheel events
                if ('onwheel' in document) {
                    this.loupe.removeEventListener('wheel', this.mousewheelZoom);
                } else if ('onmousewheel' in document) {
                    this.loupe.removeEventListener('mousewheel', this.mousewheelZoom);
                } else {
                    this.loupe.removeEventListener('MozMousePixelScroll', this.mousewheelZoom);
                }
            }

            //remove js-loupe css class from image
            this.image.classList.remove(this.settings.imageOnZoomCss);

            //remove loupe
            this.removeLoupe();
        },




        /**
         * Reload plugin for current image
         * @param  {object} [options] - custom options
         * @return {[type]}         [description]
         */
        reload: function (options) {

            options = options || this.settings;

            this.destroy();

            this.init(options);           
        },




        /**
         * Set new zoom value
         * @param {integer} zoom - new zoom value
         */
        setZoom: function (zoom) {

            //set new zoom value
            this.settings.zoom = zoom || this.settings.zoom;

            //set news coefficient value
            this.factor = this.settings.zoom / 100;

            //set new half radius value
            this.halfRadius = this.settings.radius / 2;

            //repaint loupe
            this.repaintLoupe();

            //recalculate loupe
            this.recalcLoupe();
        },




        /**
         * Set new radius value
         * @param {integer} radius - new radius value
         */
        setRadius: function (radius) {

            //set new radius value
            this.settings.radius = radius || this.settings.radius;

            //set new half radius value
            this.halfRadius = this.settings.radius / 2;


            //repaint loupe
            this.repaintLoupe();

            //recalculate loupe
            this.recalcLoupe();
        }
    };





    /**
     * Encapsulation
     * @return {Object} - this handle
     */
    root[common.className] = function () {

        function construct(constructor, args) {

            function Class() {
                return constructor.apply(this, args);
            }
            Class.prototype = constructor.prototype;
            return new Class();
        }

        var original = construct(Protected, arguments),
            Publicly = function () {};
        
        Publicly.prototype = {};
        Array.prototype.forEach.call(common.publicMethods, function (member) {
            Publicly.prototype[member] = function () {
                return original[member].apply(original, arguments);
            };
        });

        return new Publicly(arguments);
    };

}(this));
//Run plugin
new JsLoupe('.picture');