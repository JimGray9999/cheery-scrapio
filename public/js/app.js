/* Balance — vanilla JS, no jQuery */

// ── Toast ────────────────────────────────────────────────
let toastTimer;

function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = 'toast show' + (type ? ' ' + type : '');
  toastTimer = setTimeout(() => {
    toast.className = 'toast';
  }, 3500);
}

// ── Dialogs ──────────────────────────────────────────────

function openDialog(id) {
  const dialog = document.getElementById('dialog-' + id);
  if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
}

function closeDialog(id) {
  const dialog = document.getElementById('dialog-' + id);
  if (dialog) dialog.close();
}

// Open on "Add note" button click
document.addEventListener('click', e => {
  const btn = e.target.closest('.btn-comment');
  if (btn) openDialog(btn.dataset.id);
});

// Close via ✕ button or Cancel
document.addEventListener('click', e => {
  const btn = e.target.closest('.dialog-close, .btn-cancel');
  if (btn) closeDialog(btn.dataset.id);
});

// Close when clicking the backdrop (outside the dialog box)
document.addEventListener('click', e => {
  if (e.target.tagName === 'DIALOG') {
    e.target.close();
  }
});

// ── Save note ────────────────────────────────────────────

document.addEventListener('submit', async e => {
  const form = e.target.closest('.dialog-form');
  if (!form) return;
  e.preventDefault();

  const id = form.dataset.id;
  const errorEl = form.querySelector('.dialog-error');
  const setError = msg => {
    if (errorEl) errorEl.textContent = msg;
  };
  if (errorEl) errorEl.textContent = '';

  const header = form.querySelector(`#note-header-${id}`).value.trim();
  const text = form.querySelector(`#note-text-${id}`).value.trim();

  if (!header || !text) {
    setError('Please fill in both fields.');
    return;
  }

  const saveBtn = form.querySelector('.btn-save');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  try {
    const res = await fetch('/articles/' + id, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ header, text }),
    });

    const data = await res.json();

    if (!res.ok) {
      // express-validator returns { errors: [...] } on 400
      const msg = data.errors?.[0]?.msg || data.error || 'Server error';
      throw new Error(msg);
    }

    form.reset();
    closeDialog(id);
    showToast('Note saved!');

    // Add note badge to the card if not already present
    const card = document.querySelector(`.article-card[data-id="${id}"]`);
    if (card && !card.querySelector('.card-note-badge')) {
      const badge = document.createElement('span');
      badge.className = 'card-note-badge';
      badge.textContent = '✦ Note saved';
      card.querySelector('.card-footer').prepend(badge);
    }
  } catch (err) {
    setError(err.message || 'Error saving note.');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Note';
  }
});

// ── Active nav link ──────────────────────────────────────

(function markActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link[data-path]').forEach(link => {
    if (link.dataset.path === path) link.classList.add('active');
  });
})();

// ── :has() fallback for empty-state ─────────────────────
// Modern browsers handle this in CSS; this covers anything that doesn't.
// Guard on .col-articles so this is a no-op on pages without columns.

(function emptyStateFallback() {
  const cols = document.querySelectorAll('.col-articles');
  if (!cols.length || CSS.supports('selector(:has(.x))')) return;
  cols.forEach(col => {
    if (!col.querySelector('.article-card')) {
      const es = col.querySelector('.empty-state');
      if (es) es.style.display = 'block';
    }
  });
})();
