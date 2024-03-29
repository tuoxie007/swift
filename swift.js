/*
	Copyright (c) 2011 Xu Ke, https://github.com/tuoxie007/swift

	Permission is hereby granted, free of charge, to any person obtaining
	a copy of this software and associated documentation files (the
	"Software"), to deal in the Software without restriction, including
	without limitation the rights to use, copy, modify, merge, publish,
	distribute, sublicense, and/or sell copies of the Software, and to
	permit persons to whom the Software is furnished to do so, subject to
	the following conditions:

	The above copyright notice and this permission notice shall be
	included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
	NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
	LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
	OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
	WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

	Version: v2.0alpha
*/

(function (window) {
	
	var document = window.document;
		hasOwn = Object.prototype.hasOwnProperty;
	
	// Add ECMA262-5 method binding if not supported natively
	//
	if (!('bind' in Function.prototype)) {
		Function.prototype.bind = function(owner) {
			var that= this;
			if (arguments.length<=1) {
				return function() {
					return that.apply(owner, arguments);
				};
			} else {
				var args= Array.prototype.slice.call(arguments, 1);
				return function() {
					return that.apply(owner, arguments.length===0? args : args.concat(Array.prototype.slice.call(arguments)));
				};
			}
		};
	}

	// Add ECMA262-5 string trim if not supported natively
	//
	if (!('trim' in String.prototype)) {
		String.prototype.trim = function() {
			return this.replace(/^\s+/, '').replace(/\s+$/, '');
		};
	}

	// Add ECMA262-5 Array methods if not supported natively
	//
	if (!('indexOf' in Array.prototype)) {
		Array.prototype.indexOf = function(find, i /*opt*/) {
			if (i===undefined) i= 0;
			if (i<0) i+= this.length;
			if (i<0) i= 0;
			for (var n= this.length; i<n; i++)
				if (i in this && this[i]===find)
					return i;
			return -1;
		};
	}
	if (!('lastIndexOf' in Array.prototype)) {
		Array.prototype.lastIndexOf = function(find, i /*opt*/) {
			if (i===undefined) i= this.length-1;
			if (i<0) i+= this.length;
			if (i>this.length-1) i= this.length-1;
			for (i++; i-->0;) /* i++ because from-argument is sadly inclusive */
				if (i in this && this[i]===find)
					return i;
			return -1;
		};
	}
	if (!('forEach' in Array.prototype)) {
		Array.prototype.forEach = function(action, that /*opt*/) {
			/*
				items.forEach(callback(item, index, items));
					this should be that or window
			*/
			for (var i= 0, n= this.length; i<n; i++)
				if (i in this)
					action.call(that, this[i], i, this);
		};
	}
	if (!('remove' in Array.prototype)) {
		Array.prototype.remove = function(item) {
			var tmp = [],
				removed = false;
			while (this.length) {
				tmp.push(this.pop());
			}
			for (var i=0; tmp.length; i++) {
				if (this[i] !== item)
					ret.push(item);
				else
					removed = true;
			}
			return removed;
		}
	}
	
	//Extends build in types
	String.prototype.fs = function () {
		var segments = this.split('%s'),
			ret = '';
		for (var i=0; i<arguments.length; i++) {
			ret += segments[i] + arguments[i];
		}
		return ret + segments[segments.length - 1];
	}
	String.prototype.ltrim = function () {
		return this.replace(/^\s+/, "");
	}
	String.prototype.rtrim = function () {
		return this.replace(/\s+$/, "");
	};
	String.prototype.empty = function () {
		return this == '';
	};
	String.prototype.endswith = function (substr) {
		return this.slice(-substr.length) == substr;
	};
	String.prototype.startswith = function (substr) {
		return this.slice(0, substr.length) == substr;
	};

	function bindClassList(ele) {
		ele.classList = {
			add: function(className) {
				var classes = ele.className.split(/\s+/);
				if (!$.inArray(className, classes)) {
					classes.push(className);
					ele.className = classes.join(' ');
				}
			},
			remove: function(className) {
				var classes = ele.className.split(/\s+/);
				if ($.inArray(className, classes)) {
					var newClasses = [],
						idx = classes.indexOf(className);
					newClasses.concat(classes.slice(0, idx));
					newClasses.concat(idx+1);
					ele.className = newClasses.join(' ');
				}
			},
			contains: function(className) {
				var classes = ele.className.split(/\s+/);
				return $.inArray(className, classes);
			}
		}
	}
	

	// global
	var global = {events: [], data: {}, ajaxEvents: [], runningAjaxCount: 0};
	global.ajaxSettings = {
		type: 'GET',
		cache: true,
		async: true,
		headers: {
			'X-Requested-With': 'XMLHttpRequest'
		},
		accepts: {
			script: 'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript',
			xml: 'application/xml, text/xml',
			html: 'text/html',
			text: 'text/plain',
			json: 'application/json, text/javascript'
		},
		dataType: '*',
		ifModified: false,
		processData: true,
		traditional: false,
		global: true,
		isLocal: false,
		crossDomain: false
	};
	
	
	
	function Swift(tags, selector, context) {
		for (var i = 0; i < tags.length; i++) {
			this[i] = tags[i];
		}
		this.length = tags.length;
		this.context = context;
		this.selector = selector;
		this.swift = '2.0';
		
		this.stack = context ? [{'swift': new Swift([context])}] : []
	}
	var slice = Array.prototype.slice;
	// extend Swift prototype
	// Swift.prototype = Array.prototype;
	Swift.prototype.constructor = Swift;
	Swift.prototype.toArray = function() {
		return this.slice();
	}
	Swift.prototype.push = Array.prototype.push;
	Swift.prototype.concat = Array.prototype.concat;
	Swift.prototype.sort = Array.prototype.sort;
	// splice make Swift looks like a Array object
	Swift.prototype.splice = Array.prototype.splice;
	Swift.prototype.slice = function(start, end) {
		var ret = slice.call(this, start, end);
		return this.pushStack($(ret), 'slice', start, end);
	}
	Swift.prototype.find = function (arg1) {
		var found;
		if (!this.length)
			found = $([]);
		else if (typeof arg1 === 'string') { // .find(selector)
			found = $([]);
			this.each(function() {
				$(arg1, this).each(function() {
					found.push(this);
				});
			});
		} else if (arg1.length && arg1[0]) { // .find(swift object) or .find(elements)
			var children = this.children();
			if (children.length) {
				found = $(children.filter(function() {
					return $.inArray(this, arg1);
				}).get().concat(children.find(arg1).get()));
			} else {
				found = $([]);
			}
		} else { // .find(element)
			return this.find([arg1]);
		}
		
		return this.pushStack(found, 'find', arguments);
	}
	Swift.prototype.pushStack = function(elements, method, args) {
		var newSwift = $(elements);
		newSwift.stack = this.stack.slice(0);
		newSwift.stack.push({'swift': this, 'method': method, 'arguments': args});
		return newSwift;
	}
	Swift.prototype.each = function (callback) {
		Array.prototype.forEach.call(this, function(item, index, items) {
			callback.call(item, index, item, items);
		});
		return this;
	}
	function SwiftEvent(context, selector, action, data, handler, one) {
		this.context = context;
		this.selector = selector;
		this.action = action;
		this.data = data;
		this.handler = handler;
		this.one = one;
		var self = this;
		var real_heandler = function(event) {
			var data = $.mergeObject(this.data, this.extraParameters),
				ret;
			(selector ? $(this).find(selector) : $(this)).each(function() {
				if (this == (event.target || event.srcElement)) {
					if (data) event.data = data;
					event.delegateTarget = this;
					ret = event.returnValue = handler.call(this, event);
					if (self.one)
						self.unbind();
					return event.returnValue;
				}
			});
			return ret;
		};
		this.bind = function() {
			$(this.context).each(function() {
				if (window.addEventListener) {
					this.addEventListener(action, real_heandler, false);
				} else {
					this.attachEvent('on' + action, real_heandler);
				}
			});
		}
		this.unbind = function() {
			$(this.context).each(function() {
				if (window.removeEventListener) {
					this.removeEventListener(action, real_heandler);
				} else {
					this.detachEvent('on' + action, real_heandler);
				}
			});
		}
		this.clone = function() {
			return new SwiftEvent(this.context, selector, action, data, handler, one);
		}
		this.exec = function(extraParameters) {
			return real_heandler({
				data: $.mergeObject(data, extraParameters),
				target: self
			});
		}
	}
	Swift.prototype.on = function() {
		if ($.checkTypes(arguments, ['string', 'string', 'object', 'function'])) {
			var args = (function(events, selector, data, handler) {
				var event_map = {};
				events.trim().split('/\s+/').forEach(function(eve) {
					event_map[eve] = handler;
				});
				return [event_map, selector, data];
			}).apply(this, arguments);
		} else if ($.checkTypes(arguments, ['string', 'string', 'function'])) {
			var args = (function(events, selector, handler) {
				var event_map = {};
				events.trim().split('/\s+/').forEach(function(eve) {
					event_map[eve] = handler;
				});
				return [event_map, selector];
			}).apply(this, arguments);
		} else if ($.checkTypes(arguments, ['string', 'object', 'function'])) {
			var args = (function(events, data, handler) {
				var event_map = {};
				events.trim().split('/\s+/').forEach(function(eve) {
					event_map[eve] = handler;
				});
				return [event_map, undefined, data];
			}).apply(this, arguments);
		} else if ($.checkTypes(arguments, ['string', 'function'])) {
			var args = (function(events, handler) {
				var event_map = {};
				events.trim().split('/\s+/').forEach(function(eve) {
					event_map[eve] = handler;
				});
				return [event_map];
			}).apply(this, arguments);
		} else if ($.checkTypes(arguments, ['object', 'string'])) {
			var args = arguments;
		} else if ($.checkTypes(arguments, ['object', 'object'])) {
			var args = [arguments[0], undefined, arguments[1]];
		} else if ($.checkTypes(arguments, ['object'])) {
			var args = arguments;
		} else {
			throw new TypeError();
		}
		var eles = this;
		(function(event_map, selector, data) {
			$.each(event_map, function(eve, handler) {
				eles.each(function(i, ele) {
					var swift_event = new SwiftEvent(ele, selector, eve, data, handler, eles.isOne);
					swift_event.bind();
					global.events.push(swift_event);
					if (global.current_events)
						global.current_events.push(swift_event);
					else
						global.current_events = [swift_event];
				});
			});
		}).apply(this, args);
		return this;
	}
	Swift.prototype.off = function() {
		if ($.checkTypes(arguments, ['string', 'string', 'function'])) {
			var args = (function(events, selector, handler) {
				var event_map = {};
				events.trim().split('/\s+/').forEach(function(eve) {
					event_map[eve] = handler;
				});
				return [event_map, selector];
			}).apply(this, arguments);
		} else if ($.checkTypes(arguments, ['string', 'function'])) {
			var args = (function(events, handler) {
				var event_map = {};
				events.trim().split('/\s+/').forEach(function(eve) {
					event_map[eve] = handler;
				});
				return [event_map];
			}).apply(this, arguments);
		} else if ($.checkTypes(arguments, ['string'])) {
			(function(events, selector) {
				var events = events.trim().split('/\s+/');
				this.each(function(i, ele) {
					events.forEach(function(action) {
						global.events = $.grep(global.events, function(swift_event) {
							if (swift_event.context === ele && 
								swift_event.action === action && 
								swift_event.selector === selector) {
									swift_event.unbind();
									return false;
							}
							return true;
						});
					});
				});
			}).apply(this, arguments);
			return;
		} else if ($.checkTypes(arguments, ['object'])) {
			var args = arguments;
		} else {
			throw new TypeError();
		}
		
		var eles = this;
		(function(event_map, selector) {
			eles.each(function(i, ele) {
				$.each(event_map, function(action, handler) {
					global.events = $.grep(global.events, function(swift_event) {
						if (swift_event.context === ele && 
							swift_event.action === action && 
							swift_event.selector === selector &&
							swift_event.handler === handler) {
								swift_event.unbind();
								return false;
						}
						return true;
					});
				});
			});
		}).apply(this, args);
		return this;
	}
	Swift.prototype.toggle = function () {
		if ($.checkTypes(arguments, ['function', 'function'])) {
			/*
				Bind two or more handlers to the matched elements, to be executed on alternate clicks.
				.toggle(handler(eventObject), handler(eventObject) [, handler(eventObject)])
			*/
			return (function(cb1, cb2, cb3) {
				return this.on('click', function () {
					this.clicked = this.clicked ? (this.clicked + 1) : 1;
					(this.clicked % 2 ? cb1 : cb2).apply(this, arguments);
					if (cb3) cb3.apply(this, arguments);
				});
			}).apply(this, arguments);
		} else {
			// TODO 2
			/*
			.toggle( [duration] [, callback] )
				durationA string or number determining how long the animation will run.
				callbackA function to call once the animation is complete.
			.toggle( [duration] [, easing] [, callback] )
				durationA string or number determining how long the animation will run.
				easingA string indicating which easing function to use for the transition.
				callbackA function to call once the animation is complete.
			.toggle( showOrHide )
				showOrHideA Boolean indicating whether to show or hide the elements.
			*/
		}
	}
	Swift.prototype.one = function() {
		this.isOne = true;
		this.on.apply(this, arguments);
		this.isOne = false;
		global.current_events.forEach(function() {
			global.events = $.grep(global.events, function(swift_event) {
				return swift_event in global.current_events;
			}, true);
		});
		delete global.current_events;
		return this;
	}
	Swift.prototype.trigger = function(event, extraParameters) {
		var eles = this,
			triggered = $.grep(global.events, function(swift_event) {
				return $.inArray(swift_event.context, eles) && 
					swift_event.selector === undefined &&
					swift_event.action === event;
		});
		// TODO 2 about extraParameters
		this.each(function() {
			this[event].call(this);
		});
		return this;
	}
	Swift.prototype.triggerHandler = function(event, extraParameters) {
		if (this.length) {
			var ele = this[0],
				triggered = $.grep(global.events, function(swift_event) {
							return swift_event.context === ele &&
								swift_event.selector === undefined &&
								swift_event.action === event;
						}),
				ret;
			$.each(triggered, function() {
				ret = this.exec(extraParameters);
			});
			return ret;
		}
	}
	
	var actions = 'change click dbclick focus focusin focusout hover keydown keypress keyup load mousedown mouseenter mouseleave mousemove mouseout mouseup resize scroll select submit unload error'.split(' ');
	for (var i = 0; i < actions.length; i++) {
		var action = actions[i];
		(function (action) {
			Swift.prototype[action] = function (callback) {
				if (callback)
					return this.on(action, callback);
				else
					return this.trigger(action);
			}
		})(action);
	}
	Swift.prototype.tag = function () {
		return this.length ? this[0].tagName.toLowerCase() : undefined;
	}
	Swift.prototype.val = function (value) {
		if (arguments.length) {
			if (typeof value === 'function') {
				this.each(function(index) {
					$(this).val(value.call(this, index, $(this).val()));
				});
				return this;
			}
			if (this.tag() == 'select') {
				var options = this.children();
				for (var i = 0; i < options.length; i++) {
					if (options[i].value == value) options[i].selected = 'selected';
					else options[i].removeAttribute('selected');
				}
			} else if (this.tag() == 'input' && this.attr('type') == 'checkbox') {
				var values = $.slice(value);
				if (!values.length) values = [value];
				this.each(function () {
					if (this.tagName.toLowerCase() == 'input' && this.type == 'checkbox') {
						var box = this;
						values.forEach(function (v, i, vs) {
							if (box.value == v) box.checked = 'checked';
							else box.removeAttribute('checked');
						});
					}
				});
			} else if (this.tag() == 'input' && this.attr('type') == 'radio') {
				this.each(function () {
					if (this.tagName.toLowerCase() == 'input' 
						&& this.type == 'radio' 
						&& this.value == value) 
						this.checked = 'checked';
					else 
						this.removeAttribute('checked');
				});
			} else if (this.tag() == 'input' || this.tag() == 'textarea') {
				this.each(function () {
					if (this.tagName.toLowerCase() == 'input' 
						|| this.tagName.toLowerCase() == 'textarea') 
						this.value = value;
				});
			}
			return this;
		} else {
			if (this.length) {
				if (this.tag() == 'select') {
					var options = this.children();
					for (var i = 0; i < options.length; i++) {
						if (options[i].selected) {
							return options[i].value || '';
						}
					}
				} else if (this.tag() == 'input' && this.attr('type') == 'checkbox') {
					var valueList = [];
					for (var i = 0; i < this.length; i++)
						if (this[i].tagName.toLowerCase() != 'input' || this[i].type == 'checkbox') 
							return '';
						else if (this[i].checked) valueList.push(this[i].value || '');
							return valueList;
				} else if (this.tag() == 'input' && this.attr('type') == 'radio') {
					for (var i = 0; i < this.length; i++)
						if (this[i].tagName.toLowerCase() != 'input' || this[i].type != 'radio') 
							return '';
						else if (this[i].checked) 
							return this[i].value || '';
				} else if (this.tag() == 'textarea') {
					return arguments[1] ? $.htmlEncode(this[0].value || '') : this[0].value || '';
				} else {
					return this[0].value || '';
				}
			}
		}
	}
	Swift.prototype.id = function (value) {
		return this.attr('id', value);
	}
	Swift.prototype.hasClass = function (name) {
		if (this.length) {
			if (!('classList' in this[0])) {
				bindClassList(this[0]);
			}
			return this[0].classList.contains(name);
		}
		return false;
	}
	Swift.prototype.addClass = function (name) {
		var names = name.split(/\s+/);
		this.each(function (i) {
			var ele = this;
			if (!('classList' in ele)) {
				bindClassList(ele);
			}
			names.forEach(function(name) {
				ele.classList.add(name);
			});
		});
		return this;
	}
	Swift.prototype.removeClass = Swift.prototype.rmClass = function (name) {
		var names = name.split(/\s+/);
		this.each(function (i) {
			var ele = this;
			if (!('classList' in ele)) {
				bindClassList(ele);
			}
			names.forEach(function(name) {
				ele.classList.add(name);
				ele.classList.remove(name);
			});
		});
		return this;
	}
	Swift.prototype.toggleClass = function() {
		/*
			Add or remove one or more classes from each element in the set of matched elements, depending on either the class's presence or the value of the switch argument.
			.toggleClass(className)
			.toggleClass(className, switch)
			.toggleClass([switch])
			.toggleClass(function(index, class, switch) [, switch])
		*/
		if ($.checkTypes(arguments, ['string'])) {
			if (arguments[1] === false) return;
			arguments[0].split('/\s+/').forEach(function(className) {
				this.toggleClass(className);
			});
		} else if ($.checkTypes(arguments, ['boolean'])) {
			// TODO 2
		} else if ($.checkTypes(arguments, ['function', 'boolean'])) {
			// TODO 2
		}
		return this;
	}
	Swift.prototype.html = function () {
		if (arguments.length) {
			if (typeof arguments[0] === 'function') {
				var callback = arguments[0];
				this.each(function (i) {
					this.innerHTML = callback.call(this, i, this.innerHTML);
				});
			} else {
				var htmlStr = arguments[0];
				this.each(function () {
					this.innerHTML = htmlStr;
				});
			}
			return this;
		} else if (this.length) {
			return this[0].innerHTML;
		} else {
			return undefined;
		}
		return this;
	}
	Swift.prototype.css = function (name) {
		if ($.checkTypes(arguments, ['string'], true)) {
			if (!this.length) return undefined;
			if (this[0].currentStyle)
				return this[0].currentStyle[$.styleName(name)];
			else if (document.defaultView.getComputedStyle)
				return document.defaultView.getComputedStyle(this[0], null).getPropertyValue(name);
		} else if ($.checkTypes(arguments, ['string', 'string'], true)) {
			var elem = this[0],
				name = arguments[0],
				value = arguments[1];
			if (elem && elem.nodeType !== 3 && elem.nodeType !== 8 && elem.style)
				this.each(function () {
					name = $.styleName(name);
					this.style[name] = value;
				});
		} else if ($.checkTypes(arguments, ['object'], true)) {
			var styles = arguments[0];
			for (var name in styles) {
				this.css(name, styles[name]);
			}
		} else {
			throw new TypeError();
		}
		return this;
	}
	Swift.prototype.userStyle = function (name) {
		if (name && this.length)
			return this[0].style[$.styleName(name)];
	}
	Swift.prototype.width = function (value) {
		if (this.isWindow()) {
			return window.outerWidth;
		} else if ($.inArray(this.get(0), [document, document.documentElement])) {
			return Math.max(document.documentElement['clientWidth'], document.documentElement['scrollWidth'], document.documentElement['offsetWidth']);
		}
		if (arguments.length) {
			if (!$.isInt(value)) {
				return this.css('width', value);
			} else {
				return this.css('width', value + 'px');
			}
		} else if (this.length) {
			return $.pixelAsInt(this.css('width'));
		}
	}
	Swift.prototype.innerWidth = function () {
		if (this.isWindow()) {
			return window.innerWidth;
		} else if ($.inArray(this.get(0), [document, document.documentElement])) {
			return Math.min(document.documentElement['clientWidth'], document.documentElement['scrollWidth'], document.documentElement['offsetWidth']);
		}
		var width = $.pixelAsInt(this.width());
		var paddingLeftWidth = $.pixelAsInt(this.css('padding-left')) || 0;
		var paddingRightWidth = $.pixelAsInt(this.css('padding-right')) || 0;
		var borderLeftWidth = $.pixelAsInt(this.css('border-left-width')) || 0;
		var borderRightWidth = $.pixelAsInt(this.css('border-right-width')) || 0;
		return width + paddingLeftWidth + paddingRightWidth + borderLeftWidth + borderRightWidth;
	}
	Swift.prototype.outterWidth = function () {
		if (this.isWindow()) {
			return window.outterWidth;
		} else if ($.inArray(this.get(0), [document, document.documentElement])) {
			return Math.max(document.documentElement['clientWidth'], document.documentElement['scrollWidth'], document.documentElement['offsetWidth']);
		}
		var innerWidth = $.pixelAsInt(this.innerWidth());
		var marginLeftWidth = $.pixelAsInt(this.css('margin-left')) || 0;
		var marginRightWidth = $.pixelAsInt(this.css('margin-right')) || 0;
		return innerWidth + marginLeftWidth + marginRightWidth;
	}
	Swift.prototype.height = function (value) {
		if (this.isWindow()) {
			return window.outerHeight;
		} else if ($.inArray(this.get(0), [document, document.documentElement])) {
			return Math.max(document.documentElement['clientHeight'], document.documentElement['scrollHeight'], document.documentElement['offsetHeight']);
		}
		if (arguments.length) {
			if (!$.isInt(value)) {
				return this.css('height', value);
			} else {
				return this.css('height', value + 'px');
			}
		} else if (this.length) {
			return $.pixelAsInt(this.css('height'));
		}
	}
	Swift.prototype.innerHeight = function () {
		if (this.isWindow()) {
			return window.innerHeight;
		} else if ($.inArray(this.get(0), [document, document.documentElement])) {
			return Math.min(document.documentElement['clientHeight'], document.documentElement['scrollHeight'], document.documentElement['offsetHeight']);
		}
		var height = $.pixelAsInt(this.height());
		var paddingLeftHeight = $.pixelAsInt(this.css('padding-left')) || 0;
		var paddingRightHeight = $.pixelAsInt(this.css('padding-right')) || 0;
		var borderLeftHeight = $.pixelAsInt(this.css('border-left-width')) || 0;
		var borderRightHeight = $.pixelAsInt(this.css('border-right-width')) || 0;
		return height + paddingLeftHeight + paddingRightHeight + borderLeftHeight + borderRightHeight;
	}
	Swift.prototype.outterHeight = function () {
		if (this.isWindow()) {
			return window.outterHeight;
		} else if ($.inArray(this.get(0), [document, document.documentElement])) {
			return Math.max(document.documentElement['clientHeight'], document.documentElement['scrollHeight'], document.documentElement['offsetHeight']);
		}
		var innerHeight = $.pixelAsInt(this.innerHeight());
		var marginLeftHeight = $.pixelAsInt(this.css('margin-left')) || 0;
		var marginRightHeight = $.pixelAsInt(this.css('margin-right')) || 0;
		return innerHeight + marginLeftHeight + marginRightHeight;
	}
	Swift.prototype.offset = function () {
		if (this.length === 0)
			return arguments.length ? this : undefined;
		if (arguments.length == 0) {
			var ele = this[0],
				curLeft = curTop = 0;
			if (!ele.offsetParent) {
				curLeft += ele.offsetLeft;
				curTop += ele.offsetTop;
				curLeft += $.pixelAsInt($(ele).css('margin-left')) || 0;
				curTop += $.pixelAsInt($(ele).css('margin-top')) || 0;
			} else {
				do {
					curLeft += ele.offsetLeft;
					curTop += ele.offsetTop;
				} while (ele = ele.offsetParent);
			}
			return {left: curLeft, top: curTop};
		} else if (typeof arguments[0] === 'object') {
			var coordinates = arguments[0];
			coordinates.left = coordinates.left.toString().endswith('px') ? coordinates.left.substr(0, coordinates.left.length-2) : coordinates.left;
			coordinates.top = coordinates.top.toString().endswith('px') ? coordinates.top.substr(0, coordinates.top.length-2) : coordinates.top;
			
			if (this.css('position') === 'static') {
				this.css('position', 'relative');
			}
			if (this.css('position') === 'relative') {
				if (this[0].offsetParent) {
					var parentOffset = this.offset();
					coordinates.left = coordinates.left - parentOffset.left;
					coordinates.top = coordinates.top - parentOffset.top;
				}
			}
			this.css({
				'left': coordinates.left + 'px',
				'top': coordinates.top + 'px'
			});
		} else if (typeof arguments[0] === 'function') {
			var callback = arguments[0];
			this.each(function(i) {
				$(this).offset(callback.call(this, i, ele.offset()));
			});
		}
		return this;
	}
	Swift.prototype.position = function () {
		if (this.length) {
			var ele = this[0],
				curLeft = curTop = 0;
			do {
				curLeft += ele.offsetLeft;
				curTop += ele.offsetTop;
			} while (ele = ele.offsetParent);
			return {left: curLeft, top: curTop};
		}
		return this;
	}
	Swift.prototype.scrollLeft = function() {
		if (this.length) {
			var ele = this[0];
			if (arguments.length) {
				var value = arguments[0];
				if (typeof value === 'string' && value.endswith('px'))
					value = $.pixelAsInt(value);
				if (ele === document.body || ele === window) {
					if (window.pageXOffset)
						window.pageXOffset = value;
					if (document.documentElement)
						document.documentElement.scrollLeft = value;
					if (document.body)
						document.body.scrollLeft = value;
				} else {
					if (ele.scrollLeft !== undefined)
						ele.scrollLeft = value;
					if (ele.pageXOffset !== undefined)
						ele.pageXOffset = value;
				}
				return this;
			} else {
				if (ele === document.body || ele === window) {
					return f_scrollLeft(this[0]);
				} else {
					if (ele.scrollLeft !== undefined)
						return ele.scrollLeft;
					if (ele.pageXOffset !== undefined)
						return ele.pageXOffset;
					return undefined;
				}
			}
		} else {
			return null;
		}
	}
	Swift.prototype.scrollTo = function(x, y) {
		// TODO
	}
	Swift.prototype.scrollBy = function(x, y) {
		// TODO
	}
	Swift.prototype.scrollTop = function() {
		if (this.length) {
			var ele = this[0];
			if (arguments.length) {
				var value = arguments[0];
				if (typeof value === 'string' && value.endswith('px'))
					value = $.pixelAsInt(value);
				if (ele === document.body || ele === window) {
					if (window.pageYOffset)
						window.pageYOffset = value;
					if (document.documentElement)
						document.documentElement.scrollTop = value;
					if (document.body)
						document.body.scrollTop = value;
				} else {
					if (ele.scrollTop !== undefined)
						ele.scrollTop = value;
					if (ele.pageYOffset !== undefined)
						ele.pageYOffset = value;
				}
				return this;
			} else {
				if (ele === document.body || ele === window) {
					return f_scrollTop(this[0]);
				} else {
					if (ele.scrollTop !== undefined)
						return ele.scrollTop;
					if (ele.pageYOffset !== undefined)
						return ele.pageYOffset;
					return undefined;
				}
			}
		} else {
			return null;
		}
	}
	function f_clientWidth() {
		return f_filterResults (
			window.innerWidth ? window.innerWidth : 0,
			document.documentElement ? document.documentElement.clientWidth : 0,
			document.body ? document.body.clientWidth : 0
		);
	}
	function f_clientHeight() {
		return f_filterResults (
			window.innerHeight ? window.innerHeight : 0,
			document.documentElement ? document.documentElement.clientHeight : 0,
			document.body ? document.body.clientHeight : 0
		);
	}
	function f_scrollLeft() {
		return f_filterResults (
			window.pageXOffset ? window.pageXOffset : 0,
			document.documentElement ? document.documentElement.scrollLeft : 0,
			document.body ? document.body.scrollLeft : 0
		);
	}
	function f_scrollTop() {
		return f_filterResults (
			window.pageYOffset ? window.pageYOffset : 0,
			document.documentElement ? document.documentElement.scrollTop : 0,
			document.body ? document.body.scrollTop : 0
		);
	}
	function f_filterResults(n_win, n_docel, n_body) {
		var n_result = n_win ? n_win : 0;
		if (n_docel && (!n_result || (n_result > n_docel)))
			n_result = n_docel;
		return n_body && (!n_result || (n_result > n_body)) ? n_body : n_result;
	}
	Swift.prototype.data = function (name, value) {
		if (!this.length)
			return name ? this : undefined;
		if (arguments.length === 0) {
			return global.data[this[0]];
		} else if ($.checkTypes(arguments, ['string'], true)) {
			return global.data[this[0]] && global.data[this[0]][name];
		} else if ($.checkTypes(arguments, ['object'], true)) {
			var values = arguments[0];
			this.each(function() {
				for (var name in values) {
					$(this).data(name, values[name]);
				}
			});
		} else if (arguments.length == 2) {
			this.each(function() {
				if (!global.data[this])
					global.data[this] = {}
				global.data[this][name] = value;
			});
		}
		return this;
	}
	Swift.prototype.removeData = Swift.prototype.rmData = function (name) {
		if (this.length) {
			if (arguments.length === 0) {
				this.each(function() {
					if(global.data[this]) {
						delete global.data[this];
					}
				});
			} else if (typeof name === 'string') {
				var names = name.trim().split(/\s+/);
				this.each(function() {
					if(global.data[this]) {
						for (var i in names) {
							delete global.data[this][names[i]];
						}
						if ($.isEmptyObject($(this).data())) {
							delete global.data[this];
						}
					}
				});
			} else if (typeof name === 'object') {
				this.each(function() {
					if(global.data[this]) {
						for (var i=0; i<name.length; i++) {
							delete global.data[this][name[i]];
						}
						if ($.isEmptyObject($(this).data())) {
							delete global.data[this];
						}
					}
				});
			}
		}
	}
	Swift.prototype.quque = function() {
		// TODO 2
	}
	Swift.prototype.dequque = function() {
		// TODO 2
	}
	Swift.prototype.clearQueue = function() {
		// TODO 2
	}
	Swift.prototype.add = function (other, context) { // TEST
		if (context)
			other = $(other, context);
		else
			other = $(other);
		var newObj = $(this.get());
		if (other.length != undefined) {
			for (var i = 0; i < other.length; i++) {
				if (! newObj.has(other[i]))
					newObj.push(other[i]);
			}
		} else {
			if (! newObj.has(other))
				newObj.push(other);
		}
		return this.pushStack(newObj, 'add', arguments);
	}
	Swift.prototype.andSelf = function() {
		var lastSwift = this.stack.slice(-1)[0];
		if (lastSwift) {
			lastSwift = lastSwift.swift;
			for (var i = 0; i < lastSwift.length; i++) {
				if (! this.has(lastSwift[i]))
					this.push(lastSwift[i]);
			}
		}
		return this;
	}
	Swift.prototype.serializeObject = function () {
		if (this.length && this.tag() == 'form') {
			var eles = this[0].elements,
				data = {};
			for (var i = 0; i < eles.length; i++) {
				var ele = eles[i];
				data[ele.name] = $(ele).val() || '';
			}
			return data;
		}
	}
	Swift.prototype.serialize = function () {
		if (this.length && this.tag() == 'form') {
			var data = this.serializeObject(),
				mappings = [];
			for (var k in data)
				mappings.push('%s=%s'.fs(k, encodeURIComponent(data[k])));
			return mappings.join('&');
		}
	}
	Swift.prototype.serializeArray = function () {
		if (this.length && this.tag() == 'form') {
			var data = this.serializeObject(),
				mappings = [];
			for (var k in data)
				mappings.push({k: encodeURIComponent(data[k])});
			return mappings;
		}
	}
	function AjaxEvent(context, event, handler) {
		this.context = context;
		this.event = event;
		this.handler = handler;
		this.ajaxHandler = function() {
			if (event == 'ajaxStart' && global.runningAjaxCount !== 1) {
				return;
			} else if (event == 'ajaxStop' && global.runningAjaxCount !== 0) {
				return;
			} else {
				handler.apply(context, arguments);
			}
		}
	}
	Swift.prototype.bind = function(event, handler) {
		if (event.startswith('ajax')) {
			this.each(function() {
				var ajaxEvent = new AjaxEvent(this, event, handler);
				global.ajaxEvents.push(ajaxEvent);
			});
		} else if ($.checkTypes(arguments, ['string', 'object', 'boolean'], true) ||
			$.checkTypes(arguments, ['string', 'boolean'], true)) {
				// TODO 2
				$.error('.bind( eventType [, eventData], preventBubble ) is not implemented');
				return this;
		} else {
			return this.on.apply(this, arguments);
		}
		return this;
	}
	Swift.prototype.unbind = function(event, handler) {
		if (event.startswith('ajax')) {
			this.each(function() {
				for (var i=0; i<global.ajaxEvents.length; i++) {
					var ajaxEvent = global.ajaxEvents[i];
					if (ajaxEvents.event === event && ajaxEvents.handler === handler) {
						global.ajaxEvents = $.merge(global.ajaxEvents.slice(0, i), global.ajaxEvents.slice(i+1));
						break;
					}
				}
				var ajaxEvent = new AjaxEvent(this, event.slice(4).toLowerCase(), handler);
				global.ajaxEvents.push(ajaxEvent);
			});
		} else if (arguments[1] === false) {
			$.error('.unbind( eventType, false ) is not implemented');
			return this;
		} else {
			return this.off.apply(this, arguments);
		}
		return this;
	}
	Swift.prototype.ajaxStart = function(handler) {
		this.bind('ajaxStart', handler);
	}
	Swift.prototype.ajaxComplete = function(handler) {
		this.bind('ajaxComplete', handler);
	}
	Swift.prototype.ajaxError = function(handler) {
		this.bind('ajaxError', handler);
	}
	Swift.prototype.ajaxSend = function(handler) {
		this.bind('ajaxSend', handler);
	}
	Swift.prototype.ajaxSetup = function(handler) {
		this.bind('ajaxSetup', handler);
	}
	Swift.prototype.ajaxStop = function(handler) {
		this.bind('ajaxStop', handler);
	}
	Swift.prototype.ajaxSuccess = function(handler) {
		this.bind('ajaxSuccess', handler);
	}
	Swift.prototype.load = function () {
		var sw = this,
			url, data, completeHanlder;
		if ($.checkTypes(arguments, ['string', 'object', 'function'])) {
			url = arguments[0],
			data = arguments[1],
			completeHanlder = arguments[2];
		} else if ($.checkTypes(arguments, ['string', 'object'], true)) {
			url = arguments[0],
			data = arguments[1];
		} else if ($.checkTypes(arguments, ['string', 'function'])) {
			url = arguments[0],
			completeHanlder = arguments[1];
		}
		return $.ajax({url: url, data: data, async: false, complete: completeHanlder, success: function(ret) {
			sw.html(ret);
		}});
	}
	Swift.prototype.ajaxPrefilter = function () {
		if (arguments.length == 1) {
			var dataTypes = '*', handler = arguments[0];
		} else {
			var dataTypes = arguments[0], handler = arguments[1];
		}
		global.ajaxPrefilters[dataTypes]  = handler;
	}
	Swift.prototype.reverse = function () {
		Array.prototype.reverse.call(this);
		return this;
	}
	Swift.prototype.after = function (arg) {
		if (arguments.length === 1) {
			if ($.isFunction(arg)) {
				this.each(function(i) {
					$(this).after(arg.call(this, i));
				});
			} else if (arg.swift) {
				var self = this;
				arg.reverse().each(function(_, ele) {
					self.each(function(index) {
						var parent = this.parentNode;
						if ( ! parent || parent === document)
							return;
						var children = parent.childNodes,
							next;
						for (var i=0; i<children.length; i++) {
							if (children[i] === this) {
								next = children[i+1];
								break;
							}
						}
						parent.insertBefore(index ? ele.cloneNode(true) : ele, next);
					});
				}).reverse();
			} else {
				this.after($(arg));
			}
		} else {
			var self = this;
			$.each(arguments, function(_, arg) {
				self.after(arg);
			});
		}
		return this;
	}
	Swift.prototype.before = function (arg) {
		if (arguments.length === 1) {
			if ($.isFunction(arg)) {
				this.each(function(i) {
					$(this).before(arg.call(this, i));
				});
			} else if (arg.swift) {
				var self = this;
				arg.each(function(_, ele) {
					self.each(function(index) {
						var parent = this.parentNode;
						if ( ! parent || parent === document)
							return;
						parent.insertBefore(index ? ele.cloneNode(true) : ele, this);
					});
				});
			} else {
				this.before($(arg));
			}
		} else {
			var self = this;
			$.each(arguments, function(_, arg) {
				self.before(arg);
			});
		}
		return this;
	}
	var obj = {
		insertBefore: 'before',
		insertAfter: 'after'
	};
	for (var name in obj) {
		(function(name, orig) {
			Swift.prototype[name] = function(target) {
				if ($.isString(target) || $.isNode(target)) {
					return this[name]($(target));
				} else if ($.isList(target)) {
					var newSet = [];
					var src = this;
					$(target).each(function(index) {
						for (var i=0; i<src.length; i++) {
							var ele = index ? src[i].cloneNode(true) : src[i];
							newSet.push(ele);
							$(this)[orig](ele);
						}
					});
					return newSet;
				}
			}
		})(name, obj[name]);
	}
	obj = null;
	Swift.prototype.append = function (other) {
		if (!other)
			throw new TypeError();
		if (this.length) {
			if ($.isFunction(other)) {
				this.append(other.call(this, i, this.innerHTML));
			} else if (other.swift) {
				this.each(function(index) {
					var frag = document.createDocumentFragment();
					other.each(function() {
						frag.appendChild(index ? this.cloneNode(true) : this);
					});
					this.appendChild(frag);
				});
			} else {
				this.append($(other));
			}
		}
		return this;
	}
	Swift.prototype.prepend = function (other) {
		if (!other)
			throw new TypeError();
		if (this.length) {
			if ($.isFunction(other)) {
				this.prepend(other.call(this, i, this.innerHTML));
			} else if (other.swift) {
				this.each(function(index) {
					var frag = document.createDocumentFragment();
					other.each(function() {
						frag.appendChild(index ? this.cloneNode(true) : this);
					});
					this.insertBefore(frag, this.firstChild);
				});
			} else {
				this.prepend($(other));
			}
		}
		return this;
	}
	var obj = {
		appendTo: 'append',
		prependTo: 'prepend'
	};
	for (var name in obj) {
		(function(name, orig) {
			Swift.prototype[name] = function (other) {
				if (!other)
					throw new TypeError();
				if (this.length) {
					if (other.swift) {
						var newSet = [];
						var src = this;
						other.each(function(index) {
							for (var i=0; i<src.length; i++) {
								var ele = index ? src[i].cloneNode(true) : src[i];
								newSet.push(ele);
								$(this)[orig](ele);
							}
						});
						return $(newSet);
					} else {
						this[name]($(other));
					}
				}
				return this;
			}
		})(name, obj[name]);
	}
	obj = null;
	Swift.prototype.attr = function () {
		if (!arguments.length)
			throw new TypeError();
		if (this.length) {
			if ($.checkTypes(arguments, ['string'], true)) {
				var name = arguments[0];
				if (name === 'tag')
					return this[0].tagName.toLowerCase();
				if (name === 'checked' && 
				    this[0].tagName.toLowerCase() === 'input' && 
				    this[0].getAttribute('type').toLowerCase() in ['checked', 'radio']
				    ||
				    name === 'selected' && 
				    this[0].tagName.toLowerCase() === 'option')
						return this[0].getAttribute(name) !== null;
				return this[0].getAttribute(name) || undefined;
			} else if ($.checkTypes(arguments, ['object'], true)) {
				var attrs = arguments[0];
				for (var name in attrs) {
					this.attr(name, attrs[name]);
				}
			} else if (arguments.length === 2) {
				var name = arguments[0];
				if (typeof name === 'string') {
					if (typeof arguments[1] === 'function') {
						var callback = arguments[1];
						this.each(function(i) {
							$(this).attr(name, callback.call(this, i, $(this).attr(name)));
						});
					} else {
						var value = arguments[1];
						this.each(function () {
							if (name === 'checked' && 
							    value === true && 
							    this.tagName.toLowerCase() === 'input' && 
							    (this.getAttribute('type').toLowerCase() == 'checkbox' || 
							    this.getAttribute('type').toLowerCase() == 'radio'))
							
								this.setAttribute(name, 'checked');
							else if (name === 'checked' && 
							         value === false && 
							        (this.getAttribute('type').toLowerCase() == 'checkbox' || 
							        this.getAttribute('type').toLowerCase() == 'radio'))
							
								this.removeAttribute(name);
							else if (name === 'selected' && 
							         value === true && 
							         this.tagName.toLowerCase() === 'option')
							
								this.setAttribute(name, 'selected');
							else if (name === 'selected' && 
							         value === false && 
							         this.tagName.toLowerCase() === 'option')
							
								this.removeAttribute(name);
							else
								this.setAttribute(name, value);
						});
					}
				} else {
					throw new TypeError();
				}
			}
		}
		return this;
	}
	Swift.prototype.removeAttr = Swift.prototype.rmAttr = function (name) {
		if (!arguments.length)
			throw new TypeError();
		var names = name.split(/\s+/);
		this.each(function () {
			var ele = this;
			names.forEach(function(name) {
				ele.removeAttribute(name);
			});
		});
		return this;
	}
	Swift.prototype.closest = function (selector, context) {
		if (selector) {
			var eles = $(selector, context),
				foundEles = [];
			this.each(function() {
				var found = undefined;
				if ($.inArray(this, eles)) {
					found = this;
				}
				if (! found) {
					var parent = $(this).parent();
					if (parent) {
						found = parent.closest(selector, context);
						if (found) {
							found = found[0];
						}
					}
				}
				if (found && ! $.inArray(found, foundEles)) {
					foundEles.push(found);
				}
			});
			return $(foundEles);
		}
		return $([]);
	}
	Swift.prototype.contents = function () {
		var contents = [];
		this.each(function() {
			contents = contents.concat($.slice(this.childNodes));
		});
		return $(contents);
	}
	Swift.prototype.end = Swift.prototype.popStack = function () {
		var lastRecord = this.stack.pop();
		if (lastRecord)
			return lastRecord.swift;
		return new Swift([]);
	}
	Swift.prototype.has = function (other) {
		if (this.length) {
			return $.inArray($(other)[0], this);
		}
		return false;
	}
	Swift.prototype.is = function (other) {
		var is = true;
		if (typeof other == 'function') {
			this.each(function(index) {
				if (is)
					is = !!other.call(this, index);
			});
		} else {
			other = $(other);
			this.each(function() {
				if (is)
					is = other.has(this);
			});
		}
		return is;
	}
	Swift.prototype.map = function (callback) {
		return $.map(this, function(item, index, items) {
			callback.call(item, index, items);
		});
	}
	Swift.prototype.isWindow = function () {
		return this.get(0) === window;
	}
	var obj = ['next', 'prev', 'nextAll', 'prevAll'];
	obj.forEach(function(name) {
		var targetEleName = name.startswith('next') ? 'nextSibling' : 'previousSibling';
		Swift.prototype[name] = function (selector) {
			if (selector) {
				var eles = $(selector);
			} else {
				var eles = undefined;
			}
			var ret = [];
			this.each(function() {
				var ele = this;
				while(ele = ele[targetEleName]) {
					if (ele.nodeType == 1 && 
						(eles === undefined || $.inArray(ele, eles)) && 
						!$.inArray(ele, ret)) {
						ret.push(ele);
						if (!name.endswith('All')) break;
					}
				}
			});
			return this.pushStack($(ret), name, selector);
		}
	});
	obj = null;
	var obj = ['next', 'prev', 'parents'];
	obj.forEach(function(name) {
		var targetEleName = {'next': 'nextSibling', 
							 'prev': 'previousSibling', 
							 'parents': 'parentElement'
							}[name];
		Swift.prototype[name+'Until'] = function (until, filter) {
			if (until) {
				until = $(until);
			} else {
				until = undefined;
			}
			if (filter) {
				filter = $(filter);
			} else {
				filter = undefined;
			}
			var ret = [];
			this.each(function() {
				var ele = this;
				while(ele = ele[targetEleName]) {
					if (until && $.inArray(ele, until)) break;
					if (ele.nodeType == 1 && 
						(filter === undefined || $.inArray(ele, filter)) && 
						!$.inArray(ele, ret)) {
						ret.push(ele);
					}
				}
			});
			return this.pushStack($(ret), name+'Until', until, filter);
		}
	});
	obj = null;
	Swift.prototype.offsetParent = function () {
		var ret = [];
		this.each(function() {
			ret.push(this.offsetParent ? this.offsetParent : document.body);
		});
		return this.pushStack($(ret), 'offsetParent');
	}
	Swift.prototype.siblings = function (selector) {
		var ret = [];
		this.each(function() {
			var parent = $(this).parent();
			if (parent.length) {
				parent.children().not(this).slice().each(function(i, ele) {
					if (!$.inArray(ele, ret)) {
						ret.push(ele);
					}
				});
			}
		});
		return this.pushStack($(ret), 'siblings', selector);
	}
	
	Swift.prototype.clone = function (withDataAndEvents, deepWithDataAndEvents) {
		var newEles = [];
		this.each(function () {
			var newEle = this.cloneNode(true);
			newEles.push(newEle);
			if ((deepWithDataAndEvents || withDataAndEvents)) {
				for (var i=0; i<global.events.length; i++) {
					var swift_event = global.events[i];
					if (swift_event.context === this) {
						var new_swift_event = swift_event.clone();
						new_swift_event.context = newEle;
						new_swift_event.bind();
						global.events.push(new_swift_event);
					}
				}
				if (global.data[this]) {
					global.data[newEle] = JSON.parse(JSON.stringify(global.data[this]));
				}
			}
			if (deepWithDataAndEvents && $(this).children().length) {
				var children = [];
				$(this).children().each(function() {
					children.push($(this).clone(true, true));
				});
				$(this).empty();
				$(this).append(children);
			}
		});
		return $(newEles);
	}
	Swift.prototype.empty = function() {
		return this.each(function() {
			this.innerHTML = '';
		});
	}
	Swift.prototype.detach = Swift.prototype.remove = function () {
		this.each(function () {
			this.parentNode.removeChild(this);
		});
		return this;
	}
	Swift.prototype.wrap = function (wrapper) {
		if (this.length) {
			if (arguments.length) {
				if (typeof wrapper === 'function') {
					this.each(function(i) {
						var ele = wrapper.call(this, i);
						$(this).wrap(ele);
					});
				} else {
					wrapper = $(wrapper).clone();
					while (true) {
						if (wrapper.children().length == 0) { // inmost element as real wrapper
							this.each(function() {
								var ele = wrapper.clone();
								$(this).after(ele).appendTo(ele);
							});
							break;
						} else if (wrapper.children().length == 1) {
							wrapper = $(wrapper.children()[0]);
						} else {
							throw new Error('Invalid Argument, argument should contain only one inmost elemen');
						}
					}
				}
				return this;
			} else {
				throw new Error('Invalid Argument');
			}
		}
		return this;
	}
	Swift.prototype.unwrap = function () {
		if (this.length) {
			this.each(function() {
				var parent = this.parentNode;
				if (parent) {
					$(this).insertAfter(parent);
					$(parent).remove();
				}
			});
		}
		return this;
	}
	Swift.prototype.wrapInner = function (wrapper) {
		if (this.length) {
			if (arguments.length) {
				this.each(function(i) {
					if (typeof wrapper === 'function') {
						wrapper = wrapper.call(this, i);
					}
					wrapper = $(wrapper).clone();
					var oldChildren = Array.prototype.slice.call(this.childNodes, 0);
					$(this).append(wrapper);
					while (true) {
						if (wrapper.children().length == 0) { // inmost element as real wrapper
							$(oldChildren).appendTo(wrapper);
							break;
						} else if (wrapper.children().length == 1) {
							wrapper = $(wrapper.children()[0]);
						} else {
							throw new Error('Invalid Argument');
						}
					}
				});
			} else {
				throw new Error('Invalid Argument');
			}
		}	
		return this;
	}
	Swift.prototype.wrapAll = function (wrapper) {
		if (this.length) {
			if (arguments.length) {
				if (typeof wrapper === 'function') {
					this.each(function(i) {
						var ele = wrapper.call(this, i);
						$(this).wrap(ele);
					});
				} else {
					wrapper = $(wrapper).clone();
					while (true) {
						if (wrapper.children().length == 0) { // inmost element as real wrapper
							var ele = wrapper.clone(true);
							$(this[0]).after(ele);
							$(this).appendTo(ele);
							break;
						} else if (wrapper.children().length == 1) {
							wrapper = $(wrapper.children()[0]);
						} else {
							throw new Error('Invalid Argument');
						}
					}
				}
			} else {
				throw new Error('Invalid Argument');
			}
		}	
		return this;
	}
	Swift.prototype.replaceAll = function (replacement) {
		var replacer = this.remove(),
			replacement = $(replacement),
			replaced = replacer.get();
		replacement.each(function (i) {
			if (1 == replacer.length && this === replacer[0])
				return;
			var replacementCopy = replacer.clone();
			$(this).after(replacementCopy).remove();
			replaced.add(replacementCopy);
		});
		return replaced;
	}
	Swift.prototype.replaceWith = function (replacer) {
		if (arguments.length) {
			if (typeof replacer == 'function') {
				this.each(function(i) {
					replacer = replacer.call(this, i);
					$(this).after(replacer).remove();
				});
			} else {
				replacer = $(replacer).remove();
				this.each(function() {
					if (this.parentNode)
						$(this).after(replacer.clone()).remove();
				});
			}
		}
		return this;
	}
	Swift.prototype.parent = function (selector) {
		if (selector) {
			var eles = $(selector);
		} else {
			var eles = undefined;
		}
		var ret = [];
		this.each(function() {
			var ele = this.parentElement;
			if(ele && (eles === undefined || $.inArray(ele, eles)) && !$.inArray(ele, ret)) {
				ret.push(ele);
			}
		});
		return this.pushStack($(ret), name, selector);
	}
	Swift.prototype.parents = function (selector) {
		if (selector) {
			var eles = $(selector);
		} else {
			var eles = undefined;
		}
		var ret = [];
		this.each(function() {
			var ele = this;
			while(ele = ele.parentElement) {
				if((eles === undefined || $.inArray(ele, eles)) && !$.inArray(ele, ret)) {
					ret.push(ele);
				}
			}
		});
		return this.pushStack($(ret), name, selector);
	}
	Swift.prototype.children = function () {
		var children = [];
		this.each(function() {
			$.grep(this.childNodes, function (ele) {
				return ele.nodeType === 1;
			}).forEach(function(child) {
				children.push(child);
			});
		});
		return $(children);
	}
	Swift.prototype.classes = function () {
		if (this.length) {
			if (!('classList' in this[0])) {
				bindClassList(ele);
			}
		}
		return this[0].classList;
	}
	Swift.prototype.hide = function (speed) {
		if (!speed) return this.css('display', 'none');
		var orgwidth = this.css('width');
		var orgheight = this.css('height');
		return this.animate({
			width: 0,
			height: 0
		}, speed, function () {
			this.hide();
			this.css({
				width: orgwidth,
				height: orgheight
			});
		});
	}
	Swift.prototype.show = function (speed) {
		if (!speed) return this.css('display', $.isinline(this.tag()) ? 'inline' : 'block');
		var orgwidth = this.css('width'),
			orgheight = this.css('height'),
			dsp = this.css('display');
		this.show();
		var width = this.width(),
			height = this.height();
		this.css({
			width: 0,
			height: 0
		});
		return this.animate({
			width: width,
			height: height
		}, speed, function () {
			this.css({
				width: orgwidth,
				height: orgheight
			});
		});
	}
	Swift.prototype.text = function (text) {
		if (arguments.length) {
			if (typeof text == 'function') {
				this.each(function(i) {
					$(this).text(text.call(this, i, $(this).text()));
				});
			} else {
				this.each(function() {
					this.textContent = text;
				});
			}
			return this;
		} else {
			var text = '';
			this.each(function() {
				Array.prototype.forEach.call(this.childNodes, function(node) {
					text += node.textContent;
				});
			});
			return text;
		}
	}
	Swift.prototype.filter = function (selector, context) {
		if (typeof selector == 'function') {
			var ret = $($.grep(this, selector));
		} else {
			var eles = $(selector, context);
			var ret = $($.grep(this, function(ele) {
				return $.inArray(ele, eles);
			}));
		}
		return this.pushStack(ret, 'filter', selector);
	}
	Swift.prototype.not = function (selector, context) {
		if (typeof selector == 'function') {
			var ret = $($.grep(this, selector, true));
		} else {
			var eles = $(selector, context);
			var ret = $($.grep(this, function(ele) {
				return $.inArray(ele, eles);
			}, true));
		}
		return this.pushStack(ret, 'filter', selector);
	}
	Swift.prototype.dialog = function (param) {
		if (!arguments.length) param = {};
		if (this.length !== 1) return this;

		if (!this.length || !param || !(param instanceof Object)) return;
		var userDlg = this,
			oldParent = this.parent();
		var dlg = userDlg.dialog = $('<div></div>')
			.addClass('swift-dialog')
			.width(param.width)
			.height(param.height)
			.css('border', 'solid 5px #777')
			.css('box-shadow', '0 0 10px #777')
			.css('background', '#FFF')
			.css(param.style);

		var bgDiv = param.modal ? $('<div></div>')
			.css('z-index', '999')
			.css('position', 'fixed')
			.css('left', 0)
			.css('top', 0)
			.css('right', 0)
			.css('bottom', 0)
			.css('background', param.bgBackgroundColor || 'rgba(0, 0, 0, %s)'.fs(param.bgAlpha || 0.3))
			.appendTo(this.doc().body) : undefined;

		if (param.title || param.titleDivStyle || param.close || param.closeText || param.closeIcon || param.closeDivStyle) 
			var titleDiv = $('<div></div>').addClass('swift-dialog-title')
			.html('<span">%s</span>'.fs(param.title || ""))
			.height(25)
			.width('100%')
			.css('text-align', 'center')
			.css('font-size', '14px')
			.css(param.titleDivStyle)
			.appendTo(dlg);

		if (param.close || param.closeText || param.closeIcon || param.closeStyle) 
			$('<div></div>').css('float', 'right')
			.css('line-height', '25px')
			.css('font-size', 14)
			.css(param.closeDivStyle)
			.css('cusor', 'pointer')
			.height(25)
			.css(param.closeDivStyle)
			.html(param.closeText || param.closeIcon ? '<img src="%s">'.fs(param.closeIcon) : 'X&nbsp;')
			.appendTo(titleDiv ? titleDiv : dlg)
			.click(function () {
				if ($.type(param.close) == 'Function') {
					if (param.close.apply(userDlg, arguments)) userDlg.close();
				} else userDlg.close();
			});

		if (param.buttons) {
			var bntDiv = $('<div></div>').addClass('swift-dialog-buttons')
				.height(25)
				.css('float', 'right')
				.width('100%')
				.css(param.buttonDivStyle)
				.append($('<div></div>').css('float', 'right'));
			for (var text in param.buttons) {
				(function (text) {
					$('<button></button>').html(text).click(function () {
						param.buttons[text].apply(userDlg, arguments);
					}).appendTo(bntDiv.children());
				})(text);
			}
			if (bntDiv.children().length) bntDiv.appendTo(dlg);
		}
		/*
		if (param.resizable) { //TODO
		}
		if (param.movable) { //TODO
		}
		*/
		dlg.css('z-index', '10000')
			.css('position', 'absolute')
			.appendTo(dlg.doc().body);
		var contentDiv = $('<div></div>')
			.addClass('swift-dialog-content')
			.width('100%')
			.css(param.contentDivStyle);
		if (bntDiv) 
			contentDiv.before(bntDiv);
		else 
			contentDiv.appendTo(dlg);
		userDlg.appendTo(contentDiv).show();
		contentDiv.height(dlg.height() - (dlg.find('.swift-dialog-title').height2() || 0) - (dlg.find('.swift-dialog-buttons').height2() || 0))
		if (!param.style || param.style.left == undefined) 
			dlg.css('left', window.innerWidth / 2 - dlg.width3() / 2 + 'px')
		if (!param.style || param.style.top == undefined) 
			dlg.css('top', window.innerHeight / 2 - dlg.height3() / 2 + 'px')
		this.close = function (event) {
			if (oldParent) {
				this.appendTo(oldParent);
				if (this.style("display") != "none") this.hide();
			} else 
				this.remove();
			dlg.remove();
			bgDiv && bgDiv.remove();
			return this;
		}
		return this;
	}
	Swift.prototype.doc = function () {
		return this.length ? this[0].ownerDocument : undefined;
	}
	Swift.prototype.animate = function (ts /*target style*/ , duration, callback) {
		function interpolate(start, end, points) {
			var interval = (end - start) / points,
				values = [];
			for (var i = 0; i < points; i++) {
				values.push(start + i * interval);
			}
			values.push(end);
			return values;
		}
		if ($.type(duration) == 'Function') {
			callback = duration;
			duration = undefined;
		}
		var interval = 10,
			ele = this,
			duration = $.type(duration) == 'Number' ? duration : (function (preset) {
				if (preset == 'slow') return 700;
				if (preset == 'middle') return 500;
				if (preset == 'fast') return 300;
			})(duration),
			overflow = this.css('overflow');
		if (ts instanceof Object) {
			var styles = {};
			for (var name in ts) {
				var tsv /*target style value*/
				= ts[name];
				tsv = $.asInt(tsv);
				if (isNaN(tsv)) continue;
				var unit = /\D*$/.exec(tsv);
				if (!! unit) unit = 'px';
				var csv /*current style value*/
				= this.css(name);
				if (!csv) csv = this.style(name);
				csv = $.asInt(csv) || 0;
				styles[name] = {
					start: csv,
					end: tsv,
					unit: unit,
					interpolations: interpolate(csv, tsv, (duration || 300) / interval)
				};
			}
			ele.css('overflow', 'hidden');
			for (var name in styles) {
				(function (name) {
					for (var i in styles[name]['interpolations']) {
						(function (i) {
							setTimeout(function () {
								ele.css(name, styles[name]['interpolations'][i] + unit);
							}, interval * i);
						})(i);
					}
					setTimeout(function () {
						callback && callback.apply(ele, arguments);
						ele.css('overflow', overflow);
					}, interval * styles[name]['interpolations'].length);
				})(name);
			}
		}
	}
	Swift.prototype.em2px = function () {
		if (!this.length) return;
		if (this[0].currentStyle) {
			return $.asInt(this[0].currentStyle['fontSize']);
		} else if (window.getComputedStyle) {
			return $.asInt(document.defaultView.getComputedStyle(this[0], null).getPropertyValue('font-size'));
		}
	}
	Swift.prototype.first = function () {
		return this.eq(0);
	}
	Swift.prototype.last = function () {
		return this.eq(-1);
	}
	Swift.prototype.firstChild = function () {
		var ret = $(this.children().slice(0, 1));
		return this.pushStack(ret, 'eq', i);
	}
	Swift.prototype.lastChild = function () {
		var ret = $(this.children().slice(-1));
		return this.pushStack(ret, 'eq', i);
	}
	Swift.prototype.eq = function (i) {
		if (i >= 0)
			var index = i;
		else
			var index = (i+this.length) % this.length;
		var ret = $(this.slice(index, index + 1));
		return this.pushStack(ret, 'eq', i);
	}
	Swift.prototype.get = function (i) {
		if (arguments.length) {
			if (this.length > i)
				return this[i];
		}
		return slice.call(this);
	}
	Swift.prototype.layout = function () {
		if (!this.length) return null;
		else
		var elem = this[0];
		var box = elem.getBoundingClientRect(), doc = elem.ownerDocument, body = doc.body, docElem = doc.documentElement;
		var clientTop = docElem.clientTop || body.clientTop || 0, clientLeft = docElem.clientLeft || body.clientLeft || 0;
		var top = box.top + (window.pageYOffset || docElem.scrollTop) - clientTop, left = box.left + (window.pageXOffset || docElem.scrollLeft) - clientLeft;
		return {
   			left: left,
			top: top,
			left: box.width,
			height: box.height,
			right: left + box.width,
			bottom: top + box.height
		};
	}
	Swift.prototype.checked = function () {
		if (this.length)
			return this[0].checked;
	}
	Swift.prototype.promise = function() {
		// TODO 2 arguments [type] [,target]
		var job = global.ajaxEvents[this][event];
		var deferred = $.Deferred(job);
		return deferred.promise();
	}
	
	// ### Swift ends
	
	// selector for ie
	if (!document.querySelectorAll) window.querySelectorAll = function(selector) {
		var head = document.documentElement.firstChild;
		var styleTag = document.createElement("STYLE");
		head.appendChild(styleTag);
		document.__qsResult = [];
		styleTag.styleSheet.cssText = selector + "{x:expression(document.__qsResult.push(this))}";
		window.scrollBy(0, 0);
		head.removeChild(styleTag);
		var result = [];
		for (var i in document.__qsResult)
			result.push(document.__qsResult[i]);
		return result;
	}
	
	var _$ = window.$;
	var $ = window.$ = window.swift = function (selector, ctx) {
		if (!selector) selector = [];
		if (!ctx) ctx = document;

		var type = $.type(selector);
		if (type == "String") {
			var matched = /^<(\w+)\s*\/?>(?:<\/\1>)?$/.exec(selector);
			if (matched) var tags = [document.createElement(matched[1])];
			else {
				matched = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/.exec(selector);
				if (matched && matched[1]) {
					var tmpDiv = $('<div></div>'),
						tags = tmpDiv.html(matched[1])[0].childNodes;
				} else if (ctx.querySelectorAll) {
					var tags = ctx.querySelectorAll(selector);
				} else {
					var tags = querySelectorAll(selector);
					if (ctx) {
						var ret = [];
						for (var i=0; i<tags.length; i++) {
							var ele = tags[i].parentNode;
							while (ele) {
								if (ele === ctx) {
									ret.push(tags[i]);
									break;
								}
								ele = ele.parentNode;
							}
						}
						tags = ret;
					}
				}
			}
		} else if (selector.tagName || selector.nodeType || selector === window || selector === document) {
			var tags = [selector];
		} else if (type == 'Array' || type == 'NodeList') {
			var tags = selector;
		} else if (type == 'Swift') {
			return selector;
		} else if (type == 'Function') {
			//TODO validate this stuff
			if (/loaded|complete/.test(document.readyState)) {
				selector();
			} else {
				if (document.addEventListener) {
					document.addEventListener("DOMContentLoaded", selector, false);
				} else if ($.browser.webkit) {
					var _timer = setInterval(function () {
						if (/loaded|complete/.test(document.readyState)) {
							selector();
							clearInterval(_timer);
						}
					}, 10);
				} else {
					var oldOnload = window.onload;
					if (typeof oldOnload === 'function') {
						window.onload = function() {
							oldOnload.apply(this, arguments);
							selector.apply(this, arguments);
						}
					} else {
						window.onload = selector;
					}
				}
			}
			return;
		}
		return new Swift(tags, selector, ctx);
	}
	swift.noConflict = function() {
		window.$ = _$;
	}
	function Callbacks(flags) {
		var self = this;
		$.each(flags.split(/\s+/g), function(key, flag) {
			self[flag] = true;
		});
		this.handlers = [];
		this.enabled = true;
		this.add = function(callback) {
			if (this.memory && this.fired) {
				callback.apply(this, this.arguments);
			}
			if ($.isList(callback)) {
				$.each(callback, function() {
					if (self.unique && $.inArray(this, self.handlers))
						return;
					self.add(this);
				});
			} else {
				this.handlers.push(callback);
			}
		}
		this.remove = function(callback) {
			if ($.isList(callback)) {
				$.each(callback, function() {
					self.remove(this);
				});
			} else {
				this.handlers.remove(callback);
			}
		}
		this.disable = function() {
			this.enabled = false;
		}
		this.enable = function() {
			this.enabled = true;
		}
		this.fire = function() {
			if (!this.enabled) return this;
			if (this.onced) return this;
			var falsed = false,
				args = arguments;
			$.each(this.handlers, function() {
				if (self.stopOnFalse && falsed) return;
				if (this.apply(self, args) === false) falsed = true;
			});
			if (this.once) this.onced = true;
			if (this.memory) {
				this.arguments = arguments;
				this.fired = true;
			}
			return this;
		}
	}
	swift.Callbacks = function(flags) {
		return new Callbacks(flags);
	}
	swift.reverse = function(items) {
		return Array.prototype.reverse.call(items);
	}
	swift.makeArray = function(items) {
		return slice.call(items);
	}
	// swift.error = console ? console.error : alert;
	// swift.log = console ? console.log : alert;
	swift.error = function(msg) {
		throw new Error(msg);
	}
	swift.pixelAsInt = function(pixelStr) {
		return parseInt(pixelStr.substr(0, pixelStr.length-2));
	}
	swift.cloneObject = function(obj) {
		return JSON.parse(JSON.stringify(obj));
	}
	swift.data = function(ele, key, value) {
		if (aruguments.length === 3) {
			return $(ele).data(key, value);
		} else {
			return $(ele).data(key);
		}
	}
	swift.removeData = function (ele, name) {
		if (aruguments.length === 3) {
			return $(ele, name);
		} else {
			return $(ele);
		}
	}
	swift.isEmptyObject = function(obj) {
		var empty = true;
		for (var i in empty)
			empty = false;
		return empty;
	}
	swift.checkTypes = function(args, types, restricted) {
		if (restricted && types.length !== args.length) return false;
		return types.length === 0 || $.grep(types, function(type, index) {
			return typeof args[index] === type;
		}).length == types.length;
	}
	swift.slice = function (items, start, end) {
		return slice.call(items, start, end);
	}
	swift.type = function (value) {
		var type = Object.prototype.toString.call(value).slice(8, -1);
		if (type == "Object") {
			var funcNameRegex = /function (.{1,})\(/;
			var results = (funcNameRegex).exec(value.constructor.toString());
			type = (results && results.length > 1) ? results[1] : type;
		}
		return type;
	}
	swift.isFunction = function(value) {
		return typeof value === 'function';
	}
	swift.isArray = function(value) {
		return Array.prototype.isArray(value);
	}
	swift.isString = function(value) {
		return typeof value === 'string';
	}
	swift.isNode = function(value) {
		return typeof value === 'object' && value.nodeType || value.tagName;
	}
	swift.isList = function(value) {
		return typeof value === 'object' && typeof value.length === 'number';
	}
	swift.browser = (function () {
		var ua = navigator.userAgent.toLowerCase(),
			rwebkit = /(webkit)[ \/]([\w.]+)/,
			ropera = /(opera)(?:.*version)?[ \/]([\w.]+)/,
			rmsie = /(msie) ([\w.]+)/,
			rmozilla = /(mozilla)(?:.*? rv:([\w.]+))?/;
		var binfo = rwebkit.exec(ua) || ropera.exec(ua) || rmsie.exec(ua) || rmozilla.exec(ua);
		return {
			name: binfo[1],
			version: binfo[2],
			webkit: binfo[1] == 'webkit',
			opera: binfo[1] == 'opera',
			msie: binfo[1] == 'msie',
			mozilla: binfo[1] == 'mozilla'
		};
	})();
	swift.grep = function (items, callback, reverse) {
		/*
			$.grep(items, callback(item, index, items), reverse)
				if reverse is false or not set, return a collection contains sub-items in items if callback return true or true-like
 				else return a collection contains sub-items in items if callback return false or false-like
		*/
		if (typeof callback != "function") throw new TypeError();
		var res = [];
		$.each(items, function(i, item) {
			var callback_return = callback.call(item, item, i, items);
			if (reverse && !callback_return ||
				!reverse && callback_return)
				res.push(item);
		});
		return res;
	}
	swift.map = function (items, callback) {
		/*
			$.map(items, callback(item, index, items))
				return a collection contains with values return from callback
		*/
		var res = [];
		Array.prototype.forEach.call(items, function(ele, i, eles) {
				res.push(callback.call(eles, ele, i, eles));
			});
		return res;
	}
	swift.reduce = function(arr, valueInitial, fnReduce) {
		$.each(arr, function(i, value) {
			valueInitial = fnReduce.call(value, valueInitial, value, i);
		});
		return valueInitial;
	}
	swift.sub = function() {
		eval('var swiftCopy = ' + swift.toString());
		for (var attr in this) {
			swiftCopy[attr] = this[attr];
		}
		return swiftCopy;
	}
	swift.each = function(items, callback) {
		/*
			$.each(items, callback(index, item))
		*/
		if ($.isList(items)) {
			for (var i=0; i<items.length; i++) {
				var item = items[i];
				callback.call(item, i, item);
			}
		} else {
			for (var key in items) {
				var item = items[key];
				callback.call(item, key, item);
			}
		}
		return items;
	}
	swift.htmlEncode = function (source) {
		return source.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/ /g, '&nbsp;');
	}
	swift.mergeObject = function(first, second) {
		if (!first) first = {};
		if (!second) second = {};
		var ret = {};
		if (first) {
			for (var key in first) {
				ret[key] = first[key];
			}
		}
		if (second) {
			for (var key in second) {
				ret[key] = second[key];
			}
		}
		return ret;
	}
	swift.ajaxSetup = function(param) {
		global.ajaxSettings = $.mergeObject(global.ajaxSettings, param);
	}
	function Deferred(job) {
		var allCallbacks = {
				done: [],
				fail: [],
				always: [],
				pipe: [],
				progress: []
			},
			contexts = {},
			allArgs = {},
			status = 'pending',
			deferred = this;
		function registerCallback(key, callbacks) {
			$.each(callbacks, function(i, callback) {
				// console.log(callback.toString());
				if (typeof callback == 'function') {
					allCallbacks[key].push(callback);
				} else if (callback.length) {
					registerCallback(key, callback);
				}
			});
		}
		function invokeCallbacks(key) {
			var callbacks = allCallbacks[key],
				args = allArgs[key],
				context = contexts[key];
			callbacks.forEach(function(callback) {
				callback.apply(context ? context : deferred, args);
			});
		}
		this.always = function() {
			registerCallback('always', arguments);
			if (status !== 'pending') {
				invokeCallbacks('done');
				invokeCallbacks('fail');
			}
			return this;
		}
		this.done = function() {
			if (status === 'done') {
				invokeCallbacks('done');
			}
			registerCallback('done', arguments);
			return this;
		}
		this.fail = function() {
			if (status === 'fail') {
				invokeCallbacks('fail');
			}
			registerCallback('fail', arguments);
			return this;
		}
		this.notify = function() {
			if (status === 'pending') {
				invokeCallbacks('progress');
			}
			return this;
		}
		this.pipe = function() {
			registerCallback('pipe', arguments);
			return this;
		}
		this.progress = function() {
			registerCallback('progress', arguments);
			return this;
		}
		this.then = function(done, fail, progress) {
			registerCallback('done', [done]);
			registerCallback('fail', [fail]);
			if (progress)
				registerCallback('progress', [progress]);
			return this;
		}
		this.isRejected = function() {
			return status === 'rejected';
		}
		this.isResolved = function() {
			return status === 'resolved';
		}
		this.resolve = function() {
			status = 'resolved';
			allArgs.done = arguments;
			invokeCallbacks('done');
			invokeCallbacks('always');
			return this;
		}
		this.reject = function() {
			status = 'rejected';
			allArgs.fail = arguments;
			invokeCallbacks('fail');
			invokeCallbacks('always');
			return this;
		}
		this.rejectWith = function(context) {
			contexts.fail = context;
			return this.reject.apply(this, $.slice(arguments, 1));
		}
		this.resolveWith = function(context) {
			contexts.done = context;
			return this.resolve.apply(this, $.slice(arguments, 1));
		}
		this.notifyWith = function(context) {
			contexts.progress = context;
			return this.notify.apply(this, $.slice(arguments, 1));
		}
		this.state = function() {
			return status;
		}
		this.promise = function() {
			var promise = {};
			var funs = ['always', 
						'done', 
						'fail', 
						'isRejected', 
						'isResolved', 
						'pipe', 
						'progress', 
						'promise', 
						'state', 
						'then'];
			for (var attr in deferred) {
				if ($.inArray(attr, funs)) {
					(function (attr) {
						promise[attr] = function() {
							return deferred[attr].apply(deferred, arguments);
						}
					})(attr);
				}
			}
			return promise;
		}
		if (job) {
			job();
		}
	}
	swift.Deferred = function(job) {
		var deferred = new Deferred(job);
		return deferred;
	}
	swift.promise = function() {
		return $.Deferred.apply(this, arguments).promise();
	}
	function sendJSONP(param, deferred, promise) {
		param.global = false;
		
		var swxhr = promise;
		
		swxhr.status = 200;
		swxhr.statusText = 'OK';
		swxhr.statusCode = function() {
			return '';
		}
		swxhr.overrideMimeType = function(value) {
		}
		swxhr.setRequestHeader = function(name, value) {
		}
		swxhr.getAllResponseHeaders = function() {
			return '';
		}
		swxhr.getResponseHeader = function(name) {
			return '';
		}
		swxhr.abort = function() {
		}
		// get param
		if (param) {
			param = $.mergeObject(global.ajaxSettings, param);
		}
		if (param.data) {
			param.url += (/\?.+=.+/.test(param.url) ? '&' : '?') + 
			             (typeof param.data == 'string' ? param.data : $.param(param.data));
		}
		// set no cache
		if (! param.cache) {
			param.url += '&_='+new Date().getTime();
		}
		// set timeout
		if (param.timeout) {
			setTimeout(function () {
				if (deferred.state() == 'pending') {
					if (param.context) {
						deferred.rejectWith(param.context, swxhr, 'timeout');
					} else {
						deferred.reject(swxhr, 'timeout');
					}
				}
			}, param.timeout);
		}
		// call beforeSend function
		if (param.context) {
			deferred.notifyWith(param.context, swxhr, param);
		} else {
			deferred.notify(swxhr, param);
		}
		var script = document.createElement('script');
		script.setAttribute('src', param.url);
		document.documentElement.firstChild.appendChild(script);
		window[param.jsonpCallback] = function(obj) {
			if (param.statusCode && param.statusCode[xhr.status])
				deferred.always(param.statusCode[xhr.status]);
			if (param.context)
				deferred.resolveWith(param.context, obj, 'success', swxhr);
			else
				deferred.resolve(obj, 'success', swxhr);
			// TODO remove script tag
			// TODO removed, checked removing is ok
			$(script).remove();
		}
	}
	function sendAjax(param, deferred, promise) {
		var swxhr = promise;
		
		// define processor
		function responseProcessor(xhr, param) {
			swxhr.status = xhr.status;
			swxhr.statusText = xhr.statusText;
			var converters = $.mergeObject(global.ajaxSettings.converters || {}, param.converters || {});
			if (param.statusCode && param.statusCode[xhr.status]) {
				deferred.always(param.statusCode[xhr.status]);
			}
			if (xhr.status == 200) {
				if (xhr.getResponseHeader('Last-Modified') && param.ifModified) {
					return;
				}
				var dataType = param.dataType,
					ret;
				if (param.dataFilter) {
					var responseText = swxhr.responseText = callbacks.dataFilter.call(param, xhr.responseText, param.dataType);
				} else {
					var responseText = swxhr.responseText = xhr.responseText;
				}
				if (dataType == '*' || dataType.toLowerCase() in ['html', 'text']) {
					if (converters['* text']) {
						ret = converters['* text'](responseText);
					} else {
						ret = responseText;
					}
				} else if (dataType.toLowerCase() == 'json') {
					try {
						if (converters['text html']) {
							ret = converters['text html'](responseText);
						} else {
							ret = $.parseJSON(responseText);
						}
					} catch (e) {
						if (param.context) {
							deferred.rejectWith(param.context, swxhr, 'error', e);
						} else {
							deferred.reject(swxhr, 'error', e);
						}
						// callbacks.parsererror.call(param, responseText);
					}
				} else if (dataType.toLowerCase() == 'xml') {
					swxhr.responseXML = xhr.responseXML;
					try {
						if (converters['text xml']) {
							ret = converters['text xml'](responseText);
						} else {
							ret = $.parseXML(responseText);
						}
					} catch (e) {
						if (param.context) {
							deferred.rejectWith(param.context, swxhr, 'error', e);
						} else {
							deferred.reject(swxhr, 'error', e);
						}
						// callbacks.parsererror.call(param, responseText);
					}
				}
				if (param.context) {
					deferred.resolveWith(param.context, ret, 'success', swxhr);
				} else {
					deferred.resolve(ret, 'success', swxhr);
				}
				// callbacks.success.call(param, ret, statusText, swxhr);
			} else if (xhr.status == 304) {
				if (param.ifModified) {
					return;
				}
				ret = 'notmodified';
				if (param.context) {
					deferred.resolveWith(param.context, ret, 'notmodified', swxhr);
				} else {
					deferred.resolve(ret, 'notmodified', swxhr);
				}
				// callbacks.notmodified.call(param, ret);
			} else {
				var ret = {
					'error': 'HTTP_Error',
					'status': xhr.status,
					'headers': xhr.getAllResponseHeaders(),
					'body': xhr.responseText
				};
				if (param.context) {
					deferred.rejectWith(param.context, swxhr, 'error');
				} else {
					deferred.reject(swxhr, 'error');
				}
				// callbacks.error.call(param, swxhr, swxhr.xhr.status);
			}
			// callbacks.complete.call(param, ret);
		}
		
		// create Request
		if (param.xhr) {
			var xmlhttp = param.xhr();
		} else if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
			var xmlhttp = new XMLHttpRequest();
		} else { // code for IE6, IE5
			var xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
			// var xmlhttp = new ActiveXObject('Msxml2.XMLHTTP');
			// var xmlhttp = new XDomainRequest();
		}

		swxhr.statusCode = function() {
			return xmlhttp.status;
		}
		swxhr.overrideMimeType = function(value) {
			if (xmlhttp.overrideMimeType)
				xmlhttp.overrideMimeType(value);
		}
		swxhr.setRequestHeader = function(name, value) {
			xmlhttp.setRequestHeader(name, value);
		}
		swxhr.getAllResponseHeaders = function() {
			return xmlhttp.getAllResponseHeaders();
		}
		swxhr.getResponseHeader = function(name) {
			return xmlhttp.getResponseHeader(name);
		}
		swxhr.abort = function() {
			return xmlhttp.abort();
		}
		
		// call beforeSend function
		if (param.context) {
			deferred.notifyWith(swxhr, param);
		} else {
			deferred.notify(swxhr, param);
		}
		
		// set url
		if (param.type.toUpperCase() == 'GET') {
			if (param.data) {
				param.url += (/\?.+=.+/.test(param.url) ? '&' : '?') + 
				             (typeof param.data == 'string' ? param.data : $.param(param.data));
				// set no cache
				if (! param.cache) {
					param.url += '&_='+new Date().getTime();
				}
			} else {
				// set no cache
				if (! param.cache) {
					param.url += (/\?.+=.+/.test(param.url) ? '&' : '?') + '_=' + new Date().getTime();
				}
			}
		}
		
		// set headers
		// xmlhttp.setRequestHeader('Accept', '*/*');
		if (param.mimeType && xmlhttp.overrideMimeType) {
			xmlhttp.overrideMimeType(param.mimeType);
		}
		var headers = $.mergeObject(global.ajaxSettings.headers || {}, param.headers || {});
		if (true && !headers['X-Requested-With']) {
			headers['X-Requested-With'] = 'XMLHttpRequest';
		}
		if (param.dataType && param.dataType !== '*' && param.accepts[param.dataType]) {
			headers['Accept'] = param.accepts[param.dataType] + ', */*; q=0.01';
		}
		try {
			for (var key in headers) {
				xmlhttp.setRequestHeader(key, headers[key]);
			}
		} catch(_) {}
		
		// set timeout
		if (param.timeout) {
			setTimeout(function () {
				if (deferred.state() == 'pending') {
					xmlhttp.abort();
					if (param.context) {
						deferred.rejectWith(param.context, swxhr, 'timeout');
					} else {
						deferred.reject(swxhr, 'timeout');
					}
					// callbacks.abort.call(param);
				}
			}, param.timeout);
		}
		
		// send data
		if (param.type.toUpperCase() == 'POST') {
			if (!param.data) {
				var data = '';
			} else if (typeof param.data == 'string' || ! param.processData) {
				var data = param.data;
			} else {
				if (! param.contentType)
					try {
						xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
					} catch (e) {
					}
				var data = $.param(param.data);
			}
			if (param.contentType) {
				try {
					xmlhttp.setRequestHeader('Content-Type', param.contentType);
				} catch (e) {
				}
			}
			
			try {
				// connect to server
				if (param.username) {
					xmlhttp.open(param.type, param.url, param.async, param.username, param.password);
				} else {
					xmlhttp.open(param.type, param.url, param.async);
				}
				xmlhttp.send(data);
			} catch(e) {
				var ret = {
					'error': 'Swift_Error',
					'status': xmlhttp.status,
					'headers': xmlhttp.getAllResponseHeaders(),
					'body': xmlhttp.responseText
				};
				if (param.context) {
					deferred.rejectWith(param.context, swxhr, 'error', e);
				} else {
					deferred.reject(swxhr, 'error', e);
				}
				// param.error.call(param, ret);
			}
		} else {
			try {
				// connect to server
				if (param.username) {
					xmlhttp.open(param.type, param.url, param.async, param.username, param.password);
				} else {
					xmlhttp.open(param.type, param.url, param.async);
				}	
				xmlhttp.send();
			} catch(e) {
				var ret = {
					'error': 'Swift_Error',
					'status': xmlhttp.status,
					'headers': xmlhttp.getAllResponseHeaders(),
					'body': xmlhttp.responseText
				};
				if (param.context) {
					deferred.rejectWith(param.context, swxhr, 'error', e);
				} else {
					deferred.reject(swxhr, 'error', e);
				}
				// param.error.call(param, ret);
			}
		}
		
		// set processor
		if (param.async) {
			xmlhttp.onreadystatechange = function() {
				swxhr.readyState = xmlhttp.readyState;
				if (xmlhttp.readyState == 4) {
					responseProcessor(xmlhttp, param);
				}
			}
		} else {
			responseProcessor(xmlhttp, param);
		}
	}
	swift.ajax = function (param) {
		if (arguments.length == 2) {
			var param = arguments[1];
			param.url = arguments[0];
		} else if (arguments.length == 1 && typeof arguments[0] == 'string') {
			var param = {url: arguments[0]};
		} else {
			var param = arguments[0];
		}
		if ( ! ('global' in param)) {
			param.global = param.dataType !== 'jsonp';
		}
		if ( ! ('isLocal' in param)) {
			param.isLocal = param.url.startswith('file://');
		}
		if ( ! ('cache' in param)) {
			param.cache = ! $.inArray(param.dataType, ['script', 'jsonp']);
		}
		if ( ! ('crossDomain' in param)) {
			if ( ! (/^[\w\+\.\-]+:\/\//.test(param.url))) { // without url prefiex (http://xxx)
				param.crossDomain = param.dataType == 'jsonp';
			} else {
				var matched1 = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/.exec(document.baseURI);
				var matched2 = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/.exec(param.url);
				param.crossDomain = matched1[0] != matched2[0];
			}
		}
		if (param.dataType == 'jsonp') {
			if ( ! param.data) {
				param.data = {};
			}
			var jsonpCallback = param.jsonp ? param.jsonp : 'callback';
			var callback = param.jsonpCallback ? param.jsonpCallback : 'swift' + new Date().getTime();
			param.data[jsonpCallback] = callback;
		}
		param = $.mergeObject(global.ajaxSettings, param);
		
		var deferred = $.Deferred(),
			promise = deferred.promise();
		deferred.error = deferred.fail;
		deferred.success = deferred.done;
		deferred.complete = deferred.always;
		if (param.beforeSend) {
			promise.progress(param.beforeSend);
		}
		if (param.success) {
			promise.done(param.success);
		}
		if (param.error) {
			promise.fail(param.error);
		}
		if (param.complete) {
			promise.always(param.complete);
		}
		if (param.global) {
			promise.progress(function() {
				global.runningAjaxCount ++;
			});
			promise.always(function() {
				global.runningAjaxCount --;
			});
			global.ajaxEvents.forEach(function(ajaxEvent) {
				switch (ajaxEvent.event) {
					case 'ajaxStart':
					case 'ajaxSend':
						promise.progress(ajaxEvent.ajaxHandler);
						break;
					case 'ajaxSuccess':
						promise.done(ajaxEvent.ajaxHandler);
						break;
					case 'ajaxError':
						promise.fail(ajaxEvent.ajaxHandler);
						break;
					case 'ajaxComplete':
					case 'ajaxStop':
						promise.always(ajaxEvent.ajaxHandler);
						break;
					default:
						break;
				}
			});
		}
		
		if (param.dataType == 'jsonp') {
			sendJSONP(param, deferred, promise);
		} else {
			sendAjax(param, deferred, promise);
		}
		
		return promise;
	}
	swift.get = function (url, data, success, dataType) {
		return $.ajax({
			url: url,
			data: data,
			success: success,
			dataType: dataType
		});
	}
	swift.post = function (url, data, success, dataType) {
		return $.ajax({
			type: 'POST',
			url: url,
			data: data,
			success: success,
			dataType: dataType
		});
	}
	swift.getJSON = function (url, data, success) {
		if (url.indexOf('callback=?')) {
			if (url.indexOf('?callback=?&')) {
				url = url.split('callback=?&').join('');
			} else if (url.indexOf('?callback=?')) {
				url = url.split('callback=?').join('');
			} else if (url.indexOf('&callback=?')) {
				url = url.split('callback=?').join('');
			}
			return $.ajax({
				url: url,
				data: data,
				success: success,
				dataType: 'jsonp'
			});
		} else {
			return $.ajax({
				url: url,
				data: data,
				success: success,
				dataType: 'json'
			});
		}
	}
	swift.getScript = function (url, success) {
		return $.ajax({
			url: url,
			dataType: 'script',
			success: success
		});
	}
	swift.isInt = function (n) {
		// Attension: 1E209 is no a int here
		return typeof n == 'number' && parseFloat(n) == parseInt(n) && !isNaN(n);
	}
	swift.styleName = function (name) {
		var camelCase = name.replace(/^-o-/, 'o-').replace(/^-ms-/, 'ms-').replace(/^-webkit-/, 'webkit-').replace(/^-moz-/, 'moz-').replace(/-([a-z]|[0-9])/ig, function (all, letter) {
			return (letter + '').toUpperCase();
		});
		if (camelCase == 'float') return !!$('<div></div>').html('<a style="float:left"></a>').find('a')[0].style.cssFloat ? 'cssFloat' : 'styleFloat';
		var div = document.createElement('div');
		if (camelCase in div.style) {
			return camelCase;
		} else {
			var try_prifixes = ['moz', 'webkit', 'ms', 'o'];
			try_prifixes.forEach(function(prefix) {
				if (prefix + camelCase in div.style) {
					camelCase = prefix + camelCase;
				}
			});
		}
		return camelCase;
	}
	swift.alert = function (msg /*required*/ , handler /*optional*/ , userStyle /*optional*/) {
		if (!(arguments[1] instanceof Function)) var style = arguments[1];
		else if (!(arguments[2] instanceof Function)) var callback = arguments[1],
			style = arguments[2];
		$('<div></div>').html(msg || '').css('padding', '20px 50px 20px 50px').css(style).dialog({
			modal: true,
			buttons: {
				'OK': function () {
					callback && callback.apply(this, arguments);
					this.close();
				}
			}
		});
	}
	swift.confirm = function (param) {
		if (!param) return;
		param.yesText = param.yesText || 'OK';
		param.noText = param.noText || 'Cancel';
		$('<div></div>').html(param.msg || '').css('padding', '20px 50px 20px 50px').css(param.style).dialog({
			buttons: {
				'OK': function () {
					param.yes && param.yes.apply(this, arguments);
					this.close();
				},
				'Cancel': function () {
					param.no && param.no.apply(this, arguments);
					this.close();
				}
			}
		});
	}
	swift.human = function (size) {
		if (size < 1024) return parseInt(size) + 'B';
		else if (size < 1024 * 1024) return parseInt(size / 1024 * 10) / 10 + 'KB';
		else if (size < 1024 * 1024 * 1024) return parseInt(size / 1024 / 1024 * 10) / 10 + 'MB';
		else if (size < 1024 * 1024 * 1024 * 1024) return parseInt(size / 1024 / 1024 / 1024 * 10) / 10 + 'GB';
		else return parseInt(size / 1024 / 1024 / 1024 / 1024 * 10) / 10 + 'TB';
	}
	swift.time = function (seconds, secondUnit, minuteUnit, hourUnit, dayUnit) {
		if (seconds < 60) return seconds + (secondUnit || 'S');
		else if (seconds < 3600) return parseInt(seconds / 60) + (minuteUnit || 'M');
		else if (seconds < 3600 * 24) return parseInt(seconds / 3600) + (hourUnit || 'H');
		else return parseInt(seconds / 3600 / 24) + (dayUnit || 'D');
	}
	swift.asInt = function (numberWithUnit) {
		return parseInt(/\d*/.exec(numberWithUnit)[0]);
	}
	function buildParams(prefix, obj, traditional, add) {
		if (Array.isArray(obj)) {
			// Serialize array item.
			obj.forEach(function(v, i) {
				if (traditional || /\[\]$/.test(prefix)) {
					// Treat each array item as a scalar.
					add(prefix, v);
				} else {
					buildParams(prefix + '[' + (typeof v === 'object' ? i : '') + ']', v, traditional, add);
				}
			});
		} else if (!traditional && typeof obj === 'object') {
			// Serialize object item.
			for (var name in obj) {
				buildParams(prefix + '[' + name + ']', obj[ name ], traditional, add);
			}
		} else {
			// Serialize scalar item.
			add(prefix, obj);
		}
	}
	swift.param = function (a, traditional) {
		var s = [],
			add = function(key, value) {
				// If value is a function, invoke it and return its value
				value = typeof value == 'function' ? value() : value;
				s[ s.length ] = encodeURIComponent(key) + '=' + encodeURIComponent(value);
			};

		if (traditional === undefined) {
			traditional = global.ajaxSettings.traditional;
		}

		// If an array was passed in, assume that it is an array of form elements.
		if (a.length) {
			// Serialize the form elements
			$.each(a, function() {
				add(this.name, this.value);
			});
		} else {
			for (var prefix in a) {
				buildParams(prefix, a[ prefix ], traditional, add);
			}
		}

		// Return the resulting serialization
		return s.join('&').replace(/%20/g, '+');
	}
	swift.merge = function () {
		var ret = [];
		$.each(arguments, function() {
			ret = ret.concat(this);
		});
		return ret;
	}
	swift.isNumberic = function (data) {
		return !isNaN(parseFloat(data)) && isFinite(data);
	}
	swift.isPlainObject = function (obj) {
		if (!obj || $.type(obj) !== "Object" || obj.nodeType || obj.tagName || $.isWindow(obj) || obj === document) {
			return false;
		}
		try {
			if ( obj.constructor &&
				!hasOwn.call(obj, "constructor") &&
				!hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
				return false;
			}
		} catch ( e ) {
			return false;
		}
		var key;
		for ( key in obj ) {}
		return key === undefined || hasOwn.call( obj, key );
	}
	swift.isXMLDoc = function (data) {
		try {
			var xml = $.parseXML(data);
		} catch (e) {
			return false;
		}
		return true;
	}
	swift.parseXML = function (data) {
		var xml;
		try {
			if (window.DOMParser) xml = new DOMParser().parseFromString(data, 'text/xml');
			else {
				xml = new ActiveXObject('Microsoft.XMLDOM');
				xml.async = 'false';
				xml.loadXML(data);
			}
		} catch (e) {
			xml = undefined;
		}
		if (!xml || !xml.documentElement || xml.getElementsByTagName('parsererror').length)
		 	throw new Error('Invalid XML');
		return xml;
	}
	swift.now = function () {
		return (new Date()).getTime();
	}
	swift.inArray = function (value, arr, startIdx) {
		for (var i = startIdx || 0; i < arr.length; i++) {
			if (value === arr[i]) return true;
		}
		return false;
	}
	swift.contains = function(first, second) {
		return $(first).find(second).length > 0;
	}
	swift.globalEval = function(code) {
		return window.eval(code);
	}
	swift.unique = function(eles) {
		var ret = [];
		$.each(eles, function() {
			if (!$.inArray(this, ret)) {
				ret.push(this);
			}
		});
		return ret;
	}
	swift.extend = function () {
		var fns = arguments[0],
			name = arguments[0],
			fn = arguments[1];
		if (arguments.length == 1) {
			for (var name in fns) {
				(function (name) {
					swift[name] = fns[name];
				})(name);
			}
		} else {
			swift[name] = fn;
		}
	}
	swift.cleanData = function () {
		delete this.data;
		this.data = {};
	}
	swift.toJSON = typeof window.JSON === 'object' && window.JSON.stringify ? JSON.stringify : function (o) {
		if (o === null) return 'null';
		var type = typeof o;
		if (type === 'undefined') return undefined;
		if (type === 'number' || type === 'boolean') return '' + o;
		if (type === 'string') return $.quoteString(o);
		if (type === 'object') {
			if (o.constructor === Date) {
				var month = o.getUTCMonth() + 1,
					day = o.getUTCDate(),
					year = o.getUTCFullYear(),
					hours = o.getUTCHours(),
					minutes = o.getUTCMinutes(),
					seconds = o.getUTCSeconds(),
					milli = o.getUTCMilliseconds();
				if (month < 10) month = '0' + month;
				if (day < 10) day = '0' + day;
				if (hours < 10) hours = '0' + hours;
				if (minutes < 10) minutes = '0' + minutes;
				if (seconds < 10) seconds = '0' + seconds;
				if (milli < 100) milli = '0' + milli;
				if (milli < 10) milli = '0' + milli;
				return '"' + year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds + '.' + milli + 'Z"';
			}
			if (o.constructor === Array) {
				var ret = [];
				for (var i = 0; i < o.length; i++) {
					ret.push($.toJSON(o[i]) || 'null');
				}
				return '[' + ret.join(',') + ']';
			}
			var name, val, pairs = [];
			for (var k in o) {
				type = typeof k;
				if (type === 'number') name = '"' + k + '"';
				else if (type === 'string') name = $.quoteString(k);
				else continue;
				type = typeof o[k];
				if (type === 'function' || type === 'undefined') continue;
				val = $.toJSON(o[k]);
				pairs.push(name + ':' + val);
			}
			return '{' + pairs.join(',') + '}';
		}
	}
	swift.parseJSON = swift.evalJSON = typeof window.JSON === 'object' && window.JSON.parse ? window.JSON.parse : function (src) {
		var filtered = src.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, '');
		if (/^[\],:{}\s]*$/.test(filtered)) return eval('(' + src + ')');
		else throw new Error('Invalid JSON');
	}
	swift.quoteString = function (string) {
		var escapeable = /["\\\x00-\x1f\x7f-\x9f]/g,
			meta = {
				'\b': '\\b',
				'\t': '\\t',
				'\n': '\\n',
				'\f': '\\f',
				'\r': '\\r',
				'"': '\\"',
				'\\': '\\\\'
			};
		if (string.match(escapeable)) {
			return '"' + string.replace(escapeable, function (a) {
				var c = meta[a];
				if (typeof c === 'string') return c;
				c = a.charCodeAt();
				return '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
			}) + '"';
		}
		return '"' + string + '"';
	}
	swift.isinline = function (tag) {
		return $.inArray(tag, ["a", "abbr", "acronym", "b", "bdo", "big", "br", "cite", "code", "dfn", "em", "i", "img", "input", "kbd", "label", "q", "samp", "select", "small", "span", "strong", "sub", "sup", "textarea", "tt", "var"]);
	}
	swift.site_path = function (path) {
		var prefix = this.site_url_prefix.endswith('/') ? this.site_url_prefix.slice(0, -1) : this.site_url_prefix;
		if (path.startswith('/')) {
			return (prefix || '') + path;
		} else {
			return (document.location.pathname.endswith('/') ? '%s%s' : '%s/%s').fs(document.location.pathname, path);
		}
	}
	swift.site_url = function (path, protocol) {
		var protocol = protocol || window.location.href.startswith('https://') ? 'https' : 'http';
		return "%s://%s%s".fs(protocol, location.host, $.site_path(path));
	}
	swift.goTo = function (url) {
		return document.location.href = url;
	}
	swift.noop = function() {
		return function() {};
	}
	swift.extend = function (params) {
		for (var key in params) {
			Swift.prototype[key] = params[key];
		}
	}
	swift.simulatejQuery = function() {
		this.jQuery = window.jQuery;
		window.jQuery = this;
	}
	swift.unSimulatejQuery = function() {
		window.jQuery = this.jQuery;
	}
	swift.ready = function(handler) {
		return $(handler);
	}
})(window);
