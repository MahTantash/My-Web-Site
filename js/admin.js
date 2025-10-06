// admin.js - Admin panel logic

// Elements
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const adminLogin = document.getElementById('admin-login');
const adminDashboard = document.getElementById('admin-dashboard');
const logoutBtn = document.getElementById('logout-btn');
const tabBtns = document.querySelectorAll('.tab-btn');
const contentTab = document.getElementById('content-tab');
const contactsTab = document.getElementById('contacts-tab');
const contentForm = document.getElementById('content-form');
const saveContentBtn = document.getElementById('save-content-btn');
const contentSuccess = document.getElementById('content-success');
const contactsTableBody = document.getElementById('contacts-table-body');

// Section-by-section content editing and image upload
const imageFields = [
  { input: 'homepage_hero_image', preview: 'preview_homepage_hero_image', contentKey: 'homepage.heroImage' },
  { input: 'about_image', preview: 'preview_about_image', contentKey: 'about.image' },
  { input: 'contact_logo', preview: 'preview_contact_logo', contentKey: 'contact.logo' }
];

// Login
if (loginForm) {
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const data = {
      username: loginForm.username.value,
      password: loginForm.password.value
    };
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      adminLogin.classList.add('hidden');
      adminDashboard.classList.remove('hidden');
      loadContent();
      loadContacts();
    } else {
      loginError.classList.remove('hidden');
    }
  });
}

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener('click', async function() {
    await fetch('/api/admin/logout', { method: 'POST' });
    adminDashboard.classList.add('hidden');
    adminLogin.classList.remove('hidden');
  });
}

// Tab switching
if (tabBtns) {
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      tabBtns.forEach(b => b.classList.remove('bg-[#00BFA6]', 'text-[#0A0F2C]'));
      this.classList.add('bg-[#00BFA6]', 'text-[#0A0F2C]');
      if (this.dataset.tab === 'content') {
        contentTab.classList.remove('hidden');
        contactsTab.classList.add('hidden');
      } else {
        contentTab.classList.add('hidden');
        contactsTab.classList.remove('hidden');
        loadContacts();
      }
    });
  });
}

// Load content for editing
async function loadContent() {
  const res = await fetch('/api/admin/content');
  if (!res.ok) return;
  const data = await res.json();
  // Generate form fields dynamically (simple example)
  contentForm.innerHTML = '';
  for (const section in data) {
    const value = typeof data[section] === 'object' ? JSON.stringify(data[section], null, 2) : data[section];
    contentForm.innerHTML += `
      <div>
        <label class="block mb-2 text-[#00BFA6] font-semibold">${section.charAt(0).toUpperCase() + section.slice(1)}</label>
        <textarea name="${section}" rows="4" class="w-full px-4 py-2 rounded bg-[#10163A] text-white focus:outline-none focus:ring-2 focus:ring-[#00BFA6]">${value}</textarea>
      </div>
    `;
  }
}

// Helper: upload image and return URL
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.path;
}

// Quill.js WYSIWYG editors
let homepageIntroQuill, aboutContentQuill, contactInfoQuill;
let servicesQuills = [];

function initQuillEditors(servicesCount = 1) {
  homepageIntroQuill = new Quill('#homepage_intro_quill', { theme: 'snow' });
  aboutContentQuill = new Quill('#about_content_quill', { theme: 'snow' });
  contactInfoQuill = new Quill('#contact_info_quill', { theme: 'snow' });
  // Services: one Quill per service
  const container = document.getElementById('services_quill_container');
  container.innerHTML = '';
  servicesQuills = [];
  for (let i = 0; i < servicesCount; i++) {
    const div = document.createElement('div');
    div.id = `service_quill_${i}`;
    div.className = 'quill-editor mb-4';
    container.appendChild(div);
    const quill = new Quill(`#service_quill_${i}`, { theme: 'snow' });
    servicesQuills.push(quill);
  }
}

