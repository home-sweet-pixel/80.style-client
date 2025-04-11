


	/*
	 *
	 *	==========================================
	 *	80.style user interface -- script generics
	 *	==========================================
	 *
	 *	Copyright 2020-2024 by Alessandro Ghignola
	 *	Public domain - but you're on your own. :)
	 *
	 */

  const avoid = new Array						// empty array		(singular, read-only-use instance)
  const clear = new Object						// empty object 	(singular, read-only-use instance)
  const idler = function () {}						// empty function	(does nothing, replaces callbacks)

  const arrow = String.fromCharCode (96)				// backtick, which the UI displays as right-pointing arrow
  const aster = String.fromCharCode (42)				// asterisk, used for notes and one-entry supercollections
  const avail = String.fromCharCode (97)				// an 'a', actually, declared here for back/forw className
  const blank = String.fromCharCode (32)				// blank space, for those who worry about stripping issues
  const brace = String.fromCharCode (125)				// right brace, marks supercollections and passport length
  const comma = String.fromCharCode (44)				// yeeeh it just sucks to see the ',' kind of thing around
  const colon = String.fromCharCode (58)				// well, at this point, we just need some cuter alignments
  const digit = String.fromCharCode (48)				// the single zero digit, replaces missing numeric strings
  const equal = String.fromCharCode (61)				// equal sign, for the assembly of expressions, and frames
  const minus = String.fromCharCode (45)				// the minus sign, or dash, or hyphen, whatever horizontal
  const nline = String.fromCharCode (10)				// new line, matching the length of others instead of '\n'
  const point = String.fromCharCode (46)				// extensions, and used to "equalize" note numbers' length
  const quest = String.fromCharCode (63)				// question mark, often fills unknowns in a noticeable way
  const quote = String.fromCharCode (34)				// doublequote actually, but it's meant to be in all cases
  const score = String.fromCharCode (95)				// underscore, means blank space in our safeset convention
  const semic = String.fromCharCode (59)				// semicolon, in lists and in specs of note "pick" options
  const slash = String.fromCharCode (47)				// forward slash, path separator character, replaces blank
  const tilde = String.fromCharCode (126)				// ASCII tilde, modality separator in any navigational URI
  const vertb = String.fromCharCode (124)				// vertical bar, so far essentially used to create RegExps
  const fullb = String.fromCharCode (9608)				// full block

  const block = String (blank + blank)					// block quote, at fixed indent level (currently 2 spaces)
  const dline = String (nline + nline)					// line spacer, paragraph, whatever: two adjacent newlines
  const empty = String ('')						// empty string for those who plain detest seeing '' or ""
  const ellip = String ('...')						// in particular, follows a "talking about <<this thing>>"
  const hpadd = String ('<div class="hp"></div>')			// label highlight "pad"
  const index = String (minus + arrow)					// index arrow, a hyphen followed by an arrow (noticeable)
  const joint = String (blank + arrow + blank)				// joins two strings by a spaced arrow (author > homepage)
  const field = String (blank + arrow + arrow + blank)			// goes between a keyword or field lengths, and that field
  const frame = String (nline + block + minus + nline)			// standard single-stroke ruler/frame (------------------)
  const picks = String (nline + 'P' + field)				// introduces options menus after forcing a newline
  const pick  = String (picks.substr (1))				// introduces options menus where no newline was necessary

  const author = String ('}`')						// author signature
  const nought = Array (digit)						// where we need a valid replacement numeric string to pop

	/*
	 *	shortcuts
	 */

  const $ = function (id) { return document.getElementById (id) }

  const max = Math.max
  const min = Math.min

	/*
	 *	just alternatives to typeof checks
	 *	for validating arguments...
	 */

  const undefed = function (arg) { return typeof arg === 'undefined' }
  const defined = function (arg) { return typeof arg !== 'undefined' }

	/*
	 *	RegExp arbitrary string escape
	 */

  const reg_escape = function (s) {

		return (Array.from (s).map (c => { return /\W/.test (c) ? `\\x${c.charCodeAt (0).toString (16)}` : c }).join (empty))

	}

	/*
	 *
	 *	data type normalization for public functions and methods:
	 *	e.g. so we can type
	 *
	 *		absolutelyNumber = be.number (maybeNumber).or (0)
	 *		absolutelyString = be.string (maybeString).or ('')
	 *		absolutelyObject = be.object (maybeObject).or ({ })
	 *
	 *	and make sure the resulting data type is what's meant to be;
	 *	origin: the Mary Lou HTTP server source code, cor/com module
	 *	minus the "buffer" and "deject" pseudo-types
	 *
	 */

  const be = {

		lambda: function (v) {

			return {

				or: function (v) {

					return this.v === null ? v : this.v

				}.bind ({ v: typeof v === 'function' ? v : null })

			}

		},

		number: function (v) {

			return {

				or: function (v) {

					return this.v === null ? v : this.v

				}.bind ({ v: typeof v === 'number' ? isNaN (v) ? null : v : null })

			}

		},

		object: function (v) {

			return {

				or: function (v) {

					return this.v === null ? v : this.v

				}.bind ({ v: v instanceof Object ? Array.isArray (v) ? null : v : null })

			}

		},

		regexp: function (v) {

			return {

				or: function (v) {

					return this.v === null ? v : this.v

				}.bind ({ v: (v || 0).constructor === RegExp ? v : null })

			}

		},

		string: function (v) {

			return {

				or: function (v) {

					return this.v === null ? v : this.v

				}.bind ({ v: typeof v === 'string' ? v : null })

			}

		},

		switch: function (v) {

			return {

				or: function (v) {

					return this.v === null ? v : this.v

				}.bind ({ v: typeof v === 'boolean' ? v : null })

			}

		},

		vector: function (v) {

			return {

				or: function (v) {

					return this.v === null ? v : this.v

				}.bind ({ v: (v || 0).constructor === Array ? v : null })

			}

		}

	}

	/*
	 *
	 *	manages timeouts that automatically clear if re-used before they expire,
	 *	leaving no pending calls
	 *
	 */

  const ModalTimeout = {

		by_id: {

			/*
			 *	stores actual timeout entries,
			 *	per "literal" timeout ID
			 */

		},

		clr: function (args) {

		    let id = be.string (args && args.id).or (quest)
		    let ti = be.number (this.by_id [id]).or (false)

			ti && clearTimeout (ti)
			delete (this.by_id [id])

		},

		set: function (args) {

		    let id = be.string (args && args.id).or (quest)
		    let msecs = be.number (args && args.msecs).or (1000)
		    let handler = be.lambda (args && args.handler).or (idler)

			this.clr ({ id: id })
			this.by_id [id] = setTimeout (handler, msecs)

			return (this.by_id [id])

		}

	}

	/*
	 *
	 *	animates DOM elements: pretty old but still used, mostly by the TIO;
	 *	I had a create function in this small package too, but it's not used here
	 *
	 */

  const Dom = {

		animate: function (args) {

			/*
			 *	sample use with comments
			 *	------------------------
			 *
			 *	Dom.animate ({
			 *
			 *		elementId: 'row',	// animate this element
			 *		property: 'style.top',	// this property
			 *		default: ry,		// starting from this value
			 *		toValue: ry = Y,	// gradually bringing it to this value
			 *		postfix: 'px',		// expressed in pixels
			 *		fps: 50,		// at a rate giving this number of frames per second
			 *		ratio: 0.2,		// bringing it closer each time by this fraction
			 *		accept: 1		// until below this maximum error
			 *
			 *	});
			 */

		    let elementId =	be.string (args && args.elementId).or (quest)
		    let property =	be.string (args && args.property).or (quest)
		    let toValue =	be.number (args && args.toValue).or (0)
		    let postfix =	be.string (args && args.postfix).or (false)
		    let ratio = 	be.number (args && args.ratio).or (.5)
		    let msecs = 	be.number (args && args.fps).or (50)
		    let accept =	be.number (args && args.accept).or (.1)
		    let oncompletion =	be.lambda (args && args.oncompletion).or (idler)
		    let actual =	be.number (this.by_id [elementId]).or (be.number (args && args.default).or (0))

			property =	"$('" + elementId + "')." + property
			ratio = 	Math.max (0, ratio)
			msecs = 	1000 / (args.fps > 1 ? args.fps : 50)
			accept =	Math.max (0, accept)

			if (Math.abs (toValue - actual) <= accept) {

				ModalTimeout.clr ({ id: elementId + '(a)' })

				postfix && eval (property + equal + quote + toValue + postfix + quote)
				postfix || eval (property + equal + toValue)

				delete (this.by_id [elementId])

				return (oncompletion ())

			}

			postfix && eval (property + equal + quote + actual + postfix + quote)
			postfix || eval (property + equal + actual)

			this.by_id [elementId] = (actual += ratio * (toValue - actual))

			ModalTimeout.set ({

				msecs: msecs,
				id: elementId + '(a)',
				handler: function () { Dom.animate (args) }

			})

		},

		by_id: {

			/*
			 *	stores actual (numeric) value of animated property,
			 *	per element ID: because it stores only one number
			 *	per element, the same element can't be animated
			 *	over more properties at the same time, but so far
			 *	this has been pretty acceptable...
			 */

		}

	}

	/*
	 *
	 *	keyboard shortcuts handler:
	 *	derives from code by someone under a pseudonym, no visible copyright found
	 *
	 */

  const Shortcut = {

		add: function (combination, callback, opt) {

		    let defaults = {

				type:		String ('keydown'),
				workInInput:	false,
				target: 	document,
				propagate:	false

			}

		    let func = function (e) {

			    let modifiers = {

					shift:	{ wanted: false, pressed: false },
					ctrl:	{ wanted: false, pressed: false },
					alt:	{ wanted: false, pressed: false },
					meta:	{ wanted: false, pressed: false }

				}

				modifiers.ctrl.pressed = e.ctrlKey || false
				modifiers.shift.pressed = e.shiftKey || false
				modifiers.alt.pressed = e.altKey || false
				modifiers.meta.pressed = e.metaKey || false

				if (opt.workInInput === false) {

				    let element = e.target || e.srcElement || false

					if (element === false)

						return

					if (element.nodeType === 3)

						element = element.parentNode

					if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT' || element.tagName === 'SELECT')

						return

				}

			    let char = ((e = e || window.event).key || empty).toLowerCase ()
			    let comb = combination.split ('+')
			    let keys = Array ()
			    let skip = false
			    let hits = 0

				if (char === blank)

					char = 'space'

				for (let hit of comb)

					if (hit.length > 0)

						keys.push (hit)

					else {

						skip ? 0 : keys.push ('+')
						skip = skip ? false : true

					}

				for (let key of keys)

					switch (key) {

						case 'ctrl':

							modifiers.ctrl.wanted = true
							++ hits
							break

						case 'shift':

							modifiers.shift.wanted = true
							++ hits
							break

						case 'alt':

							modifiers.alt.wanted = true
							++ hits
							break

						case 'meta':

							modifiers.meta.wanted = true
							++ hits
							break

						default:

							char === key && (++ hits)

					}

				if (hits == keys.length)

					if (modifiers.ctrl.pressed === modifiers.ctrl.wanted &&
					    modifiers.shift.pressed === modifiers.shift.wanted &&
					    modifiers.alt.pressed === modifiers.alt.wanted &&
					    modifiers.meta.pressed === modifiers.meta.wanted) {

						this.any (e)
						callback (e)

						opt ['propagate'] || (e.stopPropagation && e.stopPropagation ())
						opt ['propagate'] || (e.preventDefault && e.preventDefault ())

						return (opt ['propagate'])

					}

				return

			}.bind (this)

			if (this.all [combination])

				return

			if (opt)

				for (let dfo in defaults)

					if (undefed (opt [dfo]))

						opt [dfo] = defaults [dfo]

			opt || (opt = defaults)

			this.all [combination] = {

				event: opt.type, callback: func,
				target: $(opt.target) || opt.target

			}

			this.all [combination].target.addEventListener (opt.type, func, false)

		},

		remove: function (combination) {

			if (defined (this.all [combination])) {

			    let tc = this.all [combination]
			    let type = tc.event
			    let element = tc.target
			    let callback = tc.callback

				delete (this.all [combination])
				element.removeEventListener (type, callback, false)

			}

		},

		all: {

			/*
			 *	active shortcuts
			 *	are recorded here
			 */

		},

		any: function (e) {

			/*
			 *	on-any-shortcuts
			 *	preflight handler
			 */

		}

	}

	/*
	 *
	 *	XHR HTTP(S) request:
	 *	always asynchronous, POST-method only
	 *
	 */

	requestTo = ('not/yet/set')		// set upon first request, but constant
  const s_channel = ('we/have/one')		// enables prompt to switch to HTTPS
