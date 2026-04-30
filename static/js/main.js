// ── Mobile nav toggle ────────────────────────────────────────────────────────
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
}

// ── Active nav link ──────────────────────────────────────────────────────────
const currentPath = window.location.pathname;
document.querySelectorAll('.nav-links a').forEach(a => {
  if (a.getAttribute('href') === currentPath) a.classList.add('active');
});
document.querySelectorAll('.admin-nav-links a').forEach(a => {
  if (a.getAttribute('href') === currentPath) a.classList.add('active');
});

// ── Reject form toggle ───────────────────────────────────────────────────────
document.querySelectorAll('.toggle-reject').forEach(btn => {
  btn.addEventListener('click', () => {
    const form = btn.closest('.approval-actions, .admin-actions')
      ?.querySelector('.reject-form');
    if (form) form.classList.toggle('open');
  });
});

// ── Image lightbox ───────────────────────────────────────────────────────────
const overlay = document.getElementById('img-modal');
const overlayImg = document.getElementById('img-modal-img');
if (overlay) {
  document.querySelectorAll('.lightbox-trigger').forEach(img => {
    img.addEventListener('click', () => {
      overlayImg.src = img.src;
      overlay.classList.add('open');
    });
  });
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
  document.getElementById('img-modal-close')?.addEventListener('click', () => {
    overlay.classList.remove('open');
  });
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const group = btn.dataset.group;
    document.querySelectorAll(`.tab-btn[data-group="${group}"]`).forEach(b => b.classList.remove('active'));
    document.querySelectorAll(`.tab-content[data-group="${group}"]`).forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.target)?.classList.add('active');
  });
});

// ── Auto-dismiss flash messages ──────────────────────────────────────────────
setTimeout(() => {
  document.querySelectorAll('.alert').forEach(el => {
    el.style.transition = 'opacity 0.5s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 500);
  });
}, 4000);