// Populate form fields from backend content (with Quill)
async function populateContentForm() {
  const res = await fetch('/api/admin/content');
  if (!res.ok) return;
  const content = await res.json();
  // Homepage
  contentForm.homepage_headline.value = content.homepage.headline || '';
  contentForm.homepage_subheadline.value = content.homepage.subheadline || '';
  if (content.homepage.heroImage) {
    document.getElementById('preview_homepage_hero_image').src = content.homepage.heroImage;
    document.getElementById('preview_homepage_hero_image').classList.remove('hidden');
  }
  // Quill: homepage intro
  homepageIntroQuill && homepageIntroQuill.root && homepageIntroQuill.root.innerHTML !== undefined && (homepageIntroQuill.root.innerHTML = content.homepage.intro || '');

  // About
  contentForm.about_founder.value = content.about.founder || '';
  contentForm.about_mission.value = content.about.mission || '';
  contentForm.about_experience.value = content.about.experience || '';
  if (content.about.image) {
    document.getElementById('preview_about_image').src = content.about.image;
    document.getElementById('preview_about_image').classList.remove('hidden');
  }
  // Quill: about content
  aboutContentQuill && aboutContentQuill.root && aboutContentQuill.root.innerHTML !== undefined && (aboutContentQuill.root.innerHTML = content.about.content || '');

  // Services
  let services = Array.isArray(content.services) ? content.services : [];
  initQuillEditors(services.length || 1);
  services.forEach((service, i) => {
    servicesQuills[i].root.innerHTML = service.description || '';
  });
  // Set service titles/prices/icons if present
  servicesQuills.forEach((quill, i) => {
    if (!services[i]) services[i] = {};
    if (!services[i].title) services[i].title = '';
    if (!services[i].price) services[i].price = '';
    if (!services[i].icon) services[i].icon = '';
  });
  // Portfolio and contact handled below

  // Portfolio (handled in next step)

  // Contact
  contentForm.contact_email.value = content.contact.email || '';
  contentForm.contact_whatsapp.value = content.contact.whatsapp || '';
  contentForm.contact_hours.value = content.contact.hours || '';
  if (content.contact.logo) {
    document.getElementById('preview_contact_logo').src = content.contact.logo;
    document.getElementById('preview_contact_logo').classList.remove('hidden');
  }
  // Quill: contact info
  contactInfoQuill && contactInfoQuill.root && contactInfoQuill.root.innerHTML !== undefined && (contactInfoQuill.root.innerHTML = content.contact.info || '');
}

// Image upload and preview
imageFields.forEach(({ input, preview }) => {
  const inputEl = document.querySelector(`input[name='${input}']`);
  const previewEl = document.getElementById(preview);
  if (inputEl) {
    inputEl.addEventListener('change', async function() {
      if (this.files && this.files[0]) {
        const url = await uploadImage(this.files[0]);
        previewEl.src = url;
        previewEl.classList.remove('hidden');
        previewEl.dataset.uploaded = url;
      }
    });
  }
});

// Portfolio Manager
let portfolioItems = [];
const portfolioManager = document.getElementById('portfolio-manager');
const addPortfolioBtn = document.getElementById('add-portfolio-item');

