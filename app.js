// ============================================
// NEEMAHCOUTURE — Public Site Logic
// ============================================

// Hero Slideshow
const heroSlides = document.querySelectorAll('.hero-slide');
const heroDots = document.querySelectorAll('.hero-dot');
let currentSlide = 0;
let slideInterval;
const SLIDE_DURATION = 5000;

function showSlide(index) {
  heroSlides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });
  heroDots.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
  currentSlide = index;
}

function nextSlide() {
  showSlide((currentSlide + 1) % heroSlides.length);
}

function prevSlide() {
  showSlide((currentSlide - 1 + heroSlides.length) % heroSlides.length);
}

function startSlideshow() {
  slideInterval = setInterval(nextSlide, SLIDE_DURATION);
}

function stopSlideshow() {
  clearInterval(slideInterval);
}

// Event listeners for hero
const heroEl = document.querySelector('.hero');
if (heroEl) {
  heroEl.addEventListener('mouseenter', stopSlideshow);
  heroEl.addEventListener('mouseleave', startSlideshow);
}

document.querySelector('.hero-arrow.next')?.addEventListener('click', () => {
  stopSlideshow();
  nextSlide();
  startSlideshow();
});

document.querySelector('.hero-arrow.prev')?.addEventListener('click', () => {
  stopSlideshow();
  prevSlide();
  startSlideshow();
});

heroDots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    stopSlideshow();
    showSlide(i);
    startSlideshow();
  });
});

startSlideshow();

// ============================================
// Navbar Scroll Effect
// ============================================
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ============================================
// Mobile Navigation
// ============================================
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinks.classList.toggle('open');
});

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger?.classList.remove('active');
    navLinks?.classList.remove('open');
  });
});

// ============================================
// Scroll Reveal Animation
// ============================================
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

revealElements.forEach(el => revealObserver.observe(el));

// ============================================
// Gallery & Supabase Integration
// ============================================
let allDesigns = [];
let currentFilter = 'All';

async function loadDesigns() {
  const galleryGrid = document.getElementById('gallery-grid');
  if (!galleryGrid) return;

  try {
    // Check if Supabase is configured
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
      showGalleryPlaceholder(galleryGrid);
      return;
    }

    const { data, error } = await supabaseClient
      .from('designs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    allDesigns = data || [];
    renderGallery(allDesigns);
    renderFeatured(allDesigns.filter(d => d.featured));
  } catch (err) {
    console.error('Error loading designs:', err);
    showGalleryPlaceholder(galleryGrid);
  }
}

function showGalleryPlaceholder(container) {
  container.innerHTML = `
    <div class="empty-state" style="grid-column: 1 / -1;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
      <h4>No designs yet</h4>
      <p>Visit the admin panel to upload your first design.</p>
    </div>
  `;
}

function renderGallery(designs) {
  const galleryGrid = document.getElementById('gallery-grid');
  if (!galleryGrid) return;

  if (designs.length === 0) {
    showGalleryPlaceholder(galleryGrid);
    return;
  }

  galleryGrid.innerHTML = designs.map((design, index) => `
    <div class="gallery-item reveal" data-category="${design.category}" onclick="openLightbox(${index})" style="animation-delay: ${index * 0.05}s">
      <img src="${design.image_url}" alt="${design.title}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\'img-placeholder\'>Image unavailable</div>'">
      <div class="gallery-overlay">
        <h4>${design.title}</h4>
        <span class="category-tag">${design.category}</span>
      </div>
    </div>
  `).join('');

  // Re-observe new elements
  galleryGrid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

function renderFeatured(designs) {
  const featuredGrid = document.getElementById('featured-grid');
  if (!featuredGrid) return;

  if (designs.length === 0) {
    featuredGrid.innerHTML = '<p style="text-align:center;color:var(--gray-mid);">No featured designs yet.</p>';
    return;
  }

  featuredGrid.innerHTML = designs.slice(0, 6).map((design, index) => `
    <div class="gallery-item reveal" onclick="openLightbox(${allDesigns.indexOf(design)})" style="animation-delay: ${index * 0.1}s">
      <img src="${design.image_url}" alt="${design.title}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\'img-placeholder\'>Image unavailable</div>'">
      <div class="gallery-overlay">
        <h4>${design.title}</h4>
        <span class="category-tag">${design.category}</span>
      </div>
    </div>
  `).join('');

  featuredGrid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

// Gallery Filtering
const filterBtns = document.querySelectorAll('.filter-btn');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;

    if (currentFilter === 'All') {
      renderGallery(allDesigns);
    } else {
      renderGallery(allDesigns.filter(d => d.category === currentFilter));
    }
  });
});

