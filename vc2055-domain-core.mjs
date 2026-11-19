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
// src/domain/runtime.ts
function C(n) {
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
function w(e) {
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
	let g = () => {
		for (let t of [
			e.MatchState,
			e.VC_SCOUT_VIDEO_BRIDGE,
			e.VC_SCOUT_REPORT_BRIDGE
		]) try {
			let e = t?.getActive?.();
			if (e) return e;
		} catch {}
		return null;
	}, _ = () => C(g()), y = (e) => e === null ? "—" : `${e}%`, b = () => {
		let e = _();
		l.textContent = e.matchAvailable ? "Datos del partido original examinados" : "Sin partido activo", i.dataset.state = e.matchAvailable ? "available" : "waiting";
		let t = {
			verified: String(e.score.verified),
			inconsistent: String(e.score.inconsistent),
			unknown: String(e.score.unknown),
			rotation: e.rotation,
			so: y(e.sideOutPct),
			bp: y(e.breakPointPct),
			attack: y(e.attackEfficiencyPct)
		};
		for (let [e, n] of Object.entries(t)) {
			let t = f.get(e);
			t && t.textContent !== n && (t.textContent = n);
		}
	}, x = !1, w = !1, T = () => {
		w || x || !n.classList.contains("active") || (x = !0, Promise.resolve().then(() => {
			x = !1, w || b();
		}));
	};
	p.addEventListener("click", b);
	let E = () => {}, D = !1;
	if (e.VC_STATE_2059) {
		let t = [
			e.VC_STATE_2059.subscribe("score", T),
			e.VC_STATE_2059.subscribe("court", T),
			e.VC_STATE_2059.subscribe("rally", T),
			e.VC_STATE_2059.subscribe("status", T)
		];
		E = () => t.forEach((e) => e());
	} else {
		D = !0, t.addEventListener("vc:matchstatechange", T);
		try {
			let t = e.MatchState?.subscribe?.(T);
			typeof t == "function" && (E = t);
		} catch {}
	}
	let O = typeof MutationObserver == "function" ? new MutationObserver(T) : null;
	O?.observe(n, {
		attributes: !0,
		attributeFilter: ["class"]
	}), n.classList.contains("active") && b();
	let k = Object.freeze({
		version: "20.5.5",
		readOnly: !0,
		inspectCodeShape: v,
		inspectSubstitution: S,
		nextRotation: s,
		inspectCurrent: _,
		dispose() {
			w || (w = !0, O?.disconnect(), E(), D && t.removeEventListener("vc:matchstatechange", T), i.remove(), e.VC_DOMAIN_2055 === k && delete e.VC_DOMAIN_2055);
		}
	});
	return e.VC_DOMAIN_2055 = k, k;
}
// src/domain/shadow-validation.ts
var T = 80, E = (e) => e === "v800-code" ? "directo" : e === "v113-video-code" ? "video" : "otro", D = (e) => v(e);
function O(t) {
	let n = e(t), r = D(n?.code), i = E(n?.source), a = e(n?.nativeShape), o = {
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
function k() {
	let e = 0, t = 0, n = 0, r = 0, i = 0, a = 0, o = [];
	return Object.freeze({
		record(s) {
			let c = O(s);
			return e++, c.kind === "agree" ? t++ : c.kind === "difference" ? n++ : c.kind === "coverage-gap" ? r++ : c.kind === "native-reject" ? i++ : a++, c.kind !== "agree" && (o.push(c), o.length > T && o.shift()), c;
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
function A(e) {
	let t = e.document, n = t.getElementById("v11-management");
	if (!n) return null;
	if (e.VC_SHADOW_2056) return e.VC_SHADOW_2056;
	let r = k(), i = (e, n = "", r = "") => {
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
// src/domain/committed-audit.ts
var j = 2e4, ee = 6e4, te = 80, ne = /* @__PURE__ */ new Set([
	"S",
	"R",
	"E",
	"A",
	"B",
	"D",
	"F",
	"C"
]), M = (e) => typeof e == "string" && ne.has(e) ? e : "—", re = {
	difference: "El código guardado y los campos de la acción no coinciden.",
	"coverage-gap": "El código guardado utiliza sintaxis todavía no cubierta por TypeScript.",
	unverified: "Faltan campos del registro para comprobarlo con seguridad.",
	"no-code": "La acción está registrada sin código original.",
	score: "El ganador no concuerda con el cambio de marcador registrado.",
	"score-sequence": "El tanteo final y el inicial del siguiente rally no coinciden.",
	rotation: "La siguiente rotación o el turno de saque no concuerdan con la proyección básica."
};
function N(t) {
	let r = e(t), i = M(r?.skill);
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
		skill: M(o.skill) || i
	});
	if (!n(r.team) || !ne.has(String(r.skill)) || ![
		"#",
		"+",
		"!",
		"-",
		"/",
		"="
	].includes(String(r.evaluation)) || r.playerNumberSnapshot === null || r.playerNumberSnapshot === void 0 || String(r.playerNumberSnapshot).trim() === "") return Object.freeze({
		kind: "unverified",
		skill: M(o.skill)
	});
	let s = y(a, { action: r });
	return Object.freeze({
		kind: s.state === "agree" ? "agree" : s.state === "disagree" ? "difference" : "unverified",
		skill: M(o.skill)
	});
}
function P(o) {
	let s = e(o), l = {
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
	}, u = [], d = !1, f = (e, t, n = "—") => {
		u.push(Object.freeze({
			kind: e,
			location: t,
			skill: M(n),
			reason: re[e]
		})), u.length > te && u.shift();
	}, p = (e, t) => {
		if (l.actions >= ee) return d = !0, !1;
		l.actions++;
		let n = N(e);
		return n.kind === "agree" ? l.agree++ : n.kind === "difference" ? l.difference++ : n.kind === "coverage-gap" ? l.coverageGap++ : n.kind === "no-code" ? l.noCode++ : l.unverified++, n.kind !== "agree" && f(n.kind, t, n.skill), !0;
	}, m = t(s?.sets);
	main: for (let o = 0; o < m.length; o++) {
		let s = e(m[o]);
		if (!s) continue;
		let u = t(s.rallies);
		for (let s = 0; s < u.length; s++) {
			if (l.rallies >= j) {
				d = !0;
				break main;
			}
			let m = e(u[s]);
			if (!m) continue;
			l.rallies++;
			let h = `S${o + 1} · R${s + 1}`, g = a(m);
			g.state === "verified" ? l.scoreVerified++ : g.state === "inconsistent" ? (l.scoreInconsistent++, f("score", h)) : l.scoreUnknown++;
			for (let [e, n] of t(m.actions).entries()) if (!p(n, `${h} · A${e + 1}`)) break main;
			let _ = e(u[s + 1]);
			if (!_) continue;
			let v = i(m.scoreAfter), y = i(_.scoreBefore);
			if (v && y && (l.scoreLinksChecked++, (v.us !== y.us || v.opponent !== y.opponent) && (l.scoreLinksMismatch++, f("score-sequence", `${h} → R${s + 2}`))), n(m.winner) && n(m.servingBefore) && r(m.rotationBefore) && r(m.opponentRotationBefore) && r(_.rotationBefore) && r(_.opponentRotationBefore) && n(_.servingBefore)) {
				let e = c({
					score: m.scoreBefore,
					serving: m.servingBefore,
					rotationUs: m.rotationBefore,
					rotationOpponent: m.opponentRotationBefore
				}, m.winner);
				e.state === "projected" && (l.rotationsChecked++, (e.rotationUs !== _.rotationBefore || e.rotationOpponent !== _.opponentRotationBefore || e.serving !== _.servingBefore) && (l.rotationsMismatch++, f("rotation", `${h} → R${s + 2}`)));
			}
		}
	}
	if (!d && s) {
		for (let [n, r] of t(e(s.liveRally)?.actions).entries()) if (!p(r, `En curso · A${n + 1}`)) break;
	}
	return Object.freeze({
		version: "20.5.7",
		mode: "canonical-local-read-only",
		matchAvailable: !!s,
		truncated: d,
		counters: Object.freeze({ ...l }),
		recent: Object.freeze([...u]),
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
function F(t) {
	let n = t.document, r = n.getElementById("v11-management");
	if (!r) return null;
	if (t.VC_COMMITTED_2057) return t.VC_COMMITTED_2057;
	let i = (e, t = "", r = "") => {
		let i = n.createElement(e);
		return i.className = t, i.textContent = r, i;
	}, a = i("section", "vc2057-committed");
	a.id = "vc2057-committed";
	let o = i("div", "vc2057-heading"), s = i("div");
	s.append(i("small", "", "ACCIONES CONFIRMADAS · V20.5.7"), i("h3", "", "Auditoría del scouting registrado")), o.append(s, i("span", "", "Solo lectura"));
	let c = i("p", "", "Comprueba códigos ya presentes en el partido, puntuación y continuidad de rotaciones. No añade ni corrige jugadas."), l = i("p", "vc2057-status", "Pendiente de comprobar");
	l.setAttribute("role", "status");
	let u = i("div", "vc2057-stats"), d = /* @__PURE__ */ new Map();
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
		let n = i("div");
		n.append(i("small", "", t));
		let r = i("strong", "", "—");
		d.set(e, r), n.append(r), u.append(n);
	}
	let f = i("div", "vc2057-actions"), p = i("button", "", "Comprobar partido");
	p.setAttribute("type", "button");
	let m = i("button", "", "Descargar informe JSON");
	m.setAttribute("type", "button"), m.disabled = !0, f.append(p, m);
	let h = i("h4", "", "Incidencias que conviene revisar"), g = i("div", "vc2057-recent");
	a.append(o, c, l, u, f, h, g, i("p", "vc2057-note", "La lectura se realiza únicamente al pulsar «Comprobar partido». No valida la nube ni aplica reglas arbitrales completas. Los códigos y dorsales no aparecen en el informe."));
	let _ = n.getElementById("vc2056-shadow") || n.getElementById("vc2055-domain");
	_?.parentNode === r ? _.insertAdjacentElement("afterend", a) : r.insertAdjacentElement("afterbegin", a);
	let v = null, y = !1, b = !1, x = 0, S = () => {
		for (let n of [
			t.MatchState,
			t.VC_MATCH_STATE,
			t.VC_SCOUT_VIDEO_BRIDGE,
			t.VC_SCOUT_REPORT_BRIDGE
		]) try {
			let t = n?.getActive?.();
			if (e(t)) return t;
		} catch {}
		return null;
	}, C = () => {
		if (b) return;
		v ? y ? (l.textContent = "El partido ha cambiado. Repite la comprobación para actualizar el informe.", a.dataset.state = "stale") : v.matchAvailable ? v.truncated ? (l.textContent = "Comprobación parcial: se alcanzó el límite de seguridad.", a.dataset.state = "partial") : (l.textContent = "Acciones del estado local examinadas; no implica confirmación en nube.", a.dataset.state = v.counters.difference || v.counters.scoreInconsistent || v.counters.scoreLinksMismatch || v.counters.rotationsMismatch ? "review" : "available") : (l.textContent = "No hay un partido activo que comprobar.", a.dataset.state = "waiting") : (l.textContent = "Pendiente de comprobar", a.dataset.state = "waiting"), m.disabled = !v || y || !v.matchAvailable;
		for (let [e, t] of d) {
			let n = v?.counters[e], r = n === void 0 ? "—" : String(n);
			t.textContent !== r && (t.textContent = r);
		}
		g.replaceChildren();
		let e = v?.recent.slice(-8).reverse() || [];
		if (!e.length) g.append(i("p", "", v ? "Sin incidencias en los registros examinados." : "Ejecuta la comprobación para revisar el partido abierto."));
		else for (let t of e) {
			let e = i("div", "vc2057-finding");
			e.append(i("strong", "", t.location), i("span", "", t.reason)), g.append(e);
		}
	}, w = () => {
		let e = P(S());
		return v = e, y = !1, C(), e;
	}, T = () => {
		b || (x++, v && !y && (y = !0, l.textContent = "El partido ha cambiado. Repite la comprobación para actualizar el informe.", a.dataset.state = "stale", m.disabled = !0));
	};
	p.addEventListener("click", () => {
		if (b) return;
		let e = ++x;
		l.textContent = "Comprobando los registros locales…", p.disabled = !0, t.setTimeout(() => {
			if (b || e !== x) p.disabled = !1, C();
			else try {
				w();
			} catch {
				l.textContent = "No se pudo completar la comprobación; el partido permanece intacto.";
			} finally {
				p.disabled = !1;
			}
		}, 0);
	}), m.addEventListener("click", () => {
		if (b || !v || y || !v.matchAvailable) return;
		let e = new Blob([JSON.stringify(v, null, 2)], { type: "application/json" }), r = URL.createObjectURL(e), i = n.createElement("a");
		i.href = r, i.download = "volley-coach-v2057-auditoria-acciones.json", n.body.appendChild(i), i.click(), i.remove(), t.setTimeout(() => URL.revokeObjectURL(r), 1e3);
	});
	let E = () => {}, D = !1;
	if (t.VC_STATE_2059) E = t.VC_STATE_2059.subscribe("change", T);
	else {
		D = !0, n.addEventListener("vc:matchstatechange", T);
		try {
			let e = (t.MatchState || t.VC_MATCH_STATE)?.subscribe?.(T);
			typeof e == "function" && (E = e);
		} catch {}
	}
	let O = typeof MutationObserver == "function" ? new MutationObserver(() => {
		r.classList.contains("active") && C();
	}) : null;
	O?.observe(r, {
		attributes: !0,
		attributeFilter: ["class"]
	}), r.classList.contains("active") && C();
	let k = Object.freeze({
		version: "20.5.7",
		readOnly: !0,
		getReport: () => v,
		runAudit: w,
		dispose() {
			b || (b = !0, x++, O?.disconnect(), E(), D && n.removeEventListener("vc:matchstatechange", T), a.remove(), v = null, t.VC_COMMITTED_2057 === k && delete t.VC_COMMITTED_2057);
		}
	});
	return t.VC_COMMITTED_2057 = k, k;
}
// src/domain/grammar-runtime.ts
function ie(e) {
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
var ae = (e) => typeof e == "number" && Number.isSafeInteger(e) && e >= 0 ? e : null, oe = (e) => typeof e == "number" && Number.isSafeInteger(e) && e > 0 ? e : null, se = (e, t) => Object.keys(e).every((n) => Object.is(e[n], t[n]));
function I(i, a) {
	let o = e(i), s = oe(o?.currentSet), c = t(o?.sets), l = e(a) || e(c.find((t) => e(t)?.number === s)), u = o?.status === "live" || o?.status === "finished" ? o.status : null;
	return Object.freeze({
		score: Object.freeze({
			set: s,
			us: ae(l?.scoreUs),
			opponent: ae(l?.scoreOpponent)
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
function L(t) {
	let n = [
		"score",
		"court",
		"rally",
		"status"
	], r = [...n, "change"], i = new Map(r.map((e) => [e, /* @__PURE__ */ new Set()])), a = () => [
		t.MatchState,
		t.VC_MATCH_STATE,
		t.VC_SCOUT_VIDEO_BRIDGE,
		t.VC_SCOUT_REPORT_BRIDGE
	], o = () => {
		for (let t of a()) try {
			let n = t?.getActive?.();
			if (!e(n)) continue;
			let r;
			try {
				r = t?.getSet?.(n);
			} catch {}
			return I(n, r);
		} catch {}
		return I(null);
	}, s = o(), c = !1, l = !1, u = !1, d = 0, f = 0, p = 0, m = (e = !1) => {
		if (c) return;
		let t = o(), r = n.filter((e) => !se(s[e], t[e]));
		r.length && (s = t, f++), (e || r.length) && r.push("change");
		for (let e of r) for (let t of i.get(e) || []) {
			p++;
			try {
				t(s);
			} catch {}
		}
	}, h = () => {
		c || (d++, u = !0, l || (l = !0, Promise.resolve().then(() => {
			l = !1;
			let e = u;
			u = !1, m(e);
		})));
	}, g = () => (m(), s), _ = t.MatchState || t.VC_MATCH_STATE, v = () => {};
	try {
		let e = _?.subscribe?.(h);
		typeof e == "function" && (v = e);
	} catch {}
	return t.document.addEventListener("vc:matchstatechange", h), Object.freeze({
		version: "20.5.9",
		readOnly: !0,
		getSnapshot: () => s,
		subscribe(e, t) {
			if (c || !i.has(e) || typeof t != "function") return () => {};
			let n = i.get(e);
			return n.add(t), () => {
				n.delete(t);
			};
		},
		refresh: g,
		diagnostics: () => Object.freeze({
			readOnly: !0,
			signals: d,
			updates: f,
			notifications: p,
			subscribers: [...i.values()].reduce((e, t) => e + t.size, 0)
		}),
		dispose() {
			if (!c) {
				c = !0, v(), t.document.removeEventListener("vc:matchstatechange", h);
				for (let e of i.values()) e.clear();
			}
		}
	});
}
// src/state/runtime.ts
function R(e) {
	let t = e.document, n = t.getElementById("v11-management");
	if (!n) return null;
	if (e.VC_STATE_2059) return e.VC_STATE_2059;
	let r = L(e), i = (e, n = "", r = "") => {
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
var ce = 3e3, z = 25e3, B = (e, t) => t ? Math.round(e / t * 100) : null, V = () => ({
	receptions: 0,
	perfect: 0,
	positive: 0,
	attacks: 0,
	kills: 0,
	errors: 0,
	blocked: 0
}), H = (t, n) => {
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
}, U = (e) => Object.freeze({
	attempts: e.receptions,
	perfect: e.perfect,
	positive: e.positive,
	positivePct: B(e.positive, e.receptions),
	perfectPct: B(e.perfect, e.receptions)
}), W = (e) => Object.freeze({
	attempts: e.attacks,
	kills: e.kills,
	errors: e.errors,
	blocked: e.blocked,
	efficiencyPct: B(e.kills - e.errors - e.blocked, e.attacks)
}), G = (e, t) => Object.freeze({
	attempts: e,
	successes: t,
	percent: B(t, e)
});
function K(r) {
	let i = e(r), a = Number.isSafeInteger(i?.currentSet) && Number(i?.currentSet) > 0 ? Number(i?.currentSet) : null, o = e(t(i?.sets).find((t) => a !== null && e(t)?.number === a)), s = t(o?.rallies), c = V(), l = V(), u = 0, d = 0, f = 0, p = 0, m = 0, h = 0, g = !1;
	if (o) for (let r of s) {
		if (m >= ce) {
			g = !0;
			break;
		}
		let i = e(r);
		if (m++, !i) continue;
		let a = i.winner, o = i.servingBefore;
		n(a) && n(o) && (o === "opponent" ? (u++, a === "ours" && d++) : (f++, a === "ours" && p++));
		for (let e of t(i.actions)) {
			if (h >= z) {
				g = !0;
				break;
			}
			h++, H(c, e);
		}
		if (g) break;
	}
	let _ = t(e(i?.liveRally)?.actions);
	for (let e of _.slice(0, z)) H(l, e);
	_.length > z && (g = !0);
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
		sideOut: G(u, d),
		breakPoint: G(f, p),
		reception: U(c),
		attack: W(c),
		provisional: Object.freeze({
			actions: _.length,
			receptions: l.receptions,
			attacks: l.attacks,
			reception: U(v),
			attack: W(v)
		})
	});
}
// src/state/live-statistics-runtime.ts
function q(e) {
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
	let f = !1, p = !1, m = null, h = () => {
		for (let t of [
			e.MatchState,
			e.VC_MATCH_STATE,
			e.VC_SCOUT_VIDEO_BRIDGE,
			e.VC_SCOUT_REPORT_BRIDGE
		]) try {
			let e = t?.getActive?.();
			if (e && typeof e == "object" && !Array.isArray(e)) return e;
		} catch {}
		return null;
	}, g = () => r.classList.contains("active") && !i.classList.contains("hidden"), _ = (e, t, n) => {
		let r = l.get(e);
		r && (r.value.textContent !== t && (r.value.textContent = t), r.detail.textContent !== n && (r.detail.textContent = n));
	}, v = (e) => e === null ? "—" : `${e}%`, y = (e) => {
		if (f) return;
		n.dataset.state = e.available ? e.truncated ? "partial" : e.provisional.receptions || e.provisional.attacks ? "provisional" : "available" : "waiting", s.textContent = e.available ? `SET ${e.set} · ${e.completeRallies} rallies cerrados${e.truncated ? " · CÁLCULO PARCIAL" : ""}` : "No hay un set activo con datos", _("so", v(e.sideOut.percent), `${e.sideOut.successes} ganados / ${e.sideOut.attempts} recepciones de saque`), _("bp", v(e.breakPoint.percent), `${e.breakPoint.successes} ganados / ${e.breakPoint.attempts} saques propios`);
		let t = e.provisional.receptions > 0, r = e.provisional.attacks > 0, i = t ? e.provisional.reception : e.reception, a = r ? e.provisional.attack : e.attack;
		_("receive", v(i.positivePct), `${i.positive}/${i.attempts} positivas${t ? " · PROVISIONAL" : ""}`), _("attack", v(a.efficiencyPct), `${a.kills} puntos · ${a.errors + a.blocked} errores/bloqueos · ${a.attempts} intentos${r ? " · PROVISIONAL" : ""}`), u.textContent = `Rally abierto: ${e.provisional.actions} acciones · ${e.provisional.receptions} recepciones · ${e.provisional.attacks} ataques (sin cerrar)`;
	}, b = () => {
		let e = K(h());
		return m = e, g() && y(e), e;
	}, x = a.subscribe("change", () => {
		f || p || !g() || (p = !0, Promise.resolve().then(() => {
			p = !1, !f && g() && b();
		}));
	}), S = typeof MutationObserver == "function" ? new MutationObserver(() => {
		g() && b();
	}) : null;
	S?.observe(r, {
		attributes: !0,
		attributeFilter: ["class"]
	}), S?.observe(i, {
		attributes: !0,
		attributeFilter: ["class"]
	}), g() && b();
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
var le = 2e4, ue = 6e4, J = 80, de = /* @__PURE__ */ new Set([
	"#",
	"+",
	"!",
	"-",
	"/",
	"="
]), Y = () => ({
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
}), X = (e, t) => t ? Math.round(e / t * 100) : null, Z = (e) => {
	if (typeof e == "number" && Number.isSafeInteger(e) && e > 0) return e;
	if (typeof e == "string" && /^\d{1,15}$/.test(e)) {
		let t = Number(e);
		return Number.isSafeInteger(t) && t > 0 ? t : null;
	}
	return null;
}, fe = (e) => {
	let t = typeof e == "number" && Number.isSafeInteger(e) ? String(e) : typeof e == "string" ? e.trim() : "";
	return /^\d{1,3}$/.test(t) ? t : null;
}, Q = (e) => typeof e == "string" ? e.trim().slice(0, 50) : "";
function pe(e, t) {
	let n = Z(e.playerId), r = Q(e.opponentPlayerUid), i = fe(e.playerNumberSnapshot), a = Q(e.playerLabel), o = fe((a.match(/^#?\s*(\d{1,3})(?:\D|$)/) || [])[1]), s = i || (t === "opponent" ? o : null), c = Q(e.playerNameSnapshot) || a.replace(/^#?\s*\d{1,3}\s*[·-]?\s*/, "") || "", l = t === "ours" && n !== null ? `id:${n}` : t === "opponent" && r ? `uid:${r}` : s === null ? "unidentified" : `num:${s}`;
	return {
		key: l,
		number: s,
		name: l === "unidentified" ? "Sin identificar" : c,
		identified: l !== "unidentified"
	};
}
var $ = (e, t) => {
	let n = t.skill, r = t.evaluation;
	return !de.has(String(r)) || ![
		"S",
		"R",
		"A",
		"B",
		"D",
		"E"
	].includes(String(n)) ? !1 : (e.actions++, n === "S" ? (e.s++, r === "#" && e.aces++, r === "=" && e.sErrors++) : n === "R" ? (e.r++, r === "#" && e.rPerfect++, (r === "#" || r === "+") && e.rPositive++) : n === "A" ? (e.a++, r === "#" && e.kills++, r === "=" && e.aErrors++, r === "/" && e.blocked++) : n === "B" ? (e.b++, r === "#" && e.bPoints++) : n === "D" ? e.d++ : n === "E" && e.e++, !0);
}, me = (e) => Object.freeze({
	attempts: e.a,
	kills: e.kills,
	errors: e.aErrors,
	blocked: e.blocked,
	efficiencyPct: X(e.kills - e.aErrors - e.blocked, e.a)
}), he = (e, t) => Object.freeze({
	attempts: e,
	won: t,
	percent: X(t, e)
});
function ge(i, a) {
	let o = e(i), s = a.team === "opponent" ? "opponent" : "ours", c = a.scope === "match" ? "match" : "current", l = r(a.rotation) ? a.rotation : null, u = Object.freeze({
		team: s,
		scope: c,
		rotation: l
	}), d = Z(o?.currentSet), f = t(o?.sets), p = c === "match" ? f : f.filter((t) => d !== null && Z(e(t)?.number) === d), m = !!o && p.some((t) => !!e(t)), h = /* @__PURE__ */ new Map(), g = /* @__PURE__ */ new Map(), _ = Y();
	for (let e of [
		1,
		2,
		3,
		4,
		5,
		6
	]) g.set(e, {
		...Y(),
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
			if (v >= le) {
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
				if (y >= ue) {
					C = !0;
					break main;
				}
				y++;
				let t = e(n);
				if (!t || t.team !== s || (c === null && S++, c !== null && $(g.get(c), t), l !== null && c !== l)) continue;
				let r = pe(t, s), i = r.key, a = h.get(i);
				!a && h.size >= J ? (w = !0, $(_, t) && (b++, r.identified || x++)) : (a || (a = {
					...Y(),
					...r
				}, h.set(i, a)), !a.number && r.number && (a.number = r.number), !a.name && r.name && (a.name = r.name), $(a, t) && (b++, a.identified || x++));
			}
		}
	}
	let T = [...h.values()].filter((e) => e.actions > 0).sort((e, t) => e.identified === t.identified ? (e.number === null ? Infinity : Number(e.number)) - (t.number === null ? Infinity : Number(t.number)) || e.name.localeCompare(t.name, "es") || e.key.localeCompare(t.key) : e.identified ? -1 : 1).slice(0, J).map((e) => Object.freeze({
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
			positivePct: X(e.rPositive, e.r),
			perfectPct: X(e.rPerfect, e.r)
		}),
		attack: me(e),
		block: Object.freeze({
			attempts: e.b,
			points: e.bPoints
		}),
		digs: e.d,
		sets: e.e
	})), E = [...g.values()].map((e) => Object.freeze({
		rotation: e.rotation,
		rallies: e.rallies,
		sideOut: he(e.so, e.soWon),
		breakPoint: he(e.bp, e.bpWon),
		attack: me(e)
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
function _e(e) {
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
	let y = !1, b = !1, x = null, S = () => {
		for (let t of [
			e.MatchState,
			e.VC_MATCH_STATE,
			e.VC_SCOUT_VIDEO_BRIDGE,
			e.VC_SCOUT_REPORT_BRIDGE
		]) try {
			let e = t?.getActive?.();
			if (e && typeof e == "object" && !Array.isArray(e)) return e;
		} catch {}
		return null;
	}, C = () => r.classList.contains("active") && !i.classList.contains("hidden"), w = (e) => e === null ? "—" : `${e}%`, T = (e, t, n = "td") => e.append(o(n, "", t)), E = (e) => {
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
			T(e, `${n.number === null ? "—" : "#" + n.number} · ${n.name}`), T(e, `${n.serve.attempts} · ${n.serve.aces}/${n.serve.errors}`), T(e, `${n.receive.attempts} · ${w(n.receive.positivePct)} / ${w(n.receive.perfectPct)}`), T(e, `${n.attack.attempts} · ${n.attack.kills}/${w(n.attack.efficiencyPct)}`), T(e, `${n.block.attempts} · ${n.block.points}`), T(e, `${n.digs}/${n.sets}`), T(e, String(n.actions)), t.tbody.append(e);
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
			T(n, `P${t.rotation}`), T(n, String(t.rallies)), T(n, `${w(t.sideOut.percent)} · ${t.sideOut.won}/${t.sideOut.attempts}`), T(n, `${w(t.breakPoint.percent)} · ${t.breakPoint.won}/${t.breakPoint.attempts}`), T(n, `${t.attack.attempts} · ${t.attack.kills}/${w(t.attack.efficiencyPct)}`), r.tbody.append(n);
		}
		_.replaceChildren(r.grid);
	}, O = () => {
		let e = {
			team: d.value === "opponent" ? "opponent" : "ours",
			scope: f.value === "match" ? "match" : "current",
			rotation: /^[1-6]$/.test(p.value) ? Number(p.value) : null
		}, t = ge(S(), e);
		return x = t, C() && D(t), t;
	}, k = a.subscribe("change", () => {
		y || b || !C() || (b = !0, Promise.resolve().then(() => {
			b = !1, !y && C() && O();
		}));
	});
	for (let e of [
		d,
		f,
		p
	]) e.addEventListener("change", O);
	let A = typeof MutationObserver == "function" ? new MutationObserver(() => {
		C() && O();
	}) : null;
	A?.observe(r, {
		attributes: !0,
		attributeFilter: ["class"]
	}), A?.observe(i, {
		attributes: !0,
		attributeFilter: ["class"]
	}), C() && O();
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
// src/vc2055-entry.ts
if (typeof window < "u" && window.document) {
	let e = () => {
		R(window), w(window), A(window), F(window), ie(window), q(window), _e(window);
	};
	window.document.readyState === "loading" ? window.document.addEventListener("DOMContentLoaded", e, { once: !0 }) : e();
}
export { l as attackEfficiency, P as auditCommittedMatch, o as auditMatchScores, O as classifyPreflight, N as classifyStoredAction, y as compareNativeCode, L as createObservableMatchStore, k as createShadowSession, v as inspectCodeShape, K as inspectLiveSetStatistics, C as inspectMatchDomain, ge as inspectPlayerBoxscore, S as inspectSubstitution, F as mountCommittedPanel, w as mountDomainDiagnostic, ie as mountGrammarPanel, q as mountLiveStatisticsPanel, R as mountObservablePanel, _e as mountPlayerBoxscore, A as mountShadowPanel, s as nextRotation, I as projectObservableMatch, c as projectPoint, u as sideOutBreakPoint, a as verifyRallyScore };