function renderPortfolioManager() {
  if (!portfolioManager) return;
  portfolioManager.innerHTML = '';
  portfolioItems.forEach((item, idx) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'bg-[#10163A] rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 shadow relative draggable-portfolio';
    wrapper.draggable = true;
    wrapper.dataset.idx = idx;
    // Drag handle
    const dragHandle = document.createElement('span');
    dragHandle.className = 'fas fa-grip-lines text-[#00BFA6] cursor-move absolute left-2 top-2';
    dragHandle.title = 'Drag to reorder';
    wrapper.appendChild(dragHandle);
    // Image upload/preview
    const imgDiv = document.createElement('div');
    imgDiv.className = 'flex flex-col items-center';
    const img = document.createElement('img');
    img.src = item.image || 'img/placeholder1.jpg';
    img.alt = 'Project Image';
    img.className = 'w-32 h-24 object-cover rounded mb-2';
    img.loading = 'lazy';
    imgDiv.appendChild(img);
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.className = 'block';
    fileInput.addEventListener('change', async function() {
      if (this.files && this.files[0]) {
        const url = await uploadImage(this.files[0]);
        img.src = url;
        portfolioItems[idx].image = url;
      }
    });
    imgDiv.appendChild(fileInput);
    wrapper.appendChild(imgDiv);
    // Title
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = item.title || '';
    titleInput.placeholder = 'Project Title';
    titleInput.className = 'w-full md:w-48 px-2 py-1 rounded bg-[#232a4d] text-white mb-2';
    titleInput.addEventListener('input', e => portfolioItems[idx].title = e.target.value);
    wrapper.appendChild(titleInput);
    // Description
    const descInput = document.createElement('textarea');
    descInput.value = item.description || '';
    descInput.placeholder = 'Project Description';
    descInput.className = 'w-full px-2 py-1 rounded bg-[#232a4d] text-white mb-2';
    descInput.addEventListener('input', e => portfolioItems[idx].description = e.target.value);
    wrapper.appendChild(descInput);
    // Delete button
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'absolute top-2 right-2 text-red-400 hover:text-red-600';
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.title = 'Delete Project';
    delBtn.addEventListener('click', () => {
      portfolioItems.splice(idx, 1);
      renderPortfolioManager();
    });
    wrapper.appendChild(delBtn);
    portfolioManager.appendChild(wrapper);
  });
  // Drag-and-drop reordering
  let dragSrcIdx = null;
  portfolioManager.querySelectorAll('.draggable-portfolio').forEach(el => {
    el.addEventListener('dragstart', e => {
      dragSrcIdx = Number(el.dataset.idx);
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragover', e => e.preventDefault());
    el.addEventListener('drop', e => {
      e.preventDefault();
      const targetIdx = Number(el.dataset.idx);
      if (dragSrcIdx !== null && dragSrcIdx !== targetIdx) {
        const moved = portfolioItems.splice(dragSrcIdx, 1)[0];
        portfolioItems.splice(targetIdx, 0, moved);
        renderPortfolioManager();
      }
      dragSrcIdx = null;
    });
  });
}
if (addPortfolioBtn) {
  addPortfolioBtn.addEventListener('click', () => {
    portfolioItems.push({ title: '', description: '', image: '' });
    renderPortfolioManager();
  });
}
// Populate portfolio from backend
async function populatePortfolio(content) {
  portfolioItems = Array.isArray(content.portfolio) ? content.portfolio : [];
  renderPortfolioManager();
}

// On dashboard load, initialize Quill editors
if (adminDashboard) {
  document.addEventListener('DOMContentLoaded', () => {
    initQuillEditors();
    populateContentForm();
  });
}
// Also after login
if (loginForm) {
  loginForm.addEventListener('submit', function() {
    setTimeout(() => {
      initQuillEditors();
      populateContentForm();
    }, 500);
  });
}

// Save content (with Quill)
if (saveContentBtn) {
  const origSaveHandler = saveContentBtn.onclick;
  saveContentBtn.addEventListener('click', async function() {
    const data = {
      homepage: {
        headline: contentForm.homepage_headline.value,
        subheadline: contentForm.homepage_subheadline.value,
        heroImage: document.getElementById('preview_homepage_hero_image').dataset.uploaded || document.getElementById('preview_homepage_hero_image').src || '',
        intro: homepageIntroQuill ? homepageIntroQuill.root.innerHTML : ''
      },
      about: {
        founder: contentForm.about_founder.value,
        mission: contentForm.about_mission.value,
        experience: contentForm.about_experience.value,
        image: document.getElementById('preview_about_image').dataset.uploaded || document.getElementById('preview_about_image').src || '',
        content: aboutContentQuill ? aboutContentQuill.root.innerHTML : ''
      },
      services: [],
      portfolio: [],
      contact: {
        email: contentForm.contact_email.value,
        whatsapp: contentForm.contact_whatsapp.value,
        hours: contentForm.contact_hours.value,
        logo: document.getElementById('preview_contact_logo').dataset.uploaded || document.getElementById('preview_contact_logo').src || '',
        info: contactInfoQuill ? contactInfoQuill.root.innerHTML : ''
      }
    };
    // Services: collect from Quill editors
    data.services = servicesQuills.map((quill, i) => ({
      title: '', // Add UI for title if needed
      price: '', // Add UI for price if needed
      icon: '',  // Add UI for icon if needed
      description: quill.root.innerHTML
    }));
    // Portfolio: collect from portfolio manager
    data.portfolio = portfolioItems;
    // Portfolio and other fields handled below
    const res = await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      contentSuccess.classList.remove('hidden');
      setTimeout(() => contentSuccess.classList.add('hidden'), 2000);
      populateContentForm();
    }
  });
}

// Load contact requests
async function loadContacts() {
  const res = await fetch('/api/admin/contacts');
  if (!res.ok) return;
  const data = await res.json();
  contactsTableBody.innerHTML = '';
  data.reverse().forEach(req => {
    contactsTableBody.innerHTML += `
      <tr>
        <td class="px-4 py-2">${req.name}</td>
        <td class="px-4 py-2">${req.email}</td>
        <td class="px-4 py-2">${req.phone}</td>
        <td class="px-4 py-2">${req.service}</td>
        <td class="px-4 py-2">${req.message}</td>
        <td class="px-4 py-2">${new Date(req.date).toLocaleString()}</td>
      </tr>
    `;
  });
} 