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

// ── Load more (cursor-based pagination) ──────────────────

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeHref(url) {
  return /^https?:\/\//i.test(url) ? url : '#';
}

function buildCard(a) {
  const id = a._id;
  const time = a.time ? `<p class="card-meta">${escapeHtml(a.time)}</p>` : '';
  const badge = a.note ? '<span class="card-note-badge">&#10022; Note saved</span>' : '';
  return `<div class="article-card" data-id="${id}">
  <p class="card-source">${escapeHtml(a.source)}</p>
  <h3 class="card-title">
    <a href="${escapeHtml(safeHref(a.link))}" target="_blank" rel="noopener noreferrer">${escapeHtml(a.title)}</a>
  </h3>
  ${time}
  <div class="card-footer">
    ${badge}
    <button class="btn-comment" type="button" data-id="${id}">Add note</button>
  </div>
</div>
<dialog id="dialog-${id}" class="comment-dialog" aria-labelledby="dialog-title-${id}">
  <div class="dialog-header">
    <h4 id="dialog-title-${id}">Add Note</h4>
    <button class="dialog-close" type="button" data-id="${id}" aria-label="Close">&#x2715;</button>
  </div>
  <div class="dialog-article">
    <span class="dialog-source">${escapeHtml(a.source)}</span>
    <p class="dialog-title">${escapeHtml(a.title)}</p>
  </div>
  <form class="dialog-form" data-id="${id}">
    <p role="alert" class="dialog-error"></p>
    <div class="form-field">
      <label for="note-header-${id}">Title</label>
      <input id="note-header-${id}" type="text" name="header" placeholder="Give your note a title…" required minlength="3" maxlength="100" />
    </div>
    <div class="form-field">
      <label for="note-text-${id}">Comment</label>
      <textarea id="note-text-${id}" name="text" rows="4" placeholder="Write your note here…" required minlength="10" maxlength="1000"></textarea>
    </div>
    <div class="dialog-actions">
      <button type="button" class="btn-cancel" data-id="${id}">Cancel</button>
      <button type="submit" class="btn-save">Save Note</button>
    </div>
  </form>
</dialog>`;
}

document.addEventListener('click', async e => {
  const btn = e.target.closest('.btn-load-more');
  if (!btn) return;

  const filter = btn.dataset.filter;
  const cursor = btn.dataset.cursor;
  btn.disabled = true;
  btn.textContent = 'Loading…';

  try {
    const res = await fetch(
      `/api/articles?filter=${encodeURIComponent(filter)}&before=${encodeURIComponent(cursor)}`
    );
    if (!res.ok) throw new Error('Server error');
    const { articles, nextCursor } = await res.json();

    const fragment = document
      .createRange()
      .createContextualFragment(articles.map(buildCard).join('\n'));
    btn.before(fragment);

    if (nextCursor) {
      btn.dataset.cursor = nextCursor;
      btn.disabled = false;
      btn.textContent = 'Load more';
    } else {
      btn.remove();
    }
  } catch {
    btn.disabled = false;
    btn.textContent = 'Load more';
    showToast('Error loading articles.', 'error');
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
