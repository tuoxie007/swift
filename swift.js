/*
	Version: v2.0
*/

(function (window) {
	//Extends build in types
	String.prototype.fs = function () {
		segments = this.split('%s');
		ret = '';
		for (var i in arguments) {
			ret += segments[i] + arguments[i];
		}
		return ret + segments[segments.length - 1];
	}
	String.prototype.trim = function () {
		return this.replace(/^\s+|\s+$/g, "");
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


	if (!Array.prototype.forEach) Array.prototype.forEach = function (callback) {
		/*
			items.forEach(callback(item, index, items));
		*/
		for (var i = 0; i < this.length; i++) {
			callback(this[i], i, this);
		}
	}
	
	// global
	var global = {events: [], data: {}};

	function Swift(tags, selector, context) {
		for (var i = 0; i < tags.length; i++) {
			this[i] = tags[i];
		}
		this.length = tags.length;
		this.context = context;
		this.selector = selector;
		this.swift = "2.0";
	}
	// extend Swift prototype
	Swift.prototype = Array.prototype;
	Swift.prototype.constructor = Swift;
	Swift.prototype.find = function (arg1) {
		if (!this.length)
			return swift([]);
		else if (typeof arg1 === 'string') { // .find(selector)
			var found = swift([]);
			this.each(function() {
				found.add(swift(arg1, this));
			});
			return found;
		} else if (arg1.swift) { // .find(swift object)
			return swift(swift.filter(this, function(item) {
				return item in arg1;
			}));
		} else if (arg1.length > 0) { // .find(elements)
			return swift(swift.filter(this, function(item) {
				return item in arg1;
			}));
		} else { // .find(element)
			return swift(swift.filter(this, function(item) {
				return item == arg1;
			}));
		}
	}
	Swift.prototype.each = function (callback) {
		Array.prototype.forEach.call(this, function(item, index, items) {
			callback.call(item, index, item, items);
		});
		return;
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
			(selector ? $(this).find(selector) : $(this)).each(function() {
				if (this == (event.target || event.srcElement))
					if (data) event.data = data;
					event.delegateTarget = this;
					event.returnValue = handler.call(this, event);
					if (self.one)
						self.unbind();
					return event.returnValue;
			});
		};
		this.bind = function() {
			$(this.context).each(function() {
				if (window.addEventListener) {
					this.addEventListener(action, real_heandler);
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
	}
	Swift.prototype.on = function() {
		if (swift.checkTypes(arguments, ['string', 'string', 'object', 'function'])) {
			var args = (function(events, selector, data, handler) {
				var event_map = {};
				events.trim().split('/\s+/').forEach(function(eve) {
					event_map[eve] = handler;
				});
				return [event_map, selector, data];
			}).apply(this, arguments);
		} else if (swift.checkTypes(arguments, ['string', 'string', 'function'])) {
			var args = (function(events, selector, handler) {
				var event_map = {};
				events.trim().split('/\s+/').forEach(function(eve) {
					event_map[eve] = handler;
				});
				return [event_map, selector];
			}).apply(this, arguments);
		} else if (swift.checkTypes(arguments, ['string', 'object', 'function'])) {
			var args = (function(events, data, handler) {
				var event_map = {};
				events.trim().split('/\s+/').forEach(function(eve) {
					event_map[eve] = handler;
				});
				return [event_map, undefined, data];
			}).apply(this, arguments);
		} else if (swift.checkTypes(arguments, ['string', 'function'])) {
			var args = (function(events, handler) {
				var event_map = {};
				events.trim().split('/\s+/').forEach(function(eve) {
					event_map[eve] = handler;
				});
				return [event_map];
			}).apply(this, arguments);
		} else if (swift.checkTypes(arguments, ['object', 'string'])) {
			var args = arguments;
		} else if (swift.checkTypes(arguments, ['object', 'object'])) {
			var args = [arguments[0], undefined, arguments[1]];
		} else if (swift.checkTypes(arguments, ['object'])) {
			var args = arguments;
		} else {
			throw new TypeError();
		}
		var eles = this;
		(function(event_map, selector, data) {
			swift.each(event_map, function(eve, handler) {
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
		if (swift.checkTypes(arguments, ['string', 'string', 'function'])) {
			var args = (function(events, selector, handler) {
				var event_map = {};
				events.trim().split('/\s+/').forEach(function(eve) {
					event_map[eve] = handler;
				});
				return [event_map, selector];
			}).apply(this, arguments);
		} else if (swift.checkTypes(arguments, ['string', 'function'])) {
			var args = (function(events, handler) {
				var event_map = {};
				events.trim().split('/\s+/').forEach(function(eve) {
					event_map[eve] = handler;
				});
				return [event_map];
			}).apply(this, arguments);
		} else if (swift.checkTypes(arguments, ['string'])) {
			(function(events, selector) {
				var events = events.trim().split('/\s+/');
				this.each(function(i, ele) {
					events.forEach(function(action) {
						global.events = swift.filter(global.events, function(swift_event) {
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
		} else if (swift.checkTypes(arguments, ['object'])) {
			var args = arguments;
		} else {
			throw new TypeError();
		}
		
		var eles = this;
		(function(event_map, selector) {
			eles.each(function(i, ele) {
				swift.each(event_map, function(action, handler) {
					global.events = swift.filter(global.events, function(swift_event) {
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
		/*
			Bind two or more handlers to the matched elements, to be executed on alternate clicks.
			.toggle( handler(eventObject), handler(eventObject) [, handler(eventObject)] )
		*/
		return (function(cb1, cb2, cb3) {
			return this.on('click', function () {
				this.clicked = this.clicked ? (this.clicked + 1) : 1;
				(this.clicked % 2 ? cb1 : cb2).apply(this, arguments);
				if (cb3) cb3.apply(this, arguments);
			});
		}).apply(this, arguments);
	}
	Swift.prototype.one = function() {
		this.isOne = true;
		this.on.apply(this, arguments);
		this.isOne = false;
		global.current_events.forEach(function() {
			global.events = swift.filter(global.events, function(swift_event) {
				return swift_event in global.current_events;
			}, true);
		});
		delete global.current_events;
		return this;
	}
	Swift.prototype.trigger = function(event) {
		swift.filter(global.events, function(swift_event) {
			if (swift_event.context === ele && 
				swift_event.action === action && 
				swift_event.selector === selector &&
				swift_event.handler === handler) {
					swift_event.unbind();
					return false;
			}
			return true;
		});
		this.each(function() {
			this[event].call(this);
		});
		return this;
	}
	
	var actions = 'change click dbclick focus focusin focusout hover keydown keypress keyup load mousedown mouseenter mouseleave mousemove mouseout mouseup resize scroll select submit unload error error'.split(' ');
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
				var values = swift.slice(value);
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
		return this.length && this[0].classList.contains(name);
	}
	Swift.prototype.addClass = function (name) {
		var names = name.split(/\s+/);
		this.each(function (i) {
			var ele = this;
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
			.toggleClass( className )
			.toggleClass( className, switch )
			.toggleClass( [switch] )
			.toggleClass( function(index, class, switch) [, switch] )
		*/
		if (swift.checkTypes(arguments, ['string'])) {
			if (arguments[1] === false) return;
			arguments[0].split('/\s+/').forEach(function(className) {
				this.toggleClass(className);
			});
		} else if (swift.checkTypes(arguments, ['boolean'])) {
			// TODO
		} else if (swift.checkTypes(arguments, ['function', 'boolean'])) {
			// TODO
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
	}
	Swift.prototype.css = function (name) {
		if (swift.checkTypes(arguments, ['string'], true)) {
			if (!this.length) return undefined;
			if (this[0].currentStyle)
				return this[0].currentStyle[swift.styleName(name)];
			else if (document.defaultView.getComputedStyle)
				return document.defaultView.getComputedStyle(this[0], null).getPropertyValue(name);
		} else if (swift.checkTypes(arguments, ['string', 'string'], true)) {
			if (this.length) {
				var elem = this[0],
					name = arguments[0],
					value = arguments[1];
				if (elem && elem.nodeType !== 3 && elem.nodeType !== 8 && elem.style)
					return this.each(function () {
						name = swift.styleName(name);
						this.style[name] = value;
					});
			}
		} else if (swift.checkTypes(arguments, ['object'], true)) {
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
			return this[0].style[swift.styleName(name)];
	}
	Swift.prototype.width = function (value) {
		if (arguments.length) {
			if (!swift.isInt(value)) {
				return this.css('width', value);
			} else {
				return this.css('width', value + 'px');
			}
		} else if (this.length) {
			return this.css('width');
		}
	}
	Swift.prototype.innerWidth = function () {
		var width = swift.pixelAsInt(this.width());
		var paddingLeftWidth = swift.pixelAsInt(this.css('padding-left')) || 0;
		var paddingRightWidth = swift.pixelAsInt(this.css('padding-right')) || 0;
		var borderLeftWidth = swift.pixelAsInt(this.css('border-left-width')) || 0;
		var borderRightWidth = swift.pixelAsInt(this.css('border-right-width')) || 0;
		return width + paddingLeftWidth + paddingRightWidth + borderLeftWidth + borderRightWidth + 'px';
	}
	Swift.prototype.outterWidth = function () {
		var innerWidth = swift.pixelAsInt(this.innerWidth());
		var marginLeftWidth = swift.pixelAsInt(this.css('margin-left')) || 0;
		var marginRightWidth = swift.pixelAsInt(this.css('margin-right')) || 0;
		return innerWidth + marginLeftWidth + marginRightWidth + 'px';
	}
	Swift.prototype.height = function (value) {
		if (arguments.length) {
			if (!swift.isInt(value)) {
				return this.css('height', value);
			} else {
				return this.css('height', value + 'px');
			}
		} else if (this.length) {
			return this.css('height');
		}
	}
	Swift.prototype.innerHeight = function () {
		var height = swift.pixelAsInt(this.height());
		var paddingLeftHeight = swift.pixelAsInt(this.css('padding-left')) || 0;
		var paddingRightHeight = swift.pixelAsInt(this.css('padding-right')) || 0;
		var borderLeftHeight = swift.pixelAsInt(this.css('border-left-width')) || 0;
		var borderRightHeight = swift.pixelAsInt(this.css('border-right-width')) || 0;
		return height + paddingLeftHeight + paddingRightHeight + borderLeftHeight + borderRightHeight + 'px';
	}
	Swift.prototype.outterHeight = function () {
		var innerHeight = swift.pixelAsInt(this.innerHeight());
		var marginLeftHeight = swift.pixelAsInt(this.css('margin-left')) || 0;
		var marginRightHeight = swift.pixelAsInt(this.css('margin-right')) || 0;
		return innerHeight + marginLeftHeight + marginRightHeight + 'px';
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
				curLeft += swift.pixelAsInt($(ele).css('margin-left')) || 0;
				curTop += swift.pixelAsInt($(ele).css('margin-top')) || 0;
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
					value = swift.pixelAsInt(value);
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
	Swift.prototype.scrollTop = function() {
		if (this.length) {
			var ele = this[0];
			if (arguments.length) {
				var value = arguments[0];
				if (typeof value === 'string' && value.endswith('px'))
					value = swift.pixelAsInt(value);
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
		} else if (swift.checkTypes(arguments, ['string'], true)) {
			return global.data[this[0]] && global.data[this[0]][name];
		} else if (swift.checkTypes(arguments, ['object'], true)) {
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
						if (swift.emptyObject($(this).data())) {
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
						if (swift.emptyObject($(this).data())) {
							delete global.data[this];
						}
					}
				});
			}
		}
		if (swift.data[this.guid]) delete swift.data[this.guid];
	}
	Swift.prototype.quque = function() {
		// TODO
	}
	Swift.prototype.dequque = function() {
		// TODO
	}
	Swift.prototype.clearQueue = function() {
		// TODO
	}
	Swift.prototype.add = function (other) {
		if (other.length != undefined) {
			for (var i = 0; i < other.length; i++) {
				this.push(other[i]);
			}
		} else {
			this.push(other);
		}
		return this;
	}
	Swift.prototype.pushStack = function() {
		// TODO
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
	Swift.prototype.after = function () {
		if (swift.checkTypes(arguments, ['function'], true)) {
			var callback = arguments[0];
			this.each(function(i) {
				$(this).after(callback.call(this, i));
			});
		} else {
			for (var i=0; i<arguments.length; i++) {
				var arg = arguments[i];
				if (typeof arg === 'object' && arg.nodeType && arg.nodeName) {
					// ugly test argj is a element object
					this.each(function(index) {
						var children = swift.filter(this.parentNode.childNodes, function(ele) {
							return ele.nodeType === 1;
						});
						if (children[children.length - 1] == this) {
							this.parentNode.appendChild(index ? arg.cloneNode(true) : arg);
						} else {
							var next = false;
							for (var j=0; j<children.length; j++) {
								if (children[j] === this) {
									next = children[j+1];
								}
							}
							this.parentNode.insertBefore(index ? arg.cloneNode(true) : arg, next);
						}
					});
				} else if (typeof arg === 'string') {
					var eles = swift('<div></div>').html(arg)[0].childNodes;
					this.after(eles);
				} else if (arg['length']) {
					for (var j=0; j<arg.length; j++) {
						this.after(arg[j]);
					}
				}
			}
		}
		return this;
	}
	Swift.prototype.before = function () {
		if (swift.checkTypes(arguments, ['function'], true)) {
			var callback = arguments[0];
			this.each(function(i) {
				$(this).before(callback.call(this, i));
			});
		} else {
			for (var i=0; i<arguments.length; i++) {
				var arg = arguments[i];
				if (typeof arg === 'object' && arg.nodeType && arg.nodeName) { // DO
					// ugly test arg is a element object
					this.each(function(index) {
						this.parentNode.insertBefore(index ? arg.cloneNode(true) : arg, this);
					});
				} else if (typeof arg === 'string') {
					var eles = swift('<div></div>').html(arg)[0].childNodes;
					this.before(eles);
				} else if (arg['length']) {
					for (var j=0; j<arg.length; j++) {
						this.before(arg[j]);
					}
				}
			}
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
				if (typeof target === 'string') {
					var eles = $('<div></div>').html(target)[0].childNodes;
					return this[name](eles);
				} else if (typeof target === 'object' && target.nodeType && target.nodeName) {
					return this[name]([target]);
				} else if (target.length) {
					var newSet = [];
					var src = this;
					swift(target).each(function(index) {
						for (var i=0; i<src.length; i++) {
							var ele = index ? src[i].cloneNode(true) : src[i];
							newSet.push(ele);
							swift(this)[orig](ele);
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
			if (typeof other === 'string') {
				var eles = swift('<div></div>').html(other)[0].childNodes;
				this.append(eles);
			} else if (typeof other === 'function') {
				this.each(function(i) {
					$(this).append(other.call(this, i, this.innerHTML));
				});
			} else if (typeof other === 'object' && other.nodeType && other.nodeName) {
				this.each(function(index) {
					this.appendChild(index ? other.cloneNode(true) : other);
				});
			} else if (other.length) {
				for (var i = 0; i < other.length; i++) {
					this.append(other[i]);
				}
			}
		}
		return this;
	}
	Swift.prototype.prepend = function (other) {
		if (!other)
			throw new TypeError();
		if (this.length) {
			if (typeof other === 'string') {
				var eles = swift('<div></div>').html(other)[0].childNodes;
				this.prepend(eles);
			} else if (typeof other === 'function') {
				this.each(function(i) {
					$(this).prepend(other.call(this, i, this.innerHTML));
				});
			} else if (typeof other === 'object' && other.nodeType && other.nodeName) {
				this.each(function(index) {
					this.insertBefore(index ? other.cloneNode(true) : other, this.firstChild);
				});
			} else if (other.length) {
				for (var i = 0; i < other.length; i++) {
					this.prepend(other[i]);
				}
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
					if (typeof other === 'string') {
						try {
							var $ele = swift(other);
							this[name]($ele);
						} catch (e) {
							var eles = swift.filter(swift('<div></div>').html(other)[0].childNodes, function(ele) {
								return ele.nodeType === 1;
							});
							this[name](eles);
						}
					} else if (typeof other === 'object' && other.nodeType && other.nodeName) {
							this[name]([other]);
					} else if (other.length) {
						var newSet = [];
						var src = this;
						swift(other).each(function(index) {
							for (var i=0; i<src.length; i++) {
								var ele = index ? src[i].cloneNode(true) : src[i];
								newSet.push(ele);
								swift(this)[orig](ele);
							}
						});
						return newSet;
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
			if (swift.checkTypes(arguments, ['string'], true)) {
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
			} else if (swift.checkTypes(arguments, ['object'], true)) {
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
				this.innerHTML = ''; //TODO change to $(this).empty();
				$(this).append(children);
			}
		});
		return swift(newEles);
	}
	Swift.prototype.empty = function() {
		this.each(function() {
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
					wrapper = swift(wrapper).clone();
					while (true) {
						if (wrapper.children().length == 0) { // inmost element as real wrapper
							this.each(function() {
								var ele = wrapper.clone(true);
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
					wrapper = swift(wrapper).clone();
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
	Swift.prototype.next = function () {
		if (this.length) return swift(this[0].nextSibling);
		return swift([]);
	}
	Swift.prototype.prev = function () {
		if (this.length) return swift(this[0].previousSibling);
	}
	Swift.prototype.parent = function (selector) {
		if (!selector)
			return this.length ? swift(this[0].parentElement) : undefined;
		// TODO
		// else {
		// 	var current = this[0].parentNode;
		// 	return swift(selector).filter(function() {
		// 		while(current != document.body) {
		// 			if (current == this) {
		// 				return true;
		// 			}
		// 			current = current.parentNode;
		// 		}
		// 	});
		// }
	}
	Swift.prototype.children = function () {
		var children = [];
		this.each(function() {
			swift.filter(this.childNodes, function (ele) {
				return ele.nodeType === 1;
			}).forEach(function(child) {
				children.push(child);
			});
		});
		return swift(children);
	}
	Swift.prototype.not = function (callback) {
		var orig = this,
			targets = [];
		this.each(function (i) {
			if (!callback.call(this, i)) {
				targets.push(orig[i]);
			}
		});
		return swift(targets);
	}
	Swift.prototype.classes = function () {
		if (this.length) return this[0].classList;
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
		if (!speed) return this.css('display', swift.isinline(this.tag()) ? 'inline' : 'block');
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
	Swift.prototype.load = function (url) {
		var mytag = this;
		swift.get({
			url: url,
			success: function (ret) {
				mytag.html(ret);
			}
		});
		return this;
	}
	Swift.prototype.filter = function (callback) {
		return swift.filter(this, callback);
	}
	Swift.prototype.filternot = function (selector) {
		var ised = swift(selector, this.context);
		var noted = [];
		this.each(function () {
			if (!swift.inArray(this, ised)) {
				noted.push(this);
			}
		});
		return swift(noted);
	}
	Swift.prototype.dialog = function (param) {
		if (!arguments.length) param = {};
		if (this.length !== 1) return this;

		if (!this.length || !param || !(param instanceof Object)) return;
		var userDlg = this,
			oldParent = this.parent();
		var dlg = userDlg.dialog = swift('<div></div>')
			.addClass('swift-dialog')
			.width(param.width)
			.height(param.height)
			.css('border', 'solid 5px #777')
			.css('box-shadow', '0 0 10px #777')
			.css('background', '#FFF')
			.css(param.style);

		var bgDiv = param.modal ? swift('<div></div>')
			.css('z-index', '999')
			.css('position', 'fixed')
			.css('left', 0)
			.css('top', 0)
			.css('right', 0)
			.css('bottom', 0)
			.css('background', param.bgBackgroundColor || 'rgba(0, 0, 0, %s)'.fs(param.bgAlpha || 0.3))
			.appendTo(this.doc().body) : undefined;

		if (param.title || param.titleDivStyle || param.close || param.closeText || param.closeIcon || param.closeDivStyle) 
			var titleDiv = swift('<div></div>').addClass('swift-dialog-title')
			.html('<span">%s</span>'.fs(param.title || ""))
			.height(25)
			.width('100%')
			.css('text-align', 'center')
			.css('font-size', '14px')
			.css(param.titleDivStyle)
			.appendTo(dlg);

		if (param.close || param.closeText || param.closeIcon || param.closeStyle) 
			swift('<div></div>').css('float', 'right')
			.css('line-height', '25px')
			.css('font-size', 14)
			.css(param.closeDivStyle)
			.css('cusor', 'pointer')
			.height(25)
			.css(param.closeDivStyle)
			.html(param.closeText || param.closeIcon ? '<img src="%s">'.fs(param.closeIcon) : 'X&nbsp;')
			.appendTo(titleDiv ? titleDiv : dlg)
			.click(function () {
				if (swift.type(param.close) == 'Function') {
					if (param.close.apply(userDlg, arguments)) userDlg.close();
				} else userDlg.close();
			});

		if (param.buttons) {
			var bntDiv = swift('<div></div>').addClass('swift-dialog-buttons')
				.height(25)
				.css('float', 'right')
				.width('100%')
				.css(param.buttonDivStyle)
				.append(swift('<div></div>').css('float', 'right'));
			for (var text in param.buttons) {
				(function (text) {
					swift('<button></button>').html(text).click(function () {
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
		var contentDiv = swift('<div></div>')
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
		if (swift.type(duration) == 'Function') {
			callback = duration;
			duration = undefined;
		}
		var interval = 10,
			ele = this,
			duration = swift.type(duration) == 'Number' ? duration : (function (preset) {
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
				tsv = swift.asInt(tsv);
				if (isNaN(tsv)) continue;
				var unit = /\D*$/.exec(tsv);
				if ( !! unit) unit = 'px';
				var csv /*current style value*/
				= this.css(name);
				if (!csv) csv = this.style(name);
				csv = swift.asInt(csv) || 0;
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
			return swift.asInt(this[0].currentStyle['fontSize']);
		} else if (window.getComputedStyle) {
			return swift.asInt(document.defaultView.getComputedStyle(this[0], null).getPropertyValue('font-size'));
		}
	}
	Swift.prototype.first = function () {
		return swift(this.slice(0, 1));
	}
	Swift.prototype.last = function () {
		return swift(this.slice(-1));
	}
	Swift.prototype.firstChild = function () {
		return swift(this.children().slice(0, 1));
	}
	Swift.prototype.lastChild = function () {
		return swift(this.children().slice(-1))
	}
	Swift.prototype.eq = function (i) {
		return swift(this.slice(i, i + 1));
	}
	Swift.prototype.get = function (i) {
		if (arguments.length) {
			if (this.length > i)
				return this[i];
		}
		return this.slice(0);
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
	// ### Swift ends
	
	// selector for ie
	if (!document.querySelectorAll) document.querySelectorAll = function(selector) {
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
	
	window.$ = window.swift = swift = function (selector, ctx) {
		if (!selector) return null;
		if (!ctx) ctx = window.document;

		var type = swift.type(selector);
		if (type == "String") {
			var matched = /^<(\w+)\s*\/?>(?:<\/\1>)?$/.exec(selector);
			if (matched) var tags = [window.document.createElement(matched[1])];
			else {
				matched = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/.exec(selector);
				if (matched && matched[1]) {
					var tmpDiv = swift('<div></div>'),
						tags = tmpDiv.html(matched[1])[0].childNodes;
				}
				else var tags = document.querySelectorAll.call(ctx, selector);
			}
		} else if (selector instanceof HTMLElement || selector instanceof HTMLDocument || selector === window) var tags = [selector];
		else if (type == 'Array' || type == 'NodeList') var tags = selector;
		else if (type == 'Swift') return selector;
		else if (type == 'Function') {
			//TODO validate this stuff
			if (/loaded|complete/.test(document.readyState)) {
				selector();
			} else {
				if (window.document.addEventListener) {
					window.document.addEventListener("DOMContentLoaded", selector, false);
				} else if (swift.browser.webkit) {
					var _timer = setInterval(function () {
						if (/loaded|complete/.test(document.readyState)) {
							selector();
							clearInterval(_timer);
						}
					}, 10);
				} else {
					window.onload = selector;
				}
			}
			return;
		}
		return new Swift(tags, selector, ctx);
	}
	// swift.error = console ? console.error : alert;
	// swift.log = console ? console.log : alert;
	swift.pixelAsInt = function(pixelStr) {
		return parseInt(pixelStr.substr(0, pixelStr.length-2));
	}
	swift.cloneObject = function(obj) {
		return JSON.parse(JSON.stringify(obj));
	}
	swift.param = function(obj) {
		// TODO
	}
	swift.emptyObject = function(obj) {
		var empty = true;
		for (var i in empty)
			empty = false;
		return empty;
	}
	swift.checkTypes = function(args, types, restricted) {
		if (restricted && types.length !== args.length) return false;
		return types.length === 0 || swift.filter(types, function(type, index) {
			return typeof args[index] === type;
		}).length == types.length;
	}
	swift.slice = function (items) {
		return Array.prototype.slice.call(items);
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
	swift.filter = function (items, callback, reverse) {
		/*
			$.filter(items, callback(item, index, items), reverse)
				if reverse is false or not set, return a collection contains sub-items in items if callback return true or true-like
 				else return a collection contains sub-items in items if callback return false or false-like
		*/
		if (typeof callback != "function") throw new TypeError();
		var res = [];
		Array.prototype.forEach.call(items, function(ele, i, eles) {
			var callback_return = callback.call(eles, ele, i, eles);
			if (reverse && !callback_return ||
				!reverse && callback_return)
				res.push(ele);
			});
		return res;
	}
	swift.map = function (items, callback) {
		/*
			$.map(items, callback(item,index, items))
				return a collection contains with values return from callback
		*/
		var res = [];
		Array.prototype.forEach.call(items, function(ele, i, eles) {
				res.push(callback.call(eles, ele, i, eles));
			});
		return res;
	}
	swift.each = function(items, callback) {
		/*
			$.each( items, callback(index, item) )
		*/
		for (var key in items) {
			var item = items[key];
			callback.call(item, key, item);
		}
	}
	swift.htmlEncode = function (source) {
		return source.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/ /g, '&nbsp;');
	}
	swift.ajax = function (param) {
		if (param == undefined) return;
		var xmlhttp = null;
		if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
			xmlhttp = new XMLHttpRequest();
		} else { // code for IE6, IE5
			xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}
		if (param.method.toUpperCase() == 'GET') {
			if (param.data) {
				if (swift.type(param.data) == "String") {
					param.url += "?" + param.data;
				} else if (swift.type(param.data) == "Object") {
					var data = [];
					for (var i in param.data) {
						data.push("%s=%s".fs(encodeURIComponent(i), encodeURIComponent(param.data[i])));
					}
					param.url += "?" + data.join("&");
				}
			}
		}
		xmlhttp.open(param.method.toUpperCase(), param.url, true);
		for (var key in param.headers) {
			xmlhttp.setRequestHeader(key, param.headers[key]);
		}
		xmlhttp.setRequestHeader('Accept', '*/*')
		xmlhttp.setRequestHeader('Content-Type', 'application/octet-stream')
		xmlhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
		xmlhttp.onreadystatechange = function () {
			if (xmlhttp.readyState == 4) {
				if (param[xmlhttp.status]) {
					var ret = {
						'error': 'HTTP_ERROR',
						'status': xmlhttp.status,
						'headers': xmlhttp.getAllResponseHeaders(),
						'body': xmlhttp.responseText
					};
					param[xmlhttp.status].call(param, ret);
				} else if (xmlhttp.status == 200) {
					if (param.success) {
						var type = param.type,
							ret;
						if (type == undefined || type.toLowerCase() in ['html', 'text']) {
							ret = xmlhttp.responseText;
						} else if (type.toLowerCase() == 'json') {
							ret = swift.parseJSON(xmlhttp.responseText);
						} else if (type.toLowerCase() == 'xml') {
							ret = xmlhttp.responseXML;
						}
						param.success.call(param, ret);
					}
				} else if (param.error) {
					var ret = {
						'error': 'HTTP_ERROR',
						'status': xmlhttp.status,
						'headers': xmlhttp.getAllResponseHeaders(),
						'body': xmlhttp.responseText
					};
					param.error.call(param, ret);
				}
			}
		}
		if (param.timeout) {
			setTimeout(function () {
				xmlhttp.abort();
				var ret = {
					'error': 'TIMEOUT'
				}
				param.error.call(param, ret);
			}, param.timeout);
		}
		if (param.method.toUpperCase() == 'POST') {
			if (!param.data) {
				xmlhttp.send('');
			} else {
				xmlhttp.send(swift.toJSON(param.data));
			}
		}
		try {
			xmlhttp.send();
		} catch(e) {
			return;
		}
	}
	swift.get = function (param) {
		param.method = 'GET';
		return swift.ajax(param);
	}
	swift.post = function (param) {
		param.method = 'POST';
		return swift.ajax(param);
	}
	swift.generateGUID = function () {
		return swift.guid = (swift.guid + 1) || 1;
	}
	swift.isInt = function (n) {
		// Attension: 1E209 is no a int here
		return typeof n == 'number' && parseFloat(n) == parseInt(n) && !isNaN(n);
	}
	swift.styleName = function (name) {
		var camelCase = name.replace(/^-o-/, 'o-').replace(/^-ms-/, 'ms-').replace(/^-webkit-/, 'webkit-').replace(/^-moz-/, 'moz-').replace(/-([a-z]|[0-9])/ig, function (all, letter) {
			return (letter + '').toUpperCase();
		});
		if (camelCase == 'float') return !!swift('<div></div>').html('<a style="float:left"></a>').find('a')[0].style.cssFloat ? 'cssFloat' : 'styleFloat';
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
	swift.alert = function (msg /*required*/ , handler /*optional*/ , userStyle /*optional*/ ) {
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
	swift.data = {};
	swift.param = function (data) {
		var mappings = [];
		for (var k in data)
		mappings.push('%s=%s'.fs(k, encodeURIComponent(data[k])));
		return mappings.join('&');
	}
	swift.merge = function () {
		return [].concat(swift.slice(arguments));
	}
	swift.isNumberic = function (data) {
		return !isNaN(parseFloat(data)) && isFinite(data);
	}
	swift.parseXML = function (data) {
		var xml;
		try {
			if (window.DOMParser) xml = new DOMParser().parseFromString(data, "text/xml");
			else {
				xml = new ActiveXObject("Microsoft.XMLDOM");
				xml.async = "false";
				xml.loadXML(data);
			}
		} catch (e) {
			xml = undefined;
		}
		if (!xml || !xml.documentElement || xml.getElementsByTagName("parsererror").length) swift.error("Invalid XML: " + data);
		return xml;
	}
	swift.now = function () {
		return (new Date()).getTime();
	}
	swift.inArray = function (value, arr, startIdx) {
		for (var i = startIdx || 0; i < arr.length; i++) {
			if (value === arr[i]) return true;
			else continue;
		}
		return false;
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
		if (type === 'string') return swift.quoteString(o);
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
					ret.push(swift.toJSON(o[i]) || 'null');
				}
				return '[' + ret.join(',') + ']';
			}
			var name, val, pairs = [];
			for (var k in o) {
				type = typeof k;
				if (type === 'number') name = '"' + k + '"';
				else if (type === 'string') name = swift.quoteString(k);
				else continue;
				type = typeof o[k];
				if (type === 'function' || type === 'undefined') continue;
				val = swift.toJSON(o[k]);
				pairs.push(name + ':' + val);
			}
			return '{' + pairs.join(',') + '}';
		}
	}
	swift.parseJSON = swift.evalJSON = typeof window.JSON === 'object' && window.JSON.parse ? window.JSON.parse : function (src) {
		var filtered = src.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, '');
		if (/^[\],:{}\s]*$/.test(filtered)) return eval('(' + src + ')');
		else swift.error("Invalid JSON: " + o);
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
		return swift.inArray(tag, ["a", "abbr", "acronym", "b", "bdo", "big", "br", "cite", "code", "dfn", "em", "i", "img", "input", "kbd", "label", "q", "samp", "select", "small", "span", "strong", "sub", "sup", "textarea", "tt", "var"]);
	}
	swift.site_path = function (path) {
		var prefix = this.site_url_prefix.endswith('/') ? this.site_url_prefix.slice(0, -1) : this.site_url_prefix;
		if (path.startswith('/')) {
			return (prefix || '') + path;
		} else {
			return (window.document.location.pathname.endswith('/') ? '%s%s' : '%s/%s').fs(window.document.location.pathname, path);
		}
	}
	swift.site_url = function (path, protocol) {
		var protocol = protocol || window.location.href.startswith('https://') ? 'https' : 'http';
		return "%s://%s%s".fs(protocol, location.host, swift.site_path(path));
	}
	swift.goTo = function (url) {
		return window.document.location.href = url;
	}
	swift.extend = function (params) {
		for (var key in params) {
			Swift.prototype[key] = params[key];
		}
	}
})(window);
