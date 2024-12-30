



	const notset = false	// value replacing strings where not given
	const xplicity = 1.4	// exponent to the plicity (see .finalize)
	const basic_LoD = 44	// factor modulating overall details level

	/*
	 *
	 *	=============
	 *	utility maths
	 *	=============
	 *
	 *	Copyright 2012-2019 by Alessandro Ghignola
	 *	Public domain - but you're on your own. :)
	 *
	 */

	Maths = {

		/*
		 *	unitizes vector u having components [ x, y, z ],
		 *	used basically only in face record construction
		 */

		unitize: function (u) {

		  const k = 1 / Math.sqrt (u [0] * u [0] + u [1] * u [1] + u [2] * u [2]);

			u [0] *= k;
			u [1] *= k;
			u [2] *= k;

			return u;

		},

		/*
		 *	computes the normal vector to a plane identified by the three
		 *	given points (each identified by a x;y;z coordinate triplet),
		 *	but would not unitize it (that's a possibly unnecessary step,
		 *	depending on what that vector's components were computed for)
		 *
		 *	      - again only used only in face record construction,
		 *		and the returned object is discarded (by garbage
		 *		collection) after passing computed values in the
		 *		persistent surfaceNormal entries of face records
		 */

		normalTo: function (p, q, r) {

		  const x1 = r [0] - p [0],
			y1 = r [1] - p [1],
			z1 = r [2] - p [2],
			x2 = q [0] - p [0],
			y2 = q [1] - p [1],
			z2 = q [2] - p [2];

			return [

				y2 * z1 - z2 * y1,
				z2 * x1 - x2 * z1,
				x2 * y1 - y2 * x1

			];

		},

		/*
		 *	tests whether a certain point belongs into a polygon:
		 *	in Spectrum, used to match solid surfaces (World.ground)
		 */

		inPolygon: function (point, shape, plane) {

			// https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
			// Copyright © 1994-2006, W Randolph Franklin (WRF)
			// You may use my material for non-profit research and education,
			// provided that you credit me, and link back to my home page.

		  const h = ( point && point.h ) || 0,
			v = ( point && point.v ) || 0,
			l = ( shape && shape.length ) || 0,
			H = { xy: 0, xz: 0, zy: 2 } [plane] || 0,
			V = { xy: 1, xz: 2, zy: 1 } [plane] || 1;

		    var i, j, a, b, m, n, f = false;

			for (i = 0, j = l - 1; i < l; j = i ++) {

				a = shape [i] [V];
				b = shape [j] [V];

				if ((a > v) - (b > v)) {

					m = shape [i] [H];
					n = shape [j] [H];

					if (h < (n - m) * (v - a) / (b - a) + m)

						f = !f;

				}

			}

			return f;

		},

		/*
		 *
		 */

		polyArea: function (p) {

		    let a = 0
		    let j = 1

			for (let v of p) {

				a = (a + v.x * p [j].y - v.y * p [j].x)
				j = (j + 1) % p.length

			}

			return Math.abs (0.5 * a)

		}, // shoelace formula

		polyBuffer: function (p, d = 1) {

		  const direction = function (P, Q, R) {

			    let QPx = Q.x - P.x
			    let RQy = R.y - Q.y
			    let QPy = Q.y - P.y
			    let RQx = R.x - Q.x

				Math.abs (QPx) < 1e-10 && (QPx = 0)
				Math.abs (RQy) < 1e-10 && (RQy = 0)
				Math.abs (QPy) < 1e-10 && (QPy = 0)
				Math.abs (RQx) < 1e-10 && (RQx = 0)

				return (Math.sign (QPy * RQx - QPx * RQy))

			}

		  const distance = function (x1, y1, x2, y2) {

			    let dx = x1 - x2
			    let dy = y1 - y2

				return (Math.sqrt (dx * dx + dy * dy))

			}

		    let P = N = 0
		    let i = p.length - 1
		    let j = 1

			for (let v of p) {

				direction (p [i], v, p [j]) > 0 ? P = P + 1 : N = N + 1

				i = (i + 1) % p.length
				j = (j + 1) % p.length

			}

		    let D = Math.sign (P - N)

			if (D === 0)

				return (false)

		    let b = new Array
			i = p.length - 1
			j = 1

			for (let v of p) {

			    let d_fs = distance (v.x, v.y, p [i].x, p [i].y)
			    let d_st = distance (v.x, v.y, p [j].x, p [j].y)
			    let rate = d_fs + d_st

				if (Math.min (d_fs, d_st) < d)

					return (false)

			    let dxtf = p [j].x - p [i].x
			    let dytf = p [j].y - p [i].y
			    let pobx = p [i].x + d_fs * (dxtf / rate)
			    let poby = p [i].y + d_fs * (dytf / rate)

				if (Math.abs (pobx - v.x) < 1e-10)
				if (Math.abs (poby - v.y) < 1e-10)

					v = {

						x: v.x + (0.5e-10),
						y: v.y + (0.5e-10)

					}

			    let d_bv = distance (v.x, v.y, pobx, poby)
			    let k_bv = d / d_bv

				if (direction (p [i], v, p [j]) === D)

					b.push ({ x: v.x - k_bv * (v.x - pobx), y: v.y - k_bv * (v.y - poby) })

				else

					b.push ({ x: v.x + k_bv * (v.x - pobx), y: v.y + k_bv * (v.y - poby) })

				i = (i + 1) % p.length
				j = (j + 1) % p.length

			} // computing buffer edge

			return (b)

		}, // polyBuffer

		/*
		 *	the following is a set of entries implementing functions to buffer polygons
		 *	via the JSTS; as long as it instantiates the polygon, it takes care to find
		 *	its area, hence both those functions are performed by "Maths.process"; what
		 *	the code above "process" does is a forward and backward transform (a double
		 *	rotation, first along the yaw/X-Z plane, then along pitch/Y-Z plane) to get
		 *	the 3D polygon to a 2.5D representation compatible with JSTS limitations in
		 *	the handling of polygons; in particular:
		 *
		 *	      - g_fact is the sole used instance of a JSTS GeometryFactory we need;
		 *
		 *	      - what comes out of "Maths.to25" is a 2.5-D vertex which Z coordinate
		 *		is basically constant for the same polygon, because the polygon has
		 *		been rotated so that it lays parallel to the X-Y plane: that said Z
		 *		value (sort of an "elevation" with respect to the X-Y plane, Z = 0)
		 *		can then be passed, along with a constant transform matrix (tr), to
		 *		the "Maths.to3d" function, which returns vertices from the buffered
		 *		polygon to 3D coordinates consistent with the relative position and
		 *		orientation of the original polygon;
		 *
		 *	      - to create the stylish bright edges around shapes (thick wire frame)
		 *		the "Maths.process" function takes a negative "spacing" value which
		 *		is passed to the .buffer method of JSTS's operation class; however,
		 *		the returned polygon's coordinates array is not guaranteed to begin
		 *		with the same vertex as the first vertex of the original face, even
		 *		because negative buffering may ERASE vertices that'd self-intersect
		 *		in the resulting inside-edge; neither it is guaranteed to match the
		 *		original polygon's verse (original may be clockwise from Z < 0, but
		 *		result may be counter-clockwise from that same direction); to match
		 *		the two shapes, a HEURISTIC follows the buffering phase, where each
		 *		vertex in the result is checked (in terms of distance) against that
		 *		of the last vertex from the original to establish the 1st vertex in
		 *		the returned "edge" array, and then the arity of the signs of every
		 *		triplet's normal in the buffered edge is tested against that of the
		 *		entry polygon shape (converted to 2.5D), and if the two shapes wind
		 *		into the same direction (same arity) the edge's path is reversed so
		 *		that, by concatenating the returned edge path to the entry path, we
		 *		obtain a consistent non-self-intersecting polygon (the "wire edge")
		 */

		to25: function (v, tr) {

		  const x1 = v [0],
			y1 = v [1],
			z1 = v [2],

			z2 = z1 * tr.c1 - x1 * tr.s1;

			return {

				x: x1 * tr.c1 + z1 * tr.s1,
				y: y1 * tr.c2 - z2 * tr.s2,
				z: z2 * tr.c2 + y1 * tr.s2

			};

		}, // convert to 2.5D

		to3D: function (v, z1, tr) {

		  const x1 = v.x,
			y1 = v.y,

			z2 = z1 * tr.c2 - y1 * tr.s2;

			return {

				y: y1 * tr.c2 + z1 * tr.s2,
				x: x1 * tr.c1 - z2 * tr.s1,
				z: z2 * tr.c1 + x1 * tr.s1

			};

		}, // convert back to 3D

		process: function (face, spacing, noBuffering) {

		  const ca = face.surfaceNormal_0,
			cb = face.surfaceNormal_1,
			cc = face.surfaceNormal_2,
			ya = Math.atan2 (ca, -cc),
			c1 = Math.cos (ya),
			s1 = Math.sin (ya),
			pi = Math.atan2 (cb, cc * c1 - ca * s1),

			tr = {

				c1: c1, c2: Math.cos (pi),
				s1: s1, s2: Math.sin (pi)

			};			// transform matrix for 2.5D projection

		  const poly = new Array (),	// entry polygon shape, built below into JSTS' format
			edge = new Array ();	// final edge having been converted back from 2.5D to 3D

		    var i, buff, v;		// loop index, buffered polygon, vertex

			for (i in face.path)

				poly.push ({ x: (v = Maths.to25 (face.path [i], tr)).x, y: v.y, z: v.z })

			if (noBuffering)

				return { edge: edge, area: Maths.polyArea (poly), except: false };

			if (buff = Maths.polyBuffer (poly, spacing)) {

				i = buff.length;

				do {

					edge.push (Maths.to3D (buff [-- i], v.z, tr));

				} while (i);

				return { poly: poly, edge: edge, area: Maths.polyArea (poly), except: false };

			}

			return { edge: edge, area: Maths.polyArea (poly), except: true };

		},

		/*
		 *	checks whether a given vertex in a path, or with respect to another pair of
		 *	vertices that precede the said vertex in a path, is consecutive to the last
		 *	two vertices in the path or to the given pair, i.e. if it'd just "lenghten"
		 *	the segment between the last two vertices or the given pair
		 */

		consec: function (a_vertex, in_path_or_vertex, and_vertex) {

		    var E = .0000001, i, j, a, b, c, d, e, f,

			v = a_vertex,
			p = in_path_or_vertex;

			if (and_vertex)

				p = [ in_path_or_vertex, and_vertex ];

			if (p.length < 2)

				return false;

			i = p [p.length - 1];
			j = p [p.length - 2];

			a = Math.atan2 (i [0] - j [0], i [1] - j [1]);
			b = Math.atan2 (v [0] - i [0], v [1] - i [1]);
			c = Math.atan2 (i [2] - j [2], i [1] - j [1]);
			d = Math.atan2 (v [2] - i [2], v [1] - i [1]);
			e = Math.atan2 (i [0] - j [0], i [2] - j [2]);
			f = Math.atan2 (v [0] - i [0], v [2] - i [2]);

			a < 0 && (a = a + Math.PI);
			b < 0 && (b = b + Math.PI);
			c < 0 && (c = c + Math.PI);
			d < 0 && (d = d + Math.PI);
			e < 0 && (e = e + Math.PI);
			f < 0 && (f = f + Math.PI);

			return Math.abs (a - b) < E && Math.abs (c - d) < E && Math.abs (e - f) < E;

		},

		/*
		 *	uses the preceding "consec" function to return a path where all occurrences
		 *	of consecutive vertices have been removed: this is specially necessary when
		 *	passing paths to the JSTS' buffer operation, which easily excepts otherwise
		 */

		condense: function (path) {

		  const p = path, q = new Array ();

			for (var i in p) {

				Maths.consec (p [i], q) && q.pop ();
				q.push (p [i]);

			}

			Maths.consec (q [0], q) && q.pop ();
			Maths.consec (q [1], q [q.length - 1], q [0]) && q.shift ();

			return q;

		}

	};

	/*
	 *
	 *	===================================================================
	 *	3D rendering context, 3D clipping, perspective projection functions
	 *	===================================================================
	 *
	 *	Copyright 2012-2024 by Alessandro Ghignola
	 *	Public domain - but you're on your own. :)
	 *
	 */

	RC = {

		FS: empty,				// last used fill style
		GA: 1					// last used global alpha

	};

	/*
	 *	Rc constructor: arguments include { width }, { height } in pixels, { cv } reference
	 *	to an HTML canvas element to be used for output, { cx } reference to an optional 2D
	 *	canvas context to be shared between different Rc instances
	 */

	Rc = function (args) {

	  const w = Math.max (2, be.number (args && args.width).or (256)),
		h = Math.max (2, be.number (args && args.height).or (192)),
		W = w - 1,
		H = h - 1;

		this.cv = (args && args.cv) || null;
		this.cx = (args && args.cx) || this.cv.getContext ('2d', { alpha: false });

		/*
		 *	camera and viewport data: its spatial coordinates, plus constants k and l,
		 *	are in virtual length units (ideally I prefer to see them as centimeters),
		 *	angles are in degrees, the coordinates for the viewport's edges and center
		 *	are in pixels
		 *
		 *	      - default values reflect a small canvas of 256x192 pixels
		 */

		this.a = 0;
		this.b = 0;
		this.c = 0;				// camera orientation: pitch, yaw, roll

		this.x = 0;
		this.y = 0;
		this.z = 0;				// camera position (actual coordinates)

		this.mx = -1e10;			//
		this.Mx = +1e10;			//
		this.my = -1e10;			// camera position's allowed mins and Maxs,
		this.My = +1e10;			// can be set with a call to .constrict
		this.mz = -1e10;			//
		this.Mz = +1e10;			//

		this.f = 35;				// camera focal (in virtual length units)
		this.d = 112;				// projection plane distance (z = d)
		this.p = 112;				// anisotropy-modulated version of this.d
		this.e = 1 / 112;			// reciprocal of d for inverse transforms
		this.k = 15;				// z-clipping plane distance (z = k)
		this.r = 7.47;				// z-clipping optimization constant (d / k)
		this.s = 7.47;				// z-clipping optimization constant (aniso)
		this.l = 0.01;				// min. difference in z-clipping divisions

		this.i = w / 2;
		this.j = h / 2; 			// viewport center { i; j }

		this.w = w;
		this.h = h;				// viewport dimensions

		this.W = W;
		this.H = H;				// viewport clipping high ends

		this.sa = 0;
		this.ca = 1;
		this.sb = 0;
		this.cb = 1;
		this.sc = 0;
		this.cc = 1;				// sines and cosines for angles a, b and c

		/*
		 *	2D context clipping data:
		 *	viewport edges will be relative to canvas' top left corner, not center
		 */

		this.of = true; 			// flag: a figure must be opened yet
		this.cf = false;			// flag: subject polygon needs 2D clipping
		this.sl = 0;				// number of vertices (times 2) in this.sp

		this.sp = [ ];				// the subject polygon of 'clip'
		this.vp = [ 1, 1, W, 1, W, H, 1, H ];	// the actual 2D viewport (polygon)

		/*
		 *	current lightpen data
		 */

		this.lx = 0;
		this.ly = 0;
		this.lz = 1;				// current 3D coordinates of the lightpen
		this.vf = 1;				// numeric flag: lightpen visibility flag

		this.li = 0;
		this.lj = 0;				// current 2D coordinates of the lightpen

		this.fp = [

			.1,.1,.1,.1,.1,
			.1,.1,.1,.1,.1

		];					// first point in lightpen path

		/*
		 *	an Rc's "C" is the ID for the current "conversion" (i.e. rototranslation):
		 *	the Rc's methods like "pt" store that into entry at index +3 of a vertex's
		 *	array, where it's supposed to be merely an indication of the last time the
		 *	vertex has been converted from world space to screen space coordinates and
		 *	will eventually be tested by code outside the Rc methods to determine when
		 *	a given vertex was already processed with "pt" and similar methods; albeit
		 *	this is handled and written by external code, it might be directly written
		 *	to the Rc instance (accessed as "myRc.C = my_number") to speed up updating
		 *	it in a performance-critical portion of external code; on its part, the Rc
		 *	will only write this to any vertex record passed to "pt"-like methods, for
		 *	the rest its value will be completely irrelevant
		 */

		this.C = 1;

		this.D = 1;				// direction (+1 up-right, -1 gnd mirror)
		this.Q = 1;				// bright quantum
		this.q = .125;				// dim quantum
		this.S = 3219;				// contribution culling stepping factor
		this.X = 1;				// 2D anisotropic scaling factor

		return this;

	};

	/*
	 *	----------------------------------------------------------------------------------
	 *	Rc internals - may be called directly but calling syntax is not guaranteed to hold
	 *	----------------------------------------------------------------------------------
	 */

	/*
	 *	point transform: updates the vertex array for point p,
	 *	by rototranslating and, where the point is visible, projecting it
	 *
	 *	      - the vertex array is an array of at least 10 entries mapped as follows:
	 *		entries 0, 1 and 2 are world-space x, y, z; entry at index 7 holds the
	 *		visibility flag, which tells if the point's in front of the z-clipping
	 *		plane (when it is not, perspective projection is not done, and entries
	 *		at indices 8 and 9 are not updated); entry at index 3 is where Rc.C is
	 *		written to update the rototranslation ID; finally entries 8 and 9 will
	 *		hold the perspectively-projected on-screen x and y coordinates: again,
	 *		those last two entries are computed and written back to the array only
	 *		if the point is in front of the clipping plane (visibility flag set);
	 *
	 *	      - on-screen x and y coordinates are never rounded or truncated: they are
	 *		left in floating-point form, to prevent loss of precision in clipping
	 */

	Rc.prototype.pt = function (p) {

	    var x1, y1, z1, y2, z2, z3;

		/*
		 *	rototranslation of (p [0], p [1], p [2]),
		 *	writing to triplet (p [4], p [5], p [6])
		 */

		x1 =	      p [0] - this.x;
		y1 = this.D * p [1] - this.y;
		z1 =	      p [2] - this.z;

		z2 = z1 * this.cb - x1 * this.sb;
		x1 = x1 * this.cb + z1 * this.sb;
		y2 = y1 * this.ca - z2 * this.sa;

		p [3] = this.C; 			// update rototranslation ID
		p [4] = x1 * this.cc + y2 * this.sc;	// write screen-space x
		p [5] = y2 * this.cc - x1 * this.sc;	// write screen-space y

		/*
		 *	z-clip to plane z = k
		 */

		if ((z2 = z2 * this.ca + y1 * this.sa) < this.k) {

			p [6] = z2;			// write screen-space z
			p [7] = 0;			// clear visibility flag

			return p;			// return the same input array

		} // point before clipping plane (vertex not visible)

		/*
		 *	perspective projection of (p [4], p [5], p [6]), over z = d,
		 *	to on-screen point (p [8], p [9])
		 */

		z2 = this.d / (p [6] = z2);		// p [6] = z2, z2 = this.d / z2
		z3 = this.X * (z2);			// apply 2D anisotropic scaling

		p [7] = 1;				// set visibility flag
		p [8] = z3 * p [4] + this.i;		// write on-screen x into p [8]
		p [9] = this.j - z2 * p [5];		// write on-screen y into p [9]

		return p;				// return the same input array

	};

	/*
	 *	this is mostly supposed to be an internal function, called by .wireTo:
	 *	it holds logic to mark points in the path being traced and set the 2D clipping flag
	 */

	Rc.prototype.mark = function (x, y) {

		this.sp [this.sl ++] = x;
		this.sp [this.sl ++] = y;

		this.cf = this.cf === true || x < 1 || x > this.W || y < 1 || y > this.H;

	};

	/*
	 *	2-D stage clipping:
	 *	Sutherland-Hodgman implementation used by .fill
	 */

	Rc.prototype.clip = function () {

	  const port = this.vp;

	    var sl = this.sl,			// initial output list length
		sp = this.sp,			// initial output list

		px = port [6],
		py = port [7],			// initialize to prev. point (last in port)

		qx, qy,
		ex, ey,
		sx, sy, 			// uninitialized point pairs

		dx, dy,
		dX, dY,
		n1, n2, n3,			// uninitialized intersection variables

		i,				// index into port vector
		n,				// loop limit, inner loop
		j,				// loop index, inner loop

		SP;				// output list in previous step

	     /* inside = function (Px, Py) {

			return (qx - px) * (Py - py) > (qy - py) * (Px - px);

		}; */				// replaced by inline calculations

		i = 0; do {

			qx = port [i ++];
			qy = port [i ++];

			sx = sp [sl - 2];
			sy = sp [sl - 1];

			SP = sp;
			sp = new Array ();

			n = sl;
			sl = 0;

			j = 0; do {

				ex = SP [j ++];
				ey = SP [j ++];

			     // if (inside (ex, ey)) {
				if ((qx - px) * (ey - py) > (qy - py) * (ex - px)) {

				     // if (!inside (sx, sy)) {
					if ((qx - px) * (sy - py) < (qy - py) * (sx - px)) {

						dx = px - qx;
						dy = py - qy;
						dX = sx - ex;
						dY = sy - ey;
						n1 = px * qy - py * qx;
						n2 = sx * ey - sy * ex;
						n3 = 1 / (dx * dY - dy * dX);

						sp [sl ++] = n3 * (n1 * dX - n2 * dx);
						sp [sl ++] = n3 * (n1 * dY - n2 * dy);

					}

					sp [sl ++] = ex;
					sp [sl ++] = ey;

				}

				else

			     // if (inside (sx, sy)) {
				if ((qx - px) * (sy - py) > (qy - py) * (sx - px)) {

					dx = px - qx;
					dy = py - qy;
					dX = sx - ex;
					dY = sy - ey;
					n1 = px * qy - py * qx;
					n2 = sx * ey - sy * ex;
					n3 = 1 / (dx * dY - dy * dX);

					sp [sl ++] = n3 * (n1 * dX - n2 * dx);
					sp [sl ++] = n3 * (n1 * dY - n2 * dy);

				}

				sx = ex;
				sy = ey;

			} while (j < n);

			if (sl === 0)

				return sp;

			px = qx;
			py = qy;

		} while (i < 8);

		return sp;

	};

	/*
	 *	----------
	 *	Rc publics
	 *	----------
	 */

	/*
	 *	right after instantiation you generally set the 2D viewport parameters:
	 *	this method does that according to given { width, height, focal, zClip }
	 *
	 *	      - focal determines the field of view (wider for smaller values),
	 *		zClip determines how close the camera can get to objects;
	 *
	 *	      - switching to a different viewport implying changes in its size,
	 *		center, focal or clipping parameters, requires any previously-
	 *		rendered meshes to be "rewired", i.e. to get rid of all cached
	 *		information about vertices' screen-space and pixel coordinates:
	 *		this is usually done on the entire scene, hence a scene manager
	 *		might provide a method to "rewire" the scene (check that out!)
	 */

	Rc.prototype.viewport = function (args) {

	  const w =  ~~ Math.max (2, be.number (args && args.width).or (this.w)),
		h =  ~~ Math.max (2, be.number (args && args.height).or (this.h)),
		d =	Math.max (1, be.number (args && args.focal).or (35)),
		k =	Math.max (1, be.number (args && args.zClip).or (10));

	  const W = w - 1,
		H = h - 1,
		q = d / this.X;

		this.i = w & 1 ? (w >> 1) : (w >> 1) + .5;
		this.j = h & 1 ? (h >> 1) : (h >> 1) + .5;
		this.w = w;
		this.h = h;
		this.W = W;
		this.H = H;
		this.f = d;
		this.d = d * Math.sqrt (q*q + h*h) / 50;
		this.p = d * Math.sqrt (q*q + h*h) / 50 * this.X;
		this.e = 1 / this.d;
		this.k = k;
		this.r = this.d / this.k;
		this.s = this.X * this.r;

		/*
		 *	these are the working edges for projected polygons' clipping,
		 *	which should normally include 1 extra pixel on the high ends,
		 *	to allow 1-px rounding errors, but which may work faster when
		 *	everything is clipped to the edges of the canvas, always, and
		 *	are therefore incremented on the low ends, and decremented on
		 *	the high ends; importantly, this is to be COMPLEMENTED by the
		 *	equivalent logic at Rc.prototype.mark, otherwise we would not
		 *	determine we need to clip the 2D projections of our polygons,
		 *	until they'd be beyond the intended limits
		 */

		return this.vp = [ 1, 1, W, 1, W, H, 1, H ], this;

	};

	/*
	 *	orient camera to given angle triplet { pitch, yaw, roll },
	 *	expressed in degrees
	 *
	 *	      - because we don't provide getters (they encourage bad performance),
	 *		we keep three reference values (Rc.a, Rc.b, Rc.c) to read back the
	 *		angles (as they were given) while they are internally converted to
	 *		radians and stored as coefficients (from circular functions)
	 */

	Rc.prototype.orient = function (args) {

	  const r = Math.PI / 180; // degrees to radians

		this.a = be.number (args && args.pitch).or (this.a);
		this.b = be.number (args && args.yaw).or (this.b);
		this.c = be.number (args && args.roll).or (this.c);

		this.sa = Math.sin (r * this.a);
		this.ca = Math.cos (r * this.a);
		this.sb = Math.sin (r * this.b);
		this.cb = Math.cos (r * this.b);
		this.sc = Math.sin (r * this.c);
		this.cc = Math.cos (r * this.c);

		return this;

	};

	/*
	 *	return angles to orient camera to given point { x, y, z }
	 */

	Rc.prototype.aimAt = function (args) {

	  const closestArc = function (start, target) {

			// normalize angles to [0-360] range

			start  %= 360;
			target %= 360;

			// find the shortest arc between the two

			return (target - start + 180) % 360 - 180;

		};	// contributed by ChatGPT 3.5 :)

	    let givenX = be.number (args && args.from && args.from.x).or (this.x);
	    let givenY = be.number (args && args.from && args.from.y).or (this.y);
	    let givenZ = be.number (args && args.from && args.from.z).or (this.z);

	    let x = be.number (args && args.x).or (0) - givenX;
	    let y = be.number (args && args.y).or (0) - givenY;
	    let z = be.number (args && args.z).or (0) - givenZ;
	    let d = Math.sqrt (Math.max (0.01, x * x + z * z));

	  const r = 180 / Math.PI; // radians to degrees

		return {

			pitch:	this.a + closestArc (this.a, r * Math.atan  (y / d)),
			yaw:	this.b + closestArc (this.b, r * Math.atan2 (-x, z))

		};

	};

	/*
	 *	orient camera to given point { x, y, z }
	 */

	Rc.prototype.lookAt = function (args) {

	    let angles = this.aimAt (args);

		this.orient ({ pitch: angles.pitch, yaw: angles.yaw });
		return this;

	};

	/*
	 *	limit camera movements such that its coordinates fall between
	 *	the given [mx-Mx], [my-My] and [mz-Mz] ranges
	 */

	Rc.prototype.constrict = function (args) {

		this.mx = be.number (args && args.mx).or (this.mx);
		this.Mx = be.number (args && args.Mx).or (this.Mx);
		this.my = be.number (args && args.my).or (this.my);
		this.My = be.number (args && args.My).or (this.My);
		this.mz = be.number (args && args.mz).or (this.mz);
		this.Mz = be.number (args && args.Mz).or (this.Mz);

		return this;

	};

	/*
	 *	position camera to given coordinate triplet { x, y, z },
	 *	respecting the above set limits
	 */

	Rc.prototype.viewFrom = function (args) {

		this.x = Math.min (Math.max (be.number (args && args.x).or (this.x), this.mx), this.Mx);
		this.y = Math.min (Math.max (be.number (args && args.y).or (this.y), this.my), this.My);
		this.z = Math.min (Math.max (be.number (args && args.z).or (this.z), this.mz), this.Mz);

		return this;

	};

	/*
	 *	forward the camera in the direction resulting from the current
	 *	pitch and yaw, by a number of length units equal to { delta }
	 */

	Rc.prototype.fwd = function (args) {

	  const d = be.number (args && args.delta).or (0);

		return ({

			x: - d * this.ca * this.sb,
			y: + d * this.sa,
			z: + d * this.ca * this.cb

		});

	};

	Rc.prototype.str = function (args) {

	  const b = Math.PI / 180 * (this.b - 90),
		d = be.number (args && args.delta).or (0);

		return ({

			x: - d * this.ca * Math.sin (b),
			y: + d * this.sc,
			z: + d * this.ca * Math.cos (b)

		});

	};

	Rc.prototype.forward = function (args) {

	  const d = be.number (args && args.delta).or (0);

		this.x = Math.min (Math.max (this.mx, this.x - d * this.ca * this.sb), this.Mx);
		this.y = Math.min (Math.max (this.my, this.y + d * this.sa), this.My);
		this.z = Math.min (Math.max (this.mz, this.z + d * this.ca * this.cb), this.Mz);

		return this;

	};

	/*
	 *	parses the rototranslated coordinates for a point at { x; y; z },
	 *	and checks if the normal distance of the said point from the four
	 *	planes delimiting the viewport is low enough for an object having
	 *	a circumsphere of radius c to intersect them or be bound by them,
	 *	i.e. checks if that volume is "visibly on screen", in whole or in
	 *	part included in the so-called "view frustum"; it returns true if
	 *	it is, false otherwise
	 *
	 *	      - it's implemented in an "as quickly as possible" fashion,
	 *		giving precedence to excluding what's totally behind the
	 *		camera, proceding to exclude whatever lays out of sight,
	 *		first horizontally - along x - then vertically, assuming
	 *		a scene's objects will be spread more often horizontally
	 *		than vertically, and only otherwise running in full, and
	 *		finally returning true to the caller
	 */

	Rc.prototype.scan = function (c, x, y, z) {

		x =	     x - this.x;
		y = this.D * y - this.y;
		z =	     z - this.z;

	  const t = z * this.cb - x * this.sb,
		w = t * this.ca + y * this.sa + c;

		if (w < this.k)

			return false; // circumsphere entirely behind projection plane (view point)

	  const r = x * this.cb + z * this.sb,
		s = y * this.ca - t * this.sa;

		if (this.p * (Math.abs (r * this.cc + s * this.sc) - c) > w * this.i)

			return false; // c/s neither bound nor intersected by left and right planes

		if (this.d * (Math.abs (s * this.cc - r * this.sc) - c) > w * this.j)

			return false; // c/s neither bound nor intersected by top and bottom planes

		return true;

	};

	/*
	 *	computes the culling step for a mesh m of circumradius r at distance d and point p,
	 *	basing on adimensional culling factor f (for larger f, there is more detail)
	 */

	Rc.prototype.stepFor = function (m, r, f, d, p) {

		return this.scan (r, p.x, p.y, p.z) ? ~~ Math.min (0x100 * Math.max ((d * d) / (this.S * r * f * m.plicity) - 1, 1), 0x7FFFFFFF) : 0;

	};

	/*
	 *	quicker version of the above:
	 *	this doesn't check visibility, assuming it's granted
	 */

	Rc.prototype.stepForVisible = function (m, r, f, d) {

		return ~~ Math.min (0x100 * Math.max ((d * d) / (this.S * r * f * m.plicity) - 1, 1), 0x7FFFFFFF);

	};

	/*
	 *	instantiates a new vertex array out of a point at { x, y, z }:
	 *	the result can be passed (one or more times) to .moveTo and .wireTo
	 */

	Rc.prototype.point = function (args) {

		return this.pt ([

			be.number (args && args.x).or (0),
			be.number (args && args.y).or (0),
			be.number (args && args.z).or (0), 0,0,0,0,0,0,0

		]);

	};

	/*
	 *	here actual rendering begins:
	 *	this moves the lightpen to the given point p (which is a vertex array)
	 */

	Rc.prototype.moveTo = function (p) {

		/*
		 *	zero Subject Length,
		 *	assert figure not yet open,
		 *	assert figure does not yet need 2D clipping,
		 */

		this.sl = 0;
		this.of = true;
		this.cf = false;

		/*
		 *	record first point and new lightpen coordinates:
		 *	if point isn't ahead of the z-clipping plane, bypass recording 2D coords.
		 */

		this.lx = this.fp [4] = p [4];
		this.ly = this.fp [5] = p [5];
		this.lz = this.fp [6] = p [6];
		this.vf = this.fp [7] = p [7];

		if (this.vf === 1) {

			this.li = this.fp [8] = p [8];
			this.lj = this.fp [9] = p [9];

		}

		return this;

	};

	/*
	 *	after moving to a starting point, draw to the subsequent point:
	 *	traces a wire from the current lightpen coordinates to the given point p
	 */

	Rc.prototype.wireTo = function (p) {

	    var x, y, q;

		/*
		 *	z-clip to plane z = k
		 */

		if (this.vf === 0) {

			if (p [7] === 0) {

				/*
				 *	update current lightpen coordinates
				 */

				this.lx = p [4];
				this.ly = p [5];
				this.lz = p [6];

				return this;

			} // also ending point before clipping plane (wire not visible)

			if ((q = p [6] - this.lz) < this.l) {

				x = p [4];
				y = p [5];

			} // depth considered same

			else {

				q = (this.k - this.lz) / q;

				x = this.lx + q * (p [4] - this.lx);
				y = this.ly + q * (p [5] - this.ly);

			} // depth not considered same

			/*
			 *	project { x, y, k } over z = d and mark point
			 */

			this.mark (this.s * x + this.i, this.j - this.r * y);
			this.mark (p [8], p [9]);

			/*
			 *	update current lightpen coordinates
			 */

			this.lx = p [4];
			this.ly = p [5];
			this.lz = p [6];
			this.li = p [8];
			this.lj = p [9];
			this.vf = 1;
			this.of = false;

			return this;

		} // starting point before clipping plane (starting point not visible)

		if (p [7] === 0) {

			if ((q = this.lz - p [6]) < this.l) {

				x = p [4];
				y = p [5];

			} // depth considered same

			else {

				q = (this.lz - this.k) / q;

				x = this.lx + q * (p [4] - this.lx);
				y = this.ly + q * (p [5] - this.ly);

			} // depth not considered same

			/*
			 *	project { x, y, k } over z = d and mark point
			 */

			if (this.of === true) {

				this.mark (this.li, this.lj);
				this.of = false;

			}

			this.mark (this.s * x + this.i, this.j - this.r * y);

			/*
			 *	update current lightpen coordinates
			 */

			this.lx = p [4];
			this.ly = p [5];
			this.lz = p [6];
			this.vf = 0;

			return this;

		} // ending point before clipping plane (ending point not visible)

		/*
		 *	mark (entirely visible) wire
		 */

		if (this.of === true) {

			this.mark (this.li, this.lj);
			this.of = false;

		}

		this.mark (p [8], p [9]);

		/*
		 *	update current lightpen coordinates
		 */

		this.lx = p [4];
		this.ly = p [5];
		this.lz = p [6];
		this.li = p [8];
		this.lj = p [9];
		this.vf = 1;

		return this;

	};

	/*
	 *	after the last call to .wireTo for each polygon, close the lightpen's path,
	 *	ending the figure and finalizing its projected vertices on the 2D viewport,
	 *	then fill the resulting shape (in target canvas' fillStyle and globalAlpha)
	 */

	Rc.prototype.fill = function (fs, ga) {

	    var r, l, i;

		this.fp [7] + this.vf === 2 || this.wireTo (this.fp);

		if (this.cf === false) {

			r = this.sp;
			l = this.sl;

		}

		else {

			r = this.clip ();
			l = r.length;

		}

		if (l > 5) {

			RC.FS === fs || (this.cx.fillStyle = RC.FS = fs);
			RC.GA === ga || (this.cx.globalAlpha = RC.GA = ga);

			this.cx.beginPath ();
			this.cx.moveTo (r [0], r [1]);

			for (i = 2; i < l; i = i + 2)

				this.cx.lineTo (r [i], r [i + 1]);

			this.cx.closePath ();
			this.cx.fill ();

		}

		return this;

	};

	/*
	 *
	 *	===================================================================
	 *	Wavefront OBJ file parser, model geometry handling, model rendering
	 *	===================================================================
	 *
	 *	Copyright 2018-2024 by Alessandro Ghignola
	 *	Public domain - but you're on your own. :)
	 *
	 */

	Model = function (args) {

		this.mould = this;		// equalize references between Model and MultiModel
		this.void = new Array ();	// common "void" array (reduces garbage collection)

		/*
		 *	constructor arguments aside model's OBJ file content (the "from" argument):
		 *	edge thickness, relevance threshold (largest/subject area ratio) when depth
		 *	culling, "flat" flag (the model needs no depth sorting for face groups, for
		 *	models which are literally flat or which are meant to render as silouetthes
		 *	anyway), "solid" flag (the model would participate in searches to determine
		 *	the ground level in World.ground), "bright" flag to treat an over-thickened
		 *	face as a completely bright face: when false, such faces will be discarded;
		 *	the "shiny" flag makes the entire model's brightness a constant 50%, rather
		 *	than adjust it according to the viewing angle (benefiting long flat objects
		 *	seen at high angles with respect to the normal of their faces, for example,
		 *	long road stripes)
		 */

		this.thickness = Math.max (1E-4, be.number (args && args.thickness).or (.01));
		this.threshold = be.number (args && args.threshold).or (.1);
		this.flat = be.switch (args && args.flat).or (false);
		this.solid = be.switch (args && args.solid).or (false);
		this.bright = be.switch (args && args.bright).or (true);
		this.shiny = be.switch (args && args.shiny).or (false);
		this.spacing = be.number (args && args.spacing).or (1);
		this.noFile = be.switch (args && args.noFile).or (false);
		this.givenRelevants = be.vector (args && args.relevants).or (null);

		/*
		 *	create dictionaries and references
		 */

		this.D = new Object (); 	// vtx "dictionary" associates points to vertex IDs

		/*
		 *	create all the rest of properties:
		 *	this is needed to avoid hidden class changes at any point
		 */

		this.objFile = new String ();	// clean obj file dump
		this.vertices = new Array ();	// vertices array
		this.faces = new Array ();	// faces array
		this.groups = new Array ();	// groups array (grouping faces to render together)
		this.children = new Array ();	// array of child records (see .addChild)
		this.circumRadius = 0;		// circumsphere radius
		this.plicity = 1;		// simplicity (avg. group radius over circumradius)
		this.stepping = 0x100;		// stepping value for culling loose-geometry models
		this.surface = 0;		// grand total (all polygonal faces' initial areas)
		this.largest = 0;		// largest area (out of all polygonal faces' areas)
		this.transId = 1;		// transform ID (increments after rotating/scaling)
		this.xOrigin = 0;		// origin's x coordinate (accumulates translations)
		this.yOrigin = 0;		// origin's y coordinate (accumulates translations)
		this.zOrigin = 0;		// origin's z coordinate (accumulates translations)
		this.relevants = new Array ();	// relevant faces that should not be "depth-culled"
		this.fRendered = new Array ();	// relevant faces that don't need to be "forced in"
		this.rUnculled = new Array ();	// relevant faces that WOULD need to be "forced in"
		this.nUnculled = 0;		// number of _effective_ entries in the above array
		this.rGroups = new Array ();	// array of visible groups (stored by selectGroups)
		this.nGroups = 0;		// number of visible groups (set with selectGroups)
		this.brilliance = 1E9;		// brilliance factor (the higher, the brighter)
		this.spaced = this.spacing < 1; // marks non-wired models
		this.normalized = false;	// marks normalized geometry with Y >= 0 everywhere
		this.ceiling = 0;		// height of the ceiling, found during finalization
		this.circumCenter = 0;		// distance factor implied by normalized geometries
		this.excepted = false;		// flag: ALL faces in non-spaced model are excepted

		return this.parse (args);	// parse the "from" string, return the new instance

	};

	Model.prototype.vertex = function (x, y, z) {

	  const X = Math.round (1E6 * x),
		Y = Math.round (1E6 * y),
		Z = Math.round (1E6 * z),

		v = [ X, Y, Z ].join ( );

		/*
		 *	a dictionary of vertices is maintained to prevent occurrence of points
		 *	that are close, but don't share the exact same coordinates, in models:
		 *	the dictionary (D) is indexed by a string representation (v, above) of
		 *	the three coordinates; the method returns an existing vertex record if
		 *	it finds one in the dictionary sharing coordinates with the new vertex
		 */

		this.D [v] || this.vertices.push (this.D [v] = [

			1E-6 * X,		// x (as effective now, i.e. as transformed)
			1E-6 * Y,		// y (as effective now, i.e. as transformed)
			1E-6 * Z,		// z (as effective now, i.e. as transformed)

			0,			// last transform ID (world-to-screen-space)

			0,			// x (screen-space)	|
			0,			// y (screen-space)	|
			0,			// z (screen-space)	| see the "pt"
			0,			// visibile (yes=1)	| method in Rc
			0,			// i (rasterized x)	|
			0,			// j (rasterized y)	|

			1E-6 * X,		// backup original x (in the "reset" method)
			1E-6 * Y,		// backup original y (in the "reset" method)
			1E-6 * Z,		// backup original z (in the "reset" method)

			0,			// transform ID (rotation and resizing only)

			this.vertices.length	// progressive vertex ID (a zero-base index)

		]);

		return this.D [v];

	};

	Model.prototype.face = function (p) {

	  const abs = Math.abs,

		a = p [0],
		b = p [1],
		c = p [2],

		n = Maths.unitize (Maths.normalTo (a, b, c)),

		u = abs (n [0]) > .001 ? Math.round (n [0] * 0x07FB0000) : 0,
		v = abs (n [1]) > .001 ? Math.round (n [1] * 0x0003FD00) : 0,
		w = abs (n [2]) > .001 ? Math.round (n [2] * 0x000001FE) : 0,

		U = - u || 0,	// get rid of the fucking MINUS ZERO before encoding surface IDs
		V = - v || 0,	// get rid of the fucking MINUS ZERO before encoding surface IDs
		W = - w || 0,	// get rid of the fucking MINUS ZERO before encoding surface IDs

		f = {

			path: [

				a,
				b

			],	// the path is an array of references to the vertices, as tuples

			numericPath: [

				a [14],
				b [14]

			],	// the "numeric path" is an array of IDs of vertices in the path

			/*
			 *	the midpoint and surfaceNormal entries are 6-element arrays because
			 *	the additional three elements hold untransformed backup values; the
			 *	rest is pretty self-explanatory
			 */

			midpoint_0:		       .1,		// avg. of coordinates
			midpoint_1:		       .1,
			midpoint_2:		       .1,

			midpoint_3:		       .1,		// Model.reset backups
			midpoint_4:		       .1,
			midpoint_5:		       .1,

			surfaceNormal_0:		n [0],		// object-space normal
			surfaceNormal_1:		n [1],
			surfaceNormal_2:		n [2],

			surfaceNormal_3:		n [0],		// Model.reset backups
			surfaceNormal_4:		n [1],
			surfaceNormal_5:		n [2],

			/*
			 *	miscellanea
			 */

			actualRadius:		       .1,		// same as below but scaled
			circumRadius:		       .1,		// i.e. circumsphere radius
			wire:				false,		// false = dark/true = wire
			edge:				false,		// edge, if ideally an edge
			area:				0,		// only if not part of wire
			edges:				null,		// working edges dictionary
			neighbors:			this.void,	// adjacencies, as of .pair
			collection:			false,		// coplanar adjacencies grp

			surfaceID_n:

				(abs (u) & 0x07FC0000) | (abs (v) & 0x0003FE00) | (abs (w) & 0x000001FF) |
				((u & 0x80000000)>>>1) | ((v & 0x80000000)>>>2) | ((w & 0x80000000)>>>3) ,

			surfaceID_s:

				(abs (U) & 0x07FC0000) | (abs (V) & 0x0003FE00) | (abs (W) & 0x000001FF) |
				((U & 0x80000000)>>>1) | ((V & 0x80000000)>>>2) | ((W & 0x80000000)>>>3)

		};

	    var x = a [0] + b [0],
		y = a [1] + b [1],
		z = a [2] + b [2],

		i = 2,
		k = 1 / p.length;

		do {

			x = x + p [i] [0];
			y = y + p [i] [1];
			z = z + p [i] [2];

			f.path.push (p [i]);
			f.numericPath.push (p [i] [14]);

		} while (++ i < p.length);

		f.midpoint_0 = f.midpoint_3 = k * x;
		f.midpoint_1 = f.midpoint_4 = k * y;
		f.midpoint_2 = f.midpoint_5 = k * z;

		f.actualRadius = f.circumRadius = 0;
		i = 0;

		do {

			x = p [i] [0] - f.midpoint_0;
			y = p [i] [1] - f.midpoint_1;
			z = p [i] [2] - f.midpoint_2;
			k = Math.sqrt (x*x + y*y + z*z);

			if (k > f.circumRadius)

				f.actualRadius = f.circumRadius = k;

		} while (++ i < p.length);

		return this.faces.push (f), f;

	};

	Model.prototype.group = function (g) {

		/*
		 *	albeit mostly in rendering purposes, faces become effective only if
		 *	they're added to a group: a group will hold even just one face, but
		 *	hold more where component faces are meant to be sorted and rendered
		 *	together, as a whole
		 */

	    var g = {	// begin group record

			id:		     ++ World.generator,	// unique group ID
			model:			false,			// not a child model
			relevant:		false,			// not relevant, yet

			distance:		1,

			faces:			g,			//
			area:			0,			//
			actualRadius:		g [0].actualRadius,	//
			circumRadius:		g [0].circumRadius,	//
			midpoint_0:		g [0].midpoint_0,	//
			midpoint_1:		g [0].midpoint_1,	//
			midpoint_2:		g [0].midpoint_2,	//
			midpoint_3:		g [0].midpoint_3,	// self-explanatory
			midpoint_4:		g [0].midpoint_4,	// stuff, see above
			midpoint_5:		g [0].midpoint_5,	//
			surfaceNormal_0:	g [0].surfaceNormal_0,	//
			surfaceNormal_1:	g [0].surfaceNormal_1,	//
			surfaceNormal_2:	g [0].surfaceNormal_2,	//
			surfaceNormal_3:	g [0].surfaceNormal_3,	//
			surfaceNormal_4:	g [0].surfaceNormal_4,	//
			surfaceNormal_5:	g [0].surfaceNormal_5	//

		};	// end group record

		/*
		 *	before pushing the group into the model's groups list, what follows
		 *	computes the total area by adding up every face's area: while being
		 *	pretty much wrong when, as usual, groups feature overlapping faces,
		 *	being one or more dark ones and one or more bright "wire" edges out
		 *	of a common entry polygon, wire edge areas aren't usually assigned,
		 *	and left to a default of zero; when, instead, this function is used
		 *	to add groups of coplanar adjacent dark faces by an .outline method
		 *	call, adding up their areas will be the right thing to do...
		 */

		for (var i in g.faces)

			g.area = g.area + g.faces [i].area;

		return this.groups.push (g), g;

	};

	Model.prototype.end = function () {

	  const G = this.groups,
		L = this.largest,
		T = this.threshold;

		/*
		 *	end the model's construction:
		 *
		 *	      - clear vertices dictionary, freeing memory
		 *	      - reset relevant faces array, to a void one
		 *	      - re-allocate full-size visible faces array
		 *	      - allocate exact-size, depth culling arrays
		 *	      - precalculate model's overall "brilliance"
		 */

		this.D = null;
		this.rGroups = new Array (this.groups.length);

		if (this.givenRelevants) {

			this.relevants = this.givenRelevants;

			for (let i in this.relevants)

				G [i] && (G [i].relevant = true);

		}

		else {

			this.relevants = new Array;

			for (let i in this.groups)

				if (G [i].area / L > T) {

					G [i].relevant = true;
					this.relevants.push (parseInt (i));

				}

		}

		this.fRendered = new Array (this.groups.length);
		this.rUnculled = new Array (this.relevants.length);

		this.spaced && (this.brilliance = 9E9 * Math.sqrt (this.groups.length));
		this.spaced || (this.brilliance = 9E9 * this.surface / Math.sqrt (this.groups.length));

		return this.reset ({ init: true });

	};

	/*
	 *	returns a .OBJ reconstruction of the model's geometry
	 */

	Model.prototype.to_obj = function (args) {

	  const $ = function (n) {

			return (n.toFixed (5).replace (/\.?0+$/, empty) || '0').replace (/^(\-?)0\./, '$1.')

		}; // strips all trailing and leading zeros from values (.obj specs say nothing about those)

	  const B = String.fromCharCode (32),					// blank space
		V = be.vector (args && args.vertices).or (this.vertices),	// vertices array
		F = be.vector (args && args.faces).or (this.faces),		// faces array
		m = V.length,							// loop count in vertices
		n = F.length,							// loop count in faces
		f = be.number (args && args.scaling).or (1);			// scaling factor

	    var r = 'o spectrum.obj',

		i,
		x,
		y,
		z,
		p,
		j;

		if (m === 0)

			return r;

		i = 0; do {

			x =   f * V [i] [10];
			y =   f * V [i] [11];
			z = - f * V [i] [12];	// reverse back Z axis

			r = r + '\n' + [ 'v', $(x), $(y), $(z) ].join (B);

		} while (++ i < m); // each vertex

		if (n === 0)

			return r;

		i = 0; do {

			p = F [i].numericPath.slice (0);

			j = 0; do {

				p [j] = p [j] + 1;

			} while (++ j < p.length);

			r = r + '\nf' + B + p.join (B);

		} while (++ i < n); // each face

		return r;

	};

	Model.prototype.parse = function (args) {

	  const M = be.string (args && args.from).or ('\n'),

		H = this.thickness,		// required edge thickness
		V = this.vertices,		// vertices array
		I = new Object (),		// local dictionary of vertices
		F = new Array (),		// local list of clean faces
		B = String.fromCharCode (32);	// blank space

	    var J = 1,				// first entry index in dictionary

		objects, i,			// objects array, loop index
		lines,	 j, m,			// lines' array, loop index, loop count
		values,  k, x, y, z,		// values array, loop index, coordinates' values

		v, p, r, f, g,			// vertex, path, reconstructed indices, face, group
		e, c, d,			// edge profile, and extremes of the last edge face
		P, R, X,			// final path, final numeric path, exceptions count

		/*
		 *	separate groups ("g" entries) in model file,
		 *	assume "o" entries are the same
		 *
		 *	      - note we always need a line feed before the first "o" or "g" entry,
		 *		and ensuring the presence of that line (or just a line feed) will
		 *		be the responsibility of the caller;
		 *
		 *	      - also note we may be easily dealing with mangled files of all sorts,
		 *		hence the treatment of adjacent or misplaced whitespace characters
		 */

		objects = M.

			replace (/\r\n/g, '\n').	// normalize line feeds
			replace (/\x20{2,}/g, B).	// replace subsequent whitespaces with one
			replace (/^\x20|\x20$/, '').	// remove initial and trailing whitespaces
			split	(/\n[go]\s/);		// split by group and object (g/o) entries

		/*
		 *	loop for objects:
		 *	each object found in the model file becomes PART of the same mesh
		 */

		i = 0; do {

			/*
			 *	split and count lines in object body:
			 *	cr/lf were already converted to lf only, if present
			 */

			lines = objects [i].split ('\n');

			if ((m = lines.length) === 0)

				continue;

			/*
			 *	fetch all vertices ("v" entries) in declaration
			 */

			j = 0; do {

				values = lines [j].split (/^v\s/);

				if (values.length < 2)

					/*
					 *	not a vertex record:
					 *	ignored in this loop
					 */

					continue;

				values = values [1].split (/\s/);

				if (values.length < 3)

					/*
					 *	inconsistent vertex record:
					 *	three coordinates are expected
					 */

					continue;

				if (

					isNaN (x = parseFloat (values [0])) ||
					isNaN (y = parseFloat (values [1])) ||
					isNaN (z = parseFloat (values [2]))

				)

					/*
					 *	inconsistent vertex record:
					 *	non-number(s) found in line
					 */

					continue;

				I [J ++] = this.vertex (x, y, -z) [14];

			} while (++ j < m); // ends vertices loop

			/*
			 *	fetch all faces ("f" entries) in declaration
			 */

			j = 0;

		 outer: do {

				values = lines [j].split (/^f\s/);

				if (values.length < 2)

					/*
					 *	not a face record:
					 *	ignored in this loop
					 */

					continue;

				values = values [1].split (/\s/);

				if (values.length < 3)

					/*
					 *	inconsistent face record:
					 *	at least three vertices are expected
					 */

					continue;

				p = new Array ();
				r = new Array ();

				for (k in values) {

					if (isNaN  (v = parseInt (values [k].split ('/').shift ())))

						continue outer; // non-number found in line

					if (typeof (v = values [k] = I [v]) === 'undefined')

						continue outer; // reference to an undeclared vertex

					if (Maths.consec (v = V [v], p)) {

						/*
						 *	this vertex will be consecutive to the last
						 *	two, hence, pop (delete) the last vertex to
						 *	then proceed appending this one in place of
						 *	the former last
						 */

						p.pop ();
						r.pop ();

					}

					p.push (v);
					r.push (values [k]);

				}

				if (p.length > 2 && Maths.consec (p [0], p)) {

					/*
					 *	if the first vertex (which could not be checked for
					 *	this condition while the path was assembled, above)
					 *	wound up being consecutive to the last two vertices
					 *	then we shall now pop the last vertex...
					 */

					p.pop ();
					r.pop ();

				}

				if (p.length > 2 && Maths.consec (p [1], p [p.length - 1], p [0])) {

					/*
					 *	possibly after the above, second vertex consecutive
					 *	to the last and first: shall shift out the first...
					 */

					p.shift ();
					r.shift ();

				}

				P = p.slice (0, 1);
				R = r.slice (0, 1);

				for (k = 1; k < p.length; ++ k) {

					if (r [k] == R [k - 1])

						continue;

					P.push (p [k]);
					R.push (r [k]);

				} // remove doubles

				if (P.length < 3)

					/*
					 *	after all checks, is this a degenerate face record?
					 *	at least 3 NON-CONSECUTIVE vertices make it proper!
					 */

					continue;

				F.push ({ path: P, numericPath: R })

			} while (++ j < m);		// ends faces loop

		} while (++ i < objects.length);	// ends objects loop

		/*
		 *	unless asked not to,
		 *	create a clean dump, in obj format stripping out all we don't need
		 */

		this.noFile || (this.objFile = this.to_obj ({ faces: F }));

		/*
		 *	loop through clean faces,
		 *	processing them according to wire thickness and overall parameters
		 */

		if (F.length === 0)

			return this.end ();

		X = 0; i = 0; do {

			p = F [i].path;
			r = F [i].numericPath;

			if (this.spaced) {

				f = this.face (p);

				f.actualRadius = f.circumRadius = f.circumRadius * this.spacing;
				f.wire = true;
				f.area = Maths.process (f, 0, true).area;

				this.surface = this.surface + f.area;
				this.largest = Math.max (f.area, this.largest);

				for (v in f.path) {

					x = this.spacing * (f.path [v] [0] - f.midpoint_0) + f.midpoint_0;
					y = this.spacing * (f.path [v] [1] - f.midpoint_1) + f.midpoint_1;
					z = this.spacing * (f.path [v] [2] - f.midpoint_2) + f.midpoint_2;

					f.path [v] = this.vertex (x, y, z);

				}

				this.group ([ f ]);
				continue;

			}

			f = this.face (p);
			e = Maths.process (f, H);

			this.surface = this.surface + (f.area = e.area);
			this.largest = Math.max (e.area, this.largest);

			if (e.except)

				if (this.bright) {

					this.group ([ f ], f.wire = true, ++ X);
					continue;

				}

				else {

					this.faces.pop (++ X);
					continue;

				}

			g = [ f ];
			p = [ ];

			for (k in r) {

				v = r [k];
				p.push (V [v]);

			}

			for (k in e.edge) {

				v = e.edge [k];
				p.push (this.vertex (v.x, v.y, v.z));

			}

			g.push (f = this.face (p));
			f.wire = f.edge = true;

			p = [

				V [r.shift ()],
				V [r.pop ()],
				this.vertex ((c = e.edge.shift ()).x, c.y, c.z),
				this.vertex ((d = e.edge.pop ()).x, d.y, d.z)

			];

			g.push (f = this.face (p));
			f.wire = f.edge = true;

			this.group (g);

		} while (++ i < F.length);

		return this.end (this.excepted = X === F.length);

	};

	/*
	 *	normalizes the model's geometry such that it fits entirely above the +Y plane, with
	 *	its bounding box resting on that plane, and its geometric center at the midpoint of
	 *	its geometry
	 */

	Model.prototype.normalize = function () {

	  const F = this.faces, 		// model faces' array
		G = this.groups,		// model groups' array
		V = this.vertices;		// model vertices' array

	    var B, L, R, N, f,			// bottom (to find along y), left, right, near, far
		i, g, j, r,			// grp. index, grp. record, face index, face record
		X, Z;				// translation factors to center this mesh's origin

		/*
		 *	is the mesh void?
		 */

		if (V.length === 0)

			return this;

		/*
		 *	find overall minimum along Y: don't start from + Infinity because we'd only
		 *	just care about negative minimums - if the entire mesh is already above the
		 *	base plane (Y = 0) we just leave it as is...
		 */

		B = 0;
		L = + Infinity;
		R = - Infinity;
		N = + Infinity;
		f = - Infinity;

		i = 0; do {

			V [i] [0] < L && (L = V [i] [0]);
			V [i] [0] > R && (R = V [i] [0]);
			V [i] [2] < N && (N = V [i] [2]);
			V [i] [2] > f && (f = V [i] [2]);
			V [i] [1] < B && (B = V [i] [1]);

		} while (++ i < V.length);

		/*
		 *	set translation factors to bring everything to the geometric midpoint along
		 *	X and Z, and on top of the base plane along Y
		 */

		X = .5 * (L + R);
		Z = .5 * (N + f);

		/*
		 *	transform all vertices
		 */

		i = 0; do {

			V [i] [0] -= X;
			V [i] [1] -= B;
			V [i] [2] -= Z;

		} while (++ i < V.length);

		/*
		 *	transform all groups, all faces
		 */

		for (i = 0; i < G.length; ++ i) {

			g = G [i];

			if (g.model)

				continue; // child model (shouldn't be here, but...)

			g.midpoint_0 -= X;
			g.midpoint_1 -= B;
			g.midpoint_2 -= Z;

			j = 0; do {

				r = g.faces [j];

				r.midpoint_0 -= X;
				r.midpoint_1 -= B;
				r.midpoint_2 -= Z;

			} while (++ j < g.faces.length);

		}

		return this.normalized = true, this;

	};

	/*
	 *	this creates a "neighbors" array in each face record of the mesh: those arrays list
	 *	faces being adjacent (sharing at least a side) with the face the record belongs to,
	 *	and enables various forms of post-processing such as in the "outline" method
	 */

	Model.prototype.pair = function () {

	  const H = new Object (),	// brings to an array that tracks which faces use a vertex
		I = new Object (),	// indexes an array where faces repeat if sharing vertices

		F = this.faces, 	// mesh faces array
		n = this.faces.length;	// loop count in faces

	    var i,			// loop index in faces
		f,			// face record
		p,			// path record in face
		m,			// loop count in path (first pass), then shared face count
		j,			// loop index in path (first pass), then shared face index
		v,			// vertex ID (first pass), actual face index (second pass)
		r,			// vertex users' array (1st pass), recurrencies (2nd pass)
		R,			// vertex shared use flags (second pass)
		N,			// neighbor's shared verts (second pass)
		M,			// neighbor's shared verts (second pass)
		X,			// neighbor's shared edges (second pass)
		Y,			// neighbor's shared edges (second pass)
		g,			// neighboring face record
		q,			// neighboring face's path

		a, b,			// subject and neighbor path indices in search
		A,			// subject vertex ID, index in shared vertices
		e;			// edge checksum while matching adjacent edges

		/*
		 *	first loop maintains an object H, indexing arrays by vertex ID, where each
		 *	array lists faces (by index) using that vertex, and fills the object I, to
		 *	track which faces share vertices with which others by joining arrays of H:
		 *	at the end of the outer loop, arrays in object I would list recurring face
		 *	indices in cases where the face shares vertices with the recurring indices
		 */

		if (n === 0)

			return this;

		i = 0; do {

			f = F [i];

			if (f.edge === true)

				continue; // do not process wire faces and their surface ID "match"

			/*
			 *	in face record,
			 *	replace placeholders with working instances
			 */

			f.edges = new Object ();
			f.neighbors = new Array ();

			/*
			 *	generate work dictionary of edges,
			 *	indexed by hashes derived from vertex pairs (extremes of each edge)
			 */

			p = f.numericPath;
			m = p.length;

			f.edges [1E6 * p [m - 1] + p [0]] = true;
			f.edges [1E6 * p [0] + p [m - 1]] = true;

			j = 1; do {

				f.edges [1E6 * p [j - 1] + p [j]] = true;
				f.edges [1E6 * p [j] + p [j - 1]] = true;

			} while (++ j < m);

			/*
			 *	generate the vertex-used-by-face tracking array,
			 *	update the I object
			 */

			p = f.path;
			m = p.length;

			j = 0; do {

				v = p [j] [14];

				/*
				 *	finding a vertex for the first time in the path
				 *	of a face? then create an array of face indices
				 *	with a single entry (this face)
				 */

				if (typeof (r = H [v]) === 'undefined') {

					H [v] = [ i ];
					continue;

				}

				/*
				 *	vertex is being used by more than a single face,
				 *	i.e. this is no "loose" geometry, and therefore
				 *	appending indices from H's record to I's record,
				 *	before pushing this occurrence in to H's record
				 */

				if (typeof I [i] === 'undefined')

					I [i] = [ ].concat (r); // build a new reference record

				else

					I [i] = I [i].concat (r); // append to reference record

				r.push (i); // update vtx users

			} while (++ j < m); // each vertex in face path

		} while (++ i < n); // each face in mesh

		/*
		 *	second pass collects recurrencies in object I and joins neighboring faces
		 *	by constructing the "neighbors" array in each face record that shares two
		 *	or more vertices with a face encountered before
		 */

		i = 0; do {

			if (typeof (r = I [i]) === 'undefined')

				continue; // loose geometry: no shared vertices

			/*
			 *	face at index i shares vertices with other faces (which is
			 *	the norm): maintain a temporary object R, collecting flags
			 *	telling when a face index occurs twice or more in object I
			 *	from the first loop, joining the second face as a neighbor
			 *	of each recurring entry when that flag is true
			 */

			f = F [i];
			m = r.length;
			R = new Object ();

			j = 0; do {

				v = r [j];

				if (R [v] === true) {

					/*
					 *	recurrent face index found: when a neighbor
					 *	record is created, it is an array beginning
					 *	with the face index of the neighboring face
					 *	followed by at least a couple vertex IDs of
					 *	the vertices being shared
					 *
					 *	      - search is done in an n*n complexity
					 *		but I would not mind hashing, since
					 *		face paths are typically very short
					 *		and .pair is a one-timer (would not
					 *		execute each time something's done:
					 *		only once, after finalizing a mesh)
					 */

					N = new Array ();
					M = new Array ();
					X = [ v ];
					Y = [ i ];
					g = F [v];
					p = f.numericPath;
					q = g.numericPath;

					a = 0; do {

						A = p [a];

						b = 0; do {

							if (A === q [b]) {

								N.push (A);
								M.push (A);

							} // record shared edge's vertices

						} while (++ b < q.length);

					} while (++ a < p.length);

					/*
					 *	having found vertices (from face #i path) in common
					 *	with adjacent face #v, now match those edges which,
					 *	in BOTH face paths, run between any two of the said
					 *	vertices, and create two arrays (one per face) that
					 *	list those edges, adding to the X and Y arrays that
					 *	started with the neighboring face index
					 */

					a = N [N.length - 1];
					b = N [0];
					e = 1E6 * a + b;

					if (f.edges [e] && g.edges [e]) {

						X.push (b);
						X.push (a);

					} // segment between last and first shared vertex in list N

					if (N.length > 2) {

						a = b;
						A = 1;

						do {

							b = N [A];
							e = 1E6 * a + b;

							if (f.edges [e] && g.edges [e]) {

								X.push (a);
								X.push (b);

							}

							a = b;

						} while (++ A < N.length);

					} // other segments between consecutive vertices for list N

					a = M [M.length - 1];
					b = M [0];
					e = 1E6 * a + b;

					if (f.edges [e] && g.edges [e]) {

						Y.push (b);
						Y.push (a);

					} // segment between last and first shared vertex in list M

					if (M.length > 2) {

						a = b;
						A = 1;

						do {

							b = M [A];
							e = 1E6 * a + b;

							if (f.edges [e] && g.edges [e]) {

								Y.push (a);
								Y.push (b);

							}

							a = b;

						} while (++ A < M.length);

					} // other segments between consecutive vertices for list M

					X.length > 1 && (f.neighbors.push (X)); // joining #i to #v
					Y.length > 1 && (g.neighbors.push (Y)); // joining #v to #i

					continue;

				} // recurrent face index found, for we already met face #v

				R [v] = true;

			} while (++ j < m); // each vertex index in reference record

		} while (++ i < n); // each face in mesh

		/*
		 *	clean up references in heap memory to empty neighbors' lists,
		 *	replacing all of them with the global "void" array instance:
		 *
		 *	      - this "third pass" isn't necessary to get pairings to
		 *		work, but it probably helps the garbage collector in
		 *		keeping the heap clean of redundant empty arrays
		 */

		i = 0; do {

			f = F [i];
			f.neighbors = f.neighbors.length === 0 ? this.void : f.neighbors;

		} while (++ i < n); // each face in mesh

		return this;

	};

	/*
	 *	this pretty sophisticated function will collate adjacent coplanar face groups after
	 *	the above .pair method found adjacencies (hence, this needs to be called only after
	 *	the .pair method, or it will produce a copy of the entry model with no changes), so
	 *	that holes in the manifold will be retained but collated faces will share a single,
	 *	all-round outline, rather than showing bright "cracks" where the edges of a model's
	 *	original faces were adjacent and coplanar: to a certain extent (except for reducing
	 *	faces around holes), it's equivalent to Blender's "limited dissolve" tool where the
	 *	said tool is given a very low maximum angle between adjacent surfaces (the function
	 *	will match adjacencies by comparing "surface IDs", which are compact, fully-integer
	 *	versions of the floating-point unit normals, but which resolution is limited to the
	 *	512th part of a half 180-degree circle, so... the eta is somewhere below .5 degrees
	 *	on each component of the unit normal)
	 *
	 *	      - note: there are TWO surface IDs per face because they're one the complement
	 *		of the other, i.e. they're the unit normals pointing in opposite verses, as
	 *		our polygons are assumed to be 2-sided for all purposes, including this one
	 */

	Model.prototype.outline = function () {

	  const F = this.faces.slice (0),	// mesh faces array (clone)
		G = this.groups.slice (0),	// mesh groups array (clone)
		t = this.thickness;		// this model's required edge thickness (ratio)

	  const sibs = function (g, s, f, v) {

		    var j, N, n, k, p, q;

			if (s.collection === false) {

				f.push (s);
				s.collection = g;

			}

			for (j in s.neighbors) {

				N = s.neighbors [j];
				n = F [N [0]];

				if (n.surfaceID_n === s.surfaceID_n || n.surfaceID_n === s.surfaceID_s || n.surfaceID_s === s.surfaceID_n) {

					for (k = 1; k <= N.length - 2; k += 2) {

						p = N [k];
						q = N [k + 1];

						v [1E6 * p + q] = v [1E6 * q + p] = n;

					}

					if (n.collection === false) {

						f.push (n);
						sibs (n.collection = g, n, f, v);

					}

				}

			}

		}, // finds all coplanar adjacencies to subject face s from group g

		prev = function (index, inPath) {

			return (index || inPath.length) - 1;

		}, // returns previous valid vertex index in path

		next = function (index, inPath) {

			return (index += 1) % inPath.length;

		}, // returns next valid vertex index in path

		shared = function (index, inPath, inList) {

		    var p = inPath [index] [14],
			q = inPath [next (index, inPath)] [14];

			return inList [1E6 * p + q] || null;

		}, // returns record if the edge at given index in path appears (by hash) in list

		startPoint = function (inPath, inList) {

		    var i = 0;

			if (inPath.length === 0)

				throw ('empty search path');

			while (!shared (i, inPath, inList)) {

				i = prev (i, inPath);

				if (i === 0)

					return -1;

			} // backward run to find the last shared edge: we'd then return the next

			if (i > 0)

				return next (i, inPath);

			do {

				i = next (i, inPath);

				if (i === 0)

					return -1;

			} while (shared (i, inPath, inList)); // forward run, to first non-shared

			return i;

		}, // returns the index of the first non-shared edge in path after any shared one

		nextPoint = function (fromIndex, inPath, inList) {

		    var i = next (fromIndex, inPath);

			while (shared (i, inPath, inList))

				i = next (i, inPath);

			return i;

		}, // returns the index of the next non-shared edge in path

		nextCrack = function (fromIndex, inPath, inList) {

		    var i = next (fromIndex, inPath);

			while (!shared (i, inPath, inList))

				i = next (i, inPath);

			return i;

		}; // returns the index of the next shared edge in path

	    var i,	// loop index in existing groups
		r,	// group entry in loop
		d,	// dark face entry
		f,	// flag: any adjacencies in the subsequent dictionary?
		v,	// dictionary of edges the bulk wire shares with adjacent coplanar faces
		j,	// index through neighbors of s or through faces of a group to be copied
		p,	// index of first shared vertex in wire path
		q,	// index of last shared vertex in wire path
		h,	// post-processed group where any shared edge has been clipped
		A,	// area of entire collation (group of coplanar adjacencies)
		X,	// X of midpoint of the above collation
		Y,	// Y of midpoint of the above collation
		Z,	// Z of midpoint of the above collation
		E,	// list of paths of contiguous non-shared vertices, parts of the outline
		b,	// face path in outline search loop
		c,	// edge start point in outline search loop
		m,	// max distance found so far for an extreme in a candidate segment
		M,	// path of contiguous non-shared vertices that includes farthest extreme
		w,	// dictionary of processed vertices while piecing the said path together
		e,	// temporary path between contiguous non-shared vertices (candidate M)
		x,	// x component of distance of candidate vertex from point at {X;Y;Z}
		y,	// y component of distance of candidate vertex from point at {X;Y;Z}
		z,	// z component of distance of candidate vertex from point at {X;Y;Z}
		n,	// remaining paths to concatenate while assembling collation's outline
		W;	// collation outline face entry (per se, not the wire: the "dark face")

		/*
		 *	first of all, re-init a void dictionary of vertices (nullified by .end)
		 *	so that .vertex would be able to track and re-use duplicates during the
		 *	construction of clipped edges; then, start looping through groups (each
		 *	group listing a whole-wire or bulk-wire face, the latter being followed
		 *	by a matching dark face and a straight end-of-wire segment face): where
		 *	no adjacent coplanar faces share vertices with the processed bulk wire,
		 *	i.e. where no twin wire is matched, bring the group over as it is, else
		 *	begin constructing a new group of wire faces
		 */

		this.D = new Object (); 	// re-init .vertex dictionary of vertices
		this.faces = new Array ();	// re-init faces array (.face pushes there)
		this.groups = new Array ();	// re-init groups array (.group pushes there)

		for (i in G) {

			r = G [i];

			switch (true) {

				default:

					/*
					 *	isolate all dark faces in group r:
					 *	we'll let dark faces be part of reconstructed group
					 */

					d = new Array ();

					for (j in f = r.faces)

						f [j].edge || d.push (f [j]);

					if (d.length === 0)

						break; // all misses? then not a "consistent" group

					/*
					 *	if any of the wires is flagged by "sibs" as already
					 *	processed, then the recursive search made there has
					 *	already listed this group in a previous result and,
					 *	while we still need to visualize its dark faces, it
					 *	won't be a candidate for another search (by "sibs")
					 */

					f = false;

					for (j in d)

						if (d [j].collection) {

							f = true;
							d [j].wire = false;

						} // force all flagged siblings dark, then continue

					if (f === true)

						continue;

					/*
					 *	find all sibling faces (adjacent coplanars) of what
					 *	might be the group's "dark face", i.e. the first in
					 *	r.faces which was found not flagged as an "edge"
					 */

					sibs (r, d [0], f = new Array (), v = new Object ());

					if (f.length < 2)

						break; // no edges shared with coplanar adjacencies

					/*
					 *	find the area and midpoint of the group of adjacent
					 *	coplanar faces
					 */

					A = 0;
					X = 0;
					Y = 0;
					Z = 0;

					for (j in f) {

						A = A + f [j].area;
						X = X + f [j].midpoint_0;
						Y = Y + f [j].midpoint_1;
						Z = Z + f [j].midpoint_2;

					}

					X = X / f.length;
					Y = Y / f.length;
					Z = Z / f.length;

					/*
					 *	in each of the sibling wires, look for the sequence
					 *	of contiguous non-shared segments that includes the
					 *	one which midpoint is the farthest from the group's
					 *	midpoint: put all such sequences into a list (E)
					 */

					E = new Array ();

					for (j in f) {

						b = f [j].path;
						c = p = startPoint (b, v);

						if (p > -1) {

							m = 0;
							M = false;
							w = new Object ();

							do {

								w [p] = 1;

								e = new Array ();
								q = nextCrack (p, b, v);

								do {

									x = X - b [c] [0];
									y = Y - b [c] [1];
									z = Z - b [c] [2];
									x = Math.sqrt (x * x + y * y + z * z);

									if (x > m) {

										m = x;
										M = e;

									}

									x = X - b [p] [0];
									y = Y - b [p] [1];
									z = Z - b [p] [2];
									x = Math.sqrt (x * x + y * y + z * z);

									if (x > m) {

										m = x;
										M = e;

									}

									e.push (b [p]);

									c = p;

								} while ((p = next (p, b)) - q);

								e.push (b [q]);

							} while (!w [p = nextPoint (q, b, v)]);

							M && E.push (M);

						}

					}

					if (E.length === 0)

						continue;

					/*
					 *	create the final wire outlining the new group: from
					 *	an arbitrary entry in list E (the first is ok) look
					 *	for another entry in which the first vertex matches
					 *	the last in the previous sequence, and as long as a
					 *	matching entry exists in E, concatenate vertices in
					 *	the matching entry to the growing new list: the new
					 *	list shall keep growing until no matching entry can
					 *	be found in E for the last concatenated entry; and,
					 *	when the last vertex of the last concatenated entry
					 *	matched the first in the new list, it would need to
					 *	be removed because there's no need to "close" faces
					 *	paths by terminating the path with the first vertex
					 */

					w = new Object ();
					e = E.shift ();
					v = e.pop ();
					n = E.length;

					do {

						c = false;

						for (j in E)

							if (!w [j])

								if (v [14] === E [j] [0] [14]) {

									w [j] = 1;

									e = e.concat (E [j]);
									v = e.pop ();
									n = n - 1;
									c = true;

									break;

								}

					} while (c);

					/*
					 *	here's the contrary of the last condition mentioned
					 *	above: if the outline didn't "close the circle" and
					 *	there were unmatched sequences left to concatenate,
					 *	last vertex is "pushed back in", given it shouldn't
					 *	be a duplicate of the first
					 */

					if (n > 0)

						e.push (v);

					/*
					 *	outlines obtained via concatenating sparse segments
					 *	may feature consecutive vertices: those will either
					 *	be a waste of time, or an anomaly causing buffering
					 *	to except: Maths.condense will remove such segments
					 */

					if ((e = Maths.condense (e)).length < 3)

						continue;

					/*
					 *	construct an outline resulting from the "buffering"
					 *	of the above path
					 */

					E = Maths.process (W = this.face (e), t);

					if (E.except)

						/*
						 *	when buffering didn't work for some reason,
						 *	currently "meh" at that and then leave this
						 *	collation without a visible outline... such
						 *	exceptions shouldn't happen, in theory, but
						 *	just in case, it's probably best to leave a
						 *	dark group than anything visibly wrong...
						 */

						continue;

					/*
					 *	if the area of the outline matches the area covered
					 *	by all siblings, then this collation has no "holes"
					 *	and can be represented by a single dark face with a
					 *	pair of edge wires running around its perimeter, so
					 *	let's implement this simpler case first
					 */

					if (Math.abs (A - (W.area = E.area)) < .00001) {

						h = this.group ([ W ]);

						h.midpoint_0 = X;
						h.midpoint_1 = Y;
						h.midpoint_2 = Z;

						W.collection = h;	// here just for the record

						/*
						 *	because we'd like to re-use subsequent code
						 *	to build the pair of wire edge faces around
						 *	the outline, and the said code assumes W is
						 *	just a temporary face record which path can
						 *	be altered to construct the bulk wire edge,
						 *	this case will clone what matters of face W
						 *	such that any changes won't affect the real
						 *	W face (that we're leaving in the new mesh)
						 */

						W = { path: W.path.slice (0) };

					} // uniform outline case (collation topology has no holes)

					else {

						this.faces.pop ();	// discard the outline face

						/*
						 *	first, creating new "collated" group, based
						 *	on dark faces in the original group (so far
						 *	that's always a single dark face, but we're
						 *	being flexible, should the future bring any
						 *	changes: a group's a group of any number of
						 *	dark and/or wire edge faces, in general)
						 */

						h = this.group (d);

						h.midpoint_0 = X;
						h.midpoint_1 = Y;
						h.midpoint_2 = Z;

						for (j in d)

							d [j].collection = h;

						for (j in f) {

							this.faces.push (f [j]);

							f [j].collection.id - h.id && h.faces.push (f [j]);
							f [j].collection = h;
							f [j].wire = false;

							x = f [j].midpoint_0 - X;
							y = f [j].midpoint_1 - Y;
							z = f [j].midpoint_2 - Z;

							h.actualRadius = Math.max (h.actualRadius, Math.sqrt (x * x + y * y + z * z) + f [j].actualRadius);

						}

					} // complex outline case (collation must run around holes)

					/*
					 *	now creating the bulk wire path, by adding vertices
					 *	from the buffered edge as returned: they'll wind in
					 *	the direction opposite to that of entry vertices so
					 *	they'll close the bulk edge by terminating close to
					 *	the first vertex of the entry (outline) path
					 */

					for (j in E.edge)

						W.path.push (this.vertex ((v = E.edge [j]).x, v.y, v.z));

					h.faces.push (b = this.face (W.path));	// create bulk wire
					b.edge = b.wire = true; 		// flags: edge wire

					/*
					 *	finally creating the "rest wire", which is always a
					 *	quadrilateral highlighting the two vertices between
					 *	the first and the last ones of the outline path: it
					 *	runs from the first to the last vertex in the entry
					 *	outline path, and through the first and last of the
					 *	buffered edge (that, as said, winds in the opposite
					 *	sense, making the new path consistently convex)
					 */

					e = [

						e.shift (),
						e.pop (),
						this.vertex ((c = E.edge.shift ()).x, c.y, c.z),
						this.vertex ((d = E.edge.pop ()).x, d.y, d.z)

					];

					h.faces.push (r = this.face (e));	// create rest wire
					r.edge = r.wire = true; 		// flags: edge wire

					continue;

			} // whenever this switch breaks, run what's below, which copies this group

			this.groups.push (r);

			for (j in r.faces) {

				r.faces [j].edges = null;		// reset edges dictionary
				r.faces [j].neighbors = this.void;	// reset neighbors' array

				this.faces.push (r.faces [j]);

			} // resets improve consistence (new model is unpaired) and may free memory

		}

		return this.end ();

	};

	/*
	 *	here follow methods that will numerically affect the mesh's geometry:
	 *	the typical sequence begins with a reset, which clears any former
	 *	changes to the geometry and allows rendering multiple copies
	 *	of a same mesh in different positions, orientations, etc;
	 *
	 *	      - currently, "reset" takes a { step } argument which determines the
	 *		stepping for all loops in subsequent methods, up to and including
	 *		the "renderPart" method: the argument is a "simulated float", and
	 *		has a granularity of 1/256th such that 0x100 means 1 (process all
	 *		polygons), 0x101 means 257/256th (skip one every 257), and so on;
	 *		stepping is ideally supposed to raise as a function of the mesh's
	 *		distance from the viewpoint, which'd exclude more and more of its
	 *		polygons from transformations and rendering, resulting in a cheap
	 *		form of contribution culling: Spectrum isn't meant to mind making
	 *		such transitions any smoother than that - it's just a style thing
	 */

	Model.prototype.listRelevants = function () {  // not public, see below

	  const Q = this.stepping,		// stepping factor, actual
		R = this.relevants,		// relevant groups, not to be culled by LoD setting
		H = this.fRendered,		// flags relevant groups that'll be rendered anyway
		f = false,			// marks all relevant groups, in advance, as culled
		n = this.groups.length << 8;	// loop limiter

		for (var i = 0; i < R.length; ++ i)

			H [R [i]] = f;		// reset "rendered anyway" flag for relevant groups

		for (i = Q >> 1; i < n; i += this.stepping)

			H [i>>>8] = true;	// flag those that'd be, in fact, selected/rendered

		for (i = 0, this.nUnculled = 0; i < R.length; ++ i)

			H [R [i]] || (this.rUnculled [this.nUnculled ++] = R [i]);

		return this;

	}; // create list of relevant groups to be "forced in"

	Model.prototype.reset = function (args) {

	  const G = this.groups,		// model's groups array
		Q = this.stepping,		// last stepping factor
		n = this.groups.length << 8;	// loop limiter, groups

	    var i, g, j, r,			// grp. index, grp. record, face index, face record
		p, v, w, k;			// face path, first vertices' records, vertex index

		/*
		 *	the { init } argument isn't meant to be called publicly, but will be passed
		 *	by the .end method of the Model prototype to force construction of the list
		 *	of relevant groups: the list will be re-built when the stepping factor will
		 *	be found to have changed between calls to .reset, and reused otherwise
		 */

		if (args && args.init)

			return this.listRelevants ();

		/*
		 *	reset origin
		 */

		this.xOrigin = 0;
		this.yOrigin = 0;
		this.zOrigin = 0;

		/*
		 *	record new culling step:
		 *	the former (Q) will be used to reset only previously-affected faces
		 */

		this.stepping = Math.max (0x100, be.number (args && args.step).or (0x100));

		/*
		 *	see if there were any transforms (namely, scale and rotate) that might have
		 *	affected the model's geometry: if not (transId was left to 1), we don't run
		 *	the rest of this function, but still...
		 */

		if (this.transId === 1)

			/*
			 *	...unless same stepping as before,
			 *	remember to rebuild the list of groups to be "unculled"
			 */

			return this.stepping === Q ? this : this.listRelevants ();

		/*
		 *	reset transform ID back to 1
		 */

		this.transId = 1;

		/*
		 *	reset all vertices, groups and bounding radiuses to the finalized geometry,
		 *	using their backup values: like in all selection and rendering loops, first
		 *	process all groups in the existing "relevant groups" list regardless of the
		 *	stepping factor
		 */

		for (i = 0; i < this.nUnculled; ++ i) {

			g = G [this.rUnculled [i]];

			if (g.model)

				continue; // child model - unaffected by changes in parent geometry

			g.midpoint_0 = g.midpoint_3;
			g.midpoint_1 = g.midpoint_4;
			g.midpoint_2 = g.midpoint_5;

			g.surfaceNormal_0 = g.surfaceNormal_3;
			g.surfaceNormal_1 = g.surfaceNormal_4;
			g.surfaceNormal_2 = g.surfaceNormal_5;

			g.actualRadius = g.circumRadius;

			j = 0; do {

				r = g.faces [j];
				p = r.path;

				r.midpoint_0 = r.midpoint_3;
				r.midpoint_1 = r.midpoint_4;
				r.midpoint_2 = r.midpoint_5;

				r.surfaceNormal_0 = r.surfaceNormal_3;
				r.surfaceNormal_1 = r.surfaceNormal_4;
				r.surfaceNormal_2 = r.surfaceNormal_5;

				r.actualRadius = r.circumRadius;

				v = p [0];
				w = p [1];

				v [ 0] = v [10];
				v [ 1] = v [11];
				v [ 2] = v [12];
				v [13] = 0;

				w [ 0] = w [10];
				w [ 1] = w [11];
				w [ 2] = w [12];
				w [13] = 0;

				k = 2; do { v = p [k];

					v [ 0] = v [10];
					v [ 1] = v [11];
					v [ 2] = v [12];
					v [13] = 0;

				} while (++ k < p.length);

			} while (++ j < g.faces.length);

		}

		/*
		 *	otherwise, begin stepping through groups which would have been eligible for
		 *	view-frustum-based selection and rendering, last time the model was cast in
		 *	to the scene
		 */

		for (i = Q >> 1; i < n; i = i + Q) {

			g = G [i >> 8];

			if (g.model)

				continue; // child model - unaffected by changes in parent geometry

			g.midpoint_0 = g.midpoint_3;
			g.midpoint_1 = g.midpoint_4;
			g.midpoint_2 = g.midpoint_5;

			g.surfaceNormal_0 = g.surfaceNormal_3;
			g.surfaceNormal_1 = g.surfaceNormal_4;
			g.surfaceNormal_2 = g.surfaceNormal_5;

			g.actualRadius = g.circumRadius;

			j = 0; do {

				r = g.faces [j];
				p = r.path;

				r.midpoint_0 = r.midpoint_3;
				r.midpoint_1 = r.midpoint_4;
				r.midpoint_2 = r.midpoint_5;

				r.surfaceNormal_0 = r.surfaceNormal_3;
				r.surfaceNormal_1 = r.surfaceNormal_4;
				r.surfaceNormal_2 = r.surfaceNormal_5;

				r.actualRadius = r.circumRadius;

				v = p [0];
				w = p [1];

				v [ 0] = v [10];
				v [ 1] = v [11];
				v [ 2] = v [12];
				v [13] = 0;

				w [ 0] = w [10];
				w [ 1] = w [11];
				w [ 2] = w [12];
				w [13] = 0;

				k = 2; do { v = p [k];

					v [ 0] = v [10];
					v [ 1] = v [11];
					v [ 2] = v [12];
					v [13] = 0;

				} while (++ k < p.length);

			} while (++ j < g.faces.length);

		} // mesh reset

		return this.stepping === Q ? this : this.listRelevants ();

	};

	Model.prototype.rotate = function (args) {

		/*
		 *	arguments (angles) to "rotate" may be selectively omitted,
		 *	and default to zero; angles are always in degrees, not radians
		 *
		 *	      - effective rotation angles are the opposites of those
		 *		given as input such that meshes rotation follows the
		 *		same directional conventions as the viewpoint camera
		 */

	  const a = be.number (args && args.pitch).or (0),
		b = be.number (args && args.yaw).or (0),
		c = be.number (args && args.roll).or (0),

		G = this.groups,		// model groups' array
		Q = this.stepping,		// depth culling factor
		n = this.groups.length << 8,	// loop limiter (groups)

		T = this.transId,		// transformation ID
		K = Math.PI / - 180,		// deg-to-rad conversion (with opposites)

		sa = Math.sin (K * a),		// sin (a)
		ca = Math.cos (K * a),		// cos (a)
		sb = Math.sin (K * b),		// sin (b)
		cb = Math.cos (K * b),		// cos (b)
		sc = Math.sin (K * c),		// sin (c)
		cc = Math.cos (K * c);		// cos (c)

	    var i, g, j, r,			// grp. index, grp. record, face index, face record
		p, v, w, k,			// face path, first vertices' records, vertex index

		x2, y2, z2;			// intermediate auxiliary variables

		/*
		 *	if all angles are zero, return immediately:
		 *	this may save time where input angles are unknown beforehand
		 */

		if (a === 0 && b === 0 && c === 0)

			return this;

		this.transId = this.transId + 1;

		/*
		 *	after registering the transformation, if this mesh is empty,
		 *	also return immediately because there's nothing to transform
		 */

		for (i = 0; i < this.nUnculled; ++ i) {

			g = G [this.rUnculled [i]];

			if (g.model)

				continue; // child model

			x2 = g.midpoint_0 * cc + g.midpoint_1 * sc;
			y2 = g.midpoint_1 * cc - g.midpoint_0 * sc;
			z2 = g.midpoint_2 * ca + y2 * sa;

			g.midpoint_1 = y2 * ca - g.midpoint_2 * sa;
			g.midpoint_0 = x2 * cb + z2 * sb;
			g.midpoint_2 = z2 * cb - x2 * sb;

			x2 = g.surfaceNormal_0 * cc + g.surfaceNormal_1 * sc;
			y2 = g.surfaceNormal_1 * cc - g.surfaceNormal_0 * sc;
			z2 = g.surfaceNormal_2 * ca + y2 * sa;

			g.surfaceNormal_1 = y2 * ca - g.surfaceNormal_2 * sa;
			g.surfaceNormal_0 = x2 * cb + z2 * sb;
			g.surfaceNormal_2 = z2 * cb - x2 * sb;

			j = 0; do {

				r = g.faces [j];
				p = r.path;

				x2 = r.midpoint_0 * cc + r.midpoint_1 * sc;
				y2 = r.midpoint_1 * cc - r.midpoint_0 * sc;
				z2 = r.midpoint_2 * ca + y2 * sa;

				r.midpoint_1 = y2 * ca - r.midpoint_2 * sa;
				r.midpoint_0 = x2 * cb + z2 * sb;
				r.midpoint_2 = z2 * cb - x2 * sb;

				x2 = r.surfaceNormal_0 * cc + r.surfaceNormal_1 * sc;
				y2 = r.surfaceNormal_1 * cc - r.surfaceNormal_0 * sc;
				z2 = r.surfaceNormal_2 * ca + y2 * sa;

				r.surfaceNormal_1 = y2 * ca - r.surfaceNormal_2 * sa;
				r.surfaceNormal_0 = x2 * cb + z2 * sb;
				r.surfaceNormal_2 = z2 * cb - x2 * sb;

				v = p [0];
				w = p [1];

				if (v [13] - T) {

					x2 = v [0] * cc + v [1] * sc;
					y2 = v [1] * cc - v [0] * sc;
					z2 = v [2] * ca + y2 * sa;

					v [ 1] = y2 * ca - v [2] * sa;
					v [ 0] = x2 * cb + z2 * sb;
					v [ 2] = z2 * cb - x2 * sb;
					v [13] = T;

				}

				if (w [13] - T) {

					x2 = w [0] * cc + w [1] * sc;
					y2 = w [1] * cc - w [0] * sc;
					z2 = w [2] * ca + y2 * sa;

					w [ 1] = y2 * ca - w [2] * sa;
					w [ 0] = x2 * cb + z2 * sb;
					w [ 2] = z2 * cb - x2 * sb;
					w [13] = T;

				}

				k = 2; do { v = p [k];

					if (T === v [13])

						continue;

					x2 = v [0] * cc + v [1] * sc;
					y2 = v [1] * cc - v [0] * sc;
					z2 = v [2] * ca + y2 * sa;

					v [ 1] = y2 * ca - v [2] * sa;
					v [ 0] = x2 * cb + z2 * sb;
					v [ 2] = z2 * cb - x2 * sb;
					v [13] = T;

				} while (++ k < p.length);

			} while (++ j < g.faces.length);

		}

		for (i = Q >> 1; i < n; i = i + Q) {

			g = G [i >> 8];

			if (g.model)

				continue; // child model

			x2 = g.midpoint_0 * cc + g.midpoint_1 * sc;
			y2 = g.midpoint_1 * cc - g.midpoint_0 * sc;
			z2 = g.midpoint_2 * ca + y2 * sa;

			g.midpoint_1 = y2 * ca - g.midpoint_2 * sa;
			g.midpoint_0 = x2 * cb + z2 * sb;
			g.midpoint_2 = z2 * cb - x2 * sb;

			x2 = g.surfaceNormal_0 * cc + g.surfaceNormal_1 * sc;
			y2 = g.surfaceNormal_1 * cc - g.surfaceNormal_0 * sc;
			z2 = g.surfaceNormal_2 * ca + y2 * sa;

			g.surfaceNormal_1 = y2 * ca - g.surfaceNormal_2 * sa;
			g.surfaceNormal_0 = x2 * cb + z2 * sb;
			g.surfaceNormal_2 = z2 * cb - x2 * sb;

			j = 0; do {

				r = g.faces [j];
				p = r.path;

				x2 = r.midpoint_0 * cc + r.midpoint_1 * sc;
				y2 = r.midpoint_1 * cc - r.midpoint_0 * sc;
				z2 = r.midpoint_2 * ca + y2 * sa;

				r.midpoint_1 = y2 * ca - r.midpoint_2 * sa;
				r.midpoint_0 = x2 * cb + z2 * sb;
				r.midpoint_2 = z2 * cb - x2 * sb;

				x2 = r.surfaceNormal_0 * cc + r.surfaceNormal_1 * sc;
				y2 = r.surfaceNormal_1 * cc - r.surfaceNormal_0 * sc;
				z2 = r.surfaceNormal_2 * ca + y2 * sa;

				r.surfaceNormal_1 = y2 * ca - r.surfaceNormal_2 * sa;
				r.surfaceNormal_0 = x2 * cb + z2 * sb;
				r.surfaceNormal_2 = z2 * cb - x2 * sb;

				v = p [0];
				w = p [1];

				if (v [13] - T) {

					x2 = v [0] * cc + v [1] * sc;
					y2 = v [1] * cc - v [0] * sc;
					z2 = v [2] * ca + y2 * sa;

					v [ 1] = y2 * ca - v [2] * sa;
					v [ 0] = x2 * cb + z2 * sb;
					v [ 2] = z2 * cb - x2 * sb;
					v [13] = T;

				}

				if (w [13] - T) {

					x2 = w [0] * cc + w [1] * sc;
					y2 = w [1] * cc - w [0] * sc;
					z2 = w [2] * ca + y2 * sa;

					w [ 1] = y2 * ca - w [2] * sa;
					w [ 0] = x2 * cb + z2 * sb;
					w [ 2] = z2 * cb - x2 * sb;
					w [13] = T;

				}

				k = 2; do { v = p [k];

					if (T === v [13])

						continue;

					x2 = v [0] * cc + v [1] * sc;
					y2 = v [1] * cc - v [0] * sc;
					z2 = v [2] * ca + y2 * sa;

					v [ 1] = y2 * ca - v [2] * sa;
					v [ 0] = x2 * cb + z2 * sb;
					v [ 2] = z2 * cb - x2 * sb;
					v [13] = T;

				} while (++ k < p.length);

			} while (++ j < g.faces.length);

		} // full rotation, around origin

		return this;

	};

	Model.prototype.scale = function (args) {

		/*
		 *	arguments to "scale" are the three { x, y, z } factors,
		 *	which may be selectively omitted and default to 1;
		 *	alternatively, "uniform" applies to all axes
		 */

	  const x = be.number (args && args.uniform).or (be.number (args && args.x).or (1)),
		y = be.number (args && args.uniform).or (be.number (args && args.y).or (1)),
		z = be.number (args && args.uniform).or (be.number (args && args.z).or (1)),

		G = this.groups,		// model groups' array
		Q = this.stepping,		// depth culling factor
		n = this.groups.length << 8,	// loop limiter (groups)

		T = this.transId,		// transformation ID
		s = Math.max (x, y, z); 	// circumsphere radius scaling factor

	    var i, g, j, r,			// grp. index, grp. record, face index, face record
		p, v, w, k,			// face path, first vertices' records, vertex index

		N;				// surface normal (where it needs to be recomputed)

		/*
		 *	if all factors equal one, return immediately:
		 *	this may save time where input factors are unknown beforehand
		 */

		if (x === 1 && y === 1 && z === 1)

			return this;

		this.transId = this.transId + 1;

		/*
		 *	after registering the transformation, if this mesh is empty,
		 *	also return immediately because there's nothing to transform
		 */

		if (x === y && x === z) {

			for (i = 0; i < this.nUnculled; ++ i) {

				g = G [this.rUnculled [i]];

				if (g.model)

					continue; // child model

				g.midpoint_0 *= x;
				g.midpoint_1 *= y;
				g.midpoint_2 *= z;

				g.actualRadius *= s;

				j = 0; do {

					r = g.faces [j];
					p = r.path;

					v = p [0];
					w = p [1];

					if (v [13] - T) {

						v [0] *= x;
						v [1] *= y;
						v [2] *= z;
						v [13] = T;

					}

					if (w [13] - T) {

						w [0] *= x;
						w [1] *= y;
						w [2] *= z;
						w [13] = T;

					}

					k = 2; do { v = p [k];

						if (T === v [13])

							continue;

						v [0] *= x;
						v [1] *= y;
						v [2] *= z;
						v [13] = T;

					} while (++ k < p.length);

					r.midpoint_0 *= x;
					r.midpoint_1 *= y;
					r.midpoint_2 *= z;

					r.actualRadius *= s;

				} while (++ j < g.faces.length);

			}

			for (i = Q >> 1; i < n; i = i + Q) {

				g = G [i >> 8];

				if (g.model)

					continue; // child model

				g.midpoint_0 *= x;
				g.midpoint_1 *= y;
				g.midpoint_2 *= z;

				g.actualRadius *= s;

				j = 0; do {

					r = g.faces [j];
					p = r.path;

					v = p [0];
					w = p [1];

					if (v [13] - T) {

						v [0] *= x;
						v [1] *= y;
						v [2] *= z;
						v [13] = T;

					}

					if (w [13] - T) {

						w [0] *= x;
						w [1] *= y;
						w [2] *= z;
						w [13] = T;

					}

					k = 2; do { v = p [k];

						if (T === v [13])

							continue;

						v [0] *= x;
						v [1] *= y;
						v [2] *= z;
						v [13] = T;

					} while (++ k < p.length);

					r.midpoint_0 *= x;
					r.midpoint_1 *= y;
					r.midpoint_2 *= z;

					r.actualRadius *= s;

				} while (++ j < g.faces.length);

			} // even scaling

			return this;

		} // uniform scaling: no need to recompute normals

		for (i = 0; i < this.nUnculled; ++ i) {

			g = G [this.rUnculled [i]];

			if (g.model)

				continue; // child model

			g.midpoint_0 *= x;
			g.midpoint_1 *= y;
			g.midpoint_2 *= z;

			g.actualRadius *= s;

			j = 0; do {

				r = g.faces [j];
				p = r.path;

				v = p [0];
				w = p [1];

				if (v [13] - T) {

					v [0] *= x;
					v [1] *= y;
					v [2] *= z;
					v [13] = T;

				}

				if (w [13] - T) {

					w [0] *= x;
					w [1] *= y;
					w [2] *= z;
					w [13] = T;

				}

				k = 2; do { v = p [k];

					if (T === v [13])

						continue;

					v [0] *= x;
					v [1] *= y;
					v [2] *= z;
					v [13] = T;

				} while (++ k < p.length);

				r.midpoint_0 *= x;
				r.midpoint_1 *= y;
				r.midpoint_2 *= z;

				N = Maths.unitize (Maths.normalTo (p [0], p [1], p [2]));

				r.surfaceNormal_0 = g.surfaceNormal_0 = N [0];
				r.surfaceNormal_1 = g.surfaceNormal_1 = N [1];
				r.surfaceNormal_2 = g.surfaceNormal_2 = N [2];

				r.actualRadius *= s;

			} while (++ j < g.faces.length);

		}

		for (i = Q >> 1; i < n; i = i + Q) {

			g = G [i >> 8];

			if (g.model)

				continue; // child model

			g.midpoint_0 *= x;
			g.midpoint_1 *= y;
			g.midpoint_2 *= z;

			g.actualRadius *= s;

			j = 0; do {

				r = g.faces [j];
				p = r.path;

				v = p [0];
				w = p [1];

				if (v [13] - T) {

					v [0] *= x;
					v [1] *= y;
					v [2] *= z;
					v [13] = T;

				}

				if (w [13] - T) {

					w [0] *= x;
					w [1] *= y;
					w [2] *= z;
					w [13] = T;

				}

				k = 2; do { v = p [k];

					if (T === v [13])

						continue;

					v [0] *= x;
					v [1] *= y;
					v [2] *= z;
					v [13] = T;

				} while (++ k < p.length);

				r.midpoint_0 *= x;
				r.midpoint_1 *= y;
				r.midpoint_2 *= z;

				N = Maths.unitize (Maths.normalTo (p [0], p [1], p [2]));

				r.surfaceNormal_0 = g.surfaceNormal_0 = N [0];
				r.surfaceNormal_1 = g.surfaceNormal_1 = N [1];
				r.surfaceNormal_2 = g.surfaceNormal_2 = N [2];

				r.actualRadius *= s;

			} while (++ j < g.faces.length);

		} // non-uniform scaling

		return this;

	};

	Model.prototype.translate = function (args) {

		/*
		 *	arguments to "translate" are the three { x, y, z } amounts,
		 *	which may be selectively omitted and default to zero
		 *
		 *	      - meshes are never numerically translated, only their
		 *		origin point is - the rendering context "pt" method
		 *		already does a translation, so upon being rendered,
		 *		mesh translation is simply delegated to that method
		 */

		this.xOrigin += be.number (args && args.x).or (0);
		this.zOrigin += be.number (args && args.z).or (0);
		this.yOrigin += be.number (args && args.y).or (0);

		return this;

	};

	Model.prototype.finalize = function () {

	  const V = this.vertices,		// array of vertices
		F = this.faces, 		// mesh faces' array
		G = this.groups,		// mesh groups array
		m = this.vertices.length,	// loop count (verts)
		n = this.faces.length,		// loop count (faces)
		o = this.groups.length, 	// loop count (gr.ps)

		x = this.xOrigin,
		y = this.yOrigin,
		z = this.zOrigin;

	    var X, Y, Z, R = 0, 		// circumsphere evaluation, avg group radius

		i, r,				// face index, face record
		p, v, w, j;			// face path, v. record, v. record, v. index

		/*
		 *	finalizes all vertices and faces to their current geometry,
		 *	updating their backup values (to be read back by a "reset")
		 *
		 *	      - this is done once preliminary transformations, such
		 *		as those to adapt a model to its intended scale and
		 *		orientation, are completed: further transformations
		 *		as applied to different frames will be based on the
		 *		finalized shape properties; essentially, "finalize"
		 *		establishes the reference geometry of the mesh
		 */

		this.transId = 1;		// reset
		this.xOrigin = 0;		// reset
		this.yOrigin = 0;		// reset
		this.zOrigin = 0;		// reset

		this.stepping = 0x100;		// reset
		this.nUnculled = 0;		// reset

		if (o === 0)

			return this; // no faces to finalize (empty mesh)

		i = 0; do {

			r = F [i];
			p = r.path;

			r.midpoint_3 = r.midpoint_0 = r.midpoint_0 + x;
			r.midpoint_4 = r.midpoint_1 = r.midpoint_1 + y;
			r.midpoint_5 = r.midpoint_2 = r.midpoint_2 + z;

			r.surfaceNormal_3 = r.surfaceNormal_0;
			r.surfaceNormal_4 = r.surfaceNormal_1;
			r.surfaceNormal_5 = r.surfaceNormal_2;

			r.circumRadius = r.actualRadius;

		} while (++ i < n);

		i = 0; do {

			r = G [i];
			R = R + r.actualRadius;

			r.midpoint_3 = r.midpoint_0 = r.midpoint_0 + x;
			r.midpoint_4 = r.midpoint_1 = r.midpoint_1 + y;
			r.midpoint_5 = r.midpoint_2 = r.midpoint_2 + z;

			r.surfaceNormal_3 = r.surfaceNormal_0;
			r.surfaceNormal_4 = r.surfaceNormal_1;
			r.surfaceNormal_5 = r.surfaceNormal_2;

			r.circumRadius = r.actualRadius;

		} while (++ i < o);

		this.circumRadius = 0;
		this.ceiling = 0;
		R = R / o;

		i = 0; do {

			v = V [i];
			X = v [0];
			Y = v [1];
			Z = v [2];

			v [0] = v [10] = X + x;
			v [1] = v [11] = Y + y;
			v [2] = v [12] = Z + z;

			X = Math.sqrt (X*X + Y*Y + Z*Z);

			if (X > this.circumRadius)

				this.circumRadius = X;

			if (Y > this.ceiling)

				this.ceiling = Y;

		} while (++ i < m);

		this.plicity = R / this.circumRadius;
		this.circumCenter = this.ceiling / 2;

		return this.plicity = Math.pow (this.plicity, xplicity), this;

	};

	Model.prototype.removeChild = function () {

		/*
		 *	not public:
		 *	called when bound to a child record (see below)
		 */

		if (this.parent) {

		  const newChildren  = new Array,
			newGroups    = new Array,
			newRelevants = new Array;

			for (var i = 0; i < this.parent.children.length; ++ i)

				i === this.iChild || newChildren.push (this.parent.children [i]);

			for (i = 0; i < this.parent.groups.length; ++ i)

				i === this.iGroup || newGroups.push (this.parent.groups [i]);

			for (i = 0; i < this.parent.relevants.length; ++ i)

				i === this.iRelev || newRelevants.push (this.parent.relevants [i] - (i > this.iGroup) ? 1 : 0);

			for (i = this.iChild; i < this.parent.children.length; ++ i) {

				-- this.parent.children [i].iChild;
				-- this.parent.children [i].iGroup;
				-- this.parent.children [i].iRelev;

			} // slide next children back

			this.parent.children = newChildren;
			this.parent.groups = newGroups;
			this.parent.relevants = newRelevants;
			this.parent.listRelevants ();
			this.parent = null;

		} // if the parent is still linked...

	};

	Model.prototype.addChild = function (childObject, parentObject) {

	  const i = this.children.length;
	  const n = this.groups.length;
	  const m = this.relevants.length;

	    var newChild;

		/*
		 *	adds a child model to the subject model:
		 *	logically seen as a group of faces which is always relevant
		 *	and hence sorted along with the other groups such that it'd
		 *	be rendered in the expected depth order, appearing in front
		 *	of certain parts of the parent model but behind other parts
		 *
		 *	      - returns a "child record" that can be used to remove
		 *		the child from this same model and which includes a
		 *		reference to the parent, i.e. to this model, with a
		 *		removeFromParent method; it actually returns a list
		 *		of child records so it'll be compatible with what a
		 *		MultiModel does, when given a child, except in this
		 *		case the list includes just one element
		 */

		if (childObject && childObject.model)

			if (childObject.model.constructor === Model || childObject.model.constructor === MultiModel) {

				this.children.push (newChild = {

					parent: this, self: childObject,
					iChild: i,
					iGroup: n,
					iRelev: m

				});

				this.groups.push (childObject);
				this.relevants.push (n);
				this.listRelevants ();

				if (parentObject && parentObject.model)

					if (parentObject.model.constructor === Model || parentObject.model.constructor === MultiModel) {

						childObject.parent = parentObject;
						parentObject.parentId = parentObject.parentId || (++ World.generator);

					}

				newChild.removeFromParent = this.removeChild.bind (newChild);

			}

		return newChild && [ newChild ];

	};

	/*
	 *	visible circumsphere radius:
	 *	determines visibility, and model variant selection for MultiModels
	 */

	Model.prototype.vcsr = function (args) {

		if (typeof args.uniform === 'number')

			return this.circumRadius * args.uniform;

			return this.circumRadius * Math.max (

				typeof args.x === 'number' ? args.x : 1,
				typeof args.y === 'number' ? args.y : 1,
				typeof args.z === 'number' ? args.z : 1

			);

	};

	/*
	 *	simplified "select" method for all models that are not MultiModels:
	 *	returns the model, being its only version, no matter the viewing distance
	 */

	Model.prototype.select = function () {

		return this;

	};

	/*
	 *	after creating a mesh, or after a reset, and applying transformations (as
	 *	of the above methods) and prior to rendering the mesh, visible faces must
	 *	be determined, so that backfaces and faces that will be behind the camera
	 *	can be ignored by subsequent calls; essentially, selectGroups will select
	 *	the visible surfaces according to the following conditions:
	 *
	 *	      - face group is NOT visible if entirely behind the camera;
	 *	      - face group is NOT visible if entirely out of the view frustum;
	 *
	 *	once selectGroups has been called (it MUST, if you didn't want to process
	 *	a totally empty mesh in later calls to sortGroups and renderPart methods),
	 *	the methods declared below selectGroups will work on such selected groups
	 *	and this enables significantly reducing the amount of processing for face
	 *	sorting and rendering
	 */

	Model.prototype.selectGroups = function (rc) {

	  const ab = Math.abs,				// local ref.

		rD = rc.D,				// local, world's verse (1 = regular, -1 = mirror)
		rk = rc.k,				// local, near clipping plane distance
		rd = rc.d,				// local, projection plane distance
		rp = rc.p,				// local, anisotropy-modulated rc.d
		ri = rc.i,				// local, viewport center X coordinate
		rj = rc.j,				// local, viewport center Y coordinate
		ti = rc.C,				// local, current transform ID
		vl = rc.R / rd * (rD > 0 ? .5 : 1),	// local, visibility limit in contribution culling

		sa = rc.sa,				//
		sb = rc.sb,				//
		sc = rc.sc,				// local refs.
		ca = rc.ca,				// to camera angles' sines and cosines
		cb = rc.cb,				//
		cc = rc.cc,				//

		x0 = rc.x - this.xOrigin,		//
		y0 = rc.y - this.yOrigin * rc.D,	// view-space origin (visibility rototranslations)
		z0 = rc.z - this.zOrigin,		//

		G = this.groups,			// model groups' array
		Q = this.stepping,			// depth culling factor
		n = this.groups.length << 8;		// stepping loop limiter

	    var i,					// groups' loop stepper index
		g,					// local, group entry in loop

		x1, y1, z1,				// auxiliaries (visibility check rototranslations)
		x2, y2, z2,				// auxiliaries (visibility check rototranslations)

		r,					// local, face record in loop
		j,					// local, face index in group
		p,					// local, path record in loop
		k;					// vertices loop index, for faces with more than 3

		rc.x = x0;				//
		rc.y = y0;				// implied translation: the "move the world" trick
		rc.z = z0;				//

		this.nGroups = 0;			// reset visible groups count in this mesh or part

		for (i = 0; i < this.nUnculled; ++ i) {

			g = G [this.rUnculled [i]];

			if (g.model === false) {

				x1 =	  g.midpoint_0 - x0;
				y1 = rD * g.midpoint_1 - y0;
				z1 =	  g.midpoint_2 - z0;

				y2 = z1 * cb - x1 * sb;
				z2 = y2 * ca + y1 * sa + g.actualRadius;

				if (z2 < rk)

					continue; // group behind viewpoint

				if (rD < 0 && g.surfaceNormal_1 < -.1)

					continue; // group is a reflection but (definitely) faces up

				x2 = x1 * cb + z1 * sb;
				y2 = y1 * ca - y2 * sa;

				if (rp * (ab (x2 * cc + y2 * sc) - g.actualRadius) > z2 * ri)

					continue; // group outside view frustum along screen-space x

				if (rd * (ab (y2 * cc - x2 * sc) - g.actualRadius) > z2 * rj)

					continue; // group outside view frustum along screen-space y

				if (g.actualRadius / (g.distance = Math.sqrt (x1*x1 + y1*y1 + z1*z1)) < vl)

					continue; // group considered too small to be seen from here

				r = g.faces [0];

				j = 0; do {

					p = r.path;
					k = 2;

					/*
					 *	rototranslate vertices (which need to be):
					 *	rototranslation ID marks those that don't,
					 *	if multiple faces share the same vertices
					 */

					p [0] [3] === ti || rc.pt (p [0]);
					p [1] [3] === ti || rc.pt (p [1]);
					p [2] [3] === ti || rc.pt (p [2]);

					/*
					 *	complete projection of quads
					 *	and higher-order polygons
					 */

					while (++ k < p.length)

						p [k] [3] === ti || rc.pt (p [k]);

				} while (r = g.faces [++ j]);

			} // group is no child model (is a regular group)

			/*
			 *	add group index to visible groups array
			 */

			this.rGroups [this.nGroups ++] = this.rUnculled [i];

		} // next group (among those that should never be culled)

		for (i = Q >> 1; i < n; i = i + Q) {

			g = G [i >> 8];

			if (g.model === false) {

				x1 =	  g.midpoint_0 - x0;
				y1 = rD * g.midpoint_1 - y0;
				z1 =	  g.midpoint_2 - z0;

				y2 = z1 * cb - x1 * sb;
				z2 = y2 * ca + y1 * sa + g.actualRadius;

				if (z2 < rk)

					continue; // group behind viewpoint

				if (rD < 0 && g.surfaceNormal_1 < -.1)

					continue; // group is a reflection but (definitely) faces up

				x2 = x1 * cb + z1 * sb;
				y2 = y1 * ca - y2 * sa;

				if (rp * (ab (x2 * cc + y2 * sc) - g.actualRadius) > z2 * ri)

					continue; // group outside view frustum along screen-space x

				if (rd * (ab (y2 * cc - x2 * sc) - g.actualRadius) > z2 * rj)

					continue; // group outside view frustum along screen-space y

				if (g.actualRadius / (g.distance = Math.sqrt (x1*x1 + y1*y1 + z1*z1)) < vl)

					continue; // group considered too small to be seen from here

				r = g.faces [0];

				j = 0; do {

					p = r.path;
					k = 2;

					p [0] [3] === ti || rc.pt (p [0]);
					p [1] [3] === ti || rc.pt (p [1]);
					p [2] [3] === ti || rc.pt (p [2]);

					while (++ k < p.length)

						p [k] [3] === ti || rc.pt (p [k]);

				} while (r = g.faces [++ j]);

			} // group is no child model (is a regular group)

			this.rGroups [this.nGroups ++] = i >> 8;

		} // next group (by culling step)

		rc.x = rc.x + this.xOrigin;		//
		rc.y = rc.y + this.yOrigin * rc.D;	// cancel the implied translation
		rc.z = rc.z + this.zOrigin;		//

		++ rc.C;				// set future vertex transform ID

		return this;

	};

	/*
	 *	sortGroups will create a look-up table of visible group indices sorted by
	 *	decreasing distance from viewpoint, i.e. from the farthest to the closest
	 */

	Model.prototype.sortGroups = function (rc) {

	  const abs = Math.abs, 			// local ref.
		min = Math.min, 			// local ref.
		sqt = Math.sqrt,			// local ref.

		x0 = rc.x - this.xOrigin,		//
		y0 = rc.y - this.yOrigin * rc.D,	// view-space origin (visibility rototranslations)
		z0 = rc.z - this.zOrigin,		//

		G = this.groups,			// model groups' array
		V = this.rGroups,			// list of visible groups
		n = this.nGroups,			// visible groups loop count

		L = { },				// sorted groups' look-up table (output)
		S = [ ];				// sorted distances array (output)

	    var j, g, r, p,				// loop index, group index, group record, face path
		u, v, w, d,				// components, vertex index and distance

		i = 0,					// next index in sorted array
		k = 1,					// child model distance modulation coefficient
		c = this.yOrigin + this.ceiling - 2;	// ordinate of geometry's ceiling (when normalized)

		if (this.normalized) {

			rc.D > 0 && (k = rc.y > this.yOrigin + this.ceiling ? .1 : 10)
			rc.D < 0 && (k = 10)

		} // ceiling test: forces drawing all models on top of normalized ones in the proper order

		for (j = 0; j < n; ++ j) {

			g = V [j];
			r = G [g];
			d = g.distance;

			if (r.model) {

				u = r.origin.x - rc.x;
				w = r.origin.z - rc.z;

				if (this.normalized) {

					v = rc.y - rc.D * (r.origin.y + r.model.mould.circumCenter);
					d = r.distance = Math.sqrt (u*u + v*v + w*w);
					d = r.origin.y > c ? k * d : d;

				} // normalized model: could test ceiling plane

				else {

					v = rc.D * r.origin.y - rc.y;
					d = r.distance = Math.sqrt (u*u + v*v + w*w);

				} // otherwise, has no predictable bounding box

			} // a child model

			switch (typeof (L [d = ~~ d])) {

				default:

					L [d] = g;
					S [i] = d; ++ i;

					continue;

				case 'number':

					L [d] = [ L [d] ];

				case 'object':

					L [d].push (g);

			} // updating dictionary L and the yet-to-be-sorted list of distances S

		}

		return {

			groupsByDistance: L,
			arrayOfDistances: S.sort (function (a, b) { return b - a })

		};

	};

	/*
	 *	renderGroup is a hub called to render a single group of mesh faces or any
	 *	child models (which are seen as group entries and stored in the same list
	 *	of face groups); significantly, what it does to set the fill style basing
	 *	on distances and viewing angles determines the overall style of the final
	 *	scene as rendered
	 */

	Model.prototype.renderGroup = function (params, gr) {

	  const rc = params.within,		// local ref.
		dl = params.detailLevel,	// local ref.
		fs = params.edge,		// local ref.
		fd = params.fill;		// local ref.

	    var d0 = gr.distance;		// local ref.

	    var u,				// X component of vector between viewpoint and face
		v,				// Y component of vector between viewpoint and face
		w,				// Z component of vector between viewpoint and face
		t,				// theta to sight (i.e. cosine of viewing angle)

		Q,				// relevance quid (wire alpha)

		i,				// loop index (face group in sorted distance group)
		f,				// face entry (in g.faces)
		j,				// loop index (vertices in each face in face group)
		p,				// face path record
		q,				// relevance quid (dark faces, final)

		R,				// child model vcsr
		m,				// child model instance
		s;				// child model stepping factor

		switch (gr.model) {

			case false:

				switch (this.shiny) {

					case false:

						u = gr.midpoint_0 - params.x;
						v = gr.midpoint_1 - params.y;
						w = gr.midpoint_2 - params.z;
						t = gr.surfaceNormal_0 * u + gr.surfaceNormal_1 * v + gr.surfaceNormal_2 * w;

					     /* if (t < 0)

							return; */

						t = Math.abs (t / (d0 + 1))

						if (this.spaced === false) {

							Q = Math.min (this.brilliance / (d0 * d0 * 4), 1);
							Q = t * t * rc.Q * Q;

						}

						else {

							q = Math.min (this.brilliance / (d0 * d0 * d0 * .4), 1);
							Q = Math.min (this.brilliance / (d0), 1);
							Q = Math.pow (1 - t, 3) * rc.Q * Q;

							rc.D > 0 && (q = .4 * q * (1 - Q));
							rc.D < 0 && (q = .2 * q * (1 - Q));

						}

						if (rc.D < 0) {

							Q = Q - 1E-5 * Math.max (0, gr.midpoint_1 - this.yOrigin) * (rc.sa > 0 ? 1 : rc.ca);

							if (gr.surfaceNormal_1 < .25)

								Q = Q + .5 * (gr.surfaceNormal_1 - .25);

						}

						break

					case true:

						Q = Math.min (rc.Q * rc.q, 1);

				}

				for (i = 0; i < gr.faces.length; ++ i)

					switch ((f = gr.faces [i]).wire) {

						case true:

							if (this.spaced) {

								j = 2;
								p = f.path;

								rc.moveTo (p [0]).wireTo (p [1]).wireTo (p [2]);

								while (++ j < p.length)

									rc.wireTo (p [j]);

								q > .02 && rc.fill (fd, q);
								Q > .01 && rc.fill (fs, Q);

								continue;

							}

							if (Q > .01) {

								j = 2;
								p = f.path;

								rc.moveTo (p [0]).wireTo (p [1]).wireTo (p [2]);

								while (++ j < p.length)

									rc.wireTo (p [j]);

								rc.fill (fs, Q);

							}

							continue;

						case false:

							if (Q > .02) {

								j = 2;
								p = f.path;

								rc.moveTo (p [0]).wireTo (p [1]).wireTo (p [2]);

								while (++ j < p.length)

									rc.wireTo (p [j]);

								rc.fill (fd, q = q || (Q * .4 + .1));

							}

							continue;

					}

				break;

			default:

				R = gr.model.vcsr (gr.scale || World.nullScale);
				m = gr.model.select (R, d0 = d0 > R ? d0 - R : 0);
				s = rc.stepFor (m, R, dl, d0, gr.origin || World.nullTranslate);

				if (s === 0)

					break;

				m.reset ({

					step:	s,
					given:	params.edge = World.monoOutline || gr.edge || World.nullOutline,
					asWell: params.fill = gr.fill || World.nullSurface

				}).rotate	(gr.orient || World.nullRotate)
				  .scale	(gr.scale  || World.nullScale)
				  .translate	(gr.origin || World.nullTranslate, rc.D)
				  .render	(params);

				params.edge = fs;
				params.fill = fd;

		} // switch between regular group and child model

		return this;

	};

	/*
	 *	renderPart is the main rendering loop called by the model's .render
	 *	method; it is kept separate for possible future implementation of a
	 *	modular representation of models, where a part of a model may sport
	 *	a different rendering style than others (e.g. different fill style)
	 */

	Model.prototype.renderPart = function (rc, dl, fs, fd, sortObject) {

	  const params = {

		     x: rc.x - this.xOrigin,		//
		     y: rc.y - this.yOrigin * rc.D,	// vector between model midpoint and rc's viewpoint
		     z: rc.z - this.zOrigin,		//

			within: 	rc,		// pass the rendering context
			detailLevel:	dl,		// pass the level of detail
			edge:		fs,		// placeholder, then reassigned to child model edge
			fill:		fd		// placeholder, then reassigned to child model fill

		},					// passed to Model.render for child models

		G = this.groups,			// model groups' array
		L = sortObject.groupsByDistance,	// sorted entries dictionary (indexed by S)
		S = sortObject.arrayOfDistances;	// array of sorted distances (indices in L)

	    var i,					// index in sorted distances array
		d,					// distance within distances array
		r,					// group or array in sorted groups
		j;					// index in array, where necessary

		for (i = 0; i < S.length; ++ i) {

			d = S [i];
			r = L [d];

			if (r.length)

				for (j = 0; j < r.length; ++ j)

					this.renderGroup (params, G [r [j]]);

			else

				this.renderGroup (params, G [r]);

		} // each sorted entry (either an array of groups, or single group)

		return this;

	};

	/*
	 *	renderFlat is the replacement for renderPart whenever a part of the
	 *	model will be displayed with unsorted groups: it's appropriate when
	 *	models are literally "flat" or when their faces will merge together
	 *	to form a silouetthe, in which cases skipping the sorting pass will
	 *	improve performance, especially if the world is populated with many
	 *	instances of such models...
	 */

	Model.prototype.renderFlat = function (rc, dl, fs, fd) {

	  const params = {

		     x: rc.x - this.xOrigin,		//
		     y: rc.y - this.yOrigin * rc.D,	// vector between model midpoint and rc's viewpoint
		     z: rc.z - this.zOrigin,		//

			within: 	rc,		// pass the rendering context
			detailLevel:	dl,		// pass the level of detail
			edge:		fs,		// placeholder, then reassigned to child model edge
			fill:		fd		// placeholder, then reassigned to child model fill

		},					// passed to Model.render for child models

		G = this.groups,			// model groups' array
		V = this.rGroups;			// list of visible groups

	    var i, g;					// loop index, group record

		for (i = 0; i < this.nGroups; ++ i) {

			g = G [V [i]];

			if (g.model) {

				u = rc.x - g.origin.x;
				v = rc.y - g.origin.y * rc.D;
				w = rc.z - g.origin.z;

			} // a child model

			else {

				u = g.midpoint_0 - params.x;
				v = g.midpoint_1 - params.y;
				w = g.midpoint_2 - params.z;

			} // regular group

			this.renderGroup (params, g, g.distance = Math.sqrt (u*u + v*v + w*w));

		} // each visible group

		return this;

	};

	/*
	 *	finally the transformed, selected, and possibly sorted, mesh faces, can be
	 *	rendered within a given { rc } rendering context
	 */

	Model.prototype.render = function (args) {

	  const rc = be.object (args && args.within).or ('where'),
		dl = be.number (args && args.detailLevel).or (99),
		fs = be.string (args && args.edge).or ('#FF00FF'),
		fd = be.string (args && args.fill).or ('#FF88FF');

		if (rc.constructor === Rc) {

			this.selectGroups (rc);
			this.flat ? this.renderFlat (rc, dl, fs, fd) : this.renderPart (rc, dl, fs, fd, this.sortGroups (rc));

		}

		return this;

	};

	/*
	 *	the MultiModel is a variety of Model that manages "far" versions of models that may
	 *	display thicker wires and less detail when seen from a distance: it currently holds
	 *	seven progressively "simplified" versions of the model in question plus the model's
	 *	base (close-up) version and takes identical arguments as of Model plus an extra one
	 *	being called { thickener } and holding an array of seven values used as multipliers
	 *	for the base model's thickness to obtain the far versions
	 */

	MultiModel = function (args) {

	  const ranger = be.number (args && args.steepness).or (.86),
		scaler = be.vector (args && args.thickener).or ([ .1, .2, .3, .4, .5, .6, .7 ]),

		params = {

			from:		be.string (args && args.from).or (null),
			bright: 	be.switch (args && args.bright).or (true),
			flat:		be.switch (args && args.flat).or (false),
			shiny:		be.switch (args && args.shiny).or (false),
			solid:		be.switch (args && args.solid).or (false),
			spacing:	be.number (args && args.spacing).or (1),
			thickness:	be.number (args && args.thickness).or (1),
			threshold:	be.number (args && args.threshold).or (1)

		};

		this.mould = new Model (params);
		this.mores = new Array (this.mould);

		if (params.spacing === 1) {

			params.noFile = true;
			params.latest = new Object ({ excepted: false });

			scaler.length > 0 && params.latest.excepted === false && this.mores.push (params.latest = new Model (params, params.thickness *= 1 + be.number (scaler [0]).or (.1)));
			scaler.length > 1 && params.latest.excepted === false && this.mores.push (params.latest = new Model (params, params.thickness *= 1 + be.number (scaler [1]).or (.2)));
			scaler.length > 2 && params.latest.excepted === false && this.mores.push (params.latest = new Model (params, params.thickness *= 1 + be.number (scaler [2]).or (.3)));
			scaler.length > 3 && params.latest.excepted === false && this.mores.push (params.latest = new Model (params, params.thickness *= 1 + be.number (scaler [3]).or (.4)));
			scaler.length > 4 && params.latest.excepted === false && this.mores.push (params.latest = new Model (params, params.thickness *= 1 + be.number (scaler [4]).or (.5)));
			scaler.length > 5 && params.latest.excepted === false && this.mores.push (params.latest = new Model (params, params.thickness *= 1 + be.number (scaler [5]).or (.6)));
			scaler.length > 6 && params.latest.excepted === false && this.mores.push (params.latest = new Model (params, params.thickness *= 1 + be.number (scaler [6]).or (.7)));

			params.latest.excepted && this.mores.pop ();

		} // spaced models don't need wiring, and hence variants

		return (this.steepness = ranger), this;

	};

	MultiModel.prototype.normalize = function () {

		for (var i in this.mores)

			this.mores [i].normalize ();

		return this;

	};

	MultiModel.prototype.pair = function () {

		for (var i in this.mores)

			this.mores [i].pair ();

		return this;

	};

	MultiModel.prototype.outline = function () {

		for (var i in this.mores)

			this.mores [i].outline ();

		return this;

	};

	MultiModel.prototype.scale = function (args) {

		for (var i in this.mores)

			this.mores [i].scale (args);

		return this;

	};

	MultiModel.prototype.rotate = function (args) {

		for (var i in this.mores)

			this.mores [i].rotate (args);

		return this;

	};

	MultiModel.prototype.translate = function (args) {

		for (var i in this.mores)

			this.mores [i].translate (args);

		return this;

	};

	MultiModel.prototype.finalize = function () {

		for (var i in this.mores)

			this.mores [i].finalize ();

		return this;

	};

	MultiModel.prototype.addChild = function (object, origin) {

	  const childRecords = new Array ();
	    var aChildRecord;

		for (var i in this.mores) {

			if (aChildRecord = this.mores [i].addChild (object, origin))

				childRecords.push (aChildRecord [0]);

		}

		return childRecords;

	};

	MultiModel.prototype.vcsr = function (args) {

		return this.mould.vcsr (args);

	};

	MultiModel.prototype.select = function (radius, distanceFromViewpoint) {

	  const d = Math.pow (distanceFromViewpoint, this.steepness),
		i = Math.min (~~(d / radius), this.mores.length - 1);

		return this.mores [i];

	};

	/*
	 *
	 *	===================================================================================
	 *	layered scene rendering - individual layers have objects' Z-order sorted by default
	 *	===================================================================================
	 *
	 *	Copyright 2018-2024 by Alessandro Ghignola
	 *	Public domain - but you're on your own. :)
	 *
	 */

	World = {

		layers: {

			// client will add layers here

		},

		render: function (args) {

		  const rc = be.object (args && args.within).or (null),
			context = be.object (args && args.context).or (null),
			layerNames = be.vector (args && args.layers).or (new Array),
			detail = be.number (args && args.detail).or (75) * basic_LoD,
			range = Math.pow (be.number (args && args.range).or (455190), 2),
			sort = be.switch (args && args.sort).or (true),
			params = { within: rc, context: context, edge: World.monoOutline || World.nullOutline, fill: World.nullSurface, detailLevel: detail },
			layers = new Array,

			abs = Math.abs,
			sqt = Math.sqrt,	// local refs.

			ca = rc.ca,
			cb = rc.cb,
			cc = rc.cc,
			sa = rc.sa,
			sb = rc.sb,
			sc = rc.sc,		// local refs.

			H = { },		// dictionary of processed models so far
			L = { },		// dictionary holding all models to sort
			S = [ ];		// sorted array of distances, indexing L

		    var layer, i, j, m, r, o, R, x1, y1, z1, y2, z2, d, v, s, n = t = 0;

			RC.FS = empty;
			RC.GA = 1;

			layerNames.forEach (layer => {

				layer = be.string (layer).or (undefined);
				layer = be.vector (World.layers [layer]).or (null);

				if (layer) {

					n += (1);
					t += (layer.length);

					layers.push (layer);

				}

			}) // collecting layers

			if (t === 0)

				return; // all layers are empty, have no objects

			if (sort == true) {

				j = 0; while (n) {

					layer = layers [-- n];

					if (layer.length === 0)

						continue;

					i = 0; do {

						if (m = layer [i]) {

							r = m.model.mould;
							o = m.origin || World.nullTranslate;
							R = r.vcsr (m.scale || World.nullScale);

							/*
							 *	if (rc.scan (R, o.x, o.y, o.z) === false)
							 *
							 *		continue;
							 */

							x1 = o.x - rc.x;
							y1 = o.y * rc.D - rc.y;
							z1 = o.z - rc.z;

							y2 = z1 * cb - x1 * sb;
							z2 = y2 * ca + y1 * sa + R;

							if (z2 < rc.k)

								continue; // model completely behind the viewpoint

							x2 = x1 * cb + z1 * sb;
							y2 = y1 * ca - y2 * sa;

							if (rc.p * (abs (x2 * cc + y2 * sc) - R) >= z2 * rc.i)

								continue; // model completely outside view frustum

							if (rc.d * (abs (y2 * cc - x2 * sc) - R) >= z2 * rc.j)

								continue; // model completely outside view frustum

							if ((d = x1*x1 + y1*y1 + z1*z1) > range + R*R)

								continue; // model out of visibility range

							/*
							 *	if the layer to render isn't the first one listed,
							 *	it is considered a layer of child models only, and
							 *	the parent is eventually added to the dictionary L
							 *
							 *	      - yes, this is admittedly tricky, especially
							 *		in how m.parent isn't updated when a child
							 *		model is removed from the parent, but it's
							 *		quick, efficient, and guarded by referring
							 *		to the same model if it doesn't seem to be
							 *		a child model, where the list of layers is
							 *		used to render more "root" layers, not one
							 *		root followed by one or more childs layers
							 */

							if (n === 0) {

								if (m.parentId && H [m.parentId])

									continue;

							} // ignore enlisted parent

							else {

								if (m.parent) {

									if (H [m.parent.parentId])

										continue;

									H [(m = m.parent).parentId] = 1;

								     /* o = m.origin || World.nullTranslate;	//
														//
									x1 = o.x - rc.x;			//	would list this child model
									y1 = o.y * rc.D - rc.y; 		//	at the same distance as its
									z1 = o.z - rc.z;			//	parent, but I'm not sure...
														//
									d = x1*x1 + y1*y1 + z1*z1;*/		//

								}

							} // enlist the parent ONCE

							switch (typeof (L [d = ~~ sqt (d)])) {

								default:

									L [d] = m;
									S [j] = d; ++ j;

									continue;

								case 'object':

									L [d].push && L [d].push (m) || (L [d] = [ L [d], m ]);

							}

						} // model exists

					} while (++ i < layer.length);

				} // each layer

				if (S.length === 0)

					return;

				S.sort (function (a, b) { return b - a });

				i = 0; do {

					r = L [S [i]];

					if (r.length) {

						j = 0; do {

							m = r [j];

							R = m.model.vcsr (m.scale || World.nullScale);
							v = m.model.select (R, d = S [i] > R ? S [i] - R : 0);

							v.reset ({

								step:	rc.stepForVisible (v, R, detail, d),
								given:	params.edge = World.monoOutline || m.edge || World.nullOutline,
								asWell: params.fill = m.fill || World.nullSurface

							}).rotate      (m.orient || World.nullRotate)
							  .scale       (m.scale  || World.nullScale)
							  .translate   (m.origin || World.nullTranslate)
							  .render      (params);

						} while (++ j < r.length);

						continue;

					}

					R = r.model.vcsr (r.scale || World.nullScale);
					v = r.model.select (R, d = S [i] > R ? S [i] - R : 0);

					v.reset ({

						step:	rc.stepForVisible (v, R, detail, d),
						given:	params.edge = World.monoOutline || r.edge || World.nullOutline,
						asWell: params.fill = r.fill || World.nullSurface

					}).rotate      (r.orient || World.nullRotate)
					  .scale       (r.scale  || World.nullScale)
					  .translate   (r.origin || World.nullTranslate)
					  .render      (params);

				} while (++ i < S.length);

				return;

			} // case where objects have to be sorted (default for the "sort" argument)

			while (n) {

				layer = layers [-- n];

				if (layer.length === 0)

					continue;

				i = 0; do {

					if (m = layer [i]) {

						if (n === 0) {

							if (m.parentId && H [m.parentId])

								continue;

						} // ignore rendered parent

						else {

							if (m.parent) {

								if (H [m.parent.parentId])

									continue;

								H [(m = m.parent).parentId] = 1;

							}

						} // render the parent ONCE

						o = m.origin || World.nullTranslate;
						R = m.model.vcsr (m.scale || World.nullScale);

						x1 = o.x - rc.x;
						y1 = o.y * rc.D - rc.y;
						z1 = o.z - rc.z;

						if ((d = x1*x1 + y1*y1 + z1*z1) > range + R*R)

							continue; // model out of visibility range

						v = m.model.select (R, d = sqt (d > R ? d - R : 0));
						s = rc.stepFor (v, R, detail, d, o);

						s === 0 || v.reset ({

							step:	s,
							given:	params.edge = World.monoOutline || m.edge || World.nullOutline,
							asWell: params.fill = m.fill || World.nullSurface

						}).rotate      (m.orient || World.nullRotate)
						  .scale       (m.scale  || World.nullScale)
						  .translate   (m.origin || World.nullTranslate)
						  .render      (params);

					} // model exists

				} while (++ i < layer.length); // case where objects don't need any sorting

			} // each layer

		},

		ground: function (args) {

		  const rc = be.object (args && args.within).or (null),
			eyes = be.number (args && args.eyes).or (rc.y),
			ft = be.object (args && args.feet).or (rc),
			layerName = be.string (args && args.layer).or (null),
			layer = be.vector (World.layers [layerName]).or (new Array ()),
			currentPosition = { h: ft.x, v: ft.z };

		    var i, m, r, o, R, u, w, j, g, k, f, y, h = -1, O = false;

			if (layer.length === 0)

				return false; // layer is empty, has no objects

			i = layer.length; do {

				if (m = layer [-- i]) {

					r = m.model.mould;

					if (r.solid === false)

						continue; // object model not supposed to be solid

					o = m.origin || World.nullTranslate;
					R = m.model.vcsr (m.scale || World.nullScale);

					u = ft.x - o.x;
					w = ft.z - o.z;

					if (u*u + w*w > R * R)

						continue; // viewpoint out of circumsphere imprint

					for (j = 0; j < r.groups.length; ++ j) {

						g = r.groups [j];

						if (g.model)

							continue; // child model

						for (k = 0; k < g.faces.length; ++ k) {

							f = g.faces [k];
							y = f.midpoint_1 + m.origin.y;

							if (f.edge)

								continue;

							if (y > eyes)

								continue;

							if (Math.abs (f.surfaceNormal_1) < .99)

								continue;

							currentPosition.h = u;
							currentPosition.v = w;

							if (Maths.inPolygon (currentPosition, f.path, 'xz'))

								if (y > h) {

									h = y;
									O = m;

								}

						}

					}

				} // model exists

			} while (i);

			return O && { level: h, object: O };

		},

		nullRotate: {

			pitch:	0,
			yaw:	0,
			roll:	0

		},

		nullScale: {

			uniform: 1

		},

		nullTranslate: {

			x: 0,
			y: 0,
			z: 0

		},

		monoOutline: notset,
		nullOutline: '#F0F',
		nullSurface: '#808',

		generator: -1	// generates progressive numeric IDs where unique IDs are needed

	};



