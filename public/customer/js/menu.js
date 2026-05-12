// ── Unified Item Detail Modal ──────────────────────────────────────────────
function openItemModal(name, description, imageUrl, dietary, allergens) {
  const modal          = document.getElementById('itemModal');
  const modalImage     = document.getElementById('itemModalImage');
  const modalName      = document.getElementById('itemModalName');
  const modalDesc      = document.getElementById('itemModalDescription');
  const dietarySection = document.getElementById('itemModalDietarySection');
  const allergenSection= document.getElementById('itemModalAllergenSection');
  const dietaryTags    = document.getElementById('itemModalDietaryTags');
  const allergenTags   = document.getElementById('itemModalAllergenTags');
  const noInfo         = document.getElementById('itemModalNoInfo');

  if (!modal) return;

  modalName.textContent = name || '';
  dietaryTags.innerHTML  = '';
  allergenTags.innerHTML = '';

  if (imageUrl) {
    modalImage.src = imageUrl;
    modalImage.alt = name || '';
    modalImage.style.display = 'block';
  } else {
    modalImage.style.display = 'none';
    modalImage.src = '';
  }

  if (description) {
    modalDesc.textContent    = description;
    modalDesc.style.display  = 'block';
  } else {
    modalDesc.style.display  = 'none';
  }

  const hasDietary   = dietary   && dietary.length   > 0;
  const hasAllergens = allergens && allergens.length  > 0;

  if (hasDietary) {
    dietary.forEach(tag => {
      const span = document.createElement('span');
      span.className   = 'tag tag-dietary';
      span.textContent = tag;
      dietaryTags.appendChild(span);
    });
    dietarySection.style.display = 'block';
  } else {
    dietarySection.style.display = 'none';
  }

  if (hasAllergens) {
    allergens.forEach(tag => {
      const span = document.createElement('span');
      span.className   = 'tag tag-allergen';
      span.textContent = tag;
      allergenTags.appendChild(span);
    });
    allergenSection.style.display = 'block';
  } else {
    allergenSection.style.display = 'none';
  }

  const hasAnyInfo = imageUrl || description || hasDietary || hasAllergens;
  noInfo.style.display = hasAnyInfo ? 'none' : 'block';

  modal.setAttribute('aria-hidden', 'false');
  modal.classList.remove('closing');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeItemModal() {
  const modal = document.getElementById('itemModal');
  if (!modal) return;
  modal.classList.add('closing');
  setTimeout(function () {
    modal.classList.remove('active');
    modal.classList.remove('closing');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }, 240);
}

// ── Scroll helpers ─────────────────────────────────────────────────────────
function getScrollOffset() {
  const topbar  = document.querySelector('.menu-topbar');
  const catNav  = document.getElementById('categoryNav');
  const topbarH = topbar  ? topbar.offsetHeight  : 0;
  const catNavH = catNav  ? catNav.offsetHeight   : 0;
  return topbarH + catNavH;
}

function updateActiveCategory() {
  const sections = document.querySelectorAll('.category-section');
  const navLinks = document.querySelectorAll('.category-nav-link');
  const offset   = getScrollOffset() + 20;
  const scrollPos = window.scrollY + offset;
  let current = '';

  sections.forEach(function (section) {
    if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
      current = section.id;
    }
  });

  navLinks.forEach(function (link) {
    link.classList.toggle('active', link.getAttribute('href') === '#' + current);
  });
}

// ── Set Menu expand / collapse ─────────────────────────────────────────────
function openSetMenuDetails(detailsEl, triggerBtn) {
  detailsEl.classList.add('open');
  detailsEl.setAttribute('aria-hidden', 'false');
  if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'true');
}

function closeSetMenuDetails(detailsEl, triggerBtn) {
  detailsEl.classList.remove('open');
  detailsEl.setAttribute('aria-hidden', 'true');
  if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'false');
}

// ── Boot ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

  // ── Set menu expand triggers ──────────────────────────────────
  document.querySelectorAll('.set-menu-expand-trigger').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const article   = this.closest('.set-menu-item--compact');
      if (!article) return;
      const detailsEl = article.querySelector('.set-menu-details--collapsible');
      if (!detailsEl) return;
      const isOpen = this.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        closeSetMenuDetails(detailsEl, this);
      } else {
        openSetMenuDetails(detailsEl, this);
      }
    });
  });

  // ── Set menu collapse triggers (bottom) ───────────────────────
  document.querySelectorAll('.set-menu-collapse-trigger').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const detailsEl = this.closest('.set-menu-details--collapsible');
      if (!detailsEl) return;
      const article   = detailsEl.closest('.set-menu-item--compact');
      const expandBtn = article ? article.querySelector('.set-menu-expand-trigger') : null;
      closeSetMenuDetails(detailsEl, expandBtn);
      if (expandBtn) {
        expandBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  // ── Item detail modal triggers ────────────────────────────────
  document.querySelectorAll('.item-detail-trigger').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const dietary   = JSON.parse(this.dataset.dietary   || '[]');
      const allergens = JSON.parse(this.dataset.allergens || '[]');
      openItemModal(
        this.dataset.itemName,
        this.dataset.itemDescription,
        this.dataset.itemImage,
        dietary,
        allergens
      );
    });
  });

  // ── Close modal ───────────────────────────────────────────────
  const itemModal = document.getElementById('itemModal');
  if (itemModal) {
    document.getElementById('itemModalClose').addEventListener('click', closeItemModal);
    document.getElementById('itemModalOverlay').addEventListener('click', closeItemModal);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeItemModal();
  });

  // ── Category nav ──────────────────────────────────────────────
  const categoryNav     = document.getElementById('categoryNav');
  const categoryNavInner   = document.getElementById('categoryNavInner');
  const categoryNavChevron = document.getElementById('categoryNavChevron');

  if (categoryNav) {
    categoryNav.querySelectorAll('.category-nav-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.getElementById(this.getAttribute('href').substring(1));
        if (target) {
          window.scrollTo({ top: target.offsetTop - getScrollOffset() - 20, behavior: 'smooth' });
        }
      });
    });

    function updateStuck() {
      const topbarH = document.querySelector('.menu-topbar') ? document.querySelector('.menu-topbar').offsetHeight : 0;
      categoryNav.classList.toggle('stuck', window.scrollY > categoryNav.offsetTop - topbarH);
    }

    // ── Chevron overflow hint ────────────────────────────────────────────────
    function updateChevron() {
      if (!categoryNavInner || !categoryNavChevron) return;
      const canScroll = categoryNavInner.scrollWidth > categoryNavInner.clientWidth;
      const atEnd     = categoryNavInner.scrollLeft + categoryNavInner.clientWidth >= categoryNavInner.scrollWidth - 8;
      categoryNavChevron.classList.toggle('visible', canScroll && !atEnd);
    }

    if (categoryNavInner) {
      categoryNavInner.addEventListener('scroll', updateChevron, { passive: true });
    }

    window.addEventListener('resize', updateChevron, { passive: true });
    window.addEventListener('scroll', updateActiveCategory, { passive: true });
    window.addEventListener('scroll', updateStuck, { passive: true });
    updateActiveCategory();
    updateStuck();
    updateChevron();
  }
});