//const s_channel = ('unavailable')		// removes prompt to switch to HTTPS

	/*
	 *	document language,
	 *	sent along with requests to obtain localized responses
	 */

  const lang = encodeURIComponent (document.documentElement.lang)

	/*
	 *	request content encryption:
	 *
	 *	key should be a hex string, with any digit A to F in lowercase;
	 *	the same .cdec function may be used to either encode or decode,
	 *	for example:
	 *
	 *		encrypt.cdec ({ string: 'foo', key: 'bad' }) -> 'emn'
	 *		encrypt.cdec ({ string: 'emn', key: 'bad' }) -> 'foo'
	 */

	encrypt = {

		cdec: function (args) {

		    let k = be.string (args && args.key).or ('fff')
		    let s = be.string (args && args.string).or ('')
		    let r = ''

			if (k.length)

				for (let i = 0; i < s.length; ++ i)

					r = r + String.fromCharCode (((s.charCodeAt (i) - 32) ^ (this.hton [k [i % k.length]] || 0)) + 32)

			return r || s

		},

		hton: {

			0: 3, 1: 1, 2: 2, 3: 3,
			4: 1, 5: 1, 6: 2, 7: 3,
			8: 3, 9: 1, a: 2, b: 3,
			c: 1, d: 1, e: 2, f: 3

		}

	} // encrypt

	/*
	 *	Requester,
	 *	constructor
	 */

	Requester = function (args) {

		this.request =			new XMLHttpRequest ()
		this.requestInProgress =	false
		this.onload =			idler
		this.onwhoa =			idler
		this.notes =			be.object (args && args.notes).or (null)
		this.query = requestTo =	be.string (args && args.query).or (requestTo)

		switch (location.protocol) {

			case 'http:': default:

				this.query = 'http://' + (this.query) + ':81'
				return this

			case 'https:':

				this.query = 'https://' + (this.query) + ':444'
				return this

		} // dyn server is always bound to the port number following the "static" port (80 -> 81, 443 -> 444)

	} // constructor

	/*
	 *	Requester,
	 *	post method
	 */

	Requester.prototype.post = function (args) {

		if (args && args.monadic) {

			be.lambda (args && args.onload).or (idler).call ()
			return (this)

		} // bypass the request and assume it succeeded (fake requests)

		switch (this.requestInProgress) {

			case false:

			    let query = be.string (args && args.uri).or (empty)
			    let pairs = be.vector (args && args.pairs).or ([ ])
			    let parms = new Array ('language' + equal + (lang))
			    let crypt = be.switch (args && args.encrypt).or (0)
			    let o_t_p = localStorage.identity || (crypt = null)
			    let token = query.match (/\[(\w+)\]$/)

				if (token) {

					query = query.replace (/\[(\w+)\]$/, empty)
					parms.push ('token' + equal + token.pop ())

				} // if a token is part of the queried URL, clip and send it as value

				this.onload = be.lambda (args && args.onload).or (idler)
				this.onwhoa = be.lambda (args && args.onwhoa).or (idler)

				this.request.open ('POST', this.query + query, (true))
				this.request.setRequestHeader ('Content-Type', 'application/x-www-form-urlencoded')
				this.request.onreadystatechange = this.requestInProgress = this.handler.bind (this)

				if (be.lambda (args && args.onprog).or (false))

					this.request.upload.onprogress = be.lambda (args && args.onprog).or (idler).bind (this)

				for (let aPair of pairs)

					parms.push (aPair.name + equal + encodeURIComponent (aPair.encrypt ? encrypt.cdec ({ string: aPair.value, key: o_t_p }) : aPair.value))

				if (crypt)

					parms.push ('encrypted=yes')

				this.request.send (parms.join ('&'))

		}

		return (this)

	} // post-method request

	/*
	 *	Requester,
	 *	ready-state-change handler
	 */

	Requester.prototype.handler = function () {

		switch (this.request.readyState) {

			case 4:

				switch (this.request.status) {

					case 200:

						this.onload ({

							status: 	this.request.status,
							response:	this.request.response,
							text:		this.request.responseText,
							xml:		this.request.responseXML,
							notes:		this.notes

						})

						break

					case 204:

						/*
						 *	not sure here, just got a sys_no_response
						 *	out of a picture post (as of /postImage),
						 *	shortly after the upload progress bar had
						 *	appeared; this occurred on the first such
						 *	attempt to post an image, which triggered
						 *	the "OPTIONS" request and got the 204: it
						 *	might be the browser's business, but it's
						 *	still an integral part of the request, so
						 *	MAYBE the RSC handler gets ALSO called on
						 *	completion of the said, implied "OPTIONS"
						 *	request? if that was the case, this would
						 *	in fact proceed to the default branch for
						 *	this "switch" block, and trigger the load
						 *	error handler passing a void response (as
						 *	a response to "OPTIONS" IS supposed to be
						 *	void, being made to retrieve the headers)
						 *	where such void response would in turn be
						 *	replaced with a sys_no_response paragraph
						 *
						 *	      - to avoid the above, I can try and
						 *		intercept a status of 204 here so
						 *		it won't proceed to "default" and
						 *		ALSO leave a request in progress,
						 *		but I'm really not sure that'd be
						 *		the case... I never saw it happen
						 *		before, maybe it was a connection
						 *		hiccup, after all...
						 */

						this.onwhoa ({

							status: 	this.request.status,
							response:	this.request.response,
							text:		t_no_content || String ('NO CONTENT'),
							xml:		null,
							notes:		this.notes

						})

						break

					case 413:

						this.onwhoa ({

							status: 	this.request.status,
							response:	t_req_too_large,
							text:		String ('PAYLOAD TOO LARGE'),
							xml:		null,
							notes:		this.notes

						})

						break

					default:

						this.onwhoa ({

							status: 	this.request.status,
							response:	this.request.response,

							text: be.string ({

								0x0: 'NO REPORTED STATUS',
								400: 'BAD REQUEST',
								403: 'FORBIDDEN',
								404: 'NOT FOUND',
								405: 'METHOD NOT ALLOWED',
								406: 'NOT ACCEPTABLE',
							     // 413: 'PAYLOAD TOO LARGE',
								414: 'REQUEST URI TOO LONG',
								415: 'UNSUPPORTED MEDIA TYPE',
								418: "I'M A TEAPOT!",
								425: "TOO EARLY",
								429: "TOO MANY REQUESTS",
								500: 'INTERNAL SERVER ERROR',
								501: 'NOT IMPLEMENTED',
								503: 'SERVICE UNAVAILABLE'

							} [this.request.status]).or ('UNKNOWN SERVER STATUS CODE'),

							xml:		null,
							notes:		this.notes

						})

				} // error 413 comes as Mary Lou discards excess data (> ~25 MiB)

				this.requestInProgress = false

		} // wait state 4, then call load or error handlers, and THEN clear progress flag

	} // ready-state-change handler

	/*
	 *
	 *	safeset translators,
	 *	reverse-case utility
	 *
	 */

  const tf_tt = {

		'1':'1', '2':'2', '3':'3', '4':'4', '5':'5', '6':'6', '7':'7', '8':'8', '9':'9', '0':'0', ' ':'_', '_':';',
		'Q':'Q', 'W':'W', 'E':'E', 'R':'R', 'T':'T', 'Y':'Y', 'U':'U', 'I':'I', 'O':'O', 'P':'P', 'A':'A', 'S':'S', 'D':'D',
		'F':'F', 'G':'G', 'H':'H', 'J':'J', 'K':'K', 'L':'L', 'Z':'Z', 'X':'X', 'C':'C', 'V':'V', 'B':'B', 'N':'N', 'M':'M',
		'~':'a', '!':'b', '@':'c', '#':'d', '$':'e', '%':'f', '^':'g', '&':'h', '*':'i', '(':'j', ')':'k', '-':'l', '=':'m',
		'+':'n', '[':'o', '{':'p', ']':'q', '}':'r', ';':'s', ':':'t', "'":'u', '"':'v', ',':'w', '.':'x', '/':'y', '?':'z'

	} // forward translation table: encodes punctuators as lower-case letters

  const tb_tt = {

		'1':'1', '2':'2', '3':'3', '4':'4', '5':'5', '6':'6', '7':'7', '8':'8', '9':'9', '0':'0', '_':' ', ';':'_',
		'Q':'Q', 'W':'W', 'E':'E', 'R':'R', 'T':'T', 'Y':'Y', 'U':'U', 'I':'I', 'O':'O', 'P':'P', 'A':'A', 'S':'S', 'D':'D',
		'F':'F', 'G':'G', 'H':'H', 'J':'J', 'K':'K', 'L':'L', 'Z':'Z', 'X':'X', 'C':'C', 'V':'V', 'B':'B', 'N':'N', 'M':'M',
		'a':'~', 'b':'!', 'c':'@', 'd':'#', 'e':'$', 'f':'%', 'g':'^', 'h':'&', 'i':'*', 'j':'(', 'k':')', 'l':'-', 'm':'=',
		'n':'+', 'o':'[', 'p':'{', 'q':']', 'r':'}', 's':';', 't':':', 'u':"'", 'v':'"', 'w':',', 'x':'.', 'y':'/', 'z':'?'

	} // reverse translation table: decodes lower-case as puntuation

  const rc_tt = {

		'Q':'q', 'W':'w', 'E':'e', 'R':'r', 'T':'t', 'Y':'y', 'U':'u', 'I':'i', 'O':'o', 'P':'p', 'A':'a', 'S':'s', 'D':'d',
		'F':'f', 'G':'g', 'H':'h', 'J':'j', 'K':'k', 'L':'l', 'Z':'z', 'X':'x', 'C':'c', 'V':'v', 'B':'b', 'N':'n', 'M':'m',
		'q':'Q', 'w':'W', 'e':'E', 'r':'R', 't':'T', 'y':'Y', 'u':'U', 'i':'I', 'o':'O', 'p':'P', 'a':'A', 's':'S', 'd':'D',
		'f':'F', 'g':'G', 'h':'H', 'j':'J', 'k':'K', 'l':'L', 'z':'Z', 'x':'X', 'c':'C', 'v':'V', 'b':'B', 'n':'N', 'm':'M'

	} // lettercase reversal table

  const tf = function (string) {

	    let rs = empty

		for (let char of string)

			rs = rs + (tf_tt [char] || empty)

		return (rs)

	} // forward translation: whatever is not in the safeset will be removed

  const tb = function (string) {

	    let rs = empty

		for (let char of string)

			rs = rs + (tb_tt [char] || empty)

		return (rs)

	} // reverse translation: whatever is not in the safeset will be removed

  const rc = function (string) {

	    let rs = empty

		for (let i = 0; i < string.length; ++ i)

			rs = rs + (rc_tt [string [i]] || string [i])

		return (rs)

	} // case reversal: whatever isn't a Latin letter will be left unaltered

	/*
	 *
	 *	determines literal units of time for elapsed time (milliseconds)
	 *
	 */

  const _ = function (diff) {

	    let lapse = Math.ceil (Math.max (0, be.number (diff).or (0)) / 6E4)
	    let units = t_minutes

		if (lapse == 0)

			return ({ no: t_lapse_right, units: t_lapse_now })

		if (lapse > 60) {

			lapse = Math.round (lapse / 60)
			units = t_hours

			if (lapse > 24) {

				lapse = Math.round (lapse / 24)
				units = t_days

				if (lapse > 30) {

					lapse = Math.round (lapse / 30)
					units = t_months

					if (lapse > 12) {

						lapse = Math.round (lapse / 12)
						units = t_years

					}

				}

			}

		}

		if (lapse == 1)

			return ({ no: lapse, units: blank + units.single + blank + t_ago })
			return ({ no: lapse, units: blank + units.plural + blank + t_ago })

	}


