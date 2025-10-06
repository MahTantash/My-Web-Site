// scripts.js - Custom JS for YourBusiness website

// Typing animation for homepage headline
const phrases = [
  "Empowering Your Business",
  "Modern Websites, Reliable IT Support",
  "Affordable. Fast. Professional.",
  "Your Tech Partner in Jordan"
];
let currentPhrase = 0;
let currentChar = 0;
const headline = document.getElementById('animated-headline');

function typePhrase() {
  if (!headline) return;
  const phrase = phrases[currentPhrase];
  headline.textContent = phrase.slice(0, currentChar);
  if (currentChar < phrase.length) {
    currentChar++;
    setTimeout(typePhrase, 60);
  } else {
    setTimeout(erasePhrase, 1800);
  }
}

function erasePhrase() {
  const phrase = phrases[currentPhrase];
  if (currentChar > 0) {
    currentChar--;
    headline.textContent = phrase.slice(0, currentChar);
    setTimeout(erasePhrase, 30);
  } else {
    currentPhrase = (currentPhrase + 1) % phrases.length;
    setTimeout(typePhrase, 400);
  }
}

// Dynamic content rendering for public site
async function renderDynamicContent() {
  // Show all loading spinners
  ['home','about','services','portfolio','contact'].forEach(id => {
    const el = document.getElementById(id+'-loading');
    if (el) el.style.display = 'flex';
  });
  try {
    const res = await fetch('/api/admin/content');
    if (!res.ok) throw new Error('Failed to fetch content');
    const content = await res.json();

    // Hide loading spinners after rendering each section
    const hide = id => { const el = document.getElementById(id+'-loading'); if (el) el.style.display = 'none'; };

    // Homepage
    if (content.homepage) {
      const headline = content.homepage.headline || 'Empowering Your Business';
      const subheadline = content.homepage.subheadline || 'Professional Website Creation & IT Support Services for Modern Businesses';
      const heroImage = content.homepage.heroImage;
      document.getElementById('animated-headline').textContent = headline;
      const heroSection = document.getElementById('home');
      if (heroImage) {
        let img = heroSection.querySelector('.dynamic-hero-img');
        if (!img) {
          img = document.createElement('img');
          img.className = 'dynamic-hero-img mx-auto mb-6 rounded shadow max-h-64';
          img.alt = 'Hero Image';
          img.loading = 'lazy';
          heroSection.querySelector('.relative.z-10').prepend(img);
        }
        img.src = heroImage;
        img.style.display = '';
      } else {
        const img = heroSection.querySelector('.dynamic-hero-img');
        if (img) img.style.display = 'none';
      }
      // Subheadline
      const sub = heroSection.querySelector('p.text-lg, p.md\:text-2xl');
      if (sub) sub.textContent = subheadline;
      hide('home');
    }

    // About
    if (content.about) {
      const aboutSection = document.getElementById('about');
      if (aboutSection) {
        aboutSection.querySelector('h2').textContent = 'About Us';
        aboutSection.querySelector('span.font-semibold').textContent = content.about.founder || 'Founded by John Doe';
        aboutSection.querySelectorAll('li')[0].querySelector('span').textContent = `Our Mission: ${content.about.mission || 'To help businesses grow with seamless digital solutions and expert IT support.'}`;
        aboutSection.querySelectorAll('li')[1].querySelector('span').textContent = content.about.experience || '10+ years of industry experience';
        if (content.about.image) {
          let img = aboutSection.querySelector('.about-img-dynamic');
          if (!img) {
            img = document.createElement('img');
            img.className = 'about-img-dynamic w-40 h-40 rounded-full object-cover mb-8 md:mb-0 border-4 border-[#00BFA6]';
            img.alt = 'Founder';
            img.loading = 'lazy';
            aboutSection.querySelector('div.flex-shrink-0').innerHTML = '';
            aboutSection.querySelector('div.flex-shrink-0').appendChild(img);
          }
          img.src = content.about.image;
          img.style.display = '';
        }
        hide('about');
      }
    }

    // Services
    if (Array.isArray(content.services)) {
      const servicesSection = document.getElementById('website-services');
      if (servicesSection) {
        const grid = servicesSection.querySelector('.grid');
        if (grid) {
          grid.innerHTML = '';
          content.services.forEach(service => {
            const card = document.createElement('div');
            card.className = 'bg-[#0A0F2C] rounded-xl shadow-lg p-8 flex flex-col items-center text-center hover:scale-105 transition';
            card.innerHTML = `
              <i class="${service.icon || 'fas fa-cogs'} text-4xl text-[#00BFA6] mb-4"></i>
              <h3 class="font-bold text-xl mb-2">${service.title || 'Service'}</h3>
              <p class="mb-2">${service.description || ''}</p>
              <span class="text-[#00BFA6] font-semibold">${service.price ? 'From $' + service.price : ''}</span>
            `;
            grid.appendChild(card);
          });
        }
        hide('services');
      }
    }

    // Portfolio
    if (Array.isArray(content.portfolio)) {
      const portfolioSection = document.getElementById('portfolio');
      if (portfolioSection) {
        const grid = portfolioSection.querySelector('.grid');
        if (grid) {
          grid.innerHTML = '';
          if (content.portfolio.length === 0) {
            const coming = document.createElement('div');
            coming.className = 'col-span-full text-center text-[#00BFA6] text-xl py-12';
            coming.textContent = 'Portfolio coming soon!';
            grid.appendChild(coming);
          } else {
            content.portfolio.forEach(project => {
              const card = document.createElement('div');
              card.className = 'bg-[#10163A] rounded-xl shadow-lg overflow-hidden';
              card.innerHTML = `
                <img src="${project.image || 'img/placeholder1.jpg'}" alt="${project.title || 'Project'}" class="w-full h-48 object-cover" loading="lazy">
                <div class="p-6">
                  <h3 class="font-bold text-xl text-[#00BFA6] mb-2">${project.title || 'Project'}</h3>
                  <p class="text-white">${project.description || ''}</p>
                </div>
              `;
              grid.appendChild(card);
            });
          }
        }
        hide('portfolio');
      }
    }

    // Contact Info
    if (content.contact) {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.querySelector('span[href^="mailto"]')?.replaceWith(document.createTextNode(content.contact.email || 'info@yourbusiness.com'));
        const emailDiv = contactSection.querySelector('div.flex.items-center.gap-3.text-white');
        if (emailDiv) emailDiv.querySelector('span').textContent = content.contact.email || 'info@yourbusiness.com';
        const waBtn = contactSection.querySelector('a[href^="https://wa.me/"]');
        if (waBtn) waBtn.href = content.contact.whatsapp ? `https://wa.me/${content.contact.whatsapp}` : 'https://wa.me/962790000000';
        const hoursDiv = contactSection.querySelectorAll('div.flex.items-center.gap-3.text-white')[1];
        if (hoursDiv) hoursDiv.querySelector('span').textContent = `Business Hours: ${content.contact.hours || 'Sun-Thu 9:00am - 6:00pm'}`;
        if (content.contact.logo) {
          let logo = contactSection.querySelector('.contact-logo-dynamic');
          if (!logo) {
            logo = document.createElement('img');
            logo.className = 'contact-logo-dynamic mx-auto mb-4 max-h-20';
            logo.alt = 'Business Logo';
            logo.loading = 'lazy';
            contactSection.prepend(logo);
          }
          logo.src = content.contact.logo;
          logo.style.display = '';
        }
        hide('contact');
      }
    }
  } catch (err) {
    // Show error message in each section
    ['home','about','services','portfolio','contact'].forEach(id => {
      const el = document.getElementById(id+'-loading');
      if (el) el.innerHTML = '<span class="text-red-400">Failed to load content. Please try again later.</span>';
    });
    console.error('Dynamic content load failed:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  typePhrase();
  renderDynamicContent();
});

// Add smooth scroll for anchor links
const navLinks = document.querySelectorAll('nav a[href^="#"]');
navLinks.forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      window.scrollTo({
        top: target.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  });
});

// AJAX form submission for quote form
const quoteForm = document.getElementById('quote-form');
if (quoteForm) {
  quoteForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(quoteForm);
    const data = Object.fromEntries(formData.entries());
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        document.getElementById('quote-success').classList.remove('hidden');
        quoteForm.reset();
      } else {
        alert('There was an error submitting your request. Please try again.');
      }
    } catch (err) {
      alert('There was an error submitting your request. Please try again.');
    }
  });
} 