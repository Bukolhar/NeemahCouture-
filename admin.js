// ============================================
// NEEMAHCOUTURE — Admin Dashboard Logic
// ============================================

let currentUser = null;
let allDesigns = [];
let allContacts = [];
let currentSection = 'dashboard';

// Check auth status
async function checkAuth() {
  try {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
      showLoginPage();
      return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      currentUser = session.user;
      showAdminPanel();
    } else {
      showLoginPage();
    }
  } catch (err) {
    console.error('Auth check error:', err);
    showLoginPage();
  }
}

// Show login page
function showLoginPage() {
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('admin-panel').style.display = 'none';
}

// Show admin panel
function showAdminPanel() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'flex';
  loadDashboard();
}

// Login
const loginForm = document.getElementById('login-form');
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  const btn = loginForm.querySelector('button[type="submit"]');

  errorEl.style.display = 'none';
  btn.innerHTML = '<span class="loading-spinner" style="border-color:rgba(0,0,0,0.2);border-top-color:var(--charcoal)"></span> Signing in...';
  btn.disabled = true;

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    currentUser = data.user;
    showAdminPanel();
  } catch (err) {
    errorEl.textContent = err.message || 'Invalid credentials';
    errorEl.style.display = 'block';
  } finally {
    btn.innerHTML = 'Sign In';
    btn.disabled = false;
  }
});

// Logout
document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  currentUser = null;
  showLoginPage();
});

// Navigation
document.querySelectorAll('.admin-nav a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = link.dataset.section;
    switchSection(section);
  });
});

function switchSection(section) {
  currentSection = section;
  document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
  document.getElementById(`section-${section}`).style.display = 'block';
  document.querySelectorAll('.admin-nav a').forEach(a => a.classList.remove('active'));
  document.querySelector(`.admin-nav a[data-section="${section}"]`).classList.add('active');

  switch (section) {
    case 'dashboard': loadDashboard(); break;
    case 'designs': loadDesigns(); break;
    case 'upload': break;
    case 'contacts': loadContacts(); break;
    case 'settings': loadSettings(); break;
  }
}

// Toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast-${type}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================
// Dashboard
// ============================================
async function loadDashboard() {
  try {
    const [{ count: designsCount }, { count: contactsCount }] = await Promise.all([
      supabaseClient.from('designs').select('*', { count: 'exact', head: true }),
      supabaseClient.from('contacts').select('*', { count: 'exact', head: true })
    ]);

    document.getElementById('dash-designs').textContent = designsCount || 0;
    document.getElementById('dash-contacts').textContent = contactsCount || 0;

    // Recent designs
    const { data: recentDesigns } = await supabaseClient
      .from('designs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    const tbody = document.getElementById('dash-recent-designs');
    if (recentDesigns && recentDesigns.length > 0) {
      tbody.innerHTML = recentDesigns.map(d => `
        <tr>
          <td><img src="${d.image_url}" alt="" style="width:50px;height:50px;object-fit:cover;border-radius:4px;"></td>
          <td>${d.title}</td>
          <td><span class="badge badge-gold">${d.category}</span></td>
          <td>${new Date(d.created_at).toLocaleDateString()}</td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;padding:2rem;">No designs yet</td></tr>';
    }

    // Recent contacts
    const { data: recentContacts } = await supabaseClient
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    const cbody = document.getElementById('dash-recent-contacts');
    if (recentContacts && recentContacts.length > 0) {
      cbody.innerHTML = recentContacts.map(c => `
        <tr>
          <td>${c.name}</td>
          <td>${c.style_interest || '-'}</td>
          <td>${c.message.substring(0, 50)}${c.message.length > 50 ? '...' : ''}</td>
          <td>${new Date(c.created_at).toLocaleDateString()}</td>
        </tr>
      `).join('');
    } else {
      cbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;padding:2rem;">No inquiries yet</td></tr>';
    }

  } catch (err) {
    console.error('Dashboard error:', err);
  }
}

// ============================================
// Designs Management
// ============================================
async function loadDesigns() {
  try {
    const { data, error } = await supabaseClient
      .from('designs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allDesigns = data || [];

    const tbody = document.getElementById('designs-table-body');
    if (allDesigns.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:3rem;">No designs uploaded yet. Go to Upload to add your first design.</td></tr>';
      return;
    }

    tbody.innerHTML = allDesigns.map(d => `
      <tr>
        <td><img src="${d.image_url}" alt="${d.title}"></td>
        <td>${d.title}</td>
        <td><span class="badge badge-gold">${d.category}</span></td>
        <td>${d.featured ? '⭐ Yes' : 'No'}</td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="toggleFeatured('${d.id}', ${!d.featured})" style="margin-right:0.5rem;">
            ${d.featured ? 'Unfeature' : 'Feature'}
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteDesign('${d.id}', '${d.image_url}')">Delete</button>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Load designs error:', err);
    showToast('Failed to load designs', 'error');
  }
}

async function toggleFeatured(id, featured) {
  try {
    const { error } = await supabaseClient
      .from('designs')
      .update({ featured })
      .eq('id', id);

    if (error) throw error;
    showToast(featured ? 'Design featured!' : 'Design unfeatured');
    loadDesigns();
  } catch (err) {
    showToast('Error updating design', 'error');
  }
}

async function deleteDesign(id, imageUrl) {
  if (!confirm('Are you sure you want to delete this design? This cannot be undone.')) return;

  try {
    // Delete from storage if possible
    if (imageUrl && imageUrl.includes('/designs/')) {
      const path = imageUrl.split('/designs/').pop();
      await supabaseClient.storage.from('designs').remove([path]);
    }

    const { error } = await supabaseClient.from('designs').delete().eq('id', id);
    if (error) throw error;

    showToast('Design deleted successfully');
    loadDesigns();
  } catch (err) {
    console.error('Delete error:', err);
    showToast('Error deleting design', 'error');
  }
}

// ============================================
// Upload Design
// ============================================
const uploadForm = document.getElementById('upload-form');
const imageInput = document.getElementById('upload-image');
const uploadPreview = document.getElementById('upload-preview');

imageInput?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB', 'error');
      imageInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadPreview.src = e.target.result;
      uploadPreview.classList.add('visible');
    };
    reader.readAsDataURL(file);
  }
});

uploadForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = imageInput.files[0];
  const title = document.getElementById('upload-title').value.trim();
  const category = document.getElementById('upload-category').value;
  const description = document.getElementById('upload-description').value.trim();
  const featured = document.getElementById('upload-featured').checked;

  if (!file || !title || !category) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  const btn = uploadForm.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="loading-spinner"></span> Uploading...';
  btn.disabled = true;

  try {
    // Upload image to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage.from('designs')
      .upload(fileName, file, { contentType: file.type });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabaseClient
      .storage.from('designs')
      .getPublicUrl(fileName);

    // Save to database
    const { error: dbError } = await supabaseClient.from('designs').insert([{
      title, category, description, image_url: publicUrl, featured
    }]);

    if (dbError) throw dbError;

    showToast('Design uploaded successfully!');
    uploadForm.reset();
    uploadPreview.classList.remove('visible');
    switchSection('designs');
  } catch (err) {
    console.error('Upload error:', err);
    showToast('Upload failed: ' + (err.message || 'Unknown error'), 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});

// ============================================
// Contacts
// ============================================
async function loadContacts() {
  try {
    const { data, error } = await supabaseClient
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allContacts = data || [];

    const tbody = document.getElementById('contacts-table-body');
    if (allContacts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:3rem;">No inquiries received yet.</td></tr>';
      return;
    }

    tbody.innerHTML = allContacts.map(c => `
      <tr>
        <td>${c.name}</td>
        <td>${c.phone || c.email || '-'}</td>
        <td>${c.style_interest || '-'}</td>
        <td>${c.message.substring(0, 60)}${c.message.length > 60 ? '...' : ''}</td>
        <td>${new Date(c.created_at).toLocaleDateString()}</td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Load contacts error:', err);
    showToast('Failed to load contacts', 'error');
  }
}

// ============================================
// Settings / Business Info
// ============================================
async function loadSettings() {
  try {
    const { data, error } = await supabaseClient
      .from('business_info')
      .select('*')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      document.getElementById('set-address').value = data.address || '';
      document.getElementById('set-phone').value = data.phone || '';
      document.getElementById('set-whatsapp').value = data.whatsapp || '';
      document.getElementById('set-email').value = data.email || '';
      document.getElementById('set-hours').value = data.hours || '';
      document.getElementById('set-instagram').value = data.instagram || '';
      document.getElementById('set-facebook').value = data.facebook || '';
      document.getElementById('set-twitter').value = data.twitter || '';
      document.getElementById('set-about').value = data.about_text || '';
    }
  } catch (err) {
    console.error('Load settings error:', err);
  }
}

const settingsForm = document.getElementById('settings-form');
settingsForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn = settingsForm.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="loading-spinner" style="border-color:rgba(0,0,0,0.2);border-top-color:var(--charcoal)"></span> Saving...';
  btn.disabled = true;

  try {
    const updates = {
      id: 1,
      address: document.getElementById('set-address').value.trim(),
      phone: document.getElementById('set-phone').value.trim(),
      whatsapp: document.getElementById('set-whatsapp').value.trim(),
      email: document.getElementById('set-email').value.trim(),
      hours: document.getElementById('set-hours').value.trim(),
      instagram: document.getElementById('set-instagram').value.trim(),
      facebook: document.getElementById('set-facebook').value.trim(),
      twitter: document.getElementById('set-twitter').value.trim(),
      about_text: document.getElementById('set-about').value.trim()
    };

    const { error } = await supabaseClient
      .from('business_info')
      .upsert(updates, { onConflict: 'id' });

    if (error) throw error;

    showToast('Business info saved successfully!');
  } catch (err) {
    console.error('Save settings error:', err);
    showToast('Failed to save settings', 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});
