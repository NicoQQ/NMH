/* NMH Estructura Ágil · lógica del portal del suscriptor.
   Los parámetros viven en datos.js. Este archivo no necesita editarse para calibrar. */
(function () {
  "use strict";
  var D = window.NMH_DATOS;
  var $ = function (id) { return document.getElementById(id); };
  var fmtCOP = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
  var fmtN0 = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
  var fmtN1 = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var fmtN2 = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  var CLAVE_ESTADO = "nmh-ea-estado-v1";
  var CLAVE_SESION = "nmh-ea-sesion";
  var memoria = {};
  var ultimo = null; // último resultado calculado

  /* ---------- almacenamiento tolerante a fallos ---------- */
  function leer(store, k) { try { return window[store].getItem(k); } catch (e) { return memoria[store + k] || null; } }
  function escribir(store, k, v) { try { window[store].setItem(k, v); } catch (e) { memoria[store + k] = v; } }
  function borrar(store, k) { try { window[store].removeItem(k); } catch (e) { delete memoria[store + k]; } }

  function mesActual() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1); }
  function estadoInicial() {
    return {
      mes: mesActual(),
      consumido: D.plan.demoConsumido,
      predim: D.plan.demoPredim,
      historial: [{ fecha: hoyTxt(), desc: "Diseño registrado · " + D.plan.demoProyecto, m2: D.plan.demoConsumido, valor: 0 },
                  { fecha: hoyTxt(), desc: "Predimensionamientos solicitados (2)", m2: 0, valor: 0, predim: true }]
    };
  }
  function cargarEstado() {
    var s = null;
    try { s = JSON.parse(leer("localStorage", CLAVE_ESTADO)); } catch (e) { s = null; }
    if (!s || typeof s.consumido !== "number") s = estadoInicial();
    if (s.mes !== mesActual()) { s = { mes: mesActual(), consumido: 0, predim: 0, historial: [] }; }
    return s;
  }
  function guardarEstado() { escribir("localStorage", CLAVE_ESTADO, JSON.stringify(estado)); }
  var estado = cargarEstado();

  function hoyTxt() { var d = new Date(); return d.getDate() + " " + MESES[d.getMonth()].slice(0, 3) + " " + d.getFullYear(); }

  /* ---------- acceso ---------- */
  function mostrarApp(si) {
    $("vista-acceso").hidden = si;
    $("vista-app").hidden = !si;
    if (si) { pintarCupo(); window.scrollTo(0, 0); }
  }
  $("form-acceso").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var u = $("usuario").value.trim().toLowerCase();
    var c = $("clave").value;
    if (u === D.acceso.usuario && c === D.acceso.clave) {
      escribir("sessionStorage", CLAVE_SESION, "1");
      $("error-acceso").hidden = true;
      mostrarApp(true);
    } else {
      $("error-acceso").hidden = false;
      $("clave").select();
    }
  });
  $("btn-salir").addEventListener("click", function () {
    borrar("sessionStorage", CLAVE_SESION);
    $("clave").value = "";
    mostrarApp(false);
  });

  /* ---------- utilidades técnicas ---------- */
  function zonaDe(aa, av) {
    var m = Math.max(aa, av);
    if (m > 0.20 + 1e-9) return "Alta";
    if (m > 0.10 + 1e-9) return "Intermedia";
    return "Baja";
  }
  function escalaMarginal(area) {
    var rest = area, prev = 0, eq = 0;
    D.diseno.escala.forEach(function (t) {
      if (rest <= 0) return;
      var tramo = Math.min(rest, t.hasta - prev);
      eq += tramo * t.factor;
      rest -= tramo; prev = t.hasta;
    });
    return eq;
  }
  function tenor(tipoKey, A, V, irr, n) {
    var t = D.tipos[tipoKey];
    var pasos = Math.max(0, Math.round((A - 0.10) / 0.05 * 100) / 100);
    var fS = 1 + t.sis * pasos;
    var fW = Math.pow(Math.max(V, 100) / 100, 2 * t.vie);
    var fI = D.irregularidadAcero[irr];
    var fN = 1 + t.pis * (n - 1);
    var esp = t.base * fS * fW * fI * fN;
    return { esp: esp, cons: esp * t.cons, fS: fS, fW: fW, fI: fI, fN: fN, pasos: pasos };
  }

  /* ---------- formulario ---------- */
  function poblarCiudades() {
    var sel = $("f-ciudad");
    Object.keys(D.municipios).forEach(function (dep) {
      var g = document.createElement("optgroup"); g.label = dep;
      D.municipios[dep].forEach(function (m, i) {
        var o = document.createElement("option");
        o.value = dep + "|" + i; o.textContent = m[0] + (dep === "Otras capitales" ? "" : " (" + dep + ")");
        g.appendChild(o);
      });
      sel.appendChild(g);
    });
    var g2 = document.createElement("optgroup"); g2.label = "Otro municipio";
    var o2 = document.createElement("option"); o2.value = "manual"; o2.textContent = "Otro municipio (ingresar Aa y Av)";
    g2.appendChild(o2); sel.appendChild(g2);
    sel.value = "Atlántico|0";
  }
  function poblarViento(sel) {
    D.viento.opciones.forEach(function (v) {
      var o = document.createElement("option"); o.value = v; o.textContent = v + " km/h"; sel.appendChild(o);
    });
  }
  function poblarTipos() {
    var sel = $("f-tipo");
    Object.keys(D.tipos).forEach(function (k) {
      var o = document.createElement("option"); o.value = k; o.textContent = D.tipos[k].nombre; sel.appendChild(o);
    });
    sel.value = "bodega";
  }
  function ciudadSel() {
    var v = $("f-ciudad").value;
    if (v === "manual") {
      var aa = parseFloat($("f-aa").value), av = parseFloat($("f-av").value);
      return { nombre: "Otro municipio", dep: "", aa: aa, av: av, manual: true };
    }
    var p = v.split("|"); var m = D.municipios[p[0]][+p[1]];
    return { nombre: m[0], dep: p[0], aa: m[1], av: m[2], manual: false };
  }
  function alCambiarCiudad() {
    var c = ciudadSel();
    $("caja-manual").hidden = !c.manual;
    pintarAmenaza(c);
    if (!c.manual) {
      var v = D.viento.departamentos[c.dep] || D.viento.porDefecto;
      if (c.dep === "Otras capitales") v = D.viento.porDefecto;
      $("f-viento").value = String(v);
    }
  }
  function pintarAmenaza(c) {
    var ok = isFinite(c.aa) && isFinite(c.av);
    $("o-aa").textContent = ok ? fmtN2.format(c.aa) : "—";
    $("o-av").textContent = ok ? fmtN2.format(c.av) : "—";
    var z = ok ? zonaDe(c.aa, c.av) : "—";
    var chip = $("o-zona"); chip.textContent = z; chip.className = "chip " + z;
  }
  function alCambiarTipo() {
    var t = D.tipos[$("f-tipo").value];
    $("ayuda-tipo").textContent = t.material + ". " + t.nota;
    var p = $("f-pisos");
    p.max = t.maxPisos;
    if (+p.value > t.maxPisos) p.value = t.maxPisos;
    p.disabled = t.maxPisos === 1;
    if (t.maxPisos === 1) p.value = 1;
    $("ayuda-pisos").textContent = t.maxPisos === 1 ? "Tipología de un solo nivel: el área corresponde a la planta cubierta." : "Máximo " + t.maxPisos + " pisos para esta tipología en el cotizador rápido; proyectos mayores se cotizan aparte.";
  }

  /* ---------- cálculo ---------- */
  function calcular() {
    var c = ciudadSel();
    var tipoKey = $("f-tipo").value, t = D.tipos[tipoKey];
    var area = parseFloat($("f-area").value);
    var n = parseInt($("f-pisos").value, 10);
    var V = parseFloat($("f-viento").value);
    var irr = (document.querySelector('input[name="irr"]:checked') || {}).value || "regular";
    var err = "";
    if (!isFinite(area) || area < 10) err = "Ingrese un área por piso de al menos 10 m².";
    else if (area > 100000) err = "Para áreas mayores de 100.000 m² solicite una cotización directa.";
    else if (!isFinite(n) || n < 1) err = "Ingrese el número de pisos.";
    else if (n > t.maxPisos) err = "Esta tipología admite máximo " + t.maxPisos + " pisos en el cotizador rápido.";
    else if (c.manual && (!(c.aa >= 0.05 && c.aa <= 0.5) || !(c.av >= 0.05 && c.av <= 0.5))) err = "Aa y Av deben estar entre 0,05 y 0,50.";
    $("error-cot").hidden = !err; $("error-cot").textContent = err;
    if (err) return null;

    var A = Math.max(c.aa, c.av);
    var zona = zonaDe(c.aa, c.av);
    var ten = tenor(tipoKey, A, V, irr, n);
    var areaTotal = area * n;

    // Distribución por piso: el piso inferior pesa hasta pesoPisoInferior más que el último.
    var pisos = [], p = D.pesoPisoInferior, sumW = 0, i;
    for (i = 1; i <= n; i++) { var w = n === 1 ? 1 : 1 + p * (n - i) / (n - 1); pisos.push(w); sumW += w; }
    var mediaW = sumW / n;
    var filas = pisos.map(function (w, k) {
      var kgm2 = ten.cons * w / mediaW;
      return { piso: k + 1, area: area, kgm2: kgm2, kg: kgm2 * area };
    });

    // Precio del diseño
    var Dz = D.diseno;
    var fDz = Dz.zona[zona], fDi = Dz.irregularidad[irr];
    var fDh = 1 + Dz.alturaPorPiso * Math.max(0, n - Dz.pisosSinRecargo);
    var areaEsc = escalaMarginal(areaTotal);
    var m2eq = Math.round(areaEsc * t.dis * fDz * fDi * fDh);
    var cupoRest = Math.max(0, D.plan.cupoM2Eq - estado.consumido);
    var consumo = Math.min(m2eq, cupoRest);
    var exced = m2eq - consumo;
    var valor = exced * D.plan.tarifaSuscriptor;
    var aplicaMin = false;
    if (consumo === 0 && valor < D.plan.minimoSuscriptor) { valor = D.plan.minimoSuscriptor; aplicaMin = true; }
    var lista = Math.max(D.plan.minimoLista, m2eq * D.plan.tarifaLista);
    var iva = valor * D.plan.iva;

    return {
      ciudad: c, tipoKey: tipoKey, tipo: t, area: area, n: n, V: V, irr: irr, A: A, zona: zona,
      ten: ten, filas: filas, areaTotal: areaTotal,
      kgEsp: ten.esp * areaTotal, kgCons: ten.cons * areaTotal,
      fDz: fDz, fDi: fDi, fDh: fDh, areaEsc: areaEsc, m2eq: m2eq,
      cupoRest: cupoRest, consumo: consumo, exced: exced, valor: valor, aplicaMin: aplicaMin,
      iva: iva, total: valor + iva, lista: lista, listaTotal: lista * (1 + D.plan.iva),
      nombre: $("f-nombre").value.trim(), fecha: new Date()
    };
  }

  function fila(dl, k, v, cls) {
    var dt = document.createElement("dt"), dd = document.createElement("dd");
    dt.textContent = k; dd.textContent = v;
    if (cls) { dt.className = cls; dd.className = cls; }
    dl.appendChild(dt); dl.appendChild(dd);
  }
  function irrTxt(k) { return { regular: "Regular", leve: "Leve", marcada: "Marcada" }[k]; }

  function pintarResultado(r) {
    ultimo = r;
    $("res-vacio").hidden = true; $("res-lleno").hidden = false;

    // Diseño
    $("r-total").textContent = r.total === 0 ? "Incluido en su cupo" : fmtCOP.format(r.total);
    $("r-total-det").textContent = r.total === 0
      ? r.m2eq + " m² eq se descuentan de su cupo del mes. Sin costo adicional."
      : "Valor del diseño con IVA (" + fmtCOP.format(r.valor) + " + IVA).";
    var dl = $("r-filas-diseno"); dl.innerHTML = "";
    fila(dl, "Área total de diseño", fmtN0.format(r.areaTotal) + " m²");
    fila(dl, "Área equivalente (complejidad y escala)", fmtN0.format(r.m2eq) + " m² eq");
    fila(dl, "Cubierto por el cupo del mes", fmtN0.format(r.consumo) + " m² eq");
    fila(dl, "Excedente a tarifa preferencial", fmtN0.format(r.exced) + " m² eq × " + fmtCOP.format(D.plan.tarifaSuscriptor));
    if (r.aplicaMin) fila(dl, "Valor mínimo por proyecto", fmtCOP.format(D.plan.minimoSuscriptor));
    fila(dl, "Subtotal", fmtCOP.format(r.valor));
    fila(dl, "IVA " + Math.round(D.plan.iva * 100) + " %", fmtCOP.format(r.iva));
    fila(dl, "Total", fmtCOP.format(r.total), "total");
    var ah = r.listaTotal - r.total;
    var elA = $("r-ahorro");
    elA.className = "ahorro";
    if (r.cupoRest <= 0) {
      elA.className = "ahorro alerta";
      elA.textContent = "Su cupo de m² del mes está agotado: este diseño se liquida completo a tarifa preferencial. Tarifa de lista: " + fmtCOP.format(r.listaTotal) + " con IVA.";
    } else {
      elA.textContent = "Ahorro frente a tarifa de lista (" + fmtCOP.format(r.listaTotal) + " con IVA): " + fmtCOP.format(Math.max(0, ah)) + ".";
    }

    // Acero
    $("r-material").textContent = r.tipo.material + " estimado";
    $("r-ton").textContent = fmtN1.format(r.kgCons / 1000) + " t";
    $("r-ton-det").textContent = "Peso conservador para presupuesto · esperado " + fmtN1.format(r.kgEsp / 1000) + " t";
    $("r-esp").textContent = fmtN1.format(r.ten.esp) + " kg/m²";
    $("r-cons").textContent = fmtN1.format(r.ten.cons) + " kg/m²";
    var tb = document.querySelector("#r-tabla-pisos tbody"); tb.innerHTML = "";
    r.filas.slice().reverse().forEach(function (f) {
      var tr = document.createElement("tr");
      tr.innerHTML = "<td>" + (r.n === 1 ? "Único" : "Piso " + f.piso) + "</td><td class='n'>" + fmtN0.format(f.area) + "</td><td class='n'>" + fmtN1.format(f.kgm2) + "</td><td class='n'>" + fmtN0.format(f.kg) + "</td>";
      tb.appendChild(tr);
    });
    var tf = document.querySelector("#r-tabla-pisos tfoot"); if (tf) tf.remove();
    tf = document.createElement("tfoot");
    tf.innerHTML = "<tr><td>Total</td><td class='n'>" + fmtN0.format(r.areaTotal) + "</td><td class='n'>" + fmtN1.format(r.ten.cons) + "</td><td class='n'>" + fmtN0.format(r.kgCons) + "</td></tr>";
    $("r-tabla-pisos").appendChild(tf);

    var fx = $("r-factores"); fx.innerHTML = "";
    fila(fx, "Tenor base (" + r.tipo.nombre.split(" (")[0].toLowerCase() + ")", fmtN1.format(r.tipo.base) + " kg/m²");
    fila(fx, "Factor sísmico (A = " + fmtN2.format(r.A) + ", zona " + r.zona.toLowerCase() + ")", "× " + fmtN2.format(r.ten.fS));
    fila(fx, "Factor de viento (" + r.V + " km/h)", "× " + fmtN2.format(r.ten.fW));
    fila(fx, "Factor de irregularidad (" + irrTxt(r.irr).toLowerCase() + ")", "× " + fmtN2.format(r.ten.fI));
    fila(fx, "Factor por número de pisos (" + r.n + ")", "× " + fmtN2.format(r.ten.fN));
    fila(fx, "Margen conservador para presupuesto", "× " + fmtN2.format(r.tipo.cons));
    fila(fx, "Complejidad de diseño (tipo × zona × irregularidad × altura)", "× " + fmtN2.format(r.tipo.dis * r.fDz * r.fDi * r.fDh));

    // Botones
    var txt = "Hola NMH, solicito predimensionamiento (Estructura Ágil)." +
      "\nSuscriptor: " + D.acceso.suscriptor +
      (r.nombre ? "\nProyecto: " + r.nombre : "") +
      "\nUbicación: " + r.ciudad.nombre + (r.ciudad.dep && r.ciudad.dep !== "Otras capitales" ? ", " + r.ciudad.dep : "") +
      " (Aa " + fmtN2.format(r.ciudad.aa) + ", Av " + fmtN2.format(r.ciudad.av) + ", viento " + r.V + " km/h)" +
      "\nTipo: " + r.tipo.nombre +
      "\nÁrea: " + fmtN0.format(r.area) + " m² por piso × " + r.n + " piso(s)" +
      "\nIrregularidad aparente: " + irrTxt(r.irr) +
      "\nEstimado app: " + fmtN1.format(r.kgCons / 1000) + " t de " + r.tipo.material.toLowerCase() + " (conservador)";
    var a = $("btn-predim");
    a.href = "https://wa.me/" + D.contacto.whatsapp + "?text=" + encodeURIComponent(txt);
    var b = $("btn-registrar");
    b.disabled = false; b.classList.remove("ok"); b.dataset.paso = "";
    b.textContent = "Registrar diseño y descontar cupo";
  }

  /* ---------- cupo ---------- */
  function pintarCupo() {
    var d = new Date();
    $("txt-mes").textContent = MESES[d.getMonth()] + " " + d.getFullYear();
    $("txt-suscriptor").textContent = D.acceso.suscriptor + " · " + D.acceso.plan;
    var rest = Math.max(0, D.plan.cupoM2Eq - estado.consumido);
    $("txt-cupo").textContent = fmtN0.format(rest) + " m² eq disponibles";
    $("txt-cupo-det").textContent = fmtN0.format(estado.consumido) + " de " + fmtN0.format(D.plan.cupoM2Eq) + " m² eq usados este mes";
    var pc = Math.min(100, estado.consumido / D.plan.cupoM2Eq * 100);
    $("barra-cupo-fill").style.width = pc + "%";
    $("barra-cupo").setAttribute("aria-valuenow", Math.round(pc));
    $("barra-cupo").classList.toggle("agotada", rest <= 0);
    var prest = Math.max(0, D.plan.predimensionamientos - estado.predim);
    $("txt-predim").textContent = prest + " de " + D.plan.predimensionamientos;
    var pp = Math.min(100, estado.predim / D.plan.predimensionamientos * 100);
    $("barra-predim-fill").style.width = pp + "%";
    $("barra-predim").setAttribute("aria-valuenow", Math.round(pp));
    $("barra-predim").classList.toggle("agotada", prest <= 0);
    $("txt-tarifa").textContent = fmtCOP.format(D.plan.tarifaSuscriptor) + "/m²";
    $("txt-tarifa-det").textContent = "Lista " + fmtCOP.format(D.plan.tarifaLista) + "/m² · valores antes de IVA";
    pintarHistorial();
  }
  function pintarHistorial() {
    var ul = $("historial"); ul.innerHTML = "";
    if (!estado.historial.length) { ul.innerHTML = "<li><span class='vacio-h'>Sin movimientos este mes.</span></li>"; return; }
    estado.historial.slice().reverse().forEach(function (h) {
      var li = document.createElement("li");
      var s1 = document.createElement("span"); s1.textContent = h.desc;
      var s2 = document.createElement("span"); s2.textContent = h.predim ? "Ficha" : (h.m2 ? fmtN0.format(h.m2) + " m² eq" : "");
      var sm = document.createElement("small"); sm.textContent = h.fecha + (h.valor ? " · excedente " + fmtCOP.format(h.valor) + " + IVA" : "");
      li.appendChild(s1); li.appendChild(s2); li.appendChild(sm); ul.appendChild(li);
    });
  }

  $("btn-registrar").addEventListener("click", function () {
    var b = this;
    if (!ultimo) return;
    if (b.dataset.paso !== "confirmar") {
      b.dataset.paso = "confirmar";
      b.textContent = "Confirmar: descontar " + fmtN0.format(ultimo.consumo) + " m² eq";
      return;
    }
    estado.consumido += ultimo.consumo;
    estado.historial.push({ fecha: hoyTxt(), desc: "Diseño registrado · " + (ultimo.nombre || ultimo.tipo.nombre.split(" (")[0]) + ", " + ultimo.ciudad.nombre, m2: ultimo.m2eq, valor: ultimo.valor });
    guardarEstado(); pintarCupo();
    b.textContent = "Diseño registrado"; b.classList.add("ok"); b.disabled = true; b.dataset.paso = "";
  });
  $("btn-predim").addEventListener("click", function () {
    if (!ultimo) return;
    estado.predim += 1;
    estado.historial.push({ fecha: hoyTxt(), desc: "Predimensionamiento solicitado · " + (ultimo.nombre || ultimo.tipo.nombre.split(" (")[0]) + ", " + ultimo.ciudad.nombre, m2: 0, valor: 0, predim: true });
    guardarEstado(); pintarCupo();
  });
  $("btn-reiniciar").addEventListener("click", function () {
    estado = estadoInicial(); guardarEstado(); pintarCupo();
    if (ultimo) { var r = calcular(); if (r) pintarResultado(r); }
  });

  /* ---------- impresión ---------- */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  $("btn-imprimir").addEventListener("click", function () {
    var r = ultimo; if (!r) return;
    var f = r.fecha, num = "CR-" + f.getFullYear() + String(f.getMonth() + 1).padStart(2, "0") + String(f.getDate()).padStart(2, "0") + "-" + String(f.getHours()).padStart(2, "0") + String(f.getMinutes()).padStart(2, "0");
    var pisosRows = r.filas.slice().reverse().map(function (x) {
      return "<tr><td>" + (r.n === 1 ? "Único" : "Piso " + x.piso) + "</td><td class='n'>" + fmtN0.format(x.area) + "</td><td class='n'>" + fmtN1.format(x.kgm2) + "</td><td class='n'>" + fmtN0.format(x.kg) + "</td></tr>";
    }).join("");
    $("impresion").innerHTML =
      "<div class='cab'><img src='../assets/img/logo-nmh-azul.png' alt='NMH Engineering'><div><strong>NMH ENGINEERING S.A.S.</strong><br>NIT 901.892.933-1<br>Estructura Ágil · " + esc(num) + "<br>" + f.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }) + "</div></div>" +
      "<h1>Cotización preliminar de diseño estructural</h1><p>Suscriptor: " + esc(D.acceso.suscriptor) + " · " + esc(D.acceso.plan) + (r.nombre ? " · Proyecto: " + esc(r.nombre) : "") + "</p>" +
      "<h2>1. Datos del proyecto</h2><table><tbody>" +
      "<tr><td>Ubicación</td><td>" + esc(r.ciudad.nombre + (r.ciudad.dep && r.ciudad.dep !== "Otras capitales" ? ", " + r.ciudad.dep : "")) + "</td></tr>" +
      "<tr><td>Amenaza sísmica (NSR-10)</td><td>Aa = " + fmtN2.format(r.ciudad.aa) + " · Av = " + fmtN2.format(r.ciudad.av) + " · Zona " + r.zona.toLowerCase() + "</td></tr>" +
      "<tr><td>Velocidad básica de viento</td><td>" + r.V + " km/h (valor de referencia)</td></tr>" +
      "<tr><td>Tipo de construcción</td><td>" + esc(r.tipo.nombre) + "</td></tr>" +
      "<tr><td>Área</td><td>" + fmtN0.format(r.area) + " m² por piso × " + r.n + " piso(s) = " + fmtN0.format(r.areaTotal) + " m²</td></tr>" +
      "<tr><td>Irregularidad aparente</td><td>" + irrTxt(r.irr) + "</td></tr></tbody></table>" +
      "<h2>2. Valor del diseño estructural</h2><table><thead><tr><th>Concepto</th><th>Valor</th></tr></thead><tbody>" +
      "<tr><td>Área equivalente de diseño</td><td class='n'>" + fmtN0.format(r.m2eq) + " m² eq</td></tr>" +
      "<tr><td>Cubierto por el cupo mensual del plan</td><td class='n'>" + fmtN0.format(r.consumo) + " m² eq</td></tr>" +
      "<tr><td>Excedente a tarifa preferencial (" + fmtCOP.format(D.plan.tarifaSuscriptor) + "/m² eq)</td><td class='n'>" + fmtN0.format(r.exced) + " m² eq</td></tr>" +
      (r.aplicaMin ? "<tr><td>Valor mínimo por proyecto</td><td class='n'>" + fmtCOP.format(D.plan.minimoSuscriptor) + "</td></tr>" : "") +
      "<tr><td>Subtotal</td><td class='n'>" + fmtCOP.format(r.valor) + "</td></tr>" +
      "<tr><td>IVA " + Math.round(D.plan.iva * 100) + " %</td><td class='n'>" + fmtCOP.format(r.iva) + "</td></tr>" +
      "<tr><td><strong>Total</strong></td><td class='n'><strong>" + fmtCOP.format(r.total) + "</strong></td></tr></tbody></table>" +
      "<h2>3. " + esc(r.tipo.material) + " estimado (conservador)</h2><table><thead><tr><th>Piso</th><th>Área (m²)</th><th>kg/m²</th><th>Peso (kg)</th></tr></thead><tbody>" + pisosRows +
      "<tr><td><strong>Total</strong></td><td class='n'><strong>" + fmtN0.format(r.areaTotal) + "</strong></td><td class='n'><strong>" + fmtN1.format(r.ten.cons) + "</strong></td><td class='n'><strong>" + fmtN0.format(r.kgCons) + "</strong></td></tr></tbody></table>" +
      "<p class='nota'>Valor esperado: " + fmtN1.format(r.ten.esp) + " kg/m² (" + fmtN1.format(r.kgEsp / 1000) + " t). Valor conservador para presupuesto: " + fmtN1.format(r.ten.cons) + " kg/m² (" + fmtN1.format(r.kgCons / 1000) + " t).</p>" +
      "<p class='nota'><strong>Alcance.</strong> Estimado preliminar de orden de magnitud (±25 %) generado por el cotizador Estructura Ágil para la preparación de propuestas. No reemplaza el predimensionamiento ni el diseño estructural conforme a la NSR-10, que NMH Engineering S.A.S. entrega firmado por ingeniero civil con matrícula profesional. Los parámetros de amenaza sísmica y eólica deben confirmarse para el sitio del proyecto. Valores en pesos colombianos.</p>" +
      "<p class='pie-imp'>NMH ENGINEERING S.A.S. · Barranquilla, Atlántico · Contacto: +57 301 797 2967</p>";
    window.print();
  });

  /* ---------- tabla de tenores ---------- */
  function pintarTenores() {
    var V = parseFloat($("t-viento").value);
    var tb = document.querySelector("#tabla-tenores tbody"); tb.innerHTML = "";
    Object.keys(D.tipos).forEach(function (k) {
      var t = D.tipos[k];
      var tr = document.createElement("tr");
      var celdas = [0.10, 0.20, 0.30].map(function (A) {
        var r = tenor(k, A, V, "regular", 1);
        return "<td class='n'><strong>" + fmtN0.format(r.esp) + "</strong><span>" + fmtN0.format(r.cons) + "</span></td>";
      }).join("");
      tr.innerHTML = "<td>" + esc(t.nombre) + "</td><td>" + (t.material === "Acero de refuerzo" ? "Refuerzo" : "Estructural") + "</td>" + celdas;
      tb.appendChild(tr);
    });
  }

  /* ---------- pestañas ---------- */
  var tabs = ["cotizar", "tenores", "plan"];
  function activar(nombre, foco) {
    tabs.forEach(function (n) {
      var t = $("tab-" + n), p = $("p-" + n), on = n === nombre;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      p.hidden = !on;
      if (on && foco) t.focus();
    });
  }
  tabs.forEach(function (n, i) {
    var t = $("tab-" + n);
    t.addEventListener("click", function () { activar(n); });
    t.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") activar(tabs[(i + 1) % tabs.length], true);
      if (e.key === "ArrowLeft") activar(tabs[(i + tabs.length - 1) % tabs.length], true);
    });
  });

  /* ---------- arranque ---------- */
  poblarCiudades(); poblarViento($("f-viento")); poblarViento($("t-viento")); poblarTipos();
  $("t-viento").value = "130";
  alCambiarCiudad(); alCambiarTipo(); pintarTenores();
  $("f-ciudad").addEventListener("change", alCambiarCiudad);
  $("f-aa").addEventListener("input", function () { pintarAmenaza(ciudadSel()); });
  $("f-av").addEventListener("input", function () { pintarAmenaza(ciudadSel()); });
  $("f-tipo").addEventListener("change", alCambiarTipo);
  $("t-viento").addEventListener("change", pintarTenores);
  $("form-cot").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var r = calcular(); if (!r) return;
    pintarResultado(r);
    if (window.matchMedia("(max-width: 979px)").matches) $("resultado").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("pl-cuota").textContent = fmtCOP.format(D.plan.cuotaMensual) + " + IVA al mes";
  $("pl-cupo").textContent = fmtN0.format(D.plan.cupoM2Eq);
  $("pl-horario").textContent = "(" + D.contacto.horario.toLowerCase() + ")";
  $("btn-wa-soporte").href = "https://wa.me/" + D.contacto.whatsapp + "?text=" + encodeURIComponent("Hola NMH, soy suscriptor de Estructura Ágil (" + D.acceso.suscriptor + ") y necesito soporte técnico.");
  $("txt-version").textContent = "· versión " + D.version;
  mostrarApp(leer("sessionStorage", CLAVE_SESION) === "1");
})();
