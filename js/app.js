const sb = window.supabaseClient;

// ============================================================
// KBITE — ADMIN PANEL
// ============================================================

// ───────────────── AUTHENTICATION ─────────────────

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value.trim();

  const errorBox = document.getElementById('login-error');
  errorBox.classList.add('hidden');
  errorBox.textContent = '';

  try {
    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password
    });

    console.log('LOGIN DATA:', data);
    console.log('LOGIN ERROR:', error);

    if (error) throw error;

    document.getElementById('login-page').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';

    initializeDashboard();

  } catch (err) {
    console.error(err);

    errorBox.textContent = err.message || 'Login failed';
    errorBox.classList.remove('hidden');
  }
});

async function checkAuthState() {
  try {
    const { data, error } = await sb.auth.getSession();

    console.log('SESSION:', data);
    console.log('SESSION ERROR:', error);

    if (data?.session) {
      document.getElementById('login-page').style.display = 'none';
      document.getElementById('admin-panel').style.display = 'block';

      initializeDashboard();
    } else {
      document.getElementById('login-page').style.display = 'flex';
      document.getElementById('admin-panel').style.display = 'none';
    }
  } catch (err) {
    console.error('Auth state error:', err);
  }
}

async function logout() {
  await sb.auth.signOut();

  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('admin-panel').style.display = 'none';
}

// ───────────────── INITIALIZE ─────────────────

function initializeDashboard() {
  loadStats();
  loadProducts();
  loadIngredients();
  loadVarieties();
  loadVarietyOptions();
  loadSizes();
  loadOrders();
  loadCustomizationOrders();
  loadSettings();

  sb
    .channel('products-live')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'products'
      },
      () => {
        loadProducts();
        loadStats();
      }
    )
    .subscribe();

  sb
    .channel('product-orders-live')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'product_orders'
      },
      () => {
        loadOrders();
        loadStats();
      }
    )
    .subscribe();

  sb
    .channel('customized-orders-live')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'customized_orders'
      },
      () => {
        loadCustomizationOrders();
        loadStats();
      }
    )
    .subscribe();
}

// ───────────────── NAVIGATION ─────────────────

function navigate(page, el) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  if (el) el.classList.add('active');

  document.querySelectorAll('.page').forEach(pageEl => {
    pageEl.classList.remove('active');
  });

  const target = document.getElementById(`page-${page}`);
  if (target) {
    target.classList.add('active', 'page-enter');
  }

  toggleSidebar(false);

  const titles = {
    dashboard: 'Dashboard',
    products: 'Products',
    ingredients: 'Ingredients',
    varieties: 'Varieties',
    sizes: 'Sizes',
    orders: 'Orders',
    'customization-orders': 'Customization Orders',
    settings: 'Shipping & Pricing'
  };

  document.getElementById('topbar-title').textContent =
    titles[page] || 'Dashboard';
}

function toggleSidebar(force) {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!sidebar) return;
  const open = typeof force === 'boolean' ? force : !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', open);
  if (backdrop) backdrop.classList.toggle('open', open);
}

const UI_ICONS = {
  edit: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
  star: '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  flame: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'
};

function renderStatusPill(isActive) {
  if (isActive === null || isActive === undefined) {
    return '<span class="status-pill status-pill--neutral">Null</span>';
  }
  return isActive
    ? '<span class="status-pill status-pill--active">Active</span>'
    : '<span class="status-pill status-pill--inactive">Inactive</span>';
}

// ───────────────── HELPERS ─────────────────

function ensureFloatingToast() {
  let floating = document.getElementById('floating-toast');
  if (!floating) {
    floating = document.createElement('div');
    floating.id = 'floating-toast';
    floating.className = 'toast toast--floating hidden';
    document.body.appendChild(floating);
  }
  return floating;
}

function showToast(id, message, type = 'success') {
  const toast = document.getElementById(id);
  const duration = type === 'error' ? 6000 : 4000;

  if (toast) {
    toast.textContent = message;
    toast.className = `toast toast--${type}`;
    toast.classList.remove('hidden');

    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, duration);
  }

  let isInlineVisible = false;
  if (toast) {
    const rect = toast.getBoundingClientRect();
    isInlineVisible = rect.width > 0 && rect.top >= 72 && rect.bottom <= window.innerHeight;
  }

  const floating = ensureFloatingToast();
  if (!isInlineVisible) {
    floating.textContent = message;
    floating.className = `toast toast--${type} toast--floating`;
    floating.classList.remove('hidden');

    clearTimeout(floating._hideTimer);
    floating._hideTimer = setTimeout(() => {
      floating.classList.add('hidden');
    }, duration);
  } else {
    clearTimeout(floating._hideTimer);
    floating.classList.add('hidden');
  }
}

function isForeignKeyError(err) {
  if (!err) return false;
  return (
    err.code === '23503' ||
    /foreign key constraint/i.test(err.message || '') ||
    /still referenced/i.test(err.details || '')
  );
}

/**
 * Deletes rows matching `column = value` and verifies deletion actually occurred,
 * catching silent Supabase RLS DELETE blocks where PostgREST returns 0 rows.
 */
async function deleteAndVerify(table, column, value) {
  const { data, error } = await sb
    .from(table)
    .delete()
    .eq(column, value)
    .select('id');

  if (error) {
    if (isForeignKeyError(error)) {
      return { status: 'fk_violation', deletedCount: 0, error };
    }
    throw error;
  }

  if (data && data.length > 0) {
    return { status: 'deleted', deletedCount: data.length, error: null };
  }

  const { data: remaining, error: checkError } = await sb
    .from(table)
    .select('id')
    .eq(column, value)
    .limit(1);

  if (checkError) throw checkError;

  if (remaining && remaining.length > 0) {
    throw new Error(
      `Delete blocked by database permissions (check Supabase DELETE RLS policy on "${table}").`
    );
  }

  return { status: 'missing', deletedCount: 0, error: null };
}

const editState = {
  product: null, // { id, imageUrl, existingSizeIds }
  ingredientId: null,
  varietyId: null,
  sizeId: null
};

const FORM_MODES = {
  product: {
    cardId: 'product-form-card',
    titleId: 'product-form-title',
    submitBtnId: 'product-submit-btn',
    cancelBtnId: 'product-cancel-btn',
    addTitle: 'Add New Product',
    editTitle: 'Edit Product',
    addBtnText: 'Add Product',
    editBtnText: 'Update Product'
  },
  ingredient: {
    cardId: 'ingredient-form-card',
    titleId: 'ingredient-form-title',
    submitBtnId: 'ingredient-submit-btn',
    cancelBtnId: 'ingredient-cancel-btn',
    addTitle: 'Add New Ingredient',
    editTitle: 'Edit Ingredient',
    addBtnText: 'Add Ingredient',
    editBtnText: 'Update Ingredient'
  },
  variety: {
    cardId: 'variety-form-card',
    titleId: 'variety-form-title',
    submitBtnId: 'variety-submit-btn',
    cancelBtnId: 'variety-cancel-btn',
    addTitle: 'Add New Variety',
    editTitle: 'Edit Variety',
    addBtnText: 'Add Variety',
    editBtnText: 'Update Variety'
  },
  size: {
    cardId: 'size-form-card',
    titleId: 'size-form-title',
    submitBtnId: 'size-submit-btn',
    cancelBtnId: 'size-cancel-btn',
    addTitle: 'Add New Size',
    editTitle: 'Edit Size',
    addBtnText: 'Add Size',
    editBtnText: 'Update Size'
  }
};

