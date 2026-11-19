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
function j() {
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
function ee(e) {
	let t = e.document, n = t.getElementById("v11-management");
	if (!n) return null;
	if (e.VC_SHADOW_2056) return e.VC_SHADOW_2056;
	let r = j(), i = (e, n = "", r = "") => {
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
function P(t) {
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
var F = (e, t, a, o) => {
	let s = i(e);
	return s && n(t) && r(a) && r(o) ? Object.freeze({
		score: s,
		serving: t,
		rotationUs: a,
		rotationOpponent: o
	}) : null;
}, I = (e, t, n = null, r = null, i = null, a = null) => Object.freeze({
	kind: e,
	state: t === "ready" ? "projected" : t === "finished" ? "blocked" : "unknown",
	reason: t,
	before: n,
	after: r,
	setBoundary: i,
	restoration: a,
	includesLineups: !1,
	readOnly: !0
}), te = (n) => t(n.sets).map(e).find((e) => e && Number(e.number) === Number(n.currentSet) && Number.isInteger(Number(n.currentSet))) || null, L = (e, t) => e.us === t.us && e.opponent === t.opponent;
function ne(t, r) {
	let a = e(t);
	if (!a) return I("award-point", "no-match");
	if (a.status === "finished") return I("award-point", "finished");
	let o = te(a);
	if (!o) return I("award-point", "no-set");
	if (o.finished === !0) return I("award-point", "finished");
	let s = i({
		us: o.scoreUs,
		opponent: o.scoreOpponent
	}), l = e(e(a.liveRally)?.startSnapshot), u = F(s, l ? l.servingBefore : a.servingTeam, l ? l.rotationBefore : a.rotationNo, l ? l.opponentRotationBefore : a.opponentRotationNo);
	if (!u || !n(r)) return I("award-point", "invalid-data");
	if (l) {
		let e = i(l.scoreBefore);
		if (!e || !L(e, u.score) || l.servingBefore !== a.servingTeam || l.rotationBefore !== a.rotationNo || l.opponentRotationBefore !== a.opponentRotationNo) return I("award-point", "stale-score", u);
	}
	let d = c({
		score: u.score,
		serving: u.serving,
		rotationUs: u.rotationUs,
		rotationOpponent: u.rotationOpponent
	}, r), f = F(d.score, d.serving, d.rotationUs, d.rotationOpponent);
	return f ? I("award-point", "ready", u, f, N(a, f.score)) : I("award-point", "invalid-data", u);
}
function R(n) {
	let r = e(n);
	if (!r) return I("undo-last-rally", "no-match");
	if (r.status === "finished") return I("undo-last-rally", "finished");
	let o = te(r);
	if (!o) return I("undo-last-rally", "no-set");
	let s = t(o.rallies), c = e(s[s.length - 1]);
	if (!c) return I("undo-last-rally", "no-rallies");
	let l = F(i({
		us: o.scoreUs,
		opponent: o.scoreOpponent
	}), r.servingTeam, r.rotationNo, r.opponentRotationNo), u = F(c.scoreBefore, c.servingBefore, c.rotationBefore, c.opponentRotationBefore);
	if (!l || !u || a(c).state !== "verified") return I("undo-last-rally", "invalid-data", l);
	let d = i(c.scoreAfter);
	return !d || !L(d, l.score) ? I("undo-last-rally", "stale-score", l) : I("undo-last-rally", "ready", l, u, null, P(c));
}
function re(t, o = null) {
	let s = e(t), l = e(o), u = a(s), d = "unknown", f = "unknown", p = i(l?.scoreBefore);
	u.after && p && (d = L(u.after, p) ? "match" : "mismatch");
	let m = F(s?.scoreBefore, s?.servingBefore, s?.rotationBefore, s?.opponentRotationBefore);
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
var ie = 2e4, ae = 6e4, oe = 80, z = /* @__PURE__ */ new Set([
	"S",
	"R",
	"E",
	"A",
	"B",
	"D",
	"F",
	"C"
]), B = (e) => typeof e == "string" && z.has(e) ? e : "—", se = {
	difference: "El código guardado y los campos de la acción no coinciden.",
	"coverage-gap": "El código guardado utiliza sintaxis todavía no cubierta por TypeScript.",
	unverified: "Faltan campos del registro para comprobarlo con seguridad.",
	"no-code": "La acción está registrada sin código original.",
	score: "El ganador no concuerda con el cambio de marcador registrado.",
	"score-sequence": "El tanteo final y el inicial del siguiente rally no coinciden.",
	rotation: "La siguiente rotación o el turno de saque no concuerdan con la proyección básica."
};
function ce(t) {
	let r = e(t), i = B(r?.skill);
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
		skill: B(o.skill) || i
	});
	if (!n(r.team) || !z.has(String(r.skill)) || ![
		"#",
		"+",
		"!",
		"-",
		"/",
		"="
	].includes(String(r.evaluation)) || r.playerNumberSnapshot === null || r.playerNumberSnapshot === void 0 || String(r.playerNumberSnapshot).trim() === "") return Object.freeze({
		kind: "unverified",
		skill: B(o.skill)
	});
	let s = y(a, { action: r });
	return Object.freeze({
		kind: s.state === "agree" ? "agree" : s.state === "disagree" ? "difference" : "unverified",
		skill: B(o.skill)
	});
}
function le(n) {
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
			skill: B(n),
			reason: se[e]
		})), a.length > oe && a.shift();
	}, c = (e, t) => {
		if (i.actions >= ae) return o = !0, !1;
		i.actions++;
		let n = ce(e);
		return n.kind === "agree" ? i.agree++ : n.kind === "difference" ? i.difference++ : n.kind === "coverage-gap" ? i.coverageGap++ : n.kind === "no-code" ? i.noCode++ : i.unverified++, n.kind !== "agree" && s(n.kind, t, n.skill), !0;
	}, l = t(r?.sets);
	main: for (let n = 0; n < l.length; n++) {
		let r = e(l[n]);
		if (!r) continue;
		let a = t(r.rallies);
		for (let r = 0; r < a.length; r++) {
			if (i.rallies >= ie) {
				o = !0;
				break main;
			}
			let l = e(a[r]);
			if (!l) continue;
			i.rallies++;
			let u = `S${n + 1} · R${r + 1}`, d = e(a[r + 1]), f = re(l, d);
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
function ue(e) {
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
		let e = le(x());
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
function de(e) {
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
var fe = (e) => typeof e == "number" && Number.isSafeInteger(e) && e >= 0 ? e : null, pe = (e) => typeof e == "number" && Number.isSafeInteger(e) && e > 0 ? e : null, me = (e, t) => Object.keys(e).every((n) => Object.is(e[n], t[n]));
function V(i, a) {
	let o = e(i), s = pe(o?.currentSet), c = t(o?.sets), l = e(a) || e(c.find((t) => e(t)?.number === s)), u = o?.status === "live" || o?.status === "finished" ? o.status : null;
	return Object.freeze({
		score: Object.freeze({
			set: s,
			us: fe(l?.scoreUs),
			opponent: fe(l?.scoreOpponent)
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
function he(t) {
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
			return V(t, r);
		} catch {}
		return V(null);
	}, o = a(), s = !1, c = !1, l = !1, u = 0, d = 0, f = 0, p = (e = !1) => {
		if (s) return;
		let t = a(), r = n.filter((e) => !me(o[e], t[e]));
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
function ge(e) {
	let t = e.document, n = t.getElementById("v11-management");
	if (!n) return null;
	if (e.VC_STATE_2059) return e.VC_STATE_2059;
	let r = he(e), i = (e, n = "", r = "") => {
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
var _e = 3e3, H = 25e3, U = (e, t) => t ? Math.round(e / t * 100) : null, ve = () => ({
	receptions: 0,
	perfect: 0,
	positive: 0,
	attacks: 0,
	kills: 0,
	errors: 0,
	blocked: 0
}), ye = (t, n) => {
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
}, be = (e) => Object.freeze({
	attempts: e.receptions,
	perfect: e.perfect,
	positive: e.positive,
	positivePct: U(e.positive, e.receptions),
	perfectPct: U(e.perfect, e.receptions)
}), xe = (e) => Object.freeze({
	attempts: e.attacks,
	kills: e.kills,
	errors: e.errors,
	blocked: e.blocked,
	efficiencyPct: U(e.kills - e.errors - e.blocked, e.attacks)
}), Se = (e, t) => Object.freeze({
	attempts: e,
	successes: t,
	percent: U(t, e)
});
function Ce(r) {
	let i = e(r), a = Number.isSafeInteger(i?.currentSet) && Number(i?.currentSet) > 0 ? Number(i?.currentSet) : null, o = e(t(i?.sets).find((t) => a !== null && e(t)?.number === a)), s = t(o?.rallies), c = ve(), l = ve(), u = 0, d = 0, f = 0, p = 0, m = 0, h = 0, g = !1;
	if (o) for (let r of s) {
		if (m >= _e) {
			g = !0;
			break;
		}
		let i = e(r);
		if (m++, !i) continue;
		let a = i.winner, o = i.servingBefore;
		n(a) && n(o) && (o === "opponent" ? (u++, a === "ours" && d++) : (f++, a === "ours" && p++));
		for (let e of t(i.actions)) {
			if (h >= H) {
				g = !0;
				break;
			}
			h++, ye(c, e);
		}
		if (g) break;
	}
	let _ = t(e(i?.liveRally)?.actions);
	for (let e of _.slice(0, H)) ye(l, e);
	_.length > H && (g = !0);
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
		sideOut: Se(u, d),
		breakPoint: Se(f, p),
		reception: be(c),
		attack: xe(c),
		provisional: Object.freeze({
			actions: _.length,
			receptions: l.receptions,
			attacks: l.attacks,
			reception: be(v),
			attack: xe(v)
		})
	});
}
// src/state/live-statistics-runtime.ts
function we(e) {
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
	}, y = () => {
		let t = Ce(w(e));
		return m = t, h() && v(t), t;
	}, b = a.subscribe("change", () => {
		f || p || !h() || (p = !0, Promise.resolve().then(() => {
			p = !1, !f && h() && y();
		}));
	}), x = typeof MutationObserver == "function" ? new MutationObserver(() => {
		h() && y();
	}) : null;
	x?.observe(r, {
		attributes: !0,
		attributeFilter: ["class"]
	}), x?.observe(i, {
		attributes: !0,
		attributeFilter: ["class"]
	}), h() && y();
	let S = Object.freeze({
		version: "20.5.10",
		readOnly: !0,
		getReport: () => m,
		refresh: y,
		dispose() {
			f || (f = !0, x?.disconnect(), b(), n.replaceChildren(), m = null, e.VC_LIVE_STATS_20510 === S && delete e.VC_LIVE_STATS_20510);
		}
	});
	return e.VC_LIVE_STATS_20510 = S, S;
}
// src/state/player-boxscore.ts
var Te = 2e4, Ee = 6e4, W = 80, De = /* @__PURE__ */ new Set([
	"#",
	"+",
	"!",
	"-",
	"/",
	"="
]), G = () => ({
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
}), K = (e, t) => t ? Math.round(e / t * 100) : null, q = (e) => {
	if (typeof e == "number" && Number.isSafeInteger(e) && e > 0) return e;
	if (typeof e == "string" && /^\d{1,15}$/.test(e)) {
		let t = Number(e);
		return Number.isSafeInteger(t) && t > 0 ? t : null;
	}
	return null;
}, Oe = (e) => {
	let t = typeof e == "number" && Number.isSafeInteger(e) ? String(e) : typeof e == "string" ? e.trim() : "";
	return /^\d{1,3}$/.test(t) ? t : null;
}, J = (e) => typeof e == "string" ? e.trim().slice(0, 50) : "";
function ke(e, t) {
	let n = q(e.playerId), r = J(e.opponentPlayerUid), i = Oe(e.playerNumberSnapshot), a = J(e.playerLabel), o = Oe((a.match(/^#?\s*(\d{1,3})(?:\D|$)/) || [])[1]), s = i || (t === "opponent" ? o : null), c = J(e.playerNameSnapshot) || a.replace(/^#?\s*\d{1,3}\s*[·-]?\s*/, "") || "", l = t === "ours" && n !== null ? `id:${n}` : t === "opponent" && r ? `uid:${r}` : s === null ? "unidentified" : `num:${s}`;
	return {
		key: l,
		number: s,
		name: l === "unidentified" ? "Sin identificar" : c,
		identified: l !== "unidentified"
	};
}
var Y = (e, t) => {
	let n = t.skill, r = t.evaluation;
	return !De.has(String(r)) || ![
		"S",
		"R",
		"A",
		"B",
		"D",
		"E"
	].includes(String(n)) ? !1 : (e.actions++, n === "S" ? (e.s++, r === "#" && e.aces++, r === "=" && e.sErrors++) : n === "R" ? (e.r++, r === "#" && e.rPerfect++, (r === "#" || r === "+") && e.rPositive++) : n === "A" ? (e.a++, r === "#" && e.kills++, r === "=" && e.aErrors++, r === "/" && e.blocked++) : n === "B" ? (e.b++, r === "#" && e.bPoints++) : n === "D" ? e.d++ : n === "E" && e.e++, !0);
}, Ae = (e) => Object.freeze({
	attempts: e.a,
	kills: e.kills,
	errors: e.aErrors,
	blocked: e.blocked,
	efficiencyPct: K(e.kills - e.aErrors - e.blocked, e.a)
}), je = (e, t) => Object.freeze({
	attempts: e,
	won: t,
	percent: K(t, e)
});
function Me(i, a) {
	let o = e(i), s = a.team === "opponent" ? "opponent" : "ours", c = a.scope === "match" ? "match" : "current", l = r(a.rotation) ? a.rotation : null, u = Object.freeze({
		team: s,
		scope: c,
		rotation: l
	}), d = q(o?.currentSet), f = t(o?.sets), p = c === "match" ? f : f.filter((t) => d !== null && q(e(t)?.number) === d), m = !!o && p.some((t) => !!e(t)), h = /* @__PURE__ */ new Map(), g = /* @__PURE__ */ new Map(), _ = G();
	for (let e of [
		1,
		2,
		3,
		4,
		5,
		6
	]) g.set(e, {
		...G(),
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
			if (v >= Te) {
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
				if (y >= Ee) {
					C = !0;
					break main;
				}
				y++;
				let t = e(n);
				if (!t || t.team !== s || (c === null && S++, c !== null && Y(g.get(c), t), l !== null && c !== l)) continue;
				let r = ke(t, s), i = r.key, a = h.get(i);
				!a && h.size >= W ? (w = !0, Y(_, t) && (b++, r.identified || x++)) : (a || (a = {
					...G(),
					...r
				}, h.set(i, a)), !a.number && r.number && (a.number = r.number), !a.name && r.name && (a.name = r.name), Y(a, t) && (b++, a.identified || x++));
			}
		}
	}
	let T = [...h.values()].filter((e) => e.actions > 0).sort((e, t) => e.identified === t.identified ? (e.number === null ? Infinity : Number(e.number)) - (t.number === null ? Infinity : Number(t.number)) || e.name.localeCompare(t.name, "es") || e.key.localeCompare(t.key) : e.identified ? -1 : 1).slice(0, W).map((e) => Object.freeze({
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
			positivePct: K(e.rPositive, e.r),
			perfectPct: K(e.rPerfect, e.r)
		}),
		attack: Ae(e),
		block: Object.freeze({
			attempts: e.b,
			points: e.bPoints
		}),
		digs: e.d,
		sets: e.e
	})), E = [...g.values()].map((e) => Object.freeze({
		rotation: e.rotation,
		rallies: e.rallies,
		sideOut: je(e.so, e.soWon),
		breakPoint: je(e.bp, e.bpWon),
		attack: Ae(e)
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
function Ne(e) {
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
	}, O = () => {
		let t = {
			team: d.value === "opponent" ? "opponent" : "ours",
			scope: f.value === "match" ? "match" : "current",
			rotation: /^[1-6]$/.test(p.value) ? Number(p.value) : null
		}, n = Me(w(e), t);
		return x = n, S() && D(n), n;
	}, k = a.subscribe("change", () => {
		y || b || !S() || (b = !0, Promise.resolve().then(() => {
			b = !1, !y && S() && O();
		}));
	});
	for (let e of [
		d,
		f,
		p
	]) e.addEventListener("change", O);
	let A = typeof MutationObserver == "function" ? new MutationObserver(() => {
		S() && O();
	}) : null;
	A?.observe(r, {
		attributes: !0,
		attributeFilter: ["class"]
	}), A?.observe(i, {
		attributes: !0,
		attributeFilter: ["class"]
	}), S() && O();
	let j = Object.freeze({
		version: "20.5.11",
		readOnly: !0,
		getReport: () => x,
		refresh: O,
		dispose() {
			if (!y) {
				y = !0, A?.disconnect(), k();
				for (let e of [
					d,
					f,
					p
				]) e.removeEventListener("change", O);
				n.replaceChildren(), x = null, e.VC_PLAYER_BOXSCORE_20511 === j && delete e.VC_PLAYER_BOXSCORE_20511;
			}
		}
	});
	return e.VC_PLAYER_BOXSCORE_20511 = j, j;
}
// src/domain/rally-shadow.ts
var Pe = 40, Fe = [
	"p1",
	"p2",
	"p3",
	"p4",
	"p5",
	"p6"
], Ie = [
	"liveVideoSessionId",
	"liveVideoStart",
	"liveVideoEnd",
	"liveVideoLinkedAt"
], X = (e, t) => e.us === t.us && e.opponent === t.opponent, Z = (e, t, n = !1) => Object.freeze({
	operation: e,
	verdict: t.length ? "difference" : n ? "unverified" : "agree",
	areas: Object.freeze(t.length ? [...t] : n ? ["missing-data"] : [])
}), Le = (n) => t(n.sets).map(e).find((e) => e && Number(e.number) === Number(n.currentSet) && Number.isInteger(Number(n.currentSet))) || null, Re = (t) => {
	let n = e(t), r = e(n?.ours), i = e(n?.opponent);
	return !!r && !!i && Fe.every((e) => Object.hasOwn(r, e) && Object.hasOwn(i, e));
}, ze = (t, n) => {
	let r = e(t), i = e(n), a = e(r?.ours), o = e(i?.ours), s = e(r?.opponent), c = e(i?.opponent);
	return !!a && !!o && !!s && !!c && Fe.every((e) => Object.is(a[e], o[e]) && Object.is(s[e], c[e]));
};
function Q(o, s, l) {
	let u = e(o), d = e(s), f = e(l), p = [];
	if (!u || !d || !f) return Z("point", p, !0);
	let m = a(f);
	if (!m.before || !m.after || !n(f.winner) || !n(f.servingBefore) || !r(f.rotationBefore) || !r(f.opponentRotationBefore)) return Z("point", p, !0);
	let h = c({
		score: m.before,
		serving: f.servingBefore,
		rotationUs: f.rotationBefore,
		rotationOpponent: f.opponentRotationBefore
	}, f.winner);
	if (h.state !== "projected" || !h.score) return Z("point", p, !0);
	m.state !== "inconsistent" && X(h.score, m.after) || p.push("score");
	let g = i({
		us: d.scoreUs,
		opponent: d.scoreOpponent
	}), _ = !g;
	g && !X(g, m.after) && !p.includes("score") && p.push("score");
	let v = e(u.liveRally);
	v && t(v.actions).length === 0 && !e(v.startSnapshot) && (n(u.servingTeam) && u.servingTeam !== h.serving ? p.push("service") : n(u.servingTeam) || (_ = !0), r(u.rotationNo) && r(u.opponentRotationNo) ? (u.rotationNo !== h.rotationUs || u.opponentRotationNo !== h.rotationOpponent) && p.push("rotation") : _ = !0);
	let y = N(u, m.after);
	y.state === "projected" ? (typeof d.finished == "boolean" && d.finished !== y.setFinished ? p.push("set") : typeof d.finished != "boolean" && (_ = !0), y.setFinished && n(d.winner) && d.winner !== y.setWinner ? p.push("set") : y.setFinished && !n(d.winner) && (_ = !0), y.matchFinished === !0 && u.status !== "finished" && p.push("match")) : _ = !0;
	let b = P(f);
	return (b.lineup === "missing" || b.actionsCaptured === !1) && (_ = !0), Z("point", [...new Set(p)], _);
}
var Be = (n, r) => {
	let i = t(r.rallies), a = e(i.at(-1)), o = R(n);
	return {
		match: n,
		set: r,
		count: i.length,
		lastId: a?.id,
		lastRally: a,
		expectedUndo: o.state === "projected" ? o.after : null
	};
};
function Ve(t, a, o) {
	let s = [], c = e(a.liveRally), l = t.lastRally, u = t.expectedUndo;
	if (!l || !c || !u || l.id === void 0 || c.id !== l.id) return Z("undo", s, !0);
	let d = i({
		us: o.scoreUs,
		opponent: o.scoreOpponent
	}), f = !d;
	d && !X(d, u.score) && s.push("score"), n(a.servingTeam) ? a.servingTeam !== u.serving && s.push("service") : f = !0, r(a.rotationNo) && r(a.opponentRotationNo) ? (a.rotationNo !== u.rotationUs || a.opponentRotationNo !== u.rotationOpponent) && s.push("rotation") : f = !0, Array.isArray(l.actions) && Array.isArray(c.actions) ? l.actions.length !== c.actions.length && s.push("actions") : f = !0, Re(l.lineupBefore) && Re(a.lineup) ? ze(l.lineupBefore, a.lineup) || s.push("lineup") : f = !0;
	let p = Ie.filter((e) => l[e] !== void 0 && l[e] !== null);
	return p.length && p.some((e) => !Object.is(l[e], c[e])) && s.push("video"), Z("undo", [...new Set(s)], f);
}
function He() {
	let t = null, n = !1, r = 0, i = 0, a = 0, o = 0, s = 0, c = 0, l = 0, u = [], d = (e) => (r++, e.operation === "point" ? i++ : a++, e.verdict === "agree" ? o++ : e.verdict === "difference" ? s++ : c++, e.verdict !== "agree" && (u.push(e), u.length > Pe && u.shift()), e);
	return Object.freeze({
		observe(r) {
			if (n) return null;
			let i = e(r), a = i && Le(i);
			if (!i || !a) return t = null, null;
			let o = Be(i, a), s = t;
			return t = o, s ? s.match !== i || s.set !== a ? (l++, null) : o.count === s.count ? null : o.count === s.count + 1 ? d(Q(i, a, o.lastRally)) : o.count === s.count - 1 ? s.lastId === void 0 || e(i.liveRally)?.id !== s.lastId ? (l++, null) : d(Ve(s, i, a)) : (l++, null) : null;
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
function Ue(e) {
	let t = e.document, n = t.getElementById("v11-management");
	if (!n) return null;
	if (e.VC_SHADOW_20515) return e.VC_SHADOW_20515;
	let r = He();
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
// src/domain/rally-transaction-pilot.ts
var We = 40, Ge = (e, t) => e.us === t.us && e.opponent === t.opponent, Ke = (n) => {
	let r = e(n);
	return r && t(r.sets).map(e).find((e) => e && Number(e.number) === Number(r.currentSet) && Number.isInteger(Number(r.currentSet))) || null;
}, $ = (e, t, n = []) => Object.freeze({
	operation: e,
	verdict: t,
	areas: Object.freeze([...n])
}), qe = (a, o, s, c, l, u, d) => {
	let f = e(c), p = Ke(c);
	if (o.state !== "projected" || !o.after || !f || !p || !l || f !== s || p !== l) return $(a, "unverified", ["missing-data"]);
	let m = t(p.rallies).length;
	if (a === "point") {
		if (m !== d + 1) return $(a, "unverified", ["missing-data"]);
		let e = Q(f, p, t(p.rallies).at(-1)), n = [...e.areas], r = i({
			us: p.scoreUs,
			opponent: p.scoreOpponent
		});
		return r && !Ge(r, o.after.score) && !n.includes("score") && n.push("score"), $("point", n.length ? "difference" : e.verdict, n);
	}
	let h = e(f.liveRally);
	if (m !== d - 1 || !u || u.id === void 0 || h?.id !== u.id) return $("undo", "unverified", ["missing-data"]);
	let g = [], _ = i({
		us: p.scoreUs,
		opponent: p.scoreOpponent
	}), v = !_;
	return _ && !Ge(_, o.after.score) && g.push("score"), n(f.servingTeam) ? f.servingTeam !== o.after.serving && g.push("service") : v = !0, r(f.rotationNo) && r(f.opponentRotationNo) ? (f.rotationNo !== o.after.rotationUs || f.opponentRotationNo !== o.after.rotationOpponent) && g.push("rotation") : v = !0, Array.isArray(u.actions) && Array.isArray(h.actions) ? u.actions.length !== h.actions.length && g.push("actions") : v = !0, $("undo", g.length ? "difference" : v ? "unverified" : "agree", g.length ? g : v ? ["missing-data"] : []);
};
function Je(n) {
	let r = Promise.resolve(), i = !1, a = 0, o = 0, s = 0, c = 0, l = 0, u = 0, d = 0, f = 0, p = [], m = (e) => {
		o++, e.verdict === "agree" ? s++ : e.verdict === "difference" ? c++ : e.verdict === "native-rejected" ? u++ : e.verdict === "native-declined" ? d++ : l++, e.verdict !== "agree" && (p.push(e), p.length > We && p.shift());
	}, h = () => {
		try {
			return n.readCurrent();
		} catch {
			return null;
		}
	}, g = async (r, i) => {
		let a = h(), o = Ke(a), s = t(o?.rallies), c = s.length, l = e(s.at(-1)), u = null;
		try {
			u = r === "point" ? ne(a, i) : R(a);
		} catch {}
		let d;
		try {
			d = r === "point" ? await n.awardPoint(i) : await n.undoRally();
		} catch (e) {
			throw m($(r, "native-rejected")), e;
		}
		if (d === !1) return m($(r, "native-declined")), d;
		try {
			m(u ? qe(r, u, a, h(), o, l, c) : $(r, "unverified", ["missing-data"]));
		} catch {
			m($(r, "unverified", ["missing-data"]));
		}
		return d;
	}, _ = (e, t) => {
		if (i) return Promise.reject(/* @__PURE__ */ Error("El piloto ya está desactivado."));
		a++, f++;
		let n = r.then(() => g(e, t));
		return r = n.then(() => void 0, () => void 0), n.finally(() => {
			f--;
		});
	};
	return Object.freeze({
		readonlyVersion: "20.5.16",
		installedInLiveUI: !1,
		awardPoint: (e) => _("point", e),
		undoRally: () => _("undo"),
		report: () => Object.freeze({
			version: "20.5.16",
			mode: "explicit-native-delegation-only",
			installedInLiveUI: !1,
			submitted: a,
			completed: o,
			agree: s,
			difference: c,
			unverified: l,
			nativeRejected: u,
			nativeDeclined: d,
			pending: f,
			recent: Object.freeze([...p])
		}),
		disable() {
			i = !0;
		}
	});
}
// src/vc2055-entry.ts
if (typeof window < "u" && window.document) {
	let e = () => {
		ge(window), E(window), ee(window), ue(window), de(window), we(window), Ne(window), Ue(window);
	};
	window.document.readyState === "loading" ? window.document.addEventListener("DOMContentLoaded", e, { once: !0 }) : e();
}
export { l as attackEfficiency, le as auditCommittedMatch, o as auditMatchScores, C as canonicalReaders, A as classifyPreflight, ce as classifyStoredAction, Q as compareConfirmedPoint, y as compareNativeCode, he as createObservableMatchStore, He as createRallyShadowSession, Je as createRallyTransactionPilot, j as createShadowSession, re as inspectClosedRally, v as inspectCodeShape, Ce as inspectLiveSetStatistics, T as inspectMatchDomain, Me as inspectPlayerBoxscore, P as inspectRallyRestoration, S as inspectSubstitution, ue as mountCommittedPanel, E as mountDomainDiagnostic, de as mountGrammarPanel, we as mountLiveStatisticsPanel, ge as mountObservablePanel, Ne as mountPlayerBoxscore, Ue as mountRallyShadowPanel, ee as mountShadowPanel, s as nextRotation, ne as planAwardPoint, R as planUndoLastRally, V as projectObservableMatch, c as projectPoint, N as projectSetBoundary, w as readCanonicalMatch, u as sideOutBreakPoint, a as verifyRallyScore };
