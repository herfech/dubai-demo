'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const WA = document.body.dataset.wa, WA_RES = document.body.dataset.waReservas || document.body.dataset.wa, LOCAL = document.body.dataset.local, CLAVE = 'dubai_carrito_v3';
  const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' XAF';   // siempre con punto de millar (también 2.000)
  // Iconos de las tarjetas. El administrador puede elegir uno por categoría; si no, se deduce del nombre; si no, rombo.
  const ICONOS = {
    coctel: '<path d="M4 5h16l-8 9z"/><path d="M12 14v6M8 20h8"/>',
    botella: '<path d="M10 3h4v4c0 1.2 2 2 2 4v8.5a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 19.5V11c0-2 2-2.8 2-4z"/><path d="M8 14h8"/>',
    vaso: '<path d="M6 4h12l-1.5 16h-9z"/><path d="M7 9h10M14 4l2-2"/>',
    cachimba: '<path d="M12 2c1.6 1.6-1.6 2.4 0 4"/><path d="M10 8h4l1 3h-6z"/><path d="M9 11c-3 2-3 8 3 8s6-6 3-8"/><path d="M12 19v2M8 21h8"/>',
    comida: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10"/><path d="M17 3c-2 1-3 4-3 7h3v11"/>',
    //promocion: '<path d="M3 3h8l10 10-8 8L3 11z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
    estrella: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    regalo: '<path d="M3 8h18v4H3z"/><path d="M5 12v9h14v-9M12 8v13"/><path d="M12 8C9 8 7.5 6 8.5 4.5S12 4.5 12 8zM12 8c3 0 4.5-2 3.5-3.5S12 4.5 12 8z"/>',
    rombo: '<path d="M12 3l8 9-8 9-8-9z"/>'
  };
  const ICONO_SLUG = { cocteles: 'coctel', botellas: 'botella', licores: 'botella', bebidas: 'vaso', cachimbas: 'cachimba', comida: 'comida',
                       promocion: 'promocion', promociones: 'promocion', oferta: 'promocion', ofertas: 'promocion', combo: 'promocion', combos: 'promocion' };
  const ARTE_ICONO = { coctel: 'cocteles', botella: 'botellas', vaso: 'bebidas', cachimba: 'cachimbas', comida: 'comida', promocion: 'promocion', estrella: 'promocion', regalo: 'promocion', rombo: 'base' };
  const iconoDe = (c) => (c.icono && ICONOS[c.icono] ? c.icono : ICONO_SLUG[c.slug]) || 'rombo';
  let productos = [], categorias = [], carrito = {}, sel = null;
  const etiquetaMesa = (m) => /^\d/.test(m) ? 'Mesa ' + m : m;
  // La mesa llega por el QR de cada mesa (?mesa=5). Solo se acepta un nombre corto y limpio; dura lo que dure la visita.
  let mesa = null;
  try {
    const bueno = (v) => !!v && /^[\p{L}\p{N} _.-]{1,20}$/u.test(v.trim());
    const q = new URLSearchParams(location.search).get('mesa'), prev = JSON.parse(sessionStorage.getItem('dubai_mesa') || 'null');
    if (bueno(q)) {
      mesa = q.trim();
      if (!prev || prev.m !== mesa) { try { localStorage.removeItem(CLAVE); } catch (_) {} }   // otra mesa: pedido en blanco
      sessionStorage.setItem('dubai_mesa', JSON.stringify({ m: mesa, t: Date.now() }));
    } else if (prev && Date.now() - prev.t < 6 * 3600 * 1000 && bueno(prev.m)) mesa = prev.m;
  } catch (_) {}
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && Date.now() - g.t < 12 * 3600 * 1000) carrito = g.c || {}; } catch (_) {}
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify({ t: Date.now(), c: carrito })); } catch (_) {} };
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const icono = (c) => { const i = el('i', 'ico'); i.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONOS[iconoDe(c)] + '</svg>'; return i; };   // solo textos fijos del propio código

  // Aparición suave al hacer scroll
  function revelar() {
    const items = document.querySelectorAll('.rev:not(.in)');
    if (!('IntersectionObserver' in window)) { items.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px' });
    items.forEach(e => io.observe(e));
  }

  // ---------- Datos del carrito (clave "id" o "id:opcion") ----------
  const lineas = () => Object.entries(carrito).map(([k, q]) => {
    const [pid, oid] = k.split(':'), p = productos.find(x => x.id == pid);
    if (!p) return null;
    let o = null; if (oid === 'b' && p.opcion_base) o = { id: 'b', nombre: p.opcion_base, precio: p.precio }; else if (oid) { o = p.opciones.find(x => x.id == oid); if (!o) return null; }
    return { k, p, o, q };
  }).filter(Boolean);
  const total = () => lineas().reduce((s, l) => s + (l.o ? l.o.precio : l.p.precio) * l.q, 0);
  const cantProd = (id) => lineas().filter(l => l.p.id === id).reduce((s, l) => s + l.q, 0);

  async function cargar() {
    try {
      const r = await fetch(document.body.dataset.api || 'api/obtener_productos.php');
      if (!r.ok) throw new Error();
      const d = await r.json(); categorias = d.categorias; productos = d.productos;
      const ok = new Set(lineas().map(l => l.k)); Object.keys(carrito).forEach(k => { if (!ok.has(k)) delete carrito[k]; });
      armarArbol(); pintarTiles(); pintarVista(); pintarBarra();
    } catch (_) { $('tiles').replaceChildren(el('p', 'estado', 'No se pudo cargar la carta. Comprueba tu conexión e inténtalo de nuevo.')); }
  }

  // ---------- Árbol de categorías: principales y subcategorías (solo se muestran las que tienen productos) ----------
  let mapa = {}, raices = [];
  function armarArbol() {
    mapa = {}; categorias.forEach(c => { mapa[c.slug] = { ...c, hijos: [], directos: productos.filter(p => p.categoria === c.slug).length }; });
    raices = [];
    categorias.forEach(c => { const n = mapa[c.slug]; if (c.padre && mapa[c.padre]) mapa[c.padre].hijos.push(n); else raices.push(n); });
    Object.values(mapa).forEach(n => { n.total = n.directos + n.hijos.reduce((s, h) => s + h.directos, 0); });
    Object.values(mapa).forEach(n => { n.hijos = n.hijos.filter(h => h.total > 0); });
    raices = raices.filter(n => n.total > 0);
  }
  const txtProductos = (n) => n + (n === 1 ? ' producto' : ' productos');

  function pintarTiles() {
    const t = $('tiles'); t.replaceChildren();
    raices.forEach((c, i) => {
      const b = el('button', 'tile rev'); b.type = 'button'; b.style.setProperty('--h', String(25 + i * 42));
      if (c.imagen) b.style.backgroundImage = `url("${c.imagen}")`;
      const n = el('span', 'nom', c.nombre); n.append(el('small', null, txtProductos(c.total)));
      b.append(icono(c), n); b.onclick = () => { location.hash = '#/' + c.slug; };
      t.append(b);
    });
    if (!raices.length) t.append(el('p', 'estado', 'La carta estará disponible muy pronto.'));
    revelar();
  }

  function filaProducto(p) {
    const fila = el('article', 'prod rev' + (p.imagen ? '' : ' sin-foto'));
    if (p.imagen) { const i = el('img'); i.src = p.imagen; i.alt = p.nombre; i.loading = 'lazy'; i.width = i.height = 84; fila.append(i); }
    const info = el('div'); info.append(el('h3', null, p.nombre));
    if (p.descripcion) info.append(el('p', null, p.descripcion));
    if (p.opciones.length && p.opcion_base) {   // p. ej. Botella 45.000 XAF · Chupito 2.000 · Chato 3.500
      info.append(el('span', 'precio', p.opcion_base + ' ' + fmt(p.precio)));
      info.append(el('p', 'pres', p.opciones.slice(0, 3).map(o => o.nombre + ' ' + fmt(o.precio)).join(' · ') + (p.opciones.length > 3 ? ' …' : '')));
    } else if (p.opciones.length) {             // p. ej. cachimba: un precio por sabor
      const pr = p.opciones.map(o => o.precio), mn = Math.min(...pr), mx = Math.max(...pr);
      info.append(el('span', 'precio', (mn === mx ? '' : 'desde ') + fmt(mn)));
    } else info.append(el('span', 'precio', fmt(p.precio)));
    const cant = el('div', 'cant');
    if (p.opciones.length) {
      const n = cantProd(p.id);
      const b = el('button', 'btn-elegir', 'Elegir ' + p.opcion_titulo.toLowerCase() + (n ? ' · ' + n : ''));
      b.onclick = () => abrirSel(p); cant.append(b);
    } else {
      const k = String(p.id), q = carrito[k] || 0;
      if (q > 0) { const m = el('button', null, '−'); m.setAttribute('aria-label', 'Quitar uno de ' + p.nombre); m.onclick = () => cambiar(k, -1); cant.append(m, el('span', null, q)); }
      const a = el('button', 'mas', '+'); a.setAttribute('aria-label', 'Añadir ' + p.nombre); a.onclick = () => cambiar(k, 1); cant.append(a);
    }
    fila.append(info, cant); return fila;
  }

  // Fondo suave de la categoría: su foto (o la de su categoría principal) o un dibujo dorado de fábrica
  function fondo(n) {
    const f = $('fondoCat'), c = f.firstElementChild;
    if (!n) { f.hidden = true; return; }
    const padre = n.padre ? mapa[n.padre] : null, img = n.imagen || (padre && padre.imagen);
    f.hidden = false; c.className = 'capa'; c.style.backgroundImage = '';
    if (img) { c.classList.add('foto'); c.style.backgroundImage = `url("${img}")`; }
    else c.classList.add('art-' + (ARTE_ICONO[iconoDe(padre || n)] || 'base'));
    requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add('on')));
  }

  const ruta = () => decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  function pintarVista() {
    const n = mapa[ruta()], ver = !!n && n.total > 0;
    $('inicio').hidden = $('categorias').hidden = ver; $('vista').hidden = !ver;
    fondo(ver ? n : null);
    if (!ver) return;
    const padre = n.padre ? mapa[n.padre] : null, hermanos = padre ? padre.hijos : raices;
    $('tituloCat').textContent = n.nombre; $('migas').textContent = padre ? padre.nombre : ''; $('migas').hidden = !padre;
    const chips = $('chips'); chips.replaceChildren();
    hermanos.forEach(c => { const b = el('button', null, c.nombre); b.type = 'button'; b.setAttribute('aria-pressed', String(c.slug === n.slug)); b.onclick = () => { location.hash = '#/' + c.slug; }; chips.append(b); });
    const lista = $('lista'); lista.replaceChildren();
    if (n.hijos.length) {   // lista de subcategorías; dentro de cada una están los productos
      const sub = el('div', 'subcats');
      n.hijos.forEach(h => {
        const b = el('button', 'subcat rev'); b.type = 'button';
        b.append(el('span', 'nom', h.nombre), el('small', null, txtProductos(h.total)), el('i', 'chev', '›')); b.onclick = () => { location.hash = '#/' + h.slug; };
        sub.append(b);
      });
      lista.append(sub);
      if (n.directos) lista.append(el('h3', 'sep', 'Otros productos'));
    }
    productos.filter(p => p.categoria === n.slug).forEach(p => lista.append(filaProducto(p)));
    revelar();
  }
  window.addEventListener('hashchange', () => { pintarVista(); window.scrollTo(0, 0); });
  $('atras').onclick = () => { const n = mapa[ruta()]; location.hash = n && n.padre ? '#/' + n.padre : '#categorias'; };

  // ---------- Carrito ----------
  function cambiar(k, d) {
    const n = Math.max(0, Math.min(99, (carrito[k] || 0) + d));
    if (n) carrito[k] = n; else delete carrito[k];
    guardar(); pintarVista(); pintarBarra();
    if (!$('panel').hidden) pintarPanel();
    if (sel) pintarSel();
  }
  function pintarBarra() {
    const n = lineas().reduce((s, l) => s + l.q, 0);
    $('abrirCarrito').hidden = n === 0 || !$('panel').hidden || !$('selector').hidden;
    $('barraCantidad').textContent = n + (n === 1 ? ' producto' : ' productos');
    $('barraTotal').textContent = fmt(total());
  }
  function pintarPanel() {
    const ul = $('lineas'); ul.replaceChildren();
    lineas().forEach(({ k, p, o, q }) => {
      const li = el('li'), n = el('div', 'n', p.nombre);
      n.append(el('small', null, (o ? p.opcion_titulo + ': ' + o.nombre + ' · ' : '') + fmt(o ? o.precio : p.precio) + ' c/u'));
      const c = el('div', 'cant');
      const m = el('button', null, '−'); m.setAttribute('aria-label', 'Quitar uno'); m.onclick = () => cambiar(k, -1);
      const a = el('button', 'mas', '+'); a.setAttribute('aria-label', 'Añadir uno'); a.onclick = () => cambiar(k, 1);
      c.append(m, el('span', null, q), a); li.append(n, c); ul.append(li);
    });
    $('total').textContent = fmt(total());
    if (!lineas().length) cerrarTodo();
  }

  // ---------- Elegir sabor / opción ----------
  function pintarSel() {
    $('selTitulo').textContent = 'Elige tu ' + sel.opcion_titulo.toLowerCase();
    $('selProducto').textContent = sel.nombre;
    const ul = $('selLista'); ul.replaceChildren();
    const filas = (sel.opcion_base ? [{ id: 'b', nombre: sel.opcion_base, precio: sel.precio }] : []).concat(sel.opciones);
    filas.forEach(o => {
      const k = sel.id + ':' + o.id, q = carrito[k] || 0, li = el('li'), c = el('div', 'cant'), n = el('div', 'n', o.nombre);
      n.append(el('small', null, fmt(o.precio)));
      if (q) { const m = el('button', null, '−'); m.setAttribute('aria-label', 'Quitar ' + o.nombre); m.onclick = () => cambiar(k, -1); c.append(m, el('span', null, q)); }
      const a = el('button', 'mas', '+'); a.setAttribute('aria-label', 'Añadir ' + o.nombre); a.onclick = () => cambiar(k, 1); c.append(a);
      li.append(n, c); ul.append(li);
    });
  }
  const abrirSel = (p) => { sel = p; $('selector').hidden = $('velo').hidden = false; pintarSel(); pintarBarra(); };

  // ---------- Abrir / cerrar ventanas ----------
  const abrir = () => { $('panel').hidden = $('velo').hidden = false; pintarPanel(); pintarBarra(); actualizarForm(); };
  function cerrarTodo() { sel = null; $('panel').hidden = $('selector').hidden = $('velo').hidden = true; pintarBarra(); }
  $('abrirCarrito').onclick = abrir;
  ['cerrarCarrito', 'cerrarSel', 'selListo', 'velo'].forEach(id => { $(id).onclick = cerrarTodo; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarTodo(); });
  $('vaciar').onclick = () => { carrito = {}; guardar(); pintarVista(); cerrarTodo(); };
  // Con QR de mesa: solo se ve la mesa y las notas. Con el QR general: tipo de pedido y, si es pedido, dónde está el cliente.
  function actualizarForm() {
    const modo = mesa ? 'mesa' : $('tipo').value;
    $('lblTipo').hidden = !!mesa;
    document.querySelectorAll('[data-modo]').forEach(l => { l.hidden = !l.dataset.modo.split(' ').includes(modo); });
    $('mesaAviso').textContent = mesa ? 'Pedido para: ' + etiquetaMesa(mesa) : '';
    document.querySelectorAll('.mesa-chip').forEach(e => { e.hidden = !mesa; if (mesa) e.textContent = etiquetaMesa(mesa); });
  }
  $('tipo').onchange = actualizarForm; actualizarForm();

  // ---------- Envío por WhatsApp ----------
  $('enviar').onclick = () => {
    const err = $('error'), tipo = mesa ? 'pedido' : $('tipo').value, ubic = $('ubicacion').value.trim();
    const falla = (m) => { err.textContent = m; err.hidden = false; };
    err.hidden = true;
    if (!lineas().length) return falla('Añade al menos un producto.');
    if (tipo === 'pedido' && !mesa && !ubic) return falla('Indica tu mesa o dónde estás (mesa 4, barra, de pie…).');
    if (tipo === 'reserva' && !$('fecha').value) return falla('Indica la fecha y hora de la reserva.');
    const t = [`*${tipo === 'reserva' ? 'RESERVA' : 'PEDIDO'} - ${LOCAL}*`];
    if (tipo === 'reserva') t.push(`Fecha y hora: ${$('fecha').value.replace('T', ' ')}`, `Personas: ${$('personas').value}`);
    else t.push(mesa ? `Mesa: ${mesa}` : `Ubicación: ${ubic}`);
    t.push('', ...lineas().map(({ p, o, q }) => `${q} x ${p.nombre}${o ? ` (${p.opcion_titulo}: ${o.nombre})` : ''} - ${fmt((o ? o.precio : p.precio) * q)}`), '', `*Total: ${fmt(total())}*`);
    if ($('notas').value.trim()) t.push('', `Notas: ${$('notas').value.trim()}`);
    window.open(`https://wa.me/${tipo === 'reserva' ? WA_RES : WA}?text=${encodeURIComponent(t.join('\n'))}`, '_blank', 'noopener');
  };

  // Logo: si existe public/img/logo.png sustituye al nombre en texto
  const lg = new Image(); lg.alt = LOCAL; lg.onload = () => $('logo').replaceChildren(lg);
  lg.onerror = () => { lg.onerror = null; lg.src = 'public/img/logo.png'; };   // si no hay .webp, usa .png
  lg.src = 'public/img/logo.webp';
  cargar();
})();
