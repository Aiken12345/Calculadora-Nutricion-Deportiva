/* ============================================================
   Nutrición Deportiva — Datos compartidos entre gel.html y drinkmix.html
   Precios de insumos (mmpp.cl, jul-2026) + bitácora de entrenamiento
   ============================================================ */

const PRICES = {
  maltodextrin: 5.5,       // mmpp.cl · Maltodextrina 1kg $5.500
  fructose: 9.9,           // mmpp.cl · Fructosa cristalina 1kg $9.900
  pectin: 65,               // mmpp.cl · Pectina 100g $6.500
  sodiumCitrate: 14,        // mmpp.cl · Citrato de sodio 500g $7.000
  sodiumChloride: 0.5,      // NO vendido en mmpp.cl · valor referencial sin verificar (sal de mesa, supermercado)
  potassiumCitrate: 22,     // mmpp.cl · Citrato de potasio 250g $5.500
  citricAcid: 9,            // mmpp.cl · Ácido cítrico 500g $4.500
  calciumLactate: 26,       // mmpp.cl · Lactato de calcio 250g $6.500
  caffeine: 140,            // mmpp.cl · Cafeína anhidra 100g $14.000
  sachet: 65                // packaging, no es insumo mmpp.cl
};
const PRICES_UPDATED = 'jul-2026';

/* ============ BITÁCORA (compartida vía localStorage) ============ */
const BITACORA_KEY = 'bitacora_entries';

function loadBitacora() {
  try {
    const raw = localStorage.getItem(BITACORA_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function persistBitacora(entries) {
  try { localStorage.setItem(BITACORA_KEY, JSON.stringify(entries)); } catch (e) {}
}

function saveBitacoraEntry(entry) {
  const entries = loadBitacora();
  entries.unshift({
    id: Date.now(),
    date: entry.date,
    text: entry.text,
    linkedBatch: entry.linkedBatch || null,
    createdAt: new Date().toISOString()
  });
  persistBitacora(entries);
  return entries;
}

function deleteBitacoraEntry(id) {
  const entries = loadBitacora().filter(e => e.id !== id);
  persistBitacora(entries);
  return entries;
}

/**
 * Pinta y engancha el panel de bitácora.
 * opts: { listEl, formEl, dateEl, textEl, batchSelectEl, getBatches, toast }
 * getBatches() debe devolver el array savedBatches de la página actual (para el selector "vincular a lote").
 * toast(msg) es la función de la página para mostrar el toast.
 */
function renderBitacoraPanel(opts) {
  const { listEl, dateEl, textEl, batchSelectEl, getBatches, toast } = opts;

  function populateBatchSelect() {
    const batches = getBatches ? getBatches() : [];
    batchSelectEl.innerHTML = '<option value="">Sin vincular</option>' +
      batches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
  }

  function renderList() {
    const entries = loadBitacora();
    if (entries.length === 0) {
      listEl.innerHTML = `<div class="empty-state"><p>Sin notas todavía · Registra cómo te fue con un gel o drink mix</p></div>`;
      return;
    }
    listEl.innerHTML = entries.map(e => `
      <div class="bitacora-entry">
        <div class="bitacora-entry-head">
          <span class="bitacora-date">${new Date(e.date + 'T00:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          ${e.linkedBatch ? `<span class="bitacora-batch-tag">${e.linkedBatch.name}</span>` : ''}
          <button class="danger bitacora-delete" data-id="${e.id}">Eliminar</button>
        </div>
        <p class="bitacora-text">${e.text.replace(/</g, '&lt;')}</p>
      </div>
    `).join('');

    listEl.querySelectorAll('.bitacora-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        if (!confirm('¿Eliminar esta nota?')) return;
        deleteBitacoraEntry(id);
        renderList();
        if (toast) toast('Nota eliminada');
      });
    });
  }

  populateBatchSelect();
  renderList();

  opts.formEl.addEventListener('submit', e => {
    e.preventDefault();
    const text = textEl.value.trim();
    if (!text) return;
    const batchId = batchSelectEl.value;
    let linkedBatch = null;
    if (batchId) {
      const batches = getBatches ? getBatches() : [];
      const b = batches.find(bb => String(bb.id) === batchId);
      if (b) linkedBatch = { id: b.id, name: b.name };
    }
    saveBitacoraEntry({ date: dateEl.value || new Date().toISOString().slice(0, 10), text, linkedBatch });
    textEl.value = '';
    batchSelectEl.value = '';
    populateBatchSelect();
    renderList();
    if (toast) toast('Nota guardada');
  });

  // Repoblar el selector de lotes cada vez que se entra al tab (por si se guardó un lote nuevo)
  return { refreshBatches: populateBatchSelect, refreshList: renderList };
}
