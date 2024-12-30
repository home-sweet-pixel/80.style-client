


	/*
	 *
	 *	=============================================
	 *	TIO (Text-driven I-O) interface for 80.style:
	 *	derives from the unpublished L.in.oleum 4 IDE
	 *	=============================================
	 *
	 *	Copyright 2020-2024 by Alessandro Ghignola
	 *	Public domain - but you're on your own. :)
	 *
	 */

	const tio = {

		/*
		 *	behavioral configuration
		 */

		hPatterns: { }, 			// highlighter patterns (regexs under named keys)
		hHandlers: { }, 			// highlighter replacement functions (by pattern key)

		clipStart: function (r) { return r },	// replacement for text clip start line
		clipClose: function (r) { return r },	// replacement for text clip end line

		oncommand: function () { },		// handler for when "enter" is pressed (in lack of LINK URIs)
		onconfirm: function () { },		// handler for when "enter" is pressed (in any circumstances)
		oncsrmove: function () { },		// handler for when the TIO cursor moves (tio.positionCursor)
		onhomings: function () { },		// handler for when "home" is pressed, out of writable fields
		onmtpaste: function () { },		// handler for when "paste" is attempted while tio.cl is void
		onlinkrun: function () { },		// handler for when "enter" is pressed (to follow a LINK URI)
		onpickrun: function () { },		// handler for when "enter" is pressed (to follow multi PICK)
		onchanges: function () { },		// handler for when anything happens (in terms of user input)
		onpgfocus: function () { },		// handler for when clicks occur in parts that are not fields
		onwifocus: function () { },		// handler for when clicks occur in any writable input fields
		oninfocus: function () { },		// handler for when clicks occur in an inactive writable area
		onprocess: function () { },		// handler for when the TIO is about to call the highlighters

		confirmInInput: true,			// true would take control of the "enter" key in input fields
		noLineOverflow: false,			// true would limit length of line to the screen's width (nc)

		/*
		 *	U.I. elements, as objects (filled by window.onload):
		 *	each global name resolves the element under the same ID
		 */

		scn: null,				// screen
		hlp: null,				// help overlay
		pag: null,				// page
		cur: null,				// text cursor
		cus: null,				// text cursor shadow
		txt: null,				// highlighted source text
		ovl: null,				// selection highlight overlay
		clc: null,				// clicks catcher
		ovs: null,				// overlays layer
		wwp: null,				// window width probe

		/*
		 *	autocomplete lists for DATA fields, indexed by line number
		 */

		ac: new Object (),			// autocomplete lists
		ca: null,				// complete-as (internal text buffer)

		/*
		 *	U.I. default metrics:
		 *	these can be configured, what follows depends from a browser's inner space and CSS metrics
		 *
		 *	      - all metrics are in CSS pixels (for low-resolution screens, that's physical pixels;
		 *		on high DPI screens, they may be larger, according to window.devicePixelRatio, but
		 *		this editor won't be affected by scaling or changes to the device pixel ratio);
		 *
		 *	      - note that, although we'd support tab sizes other than 8 blanks, we'd currently use
		 *		hard tabs, which are fixed to 8 blanks, to render tabs in this editor's workspace,
		 *		so that value is pretty much not meant to change, or visual glitches will occur...
		 */

		lh: 2.75,				// line height (rel. char width assuming 2:1 aspect ratio)
		nc: 60, 				// requested number of columns (default = 60)
		pb: 45, 				// pull-back column number (below which, we'd scroll left)
		rx: 0,					// right margin (added to window's inner width to make re)
		lp: new String ('auto').toString (),	// requested left-side padding (auto => center of display)
		tx: new Array  (8 + 1).join (blank),	// tabulation "expander" (standard tabs are 8 blanks each)

		/*
		 *	U.I. default metrics:
		 *	ww, le, re, tt, vp, cw, ch will be all reassigned on window resizes to match changes, with
		 *	tt being copied from the "sdw" element's actual top-side padding (as of getComputedStyle),
		 *	le from the corresponding left-side padding, re as ww + rx (under assumption that rx would
		 *	be usually negative), vp as the difference between the window's innerHeight and the height
		 *	of the "pag" element, cw and ch to accommodate <nc> columns of text across <re> pixels, as
		 *	close as possible while keeping both dimensions strictly integer
		 */

		ww: 640,				// window's inner width, as probed
		le: 0,					// left edge for visible text area
		re: 640,				// right edge of visible text area
		cw: 8,					// cursor width
		ch: 20, 				// cursor height
		tt: 0,					// ordinate of top of text (top margin)
		vp: function () { return 0 },		// total vertical paddings (above and below page)

		/*
		 *	U.I. state variables
		 */

		cs: true,				// cursor state (true = in show, false = hidden)
		bs: true,				// cursor state (true = blinking, false = solid)
		mb: empty,				// menu bar
		ai: 0,					// clip area indent level (characters)
		bi: 2,					// read-only editor base indent (characters)
		ii: 2,					// clip area indent level for inactive area (usually 2)
		lk: empty,				// last key
		it: empty,				// inner text
		ot: new Array,				// outer text (superimpressions)
		rt: null,				// reflow timer handle (see onresize hook)
		cp: null,				// cursor position object
		ci: 0,					// cursor position index (character index)
		kl: 0,					// caps lock state (0 = inactive, 1 = active)
		s1: false,				// start of selected text (false = no selection)
		s2: false,				// end of selected text (as s1, character index)
		sj: 0,					// sel. start line cache (valid only if above 0)
		cl: empty,				// clip string
		pt: 0,					// page top (cached scrollTop property)
		pl: 0,					// page left (cached position.left of contents)
		sm: -1, 				// search match (character index, -1 = no match)
		ss: empty,				// search string
		rs: empty,				// replacement string (search and replace)
		pm: false,				// flag: prompt mode on
		pc: 0,					// prompt base character index
		ro: true,				// flag: read-only mode
		cm: false,				// flag: console mode
		l1: +0xFFFFFF,				// start line of writable area in read-only mode
		l2: -0xFFFFFF,				// final line of writable area in read-only mode
		l3: +0xFFFFFF,				// start line of inactive area in read-only mode
		l4: -0xFFFFFF,				// final line of inactive area in read-only mode
		TT: null,				// array of characters to type (type simulation)
		ST: 0,					// flag: stop "typing" immediately, do full dump
		zr: new Array,				// undo array (populated with objects)
		lr: false,				// pick lone row for quick updates
		rr: null,				// reference row for mousemove handler

		/*
		 *	common regexps
		 */

		tg_data: new RegExp ('\\x20*(DATA|\\d{4})\\x20\\`\\`\\x20.*?\\`\\x20'),
		tg_link: new RegExp ('(L|N)\\x20\\`\\`\\x20\\x20?([^\\n\\t]+)'),
		tg_pick: new RegExp ('(M|P)\\x20\\`\\`\\x20([^\\[\\n]*)'),
		tg_opts: new RegExp ('(M|P)\\x20\\`\\`\\x20([^\\n]{0,})', 'g'),
		pick_ex: new RegExp ('(M|P)\\x20\\`\\`\\x20(\\[.+?\\]|\\{.+?\\})'),
		pick_nx: new RegExp ('(M|P)\\x20\\`\\`\\x20(.*?)\\[(.+?)\\][\\x20]*?\\{([^\\{]+?)\\}'),
		pick_pv: new RegExp ('(M|P)\\x20\\`\\`\\x20(.*?)\\{([^\\{]+?)\\}[\\x20]*?\\[(.+?)\\]'),
		tab_exp: new RegExp ('^\\x20{8}'),
		tab_rep: new RegExp ('^\\x20{8}'),
		l1_mark: new RegExp ('8\\<'),
		l2_mark: new RegExp ('\\>8'),

		/*
		 *	performs syntax highlighting on the given code (passed as plain text),
		 *	returning the highlighted code (as HTML)
		 */

	     /* detab: function (txt) {

		  const rows = txt.split ('\n'),
			raws = new Array (),
			xtab = [

				'\x20\x20\x20\x20\x20\x20\x20\x20',
				'\x20\x20\x20\x20\x20\x20\x20',
				'\x20\x20\x20\x20\x20\x20',
				'\x20\x20\x20\x20\x20',
				'\x20\x20\x20\x20',
				'\x20\x20\x20',
				'\x20\x20',
				'\x20'

			];

		    var i, j, r, n;

			for (i in rows) {

				r = empty;
				n = 0;

				for (j in rows [i])

					switch (rows [i] [j]) {

						case '\t':

							r = r + xtab [n % 8];
							n = 0;
							break;

						default:

							r = r + rows [i] [j];
							n = n + 1;

					}

				raws.push (r);

			}

			return (raws.join ('\n'));

		}, */

		highlight: function (oldCode, no_changes, currentRow) {

			oldCode = be.string (oldCode).or (tio.getInnerText ());

		    let edge = tio.le.toString () + 'px',
			aipx = tio.cw * tio.ai,
			iipx = tio.cw * tio.ii,
			rows = oldCode.

				replace (/\&/g, '&#38;').
				replace (/\</g, '&#60;').
				replace (/\>/g, '&#62;').
				replace (/\{(\/?)(b|em|i|tt|u)\}/g, function (m, s, t) { return '<' + (s || empty) + t + '>' }),

			warin = ';position:relative;left:' + aipx.toString () + 'px',
			iarin = ';position:relative;left:' + iipx.toString () + 'px';

		    var i, raws, hold, iRow, tRow, nudg, newCode = empty;

			no_changes || (hold = be.string (tio.onchanges (oldCode.substr (tio.mb.length))).or (false));

			if (hold)

				return hold;

			tio.ot = new Array;
			tio.l1 = +0xFFFFFF;
			tio.l2 = -0xFFFFFF;
			tio.l3 = +0xFFFFFF;
			tio.l4 = -0xFFFFFF;

			if (tio.ro === true)

				for (i in raws = oldCode.split ('\n'))

					if (tio.l2 < tio.l1) {

						tio.l1_mark.exec (raws [i]) && (tio.l1 = Math.min (tio.l1, parseInt (i) + 1));
						tio.l2_mark.exec (raws [i]) && (tio.l2 = Math.max (tio.l2, parseInt (i) - 1));

					} // find first writable area (active)

					else {

						tio.l1_mark.exec (raws [i]) && (tio.l3 = Math.min (tio.l3, parseInt (i) + 1));
						tio.l2_mark.exec (raws [i]) && (tio.l4 = Math.max (tio.l4, parseInt (i) - 1));

						if (tio.l4 >= tio.l3) {

							i = tio.l1; tio.l1 = tio.l3; tio.l3 = i;
							i = tio.l2; tio.l2 = tio.l4; tio.l4 = i;
							break;

						}

					} // find first inactive area (cannot have more)

			tio.onprocess.call ()

			for (i in tio.hPatterns)

				rows = rows.replace (tio.hPatterns [i], tio.hHandlers [i] || function () { return 'MISSING HIGHLIGHT REPLACEMENT HANDLER' });

			rows = rows.split ('\n')

			for (i in rows) {

				iRow = parseInt (i);
				tRow = rows [i];

				iRow === tio.l1 - 1 && (tRow = tio.clipStart (tRow));
				iRow === tio.l2 + 1 && (tRow = tio.clipClose (tRow));
				iRow === tio.l3 - 1 && (tRow = tio.clipStart (tRow));
				iRow === tio.l4 + 1 && (tRow = tio.clipClose (tRow));

				if (iRow === currentRow) {

					newCode = newCode + '<div style="height:' + tio.ch.toString () + 'px;padding-left:' + edge + ';left:-' + edge + ';min-width:calc(100%' + blank + '+' + blank + edge + ')" id="curw">' + tRow + '\n</div>';
					continue;

				}

				nudg = empty;
				nudg = iRow < tio.l1 || tio.l2 < iRow ? nudg : warin;
				nudg = iRow < tio.l3 || tio.l4 < iRow ? nudg : iarin;

				if (tio.lr && tio.cp && iRow === tio.cp.j) {

					newCode = newCode + '<div style="height:' + tio.ch.toString () + 'px' + nudg + '" id="lrow">' + tRow + '\n</div>';
					tio.lr = false;
					continue;

				}

				newCode = newCode + '<div style="height:' + tio.ch.toString () + 'px' + nudg + '">' + tRow + '\n</div>';

			}

			nudg = tio.le + aipx;

			nudg < 0 && (tio.ovl.style.paddingLeft = 0);
			nudg < 0 && (tio.ovl.style.left = nudg.toString () + 'px');
			nudg < 0 || (tio.ovl.style.left = 0);
			nudg < 0 || (tio.ovl.style.paddingLeft = nudg.toString () + 'px');

			return (newCode + '<div style="height:100vh"></div>');

		},

		/*
		 *	returns true when the cursor - or the given line index - lays in a writable
		 *	area, either because the whole document is writable, or because it's in the
		 *	writable clip (delimited by 8< and >8 marks) of an input form
		 */

		writable: function (args) {

		  const n = be.number (args && args.lineIndex).or (tio.cp.j);

			return (tio.ro === false) || (tio.l1 <= n && n <= tio.l2) || (be.switch (args && args.or).or (false));

		},

		inactive: function (args) {

		  const n = be.number (args && args.lineIndex).or (tio.cp.j);

			return (tio.ro === false) || (tio.l3 <= n && n <= tio.l4);

		},

		/*
		 *	get or set inner text of element:
		 *	already has browser-specific hacks
		 */

		getInnerText: function (elem) {

			if (elem)

				return	typeof el.textContent === 'string' ? el.textContent :
					typeof el.innerText === 'string' ? el.innerText :
					typeof el.firstChild.nodeValue === 'string' ? el.firstChild.nodeValue :

					empty;

			return tio.it;

		},

		setInnerText: function (text, elem) {

			if (elem) {

				if (typeof elem.innerText === 'string')

					elem.innerText = text;

			   else if (typeof elem.textContent === 'string')

					elem.textContent = text;

			   else if (typeof elem.firstChild.nodeValue === 'string')

					elem.firstChild.nodeValue = text;

				return;

			}

			tio.it = text;
			tio.clc.style.height = 'calc(100vh' + blank + '+' + blank + (tio.ch * tio.it.split ('\n').length).toString () + 'px)';

		},

		/*
		 *	main page (smooth, animated) scrolling:
		 *	to an exact point or by an amount of pixels
		 */

		scrollTo: function (where, immediately) {

			if (immediately) {

				ModalTimeout.clr ({ id: 'pag(a)', as_we: delete (Dom.by_id.pag) });
				tio.pt = tio.pag.scrollTop = where;
				return tio;

			}

			Dom.animate ({

				elementId:     'pag',
				property:      'scrollTop',
				default:	tio.pt,
				toValue:	tio.pt = where,
				accept: 	1,
				ratio:	       .25,
				oncompletion:	function () { tio.pt = be.number (tio.pag.scrollTop).or (0) }

			});

			return tio;

		},

		scrollBy: function (d) {

			return tio.scrollTo (tio.pt + d);

		},

		/*
		 *	find cursor position index during horizontal cursor movements:
		 *	it takes the i (horiziontal index) parameter to mean the i-th
		 *	character on the j-th line, disregarding hard tabs on the j-th
		 *	line, which is adequate to cross hard tabs (without splitting)
		 */

		findHCi: function (i, j, on) {

		  const t = defined (on) ? on + '\n' : tio.getInnerText () + '\n';

		    var p = 0,
			r = 0;

			i = i < 0 ? 0 : i;
			j = j < 0 ? 0 : j;

			while (p < t.length && j)

				j = t [p ++] === '\n' ? j - 1 : j;

			while (p < t.length && r < i && t [p] !== '\n') {

				p = p + 1;
				r = r + 1;

			}

			return Math.max (tio.pc, p === t.length ? p - 1 : p);

		},

		/*
		 *	find cursor position index across vertical cursor movements:
		 *	it takes the i (horizontal index) parameter to mean the i-th
		 *	column (based at zero) on the j-th line (also based at zero),
		 *	which is adequate to stay around the same column while moving
		 *	across lines, or because we need to get the cursor index from
		 *	an arbitrary column;row pair
		 */

		findVCi: function (i, j, trim) {

		  const s = trim ? [ '\t', '\n' ] : [ '\n' ],
			t = tio.getInnerText () + '\n';

		    var p = 0,
			r = 0;

			i = i < 0 ? 0 : i;
			j = j < 0 ? 0 : j;

			while (p < t.length && j > 0)

				j = t [p ++] === '\n' ? j - 1 : j;

			while (p < t.length && r < i && s.indexOf (t [p]) === -1)

				r = t [p ++] === '\t' ? 8 * (~~ (r / 8) + 1) : r + 1;

			return p === t.length ? p - 1 : p;

		},

		/*
		 *	create cp (cursor position) object from cursor position index (ci):
		 *	the cursor position index is the index of the character below the
		 *	text cursor, the offset in the string representing the entire text;
		 *	the cp object contains many informations, detailed below:
		 *
		 *	      - cp.c is the column index (based at zero);
		 *	      - cp.i is the in-line character index (also based at zero);
		 *	      - cp.j is the line index (again, based at zero);
		 *	      - cp.n is the position index in the text (echoes entry "ci");
		 *	      - cp.x is the page-absolute x coordinate of the cursor box;
		 *	      - cp.y is the page-absolute y coordinate of the cursor box
		 *
		 *	actually, cp.n may seem redundant, but it's involved in selections
		 *	through shifted arrow keys, which compare a couple cp objects with
		 *	each object needing its record of the cursor position index (ci)
		 */

		findCp: function (ci, on) {

		  const t = defined (on) ? on : tio.getInnerText (),
			L = t.substr (0, Math.max (ci, tio.pc)).split ('\n'),
			l = L.length,
			r = L.pop (),
			j = l - 1,
			k = l - 2,
			x = tio.l1 <= j && k <= tio.l2 ? tio.cw * tio.ai : 0;

		    var c = 0,
			i = 0;

			while (i < r.length)

				c = r [i ++] === '\t' ? 8 * (~~ (c / 8) + 1) : c + 1;

			return {

				c: c,
				i: i,
				j: j,
				n: ci,
				x: tio.cw * c + tio.le + x,
				y: tio.ch * l + tio.tt - tio.ch

			};

		},

		/*
		 *	this will create the HTML layout of the selection overlay,
		 *	placing full-block characters wherever a character is part
		 *	of the selected text (running between s1 and s2)
		 *
		 *	      - note that s2 > s1 is an acceptable condition,
		 *		while s1 === false makes both values invalid:
		 *		in other words, set s1 non-false only if the
		 *		other extreme (s2) is consistent;
		 *
		 *	      - the function was optimized to keep a chache of
		 *		the line index where selected text begins (sj),
		 *		and the dynamics of their updates implies that
		 *
		 *		      - when the cursor selects to the left or
		 *			to the right (staying on the same line),
		 *			or strictly travelling downwards (e.g.
		 *			Shift+Down, Shift+PgDn), sj is left to
		 *			its cached value;
		 *
		 *		      - when the cursor selects upwards by one
		 *			or more lines (e.g. Shift+Up, Shift+PgUp),
		 *			sj is set to a minimum between its actual
		 *			value and the FUTURE line index, guessed
		 *			after the move (it can be guessed easily)
		 *
		 *		optimization prevents this function from scanning
		 *		the *entire* text in order to find the column and
		 *		line indices corresponding to position s1
		 */

		updateSelection: function (on) {

		    var t, r, x, s, e, c, i, j, d;

			if (tio.s1 === false) {

				tio.setInnerText (empty, tio.ovl);
				return tio;

			}

			t = defined (on) ? on : tio.getInnerText ();
			r = empty;
			x = String.fromCharCode (0x2212);
			y = String.fromCharCode (0x2020);
			z = String.fromCharCode (0x2588);
			s = Math.min (tio.s1, tio.s2);
			e = Math.max (tio.s1, tio.s2);
			c = 0;
			i = 0;
			j = 0;

			if (tio.sj > 0) {

				j = tio.sj;
				r = new Array (j + 1).join ('\n');
				i = t.split ('\n').slice (0, j).join ('\n').length + 1;

			}

			while (i < s)

				switch (t.charCodeAt (i ++)) {

					case 9:

						c = 8 * (~~ (c / 8) + 1);
						r = r + t [i - 1];
						break;

					case 10:

						c = 0;
						j = j + 1;
						r = r + t [i - 1];
						break;

					default:

						c += 1;
						r += blank;

				}

			while (i < e)

				switch (t.charCodeAt (i ++)) {

					case 9:

						d = c;
						c = 8 * (~~ (c / 8) + 1);
						r = r + '<b>' + new Array (c - d + 1).join (x) + '</b>';
						break;

					case 10:

						c = 0;
						r = r + '<b>' + y + '</b>' + t [i - 1];
						break;

					default:

						c += 1;
						r += z;

				}

			tio.sj = j;
			tio.ovl.innerHTML = r;

		},

		/*
		 *	gets the content of the selected text area,
		 *	i.e. the substring going from s1 to s2 (or vice-versa)
		 */

		getSelection: function () {

		    var s, e;

			if (tio.s1 === false || tio.s1 === tio.s2)

				return empty;

			s = Math.min (tio.s1, tio.s2);
			e = Math.max (tio.s1, tio.s2);

			return tio.getInnerText ().substr (s, e - s);

		},

		/*
		 *	shows or hides our (custom, TIO interface) text cursor,
		 *	and/or toggles cursor blinking: the two states are kept
		 *	by TIO flags, and may change independently, i.e. we can
		 *	have a known state of blinking, and at the same time we
		 *	can have the cursor hidden or in show, without altering
		 *	the known blinking state; the given "state" argument is
		 *	either passed as an argument or as the function's bound
		 *	object (this) in timeout-scheduled calls, e.g.
		 *
		 *		tio.setCursorState ({ blink: true })
		 *		tio.setCursorState.bind ({ state: 'show' })
		 */

		setCursorState: function (state) {

		    let actual = tio.cs === true ? 'show' : 'hide'				// get current, literal state
		    let target = state || be.object (this).or ({})				// get required, target state

			tio.bs = be.switch (target.blink).or (tio.bs)				// update blinking state, if given

			switch (be.string (target.state).or (actual)) {

				case 'show':

					tio.cur.style.opacity = 1				// make the cursor visible
					tio.cs = true						// update our cursor state

					break							// proceed to visibly update the blinking

				case 'hide':

					tio.cur.classList.remove ('blinking')			// stop blinking (which animates opacity)
					tio.cur.style.opacity = 0				// make the cursor completely transparent
					tio.cs = false						// update our cursor state

					return tio						// return now (bypassing blinking update)

			}

			tio.bs && tio.cur.classList.add ('blinking')				// if blinking, add this class
			tio.bs || tio.cur.classList.remove ('blinking') 			// if not blinking, remove that class

			return tio

		},

		/*
		 *	scroll main page enough to bring the text cursor in sight:
		 *	the "immediately" flag skips the vertical animation, which
		 *	is, for instance, fine to bring search-and-replace matches
		 *	into view before the prompt box would pause the animation;
		 *	horizontal scrolling isn't animated (it isn't "smooth") as
		 *	all the associated bouncing could be more a hindrance than
		 *	a useful thing (we humans follow horizontal movements more
		 *	efficiently than vertical ones anyway)
		 */

		scrollToCursor: function (immediately) {

			/*
			 *	the following internal function arranges the top or left edge
			 *	of a scrollable area basing on the actual edge coordinate and
			 *	the position of a "probe" (which is the cursor), making it so
			 *	the "probe" will be in sight; the probe is adimensional, i.e.
			 *	it's a dot, it has no associated width or height, but margins
			 *	can be added to account for its physical dimensions (which we
			 *	exaggerate on the "high" end because we want the scrolling to
			 *	allow some "look ahead")
			 */

		  const offset = function (args) {

				if (args.probeOffset - args.lowMargin < args.currentOffset)
					return Math.max (0, args.probeOffset - args.lowMargin);

				if (args.probeOffset + args.highMargin > args.visibleDimension)
					return Math.max (args.currentOffset, args.probeOffset + args.highMargin - args.visibleDimension);

				return args.currentOffset;

			},

			/*
			 *	compute left-side offset,
			 *	which will replace entry "pl"
			 */

			offsetLeft = offset ({

				visibleDimension:	tio.cw * tio.nc,
				currentOffset:		tio.pl - tio.le,
				probeOffset:		tio.cw - tio.le + tio.cp.x,
				lowMargin:		tio.cw * (tio.writable () ? tio.pb : tio.nc - 4),
				highMargin:		tio.cw

			}),

			/*
			 *	compute top-side offset,
			 *	which replaces "pt" as soon as vertical scrolling occurs
			 */

			offsetTop = offset ({

				visibleDimension:	window.innerHeight - tio.vp (),
				currentOffset:		tio.pt,
				probeOffset:		tio.cp.y,
				lowMargin:		tio.ch,
				highMargin:		tio.ch * 4

			});

			/*
			 *	place cursor at its left-edge-relative position
			 */

			tio.cur.style.left = tio.cp.x.toString () + 'px';

			/*
			 *	move every element representing or connecting to text,
			 *	to the left as the cursor moves further right
			 */

			tio.noLineOverflow || (tio.pl = Math.max (0, tio.cw * Math.floor (offsetLeft / tio.cw)))
			tio.noLineOverflow || (tio.pl = tio.pag.scrollLeft = tio.pl > 0 ? tio.le + tio.pl : 0)

			/*
			 *	initiate vertical animation,
			 *	or jump straight on target if "immediately" is true
			 */

			return tio.scrollTo (offsetTop, immediately);

		},

		/*
		 *	visually positions the cursor at position described by the cp object:
		 *	will scroll enough to bring the cursor in sight, other than changing
		 *	the cursor box's position (and also that of the thin "column marker")
		 *
		 *	      - the extra cp object, cq, determines an update to the extent
		 *		of the selected text, such that selected text runs from the
		 *		entry or "recorded" cp, to the position described by cq; if
		 *		some text is currently selected but cq isn't defined, it'll
		 *		clear the existing selection (happens after releasing shift,
		 *		to then move the cursor)
		 */

		positionCursor: function (cp, cq) {

			if (defined (cq)) {

				tio.s1 = tio.s1 === false ? cp.n : tio.s1
				tio.s2 = cq.n
				tio.cp = cq
				tio.updateSelection ()

			}

			else

				if (tio.s1 !== false) {

					tio.s1 = false
					tio.sj = 0
					tio.updateSelection ()

				}

			tio.cur.style.left = tio.cp.x.toString () + 'px'
			tio.cur.style.top = tio.cp.y.toString () + 'px'
			tio.oncsrmove ()

			/*
			 *	the following withholds my cursor from blinking while it's actually
			 *	moving (assuming you'd notice the said fact that it's moving, d'oh)
			 *	but the straightforward solution triggers a page-wide D.O.M repaint
			 *	upon "reanimating" the cursor after 0.5 seconds; changing the state
			 *	of that animation (animationPlayState) would not, but would keep it
			 *	hidden when it's caught in an "off" state; so, toggling a different
			 *	element for the cursor seems best, so far
			 */

		     // ModalTimeout.clr ({ id: 'tio.reanimator', whereas: tio.cur.style.animationName = 'none' })
		     // ModalTimeout.set ({ id: 'tio.reanimator', handler: function () { tio.cur.style.animationName = 'cursor' }, msecs: 500 })

			ModalTimeout.clr ({ id: 'tio.reanimator', whereas: tio.setCursorState.call ({ blink: false }) })
			ModalTimeout.set ({ id: 'tio.reanimator', handler: tio.setCursorState.bind ({ blink: true }), msecs: 500 })

			return be.switch (this.hold).or (false) || tio.scrollToCursor (), tio

		},

		/*
		 *	generic "text change" handler: this is given an updated version (to) of the
		 *	editor's text content
		 */

		registerChange: function (to, no_changes) {

			tio.txt.innerHTML = tio.highlight (defined (to) ? to : tio.getInnerText (), no_changes || false, tio.rr && tio.rr.link && tio.rr.line);
			return tio;

		},

		/*
		 *	record an "undo" operation:
		 *	because undo is generally on Ctrl-Z, it's being called a "zRecord":
		 *	stores text content of the editor prior to some pending change (t1),
		 *	the cursor position index and selected text extremes (again, before
		 *	the change); it stores upto 100 records, then begins forgetting the
		 *	earlier ones... may be optimized so it doesn't store the whole text
		 *	for most trivial operations, allowing for a more generous number of
		 *	records, but I'll leave that to the future
		 */

		zRecord: function (t1) {

			if (tio.pm)

				return tio;

			tio.zr.push ({

				t1: defined (t1) ? t1 : tio.getInnerText (),
				ci: tio.ci,
				s1: tio.s1,
				s2: tio.s2

			});

			return tio.zr = tio.zr.slice (- 100), tio;

		},

		/*
		 *	replaces the selection with replacement string R, then clears the
		 *	selected area (de-selects) unless the "dontDiscard" flag is given
		 *	true: the latter occurs when indenting or un-indenting a selected
		 *	block of text, i.e. when you select one or more lines to then hit
		 *	tab or shift+tab, since the operation may be repeated at choice
		 *
		 *	      - the "cheap" flag, when true, prevents this function from
		 *		performing a plethora or tasks, namely: recording a undo
		 *		record, repositioning the cursor, masking changes to set
		 *		up the highlight timers; this would greatly speed up the
		 *		operation, as appropriate while this function is invoked
		 *		during multiple search-and-replace jobs; when "cheap" is
		 *		on, a selection is never discarded and the "dontDiscard"
		 *		flag is ignored
		 */

		replaceSelection: function (R, cheap, dontDiscard) {

		    var s, e, t, l, r, n;

			if (tio.s1 === false || tio.s1 === tio.s2)

				return tio;

			s = Math.min (tio.s1, tio.s2);
			e = Math.max (tio.s1, tio.s2);
			t = tio.getInnerText ();
			l = t.substr (0, s);
			r = t.substr (e);
			n = l + (tio.kl === 0 ? R : R.toUpperCase ()) + r;

			tio.setInnerText (n);

			if (cheap)

				return tio;

			tio.zRecord (t);
			tio.positionCursor (tio.cp = tio.findCp (tio.ci = l.length + R.length, n));
			tio.registerChange (n);

			if (dontDiscard) {

				/*
				 *	the "dontDiscard" request actually REBUILDS
				 *	the selection, which was cleared by calling
				 *	positionCursor with the single "cp" object,
				 *	but after the replacement, the selection is
				 *	in need of an update anyway...
				 */

				tio.s1 = l.length;
				tio.s2 = tio.s1 + R.length;
				tio.updateSelection (n);

			}

			return tio;

		},

		/*
		 *	checks whether the cursor is currently inside a one-line field of
		 *	input, which is true where what precedes the cursor's position on
		 *	the current line includes the tag "DATA...", followed by at least
		 *	a whitespace character, a legit field name and the start-of-field
		 *	marker (which is the backquote);
		 *
		 *	      - later, expanded to "sense" LINK tags too, such that Enter
		 *		can be used to follow the link: after the change, returns
		 *		an object with three flags (any = any one between DATA or
		 *		LINK is detected on the cursor's line, data = DATA field,
		 *		link = LINK field);
		 *
		 *	      - also passes the current cursor's line to callers, because
		 *		they will otherwise repeat the potentially time-consuming
		 *		process of isolating that line: this occurs independently
		 *		from the fact that a match was found
		 */

		lineField: function () {

		  const l = tio.getInnerText ().split ('\n') [tio.cp.j] || empty,
			f = tio.tg_data.test (l),
			g = tio.tg_link.test (l),
			h = tio.pick_ex.test (l);

			return {

				 any: f || g || h,
				data: f,
				link: g,
				pick: h,
				line: l,
				edge: f ? tio.tg_data.exec (l) [0].length : g ? tio.tg_link.exec (l) [0].length : h ? tio.pick_ex.exec (l) [0].length : 0

			};

		},

		/*
		 *	brings the cursor to the beginning of the next DATA field or LINK
		 *	tag; if no such things are found past the cursor's position, will
		 *	try and bring the cursor back to the first occurrence of one such
		 *	field or tag; if nothing is found at all, leaves the cursor where
		 *	it is...
		 */

		nextField: function (picking) {

		  const optionLength = function (m) {

			    let delta = 0

				switch (m [1]) {

					case 'M':

						return m [0].length - 3;

					case 'P':

						m [2].indexOf (arrow) == -1 && (delta = 1)
						m [2].indexOf (arrow) == -1 || (delta = 3)

				}

				return m [0].replace (/\~.*?\}/g, '}').length + delta;

			};

		  const select = function (p) {

				tio.positionCursor (tio.cp = p);
				return tio;

			};

		  const t = tio.getInnerText ();

		    var s = t.substr (tio.ci),
			m = tio.tg_data.exec (s),
			n = tio.tg_link.exec (s),
			p = tio.tg_pick.exec (s),
			q = 0,
			i = tio.ci;

			m === null || (++ q);
			n === null || (++ q);
			p === null || (++ q);

			m === null || (m.type = 'data');
			n === null || (n.type = 'link');
			p === null || (p.type = 'pick');

			tio.lk = empty;
			tio.ca === null || tio.setInnerText (tio.ca, tio.ca = null);

			if (q === 0) {

				s = t.substr (0, tio.ci);
				m = tio.tg_data.exec (s);
				n = tio.tg_link.exec (s);
				p = tio.tg_pick.exec (s);
				i = 0;

				m === null || (++ q);
				n === null || (++ q);
				p === null || (++ q);

				m === null || (m.type = 'data');
				n === null || (n.type = 'link');
				p === null || (p.type = 'pick');

				if (q === 0)

					return (tio.l1 === 0xFFFFFF ? tio : select (tio.findCp (tio.ci = tio.findVCi (tio.bi, tio.l1))));

			}

			new Array (m, n, p).forEach (function (c) { (c ? c.index : this) >= (m ? m.index : this) || (m = c) }, 0x7FFFFFFF);

			if (picking && picking.picking)

				return select (tio.findCp (tio.ci = i + m.index + optionLength (m), t));

			switch (m.type) {

				case 'link':

					m.endOf = 5;
					break;

				default:

					m.endOf = optionLength (m);
					break;

			}

			p = tio.findCp (tio.ci = i + m.index + m.endOf, t);

			if (tio.l1 === 0xFFFFFF)			// a clip area does not exist so select the next field, if there's one

				return select (p);

			if (p.j > tio.l1 && tio.cp.j < tio.l1)		// a clip area exists and the cursor crossed over that area's top line

				return select (tio.findCp (tio.ci = tio.findVCi (tio.bi, tio.l1)));

			if (p.j < tio.cp.j && p.j > tio.l1)		// a clip area exists and the cursor moved back to a field beyond that

				return select (tio.findCp (tio.ci = tio.findVCi (tio.bi, tio.l1)));

			if (p.j < tio.cp.j && tio.cp.j < tio.l1)	// a clip area exists and the cursor moved back to a field before that

				return select (tio.findCp (tio.ci = tio.findVCi (tio.bi, tio.l1)));

			if (p.j === tio.cp.j)				// a clip area exists and the cursor wouldn't move to any other fields

				return select (tio.findCp (tio.ci = tio.findVCi (tio.bi, tio.l1)));

			return select (p);

		},

		/*
		 *	returns the string that follows a LINK tag which is assumed to be
		 *	found on the cursor's line (in consequence of a previous check by
		 *	the lineField function above): upon hitting Enter, TIO would pass
		 *	the linkedUri return value as the parameter to the handler set as
		 *	tio.onlinkrun
		 */

		linkedUri: function (j) {

		  const l = tio.getInnerText ().split ('\n') [j || tio.cp.j] || (empty),
			m = tio.tg_link.exec (l), t = be.string (m && m [1]).or (empty);

			return {

				tag: (t),
				uri: (t === 'N' ? 'SYS/' : empty) + be.string (m && m [2]).or ('(error)')

			};

		},

		/*
		 *	generic string "insert at cursor position / replace selection":
		 *	this responds to keyboard event handlers, so it gets its argument
		 *	bound as the "this" object; in turn, the "this" object contains a
		 *	given "key" string (to be inserted) along with a "cheap" flag, to
		 *	determine whether the request comes from a regular call (where it
		 *	is not given, or given false) or from calls embedded in a higher-
		 *	order task (currently, while running findReplace)
		 */

		putKey: function () {

		    var k, t, l, r, n, h, f = false;

			if (tio.getSelection ().length) {

				tio.replaceSelection (tio.lk = this.key, this.cheap || false);
				return tio;

			}

			if (be.switch (this.typed).or (false) === false) {

				if (tio.TT)

					return tio.stopTyping ();

				if (tio.writable () === false)

					if ((f = tio.tg_data.test (tio.getInnerText ().substr (0, tio.ci).split ('\n') [tio.cp.j] || empty)) === false)

						return tio;

				tio.lk = this.key;

			}

			k = tio.kl === 0 ? this.key : this.key.toUpperCase ();
			t = tio.getInnerText ();

			if (tio.noLineOverflow === false || k === nline) {

				l = t.substr (0, tio.ci)
				r = t.substr (tio.ci)
				n = l + k + r

			}

			else {

				h = t.split (nline)
				r = h [tio.cp.j] || empty
				n = h.slice (0, tio.cp.j)
				l = r.substr (0, Math.max (0, tio.ci - (n.length ? n.join (nline).length + 1 : 0)))
				r = r.substr (tio.cp.i)
				r = l + k + r
				l = Math.max (0, r.length - tio.nc)
				r = r.substr (0, tio.nc)
				n = n.concat ([ r ]).concat (h.slice (tio.cp.j + 1)).join (nline)
				this.key = this.key.substr (0, this.key.length - l)

			}

			tio.setInnerText (n);

			if (be.switch (this.loner).or (false) !== false) {

				if ($('lrow') && tio.cp) {

				    let lrow = $('lrow').innerHTML;
				    let ltag = lrow.indexOf ('</');

					if (tio.cp.i === lrow.length - 1 && ltag === -1) {

						ModalTimeout.set ({

							id: 'tio.loner',
							handler: tio.update,
							msecs: 999,
							cos_we_only_do: $('lrow').innerHTML = lrow.substr (0, tio.cp.i) + this.key + '\n'

						})

						this.typed || tio.zRecord (t);
						tio.positionCursor.call ({ hold: this.typed || false }, tio.cp = tio.findCp (tio.ci = tio.ci + this.key.length, n));
						return tio.onchanges (n.substr (tio.mb.length)), tio;

					}

				}

				tio.lr = true;

			}

			ModalTimeout.clr ({ id: 'tio.loner' })

			if (be.switch (this.ghost).or (false) !== false) {

				this.typed || tio.zRecord (t);
				tio.cp = tio.findCp (tio.ci = tio.ci + this.key.length, n);
				return tio.registerChange (n, this.typed || false);

			}

			if (be.switch (this.cheap).or (false) === false) {

				this.typed || tio.zRecord (t);
				tio.positionCursor.call ({ hold: this.typed || false }, tio.cp = tio.findCp (tio.ci = tio.ci + this.key.length, n));
				tio.registerChange (n, this.typed || false);

			}

			if (be.switch (this.typed).or (false) === false)

				if (f = f && tio.ac [tio.cp.j]) {

					r = n.split ('\n');
					l = r [tio.cp.j] || empty;
					h = l.match (new RegExp ('\\b(?:DATA|\\d{4})\\x20\\`\\`[\\x20\\t]+.+\\x60[\\x20\\t](.+)'));

					switch (h) {

						case null:

							break;

						default:

							h = h [1];

							for (t in f)

								if (f [t].substr (0, h.length) === h) {

									k = f [t];

									r [tio.cp.j] = l.replace (

										new RegExp ('\\b(DATA|\\d{4})\\x20\\`\\`([\\x20\\t]+)(.+\\x60[\\x20\\t])(.+)'),
										function (m, s, t, u) { return s + blank + '``' + t + u + k }

									);

									return tio.registerChange (tio.ca = r.join ('\n'));

								}

					}

					tio.ca = null;

				}

			return tio;

		},

		/*
		 *	reacts to "Enter": obviously inserts a newline code (\n) at cursor
		 *	position; less obviously, will process the current cursor line, to
		 *	extract a number of initial whitespaces (blanks or tabs) such that
		 *	the pattern can be repeated on the next line: this special feature
		 *	often goes under the name of "smart tabs", and spares a programmer
		 *	from having to re-indent a new line to reach the same indent level
		 *	of the previous line (which is a frequent circumstance)
		 */

		enter: function () {

		  const f = tio.lineField ();

			if (tio.onconfirm (f) === false) {

				tio.ca === null || tio.setInnerText (tio.ca, tio.ca = null);
				return tio;

			} // if the onconfirm handler wanted to prevent default behavior

			if (f.data) {

				tio.ca === null || tio.setInnerText (tio.ca, tio.ca = null);
				tio.nextField ();
				return tio;

			} // if we're in a DATA line: on Enter, go to the next form field

			if (f.link) {

				tio.ca === null || tio.setInnerText (tio.ca, tio.ca = null);
				tio.onlinkrun.call ({ caller: tio.cp.j }, tio.linkedUri ());
				return tio;

			} // if we're in a LINK line: on Enter, run the links' handler

			if (f.pick) {

				tio.ca === null || tio.setInnerText (tio.ca, tio.ca = null);
				tio.onpickrun ({ label: f.line.match (/\[(.+)\]/).pop () });
				return tio;

			} // if we're on an executable PICK, run the highlighted option

		  const s = f.line.match (/^\s+/);

			tio.ca = null;
			tio.cm || (tio.putKey.call ({ key: '\n' + (s === null ? empty : s.join (empty)) }))
			tio.cm && (tio.ci >= tio.it.length && tio.putKey.call ({ key: '\n' }))
			tio.cm && (tio.ci >= tio.it.length || tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findVCi (0, tio.cp.j + 1))))
			tio.lk = empty;
			tio.oncommand ();

			return tio;

		},

		/*
		 *	trivially reacts to Ctrl+Insert (or its tiresome equivalent Ctrl+V),
		 *	pasting whatever is in the non-empty "cl" (clip) string
		 *
		 *	      - using the system clipboard might be off-limits in javascript,
		 *		but if you know otherwise (and cross-browser), let us know...
		 */

		pasteClip: function () {

			if (tio.cl.length)

				tio.putKey.call ({ key: tio.cl });

		},

		/*
		 *	reacts to backspace: deletes the selected text, if any, otherwise
		 *	deletes the character before the cursor, moving the cursor 1 char
		 *	to the left (unless at beginning of text, i.e. as ci === 0)
		 */

		backspace: function () {

		    var t, l, r, n, h;

			tio.ca = null;
			tio.lk = empty;

			if (tio.getSelection ().length)

				return tio.replaceSelection (empty);

			if (tio.ci === 0 || tio.ci === tio.pc || this === false)

				return tio;

			t = tio.getInnerText ();

			switch (t [tio.ci - 1]) {

				case blank:

					if (t [tio.ci - 2] === '`')

						return tio;

				default:

					l = t.substr (0, tio.ci - 1);
					r = t.substr (tio.ci);
					n = l + r;
					h = tio.cp.j;

					tio.zRecord (t);
					tio.setInnerText (n);
					tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.ci - 1, n));
					tio.registerChange (n);

			}

			return tio;

		},

		/*
		 *	reacts to the delete key: deletes selected text, if any, otherwise
		 *	deletes the character at the cursor's position (under the cursor)
		 */

		deleteKey: function () {

		    var t, l, r, n;

			tio.ca = null;
			tio.lk = empty;

			if (tio.getSelection ().length) {

				tio.replaceSelection (empty);
				return tio;

			}

			t = tio.getInnerText ();

			if (tio.pm && t [tio.ci] === '\n')

				return tio;

			l = t.substr (0, tio.ci);
			r = t.substr (tio.ci + 1);
			n = l + r;

			tio.zRecord (t);
			tio.setInnerText (n);
			tio.registerChange (n);

			return tio;

		},

		/*
		 *	increases the indent level of all selected lines:
		 *	called by the tab key handler when the selection isn't empty
		 */

		increaseIndent: function () {

		  const t = tio.getSelection (),
			l = t.split ('\n');

		    var i = 0;

			while (i < l.length - 1)

				l [i] = '\t' + l [i ++];

			return tio.replaceSelection (l.join ('\n'), false, true);

		},

		/*
		 *	process tabulation:
		 *	as detailed by further comments below, "Tab" is multi-functional
		 */

		tab: function () {

			if (tio.TT) {

				tio.stopTyping ();
				return tio;

			} // if typing animation running, stop the animation but ignore this keystroke

			if (tio.lineField ().any) {

				tio.nextField ();
				return tio;

			} // if there's a DATA or LINK tag on this line, go to next tag's line

			if (tio.getSelection ().length) {

				tio.increaseIndent ();
				return;

			} // if there's a selection, raise the selection's indent level

			return tio.putKey.call ({ key: '\t' });

		},

		/*
		 *	if Shift+Tab is pressed while the selection isn't empty, this does the
		 *	opposite of the previous function (decreases the indent level of every
		 *	selected line)
		 *
		 *	      - in theory, we may want to also associate Shift+Tab to backward
		 *		movement between form fields, but that's rarely used and would
		 *		need one more dedicated function: I'd pass and keep the editor
		 *		simpler, for the moment...
		 */

		shiftTab: function () {

		  const T = tio.getSelection (),
			L = T.split ('\n');

		    var n = L.length - 1,
			i = 0,
			l;

			while (i < n) {

				l = L [i].replace (/\t/g, tio.tx);
				tio.tab_exp.test (l) && (l = l.substr (tio.tx.length));
				L [i ++] = l.replace (tio.tab_rep, '\t');

			}

			n && tio.replaceSelection (L.join ('\n'), false, true);

		},

		/*
		 *	reacts to Ctrl+Z (or to the "undo" icon):
		 *	goes back 1 step in the undo history, restoring text and selection
		 */

		undo: function () {

		  const r = tio.pm || tio.zr.pop ();

			if (r === true)

				return tio;

			if (undefed (r))

				return tio;

			tio.setInnerText (r.t1);
			tio.txt.innerHTML = tio.highlight (r.t1);
			tio.positionCursor (tio.cp = tio.findCp (tio.ci = r.ci));
			tio.s1 = r.s1;
			tio.s2 = r.s2;
			tio.sj = 0;
			tio.updateSelection (r.t1);

			return tio;

		},

		/*
		 *	gets out of prompt mode, if that was the case:
		 *	called before implementing a different prompt or upon leaving the document
		 */

		quitPrompt: function () {

			if (tio.pm === false)

				return tio;

			Shortcut.remove ('enter');
			Shortcut.remove ('escape');
			Shortcut.add ('enter', tio.enter, { workInInput: tio.confirmInInput });

			tio.pc = 0;
			tio.pm = false;
			tio.undo ();

			return tio;

		},

		/*
		 *	enters prompt mode, replacing the current line with the given question
		 *	and the "fill" string, which represents the default content
		 */

		lPrompt: function (question, fill, callBack) {

			tio.quitPrompt ();

			/*
			 *	record the editor state,
			 *	before any prompt-related changes are made
			 */

			tio.zRecord ();

			/*
			 *	clear selection,
			 *	if any
			 */

			tio.s1 = false;
			tio.sj = 0;
			tio.updateSelection ();

			/*
			 *	script an "End" key followed by "Shift+Home", that is,
			 *	select whole line, leaving cursor at beginning of line
			 */

			tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findHCi (0xFFFFFF, tio.cp.j)));
			tio.positionCursor (tio.cp, tio.cp = tio.findCp (tio.ci = tio.findHCi (0x00, tio.cp.j)));

			/*
			 *	set pc to restrict cursor movements to prompt's field,
			 *	set prompt mode flag, and clear plaintext map
			 *
			 *	      - pc works to limit the horizontal movement such that it
			 *		would never allow the cursor before the prompt's "base
			 *		character"; the rest of your cursor's "confinement" is
			 *		a result of "deleteKey" refusing to delete this line's
			 *		final "newline" code, and all of the vertical handlers
			 *		refusing to perform their regular jobs, among which:
			 *
			 *		      - up, down, shift+up, shift+down,
			 *		      - page up, page down,
			 *		      - ctrl home, ctrl end,
			 *		      - the mouse click handler (clc.onclick)
			 */

			tio.pc = tio.ci + question.length + 3;
			tio.pm = true;

			/*
			 *	display the prompt's question,
			 *	i.e. replace the selection
			 */

			tio.putKey.call ({ key: '\t' + question + ':' + blank + fill });

			/*
			 *	reroute the "Enter" key to confirm the prompt,
			 *	i.e. quit the prompt and execute the callBack
			 */

			Shortcut.remove ('enter');
			Shortcut.add ('enter', function () {

			  const L = tio.getInnerText ().split ('\n') [tio.cp.j];

				tio.quitPrompt ();
				callBack (L.substr (question.length + 3));

			}, { workInInput: tio.confirmInInput });

			/*
			 *	reroute the "Esc" key to quit the prompt,
			 *	thereby canceling the operation
			 */

			Shortcut.remove ('escape');
			Shortcut.add ('escape', tio.quitPrompt);

			return tio;

		},

		/*
		 *	finds the first occurrence of the user-given string, at or beyond the cursor's
		 *	actual position (ci); if bound to an object containing a (true) "prompt" flag,
		 *	or if no search string was specified yet, it will prompt for the search string
		 */

		findNext: function () {

			if (tio.ss.length === 0)

				return false;

			if ((tio.sm = tio.getInnerText ().substr (tio.ci).indexOf (tio.ss)) === -1)

				return false;

			tio.positionCursor (tio.cp = tio.findCp (tio.ci += tio.sm + tio.ss.length));
			tio.s1 = tio.ci - tio.ss.length;
			tio.s2 = tio.ci;
			tio.sj = 0;
			tio.updateSelection ();

			return true;

		},

		findString: function () {

			if (this.prompt || tio.ss.length === 0) {

				tio.lPrompt ('FIND', tio.ss, function (toFind) {

					tio.ss = toFind;

					if (tio.ss.length > 0)

						tio.findNext ();

				});

				return false;

			}

			return tio.findNext ();

		},

		/*
		 *	prompts for the search and a replacement string, and replaces every single
		 *	occurrence of the search string with the replacement, always starting from
		 *	the top (first line, first character) and either running through the whole
		 *	text or, if a selection is active, through the active selection
		 */

		findReplace: function () {

		    var s_ = tio.s1 === false ? 0x00000000 : Math.min (tio.s1, tio.s2),
			l_ = tio.s1 === false ? 0x7FFFFFFF : Math.max (tio.s1, tio.s2);

			tio.lPrompt ('FIND', tio.ss, function (toFind) {

				tio.ss = toFind;

				if (tio.ss.length === 0)

					return;

				tio.lPrompt ('REPLACE WITH', tio.rs, function (replacement) {

				    var nm = 0;

					tio.rs = replacement;

					tio.zRecord (tio.getInnerText ());

					while ((tio.sm = tio.getInnerText ().substr (s_).indexOf (tio.ss)) > -1 && tio.sm + s_ + tio.ss.length <= l_) {

						tio.s1 = tio.sm + s_;					// set start of selection to match + start offset
						tio.s2 = tio.s1 + tio.ss.length;			// set end of selection to s1 + <length of match>
						nm = nm + 1;						// increment match counter (which is informative)
						s_ = tio.s1 + tio.rs.length;				// advance start offset beyond match for next run
						l_ = l_ + tio.rs.length - tio.ss.length;		// adjust limit to account for length differences
						tio.putKey.call ({ key: tio.rs, cheap: true }); 	// will replace selection with replacement string

					}

					if (nm === 0)

						return;

					tio.s1 = false;
					tio.sj = 0;
					tio.updateSelection ();

					tio.txt.innerHTML = tio.highlight (s_ = tio.getInnerText ());

				});

			});

			return tio;

		},

		/*
		 *	window resize handler
		 */

		onresize: function () {

			clearTimeout (tio.rt, tio.rt = null);

			tio.ww = tio.wwp.offsetLeft || tio.ww;
			tio.re = tio.ww + tio.rx;

			tio.cw = Math.floor (tio.re / tio.nc);
			tio.ch = Math.floor (tio.lh * tio.cw);

			tio.txt.style.fontSize =
			tio.ovl.style.fontSize =
			tio.clc.style.fontSize =

				(2 * tio.cw).toString () + 'px';

			tio.pag.style.minHeight =
			tio.txt.style.lineHeight =
			tio.ovl.style.lineHeight =
			tio.clc.style.lineHeight =
			tio.clc.style.paddingBottom =

				(tio.ch).toString () + 'px';

			tio.cur.style.width = tio.cw.toString () + 'px';
			tio.cur.style.height = tio.ch.toString () + 'px';

			tio.tt = Math.floor (parseFloat (getComputedStyle (tio.txt).paddingTop.split ('px').shift ()));
			tio.le = tio.lp === 'auto' ? ~~ ((tio.re - tio.cw * tio.nc) / 2) : ~~ parseFloat (getComputedStyle (tio.txt).paddingLeft.split ('px').shift ());

			if (tio.le < 0) {

				tio.txt.style.paddingLeft =
				tio.ovl.style.paddingLeft =
				tio.clc.style.paddingLeft = 0;

				tio.txt.style.left =
				tio.ovl.style.left =
				tio.clc.style.left =

					tio.le.toString () + 'px';

			}

			else {

				tio.txt.style.left =
				tio.ovl.style.left =
				tio.clc.style.left = 0;

				tio.txt.style.paddingLeft =
				tio.ovl.style.paddingLeft =
				tio.clc.style.paddingLeft =

					tio.le.toString () + 'px';

			}

			tio.txt.innerHTML = tio.highlight (tio.getInnerText (), true, tio.rr && tio.rr.link && tio.rr.line);

			tio.rt = setTimeout (function () {

				tio.cur.style.left = tio.cp.x.toString () + 'px';
				tio.cur.style.top = tio.cp.y.toString () + 'px';
				tio.clc.style.height = 'calc(100vh' + blank + '+' + blank + (tio.ch * tio.it.split ('\n').length).toString () + 'px)';
				tio.oncsrmove ();

			}, 17);

			return tio.cp = tio.findCp (tio.ci), tio;

		},

		/*
		 *	hovered link highlighter
		 */

		onmousemove: function (e) {

		  const y = e.offsetY || e.layerY, t = y - tio.tt, n = ~~ (t / tio.ch);

			if (tio.rr === null || tio.rr.line !== n) {

				tio.rr && tio.rr.link && (tio.txt.innerHTML = tio.highlight (tio.getInnerText (), true));

				tio.rr = {

					line: n,
					link: false

				};

				if (tio.rr.link = tio.tg_link.test (tio.getInnerText ().split ('\n') [n] || empty)) {

					tio.txt.innerHTML = tio.highlight (tio.getInnerText (), true, n);
					tio.rr.link = true;
					tio.stopTyping ();

				}

			}

		},

		onmouseout: function (e) {

			if (tio.rr === null)

				return;

			tio.rr.link && (tio.txt.innerHTML = tio.highlight (tio.getInnerText (), true));
			tio.rr = null;

		},

		/*
		 *	this moves the text cursor to the clicked position
		 */

		onclick: function (e) {

			e.cancelBubble = true;

		  const x = e.offsetX || e.layerX,
			y = e.offsetY || e.layerY,
			l = x - Math.max (0, tio.le),
			t = y - tio.tt;

		  const m = ~~ (l / tio.cw);
		    var n = ~~ (t / tio.ch);

			tio.ca === null || tio.setInnerText (tio.ca, tio.ca = null);
			tio.TT === null || tio.stopTyping ();

			tio.lk = empty;

			if (tio.pm === true || tio.keyboardHooked === false) {

				tio.onpgfocus (e);
				return;

			}

		  const i = tio.findVCi (m, n),
			j = tio.findVCi (0xFFFFF, n),
			r = tio.getInnerText ().substr (0, i).split ('\n') [n] || empty,
			s = tio.getInnerText ().split ('\n') [n] || empty;

			if (tio.tg_link.test (s)) {

				tio.onlinkrun.call ({ caller: n }, tio.linkedUri (n));
				return;

			}

			if (tio.TT === null) {

				if (tio.writable ({ lineIndex: n = n >= 0 ? n : 0 })) {

					tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findVCi (m - tio.ai, n)));
					tio.onwifocus (e);
					return;

				}

				if (tio.inactive ({ lineIndex: n = n >= 0 ? n : 0 })) {

					tio.cp = tio.findCp (tio.ci = tio.findVCi (m - tio.ai, n));
					tio.cp.x += tio.cw * tio.ai;
					tio.positionCursor (tio.cp);
					tio.oninfocus (e);
					return;

				}

				if (tio.tg_data.test (r)) {

					tio.positionCursor (tio.cp = tio.findCp (tio.ci = i));
					tio.onwifocus (e);
					return;

				}

				if (tio.TT === null && tio.tg_data.test (s)) {

					tio.positionCursor (tio.cp = tio.findCp (tio.ci = j));
					tio.onwifocus (e);
					return;

				}

				if (tio.l1_mark.test (s) && n - tio.l3 + 1) {

					tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findVCi (tio.bi, tio.l1)));
					tio.onwifocus (e);
					return;

				}

				if (tio.l2_mark.test (s) && n - tio.l4 - 1) {

					tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findVCi (0xFFFFFF, tio.l2)));
					tio.onwifocus (e);
					return;

				}

				tio.onpgfocus (e);

			}

		},

		pick: function (e) {

			e.cancelBubble = true;

		  const B = tio.scn.getBoundingClientRect () || null,
			X = tio.pag.scrollLeft - be.number (B && (B.x || B.left)).or (0),
			Y = tio.pag.scrollTop - be.number (B && (B.y || B.top)).or (0),
			x = e.clientX || 0,
			y = e.clientY || 0,
			l = X + x - tio.le,
			t = Y + y - tio.tt,
			m = ~~ (l / tio.cw),
			n = ~~ (t / tio.ch);

			if (t < 0 || tio.pm === true || tio.keyboardHooked === false)

				return;

		  const i = tio.findVCi (m, n) - 1,
			p = tio.findCp (i),
			w = tio.getInnerText (),
			r = w.split ('\n'),
			s = r [p.j] || empty;

			if (tio.tg_pick.test (s) === false)

				return;

		  const s1 = w.substr (0, i).match (/\{([^\{\n]*)$/),
			s2 = w.substring (i).match (/^([^\}\n]*)\}/);

			if (s1 === null || s2 === null)

				return;

		  const s3 = s1 [1] + s2 [1];

			r [p.j] = s.
				replace ('[', '{').replace (']', '}').
				replace ('{' + s3 + '}', '[' + s3 + ']');

			tio.setInnerText (r.join ('\n'));
			tio.txt.innerHTML = tio.highlight (r.join ('\n'));

		},

		/*
		 *
		 */

		keyboardHooked: false,

		/*
		 *	functions associated to each keyboard-triggered action,
		 *	aside from keystrokes that produce simple text (which'd all go through tio.putKey)
		 */

		kbFunctions: {

			// this is a closured function used by certain horizontals (Ctrl+Left, Ctrl+Right)

			wordBoundary: function (c) {

				switch (c) {

					case 9:
					case 10:
					case 32:

						return false;

				}

				return true;

			},

			// PICK tag animation

			picker: function (r, s, xp, i, j) {

			  const m = xp.exec (s);

				if (m === null)

					return;

				r [tio.cp.j] = s.
					replace ('[' + m [i] + ']', '{' + m [i] + '}').
					replace ('{' + m [j] + '}', '[' + m [j] + ']');

				tio.setInnerText (r.join ('\n'));
				tio.txt.innerHTML = tio.highlight (r.join ('\n'));
				tio.nextField ({ where: tio.cp = tio.findCp (tio.ci = tio.findHCi (0x000000, tio.cp.j)), picking: true });

			},

			// any regular keys

			key: function (e) {

				switch (e.key) {

					case '*':
					case '/':
					case '_':

						tio.putKey.call ({ key: e.key.toUpperCase () });
						return;

				}

				tio.putKey.call ({ key: e.key.toUpperCase (), loner: tio.writable () });

			},

			// horizontals

			left:		function () { tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findHCi (tio.cp.i - 1, tio.cp.j))) },
			right:		function () { tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findHCi (tio.cp.i + 1, tio.cp.j))) },
			shiftLeft:	function () { tio.positionCursor (tio.cp, tio.cp = tio.findCp (tio.ci = tio.findHCi (tio.cp.i - 1, tio.cp.j))) },
			shiftRight:	function () { tio.positionCursor (tio.cp, tio.cp = tio.findCp (tio.ci = tio.findHCi (tio.cp.i + 1, tio.cp.j))) },

			// word by word

			ctrlLeft: function (min) {

			  const t = tio.getInnerText (),
				l = t.substr (0, tio.ci);

			    var d = tio.ci - 1;

				while (d >= be.number (min).or (0) && tio.kbFunctions.wordBoundary (l.charCodeAt (d)) === false) -- d;
				while (d >= be.number (min).or (0) && tio.kbFunctions.wordBoundary (l.charCodeAt (d)) !== false) -- d;

				tio.positionCursor (tio.cp = tio.findCp (tio.ci = d + 1));

			},

			ctrlRight: function (max) {

			  const m = max && (max - tio.ci),
				t = tio.getInnerText (),
				r = t.substr (tio.ci);

			    var d = 0;

				while (d < be.number (m).or (r.length) && tio.kbFunctions.wordBoundary (r.charCodeAt (d)) === false) ++ d;
				while (d < be.number (m).or (r.length) && tio.kbFunctions.wordBoundary (r.charCodeAt (d)) !== false) ++ d;
				while (d < be.number (m).or (r.length) && tio.kbFunctions.wordBoundary (r.charCodeAt (d)) === false) ++ d;

				tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.ci + d));

			},

			// verticals

			up:		function () { tio.pm || (function () { tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findVCi (tio.cp.c, tio.cp.j - 1))) }) () },
			down:		function () { tio.pm || (function () { tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findVCi (tio.cp.c, tio.cp.j + 1))) }) () },
			shiftUp:	function () { tio.pm || (function () { tio.sj = Math.min (tio.sj, tio.cp.j - 1); tio.positionCursor (tio.cp, tio.cp = tio.findCp (tio.ci = tio.findVCi (tio.cp.c, tio.cp.j - 1))) }) () },
			shiftDown:	function () { tio.pm || (function () { tio.positionCursor (tio.cp, tio.cp = tio.findCp (tio.ci = tio.findVCi (tio.cp.c, tio.cp.j + 1))) }) () },
			pageUp: 	function () { tio.pm || (function () { tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findVCi (tio.cp.c, tio.cp.j - ~~ ((window.innerHeight - tio.vp ()) / tio.ch)))) }) () },
			pageDown:	function () { tio.pm || (function () { tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findVCi (tio.cp.c, tio.cp.j + ~~ ((window.innerHeight - tio.vp ()) / tio.ch)))) }) () },
			shiftPageUp:	function () { tio.pm || (function () { tio.sj = Math.min (tio.sj, tio.cp.j - ~~ ((window.innerHeight - tio.vp ()) / tio.ch)); tio.positionCursor (tio.cp, tio.cp = tio.findCp (tio.ci = tio.findVCi (tio.cp.c, tio.cp.j - ~~ ((window.innerHeight - tio.vp ()) / tio.ch)))) }) () },
			shiftPageDown:	function () { tio.pm || (function () { tio.positionCursor (tio.cp, tio.cp = tio.findCp (tio.ci = tio.findVCi (tio.cp.c, tio.cp.j + ~~ ((window.innerHeight - tio.vp ()) / tio.ch)))) }) () },

			// long-range

			home:		function () { tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findHCi (0x000000, tio.cp.j))) },
			end:		function () { tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findHCi (0xFFFFFF, tio.cp.j))) },
			shiftHome:	function () { tio.positionCursor (tio.cp, tio.cp = tio.findCp (tio.ci = tio.findHCi (0x000000, tio.cp.j))) },
			shiftEnd:	function () { tio.positionCursor (tio.cp, tio.cp = tio.findCp (tio.ci = tio.findHCi (0xFFFFFF, tio.cp.j))) },
			ctrlHome:	function () { tio.pm || (function () { tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findVCi (0, 0))) }) () },
			ctrlEnd:	function () { tio.pm || (function () { tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findVCi (0xFFFFFF, 0xFFFFFF))) }) () },
			selectAll:	function () { tio.pm || (function () { tio.s1 = 0; tio.s2 = tio.getInnerText ().length; tio.sj = 0; tio.updateSelection () }) () },

			// scrollers

			ctrlUp: 	function () { tio.scrollBy (- tio.ch) },
			ctrlDown:	function () { tio.scrollBy (+ tio.ch) },
			ctrlPageUp:	function () { tio.scrollBy (tio.vp () - window.innerHeight) },
			ctrlPageDown:	function () { tio.scrollBy (window.innerHeight - tio.vp ()) },

			// clipboard

			cut:		function () { tio.cl = tio.getSelection (); tio.replaceSelection (empty) },
			copy:		function () { tio.cl = tio.getSelection () },
			paste:		function () { tio.pasteClip () },

			// search, search-and-replace

			find:		function () { tio.findString.call ({ prompt: true }) },
			findNext:	function () { tio.findString.call ({ prompt: false }) },
			findAndReplace: function () { tio.findReplace () },

			// functions for read-only mode (form-like input)

			ro_ctrlHome: function () {

				tio.pm || (tio.writable () || tio.onhomings ())
				tio.pm || (tio.writable () && tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findVCi (tio.bi, tio.l1))))

			},

			ro_ctrlEnd:	function () { tio.pm || (tio.writable () && tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findVCi (0xFFFFFF, tio.l2)))) },
			ro_shiftEnd:	function () { tio.writable ({ or: tio.lineField ().data }) && tio.kbFunctions.shiftEnd.call () },
			ro_shiftRight:	function () { tio.writable ({ or: tio.lineField ().data }) && tio.kbFunctions.shiftRight.call () },

			ro_enter: function () {

				if (tio.TT)

					return tio.stopTyping ();

			  const f = tio.lineField ();

				if (tio.onconfirm (f) === false) {

					tio.ca === null || tio.setInnerText (tio.ca, tio.ca = null);
					return tio;

				} // if the onconfirm handler wanted to prevent default behavior

				(f.link || f.pick) && (tio.enter ());
				(f.link || f.pick) || (tio.writable () ? tio.enter () : tio.nextField ());

			},

			ro_space: function () {

				if (tio.TT)

					return tio.stopTyping ();

			  const f = tio.lineField ();

				(f.link || f.pick) && (tio.enter ());
				(f.link || f.pick) || (tio.writable ({ or: f.data }) ? tio.putKey.call ({ key: blank, loner: true }) : tio.nextField ());

			},

			ro_tab: function () {

				if (tio.TT)

					return tio.stopTyping ();

				tio.nextField ();

			},

			ro_left: function () {

			  const t = tio.getInnerText (), r = t.split ('\n'), s = r [tio.cp.j] || empty;

				if (tio.writable ())

					return tio.kbFunctions.left.call ();

				if (tio.tg_data.test (s))

					return t.substr (0, tio.ci).match (/\`[\x20\t]$/) === null && tio.kbFunctions.left.call ();

				if (tio.tg_pick.test (s))

					return tio.kbFunctions.picker (r, s, tio.pick_pv, 4, 3);

			},

			ro_shiftLeft: function () {

				if (tio.writable ())

					return tio.kbFunctions.shiftLeft.call ();

				if (tio.lineField ().data)

					return tio.lineField ().edge === tio.cp.i || tio.kbFunctions.shiftLeft.call ();

			},

			ro_shiftHome: function () {

				if (tio.writable ())

					return tio.positionCursor (tio.cp, tio.cp = tio.findCp (tio.ci = tio.findHCi (tio.bi, tio.cp.j)));

				if (tio.lineField ().data)

					return tio.positionCursor (tio.cp, tio.cp = tio.findCp (tio.ci = tio.findHCi (tio.lineField ().edge, tio.cp.j)));

			},

			ro_ctrlLeft: function () {

				if (tio.writable ())

					return tio.kbFunctions.ctrlLeft (tio.findVCi (0, tio.l1));

				if (tio.lineField ().data)

					return tio.kbFunctions.ctrlLeft (tio.findVCi (0, tio.cp.j) + tio.lineField ().edge);

			},

			ro_ctrlRight: function () {

				if (tio.writable ())

					return tio.kbFunctions.ctrlRight (tio.findVCi (0xFFFFFF, tio.l2));

				if (tio.lineField ().data)

					return tio.kbFunctions.ctrlRight (tio.findVCi (0xFFFFFF, tio.cp.j));

			},

			ro_right: function () {

			  const r = tio.getInnerText ().split ('\n'), s = r [tio.cp.j] || empty;

				if (tio.writable ())

					return tio.kbFunctions.right.call ();

				if (tio.tg_data.test (s))

					return tio.kbFunctions.right.call ();

				if (tio.tg_pick.test (s))

					return tio.kbFunctions.picker (r, s, tio.pick_nx, 3, 4);

			},

			ro_home: function () {

			  const r = tio.getInnerText ().substr (0, tio.ci).split ('\n') [tio.cp.j] || empty;

				if (tio.writable ())

					return tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findHCi (tio.bi, tio.cp.j)));

				if (tio.lineField ().data)

					return tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findHCi (tio.lineField ().edge, tio.cp.j)));

				return (tio.onhomings ())

			},

			ro_end: function () {

			  const t = tio.getInnerText (), r = t.substr (0, tio.ci).split ('\n') [tio.cp.j] || empty;

				if (tio.writable ())

					return tio.kbFunctions.end.call ();

				if (tio.tg_data.test (r))

					tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.ci + be.number (/\n/.exec (t.substr (tio.ci)).index).or (0)));

			},

			ro_up: function () {

				if (tio.writable () === false)

					return tio.kbFunctions.ctrlUp.call ();

				if (tio.cp.j > tio.l1)

					return tio.kbFunctions.up.call ();

				if (tio.cp.j === tio.l1)

					tio.kbFunctions.home.call ();

			},

			ro_down: function () {

				if (tio.writable () === false || tio.pm === true)

					return tio.kbFunctions.ctrlDown.call ();

				if (tio.cp.j < tio.l2)

					return tio.kbFunctions.down.call ();

				if (tio.cp.j === tio.l2)

					tio.kbFunctions.end.call ();

			},

			ro_shiftUp: function () {

				if (tio.writable () === false || tio.pm === true)

					return;

				if (tio.cp.j > tio.l1)

					return tio.kbFunctions.shiftUp.call ();

				if (tio.cp.j === tio.l1)

					tio.kbFunctions.shiftHome.call ();

			},

			ro_shiftDown: function () {

				if (tio.writable () === false || tio.pm === true)

					return;

				if (tio.cp.j < tio.l2)

					return tio.kbFunctions.shiftDown.call ();

				if (tio.cp.j === tio.l2)

					tio.kbFunctions.shiftEnd.call ();

			},

			ro_pageUp: function () {

				if (tio.writable () === false || tio.pm === true)

					return tio.kbFunctions.ctrlPageUp.call ();

				tio.cp.j = Math.max (tio.l1, tio.cp.j - ~~ ((window.innerHeight - tio.vp ()) / tio.ch));
				tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findVCi (tio.cp.c, tio.cp.j)));

			},

			ro_pageDown: function () {

				if (tio.writable () === false || tio.pm === true)

					return tio.kbFunctions.ctrlPageDown.call ();

				tio.cp.j = Math.min (tio.l2, tio.cp.j + ~~ ((window.innerHeight - tio.vp ()) / tio.ch));
				tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findVCi (tio.cp.c, tio.cp.j)));

			},

			ro_shiftPageUp: function () {

			  const j = Math.max (tio.l1, tio.cp.j - Math.floor ((window.innerHeight - tio.vp ()) / tio.ch));

				if (tio.writable () === false || tio.pm === true)

					return;

				tio.sj = Math.min (tio.sj, j);
				tio.positionCursor (tio.cp, tio.cp = tio.findCp (tio.ci = tio.findVCi (tio.cp.c, j)));

			},

			ro_shiftPageDown: function () {

			  const j = Math.min (tio.l2, tio.cp.j + Math.floor ((window.innerHeight - tio.vp ()) / tio.ch));

				if (tio.writable () === false || tio.pm === true)

					return;

				tio.positionCursor (tio.cp, tio.cp = tio.findCp (tio.ci = tio.findVCi (tio.cp.c, j)));

			},

			ro_backspace: function () {

			  const t = tio.getInnerText (), r = t.substr (0, tio.ci).split ('\n') [tio.cp.j] || empty;

				while (tio.writable ()) {

					if (tio.getSelection ().length)

						break;

					if (tio.cp.j > tio.l1 || t [tio.ci - 1] !== '\n')

						break;

					return;

				}

				if (tio.tg_data.test (r) || tio.writable ())

					tio.backspace.call (tio.writable ());

			},

			ro_delete: function () {

			  const t = tio.getInnerText (), r = t.substr (0, tio.ci).split ('\n') [tio.cp.j] || empty;

				if (tio.writable ()) {

					if (tio.getSelection ().length)

						return tio.deleteKey.call ();

					if (tio.cp.j < tio.l2 || t [tio.ci] !== '\n')

						return tio.deleteKey.call ();

				}

				if (tio.tg_data.test (r))

					t [tio.ci] === '\n' || tio.deleteKey.call ();

			},

			ro_paste: function () {

				if (tio.writable () === false || tio.pm === true)

					return;

				tio.cl.length && tio.pasteClip ()
				tio.cl.length || tio.onmtpaste ()

			}

		},

		/*
		 *	registers all keyboard shortcuts,
		 *	maps the keyboard for text input
		 */

		connectKeyboard: function (readOnly) {

			if (tio.keyboardHooked === true)

				tio.disconnectKeyboard ();

			switch (readOnly) {

				case true:

					// editor keystrokes

					Shortcut.add ('arrowleft',		tio.kbFunctions.ro_left);
					Shortcut.add ('arrowright',		tio.kbFunctions.ro_right);
					Shortcut.add ('shift+arrowleft',	tio.kbFunctions.ro_shiftLeft);
					Shortcut.add ('shift+arrowright',	tio.kbFunctions.ro_shiftRight);
					Shortcut.add ('ctrl+arrowleft', 	tio.kbFunctions.ro_ctrlLeft);
					Shortcut.add ('ctrl+arrowright',	tio.kbFunctions.ro_ctrlRight);
					Shortcut.add ('arrowup',		tio.kbFunctions.ro_up);
					Shortcut.add ('arrowdown',		tio.kbFunctions.ro_down);
					Shortcut.add ('shift+arrowup',		tio.kbFunctions.ro_shiftUp);
					Shortcut.add ('shift+arrowdown',	tio.kbFunctions.ro_shiftDown);
					Shortcut.add ('pageup', 		tio.kbFunctions.ro_pageUp);
					Shortcut.add ('shift+pageup',		tio.kbFunctions.ro_shiftPageUp);
					Shortcut.add ('pagedown',		tio.kbFunctions.ro_pageDown);
					Shortcut.add ('shift+pagedown', 	tio.kbFunctions.ro_shiftPageDown);
					Shortcut.add ('home',			tio.kbFunctions.ro_home);
					Shortcut.add ('end',			tio.kbFunctions.ro_end);
					Shortcut.add ('shift+home',		tio.kbFunctions.ro_shiftHome);
					Shortcut.add ('shift+end',		tio.kbFunctions.ro_shiftEnd);
					Shortcut.add ('ctrl+home',		tio.kbFunctions.ro_ctrlHome);
					Shortcut.add ('ctrl+end',		tio.kbFunctions.ro_ctrlEnd);
					Shortcut.add ('ctrl+arrowup',		tio.kbFunctions.ctrlUp);
					Shortcut.add ('ctrl+arrowdown', 	tio.kbFunctions.ctrlDown);
					Shortcut.add ('ctrl+pageup',		tio.kbFunctions.ctrlPageUp);
					Shortcut.add ('ctrl+pagedown',		tio.kbFunctions.ctrlPageDown);
					Shortcut.add ('shift+delete',		tio.kbFunctions.cut);
					Shortcut.add ('ctrl+insert',		tio.kbFunctions.copy);
					Shortcut.add ('shift+insert',		tio.kbFunctions.ro_paste);
					Shortcut.add ('ctrl+x', 		tio.kbFunctions.cut);
					Shortcut.add ('ctrl+c', 		tio.kbFunctions.copy);
					Shortcut.add ('ctrl+v', 		tio.kbFunctions.ro_paste);

					// editor keystrokes (constant bindings)

					Shortcut.add ('space',			tio.kbFunctions.ro_space);
					Shortcut.add ('shift+space',		tio.kbFunctions.ro_space);
					Shortcut.add ('tab',			tio.kbFunctions.ro_tab);
					Shortcut.add ('shift+tab',		tio.kbFunctions.ro_tab);
					Shortcut.add ('enter',			tio.kbFunctions.ro_enter, { workInInput: tio.confirmInInput });
					Shortcut.add ('backspace',		tio.kbFunctions.ro_backspace);
					Shortcut.add ('delete', 		tio.kbFunctions.ro_delete);
					Shortcut.add ('ctrl+z', 		tio.undo);

					// markup characters

					Shortcut.add ('`', tio.putKey.bind ({ key: "'", loner: tio.writable () }))

					break

				default:

					// editor keystrokes

					Shortcut.add ('arrowleft',		tio.kbFunctions.left);
					Shortcut.add ('arrowright',		tio.kbFunctions.right);
					Shortcut.add ('shift+arrowleft',	tio.kbFunctions.shiftLeft);
					Shortcut.add ('shift+arrowright',	tio.kbFunctions.shiftRight);
					Shortcut.add ('ctrl+arrowleft', 	tio.kbFunctions.ctrlLeft);
					Shortcut.add ('ctrl+arrowright',	tio.kbFunctions.ctrlRight);
					Shortcut.add ('arrowup',		tio.kbFunctions.up);
					Shortcut.add ('arrowdown',		tio.kbFunctions.down);
					Shortcut.add ('shift+arrowup',		tio.kbFunctions.shiftUp);
					Shortcut.add ('shift+arrowdown',	tio.kbFunctions.shiftDown);
					Shortcut.add ('pageup', 		tio.kbFunctions.pageUp);
					Shortcut.add ('pagedown',		tio.kbFunctions.pageDown);
					Shortcut.add ('shift+pageup',		tio.kbFunctions.shiftPageUp);
					Shortcut.add ('shift+pagedown', 	tio.kbFunctions.shiftPageDown);
					Shortcut.add ('home',			tio.kbFunctions.home);
					Shortcut.add ('end',			tio.kbFunctions.end);
					Shortcut.add ('shift+home',		tio.kbFunctions.shiftHome);
					Shortcut.add ('shift+end',		tio.kbFunctions.shiftEnd);
					Shortcut.add ('ctrl+home',		tio.kbFunctions.ctrlHome);
					Shortcut.add ('ctrl+end',		tio.kbFunctions.ctrlEnd);
					Shortcut.add ('ctrl+a', 		tio.kbFunctions.selectAll);
					Shortcut.add ('ctrl+arrowup',		tio.kbFunctions.ctrlUp);
					Shortcut.add ('ctrl+arrowdown', 	tio.kbFunctions.ctrlDown);
					Shortcut.add ('ctrl+pageup',		tio.kbFunctions.ctrlPageUp);
					Shortcut.add ('ctrl+pagedown',		tio.kbFunctions.ctrlPageDown);
					Shortcut.add ('shift+delete',		tio.kbFunctions.cut);
					Shortcut.add ('ctrl+insert',		tio.kbFunctions.copy);
					Shortcut.add ('shift+insert',		tio.kbFunctions.paste);
					Shortcut.add ('ctrl+x', 		tio.kbFunctions.cut);
					Shortcut.add ('ctrl+c', 		tio.kbFunctions.copy);
					Shortcut.add ('ctrl+v', 		tio.kbFunctions.paste);
					Shortcut.add ('ctrl+f', 		tio.kbFunctions.find);
					Shortcut.add ('f3',			tio.kbFunctions.findNext);
					Shortcut.add ('ctrl+r', 		tio.kbFunctions.findAndReplace);

					// editor keystrokes (constant bindings)

					Shortcut.add ('space',			tio.putKey.bind ({ key: blank, loner: true }));
					Shortcut.add ('shift+space',		tio.putKey.bind ({ key: blank, loner: true }));
					Shortcut.add ('tab',			tio.tab);
					Shortcut.add ('shift+tab',		tio.shiftTab);
					Shortcut.add ('enter',			tio.enter, { workInInput: tio.confirmInInput });
					Shortcut.add ('backspace',		tio.backspace.bind (true));
					Shortcut.add ('delete', 		tio.deleteKey);
					Shortcut.add ('ctrl+z', 		tio.undo);

					// markup characters

					Shortcut.add ('`', tio.putKey.bind ({ key: "'", loner: tio.writable () }))

			} // readOnly switch

			Shortcut.add ('1', tio.kbFunctions.key)
			Shortcut.add ('!', tio.kbFunctions.key)
			Shortcut.add ('2', tio.kbFunctions.key)
			Shortcut.add ('@', tio.kbFunctions.key)
			Shortcut.add ('3', tio.kbFunctions.key)
			Shortcut.add ('#', tio.kbFunctions.key)
			Shortcut.add ('4', tio.kbFunctions.key)
			Shortcut.add ('$', tio.kbFunctions.key)
			Shortcut.add ('5', tio.kbFunctions.key)
			Shortcut.add ('%', tio.kbFunctions.key)
			Shortcut.add ('6', tio.kbFunctions.key)
			Shortcut.add ('^', tio.kbFunctions.key)
			Shortcut.add ('7', tio.kbFunctions.key)
			Shortcut.add ('&', tio.kbFunctions.key)
			Shortcut.add ('8', tio.kbFunctions.key)
			Shortcut.add ('*', tio.kbFunctions.key)
			Shortcut.add ('9', tio.kbFunctions.key)
			Shortcut.add ('(', tio.kbFunctions.key)
			Shortcut.add ('0', tio.kbFunctions.key)
			Shortcut.add (')', tio.kbFunctions.key)
			Shortcut.add ('-', tio.kbFunctions.key)
			Shortcut.add ('_', tio.kbFunctions.key)
			Shortcut.add ('=', tio.kbFunctions.key)
			Shortcut.add ('+', tio.kbFunctions.key)
			Shortcut.add ('q', tio.kbFunctions.key)
			Shortcut.add ('w', tio.kbFunctions.key)
			Shortcut.add ('e', tio.kbFunctions.key)
			Shortcut.add ('r', tio.kbFunctions.key)
			Shortcut.add ('t', tio.kbFunctions.key)
			Shortcut.add ('y', tio.kbFunctions.key)
			Shortcut.add ('u', tio.kbFunctions.key)
			Shortcut.add ('i', tio.kbFunctions.key)
			Shortcut.add ('o', tio.kbFunctions.key)
			Shortcut.add ('p', tio.kbFunctions.key)
			Shortcut.add ('[', tio.kbFunctions.key)
			Shortcut.add (']', tio.kbFunctions.key)
			Shortcut.add ('\\',tio.kbFunctions.key)
			Shortcut.add ('|', tio.kbFunctions.key)
			Shortcut.add ('a', tio.kbFunctions.key)
			Shortcut.add ('s', tio.kbFunctions.key)
			Shortcut.add ('d', tio.kbFunctions.key)
			Shortcut.add ('f', tio.kbFunctions.key)
			Shortcut.add ('g', tio.kbFunctions.key)
			Shortcut.add ('h', tio.kbFunctions.key)
			Shortcut.add ('j', tio.kbFunctions.key)
			Shortcut.add ('k', tio.kbFunctions.key)
			Shortcut.add ('l', tio.kbFunctions.key)
			Shortcut.add (';', tio.kbFunctions.key)
			Shortcut.add (':', tio.kbFunctions.key)
			Shortcut.add ("'", tio.kbFunctions.key)
			Shortcut.add ('"', tio.kbFunctions.key)
			Shortcut.add ('z', tio.kbFunctions.key)
			Shortcut.add ('x', tio.kbFunctions.key)
			Shortcut.add ('c', tio.kbFunctions.key)
			Shortcut.add ('v', tio.kbFunctions.key)
			Shortcut.add ('b', tio.kbFunctions.key)
			Shortcut.add ('n', tio.kbFunctions.key)
			Shortcut.add ('m', tio.kbFunctions.key)
			Shortcut.add (',', tio.kbFunctions.key)
			Shortcut.add ('<', tio.kbFunctions.key)
			Shortcut.add ('.', tio.kbFunctions.key)
			Shortcut.add ('>', tio.kbFunctions.key)
			Shortcut.add ('/', tio.kbFunctions.key)
			Shortcut.add ('?', tio.kbFunctions.key)

			Shortcut.add ('shift+q', tio.kbFunctions.key)
			Shortcut.add ('shift+w', tio.kbFunctions.key)
			Shortcut.add ('shift+e', tio.kbFunctions.key)
			Shortcut.add ('shift+r', tio.kbFunctions.key)
			Shortcut.add ('shift+t', tio.kbFunctions.key)
			Shortcut.add ('shift+y', tio.kbFunctions.key)
			Shortcut.add ('shift+u', tio.kbFunctions.key)
			Shortcut.add ('shift+i', tio.kbFunctions.key)
			Shortcut.add ('shift+o', tio.kbFunctions.key)
			Shortcut.add ('shift+p', tio.kbFunctions.key)
			Shortcut.add ('shift+a', tio.kbFunctions.key)
			Shortcut.add ('shift+s', tio.kbFunctions.key)
			Shortcut.add ('shift+d', tio.kbFunctions.key)
			Shortcut.add ('shift+f', tio.kbFunctions.key)
			Shortcut.add ('shift+g', tio.kbFunctions.key)
			Shortcut.add ('shift+h', tio.kbFunctions.key)
			Shortcut.add ('shift+j', tio.kbFunctions.key)
			Shortcut.add ('shift+k', tio.kbFunctions.key)
			Shortcut.add ('shift+l', tio.kbFunctions.key)
			Shortcut.add ('shift+z', tio.kbFunctions.key)
			Shortcut.add ('shift+x', tio.kbFunctions.key)
			Shortcut.add ('shift+c', tio.kbFunctions.key)
			Shortcut.add ('shift+v', tio.kbFunctions.key)
			Shortcut.add ('shift+b', tio.kbFunctions.key)
			Shortcut.add ('shift+n', tio.kbFunctions.key)
			Shortcut.add ('shift+m', tio.kbFunctions.key)

			Shortcut.add ('shift+!', tio.kbFunctions.key)
			Shortcut.add ('shift+@', tio.kbFunctions.key)
			Shortcut.add ('shift+#', tio.kbFunctions.key)
			Shortcut.add ('shift+$', tio.kbFunctions.key)
			Shortcut.add ('shift+%', tio.kbFunctions.key)
			Shortcut.add ('shift+^', tio.kbFunctions.key)
			Shortcut.add ('shift+&', tio.kbFunctions.key)
			Shortcut.add ('shift+*', tio.kbFunctions.key)
			Shortcut.add ('shift+(', tio.kbFunctions.key)
			Shortcut.add ('shift+)', tio.kbFunctions.key)
			Shortcut.add ('shift+-', tio.kbFunctions.key)
			Shortcut.add ('shift+_', tio.kbFunctions.key)
			Shortcut.add ('shift+=', tio.kbFunctions.key)
			Shortcut.add ('shift++', tio.kbFunctions.key)
			Shortcut.add ('shift+[', tio.kbFunctions.key)
			Shortcut.add ('shift+]', tio.kbFunctions.key)
			Shortcut.add ('shift+\\',tio.kbFunctions.key)
			Shortcut.add ('shift+|', tio.kbFunctions.key)
			Shortcut.add ('shift+;', tio.kbFunctions.key)
			Shortcut.add ('shift+:', tio.kbFunctions.key)
			Shortcut.add ("shift+'", tio.kbFunctions.key)
			Shortcut.add ('shift+"', tio.kbFunctions.key)
			Shortcut.add ('shift+,', tio.kbFunctions.key)
			Shortcut.add ('shift+<', tio.kbFunctions.key)
			Shortcut.add ('shift+.', tio.kbFunctions.key)
			Shortcut.add ('shift+>', tio.kbFunctions.key)
			Shortcut.add ('shift+/', tio.kbFunctions.key)
			Shortcut.add ('shift+?', tio.kbFunctions.key)

			return tio.keyboardHooked = true, tio;

		},

		/*
		 *	un-registers all keyboard shortcuts,
		 *	un-maps the keyboard for text input
		 */

		disconnectKeyboard: function () {

			if (tio.keyboardHooked === false)

				return tio;

			// editor keystrokes

			Shortcut.remove ('arrowleft');
			Shortcut.remove ('arrowright');
			Shortcut.remove ('shift+arrowleft');
			Shortcut.remove ('shift+arrowright');
			Shortcut.remove ('ctrl+arrowleft');
			Shortcut.remove ('ctrl+arrowright');
			Shortcut.remove ('arrowup');
			Shortcut.remove ('arrowdown');
			Shortcut.remove ('shift+arrowup');
			Shortcut.remove ('shift+arrowdown');
			Shortcut.remove ('pageup');
			Shortcut.remove ('pagedown');
			Shortcut.remove ('shift+pageup');
			Shortcut.remove ('shift+pagedown');
			Shortcut.remove ('home');
			Shortcut.remove ('end');
			Shortcut.remove ('shift+home');
			Shortcut.remove ('shift+end');
			Shortcut.remove ('ctrl+home');
			Shortcut.remove ('ctrl+end');
			Shortcut.remove ('ctrl+a');
			Shortcut.remove ('ctrl+arrowup');
			Shortcut.remove ('ctrl+arrowdown');
			Shortcut.remove ('ctrl+pageup');
			Shortcut.remove ('ctrl+pagedown');
			Shortcut.remove ('shift+delete');
			Shortcut.remove ('ctrl+insert');
			Shortcut.remove ('shift+insert');
			Shortcut.remove ('ctrl+x');
			Shortcut.remove ('ctrl+c');
			Shortcut.remove ('ctrl+v');
			Shortcut.remove ('ctrl+f');
			Shortcut.remove ('f3');
			Shortcut.remove ('ctrl+r');

			// editor keystrokes (constant bindings)

			Shortcut.remove ('space');
			Shortcut.remove ('shift+space');
			Shortcut.remove ('tab');
			Shortcut.remove ('shift+tab');
			Shortcut.remove ('enter');
			Shortcut.remove ('backspace');
			Shortcut.remove ('delete');
			Shortcut.remove ('ctrl+z');

			// markup characters

			Shortcut.remove ('`')

			// normal keystrokes

			Shortcut.remove ('1')
			Shortcut.remove ('!')
			Shortcut.remove ('2')
			Shortcut.remove ('@')
			Shortcut.remove ('3')
			Shortcut.remove ('#')
			Shortcut.remove ('4')
			Shortcut.remove ('$')
			Shortcut.remove ('5')
			Shortcut.remove ('%')
			Shortcut.remove ('6')
			Shortcut.remove ('^')
			Shortcut.remove ('7')
			Shortcut.remove ('&')
			Shortcut.remove ('8')
			Shortcut.remove ('*')
			Shortcut.remove ('9')
			Shortcut.remove ('(')
			Shortcut.remove ('0')
			Shortcut.remove (')')
			Shortcut.remove ('-')
			Shortcut.remove ('_')
			Shortcut.remove ('=')
			Shortcut.remove ('+')
			Shortcut.remove ('q')
			Shortcut.remove ('w')
			Shortcut.remove ('e')
			Shortcut.remove ('r')
			Shortcut.remove ('t')
			Shortcut.remove ('y')
			Shortcut.remove ('u')
			Shortcut.remove ('i')
			Shortcut.remove ('o')
			Shortcut.remove ('p')
			Shortcut.remove ('[')
			Shortcut.remove (']')
			Shortcut.remove ('\\')
			Shortcut.remove ('|')
			Shortcut.remove ('a')
			Shortcut.remove ('s')
			Shortcut.remove ('d')
			Shortcut.remove ('f')
			Shortcut.remove ('g')
			Shortcut.remove ('h')
			Shortcut.remove ('j')
			Shortcut.remove ('k')
			Shortcut.remove ('l')
			Shortcut.remove (';')
			Shortcut.remove (':')
			Shortcut.remove ("'")
			Shortcut.remove ('"')
			Shortcut.remove ('z')
			Shortcut.remove ('x')
			Shortcut.remove ('c')
			Shortcut.remove ('v')
			Shortcut.remove ('b')
			Shortcut.remove ('n')
			Shortcut.remove ('m')
			Shortcut.remove (',')
			Shortcut.remove ('<')
			Shortcut.remove ('.')
			Shortcut.remove ('>')
			Shortcut.remove ('/')
			Shortcut.remove ('?')

			Shortcut.remove ('shift+q')
			Shortcut.remove ('shift+w')
			Shortcut.remove ('shift+e')
			Shortcut.remove ('shift+r')
			Shortcut.remove ('shift+t')
			Shortcut.remove ('shift+y')
			Shortcut.remove ('shift+u')
			Shortcut.remove ('shift+i')
			Shortcut.remove ('shift+o')
			Shortcut.remove ('shift+p')
			Shortcut.remove ('shift+a')
			Shortcut.remove ('shift+s')
			Shortcut.remove ('shift+d')
			Shortcut.remove ('shift+f')
			Shortcut.remove ('shift+g')
			Shortcut.remove ('shift+h')
			Shortcut.remove ('shift+j')
			Shortcut.remove ('shift+k')
			Shortcut.remove ('shift+l')
			Shortcut.remove ('shift+z')
			Shortcut.remove ('shift+x')
			Shortcut.remove ('shift+c')
			Shortcut.remove ('shift+v')
			Shortcut.remove ('shift+b')
			Shortcut.remove ('shift+n')
			Shortcut.remove ('shift+m')

			Shortcut.remove ('shift+!')
			Shortcut.remove ('shift+@')
			Shortcut.remove ('shift+#')
			Shortcut.remove ('shift+$')
			Shortcut.remove ('shift+%')
			Shortcut.remove ('shift+^')
			Shortcut.remove ('shift+&')
			Shortcut.remove ('shift+*')
			Shortcut.remove ('shift+(')
			Shortcut.remove ('shift+)')
			Shortcut.remove ('shift+-')
			Shortcut.remove ('shift+_')
			Shortcut.remove ('shift+=')
			Shortcut.remove ('shift++')
			Shortcut.remove ('shift+[')
			Shortcut.remove ('shift+]')
			Shortcut.remove ('shift+\\')
			Shortcut.remove ('shift+|')
			Shortcut.remove ('shift+;')
			Shortcut.remove ('shift+:')
			Shortcut.remove ("shift+'")
			Shortcut.remove ('shift+"')
			Shortcut.remove ('shift+,')
			Shortcut.remove ('shift+<')
			Shortcut.remove ('shift+.')
			Shortcut.remove ('shift+>')
			Shortcut.remove ('shift+/')
			Shortcut.remove ('shift+?')

			return tio.keyboardHooked = false, tio;

		},

		/*
		 *	disable TIO, while maintaining it visible
		 */

		disable: function () {

			ModalTimeout.clr ({ id: 'cur(a)' });

			tio.cur.style.opacity = 1;
			tio.disconnectKeyboard ();

			return tio;

		},

		/*
		 *	show TIO
		 */

		show: function (writeAccess) {

			tio.disable ();
			tio.onresize (tio.scn.style.display = 'block');
			tio.positionCursor.call ({ hold: true }, tio.cp = tio.findCp (tio.ci));

			ModalTimeout.clr ({ id: 'tio.fade_in' });
			ModalTimeout.clr ({ id: 'tio.fade_out' });

			switch (writeAccess || false) {

				case true:

					tio.connectKeyboard ().positionCursor (tio.cp);
					tio.ro = false;
					break;

				case false:

					tio.connectKeyboard (true);
					tio.keyboardHooked = true;
					tio.ro = true;
					break;

			}

			ModalTimeout.set ({ id: 'tio.fade_in', handler: function () { tio.scn.style.opacity = 1 }, msecs: 100 });

			return tio;

		},

		/*
		 *	hide TIO, disabling it if necessary
		 */

		hide: function () {

			ModalTimeout.clr ({ id: 'tio.fade_in' });
			ModalTimeout.clr ({ id: 'tio.fade_out' });

			tio.disable ();
			tio.scn.style.opacity = 0;

			ModalTimeout.set ({ id: 'tio.fade_out', handler: function () { tio.scn.style.display = 'none' }, msecs: 500 });

			return tio;

		},

		/*
		 *	clear screen i.e. forget it all
		 */

		cls: function (ac, mb) {

			tio.ST = 0;
			tio.TT = null;

			ModalTimeout.clr ({ id: 'tio.type' });
			ModalTimeout.clr ({ id: 'tio.type.completion' });

			tio.quitPrompt ();

			tio.ac = be.object (ac).or (new Object ());
			tio.mb = be.string (mb).or (empty);
			tio.ca = null;
			tio.lk = empty;
			tio.it = empty;
			tio.s1 = false;
			tio.sj = 0;
			tio.ot = new Array;
			tio.l1 = +0xFFFFFF;
			tio.l2 = -0xFFFFFF;
			tio.zr = new Array ();
			tio.lr = false;
			tio.rr = null;

			if (be.string (mb).or (false)) {

				tio.setInnerText (mb);
				tio.ovl.innerHTML = empty;
				tio.txt.innerHTML = tio.highlight (mb, true);

			}

			else {

				tio.setInnerText (empty);
				tio.ovl.innerHTML = empty;
				tio.txt.innerHTML = '&nbsp;';

			}

			tio.scrollTo (0, true);
			tio.pag.scrollLeft = tio.pl = 0;
			tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.getInnerText ().length));

			return tio;

		},

		/*
		 *	load fresh new text into editor
		 */

		load: function (text, ac, mb) {

			tio.cls (ac, mb);
			tio.setInnerText (tio.mb + text);
			tio.txt.innerHTML = tio.highlight (tio.mb + text, true);

			return tio;

		},

		/*
		 *	bring cursor to home position (page-wide)
		 */

		home: function () {

			tio.pag.scrollLeft = tio.pl = 0;
			tio.positionCursor (tio.cp = tio.findCp (tio.ci = 0));

			return tio;

		},

		down: function () {

			tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.it.length))
			return (tio)

		},

		/*
		 *	update screen contents
		 */

		update: function (args) {

		     /* if (tio.ro)

				enable_nonfunctional_picks || (contents = be.string (contents).or (empty).replace (tio.tg_opts, function (m0, s1, s2) {

					if (/\[/.test (s2))

						return (m0)
						return (m0.replace (/\{([^]*?)\}/, '[$1]'))

				})) // filter invalid options lines (make first option active, if no option was active) */

		    let contents = be.string (args && args.content).or (args)
		    let behavior = be.object (args && args.behavior).or ({ })

			tio.ot = new Array
			tio.l1 = +0xFFFFFF
			tio.l2 = -0xFFFFFF
			tio.setInnerText (be.string (contents).or (tio.getInnerText ()))
			tio.txt.innerHTML = tio.highlight (tio.it, true, behavior.keepActiveRow && tio.rr && tio.rr.link && tio.rr.line)
			tio.positionCursor.call ({ hold: true }, tio.cp = tio.findCp (tio.ci = tio.findVCi (tio.cp.i, tio.cp.j)))

			return tio

		},

		/*
		 *	simulate slow data rate receive
		 */

		type: function (args) {

		  const txt = be.string (args && args.text).or (empty),
			och = be.lambda (args && args.oncompletion).or (function () {}),
			cps = be.number (args && args.cps).or (0),
			wps = be.number (args && args.wps).or (0),
			lps = be.number (args && args.lps).or (0),
			lim = be.number (args && args.lim).or (9),
			row = be.number (args && args.row).or (null),
			any = Math.round (lps || wps || cps || 0),
			rat = Math.ceil (1000 / (any || 10));

		    var hand;

			row === null || (tio.rr = { line: row, link: true })

			tio.ST = 0;
			tio.TT = null;

			ModalTimeout.clr ({ id: 'tio.type' });
			ModalTimeout.clr ({ id: 'tio.type.completion' });

			if (txt.length === 0) {

				ModalTimeout.set ({ id: 'tio.type.completion', handler: och, msecs: 167 });
				return tio;

			}

			if (any === 0) {

				ModalTimeout.set ({ id: 'tio.type.completion', handler: och, msecs: 167, having: tio.putKey.call ({ key: txt, typed: true }) });
				return tio;

			}

			cps && (tio.TT = be.vector (txt.match (/[^]{1}/g)).or (new Array).reverse ());
			wps && (tio.TT = be.vector (txt.match (/\s*\S+/g)).or (new Array).reverse ());
			lps && (tio.TT = be.vector (txt.match (/.*\n?/gi)).or (new Array).reverse ());
			any || (tio.TT = new Array (txt));

			if (wps)

				tio.TT.unshift (be.vector (txt.match (/\s+$/)).or ([ empty ]).shift ());

			ModalTimeout.set ({ id: 'tio.type', handler: hand = function () {

			    let word = tio.TT.pop (), extent, height;

				while (tio.TT.length > 0 && word.length < lim)

					word = word + tio.TT.pop ();

				tio.putKey.call ({ key: word, typed: true });

				while (tio.TT.length > 0) {

					extent = tio.ch * tio.it.split ('\n').length;
					height = window.innerHeight - tio.vp ();

					if (height - extent < 0 || tio.ST - 0) {

						tio.putKey.call ({ key: tio.TT.reverse ().join (empty), typed: true, ghost: true });
						break;

					}

					ModalTimeout.set ({ id: 'tio.type', handler: hand, msecs: rat });
					return;

				}

				ModalTimeout.set ({ id: 'tio.type.completion', handler: och, msecs: 167, hence: tio.TT = null });

			}, msecs: rat });

			return tio;

		},

		stopTyping: function () {

			tio.ST = 1;
			return tio;

		}

	};


