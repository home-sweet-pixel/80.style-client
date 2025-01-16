


	/*
	 *
	 *	===========================================
	 *	80.style user interface navigation dynamics
	 *	===========================================
	 *
	 *	Copyright 2020-2024 by Alessandro Ghignola
	 *	Public domain - but you're on your own. :)
	 *
	 */

  const home = {

		position: String ('0/2/1'),
		colIndex: 2,
		rowIndex: 1

	} // TIO cursor's default position after page load (via nav.to)

  const highlights_start = 13	// first announcements' row
  const highlights_end = 15	// last announcements' row
  const highlights_m = 14	// mid-way row (loading)
  const ignorelist_start = 12	// row to send cursor to

  const LEFT = 0		// panel ID
  const RIGHT = 1		// panel ID
  const TMRATE = .5		// 60ths of a second, simulating 1/30th

	/*
	 *	replaceable clips patterns:
	 *	clipMatch matches what's inside the first text clip,
	 *	postMatch matches the entire text clip and controls,
	 *	stubMatch matches what's inside the "secondary clip"
	 */

  const clipMatch = RegExp ('(\\8\\<.*\\n)([^]*?)(\\n.*\\>\\8)')
  const postMatch = RegExp ('(\\n\\n\\s*8\\<.*\\n)([^]*?)(\\n.*\\>\\8[^\\n]*\\n[^\\n]*\\n*)')
  const stubMatch = RegExp ('(\\8\\<.*\\n[^]*?\\n.*\\>\\8[^]*)(\\n\\n\\n\\s*\\8\\<.*\\n)([^]*?)(\\n.*\\>\\8[^\\n]*\\n[^\\n]*\\n*)')

	/*
	 *	display list for new notes:
	 *	matching pattern and template
	 */

  const listMatch = RegExp ('[^\\n]+\\n\\x20*N\\x20\\`\\`\\x20\\+[^\\n]+\\n\\n')
  const listModel = String ('\x20\x20========================= *!* ==========================\x20/\n\x20\x20\x20${n}\n\n')

	/*
	 *	match paragraph introducing
	 *	newsfeeds: determines where
	 *	the "+1 to read" notices go
	 */

  const feedMatch = RegExp ('\\=\\n[^\\n]*\\n')

	/*
	 *	cosmetic string treatments:
	 *	turns out, ECMA 5 could make these simpler, but whatever...
	 */

  const centering = function (message, length, extender) {

		return (Array (1 + Math.max (0, (length - message.length) >> 1)).join (extender || blank) + message)

	} // centers message thru <length> (fixed-width) characters

  const extending = function (message, length, extender) {

		return (centering (message, length, extender || blank) + Array (1 + length - centering (message, length, blank).length).join (extender || blank))

	} // extends message to <length> characters padding around with <extender>

  const expanding = function (message, length, extender) {

		return (Array (1 + length - message.length).join (extender || blank) + message)

	} // extends message to <length> characters padding around with <extender>

  const reframing = function (message, length, extender, highlighter) {

	    let l = (length - message.length - 2) >> 1
	    let r = (length - message.length - 2 === 2 * l) ? l : l + 1

		return (Array (Math.max (0, l)).join (extender || blank) + blank + highlighter + message + highlighter + blank + Array (Math.max (0, r)).join (extender || blank))

	} // returns "framed" version of message, i.e. centered in a "frame" (ruler) made by repeating <extender>: at the middle, the message is highlighted by our post-processor according to given <highlighter>

  const indenting = function (message, column, par) {

	    let s = Array (column + 1).join (blank)
	    let p = Array (be.number (par).or (0) + 1).join (blank)

		return (s + message.replace (/\n/g, '\n' + (p || s)))

	} // indents all rows in <message> with <column> blanks

  const horizrule = function (indents, length, extender) {

		return (indenting (Array (Math.max (0, length - indents + 1)).join (extender || minus), indents))

	} // creates a horiziontal rule, indented by <indents> blanks, repeating until column <length> and made out of <extender> characters

  const signature = function (author, rowspan, extender, index) {

		return (Array (Math.max (0, rowspan - index.length - author.length - 1)).join (extender || blank) + blank + index + blank + author)

	} // right-aligns <author> to a line of <rowspan> characters using <extender> as padder and <index>, between blanks, as separator

  const rendering = function (args) {

	    let note = args.note || { id: '0', nn: 0, nr: 0, body: 'MESSAGE LOST', auth: 'UNKNOWN' }	// note (normalized if not given)
	    let lv = args.indent || (2), r = semic + Math.min (note.compact ? lv : lv + 4, 22) + ','	// indent and reply indent levels
	    let resp = nav.ar, spec = tilde + note.id + (r), p = note.reply ? null : t_permaL + spec	// access rights, spec, permalink
	    let f = (nav.id && nav.username () == note.auth) ? t_condemn + spec : t_flag_note + spec	// self-moderation (non-op) links
	    let x_reply_vrb = nav.id === true && nav.username () === note.auth ? t_ps : t_reply_verb	// reply verbs (reply, follow-up)
	    let x_flaggedBy = nav.rf ? (t_flaggedBy + blank + note.report_by) : (t_reported) + slash	// illicit content report warning

	    let level = Array (lv + 1).join (blank)
	    let npick = nline + Array (Math.max (0, lv - 1)).join (blank) + (pick)
	    let numbers = note.nn.toString (), comp = empty, opt = new Array, pt = nav.pt, diff = 0

		args.reset && (this.action_row = false) 						// reset non-local function state
		note.is_a_page && (x_flaggedBy = slash) 						// a flagged page has an AES hash

		if (note.reply || note.feedReply) {

			note.about = tb (be.string (note.r_to).or (empty).split (slash).pop ())
			note.about = note.about ? t_topic + blank + note.about + slash : (null)

		}

		else {

			note.about = tb (be.string (note.path).or (empty).split (slash).pop ())
			note.about = note.about ? t_topic + blank + note.about + slash : (null)

		}

		if (be.number (resp.st).or (0) > 0)

			if (note.about === null) {

				note.stamp = resp.st - (parseInt (note.id.substr (0, 9), 36))
				note.about = _(note.stamp).no + _(note.stamp).units + (slash)

			}

			else {

				note.stamp = resp.st - (parseInt (note.id.substr (0, 9), 36))
				note.about = note.about + '\\' + (blank) + _(note.stamp).no + _(note.stamp).units

			}

		while (true) {

			if (note.nn === 0) {

				switch (note.body) {

					case 'MESSAGE AVULSED':

						return (empty)

				}

				if (note.compact) {

					comp = empty
					comp = indenting (note.body, lv) + (comp) + (nline) + (level) + '--}^' + signature (note.auth, tio.nc - lv - 6, '-', author) + nline
					this.action_row ? comp = horizrule (lv, tio.nc - 2) + (nline) + comp : null
					this.action_row = false

					break

				}

				comp = (Array (lv).join (blank)) + (note.reply ? (empty) : (aster) + (numbers + point) + (aster))
				     + (nline) + (horizrule (lv, tio.nc - 2))
				     + (nline) + (indenting (note.body , lv))
				     + (nline)
				     + (level) + (signature (note.auth, tio.nc - lv - 2, '-', author))
				     + (nline)

				break

			} // invalid entry

			if (note.compact) {

				comp = resp.op ? nline + Array (52).join (blank) + pick + '[X' + tilde + note.id + ']' : empty

				if (note.body.startsWith ('/ME' + blank)) {

					comp = indenting ('{i}{b}!{/b}' + note.auth + blank + note.body.substr (4) + '{/i}', lv, note.auth.length) + comp + nline
					note.nextToLast ? comp = comp + horizrule (lv, tio.nc - 2) + (nline) : null
					note.nextToLast ? this.action_row = false : this.action_row = true

				}

				else {

					comp = indenting (note.body, lv) + (comp) + (nline) + (level) + '--}^' + signature (note.auth, tio.nc - lv - 6, '-', author) + nline
					this.action_row ? comp = horizrule (lv, tio.nc - 2) + (nline) + comp : null
					this.action_row = false

				}

				if (note.header)

					comp = (blank) + (slash) + (note.about)
					     + (nline) + (horizrule (lv, tio.nc - 2))
					     + (nline) + (comp)

				break

			} // compact entry -- otherwise, regular entry

			note.id === pt && (p = false)	// double isolation of the same token makes no sense
			note.condemned && (f = false)	// already condemned: hiding self-moderation options
			note.doNotFlag && (f = false)	// already legitimized note, and notes are immutable
			note.isFlagged && (f = false)	// already reported: reporting again is not possible
			note.isDropped && (f = false)	// already expunged: nothing is effectively possible

			comp = (Array (lv).join (blank)) + (note.reply ? empty : (aster) + (numbers + point) + (aster) + Array (Math.max (0, 5 - numbers.length)).join (blank))
			     + (slash) + (note.isDropped ? (t_dropped + slash) : note.condemned ? (t_condemned + slash) : note.isFlagged ? x_flaggedBy : (note.about || slash))
			     + (nline) + (horizrule (lv, tio.nc - 2))
			     + (nline) + (indenting (note.body , lv))
			     + (nline)
			     + (level) + (signature (note.auth, tio.nc - lv - 2, '-', author))

			be.switch (note.noReplies).or (resp.cp === false) || opt.push (x_reply_vrb + spec)	// if note isn't "frozen" and we can post replies, add REPLY option
			p && opt.push (p) && (note.path && (nav.st.permapaths [note.id] = rc (note.path)))	// if note can be "observed", add OBSERVE and register permalink
			resp.op && (opt.push (t_expunge + spec))						// if we're an operator, add EXPUNGE option in any cases
			resp.op && (note.bOperator || opt.push (t_tis_bad + spec))				// if we're an operator, and it's not from another op, add SANCTION
			resp.op || (nav.nf || (f && opt.push (f)))						// if we're no operator, and we're not on the newsfeed, add REPORT!
			note.isFlagged && (resp.op && opt.push (t_legit + spec))				// if note was reported, and we're an operator, add LEGIT
			note.isFlagged && (resp.op || opt.push (t_thanks + spec))				// if note was reported, and we're no operator, add THANKS!

			/*
			 *	if, after all that, we were left with no options at all, we'll need
			 *	to pretend we had one, which does nothing but pop a message, saying
			 *	that the note was legitimized after having been reported; it's just
			 *	the kind of behavior we need, because you see no options only when:
			 *
			 *	      - you're watching a reply reached via a permalink, such as in
			 *		a search result's link: this prevents replying, because you
			 *		might be more comfortable following what happens after that
			 *		reply, not before; and
			 *
			 *	      - this note was formerly flagged, subsequently validated, and
			 *		now nobody is allowed to flag it again (because immutable);
			 *
			 *	      - and you're no operator, so you can't even EXPUNGE this note
			 *		because you might have changed your mind on its validity...
			 */

			if (opt.length === 0)

				comp = comp + npick + '[' + ('** ^.^ **') + spec + ']'

			else {

				note.isDropped && (comp = comp + npick + '{' + opt.shift () + '}')		// first option is active/selected, by default, unless note is dead
				note.isDropped || (comp = comp + npick + '[' + opt.shift () + ']')		// here's what makes it active/selected, when it's not dead
				while (opt.length) comp = comp + blank + '{' + opt.shift () + '}'		// now, appending all the other options, if any...

			} // assembling options line

			if (nav.nf || nav.rf || note.noReplies) {

				comp = comp + nline
				break

			} // skipping "lifeline" for newsfeed, reports' feed, and "frozen notes"

			/*
			 *	assembling this note's "lifeline":
			 *	it's what visually receives notifications for new replies
			 *
			 *	      - a "shortline" is a non-functional menu (no replies) for
			 *		use when we want to display one (usually because that's
			 *		not cluttering spaces between far-away posts);
			 *
			 *	      - the regular "lifeline" is stored for later use and will
			 *		be left invisible until at least one reply is received,
			 *		when there are none so far;
			 *
			 *	      - the line will be visible and functional as a one-option
			 *		menu (P or PICK menu) to unroll replies;
			 *
			 *	      - the <diff> parameter jumps to 1 to account for an extra
			 *		row composing this note's layout, so that the number of
			 *		rows following the <spec> string can always be used, in
			 *		combination with the row number where <spec> was found,
			 *		to locate the header line for the note, the one holding
			 *		informations, timestamps and warnings about the note...
			 */

			note.lifeLine = npick.toLowerCase () + '{' + t_no_replies + spec + 'L}'
			note.shortLine = npick.substr (1E00) + '{' + t_no_replies + spec + 'L}'

			note.nr && (comp = comp + npick + '[' + t_see + blank + note.nr + blank + (note.nr > 1 ? t_replies : t_reply) + spec + 'L]' + nline)
			note.nr || (comp = comp + nline + note.shortLine + nline)

			diff = 1
			break

		} // layout switch

		return (comp.replace (/\,([\]\}])/g, comma + (be.vector (comp.match (/\n/g)).or (avoid).length - diff).toString () + '$1'))

	}.bind ({ action_row: false }) // renders a note, using most of the above utilities as helpers

  const elliptize = function (args) {

	    let string = be.string (args && args.string).or (empty)
	    let length = be.number (args && args.length).or (42)

		if (string.length <= length)						// it fits, it just fits, there's no problem

			return (string)

		if ((length -= ellip.length) <= 0)					// it won't, but not even the ellipsis would

			return (ellip.substr (0, length + ellip.length))

	    let splits = string.split (/[\s\,\.\:\;\!\?\/]+/g)				// split words
	    let points = string.match (/[\s\,\.\:\;\!\?\/]+/g) || Array (empty) 	// split points (1 or more punctuators each)
	    let output = splits.shift ()						// current output (the first split word)
	    let puncts = points.shift ()						// current puctuators (following this split)

		if ((output + puncts).length <= length) 				// this word, plus its punctuators, will fit

			for (let split of splits) {

				if ((output + puncts + split).length <= length) {	// next word, plus its punctuators, will fit

					output = output + puncts + split		// append the punctuators, and the next word
					puncts = points.shift ()			// update punctuators, that follow next word
					continue					// update <split> word then keeps going...

				}

				return (output + ellip) 				// breaking point: append ellipsis, and stop

			} // we just want the "for" iterator to simplify access...

		/*
		 *	now this is tricky: we want the first word to be "breakable",
		 *	hence the check on the above precondition, skipping over this
		 *	particular case; HOWEVER, if there was no visible first word,
		 *	and we're only working with punctuators, break those and keep
		 *	them as the "most relevant" part of the string
		 */

		return (output.length ? output : puncts).substr (0, length) + (ellip)

	} // eventually shortens titles that wouldn't fit within given maximum length

	/*
	 *	main "navigation" object,
	 *	right after a little test on a popstate state saved to sessionStorage
	 */

  try { kps = JSON.parse (sessionStorage.ps) } catch (e) { kps = null }

  const v11 = '{' + blank.repeat (11) + '}'
  const v18 = '{' + blank.repeat (18) + '}'

  const nav = {

		// navigation UI state, shared between anything that follows "nav.js"

		st: {

			edszMatchNumber: 0,									//
														//
			pp_status: {										//
														//
				common_punctuators:	[ 32, 33, 34, 39, 40, 41, 44, 46, 58, 59, 63, 93 ],	//
														//
				muted: true,		// disable processor	(startup and console mode)	//
				delim: true,		// true after delimiter (newline, tag, punctuator)	//
				entag: false,		// true within tags	(e.g. the "i" inside </i>)	//
				intag: 0,		// open tag(s) counter	(= 1 between <i> and </i>)	//
				level: 0,		// nesting level	(at which text is "clean")	//
				rownr: 0,		// row counter		(first row will be 0, etc)	//
				optag: false,		// opening tag		(just following less than)	//
				cltag: false,		// closing tag flag	(slash found after last <)	//
				start: false,		// starting highlight	(true after pattern match)	//
				endof: null,		// what to finalize	(which one of the markups)	//	C.U.I
				endch: null,		// latest mark-up sign	(following finalizing tag)	//
				e_o_l: false,		// end-of-line pulse	(breaks line continuation)	//
														//
				em: blank,		// action emphasis character (paged chat -> arrow)	//
				me: blank		// action emphasis character (current replacement)	//
														//
			},						// cosmetic post-processor status	//
														//
			ds:		0.66,				// default/best-guess screen size	//
			es:		0.72,	// 0.72 		// screen size when > 16:9 ratios	//
			ks:		0.66,				// keyboard, screen size (=st.ds)	//
			ms:		0.80,				// maximum, maximized screen size	//
			ps:		0.66,				// preferred screen size (=st.ds)	//
														//
			link_out:	null,				// links pad exec timeout		//
			permapaths:	new Object,			// permalink path overrides by ID	// -----------------

			ar:		84,				// height of an avatar (semi-cm.)	// -----------------
			ff:		null,				// frame stepper animation frame	//
			fh:		null,				// frame stepper interval handle	//
			fk:		null,				// frame stepper kickstart timer	//
			fs:		null,				// frame handler (stepper itself)	//
			ip:		.086,				// image persistence (default ip)	//
			md:		false,				// model drag (don't onpgfocus) 	//
			mf:		0.98,				// medium's friction (default mf)	//
			pd:		false,				// pointer down (triggered)		//
			sc:		null,				// scene canvas (element)		//
			oc:		null,				// compass rendering context		//
			rc:		null,				// scene rendering context		//
			we:		null,				// world entry (stops the intro)	//
														//
			intro:	       'running',			// stops 'running' on user input	//
			pitch:	       'not-set',			// target pitch value (degrees) 	//
			pitching:      'not-set',			// pitch variation (momentum)		//
			yaw:	       'not-set',			// target yaw value (degrees)		//
			yawing:        'not-set',			// yaw variation (momentum)		//
			roll:	       'not-set',			// target roll value (degrees)		//
			speed:	       'not-set',			// speed (instant acceleration) 	//
			lastAreal:	null,				// last arealcode (where valid) 	//
														//
			dancing:	true,				// first-timers "make" dance flag	//
			free:		0,				// generic controls lock (when 0)	//
														//
			live: { 										//
														//
				t0:	null,				// start time				//
				t1:	null,				// intro stop time (painted form)	//
				t2:	null,				// timeout to free at world entry	//
				at:	null,				// time stamp of last user action	//
				el:	1,				// elapsed time per frame (60ths)	//
				fn:	0,				// frame nr (in measurement span)	//
				ft:	null,				// frame time (taken when fn = 0)	//
				fs:	0,				// frame strobe (++ per timespan)	//
				ws:	1,				// main world strobe (++ / frame)	//
				sb:	0,				// standby interval last duration	//
				si:	50,				// standby interval update ticker	//
				ld:	99,				// level of detail (usual [1-99])	//
				ld_hm:	99,				// level of detail for held model	//
				pr:	1,				// pixel sampling factor (varies)	//
				ip:	.086,				// image persistence (target val)	//
				mf:	0.98,				// medium's friction (current)		//
				vx:	0,				// velocity component, x		//	The Array
				vy:	0,				// velocity component, y		//
				vz:	0,				// velocity component, z		//
				cp:	400,				// intro camera panning distance	//
				qv:	null,				// quicktripping velocity		//
				tv:	false,				// trans-leaping velocity reached	//
				st:	2000				// imported model culling stepper	//
														//
			},						// frame live data			//
														//
			mc: {											//
														//
				copy:	   false,			// copy, don't send filedata		//
				text:	   empty,								//
				edge:	   empty,								//
				size:	   1,				// basic model size (200x)		//
				lay:	   0,				// lay angle				//
														//
				anis: { 									//
														//
					x: 1,									//
					y: 1,									//
					z: 1									//
														//
				},					// anisotropic scaling factor		//
														//
				flat:	   false,								//
				shiny:	   false,								//
				solid:	   true,								//
				spacing:   1,									//
				thickness: 1,									//
				threshold: 1,									//
				owned:	   false,								//
														//
				flags: {									//
														//
					numeric: 0b1110,							//
					literal: String ('E')							//
														//
				},										//
														//
				active:    false,			// model configuration active		//
				enable:    false			// model configuration enable		//
														//
			}						// array models configuration		//

		}, // nav.st

		// history handling - mantains back/forward links pseudo-mirroring browser's ones,
		// except it will prevent our back button from exiting the site (to what was there
		// before entry into this site) and will automatically skip over pages that a user
		// has deleted or re-titled (and which'd give pointless, disorienting 404 errors);
		// at no point the browser's back button is, in fact, "broken": it will do its job
		// as normal, but using our own prominent navigation arrows is more comfortable...

		ps: be.object (kps).or ({

			id: 1,						// actual history entry ID
			hl: history.length,				// actual history length
			op: false,					// own page (before this)
			nx: false,					// next page (is present)
			pp: false,					// we're on passport page
			ve: new Object					// voided entries to skip

		}),

		// menu bar: default, mandated, current

		db: ('\nM `` [\\] {`} {' + ( blank.repeat (29) ) + '} {80.STYLE} {<} {>}\n'),
		mb: ('\nM `` [\\] {`} {' + ( blank.repeat (29) ) + '} {80.STYLE} {<} {>}\n'),
		cb: ('\nM `` [\\] {`} {' + ( blank.repeat (29) ) + '} {80.STYLE} {<} {>}\n'),

		// menu bar: layouts inside "the array"

		ab: ('\nM `` {\QUICKTRIP} {MAKE} {IMPORT} [RECOGNIZE] {80.STYLE} {`EXIT}'),	// regular
		ib: ('\nM `` {\QUICKTRIP} {MAKE} {REMOVE} [CONFIGURE] {80.STYLE} {`EXIT}'),	// model configuration
		qb: ('\nM `` [\QUICKTRIP] {MAKE} '	    + v18 + ' {80.STYLE} {`EXIT}'),	// quicktrip default
		xb: ('\nM `` [\PICK] {COPY} {NEVERMIND} '   + v11 + ' {80.STYLE} {`EXIT}'),	// object handling

		// new entry cursors

		promAtBottom: slash,	// last announcement listed at bottom
		pageAtBottom: slash,	// last page title listed at bottom
		pictAtBottom: slash,	// last picture post page title listed at bottom
		userAtBottom: slash,	// last username listed at bottom
		packAtBottom: slash,	// last package page title listed at bottom
		flagAtBottom: slash,	// last flagged entry identifier at bottom

		// navigation UI state, as configured or shared with the HTML front-end ("cui.js")

		aa: false,		// array anchor (on entry, URL) // shared with front-end
		al: false,		// array link (no regular menu) // shared with front-end
		bs: false,		// state of note backstep arrow // shared with front-end
		cm: false,		// command-line mode		// keeps help bar hidden
		fl: 1,			// flag line (flag icon line)	// returned by front-end
		fr: null,		// full-screen request method	// returned to front-end
		gr: null,		// array gating request timeout // shared with front-end
		hb: null,		// array home (null = default)	// shared with front-end
		pb: null,		// array link (pulsed base)	// shared with front-end
		lm: null,		// areal to seek landmark ASAP	// shared with front-end
		hp: false,		// page re-load URL as intended // shared with front-end
		ht: empty,		// home title (brings to hp)	// shared with front-end
		id: false,		// user login state		// shared with front-end
		ih: false,		// interstitial home link	// shared with front-end
		is: false,		// inside-array flag		// shared with front-end
		ku: slash,		// package path (full URI)	// shared with front-end
		np: false,		// next page in slide show	// shared with front-end
		ns: false,		// note section (we're in a...) // shared with front-end
		nt: true,		// flag: non-touch device	// true matches desktops
		ph: String ('100vh'),	// set height of page element	// two rows in the array
		pp: false,		// prev page in slide show	// shared with front-end
		pt: empty,		// page token, note thread	// shared with front-end
		pu: empty,		// present dynamic URI		// shared with front-end
		rh: null,		// active resize handler	// shared with front-end
		rp: false,		// flag: re-post is active	// shared with front-end
		so: String ('reverse'), // note sorting order		// shared with front-end
		sz: 38835,		// edit size			// shared with front-end
		tu: slash,		// textfile URI (full URI)	// shared with front-end

		// array menu services

		xm: false,		// examine menu is on
		x0: null,		// option 0 runner
		x1: null,		// option 1 runner
		x2: null,		// option 2 runner

		// navigation UI state, as managed internally to this file

		t0: null,		// timeout 0 handle		// pointer/cursor hide
		t1: null,		// timeout 1 handle		// focus new note box
		t2: null,		// timeout 2 handle		// login passport beat
		t3: null,		// timeout 3 handle		// check mail
		t4: null,		// timeout 4 handle		// array starters
		t5: null,		// timeout 5 handle		// array teleport mover
		t6: null,		// timeout 6 handle		// array teleport alert
		t7: null,		// timeout 7 handle		// array auto-cruise on
		t8: null,		// timeout 8 handle		// reset culling preview
		pb: null,		// timeout 2 servicing		// login passport beat
		bb: null,		// timeout 2 servicing		// login passport bundle

		er: false,		// edit reentry flag
		ig: empty,		// user ignorelist (string)
		il: avoid,		// user ignorelist (array)
		ii: clear,		// user ignorelist (index)
		io: false,		// user is a sysop		// disables the ignorelist
		ip: false,		// flag marking image presence
		kp: false,		// flag marking pkage presence

		fp: false,		// flag: watching "front page"
		jw: false,		// flag: watching paged "chat"
		nf: false,		// flag: watching the newsfeed
		rf: false,		// flag: watching rep registry
		ex: null,		// newsfeed unaccounted events	// flags notes yet-to-list
		rb: 0,			// newsfeed rewind_by argument	// a cursor, no reset need
		pi: 0,			// paged chat's rollback index

		SS: false,		// slideshow on 		// see slideshow functions
		ru: empty,		// return U.R.I 		// see slideshow functions
		mm: false,		// sliding flag 		// see slideshow functions
		pc: empty,		// picture cursor (type of)	// see slideshow functions
		rx: null,		// pointer move reference x	// O-S-K resize, slideshow
		sr: null,		// slide request		// see slideshow functions
		tm: 0,			// slide travel (maximum)	// see slideshow functions
		tr: 0,			// slide travel (record)	// see slideshow functions

		ls: new Object, 	// last search parameters
		ms: new Object, 	// registered new post markers
		mt: new Object, 	// message transaction codes' table

		// onscreen keyboard info, managed internally to this file

		ac: null,		// O-S-K typematic handler
		cf: false,		// flag: Fn modifier state
		ck: String ('0'),	// tri-state flag: Fn modifier off/single/continuous
		cv: empty,		// cursor visibility before keyboard resize
		ks: null,		// screen keyboard's typematic stepper (interval handle)
		ok: false,		// flag: on-screen keyboard is on
		sh: 1,			// current keyboard sizing handle coefficient (+1 or -1)
		sk: false,		// flag: on-screen keyboard is being resized
		sc: false,		// flag: on-screen keyboard size changed (significantly)

		// news counters, defaulting to zero, reported with "mail"

		cs: {

			announcements: 0,
			reps: 0,
			pages: 0,
			images: 0,
			authors: 0,
			products: 0,
			longtalks: 0,
			chiacchere: 0,
			jabberwocks: 0,
			mascellodons: 0,
			notifications: 0,
			annunciamocene: 0,

			clear_news: false,
			highlights: false

		},

		// note page access rights as reported, and state info concerning notes

		ar: {

			cp: false,	// can-post
			op: false,	// sys op
			au: false	// author

		},

		dl: new Array,		// note display list: notes received but not yet displayed
		kc: 0,			// note cursor: cursor value at top of current page
		nc: 0,			// note cursor: number of notes having been fetched so far
		nd: new Object, 	// note dictionary: notes "in hold", i.e. already received
		ri: null,		// note ID we're replying to
		rl: 0,			// note reply line number
		rn: 0,			// note reply - length in lines of note we are replying to
		rr: empty,		// note reply line backup,
		dr: null,		// note reply "disroll" request manager: one request/click

		// cached pre-processed globals

		crcTable: null,

		/*
		 *	pulsated callbacks
		 */

		ontcfocus: function () {

			// fires (once) when the text clip is focused for user input,
			// would normally display a help balloon on using the linker,
			// being set to the function that follows below...

		},

		tcfocus: function () {

			cui.shush ()

			this.showTip && setTimeout (function () { $('linkertip') && ($('linkertip').style.opacity = '1') }, 5E+2);
			this.showTip && setTimeout (function () { $('linkertip') && ($('linkertip').style.opacity = '0') }, 3500);

		}, // manage placeholder text upon focusing text clip

		/*
		 *	real-time events poller:
		 *	polls for events on the /ltn URL, currently used for notes only
		 *
		 *	      - this is a long-poll event system: the client posts a request given
		 *		a channel and a cursor (numeric, in base 36) and the server starts
		 *		periodically checking for new events that follow that cursor while
		 *		the client waits for the server's response: HTTP requests normally
		 *		time out after at least 30 seconds, so we can safely use that time
		 *		span (or a bit less, accounting for delays in IP traffic) to avoid
		 *		continuous polling, for the price of leaving a long request in the
		 *		heap of the server; as soon as the server detects events which are
		 *		of interest to our channel, it finally responds, having the client
		 *		process the new events in the response, while immediately starting
		 *		another request for further updates; the entire process is a cheap
		 *		substitute to "push" strategies, which can be risky unless servers
		 *		are efficiently balanced and guarded against malicious use... now,
		 *		it's not that Mary Lou isn't guarded, but it makes little sense to
		 *		keep alternatives to this (intrinsically) pretty safe event system
		 */

		ep: {

			reporter: null,
			timeout: null,
			cursor: null,
			delay: 30,
			slice: 0,
			chat: false,

			setup: function (args) {

			    let channel = be.string (args && args.channel).or (slash)
			    let persist = be.string (args && args.persist).or (empty)
			    let lastRow = be.string (args && args.lastRow).or (digit)
			    let handler = be.lambda (args && args.handler).or (idler)
			    let timeout = be.number (args && args.timeout).or (667)
			    let t_slice = be.number (args && args.t_slice).or (0)

				nav.ep.reporter = new Requester ({ notes: { channel: channel, persist: persist, handler: handler } })
				nav.ep.timeout = setTimeout (nav.ep.query, timeout)
				nav.ep.cursor = lastRow
				nav.ep.delay = 30
				nav.ep.slice = t_slice
				nav.ep.chat = false

				switch (channel.split (slash).slice (0, 2).join (slash).toLowerCase ()) {

					case 'sys/everlongtalk':
					case 'sys/chiaccheratona':

						nav.ep.chat = true

				}

				switch (channel.split (slash).slice (0, 3).join (slash).toLowerCase ()) {

					case 'sys/the/jabberwock':
					case 'sys/il/mascellodonte':

						nav.ep.chat = true

				}

			}, // setup: done entering pages for which the server broadcasts events

			clear: function () {

			    let running = nav.ep.reporter || { notes: { } }

				clearTimeout (nav.ep.timeout)

				if (running.requestInProgress) {

					running.notes.handler = idler
					running.request.abort ()

				}

				nav.ep.reporter = null
				nav.ep.timeout = null
				nav.ep.cursor = null
				nav.ep.delay = 30
				nav.ep.slice = 0

			}, // clear: done as part of page state reset chores, assuming no broadcast

			synch: function (args) {

			    let running = nav.ep.reporter || { notes: { } }
			    let channel = be.string (args && args.channel).or (slash)
			    let handler = be.lambda (running && running.notes.handler).or (idler)

				clearTimeout (nav.ep.timeout)

				if (running.requestInProgress) {

					running.notes.handler = idler
					running.request.abort ()

				}

				nav.ep.reporter = new Requester ({ notes: { channel: channel, handler: handler } })
				nav.ep.timeout = setTimeout (nav.ep.query, 667)
				nav.ep.cursor = nav.ep.cursor || digit

			}, // synchronize to new channel: when the current one undergoes re-titling

			query: function () {

				nav.ep.reporter && nav.ep.reporter.post ({

					uri: '/exec/ltn',

					pairs: [

						{ name: 'identIfic', value: be.string (localStorage.identity).or ('anonymous') },
						{ name: 'listen_to', value: nav.ep.reporter.notes.channel },
						{ name: 'news_feed', value: nav.ep.reporter.notes.persist },
						{ name: 'start_row', value: nav.ep.cursor }

					],

					onload: function (r) {

						try { r.response = JSON.parse (r.response) }

							catch (e) {

								return

							} // discard malformed response and break

							switch (r.response.mean) {

								case 'more':

									nav.ep.delay = 30			// reset polling delay to minimum
									r.notes.handler (r.response)		// pass the request to the handler:
									return					// this means we're too far behind...

									/*
									 *	in both cases when there's something new and when there isn't, we may
									 *	update our cursor: the server will tell us the next row in both cases
									 *	and if we're finding no news because nothing happened, that's normal,
									 *	but it may also be because the server-side cursor went "backwards" as
									 *	a consequence of a restart: many events and cursors are volatile, and
									 *	will be reset by a server shutdown; updating on "idle" will ensure we
									 *	synchronize to the new cursor even if that's below what we saw before
									 */

								case 'news':

									nav.ep.delay = 30			// reset polling delay to minimum
									r.notes.handler (r.response)		// pass the news to the handler

									// it is in theory possible to have this handler process all notes and see if
									// any of them was not made by this user, and only in that case post requests
									// to "denotify" - but it's pretty much a futile exercise, saving server time
									// and client traffic only in cases the user was talking to his/herself, when
									// server traffic might, by definition of that circumstance, be already "low"

									nav.ep.chat && new Requester ().post ({

										uri: '/exec/denotify',

										pairs: [

											{ name: 'username', value: nav.username () },
											{ name: 'identity', value: nav.identity () },
											{ name: 'callsign', value: nav.ep.reporter.notes.channel.toLowerCase () }

										]

									})

								case 'idle':

									nav.ep.timeout = setTimeout (nav.ep.query, nav.ep.slice || nav.ep.delay)

									nav.ep.delay = nav.ep.delay + 3E3	// delay next requests 3 more seconds
									nav.ep.cursor = (r.response.last)	// update your cursor - rinse, repeat

							} // filter idle, report and break "more"

					},

					onwhoa: function (r) {

						nav.ep.timeout = setTimeout (nav.ep.query, 15000)

					} // if the server errs, we're likely polling too much...

				}) // may last ~ 14 sec

			} // long-polling query handler

		}, // nav.ep

		/*
		 *	array navigation interface
		 */

		array: {

			dc: null,		// panels toggle, request
			el: false,		// enable labels, to pick up models
			ep: false,		// enable labels, preference record
			f1: null,		// pushed forward recently (timeout)
			f2: null,		// placed modelcard lc = 0 (timeout)
		     // ff: false,		// run in flicker-free mode
			lc: 0,			// placed modelcard to show label of
			om: false,		// orient model
			mo: 6,			// option below the cursor
			pd: false,		// panels disable
			po: null,		// panels opacity
			pp: true,		// panels presence preference
			pt: null,		// panels toggling timer (on resize)
			ra: null,		// reference y readout while turning (pitch)
			rb: null,		// reference x readout while turning (yaw)
			rx: null,		// reference x (e.g. sliding over "rainbow" icon)
			ry: null,		// reference y (e.g. sliding over "rainbow" icon)
			wc: 0,			// works count (don't laugh)
			wd: 0,			// deferred works' count
			wr: null,		// mouse wheel release timer

			/*
			 *	AMC3 "XZHL" states
			 */

			ax: false,		// anisotropic X scaler
			az: false,		// anisotropic Z scaler
			ah: false,		// anisotropic Y scaler (height)
			la: false,		// option: lay model

			/*
			 *	listener variables
			 */

			ch: null,		// areal channel
			ld: 3,			// poll delay (seconds)
			lr: null,		// last row
			rh: idler,		// response handler
			rq: null,		// instance of requester
			qt: null,		// query timeout handle

			/*
			 *	current model data
			 */

			modelCard:	0,	// model card index for labels
			modelName:	empty,	// model file name, without a provider
			modelType:	empty,	// model file type: currently only obj
			model:		null,	// model descriptor
			instance:	null,	// model instance
			runner: 	null,	// model label handler, last submitted
			toMenu: 	null,	// model label keyboard-driven tip
			holdDistance:	null,	// model distance from closest (held)

			/*
			 *	control panels' mapping
			 */

			controls: {

				unitToggle_v: {

					p: LEFT,
					l: 486, t: 538, r: 755, b: 677,
					f: function () { localStorage.per_h = per_h.innerText = t_per_h = { 'kph':'mph', 'mph':'kph' } [t_per_h] }

				},

				unitToggle_h: {

					p: RIGHT,
					l: 198, t: 538, r: 561, b: 677,
					f: function () { localStorage.above = above.innerText = t_above = { 'm':'ft', 'ft':'m' } [t_above] }

				},

				brake: {

					p: LEFT,
					l: 0, t: 692, r: 588, b: 847,
					f: function () { nav.array.brake () }

				},

				forward: {

					p: LEFT,
					l: 104, t: 0, r: 488, b: 378,
					f: function () { this.start ? nav.array.forward () : nav.array.forward (TMRATE * nav.st.live.el) }

				},

				pitchDown: {

					p: RIGHT,
					l: 565, t: 692, r: 755, b: 847,
					f: function () { this.start ? nav.array.pitchDown () : nav.array.pitchDown (TMRATE * nav.st.live.el) }

				},

				pitchUp: {

					p: RIGHT,
					l: 565, t: 535, r: 755, b: 692,
					f: function () { this.start ? nav.array.pitchUp () : nav.array.pitchUp (TMRATE * nav.st.live.el) }

				},

				rainbow: {

					p: RIGHT,
					l: 761, t: 528, r: 959, b: 686,
					f: function () { nav.array.rainbow () }

				},

				reverse: {

					p: LEFT,
					l: 200, t: 378, r: 388, b: 535,
					f: function () { this.start ? nav.array.reverse () : nav.array.reverse (TMRATE * nav.st.live.el) }

				},

				snap: {

					p: LEFT,
					l: 294, t: 535, r: 481, b: 692,
					f: function () { nav.array.snap (30, 30) }

				},

				turnBack: {

					p: LEFT,
					l: 108, t: 535, r: 294, b: 692,
					f: function () { nav.array.turnBack () }

				},

				turnLeft: {

					p: LEFT,
					l: 0, t: 378, r: 200, b: 535,
					f: function () { nav.array.turnLeft () }

				},

				turnRight: {

					p: LEFT,
					l: 388, t: 378, r: 584, b: 535,
					f: function () { nav.array.turnRight () }

				},

				yawLeft: {

					p: RIGHT,
					l: 383, t: 692, r: 563, b: 847,
					f: function () { this.start ? nav.array.yawLeft () : nav.array.yawLeft (TMRATE * nav.st.live.el) }

				},

				yawRight: {

					p: RIGHT,
					l: 767, t: 692, r: 959, b: 847,
					f: function () { this.start ? nav.array.yawRight () : nav.array.yawRight (TMRATE * nav.st.live.el) }

				}

			}, // all navigation panel controls

			corner: {

				cruiser: {

					p: LEFT, willVanish: true,
					l: 104, t: 0, r: 488, b: 378,
					f: function () { cruiser.style.opacity = 0 }

				},

				rainbow: {

					p: RIGHT,
					l: 767, t: 692, r: 959, b: 847,
					f: function () { nav.array.rainbow () }

				}

			}, // describes the rainbow icon as the sole active control, if panels are disabled

			/*
			 *	hide The Array
			 */

			hide: function () {

				scc.style.display = 'none'
				scc.style.opacity = '0'

				nav.st.ff && cancelAnimationFrame (nav.st.ff, nav.st.ff = null)
				nav.st.fh && clearInterval (nav.st.fh, nav.st.fh = null)
				nav.st.fk && clearTimeout (nav.st.fk, nav.st.fk = null)

			},

			/*
			 *	navigation methods
			 */

			brake: function () {

				nav.array.wr && clearTimeout (nav.array.wr, nav.array.wr = null)

				nav.st.speed = 0
				nav.st.live.mf = .75
			     // nav.st.live.ip = nav.st.ip

				cruiser.style.opacity = 0

			},

			cutAutoCruise: function () {

				if (nav.t7) {

					cruiser.style.opacity = 0
					nav.st.live.mf = nav.st.mf
					clearTimeout (nav.t7, nav.t7 = null)

				}

			},

			forward: function (k) {

				if (be.number (k).or (false) == false) {

				    let c = cruiser.style
				    let k = getComputedStyle (cruiser)

					clearTimeout (nav.array.f1)

					nav.array.f1 ? c.opacity = 1 - parseInt (k.opacity) : c.opacity = 0
					nav.array.f1 = setTimeout (function () { nav.array.f1 = null }, 200)

				}

				nav.st.live.mf = .997
			     // nav.st.live.ip = nav.st.ip
				nav.st.speed = be.number (nav.st.speed).or (0) + be.number (k).or (1)

			},

			pitchUp: function (k) {

			     // nav.st.live.ip = nav.st.ip
				nav.st.pitching = be.number (nav.st.pitching).or (0) + be.number (k).or (1)

			},

			pitchDown: function (k) {

			     // nav.st.live.ip = nav.st.ip
				nav.st.pitching = be.number (nav.st.pitching).or (0) - be.number (k).or (1)

			},

			rainbow: function () {

				clearTimeout (nav.array.ac)

				nav.array.ac = null
				nav.array.dc = nav.array.togglePanels.bind ({ set: true })

				cat.onpointermove = function (e) {

				    let lp = $('panel-l')
				    let rp = $('panel-r')

					if (nav.array.pd === false) {

					    let pr = devicePixelRatio || 1
					    let cx = e.clientX || nav.array.rx
					    let dx = pr * (cx - nav.array.rx)
					    let op = be.number (nav.array.po).or (1)

						if (Math.abs (dx) > 1) {

							nav.st.md = true
							nav.array.dc = null

							nav.array.rx = cx
							nav.array.po = Math.max (.2, Math.min (op - dx / 99, 1))

							lp && (lp.style.opacity = nav.array.po)
							rp && (rp.style.opacity = nav.array.po)

						}

					}

					e.preventDefault && e.preventDefault ()

				}

			},

			reverse: function (k) {

				nav.st.live.mf = .997
			     // nav.st.live.ip = nav.st.ip
				nav.st.speed = be.number (nav.st.speed).or (0) - be.number (k).or (1)

			},

			snap: function (ht, vt) {

			    let y = nav.st.yaw
			    let p = nav.st.pitch
			    let r = Math.round (y / 45) * 45

				if (Math.abs (y - r) < ht)

					nav.st.yaw = r

				if (Math.abs (p) < vt)

					nav.st.pitch = 0

			},

			togglePanels: function () {

			    let lp = $('panel-l')
			    let rp = $('panel-r')
			    let rb = $('rainbow')

				ray.onaction ()

				switch (nav.array.pd) {

					case false:

						scn.style.display = this && this.set ? 'none' : scn.style.display
						lp.style.opacity = rp.style.opacity = 0
						rb.style.opacity = Math.min (be.number (nav.array.po).or (1), .4)
						nav.array.pd = true
						break

					case true:

						scn.style.display = this && this.set ? 'block' : scn.style.display
						lp.style.opacity = rp.style.opacity = be.number (nav.array.po).or (1)
						rb.style.opacity = 0
						nav.array.pd = false

				}

				this && this.set && (nav.array.pp = nav.array.pd ? false : true)

			},

			turnBack: function () {

			     // nav.st.live.ip = nav.st.ip
				nav.st.roll = -30
				nav.st.yaw = be.number (nav.st.yaw).or (nav.st.rc.b) - 180

			},

			turnLeft: function () {

			     // nav.st.live.ip = nav.st.ip
				nav.st.roll = 6
				nav.st.yaw = be.number (nav.st.yaw).or (nav.st.rc.b) + 45

			},

			turnRight: function () {

			     // nav.st.live.ip = nav.st.ip
				nav.st.roll = -6
				nav.st.yaw = be.number (nav.st.yaw).or (nav.st.rc.b) - 45

			},

			yawLeft: function (k) {

			     // nav.st.live.ip = nav.st.ip
				nav.st.yawing = be.number (nav.st.yawing).or (0) + be.number (k).or (1)

			},

			yawRight: function (k) {

			     // nav.st.live.ip = nav.st.ip
				nav.st.yawing = be.number (nav.st.yawing).or (0) - be.number (k).or (1)

			},

			/*
			 *	seek an option in the TIO menu
			 */

			seek: function (option) {

			    let delta = option - nav.array.mo
			    let mover = option > nav.array.mo ? tio.kbFunctions.ro_right : tio.kbFunctions.ro_left.bind (delta = -delta)

				while (delta --) mover.call (nav.array.mo = option)

				tio.kbFunctions.ro_enter ()

			},

			/*
			 *	navigation keystrokes' handler
			 */

			handle: function (args) {

				switch (args.key.name) {

					case 'a':
					case 'd':
					case 'down':
					case 'left':
					case 'right':
					case 's':
					case 'space':
					case 'up':
					case 'w':
					case 'x':
					case 'z':

						if (nav.st.free === 0)

							return

						ray.onaction ()
						nav.array.cutAutoCruise ()

				} // check whether the keystroke corresponds to some kind of move: if yes, throttle up the animation rate

				if (lang === 'en')

					switch (args.key.name) {

						case 'c':

							nav.xm && (nav.array.seek (1))					// COPY (examine menu)
							nav.xm || (nav.array.instance && nav.array.seek (3))		// CONFIGURE (main menu)
							break

						case 'e':

							nav.array.seek (5)						// EXIT
							break

						case 'i':

							nav.xm || (nav.st.mc.active || nav.array.seek (2))		// IMPORT
							break

						case 'm':

							if (nav.xm)

								break

							args.and.alt && (nav.st.mc.active && nav.kb.amc3.owned.f ())	// toggle owned flag
							args.and.alt || (nav.array.seek (1))				// MAKE
							break

						case 'shiny':

							nav.xm && (nav.array.seek (2))					// NEVERMIND (examine menu)
							break

						case 'p':

							nav.xm && (nav.array.seek (0))					// PICK (examine menu)
							break

						case 'q':

							nav.xm || (nav.array.seek (0))					// QUICKTRIP
							break

						case 'r':

							nav.xm || (nav.st.mc.active && nav.array.seek (2))		// REMOVE
							nav.xm || (nav.st.mc.active || nav.array.seek (3))		// RECOGNIZE

					}

				if (lang === 'it')

					switch (args.key.name) {

						case 'e':

							nav.array.seek (5)						// ESCI
							break

						case 'g':

							nav.xm || (nav.array.seek (1))					// GENERA
							break

						case 'l':

							nav.xm && (nav.array.seek (2))					// LASCIA STARE (examine menu)
							break

						case 'm':

							nav.xm || (nav.st.mc.active && nav.kb.amc3.owned.f ())		// toggle owned flag
							break

						case 'p':

							nav.xm && (nav.array.seek (0))					// PRELEVA (examine menu)
							break

						case 'r':

							nav.xm && (nav.array.seek (1))					// REPLICA (examine menu)
							nav.xm || (nav.array.seek (3))					// RILEVA
							break

						case 's':

							if (nav.xm)

								break

							args.and.alt && nav.st.mc.active && nav.kb.amc3.solid.f ()	// toggle solid flag
							args.and.alt || (nav.array.instance && (args.and.bar = 1))	// SCARTA will count as SCARTA, not "reverse"
							args.and.alt || (nav.array.instance && nav.array.seek (2))	// SCARTA
							break

						case 't':

							nav.xm || (nav.array.seek (0))					// TRANSALTA
							break

						case 'i':

							nav.xm || (nav.array.instance && nav.array.seek (3))		// IMPOSTA
							nav.xm || (nav.array.instance || nav.array.seek (2))		// IMPORTA

					}

				if (nav.st.mc.active)

					switch (args.key.name) {

						case 'ccw':

							nav.array.instance.orient.yaw += 1 / 4
							break

						case 'cw':

							nav.array.instance.orient.yaw -= 1 / 4
							break

						case 'larger':

							nav.array.ax || nav.array.ah || nav.array.az || nav.updateModel ({ size: Math.min (nav.st.mc.size + 1 / 100, 2.0) })
							nav.array.ax && nav.updateModel ({ anix: Math.min (nav.st.mc.anis.x + 1 / 100, 2.0) })
							nav.array.ah && nav.updateModel ({ aniy: Math.min (nav.st.mc.anis.y + 1 / 100, 2.0) })
							nav.array.az && nav.updateModel ({ aniz: Math.min (nav.st.mc.anis.z + 1 / 100, 2.0) })
							break

						case 'smaller':

							nav.array.ax || nav.array.ah || nav.array.az || nav.updateModel ({ size: Math.max (0.1, nav.st.mc.size - 1 / 100) })
							nav.array.ax && nav.updateModel ({ anix: Math.max (0.1, nav.st.mc.anis.x - 1 / 100) })
							nav.array.ah && nav.updateModel ({ aniy: Math.max (0.1, nav.st.mc.anis.y - 1 / 100) })
							nav.array.az && nav.updateModel ({ aniz: Math.max (0.1, nav.st.mc.anis.z - 1 / 100) })
							break

						case 'red':
						case 'orange':
						case 'yellow':
						case 'green':
						case 'cyan':
						case 'blue':
						case 'purple':
						case 'pink':
						case 'magenta':
						case 'white':
						case 'lightgrey':
						case 'darkgrey':
						case 'solid':
						case 'flat':
						case 'shiny':

							nav.st.mc.active && nav.kb.amc3 [args.key.name].f ()
							break

						case '1':

							args.and.alt && nav.kb.amc3.lowest.f ()
							args.and.alt || nav.kb.amc3.largest.f ()
							break

						case '2':

							args.and.alt && nav.kb.amc3.lower.f ()
							args.and.alt || nav.kb.amc3.larger.f ()
							break

						case '3':

							args.and.alt && nav.kb.amc3.low.f ()
							args.and.alt || nav.kb.amc3.large.f ()
							break

						case '4':

							args.and.alt && nav.kb.amc3.mid.f ()
							args.and.alt || nav.kb.amc3.medium.f ()
							break

						case '5':

							args.and.alt && nav.kb.amc3.high.f ()
							args.and.alt || nav.kb.amc3.small.f ()
							break

						case '6':

							args.and.alt && nav.kb.amc3.higher.f ()
							args.and.alt || nav.kb.amc3.smaller.f ()
							break

						case '7':

							args.and.alt && nav.kb.amc3.highest.f ()
							args.and.alt || nav.kb.amc3.smallest.f ()
							break

					}

				switch (args.key.name) {

					case '8':

						nav.xm || nav.array.seek (4)
						break

					case 'a':

						nav.array.turnLeft ()
						break

					case 'd':

						nav.array.turnRight ()
						break

					case 'down':

						args.and.ctrl && nav.array.reverse ()
						args.and.ctrl || nav.array.pitchDown ()
						break

					case 'h':

						args.and.shift && nav.kb.amc3.ah.f ()
						break

					case 'l':

						args.and.shift && nav.kb.amc3.la.f ()
						break

					case 'left':

						args.and.ctrl && nav.array.turnLeft ()
						args.and.ctrl || nav.array.yawLeft ()
						break

					case 'pageDown':

						nav.array.pd || nav.array.togglePanels.call ({ set: true })
						break

					case 'pageUp':

						nav.array.pd && nav.array.togglePanels.call ({ set: true })
						break;

					case 'right':

						args.and.ctrl && nav.array.turnRight ()
						args.and.ctrl || nav.array.yawRight ()
						break

					case 's':

						args.and.bar || (nav.array.reverse ())
						break

					case 'space':

						nav.array.brake ()
						break

					case 'tab':

						nav.array.runner && (nav.xm ? nav.array.seek (2) : nav.array.runner.box.onclick ())
						break

					case 'up':

						args.and.ctrl && nav.array.forward (1)
						args.and.ctrl || nav.array.pitchUp ()
						break

					case 'w':

						args.and.shift && (cruiser.style.opacity = 1 - parseInt (getComputedStyle (cruiser).opacity))
						args.and.shift || (cruiser.style.opacity = 0)
						nav.array.forward (1)
						break

					case 'x':

						args.and.shift && nav.kb.amc3.ax.f ()
						args.and.shift || nav.array.snap (30, 30)
						break

					case 'z':

						args.and.shift && nav.kb.amc3.az.f ()
						args.and.shift || nav.array.turnBack ()
						break

				} // switch through moves

			}, // nav.array.handle

			/*
			 *	event handlers
			 */

			keydown: function (pEvent) {

			    let tEvent = pEvent || (window.event) || null
			    let target = tEvent && (tEvent.target || tEvent.srcElement || null)

			  const nameOf = {

					// navigation and menu

					32:	'space',
					33:	'pageUp',
					34:	'pageDown',
					37:	'left',
					38:	'up',
					39:	'right',
					40:	'down',
					56:	'8',
					65:	'a',
					67:	'c',
					68:	'd',
					69:	'e',
					71:	'g',
					72:	'h',
					73:	'i',
					76:	'l',
					77:	'm',
					80:	'p',
					81:	'q',
					82:	'r',
					83:	's',
					84:	't',
					87:	'w',
					88:	'x',
					90:	'z',

					// AMC3 model configuration panel

					103:	'red',		// keypad 7
					104:	'orange',	// keypad 8
					105:	'yellow',	// keypad 9
					100:	'green',	// keypad 4
					101:	'cyan', 	// keypad 5
					102:	'blue', 	// keypad 6
					97:	'purple',	// keypad 1
					98:	'pink', 	// keypad 2
					99:	'magenta',	// keypad 3
					96:	'lightgrey',	// keypad 0
					110:	'darkgrey',	// keypad .
					106:	'white',	// keypad *
					188:	'ccw',		// < (,)
					190:	'cw',		// > (.)
					107:	'larger',	// keypad +
					109:	'smaller',	// keypad -
					86:	'solid',	// V
					66:	'flat', 	// B
					78:	'shiny',	// N (owned: M)
					49:	'1',		// thickness/spacing 1, (alt) threshold 1
					50:	'2',		// thickness/spacing 2, (alt) threshold 2
					51:	'3',		// thickness/spacing 3, (alt) threshold 3
					52:	'4',		// thickness/spacing 4, (alt) threshold 4
					53:	'5',		// thickness/spacing 5, (alt) threshold 5
					54:	'6',		// thickness/spacing 6, (alt) threshold 6
					55:	'7',		// thickness/spacing 7, (alt) threshold 7

					// invoke last runner

					9:	'tab'

				} // nameOf

				if (target) {

					target.nodeType == 3 && (target = target.parentNode)

					switch (target.tagName) {

						case 'INPUT':
						case 'SELECT':
						case 'TEXTAREA':

							return

					}

				}

				tEvent && nav.array.handle ({

					key: { name: nameOf [tEvent.keyCode] || 'unknown' },
					and: { shift: tEvent.shiftKey, ctrl: tEvent.ctrlKey, alt: tEvent.altKey }

				})

				tEvent && tEvent.keyCode === 9 && tEvent.preventDefault ()

			}, // nav.array.keydown

			keyup: function () {

			     // nav.st.live.ip = nav.st.ip
				nav.st.live.mf = nav.st.mf

			}, // nav.array.keyup

			pointerdown: function (e) {

				if (nav.st.free) {

					nav.array.rx = e.clientX || null
					nav.array.ry = e.clientY || null

					nav.array.ra = nav.st.rc.a
					nav.array.rb = nav.st.rc.b

					switch (e.button || 0) {

						case 0:

						    let w = innerWidth
						    let h = innerHeight
						    let f = false
						    let k = undefined
						    let r = undefined

							switch (w > h) {

								case true:  k = 960 / (.28 * w); break
								case false: k = 848 / (.25 * h); break

							}

							for (let i in (c = nav.array.pd && nav.array.corner || nav.array.controls)) {

							    let m = n = x = y = undefined

								r = c [i]

								switch (r.p) {

									case LEFT:

										m = h - (848 / k)
										x = k * (e.clientX)
										y = k * (e.clientY - m)

										break

									case RIGHT:

										m = h - (848 / k)
										n = w - (960 / k)
										x = k * (e.clientX - n)
										y = k * (e.clientY - m)

										break

								}

								x < r.l || y < r.t || x > r.r || y > r.b
									|| r.f.call ({

										start: f = true,
										where: nav.array.ac = setTimeout (nav.array.typematicStart.bind ({ handler: r.f }), 300)

									})

								if (f === true)

									break

							}

							nav.array.ac || nav.array.dc || (cat.onpointermove = nav.array.pointermove)
							nav.array.ac && r.willVanish && (cat.onpointermove = nav.array.pointermove)
							break

						case 1:

							nav.array.brake ()
							break

						case 2:

							nav.array.snap (30, 30)
							break

					}

					ray.onaction ()
					nav.array.cutAutoCruise ()

				}

				nav.st.md = false
				nav.st.pd = true
				e.preventDefault && e.preventDefault ()

			}, // nav.array.pointerdown

			pointermove: function (e) {

				if (nav.st.free) {

				    let pr = devicePixelRatio || 1
				    let cx = e.clientX || nav.array.rx
				    let cy = e.clientY || nav.array.ry
				    let dx = pr * (cx - nav.array.rx)
				    let dy = pr * (cy - nav.array.ry)
				    let dm = nav.st.rc.d / nav.st.live.pr
				    let py = nav.st.yaw
				    let pi = Math.PI
				    let p2 = Math.PI / 2

					cy === null || (nav.st.pitch = nav.array.ra + 141 * Math.sin (.5 * Math.max (-pi, Math.min (p2 * dy / dm, pi))))
					cx === null || (nav.st.yaw   = nav.array.rb + 141 * Math.sin (.5 * Math.max (-pi, Math.min (p2 * dx / dm, pi))))

				     // nav.st.live.ip = nav.st.ip
					nav.st.roll = be.number (nav.st.roll).or (0) + .5 * (nav.st.yaw - py)

				}

				nav.st.md = true
				e.preventDefault && e.preventDefault ()

			}, // nav.array.pointermove

			pointerup: function (e) {

				if (nav.st.pd && tio.keyboardHooked)

					nav.array.dc || nav.st.md || nav.gr || tio.onpickrun ({ label: t_exit })

				clearTimeout (nav.array.ac)

				cat.onpointermove = null

				nav.st.pd = false

			     // nav.st.live.ip = nav.st.ip
				nav.st.live.mf = nav.st.mf

				nav.array.dc && nav.array.dc.call ()
				nav.array.ac = null
				nav.array.dc = null

				e.preventDefault && e.preventDefault ()

			}, // nav.array.pointerup

			wheel: function (e) {

				clearTimeout (nav.array.wr)

				ray.onaction ()
				nav.array.cutAutoCruise ()

				nav.st.live.mf = .997
			     // nav.st.live.ip = nav.st.ip
				nav.array.wr = setTimeout (function () { nav.st.live.mf = nav.st.mf }, 100)
				nav.st.speed = be.number (nav.st.speed).or (0) - Math.sign (be.number (e.deltaY).or (0))

				e.preventDefault && e.preventDefault ()

			},

			/*
			 *	simulated keypress repeat
			 */

			typematicStart: function () {

				nav.array.ac = this

			},

			/*
			 *	creates an instance
			 *	out of cached model contents
			 */

			create: function (instance, index, que) {

			    let workload = nav.array.wc + nav.array.cromer

				if (que && workload > 14) {

					setTimeout (nav.array.create.bind ({ deferred: { instance: instance, index: index, que: que, delay: ++ nav.array.wd } }), nav.array.wd)
					return

				} // defer creation if too many workers are, er, working

				if (this.deferred) {

				    let X = Math.round (nav.st.rc.x / 321868)
				    let Z = Math.round (nav.st.rc.z / 321868)
				    let x = Math.round (this.deferred.instance.origin.x / 321868)
				    let z = Math.round (this.deferred.instance.origin.z / 321868)

					if (Math.abs (X - x) > 1)

						return

					if (Math.abs (Z - z) > 1)

						return

					if (workload > 14) {

						setTimeout (nav.array.create.bind (this), this.deferred.delay)
						return

					} // still too crowded? keep deferring this item

					instance = this.deferred.instance
					index = this.deferred.index
					que = this.deferred.que

				} // reprising deferred creation if object still in view

			    let mFile = be.string (instance && instance.modelFile).or (empty)
			    let basic = mFile.split (slash).pop ()
			    let mData = be.object (nav.array.models [mFile] || nav.array.basics [basic]).or (false)
			    let model = be.string (mData.model).or (null)

			     // instance.anis	|| (instance.anis = { x: 1, y: 1, z: 1 })	//	these make the old test world compatible
			     // instance.lay	|| (instance.lay = 0)				//	with what we have, in the end and out of
			     // instance.weight || (instance.weight = 1)			//	stuff I did not implement in alpha stage

				model ? setTimeout (function () {

					setTimeout (function () {

					    let modelGenerator = new Worker (modelGeneratorObjectURL)

						modelGenerator.postMessage ({

							model: model,
							instance: instance

						})

						modelGenerator.onmessage = function (e) {

						  const submit = function (instance, model) {

								nav.submitModel ({

									instance: {

										model:		model,

										edge:		instance.edge,
										size:		instance.size,
										lay:		instance.lay,

										anis: {

											x:	instance.anis.x,
											y:	instance.anis.y,
											z:	instance.anis.z

										},

										origin: {

											x:	instance.origin.x,
											y:	instance.origin.y,
											z:	instance.origin.z

										},

										orient: {

											pitch:	instance.orient.pitch,
											yaw:	instance.orient.yaw,
											roll:	instance.orient.roll

										},

										spacing:	instance.spacing,
										thickness:	instance.thickness,
										threshold:	instance.threshold,

										solid:		instance.solid,
										flat:		instance.flat,
										shiny:		instance.shiny,
										owned:		instance.owned,

										weight: 	instance.weight,
										owner:		instance.owner,
										modelFile:	instance.modelFile,

										claim:		instance.claim || null

									},

									monadic: true,
									created: true

								})

							} // submit, repeated step below

							for (let varies of e.data.mores)

								Object.setPrototypeOf (varies, Model.prototype)
								Object.setPrototypeOf (e.data, MultiModel.prototype)

							if (que) {

								que.items [index] = {

									instance: instance,
									model: e.data

								}

								if (-- que.count === 0)

									for (let i = 0; i < que.items.length; ++ i)

										submit (que.items [i].instance, que.items [i].model)

							} // no single instance (full areal spawning)

							que || submit (instance, e.data)

							nav.array.wc = Math.max (0, nav.array.wc - 1)
							nav.array.cromer = Math.max (0, nav.array.cromer - 1)

						} // model generated (and worker's terminated itself)

					}, 9 * (++ nav.array.wc))

				}, 3 * (++ nav.array.cromer)) : 0

			}, // nav.array.create

			/*
			 *	matches two instances, the first of which,
			 *	in any known form, the other in normalized
			 *	form: returns true if they're visually the
			 *	same, and logically share the same "owner"
			 */

			match: function (live, norm) {

				if (live.solid === norm.solid)						//
				if (live.flat  === norm.flat)						//	all flags first,
				if (live.shiny === norm.shiny)						//	because they're quick
				if (live.owned === norm.owned)						//
													//
				if (live.modelFile === norm.modelFile)					//	model and author name
				if (live.owner === norm.owner)						//	owner name - may not be author's
				if (live.edge === norm.edge)						//	color is less distinctive
													//
				if (norm.origin.x === parseFloat (live.origin.x.toFixed (3)))		//
				if (norm.origin.z === parseFloat (live.origin.z.toFixed (3)))		//
				if (norm.origin.y === parseFloat (live.origin.y.toFixed (3)))		//
				if (norm.orient.yaw === parseFloat (live.orient.yaw.toFixed (3)))	//
				if (norm.size === parseFloat (live.size.toFixed (3)))			//	all numeric values to 3 decimals:
				if (norm.anis.x === parseFloat (live.anis.x.toFixed (3)))		//	orientation's pitch and roll may
				if (norm.anis.y === parseFloat (live.anis.y.toFixed (3)))		//	not change in "planted" objects
				if (norm.anis.z === parseFloat (live.anis.z.toFixed (3)))		//
				if (norm.lay === parseFloat (live.lay.toFixed (3)))			//
				if (norm.spacing === parseFloat (live.spacing.toFixed (3)))		//
				if (norm.thickness === parseFloat (live.thickness.toFixed (3))) 	//
				if (norm.threshold === parseFloat (live.threshold.toFixed (3))) 	//
													//
					return (true)							//	if all of the above was true
					return (false)							//	if something would not match

			}, // nav.array.match

			/*
			 *	removes an instance,
			 *	described in normalized form
			 */

			remove: function (args) {

			    let instance = be.object (args && args.instance).or (null)
			    let toRemove = null

				if (instance) {

					for (let w = World.layers.root, wi = system_models; wi < w.length; ++ wi)

						if (w [wi] && nav.array.match (w [wi], instance)) {

							toRemove = w [wi]
							break

						}

					if (toRemove) {

						delete (World.interactables [toRemove.card])	// remove the label's logics
						toRemove.label.remove ()			// visually remove the label
						toRemove.remove ()				// then, remove the instance

						return						// don't look for kids, then

					} // one found (as a root)

					for (let k = World.layers.kids, ki = system_childs; ki < k.length; ++ ki)

						if (k [ki] && nav.array.match (k [ki], instance)) {

							toRemove = k [ki]
							break

						}

					if (toRemove) {

						delete (World.interactables [toRemove.card])	// remove the label's logics
						toRemove.label.remove ()			// visually remove the label
						toRemove.remove ()				// then, remove the instance

					} // one found (into kids)

				} // one given

			}, // nav.array.remove

			/*
			 *	loader decrement
			 */

			m1: function () {

				setTimeout (function () {

					/*
					 *	this may happen immediately and will drop
					 *	the loading counter towards zero, but the
					 *	timeout prevents the bar from flashing in
					 *	and out of its non-zero state where loads
					 *	complete quickly enough: hence, it's just
					 *	a cosmetic delay, currently kept at ~1 s.
					 */

					nav.array.loader = Math.max (0, nav.array.loader - 1)

				}, 999)

			}, // nav.array.m1

			/*
			 *	areals and models' caches
			 */

			actual: undefined,	// actual registered areal
			bromer: 0,		// areal browsing interval
			modmer: 0,		// model browsing interval
			cromer: 0,		// model creation interval
			loader: 0,		// loading bar accumulator

			areals: Object (),	// global areals cache by areacode
			models: Object (),	// global models cache by model ID (out of author and model name)
			spawnd: Object (),	// global hashtable of areals in view, resolving refresh timeouts
			exists: Object (),	// global hashtable of areals in existence, i.e. holding contents
			counts: Object (),	// global models counts, to browse
			timers: Object (),	// browse timers for areals/models
		     // bundle: Object (),	// global arrays with model timers (single-model loading only)

			basics: {

				post:			{ crc32: '21a5d495', model: rm ('post') 		},
				tile:			{ crc32: '69045b7b', model: rm ('tile') 		},
				path_1x1:		{ crc32: '63942e5d', model: rm ('path_1x1')		},
				path_2x2:		{ crc32: '22bbe459', model: rm ('path_2x2')		},
				tree:			{ crc32: '56210380', model: rm ('tree') 		},
				wall_x1:		{ crc32: 'cdf4719b', model: rm ('wall_x1')		},
				wall_x2:		{ crc32: '64127700', model: rm ('wall_x2')		},
				wall_x3:		{ crc32: '2a2b4433', model: rm ('wall_x3')		},
				wall_x6:		{ crc32: 'cf874d0d', model: rm ('wall_x6')		},
				dice:			{ crc32: 'ca47854b', model: rm ('dice') 		},
				seam:			{ crc32: 'f4a0d1fb', model: rm ('seam') 		},
				decoseam:		{ crc32: '35f1a53b', model: rm ('decoseam')		},
				icoseam:		{ crc32: '6274f098', model: rm ('icoseam')		},
				coin:			{ crc32: 'b2a6cd5d', model: rm ('coin') 		},
				ring:			{ crc32: 'ae3d0d03', model: rm ('ring') 		},
				pole:			{ crc32: 'a2dd7c5b', model: rm ('pole') 		},
				cone:			{ crc32: '437e15db', model: rm ('cone') 		},
				ball:			{ crc32: 'a6aacf14', model: rm ('ball') 		},
				spire:			{ crc32: '90ff0f83', model: rm ('spire')		},
				dish:			{ crc32: '60510f9b', model: rm ('dish') 		},
				glass:			{ crc32: '74976861', model: rm ('glass')		},
				fork:			{ crc32: '19006f7c', model: rm ('fork') 		},
				knife:			{ crc32: 'a154e42c', model: rm ('knife')		},
				spoon:			{ crc32: '85bba444', model: rm ('spoon')		},
				mug:			{ crc32: '63645cac', model: rm ('mug')			},
				cup:			{ crc32: 'a4b61503', model: rm ('cup')			},
				teapot: 		{ crc32: '9cf23f3c', model: rm ('teapot')		},
				moka:			{ crc32: '9c6fca2a', model: rm ('moka') 		},
				bottle: 		{ crc32: 'a95d9924', model: rm ('bottle')		},
				a:			{ crc32: 'ae223671', model: rm ('a')			},
				b:			{ crc32: '2fc53835', model: rm ('b')			},
				c:			{ crc32: '82534c48', model: rm ('c')			},
				d:			{ crc32: 'ff8121a9', model: rm ('d')			},
				e:			{ crc32: '3a457173', model: rm ('e')			},
				f:			{ crc32: '9a9a0403', model: rm ('f')			},
				g:			{ crc32: 'a275af57', model: rm ('g')			},
				h:			{ crc32: 'be88f7cc', model: rm ('h')			},
				i:			{ crc32: 'be8a362c', model: rm ('i')			},
				j:			{ crc32: 'ad4915c0', model: rm ('j')			},
				k:			{ crc32: '7c50fae7', model: rm ('k')			},
				l:			{ crc32: '1fb05e26', model: rm ('l')			},
				m:			{ crc32: '5022fb8c', model: rm ('m')			},
				n:			{ crc32: '14984acd', model: rm ('n')			},
				o:			{ crc32: '1cc316a9', model: rm ('o')			},
				p:			{ crc32: '556d74b1', model: rm ('p')			},
				q:			{ crc32: '39338893', model: rm ('q')			},
				r:			{ crc32: '105647b4', model: rm ('r')			},
				s:			{ crc32: '7e5be121', model: rm ('s')			},
				t:			{ crc32: '1fc814e3', model: rm ('t')			},
				u:			{ crc32: '6878ad0f', model: rm ('u')			},
				v:			{ crc32: 'e38fc33e', model: rm ('v')			},
				w:			{ crc32: '4ed8f8ff', model: rm ('w')			},
				x:			{ crc32: '30ceb434', model: rm ('x')			},
				y:			{ crc32: 'd2fb1051', model: rm ('y')			},
				z:			{ crc32: '4c67b819', model: rm ('z')			},
				1:			{ crc32: '9df8060d', model: rm ('1')			},
				2:			{ crc32: 'fd35011d', model: rm ('2')			},
				3:			{ crc32: '21813c3e', model: rm ('3')			},
				4:			{ crc32: '212543e1', model: rm ('4')			},
				5:			{ crc32: '86b4664b', model: rm ('5')			},
				6:			{ crc32: 'bcf0b868', model: rm ('6')			},
				7:			{ crc32: '8cbcf883', model: rm ('7')			},
				8:			{ crc32: '112b1d44', model: rm ('8')			},
				9:			{ crc32: '947a5eac', model: rm ('9')			},
				0:			{ crc32: '3808ad30', model: rm ('0')			},
				dash:			{ crc32: 'a3a6e5c6', model: rm ('dash') 		},
				quote:			{ crc32: '41ef83ba', model: rm ('quote')		},
				qmark:			{ crc32: '3d3c8ce8', model: rm ('qmark')		},
				landmark_level: 	{ crc32: '7f59d371', model: rm ('landmark_level')	},
				landmark_upward:	{ crc32: 'fb8a59ed', model: rm ('landmark_upward')	},
				landmark_downward:	{ crc32: '17b5d623', model: rm ('landmark_downward')	}

			},

			cached: function (args) {

			    let areal = be.string (args && args.areal).or (false)
			    let model = be.string (args && args.model).or (false)
			    let crc32 = be.string (args && args.crc32).or (digit)
			    let store = be.object (areal ? nav.array.areals [areal] : nav.array.models [model] || nav.array.basics [model.split (slash).pop ()]).or (false)

				if (areal)

					return (store ? store.browsed + 6E5 > Date.now () ? store : false : false)

				if (model)

					return (store ? store.crc32 === crc32 ? store.model : false : false)

				return (false)

			}, // nav.array.cached

			/*
			 *	Array browser
			 */

			browse: function (args) {

			    let areal = be.string (args && args.areal).or (empty)
			    let batch = be.vector (args && args.batch).or (false)
			    let model = be.string (args && args.model).or (empty)
			    let gives = be.object (args && args.gives).or (false)
			    let serve = be.object (args && args.serve).or (false)

				if (serve) {

					serve.areal = be.string (serve.areal).or ('9999.9999')
					serve.stuff = be.vector (serve.stuff).or ([ /* ? */ ])

				} // normalize data types to the expected ones: string literal, and array

				areal && new Requester ().post ({

					onwhoa: function (r) {

						clearTimeout (nav.array.timers [areal] || null)
						nav.array.timers [areal] = null
						nav.array.m1 ()

					},

					onload: function (r) {

						clearTimeout (nav.array.timers [areal] || null)

						try { r.response = JSON.parse (r.response) }

							catch (e) {

								nav.array.timers [areal] = null
								nav.array.m1 ()
								return

							} // discard malformed response and break

							r.response.length || (nav.array.areals [areal] = {

								settled: 0,
								content: Array (),
								browsed: Date.now ()

							}) // contains nothing and there's no first entry

							r.response.length && (nav.array.areals [areal] = {

								settled: r.response.shift ().value,
								content: r.response,
								browsed: Date.now ()

							}) // contains something, first entry is capacity

						nav.array.spawn ({ areal: areal, stuff: r.response, rLoad: true })
						nav.array.timers [areal] = null
						nav.array.m1 ()

					}, uri: '/exec/browseAreal', pairs: [ { name: 'areacode', value: areal } ]

				}) // browse an areal

				batch && new Requester ().post ({

					onwhoa: function (r) {

						clearTimeout (nav.array.timers [serve.areal + aster] || null)
						nav.array.timers [serve.areal + aster] = null
						nav.array.m1 ()

					},

					onload: function (r) {

						clearTimeout (nav.array.timers [serve.areal + aster] || null)

						try { r.response = JSON.parse (r.response) }

							catch (e) {

								nav.array.timers [serve.areal + aster] = null
								nav.array.m1 ()
								return

							} // discard malformed response and break

						for (let entry in r.response) {

							nav.array.models [entry] = {

								crc32: r.response [entry].crc32,
								model: r.response [entry].model

							}

							if (nav.array.counts [serve.areal])

								if (-- nav.array.counts [serve.areal] === 0) {

								     // console.log (`serve: ${serve.areal}`)

									nav.array.exists [serve.areal] = true
									let que = { count: serve.stuff.length, items: new Array }
									serve.stuff.forEach ((entry, index) => nav.array.create (entry.instance, index, que))

								}

						}

						nav.array.timers [serve.areal + aster] = null
						nav.array.m1 ()

					}, uri: '/exec/browseBatch', pairs: [ { name: 'modelIDs', value: batch.join () } ]

				}) // browses a model batch

				model && new Requester ().post ({

					onwhoa: function (r) {

						clearTimeout (nav.array.timers [model] || null)
						nav.array.timers [model] = null
						nav.array.m1 ()

					},

					onload: function (r) {

						clearTimeout (nav.array.timers [model] || null)

						try { r.response = JSON.parse (r.response) }

							catch (e) {

								nav.array.timers [model] = null
								nav.array.m1 ()
								return

							} // discard malformed response and break

							nav.array.models [model] = {

								crc32: r.response.crc32,
								model: r.response.model

							}

						if (gives) {

							nav.array.timers [model] = null
							nav.array.create (gives)
							nav.array.m1 ()
							return

						}

						if (serve)

							if (nav.array.counts [serve.areal])

								if (-- nav.array.counts [serve.areal] === 0) {

								     // console.log (`serve: ${serve.areal}`)

									nav.array.exists [serve.areal] = true
									let que = { count: serve.stuff.length, items: new Array }
									serve.stuff.forEach ((entry, index) => nav.array.create (entry.instance, index, que))

								}

						nav.array.timers [model] = null
						nav.array.m1 ()

					}, uri: '/exec/browseModel', pairs: [ { name: 'model_id', value: model } ]

				}) // browses a model

			}, // nav.array.browse

			/*
			 *	browses all 9 surrounding areals at once
			 */

			spawnAll: function () {

				++ nav.array.loader

				new Requester ().post ({

					onwhoa: function (r) {

						nav.array.loader = Math.max (0, nav.array.loader - 1)

					},

					onload: function (r) {

						setTimeout (function () {

							/*
							 *	this may happen immediately and will drop
							 *	the loading counter back at zero, but the
							 *	timeout prevents the bar from flashing in
							 *	and out of its non-zero state where loads
							 *	complete quickly enough: hence, it's just
							 *	a cosmetic delay, currently kept at ~2 s.
							 */

							nav.array.loader = Math.max (0, nav.array.loader - 1)

						}, 2E3)

						try { r.response = JSON.parse (r.response) }

							catch (e) {

								return

							} // discard malformed response and break

						for (let areal in r.response) {

						    let content = r.response [areal]

							content.length || (nav.array.areals [areal] = {

								settled: 0,
								content: Array (),
								browsed: Date.now ()

							}) // contains nothing and there's no first entry

							content.length && (nav.array.areals [areal] = {

								settled: content.shift ().value,
								content: content,
								browsed: Date.now ()

							}) // contains something, first entry is capacity

							nav.array.spawn ({ areal: areal })

						} // each areal in the response

					}, uri: '/exec/spawn', pairs: [ { name: 'areacode', value: nav.array.actual } ]

				}) // request

			}, // nav.array.spawnAll

			/*
			 *	spawns an areal,
			 *	given an areacode and optional content, { stuff }
			 */

			spawn: function (args) {

			    let areal = be.string (args && args.areal).or (be.string (this && this.areal).or (point))
			    let rLoad = be.switch (args && args.rLoad).or (be.switch (this && this.rLoad).or (false))
			    let stuff = be.vector (args && args.stuff).or (be.switch (this && this.stuff).or (false))

				/*
				 *	when requested to, void and initialize the ephemeral areal,
				 *	the central/entry one: this requires no actual browsing and
				 *	always spawns as void
				 */

				if (areal === '4792.4792') {

					nav.array.areals [areal] = {

						settled: 0,		// allow temporary metering
						content: Array (),	// ephemeral is always void
						browsed: Date.now ()	// and is always up to date

					}

					return

				} // manage 4792.4792 as special case

				/*
				 *	when an areal already spawned, spawning it again implies it
				 *	first needs to de-spawn, unless this function's called back
				 *	after browsing the areal's contents; however,
				 *
				 *	      - an areal for which "spawnd" timer/flag is set means
				 *		it either completed its browsing for content and it
				 *		materialized (where "exists" is also set), OR, that
				 *		it's been queried for content and we're waiting for
				 *		the server's response, and if that's the case (when
				 *		"exists" wasn't also set) we still call despawn, to
				 *		invalidate its ongoing timer and any other "debris"
				 *		from previous incomplete attempts to spawn the same
				 *		areal, and
				 *
				 *	      - the same occurs where the areal needs to "refresh",
				 *		because it went stale while in spawned state around
				 *		the current areal (which is kept up to date in real
				 *		time, and needs to refresh timer);
				 *
				 *	      - lastly, if the areal materialized (exists) and this
				 *		function was not called to refresh (rLoad) it, such
				 *		as while crossing between areals, we do nothing and
				 *		just update its refresh timer, assuming the areal's
				 *		still in view, and might need such periodic refresh
				 */

				if (nav.array.spawnd [areal]) {

					while (nav.array.exists [areal]) {

						if (rLoad) break

					    let fn = nav.array.spawn.bind ({ areal: areal, rLoad: true })
					    let t = 62E4 + nav.array.areals [areal].browsed - Date.now ()

						clearTimeout (nav.array.spawnd [areal] || null)
						nav.array.spawnd [areal] = areal === nav.array.actual || setTimeout (fn, t)

						return

					} // handling: it has spawned

					stuff || nav.array.despawn ({ areal: areal })

				} // areal has spawned or is going to

				/*
				 *	when content isn't given (which is the case of direct calls
				 *	to this function, otherwise being called after browsing one
				 *	of the areals) see if this areal is cached: if it's not, or
				 *	if its cached version is considered "stale", set up a timer
				 *	to browse it, which will call back here to pass contents as
				 *	found in the server's response; if it IS still cached, take
				 *	contents from cache and proceed to spawn those items, after
				 *	updating its refresh timer
				 */

				if (stuff === false) {

					stuff = nav.array.cached ({ areal: areal }).content || false

					if (stuff === false) {

					     // console.log (`spawn: ${areal} (not cached or stale)`)

						nav.array.timers [areal] = (nav.array.timers [areal]) || setTimeout (function () {

						     // console.log (`query: ${areal}`)
							nav.array.browse ({ areal: areal, hence: ++ nav.array.loader })
							nav.array.bromer = Math.max (0, nav.array.bromer - 333)

						}, nav.array.bromer += 333)

						clearTimeout (nav.array.spawnd [areal] || null)
						nav.array.spawnd [areal] = areal === nav.array.actual || setTimeout (nav.array.spawn.bind ({ areal: areal, rLoad: true }), 61E4)

						return

					} // not cached yet (query)

				    let fn = nav.array.spawn.bind ({ areal: areal, rLoad: true })
				    let t = 62E4 + nav.array.areals [areal].browsed - Date.now ()

					clearTimeout (nav.array.spawnd [areal] || null)
					nav.array.spawnd [areal] = areal === nav.array.actual || setTimeout (fn, t)

				} // content not given - see cached

				if (areal === nav.lm)

					for (let row of stuff)

						switch (nav.lm && row.instance.modelFile.split (slash).pop ()) {

							case 'landmark_level':

								nav.st.pitch = 0
								nav.lm = null

							case 'landmark_upward':

								nav.st.pitch = nav.lm ? +27 : nav.st.pitch
								nav.lm = null

							case 'landmark_downward':

								nav.st.pitch = nav.lm ? -30 : nav.st.pitch
								nav.lm = null

								nav.st.rc.viewFrom ({ x: row.instance.origin.x, y: row.instance.origin.y, z: row.instance.origin.z })
								nav.st.rc.orient ({ yaw: nav.st.yaw = row.instance.orient.yaw }).forward ({ delta: 200 })

						} // responding to links, looking for a landmark...

				/*
				 *	initializing a void "bundle" of model browsing timers which
				 *	are associated to the spawning of this areal (so they could
				 *	be cleared by "despawn" if an areal de-spawns before any of
				 *	those associated timers fires its own delayed construction)
				 */

			     // nav.array.bundle [areal] = new Array

				/*
				 *	actual spawning happens below:
				 *	each model is checked for a cached, non-stale, version, and
				 *	all those that don't have one are queued for being browsed,
				 *	in which case only after browsing ends, the areal spanws in
				 *	to existence; if there were no models in the areal that had
				 *	no valid cached version, we can proceed to create instances
				 *	immediately...
				 */

			     // console.log (`spawn: ${areal} (${stuff.length} items)`)

			    let needs = new Array
			    let model = undefined

				for (let row of stuff) {

					if (nav.array.timers [model])

						continue

					if (nav.array.cached ({ model: row.instance.modelFile, crc32: row.crc32 }))

						continue

				     // if (needs.includes (model = [ row.instance.modelFile, areal, row.crc32 ].join ())) // previously needed by single-model loading
					if (needs.includes (model = row.instance.modelFile))

						continue

					needs.push (model)

				}

				if (nav.array.counts [areal] = needs.length) {

					nav.array.timers [areal + aster] || nav.array.browse ({

						serve: {

							areal: areal,
							stuff: stuff,
							hence: ++ nav.array.loader

						},

						batch: needs,
						where: nav.array.timers [areal + aster] = true

					}) // batch loader

				     /* for (model of needs)

						nav.array.timers [model] || nav.array.bundle [areal].push (nav.array.timers [model] =

							setTimeout (function () {

							    let parts = this.model.split (comma)
							    let model = parts.shift ()
							    let areal = parts.shift ()
							    let crc32 = parts.pop ()

								switch (nav.array.cached ({ model: model, crc32: crc32 })) {

									case false:

									     // console.log (`fetch: ${model} at ${areal}`)
										nav.array.browse ({ model: model, serve: { areal: areal, stuff: stuff, hence: ++ nav.array.loader } })
										break

									default:

										if (-- nav.array.counts [areal] === 0) {

										     // console.log (`serve: ${areal}`)

											nav.array.exists [areal] = true
											let que = { count: stuff.length, items: new Array }
											stuff.forEach ((entry, index) => nav.array.create (entry.instance, index, que))

										}

								}

								nav.array.timers [this.model] = false
								nav.array.modmer = Math.max (0, nav.array.modmer - 250)

							}.bind ({ model: model }), nav.array.modmer += 250)

						) */ // single-model loader

					return

				} // some content to browse, void (or fully cached) areal otherwise

			     // console.log (`serve: ${areal}`)

				nav.array.exists [areal] = true
				let que = { count: stuff.length, items: new Array }
				stuff.forEach ((entry, index) => nav.array.create (entry.instance, index, que))

			}, // nav.array.spawn

			/*
			 *	de-spawns one or more areals,
			 *	where considered out of view, or to refresh content
			 */

			despawn: function (args) {

			  const scaler = 1 / 321868

			    let areals = be.vector (args && args.areals).or (avoid)
			    let nWorld = World.layers.root.slice (0, system_models)
			    let nKidda = World.layers.kids.slice (0, system_childs)

				if (args && args.areal)

					areals = [ be.string (args.areal).or ('?.?') ]

				if (args && args.all) {

				     // console.log ('despawn: all')

					for (let areal in nav.array.spawnd) {

					     // for (let item of nav.array.bundle [areal] || avoid)

						     // clearTimeout (item)

						clearTimeout	(nav.array.spawnd [areal])
						clearTimeout	(nav.array.timers [areal])

						delete		(nav.array.timers [areal])

					} // stop timers corresponding to all spawned areals

					World.newInteractables = { $MARY_LOU: World.interactables.$MARY_LOU }

					for (let k in World.interactables) {

						World.interactables [k].caliber > 1 && (World.newInteractables [k] = World.interactables [k])
						World.interactables [k].caliber > 1 || (World.interactables [k].element.remove ())

					}

					World.interactables = World.newInteractables

					World.layers.root = nWorld	// reset to defaults
					World.layers.kids = nKidda	// reset to defaults

					nav.array.spawnd = new Object	// reset to defaults
					nav.array.exists = new Object	// reset to defaults
					nav.array.counts = new Object	// reset to defaults
				     // nav.array.bundle = new Object	// reset to defaults

					return

				} // de-spawning all areals, except the hard-wired 4792;4792

				for (let areal of areals)

					if (nav.array.spawnd [areal]) {

					     // console.log (`despawn: ${areal}`)

					     // for (let item of nav.array.bundle [areal] || avoid)

						     // clearTimeout (item)

						clearTimeout	(nav.array.spawnd [areal])
						clearTimeout	(nav.array.timers [areal])

						delete		(nav.array.spawnd [areal])
						delete		(nav.array.exists [areal])
						delete		(nav.array.counts [areal])
						delete		(nav.array.timers [areal])
					     // delete		(nav.array.bundle [areal])

					} // delete anything associated to despawning areals

				for (let w = World.layers.root, wi = system_models; wi < w.length; ++ wi)

					if (w [wi]) {

						let x = Math.round (scaler * w [wi].origin.x) + 4792
						let z = Math.round (scaler * w [wi].origin.z) + 4792
						let areacode = x.toString () + point + z.toString ()

						if (areals.includes (areacode)) {

							delete (World.interactables [w [wi].card])
							w [wi].label.remove ()
							continue

						}

						w [wi].self.ntry = nWorld.push (w [wi]) - 1

					} // filter any root instance belonging to despawning areals

				for (let k = World.layers.kids, ki = system_childs; ki < k.length; ++ ki)

					if (k [ki]) {

						let x = Math.round (scaler * k [ki].origin.x) + 4792
						let z = Math.round (scaler * k [ki].origin.z) + 4792
						let areacode = x.toString () + point + z.toString ()

						if (areals.includes (areacode)) {

							delete (World.interactables [k [ki].card])
							k [ki].label.remove ()
							continue

						}

						k [ki].self.ntry = k [ki].self.mouldRecord.ntry = nKidda.push (k [ki]) - 1

					} // filter all kid instances belonging to despawning areals

				World.layers.root = nWorld
				World.layers.kids = nKidda

			}, // nav.array.despawn

			/*
			 *	areals channels' listener
			 */

			listen: function (args) {

				if (args) {

					clearTimeout (nav.array.qt)

					if (nav.array.rq && nav.array.rq.requestInProgress) {

						nav.array.rh = idler
						nav.array.rq.request.abort ()

					}

					nav.array.ld = 3
					nav.array.lr = null

					nav.array.ch = be.string (args && args.to).or (nav.array.ch)
					nav.array.rh = be.lambda (args && args.handler).or (idler)
					nav.array.rq = new Requester ()

					nav.array.rq.post ({

						uri: '/exec/ltn',

						pairs: [

							{ name: 'identIfic', value: be.string (localStorage.identity).or ('anonymous') },
							{ name: 'listen_to', value: nav.array.ch },
							{ name: 'instaLoad', value: true }

						],

						onload: function (r) {

							    try { r.response = JSON.parse (r.response); nav.array.lr = r.response.last }
						      catch (e) { nav.array.lr = null }

							nav.array.lr ? nav.array.qt = setTimeout (nav.array.listen, 1E3 * nav.array.ld) : null

						} // start pacing when "sane"

					}) // query last row for new channel

					return

				} // args given, so tuning, unless args.clear

				nav.array.rq.post ({

					uri: '/exec/ltn',

					pairs: [

						{ name: 'identIfic', value: be.string (localStorage.identity).or ('anonymous') },
						{ name: 'listen_to', value: nav.array.ch },
						{ name: 'start_row', value: nav.array.lr }

					],

					onload: function (r) {

						try { r.response = JSON.parse (r.response) }

							catch (e) {

								nav.array.qt = nav.is && setTimeout (nav.array.listen, 14E3)
								return

							} // discard malformed response and break

							switch (r.response.mean) {

								case 'more':					// too far behind - but we don't mind
								case 'news':

									nav.array.ld = 3			// reset polling delay to its minimum
									nav.array.rh (r.response)		// pass all these news to the handler

								case 'idle':

									nav.array.qt = nav.is && setTimeout (nav.array.listen, 1E3 * Math.min (nav.array.ld, 14))

									nav.array.ld = ++ nav.array.ld		// delay next requests 1 more seconds
									nav.array.lr = r.response.last		// update your cursor - rinse, repeat

							} // filter idle, report and break "more"

							be.object (nav.array.areals [nav.array.ch]).or ({ content: new Array, settled: 0 }).browsed = Date.now ()

					},

					onwhoa: function (r) {

						nav.array.qt = nav.is && setTimeout (nav.array.listen, 14E3)

					} // if the server errs, we're likely polling too much...

				}) // may last ~ 14 sec

			} // long-polling query handler

		}, // nav.array

		/*
		 *	on-screen keyboard configuration and key mappings,
		 *	both in terms of physical key shapes and their associated code points
		 */

		kb: {

			kind: String ('wide'), ph: 640, 	// keyboard type, physical height

			rrfn: function () {

				rfn.className = [

					innerWidth > innerHeight ? 'wide_' : 'tall_',

					nav.array.la ? 'L' : '0',
					nav.array.ax ? 'X' : '',
					nav.array.az ? 'Z' : '',
					nav.array.ah ? 'H' : ''

				].join (empty).padEnd (7, '0')

				if (nav.array.ax || nav.array.az || nav.array.ah) {

					rfn.style.opacity = '1'
					lfn.style.opacity = nav.ck = '0'
					nav.cf = 0
					return

				}

				if (nav.array.la) {

					rfn.style.opacity = '1'
					return

				}

				rfn.style.opacity = '0'

			}, // right function key state refresh

			amc3: {

				Fn: {

					l: 0, t: 0, r: 198, b: 165,

					f: function () {

						nav.kb.rrfn (nav.array.ax = nav.array.az = nav.array.ah = false)
						nav.ck = lfn.style.opacity = { '0': '1', '1': '0' } [nav.ck]
						nav.cf = { '0': 0, '1': 2 } [nav.ck]

					}

				},

				slider: 	{ l:  198, t:	 0, r: 1732, b:  165, f: () => { nav.array.om = true; }, handle: true },

				ax:		{ l: 1732, t:	 0, r: 1820, b:   83, f: () => { nav.kb.rrfn (nav.array.ax = !nav.array.ax, nav.array.az = false, nav.array.ah = false) } },
				az:		{ l: 1820, t:	 0, r: 1919, b:   83, f: () => { nav.kb.rrfn (nav.array.az = !nav.array.az, nav.array.ax = false, nav.array.ah = false) } },
				ah:		{ l: 1732, t:	83, r: 1820, b:  165, f: () => { nav.kb.rrfn (nav.array.ah = !nav.array.ah, nav.array.ax = false, nav.array.az = false) } },
				la:		{ l: 1820, t:	83, r: 1919, b:  165, f: () => { nav.updateModel ({ lay: (nav.array.la = !nav.array.la) ? - 90 : 0 }) } },

				red:		{ l:	0, t:  165, r:	198, b:  280, f: () => { nav.updateModel ({ edge: '#F00' }) } },
				orange: 	{ l:  198, t:  165, r:	390, b:  280, f: () => { nav.updateModel ({ edge: '#F90' }) } },
				yellow: 	{ l:  390, t:  165, r:	582, b:  280, f: () => { nav.updateModel ({ edge: '#FD0' }) } },
				green:		{ l:	0, t:  280, r:	198, b:  396, f: () => { nav.updateModel ({ edge: '#8F0' }) } },
				cyan:		{ l:  198, t:  280, r:	390, b:  396, f: () => { nav.updateModel ({ edge: '#8DF' }) } },
				blue:		{ l:  390, t:  280, r:	582, b:  396, f: () => { nav.updateModel ({ edge: '#4AF' }) } },
				purple: 	{ l:	0, t:  396, r:	198, b:  512, f: () => { nav.updateModel ({ edge: '#88F' }) } },
				pink:		{ l:  198, t:  396, r:	390, b:  512, f: () => { nav.updateModel ({ edge: '#F8F' }) } },
				magenta:	{ l:  390, t:  396, r:	582, b:  512, f: () => { nav.updateModel ({ edge: '#F0F' }) } },
				white:		{ l:	0, t:  512, r:	198, b:  639, f: () => { nav.updateModel ({ edge: '#FFF' }) } },
				lightgrey:	{ l:  198, t:  512, r:	390, b:  639, f: () => { nav.updateModel ({ edge: '#CCC' }) } },
				darkgrey:	{ l:  390, t:  512, r:	582, b:  639, f: () => { nav.updateModel ({ edge: '#888' }) } },

				largest:	{ l:  582, t:  165, r:	772, b:  320, f: () => { nav.st.mc.thickness < .004 ? nav.updateModel ({ spacing: .36 }) : nav.updateModel ({ thickness: .002 }) } },
				larger: 	{ l:  772, t:  165, r:	962, b:  320, f: () => { nav.st.mc.spacing   < 1.00 ? nav.updateModel ({ spacing: .68 }) : nav.updateModel ({ thickness: .004 }) } },
				large:		{ l:  962, t:  165, r: 1152, b:  320, f: () => { nav.st.mc.spacing   < 1.00 ? nav.updateModel ({ spacing: .84 }) : nav.updateModel ({ thickness: .008 }) } },
				medium: 	{ l: 1152, t:  165, r: 1342, b:  320, f: () => { nav.st.mc.spacing   < 1.00 ? nav.updateModel ({ spacing: .92 }) : nav.updateModel ({ thickness: .016 }) } },
				small:		{ l: 1342, t:  165, r: 1532, b:  320, f: () => { nav.st.mc.spacing   < 1.00 ? nav.updateModel ({ spacing: .96 }) : nav.updateModel ({ thickness: .032 }) } },
				smaller:	{ l: 1532, t:  165, r: 1732, b:  320, f: () => { nav.st.mc.spacing   < 1.00 ? nav.updateModel ({ spacing: .98 }) : nav.updateModel ({ thickness: .064 }) } },
				smallest:	{ l: 1732, t:  165, r: 1919, b:  320, f: () => { nav.st.mc.spacing   < .990 ? nav.updateModel ({ spacing: .99 }) : nav.updateModel ({ thickness: .128, spacing: 1 }) } },

				lowest: 	{ l:  582, t:  320, r:	772, b:  478, f: () => { nav.updateModel ({ threshold: .12 }) } },
				lower:		{ l:  772, t:  320, r:	962, b:  478, f: () => { nav.updateModel ({ threshold: .25 }) } },
				low:		{ l:  962, t:  320, r: 1152, b:  478, f: () => { nav.updateModel ({ threshold: .33 }) } },
				mid:		{ l: 1152, t:  320, r: 1342, b:  478, f: () => { nav.updateModel ({ threshold: .50 }) } },
				high:		{ l: 1342, t:  320, r: 1532, b:  478, f: () => { nav.updateModel ({ threshold: .75 }) } },
				higher: 	{ l: 1532, t:  320, r: 1732, b:  478, f: () => { nav.updateModel ({ threshold: .99 }) } },
				highest:	{ l: 1732, t:  320, r: 1919, b:  478, f: () => { nav.updateModel ({ threshold: 1.1 }) } },

				solid:		{ l:  582, t:  478, r:	772, b:  639, f: () => { nav.updateModel ({ solid: !nav.st.mc.solid }) } },
				flat:		{ l:  772, t:  478, r:	962, b:  639, f: () => { nav.updateModel ({ flat:  !nav.st.mc.flat  }) } },
				shiny:		{ l:  962, t:  478, r: 1152, b:  639, f: () => { nav.updateModel ({ shiny: !nav.st.mc.shiny }) } },
				owned:		{ l: 1152, t:  478, r: 1532, b:  639, f: () => { nav.updateModel ({ owned: !nav.st.mc.owned }) } },

				submit: 	{ l: 1532, t:  478, r: 1919, b:  639, f: () => { nav.submitModel ({ instance: nav.array.instance, dropped: true }) } }

			},

			tmc3: {

				Fn: {

					l: 0, t: 0, r: 198, b: 210,

					f: function () {

						nav.kb.rrfn (nav.array.ax = nav.array.az = nav.array.ah = false)
						lfn.style.opacity = nav.ck = { '0': '1', '1': '0' } [nav.ck]
						nav.cf = { '0': 0, '1': 2 } [nav.ck]

					}

				},

				slider: 	{ l:  198, t:	 0, r: 1732, b:  210, f: () => { nav.array.om = true; }, handle: true },

				ax:		{ l: 1732, t:	 0, r: 1820, b:  105, f: () => { nav.kb.rrfn (nav.array.ax = !nav.array.ax, nav.array.az = false, nav.array.ah = false) } },
				az:		{ l: 1820, t:	 0, r: 1919, b:  105, f: () => { nav.kb.rrfn (nav.array.az = !nav.array.az, nav.array.ax = false, nav.array.ah = false) } },
				ah:		{ l: 1732, t:  105, r: 1820, b:  210, f: () => { nav.kb.rrfn (nav.array.ah = !nav.array.ah, nav.array.ax = false, nav.array.az = false) } },
				la:		{ l: 1820, t:  105, r: 1919, b:  210, f: () => { nav.updateModel ({ lay: (nav.array.la = !nav.array.la) ? - 90 : 0 }) } },

				red:		{ l:	0, t:  210, r:	198, b:  370, f: () => { nav.updateModel ({ edge: '#F00' }) } },
				orange: 	{ l:  198, t:  210, r:	390, b:  370, f: () => { nav.updateModel ({ edge: '#F90' }) } },
				yellow: 	{ l:  390, t:  210, r:	582, b:  370, f: () => { nav.updateModel ({ edge: '#FD0' }) } },
				green:		{ l:	0, t:  370, r:	198, b:  524, f: () => { nav.updateModel ({ edge: '#8F0' }) } },
				cyan:		{ l:  198, t:  370, r:	390, b:  524, f: () => { nav.updateModel ({ edge: '#8DF' }) } },
				blue:		{ l:  390, t:  370, r:	582, b:  524, f: () => { nav.updateModel ({ edge: '#4AF' }) } },
				purple: 	{ l:	0, t:  524, r:	198, b:  678, f: () => { nav.updateModel ({ edge: '#88F' }) } },
				pink:		{ l:  198, t:  524, r:	390, b:  678, f: () => { nav.updateModel ({ edge: '#F8F' }) } },
				magenta:	{ l:  390, t:  524, r:	582, b:  678, f: () => { nav.updateModel ({ edge: '#F0F' }) } },
				white:		{ l:	0, t:  678, r:	198, b:  839, f: () => { nav.updateModel ({ edge: '#FFF' }) } },
				lightgrey:	{ l:  198, t:  678, r:	390, b:  839, f: () => { nav.updateModel ({ edge: '#CCC' }) } },
				darkgrey:	{ l:  390, t:  678, r:	582, b:  839, f: () => { nav.updateModel ({ edge: '#888' }) } },

				largest:	{ l:  582, t:  210, r:	772, b:  420, f: () => { nav.st.mc.thickness < .004 ? nav.updateModel ({ spacing: .36 }) : nav.updateModel ({ thickness: .002 }) } },
				larger: 	{ l:  772, t:  210, r:	962, b:  420, f: () => { nav.st.mc.spacing   < 1.00 ? nav.updateModel ({ spacing: .68 }) : nav.updateModel ({ thickness: .004 }) } },
				large:		{ l:  962, t:  210, r: 1152, b:  420, f: () => { nav.st.mc.spacing   < 1.00 ? nav.updateModel ({ spacing: .84 }) : nav.updateModel ({ thickness: .008 }) } },
				medium: 	{ l: 1152, t:  210, r: 1342, b:  420, f: () => { nav.st.mc.spacing   < 1.00 ? nav.updateModel ({ spacing: .92 }) : nav.updateModel ({ thickness: .016 }) } },
				small:		{ l: 1342, t:  210, r: 1532, b:  420, f: () => { nav.st.mc.spacing   < 1.00 ? nav.updateModel ({ spacing: .96 }) : nav.updateModel ({ thickness: .032 }) } },
				smaller:	{ l: 1532, t:  210, r: 1732, b:  420, f: () => { nav.st.mc.spacing   < 1.00 ? nav.updateModel ({ spacing: .98 }) : nav.updateModel ({ thickness: .064 }) } },
				smallest:	{ l: 1732, t:  210, r: 1919, b:  420, f: () => { nav.st.mc.spacing   < .990 ? nav.updateModel ({ spacing: .99 }) : nav.updateModel ({ thickness: .128, spacing: 1 }) } },

				lowest: 	{ l:  582, t:  420, r:	772, b:  628, f: () => { nav.updateModel ({ threshold: .12 }) } },
				lower:		{ l:  772, t:  420, r:	962, b:  628, f: () => { nav.updateModel ({ threshold: .25 }) } },
				low:		{ l:  962, t:  420, r: 1152, b:  628, f: () => { nav.updateModel ({ threshold: .33 }) } },
				mid:		{ l: 1152, t:  420, r: 1342, b:  628, f: () => { nav.updateModel ({ threshold: .50 }) } },
				high:		{ l: 1342, t:  420, r: 1532, b:  628, f: () => { nav.updateModel ({ threshold: .75 }) } },
				higher: 	{ l: 1532, t:  420, r: 1732, b:  628, f: () => { nav.updateModel ({ threshold: .99 }) } },
				highest:	{ l: 1732, t:  420, r: 1919, b:  628, f: () => { nav.updateModel ({ threshold: 1.1 }) } },

				solid:		{ l:  582, t:  628, r:	772, b:  839, f: () => { nav.updateModel ({ solid: !nav.st.mc.solid }) } },
				flat:		{ l:  772, t:  628, r:	962, b:  839, f: () => { nav.updateModel ({ flat:  !nav.st.mc.flat  }) } },
				shiny:		{ l:  962, t:  628, r: 1152, b:  839, f: () => { nav.updateModel ({ shiny: !nav.st.mc.shiny }) } },
				owned:		{ l: 1152, t:  628, r: 1532, b:  839, f: () => { nav.updateModel ({ owned: !nav.st.mc.owned }) } },

				submit: 	{ l: 1532, t:  628, r: 1919, b:  839, f: () => { nav.submitModel ({ instance: nav.array.instance, dropped: true }) } }

			},

			tall: {

				leftHandle: {

					handle: true,
					l: 0, t: 420, r: 104, b: 624,
					f: function () { nav.sk = true, nav.sh = -1, nav.sc = false, nav.cv = tio.cs }

				}, // left-side resize handle

				rightHandle: {

					handle: true,
					l: 1826, t: 420, r: 1920, b: 624,
					f: function () { nav.sk = true, nav.sh = +1, nav.sc = false, nav.cv = tio.cs }

				}, // rite-side resize handle

				Q: {

					l: 0, t: 0, r: 198, b: 216,
					f: function () { tio.putKey.call ({ key: nav.cf ? '1' : 'Q', loner: true }) }

				},

				W: {

					l: 198, t: 0, r: 390, b: 216,
					f: function () { tio.putKey.call ({ key: nav.cf ? '2' : 'W', loner: true }) }

				},

				E: {

					l: 390, t: 0, r: 582, b: 216,
					f: function () { tio.putKey.call ({ key: nav.cf ? '3' : 'E', loner: true }) }

				},

				R: {

					l: 582, t: 0, r: 772, b: 216,
					f: function () { tio.putKey.call ({ key: nav.cf ? '4' : 'R', loner: true }) }

				},

				T: {

					l: 772, t: 0, r: 962, b: 216,
					f: function () { tio.putKey.call ({ key: nav.cf ? '5' : 'T', loner: true }) }

				},

				Y: {

					l: 962, t: 0, r: 1152, b: 216,
					f: function () { tio.putKey.call ({ key: nav.cf ? '6' : 'Y', loner: true }) }

				},

				U: {

					l: 1152, t: 0, r: 1342, b: 216,
					f: function () { tio.putKey.call ({ key: nav.cf ? '7' : 'U', loner: true }) }

				},

				I: {

					l: 1342, t: 0, r: 1532, b: 216,
					f: function () { tio.putKey.call ({ key: nav.cf ? '8' : 'I', loner: true }) }

				},

				O: {

					l: 1532, t: 0, r: 1722, b: 216,
					f: function () { tio.putKey.call ({ key: nav.cf ? '9' : 'O', loner: true }) }

				},

				P: {

					l: 1722, t: 0, r: 1919, b: 216,
					f: function () { tio.putKey.call ({ key: nav.cf ? '0' : 'P', loner: true }) }

				},

				A: {

					l: 0, t: 216, r: 198, b: 420,
					f: function () { tio.putKey.call ({ key: nav.cf ? '!' : 'A', loner: true }) }

				},

				S: {

					l: 198, t: 216, r: 390, b: 420,
					f: function () { tio.putKey.call ({ key: nav.cf ? '@' : 'S', loner: true }) }

				},

				D: {

					l: 390, t: 216, r: 582, b: 420,
					f: function () { tio.putKey.call ({ key: nav.cf ? '#' : 'D', loner: true }) }

				},

				F: {

					l: 582, t: 216, r: 772, b: 420,
					f: function () { tio.putKey.call ({ key: nav.cf ? '$' : 'F', loner: true }) }

				},

				G: {

					l: 772, t: 216, r: 962, b: 420,
					f: function () { tio.putKey.call ({ key: nav.cf ? '%' : 'G', loner: true }) }

				},

				H: {

					l: 962, t: 216, r: 1152, b: 420,
					f: function () { tio.putKey.call ({ key: nav.cf ? '^' : 'H', loner: true }) }

				},

				J: {

					l: 1152, t: 216, r: 1342, b: 420,
					f: function () { tio.putKey.call ({ key: nav.cf ? '&' : 'J', loner: true }) }

				},

				K: {

					l: 1342, t: 216, r: 1532, b: 420,
					f: function () { tio.putKey.call ({ key: nav.cf ? ':' : 'K', loner: true }) }

				},

				L: {

					l: 1532, t: 216, r: 1722, b: 420,
					f: function () { tio.putKey.call ({ key: nav.cf ? '"' : 'L', loner: true }) }

				},

				Backspace: {

					l: 1722, t: 216, r: 1919, b: 420,

					f: function () {

						tio.ro || tio.backspace ()			// console mode (or "page-wide" write access)
						tio.ro && tio.kbFunctions.ro_backspace ()	// regular mode (moves constrained to fields)

					}

				},

				Z: {

					l: 104, t: 420, r: 286, b: 624,
					f: function () { tio.putKey.call ({ key: nav.cf ? '_' : 'Z', loner: true }) }

				},

				X: {

					l: 286, t: 420, r: 478, b: 624,
					f: function () { tio.putKey.call ({ key: nav.cf ? '|' : 'X', loner: true }) }

				},

				C: {

					l: 478, t: 420, r: 670, b: 624,
					f: function () { tio.putKey.call ({ key: 'C', loner: true }) }

				},

				V: {

					l: 670, t: 420, r: 862, b: 624,
					f: function () { tio.putKey.call ({ key: nav.cf ? tio.cl : 'V', loner: true }) }

				},

				B: {

					l: 862, t: 420, r: 1052, b: 624,
					f: function () { tio.putKey.call ({ key: nav.cf ? '*' : 'B', loner: true }) }

				},

				N: {

					l: 1052, t: 420, r: 1242, b: 624,
					f: function () { tio.putKey.call ({ key: nav.cf ? '+' : 'N', loner: true }) }

				},

				M: {

					l: 1242, t: 420, r: 1432, b: 624,
					f: function () { tio.putKey.call ({ key: nav.cf ? '-' : 'M', loner: true }) }

				},

				Quote: {

					l: 1432, t: 420, r: 1622, b: 624,
					f: function () { tio.putKey.call ({ key: nav.cf ? ';' : "'", loner: true }) }

				},

				Return: {

					l: 1622, t: 420, r: 1826, b: 624,

					f: function () {

						if (nav.cf)

							return tio.putKey.call ({ key: '=', loner: true })

						if (tio.ro)

							return tio.kbFunctions.ro_enter ()

						tio.enter ()

					}

				},

				Fn: {

					modify: true,
					l: 0, t: 624, r: 198, b: 839,

					f: function () {

						ctl.style.opacity = nav.ck = { '0': '.7', '.7': '1', '1': '0' } [nav.ck]
						nav.cf = { '0': 0, '.7': 1, '1': 2 } [nav.ck]

					}

				},

			     /* NA1: {

					super: true,
					l: 196, t: 624, r: 373, b: 839,
					f: function () { tio.putKey.call ({ key: blank, loner: true }) }

				},

				NA2: {

					super: true,
					l: 373, t: 624, r: 533, b: 839,
					f: function () { tio.putKey.call ({ key: blank, loner: true }) }

				}, */

				FullScreenToggle: {

					super: true,
					l: 404, t: 624, r: 693, b: 839,
					f: function (e) { full.onclick (e); setTimeout (tio.scrollToCursor, 333) }

				},

				BackSlash: {

					super: true,
					l: 533, t: 624, r: 693, b: 839,
					f: function () { tio.putKey.call ({ key: '\\', loner: true }) }

				},

				BracketLeft: {

					super: true,
					l: 693, t: 624, r: 853, b: 839,
					f: function () { tio.putKey.call ({ key: '[', loner: true }) }

				},

				BracketRight: {

					super: true,
					l: 853, t: 624, r: 1013, b: 839,
					f: function () { tio.putKey.call ({ key: ']', loner: true }) }

				},

				ParenLeft: {

					super: true,
					l: 1013, t: 624, r: 1173, b: 839,
					f: function () { tio.putKey.call ({ key: '(', loner: true }) }

				},

				ParenRight: {

					super: true,
					l: 1173, t: 624, r: 1342, b: 839,
					f: function () { tio.putKey.call ({ key: ')', loner: true }) }

				},

				Space: {

					multi: true,
					l: 198, t: 624, r: 1342, b: 839,
					f: function () { tio.putKey.call ({ key: blank, loner: true }) }

				},

				Comma: {

					l: 1342, t: 624, r: 1534, b: 839,
					f: function () { tio.putKey.call ({ key: nav.cf ? '<' : ',', loner: true }) }

				},

				Dot: {

					l: 1534, t: 624, r: 1724, b: 839,
					f: function () { tio.putKey.call ({ key: nav.cf ? '>' : '.', loner: true }) }

				},

				Question: {

					l: 1724, t: 624, r: 1919, b: 839,
					f: function () { tio.putKey.call ({ key: nav.cf ? '/' : '?', loner: true }) }

				}

			}, // end "tall" keyboard mappings (portrait orientation)

			wide: {

				leftHandle: {

					handle: true,
					l: 0, t: 320, r: 104, b: 478,
					f: function () { nav.sk = true, nav.sh = -1, nav.sc = false, nav.cv = tio.cs }

				}, // left-side resize handle

				rightHandle: {

					handle: true,
					l: 1826, t: 320, r: 1920, b: 478,
					f: function () { nav.sk = true, nav.sh = +1, nav.sc = false, nav.cv = tio.cs }

				}, // rite-side resize handle

				Q: {

					l: 0, t: 10, r: 198, b: 165,
					f: function () { tio.putKey.call ({ key: nav.cf ? '1' : 'Q', loner: true }) }

				},

				W: {

					l: 198, t: 10, r: 390, b: 165,
					f: function () { tio.putKey.call ({ key: nav.cf ? '2' : 'W', loner: true }) }

				},

				E: {

					l: 390, t: 10, r: 582, b: 165,
					f: function () { tio.putKey.call ({ key: nav.cf ? '3' : 'E', loner: true }) }

				},

				R: {

					l: 582, t: 10, r: 772, b: 165,
					f: function () { tio.putKey.call ({ key: nav.cf ? '4' : 'R', loner: true }) }

				},

				T: {

					l: 772, t: 10, r: 962, b: 165,
					f: function () { tio.putKey.call ({ key: nav.cf ? '5' : 'T', loner: true }) }

				},

				Y: {

					l: 962, t: 10, r: 1152, b: 165,
					f: function () { tio.putKey.call ({ key: nav.cf ? '6' : 'Y', loner: true }) }

				},

				U: {

					l: 1152, t: 10, r: 1342, b: 165,
					f: function () { tio.putKey.call ({ key: nav.cf ? '7' : 'U', loner: true }) }

				},

				I: {

					l: 1342, t: 10, r: 1532, b: 165,
					f: function () { tio.putKey.call ({ key: nav.cf ? '8' : 'I', loner: true }) }

				},

				O: {

					l: 1532, t: 10, r: 1722, b: 165,
					f: function () { tio.putKey.call ({ key: nav.cf ? '9' : 'O', loner: true }) }

				},

				P: {

					l: 1722, t: 10, r: 1919, b: 165,
					f: function () { tio.putKey.call ({ key: nav.cf ? '0' : 'P', loner: true }) }

				},

				A: {

					l: 0, t: 165, r: 198, b: 320,
					f: function () { tio.putKey.call ({ key: nav.cf ? '!' : 'A', loner: true }) }

				},

				S: {

					l: 198, t: 165, r: 390, b: 320,
					f: function () { tio.putKey.call ({ key: nav.cf ? '@' : 'S', loner: true }) }

				},

				D: {

					l: 390, t: 165, r: 582, b: 320,
					f: function () { tio.putKey.call ({ key: nav.cf ? '#' : 'D', loner: true }) }

				},

				F: {

					l: 582, t: 165, r: 772, b: 320,
					f: function () { tio.putKey.call ({ key: nav.cf ? '$' : 'F', loner: true }) }

				},

				G: {

					l: 772, t: 165, r: 962, b: 320,
					f: function () { tio.putKey.call ({ key: nav.cf ? '%' : 'G', loner: true }) }

				},

				H: {

					l: 962, t: 165, r: 1152, b: 320,
					f: function () { tio.putKey.call ({ key: nav.cf ? '^' : 'H', loner: true }) }

				},

				J: {

					l: 1152, t: 165, r: 1342, b: 320,
					f: function () { tio.putKey.call ({ key: nav.cf ? '&' : 'J', loner: true }) }

				},

				K: {

					l: 1342, t: 165, r: 1532, b: 320,
					f: function () { tio.putKey.call ({ key: nav.cf ? ':' : 'K', loner: true }) }

				},

				L: {

					l: 1532, t: 165, r: 1722, b: 320,
					f: function () { tio.putKey.call ({ key: nav.cf ? '"' : 'L', loner: true }) }

				},

				Backspace: {

					l: 1722, t: 165, r: 1919, b: 320,

					f: function () {

						tio.ro || tio.backspace ()			// console mode (or "page-wide" write access)
						tio.ro && tio.kbFunctions.ro_backspace ()	// regular mode (moves constrained to fields)

					}

				},

				Z: {

					l: 104, t: 320, r: 286, b: 478,
					f: function () { tio.putKey.call ({ key: nav.cf ? '_' : 'Z', loner: true }) }

				},

				X: {

					l: 286, t: 320, r: 478, b: 478,
					f: function () { tio.putKey.call ({ key: nav.cf ? '|' : 'X', loner: true }) }

				},

				C: {

					l: 478, t: 320, r: 670, b: 478,
					f: function () { tio.putKey.call ({ key: 'C', loner: true }) }

				},

				V: {

					l: 670, t: 320, r: 862, b: 478,
					f: function () { tio.putKey.call ({ key: nav.cf ? tio.cl : 'V', loner: true }) }

				},

				B: {

					l: 862, t: 320, r: 1052, b: 478,
					f: function () { tio.putKey.call ({ key: nav.cf ? '*' : 'B', loner: true }) }

				},

				N: {

					l: 1052, t: 320, r: 1242, b: 478,
					f: function () { tio.putKey.call ({ key: nav.cf ? '+' : 'N', loner: true }) }

				},

				M: {

					l: 1242, t: 320, r: 1432, b: 478,
					f: function () { tio.putKey.call ({ key: nav.cf ? '-' : 'M', loner: true }) }

				},

				Quote: {

					l: 1432, t: 320, r: 1622, b: 478,
					f: function () { tio.putKey.call ({ key: nav.cf ? ';' : "'", loner: true }) }

				},

				Return: {

					l: 1622, t: 320, r: 1826, b: 478,

					f: function () {

						if (nav.cf)

							return tio.putKey.call ({ key: '=', loner: true })

						if (tio.ro)

							return tio.kbFunctions.ro_enter ()

						tio.enter ()

					}

				},

				Fn: {

					modify: true,
					l: 0, t: 478, r: 198, b: 639,

					f: function () {

						ctl.style.opacity = nav.ck = { '0': '.7', '.7': '1', '1': '0' } [nav.ck]
						nav.cf = { '0': 0, '.7': 1, '1': 2 } [nav.ck]

					}

				},

			     /* NA1: {

					super: true,
					l: 196, t: 478, r: 373, b: 639,
					f: function () { tio.putKey.call ({ key: blank, loner: true }) }

				},

				NA2: {

					super: true,
					l: 373, t: 478, r: 533, b: 639,
					f: function () { tio.putKey.call ({ key: blank, loner: true }) }

				}, */

				FullScreenToggle: {

					super: true,
					l: 404, t: 478, r: 693, b: 639,
					f: function (e) { full.onclick (e); setTimeout (tio.scrollToCursor, 333) }

				},

				BackSlash: {

					super: true,
					l: 533, t: 478, r: 693, b: 639,
					f: function () { tio.putKey.call ({ key: '\\', loner: true }) }

				},

				BracketLeft: {

					super: true,
					l: 693, t: 478, r: 853, b: 639,
					f: function () { tio.putKey.call ({ key: '[', loner: true }) }

				},

				BracketRight: {

					super: true,
					l: 853, t: 478, r: 1013, b: 639,
					f: function () { tio.putKey.call ({ key: ']', loner: true }) }

				},

				ParenLeft: {

					super: true,
					l: 1013, t: 478, r: 1173, b: 639,
					f: function () { tio.putKey.call ({ key: '(', loner: true }) }

				},

				ParenRight: {

					super: true,
					l: 1173, t: 478, r: 1342, b: 639,
					f: function () { tio.putKey.call ({ key: ')', loner: true }) }

				},

				Space: {

					multi: true,
					l: 198, t: 478, r: 1342, b: 639,
					f: function () { tio.putKey.call ({ key: blank, loner: true }) }

				},

				Comma: {

					l: 1342, t: 478, r: 1534, b: 639,
					f: function () { tio.putKey.call ({ key: nav.cf ? '<' : ',', loner: true }) }

				},

				Dot: {

					l: 1534, t: 478, r: 1724, b: 639,
					f: function () { tio.putKey.call ({ key: nav.cf ? '>' : '.', loner: true }) }

				},

				Question: {

					l: 1724, t: 478, r: 1919, b: 639,
					f: function () { tio.putKey.call ({ key: nav.cf ? '/' : '?', loner: true }) }

				}

			} // end "wide" keyboard mappings (landscape orientation)

		}, // all on-screen-keyboard related controls (all keys, plus its resizing handles)

		/*
		 *	navigation control handlers:
		 *	NLAND, controlled by the CUI, means "prevent landscape-oriented behaviors"
		 */

		fitKeyboard: function (args) {

		    let w = innerWidth, h = innerHeight

			switch (NLAND && w > h) {

				case true:

					nav.kb.kind = osk.className = nav.st.mc.active ? 'amc3' : 'wide'
					ctl.className = nav.st.mc.active ? 'amc' + nav.st.mc.flags.literal : 'wide'
					lfn.className = 'wide'
					nav.kb.ph = 640

					osk.style.backgroundSize = ctl.style.backgroundSize = lfn.style.backgroundSize = rfn.style.backgroundSize = (100 * nav.st.ks).toFixed (6) + '% auto'
					scn.style.width = hlp.style.width = (100 * nav.st.ks).toFixed (6) + '%'
					scn.style.left = hlp.style.left = (0.5 * (100 - 100 * nav.st.ks)).toFixed (6) + '%'

					tio.onresize ()
					ray.onresize ()
					cui.refit ()

					hdr.style.width = hdl.style.width = scn.style.left

					nav.ok && (pag.style.height = 'calc(100vh' + blank + '-' + blank + (33.33 * nav.st.ks).toFixed (6) + 'vw)')
					nav.ok && (ctc.style.height = osk.style.height = ctl.style.height = lfn.style.height = rfn.style.height = (33.33 * nav.st.ks).toFixed (6) + 'vw')

					break

				case false:

					nav.kb.kind = osk.className = nav.st.mc.active ? 'tmc3' : 'tall'
					ctl.className = nav.st.mc.active ? 'tmc' + nav.st.mc.flags.literal : 'tall'
					lfn.className = 'tall'
					nav.kb.ph = 840

					osk.style.backgroundSize = ctl.style.backgroundSize = lfn.style.backgroundSize = rfn.style.backgroundSize = (100 * nav.st.ks).toFixed (6) + '%'
					scn.style.left = hlp.style.left = scn.style.width = hlp.style.width = empty

					nav.ok && (pag.style.height = 'calc(100vh' + blank + '-' + blank + (43.75 * nav.st.ks).toFixed (6) + 'vw)')
					nav.ok && (ctc.style.height = osk.style.height = ctl.style.height = lfn.style.height = rfn.style.height = (43.75 * nav.st.ks).toFixed (6) + 'vw')

			} // true if in landscape orientation AND we may engage landscape behavior

			nav.ok || (scn.style.height = pag.style.height = nav.ph)
			nav.ok && (tok.style.width = (100 * nav.st.ks).toFixed (6) + '%')

		}, // fit your on-screen keyboard (in response to a change in size or orientation)

		/*
		 *	point-controlled (mouse, touch) event handlers
		 */

		pointerdown: function (e) {

		  const H = 1/2, K = Kpixs = 1920

			nav.rx = e.clientX || 0

			switch ((e.button) || 0) {

				case 0: 				// primary button (left)

				    let w = innerWidth
				    let h = innerHeight

				    let k = K / (w * nav.st.ks) 	// scaling factor
				    let m = h - (nav.kb.ph / k) 	// x origin
				    let n = H * (w - Kpixs / k) 	// y origin
				    let x = k * (e.clientX - n) 	// x relative coordinate
				    let y = k * (e.clientY - m) 	// y relative coordinate
				    let z = nav.cf			// entry state of Fn key

				    let f = false			// flag: pointer down over one of the resizing handles
				    let g = false			// flag: pointer down over key (other than the handles)

				    let ki, c				// index in control set, control set

					if (nav.ok)			// test for keyboard hits, providing the keyboard is on

						for (ki in (c = nav.kb [nav.kb.kind])) {

						    let r = c [ki]						// key's entry in control set

							if (r.multi && nav.cf)

								continue					// multifunction key hit, and Fn key is active (void hit)

							if (r.super && nav.cf === 0)

								continue					// multifunction key hit, but Fn key is dormant (ignored)

							x < r.l || y < r.t || x > r.r || y > r.b
								|| r.f.call ((f = r.handle) || {

									given: g = true,
									where: r.modify || (nav.ac = nav.ac || setTimeout (nav.typematicStart.bind ({ handler: r.f }), 600))

								})						// key hit: set flags, bind typematic repeat after 600 ms

							if (g === true && z === 1)				// key hit, and Fn key was in single state: resets Fn key

								r.modify || (nav.cf = { '0': 0 } [ctl.style.opacity = lfn.style.opacity = nav.ck = '0'])

							if (g === true || f === true)				// key or handle hit enacted: break loop, don't propagate

								break

						} // loops through keys in the OSK control set

					     g || (nav.ac) || (ctc.onpointermove = nav.pointermove)		// no key hit, and typematic off: start tracking movement
					f || g || (tio.onpgfocus (e))						// no key hit, and no handle hit: set input focus to page

			} // switch through pointing device buttons: we react to the "primary"

			e.preventDefault && e.preventDefault ()

		}, // pointerdown

		pointermove: function (e) {

		    let w = innerWidth
		    let h = innerHeight

			if (nav.is !== false && nav.array.om) {

			    let cx = e.clientX || nav.rx		// current x
			    let dx = cx - nav.rx			// delta x

				switch (nav.array.ax || nav.array.ah || nav.array.az || nav.ck === '1') {

					case false:

						nav.array.instance.orient.yaw += dx / 4
						break

					case true:     // uniform resize (nav.ck === '1') or anisotropic

						nav.array.ax || nav.array.ah || nav.array.az || nav.updateModel ({ size: Math.max (0.1, Math.min (nav.st.mc.size + dx / 400, 2)) })
						nav.array.ax && nav.updateModel ({ anix: Math.max (0.1, Math.min (nav.st.mc.anis.x + dx / 400, 2)) })
						nav.array.ah && nav.updateModel ({ aniy: Math.max (0.1, Math.min (nav.st.mc.anis.y + dx / 400, 2)) })
						nav.array.az && nav.updateModel ({ aniz: Math.max (0.1, Math.min (nav.st.mc.anis.z + dx / 400, 2)) })

				}

				nav.rx = e.clientX

			} // react to slider for model orientation

			if (nav.is === false && nav.sk && w > h) {	// currently, "w > h" disables resizing if portrait orientation is on

			    let cx = e.clientX || nav.rx		// current x
			    let dx = nav.st.ks * (cx - nav.rx)		// delta x
			    let pr = devicePixelRatio || 1		// size of a pixel, in pixels (tee-hee)
			    let ks = Math.round (100 * nav.st.ks)	// rounded percent, reference value to detect "significant" change

			    let m = w > h ? .92 : 1			// maximum size of keyboard (fraction of innerWidth)
			    let f = 2 + 2 / pr				// factor to the extent of moves (twice the delta, adjusted to ratio)

				switch (cx) {

					case null:

						break			// reference not read (first frame), delta would be invalid

					default:

						nav.fitKeyboard (nav.st.ps = nav.st.ks = Math.max (.5, Math.min (nav.st.ks + nav.sh * f * dx / w, m)))
						tio.setCursorState ({ state: 'hide' })
						nav.rx = e.clientX
						nav.sc = Math.round (100 * nav.st.ks) == ks ? nav.sc : true

				} // on moves, re-compute OSK size, and update reference

			} // react to keyboard resize handles when one of them is active

			e.preventDefault && e.preventDefault ()

		}, // pointermove

		pointerup: function (e) {

		    let H = 1/2, K = Kpixs = 1920, S = nav.sk, C = nav.sc

			if (nav.is !== false && nav.array.om)

				nav.array.instance.orient.yaw = (180 + Math.round (nav.array.instance.orient.yaw / 15) * 15) % 360 - 180

			if (nav.sk) {

				tio.setCursorState ({ state: nav.cv ? 'show' : 'hide' })	// if resizing keyboard, restore TIO text cursor display styling
				nav.sc = false							// if resizing keyboard, reset the "significant change" flag
				nav.sk = false							// if resizing keyboard, I guess we're no longer resizing...

			}

			clearTimeout (nav.ac)				// if repeating keys (in typematic), stop repeating

			nav.ac = null					// assert we're not repeating a key
			nav.array.om = false				// assert we're not orienting model
			ctc.onpointermove = null			// detach pointer tracking function

			if (nav.ok && S === true && C === false) {

				nav.sh === -1 && tio.kbFunctions.ro_left.call ()
				nav.sh === +1 && tio.kbFunctions.ro_right.call ()

			} // on-screen keyboard is on and we were resizing BUT no significant changes made: using handle as cursor arrow

			if (nav.ok && nav.cf === 1) {

			    let w = innerWidth
			    let h = innerHeight

			    let k = K / (w * nav.st.ks) 		// scaling factor
			    let m = h - (nav.kb.ph / k) 		// x origin
			    let n = H * (w - Kpixs / k) 		// y origin
			    let x = k * (e.clientX - n) 		// x relative coordinate
			    let y = k * (e.clientY - m) 		// y relative coordinate
			    let f = false				// hit flag: once we had a key hit, disables Fn (in single mode)

			    let ki, c					// index in control set, control set

				for (ki in (c = nav.kb [nav.kb.kind])) {

					r = c [ki]
					x < r.l || y < r.t || x > r.r || y > r.b || r.handle || r.modify || r.f.call ({ given: f = true })

					if (f === true)

						break

				}

				f && (nav.cf = { '0': 0 } [ctl.style.opacity = lfn.style.opacity = nav.ck = '0'])

			} // on-screen keyboard is on and Fn key is in single mode: produce the "shifted" keystroke and reset Fn's state

			e.preventDefault && e.preventDefault ()

		}, // pointerup

		/*
		 *	other handlers:
		 *	simulated keyboard repeat for touch-screen keys (animated by the CUI)
		 */

		typematicStart: function () {

			nav.ac = this

		},

		/*
		 *	nav/cui framework utilities
		 */

		fullScreen: function () {

		    let enable = be.switch (document.fullscreenEnabled).or (false)
		    let actual = enable && (be.object (document.fullscreenElement).or (null))
		    let method = enable && (actual === null) && be.lambda (document.body.requestFullscreen).or (null) || be.lambda (document.exitFullscreen).or (null)

			if (enable === false)

				return (nav.fr = { method: idler, target: document })		// we can do nothing

			if (method && actual !== null)

				return (nav.fr = { method: method, target: document })		// leave full-screen

			if (method && actual === null)

				return (nav.fr = { method: method, target: document.body })	// enter full-screen

		}, // loads and returns the method call to switch in or out of full-screen mode

		fullScreenEngaged: function () {

			return (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement ? true : false)

		}, // returns the current state of the fullScreen API, true if full-screen mode

		/*
		 *	80.style specific framework utilities
		 */

		username: function () {

			return (be.string (localStorage.username).or (empty))

		}, // return user name as of localStorage record

		identity: function () {

			return (be.string (localStorage.identity).or (empty))

		}, // return sessionID as of localStorage record

		thatPage: function () {

			return (tb (rc (location.hash.split (slash).pop ().split (tilde).shift ())))

		}, // return current page title in readable form

		thisPage: function () {

		    let path = location.hash.split (tilde).shift ().split (slash).slice (1)

			for (let i in path)

				path [i] = rc (path [i])

			return (path.join (slash))

		}, // return page path, in accord with server-side conventions

		thatUser: function () {

			return (location.hash.substr (2).split ((slash)).shift ())

		}, // return user name portion from page path, for use in URIs

		thisUser: function () {

			return (location.hash.split (slash).pop ().toUpperCase ())

		}, // return user from home path, with server-side conventions

		de_hint: function (response) {

			return (be.string (response || null).or ($('sys_no_response').innerText.replace (/^\s+|\s+$/g, empty)).split (';').shift ())

		}, // remove identity hints (or whichever hint) from responses

		cc: function (t1, t2) {

			document.title = (be.string (t1).or ('80.style') + blank + ('::') + blank + be.string (t2).or ("blogging back to the 80's")).toLowerCase ()

		}, // retitle (recaption) the window (we would have two parts)

		grab: function (fieldName) {

		    let match = be.vector (tio.it.match (RegExp ('\\b(DATA|\\d{4})\\x20\\`\\`\\x20(' + be.string (fieldName).or (empty) + '\\s?\\|?\\x60\\x20)(.+)\\n'))).or ([ empty ])
		    let field = be.string (match.pop ()).or (empty).replace (/\x20{2,}/g, blank).replace (/^\x20+|\x20+$/g, empty)

			return (field)

		}, // grab a single text field

		drop: function (fieldName, field) {

			fieldName = be.string (fieldName).or (empty)
			field = be.string (field).or (empty)

			tio.update (tio.it.replace (RegExp ('\\b((?:DATA|\\d{4})\\x20\\`\\`\\x20(?:' + (fieldName) + '\\s?\\|?\\x60\\x20)).*\\n'), '$1' + field + nline))

		}, // writes single text field

		pick: function (fieldName) {

		    let match = be.vector (tio.it.match (RegExp ('\\b(P)\\x20\\`\\`\\x20(' + be.string (fieldName).or (empty) + '\\s\\x60\\x20)(.+)\\n'))).or ([ empty ])
		    let entry = be.vector (match.pop ().match (RegExp ('\\[(.+)\\]'))).or ([ empty ])
		    let field = be.string (entry.pop ()).or (empty)

			return (field)

		}, // grab option in pick line

		crc32: function (string) {

		    let compileCrcTable = function () {

			    let myTable = new Array
			    let n, c, k

				for (n = 0; n < 256; ++ n) {

					for (c = n, k = 0; k < 8; ++ k)

						c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : (c >>> 1)

					myTable [n] = c

				}

				return (nav.crcTable = myTable)

			}

		    let crc32 = function (string) {

			    let tab = nav.crcTable || compileCrcTable ()
			    let crc = 0 ^ (-1)

				for (let ci = 0; ci < string.length; ++ ci)

					crc = (crc >>> 8) ^ tab [(crc ^ string.charCodeAt (ci)) & 0xFF]

				return (crc ^ (-1)) >>> 0

			}

			return (crc32 (string))

		},

		getFacts: function () {

		    let canvas = (document.createElement ('canvas')) || (false)
		    let c_text = (canvas && canvas.getContext) && (canvas.getContext ('2d')) || (false)
		    let c_data = (canvas && canvas.toDataURL) && (canvas.toDataURL ('image/png', { given: c_text && c_text.fillText ('//++==||**//', 14, 14) })) || (empty)
		    let remove = (canvas && canvas.remove) && (canvas.remove ())

			return (JSON.stringify ({

				 1: navigator.cookieEnabled || false,
				 2: navigator.javaEnabled && navigator.javaEnabled () || false,
				 3: navigator.languages || empty,
				 4: navigator.maxTouchPoints || 0,
				 5: navigator.mimeTypes.length || 0,
				 6: navigator.platform || empty,
				 7: navigator.plugins && navigator.plugins.length || 0,
				 8: navigator.userAgent || empty,
				 9: screen.availWidth || 0,
				10: screen.availHeight || 0,
				11: screen.colorDepth || 0,
				12: screen.orientation && screen.orientation.type || screen.msOrientation || empty,
				13: screen.orientation && screen.orientation.angle || 0,
				14: innerWidth || 0,
				15: innerHeight || 0,
				16: screenX || 0,
				17: screenY || 0,

				18: new Date ().getTimezoneOffset () - ((function () {

				    let aux = new Date ()
				    let jan = new Date (aux.getFullYear (), 0, 1)
				    let aug = new Date (aux.getFullYear (), 7, 1)
				    let dst = aug.getTimezoneOffset () - jan.getTimezoneOffset ()

					return (dst)

				}) ()),

				19: (outerWidth || 0) - (innerWidth || 0),
				20: (outerHeight || 0) - (innerHeight || 0),
				21: (devicePixelRatio || 0),
				22: (c_data.length && nav.crc32 (c_data) || 0xFA17ED).toString (16)

			}))

		}, // return user profiling factors

		find: function (realm, query) {

			if (be.object (tio.onchanges ({ queryState: true })).or (clear).easyRetype)

				return

			realm = be.string (realm || this.realm).or ('every')
			query = be.string (query || this.query).or (nav.grab (t_search)).trim ()

			query ? new Requester ().post ({

				uri: '/exec/find',

				pairs: [

					{ name: 'realm', value: realm },
					{ name: 'query', value: query }

				],

				onload: function (sr) {

					let stuff = slash + realm + slash + query.replace (/[^\w\-\x27]+/g, slash).toLowerCase ()

					      try { nav.to (null, 'sys/search' + stuff, { response: JSON.parse (sr.response) }) }
					catch (e) { nav.to (null, 'sys/server/message', { response: String (t_malf_response) }) }

				},

				onwhoa: function (sr) {

					switch (sr.status) {

						case 400: cui.alert ({ argument: t_invalid_query }); return
						case 404: cui.alert ({ argument: t_not_found }); return

						default:

							cui.alert ({ argument: t_search_error })

					}

				}

			}) : null

		},

		clipText: function () {

		    let match = be.vector (tio.it.match (clipMatch)).or (avoid)
		    let field = be.string (match [2]).or (empty)

			return (field)

		}, // return contents of editable text clip

		stubText: function () {

		    let match = be.vector (tio.it.match (stubMatch)).or (avoid)
		    let field = be.string (match [3]).or (empty)

			return (field)

		}, // return contents of secondary editable text clip

		allClear: function (sub) {

		    let home_me = tio.l1 <= tio.cp.j && tio.cp.j <= tio.l2 + 1

			if (nav.jw)

				tio.ai = 2 // undo possible extra indent out of /ME message

			tio.update (tio.it.replace (clipMatch, function (m, s, t, u) { return s + sub + u }))
			home_me && (tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findVCi (tio.bi, tio.l1))))
			nav.locateMarkers ()

			return (tio.onchanges ({ allClear: true })), tio.txt.innerHTML

		}, // replace content of editable text clip, homing the cursor as necessary

		post: function (e) {

		    let id = be.vector (e.label.match (/\~(\w+)\;/)).or ([ '$ID' ]).pop ()
		    let lv = be.vector (e.label.match (/\;(\d+)\,/)).or ([ '#LV' ]).pop ()
		    let cp = cui.posit, q = function () { cui.posit = cp; cui.mq = false }

		    let l1 = tio.findCp (tio.it.indexOf (tilde + id)).j
		    let l2 = tio.findCp (tio.it.indexOf ('```')).j
		    let ln = l1 || (l2 + 1)
		    let mn = be.switch (be.number (parseInt (lv)).or (true)).or (false)

			if ((tio.onchanges ({ queryState: true }) || clear).easyRetype)

				return

			if (cui.mq)

				return

			if (cui.mr)

				return

		    let txt = mn ? nav.clipText () : nav.stubText () || nav.clipText ()

		    let sgo = function () {

				cui.mr = (true)
				let mt = (Math.random () * 9E9).toString (36)
				nav.mt [mt] = true

				new Requester ({ notes: { clip: txt } }).post ({

					uri: mn ? '/exec/postNote' : '/exec/postReply',
					encrypt: true,

					pairs: [

						{ name: 'username', value: nav.username () },
						{ name: 'identity', value: nav.identity () },
						{ name: 'target_p', value: nav.thisPage () },
						{ name: 'reply_to', value: mn ? empty : id },
						{ name: 'new_note', value: txt, encrypt: 1 },
						{ name: 'r_indent', value: lv },
						{ name: 'transact', value: mt }

					],

					onload: function (r) {

					    let note = {

							nn: r.response.split (comma).shift (),
							id: r.response.split (comma).pop (),
							nr: 0,

							body: r.notes.clip.substr (0, +999),
							auth: nav.username ()

						} // note assembly

						if (nav.jw) {

							tio.ai = 2				// undo possible extra indent from /ME action message
							note.compact = true			// using compact rendering: it's a phrase, not a note
							nav.nd [note.id] = note 		// successfully posted, so posting note to dictionary
							tio.onchanges ({ allClear: true })	// should also remove 'addr' and 'note' storage items

							tio.it = tio.it.replace (clipMatch, function (m0, s, t, u) { return s + u })	// clear clip
							nav.rflush (rendering ({ note: note })) 					// append new
							tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findVCi (2, tio.l1)))	// focus clip

							tio.setCursorState ({ state: 'show' })	// display TIO cursor: it's ready for the next phrase
							cui.mr = false				// clearing double-post watchdog flag (modal request)
							return					// bypass de-focusing text clip: we might keep typing

						} // in paged chat

						/*
						 *	remove pending record,
						 *	for main note or reply
						 */

						mn && localStorage.removeItem ('note')		// successfully posted, text is safe server-side, now
						mn || localStorage.removeItem ('repl')		// successfully posted, text is safe server-side, now

						/*
						 *	check for pending record,
						 *	removing pending record's page address if nothing's pending
						 */

					    let pp = be.string (localStorage.note).or (empty).match (/\S/)	// non-empty note is still pending
					    let rp = be.string (localStorage.repl).or (empty).match (/\S/)	// non-void reply is still pending

						pp || rp || localStorage.removeItem ('addr')	// successfully posted, text is safe server-side, now

						/*
						 *	perform UI housekeeping
						 */

						if (mn) {

							// let the onchanges handler know the main note was posted, so it only intercepts replies now

							be.object (tio.onchanges ({ queryState: true })).or (new Object).oneClip = 1

							nav.nc = nav.nc + 1			// successfully posted, so increment note list cursor
							nav.nd [note.id] = note 		// successfully posted, so posting note to dictionary

							nav.rp = true				// pulsing this flag tells L4 to just reload the view	// L4 = label slot #4
							nav.pu = String ('sys/note/header')	// this induces "rflush" to skip matching the postbox

							tio.cp.i = home.colIndex
							tio.cp.j = home.rowIndex
							tio.update (tio.it.replace (postMatch, nline + nline + rendering ({ note: note }) + nline))
							nav.locateMarkers ()

							nav.is || setTimeout (function () { cui.say (cui.ball.rpost) }, 1000)
							cui.mbUpdate ({ live: true, menu: nav.mb.replace ('{<} {>}', '{^^ ~C}') })


						} // new main note

						else {

						    let oc = be.number (tio.onchanges ({ queryState: true }).oneClip).or (0)

							note.reply = true
							note.bOperator = nav.ar.op
							note.r_to = nav.nd [nav.ri].auth
							nav.nd [note.id] = note

							tio.ai = 2
							nav.ri = null

							tio.cp.i = lv = be.number (parseInt (lv, 10)).or (5)
							tio.cp.j = nav.rl

							pp || (tio.onchanges ({ queryState: true }).easyRetype = true)
							oc && (tio.update (tio.it.replace (postMatch, function () { return nline + nav.rr + nline + nline + rendering ({ note: note, indent: lv }) + nline })))
							oc || (tio.update (tio.it.replace (stubMatch, function (m, s) { return s + nav.rr + nline + nline + rendering ({ note: note, indent: lv }) + nline })))

						} // reply to note

						cui.mr = false
						tio.onpgfocus ()

					},

					onwhoa: function (r) {

						switch (r.status) {

							case 403:

								cui.quest ({

									posit: ln,
									assert: cui.mq = true,
									question: (t_sign_up_first),
									exec: nav.to.bind ({ runner: q, destination: 'sys/join/now' }),
									exit: q

								})

								break

							default:

								cui.alert ({

									posit: ln,
									assert: cui.mq = true,
									argument: nav.de_hint (r.response),
									exit: q

								})

						}

						cui.mr = false
						tio.setCursorState ({ state: 'show' })

					},

					assume: tio.setCursorState ({ state: 'hide' })

				})

			}

			if (txt.length > 999)

				return (cui.quest ({

					posit: ln,
					assert: cui.mq = true,
					question: (t_note_too_long),
					exec: sgo,
					exit: q

				}))

			sgo ()

		}, // post note, from editable text clip

		rflush: function (paragraph, opt) {

			switch (nav.pu) {

				case 'sys/note/basics':

				    let n = tio.it.match (postMatch) || { 0: (empty), index: tio.findVCi (0x7FFFFFFF, 2) }
				    let j = n.index + (n [0].length)

					return (tio.update (tio.it.substr (0, j) + paragraph + tio.it.substr (j)))

				case 'sys/note/header':

					return (tio.update (tio.it.substr (0, tio.mb.length) + nline + paragraph + tio.it.substr (tio.mb.length + 1)))

				case 'sys/the/jabberwock':
				case 'sys/il/mascellodonte':

				    let part = tio.it.split ('8<')
				    let text = part [0].replace (/[\x20\t]+$/, empty)
				    let tail = part [0].substr (text.length)
				    let clip = part [1] ? tail + '8<' + part [1] : empty
				    let rows = paragraph.split ('\n').length - 1
				    let hold = be.switch (opt && opt.scroll).or (false) ? false : true

					if (be.switch (opt && opt.tops).or (false)) {

						paragraph = paragraph + text.substr (tio.mb.length + 1)
						text = text.substr (0, tio.mb.length + 1)

					}

					return (tio.update (text + paragraph + clip).positionCursor.call ({ hold: hold }, tio.cp = tio.findCp (tio.ci = tio.findVCi (tio.cp.i, tio.cp.j + rows))))

				case 'sys/feedback/hub':

				    let m = tio.it.match (feedMatch) || { 0: (empty), index: tio.findVCi (0x7FFFFFFF, 2) }
				    let i = m.index + (m [0].length)

					return (tio.update (tio.it.substr (0, i) + paragraph + tio.it.substr (i)))

			} // we know of these possible layouts for this purpose

		}, // post text paragraph flush with rest of content on a notes page

		createMarker: function (args) {

		    let key = be.string (args && args.k).or ('0')
		    let row = be.number (args && args.row).or (1)
		    let noIcon = be.switch (args && args.noIcon).or (false)
		    let eraser = be.switch (args && args.eraser).or (false)
		    let onclick = args && args.onclick

		    let oc = be.lambda (onclick).or (false)
		    let mk = document.createElement ('div')

			nav.ms [key] ? scn.removeChild (nav.ms [key]) : null
			nav.ms [key] = scn.appendChild (mk)

			nav.updateMarker (mk, mk.className = eraser ? 'eraser' : 'mark', mk.placement = row)
			noIcon || cui.reIcon ('heart')

			mk.addEventListener ('click', function (e) {

			    let placement = tio.ch * this.placement - tio.pt

				if (placement < 0)

					tio.scrollTo (tio.ch * this.placement)

				if (placement > innerHeight)

					tio.scrollTo (tio.ch * this.placement - innerHeight + tio.ch)

				oc && oc.call (mk)
				e.preventDefault ()
				e.cancelBubble = true

				setTimeout (function () {

					nav.removeMarker (key)
					cui.reIcon (null)

				}, 50)

			}, { capture: true })

		}, // create new post marker at given row

		removeMarker: function (key) {

			nav.ms [key] ? scn.removeChild (nav.ms [key]) : null
			nav.ms [key] ? delete (nav.ms [key]) : null

		}, // remove new post marker (when displaying post)

		updateMarker: function (marker) {

		    let placement = tio.ch * marker.placement - tio.pt

			marker.style.height = tio.ch.toString () + 'px'
			marker.style.width = (2 * tio.cw).toString () + 'px'

			switch (marker.className) {

				case 'eraser':

					marker.style.top = (placement).toString () + 'px'
					return

				default:

					if (placement < 0) {

						marker.className = 'markUp'
						marker.style.top = '0'

					}

					else if (placement > innerHeight - tio.ch) {

						marker.className = 'markDown'
						marker.style.top = (innerHeight - tio.ch).toString () + 'px'

					}

					else {

						marker.className = 'mark'
						marker.style.top = (placement).toString () + 'px'

					}

			} // erasers don't "splat" against the edge

		}, // reposition marker in consequence of scrolling

		updateMarkers: function () {

			for (let key in nav.ms)

				nav.updateMarker (nav.ms [key])

		}, // reposition all current markers in consequence of scrolling

		locateMarkers: function () {

			if (nav.jw)

				return

			for (let key in nav.ms) {

				if (key.startsWith ('@'))

					continue

				if (key == '0') {

				    let ln = tio.findCp (tio.it.indexOf ('N `` +')).j
				    let tm = nav.ms [key]

					ln === tm.placement || nav.updateMarker (tm, tm.placement = ln)
					continue

				}

			    let l1 = tio.findCp (tio.it.indexOf (tilde + key)); l1.n += tio.it.substr (l1.n).indexOf (nline)
			    let l2 = tio.findCp (l1.n + tio.it.substr (l1.n).indexOf (tilde + key)), ln = (max (l1.j, l2.j))
			    let tm = nav.ms [key]

				ln === tm.placement || nav.updateMarker (tm, tm.placement = ln)

			}

		}, // reposition all affected markers in consequence of changes

		clearMarkers: function () {

			cui.reIcon (null)

			for (let key in nav.ms)

				nav.removeMarker (key)

		}, // remove all markers in consequence of leaving marked pages

		receive: function (entry) {

		    let nm, pm
		    let listOn = listMatch.test (tio.it)
		    let relist = listModel.replace ('${n}', 'N' + field + ('+') + (nav.dl.length + 1) + blank + t_to_read)

			if (entry.code in nav.mt)		    // yes, at least once, I saw this happening: a double
								    // post I was the author of; I'm thinking it could be
				return				    // due to the response to your request to post coming
								    // after the event poller receives the same note: the
								    // condition set here can guard about that, comparing
								    // the transaction code sent by THIS session, without
								    // revealing anything about session IDs or their hash

			nav.dl.push (entry)						// queue note to display list
			nav.nc = nav.nc + 1						// increment note list cursor
			nav.nd [entry.id] = entry					// place note into dictionary

			if (listOn === false) {

				nm = Object ({ index: 0, 2: empty })			// no-match placeholder
				pm = be.vector (tio.it.match (postMatch)).or (nm)	// post box match (main note)
			    let ph = pm [2].split (nline).length			// post height in lines
			    let fp = tio.findCp (pm.index).j + ph			// first PICK position (line)
			    let lh = listModel.split (nline).length - 1 		// list height in lines

				nav.ri && (nav.rl = nav.rl + lh)			// if responding to a note	(update reply line index to account for the list)
				tio.cp.j > fp + 2 && (tio.cp.j = tio.cp.j + lh) 	// if cr below bottom of box	(update cursor position, to account for the list)

			}								// if list was not in show

			listOn || nav.rflush (relist)					// insert list if not present
			listOn && tio.update (tio.it.replace (listMatch, relist))	// update list

			nm = Object ({ index: 0, 2: empty })				// no-match placeholder
			pm = be.vector (tio.it.match (listMatch)).or (nm)		// list match
			nav.createMarker ({ k: '0', row: tio.findCp (pm.index).j + 1 }) // +1 accounts for the "frame"
			nav.locateMarkers ()						// reposition existing markers

		}, // receive primary note, as spectator

		display: function () {

		    let dl = new Array
		    let dr = nav.dl.reverse ()

			for (let note of dr)

				dl.push (rendering ({ note: note }))

			tio.it = tio.it.replace (listMatch, empty)

		    let nm = Object ({ index: 0, 2: empty })				// no-match placeholder
		    let pm = be.vector (tio.it.match (postMatch)).or (nm)		// post box match (main note)
		    let ph = pm [2].split (nline).length				// post height in lines
		    let lh = listModel.split (nline).length - 1 			// list height in lines
		    let fp = tio.findCp (pm.index).j + ph				// first PICK position (line)
		    let dh = dl.length - lh						// displaylist height in lines

			nav.ri && (nav.rl = nav.rl + dh)				// if responding to a note	(update reply line index to account for the list)
			tio.cp.j > fp + 2 && (tio.cp.j = tio.cp.j + dh) 		// if cr below bottom of box	(update cursor position, to account for the list)

			nav.dl = new Array
			nav.rflush (dl.join (nline) + nline)
			nav.removeMarker (0)
			nav.locateMarkers ()

		}, // display primary notes as spectator

		replied: function (note) {

		    let id = be.string (note.pn).or ('no-parentID')
		    let pn = be.object (nav.nd [id]).or (undefined)
		    let dl = be.vector (pn && pn.dl).or (new Array)

		    let l1 = tio.findCp (tio.it.indexOf (tilde + id)); l1.n += tio.it.substr (l1.n).indexOf (nline)
		    let l2 = tio.findCp (l1.n + tio.it.substr (l1.n).indexOf (tilde + id)), ln = (max (l1.j, l2.j))

			if (note.code in nav.mt)					// see commentary at "nav.receive": we may be the authors of this

				return

			if (nav.nd [note.id])

				return							// none of our business - we've POSTED this, we know

			if (undefed (pn))

				return							// we don't know the parent, yet

			if (l1.j && l2.j) {

			    let L = tio.it.split (nline)
			    let h = L.slice (0, ln)
			    let f = L.slice (ln)
			    let i = L [ln].match (/\s*/).pop ()
			    let s = L [ln].split (tilde).pop ()

				pn.dl = dl						// create display list if needed
				pn.nr = pn.nr + 1					// we've got one more reply here
				pn.dl.push (note)					// if the length of the note's own display list will equal its "nr", we won't need a request to load replies

				nav.nd [note.id] = note 				// ok, we've got and stored this

				f [0] = i + pick + '[' + t_see + (blank + pn.nr + blank) + (pn.nr > 1 ? t_replies : t_reply) + (tilde + s) + ']'

				tio.update (h.concat (f).join (nline))
				nav.createMarker ({ k: id, row: ln })

			} // parent found on-screen

		}, // receiving reply, as spectator

		disroll: function (e) {

		    let id = be.vector (e.label.match (/\~(\w+)\;/)).or ([ '$ID' ]).pop ()
		    let lv = be.vector (e.label.match (/\;(\d+)\,/)).or ([ '#LV' ]).pop ()
		    let cp = cui.posit, q = function () { cui.posit = cp; cui.mq = false }

		    let pn = be.object (nav.nd [id]).or (undefined)
		    let dl = be.vector (pn && pn.dl).or (new Array)

		    let l1 = tio.findCp (tio.it.indexOf (tilde + id)); l1.n += tio.it.substr (l1.n).indexOf (nline)
		    let l2 = tio.findCp (l1.n + tio.it.substr (l1.n).indexOf (tilde + id)), ln = (max (l1.j, l2.j))

			if (undefed (pn) || ln === 0) {

				cui.alert ({

					argument: t_ui_incons,
					assert: cui.mq = true,
					posit: ln || cui.posit,
					exit: q

				})

				return

			} // for some reason, we can't find this post on display (anymore)

			if (pn.nr === dl.length) {

			    let n = 0
			    let t = nline
			    let l = new Array

				for (let note of dl) {

					if (note.auth in nav.ii)

						continue

					l.push (note = t + rendering ({ note: nav.nd [note.id] = note, indent: parseInt (lv), where: note.reply = true }))

					t = nline
					n = n + note.match (/\n/g).length

				}

				pn.dl = new Array
				pn.nr = 0

			    let L = tio.it.split (nline)
			    let h = L.slice (0, ln)
			    let f = L.slice (++ ln)

				n > 0 || (l = l.join (empty) + pn.shortLine)
				n > 0 && (l = l.join (empty) + pn.lifeLine)
				n > 0 && (n = n + 1)

				ln < tio.cp.j && (tio.cp.j = tio.cp.j + n)
				ln < (nav.rl) && (nav.ri) && (nav.rl += n)

				h.push (l)
				tio.update (h.concat (f).join (nline))
				tio.setCursorState ({ state: 'hide' })
				nav.removeMarker (id)
				nav.locateMarkers ()

				return

			} // we either got the server response or all replies were received in real time

			nav.dr.requestInProgress || nav.dr.post ({

				uri: '/exec/listReplies',

				pairs: [

					{ name: 'username', value: nav.username () },
					{ name: 'identity', value: nav.identity () },
					{ name: 'target_p', value: nav.thisPage () },
					{ name: 'parent_n', value: pn.id || (null) }

				],

				onload: function (r) {

					try { r.response = JSON.parse (r.response) }

						catch (e) {

							cui.alert ({

								posit: ln,
								assert: cui.mq = true,
								argument: t_malf_response,
								exit: q

							})

							return

						}

					r.notes.pn.nr = r.response.length
					r.notes.pn.dl = r.response.sort (function (n1, n2) { return (parseInt (n1.id.substr (0, 9), 36) - parseInt (n2.id.substr (0, 9), 36)) })

					nav.disroll (r.notes.event)

				}, // response is an array of notes: now they're cached, so display them

				onwhoa: function (r) {

					cui.alert ({

						posit: ln,
						assert: cui.mq = true,
						argument: nav.de_hint (r.response),
						exit: q

					})

				}, // list replies failure

				assert: nav.dr.notes = { pn: pn, event: e }	// current run's binding

			}) // all or some replies aren't currently in hold: query server for all replies

		}, // unroll replies

		expunge: function (e, confirm_quest, modality) {

		    let id = be.vector (e.label.match (/\~(.+?)\;/)).or ([ '$ID' ]).pop ()
		    let nl = be.vector (e.label.match (/\,(\d+)$/i)).or ([ '#NL' ]).pop ()
		    let ln = be.number (tio.findCp (tio.it.indexOf (tilde + id)).j).or (0)
		    let cp = cui.posit, q = function () { cui.posit = cp; cui.mq = false }

			ln && cui.quest ({

				posit: ln,
				assert: cui.mq = true,
				question: confirm_quest,

				exec: function () {

				    let page = id.charAt (0) == score
				    let path = id.substr (1)
				    let parts = id.split (slash)

					page && new Requester ().post ({

						uri: '/exec/publish',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () },
							{ name: 'manouver', value: String ('WIPEOUT') },
							{ name: 'manifest', value: String ('PERMIT') },
							{ name: 'comments', value: String ('PERMIT') },
							{ name: 'np_title', value: tb (parts.pop ()) },
							{ name: 'np_group', value: tb (parts.pop ()) },
							{ name: 'old_page', value: path }

						],

						onload: q,
						onwhoa: function (r) { cui.alert ({ exit: q, argument: nav.de_hint (r.response) }) }

					}) // expunging page

					page || new Requester ().post ({

						uri: '/exec/dropNote',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () },
							{ name: 'target_p', value: rc (nav.st.permapaths [id] || empty) || nav.thisPage () },
							{ name: 'n_2_drop', value: id },
							{ name: 'modality', value: modality || '0' }

						],

						onload: q,
						onwhoa: function (r) { cui.alert ({ exit: q, argument: nav.de_hint (r.response) }) }

					}) // expunging note

				},

				exit: q

			})

		}, // operator expunge (page or note)

		avulse: function (e, confirm_quest) {

		    let n = be.vector (e.label.match (/\~(.+)/)).or ([ '$ID' ]).pop ()
		    let q = function () { cui.mq = false }

			cui.quest ({

				assert: cui.mq = true,
				question: confirm_quest,

				exec: function () {

					new Requester ().post ({

						uri: '/exec/dropNote',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () },
							{ name: 'target_p', value: nav.thisPage () },
							{ name: 'n_2_drop', value: n }

						],

						onload: function (r) { cui.alert ({ exit: q, argument: nav.de_hint (r.response) }) },
						onwhoa: function (r) { cui.alert ({ exit: q, argument: nav.de_hint (r.response) }) }

					}) // avulsing chat note

				},

				exit: q

			})

			tio.kbFunctions.ro_home ()

		}, // operator avulse (chat note)

		legit: function (e) {

		    let id = be.vector (e.label.match (/\~(.+?)\;/)).or ([ '$ID' ]).pop ()
		    let ln = be.number (tio.findCp (tio.it.indexOf (tilde + id)).j).or (0)
		    let cp = cui.posit, q = function () { cui.posit = cp; cui.mq = false }

			if (ln) {

			    let targetPermaPath = rc (nav.st.permapaths [id] || empty) || nav.thisPage ()
			    let pg = id.charAt (0) == score

				new Requester ().post ({

					uri: '/exec/legit',

					pairs: [

						{ name: 'username', value: nav.username () },
						{ name: 'identity', value: nav.identity () },
						{ name: 'target_p', value: targetPermaPath },
						{ name: 'n_2legit', value: pg ? empty : id }

					],

					onwhoa: function (r) {

						cui.posit = ln
						cui.mq = true

						cui.alert ({ exit: q, argument: nav.de_hint (r.response) })

					},

					onload: q

				})

			}

		}, // operator legitimize note

		report: function (e) {

		    let id = be.vector (e.label.match (/\~(\w+)\;/)).or ([ '$ID' ]).pop ()
		    let ln = be.number (tio.findCp (tio.it.indexOf (tilde + id)).j).or (0)
		    let cp = cui.posit, q = function () { cui.posit = cp; cui.mq = false }

			if (ln && nav.id === false) {

			    let rt = (tio.onchanges ({ queryState : true }) || clear).returns_to || null

				rt ? (localStorage.addr = rt) : (undefined)

				cui.quest ({

					posit: ln,
					assert: cui.mq = true,
					question: t_sign_up_first,
					exec: nav.to.bind ({ runner: q, destination: 'sys/join/now' }),
					exit: q

				})

				return

			}

			ln && cui.quest ({

				posit: ln,
				assert: cui.mq = true,
				question: t_conf_report,

				exec: function () {

					new Requester ().post ({

						uri: '/exec/report',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () },
							{ name: 'target_p', value: nav.thisPage () },
							{ name: 'n_2_flag', value: id }

						],

						onload: function (r) { cui.alert ({ exit: q, argument: t_report_conf }) },
						onwhoa: function (r) { cui.alert ({ exit: q, argument: nav.de_hint (r.response) }) }

					})

				},

				exit: q

			})

		}, // visitor report note

		thanks: function (e) {

		    let id = be.vector (e.label.match (/\~(\w+)\;/)).or ([ '$ID' ]).pop ()
		    let ln = be.number (tio.findCp (tio.it.indexOf (tilde + id)).j).or (0)
		    let cp = cui.posit, q = function () { cui.posit = cp; cui.mq = false }

			ln && cui.alert ({

				posit: ln,
				assert: cui.mq = true,
				argument: t_report_conf,
				exit: q

			})

		},

		allowed: function (e) {

		    let id = be.vector (e.label.match (/\~(\w+)\;/)).or ([ '$ID' ]).pop ()
		    let ln = be.number (tio.findCp (tio.it.indexOf (tilde + id)).j).or (0)
		    let cp = cui.posit, q = function () { cui.posit = cp; cui.mq = false }

			ln && cui.alert ({

				posit: ln,
				assert: cui.mq = true,
				argument: t_legitimized,
				exit: q

			})

		},

		condemn: function (e) {

		    let id = be.vector (e.label.match (/\~(\w+)\;/)).or ([ '$ID' ]).pop ()
		    let ln = be.number (tio.findCp (tio.it.indexOf (tilde + id)).j).or (0)
		    let cp = cui.posit, q = function () { cui.posit = cp; cui.mq = false }

			ln && cui.quest ({

				posit: ln,
				assert: cui.mq = true,
				question: t_conf_condemn,

				exec: function () {

					new Requester ().post ({

						uri: '/exec/condemn',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () },
							{ name: 'target_p', value: nav.thisPage () },
							{ name: 'n_2_drop', value: id }

						],

						onload: function (r) { cui.alert ({ exit: q, argument: t_condemn_conf }) },
						onwhoa: function (r) { cui.alert ({ exit: q, argument: nav.de_hint (r.response) }) }

					})

				},

				exit: q

			})

		}, // authors condemn note

		expunged: function (id) {

		    let l1 = tio.findCp (tio.it.indexOf (tilde + id)).j
		    let l2 = tio.findCp (tio.it.indexOf (tilde + score + id)).j
		    let ln

			if (ln = l1 || l2) {

			    let L = tio.it.split (nline)
			    let p = L [ln]
			    let N = p.match (/\,(\d+)[\}\]]/) || [nought]
			    let n = parseInt (be.vector ((N)).or (nought).pop ())

				switch (nav.nf) {

					case true:

					    let h = L.slice (0, ln)
					    let f = L.slice (ln)
					    let t = 1 + (nav.ri ? nav.rl - nav.rn : h.length - n)

						h [t] = h [t].replace (RegExp ('\\/.*?\\/'), slash + t_dropped + slash)
						f [0] = f [0].replace (RegExp (/[\[\{].*[\}\]]/), '{' + t_permaL + '}')

						tio.cp.j == ln ? tio.cp.i = 8 : (null)
						tio.update (h.concat (f).join (nline))

						break

					case false:

						if (id === nav.ri) {

							nav.rr = String (empty)
							ln = nav.rl - 1

						}

						else {

							tio.cp.j == ln ? tio.cp.i = 2 : null
							n = n + 1

						}

						for (let i = 0; i < n; ++ i)

							L [ln - i] = (empty)

						n = ln
						N = L.length

						for (let j = n; j < N; ++ j)

							L [j].indexOf (tilde + id) < 0 || L [j].indexOf (comma + 'L') < 0 || (L [j] = empty)

						tio.update (L.join (nline))

				}

				return

			} // found onscreen

			switch (nav.nf) {

				case true:

					for (let note in nav.dl)

						if (nav.dl [note] === id)

							nav.dl [note].isDropped = true

					break

				case false:

				    let dl = new Array

					for (let note of nav.dl)

						(note.id === id) || dl.push (note)

					nav.dl = dl
					nav.dl.length || tio.update (tio.it.replace (listMatch, empty))

			} // fetched in displaylist

		}, // spectator expunge note

		condemned: function (id) {

		    let ln = tio.findCp (tio.it.indexOf (tilde + id)).j

			if (ln) {

			    let L = tio.it.split (nline)
			    let h = L.slice (0, ln)
			    let f = L.slice (ln)
			    let p = L [ln]
			    let N = p.match (/\,(\d+)[\}\]]/) || [nought]
			    let n = parseInt (be.vector ((N)).or (nought).pop ())
			    let t = h.length - n + 1

				h [t] = h [t].replace (RegExp ('\\/.*\\/'), slash + t_condemned + slash)
				f [0] = f [0].replace (RegExp ('\\s[\\[\\{]' + reg_escape (t_condemn) + '\\~.+?[\\}\\]]'), empty)

				tio.cp.j == ln ? tio.cp.i = 8 : null
				tio.update (h.concat (f).join (nline))

				return

			} // found onscreen

			for (let note of nav.dl)

				(note.id === id) && (note.condemned = true)

		}, // spectator condemn note

		reported: function (id) {

		    let ln = tio.findCp (tio.it.indexOf (tilde + id)).j

			if (ln) {

			    let L = tio.it.split (nline)
			    let h = L.slice (0, ln)
			    let f = L.slice (ln)
			    let p = L [ln]
			    let N = p.match (/\,(\d+)[\}\]]/) || [nought]
			    let n = parseInt (be.vector ((N)).or (nought).pop ())
			    let t = h.length - n + 1

				h [t] = h [t].replace (RegExp ('\\/.*\\/'), slash + t_reported + slash)
				f [0] = f [0].replace (RegExp ('\\s[\\[\\{]' + reg_escape (t_flag_note) + '(\\~.+?)[\\}\\]]'), '{' + t_thanks + '$1}')

				if (nav.ar.op) // if we're an operator, we might like the "legit" link to appear now

					f [0] = f [0] + blank + '{' + t_legit + tilde + id + semic + comma + n + '}'

				tio.cp.j == ln ? tio.cp.i = 8 : (null)
				tio.update (h.concat (f).join (nline))

				return

			} // found onscreen

			for (let note of nav.dl)

				(note.id === id) && (note.isFlagged = true)

		}, // spectator report note

		legitimized: function (id) {

		    let ln = tio.findCp (tio.it.indexOf (tilde + id)).j
		    let nt = nav.nd [id]
		    let ab = empty

			if (ln) {

			    let L = tio.it.split (nline)
			    let h = L.slice (0, ln)
			    let f = L.slice (ln)
			    let p = L [ln]
			    let N = p.match (/\,(\d+)[\}\]]/) || [nought]
			    let n = parseInt (be.vector ((N)).or (nought).pop ())
			    let t = h.length - n + 1

				if (nt) {

					nt.reply || (ab = nt.path)
					nt.reply && (ab = nt.r_to)

					ab = t_topic + blank + tb (be.string (ab).or (empty).split (slash).pop ())

				}

				h [t] = h [t].replace (RegExp ('\\/[^]*\\/'), '/' + ab + '/')
				f [0] = f [0].replace (RegExp ('\\s[\\[\\{]' + reg_escape (t_legit) + '\\~.+?[\\}\\]]'), empty)

				tio.cp.j == ln ? tio.cp.i = 8 : (null)
				tio.update (h.concat (f).join (nline))

				return

			} // found onscreen

			for (let note of nav.dl)

				(note.id === id) && (note.isFlagged = false)

			for (let note of nav.dl)

				(note.id === id) && (note.doNotFlag = true)

		}, // spectator legitimize note

		append: function (entry) {

			if (entry.code in nav.mt)					// see commentary at "nav.receive": we may be the authors of this

				return

			nav.nd [entry.id] = entry					// place note into dictionary
			nav.rflush (rendering ({ note: entry }))			// visually append note
			nav.createMarker ({ k: '0', row: tio.l1 - 2 })			// place "new note" marker, 2 rows above the first row we type in

		}, // receive new note in paged chats (as "phrase")

		tops: function () {

			tio.scrollTo (0)

		}, // bring (paged chat) to top

		address: function (username) {

		    let state = be.object (tio.onchanges ({ queryState: true })).or (clear)
		    let typed = state.easyRetype ? empty : nav.clipText ()
		    let toSay = block + '[]' + aster + tb (username) + aster + '->' + blank

			typed.startsWith (toSay) || setTimeout (function () {

				state.easyRetype = false
				nav.allClear (toSay + typed)
				tio.kbFunctions.ro_ctrlEnd ()

			}, 33)

		}, // address given username in paged chats (reply)

		reply: function (e) {

		    let rt = be.string ((tio.onchanges ({ queryState : true }) || clear).returns_to).or (null)
		    let pr = be.string (localStorage.addr).or (empty) === rt
		    let rp = be.string (pr ? localStorage.repl : 0).or ('\t').match (/\S/)
		    let rx = be.string (nav.foldUp ()).or (rp ? localStorage.repl : empty)

		    let rs = be.vector (e.label.match (/^([^]+)\~/)).or ([ '$RS' ]).pop ()
		    let id = be.vector (e.label.match (/\~(\w+)\;/)).or ([ '$ID' ]).pop ()
		    let lv = be.vector (e.label.match (/\;(\d+)\,/)).or ([ '#LV' ]).pop ()
		    let nl = be.vector (e.label.match (/\,(\d+)$/i)).or ([ '#NL' ]).pop ()
		    let ln = be.number (tio.findCp (tio.it.indexOf (tilde + id)).j).or (0)
		    let cp = cui.posit, q = function () { cui.posit = cp; cui.mq = false }

			if (nl && ln) {

				if (nav.id === false) {

					rt ? (localStorage.addr = rt) : (undefined)

					cui.quest ({

						posit: ln,
						assert: cui.mq = true,
						question: t_sign_up_first,
						exec: nav.to.bind ({ runner: q, destination: 'sys/join/now' }),
						exit: q

					})

					return

				}

			    let x_reply = rs == t_reply_verb ? t_your_reply : t_postscript
			    let L = tio.it.split (nline)

				tio.ai = lv = be.number (parseInt (lv)).or (5)
				nav.ri = id
				nav.rl = ln
				nav.rn = parseInt (nl)
				nav.rr = L [ln]

			    let h = L.slice (0, ln)
			    let f = L.slice (++ ln)

			    let tt = reframing (x_reply, tio.nc - lv - 2, minus, slash).substr (2)
			    let bq = Array (lv + 1).join (blank)
			    let tq = bq.substr (2)

				h.push (empty)		// appending three newline character codes to space reply boxes evenly:
				h.push (empty)		// these match (ln + 3) in cursor positioning ad the end of this block,
				h.push (empty)		// and the three \n\n\n entries in the stubMatch regular expression

				h.push (bq + '8<' + tt)
				h.push (rx)
				h.push (bq + horizrule (0, tio.nc - lv - 11) + blank + '``` -->8')
				h.push (tq + pick + `[${t_post}~${id};${lv},${nl}] {${t_give_up}} {${t_fold_up}} {${t_paste_link}}`)

				h.push (empty)
				h.push (empty)

				tio.update (h.concat (f).join (nline))
				tio.onwifocus.call ()
				tio.setCursorState ({ state: 'show' })
				tio.positionCursor.call (tio.cp = tio.findCp (tio.ci = tio.findVCi (0, ln + 3) + rx.length))
				nav.locateMarkers ()

			} // found onscreen

		}, // reply, to note

		foldUp: function () {

		    let rev_ai = tio.ai - 2
			tio.ai = 2

			if (nav.ri) {

			    let R = be.number (tio.onchanges ({ queryState: true }).oneClip).or (0) ? nav.clipText () : nav.stubText ()
			    let N = R.split (nline).length + 8
			    let L = tio.it.split (nline)
			    let h = L.slice (0 , nav.rl)
			    let f = L.slice (N + nav.rl)

				tio.onpgfocus ()
				tio.update (h.concat ([ nav.rr ]).concat (f).join (nline))
				tio.positionCursor.call ({ hold: true, given: tio.setCursorState ({ state: 'hide' }) }, tio.cp = tio.findCp (tio.ci = tio.findVCi (rev_ai + 2, nav.rl)))
				nav.locateMarkers ()

				return (nav.ri = null), R

			} // we were replying

			return (null)

		}, // fold up reply, to notes

		giveUp: function () {

			nav.foldUp ()
			tio.onchanges ({ clear: true })

		}, // give up content of reply to note

		flag: function (e) {

		    let cp = cui.posit, q = function () { cui.posit = cp }

			cui.quest ({

				posit: nav.fl,
				question: t_conf_report,

				exec: function () {

					new Requester ().post ({

						uri: '/exec/report',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () },
							{ name: 'target_p', value: nav.thisPage () }

						],

						onload: function (r) { cui.alert ({ exit: q, argument: t_report_conf }) },
						onwhoa: function (r) { cui.alert ({ exit: q, argument: nav.de_hint (r.response) }) }

					})

				},

				exit: q

			})

			e && e.preventDefault && e.preventDefault ()
			be.object (e).or (new Object).cancelBubble = true

		}, // viewers' report page

		join: function (e) {

		    let cp = cui.posit
		    let cy = tio.cp.y

		    let q = function () {

				cui.posit = cp
				tio.cp.y = cy

			}

		    let x = function () {

				cui.posit = cp
				tio.cp.y = cy

				tio.update (tio.it.replace ('~J', '~S'))

			}

			cui.quest ({

				posit: nav.fl,
				question: t_conf_join,

				exec: function () {

					cui.board (false, {

						posit: nav.fl,
						question: t_pass_join,

						exec: function (join_password) {

							new Requester ().post ({

								uri: '/exec/join',

								pairs: [

									{ name: 'username', value: nav.username () },
									{ name: 'identity', value: nav.identity () },
									{ name: 'target_n', value: nav.thisUser () },
									{ name: 'password', value: (join_password) }

								],

								onload: function (r) { cui.alert ({ posit: nav.fl, exit: x, argument: t_join_conf }) },
								onwhoa: function (r) { cui.alert ({ posit: nav.fl, exit: q, argument: nav.de_hint (r.response) }) }

							})

						},

						exit: q

					})

				},

				exit: q

			})

			e && e.preventDefault && e.preventDefault ()
			be.object (e).or (new Object).cancelBubble = true

		}, // alias account join

		severe: function (e) {

		    let cp = cui.posit
		    let cy = tio.cp.y

		    let q = function () {

				cui.posit = cp
				tio.cp.y = cy

			}

		    let x = function () {

				cui.posit = cp
				tio.cp.y = cy

				tio.update (tio.it.replace ('~S', '~J'))

			}

			cui.quest ({

				posit: nav.fl,
				question: t_conf_severe,

				exec: function () {

					cui.board (false, {

						posit: nav.fl,
						question: t_pass_severe,

						exec: function (join_password) {

							new Requester ().post ({

								uri: '/exec/severe',

								pairs: [

									{ name: 'username', value: nav.username () },
									{ name: 'identity', value: nav.identity () },
									{ name: 'target_n', value: nav.thisUser () },
									{ name: 'password', value: (join_password) }

								],

								onload: function (r) { cui.alert ({ posit: nav.fl, exit: x, argument: t_severe_conf }) },
								onwhoa: function (r) { cui.alert ({ posit: nav.fl, exit: q, argument: nav.de_hint (r.response) }) }

							})

						},

						exit: q

					})

				},

				exit: q

			})

			e && e.preventDefault && e.preventDefault ()
			be.object (e).or (new Object).cancelBubble = true

		}, // alias account severe

		announce: function (e) {

		    let cp = cui.posit, q = function () { cui.posit = cp }

			cui.quest ({

				posit: nav.fl,
				question: t_conf_announce,

				exec: function () {

					new Requester ().post ({

						uri: '/exec/announce',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () },
							{ name: 'target_p', value: nav.thisPage () }

						],

						onload: function (r) { cui.alert ({ exit: q, argument: t_announce_conf }) },
						onwhoa: function (r) { cui.alert ({ exit: q, argument: nav.de_hint (r.response) }) }

					})

				},

				exit: q

			})

			e && e.preventDefault && e.preventDefault ()
			be.object (e).or (new Object).cancelBubble = true

		}, // owner announce page

		pastPage: function () {

		    let cursor = nav.pi
		    let places = function () { return tio.it.split ('8<').shift ().split (nline).length }

			nav.pi = Math.max (0, nav.pi - 37)

			new Requester ().post ({

				uri: slash + nav.pu + '~note',

				pairs: [

					{ name: 'username', value: nav.username () },
					{ name: 'identity', value: nav.identity () },
					{ name: 'index', value: nav.pi.toString () },
					{ name: 'cursor', value: cursor.toString () }

				],

				onload: function (r) {

				    let m = places ()

					try {

					    let response = JSON.parse (r.response)
					    let notes = empty, timed = true

						for (note in (response.notes || clear)) {

							note = response.notes [note]

							if (note.auth in nav.ii) {

								notes = notes || nline
								continue

							}

							note.compact = true
							note.header = timed
							timed = false
							notes = notes + rendering ({ note: note })

						}

						nav.rflush (notes, { tops: true })
						nav.pi = parseInt (response.index)

					}

					catch (e) {

						nav.rflush (block + reframing (t_malf_response, tio.nc - 4, minus, aster) + nline, { tops: true })
						nav.rflush (block + reframing (t_status_200but, tio.nc - 4, equal, aster) + nline, { tops: true })

					}

				    let n = places ()

					for (let key in nav.ms) {

						let mark = nav.ms [key]
						mark.placement += n - m
						nav.updateMarker (mark)

					}

				},

				onwhoa: function (r) {

					nav.rflush (block + reframing (be.string (r && r.text).or ('?').toString (), tio.nc - 4, minus, aster) + nline, { tops: true })

					for (let key in nav.ms) {

						let mark = nav.ms [key]
						nav.updateMarker (mark, ++ mark.placement)

					}

				},

				assert: rendering ({ reset: true })	// reset compact note rendering state: needed by paged chats (jabberwocks)

			})

		}, // roll back paged chat

		loadSomething: function (args) {

		    let event = be.object (args && args.event).or (clear)
		    let limit = be.number (args && args.limit).or (99999)
		    let e_big = be.string (args && args.e_big).or (String ('ow/something/too/large'))
		    let mLoad = be.string (args && args.mLoad).or (String ('LOADING SOMETHING'))
		    let u_r_i = be.string (args && args.u_r_i).or (String ('/loadSomething'))
		    let tName = be.string (args && args.tName).or (String ('target_n'))
		    let t_val = be.string (args && args.t_val).or (String ('USERNAME'))
		    let whoa2 = be.string (args && args.whoa2).or (String ('sys/some/load/error'))
		    let load2 = be.lambda (args && args.load2).or (idler)

			event.preventDefault ()

			if (this.files [0].size > limit)

				return (nav.to (null, e_big))

		    let r = new FileReader ()

			r.onload = function (e) {

				tio.ot = avoid	// clear TIO overlays on next live menu bar update
				nav.pu = empty	// prevent scstHistory record

				nav.array.hide ()
				tio.onpgfocus (e)
				tio.disconnectKeyboard ()
				tio.cls (null, nav.cb).cls (cui.mbUpdate ({ live: true, menu: nav.db }), nav.cb).scrollTo (0, true)

				tio.type ({

					text: [,mLoad,t_stay_on_tab,,].join (nline + block),

					cps: 30,
					lim: 0,

					oncompletion: function () {

						new Requester ({ notes: { meter: 0 } }).post ({

							uri: u_r_i,

							pairs: [

								{ name: (tName),    value: t_val },
								{ name: 'username', value: nav.username () },
								{ name: 'identity', value: nav.identity () },
								{ name: 'data_url', value: this.target.result }

							],

							onprog: function (e) {

							    let dots = ~~ (56 * e.loaded / e.total)

								tio.putKey.call ({

									key: Array (1 + dots - this.notes.meter).join ('.'),

									typed: true,
									hence: this.notes.meter = dots

								})

							},

							onload: function (r) {

								tio.type ({

									text: Array (57 - r.notes.meter).join ('.'), cps: 30, lim: 0,
									oncompletion: load2 (r)

								})

							},

							onwhoa: function (r) {

								tio.type ({

									text: Array (57 - r.notes.meter).join ('X'), cps: 30, lim: 0,
									oncompletion: function () { nav.to (null, 'sys/server/message', { path: whoa2, response: nav.de_hint (this.response) }) }.bind (r)

								})

							}

						})

					}.bind (e)

				})

			}

			r.readAsDataURL (this.files [0])

		}, // generic file uploader

		loadCover: function (e) {

			nav.loadSomething.call (this, {

				event: e,
				limit: 1048576,
				e_big: String ('ow/cover/too/large'),
				mLoad: t_loadingCover,
				u_r_i: String ('/exec/writeCover'),
				tName: String ('target_n'),
				t_val: nav.thisUser (),
				whoa2: String ('sys/cover/load/error'),

				load2: function (r) {

					sessionStorage [r.response] = '?utime=' + Date.now ()
					nav.to (null, null, { interstitial: true })

				}

			})

		}, // home cover picture loader

		loadImage: function (e) {

			nav.loadSomething.call (this, {

				event: e,
				limit: 8388608,
				e_big: String ('ow/image/too/large'),
				mLoad: t_loadingImage,
				u_r_i: String ('/exec/writeImage'),
				tName: String ('target_p'),
				t_val: nav.thisPage (),
				whoa2: String ('sys/img/upload/error'),

				load2: function (r) {

					sessionStorage [r.response.replace (/\/[dhs]\-/, '/g-')] =
					sessionStorage [r.response.replace (/\/[dhs]\-/, '/h-')] =
					sessionStorage [r.response.replace (/\/[dhs]\-/, '/r-')] =
					sessionStorage [r.response.replace (/\/[dhs]\-/, '/s-')] =

						'?utime=' + Date.now ()

					nav.to (null, null, { interstitial: true })

				}

			})

		}, // page cover picture loader

		updateModel: function (args) {

		    let st = nav.st.mc

		    let init =	    be.switch (args && args.init).or (false)
		    let text =	    be.string (args && args.text).or (null)
		    let size =	    be.number (args && args.size).or (null)
		    let edge =	    be.string (args && args.edge).or (null)
		    let anix =	    be.number (args && args.anix).or (null)
		    let aniy =	    be.number (args && args.aniy).or (null)
		    let aniz =	    be.number (args && args.aniz).or (null)
		    let lay =	    be.number (args && args.lay).or (null)
		    let solid =     be.switch (args && args.solid).or (null)
		    let flat =	    be.switch (args && args.flat).or (null)
		    let shiny =     be.switch (args && args.shiny).or (null)
		    let owned =     be.switch (args && args.owned).or (null)
		    let spacing =   be.number (args && args.spacing).or (null)
		    let thickness = be.number (args && args.thickness).or (null)
		    let threshold = be.number (args && args.threshold).or (null)
		    let yaw =	    be.number (args && args.yaw).or (be.number (nav.array.instance && nav.array.instance.orient.yaw).or (0))

			text	  === null || (st.text = text)
			size	  === null || (st.size = size)
			edge	  === null || (st.edge = edge)
			anix	  === null || (st.anis.x = anix)
			aniy	  === null || (st.anis.y = aniy)
			aniz	  === null || (st.anis.z = aniz)
			lay	  === null || (st.lay = lay)
			solid	  === null || (st.solid = solid)
			flat	  === null || (st.flat = flat)
			shiny	  === null || (st.shiny = shiny)
			owned	  === null || (st.owned = owned)
			spacing   === null || (st.spacing = spacing)
			thickness === null || (st.thickness = thickness)
			threshold === null || (st.threshold = threshold)

			if (solid !== null || flat !== null || shiny !== null || owned !== null || lay !== null) {

				if (solid !== null) {

					st.flags.numeric &= 0b0111
					st.flags.numeric |= 0b1000 * (solid ? 1 : 0)

				}

				if (flat !== null) {

					st.flags.numeric &= 0b1011
					st.flags.numeric |= 0b0100 * (flat ? 0 : 1)

				}

				if (shiny !== null) {

					st.flags.numeric &= 0b1101
					st.flags.numeric |= 0b0010 * (shiny ? 0 : 1)

				}

				if (owned !== null) {

					st.flags.numeric &= 0b1110
					st.flags.numeric |= 0b0001 * (owned ? 1 : 0)

				}

				lay === null || (nav.kb.rrfn (nav.array.la = (lay !== 0)))
				ctl.className = (innerWidth > innerHeight ? 'amc' : 'tmc') + (st.flags.literal = st.flags.numeric.toString (16).toUpperCase ())

			} // AMC3 flag "lights" update

			if (threshold !== null) {

				init || (nav.st.live.st = 0.02)
				init || (nav.st.live.ld_hm = 0)
				init || (clearTimeout (nav.t8))
				init || (nav.t8 = setTimeout (function () { nav.st.live.st = 2000; nav.st.live.ld_hm = 99 }, 1000))

			} // culling threshold "preview"

			/*
			 *	create or "re-construct" the held model
			 */

			nav.array.model = new MultiModel ({

				from:		st.text,
				solid:		st.solid,
				flat:		st.flat,
				shiny:		st.shiny,
				spacing:	st.spacing,
				thickness:	st.thickness,
				threshold:	st.threshold

			}).scale ({ x: st.anis.x, y: st.anis.y, z: st.anis.z }).rotate ({ pitch: st.lay }).normalize ().pair ().outline ().scale ({ uniform: 200 * st.size }).finalize ().rotate ({ yaw: yaw })

			/*
			 *	after creating the model, it's always possible to check whether the
			 *	instance will be a copy of an identical instance of the same model:
			 *	this optimization allows omitting this entire file while submitting
			 *	the instance, and rests on the assumption that the server can never
			 *	PRUNE model files on its side (except in maintenance circumstances,
			 *	possibly); if the user's logged in and can materially post a model,
			 *	and we are initializing the stub instance (i.e. not updating it, in
			 *	fact), we will test whether the said identical model was cached, as
			 *	this client "saw" it somewhere, and if it were, set the "copy" flag
			 *	even though it's not being blatantly "picked up" or "duplicated"...
			 */

			if (init) {

			    let yours = nav.id ? nav.username () + slash + nav.array.modelName : (empty)

			    let found = nav.array.cached ({

					reset: st.copy = false,
					model: be.string (args && args.from).or (yours),
					crc32: nav.crc32 (nav.array.model.mould.objFile).toString (16)

				})

				if (found) {

					st.copy = true
					nav.array.instance = { modelFile: be.string (args && args.from).or (yours) }

				} // found in cache, therefore it's a copy

			} // model is being initialized - not just updated

			if (st.copy) {

				World.layers.model = [

					nav.array.instance = {

						copy:		true,
						modelFile:	nav.array.instance.modelFile,

						model:		nav.array.model,
						edge:		st.edge,
						size:		st.size,
						lay:		st.lay,
						anis:		{ x: st.anis.x, y: st.anis.y, z: st.anis.z },
						origin: 	{ x: 0, y: 0, z: 0 },
						orient: 	{ pitch: 0, yaw: yaw, roll: 0 },
						solid:		st.solid,
						flat:		st.flat,
						shiny:		st.shiny,
						owned:		st.owned,
						spacing:	st.spacing,
						thickness:	st.thickness,
						threshold:	st.threshold

					} // instance stub (empty modelFiles filled by submitModel)

				] // updated model layer

				if (World.interactables.heldModel)

					World.interactables.heldModel.subject = nav.array.instance

				return (ray.onaction ())

			} // model is a copy: either been picked or duplicated, or found in a cache

			World.layers.model = [

				nav.array.instance = {

					model:		nav.array.model,
					edge:		st.edge,
					size:		st.size,
					lay:		st.lay,
					anis:		{ x: st.anis.x, y: st.anis.y, z: st.anis.z },
					origin: 	{ x: 0, y: 0, z: 0 },
					orient: 	{ pitch: 0, yaw: yaw, roll: 0 },
					solid:		st.solid,
					flat:		st.flat,
					shiny:		st.shiny,
					owned:		st.owned,
					spacing:	st.spacing,
					thickness:	st.thickness,
					threshold:	st.threshold

				} // instance stub

			] // updated model layer

			if (World.interactables.heldModel)

				World.interactables.heldModel.subject = nav.array.instance

			ray.onaction ()

		}, // called below or on changes

		submitModel: function (args) {

		    let instance = be.object (args && args.instance).or (null)
		    let monadics = be.switch (args && args.monadic).or (false)
		    let creating = be.switch (args && args.created).or (false)
		    let dropping = be.switch (args && args.dropped).or (false)
		    let removing = be.switch (args && args.removal).or (false)

			if (instance === null || (instance.freeze))

				return	// nothing to submit, or in the process of...

			/*
			 *	we will proceed if: we're re-spawning an areal, which
			 *	is an "internal" call, not originating from the user;
			 *	or, we're in the entry areal, which always accepts an
			 *	experimental model; or, we are logged in and can post
			 *	a model, including in areals other than the entry one
			 */

		    let i = Math.round (instance.origin.x / 321868 + 4792)
		    let j = Math.round (instance.origin.z / 321868 + 4792)
		    let entry = i === 4792 && j === 4792
		    let ok = monadics || entry || nav.id

			if (ok === false) {

				cui.alert ({ set: cui.posit = 1, argument: t_array_sign_up })
				return

			}

			if (entry) {

				if (Math.abs (instance.origin.x) > 321868/2 - 40000) {

					cui.alert ({ set: cui.posit = 1, argument: t_no_mans_land })
					return

				} // out of entry areal, X boundary

				if (Math.abs (instance.origin.z) > 321868/2 - 40000) {

					cui.alert ({ set: cui.posit = 1, argument: t_no_mans_land })
					return

				} // out of entry areal, Z boundary

			    let arealCache = nav.array.cached ({ areal: '4792.4792' }) || { content: Array (), settled: 0 }
			    let itemWeight = be.vector (instance.model.mould.objFile.match (/\nf/g)).or (avoid).length
			    let clear_thru = be.switch (instance.owned).or (nav.st.mc.owned) ? 40000 : 50000

				instance.model.mould.flat === true || (itemWeight = itemWeight * (1.5))
				instance.model.mould.spacing   < 1 || (itemWeight = itemWeight * (2.5))
				instance.model.mould.threshold < 1 && (itemWeight = itemWeight * (1 + (1 - Math.max (0, instance.model.mould.threshold)) / 4))

				if (Math.ceil (itemWeight) + arealCache.settled > clear_thru) {

					cui.alert ({ set: cui.posit = 1, argument: t_no_more_room })
					return

				} // out of entry areal "clearance", just informative

			} // no check by the server, so we simulate its response here

			/*
			 *	now "plant" the instance, i.e. make it stop wobbling,
			 *	otherwise a visual cue that we're "holding" the thing
			 *	above the ground level or a close-enough "floor", and
			 *	freeze what we are "holding" in its present state, if
			 *	we're here to drop it, not spawn it; just remember to
			 *	un-freeze the instance if something goes wrong, so we
			 *	can still try to plant it elsewhere
			 */

			if (dropping) {

				instance.orient.pitch	= 0
				instance.orient.roll	= 0
				instance.freeze 	= true

				tio.onpickrun ({ label: t_configure })

			} // remember to un-freeze on troubles

			/*
			 *	fill information about the instance's owner and crc32
			 */

			instance.owned = be.switch (instance.owned).or (nav.st.mc.owned)
			instance.owner = be.string (instance.owner).or (nav.id ? nav.username () : instance.owned ? t_owner_you : t_maker_you)
			instance.crc32 = be.string (instance.crc32).or (nav.crc32 (instance.model.mould.objFile).toString (16))

			/*
			 *	if the instance is already associated to a modelFile,
			 *	inherit the modelFile name to label this instance, or
			 *	else create the instance's modelFile out of what'd we
			 *	presume to be the name associated to the model we are
			 *	holding, and which, in turn, may come from three name
			 *	sources:
			 *
			 *	      - a model we created with the "basics factory",
			 *	      - a model we imported and configured, or
			 *	      - a model we picked up or copied;
			 *
			 *	leaving that case where it already had a modelFile as
			 *	that where the instance is the product of spawning an
			 *	areal, and its contents, into "visible existence", in
			 *	which we'll isolate the modelName to create the label
			 */

			instance.modelFile && (instance.modelName = instance.modelFile.split (slash).pop ())
			instance.modelFile || (instance.modelFile = instance.owner + slash + (instance.modelName = nav.array.modelName))

			/*
			 *	ok, post the request, or bypass it in "monadic form",
			 *	which applies to cases where we try and plant objects
			 *	within the entry areal (which is immutable but allows
			 *	experimenting without lasting consequences)
			 */

			new Requester ().post ({

				uri: '/exec/submitModel',

				pairs: [

					{ name: 'username', value: nav.username () },
					{ name: 'identity', value: nav.identity () },

					{ name: 'instance', value: JSON.stringify ({

						edge:		instance.edge,
						size:		instance.size,
						lay:		instance.lay,
						anis:		instance.anis,
						origin: 	instance.origin,
						orient: 	instance.orient,
						solid:		instance.solid,
						flat:		instance.flat,
						shiny:		instance.shiny,
						owned:		instance.owned,
						spacing:	instance.spacing,
						thickness:	instance.thickness,
						threshold:	instance.threshold

					}) },

					{ name: 'model_id', value: instance.modelFile + tilde + instance.crc32 },
					{ name: 'filedata', value: instance.copy ? '' : instance.model.mould.objFile }

				],

				onload: function (r) {

					/*
					 *	when it's been this person to drop the instance, we
					 *	call the "remove" option of the TIO menu to discard
					 *	the copy we were "holding", and remove the previous
					 *	tip to access the menu (we'll have a new one later)
					 */

					if (dropping) {

						tio.onpickrun ({ label: t_remove })

						if (nav.array.toMenu) {

							nav.array.toMenu.box && nav.array.toMenu.box.removeChild (nav.array.toMenu)
							nav.array.toMenu = null

						}

						if (World.interactables.heldModel) {

							World.interactables.heldModel.element.remove ()
							delete (World.interactables.heldModel)

						}

					}

					/*
					 *	if we get here because we're in the entry areal, we
					 *	can't rely on the events' loop to update its cache,
					 *	and need to do it ourselves; then, we tell the next
					 *	condition to go on and materialize the experimental
					 *	instance, which can be also planted by visitors who
					 *	didn't even sign up...
					 */

					if (entry) {

					    let arealCache = nav.array.cached ({ areal: '4792.4792' }) || { content: Array (), settled: 0 }
					    let itemWeight = be.vector (instance.model.mould.objFile.match (/\nf/g)).or (avoid).length

						instance.model.mould.flat === true || (itemWeight = itemWeight * (1.5))
						instance.model.mould.spacing   < 1 || (itemWeight = itemWeight * (2.5))
						instance.model.mould.threshold < 1 && (itemWeight = itemWeight * (1 + (1 - Math.max (0, instance.model.mould.threshold)) / 4))

						arealCache.browsed = Date.now ()
						arealCache.content.push ({ instance: instance, crc32: 'ephem.' })
						arealCache.settled = arealCache.settled + (instance.weight = Math.ceil (itemWeight))

						monadics = true

					} // no true request, because it's at areal 4792.4792

					/*
					 *	when we get here because we're re-spawning an areal
					 *	with a monadic call, we proceed to what follows and
					 *	actually materialize the instance; otherwise, we'll
					 *	stop here, knowing the event loop in cui.js will do
					 *	the job by calling back submitModel in monadic form
					 */

					if (monadics === false)

						return	// true request, will emit an event

					/*
					 *	here we visualize it where it officially lays
					 *	in the server's "reality": crucially, this is
					 *	re-used to re-spawn areals after browsing for
					 *	them, so what happens when we come back to an
					 *	areal matches 100% what happens when we build
					 *	an areal in the first place; so first of all,
					 *	see if we're dropping it on the ground plane,
					 *	or if there's a model underneath, which would
					 *	become this model's "parent"...
					 */

				    let origin = instance.origin; origin.y = Math.max (0, origin.y)
				    let params = Object ({ within: rc, feet: origin, eyes: 99 + origin.y })

					/*
					 *	if removing as of instance.remove, skip tests
					 *	on the kids layer, so no grandchildren may be
					 *	supporting its grandparent (first-grade kinds
					 *	of circular relationship are prevented by the
					 *	remove method's deletion of childs of removed
					 *	parents, but that's incomplete, when it comes
					 *	to higher-order relationships)
					 */

				    let ground = removing

						? World.ground (params, params.layer = 'root')
						: World.ground (params, params.layer = 'kids') || World.ground (params, params.layer = 'root')

					/*
					 *	if this instance isn't being placed here by a
					 *	user, and instead respawned to reconstruct an
					 *	areal, and we found "ground" for child-parent
					 *	relationship, BUT that relationship implies a
					 *	change in the ordinate (y) of the child, then
					 *	we ignore the relationship: it wouldn't match
					 *	how the instances appear, and was matched out
					 *	of random chance (e.g. there's a ground below
					 *	an instance that had been left "hanging", but
					 *	the supporting surface is no longer there and
					 *	something else lays below, close enough: it's
					 *	important that instance data reflect what was
					 *	stored server-side, or we wouldn't be able to
					 *	remove the child instance, while its ordinate
					 *	isn't what the server knows to be)
					 */

					if (creating)

						if (ground)

							ground.level.toFixed (3) === origin.y.toFixed (3) || (ground = null)

					if (ground) {

						if (Math.abs (ground.level - origin.y) > 600) {

							var self = {

								mould:	instance.model.mould,
								ntry:	World.layers.root.push (instance) - 1

							}

						} // new model not close enough to "stick"

						else {

							origin.y = ground.level

							var self = {

								mould:		instance.model.mould,
								ntry:		World.layers.kids.push (instance) - 1,
								relations:	ground.object.model.addChild (instance, ground.object)

							}

							/*
							 *	whenever a child spawns on
							 *	level floors, its index is
							 *	known to itself, but won't
							 *	be a concern that Spectrum
							 *	knows about, so we need to
							 *	patch Spectrum's record of
							 *	the last added child so it
							 *	stores its "kid" index: we
							 *	would need it for removing
							 *	the parent's children, all
							 *	together, when such parent
							 *	is removed from below them
							 */

							self.mouldRecord = self.relations [0]
							self.mouldRecord.ntry = self.ntry

						} // new model anchored to a "floor" below

					} // there's a level floor to hop on

					else {

						var self = {

							mould:	instance.model.mould,
							ntry:	World.layers.root.push (instance) - 1

						}

					} // otherwise, link to world's root

					/*
					 *	create a "remove" method for this instance,
					 *	bound to a reference to "itself", which may
					 *	be just an index in the world's base layer,
					 *	or a list of child records (one if child of
					 *	a simple model, eight if it's a MultiModel)
					 *
					 *	      - after clearing up the instance, its
					 *		own children disappear with it, and
					 *		need to be re-spawned into scene by
					 *		also checking if they're close to a
					 *		level floor of anything around them
					 *		and which is not themselves or some
					 *		other child of the removed instance
					 *
					 *	      - the above operation is performed by
					 *		calling back nav.submitModel in its
					 *		monadic mode (bypass the request to
					 *		the server, because it's no request
					 *		from an actual user)
					 */

					instance.remove = function () {

						if (this.relations) {

							for (let childEntry of this.relations)

								childEntry.removeFromParent ()

							delete (World.layers.kids [this.ntry])

						} // this instance's a child of something else

						else	delete (World.layers.root [this.ntry])

						/*
						 *	above we've taken care of the instance
						 *	that's been removed, and its relations
						 *	with its parent (by unlinking from all
						 *	of the parent's lists): below, removed
						 *	instance's children are addressed and,
						 *	first of all, unlinked from the "kids"
						 *	layer, as none of them may sustain any
						 *	others while they're re-spawned at the
						 *	same exact origin coordinates (or we'd
						 *	risk "endless" circular relationships)
						 */

						this.mould.children.forEach (kid => delete (World.layers.kids [kid.ntry]))
						this.mould.children.forEach (kid => nav.submitModel ({ instance: kid.self, monadic: true, removal: true, created: true }))

					}.bind (instance.self = self)

					/*
					 *	when we're re-spawning stuff
					 *	that was on top of something
					 *	else as of the above method,
					 *	we must NOT create the label
					 *	for this instance because it
					 *	already has one
					 */

					if (removing)

						return

					/*
					 *	create the instance's label,
					 *	by which it may be "handled"
					 */

					instance.card = ++ nav.array.modelCard

					World.interactables [instance.card] = {

						caliber: 1,			// determines how far away it can be seen: it's preferable to keep it low to reduce "overcrowding"
						persist: true,			// determines whether it persists thru recreations of <World.interactables> to clear other labels
						subject: instance,		// determines which instance's screen coordinates the label is tied to

						element:			// a instance of a Box (a special div, which constructor and methods are defined in array.js)

							instance.label = new Box (

								be.string ({

									it: {

										tree		: 'albero',
										post		: 'paletto',
										tile		: 'piastra',
										path_1x1	: 'vialino',
										path_2x2	: 'vialino_2x2',
										wall_x6 	: 'muro_x6',
										wall_x3 	: 'muro_x3',
										wall_x2 	: 'muro_x2',
										wall_x1 	: 'muro_x1',
										dice		: 'dado',
										seam		: 'colonnino',
										decoseam	: 'deco-colonnino',
										icoseam 	: 'ico-colonnino',
										coin		: 'moneta',
										ring		: 'anello',
										pole		: 'palo',
										cone		: 'cono',
										ball		: 'palla',
										spire		: 'guglia',
										dish		: 'piatto',
										glass		: 'bicchiere',
										fork		: 'forchetta',
										knife		: 'coltello',
										spoon		: 'cucchiaio',
										mug		: 'boccale',
										cup		: 'tazza',
										teapot		: 'teiera',
										moka		: 'moka',
										bottle		: 'bottiglia'

									},

									en: { /* no translation */ }

								} [lang] [instance.modelName]).or (instance.modelName)

							). // constructs the label's Box and gives it a displayed name

							setExtra   (instance).	// links the instance to its label Box
							premiering (555).	// timer for first show (milliseconds)

							appendNote (instance.owned ? t_owner + colon + blank + instance.owner : t_maker + colon + blank + instance.owner).
							present_if (function () { return (nav.array.el || nav.array.lc === instance.card) }).
							setHandler (function () {

							  const runner = function () {

									/*
									 *	restore "recognition" mode
									 *	and the regular Array menu
									 */

									tio.setCursorState ({ state: nav.array.el ? 'show' : 'hide' })
									tio.load (empty, null, tio.mb = nav.mb = nav.cb = nav.ab).kbFunctions.ro_home (nav.xm = false, nav.array.mo = 3)

									/*
									 *	process your bound request
									 */

									if (this.remove) {

										new Requester ().post ({

											uri: '/exec/removeModel',

											pairs: [

												{ name: 'instance', value: JSON.stringify (

													this.instance.normalForm = {

														modelFile:	this.instance.modelFile,
														owner:		this.instance.owner,

														edge:			    this.instance.edge,
														size:		parseFloat (this.instance.size.toFixed		(3)),
														lay:		parseFloat (this.instance.lay.toFixed		(3)),

														anis: {

															x:	parseFloat (this.instance.anis.x.toFixed	(3)),
															y:	parseFloat (this.instance.anis.y.toFixed	(3)),
															z:	parseFloat (this.instance.anis.z.toFixed	(3))

														},

														origin: {

															x:	parseFloat (this.instance.origin.x.toFixed	(3)),
															y:	parseFloat (this.instance.origin.y.toFixed	(3)),
															z:	parseFloat (this.instance.origin.z.toFixed	(3))

														},

														orient: {

															pitch:	parseFloat (this.instance.orient.pitch.toFixed	(3)),
															yaw:	parseFloat (this.instance.orient.yaw.toFixed	(3)),
															roll:	parseFloat (this.instance.orient.roll.toFixed	(3))

														},

														solid:			    this.instance.solid,
														flat:			    this.instance.flat,
														shiny:			    this.instance.shiny,
														owned:			    this.instance.owned,

														spacing:	parseFloat (this.instance.spacing.toFixed	(3)),
														thickness:	parseFloat (this.instance.thickness.toFixed	(3)),
														threshold:	parseFloat (this.instance.threshold.toFixed	(3)),

														// weight's always integer

														weight: 		    this.instance.weight

													} // convert all floats to 3-digit-precision IEEE754 (to an exact server-side match)

												) }, // the "normal form" is a way to ensure cross-platform match (on floating-point values)

												{ name: 'username', value: nav.username () },
												{ name: 'identity', value: nav.identity () }

											],

											onload: function () {

												/*
												 *	removal or duplications from the entry areal don't imply this instance
												 *	will be a copy of something the server "knows" and for which we'd skip
												 *	uploading a model's geometry (the <filedata> field): it may be, it may
												 *	not, but we just can't know, as we don't track where the source of the
												 *	instance in the entry areal was taken from; if it's been created there
												 *	or imported there, then planted in the entry areal, with no such thing
												 *	existing before or under that provider's name, the server won't have a
												 *	geometry on file for that model; if it was copied from a non-ephemeral
												 *	areal before being planted in an ephemeral one, then it will be filed,
												 *	but since we don't track that possibility here, we just pass reference
												 *	modelFile to updateModel, which will check, on initialization, whether
												 *	it's a copy of something the browser's "seen" and cached, or otherwise
												 */

												nav.updateModel ({

													text:		this.instance.model.mould.objFile,
													edge:		this.instance.edge,
													size:		this.instance.size,
													lay:		this.instance.lay,
													anix:		this.instance.anis.x,
													aniy:		this.instance.anis.y,
													aniz:		this.instance.anis.z,
													yaw:		this.instance.orient.yaw,
													solid:		this.instance.solid,
													flat:		this.instance.flat,
													shiny:		this.instance.shiny,
													owned:		this.instance.owned,
													spacing:	this.instance.spacing,
													thickness:	this.instance.thickness,
													threshold:	this.instance.threshold,

													init:		true,
													from:		this.instance.modelFile,
													where:		nav.array.modelName = this.instance.modelFile.split (slash).pop ()

												})

												/*
												 *	removal will, in areals that aren't the entry one (this.entry = true),
												 *	induce a message from the server to the CUI front-end script (cui.js),
												 *	which will react by updating the cache of the instance's areal to then
												 *	visually remove the matching instance; HOWEVER, the response can incur
												 *	significant delay, which makes the removal look a bit disorienting, as
												 *	it can leave behind, for a second or more, the "ghost" instance of the
												 *	object the user wanted to remove; BUT, reacting to the removal message
												 *	after its target instance's gone from the scene is completely harmless
												 *	as it just won't match anything in the areal's cache or in the world's
												 *	layers ("root" and "kids"), so if we process the removal here, aside a
												 *	bit of code duplication to maintain, the user can get instant feedback
												 *	of the removal, without ghosting, so here follows code that duplicates
												 *	that in cui.js framestepper, in the event handler, where responding to
												 *	a removal message...
												 */

											    let shortForm = this.instance.normalForm
											    let arealcode = (shortForm.origin.x / 321868 + 4792).toFixed (0) + point + (shortForm.origin.z / 321868 + 4792).toFixed (0)
											    let arealCache = nav.array.cached ({ areal: arealcode }) || ({ content: new Array, settled: this.instance.weight })

												arealCache.browsed = Date.now ()
												arealCache.settled = arealCache.settled - this.instance.weight
												arealCache.content = arealCache.content.filter (obj => { return (!nav.array.match (obj.instance, shortForm)) })

												nav.array.remove ({ instance: shortForm })

												/*
												 *	whether you pick up or make a copy of an instance from the scene, that
												 *	ought to induce the client UI to switch into model configuration mode,
												 *	recalling the TIO menu options handler to process an option that reads
												 *	however you'd say "configure"; the "force" flag, for the case, ensures
												 *	the handler would retain configuration mode if it's already on, rather
												 *	than "toggling" it on or off, and set the "enable" preference for when
												 *	t_exit or a re-entry into The Array is "supposed" to restore that mode
												 */

												tio.onpickrun ({ label: t_configure, force: nav.st.mc.active = true })

											}.bind (this),		// request success

											onwhoa: function (r) {

												cui.alert ({ set: cui.posit = 1, argument: nav.de_hint (r.response) })

											},			// request failure

											monadic: this.entry	// request by-pass, if true

										})

										return

									} // called to pick up an instance and therefore also removing that

									if (this.instance) {

										nav.updateModel ({

											text:		this.instance.model.mould.objFile,
											edge:		this.instance.edge,
											size:		this.instance.size,
											lay:		this.instance.lay,
											anix:		this.instance.anis.x,
											aniy:		this.instance.anis.y,
											aniz:		this.instance.anis.z,
											yaw:		this.instance.orient.yaw,
											solid:		this.instance.solid,
											flat:		this.instance.flat,
											shiny:		this.instance.shiny,
											owned:		this.instance.owned,
											spacing:	this.instance.spacing,
											thickness:	this.instance.thickness,
											threshold:	this.instance.threshold,

											init:		true,
											from:		this.instance.modelFile,
											where:		nav.array.modelName = this.instance.modelFile.split (slash).pop ()

										})

										tio.onpickrun ({ label: t_configure, force: nav.st.mc.active = true })

									} // called to duplicate a model's instance (a subset of the above)

								} // process pick / make copy / cancel

								nav.x0 = runner.bind ({ instance: this.extra, remove: true, entry: entry })	// pick
								nav.x1 = runner.bind ({ instance: this.extra }) 				// make copy
								nav.x2 = runner.bind ({ instance: null })					// cancel
								nav.xm = true									// dunno, I called it "examine menu"...

								tio.setCursorState ({ state: 'hide' }).load (empty, null, tio.mb = nav.mb = nav.cb = nav.xb).kbFunctions.ro_home (nav.array.mo = 0)

							}) // instance label handler

					} // interactable record (create a new label)

					/*
					 *	if we recognize this instance as "ours", i.e. we've
					 *	just dropped it, set last "runner" to be invoked if
					 *	the user presses Tab to that of the label Box above
					 *
					 *	      - usually we get here when the call is in the
					 *		monadic form, used to respawn areals and to
					 *		visualize the event where an instance comes
					 *		into being (aside from who created it), but
					 *		in case of areal 4792.4792 we get here also
					 *		to drop an instance that isn't truly stored
					 *		by the server and isn't reported to the CUI
					 *		framestepper's event polling loop; thereby,
					 *		we'll identify the instance as "ours" right
					 *		away by following the first condition below
					 */

				    let ours = false

					if (dropping)

						ours = true	// we dropped this, at 4792.4792

					if (nav.id && nav.username () === instance.claim || null)

						ours = true	// we dropped this anywhere else

					if (ours) {

						clearTimeout (nav.array.f2)
						nav.array.lc = instance.card
						nav.array.f2 = setTimeout (function () { nav.array.lc = 0 }, 14E3)

						if (nav.nt) {

							nav.array.runner = instance.label
							nav.array.toMenu = instance.label.appendNote (t_tab_to_menu, { handled: true })

						} // means we're not on touch devices (we have Tab)

					} // above tests established the instance was dropped by us

				}, // onload (/exec/submitModel)

				onwhoa: function (r) {

					cui.alert ({ consider: instance.freeze = false, set: cui.posit = 1, argument: nav.de_hint (r.response) })

				}, // onwhoa (/exec/submitModel)

				monadic: monadics || entry

			}) // request: /exec/submitModel

		}, // called by "create" or by the AMC's "ok" option

		loadModel: function (e) {

			event.preventDefault ()

			if (this.files [0].size > 262144)

				return (nav.to (null, 'ow/model/file/too/large'))

		    let r = new FileReader ()

			r.onload = function (e) {

			    let n = be.string (this.mf && this.mf.name).or (empty).split (point)
			    let x = n.length === 1 || n.pop ().toLowerCase ()

				nav.array.modelName = n.join ('\.').toLowerCase ().replace (/[^\-\w]/g, minus).substr (0, 40)
				nav.array.modelType = be.string (x).or ('obj')

				nav.updateModel ({

					text:		e.target.result,
					edge:		String ('#8F0'),
					size:		1,
					lay:		0,
					anix:		1,
					aniy:		1,
					aniz:		1,
					solid:		true,
					flat:		false,
					shiny:		false,
					owned:		false,
					spacing:	0.92,
					thickness:	.008,
					threshold:	0.50,
					init:		true

				})

				if (nav.array.instance.model.mould.circumRadius > 10000) {

					setTimeout (function () { tio.onpickrun ({ label: t_remove }) }, 125)
					setTimeout (function () { nav.to (null, 'ow/model/too/large', { interstitial: true }) }, 250)

				} // this pairs up with server-side no-mans-land test (4x 10000)

				tio.onpickrun ({ label: t_configure, force: true, dance: true })

			}.bind ({ mf: this.files [0] })

			r.readAsText (this.files [0])

		}, // array model file loader

		loadPhoto: function (e) {

			nav.loadSomething.call (this, {

				event: e,
				limit: 8388608,
				e_big: String ('ow/photo/too/large'),
				mLoad: t_loadingPhoto,
				u_r_i: String ('/exec/writePhoto'),
				tName: String ('target_n'),
				t_val: nav.thisUser (),
				whoa2: String ('sys/photo/load/error'),

				load2: function (r) {

					sessionStorage [r.response.replace (/\/[dhs]\-/, '/g-')] =
					sessionStorage [r.response.replace (/\/[dhs]\-/, '/h-')] =
					sessionStorage [r.response.replace (/\/[dhs]\-/, '/r-')] =
					sessionStorage [r.response.replace (/\/[dhs]\-/, '/s-')] =

						'?utime=' + Date.now ()

					nav.to (null, null, { interstitial: true })

				}

			})

		}, // author profile photo loader

		postImage: function (e) {

		    let target_g = be.vector (location.hash.substr (2).match (RegExp ('^' + rc (nav.username ()) + '\\/(\\w+)'))).or ([ empty ])

			nav.loadSomething.call (this, {

				event: e,
				limit: 8388608,
				e_big: String ('ow/image/too/large'),
				mLoad: t_loadingImage,
				u_r_i: String ('/exec/postImage'),
				tName: String ('target_g'),
				t_val: tb (rc (target_g.pop ())),
				whoa2: String ('sys/image/load/error'),

				load2: function (r) {

					sessionStorage [r.response.replace (/\/[dhs]\-/, '/g-')] =
					sessionStorage [r.response.replace (/\/[dhs]\-/, '/h-')] =
					sessionStorage [r.response.replace (/\/[dhs]\-/, '/r-')] =
					sessionStorage [r.response.replace (/\/[dhs]\-/, '/s-')] =

						'?utime=' + Date.now ()

					nav.to (false, r.response.substr ('image/'.length).replace (/\/[dhs]\-/, slash) + '~post', { easyRetype: true })

				}

			})

		}, // picture post image loader

		loadPackg: function (e) {

			nav.loadSomething.call (this, {

				event: e,
				limit: 250000000,
				e_big: String ('ow/package/too/large'),
				mLoad: t_loadingPack,
				u_r_i: String ('/exec/writePack'),
				tName: String ('target_p'),
				t_val: nav.thisPage (),
				whoa2: String ('sys/package/upload/error'),

				load2: function (r) {

				    let n = be.string (this.file && this.file.name).or (empty).split (point)

					if (n.length > 1)

						n.pop ()		// removes extension, if present

					nav.to (null, location.hash.substr (2).split (tilde).shift () + '~edit', {

						instant: true,		// don't animate this transition
						interstitial: true,	// do not record node in history

						filename: n.join (point).toUpperCase ().replace (/[^\x20\-\.\w]/g, score).substr (0, 20)

					})

				}.bind ({ file: this.files [0] })

			})

		}, // package loader

		slideShow: function (e) {

		    let count = this.files.length
		    let files = this.files
		    let names = new Array

			for (let file of files)

				names.push (file.name.toUpperCase ())
				names.sort (function (a, b) { return (a > b ? +1 : -1) })

		    let event = e
		    let limit = 8388608
		    let e_big = String ('ow/image/too/large')
		    let mLoad = t_loadingSlides
		    let u_r_i = String ('/exec/createSlide')
		    let t_pag = names.shift ().replace (/\.(JPG|JPEG)$/, empty)
		    let t_grp = nav.grab (t_collection)
		    let o_vis = nav.pick (t_visibility)
		    let o_dis = nav.pick (t_discussion)
		    let load2 = nav.to.bind ({ destination: rc (tf (nav.username ()) + slash + tf (t_grp) + slash + tf (t_pag)) + '~full' })
		    let whoa2 = String ('sys/slideshow/upload/error')

			event.preventDefault ()

			for (let image of files) {

				if (image.size > limit)

					return (nav.to (null, e_big))

			} // early rejection test on all file sizes

		  const load1 = function (image) {

			    let r = new FileReader ()

				r.onload = function (e) {

					tio.type ({

						text: nline + block + this.image.name + nline + block,

						cps: 30,
						lim: 0,

						oncompletion: function () {

							new Requester ({ notes: { meter: 0, files: this.that.files } }).post ({

								uri: u_r_i,

								pairs: [

									{ name: 'target_g', value: t_grp },
									{ name: 'target_p', value: this.image.name.toUpperCase ().replace (/\.(JPG|JPEG)$/, empty) },
									{ name: 'top_page', value: t_pag },
									{ name: 'manifest', value: o_vis },
									{ name: 'comments', value: o_dis },
									{ name: 'username', value: nav.username () },
									{ name: 'identity', value: nav.identity () },
									{ name: 'data_url', value: this.event.target.result }

								],

								onprog: function (e) {

								    let dots = ~~ (56 * e.loaded / e.total)

									tio.putKey.call ({

										key: Array (1 + dots - this.notes.meter).join ('.'),

										typed: true,
										hence: this.notes.meter = dots

									})

								},

								onload: function (r) {

									tio.type ({

										text: Array (57 - r.notes.meter).join ('.'), cps: 30, lim: 0,
										oncompletion: function () { -- count >= 0 ? load1 (r.notes.files [count]) : load2 (r) }

									})

								},

								onwhoa: function (r) {

									tio.type ({

										text: Array (57 - r.notes.meter).join ('X'), cps: 30, lim: 0,
										oncompletion: function () { nav.to (null, 'sys/server/message', { path: whoa2, response: this.response }) }.bind (r)

									})

								}

							})

						}.bind ({ that: this.that, image: this.image, event: e })

					}) // display name

				}.bind ({ that: this.that, image: image }) // r.onload

				r.readAsDataURL (image)

			}.bind ({ that: this }) // load1 (stage)

			tio.ot = avoid	// clear TIO overlays on next live menu bar update
			nav.pu = empty	// prevent scstHistory record

			nav.array.hide ()
			tio.onpgfocus (e)
			tio.disconnectKeyboard ()
			tio.cls (null, nav.cb).cls (cui.mbUpdate ({ live: true, menu: nav.db }), nav.cb).scrollTo (0, true)

			tio.type ({

				text: [,mLoad,t_stay_on_tab,,].join (nline + block),

				cps: 60,
				lim: 0,

				oncompletion: function () { load1 (files [-- count]) }

			}) // TIO setup

		}, // slide show loader

		/*
		 *	navigation dynamics:
		 *	all of what follows is somehow entangled with the workings of "nav.to"
		 */

		prepr: function (text, pairs) {

			pairs = pairs || new Object ()

			for (let k of [ 'header', 'roster', 'eula', 'pwhint', 'minder', 'howto', 'ade' ])

				pairs [k] = be.object ($(k)).or ({ innerText: `UNKNOWN: ${k}` }).innerText.replace (/^\s+|\s+$/g, empty)

			for (let k in pairs)

				text = text.replace (RegExp ('\\`' + k + '\\`', 'g'), pairs [k])

			text = text.replace (/(N\x20\`\`\x20.*\+)\[([HFPIARECJMNU])\](\++)/g, function (m, s, t, r) {

			    let count = be.number ({

					H: nav.cs.announcements,
					F: nav.cs.reps,
					P: nav.cs.pages,
					I: nav.cs.images,
					A: nav.cs.authors,
					R: nav.cs.products,
					E: nav.cs.longtalks,
					C: nav.cs.chiacchere,
					J: nav.cs.jabberwocks,
					M: nav.cs.mascellodons,
					N: nav.cs.notifications,
					U: nav.cs.annunciamocene

				} [t]).or (0).toString ()

				if (count === '0')

					return (s + '+++' + r)

				return (s + '(' + (count) + ')' + r.substr (count.length - 1))

			})

			text = text.replace (/\`\w+?\`/g, empty)
			text = text.replace (/\{\{([^]*?)\}\}/g, function (m, s) { return nav.nt ? s : empty })

			if (pairs.interstitial)

				return (text)

			if (nav.fp) {

			    let t = nav.is ? text.replace (/\n\{GATE\}\n+/, '\n\n\n') : text
			    let r = t.split (nline)
			    let i = highlights_start - (nav.is ? 7 : 0)
			    let j = highlights_end - (nav.is ? 7 : 0)
			    let m = highlights_m - (nav.is ? 7 : 0)

				switch (nav.cs.highlights) {

					case false:

						for (let n = i; n <= j; ++ n)

							r [n] = n === m ? t_loading : empty

						break

					default:

					    let news = lang === 'it' ? nav.cs.annunciamocene : nav.cs.announcements
					    let reel = nav.cs.highlights.slice (0)

						if (reel.length == 0) {

							for (let n = i; n <= j; ++ n)

								r [n] = n === m ? t_nothing : empty

							break

						}

						reel.length < 3 && (reel.unshift (empty))
						reel.length < 3 && (reel.unshift (empty))

						for (let n = i; n <= j; ++ n) {

							r [n] = reel.shift () || empty
							r [n] ? news && nav.createMarker ({

								k: n.toString (),
								row: n,
								noIcon: true,

								onclick: function () {

									nav.cs.clear_news && new Requester ().post ({

										uri: '/exec/promsList',

										pairs: [

											{ name: 'username', value: nav.username () },
											{ name: 'identity', value: nav.identity () },
											{ name: 'idx_last', value: 0 }

										],

										onload: function () {

											nav.clearMarkers ()
											nav.cs.clear_news = false

										}

									})

								},

								where: news = news - 1

							}) : null

						}

				}

				text = r.join (nline)

			}

			return (text)

		}, // preprocess resident page text, substituting all keywords

		rcrop: function (p) {

		  const L_field = String ('`-~L')
		  const F_block = String.fromCharCode (0x2588)

		    let line = nav.fp ? empty : nline

			return (p.replace (/\r\n/g, '\n').
				  replace (/^\n+/g, line).
				  replace (/\s+$/, empty).
				  replace (/\+/gi, blank).
				  replace (/\uFFFD/g, F_block).
				  replace (/\n\[start text area\]/, '\n' + t_text).
				  replace (/\n\[close text area\]/, '\n' + L_field + ' -------------------------------------------- ````` >8').
				  replace (/\n\[start test area\]/, '\n' + t_test).
				  replace (/\n\[close test area\]/, '\n' + block + '----------------------------------------- }}} ' + t_to_go).
				  replace (/\~(\W)/g, '\t' + '$1'))

		}, // crop resident page text, getting rid of cosmetic mark-up

		/*
		 *	per-page TIO screen navigation state
		 */

		nterstitial: {

			'sys/apply/headings':		true,
			'sys/change/my/password':	true,
			'sys/de_le_te/my/account_':	true,
			'sys/de_le_te/user/account_':	true,
			'sys/drop/home/cover/picture':	true,
			'sys/drop/page/cover/picture':	true,
			'sys/drop/profile/picture':	true,
			'sys/drop/this/page':		true,
			'sys/drop/package/attachment':	true,
			'sys/flip/page/cover/picture':	true,
			'sys/flip/profile/picture':	true,
			'sys/not/found_404_':		true,
			'sys/publish':			true,
			'sys/r/make':			true,
			'sys/r/quicktrip':		true,
			'sys/restore/page':		true,
			'sys/revert/to/default':	true,
			'sys/save/changes':		true,
			'sys/save/info/page':		true,
			'sys/save/profile':		true,
			'sys/select/home/areal':	true,
			'sys/sign/out': 		true,
			'sys/sign/up/or/log/in':	true,
			'sys/typing/something': 	true

		}, // intrinsic interstitial load - does not record in history API

		pathRewrite: {

			'sys/welcome/back':		'home',
			'sys/welcome/page':		'home'

		}, // intrinsic path translation to something else (home = "void")

		popKeyboard: {

			'sys/change/password':		true,
			'sys/note/basics':		true,
			'sys/join/now': 		true,
			'sys/nope_/personal/reasons':	true,
			'sys/ops/account/deletion':	true,
			'sys/ops/console':		true,
			'sys/pick/home/areal':		true,
			'sys/r/make':			true,
			'sys/r/quicktrip':		true,
			'sys/username/available':	true,
			'sys/write/new/page':		true,
			'sys/create/a/slideshow':	true

		}, // pages that need text input, and hence, start with the OSK on

		noAutofocus: {

			'sys/r/make':			true

		}, // pages that may need text input, but do NOT start with OSK on

		rsnSynonyms: {

			'sys/il/mascellodonte' : 'sys/the/jabberwock'

		}, // resident system node synonyms (resolving to same paragraphs)

		scstStartUp: {

			'sys/apply/headings':		'0/99/99',
			'sys/change/password':		'0/99/5',
			'sys/change/my/password':	'0/99/99',
			'sys/de_le_te/my/account_':	'0/99/99',
			'sys/de_le_te/user/account_':	'0/99/99',
			'sys/drop/home/cover/picture':	'0/99/99',
			'sys/drop/page/cover/picture':	'0/99/99',
			'sys/drop/profile/picture':	'0/99/99',
			'sys/drop/this/page':		'0/99/99',
			'sys/drop/package/attachment':	'0/99/99',
			'sys/join/now': 		'0/99/6',
			'sys/flip/page/cover/picture':	'0/99/99',
			'sys/flip/profile/picture':	'0/99/99',
			'sys/nope_/personal/reasons':	'0/99/14',
			'sys/ops/account/deletion':	'0/99/6',
			'sys/ops/console':		'0/99/99',
			'sys/pick/home/areal':		'0/19/5',
			'sys/publish':			'0/99/99',
			'sys/r/quicktrip':		'0/19/5',
			'sys/restore/page':		'0/99/99',
			'sys/save/changes':		'0/99/99',
			'sys/save/info/page':		'0/99/99',
			'sys/save/profile':		'0/99/99',
			'sys/sign/out': 		'0/99/99',
			'sys/sign/up/or/log/in':	'0/99/99',
			'sys/typing/something': 	'0/99/99',
			'sys/username/available':	'0/0/4',
			'sys/write/new/page':		'0/99/5',
			'sys/create/a/slideshow':	'0/99/5'

		}, // intrinsic vertical scroll offset and cursor position on load

		startsFresh: {

			'sys/change/password':		true,
			'sys/join/now': 		true,
			'sys/feedback/hub':		true,
			'sys/ops/reports/registry':	true,
			'sys/pick/home/areal':		true,
			'sys/username/available':	true

		}, // vertical scroll offset and cursor position must be forgotten

		scstHistory: {

			/*
			 *	recorded by nav.to
			 */

		}, // vertical scroll offset and cursor position history goes here

		/*
		 *	enter TIO interface:
		 *	popKeyboard will show the OSK on load,
		 *	noAutofocus will show the OSK on writable input focus (not automatically)
		 *	writeAccess will allow moving the cursor all over the page (console only)
		 */

		to_TIO: function (args) {

		    let popKeyboard = be.switch (args && args.popKeyboard).or (false)
		    let noAutofocus = be.switch (args && args.noAutofocus).or (false)
		    let writeAccess = be.switch (args && args.writeAccess).or (false)

			switch (nav.ok = popKeyboard ? nav.nt === false : false) {

				case false:

					clearInterval (nav.ac)			// stop repeating
					clearInterval (nav.ks)			// stop typematic
					nav.cf = { '0': 0 } [nav.ck = '0']	// reset Fn state

					// hide keyboard

					ctc.style.display = String ('none')
					ctc.style.height  = scn.style.height = pag.style.height = nav.ph
					osk.style.height  = osk.style.opacity = ctl.style.height = ctl.style.opacity = lfn.style.height = lfn.style.opacity = rfn.style.height = rfn.style.opacity = String ('0')

					// set on-writable-input focus to intercept the act of focusing the text clip and call (once) nav.ontcfocus

					tio.onwifocus = function () {

					    let ocs = be.object (tio.onchanges ({ queryState:true })).or (clear)
					    let ert = ocs.easyRetype || false

						if (tio.l1 <= tio.cp.j && tio.cp.j <= tio.l2) {

							nav.ontcfocus.call ()
							nav.ontcfocus = cui.shush

						} // in turn, nav.ontcfocus will pop the help balloon suggesting how to paste links

						tio.setCursorState ({ state: 'show' })	// turn on text cursor if it was not
						ert && tio.kbFunctions.ro_home.call ()	// home text cursor if this field may be filled with a hint

					}

					// tell the TIO your vertical paddings are zero (no edges),
					// react to onpgfocus by just possibly hiding the link pad,
					// simulating a click event on the pad mask

					tio.vp = function () { return (0) }
					tio.onpgfocus = function (e) { e && cui.shush (pad_mask.onclick (e)) }

					break

				case true:

					nav.st.ks = (NLAND && innerWidth > innerHeight) ? nav.st.ks : 1

					// react to onpgfocus hiding the link pad AND the keyboard:
					// focusing the page means it's no longer focusing writable
					// inputs, and ultimately, that your user wants to interact
					// with... the page

					tio.onpgfocus = function (e) {

						clearInterval (nav.ac)			// stop repeating
						clearInterval (nav.ks)			// stop typematic
						nav.cf = { '0': 0 } [nav.ck = '0']	// reset Fn

						ctc.style.display = String ('none')
						ctc.style.height  = scn.style.height = pag.style.height = nav.ph
						osk.style.height  = osk.style.opacity = ctl.style.height = ctl.style.opacity = lfn.style.height = lfn.style.opacity = rfn.style.height = rfn.style.opacity = String ('0')

						nav.ok = false				// turn OSK state to off
						tio.vp = function () { return (0) }	// vertical paddings to zero

						e && cui.shush (pad_mask.onclick (e))	// put help balloon and page link away

					}

					// set onwifocus to turn the keyboard on: that is ALSO what
					// we have to do right now, so let's have a timeout to call
					// the same function "essentially immediately", though with
					// a little delay to allow the DOM layout to settle...

					tio.onwifocus = function () {

					    let ocs = be.object (tio.onchanges ({ queryState: true })).or (clear)
					    let ert = ocs.easyRetype || false

						nav.fitKeyboard (nav.ok = true) 	// turn keyboard state on and fit it to present window dimensions
						tio.setCursorState ({ state: 'show' })	// turn on text cursor if it was not
						ert && tio.kbFunctions.ro_home.call ()	// home text cursor if this field may be filled with a hint

						// assert we want the typing keyboard - not the AMC

						nav.st.mc.active = false

						// start listening to typematic repeats at 60 / sec

						nav.ks = setInterval (function () { nav.ac && nav.ac.handler && nav.ac.handler.call () }, 50 / 3)

						// show keyboard, make its event catcher "tangible"

						osk.style.opacity = String ('1')
						ctl.style.opacity = String ('0')
						lfn.style.opacity = String ('0')
						rfn.style.opacity = String ('0')
						ctc.style.display = String ('block')

						if (tio.l1 <= tio.cp.j && tio.cp.j <= tio.l2) {

							nav.ontcfocus.call ()
							nav.ontcfocus = cui.shush

						} // if the cursor's inside the text clip, eventually show the balloon help on pasting links

						// let the DOM settle for a while, andset TIO vertical paddings to account for the keyboard,
						// then wait for a little longer and make sure we bring the cursor into view, wherever it is

						setTimeout (tio.vp = function () { return (parseInt (getComputedStyle (osk).height.split ('px').shift ())) }, 50)
						setTimeout (tio.scrollToCursor, 66)

					}

					// if we're not to show the keyboard immediately, writeback
					// the nav.ok flag to reflect the fact that the keyboard is
					// not in show (especially needed for side handles to work)
					// but almost immediately show the touch keyboard otherwise

					noAutofocus && (nav.ok = false)
					noAutofocus && (setTimeout (tio.onpgfocus, 33))
					noAutofocus || (setTimeout (tio.onwifocus, 33))

			} // see if we have to pop the keyboard, or at least prepare to do so

			tio.show (writeAccess)

		}, // TIO set up on page loads

		/*
		 *	slideshow (not nazi) mode
		 */

		ss: function (pictureUrl) {

		    let pic = nav.pp || nav.np ? slideFrame : photoFrame

		    let off = function (e) {

				switch ((e.button) || 0) {

					case 0: // primary button (left)

					    let p = location.hash.substr (2).split (tilde).shift ()
					    let f = location.hash.substr (2).split (tilde).pop ()
					    let s = f === 'fune' || f === 'lone' ? '~lone' : empty

						e.cancelBubble = true
						e.preventDefault && e.preventDefault ()

						nav.tm > 2 || nav.to (null, p + s, { instant: true, interstitial: true })

				}

			} // turns off the slideshow (unless travel maximum is high enough to suggest the click wasn't intentional

			nav.SS = false		// not in slideshow mode, thus far
			nav.mm = false		// not following pointer movements
			nav.sr = null		// no slide request matched so far
			nav.tm = 0		// reset travel maximum
			nav.tr = 0		// reset travel record

			/*
			 *	the above was also valid for overall housekeeping,
			 *	now enter slideshow mode if given a URL to work on
			 */

			if (pictureUrl) {

				nav.SS = true

				// disable the TIO - fullscreen pics don't need Text Input/Output:
				// this would hide the TIO display (and release keyboard bindings)

				tio.disable ()

				// now that we're sure the TIO isn't in control of the PC keyboard
				// anymore, we can install slideshow-mode keyboard shortcuts: they
				// are only three, and quite straightforward, as you can see...

				Shortcut.add ('escape', 	off)		// like click
				Shortcut.add ('arrowleft',	back.onclick)	// back arrow
				Shortcut.add ('arrowright',	forw.onclick)	// forw arrow

				// set background image of picture frame to what's in show, center
				// the view (to discard possible residual translations from former
				// runs), display the frame and picture, set mouse cursor shape to
				// suggest whether it's possible to slide to adjacent pictures, or
				// just close the full-screen view of an isolated picture (when no
				// previous or next page links are active)

				pic.style.backgroundImage = 'url(/' + pictureUrl + ')'
				pic.style.backgroundPositionX = empty
				pic.style.display = String ('block')
				pic.style.cursor = nav.pc = nav.pp || nav.np ? 'ew-resize' : 'zoom-out'

				// set initial timeout to hide the PC mouse cursor after 2 seconds

				nav.t0 = setTimeout (function () { photoFrame.style.cursor = slideFrame.style.cursor = String ('none') }, 2000)

				// set handler for "click" event to equal that of the "escape" key

				pic.onclick = off

				// at beginning of drag, set tracking flag and take x as reference

				pic.onpointerdown = function (e) {

					e.cancelBubble = true
					e.preventDefault && e.preventDefault ()

					nav.mm = true
					nav.rx = e.clientX || 0

				}

				// while dragging, make the picture follow the pointer as expected

				pic.onpointermove = function (e) {

					e.cancelBubble = true
					e.preventDefault && e.preventDefault ()

					if (nav.mm) {

					    let px = be.number (e.clientX || 0).or (0)
					    let rx = be.number (nav.rx).or (px)

						nav.tr = Math.max (Math.abs (px - rx), nav.tr)			// record travel distance maximum

						px > rx && nav.pp === false && (px = rx)			// slide right if there's a previous picture to back to
						px < rx && nav.np === false && (px = rx)			// slide left, if there's a picture next to this to see

						px - rx >= innerWidth / 14 && (nav.sr = back.onclick)		// if right enough, set slide request to "back"
						rx - px >= innerWidth / 14 && (nav.sr = forw.onclick)		// if left enough, set slide request to "forw"

						this.style.backgroundPositionX = String ('calc(50%' + blank + '-' + blank + (rx - px).toString () + 'px)')

					} // updates background position according to movement, interpreting this kind of gesture

					this.style.cursor = nav.pc

					// after re-setting PC mouse cursor to its intended shape,
					// set or re-set a timeout to hide that cursor completely,
					// freeing the view: currently, it disappears in 2 seconds

					clearTimeout (nav.t0)
					nav.t0 = setTimeout (function () { photoFrame.style.cursor = slideFrame.style.cursor = String ('none') }, 2000)

				}

				// when done dragging, clear the tracking flag (nav.mm), store the
				// maximum travel distance to nav.tm so that default "click" event
				// will not close the slideshow (it may fire ~0.3 seconds later if
				// the browser won't prevent it as per our request, otherwise we'd
				// provoke it at the end), then reset the travel record to prepare
				// for the next move, and, of course, service the request...

				pic.onpointerup = function (e) {

					e.cancelBubble = true
					e.preventDefault && e.preventDefault ()

					nav.mm = false
					nav.tm = nav.tr
					nav.tr = 0

					nav.sr && (nav.sr.call (this, e))
					nav.sr || (this.style.backgroundPositionX = empty)
					nav.sr || (nav.tr > 2) || (this.onclick && this.onclick.call (this, e))

				}

				return

			}

			/*
			 *	if the function has no URL to work with, it means it's been called
			 *	to clear slideshow mode, usually because the page loaded in a mode
			 *	other than ~full or ~fune, or because the server's response cannot
			 *	be viewed in fullscreen mode (e.g. because it's a 404 error): just
			 *	clear all of the above event handlers after forcing photo or slide
			 *	frame to its hidden state...
			 */

			pic.style.display = String ('none')
			pic.style.backgroundImage = String ('none')

			pic.onclick = null
			pic.onpointerdown = null
			pic.onpointermove = null
			pic.onpointerup = null

			Shortcut.remove ('escape')
			Shortcut.remove ('arrowleft')
			Shortcut.remove ('arrowright')

		},

		/*
		 *	accessory post-page-load chores:
		 *	called by the typing animation "oncompletion" handlers of "nav.to", and any
		 *	time "nav.to" finishes loading a page, either from resident infrastructural
		 *	paragraphs or in consequence of dynamic requests; "nav.extras" may run many
		 *	housekeeping tasks that will be relevant at those times, although it is NOT
		 *	the sole component of the navigation U.I. that runs after pages are loaded:
		 *	in fact, this runs between the loading process and the "tail" function from
		 *	within "nav.to", "tail" being the true final step in all page loads ("tail"
		 *	taking care of lower-level tasks)
		 */

		extras: function (args) {

		    let resource = be.string (args && args.resource).or (empty) 	// resource that was just loaded (by path, either the visible or internal path)
		    let response = be.string (args && args.response).or (empty) 	// response to request (if that was a resident paragraph, 'resident')
		    let position = be.vector (args && args.position).or (avoid) 	// position at which the cursor is meant to be placed
		    let isThread = be.switch (args && args.isThread).or (false) 	// inducing scroll to last field (in reconstructed thread views)
		    let jwCursor = be.string (args && args.jwCursor).or (empty) 	// inducing paged chats to load content from given index
		    let jabIndex = be.string (args && args.jabIndex).or (empty) 	// normally paired with the above (and shall be sent along)

			tio.ovs.innerHTML = be.vector (tio.ot).or (avoid).join (empty)	// this happens in any case: updates the TIO overlays layer (pictures and more)

			/*
			 *	on pages holding notes, but in "observe" mode,
			 *	help balloons will tell how to reach the parent discussion...
			 */

			if (nav.ns && nav.pt)

				nav.is || setTimeout (function () { cui.say (cui.ball.reach, nav.hp + '~note') }, 500)

			/*
			 *	if we're looking at reconstructed threads of notes out of "observe"
			 *	links, upon completion of the animated load, send the cursor to the
			 *	last field (which is where the "reply" link is) and keep it visible
			 *	to facilitate answering to the notified post, other than causing it
			 *	to scroll to the bottom of the page, where the observed note ALWAYS
			 *	appears (because the server makes it so, that's why)
			 */

			isThread && tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.it.length - 3 * tio.nc)).nextField ()

			/*
			 *	auto-hide the TIO text cursor when it's left at its "home" position
			 *	half a second past the end of page loading sequence; in particular,
			 *	it's a "keep hidden" out of the page state reset in nav.to, and the
			 *	reason why it's done is... well, it blinks, and that's distracting,
			 *	unless you're navigating via keyboard or filling text fields...
			 */

			isThread || (nav.t0 = setTimeout (function () {

				tio.cp.i - home.colIndex && tio.setCursorState ({ state: 'show' })
				tio.cp.j - home.rowIndex && tio.setCursorState ({ state: 'show' })

				if (tio.cm)

					tio.setCursorState ({ state: 'show' })

				if (nav.is)

					tio.setCursorState ({ state: 'hide' })

				if (nav.al)

					tio.setCursorState ({ state: 'show' })

			}, 500))

			switch (resource) {

				case 'sys/welcome/back':

					// perform "mail check", which also checks counters for new
					// pages, images, authors, products and talks, when viewing
					// the front page and being considered logged in

					nav.id && (nav.t3 = setTimeout (function () {

						new Requester ().post ({

							uri: '/exec/mailCheck',

							pairs: [

								{ name: 'username', value: nav.username () },
								{ name: 'identity', value: nav.identity () }

							],

							onload: function (r) {

								try { r = JSON.parse (r.response) } catch (e) { return }

								nav.cs.announcements = be.number (r.announcements).or (0)
								nav.cs.reps = be.number (r.reps).or (0)
								nav.cs.pages = be.number (r.pages).or (0)
								nav.cs.images = be.number (r.images).or (0)
								nav.cs.authors = be.number (r.authors).or (0)
								nav.cs.products = be.number (r.products).or (0)
								nav.cs.longtalks = be.number (r.longtalks).or (0)
								nav.cs.chiacchere = be.number (r.chiacchere).or (0)
								nav.cs.jabberwocks = be.number (r.jabberwocks).or (0)
								nav.cs.mascellodons = be.number (r.mascellodons).or (0)
								nav.cs.notifications = be.number (r.notifications).or (0)
								nav.cs.annunciamocene = be.number (r.annunciamocene).or (0)

								nav.cs.clear_news = be.number (lang === 'it' ? nav.cs.annunciamocene : nav.cs.announcements).or (0) ? true : false
								nav.cs.highlights = be.vector (r.highlights).or (new Array)

								nav.hb = be.string (r.home_areal_code).or (null)

								/*
								 *	if there's reported content,
								 *	warn operators, via balloon help
								 */

								nav.cs.reps && cui.say (cui.ball.flags.replace ('%F', nav.cs.reps.toString ()), 'sys/ops/reports/registry')

								/*
								 *	this request may complete asynchronously, after
								 *	the welcome page was abandoned already, so we'd
								 *	better check that what's on the screen reflects
								 *	the welcome page, before "updating" it with our
								 *	new informations, starting from the template of
								 *	the welcome page: if we're on the welcome page,
								 *	the address on top will show a void "hash"
								 */

								nav.fp && tio.update ({ content: nav.cb + nav.rcrop (nav.prepr (sys_welcome_back.innerText)), keepActiveRow: true })

							}

						})

					}, 500))

				case 'sys/welcome/page':

					// retrieve the sole list of "highlights" if viewing
					// the front page and being NOT considered logged in

					nav.id || (nav.t3 = setTimeout (function () {

						new Requester ().post ({

							uri: '/exec/highlights',

							onload: function (r) {

								try { r = JSON.parse (r.response) } catch (e) { return }

								nav.cs.announcements = 0
								nav.cs.reps = 0
								nav.cs.pages = 0
								nav.cs.images = 0
								nav.cs.authors = 0
								nav.cs.products = 0
								nav.cs.longtalks = 0
								nav.cs.chiacchere = 0
								nav.cs.jabberwocks = 0
								nav.cs.mascellodons = 0
								nav.cs.notifications = 0
								nav.cs.annunciamocene = 0

								nav.cs.clear_news = false
								nav.cs.highlights = be.vector (r.highlights).or (new Array)

								/*
								 *	this request may complete asynchronously, after
								 *	the welcome page was abandoned already, so we'd
								 *	better check that what's on the screen reflects
								 *	the welcome page, before "updating" it with our
								 *	new informations, starting from the template of
								 *	the welcome page: if we're on the welcome page,
								 *	the address on top will show a void "hash"
								 */

								nav.fp && tio.update ({ content: nav.cb + nav.rcrop (nav.prepr (sys_welcome_page.innerText)), keepActiveRow: true })

							}

						})

					}, 500))

					// homes cursor position in search prompt (navigating back)

					if (tio.cp.j === parseInt (find_rowIndex))

						tio.kbFunctions.ro_home.call ()

					return

				case 'sys/username/available':

					// enable passport beat after .5 seconds from confirmations
					// that a username is available on registration: "passport"
					// is the way the front-end calls the short "bio" asked for
					// the initial profile of an author, and it's basically our
					// CAPTCHA, the way we try and tell bots from humans...

					setTimeout (function () { be.object (nav.bb).or (new Object).going = true }, 500)

					return

				case 'sys/note/basics':

					// if a user was presented with a text clip to write notes,
					// send the cursor to the next field - which is presumed to
					// be the text clip - after .25 seconds, UNLESS this person
					// was fast enough to *already* focus the text clip (all it
					// takes, after all, is hitting Tab); additionally, we will
					// move the cursor to the end of the pre-written text (or a
					// pending note waiting to be posted) because that's likely
					// more comfortable...

					nav.t1 = setTimeout (function () {

					    let focused = (tio.l1 <= tio.cp.j && tio.cp.j <= tio.l2) || (tio.pt > 0)

						focused || tio.nextField ()
					     // focused || tio.kbFunctions.ro_ctrlEnd ()

					}, 250)

					return

				case 'sys/ops/reports/registry':

					// this would be wrong as the "cursor" value, and it's been
					// seen hanging up XHR requests to any URLs until a pending
					// requesto to /ltn completed; the exact cause for that, is
					// honestly a mystery, but it's still a wrong value, and is
					// sent here because of the mess in nav.to calling twice to
					// nav.extras for this case (additionally, I'm not sure why
					// I had to do that, probably just to display that resident
					// "AUTHENTICATING..." paragraph while it loads /repreg
					//
					//    - note to future self: put this thing a little tidier
					//	and, about that "mystery", the /ltn cursor value is
					//	base-36 encoded so 'resident' is a valid value, and
					//	that request setting the cursor to 'resident', once
					//	received on the other end as a huge value, may trip
					//	up subsequent requests from the same IP, but that's
					//	just a theory, a... chaos theory, I'd guess.

					if (response === 'resident')

						break

					// the reports registry comes with a "wide-band" channel to
					// follow what other operators do across the entire system,
					// so they can "sync" their job as a team: the "rr" channel
					// is even left publicly accessible, in theory, though this
					// UI doesn't provide other means to follow it, so it stays
					// sort-of "cosmetically off-limits" to regular, non-sys-op
					// viewers: since events out of "rr" were ALSO broadcast to
					// the respective public pages, that's certainly no problem
					// in terms of security...

					nav.ep.setup ({

						channel: String ('rr'), 	// yep, always "rr"
						lastRow: response,		// was .cursor

						handler: function (response) {

							switch (response.mean) {

								case 'more':

									nav.to (null, null)
									return

							} // react to server messages reporting an untracked surplus (reload page)

							for (let row of response.rows) {

								try { row = JSON.parse (row) }

									catch (e) { continue } // corrupt or somehow missing line

								switch (row.event) {

									case 'condemn': // note or reply was condemned (by writer)

										nav.condemned (row.entry)
										break

									case 'drop':	// note or reply was expunged

										nav.expunged (row.entry)
										break

									case 'legit':	// note or reply was legitimized: from the
											// point of view of an operator working on
											// this registry, this basically means the
											// note is no longer the op's business, so
											// the UI reacts exactly as if the note in
											// question was "expunged" (deleted)...

										nav.expunged (row.entry)

								} // processing events: rr broadcasts only condemn, drop and legit

							}

						} // rr channel handler

					}) // rr channel set-up

					return

				case 'sys/feedback/hub':

					tio.hPatterns = cui.hPatterns.notes

					nav.id || tio.positionCursor.call ({ hold: true }, tio.cp = tio.findCp (tio.ci = tio.it.length)).type ({

						cps: 30, lim: 0,
						text: dline + block + t_not_logged_in,
						oncompletion: function () { tio.positionCursor.call ({ hold: true }, tio.cp = tio.findCp (tio.ci = tio.it.length)) }

					})

					nav.id && new Requester ({ needs_to: clearTimeout (nav.t0) }).post ({

						uri: '/exec/ltn',

						pairs: [

							{ name: 'identIfic', value: be.string (localStorage.identity).or ('anonymous') },
							{ name: 'listen_to', value: nav.username () },
							{ name: 'news_feed', value: String ('true') },
							{ name: 'instaLoad', value: String ('true') },
							{ name: 'start_row', value: String ('????') },
							{ name: 'rewind_by', value: (22).toString (36) }

						],

						onload: function (r) {

						    let my_username = nav.username ()
						    let notes = new Array
						    let list = empty
						    let ex = { }

							try {

								r.response = JSON.parse (r.response)
								r.response.rows.reverse ()

								nav.ex = ex
								nav.nf = true
								nav.rb = parseInt (r.response.last, 36) - r.response.rows.length

							}

							catch (e) {

								return

							} // discard malformed response and break

							for (let row of r.response.rows) {

								try { row = JSON.parse (row) }

									catch (e) { continue } // missing (ahead of records) or corrupt line

								switch (row.event) {

									case 'condemn':

										(ex [row.entry] = ex [row.entry] || { condemned: true }).condemned = true
										break

									case 'drop':

										(ex [row.entry] = ex [row.entry] || { isDropped: true }).isDropped = true
										break

									case 'legit':

										(ex [row.entry] = ex [row.entry] || { isFlagged: null }).isFlagged = null
										break

									case 'report':

										(ex [row.entry] = ex [row.entry] || { isFlagged: true }).isFlagged = ex [row.entry].isFlagged
										break

									case 'reply':

										row.entry.feedReply = true

									case 'note':

										row.entry.isDropped = false

										if (ex [row.entry.id]) {

											row.entry.condemned = ex [row.entry.id].condemned || false
											row.entry.isDropped = ex [row.entry.id].isDropped || false
											row.entry.isFlagged = ex [row.entry.id].isFlagged || false

										}

										row.entry.path = be.string (row.about).or (empty)
										notes.push (row.entry)

								}

							}

							for (let note of notes)

								if (note.isDropped == false || note.auth == my_username)

									note.auth in nav.ii || (list = list + rendering ({

										note:	note,
										hence:	nav.nd [note.id] = note

									}) + nline)

							if (nav.rb > 0)

								list = list + 'N' + field + blank + t_older_news

							if (list.length === 0)

								list = list + block + t_no_news

							tio.positionCursor.call ({ hold: true }, tio.cp = tio.findCp (tio.ci = tio.it.length)).type ({

								text: dline + list,

								oncompletion: function () {

									nav.ep.setup ({

										channel: nav.username (),
										persist: String ('true'),
										lastRow: r.response.last,
										timeout: 6667,

										handler: function (response) {

											for (let row of response.rows) {

												try { row = JSON.parse (row) }

													catch (e) { continue } // corrupt or somehow missing line

												switch (row.event) {

													case 'condemn': // note or reply was condemned by writer

														nav.condemned (row.entry)
														break

													case 'report':	// note or reply was reported as illicit

														nav.reported (row.entry)
														break

													case 'legit':	// note or reply was reverted to "legit"

														nav.legitimized (row.entry)
														break

													case 'drop':	// note or reply was expunged

														nav.expunged (row.entry)
														break

													case 'reply':	// new reply

														row.entry.feedReply = true

													case 'note':	// new main note

														row.entry.path = be.string (row.about).or (empty)
														row.entry.auth in nav.ii || nav.nd [row.entry.id] || nav.receive (row.entry)

												} // processing events

											} // parsing events

										} // news channel handler

									}) // news channel set up

									nav.t0 = setTimeout (function () {

										tio.cp.i - home.colIndex && tio.setCursorState ({ state: 'show' })
										tio.cp.j - home.rowIndex && tio.setCursorState ({ state: 'show' })

									}, 500)

									tio.positionCursor.call ({ hold: true }, tio.cp = tio.findCp (tio.ci = tio.findVCi (home.colIndex, home.rowIndex)))

								},

								wps: 30,
								lim: 30

							}) // news list append

							new Requester ().post ({

								uri: '/exec/mailReset',

								pairs: [

									{ name: 'username', value: nav.username () },
									{ name: 'identity', value: nav.identity () }

								]

							}) // remove mail flag

						} // request completion

					}) // news feed request

					return

				case 'sys/the/jabberwock':
				case 'sys/il/mascellodonte':

					if (jwCursor && jabIndex) {

						new Requester ().post ({

							uri: slash + resource + '~note',

							pairs: [

								{ name: 'username', value: nav.username () },
								{ name: 'identity', value: nav.identity () },
								{ name: 'cursor',   value: jwCursor },
								{ name: 'index',    value: jabIndex }

							],

							onload: function (r) {

								try {

								    let response = nav.ar = JSON.parse (r.response)
								    let notes = empty, timed = true, note_count = 0
								    let count = 1

								    let quote = be.vector (location.href.match (/~qote\[\d+\;(\w+)]$/)).or ([ empty ]).pop ()
								    let qLine = 3

									for (note in (response.notes || clear))

										note_count = note_count + 1

									for (note in (response.notes || clear)) {

										note = response.notes [note]

										if (note.auth in nav.ii) {

											notes = notes || nline
											continue

										}

										note.compact = true
										note.header = timed
										note.nextToLast = count === note_count - 1

										nav.nd [note.id] = note
										notes = notes + rendering ({ note: note })

										count = count + 1
										timed = count === note_count
										qLine = quote === note.id ? notes.split (nline).length : qLine

									}

									nav.createMarker ({ k: '@', row: qLine, noIcon: true })
									tio.update (tio.it.substr (0, tio.mb.length) + nline + notes + tio.it.substr (tio.mb.length + 1))
									tio.positionCursor.call ({ hold: true }, tio.cp = tio.findCp (tio.ci = tio.findVCi (home.colIndex, home.rowIndex)))

								}

								catch (e) {

									tio.update (tio.it.substr (0, tio.mb.length) + nline + block + t_malf_response + tio.it.substr (tio.mb.length + 1))

								}

							},

							onwhoa: function (r) {

								tio.update (tio.it.substr (0, tio.mb.length) + nline + block + (r && r.status || t_no_response).toString () + tio.it.substr (tio.mb.length + 1))

							}

						}) // chat listing request (frozen)

						break

					}

					tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findVCi (0, tio.findCp (1E9).j - 2)))
					tio.setCursorState ({ state: 'show' })

					new Requester ().post ({

						uri: slash + resource + '~note',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () }

						],

						onload: function (r) {

							try {

							    let response = nav.ar = JSON.parse (r.response)
							    let notes = empty, timed = true, note_count = 0
							    let count = 1

								for (note in (response.notes || clear))

									note_count = note_count + 1

								for (note in (response.notes || clear)) {

									note = response.notes [note]

									if (note.auth in nav.ii) {

										notes = notes || nline
										continue

									}

									note.compact = true
									note.header = timed
									note.nextToLast = count === note_count - 1

									nav.nd [note.id] = note
									notes = notes + rendering ({ note: note })

									count = count + 1
									timed = count === note_count

								}

								nav.rflush (notes, { scroll: true })

								nav.ep.setup ({

									channel: nav.thisPage (),
									lastRow: response.cursor,
									timeout: 6667,

									handler: function (response) {

										for (let row of response.rows) {

											try { row = JSON.parse (row) }

												catch (e) { continue } // corrupt or somehow missing line

											switch (row.event) {

												case 'note':

													row.entry.compact = true
													row.entry.auth in nav.ii || nav.nd [row.entry.id] || nav.append (row.entry)

											} // processing events

										} // parsing events

									} // news channel handler

								}) // news channel set up

								nav.pi = parseInt (response.index)

							}

							catch (e) {

								nav.rflush (block + reframing (t_status_200but, tio.nc - 4, equal, aster) + nline)
								nav.rflush (block + reframing (t_malf_response, tio.nc - 4, minus, aster) + nline)

							}

						},

						onwhoa: function (r) {

						    let status = block + reframing ((r && r.status || t_no_response).toString (), tio.nc - 4, equal, aster)
						    let notice = block + reframing (be.string (r && r.text).or ('?').toString (), tio.nc - 4, minus, aster)

							nav.rflush (status + nline)
							nav.rflush (notice + nline)

						}

					}) // chat listing request (live)

					return

				case 'sys/account/settings':

					// on this page is the blocked usernames list for a regular
					// non-op user: people you don't want to hear from, that we
					// will filter out in every conceivable way (you won't read
					// their page titles in the new stuff list, their notes and
					// even their names in the users list)

					nav.sz = 999
					tio.ai = 2
					tio.bi = 0

					// on this page's also the "secret" sysop section, "special
					// operations", which appears only if a request to /io does
					// not silently fail (by a 200 OK response other than "op")
					// in which cases we need to append (way down the page) the
					// powerful special operations menu, WITHOUT VISIBLY MOVING
					// the TIO text cursor in the process (that explains what's
					// it doing with those cryptic "hold" calls)

					new Requester ().post ({

						uri: '/exec/io',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () }

						],

						onload: function (r) {

						    let pass = (be.string (r.response).or (0) === 'op')

							pass && tio.positionCursor.call ({ hold: true }, tio.cp = tio.findCp (tio.ci = tio.it.length)).type ({

								text: { en:

										'\n'
									      + '\n++=================++SPECIAL OPERATIONS++================='
									      + '\n'
									      + '\nN `` OPS/REPORTS REGISTRY\t\t'   + '* READER-REPORTED ILLICITS'
									      + '\nN `` OPS/ACCOUNT DELETION\t\t'   + '* CAREFUL WITH INSTA-KILLZ'
									      + '\nN `` OPS/CONSOLE\t\t\t'	    + '* SERVER COMMAND POWERLINE',

									it:

										'\n'
									      + '\n++================++OPERAZIONI RISERVATE++================'
									      + '\n'
									      + '\nN `` OPS/ILLECITI SEGNALATI\t\t' + '* DA VISITATORI REGISTRATI'
									      + '\nN `` OPS/RIMOZIONE ACCOUNTS\t\t' + "* OCCHIO, QUESTA E' LETALE"
									      + '\nN `` OPS/CONSOLE\t\t\t'	    + '* LINEA DIRETTA COL SERVER'

								} [lang].replace (/\+/g, blank),

								oncompletion: function () {

									tio.positionCursor.call ({ hold: true }, tio.cp = tio.findCp (tio.ci = tio.findVCi (parseInt (this.position [1]), parseInt (this.position [2]))))

								}.bind ({ position: position }),

								wps: 30,
								lim: 30,

								and: nav.io = true

							})

							pass || tio.positionCursor.call ({ hold: true }, tio.cp = tio.findCp (tio.ci = tio.it.length)).type ({

								text: { en:

										'\n'
									      + '\n++='
									      + '\n++8<---------------++USERNAMES TO BLOCK++-----------------'
									      + '\n' + nav.ig.replace (/_/g, blank)
									      + '\n++------------------------------------------------- ``` >8'
									      + '\n++='
									      + "\n++TYPE USERNAMES YOU DON'T WISH TO SEE OR HEAR FROM IN THE"
									      + "\n++ABOVE TEXT CLIP: YOU MAY LEAVE EACH NAME ON ITS LINE, OR"
									      + "\n++USE COMMA OR SEMICOLON TO SEPARATE THE USERNAMES;*DO NOT"
									      + "\n++USE BLANK SPACES*TO DO THAT: BLANK SPACES CAN BE PART OF"
									      + "\n++NAMES, ALBEIT THEY ARE STRIPPED FROM BOTH ENDS; WHEN YOU"
									      + "\n++LEAVE THIS PAGE, YOUR CHANGES TO THAT LIST WILL BE SAVED",

									it:

										'\n'
									      + '\n++='
									      + '\n++8<--------------++NOMI UTENTE BLOCCATI++----------------'
									      + '\n' + nav.ig.replace (/_/g, blank)
									      + '\n++------------------------------------------------- ``` >8'
									      + '\n++='
									      + "\n++SCRIVI LA TUA LISTA DI AUTORI/UTENTI DI CUI NON DESIDERI"
									      + "\n++VEDERE TRACCIA SU QUESTO SITO: PER SEPARARE I NOMI, PUOI"
									      + "\n++SCRIVERE UN NOME PER RIGA, OPPURE USARE UNA VIRGOLA O UN"
									      + "\n++PUNTO E VIRGOLA,*MA NON USARE SPAZI VUOTI*PER SEPARARLI:"
									      + "\n++SINGOLI SPAZI VUOTI POSSONO FAR PARTE DEI NOMI, ANCHE SE"
									      + "\n++DIVENTANO IRRILEVANTI PRIMA E DOPO LE PARTI VISIBILI DEI"
									      + "\n++NOMI; LA LISTA VERRA' SALVATA QUANDO LASCI QUESTA PAGINA"

								} [lang].replace (/\+/g, blank),

								oncompletion: function () {

									nav.to_TIO ({ popKeyboard: true, noAutofocus: true })
									tio.positionCursor.call ({ hold: true }, tio.cp = tio.findCp (tio.ci = tio.findVCi (0, ignorelist_start)))

								}.bind ({ position: position }),

								wps: 30,
								lim: 30,

								and: nav.io = false

							})

						}

					})

				case 'ow/invalid/characters':

					// we don't want this particular error page to get to focus
					// the "back" link, despite providing one, due to its quite
					// long error message: thus far, it's the only such case...

					return

				case 'sys/ops/console':

					response === 'resident' || tio.type ({

						text: block + 'MODE IS' + blank + (tio.nc.toString ()) + minus + 'COLUMN,' + blank + (nav.st.ps === nav.st.ms ? 'EXTENDED.' : 'BALANCED.') + nline + block + minus + dline,
						oncompletion: function () { tio.positionCursor (tio.cp = tio.findCp (tio.ci = 100E7)) }

					})

					return

				case 'sys/announcements':

					new Requester ().post ({

						uri: '/exec/io',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () }

						],

						onload: function (r) {

						    let pass = be.string (r.response).or (0) === 'op'
						    let rows = tio.it.split (nline)
						    let nRow = 3

							nav.clearMarkers ()

							rows.forEach (row => {

							    let flag = (row.startsWith ('L') ? pass || row.split (field).pop ().split ('/').shift () === (nav.id && nav.username ()) : false)

								flag && nav.createMarker ({

									k: nRow.toString (),
									row: nRow ++,
									noIcon: true,
									eraser: true,

									onclick: function () {

									    let rows = tio.it.split (nline)
									    let path = rows [this.placement].split (arrow).pop ().split ('\t').shift ().split ('{').shift ().trim ()
									    let cpos = cui.posit, q = function () { cui.posit = cpos; cui.mq = false }

										cui.posit = this.placement
										cui.mq = true

										cui.quest ({

											question: t_deannounce,

											exit: q,
											exec: function () {

												new Requester ().post ({

													uri: '/exec/deannounce',

													pairs: [

														{ name: 'username', value: nav.username () },
														{ name: 'identity', value: nav.identity () },
														{ name: 'target_p', value: path }

													],

													onload: nav.to.bind ({ runner: q, destination: 'sys/announcements' }),
													onwhoa: function (r) { cui.alert ({ exit: q, argument: nav.de_hint (r.response) }) }

												})

											}

										})

									}

								})

							})

						}

					})

					return

				case 'sys/pick/home/areal':
				case 'sys/r/quicktrip':

					switch (resource) {

						case 'sys/pick/home/areal':

							nav.hb && nav.drop ('AREACODE', nav.hb)
							break

						case 'sys/r/quicktrip':

							nav.st.lastAreal && nav.drop ('AREACODE', nav.st.lastAreal)
							break

					}

					clearTimeout (nav.t0)

					tio.t0 = setTimeout (function () {

						tio.kbFunctions.ro_shiftEnd.call ()
						tio.setCursorState ({ state: 'show' })

					}, 500)

					tio.onchanges = function () {

					    let processed = nav.grab ('AREACODE').replace (/[QWERTYUIOP]/gi, (m) => { return { Q:1, W:2, E:3, R:4, T:5, Y:6, U:7, I:8, O:9, P:0 } [m] })
					    let arealcode = nav.grab ('AREACODE')
					    let force_dot = null

						processed.indexOf (point) + 1 ? 0 : processed.length < 4 ? 0 : processed += (force_dot = point)
						processed.indexOf ('.\.') + 1 ? processed = processed.replace (/\.+/, force_dot = point) : null

						if (processed === arealcode || tio.lk.length === 0)

							return (false)

						nav.drop ('AREACODE', processed)

						if (force_dot)

							tio.kbFunctions.ro_end.call ()

						return (tio.txt.innerHTML)

					}

					return

				case 'sys/r/make':

					clearTimeout (nav.t0)

					tio.t0 = setTimeout (function () {

						tio.kbFunctions.ro_right ()
						tio.setCursorState ({ state: 'show' })

					}, 500)

					return

				case 'sys/server/message':

					// we'll handle generic "sys/server/message" templates as a
					// specific error message (those beginning with "ow"): such
					// messages are given a back link anyway, be them errors or
					// otherwise (they are generally errors, though, in form of
					// one-liners emitted by the server, while not matching any
					// specific resident paragraphs providing more information)

					resource = 'ow'

				default:

					// whenever an error message, or other server message, were
					// displayed, they end with a "back" link, as a comfortable
					// link to briefly "back off" from errors (which may induce
					// mild anxiety): in theory, it's always possible to cancel
					// the error message with the browser's back button or with
					// our own back navigation arrow, or with Alt-Left too, but
					// providing AND focusing with the text cursor an immediate
					// back link at the very bottom of the error message should
					// definitely qualify as more user-friendly...

					if (resource.startsWith ('sys/search/'))

						tio.nextField ()	/* focus scope toggle */

					if (resource.split (slash).shift () === 'ow')

						tio.nextField ()	/* focus "back" links */

					// when we're coming from a search results' page (marked by
					// the modality anchors "land" (search -> pages) and "qote"
					// (search -> notes), which the server considers equivalent
					// to "lone" and "note", respectively, AND this happened as
					// we still had a RegExp with the list of query terms (nav.
					// ls.x) to highlight, create markers placed on their rows:
					// this greatly helps finding content within the results...

					switch (nav.ls.x && location.href.split (tilde).pop ().split ('[').shift ()) {

						case 'land':
						case 'qote':

							for (let wordMatch of tio.it.matchAll (nav.ls.x))

								nav.createMarker ({ k: '@' + wordMatch.index, row: tio.it.substr (0, wordMatch.index).split (nline).length - 1, noIcon: true })

					} // highlight search result lines

			}

		}, // accessory post-page-load chores

		onchat: function () {

		    let text = be.vector (tio.it.split ('\n')).or (avoid)
		    let line = be.string (text [tio.cp.j - 1]).or (empty).trim ()

		    let resp = function (r) {

				tio.setCursorState ({ state: 'show' })

				r.response.length && tio.down ().type ({

				     // text: r.response.toUpperCase ().match (/.{1,60}/g).join (nline) + nline,
					text: r.response.toUpperCase () + nline,
					cps: 10, lim: 0,

					oncompletion: (tio.down)

				})

			} // query request completion handler

			if (line.length)

				new Requester ().post ({

					uri: '/exec/chat',

					pairs: [

						{ name: 'username', value: nav.username () },
						{ name: 'identity', value: nav.identity () },
						{ name: 'argument', value: line }

					],

					onload: resp,
					onwhoa: resp,

					so_far: tio.setCursorState ({ state: 'hide' })

				})

		},

		/*
		 *	run operator console command:
		 *	bound to the "oncommand" event of the TIO (when Enter is pressed)
		 */

		oncommand: function () {

		    let text = be.vector (tio.it.split ('\n')).or (avoid)
		    let line = be.string (text [tio.cp.j - 1]).or (empty).replace (/^\s+/, empty).split ('\t').shift ()

		    let resp = function (r) {

				if (r.status === 503) {

					tio.down ().type ({

						text: 'SERVICE UNAVAILABLE (SHUTDOWN OR PURGE IN PROGRESS)\n503 BUSY\n',

						wps: 30,
						lim: 30,

						oncompletion: (tio.down)

					}) // special formatting for the 503 error code, that righteously claims "503 BUSY" for prompt

					return

				} // busy status

				tio.down ().type ({

					text: r.response.replace (/\n$/, empty).toUpperCase () + nline + r.status + blank + 'READY\n',

					wps: 30,
					lim: 30,

					oncompletion: (tio.down)

				}) // format the response, append HTTP status code, claim "READY", then send the cursor to end of text

			} // command request completion handler

			if (line.length === 0) {

				resp ({ response: 'COMMAND EXPECTED', status: 400 })
				return

			} // eh yep...

			switch (line) {

				case 'EXIT':

					return (history.go (-1))

				case 'CLS':

					return (nav.to (null, 'sys/ops/console', { keepMode: true }))

				default:

					switch (line.split (blank).shift ()) {

						case 'MODE':

						    let nc = be.string (line.split (blank) [1]).or ('80')	// default mode is 80-column
						    let mx = be.string (line.split (blank) [2]).or (null)	// mode extension (tells the CUI resize handler to maximize width)
						    let xt = /X$/.test (nc) || (mx == 'X')			// extension may be triggered condensing "MODE 80 X" to "MODE 80X"
						    let nx = /B$/.test (nc) || (mx == 'B')			// extension may be withheld, specifying "MODE 80 B" or "MODE 80B"
						    let tx = nx ? null : xt || (nav.fullScreenEngaged ())	// extended mode consent flag

							nav.rh.call ({

								userChoice: (tx),
								set: nav.st.ps = nav.st.ks = (tx ? nav.st.ms : nav.st.ds),
								and: tio.nc = Math.round (Math.max (60, Math.min (be.number (parseFloat (nc.split (/(X|B)/).shift ())).or (80), 180)))

							}) // yeeeh, that's a bit cryptic but in short: it's equivalent to the CUI's Ctrl+keypad plus/minus, mutatis mutandi

							tio.home ().down ().type ({ text: 'MODE' + blank + tio.nc + minus + 'COLUMN,' + blank + (tx ? 'EXTENDED' : 'BALANCED') + nline, wps: 30, oncompletion: tio.down })
							return

					} // set "display mode", mimicking MS-DOS "MODE" command, which historically toggled between 40 and 80-column modes: we can reach 180 here

			} // processing resident commands

			switch (line.charAt (2)) {

				case blank:	// CC ARGS
				case empty:	// CC

					break

				default:

					if (line = line.match (/\"([A-Z]{2}\s[\w\s\-]*)\"/)) {

						line = line.pop ()
						break

					} // recognize shortcuts such as 'try "LG ANY" to...'

					resp ({ response: 'BAD COMMAND FORM', status: 400 })
					return

			}

			switch (line.substr (0, 2)) {

				case 'AR':	// display author registration trace
				case 'AS':	// display all current sys ops
				case 'AT':	// display all current trusted accounts
				case 'FP':	// display fingerprinting data
				case 'FF':	// flush VFS pipelines and optionally, clear the FSD cache in all workers	*
				case 'GG':	// gag author from posting notes for a given amount of hours
				case 'IP':	// display author IP address records
				case 'KK':	// kick author, i.e. disable log-in, for the given amount of hours
				case 'LG':	// display specified server log file
				case 'OS':	// un-dub a sysop								*
				case 'PG':	// purge all non-WORM VFS data banks						*
				case 'PH':	// patch note chains, in cases where chain loss occurred or in all cases	*
				case 'RT':	// rescind trust								*
				case 'RR':	// rebuild new pages and/or new authors lists, where loss occurred		*
				case 'RS':	// rebuild search indices							*
				case 'SD':	// shutdown									*
				case 'SO':	// dub a sysop									*
				case 'TC':	// traffic control volume monitor
				case 'TR':	// trust account								*
				case 'WB':	// compare fingerprints of given author to those of all others (who-may-be)
				case 'LD':	// compare levenshtein distance (between reconstructed passwords' patterns)
						// ---------------------------------------------------------------------------------------------
						// * = reserved to "master" sysop only (not to be evil, they're delicate maintenance operations)

					new Requester ().post ({

						uri: '/exec/' + line.substr (0, 2).toLowerCase (),

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () },
							{ name: 'argument', value: line.substr (3).toLowerCase () }

						],

						onload: resp,
						onwhoa: resp

					}) // post all known valid commands, avoiding "naked" 404 errors that'd look pretty weird in the console

					return

			} // intercepts known, and valid, commands, covering misfires by otherwise letting the following error message take over

			resp ({ response: 'COMMAND NOT FOUND', status: 404 })

		},

		/*
		 *	user input handling:
		 *	passport beat, twice per second, on <nav.t2>
		 */

		ppBeat: function () {

		    let me = this	// alias to refer to the bound object (externally, <nav.bb> is the bound object)
		    let n = '&nbsp;'	// space in progress bar
		    let p = '&#x2588;'	// notch in progress bar

			switch (this.iter) {

				case 4: // steady waiting state - animate the server's smiley, conveying either happiness or distrust

				     // cui.label ({ slot: 1, text: me.happy ? '^.^' : Math.random () > .4 ? '^.-' : '-.^', padd: 'h' })
					break

				case 1: // actual beat sends a handful of data (tip of an iceberg) to track cursor and page scrolling

					this.report.post ({

						uri: '/exec/captcha',

						pairs: Array (

							{ name: 'cpn', value: tio.cp.n.toString () },
							{ name: 'cpj', value: tio.cp.j.toString () },
							{ name: 'hlo', value: cui.sm.toString (10) }

						),

						onload: function (r) {

							me.happy = r.response == 'ok'

						}.bind (this)

					})

				case 0: //
				case 2: // active waiting states in response to recent user input - show a small sort-of progress bar
				case 3: //

				     // cui.label ({ slot: 1, text: [ '^.^', p+n+n, n+p+n, n+n+p ] [this.iter ++], padd: 'h' })

			} // switch through iterations...

			nav.t2 = setTimeout (nav.pb, 500)

		}, // passport beat

		/*
		 *	user input handling:
		 *	non-specific changes handler (bound to tio.onchanges)
		 */

		changes: function (text) {

		    let hold = null		// HTML contents of TIO display, returned when it needs to be "held", and not updated

			if (text.allClear)

				switch (this.target) {

					case 'note':

						/*
						 *	clear persistent record of tentative post,
						 *	clear persistent record address only when there was no pending reply left
						 */

						localStorage.removeItem ('note')
						be.string (localStorage.repl).or (empty).match (/\S/) || localStorage.removeItem ('addr')

					case 'page':

						this.easyRetype = false 		// may count as intentional text, even if void

					default:

						return (this)				// allow changing / inspecting stuff in bundle

				} // clear all mechanisms driving text clip input assistance, usually in consequence of "nav.allClear"

			if (text.clear)

				switch (this.target) {

					case 'note':

						/*
						 *	clear persistent record of tentative post,
						 *	clear persistent record address only when there was no pending main note left
						 */

						localStorage.removeItem ('repl')
						be.string (localStorage.note).or (empty).match (/\S/) || localStorage.removeItem ('addr')

					default:

						return (this)				// allow changing / inspecting stuff in bundle

				} // clear all mechanisms driving text clip input assistance, usually in consequence of "nav.allClear"

			if (text.queryState)

				return (this)						// allow changing / inspecting stuff in bundle

			switch (this.target) {

				case 'note':

					if (tio.l1 <= tio.cp.j && tio.cp.j <= tio.l2 + 1) {

						if (tio.l3 > tio.l4) {

							while (this.easyRetype) {

								if (this.postpend)

									break		// we have a pending note - don't clear

								if (be.number (this.oneClip).or (0))

									break		// we were typing a reply - don't clear

								switch (tio.lk.length === 0 || tio.lk.charCodeAt (0)) {

									case true:	// backspace, delete, or miss
									case 10:	// enter (line feed)
									case 32:	// space (blank)

										tio.lk = empty

								} // compensate for enter, space, backspace, "empty keystrokes"

								/*
								 *	place the "last keystroke" in the TIO clip, as the only
								 *	content, pick the returned HTML as highlighted (to save
								 *	time by having the TIO not re-highlight it), le the DOM
								 *	reflow settle for a while (33 ms might be enough), then
								 *	send the TIO text cursor to the end of the line so that
								 *	we won't be typing ahead of the first character
								 */

								hold = nav.allClear (tio.lk)
								setTimeout (tio.kbFunctions.ro_end, 33)

							} // we were waiting for the first keystroke inside the T.I.O text clip

							be.number (this.oneClip).or (0) || (localStorage.note = nav.clipText ())	// set persistent note record (main note case)
							be.number (this.oneClip).or (0) && (localStorage.repl = nav.clipText ())	// set persistent note record (reply case)

							localStorage.addr = this.returns_to						// set persistent note record (both cases)

						} // we are inside active TIO text clip, and there was no secondary clip (l3-l4)

						else {

							localStorage.repl = nav.stubText ()	// set persistent note record (reply case)
							localStorage.addr = this.returns_to	// set persistent note record (both cases)

						} // we are inside active TIO text clip, while there is a secondary clip (l3-l4)

						if (nav.jw) {

						    let rev_ai = tio.ai

							tio.ai = 2 + (nav.clipText ().startsWith ('/ME' + blank) ? Math.max (0, nav.username ().length - 2) : 0)
							tio.ai - rev_ai && setTimeout (tio.update, 33)

						}

						this.easyRetype = false

						ModalTimeout.set ({ id: 'nav.locateMarkers', handler: nav.locateMarkers, msecs: 500 })

					} // we are inside active TIO text clip (l1-l2)

					return (hold)					// returned to "tio.highlight"

				case 'page':

					if (tio.l1 <= tio.cp.j && tio.cp.j <= tio.l2 + 1)

						if (this.easyRetype) {

							switch (tio.lk.length === 0 || tio.lk.charCodeAt (0)) {

								case true:	// backspace, delete, or miss
								case 10:	// enter (line feed)
								case 32:	// space (blank)

									tio.lk = empty

							} // compensate for enter, space, backspace, "empty keystrokes"

							/*
							 *	changes to page behave similar, but not identically, to
							 *	those for notes: persistent records are filed under the
							 *	page's resource path, they cannot be "cleared" to reset
							 *	some kind of default text (even if it might be provided
							 *	the very first time) as they're always "pending" before
							 *	they're saved, and they always start with a blockquote,
							 *	because their base indent level is zero (so authors can
							 *	break the margins, when creative writing requires that)
							 */

							text = null
							hold = nav.allClear (block + tio.lk)
							setTimeout (tio.kbFunctions.ro_end, 33)

						} // we were waiting for the first keystroke inside the T.I.O text clip

					localStorage [this.resource] = text || tio.it	// set persistent page record

					return (hold)					// returned to "tio.highlight"

			} // effective change: switch through circumstances

		}, // register change, perform related chores

		/*
		 *	navigate to and load resource into TIO display:
		 *
		 *	      - it also responds to onpopstate events, therefore this function MUST
		 *		be able to cope with any state in which the U.I. may be found: this
		 *		is the most important thing to consider while handling its code
		 *
		 *	      - this function implements most of the navigation's dynamics, handles
		 *		all system nodes, all resident resources, and will also call itself
		 *		for a second time to load non-resident resources (in the first call
		 *		the server's queried for the resource, in the second call, "nav.to"
		 *		parses the server's response and updates the TIO display); its main
		 *		modes of operations are four, listed below from the simplest to the
		 *		most "convoluted":
		 *
		 *		     1) pre-flight mode: does not really alter the page's state and
		 *			resolves in delegating functionality to another part of the
		 *			front-end, including prompting the user for confirmations;
		 *
		 *		     2) navigation to a resident paragraph: would not send anything
		 *			to the server, requires no response and no connectivity; it
		 *			occurs while visiting infrastructural "nodes" like the home
		 *			page for the whole site, help pages, and immutable indices;
		 *
		 *		     3) append mode: does not reset the page state, but will post a
		 *			request for additional content to be displayed below what's
		 *			already there (e.g. "see more" nodes): it generally doesn't
		 *			involve "nav.to" calling back to itself, as the simple code
		 *			to process the response fits easily in the request's onload
		 *			handler;
		 *
		 *		     4) navigation to arbitrary full-fledged server-side resources:
		 *			this is where the function calls itself back from within an
		 *			onload handler; additionally, it implies resetting the page
		 *			state, interrupting all synchronous tasks for the NAV, CUI,
		 *			and TIO hubs (and all asynchronous tasks that we can safely
		 *			control, i.e. the timeouts)
		 *
		 *	      - "nav.to" takes upto three arguments, only the first of which is not
		 *		optional, though it may be null (or zero, or whatever is no regular
		 *		instance of a Javascript object): the <event> is what we find there
		 *		when this function reacts to "popstate", to move through navigation
		 *		history - in all other cases, it's always nullified; the <resource>
		 *		is a string, identifying either an URI to query the server with, or
		 *		a resident paragraph of the main HTML document, or a system node to
		 *		perform an associated action (e.g. 'sys/save/changes'): when a call
		 *		is directly made to "nav.to" without passing a string resource, the
		 *		function defaults to, either: the <destination> property of a bound
		 *		object, the current location hash (as displayed by the address bar)
		 *		or, in lack of any of the above, the "welcome page" (being the main
		 *		home page which resource path is always hidden in the address bar);
		 *		finally, <pairs> is an object containing a plethora of assorted and
		 *		arbitrary parameters, some of which pertain specific resources, and
		 *		others driving more generic aspects of "nav.to"; among generics, it
		 *		makes sense to list the following in detail:
		 *
		 *		      - interstitial: it's a flag, and if true, induces "nav.to" to
		 *			bypass pushing a new history node, which the history API or
		 *			our own back/forward arrows would "stop" at; "interstitial"
		 *			navigation is connected to actions that constitute internal
		 *			browsing of a multi-faceted resource, such as "pages" for a
		 *			page's main notes, or the editable version of a page;
		 *
		 *		      - instant: it's another flag, telling "nav.to" to not animate
		 *			while loading (withholding the "slow data receive" effect),
		 *			used when changes need to apply immediately to content, and
		 *			in all cases where "nav.to" responds to "popstate";
		 *
		 *		      - reentry: one more flag, telling "nav.to" to load a resource
		 *			and visualize it in its corresponding edit mode, by passing
		 *			the "~edit" modality to the server (modalities are appended
		 *			to the resource's plain URI) after the "server query" call
		 */

		to: function (event, resource, pairs) {

		    let tail = function (arrangement) {

				/*
				 *	update back/forward links in menu bar
				 */

			    let enable = avail
			    let disarm = score

				back.className = (nav.mc) ? enable : (nav.np) ? (nav.pp) ? enable : disarm : (nav.ps.op) ? enable : disarm
				forw.className =		     (nav.pp) ? (nav.np) ? enable : disarm : (nav.ps.nx) ? enable : disarm

				/*
				 *	if this is the entry request, and we're hailed from "HTTP",
				 *	while knowing this server provides a secure channel, prompt
				 *	the user to encourage the switch to the secure channel
				 */

				if (this.entryRequest && location.protocol === 'http:' && s_channel === 'we/have/one')

					cui.quest ({

						exec: function () {

							location.href = 'https://' + location.host + location.pathname + location.hash

						},

						question: t_secure_switch

					})

				/*
				 *	update sessionstorage popstate object
				 */

				sessionStorage.ps = JSON.stringify (nav.ps)

				/*
				 *	set reentry flag to reenter edit mode
				 */

				nav.er = be.switch (this.reentry).or (null)

				/*
				 *	this is when we don't want flickering
				 *	labels and stuff as we're loading our
				 *	resource in two phases...
				 */

				if (arrangement === 'hold titles')

					return (true)

				/*
				 *	update page headings (top label, lead link, note icon)
				 */

				switch (be.string (arrangement).or ('none')) {

					case 'join':
					case 'port':

						this.topLabel = this.topLabel || (t_welcome)
						break

					default:

						if (this.noteMode)

							this.noteMode = '{' + t_talk + blank + '~C}'

						if (undefed (this.leadLink) && nav.id === true) {

							this.topLabel = this.topLabel || (t_grt + blank + tb (nav.username ())).substr (0, 29)	// "HI, YOU"
							this.leadLink = this.leadLink || (blank + index + blank + (t_go_to_blog))		// "ACCESS YOUR BLOG"

						} // if the page does not pick a "topLabel", but the user's logged in, use defaults to set up a "hello" and the blog link

						if (undefed (this.leadLink) && nav.id == false) {

							this.topLabel = this.topLabel || (t_welcome)						// "WELCOME"
							this.leadLink = this.leadLink || (blank + index + blank + (t_enter))			// "SIGN UP OR LOG IN"

						} // if the page does not pick a "topLabel", but the user's not logged in, use defaults to entice registration, or log in

				}

				defined (this.leadLink) && cui.mbUpdate ({

					live: this.append ? false : nav.cm ? false : true,
					menu: nline + 'M `` [\\] {`} {' + this.leadLink + Array (Math.max (0, 30 - this.leadLink.length)).join (blank) + '} {80.STYLE}' + blank + (this.noteMode || '{<} {>}') + nline

				}) // if there was - or is now - a leadLink, insert it before the home link and, if needed, substitute the "THEME" switch

				defined (this.leadLink) || cui.mbUpdate ({

					live: this.append ? false : true,
					menu: nline + 'M `` [\\] {`} {' + Array (30).join (blank) + '} {80.STYLE}' + blank + (this.noteMode || '{<} {>}') + nline

				}) // if there's no leadLink (passport page), use the default menu layout, substituting only the "THEME" switch if needed

				cui.label (this.topLabel || empty)

				/*
				 *	always return true so we'd use one-line evaluation in calls
				 */

				return (true)

			}.bind (pairs = be.object (pairs).or (new Object))

			/*
			 *	run the bound-ahead function
			 *	this is a syntactic sugar construct in dialogs, it's generally "q"
			 */

			be.lambda (this && this.runner).or (idler).call ()

			/*
			 *	input event from "popstate",
			 *	or querying the latest event associated to this window; given file
			 */

		    let evnt = event || window.event || (null)
		    let file = be.string (resource).or (empty).replace (/\%7E/gi, tilde)

			/*
			 *	resource path will be the given "file", in lack of which, it may be
			 *	given as parameter in the bound object, or we'd just try and reload
			 *	the path appearing in the address bar as the fragment (hash) of the
			 *	current URL (all out dynamic paths follow that old-but-gold rule as
			 *	a mean to create a semantic "wall" between REAL server-side objects
			 *	and user-controlled content); if even the hash is void, eeh... just
			 *	load the welcome page, as a fail-safe
			 *
			 *	      - the hash obtained below will be stripped of the modality to
			 *		resolve the clean path to the dynamic resource (whereas the
			 *		path would still store the path + modality assembly); after
			 *		isolating the clean path, we'll look for a pending entry in
			 *		localStorage, determining the state of the "modified" flag,
			 *		and triggering associated behaviors
			 */

		    let path = file.length ? file : (this.destination || location.hash.substr (2) || 'sys/welcome/page')
		    let hash = location.hash.substr (2).split (tilde).shift ()
		    let mody = localStorage [hash] ? true : false

		    let edit = false	// edit mode
		    let auth = false	// user recognized as the author of this resource
		    let kind = false	// kind of paragraph when forced, i.e. "sys", "ow" or false
		    let scst = false	// Scroll and Cursor hiSTory record on popstate event
		    let node = false	// node paths for resident paragraphs (internal path)
		    let text = false	// text retrieved from resident paragraph, if not preloaded
		    let v0id = false	// void object or void entry flag, generic
		    let auto = false	// form auto-complete records (TIO, indexed by line number)
		    let dump = false	// dump resident resource text as is without "rcrop"-ing it
		    let menu = empty	// loaded with nav.cb or empty as we load resident resource

		    let from = null	// inherits queryAfter (last entry name) in extensible list
		    let last = '44'	// last index we reach, after the <from> entry, per "chunk"

		    let username = empty	// picked from field, not the actual login username
		    let password = empty	// picked from field, not the actual login password
		    let usrFacts = empty	// fingerprinting data as "detected" on sign up/in
		    let postpend = false	// flag: note pending, on entry into note sections

		    let manouver = false	// passed to "/publish" ("PUBLISH|CORRECT|WIPEOUT")
		    let localKey = false	// key in localStorage to address for changes
		    let lands_to = false	// path of future resource when publishing

			/*
			 *	late-initialization locals
			 */

		    let modality	// what follows tilde (~) in a dynamic path (edit, full...)
		    let purePath	// path without modality
		    let generics	// various uses
		    let void_ent	// void entries roster as of sessionStorage in popstate
		    let pushback	// path to push into history API (reflected in address bar)
		    let pagePath	// index in localStorage
		    let response	// objective response to two-stage request
		    let paginate	// extended modality for sections that can enumerate pages
		    let arranges	// final arrangement, passed to the "tail" function, above

			/*
			 *	determining entry path and modality,
			 *	localized resource path translation, setting internal state flags
			 *
			 *	      - pairs.filename will set <mody> so it will reflect on class
			 *		names of UI gadgets, and internally to this specific call,
			 *		but what really makes it effective (induces the page to be
			 *		saved even in lack of user intervent to somehow change it)
			 *		comes much later, and after eventually filling the default
			 *		file name in its void TIO field, and consists in forcing a
			 *		hardcopy of the TIO page content (tio.it) to be assigned a
			 *		localStorage record under this resource's path; in lack of
			 *		such later intervent (which cannot be done elsewhere), any
			 *		page which is being edited after loading a package, but in
			 *		lack of user intervent, would not be "truly" saved and its
			 *		package file's name wouldn't be associated to the package,
			 *		ultimately leading to a package that, if downloaded, saves
			 *		under an entire page's path (the default behavior from the
			 *		server) rather than under the shorter, simpler name out of
			 *		the loaded file, or as specified by the author in a former
			 *		association of a package to this page
			 *
			 *	      - yeh, it sucks...
			 */

			resource = path.split (tilde).shift ()
			modality = path.split (tilde).pop ()
			purePath = modality === resource
			resource = be.string (t_translateNodes [resource]).or (resource)

			switch (modality) {

				case 'edit':
				case 'post':

					edit = true
					mody = pairs.filename ? true : mody	// internal state

			} // edit and post modes will imply <edit>, pairs.filename implies <mody>

			/*
			 *	adding or dropping pictures while a hardcopy of the modified page
			 *	is in use would later cause the hardcopy to be off-synch, and the
			 *	other solution would be that of altering the hardcopy, which ties
			 *	the workings of the client-side navigation script to the specific
			 *	layouts of affected pages as provided by the server, establishing
			 *	a form of long-range coupling that'd be harder to maintain; while
			 *	the UI shouldn't be normally placed in that conflicting state, it
			 *	might be a good idea to preserve the preflight test and alert box
			 *	to let the user undo the damage when it occurs
			 */

			switch (resource) {

				case 'sys/announcements':

					if (location.hash.length)

						break	// because it's loading the page directly

					if (be.vector (nav.cs.highlights).or (avoid).length === 0) {

					    let cp = cui.posit

						cui.posit = highlights_end + (2)
						cui.alert ({ assert: cui.mq = true, argument: t_nothingToSee, exit: function () { cui.mq = false; cui.posit = cp } })

						return (false)

					} // just don't bring us to an empty page...

					break

				case 'sys/gen/themed/link':

					return (link.onclick.call (link, { theme: (true) })), false

				case 'sys/share/this/page':
				case 'sys/share/this/blog':
				case 'sys/share/this/profile':
				case 'sys/share/this/collection':

					return (link.onclick.call (link, { type: 'click' })), false

				case 'sys/type/something':

					return (post.onclick.call (post, { type: 'click' })), false

				case 'sys/edit/headings':
				case 'sys/edit/info/page':
				case 'sys/edit/this/page':
				case 'sys/edit/profile':

					edit || window.edit.onclick.call (window.edit, { type: 'click' })
					return (false)

				case 'sys/quit/editing':

					edit && window.edit.onclick.call (window.edit, { type: 'click' })
					return (false)

				case 'sys/apply/headings':
				case 'sys/discard/draft':
				case 'sys/publish':
				case 'sys/save/changes':
				case 'sys/save/info/page':
				case 'sys/save/profile':
				case 'sys/undo/changes':

					if ((tio.onchanges ({ queryState: true }) || clear).easyRetype) {

						mody = true
						break

					} // if proposed text wasn't changed, consider it modified to subsequently save it empty

					switch (mody || resource) {

						case 'sys/discard/draft':

							nav.ps.op && history.go (-1)

						case 'sys/publish':

							return (false)

						case (true):

							break

						default:

							/*
							 *	meanwhile, assume attempts to save or discard changes
							 *	in LACK of any changes as equivalents to quitting our
							 *	page edit mode
							 */

							return (window.edit.onclick.call (window.edit, { type: 'click' })), false

					} // if not modified, ignore "publishing" void forms

			} // preflight tests and delegations

			/*
			 *	produce confirmation dialogs before destructive operations; also,
			 *	adding or dropping pictures while a hardcopy of the modified page
			 *	is in use would later cause the hardcopy to be off-synch, and the
			 *	other solution would be that of altering the hardcopy, which ties
			 *	the workings of the client-side navigation script to the specific
			 *	layouts of affected pages as provided by the server, establishing
			 *	a form of long-range coupling that'd be harder to maintain; while
			 *	the UI shouldn't be normally placed in that conflicting state, it
			 *	might be a good idea to preserve the preflight test and alert box
			 *	to let the user undo the damage when it occurs
			 *
			 *	      - my bad, all of the above... I probably shouldn't have let
			 *		the server precompose TIO layouts: those are presentation
			 *		and should have concerned the front-end, buut... maybe in
			 *		future revisions...
			 */

			switch (resource) {

				case 'sys/drop/home/cover/picture':
				case 'sys/drop/package/attachment':
				case 'sys/drop/page/cover/picture':
				case 'sys/drop/profile/picture':
				case 'sys/drop/this/page':

					switch (resource) {

						case 'sys/drop/package/attachment':

							if (nav.kp && be.switch (pairs.confirm).or (false) === false) {

								cui.quest ({ exec: function () {

									nav.to (null, resource, { confirm: true })

								}, question: t_package_loss })

								return (false)

							}

							break

						case 'sys/drop/page/cover/picture':

							if (nav.ip && be.switch (pairs.confirm).or (false) === false) {

								cui.quest ({ exec: function () {

									nav.to (null, resource, { confirm: true })

								}, question: t_picture_loss })

								return (false)

							}

							break

						default:

							if (nav.kp && be.switch (pairs.passOne).or (false) === false) {

								cui.quest ({ exec: function () {

									nav.to (null, resource, { passOne: true })

								}, question: t_package_loss })

								return (false)

							}

							if (nav.ip && be.switch (pairs.passTwo).or (false) === false) {

								cui.quest ({ exec: function () {

									nav.to (null, resource, { passOne: true, passTwo: true })

								}, question: t_picture_loss })

								return (false)

							}

					} // destructive operations

				case 'sys/flip/page/cover/picture':
				case 'sys/flip/profile/picture':
				case 'sys/load/home/cover/picture':
				case 'sys/load/package/attachment':
				case 'sys/load/page/cover/picture':
				case 'sys/load/profile/picture':

					switch (resource) {

						case 'sys/drop/this/page':

							break

						default:

							if (mody === true)

								return (cui.alert ({ argument: t_save_discard }), false)

					} // layout-switching (includes destructive operations)

				default:

					path = resource + (purePath ? empty : tilde + modality)

			} // preflight tests and translated path recomposition

			/*
			 *	process transparent actions:
			 *	these are not meant to change the state of the page
			 */

			switch (resource) {

				case 'sys/create/my/account':

					if (nav.clipText ().length < nav.sz) {

						cui.alert ({ argument: t_fill_passport })
						return (false)

					} // not that the server would accept incomplete passports

					break

				case 'sys/discard/draft':

					cui.quest ({

						exec: function () {

							localStorage.removeItem (hash)
							nav.ps.op && (history.go (-1))

						},

						question: t_discard_draft

					})

					return (false)

				case 'sys/load/home/cover/picture':

					return $('cover-file').click (), false

				case 'sys/load/package/attachment':

					return $('packg-file').click (), false

				case 'sys/load/page/cover/picture':

					return $('image-file').click (), false

				case 'sys/load/profile/picture':

					return $('photo-file').click (), false

				case 'sys/post/a/new/image':

					return $('image-post').click (), false

				case 'sys/load/images':

					return $('slide-show').click (), false

				case 'sys/undo/changes':

					cui.quest ({

						exec: function () { nav.to (null, hash, { instant: true, interstitial: true, where: localStorage.removeItem (hash) }) },
						question: t_discard_chgs

					})

					return (false)

			} // transparent actions

			/*
			 *	process array actions
			 */

			nav.aa = /\#\/\d{4}\.\d{4}$/.test (location.hash)

			while (generics = resource.match (/^(\d{4}).(\d{4})$/)) {

			    let z = be.number (parseInt (generics.pop ())).or (0)
			    let x = be.number (parseInt (generics.pop ())).or (0)

				if (x < 1000 || z < 1000 || x > 8584 || z > 8584) {

					resource = 'ow/out/of/array'
					break

				}

				if (nav.is) {

					lands_to = resource
					resource = String ('sys/quicktrip/to/given/areal')
					break

				}

				nav.pb = resource

				return (gate.onclick ()), false

			} // process areal links

			switch (resource) {

				case 'sys/r/quicktrip':
				case 'sys/r/make':

					nav.is ? tio.onpgfocus (nav.mc.enable = false) : null
					nav.al = nav.is

				case 'sys/set/destination/to/entry/areal':
				case 'sys/set/destination/to/given/areal':
				case 'sys/quicktrip/to/entry/areal':
				case 'sys/quicktrip/to/given/areal':

					if (nav.is) {

						nav.t5 && (resource = path = 'ow/quicktrip/in/progress')
						nav.t5 && (pairs.interstitial = true)

						break

					}

					resource = path = 'ow/not/in/array'

				default:

					nav.al = false

			} // array action preflight

			switch (nav.is && resource) {

				case 'sys/set/destination/to/entry/areal':
				case 'sys/set/destination/to/given/areal':
				case 'sys/quicktrip/to/entry/areal':
				case 'sys/quicktrip/to/given/areal':

				    let arealX = X = undefined
				    let arealY	   = nav.st.ar
				    let arealZ = Z = undefined

					switch (resource) {

						case 'sys/set/destination/to/entry/areal':
						case 'sys/quicktrip/to/entry/areal':

							arealX = X = arealZ = Z = 4792

						case 'sys/set/destination/to/given/areal':
						case 'sys/quicktrip/to/given/areal':

							arealX = X = (arealX || be.number (parseInt ((nav.grab ('AREACODE') || lands_to).substr (0, 4), 10)).or (9999))
							arealZ = Z = (arealZ || be.number (parseInt ((nav.grab ('AREACODE') || lands_to).substr (5), 10)).or (9999))

							if (X < 1000 || X > 8584 || Z < 1000 || Z > 8584) {

								resource = path = 'ow/out/of/array'
								pairs.interstitial = true
								break

							}

							nav.st.lastAreal = X + point + Z

							arealX = (arealX - 4792) * 321868
							arealZ = (arealZ - 4792) * 321868

							nav.st.pitch =	nav.st.rc.aimAt ({ x: arealX, y: arealY, z: arealZ }).pitch
							nav.st.yaw =	nav.st.rc.aimAt ({ x: arealX, y: arealY, z: arealZ }).yaw

					}

					switch (resource) {

						case 'sys/set/destination/to/entry/areal':
						case 'sys/set/destination/to/given/areal':

						    let former = World.interactables.destination || null
						    let tgtBox = nav.array.runner = new Box (t_destination).premiering (555).setHandler (function () {

								this.remove (nav.array.runner = null)
								delete (World.interactables.destination)

							})

							if (former) {

								former.element.remove ()
								delete (World.interactables.destination)

							}

							World.interactables.destination = {

								caliber: 999999,

								subject: {

									origin: {

										x: arealX,
										y: arealY,
										z: arealZ

									}

								},

								element:  tgtBox.appendNote (`${t_areal} ${X}.${Z}`),
								distance: tgtBox.appendNote (empty, { handled: true })

							}

							return (ray.onaction (), tio.onpickrun ({ label: t_exit })), false

						case 'sys/quicktrip/to/entry/areal':
						case 'sys/quicktrip/to/given/areal':

							nav.st.live.vx =
							nav.st.live.vy =
							nav.st.live.vz = nav.st.speed = nav.st.free = 0

							for (let k in World.interactables)

								World.interactables [k].persist || World.interactables [k].element.remove ()

							nav.array.runner = new Box (t_destination).premiering (55).setHandler (function () {

								this.remove (nav.array.runner = null)
								delete (World.interactables.destination)

							})

							World.interactables.destination = {

								caliber: 999999,

								subject: {

									origin: {

										x: arealX,
										y: arealY,
										z: arealZ

									}

								},

								element:  nav.array.runner.appendNote (`${t_areal} ${X}.${Z}`),
								distance: nav.array.runner.appendNote (empty, { handled: true })

							}

							nav.t5 = setTimeout (function () {

							    let x = (arealX + nav.st.rc.x) / 2
							    let y = (arealY + nav.st.rc.y) / 2
							    let z = (arealZ + nav.st.rc.z) / 2
							    let u = x - nav.st.rc.x
							    let v = y - nav.st.rc.y
							    let w = z - nav.st.rc.z
							    let d = Math.sqrt (u * u + v * v + w * w)

							    let limiter = d <= 3 * 321868 ? 999999 : 3218680

								nav.t5 = setInterval (function () {

								    let c = nav.st.rc
								    let l = nav.st.live
								    let p = c.x - x
								    let q = c.y - y
								    let r = c.z - z
								    let m = Math.sqrt (p * p + q * q + r * r)
								    let u = arealX - c.x
								    let v = arealY - c.y
								    let w = arealZ - c.z
								    let n = Math.sqrt (u * u + v * v + w * w)
								    let e = (d - m + 1) / (8 * (n + limiter))

									c.viewFrom ({

										x: c.x + (u = e * u),
										y: c.y + (v = e * v),
										z: c.z + (w = e * w),

										imply: l.qv = 1 + Math.sqrt (u * u + v * v + w * w),
										giving: scc.style.opacity = (l.tv = l.tv || (l.qv > 3000)) ? 0 : 1

									})

								    let i = Math.round (c.x / 321868 + 4792)
								    let j = Math.round (c.z / 321868 + 4792)

									if (i === X && j === Z) {

										nav.st.live.qv = 0
										cruiser.style.opacity = 0

										if ((n = Math.sqrt (u * u + v * v + w * w)) > 400) {

											nav.st.live.vx = (arealX - c.x) / 250
											nav.st.live.vy = (arealY - c.y) / 250
											nav.st.live.vz = (arealZ - c.z) / 250

											cruiser.style.opacity = 1
											nav.t7 = setTimeout (nav.array.cutAutoCruise, 4800)

										}

										clearInterval (nav.t5, nav.t5 = null)
										clearInterval (nav.t6, nav.t6 = null)

										nav.st.free = 1
										scc.style.opacity = 1
										nav.array.runner && nav.array.runner.box.onclick ()

									}

								}, 50 / 3)

								nav.t6 = setInterval (function () {

									cruiser.style.opacity = 1 - parseInt (getComputedStyle (cruiser).opacity)

								}, 500)

							}, 500)

							return (ray.onaction (), tio.onpickrun ({ label: t_exit, as: nav.st.mc.enable = false })), false

					}

					break

				case 'sys/r/make':

					pairs.basics = be.string ({

						en: [

							'P `` [POST~sys/r/make/post] {TREE~sys/r/make/tree} {TILE~sys/r/make/tile} {PATH 2X2~sys/r/make/path_2x2} {PATH 1X1~sys/r/make/path_1x1}',
							'P `` [WALL X6~sys/r/make/wall_x6] {WALL X3~sys/r/make/wall_x3} {WALL X2~sys/r/make/wall_x2} {WALL X1~sys/r/make/wall_x1}',
							'P `` [DICE~sys/r/make/dice] {SEAM~sys/r/make/seam} {DECO-SEAM~sys/r/make/decoseam} {ICO-SEAM~sys/r/make/icoseam}',
							'P `` [COIN~sys/r/make/coin] {RING~sys/r/make/ring} {POLE~sys/r/make/pole} {CONE~sys/r/make/cone} {BALL~sys/r/make/ball} {SPIRE~sys/r/make/spire}',
							'P `` [DISH~sys/r/make/dish] {GLASS~sys/r/make/glass} {FORK~sys/r/make/fork} {KNIFE~sys/r/make/knife} {SPOON~sys/r/make/spoon}',
							'P `` [MUG~sys/r/make/mug] {CUP~sys/r/make/cup} {TEAPOT~sys/r/make/teapot} {MOKA~sys/r/make/moka} {BOTTLE~sys/r/make/bottle}',,

							'P `` [A~sys/r/make/a] {B~sys/r/make/b} {C~sys/r/make/c} {D~sys/r/make/d} {E~sys/r/make/e} {F~sys/r/make/f} {G~sys/r/make/g} {H~sys/r/make/h} {I~sys/r/make/i}'
							  + ' {J~sys/r/make/j} {K~sys/r/make/k} {L~sys/r/make/l} {M~sys/r/make/m}',
							'P `` [N~sys/r/make/n] {O~sys/r/make/o} {P~sys/r/make/p} {Q~sys/r/make/q} {R~sys/r/make/r} {S~sys/r/make/s} {T~sys/r/make/t} {U~sys/r/make/u} {V~sys/r/make/v}'
							  + ' {W~sys/r/make/w} {X~sys/r/make/x} {Y~sys/r/make/y} {Z~sys/r/make/z}',
							'P `` [1~sys/r/make/1] {2~sys/r/make/2} {3~sys/r/make/3} {4~sys/r/make/4} {5~sys/r/make/5} {6~sys/r/make/6} {7~sys/r/make/7} {8~sys/r/make/8} {9~sys/r/make/9}'
							  + " {0~sys/r/make/0} {-~sys/r/make/dash} {'~sys/r/make/quote} {?~sys/r/make/qmark}",,

							'0035 `` ENTIRE LABEL ` ',
							   'N `` CREATE LABEL'

						].join (nline),

						it: [

							'P `` [PALETTO~sys/r/make/post] {ALBERO~sys/r/make/tree} {PIASTRA~sys/r/make/tile} {VIALINO~sys/r/make/path_1x1} {VIALINO 2X2~sys/r/make/path_2x2}',
							'P `` [MURO X6~sys/r/make/wall_x6] {MURO X3~sys/r/make/wall_x3} {MURO X2~sys/r/make/wall_x2} {MURO X1~sys/r/make/wall_x1}',
							'P `` [DADO~sys/r/make/dice] {COLONNINO~sys/r/make/seam} {DECO-COLONNINO~sys/r/make/decoseam} {ICO-COLONNINO~sys/r/make/icoseam}',
							'P `` [MONETA~sys/r/make/coin] {ANELLO~sys/r/make/ring} {PALO~sys/r/make/pole} {CONO~sys/r/make/cone} {PALLA~sys/r/make/ball} {GUGLIA~sys/r/make/spire}',
							'P `` [PIATTO~sys/r/make/dish] {BICCHIERE~sys/r/make/glass} {FORCHETTA~sys/r/make/fork} {COLTELLO~sys/r/make/knife} {CUCCHIAIO~sys/r/make/spoon}',
							'P `` [BOCCALE~sys/r/make/mug] {TAZZA~sys/r/make/cup} {TEIERA~sys/r/make/teapot} {MOKA~sys/r/make/moka} {BOTTIGLIA~sys/r/make/bottle}',,

							'P `` [A~sys/r/make/a] {B~sys/r/make/b} {C~sys/r/make/c} {D~sys/r/make/d} {E~sys/r/make/e} {F~sys/r/make/f} {G~sys/r/make/g} {H~sys/r/make/h} {I~sys/r/make/i}'
							  + ' {J~sys/r/make/j} {K~sys/r/make/k} {L~sys/r/make/l} {M~sys/r/make/m}',
							'P `` [N~sys/r/make/n] {O~sys/r/make/o} {P~sys/r/make/p} {Q~sys/r/make/q} {R~sys/r/make/r} {S~sys/r/make/s} {T~sys/r/make/t} {U~sys/r/make/u} {V~sys/r/make/v}'
							  + ' {W~sys/r/make/w} {X~sys/r/make/x} {Y~sys/r/make/y} {Z~sys/r/make/z}',
							'P `` [1~sys/r/make/1] {2~sys/r/make/2} {3~sys/r/make/3} {4~sys/r/make/4} {5~sys/r/make/5} {6~sys/r/make/6} {7~sys/r/make/7} {8~sys/r/make/8} {9~sys/r/make/9}'
							  + " {0~sys/r/make/0} {-~sys/r/make/dash} {'~sys/r/make/quote} {?~sys/r/make/qmark}",,

							'0035 `` TESTO INTERO ` ',
							   'N `` GENERA TESTO'

						].join (nline)

					} [lang]).or (empty)

					pairs.marks = be.string ({

						en: 'P `` [LEVEL~sys/r/make/landmark_level] {UPWARD-POINTING~sys/r/make/landmark_upward} {DOWNWARD-POINTING~sys/r/make/landmark_downward}',
						it: "P `` [ORIZZONTALE~sys/r/make/landmark_level] {VERSO L'ALTO~sys/r/make/landmark_upward} {VERSO IL BASSO~sys/r/make/landmark_downward}"

					} [lang]).or (empty)

					break

				case 'sys/create/label':

				    let label = nav.grab (t_label)

					if (label.match (/\S/)) {

						nav.updateModel ({

							text:		ray.textAssembly ({ string: label }).model,
							edge:		String ('#8F0'),
							size:		1,
							lay:		0,
							anix:		1,
							aniy:		1,
							aniz:		1,
							solid:		true,
							flat:		true,
							shiny:		false,
							owned:		false,
							spacing:	1,
							thickness:	1,
							threshold:	1,
							init:		true

						}) // create this basic model instance

						if (nav.array.instance) {

							nav.array.modelName = label.toLowerCase ().replace (/\'/g, '#q').replace (/\?/g, '#m').replace (/[^\-\w\#]/g, minus) + score + 'txt'
							nav.array.modelType = String ('obj')

							ray.onaction  ()
							tio.onpickrun ({ label: t_exit, dance: nav.st.mc.enable = true })

						} // if everything went ok, and we have an instance...

					} // if we don't have a void or visually void text...

					return (false)

				default:

					if (resource.startsWith ('sys/r/make/')) {

					    let params = undefined
					    let naming = resource.split (slash).pop ()

						switch (naming) {

							case 'post':

								params = {

									edge:		String ('#F00'),
									size:		0.60,
									flat:		true,
									threshold:	0.50

								}

								break

							case 'tile':

								params = {

									solid:		true,
									flat:		true,
									thickness:	.016,
									threshold:	0

								}

								break

							case 'path_1x1':
							case 'path_2x2':

								params = {

									edge:		String ('#888'),
									solid:		true,
									spacing:	0.99

								}

								break

							case 'tree':

								params = {

									edge:		String ('#8F0'),
									size:		1.40,
									thickness:	.024,
									threshold:	0.75

								}

								break

							case 'wall_x1':

								params = {

									edge:		String ('#F90'),
									solid:		true,
									aniz:		0.65,
									thickness:	0.016

								}

								break

							case 'wall_x2':

								params = {

									edge:		String ('#F90'),
									solid:		true,
									aniz:		0.82,
									thickness:	0.016

								}

								break

							case 'wall_x3':

								params = {

									edge:		String ('#F90'),
									solid:		true,
									aniz:		0.88,
									thickness:	0.016

								}

								break

							case 'wall_x6':

								params = {

									edge:		String ('#F90'),
									solid:		true,
									aniz:		0.94,
									thickness:	0.016

								}

								break

							case 'dice':

								params = {

									edge:		String ('#8F0'),
									solid:		true,
									thickness:	0.016

								}

								break

							case 'seam':
							case 'decoseam':
							case 'icoseam':

								params = {

									edge:		String ('#8DF'),
									solid:		true,
									spacing:	0.99

								}

								break

							case 'coin':

								params = {

									edge:		String ('#FD0'),
									solid:		true,
									spacing:	0.99

								}

								break

							case 'ring':

								params = {

									edge:		String ('#8DF'),
									solid:		true,
									spacing:	0.84

								}

								break

							case 'pole':

								params = {

									edge:		String ('#88F'),
									solid:		true,
									spacing:	0.99

								}

								break

							case 'cone':

								params = {

									edge:		String ('#F00'),
									solid:		true,
									spacing:	0.98

								}

								break

							case 'ball':

								params = {

									edge:		String ('#F0F'),
									spacing:	0.96

								}

								break

							case 'spire':

								params = {

									edge:		String ('#8DF'),
									spacing:	0.92

								}

								break

							case 'dish':

								params = {

									edge:		String ('#FFF'),
									solid:		true,
									spacing:	0.96

								}

								break

							case 'glass':

								params = {

									edge:		String ('#4AF'),
									solid:		true,
									spacing:	0.98

								}

								break

							case 'fork':

								params = {

									edge:		String ('#FFF'),
									spacing:	0.99

								}

								break

							case 'knife':

								params = {

									edge:		String ('#FFF'),
									solid:		true,
									spacing:	0.99

								}

								break

							case 'spoon':

								params = {

									edge:		String ('#FFF'),
									spacing:	0.96

								}

								break

							case 'mug':

								params = {

									edge:		String ('#F90'),
									solid:		true,
									spacing:	0.99

								}

								break

							case 'cup':

								params = {

									edge:		String ('#FFF'),
									solid:		true,
									spacing:	0.99

								}

								break

							case 'teapot':

								params = {

									edge:		String ('#F90'),
									solid:		true,
									spacing:	0.99

								}

								break

							case 'moka':

								params = {

									edge:		String ('#FFF'),
									solid:		true,
									spacing:	0.96

								}

								break

							case 'bottle':

								params = {

									edge:		String ('#8F0'),
									solid:		true,
									spacing:	0.99

								}

								break

							case 'a': case 'b': case 'c': case 'd': case 'e': case 'f': case 'g': case 'h': case 'i': case 'j': case 'k': case 'l': case 'm':
							case 'n': case 'o': case 'p': case 'q': case 'r': case 's': case 't': case 'u': case 'v': case 'w': case 'x': case 'y': case 'z':
							case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9': case '0': case 'dash': case 'quote': case 'qmark':

								params = { edge: String ('#8F0'), solid: true, flat: true }
								naming = score + naming
								break

							case 'landmark_level':

								params = {

									edge:		String ('#F00'),
									thickness:	0.128

								}

								break

							case 'landmark_upward':

								params = {

									edge:		String ('#8DF'),
									thickness:	0.128

								}

								break

							case 'landmark_downward':

								params = {

									edge:		String ('#8F0'),
									thickness:	0.128

								}

								break

							default:

								return (false)

						} // switch through known basic models, or ignore the call

						nav.updateModel ({

							text:		rm (naming)		|| String ('v -1 0 1\nv 1 0 1\nv 1 0 -1\nv -1 0 -1\nf 1 2 3 4'),
							edge:		params.edge		|| String ('#CCC'),
							size:		params.size		|| 1,
							lay:		params.lay		|| 0,
							anix:		params.anix		|| 1,
							aniy:		params.aniy		|| 1,
							aniz:		params.aniz		|| 1,
							solid:		params.solid		|| false,
							flat:		params.flat		|| false,
							shiny:		params.shiny		|| false,
							owned:		params.owned		|| false,
							spacing:	params.spacing		|| 1,
							thickness:	params.thickness	|| 1,
							threshold:	params.threshold	|| 1,

							init:		true

						}) // create this basic model instance

						if (nav.array.instance) {

							nav.array.modelName = naming.startsWith (score) ? naming.substr (1) : naming
							nav.array.modelType = String ('obj')

							ray.onaction  ()
							tio.onpickrun ({ label: t_exit, dance: nav.st.mc.enable = true })

						} // if everything went ok, and we have an instance...

						return (false)

					} // basics factory

			} // array actions

			/*
			 *	preprocess system nodes which behavior depends on current page state,
			 *	and which try and submit some kind of change (that may be rejected in
			 *	response to invalid lengths, character set constrains, etc)
			 */

			switch (resource) {

				case 'sys/apply/headings':
				case 'sys/publish':
				case 'sys/save/changes':
				case 'sys/save/info/page':
				case 'sys/save/profile':

					if ((tio.onchanges ({ queryState: true }) || clear).easyRetype) {

						nav.allClear (block)
						break

					} // if page expected proposed text to be changed, but wasn't changed, consider it empty

					generics = nav.clipText ().replace (/^\s+|\s$/g, empty)

					if (generics.match (/\n/g) === null) {

						nav.allClear (centering (generics, tio.nc))
						break

					} // if page features one line in any cases, and it's shorter than the screen, center it

					break

				default:

					/*
					 *	when pages are being edited, cursor can be in "illegal" positions
					 *	and we may not recall its position - to then restore it when we'd
					 *	respond to popstate - if no attempt to save an entry is currently
					 *	being done (i.e. you're editing, you move the cursor quite freely
					 *	with respect to normal navigation, then change your mind and skip
					 *	to a totally different page without saving or discarding changes)
					 *
					 *	      - the mechanism is pretty convoluted here, so let's explain
					 *		all conditions for good: while attempting to save changes
					 *		to a mutable entry, the first thing to occur is a request
					 *		to the server (e.g. '/publish', '/writeHome'...) that may
					 *		result in success (and the "onload" handler is called) or
					 *		failure (and the "onwhoa" handler is called): in the last
					 *		case, pairs.reentry will be true to allow navigating back
					 *		to the page and re-enter edit mode so we can correct what
					 *		caused that failure; checking pairs.reentry then PREVENTS
					 *		forgetting the cursor's position upon making the request,
					 *		and displaying the server's error message; HOWEVER:
					 *
					 *	      - navigating back to arbitrary URLs, even in "edit reentry"
					 *		mode, will still happen in two phases: first the server's
					 *		queried for the URL, then the "onload" handler calls back
					 *		this function to display the loaded resource (eventually,
					 *		in edit mode); the first phase is a popstate, and will be
					 *		matched by the following "switch"; in the second phase we
					 *		STILL have to avoid forgetting the cursor's position, and
					 *		we do that by knowing the popstate handler would transmit
					 *		pairs.restore to the "onload" handler;
					 *
					 *	      - pairs.leavingEditMode is set under the same conditions as
					 *		of deleting this page's memory for the cursor's position:
					 *		it's a short-range flag that prevents the subsequent code
					 *		from recording it again; we could do without this flag by
					 *		moving the subsequent if block before this block, but I'd
					 *		like to have the flag highlight this relationship
					 */

					switch (evnt && evnt.type) {

						case 'popstate':

							break

						default:

							edit && (pairs.reentry || pairs.restore || (delete (nav.scstHistory [nav.pu])))
							edit && (pairs.reentry || pairs.restore || (pairs.leavingEditMode = (true)))

					} // delete memory of cursor position only if not responding to popstates

			} // preprocess mutator requests (prevents text cursor misplacement on error)

			/*
			 *	here we record scroll and cursor position history for the present URI
			 *	before switching to another: we record the current positions for this
			 *	URI (that we're about to leave behind), unless this is a dynamic, XHR
			 *	load, which takes place in two steps and where the second step refers
			 *	to the same exact resource URL but AFTER the state was altered
			 *
			 *	      - also, certain infrastructure paths are not supposed to record
			 *		scroll and cursor position history because we prefer these to
			 *		always present themselves "fresh" to users to avoid confusing
			 *		behavior (e.g. the sign-up form, the change-password form...)
			 */

			if (undefed (nav.startsFresh [nav.pu]))

				(pairs.found) || (pairs.tried) || (pairs.leavingEditMode) || (nav.scstHistory [nav.pu] = [ tio.pt, tio.cp.c, tio.cp.j ].join (slash))

			/*
			 *	page state reset
			 */

			if (be.switch (pairs.append).or (false) == false) {

				// clear all UI timeouts

				clearTimeout  (nav.t0)
				clearTimeout  (nav.t1)
				clearTimeout  (nav.t2)
				clearTimeout  (nav.t3)
				clearTimeout  (nav.t4)

				// stop polling events, clear all markers

				nav.ep.clear ()
				nav.clearMarkers ()

				// reset specific event handlers to default, reset TIO highlights

				tio.oncommand = idler
				tio.onchanges = idler
				nav.ontcfocus = nav.tcfocus.bind ({ showTip: true })
				tio.hPatterns = cui.hPatterns.pages

				// clear CUI dialogs and overlays

				cui.clear ()
				cui.shush ()
				pad_mask.onclick ({ event: 'none' })

				// clear cosmetics

				cui.clipStart = '<tt>--</tt>'
				ovs.style.zIndex = 3
				ovs.innerHTML = empty
				tio.setCursorState ({ state: 'hide' })
				cml.style.display = cmr.style.display = 'none'

				// reset CUI: no console, cosmetic post-processor on, hide markup

				nav.st.pp_status.muted = false
				nav.st.pp_status.endch = nav.st.pp_status.em = blank

				// clear permapaths that were set navigating the reports registry

				nav.st.permapaths = new Object

				// reset shared NAV state

				nav.bs = false
				nav.cm = false
				nav.ih = false
				nav.ku = slash
				nav.tu = slash
				nav.hp = false
				nav.ht = empty
				nav.mc = false
				nav.ns = false
				nav.pt = empty
				nav.rp = false
				nav.so = be.string (pairs.sort).or ('reverse')
				nav.sz = 38835
				t_talk = index

				// reset news counters

				nav.cs.announcements = 0
				nav.cs.reps = 0
				nav.cs.pages = 0
				nav.cs.images = 0
				nav.cs.authors = 0
				nav.cs.products = 0
				nav.cs.longtalks = 0
				nav.cs.chiacchere = 0
				nav.cs.jabberwocks = 0
				nav.cs.mascellodons = 0
				nav.cs.notifications = 0
				nav.cs.annunciamocene = 0

				nav.cs.clear_news = false
				nav.cs.highlights = false

				// reset internal NAV state

				nav.fp = false
				nav.ip = false
				nav.kp = false
				nav.jw = false
				nav.nf = false
				nav.rf = false

				nav.ar = {

					cp: false,	// can post
					op: false	// sys op

				}

				nav.dl = new Array
				nav.kc = be.number (pairs.cursor).or (0)
				nav.nc = 0
				nav.nd = new Object
				nav.ri = null
				nav.dr = null

				// reset TIO state: no auto-indent, basic indent (blockquote) is 2

				tio.ai = 0
				tio.bi = 2
				tio.cm = false
				tio.ot = avoid

				// reset pag element behavior to norm, specially after array entry

				scn.style.height = pag.style.height = nav.ph = '100vh'
				pag.style.overflowY = 'scroll'

				pag.style.transition = nav.is ? 'height .5s' : 'none'
				txt.style.background = nav.is ? 'rgba(0,0,0,.8)' : 'none'
				txt.style.backgroundImage = nav.is ? empty : notebooks [cui.theme ().name] || empty
				txt.style.backgroundSize = cui.theme ().name in notebooks ? 'auto' + blank + (9 * tio.ch).toFixed (0) + 'px' : empty

				// reset array menu, assume we'll no longer be configuring a model

				if (nav.is) {

					pairs.instant = true	// in The Array, disable animation

					tio.mb = nav.mb = nav.cb = (nav.array.instance ? nav.ib : nav.ab) + nline

					if (nav.st.mc.active)

						tio.onpgfocus.call ()

				}

				// hide "the array" if we're not switching to the homepage entries

				switch (nav.is || resource) {

					case 'sys/welcome/page':
					case 'sys/welcome/back':

						if (nav.st.rc) {

							switch (nav.st.intro) {

								case 'painted':
								case 'stopped':

									nav.st.rc.orient ({ pitch: 12.26, yaw: -44.888, roll: 0 })
									break

								default:

									nav.st.rc.orient ({ pitch: 0, yaw: 0, roll: 0 })

							}

							nav.st.live.cp = 400
							nav.st.live.ft = null

							nav.t4 = cui.going ? setTimeout (ray.start, 111) : null

						} // on homing, reset intro state to initial state

						if (nav.t5) {

							cruiser.style.opacity = 0

							nav.st.live.vx = 0
							nav.st.live.vy = 0
							nav.st.live.vz = 0
							nav.st.live.qv = 0

							clearInterval (nav.t5, nav.t5 = null)
							clearInterval (nav.t6, nav.t6 = null)

							nav.t7 && clearTimeout (nav.t7, cruiser.style.opacity = 0)

						} // on homing, break out of quicktripping

					case true:

						if (tio.keyboardHooked === false) {

							nav.array.pd || nav.array.togglePanels.call ()
							document.onkeydown = null
							tio.connectKeyboard (true)

						} // reconnect keyboard if needed (from array nav)

						break

					default:

						nav.array.hide ()

				}

				// save the ignorelist if modified

				switch (nav.io || nav.pu) {

					case 'sys/account/settings':

						generics = nav.clipText ().replace (/([\n\s\,\;]{2,})/g, nline).replace (/(\w)\x20(\w)/g, function (m, s, t) { return s + score + t }).replace (/^\s+|\s+$/, empty)

						generics === nav.ig || new Requester ().post ({

							uri: '/exec/ignoreList',

							pairs: [

								{ name: 'username', value: nav.username () },
								{ name: 'identity', value: nav.identity () },
								{ name: 'ignoring', value: generics }

							],

							onload: function (r) {

								nav.ii = new Object
								nav.il = r.response.split (nline)

								for (let name of nav.il)

									nav.ii [name] = true

								nav.ig = r.response

							} // update list as validated by the server

						}) // save ignored users list when changes detected

				}

				// load modality-specific defaults

				switch (modality) {

					case 'full':
					case 'fune':

						break				// keep slideshow mode

					case 'edit':

						nav.mc = true			// back goes to nav.pu

					case 'post':

						nav.st.pp_status.endch = null	// show cosmetic mark-up

					default:

						nav.ss (false)			// exit slideshow mode

				}

				// set global state for edit mode and modified entry flag

				window.edit.className = edit ? 'on' : empty
				window.mody.className = mody ? 'on' : empty

				// revert console-mode behavior

				switch (nav.pu) {

					case 'sys/ops/console':
					case 'sys/rita':

						Shortcut.remove ('escape')
						pairs.keepMode || nav.rh.call ({ set: nav.st.ps = nav.st.ks = nav.st.ds, and: tio.nc = 60, where: tio.cm = false })

				}

			} // page state reset

			/*
			 *	process system nodes:
			 *	generics
			 */

			switch (resource) {

				case 'sys/server/message':

					pairs.response || (pairs.response = t_no_response)
					break

				case 'sys/welcome/page':

					nav.id && (resource = path = 'sys/welcome/back')
					nav.fp = true
					break

				case 'sys/blog/index':	// from page path

					resource = path = nav.thatUser ()
					break

				case 'sys/visit/blog':	// from profiles

					resource = path = rc (nav.thisUser ())
					break

				case 'sys/your/stuff':	// from anywhere

					resource = path = rc (nav.username ())
					break

				case 'sys/your/profile':

					resource = path = t_profiles + rc (nav.username ())
					break

				case t_monthly_link:

					nav.hp = t_everlonglink
					pairs.topLabel = t_everlongtalk
					pairs.leadLink = blank + index + blank + t_current
					break

				default:

					if (resource.startsWith ('sys/search/')) {

						pushback = Array ()
						generics = resource.split (slash).slice (2).map ((w) => { w && pushback.push (w) })
						nav.ls.r = pushback.shift () || null
						nav.ls.q = pushback.join (slash) || null
						nav.ls.x = RegExp ('\\b(' + pushback.join (vertb).toUpperCase () + ')\\b', 'gi')

						switch (nav.ls.q && nav.ls.r) {

							case 'every':

								nav.ls.r = be.string (pairs.response && pairs.response.realm).or (nav.ls.r)

							case 'chats':
							case 'note':
							case 'notes':
							case 'pages':
							case 'pagine':

								if (undefed (pairs.response)) {

									nav.find (nav.ls.r, nav.ls.q)
									return

								} // no response => search now

								tio.onchanges = function () {

								    let realm = nav.pick (t_realm).toLowerCase ()

									realm === nav.ls.r && ModalTimeout.clr ({ id: 'sm' })
									realm === nav.ls.r || ModalTimeout.set ({ id: 'sm', msecs: 500, handler: nav.find.bind ({ realm: nav.ls.r = realm, query: nav.ls.q }) })

								} // reacts to instant changes to search scope (simplifies keyboard-driven navigation)

								tio.hPatterns = cui.hPatterns.notes

								resource = String ('sys/search/') + nav.ls.r
								pairs.path = resource + slash + nav.ls.q
								pairs.cdr = empty

								for (let match of pairs.response.results)

									pairs.cdr += nline + String ('L') + field + match.path
										  +  nline + indenting (match.text.replace (/^[_\*\/]/, empty), 2)
										  +  nline + block + signature (match.auth, tio.nc - 4, minus, author) + nline

						} // no domain or query => "expired operation"

					} // process search queries

			} // generics

			/*
			 *	process system nodes:
			 *	generic chat nodes, brought to current month if not specified,
			 *	for the rest implying these resources are considered arbitrary
			 *	page loads - not really sys resident nodes
			 */

			switch (generics = resource.split (slash).slice (0, 2).join (slash)) {

				case 'sys/everlongtalk':
				case 'sys/chiaccheratona':

					if (generics === resource)

						resource = path = (resource) + slash + [

							pairs.jan || t_january,
							pairs.feb || t_february,
							pairs.mar || t_march,
							pairs.apr || t_april,
							pairs.may || t_may,
							pairs.jun || t_june,
							pairs.jul || t_july,
							pairs.aug || t_august,
							pairs.sep || t_september,
							pairs.oct || t_october,
							pairs.nov || t_november,
							pairs.dec || t_december

						] [new Date ().getUTCMonth ()] + '~note'

					kind = (blank)

					break

				default:

					switch (resource) {

						case 'sys/the/jabberwock':
						case 'sys/il/mascellodonte':

						    let mod = be.vector (modality.match (/\[(\d+\;\w+)\]$/)).or ([ empty ]).pop ()
						    let page = parseInt (mod.split (semic).shift ())

							isNaN (page) || (pairs.jwCursor = (37 * page).toString ())
							isNaN (page) || (pairs.jabIndex = (37 * page - 37).toString ())
							isNaN (page) && (pairs.leadLink = blank + index + blank + t_past_page)

							isNaN (page) || (pairs.nps = 'chats')
							isNaN (page) || (pairs.leadLink = blank + index + blank + t_go_to_chat)
							isNaN (page) || (text = be.string ($('sys_chat_frozen').innerText, dump = true).or (empty))

							// invariants: nav.bs, nav.kc enable theme select; nav.jw drives rendering

							pairs.topLabel = t_jabberwock

							tio.ai = 2
							tio.bi = 0

							nav.ns = nav.bs = nav.kc = nav.jw = true
							nav.so = String ('not-sorting')
							nav.hp = resource
							nav.sz = 999

							cui.clipStart = empty
							nav.st.pp_status.em = '!'

							// detect pending post to this URL, if any

							postpend = be.string (localStorage.note).or (empty).match (/\S/)
								&& be.string (localStorage.addr).or (empty) === resource

							if (postpend) {

								  setTimeout (tio.kbFunctions.ro_ctrlEnd, 999)
								  tio.ai = localStorage.note.startsWith ('/ME' + blank) ? Math.max (0, nav.username ().length) : 2

							}

							// configure TIO highlight patterns to point at a subset of the pages' one

							tio.hPatterns = cui.hPatterns.notes

							// configure TIO to handle pending posts, or set up a "talking about" form

							tio.onchanges = nav.changes.bind ({

								target: 	String ('note'),
								postpend:	postpend,
								returns_to:	resource,
								easyRetype:	postpend ? false : true

							})

							// reset compact note rendering state: needed by paged chats (jabberwocks)

							rendering ({ reset: true })

							// configure initial entry line: either something pending, or instructions

							pairs.pph = postpend ? localStorage.note : t_add_phrase

					}

			} // chat nodes

			/*
			 *	process system nodes:
			 *	account registration, management, login, opt-out
			 */

			switch (resource) {

				case 'sys/join/now':

					if (nav.id) {

						resource = path = 'ow/already/signed/in'
						pairs.username = tb (nav.username ())
						break

					}

					arranges = 'join'
					break

				case 'sys/username/forbidden':

					pairs.username = pairs.username || t_forgotten
					break

				case 'sys/account/creation':

					if (nav.ps.pp === false)

						break // to display expired operation report

				case 'sys/username/available':

					pairs.bio = be.string (sessionStorage.bio).or (empty)
					pairs.path = 'sys/account/creation'
					pairs.topLabel = t_available

					nav.bb = {				//
										//
						iter:	4,			//
						going:	false,			//	setup beat bundle,
						happy:	true,			//	set passport flag
						report: new Requester ()	//
										//
					};	nav.ps.pp = true		//

					cui.sm = 0				//	reset "scroll maximum"
					nav.pb = nav.ppBeat.bind (nav.bb)	//	create beat closure
					nav.t2 = setTimeout (nav.pb, 500)	//	start beat timer

					tio.ai = 2				//	set TIO to auto-indent
					tio.bi = 0				//	no physical indent
					nav.sz = 99				//	await 99 chars.

					tio.oncsrmove = function () {

						if (nav.bb.going) {

							nav.bb.iter = 0
							nav.bb.happy = true
							sessionStorage.bio = nav.clipText ()

						}

					} // reset beat iteration after any cursor move (trigger captcha report to server)

					resource = 'sys/username/available'	//	revert from 'sys/account/creation'
					arranges = 'port'			//	configure labels for passport page

					break

				case 'sys/create/my/account':

					pairs.path = 'sys/account/creation'	// pass to cover-up path to catch popstate

				case 'sys/sign/up/or/log/in':

					username = tf (nav.grab (t_username) || be.string (sessionStorage.cr).or ('%`%').split (arrow) [0])
					password = tf (nav.grab (t_password) || be.string (sessionStorage.cr).or ('%`%').split (arrow) [1])
					usrFacts = nav.getFacts ()

					if (username.length === 0)

						return (nav.to (null, 'ow/username/not/given'))

					if (password.length <= 11)

						return (nav.to (null, 'ow/password/too/short'))

					if (username.length >= 33)

						return (nav.to (null, 'ow/username/too/long'))

					if (password.length >= 33)

						return (nav.to (null, 'ow/password/too/long'))

					if (/[a-z\W]/.test (username + password))

						return (nav.to (null, 'ow/invalid/characters'))

					new Requester ({ notes: { passport: nav.clipText () }}).post ({

						uri: '/exec/signUp',

						pairs: [

							{ name: 'username', value: username },
							{ name: 'password', value: password },
							{ name: 'usrFacts', value: usrFacts },
							{ name: 'passport', value: nav.clipText () },
							{ name: 'identity', value: nav.identity () }

						],

						onwhoa: function (r) {

							switch (r.response) {

								case 'USERNAME NOT FOUND':

									return (nav.to (null, 'sys/username/available', { given: sessionStorage.cr = tb (this.username) + arrow + tb (this.password) }))

							}

							switch (r.status) {

								case 451:

									return (nav.to (null, 'sys/username/forbidden', { username: this.username }))

							}

							nav.to (null, 'sys/server/message', { path: 'sys/login/failure', response: nav.de_hint (r.response) })

						}.bind ({ username: username, password: password }),

						onload: function (r) {

						    let t = this
						    let p_address = be.string (localStorage.addr).or (empty)

							localStorage.username = t.username
							localStorage.identity = r.response.split (semic).shift ()

							nav.id = true
							nav.ig = r.response.split (semic).pop ()

							nav.ii = new Object
							nav.il = nav.ig.split (nline)

							for (let name of nav.il)

								nav.ii [name] = true

							if (r.notes.passport.length === 0) {

								p_address && nav.to (false, localStorage.addr)
								p_address || nav.to (null, 'sys/welcome/page')

								if (p_address)

									be.string (localStorage.note).or (empty).match (/\S/) || (localStorage.removeItem ('addr'))

								return

							} // done with the login - land to welcome page or the pending note's page

							p_address && nav.to (null, 'sys/comment/bouncer', {

								path:	       'sys/account/creation',
								topLabel:	t_welc_aboard,
								username:	tb (t.username),
								password:	tb (t.password),
								return_address: rc (localStorage.addr)

							}) // done with account registration - AND you have a pending note to land

							p_address || nav.to (null, 'sys/account/created', {

								path:	       'sys/account/creation',
								topLabel:	t_welc_aboard,
								username:	tb (t.username),
								password:	tb (t.password)

							}) // done with account registration - though with no pending note to land

							sessionStorage.removeItem ('cr')		// clear credentials
							sessionStorage.removeItem ('bio')		// clear passport bio

						}.bind ({ username: username, password: password })

					})

					break

				case 'sys/sign/out':

					new Requester ().post ({

						uri: '/exec/signOut',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () }

						],

						onwhoa: function (r) { nav.to (null, 'sys/server/message', { response: nav.de_hint (r.response), path: 'sys/sign/out/error' }) },
						onload: function (r) { nav.to (null, 'sys/sign/out/confirm', { whence: nav.id = false, and: [ nav.ig = empty, nav.il = avoid, nav.ii = clear ] }) }

					})

					break

				case 'sys/change/my/password':

					new Requester ({ notes: { new_pass: tf (nav.grab (t_new_password)) } }).post ({

						uri: '/exec/chPass',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () },
							{ name: 'old_pass', value: tf (nav.grab (t_old_password)) },
							{ name: 'new_pass', value: tf (nav.grab (t_new_password)) }

						],

						onwhoa: function (r) { nav.to (null, 'sys/server/message', { path: 'sys/password/change/error', response: nav.de_hint (r.response) }) },
						onload: function (r) { nav.to (null, 'sys/password/changed', { path: 'sys/ok/password/changed', username: tb (nav.username ()), password: tb (r.notes.new_pass) }) }

					})

					break

				case 'sys/revert/to/default':

					pairs.homebase = '4792.4792'
					pairs.reverting = true

				case 'sys/select/home/areal':

					new Requester ({

						notes: {

							areacode: pairs.homebase || nav.grab ('AREACODE'),
							homebase: pairs.reverting ? null : pairs.homebase || nav.grab ('AREACODE')

						}

					}).post ({

						uri: '/exec/setHomeAreal',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () },
							{ name: 'homebase', value: pairs.homebase || nav.grab ('AREACODE') }

						],

						onwhoa: function (r) { nav.to (null, 'sys/server/message', { path: 'sys/areal/selection/error', response: nav.de_hint (r.response) }) },
						onload: function (r) { nav.to (null, 'sys/homebase/changed', { path: 'sys/ok/homebase/changed', homebase: r.notes.areacode, and: nav.hb = r.notes.homebase }) }

					})

					break

				case 'sys/de_le_te/my/account_':
				case 'sys/de_le_te/user/account_':

					new Requester ({ notes: { username: tf (nav.grab (t_username)) } }).post ({

						uri: '/exec/leave',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () },
							{ name: 'target_n', value: tf (nav.grab (t_username)) },
							{ name: 'password', value: tf (nav.grab (t_password)) }

						],

						onwhoa: function (r) { nav.to (null, 'sys/server/message', { path: 'sys/account/delete/error', response: nav.de_hint (r.response) }) },
						onload: function (r) { nav.to (null, 'sys/account/erased', { path: 'sys/user/account/deleted', there_by: nav.id = nav.username () !== r.notes.username }) }

					}) // when an account is successfully deleted, the user's login status is cleared only if this was the same user that's been deleted (other cases are by sysop request)

			} // account registration, management, login, opt-out

			/*
			 *	process system nodes:
			 *	authors blog homepage management
			 */

			switch (resource) {

				case 'sys/apply/headings':

					new Requester ().post ({

						uri: '/exec/writeHome',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () },
							{ name: 'target_n', value: nav.thisUser () },
							{ name: 'homepage', value: nav.grab (t_h0) },
							{ name: 'share_me', value: nav.grab (t_h1) },
							{ name: 'index_to', value: nav.grab (t_h2) },
							{ name: 'visit_me', value: nav.grab (t_h3) }

						],

						onload: function (r) { nav.to (null, '' + this.pp, { interstitial: true, where: localStorage.removeItem (this.pp) }) }.bind ({ pp: hash }),
						onwhoa: function (r) { nav.to (null, 'sys/server/message', { path: 'sys/trouble/with/heading', response: nav.de_hint (r.response), reentry: true }) }

					}) // note: the homepage field is held following an empty key

					break

				case 'sys/drop/home/cover/picture':

					new Requester ().post ({

						uri: '/exec/dropCover',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () },
							{ name: 'target_n', value: nav.thisUser () }

						],

						onload: function (r) { nav.to (null, null, { interstitial: true }) },
						onwhoa: function (r) { nav.to (null, 'sys/server/message', { path: 'sys/cannot/drop/home/cover', response: nav.de_hint (r.response) }) }

					}) // note: the corresponding load operation is on file input

			} // authors blog homepage management

			/*
			 *	process system nodes:
			 *	authors content management
			 */

			switch (resource) {

				case 'sys/typing/something':

					pairs.collection = be.string (pairs.collection).or (empty)

					new Requester ({ notes: { collection: pairs.collection }}).post ({

						uri: '/exec/typeSomething',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () }

						],

						onload: function (r) { nav.to (null, 'sys/write/new/page', { response: r.response, collection: r.notes.collection }) },
						onwhoa: function (r) { nav.to (null, 'sys/server/message', { response: nav.de_hint (r.response), path: 'sys/cannot/type' }) }

					}) // note: the request gets collection titles (autocomplete)

					break

				case 'sys/write/new/page':

					// show margins, tell postprocessor to render mark-up visible

					cml.style.display = cmr.style.display = 'block'
					nav.st.pp_status.endch = null

					// send the lead link to the help page, via interstitial call

					nav.hp = String ('sys/how/to')
					nav.ih = true

					// show the lead link to the help page

					pairs.topLabel = t_need_help
					pairs.leadLink = blank + index + blank + t_help_page

					// pairs.response holds the list of existing collections that
					// we need to implement autocomplete, in TIO field at line #6

					if (pairs.response) {

						try {

							pairs.response = JSON.parse (pairs.response)
							pairs.response = pairs.response.collections.split (comma).sort ().reverse ()

						} catch (e) { pairs.response = new Array }

						for (generics in pairs.response)

							pairs.response [generics] = tb (pairs.response [generics])

						auto = { 6: pairs.response }

					} // we SHOULD have pairs.response, except via popstates here

					// if there is a sessionStorage entry filed under "sys/write/
					// new/page", it represents a page that was being written, or
					// set up in terms of options, but which was NOT yet sent to,
					// or accepted by, the server; in these cases we restore that
					// version to save the user the major hassle of having to re-
					// type or setup everything again: this is done by overriding
					// the entire "new page" template with the saved version (and
					// that's why the template shouldn't be changed in functional
					// terms, in production times)

					if (localStorage ['sys/write/new/page']) {

						text = localStorage ['sys/write/new/page']
						dump = true

					}

					// tio.onchanges will be otherwise called to query/manipulate
					// the state of its bound ("this") object, but that's for all
					// regular pages only: the "new page" works independently but
					// needs to be kept compatible with such calls, where the new
					// page entry must not be set to the entry "text" argument...

					tio.onchanges = function (text) {

						be.string (text).or (false) && (localStorage ['sys/write/new/page'] = text)

					}

					break

				case 'sys/how/to':

					// send the lead link back to the "new page" template request

					nav.hp = String ('sys/type/something')
					nav.ih = true

					// show the lead link as something that brings back to typing

					pairs.topLabel = t_help_intro
					pairs.leadLink = blank + index + blank + t_back_typing

					break

				case 'sys/drop/this/page':

					// after creating the trashcan entry, proceeding to wipeout
					// while eventually landing to the next page in slide show:
					// if we may be in the process of deleting the entire slide
					// show, that'll ease things up...

					localKey = localKey || hash
					manouver = manouver || String ('WIPEOUT')

					if (nav.thatUser () == nav.username ().toLowerCase ()) {

						lands_to = lands_to || nav.np || String ('sys/your/trash/can')
						localStorage ['@/' + hash] = tio.it.substr (tio.mb.length).replace (/PICT\x20\`\`[^\n]+/, empty).split ('N' + field).shift () + t_restore_page

					}  else lands_to = lands_to || nav.np || String ('sys/entry/expunged')

				case 'sys/save/changes':

					// the landing page for corrections will be this same page,
					// though it may change path if it's retitled or moved to a
					// different collection; additionally, corrections (edits),
					// may be performed by sysops to redact a part of the page,
					// hence the need to refer to "nav.thatUser" from the path,
					// rather than assuming it is filed under this same user...

					localKey = localKey || hash
					manouver = manouver || String ('CORRECT')
					lands_to = lands_to || nav.thatUser () + slash + rc (tf (nav.grab (t_collection))) + slash + rc (tf (nav.grab (t_page_title)))

				case 'sys/restore/page':

					// restoring pages from your trash can is basically handled
					// as a kind of re-publication, except the localKey to wipe
					// from localStorage as a pending entry is that of the page
					// we are restoring, not the one under "sys/write/new/page"

					localKey = localKey || hash

				case 'sys/publish':

					// so, this handles all kinds of publications, editings and
					// deletions of pages: if what's being done is deletion, or
					// if the page in question is going to change path (because
					// it's retitled or moved to a different collection), we'll
					// want to track the current entry in the "popstate object"
					// and bypass navigation back to the said entry by means of
					// the browser's "back" button or by our mirror back arrow:
					// this is done by taking the ID in the popstate object and
					// flagging it in the dictionary of voided entries (ps.ve),
					// when manouver is "WIPEOUT" on entry or in consequence of
					// comparing the old and new paths (finding them different)

					manouver = manouver || String ('PUBLISH')
					localKey = localKey || String ('sys/write/new/page')
					lands_to = lands_to || rc (nav.username ()) + slash + rc (tf (nav.grab (t_collection))) + slash + rc (tf (nav.grab (t_page_title)))
					generics = lands_to == rc (nav.thisPage ())

					new Requester ({ notes: { mnvr: generics ? manouver : 'WIPEOUT', i: nav.ps.id, k: localKey, landing: lands_to } }).post ({

						uri: '/exec/publish',
						encrypt: true,

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () },
							{ name: 'manouver', value: manouver },
							{ name: 'manifest', value: nav.pick (t_visibility) },
							{ name: 'comments', value: nav.pick (t_discussion) },
							{ name: 'np_title', value: nav.grab (t_page_title) },
							{ name: 'np_group', value: nav.grab (t_collection) },
							{ name: 'filename', value: nav.grab (t_serve_file) },
							{ name: 'old_page', value: nav.thisPage () },
							{ name: 'new_page', value: nav.clipText (), encrypt: 1 }

						],

						onwhoa: function (r) { nav.to (0, 'sys/server/message', { path: 'sys/page/operation/error', response: nav.de_hint (r.response), reentry: true }) },
						onload: function (r) { nav.to (0, `${r.notes.landing}`, { also: 'WIPEOUT' == r.notes.mnvr ? nav.ps.ve [r.notes.i] = 1 : (null), as: localStorage.removeItem (r.notes.k) }) }

					}) // yy-yeh... that was a little convoluted, lots of cases

					break

				case 'sys/drop/page/cover/picture':

					new Requester ().post ({

						uri: '/exec/dropImage',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () },
							{ name: 'target_p', value: nav.thisPage () }

						],

						onload: function (r) { nav.to (null, null, { interstitial: true }) },
						onwhoa: function (r) { nav.to (null, 'sys/server/message', { path: 'sys/cannot/drop/cover/picture', response: nav.de_hint (r.response) }) }

					}) // note: the corresponding load operation is on file input

					break

				case 'sys/drop/package/attachment':

					new Requester ().post ({

						uri: '/exec/dropPack',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () },
							{ name: 'target_p', value: nav.thisPage () }

						],

						onload: function (r) { nav.to (null, null, { interstitial: true }) },
						onwhoa: function (r) { nav.to (null, 'sys/server/message', { path: 'sys/cannot/drop/package', response: nav.de_hint (r.response) }) }

					}) // note: the corresponding load operation is on file input

					break

				case 'sys/flip/page/cover/picture':

					new Requester ({ notes: { land_to: hash }}).post ({

						uri: '/exec/flipPictureFrame',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () },
							{ name: 'target_p', value: nav.thisPage () }

						],

						onload: function (r) { nav.to (null, '' + r.notes.land_to, { instant: true, interstitial: true }) },
						onwhoa: function (r) { nav.to (null, 'sys/server/message', { path: 'sys/error/flipping/picture/frame', response: nav.de_hint (r.response) }) }

					})

					break

				case 'sys/void/the/trash/can':

					// it's probably not a good idea to remove items while having
					// an iterator go through them, so let's "double buffer" this

					v0id = new Object

					for (pagePath in localStorage)

						if (pagePath [0] === '@')

							v0id [pagePath] = true		// collect...

					for (pagePath in v0id)

						localStorage.removeItem (pagePath)	// and delete

					// well, after voiding the trash can, we probably want to see
					// the resulting void trash can, hence we fall down to...

				case 'sys/your/trash/can':

					for (pagePath in localStorage)

						if (pagePath [0] === '@')

							text = (text || t_corner + t_your_trashcan + frame) + nline + 'L' + field + rc (pagePath)

					if (text === false) {

						v0id = true
						text = t_corner + t_trashcan_void

					}

					text = text + dline + be.string ($('sys_trashcanTail').innerText).or (empty).replace (/^\n+|\s+$/g, empty)
					text = text + (v0id ? empty : dline + t_void_trashcan)

			} // authors content management

			/*
			 *	process system nodes:
			 *	authors profile management
			 *
			 *	      - system information pages (help pages, etc) are also managed
			 *		here, because they're basically profiles of usernames which
			 *		cannot be registered
			 */

			switch (resource) {

				case 'sys/save/info/page':
				case 'sys/save/profile':

					new Requester ().post ({

						uri: '/exec/writeAbout',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () },
							{ name: 'target_n', value: nav.thisUser () },
							{ name: 'about_me', value: nav.clipText () }

						],

						onload: function (r) { nav.to (null, '' + this.pp, { interstitial: true, where: localStorage.removeItem (this.pp) }) }.bind ({ pp: hash }),
						onwhoa: function (r) { nav.to (null, 'sys/server/message', { path: 'sys/error/saving/profile', response: nav.de_hint (r.response), reentry: true }) }

					})

					break

				case 'sys/flip/profile/picture':

					new Requester ().post ({

						uri: '/exec/flipPhotoFrame',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () },
							{ name: 'target_n', value: nav.thisUser () }

						],

						onload: function (r) { nav.to (null, null, { instant: true, interstitial: true }) },
						onwhoa: function (r) { nav.to (null, 'sys/server/message', { path: 'sys/error/flipping/picture/frame', response: nav.de_hint (r.response) }) }

					})

					break

				case 'sys/drop/profile/picture':

					new Requester ().post ({

						uri: '/exec/dropPhoto',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () },
							{ name: 'target_n', value: nav.thisUser () }

						],

						onload: function (r) { nav.to (null, null, { interstitial: true }) },
						onwhoa: function (r) { nav.to (null, 'sys/server/message', { path: 'sys/error/dropping/profile/picture', response: nav.de_hint (r.response) }) }

					}) // note: the corresponding load operation is on file input

			} // authors profile management

			/*
			 *	process system nodes:
			 *	R.I.T.A chatbot entry point
			 */

			switch (resource) {

				case 'sys/rita':

					nav.cm = true			// prevents "help bar" from turning on again
					tio.cm = true			// changes the TIO behavior of the Enter key
					cui.hover = true		// forces CUI to believe the help bar was on
					cui.helps (false, true) 	// hides the "help bar", and instantaneously
					cui.restyle (FORCE = 'CGA')	// temporarily forces "CGA" phosphoric theme

					nav.rh.call ({ userChoice: true, set: tio.nc = 80 })

					new Requester ().post ({

						uri: '/exec/rita',

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () }

						],

						onload: function (r) {

							nav.to_TIO ({

								popKeyboard: true,
								writeAccess: true

							})				// the sole case where write access is on

							try { r.response = JSON.parse (r.response) }

								catch (e) { r = { response: { text: t_malf_response } } }

							tio.cls ().scrollTo (0, true).type ({

								text: nline + r.response.text.toUpperCase (),

								oncompletion: function () {

									tio.down ().oncommand = nav.onchat
									tio.noLineOverflow = true

									nav.ep.setup ({

										channel: String ('R.I.T.A'),
										lastRow: r.response.cursor,
										timeout: 3000,
										t_slice: 1000,

										handler: function (response) {

											for (let row of response.rows)

												tio.down ().type ({ text: row.toUpperCase () + nline, cps: 10, lim: 0, oncompletion: (tio.down) })

										} // R.I.T.A channel handler

									}) // R.I.T.A channel set-up

								},

								cps: 20, lim: 0,
								and: nav.st.pp_status.muted = true

							})

							tio.setCursorState ({ state: 'show' })
							nav.cc (r.response.name || null, r.response.capt || null)

						},

						onwhoa: function (r) {

							nav.ps.ve [nav.ps.id] = nav.ps.ve [nav.ps.id - 1] = 1
							nav.to (null, 'sys/server/message', { path: 'sys/rita', response: nav.de_hint (r.response) })

						}

					})

					Shortcut.add ('escape', (e) => { history.go (-1) })

			} // R.I.T.A entry point

			/*
			 *	process system nodes:
			 *	sys ops-reserved
			 */

			switch (resource) {

				case 'sys/ops/reports/registry':

					pairs.topLabel = t_repreg
					tio.hPatterns = cui.hPatterns.notes
					nav.cc ('ops', 'reported illicits')

				case 'sys/ops/console':

					nav.cm = true			// prevents "help bar" from turning on again
					tio.cm = true			// changes the TIO behavior of the Enter key
					cui.hover = true		// forces CUI to believe the help bar was on
					cui.helps (false, true) 	// hides the "help bar", and instantaneously

					new Requester ({ notes: { requested: resource } }).post ({

						uri: {

							'sys/ops/console' : '/exec/oc',
							'sys/ops/reports/registry' : '/exec/repreg'

						} [resource],

						pairs: [

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () }

						],

						onload: function (r) {

							switch (r.notes.requested) {

								case 'sys/ops/console':

									nav.to_TIO ({

										popKeyboard: true,
										writeAccess: true

									})				// the sole case where write access is on

									try { r.response = JSON.parse (r.response) }

										catch (e) { r = { response: { text: t_malf_response } } }

									tio.cls ().scrollTo (0, true).type ({

										text: r.response.text.toUpperCase () + nline,

										oncompletion: function () {

											tio.down ().oncommand = nav.oncommand
											nav.extras ({ resource: r.notes.requested, response: r.response.text, position: scst })

										},

										wps: 30,
										lim: 30,

										and: nav.st.pp_status.muted = true

									})

									pairs.keepMode || nav.rh.call ({

										userChoice: nav.fullScreenEngaged (),
										set: tio.nc = innerWidth > innerHeight ? 80 : 60,
										and: nav.st.ps = nav.st.ks = (nav.fullScreenEngaged () ? nav.st.ms : nav.st.ds)

									})

									Shortcut.add ('escape', (e) => { history.go (-1) })
									nav.cc (r.response.name || null, r.response.capt || null)

									return

								case 'sys/ops/reports/registry':

									try {

										r.response = JSON.parse (r.response)
										r.response.text = empty

									}

									catch (e) {

										nav.to (null, 'sys/server/message', { reponse: t_malf_response })
										return

									}

									clearTimeout (nav.t0)	// cancel timeout set on "authenticating" screen, keep cursor hidden if home

									nav.rf = true
									nav.ar.cp = true
									nav.ar.op = true

									if (r.response.entries)

										for (let id in r.response.entries) {

										    let page = be.string (r.response.entries [id]).or (false)
										    let note = be.object (r.response.entries [id]).or (false)

											if (page) {

											    let code = id.split (comma)
											    let path = code [0]
											    let hash = code [1]

											    let note = {

													id: score + path,
													nn: hash.substr (-55),
													nr: 0,
													path: path,
													body: page,
													auth: path.split (slash).shift (),
													is_a_page: true,
													isFlagged: true,
													bOperator: true,
													noReplies: true

												}

												nav.flagAtBottom = id
												r.response.text += rendering ({ note: note, indent: 0 }) + nline

											}

											if (note) {

												note.id = id
												note.isFlagged = note.noReplies = true
												note.report_by = author + blank + note.from

												nav.flagAtBottom = id
												r.response.text += rendering ({ note: note }) + nline

											}

										}

									r.response.more || (r.response.text += block + t_end_of_flags)
									r.response.more && (r.response.text += block + '-\nN' + field + t_more_flags)

									tio.cls (null, nav.cb).scrollTo (0, true).type ({

										text: nline + r.response.text,

										oncompletion: function () {

											tio.pag.scrollLeft = tio.pl = 0
											tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findVCi (home.colIndex, home.rowIndex)))
											nav.to_TIO ()
											nav.extras ({ resource: r.notes.requested, response: r.response.cursor, position: scst })

										},

										wps: 30,
										lim: 30

									})

									return

							}

						},

						onwhoa: function (r) {

							nav.ps.ve [nav.ps.id] = nav.ps.ve [nav.ps.id - 1] = 1
							nav.to (null, 'sys/server/message', { path: 'sys/ops/failed/authentication', response: nav.de_hint (r.response) })

						}

					})

					break

			} // sys ops-reserved nodes

			/*
			 *	rewrite paths and set up recovery
			 *	from trashcan entries
			 */

			if (resource [0] === '@')

				if (text = localStorage [resource]) {

					kind = String ('sys')
					scst = home.position
					dump = true
					cml.style.display = cmr.style.display = 'block'

				}

				else {

					kind = String ('sys')
					scst = home.position
					text = '\n`' + blank + t_corrupt_drop + dline + t_link_back

				}

			/*
			 *	in response to popstate (browser back/forward), the browser's history
			 *	is just fine as it is, otherwise (intentional load) we push the entry
			 *	into the browser's history, which is what the "default" block does
			 *
			 *	      - if the pairs object holds a "path" entry, we'll use that to
			 *		rewrite the path in the address bar, masking temporary paths;
			 *
			 *	      - if the resulting address bar is ultimately identical to the
			 *		current one (location.href), then we DON'T push another node
			 *		in the history, otherwise we'll keep accumulating replicas of
			 *		the same state whenever the user reloads the page (e.g. F5);
			 *
			 *	      - every time we push the node, we set its state to remark that
			 *		it's one of our pages, enabling the "back" arrow to mimic the
			 *		browser's "back" button except that it can check "nav.ps.op"
			 *		to detemine when to stop triggering backward moves, such that
			 *		users won't mistakenly get out of the whole site by hitting
			 *		that arrow past the very first page belonging to this site...
			 */

			switch (evnt && evnt.type) {

				case 'popstate':

					generics = nav.ps.id			// remember current ID, so we can determine direction of travel after re-loading the saved state into nav.ps
					void_ent = nav.ps.ve			// remember void entry roster as, in real popstates, the actual object content is always the most up-to-date

					if (evnt.state) {

						nav.ps = (evnt.state)

						nav.ps.ve = void_ent
						nav.ps.nx = nav.ps.hl < history.length

					}

					else

						nav.ps = {

							id: 1,			// no state means we're back to the page the visitor came through, which has index 1, by default
							hl: nav.ps.hl - 1,	// no state presumes this is a back move, so our history length index is implicitly the known one minus 1
							op: false,		// no state means we're back to the page the visitor came through, so the previous in history is NOT one of our own
							nx: true,		// no state while using this script means we're coming from one of our pages: the next in history IS one of our own
							pp: false,		// no state wipesout passport flag, as the first page COULD NOT have been "sys/account/creation": it's a cover path
							ve: nav.ps.ve		// no state inherits present values in the "ve" (void entries) object

						}

					if (nav.ps.id in nav.ps.ve)

						switch (nav.ps.id - generics) {

							case -1: return (history.go (-1)), false
							case +1: return (history.go (+1)), false

						} // by-pass voided entry (see /publish handler)

					scst = scst || nav.scstHistory [resource] || nav.scstStartUp [resource] || home.position

					pairs.instant = true
					pairs.restore = true

					if (nav.er) {

						pairs.doNotSkipTitles = true
						pairs.interstitial = true
						window.edit.className = 'on'
						window.mody.className = 'on'
						purePath = false
						modality = String ('edit')
						path = resource + (purePath ? empty : tilde + modality)

					} // set up edit-mode reentry (after errors)

					switch (nav.pu) {

						case 'sys/rita':

							tio.noLineOverflow = false
							cui.restyle (FORCE = false)

						case 'sys/ops/console':

							if (nav.is) {

								tio.onpickrun ({ label: t_exit })
								return (false)

							} // in The Array, exit TIO

							nav.cm || cui.helps (parseInt (scst.split (slash).shift ()) === 0)

					} // revert console-mode behavior (backstep)

					break

				default:

					pairs.restore || (scst = scst || pairs.scst || nav.scstStartUp [resource] || home.position)
					pairs.restore && (scst = scst || pairs.scst || nav.scstHistory [resource] || nav.scstStartUp [resource] || home.position)

					/*
					 *	warning:
					 *	the following do-while CAN be a do-while(false) and be made functional
					 *	in lack the last "break" statement, however, javascript minimizers may
					 *	consider the structure pointless and remove it, causing address bar to
					 *	fail to clear when the home page link is visited
					 */

					do {

						if (be.string (pairs.path).or (null) !== null) {

							pushback = location.origin + location.pathname.replace (/\/$/, empty) + '/#/' + pairs.path
							break

						} // we have a path we're forced to register this page in history with

						if (be.string (nav.pathRewrite [resource]).or (null) === 'home') {

							pushback = location.origin + location.pathname
							break

						} // we were told to register this resource under the void (home) path

						pushback = location.origin + location.pathname.replace (/\/$/, empty) + '/#/' + be.string (nav.pathRewrite [resource]).or (resource)

						switch (modality) {

							case 'full':

								break

							default:

								pushback = pushback + (purePath ? empty : tilde + modality)

						} // do NOT remember full-screen image mode in the address bar: it'd be confusing on return from talks

						break

					} while (true)

					if (be.switch (pairs.interstitial).or (false))

						break // interstitial requests

					if (be.switch (pairs.append).or (false))

						break // interstitial append

					if (nav.nterstitial [resource])

						break // interstitial paths

					if (pushback === location.href)

						break // same exact path

				     /* history.pushState (nav.ps = {

						id: nav.ps.id + 1,	// implicit move forward
						hl: nav.ps.hl + 1,	// implicit move forward
						op: true,		// previous page is one of our own
						nx: false,		// the next page is NOT one of our own (in fact, it doesn't exist yet)
						pp: nav.ps.pp,		// inherits passport flag set at "sys/username/available"
						ve: nav.ps.ve		// inherits void entries roster so far

					}, null, pushback) */		// insecure (valid online)

					for (let voidedID in nav.ps.ve)

						if (parseInt (voidedID) >= nav.ps.id)

							delete (nav.ps.ve [voidedID])	// invalidate "voidness" of a future history entry (happens when you go back, then navigate elsewhere)

			} // respond to popstate, manage navigation history

			/*
			 *	we're all set to load the requested page:
			 *	first things first, we'd take care of non-resident pages (which don't
			 *	come from hidden paragraphs in the home page DOM), that is, any pages
			 *	which URIs don't start by "ow/" (all errors) or "sys/" (system nodes)
			 */

			nav.pp = false
			nav.np = false

		to_dom: switch (kind || resource.split (slash).shift ()) {

				case 'sys':

					switch (resource) {

						case 'sys/announcements':

							pairs.topLabel = pairs.topLabel || t_new_proms

						case 'sys/new/pages':

							pairs.topLabel = pairs.topLabel || t_new_pages

						case 'sys/new/images':

							pairs.topLabel = pairs.topLabel || t_new_images

						case 'sys/new/authors':

							pairs.topLabel = pairs.topLabel || t_new_authors

						case 'sys/new/products':

							pairs.topLabel = pairs.topLabel || t_new_products

					     // default: // triggers a continuous loop of server requests, may come in handy to stress-test response time

							new Requester ().post ({

								uri: {

									'sys/announcements'	: '/exec/promsList',
									'sys/new/pages' 	: '/exec/pagesList',
									'sys/new/images'	: '/exec/pictsList',
									'sys/new/authors'	: '/exec/usersList',
									'sys/new/products'	: '/exec/packsList'

								} [resource],

								pairs: [

									{ name: 'username', value: nav.username () },
									{ name: 'identity', value: nav.identity () },
									{ name: 'idx_from', value: from = be.string (pairs.queryAfter).or (null) },
									{ name: 'idx_last', value: last }

								],

								onload: function (r) {

								    let table = r.response.split (nline)
								    let final = r.response.split (nline)
								    let stops = 7, lMargin = 5, Enum = 0, scrap = 0

									for (let entry of table) {

										if (entry.length == 0)

											break

										switch (this.resource) {

											case 'sys/announcements':	nav.promAtBottom = entry.split ('\t').shift (); break
											case 'sys/new/pages':		nav.pageAtBottom = entry.split ('\t').shift (); break
											case 'sys/new/products':	nav.packAtBottom = entry.split ('\t').shift (); break
											case 'sys/new/images':		nav.pictAtBottom = entry.split ('\t').shift ()

										}

										switch (this.resource) {

											case 'sys/new/authors':

											    var name = nav.userAtBottom = entry.split (aster).shift ()
											    var level = stops - ((lMargin + name.length) >> 3)
											    var indent = Array (level).join ('\t')

												if (name in nav.ii) {

													scrap ++
													continue

												}

												final [Enum ++] = '\nL' + field + entry.replace (/\*$/, indent + aster + blank + t_with_pic)
												break

											default:

											    var path = entry.split ('\t') [0]
											    var caption = entry.split ('\t') [1] || null

												if (caption)

													caption = elliptize ({ string: caption }).replace (/[\*\/_]/g, blank).trim ()

											    var title = path.split (slash).pop ()
											    var author = path.split (slash).shift ()
											    var level = stops - ((lMargin + (caption || title).length) >> 3)
											    var indent = Array (level).join ('\t')

												if (author in nav.ii) {

													scrap ++
													continue

												}

												caption && (final [Enum ++] = '\nL' + field + path + '{' + tf (caption) + '}' + indent + aster + blank + tb (author))
												caption || (final [Enum ++] = '\nL' + field + path + indent + aster + blank + tb (author))

												break

										}

									}

									final.length = Enum

									if (Enum === 0 && this.from)

										return cui.alert ({ argument: 'END OF LIST' })

									if (Enum + (scrap) === parseInt (last) + 1)

										final.push ('\n' + frame + 'N' + field + this.t_older)

									if (this.from) {

									    let end = tio.findCp (tio.ci = 100E7)

										tio.positionCursor (tio.cp = end)

										tio.type ({

											text: '\n' + final.join (empty),

											oncompletion: function () {

												tio.ci = tio.findVCi (end.i, end.j)
												tio.positionCursor.call ({ hold: true }, tio.cp = end).nextField ()
												nav.extras ({ resource: this.resource })

											}.bind (this),

											wps: 30,
											lim: 30

										})

										return

									} // extending list

									tio.cls (null, nav.cb).scrollTo (0, true).type ({

										text: final.join (empty),

										oncompletion: function () {

											tio.pag.scrollLeft = tio.pl = 0
											tio.positionCursor.call ({ hold: true }, tio.cp = tio.findCp (tio.ci = tio.findVCi (home.colIndex, home.rowIndex)))
											nav.to_TIO ()
											nav.cc (null, null)
											nav.extras ({ resource: this.resource })

										}.bind (this),

										wps: 30,
										lim: 30

									}) // first call

								}.bind ({

									t_older: {

										'sys/announcements'	: t_older_proms,
										'sys/new/pages' 	: t_older_pages,
										'sys/new/images'	: t_older_picts,
										'sys/new/authors'	: t_older_users,
										'sys/new/products'	: t_older_packs

									} [resource],

									from: from,
									resource: resource

								}),

								onwhoa: function (r) { nav.to (null, 'sys/server/message', { response: nav.de_hint (r.response) }) }

							}) // actual request for new entries' lists

							if (from === null) {

								tio.cls ().scrollTo (0, 1).type ({ text: '\n' })
								return (nav.pu = resource), tail (new Array (0))

							} // waiting screen state at the first call

							return (true)

						case 'sys/show/more/notes':

							new Requester ().post ({

								uri: location.hash.substr (1).split (tilde).shift () + '~note',

								pairs: [

									{ name: 'username', value: nav.username () },
									{ name: 'identity', value: nav.identity () },
									{ name: 'n_cursor', value: nav.kc + nav.nc },
									{ name: 'ordering', value: nav.so }

								],

								onload: function (r) {

								    let notes = empty, response, note, end

									try { response = JSON.parse (r.response) }

										catch (e) {

											nav.to (null, 'sys/server/message', { reponse: t_malf_response })
											return

										}

									for (note in (response.notes || clear)) {

										note = response.notes [note]

										if (note.auth in nav.ii) {

											notes = notes || nline
											nav.nc = nav.nc + 1
											continue

										}

										notes = notes + rendering ({

											indent: be.number (note.levl).or (2),
											note:	note,
											where:	nav.nc = nav.nc + 1,
											and:	nav.nd [note.id] = note

										}) + nline

									}

									if (notes.length === 0)

										return cui.alert ({ argument: t_end_of_notes })

									if (response.more)

										notes = notes + 'N' + field + blank + t_more_notes

									end = tio.findCp (tio.ci = 100E7)
									tio.positionCursor (tio.cp = end)

									tio.type ({

										text: dline + notes.replace (/^\n/, empty),

										oncompletion: function () {

											tio.ci = tio.findVCi (end.i, end.j)
											tio.positionCursor.call ({ hold: true }, tio.cp = end).nextField ()

										},

										wps: 30,
										lim: 30

									})

								},

								onwhoa: function (r) { cui.alert ({ argument: nav.de_hint (r.response) }) }

							})

							return (true)

						case 'sys/show/more/flags':

							new Requester ().post ({

								uri: '/exec/repreg',

								pairs: [

									{ name: 'username', value: nav.username () },
									{ name: 'identity', value: nav.identity () },
									{ name: 'idx_from', value: nav.flagAtBottom }

								],

								onload: function (r) {

									try {

										r.response = JSON.parse (r.response)
										r.response.text = empty

									}

									catch (e) {

										nav.to (null, 'sys/server/message', { reponse: t_malf_response })
										return

									}

									if (r.response.entries)

										for (let id in r.response.entries) {

										    let page = be.string (r.response.entries [id]).or (false)
										    let note = be.object (r.response.entries [id]).or (false)

											if (page) {

											    let code = id.split (comma)
											    let hash = code [1]
											    let path = code [2]

											    let note = {

													id: score + path,
													nn: hash.substr (-55),
													nr: 0,
													path: path,
													body: page,
													auth: path.split (slash).shift (),
													is_a_page: true,
													isFlagged: true,
													bOperator: true

												}

												nav.flagAtBottom = id
												r.response.text += rendering ({ note: note, indent: 0 }) + nline

											}

											if (note) {

												note.id = id
												note.isFlagged = true
												note.report_by = author + blank + note.from

												nav.flagAtBottom = id
												r.response.text += rendering ({ note: note }) + nline

											}

										}

									if (r.response.text.length === 0)

										return cui.alert ({ argument: t_end_of_flags.replace (/^\W+/, empty) })

									r.response.more || (r.response.text += block + t_end_of_flags)
									r.response.more && (r.response.text += block + '-\nN' + field + t_more_flags)

									end = tio.findCp (tio.ci = 100E7)
									tio.positionCursor (tio.cp = end)

									tio.type ({

										text: dline + r.response.text,

										oncompletion: function () {

											tio.ci = tio.findVCi (end.i, end.j)
											tio.positionCursor.call ({ hold: true }, tio.cp = end).nextField ()

										},

										wps: 30,
										lim: 30

									})

								},

								onwhoa: function (r) { cui.alert ({ argument: nav.de_hint (r.response) }) }

							})

							return (true)

						case 'sys/show/older/news':

							nav.id && nav.nf && new Requester ().post ({

								uri: '/exec/ltn',

								pairs: [

									{ name: 'identIfic', value: be.string (localStorage.identity).or ('anonymous') },
									{ name: 'listen_to', value: nav.username () },
									{ name: 'news_feed', value: String ('true') },
									{ name: 'instaLoad', value: String ('true') },
									{ name: 'rewind_by', value: (22).toString (36) },
									{ name: 'start_row', value: (nav.rb - 22).toString (36) }

								],

								onload: function (r) {

								    let my_username = nav.username ()
								    let notes = new Array
								    let list = empty
								    let ex = nav.ex

									try {

										r.response = JSON.parse (r.response)
										r.response.rows.reverse ()

										nav.rb = nav.rb - r.response.rows.length

									}

									catch (e) {

										return

									} // discard malformed response and break

									for (let row of r.response.rows) {

										try { row = JSON.parse (row) }

											catch (e) { continue } // missing (ahead of records) or corrupt line

										switch (row.event) {

											case 'condemn':

												(ex [row.entry] = ex [row.entry] || { condemned: true }).condemned = true
												break

											case 'drop':

												(ex [row.entry] = ex [row.entry] || { isDropped: true }).isDropped = true
												break

											case 'legit':

												(ex [row.entry] = ex [row.entry] || { isFlagged: null }).isFlagged = null
												break

											case 'report':

												(ex [row.entry] = ex [row.entry] || { isFlagged: true }).isFlagged = ex [row.entry].isFlagged
												break

											case 'reply':

												row.entry.feedReply = true

											case 'note':

												row.entry.isDropped = false

												if (ex [row.entry.id]) {

													row.entry.condemned = ex [row.entry.id].condemned || false
													row.entry.isDropped = ex [row.entry.id].isDropped || false
													row.entry.isFlagged = ex [row.entry.id].isFlagged || false

												}

												row.entry.path = be.string (row.about).or (empty)
												notes.push (row.entry)

										}

									}

									for (let note of notes)

										if (note.isDropped == false || note.auth == my_username)

											note.auth in nav.ii || (list = list + rendering ({

												note:	note,
												hence:	nav.nd [note.id] = note

											}) + nline)

									if (nav.rb > 0)

										list = list + 'N' + field + blank + t_older_news

									if (list.length === 0)

										return cui.alert ({ argument: t_no_more_news })

									end = tio.findCp (tio.ci = 100E7)
									tio.positionCursor (tio.cp = end)

									tio.type ({

										text: dline + list.replace (/^\n/, empty),

										oncompletion: function () {

											tio.ci = tio.findVCi (end.i, end.j)
											tio.positionCursor.call ({ hold: true }, tio.cp = end).nextField ()

										},

										wps: 30,
										lim: 30

									})

								},

								onwhoa: function (r) { cui.alert ({ argument: nav.de_hint (r.response) }) }

							})

							return (true)

					} // hybrid and extended system nodes

					break

				case 'ow':

					scst = home.position
					break

				default:

					/*
					 *	non-resident page load:
					 *	it might not be possible to come here and have scst
					 *	still false, because any of the cases at the "evnt"
					 *	switch, ahead of this, end up loading it as string,
					 *	but let's keep this note here, to keep track of how
					 *	it all unfolds, and STILL monadize this entry so it
					 *	doesn't except, should something change above...
					 */

					scst = be.string (scst).or (home.position).split (slash)

					/*
					 *	if we already loaded it and are here in consequence
					 *	of that, it is now time to display it (process JSON
					 *	response); it might not be possible to come here in
					 *	cases where the resource was "tried" but not found,
					 *	because the error responses go to "sys/" nodes, and
					 *	are therefore intercepted by the above case branch,
					 *	but let's keep this note here to remeber how it all
					 *	unfolds (cit)...
					 */

					if (be.switch (pairs.found).or (false)) {

						try {

							response = (JSON.parse (pairs.response))

							if (be.string (response.text).or (null))

								response.text = nline + response.text.replace (/\{\{([^]*?)\}\}/g, function (m, s) { return nav.nt ? s : empty })

						}

						catch (e) {

							modality = undefined
							response = Object ({ text: nline + t_malf_response, cursor: digit })

						}

						nav.ip = be.switch (response.pict).or (false)	// image presence flag
						nav.kp = be.switch (response.pckt).or (false)	// package presence flag in edit mode
						nav.ku = be.string (response.pack).or (slash)	// package actual path in reader mode
						nav.tu = be.string (response.file).or (slash)	// full page path (for download link)
						nav.pp = be.string (response.prev).or (false)	// prev page in slideshow
						nav.np = be.string (response.next).or (false)	// next page in slideshow

						if (nav.pp || nav.np) {

							nav.ps.op = true
							nav.ps.nx = true

						} // slideshow: force back and forward buttons to evaluate nav.pp and nav.np

						paginate = {

							modal: modality.split ('[').shift (),
							token: modality.match (/\[(\w+)\]$/)

						} // isolate "clean" modality from the alphanumeric token that may follow it

						switch (paginate.modal) {

							case 'note':
							case 'qote':

								postpend = be.string (localStorage.note).or (empty).match (/\S/)
									&& be.string (localStorage.addr).or (empty) === resource + tilde + modality

								// configure TIO highlight patterns to point at a subset of the pages' one

								tio.hPatterns = cui.hPatterns.notes

								// configure TIO to handle pending posts, or set up a "talking about" form

								tio.onchanges = nav.changes.bind ({

									target: 	String ('note'),
									postpend:	postpend,
									returns_to:	resource + tilde + modality,
									easyRetype:	postpend ? false : true,
									oneClip:	paginate.token ? 1 : 0

								})

								pairs.pn = postpend ? localStorage.note : '{tt}' + t_add_note + blank + quote + nav.thatPage () + quote + ellip + '{/tt}'

								// these are considered invariant, though tio.ai will change upon replying

								tio.ai = 2
								tio.bi = 0

								// keep copy of access rights from response into nav.ar, set up invariants

								nav.ns = true
								nav.dr = new Requester ()
								nav.ar = response
								nav.bs = be.switch (response.more).or (false)
								nav.hp = resource
								nav.sz = 999

								// note that the default sorting order is "reverse", and it's the only one
								// where you can see the new note box (it just can't live well in forward-
								// sorted views, as it'd add the new note always on top); also note: we'll
								// confirm the presence of page token (nav.pt) in accord with the server's
								// response, even though it might be obvious, but what if it errs?

								switch (be.switch (response.thread).or (be.string (nav.so).or ('reverse'))) {

									case true:		// thread, reconstructed
									case false:		// thread, but from main note

										nav.pt = be.string (paginate.token && paginate.token.pop ()).or (empty)
										resource = 'sys/note/thread'
										arranges = 'none'
										break

									case 'forward':

										tio.onchanges ({ queryState: true }).oneClip = 1
										resource = 'sys/note/header'
										arranges = 'note'
										break

									case 'reverse':

										resource = response.cp ? 'sys/note/basics' : 'sys/note/frozen'
										arranges = 'note'
										break

								} // setup page layout according to note section view mode and permissions

								// the "frozen" mode is guaranteed where the template is "sys/note/frozen"
								// but even in other cases, thread views (out of "OBSERVE" permalinks) may
								// or may not be part of a page which notes were "frozen" so we'll have to
								// check that in the returned access rights

								switch (resource) {

									case 'sys/note/frozen':

										break

									case 'sys/note/thread':

										pairs.noteMode = true

									default:

										if (response.cp == false)

											break

										nav.ep.setup ({

											channel: nav.thisPage (),
											lastRow: response.cursor,
											timeout: 6667,

											handler: function (response) {

												switch (response.mean) {

													case 'more':

														nav.ns && (this.pt && nav.to (null, nav.hp + '~note[' + this.pt + ']', { interstitial: true }))
														nav.ns && (this.pt || nav.to (null, nav.hp + '~note', { interstitial: true }))
														return

												} // react to server messages reporting an untracked surplus of new events

												for (let row of response.rows) {

													try { row = JSON.parse (row) }

														catch (e) { continue } // corrupt or somehow missing line

													switch (row.event) {

														case 'condemn': // note or reply was condemned by writer

															nav.condemned (row.entry)
															break

														case 'report':	// note or reply was reported as illicit

															nav.reported (row.entry)
															break

														case 'legit':	// note or reply was reverted to "legit"

															nav.legitimized (row.entry)
															break

														case 'drop':	// note or reply was expunged

															nav.expunged (row.entry)
															break

														case 'note':	// new main note

															if (this.pt)

																break

															row.entry.auth in nav.ii || nav.nd [row.entry.id] || nav.receive (row.entry)
															break

														case 'reply':	// new reply

															row.entry.path = be.string (row.about).or (empty)
															row.entry.auth in nav.ii || nav.nd [row.entry.id] || nav.replied (row.entry)
															break

														case 'moving':	// page was retitled while we were reading notes

														    let title = tb (row.path.split (slash).pop ())
															title = blank + index + blank + elliptize ({ string: title, length: 25 })

															cui.mbUpdate ({

																live: true,
																menu: nline + 'M `` [\\] {`} {' + title +
																	Array (Math.max (0, 30 - title.length)).join (blank)
																		+ '} {80.STYLE}' + blank + ('{<} {>}') + nline

															}) // author re-titled this page or moved it to a different collection (yes, it CAN happen)

															nav.ps.ve [nav.ps.id] = 1		// invalidate history entry of current (notes) page
															nav.ps.ve [nav.ps.id - 1] = 1		// invalidate history entry of presumed parent page

															nav.hp = nav.pp = rc (row.path) 	// update our bound paths (top link and back arrow)
															nav.ep.synch ({ channel: row.path })	// tune-in to new channel (clear and reinit poller)

													} // processing events

												} // parsing events

											}.bind ({ pt: nav.pt })

										})

								} // unless page notes were "frozen", start polling for events

								// mostly, this will pass "response.thread" flag to nav.extras

								pairs.isThread = be.switch (response.thread).or (false)

								// where "topLabel" is undefined, we're in a generic chat node

								pairs.topLabel = be.string (response.tl).or (undefined)
								pairs.leadLink = be.string (response.tl).or (undefined) && (blank + index + blank + elliptize ({ string: nav.thatPage (), length: 25 }))
								pairs.sideLink = nav.kc

									? be.string ({ reverse: '\`\`\|', forward: '\|\\\\' } [nav.so]).or ('\`\`\|')
									: be.string ({ reverse: t_latest, forward: t_oldest } [nav.so]).or (t_latest)

								if (defined (pairs.topLabel)) {

									pairs.newpost = 'YOUR NOTE'
									pairs.nps = 'NOTES'
									pairs.new_post = 'NUOVA NOTA'
									pairs.np = 'NOTA'
									x_first_note = t_first_note

								}

								if (undefed (pairs.topLabel)) {

									pairs.topLabel = t_everlongtalk
									pairs.leadLink = blank + index + blank + t_monthly_recs
									pairs.newpost = 'YOUR POST'
									pairs.nps = 'POSTS'
									pairs.new_post = 'NUOVO POST'
									pairs.np = 'POST'
									pairs.pn = postpend ? pairs.pn : empty
									x_first_note = t_first_post
									tio.onchanges ({ queryState: true }).easyRetype = false

								}

								// record content directory

								for (let note in (response.notes || clear)) {

									note = response.notes [note]
									nav.nd [note.id] = note
									nav.nc = nav.nc + 1

								}

								// filter content directory

								if (nav.pt)

									for (let note in (response.notes || clear)) {

										note = response.notes [note]
										note.id === nav.pt || (note.noReplies = true)

									}

								// create content directory

								for (let note in (response.notes || clear)) {

									note = response.notes [note]

									if (note.auth in nav.ii) {

										pairs.cdr = pairs.cdr || nline
										continue

									}

									pairs.cdr = ((pairs.cdr) || empty) + rendering ({

										indent: be.number (note.levl).or (2),
										note:	note

									}) + (nline)

								}

								// append content directory

								pairs.cdr && (pairs.cdr = pairs.cdr.replace (/^\n/, empty) + (response.more ? 'N' + field + blank + t_more_notes : empty))
								pairs.cdr || (pairs.cdr = block + reframing (aster, tio.nc - 4, '-', '/') + nline + centering (x_first_note, tio.nc))

								// set up invariants

								node = be.object ($(resource.replace (/\W/gi, score))).or (new Object)		// this is overriding what happens to all other regular
								text = nav.rcrop (be.string (node.innerText).or ('?'))				// resident pages (those found in paragraphs of an HTML
								dump = true									// template) addressing the template but avoiding notes

								break  to_dom

							case 'full':	// fullscreen picture post
							case 'fune':	// fullscreen picture post, detached from a slide show because reached via new image uploads list (though it mightn't be there)

								if (be.string (response.full).or (null)) {

									switch (location.hash.startsWith ('#/about/')) {

										case false:

											nav.SS || (nav.ru = pairs.ref || rc (nav.thisPage ()))	// if no slideshow, record this as entry/referring page

									} // avoid remembering it as the entry page, if it's a profile picture

									nav.pp && (nav.pp = nav.pp + '~full')					// set previous page link's modality to fullscreen view
									nav.np && (nav.np = nav.np + '~full')					// set the next page link's modality to fullscreen view
									nav.SS && (nav.pp || (nav.pp = nav.ru)) 				// if in slideshow AND no previous page, point to entry
									nav.SS && (nav.np || (nav.np = nav.ru)) 				// if in slideshow AND no next page, point .np to entry

									nav.ss (response.full += sessionStorage [response.full] || empty)	// will add the microtime querystring to bust the cache
									nav.cc (response.name || null, response.capt || null)			// window's caption is basically the sole visible thing

									return (tail (arranges))

								}

								// the following would bring stuff to a neutral, compatible state with respect
								// to that of an empty page, where for some reason the server's response would
								// not correlate with the full-screen request: this may happen, to say one, if
								// the picture's page was deprived of its cover image while the viewer was not
								// yet looking at it, while its adjacent pages would still hold valid pictures

								tio.scrollTo (0, true)
								tio.cls (null, nav.cb)
								tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findVCi (home.colIndex, home.rowIndex)))

								// unconfirmed slideshow entry: revert to regular view

								nav.ss (false)

							default:

								be.switch (response.allowNote).or (false) && (arranges = 'talk')		// show notes balloon icon if notes are allowed
								be.switch (response.viewNotes).or (false) && (arranges = 'talk')		// show notes balloon icon if notes were frozen

								if (arranges === 'talk' && (be.number (response.nnum).or (0)) < 100)

									t_talk = expanding (be.number (response.nnum).or ('NN').toString (), 2)

								if (arranges === 'talk' && (be.number (response.nnum).or (0)) >= 99)

									t_talk = '99'

								if (arranges === 'talk' && (be.number (response.nnum).or (0)) === 0)

									t_talk = '--'

						} // pre-render modality switch

						if (be.switch (response.main).or (false))

							if (pairs.ref === 'sys/how/to') {

								nav.hp = String ('sys/type/something')
								nav.ih = true
								pairs.leadLink = blank + index + blank + t_back_typing
								response.text = response.text.replace (/\n[LN]\s\`\`\s.+\n/, '\nL' + field + tf (t_back_typing) + '\n')

							} // we are viewing a help page, referred by the "how to", where the user expects to go back to the new page template via literal links

						if (auth = (be.switch (response.auth).or (false)))

							if (be.switch (response.edit).or (false)) {

								pairs.skipTitles = be.switch (response.page).or (false) 			// induce subsequent code to skip page's titles
								pairs.endOfLiner = be.switch (response.home).or (false) 			// induce subsequent code to simulate "End" key

								nav.sz = be.number (response.size).or (38835)					// available chars: follows server hint
								response.text = be.string (localStorage [resource]).or (response.text)		// reflect pending entry, where present
								pairs.endOfLiner || (cml.style.display = cmr.style.display = 'block')		// unless it's home titles, show margin

							} // we are viewing a page we have ownership rights to, and authoring it (in edit mode)

						if (be.object (response.head).or (false)) {

							nav.hp = pairs.topLabel = be.string (response.name).or (empty)
							nav.ht = pairs.leadLink = response.head.title
							nav.hp = rc (nav.hp)

							switch (be.string (response.head.entry).or (false)) {

								case 'home':

									pairs.topLabel = response.head.title
									pairs.leadLink = blank + index + blank + (t_share_now = response.head.share || t_share_blog)
									break

								case 'page':

									pairs.topLabel = response.head.title
									pairs.leadLink = blank + index + blank + (response.head.index || t_blog_index)
									break

								case 'user':

									pairs.topLabel = tb (pairs.topLabel)
									pairs.leadLink = blank + index + blank + (response.head.visit || t_visit_blog)
									break

							} // these have headings and they might always include the kind of entry they represent

							be.switch (response.viewNotes).or (false) && (pairs.noteMode = true)
							be.switch (response.allowNote).or (false) && (pairs.noteMode = true)

						} // if this page had headings, they would override any of the above leadLink/topLabel settings

						if (pairs.instant) {

							tio.load (response.text, auto, nav.cb)
							tio.scrollTo (parseInt (scst [0]), true)

							tio.pag.scrollLeft = tio.pl = 0
							tio.positionCursor.call ({ hold: true }, tio.cp = tio.findCp (tio.ci = tio.findVCi (parseInt (scst [1]), parseInt (scst [2]))))
							tio.onchanges = auth && edit ? nav.changes.bind ({ target: 'page', resource: resource, easyRetype: pairs.easyRetype || false }) : idler

							nav.to_TIO ({ popKeyboard: auth && edit })
							nav.extras ({ resource: resource, response: response.text, position: scst })

							auth && edit && setTimeout (function () {

							    let nextField = this.pairs.doNotSkipTitles ? idler : tio.nextField
							    let endOfLine = this.pairs.doNotSkipTitles ? idler : tio.kbFunctions.ro_end

								nextField ()									// jump to first field (from menu/home)

								if (this.pairs.skipTitles || this.pairs.easyRetype) {

									nextField ()								// skip over page title
									nextField ()								// skip over page collection
								     // nextField ()								// skip over visibility settings
								     // nextField ()								// skip over discussion settings

									nav.kp && (endOfLine ())						// move to end of package name

								}

								this.pairs.easyRetype && endOfLine ()						// move to end of suggestion
								this.pairs.endOfLiner && endOfLine ()						// move to end of blog title

								// if this page is supposed to serve a file, a package...

								if (be.string (this.pairs.filename).or (empty).length > 0) {

									if (nav.grab (t_serve_file).length === 0)

										tio.putKey.call ({ key: this.pairs.filename })			// ...but the package name field is actually empty, put default name there

									localStorage [this.resource] = tio.it					// and in any cases, record the displayed text to mark the page as changed

								}

							}.bind ({ resource: resource, pairs: pairs }), 67)

						} // instant load, no animation

						pairs.instant || tio.cls (auto, nav.cb).scrollTo (0, true).type ({

							text: response.text,

							oncompletion: function () {

								tio.pag.scrollLeft = tio.pl = 0
								tio.positionCursor (tio.cp = tio.findCp (tio.ci = tio.findVCi (parseInt (this.scst [1]), parseInt (this.scst [2]))))
								tio.onchanges = this.auth && this.edit ? nav.changes.bind ({ target: 'page', resource: this.resource, easyRetype: this.pairs.easyRetype || false }) : idler

								nav.to_TIO ({ popKeyboard: this.auth && this.edit })
								nav.extras ({ resource: this.resource, response: this.response.text, position: this.scst })

								this.auth && this.edit && setTimeout (function () {

								    let nextField = this.pairs.doNotSkipTitles ? idler : tio.nextField
								    let endOfLine = this.pairs.doNotSkipTitles ? idler : tio.kbFunctions.ro_end

									nextField ()								// jump to first field (from menu/home)

									if (this.pairs.skipTitles || this.pairs.easyRetype) {

										nextField ()							// skip over page title
										nextField ()							// skip over page collection
									     // nextField ()							// skip over visibility settings
									     // nextField ()							// skip over discussion settings

										nav.kp && (endOfLine ())					// move to end of package name

									}

									this.pairs.easyRetype && endOfLine ()					// move to end of suggestion
									this.pairs.endOfLiner && endOfLine ()					// move to end of blog title

									// if this page is supposed to serve a file, a package...

									if (be.string (this.pairs.filename).or (empty).length > 0) {

										if (nav.grab (t_serve_file).length === 0)

											tio.putKey.call ({ key: this.pairs.filename })		// ...but the package name field is actually empty, put default name there

										localStorage [this.resource] = tio.it				// and in any cases, record the displayed text to mark the page as changed

									}

								}.bind ({ resource: this.resource, pairs: this.pairs }), 67)

							}.bind ({ resource: resource, response: response, scst: scst, auth: auth, edit: edit, pairs: pairs }),

							wps: 30,
							lim: 30

						}) // animated load

						response.name = tb (be.string (response.name).or (empty))					// will be our caption's left-side
						pairs.topLabel = pairs.topLabel || response.capt || empty					// if no "head" object is provided
						nav.cc (response.name || (null), response.capt || (null))

						return (tail (arranges))

					} // request already made, and page was found

					new Requester ({ notes: {

						path:			purePath ? resource : (resource + tilde + modality),
						ref:			be.string (nav.pu).or (slash),
						entryRequest:		be.switch (pairs.entryRequest).or (false),
						instant:		be.switch (pairs.instant).or (false),
						restore:		be.switch (pairs.restore).or (false),
						interstitial:		be.switch (pairs.interstitial).or (false),
						easyRetype:		be.switch (pairs.easyRetype).or (false),
						endOfLiner:		be.switch (pairs.endOfLiner).or (false),
						skipTitles:		be.switch (pairs.skipTitles).or (false),
						doNotSkipTitles:	be.switch (pairs.doNotSkipTitles).or (false),
						filename:		be.string (pairs.filename).or (false),
						sort:			be.string (pairs.sort).or (false),
						cursor: 		be.number (pairs.cursor).or (false)

					} }).post ({

						uri: slash + path,

						pairs: Array (

							{ name: 'username', value: nav.username () },
							{ name: 'identity', value: nav.identity () }

						).concat (pairs.sort ? [{ name: 'ordering', value: pairs.sort }] : avoid).concat (pairs.cursor ? [{ name: 'n_cursor', value: pairs.cursor }] : avoid),

						onwhoa: function (r) {

							r.status === 404 && nav.to (null, 'sys/not/found_404_', { tried: true, path: r.notes.path, ref: r.notes.ref })
							r.status === 404 || nav.to (null, 'sys/server/message', { tried: true, path: r.notes.path, ref: r.notes.ref, response: nav.de_hint (r.response) })

						}, // this is where such resource was "tried", but not "found"

						onload: function (r) {

							nav.to (null, r.notes.path, {

								tried:			true,
								found:			true,
								ref:			r.notes.ref,
								entryRequest:		r.notes.entryRequest,
								instant:		r.notes.instant,
								restore:		r.notes.restore,
								interstitial:		r.notes.interstitial,
								easyRetype:		r.notes.easyRetype,
								endOfLiner:		r.notes.endOfLiner,
								skipTitles:		r.notes.skipTitles,
								doNotSkipTitles:	r.notes.doNotSkipTitles,
								filename:		r.notes.filename,
								sort:			r.notes.sort,
								cursor: 		r.notes.cursor,
								response:		r.response

							}) // echo significant parameters from request <pairs>

						} // and this implies it was "found"

					}) // request not yet made, so making one...

					tio.cls ().scrollTo (0, 1).type ({ text: '\n' })
					return (nav.pu = resource), tail ('hold titles')

			} // take care of dynamic load of arbitrary URIs

			/*
			 *	the rest loads all the resident "system nodes", doing
			 *	keyword replacements such as "{username}" and setting
			 *	up the TIO to reflect the state (restores top scroll,
			 *	sets or restores cursor position, starts animation if
			 *	appropriate...)
			 */

			nav.nterstitial [resource] ? pairs.interstitial = true : null

			scst = be.string (scst).or (home.position).split ('/')
			node = be.object ($(resource.replace (/\W/gi, score))).or (be.object ($((nav.rsnSynonyms [resource] || blank).replace (/\W/gi, score))).or (clear))
			text = be.string (text).or (be.string (node.innerText).or (t_corner + t_expired_page))
			text = nav.prepr (text, pairs)
			menu = nav.cm ? empty : nav.cb

			if (pairs.instant) {

				tio.load (dump ? text : nav.rcrop (text), auto, menu)
				tio.scrollTo (parseInt (scst [0]), true)
				tio.pag.scrollLeft = tio.pl = 0
				tio.positionCursor.call ({ hold: true }, tio.cp = tio.findCp (tio.ci = tio.findVCi (parseInt (scst [1]), parseInt (scst [2]))))
				nav.to_TIO ({ popKeyboard: nav.popKeyboard [resource] || nav.fp || nav.ns, noAutofocus: nav.noAutofocus [resource] || nav.fp || nav.ns })

				nav.extras ({

					resource: resource,
					response: pairs.response && pairs.response.text || String ('resident'),
					position: scst,
					isThread: false,
					jwCursor: pairs.jwCursor || empty,
					jabIndex: pairs.jabIndex || empty

				})

			} // instant load, no animation

			else {

				tio.cls (auto, menu).scrollTo (0, true).type ({

					text: dump ? text : nav.rcrop (text),

					oncompletion: function () {

						tio.pag.scrollLeft = tio.pl = 0
						tio.positionCursor.call ({ hold: true }, tio.cp = tio.findCp (tio.ci = tio.findVCi (parseInt (this.scst [1]), parseInt (this.scst [2]))))
						nav.to_TIO ({ popKeyboard: nav.popKeyboard [this.resource] || nav.fp || nav.ns, noAutofocus: nav.noAutofocus [this.resource] || nav.fp || nav.ns })

						nav.extras ({

							resource: this.resource,
							response: this.pairs.response && this.pairs.response.text || String ('resident'),
							position: this.scst,
							isThread: this.pairs.isThread || false,
							jabIndex: this.pairs.jabIndex || empty,
							jwCursor: this.pairs.jwCursor || empty

						})

					}.bind ({ resource: resource, pairs: pairs, scst: scst }),

					wps: 30,
					lim: 30

				})

			} // animated load

			/*
			 *	because dynamic loads from arbitrary URIs were handled above,
			 *	we'll use the default caption for the document's title, since
			 *	this will be presumed an internal (or "infrastructural") page
			 */

			nav.cc (null, null)
			return (nav.pu = resource), tail (arranges)

		} // nav.to

	} // nav object


