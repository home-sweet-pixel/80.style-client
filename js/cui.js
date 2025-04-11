


	/*
	 *
	 *	==========================================
	 *	80.style user interface - frontpage script
	 *	==========================================
	 *
	 *	Copyright 2020-2025 by Alessandro Ghignola
	 *	Public domain - but you're on your own. :)
	 *
	 */

  const THEME = String ('ACN')			// default theme
    let FORCE = false				// forcing theme
    let NLAND = true				// consent landscape orientation
    let MSAYS = null				// element corresponding to Mary Lou's label note, in The Array
    let MSAID = null				// what we had Mary say last time her note was updated, null if she had nothing to say (default note)

  const notebooks = {

		NBL: 'url(/2d/jpg/page-l-m.jpg)',
		NBT: 'url(/2d/jpg/page-t-m.jpg)',
		NBR: 'url(/2d/jpg/page-r-m.jpg)'

	}

  const T = Object ({

		'ACN': { name: 'ACN', fieldGradient: { obligate: 'rgba(187,187,204,.50)', optional: 'rgba(187,187,204,.33)' }, prev: 'VGA', next: 'ATR' },	// ACN
		'ATR': { name: 'ATR', fieldGradient: { obligate: 'rgba(176,205,255,.50)', optional: 'rgba(176,205,255,.33)' }, prev: 'ACN', next: 'C64' },	// ATR
		'C64': { name: 'C64', fieldGradient: { obligate: 'rgba(136,122,222,.50)', optional: 'rgba(136,122,222,.33)' }, prev: 'ATR', next: 'CGA' },	// C64
		'CGA': { name: 'CGA', fieldGradient: { obligate: 'rgba(068,255,068,.44)', optional: 'rgba(068,255,068,.22)' }, prev: 'C64', next: 'LCD' },	// CGA
		'LCD': { name: 'LCD', fieldGradient: { obligate: 'rgba(000,000,000,.16)', optional: 'rgba(000,000,000,.08)' }, prev: 'CGA', next: 'LCS' },	// LCD
		'LCS': { name: 'LCS', fieldGradient: { obligate: 'rgba(000,000,000,.16)', optional: 'rgba(000,000,000,.08)' }, prev: 'LCD', next: 'NBL' },	// LCS
		'NBL': { name: 'NBL', fieldGradient: { obligate: 'rgba(000,255,000,.33)', optional: 'rgba(255,255,000,.33)' }, prev: 'LCS', next: 'NBT' },	// NBL
		'NBT': { name: 'NBT', fieldGradient: { obligate: 'rgba(000,255,000,.33)', optional: 'rgba(255,255,000,.33)' }, prev: 'NBL', next: 'NBR' },	// NBT
		'NBR': { name: 'NBR', fieldGradient: { obligate: 'rgba(000,255,000,.33)', optional: 'rgba(255,255,000,.33)' }, prev: 'NBT', next: 'NDY' },	// NBR
		'NDY': { name: 'NDY', fieldGradient: { obligate: 'rgba(068,255,068,.50)', optional: 'rgba(068,255,068,.33)' }, prev: 'NBR', next: 'P_1' },	// NDY
		'P_1': { name: 'P_1', fieldGradient: { obligate: 'rgba(068,255,068,.44)', optional: 'rgba(068,255,068,.22)' }, prev: 'NDY', next: 'P_3' },	// P_1
		'P_3': { name: 'P_3', fieldGradient: { obligate: 'rgba(255,221,000,.44)', optional: 'rgba(255,221,000,.22)' }, prev: 'P_1', next: 'T3C' },	// P_3
		'P_4': { name: 'P_4', fieldGradient: { obligate: 'rgba(128,144,221,.50)', optional: 'rgba(114,128,204,.33)' }, prev: 'P_3', next: 'T3C' },	// P_4 ("The Array" theme)
		'T3C': { name: 'T3C', fieldGradient: { obligate: 'rgba(255,255,255,.50)', optional: 'rgba(255,255,255,.33)' }, prev: 'P_3', next: 'TVA' },	// T3C
		'TVA': { name: 'TVA', fieldGradient: { obligate: 'rgba(255,128,000,.50)', optional: 'rgba(255,128,000,.22)' }, prev: 'T3C', next: 'VFD' },	// TVA
		'VFD': { name: 'VFD', fieldGradient: { obligate: 'rgba(144,188,255,.44)', optional: 'rgba(144,188,255,.22)' }, prev: 'TVA', next: 'VGA' },	// VFD
		'VGA': { name: 'VGA', fieldGradient: { obligate: 'rgba(188,188,204,.50)', optional: 'rgba(187,187,204,.33)' }, prev: 'VFD', next: 'ACN' }	// VGA

	}) // dictionary and properties of known themes

  const cui = {

		going: false,			// first request made, UI is fully initialized
		hover: false,			// state of hovering help bar as known
		timer: false,			// help bar on/off timers
		state: false,			// UI-modal element in show (clipboard and all dialogs)
		queue: false,			// there is an element to show upon closing the one in show (holds the full closure)
		trans: false,			// elements transition timers
		uNote: empty,			// current clipboard usage note
		cSend: empty,			// current clipboard send label
		value: empty,			// value of clipboard field (not effectively used, unless we un-comment access to the system clipboard)
		clip2: false,			// exec function on "paste" (where to send the value of the clipboard for handling)
		exit2: false,			// exec function on "close" (what to do if the clipboard is closed)
		enact: false,			// exec function on "quest" (what to do if the question receives confirmation)
		deact: false,			// exit function on "quest" (what to do if the question receives denial)
		posit: 0x001,			// last cursor row which the UI considers "binding" for the positioning of its elements
		title: false,			// last label that was being displayed in the help bar, on top

		/*
		 *	help balloon
		 */

		ball: {

			flags: new String,
			reach: new String,
			rpost: new String,

			comic: new Object,
			holdr: new Object,
			point: null,

			loadr: function () { cui.ball.point && nav.to (null, cui.ball.point) }

		},

		say: function (text, link) {

			if (link) {

				cui.ball.point = link
				cui.ball.comic.onclick = cui.ball.loadr
				cui.ball.comic.style.cursor = 'pointer'

			}

			cui.ball.holdr.innerHTML = text
			cui.ball.comic.style.display = 'block'
			setTimeout (function () { cui.ball.comic.style.opacity = 1 }, 0)

		},

		shush: function (args) {

			cui.ball.point = null
			cui.ball.comic.onclick = null
			cui.ball.comic.style.opacity = 0
			cui.ball.comic.style.cursor = 'default'
			setTimeout (function () { cui.ball.comic.style.display = 'none' }, 500)

		},

		/*
		 *	cosmetic strings, replacing 8< and >8 around TIO text clips:
		 *	in almost all cases they'd imitate dash frames; where frames
		 *	look too "bulky", one or both may be set to a void string in
		 *	order to "hide" the relevant frame(s)
		 */

		clipStart: '<tt>--</tt>',
		clipClose: '<tt>--</tt>',

		/*
		 *	returns the current theme, with properties
		 */

		theme: function () {

		    let p = be.string (FORCE).or (be.string (localStorage.theme).or (''))
		    let q = be.object (T [p]).or (T [THEME])

			return (q)

		},

		/*
		 *	unlock and relock elements to portrait-orientation rendering
		 */

		ulock: function (el) { el.className = el.className.split ('-L').shift () },
		rlock: function (el) { el.className = el.className.split ('-L').shift () + '-L' },

		/*
		 *	character range of anything that could not be typed anywhere
		 */

		nonlegit: RegExp ('[\\x00-\\x09][\\x0B-\\x1F]|\\x60|\\x7C|[\\x7E-\\uFFFF]', 'g'),

		/*
		 *	UI reflow, in consequence of resizes
		 */

		refit: function (quick) {

			nav.updateMarkers ()

			// on nonfalsy argument, position alert, question and clipboard boxes only:
			// this is done if there is no real reflow to account for...

			cbd.style.top = tio.cp && (tio.cp.y.toFixed (0) + 'px') || empty
			qtn.style.top = att.style.top = (tio.ch * cui.posit).toFixed (0) + 'px'
			scn.style.height = pag.style.height = nav.ph = nav.is ? tio.keyboardHooked ? '100vh' : (3 * tio.ch).toFixed (0) + 'px' : '100vh'

			if (quick)

				return

			// adjust ideal page margins

		    let lMargin = tio.le - parseFloat (getComputedStyle (cml).borderLeftWidth.split ('px').shift ()) - 1

			cml.style.left = (lMargin + 2 * tio.cw).toFixed (0) + 'px'
			cmr.style.left = (tio.le + 58 * tio.cw).toFixed (0) + 'px'

			// adjust height of link pad

			pad.style.height = (tio.ch * 3).toFixed (0) + 'px'

			// adjust "superimpressions"

		    let elem = $('cpic') || $('epic') || $('spic') || $('evid') || $('gate')

			if (elem) {

			    let placement = elem.className.split (score)

				ovs.style.top = 	(tio.ch * parseInt (placement [1] || 0) + 0x0000).toFixed (0) + 'px'
				ovs.style.left =	(tio.cw * parseInt (placement [0] || 0) + tio.le).toFixed (0) + 'px'
				elem.style.width =	(tio.cw * parseInt (placement [2] || 0) + 0x0000).toFixed (0) + 'px'
				elem.style.height =	(tio.ch * parseInt (placement [3] || 0) + 0x0000).toFixed (0) + 'px'

				if ($('evif')) {

					evif.style.width = elem.style.width
					evif.style.height = elem.style.height

				}

			}

			// adjust clipboard-specific measures

			clipboard.style.lineHeight =
			usageNote.style.lineHeight =
			closeCtrl.style.lineHeight =
			pasteCtrl.style.lineHeight =
			questions.style.lineHeight =
			abortCtrl.style.lineHeight =
			eventCtrl.style.lineHeight =
			attention.style.lineHeight =
			rightCtrl.style.lineHeight = tio.ch.toFixed (0) + 'px'

			// adjust measures concerning dialogs

			hlp.style.height =
			cbd.style.height =
			qtn.style.height =
			att.style.height = tio.ch.toFixed (0) + 'px'

			hlp.style.lineHeight = (tio.ch).toFixed (0) + 'px'
			hlp.style.fontSize = (2 * tio.cw).toFixed (0) + 'px'
			cui.label (cui.title)

			// adjust help overlay and tail-of-screen bar

		 // let scope = innerHeight
		 // let posit = label_positions.split (comma)
		 // let posis = posit.map (function (coln) { return be.number (parseInt (coln)).or (0) })

			// adjust help balloon position

			ball.style.top = (2.1111111111 * tio.ch).toFixed (0) + 'px'
			ball.style.right = (3 * tio.cw + tio.le).toFixed (0) + 'px'
			ball.style.fontSize = (1.41414 * tio.cw).toFixed (0) + 'px'

			// adjust size of notebook page

			hdl.style.backgroundSize = scn.style.backgroundSize = pag.style.backgroundSize = txt.style.backgroundSize = cui.theme ().name in notebooks ? 'auto' + blank + (9 * tio.ch).toFixed (0) + 'px' : empty

			/*
			 *	upon refitting a "painted" intro scene, call "ray.onaction" to
			 *	revert the intro animation to "stopped", so it'll render again
			 */

			nav.st.intro === 'painted' && ray.onaction ()

		},

		/*
		 *	show/hide help bar
		 */

		handleOp: function () {

			return '0'

		     /* return {

				LCD: '.25',
				LCS: '.21',

			} [cui.theme ().name] || '.5' */

		},

		helps: function (f, instant_off) {

			cui.sm = Math.max (tio.pt, cui.sm)

			switch ((f = be.switch (f).or (false)) === cui.hover) {

				case false:

					clearTimeout (cui.timer)

					f && (hlp.style.display = 'block')
					f || (hlp.style.opacity = '0')

					switch (cui.hover = f) {

						case true:	return (cui.timer = setTimeout (function () { hlp.style.opacity = cui.handleOp () }, 17))
						case false:	return (cui.timer = setTimeout (function () { hlp.style.display = String ('none') }, instant_off ? 0 : 500))

					}

			}

		},

		/*
		 *	configure label in help bar
		 */

		label: function (label) {

			cui.title = label = be.string (label).or (empty)

			if (label) {

				label.length >= 44 || (hlp.innerText = fullb + fullb + blank + label)
				label.length >= 44 || (hlp.style.paddingLeft = (11 * tio.cw + tio.le).toString () + 'px')
				label.length >= 44 && (hlp.innerText = label)
				label.length >= 44 && (hlp.style.paddingLeft = (~~ (((tio.ww - tio.cw * label.length) / 2) / tio.cw) * tio.cw + tio.le).toString () + 'px')

			}

		},

		/*
		 *	search call on enter,
		 *	but will do tab+enter when setting home areal or quicktripping
		 */

		findr: function (context) {

			if (context.data) {

				if (context.line.indexOf (field + t_search) + 1) {

					nav.find ()		// run search
					return (false)		// prevent TIO default behavior

				} // it reads "SEARCH"

				if (context.line.indexOf (field + 'AREACODE') + 1) {

					tio.nextField ()	// select next field
					tio.enter ()		// trigger next link
					return (false)		// prevent TIO default behavior

				} // it reads "AREACODE"

			} // one data field is focused

			return (true)

		},

		/*
		 *	invoke the clipboard
		 */

		board: function (e, args) {

			cui.clip2 = be.lambda (args && args.exec).or (false)
			cui.exit2 = be.lambda (args && args.exit).or (false)

			if ((tio.l1 <= tio.cp.j && tio.cp.j <= tio.l2) || args) {

				switch (cui.state) {

					case false:

						args || (tio.scrollToCursor ())
						cui.state = true
						break

					case true:

						cui.queue || (cui.queue = function () { cui.queue = false; cui.board (this.event, this.args) }.bind ({ event: e || false, args: args }))
						be.object (e).or (new Object).cancelBubble = true
						return

				}

			     /* try {

					cui.value = empty

					navigator.clipboard.readText ().then (function (text) {

						clipboard.value = cui.value = text.split (/[\r\n]/).shift ().replace (/^\s+|\s+$/g, empty)

					})

				} catch (e) { } */

				if (typeof (args && args.posit) === 'number') {

					cui.posit = tio.cp.y = args.posit
					tio.cp.y *= tio.ch

				}

				cui.refit (1)
				cbd.style.display = 'block'

				cui.trans = setTimeout (function () {

					usageNote.innerText = (this.hint || cui.uNote)
					pasteCtrl.innerText = (args ? t_x : cui.cSend)
					clipboard.value = cui.value || tio.cl || empty
					cbd.style.opacity = '1'

					usageNote.onclick = function () {

						usageNote.style.display = 'none'

						clipboard.focus ()
						clipboard.setSelectionRange (0, clipboard.value.length)

					}

					this.hint || (clipboard.style.textTransform = 'initial')
					this.hint && (clipboard.style.textTransform = 'uppercase')

					this.instaFocus ? usageNote.onclick () : null

				}.bind ({ instaFocus: e || args ? false : true, hint: be.string (args && args.question).or (false) }), 67)

				/*
				 *	leave things as they are when the clipboard is in show,
				 *	i.e. when the user's trying to paste something, usually
				 *	a remote link: on mobile devices, when the system touch
				 *	keyboard appears, it will trigger onresize and that may
				 *	switch from portrait to landscape layout: the latter is
				 *	inadequate, where the intended layout was accommodating
				 *	portrait orientations (text would be too small); hence,
				 *	if we're in portrait orientation upon turning the clip-
				 *	board on, we clear the NLAND flag that usually consents
				 *	the U.I. to switch to a landscape-oriented layout
				 */

				innerWidth > innerHeight || (NLAND = false)

				if (NLAND === false) {

					cui.rlock (hdl)
					cui.rlock (hdr)
					cui.rlock (hlp)
					cui.rlock (bar)
					cui.rlock (scn)
					cui.rlock (osk)
					cui.rlock (ctl)
					cui.rlock (pad)
					cui.rlock (cbd)
					cui.rlock (att)
					cui.rlock (qtn)

				}

				tio.onconfirm = function () {

					cui.paste (tio.onconfirm = cui.findr)	// prevent recursion as cui.paste calls tio.enter
					return (false)				// prevent default behavior of "Enter" key in TIO

				}

				Shortcut.add ('escape', cui.close, { workInInput: true })

			}

			be.object (e).or (new Object).cancelBubble = true

		},

		/*
		 *	close the clipboard
		 */

		close: function (e) {

			clearTimeout (cui.trans, cbd.style.opacity = '0')

			cui.trans = setTimeout (function () {

				clipboard.value = empty
				cbd.style.display = 'none'
				usageNote.style.display = 'block'

				cui.state = false
				cui.queue ? cui.queue () : cui.exit2 ? cui.exit2 () : 0

				cui.clip2 = false
				cui.exit2 = false

			}, 500)

			if (NLAND === false) {

				cui.ulock (hdl)
				cui.ulock (hdr)
				cui.ulock (hlp)
				cui.ulock (bar)
				cui.ulock (scn)
				cui.ulock (osk)
				cui.ulock (ctl)
				cui.ulock (pad)
				cui.ulock (cbd)
				cui.ulock (att)
				cui.ulock (qtn)

				onresize.call (NLAND = true)

			}

			tio.onconfirm = cui.findr
			Shortcut.remove ('escape')
			be.object (e).or (new Object).cancelBubble = true

		},

		/*
		 *	paste (from visual clipboard)
		 */

		paste: function (e) {

		    let value = be.string (clipboard.value).or (empty).replace (cui.nonlegit, score)

			if (cui.clip2) {

				cui.clip2 (value)

				cui.clip2 = false
				cui.exit2 = false

				cui.close (e)
				be.object (e).or (new Object).cancelBubble = true

				return

			}

		    let field = tio.lineField ()
		    let split = field.line.substr (0, tio.cp.i).match (/(\S)/)
		    let trail = field.line.length === tio.cp.i

			// because we'll be calling "enter" which triggers tio.onconfirm, if we let
			// this happen when clicking on the "pasteCtrl" element of the DOM, "enter"
			// will in turn call this function again, resulting in a "double paste": by
			// setting back tio.onconfirm to default, we prevent this while essentially
			// doing nothing unforeseen, since "cui.close" will later do the same thing

			tio.onconfirm = cui.findr

			if (value) {

				split && tio.enter ()
					 tio.putKey.call ({ key: value })
				trail || tio.enter ()

			}

			cui.close (e)
			be.object (e).or (new Object).cancelBubble = true

		},

		/*
		 *	denial handler for question dialogs
		 */

		abort: function (e) {

			clearTimeout (cui.trans)

			att.style.opacity = '0'
			qtn.style.opacity = '0'

			cui.trans = setTimeout (function () {

				att.style.display = 'none'
				qtn.style.display = 'none'

				tio.onconfirm = cui.findr
				Shortcut.remove ('escape')

				cui.state = false
				cui.deact ? cui.deact.call () : 0
				cui.queue ? cui.queue.call () : 0

			}, 500)

			be.object (e).or (new Object).cancelBubble = true

		},

		/*
		 *	confirm handler in question dialogs
		 */

		event: function (e) {

			cui.abort (e, cui.deact = false)
			cui.enact && (cui.enact.call ())

		},

		/*
		 *	display question dialog,
		 *	e.g. cui.quest ({ question: 'fuck?', exec: fuck, exit: naah })
		 */

		quest: function (args) {

			switch (cui.state) {

				case true:

					cui.queue || (cui.queue = function () { cui.quest (this.quest, cui.queue = false) }.bind ({ quest: args }))
					return

			}

			cui.posit = be.number (args && args.posit).or (cui.posit)
			cui.refit (1)
			qtn.style.display = 'block'

			cui.trans = setTimeout (function () {

				qtn.style.opacity = '1'
				questions.innerText = be.string (this.question).or (quest)

			}.bind (args || clear), 67)

			cui.enact = be.lambda (args && args.exec).or (false)
			cui.deact = be.lambda (args && args.exit).or (false)
			cui.state = true

			tio.onconfirm = function () {

				cui.abort (0, cui.deact = false)
				cui.enact && (cui.enact.call ())

				return (false)	// prevent default behavior of "Enter" key in TIO

			}

			Shortcut.add ('escape', cui.abort)

		},

		/*
		 *	bring up alert box,
		 *	e.g. cui.alert ({ argument: 'damn!', exit: oh_well })
		 */

		alert: function (args) {

			switch (cui.state) {

				case true:

					cui.queue || (cui.queue = function () { cui.alert (this.alert, cui.queue = false) }.bind ({ alert: args }))
					return

			}

			cui.posit = be.number (args && args.posit).or (cui.posit)
			cui.refit (1)
			att.style.display = 'block'

			cui.trans = setTimeout (function () {

				att.style.opacity = '1'
				attention.innerText = be.string (this.argument).or (quest)

			}.bind (args || clear), 67)

			cui.deact = be.lambda (args && args.exit).or (false)
			cui.state = true

			tio.onconfirm = function () {

				cui.abort ({})
				return (false)	// prevent default behavior of "Enter" key in TIO

			}

			Shortcut.add ('escape', cui.abort)

		},

		/*
		 *	clear all dialogs
		 */

		clear: function (e) {

			clearTimeout (cui.trans)

			cbd.style.opacity = att.style.opacity = qtn.style.opacity = '0'
			cbd.style.display = att.style.display = qtn.style.display = 'none'

			clipboard.value = empty
			usageNote.style.display = 'block'

			cui.state = false
			cui.queue = false
			cui.deact ? cui.deact.call () : 0

			if (NLAND === false) {

				cui.ulock (hdl)
				cui.ulock (hdr)
				cui.ulock (hlp)
				cui.ulock (bar)
				cui.ulock (scn)
				cui.ulock (osk)
				cui.ulock (ctl)
				cui.ulock (pad)
				cui.ulock (cbd)
				cui.ulock (att)
				cui.ulock (qtn)

				onresize.call (NLAND = true)

			}

			tio.onconfirm = cui.findr
			Shortcut.remove ('escape')
			be.object (e).or (new Object).cancelBubble = true

		},

		/*
		 *	change theme
		 *	eh, it once was called "style" and the name stuck...
		 */

		restyle: function (args) {

		    let theme = be.string (args && args.theme).or (cui.theme ().name)

			top.className =
			cbd.className =
			qtn.className =
			att.className =
			cur.className =
			txt.className =
			ovl.className =
			clc.className =
			pad.className = document.body.className = theme

			hdl.className =
			hdr.className =
			hlp.className =
			scn.className =
			pag.className = theme + (NLAND ? empty : '-L')

			setTimeout (function () {

			    let color = getComputedStyle (txt).color
			    let fader = getComputedStyle (document.body).backgroundColor
			    let filtr = be.string (getComputedStyle (scc).filter).or (empty).match (/blur\(.+\)/)

				filtr = be.vector (filtr).or ([ empty ]).pop ()
				filtr = filtr.length ? blank + filtr : empty

				hlp.style.color = color
				hlp.style.opacity = cui.handleOp ()

				if (theme in notebooks) {

					osk.style.backgroundColor = {

						NBL: '#646480',
						NBT: '#505060',
						NBR: '#6F6F84'

					} [theme] || '#555565'

					osk.style.backgroundBlendMode = 'unset'
					osk.style.mixBlendMode = 'color-burn'
					osk.style.boxShadow = '0 0 4px #000'

				}

				else {

					osk.style.backgroundBlendMode = {

						LCD: 'darken',
						LCS: 'darken'

					} [theme] || empty

					osk.style.mixBlendMode = 'unset'
					osk.style.backgroundColor = nav.is ? 'transparent' : fader
					osk.style.boxShadow = nav.is ? 'unset' : '0 0 9px' + blank + fader

				}

				osk.style.filter = {

					CGA: 'sepia(1) hue-rotate(426deg) saturate(2)',
					NDY: 'sepia(1) hue-rotate(404deg) saturate(2)',
					P_1: 'sepia(1) hue-rotate(426deg) saturate(2)',
					P_3: 'sepia(1) hue-rotate(360deg) saturate(2)',
					TVA: 'sepia(1) hue-rotate(340deg) saturate(3)'

				} [theme] || empty

				tok.style.backgroundSize = {

					LCD: 'auto 200%',
					LCS: 'auto 200%',
					NBL: 'auto 200%',
					NBT: 'auto 200%',
					NBR: 'auto 200%'

				} [theme] || empty

				tok.style.backgroundPositionY = {

					LCD: '100%',
					LCS: '100%',
					NBL: '100%',
					NBT: '100%',
					NBR: '100%'

				} [theme] || empty

				World.nullSurface = {

					LCD: '#FFFFFF',
					LCS: '#FFFFFF',
					NBL: '#000000',
					NBT: '#000000',
					NBR: '#000000',
					VFD: '#000000'

				} [theme] || fader

				World.monoOutline = {

					LCD: '#000000',
					LCS: '#000000',
					T3C: '#FFFFFF'

				} [theme] || notset

				scc.style.filter = {

					ACN: 'brightness(1.4)' + filtr,
					CGA: 'brightness(1.0) sepia(1) hue-rotate(426deg) saturate(2.0)' + filtr,
					NBL: 'invert(1) saturate(0)' + filtr,
					NBT: 'invert(1) saturate(0)' + filtr,
					NBR: 'invert(1) saturate(0)' + filtr,
					NDY: 'brightness(1.0) sepia(1) hue-rotate(426deg) saturate(2.0)' + filtr,
					P_1: 'brightness(1.0) sepia(1) hue-rotate(426deg) saturate(2.0)' + filtr,
					P_3: 'brightness(.90) sepia(1) hue-rotate(338deg) saturate(2.0) contrast(1.1)' + filtr,
					TVA: 'brightness(.90) sepia(1) hue-rotate(340deg) saturate(3.0) contrast(1.4)' + filtr,
					VGA: 'brightness(1.2)' + filtr

				} [theme] || filtr

				scc.style.mixBlendMode = {

					ACN: 'plus-lighter',
					ATR: 'lighten',
					C64: 'lighten',
					CGA: 'plus-lighter',
					LCD: 'darken',
					LCS: 'darken',
					NBL: 'multiply',
					NBT: 'multiply',
					NBR: 'multiply',
					NDY: 'plus-lighter',
					P_1: 'plus-lighter',
					P_3: 'plus-lighter',
					P_4: 'plus-lighter',
					T3C: 'lighten',
					TVA: 'plus-lighter',
					VFD: 'plus-lighter',
					VGA: 'plus-lighter'

				} [theme] || String ('unset')

				cui.going && ray.ctxClear ()
				cui.going && ray.onaction ()

			}, 67)

			txt.style.backgroundImage = notebooks [theme] || empty
			hdl.style.backgroundSize  = scn.style.backgroundSize = pag.style.backgroundSize = txt.style.backgroundSize = theme in notebooks ? 'auto' + blank + (9 * tio.ch).toFixed (0) + 'px' : empty

		},

		/*
		 *	update menu bar
		 */

		mbUpdate: function (args) {

			switch (nav.al) {

				case false:

					nav.mb = nav.cb = be.string (args && args.menu).or (nav.mb)

					if (nav.is)

						nav.mb = nav.cb = nav.cb.replace ('{<} {>}', '{' + t_exit + '}').replace ('{^^ ~C}', '{' + t_exit + '}')

					if ((back.className == score) && (forw.className == score))

						nav.mb = nav.cb = nav.mb.replace ('[\\] {`}', be.string ({ en: '[-` IT]', it: '[-` EN]' } [lang]).or ('[\\] {`}'))

					if (tio.cp.j == home.rowIndex)

						tio.positionCursor.call ({ hold: true }, tio.cp = tio.findCp (tio.ci = tio.findVCi (home.colIndex, home.rowIndex)))

					break

				case true:

					nav.mb = nav.cb = nav.qb

			}

			if (be.switch (args && args.live).or (false)) {

				tio.update (tio.it.replace (/\n[^]*?(\n|$)/, (tio.mb = nav.cb).trimRight () + '$1'))
				tio.ovs.innerHTML = be.vector (tio.ot).or (avoid).join (empty)

			}

		},

		reIcon: function (emo) {

		    let links = document.querySelectorAll ('link[rel="shortcut icon"]')
			links.forEach (l => l.parentNode.removeChild (l))

		    let link = document.createElement ('link')
			link.rel = 'shortcut icon'
			link.href = '/favicon.ico'

			if (emo = be.string (emo).or (null)) {

				emo = {

					'heart': '\u2764\uFE0F'

				} [emo] || emo

			    let canvas = document.createElement ('canvas')
				canvas.height = 114
				canvas.width = 114

			    let ctxt = canvas.getContext ('2d')
				ctxt.font = '88px serif'
				ctxt.fillText (emo, 0, 88)

				link.href = canvas.toDataURL ()

			}

			document.head.appendChild (link)

		},

		mq: false,	// modal question (prevent update to cui.posit)
		mr: false,	// modal request (prevent double content posts)
		sm: 0		// scrolling maximum (recorded for the captcha)

	}

	window.onload = async function () {

		/*
		 *	interface controls aliases
		 */

		flub = {}						// currently backs thru themes
		fluo = {}						// ex screen color radiobutton
		full = hlp						// interface full-screen control
		flip = {}						// picture orientation toggle
		mody = {}						// user page modification/revert
		post = {}						// write new page
		edit = {}						// not-me button: view as visitor
		save = {}						// user page modification/save
		link = {}						// link button
		sort = {}						// sort toggle control (once, l4)

		/*
		 *	array gate
		 */

		gate = {}

		/*
		 *	hard-wired models counters
		 */

		system_models = 0
		system_childs = 0

		/*
		 *	load non-local UI messages
		 */

		  t_full = String ('F11')			// default full-screen control caption

		t_corner = nline + nline + block		// two blank lines plus one blockquote
		t_marker = blank + field			// TIO short field placeholder: should take as much as 'N >> '

		cui.cSend = pasteCtrl.innerText 		// default clipboard send label
		cui.uNote = usageNote.innerText 		// default clipboard usage note

		/*
		 *	prepare help balloon
		 */

		cui.ball.comic = be.object ($('ball')).or (new Object)
		cui.ball.holdr = be.object ($('says')).or (new Object)
		cui.ball.flags = be.string ($('t_ball_flags') && $('t_ball_flags').innerHTML).or ('We had %F report(s)<br>about illicit contents:<br>please hit Alt-X...')
		cui.ball.reach = be.string ($('t_ball_reach') && $('t_ball_reach').innerHTML).or ('View discussion where<br>this note was posted...')
		cui.ball.rpost = be.string ($('t_ball_rpost') && $('t_ball_rpost').innerHTML).or ('Press the balloon<br>to post a new note...')

		/*
		 *	grab localized UI messages
		 */

	     // label_positions = be.string ($('label_positions') && $('label_positions').innerText	).or ('2,10,42,53,32')
		find_position	= be.string ($('find_position')   && $('find_position').innerText	).or ('0/17/3')
		find_colIndex	= be.string ($('find_colIndex')   && $('find_colIndex').innerText	).or ('17')
		find_rowIndex	= be.string ($('find_rowIndex')   && $('find_rowIndex').innerText	).or ('3')
		t_x		= be.string ($('t_x')		  && $('t_x').innerText 		).or ('SEND')
		t_secure_switch = be.string ($('t_secure_switch') && $('t_secure_switch').innerText	).or ('Would you like to switch to our secure site (HTTPS)?')
		t_loading	= be.string ($('t_loading')	  && $('t_loading').innerText		).or ('/~~~LOADING ...').replace (/\~/g, '\t')
		t_nothing	= be.string ($('t_nothing')	  && $('t_nothing').innerText		).or ('/~~~CHECK LATER').replace (/\~/g, '\t')
		t_highlights	= be.string ($('t_highlights')	  && $('t_highlights').innerText	).or ('ALL THE HIGHLIGHTS')
		t_nothingToSee	= be.string ($('t_nothingToSee')  && $('t_nothingToSee').innerText	).or ('Sorry, nobody announced anything, yet.')
		t_no_content	= be.string ($('t_no_content')	  && $('t_no_content').innerText	).or ('WE MADE IT ALL THE WAY BACK TO THE TOP')
		t_req_too_large = be.string ($('t_req_too_large') && $('t_req_too_large').innerText	).or ('OBJECT TOO LARGE (HTTP ERROR 494)')
		t_welcome	= be.string ($('t_welcome')	  && $('t_welcome').innerText		).or ('80.STYLE:BLOGS::80.STYLE:BLOGS::80.STYLE:BLOGS::80.STYLE')
		t_join_now	= be.string ($('t_join_now')	  && $('t_join_now').innerText		).or ('JOIN US NOW!')
		t_enter 	= be.string ($('t_enter')	  && $('t_enter').innerText		).or ('SIGN UP OR LOG IN')
		t_help_central	= be.string ($('t_help_central')  && $('t_help_central').innerText	).or ('HELP CENTRAL')
		t_stuff_to_see	= be.string ($('t_stuff_to_see')  && $('t_stuff_to_see').innerText	).or ('STUFF TO SEE')
		t_about_to_see	= be.string ($('t_about_to_see')  && $('t_about_to_see').innerText	).or ('about/stuff_to_see')
		t_grt		= be.string ($('t_grt') 	  && $('t_grt').innerText		).or ('HI')
		t_go_to_blog	= be.string ($('t_go_to_blog')	  && $('t_go_to_blog').innerText	).or ('ACCESS YOUR BLOG')
		t_share_blog	= be.string ($('t_share_blog')	  && $('t_share_blog').innerText	).or ('SHARE THIS BLOG')
		t_share_now	= be.string ($('t_share_now')	  && $('t_share_now').innerText 	).or ('TBD')
		t_blog_index	= be.string ($('t_blog_index')	  && $('t_blog_index').innerText	).or ('BLOG INDEX')
		t_visit_blog	= be.string ($('t_visit_blog')	  && $('t_visit_blog').innerText	).or ('VISIT BLOG')
		t_latest	= be.string ($('t_latest')	  && $('t_latest').innerText		).or ('NEW')
		t_oldest	= be.string ($('t_oldest')	  && $('t_oldest').innerText		).or ('OLD')
		t_home		= be.string ($('t_home')	  && $('t_home').innerText		).or ('&nbsp;HOME&nbsp;')
		t_prog		= be.string ($('t_prog')	  && $('t_prog').innerText		).or ('UPLOAD IN PROGRESS...')
		t_loadingCover	= be.string ($('t_loading_cover') && $('t_loading_cover').innerText	).or ('LOADING COVER IMAGE:')
		t_loadingImage	= be.string ($('t_loading_image') && $('t_loading_image').innerText	).or ('LOADING COVER PICTURE:')
		t_loadingPhoto	= be.string ($('t_loading_photo') && $('t_loading_photo').innerText	).or ('LOADING PROFILE PICTURE:')
		t_loadingPack	= be.string ($('t_loading_pack')  && $('t_loading_pack').innerText	).or ('LOADING PACKAGE:')
		t_loadingSlides = be.string ($('t_loadingSlides') && $('t_loadingSlides').innerText	).or ('LOADING SLIDES:')
		t_stay_on_tab	= be.string ($('t_stay_on_tab')   && $('t_stay_on_tab').innerText	).or ('PLEASE DO NOT CLOSE THIS TAB.')
		t_talk		= be.string ($('t_talk')	  && $('t_talk').innerText		).or ('NAN')
		t_linksomething = be.string ($('t_linksomething') && $('t_linksomething').innerText	).or ('SHARE A LINK...')
		t_welc_aboard	= be.string ($('t_welc_aboard')   && $('t_welc_aboard').innerText	).or ('WELCOME ABOARD!')
		t_username	= be.string ($('t_username')	  && $('t_username').innerText		).or ('USERNAME')
		t_password	= be.string ($('t_password')	  && $('t_password').innerText		).or ('PASSWORD')
		t_available	= be.string ($('t_available')	  && $('t_available').innerText 	).or ('USERNAME IS AVAILABLE')
		t_forgotten	= be.string ($('t_forgotten')	  && $('t_forgotten').innerText 	).or ('FORGOTTEN_USERNAME')
		t_test	= block + be.string ($('t_test')	  && $('t_test').innerText		).or ('8<-------- /PLEASE TYPE A 99-CHARACTER INTRO/ ----------')
		t_to_go 	= be.string ($('t_to_go')	  && $('t_to_go').innerText		).or ('TO GO -->8')
		t_fill_passport = be.string ($('t_fill_passport') && $('t_fill_passport').innerText	).or ('I believe I told you to type a 99-character intro above.')
		t_old_password	= be.string ($('t_old_password')  && $('t_old_password').innerText	).or ('OLD PASSWORD')
		t_new_password	= be.string ($('t_new_password')  && $('t_new_password').innerText	).or ('NEW PASSWORD')
		t_h0		= be.string ($('t_h0')		  && $('t_h0').innerText		).or ('TITLE FOR YOUR BLOG')
		t_h1		= be.string ($('t_h1')		  && $('t_h1').innerText		).or ('HINT TOWARD SHARING')
		t_h2		= be.string ($('t_h2')		  && $('t_h2').innerText		).or ('CALL THE BLOG INDEX')
		t_h3		= be.string ($('t_h3')		  && $('t_h3').innerText		).or ('PROFILE PAGE ADVERT')
		t_need_help	= be.string ($('t_need_help')	  && $('t_need_help').innerText 	).or ('NEED HELP WITH THIS?')
		t_help_page	= be.string ($('t_help_page')	  && $('t_help_page').innerText 	).or ('GET HELP HERE...')
		t_help_intro	= be.string ($('t_help_intro')	  && $('t_help_intro').innerText	).or ("IT SHOULDN'T BE HARD")
		t_back_typing	= be.string ($('t_back_typing')   && $('t_back_typing').innerText	).or ('BACK TO TYPING...')
		t_collection	= be.string ($('t_collection')	  && $('t_collection').innerText	).or ('COLLECTION')
		t_page_title	= be.string ($('t_page_title')	  && $('t_page_title').innerText	).or ('PAGE TITLE')
		t_serve_file	= be.string ($('t_serve_file')	  && $('t_serve_file').innerText	).or ('PUBLIC PACKAGE FILENAME')
		t_discussion	= be.string ($('t_discussion')	  && $('t_discussion').innerText	).or ('DISCUSSION')
		t_visibility	= be.string ($('t_visibility')	  && $('t_visibility').innerText	).or ('VISIBILITY')
		t_text	= block + be.string ($('t_text')	  && $('t_text').innerText		).or ('8<----------------------+ TEXT +------------------------')
		t_save_discard	= be.string ($('t_save_discard')  && $('t_save_discard').innerText	).or ('You need to save or discard changes first.')
		t_no_response	= be.string ($('t_no_response')   && $('t_no_response').innerText	).or ('UNDEFINED RESPONSE')
		t_your_trashcan = be.string ($('t_your_trashcan') && $('t_your_trashcan').innerText	).or ('YOUR TRASH CAN')
		t_trashcan_void = be.string ($('t_trashcan_void') && $('t_trashcan_void').innerText	).or ('YOUR TRASH CAN IS EMPTY')
		t_void_trashcan = be.string ($('t_void_trashcan') && $('t_void_trashcan').innerText	).or ('N `` VOID THE TRASH CAN')
		t_welcome_page	= be.string ($('t_welcome_page')  && $('t_welcome_page').innerText	).or ('N `` WELCOME PAGE')
		t_restore_page	= be.string ($('t_restore_page')  && $('t_restore_page').innerText	).or ('N `` RESTORE PAGE')
		t_status_200but = be.string ($('t_status_200but') && $('t_status_200but').innerText	).or ('200, BUT...')
		t_malf_response = be.string ($('t_malf_response') && $('t_malf_response').innerText	).or ('MALFORMED SERVER RESPONSE')
		t_expired_page	= be.string ($('t_expired_page')  && $('t_expired_page').innerText	).or ('EXPIRED OPERATION REPORT')
		t_corrupt_drop	= be.string ($('t_corrupt_drop')  && $('t_corrupt_drop').innerText	).or ('CORRUPT TRASH CAN ENTRY')
		t_link_back	= be.string ($('t_link_back')	  && $('t_link_back').innerText 	).or ('L `` BACK')
		t_package_loss	= be.string ($('t_package_loss')  && $('t_package_loss').innerText	).or ('Dropped packages cannot be recovered!')
		t_picture_loss	= be.string ($('t_picture_loss')  && $('t_picture_loss').innerText	).or ('Dropped pictures cannot be recovered!')
		t_discard_chgs	= be.string ($('t_discard_chgs')  && $('t_discard_chgs').innerText	).or ('Discard changes?')
		t_discard_draft = be.string ($('t_discard_draft') && $('t_discard_draft').innerText	).or ('Discard this draft?')
		t_startDownload = be.string ($('t_startDownload') && $('t_startDownload').innerText	).or ('-` START DOWNLOAD')
		t_writeYourNote = be.string ($('t_writeYourNote') && $('t_writeYourNote').innerText	).or ('WRITE YOUR NOTE')
		t_store_page	= be.string ($('t_store_page')	  && $('t_store_page').innerText	).or ('STORE THIS PAGE')
		t_back		= be.string ($('t_back')	  && $('t_back').innerText		).or ('back')
		t_cancel	= be.string ($('t_cancel')	  && $('t_cancel').innerText		).or ('cancel')
		t_profiles	= be.string ($('t_profiles')	  && $('t_profiles').innerText		).or ('about/')
		t_new_proms	= be.string ($('t_new_proms')	  && $('t_new_proms').innerText 	).or ('ANNOUNCEMENTS')
		t_new_pages	= be.string ($('t_new_pages')	  && $('t_new_pages').innerText 	).or ('NEW PAGES')
		t_new_images	= be.string ($('t_new_images')	  && $('t_new_images').innerText	).or ('NEW IMAGES')
		t_new_authors	= be.string ($('t_new_authors')   && $('t_new_authors').innerText	).or ('NEW AUTHORS')
		t_new_products	= be.string ($('t_new_products')  && $('t_new_products').innerText	).or ('NEW PRODUCTS')
		t_older_proms	= be.string ($('t_older_proms')   && $('t_older_proms').innerText	).or ('LIST MORE ANNOUNCEMENTS')
		t_older_pages	= be.string ($('t_older_pages')   && $('t_older_pages').innerText	).or ('LIST MORE PAGES')
		t_older_picts	= be.string ($('t_older_picts')   && $('t_older_picts').innerText	).or ('LIST MORE IMAGES')
		t_older_users	= be.string ($('t_older_users')   && $('t_older_users').innerText	).or ('LIST MORE AUTHORS')
		t_older_packs	= be.string ($('t_older_packs')   && $('t_older_packs').innerText	).or ('LIST MORE DOWNLOADS')
		t_more_notes	= be.string ($('t_more_notes')	  && $('t_more_notes').innerText	).or ('SHOW MORE NOTES')
		t_end_of_notes	= be.string ($('t_end_of_notes')  && $('t_end_of_notes').innerText	).or ('END OF NOTES')
		t_with_pic	= be.string ($('t_with_pic')	  && $('t_with_pic').innerText		).or ('WITH PIC')
		t_add_note	= be.string ($('t_add_note')	  && $('t_add_note').innerText		).or ('TALKING ABOUT')
		t_first_note	= be.string ($('t_first_note')	  && $('t_first_note').innerText	).or ('/NO NOTES OR NO FURTHER NOTES TO SHOW /')
		t_first_post	= be.string ($('t_first_post')	  && $('t_first_post').innerText	).or ('/NO POSTS OR NO FURTHER POSTS TO SHOW /')
		t_post		= be.string ($('t_post')	  && $('t_post').innerText		).or ('POST')
		t_post_syn1	= be.string ($('t_post_syn1')	  && $('t_post_syn1').innerText 	).or ('POST!')
		t_post_syn2	= be.string ($('t_post_syn2')	  && $('t_post_syn2').innerText 	).or ('POST (CTL-S)')
		t_sign_up_first = be.string ($('t_sign_up_first') && $('t_sign_up_first').innerText	).or ('Erm... you should first sign up, of course.')
		t_note_too_long = be.string ($('t_note_too_long') && $('t_note_too_long').innerText	).or ('Note is too long and will be truncated: post anyway?')
		t_clear_note	= be.string ($('t_clear_note')	  && $('t_clear_note').innerText	).or ('RUB OUT')
		t_paste_link	= be.string ($('t_paste_link')	  && $('t_paste_link').innerText	).or ('LINK...')
		t_paste_syn1	= be.string ($('t_paste_syn1')	  && $('t_paste_syn1').innerText	).or ('PASTE A LINK')
		t_paste_syn2	= be.string ($('t_paste_syn2')	  && $('t_paste_syn2').innerText	).or ('PASTE A LINK (CTL-V, CTL-V)')
		t_your_reply	= be.string ($('t_your_reply')	  && $('t_your_reply').innerText	).or ('YOUR REPLY')
		t_postscript	= be.string ($('t_postscript')	  && $('t_postscript').innerText	).or ('POSTSCRIPT')
		t_give_up	= be.string ($('t_give_up')	  && $('t_give_up').innerText		).or ('GIVE UP')
		t_fold_up	= be.string ($('t_fold_up')	  && $('t_fold_up').innerText		).or ('FOLD UP')
		t_see		= be.string ($('t_see') 	  && $('t_see').innerText		).or ('DISPLAY')
		t_reply 	= be.string ($('t_reply')	  && $('t_reply').innerText		).or ('REPLY')
		t_replies	= be.string ($('t_replies')	  && $('t_replies').innerText		).or ('REPLIES')
		t_reply_verb	= be.string ($('t_reply_verb')	  && $('t_reply_verb').innerText	).or ('REPLY')
		t_no_replies	= be.string ($('t_no_replies')	  && $('t_no_replies').innerText	).or ('NO REPLY TO SEE')
		t_ps		= be.string ($('t_ps')		  && $('t_ps').innerText		).or ('PS...')
		t_expunge	= be.string ($('t_expunge')	  && $('t_expunge').innerText		).or ('EXPUNGE')
		t_tis_bad	= be.string ($('t_tis_bad')	  && $('t_tis_bad').innerText		).or ('REDCARD')
		t_flag_note	= be.string ($('t_flag_note')	  && $('t_flag_note').innerText 	).or ('REPORT!')
		t_thanks	= be.string ($('t_thanks')	  && $('t_thanks').innerText		).or ('THANKS!')
		t_legitimized	= be.string ($('t_legitimized')   && $('t_legitimized').innerText	).or ('The above content was marked legit by operators.')
		t_condemn	= be.string ($('t_condemn')	  && $('t_condemn').innerText		).or ('CONDEMN')
		t_permaL	= be.string ($('t_permaL')	  && $('t_permaL').innerText		).or ('OBSERVE')
		t_conf_join	= be.string ($('t_conf_join')	  && $('t_conf_join').innerText 	).or ('Join the account as your alias, to receive its feedback?')
		t_pass_join	= be.string ($('t_pass_join')	  && $('t_pass_join').innerText 	).or ('Please enter the password for the account to join, here.')
		t_join_conf	= be.string ($('t_join_conf')	  && $('t_join_conf').innerText 	).or ('Account joined - its feedback will be shared with yours.')
		t_conf_severe	= be.string ($('t_conf_severe')   && $('t_conf_severe').innerText	).or ('Severe this alias account and your current account?')
		t_pass_severe	= be.string ($('t_pass_severe')   && $('t_pass_severe').innerText	).or ('Please enter the password for the account to severe, here.')
		t_severe_conf	= be.string ($('t_severe_conf')   && $('t_severe_conf').innerText	).or ('Account severed - its feedback will no longer be shared.')
		t_conf_announce = be.string ($('t_conf_announce') && $('t_conf_announce').innerText	).or ('Announce this page on the showcase?')
		t_announce_conf = be.string ($('t_announce_conf') && $('t_announce_conf').innerText	).or ('Announcement confirmed. Thank you for your contribution.')
		t_deannounce	= be.string ($('t_deannounce')	  && $('t_deannounce').innerText	).or ('Remove this announcement, deemed inappropriate?')
		t_conf_report	= be.string ($('t_conf_report')   && $('t_conf_report').innerText	).or ('Report illicit content to system operators?')
		t_report_conf	= be.string ($('t_report_conf')   && $('t_report_conf').innerText	).or ('Operators will check as soon as possible.')
		t_reported	= be.string ($('t_reported')	  && $('t_reported').innerText		).or ('WHAT FOLLOWS WAS REPORTED AS ILLICIT')
		t_dropped	= be.string ($('t_dropped')	  && $('t_dropped').innerText		).or ('EXPUNGED BY WRITER OR BY A MODERATOR')
		t_flaggedBy	= be.string ($('t_flaggedBy')	  && $('t_flaggedBy').innerText 	).or ('REPORTER:')
		t_legit 	= be.string ($('t_legit')	  && $('t_legit').innerText		).or ('LEGIT')
		t_conf_expunge	= be.string ($('t_conf_expunge')  && $('t_conf_expunge').innerText	).or ('Delete this content?')
		t_conf_condemn	= be.string ($('t_conf_condemn')  && $('t_conf_condemn').innerText	).or ('Condemn your message to deletion?')
		t_condemn_conf	= be.string ($('t_condemn_conf')  && $('t_condemn_conf').innerText	).or ('Message will be deleted in 15 minutes.')
		t_condemned	= be.string ($('t_condemned')	  && $('t_condemned').innerText 	).or ('MESSAGE PENDING DELETION (BY WRITER)')
		t_conf_sanction = be.string ($('t_conf_sanction') && $('t_conf_sanction').innerText	).or ('Delete this message and sanction its writer?')
		t_repreg	= be.string ($('t_repreg')	  && $('t_repreg').innerText		).or ('REPORTED ILLICITS')
		t_more_flags	= be.string ($('t_more_flags')	  && $('t_more_flags').innerText	).or ('CONTINUE REVIEW...')
		t_end_of_flags	= be.string ($('t_end_of_flags')  && $('t_end_of_flags').innerText	).or ('============================= *END OF REPORTS, GOOD JOB!')
		t_to_read	= be.string ($('t_to_read')	  && $('t_to_read').innerText		).or ('TO READ')
		t_no_news	= be.string ($('t_no_news')	  && $('t_no_news').innerText		).or ('SORRY, NO NEWS :(')
		t_older_news	= be.string ($('t_older_news')	  && $('t_older_news').innerText	).or ('LIST OLDER NOTIFICATIONS')
		t_no_more_news	= be.string ($('t_no_more_news')  && $('t_no_more_news').innerText	).or ('No further notifications on record.')
		t_not_logged_in = be.string ($('t_not_logged_in') && $('t_not_logged_in').innerText	).or ('YOUR SESSION MAY HAVE EXPIRED - PLEASE SIGN IN...')
		t_january	= be.string ($('t_january')	  && $('t_january').innerText		).or ('january')
		t_february	= be.string ($('t_february')	  && $('t_february').innerText		).or ('february')
		t_march 	= be.string ($('t_march')	  && $('t_march').innerText		).or ('march')
		t_april 	= be.string ($('t_april')	  && $('t_april').innerText		).or ('april')
		t_may		= be.string ($('t_may') 	  && $('t_may').innerText		).or ('may')
		t_june		= be.string ($('t_june')	  && $('t_june').innerText		).or ('june')
		t_july		= be.string ($('t_july')	  && $('t_july').innerText		).or ('july')
		t_august	= be.string ($('t_august')	  && $('t_august').innerText		).or ('august')
		t_september	= be.string ($('t_september')	  && $('t_september').innerText 	).or ('september')
		t_october	= be.string ($('t_october')	  && $('t_october').innerText		).or ('october')
		t_november	= be.string ($('t_november')	  && $('t_november').innerText		).or ('november')
		t_december	= be.string ($('t_december')	  && $('t_december').innerText		).or ('december')
		t_everlongtalk	= be.string ($('t_everlongtalk')  && $('t_everlongtalk').innerText	).or ('THE EVERLONGTALK')
		t_current	= be.string ($('t_current')	  && $('t_current').innerText		).or ('CURRENT MONTH')
		t_everlonglink	= be.string ($('t_everlonglink')  && $('t_everlonglink').innerText	).or ('sys/everlongtalk')
		t_monthly_recs	= be.string ($('t_monthly_recs')  && $('t_monthly_recs').innerText	).or ('MONTHLY VIEWS')
		t_monthly_link	= be.string ($('t_monthly_link')  && $('t_monthly_link').innerText	).or ('sys/monthly/views')
		t_topic 	= be.string ($('t_topic')	  && $('t_topic').innerText		).or ('TO:')
		t_jabberwock	= be.string ($('t_jabberwock')	  && $('t_jabberwock').innerText	).or ('THE JABBERWOCK')
		t_past_page	= be.string ($('t_past_page')	  && $('t_past_page').innerText 	).or ('PRIOR WOCKS')
		t_go_to_chat	= be.string ($('t_go_to_chat')	  && $('t_go_to_chat').innerText	).or ('FOLLOW CHAT')
		t_add_phrase	= be.string ($('t_add_phrase')	  && $('t_add_phrase').innerText	).or ('type message here: remember to break all lines here -> |')
		t_search	= be.string ($('t_search')	  && $('t_search').innerText		).or ('SEARCH')
		t_invalid_query = be.string ($('t_invalid_query') && $('t_invalid_query').innerText	).or ('Mary said our query was invalid... fascinating!')
		t_not_found	= be.string ($('t_not_found')	  && $('t_not_found').innerText 	).or ('Sorry, nothing was found. :(')
		t_search_error	= be.string ($('t_search_error')  && $('t_search_error').innerText	).or ('We had a problem. Call Houston, or try again...')
		t_realm 	= be.string ($('t_realm')	  && $('t_realm').innerText		).or ('SEARCH RESULTS LOOKING FOR')
		t_pages 	= be.string ($('t_pages')	  && $('t_pages').innerText		).or ('PAGES')
		t_notes 	= be.string ($('t_notes')	  && $('t_notes').innerText		).or ('NOTES')
		t_chats 	= be.string ($('t_chats')	  && $('t_chats').innerText		).or ('CHATS')
		t_ui_incons	= be.string ($('t_ui_incons')	  && $('t_ui_incons').innerText 	).or ('Cannot proceed: our interface lost something...')
		t_gate		= be.string ($('t_gate')	  && $('t_gate').innerText		).or ('Enter The Array')
		t_array_ab	= be.string ($('t_array_ab')	  && $('t_array_ab').innerText		).or (nav.ab.substr (1))
		t_array_ib	= be.string ($('t_array_ib')	  && $('t_array_ib').innerText		).or (nav.ib.substr (1))
		t_array_qb	= be.string ($('t_array_qb')	  && $('t_array_qb').innerText		).or (nav.qb.substr (1))
		t_array_xb	= be.string ($('t_array_xb')	  && $('t_array_xb').innerText		).or (nav.xb.substr (1))
		t_quicktrip	= be.string ($('t_quicktrip')	  && $('t_quicktrip').innerText 	).or ('QUICKTRIP')
		t_make		= be.string ($('t_make')	  && $('t_make').innerText		).or ('MAKE')
		t_import	= be.string ($('t_import')	  && $('t_import').innerText		).or ('IMPORT')
		t_remove	= be.string ($('t_remove')	  && $('t_remove').innerText		).or ('REMOVE')
		t_configure	= be.string ($('t_configure')	  && $('t_configure').innerText 	).or ('CONFIGURE')
		t_recognize	= be.string ($('t_recognize')	  && $('t_recognize').innerText 	).or ('RECOGNIZE')
		t_exit		= be.string ($('t_exit')	  && $('t_exit').innerText		).or ('`EXIT')
		t_pick		= be.string ($('t_pick')	  && $('t_pick').innerText		).or ('PICK')
		t_copy		= be.string ($('t_copy')	  && $('t_copy').innerText		).or ('COPY')
		t_nevermind	= be.string ($('t_nevermind')	  && $('t_nevermind').innerText 	).or ('NEVERMIND')
		t_per_h 	= be.string ($('t_per_h')	  && $('t_per_h').innerText		).or ('mph')
		t_above 	= be.string ($('t_above')	  && $('t_above').innerText		).or ('ft')
		t_areal 	= be.string ($('t_areal')	  && $('t_areal').innerText		).or ('areal')
		t_destination	= be.string ($('t_destination')   && $('t_destination').innerText	).or ('DESTINATION')
		t_distance	= be.string ($('t_distance')	  && $('t_distance').innerText		).or ('distance')
		t_maker 	= be.string ($('t_maker')	  && $('t_maker').innerText		).or ('maker')
		t_owner 	= be.string ($('t_owner')	  && $('t_owner').innerText		).or ('owner')
		t_maker_you	= be.string ($('t_maker_you')	  && $('t_maker_you').innerText 	).or ('YOU')
		t_owner_you	= be.string ($('t_owner_you')	  && $('t_owner_you').innerText 	).or ('YOU')
		t_marys_note	= be.string ($('t_marys_note')	  && $('t_marys_note').innerText	).or ('ask me nothing')
	     // t_working	= be.string ($('t_working')	  && $('t_working').innerText		).or ('wait for green...')
		t_no_mans_land	= be.string ($('t_no_mans_land')  && $('t_no_mans_land').innerText	).or ("No man's land, close to areal boundaries.")
		t_no_more_room	= be.string ($('t_no_more_room')  && $('t_no_more_room').innerText	).or ('Sorry, we ran out of room, in this areal.')
		t_tab_to_menu	= be.string ($('t_tab_to_menu')   && $('t_tab_to_menu').innerText	).or ('Tab for options.')
		t_array_sign_up = be.string ($('t_array_sign_up') && $('t_array_sign_up').innerText	).or ('You need to sign up to contribute to areals other than 4792.4792.')
		t_label 	= be.string ($('t_label')	  && $('t_label').innerText		).or ('ENTIRE LABEL')
		t_about_array	= be.string ($('t_about_array')   && $('t_about_array').innerText	).or ('WHATuS_THAT_MOVING_THINGz')
	     // t_r_fw		= be.string ($('t_r_fw')	  && $('t_r_fw').innerText		).or ("Epilepsy warning - The Array world may flicker rapidly!")
	     // t_r_nf		= be.string ($('t_r_nf')	  && $('t_r_nf').innerText		).or ("Access The Array world in ''flicker-free'' (slow) mode.")
		t_r_hp		= be.string ($('t_r_hp')	  && $('t_r_hp').innerText		).or ("The Array's tourist guide")
		t_final_words	= be.string ($('t_final_words')   && $('t_final_words').innerText	).or ('about/final_words')

		/*
		 *	load array measurement units
		 */

		t_per_h = per_h.innerText = be.string (localStorage && localStorage.per_h).or (t_per_h)
		t_above = above.innerText = be.string (localStorage && localStorage.above).or (t_above)

		/*
		 *	load array menu layouts
		 */

		nav.ab = nline + t_array_ab.replace (/\+/g, blank)
		nav.ib = nline + t_array_ib.replace (/\+/g, blank)
		nav.qb = nline + t_array_qb.replace (/\+/g, blank)
		nav.xb = nline + t_array_xb.replace (/\+/g, blank)

		/*
		 *	grab localized units of time
		 */

		t_minutes = {

			single: be.string ($('t_minute') && $('t_minute').innerText).or ('MINUTE'),
			plural: be.string ($('t_minutes') && $('t_minutes').innerText).or ('MINUTES')

		}

		t_hours = {

			single: be.string ($('t_hour') && $('t_hour').innerText).or ('HOUR'),
			plural: be.string ($('t_hours') && $('t_hours').innerText).or ('HOURS')

		}

		t_days = {

			single: be.string ($('t_day') && $('t_day').innerText).or ('DAY'),
			plural: be.string ($('t_days') && $('t_days').innerText).or ('DAYS')

		}

		t_months = {

			single: be.string ($('t_month') && $('t_month').innerText).or ('MONTH'),
			plural: be.string ($('t_months') && $('t_months').innerText).or ('MONTHS')

		}

		t_years = {

			single: be.string ($('t_year') && $('t_year').innerText).or ('YEAR'),
			plural: be.string ($('t_years') && $('t_years').innerText).or ('YEARS')

		}

		t_ago = be.string ($('t_ago') && $('t_ago').innerText).or ('AGO')
		t_lapse_right = be.string ($('t_lapse_right') && $('t_lapse_right').innerText).or ('RIGHT')
		t_lapse_now = be.string ($('t_lapse_now') && $('t_lapse_now').innerText).or (blank + 'NOW')

		/*
		 *	define paths translation table
		 */

		t_translateNodes = {

			// synonym nodes

			'sys/everlongtalks'				: 'sys/everlongtalk',
			'sys/r_i_t_a'					: 'sys/rita',
			'sys/wait_/what_s/this__'			: 'sys/help/central',
			'sys/join/us/now_'				: 'sys/join/now',
			'sys/pick/a/different/username' 		: 'sys/join/now',
			'sys/save/this/page'				: 'sys/save/changes',
			'sys/revert/changes'				: 'sys/undo/changes',
			'sys/undo/this/post'				: 'sys/drop/this/page',

			// localized: it

			'sys/iscriviti/o/rientra'			: 'sys/join/now',
			'sys/scegli/un/altro/username'			: 'sys/join/now',
			'sys/posta/per/te'				: 'sys/feedback/hub',
			'sys/nuove/pagine'				: 'sys/new/pages',
			'sys/nuovi/archivi'				: 'sys/new/products',
			'sys/nuove/immagini'				: 'sys/new/images',
			'sys/nuove/matricole'				: 'sys/new/authors',
			'sys/la/chiaccheratona' 			: 'sys/chiaccheratona',
			'sys/leggi/le/istruzioni'			: 'sys/help/central',
			'sys/centro/informazioni'			: 'sys/help/central',
			'sys/centro/notifiche'				: 'sys/feedback/hub',
			'sys/visita/il/blog'				: 'sys/visit/blog',
			'sys/indice/del/blog'				: 'sys/blog/index',
			'sys/la/tua/roba'				: 'sys/your/stuff',
			'sys/il/tuo/profilo'				: 'sys/your/profile',
			'sys/le/tue/opzioni/autoriali'			: 'sys/account/settings',
			'sys/imposta/intestazioni'			: 'sys/edit/headings',
			'sys/apporta/modifiche' 			: 'sys/apply/headings',
			'sys/carica/una/copertina'			: 'sys/load/home/cover/picture',
			'sys/rimuovi/la/copertina'			: 'sys/drop/home/cover/picture',
			'sys/modifica/informativa'			: 'sys/edit/info/page',
			'sys/carica/foto/profilo'			: 'sys/load/profile/picture',
			'sys/cambia/riquadro/foto'			: 'sys/flip/picture/framing',
			'sys/rimuovi/foto/profilo'			: 'sys/drop/profile/picture',
			'sys/modifica/annotazioni'			: 'sys/edit/profile',
			'sys/salva/informativa' 			: 'sys/save/info/page',
			'sys/salva/annotazioni' 			: 'sys/save/profile',
			'sys/annulla/modifiche' 			: 'sys/undo/changes',
			'sys/scrivi/qualcosa___'			: 'sys/type/something',
			'sys/pubblica'					: 'sys/publish',
			'sys/cancella/bozza'				: 'sys/discard/draft',
			'sys/carica/un_immagine___'			: 'sys/post/a/new/image',
			'sys/allestisci/una/galleria'			: 'sys/create/a/slideshow',
			'sys/carica/immagini'				: 'sys/load/images',
			'sys/esci'					: 'sys/sign/out',
			'sys/crea/il/mio/account'			: 'sys/create/my/account',
			'sys/pagina/iniziale'				: 'sys/welcome/page',
			'sys/cambio/password'				: 'sys/change/password',
			'sys/cancellami'				: 'sys/delete/yourself',
			'sys/cambia/la/mia/password'			: 'sys/change/my/password',
			'sys/vuoi/veramente/andartene_' 		: 'sys/you/really/want/to/go_',
			'sys/va/bene_/cancella/pure/tutto'		: 'sys/yes_/delete/everything',
			'sys/no/no_/motivi/personali'			: 'sys/nope_/personal/reasons',
			'sys/can_cel_la_mi_'				: 'sys/de_le_te/my/account_',
			'sys/il/tuo/cestino'				: 'sys/your/trash/can',
			'sys/recupera/questa/pagina'			: 'sys/restore/page',
			'sys/svuota/il/cestino' 			: 'sys/void/the/trash/can',
			'sys/modifica/qualcosa' 			: 'sys/edit/this/page',
			'sys/aggiungi/immagine' 			: 'sys/load/page/cover/picture',
			'sys/salva/la/modifica' 			: 'sys/save/changes',
			'sys/sospendi/modifica' 			: 'sys/quit/editing',
			'sys/riquadra/immagine' 			: 'sys/flip/page/picture/frame',
			'sys/cancella/immagine' 			: 'sys/drop/page/cover/picture',
			'sys/rimuovi/la/pagina' 			: 'sys/drop/this/page',
			'sys/salva/questa/pagina'			: 'sys/save/changes',
			'sys/annulla/questo/post'			: 'sys/drop/this/page',
			'sys/condividi/questa/pagina'			: 'sys/share/this/page',
			'sys/condividi/questo/blog'			: 'sys/share/this/blog',
			'sys/condividi/questo/profilo'			: 'sys/share/this/profile',
			'sys/condividi/questo/volume'			: 'sys/share/this/collection',
			'sys/aggiungi/allegato' 			: 'sys/load/package/attachment',
			'sys/cancella/allegato' 			: 'sys/drop/package/attachment',
			'sys/ops/illeciti/segnalati'			: 'sys/ops/reports/registry',
			'sys/ops/rimozione/accounts'			: 'sys/ops/account/deletion',
			'sys/can_ce_lla/l_account_'			: 'sys/de_le_te/user/account_',
			'sys/prosegui/l_esame___'			: 'sys/continue/review___',
			'sys/trova/la/destinazione/specificata' 	: 'sys/set/destination/to/given/areal',
			'sys/tran_salta/all_areale/specificato' 	: 'sys/quicktrip/to/given/areal',
			'sys/guarda/verso/l_areale/d_ingresso'		: 'sys/set/destination/to/entry/areal',
			'sys/tran_salta/all_areale/d_ingresso'		: 'sys/quicktrip/to/entry/areal',
			'sys/genera/testo'				: 'sys/create/label',
			'sys/areale/iniziale'				: 'sys/pick/home/areal',
			'sys/seleziona/questo/areale'			: 'sys/select/home/areal',
			'sys/riprendi/il/predefinito'			: 'sys/revert/to/default'

		}

		/*
		 *	login request animation
		 */

	    let lr = {

			ACN: {

				screen: '\n'
				      + 'ACORN ELECTRON' + blank + String.fromCharCode (0xA9) + '\n\n'
				      + 'ACP 1770 DFS\n\n'
				      + 'BASIC\n\n'
				      + '>',
				loader: '*DBOOT 80.STYLE\n',
				system: '',
				prompt: '',
				runner: ''

			},

			ATR: {

				screen: '\n'
				      + 'READY.\n',
				loader: 'LOAD"D:80.STL"\n',
				system: '',
				prompt: '',
				runner: 'RUN\n'

			},

			C64: {

				screen: '\n'
				      + '___**** COMMOCORE 64 BASIC HTML5 POWERED BY_MARY LOU ****\n'
				      + '_64K RAM SYSTEM PLUS 83,886,080,000 NETWORK-SIDE BYTES FREE\n'
				      + 'READY.\n',
				loader: 'LOAD"*",8,1\n\n',
				system: 'SEARCHING FOR *\n'
				      + 'LOADING\n',
				prompt: 'READY.\n',
				runner: 'RUN\n'

			},

			LCD: {

				screen: nline + block,
				loader: point,
				system: point,
				prompt: empty,
				runner: point

			},

			NDY: {

				screen: 'IOS - I/O SUBSYSTEM - S220718-R190918\n\n'
				      + 'IOS: Z80 CLOCK SET AT 10MHZ\n'
				      + 'IOS: FOUND GPE OPTION\n'
				      + 'IOS: CP/M AUTOEXEC IS OFF\n'
				      + 'IOS: CURRENT DISK SET 1 (CP/MARY 4.14)\n'
				      + 'IOS: LOADING BOOT PROGRAM (CPMLDR.COM)',
				loader: '...' + blank,
				system: 'DONE\n'
				      + 'IOS: Z80 IS RUNNING FROM NOW\n\n\n'
				      + 'Z80-MBC2 CPMLDR BIOS - S180918\n\n'
				      + 'CP/MARY V4.14 LOADER\n'
				      + 'COPYLIGHT (C) 1982, DIGITAL RE-SEARCH\n\n'
				      + 'Z80-MBC2 128KB (BANKED) CP/MARY V4.14\n'
				      + 'Z80-MBC2 BIOS MODULES: S200918, S210918, S220918, S290918\n\n',
				prompt: 'A>',
				runner: 'RT-11XM\n'

			},

			VGA: {

				screen: 'LOUNIXBIOS 4.0 RELEASE 6.4\n'
				      + 'COPYBRIGHT 1985-2005 LOUNIX TECHNOLOGIES LTD.\n'
				      + 'ALL RIGHTS PRESERVED\n'
				      + 'COPYBRIGHT 2000-2010 LWAVE, INC.\n'
				      + 'LWAVE BIOS BUILD 414\n',
				loader: '\n',
				system: 'MOUSE INITIALIZED\n\n'
				      + 'THE MARY LOU PERSONAL COMPUTER OS\n'
				      + 'VERSION 3.33 COPYLEFT (C) 1991-92 LOU CORP.\n\n',
				prompt: 'C:> ',
				runner: '80STYLE\n'

			}

		}

		lr.CGA = lr.VGA
		lr.LCS = lr.LCD
		lr.NBL = lr.LCD
		lr.NBT = lr.LCD
		lr.NBR = lr.LCD
		lr.P_1 = lr.LCD
		lr.P_3 = lr.LCD
		lr.P_4 = lr.LCD
		lr.T3C = lr.LCD
		lr.TVA = lr.NDY
		lr.VFD = lr.LCD

		/*
		 *	window resize handler
		 */

	    let rh = function () {

		    let w = innerWidth, h = innerHeight

			/*
			 *	maintain portrait-oriented layout lock if necessary (see clipboard),
			 *	otherwise, unless this was called in consequence of a direct action,
			 *	eventually intervene to override the default 70% layout when display
			 *	aspect ratio drops below something in the vicinity of 16:10, when we
			 *	should want to bring it closer to edges, even in lack of user choice
			 *
			 *	      - note: "maximized" width is conventionally meant to be 92% of
			 *		the available window width, our "mid-ground" level is 84% in
			 *		case the display aspect ratio falls below or close to ~16:10
			 */

			switch (NLAND) {

				case false:	// portrait-locked version

					cui.rlock (hdl)
					cui.rlock (hdr)
					cui.rlock (hlp)
					cui.rlock (bar)
					cui.rlock (scn)
					cui.rlock (osk)
					cui.rlock (ctl)
					cui.rlock (pad)
					cui.rlock (cbd)
					cui.rlock (att)
					cui.rlock (qtn)

					break

				case true:	// normal unlocked version

					cui.ulock (hdl)
					cui.ulock (hdr)
					cui.ulock (hlp)
					cui.ulock (bar)
					cui.ulock (scn)
					cui.ulock (osk)
					cui.ulock (ctl)
					cui.ulock (pad)
					cui.ulock (cbd)
					cui.ulock (att)
					cui.ulock (qtn)

					be.switch (this && this.userChoice).or (false) || (nav.st.ks = nav.st.ps - nav.st.ds ? nav.st.ps : w / h > 1.78 ? nav.st.es : nav.st.ds)

			}

			/*
			 *	if the TIO display is hidden, as part of The Array's set of panels,
			 *	we won't be able to determine the width of the "Window Width Probe"
			 *	div (wwp), unless we temporarily un-hide and reflow the display, in
			 *	due time and keeping it at opacity = 0; once we've waited enough so
			 *	the browser can reflow (let's say 1/10th of a second), we call back
			 *	to this function while the timeout handle serves as a flag to avoid
			 *	repeating the same sequence of operations in a loop; then, assuming
			 *	navigation panels and the TIO screen were STILL meant to be hidden,
			 *	and we STILL are in The Array, re-hide them and unlock the sequence
			 *	so it's ready to repeat again, with nav.array.pt = null...
			 */

			if (nav.is && nav.array.pd)

				if (nav.array.pt === null) {

					scn.style.opacity = '0'
					scn.style.display = 'block'

					nav.array.pt = setTimeout (() => {

						nav.rh ()

						if (nav.is && nav.array.pd) {

							scn.style.display = 'none'
							scn.style.opacity = '1'

						}

						nav.array.pt = null

					}, 99)

				} // Array nav panels disabled, and no delayed response in progress

			/*
			 *	reset on-screen keyboard size
			 */

			nav.fitKeyboard ({ where: nav.st.ks = (NLAND && w > h) ? nav.st.ks : 1 })

			/*
			 *	tells the TIO display and the rest of the CUI that we had a resize,
			 *	except in landscape mode, where fitKeyboard already did
			 */

			if (NLAND && w > h)

				return (rh)

			tio.onresize () 	// in portrait mode the T.I.O needs a resize independent from other calls to fitKeyboard (which resize the sole keyboard)
			ray.onresize () 	// resize The Array backdrop, canvas and all
			cui.refit ()		// miscellaneous U.I. chores, connected with resizing
			return (rh)		// self-calls where assigned

		}

		/*
		 *	configure navigation UI:
		 *
		 *	nav.nt to false will cause the on-screen keyboard to pop out when an input
		 *	field is focused, i.e. we're so far assuming this device is non-touch, and
		 *	will use a mouse to drive interactions
		 */

		nav.rh = rh
		nav.nt = getComputedStyle (tsd).opacity === '1'

		/*
		 *	load TIO globals to access the D.O.M
		 */

		tio.scn = scn						// TIO screen
		tio.pag = pag						// TIO page
		tio.wwp = wwp						// window width probe
		tio.ovl = ovl						// text selection overlay
		tio.txt = txt						// highlighted text buffer
		tio.cur = cur						// TIO text cursor
		tio.clc = clc						// TIO click events catcher
		tio.ovs = ovs						// TIO overlays layer

		/*
		 *	ASAP tasks
		 */

		window.onresize = rh () 				// attach window resize event handler
		window.onpopstate = nav.to				// hook popstate event (forward/back)
		scc = document.getElementById ('sc')			// global reference to "scene" canvas

		/*
		 *	grab a single object URL, containing
		 *	the Array's model generator: it will
		 *	be used to spawn workers, but we can
		 *	be much faster if we parse this blob
		 *	once and never relinquish the object
		 *	until our whole tab is closed...
		 *
		 *	      - the first version loads from
		 *		a separate server-side file,
		 *		saving badwidth in the front
		 *		page's volume which is often
		 *		requested by various "bots",
		 *		but entails window.onload to
		 *		be an async function;
		 *
		 *	      - the second version creates a
		 *		blob, out of a verbatim copy
		 *		of the same script, embedded
		 *		on top of the page as #m_gen
		 */

	     // modelGeneratorObjectURL = URL.createObjectURL (await fetch ('/js/modelGenerator.js').then (re => re.blob ()))
		modelGeneratorObjectURL = URL.createObjectURL (new Blob ([ m_gen.textContent ], { type: 'text/javascript' }))

		/*
		 *	TIO syntax highlighter configuration
		 */

		cui.hPatterns = Object ()

		tio.onprocess = function () {

			nav.st.edszMatchNumber = 0
			nav.st.pp_status.delim = true
			nav.st.pp_status.entag = false
			nav.st.pp_status.intag = 0
			nav.st.pp_status.rownr = 0
			nav.st.pp_status.start = false
			nav.st.pp_status.endof = null
			nav.st.pp_status.e_o_l = false
			nav.st.pp_status.ntity = false
			nav.st.pp_status.lower = false
			nav.st.pp_status.lcase = 0
			nav.st.pp_status.total = 1

		} // called ahead of all tio.hHandlers

		tio.hPatterns = cui.hPatterns.pages = {

			comc: RegExp ('\\~[C]{1}'),		// comic balloon for "chat"			//	not global, because we presume we'll have only 1
			flag: RegExp ('\\~[AFJS]{1}'),		// announce, flag, join account, severe 	//	not global, so we get a "free" index, but on top

			// what can't be typed-in because it contains one or more backticks

			tops: RegExp ('(\\n|^)\\`(\\s+)(AS|IN)\\:\\s+([^\\n]+)'),
			home: RegExp ('\\bHOME\\x20\\`\\`\\x20([^\\n]+)'),					//	apparently, coalescing these into one global exp
			menu: RegExp ('\\bM\\x20\\`\\`\\x20([^\\n]+)'), 					//	won't speed up highlight's times; I have no idea
			pict: RegExp ('\\bPICT\\x20\\`\\`\\x20([^\\n]+)(\\n*)'),				//	how RegExps are compiled and work, so... just so
			show: RegExp ('\\bSHOW\\x20\\`\\`\\x20([^\\n]+)'),					//	I remember this seemed a good move, but it's not
			gate: RegExp ('\\{GATE\\}'),
			data: RegExp ('\\b(DATA|\\d{4})\\x20\\`\\`\\x20(.*?\\`\\x20)([^\\n]*)', 'g'),
			link: RegExp ('\\b(L|N)\\x20\\`\\`\\x20(\\x20?)([^\\n\\t]+)', 'g'),
			note: RegExp ('\\t\\*([^\\n]+)', 'g'),
			pick: RegExp ('\\b(P|p)\\x20\\`\\`\\x20([^\\n\\`]*)([^\\n]*)', 'g'),
			pste: RegExp ('\\n\\`\\-\\~L'),
			edsz: RegExp ('[\\`\\}]{3,}', 'g'),
			sgtr: RegExp ('\\}\\`\\x20(.+)\\x20(?:\\[(.+)\\]|\\{(.+)\\})', 'g'),
		     // find: RegExp ('\\=\\x20\\`\\`\\x20\\='),
			high: RegExp ('\\x20(' + reg_escape (t_highlights) + ')\\x20\\`\\`\\x20'),

			// what CAN be typed-in and needs highlighting -- essentially, URLs

			href: RegExp ('((http(s?)\\:\\/\\/)|(www\\.)|(\\#\\/))([^\\s]+)', 'gi'),
			fram: RegExp ('([^\\-\\=])([\\-\\=]{2,})([^\\-\\=]|$)', 'g'),
			rulr: RegExp ('(\\n|^)(\\x20*)([\\-\\=])(\\n|$)', 'g'),
			rays: RegExp ('(\\b|\\/)(\\d{4})\\.(\\d{4})\\b', 'g'),

			// cosmetic postprocessor

			posp: RegExp ('[^]', 'g')		// just pass all characters

		} // T.I.O highlighters for pages

		cui.hPatterns.notes = {

			comc: RegExp ('\\~[C]{1}'),		// comic balloon for "chat"

			// what can't be typed-in because it contains one or more backticks

			edsz: RegExp ('[\\`\\}]{3,}', 'g'),
			link: RegExp ('\\b(L|N)\\x20\\`\\`\\x20(\\x20?)([^\\n\\t]+)', 'g'),
			menu: RegExp ('\\bM\\x20\\`\\`\\x20([^\\n]+)'),
			note: RegExp ('\\t\\*([^\\n]+)', 'g'),
			pick: RegExp ('\\b(P|p)\\x20\\`\\`\\x20([^\\n\\`]*)([^\\n]*)', 'g'),
			ttop: RegExp ('\\}\\^', 'g'),
			wrtr: RegExp ('\\}\\`\\x20([^\\n]+)', 'g'),

			// what CAN be typed-in and needs highlighting -- essentially, URLs

			fram: RegExp ('([^\\-\\=])([\\-\\=]{2,})([^\\-\\=]|$)', 'g'),
			href: RegExp ('((http(s?)\\:\\/\\/)|(www\\.)|(\\#\\/))([^\\s]+)', 'gi'),
			rays: RegExp ('(\\b|\\/)(\\d{4})\\.(\\d{4})\\b', 'g'),
			tags: RegExp ('(\\s|^)(\\@[A-Z0-9_]+)', 'g'),

			// cosmetic postprocessor

			posp: RegExp ('[^]', 'g')		// just pass all characters

		} // T.I.O highlighters for notes

		cui.hPatterns.opcon = {

			rulr: RegExp ('(\\n|^)(\\x20*)([\\-\\=])(\\n|$)', 'g')

		} // T.I.O highlighters for the system operator console

		tio.hHandlers = {

			comc: function (m) {

				return ('<u>~</u>')

			},

			flag: function (m, idx) {

				switch (nav.id) {

					case true:

						nav.fl = tio.it.substr (0, idx).split (nline).length - 1

						switch (m) {

							case '~A': return ('<div class="live_link" title="' + t_conf_announce + '" onclick="event&&nav.announce(event)"><u>&#xA1;</u></div>')
							case '~F': return ('<div class="live_link" title="' + t_conf_report + '" onclick="event&&nav.flag(event)"><u>{</u></div>')
							case '~J': return ('<div class="live_link" title="' + t_conf_join + '" onclick="event&&nav.join(event)">`\\</div>')
							case '~S': return ('<div class="live_link" title="' + t_conf_severe + '" onclick="event&&nav.severe(event)">\\`</div>')

						}

				}

				return ('<tt>--</tt>')

			},

			fram: function (m, s, t, u) {

				return (s + '<tt>' + t + '</tt>' + u)

			},

			href: function (m) {

			    let h = m.replace (/\x22/g, '%22').replace (/\x27/g, '%27')

				if (h.startsWith ('#/')) {

				    let s = h.substr (2)

					if (/\d{4}\.\d{4}/.test (s))					// #/1234.1234 (areal link)

						return (m)

				    let p = s.split (slash).shift ()
				    let q = p.toLowerCase ()

					if (s.startsWith (point + slash)) {

						p = s.split (slash) [1] || empty
						q = p.toLowerCase ()

						p === q && (s =     nav.thatUser ()  + s.substr (1))	// #/./page -> #/kai/page
						p === q || (s = rc (nav.thatUser ()) + s.substr (1))	// #/./PAGE -> #/KAI/PAGE

					} // short-form local

					else {

						if (s.indexOf (slash) == -1)

							s = s.split (/\W/).shift ()			// #/KAI'S -> kai

						if (s.startsWith ('ABOUT/'))

							s = s.split (/\W/).slice (0, 2).join (slash)	// #/ABOUT/KAI'S -> about/kai

					} // all other locals

					if (s.match (/\[full\]$/gi)) {

						m = m.split (/\s*\[full\]$/gi).shift ()
						s = s.split (/\s*\[full\]$/gi).shift () + '~full'

					} // transfer ~full (screen) mode spec to URL, hide from view

					return ('<div class="live_link" onclick="nav.to(0,\'' + (p === q ? s : rc (s)) + '\')">' + (p === q ? rc (m) : m) + '</div>')

				} // in local links, letter case matters where pages are referred, because they can hold punctuation, that we represent
				  // as lower-case letters; when the link was pasted from the TIO clipboard, it needs to be left alone, case-wise: this
				  // is generally indicated by the first letter being lower-case; if, instead, the link was typed manually, it mightn't
				  // be lower-case, and likely refers to an author's blog (via that username), or its profile link (#/ABOUT/FOO), which
				  // are two kinds of link that *may* be typed in manually, because they're easy to remember: in these cases, the first
				  // letter will be upper-case, but the entire link would not feature punctuation (it can't) and hence be safely forced
				  // to all lowercase: the entire process is a heuristic, but it's the best I can do: it *is* possible to manually type
				  // complete local links to pages, if you remember them, but if such page's title, or the page's collection title, has
				  // punctuation, you won't be able to type-in the lower-case replacements, while obtaining a link that'd look the same
				  // as one pasted by the TIO clipboard (reminder: the TIO clipboard is updated to hold a page's internal link when you
				  // pick the option to "share this page")

			     /* h = h.replace (/\b80\.style(\/acn|atr|c64|[cv]ga|lc[ds]|nb[lrt]|ndy|p_[13]|t3c|tva|vfd)?(?:(\/(?:\#|hash)\/)(.))(.*)/i, function (m, a, b, c, d) {

				    let p = c.charAt (0)
				    let q = p.toLowerCase ()
				    let r = String ('80.style') + (a || empty) + (b) + (c) + (d || empty)

					return (p === q ? r : r.toLowerCase ())

				}) */ // I'm not sure why I was forcing links to 80.style to lowercase, apparently, here

				if (/^w{3}/i.test (h))

					return ('<a target="_blank" href="http://' + h + '">' + m.toUpperCase () + '</a>')

				if (/^http/i.test (h))

					return ('<a target="_blank" href="' + h + '">' + m.toUpperCase () + '</a>')

				return (m)

			},

			note: function (m, s) {

				switch (location.hash) {

					case '#/sys/announcements':
					case '#/sys/new/pages':
					case '#/sys/new/images':
					case '#/sys/new/products':

						return ('\t<em>' + s.trimLeft () + '</em>')

				}

				return ('\t*<em>' + s + '</em>')

			},

			rulr: function (m, s, t, u, v) {

				return (s + t + '<tt>' + Array (Math.max (0, tio.nc - t.length - 1)).join (u) + '</tt>' + v)

			},

			rays: function (m, s, t, u) {

			    let x = be.number (parseInt (t)).or (0)
			    let z = be.number (parseInt (u)).or (0)

				if (x < 1000 || z < 1000 || x > 8584 || z > 8584 || s === slash)

					return (m)
					return ('<div class="live_link" onclick="nav.to(0,\'' + m + '\')">' + m + '</div>')

			},

			tags: function (m, s, t) {

				return (s + '<div class="semi_link" onclick="nav.to(0,\'about' + slash + t.toLowerCase ().substr (1) + '\')">' + t + '</div>')

			},

			tops: function (m, s, t, u, v) {

				switch (u) {

					case 'AS':

					    var v = v.split (comma)

						if (v.length === 1)

							return (s + blank + t + v [0])
							return (s + blank + t + '<div class="live_link" onclick="nav.to(0,\'' + nav.thatUser () + slash + rc (tf (v [0])) + '_R\')"><b>' + v [0] + '</b></div>,' + v [1])

					case 'IN':

					    var l = nav.thatUser () + slash + (v [0] === '}' ? empty : rc (tf (v)))

						return (s + blank + t + u + ':' + blank + '<div class="live_link" onclick="nav.to(0,\'' + l + '\')"><b>' + v.replace (/[\{\}]/g, empty) + '</b></div>')

				}

			},

			home: function (m, s) {

			    let cover = rc (s)
			    let posit = tio.findCp (tio.it.match (tio.hPatterns.home).index + 2)
			    let theme = cui.theme ()
			    let cname = theme.name

				switch (cover) {

					case 'cover/80style':

						cover = cover + score + theme.cover
						cname = cname + String ('-T')

				} // deprecated: home covers

				tio.ot = [ [ '<div id="cpic"',

					'style="width:' + (tio.cw * (tio.nc - 4)).toFixed (0) + 'px;height:' + (tio.ch * 7).toFixed (0) + 'px"',
					'class="' + [ posit.i, posit.j, tio.nc - 4, 7 ].join (score) + '"><img src="/' + cover + ((sessionStorage [cover] || empty))

				].join (blank) + '"></div>' ]

				tio.ovs.style.left = posit.x.toFixed (0) + 'px'
				tio.ovs.style.top = posit.y.toFixed (0) + 'px'
				tio.ovs.className = cname

				return (blank)

			},

			menu: function (m, s) {

			    let j = back.className === score && forw.className === score ? 1 : 2
			    let h = s.match (/[\[\{].+?[\}\]]/g)
			    let i, v, l

				if (h === null)

					return (blank)

				for (i = 0; i < h.length; ++ i) {

					v = h [i].substr (1, h [i].length - 2)

					if (i === j && nav.is === false) {

						l = v.match (/\s*$/).pop ()
						v = v.length === l.length ? v : '<b>' + v.substr (0, v.length - l.length) + (l [0] || empty) + '</b>' + l.substr (1)

					}

					l = v.replace (/\\/g, '\\\\')
					l = l.replace (/\"/g, '{QD}')
					l = l.replace (/\'/g, '{QS}')

					v === '\\' && (back.className === score) && (v = '<tt>\\</tt>')
					v === '\`' && (forw.className === score) && (v = '<tt>\`</tt>')

					switch (nav.ns && be.string (nav.pt || nav.so).or ('reverse')) {

						case 'forward':

							v == '&#60;' && (nav.kc || (v = '<tt><</tt>'))
							v == '&#62;' && (nav.bs || (v = '<tt>></tt>'))
							break

						case 'reverse':

							v == '&#60;' && (nav.bs || (v = '<tt><</tt>'))
							v == '&#62;' && (nav.kc || (v = '<tt>></tt>'))
							break

					}

					h [i] = '<div class="live_link" onclick="event&&tio.onpickrun(event,event.label=\'' + l + '\')">' + blank + v + blank + '</div>'

				}

				return (blank + h.join (blank))

			},

			pict: function (m, s, t) {

			    let F = nav.pp || nav.np ? 'full' : 'fune'
			    let l = rc (s)
			    let c = tio.findCp (tio.it.match (tio.hPatterns.pict).index + 2)
			    let h = Math.round (tio.ch * t.length)
			    let f = l.split (slash).pop ().split ('-').shift ()
			    let i = f === 'g' || f === 'h' || f === 'm' || f === 'l' ? 'epic' : 'spic'

			    let p = [ '<div id="' + i + '"',

					'onclick="tio.onpgfocus(event)||nav.to(0,location.hash.substr(2)+\'~' + F + '\',{interstitial:true})"',
					'style="width:' + (tio.cw * (tio.nc - 4)).toFixed (0) + 'px;height:'

				].join (blank)

				switch (f) {

					case 'g':
					case 'r':
					case 'm':

					    var r = p + h + 'px"' + blank + 'class="' + [ c.i, c.j, tio.nc - 4, t.length ].join (score) + '">' + '<img src="/' + l.replace (/\/[grm]/, '/d')
						break

					case 'h':
					case 's':
					case 'l':

					    var r = p + h + 'px"' + blank + 'class="' + [ c.i, c.j, tio.nc - 4, t.length ].join (score) + '">' + '<img src="/' + l.replace (/\/l/, '/s')
						break

					default:

					    var r = null

				}

				if (r) {

					tio.ovs.style.left = c.x.toFixed (0) + 'px'
					tio.ovs.style.top = c.y.toFixed (0) + 'px'
					tio.ovs.className = cui.theme ().name

					if (edit.className === 'on') {

						tio.ovs.style.zIndex = 0
						tio.ot = [ r + (sessionStorage [l] || empty) + '"><div id="magnifier" class="edit"></div>' ]

					}

					else {

						tio.ovs.style.zIndex = 3
						tio.ot = [ r + (sessionStorage [l] || empty) + '"><div id="magnifier"></div>' ]

					}

					setTimeout (function () {

					    let theme = cui.theme ().name

						$('magnifier') && ($('magnifier').style.filter = {

							CGA: 'sepia(1) hue-rotate(426deg) saturate(2)',
							P_1: 'sepia(1) hue-rotate(426deg) saturate(2)',
							P_3: 'sepia(1) hue-rotate(338deg) saturate(2)',
							NDY: 'sepia(1) hue-rotate(404deg) saturate(2)'

						} [theme] || empty)

					}, 999)

					return (t)

				}

				return (field + 'INVALID IMAGE SPECIFICATION')

			},

			show: function (m, s) {

			    let H = s.split (slash).shift ()
			    let V = s.split (slash).pop ()
			    let T = V.match (/\&\#38\;t=(\d+)s/)
			    let c = tio.findCp (tio.it.match (tio.hPatterns.show).index + 2)
			    let w = (tio.cw * (tio.nc - 4)).toFixed (0)
			    let h = (w * 0.5625).toFixed (0)

				switch (H) {

					case 'YT':

						V = T ? V.split ('&').shift () + '?start=' + T.pop () : V

						tio.ot = [

							'<div id="evid" style="width:' + ((tio.nc - 4) * tio.cw).toFixed (0) + 'px;height:' + h + 'px" class="' + [ c.i, c.j, tio.nc - 4, 11 ].join (score)
						      + '"><iframe id="evif" width="' + w + '" height="' + h + '" src="https://www.youtube-nocookie.com/embed/' + V + '" frameborder="0" allow="accelerome'
						      + 'ter; encrypted-media; gyroscope" allowfullscreen></iframe></div>'

						]

						tio.ovs.style.left = c.x.toFixed (0) + 'px'
						tio.ovs.style.top = c.y.toFixed (0) + 'px'
						tio.ovs.className = cui.theme ().name

						return (blank)

				}

				return (field + 'INVALID VIDEO SPECIFICATION')

			},

			gate: function (m) {

			    let c = (tio.findCp (tio.it.match (tio.hPatterns.gate).index + 2)), W, H
			    let w = (tio.cw * (W = tio.nc - 4)).toFixed (0)
			    let h = (tio.ch * (H = 9)).toFixed (0)

			     // c.j -= 1
			     // c.y -= tio.ch

				tio.ovs.style.left = c.x.toFixed (0) + 'px'
				tio.ovs.style.top = c.y.toFixed (0) + 'px'
				tio.ovs.className = cui.theme ().name

				tio.ot = [

					'<div id="gate" style="width:' + w + 'px;height:' + h + 'px" class="' + [ c.i, c.j, W, H ].join (score) + '" title="' + t_gate + '" onclick="event&&gate.onclick(event)"></div>'

				     // '<div id="r_fw" title="' + t_r_fw + `" onclick="nav.to(0,'${t_final_words}')"></div>`,
				     // '<div id="r_nf" title="' + t_r_nf + '" onclick="event&&gate.onclick(event,true)"></div>',
				     // '<div id="r_hp" title="' + t_r_hp + '" onclick="nav.to(0,\'sys/about/the/array\')"></div>'

				]

				return (blank)

			},

			data: function (m, s, t, u) {

				switch (s) {

					case 'DATA':

						return (blank + field + t.replace ('|' + arrow, arrow + blank) + '==' + blank + u)

				}

			    var l = parseInt (s.substr (0, 2))
			    var L = parseInt (s.substr (2, 2))
			    var p = empty
			    var y = cui.theme ().fieldGradient
			    var d

				if (t.match (/\|/)) {

					l = (l) ? l + 1 : 0
					L = (L) ? L + 1 : 0
					t = (t.replace ('|' + arrow, arrow))
					p = 'padding-left:' + tio.cw.toString () + 'px;'

				}

				l === 0 && (d = '<div class="data" style="' + p + 'width:' + (L * tio.cw) + 'px;background-color: {optional}"><div class="padd">' + (u || blank) + '</div></div>')
				l === 0 || (d = '<div class="data" style="' + p + 'width:' + (L * tio.cw) + 'px;background:linear-gradient(90deg,{obligate},{obligate}' + blank + (l * tio.cw) +
						'px,{optional}' + blank + (1 + l * tio.cw) + 'px)"><div class="padd">' + (u || blank) + '</div></div>')

				return (blank + field + t + '==' + blank + d.replace (/\{obligate\}/g, y.obligate).replace (/\{optional\}/g, y.optional))

			},

			link: function (m, t, b, s) {

				switch (t) {

					case 'L':

					    let l = s.split (slash).shift ()
					    let r = s.split (slash).pop ().split (tilde).shift ()

						switch (l) {

							case 'ABOUT':
							case 'PROFILO':

								return (t_marker + (b || empty) + '<div class="link">' + tb (s.replace (/\x2F/g, score)) + '</div>')

							default:

								if (/\{.+\}$/.test (r))

									r = r.match (/\{(.+)\}/).pop ()

								if (r.indexOf (aster) > -1)

									return (t_marker + (b || empty) + '<div class="link">' + tb (r.split (aster).shift ()) + '</div>')

								if (r.indexOf ('_p_') > -1)

									return (t_marker + (b || empty) + '<div class="link">' + tb (r.split ('_p_').shift ()) + '</div>')

								// in all other cases...

									return (t_marker + (b || empty) + '<div class="link">' + tb (r.replace (/_r$/, empty)) + '</div>')

						}

					case 'N':

						switch (s = s.split (slash).pop ().split (tilde).shift ()) {

							case t_january:
							case t_february:
							case t_march:
							case t_april:
							case t_may:
							case t_june:
							case t_july:
							case t_august:
							case t_september:
							case t_october:
							case t_november:
							case t_december:

								return (t_marker + (b || empty) + '<div class="link">' + s + '</div>')

						}

						return (t_marker + (b || empty) + '<div class="link">' + s + '</div>')

				}

			},

			pick: function (m, k, s, t) {

				if (k === 'p')

					return (empty)

			    let p_spec = RegExp ('\\~.*$')
			    let h = t.match (/[\[\{].+?[\}\]]/g)
			    let b = empty

				if (h === null) {

					h = s.match (/[\[\{].+?[\}\]]/g)
					s = false

					if (h === null)

						return (empty) // invalid options list (don't show anything, or it'll flicker in animations)

				}

				for (let i in h) {

				    let f = h [i] [0]
				    let g = h [i] [h [i].length - 1]
				    let v = h [i].substr (1, h [i].length - 2)

				    let l = v.replace (/\\/g, '\\\\')
					l = l.replace (/\"/g, '{QD}')
					l = l.replace (/\'/g, '{QS}')
					v = v.replace (p_spec, empty)

					s && (f === '[') && (h [i] = b + '<div class="pick">' + v + '</div>' + blank)
					s && (f === '{') && (h [i] = b + '<div class="opt" onclick="event&&tio.pick(event)">' + v + '</div>' + blank)
					s || (f === '[') && (h [i] = b + '<div class="live_link" onclick="event&&tio.onpickrun(event,event.label=\'' + l + '\')">' + v + '</div>' + blank)
					s || (f === '{') && (h [i] = b + '<div class="live_link" onclick="event&&tio.onpickrun(event,event.label=\'' + l + '\')"><tt>' + v + '</tt></div>' + blank)

					b = blank

				}

				return (t_marker + (s ? s + '`' + blank + '==' + blank : blank) + h.join ('&#47;'))

			},

			pste: function (m) {

				return (nline + block + '<div id="linker" onclick="event&&cui.board(event)">}<div id="linkertip">' + t_linksomething + '</div></div>')

			},

			edsz: function (m) {

				++ (nav.st.edszMatchNumber)

				if (tio.l3 > tio.l4) {

				    var n = (be.number (nav.sz).or (0) - nav.clipText ().length).toString ()
				    var p = (new Array (Math.max (0, 1 + m.length - n.length)).join (blank))

					switch (m [0]) {

						case arrow:

							return (p + n)

						case brace:

							return (parseInt (n) < 1 ? '/OK' : p + n)

					}

				} // we have no secondary clip

				if (nav.st.edszMatchNumber === 2) {

				    var n = (be.number (nav.sz).or (0) - nav.stubText ().length).toString ()
				    var p = (new Array (Math.max (0, 1 + m.length - n.length)).join (blank))

					return (p + n)

				} // we have a secondary clip, but this is the secondary match

				return (m)

			},

			sgtr: function (m, s, t, u) {

			    let l = rc (s)
			    let r = tb (s)
			    let p = t_profiles + l
			    let q = tb (be.string (t).or (empty))

				if (q.length) // loose page, present link to blog index past signature

					return index + blank + '<div class="live_link" onclick="nav.to(0,\'' + p + '\')"><b>' + r + '</b></div>'
						     + joint + '<div class="live_link" onclick="nav.to(0,\'' + l + '\')"><b>' + q + '</b></div>'

			    let v = tb (be.string (u).or (empty))
			    let w = l + slash + rc (be.string (u).or (empty))

				if (v.length) // group page, present link to collection past signature

					return index + blank + '<div class="live_link" onclick="nav.to(0,\'' + p + '\')"><b>' + r + '</b></div>'
						     + joint + '<div class="live_link" onclick="nav.to(0,\'' + w + '\')"><b>' + v + '</b></div>'

				return index + blank + '<b>' + '(MALFORMED AUTHOR SIGNATURE)' + '</b>'

			},

		     /* find: function (m) {

				return (equal + blank + '<div class="live_link" onclick="nav.find()">``</div>' + blank + equal)

			}, */

			high: function (m, link) {

				return (

					blank + '<div class="semi_link" onclick="nav.to(0,\'sys/announcements\')">' + link + '</div>' +
					blank + '<div class="live_link" onclick="nav.to(0,\'sys/announcements\')">' + '``' + '</div>' + blank

				)

			},

			ttop: function (m) {

				return '<div class="live_link" onclick="nav.tops()">&#x25B2;</div>'

			},

			wrtr: function (m, s) {

			    let l = rc (s)
			    let r = tb (s)
			    let p = t_profiles + l
			    let i = nav.jw ? '<div class="live_link" onclick="nav.address(\'' + s + '\')">[]</div>' : index

				return i + blank + '<div class="live_link" onclick="nav.to(0,\'' + p + '\')"><b>' + r + '</b></div>'

			},

			posp: function (c) {

			  const my = nav.st.pp_status, a = c.charCodeAt (0)

				if (my.muted)

					return (c)

				if (my.start) {

					a === 32 && (c = '</' + my.endof + '>' + blank)
					a === 32 && (my.endof = null)

				}

				if (my.start = (my.delim === true && my.endof === null && my.intag === my.level))

					switch (a) {

						case 42: my.e_o_l = false; return '<' + (my.endof = 'b') + '>' + (my.endch === blank ? blank : my.endch = c)
						case 47: my.e_o_l = false; return '<' + (my.endof = 'i') + '>' + (my.endch === blank ? my.me : my.endch = c)
						case 95: my.e_o_l = false; return '<' + (my.endof = 'u') + '>' + (my.endch === blank ? blank : my.endch = c)

						default:

							my.start = false
							my.rownr < tio.l1 || (my.me = blank)

					}

					switch (a) {

						case 10:

							if (my.endof) {

								my.e_o_l || (c = '</' + my.endof + '>\n<' + my.endof + '>')
								my.e_o_l && (c = '</' + my.endof + '>\n')
								my.e_o_l && (my.endof = null)

							} // found: end-of-line in highlight, breaks if doubled

							if (my.lower) {

								my.e_o_l && (c = '</tt>' + c)
								my.e_o_l && (my.lower = false)

							} // found: end-of-line in lowercase, breaks if doubled

							my.delim = true
							my.e_o_l = true

							my.rownr = my.rownr + 1
							my.rownr - tio.l1 || tio.ai === 2 || (my.me = my.em)

							break

						case 38:

							my.ntity = true

							break

						case 47:

							my.cltag = my.optag

						case 42:
						case 95:

							my.optag = false
							my.e_o_l = false

							if (my.endof === { 42: 'b', 47: 'i', 95: 'u' } [a]) {

								c = my.endch + '</' + my.endof + '>'
								my.endof = null

							} // found: counter-part of current highlight's opening

							break

						case 60:

							my.delim = false
							my.entag = true
							my.optag = true
							my.e_o_l = false

							if (my.lower) {

								c = '</tt><'
								my.lower = false

							} // found: less than, opens tag, and breaks lower-case

							if (my.endof) {

								c = '</' + my.endof + '>' + c
								my.endof = null

							} // found: less than, opens tag, and breaks highlights

							break

						case 62:

							my.entag = false
							my.e_o_l = false

							if (my.cltag) {

								my.cltag = false
								my.intag = my.intag - 1

							} // found: greater than, which is ending a closing tag

							break

						default:

							my.delim = my.common_punctuators.indexOf (a) > -1
							my.delim ? my.ntity = false : 0
							my.e_o_l = false

							if (my.optag) {

								my.optag = false
								my.intag = my.intag + 1

							} // found: less than, not followed by ASCII 47 (slash)

							if (a > 96 && a < 123) {

								my.entag || my.ntity || my.lower || my.nolow || (c = '<tt>' + c)
								my.entag || my.ntity || my.lower || my.nolow || (my.lower = true)
												    my.entag || (my.lcase = my.lcase + my.count)
												    my.entag || (my.total = my.total + my.count)

							} // found: lowercase (which we'd like to make visible)

							if ((a > 64 && a < 90) || (a > 47 && a < 58)) {

								my.ntity || (my.lower && (c = '</tt>' + c))
								my.ntity || (my.lower && (my.lower = false))
								my.ntity || (my.entag || (my.total = my.total + my.count))

							} // found: uppercase or digit (which breaks lowercase)

							if (my.count)

								my.nolow = 3 * my.lcase >= my.total	// trigger smart lowercase prevention (above 33% detection threshold)

					}

				return (c)

			}

		}

		/*
		 *	TIO clip boundaries' styling
		 */

		tio.clipStart = function (r) { return (r.replace ('8&#60;', cui.clipStart)) }
		tio.clipClose = function (r) { return (r.replace ('&#62;8', cui.clipClose)) }

		/*
		 *	run find on enter key (home)
		 */

		tio.onconfirm = cui.findr

		/*
		 *	run all TIO links via nav.to
		 */

		tio.onlinkrun = function (path) {

			cui.posit = this.caller

			switch (path.tag) {

				case 'L':

					switch (path.uri) {

						case t_about_array:

							return (nav.to (null, 'sys/about/the/array'))

					}

					switch (path.uri.split (/[\x20\t\/]/).shift ().toLowerCase ()) {

						case t_back:
						case t_cancel:
						case 'back':
						case 'cancel':

							return (history.go (-1))

						default:

							switch (tb (path.uri)) {

								case nav.ht:		return (nav.to (null, 'sys/blog/index'))
								case t_back_typing:	return (nav.to (null, 'sys/type/something', { interstitial: true }))

							}

							if (/\{.+\}$/.test (path.uri))

								path.uri = path.uri.split ('{').shift ()

							if (path.uri.indexOf (aster) > -1)

								path.uri = path.uri.replace (/\/.+\*/, slash)

							if (path.uri.indexOf ('_p_') > -1)

								path.uri = path.uri.replace ('_p_', slash) + '~FULL'

					}

					switch (nav.pu) {

						case 'sys/search/chats':
						case 'sys/search/note':
						case 'sys/search/notes':

							path.uri = path.uri.replace (/\~qote\[.+\]/i, (m) => { return m.toUpperCase () })
							break

						case 'sys/search/pages':
						case 'sys/search/pagine':

							path.uri = path.uri + rc ('~land')
							break

						case 'sys/announcements':
						case 'sys/new/pages':
						case 'sys/new/images':
						case 'sys/new/products':

							path.uri = path.uri + rc ('~lone')
							break

						case 'sys/how/to':

							path.flag = { interstitial: true }

						default:

							path.uri.indexOf (slash) + 1 || (path.uri = 'ABOUT/' + path.uri)

					}

					nav.cs.clear_news && new Requester ().post ({

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () },
							{ name: 'idx_last', value: 0 }

						],

						uri: '/exec/promsList'

					}) // clears the new announcements' counter, if needed

					return (nav.to (null, rc (path.uri.replace (/[\x20\t]/g, slash)), path.flag || 0))

				case 'N':

					path.uri = path.uri.replace (/[\s\(\d\)]+$/, empty)

					switch (path.uri) {

						case 'SYS/' + t_join_now:

							switch (location.hash.substr (2)) {

								case 'sys/join/now':

									return (nav.to (null, 'sys/sign/up/or/log/in'))

							}

							return (nav.to (null, 'sys/join/now'))

						case 'SYS/' + t_stuff_to_see:

							return (nav.to (null, t_about_to_see))

						case 'SYS/' + t_older_packs:
						case 'SYS/' + t_older_pages:
						case 'SYS/' + t_older_picts:
						case 'SYS/' + t_older_users:

							switch (location.hash.substr (2)) {

								case 'sys/announcements':		return nav.to (null, 'sys/announcements',	{ append: true, queryAfter: nav.promAtBottom })
								case 'sys/new/pages':			return nav.to (null, 'sys/new/pages',		{ append: true, queryAfter: nav.pageAtBottom })
								case 'sys/new/images':			return nav.to (null, 'sys/new/images',		{ append: true, queryAfter: nav.pictAtBottom })
								case 'sys/new/authors': 		return nav.to (null, 'sys/new/authors', 	{ append: true, queryAfter: nav.userAtBottom })
								case 'sys/new/products':		return nav.to (null, 'sys/new/products',	{ append: true, queryAfter: nav.packAtBottom })

							}

							return

						case 'SYS/' + t_more_notes:

							return (nav.to (null, 'sys/show/more/notes', { append: true }))

						case 'SYS/' + t_older_news:

							return (nav.to (null, 'sys/show/older/news', { append: true }))

						case 'SYS/' + t_more_flags:

							return (nav.to (null, 'sys/show/more/flags', { append: true }))

						case 'SYS/' + t_store_page:

							return (location.href = slash + nav.tu)

						case 'SYS/' + t_startDownload:

							return (location.href = slash + nav.ku)

						case 'SYS/' + t_writeYourNote:

							return (nav.to (null, rc (nav.thisPage ()) + '~note'))

						case 'SYS/' + t_go_to_chat:

							return (nav.to (null, rc (nav.thisPage ())))

					}

					/*
					 *	there's only one kind of "node" which URI starts with a literal plus
					 *	sign: the "unread notes" alert, which dumps the display list holding
					 *	notes that were received but not yet rendered
					 */

					if (path.uri.charAt (4) == '+')

						return (nav.display ())

					/*
					 *	trailing slash may be left there by nodes with one blank to tab stop
					 */

					return (nav.to (null, path.uri.replace (/[\x20\t]/g, slash).replace (/[^\d\/\@A-Z\~]/g, score).toLowerCase ().replace (/\/$/, empty)))

			}

		}

		/*
		 *	menu functions
		 */

		tio.onpickrun = function (e) {

			if (e.label.match (/\S/) === null)

				return	// blank option

			e.label = e.label.replace (/\{QD\}/g, '"')
			e.label = e.label.replace (/\{QS\}/g, "'")
			e.label = e.label.replace (/\<.+?\>/g, '')
			e.label = e.label.replace (/\s*$/g, empty)

			switch (e.type || 0) {

				case 'click':

					e.preventDefault ()
					e.cancelBubble = true

			}

			switch (e.label) {

				case '-` EN': return (location.href = '/en' + (location.hash ? slash + location.hash : empty))
				case '-` IT': return (location.href = '/it' + (location.hash ? slash + location.hash : empty))

			}

			switch (e.label) {

				case '\`':

					return (forw.onclick.call (forw, e))

				case '\\':

					return (back.onclick.call (back, e))

				case '<':

					switch (nav.ns && be.string (nav.pt || nav.so).or ('reverse')) {

						case 'forward':

							nav.kc && nav.to (null, rc (nav.thisPage ()) + '~note', { interstitial: true, sort: 'forward', cursor: Math.max (0, nav.kc - 10) })
							return

						case 'reverse':

							nav.bs && nav.to (null, rc (nav.thisPage ()) + '~note', { interstitial: true, sort: 'reverse', cursor: nav.kc + 10 })
							return

					}

					return (flub.onclick.call (flub, e))

				case '>':

					switch (nav.ns && be.string (nav.pt || nav.so).or ('reverse')) {

						case 'forward':

							nav.bs && nav.to (null, rc (nav.thisPage ()) + '~note', { interstitial: true, sort: 'forward', cursor: nav.kc + 10 })
							return

						case 'reverse':

							nav.kc && nav.to (null, rc (nav.thisPage ()) + '~note', { interstitial: true, sort: 'reverse', cursor: Math.max (0, nav.kc - 10) })
							return

					}

					return (fluo.onclick.call (fluo, e))

				case t_post:
				case t_post_syn1:
				case t_post_syn2:

					return (cui.mq || nav.post (e))

				case t_clear_note:

					return (cui.mq || nav.allClear (empty))

				case t_paste_link:
				case t_paste_syn1:
				case t_paste_syn2:

					return (cui.mq || cui.board (e))

				case t_give_up:

					return (cui.mq || nav.giveUp ())

				case t_fold_up:

					return (cui.mq || nav.foldUp ())

				case t_permaL:

					return

				case t_pages:

					return (nav.find (t_pages, nav.ls.q))

				case t_notes:

					return (nav.find (t_notes, nav.ls.q))

				case t_chats:

					return (nav.find (t_chats, nav.ls.q))

				case t_quicktrip:

					return (nav.to (null, 'sys/r/quicktrip'))

				case t_make:

					return (nav.to (null, 'sys/r/make'))

				case t_import:

					return ($('model-file').click ())

				case t_remove:

					World.interactables.heldModel.element.remove ()
					delete (World.interactables.heldModel)
					delete (World.layers.model)

					nav.array.model = null
					nav.array.instance = null

					tio.onpgfocus ()
					tio.setCursorState ({state: nav.array.el ? 'show' : 'hide' })
					tio.cls ().type ({ default: nav.array.mo = 3, also: nav.xm = false, text: tio.mb = nav.mb = nav.cb = nav.ab, cps: 14, oncompletion: tio.kbFunctions.ro_home })

					return	(nav.array.pd && nav.array.pp && nav.array.togglePanels.call ())

				case t_configure:

					if (nav.st.mc.active && ! e.force) {

						tio.onpgfocus.call (nav.st.mc.enable = false)
						return

					} // turn AMC3 off (toggle)

					if (nav.array.instance || e.force) {

						tio.onpgfocus = function () {

							nav.array.el = nav.array.ep	// restore preference of the recognize option

							ctc.style.display = String ('none')
							ctc.style.height  = scn.style.height = pag.style.height = nav.ph
							osk.style.height  = osk.style.opacity = nav.ck = String ('0')
							ctl.style.height  = ctl.style.opacity = lfn.style.height = lfn.style.opacity = rfn.style.height = rfn.style.opacity = String ('0')
							nav.st.mc.active  = nav.ok = nav.array.ax = nav.array.az = nav.array.ah = false

							tio.setCursorState ({ state: 'hide' })
							nav.array.pd && nav.array.pp && nav.array.togglePanels.call ()

						} // exit model configuration (AMC3) when clicking/tapping rest of the array's screen

						osk.style.opacity = ctl.style.opacity = String ('1')
						lfn.style.opacity = String ('0')
						rfn.style.opacity = nav.array.la ? '1' : '0'
						ctc.style.display = String ('block')

						nav.array.pd || (nav.array.togglePanels.call ())
						nav.fitKeyboard (nav.ok = nav.st.mc.active = true)

						nav.st.mc.enable = nav.st.mc.active	// record preference over model configuration
						nav.array.ep = nav.array.el		// record preference for the recognize option
						nav.array.el = false			// temporarily clear labels, for a clean view

						if (be.switch (e.dance).or (false) === false) {

							tio.setCursorState ({ state: 'show' }).load (empty, null, tio.mb = nav.mb = nav.cb = nav.ib).kbFunctions.ro_home (nav.array.mo = 3)
							return

						} // not "dancing", meaning we are re-entering model configuration mode (keep angles)

						/*
						 *	if invoked for model load/creation, induce
						 *	the viewpoint to orient to get a good view
						 */

					    let to_model = nav.st.rc.aimAt ({

							x: nav.array.instance.origin.x,
							z: nav.array.instance.origin.z,
							y: nav.array.instance.origin.y + nav.array.model.mould.circumCenter

						});

						nav.st.pitch = Math.min (to_model.pitch, 3)
						nav.st.yaw   = nav.st.dancing ? 35 : nav.st.yaw

						tio.cls ().setCursorState ({ state: 'show' }).type ({ reset: nav.array.mo = 3, text: tio.mb = nav.mb = nav.cb = nav.ib, cps: 14, oncompletion: tio.kbFunctions.ro_home })

					} // toggle on, either because we re-enter it or (e.force) because we just imported something...

					return

				case t_recognize:

					nav.array.el = nav.array.ep = nav.array.el ? false : true
					tio.keyboardHooked || tio.setCursorState ({state: nav.array.el ? 'show' : 'hide' })

					return

				case t_exit:

					hlp.style.opacity = '0'
					scn.style.height = pag.style.height = nav.ph = (3 * tio.ch).toFixed (0) + 'px'
					scn.style.display = nav.array.pp ? 'block' : 'none'
					pag.style.overflowY = 'hidden'
					txt.style.background = 'none'

					if (nav.st.mc.active) {

						tio.onpgfocus (nav.st.mc.enable = false)
						return

					} // exit model configuration

					if (tio.keyboardHooked) {

						tio.onpgfocus ()
						tio.disconnectKeyboard ()
						document.onkeydown = nav.array.keydown
						Shortcut.add ('enter', nav.kb.amc3.submit.f)

						if (nav.array.instance) {

							if (nav.st.mc.enable) {

								setTimeout (function () { tio.onpickrun ({ label: t_configure, force: true, dance: e.dance }) }, 250)
								return

							} // were we configuring it?

							tio.setCursorState ({ state: 'hide' }).load (empty, null, tio.mb = nav.mb = nav.cb = nav.ib).kbFunctions.ro_home (nav.array.mo = 3)
							nav.array.pd && nav.array.pp && nav.array.togglePanels.call ()
							return

						} // do we hold an instance?

						tio.load (empty, null, tio.mb = nav.mb = nav.cb = nav.ab).kbFunctions.ro_home (nav.array.mo = 3, nav.xm = false)
						nav.array.pd && nav.array.pp && nav.array.togglePanels.call ()
						tio.setCursorState ({ state: nav.array.el ? 'show' : 'hide' })
						return

					} // exit from the TIO screen

					return (gate.onclick.call ())

				case t_pick:

					return (nav.x0.call ())

				case t_copy:

					return (nav.x1.call ())

				case t_nevermind:

					return (nav.x2.call ())

				default:

					if (e.label.match (/\~\C?$/))

						return (nav.to (null, rc (nav.thisPage ()) + '~note'))

			}

			switch (e.label.substr (1, 2)) {

				case index:

					switch (e.label.substr (4)) {

						case t_enter:

							return (nav.to (null, 'sys/join/now'))

						case t_go_to_blog:

							return (nav.to (null, 'sys/your/stuff'))

						case t_help_central:

							return (nav.to (null, 'sys/help/central'))

						case t_monthly_recs:

							return (nav.to (null, t_monthly_link))

						case t_past_page:

							return (nav.pastPage ())

						case t_share_now:

							return (link.onclick.call (link, e))

					}

					return (nav.to (null, nav.hp, { interstitial: nav.ih }))

			}

			switch (e.label.split (tilde).length) {

				case 2:

					if (e.label.split (tilde).pop ().startsWith ('sys/'))

						return (nav.to (false, e.label.split (tilde).pop ()))

					switch (e.label.split (tilde).shift ()) {

						case t_reply_verb:
						case t_ps:

							return (cui.mq || nav.reply (e))

						case t_permaL:

						    let i = e.label.split (tilde).pop ().split (semic).shift ()
						    let t = i.charAt (0) === score ? empty : '~note[' + i + ']'

							if (i.length < 21) {

								i = e.label.split (tilde).pop ().split (semic).slice (0, 2).join (semic)
								t = '~qote[' + i + ']'

							} // tag in paged chat, eg. jabberwock, features a page number to "quote" (qote)

							return (cui.mq || nav.to (null, (nav.st.permapaths [i] || location.hash.substr (2).split (tilde).shift ()) + t))

						case t_flag_note:

							return (cui.mq || nav.report (e))

						case t_thanks:

							return (cui.mq || nav.thanks (e))

						case t_condemn:

							return (cui.mq || nav.condemn (e))

						case t_expunge:

							return (cui.mq || nav.expunge (e, t_conf_expunge))

						case t_tis_bad:

							return (cui.mq || nav.expunge (e, t_conf_sanction, '1'))

						case t_legit:

							return (cui.mq || nav.legit (e))

						case t_post:

							return (cui.mq || nav.post (e))

						case t_no_replies:

							return

						default:

							if (e.label.match (/\^\.\^/))

								return (cui.mq || nav.allowed (e))

							if (e.label.match (RegExp ('^' + reg_escape (t_see))))

								return (cui.mq || nav.disroll (e))

					}

			}

			return (nav.to (null, nav.is ? nav.aa || tio.keyboardHooked ? 'sys/welcome/page' : location.hash.substr (2) : 'sys/welcome/page'))

		}

		/*
		 *	hook TIO click catcher (move cursor)
		 */

		clc.onclick = tio.onclick
		clc.onmouseout = tio.onmouseout
		clc.onmousehover = clc.onmousemove = tio.onmousemove

		/*
		 *	attach navigation event handlers:
		 *
		 *	      - if click event triggers on "ctc"
		 *		then don't allow it to propagate
		 *		to the document's body, where it
		 *		proceeds to call onpgfocus as of
		 *		the above lines
		 */

		clc.ondblclick = document.body.ondblclick = function (e) { e.preventDefault () }
		ctc.onclick = function (e) { be.object (e).or (new Object).cancelBubble = true }
		ctc.onpointerdown = nav.pointerdown
		ctc.onpointerup = ctc.onpointerout = ctc.onpointercancel = ctc.onpointerleave = nav.pointerup

		/*
		 *	respond to TIO cursor movements: set
		 *	last known cursor line to pop dialog
		 *	boxes and prompts
		 */

		tio.oncsrmove = function () { cui.mq || (cui.posit = tio.cp.j) }
		tio.onhomings = function () { tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.seekNextField ())) }
		tio.onmtpaste = cui.board
		tio.oninfocus = nav.giveUp

		/*
		 *	when TIO's display is actively being
		 *	scrolled to read content, update its
		 *	known top offset that will be stored
		 *	in history records
		 */

		tio.pag.onscroll = function (e) {

			if (tio.pt - be.number (tio.pag.scrollTop).or (0)) {

				tio.ro && (tio.pl = tio.pag.scrollLeft = (0))
				tio.pt = be.number (tio.pag.scrollTop).or (0)

			}

		     /* if (cui.theme ().name in notebooks)

				hdl.style.backgroundPositionY = minus + tio.pt.toString () + 'px' */

			nav.updateMarkers ()
			tio.pt && tio.stopTyping ()
			nav.cm || nav.is || cui.helps (tio.pt === 0)

		}

		/*
		 *	let side ribbons navigate back and forth
		 *	through the browser's history - behavior
		 *	is modulated by never letting the "back"
		 *	ribbon exceed this site's own scope, and
		 *	both directions follow slideshow entries
		 *	when the current page is part of one
		 */

		back.onclick = function (e) {

			nav.ok || back.className === score || (nav.pp && nav.to (null, nav.pp)) || (nav.mc && nav.to (null, nav.pu, { interstitial: true, implying: nav.mc = false })) || history.go (-1)
			nav.ok && tio.onpgfocus (e)
			pad_mask.onclick (e)

		}

		forw.onclick = function (e) {

			nav.ok || forw.className === score || (nav.np && nav.to (null, nav.np)) || history.go (+1)
			nav.ok && tio.onpgfocus (e)
			pad_mask.onclick (e)

		}

		/*
		 *	set full-screen button handler
		 */

		full.onclick = function (e) {

		    let request = nav.fullScreen ()

			e && e.preventDefault && (e.preventDefault ())
			e && e.preventDefault && (e.cancelBubble = true)

			if (request.method) {

				request.method.call (request.target, { navigationUI: 'hide' })
				setTimeout (nav.rh, 67)

			} // if supported

		}

		/*
		 *	set handler for help shortcut
		 */

		help.onclick = function (e) {

			e && e.preventDefault && (e.preventDefault ())
			e && e.preventDefault && (e.cancelBubble = true)

			nav.to (null, 'sys/help/central')

		}

		/*
		 *	set handler for search shortcut
		 */

		find.onclick = function (e) {

			e && e.preventDefault && (e.preventDefault ())
			e && e.preventDefault && (e.cancelBubble = true)

			location.hash ? nav.to (null, 'sys/welcome/page', { scst: find_position }) : tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findVCi (parseInt (find_colIndex), parseInt (find_rowIndex))))

		}

		/*
		 *	set handler for toggling picture
		 *	orientation
		 */

		flip.onclick = function (e) {

			be.object (e).or (new Object).cancelBubble = true

			switch (nav.id && location.hash.substr (2).split (slash).shift ()) {

				case false:		// not authenticated

					return

				case 'about':		// user profile
				case 'profilo': 	// user profile

					return (nav.to (null, 'sys/flip/picture/framing', { interstitial: true }))

				default:		// page

					if (location.hash.substr (2).match (/\x2F/))

						return (nav.to (null, 'sys/flip/page/picture/frame', { interstitial: true }))

			}

		}

		/*
		 *	set handler for save changes:
		 *	if clicked, immediately saves page
		 */

		save.onclick = function (e) {

			be.object (e).or (new Object).cancelBubble = true

			switch (nav.id && location.hash.substr (2).split (slash).shift ()) {

				case false:		// not authenticated

					if (nav.ns)	// except on page holding note (allow attempt by ctrl-s)

						return (nav.post ({ label: nav.ri ? nav.rr.match (/\[(.+?)\]/).pop () : empty }))

					return

				case '@':		// page in trashcan

					return (nav.to (null, 'sys/restore/page', { interstitial: true }))

				case 'sys':		// presumed sys/write/new/page (no harm done, otherwise)

					if (nav.ns)	// except on page holding note

						return (nav.post ({ label: nav.ri ? nav.rr.match (/\[(.+?)\]/).pop () : empty }))

					return (nav.to (null, 'sys/publish', { interstitial: true }))

				case 'about':		// user profile
				case 'profilo': 	// user profile

					return (nav.to (null, 'sys/save/profile', { interstitial: true }))

				default:		// page or blog's home page

					if (nav.ns)	// yeah, but it's the notes

						return (nav.post ({ label: nav.ri ? nav.rr.match (/\[(.+?)\]/).pop () : empty }))

					if (location.hash.substr (2).match (/\x2F/))

						return (nav.to (null, 'sys/save/changes', { interstitial: true }))	// nondescript page
						return (nav.to (null, 'sys/apply/headings', { interstitial: true }))	// blog's home page

			}

		}

		/*
		 *	set handler for modification flag:
		 *	if clicked, prompts and eventually
		 *	discards the local-storage version
		 */

		mody.onclick = function (e) {

		    let subject = location.hash.substr (2)

			be.object (e).or (new Object).cancelBubble = true

			subject === 'sys/write/new/page' && nav.to (null, 'sys/discard/draft')
			subject === 'sys/write/new/page' || nav.to (null, 'sys/undo/changes')

		}

		/*
		 *	set handler for writing a new page
		 *	either in a blank collection or in
		 *	the current collection
		 */

		post.onclick = function (e) {

		    let collection = (location.hash.substr (2).match (RegExp ('^' + reg_escape (nav.username ()) + '\\/(\\w+)', 'i')) || [ empty ]).pop ()

			be.object (e).or (new Object).cancelBubble = true

			if (nav.id) {

				nav.ns || (collection || nav.to (null, 'sys/typing/something'))
				nav.ns || (collection && nav.to (null, 'sys/typing/something', { collection: tb (rc (collection.replace (/_R$/, empty))) }))
				nav.ns && (nav.rp && nav.to (null, nav.hp + '~note', { interstitial: true }))

			}

		}

		/*
		 *	set handler for the not-me button:
		 *	this will reload the page from the
		 *	point of view of visitors that are
		 *	not the author/owners for the page
		 */

		edit.onclick = function (e) {

		    let subject = location.hash.substr (2).split (tilde).shift ()

			be.object (e).or (new Object).cancelBubble = true

			switch (subject.split (slash).shift ()) {

				case '':	// implicit welcome page
				case 'ow':	// resident error page
				case 'sys':	// resident sys node

					return

			}

			nav.id && edit.className === 'on' && nav.to (null, subject, { instant: true, interstitial: true }) || nav.to (null, subject + '~edit', { instant: true, interstitial: true })

		}

		/*
		 *	set handler for that "share" icon,
		 *	somehow "useful" also to those who
		 *	CAN understand the function of the
		 *	browser's URL bar, because it also
		 *	copies the URL into the TIO's clip
		 */

		link.onclick = function (e) {

			be.object (e).or (new Object).cancelBubble = true

			switch (nav.st.link_out) {

				case null:

				    let theme = e.theme ? slash + cui.theme ().name.toLowerCase () : empty
				    let split = nav.pt && arrow || tilde

					tio.cl = empty + (location.hash.length > 2 ? (location.hash.split (tilde).shift ()) : empty).replace (cui.nonlegit, score)
					page_url.value = (location.origin) + theme + (location.hash.length > 2 ? (slash) + ('hash') + (location.hash.split (split).shift ().substr (1)) : empty)

					break

				default:

					clearTimeout (nav.st.link_out, nav.st.link_out = null)
					pad.style.width = '0'
					link_msg.style.opacity = '0'
					link.className = empty

					return

			}

			nav.st.link_out = setTimeout (function () {

				page_url.select ()
				page_url.setSelectionRange (0, 0xFFF)
				document.execCommand ('copy')
				page_url.blur ()
				link_msg.style.opacity = '1'

			}, 500)

			link.className = 'on'
			pad.style.width = '100%'

		}

		pad_mask.onclick = function (e) {

			switch (link.className) {

				case 'on':

					clearTimeout (nav.st.link_out, nav.st.link_out = null)
					pad.style.width = '0'
					link_msg.style.opacity = '0'
					link.className = empty

			}

			be.object (e).or (new Object).cancelBubble = true

		}

		/*
		 *	set handler to toggle note sorting
		 */

		sort.onclick = function (e) {

			be.object (e).or (clear).cancelBubble = true
			nav.pt && (nav.to (null, 'sys/gen/themed/link'))
			nav.pt || (nav.ns || (nav.to (null, t_talk === 'NAN' ? 'sys/gen/themed/link' : rc (nav.thisPage ()) + '~note')))
			nav.pt || (nav.ns && (nav.to (null, nav.hp + '~note', { interstitial: true, sort: (nav.rp || nav.kc) ? nav.so : { 'forward':'reverse', 'reverse':'forward' } [nav.so] || 'reverse' })))

		}

		/*
		 *	switch thru visual styles
		 */

		flub.onclick = function (e) {

			FORCE || cui.restyle ({ theme: cui.theme ().prev })
			FORCE || cui.mbUpdate ({ live: true, where: localStorage && (localStorage.theme = cui.theme ().prev) })

		}

		fluo.onclick = function (e) {

			FORCE || cui.restyle ({ theme: cui.theme ().next })
			FORCE || cui.mbUpdate ({ live: true, where: localStorage && (localStorage.theme = cui.theme ().next) })

		}

		/*
		 *	set up compass rendering context,
		 *	set up scene rendering context
		 */

		nav.st.oc = new Rc ({ cv: sc }).orient ({ pitch: -46 })
		nav.st.rc = new Rc ({ cx: nav.st.oc.cx }).orient ({ pitch: +15, yaw: 12 })

		/*
		 *	frame stepper
		 */

	    let ACGV = 123	// actual "areal capacity gauge value"

		nav.st.fs = function () {

		  const dn = Date.now ()
		  const oc = nav.st.oc
		  const rc = nav.st.rc
		  const st = nav.st.live
		  const ab = Math.abs
		  const sq = Math.sqrt

			/*
			 *	decrement future workers delay counter,
			 *	at every animation frame
			 */

			nav.array.wd = Math.max (0, nav.array.wd - 1)

			/*
			 *	if we're not animating,
			 *	just keep listening for changes...
			 */

			switch (nav.st.intro) {

				case 'painted':

					if (dn - st.t1 > 1400) {

						requestAnimationFrame && (nav.st.ff = nav.st.fh || requestAnimationFrame (nav.st.fs))
						requestAnimationFrame || (nav.st.fh = nav.st.fh || setInterval (nav.st.fs, 50.0 / 3))

						return

					} // allow 1 s of extra rendering to let the view "settle"

			}

			/*
			 *	el (eye level, eye leap) is true if looking around quickly enough,
			 *	gl (ground level / leap) is true if velocity's between ~ 4-44 Kph:
			 *	they will be reused later as levels, and "leaps" here, determining
			 *	how subsequent code behaves, in that they will "consent" switching
			 *	supersampling on if it's considered ok to drop the framerate a bit
			 */

		    let ra = rc.a
		    let rb = rc.b
		    let d1 = be.number (nav.st.pitch).or (rc.a) - rc.a
		    let d2 = be.number (nav.st.yaw).or (rc.b) - rc.b
		    let el = Math.ceil (Math.max (d1, d2)) > 1
		    let gl = Math.ceil (sq (st.vx * st.vx + st.vy * st.vy + st.vz * st.vz))

			gl = gl > 4 * st.el && gl < 44 * st.el

			/*
			 *	perform adjustments to level of detail
			 *	with respect to the detected framerate
			 */

			st.ft = st.ft ? st.ft : dn
			st.fn = st.fn + 1

			if (st.fn === 3) {

				switch (~~ ((st.el = (dn - st.ft) / 3) / 10)) {

					case 0: // > 100 fps

						/*
						 *	there's plenty of time here: even if the device
						 *	has a high-DPI screen, we may try supersampling
						 */

						if (el) break	//	not while in considerable turns
						if (gl) break	//	and not while moving quite fast

						st.ld > 66 && devicePixelRatio > 1 && st.pr < 1 && ray.onresize.call (st.pr = 2 * st.pr)

					case 1: // 51-99 fps

						/*
						 *	rendering pretty fast, probably fast enough for
						 *	supersampling at 1:1 pixel ratio (non-high-DPI)
						 */

						if (el) break	//	not while in considerable turns
						if (gl) break	//	and not while moving quite fast

						st.ld < 67 || devicePixelRatio > 1 || st.pr > 1 || ray.onresize.call (st.pr = 2 * st.pr)

					case 2: // 34-50 fps	//	rather fast, may improve detail

						if (st.ld < 99) {

							if ((++ st.fs) & 2)

								break

							st.ld = Math.min (st.ld + 1, 99)

						} // overall detail level increase, once every 2 "runs"

					case 3: // 26-33 fps	//	within target so take no action

						break

					case 4: // 21-25 fps	//	too slow - moderate current LOD

						if (nav.array.loader || nav.array.wc)

							/*
							 *	while something's loading (models and/or
							 *	areals) there may be stop frames, bursts
							 *	of computationally-intensive tasts while
							 *	workers (model generators) spawn and are
							 *	put to work: this doesn't mean the frame
							 *	rate "genuinely" dropped, it's OUR fault
							 *	and we know it :)
							 */

							break

						if (nav.st.intro === 'painted')

							/*
							 *	if the front page is showing a "painted"
							 *	intro scene, we'd like it to bear plenty
							 *	of detail, which was reset to a best fit
							 *	upon setting the painted mode, but which
							 *	we'd like to preserve here
							 */

							break

						if (st.sb > 22)

							/*
							 *	with standby framerate limiter engaged,
							 *	elapsed times won't reflect performance
							 */

							break

						if (st.ld > 33) {

							st.ld = Math.max (33, st.ld - 6)
							break

						} // progressively drop the LoD by contribution culling

					default: // < 21 fps	//	critical: halve resolution now!

						if (nav.array.loader || nav.array.wc)

							break	//	to see above and replicate here

						if (nav.st.intro === 'painted')

							break	//	to see above and replicate here

						if (st.sb > 22)

							break	//	to see above and replicate here

						st.ld = 99
						st.pr >= 1 && ray.onresize.call (st.pr = st.pr / 2)

				} // framerate measurement, and auto-quality/level of detail modulation

				st.fn = 0
				st.ft = dn
				st.el = .06 * st.el

			} // update elapsed time per frame, every 3 complete frames, taking the average

			/*
			 *	implement typematic hook calls:
			 *	simulates key repeats when keys are mouse or tap-driven
			 */

			if (be.lambda (nav.array.ac && nav.array.ac.handler).or (false)) {

				nav.is && ray.onaction ()	// considered an action if inside array
				nav.array.ac.handler (+1)	// calls the set handler

			}

			/*
			 *	implement cruise control,
			 *	unless quicktrip in progress,
			 *   // unless awaiting model generation
			 */

			if (cruiser.style.opacity == '1') {

			     // nav.t5 || nav.array.wc || ray.onaction ()
			     // nav.t5 || nav.array.wc || nav.array.forward (TMRATE * st.el)
				nav.t5 || ray.onaction ()
				nav.t5 || nav.array.forward (TMRATE * st.el)

			}

			/*
			 *	effective stepping:
			 *	implement animations, update panels
			 */

			switch (nav.st.intro) {

				case 'running':

					if (st.ft - st.t0 > 22E3)

						nav.st.intro = 'walking'

				case 'walking':

					if (st.ft - st.t0 > 28E3) {

						nav.st.we.call ({ to: 'park' })
						break

					}

					rc.orient  ({ pitch: rc.a - .01 * st.el, yaw: rc.b + .04 * st.el }).viewFrom ({ x: 400, y: 800, z: 0 })
					rc.forward ({ delta: - (st.cp += 4 * st.el) })

					break

				case 'stopped':

					/*
					 *	while watching The Array through the front-page window,
					 *	and we've reached the end of the animation, and we were
					 *	left with a somewhat "grainy" picture, return to normal
					 *	sampling or, unless device is "high-DPI", supersampled;
					 *	then, freeze animation comlpetely (nothing should move)
					 */

					if (nav.is === false) {

						d1 = Math.abs (nav.st.rc.a - 12.26)
						d2 = Math.abs (nav.st.rc.b + 44.88)

						d1 + d2 > .14 || ray.onresize.call (st.pr = devicePixelRatio > 1 ? 1 : 2, nav.st.intro = 'painted', nav.st.live.t1 = dn)

					}

				default:

					/*
					 *	restrict movement so that the viewpoint would always be
					 *	above the ground plane, and at least as tall as avatars
					 */

					rc.constrict ({ mx: -1220483425, Mx: +1220483425 })
					rc.constrict ({ my:   nav.st.ar, My: +244088	 })
					rc.constrict ({ mz: -1220483425, Mz: +1220483425 })

					/*
					 *	take reference coordinates for "true" speed computation
					 */

				    let rx = rc.x
				    let ry = rc.y
				    let rz = rc.z

					/*
					 *	animate pitch, yaw, and roll angles: implements angular
					 *	momentum by gradually reaching target values for angles
					 */

					switch (nav.st.pitch) {

						case 'not-set':

							nav.st.pitch = rc.a

						default:

							rc.orient ({ pitch: rc.a + .04 * (nav.st.pitch - rc.a) })

							if (nav.st.pitching === 'not-set')

								break

							nav.st.pitch = Math.min (Math.max (-90, nav.st.pitch + nav.st.free * nav.st.pitching), +90)
							nav.st.pitching = 0

					} // animate pitch

					switch (nav.st.yaw) {

						case 'not-set':

							nav.st.yaw = rc.b

						default:

							rc.orient ({ yaw: rc.b + .04 * (nav.st.yaw - rc.b) })

							if (nav.st.yawing === 'not-set')

								break

							nav.st.yaw = nav.st.yaw + nav.st.free * nav.st.yawing
							nav.st.yawing = 0

					} // animate yaw

					switch (nav.st.roll) {

						case 'not-set':

							nav.st.roll = rc.c

						default:

							rc.orient ({ roll: rc.c + ray.ir (.04) * (nav.st.roll - rc.c) })
							nav.st.roll = ray.fr (.9) * nav.st.roll

					} // animate roll

					/*
					 *	implement viewpoint acceleration and inertia,
					 *	take reference d1 to compute velocity before it changes
					 */

					d1 = sq (st.vx * st.vx + st.vy * st.vy + st.vz * st.vz)
					el = 0

					switch (nav.st.speed) {

						case 'not-set':

							break

						default:

							d2 = rc.fwd ({ delta: gl = nav.st.free * nav.st.speed })

							rc.viewFrom ({

								x: rc.x + st.el * (st.vx += d2.x),
								y: rc.y + st.el * (st.vy += d2.y),
								z: rc.z + st.el * (st.vz += d2.z)

							})

							nav.st.speed > 0 && (nav.st.dancing = false)
							nav.st.speed > 0 && (el = 121)
							nav.st.speed = 0

					} // forward/backward movement & inertia

					/*
					 *	end purely "cosmetic" chores, that make sense even when
					 *	The Array displays through its "window", on the welcome
					 *	page; what follows, is meaningful when we're "in", like
					 *	Flynn... :)
					 */

					if (nav.gr)

						break	// we're gating in or out (page might be blank)

					if (nav.is === false)

						break	// we're out of The Array (frontpage rendering)

					/*
					 *	snap to the closest direction, 8-way, as long as: speed
					 *	is significant and rapidly increasing, and a user isn't
					 *	turning around the yaw angle (i.e. changing directions)
					 *

					d2 = sq (st.vx * st.vx + st.vy * st.vy + st.vz * st.vz)
					d2 > st.el || (el = 121)

					if (d2 > d1 && d2 > 21 * st.el && ab (gl) < 1) {

					     // nav.array.snap (9, 9)

						ab (st.vx) > 5 * ab (st.vz) && (st.vz = ray.fr (.95) * st.vz)
						ab (st.vz) > 5 * ab (st.vx) && (st.vx = ray.fr (.95) * st.vx)

					} // high-speed directional snapping */

					/*
					 *	implement friction:
					 *	the coefficient may vary, especially in that you slide
					 *	easier when you manifest an intention to travel faster
					 */

					st.vx = ray.fr (st.mf) * st.vx
					st.vy = ray.fr (st.mf) * st.vy
					st.vz = ray.fr (st.mf) * st.vz

					/*
					 *	lets the viewpoint be "attracted" by horizontal planes,
					 *	although mostly if such planes are below (as of World's
					 *	ground function) the viewpoint itself; the bias letting
					 *	an avatar climb over some higher plane is added to your
					 *	current elevation (rc.y) to give an "eyes" level basing
					 *	on which World.ground will match planes lower than that
					 */

					el = Math.max (el, rc.fwd ({ delta: 221 }).y)

					gl = nav.st.ar + Math.max (

						World.ground ({ within: rc, layer: 'kids', eyes: el + rc.y }).level || 0,
						World.ground ({ within: rc, layer: 'root', eyes: el + rc.y }).level || 0

					) // ground level to adjust viewport elevation above that level

					if (ab (d1 = gl - rc.y) > 1) {

						d1 > 84 && (st.mf = .5)
						d2 = d1 > 0 ? 999 * d1 : 4E4
						d2 = d2 * st.el * Math.sign (d1) / (9999 + d1 * d1) + rc.y
						rc.viewFrom ({ y: Math.sign (d1) === Math.sign (gl - d2) ? d2 : gl })

					} // actual attraction takes place above: where close enough...

					else	rc.viewFrom ({ y: gl }) 	// ...just snap to that

					/*
					 *	compute and update instant velocity
					 *
					 *		      v 	-> semi-cm/60th
					 *		      v /    2	-> cm/60th
					 *			*   60	-> cm/s
					 *			/  100	-> m/s
					 *			* 3600	-> m/h
					 *			/ 1000	-> km/h
					 *		    ------------------------
					 *		      v * 1.08
					 *
					 *	p.s. 1 mile =~ 1.60934 km
					 */

					gl = 1 / st.el

					rx = gl * (rc.x - rx)
					ry = gl * (rc.y - ry)
					rz = gl * (rc.z - rz)

					t_per_h === 'mph' || (speed.innerText = (1.0800000 * (sq (rx * rx + ry * ry + rz * rz) + st.qv)).toFixed (0))
					t_per_h === 'mph' && (speed.innerText = (0.6710826 * (sq (rx * rx + ry * ry + rz * rz) + st.qv)).toFixed (0))

					/*
					 *	compute and update elevation:
					 *	rc.y was in semi-centimeters, 1 ft = 0.3048 m
					 */

					t_above === 'm' && (elevn.innerText = (0.005000000 * rc.y).toFixed (1))
					t_above === 'm' || (elevn.innerText = (0.016404199 * rc.y).toFixed (0))

					/*
					 *	compute and update areal coordinate ("arealcode"):
					 *	areals are exactly 1 square mile each, and square;
					 *	we always want positive numbers at four digits per
					 *	coordinate, so we'll translate our world origin by
					 *	4792 areals in both directions; 321868 is how many
					 *	semi-centimeters are in a mile
					 */

					d1 = Math.round (rc.x / 321868) + 4792
					d2 = Math.round (rc.z / 321868) + 4792
					gl = areal.innerText = d1.toString () + point + d2.toString ()

					/*
					 *	update works count
					 */

				     // nav.array.wc && (works.innerText = '(' + nav.array.wc.toString () + ')')
				     // nav.array.wc || (works.innerText = nav.array.loader ? '(+)' : String ())

					/*
					 *	upon crossing into a different areal,
					 *	tune in to events' channel for that new areal
					 *
					 *	      - note: all "crossing" operations cease
					 *		while transleaping (or quicktripping)
					 *		at speeds that induce a fade-to-black
					 */

					gl === nav.array.ch || nav.st.free === 0 || st.qv > 3000 || st.tv || nav.array.listen ({ to: gl, handler: function (response) {

					//const thisPerson = be.string (nav.id && localStorage.username).or ({ presently: 'anonymous visitor' })
					    let arealCache = be.object (nav.array.areals [nav.array.ch]).or ({ content: new Array, settled: 0 })

						for (let row of response.rows) {

							try { row = JSON.parse (row) }

								catch (e) { continue } // corrupt, or somehow missing row

							/*
							 *	update the current areal's cache:
							 *	if we return here after leaving the areal, but within the
							 *	lifespan of its possibly cached content, we'll find it as
							 *	we left it, once it's re-spawned from its cached image...
							 */

							if (row.instance)

								arealCache.content.push ((() => { return (arealCache.settled += row.instance.weight), row }) ())

							if (row.remove && (row.remove = JSON.parse (row.remove)))

								arealCache.content = arealCache.content.filter (content => { return !nav.array.match (content.instance, row.remove, arealCache.settled = row.cap) })

							/*
							 *	now we have to make it happen "visually"...
							 */

							if (row.instance) {

							    let cached = (nav.array.cached ({ model: row.instance.modelFile, crc32: row.crc32 }))

								cached && nav.array.create (row.instance, { as: row.instance.claim = row.claim })
								cached || clearTimeout (nav.array.timers [row.instance.modelFile] || null, nav.array.timers [row.instance.modelFile] = true)
								cached || nav.array.browse ({ model: row.instance.modelFile, gives: row.instance, where: row.instance.claim = row.claim, and: ++ nav.array.loader })

							} // if it's cached, don't browse; else, forcefully browse it now

							if (row.remove)

								nav.array.remove ({ instance: row.remove })

						} // each event since last query

					}})

					/*
					 *	upon crossing into a different areal,
					 *	de-spawn what gets out of view range
					 *
					 *	      - note: all "crossing" operations cease
					 *		while transleaping (or quicktripping)
					 *		at speeds that induce a fade-to-black
					 */

					gl === nav.array.actual || nav.st.free === 0 || st.qv > 3000 || st.tv || nav.array.despawn ({

						compute: {

							previous_areal_x: rx = nav.array.actual ? parseInt (nav.array.actual.split (point) [0]) : d1,
							previous_areal_z: rz = nav.array.actual ? parseInt (nav.array.actual.split (point) [1]) : d2,

						},

						areals: (() => {

						    let dict = new Array

							if (d1 > rx) {

								dict.push ([ rx - 1, rz - 1 ].join (point))
								dict.push ([ rx - 1, rz     ].join (point))
								dict.push ([ rx - 1, rz + 1 ].join (point))

							} // moving: east, de-spawning: west of reference areal

							if (d1 < rx) {

								dict.push ([ rx + 1, rz - 1 ].join (point))
								dict.push ([ rx + 1, rz     ].join (point))
								dict.push ([ rx + 1, rz + 1 ].join (point))

							} // moving: west, de-spawning: east of reference areal

							if (d2 > rz) {

								dict.push ([ rx - 1, rz - 1 ].join (point))
								dict.push ([ rx    , rz - 1 ].join (point))
								dict.push ([ rx + 1, rz - 1 ].join (point))

							} // moving: north, despawning: south of previous areal

							if (d2 < rz) {

								dict.push ([ rx - 1, rz + 1 ].join (point))
								dict.push ([ rx    , rz + 1 ].join (point))
								dict.push ([ rx + 1, rz + 1 ].join (point))

							} // moving: south, despawning: north of previous areal

							return (dict)

						}) ()

					})

					/*
					 *	upon crossing into a different areal
					 *	browse for missing areals
					 *
					 *	      - note: all "crossing" operations cease
					 *		while transleaping (or quicktripping)
					 *		at speeds that induce a fade-to-black
					 */

					gl === nav.array.actual || nav.st.free === 0 || st.qv > 3000 || st.tv || {

						updating:	nav.array.actual = gl,
						maintain:	clearTimeout (nav.array.spawnd [nav.array.actual] || 'no timers'),

						this_areal:	nav.array.spawn ({ areal: gl,				       }),
						east_of_here:	nav.array.spawn ({ areal: gl = [ d1 + 1, d2	].join (point) }),
						west_of_here:	nav.array.spawn ({ areal: gl = [ d1 - 1, d2	].join (point) }),
						north_of_here:	nav.array.spawn ({ areal: gl = [ d1    , d2 + 1 ].join (point) }),
						south_of_here:	nav.array.spawn ({ areal: gl = [ d1    , d2 - 1 ].join (point) }),
						north_east:	nav.array.spawn ({ areal: gl = [ d1 + 1, d2 + 1 ].join (point) }),
						north_west:	nav.array.spawn ({ areal: gl = [ d1 - 1, d2 + 1 ].join (point) }),
						south_east:	nav.array.spawn ({ areal: gl = [ d1 + 1, d2 - 1 ].join (point) }),
						south_west:	nav.array.spawn ({ areal: gl = [ d1 - 1, d2 - 1 ].join (point) })

					}

					/*
					 *	upon transitioning back to regular speeds and
					 *	out of transleaping velocities > 3000 u/frame
					 *	with u = semi-centimeter and ideally @60 fps,
					 *	thereby, from beyond about 3240 kph/2014 mph,
					 *	the scene will fade back into existence, with
					 *	a transition time of .5 seconds: st.tv pulses
					 *	true after crossing transleaping velocity and
					 *	then waits for the frame stepper to revert it
					 *	to <false> so we can act only once to trigger
					 *	a complete re-spawn of whatever's around, and
					 *	de-spawn of what was there before the trip...
					 */

					nav.st.free === 0 || st.tv === false || st.qv > 3000 || {

						implying:	st.tv = false,
						updating:	nav.array.actual = gl,
						provided:	nav.array.despawn ({ all: true }),
						requires:	nav.array.spawnAll (),
						maintain:	clearTimeout (nav.array.spawnd [nav.array.actual] || 'no timers')

					     /* this_areal:	nav.array.spawn ({ areal: gl,				       }),
						east_of_here:	nav.array.spawn ({ areal: gl = [ d1 + 1, d2	].join (point) }),
						west_of_here:	nav.array.spawn ({ areal: gl = [ d1 - 1, d2	].join (point) }),
						north_of_here:	nav.array.spawn ({ areal: gl = [ d1    , d2 + 1 ].join (point) }),
						south_of_here:	nav.array.spawn ({ areal: gl = [ d1    , d2 - 1 ].join (point) }),
						north_east:	nav.array.spawn ({ areal: gl = [ d1 + 1, d2 + 1 ].join (point) }),
						north_west:	nav.array.spawn ({ areal: gl = [ d1 - 1, d2 + 1 ].join (point) }),
						south_east:	nav.array.spawn ({ areal: gl = [ d1 + 1, d2 - 1 ].join (point) }),
						south_west:	nav.array.spawn ({ areal: gl = [ d1 - 1, d2 - 1 ].join (point) }) */

					}

			} // switch between intro mode and user control

			/*
			 *	manage Mary Lou's label note
			 *

			if (nav.array.wc > 0) {

				MSAID === t_working || (MSAYS.innerText = t_working)
				MSAID === t_working || (MSAID = t_working)

			}

			else {

				MSAID && (MSAYS.innerText = t_marys_note)
				MSAID && (MSAID = null)

			} // nothing to say */

			/*
			 *	implement image persistence between frames:
			 *	leaves smooth trails, longer and softer with lower values of nav.st.ip < 1
			 */

			d1 =   8 * (ra - rc.a)
			d2 =   8 * (rb - rc.b)
			gl = 1/8 * Math.max (0, 1 - sq (d1 * d1 + d2 * d2))

			st.ip = st.ip + ray.ir (.1) * ((Math.pow (st.el, 1/6) * (nav.st.ip + gl)) - st.ip)
			st.ip = Math.min (Math.max (0, st.ip), 1)

			rc.cx.globalAlpha = st.ip
			rc.cx.fillStyle = World.nullSurface
			rc.cx.fillRect (0, 0, scc.width, scc.height)

			/*
			 *	compute areal capacity gauge,
			 *	ahead of eventually rendering the entire frame
			 *
			 *	      - while however, we're in the process of parsing a little too
			 *		many object instances, we prefer to withhold rendering, but
			 *		keeping the capacity gauge (that doubles up as a "progress"
			 *		indicator) in show: rendering will still occur while simply
			 *		awaiting for requests to load model, but blacks out as > 15
			 *		workers try to allocate CPU cores and time spans to do what
			 *		they need to; aesthetically, this may not look cute, but it
			 *		ultimately cuts areal generation times
			 */

		    let arealCache = be.object (nav.array.areals [nav.array.actual]).or ({ settled: 0 })
		    let cgv = ACGV = ACGV + (arealCache.settled * 123 / 50000 - ACGV) * ray.ir (.014112)

		     /* if (nav.array.wc > 15) {

				mi.facg.edge = '#E00'

				oc.K = Math.max (0, 1 - st.ip) * parseFloat (be.string (getComputedStyle ($('panel-l')).opacity).or ('1'))
				oc.viewFrom ({ x: 0, y: 0, z: 0 }).orient ({ yaw: rc.b }).forward ({ delta: -276 })
				World.render ({ within: oc, detail: 99, layers: [ 'compass' ], sort: false })
				oc.viewFrom ({ x: 0, y: 0, z: 0 }).orient ({ yaw: -cgv }).forward ({ delta: -288 })
				World.render ({ within: oc, detail: 99, layers: [ 'acGauge' ], sort: false })

				requestAnimationFrame && (nav.st.ff = nav.st.fh || requestAnimationFrame (nav.st.fs))
				requestAnimationFrame || (nav.st.fh = nav.st.fh || setInterval (nav.st.fs, 50.0 / 3))

				return

			} // disable rendering when parallel-processing more than 63 instances

			/*
			 *	render the world's reflection:
			 *	there's a 14-cm gap representing the horizon plane's thickness
			 */

		    let range = ~~ (455190 / (((++ st.ws) % 3) + 1))

			rc.viewFrom ({

				y:	rc.y + 28,					// pull up 28 units (14 cm.)
				where:	rc.q = .03125					// set reflected dark faces' opacity

			})

			nav.is && ray.render ('root', -1, .22, range / 4)		// strong reflections	(while in the Array)
			nav.is || ray.render ('root', -1, .11, range / 4)		// lighter reflections	(front page preview)

				  ray.render ('skys', -1, 1)				// horizon/sky elements
				  ray.render ('soil', +1, 1)				// flat ground elements

			rc.viewFrom ({

				y:	rc.y - 28,					// pull back down 28 units
				where:	rc.q = .125					// reset dark face opacity to default

			})

			/*
			 *	render "accessory layers",
			 *	and the effective right-side-up version of the world
			 */

		     // if ((++ st.ws) % 2 == 0 || st.sb > 22 || nav.is === false || nav.array.ff) {

				ray.render ('skys', 1, 1.4)
				ray.render ('soil', 1, .77)
				ray.render ('root', 1, 1.0, range)

				if (nav.is) {

					/*
					 *	render the held model
					 */

					rc.S = st.st; gl = st.ld; st.ld = st.ld_hm; ray.render ('model', 1, 1); rc.S = 3219; st.ld = gl

					/*
					 *	unless panels are disabled,
					 *	render the compass
					 */

					switch (nav.array.pd) {

						case false:

							if (nav.array.loader + nav.array.wc)

								mi.facg.edge = {

									0: '#E00',
									1: '#E20',
									2: '#E40',
									3: '#E60',
									4: '#E80',
									5: '#EA0',
									6: '#EC0',
									7: '#EE0',
									8: '#EE0',
									9: '#EC0',
								       10: '#EA0',
								       11: '#E80',
								       12: '#E60',
								       13: '#E40',
								       14: '#E20',
								       15: '#E00'

								} [~~ ((dn % 1000) * 0.016)]

							else {

								cgv < 98.4 && (mi.facg.edge = '#8E4')
								cgv < 98.4 || (mi.facg.edge = '#E44')

							}

							oc.K = Math.max (0, 1 - st.ip) * parseFloat (be.string (getComputedStyle ($('panel-l')).opacity).or ('1'))
							oc.viewFrom ({ x: 0, y: 0, z: 0 }).orient ({ yaw: rc.b }).forward ({ delta: -276 })
							World.render ({ within: oc, detail: 99, layers: [ 'compass' ], sort: false })
							oc.viewFrom ({ x: 0, y: 0, z: 0 }).orient ({ yaw: -cgv }).forward ({ delta: -288 })
							World.render ({ within: oc, detail: 99, layers: [ 'acGauge' ], sort: false })

					}

					/*
					 *	update UI extras - such as item boxes (labels)
					 */

					ray.manageLabels ({

						distanceLabel: t_distance,
						distanceConversionFactor: t_per_h === 'mph' ? 3.10686368325E-6 : 5E-6,
						distanceUnitName: t_per_h === 'mph' ? 'mi.' : 'km.',
						distanceDecimals: 1

					})

				} // in-Array tasks

		     // } // world strobe increment and test

			/*
			 *	manage standby framerate limiter:
			 *	leaves the CPU less busy while the user appears to be doing nothing, by
			 *	dropping the rate at which the stepper itself is called to assemble the
			 *	next frame; quite convoluted and slightly coupled with code in "nav.js"
			 *	so... shame on me, but can't actually bother thinking some other way...
			 */

		over:	switch (-- st.si) {

				case 0:

					nav.st.ff && cancelAnimationFrame (nav.st.ff, nav.st.ff = null)
					nav.st.fh && clearInterval (nav.st.fh, nav.st.fh = null)
					nav.st.fk && clearTimeout (nav.st.fk, nav.st.fk = null)

					switch (nav.st.intro) {

						case 'running':

							st.sb = 50
							st.si = 50
							break over

					}

					st.sb = Math.max (0, (el = dn) - be.number (st.at).or (el)) / 1000
					st.si = 50

					if (st.sb > 22) {

						nav.st.fh = setInterval (nav.st.fs, Math.min (~~st.sb, 999))
						return

					} // apply limiter: 22 or more seconds passed since last action

					requestAnimationFrame && (nav.st.ff = requestAnimationFrame (nav.st.fs))
					requestAnimationFrame || (nav.st.fh = setInterval (nav.st.fs, 50.0 / 3))

					return

			} // st.si counts down and measures time since user last action, every 50 frames

			requestAnimationFrame && (nav.st.ff = nav.st.fh || requestAnimationFrame (nav.st.fs))
			requestAnimationFrame || (nav.st.fh = nav.st.fh || setInterval (nav.st.fs, 50.0 / 3))

		} // frame stepper (nav.st.fs)

		nav.st.we = function () {

		    let x = -2875, y = 0, z = -2110

			switch (be.string (this && this.to).or ('nothing')) {

				case 'gate':

					if (nav.pb || nav.hb) {

					    let pos = nav.pb || nav.hb

						x = 321868 * (be.number (parseInt (pos.split (point).shift ())).or (4792) - 4792)
						z = 321868 * (be.number (parseInt (pos.split (point).pop ())).or (4792) - 4792)

						nav.lm = pos
						nav.pb = null

					}

					nav.array.loader = 1
					nav.st.free = 0
					nav.st.rc.orient ({ pitch: 0, yaw: 0, roll: 0 })
					nav.st.live.t2 = setTimeout (function () { nav.st.free = 1; nav.array.loader = 0 }, 1111)

				case 'park':

					nav.st.intro = 'stopped'

					nav.st.pitch = 12.26
					nav.st.yaw = -44.888
					nav.st.roll = 0
					nav.st.pitching = 0
					nav.st.yawing = 0
					nav.st.speed = 0
					nav.st.live.vx = 0
					nav.st.live.vy = 0
					nav.st.live.vz = 0
					nav.st.live.ip = nav.st.ip
					nav.st.rc.viewFrom ({ x: x, y: y, z: z })

					ray.onaction ()

			} // follow request

		} // world entry (nav.st.we)

	     // gate.onclick = function (e, noFlicker) {
		gate.onclick = function (e) {

			e && (e.preventDefault ())
			e && (e.cancelBubble = true)

			/*
			 *	clear previous requests,
			 *	if one's still "live"...
			 */

			nav.gr && clearTimeout (nav.gr)

			/*
			 *	set flicker-free flag
			 */

		     // nav.array.ff = noFlicker || false

			/*
			 *	gating into The Array
			 */

			nav.is || (nav.gr = setTimeout (function () {

				arc.removeChild (scc)
				arr.appendChild (scc)

				arr.style.display = 'block'

				hdl.style.zIndex = '0'
				hdr.style.zIndex = '0'
				scn.style.height = pag.style.height = nav.ph = (3 * tio.ch).toFixed (0) + 'px'
				txt.style.background = 'none'

				setTimeout (function () {

					scc.style.top = '0'
					scc.style.left = '0'
					scc.style.width = '100%'
					scc.style.height = '100%'
					scc.style.opacity = '1'

					hlp.style.opacity = '0'
					scn.style.opacity = '1'
					pag.style.overflowY = 'hidden'
					pag.style.transition = 'height .5s'

					nav.array.instance || (tio.setCursorState ({ state: 'hide', given: nav.array.el = false }))
					nav.array.instance || (tio.cls ().type ({ as: [ nav.array.mo = 3, nav.xm = false ], text: tio.mb = nav.mb = nav.cb = nav.ab, cps: 14, oncompletion: tio.kbFunctions.ro_home }))
					nav.array.instance && (nav.st.mc.enable && setTimeout (function () { tio.onpickrun ({ label: t_configure, force: true }) }, 250))
					nav.array.instance && (nav.st.mc.enable || tio.setCursorState ({ state: 'hide' }).load (empty, null, tio.mb = nav.mb = nav.cb = nav.ib).kbFunctions.ro_home (nav.array.mo = 3))

					setTimeout (function () { panels.style.opacity = 1 }, 250, { where: panels.style.display = boxs.style.display = cat.style.display = 'block' })

				}, 100)

				ray.onresize	({ consider: nav.is = true })
				cui.restyle	({ theme: FORCE = 'P_4' })
				tio.update	({ keepActiveRow: true })
				nav.st.we.call	({ to: 'gate' })

				ray.start (nav.gr = null)

			}, 500, { considering: hdl.style.opacity = hdr.style.opacity = scn.style.opacity = scc.style.opacity = '0', and: nav.st.live.tv = true }))

			/*
			 *	gating back off Array
			 */

			nav.is && (nav.gr = setTimeout (function () {

				arr.style.display = panels.style.display = cat.style.display = 'none'
				scc.style.display = nav.hp ? 'block' : 'none'

				arr.removeChild  (scc)
				arc.insertBefore (scc, arc.firstChild)

				hdl.style.opacity = '1'; hdl.style.zIndex = '4'
				hdr.style.opacity = '1'; hdr.style.zIndex = '4'
				scn.style.opacity = '1'
				hlp.style.opacity = cui.handleOp ()
				pag.style.overflowY = 'scroll'
				txt.style.background = 'none'
				txt.style.backgroundImage = notebooks [cui.theme ().name] || empty
				txt.style.backgroundSize = cui.theme ().name in notebooks ? 'auto' + blank + (9 * tio.ch).toFixed (0) + 'px' : empty

				tio.mb = nav.mb = nav.cb = nav.db

				ray.onresize	({ consider: nav.is = false })
				cui.restyle	({ theme: FORCE = false })
				tio.update	({ keepActiveRow: true })
				nav.st.we.call	({ to: 'park' })
				nav.array.pd && (nav.array.togglePanels ())

			    let point_mary_to = nav.st.rc.aimAt ({ x: -2875, y: 0, z: -2110, from: mi.orb1.origin })

				mi.orb1.orient.pitch =
				mi.avr1.orient.pitch =
				mi.frng.orient.pitch =
				mi.brng.orient.pitch =
				mi.ears.orient.pitch =
				mi.wkrs.orient.pitch = point_mary_to.pitch

				mi.orb1.orient.yaw =
				mi.avr1.orient.yaw =
				mi.frng.orient.yaw =
				mi.brng.orient.yaw =
				mi.ears.orient.yaw =
				mi.wkrs.orient.yaw = point_mary_to.yaw

				nav.to (null, nav.aa ? 'sys/welcome/page' : empty)
				ray.onaction (nav.gr = null)

			}, 500, { considering: scn.style.opacity = scc.style.opacity = panels.style.opacity = cruiser.style.opacity = '0', and: boxs.style.display = 'none' }))

			/*
			 *	instant gating operations
			 */

			nav.is || (cui.shush ())					// crossing in: remove speech bubble with possible hints
			nav.is || (tio.disconnectKeyboard ())				// crossing in: set keyboard control to array navigation
			nav.is || (document.onkeydown = nav.array.keydown)		// crossing in: set keyboard control to array navigation
			nav.is || (Shortcut.add ('enter', nav.kb.amc3.submit.f))	// crossing in: add persistent shortcut to submit models

			nav.is && (document.onkeydown = null)				// crossing out: set keyboard control to TIO (read-only)
			nav.is && (Shortcut.remove ('enter'))				// crossing out: remove (said) shortcut to submit models
			nav.is && (tio.connectKeyboard (true))				// crossing out: set keyboard control to TIO (read-only)
			nav.is && (nav.array.despawn ({ all: true }))			// crossing out: de-spawn all areals ("empty" the world)
			nav.is && (clearTimeout (nav.array.qt)) 			// crossing out: stop listening to areal's event channel
			nav.is && (clearTimeout (nav.st.live.t2))			// crossing out: clear timeout-to-free if it didn't fire

			if (nav.is) {

				ctc.style.display = String ('none')
				ctc.style.height  = scn.style.height = pag.style.height = nav.ph
				osk.style.height  = osk.style.opacity = ctl.style.height = ctl.style.opacity = lfn.style.height = lfn.style.opacity = rfn.style.height = rfn.style.opacity = nav.ck = String ('0')
				nav.st.mc.active  = nav.ok = nav.array.ax = nav.array.az = nav.array.ah = false

				nav.array.actual  = undefined
				nav.array.ch	  = null

				tio.setCursorState ({ state: 'hide' })

			} // turn AMC3 off and don't flash cursor when gating off in consequence of the ALT+A shortcut (it's done later, by tio.onpgfocus, but here makes it happen visually quicker)

		} // array gate transition handler

		/*
		 *	array start-up step 1:
		 *	world-building
		 */

	  const step1 = function () {

		    let e = [

				'#FFF', '#FFD', '#FFA', '#FF8', '#FC8', '#FA8',
				'#F88', '#F8A', '#F8D', '#F8F', '#D8F', '#B8F',
				'#88F', '#8AD', '#8CB', '#8EA', '#8F8', '#8FA',
				'#8FC', '#8FE', '#8FF', '#AFF', '#CFF', '#EFF'

			] // gradients

			World.layers.compass = [

				{

					model: mb.compass,
					edge: '#BCF',
					origin: { x: 0, y: 0, z: 0 },
					orient: { pitch: 0, yaw: 0, roll: 0 }

				}

			] // navigation compass

			World.layers.acGauge = [

				mi.facg = {

					model: mb.gauge,
					edge: '#8E4',
					origin: { x: 0, y: 0, z: 0 },
					orient: { pitch: 0, yaw: 0, roll: 0 }

				}

			] // areal capacity gauge

			World.interactables = {

				$MARY_LOU: {

					caliber: 9,
					persist: true,
					subject: mi.orb1,
					element: new Box ('MARY LOU')
						.premiering (2222)
						.setHandler (function () { nav.to (null, 'sys/about/the/array') })

				}

			} // initialized item labels

			MSAYS = World.interactables.$MARY_LOU.element.appendNote (t_marys_note, { handled: true })

			/*
			 *	build the floor,
			 *	build the world
			 */

		    let S = World.layers.skys = new Array
		    let s = World.layers.soil = new Array
		    let w = World.layers.root = new Array
		    let k = World.layers.kids = new Array
		    let c = 0
		    let r = z = p = undefined

			mb.areal.faces.shift ()
			mb.areal.groups [0].faces.shift ()

			S.push (mi.hor1, mi.hor2, mi.hor3, mi.hor4)
			s.push (mi.nmlg, mi.nmlr)
			w.push (mi.orb1, mi.avr1, mi.frng, mi.brng, mi.ears, mi.wkrs, { model: mb.arcb, edge: '#1FF', origin: { x: 0, y: 0, z: 2440 } })

			for (r = -160; r <= 160; r += 1) {

				z = 2500 * r
				c = c < 23 ? ++ c : 0

				switch (p = ~~ (r / 40)) {

					case 0:

						if (r) {

							w.push ({ model: mb.zPost, edge: e [c], origin: { x: -3640, y: 0, z: z } })
							w.push ({ model: mb.zPost, edge: e [c], origin: { x: +3640, y: 0, z: z } })

						}

						break

					default:

						if (r % p === 0) {

							w.push ({ model: mb.zPost, edge: e [c], origin: { x: -3640, y: 0, z: z } })
							w.push ({ model: mb.zPost, edge: e [c], origin: { x: +3640, y: 0, z: z } })

						}

				}

				if (r % 8 === 0) {

					w.push ({ model: mb.treeLeft, edge: '#4F4', origin: { x: -2500, y: 0, z: z } })
					w.push ({ model: mb.treeRight, edge: '#4F4', origin: { x: +2500, y: 0, z: z } })

				}

			} // posts and trees (main avenue)

			s.push ({ model: mb.zStripe, edge: '#FFF', origin: { x: -2000, y: 0, z: -32E4 } })		//
			s.push ({ model: mb.zStripe, edge: '#FFF', origin: { x: +2000, y: 0, z: -32E4 } })		//
			s.push ({ model: mb.zStripe, edge: '#FFF', origin: { x: -2000, y: 0, z: -16E4 } })		//
			s.push ({ model: mb.zStripe, edge: '#FFF', origin: { x: +2000, y: 0, z: -16E4 } })		//
			s.push ({ model: mb.zStripe, edge: '#FFF', origin: { x: -2000, y: 0, z: -80E3 } })		//
			s.push ({ model: mb.zStripe, edge: '#FFF', origin: { x: +2000, y: 0, z: -80E3 } })		//	main ave's
			s.push ({ model: mb.zStripe, edge: '#FFF', origin: { x: -2000, y: 0, z: +80E3 } })		//	stripes
			s.push ({ model: mb.zStripe, edge: '#FFF', origin: { x: +2000, y: 0, z: +80E3 } })		//
			s.push ({ model: mb.zStripe, edge: '#FFF', origin: { x: -2000, y: 0, z: +16E4 } })		//
			s.push ({ model: mb.zStripe, edge: '#FFF', origin: { x: +2000, y: 0, z: +16E4 } })		//
			s.push ({ model: mb.zStripe, edge: '#FFF', origin: { x: -2000, y: 0, z: +32E4 } })		//
			s.push ({ model: mb.zStripe, edge: '#FFF', origin: { x: +2000, y: 0, z: +32E4 } })		//

			for (let r = 1; r < 63; ++ r) {

				z = 2500 * r + 2500

				if (r % 2 === 0) {

					w.push ({ model: mb.xPost, edge: '#FFF', origin: { x: -z, y: 0, z: 1140 } })
					w.push ({ model: mb.xPost, edge: '#FFF', origin: { x: -z, y: 0, z: -1140 } })
					w.push ({ model: mb.xPost, edge: '#FFF', origin: { x: +z, y: 0, z: 1140 } })
					w.push ({ model: mb.xPost, edge: '#FFF', origin: { x: +z, y: 0, z: -1140 } })

				}

			} // posts around side roads

			s.push ({ model: mb.xStripe, edge: '#FFF', origin: { x: -80E3 - 2500, y: 0, z: -1000 } })	//
			s.push ({ model: mb.xStripe, edge: '#FFF', origin: { x: -80E3 - 2500, y: 0, z: +1000 } })	//	sideroads'
			s.push ({ model: mb.xStripe, edge: '#FFF', origin: { x: +80E3 + 2500, y: 0, z: -1000 } })	//	stripes
			s.push ({ model: mb.xStripe, edge: '#FFF', origin: { x: +80E3 + 2500, y: 0, z: +1000 } })	//

			w.push ({

				model: mb.home,
				edge: '#FDD',
				origin: { x: 4E4 + 140, y: 0, z: 4400 }

			}) // home model

			mb.home.addChild (mi.medlar = {

				model: mb.treeLeft,
				edge: '#1E7',
				origin: { x: 4E4 - 140, y: 0, z: 6600 },
				scale: { uniform: .6 }

			}) // the medlar tree

			system_models = w.length
			system_childs = k.push (mi.medlar)

		} // worldbuilding

		/*
		 *	array start-up step 2:
		 *	user interface set-up
		 */

	  const step2 = function () {

			/*
			 *	resets Level Of Detail:
			 *	more generally this will detect display attributes,
			 *	and eventually call the resize handler to fit stuff
			 */

			ray.lodReset ()

			/*
			 *	attach navigation event handlers:
			 *	this concludes set-up for the navigation interface,
			 *	what follows configures user input (the TIO screen)
			 */

			cat.oncontextmenu = (e) => { e.preventDefault () }
			cat.onwheel = nav.array.wheel
			cat.onpointerdown = nav.array.pointerdown
			cat.onpointerup = cat.onpointerout = cat.onpointercancel = cat.onpointerleave = nav.array.pointerup

		} // array UI set-up

		/*
		 *	I'm trying not to lie when I'm saying it could be
		 *	entirely keyboard-driven...
		 */

		Shortcut.add ('f1',	help.onclick)
		Shortcut.add ('f2',	find.onclick)
		Shortcut.add ('alt+a',	gate.onclick)
		Shortcut.add ('alt+f',	flip.onclick)
		Shortcut.add ('alt+p',	post.onclick)
		Shortcut.add ('ctrl+e', edit.onclick)
		Shortcut.add ('ctrl+q', mody.onclick)
		Shortcut.add ('ctrl+s', save.onclick)

		/*
		 *	enable "keyboard shortcuts" concerning the entire
		 *	navigation interface: currently, allow stretching
		 *	the TIO display to take the entire window in case
		 *	of portrait mode, and back to our default 60%, by
		 *	hooking a browser's keyboard-driven zoom controls
		 *	hoping it allows that (it's not critical, though)
		 */

		Shortcut.add ('ctrl++', function () { (NLAND && innerWidth > innerHeight) && nav.rh.call ({ userChoice: true, set: nav.st.ps = nav.st.ks = nav.st.ms }) })
		Shortcut.add ('ctrl+-', function () { (NLAND && innerWidth > innerHeight) && nav.rh.call ({ userChoice: true, set: nav.st.ps = nav.st.ks = nav.st.ds }) })
		Shortcut.add ('ctrl+0', function () { (NLAND && innerWidth > innerHeight) && nav.rh.call ({ userChoice: null, set: nav.st.ps = nav.st.ks = nav.st.ds }) })

		Shortcut.add ('f11',		full.onclick)
		Shortcut.add ('alt+left',	back.onclick)
		Shortcut.add ('alt+right',	forw.onclick)

		/*
		 *	whenever a shorcut's keystroke - which includes a
		 *	regular TIO kestroke - occurs, break page loading
		 *	animations, if any was in progress: we assume the
		 *	viewer doesn't mind it and wants immediate action
		 *
		 *	      - unless in The Array where the cursor goes
		 *		flashing to indicate an active option, or
		 *		unless the said key was F11, which may be
		 *		comfortable to switch to full-screen, but
		 *		we don't want it to count as a hint we're
		 *		navigating via keyboard shortcuts, and we
		 *		might not wish the cursor to be displayed
		 */

		Shortcut.any = function (e) {

			tio.stopTyping ()

			nav.is || e.key === 'F11' ||	tio.setCursorState ({ state: 'show' })	// unless in The Array
			nav.is && tio.keyboardHooked && tio.setCursorState ({ state: 'show' })	// but, even then, unless we're browsing the site from inside The Array (tio.keyboardHooked tells us that)

		}

		/*
		 *	set handlers for...
		 *	whatcha doing here? that's classified...
		 */

		Shortcut.add ('alt+x', (e) => nav.to (null, 'sys/ops/reports/registry'))
		Shortcut.add ('alt+c', (e) => nav.to (null, 'sys/ops/console'))

		/*
		 *	hook image loaders to their inputs
		 */

		$('cover-file').onchange = nav.loadCover
		$('image-file').onchange = nav.loadImage
		$('image-post').onchange = nav.postImage
		$('model-file').onchange = nav.loadModel
		$('packg-file').onchange = nav.loadPackg
		$('photo-file').onchange = nav.loadPhoto
		$('slide-show').onchange = nav.slideShow

		/*
		 *	restore chosen style from
		 *	localStorage record, upon
		 *	coming back, re-load help
		 *	balloon counters
		 */

	    let u_r_i = be.string (location.pathname).or (slash)
	    let force = be.vector (u_r_i.match (/\/(acn|atr|c64|[cv]ga|lc[ds]|nb[lrt]|ndy|p_[13]|t3c|tva|vfd)\b/)).or ([ 0 ])
	    let theme = be.string (force.pop () || (localStorage && localStorage.theme)).or (THEME).toUpperCase ()
	    let login = be.object (lr [theme]).or ({ screen: empty, loader: empty, system: empty, runner: empty })

		cui.restyle ({ theme: (theme = lr [theme] ? theme : THEME) })
		cui.mbUpdate ({ where: force.length - 1 || (FORCE = theme) })

		/*
		 *	perform entry login request, then
		 *	load URI from hash string, if any
		 */

		tio.show ().type ({

			text: login.screen.replace (/_/g, blank),

			oncompletion: function () {

				tio.type ({

					text: login.loader, cps: 30, lim: 0,

					oncompletion: function () {

						tio.type ({

							text: login.system,

							oncompletion: function () {

							    let req = function () {

									tio.type ({

										text: login.prompt,

										oncompletion: function () {

											tio.type ({

												text: login.runner, cps: 14, lim: 0,

												oncompletion: function () {

													nav.to (null, this.landing, {

														where: nav.st.pp_status.muted = false,
														entryRequest: true

													})

													setTimeout (function () {

														nav.cm || cui.helps (true)
														hdl.style.transition = hdr.style.transition = empty

													}, 250)

													setTimeout (step1, 400)
													setTimeout (step2, 800)
													setTimeout (function () { cui.going = true; nav.fp && ray.start () }, 999)

												}.bind (this)

											}) // step 5 (runner)

										}.bind (this)

									}) // step 4 (prompt)

								}.bind (this)

							     /* new Requester ({ query: '80.style' }).post ({

									uri: '/exec/signIn',

									pairs: [

										{ name: 'username', value: nav.username () },
										{ name: 'identity', value: nav.identity () },
										{ name: 'usrFacts', value: nav.getFacts () }

									],

									onwhoa: function (r) {

										req (nav.id = false)

									},

									onload: function (r) {

										nav.ii = new Object
										nav.il = r.response.split (nline)

										for (let name of nav.il)

											nav.ii [name] = true

										req (nav.id = true, nav.ig = r.response)

									}

								}) // actual login request */	// INSECURE ON LOCAL: PLEASE UNCOMMENT FOR DEPLOYMENT!

								req (nav.id = false)		// PATCHES MISSING ROWS ABOVE - DELETE WHEN DEPLOYING!

							}.bind (this)

						}) // step 3 (system)

					}.bind (this)

				}) // step 2 (loader)

			}.bind ({ landing: location.hash.substr (2) })

		}) // step 1 (screen)

	} // window.onload


