/* Urban Wings · lógica de la página: tasa BCV, menú, carrito, pagos y pedido por WhatsApp. */
(function () {
  "use strict";

  var CFG = window.UW_CONFIG;
  var MENU = window.UW_MENU;
  var SALSAS = window.UW_SALSAS;
  var RATE_API = "https://ve.dolarapi.com/v1/dolares/oficial";
  var RATE_KEY = "uw-tasa-bcv";
  var CART_KEY = "uw-carrito";

  /* ---------------- utilidades ---------------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key));
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
  }
  var nfUsd = new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function usd(n) { return "$" + nfUsd.format(n); }
  function bsRound(n) { return Math.ceil(n * 100 - 1e-6) / 100; } // nunca de menos
  function bs(n) { return "Bs " + nfUsd.format(bsRound(n)); }
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }
  function waUrl(text) {
    return "https://wa.me/" + CFG.whatsapp + "?text=" + encodeURIComponent(text);
  }

  /* ---------------- tasa BCV ---------------- */
  var rate = { value: null, date: null, state: "idle" };

  function applyRate() {
    var chip = $("#bcvChip");
    chip.dataset.state = rate.state;
    var shown = rate.value ? nfUsd.format(rate.value) : "—";
    $("#bcvValue").textContent = shown;
    $("#calcRate").textContent = shown;
    var when = rate.date ? new Date(rate.date).toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "long" }) : "";
    var meta = {
      loading: "Consultando el BCV…",
      live: "Actualizada · vigente para el " + when,
      cache: "Última tasa guardada (" + when + "). Sin conexión con el BCV.",
      fallback: "Tasa referencial: no se pudo consultar el BCV."
    }[rate.state] || "";
    $("#calcRateMeta").textContent = meta;
    chip.title = "Tasa oficial BCV · " + meta;
    updateCalc();
    $$("[data-bs]").forEach(function (el) {
      var v = parseFloat(el.dataset.bs);
      el.textContent = rate.value && !isNaN(v) ? bs(v * rate.value) : "";
    });
    renderCart();
  }

  function loadRate(manual) {
    var saved = store(RATE_KEY);
    if (saved && saved.value && !rate.value) {
      rate.value = saved.value; rate.date = saved.date; rate.state = "cache";
    }
    if (!rate.value) rate.state = "loading";
    applyRate();
    var btn = $("#rateRefresh");
    btn.classList.add("spinning");

    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 9000);
    fetch(RATE_API, { cache: "no-store", signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        var v = parseFloat(d.promedio || d.venta || d.compra);
        if (!v) throw new Error("sin tasa");
        rate.value = v; rate.date = d.fechaActualizacion || new Date().toISOString(); rate.state = "live";
        store(RATE_KEY, { value: v, date: rate.date });
        if (manual) toast("Tasa BCV actualizada");
      })
      .catch(function () {
        if (!rate.value) { rate.value = CFG.tasaRespaldo; rate.date = null; rate.state = "fallback"; }
        else if (rate.state !== "live") rate.state = saved ? "cache" : "fallback";
        if (manual) toast("No se pudo consultar el BCV");
      })
      .then(function () { clearTimeout(timer); btn.classList.remove("spinning"); applyRate(); });
  }

  function updateCalc() {
    var v = parseFloat($("#calcUsd").value);
    $("#calcBs").textContent = rate.value && v >= 0 ? bs(v * rate.value) : "—";
  }

  /* ---------------- menú ---------------- */
  var sel = {}; // tamaño elegido por producto
  var active = MENU[0].id;

  function findItem(id) {
    for (var c = 0; c < MENU.length; c++) {
      for (var i = 0; i < MENU[c].items.length; i++) if (MENU[c].items[i].id === id) return MENU[c].items[i];
    }
  }
  function itemPrice(item, sizeIdx) {
    return item.sizes ? item.sizes[sizeIdx || 0].price : item.price;
  }
  function priceHtml(p) {
    if (p == null) return '<span class="price-na">Consultar</span>';
    return '<span class="price">' + usd(p) + '</span><span class="price-bs" data-bs="' + p + '">' +
      (rate.value ? bs(p * rate.value) : "") + "</span>";
  }
  function chilis(n) { return n ? ' <span class="chili" title="Picante" aria-label="Picante">' + new Array(n + 1).join("🌶") + "</span>" : ""; }

  function renderTabs() {
    $("#menuTabs").innerHTML = MENU.map(function (c) {
      return '<button type="button" role="tab" class="tab" id="tab-' + c.id + '" data-cat="' + c.id + '" aria-selected="' + (c.id === active) + '">' + esc(c.nombre) + "</button>";
    }).join("");
  }

  function dishHtml(item, i) {
    var s = sel[item.id] || 0;
    var sizes = item.sizes ? '<div class="sizes" role="group" aria-label="Tamaño">' + item.sizes.map(function (z, k) {
      return '<button type="button" class="size" data-size="' + k + '" aria-pressed="' + (k === s) + '">' + esc(z.label) + "</button>";
    }).join("") + "</div>" : "";
    return '<article class="dish" data-id="' + item.id + '" style="--i:' + i + '">' +
      '<div class="flex items-start justify-between gap-3"><h3>' + esc(item.nombre) + chilis(item.picante) + "</h3>" +
      (item.tag ? '<span class="tag shrink-0">' + esc(item.tag) + "</span>" : "") + "</div>" +
      '<p class="desc">' + esc(item.desc) + (item.adult ? ' <span class="adult" title="Solo mayores de 18">+18</span>' : "") + "</p>" +
      sizes +
      '<div class="mt-auto flex items-end justify-between gap-3 pt-2"><div class="flex flex-col gap-1" data-price>' + priceHtml(itemPrice(item, s)) + "</div>" +
      '<button type="button" class="add-btn" data-add aria-label="Agregar ' + esc(item.nombre) + ' al pedido">' +
      '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Agregar</button></div>' +
      "</article>";
  }

  function renderPanel() {
    var cat = MENU.filter(function (c) { return c.id === active; })[0];
    var html = '<p class="mb-8 text-center font-script text-2xl text-gold/90">' + esc(cat.kicker) + "</p>";
    var groups = [];
    cat.items.forEach(function (it) {
      var g = it.group || "";
      if (!groups.length || groups[groups.length - 1].name !== g) groups.push({ name: g, items: [] });
      groups[groups.length - 1].items.push(it);
    });
    var n = 0;
    groups.forEach(function (g) {
      if (g.name) html += '<h3 class="group-title">' + esc(g.name) + "</h3>";
      html += '<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">' + g.items.map(function (it) { return dishHtml(it, n++); }).join("") + "</div>";
    });
    var panel = $("#menuPanel");
    panel.setAttribute("aria-labelledby", "tab-" + active);
    panel.innerHTML = '<div class="panel-enter">' + html + "</div>";
  }

  function setTab(id, scroll) {
    active = id;
    $$("#menuTabs .tab").forEach(function (b) {
      var on = b.dataset.cat === id;
      b.setAttribute("aria-selected", on);
      if (on) b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    });
    renderPanel();
    if (scroll) {
      var top = $("#menu").getBoundingClientRect().top + window.scrollY + 40;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: "smooth" });
    }
  }

  /* ---------------- hoja de opciones ---------------- */
  var sheetItem = null;

  function openSheet(item) {
    sheetItem = item;
    var s = sel[item.id] || 0;
    var h = '<p class="kicker">Personaliza</p><h3 id="optTitle" class="mt-1 font-display text-4xl leading-none">' + esc(item.nombre) + "</h3>" +
      '<p class="mt-2 text-sm text-white/60">' + esc(item.desc) + "</p>";
    if (item.sizes) {
      h += '<fieldset class="mt-6"><legend class="field-label">Tamaño</legend><div class="grid gap-2">' + item.sizes.map(function (z, k) {
        return '<label class="opt"><input type="radio" name="osize" value="' + k + '"' + (k === s ? " checked" : "") + '><span class="flex-1">' + esc(z.label) + '</span><span class="text-gold">' + (z.price == null ? "Consultar" : usd(z.price)) + "</span></label>";
      }).join("") + "</div></fieldset>";
    }
    if (item.choices) {
      var c = item.choices, multi = c.max > 1;
      h += '<fieldset class="mt-6"><legend class="field-label">' + esc(c.label) + "</legend><div class=\"grid grid-cols-2 gap-2\" data-max=\"" + c.max + '">' + c.options.map(function (o, k) {
        return '<label class="opt"><input type="' + (multi ? "checkbox" : "radio") + '" name="ochoice" value="' + esc(o) + '"' + (!multi && k === 0 ? " checked" : "") + "><span>" + esc(o) + "</span></label>";
      }).join("") + "</div></fieldset>";
    }
    h += '<label class="mt-6 block"><span class="field-label">Nota para la cocina (opcional)</span><input class="field" name="onote" maxlength="120" placeholder="Ej: sin cebolla, salsa aparte"></label>' +
      '<div class="mt-6 flex items-center gap-3"><div class="qty"><button type="button" data-q="-1" aria-label="Menos">−</button><span id="oqty">1</span><button type="button" data-q="1" aria-label="Más">+</button></div>' +
      '<button type="button" id="oadd" class="btn-primary flex-1 justify-center">Agregar · <span id="ototal"></span></button></div>';
    $("#optBody").innerHTML = h;
    openLayer("#optSheet");
    sheetTotal();
  }

  function sheetTotal() {
    var b = $("#optBody");
    var k = b.querySelector('input[name="osize"]:checked');
    var p = itemPrice(sheetItem, k ? +k.value : 0);
    var q = +$("#oqty").textContent;
    $("#ototal").textContent = p == null ? "a confirmar" : usd(p * q);
    var wrap = b.querySelector("[data-max]");
    if (wrap && +wrap.dataset.max > 1) {
      var max = +wrap.dataset.max;
      var n = wrap.querySelectorAll("input:checked").length;
      $$("label", wrap).forEach(function (l) {
        var inp = l.querySelector("input");
        l.classList.toggle("disabled", n >= max && !inp.checked);
      });
    }
  }

  /* ---------------- carrito ---------------- */
  var cart = store(CART_KEY) || [];
  var SECTORES = window.UW_SECTORES || [];
  var checkout = { nombre: "", entrega: "delivery", sector: "", direccion: "", pago: "pagoMovil", notas: "" };
  function sectorSel() { return SECTORES.filter(function (s) { return s.nombre === checkout.sector; })[0]; }
  function deliveryCost() {
    var s = checkout.entrega === "delivery" ? sectorSel() : null;
    return s ? s.precio : 0;
  }

  var METHODS = [
    { id: "pagoMovil", label: "Pago Móvil", bs: true, ico: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>', desc: "Desde cualquier banco, al instante." },
    { id: "zelle", label: "Zelle", bs: false, ico: '<path d="M7 6h10L7 18h10"/><path d="M12 3v3M12 18v3"/>', desc: "Pago en dólares desde tu cuenta en EE. UU." },
    { id: "efectivoUsd", label: "Efectivo en dólares", bs: false, ico: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>', desc: "Al retirar o al recibir tu delivery." },
    { id: "efectivoBs", label: "Efectivo en bolívares", bs: true, ico: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M8 9.5h3.2a1.6 1.6 0 0 1 0 3.2H8zm0 3.2h3.6a1.6 1.6 0 0 1 0 3.3H8zM8 9.5V16"/>', desc: "Calculado a la tasa BCV del día." },
    { id: "transferencia", label: "Transferencia bancaria", bs: true, ico: '<path d="M3 9.5 12 4l9 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20.5h18"/>', desc: "Bancos nacionales, en bolívares." },
    { id: "tarjeta", label: "Tarjeta (punto de venta)", bs: true, ico: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/>', desc: "Débito o crédito en el local." }
  ];
  function methodById(id) { return METHODS.filter(function (m) { return m.id === id; })[0]; }

  function saveCart() { store(CART_KEY, cart); }
  function cartTotals() {
    var t = 0, pending = 0, count = 0;
    cart.forEach(function (l) { count += l.qty; if (l.price == null) pending += l.qty; else t += l.price * l.qty; });
    var sub = Math.round(t * 100) / 100, del = deliveryCost();
    return { sub: sub, delivery: del, usd: Math.round((sub + del) * 100) / 100, pending: pending, count: count };
  }

  function addToCart(item, sizeIdx, choices, note, qty) {
    var size = item.sizes ? item.sizes[sizeIdx].label : "";
    var key = [item.id, size, choices.join("+"), note].join("|");
    var line = cart.filter(function (l) { return l.key === key; })[0];
    if (line) line.qty += qty;
    else cart.push({ key: key, id: item.id, nombre: item.nombre, size: size, choices: choices, note: note, price: itemPrice(item, sizeIdx), qty: qty });
    saveCart();
    renderCart();
    var badge = $("#cartCount");
    badge.classList.remove("bump"); void badge.offsetWidth; badge.classList.add("bump");
    toast(item.nombre + " agregado al pedido");
  }

  /* Paso 1: pedido y datos de entrega · Paso 2: pago y comprobante · Paso 3: listo */
  var step = 1;
  var payer = {};       // datos de quien paga (se reinician al cambiar de método)
  var proof = null;     // { file, url }
  var MAX_PROOF = 8 * 1024 * 1024;

  // Datos que debe llenar quien paga, por método
  var PAYER_FIELDS = {
    pagoMovil: [
      { k: "banco", label: "Banco de origen" },
      { k: "telefono", label: "Teléfono que hizo el pago", type: "tel", ph: "0414-0000000" },
      { k: "cedula", label: "Cédula del titular", ph: "V-12345678" },
      { k: "referencia", label: "Número de referencia", ph: "Últimos 6 dígitos" }
    ],
    transferencia: [
      { k: "titular", label: "Titular de la cuenta" },
      { k: "cedula", label: "Cédula del titular", ph: "V-12345678" },
      { k: "banco", label: "Banco de origen" },
      { k: "referencia", label: "Número de referencia" }
    ],
    zelle: [
      { k: "titular", label: "Titular del Zelle" },
      { k: "correo", label: "Correo o teléfono del Zelle" },
      { k: "referencia", label: "Código de confirmación" }
    ],
    efectivoUsd: [{ k: "pagaCon", label: "¿Con cuánto pagas? (para el vuelto)", ph: "Ej: $20", optional: true }],
    efectivoBs: [{ k: "pagaCon", label: "¿Con cuánto pagas? (para el vuelto)", ph: "Ej: Bs 20.000", optional: true }],
    tarjeta: []
  };
  var NEEDS_PROOF = { pagoMovil: true, transferencia: true, zelle: true };

  // Datos del local para cada método (de UW_CONFIG.pagos)
  function localData(id) {
    var P = CFG.pagos;
    return {
      pagoMovil: [["Banco", P.pagoMovil.banco], ["Teléfono", P.pagoMovil.telefono], ["Cédula / RIF", P.pagoMovil.cedula]],
      transferencia: [["Banco", P.transferencia.banco], ["Cuenta", P.transferencia.cuenta], ["Titular", P.transferencia.titular], ["Cédula / RIF", P.transferencia.cedula]],
      zelle: [["Correo", P.zelle.correo], ["Titular", P.zelle.titular]]
    }[id] || [];
  }

  function amountDue(t, m) {
    if (m.bs) {
      if (!rate.value) return { text: "—", copy: "" };
      var v = bsRound(t.usd * rate.value);
      return { text: bs(t.usd * rate.value), copy: v.toFixed(2).replace(".", ",") };
    }
    return { text: usd(t.usd), copy: t.usd.toFixed(2) };
  }

  function stepsHtml() {
    var names = ["Tu pedido", "Pago", "Listo"];
    return '<ol class="steps" aria-label="Pasos">' + names.map(function (n, i) {
      var k = i + 1;
      return '<li class="' + (k < step ? "done" : k === step ? "now" : "") + '"' + (k === step ? ' aria-current="step"' : "") + "><span>" + k + "</span>" + n + "</li>";
    }).join("") + "</ol>";
  }

  function totalsHtml(t, m) {
    var isDel = checkout.entrega === "delivery";
    return (isDel ? '<div class="mb-2 space-y-1 text-sm"><div class="flex justify-between text-white/60"><span>Subtotal</span><span>' + usd(t.sub) + "</span></div>" +
        '<div class="flex justify-between text-white/60"><span>Delivery' + (checkout.sector ? " · " + esc(checkout.sector) : "") + "</span><span>" + (checkout.sector ? usd(t.delivery) : "Elige tu sector") + "</span></div></div>" : "") +
      '<div class="flex items-end justify-between"><span class="text-sm font-bold uppercase tracking-widest text-white/60">Total</span><span class="font-display text-4xl leading-none text-gold">' + usd(t.usd) + "</span></div>" +
      '<div class="mt-1 flex justify-between text-sm"><span class="text-white/45">' + (m.bs ? "A pagar en bolívares" : "Referencia en bolívares") + '</span><span class="font-bold ' + (m.bs ? "text-white" : "text-white/55") + '">' + (rate.value ? bs(t.usd * rate.value) : "—") + "</span></div>" +
      (t.pending ? '<p class="mt-2 text-xs text-gold/80">+ ' + t.pending + " producto(s) con precio por confirmar.</p>" : "");
  }

  function linesHtml(editable) {
    return cart.map(function (l, i) {
      var extra = [l.size].concat(l.choices).filter(Boolean).join(" · ");
      return '<div class="line"><div><p class="font-bold">' + (editable ? "" : l.qty + "× ") + esc(l.nombre) + "</p>" +
        (extra ? '<p class="text-xs text-white/55">' + esc(extra) + "</p>" : "") +
        (l.note ? '<p class="text-xs italic text-white/45">“' + esc(l.note) + "”</p>" : "") + "</div>" +
        '<p class="text-right font-display text-2xl text-gold">' + (l.price == null ? '<span class="price-na">Consultar</span>' : usd(l.price * l.qty)) + "</p>" +
        (editable ? '<div class="qty"><button type="button" data-line="' + i + '" data-d="-1" aria-label="Quitar uno">−</button><span>' + l.qty + '</span><button type="button" data-line="' + i + '" data-d="1" aria-label="Agregar uno">+</button></div>' +
          '<button type="button" class="justify-self-end text-xs font-bold uppercase tracking-wider text-white/40 hover:text-fire" data-line="' + i + '" data-d="x">Quitar</button>' : "") +
        "</div>";
    }).join("");
  }

  function renderStep1(body, foot, t, m) {
    body.innerHTML = stepsHtml() + linesHtml(true) +
      '<div class="mt-6 space-y-5">' +
      '<label class="block"><span class="field-label">Tu nombre</span><input class="field" data-ck="nombre" maxlength="60" autocomplete="name" value="' + esc(checkout.nombre) + '"></label>' +
      '<div><span class="field-label">Entrega</span><div class="seg">' +
      '<label><input type="radio" name="entrega" value="delivery" data-ck="entrega"' + (checkout.entrega === "delivery" ? " checked" : "") + ">Delivery</label>" +
      '<label><input type="radio" name="entrega" value="retiro" data-ck="entrega"' + (checkout.entrega === "retiro" ? " checked" : "") + ">Retiro en local</label></div></div>" +
      (checkout.entrega === "delivery" ?
        '<label class="block"><span class="field-label">Sector</span><select class="field" data-ck="sector"><option value="">Elige tu sector…</option>' + SECTORES.map(function (s) {
          return '<option value="' + esc(s.nombre) + '"' + (s.nombre === checkout.sector ? " selected" : "") + ">" + esc(s.nombre) + " · " + usd(s.precio) + "</option>";
        }).join("") + "</select></label>" +
        '<label class="block"><span class="field-label">Dirección</span><textarea class="field" rows="2" data-ck="direccion" maxlength="200" placeholder="Calle, casa o edificio, punto de referencia">' + esc(checkout.direccion) + "</textarea></label>" : "") +
      '<fieldset><legend class="field-label">Método de pago</legend><div class="paygrid">' + METHODS.map(function (x) {
        return '<label class="paytile"><input type="radio" name="pago" value="' + x.id + '" data-ck="pago"' + (x.id === checkout.pago ? " checked" : "") + ">" +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + x.ico + "</svg>" +
          "<b>" + esc(x.label) + '</b><small>' + (x.bs ? "Bolívares" : "Dólares") + "</small></label>";
      }).join("") + "</div></fieldset>" +
      '<label class="block"><span class="field-label">Notas (opcional)</span><input class="field" data-ck="notas" maxlength="160" value="' + esc(checkout.notas) + '"></label></div>';

    foot.innerHTML = totalsHtml(t, m) +
      '<button type="button" id="toPay" class="btn-complete mt-4">Siguiente <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>';
  }

  function renderStep2(body, foot, t, m) {
    var due = amountDue(t, m);
    var rows = localData(m.id);
    var fields = PAYER_FIELDS[m.id] || [];
    var delivery = checkout.entrega === "delivery" ? "Delivery · " + esc(checkout.sector) + (checkout.direccion ? "<br><span class=\"text-white/50\">" + esc(checkout.direccion) + "</span>" : "") : "Retiro en local";

    var h = stepsHtml() +
      '<button type="button" class="back-link" data-back>← Editar pedido</button>' +
      '<section class="sum-card"><h3 class="sum-title">Resumen</h3>' + linesHtml(false) +
      '<dl class="sum-meta"><dt>Cliente</dt><dd>' + esc(checkout.nombre) + "</dd><dt>Entrega</dt><dd>" + delivery + "</dd>" +
      (checkout.notas ? "<dt>Notas</dt><dd>" + esc(checkout.notas) + "</dd>" : "") + "</dl></section>";

    // Monto y datos del local
    h += '<section class="sum-card mt-4"><h3 class="sum-title">Paga con ' + esc(m.label) + "</h3>" +
      '<div class="due"><span>Monto a pagar</span><strong>' + due.text + "</strong>" +
      (due.copy ? '<button type="button" class="copy" data-copy="' + due.copy + '">Copiar</button>' : "") + "</div>";
    if (rows.length) {
      h += '<ul class="copy-list">' + rows.map(function (r) {
        return "<li><span>" + esc(r[0]) + "</span>" + (r[1]
          ? "<b>" + esc(r[1]) + '</b><button type="button" class="copy" data-copy="' + esc(r[1]) + '">Copiar</button>'
          : '<b class="text-white/35">Por configurar</b>') + "</li>";
      }).join("") + "</ul>";
    } else {
      h += '<p class="mt-3 text-sm text-white/60">' + (m.id === "tarjeta" ? "Pagas con tu tarjeta en el punto de venta al retirar o al recibir el pedido." : "Pagas en efectivo al retirar o al recibir tu pedido.") + "</p>";
    }
    if (m.bs && rate.value) h += '<p class="mt-3 text-xs text-white/45">Tasa BCV ' + nfUsd.format(rate.value) + " Bs/$.</p>";
    h += "</section>";

    // Datos de quien paga + comprobante
    if (fields.length || NEEDS_PROOF[m.id]) {
      h += '<section class="sum-card mt-4"><h3 class="sum-title">' + (NEEDS_PROOF[m.id] ? "Datos de tu pago" : "Un detalle más") + '</h3><div class="space-y-4">' +
        fields.map(function (f) {
          return '<label class="block"><span class="field-label">' + esc(f.label) + "</span>" +
            '<input class="field" data-payer="' + f.k + '" type="' + (f.type || "text") + '" maxlength="80"' + (f.ph ? ' placeholder="' + esc(f.ph) + '"' : "") +
            (f.optional ? "" : " required") + ' value="' + esc(payer[f.k] || "") + '"></label>';
        }).join("");
      if (NEEDS_PROOF[m.id]) {
        h += '<div><span class="field-label">Comprobante de pago</span>' +
          '<label class="drop' + (proof ? " has-file" : "") + '" id="drop">' +
          '<input type="file" id="proofInput" accept="image/*,application/pdf" class="sr-only">' +
          (proof
            ? (proof.url ? '<img src="' + proof.url + '" alt="Vista previa del comprobante">' : '<span class="drop-pdf">PDF</span>') +
              '<span class="drop-name">' + esc(proof.file.name) + '</span><button type="button" class="drop-x" data-remove-proof aria-label="Quitar comprobante">✕</button>'
            : '<svg viewBox="0 0 24 24" class="h-8 w-8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M6 10l6-6 6 6M4 20h16"/></svg>' +
              "<b>Subir comprobante de pago</b><small>Captura o PDF · máx. 8 MB</small>") +
          "</label></div>";
      }
      h += "</div></section>";
    }
    body.innerHTML = h;

    foot.innerHTML = '<div class="flex items-end justify-between"><span class="text-sm font-bold uppercase tracking-widest text-white/60">Total</span><span class="text-right"><span class="font-display text-3xl leading-none text-gold">' + usd(t.usd) + '</span> <span class="text-xs font-bold text-white/55">' + (rate.value ? bs(t.usd * rate.value) : "") + "</span></span></div>" +
      '<p id="completeHint" class="mt-3 text-center text-xs text-white/45"></p>' +
      '<button type="button" id="completeOrder" class="btn-complete mt-2" disabled>Confirmar pedido ' +
      '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>';
    updateComplete();
  }

  function renderStep3(body, foot) {
    body.innerHTML = stepsHtml() +
      '<div class="grid justify-items-center gap-4 py-10 text-center">' +
      '<span class="ok-badge"><svg viewBox="0 0 24 24" class="h-10 w-10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>' +
      '<p class="font-display text-4xl leading-none">¡Pedido confirmado!</p>' +
      '<p class="max-w-xs text-sm text-white/60">Abrimos WhatsApp con tu pedido y los datos del pago. Solo envía el mensaje' +
      (proof ? " y adjunta tu comprobante en el chat." : ".") + "</p>" +
      (proof && navigator.canShare && navigator.canShare({ files: [proof.file] }) ? '<button type="button" class="btn-ghost" data-share-proof>Compartir comprobante</button>' : "") +
      '<button type="button" class="text-xs font-bold uppercase tracking-widest text-gold underline-offset-4 hover:underline" data-reopen-wa>Abrir WhatsApp de nuevo</button></div>';
    foot.innerHTML = '<button type="button" class="btn-complete" data-new-order>Hacer otro pedido</button>';
  }

  function missingForPay() {
    var m = methodById(checkout.pago);
    var miss = (PAYER_FIELDS[m.id] || []).filter(function (f) { return !f.optional && !(payer[f.k] || "").trim(); });
    if (miss.length) return miss.length === 1 ? "Falta: " + miss[0].label.toLowerCase() + "." : "Faltan " + miss.length + " datos de tu pago.";
    if (NEEDS_PROOF[m.id] && !proof) return "Sube el comprobante de pago para continuar.";
    return "";
  }

  function updateComplete() {
    var btn = $("#completeOrder");
    if (!btn) return;
    var miss = missingForPay();
    btn.disabled = !!miss;
    $("#completeHint").textContent = miss;
  }

  function setProof(file) {
    if (!file) return;
    if (!/^image\/|application\/pdf/.test(file.type)) return toast("Sube una imagen o un PDF");
    if (file.size > MAX_PROOF) return toast("El archivo pesa más de 8 MB");
    if (proof && proof.url) URL.revokeObjectURL(proof.url);
    proof = { file: file, url: /^image\//.test(file.type) ? URL.createObjectURL(file) : "" };
    renderCart();
  }

  function renderCart() {
    var t = cartTotals();
    var badge = $("#cartCount");
    badge.hidden = !t.count;
    badge.textContent = t.count;
    var calcCart = $("#calcCart");
    calcCart.hidden = !t.usd;
    calcCart.textContent = "Mi pedido (" + usd(t.usd) + ")";
    calcCart.dataset.v = t.usd;

    var body = $("#cartBody"), foot = $("#cartFoot");
    if (!body) return;
    if (step === 3) return renderStep3(body, foot);
    if (!cart.length) {
      step = 1;
      body.innerHTML = '<div class="grid h-full place-content-center justify-items-center gap-4 py-16 text-center"><img src="assets/img/logo.png" alt="" class="h-20 w-20 opacity-60"><p class="font-display text-3xl">Tu pedido está vacío</p><p class="max-w-[240px] text-sm text-white/55">Explora el menú y agrega lo que se te antoje.</p><button type="button" class="btn-ghost mt-2" data-goto-menu>Ver menú</button></div>';
      foot.innerHTML = "";
      return;
    }
    var m = methodById(checkout.pago);
    if (step === 2) renderStep2(body, foot, t, m);
    else renderStep1(body, foot, t, m);
  }

  function orderMessage() {
    var t = cartTotals();
    var m = methodById(checkout.pago);
    var L = ["*Nuevo pedido · Urban Wings*", ""];
    if (checkout.nombre) L.push("Cliente: " + checkout.nombre);
    L.push("Entrega: " + (checkout.entrega === "delivery" ? "Delivery" : "Retiro en local"));
    if (checkout.entrega === "delivery") {
      L.push("Sector: " + checkout.sector);
      if (checkout.direccion) L.push("Dirección: " + checkout.direccion);
    }
    L.push("");
    cart.forEach(function (l) {
      var extra = [l.size].concat(l.choices).filter(Boolean).join(", ");
      L.push("• " + l.qty + "x " + l.nombre + (extra ? " (" + extra + ")" : "") + " — " + (l.price == null ? "precio por confirmar" : usd(l.price * l.qty)));
      if (l.note) L.push("   Nota: " + l.note);
    });
    L.push("");
    if (checkout.entrega === "delivery") {
      L.push("Subtotal: " + usd(t.sub));
      L.push("Delivery (" + checkout.sector + "): " + usd(t.delivery));
    }
    L.push("*Total: " + usd(t.usd) + "*" + (t.pending ? " + productos por confirmar" : ""));
    if (rate.value) L.push("Equivalente: " + bs(t.usd * rate.value) + " (tasa BCV " + nfUsd.format(rate.value) + ")");
    if (checkout.notas) L.push("Notas: " + checkout.notas);
    L.push("");
    L.push("*Pago: " + m.label + "* — " + amountDue(t, m).text);
    (PAYER_FIELDS[m.id] || []).forEach(function (f) {
      if ((payer[f.k] || "").trim()) L.push(f.label + ": " + payer[f.k].trim());
    });
    if (NEEDS_PROOF[m.id]) L.push("Comprobante: lo adjunto en este chat 📎");
    return L.join("\n");
  }

  /* ---------------- capas (hoja / carrito) ---------------- */
  var lastFocus = null;
  function openLayer(sel) {
    lastFocus = document.activeElement;
    var el = $(sel);
    el.hidden = false;
    document.body.classList.add("lock");
    var f = el.querySelector("input, button:not([data-close]), select") || el.querySelector("button");
    if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 50);
  }
  function closeLayer(el) {
    el.hidden = true;
    if ($("#optSheet").hidden && $("#cart").hidden) document.body.classList.remove("lock");
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  /* ---------------- secciones estáticas ---------------- */
  function renderSalsas() {
    $("#salsasGrid").innerHTML = SALSAS.map(function (s, i) {
      return '<article class="sauce reveal" style="--c:' + s.color + ";transition-delay:" + i * 70 + 'ms">' +
        '<img src="assets/img/salsa-' + s.id + '.jpg" alt="Alita bañada en salsa ' + esc(s.nombre) + '" loading="lazy">' +
        '<span class="sauce-type">' + esc(s.tipo) + "</span>" +
        '<div class="sauce-info"><h3>' + esc(s.nombre) + chilis(s.picante) + "</h3><p>" + esc(s.desc) + "</p></div></article>";
    }).join("");
  }

  function renderPagos() {
    var P = CFG.pagos;
    function row(label, val) {
      return val ? "<dt>" + label + "</dt><dd>" + esc(val) + ' <button type="button" class="copy" data-copy="' + esc(val) + '">Copiar</button></dd>' : "";
    }
    var data = {
      pagoMovil: row("Banco", P.pagoMovil.banco) + row("Teléfono", P.pagoMovil.telefono) + row("Cédula", P.pagoMovil.cedula),
      transferencia: row("Banco", P.transferencia.banco) + row("Cuenta", P.transferencia.cuenta) + row("Titular", P.transferencia.titular) + row("Cédula", P.transferencia.cedula),
      zelle: row("Correo", P.zelle.correo) + row("Titular", P.zelle.titular)
    };
    $("#payMethods").innerHTML = METHODS.map(function (m) {
      var d = data[m.id];
      var needsData = m.id in data;
      return '<div class="pay"><span class="pay-ico"><svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + m.ico + "</svg></span>" +
        '<div class="min-w-0"><h3>' + esc(m.label) + '</h3><p class="mt-1 text-sm text-white/55">' + esc(m.desc) + "</p>" +
        '<span class="cur ' + (m.bs ? "bs" : "usd") + '">' + (m.bs ? "Bolívares · tasa BCV" : "Dólares") + "</span>" +
        (d ? "<dl>" + d + "</dl>" : needsData ? '<p class="mt-2 text-xs text-white/40">Te enviamos los datos al confirmar tu pedido.</p>' : "") +
        "</div></div>";
    }).join("");
  }

  function renderFooter() {
    var waNice = "+" + CFG.whatsapp.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})$/, "$1 $2-$3-$4");
    $("#waDisplay").textContent = waNice;
    var ig = "https://instagram.com/" + CFG.instagram;
    $("#igLink").href = ig; $("#igIcon").href = ig;
    $("#igHandle").textContent = CFG.instagram;
    $("#addressLine").textContent = [CFG.direccion, CFG.ciudad].filter(Boolean).join(" · ");
    var hours = CFG.horarios.map(function (h) {
      return '<li class="flex justify-between gap-4 border-b border-white/5 pb-2"><span class="text-white/55">' + esc(h.dias) + '</span><span class="font-semibold ' + (/cerrado/i.test(h.horas) ? "text-fire" : "text-white") + '">' + esc(h.horas) + "</span></li>";
    }).join("");
    $("#hoursList").innerHTML = hours;
    $("#mapHours").innerHTML = hours;
    var q = encodeURIComponent(CFG.mapa || CFG.ciudad);
    $("#mapFrame").src = "https://www.google.com/maps?q=" + q + "&z=15&output=embed";
    $("#mapLink").href = "https://www.google.com/maps/search/?api=1&query=" + q;
    $("#mapAddress").textContent = [CFG.direccion, CFG.ciudad].filter(Boolean).join(", ");
    $("#year").textContent = new Date().getFullYear();
  }

  function embers() {
    var box = $("#embers"), n = window.innerWidth < 640 ? 18 : 34, h = "";
    for (var i = 0; i < n; i++) {
      h += '<i style="left:' + (Math.random() * 100).toFixed(1) + "%;--s:" + (2 + Math.random() * 5).toFixed(1) + "px;--d:" + (6 + Math.random() * 8).toFixed(1) + "s;--delay:" + (-Math.random() * 12).toFixed(1) + "s;--x:" + (Math.random() * 160 - 80).toFixed(0) + 'px"></i>';
    }
    box.innerHTML = h;
  }

  function heroVideo() {
    var v = $("#heroVideo"), s = v.querySelector("source");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { v.remove(); return; }
    s.src = s.dataset.src;
    s.addEventListener("error", function () { v.remove(); }); // sin video: queda el fondo animado
    v.addEventListener("canplay", function () { v.classList.add("ready"); v.play().catch(function () {}); });
    v.load();
  }

  /* ---------------- eventos ---------------- */
  function bind() {
    $("#menuTabs").addEventListener("click", function (e) {
      var b = e.target.closest(".tab");
      if (b) setTab(b.dataset.cat, true);
    });
    $("#menuTabs").addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var tabs = $$("#menuTabs .tab"), i = tabs.indexOf(document.activeElement);
      var n = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      n.focus(); setTab(n.dataset.cat, false);
    });

    $("#menuPanel").addEventListener("click", function (e) {
      var card = e.target.closest(".dish");
      if (!card) return;
      var item = findItem(card.dataset.id);
      var sz = e.target.closest(".size");
      if (sz) {
        sel[item.id] = +sz.dataset.size;
        $$(".size", card).forEach(function (b) { b.setAttribute("aria-pressed", b === sz); });
        card.querySelector("[data-price]").innerHTML = priceHtml(itemPrice(item, sel[item.id]));
        return;
      }
      var add = e.target.closest("[data-add]");
      if (!add) return;
      if (item.choices) return openSheet(item);
      addToCart(item, sel[item.id] || 0, [], "", 1);
      add.classList.add("done");
      setTimeout(function () { add.classList.remove("done"); }, 900);
    });

    var sheet = $("#optSheet");
    sheet.addEventListener("change", sheetTotal);
    sheet.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) return closeLayer(sheet);
      var q = e.target.closest("[data-q]");
      if (q) {
        var el = $("#oqty");
        el.textContent = Math.max(1, Math.min(50, +el.textContent + +q.dataset.q));
        return sheetTotal();
      }
      if (e.target.closest("#oadd")) {
        var b = $("#optBody");
        var k = b.querySelector('input[name="osize"]:checked');
        var choices = $$('input[name="ochoice"]:checked', b).map(function (i) { return i.value; });
        if (sheetItem.choices && !choices.length) return toast("Elige al menos una opción");
        var idx = k ? +k.value : 0;
        sel[sheetItem.id] = idx;
        addToCart(sheetItem, idx, choices, b.querySelector('[name="onote"]').value.trim(), +$("#oqty").textContent);
        closeLayer(sheet);
        renderPanel();
      }
    });

    var drawer = $("#cart");
    function goStep(n) { step = n; renderCart(); $("#cartBody").scrollTop = 0; }
    $("#cartBtn").addEventListener("click", function () { if (step === 3) step = 1; renderCart(); openLayer("#cart"); });
    drawer.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) return closeLayer(drawer);
      if (e.target.closest("[data-goto-menu]")) { closeLayer(drawer); return $("#menu").scrollIntoView({ behavior: "smooth" }); }
      var b = e.target.closest("[data-line]");
      if (b) {
        var i = +b.dataset.line;
        if (b.dataset.d === "x") cart.splice(i, 1);
        else { cart[i].qty += +b.dataset.d; if (cart[i].qty < 1) cart.splice(i, 1); }
        saveCart(); renderCart();
        return;
      }
      var cp = e.target.closest("[data-copy]");
      if (cp) {
        e.preventDefault();
        (navigator.clipboard ? navigator.clipboard.writeText(cp.dataset.copy) : Promise.reject())
          .then(function () {
            toast("Copiado: " + cp.dataset.copy);
            cp.textContent = "✓ Copiado"; cp.classList.add("ok");
            setTimeout(function () { cp.textContent = "Copiar"; cp.classList.remove("ok"); }, 1600);
          }, function () { toast("No se pudo copiar"); });
        return;
      }
      if (e.target.closest("[data-back]")) return goStep(1);
      if (e.target.closest("[data-remove-proof]")) {
        e.preventDefault();
        if (proof && proof.url) URL.revokeObjectURL(proof.url);
        proof = null;
        return renderCart();
      }
      if (e.target.closest("#toPay")) {
        var problem = !checkout.nombre.trim() ? ["nombre", "Escribe tu nombre"]
          : checkout.entrega === "delivery" && !checkout.sector ? ["sector", "Elige tu sector para el delivery"]
          : checkout.entrega === "delivery" && !checkout.direccion.trim() ? ["direccion", "Escribe la dirección del delivery"] : null;
        if (problem) {
          toast(problem[1]);
          var f = drawer.querySelector('[data-ck="' + problem[0] + '"]'); if (f) f.focus();
          return;
        }
        return goStep(2);
      }
      if (e.target.closest("#completeOrder")) {
        if (missingForPay()) return;
        window.open(waUrl(orderMessage()), "_blank", "noopener");
        return goStep(3);
      }
      if (e.target.closest("[data-reopen-wa]")) return window.open(waUrl(orderMessage()), "_blank", "noopener");
      if (e.target.closest("[data-share-proof]")) {
        navigator.share({ files: [proof.file], title: "Comprobante · Urban Wings" }).catch(function () {});
        return;
      }
      if (e.target.closest("[data-new-order]")) {
        cart = []; saveCart(); payer = {};
        if (proof && proof.url) URL.revokeObjectURL(proof.url);
        proof = null; checkout.notas = "";
        closeLayer(drawer);
        goStep(1);
      }
    });
    drawer.addEventListener("input", function (e) {
      var k = e.target.dataset.ck;
      if (k && e.target.type !== "radio" && e.target.tagName !== "SELECT") checkout[k] = e.target.value;
      var p = e.target.dataset.payer;
      if (p) { payer[p] = e.target.value; updateComplete(); }
    });
    drawer.addEventListener("change", function (e) {
      var k = e.target.dataset.ck;
      if (k === "pago" && e.target.value !== checkout.pago) { payer = {}; proof = null; }
      if (k === "entrega" || k === "pago" || k === "sector") { checkout[k] = e.target.value; renderCart(); }
      if (e.target.id === "proofInput") setProof(e.target.files[0]);
    });
    ["dragover", "dragleave", "drop"].forEach(function (ev) {
      drawer.addEventListener(ev, function (e) {
        var d = e.target.closest && e.target.closest("#drop");
        if (!d) return;
        e.preventDefault();
        d.classList.toggle("over", ev === "dragover");
        if (ev === "drop") setProof(e.dataTransfer.files[0]);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (!sheet.hidden) closeLayer(sheet);
      else if (!drawer.hidden) closeLayer(drawer);
    });

    $("#calcUsd").addEventListener("input", updateCalc);
    $("#calcQuick").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      $("#calcUsd").value = b.dataset.v;
      updateCalc();
    });
    $("#rateRefresh").addEventListener("click", function () { loadRate(true); });
    $("#bcvChip").addEventListener("click", function () { $("#pagos").scrollIntoView({ behavior: "smooth" }); });

    $("#payMethods").addEventListener("click", function (e) {
      var c = e.target.closest("[data-copy]");
      if (!c) return;
      (navigator.clipboard ? navigator.clipboard.writeText(c.dataset.copy) : Promise.reject())
        .then(function () { toast("Copiado: " + c.dataset.copy); }, function () { toast("No se pudo copiar"); });
    });

    var toggle = $("#menuToggle"), nav = $("#mobileNav");
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", open);
      nav.classList.toggle("open", open);
      $("#header").classList.add("scrolled");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { toggle.setAttribute("aria-expanded", "false"); nav.classList.remove("open"); }
    });

    var header = $("#header");
    function onScroll() { header.classList.toggle("scrolled", window.scrollY > 30 || nav.classList.contains("open")); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function observers() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach(function (el) { io.observe(el); });

    var links = $$(".nav-link");
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["menu", "salsas", "nosotros", "pagos", "ubicacion", "contacto"].forEach(function (id) { spy.observe(document.getElementById(id)); });
  }

  /* ---------------- inicio ---------------- */
  renderTabs();
  renderPanel();
  renderSalsas();
  renderPagos();
  renderFooter();
  embers();
  bind();
  observers();
  renderCart();
  loadRate(false);
  setInterval(loadRate, 30 * 60 * 1000);
  heroVideo();

  function done() { document.body.classList.add("loaded"); }
  if (document.readyState === "complete") setTimeout(done, 300);
  else window.addEventListener("load", function () { setTimeout(done, 300); });
  setTimeout(done, 3500);
})();
