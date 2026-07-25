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
  caffeine: 140             // mmpp.cl · Cafeína anhidra 100g $14.000
};
const PRICES_UPDATED = 'jul-2026';

/* ============ FICHA DE INSUMOS (presentación · precio · fuente) ============ */
const INGREDIENT_INFO = [
  { key: 'maltodextrin',    name: 'Maltodextrina',                 package: '1 kg',  packagePrice: 5500,  source: 'mmpp.cl' },
  { key: 'fructose',        name: 'Fructosa cristalina',           package: '1 kg',  packagePrice: 9900,  source: 'mmpp.cl' },
  { key: 'pectin',          name: 'Pectina',                       package: '100 g', packagePrice: 6500,  source: 'mmpp.cl' },
  { key: 'sodiumCitrate',   name: 'Citrato de sodio',               package: '500 g', packagePrice: 7000,  source: 'mmpp.cl' },
  { key: 'potassiumCitrate',name: 'Citrato de potasio',             package: '250 g', packagePrice: 5500,  source: 'mmpp.cl' },
  { key: 'citricAcid',      name: 'Ácido cítrico',                  package: '500 g', packagePrice: 4500,  source: 'mmpp.cl' },
  { key: 'calciumLactate',  name: 'Lactato de calcio',              package: '250 g', packagePrice: 6500,  source: 'mmpp.cl' },
  { key: 'caffeine',        name: 'Cafeína anhidra',                package: '100 g', packagePrice: 14000, source: 'mmpp.cl' },
  { key: 'sodiumChloride',  name: 'Cloruro de sodio (sal de mesa)', package: '—',     packagePrice: null,  source: 'No vendido en mmpp.cl · precio/g referencial sin verificar' }
];

function renderInsumosTable(tbodyId) {
  const body = document.getElementById(tbodyId);
  if (!body) return;
  body.innerHTML = INGREDIENT_INFO.map(ing => {
    const priceG = PRICES[ing.key];
    const unit = ing.perUnit ? '/ud' : '/g';
    const priceGLabel = typeof priceG === 'number' ? `$${priceG.toLocaleString('es-CL', { maximumFractionDigits: 2 })}${unit}` : '—';
    const packagePriceLabel = ing.packagePrice != null ? `$${ing.packagePrice.toLocaleString('es-CL')}` : '—';
    return `
    <tr>
      <td class="ingredient">${ing.name}</td>
      <td class="num">${ing.package}</td>
      <td class="num">${packagePriceLabel}</td>
      <td class="num">${priceGLabel}</td>
      <td class="role">${ing.source}</td>
    </tr>`;
  }).join('');
}

/* ============ COMPARACIÓN MANUAL (zona de experimentación, por página) ============ */
const COMPARISON_MAX = 5;

function loadComparisons(storageKey, seed) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  persistComparisons(storageKey, seed);
  return seed.slice();
}

function persistComparisons(storageKey, list) {
  try { localStorage.setItem(storageKey, JSON.stringify(list)); } catch (e) {}
}

/**
 * Pinta y engancha la zona de comparación manual (hasta 5 productos, con memoria en localStorage).
 * opts: { storageKey, seed, listEl, formEl, nameEl, priceEl, limitNoteEl }
 * Devuelve { refreshSavings(cost) } — llamar cada vez que cambie el costo propio (dentro de render()).
 */
function renderComparisonPanel(opts) {
  const { storageKey, seed, listEl, formEl, nameEl, priceEl, limitNoteEl } = opts;
  let items = loadComparisons(storageKey, seed);
  let lastCost = 0;

  function updateFormState() {
    const atMax = items.length >= COMPARISON_MAX;
    formEl.style.display = atMax ? 'none' : '';
    if (limitNoteEl) limitNoteEl.style.display = atMax ? 'block' : 'none';
  }

  function renderList() {
    if (items.length === 0) {
      listEl.innerHTML = `<div class="empty-state"><p>Sin productos agregados · agrega uno para comparar tu costo</p></div>`;
    } else {
      listEl.innerHTML = items.map(it => {
        const savings = it.price > 0 ? Math.round(((it.price - lastCost) / it.price) * 100) : null;
        const savingsLabel = savings === null ? '—' : (savings >= 0 ? `−${savings}%` : `+${Math.abs(savings)}%`);
        const savingsCls = savings !== null && savings < 0 ? 'negative' : '';
        return `
        <div class="comparison-row" data-id="${it.id}">
          <input type="text" class="cmp-name-input" value="${String(it.name).replace(/"/g, '&quot;')}" data-id="${it.id}">
          <input type="number" class="cmp-price-input" value="${it.price}" min="0" step="1" data-id="${it.id}">
          <span class="cmp-savings ${savingsCls}">${savingsLabel}</span>
          <button class="danger cmp-delete" data-id="${it.id}">Eliminar</button>
        </div>`;
      }).join('');

      listEl.querySelectorAll('.cmp-name-input').forEach(inp => {
        inp.addEventListener('change', () => {
          const id = parseInt(inp.dataset.id);
          const item = items.find(i => i.id === id);
          if (item) { item.name = inp.value.trim() || item.name; persistComparisons(storageKey, items); }
        });
      });
      listEl.querySelectorAll('.cmp-price-input').forEach(inp => {
        inp.addEventListener('change', () => {
          const id = parseInt(inp.dataset.id);
          const item = items.find(i => i.id === id);
          if (item) { item.price = parseFloat(inp.value) || 0; persistComparisons(storageKey, items); renderList(); }
        });
      });
      listEl.querySelectorAll('.cmp-delete').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.dataset.id);
          items = items.filter(i => i.id !== id);
          persistComparisons(storageKey, items);
          renderList();
        });
      });
    }
    updateFormState();
  }

  renderList();

  formEl.addEventListener('submit', e => {
    e.preventDefault();
    if (items.length >= COMPARISON_MAX) return;
    const name = nameEl.value.trim();
    const price = parseFloat(priceEl.value);
    if (!name || !price) return;
    items.push({ id: Date.now(), name, price });
    persistComparisons(storageKey, items);
    nameEl.value = '';
    priceEl.value = '';
    renderList();
  });

  return {
    refreshSavings(cost) {
      lastCost = cost;
      renderList();
    }
  };
}

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
