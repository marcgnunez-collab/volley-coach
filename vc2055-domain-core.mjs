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
function M() {
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
function N(e) {
	let t = e.document, n = t.getElementById("v11-management");
	if (!n) return null;
	if (e.VC_SHADOW_2056) return e.VC_SHADOW_2056;
	let r = M(), i = (e, n = "", r = "") => {
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
var P = () => Object.freeze({
	state: "unknown",
	target: null,
	setFinished: null,
	matchFinished: null,
	setWinner: null
});
function F(r, a) {
	let o = e(r), s = i(a);
	if (!o || !s) return P();
	let c = Number(o.currentSet);
	if (!Number.isInteger(c) || c < 1 || c > 5) return P();
	let l = t(o.sets).map(e).find((e) => e && Number(e.number) === c);
	if (!l) return P();
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
			if (!n(t.winner)) return P();
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
function I(t) {
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
var L = (e, t, a, o) => {
	let s = i(e);
	return s && n(t) && r(a) && r(o) ? Object.freeze({
		score: s,
		serving: t,
		rotationUs: a,
		rotationOpponent: o
	}) : null;
}, R = (e, t, n = null, r = null, i = null, a = null) => Object.freeze({
	kind: e,
	state: t === "ready" ? "projected" : t === "finished" ? "blocked" : "unknown",
	reason: t,
	before: n,
	after: r,
	setBoundary: i,
	restoration: a,
	includesLineups: !1,
	readOnly: !0
}), ee = (n) => t(n.sets).map(e).find((e) => e && Number(e.number) === Number(n.currentSet) && Number.isInteger(Number(n.currentSet))) || null, te = (e, t) => e.us === t.us && e.opponent === t.opponent;
function ne(t, r) {
	let a = e(t);
	if (!a) return R("award-point", "no-match");
	if (a.status === "finished") return R("award-point", "finished");
	let o = ee(a);
	if (!o) return R("award-point", "no-set");
	if (o.finished === !0) return R("award-point", "finished");
	let s = i({
		us: o.scoreUs,
		opponent: o.scoreOpponent
	}), l = e(e(a.liveRally)?.startSnapshot), u = L(s, l ? l.servingBefore : a.servingTeam, l ? l.rotationBefore : a.rotationNo, l ? l.opponentRotationBefore : a.opponentRotationNo);
	if (!u || !n(r)) return R("award-point", "invalid-data");
	if (l) {
		let e = i(l.scoreBefore);
		if (!e || !te(e, u.score) || l.servingBefore !== a.servingTeam || l.rotationBefore !== a.rotationNo || l.opponentRotationBefore !== a.opponentRotationNo) return R("award-point", "stale-score", u);
	}
	let d = c({
		score: u.score,
		serving: u.serving,
		rotationUs: u.rotationUs,
		rotationOpponent: u.rotationOpponent
	}, r), f = L(d.score, d.serving, d.rotationUs, d.rotationOpponent);
	return f ? R("award-point", "ready", u, f, F(a, f.score)) : R("award-point", "invalid-data", u);
}
function re(n) {
	let r = e(n);
	if (!r) return R("undo-last-rally", "no-match");
	if (r.status === "finished") return R("undo-last-rally", "finished");
	let o = ee(r);
	if (!o) return R("undo-last-rally", "no-set");
	let s = t(o.rallies), c = e(s[s.length - 1]);
	if (!c) return R("undo-last-rally", "no-rallies");
	let l = L(i({
		us: o.scoreUs,
		opponent: o.scoreOpponent
	}), r.servingTeam, r.rotationNo, r.opponentRotationNo), u = L(c.scoreBefore, c.servingBefore, c.rotationBefore, c.opponentRotationBefore);
	if (!l || !u || a(c).state !== "verified") return R("undo-last-rally", "invalid-data", l);
	let d = i(c.scoreAfter);
	return !d || !te(d, l.score) ? R("undo-last-rally", "stale-score", l) : R("undo-last-rally", "ready", l, u, null, I(c));
}
function ie(t, o = null) {
	let s = e(t), l = e(o), u = a(s), d = "unknown", f = "unknown", p = i(l?.scoreBefore);
	u.after && p && (d = te(u.after, p) ? "match" : "mismatch");
	let m = L(s?.scoreBefore, s?.servingBefore, s?.rotationBefore, s?.opponentRotationBefore);
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
var z = 2e4, B = 6e4, V = 80, ae = /* @__PURE__ */ new Set([
	"S",
	"R",
	"E",
	"A",
	"B",
	"D",
	"F",
	"C"
]), H = (e) => typeof e == "string" && ae.has(e) ? e : "—", oe = {
	difference: "El código guardado y los campos de la acción no coinciden.",
	"coverage-gap": "El código guardado utiliza sintaxis todavía no cubierta por TypeScript.",
	unverified: "Faltan campos del registro para comprobarlo con seguridad.",
	"no-code": "La acción está registrada sin código original.",
	score: "El ganador no concuerda con el cambio de marcador registrado.",
	"score-sequence": "El tanteo final y el inicial del siguiente rally no coinciden.",
	rotation: "La siguiente rotación o el turno de saque no concuerdan con la proyección básica."
};
function se(t) {
	let r = e(t), i = H(r?.skill);
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
		skill: H(o.skill) || i
	});
	if (!n(r.team) || !ae.has(String(r.skill)) || ![
		"#",
		"+",
		"!",
		"-",
		"/",
		"="
	].includes(String(r.evaluation)) || r.playerNumberSnapshot === null || r.playerNumberSnapshot === void 0 || String(r.playerNumberSnapshot).trim() === "") return Object.freeze({
		kind: "unverified",
		skill: H(o.skill)
	});
	let s = y(a, { action: r });
	return Object.freeze({
		kind: s.state === "agree" ? "agree" : s.state === "disagree" ? "difference" : "unverified",
		skill: H(o.skill)
	});
}
function ce(n) {
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
			skill: H(n),
			reason: oe[e]
		})), a.length > V && a.shift();
	}, c = (e, t) => {
		if (i.actions >= B) return o = !0, !1;
		i.actions++;
		let n = se(e);
		return n.kind === "agree" ? i.agree++ : n.kind === "difference" ? i.difference++ : n.kind === "coverage-gap" ? i.coverageGap++ : n.kind === "no-code" ? i.noCode++ : i.unverified++, n.kind !== "agree" && s(n.kind, t, n.skill), !0;
	}, l = t(r?.sets);
	main: for (let n = 0; n < l.length; n++) {
		let r = e(l[n]);
		if (!r) continue;
		let a = t(r.rallies);
		for (let r = 0; r < a.length; r++) {
			if (i.rallies >= z) {
				o = !0;
				break main;
			}
			let l = e(a[r]);
			if (!l) continue;
			i.rallies++;
			let u = `S${n + 1} · R${r + 1}`, d = e(a[r + 1]), f = ie(l, d);
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
function le(e) {
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
		let e = ce(x());
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
function ue(e) {
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
var de = (e) => typeof e == "number" && Number.isSafeInteger(e) && e >= 0 ? e : null, fe = (e) => typeof e == "number" && Number.isSafeInteger(e) && e > 0 ? e : null, pe = (e, t) => Object.keys(e).every((n) => Object.is(e[n], t[n]));
function me(i, a) {
	let o = e(i), s = fe(o?.currentSet), c = t(o?.sets), l = e(a) || e(c.find((t) => e(t)?.number === s)), u = o?.status === "live" || o?.status === "finished" ? o.status : null;
	return Object.freeze({
		score: Object.freeze({
			set: s,
			us: de(l?.scoreUs),
			opponent: de(l?.scoreOpponent)
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
			return me(t, r);
		} catch {}
		return me(null);
	}, o = a(), s = !1, c = !1, l = !1, u = 0, d = 0, f = 0, p = (e = !1) => {
		if (s) return;
		let t = a(), r = n.filter((e) => !pe(o[e], t[e]));
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
var _e = 3e3, ve = 25e3, ye = (e, t) => t ? Math.round(e / t * 100) : null, be = () => ({
	receptions: 0,
	perfect: 0,
	positive: 0,
	attacks: 0,
	kills: 0,
	errors: 0,
	blocked: 0
}), xe = (t, n) => {
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
}, Se = (e) => Object.freeze({
	attempts: e.receptions,
	perfect: e.perfect,
	positive: e.positive,
	positivePct: ye(e.positive, e.receptions),
	perfectPct: ye(e.perfect, e.receptions)
}), Ce = (e) => Object.freeze({
	attempts: e.attacks,
	kills: e.kills,
	errors: e.errors,
	blocked: e.blocked,
	efficiencyPct: ye(e.kills - e.errors - e.blocked, e.attacks)
}), we = (e, t) => Object.freeze({
	attempts: e,
	successes: t,
	percent: ye(t, e)
});
function Te(r) {
	let i = e(r), a = Number.isSafeInteger(i?.currentSet) && Number(i?.currentSet) > 0 ? Number(i?.currentSet) : null, o = e(t(i?.sets).find((t) => a !== null && e(t)?.number === a)), s = t(o?.rallies), c = be(), l = be(), u = 0, d = 0, f = 0, p = 0, m = 0, h = 0, g = !1;
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
			if (h >= ve) {
				g = !0;
				break;
			}
			h++, xe(c, e);
		}
		if (g) break;
	}
	let _ = t(e(i?.liveRally)?.actions);
	for (let e of _.slice(0, ve)) xe(l, e);
	_.length > ve && (g = !0);
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
		sideOut: we(u, d),
		breakPoint: we(f, p),
		reception: Se(c),
		attack: Ce(c),
		provisional: Object.freeze({
			actions: _.length,
			receptions: l.receptions,
			attacks: l.attacks,
			reception: Se(v),
			attack: Ce(v)
		})
	});
}
// src/state/render-performance.ts
var Ee = [
	"scouting-live",
	"scouting-boxscore",
	"data-engine",
	"rally-search"
], De = /* @__PURE__ */ new WeakMap(), Oe = () => ({
	requests: 0,
	rendered: 0,
	skipped: 0,
	failures: 0,
	lastMs: 0,
	maxMs: 0,
	averageMs: 0
}), ke = (e) => Number.isFinite(e) && e >= 0 ? Math.round(e * 100) / 100 : 0;
function Ae(e) {
	let t = De.get(e);
	if (t) return t;
	let n = new Map(Ee.map((e) => [e, Oe()])), r = Object.freeze({
		VERSION: "20.5.28",
		readOnly: !0,
		observe(e, t, r = 0) {
			let i = n.get(e);
			i && (i.requests++, t === "skip" ? i.skipped++ : t === "error" ? i.failures++ : (i.rendered++, i.lastMs = ke(r), i.averageMs += (i.lastMs - i.averageMs) / i.rendered, i.maxMs = Math.max(i.maxMs, i.lastMs)));
		},
		diagnostics: () => {
			let e = {};
			for (let t of Ee) {
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
	return De.set(e, r), e.VC_RENDER_METRICS_20528 = r, r;
}
function je(e) {
	let t = null, n = -Infinity, r = Oe(), i = e.staleAfterMs ?? 5e3, a = () => {
		let t = e.now();
		return Number.isFinite(t) ? t : Date.now();
	};
	return Object.freeze({
		render(o, s, c = !1) {
			let l = a();
			if (r.requests++, !c && t === o && l - n < i) return r.skipped++, e.report?.("skip", 0), !1;
			try {
				return s(), t = o, n = a(), r.rendered++, r.lastMs = ke(n - l), r.maxMs = Math.max(r.maxMs, r.lastMs), r.averageMs += (r.lastMs - r.averageMs) / r.rendered, e.report?.("render", r.lastMs), !0;
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
function Me(e) {
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
	let f = !1, p = !1, m = null, h = Ae(e), g = je({
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
		let r = n ? n.getLiveStatistics() : Te(w(e));
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
var Ne = 2e4, Pe = 6e4, Fe = 80, Ie = /* @__PURE__ */ new Set([
	"#",
	"+",
	"!",
	"-",
	"/",
	"="
]), Le = () => ({
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
}), Re = (e, t) => t ? Math.round(e / t * 100) : null, ze = (e) => {
	if (typeof e == "number" && Number.isSafeInteger(e) && e > 0) return e;
	if (typeof e == "string" && /^\d{1,15}$/.test(e)) {
		let t = Number(e);
		return Number.isSafeInteger(t) && t > 0 ? t : null;
	}
	return null;
}, Be = (e) => {
	let t = typeof e == "number" && Number.isSafeInteger(e) ? String(e) : typeof e == "string" ? e.trim() : "";
	return /^\d{1,3}$/.test(t) ? t : null;
}, Ve = (e) => typeof e == "string" ? e.trim().slice(0, 50) : "";
function He(e, t) {
	let n = ze(e.playerId), r = Ve(e.opponentPlayerUid), i = Be(e.playerNumberSnapshot), a = Ve(e.playerLabel), o = Be((a.match(/^#?\s*(\d{1,3})(?:\D|$)/) || [])[1]), s = i || (t === "opponent" ? o : null), c = Ve(e.playerNameSnapshot) || a.replace(/^#?\s*\d{1,3}\s*[·-]?\s*/, "") || "", l = t === "ours" && n !== null ? `id:${n}` : t === "opponent" && r ? `uid:${r}` : s === null ? "unidentified" : `num:${s}`;
	return {
		key: l,
		number: s,
		name: l === "unidentified" ? "Sin identificar" : c,
		identified: l !== "unidentified"
	};
}
var Ue = (e, t) => {
	let n = t.skill, r = t.evaluation;
	return !Ie.has(String(r)) || ![
		"S",
		"R",
		"A",
		"B",
		"D",
		"E"
	].includes(String(n)) ? !1 : (e.actions++, n === "S" ? (e.s++, r === "#" && e.aces++, r === "=" && e.sErrors++) : n === "R" ? (e.r++, r === "#" && e.rPerfect++, (r === "#" || r === "+") && e.rPositive++) : n === "A" ? (e.a++, r === "#" && e.kills++, r === "=" && e.aErrors++, r === "/" && e.blocked++) : n === "B" ? (e.b++, r === "#" && e.bPoints++) : n === "D" ? e.d++ : n === "E" && e.e++, !0);
}, We = (e) => Object.freeze({
	attempts: e.a,
	kills: e.kills,
	errors: e.aErrors,
	blocked: e.blocked,
	efficiencyPct: Re(e.kills - e.aErrors - e.blocked, e.a)
}), Ge = (e, t) => Object.freeze({
	attempts: e,
	won: t,
	percent: Re(t, e)
});
function Ke(i, a) {
	let o = e(i), s = a.team === "opponent" ? "opponent" : "ours", c = a.scope === "match" ? "match" : "current", l = r(a.rotation) ? a.rotation : null, u = Object.freeze({
		team: s,
		scope: c,
		rotation: l
	}), d = ze(o?.currentSet), f = t(o?.sets), p = c === "match" ? f : f.filter((t) => d !== null && ze(e(t)?.number) === d), m = !!o && p.some((t) => !!e(t)), h = /* @__PURE__ */ new Map(), g = /* @__PURE__ */ new Map(), _ = Le();
	for (let e of [
		1,
		2,
		3,
		4,
		5,
		6
	]) g.set(e, {
		...Le(),
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
			if (v >= Ne) {
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
				if (y >= Pe) {
					C = !0;
					break main;
				}
				y++;
				let t = e(n);
				if (!t || t.team !== s || (c === null && S++, c !== null && Ue(g.get(c), t), l !== null && c !== l)) continue;
				let r = He(t, s), i = r.key, a = h.get(i);
				!a && h.size >= Fe ? (w = !0, Ue(_, t) && (b++, r.identified || x++)) : (a || (a = {
					...Le(),
					...r
				}, h.set(i, a)), !a.number && r.number && (a.number = r.number), !a.name && r.name && (a.name = r.name), Ue(a, t) && (b++, a.identified || x++));
			}
		}
	}
	let T = [...h.values()].filter((e) => e.actions > 0).sort((e, t) => e.identified === t.identified ? (e.number === null ? Infinity : Number(e.number)) - (t.number === null ? Infinity : Number(t.number)) || e.name.localeCompare(t.name, "es") || e.key.localeCompare(t.key) : e.identified ? -1 : 1).slice(0, Fe).map((e) => Object.freeze({
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
			positivePct: Re(e.rPositive, e.r),
			perfectPct: Re(e.rPerfect, e.r)
		}),
		attack: We(e),
		block: Object.freeze({
			attempts: e.b,
			points: e.bPoints
		}),
		digs: e.d,
		sets: e.e
	})), E = [...g.values()].map((e) => Object.freeze({
		rotation: e.rotation,
		rallies: e.rallies,
		sideOut: Ge(e.so, e.soWon),
		breakPoint: Ge(e.bp, e.bpWon),
		attack: We(e)
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
function qe(e) {
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
	let y = !1, b = !1, x = null, S = Ae(e), C = je({
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
		let i = r ? r.getPlayerBoxscore(n) : Ke(w(e), n);
		return x = i, T() && k(i, t), i;
	}, j = () => A(!0), M = a.subscribe("change", () => {
		y || b || !T() || (b = !0, Promise.resolve().then(() => {
			b = !1, !y && T() && A();
		}));
	}), N = () => A(!0);
	for (let e of [
		d,
		f,
		p
	]) e.addEventListener("change", N);
	let P = typeof MutationObserver == "function" ? new MutationObserver(() => {
		T() && A();
	}) : null;
	P?.observe(r, {
		attributes: !0,
		attributeFilter: ["class"]
	}), P?.observe(i, {
		attributes: !0,
		attributeFilter: ["class"]
	}), T() && A();
	let F = Object.freeze({
		version: "20.5.11",
		readOnly: !0,
		getReport: () => x,
		refresh: j,
		dispose() {
			if (!y) {
				y = !0, P?.disconnect(), M();
				for (let e of [
					d,
					f,
					p
				]) e.removeEventListener("change", N);
				C.invalidate(), n.replaceChildren(), x = null, e.VC_PLAYER_BOXSCORE_20511 === F && delete e.VC_PLAYER_BOXSCORE_20511;
			}
		}
	});
	return e.VC_PLAYER_BOXSCORE_20511 = F, F;
}
// src/state/scouting-projections.ts
var Je = 8;
function Ye(e, t) {
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
			return n ? (c++, n) : (n = Te(w(e)), s++, n);
		},
		getPlayerBoxscore(t) {
			if (u) throw Error("La vista de scouting está cerrada.");
			let n = t.team === "opponent" ? "opponent" : "ours", a = t.scope === "match" ? "match" : "current", o = r(t.rotation) ? t.rotation : null, l = `${n}:${a}:${o ?? 0}`, d = i.get(l);
			if (d) return c++, d;
			let f = Ke(w(e), {
				team: n,
				scope: a,
				rotation: o
			});
			if (s++, i.size >= Je) {
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
function Xe(e) {
	if (e.VC_SCOUT_PROJECTIONS_20522) return e.VC_SCOUT_PROJECTIONS_20522;
	let t = e.VC_STATE_2059;
	if (!t) return null;
	let n = Ye(e, t);
	return e.VC_SCOUT_PROJECTIONS_20522 = n, n;
}
// src/state/analysis-query.ts
var Ze = Object.freeze([
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
]), Qe = (e) => String(e ?? "").trim(), $e = (e) => Array.isArray(e) ? e : [], U = (e) => Qe(e).toLocaleLowerCase("es"), et = (e) => e === "ours" || e === "opponent" ? e : null;
function tt(e) {
	let t = e || {};
	return Object.fromEntries(Ze.map((e) => [e, Qe(t[e]).slice(0, e === "code" ? 100 : 80)]));
}
function nt(e, t = {}) {
	let n = tt(t), r = et(t.team), i = Qe(t.set), a = Qe(t.rotation), o = Qe(t.phase).toUpperCase(), s = U(n.code), c = !!(s || n.skill || n.player || n.evaluation || n.startZone || n.endZone || n.video), l = !!(n.setter || n.attacker || n.tempo || n.combo), u = l || !!n.reception, d = [], f = /* @__PURE__ */ new Map(), p = /* @__PURE__ */ new Map(), m = /* @__PURE__ */ new Map();
	for (let t of $e(e?.chains)) m.has(t.rallyKey) || m.set(t.rallyKey, []), m.get(t.rallyKey).push(t);
	let h = (e) => e && (!r || e.team === r) && (!n.skill || e.skill === n.skill) && (!n.evaluation || e.evaluation === n.evaluation) && (!n.player || U(e.player) === U(n.player)) && (!s || [
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
	].some((e) => U(e).includes(s))) && (!n.startZone || e.fields?.startZone?.code === n.startZone.toUpperCase().replace(/^([^Z])/, "Z$1")) && (!n.endZone || e.fields?.endZone?.code === n.endZone.toUpperCase().replace(/^([^Z])/, "Z$1")) && (!n.video || (n.video === "yes" ? !!e.video : !e.video)), g = (e) => e && (!r || e.team === r) && (!n.setter || U(e.setter?.player) === U(n.setter)) && (!n.attacker || U(e.attack?.player) === U(n.attacker)) && (!n.tempo || U(e.tempo || e.attack?.fields?.attackTempo) === U(n.tempo)) && (!n.combo || U(e.combo) === U(n.combo)) && (!n.reception || e.reception?.evaluation === n.reception);
	for (let t of $e(e?.rallies)) {
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
		let t = Qe(e.skill) || "?", n = Qe(e.player) || "Sin identificar";
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
		matchId: Qe(e?.matchId)
	};
}
// src/state/analysis-query-runtime.ts
var rt = /* @__PURE__ */ new WeakMap(), it = /* @__PURE__ */ new WeakMap();
function at(e) {
	let t = rt.get(e);
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
				return nt(e, t);
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
	return rt.set(e, l), e.VC_ANALYSIS_QUERY_20523 = l, l;
}
function ot(e) {
	let t = it.get(e);
	if (t) return t;
	let n = e.document, r = n.getElementById("v11-management");
	if (!r) return null;
	let i = n.getElementById("vc60-diagnostics"), a = i || r, o = e.VC_ANALYSIS_QUERY_20523 || at(e), s = (e, t = "", r = "") => {
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
	let M = s("h4", "vc20524-subheading", "Vista Rally Search Pro migrada a TypeScript"), N = s("p", "", "La plantilla de filtros, catálogos y secuencias se genera con Vite. Las búsquedas guardadas, los clips de vídeo y el CSV conservan sus controles históricos."), P = s("div", "vc20523-values"), F = /* @__PURE__ */ new Map();
	for (let [e, t] of [
		["renders", "Plantillas TypeScript"],
		["average", "Media"],
		["slow", "Más de 16 ms"],
		["failures", "Errores de plantilla"]
	]) {
		let n = s("div");
		n.append(s("small", "", t));
		let r = s("strong", "", "—");
		n.append(r), P.append(n), F.set(e, r);
	}
	let I = s("h4", "vc20524-subheading", "Controles Rally Search Pro migrados a TypeScript"), L = s("p", "", "Controladores de filtros, presets y exportación; solo recuentos locales. Las búsquedas guardadas siguen en la misma clave del navegador."), R = s("div", "vc20523-values"), ee = /* @__PURE__ */ new Map();
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
		n.append(r), R.append(n), ee.set(e, r);
	}
	let te = s("button", "vc20523-refresh", "Actualizar medición");
	te.type = "button";
	let ne = s("p", "vc20523-note", "El umbral de 16 ms es orientativo. La memoria del índice es una estimación mínima de referencias, NO memoria real atribuible al módulo. El heap JS, cuando exista, corresponde al navegador completo. No se guardan códigos, nombres ni partidos en este diagnóstico.");
	c.append(l, d, s("h4", "vc20524-subheading", "Búsqueda táctica"), f, m, h, _, v, b, x, C, w, T, O, k, A, M, N, P, I, L, R, te, ne);
	let re = n.getElementById(i ? "vc60-stat-grid" : "vc2059-observable");
	re?.parentNode === a ? re.insertAdjacentElement("afterend", c) : a.append(c);
	let ie = !1, z = (e) => `${e.toFixed(2)} ms`, B = () => {
		if (ie) return;
		let t = o.diagnostics(), n = {
			queries: String(t.queries),
			last: z(t.lastMs),
			average: z(t.averageMs),
			max: z(t.maxMs),
			slow: String(t.slowQueries),
			failures: String(t.failures)
		};
		for (let [e, t] of Object.entries(n)) {
			let n = p.get(e);
			n && n.textContent !== t && (n.textContent = t);
		}
		let r = e.VC_ANALYSIS_NORMALIZE_20524?.diagnostics?.(), i = {
			normalizations: String(r?.normalizations ?? 0),
			last: z(r?.lastMs ?? 0),
			average: z(r?.averageMs ?? 0),
			max: z(r?.maxMs ?? 0),
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
			average: z(a?.averageMs ?? 0),
			slow: String(a?.slowOperations ?? 0),
			failures: String(a?.failures ?? 0)
		};
		for (let [e, t] of Object.entries(s)) {
			let n = y.get(e);
			n && n.textContent !== t && (n.textContent = t);
		}
		let c = e.VC_ANALYSIS_CSV_20526?.diagnostics?.(), l = e.VC_ANALYSIS_CSV_20526?.indexDiagnostics?.(), u = e.performance?.memory?.usedJSHeapSize, d = typeof u == "number" && Number.isFinite(u) && u >= 0 ? `${(u / 1048576).toFixed(1)} MiB` : "No disponible", f = {
			exports: String(c?.exports ?? 0),
			last: z(c?.lastMs ?? 0),
			average: z(c?.averageMs ?? 0),
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
			let t = m?.areas[e], n = t ? `${t.rendered} dibujadas · ${t.skipped} evitadas · media ${z(t.averageMs)} · ${t.failures} errores` : "Sin mediciones todavía", r = D.get(e);
			r && r.textContent !== n && (r.textContent = n);
		}
		let h = e.VC_ANALYSIS_VIEW_20529?.diagnostics?.(), _ = {
			renders: String(h?.renders ?? 0),
			average: z(h?.averageMs ?? 0),
			slow: String(h?.slowRenders ?? 0),
			failures: String(h?.failures ?? 0)
		};
		for (let [e, t] of Object.entries(_)) {
			let n = j.get(e);
			n && n.textContent !== t && (n.textContent = t);
		}
		let v = e.VC_RALLY_VIEW_20530?.diagnostics?.(), b = {
			renders: String(v?.renders ?? 0),
			average: z(v?.averageMs ?? 0),
			slow: String(v?.slowRenders ?? 0),
			failures: String(v?.failures ?? 0)
		};
		for (let [e, t] of Object.entries(b)) {
			let n = F.get(e);
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
			let t = String(x?.[e] ?? 0), n = ee.get(e);
			n && n.textContent !== t && (n.textContent = t);
		}
	};
	te.addEventListener("click", B), B();
	let V = Object.freeze({
		readOnly: !0,
		refresh: B,
		dispose() {
			ie || (ie = !0, te.removeEventListener("click", B), c.remove(), it.delete(e));
		}
	});
	return it.set(e, V), V;
}
// src/state/analysis-normalizer.ts
var st = /* @__PURE__ */ new Set([
	"S",
	"R",
	"E",
	"A",
	"B",
	"D",
	"F",
	"C"
]), ct = /* @__PURE__ */ new Set([
	"#",
	"+",
	"!",
	"-",
	"/",
	"="
]), W = (e) => String(e ?? "").trim(), lt = (e) => e != null && W(e) !== "", ut = (e) => encodeURIComponent(W(e));
function dt(e) {
	let t = W(e).toUpperCase().match(/^Z?([1-9])([ABCD])?$/);
	return t ? {
		zone: Number(t[1]),
		quadrant: t[2] || null,
		code: "Z" + t[1] + (t[2] || "")
	} : null;
}
var ft = (e) => W(e.playerNameSnapshot || e.playerLabel || e.playerNumberSnapshot || e.playerId || e.playerNumber);
function pt(r) {
	let i = [], a = [], o = [], s = [], c = [], l = e(r), u = W(l?.id), d = /* @__PURE__ */ new Set();
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
			let l = e(f) || {}, p = lt(l.id) ? W(l.id) : null;
			p && h.has(p) && i.push({
				type: "duplicate-rally",
				set: m,
				index: d + 1,
				message: "Identificador de rally repetido"
			}), p && h.add(p);
			let g = [
				ut(u),
				m,
				p ? "id:" + ut(p) : "pos:" + d
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
				let t = e(s) || {}, c = n(t.team) ? t.team : null, l = W(t.skill).toUpperCase(), f = W(t.evaluation), p = lt(t.id) ? W(t.id) : null;
				p && S.has(p) && i.push({
					type: "duplicate-action",
					key: g,
					index: a,
					message: "Acción duplicada dentro del rally"
				}), p && S.add(p);
				let h = {
					startZone: dt(t.startZone),
					endZone: dt(t.endZone),
					contactZone: dt(t.contactZone),
					setTarget: dt(t.setTarget),
					tempo: W(t.setTempo),
					attackTempo: W(t.attackTempo),
					combo: W(t.attackCombo),
					setterCall: W(t.setterCall),
					direction: W(t.attackDirection),
					blockers: lt(t.blockers) ? W(t.blockers) : "",
					serveType: W(t.serveType),
					subtype: W(t.skillSubtype),
					receivedServeType: W(t.receivedServeType),
					dvSetType: W(t.dvSetType),
					attackCode: W(t.attackCode),
					endCone: W(t.endCone),
					specialCode: W(t.specialCode),
					blockTargetNumber: W(t.blockTargetNumber),
					startCoordinate: lt(t.startCoordinate) ? t.startCoordinate : null,
					endCoordinate: lt(t.endCoordinate) ? t.endCoordinate : null,
					contactCoordinate: lt(t.contactCoordinate) ? t.contactCoordinate : null
				}, _ = [
					"videoTime",
					"videoTimestamp",
					"liveVideoTime",
					"videoAction"
				].some((e) => lt(t[e]) && Number.isFinite(Number(t[e])) && Number(t[e]) >= 0), v = {
					key: g + "|" + (p ? "id:" + ut(p) : "pos:" + a),
					rallyKey: g,
					matchId: u,
					set: m,
					rallyIndex: d + 1,
					actionIndex: a,
					nativeId: p,
					team: c,
					code: W(t.code),
					skill: st.has(l) ? l : null,
					skillRaw: l,
					evaluation: ct.has(f) ? f : null,
					evaluationRaw: f,
					player: ft(t) || null,
					fields: h,
					video: _,
					scoutMs: Number.isFinite(Number(t.scoutMs)) && lt(t.scoutMs) ? Number(t.scoutMs) : null,
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
				]) lt(t[e]) && !h[e] && i.push({
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
var mt = /* @__PURE__ */ new WeakMap();
function ht(e) {
	let t = mt.get(e);
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
				return pt(e);
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
	return mt.set(e, l), e.VC_ANALYSIS_NORMALIZE_20524 = l, l;
}
// src/state/analysis-index.ts
var gt = /* @__PURE__ */ new WeakMap(), _t = 0, vt = 0, yt = 0, bt = 0, xt = 0, St = 0, Ct = 0, wt = 0, Tt = 0, Et = 4e4;
function Dt(e) {
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
	return Ct = _, wt = Math.max(wt, _), _t++, n || bt++, {
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
function Ot(e) {
	let t = gt.get(e);
	if (t && t.contactsRef === e.contacts && t.ralliesRef === e.rallies && t.possessionsRef === e.possessions && t.chainsRef === e.chains && t.lengths[0] === e.rallies.length && t.lengths[1] === e.contacts.length && t.lengths[2] === e.possessions.length && t.lengths[3] === e.chains.length) return vt++, t;
	t && (yt++, gt.delete(e));
	let n = Dt(e);
	return gt.set(e, n), n;
}
function kt(e, t) {
	let n = [];
	for (let r of e) {
		let e = t.get(r.key);
		if (e) for (let t of e) n.push(t);
	}
	return n;
}
function At(e, t) {
	if (e.rallies.length < 40 || t.length * 2 > e.rallies.length) return null;
	if (e.contacts.length > 4e4) return Tt++, null;
	let n = Ot(e);
	return n.canonical ? {
		contacts: kt(t, n.contacts),
		possessions: kt(t, n.possessions),
		chains: kt(t, n.chains)
	} : null;
}
function jt(e, t, n) {
	if (e.contacts.length < 80 || e.contacts.length > 4e4) return e.contacts.length > 4e4 && Tt++, null;
	if (!t.team && !t.skill && !t.evaluation && !t.player && !t.startZone && !t.endZone && !t.video) return null;
	let r = Ot(e);
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
	return a && (xt++, St += n - a.length), a;
}
function Mt(e) {
	gt.delete(e) && yt++;
}
function Nt() {
	return Object.freeze({
		readOnly: !0,
		builds: _t,
		hits: vt,
		invalidations: yt,
		unsupported: bt,
		dimensionUses: xt,
		avoidedContactScans: St,
		lastEstimatedReferenceBytes: Ct,
		peakEstimatedReferenceBytes: wt,
		maxIndexedContacts: Et,
		skippedMemoryLimit: Tt
	});
}
// src/state/analysis-operations.ts
var Pt = (e) => String(e ?? "").trim(), Ft = (e) => e != null && Pt(e) !== "", It = (e) => e === "ours" || e === "opponent" ? e : null, Lt = (e) => Array.isArray(e) ? e : [], Rt = (e, t) => t ? Math.round(1e3 * e / t) / 10 : null;
function zt(e, t = {}) {
	let n = It(t.team), r = Ft(t.set) ? Number(t.set) : null, i = Ft(t.rotation) ? Number(t.rotation) : null, a = Pt(t.phase).toUpperCase(), o = Pt(t.skill).toUpperCase(), s = Pt(t.evaluation), c = Pt(t.player).toLocaleLowerCase("es"), l = dt(t.startZone), u = dt(t.endZone), d = Pt(t.setter).toLocaleLowerCase("es"), f = e.rallies.filter((e) => e.closed && (!r || e.set === r) && (!i || (n ? (n === "ours" ? e.ownRotation : e.rivalRotation) === i : !1)) && (!a || !!e.serving && (n ? a === "K1" ? e.serving !== n : a === "K2" && e.serving === n : !1))), p = At(e, f), m = new Set(f.map((e) => e.key)), h = !!(o || s || c || l || u || t.video === !0), g = (jt(e, {
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
		indexDiagnostics: Nt
	});
	return Yt.set(e, l), e.VC_ANALYSIS_CSV_20526 = l, l;
}
// src/state/analysis-view.ts
var Zt = (e) => String(e ?? "").trim(), G = (e) => Zt(e).replace(/[&<>"']/g, (e) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
})[e]);
function Qt(e) {
	let { data: t, selection: n, coverage: r, attack: i, comparison: a } = e, o = r.bySkill.map((e) => `<tr><td><b>${G(e.skill)}</b></td><td>${e.n}</td><td>${e.properties.team}/${e.n}</td><td>${e.properties.player}/${e.n}</td><td>${e.properties.evaluation}/${e.n}</td><td>${e.properties.zone}/${e.n}</td><td>${e.properties.video}/${e.n}</td></tr>`).join(""), s = n.chains.slice(-45).reverse().map((e) => `<tr><td>${G(e.setter.set)} · ${G(e.setter.rallyIndex)}</td><td>${G(e.setter.player || "—")}</td><td>${G(e.reception?.evaluation || "—")}</td><td>${G(e.target?.code || "—")}</td><td>${G(e.tempo || "—")}</td><td>${G(e.attack?.player || "Sin ataque")}</td><td>${G(e.attack?.evaluation || "—")}</td></tr>`).join("");
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
		].map((e) => `<option>${G(e)}</option>`).join("")}</select></label><button type="button" data-vc1938-export>Exportar selección CSV</button></div><div class="vc1938-metrics"><span><strong>${n.rallies.length}</strong>rallies filtrados</span><span><strong>${n.contacts.length}</strong>contactos filtrados</span><span><strong>${n.possessions.length}</strong>posesiones</span><span><strong>${n.chains.length}</strong>colocaciones</span></div><div class="vc1938-scroll"><table><thead><tr><th>Fund.</th><th>Total</th><th>Equipo</th><th>Jugador</th><th>Eval.</th><th>Zona</th><th>Vídeo</th></tr></thead><tbody>${o}</tbody></table></div><small>Los denominadores de cobertura son los contactos de cada fundamento en todo el scouting, antes de filtros.</small></div>`,
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
var tn = (e) => String(e ?? "").trim(), K = (e) => tn(e).replace(/[&<>"']/g, (e) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
})[e]), nn = (e, t = e) => `<option value="${K(e)}">${K(t)}</option>`, rn = {
	S: "Saque",
	R: "Recepción",
	E: "Colocación",
	A: "Ataque",
	B: "Bloqueo",
	D: "Defensa",
	F: "Freeball",
	C: "Control"
}, an = {
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
function on(e) {
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
var q = (e, t, n) => `<label>${K(e)}<select data-vc1939-filter="${t}">${n.map(([e, t]) => nn(e, t)).join("")}</select></label>`;
function sn(e, t, n = {}) {
	let r = on(e), i = (e) => [["", "Todos"], ...e.map((e) => [e, e])], a = `<div class="vc1939-search" aria-label="Buscar rallies con filtros cruzados"><div class="vc1939-intro"><strong>RALLY SEARCH PRO</strong><small>Todos los criterios se combinan · un contacto no hereda la valoración de otro</small></div>
  <div class="vc1939-grid vc1939-basic"><label>Código / texto<input data-vc1939-filter="code" maxlength="100" placeholder="Ej.: A4#, Z4 o código de scouting"></label>
  ${q("Fundamento", "skill", an.skill)}${q("Jugador", "player", i(r.players))}${q("Valoración", "evaluation", an.evaluation)}</div>
  <details class="vc1939-advanced"><summary>Más criterios · rotaciones, colocador y secuencias</summary><div class="vc1939-grid">
  ${q("Rotación propia", "ownRotation", an.ownRotation)}${q("Rotación rival", "rivalRotation", an.rivalRotation)}
  ${q("Recepción anterior", "reception", an.reception)}${q("Colocador", "setter", i(r.setters))}
  ${q("Atacante tras colocación", "attacker", i(r.attackers))}${q("Tempo", "tempo", i(r.tempos))}
  ${q("Combinación", "combo", i(r.combos))}${q("Origen", "startZone", i(r.startZones))}
  ${q("Destino", "endZone", i(r.endZones))}${q("Ganador del rally", "outcome", an.outcome)}
  ${q("Marca temporal", "video", an.video)}${q("Estado del rally", "status", an.status)}</div></details>
  <div class="vc1939-actions"><button type="button" data-vc1939-clear>Limpiar búsqueda</button><button type="button" data-vc1939-export>Exportar CSV</button></div>
  <div class="vc1939-presets"><select data-vc1939-preset aria-label="Búsquedas guardadas"><option value="">Búsquedas guardadas</option></select><button type="button" data-vc1939-save>Guardar</button><button type="button" data-vc1939-load>Aplicar</button><button type="button" data-vc1939-delete>Eliminar</button></div>
  <p class="vc1939-context-note">Se aplican también los filtros superiores de scouting, equipo, set, rotación y K1/K2. Para búsquedas por secuencia, colocador, recepción y ataque deben pertenecer a una misma posesión.</p></div>`, o = t.statistics, s = `<div class="vc1939-metrics"><div><strong>${o.rallies}</strong><span>Rallies</span></div><div><strong>${o.contacts}</strong><span>Contactos</span></div><div><strong>${o.chains}</strong><span>Colocaciones</span></div><div><strong>${o.videoContacts}</strong><span>Marcas vídeo</span></div></div>`, c = o.bySkill.map(([e, t]) => `<tr><td>${K(rn[e] || e)}</td><td>${t}</td><td>${o.contacts ? Math.round(t / o.contacts * 1e3) / 10 : 0} %</td></tr>`).join(""), l = o.byPlayer.slice(0, 10).map(([e, t]) => `<tr><td>${K(e)}</td><td>${t}</td></tr>`).join(""), u = `<div class="vc1939-left"><h3>Buscador de rallies</h3>${a}${s}<div class="vc1939-scroll"><table><thead><tr><th>Fundamento</th><th>Contactos</th><th>Uso</th></tr></thead><tbody>${c || "<tr><td colspan=\"3\">Sin acciones con esta selección.</td></tr>"}</tbody></table></div></div>`, d = t.chains.slice(0, 50).map((e) => `<tr><td>S${e.setter?.set} · R${e.setter?.rallyIndex}</td><td>${K(e.reception?.evaluation || "—")}</td><td>${K(e.setter?.player || "—")}</td><td>${K(e.tempo || "—")}</td><td>${K(e.attack?.player || "—")}</td><td>${K(e.attack?.evaluation || "—")}</td></tr>`).join("");
	return {
		left: u,
		center: `<div class="vc1939-center-body"><h3>Resultados y secuencias</h3><p class="vc1939-summary">Ataques valorados: ${o.attackRated} · Eficiencia: ${o.efficiency == null ? "Sin muestra" : o.efficiency.toLocaleString("es-ES") + " %"} · Sin valoración: ${o.missingEvaluation} contactos.</p><div class="vc1939-scroll"><table><thead><tr><th>Jugador</th><th>Acciones</th></tr></thead><tbody>${l || "<tr><td colspan=\"2\">Sin jugadores codificados.</td></tr>"}</tbody></table></div><h4>Recepción → Colocación → Ataque</h4><div class="vc1939-scroll"><table><thead><tr><th>Set/rally</th><th>Recep.</th><th>Colocador</th><th>Tempo</th><th>Atacante</th><th>Eval. A</th></tr></thead><tbody>${d || "<tr><td colspan=\"6\">No hay secuencias completas con estos filtros.</td></tr>"}</tbody></table></div></div>`
	};
}
// src/state/rally-search-view-runtime.ts
var cn = /* @__PURE__ */ new WeakMap();
function ln(e) {
	let t = cn.get(e);
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
				return sn(e, t, l);
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
	return cn.set(e, l), e.VC_RALLY_VIEW_20530 = l, l;
}
// src/state/rally-search-controls.ts
var un = "vc1939:search-presets:1", dn = (e) => String(e ?? "").trim();
function fn(e) {
	try {
		let t = JSON.parse(e?.getItem("vc1939:search-presets:1") || "[]");
		return Array.isArray(t) ? t.filter((e) => e && typeof e.name == "string" && e.name.length <= 40 && e.filters && typeof e.filters == "object").slice(-15).map((e) => ({
			name: e.name,
			filters: tt(e.filters)
		})) : [];
	} catch {
		return [];
	}
}
var pn = /* @__PURE__ */ new WeakMap();
function mn(e) {
	let t = pn.get(e);
	if (t) return t;
	let n = e, r = /* @__PURE__ */ new WeakSet(), i = 0, a = 0, o = 0, s = 0, c = 0, l = 0, u = 0, d = Object.freeze({
		VERSION: "20.5.31",
		nativeReadOnly: !0,
		readPresets: fn,
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
							if (!dn(t)) return;
							try {
								let n = e.localStorage, r = dn(t).slice(0, 40), i = fn(n).filter((e) => e.name !== r);
								i.push({
									name: r,
									filters: tt(f.filters)
								}), n?.setItem(un, JSON.stringify(i.slice(-15))), f.preset = r, s++, d.refresh();
							} catch {
								u++;
							}
						} else if (i.hasAttribute("data-vc1939-load")) {
							let t = fn(e.localStorage).find((e) => e.name === f.preset);
							t && (f.filters = { ...t.filters }, c++, d.refresh());
						} else if (i.hasAttribute("data-vc1939-delete")) try {
							e.localStorage?.setItem(un, JSON.stringify(fn(e.localStorage).filter((e) => e.name !== f.preset))), f.preset = "", l++, d.refresh();
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
	return pn.set(e, d), e.VC_RALLY_CONTROLS_20531 = d, d;
}
// src/state/scouting-speed-draft.ts
var hn = [
	"S",
	"R",
	"E",
	"A",
	"B",
	"D",
	"F",
	"C"
], gn = [
	"#",
	"+",
	"!",
	"-",
	"/",
	"="
], _n = /^(R?)(\d{1,3})([SREABDFC])?([#+!\-/=])?(.*)$/, vn = /^[.:~^@|*%&?$]/, yn = (e) => String(e ?? ""), bn = (e) => yn(e).trim().toUpperCase().replace(/\s+/g, "");
function xn(e) {
	let t = bn(e), n = t.match(_n);
	return !n || n[5] && !vn.test(n[5]) ? null : {
		code: t,
		side: n[1],
		number: n[2],
		skill: n[3],
		rating: n[4],
		tail: n[5]
	};
}
function Sn(e) {
	let t = yn(e?.number || "").trim();
	return !/^\d{1,3}$/.test(t) || e?.team !== "ours" && e?.team !== "opponent" ? null : (e.team === "opponent" ? "R" : "") + t;
}
function Cn(e, t, n) {
	if (!hn.some((e) => e === t)) return null;
	let r = bn(e);
	if (!r) {
		let e = Sn(n);
		return e ? e + t : null;
	}
	let i = xn(r);
	return i ? i.side + i.number + t + (i.rating || "") + i.tail : null;
}
function wn(e, t) {
	if (!gn.some((e) => e === t)) return null;
	let n = xn(e);
	return !n || !n.skill ? null : n.side + n.number + n.skill + t + n.tail;
}
function Tn(e, t = 1) {
	let n = xn(e);
	if (!n || !n.skill) return null;
	let r = gn[(gn.findIndex((e) => e === n.rating) + (t > 0 ? 1 : gn.length - 1) + gn.length) % gn.length];
	return wn(e, r);
}
function En(e, t = 8) {
	if (!e) return [];
	let n = [], r = (e) => {
		for (let r = (Array.isArray(e) ? e.length : 0) - 1; r >= 0 && n.length < t; r--) {
			let t = bn(e?.[r]?.code);
			t.length <= 140 && xn(t)?.skill && !n.includes(t) && n.push(t);
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
var Dn = 512, On = 32, kn = /* @__PURE__ */ new Set([
	"S",
	"A",
	"B"
]);
function An(e, t) {
	return kn.has(e) && t === "#" || (e === "S" || e === "A") && t === "=";
}
function jn(e, t, n, r) {
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
function Mn(e) {
	let t = String(e ?? "").trim().toUpperCase();
	if (!t) return jn("empty", [], [], "Escribe una secuencia para comprobar su estructura.");
	if (t.length > 512) return jn("invalid", [], [{
		position: 0,
		severity: "error",
		reason: "Secuencia demasiado larga (máximo 512 caracteres)."
	}], "Reduce la secuencia; no se ha registrado ninguna acción.");
	let n = t.split(/\s+/);
	if (n.length > 32) return jn("invalid", [], [{
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
		let n = e + 1, i = t[0], c = i === "." || i === "R" ? "opponent" : "ours", l = i === "*" ? t.slice(1) : i === "." ? "R" + t.slice(1) : t, u = xn(l);
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
		r.push(m), d.state !== "candidate" && a(n, `Código ${n}: el sufijo necesita confirmación en el editor original.`), f || a(n, `Código ${n}: falta valoración explícita.`), s && (An(s.skill, s.rating) && a(n, `Código ${n}: hay un contacto después de una valoración que parece cerrar el punto.`), s.team === m.team && s.number === m.number && s.skill !== "B" && a(n, `Código ${n}: posible doble contacto del mismo dorsal; revisa la jugada.`), s.skill === "S" && m.skill === "R" && s.team === m.team && a(n, `Código ${n}: el saque y la recepción se atribuyen al mismo equipo.`)), s = m;
	}
	let c = i.some((e) => e.severity === "error") ? "invalid" : i.length ? "review" : "ready";
	return jn(c, r, i, c === "ready" ? "Estructura reconocida. Sin comprobar alineaciones, legalidad ni aceptación del registrador." : c === "review" ? "Hay avisos orientativos. Revisa los códigos antes de registrar el rally." : "Hay errores de sintaxis. Corrige la secuencia; no se ha registrado ninguna acción.");
}
// src/state/scouting-speed-draft-runtime.ts
var Nn = /* @__PURE__ */ new WeakMap();
function Pn(e) {
	let t = Nn.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.32",
		inputOnly: !0,
		parseHead: xn,
		applySkill: Cn,
		applyRating: wn,
		cycleRating: Tn,
		recentCodes: En,
		inspectSequence: Mn
	});
	return Nn.set(e, n), e.VC_SCOUT_DRAFT_20532 ||= n, n;
}
// src/state/scouting-preflight.ts
var Fn = {
	S: "Saque",
	R: "Recepción",
	E: "Colocación",
	A: "Ataque",
	B: "Bloqueo",
	D: "Defensa",
	F: "Freeball",
	C: "Cobertura"
}, In = /* @__PURE__ */ new Set([
	"#",
	"+",
	"!",
	"-",
	"/",
	"="
]), Ln = /^(R?)(\d{1,3})([SREABDFC])?([#+!\-/=])?(.*)$/, Rn = (e) => String(e ?? "").trim().toUpperCase().replace(/\s+/g, ""), zn = (e) => String(e ?? "").slice(0, 180);
function Bn(e, t, n, r, i, a = !1) {
	let o = Rn(e);
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
	let s = o.match(Ln);
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
	let c = s[1] ? "Rival" : "Nuestro", l = Fn[s[3]], u = s[4], d = `${c} · #${s[2]} · ${l}${u ? " · " + u : ""}`;
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
		message: zn(f?.error || "Código no reconocido por el motor de scouting."),
		code: o,
		summary: d
	};
	let p = f.action, m = [];
	p.startZone && m.push(`origen ${p.startZone}`), p.endZone && m.push(`destino ${p.endZone}`), p.tempo && m.push(`tempo ${p.tempo}`);
	let h = In.has(String(p.evaluation)) ? p.evaluation : u || "—";
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
var Vn = /* @__PURE__ */ new WeakMap();
function Hn(e) {
	let t = Vn.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.34",
		previewOnly: !0,
		classify: Bn
	});
	return Vn.set(e, n), e.VC_SCOUT_PREFLIGHT_20534 ||= n, n;
}
// src/domain/scout-registration-guard.ts
function Un(e) {
	return e.hasCode ? !e.hasMatch || e.matchFinished ? "No hay un scouting activo." : !e.hasSet || e.setFinished ? "El set está cerrado." : null : "Código vacío.";
}
// src/domain/scout-registration-guard-runtime.ts
var Wn = /* @__PURE__ */ new WeakMap();
function Gn(e) {
	let t = Wn.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.35",
		preconditionsOnly: !0,
		inspect: Un
	});
	return Wn.set(e, n), e.VC_SCOUT_REG_GUARD_20535 ||= n, n;
}
// src/domain/scout-action-preparation.ts
var Kn = () => ({
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
}), qn = (e) => e && typeof e == "object" ? e : null;
function Jn(e) {
	try {
		let t = qn(e), n = qn(t?.action);
		if (!n) return Object.freeze({
			...Kn(),
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
		return Object.freeze(Kn());
	}
}
function Yn(e, t, n) {
	let r = n(e, t, null);
	return Object.freeze({
		mode: "native-once",
		nativeResult: r,
		facts: Jn(r)
	});
}
// src/domain/scout-action-preparation-runtime.ts
var Xn = /* @__PURE__ */ new WeakMap();
function Zn(e) {
	let t = Xn.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.36",
		nativeOnly: !0,
		prepare: Yn,
		inspect: Jn
	});
	return Xn.set(e, n), e.VC_SCOUT_PREPARE_20536 ||= n, n;
}
// src/domain/scout-code-lexer.ts
var Qn = /^(R)?(\d+)(S|R|E|A|B|D|F|C)([#\+!\-\/=])?(?:\.([1-9])(?:>([1-9]))?)?(.*)$/, $n = /~(JF|JP|F|U)/, er = /:(Z4|Z2|Z1|Z6|1T|31|BACK|PIPE|2T|OTR)/, tr = /\^(K1|K2|FB|TR)/, nr = /@([0-3])/;
function rr(e) {
	let t = String(e || "").trim().toUpperCase().replace(/\s+/g, "").match(Qn);
	if (!t) return {
		kind: "error",
		error: "Código no reconocido."
	};
	let n = t[7] || "", r = n.match($n)?.[1] || "";
	n = n.replace($n, "");
	let i = n.match(er)?.[1] || "";
	n = n.replace(er, "");
	let a = n.match(tr)?.[1] || "";
	n = n.replace(tr, "");
	let o = n.match(nr)?.[1] || "";
	return n = n.replace(nr, ""), n ? {
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
var ir = /* @__PURE__ */ new WeakMap();
function ar(e) {
	let t = ir.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.37",
		syntaxOnly: !0,
		lex: rr
	});
	return ir.set(e, n), e.VC_SCOUT_LEXER_20537 ||= n, n;
}
// src/domain/scout-grammar-extensions.ts
var or = (e) => String(e || "").trim().toUpperCase().replace(/\s+/g, ""), sr = /^((?:R)?\d+(?:S|R|E|A|B|D|F|C)(?:[#\+!\-\/=])?)\.([1-9])([A-D]?)(?:>([1-9])([A-D]?))?(.*)$/, cr = /^((?:R)?\d+A[#\+!\-\/=]?)\.([1-9][A-D]?)>C([1-8])(.*)$/, lr = [
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
function ur(e) {
	let t = or(e).match(sr);
	if (!t || !t[3] && !t[5]) return { kind: "pass" };
	let n = t[1], r = t[2], i = t[3] || "", a = t[4] || "", o = t[5] || "", s = t[6] || "";
	return {
		kind: "subzone",
		cleaned: n + "." + r + (a ? ">" + a : "") + s,
		startZone: r + i,
		endZone: a ? a + o : ""
	};
}
function dr(e) {
	let t = or(e).match(cr);
	return t ? {
		kind: "cone",
		cleaned: t[1] + t[4],
		startZone: t[2],
		endCone: Number(t[3])
	} : { kind: "pass" };
}
function fr(e) {
	let t = or(e), n = t.match(/^(?:R)?\d+(S|R|E|A|B|D|F|C)/)?.[1] || "", r = t, i = r.match(/::([A-Z0-9]{1,6})/)?.[1] || "";
	if (r = r.replace(/::[A-Z0-9]{1,6}/, ""), !i && (n === "A" || n === "E")) {
		let e = r.match(/:([A-Z0-9]{1,6})/)?.[1] || "";
		e && !lr.includes(e) && (i = e, r = r.replace(":" + e, ""));
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
var pr = /* @__PURE__ */ new WeakMap();
function mr(e) {
	let t = pr.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.38",
		grammarOnly: !0,
		subzone: ur,
		advanced: fr,
		cone: dr
	});
	return pr.set(e, n), e.VC_SCOUT_EXTENSIONS_20538 ||= n, n;
}
// src/domain/scout-player-resolution.ts
function hr(e, t, n) {
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
var gr = /* @__PURE__ */ new WeakMap();
function _r(e) {
	let t = gr.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.40",
		pureOnly: !0,
		resolveOwn: hr
	});
	return gr.set(e, n), e.VC_SCOUT_PLAYER_RESOLVER_20540 ||= n, n;
}
// src/domain/scout-action-builder.ts
function vr(e, t) {
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
function yr(e, t, n) {
	let r = e;
	return {
		playerId: r.id,
		playerLabel: "",
		playerNameSnapshot: r.name || t || "",
		playerNumberSnapshot: r.number ?? n
	};
}
function br(e, t, n) {
	return {
		playerId: null,
		playerLabel: e,
		playerNumberSnapshot: n,
		playerNameSnapshot: t || String(e || "").replace(/^#?\d+\s*[·-]?\s*/, "")
	};
}
// src/domain/scout-action-builder-runtime.ts
var xr = /* @__PURE__ */ new WeakMap();
function Sr(e) {
	let t = xr.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.41",
		pureOnly: !0,
		buildBase: vr,
		ownFields: yr,
		opponentFields: br
	});
	return xr.set(e, n), e.VC_SCOUT_ACTION_BUILDER_20541 ||= n, n;
}
// src/domain/scout-code-format.ts
function Cr(e, t) {
	let n = e || {}, r = t || {}, i = r.skill === "R" || r.skill === "D", a = String(n.contactZone || i && (r.endZone || r.startZone) || ""), o = String(n.sourceZone || (i && r.startZone && r.endZone ? r.startZone : "") || ""), s = i && !!a && !r.endZone && !r.startZone;
	return {
		contactZone: a,
		sourceZone: o,
		zoneInferred: !!n.zoneInferred,
		sourceActionId: n.sourceActionId == null ? null : Number(n.sourceActionId),
		migratedEndZone: s ? a : null
	};
}
function wr(e, t) {
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
var Tr = /* @__PURE__ */ new WeakMap();
function Er(e) {
	let t = Tr.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.42",
		pureOnly: !0,
		contact: Cr,
		buildCode: wr
	});
	return Tr.set(e, n), e.VC_SCOUT_CODE_FORMAT_20542 ||= n, n;
}
// src/domain/scout-code-builder.ts
var Dr = {
	Q: "Quick",
	U: "Super",
	T: "Fast",
	M: "Medium",
	H: "High",
	O: "Other"
}, Or = {
	F: "Front",
	C: "Centre",
	B: "Back",
	P: "Pipe",
	S: "Setter dump"
};
function kr(e, t = 10) {
	return String(e || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, t);
}
function Ar(e) {
	let t = e;
	if (t?.skill !== "B") return t;
	let n = String(t.startZone || t.contactZone || "");
	return {
		...t,
		startZone: n,
		endZone: n || ""
	};
}
function jr(e, t) {
	let n = t, r = e;
	if (n?.skill === "B") {
		let e = String(n.startZone || n.contactZone || "");
		e && (r = r.replace(`.${e}>${e}`, `.${e}`)), n.blockTargetNumber && (r += `&${String(n.blockTargetNumber).replace(/\D/g, "").slice(0, 3)}`);
	}
	let i = n?.skill === "A" ? n.attackCode : n?.skill === "E" ? n.setterCall : "", a = n?.skill === "A" ? n.attackTempo : n?.skill === "E" ? n.setTempo : "";
	if (i && (r += `::${kr(i, 6)}`), a && Dr[a] && (r += `~${a}`), n?.skillSubtype && (r += `%${kr(n.skillSubtype, 8)}`), n?.dvSetType && Or[n.dvSetType] && (r += `|${n.dvSetType}`), n?.specialCode && (r += `?${kr(n.specialCode, 10)}`), n?.customCode && (r += `$${kr(n.customCode, 5)}`), n?.skill === "A" && n?.endCone && n?.startZone) {
		let e = `.${n.startZone}>C${n.endCone}`;
		r.includes(">C" + n.endCone) || (r = r.replace(/^((?:R)?(?:\d+|P)(?:S|R|E|A|B|D|F|C)[#\+!\-\/=])/, `$1${e}`));
	}
	return r;
}
// src/domain/scout-code-builder-runtime.ts
var Mr = /* @__PURE__ */ new WeakMap();
function Nr(e) {
	let t = Mr.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.43",
		pureOnly: !0,
		prepare: Ar,
		finish: jr
	});
	return Mr.set(e, n), e.VC_SCOUT_CODE_BUILDER_20543 ||= n, n;
}
// src/domain/scout-action-registration.ts
function Pr(e) {
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
var Fr = /* @__PURE__ */ new WeakMap();
function Ir(e) {
	let t = Fr.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.44",
		pureOnly: !0,
		prepareContact: Pr
	});
	return Fr.set(e, n), e.VC_SCOUT_REGISTRATION_20544 ||= n, n;
}
// src/domain/scout-action-metadata.ts
function Lr(e) {
	return String(e || "").match(/[1-9]/)?.[0] || "";
}
function Rr(e) {
	return String(e || "").toUpperCase().match(/[A-D]/)?.[0] || "";
}
function zr(e, t) {
	let n = e, r = t, i = n?.skill || "", a = String(n?.startZone || ""), o = String(n?.endZone || ""), s = String(n?.contactZone || (i === "R" || i === "D" ? o || a : "") || ""), c = Lr(n?.dvStartZone || a), l = Lr(n?.dvEndZone || o), u = Rr(n?.dvEndSubzone || o), d = n?.dvSourceActionId == null ? null : Number(n.dvSourceActionId);
	if (i === "R" || i === "D") {
		let e = i === "R" ? "S" : "A", t = n?.team === "ours" ? "opponent" : "ours", a = [...Array.isArray(r?.liveRally?.actions) ? r.liveRally.actions : []].reverse().find((n) => n.team === t && n.skill === e);
		a && (c = Lr(a.startZone), l = Lr(a.endZone), u = Rr(a.endZone), d = Number(a.id) || null);
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
function Br(e) {
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
function Vr(e, t) {
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
var Hr = /* @__PURE__ */ new WeakMap();
function Ur(e) {
	let t = Hr.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.45",
		pureOnly: !0,
		dvFields: zr,
		actionTime: Br,
		normalizeTime: Vr
	});
	return Hr.set(e, n), e.VC_SCOUT_ACTION_METADATA_20545 ||= n, n;
}
// src/domain/scout-action-normalizer.ts
var Wr = {
	S: "Saque",
	R: "Recepción",
	E: "Colocación",
	A: "Ataque",
	B: "Bloqueo",
	D: "Defensa",
	F: "Freeball",
	C: "Cobertura"
}, Gr = [
	"#",
	"+",
	"!",
	"-",
	"/",
	"="
], Kr = [
	"F",
	"JF",
	"JP",
	"U"
], qr = [
	"K1",
	"K2",
	"FB",
	"TR"
], Jr = [
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
function Yr(e, t, n) {
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
		skill: Wr[r?.skill] ? r.skill : "S",
		evaluation: Gr.includes(r?.evaluation) ? r.evaluation : "!",
		startZone: String(r?.startZone || ""),
		endZone: String(r?.endZone || ""),
		serveType: Kr.includes(r?.serveType) ? r.serveType : "",
		phase: qr.includes(r?.phase) ? r.phase : "",
		setTarget: Jr.includes(r?.setTarget) ? r.setTarget : "",
		attackCombo: Jr.includes(r?.attackCombo) ? r.attackCombo : "",
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
var Xr = /* @__PURE__ */ new WeakMap();
function Zr(e) {
	let t = Xr.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.46",
		pureOnly: !0,
		normalizeBase: Yr
	});
	return Xr.set(e, n), e.VC_SCOUT_ACTION_NORMALIZER_20546 ||= n, n;
}
// src/domain/scout-action-tactical-fields.ts
function Qr(e, t) {
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
var $r = /* @__PURE__ */ new WeakMap();
function ei(e) {
	let t = $r.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.47",
		pureOnly: !0,
		normalize: Qr
	});
	return $r.set(e, n), e.VC_SCOUT_TACTICAL_FIELDS_20547 ||= n, n;
}
// src/domain/scout-action-advanced-fields.ts
var ti = {
	Q: "Quick",
	U: "Super",
	T: "Fast",
	M: "Medium",
	H: "High",
	O: "Other"
}, ni = {
	F: "Front",
	C: "Centre",
	B: "Back",
	P: "Pipe",
	S: "Setter dump"
}, ri = {
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
}, ii = {
	RAP: "T",
	MED: "M",
	ALT: "H"
}, ai = (e, t = 10) => String(e || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, t), oi = (e) => e && Number.isFinite(Number(e.x)) && Number.isFinite(Number(e.y)) ? {
	x: Number(e.x),
	y: Number(e.y)
} : null;
function si(e, t) {
	let n = e, r = t, i = ai(n?.attackTempo || n?.setTempo || r.attackTempo || "", 3), a = ti[i] ? i : ii[i] || "", o = r.skill === "A" ? a : "", s = r.skill === "E" ? a : "", c = r.skill === "A" ? ai(n?.attackCode || "", 6) : "", l = r.skill === "E" ? ai(n?.setterCall || "", 6) : "", u = (r.skill === "A" || r.skill === "E") && ni[String(n?.dvSetType || "").toUpperCase()] ? String(n?.dvSetType).toUpperCase() : "", d = ai(n?.skillSubtype || "", 8);
	return {
		attackTempo: o,
		setTempo: s,
		attackCode: c,
		setterCall: l,
		dvSetType: u,
		skillSubtype: ri[r.skill]?.[d] ? d : "",
		specialCode: ai(n?.specialCode || "", 10),
		customCode: ai(n?.customCode || "", 5),
		locationMode: n?.locationMode === "cones" ? "cones" : "zones",
		endCone: n?.endCone != null && /^[1-8]$/.test(String(n.endCone)) ? Number(n.endCone) : null,
		startCoordinate: oi(n?.startCoordinate),
		endCoordinate: oi(n?.endCoordinate),
		contactCoordinate: oi(n?.contactCoordinate),
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
var ci = /* @__PURE__ */ new WeakMap();
function li(e) {
	let t = ci.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.48",
		pureOnly: !0,
		normalize: si
	});
	return ci.set(e, n), e.VC_SCOUT_ADVANCED_FIELDS_20548 ||= n, n;
}
// src/domain/scout-action-identity-fields.ts
function ui(e, t, n) {
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
var di = /* @__PURE__ */ new WeakMap();
function fi(e) {
	let t = di.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.49",
		pureOnly: !0,
		normalize: ui
	});
	return di.set(e, n), e.VC_SCOUT_IDENTITY_FIELDS_20549 ||= n, n;
}
// src/domain/scout-match-video-container.ts
function pi(e) {
	let t = e?.video;
	return {
		syncOffset: t?.syncOffset == null ? null : Number(t.syncOffset),
		source: String(t?.source || ""),
		clips: Array.isArray(t?.clips) ? t.clips : []
	};
}
// src/domain/scout-match-video-container-runtime.ts
var mi = /* @__PURE__ */ new WeakMap();
function hi(e) {
	let t = mi.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.50",
		pureOnly: !0,
		normalize: pi
	});
	return mi.set(e, n), e.VC_SCOUT_MATCH_VIDEO_20550 ||= n, n;
}
// src/domain/scout-match-video-overlay.ts
function gi(e, t) {
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
var _i = /* @__PURE__ */ new WeakMap();
function vi(e) {
	let t = _i.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.51",
		pureOnly: !0,
		normalize: gi
	});
	return _i.set(e, n), e.VC_SCOUT_VIDEO_OVERLAY_20551 ||= n, n;
}
// src/domain/scout-match-manual-result.ts
var yi = (e) => Array.isArray(e) ? e : [];
function bi(e, t) {
	let n = e, r = t, i = yi(n?.sets);
	return {
		sets: yi(r?.sets).map((e, t) => {
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
var xi = /* @__PURE__ */ new WeakMap();
function Si(e) {
	let t = xi.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.52",
		pureOnly: !0,
		normalize: bi
	});
	return xi.set(e, n), e.VC_SCOUT_MANUAL_RESULT_20552 ||= n, n;
}
// src/domain/scout-rally-video-bounds.ts
function Ci(e) {
	let t = e;
	return {
		videoStart: t?.videoStart == null ? null : Number(t.videoStart),
		videoEnd: t?.videoEnd == null ? null : Number(t.videoEnd)
	};
}
// src/domain/scout-rally-video-bounds-runtime.ts
var wi = /* @__PURE__ */ new WeakMap();
function Ti(e) {
	let t = wi.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.53",
		pureOnly: !0,
		normalize: Ci
	});
	return wi.set(e, n), e.VC_SCOUT_RALLY_VIDEO_20553 ||= n, n;
}
// src/domain/scout-match-finalization-fields.ts
function Ei(e) {
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
var Di = /* @__PURE__ */ new WeakMap();
function Oi(e) {
	let t = Di.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.54",
		pureOnly: !0,
		normalize: Ei
	});
	return Di.set(e, n), e.VC_SCOUT_MATCH_FINALIZATION_20554 ||= n, n;
}
// src/domain/rally-shadow.ts
var ki = 40, Ai = [
	"p1",
	"p2",
	"p3",
	"p4",
	"p5",
	"p6"
], ji = [
	"liveVideoSessionId",
	"liveVideoStart",
	"liveVideoEnd",
	"liveVideoLinkedAt"
], Mi = (e, t) => e.us === t.us && e.opponent === t.opponent, Ni = (e, t, n = !1) => Object.freeze({
	operation: e,
	verdict: t.length ? "difference" : n ? "unverified" : "agree",
	areas: Object.freeze(t.length ? [...t] : n ? ["missing-data"] : [])
}), Pi = (n) => t(n.sets).map(e).find((e) => e && Number(e.number) === Number(n.currentSet) && Number.isInteger(Number(n.currentSet))) || null, Fi = (t) => {
	let n = e(t), r = e(n?.ours), i = e(n?.opponent);
	return !!r && !!i && Ai.every((e) => Object.hasOwn(r, e) && Object.hasOwn(i, e));
}, Ii = (t, n) => {
	let r = e(t), i = e(n), a = e(r?.ours), o = e(i?.ours), s = e(r?.opponent), c = e(i?.opponent);
	return !!a && !!o && !!s && !!c && Ai.every((e) => Object.is(a[e], o[e]) && Object.is(s[e], c[e]));
};
function Li(o, s, l) {
	let u = e(o), d = e(s), f = e(l), p = [];
	if (!u || !d || !f) return Ni("point", p, !0);
	let m = a(f);
	if (!m.before || !m.after || !n(f.winner) || !n(f.servingBefore) || !r(f.rotationBefore) || !r(f.opponentRotationBefore)) return Ni("point", p, !0);
	let h = c({
		score: m.before,
		serving: f.servingBefore,
		rotationUs: f.rotationBefore,
		rotationOpponent: f.opponentRotationBefore
	}, f.winner);
	if (h.state !== "projected" || !h.score) return Ni("point", p, !0);
	m.state !== "inconsistent" && Mi(h.score, m.after) || p.push("score");
	let g = i({
		us: d.scoreUs,
		opponent: d.scoreOpponent
	}), _ = !g;
	g && !Mi(g, m.after) && !p.includes("score") && p.push("score");
	let v = e(u.liveRally);
	v && t(v.actions).length === 0 && !e(v.startSnapshot) && (n(u.servingTeam) && u.servingTeam !== h.serving ? p.push("service") : n(u.servingTeam) || (_ = !0), r(u.rotationNo) && r(u.opponentRotationNo) ? (u.rotationNo !== h.rotationUs || u.opponentRotationNo !== h.rotationOpponent) && p.push("rotation") : _ = !0);
	let y = F(u, m.after);
	y.state === "projected" ? (typeof d.finished == "boolean" && d.finished !== y.setFinished ? p.push("set") : typeof d.finished != "boolean" && (_ = !0), y.setFinished && n(d.winner) && d.winner !== y.setWinner ? p.push("set") : y.setFinished && !n(d.winner) && (_ = !0), y.matchFinished === !0 && u.status !== "finished" && p.push("match")) : _ = !0;
	let b = I(f);
	return (b.lineup === "missing" || b.actionsCaptured === !1) && (_ = !0), Ni("point", [...new Set(p)], _);
}
var Ri = (n, r) => {
	let i = t(r.rallies), a = e(i.at(-1)), o = re(n);
	return {
		match: n,
		set: r,
		count: i.length,
		lastId: a?.id,
		lastRally: a,
		expectedUndo: o.state === "projected" ? o.after : null
	};
};
function zi(t, a, o) {
	let s = [], c = e(a.liveRally), l = t.lastRally, u = t.expectedUndo;
	if (!l || !c || !u || l.id === void 0 || c.id !== l.id) return Ni("undo", s, !0);
	let d = i({
		us: o.scoreUs,
		opponent: o.scoreOpponent
	}), f = !d;
	d && !Mi(d, u.score) && s.push("score"), n(a.servingTeam) ? a.servingTeam !== u.serving && s.push("service") : f = !0, r(a.rotationNo) && r(a.opponentRotationNo) ? (a.rotationNo !== u.rotationUs || a.opponentRotationNo !== u.rotationOpponent) && s.push("rotation") : f = !0, Array.isArray(l.actions) && Array.isArray(c.actions) ? l.actions.length !== c.actions.length && s.push("actions") : f = !0, Fi(l.lineupBefore) && Fi(a.lineup) ? Ii(l.lineupBefore, a.lineup) || s.push("lineup") : f = !0;
	let p = ji.filter((e) => l[e] !== void 0 && l[e] !== null);
	return p.length && p.some((e) => !Object.is(l[e], c[e])) && s.push("video"), Ni("undo", [...new Set(s)], f);
}
function Bi() {
	let t = null, n = !1, r = 0, i = 0, a = 0, o = 0, s = 0, c = 0, l = 0, u = [], d = (e) => (r++, e.operation === "point" ? i++ : a++, e.verdict === "agree" ? o++ : e.verdict === "difference" ? s++ : c++, e.verdict !== "agree" && (u.push(e), u.length > ki && u.shift()), e);
	return Object.freeze({
		observe(r) {
			if (n) return null;
			let i = e(r), a = i && Pi(i);
			if (!i || !a) return t = null, null;
			let o = Ri(i, a), s = t;
			return t = o, s ? s.match !== i || s.set !== a ? (l++, null) : o.count === s.count ? null : o.count === s.count + 1 ? d(Li(i, a, o.lastRally)) : o.count === s.count - 1 ? s.lastId === void 0 || e(i.liveRally)?.id !== s.lastId ? (l++, null) : d(zi(s, i, a)) : (l++, null) : null;
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
var Vi = Object.freeze([
	"score",
	"service",
	"rotation",
	"set",
	"match",
	"actions",
	"lineup",
	"video"
]), Hi = (e) => {
	try {
		return JSON.stringify(e);
	} catch {
		return;
	}
}, Ui = (n) => t(n.sets).map(e).find((e) => e && Number(e.number) === Number(n.currentSet) && Number.isInteger(Number(n.currentSet))) || null;
function Wi(n) {
	try {
		let r = e(n);
		if (!r) return null;
		let i = Ui(r), a = i && Array.isArray(i.rallies) ? i.rallies : null, o = e(a?.at(-1)), s = e(r.liveRally), c = typeof r.id == "string" && r.id.length > 0 || typeof r.id == "number" && Number.isFinite(r.id) ? Hi([r.id, r.currentSet]) : void 0, l = {
			score: i ? Hi([i.scoreUs, i.scoreOpponent]) : void 0,
			service: Hi(r.servingTeam),
			rotation: Hi([r.rotationNo, r.opponentRotationNo]),
			set: i ? Hi([r.currentSet, t(r.sets).map((t) => {
				let n = e(t);
				return n ? [
					n.number,
					n.scoreUs,
					n.scoreOpponent,
					n.finished,
					n.winner
				] : null;
			})]) : void 0,
			match: Hi(r.status),
			actions: a ? Hi([
				a.length,
				o?.id,
				o?.actions,
				s?.id,
				s?.actions
			]) : void 0,
			lineup: Hi([
				r.lineup,
				r.baseLineup,
				r.lineupRoles,
				r.libero
			]),
			video: Hi([
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
function Gi(e, t) {
	if (!e || !t) return Object.freeze(["missing-data"]);
	let n = [], r = !1;
	for (let i of Vi) e.fields[i] === void 0 || t.fields[i] === void 0 ? r = !0 : e.fields[i] !== t.fields[i] && n.push(i);
	return r && n.push("missing-data"), Object.freeze(n);
}
function Ki(e, t) {
	return !!e && !!t && !!e.identity && e.identity === t.identity && Vi.every((n) => e.fields[n] !== void 0 && t.fields[n] !== void 0 && e.fields[n] === t.fields[n]);
}
function qi(e, t, n) {
	return !e || !t || !n || !e.identity || !t.identity || !n.identity || e.identity !== t.identity || e.identity !== n.identity || [...Vi].some((r) => e.fields[r] === void 0 || t.fields[r] === void 0 || n.fields[r] === void 0) ? "unreadable" : Ki(e, t) ? Ki(e, n) ? "unchanged-observed" : "divergent" : Ki(n, t) ? "durable-after" : Ki(n, e) ? "durable-before" : "divergent";
}
// src/domain/rally-transaction-pilot.ts
var Ji = 40, Yi = (e, t) => e.us === t.us && e.opponent === t.opponent, Xi = (n) => {
	let r = e(n);
	return r && t(r.sets).map(e).find((e) => e && Number(e.number) === Number(r.currentSet) && Number.isInteger(Number(r.currentSet))) || null;
}, J = (e, t, n = [], r = "not-checked") => Object.freeze({
	operation: e,
	verdict: t,
	areas: Object.freeze([...n]),
	durability: r
}), Zi = (a, o, s, c, l, u, d) => {
	let f = e(c), p = Xi(c);
	if (o.state !== "projected" || !o.after || !f || !p || !l || f !== s || p !== l) return J(a, "unverified", ["missing-data"]);
	let m = t(p.rallies).length;
	if (a === "point") {
		if (m !== d + 1) return J(a, "unverified", ["missing-data"]);
		let e = Li(f, p, t(p.rallies).at(-1)), n = [...e.areas], r = i({
			us: p.scoreUs,
			opponent: p.scoreOpponent
		});
		return r && !Yi(r, o.after.score) && !n.includes("score") && n.push("score"), J("point", n.length ? "difference" : e.verdict, n);
	}
	let h = e(f.liveRally);
	if (m !== d - 1 || !u || u.id === void 0 || h?.id !== u.id) return J("undo", "unverified", ["missing-data"]);
	let g = [], _ = i({
		us: p.scoreUs,
		opponent: p.scoreOpponent
	}), v = !_;
	return _ && !Yi(_, o.after.score) && g.push("score"), n(f.servingTeam) ? f.servingTeam !== o.after.serving && g.push("service") : v = !0, r(f.rotationNo) && r(f.opponentRotationNo) ? (f.rotationNo !== o.after.rotationUs || f.opponentRotationNo !== o.after.rotationOpponent) && g.push("rotation") : v = !0, Array.isArray(u.actions) && Array.isArray(h.actions) ? u.actions.length !== h.actions.length && g.push("actions") : v = !0, J("undo", g.length ? "difference" : v ? "unverified" : "agree", g.length ? g : v ? ["missing-data"] : []);
};
function Qi(n, r = {}) {
	let i = Promise.resolve(), a = !1, o = r.requireRecoveryAfterNativeFailure === !0, s = r.installedInLiveUI === !0, c = r.requireStableMatchForCommands === !0, l = 0, u = 0, d = o && r.startBlockedForPendingRecovery === !0, f = "not-checked", p = 0, m = 0, h = 0, g = 0, _ = 0, v = 0, y = 0, b = 0, x = 0, S = 0, C = 0, w = 0, T = [], E = (e) => {
		m++, e.verdict === "agree" ? h++ : e.verdict === "difference" ? g++ : e.verdict === "native-rejected" ? v++ : e.verdict === "native-declined" ? y++ : e.verdict === "recovery-blocked" ? S++ : e.verdict === "context-discarded" ? C++ : _++, (e.verdict === "native-rejected" || e.verdict === "native-declined") && (f = e.durability, e.areas.some((e) => e !== "missing-data") && b++, e.areas.includes("missing-data") && x++), e.verdict !== "agree" && (T.push(e), T.length > Ji && T.shift());
	}, D = () => {
		try {
			return n.readCurrent();
		} catch {
			return null;
		}
	}, O = () => Wi(D()), k = async (e, t) => {
		if (!n.readDurableLocal) return "not-configured";
		try {
			return qi(e, t, Wi(await n.readDurableLocal()));
		} catch {
			return "unreadable";
		}
	}, A = async (r, i, a, s) => {
		if (c && (l > 0 || s !== u || !a || D() !== a)) return E(J(r, "context-discarded")), !1;
		if (d) throw E(J(r, "recovery-blocked")), Error("Recuperación pendiente: comprueba el partido y el guardado local antes de continuar.");
		let f = D(), p = Xi(f), m = t(p?.rallies), h = Wi(f), g = m.length, _ = e(m.at(-1)), v = null;
		try {
			v = r === "point" ? ne(f, i) : re(f);
		} catch {}
		let y;
		try {
			y = r === "point" ? await n.awardPoint(i) : await n.undoRally();
		} catch (e) {
			o && (d = !0);
			let t = O(), n = await k(h, t);
			throw E(J(r, "native-rejected", Gi(h, t), n)), e;
		}
		if (y === !1) {
			o && (d = !0);
			let e = O(), t = await k(h, e);
			return E(J(r, "native-declined", Gi(h, e), t)), y;
		}
		try {
			E(v ? Zi(r, v, f, D(), p, _, g) : J(r, "unverified", ["missing-data"]));
		} catch {
			E(J(r, "unverified", ["missing-data"]));
		}
		return y;
	}, j = (e, t) => {
		if (a) return Promise.reject(/* @__PURE__ */ Error("El piloto ya está desactivado."));
		if (p++, c && l > 0) return E(J(e, "context-discarded")), Promise.resolve(!1);
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
				return Ki(O(), Wi(await n.readDurableLocal())) ? (d = !1, !0) : !1;
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
var $i = "20.5.55", ea = /* @__PURE__ */ new WeakMap();
function ta(e) {
	let t = ea.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: $i,
		singleNativeWriter: !0,
		create(e) {
			if (!e || typeof e.readCurrent != "function" || typeof e.awardPoint != "function" || typeof e.undoRally != "function") throw TypeError("El coordinador requiere los escritores nativos originales.");
			return Qi(e, {
				installedInLiveUI: !0,
				requireStableMatchForCommands: !0
			});
		}
	});
	ea.set(e, n);
	let r = e;
	return r.VC_RALLY_WRITER_20555 ||= n, n;
}
// src/domain/rally-record.ts
var na = (e) => typeof e == "object" && e && !Array.isArray(e) ? e : null, ra = (e) => {
	let t = Object.getPrototypeOf(e);
	return t === null || Object.getPrototypeOf(t) === null;
};
function ia(e) {
	let t = na(e), n = na(t?.live), r = na(t?.before);
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
function aa(e) {
	let t = na(e), n = na(t?.rally);
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
function oa(e, t, n = 0) {
	if (Object.is(e, t)) return !0;
	if (n > 3) return !1;
	let r = na(e), i = na(t);
	if (!r || !i || !ra(r) || !ra(i)) return !1;
	let a = Reflect.ownKeys(r), o = Reflect.ownKeys(i);
	return a.length === o.length && a.every((e, t) => {
		if (e !== o[t]) return !1;
		let a = Object.getOwnPropertyDescriptor(r, e), s = Object.getOwnPropertyDescriptor(i, e);
		return !!a && !!s && "value" in a && "value" in s && a.enumerable === s.enumerable && oa(a.value, s.value, n + 1);
	});
}
// src/domain/rally-record-runtime.ts
var sa = /* @__PURE__ */ new WeakMap();
function ca(e) {
	let t = sa.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.57",
		pureRecordOnly: !0,
		close: ia,
		restore: aa,
		equivalent: oa
	});
	sa.set(e, n);
	let r = e;
	return r.VC_RALLY_RECORDS_20557 ||= n, n;
}
// src/domain/scout-local-save-receipt.ts
var la = (e) => typeof e == "number" && Number.isInteger(e) && e >= 0 ? e : null;
function ua(e) {
	let t = e?.path === "full-flush" || e?.path === "legacy-backup" ? e.path : "unavailable", n = e?.error === !0 ? "failed" : t === "full-flush" && e.outcome === !0 ? "completed" : t === "full-flush" && e.outcome === !1 ? "pending" : "unverified", r = la(e?.journalFailuresBefore), i = la(e?.journalFailuresAfter);
	return Object.freeze({
		version: "20.5.58",
		local: n,
		journal: r !== null && i !== null && i > r ? "issue-observed" : "not-confirmed",
		cloud: "not-confirmed",
		source: t
	});
}
// src/domain/scout-local-save-receipt-runtime.ts
var da = /* @__PURE__ */ new WeakMap();
function fa(e) {
	let t = da.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.58",
		readOnly: !0,
		classify: ua
	});
	da.set(e, n);
	let r = e;
	return r.VC_LOCAL_SAVE_20558 ||= n, n;
}
// src/domain/scout-local-readback.ts
var pa = 6291456, ma = 2097152, ha = 524288, ga = "VC-LZW16-1:", Y = (e) => Object.freeze({
	version: "20.5.59",
	state: e,
	scope: "primary-local-only",
	journal: "not-confirmed",
	cloud: "not-confirmed"
});
function _a(e) {
	try {
		if (!e || typeof e != "object" || Array.isArray(e)) return null;
		let t = JSON.stringify(e);
		return typeof t == "string" && t.length <= 2097152 ? t : null;
	} catch {
		return null;
	}
}
function va(e) {
	try {
		if (typeof e?.snapshot != "string" || !e.snapshot || e.snapshot.length > 2097152 || typeof e.teamId != "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(e.teamId) || typeof e.matchId != "string" && typeof e.matchId != "number" || !String(e.matchId).trim()) return Y("unverified");
		if (e.raw == null || e.raw === "") return Y("missing");
		if (typeof e.raw != "string") return Y("invalid");
		let t = e.raw;
		if (t.startsWith(ga)) {
			if (t.length > 524288) return Y("too-large");
			if (typeof e.unpack != "function") return Y("unverified");
			try {
				t = e.unpack(t);
			} catch {
				return Y("invalid");
			}
			if (typeof t != "string") return Y("invalid");
		}
		if (t.length > 6291456) return Y("too-large");
		let n;
		try {
			n = JSON.parse(t);
		} catch {
			return Y("invalid");
		}
		if (!n || typeof n != "object" || Array.isArray(n)) return Y("invalid");
		let r = n.equiposData;
		if (!r || typeof r != "object" || Array.isArray(r)) return Y("invalid");
		let i = r[e.teamId];
		if (!i || typeof i != "object" || Array.isArray(i)) return Y("missing");
		let a = i.scoutingMatches;
		if (!Array.isArray(a)) return Y("missing");
		let o = a.filter((t) => !!t && typeof t == "object" && String(t.id) === String(e.matchId));
		return o.length === 0 ? Y("missing") : o.length === 1 ? Y(JSON.stringify(o[0]) === e.snapshot ? "matched" : "different") : Y("invalid");
	} catch {
		return Y("unverified");
	}
}
// src/domain/scout-local-readback-runtime.ts
var ya = /* @__PURE__ */ new WeakMap();
function ba(e) {
	let t = ya.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.59",
		readOnly: !0,
		capture: _a,
		verify: va
	});
	ya.set(e, n);
	let r = e;
	return r.VC_LOCAL_READBACK_20559 ||= n, n;
}
// src/domain/scout-indexed-journal.ts
function xa(e) {
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
var Sa = /* @__PURE__ */ new WeakMap();
function Ca(e) {
	let t = Sa.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.60",
		ownsDatabase: !1,
		usesExistingStores: !0,
		write: xa
	});
	Sa.set(e, n);
	let r = e;
	return r.VC_SCOUT_INDEXED_JOURNAL_20560 ||= n, n;
}
// src/domain/club-local-store.ts
var wa = "VC-LZW16-1:", Ta = (e) => {
	let t = e && typeof e == "object" ? e : {};
	return t.name === "QuotaExceededError" || t.code === 22 || t.code === 1014;
};
function Ea(e) {
	if (!e || !e.storage || typeof e.storage.getItem != "function" || typeof e.storage.setItem != "function" || typeof e.key != "string" || !e.key || typeof e.raw != "string" || typeof e.pack != "function" || typeof e.unpack != "function") throw Error("Guardado local no disponible");
	let t = e.storage.getItem(e.key);
	if (!e.compactActive && !(t || "").startsWith(wa)) try {
		return e.storage.setItem(e.key, e.raw), "normal";
	} catch (e) {
		if (!Ta(e)) throw e;
	}
	let n = e.pack(e.raw);
	if (n.length >= e.raw.length) throw Error("No cabe el estado local ni comprimido. Exporta una copia, no borres datos.");
	if (e.unpack(n) !== e.raw) throw Error("La comprobación de integridad del estado comprimido ha fallado");
	try {
		e.storage.setItem(e.key, n);
	} catch (e) {
		throw Ta(e) ? Error("Almacenamiento local lleno incluso en formato compacto. La importación se ha cancelado sin eliminar tus datos; exporta una copia de seguridad y avisa del error.") : e;
	}
	if (e.storage.getItem(e.key) !== n) throw Error("No se pudo verificar el almacenamiento local");
	return "compacto";
}
// src/domain/club-local-store-runtime.ts
var Da = /* @__PURE__ */ new WeakMap();
function Oa(e) {
	let t = Da.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.61",
		usesExistingKey: !0,
		keepsNativeCodec: !0,
		write: Ea
	});
	Da.set(e, n);
	let r = e;
	return r.VC_CLUB_LOCAL_STORE_20561 ||= n, n;
}
// src/domain/club-snapshot.ts
var ka = (e, t) => {
	let n = JSON.stringify(e);
	if (typeof n != "string") throw Error(`No se pudo serializar ${t}`);
	return n;
};
function Aa(e) {
	if (!e || typeof e.updatedAt != "string") throw Error("Instantánea del club no válida");
	let t = ka(e.bibliotecaCompartida, "la biblioteca"), n = ka(e.equiposData, "los equipos"), r = ka(e.updatedAt, "la fecha");
	return Object.freeze({
		raw: `{"version":5.8,"bibliotecaCompartida":${t},"bibliotecaVersion":1,"bibliotecaUpdatedAt":${r},"equiposData":${n}}`,
		libraryEntriesJSON: t
	});
}
function ja(e) {
	if (!e || !e.snapshot || typeof e.snapshot.libraryEntriesJSON != "string" || typeof e.updatedAt != "string" || !Number.isSafeInteger(e.total) || e.total < 0) throw Error("Copia de biblioteca no válida");
	return `{"version":1,"updatedAt":${ka(e.updatedAt, "la fecha de biblioteca")},"total":${e.total},"ejercicios":${e.snapshot.libraryEntriesJSON}}`;
}
// src/domain/club-snapshot-runtime.ts
var Ma = /* @__PURE__ */ new WeakMap();
function Na(e) {
	let t = Ma.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.62",
		usesExistingPayload: !0,
		serialize: Aa,
		serializeLibrary: ja
	});
	Ma.set(e, n);
	let r = e;
	return r.VC_CLUB_SNAPSHOT_20562 ||= n, n;
}
// src/state/club-partitions.ts
var Pa = [
	"players",
	"trainings",
	"seasons"
], Fa = 5e6, Ia = Object.freeze({
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
}), La = (e) => !!e && typeof e == "object" && !Array.isArray(e);
function X(e, t) {
	if (!La(e) || !t || typeof t != "string" || t.length > 128) throw Error("Estado de equipos o revisión no disponible");
	let n = Object.keys(e).sort();
	if (!n.length || n.length > 100) throw Error("Número de equipos no admitido en el piloto");
	let r = {
		players: [],
		trainings: [],
		seasons: []
	}, i = 0;
	for (let a of n) {
		let n = e[a];
		if (!La(n)) throw Error("Registro de equipo no compatible con el piloto");
		for (let e of Pa) {
			let o = {};
			for (let t of Ia[e]) Object.hasOwn(n, t) && (o[t] = n[t]);
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
	for (let e of Pa) Object.freeze(r[e]);
	return Object.freeze({
		schema: 1,
		revision: t,
		teamIds: Object.freeze(n),
		rows: Object.freeze(r),
		totalChars: i
	});
}
function Ra(e, t) {
	if (e.teamIds.length !== t.teamIds.length) return !1;
	for (let n = 0; n < e.teamIds.length; n++) if (e.teamIds[n] !== t.teamIds[n]) return !1;
	for (let n of Pa) {
		if (e.rows[n].length !== t.rows[n].length) return !1;
		for (let r = 0; r < e.rows[n].length; r++) {
			let i = e.rows[n][r], a = t.rows[n][r];
			if (i.teamId !== a.teamId || i.dataJson !== a.dataJson) return !1;
		}
	}
	return !0;
}
// src/state/club-entity-plan.ts
var Z = [
	"playerEntities",
	"trainingEntities",
	"seasonEntities"
], za = 2e4, Ba = (e) => !!e && typeof e == "object" && !Array.isArray(e), Va = (e, t) => Object.prototype.hasOwnProperty.call(e, t), Ha = (e) => {
	if (!Ba(e)) return null;
	for (let t of [
		"id",
		"uuid",
		"_id"
	]) {
		let n = e[t];
		if (typeof n == "string" && n.trim() || typeof n == "number" && Number.isSafeInteger(n)) return String(n).trim();
	}
	return null;
}, Ua = (e, t, n, r) => JSON.stringify([
	e,
	t,
	n,
	r
]);
function Wa(e, t) {
	if (!Ba(e) || typeof t != "string" || !t || t.length > 128) throw Error("Datos de club o revisión no válidos");
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
				key: Ua(e, t, n, i),
				teamId: t,
				collection: n,
				dataJson: l
			}));
		}
	}, u = (e, t, n) => {
		if (!Va(e, t)) return;
		let r = e[t];
		if (!Array.isArray(r)) {
			o++;
			return;
		}
		let s = r.map((e) => Ha(e)), c = /* @__PURE__ */ new Map();
		for (let e of s) e !== null && c.set(e, (c.get(e) || 0) + 1);
		for (let e = 0; e < r.length; e++) {
			let o = s[e];
			o === null ? i++ : (c.get(o) || 0) > 1 ? a++ : l(n, d, t, o, r[e]);
		}
	}, d = "";
	for (d of n) {
		let t = e[d];
		if (!Ba(t)) throw Error("Registro de equipo incompatible");
		u(t, "jugadores", "playerEntities");
		for (let e of [
			"historial",
			"planificacion",
			"plantillas",
			"sesionActual"
		]) u(t, e, "trainingEntities");
		Va(t, "meta") && l("trainingEntities", d, "meta", "singleton", t.meta);
		for (let e of [
			"temporada",
			"temporadaActual",
			"season",
			"seasonName"
		]) Va(t, e) && l("seasonEntities", d, e, "singleton", t[e]);
		if (Va(t, "temporadas")) {
			let e = t.temporadas;
			if (!Array.isArray(e)) o++;
			else {
				let t = e.map((e) => typeof e == "string" ? e.trim() : Ha(e)), n = /* @__PURE__ */ new Map();
				for (let e of t) e && n.set(e, (n.get(e) || 0) + 1);
				let r = 0;
				for (let o of e) {
					let e = t[r++];
					e ? (n.get(e) || 0) > 1 ? a++ : l("seasonEntities", d, "temporadas", e, o) : i++;
				}
			}
		}
	}
	for (let e of Z) r[e].sort((e, t) => e.key.localeCompare(t.key)), Object.freeze(r[e]);
	let f = Object.create(null);
	for (let t of n) {
		let n = e[t], r = Object.create(null), i = [
			"jugadores",
			"historial",
			"planificacion",
			"plantillas",
			"sesionActual",
			"meta",
			"temporada",
			"temporadas",
			"temporadaActual",
			"season",
			"seasonName"
		].filter((e) => Va(n, e));
		for (let e of [
			"jugadores",
			"historial",
			"planificacion",
			"plantillas",
			"sesionActual",
			"temporadas"
		]) {
			let i = n[e];
			if (!Va(n, e) || !Array.isArray(i)) continue;
			let a = e === "jugadores" ? "playerEntities" : e === "temporadas" ? "seasonEntities" : "trainingEntities";
			r[e] = Object.freeze(i.map((n) => {
				let r = e === "temporadas" && typeof n == "string" ? n.trim() : Ha(n);
				return r === null ? "" : Ua(a, t, e, r);
			}));
		}
		Object.freeze(r), Object.defineProperty(f, t, {
			value: Object.freeze({
				fields: Object.freeze(i),
				arrays: r
			}),
			enumerable: !0
		});
	}
	return Object.freeze(f), Object.freeze({
		schema: 2,
		revision: t,
		teamIds: Object.freeze(n),
		rows: Object.freeze(r),
		layout: f,
		missingIds: i,
		duplicatedIds: a,
		invalidRecords: o,
		totalChars: s,
		complete: i + a + o === 0
	});
}
function Ga(e, t) {
	if (e.teamIds.length !== t.teamIds.length || e.missingIds !== t.missingIds || e.duplicatedIds !== t.duplicatedIds || e.invalidRecords !== t.invalidRecords) return !1;
	for (let n = 0; n < e.teamIds.length; n++) if (e.teamIds[n] !== t.teamIds[n]) return !1;
	for (let n of Z) {
		if (e.rows[n].length !== t.rows[n].length) return !1;
		for (let r = 0; r < e.rows[n].length; r++) {
			let i = e.rows[n][r], a = t.rows[n][r];
			if (i.key !== a.key || i.dataJson !== a.dataJson) return !1;
		}
	}
	return JSON.stringify(e.layout) === JSON.stringify(t.layout);
}
// src/state/club-repository.ts
var Ka = "VolleyCoachClubPartitionsV2063", qa = "metadata", Ja = [...Pa, qa], Ya = [
	...Ja,
	...Z,
	"entityManifest"
];
function Xa(e) {
	return new Promise((t, n) => {
		let r = !1, i = (e) => {
			r || (r = !0, n(e || Error("No se pudo abrir el piloto local")));
		}, a;
		try {
			a = e.open(Ka, 2);
		} catch (e) {
			i(e);
			return;
		}
		a.onupgradeneeded = () => {
			try {
				for (let e of Ya) a.result.objectStoreNames.contains(e) || a.result.createObjectStore(e, { keyPath: e === qa || e === "entityManifest" || Z.includes(e) ? "key" : "teamId" });
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
				for (let t of Ya) if (!e.objectStoreNames.contains(t)) {
					e.close(), i(Error("Falta una colección en el repositorio piloto"));
					return;
				}
				r = !0, t(e);
			}
		}, a.onerror = () => i(a.error), a.onblocked = () => i(Error("Otra pestaña impide abrir el repositorio piloto"));
	});
}
function Za(e, t) {
	return new Promise((n, r) => {
		let i;
		try {
			i = e.transaction([...Ja], "readwrite");
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
			for (let e of Pa) {
				let n = i.objectStore(e);
				for (let r of t.rows[e]) n.put(r);
			}
			i.objectStore(qa).put({
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
function Qa(e, t) {
	return new Promise((n, r) => {
		let i;
		try {
			i = e.transaction([...Ja], "readonly");
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
			o || (o = !0, a || s !== 1 + t.teamIds.length * Pa.length ? r(Error("La réplica no coincide con la instantánea original")) : n(Object.freeze({
				status: "verified",
				revision: t.revision,
				teamCount: t.teamIds.length,
				recordCount: t.teamIds.length * Pa.length,
				totalChars: t.totalChars,
				authoritative: !1
			})));
		}, i.onerror = () => c(i.error), i.onabort = () => c(i.error);
		try {
			l(i.objectStore(qa).get("current"), (e) => e?.key === "current" && e.schema === 1 && e.revision === t.revision && e.totalChars === t.totalChars && Array.isArray(e.teamIds) && JSON.stringify(e.teamIds) === JSON.stringify(t.teamIds));
			for (let e of Pa) {
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
async function $a(e) {
	if (!e?.factory || typeof e.factory.open != "function" || !e.plan || e.plan.schema !== 1 || !e.plan.teamIds?.length) throw Error("Repositorio piloto no disponible");
	let t = await Xa(e.factory);
	try {
		return await Za(t, e.plan), await Qa(t, e.plan);
	} finally {
		t.close();
	}
}
function eo(e) {
	return !e || typeof e.deleteDatabase != "function" ? Promise.reject(Error("Limpieza del repositorio piloto no disponible")) : new Promise((t, n) => {
		let r = !1, i, a = (e) => {
			r || (r = !0, n(e || Error("No se ha podido borrar la réplica de prueba")));
		};
		try {
			i = e.deleteDatabase(Ka);
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
var to = /* @__PURE__ */ new WeakMap(), no = 0, ro = () => `pilot-${Date.now().toString(36)}-${(++no).toString(36)}`;
function io(e) {
	let t = to.get(e);
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
			let t = e.VC_V1917_TEAM_STATE?.(), n = X(t, ro()), r = await $a({
				factory: e.indexedDB,
				plan: n
			});
			return Ra(n, X(e.VC_V1917_TEAM_STATE?.(), ro())) ? l(`Réplica piloto verificada: ${r.teamCount} equipos, ${r.recordCount} registros y ${r.totalChars.toLocaleString("es-ES")} caracteres. El guardado principal sigue intacto.`) : l("Réplica de prueba comprobada, pero los datos han cambiado durante la operación. Repite la prueba."), r;
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
			return await eo(e.indexedDB), l("Réplica piloto eliminada. Los datos originales del club siguen intactos."), !0;
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
			s || (s = !0, r.removeEventListener("click", d), a.removeEventListener("click", p), r.disabled = !0, a.disabled = !0, to.delete(e), e.VC_CLUB_PILOT_20563 === m && delete e.VC_CLUB_PILOT_20563);
		}
	});
	return e.VC_CLUB_PILOT_20563 = m, to.set(e, m), m;
}
// src/state/club-entity-repository.ts
var ao = "entityManifest", oo = [...Z, ao], so = (e) => ({
	playerEntities: e.rows.playerEntities.map((e) => e.key),
	trainingEntities: e.rows.trainingEntities.map((e) => e.key),
	seasonEntities: e.rows.seasonEntities.map((e) => e.key)
}), co = (e) => !!e && typeof e == "object" && e.schema === 2;
async function lo(e, t) {
	let n = so(t), r = [], i = 0, a = 0, o = 0, s = 0;
	return await new Promise((c, l) => {
		let u;
		try {
			u = e.transaction(oo, "readwrite");
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
			let e = u.objectStore(ao), c = e.get("current");
			c.onsuccess = () => {
				try {
					if (c.result !== void 0 && !co(c.result)) throw Error("Catálogo piloto incompatible");
					let l = co(c.result) ? c.result : null;
					for (let e of Z) {
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
						layout: t.layout,
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
async function uo(e, t, n) {
	return new Promise((r, i) => {
		let a;
		try {
			a = e.transaction(oo, "readonly");
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
				entities: Z.reduce((e, n) => e + t.rows[n].length, 0),
				added: n.added,
				changed: n.changed,
				unchanged: n.unchanged,
				removed: n.removed,
				pendingIds: t.missingIds + t.duplicatedIds + t.invalidRecords
			})));
		}, a.onerror = () => c(a.error), a.onabort = () => c(a.error);
		try {
			let e = n.keys;
			l(a.objectStore(ao).get("current"), (n) => n?.schema === 2 && n?.revision === t.revision && n?.totalChars === t.totalChars && JSON.stringify(n?.keys) === JSON.stringify(e) && JSON.stringify(n?.layout) === JSON.stringify(t.layout) && JSON.stringify(n?.teamIds) === JSON.stringify(t.teamIds));
			for (let e of Z) {
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
async function fo(e) {
	if (!e?.factory || typeof e.factory.open != "function" || e.plan?.schema !== 2) throw Error("Plan de entidades no disponible");
	let t = await Xa(e.factory);
	try {
		let n = await lo(t, e.plan);
		return await uo(t, e.plan, n);
	} finally {
		t.close();
	}
}
// src/state/club-entity-runtime.ts
var po = /* @__PURE__ */ new WeakMap(), mo = 0, ho = () => `entities-${Date.now().toString(36)}-${(++mo).toString(36)}`;
function go(e) {
	let t = e.document, n = t?.getElementById("vc20564-inspect-ids"), r = t?.getElementById("vc20564-run-delta"), i = t?.getElementById("vc20564-entity-status");
	if (!n || !r || !i) return null;
	let a = po.get(e);
	if (a) return a;
	let o = !1, s = !1, c = typeof e.indexedDB?.open == "function", l = (e) => {
		s || (i.textContent = e);
	};
	n.disabled = !1, r.disabled = !c, l(c ? "Todavía no se han analizado los IDs. Ningún cambio se aplica automáticamente." : "Puedes analizar los IDs, pero este navegador no permite ensayar el repositorio.");
	let u = () => Wa(e.VC_V1917_TEAM_STATE?.(), ho()), d = () => {
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
			let t = X(e.VC_V1917_TEAM_STATE?.(), ho()), n = u(), r = await fo({
				factory: e.indexedDB,
				plan: n
			}), i = u(), a = X(e.VC_V1917_TEAM_STATE?.(), ho());
			if (!Ga(n, i) || !Ra(t, a)) l("La escritura piloto se verificó, pero el club cambió durante la prueba. Repite la comparación.");
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
			s || (s = !0, n.removeEventListener("click", p), r.removeEventListener("click", m), n.disabled = !0, r.disabled = !0, po.delete(e), e.VC_CLUB_ENTITY_20564 === h && delete e.VC_CLUB_ENTITY_20564);
		}
	});
	return e.VC_CLUB_ENTITY_20564 = h, po.set(e, h), h;
}
// src/state/club-recovery.ts
var _o = "entityManifest", vo = [...Z, _o];
function yo(e) {
	return new Promise((t, n) => {
		let r, i = !1, a = !1, o = (e) => {
			a || (a = !0, n(e || Error("No se pudo abrir la copia piloto")));
		};
		try {
			r = e.open(Ka);
		} catch (e) {
			o(e);
			return;
		}
		r.onupgradeneeded = () => {
			i = !0;
			try {
				r.transaction?.abort();
			} catch (e) {
				o(e);
			}
		}, r.onsuccess = () => {
			let e = r.result;
			a ? e.close() : i ? (e.close(), a = !0, t(null)) : vo.some((t) => !e.objectStoreNames.contains(t)) ? (e.close(), o(Error("Esquema anterior: aún no hay repositorios de entidades"))) : (a = !0, t(e));
		}, r.onerror = () => {
			i && !a ? (a = !0, t(null)) : o(r.error);
		}, r.onblocked = () => o(Error("Otra pestaña bloquea la comprobación del piloto"));
	});
}
function bo(e, t) {
	return new Promise((n, r) => {
		let i;
		try {
			i = e.transaction([...Z, _o], "readonly");
		} catch (e) {
			r(e);
			return;
		}
		let a = !1, o = !1, s = !1, c = 0, l = (e) => {
			a || (a = !0, r(e || Error("No se pudo comprobar la recuperación local")));
		};
		i.onerror = () => l(i.error), i.onabort = () => l(i.error), i.oncomplete = () => {
			a || (a = !0, n(Object.freeze({
				status: o ? "missing" : s ? "different" : "verified",
				readOnly: !0,
				authoritative: !1,
				records: c,
				pendingIds: t.missingIds + t.duplicatedIds + t.invalidRecords,
				partial: !t.complete
			})));
		};
		try {
			let e = i.objectStore(_o).get("current");
			e.onsuccess = () => {
				try {
					let n = e.result;
					if (!n) {
						o = !0;
						return;
					}
					let r = Object.fromEntries(Z.map((e) => [e, t.rows[e].map((e) => e.key)]));
					(n.schema !== 2 || n.totalChars !== t.totalChars || n.pendingIds !== t.missingIds + t.duplicatedIds + t.invalidRecords || JSON.stringify(n.teamIds) !== JSON.stringify(t.teamIds) || JSON.stringify(n.keys) !== JSON.stringify(r)) && (s = !0);
					for (let e of Z) {
						let n = i.objectStore(e);
						for (let r of t.rows[e]) {
							let e = n.get(r.key);
							c++, e.onsuccess = () => {
								let t = e.result;
								(t?.key !== r.key || t?.teamId !== r.teamId || t?.collection !== r.collection || t?.dataJson !== r.dataJson) && (s = !0);
							}, e.onerror = () => {
								s = !0;
							};
						}
					}
				} catch (e) {
					try {
						i.abort();
					} catch {}
					l(e);
				}
			}, e.onerror = () => {
				try {
					i.abort();
				} catch {}
				l(e.error);
			};
		} catch (e) {
			try {
				i.abort();
			} catch {}
			l(e);
		}
	});
}
async function xo(e) {
	if (!e?.factory || typeof e.factory.open != "function" || e.plan?.schema !== 2) throw Error("Comprobación de recuperación no disponible");
	let t = await yo(e.factory);
	if (!t) return Object.freeze({
		status: "missing",
		readOnly: !0,
		authoritative: !1,
		records: 0,
		pendingIds: e.plan.missingIds + e.plan.duplicatedIds + e.plan.invalidRecords,
		partial: !e.plan.complete
	});
	try {
		return await bo(t, e.plan);
	} finally {
		t.close();
	}
}
// src/state/club-id-migration.ts
var So = [
	"jugadores",
	"historial",
	"planificacion",
	"plantillas",
	"sesionActual",
	"temporadas"
], Co = [
	"meta",
	"temporada",
	"temporadaActual",
	"season",
	"seasonName"
], wo = 500, To = (e) => !!e && typeof e == "object" && !Array.isArray(e), Eo = (e, t) => Object.prototype.hasOwnProperty.call(e, t), Do = (e) => {
	if (!To(e)) return null;
	for (let t of [
		"id",
		"uuid",
		"_id"
	]) {
		let n = e[t];
		if (typeof n == "string" && n.trim() || typeof n == "number" && Number.isSafeInteger(n)) return String(n).trim();
	}
	return null;
};
function Oo(e, t) {
	if (!To(e) || typeof t != "function") throw Error("Club o generador de IDs no disponible");
	let n = [], r = /* @__PURE__ */ new Set(), i = 0, a = 0, o = 0;
	for (let s of Object.keys(e).sort()) {
		let c = e[s];
		if (!To(c)) throw Error("Equipo histórico no compatible");
		for (let e of So) {
			if (!Eo(c, e)) continue;
			let l = c[e];
			if (!Array.isArray(l)) {
				a++;
				continue;
			}
			let u = l.map((t) => e === "temporadas" && typeof t == "string" ? t.trim() : Do(t)), d = /* @__PURE__ */ new Map();
			for (let e of u) e && d.set(e, (d.get(e) || 0) + 1);
			for (let c = 0; c < l.length; c++) {
				let f = l[c], p = u[c];
				if (p) {
					(d.get(p) || 0) > 1 ? i++ : o++;
					continue;
				}
				if (!To(f)) {
					a++;
					continue;
				}
				if (n.length >= wo) throw Error("Demasiadas identidades para un solo ensayo");
				let m = t();
				if (typeof m != "string" || !m || m.length > 128) throw Error("Generador de identidad no válido");
				let h = "vc-historic-" + m;
				if (r.has(h) || d.has(h)) throw Error("Identidad propuesta duplicada");
				r.add(h);
				let g = JSON.stringify(f);
				typeof g == "string" ? n.push(Object.freeze({
					teamId: s,
					field: e,
					index: c,
					beforeJson: g,
					proposedId: h
				})) : a++;
			}
		}
	}
	return Object.freeze({
		schema: 1,
		dryRun: !0,
		authoritative: !1,
		proposals: Object.freeze(n),
		conflicts: i,
		invalid: a,
		alreadyIdentified: o
	});
}
function ko(e, t) {
	if (!To(e) || t?.schema !== 1 || t.dryRun !== !0) throw Error("Ensayo de identidades no válido");
	let n = Object.create(null);
	for (let t of Object.keys(e)) {
		let r = e[t];
		if (!To(r)) throw Error("Equipo incompatible");
		let i = {};
		for (let e of [...So, ...Co]) {
			if (!Eo(r, e)) continue;
			let t = JSON.stringify(r[e]);
			if (typeof t != "string") throw Error("Datos históricos no convertibles");
			i[e] = JSON.parse(t);
		}
		Object.defineProperty(n, t, {
			value: i,
			enumerable: !0,
			configurable: !0,
			writable: !0
		});
	}
	let r = /* @__PURE__ */ new Set();
	for (let e of t.proposals) {
		let t = n[e.teamId];
		if (!To(t) || !So.some((t) => t === e.field)) throw Error("Ubicación histórica modificada");
		let i = t[e.field];
		if (!Array.isArray(i) || !To(i[e.index]) || JSON.stringify(i[e.index]) !== e.beforeJson || Do(i[e.index]) !== null) throw Error("Los datos originales cambiaron: genera un ensayo nuevo");
		if (r.has(e.proposedId)) throw Error("Identidad propuesta repetida");
		r.add(e.proposedId);
	}
	for (let e of t.proposals) {
		let t = n[e.teamId];
		t[e.field][e.index].id = e.proposedId;
	}
	let i = Wa(n, "rehearsal-only");
	return Object.freeze({
		dryRun: !0,
		applied: t.proposals.length,
		remaining: i.missingIds + i.duplicatedIds + i.invalidRecords,
		projected: Object.freeze(n)
	});
}
// src/state/club-recovery-runtime.ts
var Ao = /* @__PURE__ */ new WeakMap(), jo = 0, Mo = () => `recheck-${Date.now().toString(36)}-${(++jo).toString(36)}`;
function No(e) {
	let t = e.document, n = t?.getElementById("vc20565-check-recovery"), r = t?.getElementById("vc20565-preview-ids"), i = t?.getElementById("vc20565-recovery-status"), a = t?.getElementById("vc20565-ids-status");
	if (!n || !r || !i || !a) return null;
	let o = Ao.get(e);
	if (o) return o;
	let s = typeof e.indexedDB?.open == "function", c = typeof e.crypto?.randomUUID == "function", l = !1, u = !1, d = (e, t) => {
		u || (e.textContent = t);
	};
	n.disabled = !s, r.disabled = !c, d(i, s ? "Sin comprobar. Para ensayar una recuperación real, recarga antes la aplicación." : "No se puede comprobar la réplica en este navegador."), d(a, c ? "No se han propuesto IDs. El ensayo no modifica registros." : "Este navegador no ofrece generación segura de identificadores.");
	let f = async () => {
		if (u || l || !s) throw Error("Comprobación no disponible");
		l = !0, n.disabled = !0, r.disabled = !0, d(i, "Abriendo la réplica con una conexión nueva y comprobando los datos…");
		try {
			let t = X(e.VC_V1917_TEAM_STATE?.(), Mo()), n = Wa(e.VC_V1917_TEAM_STATE?.(), Mo()), r = await xo({
				factory: e.indexedDB,
				plan: n
			});
			return Ra(t, X(e.VC_V1917_TEAM_STATE?.(), Mo())) ? r.status === "missing" ? d(i, "No existe una réplica incremental comprobable. Ejecuta primero el ensayo de V20.5.64.") : r.status === "different" ? d(i, "La réplica ya no coincide con el club actual. No se ha restaurado ni sobrescrito ningún dato.") : d(i, `Lectura tras reapertura coincidente: ${r.records} registros locales. ${r.partial ? "Cobertura parcial; hay IDs históricos pendientes." : "Cobertura completa de las entidades seleccionadas."} No demuestra sincronización en otro dispositivo.`) : d(i, "El club cambió durante la lectura. Repite la comprobación: no se puede confirmar esta versión."), r;
		} catch (e) {
			throw d(i, "No se pudo completar la comprobación. Conserva el guardado original y la copia JSON."), e;
		} finally {
			l = !1, u || (n.disabled = !s, r.disabled = !c);
		}
	}, p = () => {
		if (u || l || !c) throw Error("Ensayo de identidades no disponible");
		try {
			let t = e.VC_V1917_TEAM_STATE?.(), n = Oo(t, () => e.crypto.randomUUID()), r = ko(t, n), i = n.conflicts + n.invalid + r.remaining;
			return d(a, `Ensayo sin guardar: ${r.applied} IDs propuestos y ${i} incidencias pendientes. Los datos originales no se han modificado.`), Object.freeze({
				proposed: r.applied,
				unresolved: i,
				dryRun: !0
			});
		} catch (e) {
			throw d(a, "No se pudo simular una asignación segura. Los registros originales no se han modificado."), e;
		}
	}, m = () => {
		f().catch(() => {});
	}, h = () => {
		try {
			p();
		} catch {}
	};
	n.addEventListener("click", m), r.addEventListener("click", h);
	let g = Object.freeze({
		VERSION: "20.5.65",
		manualOnly: !0,
		authoritative: !1,
		verify: f,
		previewIds: p,
		dispose() {
			u || (u = !0, n.removeEventListener("click", m), r.removeEventListener("click", h), n.disabled = !0, r.disabled = !0, Ao.delete(e), e.VC_CLUB_RECOVERY_20565 === g && delete e.VC_CLUB_RECOVERY_20565);
		}
	});
	return e.VC_CLUB_RECOVERY_20565 = g, Ao.set(e, g), g;
}
// src/state/club-entity-rehydration.ts
var Po = [...Z, "entityManifest"], Fo = /* @__PURE__ */ new Set([
	"jugadores",
	"historial",
	"planificacion",
	"plantillas",
	"sesionActual",
	"temporadas"
]), Io = (e) => !!e && typeof e == "object" && !Array.isArray(e), Lo = (e, t, n, r) => JSON.stringify([
	e,
	t,
	n,
	r
]), Ro = (e) => e.missingIds + e.duplicatedIds + e.invalidRecords, zo = (e, t, n = 0) => Object.freeze({
	status: e,
	dryRun: !0,
	readOnly: !0,
	authoritative: !1,
	records: n,
	teams: t.teamIds.length,
	pendingIds: Ro(t)
});
function Bo(e, t) {
	return new Promise((n, r) => {
		let i;
		try {
			i = e.transaction(Po, "readonly");
		} catch (e) {
			r(e);
			return;
		}
		let a, o = !1, s = /* @__PURE__ */ new Map(), c = (e) => {
			o || (o = !0, r(e || Error("No se pudo leer la réplica local")));
		};
		i.onerror = () => c(i.error), i.onabort = () => c(i.error), i.oncomplete = () => {
			o || (o = !0, n({
				manifest: a,
				rows: s
			}));
		};
		try {
			let e = i.objectStore("entityManifest").get("current");
			e.onsuccess = () => {
				a = e.result;
			}, e.onerror = () => c(e.error);
			for (let e of Z) {
				let n = i.objectStore(e);
				for (let r of t.rows[e]) {
					let e = n.get(r.key);
					e.onsuccess = () => {
						s.set(r.key, e.result);
					}, e.onerror = () => c(e.error);
				}
			}
		} catch (e) {
			try {
				i.abort();
			} catch {}
			c(e);
		}
	});
}
function Vo(e, t) {
	if (e.schema !== 2 || !e.complete) throw Error("No se puede reconstruir un piloto incompleto");
	let n = Object.create(null);
	for (let r of e.teamIds) {
		let i = e.layout[r];
		if (!i || !Array.isArray(i.fields)) throw Error("Disposición de entidades ausente");
		let a = Object.create(null);
		for (let e of i.fields) {
			if (Object.prototype.hasOwnProperty.call(a, e)) throw Error("Campo repetido");
			if (Fo.has(e)) {
				let n = i.arrays[e];
				if (!Array.isArray(n)) throw Error("Orden histórico ausente");
				let o = [];
				for (let i of n) {
					let n = t.get(i);
					if (!n || n.teamId !== r || n.collection !== e || n.key !== i) throw Error("Entidad o clave histórica incompatible");
					o.push(JSON.parse(n.dataJson));
				}
				Object.defineProperty(a, e, {
					value: o,
					enumerable: !0,
					writable: !0
				});
			} else {
				if (![
					"meta",
					"temporada",
					"temporadaActual",
					"season",
					"seasonName"
				].includes(e)) throw Error("Campo no permitido en la reconstrucción");
				let n = Lo(e === "meta" ? "trainingEntities" : "seasonEntities", r, e, "singleton"), i = t.get(n);
				if (!i || i.teamId !== r || i.collection !== e || i.key !== n) throw Error("Campo histórico ausente");
				Object.defineProperty(a, e, {
					value: JSON.parse(i.dataJson),
					enumerable: !0,
					writable: !0
				});
			}
		}
		Object.defineProperty(n, r, {
			value: a,
			enumerable: !0
		});
	}
	return Object.freeze(n);
}
async function Ho(e) {
	if (!e?.factory || typeof e.factory.open != "function" || e.plan?.schema !== 2 || !Io(e.source)) throw Error("Ensayo de recuperación no disponible");
	let { plan: t } = e;
	if (!t.complete) return zo("incomplete", t);
	let n = await yo(e.factory);
	if (!n) return zo("missing", t);
	try {
		let r = await Bo(n, t), i = r.manifest;
		if (!i) return zo("missing", t);
		if (!Io(i) || i.schema !== 2 || !Io(i.layout)) return zo("incompatible", t);
		let a = Object.fromEntries(Z.map((e) => [e, t.rows[e].map((e) => e.key)]));
		if (JSON.stringify(i.keys) !== JSON.stringify(a) || JSON.stringify(i.teamIds) !== JSON.stringify(t.teamIds) || i.totalChars !== t.totalChars || i.pendingIds !== Ro(t) || JSON.stringify(i.layout) !== JSON.stringify(t.layout)) return zo("different", t);
		let o = 0;
		for (let e of Z) for (let n of t.rows[e]) {
			let e = r.rows.get(n.key);
			if (!e || e.key !== n.key || e.teamId !== n.teamId || e.collection !== n.collection || e.dataJson !== n.dataJson) return zo("different", t);
			o++;
		}
		try {
			let n = Vo(t, r.rows);
			return zo(Ra(X(e.source, "dry-run"), X(n, "dry-run")) ? "ready" : "different", t, o);
		} catch {
			return zo("incompatible", t);
		}
	} finally {
		n.close();
	}
}
// src/state/club-entity-rehydration-runtime.ts
var Uo = /* @__PURE__ */ new WeakMap(), Wo = 0, Go = () => `rehydrate-${Date.now().toString(36)}-${(++Wo).toString(36)}`;
function Ko(e) {
	let t = e.document?.getElementById("vc20566-rehearse-recovery"), n = e.document?.getElementById("vc20566-rehydration-status");
	if (!t || !n) return null;
	let r = Uo.get(e);
	if (r) return r;
	let i = typeof e.indexedDB?.open == "function", a = !1, o = !1;
	t.disabled = !i, n.textContent = i ? "Sin ensayar. Primero actualiza la réplica incremental V20.5.64." : "Este navegador no permite la comprobación de IndexedDB.";
	let s = (e) => {
		o || (n.textContent = e);
	}, c = async () => {
		if (!i || a || o) throw Error("Ensayo de recuperación no disponible");
		a = !0, t.disabled = !0, s("Leyendo y reconstruyendo las entidades en memoria, sin guardar cambios…");
		try {
			let t = e.VC_V1917_TEAM_STATE?.(), n = X(t, Go()), r = Wa(t, Go()), i = await Ho({
				factory: e.indexedDB,
				plan: r,
				source: t
			});
			if (!Ra(n, X(e.VC_V1917_TEAM_STATE?.(), Go()))) return s("Los datos del club cambiaron durante el ensayo. Repítelo con el club estable."), Object.freeze({
				...i,
				status: "different"
			});
			switch (i.status) {
				case "ready":
					s(`Reconstrucción en memoria coincidente: ${i.records} registros de ${i.teams} equipos. Se conservaron orden y presencia de campos. No se restauró nada.`);
					break;
				case "incomplete":
					s(`Reconstrucción detenida: quedan ${i.pendingIds} incidencias de IDs o datos históricos. Conserva el guardado original.`);
					break;
				case "missing":
					s("No existe réplica incremental. Ejecuta antes el ensayo de cambios parciales.");
					break;
				case "incompatible":
					s("La réplica necesita metadatos de orden. Repite «Ensayar cambios parciales» y vuelve a intentarlo.");
					break;
				case "different": s("La réplica no coincide con los datos actuales. No se ha sustituido ni restaurado información.");
			}
			return i;
		} catch (e) {
			throw s("No pudo completarse la reconstrucción en memoria. Los datos originales están intactos."), e;
		} finally {
			a = !1, o || (t.disabled = !i);
		}
	}, l = () => {
		c().catch(() => {});
	};
	t.addEventListener("click", l);
	let u = Object.freeze({
		VERSION: "20.5.66",
		manualOnly: !0,
		authoritative: !1,
		rehearse: c,
		dispose() {
			o || (o = !0, t.removeEventListener("click", l), t.disabled = !0, Uo.delete(e), e.VC_CLUB_REHYDRATION_20566 === u && delete e.VC_CLUB_REHYDRATION_20566);
		}
	});
	return Uo.set(e, u), e.VC_CLUB_REHYDRATION_20566 = u, u;
}
// src/state/player-shadow.ts
var qo = "VolleyCoachPlayerShadowV2067", Jo = "playerRows", Yo = "playerManifest", Xo = 2e4, Zo = 5e6, Qo = (e) => !!e && typeof e == "object" && !Array.isArray(e), $o = (e) => {
	if (!Qo(e)) return null;
	for (let t of [
		"id",
		"uuid",
		"_id"
	]) {
		let n = e[t];
		if (typeof n == "string" && n.trim() || typeof n == "number" && Number.isSafeInteger(n)) return String(n).trim();
	}
	return null;
}, es = (e, t, n = 0) => Object.freeze({
	status: e,
	readOnly: !0,
	authoritative: !1,
	records: n,
	pendingIds: t.pendingIds
});
function ts(e, t) {
	if (typeof e != "string" || !e || e.length > 12e6 || typeof t != "string" || !t || t.length > 128) throw Error("Instantánea de club o revisión no válida");
	let n = JSON.parse(e);
	if (!Qo(n) || !Qo(n.equiposData)) throw Error("Guardado principal sin equipos");
	let r = n.equiposData, i = Object.keys(r).sort();
	if (!i.length || i.length > 100) throw Error("Número de equipos inválido");
	let a = [], o = Object.create(null), s = Object.create(null), c = 0, l = 0;
	for (let e of i) {
		let t = r[e];
		if (!Qo(t)) throw Error("Equipo incompatible");
		let n = Object.prototype.hasOwnProperty.call(t, "jugadores");
		s[e] = n;
		let i = n ? t.jugadores : [];
		if (!Array.isArray(i)) {
			c++, o[e] = Object.freeze([]);
			continue;
		}
		let u = i.map($o), d = /* @__PURE__ */ new Map();
		for (let e of u) e && d.set(e, (d.get(e) || 0) + 1);
		let f = [];
		for (let t = 0; t < i.length; t++) {
			let n = u[t];
			if (!n || (d.get(n) || 0) > 1) {
				c++;
				continue;
			}
			let r = JSON.stringify([e, n]), o = JSON.stringify(i[t]);
			if (typeof o != "string") c++;
			else {
				if (l += o.length, l > Zo || a.length >= Xo) throw Error("Plantilla demasiado grande para la réplica");
				f.push(r), a.push(Object.freeze({
					key: r,
					teamId: e,
					dataJson: o
				}));
			}
		}
		o[e] = Object.freeze(f);
	}
	return a.sort((e, t) => e.key.localeCompare(t.key)), Object.freeze({
		schema: 1,
		revision: t,
		teamIds: Object.freeze(i),
		rows: Object.freeze(a),
		order: Object.freeze(o),
		present: Object.freeze(s),
		totalChars: l,
		pendingIds: c,
		complete: c === 0
	});
}
function ns(e) {
	return new Promise((t, n) => {
		let r = !1, i, a = (e) => {
			r || (r = !0, n(e || Error("No se pudo abrir la réplica")));
		};
		try {
			i = e.open(qo, 1);
		} catch (e) {
			a(e);
			return;
		}
		i.onupgradeneeded = () => {
			try {
				for (let e of [Jo, Yo]) i.result.objectStoreNames.contains(e) || i.result.createObjectStore(e, { keyPath: "key" });
			} catch (e) {
				try {
					i.transaction?.abort();
				} catch {}
				a(e);
			}
		}, i.onsuccess = () => {
			let e = i.result;
			r ? e.close() : !e.objectStoreNames.contains(Jo) || !e.objectStoreNames.contains(Yo) ? (e.close(), a(Error("Esquema de réplica incompatible"))) : (r = !0, t(e));
		}, i.onerror = () => a(i.error), i.onblocked = () => a(Error("Otra pestaña bloquea la réplica de jugadores"));
	});
}
function rs(e) {
	return new Promise((t, n) => {
		let r = !1, i = !1, a, o = (e) => {
			r || (r = !0, n(e || Error("No se pudo leer la réplica")));
		};
		try {
			a = e.open(qo);
		} catch (e) {
			o(e);
			return;
		}
		a.onupgradeneeded = () => {
			i = !0;
			try {
				a.transaction?.abort();
			} catch (e) {
				o(e);
			}
		}, a.onsuccess = () => {
			let e = a.result;
			r ? e.close() : i ? (e.close(), r = !0, t(null)) : !e.objectStoreNames.contains(Jo) || !e.objectStoreNames.contains(Yo) ? (e.close(), o(Error("Esquema de réplica incompatible"))) : (r = !0, t(e));
		}, a.onerror = () => {
			i && !r ? (r = !0, t(null)) : o(a.error);
		}, a.onblocked = () => o(Error("Otra pestaña bloquea la réplica"));
	});
}
function is(e) {
	return {
		key: "current",
		schema: 1,
		revision: e.revision,
		teamIds: [...e.teamIds],
		keys: e.rows.map((e) => e.key),
		order: e.order,
		present: e.present,
		totalChars: e.totalChars,
		pendingIds: e.pendingIds
	};
}
var as = (e, t, n = !1) => e?.schema === 1 && (!n || e.revision === t.revision) && e.totalChars === t.totalChars && e.pendingIds === t.pendingIds && JSON.stringify(e.keys) === JSON.stringify(t.rows.map((e) => e.key)) && JSON.stringify(e.order) === JSON.stringify(t.order) && JSON.stringify(e.present) === JSON.stringify(t.present) && JSON.stringify(e.teamIds) === JSON.stringify(t.teamIds);
async function os(e, t) {
	return new Promise((n, r) => {
		let i;
		try {
			i = e.transaction([Jo, Yo], "readwrite");
		} catch (e) {
			r(e);
			return;
		}
		let a = !1, o = 0, s = 0, c = 0, l = 0, u = (e) => {
			a || (a = !0, r(e || Error("No se guardó la réplica")));
		}, d = (e) => {
			try {
				i.abort();
			} catch {}
			u(e);
		};
		i.oncomplete = () => {
			a || (a = !0, n({
				added: o,
				changed: s,
				removed: c,
				unchanged: l
			}));
		}, i.onerror = () => u(i.error), i.onabort = () => u(i.error);
		try {
			let e = i.objectStore(Jo), n = i.objectStore(Yo), r = n.get("current");
			r.onsuccess = () => {
				try {
					let i = r.result;
					if (i !== void 0 && (i?.schema !== 1 || !Array.isArray(i?.keys))) throw Error("Catálogo anterior incompatible");
					let a = new Set(t.rows.map((e) => e.key));
					for (let t of i?.keys || []) {
						if (typeof t != "string") throw Error("Clave antigua incompatible");
						a.has(t) || (e.delete(t), c++);
					}
					for (let n of t.rows) {
						let t = e.get(n.key);
						t.onsuccess = () => {
							try {
								if (t.result?.dataJson === n.dataJson && t.result?.teamId === n.teamId) {
									l++;
									return;
								}
								t.result ? s++ : o++, e.put(n);
							} catch (e) {
								d(e);
							}
						}, t.onerror = () => d(t.error);
					}
					n.put(is(t));
				} catch (e) {
					d(e);
				}
			}, r.onerror = () => d(r.error);
		} catch (e) {
			d(e);
		}
	});
}
function ss(e, t, n) {
	return new Promise((r, i) => {
		let a;
		try {
			a = e.transaction([Jo, Yo], "readonly");
		} catch (e) {
			i(e);
			return;
		}
		let o = !1, s = !1, c = (e) => {
			s || (s = !0, i(e || Error("Fallo de lectura de la réplica")));
		};
		a.onerror = () => c(a.error), a.onabort = () => c(a.error), a.oncomplete = () => {
			s || (s = !0, r(!o));
		};
		try {
			let e = a.objectStore(Yo).get("current");
			e.onsuccess = () => {
				as(e.result, t, n) || (o = !0);
			}, e.onerror = () => {
				o = !0;
			};
			for (let e of t.rows) {
				let t = a.objectStore(Jo).get(e.key);
				t.onsuccess = () => {
					(t.result?.key !== e.key || t.result?.teamId !== e.teamId || t.result?.dataJson !== e.dataJson) && (o = !0);
				}, t.onerror = () => {
					o = !0;
				};
			}
		} catch (e) {
			try {
				a.abort();
			} catch {}
			c(e);
		}
	});
}
async function cs(e) {
	if (!e?.factory || typeof e.factory.open != "function" || e.plan?.schema !== 1 || !e.plan.complete) throw Error("La plantilla tiene IDs pendientes: no se crea la réplica");
	let t = await ns(e.factory);
	try {
		let n = await os(t, e.plan);
		if (!await ss(t, e.plan, !0)) throw Error("La lectura de la réplica no coincide");
		return Object.freeze({
			status: "verified",
			authoritative: !1,
			records: e.plan.rows.length,
			...n
		});
	} finally {
		t.close();
	}
}
async function ls(e) {
	if (!e?.factory || typeof e.factory.open != "function" || e.plan?.schema !== 1) throw Error("Inspección de jugadores no disponible");
	if (!e.plan.complete) return es("incomplete", e.plan);
	let t = await rs(e.factory);
	if (!t) return es("missing", e.plan);
	try {
		return es(await ss(t, e.plan, !1) ? "verified" : "different", e.plan, e.plan.rows.length);
	} finally {
		t.close();
	}
}
function us(e) {
	return typeof e?.deleteDatabase == "function" ? new Promise((t, n) => {
		let r = !1, i, a = (e) => {
			r || (r = !0, n(e || Error("No pudo borrarse la réplica")));
		};
		try {
			i = e.deleteDatabase(qo);
		} catch (e) {
			a(e);
			return;
		}
		i.onsuccess = () => {
			r || (r = !0, t(!0));
		}, i.onerror = () => a(i.error), i.onblocked = () => a(Error("Cierra otras pestañas antes de borrar la réplica"));
	}) : Promise.reject(Error("Borrado no disponible"));
}
// src/state/player-shadow-lock.ts
var ds = "volley-coach-players-shadow-20.5.68";
function Q(e, t = ds) {
	return !e || typeof e.request != "function" ? Promise.reject(Error("El navegador no ofrece bloqueo seguro entre pestañas")) : new Promise((n, r) => {
		let i = !1, a = (e) => {
			i || (i = !0, n(e));
		}, o = (e) => {
			i || (i = !0, r(e));
		}, s = () => {}, c = new Promise((e) => {
			s = e;
		});
		try {
			Promise.resolve(e.request(t, {
				mode: "exclusive",
				ifAvailable: !0
			}, async (e) => {
				if (!e) {
					a(null);
					return;
				}
				let t = () => {}, n = new Promise((e) => {
					t = e;
				}), r = !1;
				a(Object.freeze({
					release: () => {
						r || (r = !0, t());
					},
					released: c
				})), await n;
			})).then(s, (e) => {
				s(), o(e);
			});
		} catch (e) {
			o(e);
		}
	});
}
// src/state/player-shadow-backup.ts
var fs = (e, t, n = 0, r) => Object.freeze({
	status: e,
	readOnly: !0,
	authoritative: !1,
	records: n,
	pendingIds: t.pendingIds,
	...r === void 0 ? {} : { json: r }
}), ps = (e, t) => Object.prototype.hasOwnProperty.call(e, t);
function ms(e, t) {
	return new Promise((n, r) => {
		let i;
		try {
			i = e.transaction(["playerRows", "playerManifest"], "readonly");
		} catch (e) {
			r(e);
			return;
		}
		let a = !1, o, s = /* @__PURE__ */ new Map(), c = (e) => {
			a || (a = !0, r(e || Error("No se pudo reconstruir la plantilla")));
		};
		i.onerror = () => c(i.error), i.onabort = () => c(i.error), i.oncomplete = () => {
			a || (a = !0, n({
				manifest: o,
				rows: s
			}));
		};
		try {
			let e = i.objectStore("playerManifest").get("current");
			e.onsuccess = () => {
				o = e.result;
			}, e.onerror = () => c(e.error);
			let n = i.objectStore("playerRows");
			for (let e of t.rows) {
				let t = n.get(e.key);
				t.onsuccess = () => s.set(e.key, t.result), t.onerror = () => c(t.error);
			}
		} catch (e) {
			try {
				i.abort();
			} catch {}
			c(e);
		}
	});
}
function hs(e, t) {
	if (!e.complete || e.schema !== 1) throw Error("IDs pendientes en la plantilla");
	let n = Object.create(null);
	for (let r of e.teamIds) {
		let i = e.order[r];
		if (!Array.isArray(i)) throw Error("Orden de la plantilla incompatible");
		let a = Object.create(null);
		if (e.present[r]) {
			let e = [];
			for (let n of i) {
				let i = t.get(n);
				if (!i || i.key !== n || i.teamId !== r) throw Error("Falta una entidad de jugador");
				let a = JSON.parse(n);
				if (!Array.isArray(a) || a.length !== 2 || a[0] !== r) throw Error("Clave de jugador incompatible");
				e.push(JSON.parse(i.dataJson));
			}
			Object.defineProperty(a, "jugadores", {
				value: e,
				enumerable: !0
			});
		} else if (i.length) throw Error("Campo ausente con registros inesperados");
		Object.defineProperty(n, r, {
			value: a,
			enumerable: !0
		});
	}
	return Object.freeze(n);
}
async function gs(e) {
	if (!e?.factory || typeof e.factory.open != "function" || e.plan?.schema !== 1) throw Error("Copia de recuperación no disponible");
	let t = e.plan;
	if (!t.complete) return fs("incomplete", t);
	let n = await rs(e.factory);
	if (!n) return fs("missing", t);
	try {
		let e = await ms(n, t), r = e.manifest;
		if (!r || r.schema !== 1 || r.pendingIds !== 0 || r.totalChars !== t.totalChars || JSON.stringify(r.teamIds) !== JSON.stringify(t.teamIds) || JSON.stringify(r.keys) !== JSON.stringify(t.rows.map((e) => e.key)) || JSON.stringify(r.order) !== JSON.stringify(t.order) || JSON.stringify(r.present) !== JSON.stringify(t.present)) return fs("different", t);
		for (let n of t.rows) {
			let r = e.rows.get(n.key);
			if (r?.key !== n.key || r?.teamId !== n.teamId || r?.dataJson !== n.dataJson) return fs("different", t);
		}
		try {
			let n = hs(t, e.rows);
			if (Object.keys(n).length !== t.teamIds.length || t.teamIds.some((e) => !ps(n, e))) return fs("different", t);
			let r = JSON.stringify({
				schema: "volley-coach-player-backup",
				version: 1,
				scope: "jugadores",
				authoritative: !1,
				exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
				teams: n
			});
			if (r.length > 6e6) throw Error("Copia de jugadores demasiado grande");
			return fs("ready", t, t.rows.length, r);
		} catch {
			return fs("different", t);
		}
	} finally {
		n.close();
	}
}
// src/state/player-shadow-reopen.ts
var _s = "vc20570-player-reopen-once", vs = "vc-player-reopen-v1", ys = 6e5, bs = 864e5, xs = (e, t = 0) => Object.freeze({
	status: e,
	readOnly: !0,
	authoritative: !1,
	records: t
});
async function Ss(e, t) {
	if (typeof e != "string" || e.length > 12e6 || typeof t?.digest != "function") throw Error("No se puede comprobar la huella de la copia");
	let n = await t.digest("SHA-256", new TextEncoder().encode(e));
	return Array.from(new Uint8Array(n), (e) => e.toString(16).padStart(2, "0")).join("");
}
function Cs(e, t, n = ys) {
	if (typeof e != "string" || e.length > 512 || !Number.isSafeInteger(t) || !Number.isSafeInteger(n) || n < 1 || n > 864e5) return { status: "invalid" };
	let r;
	try {
		r = JSON.parse(e);
	} catch {
		return { status: "invalid" };
	}
	if (!r || typeof r != "object") return { status: "invalid" };
	let i = r;
	return i.schema !== vs || !Number.isSafeInteger(i.createdAt) || !Number.isSafeInteger(i.records) || Number(i.records) < 0 || Number(i.records) > 2e4 || typeof i.digest != "string" || !/^[a-f0-9]{64}$/.test(i.digest) ? { status: "invalid" } : Number(i.createdAt) > t || t - Number(i.createdAt) > n ? { status: "expired" } : {
		status: "valid",
		ticket: i
	};
}
async function ws(e) {
	let t = ts(e.raw, "reopen-preflight"), n = await ls({
		factory: e.factory,
		plan: t
	});
	if (n.status !== "verified") throw Error("La copia de jugadores no coincide: " + n.status);
	let r = await Ss(e.raw, e.subtle);
	return JSON.stringify(Object.freeze({
		schema: vs,
		createdAt: e.now,
		digest: r,
		records: n.records
	}));
}
async function Ts(e) {
	let t = Cs(e.ticket, e.now, e.maxAgeMs);
	if (t.status !== "valid") return xs(t.status);
	let n = t.ticket, r;
	try {
		r = ts(e.raw, "reopen-after-reload");
	} catch {
		return xs("different");
	}
	if (!r.complete) return xs("incomplete");
	if (r.rows.length !== n.records || await Ss(e.raw, e.subtle) !== n.digest) return xs("different");
	let i = await ls({
		factory: e.factory,
		plan: r
	});
	return xs(i.status === "verified" ? "verified" : i.status, i.records);
}
// src/state/player-shadow-cold-recovery.ts
var Es = "vc20571-player-cold-check-once", Ds = (e) => ws(e), Os = (e) => Ts({
	...e,
	maxAgeMs: bs
}), ks = /* @__PURE__ */ new WeakMap(), As = 0, js = () => `player-shadow-${Date.now().toString(36)}-${(++As).toString(36)}`, Ms = "volleyCoachStateV43";
function Ns(e) {
	let t = e.document, n = t?.getElementById("vc20567-arm-players"), r = t?.getElementById("vc20567-pause-players"), i = t?.getElementById("vc20567-check-players"), a = t?.getElementById("vc20567-erase-players"), o = t?.getElementById("vc20569-download-players"), s = t?.getElementById("vc20570-reopen-players"), c = t?.getElementById("vc20570-reopen-status"), l = t?.getElementById("vc20571-prepare-cold"), u = t?.getElementById("vc20571-verify-cold"), d = t?.getElementById("vc20571-cancel-cold"), f = t?.getElementById("vc20571-cold-status"), p = t?.getElementById("vc20567-player-shadow-status");
	if (!n || !r || !i || !a || !o || !s || !c || !l || !u || !d || !f || !p) return null;
	let m = ks.get(e);
	if (m) return m;
	let h = typeof e.indexedDB?.open == "function" && typeof e.indexedDB?.deleteDatabase == "function" && !!e.localStorage, g = e.navigator?.locks, _ = h && typeof g?.request == "function", v = !1;
	try {
		v = typeof e.sessionStorage?.getItem == "function" && typeof e.sessionStorage?.setItem == "function" && typeof e.sessionStorage?.removeItem == "function";
	} catch {}
	let y = _ && typeof e.crypto?.subtle?.digest == "function" && typeof e.location?.reload == "function" && v, b = _ && typeof e.crypto?.subtle?.digest == "function", x = !1, S = !1, C = !1, w = !1, T = !1, E = !1, D = !1, O = !1, k = null, A = null, j = null, M = null, N = (e) => {
		C || (p.textContent = e);
	}, P = (e) => {
		C || (c.textContent = e), N(e);
	}, F = (e) => {
		C || (f.textContent = e), N(e);
	}, I = () => {
		try {
			return e.localStorage.getItem(Es);
		} catch {
			return null;
		}
	}, L = () => {
		n.disabled = !_ || x || S || !!k || !!A || C || E || D || O, r.disabled = !x || C, i.disabled = !h || C || E || D || O, a.disabled = !_ || C || E || D || O, o.disabled = !_ || C || E || D || O, s.disabled = !y || C || E || D || O;
		let e = C || E || D || O, t = !!I();
		l.disabled = !b || e || t, u.disabled = !b || e || !t, d.disabled = !b || e || !t;
	};
	L(), N(_ ? "Copia paralela apagada. V20.5.68 protege la sesión con un bloqueo exclusivo entre pestañas." : "La copia paralela requiere IndexedDB y Web Locks para impedir escrituras simultáneas. La inspección de solo lectura puede seguir disponible.");
	let R = () => {
		let t = e.localStorage.getItem(Ms);
		if (!t) throw Error("No hay un guardado local principal confirmado");
		if (t.startsWith("VC-LZW16-1:")) {
			let n = e.VC_STORAGE_QUOTA_1531?.unpack;
			if (typeof n != "function") throw Error("Estado compacto no disponible para lectura");
			return n(t);
		}
		return t;
	}, ee = async () => {
		if (!(w || C || !x)) {
			w = !0;
			try {
				for (; x && j !== null;) {
					let t = j;
					j = null;
					let n = ts(t, js());
					if (!n.complete) throw Error(`IDs pendientes: ${n.pendingIds}`);
					let r = await cs({
						factory: e.indexedDB,
						plan: n
					});
					N(`Copia paralela verificada: ${r.records} jugadores. ${r.added} nuevos, ${r.changed} actualizados, ${r.removed} eliminados de la copia. El guardado original continúa activo.`);
				}
			} catch {
				x = !1, j = null, N("Copia paralela detenida por una incompatibilidad o fallo local. El guardado principal no se ha modificado. Revisa los IDs y la copia JSON.");
			} finally {
				w = !1, M = null, L(), x || ie();
			}
		}
	}, te = () => {
		T || w || C || !x || (T = !0, setTimeout(() => {
			T = !1, x && !C && (M = ee());
		}, 0));
	}, ne = (e) => {
		x && !C && (typeof e != "string" || !e || e.length > 12e6 ? (V(), N("Copia paralela pausada: el estado confirmado supera los límites de prueba.")) : (j = e, te()));
	}, re = async () => {
		for (; T || w || M;) M ? await M : await new Promise((e) => setTimeout(e, 0));
	}, ie = () => A || (A = (async () => {
		await re();
		let e = k;
		k = null, e?.release(), e && await e.released, A = null, L();
	})(), A), z = async () => {
		await re(), A && await A;
	}, B = async () => {
		if (!_ || C || x || S || k || A || O) throw Error("No se puede activar: copia ocupada o bloqueo no disponible");
		let e = R(), t = ts(e, js());
		if (!t.complete) throw Error(`Hay ${t.pendingIds} identidades pendientes`);
		S = !0, L();
		try {
			let t = await Q(g);
			if (!t) throw Error("Otra pestaña ya tiene activada la copia paralela");
			if (C || !S) {
				t.release();
				return;
			}
			k = t, x = !0, N("Copia paralela protegida para esta sesión. Comprobando el último guardado confirmado…"), ne(e);
		} finally {
			S = !1, L();
		}
	}, V = () => {
		x = !1, S = !1, j = null, L(), ie(), N(w ? "Copia paralela pausada. La transacción ya iniciada finalizará antes de liberar el bloqueo." : "Copia paralela desactivada. El bloqueo de esta sesión se ha liberado y el guardado principal sigue activo.");
	}, ae = async () => {
		if (!h || C) throw Error("Inspección de jugadores no disponible");
		let t = R(), n = ts(t, js()), r = await ls({
			factory: e.indexedDB,
			plan: n
		});
		if (R() !== t) return N("El guardado principal cambió durante la lectura. Repite la comprobación."), Object.freeze({
			...r,
			status: "different"
		});
		let i = {
			verified: `Coincidencia de ${r.records} jugadores con el último guardado local. No implica sincronización remota.`,
			missing: "No existe todavía copia paralela de jugadores.",
			different: "La copia paralela y el guardado local no coinciden.",
			incomplete: `Hay ${r.pendingIds} identidades incompletas o duplicadas; no se puede certificar la copia.`
		};
		return N(i[r.status]), r;
	}, H = async () => {
		if (!_ || C) throw Error("Borrado protegido no disponible");
		V(), await z();
		let t = await Q(g);
		if (!t) throw Error("Otra pestaña está usando la copia; no se elimina");
		try {
			let t = await us(e.indexedDB);
			return N("Se eliminó únicamente la copia paralela de jugadores. El club original no cambió."), t;
		} finally {
			t.release(), await t.released;
		}
	}, oe = async () => {
		if (!_ || C) throw Error("Exportación protegida no disponible");
		V(), await z();
		let t = await Q(g);
		if (!t) throw Error("Otra pestaña tiene activa la copia de jugadores");
		try {
			let t = R(), n = ts(t, js()), r = await gs({
				factory: e.indexedDB,
				plan: n
			});
			if (R() !== t) return N("El club cambió durante la preparación de la copia. Repite el ensayo."), Object.freeze({
				...r,
				status: "different",
				json: void 0
			});
			let i = {
				ready: `Copia comprobada: ${r.records} jugadores. La descarga contiene únicamente las plantillas.`,
				missing: "No existe una copia paralela que se pueda exportar.",
				different: "La copia paralela no coincide con el guardado principal. No se descarga información antigua.",
				incomplete: `La copia está bloqueada por ${r.pendingIds} identidades pendientes.`
			};
			return N(i[r.status]), r;
		} finally {
			t.release(), await t.released;
		}
	}, se = async () => {
		if (!y || C || E || D || O) throw Error("Prueba de reapertura no disponible");
		E = !0, L();
		try {
			V(), await z();
			let t = await Q(g);
			if (!t) throw Error("Hay otra pestaña con la copia activa");
			try {
				let t = R(), n = await ws({
					raw: t,
					factory: e.indexedDB,
					subtle: e.crypto.subtle,
					now: Date.now()
				});
				if (R() !== t) throw Error("El club cambió durante la comprobación");
				e.sessionStorage.setItem(_s, n);
			} finally {
				t.release(), await t.released;
			}
			P("Copia verificada antes de recargar. Comenzando la prueba de reapertura…");
			try {
				e.location.reload();
			} catch (t) {
				throw e.sessionStorage.removeItem(_s), t;
			}
		} finally {
			E = !1, L();
		}
	}, ce = async (t) => {
		D = !0, L(), P("Volviendo a abrir la copia de jugadores desde IndexedDB…");
		try {
			if (!y) throw Error("El navegador no permite verificar esta reapertura");
			let n = await Q(g);
			if (!n) throw Error("Otra pestaña mantiene el bloqueo; la reapertura no se ha certificado");
			try {
				let n = R(), r = await Ts({
					ticket: t,
					raw: n,
					factory: e.indexedDB,
					subtle: e.crypto.subtle,
					now: Date.now()
				});
				if (R() !== n) throw Error("El guardado original cambió durante la reapertura");
				let i = {
					verified: `Reapertura comprobada: ${r.records} jugadores coinciden en una conexión IndexedDB nueva. Solo prueba recarga normal; no garantiza recuperación tras apagón ni sincronización con otro dispositivo.`,
					missing: "Prueba no superada: falta la base IndexedDB después de recargar.",
					different: "Prueba no superada: el club o los registros de IndexedDB cambiaron.",
					incomplete: "Prueba no superada: hay identidades de jugadores pendientes.",
					expired: "Prueba caducada: han pasado más de diez minutos desde su inicio.",
					invalid: "Prueba rechazada: la marca de sesión no es válida."
				};
				P(i[r.status]);
			} finally {
				n.release(), await n.released;
			}
		} catch {
			P("No se pudo certificar la reapertura de jugadores. No se ha modificado el club. Cierra otras pestañas y comprueba la copia de nuevo.");
		} finally {
			D = !1, L();
		}
	}, le = async (e) => {
		if (!b || C || O || E || D) throw Error("Comprobación de cierre no disponible");
		O = !0, L();
		try {
			V(), await z();
			let t = await Q(g);
			if (!t) throw Error("Otra pestaña está utilizando la réplica");
			try {
				return await e();
			} finally {
				t.release(), await t.released;
			}
		} finally {
			O = !1, L();
		}
	}, ue = () => le(async () => {
		if (I() !== null) throw Error("Ya existe una prueba pendiente");
		let t = R(), n = await Ds({
			raw: t,
			factory: e.indexedDB,
			subtle: e.crypto.subtle,
			now: Date.now()
		});
		if (R() !== t) throw Error("El club cambió antes de guardar la comprobación");
		if (e.localStorage.setItem(Es, n), e.localStorage.getItem("vc20571-player-cold-check-once") !== n) throw Error("El navegador no confirmó el comprobante local");
		F("Prueba preparada. Cierra COMPLETAMENTE el navegador y vuelve después a Gestión para pulsar «Verificar tras el cierre». El club no se ha modificado.");
	}), de = () => le(async () => {
		let t = I();
		if (!t) throw Error("No hay una prueba de cierre preparada");
		let n = R(), r = await Os({
			ticket: t,
			raw: n,
			factory: e.indexedDB,
			subtle: e.crypto.subtle,
			now: Date.now()
		});
		if (R() !== n || I() !== t) throw Error("El club o la marca cambiaron durante la recuperación");
		e.localStorage.removeItem(Es);
		let i = {
			verified: `Verificación posterior al cierre: ${r.records} jugadores siguen coincidiendo con el guardado principal. No podemos determinar desde la web si el proceso fue forzado ni certificar resistencia a apagones.`,
			missing: "Prueba no superada: IndexedDB no conserva la réplica de jugadores.",
			different: "Prueba no superada: cambiaron el guardado principal o las entidades de jugadores.",
			incomplete: "Prueba no superada: hay jugadores sin identidad estable.",
			expired: "Prueba caducada: han pasado más de 24 horas.",
			invalid: "Prueba rechazada: el comprobante local es inválido."
		};
		return F(i[r.status]), r;
	}), fe = () => le(async () => {
		e.localStorage.removeItem(Es), F("Prueba cancelada. Solo se eliminó el comprobante de esta prueba; no se tocaron jugadores, scouting, vídeo ni nube.");
	}), pe = () => {
		e.confirm("La réplica opcional guardará datos de jugadores en este dispositivo. ¿Tienes copia JSON de seguridad y deseas activarla solo para esta sesión?") && B().catch(() => N("No se pudo activar: otra pestaña puede estar usando la copia, o hay IDs de jugadores pendientes."));
	}, me = () => V(), he = () => {
		ae().catch(() => N("No se pudo comprobar la copia de jugadores."));
	}, ge = () => {
		e.confirm("¿Eliminar solo la réplica de jugadores V20.5.67? No se borrará el club principal.") && H().catch(() => N("No se ha eliminado la copia. Otra pestaña puede estar utilizándola."));
	}, _e = () => {
		e.confirm("Esta descarga contiene datos personales de jugadores. ¿Quieres crear una copia JSON solo de plantilla, verificada y para guardar en un lugar protegido?") && oe().then((e) => {
			if (e.status !== "ready" || !e.json) return;
			let n = new Blob([e.json], { type: "application/json;charset=utf-8" }), r = URL.createObjectURL(n);
			try {
				let e = t.createElement("a");
				e.href = r, e.download = "Volley_Coach_Jugadores_" + (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) + ".json", e.click();
			} finally {
				setTimeout(() => URL.revokeObjectURL(r), 1e3);
			}
		}).catch(() => N("No se pudo preparar la descarga segura de jugadores. No se modificaron los datos."));
	}, ve = () => {
		e.confirm("La página se recargará una vez. Se comparará la réplica de jugadores con el último guardado confirmado antes y después; no se tocarán tus datos. ¿Continuar?") && se().catch(() => P("No se pudo iniciar la prueba: comprueba primero que las plantillas estén verificadas y no haya otra pestaña activa."));
	}, ye = () => {
		e.confirm("¿Preparar una comprobación opcional para cerrar el navegador y verificar luego la copia de jugadores? Se guardará SOLO una huella y fecha, sin datos personales.") && ue().catch(() => F("No se preparó la prueba de cierre. Comprueba que los jugadores coinciden, que no hay otra pestaña activa y que queda espacio local."));
	}, be = () => {
		de().catch(() => F("No se ha podido verificar el cierre. La prueba pendiente no se borra: comprueba el bloqueo de otras pestañas y vuelve a intentarlo."));
	}, xe = () => {
		e.confirm("¿Cancelar la prueba pendiente? Solo se elimina su comprobante, nunca los datos del club.") && fe().catch(() => F("No se pudo cancelar: otra pestaña puede tener el bloqueo."));
	}, Se = (e) => {
		e.key === "vc20571-player-cold-check-once" && L(), e.key === Ms && (x || S) && (V(), N("Copia paralela detenida: otra pestaña modificó el guardado principal. Vuelve a comprobar los datos antes de activarla."));
	}, Ce = () => {
		(x || S) && V();
	};
	n.addEventListener("click", pe), r.addEventListener("click", me), i.addEventListener("click", he), a.addEventListener("click", ge), o.addEventListener("click", _e), s.addEventListener("click", ve), l.addEventListener("click", ye), u.addEventListener("click", be), d.addEventListener("click", xe), e.addEventListener?.("storage", Se), e.addEventListener?.("pagehide", Ce);
	let we = Object.freeze({
		VERSION: "20.5.67",
		manualOnly: !0,
		authoritative: !1,
		crossTabSafe: !0,
		enabled: () => x,
		arm: B,
		pause: V,
		onConfirmedWrite: ne,
		inspect: ae,
		backup: oe,
		reopen: se,
		prepareCold: ue,
		verifyCold: de,
		cancelCold: fe,
		erase: H,
		whenIdle: z,
		dispose() {
			C || (V(), C = !0, n.removeEventListener("click", pe), r.removeEventListener("click", me), i.removeEventListener("click", he), a.removeEventListener("click", ge), o.removeEventListener("click", _e), s.removeEventListener("click", ve), l.removeEventListener("click", ye), u.removeEventListener("click", be), d.removeEventListener("click", xe), e.removeEventListener?.("storage", Se), e.removeEventListener?.("pagehide", Ce), L(), ks.delete(e), e.VC_PLAYER_SHADOW_20567 === we && delete e.VC_PLAYER_SHADOW_20567);
		}
	});
	ks.set(e, we), e.VC_PLAYER_SHADOW_20567 = we, I() !== null && F("Hay una prueba de cierre pendiente. Si ya has vuelto a abrir el navegador, pulsa «Verificar tras el cierre». Si no, ciérralo completamente antes.");
	try {
		let t = e.sessionStorage?.getItem(_s);
		t != null && (e.sessionStorage.removeItem(_s), ce(t));
	} catch {
		P("No se pudo acceder a la marca de reapertura. El club permanece intacto.");
	}
	return we;
}
// src/state/training-shadow.ts
var Ps = "VolleyCoachTrainingShadowV2072", Fs = [
	"sesionActual",
	"historial",
	"planificacion",
	"plantillas"
], Is = "trainingRows", Ls = "trainingManifest", Rs = 2e4, zs = 5e6, Bs = (e) => !!e && typeof e == "object" && !Array.isArray(e), Vs = (e, t) => Object.prototype.hasOwnProperty.call(e, t), Hs = (e) => {
	if (!Bs(e)) return null;
	for (let t of [
		"id",
		"uuid",
		"_id"
	]) {
		let n = e[t];
		if (typeof n == "string" && n.trim() || typeof n == "number" && Number.isSafeInteger(n)) return String(n).trim();
	}
	return null;
}, Us = (e, t, n = 0) => Object.freeze({
	status: e,
	records: n,
	pendingIds: t.pendingIds,
	readOnly: !0,
	authoritative: !1
});
function Ws(e, t) {
	if (typeof e != "string" || !e || e.length > 12e6 || typeof t != "string" || !t || t.length > 128) throw Error("Guardado original o revisión no válidos");
	let n = JSON.parse(e);
	if (!Bs(n) || !Bs(n.equiposData)) throw Error("Guardado principal sin equipos");
	let r = Object.keys(n.equiposData).sort();
	if (!r.length || r.length > 100) throw Error("Número de equipos incompatible");
	let i = [], a = Object.create(null), o = 0, s = 0, c = (e, t, n, r) => {
		let a = JSON.stringify(r);
		if (typeof a != "string") return o++, !1;
		if (s += a.length, i.length >= Rs || s > zs) throw Error("Entrenamientos demasiado grandes para la réplica");
		return i.push(Object.freeze({
			key: n,
			teamId: e,
			field: t,
			dataJson: a
		})), !0;
	};
	for (let e of r) {
		let t = n.equiposData[e];
		if (!Bs(t)) throw Error("Equipo de entrenamiento incompatible");
		let r = Object.create(null), i = Object.create(null);
		for (let n of Fs) {
			if (r[n] = Vs(t, n), !r[n]) continue;
			if (!Array.isArray(t[n])) {
				o++;
				continue;
			}
			let a = t[n], s = a.map(Hs), l = /* @__PURE__ */ new Map();
			for (let e of s) e !== null && l.set(e, (l.get(e) || 0) + 1);
			let u = [];
			for (let t = 0; t < a.length; t++) {
				let r = s[t];
				if (r === null || (l.get(r) || 0) > 1) {
					o++;
					continue;
				}
				let i = JSON.stringify([
					e,
					n,
					r
				]);
				c(e, n, i, a[t]) && u.push(i);
			}
			i[n] = Object.freeze(u);
		}
		r.meta = Vs(t, "meta"), r.meta && c(e, "meta", JSON.stringify([
			e,
			"meta",
			"singleton"
		]), t.meta), Object.defineProperty(a, e, {
			value: Object.freeze({
				present: Object.freeze(r),
				order: Object.freeze(i)
			}),
			enumerable: !0
		});
	}
	return i.sort((e, t) => e.key.localeCompare(t.key)), Object.freeze({
		schema: 1,
		revision: t,
		teams: Object.freeze(r),
		rows: Object.freeze(i),
		layout: Object.freeze(a),
		pendingIds: o,
		totalChars: s,
		complete: o === 0
	});
}
var Gs = (e) => ({
	key: "current",
	schema: 1,
	revision: e.revision,
	teams: [...e.teams],
	keys: e.rows.map((e) => e.key),
	layout: e.layout,
	totalChars: e.totalChars,
	pendingIds: e.pendingIds
}), Ks = (e, t) => e?.schema === 1 && e.totalChars === t.totalChars && e.pendingIds === 0 && JSON.stringify(e.teams) === JSON.stringify(t.teams) && JSON.stringify(e.keys) === JSON.stringify(t.rows.map((e) => e.key)) && JSON.stringify(e.layout) === JSON.stringify(t.layout);
function qs(e) {
	return new Promise((t, n) => {
		let r = !1, i = !1, a, o = (e) => {
			r || (r = !0, n(e || Error("No se pudo leer IndexedDB")));
		};
		try {
			a = e.open(Ps);
		} catch (e) {
			o(e);
			return;
		}
		a.onupgradeneeded = () => {
			i = !0;
			try {
				a.transaction?.abort();
			} catch (e) {
				o(e);
			}
		}, a.onsuccess = () => {
			let e = a.result;
			r ? e.close() : i ? (e.close(), r = !0, t(null)) : !e.objectStoreNames.contains(Is) || !e.objectStoreNames.contains(Ls) ? (e.close(), o(Error("Esquema de entrenamientos incompatible"))) : (r = !0, t(e));
		}, a.onerror = () => {
			i && !r ? (r = !0, t(null)) : o(a.error);
		}, a.onblocked = () => o(Error("Otra pestaña bloquea los entrenamientos"));
	});
}
function Js(e) {
	return new Promise((t, n) => {
		let r = !1, i, a = (e) => {
			r || (r = !0, n(e || Error("No se pudo abrir IndexedDB")));
		};
		try {
			i = e.open(Ps, 1);
		} catch (e) {
			a(e);
			return;
		}
		i.onupgradeneeded = () => {
			try {
				for (let e of [Is, Ls]) i.result.objectStoreNames.contains(e) || i.result.createObjectStore(e, { keyPath: "key" });
			} catch (e) {
				try {
					i.transaction?.abort();
				} catch {}
				a(e);
			}
		}, i.onsuccess = () => {
			let e = i.result;
			r ? e.close() : !e.objectStoreNames.contains(Is) || !e.objectStoreNames.contains(Ls) ? (e.close(), a(Error("Esquema de entrenamientos incompatible"))) : (r = !0, t(e));
		}, i.onerror = () => a(i.error), i.onblocked = () => a(Error("Otra pestaña bloquea la réplica de entrenamientos"));
	});
}
function Ys(e, t) {
	return new Promise((n, r) => {
		let i, a = !0, o = !1;
		try {
			i = e.transaction([Is, Ls], "readonly");
		} catch (e) {
			r(e);
			return;
		}
		let s = (e) => {
			o || (o = !0, r(e || Error("Lectura incompleta")));
		};
		i.oncomplete = () => {
			o || (o = !0, n(a));
		}, i.onerror = () => s(i.error), i.onabort = () => s(i.error);
		try {
			let e = i.objectStore(Ls).get("current");
			e.onsuccess = () => {
				Ks(e.result, t) || (a = !1);
			}, e.onerror = () => {
				a = !1;
			};
			let n = i.objectStore(Is), r = n.getAllKeys();
			r.onsuccess = () => {
				JSON.stringify(r.result.map(String).sort()) !== JSON.stringify(t.rows.map((e) => e.key).sort()) && (a = !1);
			}, r.onerror = () => {
				a = !1;
			};
			for (let e of t.rows) {
				let t = n.get(e.key);
				t.onsuccess = () => {
					(t.result?.key !== e.key || t.result?.teamId !== e.teamId || t.result?.field !== e.field || t.result?.dataJson !== e.dataJson) && (a = !1);
				}, t.onerror = () => {
					a = !1;
				};
			}
		} catch (e) {
			try {
				i.abort();
			} catch {}
			s(e);
		}
	});
}
async function Xs(e) {
	if (!e?.factory || typeof e.factory.open != "function" || e.plan?.schema !== 1 || !e.plan.complete) throw Error("Entrenamientos con IDs pendientes: no se crea la réplica");
	let t = await Js(e.factory);
	try {
		let n = await new Promise((n, r) => {
			let i, a = !1, o = 0, s = 0, c = 0, l = 0;
			try {
				i = t.transaction([Is, Ls], "readwrite");
			} catch (e) {
				r(e);
				return;
			}
			let u = (e) => {
				a || (a = !0, r(e || Error("Escritura incompleta")));
			}, d = (e) => {
				try {
					i.abort();
				} catch {}
				u(e);
			};
			i.oncomplete = () => {
				a || (a = !0, n({
					added: o,
					changed: s,
					removed: c,
					unchanged: l
				}));
			}, i.onerror = () => u(i.error), i.onabort = () => u(i.error);
			try {
				let t = i.objectStore(Is), n = t.getAllKeys();
				n.onsuccess = () => {
					try {
						let r = new Set(e.plan.rows.map((e) => e.key));
						for (let e of n.result) r.has(String(e)) || (t.delete(e), c++);
						for (let n of e.plan.rows) {
							let e = t.get(n.key);
							e.onsuccess = () => {
								try {
									if (e.result?.dataJson === n.dataJson && e.result?.teamId === n.teamId && e.result?.field === n.field) {
										l++;
										return;
									}
									e.result ? s++ : o++, t.put(n);
								} catch (e) {
									d(e);
								}
							}, e.onerror = () => d(e.error);
						}
						i.objectStore(Ls).put(Gs(e.plan));
					} catch (e) {
						d(e);
					}
				}, n.onerror = () => d(n.error);
			} catch (e) {
				d(e);
			}
		});
		if (!await Ys(t, e.plan)) throw Error("La réplica no coincide tras el guardado");
		return Object.freeze({
			status: "verified",
			authoritative: !1,
			records: e.plan.rows.length,
			...n
		});
	} finally {
		t.close();
	}
}
async function Zs(e) {
	if (!e?.factory || typeof e.factory.open != "function" || e.plan?.schema !== 1) throw Error("Inspección de entrenamientos no disponible");
	if (!e.plan.complete) return Us("incomplete", e.plan);
	let t = await qs(e.factory);
	if (!t) return Us("missing", e.plan);
	try {
		return Us(await Ys(t, e.plan) ? "verified" : "different", e.plan, e.plan.rows.length);
	} finally {
		t.close();
	}
}
function Qs(e) {
	return typeof e?.deleteDatabase == "function" ? new Promise((t, n) => {
		let r = !1, i, a = (e) => {
			r || (r = !0, n(e || Error("No se pudo borrar la réplica")));
		};
		try {
			i = e.deleteDatabase(Ps);
		} catch (e) {
			a(e);
			return;
		}
		i.onsuccess = () => {
			r || (r = !0, t(!0));
		}, i.onerror = () => a(i.error), i.onblocked = () => a(Error("Cierra otras pestañas antes de borrar la réplica"));
	}) : Promise.reject(Error("Borrado no disponible"));
}
// src/state/training-shadow-backup.ts
var $s = (e, t) => Object.prototype.hasOwnProperty.call(e, t), ec = (e) => !!e && typeof e == "object" && !Array.isArray(e), tc = (e, t, n = 0, r) => Object.freeze({
	status: e,
	readOnly: !0,
	authoritative: !1,
	records: n,
	pendingIds: t.pendingIds,
	...r === void 0 ? {} : { json: r }
});
function nc(e, t) {
	return new Promise((n, r) => {
		let i, a, o = [], s = /* @__PURE__ */ new Map(), c = !1, l = !1, u = (e) => {
			c || (c = !0, r(e || Error("Lectura de entrenamientos incompleta")));
		};
		try {
			i = e.transaction(["trainingManifest", "trainingRows"], "readonly");
		} catch (e) {
			r(e);
			return;
		}
		i.onerror = () => u(i.error), i.onabort = () => u(i.error), i.oncomplete = () => {
			c || (c = !0, l ? r(Error("Lectura de entrenamientos fallida")) : n({
				manifest: a,
				keys: o,
				rows: s
			}));
		};
		try {
			let e = i.objectStore("trainingManifest").get("current");
			e.onsuccess = () => {
				a = e.result;
			}, e.onerror = () => {
				l = !0;
			};
			let n = i.objectStore("trainingRows"), r = n.getAllKeys();
			r.onsuccess = () => {
				o = r.result.map(String);
			}, r.onerror = () => {
				l = !0;
			};
			for (let e of t.rows) {
				let t = n.get(e.key);
				t.onsuccess = () => s.set(e.key, t.result), t.onerror = () => {
					l = !0;
				};
			}
		} catch (e) {
			try {
				i.abort();
			} catch {}
			u(e);
		}
	});
}
var rc = (e, t) => ec(e) ? e.schema === 1 && e.pendingIds === 0 && e.totalChars === t.totalChars && JSON.stringify(e.teams) === JSON.stringify(t.teams) && JSON.stringify(e.keys) === JSON.stringify(t.rows.map((e) => e.key)) && JSON.stringify(e.layout) === JSON.stringify(t.layout) : !1;
function ic(e, t) {
	if (e.schema !== 1 || !e.complete) throw Error("Registros de entrenamiento incompletos");
	let n = Object.create(null), r = /* @__PURE__ */ new Set();
	for (let i of e.teams) {
		let a = e.layout[i];
		if (!a || !ec(a.present) || !ec(a.order)) throw Error("Distribución de entrenamiento incompatible");
		let o = Object.create(null);
		for (let e of Fs) {
			if (a.present[e] !== !0) {
				if (a.present[e] !== !1 || $s(a.order, e)) throw Error("Campo de entrenamiento ausente e inconsistente");
				continue;
			}
			let n = a.order[e];
			if (!Array.isArray(n)) throw Error("Orden histórico no disponible");
			let s = [];
			for (let a of n) {
				if (typeof a != "string" || r.has(a)) throw Error("Clave repetida o inválida");
				r.add(a);
				let n;
				try {
					n = JSON.parse(a);
				} catch {
					throw Error("Clave de entrenamiento inválida");
				}
				if (!Array.isArray(n) || n.length !== 3 || n[0] !== i || n[1] !== e || typeof n[2] != "string" || !n[2]) throw Error("Clave de entrenamiento incompatible");
				let o = t.get(a);
				if (!o || o.key !== a || o.teamId !== i || o.field !== e || typeof o.dataJson != "string") throw Error("Registro de entrenamiento ausente");
				let c = JSON.parse(o.dataJson);
				if (!ec(c)) throw Error("Registro de entrenamiento no válido");
				s.push(c);
			}
			Object.defineProperty(o, e, {
				value: s,
				enumerable: !0
			});
		}
		if (a.present.meta === !0) {
			let e = JSON.stringify([
				i,
				"meta",
				"singleton"
			]);
			if (r.has(e)) throw Error("Metadatos duplicados");
			r.add(e);
			let n = t.get(e);
			if (!n || n.key !== e || n.teamId !== i || n.field !== "meta" || typeof n.dataJson != "string") throw Error("Metadatos de entrenamiento ausentes");
			Object.defineProperty(o, "meta", {
				value: JSON.parse(n.dataJson),
				enumerable: !0
			});
		} else if (a.present.meta !== !1) throw Error("Presencia de metadatos inválida");
		Object.defineProperty(n, i, {
			value: o,
			enumerable: !0
		});
	}
	if (r.size !== e.rows.length) throw Error("Hay registros sin correspondencia");
	return Object.freeze(n);
}
function ac(e, t) {
	let n = JSON.parse(e);
	if (!ec(n) || !ec(n.equiposData)) throw Error("Club original no válido");
	if (JSON.stringify(Object.keys(n.equiposData).sort()) !== JSON.stringify(t.teams)) throw Error("Los equipos originales no coinciden");
	let r = Object.create(null);
	for (let e of t.teams) {
		let t = n.equiposData[e];
		if (!ec(t)) throw Error("Equipo incompatible");
		let i = Object.create(null);
		for (let e of [...Fs, "meta"]) $s(t, e) && Object.defineProperty(i, e, {
			value: t[e],
			enumerable: !0
		});
		Object.defineProperty(r, e, {
			value: i,
			enumerable: !0
		});
	}
	return r;
}
async function oc(e) {
	if (!e?.factory || typeof e.factory.open != "function" || e.plan?.schema !== 1 || typeof e.originalRaw != "string") throw Error("Recuperación de entrenamientos no disponible");
	let { plan: t } = e;
	if (!t.complete) return tc("incomplete", t);
	try {
		if (JSON.stringify(ac(e.originalRaw, t)).length > 6e6) throw Error("Datos originales excesivos");
	} catch {
		return tc("different", t);
	}
	let n = await qs(e.factory);
	if (!n) return tc("missing", t);
	try {
		let r = await nc(n, t);
		if (!rc(r.manifest, t) || JSON.stringify([...r.keys].sort()) !== JSON.stringify(t.rows.map((e) => e.key).sort())) return tc("different", t);
		for (let e of t.rows) {
			let n = r.rows.get(e.key);
			if (n?.key !== e.key || n?.teamId !== e.teamId || n?.field !== e.field || n?.dataJson !== e.dataJson) return tc("different", t);
		}
		try {
			let n = ic(t, r.rows), i = ac(e.originalRaw, t);
			if (JSON.stringify(n) !== JSON.stringify(i)) return tc("different", t);
			let a = JSON.stringify({
				schema: "volley-coach-training-backup",
				version: 1,
				scope: "entrenamientos",
				authoritative: !1,
				exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
				teams: n
			});
			if (a.length > 65e5) throw Error("Exportación de entrenamiento demasiado grande");
			return tc("ready", t, t.rows.length, a);
		} catch {
			return tc("incompatible", t);
		}
	} finally {
		n.close();
	}
}
// src/state/training-shadow-cold-recovery.ts
var sc = "vc20574-training-cold-check-once", cc = "vc-training-cold-v1", lc = 864e5, uc = (e, t = 0) => Object.freeze({
	status: e,
	records: t,
	readOnly: !0,
	authoritative: !1
});
function dc(e, t) {
	if (typeof e != "string" || e.length > 512 || !Number.isSafeInteger(t)) return { status: "invalid" };
	let n;
	try {
		n = JSON.parse(e);
	} catch {
		return { status: "invalid" };
	}
	if (!n || typeof n != "object" || Array.isArray(n)) return { status: "invalid" };
	let r = n;
	return r.schema !== cc || !Number.isSafeInteger(r.createdAt) || !Number.isSafeInteger(r.records) || Number(r.records) < 0 || Number(r.records) > 2e4 || typeof r.digest != "string" || !/^[a-f0-9]{64}$/.test(r.digest) ? { status: "invalid" } : Number(r.createdAt) > t || t - Number(r.createdAt) > lc ? { status: "expired" } : {
		status: "valid",
		ticket: r
	};
}
async function fc(e) {
	if (!Number.isSafeInteger(e.now)) throw Error("Fecha de comprobación inválida");
	let t = Ws(e.raw, "training-cold-prepare"), n = await oc({
		factory: e.factory,
		plan: t,
		originalRaw: e.raw
	});
	if (n.status !== "ready") throw Error("Réplica de entrenamientos sin verificar: " + n.status);
	let r = await Ss(e.raw, e.subtle);
	return JSON.stringify({
		schema: cc,
		createdAt: e.now,
		digest: r,
		records: n.records
	});
}
async function pc(e) {
	let t = dc(e.ticket, e.now);
	if (t.status !== "valid") return uc(t.status);
	let n;
	try {
		n = Ws(e.raw, "training-cold-verify");
	} catch {
		return uc("different");
	}
	if (!n.complete) return uc("incomplete");
	if (n.rows.length !== t.ticket.records || await Ss(e.raw, e.subtle) !== t.ticket.digest) return uc("different");
	let r = await oc({
		factory: e.factory,
		plan: n,
		originalRaw: e.raw
	});
	return uc(r.status === "ready" ? "verified" : r.status, r.records);
}
// src/state/training-shadow-runtime.ts
var mc = "volley-coach-training-shadow-20.5.72", hc = "volleyCoachStateV43", gc = /* @__PURE__ */ new WeakMap(), _c = 0, vc = () => `training-${Date.now().toString(36)}-${(++_c).toString(36)}`;
function yc(e) {
	let t = e.document, n = t?.getElementById("vc20572-arm-training"), r = t?.getElementById("vc20572-pause-training"), i = t?.getElementById("vc20572-check-training"), a = t?.getElementById("vc20572-erase-training"), o = t?.getElementById("vc20573-export-training"), s = t?.getElementById("vc20573-export-status"), c = t?.getElementById("vc20574-prepare-training-cold"), l = t?.getElementById("vc20574-verify-training-cold"), u = t?.getElementById("vc20574-cancel-training-cold"), d = t?.getElementById("vc20574-training-cold-status"), f = t?.getElementById("vc20572-training-status");
	if (!n || !r || !i || !a || !f) return null;
	let p = gc.get(e);
	if (p) return p;
	let m = !1;
	try {
		m = typeof e.indexedDB?.open == "function" && typeof e.indexedDB?.deleteDatabase == "function" && typeof e.localStorage?.getItem == "function";
	} catch {}
	let h = e.navigator?.locks, g = m && typeof h?.request == "function", _ = g && typeof e.crypto?.subtle?.digest == "function" && typeof e.localStorage?.setItem == "function" && typeof e.localStorage?.removeItem == "function", v = !1, y = !1, b = !1, x = !1, S = !1, C = !1, w = !1, T = null, E = null, D = null, O = null, k = (e) => {
		S || (f.textContent = e);
	}, A = (e) => {
		!S && s && (s.textContent = e), k(e);
	}, j = (e) => {
		!S && d && (d.textContent = e), k(e);
	}, M = () => {
		try {
			return e.localStorage.getItem(sc);
		} catch {
			return null;
		}
	}, N = () => {
		n.disabled = !g || v || y || C || w || !!T || !!E || S, r.disabled = !v || S, i.disabled = !m || S || C || w, a.disabled = !g || S || C || w, o && (o.disabled = !g || S || C || w || y);
		let e = !_ || S || w || C || y;
		c && (c.disabled = e || !!M()), l && (l.disabled = e || !M()), u && (u.disabled = e || !M());
	}, P = () => {
		let t = e.localStorage.getItem(hc);
		if (!t) throw Error("No existe un guardado local confirmado");
		if (t.startsWith("VC-LZW16-1:")) {
			let n = e.VC_STORAGE_QUOTA_1531?.unpack;
			if (typeof n != "function") throw Error("No se puede verificar el estado compacto");
			return n(t);
		}
		return t;
	}, F = async () => {
		for (; x || b || O;) O ? await O : await new Promise((e) => setTimeout(e, 0));
	}, I = () => E || (E = (async () => {
		await F();
		let e = T;
		T = null, e?.release(), e && await e.released, E = null, N();
	})(), E), L = async () => {
		await F(), E && await E;
	}, R = () => {
		v = !1, y = !1, D = null, N(), I(), k(b ? "Copia detenida. La operación ya iniciada finalizará antes de liberar el bloqueo." : "Copia de entrenamientos desactivada. El guardado original continúa activo.");
	}, ee = async () => {
		if (!(b || S || !v)) {
			b = !0;
			try {
				for (; v && D !== null;) {
					let t = D;
					if (D = null, P() !== t) throw Error("El club cambió antes de escribir");
					let n = Ws(t, vc());
					if (!n.complete) throw Error(`Entrenamientos sin identidad: ${n.pendingIds}`);
					let r = await Xs({
						factory: e.indexedDB,
						plan: n
					});
					if (P() !== t) throw Error("El club cambió durante la comparación");
					k(`Copia verificada: ${r.records} registros de entrenamiento; ${r.added} nuevos, ${r.changed} modificados, ${r.removed} eliminados de la réplica. El club original no cambia.`);
				}
			} catch {
				v = !1, D = null, k("Copia detenida: IDs ausentes o duplicados, datos modificados o fallo de IndexedDB. No se ha modificado el club. Comprueba el guardado principal antes de continuar.");
			} finally {
				b = !1, O = null, N(), v || I();
			}
		}
	}, te = () => {
		x || b || S || !v || (x = !0, setTimeout(() => {
			x = !1, v && !S && (O = ee());
		}, 0));
	}, ne = (e) => {
		v && !S && (typeof e != "string" || !e || e.length > 12e6 ? (R(), k("Copia detenida: guardado principal fuera de los límites de ensayo.")) : (D = e, te()));
	}, re = async () => {
		if (!g || S || v || y || T || E || C || w) throw Error("Copia de entrenamientos no disponible o bloqueada");
		let e = P(), t = Ws(e, vc());
		if (!t.complete) throw Error(`Hay ${t.pendingIds} entrenamientos con IDs pendientes`);
		y = !0, N();
		try {
			let t = await Q(h, mc);
			if (!t) throw Error("Otra pestaña usa la copia de entrenamientos");
			if (S || !y) {
				t.release(), await t.released;
				return;
			}
			if (T = t, P() !== e) throw Error("El club cambió mientras se solicitaba el bloqueo");
			v = !0, k("Guardando entrenamientos en paralelo. Solo lectura para la aplicación."), ne(e);
		} catch (e) {
			if (v = !1, D = null, T) {
				let e = T;
				T = null, e.release(), await e.released;
			}
			throw e;
		} finally {
			y = !1, N();
		}
	}, ie = async () => {
		if (!m || S || C || w) throw Error("Inspección no disponible");
		await F();
		let t = P(), n = Ws(t, vc()), r = await Zs({
			factory: e.indexedDB,
			plan: n
		});
		if (P() !== t) return k("El club cambió durante la lectura: repite la prueba."), Object.freeze({
			...r,
			status: "different"
		});
		let i = {
			verified: `Coinciden ${r.records} registros con el último guardado local; no implica sincronización entre dispositivos.`,
			missing: "Todavía no existe réplica de entrenamientos.",
			different: "La réplica y los entrenamientos guardados no coinciden. No se restauró nada.",
			incomplete: `Hay ${r.pendingIds} registros sin identidad fiable; no se escribió ni certificó la réplica.`
		};
		return k(i[r.status]), r;
	}, z = async () => {
		if (!g || S || C || w) throw Error("Borrado no disponible");
		R(), await L();
		let t = await Q(h, mc);
		if (!t) throw Error("Otra pestaña tiene activada la réplica");
		try {
			let t = await Qs(e.indexedDB);
			return k("Eliminada solo la réplica de entrenamientos. El club original, el vídeo y el scouting siguen intactos."), t;
		} finally {
			t.release(), await t.released;
		}
	}, B = async () => {
		if (!g || S || C || y || w) throw Error("Exportación no disponible");
		C = !0, N();
		try {
			R(), await L();
			let t = await Q(h, mc);
			if (!t) throw Error("Otra pestaña tiene activada la copia de entrenamientos");
			try {
				let t = P(), n = Ws(t, vc()), r = await oc({
					factory: e.indexedDB,
					plan: n,
					originalRaw: t
				});
				if (P() !== t) return A("El club original cambió durante la reconstrucción: se ha cancelado la descarga."), Object.freeze({
					...r,
					status: "different",
					json: void 0
				});
				let i = {
					ready: `Exportación verificada: ${r.records} registros de entrenamiento coinciden exactamente con el último guardado local. La descarga no modifica el club.`,
					missing: "No existe réplica de entrenamientos para exportar. Actívala y compruébala primero.",
					different: "La réplica o su orden difieren del guardado principal. No se permite descargar datos antiguos.",
					incomplete: `Exportación bloqueada: ${r.pendingIds} registros sin identidad estable. No se inventan IDs.`,
					incompatible: "No se pudo reconstruir de forma íntegra la copia: datos o estructura incompatibles."
				};
				return A(i[r.status]), r;
			} finally {
				t.release(), await t.released;
			}
		} finally {
			C = !1, N();
		}
	}, V = async () => {
		if (!_ || S || w || C || y || M()) throw Error("Prueba pendiente o no disponible");
		w = !0, N();
		try {
			R(), await L();
			let t = await Q(h, mc);
			if (!t) throw Error("Otra pestaña utiliza la réplica de entrenamientos");
			try {
				let t = P(), n = await fc({
					raw: t,
					factory: e.indexedDB,
					subtle: e.crypto.subtle,
					now: Date.now()
				});
				if (P() !== t) throw Error("El club cambió durante la comprobación");
				if (M()) throw Error("Ya existe otra prueba pendiente");
				e.localStorage.setItem(sc, n), j("Prueba preparada. Cierra todas las pestañas y vuelve a abrir Volley Coach; después pulsa «Verificar». El marcador no contiene entrenamientos.");
			} finally {
				t.release(), await t.released;
			}
		} finally {
			w = !1, N();
		}
	}, ae = async () => {
		if (!_ || S || w || C || y || !M()) throw Error("No existe una prueba pendiente");
		w = !0, N();
		try {
			R(), await L();
			let t = await Q(h, mc);
			if (!t) throw Error("Otra pestaña utiliza la réplica; se conserva el marcador");
			try {
				let t = M();
				if (!t) throw Error("Desapareció la prueba pendiente");
				let n = P(), r = await pc({
					ticket: t,
					raw: n,
					factory: e.indexedDB,
					subtle: e.crypto.subtle,
					now: Date.now()
				});
				P() !== n && (r = Object.freeze({
					...r,
					status: "different"
				})), M() === t && e.localStorage.removeItem(sc);
				let i = {
					verified: `Verificación posterior a la reapertura: ${r.records} registros coinciden. No demuestra resistencia a un apagón o cierre forzado.`,
					missing: "No existe ya la réplica de entrenamientos. No se ha restaurado nada.",
					different: "Los entrenamientos del guardado original ya no coinciden. No se ha restaurado nada.",
					incomplete: "La comprobación no puede certificarse: faltan IDs estables.",
					incompatible: "La réplica no puede reconstruirse íntegramente; no se ha restaurado nada.",
					expired: "Marcador caducado. Prepara una prueba nueva.",
					invalid: "Marcador inválido. No se ha modificado el club."
				};
				return j(i[r.status]), r;
			} finally {
				t.release(), await t.released;
			}
		} finally {
			w = !1, N();
		}
	}, H = async () => {
		if (!_ || S || w || C || y) throw Error("Cancelación no disponible");
		e.localStorage.removeItem(sc), j("Prueba cancelada: solo se eliminó el marcador. No se borraron entrenamientos ni copias."), N();
	}, oe = () => {
		e.confirm("Esta prueba creará una copia local adicional de los entrenamientos. ¿Has descargado antes una copia JSON completa y quieres activarla solo durante esta sesión?") && re().catch((e) => k(`No se activó la réplica: ${e instanceof Error ? e.message : "revisa los IDs y las pestañas"}.`));
	}, se = () => R(), ce = () => {
		ie().catch(() => k("No se pudieron comprobar los entrenamientos. El club no se modificó."));
	}, le = () => {
		e.confirm("¿Eliminar SOLO la base experimental de entrenamientos? El club real y la copia de jugadores no se tocarán.") && z().catch(() => k("No se eliminó la réplica. Comprueba que las otras pestañas estén cerradas."));
	}, ue = () => {
		e.confirm("Esta exportación contiene información de sesiones y posibles datos personales de participantes. ¿Descargar una copia JSON verificada y guardarla en un lugar protegido?") && B().then((e) => {
			if (e.status !== "ready" || !e.json) return;
			let n = new Blob([e.json], { type: "application/json;charset=utf-8" }), r = URL.createObjectURL(n);
			try {
				let e = t.createElement("a");
				e.href = r, e.download = "Volley_Coach_Entrenamientos_" + (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) + ".json", e.click();
			} finally {
				setTimeout(() => URL.revokeObjectURL(r), 1e3);
			}
		}).catch(() => A("La exportación no pudo verificarse. No se ha descargado ni modificado ningún entrenamiento."));
	}, de = () => {
		e.confirm("La prueba guardará solo una huella digital y el número de entrenamientos. ¿Prepararla para verificar tras cerrar y volver a abrir la aplicación?") && V().catch((e) => j(`No se preparó la prueba: ${e instanceof Error ? e.message : "fallo al verificar"}.`));
	}, fe = () => {
		ae().catch((e) => j(`Prueba detenida: ${e instanceof Error ? e.message : "no se pudo verificar"}. El marcador se conserva si la base estaba bloqueada.`));
	}, pe = () => {
		H().catch(() => j("No se pudo cancelar la prueba."));
	}, me = (e) => {
		e.key === hc && (v || y) && (R(), k("Copia detenida: otra pestaña modificó el guardado principal. Comprueba antes de reactivarla."));
	}, he = () => {
		(v || y) && R();
	};
	n.addEventListener("click", oe), r.addEventListener("click", se), i.addEventListener("click", ce), a.addEventListener("click", le), o?.addEventListener("click", ue), c?.addEventListener("click", de), l?.addEventListener("click", fe), u?.addEventListener("click", pe), e.addEventListener?.("storage", me), e.addEventListener?.("pagehide", he);
	let ge = Object.freeze({
		VERSION: "20.5.72",
		manualOnly: !0,
		authoritative: !1,
		enabled: () => v,
		arm: re,
		pause: R,
		onConfirmedWrite: ne,
		inspect: ie,
		erase: z,
		backup: B,
		prepareCold: V,
		verifyCold: ae,
		cancelCold: H,
		whenIdle: L,
		dispose() {
			S || (R(), S = !0, n.removeEventListener("click", oe), r.removeEventListener("click", se), i.removeEventListener("click", ce), a.removeEventListener("click", le), o?.removeEventListener("click", ue), c?.removeEventListener("click", de), l?.removeEventListener("click", fe), u?.removeEventListener("click", pe), e.removeEventListener?.("storage", me), e.removeEventListener?.("pagehide", he), N(), gc.delete(e), e.VC_TRAINING_SHADOW_20572 === ge && delete e.VC_TRAINING_SHADOW_20572);
		}
	});
	return gc.set(e, ge), e.VC_TRAINING_SHADOW_20572 = ge, k(g ? "Réplica de entrenamientos apagada. Requiere IDs únicos y activación manual." : "Para escribir la réplica se necesitan IndexedDB y Web Locks. No se activa automáticamente."), d && (d.textContent = M() ? "Hay una prueba pendiente. Pulsa «Verificar tras volver a abrir» o cancélala." : "Sin prueba pendiente. Primero activa, comprueba y prepara la réplica."), N(), ge;
}
// src/training/planning-core.ts
function bc(e = /* @__PURE__ */ new Date()) {
	let t = new Date(e);
	return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}
function xc(e) {
	let t = new Date(e), n = (t.getDay() + 6) % 7;
	return t.setDate(t.getDate() - n), t.setHours(0, 0, 0, 0), t;
}
function Sc(e) {
	return (e || []).reduce((e, t) => e + (Number(t.tiempo) || 0), 0);
}
function Cc(e, t, n) {
	return e.realizado ? {
		clase: "done",
		texto: "Realizado"
	} : Number(t) === Number(e.id) ? {
		clase: "editing",
		texto: "En edición"
	} : e.historialId ? {
		clase: "pending",
		texto: "En Historial · pendiente de marcar"
	} : e.fecha !== void 0 && e.fecha !== null && e.fecha <= n ? {
		clase: "pending",
		texto: "Pendiente"
	} : {
		clase: "future",
		texto: "Planificado"
	};
}
// src/training/planning-runtime.ts
var wc = /* @__PURE__ */ new WeakMap();
function Tc(e) {
	let t = wc.get(e);
	if (t) return t;
	let n = Object.freeze({
		VERSION: "20.5.74",
		pureOnly: !0,
		classifyPlan: Cc,
		formatLocalDate: bc,
		startOfWeek: xc,
		totalMinutes: Sc
	});
	return wc.set(e, n), e.VC_TRAINING_PLANNING_20574 ||= n, n;
}
// src/domain/rally-shadow-runtime.ts
function Ec(e) {
	let t = e.document, n = t.getElementById("v11-management");
	if (!n) return null;
	if (e.VC_SHADOW_20515) return e.VC_SHADOW_20515;
	let r = Bi();
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
var Dc = "20.1.2", Oc = "vc-multi-device-validation", kc = (e) => String(e ?? "").trim(), Ac = (e) => {
	let t = Number(e);
	return Number.isSafeInteger(t) && t >= 0 ? t : 0;
}, jc = (e) => {
	let t = kc(e);
	return /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/.test(t) && Number.isFinite(Date.parse(t)) ? t : "";
};
function Mc({ cloud: t = {}, device: n = {}, journal: r = {}, now: i = Date.now() } = {}) {
	let a = e(t) || {}, o = e(n) || {}, s = e(r) || {};
	return {
		schema: Oc,
		version: Dc,
		createdAt: new Date(i).toISOString(),
		connected: !!a.connected,
		dirty: !!a.dirty,
		blocked: !!a.blockedReason,
		realtimeSubscribed: o.realtimeState === "SUBSCRIBED",
		lastReadAt: Ac(a.lastReadAt),
		lastWriteAt: Ac(a.lastWriteAt),
		lastReadErrorAt: Ac(a.lastReadErrorAt),
		lastObservedRemoteStamp: jc(a.lastObservedRemoteStamp),
		lastAppliedRemoteStamp: jc(a.lastAppliedRemoteStamp),
		lastConfirmedWriteStamp: jc(a.lastConfirmedWriteStamp),
		pendingJournal: typeof s.pendingCount == "number" ? Ac(s.pendingCount) : null,
		journalError: !!s.lastError,
		warning: "Mismo origen y cuenta deben comprobarse manualmente. La igualdad de marcas CAS no verifica contenido ni entrega de vídeo."
	};
}
function Nc(t) {
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
	return Mc({
		cloud: n,
		device: { realtimeState: n.realtimeSubscribed ? "SUBSCRIBED" : "" },
		journal: {
			pendingCount: n.pendingJournal,
			lastError: n.journalError
		},
		now: Date.parse(String(n.createdAt))
	});
}
function Pc(e, t) {
	let n = Nc(e), r = Nc(t), i = (e) => e.connected && !e.dirty && !e.blocked && !e.journalError && e.pendingJournal === 0;
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
var Fc = /* @__PURE__ */ new WeakMap(), Ic = Object.freeze({
	VERSION: Dc,
	SCHEMA: Oc,
	report: Mc,
	parseReport: Nc,
	compareReports: Pc,
	mount: Rc
});
function Lc(e) {
	return e.VC_SYNC_2012 = Ic, Ic;
}
function Rc(e) {
	let t = Fc.get(e);
	if (t) return t;
	let n = e.document;
	if (!n) return null;
	let r = (e) => n.getElementById(e), i = (e, t = "") => {
		let r = n.createElement(e);
		return r.textContent = t, r;
	}, a = null, o = !1, s = !1, c = !1, l = null, u = "", d = null, f = async () => {
		let t = e.VC_V962_CLOUD_EFFICIENT?.diagnostics?.() || {}, n = e.VC_DEVICE_SYNC?.diagnostics?.() || {}, r = e.VC_V962_CLOUD_EFFICIENT?.getAccountId?.() || "";
		return Mc({
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
				let n = l ? Pc(e, l) : null, i = r("vc2012-feedback");
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
					l = Nc(await t.text()), u = "Informe del segundo dispositivo cargado para comparar.";
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
			s || (s = !0, S && n.removeEventListener("DOMContentLoaded", x), d?.disconnect(), d = null, e.removeEventListener("vc200:sync-state", y), e.removeEventListener("vc2011:journal", y), n.removeEventListener("click", b, !0), r("vc2012-refresh")?.removeEventListener("click", m), r("vc2012-export")?.removeEventListener("click", g), r("vc2012-file")?.removeEventListener("change", _), o && a?.remove(), a = null, l = null, Fc.delete(e));
		}
	});
	return Fc.set(e, C), C;
}
// src/domain/journal-recovery-inspector.ts
var zc = 27262976, $ = (e, t) => Object.freeze({
	version: "20.5.19",
	source: "existing-v2011-pending-checkpoint",
	status: e,
	pendingCount: t,
	requiresManualReview: !0,
	autoResumeAllowed: !1
});
async function Bc(n) {
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
		if (!c || c.accountId !== r || c.status !== "pending" || c.mode !== "draft" && c.mode !== "upload" || typeof c.stateJson != "string" || c.stateJson.length === 0 || c.stateJson.length > zc) return $("unavailable", s);
		let l = e(e(e(JSON.parse(c.stateJson))?.equiposData)?.[i]);
		if (!l || !Array.isArray(l.scoutingMatches)) return $("missing-match", s);
		let u = t(l.scoutingMatches).map(e).filter((e) => e && String(e.id) === String(n.matchId));
		if (u.length !== 1) return $(u.length ? "ambiguous" : "missing-match", s);
		let d = qi(Wi(n.before), Wi(n.after), Wi(u[0]));
		return $(d === "durable-before" ? "checkpoint-before" : d === "durable-after" ? "checkpoint-after" : d === "unchanged-observed" ? "checkpoint-unchanged" : d === "divergent" ? "checkpoint-divergent" : "unavailable", s);
	} catch {
		return $("unavailable", a);
	}
}
// src/vc2055-entry.ts
if (typeof window < "u" && window.document) {
	Tc(window), Pn(window), Hn(window), Gn(window), Zn(window), ar(window), mr(window), _r(window), Sr(window), Er(window), Nr(window), Ir(window), Ur(window), Zr(window), ei(window), li(window), fi(window), hi(window), vi(window), Si(window), Ti(window), Oi(window), ta(window), ca(window), fa(window), ba(window), Ca(window), Oa(window), Na(window), Lc(window), Ae(window), en(window), ln(window), mn(window), at(window), ht(window), Gt(window), Xt(window);
	let e = () => {
		ge(window), Xe(window), ot(window), D(window), N(window), le(window), ue(window), Me(window), qe(window), Ec(window), Rc(window), io(window), go(window), No(window), Ko(window), Ns(window), yc(window);
	};
	window.document.readyState === "loading" ? window.document.addEventListener("DOMContentLoaded", e, { once: !0 }) : e();
}
export { Ka as CLUB_PILOT_DB, Fa as MAX_CLUB_PARTITION_CHARS, za as MAX_ENTITY_ROWS, Et as MAX_INDEXED_CONTACTS, ma as MAX_LOCAL_MATCH_CHARS, ha as MAX_PACKED_STATE_CHARS, Dn as MAX_SEQUENCE_CHARACTERS, On as MAX_SEQUENCE_CONTACTS, pa as MAX_STORED_STATE_CHARS, Es as PLAYER_COLD_REOPEN_KEY, _s as PLAYER_REOPEN_TICKET_KEY, qo as PLAYER_SHADOW_DB, ds as PLAYER_SHADOW_LOCK, un as RALLY_SEARCH_PRESETS_KEY, $i as RALLY_WRITER_VERSION, Ze as SEARCH_FILTERS, sc as TRAINING_COLD_REOPEN_KEY, Fs as TRAINING_FIELDS, Ps as TRAINING_SHADOW_DB, mc as TRAINING_SHADOW_LOCK, wn as applyScoutingDraftRating, Cn as applyScoutingDraftSkill, ia as assembleClosedRally, aa as assembleRestoredLiveRally, l as attackEfficiency, ce as auditCommittedMatch, o as auditMatchScores, wr as buildScoutCodeV830, vr as buildScoutingActionBase, Vt as calculateAnalysisPoints, C as canonicalReaders, _a as captureLocalMatchSnapshot, Wi as captureRecoveryFrame, on as catalogRallySearch, Gi as changedRecoveryAreas, ua as classifyLocalSaveReceipt, j as classifyPreflight, qi as classifyRecoveryEvidence, Bn as classifyScoutingPreflight, se as classifyStoredAction, Cc as classifyTrainingPlan, Li as compareConfirmedPoint, Pc as compareDeviceValidation, y as compareNativeCode, he as createObservableMatchStore, Bi as createRallyShadowSession, Qi as createRallyTransactionPilot, je as createReadOnlyRenderGate, Ye as createScoutingProjectionStore, M as createShadowSession, Tn as cycleScoutingDraftRating, us as deletePlayerShadow, Qs as deleteTrainingShadow, Ss as digestOriginalClub, Ki as equalRecoveryFrames, qt as escapeAnalysisCSVCell, Bt as evaluateAnalysisContacts, Jt as exportAnalysisCSV, zt as filterAnalysis, jr as finishScoutingCode, bc as formatTrainingLocalDate, Ht as inspectAnalysisCoverage, Nt as inspectAnalysisIndexDiagnostics, ie as inspectClosedRally, xo as inspectClubEntityRecovery, v as inspectCodeShape, Bc as inspectJournalRecovery, Te as inspectLiveSetStatistics, E as inspectMatchDomain, Jn as inspectNativePreparation, Ke as inspectPlayerBoxscore, ls as inspectPlayerShadow, I as inspectRallyRestoration, Un as inspectRegistrationConditions, Mn as inspectScoutingSequence, S as inspectSubstitution, Zs as inspectTrainingShadow, Xt as installAnalysisExportBridge, ht as installAnalysisNormalizeBridge, Gt as installAnalysisOperationsBridge, at as installAnalysisQueryBridge, en as installAnalysisViewBridge, Oa as installClubLocalStoreBridge, Na as installClubSnapshotBridge, ta as installLiveRallyWriterBridge, ba as installLocalReadbackBridge, fa as installLocalSaveReceiptBridge, Oi as installMatchFinalizationBridge, Si as installMatchManualResultBridge, vi as installMatchVideoOverlayBridge, Lc as installMultiDeviceAPI, ca as installRallyRecordBridge, mn as installRallySearchControls, ln as installRallySearchViewBridge, Ti as installRallyVideoBoundsBridge, Gn as installRegistrationGuardBridge, Ae as installRenderMetricsBridge, Sr as installScoutActionBuilderBridge, Ur as installScoutActionMetadataBridge, Zr as installScoutActionNormalizerBridge, li as installScoutAdvancedFieldsBridge, Nr as installScoutCodeBuilderBridge, Er as installScoutCodeFormatBridge, fi as installScoutIdentityFieldsBridge, Ca as installScoutIndexedJournalBridge, hi as installScoutMatchVideoContainerBridge, _r as installScoutPlayerResolverBridge, Ir as installScoutRegistrationBridge, ei as installScoutTacticalFieldsBridge, Pn as installScoutingDraftBridge, mr as installScoutingExtensionsBridge, ar as installScoutingLexerBridge, Hn as installScoutingPreflightBridge, Zn as installScoutingPreparationBridge, Tc as installTrainingPlanningBridge, Mt as invalidateAnalysisIndex, rr as lexScoutingCode, ot as mountAnalysisQueryPerformance, go as mountClubEntityPanel, io as mountClubPilotPanel, No as mountClubRecoveryPanel, Ko as mountClubRehydrationPanel, le as mountCommittedPanel, D as mountDomainDiagnostic, ue as mountGrammarPanel, Me as mountLiveStatisticsPanel, Rc as mountMultiDevicePanel, ge as mountObservablePanel, qe as mountPlayerBoxscore, Ns as mountPlayerShadowPanel, Ec as mountRallyShadowPanel, Xe as mountScoutingProjectionStore, N as mountShadowPanel, yc as mountTrainingShadowPanel, s as nextRotation, Vr as normalizeActionVideoTimestamp, si as normalizeAdvancedScoutingFields, pt as normalizeAnalysisMatch, dt as normalizeAnalysisZone, Cr as normalizeContactMetadata, Ei as normalizeMatchFinalizationFields, bi as normalizeMatchManualResult, gi as normalizeMatchVideoOverlay, tt as normalizeRallySearchFilters, Ci as normalizeRallyVideoBounds, Yr as normalizeScoutingActionBase, ui as normalizeScoutingIdentityFields, pi as normalizeScoutingMatchVideoContainer, Qr as normalizeTacticalActionFields, br as opponentScoutingPlayerFields, yr as ownScoutingPlayerFields, Nc as parseDeviceValidation, Cs as parsePlayerReopenTicket, xn as parseScoutingDraftHead, dc as parseTrainingColdTicket, fo as pilotClubEntityDelta, $a as pilotClubPartitions, ne as planAwardPoint, Wa as planClubEntities, X as planClubPartitions, ts as planPlayerShadow, Ws as planTrainingShadow, re as planUndoLastRally, Pr as prepareContactRegistration, Yn as prepareNativeScoutingAction, Ds as preparePlayerColdReopen, ws as preparePlayerReopenTicket, gs as preparePlayerShadowBackup, Ar as prepareScoutingCodeInput, fc as prepareTrainingColdReopen, oc as prepareTrainingShadowBackup, Oo as previewHistoricIds, zr as projectDataVolleyFields, me as projectObservableMatch, c as projectPoint, F as projectSetBoundary, nt as queryRallies, Br as readActionVideoTime, T as readCanonicalLiveActions, w as readCanonicalMatch, fn as readRallySearchPresets, En as recentScoutingDraftCodes, Ut as reconcileAnalysisPoints, Vo as reconstructClubEntityFields, hs as reconstructPlayersForBackup, ic as reconstructTrainingsForBackup, Ho as rehearseClubEntityRecovery, ko as rehearseHistoricIds, eo as removeClubPilot, Qt as renderDataEngineView, sn as renderRallySearchView, Mc as reportDeviceValidation, hr as resolveOwnScoutingPlayer, Ga as sameClubEntityData, Ra as sameClubPartitionPlan, oa as sameRallyRecord, fr as scanAdvancedExtension, dr as scanConeExtension, ur as scanSubzoneExtension, ja as serializeClubIndependentLibrary, Aa as serializeClubSnapshot, u as sideOutBreakPoint, xc as startOfTrainingWeek, Sc as totalTrainingMinutes, Q as tryAcquirePlayerShadowLock, Os as verifyPlayerColdReopen, Ts as verifyPlayerReopenTicket, a as verifyRallyScore, va as verifyStoredLocalMatch, pc as verifyTrainingColdReopen, Ea as writeClubLocalState, cs as writePlayerShadow, xa as writeScoutJournalTransaction, Xs as writeTrainingShadow };
