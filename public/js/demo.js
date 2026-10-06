/* Versión estática (GitHub Pages): no hay servidor. Los textos y los números de WhatsApp salen de data/site.json
   y los productos de data/menu.json. Después se carga la misma carta (app.js) que usa la versión con PHP. */
(async () => {
  const b = document.body, tx = (s, t) => { const e = document.querySelector(s); if (e) e.textContent = t; };
  let a = {};
  try { const r = await fetch(b.dataset.ajustes || 'data/site.json'); if (r.ok) a = await r.json(); } catch (_) { /* se usan los textos por defecto */ }
  const d = Object.assign({ nombre: 'Dubai', whatsapp: '', whatsapp_reservas: '', lema: '', instagram: '', horario: '', aviso: '' }, a);
  const num = (v) => String(v || '').replace(/\D/g, '');
  b.dataset.wa = num(d.whatsapp); b.dataset.waReservas = num(d.whatsapp_reservas); b.dataset.local = String(d.nombre);

  document.title = 'Carta · ' + d.nombre + ' · Malabo';
  tx('#logo .marca', d.nombre); if (d.lema) tx('.hero h1', d.lema);
  if (d.aviso) { const v = document.createElement('div'); v.className = 'aviso-top'; v.setAttribute('role', 'status'); v.textContent = d.aviso; b.prepend(v); }

  const pie = document.querySelector('.pie');
  if (pie) {
    const linea = (t) => { const p = document.createElement('p'); p.textContent = t; pie.append(p); return p; };
    pie.replaceChildren(); linea(d.nombre + ' · Menú digital · Pedidos y reservas por WhatsApp');
    if (d.horario) linea(d.horario);
    if (/^[A-Za-z0-9._]{1,30}$/.test(String(d.instagram).replace(/^@/, ''))) {
      const u = String(d.instagram).replace(/^@/, ''), p = linea(''), l = document.createElement('a');
      l.href = 'https://instagram.com/' + u; l.target = '_blank'; l.rel = 'noopener'; l.textContent = 'Instagram @' + u; p.append(l);
    }
  }
  const s = document.createElement('script'); s.src = 'public/js/app.js?v=' + (b.dataset.v || '1'); document.body.append(s);
})();
