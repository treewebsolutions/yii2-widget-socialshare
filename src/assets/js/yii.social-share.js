(function ($, window, document, undefined) {
	/**
	 * Constants
	 * @constant {String} PLUGIN_NAME
	 * @constant {String} PLUGIN_VERSION
	 * @constant {String} DATA_KEY
	 * @constant {Object} DEFAULTS
	 */
	var PLUGIN_NAME = 'yiiSocialShare',
		PLUGIN_VERSION = '1.0.0',
		EVENT_NS = '.' + PLUGIN_NAME,
		DATA_KEY = 'plugin_' + PLUGIN_NAME,
		DEFAULTS = {
			width: 800,
			height: 500,
			socialNetworks: {
				facebook: 'http://www.facebook.com/sharer.php?u={url}&picture={image}&title={title}&quote={description}',
				twitter: 'https://twitter.com/share?url={url}&text={title}&hashtags={hashtags}',
				linkedin: 'http://www.linkedin.com/shareArticle?url={url}&title={title}',
				pinterest:'https://pinterest.com/pin/create/bookmarklet/?media={image}&url={url}&is_video={is_video}&description={title}',
			},
			data: {
				title: null,
				description: null,
				image: null,
				hashtags: null,
				url: null,
			},
			onInit: function () {},
			onRender: function (popup) {},
			onDestroy: function () {}
		};

	/**
	 * Plugin
	 *
	 * @param element
	 * @param options
	 * @param metadata
	 * @constructor
	 */
	var Plugin = function (element, options, metadata) {
		if (!element) {
			console.error('[' + PLUGIN_NAME + ']: DOM element is missing');
			return;
		}
		this.element = element;
		this.options = $.extend({}, DEFAULTS, options, metadata);
		this.options.socialNetworks = $.extend({}, DEFAULTS.socialNetworks, this.options.socialNetworks);
		this.init();
	};

	/**
	 * Initialization
	 */
	Plugin.prototype.init = function () {
		this._cacheElements();
		this._bindEvents();
		this._hook('onInit');
	};

	/**
	 * Caches DOM Elements.
	 *
	 * @private
	 */
	Plugin.prototype._cacheElements = function () {
		this.$window = $(window);
		this.$document = $(document);
		this.$html = $('html');
		this.$body = $(document.body);
		this.$element = $(this.element);

		this.$metaTags = this.$html.children('head').children('meta');
		this.$linkTags = this.$html.children('head').children('link');
	};

	/**
	 * Binds Events.
	 *
	 * @private
	 */
	Plugin.prototype._bindEvents = function () {
		this.$element.on('click' + EVENT_NS, '.social-share-button', this._onShareButtonClick.bind(this));
	};

	/**
	 * Handles the share button click event.
	 *
	 * @param e
	 * @private
	 */
	Plugin.prototype._onShareButtonClick = function (e) {
		var $target = $(e.currentTarget),
			data = $target.data();

		this.renderPopup(e, this.options.socialNetworks[data.socialNetwork]);

		e.preventDefault();
	};

	/**
	 * Filters the object properties that are not null.
	 *
	 * @param obj
	 * @private
	 */
	Plugin.prototype.filterObject = function (obj) {
		var data = {};

		$.each(obj, function (key, value) {
			if (value) {
				data[key] = value;
			}
		});

		return data;
	};

	/**
	 * Gets the params for share.
	 *
	 * @private
	 */
	Plugin.prototype.getParams = function () {
		var params = $.extend({}, {
			title: this.$document.attr('title'),
			description: this.$metaTags.filter('[name="description"]').attr('content'),
			image: this.$metaTags.filter('[property="og:image"]').attr('content'),
			hashtags: this.$metaTags.filter('[name="keywords"]').attr('content'),
			url: this.$linkTags.filter('[rel="canonical"]').attr('href'),
		}, this.filterObject(this.options.data));

		return this.filterObject(params);
	};

	/**
	 * Renders a share window as a popup.
	 *
	 * @param e
	 * @param url
	 * @private
	 */
	Plugin.prototype.renderPopup = function (e, url) {
		var t = (e.target ? e.target : e.srcElement),
			width = t.data - width || 800,
			height = t.data - height || 500,
			px = Math.floor(((screen.availWidth || 1024) - width) / 2),
			py = Math.floor(((screen.availHeight || 700) - height) / 2),
			features = [
				'width=' + width,
				'height=' + height,
				'left=' + px,
				'top=' + py,
				'location=0',
				'menubar=0',
				'toolbar=0',
				'status=0',
				'scrollbars=1',
				'resizable=1'
			],
			popup = window.open(this.generateUrl(url, this.getParams()), 'social', features.join(','));

		if (popup) {
			popup.focus();
			if (e.preventDefault) {
				e.preventDefault();
			}
			e.returnValue = false;
			this._hook('onRender', popup);
		}

		return !!popup;
	};

	/**
	 * Renders the share window as a popup.
	 *
	 * @param url
	 * @param opt
	 */
	Plugin.prototype.generateUrl = function(url, opt) {
		var prop, arg, arg_ne;

		for (prop in opt) {
			if (opt.hasOwnProperty(prop)) {
				arg = '{' + prop + '}';
				if (url.indexOf(arg) !== -1) {
					url = url.replace(new RegExp(arg, 'g'), encodeURIComponent(opt[prop]));
				}

				arg_ne = '{' + prop + '-ne}';
				if (url.indexOf(arg_ne) !== -1) {
					url = url.replace(new RegExp(arg_ne, 'g'), opt[prop]);
				}
			}
		}

		return this.cleanUrl(url);
	};

	/**
	 * Renders the share window as a popup.
	 *
	 * @param fullUrl
	 */
	Plugin.prototype.cleanUrl = function(fullUrl) {
		fullUrl = fullUrl.replace(/\{([^{}]*)}/g, '');

		var params = fullUrl.match(/[^\=\&\?]+=[^\=\&\?]+/g),
			url = fullUrl.split("?")[0];

		if (params && params.length > 0) {
			url += "?" + params.join("&");
		}

		return url;
	};

	/**
	 * Hooks callbacks and custom events.
	 *
	 * @access private
	 * @param [arguments]
	 */
	Plugin.prototype._hook = function () {
		var args = Array.prototype.slice.call(arguments),
			hookName = args.shift(),
			eventName = '';

		if (hookName.substr(0, 2) === 'on') {
			eventName = hookName.slice(2).charAt(0).toLowerCase() + hookName.slice(3);
		} else {
			eventName = hookName.charAt(0).toLowerCase() + hookName.slice(1);
		}
		eventName += EVENT_NS;

		// Execute the callback
		if (typeof this.options[hookName] === 'function') {
			this.options[hookName].apply(this.element, args);
		}

		// Create a new event
		var event = $.Event(eventName, {
			target: this.element
		});
		// Trigger the event
		this.$element.trigger(event, args);
	};

	/**
	 * Gets or sets a property.
	 *
	 * @access public
	 * @param {String} key
	 * @param {String} val
	 */
	Plugin.prototype.option = function (key, val) {
		if (val) {
			this.options[key] = val;
		} else {
			return this.options[key];
		}
	};

	/**
	 * Destroys the plugin instance.
	 *
	 * @public
	 */
	Plugin.prototype.destroy = function () {
		this._hook('onDestroy');
		this.$window.off(EVENT_NS);
		this.$document.off(EVENT_NS);
		this.$element.off(EVENT_NS);
		this.$element.removeData(DATA_KEY);
	};

	/**
	 * Plugin definition
	 * @function external "jQuery.fn".yiiSocialShare
	 */
	$.fn[PLUGIN_NAME] = function (options) {
		var args = arguments;

		if (!options || typeof options === 'object') {
			return this.each(function () {
				if (!$.data(this, DATA_KEY)) {
					var metadata = $(this).data();
					$.data(this, DATA_KEY, new Plugin(this, options, metadata));
				}
			});
		} else if (typeof args[0] === 'string') {
			var methodName = args[0].replace('_', ''),
				returnVal;

			this.each(function () {
				var instance = $.data(this, DATA_KEY);

				if (instance && typeof instance[methodName] === 'function') {
					returnVal = instance[methodName].apply(instance, Array.prototype.slice.call(args, 1));
				} else {
					throw new Error('Could not call method "' + methodName + '" on jQuery.fn.' + PLUGIN_NAME);
				}
			});

			return (typeof returnVal !== 'undefined') ? returnVal : this;
		}
	};

	/**
	 * Expose global
	 */
	this[PLUGIN_NAME] = Plugin;

})(jQuery, window, document);
