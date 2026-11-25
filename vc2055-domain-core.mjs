// src/domain/model.ts
function e(e) {
	return typeof e == "object" && e && !Array.isArray(e) ? e : null;
}
function t(e) {
	return Array.isArray(e) ? e : [];
}
function n(e) {
	return e === "ours" || e === "opponent";
}
function r(e) {
	return typeof e == "number" && Number.isInteger(e) && e >= 1 && e <= 6;
}
function i(t) {
	let n = e(t);
	return n && typeof n.us == "number" && Number.isInteger(n.us) && n.us >= 0 && typeof n.opponent == "number" && Number.isInteger(n.opponent) && n.opponent >= 0 ? Object.freeze({
		us: n.us,
		opponent: n.opponent
	}) : null;
}
// src/domain/scoring.ts
function a(t) {
	let r = e(t), a = i(r?.scoreBefore), o = i(r?.scoreAfter), s = n(r?.winner) ? r.winner : null;
	if (!a || !o || !s) return Object.freeze({
		state: "unknown",
		before: a,
		after: o,
		winner: s
	});
	let c = s === "ours" ? o.us === a.us + 1 && o.opponent === a.opponent : o.opponent === a.opponent + 1 && o.us === a.us;
	return Object.freeze({
		state: c ? "verified" : "inconsistent",
		before: a,
		after: o,
		winner: s
	});
}
function o(n) {
	let r = t(e(n)?.sets), i = 0, o = 0, s = 0, c = 0;
	for (let n of r) for (let r of t(e(n)?.rallies)) {
		if (!e(r)) continue;
		c++;
		let t = a(r).state;
		t === "verified" ? i++ : t === "inconsistent" ? o++ : s++;
	}
	return Object.freeze({
		verified: i,
		inconsistent: o,
		unknown: s,
		rallies: c
	});
}
// src/domain/rotation.ts
function s(e, t = 1) {
	return r(e) ? (e - 1 + (t === 1 ? -1 : 1) + 6) % 6 + 1 : null;
}
function c(e, t) {
	let a = i(e.score), o = n(e.serving) ? e.serving : null, c = r(e.rotationUs) ? e.rotationUs : null, l = r(e.rotationOpponent) ? e.rotationOpponent : null;
	if (!a || !o || !c || !l || !n(t)) return Object.freeze({
		state: "unknown",
		score: a,
		serving: o,
		rotationUs: c,
		rotationOpponent: l,
		sideOut: null
	});
	let u = t !== o;
	return Object.freeze({
		state: "projected",
		score: Object.freeze({
			us: a.us + +(t === "ours"),
			opponent: a.opponent + +(t === "opponent")
		}),
		serving: t,
		rotationUs: u && t === "ours" ? s(c) : c,
		rotationOpponent: u && t === "opponent" ? s(l) : l,
		sideOut: u
	});
}
// src/domain/statistics.ts
function l(n) {
	let r = t(n).map(e).filter((e) => !!e && e.skill === "A"), i = r.filter((e) => e.evaluation === "#").length, a = r.filter((e) => e.evaluation === "=").length, o = r.filter((e) => e.evaluation === "/").length;
	return Object.freeze({
		attempts: r.length,
		kills: i,
		errors: a,
		blocked: o,
		efficiencyPct: r.length ? Math.round((i - a - o) / r.length * 100) : null
	});
}
function u(r, i = "ours") {
	let a = 0, o = 0, s = 0, c = 0, l = 0, u = 0;
	for (let d of t(r)) {
		let t = e(d);
		if (!t) continue;
		let r = t.servingBefore, f = t.winner;
		if (!n(r)) continue;
		let p = r !== i;
		n(f) ? p ? (a++, f === i && o++) : (s++, f === i && c++) : p ? l++ : u++;
	}
	let d = (e, t, n) => Object.freeze({
		attempts: e,
		won: t,
		percent: e ? Math.round(t / e * 100) : null,
		unknown: n
	});
	return Object.freeze({
		sideOut: d(a, o, l),
		breakPoint: d(s, c, u)
	});
}
// src/domain/code-grammar.ts
var d = /^(R?)(\d+)([SREABDFC])([#+!\-/=]?)(.*)$/, f = /^\.([1-9][A-D]?)(?:>([1-9][A-D]?|C[1-8]))?/, p = /* @__PURE__ */ new Set([
	"Z4",
	"Z2",
	"Z1",
	"Z6",
	"1T",
	"31",
	"BACK",
	"PIPE",
	"2T",
	"OTR"
]), m = /* @__PURE__ */ new Set([
	"JF",
	"JP",
	"F",
	"U"
]), h = /* @__PURE__ */ new Set([
	"Q",
	"U",
	"T",
	"M",
	"H",
	"O"
]), g = () => ({
	serveType: null,
	combination: null,
	dvCall: null,
	phase: null,
	blockers: null,
	blockTarget: null,
	direction: null,
	tempo: null,
	subtype: null,
	setType: null,
	special: null,
	custom: null
});
function _(e, t) {
	let n = g(), r = e, i = !0, a = (e, t) => {
		n[e] === null ? n[e] = t : i = !1;
	};
	for (; i && r;) {
		let e = 0;
		if (r.startsWith("::")) {
			let t = r.match(/^::([A-Z0-9]{1,6})(?![A-Z0-9])/);
			t && (a("dvCall", t[1]), e = t[0].length);
		} else if (r.startsWith(":")) {
			let n = r.match(/^:([A-Z0-9]{1,6})(?![A-Z0-9])/);
			n && (p.has(n[1]) ? a("combination", n[1]) : t === "A" || t === "E" ? a("dvCall", n[1]) : i = !1, e = n[0].length);
		} else if (r.startsWith("~")) {
			let n = r.match(/^~([A-Z0-9]{1,6})(?![A-Z0-9])/);
			if (n) {
				let r = n[1];
				(t === "A" || t === "E") && h.has(r) ? a("tempo", r) : m.has(r) ? a("serveType", r) : i = !1, e = n[0].length;
			}
		} else if (r.startsWith("^")) {
			let t = r.match(/^\^(K1|K2|FB|TR)(?![A-Z0-9])/);
			t && (a("phase", t[1]), e = t[0].length);
		} else if (r.startsWith("@")) {
			let t = r.match(/^@([0-3])(?![A-Z0-9])/);
			t && (a("blockers", t[1]), e = t[0].length);
		} else if (r.startsWith("&")) {
			let n = r.match(/^&(\d{1,3})(?![A-Z0-9])/);
			n && t === "B" && (a("blockTarget", n[1]), e = n[0].length);
		} else if (r.startsWith("*")) {
			let n = r.match(/^\*(LIN|DC|DL)(?![A-Z0-9])/);
			n && t === "A" && (a("direction", n[1]), e = n[0].length);
		} else if (r.startsWith("%")) {
			let t = r.match(/^%([A-Z0-9]{1,8})(?![A-Z0-9])/);
			t && (a("subtype", t[1]), e = t[0].length);
		} else if (r.startsWith("|")) {
			let t = r.match(/^\|([FCBPS])(?![A-Z0-9])/);
			t && (a("setType", t[1]), e = t[0].length);
		} else if (r.startsWith("?")) {
			let t = r.match(/^\?([A-Z0-9]{1,10})(?![A-Z0-9])/);
			t && (a("special", t[1]), e = t[0].length);
		} else if (r.startsWith("$")) {
			let t = r.match(/^\$([A-Z0-9]{1,5})(?![A-Z0-9])/);
			t && (a("custom", t[1]), e = t[0].length);
		}
		if (!e) {
			i = !1;
			break;
		}
		r = r.slice(e);
	}
	return Object.freeze({
		ok: i && r.length === 0,
		values: Object.freeze({ ...n })
	});
}
function v(e) {
	let t = String(e ?? "").trim().toUpperCase().replace(/\s+/g, ""), n = () => Object.freeze({
		state: "empty",
		normalized: t,
		team: null,
		dorsal: null,
		skill: null,
		evaluation: null,
		startZone: null,
		endZone: null,
		advanced: "",
		modifiers: Object.freeze(g()),
		reason: "Sin código."
	});
	if (!t) return n();
	let r = t.match(d);
	if (!r || t.length > 160) return Object.freeze({
		state: "unsupported",
		normalized: t,
		team: null,
		dorsal: null,
		skill: null,
		evaluation: null,
		startZone: null,
		endZone: null,
		advanced: "",
		modifiers: Object.freeze(g()),
		reason: "No coincide con la estructura de un código nativo."
	});
	let i = r[1] ? "opponent" : "ours", a = r[2], o = r[3], s = r[4] || "!", c = r[5], l = null, u = null, p = c.match(f);
	p && (l = p[1], u = p[2] || null, c = c.slice(p[0].length), u || o !== "R" && o !== "D" || (u = l, l = null));
	let m = !!p && !p[2] && ![
		"R",
		"D",
		"B"
	].includes(o), h = !!u && u.startsWith("C") && o !== "A", v = _(c, o), y = !m && !h && v.ok && !c.startsWith(".");
	return Object.freeze({
		state: y ? "candidate" : "unsupported",
		normalized: t,
		team: i,
		dorsal: a,
		skill: o,
		evaluation: s,
		startZone: l,
		endZone: u,
		advanced: c,
		modifiers: v.values,
		reason: y ? "Estructura reconocida; la plantilla y las reglas siguen pendientes del parser original." : m ? "El fundamento requiere origen y destino; solo R, D y B admiten una zona única." : h ? "El destino en cono solo corresponde a un ataque." : "El sufijo no está cubierto de forma segura por la gramática TypeScript."
	});
}
function y(e, t) {
	let n = v(e), r = typeof t == "object" && t ? t : null;
	if (n.state !== "candidate" || !r) return Object.freeze({
		state: "unknown",
		reason: "Comparación no disponible."
	});
	let i = r.action && typeof r.action == "object" ? r.action : null;
	if (!i) return Object.freeze({
		state: "unknown",
		reason: "El motor original rechazó el código o no devolvió una acción."
	});
	let a = (e) => String(e ?? "").trim().replace(/^0+(?=\d)/, ""), o = i.team === n.team && i.skill === n.skill && i.evaluation === n.evaluation && a(i.playerNumberSnapshot) === a(n.dorsal);
	return Object.freeze({
		state: o ? "agree" : "disagree",
		reason: o ? "Coinciden los campos básicos con el motor original." : "Diferencia en equipo, dorsal, fundamento o valoración."
	});
}
// src/domain/substitutions.ts
var b = /* @__PURE__ */ new Set([
	"p1",
	"p2",
	"p3",
	"p4",
	"p5",
	"p6"
]);
function x(e) {
	return typeof e == "number" && Number.isSafeInteger(e) && e > 0 ? e : typeof e == "string" && /^\d+$/.test(e) && Number(e) > 0 ? Number(e) : null;
}
function S(t) {
	let n = [], r = String(t.position ?? ""), i = x(t.outgoingPlayer), a = x(t.incomingPlayer), o = e(t.lineup);
	if (t.matchStatus === "finished" && n.push("Partido finalizado."), b.has(r) || n.push("Posición de pista no reconocida."), r === t.liberoActivePosition && n.push("El líbero ocupa esa posición."), i !== null && a !== null && i === a && n.push("El jugador entrante coincide con el saliente."), a !== null && o) {
		for (let [e, t] of Object.entries(o)) if (e !== r && b.has(e) && x(t) === a) {
			n.push("El jugador entrante ya ocupa otra posición.");
			break;
		}
	}
	let s = b.has(r) && o ? x(o[r]) : null;
	i !== null && s !== null && s !== i && n.push("El dorsal saliente no coincide con la posición actual.");
	let c = n.length ? "blocked" : i === null || a === null || !o || s === null ? "unknown" : "plausible";
	return Object.freeze({
		state: c,
		reasons: Object.freeze(n),
		officialLegality: "not-evaluated"
	});
}
// src/state/match-state-contract.ts
function C(e) {
	return [
		e.MatchState,
		e.VC_MATCH_STATE,
		e.VC_SCOUT_VIDEO_BRIDGE,
		e.VC_SCOUT_REPORT_BRIDGE
	];
}
function w(t) {
	for (let n of C(t)) try {
		let t = e(n?.getActive?.());
		if (t) return t;
	} catch {}
	return null;
}
function T(t) {
	let n = e(w(t)?.liveRally);
	return Array.isArray(n?.actions) ? n.actions : [];
}
// src/domain/runtime.ts
function E(n) {
	let i = e(n), a = o(n), s = [], c = [];
	for (let n of t(i?.sets)) for (let r of t(e(n)?.rallies)) {
		let n = e(r);
		if (n) {
			s.push(n);
			for (let r of t(n.actions)) {
				let t = e(r);
				t?.skill === "A" && t.team === "ours" && c.push(t);
			}
		}
	}
	let d = r(i?.rotationNo) && r(i?.opponentRotationNo) ? `R${i.rotationNo} · Rival R${i.opponentRotationNo}` : "Sin datos suficientes", f = u(s);
	return Object.freeze({
		matchAvailable: !!i,
		score: a,
		rotation: d,
		sideOutPct: f.sideOut.percent,
		breakPointPct: f.breakPoint.percent,
		attackEfficiencyPct: l(c).efficiencyPct
	});
}
function D(e) {
	let t = e.document, n = t.getElementById("v11-management");
	if (!n) return null;
	if (e.VC_DOMAIN_2055) return e.VC_DOMAIN_2055;
	let r = (e, n = "", r = "") => {
		let i = t.createElement(e);
		return i.className = n, i.textContent = r, i;
	}, i = r("section", "vc2055-domain");
	i.id = "vc2055-domain";
	let a = r("div", "vc2055-heading"), o = r("div");
	o.append(r("small", "", "MOTOR DE DOMINIO · V20.5.5"), r("h3", "", "Reglas TypeScript · diagnóstico")), a.append(o, r("span", "", "Solo lectura"));
	let c = r("p", "", "Puntuación, rotaciones, códigos y estadísticas tipadas. El registro, marcador y nube siguen utilizando el motor original."), l = r("p", "vc2055-status", "Sin datos comprobados");
	l.setAttribute("role", "status");
	let u = r("div", "vc2055-metrics"), d = [
		["verified", "Trazas verificadas"],
		["inconsistent", "Inconsistencias"],
		["unknown", "Trazas sin datos"],
		["rotation", "Rotaciones"],
		["so", "Side-Out propio"],
		["bp", "Break Point propio"],
		["attack", "Eficiencia ataque"]
	], f = /* @__PURE__ */ new Map();
	for (let [e, t] of d) {
		let n = r("div");
		n.append(r("small", "", t));
		let i = r("strong", "", "—");
		n.append(i), u.append(n), f.set(e, i);
	}
	let p = r("button", "vc2055-refresh", "Comprobar reglas");
	p.setAttribute("type", "button");
	let m = r("p", "vc2055-note", "Una traza sin datos no es un error. Las comprobaciones no sustituyen la validación oficial de líberos y sustituciones ni confirman la sincronización en otro dispositivo.");
	i.append(a, c, l, u, p, m);
	let h = t.getElementById("vc2053-modular-core");
	h?.parentNode === n ? h.insertAdjacentElement("afterend", i) : n.insertAdjacentElement("afterbegin", i);
	let g = () => E(w(e)), _ = (e) => e === null ? "—" : `${e}%`, y = () => {
		let e = g();
		l.textContent = e.matchAvailable ? "Datos del partido original examinados" : "Sin partido activo", i.dataset.state = e.matchAvailable ? "available" : "waiting";
		let t = {
			verified: String(e.score.verified),
			inconsistent: String(e.score.inconsistent),
			unknown: String(e.score.unknown),
			rotation: e.rotation,
			so: _(e.sideOutPct),
			bp: _(e.breakPointPct),
			attack: _(e.attackEfficiencyPct)
		};
		for (let [e, n] of Object.entries(t)) {
			let t = f.get(e);
			t && t.textContent !== n && (t.textContent = n);
		}
	}, b = !1, x = !1, C = () => {
		x || b || !n.classList.contains("active") || (b = !0, Promise.resolve().then(() => {
			b = !1, x || y();
		}));
	};
	p.addEventListener("click", y);
	let T = () => {}, D = !1;
	if (e.VC_STATE_2059) {
		let t = [
			e.VC_STATE_2059.subscribe("score", C),
			e.VC_STATE_2059.subscribe("court", C),
			e.VC_STATE_2059.subscribe("rally", C),
			e.VC_STATE_2059.subscribe("status", C)
		];
		T = () => t.forEach((e) => e());
	} else {
		D = !0, t.addEventListener("vc:matchstatechange", C);
		try {
			let t = e.MatchState?.subscribe?.(C);
			typeof t == "function" && (T = t);
		} catch {}
	}
	let O = typeof MutationObserver == "function" ? new MutationObserver(C) : null;
	O?.observe(n, {
		attributes: !0,
		attributeFilter: ["class"]
	}), n.classList.contains("active") && y();
	let k = Object.freeze({
		version: "20.5.5",
		readOnly: !0,
		inspectCodeShape: v,
		inspectSubstitution: S,
		nextRotation: s,
		inspectCurrent: g,
		dispose() {
			x || (x = !0, O?.disconnect(), T(), D && t.removeEventListener("vc:matchstatechange", C), i.remove(), e.VC_DOMAIN_2055 === k && delete e.VC_DOMAIN_2055);
		}
	});
	return e.VC_DOMAIN_2055 = k, k;
}
// src/domain/shadow-validation.ts
var O = 80, k = (e) => e === "v800-code" ? "directo" : e === "v113-video-code" ? "video" : "otro", A = (e) => v(e);
function j(t) {
	let n = e(t), r = A(n?.code), i = k(n?.source), a = e(n?.nativeShape), o = {
		source: i,
		skill: r.skill || "—",
		advanced: !!r.advanced
	};
	if (a) {
		if (r.state !== "candidate") return Object.freeze({
			kind: "coverage-gap",
			...o,
			reason: "El motor original reconoce una sintaxis aún no cubierta por el módulo TS."
		});
		let e = y(n?.code, { action: a });
		if (e.state === "agree") return Object.freeze({
			kind: "agree",
			...o,
			reason: "Coinciden equipo, dorsal, fundamento y valoración."
		});
		if (e.state === "disagree") return Object.freeze({
			kind: "difference",
			...o,
			reason: "Difieren campos básicos frente al parser nativo."
		});
	}
	return n?.state === "error" ? Object.freeze({
		kind: "native-reject",
		...o,
		reason: "El motor original no aceptó el borrador; puede faltar un jugador o un campo."
	}) : Object.freeze({
		kind: "unverified",
		...o,
		reason: "No hay dos resultados completos para comparar."
	});
}
function ee() {
	let e = 0, t = 0, n = 0, r = 0, i = 0, a = 0, o = [];
	return Object.freeze({
		record(s) {
			let c = j(s);
			return e++, c.kind === "agree" ? t++ : c.kind === "difference" ? n++ : c.kind === "coverage-gap" ? r++ : c.kind === "native-reject" ? i++ : a++, c.kind !== "agree" && (o.push(c), o.length > O && o.shift()), c;
		},
		snapshot: () => Object.freeze({
			version: "20.5.6",
			mode: "in-memory-read-only",
			counters: Object.freeze({
				total: e,
				agree: t,
				difference: n,
				coverageGap: r,
				nativeReject: i,
				unverified: a
			}),
			recent: Object.freeze([...o]),
			limitations: Object.freeze([
				"Solo compara borradores vistos por la previsualización nativa; no acredita que se hayan registrado.",
				"Una diferencia de sintaxis no prueba un error de puntuación.",
				"No incluye códigos, dorsales, nombres, identificadores de partido ni datos de nube."
			])
		}),
		clear() {
			e = 0, t = 0, n = 0, r = 0, i = 0, a = 0, o.length = 0;
		}
	});
}
// src/domain/shadow-runtime.ts
function te(e) {
	let t = e.document, n = t.getElementById("v11-management");
	if (!n) return null;
	if (e.VC_SHADOW_2056) return e.VC_SHADOW_2056;
	let r = ee(), i = (e, n = "", r = "") => {
		let i = t.createElement(e);
		return i.className = n, i.textContent = r, i;
	}, a = i("section", "vc2056-shadow");
	a.id = "vc2056-shadow";
	let o = i("div", "vc2056-heading"), s = i("div");
	s.append(i("small", "", "VALIDACIÓN PARALELA · V20.5.6"), i("h3", "", "Comparación de códigos · sesión actual")), o.append(s, i("span", "", "Sin modificar scouting")), a.append(o, i("p", "", "Compara los borradores ya revisados por el motor nativo con el módulo TypeScript, sin volver a ejecutar el parser."));
	let c = i("div", "vc2056-stats"), l = /* @__PURE__ */ new Map();
	for (let [e, t] of [
		["total", "Borradores vistos"],
		["agree", "Coincidencias"],
		["coverageGap", "Cobertura pendiente"],
		["difference", "Diferencias"],
		["nativeReject", "Rechazos nativos"],
		["unverified", "Sin comparar"]
	]) {
		let n = i("div");
		n.append(i("small", "", t));
		let r = i("strong", "", "0");
		l.set(e, r), n.append(r), c.append(n);
	}
	a.append(c);
	let u = i("div", "vc2056-actions"), d = i("button", "", "Actualizar informe");
	d.setAttribute("type", "button");
	let f = i("button", "", "Descargar informe JSON");
	f.setAttribute("type", "button");
	let p = i("button", "", "Limpiar sesión");
	p.setAttribute("type", "button"), u.append(d, f, p), a.append(u);
	let m = i("h4", "", "Últimas incidencias de análisis"), h = i("div", "vc2056-recent");
	a.append(m, h), a.append(i("p", "vc2056-note", "Solo se recopilan diferencias de previsualización; no se almacenan códigos, dorsales, nombres ni datos en la nube. Una cobertura pendiente no significa un código erróneo."));
	let g = t.getElementById("vc2055-domain");
	g?.parentNode === n ? g.insertAdjacentElement("afterend", a) : n.insertAdjacentElement("afterbegin", a);
	let _ = () => {
		let e = r.snapshot(), t = e.counters, n = {
			total: t.total,
			agree: t.agree,
			coverageGap: t.coverageGap,
			difference: t.difference,
			nativeReject: t.nativeReject,
			unverified: t.unverified
		};
		for (let [e, t] of Object.entries(n)) {
			let n = l.get(e);
			n && n.textContent !== String(t) && (n.textContent = String(t));
		}
		a.dataset.state = t.difference ? "review" : "normal", h.replaceChildren();
		let o = e.recent.slice(-5).reverse();
		if (!o.length) h.append(i("p", "", "Todavía no hay incidencias de previsualización."));
		else for (let e of o) {
			let t = i("div", "vc2056-finding");
			t.append(i("strong", "", e.kind), i("span", "", `${e.source} · ${e.skill} · ${e.reason}`)), h.append(t);
		}
	}, v = !1, y = !1, b = () => {
		y || v || !n.classList.contains("active") || (v = !0, Promise.resolve().then(() => {
			v = !1, y || _();
		}));
	}, x = (e) => {
		y || (r.record(e.detail), b());
	};
	t.addEventListener("vc:scout-code-preflight", x), d.addEventListener("click", _), p.addEventListener("click", () => {
		r.clear(), _();
	}), f.addEventListener("click", () => {
		let n = r.snapshot(), i = new Blob([JSON.stringify(n, null, 2)], { type: "application/json" }), a = URL.createObjectURL(i), o = t.createElement("a");
		o.href = a, o.download = "volley-coach-v2056-comparacion-codigos.json", t.body.appendChild(o), o.click(), o.remove(), e.setTimeout(() => URL.revokeObjectURL(a), 1e3);
	});
	let S = typeof MutationObserver == "function" ? new MutationObserver(b) : null;
	S?.observe(n, {
		attributes: !0,
		attributeFilter: ["class"]
	}), n.classList.contains("active") && _();
	let C = Object.freeze({
		version: "20.5.6",
		readOnly: !0,
		getReport: () => r.snapshot(),
		clearReport: () => {
			r.clear(), _();
		},
		dispose: () => {
			y || (y = !0, S?.disconnect(), t.removeEventListener("vc:scout-code-preflight", x), a.remove(), e.VC_SHADOW_2056 === C && delete e.VC_SHADOW_2056);
		}
	});
	return e.VC_SHADOW_2056 = C, C;
}
// src/domain/rally-boundaries.ts
var M = () => Object.freeze({
	state: "unknown",
	target: null,
	setFinished: null,
	matchFinished: null,
	setWinner: null
});
function N(r, a) {
	let o = e(r), s = i(a);
	if (!o || !s) return M();
	let c = Number(o.currentSet);
	if (!Number.isInteger(c) || c < 1 || c > 5) return M();
	let l = t(o.sets).map(e).find((e) => e && Number(e.number) === c);
	if (!l) return M();
	let u = c === 5 ? 15 : 25;
	if (!((s.us >= u || s.opponent >= u) && Math.abs(s.us - s.opponent) >= 2)) return Object.freeze({
		state: "projected",
		target: u,
		setFinished: !1,
		matchFinished: !1,
		setWinner: null
	});
	let d = s.us > s.opponent ? "ours" : "opponent", f = 0;
	for (let r of t(o.sets)) {
		let t = e(r);
		if (t && t !== l && t.finished === !0) {
			if (!n(t.winner)) return M();
			t.winner === d && f++;
		}
	}
	return Object.freeze({
		state: "projected",
		target: u,
		setFinished: !0,
		matchFinished: f + 1 >= 3,
		setWinner: d
	});
}
function ne(t) {
	let n = e(t), r = e(n?.lineupBefore), i = !!e(r?.ours) && !!e(r?.opponent), a = (t) => !!e(t), o = [
		"liveVideoSessionId",
		"liveVideoStart",
		"liveVideoEnd",
		"liveVideoLinkedAt"
	], s = o.filter((e) => n?.[e] !== null && n?.[e] !== void 0).length;
	return Object.freeze({
		lineup: i ? "captured" : "missing",
		baseLineup: a(n?.baseLineupBefore) ? "captured" : i ? "native-fallback" : "missing",
		libero: a(n?.liberoBefore) ? "captured" : "native-fallback",
		roles: a(n?.lineupRolesBefore) ? "captured" : i ? "native-fallback" : "missing",
		actionsCaptured: Array.isArray(n?.actions),
		video: s === o.length ? "linked" : s ? "partial" : "not-linked",
		readOnly: !0
	});
}
// src/domain/rally-transition.ts
var re = (e, t, a, o) => {
	let s = i(e);
	return s && n(t) && r(a) && r(o) ? Object.freeze({
		score: s,
		serving: t,
		rotationUs: a,
		rotationOpponent: o
	}) : null;
}, P = (e, t, n = null, r = null, i = null, a = null) => Object.freeze({
	kind: e,
	state: t === "ready" ? "projected" : t === "finished" ? "blocked" : "unknown",
	reason: t,
	before: n,
	after: r,
	setBoundary: i,
	restoration: a,
	includesLineups: !1,
	readOnly: !0
}), ie = (n) => t(n.sets).map(e).find((e) => e && Number(e.number) === Number(n.currentSet) && Number.isInteger(Number(n.currentSet))) || null, F = (e, t) => e.us === t.us && e.opponent === t.opponent;
function ae(t, r) {
	let a = e(t);
	if (!a) return P("award-point", "no-match");
	if (a.status === "finished") return P("award-point", "finished");
	let o = ie(a);
	if (!o) return P("award-point", "no-set");
	if (o.finished === !0) return P("award-point", "finished");
	let s = i({
		us: o.scoreUs,
		opponent: o.scoreOpponent
	}), l = e(e(a.liveRally)?.startSnapshot), u = re(s, l ? l.servingBefore : a.servingTeam, l ? l.rotationBefore : a.rotationNo, l ? l.opponentRotationBefore : a.opponentRotationNo);
	if (!u || !n(r)) return P("award-point", "invalid-data");
	if (l) {
		let e = i(l.scoreBefore);
		if (!e || !F(e, u.score) || l.servingBefore !== a.servingTeam || l.rotationBefore !== a.rotationNo || l.opponentRotationBefore !== a.opponentRotationNo) return P("award-point", "stale-score", u);
	}
	let d = c({
		score: u.score,
		serving: u.serving,
		rotationUs: u.rotationUs,
		rotationOpponent: u.rotationOpponent
	}, r), f = re(d.score, d.serving, d.rotationUs, d.rotationOpponent);
	return f ? P("award-point", "ready", u, f, N(a, f.score)) : P("award-point", "invalid-data", u);
}
function oe(n) {
	let r = e(n);
	if (!r) return P("undo-last-rally", "no-match");
	if (r.status === "finished") return P("undo-last-rally", "finished");
	let o = ie(r);
	if (!o) return P("undo-last-rally", "no-set");
	let s = t(o.rallies), c = e(s[s.length - 1]);
	if (!c) return P("undo-last-rally", "no-rallies");
	let l = re(i({
		us: o.scoreUs,
		opponent: o.scoreOpponent
	}), r.servingTeam, r.rotationNo, r.opponentRotationNo), u = re(c.scoreBefore, c.servingBefore, c.rotationBefore, c.opponentRotationBefore);
	if (!l || !u || a(c).state !== "verified") return P("undo-last-rally", "invalid-data", l);
	let d = i(c.scoreAfter);
	return !d || !F(d, l.score) ? P("undo-last-rally", "stale-score", l) : P("undo-last-rally", "ready", l, u, null, ne(c));
}
function se(t, o = null) {
	let s = e(t), l = e(o), u = a(s), d = "unknown", f = "unknown", p = i(l?.scoreBefore);
	u.after && p && (d = F(u.after, p) ? "match" : "mismatch");
	let m = re(s?.scoreBefore, s?.servingBefore, s?.rotationBefore, s?.opponentRotationBefore);
	if (m && l) {
		let e = c({
			score: m.score,
			serving: m.serving,
			rotationUs: m.rotationUs,
			rotationOpponent: m.rotationOpponent
		}, s?.winner);
		e.state === "projected" && n(l.servingBefore) && r(l.rotationBefore) && r(l.opponentRotationBefore) && (f = e.serving === l.servingBefore && e.rotationUs === l.rotationBefore && e.rotationOpponent === l.opponentRotationBefore ? "match" : "mismatch");
	}
	return Object.freeze({
		score: u,
		scoreLink: d,
		rotationLink: f,
		undoTo: m
	});
}
// src/domain/committed-audit.ts
var I = 2e4, ce = 6e4, le = 80, ue = /* @__PURE__ */ new Set([
	"S",
	"R",
	"E",
	"A",
	"B",
	"D",
	"F",
	"C"
]), de = (e) => typeof e == "string" && ue.has(e) ? e : "—", fe = {
	difference: "El código guardado y los campos de la acción no coinciden.",
	"coverage-gap": "El código guardado utiliza sintaxis todavía no cubierta por TypeScript.",
	unverified: "Faltan campos del registro para comprobarlo con seguridad.",
	"no-code": "La acción está registrada sin código original.",
	score: "El ganador no concuerda con el cambio de marcador registrado.",
	"score-sequence": "El tanteo final y el inicial del siguiente rally no coinciden.",
	rotation: "La siguiente rotación o el turno de saque no concuerdan con la proyección básica."
};
function pe(t) {
	let r = e(t), i = de(r?.skill);
	if (!r) return Object.freeze({
		kind: "unverified",
		skill: i
	});
	let a = typeof r.code == "string" ? r.code.trim() : "";
	if (!a) return Object.freeze({
		kind: "no-code",
		skill: i
	});
	let o = v(a);
	if (o.state !== "candidate") return Object.freeze({
		kind: "coverage-gap",
		skill: de(o.skill) || i
	});
	if (!n(r.team) || !ue.has(String(r.skill)) || ![
		"#",
		"+",
		"!",
		"-",
		"/",
		"="
	].includes(String(r.evaluation)) || r.playerNumberSnapshot === null || r.playerNumberSnapshot === void 0 || String(r.playerNumberSnapshot).trim() === "") return Object.freeze({
		kind: "unverified",
		skill: de(o.skill)
	});
	let s = y(a, { action: r });
	return Object.freeze({
		kind: s.state === "agree" ? "agree" : s.state === "disagree" ? "difference" : "unverified",
		skill: de(o.skill)
	});
}
function me(n) {
	let r = e(n), i = {
		actions: 0,
		agree: 0,
		difference: 0,
		coverageGap: 0,
		unverified: 0,
		noCode: 0,
		rallies: 0,
		scoreVerified: 0,
		scoreInconsistent: 0,
		scoreUnknown: 0,
		scoreLinksChecked: 0,
		scoreLinksMismatch: 0,
		rotationsChecked: 0,
		rotationsMismatch: 0
	}, a = [], o = !1, s = (e, t, n = "—") => {
		a.push(Object.freeze({
			kind: e,
			location: t,
			skill: de(n),
			reason: fe[e]
		})), a.length > le && a.shift();
	}, c = (e, t) => {
		if (i.actions >= ce) return o = !0, !1;
		i.actions++;
		let n = pe(e);
		return n.kind === "agree" ? i.agree++ : n.kind === "difference" ? i.difference++ : n.kind === "coverage-gap" ? i.coverageGap++ : n.kind === "no-code" ? i.noCode++ : i.unverified++, n.kind !== "agree" && s(n.kind, t, n.skill), !0;
	}, l = t(r?.sets);
	main: for (let n = 0; n < l.length; n++) {
		let r = e(l[n]);
		if (!r) continue;
		let a = t(r.rallies);
		for (let r = 0; r < a.length; r++) {
			if (i.rallies >= I) {
				o = !0;
				break main;
			}
			let l = e(a[r]);
			if (!l) continue;
			i.rallies++;
			let u = `S${n + 1} · R${r + 1}`, d = e(a[r + 1]), f = se(l, d);
			f.score.state === "verified" ? i.scoreVerified++ : f.score.state === "inconsistent" ? (i.scoreInconsistent++, s("score", u)) : i.scoreUnknown++;
			for (let [e, n] of t(l.actions).entries()) if (!c(n, `${u} · A${e + 1}`)) break main;
			d && (f.scoreLink !== "unknown" && (i.scoreLinksChecked++, f.scoreLink === "mismatch" && (i.scoreLinksMismatch++, s("score-sequence", `${u} → R${r + 2}`))), f.rotationLink !== "unknown" && (i.rotationsChecked++, f.rotationLink === "mismatch" && (i.rotationsMismatch++, s("rotation", `${u} → R${r + 2}`))));
		}
	}
	if (!o && r) {
		for (let [n, i] of t(e(r.liveRally)?.actions).entries()) if (!c(i, `En curso · A${n + 1}`)) break;
	}
	return Object.freeze({
		version: "20.5.7",
		mode: "canonical-local-read-only",
		matchAvailable: !!r,
		truncated: o,
		counters: Object.freeze({ ...i }),
		recent: Object.freeze([...a]),
		limitations: Object.freeze([
			"Examina el estado local del partido abierto; no demuestra escritura en IndexedDB ni recepción en otro dispositivo.",
			"Los cotejos de rotación son estructurales, no sanciones oficiales ni verificación completa de sustituciones.",
			"La sintaxis todavía no soportada y los datos ausentes se separan de las diferencias demostradas.",
			"No se exportan códigos, dorsales, jugadores, identificadores de partido ni vídeos.",
			"Se comprueban como máximo 20 000 rallies y 60 000 acciones en un informe."
		])
	});
}
// src/domain/committed-runtime.ts
function he(e) {
	let t = e.document, n = t.getElementById("v11-management");
	if (!n) return null;
	if (e.VC_COMMITTED_2057) return e.VC_COMMITTED_2057;
	let r = (e, n = "", r = "") => {
		let i = t.createElement(e);
		return i.className = n, i.textContent = r, i;
	}, i = r("section", "vc2057-committed");
	i.id = "vc2057-committed";
	let a = r("div", "vc2057-heading"), o = r("div");
	o.append(r("small", "", "ACCIONES CONFIRMADAS · V20.5.7"), r("h3", "", "Auditoría del scouting registrado")), a.append(o, r("span", "", "Solo lectura"));
	let s = r("p", "", "Comprueba códigos ya presentes en el partido, puntuación y continuidad de rotaciones. No añade ni corrige jugadas."), c = r("p", "vc2057-status", "Pendiente de comprobar");
	c.setAttribute("role", "status");
	let l = r("div", "vc2057-stats"), u = /* @__PURE__ */ new Map();
	for (let [e, t] of [
		["actions", "Acciones examinadas"],
		["agree", "Coincidencias"],
		["difference", "Diferencias"],
		["coverageGap", "Cobertura pendiente"],
		["unverified", "Sin verificar"],
		["noCode", "Sin código"],
		["rallies", "Rallies"],
		["scoreInconsistent", "Marcadores inconsistentes"],
		["scoreLinksMismatch", "Continuidad de tanteo"],
		["rotationsMismatch", "Rotaciones a revisar"]
	]) {
		let n = r("div");
		n.append(r("small", "", t));
		let i = r("strong", "", "—");
		u.set(e, i), n.append(i), l.append(n);
	}
	let d = r("div", "vc2057-actions"), f = r("button", "", "Comprobar partido");
	f.setAttribute("type", "button");
	let p = r("button", "", "Descargar informe JSON");
	p.setAttribute("type", "button"), p.disabled = !0, d.append(f, p);
	let m = r("h4", "", "Incidencias que conviene revisar"), h = r("div", "vc2057-recent");
	i.append(a, s, c, l, d, m, h, r("p", "vc2057-note", "La lectura se realiza únicamente al pulsar «Comprobar partido». No valida la nube ni aplica reglas arbitrales completas. Los códigos y dorsales no aparecen en el informe."));
	let g = t.getElementById("vc2056-shadow") || t.getElementById("vc2055-domain");
	g?.parentNode === n ? g.insertAdjacentElement("afterend", i) : n.insertAdjacentElement("afterbegin", i);
	let _ = null, v = !1, y = !1, b = 0, x = () => w(e), S = () => {
		if (y) return;
		_ ? v ? (c.textContent = "El partido ha cambiado. Repite la comprobación para actualizar el informe.", i.dataset.state = "stale") : _.matchAvailable ? _.truncated ? (c.textContent = "Comprobación parcial: se alcanzó el límite de seguridad.", i.dataset.state = "partial") : (c.textContent = "Acciones del estado local examinadas; no implica confirmación en nube.", i.dataset.state = _.counters.difference || _.counters.scoreInconsistent || _.counters.scoreLinksMismatch || _.counters.rotationsMismatch ? "review" : "available") : (c.textContent = "No hay un partido activo que comprobar.", i.dataset.state = "waiting") : (c.textContent = "Pendiente de comprobar", i.dataset.state = "waiting"), p.disabled = !_ || v || !_.matchAvailable;
		for (let [e, t] of u) {
			let n = _?.counters[e], r = n === void 0 ? "—" : String(n);
			t.textContent !== r && (t.textContent = r);
		}
		h.replaceChildren();
		let e = _?.recent.slice(-8).reverse() || [];
		if (!e.length) h.append(r("p", "", _ ? "Sin incidencias en los registros examinados." : "Ejecuta la comprobación para revisar el partido abierto."));
		else for (let t of e) {
			let e = r("div", "vc2057-finding");
			e.append(r("strong", "", t.location), r("span", "", t.reason)), h.append(e);
		}
	}, C = () => {
		let e = me(x());
		return _ = e, v = !1, S(), e;
	}, T = () => {
		y || (b++, _ && !v && (v = !0, c.textContent = "El partido ha cambiado. Repite la comprobación para actualizar el informe.", i.dataset.state = "stale", p.disabled = !0));
	};
	f.addEventListener("click", () => {
		if (y) return;
		let t = ++b;
		c.textContent = "Comprobando los registros locales…", f.disabled = !0, e.setTimeout(() => {
			if (y || t !== b) f.disabled = !1, S();
			else try {
				C();
			} catch {
				c.textContent = "No se pudo completar la comprobación; el partido permanece intacto.";
			} finally {
				f.disabled = !1;
			}
		}, 0);
	}), p.addEventListener("click", () => {
		if (y || !_ || v || !_.matchAvailable) return;
		let n = new Blob([JSON.stringify(_, null, 2)], { type: "application/json" }), r = URL.createObjectURL(n), i = t.createElement("a");
		i.href = r, i.download = "volley-coach-v2057-auditoria-acciones.json", t.body.appendChild(i), i.click(), i.remove(), e.setTimeout(() => URL.revokeObjectURL(r), 1e3);
	});
	let E = () => {}, D = !1;
	if (e.VC_STATE_2059) E = e.VC_STATE_2059.subscribe("change", T);
	else {
		D = !0, t.addEventListener("vc:matchstatechange", T);
		try {
			let t = (e.MatchState || e.VC_MATCH_STATE)?.subscribe?.(T);
			typeof t == "function" && (E = t);
		} catch {}
	}
	let O = typeof MutationObserver == "function" ? new MutationObserver(() => {
		n.classList.contains("active") && S();
	}) : null;
	O?.observe(n, {
		attributes: !0,
		attributeFilter: ["class"]
	}), n.classList.contains("active") && S();
	let k = Object.freeze({
		version: "20.5.7",
		readOnly: !0,
		getReport: () => _,
		runAudit: C,
		dispose() {
			y || (y = !0, b++, O?.disconnect(), E(), D && t.removeEventListener("vc:matchstatechange", T), i.remove(), _ = null, e.VC_COMMITTED_2057 === k && delete e.VC_COMMITTED_2057);
		}
	});
	return e.VC_COMMITTED_2057 = k, k;
}
// src/domain/grammar-runtime.ts
function ge(e) {
	let t = e.document, n = t.getElementById("v11-management");
	if (!n) return null;
	if (e.VC_CODE_GRAMMAR_2058) return e.VC_CODE_GRAMMAR_2058;
	let r = (e, n = "", r = "") => {
		let i = t.createElement(e);
		return i.className = n, i.textContent = r, i;
	}, i = r("section", "vc2058-grammar");
	i.id = "vc2058-grammar";
	let a = r("div", "vc2058-heading"), o = r("div");
	o.append(r("small", "", "GRAMÁTICA DE CÓDIGOS · V20.5.8"), r("h3", "", "Referencia de código rápido")), a.append(o, r("span", "", "No registra acciones"));
	let s = r("p", "", "Comprueba la estructura de un código localmente. Es una ayuda sintáctica: no verifica jugadores, rotaciones ni aceptación por el motor original."), c = r("div", "vc2058-entry"), l = r("label", "", "Código de prueba");
	l.setAttribute("for", "vc2058-code");
	let u = r("input");
	u.id = "vc2058-code", u.maxLength = 160, u.placeholder = "12A#.4B>5D*DC~T::31", u.setAttribute("autocomplete", "off"), u.setAttribute("spellcheck", "false");
	let d = r("button", "", "Comprobar estructura");
	d.type = "button", c.append(l, u, d);
	let f = r("p", "vc2058-status", "Escribe un código para consultar la sintaxis.");
	f.setAttribute("role", "status");
	let p = r("div", "vc2058-result"), m = r("p", "vc2058-examples", "Ejemplos: 7R#.6 · 12A#.4B>5D*DC · 3B#.4&12 · 12A#.4B>C5::31~T");
	i.append(a, s, c, f, p, m, r("p", "vc2058-note", "Los códigos introducidos no se guardan en el informe, en el historial ni en la nube. No se incorpora todavía la sintaxis completa DV4 (.dvw)."));
	let h = t.getElementById("vc2057-committed") || t.getElementById("vc2056-shadow");
	h?.parentNode === n ? h.insertAdjacentElement("afterend", i) : n.insertAdjacentElement("afterbegin", i);
	let g = !1, _ = () => {
		if (g) return;
		let e = v(u.value);
		if (i.dataset.state = e.state, f.textContent = e.state === "candidate" ? "Estructura reconocida; aceptación del parser nativo no comprobada." : e.state === "empty" ? "Escribe un código para consultar la sintaxis." : e.reason, p.replaceChildren(), e.state === "empty") return;
		let t = [
			["Equipo", e.team === "ours" ? "Propio" : e.team === "opponent" ? "Rival" : "—"],
			["Fundamento", e.skill],
			["Valoración", e.evaluation],
			["Origen", e.startZone],
			["Destino", e.endZone],
			["Saque", e.modifiers.serveType],
			["Combinación", e.modifiers.combination],
			["Llamada", e.modifiers.dvCall],
			["Fase", e.modifiers.phase],
			["Bloqueadores", e.modifiers.blockers],
			["Objetivo bloqueo", e.modifiers.blockTarget],
			["Dirección", e.modifiers.direction],
			["Tempo", e.modifiers.tempo],
			["Subtipo", e.modifiers.subtype],
			["Tipo colocación", e.modifiers.setType],
			["Especial", e.modifiers.special],
			["Personalizado", e.modifiers.custom]
		];
		for (let [e, n] of t) {
			if (!n || n === "—") continue;
			let t = r("span", "vc2058-token");
			t.append(r("small", "", e), r("b", "", n)), p.append(t);
		}
	};
	d.addEventListener("click", _), u.addEventListener("keydown", (e) => {
		e.key === "Enter" && (e.preventDefault(), _());
	});
	let y = Object.freeze({
		version: "20.5.8",
		readOnly: !0,
		inspect: v,
		dispose() {
			g || (g = !0, i.remove(), e.VC_CODE_GRAMMAR_2058 === y && delete e.VC_CODE_GRAMMAR_2058);
		}
	});
	return e.VC_CODE_GRAMMAR_2058 = y, y;
}
// src/state/match-observable.ts
var _e = (e) => typeof e == "number" && Number.isSafeInteger(e) && e >= 0 ? e : null, ve = (e) => typeof e == "number" && Number.isSafeInteger(e) && e > 0 ? e : null, ye = (e, t) => Object.keys(e).every((n) => Object.is(e[n], t[n]));
function be(i, a) {
	let o = e(i), s = ve(o?.currentSet), c = t(o?.sets), l = e(a) || e(c.find((t) => e(t)?.number === s)), u = o?.status === "live" || o?.status === "finished" ? o.status : null;
	return Object.freeze({
		score: Object.freeze({
			set: s,
			us: _e(l?.scoreUs),
			opponent: _e(l?.scoreOpponent)
		}),
		court: Object.freeze({
			serving: n(o?.servingTeam) ? o.servingTeam : null,
			rotationUs: r(o?.rotationNo) ? o.rotationNo : null,
			rotationOpponent: r(o?.opponentRotationNo) ? o.opponentRotationNo : null
		}),
		rally: Object.freeze({
			completed: l ? t(l.rallies).length : null,
			liveActions: e(o?.liveRally) ? t(e(o?.liveRally)?.actions).length : null
		}),
		status: Object.freeze({
			matchAvailable: !!o,
			phase: u
		})
	});
}
function xe(t) {
	let n = [
		"score",
		"court",
		"rally",
		"status"
	], r = [...n, "change"], i = new Map(r.map((e) => [e, /* @__PURE__ */ new Set()])), a = () => {
		for (let n of C(t)) try {
			let t = n?.getActive?.();
			if (!e(t)) continue;
			let r;
			try {
				r = n?.getSet?.(t);
			} catch {}
			return be(t, r);
		} catch {}
		return be(null);
	}, o = a(), s = !1, c = !1, l = !1, u = 0, d = 0, f = 0, p = (e = !1) => {
		if (s) return;
		let t = a(), r = n.filter((e) => !ye(o[e], t[e]));
		r.length && (o = t, d++), (e || r.length) && r.push("change");
		for (let e of r) for (let t of i.get(e) || []) {
			f++;
			try {
				t(o);
			} catch {}
		}
	}, m = () => {
		s || (u++, l = !0, c || (c = !0, Promise.resolve().then(() => {
			c = !1;
			let e = l;
			l = !1, p(e);
		})));
	}, h = () => (p(), o), g = t.MatchState || t.VC_MATCH_STATE, _ = () => {};
	try {
		let e = g?.subscribe?.(m);
		typeof e == "function" && (_ = e);
	} catch {}
	return t.document.addEventListener("vc:matchstatechange", m), Object.freeze({
		version: "20.5.9",
		readOnly: !0,
		getSnapshot: () => o,
		subscribe(e, t) {
			if (s || !i.has(e) || typeof t != "function") return () => {};
			let n = i.get(e);
			return n.add(t), () => {
				n.delete(t);
			};
		},
		refresh: h,
		diagnostics: () => Object.freeze({
			readOnly: !0,
			signals: u,
			updates: d,
			notifications: f,
			subscribers: [...i.values()].reduce((e, t) => e + t.size, 0)
		}),
		dispose() {
			if (!s) {
				s = !0, _(), t.document.removeEventListener("vc:matchstatechange", m);
				for (let e of i.values()) e.clear();
			}
		}
	});
}
// src/state/runtime.ts
function Se(e) {
	let t = e.document, n = t.getElementById("v11-management");
	if (!n) return null;
	if (e.VC_STATE_2059) return e.VC_STATE_2059;
	let r = xe(e), i = (e, n = "", r = "") => {
		let i = t.createElement(e);
		return i.className = n, i.textContent = r, i;
	}, a = i("section", "vc2059-observable");
	a.id = "vc2059-observable";
	let o = i("div", "vc2059-heading"), s = i("div");
	s.append(i("small", "", "ESTADO OBSERVABLE · V20.5.9"), i("h3", "", "Lectura unificada del partido")), o.append(s, i("span", "", "Solo lectura"));
	let c = i("p", "", "Marcador, saque y rotaciones proceden del partido original. Las actualizaciones se agrupan y solo se avisa a cada consumidor cuando cambian sus datos."), l = i("p", "vc2059-status", "Esperando partido activo");
	l.setAttribute("role", "status");
	let u = i("div", "vc2059-metrics"), d = /* @__PURE__ */ new Map();
	for (let [e, t] of [
		["score", "Marcador del set"],
		["serve", "Saque"],
		["court", "Rotaciones"],
		["rallies", "Rallies del set"],
		["actions", "Acciones del rally"],
		["updates", "Actualizaciones selectivas"]
	]) {
		let n = i("div");
		n.append(i("small", "", t));
		let r = i("strong", "", "—");
		n.append(r), u.append(n), d.set(e, r);
	}
	let f = i("button", "vc2059-refresh", "Actualizar lectura");
	f.type = "button", a.append(o, c, l, u, f, i("p", "vc2059-note", "Esta vista no corrige el tanteo, no controla sustituciones y no confirma la recepción en la nube. No contiene otro motor de partido."));
	let p = t.getElementById("vc2058-grammar") || t.getElementById("vc2057-committed");
	p?.parentNode === n ? p.insertAdjacentElement("afterend", a) : n.append(a);
	let m = !1, h = !1, g = (e, t) => {
		let n = d.get(e);
		n && n.textContent !== t && (n.textContent = t);
	}, _ = () => {
		if (m) return;
		let e = r.getSnapshot(), t = r.diagnostics();
		a.dataset.state = e.status.matchAvailable ? "available" : "waiting", l.textContent = e.status.matchAvailable ? `Partido activo · set ${e.score.set ?? "—"}` : "No hay partido activo", g("score", e.score.us === null || e.score.opponent === null ? "—" : `${e.score.us} : ${e.score.opponent}`), g("serve", e.court.serving === "ours" ? "Propio" : e.court.serving === "opponent" ? "Rival" : "—"), g("court", e.court.rotationUs === null || e.court.rotationOpponent === null ? "—" : `R${e.court.rotationUs} · Rival R${e.court.rotationOpponent}`), g("rallies", e.rally.completed === null ? "—" : String(e.rally.completed)), g("actions", e.rally.liveActions === null ? "—" : String(e.rally.liveActions)), g("updates", String(t.updates));
	}, v = () => {
		m || h || !n.classList.contains("active") || (h = !0, Promise.resolve().then(() => {
			h = !1, _();
		}));
	}, y = [
		r.subscribe("score", v),
		r.subscribe("court", v),
		r.subscribe("rally", v),
		r.subscribe("status", v)
	];
	f.addEventListener("click", () => {
		r.refresh(), _();
	});
	let b = typeof MutationObserver == "function" ? new MutationObserver(() => {
		n.classList.contains("active") && (r.refresh(), _());
	}) : null;
	b?.observe(n, {
		attributes: !0,
		attributeFilter: ["class"]
	}), n.classList.contains("active") && _();
	let x = r.dispose, S = Object.freeze({
		...r,
		dispose() {
			if (!m) {
				m = !0, b?.disconnect();
				for (let e of y) e();
				a.remove(), x(), e.VC_STATE_2059 === S && delete e.VC_STATE_2059;
			}
		}
	});
	return e.VC_STATE_2059 = S, S;
}
// src/state/live-statistics.ts
var Ce = 3e3, we = 25e3, Te = (e, t) => t ? Math.round(e / t * 100) : null, Ee = () => ({
	receptions: 0,
	perfect: 0,
	positive: 0,
	attacks: 0,
	kills: 0,
	errors: 0,
	blocked: 0
}), De = (t, n) => {
	let r = e(n);
	if (r?.team === "ours") {
		if (r.skill === "R") {
			if (![
				"#",
				"+",
				"!",
				"-",
				"/",
				"="
			].includes(String(r.evaluation))) return;
			t.receptions++, r.evaluation === "#" && t.perfect++, (r.evaluation === "#" || r.evaluation === "+") && t.positive++;
		} else if (r.skill === "A") {
			if (![
				"#",
				"+",
				"!",
				"-",
				"/",
				"="
			].includes(String(r.evaluation))) return;
			t.attacks++, r.evaluation === "#" && t.kills++, r.evaluation === "=" && t.errors++, r.evaluation === "/" && t.blocked++;
		}
	}
}, Oe = (e) => Object.freeze({
	attempts: e.receptions,
	perfect: e.perfect,
	positive: e.positive,
	positivePct: Te(e.positive, e.receptions),
	perfectPct: Te(e.perfect, e.receptions)
}), ke = (e) => Object.freeze({
	attempts: e.attacks,
	kills: e.kills,
	errors: e.errors,
	blocked: e.blocked,
	efficiencyPct: Te(e.kills - e.errors - e.blocked, e.attacks)
}), Ae = (e, t) => Object.freeze({
	attempts: e,
	successes: t,
	percent: Te(t, e)
});
function je(r) {
	let i = e(r), a = Number.isSafeInteger(i?.currentSet) && Number(i?.currentSet) > 0 ? Number(i?.currentSet) : null, o = e(t(i?.sets).find((t) => a !== null && e(t)?.number === a)), s = t(o?.rallies), c = Ee(), l = Ee(), u = 0, d = 0, f = 0, p = 0, m = 0, h = 0, g = !1;
	if (o) for (let r of s) {
		if (m >= Ce) {
			g = !0;
			break;
		}
		let i = e(r);
		if (m++, !i) continue;
		let a = i.winner, o = i.servingBefore;
		n(a) && n(o) && (o === "opponent" ? (u++, a === "ours" && d++) : (f++, a === "ours" && p++));
		for (let e of t(i.actions)) {
			if (h >= we) {
				g = !0;
				break;
			}
			h++, De(c, e);
		}
		if (g) break;
	}
	let _ = t(e(i?.liveRally)?.actions);
	for (let e of _.slice(0, we)) De(l, e);
	_.length > we && (g = !0);
	let v = {
		receptions: c.receptions + l.receptions,
		perfect: c.perfect + l.perfect,
		positive: c.positive + l.positive,
		attacks: c.attacks + l.attacks,
		kills: c.kills + l.kills,
		errors: c.errors + l.errors,
		blocked: c.blocked + l.blocked
	};
	return Object.freeze({
		available: !!o,
		set: o ? a : null,
		completeRallies: s.length,
		examinedRallies: m,
		examinedActions: h,
		truncated: g,
		sideOut: Ae(u, d),
		breakPoint: Ae(f, p),
		reception: Oe(c),
		attack: ke(c),
		provisional: Object.freeze({
			actions: _.length,
			receptions: l.receptions,
			attacks: l.attacks,
			reception: Oe(v),
			attack: ke(v)
		})
	});
}
// src/state/render-performance.ts
var Me = [
	"scouting-live",
	"scouting-boxscore",
	"data-engine",
	"rally-search"
], Ne = /* @__PURE__ */ new WeakMap(), Pe = () => ({
	requests: 0,
	rendered: 0,
	skipped: 0,
	failures: 0,
	lastMs: 0,
	maxMs: 0,
	averageMs: 0
}), Fe = (e) => Number.isFinite(e) && e >= 0 ? Math.round(e * 100) / 100 : 0;
function Ie(e) {
	let t = Ne.get(e);
	if (t) return t;
	let n = new Map(Me.map((e) => [e, Pe()])), r = Object.freeze({
		VERSION: "20.5.28",
		readOnly: !0,
		observe(e, t, r = 0) {
			let i = n.get(e);
			i && (i.requests++, t === "skip" ? i.skipped++ : t === "error" ? i.failures++ : (i.rendered++, i.lastMs = Fe(r), i.averageMs += (i.lastMs - i.averageMs) / i.rendered, i.maxMs = Math.max(i.maxMs, i.lastMs)));
		},
		diagnostics: () => {
			let e = {};
			for (let t of Me) {
				let r = n.get(t);
				e[t] = Object.freeze({
					...r,
					averageMs: Math.round(r.averageMs * 100) / 100
				});
			}
			return Object.freeze({
				readOnly: !0,
				areas: Object.freeze(e)
			});
		}
	});
	return Ne.set(e, r), e.VC_RENDER_METRICS_20528 = r, r;
}
function Le(e) {
	let t = null, n = -Infinity, r = Pe(), i = e.staleAfterMs ?? 5e3, a = () => {
		let t = e.now();
		return Number.isFinite(t) ? t : Date.now();
	};
	return Object.freeze({
		render(o, s, c = !1) {
			let l = a();
			if (r.requests++, !c && t === o && l - n < i) return r.skipped++, e.report?.("skip", 0), !1;
			try {
				return s(), t = o, n = a(), r.rendered++, r.lastMs = Fe(n - l), r.maxMs = Math.max(r.maxMs, r.lastMs), r.averageMs += (r.lastMs - r.averageMs) / r.rendered, e.report?.("render", r.lastMs), !0;
			} catch (n) {
				throw t = null, r.failures++, e.report?.("error", 0), n;
			}
		},
		invalidate() {
			t = null, n = -Infinity;
		},
		diagnostics: () => Object.freeze({
			...r,
			averageMs: Math.round(r.averageMs * 100) / 100
		})
	});
}
// src/state/live-statistics-runtime.ts
function Re(e) {
	let t = e.document, n = t.getElementById("vc20510-live-stats"), r = t.getElementById("scout-workspace-v900"), i = t.getElementById("v900-phase-scout"), a = e.VC_STATE_2059;
	if (!n || !r || !i || !a) return null;
	if (e.VC_LIVE_STATS_20510) return e.VC_LIVE_STATS_20510;
	let o = (e, n = "", r = "") => {
		let i = t.createElement(e);
		return i.className = n, i.textContent = r, i;
	}, s = o("div", "vc20510-status", "Esperando partido activo");
	s.setAttribute("role", "status");
	let c = o("div", "vc20510-grid"), l = /* @__PURE__ */ new Map();
	for (let [e, t] of [
		["so", "SIDE-OUT"],
		["bp", "BREAK POINT"],
		["receive", "RECEPCIÓN (+/#)"],
		["attack", "EFICIENCIA ATAQUE"]
	]) {
		let n = o("div", "vc20510-metric"), r = o("small", "", t), i = o("strong", "", "—"), a = o("span", "vc20510-metric-detail", "Sin datos");
		n.append(r, i, a), c.append(n), l.set(e, {
			value: i,
			detail: a
		});
	}
	let u = o("div", "vc20510-open", "Rally abierto: sin acciones"), d = o("p", "vc20510-note", "SO y BP solo incluyen rallies cerrados. La recepción y el ataque muestran una vista provisional si hay acciones del rally abierto.");
	n.append(s, c, u, d);
	let f = !1, p = !1, m = null, h = Ie(e), g = Le({
		now: () => e.performance?.now?.() ?? Date.now(),
		report: (e, t) => h.observe("scouting-live", e, t)
	}), _ = () => r.classList.contains("active") && !i.classList.contains("hidden"), v = (e, t, n) => {
		let r = l.get(e);
		r && (r.value.textContent !== t && (r.value.textContent = t), r.detail.textContent !== n && (r.detail.textContent = n));
	}, y = (e) => e === null ? "—" : `${e}%`, b = (e, t = !1) => {
		if (f) return;
		let r = JSON.stringify(e);
		g.render(r, () => {
			n.dataset.state = e.available ? e.truncated ? "partial" : e.provisional.receptions || e.provisional.attacks ? "provisional" : "available" : "waiting", s.textContent = e.available ? `SET ${e.set} · ${e.completeRallies} rallies cerrados${e.truncated ? " · CÁLCULO PARCIAL" : ""}` : "No hay un set activo con datos", v("so", y(e.sideOut.percent), `${e.sideOut.successes} ganados / ${e.sideOut.attempts} recepciones de saque`), v("bp", y(e.breakPoint.percent), `${e.breakPoint.successes} ganados / ${e.breakPoint.attempts} saques propios`);
			let t = e.provisional.receptions > 0, r = e.provisional.attacks > 0, i = t ? e.provisional.reception : e.reception, a = r ? e.provisional.attack : e.attack;
			v("receive", y(i.positivePct), `${i.positive}/${i.attempts} positivas${t ? " · PROVISIONAL" : ""}`), v("attack", y(a.efficiencyPct), `${a.kills} puntos · ${a.errors + a.blocked} errores/bloqueos · ${a.attempts} intentos${r ? " · PROVISIONAL" : ""}`), u.textContent = `Rally abierto: ${e.provisional.actions} acciones · ${e.provisional.receptions} recepciones · ${e.provisional.attacks} ataques (sin cerrar)`;
		}, t);
	}, x = (t = !1) => {
		let n = e.VC_SCOUT_PROJECTIONS_20522;
		t && n?.invalidate();
		let r = n ? n.getLiveStatistics() : je(w(e));
		return m = r, _() && b(r, t), r;
	}, S = () => x(!0), C = a.subscribe("change", () => {
		f || p || !_() || (p = !0, Promise.resolve().then(() => {
			p = !1, !f && _() && x();
		}));
	}), T = typeof MutationObserver == "function" ? new MutationObserver(() => {
		_() && x();
	}) : null;
	T?.observe(r, {
		attributes: !0,
		attributeFilter: ["class"]
	}), T?.observe(i, {
		attributes: !0,
		attributeFilter: ["class"]
	}), _() && x();
	let E = Object.freeze({
		version: "20.5.10",
		readOnly: !0,
		getReport: () => m,
		refresh: S,
		dispose() {
			f || (f = !0, T?.disconnect(), C(), g.invalidate(), n.replaceChildren(), m = null, e.VC_LIVE_STATS_20510 === E && delete e.VC_LIVE_STATS_20510);
		}
	});
	return e.VC_LIVE_STATS_20510 = E, E;
}
// src/state/player-boxscore.ts
var ze = 2e4, Be = 6e4, Ve = 80, He = /* @__PURE__ */ new Set([
	"#",
	"+",
	"!",
	"-",
	"/",
	"="
]), Ue = () => ({
	actions: 0,
	s: 0,
	aces: 0,
	sErrors: 0,
	r: 0,
	rPerfect: 0,
	rPositive: 0,
	a: 0,
	kills: 0,
	aErrors: 0,
	blocked: 0,
	b: 0,
	bPoints: 0,
	d: 0,
	e: 0
}), We = (e, t) => t ? Math.round(e / t * 100) : null, Ge = (e) => {
	if (typeof e == "number" && Number.isSafeInteger(e) && e > 0) return e;
	if (typeof e == "string" && /^\d{1,15}$/.test(e)) {
		let t = Number(e);
		return Number.isSafeInteger(t) && t > 0 ? t : null;
	}
	return null;
}, Ke = (e) => {
	let t = typeof e == "number" && Number.isSafeInteger(e) ? String(e) : typeof e == "string" ? e.trim() : "";
	return /^\d{1,3}$/.test(t) ? t : null;
}, qe = (e) => typeof e == "string" ? e.trim().slice(0, 50) : "";
function Je(e, t) {
	let n = Ge(e.playerId), r = qe(e.opponentPlayerUid), i = Ke(e.playerNumberSnapshot), a = qe(e.playerLabel), o = Ke((a.match(/^#?\s*(\d{1,3})(?:\D|$)/) || [])[1]), s = i || (t === "opponent" ? o : null), c = qe(e.playerNameSnapshot) || a.replace(/^#?\s*\d{1,3}\s*[·-]?\s*/, "") || "", l = t === "ours" && n !== null ? `id:${n}` : t === "opponent" && r ? `uid:${r}` : s === null ? "unidentified" : `num:${s}`;
	return {
		key: l,
		number: s,
		name: l === "unidentified" ? "Sin identificar" : c,
		identified: l !== "unidentified"
	};
}
var Ye = (e, t) => {
	let n = t.skill, r = t.evaluation;
	return !He.has(String(r)) || ![
		"S",
		"R",
		"A",
		"B",
		"D",
		"E"
	].includes(String(n)) ? !1 : (e.actions++, n === "S" ? (e.s++, r === "#" && e.aces++, r === "=" && e.sErrors++) : n === "R" ? (e.r++, r === "#" && e.rPerfect++, (r === "#" || r === "+") && e.rPositive++) : n === "A" ? (e.a++, r === "#" && e.kills++, r === "=" && e.aErrors++, r === "/" && e.blocked++) : n === "B" ? (e.b++, r === "#" && e.bPoints++) : n === "D" ? e.d++ : n === "E" && e.e++, !0);
}, Xe = (e) => Object.freeze({
	attempts: e.a,
	kills: e.kills,
	errors: e.aErrors,
	blocked: e.blocked,
	efficiencyPct: We(e.kills - e.aErrors - e.blocked, e.a)
}), Ze = (e, t) => Object.freeze({
	attempts: e,
	won: t,
	percent: We(t, e)
});
function Qe(i, a) {
	let o = e(i), s = a.team === "opponent" ? "opponent" : "ours", c = a.scope === "match" ? "match" : "current", l = r(a.rotation) ? a.rotation : null, u = Object.freeze({
		team: s,
		scope: c,
		rotation: l
	}), d = Ge(o?.currentSet), f = t(o?.sets), p = c === "match" ? f : f.filter((t) => d !== null && Ge(e(t)?.number) === d), m = !!o && p.some((t) => !!e(t)), h = /* @__PURE__ */ new Map(), g = /* @__PURE__ */ new Map(), _ = Ue();
	for (let e of [
		1,
		2,
		3,
		4,
		5,
		6
	]) g.set(e, {
		...Ue(),
		rotation: e,
		rallies: 0,
		so: 0,
		soWon: 0,
		bp: 0,
		bpWon: 0
	});
	let v = 0, y = 0, b = 0, x = 0, S = 0, C = !1, w = !1;
	main: for (let i of p) {
		let a = e(i);
		if (a) for (let i of t(a.rallies)) {
			if (v >= ze) {
				C = !0;
				break main;
			}
			v++;
			let a = e(i);
			if (!a) continue;
			let o = s === "ours" ? a.rotationBefore : a.opponentRotationBefore, c = r(o) ? o : null;
			if (c !== null) {
				let e = g.get(c);
				e.rallies++, n(a.servingBefore) && n(a.winner) && (a.servingBefore === s ? (e.bp++, a.winner === s && e.bpWon++) : (e.so++, a.winner === s && e.soWon++));
			}
			for (let n of t(a.actions)) {
				if (y >= Be) {
					C = !0;
					break main;
				}
				y++;
				let t = e(n);
				if (!t || t.team !== s || (c === null && S++, c !== null && Ye(g.get(c), t), l !== null && c !== l)) continue;
				let r = Je(t, s), i = r.key, a = h.get(i);
				!a && h.size >= Ve ? (w = !0, Ye(_, t) && (b++, r.identified || x++)) : (a || (a = {
					...Ue(),
					...r
				}, h.set(i, a)), !a.number && r.number && (a.number = r.number), !a.name && r.name && (a.name = r.name), Ye(a, t) && (b++, a.identified || x++));
			}
		}
	}
	let T = [...h.values()].filter((e) => e.actions > 0).sort((e, t) => e.identified === t.identified ? (e.number === null ? Infinity : Number(e.number)) - (t.number === null ? Infinity : Number(t.number)) || e.name.localeCompare(t.name, "es") || e.key.localeCompare(t.key) : e.identified ? -1 : 1).slice(0, Ve).map((e) => Object.freeze({
		key: e.key,
		number: e.number,
		name: e.name || "Jugador sin nombre",
		identified: e.identified,
		actions: e.actions,
		serve: Object.freeze({
			attempts: e.s,
			aces: e.aces,
			errors: e.sErrors
		}),
		receive: Object.freeze({
			attempts: e.r,
			perfect: e.rPerfect,
			positive: e.rPositive,
			positivePct: We(e.rPositive, e.r),
			perfectPct: We(e.rPerfect, e.r)
		}),
		attack: Xe(e),
		block: Object.freeze({
			attempts: e.b,
			points: e.bPoints
		}),
		digs: e.d,
		sets: e.e
	})), E = [...g.values()].map((e) => Object.freeze({
		rotation: e.rotation,
		rallies: e.rallies,
		sideOut: Ze(e.so, e.soWon),
		breakPoint: Ze(e.bp, e.bpWon),
		attack: Xe(e)
	})), D = t(e(o?.liveRally)?.actions).filter((t) => e(t)?.team === s).length;
	return Object.freeze({
		available: m,
		filters: u,
		players: Object.freeze(T),
		rotations: Object.freeze(E),
		ralliesExamined: v,
		actionsExamined: y,
		selectedActions: b,
		unattributedActions: x,
		missingRotationActions: S,
		pendingActions: D,
		truncated: C,
		playersTruncated: w
	});
}
// src/state/player-boxscore-runtime.ts
function $e(e) {
	let t = e.document, n = t.getElementById("vc20511-boxscore"), r = t.getElementById("scout-workspace-v900"), i = t.getElementById("v900-phase-analyze"), a = e.VC_STATE_2059;
	if (!n || !r || !i || !a) return null;
	if (e.VC_PLAYER_BOXSCORE_20511) return e.VC_PLAYER_BOXSCORE_20511;
	let o = (e, n = "", r = "") => {
		let i = t.createElement(e);
		return i.className = n, i.textContent = r, i;
	}, s = o("div", "vc20511-head"), c = o("div");
	c.append(o("small", "", "BOXSCORE PROFESIONAL · V20.5.11"), o("h3", "", "Jugadores y rotaciones")), s.append(c, o("span", "vc20511-chip", "Solo acciones confirmadas"));
	let l = o("div", "vc20511-controls"), u = (e, t, n) => {
		let r = o("label");
		r.append(o("span", "", e));
		let i = o("select");
		i.setAttribute("aria-label", n);
		for (let [e, n] of t) {
			let t = o("option", "", n);
			t.value = e, i.append(t);
		}
		return r.append(i), l.append(r), i;
	}, d = u("Equipo", [["ours", "Nuestro equipo"], ["opponent", "Rival"]], "Filtrar equipo"), f = u("Periodo", [["current", "Set actual"], ["match", "Partido completo"]], "Filtrar periodo"), p = u("Rotación", [
		["0", "Todas"],
		["1", "P1"],
		["2", "P2"],
		["3", "P3"],
		["4", "P4"],
		["5", "P5"],
		["6", "P6"]
	], "Filtrar rotación");
	d.value = "ours", f.value = "current", p.value = "0";
	let m = o("p", "vc20511-status", "Esperando partido activo");
	m.setAttribute("role", "status");
	let h = o("div", "vc20511-scroll"), g = o("h4", "", "Rendimiento por rotación"), _ = o("div", "vc20511-scroll vc20511-rotation-scroll"), v = o("p", "vc20511-note", "Datos del scouting confirmado; no se infieren puntos a partir de códigos #. P1–P6 corresponde a la rotación del equipo seleccionado al inicio de cada rally.");
	n.append(s, l, m, h, g, _, v);
	let y = !1, b = !1, x = null, S = Ie(e), C = Le({
		now: () => e.performance?.now?.() ?? Date.now(),
		report: (e, t) => S.observe("scouting-boxscore", e, t)
	}), T = () => r.classList.contains("active") && !i.classList.contains("hidden"), E = (e) => e === null ? "—" : `${e}%`, D = (e, t, n = "td") => e.append(o(n, "", t)), O = (e) => {
		let t = o("table", "vc20511-table"), n = o("thead"), r = o("tr");
		for (let t of e) D(r, t, "th");
		n.append(r), t.append(n);
		let i = o("tbody");
		return t.append(i), {
			grid: t,
			tbody: i
		};
	}, k = (e, t = !1) => {
		y || C.render(JSON.stringify(e), () => {
			n.dataset.state = e.available ? e.truncated || e.playersTruncated ? "partial" : "available" : "waiting", m.textContent = e.available ? `${e.players.length} jugadores · ${e.selectedActions} acciones evaluadas · ${e.ralliesExamined} rallies examinados` + (e.unattributedActions ? ` · ${e.unattributedActions} sin identificar` : "") + (e.missingRotationActions ? ` · ${e.missingRotationActions} sin rotación` : "") + (e.pendingActions ? ` · ${e.pendingActions} acciones abiertas (excluidas)` : "") + (e.truncated || e.playersTruncated ? " · RESULTADOS PARCIALES" : "") : "No hay datos confirmados del periodo seleccionado.";
			let t = O([
				"JUGADOR",
				"SAQ · #/=",
				"REC · +/#",
				"ATA · K/EFF",
				"BLQ · #",
				"D/E",
				"ACC."
			]);
			for (let n of e.players) {
				let e = o("tr");
				D(e, `${n.number === null ? "—" : "#" + n.number} · ${n.name}`), D(e, `${n.serve.attempts} · ${n.serve.aces}/${n.serve.errors}`), D(e, `${n.receive.attempts} · ${E(n.receive.positivePct)} / ${E(n.receive.perfectPct)}`), D(e, `${n.attack.attempts} · ${n.attack.kills}/${E(n.attack.efficiencyPct)}`), D(e, `${n.block.attempts} · ${n.block.points}`), D(e, `${n.digs}/${n.sets}`), D(e, String(n.actions)), t.tbody.append(e);
			}
			if (!e.players.length) {
				let e = o("tr"), n = o("td", "", "No hay acciones confirmadas con estos filtros.");
				n.setAttribute("colspan", "7"), e.append(n), t.tbody.append(e);
			}
			h.replaceChildren(t.grid);
			let r = O([
				"ROT.",
				"RALLIES",
				"SO · G/T",
				"BP · G/T",
				"ATA · K/EFF"
			]);
			for (let t of e.rotations) {
				let n = o("tr", e.filters.rotation === t.rotation ? "vc20511-selected" : "");
				D(n, `P${t.rotation}`), D(n, String(t.rallies)), D(n, `${E(t.sideOut.percent)} · ${t.sideOut.won}/${t.sideOut.attempts}`), D(n, `${E(t.breakPoint.percent)} · ${t.breakPoint.won}/${t.breakPoint.attempts}`), D(n, `${t.attack.attempts} · ${t.attack.kills}/${E(t.attack.efficiencyPct)}`), r.tbody.append(n);
			}
			_.replaceChildren(r.grid);
		}, t);
	}, A = (t = !1) => {
		let n = {
			team: d.value === "opponent" ? "opponent" : "ours",
			scope: f.value === "match" ? "match" : "current",
			rotation: /^[1-6]$/.test(p.value) ? Number(p.value) : null
		}, r = e.VC_SCOUT_PROJECTIONS_20522;
		t && r?.invalidate();
		let i = r ? r.getPlayerBoxscore(n) : Qe(w(e), n);
		return x = i, T() && k(i, t), i;
	}, j = () => A(!0), ee = a.subscribe("change", () => {
		y || b || !T() || (b = !0, Promise.resolve().then(() => {
			b = !1, !y && T() && A();
		}));
	}), te = () => A(!0);
	for (let e of [
		d,
		f,
		p
	]) e.addEventListener("change", te);
	let M = typeof MutationObserver == "function" ? new MutationObserver(() => {
		T() && A();
	}) : null;
	M?.observe(r, {
		attributes: !0,
		attributeFilter: ["class"]
	}), M?.observe(i, {
		attributes: !0,
		attributeFilter: ["class"]
	}), T() && A();
	let N = Object.freeze({
		version: "20.5.11",
		readOnly: !0,
		getReport: () => x,
		refresh: j,
		dispose() {
			if (!y) {
				y = !0, M?.disconnect(), ee();
				for (let e of [
					d,
					f,
					p
				]) e.removeEventListener("change", te);
				C.invalidate(), n.replaceChildren(), x = null, e.VC_PLAYER_BOXSCORE_20511 === N && delete e.VC_PLAYER_BOXSCORE_20511;
			}
		}
	});
	return e.VC_PLAYER_BOXSCORE_20511 = N, N;
}
// src/state/scouting-projections.ts
var et = 8;
function tt(e, t) {
	let n = null, i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Set(), o = 0, s = 0, c = 0, l = 0, u = !1, d = () => {
		u || (o++, l++, n = null, i.clear());
	}, f = t.subscribe("change", d), p = Object.freeze({
		version: "20.5.22",
		readOnly: !0,
		getSnapshot: () => t.getSnapshot(),
		subscribe: (e, n) => {
			if (u) return () => {};
			let r = t.subscribe(e, n);
			return a.add(r), () => {
				r(), a.delete(r);
			};
		},
		getLiveStatistics() {
			if (u) throw Error("La vista de scouting está cerrada.");
			return n ? (c++, n) : (n = je(w(e)), s++, n);
		},
		getPlayerBoxscore(t) {
			if (u) throw Error("La vista de scouting está cerrada.");
			let n = t.team === "opponent" ? "opponent" : "ours", a = t.scope === "match" ? "match" : "current", o = r(t.rotation) ? t.rotation : null, l = `${n}:${a}:${o ?? 0}`, d = i.get(l);
			if (d) return c++, d;
			let f = Qe(w(e), {
				team: n,
				scope: a,
				rotation: o
			});
			if (s++, i.size >= et) {
				let e = i.keys().next().value;
				e !== void 0 && i.delete(e);
			}
			return i.set(l, f), f;
		},
		invalidate: d,
		diagnostics: () => Object.freeze({
			readOnly: !0,
			generation: o,
			calculations: s,
			cacheHits: c,
			invalidations: l,
			playerCacheEntries: i.size,
			hasLiveCache: n !== null
		}),
		dispose() {
			if (!u) {
				u = !0, f();
				for (let e of a) e();
				a.clear(), n = null, i.clear(), e.VC_SCOUT_PROJECTIONS_20522 === p && delete e.VC_SCOUT_PROJECTIONS_20522;
			}
		}
	});
	return p;
}
function nt(e) {
	if (e.VC_SCOUT_PROJECTIONS_20522) return e.VC_SCOUT_PROJECTIONS_20522;
	let t = e.VC_STATE_2059;
	if (!t) return null;
	let n = tt(e, t);
	return e.VC_SCOUT_PROJECTIONS_20522 = n, n;
}
// src/state/analysis-query.ts
var rt = Object.freeze([
	"code",
	"skill",
	"player",
	"evaluation",
	"ownRotation",
	"rivalRotation",
	"reception",
	"setter",
	"attacker",
	"tempo",
	"combo",
	"startZone",
	"endZone",
	"outcome",
	"video",
	"status"
]), L = (e) => String(e ?? "").trim(), it = (e) => Array.isArray(e) ? e : [], R = (e) => L(e).toLocaleLowerCase("es"), at = (e) => e === "ours" || e === "opponent" ? e : null;
function ot(e) {
	let t = e || {};
	return Object.fromEntries(rt.map((e) => [e, L(t[e]).slice(0, e === "code" ? 100 : 80)]));
}
function st(e, t = {}) {
	let n = ot(t), r = at(t.team), i = L(t.set), a = L(t.rotation), o = L(t.phase).toUpperCase(), s = R(n.code), c = !!(s || n.skill || n.player || n.evaluation || n.startZone || n.endZone || n.video), l = !!(n.setter || n.attacker || n.tempo || n.combo), u = l || !!n.reception, d = [], f = /* @__PURE__ */ new Map(), p = /* @__PURE__ */ new Map(), m = /* @__PURE__ */ new Map();
	for (let t of it(e?.chains)) m.has(t.rallyKey) || m.set(t.rallyKey, []), m.get(t.rallyKey).push(t);
	let h = (e) => e && (!r || e.team === r) && (!n.skill || e.skill === n.skill) && (!n.evaluation || e.evaluation === n.evaluation) && (!n.player || R(e.player) === R(n.player)) && (!s || [
		e.code,
		e.skillRaw,
		e.fields?.attackCode,
		e.fields?.specialCode,
		e.fields?.startZone?.code,
		e.fields?.endZone?.code,
		e.fields?.setTarget?.code,
		e.fields?.contactZone?.code,
		e.fields?.combo,
		e.fields?.direction
	].some((e) => R(e).includes(s))) && (!n.startZone || e.fields?.startZone?.code === n.startZone.toUpperCase().replace(/^([^Z])/, "Z$1")) && (!n.endZone || e.fields?.endZone?.code === n.endZone.toUpperCase().replace(/^([^Z])/, "Z$1")) && (!n.video || (n.video === "yes" ? !!e.video : !e.video)), g = (e) => e && (!r || e.team === r) && (!n.setter || R(e.setter?.player) === R(n.setter)) && (!n.attacker || R(e.attack?.player) === R(n.attacker)) && (!n.tempo || R(e.tempo || e.attack?.fields?.attackTempo) === R(n.tempo)) && (!n.combo || R(e.combo) === R(n.combo)) && (!n.reception || e.reception?.evaluation === n.reception);
	for (let t of it(e?.rallies)) {
		if (n.status !== "all" && n.status === "open" != !t.closed || i && String(t.set) !== i || n.ownRotation && String(t.ownRotation || "") !== n.ownRotation || n.rivalRotation && String(t.rivalRotation || "") !== n.rivalRotation || a && String((r === "opponent" ? t.rivalRotation : t.ownRotation) || "") !== a || o && (!r || !t.serving || (t.serving === r ? "K2" : "K1") !== o) || n.outcome && t.winner !== n.outcome) continue;
		let e = t.contacts.filter((e) => !r || e.team === r), s = (m.get(t.key) || []).filter(g), _;
		if (u) {
			let t = /* @__PURE__ */ new Set();
			for (let e of s) for (let n of [
				e.reception,
				e.setter,
				e.attack
			]) n && t.add(n.key);
			if (n.reception && !l) for (let r of e) r.skill === "R" && r.evaluation === n.reception && t.add(r.key);
			let r = new Set(s.map((e) => e.possessionKey));
			if (n.reception && !l) for (let t of e) t.skill === "R" && t.evaluation === n.reception && t.possessionKey && r.add(t.possessionKey);
			_ = e.filter((e) => r.has(e.possessionKey) && (!c || h(e)) && (!c || !n.skill || t.has(e.key))), c || (_ = e.filter((e) => t.has(e.key)));
		} else _ = e.filter(h);
		if (!c && !u || _.length) {
			d.push(t);
			for (let e of _) f.set(e.key, e);
			for (let e of s) (!c || _.some((t) => t.possessionKey && t.possessionKey === e.possessionKey)) && p.set(e.key, e);
		}
	}
	let _ = [...f.values()], v = [...p.values()], y = /* @__PURE__ */ new Map(), b = /* @__PURE__ */ new Map();
	for (let e of _) {
		let t = L(e.skill) || "?", n = L(e.player) || "Sin identificar";
		y.set(t, (y.get(t) || 0) + 1), b.set(n, (b.get(n) || 0) + 1);
	}
	let x = _.filter((e) => e.skill === "A" && e.evaluation), S = x.filter((e) => e.evaluation === "#").length, C = x.filter((e) => e.evaluation === "=").length, w = x.filter((e) => e.evaluation === "/").length, T = x.length ? Math.round((S - C - w) / x.length * 1e3) / 10 : null;
	return {
		rallies: d,
		contacts: _,
		chains: v,
		statistics: {
			rallies: d.length,
			contacts: _.length,
			chains: v.length,
			videoContacts: _.filter((e) => e.video).length,
			missingEvaluation: _.filter((e) => !e.evaluation).length,
			attackRated: x.length,
			kills: S,
			errors: C,
			blocked: w,
			efficiency: T,
			bySkill: [...y].sort((e, t) => t[1] - e[1]),
			byPlayer: [...b].sort((e, t) => t[1] - e[1])
		},
		filters: n,
		target: r,
		matchId: L(e?.matchId)
	};
}
// src/state/analysis-query-runtime.ts
var ct = /* @__PURE__ */ new WeakMap(), lt = /* @__PURE__ */ new WeakMap();
function ut(e) {
	let t = ct.get(e);
	if (t) return t;
	let n = 0, r = 0, i = 0, a = 0, o = 0, s = 0, c = () => {
		try {
			let t = e.performance?.now?.();
			return Number.isFinite(t) ? t : Date.now();
		} catch {
			return Date.now();
		}
	}, l = Object.freeze({
		VERSION: "20.5.23",
		readOnly: !0,
		query(e, t = {}) {
			let l = c();
			try {
				return st(e, t);
			} catch (e) {
				throw r++, e;
			} finally {
				let e = c() - l;
				a = Number.isFinite(e) && e >= 0 ? Math.round(e * 100) / 100 : 0, n++, o += (a - o) / n, s = Math.max(s, a), a > 16 && i++;
			}
		},
		diagnostics: () => Object.freeze({
			readOnly: !0,
			queries: n,
			failures: r,
			slowQueries: i,
			lastMs: a,
			averageMs: Math.round(o * 100) / 100,
			maxMs: s,
			budgetMs: 16
		})
	});
	return ct.set(e, l), e.VC_ANALYSIS_QUERY_20523 = l, l;
}
function dt(e) {
	let t = lt.get(e);
	if (t) return t;
	let n = e.document, r = n.getElementById("v11-management");
	if (!r) return null;
	let i = n.getElementById("vc60-diagnostics"), a = i || r, o = e.VC_ANALYSIS_QUERY_20523 || ut(e), s = (e, t = "", r = "") => {
		let i = n.createElement(e);
		return i.className = t, i.textContent = r, i;
	}, c = s("section", "vc20523-query-metrics");
	c.id = "vc20523-query-metrics";
	let l = s("div", "vc20523-heading"), u = s("div");
	u.append(s("small", "", "V20.5.31 · ANÁLISIS"), s("h3", "", "Rendimiento del Data Engine y búsquedas")), l.append(u, s("span", "", "Solo lectura"));
	let d = s("p", "", "Mediciones locales de normalización, filtros, índices y exportación CSV. La sección visual inferior mide solo actualizaciones de interfaz; no incluye vídeo, descargas ni sincronización."), f = s("div", "vc20523-values"), p = /* @__PURE__ */ new Map();
	for (let [e, t] of [
		["queries", "Consultas"],
		["last", "Última"],
		["average", "Media"],
		["max", "Máxima"],
		["slow", "Más de 16 ms"],
		["failures", "Errores"]
	]) {
		let n = s("div");
		n.append(s("small", "", t));
		let r = s("strong", "", "—");
		n.append(r), f.append(n), p.set(e, r);
	}
	let m = s("h4", "vc20524-subheading", "Normalización del Data Engine"), h = s("div", "vc20523-values"), g = /* @__PURE__ */ new Map();
	for (let [e, t] of [
		["normalizations", "Normalizaciones"],
		["last", "Última"],
		["average", "Media"],
		["max", "Máxima"],
		["slow", "Más de 16 ms"],
		["failures", "Errores"]
	]) {
		let n = s("div");
		n.append(s("small", "", t));
		let r = s("strong", "", "—");
		n.append(r), h.append(n), g.set(e, r);
	}
	let _ = s("h4", "vc20524-subheading", "Filtros, métricas, K1/K2 y cobertura"), v = s("div", "vc20523-values"), y = /* @__PURE__ */ new Map();
	for (let [e, t] of [
		["operations", "Operaciones"],
		["filters", "Filtros"],
		["evaluations", "Evaluaciones"],
		["points", "K1/K2"],
		["coverage", "Cobertura"],
		["reconciliations", "Conciliaciones"],
		["average", "Media"],
		["slow", "Más de 16 ms"],
		["failures", "Errores"]
	]) {
		let n = s("div");
		n.append(s("small", "", t));
		let r = s("strong", "", "—");
		n.append(r), v.append(n), y.set(e, r);
	}
	let b = s("h4", "vc20524-subheading", "Exportación CSV e índices temporales"), x = s("div", "vc20523-values"), S = /* @__PURE__ */ new Map();
	for (let [e, t] of [
		["exports", "CSV generados"],
		["last", "Último CSV"],
		["average", "Media CSV"],
		["failures", "Errores CSV"],
		["builds", "Índices creados"],
		["hits", "Índices reutilizados"],
		["invalidations", "Índices invalidados"],
		["unsupported", "Datos no indexables"],
		["dimensions", "Filtros multidimensionales"],
		["avoided", "Contactos evitados"],
		["estimated", "Referencias índice (estim.)"],
		["limited", "Índices limitados"],
		["heap", "Heap JS navegador"]
	]) {
		let n = s("div");
		n.append(s("small", "", t));
		let r = s("strong", "", "—");
		n.append(r), x.append(n), S.set(e, r);
	}
	let C = s("h4", "vc20524-subheading", "Actualizaciones visuales de Scouting y Análisis"), w = s("p", "", "Recuentos desde que abriste la aplicación: actualizaciones realizadas y repeticiones evitadas. No son pruebas de velocidad del dispositivo ni datos de partidos."), T = s("div", "vc20523-values"), E = [
		["scouting-live", "Scouting LIVE"],
		["scouting-boxscore", "Boxscore"],
		["data-engine", "Data Engine"],
		["rally-search", "Búsqueda táctica"]
	], D = /* @__PURE__ */ new Map();
	for (let [e, t] of E) {
		let n = s("div");
		n.append(s("small", "", t));
		let r = s("strong", "", "—");
		n.append(r), T.append(n), D.set(e, r);
	}
	let O = s("h4", "vc20524-subheading", "Vista Data Engine migrada a TypeScript"), k = s("p", "", "Plantilla de lectura sin cambios de datos. La interfaz histórica sigue disponible si el módulo nuevo falla."), A = s("div", "vc20523-values"), j = /* @__PURE__ */ new Map();
	for (let [e, t] of [
		["renders", "Plantillas TypeScript"],
		["average", "Media"],
		["slow", "Más de 16 ms"],
		["failures", "Errores de plantilla"]
	]) {
		let n = s("div");
		n.append(s("small", "", t));
		let r = s("strong", "", "—");
		n.append(r), A.append(n), j.set(e, r);
	}
	let ee = s("h4", "vc20524-subheading", "Vista Rally Search Pro migrada a TypeScript"), te = s("p", "", "La plantilla de filtros, catálogos y secuencias se genera con Vite. Las búsquedas guardadas, los clips de vídeo y el CSV conservan sus controles históricos."), M = s("div", "vc20523-values"), N = /* @__PURE__ */ new Map();
	for (let [e, t] of [
		["renders", "Plantillas TypeScript"],
		["average", "Media"],
		["slow", "Más de 16 ms"],
		["failures", "Errores de plantilla"]
	]) {
		let n = s("div");
		n.append(s("small", "", t));
		let r = s("strong", "", "—");
		n.append(r), M.append(n), N.set(e, r);
	}
	let ne = s("h4", "vc20524-subheading", "Controles Rally Search Pro migrados a TypeScript"), re = s("p", "", "Controladores de filtros, presets y exportación; solo recuentos locales. Las búsquedas guardadas siguen en la misma clave del navegador."), P = s("div", "vc20523-values"), ie = /* @__PURE__ */ new Map();
	for (let [e, t] of [
		["bindings", "Vistas conectadas"],
		["filters", "Cambios de filtro"],
		["saved", "Presets guardados"],
		["loaded", "Presets cargados"],
		["deleted", "Presets eliminados"],
		["exports", "CSV exportados"],
		["failures", "Errores de control"]
	]) {
		let n = s("div");
		n.append(s("small", "", t));
		let r = s("strong", "", "—");
		n.append(r), P.append(n), ie.set(e, r);
	}
	let F = s("button", "vc20523-refresh", "Actualizar medición");
	F.type = "button";
	let ae = s("p", "vc20523-note", "El umbral de 16 ms es orientativo. La memoria del índice es una estimación mínima de referencias, NO memoria real atribuible al módulo. El heap JS, cuando exista, corresponde al navegador completo. No se guardan códigos, nombres ni partidos en este diagnóstico.");
	c.append(l, d, s("h4", "vc20524-subheading", "Búsqueda táctica"), f, m, h, _, v, b, x, C, w, T, O, k, A, ee, te, M, ne, re, P, F, ae);
	let oe = n.getElementById(i ? "vc60-stat-grid" : "vc2059-observable");
	oe?.parentNode === a ? oe.insertAdjacentElement("afterend", c) : a.append(c);
	let se = !1, I = (e) => `${e.toFixed(2)} ms`, ce = () => {
		if (se) return;
		let t = o.diagnostics(), n = {
			queries: String(t.queries),
			last: I(t.lastMs),
			average: I(t.averageMs),
			max: I(t.maxMs),
			slow: String(t.slowQueries),
			failures: String(t.failures)
		};
		for (let [e, t] of Object.entries(n)) {
			let n = p.get(e);
			n && n.textContent !== t && (n.textContent = t);
		}
		let r = e.VC_ANALYSIS_NORMALIZE_20524?.diagnostics?.(), i = {
			normalizations: String(r?.normalizations ?? 0),
			last: I(r?.lastMs ?? 0),
			average: I(r?.averageMs ?? 0),
			max: I(r?.maxMs ?? 0),
			slow: String(r?.slowNormalizations ?? 0),
			failures: String(r?.failures ?? 0)
		};
		for (let [e, t] of Object.entries(i)) {
			let n = g.get(e);
			n && n.textContent !== t && (n.textContent = t);
		}
		let a = e.VC_ANALYSIS_OPERATIONS_20525?.diagnostics?.(), s = {
			operations: String(a?.operations ?? 0),
			filters: String(a?.filters ?? 0),
			evaluations: String(a?.evaluations ?? 0),
			points: String(a?.points ?? 0),
			coverage: String(a?.coverage ?? 0),
			reconciliations: String(a?.reconciliations ?? 0),
			average: I(a?.averageMs ?? 0),
			slow: String(a?.slowOperations ?? 0),
			failures: String(a?.failures ?? 0)
		};
		for (let [e, t] of Object.entries(s)) {
			let n = y.get(e);
			n && n.textContent !== t && (n.textContent = t);
		}
		let c = e.VC_ANALYSIS_CSV_20526?.diagnostics?.(), l = e.VC_ANALYSIS_CSV_20526?.indexDiagnostics?.(), u = e.performance?.memory?.usedJSHeapSize, d = typeof u == "number" && Number.isFinite(u) && u >= 0 ? `${(u / 1048576).toFixed(1)} MiB` : "No disponible", f = {
			exports: String(c?.exports ?? 0),
			last: I(c?.lastMs ?? 0),
			average: I(c?.averageMs ?? 0),
			failures: String(c?.failures ?? 0),
			builds: String(l?.builds ?? 0),
			hits: String(l?.hits ?? 0),
			invalidations: String(l?.invalidations ?? 0),
			unsupported: String(l?.unsupported ?? 0),
			dimensions: String(l?.dimensionUses ?? 0),
			avoided: String(l?.avoidedContactScans ?? 0),
			estimated: `${((l?.lastEstimatedReferenceBytes ?? 0) / 1024).toFixed(1)} KiB`,
			limited: String(l?.skippedMemoryLimit ?? 0),
			heap: d
		};
		for (let [e, t] of Object.entries(f)) {
			let n = S.get(e);
			n && n.textContent !== t && (n.textContent = t);
		}
		let m = e.VC_RENDER_METRICS_20528?.diagnostics?.();
		for (let [e] of E) {
			let t = m?.areas[e], n = t ? `${t.rendered} dibujadas · ${t.skipped} evitadas · media ${I(t.averageMs)} · ${t.failures} errores` : "Sin mediciones todavía", r = D.get(e);
			r && r.textContent !== n && (r.textContent = n);
		}
		let h = e.VC_ANALYSIS_VIEW_20529?.diagnostics?.(), _ = {
			renders: String(h?.renders ?? 0),
			average: I(h?.averageMs ?? 0),
			slow: String(h?.slowRenders ?? 0),
			failures: String(h?.failures ?? 0)
		};
		for (let [e, t] of Object.entries(_)) {
			let n = j.get(e);
			n && n.textContent !== t && (n.textContent = t);
		}
		let v = e.VC_RALLY_VIEW_20530?.diagnostics?.(), b = {
			renders: String(v?.renders ?? 0),
			average: I(v?.averageMs ?? 0),
			slow: String(v?.slowRenders ?? 0),
			failures: String(v?.failures ?? 0)
		};
		for (let [e, t] of Object.entries(b)) {
			let n = N.get(e);
			n && n.textContent !== t && (n.textContent = t);
		}
		let x = e.VC_RALLY_CONTROLS_20531?.diagnostics?.();
		for (let e of [
			"bindings",
			"filters",
			"saved",
			"loaded",
			"deleted",
			"exports",
			"failures"
		]) {
			let t = String(x?.[e] ?? 0), n = ie.get(e);
			n && n.textContent !== t && (n.textContent = t);
		}
	};
	F.addEventListener("click", ce), ce();
	let le = Object.freeze({
		readOnly: !0,
		refresh: ce,
		dispose() {
			se || (se = !0, F.removeEventListener("click", ce), c.remove(), lt.delete(e));
		}
	});
	return lt.set(e, le), le;
}
// src/state/analysis-normalizer.ts
var ft = /* @__PURE__ */ new Set([
	"S",
	"R",
	"E",
	"A",
	"B",
	"D",
	"F",
	"C"
]), pt = /* @__PURE__ */ new Set([
	"#",
	"+",
	"!",
	"-",
	"/",
	"="
]), z = (e) => String(e ?? "").trim(), B = (e) => e != null && z(e) !== "", mt = (e) => encodeURIComponent(z(e));
function V(e) {
	let t = z(e).toUpperCase().match(/^Z?([1-9])([ABCD])?$/);
	return t ? {
		zone: Number(t[1]),
		quadrant: t[2] || null,
		code: "Z" + t[1] + (t[2] || "")
	} : null;
}
var ht = (e) => z(e.playerNameSnapshot || e.playerLabel || e.playerNumberSnapshot || e.playerId || e.playerNumber);
function gt(r) {
	let i = [], a = [], o = [], s = [], c = [], l = e(r), u = z(l?.id), d = /* @__PURE__ */ new Set();
	for (let [r, f] of t(l?.sets).entries()) {
		let l = e(f), p = Number(l?.number), m = Number.isInteger(p) && p > 0 ? p : r + 1;
		d.has(m) && i.push({
			type: "duplicate-set",
			set: m,
			message: "Número de set duplicado"
		}), d.add(m);
		let h = /* @__PURE__ */ new Set();
		for (let [d, f] of t(l?.rallies).entries()) {
			if (!f) continue;
			let l = e(f) || {}, p = B(l.id) ? z(l.id) : null;
			p && h.has(p) && i.push({
				type: "duplicate-rally",
				set: m,
				index: d + 1,
				message: "Identificador de rally repetido"
			}), p && h.add(p);
			let g = [
				mt(u),
				m,
				p ? "id:" + mt(p) : "pos:" + d
			].join("|"), _ = n(l.servingBefore) ? l.servingBefore : null, v = n(l.winner) ? l.winner : null, y = Number(l.rotationBefore), b = Number(l.opponentRotationBefore), x = {
				key: g,
				matchId: u,
				set: m,
				index: d + 1,
				nativeId: p,
				serving: _,
				winner: v,
				closed: !!v,
				ownRotation: Number.isInteger(y) && y >= 1 && y <= 6 ? y : null,
				rivalRotation: Number.isInteger(b) && b >= 1 && b <= 6 ? b : null,
				contacts: [],
				possessions: [],
				scoreBefore: l.scoreBefore || null,
				scoreAfter: l.scoreAfter || null,
				provenance: {
					setIndex: r,
					rallyIndex: d,
					stableId: !!p
				}
			};
			v || i.push({
				type: "unknown-winner",
				key: g,
				message: "Ganador de rally sin registrar"
			}), _ || i.push({
				type: "unknown-serve",
				key: g,
				message: "Equipo al saque no identificado"
			});
			let S = /* @__PURE__ */ new Set();
			for (let [a, s] of t(l.actions).entries()) {
				if (!s) continue;
				let t = e(s) || {}, c = n(t.team) ? t.team : null, l = z(t.skill).toUpperCase(), f = z(t.evaluation), p = B(t.id) ? z(t.id) : null;
				p && S.has(p) && i.push({
					type: "duplicate-action",
					key: g,
					index: a,
					message: "Acción duplicada dentro del rally"
				}), p && S.add(p);
				let h = {
					startZone: V(t.startZone),
					endZone: V(t.endZone),
					contactZone: V(t.contactZone),
					setTarget: V(t.setTarget),
					tempo: z(t.setTempo),
					attackTempo: z(t.attackTempo),
					combo: z(t.attackCombo),
					setterCall: z(t.setterCall),
					direction: z(t.attackDirection),
					blockers: B(t.blockers) ? z(t.blockers) : "",
					serveType: z(t.serveType),
					subtype: z(t.skillSubtype),
					receivedServeType: z(t.receivedServeType),
					dvSetType: z(t.dvSetType),
					attackCode: z(t.attackCode),
					endCone: z(t.endCone),
					specialCode: z(t.specialCode),
					blockTargetNumber: z(t.blockTargetNumber),
					startCoordinate: B(t.startCoordinate) ? t.startCoordinate : null,
					endCoordinate: B(t.endCoordinate) ? t.endCoordinate : null,
					contactCoordinate: B(t.contactCoordinate) ? t.contactCoordinate : null
				}, _ = [
					"videoTime",
					"videoTimestamp",
					"liveVideoTime",
					"videoAction"
				].some((e) => B(t[e]) && Number.isFinite(Number(t[e])) && Number(t[e]) >= 0), v = {
					key: g + "|" + (p ? "id:" + mt(p) : "pos:" + a),
					rallyKey: g,
					matchId: u,
					set: m,
					rallyIndex: d + 1,
					actionIndex: a,
					nativeId: p,
					team: c,
					code: z(t.code),
					skill: ft.has(l) ? l : null,
					skillRaw: l,
					evaluation: pt.has(f) ? f : null,
					evaluationRaw: f,
					player: ht(t) || null,
					fields: h,
					video: _,
					scoutMs: Number.isFinite(Number(t.scoutMs)) && B(t.scoutMs) ? Number(t.scoutMs) : null,
					source: {
						matchId: u,
						setIndex: r,
						rallyIndex: d,
						actionIndex: a,
						stableId: !!p
					}
				};
				c || i.push({
					type: "unknown-team",
					key: v.key,
					message: "Acción sin equipo identificado"
				}), v.skill || i.push({
					type: "unknown-skill",
					key: v.key,
					message: "Fundamento desconocido"
				}), f && !v.evaluation && i.push({
					type: "unknown-evaluation",
					key: v.key,
					message: "Valoración no reconocida"
				});
				for (let e of [
					"startZone",
					"endZone",
					"contactZone",
					"setTarget"
				]) B(t[e]) && !h[e] && i.push({
					type: "invalid-zone",
					key: v.key,
					field: e,
					message: "Zona no reconocida"
				});
				o.push(v), x.contacts.push(v);
			}
			let C = null;
			for (let e of x.contacts) {
				if (!C || !e.team || C.team !== e.team) {
					if (!e.team) {
						C = null;
						continue;
					}
					C = {
						key: x.key + "|pos:" + x.possessions.length,
						rallyKey: x.key,
						team: e.team,
						contacts: [],
						set: x.set,
						rotation: e.team === "ours" ? x.ownRotation : x.rivalRotation,
						serving: x.serving,
						winner: x.winner
					}, x.possessions.push(C), s.push(C);
				}
				C.contacts.push(e), e.possessionKey = C.key;
			}
			for (let e of x.possessions) for (let [t, n] of e.contacts.entries()) {
				if (n.skill !== "E") continue;
				let r = null, i = null;
				for (let n = t + 1; n < e.contacts.length; n++) {
					let t = e.contacts[n];
					if (t.skill === "E") break;
					if (t.skill === "A") {
						r = t;
						break;
					}
				}
				for (let n = t - 1; n >= 0; n--) if (e.contacts[n].skill === "R") {
					i = e.contacts[n];
					break;
				}
				c.push({
					key: n.key,
					team: e.team,
					rallyKey: x.key,
					possessionKey: e.key,
					rotation: e.rotation,
					setter: n,
					attack: r,
					reception: i,
					target: n.fields.setTarget,
					tempo: n.fields.tempo,
					combo: n.fields.combo || r?.fields.combo || "",
					explicitTarget: !!n.fields.setTarget
				});
			}
			a.push(x);
		}
	}
	return {
		version: "19.3.8",
		matchId: u,
		rallies: a,
		contacts: o,
		possessions: s,
		chains: c,
		issues: i,
		count: {
			rallies: a.length,
			closed: a.filter((e) => e.closed).length,
			contacts: o.length,
			possessions: s.length,
			chains: c.length
		}
	};
}
// src/state/analysis-normalize-runtime.ts
var _t = /* @__PURE__ */ new WeakMap();
function vt(e) {
	let t = _t.get(e);
	if (t) return t;
	let n = 0, r = 0, i = 0, a = 0, o = 0, s = 0, c = () => {
		try {
			let t = e.performance?.now?.();
			return Number.isFinite(t) ? t : Date.now();
		} catch {
			return Date.now();
		}
	}, l = Object.freeze({
		VERSION: "20.5.24",
		readOnly: !0,
		normalize(e) {
			let t = c();
			try {
				return gt(e);
			} catch (e) {
				throw r++, e;
			} finally {
				let e = c() - t;
				a = Number.isFinite(e) && e >= 0 ? Math.round(e * 100) / 100 : 0, n++, o += (a - o) / n, s = Math.max(s, a), a > 16 && i++;
			}
		},
		diagnostics: () => Object.freeze({
			readOnly: !0,
			normalizations: n,
			failures: r,
			slowNormalizations: i,
			lastMs: a,
			averageMs: Math.round(o * 100) / 100,
			maxMs: s,
			budgetMs: 16
		})
	});
	return _t.set(e, l), e.VC_ANALYSIS_NORMALIZE_20524 = l, l;
}
// src/state/analysis-index.ts
var yt = /* @__PURE__ */ new WeakMap(), bt = 0, xt = 0, St = 0, Ct = 0, wt = 0, Tt = 0, Et = 0, Dt = 0, Ot = 0, kt = 4e4;
function At(e) {
	let t = /* @__PURE__ */ new Map(), n = !0;
	for (let [r, i] of e.rallies.entries()) t.has(i.key) && (n = !1), t.set(i.key, r);
	let r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Map(), d = /* @__PURE__ */ new Map(), f = /* @__PURE__ */ new Map(), p = [], m = 0, h = (e, t, n) => {
		if (!t) return;
		let r = e.get(t);
		r ? r.push(n) : e.set(t, [n]), m++;
	}, g = (e, r) => {
		let i = -1;
		for (let a of e) {
			let e = t.get(a.rallyKey);
			e === void 0 || e < i ? n = !1 : i = e;
			let o = r.get(a.rallyKey);
			o ? o.push(a) : r.set(a.rallyKey, [a]);
		}
	};
	g(e.contacts, r), g(e.possessions, i), g(e.chains, a);
	for (let t of e.contacts) h(o, t.possessionKey, t), h(s, t.team, t), h(c, t.skill, t), h(l, t.evaluation, t), h(u, t.player?.toLocaleLowerCase("es"), t), h(d, t.fields.startZone?.code, t), h(f, t.fields.endZone?.code, t), t.video && (p.push(t), m++);
	m += e.contacts.length + e.possessions.length + e.chains.length;
	let _ = m * 8;
	return Et = _, Dt = Math.max(Dt, _), bt++, n || Ct++, {
		contactsRef: e.contacts,
		ralliesRef: e.rallies,
		possessionsRef: e.possessions,
		chainsRef: e.chains,
		lengths: [
			e.rallies.length,
			e.contacts.length,
			e.possessions.length,
			e.chains.length
		],
		canonical: n,
		contacts: r,
		possessions: i,
		chains: a,
		contactsByPossession: o,
		byTeam: s,
		bySkill: c,
		byEvaluation: l,
		byPlayer: u,
		byStartZone: d,
		byEndZone: f,
		videoContacts: p,
		estimatedReferenceBytes: _
	};
}
function jt(e) {
	let t = yt.get(e);
	if (t && t.contactsRef === e.contacts && t.ralliesRef === e.rallies && t.possessionsRef === e.possessions && t.chainsRef === e.chains && t.lengths[0] === e.rallies.length && t.lengths[1] === e.contacts.length && t.lengths[2] === e.possessions.length && t.lengths[3] === e.chains.length) return xt++, t;
	t && (St++, yt.delete(e));
	let n = At(e);
	return yt.set(e, n), n;
}
function Mt(e, t) {
	let n = [];
	for (let r of e) {
		let e = t.get(r.key);
		if (e) for (let t of e) n.push(t);
	}
	return n;
}
function Nt(e, t) {
	if (e.rallies.length < 40 || t.length * 2 > e.rallies.length) return null;
	if (e.contacts.length > 4e4) return Ot++, null;
	let n = jt(e);
	return n.canonical ? {
		contacts: Mt(t, n.contacts),
		possessions: Mt(t, n.possessions),
		chains: Mt(t, n.chains)
	} : null;
}
function Pt(e, t, n) {
	if (e.contacts.length < 80 || e.contacts.length > 4e4) return e.contacts.length > 4e4 && Ot++, null;
	if (!t.team && !t.skill && !t.evaluation && !t.player && !t.startZone && !t.endZone && !t.video) return null;
	let r = jt(e);
	if (!r.canonical) return null;
	let i = [
		...t.team ? [r.byTeam.get(t.team) || []] : [],
		...t.skill ? [r.bySkill.get(t.skill) || []] : [],
		...t.evaluation ? [r.byEvaluation.get(t.evaluation) || []] : [],
		...t.player ? [r.byPlayer.get(t.player) || []] : [],
		...t.startZone ? [r.byStartZone.get(t.startZone) || []] : [],
		...t.endZone ? [r.byEndZone.get(t.endZone) || []] : [],
		...t.video ? [r.videoContacts] : []
	], a = null;
	for (let e of i) e.length < n && (!a || e.length < a.length) && (a = e);
	return a && (wt++, Tt += n - a.length), a;
}
function Ft(e) {
	yt.delete(e) && St++;
}
function It() {
	return Object.freeze({
		readOnly: !0,
		builds: bt,
		hits: xt,
		invalidations: St,
		unsupported: Ct,
		dimensionUses: wt,
		avoidedContactScans: Tt,
		lastEstimatedReferenceBytes: Et,
		peakEstimatedReferenceBytes: Dt,
		maxIndexedContacts: kt,
		skippedMemoryLimit: Ot
	});
}
// src/state/analysis-operations.ts
var Lt = (e) => String(e ?? "").trim(), Rt = (e) => e != null && Lt(e) !== "", zt = (e) => e === "ours" || e === "opponent" ? e : null, Bt = (e) => Array.isArray(e) ? e : [], Vt = (e, t) => t ? Math.round(1e3 * e / t) / 10 : null;
function Ht(e, t = {}) {
	let n = zt(t.team), r = Rt(t.set) ? Number(t.set) : null, i = Rt(t.rotation) ? Number(t.rotation) : null, a = Lt(t.phase).toUpperCase(), o = Lt(t.skill).toUpperCase(), s = Lt(t.evaluation), c = Lt(t.player).toLocaleLowerCase("es"), l = V(t.startZone), u = V(t.endZone), d = Lt(t.setter).toLocaleLowerCase("es"), f = e.rallies.filter((e) => e.closed && (!r || e.set === r) && (!i || (n ? (n === "ours" ? e.ownRotation : e.rivalRotation) === i : !1)) && (!a || !!e.serving && (n ? a === "K1" ? e.serving !== n : a === "K2" && e.serving === n : !1))), p = Nt(e, f), m = new Set(f.map((e) => e.key)), h = !!(o || s || c || l || u || t.video === !0), g = (Pt(e, {
		team: n,
		skill: o,
		evaluation: s,
		player: c,
		startZone: l?.code,
		endZone: u?.code,
		video: t.video === !0
	}, p?.contacts.length ?? e.contacts.length) || p?.contacts || e.contacts).filter((e) => m.has(e.rallyKey) && (!n || e.team === n) && (!o || e.skill === o) && (!s || e.evaluation === s) && (!c || e.player?.toLocaleLowerCase("es") === c) && (!l || e.fields.startZone?.code === l.code) && (!u || e.fields.endZone?.code === u.code) && (t.video !== !0 || e.video)), _ = (p?.chains || e.chains).filter((e) => m.has(e.rallyKey) && (!n || e.team === n) && (!d || e.setter.player?.toLocaleLowerCase("es") === d)), v = d ? new Set(_.map((e) => e.possessionKey)) : null, y = v ? g.filter((e) => v.has(e.possessionKey)) : g, b = new Set(h ? y.map((e) => e.rallyKey) : d ? _.map((e) => e.rallyKey) : f.map((e) => e.key)), x = f.filter((e) => b.has(e.key)), S = new Set(x.map((e) => e.key));
	return {
		rallies: x,
		contacts: y.filter((e) => S.has(e.rallyKey)),
		possessions: (p?.possessions || e.possessions).filter((e) => S.has(e.rallyKey) && (!n || e.team === n) && (!v || v.has(e.key))),
		chains: _.filter((e) => S.has(e.rallyKey)),
		target: n,
		filters: t
	};
}
function Ut(e, t = "A") {
	let n = Bt(e).filter((e) => e.skill === t), r = n.filter((e) => e.evaluation), i = r.filter((e) => e.evaluation === "#").length, a = r.filter((e) => e.evaluation === "=").length, o = r.filter((e) => e.evaluation === "/").length;
	return {
		recorded: n.length,
		rated: r.length,
		missing: n.length - r.length,
		kills: i,
		errors: a,
		blocked: o,
		killPct: Vt(i, r.length),
		efficiency: t === "A" ? Vt(i - a - o, r.length) : null
	};
}
function Wt(e, t) {
	let n = zt(t);
	if (!n) return null;
	let r = Bt(e).filter((e) => e.closed), i = r.filter((e) => e.serving && e.serving !== n), a = r.filter((e) => e.serving === n), o = (e) => {
		let t = e.filter((e) => e.winner === n).length;
		return {
			n: e.length,
			won: t,
			pct: Vt(t, e.length)
		};
	};
	return {
		closed: r.length,
		unknownServe: r.filter((e) => !e.serving).length,
		k1: o(i),
		k2: o(a)
	};
}
function Gt(e) {
	let t = e.contacts, n = [];
	for (let e of [
		"S",
		"R",
		"E",
		"A",
		"B",
		"D"
	]) {
		let r = t.filter((t) => t.skill === e), i = r.length, a = {
			team: r.filter((e) => e.team).length,
			player: r.filter((e) => e.player).length,
			evaluation: r.filter((e) => e.evaluation).length,
			zone: r.filter((t) => t.fields.contactZone || t.fields.startZone || t.fields.endZone || e === "E" && t.fields.setTarget).length,
			video: r.filter((e) => e.video).length
		};
		e === "E" && (a.tempo = r.filter((e) => e.fields.tempo).length, a.target = r.filter((e) => e.fields.setTarget).length), e === "A" && (a.direction = r.filter((e) => e.fields.direction).length, a.attackTempo = r.filter((e) => e.fields.attackTempo).length), n.push({
			skill: e,
			n: i,
			properties: a
		});
	}
	return {
		bySkill: n,
		missingIDs: e.contacts.filter((e) => !e.nativeId).length,
		unknownTeams: e.contacts.filter((e) => !e.team).length,
		invalidValues: e.issues.filter((e) => [
			"invalid-zone",
			"unknown-evaluation",
			"unknown-skill",
			"duplicate-action",
			"duplicate-rally",
			"duplicate-set"
		].includes(e.type)).length
	};
}
function Kt(e, t, n) {
	let r = zt(n), i = Wt(e.rallies, r), a = t && typeof t == "object" && "points" in t ? t.points : void 0;
	if (!i || !a) return null;
	let o = a.k1?.n, s = a.k2?.n;
	return {
		oldK1: o,
		newK1: i.k1.n,
		oldK2: s,
		newK2: i.k2.n,
		agrees: o === i.k1.n && s === i.k2.n,
		note: "La comparación es de denominadores, no sustituye los cálculos oficiales."
	};
}
// src/state/analysis-operations-runtime.ts
var qt = /* @__PURE__ */ new WeakMap();
function Jt(e) {
	let t = qt.get(e);
	if (t) return t;
	let n = 0, r = 0, i = 0, a = 0, o = 0, s = 0, c = 0, l = 0, u = 0, d = 0, f = 0, p = () => {
		try {
			let t = e.performance?.now?.();
			return Number.isFinite(t) ? t : Date.now();
		} catch {
			return Date.now();
		}
	}, m = (e, t) => {
		let m = p();
		try {
			return t();
		} catch (e) {
			throw c++, e;
		} finally {
			let t = p() - m;
			u = Number.isFinite(t) && t >= 0 ? Math.round(t * 100) / 100 : 0, n++, d += (u - d) / n, f = Math.max(f, u), u > 16 && l++, e === "filter" ? r++ : e === "evaluate" ? i++ : e === "points" ? a++ : e === "coverage" ? o++ : s++;
		}
	}, h = Object.freeze({
		VERSION: "20.5.25",
		readOnly: !0,
		filter: (e, t = {}) => m("filter", () => Ht(e, t)),
		evaluate: (e, t = "A") => m("evaluate", () => Ut(e, t)),
		points: (e, t) => m("points", () => Wt(e, t)),
		coverage: (e) => m("coverage", () => Gt(e)),
		reconcile: (e, t, n) => m("reconcile", () => Kt(e, t, n)),
		diagnostics: () => Object.freeze({
			readOnly: !0,
			operations: n,
			filters: r,
			evaluations: i,
			points: a,
			coverage: o,
			reconciliations: s,
			failures: c,
			slowOperations: l,
			lastMs: u,
			averageMs: Math.round(d * 100) / 100,
			maxMs: f,
			budgetMs: 16
		})
	});
	return qt.set(e, h), e.VC_ANALYSIS_OPERATIONS_20525 = h, h;
}
// src/state/analysis-export.ts
var Yt = (e) => String(e ?? "").trim();
function Xt(e) {
	let t = Yt(e);
	return /^[\s\u0000-\u001f]*[=+\-@]/.test(t) && !/^[-+]?\d+(?:[.,]\d+)?$/.test(t.trim()) && (t = "'" + t), "\"" + t.replace(/"/g, "\"\"") + "\"";
}
function Zt(e) {
	let t = [
		"Partido",
		"Set",
		"Rally",
		"ID rally estable",
		"Posesión",
		"Acción",
		"ID acción estable",
		"Equipo",
		"Fundamento",
		"Jugador",
		"Evaluación",
		"Zona origen",
		"Zona destino",
		"Zona contacto",
		"Destino E",
		"Tempo E",
		"Combinación",
		"Referencia vídeo"
	], n = new Map(e.rallies.map((e) => [e.key, e]));
	return "﻿" + [t, ...e.contacts.map((t) => {
		let r = n.get(t.rallyKey);
		return [
			e.matchId,
			t.set,
			t.rallyIndex,
			r?.nativeId || "",
			t.possessionKey || "",
			t.actionIndex + 1,
			t.nativeId || "",
			t.team || "",
			t.skill || t.skillRaw,
			t.player || "",
			t.evaluation || "",
			t.fields.startZone?.code || "",
			t.fields.endZone?.code || "",
			t.fields.contactZone?.code || "",
			t.fields.setTarget?.code || "",
			t.fields.tempo,
			t.fields.combo,
			t.video ? "Sí" : "No"
		];
	})].map((e) => e.map(Xt).join(";")).join("\r\n");
}
// src/state/analysis-export-runtime.ts
var Qt = /* @__PURE__ */ new WeakMap();
function $t(e) {
	let t = Qt.get(e);
	if (t) return t;
	let n = 0, r = 0, i = 0, a = 0, o = 0, s = 0, c = () => {
		try {
			let t = e.performance?.now?.();
			return Number.isFinite(t) ? t : Date.now();
		} catch {
			return Date.now();
		}
	}, l = Object.freeze({
		VERSION: "20.5.26",
		readOnly: !0,
		toCSV(e) {
			let t = c();
			try {
				return Zt(e);
			} catch (e) {
				throw r++, e;
			} finally {
				let e = c() - t;
				i = Number.isFinite(e) && e >= 0 ? Math.round(e * 100) / 100 : 0, n++, a += (i - a) / n, o = Math.max(o, i), i > 16 && s++;
			}
		},
		diagnostics: () => Object.freeze({
			readOnly: !0,
			exports: n,
			failures: r,
			lastMs: i,
			averageMs: Math.round(a * 100) / 100,
			maxMs: o,
			slowExports: s,
			budgetMs: 16
		}),
		indexDiagnostics: It
	});
	return Qt.set(e, l), e.VC_ANALYSIS_CSV_20526 = l, l;
}
// src/state/analysis-view.ts
var en = (e) => String(e ?? "").trim(), H = (e) => en(e).replace(/[&<>"']/g, (e) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
})[e]);
function tn(e) {
	let { data: t, selection: n, coverage: r, attack: i, comparison: a } = e, o = r.bySkill.map((e) => `<tr><td><b>${H(e.skill)}</b></td><td>${e.n}</td><td>${e.properties.team}/${e.n}</td><td>${e.properties.player}/${e.n}</td><td>${e.properties.evaluation}/${e.n}</td><td>${e.properties.zone}/${e.n}</td><td>${e.properties.video}/${e.n}</td></tr>`).join(""), s = n.chains.slice(-45).reverse().map((e) => `<tr><td>${H(e.setter.set)} · ${H(e.setter.rallyIndex)}</td><td>${H(e.setter.player || "—")}</td><td>${H(e.reception?.evaluation || "—")}</td><td>${H(e.target?.code || "—")}</td><td>${H(e.tempo || "—")}</td><td>${H(e.attack?.player || "Sin ataque")}</td><td>${H(e.attack?.evaluation || "—")}</td></tr>`).join("");
	return {
		left: `<div class="vc1938-audit"><h3>Professional Data Engine · Contactos</h3><p>Modelo común de solo lectura. Los contactos sin equipo o valoración se mantienen como desconocidos, sin asignaciones automáticas.</p><div class="vc1938-filters"><label>Fundamento<select data-vc1938-filter="skill"><option value="">Todos</option>${[
			"S",
			"R",
			"E",
			"A",
			"B",
			"D",
			"F",
			"C"
		].map((e) => `<option value="${e}">${e}</option>`).join("")}</select></label><label>Valoración<select data-vc1938-filter="evaluation"><option value="">Todas</option>${[
			"#",
			"+",
			"!",
			"-",
			"/",
			"="
		].map((e) => `<option>${H(e)}</option>`).join("")}</select></label><button type="button" data-vc1938-export>Exportar selección CSV</button></div><div class="vc1938-metrics"><span><strong>${n.rallies.length}</strong>rallies filtrados</span><span><strong>${n.contacts.length}</strong>contactos filtrados</span><span><strong>${n.possessions.length}</strong>posesiones</span><span><strong>${n.chains.length}</strong>colocaciones</span></div><div class="vc1938-scroll"><table><thead><tr><th>Fund.</th><th>Total</th><th>Equipo</th><th>Jugador</th><th>Eval.</th><th>Zona</th><th>Vídeo</th></tr></thead><tbody>${o}</tbody></table></div><small>Los denominadores de cobertura son los contactos de cada fundamento en todo el scouting, antes de filtros.</small></div>`,
		center: `<div class="vc1938-audit"><h3>Posesión → colocación → ataque</h3><p>Solo se emparejan contactos consecutivos del mismo equipo; un contacto rival o sin equipo separa posesiones.</p><div class="vc1938-scroll"><table><thead><tr><th>Set / rally</th><th>Colocador</th><th>Recep.</th><th>Destino</th><th>Tempo</th><th>Atacante</th><th>Eval. A</th></tr></thead><tbody>${s || "<tr><td colspan=\"7\">No hay colocaciones en esta selección.</td></tr>"}</tbody></table></div><div class="vc1938-note">Ataques evaluados: ${i.rated}/${i.recorded}; EFF ataque: ${i.efficiency == null ? "sin muestra" : i.efficiency + " %"}. ${a ? a.agrees ? "K1/K2 coincide en número de oportunidades." : "Revisar diferencias de denominadores K1/K2 con el motor anterior." : "Sin comparación disponible."}</div></div>`,
		notice: `${t.count.rallies} rallies totales · ${t.count.closed} cerrados · ${r.unknownTeams} contactos sin equipo · ${r.missingIDs} contactos sin ID · ${r.invalidValues} incidencias de integridad · ${t.issues.length} observaciones`,
		badges: [
			["Rallies", t.count.rallies],
			["Contactos", t.count.contacts],
			["Posesiones", t.count.possessions],
			["Colocaciones", t.count.chains],
			["Rallies abiertos", t.count.rallies - t.count.closed]
		]
	};
}
// src/state/analysis-view-runtime.ts
var nn = /* @__PURE__ */ new WeakMap();
function rn(e) {
	let t = nn.get(e);
	if (t) return t;
	let n = 0, r = 0, i = 0, a = 0, o = 0, s = 0, c = () => {
		let t = e.performance?.now?.();
		return Number.isFinite(t) ? t : Date.now();
	}, l = Object.freeze({
		VERSION: "20.5.29",
		readOnly: !0,
		renderDataEngine(e) {
			let t = c();
			try {
				return tn(e);
			} catch (e) {
				throw r++, e;
			} finally {
				let e = c() - t;
				a = Number.isFinite(e) && e >= 0 ? Math.round(e * 100) / 100 : 0, n++, o += (a - o) / n, s = Math.max(s, a), a > 16 && i++;
			}
		},
		diagnostics: () => Object.freeze({
			readOnly: !0,
			renders: n,
			failures: r,
			slowRenders: i,
			lastMs: a,
			averageMs: Math.round(o * 100) / 100,
			maxMs: s,
			budgetMs: 16
		})
	});
	return nn.set(e, l), e.VC_ANALYSIS_VIEW_20529 = l, l;
}
// src/state/rally-search-view.ts
var an = (e) => String(e ?? "").trim(), U = (e) => an(e).replace(/[&<>"']/g, (e) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
})[e]), on = (e, t = e) => `<option value="${U(e)}">${U(t)}</option>`, sn = {
	S: "Saque",
	R: "Recepción",
	E: "Colocación",
	A: "Ataque",
	B: "Bloqueo",
	D: "Defensa",
	F: "Freeball",
	C: "Control"
}, W = {
	skill: [["", "Todos los fundamentos"], ...Object.entries(sn)],
	evaluation: [["", "Todas las valoraciones"], ...[
		"#",
		"+",
		"!",
		"-",
		"/",
		"="
	].map((e) => [e, e])],
	ownRotation: [["", "Todas"], ...[
		1,
		2,
		3,
		4,
		5,
		6
	].map((e) => [String(e), "R" + e])],
	rivalRotation: [["", "Todas"], ...[
		1,
		2,
		3,
		4,
		5,
		6
	].map((e) => [String(e), "R" + e])],
	reception: [["", "Cualquier recepción"], ...[
		"#",
		"+",
		"!",
		"-",
		"/",
		"="
	].map((e) => [e, e])],
	outcome: [
		["", "Todos"],
		["ours", "Punto nuestro"],
		["opponent", "Punto rival"]
	],
	video: [
		["", "Todos"],
		["yes", "Con marca de vídeo"],
		["no", "Sin marca de vídeo"]
	],
	status: [
		["closed", "Solo cerrados"],
		["all", "Cerrados y abiertos"],
		["open", "Solo abiertos"]
	]
};
function cn(e) {
	let t = (e) => [...new Set(e.map(an).filter(Boolean))].sort((e, t) => e.localeCompare(t, "es", { numeric: !0 })).slice(0, 250), n = Array.isArray(e?.contacts) ? e.contacts : [], r = Array.isArray(e?.chains) ? e.chains : [];
	return {
		players: t(n.map((e) => e.player)),
		setters: t(r.map((e) => e.setter?.player)),
		attackers: t(r.map((e) => e.attack?.player)),
		tempos: t(r.map((e) => e.tempo || e.attack?.fields?.attackTempo)),
		combos: t(r.map((e) => e.combo)),
		startZones: t(n.map((e) => e.fields?.startZone?.code)),
		endZones: t(n.map((e) => e.fields?.endZone?.code))
	};
}
var G = (e, t, n) => `<label>${U(e)}<select data-vc1939-filter="${t}">${n.map(([e, t]) => on(e, t)).join("")}</select></label>`;
function ln(e, t, n = {}) {
	let r = cn(e), i = (e) => [["", "Todos"], ...e.map((e) => [e, e])], a = `<div class="vc1939-search" aria-label="Buscar rallies con filtros cruzados"><div class="vc1939-intro"><strong>RALLY SEARCH PRO</strong><small>Todos los criterios se combinan · un contacto no hereda la valoración de otro</small></div>
  <div class="vc1939-grid vc1939-basic"><label>Código / texto<input data-vc1939-filter="code" maxlength="100" placeholder="Ej.: A4#, Z4 o código de scouting"></label>
  ${G("Fundamento", "skill", W.skill)}${G("Jugador", "player", i(r.players))}${G("Valoración", "evaluation", W.evaluation)}</div>
  <details class="vc1939-advanced"><summary>Más criterios · rotaciones, colocador y secuencias</summary><div class="vc1939-grid">
  ${G("Rotación propia", "ownRotation", W.ownRotation)}${G("Rotación rival", "rivalRotation", W.rivalRotation)}
  ${G("Recepción anterior", "reception", W.reception)}${G("Colocador", "setter", i(r.setters))}
  ${G("Atacante tras colocación", "attacker", i(r.attackers))}${G("Tempo", "tempo", i(r.tempos))}
  ${G("Combinación", "combo", i(r.combos))}${G("Origen", "startZone", i(r.startZones))}
  ${G("Destino", "endZone", i(r.endZones))}${G("Ganador del rally", "outcome", W.outcome)}
  ${G("Marca temporal", "video", W.video)}${G("Estado del rally", "status", W.status)}</div></details>
  <div class="vc1939-actions"><button type="button" data-vc1939-clear>Limpiar búsqueda</button><button type="button" data-vc1939-export>Exportar CSV</button></div>
  <div class="vc1939-presets"><select data-vc1939-preset aria-label="Búsquedas guardadas"><option value="">Búsquedas guardadas</option></select><button type="button" data-vc1939-save>Guardar</button><button type="button" data-vc1939-load>Aplicar</button><button type="button" data-vc1939-delete>Eliminar</button></div>
  <p class="vc1939-context-note">Se aplican también los filtros superiores de scouting, equipo, set, rotación y K1/K2. Para búsquedas por secuencia, colocador, recepción y ataque deben pertenecer a una misma posesión.</p></div>`, o = t.statistics, s = `<div class="vc1939-metrics"><div><strong>${o.rallies}</strong><span>Rallies</span></div><div><strong>${o.contacts}</strong><span>Contactos</span></div><div><strong>${o.chains}</strong><span>Colocaciones</span></div><div><strong>${o.videoContacts}</strong><span>Marcas vídeo</span></div></div>`, c = o.bySkill.map(([e, t]) => `<tr><td>${U(sn[e] || e)}</td><td>${t}</td><td>${o.contacts ? Math.round(t / o.contacts * 1e3) / 10 : 0} %</td></tr>`).join(""), l = o.byPlayer.slice(0, 10).map(([e, t]) => `<tr><td>${U(e)}</td><td>${t}</td></tr>`).join(""), u = `<div class="vc1939-left"><h3>Buscador de rallies</h3>${a}${s}<div class="vc1939-scroll"><table><thead><tr><th>Fundamento</th><th>Contactos</th><th>Uso</th></tr></thead><tbody>${c || "<tr><td colspan=\"3\">Sin acciones con esta selección.</td></tr>"}</tbody></table></div></div>`, d = t.chains.slice(0, 50).map((e) => `<tr><td>S${e.setter?.set} · R${e.setter?.rallyIndex}</td><td>${U(e.reception?.evaluation || "—")}</td><td>${U(e.setter?.player || "—")}</td><td>${U(e.tempo || "—")}</td><td>${U(e.attack?.player || "—")}</td><td>${U(e.attack?.evaluation || "—")}</td></tr>`).join("");
	return {
		left: u,
		center: `<div class="vc1939-center-body"><h3>Resultados y secuencias</h3><p class="vc1939-summary">Ataques valorados: ${o.attackRated} · Eficiencia: ${o.efficiency == null ? "Sin muestra" : o.efficiency.toLocaleString("es-ES") + " %"} · Sin valoración: ${o.missingEvaluation} contactos.</p><div class="vc1939-scroll"><table><thead><tr><th>Jugador</th><th>Acciones</th></tr></thead><tbody>${l || "<tr><td colspan=\"2\">Sin jugadores codificados.</td></tr>"}</tbody></table></div><h4>Recepción → Colocación → Ataque</h4><div class="vc1939-scroll"><table><thead><tr><th>Set/rally</th><th>Recep.</th><th>Colocador</th><th>Tempo</th><th>Atacante</th><th>Eval. A</th></tr></thead><tbody>${d || "<tr><td colspan=\"6\">No hay secuencias completas con estos filtros.</td></tr>"}</tbody></table></div></div>`
	};
}
// src/state/rally-search-view-runtime.ts
var un = /* @__PURE__ */ new WeakMap();
function dn(e) {
	let t = un.get(e);
	if (t) return t;
	let n = 0, r = 0, i = 0, a = 0, o = 0, s = 0, c = () => {
		try {
			let t = e.performance?.now?.();
			return Number.isFinite(t) ? t : Date.now();
		} catch {
			return Date.now();
		}
	}, l = Object.freeze({
		VERSION: "20.5.30",
		readOnly: !0,
		render(e, t, l = {}) {
			let u = c();
			try {
				return ln(e, t, l);
			} catch (e) {
				throw r++, e;
			} finally {
				let e = c() - u;
				a = Number.isFinite(e) && e >= 0 ? Math.round(e * 100) / 100 : 0, n++, o += (a - o) / n, s = Math.max(s, a), a > 16 && i++;
			}
		},
		diagnostics: () => Object.freeze({
			readOnly: !0,
			renders: n,
			failures: r,
			slowRenders: i,
			lastMs: a,
			averageMs: Math.round(o * 100) / 100,
			maxMs: s,
			budgetMs: 16
		})
	});
	return un.set(e, l), e.VC_RALLY_VIEW_20530 = l, l;
}
// src/state/rally-search-controls.ts
var fn = "vc1939:search-presets:1", pn = (e) => String(e ?? "").trim();
function mn(e) {
	try {
		let t = JSON.parse(e?.getItem("vc1939:search-presets:1") || "[]");
		return Array.isArray(t) ? t.filter((e) => e && typeof e.name == "string" && e.name.length <= 40 && e.filters && typeof e.filters == "object").slice(-15).map((e) => ({
			name: e.name,
			filters: ot(e.filters)
		})) : [];
	} catch {
		return [];
	}
}
var hn = /* @__PURE__ */ new WeakMap();
function gn(e) {
	let t = hn.get(e);
	if (t) return t;
	let n = e, r = /* @__PURE__ */ new WeakSet(), i = 0, a = 0, o = 0, s = 0, c = 0, l = 0, u = 0, d = Object.freeze({
		VERSION: "20.5.31",
		nativeReadOnly: !0,
		readPresets: mn,
		bind(t, d) {
			if (!t || typeof t.addEventListener != "function" || typeof t.removeEventListener != "function" || typeof d?.refresh != "function" || typeof d?.toCSV != "function") return !1;
			if (r.has(t)) return t.dataset.vc1939Bound = "yes", !0;
			if (t.dataset.vc1939Bound) return !1;
			let f = (n) => {
				e.clearTimeout(t._vc1939Timer), t._vc1939Timer = e.setTimeout(() => {
					t._vc1939?.ctx && d.refresh();
				}, n);
			}, p = [
				["change", (e) => {
					let n = e.target;
					if (n?.matches?.("select[data-vc1939-filter]")) {
						let e = t._vc1939;
						if (!e) return;
						let r = n.dataset.vc1939Filter;
						if (!r) return;
						e.filters[r] = n.value ?? "", a++, f(0);
					}
					n?.matches?.("[data-vc1939-preset]") && t._vc1939 && (t._vc1939.preset = n.value);
				}],
				["input", (e) => {
					let n = e.target;
					if (!n?.matches?.("input[data-vc1939-filter]")) return;
					let r = t._vc1939;
					if (!r) return;
					let i = n.dataset.vc1939Filter;
					i && (r.filters[i] = n.value ?? "", a++, f(350));
				}],
				["click", (r) => {
					let i = r.target?.closest?.("button");
					if (!i) return;
					let f = t._vc1939;
					if (f?.ctx) {
						if (i.hasAttribute("data-vc1939-clear")) f.filters = { status: "closed" }, a++, d.refresh();
						else if (i.hasAttribute("data-vc1939-export")) try {
							let r = d.toCSV(f.result), i = new n.Blob([r], { type: "text/csv;charset=utf-8" }), a = n.URL.createObjectURL(i), s = t.ownerDocument.createElement("a");
							s.href = a, s.download = "volley-coach-rally-search-" + f.matchId.replace(/[^a-zA-Z0-9_-]/g, "_") + ".csv", t.ownerDocument.body.append(s), s.click(), s.remove(), e.setTimeout(() => n.URL.revokeObjectURL(a), 1e3), o++;
						} catch {
							u++;
						}
						else if (i.hasAttribute("data-vc1939-save")) {
							let t = e.prompt?.("Nombre de la búsqueda (máximo 40 caracteres)");
							if (!pn(t)) return;
							try {
								let n = e.localStorage, r = pn(t).slice(0, 40), i = mn(n).filter((e) => e.name !== r);
								i.push({
									name: r,
									filters: ot(f.filters)
								}), n?.setItem(fn, JSON.stringify(i.slice(-15))), f.preset = r, s++, d.refresh();
							} catch {
								u++;
							}
						} else if (i.hasAttribute("data-vc1939-load")) {
							let t = mn(e.localStorage).find((e) => e.name === f.preset);
							t && (f.filters = { ...t.filters }, c++, d.refresh());
						} else if (i.hasAttribute("data-vc1939-delete")) try {
							e.localStorage?.setItem(fn, JSON.stringify(mn(e.localStorage).filter((e) => e.name !== f.preset))), f.preset = "", l++, d.refresh();
						} catch {
							u++;
						}
					}
				}]
			], m = [];
			try {
				for (let [e, n] of p) t.addEventListener(e, n), m.push([e, n]);
				return t.dataset.vc1939Bound = "yes", r.add(t), i++, !0;
			} catch {
				for (let [e, n] of m) t.removeEventListener?.(e, n);
				return u++, !1;
			}
		},
		diagnostics: () => Object.freeze({
			nativeReadOnly: !0,
			bindings: i,
			filters: a,
			exports: o,
			saved: s,
			loaded: c,
			deleted: l,
			failures: u
		})
	});
	return hn.set(e, d), e.VC_RALLY_CONTROLS_20531 = d, d;
}
// src/state/scouting-speed-draft.ts
var _n = [
	"S",
	"R",
	"E",
	"A",
	"B",
	"D",
	"F",
	"C"
], vn = [
	"#",
	"+",
	"!",
	"-",
	"/",
	"="
], yn = /^(R?)(\d{1,3})([SREABDFC])?([#+!\-/=])?(.*)$/, bn = /^[.:~^@|*%&?$]/, xn = (e) => String(e ?? ""), Sn = (e) => xn(e).trim().toUpperCase().replace(/\s+/g, "");
function K(e) {
	let t = Sn(e), n = t.match(yn);
	return !n || n[5] && !bn.test(n[5]) ? null : {
		code: t,
		side: n[1],
		number: n[2],
		skill: n[3],
		rating: n[4],
		tail: n[5]
	};
}
function Cn(e) {
	let t = xn(e?.number || "").trim();
	return !/^\d{1,3}$/.test(t) || e?.team !== "ours" && e?.team !== "opponent" ? null : (e.team === "opponent" ? "R" : "") + t;
}
function wn(e, t, n) {
	if (!_n.some((e) => e === t)) return null;
	let r = Sn(e);
	if (!r) {
		let e = Cn(n);
		return e ? e + t : null;
	}
	let i = K(r);
	return i ? i.side + i.number + t + (i.rating || "") + i.tail : null;
}
function Tn(e, t) {
	if (!vn.some((e) => e === t)) return null;
	let n = K(e);
	return !n || !n.skill ? null : n.side + n.number + n.skill + t + n.tail;
}
function En(e, t = 1) {
	let n = K(e);
	if (!n || !n.skill) return null;
	let r = vn[(vn.findIndex((e) => e === n.rating) + (t > 0 ? 1 : vn.length - 1) + vn.length) % vn.length];
	return Tn(e, r);
}
function Dn(e, t = 8) {
	if (!e) return [];
	let n = [], r = (e) => {
		for (let r = (Array.isArray(e) ? e.length : 0) - 1; r >= 0 && n.length < t; r--) {
			let t = Sn(e?.[r]?.code);
			t.length <= 140 && K(t)?.skill && !n.includes(t) && n.push(t);
		}
	};
	r(e.liveRally?.actions);
	let i = Array.isArray(e.sets) ? e.sets : [];
	for (let e = i.length - 1; e >= 0 && n.length < t; e--) {
		let a = Array.isArray(i[e]?.rallies) ? i[e].rallies : [];
		for (let e = a.length - 1; e >= 0 && n.length < t; e--) r(a[e]?.actions);
	}
	return n;
}
// src/state/scouting-sequence-check.ts
var On = 512, kn = 32, An = /* @__PURE__ */ new Set([
	"S",
	"A",
	"B"
]);
function jn(e, t) {
	return An.has(e) && t === "#" || (e === "S" || e === "A") && t === "=";
}
function Mn(e, t, n, r) {
	return Object.freeze({
		status: e,
		contacts: Object.freeze(t.map((e) => Object.freeze({ ...e }))),
		issues: Object.freeze(n.map((e) => Object.freeze({ ...e }))),
		counts: Object.freeze({
			contacts: t.length,
			warnings: n.filter((e) => e.severity === "warning").length,
			errors: n.filter((e) => e.severity === "error").length
		}),
		advice: r
	});
}
function Nn(e) {
	let t = String(e ?? "").trim().toUpperCase();
	if (!t) return Mn("empty", [], [], "Escribe una secuencia para comprobar su estructura.");
	if (t.length > 512) return Mn("invalid", [], [{
		position: 0,
		severity: "error",
		reason: "Secuencia demasiado larga (máximo 512 caracteres)."
	}], "Reduce la secuencia; no se ha registrado ninguna acción.");
	let n = t.split(/\s+/);
	if (n.length > 32) return Mn("invalid", [], [{
		position: 0,
		severity: "error",
		reason: "Demasiados contactos (máximo 32)."
	}], "Divide la secuencia; no se ha registrado ninguna acción.");
	let r = [], i = [], a = (e, t) => i.push({
		position: e,
		severity: "warning",
		reason: t
	}), o = (e, t) => i.push({
		position: e,
		severity: "error",
		reason: t
	}), s = null;
	for (let [e, t] of n.entries()) {
		let n = e + 1, i = t[0], c = i === "." || i === "R" ? "opponent" : "ours", l = i === "*" ? t.slice(1) : i === "." ? "R" + t.slice(1) : t, u = K(l);
		if (!u || !u.skill) {
			o(n, `Código ${n}: falta dorsal/fundamento o el prefijo no es válido.`);
			continue;
		}
		let d = v(l), f = !!u.rating, p = d.state === "candidate" && f ? "ready" : "review", m = {
			position: n,
			team: c,
			number: u.number,
			skill: u.skill,
			rating: u.rating || null,
			nativePreview: l,
			status: p
		};
		r.push(m), d.state !== "candidate" && a(n, `Código ${n}: el sufijo necesita confirmación en el editor original.`), f || a(n, `Código ${n}: falta valoración explícita.`), s && (jn(s.skill, s.rating) && a(n, `Código ${n}: hay un contacto después de una valoración que parece cerrar el punto.`), s.team === m.team && s.number === m.number && s.skill !== "B" && a(n, `Código ${n}: posible doble contacto del mismo dorsal; revisa la jugada.`), s.skill === "S" && m.skill === "R" && s.team === m.team && a(n, `Código ${n}: el saque y la recepción se atribuyen al mismo equipo.`)), s = m;
	}
	let c = i.some((e) => e.severity === "error") ? "invalid" : i.length ? "review" : "ready";
	return Mn(c, r, i, c === "ready" ? "Estructura reconocida. Sin comprobar alineaciones, legalidad ni aceptación del registrador." : c === "review" ? "Hay avisos orientativos. Revisa los códigos antes de registrar el rally." : "Hay errores de sintaxis. Corrige la secuencia; no se ha registrado ninguna acción.");
}
// src/state/scouting-speed-draft-runtime.ts
var Pn = /* @__PURE__ */ new WeakMap();
function Fn(e) {
	let t = Pn.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.32",
		inputOnly: !0,
		parseHead: K,
		applySkill: wn,
		applyRating: Tn,
		cycleRating: En,
		recentCodes: Dn,
		inspectSequence: Nn
	});
	return Pn.set(e, n), e.VC_SCOUT_DRAFT_20532 ||= n, n;
}
// src/state/scouting-preflight.ts
var In = {
	S: "Saque",
	R: "Recepción",
	E: "Colocación",
	A: "Ataque",
	B: "Bloqueo",
	D: "Defensa",
	F: "Freeball",
	C: "Cobertura"
}, Ln = /* @__PURE__ */ new Set([
	"#",
	"+",
	"!",
	"-",
	"/",
	"="
]), Rn = /^(R?)(\d{1,3})([SREABDFC])?([#+!\-/=])?(.*)$/, zn = (e) => String(e ?? "").trim().toUpperCase().replace(/\s+/g, ""), Bn = (e) => String(e ?? "").slice(0, 180);
function Vn(e, t, n, r, i, a = !1) {
	let o = zn(e);
	if (!o) return {
		state: "idle",
		message: "Escribe un código: 7A# · 3R+ · R12S=.",
		code: o
	};
	if (o.length > 140) return {
		state: "error",
		message: "Código demasiado largo para previsualizar.",
		code: o
	};
	if (!t) return {
		state: "warning",
		message: "Abre un scouting activo.",
		code: o
	};
	if (n === "finished") return {
		state: "warning",
		message: "El scouting está finalizado. Reábrelo para editar.",
		code: o
	};
	let s = o.match(Rn);
	if (!s) return {
		state: "error",
		message: "Empieza por el dorsal (7A#) o R+dorsal rival (R7A#).",
		code: o
	};
	if (!s[3]) return {
		state: "draft",
		message: `Dorsal ${s[2]} reconocido · falta fundamento (S/R/E/A/B/D/F/C).`,
		code: o
	};
	let c = s[1] ? "Rival" : "Nuestro", l = In[s[3]], u = s[4], d = `${c} · #${s[2]} · ${l}${u ? " · " + u : ""}`;
	if (!r) return {
		state: "warning",
		message: `${d} · motor de validación no disponible.`,
		code: o
	};
	if (a) return {
		state: "warning",
		message: "No se pudo comprobar el borrador. El registro original sigue disponible.",
		code: o,
		summary: d
	};
	let f = i;
	if (!f || f.error || !f.action) return {
		state: "error",
		message: Bn(f?.error || "Código no reconocido por el motor de scouting."),
		code: o,
		summary: d
	};
	let p = f.action, m = [];
	p.startZone && m.push(`origen ${p.startZone}`), p.endZone && m.push(`destino ${p.endZone}`), p.tempo && m.push(`tempo ${p.tempo}`);
	let h = Ln.has(String(p.evaluation)) ? p.evaluation : u || "—";
	return {
		state: u ? "ok" : "caution",
		code: o,
		summary: `${c} · #${s[2]} · ${l} · ${h}`,
		message: u ? "Código aceptado por el motor. Pulsa Enter o Añadir para registrarlo." : "El motor acepta el código, pero falta una valoración explícita. Comprueba el resultado antes de añadir.",
		extras: m,
		playerKnown: !!p.playerId || !!p.playerLabel || !!p.playerNumberSnapshot,
		nativeShape: Object.freeze({
			team: p.team,
			skill: p.skill,
			evaluation: p.evaluation,
			playerNumberSnapshot: p.playerNumberSnapshot ?? "",
			startZone: p.startZone || "",
			endZone: p.endZone || ""
		})
	};
}
// src/state/scouting-preflight-runtime.ts
var Hn = /* @__PURE__ */ new WeakMap();
function Un(e) {
	let t = Hn.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.34",
		previewOnly: !0,
		classify: Vn
	});
	return Hn.set(e, n), e.VC_SCOUT_PREFLIGHT_20534 ||= n, n;
}
// src/domain/scout-registration-guard.ts
function Wn(e) {
	return e.hasCode ? !e.hasMatch || e.matchFinished ? "No hay un scouting activo." : !e.hasSet || e.setFinished ? "El set está cerrado." : null : "Código vacío.";
}
// src/domain/scout-registration-guard-runtime.ts
var Gn = /* @__PURE__ */ new WeakMap();
function Kn(e) {
	let t = Gn.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.35",
		preconditionsOnly: !0,
		inspect: Wn
	});
	return Gn.set(e, n), e.VC_SCOUT_REG_GUARD_20535 ||= n, n;
}
// src/domain/scout-action-preparation.ts
var qn = () => ({
	parserReturnedAction: !1,
	parserReturnedError: !1,
	propertyCount: 0,
	hasTeam: !1,
	hasSkill: !1,
	hasEvaluation: !1,
	hasPlayer: !1,
	hasZones: !1,
	hasTacticalMetadata: !1,
	hasVideoEvidence: !1
}), Jn = (e) => e && typeof e == "object" ? e : null;
function Yn(e) {
	try {
		let t = Jn(e), n = Jn(t?.action);
		if (!n) return Object.freeze({
			...qn(),
			parserReturnedError: !!t?.error
		});
		let r = (e) => e != null && e !== "";
		return Object.freeze({
			parserReturnedAction: !0,
			parserReturnedError: !!t?.error,
			propertyCount: Object.keys(n).length,
			hasTeam: r(n.team),
			hasSkill: r(n.skill),
			hasEvaluation: r(n.evaluation),
			hasPlayer: r(n.playerId) || r(n.playerNumberSnapshot) || r(n.playerLabel),
			hasZones: r(n.startZone) || r(n.endZone) || r(n.contactZone) || r(n.endCone),
			hasTacticalMetadata: [
				"serveType",
				"phase",
				"setTarget",
				"attackCombo",
				"attackDirection",
				"attackTempo",
				"blockers",
				"setterCall",
				"attackCode",
				"dvSetType",
				"skillSubtype"
			].some((e) => r(n[e])),
			hasVideoEvidence: [
				"scoutMs",
				"videoTime",
				"videoExactTime",
				"videoSourceKey",
				"videoSource",
				"videoExactSourceKey",
				"clipId"
			].some((e) => r(n[e]))
		});
	} catch {
		return Object.freeze(qn());
	}
}
function Xn(e, t, n) {
	let r = n(e, t, null);
	return Object.freeze({
		mode: "native-once",
		nativeResult: r,
		facts: Yn(r)
	});
}
// src/domain/scout-action-preparation-runtime.ts
var Zn = /* @__PURE__ */ new WeakMap();
function Qn(e) {
	let t = Zn.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.36",
		nativeOnly: !0,
		prepare: Xn,
		inspect: Yn
	});
	return Zn.set(e, n), e.VC_SCOUT_PREPARE_20536 ||= n, n;
}
// src/domain/scout-code-lexer.ts
var $n = /^(R)?(\d+)(S|R|E|A|B|D|F|C)([#\+!\-\/=])?(?:\.([1-9])(?:>([1-9]))?)?(.*)$/, er = /~(JF|JP|F|U)/, tr = /:(Z4|Z2|Z1|Z6|1T|31|BACK|PIPE|2T|OTR)/, nr = /\^(K1|K2|FB|TR)/, rr = /@([0-3])/;
function ir(e) {
	let t = String(e || "").trim().toUpperCase().replace(/\s+/g, "").match($n);
	if (!t) return {
		kind: "error",
		error: "Código no reconocido."
	};
	let n = t[7] || "", r = n.match(er)?.[1] || "";
	n = n.replace(er, "");
	let i = n.match(tr)?.[1] || "";
	n = n.replace(tr, "");
	let a = n.match(nr)?.[1] || "";
	n = n.replace(nr, "");
	let o = n.match(rr)?.[1] || "";
	return n = n.replace(rr, ""), n ? {
		kind: "error",
		error: "Parte avanzada no reconocida: " + n
	} : {
		kind: "code",
		rival: !!t[1],
		number: t[2],
		skill: t[3],
		evaluation: t[4] || "!",
		startZone: t[5] || "",
		endZone: t[6] || "",
		serveType: r,
		combo: i,
		phase: a,
		blockers: o
	};
}
// src/domain/scout-code-lexer-runtime.ts
var ar = /* @__PURE__ */ new WeakMap();
function or(e) {
	let t = ar.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.37",
		syntaxOnly: !0,
		lex: ir
	});
	return ar.set(e, n), e.VC_SCOUT_LEXER_20537 ||= n, n;
}
// src/domain/scout-grammar-extensions.ts
var sr = (e) => String(e || "").trim().toUpperCase().replace(/\s+/g, ""), cr = /^((?:R)?\d+(?:S|R|E|A|B|D|F|C)(?:[#\+!\-\/=])?)\.([1-9])([A-D]?)(?:>([1-9])([A-D]?))?(.*)$/, lr = /^((?:R)?\d+A[#\+!\-\/=]?)\.([1-9][A-D]?)>C([1-8])(.*)$/, ur = [
	"Z4",
	"Z2",
	"Z1",
	"Z6",
	"1T",
	"31",
	"BACK",
	"PIPE",
	"2T",
	"OTR"
];
function dr(e) {
	let t = sr(e).match(cr);
	if (!t || !t[3] && !t[5]) return { kind: "pass" };
	let n = t[1], r = t[2], i = t[3] || "", a = t[4] || "", o = t[5] || "", s = t[6] || "";
	return {
		kind: "subzone",
		cleaned: n + "." + r + (a ? ">" + a : "") + s,
		startZone: r + i,
		endZone: a ? a + o : ""
	};
}
function fr(e) {
	let t = sr(e).match(lr);
	return t ? {
		kind: "cone",
		cleaned: t[1] + t[4],
		startZone: t[2],
		endCone: Number(t[3])
	} : { kind: "pass" };
}
function pr(e) {
	let t = sr(e), n = t.match(/^(?:R)?\d+(S|R|E|A|B|D|F|C)/)?.[1] || "", r = t, i = r.match(/::([A-Z0-9]{1,6})/)?.[1] || "";
	if (r = r.replace(/::[A-Z0-9]{1,6}/, ""), !i && (n === "A" || n === "E")) {
		let e = r.match(/:([A-Z0-9]{1,6})/)?.[1] || "";
		e && !ur.includes(e) && (i = e, r = r.replace(":" + e, ""));
	}
	let a = "";
	(n === "A" || n === "E") && (a = r.match(/~([QUTMHO])/)?.[1] || "", a && (r = r.replace(/~[QUTMHO]/, "")));
	let o = r.match(/%([A-Z0-9]{1,8})/)?.[1] || "";
	o && (r = r.replace(/%[A-Z0-9]{1,8}/, ""));
	let s = r.match(/\|([FCBPS])/)?.[1] || "";
	s && (r = r.replace(/\|[FCBPS]/, ""));
	let c = r.match(/\?([A-Z0-9]{1,10})/)?.[1] || "";
	c && (r = r.replace(/\?[A-Z0-9]{1,10}/, ""));
	let l = r.match(/\$([A-Z0-9]{1,5})/)?.[1] || "";
	return l && (r = r.replace(/\$[A-Z0-9]{1,5}/, "")), {
		kind: "advanced",
		cleaned: r,
		skill: n,
		dvCode: i,
		tempo: a,
		subtype: o,
		setType: s,
		special: c,
		custom: l
	};
}
// src/domain/scout-grammar-extensions-runtime.ts
var mr = /* @__PURE__ */ new WeakMap();
function hr(e) {
	let t = mr.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.38",
		grammarOnly: !0,
		subzone: dr,
		advanced: pr,
		cone: fr
	});
	return mr.set(e, n), e.VC_SCOUT_EXTENSIONS_20538 ||= n, n;
}
// src/domain/scout-player-resolution.ts
function gr(e, t, n) {
	if (t) return {
		found: !0,
		fromPreviousAction: !1,
		player: t
	};
	if (n && typeof n == "object") {
		let t = n;
		if (String(t.playerNumberSnapshot) === String(e)) return {
			found: !0,
			fromPreviousAction: !0,
			player: {
				id: t.playerId,
				name: t.playerNameSnapshot,
				number: e
			}
		};
	}
	return {
		found: !1,
		fromPreviousAction: !1,
		player: null
	};
}
// src/domain/scout-player-resolution-runtime.ts
var _r = /* @__PURE__ */ new WeakMap();
function vr(e) {
	let t = _r.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.40",
		pureOnly: !0,
		resolveOwn: gr
	});
	return _r.set(e, n), e.VC_SCOUT_PLAYER_RESOLVER_20540 ||= n, n;
}
// src/domain/scout-action-builder.ts
function yr(e, t) {
	return {
		...e || {},
		team: t.rival ? "opponent" : "ours",
		skill: t.skill,
		evaluation: t.evaluation,
		...t.zones,
		serveType: t.serve,
		phase: t.phase,
		setTarget: t.skill === "E" ? t.combo : "",
		attackCombo: t.skill === "A" ? t.combo : "",
		blockers: t.skill === "A" ? t.blockers : "",
		validationWarnings: []
	};
}
function br(e, t, n) {
	let r = e;
	return {
		playerId: r.id,
		playerLabel: "",
		playerNameSnapshot: r.name || t || "",
		playerNumberSnapshot: r.number ?? n
	};
}
function xr(e, t, n) {
	return {
		playerId: null,
		playerLabel: e,
		playerNumberSnapshot: n,
		playerNameSnapshot: t || String(e || "").replace(/^#?\d+\s*[·-]?\s*/, "")
	};
}
// src/domain/scout-action-builder-runtime.ts
var Sr = /* @__PURE__ */ new WeakMap();
function Cr(e) {
	let t = Sr.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.41",
		pureOnly: !0,
		buildBase: yr,
		ownFields: br,
		opponentFields: xr
	});
	return Sr.set(e, n), e.VC_SCOUT_ACTION_BUILDER_20541 ||= n, n;
}
// src/domain/scout-code-format.ts
function wr(e, t) {
	let n = e || {}, r = t || {}, i = r.skill === "R" || r.skill === "D", a = String(n.contactZone || i && (r.endZone || r.startZone) || ""), o = String(n.sourceZone || (i && r.startZone && r.endZone ? r.startZone : "") || ""), s = i && !!a && !r.endZone && !r.startZone;
	return {
		contactZone: a,
		sourceZone: o,
		zoneInferred: !!n.zoneInferred,
		sourceActionId: n.sourceActionId == null ? null : Number(n.sourceActionId),
		migratedEndZone: s ? a : null
	};
}
function Tr(e, t) {
	let n = e, r = "";
	if (n.team === "opponent") r = "R" + (String(n.playerLabel || "").match(/\d+/)?.[0] || String(n.playerNumberSnapshot || "").match(/\d+/)?.[0] || String(n.playerLabel || "").replace(/\s+/g, "").slice(0, 4) || "?");
	else {
		let e = t;
		r = e?.number !== "" && e?.number != null ? String(e.number) : n.playerNumberSnapshot !== "" && n.playerNumberSnapshot != null ? String(n.playerNumberSnapshot) : "P";
	}
	if (r += String(n.skill) + (n.evaluation || "!"), n.startZone && n.endZone) r += `.${n.startZone}>${n.endZone}`;
	else if (n.skill === "R" || n.skill === "D") {
		let e = String(n.contactZone || n.endZone || n.startZone || "");
		e && (r += `.${e}`);
	}
	let i = n.skill === "R" ? n.receivedServeType : n.serveType;
	i && (r += `~${i}`);
	let a = n.setTarget || n.attackCombo;
	return a && (r += `:${a}`), n.skill === "A" && n.attackDirection && (r += `*${n.attackDirection}`), n.phase && (r += `^${n.phase}`), n.blockers !== "" && n.blockers != null && (r += `@${n.blockers}`), r;
}
// src/domain/scout-code-format-runtime.ts
var Er = /* @__PURE__ */ new WeakMap();
function Dr(e) {
	let t = Er.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.42",
		pureOnly: !0,
		contact: wr,
		buildCode: Tr
	});
	return Er.set(e, n), e.VC_SCOUT_CODE_FORMAT_20542 ||= n, n;
}
// src/domain/scout-code-builder.ts
var Or = {
	Q: "Quick",
	U: "Super",
	T: "Fast",
	M: "Medium",
	H: "High",
	O: "Other"
}, kr = {
	F: "Front",
	C: "Centre",
	B: "Back",
	P: "Pipe",
	S: "Setter dump"
};
function Ar(e, t = 10) {
	return String(e || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, t);
}
function jr(e) {
	let t = e;
	if (t?.skill !== "B") return t;
	let n = String(t.startZone || t.contactZone || "");
	return {
		...t,
		startZone: n,
		endZone: n || ""
	};
}
function Mr(e, t) {
	let n = t, r = e;
	if (n?.skill === "B") {
		let e = String(n.startZone || n.contactZone || "");
		e && (r = r.replace(`.${e}>${e}`, `.${e}`)), n.blockTargetNumber && (r += `&${String(n.blockTargetNumber).replace(/\D/g, "").slice(0, 3)}`);
	}
	let i = n?.skill === "A" ? n.attackCode : n?.skill === "E" ? n.setterCall : "", a = n?.skill === "A" ? n.attackTempo : n?.skill === "E" ? n.setTempo : "";
	if (i && (r += `::${Ar(i, 6)}`), a && Or[a] && (r += `~${a}`), n?.skillSubtype && (r += `%${Ar(n.skillSubtype, 8)}`), n?.dvSetType && kr[n.dvSetType] && (r += `|${n.dvSetType}`), n?.specialCode && (r += `?${Ar(n.specialCode, 10)}`), n?.customCode && (r += `$${Ar(n.customCode, 5)}`), n?.skill === "A" && n?.endCone && n?.startZone) {
		let e = `.${n.startZone}>C${n.endCone}`;
		r.includes(">C" + n.endCone) || (r = r.replace(/^((?:R)?(?:\d+|P)(?:S|R|E|A|B|D|F|C)[#\+!\-\/=])/, `$1${e}`));
	}
	return r;
}
// src/domain/scout-code-builder-runtime.ts
var Nr = /* @__PURE__ */ new WeakMap();
function Pr(e) {
	let t = Nr.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.43",
		pureOnly: !0,
		prepare: jr,
		finish: Mr
	});
	return Nr.set(e, n), e.VC_SCOUT_CODE_BUILDER_20543 ||= n, n;
}
// src/domain/scout-action-registration.ts
function Fr(e) {
	let t = e, n = String(t.startZone || ""), r = String(t.endZone || t.contactZone || ""), i;
	if (n && r) i = {
		startZone: n,
		endZone: r,
		contactZone: r,
		sourceZone: n,
		zoneInferred: !1
	};
	else {
		let e = r || n;
		i = {
			startZone: "",
			endZone: e,
			contactZone: e,
			sourceZone: "",
			zoneInferred: !1
		};
	}
	return {
		...i,
		contactZone: t.contactZone || i.contactZone,
		sourceZone: t.sourceZone || i.sourceZone
	};
}
// src/domain/scout-action-registration-runtime.ts
var Ir = /* @__PURE__ */ new WeakMap();
function Lr(e) {
	let t = Ir.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.44",
		pureOnly: !0,
		prepareContact: Fr
	});
	return Ir.set(e, n), e.VC_SCOUT_REGISTRATION_20544 ||= n, n;
}
// src/domain/scout-action-metadata.ts
function Rr(e) {
	return String(e || "").match(/[1-9]/)?.[0] || "";
}
function zr(e) {
	return String(e || "").toUpperCase().match(/[A-D]/)?.[0] || "";
}
function Br(e, t) {
	let n = e, r = t, i = n?.skill || "", a = String(n?.startZone || ""), o = String(n?.endZone || ""), s = String(n?.contactZone || (i === "R" || i === "D" ? o || a : "") || ""), c = Rr(n?.dvStartZone || a), l = Rr(n?.dvEndZone || o), u = zr(n?.dvEndSubzone || o), d = n?.dvSourceActionId == null ? null : Number(n.dvSourceActionId);
	if (i === "R" || i === "D") {
		let e = i === "R" ? "S" : "A", t = n?.team === "ours" ? "opponent" : "ours", a = [...Array.isArray(r?.liveRally?.actions) ? r.liveRally.actions : []].reverse().find((n) => n.team === t && n.skill === e);
		a && (c = Rr(a.startZone), l = Rr(a.endZone), u = zr(a.endZone), d = Number(a.id) || null);
	}
	let f = r?.servingTeam === "opponent" ? "opponent" : "ours", p = n?.team === f ? "Breakpoint" : "Sideout", m = i === "S" ? "Serve" : n?.phase === "K1" ? "Reception" : "Transition", h = "";
	return i === "A" && (h = n?.phase === "K1" ? "Reception" : p === "Breakpoint" ? "Transition breakpoint" : "Transition sideout"), {
		contactZone: s,
		dvStartZone: c,
		dvEndZone: n?.endCone ? "" : l,
		dvEndSubzone: n?.endCone ? "" : u,
		dvEndCone: n?.endCone ? Number(n.endCone) : null,
		dvSourceActionId: d,
		dvPointPhase: p,
		dvPhase: m,
		dvAttackPhase: h
	};
}
function Vr(e) {
	let t = e;
	for (let e of [
		"videoTimestamp",
		"liveVideoTime",
		"videoAction",
		"videoTime"
	]) {
		let n = t?.[e];
		if (n == null || n === "") continue;
		let r = Number(n);
		if (Number.isFinite(r) && r >= 0) return r;
	}
	return null;
}
function Hr(e, t) {
	let n = e || {}, r = t, i = [
		n.videoTimestamp,
		n.liveVideoTime,
		r.videoAction,
		n.videoAction,
		r.videoTime,
		n.videoTime
	].filter((e) => e != null && e !== "").map(Number).find(Number.isFinite);
	return Number.isFinite(i) ? Math.max(0, i) : null;
}
// src/domain/scout-action-metadata-runtime.ts
var Ur = /* @__PURE__ */ new WeakMap();
function Wr(e) {
	let t = Ur.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.45",
		pureOnly: !0,
		dvFields: Br,
		actionTime: Vr,
		normalizeTime: Hr
	});
	return Ur.set(e, n), e.VC_SCOUT_ACTION_METADATA_20545 ||= n, n;
}
// src/domain/scout-action-normalizer.ts
var Gr = {
	S: "Saque",
	R: "Recepción",
	E: "Colocación",
	A: "Ataque",
	B: "Bloqueo",
	D: "Defensa",
	F: "Freeball",
	C: "Cobertura"
}, Kr = [
	"#",
	"+",
	"!",
	"-",
	"/",
	"="
], qr = [
	"F",
	"JF",
	"JP",
	"U"
], Jr = [
	"K1",
	"K2",
	"FB",
	"TR"
], Yr = [
	"Z4",
	"Z2",
	"Z1",
	"Z6",
	"1T",
	"31",
	"BACK",
	"PIPE",
	"2T",
	"OTR"
];
function Xr(e, t, n) {
	let r = e || {};
	return {
		...e && typeof e == "object" && !Array.isArray(e) ? e : {},
		id: t,
		seq: Number(r?.seq) || 1,
		team: r?.team === "opponent" ? "opponent" : "ours",
		playerId: r?.playerId != null && r?.playerId !== "" ? Number(r.playerId) : null,
		playerLabel: String(r?.playerLabel || ""),
		playerNameSnapshot: String(r?.playerNameSnapshot || ""),
		playerNumberSnapshot: r?.playerNumberSnapshot ?? "",
		skill: Gr[r?.skill] ? r.skill : "S",
		evaluation: Kr.includes(r?.evaluation) ? r.evaluation : "!",
		startZone: String(r?.startZone || ""),
		endZone: String(r?.endZone || ""),
		serveType: qr.includes(r?.serveType) ? r.serveType : "",
		phase: Jr.includes(r?.phase) ? r.phase : "",
		setTarget: Yr.includes(r?.setTarget) ? r.setTarget : "",
		attackCombo: Yr.includes(r?.attackCombo) ? r.attackCombo : "",
		attackTempo: [
			"RAP",
			"MED",
			"ALT"
		].includes(r?.attackTempo) ? r.attackTempo : "",
		blockers: [
			"0",
			"1",
			"2",
			"3"
		].includes(String(r?.blockers)) ? String(r.blockers) : "",
		code: String(r?.code || ""),
		validationWarnings: (Array.isArray(r?.validationWarnings) ? r.validationWarnings : []).map(String).slice(0, 8),
		createdAt: n,
		scoutMs: Math.max(0, Number(r?.scoutMs) || 0),
		videoTime: r?.videoTime == null ? null : Number(r.videoTime),
		videoSource: String(r?.videoSource || "")
	};
}
// src/domain/scout-action-normalizer-runtime.ts
var Zr = /* @__PURE__ */ new WeakMap();
function Qr(e) {
	let t = Zr.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.46",
		pureOnly: !0,
		normalizeBase: Xr
	});
	return Zr.set(e, n), e.VC_SCOUT_ACTION_NORMALIZER_20546 ||= n, n;
}
// src/domain/scout-action-tactical-fields.ts
function $r(e, t) {
	let n = e || {}, r = t, i = [
		"LIN",
		"DC",
		"DL"
	].includes(String(n?.attackDirection || "")) ? String(n.attackDirection) : "", a = [
		"F",
		"JF",
		"JP",
		"U"
	].includes(String(n?.receivedServeType || "")) ? String(n.receivedServeType) : "";
	r.skill === "R" && !a && [
		"F",
		"JF",
		"JP",
		"U"
	].includes(String(n?.serveType || "")) && (a = String(n.serveType));
	let o = r.skill === "R" ? "" : r.serveType, s = String(n?.blockTargetNumber || "").replace(/\D/g, "").slice(0, 3), c = String(n?.blockTargetLabel || "");
	return r.skill !== "B" && (s = "", c = ""), {
		attackDirection: i,
		receivedServeType: a,
		serveType: o,
		blockTargetNumber: s,
		blockTargetLabel: c
	};
}
// src/domain/scout-action-tactical-fields-runtime.ts
var ei = /* @__PURE__ */ new WeakMap();
function ti(e) {
	let t = ei.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.47",
		pureOnly: !0,
		normalize: $r
	});
	return ei.set(e, n), e.VC_SCOUT_TACTICAL_FIELDS_20547 ||= n, n;
}
// src/domain/scout-action-advanced-fields.ts
var ni = {
	Q: "Quick",
	U: "Super",
	T: "Fast",
	M: "Medium",
	H: "High",
	O: "Other"
}, ri = {
	F: "Front",
	C: "Centre",
	B: "Back",
	P: "Pipe",
	S: "Setter dump"
}, ii = {
	A: {
		HSP: "Hard spike",
		SSP: "Soft spike/topspin",
		TIP: "Tip"
	},
	E: {
		"1H": "1 hand set",
		"2H": "2 hands set",
		BUMP: "Bump set",
		UND: "Underhand set",
		OTH: "Other set"
	},
	R: {
		L: "On left",
		R: "On right",
		LOW: "Low",
		OH: "Overhand",
		MID: "Middle line"
	},
	B: {
		AST: "Block assist",
		ATT: "Block attempt",
		SOFT: "Block on soft spike"
	},
	D: {
		COV: "Spike cover",
		AB: "After block",
		EMG: "Emergency",
		TIP: "Tip",
		SOFT: "Soft spike"
	}
}, ai = {
	RAP: "T",
	MED: "M",
	ALT: "H"
}, oi = (e, t = 10) => String(e || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, t), si = (e) => e && Number.isFinite(Number(e.x)) && Number.isFinite(Number(e.y)) ? {
	x: Number(e.x),
	y: Number(e.y)
} : null;
function ci(e, t) {
	let n = e, r = t, i = oi(n?.attackTempo || n?.setTempo || r.attackTempo || "", 3), a = ni[i] ? i : ai[i] || "", o = r.skill === "A" ? a : "", s = r.skill === "E" ? a : "", c = r.skill === "A" ? oi(n?.attackCode || "", 6) : "", l = r.skill === "E" ? oi(n?.setterCall || "", 6) : "", u = (r.skill === "A" || r.skill === "E") && ri[String(n?.dvSetType || "").toUpperCase()] ? String(n?.dvSetType).toUpperCase() : "", d = oi(n?.skillSubtype || "", 8);
	return {
		attackTempo: o,
		setTempo: s,
		attackCode: c,
		setterCall: l,
		dvSetType: u,
		skillSubtype: ii[r.skill]?.[d] ? d : "",
		specialCode: oi(n?.specialCode || "", 10),
		customCode: oi(n?.customCode || "", 5),
		locationMode: n?.locationMode === "cones" ? "cones" : "zones",
		endCone: n?.endCone != null && /^[1-8]$/.test(String(n.endCone)) ? Number(n.endCone) : null,
		startCoordinate: si(n?.startCoordinate),
		endCoordinate: si(n?.endCoordinate),
		contactCoordinate: si(n?.contactCoordinate),
		contactZone: String(n?.contactZone || r.contactZone || ""),
		dvStartZone: String(n?.dvStartZone || ""),
		dvEndZone: String(n?.dvEndZone || ""),
		dvEndSubzone: String(n?.dvEndSubzone || ""),
		dvEndCone: n?.dvEndCone != null && Number.isFinite(Number(n.dvEndCone)) ? Number(n.dvEndCone) : null,
		dvSourceActionId: n?.dvSourceActionId == null ? null : Number(n.dvSourceActionId),
		dvPointPhase: String(n?.dvPointPhase || ""),
		dvPhase: String(n?.dvPhase || ""),
		dvAttackPhase: String(n?.dvAttackPhase || "")
	};
}
// src/domain/scout-action-advanced-fields-runtime.ts
var li = /* @__PURE__ */ new WeakMap();
function ui(e) {
	let t = li.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.48",
		pureOnly: !0,
		normalize: ci
	});
	return li.set(e, n), e.VC_SCOUT_ADVANCED_FIELDS_20548 ||= n, n;
}
// src/domain/scout-action-identity-fields.ts
function di(e, t, n) {
	let r = e, i = t, a = {
		uid: String(r?.uid || `act_${i.id}`),
		videoStart: r?.videoStart == null ? null : Number(r.videoStart),
		videoAction: r?.videoAction == null ? null : Number(r.videoAction),
		videoEnd: r?.videoEnd == null ? null : Number(r.videoEnd),
		clipId: String(r?.clipId || "")
	};
	return n && (a.opponentPlayerUid = String(r?.opponentPlayerUid || "")), a;
}
// src/domain/scout-action-identity-fields-runtime.ts
var fi = /* @__PURE__ */ new WeakMap();
function pi(e) {
	let t = fi.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.49",
		pureOnly: !0,
		normalize: di
	});
	return fi.set(e, n), e.VC_SCOUT_IDENTITY_FIELDS_20549 ||= n, n;
}
// src/domain/scout-match-video-container.ts
function mi(e) {
	let t = e?.video;
	return {
		syncOffset: t?.syncOffset == null ? null : Number(t.syncOffset),
		source: String(t?.source || ""),
		clips: Array.isArray(t?.clips) ? t.clips : []
	};
}
// src/domain/scout-match-video-container-runtime.ts
var hi = /* @__PURE__ */ new WeakMap();
function gi(e) {
	let t = hi.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.50",
		pureOnly: !0,
		normalize: mi
	});
	return hi.set(e, n), e.VC_SCOUT_MATCH_VIDEO_20550 ||= n, n;
}
// src/domain/scout-match-video-overlay.ts
function _i(e, t) {
	let n = e, r = t, i = n?.video && typeof n.video == "object" ? n.video : {}, a = r?.video, o = i.clips || a?.clips;
	return {
		syncOffset: i.syncOffset == null ? a?.syncOffset ?? null : Number(i.syncOffset),
		source: String(i.source || a?.source || ""),
		fileSize: Math.max(0, Number(i.fileSize) || 0),
		lastModified: Math.max(0, Number(i.lastModified) || 0),
		mimeType: String(i.mimeType || ""),
		duration: i.duration == null ? null : Number(i.duration),
		syncedAt: i.syncedAt ? String(i.syncedAt) : null,
		anchor: i.anchor && typeof i.anchor == "object" ? i.anchor : null,
		preRoll: Math.max(0, Number(i.preRoll ?? 2)),
		postRoll: Math.max(0, Number(i.postRoll ?? 2)),
		clips: Array.isArray(o) ? o : []
	};
}
// src/domain/scout-match-video-overlay-runtime.ts
var vi = /* @__PURE__ */ new WeakMap();
function yi(e) {
	let t = vi.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.51",
		pureOnly: !0,
		normalize: _i
	});
	return vi.set(e, n), e.VC_SCOUT_VIDEO_OVERLAY_20551 ||= n, n;
}
// src/domain/scout-match-manual-result.ts
var bi = (e) => Array.isArray(e) ? e : [];
function xi(e, t) {
	let n = e, r = t, i = bi(n?.sets);
	return {
		sets: bi(r?.sets).map((e, t) => {
			let n = i.find((t) => Number(t?.number) === Number(e.number)) || i[t] || {};
			return {
				manualFinished: !!n?.manualFinished,
				manualFinishedAt: n?.manualFinishedAt ? String(n.manualFinishedAt) : null,
				manualScorePrevious: n?.manualScorePrevious && typeof n.manualScorePrevious == "object" ? {
					us: Number(n.manualScorePrevious.us) || 0,
					opponent: Number(n.manualScorePrevious.opponent) || 0
				} : null
			};
		}),
		manualFinalResult: n?.manualFinalResult && typeof n.manualFinalResult == "object" ? {
			active: !!n.manualFinalResult.active,
			us: Math.max(0, Number(n.manualFinalResult.us) || 0),
			opponent: Math.max(0, Number(n.manualFinalResult.opponent) || 0),
			savedAt: n.manualFinalResult.savedAt ? String(n.manualFinalResult.savedAt) : null,
			finalizedAt: n.manualFinalResult.finalizedAt ? String(n.manualFinalResult.finalizedAt) : null,
			clearedAt: n.manualFinalResult.clearedAt ? String(n.manualFinalResult.clearedAt) : null
		} : null
	};
}
// src/domain/scout-match-manual-result-runtime.ts
var Si = /* @__PURE__ */ new WeakMap();
function Ci(e) {
	let t = Si.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.52",
		pureOnly: !0,
		normalize: xi
	});
	return Si.set(e, n), e.VC_SCOUT_MANUAL_RESULT_20552 ||= n, n;
}
// src/domain/scout-rally-video-bounds.ts
function wi(e) {
	let t = e;
	return {
		videoStart: t?.videoStart == null ? null : Number(t.videoStart),
		videoEnd: t?.videoEnd == null ? null : Number(t.videoEnd)
	};
}
// src/domain/scout-rally-video-bounds-runtime.ts
var Ti = /* @__PURE__ */ new WeakMap();
function Ei(e) {
	let t = Ti.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.53",
		pureOnly: !0,
		normalize: wi
	});
	return Ti.set(e, n), e.VC_SCOUT_RALLY_VIDEO_20553 ||= n, n;
}
// src/domain/scout-match-finalization-fields.ts
function Di(e) {
	let t = e;
	return {
		manualSavedAt: t?.manualSavedAt ? String(t.manualSavedAt) : null,
		reopenedAt: t?.reopenedAt ? String(t.reopenedAt) : null,
		finalizedByUser: !!t?.finalizedByUser,
		resultComplete: !!t?.resultComplete,
		resultCompleteAt: t?.resultCompleteAt ? String(t.resultCompleteAt) : null
	};
}
// src/domain/scout-match-finalization-runtime.ts
var Oi = /* @__PURE__ */ new WeakMap();
function ki(e) {
	let t = Oi.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.54",
		pureOnly: !0,
		normalize: Di
	});
	return Oi.set(e, n), e.VC_SCOUT_MATCH_FINALIZATION_20554 ||= n, n;
}
// src/domain/rally-shadow.ts
var Ai = 40, ji = [
	"p1",
	"p2",
	"p3",
	"p4",
	"p5",
	"p6"
], Mi = [
	"liveVideoSessionId",
	"liveVideoStart",
	"liveVideoEnd",
	"liveVideoLinkedAt"
], Ni = (e, t) => e.us === t.us && e.opponent === t.opponent, Pi = (e, t, n = !1) => Object.freeze({
	operation: e,
	verdict: t.length ? "difference" : n ? "unverified" : "agree",
	areas: Object.freeze(t.length ? [...t] : n ? ["missing-data"] : [])
}), Fi = (n) => t(n.sets).map(e).find((e) => e && Number(e.number) === Number(n.currentSet) && Number.isInteger(Number(n.currentSet))) || null, Ii = (t) => {
	let n = e(t), r = e(n?.ours), i = e(n?.opponent);
	return !!r && !!i && ji.every((e) => Object.hasOwn(r, e) && Object.hasOwn(i, e));
}, Li = (t, n) => {
	let r = e(t), i = e(n), a = e(r?.ours), o = e(i?.ours), s = e(r?.opponent), c = e(i?.opponent);
	return !!a && !!o && !!s && !!c && ji.every((e) => Object.is(a[e], o[e]) && Object.is(s[e], c[e]));
};
function Ri(o, s, l) {
	let u = e(o), d = e(s), f = e(l), p = [];
	if (!u || !d || !f) return Pi("point", p, !0);
	let m = a(f);
	if (!m.before || !m.after || !n(f.winner) || !n(f.servingBefore) || !r(f.rotationBefore) || !r(f.opponentRotationBefore)) return Pi("point", p, !0);
	let h = c({
		score: m.before,
		serving: f.servingBefore,
		rotationUs: f.rotationBefore,
		rotationOpponent: f.opponentRotationBefore
	}, f.winner);
	if (h.state !== "projected" || !h.score) return Pi("point", p, !0);
	m.state !== "inconsistent" && Ni(h.score, m.after) || p.push("score");
	let g = i({
		us: d.scoreUs,
		opponent: d.scoreOpponent
	}), _ = !g;
	g && !Ni(g, m.after) && !p.includes("score") && p.push("score");
	let v = e(u.liveRally);
	v && t(v.actions).length === 0 && !e(v.startSnapshot) && (n(u.servingTeam) && u.servingTeam !== h.serving ? p.push("service") : n(u.servingTeam) || (_ = !0), r(u.rotationNo) && r(u.opponentRotationNo) ? (u.rotationNo !== h.rotationUs || u.opponentRotationNo !== h.rotationOpponent) && p.push("rotation") : _ = !0);
	let y = N(u, m.after);
	y.state === "projected" ? (typeof d.finished == "boolean" && d.finished !== y.setFinished ? p.push("set") : typeof d.finished != "boolean" && (_ = !0), y.setFinished && n(d.winner) && d.winner !== y.setWinner ? p.push("set") : y.setFinished && !n(d.winner) && (_ = !0), y.matchFinished === !0 && u.status !== "finished" && p.push("match")) : _ = !0;
	let b = ne(f);
	return (b.lineup === "missing" || b.actionsCaptured === !1) && (_ = !0), Pi("point", [...new Set(p)], _);
}
var zi = (n, r) => {
	let i = t(r.rallies), a = e(i.at(-1)), o = oe(n);
	return {
		match: n,
		set: r,
		count: i.length,
		lastId: a?.id,
		lastRally: a,
		expectedUndo: o.state === "projected" ? o.after : null
	};
};
function Bi(t, a, o) {
	let s = [], c = e(a.liveRally), l = t.lastRally, u = t.expectedUndo;
	if (!l || !c || !u || l.id === void 0 || c.id !== l.id) return Pi("undo", s, !0);
	let d = i({
		us: o.scoreUs,
		opponent: o.scoreOpponent
	}), f = !d;
	d && !Ni(d, u.score) && s.push("score"), n(a.servingTeam) ? a.servingTeam !== u.serving && s.push("service") : f = !0, r(a.rotationNo) && r(a.opponentRotationNo) ? (a.rotationNo !== u.rotationUs || a.opponentRotationNo !== u.rotationOpponent) && s.push("rotation") : f = !0, Array.isArray(l.actions) && Array.isArray(c.actions) ? l.actions.length !== c.actions.length && s.push("actions") : f = !0, Ii(l.lineupBefore) && Ii(a.lineup) ? Li(l.lineupBefore, a.lineup) || s.push("lineup") : f = !0;
	let p = Mi.filter((e) => l[e] !== void 0 && l[e] !== null);
	return p.length && p.some((e) => !Object.is(l[e], c[e])) && s.push("video"), Pi("undo", [...new Set(s)], f);
}
function Vi() {
	let t = null, n = !1, r = 0, i = 0, a = 0, o = 0, s = 0, c = 0, l = 0, u = [], d = (e) => (r++, e.operation === "point" ? i++ : a++, e.verdict === "agree" ? o++ : e.verdict === "difference" ? s++ : c++, e.verdict !== "agree" && (u.push(e), u.length > Ai && u.shift()), e);
	return Object.freeze({
		observe(r) {
			if (n) return null;
			let i = e(r), a = i && Fi(i);
			if (!i || !a) return t = null, null;
			let o = zi(i, a), s = t;
			return t = o, s ? s.match !== i || s.set !== a ? (l++, null) : o.count === s.count ? null : o.count === s.count + 1 ? d(Ri(i, a, o.lastRally)) : o.count === s.count - 1 ? s.lastId === void 0 || e(i.liveRally)?.id !== s.lastId ? (l++, null) : d(Bi(s, i, a)) : (l++, null) : null;
		},
		snapshot: () => Object.freeze({
			version: "20.5.15",
			mode: "passive-last-rally-only",
			readOnly: !0,
			counters: Object.freeze({
				observed: r,
				points: i,
				undos: a,
				agree: o,
				difference: s,
				unverified: c,
				skipped: l
			}),
			recent: Object.freeze([...u]),
			limitations: Object.freeze([
				"Solo compara cambios detectados mientras esta sesión está abierta; no revisa todo el historial.",
				"La comparación se aplaza y no ejecuta ni sustituye los comandos reales.",
				"Una edición manual, cambio de partido o salto de varios rallies no demuestra un error.",
				"No se almacenan códigos, dorsales, jugadores, identificadores de partidos ni enlaces de vídeo.",
				"No confirma la nube ni la sincronización entre dispositivos."
			])
		}),
		clear() {
			r = i = a = o = s = c = l = 0, u.length = 0;
		},
		dispose() {
			n = !0, t = null, u.length = 0;
		}
	});
}
// src/domain/rally-recovery-evidence.ts
var Hi = Object.freeze([
	"score",
	"service",
	"rotation",
	"set",
	"match",
	"actions",
	"lineup",
	"video"
]), q = (e) => {
	try {
		return JSON.stringify(e);
	} catch {
		return;
	}
}, Ui = (n) => t(n.sets).map(e).find((e) => e && Number(e.number) === Number(n.currentSet) && Number.isInteger(Number(n.currentSet))) || null;
function J(n) {
	try {
		let r = e(n);
		if (!r) return null;
		let i = Ui(r), a = i && Array.isArray(i.rallies) ? i.rallies : null, o = e(a?.at(-1)), s = e(r.liveRally), c = typeof r.id == "string" && r.id.length > 0 || typeof r.id == "number" && Number.isFinite(r.id) ? q([r.id, r.currentSet]) : void 0, l = {
			score: i ? q([i.scoreUs, i.scoreOpponent]) : void 0,
			service: q(r.servingTeam),
			rotation: q([r.rotationNo, r.opponentRotationNo]),
			set: i ? q([r.currentSet, t(r.sets).map((t) => {
				let n = e(t);
				return n ? [
					n.number,
					n.scoreUs,
					n.scoreOpponent,
					n.finished,
					n.winner
				] : null;
			})]) : void 0,
			match: q(r.status),
			actions: a ? q([
				a.length,
				o?.id,
				o?.actions,
				s?.id,
				s?.actions
			]) : void 0,
			lineup: q([
				r.lineup,
				r.baseLineup,
				r.lineupRoles,
				r.libero
			]),
			video: q([
				o?.liveVideoSessionId,
				o?.liveVideoStart,
				o?.liveVideoEnd,
				o?.liveVideoLinkedAt,
				s?.liveVideoSessionId,
				s?.liveVideoStart,
				s?.liveVideoEnd
			])
		};
		return Object.freeze({
			identity: c,
			fields: Object.freeze(l)
		});
	} catch {
		return null;
	}
}
function Wi(e, t) {
	if (!e || !t) return Object.freeze(["missing-data"]);
	let n = [], r = !1;
	for (let i of Hi) e.fields[i] === void 0 || t.fields[i] === void 0 ? r = !0 : e.fields[i] !== t.fields[i] && n.push(i);
	return r && n.push("missing-data"), Object.freeze(n);
}
function Gi(e, t) {
	return !!e && !!t && !!e.identity && e.identity === t.identity && Hi.every((n) => e.fields[n] !== void 0 && t.fields[n] !== void 0 && e.fields[n] === t.fields[n]);
}
function Ki(e, t, n) {
	return !e || !t || !n || !e.identity || !t.identity || !n.identity || e.identity !== t.identity || e.identity !== n.identity || [...Hi].some((r) => e.fields[r] === void 0 || t.fields[r] === void 0 || n.fields[r] === void 0) ? "unreadable" : Gi(e, t) ? Gi(e, n) ? "unchanged-observed" : "divergent" : Gi(n, t) ? "durable-after" : Gi(n, e) ? "durable-before" : "divergent";
}
// src/domain/rally-transaction-pilot.ts
var qi = 40, Ji = (e, t) => e.us === t.us && e.opponent === t.opponent, Yi = (n) => {
	let r = e(n);
	return r && t(r.sets).map(e).find((e) => e && Number(e.number) === Number(r.currentSet) && Number.isInteger(Number(r.currentSet))) || null;
}, Y = (e, t, n = [], r = "not-checked") => Object.freeze({
	operation: e,
	verdict: t,
	areas: Object.freeze([...n]),
	durability: r
}), Xi = (a, o, s, c, l, u, d) => {
	let f = e(c), p = Yi(c);
	if (o.state !== "projected" || !o.after || !f || !p || !l || f !== s || p !== l) return Y(a, "unverified", ["missing-data"]);
	let m = t(p.rallies).length;
	if (a === "point") {
		if (m !== d + 1) return Y(a, "unverified", ["missing-data"]);
		let e = Ri(f, p, t(p.rallies).at(-1)), n = [...e.areas], r = i({
			us: p.scoreUs,
			opponent: p.scoreOpponent
		});
		return r && !Ji(r, o.after.score) && !n.includes("score") && n.push("score"), Y("point", n.length ? "difference" : e.verdict, n);
	}
	let h = e(f.liveRally);
	if (m !== d - 1 || !u || u.id === void 0 || h?.id !== u.id) return Y("undo", "unverified", ["missing-data"]);
	let g = [], _ = i({
		us: p.scoreUs,
		opponent: p.scoreOpponent
	}), v = !_;
	return _ && !Ji(_, o.after.score) && g.push("score"), n(f.servingTeam) ? f.servingTeam !== o.after.serving && g.push("service") : v = !0, r(f.rotationNo) && r(f.opponentRotationNo) ? (f.rotationNo !== o.after.rotationUs || f.opponentRotationNo !== o.after.rotationOpponent) && g.push("rotation") : v = !0, Array.isArray(u.actions) && Array.isArray(h.actions) ? u.actions.length !== h.actions.length && g.push("actions") : v = !0, Y("undo", g.length ? "difference" : v ? "unverified" : "agree", g.length ? g : v ? ["missing-data"] : []);
};
function Zi(n, r = {}) {
	let i = Promise.resolve(), a = !1, o = r.requireRecoveryAfterNativeFailure === !0, s = r.installedInLiveUI === !0, c = r.requireStableMatchForCommands === !0, l = 0, u = 0, d = o && r.startBlockedForPendingRecovery === !0, f = "not-checked", p = 0, m = 0, h = 0, g = 0, _ = 0, v = 0, y = 0, b = 0, x = 0, S = 0, C = 0, w = 0, T = [], E = (e) => {
		m++, e.verdict === "agree" ? h++ : e.verdict === "difference" ? g++ : e.verdict === "native-rejected" ? v++ : e.verdict === "native-declined" ? y++ : e.verdict === "recovery-blocked" ? S++ : e.verdict === "context-discarded" ? C++ : _++, (e.verdict === "native-rejected" || e.verdict === "native-declined") && (f = e.durability, e.areas.some((e) => e !== "missing-data") && b++, e.areas.includes("missing-data") && x++), e.verdict !== "agree" && (T.push(e), T.length > qi && T.shift());
	}, D = () => {
		try {
			return n.readCurrent();
		} catch {
			return null;
		}
	}, O = () => J(D()), k = async (e, t) => {
		if (!n.readDurableLocal) return "not-configured";
		try {
			return Ki(e, t, J(await n.readDurableLocal()));
		} catch {
			return "unreadable";
		}
	}, A = async (r, i, a, s) => {
		if (c && (l > 0 || s !== u || !a || D() !== a)) return E(Y(r, "context-discarded")), !1;
		if (d) throw E(Y(r, "recovery-blocked")), Error("Recuperación pendiente: comprueba el partido y el guardado local antes de continuar.");
		let f = D(), p = Yi(f), m = t(p?.rallies), h = J(f), g = m.length, _ = e(m.at(-1)), v = null;
		try {
			v = r === "point" ? ae(f, i) : oe(f);
		} catch {}
		let y;
		try {
			y = r === "point" ? await n.awardPoint(i) : await n.undoRally();
		} catch (e) {
			o && (d = !0);
			let t = O(), n = await k(h, t);
			throw E(Y(r, "native-rejected", Wi(h, t), n)), e;
		}
		if (y === !1) {
			o && (d = !0);
			let e = O(), t = await k(h, e);
			return E(Y(r, "native-declined", Wi(h, e), t)), y;
		}
		try {
			E(v ? Xi(r, v, f, D(), p, _, g) : Y(r, "unverified", ["missing-data"]));
		} catch {
			E(Y(r, "unverified", ["missing-data"]));
		}
		return y;
	}, j = (e, t) => {
		if (a) return Promise.reject(/* @__PURE__ */ Error("El piloto ya está desactivado."));
		if (p++, c && l > 0) return E(Y(e, "context-discarded")), Promise.resolve(!1);
		w++;
		let n = c ? D() : null, r = u, o = i.then(() => A(e, t, n, r));
		return i = o.then(() => void 0, () => void 0), o.finally(() => {
			w--;
		});
	};
	return Object.freeze({
		readonlyVersion: "20.5.18",
		installedInLiveUI: s,
		awardPoint: (e) => j("point", e),
		undoRally: () => j("undo"),
		report: () => Object.freeze({
			version: "20.5.18",
			mode: "explicit-native-delegation-only",
			installedInLiveUI: s,
			submitted: p,
			completed: m,
			agree: h,
			difference: g,
			unverified: _,
			nativeRejected: v,
			nativeDeclined: y,
			partialMutations: b,
			uninspectedFailures: x,
			blockedCommands: S,
			pending: w,
			contextDiscarded: C,
			selectionPending: l > 0,
			recoveryGuard: Object.freeze({
				enabled: o,
				blocked: d,
				lastEvidence: f
			}),
			recent: Object.freeze([...T])
		}),
		async beginMatchSelection() {
			if (!c || a) return () => {};
			l++, u++, await i;
			let e = !1;
			return () => {
				e || (e = !0, l = Math.max(0, l - 1));
			};
		},
		async resumeAfterVerifiedReload() {
			if (!o || !d || a || w !== 0 || !n.readDurableLocal) return !1;
			try {
				return Gi(O(), J(await n.readDurableLocal())) ? (d = !1, !0) : !1;
			} catch {
				return !1;
			}
		},
		disable() {
			a = !0;
		}
	});
}
// src/domain/rally-writer-runtime.ts
var Qi = "20.5.55", $i = /* @__PURE__ */ new WeakMap();
function ea(e) {
	let t = $i.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: Qi,
		singleNativeWriter: !0,
		create(e) {
			if (!e || typeof e.readCurrent != "function" || typeof e.awardPoint != "function" || typeof e.undoRally != "function") throw TypeError("El coordinador requiere los escritores nativos originales.");
			return Zi(e, {
				installedInLiveUI: !0,
				requireStableMatchForCommands: !0
			});
		}
	});
	$i.set(e, n);
	let r = e;
	return r.VC_RALLY_WRITER_20555 ||= n, n;
}
// src/domain/rally-record.ts
var ta = (e) => typeof e == "object" && e && !Array.isArray(e) ? e : null, na = (e) => {
	let t = Object.getPrototypeOf(e);
	return t === null || Object.getPrototypeOf(t) === null;
};
function ra(e) {
	let t = ta(e), n = ta(t?.live), r = ta(t?.before);
	return !t || !n || !r ? null : {
		id: n.id,
		setNumber: t.setNumber,
		servingBefore: r.servingBefore,
		rotationBefore: r.rotationBefore,
		opponentRotationBefore: r.opponentRotationBefore,
		lineupBefore: t.lineupBefore,
		baseLineupBefore: t.baseBefore,
		liberoBefore: t.liberoBefore,
		lineupRolesBefore: t.rolesBefore,
		scoreBefore: t.scoreBefore,
		scoreAfter: {
			us: t.scoreUs,
			opponent: t.scoreOpponent
		},
		winner: t.winner === "opponent" ? "opponent" : "ours",
		actions: t.actions,
		startedAt: n.startedAt,
		endedAt: t.endedAt,
		scoutStartMs: Number(n.scoutStartMs) || 0,
		scoutEndMs: t.scoutEndMs
	};
}
function ia(e) {
	let t = ta(e), n = ta(t?.rally);
	return !t || !n ? null : {
		id: n.id,
		actions: t.actions,
		startedAt: n.startedAt,
		scoutStartMs: Number(n.scoutStartMs) || 0,
		startSnapshot: {
			servingBefore: n.servingBefore,
			rotationBefore: n.rotationBefore,
			opponentRotationBefore: n.opponentRotationBefore || 1,
			lineupBefore: t.lineupBefore,
			scoreBefore: t.scoreBefore
		}
	};
}
function aa(e, t, n = 0) {
	if (Object.is(e, t)) return !0;
	if (n > 3) return !1;
	let r = ta(e), i = ta(t);
	if (!r || !i || !na(r) || !na(i)) return !1;
	let a = Reflect.ownKeys(r), o = Reflect.ownKeys(i);
	return a.length === o.length && a.every((e, t) => {
		if (e !== o[t]) return !1;
		let a = Object.getOwnPropertyDescriptor(r, e), s = Object.getOwnPropertyDescriptor(i, e);
		return !!a && !!s && "value" in a && "value" in s && a.enumerable === s.enumerable && aa(a.value, s.value, n + 1);
	});
}
// src/domain/rally-record-runtime.ts
var oa = /* @__PURE__ */ new WeakMap();
function sa(e) {
	let t = oa.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.57",
		pureRecordOnly: !0,
		close: ra,
		restore: ia,
		equivalent: aa
	});
	oa.set(e, n);
	let r = e;
	return r.VC_RALLY_RECORDS_20557 ||= n, n;
}
// src/domain/scout-local-save-receipt.ts
var ca = (e) => typeof e == "number" && Number.isInteger(e) && e >= 0 ? e : null;
function la(e) {
	let t = e?.path === "full-flush" || e?.path === "legacy-backup" ? e.path : "unavailable", n = e?.error === !0 ? "failed" : t === "full-flush" && e.outcome === !0 ? "completed" : t === "full-flush" && e.outcome === !1 ? "pending" : "unverified", r = ca(e?.journalFailuresBefore), i = ca(e?.journalFailuresAfter);
	return Object.freeze({
		version: "20.5.58",
		local: n,
		journal: r !== null && i !== null && i > r ? "issue-observed" : "not-confirmed",
		cloud: "not-confirmed",
		source: t
	});
}
// src/domain/scout-local-save-receipt-runtime.ts
var ua = /* @__PURE__ */ new WeakMap();
function da(e) {
	let t = ua.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.58",
		readOnly: !0,
		classify: la
	});
	ua.set(e, n);
	let r = e;
	return r.VC_LOCAL_SAVE_20558 ||= n, n;
}
// src/domain/scout-local-readback.ts
var fa = 6291456, pa = 2097152, ma = 524288, ha = "VC-LZW16-1:", X = (e) => Object.freeze({
	version: "20.5.59",
	state: e,
	scope: "primary-local-only",
	journal: "not-confirmed",
	cloud: "not-confirmed"
});
function ga(e) {
	try {
		if (!e || typeof e != "object" || Array.isArray(e)) return null;
		let t = JSON.stringify(e);
		return typeof t == "string" && t.length <= 2097152 ? t : null;
	} catch {
		return null;
	}
}
function _a(e) {
	try {
		if (typeof e?.snapshot != "string" || !e.snapshot || e.snapshot.length > 2097152 || typeof e.teamId != "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(e.teamId) || typeof e.matchId != "string" && typeof e.matchId != "number" || !String(e.matchId).trim()) return X("unverified");
		if (e.raw == null || e.raw === "") return X("missing");
		if (typeof e.raw != "string") return X("invalid");
		let t = e.raw;
		if (t.startsWith(ha)) {
			if (t.length > 524288) return X("too-large");
			if (typeof e.unpack != "function") return X("unverified");
			try {
				t = e.unpack(t);
			} catch {
				return X("invalid");
			}
			if (typeof t != "string") return X("invalid");
		}
		if (t.length > 6291456) return X("too-large");
		let n;
		try {
			n = JSON.parse(t);
		} catch {
			return X("invalid");
		}
		if (!n || typeof n != "object" || Array.isArray(n)) return X("invalid");
		let r = n.equiposData;
		if (!r || typeof r != "object" || Array.isArray(r)) return X("invalid");
		let i = r[e.teamId];
		if (!i || typeof i != "object" || Array.isArray(i)) return X("missing");
		let a = i.scoutingMatches;
		if (!Array.isArray(a)) return X("missing");
		let o = a.filter((t) => !!t && typeof t == "object" && String(t.id) === String(e.matchId));
		return o.length === 0 ? X("missing") : o.length === 1 ? X(JSON.stringify(o[0]) === e.snapshot ? "matched" : "different") : X("invalid");
	} catch {
		return X("unverified");
	}
}
// src/domain/scout-local-readback-runtime.ts
var va = /* @__PURE__ */ new WeakMap();
function ya(e) {
	let t = va.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.59",
		readOnly: !0,
		capture: ga,
		verify: _a
	});
	va.set(e, n);
	let r = e;
	return r.VC_LOCAL_READBACK_20559 ||= n, n;
}
// src/domain/scout-indexed-journal.ts
function ba(e) {
	return !e || !e.db || typeof e.db.transaction != "function" || typeof e.fullStore != "string" || !e.fullStore || typeof e.liveStore != "string" || !e.liveStore || e.fullStore === e.liveStore || typeof e.key != "string" || !e.key || !e.payload || typeof e.payload != "object" || Array.isArray(e.payload) || e.payload.key !== e.key || e.mode !== "checkpoint" && e.mode !== "action-delta" || e.mode === "action-delta" && typeof e.captureAnchor != "function" ? Promise.reject(/* @__PURE__ */ Error("Contrato del diario IndexedDB no disponible")) : new Promise((t, n) => {
		let r;
		try {
			r = e.db.transaction([e.fullStore, e.liveStore], "readwrite");
		} catch (e) {
			n(e);
			return;
		}
		let i = !1, a = (e) => {
			i || (i = !0, n(e || /* @__PURE__ */ Error("Transacción IndexedDB cancelada")));
		}, o = (e) => {
			try {
				r.abort();
			} catch {}
			a(e);
		};
		r.oncomplete = () => {
			i || (i = !0, t(!0));
		}, r.onerror = () => a(r.error || /* @__PURE__ */ Error("Error de transacción IndexedDB")), r.onabort = () => a(r.error || /* @__PURE__ */ Error("Transacción IndexedDB abortada"));
		try {
			let t = r.objectStore(e.fullStore), n = r.objectStore(e.liveStore);
			if (e.mode === "checkpoint") {
				t.put(e.payload), n.delete(e.key);
				return;
			}
			let i = t.get(e.key);
			i.onsuccess = () => {
				try {
					let r = i.result;
					if (!r?.match) {
						let r = e.captureAnchor();
						if (!r || typeof r.savedAt != "string") throw Error("Base de rally no disponible");
						let i = {
							...e.payload,
							savedAt: r.savedAt,
							liveRally: r.liveRally,
							currentSet: r.currentSet,
							status: r.status
						};
						t.put({
							...i,
							reason: "initial-action-anchor",
							match: r.match
						}), n.put(i);
						return;
					}
					if (Date.parse(String(r.savedAt || 0)) > Date.parse(String(e.payload.savedAt))) return;
					let a = n.get(e.key);
					a.onsuccess = () => {
						try {
							let t = a.result;
							(!t || Date.parse(String(t.savedAt || 0)) <= Date.parse(String(e.payload.savedAt))) && n.put(e.payload);
						} catch (e) {
							o(e);
						}
					}, a.onerror = () => o(a.error || /* @__PURE__ */ Error("No se pudo leer el rally pendiente"));
				} catch (e) {
					o(e);
				}
			}, i.onerror = () => o(i.error || /* @__PURE__ */ Error("No se pudo leer el checkpoint"));
		} catch (e) {
			o(e);
		}
	});
}
// src/domain/scout-indexed-journal-runtime.ts
var xa = /* @__PURE__ */ new WeakMap();
function Sa(e) {
	let t = xa.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.60",
		ownsDatabase: !1,
		usesExistingStores: !0,
		write: ba
	});
	xa.set(e, n);
	let r = e;
	return r.VC_SCOUT_INDEXED_JOURNAL_20560 ||= n, n;
}
// src/domain/club-local-store.ts
var Ca = "VC-LZW16-1:", wa = (e) => {
	let t = e && typeof e == "object" ? e : {};
	return t.name === "QuotaExceededError" || t.code === 22 || t.code === 1014;
};
function Ta(e) {
	if (!e || !e.storage || typeof e.storage.getItem != "function" || typeof e.storage.setItem != "function" || typeof e.key != "string" || !e.key || typeof e.raw != "string" || typeof e.pack != "function" || typeof e.unpack != "function") throw Error("Guardado local no disponible");
	let t = e.storage.getItem(e.key);
	if (!e.compactActive && !(t || "").startsWith(Ca)) try {
		return e.storage.setItem(e.key, e.raw), "normal";
	} catch (e) {
		if (!wa(e)) throw e;
	}
	let n = e.pack(e.raw);
	if (n.length >= e.raw.length) throw Error("No cabe el estado local ni comprimido. Exporta una copia, no borres datos.");
	if (e.unpack(n) !== e.raw) throw Error("La comprobación de integridad del estado comprimido ha fallado");
	try {
		e.storage.setItem(e.key, n);
	} catch (e) {
		throw wa(e) ? Error("Almacenamiento local lleno incluso en formato compacto. La importación se ha cancelado sin eliminar tus datos; exporta una copia de seguridad y avisa del error.") : e;
	}
	if (e.storage.getItem(e.key) !== n) throw Error("No se pudo verificar el almacenamiento local");
	return "compacto";
}
// src/domain/club-local-store-runtime.ts
var Ea = /* @__PURE__ */ new WeakMap();
function Da(e) {
	let t = Ea.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.61",
		usesExistingKey: !0,
		keepsNativeCodec: !0,
		write: Ta
	});
	Ea.set(e, n);
	let r = e;
	return r.VC_CLUB_LOCAL_STORE_20561 ||= n, n;
}
// src/domain/club-snapshot.ts
var Oa = (e, t) => {
	let n = JSON.stringify(e);
	if (typeof n != "string") throw Error(`No se pudo serializar ${t}`);
	return n;
};
function ka(e) {
	if (!e || typeof e.updatedAt != "string") throw Error("Instantánea del club no válida");
	let t = Oa(e.bibliotecaCompartida, "la biblioteca"), n = Oa(e.equiposData, "los equipos"), r = Oa(e.updatedAt, "la fecha");
	return Object.freeze({
		raw: `{"version":5.8,"bibliotecaCompartida":${t},"bibliotecaVersion":1,"bibliotecaUpdatedAt":${r},"equiposData":${n}}`,
		libraryEntriesJSON: t
	});
}
function Aa(e) {
	if (!e || !e.snapshot || typeof e.snapshot.libraryEntriesJSON != "string" || typeof e.updatedAt != "string" || !Number.isSafeInteger(e.total) || e.total < 0) throw Error("Copia de biblioteca no válida");
	return `{"version":1,"updatedAt":${Oa(e.updatedAt, "la fecha de biblioteca")},"total":${e.total},"ejercicios":${e.snapshot.libraryEntriesJSON}}`;
}
// src/domain/club-snapshot-runtime.ts
var ja = /* @__PURE__ */ new WeakMap();
function Ma(e) {
	let t = ja.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.62",
		usesExistingPayload: !0,
		serialize: ka,
		serializeLibrary: Aa
	});
	ja.set(e, n);
	let r = e;
	return r.VC_CLUB_SNAPSHOT_20562 ||= n, n;
}
// src/state/club-partitions.ts
var Z = [
	"players",
	"trainings",
	"seasons"
], Na = 5e6, Pa = Object.freeze({
	players: ["jugadores"],
	trainings: [
		"sesionActual",
		"meta",
		"historial",
		"planificacion",
		"plantillas"
	],
	seasons: [
		"temporada",
		"temporadas",
		"temporadaActual",
		"season",
		"seasonName"
	]
}), Fa = (e) => !!e && typeof e == "object" && !Array.isArray(e);
function Ia(e, t) {
	if (!Fa(e) || !t || typeof t != "string" || t.length > 128) throw Error("Estado de equipos o revisión no disponible");
	let n = Object.keys(e).sort();
	if (!n.length || n.length > 100) throw Error("Número de equipos no admitido en el piloto");
	let r = {
		players: [],
		trainings: [],
		seasons: []
	}, i = 0;
	for (let a of n) {
		let n = e[a];
		if (!Fa(n)) throw Error("Registro de equipo no compatible con el piloto");
		for (let e of Z) {
			let o = {};
			for (let t of Pa[e]) Object.hasOwn(n, t) && (o[t] = n[t]);
			let s = JSON.stringify(o);
			if (typeof s != "string") throw Error("No se pudo convertir la partición a JSON");
			if (i += s.length, i > 5e6) throw Error("El piloto supera el límite local de 5 millones de caracteres");
			r[e].push(Object.freeze({
				teamId: a,
				revision: t,
				dataJson: s
			}));
		}
	}
	for (let e of Z) Object.freeze(r[e]);
	return Object.freeze({
		schema: 1,
		revision: t,
		teamIds: Object.freeze(n),
		rows: Object.freeze(r),
		totalChars: i
	});
}
function La(e, t) {
	if (e.teamIds.length !== t.teamIds.length) return !1;
	for (let n = 0; n < e.teamIds.length; n++) if (e.teamIds[n] !== t.teamIds[n]) return !1;
	for (let n of Z) {
		if (e.rows[n].length !== t.rows[n].length) return !1;
		for (let r = 0; r < e.rows[n].length; r++) {
			let i = e.rows[n][r], a = t.rows[n][r];
			if (i.teamId !== a.teamId || i.dataJson !== a.dataJson) return !1;
		}
	}
	return !0;
}
// src/state/club-entity-plan.ts
var Q = [
	"playerEntities",
	"trainingEntities",
	"seasonEntities"
], Ra = 2e4, za = (e) => !!e && typeof e == "object" && !Array.isArray(e), Ba = (e, t) => Object.prototype.hasOwnProperty.call(e, t), Va = (e) => {
	if (!za(e)) return null;
	for (let t of [
		"id",
		"uuid",
		"_id"
	]) {
		let n = e[t];
		if (typeof n == "string" && n.trim() || typeof n == "number" && Number.isSafeInteger(n)) return String(n).trim();
	}
	return null;
}, Ha = (e, t, n, r) => JSON.stringify([
	e,
	t,
	n,
	r
]);
function Ua(e, t) {
	if (!za(e) || typeof t != "string" || !t || t.length > 128) throw Error("Datos de club o revisión no válidos");
	let n = Object.keys(e).sort();
	if (!n.length || n.length > 100) throw Error("Número de equipos no válido");
	let r = {
		playerEntities: [],
		trainingEntities: [],
		seasonEntities: []
	}, i = 0, a = 0, o = 0, s = 0, c = 0, l = (e, t, n, i, a) => {
		let l = JSON.stringify(a);
		if (typeof l != "string") o++;
		else {
			if (++c > 2e4) throw Error("Demasiadas entidades para el piloto");
			if (s += l.length, s > 5e6) throw Error("El piloto de entidades supera el límite local");
			r[e].push(Object.freeze({
				key: Ha(e, t, n, i),
				teamId: t,
				collection: n,
				dataJson: l
			}));
		}
	}, u = (e, t, n) => {
		if (!Ba(e, t)) return;
		let r = e[t];
		if (!Array.isArray(r)) {
			o++;
			return;
		}
		let s = r.map((e) => Va(e)), c = /* @__PURE__ */ new Map();
		for (let e of s) e !== null && c.set(e, (c.get(e) || 0) + 1);
		for (let e = 0; e < r.length; e++) {
			let o = s[e];
			o === null ? i++ : (c.get(o) || 0) > 1 ? a++ : l(n, d, t, o, r[e]);
		}
	}, d = "";
	for (d of n) {
		let t = e[d];
		if (!za(t)) throw Error("Registro de equipo incompatible");
		u(t, "jugadores", "playerEntities");
		for (let e of [
			"historial",
			"planificacion",
			"plantillas",
			"sesionActual"
		]) u(t, e, "trainingEntities");
		Ba(t, "meta") && l("trainingEntities", d, "meta", "singleton", t.meta);
		for (let e of [
			"temporada",
			"temporadaActual",
			"season",
			"seasonName"
		]) Ba(t, e) && l("seasonEntities", d, e, "singleton", t[e]);
		if (Ba(t, "temporadas")) {
			let e = t.temporadas;
			if (!Array.isArray(e)) o++;
			else {
				let t = e.map((e) => typeof e == "string" ? e.trim() : Va(e)), n = /* @__PURE__ */ new Map();
				for (let e of t) e && n.set(e, (n.get(e) || 0) + 1);
				let r = 0;
				for (let o of e) {
					let e = t[r++];
					e ? (n.get(e) || 0) > 1 ? a++ : l("seasonEntities", d, "temporadas", e, o) : i++;
				}
			}
		}
	}
	for (let e of Q) r[e].sort((e, t) => e.key.localeCompare(t.key)), Object.freeze(r[e]);
	return Object.freeze({
		schema: 2,
		revision: t,
		teamIds: Object.freeze(n),
		rows: Object.freeze(r),
		missingIds: i,
		duplicatedIds: a,
		invalidRecords: o,
		totalChars: s,
		complete: i + a + o === 0
	});
}
function Wa(e, t) {
	if (e.teamIds.length !== t.teamIds.length || e.missingIds !== t.missingIds || e.duplicatedIds !== t.duplicatedIds || e.invalidRecords !== t.invalidRecords) return !1;
	for (let n = 0; n < e.teamIds.length; n++) if (e.teamIds[n] !== t.teamIds[n]) return !1;
	for (let n of Q) {
		if (e.rows[n].length !== t.rows[n].length) return !1;
		for (let r = 0; r < e.rows[n].length; r++) {
			let i = e.rows[n][r], a = t.rows[n][r];
			if (i.key !== a.key || i.dataJson !== a.dataJson) return !1;
		}
	}
	return !0;
}
// src/state/club-repository.ts
var Ga = "VolleyCoachClubPartitionsV2063", Ka = "metadata", qa = [...Z, Ka], Ja = [
	...qa,
	...Q,
	"entityManifest"
];
function Ya(e) {
	return new Promise((t, n) => {
		let r = !1, i = (e) => {
			r || (r = !0, n(e || Error("No se pudo abrir el piloto local")));
		}, a;
		try {
			a = e.open(Ga, 2);
		} catch (e) {
			i(e);
			return;
		}
		a.onupgradeneeded = () => {
			try {
				for (let e of Ja) a.result.objectStoreNames.contains(e) || a.result.createObjectStore(e, { keyPath: e === Ka || e === "entityManifest" || Q.includes(e) ? "key" : "teamId" });
			} catch (e) {
				try {
					a.transaction?.abort();
				} catch {}
				i(e);
			}
		}, a.onsuccess = () => {
			let e = a.result;
			if (r) e.close();
			else {
				for (let t of Ja) if (!e.objectStoreNames.contains(t)) {
					e.close(), i(Error("Falta una colección en el repositorio piloto"));
					return;
				}
				r = !0, t(e);
			}
		}, a.onerror = () => i(a.error), a.onblocked = () => i(Error("Otra pestaña impide abrir el repositorio piloto"));
	});
}
function Xa(e, t) {
	return new Promise((n, r) => {
		let i;
		try {
			i = e.transaction([...qa], "readwrite");
		} catch (e) {
			r(e);
			return;
		}
		let a = !1, o = (e) => {
			a || (a = !0, r(e || Error("Transacción de réplica cancelada")));
		};
		i.oncomplete = () => {
			a || (a = !0, n());
		}, i.onerror = () => o(i.error), i.onabort = () => o(i.error);
		try {
			for (let e of Z) {
				let n = i.objectStore(e);
				for (let r of t.rows[e]) n.put(r);
			}
			i.objectStore(Ka).put({
				key: "current",
				schema: 1,
				revision: t.revision,
				teamIds: [...t.teamIds],
				totalChars: t.totalChars
			});
		} catch (e) {
			try {
				i.abort();
			} catch {}
			o(e);
		}
	});
}
function Za(e, t) {
	return new Promise((n, r) => {
		let i;
		try {
			i = e.transaction([...qa], "readonly");
		} catch (e) {
			r(e);
			return;
		}
		let a = !1, o = !1, s = 0, c = (e) => {
			o || (o = !0, r(e || Error("Fallo de lectura del repositorio piloto")));
		}, l = (e, t) => {
			s++, e.onsuccess = () => {
				try {
					t(e.result) || (a = !0);
				} catch {
					a = !0;
				}
			}, e.onerror = () => {
				a = !0;
			};
		};
		i.oncomplete = () => {
			o || (o = !0, a || s !== 1 + t.teamIds.length * Z.length ? r(Error("La réplica no coincide con la instantánea original")) : n(Object.freeze({
				status: "verified",
				revision: t.revision,
				teamCount: t.teamIds.length,
				recordCount: t.teamIds.length * Z.length,
				totalChars: t.totalChars,
				authoritative: !1
			})));
		}, i.onerror = () => c(i.error), i.onabort = () => c(i.error);
		try {
			l(i.objectStore(Ka).get("current"), (e) => e?.key === "current" && e.schema === 1 && e.revision === t.revision && e.totalChars === t.totalChars && Array.isArray(e.teamIds) && JSON.stringify(e.teamIds) === JSON.stringify(t.teamIds));
			for (let e of Z) {
				let n = t.rows[e];
				for (let r of n) l(i.objectStore(e).get(r.teamId), (e) => e?.teamId === r.teamId && e.revision === t.revision && e.dataJson === r.dataJson);
			}
		} catch (e) {
			try {
				i.abort();
			} catch {}
			c(e);
		}
	});
}
async function Qa(e) {
	if (!e?.factory || typeof e.factory.open != "function" || !e.plan || e.plan.schema !== 1 || !e.plan.teamIds?.length) throw Error("Repositorio piloto no disponible");
	let t = await Ya(e.factory);
	try {
		return await Xa(t, e.plan), await Za(t, e.plan);
	} finally {
		t.close();
	}
}
function $a(e) {
	return !e || typeof e.deleteDatabase != "function" ? Promise.reject(Error("Limpieza del repositorio piloto no disponible")) : new Promise((t, n) => {
		let r = !1, i, a = (e) => {
			r || (r = !0, n(e || Error("No se ha podido borrar la réplica de prueba")));
		};
		try {
			i = e.deleteDatabase(Ga);
		} catch (e) {
			a(e);
			return;
		}
		i.onsuccess = () => {
			r || (r = !0, t(!0));
		}, i.onerror = () => a(i.error), i.onblocked = () => a(Error("Cierra las otras pestañas para eliminar la réplica piloto"));
	});
}
// src/state/club-repository-runtime.ts
var eo = /* @__PURE__ */ new WeakMap(), to = 0, no = () => `pilot-${Date.now().toString(36)}-${(++to).toString(36)}`;
function ro(e) {
	let t = eo.get(e);
	if (t) return t;
	let n = e.document, r = n?.getElementById("vc20563-run-pilot"), i = n?.getElementById("vc20563-pilot-status"), a = n?.getElementById("vc20563-remove-pilot");
	if (!r || !a || !i) return null;
	let o = !1, s = !1, c = typeof e.indexedDB?.open == "function", l = (e) => {
		s || (i.textContent = e);
	};
	r.disabled = !c, a.disabled = !c, l(c ? "Sin ejecutar. El piloto no modifica los datos originales ni la nube." : "IndexedDB no está disponible en este navegador. No se han modificado datos.");
	let u = async () => {
		if (s || o || !c) throw Error("Piloto ocupado o no disponible");
		o = !0, r.disabled = !0, a.disabled = !0, l("Preparando copia local de prueba. No cierres esta pestaña hasta ver el resultado.");
		try {
			let t = e.VC_V1917_TEAM_STATE?.(), n = Ia(t, no()), r = await Qa({
				factory: e.indexedDB,
				plan: n
			});
			return La(n, Ia(e.VC_V1917_TEAM_STATE?.(), no())) ? l(`Réplica piloto verificada: ${r.teamCount} equipos, ${r.recordCount} registros y ${r.totalChars.toLocaleString("es-ES")} caracteres. El guardado principal sigue intacto.`) : l("Réplica de prueba comprobada, pero los datos han cambiado durante la operación. Repite la prueba."), r;
		} catch (e) {
			throw l("No se ha podido verificar la réplica. El guardado habitual sigue funcionando; no borres datos."), e;
		} finally {
			o = !1, s || (r.disabled = !c, a.disabled = !c);
		}
	}, d = () => {
		u().catch(() => {});
	}, f = async () => {
		if (s || o || !c) throw Error("Limpieza piloto no disponible");
		o = !0, r.disabled = !0, a.disabled = !0, l("Eliminando únicamente las colecciones piloto de V20.5.63/V20.5.64…");
		try {
			return await $a(e.indexedDB), l("Réplica piloto eliminada. Los datos originales del club siguen intactos."), !0;
		} catch (e) {
			throw l("La eliminación no se ha confirmado. Si otra pestaña la bloquea, podría completarse más tarde. Comprueba el estado antes de reintentar."), e;
		} finally {
			o = !1, s || (r.disabled = !c, a.disabled = !c);
		}
	}, p = () => {
		e.confirm("¿Eliminar únicamente los repositorios piloto de V20.5.63 y V20.5.64? El club original y la nube no se modificarán.") && f().catch(() => {});
	};
	r.addEventListener("click", d), a.addEventListener("click", p);
	let m = Object.freeze({
		VERSION: "20.5.63",
		authoritative: !1,
		manualOnly: !0,
		run: u,
		removeReplica: f,
		dispose() {
			s || (s = !0, r.removeEventListener("click", d), a.removeEventListener("click", p), r.disabled = !0, a.disabled = !0, eo.delete(e), e.VC_CLUB_PILOT_20563 === m && delete e.VC_CLUB_PILOT_20563);
		}
	});
	return e.VC_CLUB_PILOT_20563 = m, eo.set(e, m), m;
}
// src/state/club-entity-repository.ts
var io = "entityManifest", ao = [...Q, io], oo = (e) => ({
	playerEntities: e.rows.playerEntities.map((e) => e.key),
	trainingEntities: e.rows.trainingEntities.map((e) => e.key),
	seasonEntities: e.rows.seasonEntities.map((e) => e.key)
}), so = (e) => !!e && typeof e == "object" && e.schema === 2;
async function co(e, t) {
	let n = oo(t), r = [], i = 0, a = 0, o = 0, s = 0;
	return await new Promise((c, l) => {
		let u;
		try {
			u = e.transaction(ao, "readwrite");
		} catch (e) {
			l(e);
			return;
		}
		let d = !1, f = (e) => {
			d || (d = !0, l(e || Error("La escritura parcial se ha cancelado")));
		}, p = (e) => {
			try {
				u.abort();
			} catch {}
			f(e);
		};
		u.oncomplete = () => {
			d || (d = !0, c());
		}, u.onerror = () => f(u.error), u.onabort = () => f(u.error);
		try {
			let e = u.objectStore(io), c = e.get("current");
			c.onsuccess = () => {
				try {
					if (c.result !== void 0 && !so(c.result)) throw Error("Catálogo piloto incompatible");
					let l = so(c.result) ? c.result : null;
					for (let e of Q) {
						let c = u.objectStore(e), d = new Set(n[e]), f = l?.keys?.[e];
						if (f !== void 0 && !Array.isArray(f)) throw Error("Catálogo piloto anterior no válido");
						for (let t of f || []) {
							if (typeof t != "string") throw Error("Clave piloto no válida");
							d.has(t) || (c.delete(t), r.push({
								store: e,
								key: t
							}), s++);
						}
						for (let n of t.rows[e]) {
							let e = c.get(n.key);
							e.onsuccess = () => {
								try {
									let t = e.result;
									if (t?.dataJson === n.dataJson && t?.teamId === n.teamId && t?.collection === n.collection) {
										o++;
										return;
									}
									t ? a++ : i++, c.put(n);
								} catch (e) {
									p(e);
								}
							}, e.onerror = () => p(e.error || Error("Entidad no legible"));
						}
					}
					e.put({
						key: "current",
						schema: 2,
						revision: t.revision,
						keys: n,
						teamIds: [...t.teamIds],
						totalChars: t.totalChars,
						pendingIds: t.missingIds + t.duplicatedIds + t.invalidRecords
					});
				} catch (e) {
					p(e);
				}
			}, c.onerror = () => p(c.error || Error("Catálogo no legible"));
		} catch (e) {
			p(e);
		}
	}), {
		keys: n,
		deleted: r,
		added: i,
		changed: a,
		unchanged: o,
		removed: s
	};
}
async function lo(e, t, n) {
	return new Promise((r, i) => {
		let a;
		try {
			a = e.transaction(ao, "readonly");
		} catch (e) {
			i(e);
			return;
		}
		let o = !1, s = !1, c = (e) => {
			s || (s = !0, i(e || Error("Fallo al leer las entidades")));
		}, l = (e, t) => {
			e.onsuccess = () => {
				try {
					t(e.result) || (o = !0);
				} catch {
					o = !0;
				}
			}, e.onerror = () => {
				o = !0;
			};
		};
		a.oncomplete = () => {
			s || (s = !0, o ? i(Error("Las entidades guardadas no coinciden con el origen")) : r(Object.freeze({
				status: "verified",
				authoritative: !1,
				partial: !t.complete,
				entities: Q.reduce((e, n) => e + t.rows[n].length, 0),
				added: n.added,
				changed: n.changed,
				unchanged: n.unchanged,
				removed: n.removed,
				pendingIds: t.missingIds + t.duplicatedIds + t.invalidRecords
			})));
		}, a.onerror = () => c(a.error), a.onabort = () => c(a.error);
		try {
			let e = n.keys;
			l(a.objectStore(io).get("current"), (n) => n?.schema === 2 && n?.revision === t.revision && n?.totalChars === t.totalChars && JSON.stringify(n?.keys) === JSON.stringify(e) && JSON.stringify(n?.teamIds) === JSON.stringify(t.teamIds));
			for (let e of Q) {
				let n = a.objectStore(e);
				for (let r of t.rows[e]) l(n.get(r.key), (e) => e?.key === r.key && e?.teamId === r.teamId && e?.collection === r.collection && e?.dataJson === r.dataJson);
			}
			for (let e of n.deleted) l(a.objectStore(e.store).get(e.key), (e) => e === void 0);
		} catch (e) {
			try {
				a.abort();
			} catch {}
			c(e);
		}
	});
}
async function uo(e) {
	if (!e?.factory || typeof e.factory.open != "function" || e.plan?.schema !== 2) throw Error("Plan de entidades no disponible");
	let t = await Ya(e.factory);
	try {
		let n = await co(t, e.plan);
		return await lo(t, e.plan, n);
	} finally {
		t.close();
	}
}
// src/state/club-entity-runtime.ts
var fo = /* @__PURE__ */ new WeakMap(), po = 0, mo = () => `entities-${Date.now().toString(36)}-${(++po).toString(36)}`;
function ho(e) {
	let t = e.document, n = t?.getElementById("vc20564-inspect-ids"), r = t?.getElementById("vc20564-run-delta"), i = t?.getElementById("vc20564-entity-status");
	if (!n || !r || !i) return null;
	let a = fo.get(e);
	if (a) return a;
	let o = !1, s = !1, c = typeof e.indexedDB?.open == "function", l = (e) => {
		s || (i.textContent = e);
	};
	n.disabled = !1, r.disabled = !c, l(c ? "Todavía no se han analizado los IDs. Ningún cambio se aplica automáticamente." : "Puedes analizar los IDs, pero este navegador no permite ensayar el repositorio.");
	let u = () => Ua(e.VC_V1917_TEAM_STATE?.(), mo()), d = () => {
		try {
			let e = u(), t = e.rows.playerEntities.length + e.rows.trainingEntities.length + e.rows.seasonEntities.length;
			return l(`IDs revisados: ${t} entidades aptas y ${e.missingIds + e.duplicatedIds + e.invalidRecords} registros pendientes. ${e.complete ? "Cobertura completa del piloto." : "Cobertura parcial; no se migrarán los registros sin ID."}`), e;
		} catch (e) {
			throw l("No se pudo revisar el estado. Abre un equipo y vuelve a intentarlo."), e;
		}
	}, f = async () => {
		if (s || o || !c) throw Error("Piloto incremental ocupado o no disponible");
		o = !0, r.disabled = !0, n.disabled = !0, l("Comparando los registros individuales. No cierres la pestaña hasta el resultado.");
		try {
			let t = Ia(e.VC_V1917_TEAM_STATE?.(), mo()), n = u(), r = await uo({
				factory: e.indexedDB,
				plan: n
			}), i = u(), a = Ia(e.VC_V1917_TEAM_STATE?.(), mo());
			if (!Wa(n, i) || !La(t, a)) l("La escritura piloto se verificó, pero el club cambió durante la prueba. Repite la comparación.");
			else {
				let e = `${r.added} nuevos, ${r.changed} actualizados, ${r.unchanged} sin cambios, ${r.removed} retirados de la réplica.`;
				l(r.partial ? `Piloto parcial verificado: ${e} ${r.pendingIds} registros no migrados por falta o conflicto de ID.` : `Piloto incremental verificado: ${e} El guardado original sigue intacto.`);
			}
			return r;
		} catch (e) {
			throw l("La prueba incremental no se pudo verificar. El club original sigue siendo la fuente principal."), e;
		} finally {
			o = !1, s || (n.disabled = !1, r.disabled = !c);
		}
	}, p = () => {
		try {
			d();
		} catch {}
	}, m = () => {
		f().catch(() => {});
	};
	n.addEventListener("click", p), r.addEventListener("click", m);
	let h = Object.freeze({
		VERSION: "20.5.64",
		manualOnly: !0,
		authoritative: !1,
		inspect: u,
		run: f,
		dispose() {
			s || (s = !0, n.removeEventListener("click", p), r.removeEventListener("click", m), n.disabled = !0, r.disabled = !0, fo.delete(e), e.VC_CLUB_ENTITY_20564 === h && delete e.VC_CLUB_ENTITY_20564);
		}
	});
	return e.VC_CLUB_ENTITY_20564 = h, fo.set(e, h), h;
}
// src/domain/rally-shadow-runtime.ts
function go(e) {
	let t = e.document, n = t.getElementById("v11-management");
	if (!n) return null;
	if (e.VC_SHADOW_20515) return e.VC_SHADOW_20515;
	let r = Vi();
	r.observe(w(e));
	let i = (e, n = "", r = "") => {
		let i = t.createElement(e);
		return i.className = n, i.textContent = r, i;
	}, a = i("section", "vc20515-shadow");
	a.id = "vc20515-shadow";
	let o = i("div", "vc20515-heading"), s = i("div");
	s.append(i("small", "", "COMPARADOR PASIVO · V20.5.15"), i("h3", "", "Contraste de puntos y deshacer")), o.append(s, i("span", "", "Solo lectura"));
	let c = i("p", "", "Escucha los cambios del motor original y contrasta el último rally con las reglas TypeScript. No interviene en el registro ni en la sincronización."), l = i("p", "vc20515-status", "Esperando nuevos rallies");
	l.setAttribute("role", "status");
	let u = i("div", "vc20515-stats"), d = /* @__PURE__ */ new Map();
	for (let [e, t] of [
		["observed", "Operaciones comparadas"],
		["agree", "Coincidencias"],
		["difference", "Diferencias"],
		["unverified", "Sin verificar"],
		["skipped", "Cambios omitidos"]
	]) {
		let n = i("div");
		n.append(i("small", "", t));
		let r = i("strong", "", "0");
		d.set(e, r), n.append(r), u.append(n);
	}
	let f = i("div", "vc20515-actions"), p = i("button", "", "Actualizar informe");
	p.type = "button";
	let m = i("button", "", "Limpiar contadores");
	m.type = "button", f.append(p, m);
	let h = i("div", "vc20515-recent"), g = {
		score: "Marcador",
		service: "Saque",
		rotation: "Rotación",
		set: "Set",
		match: "Partido",
		actions: "Acciones",
		lineup: "Alineación",
		video: "Vídeo",
		"missing-data": "Datos insuficientes",
		"not-native-undo": "Deshacer no confirmado"
	}, _ = {
		agree: "Coincide",
		difference: "Diferencia",
		unverified: "Sin verificar"
	};
	a.append(o, c, l, u, f, i("h4", "", "Últimas comprobaciones a revisar"), h, i("p", "vc20515-note", "Solo compara nuevos cambios observados desde que abriste la aplicación. Las correcciones, los cambios de partido y los saltos de historial se omiten; una diferencia no demuestra un problema de nube."));
	let v = t.getElementById("vc2059-observable") || t.getElementById("vc2057-committed");
	v?.parentNode === n ? v.insertAdjacentElement("afterend", a) : n.append(a);
	let y = !1, b = !1, x = null, S = () => {
		if (y) return;
		let e = r.snapshot(), t = e.counters;
		a.dataset.state = t.difference ? "review" : t.unverified ? "partial" : "available", l.textContent = t.observed ? t.difference ? `${t.difference} diferencias para revisar` : t.unverified ? `${t.unverified} operaciones sin datos suficientes` : `${t.agree} operaciones coincidentes` : "Esperando nuevos rallies confirmados";
		for (let [e, n] of d) {
			let r = String(t[e]);
			n.textContent !== r && (n.textContent = r);
		}
		if (h.replaceChildren(), !e.recent.length) h.append(i("p", "", "Sin incidencias registradas en esta sesión."));
		else for (let t of e.recent.slice(-6).reverse()) {
			let e = i("div", "vc20515-finding"), n = t.operation === "point" ? "Punto" : "Deshacer";
			e.append(i("strong", "", `${n} · ${_[t.verdict]}`), i("span", "", t.areas.map((e) => g[e] || e).join(", "))), h.append(e);
		}
	}, C = () => {
		y || (r.observe(w(e)), n.classList.contains("active") && S());
	}, T = () => {
		y || b || (b = !0, x = e.setTimeout(() => {
			b = !1, x = null, C();
		}, 0));
	}, E = () => {}, D = !1;
	if (e.VC_STATE_2059) E = e.VC_STATE_2059.subscribe("change", T);
	else {
		D = !0, t.addEventListener("vc:matchstatechange", T);
		try {
			let t = (e.MatchState || e.VC_MATCH_STATE)?.subscribe?.(T);
			typeof t == "function" && (E = t);
		} catch {}
	}
	p.addEventListener("click", S), m.addEventListener("click", () => {
		r.clear(), S();
	});
	let O = typeof MutationObserver == "function" ? new MutationObserver(() => {
		n.classList.contains("active") && S();
	}) : null;
	O?.observe(n, {
		attributes: !0,
		attributeFilter: ["class"]
	}), n.classList.contains("active") && S();
	let k = Object.freeze({
		version: "20.5.15",
		readOnly: !0,
		getReport: r.snapshot,
		clearReport() {
			r.clear(), S();
		},
		dispose() {
			y || (y = !0, x !== null && e.clearTimeout(x), x = null, b = !1, O?.disconnect(), E(), D && t.removeEventListener("vc:matchstatechange", T), r.dispose(), a.remove(), e.VC_SHADOW_20515 === k && delete e.VC_SHADOW_20515);
		}
	});
	return e.VC_SHADOW_20515 = k, k;
}
// src/domain/multi-device-validation.ts
var _o = "20.1.2", vo = "vc-multi-device-validation", yo = (e) => String(e ?? "").trim(), bo = (e) => {
	let t = Number(e);
	return Number.isSafeInteger(t) && t >= 0 ? t : 0;
}, xo = (e) => {
	let t = yo(e);
	return /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/.test(t) && Number.isFinite(Date.parse(t)) ? t : "";
};
function So({ cloud: t = {}, device: n = {}, journal: r = {}, now: i = Date.now() } = {}) {
	let a = e(t) || {}, o = e(n) || {}, s = e(r) || {};
	return {
		schema: vo,
		version: _o,
		createdAt: new Date(i).toISOString(),
		connected: !!a.connected,
		dirty: !!a.dirty,
		blocked: !!a.blockedReason,
		realtimeSubscribed: o.realtimeState === "SUBSCRIBED",
		lastReadAt: bo(a.lastReadAt),
		lastWriteAt: bo(a.lastWriteAt),
		lastReadErrorAt: bo(a.lastReadErrorAt),
		lastObservedRemoteStamp: xo(a.lastObservedRemoteStamp),
		lastAppliedRemoteStamp: xo(a.lastAppliedRemoteStamp),
		lastConfirmedWriteStamp: xo(a.lastConfirmedWriteStamp),
		pendingJournal: typeof s.pendingCount == "number" ? bo(s.pendingCount) : null,
		journalError: !!s.lastError,
		warning: "Mismo origen y cuenta deben comprobarse manualmente. La igualdad de marcas CAS no verifica contenido ni entrega de vídeo."
	};
}
function Co(t) {
	let n = e(typeof t == "string" ? JSON.parse(t) : t);
	if (!n || n.schema !== "vc-multi-device-validation" || n.version !== "20.1.2") throw Error("Informe incompatible: deben ser diagnósticos V20.1.2.");
	if (!Number.isFinite(Date.parse(String(n.createdAt)))) throw Error("Informe sin fecha válida.");
	for (let e of [
		"connected",
		"dirty",
		"blocked",
		"realtimeSubscribed"
	]) if (typeof n[e] != "boolean") throw Error("Campo inválido: " + e);
	if (n.pendingJournal !== null && (!Number.isInteger(n.pendingJournal) || Number(n.pendingJournal) < 0)) throw Error("Diario inválido.");
	return So({
		cloud: n,
		device: { realtimeState: n.realtimeSubscribed ? "SUBSCRIBED" : "" },
		journal: {
			pendingCount: n.pendingJournal,
			lastError: n.journalError
		},
		now: Date.parse(String(n.createdAt))
	});
}
function wo(e, t) {
	let n = Co(e), r = Co(t), i = (e) => e.connected && !e.dirty && !e.blocked && !e.journalError && e.pendingJournal === 0;
	if (!i(n) || !i(r)) return {
		status: "review",
		message: "Alguno de los dispositivos tiene cambios pendientes, está bloqueado o no puede comprobar su diario. No se confirma una entrega."
	};
	let a = [];
	return n.lastConfirmedWriteStamp && n.lastConfirmedWriteStamp === r.lastAppliedRemoteStamp && a.push("La versión subida por el primer dispositivo figura como procesada en el segundo."), r.lastConfirmedWriteStamp && r.lastConfirmedWriteStamp === n.lastAppliedRemoteStamp && a.push("La versión subida por el segundo dispositivo figura como procesada en el primero."), a.length ? {
		status: "matched",
		message: a.join(" ") + " Comparación de marcas, no del contenido ni prueba de la versión más reciente."
	} : {
		status: "unproven",
		message: "No hay una marca de subida de un dispositivo que coincida con una versión procesada en el otro. Realiza una edición de prueba y comprueba ambos informes."
	};
}
// src/domain/multi-device-runtime.ts
var To = /* @__PURE__ */ new WeakMap(), Eo = Object.freeze({
	VERSION: _o,
	SCHEMA: vo,
	report: So,
	parseReport: Co,
	compareReports: wo,
	mount: Oo
});
function Do(e) {
	return e.VC_SYNC_2012 = Eo, Eo;
}
function Oo(e) {
	let t = To.get(e);
	if (t) return t;
	let n = e.document;
	if (!n) return null;
	let r = (e) => n.getElementById(e), i = (e, t = "") => {
		let r = n.createElement(e);
		return r.textContent = t, r;
	}, a = null, o = !1, s = !1, c = !1, l = null, u = "", d = null, f = async () => {
		let t = e.VC_V962_CLOUD_EFFICIENT?.diagnostics?.() || {}, n = e.VC_DEVICE_SYNC?.diagnostics?.() || {}, r = e.VC_V962_CLOUD_EFFICIENT?.getAccountId?.() || "";
		return So({
			cloud: t,
			device: n,
			journal: await e.VC_SYNC_2011_JOURNAL?.inspect?.(r) || {
				pendingCount: null,
				lastError: "Diario sin comprobar"
			}
		});
	}, p = async () => {
		if (!(s || c || !v())) {
			c = !0;
			try {
				let e = await f();
				if (s) return;
				let t = (e, t) => {
					let n = r(e);
					n && n.textContent !== t && (n.textContent = t);
				};
				t("vc2012-observed", e.lastObservedRemoteStamp || "Sin lectura confirmada"), t("vc2012-applied", e.lastAppliedRemoteStamp || "Sin recepción procesada"), t("vc2012-uploaded", e.lastConfirmedWriteStamp || "Sin subida confirmada"), t("vc2012-pending", e.pendingJournal === null ? "Sin comprobar" : String(e.pendingJournal));
				let n = l ? wo(e, l) : null, i = r("vc2012-feedback");
				i && (i.textContent = n ? n.message : u || "Sin comparación. No se han modificado datos.", i.dataset.status = n?.status || "idle");
			} catch {
				if (!s) {
					let e = r("vc2012-feedback");
					e && (e.textContent = "No se pudo leer el estado de validación. Comprueba la conexión y el diario.");
				}
			} finally {
				c = !1;
			}
		}
	}, m = () => void p(), h = async () => {
		if (!s) {
			try {
				let t = JSON.stringify(await f(), null, 2);
				if (s) return;
				let r = URL.createObjectURL(new Blob([t], { type: "application/json" })), i = n.createElement("a");
				i.href = r, i.download = "volley-coach-validacion-dispositivo-v20.1.2.json", n.body.append(i), i.click(), i.remove(), e.setTimeout(() => URL.revokeObjectURL(r), 5e3), u = "Informe descargado. Conserva una copia en cada dispositivo.";
			} catch {
				u = "No se pudo descargar el informe. Comprueba el diario local.";
			}
			p();
		}
	}, g = () => void h(), _ = async (e) => {
		if (s) return;
		let t = e.target?.files?.[0];
		if (t) {
			if (t.size > 65536) u = "Archivo demasiado grande para un informe de validación.", p();
			else {
				try {
					l = Co(await t.text()), u = "Informe del segundo dispositivo cargado para comparar.";
				} catch {
					l = null, u = "El archivo no es un informe V20.1.2 válido.";
				}
				p();
			}
		}
	};
	function v() {
		if (s) return !1;
		if (a?.isConnected) return !0;
		let e = r("vc2012-multi-validation");
		if (e) return a = e, o = !1, !0;
		let t = r("vc16040-sync-modal")?.querySelector(".vc16040-card");
		if (!t) return !1;
		a = i("section"), a.id = "vc2012-multi-validation", a.className = "vc2012-validation", a.innerHTML = "<div class=\"vc2012-heading\"><div><small>V20.1.2 · VALIDACIÓN PC + MÓVIL</small><h3>Comprobar la entrega entre dispositivos</h3></div><span>Solo lectura</span></div>\n    <p>Supabase debe confirmar el envío y el otro dispositivo debe aplicar la misma versión. Realtime conectado no demuestra la recepción.</p>\n    <div class=\"vc2012-versions\"><div><span>Última versión vista en la nube</span><b id=\"vc2012-observed\">—</b></div><div><span>Última versión procesada aquí</span><b id=\"vc2012-applied\">—</b></div><div><span>Última versión subida aquí</span><b id=\"vc2012-uploaded\">—</b></div><div><span>Diario local pendiente</span><b id=\"vc2012-pending\">—</b></div></div>\n    <p class=\"vc2012-instructions\">1. Usa un scouting de prueba. 2. Edita y sincroniza en PC. 3. Abre el mismo partido en móvil y comprueba la edición. 4. Descarga un informe en cada dispositivo. 5. Importa aquí el del otro dispositivo para comparar las versiones.</p>\n    <div class=\"vc2012-actions\"><button id=\"vc2012-export\" type=\"button\">Descargar informe local</button><label class=\"vc2012-import\">Comparar con informe del otro dispositivo<input id=\"vc2012-file\" type=\"file\" accept=\".json,application/json\"/></label><button id=\"vc2012-refresh\" type=\"button\">Actualizar estado</button></div>\n    <p id=\"vc2012-feedback\" class=\"vc2012-result\" role=\"status\">Sin comparación. No se han modificado datos.</p>\n    <p class=\"vc2012-privacy\">No incluye nombres, scoutings, IDs, claves ni vídeos. Comprueba que ambos dispositivos usan la misma cuenta. Un informe no reemplaza la prueba con dos dispositivos físicos.</p>", o = !0;
		let n = r("vc2011-journal-panel") || r("vc200-sync-reliability");
		return n?.parentNode ? n.insertAdjacentElement("afterend", a) : t.appendChild(a), r("vc2012-refresh")?.addEventListener("click", m), r("vc2012-export")?.addEventListener("click", g), r("vc2012-file")?.addEventListener("change", _), !0;
	}
	let y = () => void p(), b = (t) => {
		t.target?.closest?.("#vc154-presence-button,#vc16040-sync-modal") && e.setTimeout(() => void p(), 20);
	}, x = () => {
		if (!s) {
			if (p(), !a && typeof MutationObserver == "function" && n.body) {
				let e = new MutationObserver(() => {
					v() && (d?.disconnect(), d = null, p());
				});
				d = e, e.observe(n.body, {
					childList: !0,
					subtree: !0
				});
			}
			e.addEventListener("vc200:sync-state", y), e.addEventListener("vc2011:journal", y), n.addEventListener("click", b, !0);
		}
	}, S = !1;
	n.readyState === "loading" ? (S = !0, n.addEventListener("DOMContentLoaded", x, { once: !0 })) : x();
	let C = Object.freeze({
		version: "20.5.21",
		readOnly: !0,
		refresh: p,
		dispose() {
			s || (s = !0, S && n.removeEventListener("DOMContentLoaded", x), d?.disconnect(), d = null, e.removeEventListener("vc200:sync-state", y), e.removeEventListener("vc2011:journal", y), n.removeEventListener("click", b, !0), r("vc2012-refresh")?.removeEventListener("click", m), r("vc2012-export")?.removeEventListener("click", g), r("vc2012-file")?.removeEventListener("change", _), o && a?.remove(), a = null, l = null, To.delete(e));
		}
	});
	return To.set(e, C), C;
}
// src/domain/journal-recovery-inspector.ts
var ko = 27262976, $ = (e, t) => Object.freeze({
	version: "20.5.19",
	source: "existing-v2011-pending-checkpoint",
	status: e,
	pendingCount: t,
	requiresManualReview: !0,
	autoResumeAllowed: !1
});
async function Ao(n) {
	if (!n || !n.journal || typeof n.journal.inspect != "function" || typeof n.journal.newest != "function" || !n.accountId || !n.teamId || n.matchId === null || n.matchId === void 0 || !String(n.matchId)) return $("unavailable", null);
	let r = String(n.accountId).trim(), i = String(n.teamId);
	if (!r) return $("unavailable", null);
	let a = null;
	try {
		let o = e(await n.journal.inspect(r)), s = o?.pendingCount;
		if (typeof s != "number" || !Number.isSafeInteger(s) || s < 0) return $("unavailable", null);
		if (a = s, s === 0) return $("no-checkpoint", 0);
		if (s !== 1 || o?.hasOtherAccounts === !0 || o?.lastError) return $("ambiguous", s);
		let c = e(await n.journal.newest(r));
		if (!c || c.accountId !== r || c.status !== "pending" || c.mode !== "draft" && c.mode !== "upload" || typeof c.stateJson != "string" || c.stateJson.length === 0 || c.stateJson.length > ko) return $("unavailable", s);
		let l = e(e(e(JSON.parse(c.stateJson))?.equiposData)?.[i]);
		if (!l || !Array.isArray(l.scoutingMatches)) return $("missing-match", s);
		let u = t(l.scoutingMatches).map(e).filter((e) => e && String(e.id) === String(n.matchId));
		if (u.length !== 1) return $(u.length ? "ambiguous" : "missing-match", s);
		let d = Ki(J(n.before), J(n.after), J(u[0]));
		return $(d === "durable-before" ? "checkpoint-before" : d === "durable-after" ? "checkpoint-after" : d === "unchanged-observed" ? "checkpoint-unchanged" : d === "divergent" ? "checkpoint-divergent" : "unavailable", s);
	} catch {
		return $("unavailable", a);
	}
}
// src/vc2055-entry.ts
if (typeof window < "u" && window.document) {
	Fn(window), Un(window), Kn(window), Qn(window), or(window), hr(window), vr(window), Cr(window), Dr(window), Pr(window), Lr(window), Wr(window), Qr(window), ti(window), ui(window), pi(window), gi(window), yi(window), Ci(window), Ei(window), ki(window), ea(window), sa(window), da(window), ya(window), Sa(window), Da(window), Ma(window), Do(window), Ie(window), rn(window), dn(window), gn(window), ut(window), vt(window), Jt(window), $t(window);
	let e = () => {
		Se(window), nt(window), dt(window), D(window), te(window), he(window), ge(window), Re(window), $e(window), go(window), Oo(window), ro(window), ho(window);
	};
	window.document.readyState === "loading" ? window.document.addEventListener("DOMContentLoaded", e, { once: !0 }) : e();
}
export { Ga as CLUB_PILOT_DB, Na as MAX_CLUB_PARTITION_CHARS, Ra as MAX_ENTITY_ROWS, kt as MAX_INDEXED_CONTACTS, pa as MAX_LOCAL_MATCH_CHARS, ma as MAX_PACKED_STATE_CHARS, On as MAX_SEQUENCE_CHARACTERS, kn as MAX_SEQUENCE_CONTACTS, fa as MAX_STORED_STATE_CHARS, fn as RALLY_SEARCH_PRESETS_KEY, Qi as RALLY_WRITER_VERSION, rt as SEARCH_FILTERS, Tn as applyScoutingDraftRating, wn as applyScoutingDraftSkill, ra as assembleClosedRally, ia as assembleRestoredLiveRally, l as attackEfficiency, me as auditCommittedMatch, o as auditMatchScores, Tr as buildScoutCodeV830, yr as buildScoutingActionBase, Wt as calculateAnalysisPoints, C as canonicalReaders, ga as captureLocalMatchSnapshot, J as captureRecoveryFrame, cn as catalogRallySearch, Wi as changedRecoveryAreas, la as classifyLocalSaveReceipt, j as classifyPreflight, Ki as classifyRecoveryEvidence, Vn as classifyScoutingPreflight, pe as classifyStoredAction, Ri as compareConfirmedPoint, wo as compareDeviceValidation, y as compareNativeCode, xe as createObservableMatchStore, Vi as createRallyShadowSession, Zi as createRallyTransactionPilot, Le as createReadOnlyRenderGate, tt as createScoutingProjectionStore, ee as createShadowSession, En as cycleScoutingDraftRating, Gi as equalRecoveryFrames, Xt as escapeAnalysisCSVCell, Ut as evaluateAnalysisContacts, Zt as exportAnalysisCSV, Ht as filterAnalysis, Mr as finishScoutingCode, Gt as inspectAnalysisCoverage, It as inspectAnalysisIndexDiagnostics, se as inspectClosedRally, v as inspectCodeShape, Ao as inspectJournalRecovery, je as inspectLiveSetStatistics, E as inspectMatchDomain, Yn as inspectNativePreparation, Qe as inspectPlayerBoxscore, ne as inspectRallyRestoration, Wn as inspectRegistrationConditions, Nn as inspectScoutingSequence, S as inspectSubstitution, $t as installAnalysisExportBridge, vt as installAnalysisNormalizeBridge, Jt as installAnalysisOperationsBridge, ut as installAnalysisQueryBridge, rn as installAnalysisViewBridge, Da as installClubLocalStoreBridge, Ma as installClubSnapshotBridge, ea as installLiveRallyWriterBridge, ya as installLocalReadbackBridge, da as installLocalSaveReceiptBridge, ki as installMatchFinalizationBridge, Ci as installMatchManualResultBridge, yi as installMatchVideoOverlayBridge, Do as installMultiDeviceAPI, sa as installRallyRecordBridge, gn as installRallySearchControls, dn as installRallySearchViewBridge, Ei as installRallyVideoBoundsBridge, Kn as installRegistrationGuardBridge, Ie as installRenderMetricsBridge, Cr as installScoutActionBuilderBridge, Wr as installScoutActionMetadataBridge, Qr as installScoutActionNormalizerBridge, ui as installScoutAdvancedFieldsBridge, Pr as installScoutCodeBuilderBridge, Dr as installScoutCodeFormatBridge, pi as installScoutIdentityFieldsBridge, Sa as installScoutIndexedJournalBridge, gi as installScoutMatchVideoContainerBridge, vr as installScoutPlayerResolverBridge, Lr as installScoutRegistrationBridge, ti as installScoutTacticalFieldsBridge, Fn as installScoutingDraftBridge, hr as installScoutingExtensionsBridge, or as installScoutingLexerBridge, Un as installScoutingPreflightBridge, Qn as installScoutingPreparationBridge, Ft as invalidateAnalysisIndex, ir as lexScoutingCode, dt as mountAnalysisQueryPerformance, ho as mountClubEntityPanel, ro as mountClubPilotPanel, he as mountCommittedPanel, D as mountDomainDiagnostic, ge as mountGrammarPanel, Re as mountLiveStatisticsPanel, Oo as mountMultiDevicePanel, Se as mountObservablePanel, $e as mountPlayerBoxscore, go as mountRallyShadowPanel, nt as mountScoutingProjectionStore, te as mountShadowPanel, s as nextRotation, Hr as normalizeActionVideoTimestamp, ci as normalizeAdvancedScoutingFields, gt as normalizeAnalysisMatch, V as normalizeAnalysisZone, wr as normalizeContactMetadata, Di as normalizeMatchFinalizationFields, xi as normalizeMatchManualResult, _i as normalizeMatchVideoOverlay, ot as normalizeRallySearchFilters, wi as normalizeRallyVideoBounds, Xr as normalizeScoutingActionBase, di as normalizeScoutingIdentityFields, mi as normalizeScoutingMatchVideoContainer, $r as normalizeTacticalActionFields, xr as opponentScoutingPlayerFields, br as ownScoutingPlayerFields, Co as parseDeviceValidation, K as parseScoutingDraftHead, uo as pilotClubEntityDelta, Qa as pilotClubPartitions, ae as planAwardPoint, Ua as planClubEntities, Ia as planClubPartitions, oe as planUndoLastRally, Fr as prepareContactRegistration, Xn as prepareNativeScoutingAction, jr as prepareScoutingCodeInput, Br as projectDataVolleyFields, be as projectObservableMatch, c as projectPoint, N as projectSetBoundary, st as queryRallies, Vr as readActionVideoTime, T as readCanonicalLiveActions, w as readCanonicalMatch, mn as readRallySearchPresets, Dn as recentScoutingDraftCodes, Kt as reconcileAnalysisPoints, $a as removeClubPilot, tn as renderDataEngineView, ln as renderRallySearchView, So as reportDeviceValidation, gr as resolveOwnScoutingPlayer, Wa as sameClubEntityData, La as sameClubPartitionPlan, aa as sameRallyRecord, pr as scanAdvancedExtension, fr as scanConeExtension, dr as scanSubzoneExtension, Aa as serializeClubIndependentLibrary, ka as serializeClubSnapshot, u as sideOutBreakPoint, a as verifyRallyScore, _a as verifyStoredLocalMatch, Ta as writeClubLocalState, ba as writeScoutJournalTransaction };