// ============================================
// Lightbox
// ============================================
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxTitle = document.getElementById('lightbox-title');
const lightboxDesc = document.getElementById('lightbox-desc');

function openLightbox(index) {
  const design = allDesigns[index];
  if (!design) return;

  lightboxImg.src = design.image_url;
  lightboxImg.alt = design.title;
  lightboxTitle.textContent = design.title;
  lightboxDesc.textContent = design.description || design.category;
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

// ============================================
// Business Info
// ============================================
async function loadBusinessInfo() {
  try {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return;

    const { data, error } = await supabaseClient
      .from('business_info')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) return;

    // Update contact details
    const fields = ['address', 'phone', 'whatsapp', 'email', 'hours', 'instagram', 'facebook', 'twitter'];
    fields.forEach(field => {
      const el = document.getElementById(`biz-${field}`);
      if (el && data[field]) {
        if (field === 'phone' || field === 'whatsapp') {
          el.href = `tel:${data[field].replace(/\s/g, '')}`;
          el.textContent = data[field];
        } else if (field === 'email') {
          el.href = `mailto:${data[field]}`;
          el.textContent = data[field];
        } else if (field === 'instagram') {
          el.href = `https://instagram.com/${data[field].replace('@', '')}`;
        } else if (field === 'facebook') {
          el.href = data[field];
        } else if (field === 'twitter') {
          el.href = `https://twitter.com/${data[field].replace('@', '')}`;
        } else {
          el.textContent = data[field];
        }
      }
    });

    // Update WhatsApp float
    const waFloat = document.getElementById('whatsapp-float');
    if (waFloat && data.whatsapp) {
      const cleanNumber = data.whatsapp.replace(/\D/g, '');
      waFloat.href = `https://wa.me/${cleanNumber}`;
    }

    // Update about text
    const aboutText = document.getElementById('about-text');
    if (aboutText && data.about_text) {
      aboutText.innerHTML = data.about_text;
    }

    // Update footer address
    const footerAddress = document.getElementById('footer-address');
    if (footerAddress && data.address) {
      footerAddress.textContent = data.address;
    }

  } catch (err) {
    console.error('Error loading business info:', err);
  }
}

// ============================================
// Contact Form
// ============================================
const contactForm = document.getElementById('contact-form');
contactForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Clear previous errors
  document.querySelectorAll('.form-error').forEach(el => el.classList.remove('visible'));
  document.querySelector('.form-success')?.classList.remove('visible');

  const name = document.getElementById('contact-name').value.trim();
  const phone = document.getElementById('contact-phone').value.trim();
  const email = document.getElementById('contact-email').value.trim();
  const styleInterest = document.getElementById('contact-style').value;
  const message = document.getElementById('contact-message').value.trim();

  let hasError = false;

  if (!name) {
    document.getElementById('error-name').classList.add('visible');
    hasError = true;
  }
  if (!phone && !email) {
    document.getElementById('error-contact').classList.add('visible');
    hasError = true;
  }
  if (!message) {
    document.getElementById('error-message').classList.add('visible');
    hasError = true;
  }

  if (hasError) return;

  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<span class="loading-spinner"></span> Sending...';
  submitBtn.disabled = true;

  try {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      const { error } = await supabaseClient.from('contacts').insert([{
        name, phone, email, style_interest: styleInterest, message
      }]);
      if (error) throw error;
    }

    document.querySelector('.form-success').classList.add('visible');
    contactForm.reset();
  } catch (err) {
    console.error('Error submitting contact:', err);
    alert('Something went wrong. Please try again or contact us directly via WhatsApp.');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  loadDesigns();
  loadBusinessInfo();
});