function readStatusCheckbox(groupClass, defaultValue = null) {
  const checked = document.querySelector(`.${groupClass}:checked`);
  if (!checked) return defaultValue;
  if (checked.value === 'true') return true;
  if (checked.value === 'false') return false;
  if (checked.value === 'null') return null;
  return defaultValue;
}

function setStatusCheckbox(groupClass, value) {
  const targetVal = value === true ? 'true' : value === false ? 'false' : value === null ? 'null' : '';
  document.querySelectorAll(`.${groupClass}`).forEach(cb => {
    cb.checked = targetVal !== '' && cb.value === targetVal;
  });
}

function setSelectValue(selectEl, value, fallbackLabel = '') {
  if (!selectEl) return;
  const strVal = value !== null && value !== undefined ? String(value) : '';
  if (strVal && !Array.from(selectEl.options).some(opt => opt.value === strVal)) {
    const opt = document.createElement('option');
    opt.value = strVal;
    opt.textContent = fallbackLabel || strVal;
    selectEl.appendChild(opt);
  }
  selectEl.value = strVal;
}

function setFormEditMode(config, isEditing) {
  const card = document.getElementById(config.cardId);
  const titleEl = document.getElementById(config.titleId);
  const submitText = document.querySelector(`#${config.submitBtnId} .btn-text`);
  const cancelBtn = document.getElementById(config.cancelBtnId);

  if (card) card.classList.toggle('is-editing', isEditing);
  if (titleEl) titleEl.textContent = isEditing ? config.editTitle : config.addTitle;
  if (submitText) submitText.textContent = isEditing ? config.editBtnText : config.addBtnText;
  if (cancelBtn) cancelBtn.textContent = isEditing ? 'Cancel Edit' : 'Clear Form';

  if (isEditing && card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

async function updateAndVerify(table, id, payload) {
  const { data, error } = await sb
    .from(table)
    .update(payload)
    .eq('id', id)
    .select('id');

  if (error) throw error;

  if (!data || data.length === 0) {
    const { data: existing, error: checkError } = await sb
      .from(table)
      .select('id')
      .eq('id', id)
      .limit(1);

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      throw new Error(
        `Update blocked by database permissions (check Supabase UPDATE RLS policy on "${table}").`
      );
    }

    throw new Error(`Record was not found in "${table}".`);
  }

  return data[0];
}

async function withButtonLoading(btn, loadingText, fn) {
  const originalText = btn ? btn.textContent : '';
  if (btn) {
    btn.disabled = true;
    btn.textContent = loadingText;
  }
  try {
    return await fn();
  } finally {
    if (btn && btn.isConnected) {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
}

async function deleteWithChildCascade({
  table,
  id,
  btn,
  confirmMessage,
  childTable = null,
  childFkColumn = null,
  childSelectCols = 'id',
  formatChildLabel = null,
  toastId,
  successMessage,
  errorLabel,
  onDeleted,
  onRefresh
}) {
  if (!confirm(confirmMessage)) return;

  await withButtonLoading(btn, 'Deleting…', async () => {
    try {
      let result = await deleteAndVerify(table, 'id', id);

      if (result.status === 'fk_violation') {
        if (!childTable || !childFkColumn) {
          throw new Error(
            result.error?.message ||
            `Cannot delete this ${errorLabel} because it is still referenced by other records.`
          );
        }

        const { data: linkedChildren, error: childFetchError } = await sb
          .from(childTable)
          .select(childSelectCols)
          .eq(childFkColumn, id);

        if (childFetchError) throw childFetchError;

        if (!linkedChildren || linkedChildren.length === 0) {
          throw new Error(
            result.error?.message ||
            `Cannot delete this ${errorLabel} because it is still referenced by other records.`
          );
        }

        const labels = formatChildLabel
          ? linkedChildren.map(formatChildLabel).filter(Boolean).join(', ')
          : '';
        const noun = childTable.replace(/_/g, ' ');
        const confirmCascade = labels
          ? `This ${errorLabel} has ${linkedChildren.length} linked ${noun} (${labels}).\n\nDelete those linked records and this ${errorLabel}?`
          : `This ${errorLabel} has ${linkedChildren.length} linked ${noun} record(s).\n\nDelete those linked records and this ${errorLabel}?`;

        if (!confirm(confirmCascade)) return;

        await deleteAndVerify(childTable, childFkColumn, id);
        result = await deleteAndVerify(table, 'id', id);

        if (result.status === 'fk_violation') {
          throw new Error(
            result.error?.message ||
            `Cannot delete this ${errorLabel} because it is still referenced by other records.`
          );
        }
      }

      if (onDeleted) onDeleted();
      showToast(toastId, successMessage);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error(`Delete ${errorLabel} Error:`, err);
      showToast(toastId, err.message || `Failed to delete ${errorLabel}`, 'error');
    }
  });
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);

  if (!btn) return;

  const text = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');

  btn.disabled = loading;

  if (text) text.classList.toggle('hidden', loading);
  if (loader) loader.classList.toggle('hidden', !loading);
}

function formatDate(date) {
  if (!date) return '—';

  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function formatDateTime(date) {
  if (!date) return '—';

  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

// ───────────────── PRODUCT FORM ─────────────────

// Dynamic Size Rows Logic
function createSizeRow(label = '', price = '', sizeId = '') {
  const row = document.createElement('div');
  row.className = 'size-row';
  if (sizeId) row.dataset.sizeId = sizeId;

  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.className = 'size-label';
  labelInput.placeholder = 'e.g. 250g / 500g / 1kg';
  labelInput.value = label;

  const priceInput = document.createElement('input');
  priceInput.type = 'number';
  priceInput.className = 'size-price';
  priceInput.placeholder = 'Price';
  priceInput.value = price !== null && price !== undefined ? String(price) : '';

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn-remove-size';
  removeBtn.title = 'Remove size';
  removeBtn.textContent = '×';
  removeBtn.onclick = () => row.remove();

  row.append(labelInput, priceInput, removeBtn);
  return row;
}

const addSizeBtn = document.getElementById("add-size-btn");
const sizesContainer = document.getElementById("sizes-container");

if (addSizeBtn && sizesContainer) {
  addSizeBtn.addEventListener("click", () => {
    sizesContainer.appendChild(createSizeRow());
  });
}

function parseOptionalFloat(id) {
  const el = document.getElementById(id);
  const raw = el && el.value !== undefined && el.value !== null ? String(el.value).trim() : '';
  if (raw === '') return null;
  const num = parseFloat(raw);
  return isNaN(num) ? null : num;
}

async function syncProductSizes(productId, existingSizeIds) {
  const rows = document.querySelectorAll('#sizes-container .size-row');
  const toUpdate = [];
  const toInsert = [];
  const keptIds = new Set();

  rows.forEach(row => {
    const label = row.querySelector('.size-label').value.trim();
    const price = parseFloat(row.querySelector('.size-price').value);
    const sizeId = row.dataset.sizeId;

    if (label && !isNaN(price)) {
      if (sizeId) {
        keptIds.add(sizeId);
        toUpdate.push({ id: sizeId, payload: { size_label: label, price, is_active: true } });
      } else {
        toInsert.push({ product_id: productId, size_label: label, price, is_active: true });
      }
    }
  });

  const removedIds = (existingSizeIds || []).filter(sid => !keptIds.has(sid));

  if (removedIds.length > 0) {
    const { data: deletedSizes, error: deleteErr } = await sb
      .from('product_sizes')
      .delete()
      .in('id', removedIds)
      .select('id');
    if (deleteErr) throw deleteErr;

    if (!deletedSizes || deletedSizes.length < removedIds.length) {
      const { data: stillThere, error: checkErr } = await sb
        .from('product_sizes')
        .select('id')
        .in('id', removedIds)
        .limit(1);
      if (checkErr) throw checkErr;
      if (stillThere && stillThere.length > 0) {
        throw new Error(
          'Could not remove deleted product sizes (check Supabase DELETE RLS policy on "product_sizes").'
        );
      }
    }
  }

  for (const item of toUpdate) {
    await updateAndVerify('product_sizes', item.id, item.payload);
  }

  if (toInsert.length > 0) {
    const { error: insertErr } = await sb
      .from('product_sizes')
      .insert(toInsert)
      .select('id');
    if (insertErr) throw insertErr;
  }
}

async function submitProduct(e) {
  e.preventDefault();

  const editing = editState.product;
  const badge = document.querySelector('input[name="p-badge"]:checked');
  const isActiveValue = readStatusCheckbox('p-status-checkbox', null);
  const imageFile = document.getElementById('p-image-file').files[0];

  if (!imageFile && !editing) {
    showToast('product-toast', 'Please select an image', 'error');
    return;
  }

  setLoading('product-submit-btn', true);

  try {
    let imageUrl = editing ? editing.imageUrl : null;

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `product-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await sb.storage
        .from('product-images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data } = sb.storage
        .from('product-images')
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    const reviewsRaw = parseInt(document.getElementById('p-reviews').value, 10);

    const product = {
      title: document.getElementById('p-title').value.trim(),
      category: document.getElementById('p-category').value,
      price: parseFloat(document.getElementById('p-price').value),
      old_price: parseOptionalFloat('p-old-price'),
      discount: parseOptionalFloat('p-discount'),
      rating: parseOptionalFloat('p-rating'),
      reviews: isNaN(reviewsRaw) ? 0 : reviewsRaw,
      badge: badge && badge.value ? badge.value : null,
      image_url: imageUrl,
      button_text:
        document.getElementById('p-button-text').value.trim() || 'Add to Cart',
      is_active: isActiveValue
    };

    if (editing) {
      await updateAndVerify('products', editing.id, product);
      await syncProductSizes(editing.id, editing.existingSizeIds);
      showToast('product-toast', 'Product updated successfully');
    } else {
      const { data: productDataArray, error } = await sb
        .from('products')
        .insert([product])
        .select();

      if (error) throw error;

      const productData = productDataArray[0];

      // Save size rows into product_sizes
      const rows = document.querySelectorAll('#sizes-container .size-row');
      const sizeData = [];

      rows.forEach(row => {
        const label = row.querySelector('.size-label').value.trim();
        const price = parseFloat(row.querySelector('.size-price').value);

        if (label && !isNaN(price)) {
          sizeData.push({
            product_id: productData.id,
            size_label: label,
            price: price,
            is_active: true
          });
        }
      });

      if (sizeData.length > 0) {
        const { error: sizeError } = await sb
          .from('product_sizes')
          .insert(sizeData)
          .select('id');

        if (sizeError) throw sizeError;
      }

      showToast('product-toast', 'Product added successfully');
    }

    resetProductForm();
    loadProducts();
    loadStats();

  } catch (err) {
    console.error(err);
    showToast('product-toast', err.message, 'error');
  } finally {
    setLoading('product-submit-btn', false);
  }
}

async function editProduct(id, btn) {
  await withButtonLoading(btn, 'Loading…', async () => {
    try {
      const [{ data: product, error }, { data: sizes, error: sizesError }] = await Promise.all([
        sb.from('products').select('*').eq('id', id).single(),
        sb.from('product_sizes').select('*').eq('product_id', id).order('created_at', { ascending: true })
      ]);

      if (error) throw error;
      if (sizesError) throw sizesError;
      if (!product) throw new Error('Product not found.');

      const productsPage = document.getElementById('page-products');
      if (productsPage && !productsPage.classList.contains('active')) {
        navigate('products', document.querySelector('.nav-item[data-page="products"]'));
      }

      document.getElementById('p-title').value = product.title || '';
      setSelectValue(document.getElementById('p-category'), product.category);
      document.getElementById('p-price').value = product.price ?? '';
      document.getElementById('p-old-price').value = product.old_price ?? '';

      const discountVal =
        product.discount !== null && product.discount !== undefined
          ? parseFloat(String(product.discount).replace(/[^0-9.-]/g, ''))
          : NaN;
      document.getElementById('p-discount').value = !isNaN(discountVal) ? discountVal : '';

      document.getElementById('p-rating').value = product.rating ?? '';
      document.getElementById('p-reviews').value = product.reviews ?? '';
      document.getElementById('p-button-text').value = product.button_text || '';

      const targetBadge = product.badge || '';
      document.querySelectorAll('input[name="p-badge"]').forEach(radio => {
        radio.checked = radio.value === targetBadge;
      });

      setStatusCheckbox('p-status-checkbox', product.is_active);

      const fileInput = document.getElementById('p-image-file');
      if (fileInput) {
        fileInput.value = '';
        fileInput.required = false;
      }
      const reqEl = document.getElementById('p-image-req');
      if (reqEl) reqEl.classList.add('hidden');

      const filenameSpan = document.getElementById('p-image-filename');
      if (filenameSpan) {
        filenameSpan.textContent = product.image_url
          ? 'Keeping current image (choose file to replace)'
          : 'No file chosen';
      }

      const previewImg = document.getElementById('p-image-preview');
      if (previewImg) {
        if (product.image_url) {
          previewImg.src = product.image_url;
          previewImg.classList.remove('hidden');
        } else {
          previewImg.classList.add('hidden');
          previewImg.removeAttribute('src');
        }
      }

      const container = document.getElementById('sizes-container');
      const existingSizeIds = [];
      if (container) {
        container.innerHTML = '';
        if (sizes && sizes.length > 0) {
          sizes.forEach(s => {
            existingSizeIds.push(s.id);
            container.appendChild(createSizeRow(s.size_label || '', s.price, s.id));
          });
        } else {
          container.appendChild(createSizeRow());
        }
      }

      editState.product = {
        id: product.id,
        imageUrl: product.image_url || null,
        existingSizeIds
      };

      setFormEditMode(FORM_MODES.product, true);
    } catch (err) {
      console.error('Edit Product Error:', err);
      showToast('product-toast', err.message || 'Failed to load product for editing', 'error');
    }
  });
}

// ───────────────── LOAD PRODUCTS ─────────────────

async function loadProducts() {
  try {
    const { data, error } = await sb
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    renderProductCards('products-preview', data);
    renderProductCards('dashboard-preview', data.slice(0, 4));

  } catch (err) {
    console.error('Load Products Error:', err);
  }
}

async function deleteProduct(id, btn) {
  await deleteWithChildCascade({
    table: 'products',
    id,
    btn,
    confirmMessage: 'Delete this product?',
    childTable: 'product_sizes',
    childFkColumn: 'product_id',
    childSelectCols: 'id, size_label',
    formatChildLabel: s => s.size_label,
    toastId: 'product-toast',
    successMessage: 'Product deleted successfully',
    errorLabel: 'product',
    onDeleted: () => {
      if (editState.product?.id === id) resetProductForm();
    },
    onRefresh: async () => {
      await Promise.all([loadProducts(), loadStats()]);
    }
  });
}

function renderProductCards(containerId, products) {
  const container = document.getElementById(containerId);

  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = '<div class="empty-state">No products found.</div>';
    return;
  }

  container.innerHTML = products.map(product => `
    <div class="product-card">
      ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}

      <div class="product-img-wrap">
        <img src="${product.image_url}" alt="${product.title}">
      </div>

      <div class="product-info">
        <div class="product-category">${product.category}</div>
        <div class="product-name">${product.title}</div>

        <div class="product-pricing">
          <span class="product-price">₹${product.price}</span>

          ${product.old_price ? `
            <span class="product-original">₹${product.old_price}</span>
          ` : ''}

          ${product.discount ? `
            <span class="product-discount">${String(product.discount).replace(/%+$/, '')}% OFF</span>
          ` : ''}
        </div>

        <div class="product-meta">
          ${product.rating ? `<span class="product-rating-star">${UI_ICONS.star} ${product.rating}</span>` : ''}
          ${product.reviews ? `<span class="product-reviews">(${product.reviews} reviews)</span>` : ''}
          ${renderStatusPill(product.is_active)}
        </div>
        <div class="product-actions">
          <button onclick="editProduct('${product.id}', this)" class="btn-edit">
            ${UI_ICONS.edit}<span>Edit</span>
          </button>
          <button onclick="deleteProduct('${product.id}', this)" class="btn-delete">
            ${UI_ICONS.trash}<span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function resetProductForm() {
  editState.product = null;
  document.getElementById('product-form').reset();

  const fileInput = document.getElementById('p-image-file');
  if (fileInput) fileInput.required = true;

  const reqEl = document.getElementById('p-image-req');
  if (reqEl) reqEl.classList.remove('hidden');

  const filenameSpan = document.getElementById('p-image-filename');
  if (filenameSpan) filenameSpan.textContent = 'No file chosen';

  const previewImg = document.getElementById('p-image-preview');
  if (previewImg) {
    previewImg.classList.add('hidden');
    previewImg.removeAttribute('src');
  }

  // Reset sizes container to one empty row
  const container = document.getElementById('sizes-container');
  if (container) {
    container.innerHTML = '';
    container.appendChild(createSizeRow());
  }

  setFormEditMode(FORM_MODES.product, false);
}

// ───────────────── INGREDIENTS ─────────────────

async function submitIngredient(e) {
  e.preventDefault();

  const isActiveValue = readStatusCheckbox('i-status-checkbox', null);

  const ingredient = {
    name: document.getElementById('i-name').value.trim(),
    category: document.getElementById('i-category').value,
    price: parseFloat(document.getElementById('i-price').value),
    variety_type: document.getElementById('i-variety-type').value.trim() || null,
    is_active: isActiveValue,
    description: document.getElementById('i-description').value.trim() || null,
  };

  setLoading('ingredient-submit-btn', true);

  try {
    if (editState.ingredientId) {
      await updateAndVerify('ingredients', editState.ingredientId, ingredient);
      showToast('ingredient-toast', 'Ingredient updated successfully');
    } else {
      const { error } = await sb
        .from('ingredients')
        .insert([ingredient]);

      if (error) throw error;
      showToast('ingredient-toast', 'Ingredient added successfully');
    }

    resetIngredientForm();
    loadIngredients();
    loadStats();

  } catch (err) {
    console.error(err);
    showToast('ingredient-toast', err.message, 'error');
  } finally {
    setLoading('ingredient-submit-btn', false);
  }
}

async function editIngredient(id, btn) {
  await withButtonLoading(btn, 'Loading…', async () => {
    try {
      const { data, error } = await sb
        .from('ingredients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Ingredient not found.');

      document.getElementById('i-name').value = data.name || '';
      setSelectValue(document.getElementById('i-category'), data.category);
      document.getElementById('i-price').value = data.price ?? '';
      document.getElementById('i-variety-type').value = data.variety_type || '';
      document.getElementById('i-description').value = data.description || '';
      setStatusCheckbox('i-status-checkbox', data.is_active);

      editState.ingredientId = data.id;
      setFormEditMode(FORM_MODES.ingredient, true);
    } catch (err) {
      console.error('Edit Ingredient Error:', err);
      showToast('ingredient-toast', err.message || 'Failed to load ingredient for editing', 'error');
    }
  });
}

async function addSampleIngredients() {
  const samples = [
    { name: 'Pista', category: 'Premium', price: 150, variety_type: 'Nuts', is_active: true, description: 'Premium quality pistachios' },
    { name: 'Mamra Badam', category: 'Bestseller', price: 200, variety_type: 'Nuts', is_active: true, description: 'High-quality almonds from Kashmir' },
    { name: 'Cashew', category: 'Popular', price: 120, variety_type: 'Nuts', is_active: true, description: 'Crunchy and delicious cashews' },
    { name: 'Walnuts', category: 'Premium', price: 180, variety_type: 'Nuts', is_active: true, description: 'Nutritious walnuts for health' },
    { name: 'Pumpkin Seeds', category: 'Popular', price: 80, variety_type: 'Seeds', is_active: true, description: 'Roasted pumpkin seeds' },
    { name: 'Watermelon Seeds', category: 'Gift', price: 60, variety_type: 'Seeds', is_active: true, description: 'Dried watermelon seeds' },
    { name: 'Sunflower Seeds', category: 'Popular', price: 70, variety_type: 'Seeds', is_active: true, description: 'Healthy sunflower seeds' },
    { name: 'Chia Seeds', category: 'Premium', price: 90, variety_type: 'Seeds', is_active: true, description: 'Superfood chia seeds' },
    { name: 'Flax Seeds', category: 'Bestseller', price: 85, variety_type: 'Seeds', is_active: true, description: 'Omega-3 rich flax seeds' },
    { name: 'Quinoa', category: 'Premium', price: 110, variety_type: 'Grains', is_active: true, description: 'Protein-rich quinoa' },
    { name: 'Muskmelon Seeds', category: 'Gift', price: 65, variety_type: 'Seeds', is_active: true, description: 'Nutritious muskmelon seeds' },
    { name: 'Sesame Seeds', category: 'Popular', price: 75, variety_type: 'Seeds', is_active: true, description: 'Versatile sesame seeds' }
  ];

  try {
    const { error } = await sb
      .from('ingredients')
      .insert(samples);

    if (error) throw error;

    showToast('ingredient-toast', 'Sample ingredients added successfully');
    loadIngredients();
    loadStats();

  } catch (err) {
    console.error(err);
    showToast('ingredient-toast', err.message, 'error');
  }
}

function resetIngredientForm() {
  editState.ingredientId = null;
  document.getElementById('ingredient-form').reset();
  setFormEditMode(FORM_MODES.ingredient, false);
}

async function loadIngredients() {
  try {
    const { data, error } = await sb
      .from('ingredients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tbody = document.getElementById('ingredients-tbody');

    if (!tbody) return;

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">No ingredients found.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data.map(item => `
      <tr>
        <td><strong>${item.name}</strong></td>
        <td>${item.category}</td>
        <td>${item.variety_type || '-'}</td>
        <td>₹${item.price}</td>
        <td>${renderStatusPill(item.is_active)}</td>
        <td>${formatDate(item.created_at)}</td>
        <td>
          <div class="table-actions">
            <button onclick="editIngredient('${item.id}', this)" class="btn-edit">
              ${UI_ICONS.edit}<span>Edit</span>
            </button>
            <button onclick="deleteIngredient('${item.id}', this)" class="btn-delete">
              ${UI_ICONS.trash}<span>Delete</span>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Load Ingredients Error:', err);
  }
}

async function deleteIngredient(id, btn) {
  await deleteWithChildCascade({
    table: 'ingredients',
    id,
    btn,
    confirmMessage: 'Delete this ingredient?',
    toastId: 'ingredient-toast',
    successMessage: 'Ingredient deleted successfully',
    errorLabel: 'ingredient',
    onDeleted: () => {
      if (editState.ingredientId === id) resetIngredientForm();
    },
    onRefresh: async () => {
      await Promise.all([loadIngredients(), loadStats()]);
    }
  });
}

// ───────────────── STATS ─────────────────

async function loadStats() {
  try {
    const [
      { count: products }, 
      { count: ingredients }, 
      { count: varieties }, 
      { count: sizes },
      { count: productOrders },
      { count: customizedOrders }
    ] = await Promise.all([
      sb.from('products').select('*', { count: 'exact', head: true }),
      sb.from('ingredients').select('*', { count: 'exact', head: true }),
      sb.from('varieties').select('*', { count: 'exact', head: true }),
      sb.from('sizes').select('*', { count: 'exact', head: true }),
      sb.from('product_orders').select('*', { count: 'exact', head: true }),
      sb.from('customized_orders').select('*', { count: 'exact', head: true })
    ]);

    document.getElementById('stat-products').textContent = products || 0;
    document.getElementById('stat-ingredients').textContent = ingredients || 0;
    document.getElementById('stat-varieties').textContent = varieties || 0;
    document.getElementById('stat-sizes').textContent = sizes || 0;
    document.getElementById('stat-orders').textContent = productOrders || 0;
    document.getElementById('stat-customization-orders').textContent = customizedOrders || 0;

  } catch (err) {
    console.error('Stats Error:', err);
  }
}

// ───────────────── VARIETIES ─────────────────

async function submitVariety(e) {
  e.preventDefault();

  const isActiveValue = readStatusCheckbox('v-status-checkbox', true);
  const varietyPayload = {
    name: document.getElementById('v-name').value.trim(),
    price: parseFloat(document.getElementById('v-price').value),
    description: document.getElementById('v-description').value.trim() || null,
    is_active: isActiveValue
  };

  setLoading('variety-submit-btn', true);

  try {
    if (editState.varietyId) {
      await updateAndVerify('varieties', editState.varietyId, varietyPayload);
      showToast('variety-toast', 'Variety updated successfully');
    } else {
      const { error } = await sb.from('varieties').insert([varietyPayload]);
      if (error) throw error;
      showToast('variety-toast', 'Variety added successfully');
    }

    resetVarietyForm();

    await Promise.all([
      loadVarieties(),
      loadVarietyOptions(),
      loadSizes(),
      loadStats()
    ]);

  } catch (err) {
    console.error(err);
    showToast('variety-toast', err.message, 'error');
  } finally {
    setLoading('variety-submit-btn', false);
  }
}

async function editVariety(id, btn) {
  await withButtonLoading(btn, 'Loading…', async () => {
    try {
      const { data, error } = await sb
        .from('varieties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Variety not found.');

      document.getElementById('v-name').value = data.name || '';
      document.getElementById('v-price').value = data.price ?? '';
      document.getElementById('v-description').value = data.description || '';
      setStatusCheckbox('v-status-checkbox', data.is_active);

      editState.varietyId = data.id;
      setFormEditMode(FORM_MODES.variety, true);
    } catch (err) {
      console.error('Edit Variety Error:', err);
      showToast('variety-toast', err.message || 'Failed to load variety for editing', 'error');
    }
  });
}

async function loadVarieties() {
  try {
    const { data, error } = await sb
      .from('varieties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tbody = document.getElementById('varieties-tbody');

    if (!tbody) return;

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">No varieties found.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data.map(item => `
      <tr>
        <td><strong>${item.name}</strong></td>
        <td>₹${item.price}</td>
        <td>${renderStatusPill(item.is_active)}</td>
        <td>${formatDate(item.created_at)}</td>
        <td>
          <div class="table-actions">
            <button onclick="editVariety('${item.id}', this)" class="btn-edit">
              ${UI_ICONS.edit}<span>Edit</span>
            </button>
            <button onclick="deleteVariety('${item.id}', this)" class="btn-delete">
              ${UI_ICONS.trash}<span>Delete</span>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Load Varieties Error:', err);
  }
}

async function deleteVariety(id, btn) {
  await deleteWithChildCascade({
    table: 'varieties',
    id,
    btn,
    confirmMessage: 'Delete this variety?',
    childTable: 'sizes',
    childFkColumn: 'variety_id',
    childSelectCols: 'id, size',
    formatChildLabel: s => s.size,
    toastId: 'variety-toast',
    successMessage: 'Variety deleted successfully',
    errorLabel: 'variety',
    onDeleted: () => {
      if (editState.varietyId === id) resetVarietyForm();
    },
    onRefresh: async () => {
      await Promise.all([
        loadVarieties(),
        loadVarietyOptions(),
        loadSizes(),
        loadStats()
      ]);
    }
  });
}

function resetVarietyForm() {
  editState.varietyId = null;
  document.getElementById('variety-form').reset();
  setFormEditMode(FORM_MODES.variety, false);
}

// ───────────────── SIZES ─────────────────

async function loadVarietyOptions() {
  try {
    const { data: varieties, error } = await sb
      .from("varieties")
      .select("*")
      .eq("is_active", true);

    if (error) throw error;

    const select = document.getElementById('s-variety');
    if (!select) return;

    select.innerHTML = '<option value="">— Select Variety —</option>' + 
      varieties.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
  } catch (err) {
    console.error('Load Variety Options Error:', err);
  }
}

async function submitSize(e) {
  e.preventDefault();

  const isActiveValue = readStatusCheckbox('s-status-checkbox', true);
  const sizePayload = {
    variety_id: document.getElementById('s-variety').value,
    size: document.getElementById('s-size').value.trim(),
    weight_grams: Number(document.getElementById('s-weight-grams').value),
    price: Number(parseFloat(document.getElementById('s-price').value)),
    is_active: isActiveValue
  };

  setLoading('size-submit-btn', true);

  try {
    if (editState.sizeId) {
      await updateAndVerify('sizes', editState.sizeId, sizePayload);
      showToast('size-toast', 'Size updated successfully');
    } else {
      const { error } = await sb.from('sizes').insert([sizePayload]);
      if (error) throw error;
      showToast('size-toast', 'Size added successfully');
    }

    resetSizeForm();
    loadSizes();
    loadStats();

  } catch (err) {
    console.error(err);
    showToast('size-toast', err.message, 'error');
  } finally {
    setLoading('size-submit-btn', false);
  }
}

async function editSize(id, btn) {
  await withButtonLoading(btn, 'Loading…', async () => {
    try {
      const select = document.getElementById('s-variety');
      if (select && select.options.length <= 1) {
        await loadVarietyOptions();
      }

      const { data, error } = await sb
        .from('sizes')
        .select(`
          *,
          varieties (
            id,
            name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Size not found.');

      setSelectValue(select, data.variety_id, data.varieties ? data.varieties.name : '');
      document.getElementById('s-size').value = data.size || '';
      document.getElementById('s-weight-grams').value = data.weight_grams ?? '';
      document.getElementById('s-price').value = data.price ?? '';
      setStatusCheckbox('s-status-checkbox', data.is_active);

      editState.sizeId = data.id;
      setFormEditMode(FORM_MODES.size, true);
    } catch (err) {
      console.error('Edit Size Error:', err);
      showToast('size-toast', err.message || 'Failed to load size for editing', 'error');
    }
  });
}

async function loadSizes() {
  try {
    const { data, error } = await sb
      .from('sizes')
      .select(`
        *,
        varieties (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tbody = document.getElementById('sizes-tbody');

    if (!tbody) return;

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">No sizes found.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data.map(item => `
      <tr>
        <td><strong>${item.varieties ? item.varieties.name : '-'}</strong></td>
        <td>${item.size}</td>
        <td>${item.weight_grams}g</td>
        <td>₹${item.price}</td>
        <td>${renderStatusPill(item.is_active)}</td>
        <td>${formatDate(item.created_at)}</td>
        <td>
          <div class="table-actions">
            <button onclick="editSize('${item.id}', this)" class="btn-edit">
              ${UI_ICONS.edit}<span>Edit</span>
            </button>
            <button onclick="deleteSize('${item.id}', this)" class="btn-delete">
              ${UI_ICONS.trash}<span>Delete</span>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Load Sizes Error:', err);
  }
}

async function deleteSize(id, btn) {
  await deleteWithChildCascade({
    table: 'sizes',
    id,
    btn,
    confirmMessage: 'Delete this size?',
    toastId: 'size-toast',
    successMessage: 'Size deleted successfully',
    errorLabel: 'size',
    onDeleted: () => {
      if (editState.sizeId === id) resetSizeForm();
    },
    onRefresh: async () => {
      await Promise.all([loadSizes(), loadStats()]);
    }
  });
}

function resetSizeForm() {
  editState.sizeId = null;
  document.getElementById('size-form').reset();
  setFormEditMode(FORM_MODES.size, false);
}

// ───────────────── LOAD ORDERS ─────────────────

const orderViews = {
  standard: {
    table: 'product_orders',
    toastId: 'order-toast',
    containerId: 'orders-container',
    tabsId: 'orders-subtabs',
    countPrefix: 'orders-count',
    restoreBtnId: 'orders-restore-btn',
    hiddenCountId: 'orders-hidden-count',
    emptyLabel: 'orders',
    items: [],
    tab: 'new',
    sort: 'desc',
    search: ''
  },
  custom: {
    table: 'customized_orders',
    toastId: 'customization-toast',
    containerId: 'customization-orders-container',
    tabsId: 'custom-orders-subtabs',
    countPrefix: 'custom-orders-count',
    restoreBtnId: 'custom-orders-restore-btn',
    hiddenCountId: 'custom-orders-hidden-count',
    emptyLabel: 'customization orders',
    items: [],
    tab: 'new',
    sort: 'desc',
    search: ''
  }
};

const hiddenOrdersFallback = {};

function getHiddenOrdersKey(table) {
  return `kbite_hidden_orders_${table}`;
}

function getHiddenOrderIds(table) {
  try {
    const raw = localStorage.getItem(getHiddenOrdersKey(table));
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch (e) {
    return new Set(hiddenOrdersFallback[table] || []);
  }
}

function saveHiddenOrderIds(table, set) {
  const arr = [...set];
  hiddenOrdersFallback[table] = arr;
  try {
    localStorage.setItem(getHiddenOrdersKey(table), JSON.stringify(arr));
  } catch (e) {
    // Fallback already updated above
  }
}

function getOrderViewKeyForTable(table) {
  return String(table).includes('custom') ? 'custom' : 'standard';
}

function dismissOrderCard(id, table = 'product_orders') {
  const hiddenSet = getHiddenOrderIds(table);
  hiddenSet.add(String(id));
  saveHiddenOrderIds(table, hiddenSet);

  const viewKey = getOrderViewKeyForTable(table);
  renderOrderView(viewKey);
  showToast(getOrderToastId(table), 'Card hidden from view (order kept in database)');
}

function restoreHiddenOrders(viewKey) {
  const view = orderViews[viewKey];
  if (!view) return;
  saveHiddenOrderIds(view.table, new Set());
  renderOrderView(viewKey);
  showToast(view.toastId, 'Hidden order cards restored');
}

function getOrderBucket(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('complete')) return 'completed';
  if (s.includes('cancel')) return 'cancelled';
  if (s.includes('making') || s.includes('prepar') || s.includes('process')) return 'making';
  return 'new';
}

function getStatusClass(status) {
  const bucket = getOrderBucket(status);
  if (bucket === 'completed') return 'completed';
  if (bucket === 'cancelled') return 'cancelled';
  if (bucket === 'making') return 'processing';
  return 'pending';
}

function switchOrderTab(viewKey, tab) {
  const view = orderViews[viewKey];
  if (!view) return;
  view.tab = tab;

  const tabsEl = document.getElementById(view.tabsId);
  if (tabsEl) {
    tabsEl.querySelectorAll('.order-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
  }

  renderOrderView(viewKey);
}

function setOrderSort(viewKey, sortOrder) {
  const view = orderViews[viewKey];
  if (!view) return;
  view.sort = sortOrder === 'asc' ? 'asc' : 'desc';
  renderOrderView(viewKey);
}

function setOrderSearch(viewKey, query) {
  const view = orderViews[viewKey];
  if (!view) return;
  view.search = (query || '').trim().toLowerCase();
  renderOrderView(viewKey);
}

function matchesOrderSearch(order, q) {
  if (!q) return true;
  const fields = [
    order.order_number,
    order.customer_name,
    order.customer_phone,
    order.customer_email,
    order.customized_product_name
  ];
  return fields.some(val => val && String(val).toLowerCase().includes(q));
}

function renderOrderView(viewKey) {
  const view = orderViews[viewKey];
  if (!view) return;

  const hiddenSet = getHiddenOrderIds(view.table);
  let hiddenCount = 0;
  const visibleItems = [];
  view.items.forEach(order => {
    if (hiddenSet.has(String(order.id))) hiddenCount += 1;
    else visibleItems.push(order);
  });

  const restoreBtn = document.getElementById(view.restoreBtnId);
  const hiddenCountEl = document.getElementById(view.hiddenCountId);
  if (hiddenCountEl) hiddenCountEl.textContent = hiddenCount;
  if (restoreBtn) restoreBtn.classList.toggle('hidden', hiddenCount === 0);

  const counts = { new: 0, making: 0, completed: 0, cancelled: 0 };
  visibleItems.forEach(order => {
    counts[getOrderBucket(order.order_status)] += 1;
  });

  ['new', 'making', 'completed', 'cancelled'].forEach(bucket => {
    const countEl = document.getElementById(`${view.countPrefix}-${bucket}`);
    if (countEl) countEl.textContent = counts[bucket];
  });

  const container = document.getElementById(view.containerId);
  if (!container) return;

  const filtered = visibleItems
    .filter(order => getOrderBucket(order.order_status) === view.tab && matchesOrderSearch(order, view.search))
    .sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return view.sort === 'asc' ? timeA - timeB : timeB - timeA;
    });

  if (filtered.length === 0) {
    const tabLabels = {
      new: `No new ${view.emptyLabel}.`,
      making: `No ${view.emptyLabel} currently in making.`,
      completed: `No completed ${view.emptyLabel} yet.`,
      cancelled: `No cancelled ${view.emptyLabel}.`
    };
    const msg = view.search
      ? `No matching ${view.emptyLabel} found.`
      : (tabLabels[view.tab] || `No ${view.emptyLabel} found.`);
    container.innerHTML = `<div class="empty-state">${msg}</div>`;
    return;
  }

  container.innerHTML = filtered.map(order => renderOrderCardTemplate(order)).join('');
}

async function loadOrders() {
  try {
    const { data, error } = await sb
      .from('product_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const orders = (data || []).map(o => ({ ...o, _type: 'standard' }));
    renderOrders(orders);
  } catch (err) {
    console.error('Load Orders Error:', err);
  }
}

function renderOrders(data) {
  orderViews.standard.items = Array.isArray(data) ? data : [];
  renderOrderView('standard');
}

async function loadCustomizationOrders() {
  try {
    const { data, error } = await sb
      .from('customized_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const orders = (data || []).map(o => ({ ...o, _type: 'custom' }));
    renderCustomizationOrders(orders);
  } catch (err) {
    console.error('Load Customization Orders Error:', err);
  }
}

function renderCustomizationOrders(data) {
  orderViews.custom.items = Array.isArray(data) ? data : [];
  renderOrderView('custom');
}

// Helper for unified order rendering
function renderOrderCardTemplate(order) {
    const isCustom = order._type === 'custom' || !!order.customized_product_name;
    const isCancelled = order.order_status?.toLowerCase().includes('cancel');
    
    // Cancel Reason Display
    const cancelReasonHtml = isCancelled 
      ? `
        <div class="order-detail-row" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(217, 83, 79, 0.2); color: #d9534f;">
          <span class="order-detail-label" style="color: #d9534f; font-weight: 600;">Cancel Reason:</span>
          <span class="order-detail-value">${order.cancel_reason || "No reason provided"}</span>
        </div>
      ` 
      : '';

    let detailsHtml = '';
    let pricingHtml = '';

    if (!isCustom) {
      // Standard Product Order details
      let items = [];
      try {
        items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
      } catch (e) { items = []; }

      const itemsListHtml = items.length ? items.map((item, index) => `
          <div class="order-item-row" style="margin-bottom: 8px; padding-bottom: 8px; ${index < items.length - 1 ? 'border-bottom: 1px solid rgba(0,0,0,0.05);' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; color: var(--text-primary);">${item.name || 'Unknown Product'}</span>
              <span style="font-weight: 600; color: var(--brown-dark);">₹${(item.price || 0) * (item.qty || 1)}</span>
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px; display: flex; gap: 10px;">
              <span><strong>Size:</strong> ${item.selected_size || '-'}</span>
              <span><strong>Qty:</strong> ${item.qty || 1}</span>
              <span><strong>Price:</strong> ₹${item.price || 0}</span>
            </div>
          </div>
        `).join('') : '<p>No items found</p>';

      detailsHtml = `<div class="order-items"><strong>Items:</strong><div class="order-items-list">${itemsListHtml}</div></div>`;
      pricingHtml = `
        <div class="order-pricing">
          <div class="order-pricing-row"><span>Subtotal:</span><span>₹${order.subtotal || 0}</span></div>
          <div class="order-pricing-row"><span>Shipping:</span><span>₹${order.shipping || 0}</span></div>
          <div class="order-pricing-row total"><span>Total:</span><span>₹${order.total || 0}</span></div>
        </div>
      `;
    } else {
      // Customization Order details
      const parseList = (val) => {
        if (!val) return 'None';
        let parsed = val;
        if (typeof val === 'string') { try { parsed = JSON.parse(val); } catch(e) { return val; } }
        if (Array.isArray(parsed)) return parsed.map(item => (typeof item === 'object' && item !== null) ? (item.name || item.label || item.title || JSON.stringify(item)) : item).join(', ');
        return String(parsed);
      };
      
      detailsHtml = `
        <div class="order-detail-row" style="border-top: 1px solid #f0f0f0; margin-top: 8px; padding-top: 8px;">
          <span class="order-detail-label">Base Product:</span>
          <span class="order-detail-value">${order.customized_product_name || 'N/A'}</span>
        </div>
        <div class="order-items">
          <strong>Configuration:</strong>
          <div class="order-items-list" style="margin-top: 8px;">
            <div class="order-item-row" style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(0,0,0,0.05);">
              <div style="font-weight: 600; color: var(--text-primary); font-size: 13px;">Ingredients:</div>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px; line-height: 1.4;">${parseList(order.ingredients)}</div>
            </div>
            <div class="order-item-row" style="margin-bottom: 8px;">
              <div style="font-weight: 600; color: var(--text-primary); font-size: 13px;">Customizations:</div>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px; line-height: 1.4;">${parseList(order.customizations)}</div>
            </div>
          </div>
        </div>
      `;
      pricingHtml = `
        <div class="order-pricing">
          <div class="order-pricing-row"><span>Quantity:</span><span>${order.quantity || 1}</span></div>
          <div class="order-pricing-row total"><span>Total Price:</span><span>₹${order.total_price || 0}</span></div>
        </div>
      `;
    }

    const orderTypeLabel = isCustom ? '<span class="order-type-chip">Custom</span>' : '';
    const bucket = getOrderBucket(order.order_status);
    const tableName = isCustom ? 'customized_orders' : 'product_orders';
    const statusLabel = order.order_status || 'Pending';

    return `
      <div class="order-card">
        <div class="order-header">
          <h3 class="order-number">Order #${order.order_number || 'N/A'} ${orderTypeLabel}</h3>
          <div class="order-header-right">
            <span class="order-status ${getStatusClass(order.order_status)}">${statusLabel}</span>
            <button
              type="button"
              onclick="dismissOrderCard('${order.id}', '${tableName}')"
              class="btn-card-dismiss"
              title="Remove card from view (keeps order in database)"
              aria-label="Remove order card from view"
            >×</button>
          </div>
        </div>
        <div class="order-details">
          <div class="order-detail-row"><span class="order-detail-label">Customer</span><span class="order-detail-value">${order.customer_name || 'N/A'}</span></div>
          <div class="order-detail-row"><span class="order-detail-label">Email</span><span class="order-detail-value">${order.customer_email || 'N/A'}</span></div>
          <div class="order-detail-row"><span class="order-detail-label">Phone</span><span class="order-detail-value">${order.customer_phone || 'N/A'}</span></div>
          <div class="order-detail-row"><span class="order-detail-label">Address</span><span class="order-detail-value">${order.customer_address || ''}, ${order.customer_city || ''} ${order.customer_pincode || ''}</span></div>
          <div class="order-detail-row"><span class="order-detail-label">Payment</span><span class="order-detail-value">${order.payment_method || 'N/A'} (${order.payment_status || 'N/A'})</span></div>
          <div class="order-detail-row"><span class="order-detail-label">Placed On</span><span class="order-detail-value">${formatDateTime(order.created_at)}</span></div>
          ${cancelReasonHtml}
        </div>
        ${detailsHtml}
        ${pricingHtml}
        <div class="order-actions">
          ${bucket === 'new' ? `
            <button onclick="markOrderPreparing('${order.id}', '${tableName}', this)" class="btn-order-action btn-preparing">${UI_ICONS.flame}<span>Preparing</span></button>
          ` : ''}
          ${bucket === 'new' || bucket === 'making' ? `
            <button onclick="completeOrderGeneric('${order.id}', '${tableName}', this)" class="btn-order-action btn-complete">${UI_ICONS.check}<span>Complete</span></button>
            <button onclick="cancelOrderPrompt('${order.id}', '${tableName}', this)" class="btn-order-action btn-cancel">${UI_ICONS.x}<span>Cancel</span></button>
          ` : ''}
          <button onclick="deleteOrderGeneric('${order.id}', '${tableName}', this)" class="btn-order-action btn-delete">${UI_ICONS.trash}<span>Delete</span></button>
        </div>
      </div>
    `;
}

// ───────────────── ORDER ACTIONS ─────────────────

function getOrderToastId(table = 'product_orders') {
  return String(table).includes('custom') ? 'customization-toast' : 'order-toast';
}

async function refreshOrdersForTable(table = 'product_orders') {
  const loader = String(table).includes('custom') ? loadCustomizationOrders : loadOrders;
  await Promise.all([loader(), loadStats()]);
}

async function updateOrderStatus({
  id,
  table = 'product_orders',
  btn,
  confirmMessage = '',
  loadingText = 'Updating…',
  payload,
  successMessage
}) {
  if (confirmMessage && !confirm(confirmMessage)) return;

  const toastId = getOrderToastId(table);
  await withButtonLoading(btn, loadingText, async () => {
    try {
      await updateAndVerify(table, id, payload);
      showToast(toastId, successMessage);
      await refreshOrdersForTable(table);
    } catch (err) {
      console.error('Order Update Error:', err);
      showToast(toastId, err.message || 'Failed to update order', 'error');
    }
  });
}

async function markOrderPreparing(id, table = 'product_orders', btn) {
  return updateOrderStatus({
    id,
    table,
    btn,
    confirmMessage: 'Move this order to Making (Preparing)?',
    loadingText: 'Updating…',
    payload: { order_status: 'Making' },
    successMessage: 'Order moved to Making'
  });
}

async function deleteOrder(id, table = 'product_orders', btn) {
  await deleteWithChildCascade({
    table,
    id,
    btn,
    confirmMessage: 'Delete this order?',
    toastId: getOrderToastId(table),
    successMessage: 'Order deleted successfully',
    errorLabel: 'order',
    onDeleted: () => {
      const hiddenSet = getHiddenOrderIds(table);
      if (hiddenSet.delete(String(id))) {
        saveHiddenOrderIds(table, hiddenSet);
      }
    },
    onRefresh: async () => {
      await refreshOrdersForTable(table);
    }
  });
}

async function deleteOrderGeneric(id, table, btn) {
  return deleteOrder(id, table, btn);
}

async function completeOrder(id, table = 'product_orders', btn) {
  return updateOrderStatus({
    id,
    table,
    btn,
    confirmMessage: 'Mark this order as completed?',
    loadingText: 'Completing…',
    payload: { order_status: 'Completed' },
    successMessage: 'Order marked as completed successfully'
  });
}

async function completeOrderGeneric(id, table, btn) {
  return completeOrder(id, table, btn);
}

async function cancelOrderPrompt(id, table = 'product_orders', btn) {
  const reason = prompt('Please enter the reason for cancellation:', 'Customer requested cancellation');
  if (reason === null) return; // Cancelled prompt

  return updateOrderStatus({
    id,
    table,
    btn,
    loadingText: 'Cancelling…',
    payload: {
      order_status: 'Cancelled',
      cancel_reason: reason || 'No reason provided'
    },
    successMessage: 'Order cancelled successfully'
  });
}

function viewOrder(id) {
  alert('Order ID: ' + id + '\n\nDetailed view functionality can be implemented to show full order details in a modal.');
}

// These are now handled by generic functions above
async function deleteCustomizationOrder(id, btn) { return deleteOrder(id, 'customized_orders', btn); }
async function completeCustomizationOrder(id, btn) { return completeOrder(id, 'customized_orders', btn); }
function viewCustomizationOrder(id) { viewOrder(id); }

// ───────────────── SHIPPING & PRICING SETTINGS ─────────────────

async function loadSettings() {
  try {
    const { data, error } = await sb
      .from('settings')
      .select('*')
      .order('key', { ascending: true });

    if (error) throw error;

    const map = {};
    (data || []).forEach(row => {
      map[row.key] = row.value;
    });

    const shippingEl = document.getElementById('set-shipping-charge');
    const thresholdEl = document.getElementById('set-free-shipping-threshold');
    const basePriceEl = document.getElementById('set-base-item-price');
    const ingPercentEl = document.getElementById('set-ingredient-percent');

    if (shippingEl && map.shipping_charge !== undefined) shippingEl.value = map.shipping_charge;
    if (thresholdEl && map.free_shipping_threshold !== undefined) thresholdEl.value = map.free_shipping_threshold;
    if (basePriceEl && map.base_item_price_per_kg !== undefined) basePriceEl.value = map.base_item_price_per_kg;
    if (ingPercentEl && map.ingredient_weight_percent !== undefined) ingPercentEl.value = map.ingredient_weight_percent;

    const tbody = document.getElementById('settings-tbody');
    if (tbody) {
      if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-cell">No settings configured yet.</td></tr>';
      } else {
        tbody.innerHTML = data.map(row => `
          <tr>
            <td><strong>${row.label || row.key}</strong></td>
            <td><code>${row.key}</code></td>
            <td><strong>${row.key === 'ingredient_weight_percent' ? `${row.value}%` : `₹${row.value}`}</strong></td>
            <td>${formatDateTime(row.updated_at)}</td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Load Settings Error:', err);
    showToast('settings-toast', err.message || 'Failed to load settings', 'error');
  }
}

async function submitSettings(e) {
  e.preventDefault();

  const shippingCharge = parseFloat(document.getElementById('set-shipping-charge').value);
  const freeThreshold = parseFloat(document.getElementById('set-free-shipping-threshold').value);
  const baseItemPrice = parseFloat(document.getElementById('set-base-item-price').value);
  const ingredientPercent = parseFloat(document.getElementById('set-ingredient-percent').value);

  if (
    isNaN(shippingCharge) || shippingCharge < 0 ||
    isNaN(freeThreshold) || freeThreshold < 0 ||
    isNaN(baseItemPrice) || baseItemPrice < 0 ||
    isNaN(ingredientPercent) || ingredientPercent < 0 || ingredientPercent > 100
  ) {
    showToast('settings-toast', 'Please enter valid non-negative numeric values (ingredient % between 0 and 100).', 'error');
    return;
  }

  setLoading('settings-submit-btn', true);

  try {
    const now = new Date().toISOString();
    const payload = [
      { key: 'shipping_charge', value: String(shippingCharge), label: 'Shipping Charge (₹)', updated_at: now },
      { key: 'free_shipping_threshold', value: String(freeThreshold), label: 'Free Shipping Minimum Order (₹)', updated_at: now },
      { key: 'base_item_price_per_kg', value: String(baseItemPrice), label: 'Custom Laddu Base Price per Kg (₹)', updated_at: now },
      { key: 'ingredient_weight_percent', value: String(ingredientPercent), label: 'Custom Laddu Ingredient Weight (%)', updated_at: now },
    ];

    const { error } = await sb
      .from('settings')
      .upsert(payload, { onConflict: 'key' });

    if (error) throw error;

    showToast('settings-toast', 'Shipping & pricing settings saved! User storefront updated live.');
    await loadSettings();
  } catch (err) {
    console.error('Save Settings Error:', err);
    showToast('settings-toast', err.message || 'Failed to save settings', 'error');
  } finally {
    setLoading('settings-submit-btn', false);
  }
}

// ───────────────── START ─────────────────

document.addEventListener('DOMContentLoaded', () => {
  checkAuthState();

  // Initialize status checkboxes to work like radio buttons
  const allStatusCheckboxes = document.querySelectorAll('.p-status-checkbox, .i-status-checkbox, .v-status-checkbox, .s-status-checkbox');
  allStatusCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function () {
      if (this.checked) {
        // Uncheck all other status checkboxes in the same group
        const groupClass = this.className.split(' ').find(cls => cls.endsWith('-status-checkbox'));
        const groupCheckboxes = document.querySelectorAll('.' + groupClass);
        groupCheckboxes.forEach(cb => {
          if (cb !== this) cb.checked = false;
        });
      }
    });
  });
});
