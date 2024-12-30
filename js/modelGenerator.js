



	const xplicity = 1.4;

	be = {

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

	} // argument type validation monads




	Maths = {

		unitize: function (u) {

		  const k = 1 / Math.sqrt (u [0] * u [0] + u [1] * u [1] + u [2] * u [2]);

			u [0] *= k;
			u [1] *= k;
			u [2] *= k;

			return u;

		},

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

		inPolygon: function (point, shape, plane) {

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

				poly.push ({ x: (v = Maths.to25 (face.path [i], tr)).x, y: v.y, z: v.z });

			if (noBuffering)

				return { edge: edge, area: Maths.polyArea (poly), except: false };

			if (buff = Maths.polyBuffer (poly, spacing)) {

				i = buff.length;

				do {

					edge.push (Maths.to3D (buff [-- i], v.z, tr));

				} while (i);

				return { edge: edge, area: Maths.polyArea (poly), except: false };

			}

			return { edge: edge, area: Maths.polyArea (poly), except: true };

		},

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

	} // Maths




	World = {

		generator: -1

	} // determines unique group IDs but I'm not sure it's necessary outside the same model, if it is, it could be synched to that in the global scope




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

	} // Model (constructor)

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

	} // Model.prototype.vertex

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

	} // Model.prototype.face

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

	} // Model.prototype.group

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

	} // Model.prototype.end

	/*
	 *	returns a .OBJ reconstruction of the model's geometry
	 */

	Model.prototype.to_obj = function (args) {

	  const $ = function (n) {

			return (n.toFixed (5).replace (/\.?0+$/, '') || '0').replace (/^(\-?)0\./, '$1.')

		}; // strips trailing and leading zeros from values (.obj specs say nothing, about those)

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

	} // Model.prototype.to_obj

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

			f = this.face (p);

			if (this.spaced) {

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

	} // Model.prototype.parse

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

	} // Model.prototype.normalize

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

	} // Model.prototype.pair

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

	} // Model.prorotype.outline

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

	} // create list of relevant groups to be "forced in"

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

	} // Model.prorotype.reset

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

	} // Model.prototype.rotate

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

	} // Model.prototype.scale

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

	} // Model.prototype.finalize




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

	} // MultiModel (constructor)

	MultiModel.prototype.normalize = function () {

		for (var i in this.mores)

			this.mores [i].normalize ();

		return this;

	} // MultiModel.prototype.normalize

	MultiModel.prototype.pair = function () {

		for (var i in this.mores)

			this.mores [i].pair ();

		return this;

	} // MultiModel.prototype.pair

	MultiModel.prototype.outline = function () {

		for (var i in this.mores)

			this.mores [i].outline ();

		return this;

	} // MultiModel.prototype.outline

	MultiModel.prototype.scale = function (args) {

		for (var i in this.mores)

			this.mores [i].scale (args);

		return this;

	} // MultiModel.prototype.scale

	MultiModel.prototype.rotate = function (args) {

		for (var i in this.mores)

			this.mores [i].rotate (args);

		return this;

	} // MultiModel.prototype.rotate

	MultiModel.prototype.finalize = function () {

		for (var i in this.mores)

			this.mores [i].finalize ();

		return this;

	} // MultiModel.prototype.finalize

	self.onmessage = function (e) {

	    let model = e.data.model
	    let instance = e.data.instance

	    let outputmodel = new MultiModel ({

			from:		model,
			solid:		instance.solid,
			flat:		instance.flat,
			shiny:		instance.shiny,
			spacing:	instance.spacing,
			thickness:	instance.thickness,
			threshold:	instance.threshold

		}).scale ({

			x: instance.anis.x,
			y: instance.anis.y,
			z: instance.anis.z

		}).rotate ({ pitch: instance.lay }).normalize ()

		outputmodel.spaced || outputmodel.pair ()
		outputmodel.spaced || outputmodel.outline ()

		self.postMessage (outputmodel.scale ({ uniform: 200 * instance.size }).finalize ().rotate ({ yaw: instance.orient.yaw }))
		self.close ()

	} // self.onmessage



