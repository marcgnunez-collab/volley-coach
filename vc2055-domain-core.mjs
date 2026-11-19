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
function ee(t) {
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
function A() {
	let e = 0, t = 0, n = 0, r = 0, i = 0, a = 0, o = [];
	return Object.freeze({
		record(s) {
			let c = ee(s);
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
function j(e) {
	let t = e.document, n = t.getElementById("v11-management");
	if (!n) return null;
	if (e.VC_SHADOW_2056) return e.VC_SHADOW_2056;
	let r = A(), i = (e, n = "", r = "") => {
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
function te(r, a) {
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
var N = (e, t, a, o) => {
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
}), re = (n) => t(n.sets).map(e).find((e) => e && Number(e.number) === Number(n.currentSet) && Number.isInteger(Number(n.currentSet))) || null, ie = (e, t) => e.us === t.us && e.opponent === t.opponent;
function ae(t, r) {
	let a = e(t);
	if (!a) return P("award-point", "no-match");
	if (a.status === "finished") return P("award-point", "finished");
	let o = re(a);
	if (!o) return P("award-point", "no-set");
	if (o.finished === !0) return P("award-point", "finished");
	let s = i({
		us: o.scoreUs,
		opponent: o.scoreOpponent
	}), l = e(e(a.liveRally)?.startSnapshot), u = N(s, l ? l.servingBefore : a.servingTeam, l ? l.rotationBefore : a.rotationNo, l ? l.opponentRotationBefore : a.opponentRotationNo);
	if (!u || !n(r)) return P("award-point", "invalid-data");
	if (l) {
		let e = i(l.scoreBefore);
		if (!e || !ie(e, u.score) || l.servingBefore !== a.servingTeam || l.rotationBefore !== a.rotationNo || l.opponentRotationBefore !== a.opponentRotationNo) return P("award-point", "stale-score", u);
	}
	let d = c({
		score: u.score,
		serving: u.serving,
		rotationUs: u.rotationUs,
		rotationOpponent: u.rotationOpponent
	}, r), f = N(d.score, d.serving, d.rotationUs, d.rotationOpponent);
	return f ? P("award-point", "ready", u, f, te(a, f.score)) : P("award-point", "invalid-data", u);
}
function oe(n) {
	let r = e(n);
	if (!r) return P("undo-last-rally", "no-match");
	if (r.status === "finished") return P("undo-last-rally", "finished");
	let o = re(r);
	if (!o) return P("undo-last-rally", "no-set");
	let s = t(o.rallies), c = e(s[s.length - 1]);
	if (!c) return P("undo-last-rally", "no-rallies");
	let l = N(i({
		us: o.scoreUs,
		opponent: o.scoreOpponent
	}), r.servingTeam, r.rotationNo, r.opponentRotationNo), u = N(c.scoreBefore, c.servingBefore, c.rotationBefore, c.opponentRotationBefore);
	if (!l || !u || a(c).state !== "verified") return P("undo-last-rally", "invalid-data", l);
	let d = i(c.scoreAfter);
	return !d || !ie(d, l.score) ? P("undo-last-rally", "stale-score", l) : P("undo-last-rally", "ready", l, u, null, ne(c));
}
function se(t, o = null) {
	let s = e(t), l = e(o), u = a(s), d = "unknown", f = "unknown", p = i(l?.scoreBefore);
	u.after && p && (d = ie(u.after, p) ? "match" : "mismatch");
	let m = N(s?.scoreBefore, s?.servingBefore, s?.rotationBefore, s?.opponentRotationBefore);
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
var ce = 2e4, le = 6e4, ue = 80, de = /* @__PURE__ */ new Set([
	"S",
	"R",
	"E",
	"A",
	"B",
	"D",
	"F",
	"C"
]), F = (e) => typeof e == "string" && de.has(e) ? e : "—", fe = {
	difference: "El código guardado y los campos de la acción no coinciden.",
	"coverage-gap": "El código guardado utiliza sintaxis todavía no cubierta por TypeScript.",
	unverified: "Faltan campos del registro para comprobarlo con seguridad.",
	"no-code": "La acción está registrada sin código original.",
	score: "El ganador no concuerda con el cambio de marcador registrado.",
	"score-sequence": "El tanteo final y el inicial del siguiente rally no coinciden.",
	rotation: "La siguiente rotación o el turno de saque no concuerdan con la proyección básica."
};
function pe(t) {
	let r = e(t), i = F(r?.skill);
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
		skill: F(o.skill) || i
	});
	if (!n(r.team) || !de.has(String(r.skill)) || ![
		"#",
		"+",
		"!",
		"-",
		"/",
		"="
	].includes(String(r.evaluation)) || r.playerNumberSnapshot === null || r.playerNumberSnapshot === void 0 || String(r.playerNumberSnapshot).trim() === "") return Object.freeze({
		kind: "unverified",
		skill: F(o.skill)
	});
	let s = y(a, { action: r });
	return Object.freeze({
		kind: s.state === "agree" ? "agree" : s.state === "disagree" ? "difference" : "unverified",
		skill: F(o.skill)
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
			skill: F(n),
			reason: fe[e]
		})), a.length > ue && a.shift();
	}, c = (e, t) => {
		if (i.actions >= le) return o = !0, !1;
		i.actions++;
		let n = pe(e);
		return n.kind === "agree" ? i.agree++ : n.kind === "difference" ? i.difference++ : n.kind === "coverage-gap" ? i.coverageGap++ : n.kind === "no-code" ? i.noCode++ : i.unverified++, n.kind !== "agree" && s(n.kind, t, n.skill), !0;
	}, l = t(r?.sets);
	main: for (let n = 0; n < l.length; n++) {
		let r = e(l[n]);
		if (!r) continue;
		let a = t(r.rallies);
		for (let r = 0; r < a.length; r++) {
			if (i.rallies >= ce) {
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
var Ce = 3e3, we = 25e3, I = (e, t) => t ? Math.round(e / t * 100) : null, Te = () => ({
	receptions: 0,
	perfect: 0,
	positive: 0,
	attacks: 0,
	kills: 0,
	errors: 0,
	blocked: 0
}), Ee = (t, n) => {
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
}, De = (e) => Object.freeze({
	attempts: e.receptions,
	perfect: e.perfect,
	positive: e.positive,
	positivePct: I(e.positive, e.receptions),
	perfectPct: I(e.perfect, e.receptions)
}), Oe = (e) => Object.freeze({
	attempts: e.attacks,
	kills: e.kills,
	errors: e.errors,
	blocked: e.blocked,
	efficiencyPct: I(e.kills - e.errors - e.blocked, e.attacks)
}), ke = (e, t) => Object.freeze({
	attempts: e,
	successes: t,
	percent: I(t, e)
});
function Ae(r) {
	let i = e(r), a = Number.isSafeInteger(i?.currentSet) && Number(i?.currentSet) > 0 ? Number(i?.currentSet) : null, o = e(t(i?.sets).find((t) => a !== null && e(t)?.number === a)), s = t(o?.rallies), c = Te(), l = Te(), u = 0, d = 0, f = 0, p = 0, m = 0, h = 0, g = !1;
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
			h++, Ee(c, e);
		}
		if (g) break;
	}
	let _ = t(e(i?.liveRally)?.actions);
	for (let e of _.slice(0, we)) Ee(l, e);
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
		sideOut: ke(u, d),
		breakPoint: ke(f, p),
		reception: De(c),
		attack: Oe(c),
		provisional: Object.freeze({
			actions: _.length,
			receptions: l.receptions,
			attacks: l.attacks,
			reception: De(v),
			attack: Oe(v)
		})
	});
}
// src/state/live-statistics-runtime.ts
function je(e) {
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
	let f = !1, p = !1, m = null, h = () => r.classList.contains("active") && !i.classList.contains("hidden"), g = (e, t, n) => {
		let r = l.get(e);
		r && (r.value.textContent !== t && (r.value.textContent = t), r.detail.textContent !== n && (r.detail.textContent = n));
	}, _ = (e) => e === null ? "—" : `${e}%`, v = (e) => {
		if (f) return;
		n.dataset.state = e.available ? e.truncated ? "partial" : e.provisional.receptions || e.provisional.attacks ? "provisional" : "available" : "waiting", s.textContent = e.available ? `SET ${e.set} · ${e.completeRallies} rallies cerrados${e.truncated ? " · CÁLCULO PARCIAL" : ""}` : "No hay un set activo con datos", g("so", _(e.sideOut.percent), `${e.sideOut.successes} ganados / ${e.sideOut.attempts} recepciones de saque`), g("bp", _(e.breakPoint.percent), `${e.breakPoint.successes} ganados / ${e.breakPoint.attempts} saques propios`);
		let t = e.provisional.receptions > 0, r = e.provisional.attacks > 0, i = t ? e.provisional.reception : e.reception, a = r ? e.provisional.attack : e.attack;
		g("receive", _(i.positivePct), `${i.positive}/${i.attempts} positivas${t ? " · PROVISIONAL" : ""}`), g("attack", _(a.efficiencyPct), `${a.kills} puntos · ${a.errors + a.blocked} errores/bloqueos · ${a.attempts} intentos${r ? " · PROVISIONAL" : ""}`), u.textContent = `Rally abierto: ${e.provisional.actions} acciones · ${e.provisional.receptions} recepciones · ${e.provisional.attacks} ataques (sin cerrar)`;
	}, y = (t = !1) => {
		let n = e.VC_SCOUT_PROJECTIONS_20522;
		t && n?.invalidate();
		let r = n ? n.getLiveStatistics() : Ae(w(e));
		return m = r, h() && v(r), r;
	}, b = () => y(!0), x = a.subscribe("change", () => {
		f || p || !h() || (p = !0, Promise.resolve().then(() => {
			p = !1, !f && h() && y();
		}));
	}), S = typeof MutationObserver == "function" ? new MutationObserver(() => {
		h() && y();
	}) : null;
	S?.observe(r, {
		attributes: !0,
		attributeFilter: ["class"]
	}), S?.observe(i, {
		attributes: !0,
		attributeFilter: ["class"]
	}), h() && y();
	let C = Object.freeze({
		version: "20.5.10",
		readOnly: !0,
		getReport: () => m,
		refresh: b,
		dispose() {
			f || (f = !0, S?.disconnect(), x(), n.replaceChildren(), m = null, e.VC_LIVE_STATS_20510 === C && delete e.VC_LIVE_STATS_20510);
		}
	});
	return e.VC_LIVE_STATS_20510 = C, C;
}
// src/state/player-boxscore.ts
var Me = 2e4, Ne = 6e4, Pe = 80, Fe = /* @__PURE__ */ new Set([
	"#",
	"+",
	"!",
	"-",
	"/",
	"="
]), Ie = () => ({
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
}), L = (e, t) => t ? Math.round(e / t * 100) : null, Le = (e) => {
	if (typeof e == "number" && Number.isSafeInteger(e) && e > 0) return e;
	if (typeof e == "string" && /^\d{1,15}$/.test(e)) {
		let t = Number(e);
		return Number.isSafeInteger(t) && t > 0 ? t : null;
	}
	return null;
}, Re = (e) => {
	let t = typeof e == "number" && Number.isSafeInteger(e) ? String(e) : typeof e == "string" ? e.trim() : "";
	return /^\d{1,3}$/.test(t) ? t : null;
}, ze = (e) => typeof e == "string" ? e.trim().slice(0, 50) : "";
function Be(e, t) {
	let n = Le(e.playerId), r = ze(e.opponentPlayerUid), i = Re(e.playerNumberSnapshot), a = ze(e.playerLabel), o = Re((a.match(/^#?\s*(\d{1,3})(?:\D|$)/) || [])[1]), s = i || (t === "opponent" ? o : null), c = ze(e.playerNameSnapshot) || a.replace(/^#?\s*\d{1,3}\s*[·-]?\s*/, "") || "", l = t === "ours" && n !== null ? `id:${n}` : t === "opponent" && r ? `uid:${r}` : s === null ? "unidentified" : `num:${s}`;
	return {
		key: l,
		number: s,
		name: l === "unidentified" ? "Sin identificar" : c,
		identified: l !== "unidentified"
	};
}
var Ve = (e, t) => {
	let n = t.skill, r = t.evaluation;
	return !Fe.has(String(r)) || ![
		"S",
		"R",
		"A",
		"B",
		"D",
		"E"
	].includes(String(n)) ? !1 : (e.actions++, n === "S" ? (e.s++, r === "#" && e.aces++, r === "=" && e.sErrors++) : n === "R" ? (e.r++, r === "#" && e.rPerfect++, (r === "#" || r === "+") && e.rPositive++) : n === "A" ? (e.a++, r === "#" && e.kills++, r === "=" && e.aErrors++, r === "/" && e.blocked++) : n === "B" ? (e.b++, r === "#" && e.bPoints++) : n === "D" ? e.d++ : n === "E" && e.e++, !0);
}, He = (e) => Object.freeze({
	attempts: e.a,
	kills: e.kills,
	errors: e.aErrors,
	blocked: e.blocked,
	efficiencyPct: L(e.kills - e.aErrors - e.blocked, e.a)
}), Ue = (e, t) => Object.freeze({
	attempts: e,
	won: t,
	percent: L(t, e)
});
function We(i, a) {
	let o = e(i), s = a.team === "opponent" ? "opponent" : "ours", c = a.scope === "match" ? "match" : "current", l = r(a.rotation) ? a.rotation : null, u = Object.freeze({
		team: s,
		scope: c,
		rotation: l
	}), d = Le(o?.currentSet), f = t(o?.sets), p = c === "match" ? f : f.filter((t) => d !== null && Le(e(t)?.number) === d), m = !!o && p.some((t) => !!e(t)), h = /* @__PURE__ */ new Map(), g = /* @__PURE__ */ new Map(), _ = Ie();
	for (let e of [
		1,
		2,
		3,
		4,
		5,
		6
	]) g.set(e, {
		...Ie(),
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
			if (v >= Me) {
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
				if (y >= Ne) {
					C = !0;
					break main;
				}
				y++;
				let t = e(n);
				if (!t || t.team !== s || (c === null && S++, c !== null && Ve(g.get(c), t), l !== null && c !== l)) continue;
				let r = Be(t, s), i = r.key, a = h.get(i);
				!a && h.size >= Pe ? (w = !0, Ve(_, t) && (b++, r.identified || x++)) : (a || (a = {
					...Ie(),
					...r
				}, h.set(i, a)), !a.number && r.number && (a.number = r.number), !a.name && r.name && (a.name = r.name), Ve(a, t) && (b++, a.identified || x++));
			}
		}
	}
	let T = [...h.values()].filter((e) => e.actions > 0).sort((e, t) => e.identified === t.identified ? (e.number === null ? Infinity : Number(e.number)) - (t.number === null ? Infinity : Number(t.number)) || e.name.localeCompare(t.name, "es") || e.key.localeCompare(t.key) : e.identified ? -1 : 1).slice(0, Pe).map((e) => Object.freeze({
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
			positivePct: L(e.rPositive, e.r),
			perfectPct: L(e.rPerfect, e.r)
		}),
		attack: He(e),
		block: Object.freeze({
			attempts: e.b,
			points: e.bPoints
		}),
		digs: e.d,
		sets: e.e
	})), E = [...g.values()].map((e) => Object.freeze({
		rotation: e.rotation,
		rallies: e.rallies,
		sideOut: Ue(e.so, e.soWon),
		breakPoint: Ue(e.bp, e.bpWon),
		attack: He(e)
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
function Ge(e) {
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
	let y = !1, b = !1, x = null, S = () => r.classList.contains("active") && !i.classList.contains("hidden"), C = (e) => e === null ? "—" : `${e}%`, T = (e, t, n = "td") => e.append(o(n, "", t)), E = (e) => {
		let t = o("table", "vc20511-table"), n = o("thead"), r = o("tr");
		for (let t of e) T(r, t, "th");
		n.append(r), t.append(n);
		let i = o("tbody");
		return t.append(i), {
			grid: t,
			tbody: i
		};
	}, D = (e) => {
		if (y) return;
		n.dataset.state = e.available ? e.truncated || e.playersTruncated ? "partial" : "available" : "waiting", m.textContent = e.available ? `${e.players.length} jugadores · ${e.selectedActions} acciones evaluadas · ${e.ralliesExamined} rallies examinados` + (e.unattributedActions ? ` · ${e.unattributedActions} sin identificar` : "") + (e.missingRotationActions ? ` · ${e.missingRotationActions} sin rotación` : "") + (e.pendingActions ? ` · ${e.pendingActions} acciones abiertas (excluidas)` : "") + (e.truncated || e.playersTruncated ? " · RESULTADOS PARCIALES" : "") : "No hay datos confirmados del periodo seleccionado.";
		let t = E([
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
			T(e, `${n.number === null ? "—" : "#" + n.number} · ${n.name}`), T(e, `${n.serve.attempts} · ${n.serve.aces}/${n.serve.errors}`), T(e, `${n.receive.attempts} · ${C(n.receive.positivePct)} / ${C(n.receive.perfectPct)}`), T(e, `${n.attack.attempts} · ${n.attack.kills}/${C(n.attack.efficiencyPct)}`), T(e, `${n.block.attempts} · ${n.block.points}`), T(e, `${n.digs}/${n.sets}`), T(e, String(n.actions)), t.tbody.append(e);
		}
		if (!e.players.length) {
			let e = o("tr"), n = o("td", "", "No hay acciones confirmadas con estos filtros.");
			n.setAttribute("colspan", "7"), e.append(n), t.tbody.append(e);
		}
		h.replaceChildren(t.grid);
		let r = E([
			"ROT.",
			"RALLIES",
			"SO · G/T",
			"BP · G/T",
			"ATA · K/EFF"
		]);
		for (let t of e.rotations) {
			let n = o("tr", e.filters.rotation === t.rotation ? "vc20511-selected" : "");
			T(n, `P${t.rotation}`), T(n, String(t.rallies)), T(n, `${C(t.sideOut.percent)} · ${t.sideOut.won}/${t.sideOut.attempts}`), T(n, `${C(t.breakPoint.percent)} · ${t.breakPoint.won}/${t.breakPoint.attempts}`), T(n, `${t.attack.attempts} · ${t.attack.kills}/${C(t.attack.efficiencyPct)}`), r.tbody.append(n);
		}
		_.replaceChildren(r.grid);
	}, O = (t = !1) => {
		let n = {
			team: d.value === "opponent" ? "opponent" : "ours",
			scope: f.value === "match" ? "match" : "current",
			rotation: /^[1-6]$/.test(p.value) ? Number(p.value) : null
		}, r = e.VC_SCOUT_PROJECTIONS_20522;
		t && r?.invalidate();
		let i = r ? r.getPlayerBoxscore(n) : We(w(e), n);
		return x = i, S() && D(i), i;
	}, k = () => O(!0), ee = a.subscribe("change", () => {
		y || b || !S() || (b = !0, Promise.resolve().then(() => {
			b = !1, !y && S() && O();
		}));
	}), A = () => O();
	for (let e of [
		d,
		f,
		p
	]) e.addEventListener("change", A);
	let j = typeof MutationObserver == "function" ? new MutationObserver(() => {
		S() && O();
	}) : null;
	j?.observe(r, {
		attributes: !0,
		attributeFilter: ["class"]
	}), j?.observe(i, {
		attributes: !0,
		attributeFilter: ["class"]
	}), S() && O();
	let M = Object.freeze({
		version: "20.5.11",
		readOnly: !0,
		getReport: () => x,
		refresh: k,
		dispose() {
			if (!y) {
				y = !0, j?.disconnect(), ee();
				for (let e of [
					d,
					f,
					p
				]) e.removeEventListener("change", A);
				n.replaceChildren(), x = null, e.VC_PLAYER_BOXSCORE_20511 === M && delete e.VC_PLAYER_BOXSCORE_20511;
			}
		}
	});
	return e.VC_PLAYER_BOXSCORE_20511 = M, M;
}
// src/state/scouting-projections.ts
var Ke = 8;
function qe(e, t) {
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
			return n ? (c++, n) : (n = Ae(w(e)), s++, n);
		},
		getPlayerBoxscore(t) {
			if (u) throw Error("La vista de scouting está cerrada.");
			let n = t.team === "opponent" ? "opponent" : "ours", a = t.scope === "match" ? "match" : "current", o = r(t.rotation) ? t.rotation : null, l = `${n}:${a}:${o ?? 0}`, d = i.get(l);
			if (d) return c++, d;
			let f = We(w(e), {
				team: n,
				scope: a,
				rotation: o
			});
			if (s++, i.size >= Ke) {
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
function Je(e) {
	if (e.VC_SCOUT_PROJECTIONS_20522) return e.VC_SCOUT_PROJECTIONS_20522;
	let t = e.VC_STATE_2059;
	if (!t) return null;
	let n = qe(e, t);
	return e.VC_SCOUT_PROJECTIONS_20522 = n, n;
}
// src/state/analysis-query.ts
var Ye = Object.freeze([
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
]), R = (e) => String(e ?? "").trim(), Xe = (e) => Array.isArray(e) ? e : [], z = (e) => R(e).toLocaleLowerCase("es"), Ze = (e) => e === "ours" || e === "opponent" ? e : null;
function Qe(e) {
	let t = e || {};
	return Object.fromEntries(Ye.map((e) => [e, R(t[e]).slice(0, e === "code" ? 100 : 80)]));
}
function $e(e, t = {}) {
	let n = Qe(t), r = Ze(t.team), i = R(t.set), a = R(t.rotation), o = R(t.phase).toUpperCase(), s = z(n.code), c = !!(s || n.skill || n.player || n.evaluation || n.startZone || n.endZone || n.video), l = !!(n.setter || n.attacker || n.tempo || n.combo), u = l || !!n.reception, d = [], f = /* @__PURE__ */ new Map(), p = /* @__PURE__ */ new Map(), m = /* @__PURE__ */ new Map();
	for (let t of Xe(e?.chains)) m.has(t.rallyKey) || m.set(t.rallyKey, []), m.get(t.rallyKey).push(t);
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
	for (let t of Xe(e?.rallies)) {
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
var et = /* @__PURE__ */ new WeakMap(), tt = /* @__PURE__ */ new WeakMap();
function nt(e) {
	let t = et.get(e);
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
				return $e(e, t);
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
	return et.set(e, l), e.VC_ANALYSIS_QUERY_20523 = l, l;
}
function rt(e) {
	let t = tt.get(e);
	if (t) return t;
	let n = e.document, r = n.getElementById("v11-management");
	if (!r) return null;
	let i = n.getElementById("vc60-diagnostics"), a = i || r, o = e.VC_ANALYSIS_QUERY_20523 || nt(e), s = (e, t = "", r = "") => {
		let i = n.createElement(e);
		return i.className = t, i.textContent = r, i;
	}, c = s("section", "vc20523-query-metrics");
	c.id = "vc20523-query-metrics";
	let l = s("div", "vc20523-heading"), u = s("div");
	u.append(s("small", "", "V20.5.25 · ANÁLISIS"), s("h3", "", "Rendimiento del Data Engine y búsquedas")), l.append(u, s("span", "", "Solo lectura"));
	let d = s("p", "", "Mediciones locales de normalización, operaciones de análisis y búsqueda táctica. No incluyen vídeo, descarga, renderizado ni sincronización."), f = s("div", "vc20523-values"), p = /* @__PURE__ */ new Map();
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
	let b = s("button", "vc20523-refresh", "Actualizar medición");
	b.type = "button";
	let x = s("p", "vc20523-note", "El umbral de 16 ms es orientativo: no garantiza respuesta en tiempo real. No se guardan códigos, nombres, partidos ni resultados en este diagnóstico.");
	c.append(l, d, s("h4", "vc20524-subheading", "Búsqueda táctica"), f, m, h, _, v, b, x);
	let S = n.getElementById(i ? "vc60-stat-grid" : "vc2059-observable");
	S?.parentNode === a ? S.insertAdjacentElement("afterend", c) : a.append(c);
	let C = !1, w = (e) => `${e.toFixed(2)} ms`, T = () => {
		if (C) return;
		let t = o.diagnostics(), n = {
			queries: String(t.queries),
			last: w(t.lastMs),
			average: w(t.averageMs),
			max: w(t.maxMs),
			slow: String(t.slowQueries),
			failures: String(t.failures)
		};
		for (let [e, t] of Object.entries(n)) {
			let n = p.get(e);
			n && n.textContent !== t && (n.textContent = t);
		}
		let r = e.VC_ANALYSIS_NORMALIZE_20524?.diagnostics?.(), i = {
			normalizations: String(r?.normalizations ?? 0),
			last: w(r?.lastMs ?? 0),
			average: w(r?.averageMs ?? 0),
			max: w(r?.maxMs ?? 0),
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
			average: w(a?.averageMs ?? 0),
			slow: String(a?.slowOperations ?? 0),
			failures: String(a?.failures ?? 0)
		};
		for (let [e, t] of Object.entries(s)) {
			let n = y.get(e);
			n && n.textContent !== t && (n.textContent = t);
		}
	};
	b.addEventListener("click", T), T();
	let E = Object.freeze({
		readOnly: !0,
		refresh: T,
		dispose() {
			C || (C = !0, b.removeEventListener("click", T), c.remove(), tt.delete(e));
		}
	});
	return tt.set(e, E), E;
}
// src/state/analysis-normalizer.ts
var it = /* @__PURE__ */ new Set([
	"S",
	"R",
	"E",
	"A",
	"B",
	"D",
	"F",
	"C"
]), at = /* @__PURE__ */ new Set([
	"#",
	"+",
	"!",
	"-",
	"/",
	"="
]), B = (e) => String(e ?? "").trim(), V = (e) => e != null && B(e) !== "", ot = (e) => encodeURIComponent(B(e));
function H(e) {
	let t = B(e).toUpperCase().match(/^Z?([1-9])([ABCD])?$/);
	return t ? {
		zone: Number(t[1]),
		quadrant: t[2] || null,
		code: "Z" + t[1] + (t[2] || "")
	} : null;
}
var st = (e) => B(e.playerNameSnapshot || e.playerLabel || e.playerNumberSnapshot || e.playerId || e.playerNumber);
function ct(r) {
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
				ot(u),
				m,
				p ? "id:" + ot(p) : "pos:" + d
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
					key: g + "|" + (p ? "id:" + ot(p) : "pos:" + a),
					rallyKey: g,
					matchId: u,
					set: m,
					rallyIndex: d + 1,
					actionIndex: a,
					nativeId: p,
					team: c,
					code: B(t.code),
					skill: it.has(l) ? l : null,
					skillRaw: l,
					evaluation: at.has(f) ? f : null,
					evaluationRaw: f,
					player: st(t) || null,
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
var lt = /* @__PURE__ */ new WeakMap();
function ut(e) {
	let t = lt.get(e);
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
				return ct(e);
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
	return lt.set(e, l), e.VC_ANALYSIS_NORMALIZE_20524 = l, l;
}
// src/state/analysis-operations.ts
var U = (e) => String(e ?? "").trim(), dt = (e) => e != null && U(e) !== "", ft = (e) => e === "ours" || e === "opponent" ? e : null, pt = (e) => Array.isArray(e) ? e : [], mt = (e, t) => t ? Math.round(1e3 * e / t) / 10 : null;
function ht(e, t = {}) {
	let n = ft(t.team), r = dt(t.set) ? Number(t.set) : null, i = dt(t.rotation) ? Number(t.rotation) : null, a = U(t.phase).toUpperCase(), o = U(t.skill).toUpperCase(), s = U(t.evaluation), c = U(t.player).toLocaleLowerCase("es"), l = H(t.startZone), u = H(t.endZone), d = U(t.setter).toLocaleLowerCase("es"), f = e.rallies.filter((e) => e.closed && (!r || e.set === r) && (!i || (n ? (n === "ours" ? e.ownRotation : e.rivalRotation) === i : !1)) && (!a || !!e.serving && (n ? a === "K1" ? e.serving !== n : a === "K2" && e.serving === n : !1))), p = new Set(f.map((e) => e.key)), m = !!(o || s || c || l || u || t.video === !0), h = e.contacts.filter((e) => p.has(e.rallyKey) && (!n || e.team === n) && (!o || e.skill === o) && (!s || e.evaluation === s) && (!c || e.player?.toLocaleLowerCase("es") === c) && (!l || e.fields.startZone?.code === l.code) && (!u || e.fields.endZone?.code === u.code) && (t.video !== !0 || e.video)), g = e.chains.filter((e) => p.has(e.rallyKey) && (!n || e.team === n) && (!d || e.setter.player?.toLocaleLowerCase("es") === d)), _ = d ? new Set(g.map((e) => e.possessionKey)) : null, v = _ ? h.filter((e) => _.has(e.possessionKey)) : h, y = new Set(m ? v.map((e) => e.rallyKey) : d ? g.map((e) => e.rallyKey) : f.map((e) => e.key)), b = f.filter((e) => y.has(e.key)), x = new Set(b.map((e) => e.key));
	return {
		rallies: b,
		contacts: v.filter((e) => x.has(e.rallyKey)),
		possessions: e.possessions.filter((e) => x.has(e.rallyKey) && (!n || e.team === n) && (!_ || _.has(e.key))),
		chains: g.filter((e) => x.has(e.rallyKey)),
		target: n,
		filters: t
	};
}
function gt(e, t = "A") {
	let n = pt(e).filter((e) => e.skill === t), r = n.filter((e) => e.evaluation), i = r.filter((e) => e.evaluation === "#").length, a = r.filter((e) => e.evaluation === "=").length, o = r.filter((e) => e.evaluation === "/").length;
	return {
		recorded: n.length,
		rated: r.length,
		missing: n.length - r.length,
		kills: i,
		errors: a,
		blocked: o,
		killPct: mt(i, r.length),
		efficiency: t === "A" ? mt(i - a - o, r.length) : null
	};
}
function _t(e, t) {
	let n = ft(t);
	if (!n) return null;
	let r = pt(e).filter((e) => e.closed), i = r.filter((e) => e.serving && e.serving !== n), a = r.filter((e) => e.serving === n), o = (e) => {
		let t = e.filter((e) => e.winner === n).length;
		return {
			n: e.length,
			won: t,
			pct: mt(t, e.length)
		};
	};
	return {
		closed: r.length,
		unknownServe: r.filter((e) => !e.serving).length,
		k1: o(i),
		k2: o(a)
	};
}
function vt(e) {
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
function yt(e, t, n) {
	let r = ft(n), i = _t(e.rallies, r), a = t && typeof t == "object" && "points" in t ? t.points : void 0;
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
var bt = /* @__PURE__ */ new WeakMap();
function xt(e) {
	let t = bt.get(e);
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
		filter: (e, t = {}) => m("filter", () => ht(e, t)),
		evaluate: (e, t = "A") => m("evaluate", () => gt(e, t)),
		points: (e, t) => m("points", () => _t(e, t)),
		coverage: (e) => m("coverage", () => vt(e)),
		reconcile: (e, t, n) => m("reconcile", () => yt(e, t, n)),
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
	return bt.set(e, h), e.VC_ANALYSIS_OPERATIONS_20525 = h, h;
}
// src/domain/rally-shadow.ts
var St = 40, Ct = [
	"p1",
	"p2",
	"p3",
	"p4",
	"p5",
	"p6"
], wt = [
	"liveVideoSessionId",
	"liveVideoStart",
	"liveVideoEnd",
	"liveVideoLinkedAt"
], Tt = (e, t) => e.us === t.us && e.opponent === t.opponent, W = (e, t, n = !1) => Object.freeze({
	operation: e,
	verdict: t.length ? "difference" : n ? "unverified" : "agree",
	areas: Object.freeze(t.length ? [...t] : n ? ["missing-data"] : [])
}), Et = (n) => t(n.sets).map(e).find((e) => e && Number(e.number) === Number(n.currentSet) && Number.isInteger(Number(n.currentSet))) || null, Dt = (t) => {
	let n = e(t), r = e(n?.ours), i = e(n?.opponent);
	return !!r && !!i && Ct.every((e) => Object.hasOwn(r, e) && Object.hasOwn(i, e));
}, Ot = (t, n) => {
	let r = e(t), i = e(n), a = e(r?.ours), o = e(i?.ours), s = e(r?.opponent), c = e(i?.opponent);
	return !!a && !!o && !!s && !!c && Ct.every((e) => Object.is(a[e], o[e]) && Object.is(s[e], c[e]));
};
function kt(o, s, l) {
	let u = e(o), d = e(s), f = e(l), p = [];
	if (!u || !d || !f) return W("point", p, !0);
	let m = a(f);
	if (!m.before || !m.after || !n(f.winner) || !n(f.servingBefore) || !r(f.rotationBefore) || !r(f.opponentRotationBefore)) return W("point", p, !0);
	let h = c({
		score: m.before,
		serving: f.servingBefore,
		rotationUs: f.rotationBefore,
		rotationOpponent: f.opponentRotationBefore
	}, f.winner);
	if (h.state !== "projected" || !h.score) return W("point", p, !0);
	m.state !== "inconsistent" && Tt(h.score, m.after) || p.push("score");
	let g = i({
		us: d.scoreUs,
		opponent: d.scoreOpponent
	}), _ = !g;
	g && !Tt(g, m.after) && !p.includes("score") && p.push("score");
	let v = e(u.liveRally);
	v && t(v.actions).length === 0 && !e(v.startSnapshot) && (n(u.servingTeam) && u.servingTeam !== h.serving ? p.push("service") : n(u.servingTeam) || (_ = !0), r(u.rotationNo) && r(u.opponentRotationNo) ? (u.rotationNo !== h.rotationUs || u.opponentRotationNo !== h.rotationOpponent) && p.push("rotation") : _ = !0);
	let y = te(u, m.after);
	y.state === "projected" ? (typeof d.finished == "boolean" && d.finished !== y.setFinished ? p.push("set") : typeof d.finished != "boolean" && (_ = !0), y.setFinished && n(d.winner) && d.winner !== y.setWinner ? p.push("set") : y.setFinished && !n(d.winner) && (_ = !0), y.matchFinished === !0 && u.status !== "finished" && p.push("match")) : _ = !0;
	let b = ne(f);
	return (b.lineup === "missing" || b.actionsCaptured === !1) && (_ = !0), W("point", [...new Set(p)], _);
}
var At = (n, r) => {
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
function jt(t, a, o) {
	let s = [], c = e(a.liveRally), l = t.lastRally, u = t.expectedUndo;
	if (!l || !c || !u || l.id === void 0 || c.id !== l.id) return W("undo", s, !0);
	let d = i({
		us: o.scoreUs,
		opponent: o.scoreOpponent
	}), f = !d;
	d && !Tt(d, u.score) && s.push("score"), n(a.servingTeam) ? a.servingTeam !== u.serving && s.push("service") : f = !0, r(a.rotationNo) && r(a.opponentRotationNo) ? (a.rotationNo !== u.rotationUs || a.opponentRotationNo !== u.rotationOpponent) && s.push("rotation") : f = !0, Array.isArray(l.actions) && Array.isArray(c.actions) ? l.actions.length !== c.actions.length && s.push("actions") : f = !0, Dt(l.lineupBefore) && Dt(a.lineup) ? Ot(l.lineupBefore, a.lineup) || s.push("lineup") : f = !0;
	let p = wt.filter((e) => l[e] !== void 0 && l[e] !== null);
	return p.length && p.some((e) => !Object.is(l[e], c[e])) && s.push("video"), W("undo", [...new Set(s)], f);
}
function Mt() {
	let t = null, n = !1, r = 0, i = 0, a = 0, o = 0, s = 0, c = 0, l = 0, u = [], d = (e) => (r++, e.operation === "point" ? i++ : a++, e.verdict === "agree" ? o++ : e.verdict === "difference" ? s++ : c++, e.verdict !== "agree" && (u.push(e), u.length > St && u.shift()), e);
	return Object.freeze({
		observe(r) {
			if (n) return null;
			let i = e(r), a = i && Et(i);
			if (!i || !a) return t = null, null;
			let o = At(i, a), s = t;
			return t = o, s ? s.match !== i || s.set !== a ? (l++, null) : o.count === s.count ? null : o.count === s.count + 1 ? d(kt(i, a, o.lastRally)) : o.count === s.count - 1 ? s.lastId === void 0 || e(i.liveRally)?.id !== s.lastId ? (l++, null) : d(jt(s, i, a)) : (l++, null) : null;
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
function Nt(e) {
	let t = e.document, n = t.getElementById("v11-management");
	if (!n) return null;
	if (e.VC_SHADOW_20515) return e.VC_SHADOW_20515;
	let r = Mt();
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
var Pt = "20.1.2", Ft = "vc-multi-device-validation", It = (e) => String(e ?? "").trim(), G = (e) => {
	let t = Number(e);
	return Number.isSafeInteger(t) && t >= 0 ? t : 0;
}, Lt = (e) => {
	let t = It(e);
	return /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/.test(t) && Number.isFinite(Date.parse(t)) ? t : "";
};
function K({ cloud: t = {}, device: n = {}, journal: r = {}, now: i = Date.now() } = {}) {
	let a = e(t) || {}, o = e(n) || {}, s = e(r) || {};
	return {
		schema: Ft,
		version: Pt,
		createdAt: new Date(i).toISOString(),
		connected: !!a.connected,
		dirty: !!a.dirty,
		blocked: !!a.blockedReason,
		realtimeSubscribed: o.realtimeState === "SUBSCRIBED",
		lastReadAt: G(a.lastReadAt),
		lastWriteAt: G(a.lastWriteAt),
		lastReadErrorAt: G(a.lastReadErrorAt),
		lastObservedRemoteStamp: Lt(a.lastObservedRemoteStamp),
		lastAppliedRemoteStamp: Lt(a.lastAppliedRemoteStamp),
		lastConfirmedWriteStamp: Lt(a.lastConfirmedWriteStamp),
		pendingJournal: typeof s.pendingCount == "number" ? G(s.pendingCount) : null,
		journalError: !!s.lastError,
		warning: "Mismo origen y cuenta deben comprobarse manualmente. La igualdad de marcas CAS no verifica contenido ni entrega de vídeo."
	};
}
function q(t) {
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
	return K({
		cloud: n,
		device: { realtimeState: n.realtimeSubscribed ? "SUBSCRIBED" : "" },
		journal: {
			pendingCount: n.pendingJournal,
			lastError: n.journalError
		},
		now: Date.parse(String(n.createdAt))
	});
}
function J(e, t) {
	let n = q(e), r = q(t), i = (e) => e.connected && !e.dirty && !e.blocked && !e.journalError && e.pendingJournal === 0;
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
var Rt = /* @__PURE__ */ new WeakMap(), zt = Object.freeze({
	VERSION: Pt,
	SCHEMA: Ft,
	report: K,
	parseReport: q,
	compareReports: J,
	mount: Vt
});
function Bt(e) {
	return e.VC_SYNC_2012 = zt, zt;
}
function Vt(e) {
	let t = Rt.get(e);
	if (t) return t;
	let n = e.document;
	if (!n) return null;
	let r = (e) => n.getElementById(e), i = (e, t = "") => {
		let r = n.createElement(e);
		return r.textContent = t, r;
	}, a = null, o = !1, s = !1, c = !1, l = null, u = "", d = null, f = async () => {
		let t = e.VC_V962_CLOUD_EFFICIENT?.diagnostics?.() || {}, n = e.VC_DEVICE_SYNC?.diagnostics?.() || {}, r = e.VC_V962_CLOUD_EFFICIENT?.getAccountId?.() || "";
		return K({
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
				let n = l ? J(e, l) : null, i = r("vc2012-feedback");
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
					l = q(await t.text()), u = "Informe del segundo dispositivo cargado para comparar.";
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
			s || (s = !0, S && n.removeEventListener("DOMContentLoaded", x), d?.disconnect(), d = null, e.removeEventListener("vc200:sync-state", y), e.removeEventListener("vc2011:journal", y), n.removeEventListener("click", b, !0), r("vc2012-refresh")?.removeEventListener("click", m), r("vc2012-export")?.removeEventListener("click", g), r("vc2012-file")?.removeEventListener("change", _), o && a?.remove(), a = null, l = null, Rt.delete(e));
		}
	});
	return Rt.set(e, C), C;
}
// src/domain/rally-recovery-evidence.ts
var Ht = Object.freeze([
	"score",
	"service",
	"rotation",
	"set",
	"match",
	"actions",
	"lineup",
	"video"
]), Y = (e) => {
	try {
		return JSON.stringify(e);
	} catch {
		return;
	}
}, Ut = (n) => t(n.sets).map(e).find((e) => e && Number(e.number) === Number(n.currentSet) && Number.isInteger(Number(n.currentSet))) || null;
function X(n) {
	try {
		let r = e(n);
		if (!r) return null;
		let i = Ut(r), a = i && Array.isArray(i.rallies) ? i.rallies : null, o = e(a?.at(-1)), s = e(r.liveRally), c = typeof r.id == "string" && r.id.length > 0 || typeof r.id == "number" && Number.isFinite(r.id) ? Y([r.id, r.currentSet]) : void 0, l = {
			score: i ? Y([i.scoreUs, i.scoreOpponent]) : void 0,
			service: Y(r.servingTeam),
			rotation: Y([r.rotationNo, r.opponentRotationNo]),
			set: i ? Y([r.currentSet, t(r.sets).map((t) => {
				let n = e(t);
				return n ? [
					n.number,
					n.scoreUs,
					n.scoreOpponent,
					n.finished,
					n.winner
				] : null;
			})]) : void 0,
			match: Y(r.status),
			actions: a ? Y([
				a.length,
				o?.id,
				o?.actions,
				s?.id,
				s?.actions
			]) : void 0,
			lineup: Y([
				r.lineup,
				r.baseLineup,
				r.lineupRoles,
				r.libero
			]),
			video: Y([
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
function Wt(e, t) {
	if (!e || !t) return Object.freeze(["missing-data"]);
	let n = [], r = !1;
	for (let i of Ht) e.fields[i] === void 0 || t.fields[i] === void 0 ? r = !0 : e.fields[i] !== t.fields[i] && n.push(i);
	return r && n.push("missing-data"), Object.freeze(n);
}
function Z(e, t) {
	return !!e && !!t && !!e.identity && e.identity === t.identity && Ht.every((n) => e.fields[n] !== void 0 && t.fields[n] !== void 0 && e.fields[n] === t.fields[n]);
}
function Gt(e, t, n) {
	return !e || !t || !n || !e.identity || !t.identity || !n.identity || e.identity !== t.identity || e.identity !== n.identity || [...Ht].some((r) => e.fields[r] === void 0 || t.fields[r] === void 0 || n.fields[r] === void 0) ? "unreadable" : Z(e, t) ? Z(e, n) ? "unchanged-observed" : "divergent" : Z(n, t) ? "durable-after" : Z(n, e) ? "durable-before" : "divergent";
}
// src/domain/rally-transaction-pilot.ts
var Kt = 40, qt = (e, t) => e.us === t.us && e.opponent === t.opponent, Jt = (n) => {
	let r = e(n);
	return r && t(r.sets).map(e).find((e) => e && Number(e.number) === Number(r.currentSet) && Number.isInteger(Number(r.currentSet))) || null;
}, Q = (e, t, n = [], r = "not-checked") => Object.freeze({
	operation: e,
	verdict: t,
	areas: Object.freeze([...n]),
	durability: r
}), Yt = (a, o, s, c, l, u, d) => {
	let f = e(c), p = Jt(c);
	if (o.state !== "projected" || !o.after || !f || !p || !l || f !== s || p !== l) return Q(a, "unverified", ["missing-data"]);
	let m = t(p.rallies).length;
	if (a === "point") {
		if (m !== d + 1) return Q(a, "unverified", ["missing-data"]);
		let e = kt(f, p, t(p.rallies).at(-1)), n = [...e.areas], r = i({
			us: p.scoreUs,
			opponent: p.scoreOpponent
		});
		return r && !qt(r, o.after.score) && !n.includes("score") && n.push("score"), Q("point", n.length ? "difference" : e.verdict, n);
	}
	let h = e(f.liveRally);
	if (m !== d - 1 || !u || u.id === void 0 || h?.id !== u.id) return Q("undo", "unverified", ["missing-data"]);
	let g = [], _ = i({
		us: p.scoreUs,
		opponent: p.scoreOpponent
	}), v = !_;
	return _ && !qt(_, o.after.score) && g.push("score"), n(f.servingTeam) ? f.servingTeam !== o.after.serving && g.push("service") : v = !0, r(f.rotationNo) && r(f.opponentRotationNo) ? (f.rotationNo !== o.after.rotationUs || f.opponentRotationNo !== o.after.rotationOpponent) && g.push("rotation") : v = !0, Array.isArray(u.actions) && Array.isArray(h.actions) ? u.actions.length !== h.actions.length && g.push("actions") : v = !0, Q("undo", g.length ? "difference" : v ? "unverified" : "agree", g.length ? g : v ? ["missing-data"] : []);
};
function Xt(n, r = {}) {
	let i = Promise.resolve(), a = !1, o = r.requireRecoveryAfterNativeFailure === !0, s = o && r.startBlockedForPendingRecovery === !0, c = "not-checked", l = 0, u = 0, d = 0, f = 0, p = 0, m = 0, h = 0, g = 0, _ = 0, v = 0, y = 0, b = [], x = (e) => {
		u++, e.verdict === "agree" ? d++ : e.verdict === "difference" ? f++ : e.verdict === "native-rejected" ? m++ : e.verdict === "native-declined" ? h++ : e.verdict === "recovery-blocked" ? v++ : p++, (e.verdict === "native-rejected" || e.verdict === "native-declined") && (c = e.durability, e.areas.some((e) => e !== "missing-data") && g++, e.areas.includes("missing-data") && _++), e.verdict !== "agree" && (b.push(e), b.length > Kt && b.shift());
	}, S = () => {
		try {
			return n.readCurrent();
		} catch {
			return null;
		}
	}, C = () => X(S()), w = async (e, t) => {
		if (!n.readDurableLocal) return "not-configured";
		try {
			return Gt(e, t, X(await n.readDurableLocal()));
		} catch {
			return "unreadable";
		}
	}, T = async (r, i) => {
		if (s) throw x(Q(r, "recovery-blocked")), Error("Recuperación pendiente: comprueba el partido y el guardado local antes de continuar.");
		let a = S(), c = Jt(a), l = t(c?.rallies), u = X(a), d = l.length, f = e(l.at(-1)), p = null;
		try {
			p = r === "point" ? ae(a, i) : oe(a);
		} catch {}
		let m;
		try {
			m = r === "point" ? await n.awardPoint(i) : await n.undoRally();
		} catch (e) {
			o && (s = !0);
			let t = C(), n = await w(u, t);
			throw x(Q(r, "native-rejected", Wt(u, t), n)), e;
		}
		if (m === !1) {
			o && (s = !0);
			let e = C(), t = await w(u, e);
			return x(Q(r, "native-declined", Wt(u, e), t)), m;
		}
		try {
			x(p ? Yt(r, p, a, S(), c, f, d) : Q(r, "unverified", ["missing-data"]));
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
				return Z(C(), X(await n.readDurableLocal())) ? (s = !1, !0) : !1;
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
var Zt = 27262976, $ = (e, t) => Object.freeze({
	version: "20.5.19",
	source: "existing-v2011-pending-checkpoint",
	status: e,
	pendingCount: t,
	requiresManualReview: !0,
	autoResumeAllowed: !1
});
async function Qt(n) {
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
		if (!c || c.accountId !== r || c.status !== "pending" || c.mode !== "draft" && c.mode !== "upload" || typeof c.stateJson != "string" || c.stateJson.length === 0 || c.stateJson.length > Zt) return $("unavailable", s);
		let l = e(e(e(JSON.parse(c.stateJson))?.equiposData)?.[i]);
		if (!l || !Array.isArray(l.scoutingMatches)) return $("missing-match", s);
		let u = t(l.scoutingMatches).map(e).filter((e) => e && String(e.id) === String(n.matchId));
		if (u.length !== 1) return $(u.length ? "ambiguous" : "missing-match", s);
		let d = Gt(X(n.before), X(n.after), X(u[0]));
		return $(d === "durable-before" ? "checkpoint-before" : d === "durable-after" ? "checkpoint-after" : d === "unchanged-observed" ? "checkpoint-unchanged" : d === "divergent" ? "checkpoint-divergent" : "unavailable", s);
	} catch {
		return $("unavailable", a);
	}
}
// src/vc2055-entry.ts
if (typeof window < "u" && window.document) {
	Bt(window), nt(window), ut(window), xt(window);
	let e = () => {
		Se(window), Je(window), rt(window), E(window), j(window), he(window), ge(window), je(window), Ge(window), Nt(window), Vt(window);
	};
	window.document.readyState === "loading" ? window.document.addEventListener("DOMContentLoaded", e, { once: !0 }) : e();
}
export { Ye as SEARCH_FILTERS, l as attackEfficiency, me as auditCommittedMatch, o as auditMatchScores, _t as calculateAnalysisPoints, C as canonicalReaders, X as captureRecoveryFrame, Wt as changedRecoveryAreas, ee as classifyPreflight, Gt as classifyRecoveryEvidence, pe as classifyStoredAction, kt as compareConfirmedPoint, J as compareDeviceValidation, y as compareNativeCode, xe as createObservableMatchStore, Mt as createRallyShadowSession, Xt as createRallyTransactionPilot, qe as createScoutingProjectionStore, A as createShadowSession, Z as equalRecoveryFrames, gt as evaluateAnalysisContacts, ht as filterAnalysis, vt as inspectAnalysisCoverage, se as inspectClosedRally, v as inspectCodeShape, Qt as inspectJournalRecovery, Ae as inspectLiveSetStatistics, T as inspectMatchDomain, We as inspectPlayerBoxscore, ne as inspectRallyRestoration, S as inspectSubstitution, ut as installAnalysisNormalizeBridge, xt as installAnalysisOperationsBridge, nt as installAnalysisQueryBridge, Bt as installMultiDeviceAPI, rt as mountAnalysisQueryPerformance, he as mountCommittedPanel, E as mountDomainDiagnostic, ge as mountGrammarPanel, je as mountLiveStatisticsPanel, Vt as mountMultiDevicePanel, Se as mountObservablePanel, Ge as mountPlayerBoxscore, Nt as mountRallyShadowPanel, Je as mountScoutingProjectionStore, j as mountShadowPanel, s as nextRotation, ct as normalizeAnalysisMatch, H as normalizeAnalysisZone, Qe as normalizeRallySearchFilters, q as parseDeviceValidation, ae as planAwardPoint, oe as planUndoLastRally, be as projectObservableMatch, c as projectPoint, te as projectSetBoundary, $e as queryRallies, w as readCanonicalMatch, yt as reconcileAnalysisPoints, K as reportDeviceValidation, u as sideOutBreakPoint, a as verifyRallyScore };
