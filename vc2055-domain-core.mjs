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
// src/domain/runtime.ts
function T(n) {
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
function E(e) {
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
	let g = () => T(w(e)), _ = (e) => e === null ? "—" : `${e}%`, y = () => {
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
	let E = () => {}, D = !1;
	if (e.VC_STATE_2059) {
		let t = [
			e.VC_STATE_2059.subscribe("score", C),
			e.VC_STATE_2059.subscribe("court", C),
			e.VC_STATE_2059.subscribe("rally", C),
			e.VC_STATE_2059.subscribe("status", C)
		];
		E = () => t.forEach((e) => e());
	} else {
		D = !0, t.addEventListener("vc:matchstatechange", C);
		try {
			let t = e.MatchState?.subscribe?.(C);
			typeof t == "function" && (E = t);
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
			x || (x = !0, O?.disconnect(), E(), D && t.removeEventListener("vc:matchstatechange", C), i.remove(), e.VC_DOMAIN_2055 === k && delete e.VC_DOMAIN_2055);
		}
	});
	return e.VC_DOMAIN_2055 = k, k;
}
// src/domain/shadow-validation.ts
var D = 80, O = (e) => e === "v800-code" ? "directo" : e === "v113-video-code" ? "video" : "otro", k = (e) => v(e);
function A(t) {
	let n = e(t), r = k(n?.code), i = O(n?.source), a = e(n?.nativeShape), o = {
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
			let c = A(s);
			return e++, c.kind === "agree" ? t++ : c.kind === "difference" ? n++ : c.kind === "coverage-gap" ? r++ : c.kind === "native-reject" ? i++ : a++, c.kind !== "agree" && (o.push(c), o.length > D && o.shift()), c;
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
var j = () => Object.freeze({
	state: "unknown",
	target: null,
	setFinished: null,
	matchFinished: null,
	setWinner: null
});
function M(r, a) {
	let o = e(r), s = i(a);
	if (!o || !s) return j();
	let c = Number(o.currentSet);
	if (!Number.isInteger(c) || c < 1 || c > 5) return j();
	let l = t(o.sets).map(e).find((e) => e && Number(e.number) === c);
	if (!l) return j();
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
			if (!n(t.winner)) return j();
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
function N(t) {
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
var P = (e, t, a, o) => {
	let s = i(e);
	return s && n(t) && r(a) && r(o) ? Object.freeze({
		score: s,
		serving: t,
		rotationUs: a,
		rotationOpponent: o
	}) : null;
}, F = (e, t, n = null, r = null, i = null, a = null) => Object.freeze({
	kind: e,
	state: t === "ready" ? "projected" : t === "finished" ? "blocked" : "unknown",
	reason: t,
	before: n,
	after: r,
	setBoundary: i,
	restoration: a,
	includesLineups: !1,
	readOnly: !0
}), ne = (n) => t(n.sets).map(e).find((e) => e && Number(e.number) === Number(n.currentSet) && Number.isInteger(Number(n.currentSet))) || null, re = (e, t) => e.us === t.us && e.opponent === t.opponent;
function I(t, r) {
	let a = e(t);
	if (!a) return F("award-point", "no-match");
	if (a.status === "finished") return F("award-point", "finished");
	let o = ne(a);
	if (!o) return F("award-point", "no-set");
	if (o.finished === !0) return F("award-point", "finished");
	let s = i({
		us: o.scoreUs,
		opponent: o.scoreOpponent
	}), l = e(e(a.liveRally)?.startSnapshot), u = P(s, l ? l.servingBefore : a.servingTeam, l ? l.rotationBefore : a.rotationNo, l ? l.opponentRotationBefore : a.opponentRotationNo);
	if (!u || !n(r)) return F("award-point", "invalid-data");
	if (l) {
		let e = i(l.scoreBefore);
		if (!e || !re(e, u.score) || l.servingBefore !== a.servingTeam || l.rotationBefore !== a.rotationNo || l.opponentRotationBefore !== a.opponentRotationNo) return F("award-point", "stale-score", u);
	}
	let d = c({
		score: u.score,
		serving: u.serving,
		rotationUs: u.rotationUs,
		rotationOpponent: u.rotationOpponent
	}, r), f = P(d.score, d.serving, d.rotationUs, d.rotationOpponent);
	return f ? F("award-point", "ready", u, f, M(a, f.score)) : F("award-point", "invalid-data", u);
}
function ie(n) {
	let r = e(n);
	if (!r) return F("undo-last-rally", "no-match");
	if (r.status === "finished") return F("undo-last-rally", "finished");
	let o = ne(r);
	if (!o) return F("undo-last-rally", "no-set");
	let s = t(o.rallies), c = e(s[s.length - 1]);
	if (!c) return F("undo-last-rally", "no-rallies");
	let l = P(i({
		us: o.scoreUs,
		opponent: o.scoreOpponent
	}), r.servingTeam, r.rotationNo, r.opponentRotationNo), u = P(c.scoreBefore, c.servingBefore, c.rotationBefore, c.opponentRotationBefore);
	if (!l || !u || a(c).state !== "verified") return F("undo-last-rally", "invalid-data", l);
	let d = i(c.scoreAfter);
	return !d || !re(d, l.score) ? F("undo-last-rally", "stale-score", l) : F("undo-last-rally", "ready", l, u, null, N(c));
}
function ae(t, o = null) {
	let s = e(t), l = e(o), u = a(s), d = "unknown", f = "unknown", p = i(l?.scoreBefore);
	u.after && p && (d = re(u.after, p) ? "match" : "mismatch");
	let m = P(s?.scoreBefore, s?.servingBefore, s?.rotationBefore, s?.opponentRotationBefore);
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
var oe = 2e4, L = 6e4, se = 80, ce = /* @__PURE__ */ new Set([
	"S",
	"R",
	"E",
	"A",
	"B",
	"D",
	"F",
	"C"
]), le = (e) => typeof e == "string" && ce.has(e) ? e : "—", ue = {
	difference: "El código guardado y los campos de la acción no coinciden.",
	"coverage-gap": "El código guardado utiliza sintaxis todavía no cubierta por TypeScript.",
	unverified: "Faltan campos del registro para comprobarlo con seguridad.",
	"no-code": "La acción está registrada sin código original.",
	score: "El ganador no concuerda con el cambio de marcador registrado.",
	"score-sequence": "El tanteo final y el inicial del siguiente rally no coinciden.",
	rotation: "La siguiente rotación o el turno de saque no concuerdan con la proyección básica."
};
function de(t) {
	let r = e(t), i = le(r?.skill);
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
		skill: le(o.skill) || i
	});
	if (!n(r.team) || !ce.has(String(r.skill)) || ![
		"#",
		"+",
		"!",
		"-",
		"/",
		"="
	].includes(String(r.evaluation)) || r.playerNumberSnapshot === null || r.playerNumberSnapshot === void 0 || String(r.playerNumberSnapshot).trim() === "") return Object.freeze({
		kind: "unverified",
		skill: le(o.skill)
	});
	let s = y(a, { action: r });
	return Object.freeze({
		kind: s.state === "agree" ? "agree" : s.state === "disagree" ? "difference" : "unverified",
		skill: le(o.skill)
	});
}
function fe(n) {
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
			skill: le(n),
			reason: ue[e]
		})), a.length > se && a.shift();
	}, c = (e, t) => {
		if (i.actions >= L) return o = !0, !1;
		i.actions++;
		let n = de(e);
		return n.kind === "agree" ? i.agree++ : n.kind === "difference" ? i.difference++ : n.kind === "coverage-gap" ? i.coverageGap++ : n.kind === "no-code" ? i.noCode++ : i.unverified++, n.kind !== "agree" && s(n.kind, t, n.skill), !0;
	}, l = t(r?.sets);
	main: for (let n = 0; n < l.length; n++) {
		let r = e(l[n]);
		if (!r) continue;
		let a = t(r.rallies);
		for (let r = 0; r < a.length; r++) {
			if (i.rallies >= oe) {
				o = !0;
				break main;
			}
			let l = e(a[r]);
			if (!l) continue;
			i.rallies++;
			let u = `S${n + 1} · R${r + 1}`, d = e(a[r + 1]), f = ae(l, d);
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
function pe(e) {
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
		let e = fe(x());
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
function me(e) {
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
var he = (e) => typeof e == "number" && Number.isSafeInteger(e) && e >= 0 ? e : null, ge = (e) => typeof e == "number" && Number.isSafeInteger(e) && e > 0 ? e : null, _e = (e, t) => Object.keys(e).every((n) => Object.is(e[n], t[n]));
function ve(i, a) {
	let o = e(i), s = ge(o?.currentSet), c = t(o?.sets), l = e(a) || e(c.find((t) => e(t)?.number === s)), u = o?.status === "live" || o?.status === "finished" ? o.status : null;
	return Object.freeze({
		score: Object.freeze({
			set: s,
			us: he(l?.scoreUs),
			opponent: he(l?.scoreOpponent)
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
function ye(t) {
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
			return ve(t, r);
		} catch {}
		return ve(null);
	}, o = a(), s = !1, c = !1, l = !1, u = 0, d = 0, f = 0, p = (e = !1) => {
		if (s) return;
		let t = a(), r = n.filter((e) => !_e(o[e], t[e]));
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
function be(e) {
	let t = e.document, n = t.getElementById("v11-management");
	if (!n) return null;
	if (e.VC_STATE_2059) return e.VC_STATE_2059;
	let r = ye(e), i = (e, n = "", r = "") => {
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
var xe = 3e3, Se = 25e3, Ce = (e, t) => t ? Math.round(e / t * 100) : null, we = () => ({
	receptions: 0,
	perfect: 0,
	positive: 0,
	attacks: 0,
	kills: 0,
	errors: 0,
	blocked: 0
}), Te = (t, n) => {
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
}, Ee = (e) => Object.freeze({
	attempts: e.receptions,
	perfect: e.perfect,
	positive: e.positive,
	positivePct: Ce(e.positive, e.receptions),
	perfectPct: Ce(e.perfect, e.receptions)
}), De = (e) => Object.freeze({
	attempts: e.attacks,
	kills: e.kills,
	errors: e.errors,
	blocked: e.blocked,
	efficiencyPct: Ce(e.kills - e.errors - e.blocked, e.attacks)
}), Oe = (e, t) => Object.freeze({
	attempts: e,
	successes: t,
	percent: Ce(t, e)
});
function ke(r) {
	let i = e(r), a = Number.isSafeInteger(i?.currentSet) && Number(i?.currentSet) > 0 ? Number(i?.currentSet) : null, o = e(t(i?.sets).find((t) => a !== null && e(t)?.number === a)), s = t(o?.rallies), c = we(), l = we(), u = 0, d = 0, f = 0, p = 0, m = 0, h = 0, g = !1;
	if (o) for (let r of s) {
		if (m >= xe) {
			g = !0;
			break;
		}
		let i = e(r);
		if (m++, !i) continue;
		let a = i.winner, o = i.servingBefore;
		n(a) && n(o) && (o === "opponent" ? (u++, a === "ours" && d++) : (f++, a === "ours" && p++));
		for (let e of t(i.actions)) {
			if (h >= Se) {
				g = !0;
				break;
			}
			h++, Te(c, e);
		}
		if (g) break;
	}
	let _ = t(e(i?.liveRally)?.actions);
	for (let e of _.slice(0, Se)) Te(l, e);
	_.length > Se && (g = !0);
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
		sideOut: Oe(u, d),
		breakPoint: Oe(f, p),
		reception: Ee(c),
		attack: De(c),
		provisional: Object.freeze({
			actions: _.length,
			receptions: l.receptions,
			attacks: l.attacks,
			reception: Ee(v),
			attack: De(v)
		})
	});
}
// src/state/render-performance.ts
var Ae = [
	"scouting-live",
	"scouting-boxscore",
	"data-engine",
	"rally-search"
], je = /* @__PURE__ */ new WeakMap(), Me = () => ({
	requests: 0,
	rendered: 0,
	skipped: 0,
	failures: 0,
	lastMs: 0,
	maxMs: 0,
	averageMs: 0
}), Ne = (e) => Number.isFinite(e) && e >= 0 ? Math.round(e * 100) / 100 : 0;
function Pe(e) {
	let t = je.get(e);
	if (t) return t;
	let n = new Map(Ae.map((e) => [e, Me()])), r = Object.freeze({
		VERSION: "20.5.28",
		readOnly: !0,
		observe(e, t, r = 0) {
			let i = n.get(e);
			i && (i.requests++, t === "skip" ? i.skipped++ : t === "error" ? i.failures++ : (i.rendered++, i.lastMs = Ne(r), i.averageMs += (i.lastMs - i.averageMs) / i.rendered, i.maxMs = Math.max(i.maxMs, i.lastMs)));
		},
		diagnostics: () => {
			let e = {};
			for (let t of Ae) {
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
	return je.set(e, r), e.VC_RENDER_METRICS_20528 = r, r;
}
function Fe(e) {
	let t = null, n = -Infinity, r = Me(), i = e.staleAfterMs ?? 5e3, a = () => {
		let t = e.now();
		return Number.isFinite(t) ? t : Date.now();
	};
	return Object.freeze({
		render(o, s, c = !1) {
			let l = a();
			if (r.requests++, !c && t === o && l - n < i) return r.skipped++, e.report?.("skip", 0), !1;
			try {
				return s(), t = o, n = a(), r.rendered++, r.lastMs = Ne(n - l), r.maxMs = Math.max(r.maxMs, r.lastMs), r.averageMs += (r.lastMs - r.averageMs) / r.rendered, e.report?.("render", r.lastMs), !0;
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
function Ie(e) {
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
	let f = !1, p = !1, m = null, h = Pe(e), g = Fe({
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
		let r = n ? n.getLiveStatistics() : ke(w(e));
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
var Le = 2e4, Re = 6e4, ze = 80, Be = /* @__PURE__ */ new Set([
	"#",
	"+",
	"!",
	"-",
	"/",
	"="
]), Ve = () => ({
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
}), He = (e, t) => t ? Math.round(e / t * 100) : null, Ue = (e) => {
	if (typeof e == "number" && Number.isSafeInteger(e) && e > 0) return e;
	if (typeof e == "string" && /^\d{1,15}$/.test(e)) {
		let t = Number(e);
		return Number.isSafeInteger(t) && t > 0 ? t : null;
	}
	return null;
}, We = (e) => {
	let t = typeof e == "number" && Number.isSafeInteger(e) ? String(e) : typeof e == "string" ? e.trim() : "";
	return /^\d{1,3}$/.test(t) ? t : null;
}, Ge = (e) => typeof e == "string" ? e.trim().slice(0, 50) : "";
function Ke(e, t) {
	let n = Ue(e.playerId), r = Ge(e.opponentPlayerUid), i = We(e.playerNumberSnapshot), a = Ge(e.playerLabel), o = We((a.match(/^#?\s*(\d{1,3})(?:\D|$)/) || [])[1]), s = i || (t === "opponent" ? o : null), c = Ge(e.playerNameSnapshot) || a.replace(/^#?\s*\d{1,3}\s*[·-]?\s*/, "") || "", l = t === "ours" && n !== null ? `id:${n}` : t === "opponent" && r ? `uid:${r}` : s === null ? "unidentified" : `num:${s}`;
	return {
		key: l,
		number: s,
		name: l === "unidentified" ? "Sin identificar" : c,
		identified: l !== "unidentified"
	};
}
var qe = (e, t) => {
	let n = t.skill, r = t.evaluation;
	return !Be.has(String(r)) || ![
		"S",
		"R",
		"A",
		"B",
		"D",
		"E"
	].includes(String(n)) ? !1 : (e.actions++, n === "S" ? (e.s++, r === "#" && e.aces++, r === "=" && e.sErrors++) : n === "R" ? (e.r++, r === "#" && e.rPerfect++, (r === "#" || r === "+") && e.rPositive++) : n === "A" ? (e.a++, r === "#" && e.kills++, r === "=" && e.aErrors++, r === "/" && e.blocked++) : n === "B" ? (e.b++, r === "#" && e.bPoints++) : n === "D" ? e.d++ : n === "E" && e.e++, !0);
}, Je = (e) => Object.freeze({
	attempts: e.a,
	kills: e.kills,
	errors: e.aErrors,
	blocked: e.blocked,
	efficiencyPct: He(e.kills - e.aErrors - e.blocked, e.a)
}), Ye = (e, t) => Object.freeze({
	attempts: e,
	won: t,
	percent: He(t, e)
});
function Xe(i, a) {
	let o = e(i), s = a.team === "opponent" ? "opponent" : "ours", c = a.scope === "match" ? "match" : "current", l = r(a.rotation) ? a.rotation : null, u = Object.freeze({
		team: s,
		scope: c,
		rotation: l
	}), d = Ue(o?.currentSet), f = t(o?.sets), p = c === "match" ? f : f.filter((t) => d !== null && Ue(e(t)?.number) === d), m = !!o && p.some((t) => !!e(t)), h = /* @__PURE__ */ new Map(), g = /* @__PURE__ */ new Map(), _ = Ve();
	for (let e of [
		1,
		2,
		3,
		4,
		5,
		6
	]) g.set(e, {
		...Ve(),
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
			if (v >= Le) {
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
				if (y >= Re) {
					C = !0;
					break main;
				}
				y++;
				let t = e(n);
				if (!t || t.team !== s || (c === null && S++, c !== null && qe(g.get(c), t), l !== null && c !== l)) continue;
				let r = Ke(t, s), i = r.key, a = h.get(i);
				!a && h.size >= ze ? (w = !0, qe(_, t) && (b++, r.identified || x++)) : (a || (a = {
					...Ve(),
					...r
				}, h.set(i, a)), !a.number && r.number && (a.number = r.number), !a.name && r.name && (a.name = r.name), qe(a, t) && (b++, a.identified || x++));
			}
		}
	}
	let T = [...h.values()].filter((e) => e.actions > 0).sort((e, t) => e.identified === t.identified ? (e.number === null ? Infinity : Number(e.number)) - (t.number === null ? Infinity : Number(t.number)) || e.name.localeCompare(t.name, "es") || e.key.localeCompare(t.key) : e.identified ? -1 : 1).slice(0, ze).map((e) => Object.freeze({
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
			positivePct: He(e.rPositive, e.r),
			perfectPct: He(e.rPerfect, e.r)
		}),
		attack: Je(e),
		block: Object.freeze({
			attempts: e.b,
			points: e.bPoints
		}),
		digs: e.d,
		sets: e.e
	})), E = [...g.values()].map((e) => Object.freeze({
		rotation: e.rotation,
		rallies: e.rallies,
		sideOut: Ye(e.so, e.soWon),
		breakPoint: Ye(e.bp, e.bpWon),
		attack: Je(e)
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
function Ze(e) {
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
	let y = !1, b = !1, x = null, S = Pe(e), C = Fe({
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
		let i = r ? r.getPlayerBoxscore(n) : Xe(w(e), n);
		return x = i, T() && k(i, t), i;
	}, ee = () => A(!0), te = a.subscribe("change", () => {
		y || b || !T() || (b = !0, Promise.resolve().then(() => {
			b = !1, !y && T() && A();
		}));
	}), j = () => A(!0);
	for (let e of [
		d,
		f,
		p
	]) e.addEventListener("change", j);
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
		refresh: ee,
		dispose() {
			if (!y) {
				y = !0, M?.disconnect(), te();
				for (let e of [
					d,
					f,
					p
				]) e.removeEventListener("change", j);
				C.invalidate(), n.replaceChildren(), x = null, e.VC_PLAYER_BOXSCORE_20511 === N && delete e.VC_PLAYER_BOXSCORE_20511;
			}
		}
	});
	return e.VC_PLAYER_BOXSCORE_20511 = N, N;
}
// src/state/scouting-projections.ts
var Qe = 8;
function $e(e, t) {
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
			return n ? (c++, n) : (n = ke(w(e)), s++, n);
		},
		getPlayerBoxscore(t) {
			if (u) throw Error("La vista de scouting está cerrada.");
			let n = t.team === "opponent" ? "opponent" : "ours", a = t.scope === "match" ? "match" : "current", o = r(t.rotation) ? t.rotation : null, l = `${n}:${a}:${o ?? 0}`, d = i.get(l);
			if (d) return c++, d;
			let f = Xe(w(e), {
				team: n,
				scope: a,
				rotation: o
			});
			if (s++, i.size >= Qe) {
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
function et(e) {
	if (e.VC_SCOUT_PROJECTIONS_20522) return e.VC_SCOUT_PROJECTIONS_20522;
	let t = e.VC_STATE_2059;
	if (!t) return null;
	let n = $e(e, t);
	return e.VC_SCOUT_PROJECTIONS_20522 = n, n;
}
// src/state/analysis-query.ts
var tt = Object.freeze([
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
]), R = (e) => String(e ?? "").trim(), nt = (e) => Array.isArray(e) ? e : [], z = (e) => R(e).toLocaleLowerCase("es"), rt = (e) => e === "ours" || e === "opponent" ? e : null;
function it(e) {
	let t = e || {};
	return Object.fromEntries(tt.map((e) => [e, R(t[e]).slice(0, e === "code" ? 100 : 80)]));
}
function at(e, t = {}) {
	let n = it(t), r = rt(t.team), i = R(t.set), a = R(t.rotation), o = R(t.phase).toUpperCase(), s = z(n.code), c = !!(s || n.skill || n.player || n.evaluation || n.startZone || n.endZone || n.video), l = !!(n.setter || n.attacker || n.tempo || n.combo), u = l || !!n.reception, d = [], f = /* @__PURE__ */ new Map(), p = /* @__PURE__ */ new Map(), m = /* @__PURE__ */ new Map();
	for (let t of nt(e?.chains)) m.has(t.rallyKey) || m.set(t.rallyKey, []), m.get(t.rallyKey).push(t);
	let h = (e) => e && (!r || e.team === r) && (!n.skill || e.skill === n.skill) && (!n.evaluation || e.evaluation === n.evaluation) && (!n.player || z(e.player) === z(n.player)) && (!s || [
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
	].some((e) => z(e).includes(s))) && (!n.startZone || e.fields?.startZone?.code === n.startZone.toUpperCase().replace(/^([^Z])/, "Z$1")) && (!n.endZone || e.fields?.endZone?.code === n.endZone.toUpperCase().replace(/^([^Z])/, "Z$1")) && (!n.video || (n.video === "yes" ? !!e.video : !e.video)), g = (e) => e && (!r || e.team === r) && (!n.setter || z(e.setter?.player) === z(n.setter)) && (!n.attacker || z(e.attack?.player) === z(n.attacker)) && (!n.tempo || z(e.tempo || e.attack?.fields?.attackTempo) === z(n.tempo)) && (!n.combo || z(e.combo) === z(n.combo)) && (!n.reception || e.reception?.evaluation === n.reception);
	for (let t of nt(e?.rallies)) {
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
		let t = R(e.skill) || "?", n = R(e.player) || "Sin identificar";
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
		matchId: R(e?.matchId)
	};
}
// src/state/analysis-query-runtime.ts
var ot = /* @__PURE__ */ new WeakMap(), st = /* @__PURE__ */ new WeakMap();
function ct(e) {
	let t = ot.get(e);
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
				return at(e, t);
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
	return ot.set(e, l), e.VC_ANALYSIS_QUERY_20523 = l, l;
}
function lt(e) {
	let t = st.get(e);
	if (t) return t;
	let n = e.document, r = n.getElementById("v11-management");
	if (!r) return null;
	let i = n.getElementById("vc60-diagnostics"), a = i || r, o = e.VC_ANALYSIS_QUERY_20523 || ct(e), s = (e, t = "", r = "") => {
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
	let O = s("h4", "vc20524-subheading", "Vista Data Engine migrada a TypeScript"), k = s("p", "", "Plantilla de lectura sin cambios de datos. La interfaz histórica sigue disponible si el módulo nuevo falla."), A = s("div", "vc20523-values"), ee = /* @__PURE__ */ new Map();
	for (let [e, t] of [
		["renders", "Plantillas TypeScript"],
		["average", "Media"],
		["slow", "Más de 16 ms"],
		["failures", "Errores de plantilla"]
	]) {
		let n = s("div");
		n.append(s("small", "", t));
		let r = s("strong", "", "—");
		n.append(r), A.append(n), ee.set(e, r);
	}
	let te = s("h4", "vc20524-subheading", "Vista Rally Search Pro migrada a TypeScript"), j = s("p", "", "La plantilla de filtros, catálogos y secuencias se genera con Vite. Las búsquedas guardadas, los clips de vídeo y el CSV conservan sus controles históricos."), M = s("div", "vc20523-values"), N = /* @__PURE__ */ new Map();
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
	let P = s("h4", "vc20524-subheading", "Controles Rally Search Pro migrados a TypeScript"), F = s("p", "", "Controladores de filtros, presets y exportación; solo recuentos locales. Las búsquedas guardadas siguen en la misma clave del navegador."), ne = s("div", "vc20523-values"), re = /* @__PURE__ */ new Map();
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
		n.append(r), ne.append(n), re.set(e, r);
	}
	let I = s("button", "vc20523-refresh", "Actualizar medición");
	I.type = "button";
	let ie = s("p", "vc20523-note", "El umbral de 16 ms es orientativo. La memoria del índice es una estimación mínima de referencias, NO memoria real atribuible al módulo. El heap JS, cuando exista, corresponde al navegador completo. No se guardan códigos, nombres ni partidos en este diagnóstico.");
	c.append(l, d, s("h4", "vc20524-subheading", "Búsqueda táctica"), f, m, h, _, v, b, x, C, w, T, O, k, A, te, j, M, P, F, ne, I, ie);
	let ae = n.getElementById(i ? "vc60-stat-grid" : "vc2059-observable");
	ae?.parentNode === a ? ae.insertAdjacentElement("afterend", c) : a.append(c);
	let oe = !1, L = (e) => `${e.toFixed(2)} ms`, se = () => {
		if (oe) return;
		let t = o.diagnostics(), n = {
			queries: String(t.queries),
			last: L(t.lastMs),
			average: L(t.averageMs),
			max: L(t.maxMs),
			slow: String(t.slowQueries),
			failures: String(t.failures)
		};
		for (let [e, t] of Object.entries(n)) {
			let n = p.get(e);
			n && n.textContent !== t && (n.textContent = t);
		}
		let r = e.VC_ANALYSIS_NORMALIZE_20524?.diagnostics?.(), i = {
			normalizations: String(r?.normalizations ?? 0),
			last: L(r?.lastMs ?? 0),
			average: L(r?.averageMs ?? 0),
			max: L(r?.maxMs ?? 0),
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
			average: L(a?.averageMs ?? 0),
			slow: String(a?.slowOperations ?? 0),
			failures: String(a?.failures ?? 0)
		};
		for (let [e, t] of Object.entries(s)) {
			let n = y.get(e);
			n && n.textContent !== t && (n.textContent = t);
		}
		let c = e.VC_ANALYSIS_CSV_20526?.diagnostics?.(), l = e.VC_ANALYSIS_CSV_20526?.indexDiagnostics?.(), u = e.performance?.memory?.usedJSHeapSize, d = typeof u == "number" && Number.isFinite(u) && u >= 0 ? `${(u / 1048576).toFixed(1)} MiB` : "No disponible", f = {
			exports: String(c?.exports ?? 0),
			last: L(c?.lastMs ?? 0),
			average: L(c?.averageMs ?? 0),
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
			let t = m?.areas[e], n = t ? `${t.rendered} dibujadas · ${t.skipped} evitadas · media ${L(t.averageMs)} · ${t.failures} errores` : "Sin mediciones todavía", r = D.get(e);
			r && r.textContent !== n && (r.textContent = n);
		}
		let h = e.VC_ANALYSIS_VIEW_20529?.diagnostics?.(), _ = {
			renders: String(h?.renders ?? 0),
			average: L(h?.averageMs ?? 0),
			slow: String(h?.slowRenders ?? 0),
			failures: String(h?.failures ?? 0)
		};
		for (let [e, t] of Object.entries(_)) {
			let n = ee.get(e);
			n && n.textContent !== t && (n.textContent = t);
		}
		let v = e.VC_RALLY_VIEW_20530?.diagnostics?.(), b = {
			renders: String(v?.renders ?? 0),
			average: L(v?.averageMs ?? 0),
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
			let t = String(x?.[e] ?? 0), n = re.get(e);
			n && n.textContent !== t && (n.textContent = t);
		}
	};
	I.addEventListener("click", se), se();
	let ce = Object.freeze({
		readOnly: !0,
		refresh: se,
		dispose() {
			oe || (oe = !0, I.removeEventListener("click", se), c.remove(), st.delete(e));
		}
	});
	return st.set(e, ce), ce;
}
// src/state/analysis-normalizer.ts
var ut = /* @__PURE__ */ new Set([
	"S",
	"R",
	"E",
	"A",
	"B",
	"D",
	"F",
	"C"
]), dt = /* @__PURE__ */ new Set([
	"#",
	"+",
	"!",
	"-",
	"/",
	"="
]), B = (e) => String(e ?? "").trim(), V = (e) => e != null && B(e) !== "", ft = (e) => encodeURIComponent(B(e));
function H(e) {
	let t = B(e).toUpperCase().match(/^Z?([1-9])([ABCD])?$/);
	return t ? {
		zone: Number(t[1]),
		quadrant: t[2] || null,
		code: "Z" + t[1] + (t[2] || "")
	} : null;
}
var pt = (e) => B(e.playerNameSnapshot || e.playerLabel || e.playerNumberSnapshot || e.playerId || e.playerNumber);
function mt(r) {
	let i = [], a = [], o = [], s = [], c = [], l = e(r), u = B(l?.id), d = /* @__PURE__ */ new Set();
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
			let l = e(f) || {}, p = V(l.id) ? B(l.id) : null;
			p && h.has(p) && i.push({
				type: "duplicate-rally",
				set: m,
				index: d + 1,
				message: "Identificador de rally repetido"
			}), p && h.add(p);
			let g = [
				ft(u),
				m,
				p ? "id:" + ft(p) : "pos:" + d
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
				let t = e(s) || {}, c = n(t.team) ? t.team : null, l = B(t.skill).toUpperCase(), f = B(t.evaluation), p = V(t.id) ? B(t.id) : null;
				p && S.has(p) && i.push({
					type: "duplicate-action",
					key: g,
					index: a,
					message: "Acción duplicada dentro del rally"
				}), p && S.add(p);
				let h = {
					startZone: H(t.startZone),
					endZone: H(t.endZone),
					contactZone: H(t.contactZone),
					setTarget: H(t.setTarget),
					tempo: B(t.setTempo),
					attackTempo: B(t.attackTempo),
					combo: B(t.attackCombo),
					setterCall: B(t.setterCall),
					direction: B(t.attackDirection),
					blockers: V(t.blockers) ? B(t.blockers) : "",
					serveType: B(t.serveType),
					subtype: B(t.skillSubtype),
					receivedServeType: B(t.receivedServeType),
					dvSetType: B(t.dvSetType),
					attackCode: B(t.attackCode),
					endCone: B(t.endCone),
					specialCode: B(t.specialCode),
					blockTargetNumber: B(t.blockTargetNumber),
					startCoordinate: V(t.startCoordinate) ? t.startCoordinate : null,
					endCoordinate: V(t.endCoordinate) ? t.endCoordinate : null,
					contactCoordinate: V(t.contactCoordinate) ? t.contactCoordinate : null
				}, _ = [
					"videoTime",
					"videoTimestamp",
					"liveVideoTime",
					"videoAction"
				].some((e) => V(t[e]) && Number.isFinite(Number(t[e])) && Number(t[e]) >= 0), v = {
					key: g + "|" + (p ? "id:" + ft(p) : "pos:" + a),
					rallyKey: g,
					matchId: u,
					set: m,
					rallyIndex: d + 1,
					actionIndex: a,
					nativeId: p,
					team: c,
					code: B(t.code),
					skill: ut.has(l) ? l : null,
					skillRaw: l,
					evaluation: dt.has(f) ? f : null,
					evaluationRaw: f,
					player: pt(t) || null,
					fields: h,
					video: _,
					scoutMs: Number.isFinite(Number(t.scoutMs)) && V(t.scoutMs) ? Number(t.scoutMs) : null,
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
				]) V(t[e]) && !h[e] && i.push({
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
var ht = /* @__PURE__ */ new WeakMap();
function gt(e) {
	let t = ht.get(e);
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
				return mt(e);
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
	return ht.set(e, l), e.VC_ANALYSIS_NORMALIZE_20524 = l, l;
}
// src/state/analysis-index.ts
var _t = /* @__PURE__ */ new WeakMap(), vt = 0, yt = 0, bt = 0, xt = 0, St = 0, Ct = 0, wt = 0, Tt = 0, Et = 0, Dt = 4e4;
function Ot(e) {
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
	return wt = _, Tt = Math.max(Tt, _), vt++, n || xt++, {
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
function kt(e) {
	let t = _t.get(e);
	if (t && t.contactsRef === e.contacts && t.ralliesRef === e.rallies && t.possessionsRef === e.possessions && t.chainsRef === e.chains && t.lengths[0] === e.rallies.length && t.lengths[1] === e.contacts.length && t.lengths[2] === e.possessions.length && t.lengths[3] === e.chains.length) return yt++, t;
	t && (bt++, _t.delete(e));
	let n = Ot(e);
	return _t.set(e, n), n;
}
function At(e, t) {
	let n = [];
	for (let r of e) {
		let e = t.get(r.key);
		if (e) for (let t of e) n.push(t);
	}
	return n;
}
function jt(e, t) {
	if (e.rallies.length < 40 || t.length * 2 > e.rallies.length) return null;
	if (e.contacts.length > 4e4) return Et++, null;
	let n = kt(e);
	return n.canonical ? {
		contacts: At(t, n.contacts),
		possessions: At(t, n.possessions),
		chains: At(t, n.chains)
	} : null;
}
function Mt(e, t, n) {
	if (e.contacts.length < 80 || e.contacts.length > 4e4) return e.contacts.length > 4e4 && Et++, null;
	if (!t.team && !t.skill && !t.evaluation && !t.player && !t.startZone && !t.endZone && !t.video) return null;
	let r = kt(e);
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
	return a && (St++, Ct += n - a.length), a;
}
function Nt(e) {
	_t.delete(e) && bt++;
}
function Pt() {
	return Object.freeze({
		readOnly: !0,
		builds: vt,
		hits: yt,
		invalidations: bt,
		unsupported: xt,
		dimensionUses: St,
		avoidedContactScans: Ct,
		lastEstimatedReferenceBytes: wt,
		peakEstimatedReferenceBytes: Tt,
		maxIndexedContacts: Dt,
		skippedMemoryLimit: Et
	});
}
// src/state/analysis-operations.ts
var U = (e) => String(e ?? "").trim(), Ft = (e) => e != null && U(e) !== "", It = (e) => e === "ours" || e === "opponent" ? e : null, Lt = (e) => Array.isArray(e) ? e : [], Rt = (e, t) => t ? Math.round(1e3 * e / t) / 10 : null;
function zt(e, t = {}) {
	let n = It(t.team), r = Ft(t.set) ? Number(t.set) : null, i = Ft(t.rotation) ? Number(t.rotation) : null, a = U(t.phase).toUpperCase(), o = U(t.skill).toUpperCase(), s = U(t.evaluation), c = U(t.player).toLocaleLowerCase("es"), l = H(t.startZone), u = H(t.endZone), d = U(t.setter).toLocaleLowerCase("es"), f = e.rallies.filter((e) => e.closed && (!r || e.set === r) && (!i || (n ? (n === "ours" ? e.ownRotation : e.rivalRotation) === i : !1)) && (!a || !!e.serving && (n ? a === "K1" ? e.serving !== n : a === "K2" && e.serving === n : !1))), p = jt(e, f), m = new Set(f.map((e) => e.key)), h = !!(o || s || c || l || u || t.video === !0), g = (Mt(e, {
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
function Bt(e, t = "A") {
	let n = Lt(e).filter((e) => e.skill === t), r = n.filter((e) => e.evaluation), i = r.filter((e) => e.evaluation === "#").length, a = r.filter((e) => e.evaluation === "=").length, o = r.filter((e) => e.evaluation === "/").length;
	return {
		recorded: n.length,
		rated: r.length,
		missing: n.length - r.length,
		kills: i,
		errors: a,
		blocked: o,
		killPct: Rt(i, r.length),
		efficiency: t === "A" ? Rt(i - a - o, r.length) : null
	};
}
function Vt(e, t) {
	let n = It(t);
	if (!n) return null;
	let r = Lt(e).filter((e) => e.closed), i = r.filter((e) => e.serving && e.serving !== n), a = r.filter((e) => e.serving === n), o = (e) => {
		let t = e.filter((e) => e.winner === n).length;
		return {
			n: e.length,
			won: t,
			pct: Rt(t, e.length)
		};
	};
	return {
		closed: r.length,
		unknownServe: r.filter((e) => !e.serving).length,
		k1: o(i),
		k2: o(a)
	};
}
function Ht(e) {
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
function Ut(e, t, n) {
	let r = It(n), i = Vt(e.rallies, r), a = t && typeof t == "object" && "points" in t ? t.points : void 0;
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
var Wt = /* @__PURE__ */ new WeakMap();
function Gt(e) {
	let t = Wt.get(e);
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
		filter: (e, t = {}) => m("filter", () => zt(e, t)),
		evaluate: (e, t = "A") => m("evaluate", () => Bt(e, t)),
		points: (e, t) => m("points", () => Vt(e, t)),
		coverage: (e) => m("coverage", () => Ht(e)),
		reconcile: (e, t, n) => m("reconcile", () => Ut(e, t, n)),
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
	return Wt.set(e, h), e.VC_ANALYSIS_OPERATIONS_20525 = h, h;
}
// src/state/analysis-export.ts
var Kt = (e) => String(e ?? "").trim();
function qt(e) {
	let t = Kt(e);
	return /^[\s\u0000-\u001f]*[=+\-@]/.test(t) && !/^[-+]?\d+(?:[.,]\d+)?$/.test(t.trim()) && (t = "'" + t), "\"" + t.replace(/"/g, "\"\"") + "\"";
}
function Jt(e) {
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
	})].map((e) => e.map(qt).join(";")).join("\r\n");
}
// src/state/analysis-export-runtime.ts
var Yt = /* @__PURE__ */ new WeakMap();
function Xt(e) {
	let t = Yt.get(e);
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
				return Jt(e);
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
		indexDiagnostics: Pt
	});
	return Yt.set(e, l), e.VC_ANALYSIS_CSV_20526 = l, l;
}
// src/state/analysis-view.ts
var Zt = (e) => String(e ?? "").trim(), W = (e) => Zt(e).replace(/[&<>"']/g, (e) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
})[e]);
function Qt(e) {
	let { data: t, selection: n, coverage: r, attack: i, comparison: a } = e, o = r.bySkill.map((e) => `<tr><td><b>${W(e.skill)}</b></td><td>${e.n}</td><td>${e.properties.team}/${e.n}</td><td>${e.properties.player}/${e.n}</td><td>${e.properties.evaluation}/${e.n}</td><td>${e.properties.zone}/${e.n}</td><td>${e.properties.video}/${e.n}</td></tr>`).join(""), s = n.chains.slice(-45).reverse().map((e) => `<tr><td>${W(e.setter.set)} · ${W(e.setter.rallyIndex)}</td><td>${W(e.setter.player || "—")}</td><td>${W(e.reception?.evaluation || "—")}</td><td>${W(e.target?.code || "—")}</td><td>${W(e.tempo || "—")}</td><td>${W(e.attack?.player || "Sin ataque")}</td><td>${W(e.attack?.evaluation || "—")}</td></tr>`).join("");
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
		].map((e) => `<option>${W(e)}</option>`).join("")}</select></label><button type="button" data-vc1938-export>Exportar selección CSV</button></div><div class="vc1938-metrics"><span><strong>${n.rallies.length}</strong>rallies filtrados</span><span><strong>${n.contacts.length}</strong>contactos filtrados</span><span><strong>${n.possessions.length}</strong>posesiones</span><span><strong>${n.chains.length}</strong>colocaciones</span></div><div class="vc1938-scroll"><table><thead><tr><th>Fund.</th><th>Total</th><th>Equipo</th><th>Jugador</th><th>Eval.</th><th>Zona</th><th>Vídeo</th></tr></thead><tbody>${o}</tbody></table></div><small>Los denominadores de cobertura son los contactos de cada fundamento en todo el scouting, antes de filtros.</small></div>`,
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
var $t = /* @__PURE__ */ new WeakMap();
function en(e) {
	let t = $t.get(e);
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
				return Qt(e);
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
	return $t.set(e, l), e.VC_ANALYSIS_VIEW_20529 = l, l;
}
// src/state/rally-search-view.ts
var tn = (e) => String(e ?? "").trim(), G = (e) => tn(e).replace(/[&<>"']/g, (e) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
})[e]), nn = (e, t = e) => `<option value="${G(e)}">${G(t)}</option>`, rn = {
	S: "Saque",
	R: "Recepción",
	E: "Colocación",
	A: "Ataque",
	B: "Bloqueo",
	D: "Defensa",
	F: "Freeball",
	C: "Control"
}, K = {
	skill: [["", "Todos los fundamentos"], ...Object.entries(rn)],
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
function an(e) {
	let t = (e) => [...new Set(e.map(tn).filter(Boolean))].sort((e, t) => e.localeCompare(t, "es", { numeric: !0 })).slice(0, 250), n = Array.isArray(e?.contacts) ? e.contacts : [], r = Array.isArray(e?.chains) ? e.chains : [];
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
var q = (e, t, n) => `<label>${G(e)}<select data-vc1939-filter="${t}">${n.map(([e, t]) => nn(e, t)).join("")}</select></label>`;
function on(e, t, n = {}) {
	let r = an(e), i = (e) => [["", "Todos"], ...e.map((e) => [e, e])], a = `<div class="vc1939-search" aria-label="Buscar rallies con filtros cruzados"><div class="vc1939-intro"><strong>RALLY SEARCH PRO</strong><small>Todos los criterios se combinan · un contacto no hereda la valoración de otro</small></div>
  <div class="vc1939-grid vc1939-basic"><label>Código / texto<input data-vc1939-filter="code" maxlength="100" placeholder="Ej.: A4#, Z4 o código de scouting"></label>
  ${q("Fundamento", "skill", K.skill)}${q("Jugador", "player", i(r.players))}${q("Valoración", "evaluation", K.evaluation)}</div>
  <details class="vc1939-advanced"><summary>Más criterios · rotaciones, colocador y secuencias</summary><div class="vc1939-grid">
  ${q("Rotación propia", "ownRotation", K.ownRotation)}${q("Rotación rival", "rivalRotation", K.rivalRotation)}
  ${q("Recepción anterior", "reception", K.reception)}${q("Colocador", "setter", i(r.setters))}
  ${q("Atacante tras colocación", "attacker", i(r.attackers))}${q("Tempo", "tempo", i(r.tempos))}
  ${q("Combinación", "combo", i(r.combos))}${q("Origen", "startZone", i(r.startZones))}
  ${q("Destino", "endZone", i(r.endZones))}${q("Ganador del rally", "outcome", K.outcome)}
  ${q("Marca temporal", "video", K.video)}${q("Estado del rally", "status", K.status)}</div></details>
  <div class="vc1939-actions"><button type="button" data-vc1939-clear>Limpiar búsqueda</button><button type="button" data-vc1939-export>Exportar CSV</button></div>
  <div class="vc1939-presets"><select data-vc1939-preset aria-label="Búsquedas guardadas"><option value="">Búsquedas guardadas</option></select><button type="button" data-vc1939-save>Guardar</button><button type="button" data-vc1939-load>Aplicar</button><button type="button" data-vc1939-delete>Eliminar</button></div>
  <p class="vc1939-context-note">Se aplican también los filtros superiores de scouting, equipo, set, rotación y K1/K2. Para búsquedas por secuencia, colocador, recepción y ataque deben pertenecer a una misma posesión.</p></div>`, o = t.statistics, s = `<div class="vc1939-metrics"><div><strong>${o.rallies}</strong><span>Rallies</span></div><div><strong>${o.contacts}</strong><span>Contactos</span></div><div><strong>${o.chains}</strong><span>Colocaciones</span></div><div><strong>${o.videoContacts}</strong><span>Marcas vídeo</span></div></div>`, c = o.bySkill.map(([e, t]) => `<tr><td>${G(rn[e] || e)}</td><td>${t}</td><td>${o.contacts ? Math.round(t / o.contacts * 1e3) / 10 : 0} %</td></tr>`).join(""), l = o.byPlayer.slice(0, 10).map(([e, t]) => `<tr><td>${G(e)}</td><td>${t}</td></tr>`).join(""), u = `<div class="vc1939-left"><h3>Buscador de rallies</h3>${a}${s}<div class="vc1939-scroll"><table><thead><tr><th>Fundamento</th><th>Contactos</th><th>Uso</th></tr></thead><tbody>${c || "<tr><td colspan=\"3\">Sin acciones con esta selección.</td></tr>"}</tbody></table></div></div>`, d = t.chains.slice(0, 50).map((e) => `<tr><td>S${e.setter?.set} · R${e.setter?.rallyIndex}</td><td>${G(e.reception?.evaluation || "—")}</td><td>${G(e.setter?.player || "—")}</td><td>${G(e.tempo || "—")}</td><td>${G(e.attack?.player || "—")}</td><td>${G(e.attack?.evaluation || "—")}</td></tr>`).join("");
	return {
		left: u,
		center: `<div class="vc1939-center-body"><h3>Resultados y secuencias</h3><p class="vc1939-summary">Ataques valorados: ${o.attackRated} · Eficiencia: ${o.efficiency == null ? "Sin muestra" : o.efficiency.toLocaleString("es-ES") + " %"} · Sin valoración: ${o.missingEvaluation} contactos.</p><div class="vc1939-scroll"><table><thead><tr><th>Jugador</th><th>Acciones</th></tr></thead><tbody>${l || "<tr><td colspan=\"2\">Sin jugadores codificados.</td></tr>"}</tbody></table></div><h4>Recepción → Colocación → Ataque</h4><div class="vc1939-scroll"><table><thead><tr><th>Set/rally</th><th>Recep.</th><th>Colocador</th><th>Tempo</th><th>Atacante</th><th>Eval. A</th></tr></thead><tbody>${d || "<tr><td colspan=\"6\">No hay secuencias completas con estos filtros.</td></tr>"}</tbody></table></div></div>`
	};
}
// src/state/rally-search-view-runtime.ts
var sn = /* @__PURE__ */ new WeakMap();
function cn(e) {
	let t = sn.get(e);
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
				return on(e, t, l);
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
	return sn.set(e, l), e.VC_RALLY_VIEW_20530 = l, l;
}
// src/state/rally-search-controls.ts
var ln = "vc1939:search-presets:1", un = (e) => String(e ?? "").trim();
function dn(e) {
	try {
		let t = JSON.parse(e?.getItem("vc1939:search-presets:1") || "[]");
		return Array.isArray(t) ? t.filter((e) => e && typeof e.name == "string" && e.name.length <= 40 && e.filters && typeof e.filters == "object").slice(-15).map((e) => ({
			name: e.name,
			filters: it(e.filters)
		})) : [];
	} catch {
		return [];
	}
}
var fn = /* @__PURE__ */ new WeakMap();
function pn(e) {
	let t = fn.get(e);
	if (t) return t;
	let n = e, r = /* @__PURE__ */ new WeakSet(), i = 0, a = 0, o = 0, s = 0, c = 0, l = 0, u = 0, d = Object.freeze({
		VERSION: "20.5.31",
		nativeReadOnly: !0,
		readPresets: dn,
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
							if (!un(t)) return;
							try {
								let n = e.localStorage, r = un(t).slice(0, 40), i = dn(n).filter((e) => e.name !== r);
								i.push({
									name: r,
									filters: it(f.filters)
								}), n?.setItem(ln, JSON.stringify(i.slice(-15))), f.preset = r, s++, d.refresh();
							} catch {
								u++;
							}
						} else if (i.hasAttribute("data-vc1939-load")) {
							let t = dn(e.localStorage).find((e) => e.name === f.preset);
							t && (f.filters = { ...t.filters }, c++, d.refresh());
						} else if (i.hasAttribute("data-vc1939-delete")) try {
							e.localStorage?.setItem(ln, JSON.stringify(dn(e.localStorage).filter((e) => e.name !== f.preset))), f.preset = "", l++, d.refresh();
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
	return fn.set(e, d), e.VC_RALLY_CONTROLS_20531 = d, d;
}
// src/state/scouting-speed-draft.ts
var mn = [
	"S",
	"R",
	"E",
	"A",
	"B",
	"D",
	"F",
	"C"
], J = [
	"#",
	"+",
	"!",
	"-",
	"/",
	"="
], hn = /^(R?)(\d{1,3})([SREABDFC])?([#+!\-/=])?(.*)$/, gn = /^[.:~^@|*%&?$]/, _n = (e) => String(e ?? ""), vn = (e) => _n(e).trim().toUpperCase().replace(/\s+/g, "");
function Y(e) {
	let t = vn(e), n = t.match(hn);
	return !n || n[5] && !gn.test(n[5]) ? null : {
		code: t,
		side: n[1],
		number: n[2],
		skill: n[3],
		rating: n[4],
		tail: n[5]
	};
}
function yn(e) {
	let t = _n(e?.number || "").trim();
	return !/^\d{1,3}$/.test(t) || e?.team !== "ours" && e?.team !== "opponent" ? null : (e.team === "opponent" ? "R" : "") + t;
}
function bn(e, t, n) {
	if (!mn.some((e) => e === t)) return null;
	let r = vn(e);
	if (!r) {
		let e = yn(n);
		return e ? e + t : null;
	}
	let i = Y(r);
	return i ? i.side + i.number + t + (i.rating || "") + i.tail : null;
}
function xn(e, t) {
	if (!J.some((e) => e === t)) return null;
	let n = Y(e);
	return !n || !n.skill ? null : n.side + n.number + n.skill + t + n.tail;
}
function Sn(e, t = 1) {
	let n = Y(e);
	if (!n || !n.skill) return null;
	let r = J[(J.findIndex((e) => e === n.rating) + (t > 0 ? 1 : J.length - 1) + J.length) % J.length];
	return xn(e, r);
}
function Cn(e, t = 8) {
	if (!e) return [];
	let n = [], r = (e) => {
		for (let r = (Array.isArray(e) ? e.length : 0) - 1; r >= 0 && n.length < t; r--) {
			let t = vn(e?.[r]?.code);
			t.length <= 140 && Y(t)?.skill && !n.includes(t) && n.push(t);
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
var wn = 512, Tn = 32, En = /* @__PURE__ */ new Set([
	"S",
	"A",
	"B"
]);
function Dn(e, t) {
	return En.has(e) && t === "#" || (e === "S" || e === "A") && t === "=";
}
function On(e, t, n, r) {
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
function kn(e) {
	let t = String(e ?? "").trim().toUpperCase();
	if (!t) return On("empty", [], [], "Escribe una secuencia para comprobar su estructura.");
	if (t.length > 512) return On("invalid", [], [{
		position: 0,
		severity: "error",
		reason: "Secuencia demasiado larga (máximo 512 caracteres)."
	}], "Reduce la secuencia; no se ha registrado ninguna acción.");
	let n = t.split(/\s+/);
	if (n.length > 32) return On("invalid", [], [{
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
		let n = e + 1, i = t[0], c = i === "." || i === "R" ? "opponent" : "ours", l = i === "*" ? t.slice(1) : i === "." ? "R" + t.slice(1) : t, u = Y(l);
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
		r.push(m), d.state !== "candidate" && a(n, `Código ${n}: el sufijo necesita confirmación en el editor original.`), f || a(n, `Código ${n}: falta valoración explícita.`), s && (Dn(s.skill, s.rating) && a(n, `Código ${n}: hay un contacto después de una valoración que parece cerrar el punto.`), s.team === m.team && s.number === m.number && s.skill !== "B" && a(n, `Código ${n}: posible doble contacto del mismo dorsal; revisa la jugada.`), s.skill === "S" && m.skill === "R" && s.team === m.team && a(n, `Código ${n}: el saque y la recepción se atribuyen al mismo equipo.`)), s = m;
	}
	let c = i.some((e) => e.severity === "error") ? "invalid" : i.length ? "review" : "ready";
	return On(c, r, i, c === "ready" ? "Estructura reconocida. Sin comprobar alineaciones, legalidad ni aceptación del registrador." : c === "review" ? "Hay avisos orientativos. Revisa los códigos antes de registrar el rally." : "Hay errores de sintaxis. Corrige la secuencia; no se ha registrado ninguna acción.");
}
// src/state/scouting-speed-draft-runtime.ts
var An = /* @__PURE__ */ new WeakMap();
function jn(e) {
	let t = An.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.32",
		inputOnly: !0,
		parseHead: Y,
		applySkill: bn,
		applyRating: xn,
		cycleRating: Sn,
		recentCodes: Cn,
		inspectSequence: kn
	});
	return An.set(e, n), e.VC_SCOUT_DRAFT_20532 ||= n, n;
}
// src/state/scouting-preflight.ts
var Mn = {
	S: "Saque",
	R: "Recepción",
	E: "Colocación",
	A: "Ataque",
	B: "Bloqueo",
	D: "Defensa",
	F: "Freeball",
	C: "Cobertura"
}, Nn = /* @__PURE__ */ new Set([
	"#",
	"+",
	"!",
	"-",
	"/",
	"="
]), Pn = /^(R?)(\d{1,3})([SREABDFC])?([#+!\-/=])?(.*)$/, Fn = (e) => String(e ?? "").trim().toUpperCase().replace(/\s+/g, ""), In = (e) => String(e ?? "").slice(0, 180);
function Ln(e, t, n, r, i, a = !1) {
	let o = Fn(e);
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
	let s = o.match(Pn);
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
	let c = s[1] ? "Rival" : "Nuestro", l = Mn[s[3]], u = s[4], d = `${c} · #${s[2]} · ${l}${u ? " · " + u : ""}`;
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
		message: In(f?.error || "Código no reconocido por el motor de scouting."),
		code: o,
		summary: d
	};
	let p = f.action, m = [];
	p.startZone && m.push(`origen ${p.startZone}`), p.endZone && m.push(`destino ${p.endZone}`), p.tempo && m.push(`tempo ${p.tempo}`);
	let h = Nn.has(String(p.evaluation)) ? p.evaluation : u || "—";
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
var Rn = /* @__PURE__ */ new WeakMap();
function zn(e) {
	let t = Rn.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.34",
		previewOnly: !0,
		classify: Ln
	});
	return Rn.set(e, n), e.VC_SCOUT_PREFLIGHT_20534 ||= n, n;
}
// src/domain/scout-registration-guard.ts
function Bn(e) {
	return e.hasCode ? !e.hasMatch || e.matchFinished ? "No hay un scouting activo." : !e.hasSet || e.setFinished ? "El set está cerrado." : null : "Código vacío.";
}
// src/domain/scout-registration-guard-runtime.ts
var Vn = /* @__PURE__ */ new WeakMap();
function Hn(e) {
	let t = Vn.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.35",
		preconditionsOnly: !0,
		inspect: Bn
	});
	return Vn.set(e, n), e.VC_SCOUT_REG_GUARD_20535 ||= n, n;
}
// src/domain/rally-shadow.ts
var Un = 40, Wn = [
	"p1",
	"p2",
	"p3",
	"p4",
	"p5",
	"p6"
], Gn = [
	"liveVideoSessionId",
	"liveVideoStart",
	"liveVideoEnd",
	"liveVideoLinkedAt"
], Kn = (e, t) => e.us === t.us && e.opponent === t.opponent, qn = (e, t, n = !1) => Object.freeze({
	operation: e,
	verdict: t.length ? "difference" : n ? "unverified" : "agree",
	areas: Object.freeze(t.length ? [...t] : n ? ["missing-data"] : [])
}), Jn = (n) => t(n.sets).map(e).find((e) => e && Number(e.number) === Number(n.currentSet) && Number.isInteger(Number(n.currentSet))) || null, Yn = (t) => {
	let n = e(t), r = e(n?.ours), i = e(n?.opponent);
	return !!r && !!i && Wn.every((e) => Object.hasOwn(r, e) && Object.hasOwn(i, e));
}, Xn = (t, n) => {
	let r = e(t), i = e(n), a = e(r?.ours), o = e(i?.ours), s = e(r?.opponent), c = e(i?.opponent);
	return !!a && !!o && !!s && !!c && Wn.every((e) => Object.is(a[e], o[e]) && Object.is(s[e], c[e]));
};
function Zn(o, s, l) {
	let u = e(o), d = e(s), f = e(l), p = [];
	if (!u || !d || !f) return qn("point", p, !0);
	let m = a(f);
	if (!m.before || !m.after || !n(f.winner) || !n(f.servingBefore) || !r(f.rotationBefore) || !r(f.opponentRotationBefore)) return qn("point", p, !0);
	let h = c({
		score: m.before,
		serving: f.servingBefore,
		rotationUs: f.rotationBefore,
		rotationOpponent: f.opponentRotationBefore
	}, f.winner);
	if (h.state !== "projected" || !h.score) return qn("point", p, !0);
	m.state !== "inconsistent" && Kn(h.score, m.after) || p.push("score");
	let g = i({
		us: d.scoreUs,
		opponent: d.scoreOpponent
	}), _ = !g;
	g && !Kn(g, m.after) && !p.includes("score") && p.push("score");
	let v = e(u.liveRally);
	v && t(v.actions).length === 0 && !e(v.startSnapshot) && (n(u.servingTeam) && u.servingTeam !== h.serving ? p.push("service") : n(u.servingTeam) || (_ = !0), r(u.rotationNo) && r(u.opponentRotationNo) ? (u.rotationNo !== h.rotationUs || u.opponentRotationNo !== h.rotationOpponent) && p.push("rotation") : _ = !0);
	let y = M(u, m.after);
	y.state === "projected" ? (typeof d.finished == "boolean" && d.finished !== y.setFinished ? p.push("set") : typeof d.finished != "boolean" && (_ = !0), y.setFinished && n(d.winner) && d.winner !== y.setWinner ? p.push("set") : y.setFinished && !n(d.winner) && (_ = !0), y.matchFinished === !0 && u.status !== "finished" && p.push("match")) : _ = !0;
	let b = N(f);
	return (b.lineup === "missing" || b.actionsCaptured === !1) && (_ = !0), qn("point", [...new Set(p)], _);
}
var Qn = (n, r) => {
	let i = t(r.rallies), a = e(i.at(-1)), o = ie(n);
	return {
		match: n,
		set: r,
		count: i.length,
		lastId: a?.id,
		lastRally: a,
		expectedUndo: o.state === "projected" ? o.after : null
	};
};
function $n(t, a, o) {
	let s = [], c = e(a.liveRally), l = t.lastRally, u = t.expectedUndo;
	if (!l || !c || !u || l.id === void 0 || c.id !== l.id) return qn("undo", s, !0);
	let d = i({
		us: o.scoreUs,
		opponent: o.scoreOpponent
	}), f = !d;
	d && !Kn(d, u.score) && s.push("score"), n(a.servingTeam) ? a.servingTeam !== u.serving && s.push("service") : f = !0, r(a.rotationNo) && r(a.opponentRotationNo) ? (a.rotationNo !== u.rotationUs || a.opponentRotationNo !== u.rotationOpponent) && s.push("rotation") : f = !0, Array.isArray(l.actions) && Array.isArray(c.actions) ? l.actions.length !== c.actions.length && s.push("actions") : f = !0, Yn(l.lineupBefore) && Yn(a.lineup) ? Xn(l.lineupBefore, a.lineup) || s.push("lineup") : f = !0;
	let p = Gn.filter((e) => l[e] !== void 0 && l[e] !== null);
	return p.length && p.some((e) => !Object.is(l[e], c[e])) && s.push("video"), qn("undo", [...new Set(s)], f);
}
function er() {
	let t = null, n = !1, r = 0, i = 0, a = 0, o = 0, s = 0, c = 0, l = 0, u = [], d = (e) => (r++, e.operation === "point" ? i++ : a++, e.verdict === "agree" ? o++ : e.verdict === "difference" ? s++ : c++, e.verdict !== "agree" && (u.push(e), u.length > Un && u.shift()), e);
	return Object.freeze({
		observe(r) {
			if (n) return null;
			let i = e(r), a = i && Jn(i);
			if (!i || !a) return t = null, null;
			let o = Qn(i, a), s = t;
			return t = o, s ? s.match !== i || s.set !== a ? (l++, null) : o.count === s.count ? null : o.count === s.count + 1 ? d(Zn(i, a, o.lastRally)) : o.count === s.count - 1 ? s.lastId === void 0 || e(i.liveRally)?.id !== s.lastId ? (l++, null) : d($n(s, i, a)) : (l++, null) : null;
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
// src/domain/rally-shadow-runtime.ts
function tr(e) {
	let t = e.document, n = t.getElementById("v11-management");
	if (!n) return null;
	if (e.VC_SHADOW_20515) return e.VC_SHADOW_20515;
	let r = er();
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
var nr = "20.1.2", rr = "vc-multi-device-validation", ir = (e) => String(e ?? "").trim(), ar = (e) => {
	let t = Number(e);
	return Number.isSafeInteger(t) && t >= 0 ? t : 0;
}, or = (e) => {
	let t = ir(e);
	return /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/.test(t) && Number.isFinite(Date.parse(t)) ? t : "";
};
function sr({ cloud: t = {}, device: n = {}, journal: r = {}, now: i = Date.now() } = {}) {
	let a = e(t) || {}, o = e(n) || {}, s = e(r) || {};
	return {
		schema: rr,
		version: nr,
		createdAt: new Date(i).toISOString(),
		connected: !!a.connected,
		dirty: !!a.dirty,
		blocked: !!a.blockedReason,
		realtimeSubscribed: o.realtimeState === "SUBSCRIBED",
		lastReadAt: ar(a.lastReadAt),
		lastWriteAt: ar(a.lastWriteAt),
		lastReadErrorAt: ar(a.lastReadErrorAt),
		lastObservedRemoteStamp: or(a.lastObservedRemoteStamp),
		lastAppliedRemoteStamp: or(a.lastAppliedRemoteStamp),
		lastConfirmedWriteStamp: or(a.lastConfirmedWriteStamp),
		pendingJournal: typeof s.pendingCount == "number" ? ar(s.pendingCount) : null,
		journalError: !!s.lastError,
		warning: "Mismo origen y cuenta deben comprobarse manualmente. La igualdad de marcas CAS no verifica contenido ni entrega de vídeo."
	};
}
function cr(t) {
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
	return sr({
		cloud: n,
		device: { realtimeState: n.realtimeSubscribed ? "SUBSCRIBED" : "" },
		journal: {
			pendingCount: n.pendingJournal,
			lastError: n.journalError
		},
		now: Date.parse(String(n.createdAt))
	});
}
function lr(e, t) {
	let n = cr(e), r = cr(t), i = (e) => e.connected && !e.dirty && !e.blocked && !e.journalError && e.pendingJournal === 0;
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
var ur = /* @__PURE__ */ new WeakMap(), dr = Object.freeze({
	VERSION: nr,
	SCHEMA: rr,
	report: sr,
	parseReport: cr,
	compareReports: lr,
	mount: pr
});
function fr(e) {
	return e.VC_SYNC_2012 = dr, dr;
}
function pr(e) {
	let t = ur.get(e);
	if (t) return t;
	let n = e.document;
	if (!n) return null;
	let r = (e) => n.getElementById(e), i = (e, t = "") => {
		let r = n.createElement(e);
		return r.textContent = t, r;
	}, a = null, o = !1, s = !1, c = !1, l = null, u = "", d = null, f = async () => {
		let t = e.VC_V962_CLOUD_EFFICIENT?.diagnostics?.() || {}, n = e.VC_DEVICE_SYNC?.diagnostics?.() || {}, r = e.VC_V962_CLOUD_EFFICIENT?.getAccountId?.() || "";
		return sr({
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
				let n = l ? lr(e, l) : null, i = r("vc2012-feedback");
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
					l = cr(await t.text()), u = "Informe del segundo dispositivo cargado para comparar.";
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
			s || (s = !0, S && n.removeEventListener("DOMContentLoaded", x), d?.disconnect(), d = null, e.removeEventListener("vc200:sync-state", y), e.removeEventListener("vc2011:journal", y), n.removeEventListener("click", b, !0), r("vc2012-refresh")?.removeEventListener("click", m), r("vc2012-export")?.removeEventListener("click", g), r("vc2012-file")?.removeEventListener("change", _), o && a?.remove(), a = null, l = null, ur.delete(e));
		}
	});
	return ur.set(e, C), C;
}
// src/domain/rally-recovery-evidence.ts
var mr = Object.freeze([
	"score",
	"service",
	"rotation",
	"set",
	"match",
	"actions",
	"lineup",
	"video"
]), X = (e) => {
	try {
		return JSON.stringify(e);
	} catch {
		return;
	}
}, hr = (n) => t(n.sets).map(e).find((e) => e && Number(e.number) === Number(n.currentSet) && Number.isInteger(Number(n.currentSet))) || null;
function Z(n) {
	try {
		let r = e(n);
		if (!r) return null;
		let i = hr(r), a = i && Array.isArray(i.rallies) ? i.rallies : null, o = e(a?.at(-1)), s = e(r.liveRally), c = typeof r.id == "string" && r.id.length > 0 || typeof r.id == "number" && Number.isFinite(r.id) ? X([r.id, r.currentSet]) : void 0, l = {
			score: i ? X([i.scoreUs, i.scoreOpponent]) : void 0,
			service: X(r.servingTeam),
			rotation: X([r.rotationNo, r.opponentRotationNo]),
			set: i ? X([r.currentSet, t(r.sets).map((t) => {
				let n = e(t);
				return n ? [
					n.number,
					n.scoreUs,
					n.scoreOpponent,
					n.finished,
					n.winner
				] : null;
			})]) : void 0,
			match: X(r.status),
			actions: a ? X([
				a.length,
				o?.id,
				o?.actions,
				s?.id,
				s?.actions
			]) : void 0,
			lineup: X([
				r.lineup,
				r.baseLineup,
				r.lineupRoles,
				r.libero
			]),
			video: X([
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
function gr(e, t) {
	if (!e || !t) return Object.freeze(["missing-data"]);
	let n = [], r = !1;
	for (let i of mr) e.fields[i] === void 0 || t.fields[i] === void 0 ? r = !0 : e.fields[i] !== t.fields[i] && n.push(i);
	return r && n.push("missing-data"), Object.freeze(n);
}
function _r(e, t) {
	return !!e && !!t && !!e.identity && e.identity === t.identity && mr.every((n) => e.fields[n] !== void 0 && t.fields[n] !== void 0 && e.fields[n] === t.fields[n]);
}
function vr(e, t, n) {
	return !e || !t || !n || !e.identity || !t.identity || !n.identity || e.identity !== t.identity || e.identity !== n.identity || [...mr].some((r) => e.fields[r] === void 0 || t.fields[r] === void 0 || n.fields[r] === void 0) ? "unreadable" : _r(e, t) ? _r(e, n) ? "unchanged-observed" : "divergent" : _r(n, t) ? "durable-after" : _r(n, e) ? "durable-before" : "divergent";
}
// src/domain/rally-transaction-pilot.ts
var yr = 40, br = (e, t) => e.us === t.us && e.opponent === t.opponent, xr = (n) => {
	let r = e(n);
	return r && t(r.sets).map(e).find((e) => e && Number(e.number) === Number(r.currentSet) && Number.isInteger(Number(r.currentSet))) || null;
}, Q = (e, t, n = [], r = "not-checked") => Object.freeze({
	operation: e,
	verdict: t,
	areas: Object.freeze([...n]),
	durability: r
}), Sr = (a, o, s, c, l, u, d) => {
	let f = e(c), p = xr(c);
	if (o.state !== "projected" || !o.after || !f || !p || !l || f !== s || p !== l) return Q(a, "unverified", ["missing-data"]);
	let m = t(p.rallies).length;
	if (a === "point") {
		if (m !== d + 1) return Q(a, "unverified", ["missing-data"]);
		let e = Zn(f, p, t(p.rallies).at(-1)), n = [...e.areas], r = i({
			us: p.scoreUs,
			opponent: p.scoreOpponent
		});
		return r && !br(r, o.after.score) && !n.includes("score") && n.push("score"), Q("point", n.length ? "difference" : e.verdict, n);
	}
	let h = e(f.liveRally);
	if (m !== d - 1 || !u || u.id === void 0 || h?.id !== u.id) return Q("undo", "unverified", ["missing-data"]);
	let g = [], _ = i({
		us: p.scoreUs,
		opponent: p.scoreOpponent
	}), v = !_;
	return _ && !br(_, o.after.score) && g.push("score"), n(f.servingTeam) ? f.servingTeam !== o.after.serving && g.push("service") : v = !0, r(f.rotationNo) && r(f.opponentRotationNo) ? (f.rotationNo !== o.after.rotationUs || f.opponentRotationNo !== o.after.rotationOpponent) && g.push("rotation") : v = !0, Array.isArray(u.actions) && Array.isArray(h.actions) ? u.actions.length !== h.actions.length && g.push("actions") : v = !0, Q("undo", g.length ? "difference" : v ? "unverified" : "agree", g.length ? g : v ? ["missing-data"] : []);
};
function Cr(n, r = {}) {
	let i = Promise.resolve(), a = !1, o = r.requireRecoveryAfterNativeFailure === !0, s = o && r.startBlockedForPendingRecovery === !0, c = "not-checked", l = 0, u = 0, d = 0, f = 0, p = 0, m = 0, h = 0, g = 0, _ = 0, v = 0, y = 0, b = [], x = (e) => {
		u++, e.verdict === "agree" ? d++ : e.verdict === "difference" ? f++ : e.verdict === "native-rejected" ? m++ : e.verdict === "native-declined" ? h++ : e.verdict === "recovery-blocked" ? v++ : p++, (e.verdict === "native-rejected" || e.verdict === "native-declined") && (c = e.durability, e.areas.some((e) => e !== "missing-data") && g++, e.areas.includes("missing-data") && _++), e.verdict !== "agree" && (b.push(e), b.length > yr && b.shift());
	}, S = () => {
		try {
			return n.readCurrent();
		} catch {
			return null;
		}
	}, C = () => Z(S()), w = async (e, t) => {
		if (!n.readDurableLocal) return "not-configured";
		try {
			return vr(e, t, Z(await n.readDurableLocal()));
		} catch {
			return "unreadable";
		}
	}, T = async (r, i) => {
		if (s) throw x(Q(r, "recovery-blocked")), Error("Recuperación pendiente: comprueba el partido y el guardado local antes de continuar.");
		let a = S(), c = xr(a), l = t(c?.rallies), u = Z(a), d = l.length, f = e(l.at(-1)), p = null;
		try {
			p = r === "point" ? I(a, i) : ie(a);
		} catch {}
		let m;
		try {
			m = r === "point" ? await n.awardPoint(i) : await n.undoRally();
		} catch (e) {
			o && (s = !0);
			let t = C(), n = await w(u, t);
			throw x(Q(r, "native-rejected", gr(u, t), n)), e;
		}
		if (m === !1) {
			o && (s = !0);
			let e = C(), t = await w(u, e);
			return x(Q(r, "native-declined", gr(u, e), t)), m;
		}
		try {
			x(p ? Sr(r, p, a, S(), c, f, d) : Q(r, "unverified", ["missing-data"]));
		} catch {
			x(Q(r, "unverified", ["missing-data"]));
		}
		return m;
	}, E = (e, t) => {
		if (a) return Promise.reject(/* @__PURE__ */ Error("El piloto ya está desactivado."));
		l++, y++;
		let n = i.then(() => T(e, t));
		return i = n.then(() => void 0, () => void 0), n.finally(() => {
			y--;
		});
	};
	return Object.freeze({
		readonlyVersion: "20.5.18",
		installedInLiveUI: !1,
		awardPoint: (e) => E("point", e),
		undoRally: () => E("undo"),
		report: () => Object.freeze({
			version: "20.5.18",
			mode: "explicit-native-delegation-only",
			installedInLiveUI: !1,
			submitted: l,
			completed: u,
			agree: d,
			difference: f,
			unverified: p,
			nativeRejected: m,
			nativeDeclined: h,
			partialMutations: g,
			uninspectedFailures: _,
			blockedCommands: v,
			pending: y,
			recoveryGuard: Object.freeze({
				enabled: o,
				blocked: s,
				lastEvidence: c
			}),
			recent: Object.freeze([...b])
		}),
		async resumeAfterVerifiedReload() {
			if (!o || !s || a || y !== 0 || !n.readDurableLocal) return !1;
			try {
				return _r(C(), Z(await n.readDurableLocal())) ? (s = !1, !0) : !1;
			} catch {
				return !1;
			}
		},
		disable() {
			a = !0;
		}
	});
}
// src/domain/journal-recovery-inspector.ts
var wr = 27262976, $ = (e, t) => Object.freeze({
	version: "20.5.19",
	source: "existing-v2011-pending-checkpoint",
	status: e,
	pendingCount: t,
	requiresManualReview: !0,
	autoResumeAllowed: !1
});
async function Tr(n) {
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
		if (!c || c.accountId !== r || c.status !== "pending" || c.mode !== "draft" && c.mode !== "upload" || typeof c.stateJson != "string" || c.stateJson.length === 0 || c.stateJson.length > wr) return $("unavailable", s);
		let l = e(e(e(JSON.parse(c.stateJson))?.equiposData)?.[i]);
		if (!l || !Array.isArray(l.scoutingMatches)) return $("missing-match", s);
		let u = t(l.scoutingMatches).map(e).filter((e) => e && String(e.id) === String(n.matchId));
		if (u.length !== 1) return $(u.length ? "ambiguous" : "missing-match", s);
		let d = vr(Z(n.before), Z(n.after), Z(u[0]));
		return $(d === "durable-before" ? "checkpoint-before" : d === "durable-after" ? "checkpoint-after" : d === "unchanged-observed" ? "checkpoint-unchanged" : d === "divergent" ? "checkpoint-divergent" : "unavailable", s);
	} catch {
		return $("unavailable", a);
	}
}
// src/vc2055-entry.ts
if (typeof window < "u" && window.document) {
	jn(window), zn(window), Hn(window), fr(window), Pe(window), en(window), cn(window), pn(window), ct(window), gt(window), Gt(window), Xt(window);
	let e = () => {
		be(window), et(window), lt(window), E(window), te(window), pe(window), me(window), Ie(window), Ze(window), tr(window), pr(window);
	};
	window.document.readyState === "loading" ? window.document.addEventListener("DOMContentLoaded", e, { once: !0 }) : e();
}
export { Dt as MAX_INDEXED_CONTACTS, wn as MAX_SEQUENCE_CHARACTERS, Tn as MAX_SEQUENCE_CONTACTS, ln as RALLY_SEARCH_PRESETS_KEY, tt as SEARCH_FILTERS, xn as applyScoutingDraftRating, bn as applyScoutingDraftSkill, l as attackEfficiency, fe as auditCommittedMatch, o as auditMatchScores, Vt as calculateAnalysisPoints, C as canonicalReaders, Z as captureRecoveryFrame, an as catalogRallySearch, gr as changedRecoveryAreas, A as classifyPreflight, vr as classifyRecoveryEvidence, Ln as classifyScoutingPreflight, de as classifyStoredAction, Zn as compareConfirmedPoint, lr as compareDeviceValidation, y as compareNativeCode, ye as createObservableMatchStore, er as createRallyShadowSession, Cr as createRallyTransactionPilot, Fe as createReadOnlyRenderGate, $e as createScoutingProjectionStore, ee as createShadowSession, Sn as cycleScoutingDraftRating, _r as equalRecoveryFrames, qt as escapeAnalysisCSVCell, Bt as evaluateAnalysisContacts, Jt as exportAnalysisCSV, zt as filterAnalysis, Ht as inspectAnalysisCoverage, Pt as inspectAnalysisIndexDiagnostics, ae as inspectClosedRally, v as inspectCodeShape, Tr as inspectJournalRecovery, ke as inspectLiveSetStatistics, T as inspectMatchDomain, Xe as inspectPlayerBoxscore, N as inspectRallyRestoration, Bn as inspectRegistrationConditions, kn as inspectScoutingSequence, S as inspectSubstitution, Xt as installAnalysisExportBridge, gt as installAnalysisNormalizeBridge, Gt as installAnalysisOperationsBridge, ct as installAnalysisQueryBridge, en as installAnalysisViewBridge, fr as installMultiDeviceAPI, pn as installRallySearchControls, cn as installRallySearchViewBridge, Hn as installRegistrationGuardBridge, Pe as installRenderMetricsBridge, jn as installScoutingDraftBridge, zn as installScoutingPreflightBridge, Nt as invalidateAnalysisIndex, lt as mountAnalysisQueryPerformance, pe as mountCommittedPanel, E as mountDomainDiagnostic, me as mountGrammarPanel, Ie as mountLiveStatisticsPanel, pr as mountMultiDevicePanel, be as mountObservablePanel, Ze as mountPlayerBoxscore, tr as mountRallyShadowPanel, et as mountScoutingProjectionStore, te as mountShadowPanel, s as nextRotation, mt as normalizeAnalysisMatch, H as normalizeAnalysisZone, it as normalizeRallySearchFilters, cr as parseDeviceValidation, Y as parseScoutingDraftHead, I as planAwardPoint, ie as planUndoLastRally, ve as projectObservableMatch, c as projectPoint, M as projectSetBoundary, at as queryRallies, w as readCanonicalMatch, dn as readRallySearchPresets, Cn as recentScoutingDraftCodes, Ut as reconcileAnalysisPoints, Qt as renderDataEngineView, on as renderRallySearchView, sr as reportDeviceValidation, u as sideOutBreakPoint, a as verifyRallyScore };
