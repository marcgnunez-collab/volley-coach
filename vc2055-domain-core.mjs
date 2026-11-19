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
var d = /^(R?)(\d+)([SREABDFC])([#+!\-/=]?)(.*)$/, f = /^\.([1-9][A-D]?)(?:>([1-9][A-D]?|C[1-8]))?/, p = /^(?:(?:~[A-Z0-9]{1,6})|(?:::?[A-Z0-9]{1,10})|(?:\*[A-Z0-9]{1,3})|(?:\^[A-Z0-9]{1,3})|(?:@[0-3])|(?:&\d{1,3})|(?:%[A-Z0-9]{1,8})|(?:\|[A-Z0-9]{1,3})|(?:\?[A-Z0-9]{1,10})|(?:\$[A-Z0-9]{1,5}))*$/;
function m(e) {
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
		reason: "No coincide con la sintaxis de un código nativo."
	});
	let i = r[1] ? "opponent" : "ours", a = r[2], o = r[3], s = r[4] || "!", c = r[5], l = null, u = null, m = c.match(f);
	m && (l = m[1], u = m[2] || null, c = c.slice(m[0].length));
	let h = !!l && !u && ![
		"R",
		"D",
		"B"
	].includes(o), g = !!u && u.startsWith("C") && o !== "A", _ = p.test(c), v = !h && !g && _ && !c.startsWith(".");
	return Object.freeze({
		state: v ? "candidate" : "unsupported",
		normalized: t,
		team: i,
		dorsal: a,
		skill: o,
		evaluation: s,
		startZone: l,
		endZone: u,
		advanced: c,
		reason: v ? "Estructura reconocida; la plantilla y las reglas siguen pendientes del parser original." : h ? "El fundamento requiere origen y destino; solo R, D y B admiten una zona única." : g ? "El destino en cono solo corresponde a un ataque." : "Hay un sufijo que requiere el validador original."
	});
}
function h(e, t) {
	let n = m(e), r = typeof t == "object" && t ? t : null;
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
var g = /* @__PURE__ */ new Set([
	"p1",
	"p2",
	"p3",
	"p4",
	"p5",
	"p6"
]);
function _(e) {
	return typeof e == "number" && Number.isSafeInteger(e) && e > 0 ? e : typeof e == "string" && /^\d+$/.test(e) && Number(e) > 0 ? Number(e) : null;
}
function v(t) {
	let n = [], r = String(t.position ?? ""), i = _(t.outgoingPlayer), a = _(t.incomingPlayer), o = e(t.lineup);
	if (t.matchStatus === "finished" && n.push("Partido finalizado."), g.has(r) || n.push("Posición de pista no reconocida."), r === t.liberoActivePosition && n.push("El líbero ocupa esa posición."), i !== null && a !== null && i === a && n.push("El jugador entrante coincide con el saliente."), a !== null && o) {
		for (let [e, t] of Object.entries(o)) if (e !== r && g.has(e) && _(t) === a) {
			n.push("El jugador entrante ya ocupa otra posición.");
			break;
		}
	}
	let s = g.has(r) && o ? _(o[r]) : null;
	i !== null && s !== null && s !== i && n.push("El dorsal saliente no coincide con la posición actual.");
	let c = n.length ? "blocked" : i === null || a === null || !o || s === null ? "unknown" : "plausible";
	return Object.freeze({
		state: c,
		reasons: Object.freeze(n),
		officialLegality: "not-evaluated"
	});
}
// src/domain/runtime.ts
function y(n) {
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
function b(e) {
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
	let h = r("p", "vc2055-note", "Una traza sin datos no es un error. Las comprobaciones no sustituyen la validación oficial de líberos y sustituciones ni confirman la sincronización en otro dispositivo.");
	i.append(a, c, l, u, p, h);
	let g = t.getElementById("vc2053-modular-core");
	g?.parentNode === n ? g.insertAdjacentElement("afterend", i) : n.insertAdjacentElement("afterbegin", i);
	let _ = () => {
		for (let t of [
			e.MatchState,
			e.VC_SCOUT_VIDEO_BRIDGE,
			e.VC_SCOUT_REPORT_BRIDGE
		]) try {
			let e = t?.getActive?.();
			if (e) return e;
		} catch {}
		return null;
	}, b = () => y(_()), x = (e) => e === null ? "—" : `${e}%`, S = () => {
		let e = b();
		l.textContent = e.matchAvailable ? "Datos del partido original examinados" : "Sin partido activo", i.dataset.state = e.matchAvailable ? "available" : "waiting";
		let t = {
			verified: String(e.score.verified),
			inconsistent: String(e.score.inconsistent),
			unknown: String(e.score.unknown),
			rotation: e.rotation,
			so: x(e.sideOutPct),
			bp: x(e.breakPointPct),
			attack: x(e.attackEfficiencyPct)
		};
		for (let [e, n] of Object.entries(t)) {
			let t = f.get(e);
			t && t.textContent !== n && (t.textContent = n);
		}
	}, C = !1, w = !1, T = () => {
		w || C || !n.classList.contains("active") || (C = !0, Promise.resolve().then(() => {
			C = !1, w || S();
		}));
	};
	p.addEventListener("click", S), t.addEventListener("vc:matchstatechange", T);
	let E = () => {};
	try {
		let t = e.MatchState?.subscribe?.(T);
		typeof t == "function" && (E = t);
	} catch {}
	let D = typeof MutationObserver == "function" ? new MutationObserver(T) : null;
	D?.observe(n, {
		attributes: !0,
		attributeFilter: ["class"]
	}), n.classList.contains("active") && S();
	let O = Object.freeze({
		version: "20.5.5",
		readOnly: !0,
		inspectCodeShape: m,
		inspectSubstitution: v,
		nextRotation: s,
		inspectCurrent: b,
		dispose() {
			w || (w = !0, D?.disconnect(), E(), t.removeEventListener("vc:matchstatechange", T), i.remove(), e.VC_DOMAIN_2055 === O && delete e.VC_DOMAIN_2055);
		}
	});
	return e.VC_DOMAIN_2055 = O, O;
}
// src/domain/shadow-validation.ts
var x = 80, S = (e) => e === "v800-code" ? "directo" : e === "v113-video-code" ? "video" : "otro", C = (e) => m(e);
function w(t) {
	let n = e(t), r = C(n?.code), i = S(n?.source), a = e(n?.nativeShape), o = {
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
		let e = h(n?.code, { action: a });
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
function T() {
	let e = 0, t = 0, n = 0, r = 0, i = 0, a = 0, o = [];
	return Object.freeze({
		record(s) {
			let c = w(s);
			return e++, c.kind === "agree" ? t++ : c.kind === "difference" ? n++ : c.kind === "coverage-gap" ? r++ : c.kind === "native-reject" ? i++ : a++, c.kind !== "agree" && (o.push(c), o.length > x && o.shift()), c;
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
function E(e) {
	let t = e.document, n = t.getElementById("v11-management");
	if (!n) return null;
	if (e.VC_SHADOW_2056) return e.VC_SHADOW_2056;
	let r = T(), i = (e, n = "", r = "") => {
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
var D = 2e4, O = 6e4, k = 80, A = /* @__PURE__ */ new Set([
	"S",
	"R",
	"E",
	"A",
	"B",
	"D",
	"F",
	"C"
]), j = (e) => typeof e == "string" && A.has(e) ? e : "—", M = {
	difference: "El código guardado y los campos de la acción no coinciden.",
	"coverage-gap": "El código guardado utiliza sintaxis todavía no cubierta por TypeScript.",
	unverified: "Faltan campos del registro para comprobarlo con seguridad.",
	"no-code": "La acción está registrada sin código original.",
	score: "El ganador no concuerda con el cambio de marcador registrado.",
	"score-sequence": "El tanteo final y el inicial del siguiente rally no coinciden.",
	rotation: "La siguiente rotación o el turno de saque no concuerdan con la proyección básica."
};
function N(t) {
	let r = e(t), i = j(r?.skill);
	if (!r) return Object.freeze({
		kind: "unverified",
		skill: i
	});
	let a = typeof r.code == "string" ? r.code.trim() : "";
	if (!a) return Object.freeze({
		kind: "no-code",
		skill: i
	});
	let o = m(a);
	if (o.state !== "candidate") return Object.freeze({
		kind: "coverage-gap",
		skill: j(o.skill) || i
	});
	if (!n(r.team) || !A.has(String(r.skill)) || ![
		"#",
		"+",
		"!",
		"-",
		"/",
		"="
	].includes(String(r.evaluation)) || r.playerNumberSnapshot === null || r.playerNumberSnapshot === void 0 || String(r.playerNumberSnapshot).trim() === "") return Object.freeze({
		kind: "unverified",
		skill: j(o.skill)
	});
	let s = h(a, { action: r });
	return Object.freeze({
		kind: s.state === "agree" ? "agree" : s.state === "disagree" ? "difference" : "unverified",
		skill: j(o.skill)
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
			skill: j(n),
			reason: M[e]
		})), u.length > k && u.shift();
	}, p = (e, t) => {
		if (l.actions >= O) return d = !0, !1;
		l.actions++;
		let n = N(e);
		return n.kind === "agree" ? l.agree++ : n.kind === "difference" ? l.difference++ : n.kind === "coverage-gap" ? l.coverageGap++ : n.kind === "no-code" ? l.noCode++ : l.unverified++, n.kind !== "agree" && f(n.kind, t, n.skill), !0;
	}, m = t(s?.sets);
	main: for (let o = 0; o < m.length; o++) {
		let s = e(m[o]);
		if (!s) continue;
		let u = t(s.rallies);
		for (let s = 0; s < u.length; s++) {
			if (l.rallies >= D) {
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
	}), n.addEventListener("vc:matchstatechange", T);
	let E = () => {};
	try {
		let e = (t.MatchState || t.VC_MATCH_STATE)?.subscribe?.(T);
		typeof e == "function" && (E = e);
	} catch {}
	let D = typeof MutationObserver == "function" ? new MutationObserver(() => {
		r.classList.contains("active") && C();
	}) : null;
	D?.observe(r, {
		attributes: !0,
		attributeFilter: ["class"]
	}), r.classList.contains("active") && C();
	let O = Object.freeze({
		version: "20.5.7",
		readOnly: !0,
		getReport: () => v,
		runAudit: w,
		dispose() {
			b || (b = !0, x++, D?.disconnect(), E(), n.removeEventListener("vc:matchstatechange", T), a.remove(), v = null, t.VC_COMMITTED_2057 === O && delete t.VC_COMMITTED_2057);
		}
	});
	return t.VC_COMMITTED_2057 = O, O;
}
// src/vc2055-entry.ts
if (typeof window < "u" && window.document) {
	let e = () => {
		b(window), E(window), F(window);
	};
	window.document.readyState === "loading" ? window.document.addEventListener("DOMContentLoaded", e, { once: !0 }) : e();
}
export { l as attackEfficiency, P as auditCommittedMatch, o as auditMatchScores, w as classifyPreflight, N as classifyStoredAction, h as compareNativeCode, T as createShadowSession, m as inspectCodeShape, y as inspectMatchDomain, v as inspectSubstitution, F as mountCommittedPanel, b as mountDomainDiagnostic, E as mountShadowPanel, s as nextRotation, c as projectPoint, u as sideOutBreakPoint, a as verifyRallyScore };
