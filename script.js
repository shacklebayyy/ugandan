/**
 * UGANDAN FIXER - FRONTEND CONTROLLER
 * Dynamic image loading, hot-swapping detection, masonry rendering, custom lightbox, and animations.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    images: [],
    filteredImages: [],
    currentFilter: 'all',
    lightboxIndex: 0,
    testimonialIndex: 0,
    testimonials: [],
    companies: []
  };

  // DOM Elements
  const header = document.querySelector('.header');
  const heroBg = document.getElementById('hero-bg');
  const aboutImg = document.getElementById('about-img');
  const servicesGrid = document.getElementById('services-grid');
  const portfolioGrid = document.getElementById('portfolio-grid');
  const filterBar = document.getElementById('filter-bar');
  const testimonialTrack = document.getElementById('testimonial-track');
  const carouselDots = document.getElementById('carousel-dots');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const companyMarquee = document.getElementById('company-marquee');
  const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
  const navmenu = document.querySelector('.navmenu');

  // Lightbox DOM
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = lightbox.querySelector('.lightbox-img');
  const lightboxCaption = lightbox.querySelector('.lightbox-caption');
  const lightboxCounter = lightbox.querySelector('.lightbox-counter');
  const lightboxClose = lightbox.querySelector('.lightbox-close');
  const lightboxPrev = lightbox.querySelector('.lightbox-prev');
  const lightboxNext = lightbox.querySelector('.lightbox-next');

  const themeToggle = document.getElementById('theme-toggle');
  const themeToggleIcon = document.getElementById('theme-toggle-icon');

  // Theme Setup (Light Mode Default, Toggleable)
  const currentTheme = localStorage.getItem('theme') || 'light';
  if (currentTheme === 'light') {
    document.body.classList.add('light-mode');
    if (themeToggleIcon) themeToggleIcon.className = 'bi bi-sun';
  } else {
    document.body.classList.remove('light-mode');
    if (themeToggleIcon) themeToggleIcon.className = 'bi bi-moon-stars';
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      const theme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
      localStorage.setItem('theme', theme);
      if (themeToggleIcon) {
        themeToggleIcon.className = theme === 'light' ? 'bi bi-sun' : 'bi bi-moon-stars';
      }
    });
  }

  // Header scroll class
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (mobileNavToggle && navmenu) {
    mobileNavToggle.addEventListener('click', () => {
      navmenu.classList.toggle('active');
      const isExpanded = navmenu.classList.contains('active');
      mobileNavToggle.className = isExpanded ? 'mobile-nav-toggle bi bi-x' : 'mobile-nav-toggle bi bi-list';
    });

    // Close menu when clicking nav links
    navmenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navmenu.classList.remove('active');
        mobileNavToggle.className = 'mobile-nav-toggle bi bi-list';
      });
    });
  }

  // Define Services data
  const servicesData = [
    { id: 'accommodation', title: 'Accommodation', icon: 'bi-house-heart', desc: 'We can get the best deals with various hotels and lodges in Uganda, tailored to production budgets.', imgKeywords: ['catering', 'crew'] },
    { id: 'cast', title: 'Cast', icon: 'bi-people', desc: 'We source experienced Casting Directors and organize call outs, video castings, talent negotiations, interpreters, and translators.', imgKeywords: ['casting'] },
    { id: 'catering', title: 'Catering', icon: 'bi-egg-fried', desc: 'We manage catering needs, whether it is meals in the bush over several weeks or studio shoots.', imgKeywords: ['catering'] },
    { id: 'costume', title: 'Costume & Styling', icon: 'bi-scissors', desc: 'Uganda has creative, talented designers experienced across a wide range of film genres and historical periods.', imgKeywords: ['briefing', 'crew'] },
    { id: 'crew', title: 'Crew Sourcing', icon: 'bi-camera-video', desc: 'We provide a talented pool of professional, experienced crew and assist with securing Media Accreditation for foreign crew.', imgKeywords: ['crew', 'globo'] },
    { id: 'equipment', title: 'Equipment & Customs', icon: 'bi-sliders', desc: 'We source local grip/gaffer gear and cameras. We also handle full customs clearance for imported production gear.', imgKeywords: ['briefing', 'crew'] },
    { id: 'licenses', title: 'Location Licenses', icon: 'bi-file-earmark-lock', desc: 'We secure film permits quickly. We manage clearances around Kampala and upcountry with strong local relationships.', imgKeywords: ['street', 'briefing'] },
    { id: 'scouting', title: 'Location Scouting', icon: 'bi-compass', desc: 'We hold an extensive location library and scout unique and interesting locations all around Uganda.', imgKeywords: ['hoima', '6663', 'landscape'] },
    { id: 'post', title: 'Post Production', icon: 'bi-cpu', desc: 'We facilitate offline edits with internationally trained, experienced local editors.', imgKeywords: ['briefing', 'street'] },
    { id: 'support', title: 'Pre-Production Support', icon: 'bi-journal-check', desc: 'We assist with research, scripting, scheduling, budget management, and all required paperwork.', imgKeywords: ['briefing'] },
    { id: 'security', title: 'Security', icon: 'bi-shield-check', desc: 'We organize security according to the location requirements, using company armed guards or local security.', imgKeywords: ['security'] },
    { id: 'travel', title: 'Travel & Transport', icon: 'bi-truck', desc: 'We organize airport transfers, safe and reliable 4x4 car hire, guide/driver hire, and internal regional flights.', imgKeywords: ['driver'] }
  ];

  // Initialize Application
  init();

  async function init() {
    try {
      // 1. Fetch images from manifest
      let manifestImages = [];
      try {
        const res = await fetch('./Website fotos/optimized/manifest.json');
        manifestImages = await res.json();
      } catch (err) {
        console.warn('Could not load optimized manifest.json, relying on directory scanner.', err);
      }

      // 2. Perform live directory scanning to find any hot-swapped or newly added photos
      const scannedImages = await scanDirectoryForNewImages(manifestImages);
      
      // Combine manifest and scanned images
      state.images = [...manifestImages];
      
      // Add scanned images if they aren't already present in manifest
      scannedImages.forEach(scanned => {
        const exists = state.images.some(img => img.filename === scanned.filename);
        if (!exists) {
          state.images.push(scanned);
        }
      });

      if (state.images.length === 0) {
        console.error('No images found in website fotos folder.');
        // Create emergency placeholder images if empty
        createPlaceholderManifest();
      }

      // 3. Render Hero Section
      setupHeroBackground();

      // 4. Render About Image
      setupAboutImage();

      // 5. Render Services Grid
      renderServices();

      // 6. Setup Portfolio
      setupPortfolio();

      // 7. Load Testimonials and Companies
      loadTestimonialsAndCompanies();

      // 8. Initialize Premium Interactive Features
      initViewfinderTimecode();
      initInteractiveMap();
      init3DTiltCards();
      initScrollReveals();
      initScrollToTop();

    } catch (error) {
      console.error('Failed to initialize website content:', error);
    }
  }

  // Image category helper for dynamic folder scan
  function determineCategoriesFromFilename(filename) {
    const name = filename.lower();
    const cats = [];
    if (['rhino', 'lion', 'elephant', 'chimp', 'giraffe'].some(k => name.includes(k))) cats.push('Wildlife');
    if (['drone', 'img_20170317', 'img_20180314', 'img_20180321'].some(k => name.includes(k))) cats.push('Drone');
    if (['landscape', 'hoima', 'dsc_6663', 'img_2016'].some(k => name.includes(k))) cats.push('Landscapes');
    if (['img_0074', 'img_0361', 'street'].some(k => name.includes(k))) cats.push('Cities');
    if (['dscn7228', 'dscn7588', 'dscn7735'].some(k => name.includes(k))) cats.push('Culture');
    if (name.includes('caviar')) cats.push('Commercial');
    if (name.includes('globo')) cats.push('TV Production');
    if (['catering', 'crew', 'briefing', 'security', 'driver', 'casting'].some(k => name.includes(k))) {
      cats.push('Behind the Scenes');
      cats.push('TV Production');
    }
    if (['catering', 'security', 'driver', 'casting'].some(k => name.includes(k))) cats.push('Services');
    if (['20180619', 'dscn7735', 'rhino', 'street'].some(k => name.includes(k))) cats.push('Documentary');
    
    if (cats.length === 0) {
      cats.push(name.includes('crew') ? 'Behind the Scenes' : 'Landscapes');
    }
    return cats;
  }

  // Image Alt Helper for dynamic folder scan
  function determineAltFromFilename(filename) {
    const name = filename.toLowerCase();
    if (name.includes('catering')) return "On-location catering services in Uganda";
    if (name.includes('driver')) return "Professional driver and production vehicle in Uganda";
    if (name.includes('casting')) return "Local casting session and talent in Uganda";
    if (name.includes('security')) return "Security team coordinating layout on filming set";
    if (name.includes('briefing')) return "Behind the scenes crew briefing before production";
    if (name.includes('rhino')) return "Filming wildlife and rhinos in Uganda";
    if (name.includes('hoima')) return "Scenic landscapes of Hoima, Uganda";
    if (name.includes('caviar')) return "Commercial filming crew on location with Caviar London";
    if (name.includes('globo')) return "Brazilian TV Globo crew filming on site";
    if (name.includes('street')) return "Behind the scenes street filming on location in Kampala";
    if (name.includes('chimp')) return "Wild chimpanzee in Kibale Forest, Uganda";
    if (name.includes('giraffe')) return "Giraffes in Uganda's wild national parks";
    if (name.includes('lion')) return "Savanna lions in Uganda";
    if (name.includes('elephant')) return "Savanna elephants walking on safari";
    return "Uganda film production location and crew photos";
  }

  // Live scan function
  async function scanDirectoryForNewImages(manifestImages) {
    try {
      const response = await fetch('./Website fotos/What we do/');
      if (!response.ok) return [];
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      
      const links = Array.from(doc.querySelectorAll('a'))
        .map(a => a.getAttribute('href'))
        .filter(href => href && href.match(/\.(jpe?g|png|gif|webp)$/i))
        .map(href => {
          const parts = href.split('/');
          return decodeURIComponent(parts[parts.length - 1]);
        })
        .filter(filename => !filename.startsWith('._') && !filename.includes('__MACOSX'));
      
      const uniqueLinks = [...new Set(links)];
      const newImages = [];

      for (const filename of uniqueLinks) {
        // If image not in manifest, construct dynamic entry
        const inManifest = manifestImages.some(img => img.filename === filename);
        if (!inManifest) {
          const fileLower = filename.toLowerCase();
          const categories = determineCategoriesFromFilename(fileLower);
          const alt = determineAltFromFilename(fileLower);
          
          newImages.push({
            filename: filename,
            aspectRatio: 1.5, // default
            avgColor: 'rgb(24, 24, 28)', // default surface
            categories: categories,
            alt: alt,
            width: 1200,
            height: 800,
            paths: {
              small: `./Website fotos/What we do/${filename}`,
              medium: `./Website fotos/What we do/${filename}`,
              large: `./Website fotos/What we do/${filename}`
            }
          });
        }
      }
      return newImages;
    } catch (e) {
      console.log('Directory listing fetch failed (this is normal on servers with directory index disabled).');
      return [];
    }
  }

  // Setup random Hero background with dynamic cross-fade slideshow
  function setupHeroBackground() {
    if (!heroBg || state.images.length === 0) return;
    
    // Choose landscape, TV Production, or Documentary images
    const heroPool = state.images.filter(img => 
      img.categories.includes('Landscapes') || 
      img.categories.includes('TV Production') || 
      img.categories.includes('Documentary')
    );

    const pool = heroPool.length > 0 ? heroPool : state.images;
    
    // Initial display
    let currentHeroIdx = Math.floor(Math.random() * pool.length);
    const firstImg = pool[currentHeroIdx];
    const firstUrl = firstImg.paths.large || firstImg.paths.medium;
    
    heroBg.style.backgroundImage = `url("${firstUrl}")`;
    heroBg.style.opacity = '1';

    if (pool.length <= 1) return;

    // Create the second background layer dynamically for cross-fading
    const bg1 = heroBg;
    const bg2 = document.createElement('div');
    bg2.className = 'hero-bg hero-bg-parallax';
    bg2.id = 'hero-bg-2';
    bg2.style.opacity = '0';
    
    // Insert bg2 right after bg1 in the DOM
    bg1.parentNode.insertBefore(bg2, bg1.nextSibling);

    let activeBg = 1;

    // Interval to cycle images with cross-fade
    setInterval(() => {
      currentHeroIdx = (currentHeroIdx + 1) % pool.length;
      const nextImg = pool[currentHeroIdx];
      const nextUrl = nextImg.paths.large || nextImg.paths.medium;

      // Preload image before starting the transition to prevent blank flashes
      const imgPreloader = new Image();
      imgPreloader.onload = () => {
        if (activeBg === 1) {
          bg2.style.backgroundImage = `url("${nextUrl}")`;
          bg1.style.opacity = '0';
          bg2.style.opacity = '1';
          activeBg = 2;
        } else {
          bg1.style.backgroundImage = `url("${nextUrl}")`;
          bg2.style.opacity = '0';
          bg1.style.opacity = '1';
          activeBg = 1;
        }
      };
      imgPreloader.src = nextUrl;
    }, 6000); // Transitions every 6 seconds
  }

  // Setup About image
  function setupAboutImage() {
    if (!aboutImg || state.images.length === 0) return;

    // Prefer team or behind the scenes images
    const aboutPool = state.images.filter(img => 
      img.categories.includes('Behind the Scenes') || 
      img.categories.includes('Services')
    );

    const pool = aboutPool.length > 0 ? aboutPool : state.images;
    const selectImage = pool[0] || state.images[0];
    
    aboutImg.src = selectImage.paths.medium;
    aboutImg.alt = selectImage.alt;
    aboutImg.setAttribute('loading', 'lazy');
    aboutImg.parentNode.style.backgroundColor = selectImage.avgColor;
  }

  // Render services grid
  function renderServices() {
    if (!servicesGrid || state.images.length === 0) return;
    servicesGrid.innerHTML = '';

    servicesData.forEach(service => {
      // Find matching image by keywords
      let matchedImage = null;
      for (const kw of service.imgKeywords) {
        matchedImage = state.images.find(img => img.filename.toLowerCase().includes(kw));
        if (matchedImage) break;
      }
      // Fallback
      if (!matchedImage) {
        matchedImage = state.images.find(img => img.categories.includes('Services')) || state.images[0];
      }

      const card = document.createElement('div');
      card.className = 'service-card';
      
      const imgUrl = matchedImage.paths.medium || matchedImage.paths.small;

      card.innerHTML = `
        <div class="service-img-wrapper" style="background-color: ${matchedImage.avgColor}">
          <img src="${imgUrl}" class="service-img" alt="${service.title}" loading="lazy">
        </div>
        <div class="service-content">
          <div class="service-icon-box">
            <i class="bi ${service.icon}"></i>
          </div>
          <h3>${service.title}</h3>
          <p>${service.desc}</p>
        </div>
      `;
      servicesGrid.appendChild(card);
    });
  }

  // Setup Portfolio filters and Grid
  function setupPortfolio() {
    if (!portfolioGrid) return;

    // Render filter buttons
    const categories = ['all', 'Documentary', 'Wildlife', 'Commercial', 'TV Production', 'Drone', 'Landscapes', 'Cities', 'Culture', 'Behind the Scenes'];
    
    if (filterBar) {
      filterBar.innerHTML = '';
      categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `filter-btn ${cat === 'all' ? 'active' : ''}`;
        btn.textContent = cat === 'all' ? 'All Work' : cat;
        btn.addEventListener('click', () => {
          document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          filterPortfolio(cat);
        });
        filterBar.appendChild(btn);
      });
    }

    // Initial render
    filterPortfolio('all');
  }

  // Filter portfolio images
  function filterPortfolio(category) {
    state.currentFilter = category;
    
    if (category === 'all') {
      state.filteredImages = state.images.filter(img => !img.categories.includes('Services'));
    } else {
      state.filteredImages = state.images.filter(img => img.categories.includes(category));
    }

    renderPortfolioGrid();
  }

  // Render masonry items
  function renderPortfolioGrid() {
    if (!portfolioGrid) return;
    portfolioGrid.innerHTML = '';

    if (state.filteredImages.length === 0) {
      portfolioGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 0;">No images in this category yet.</div>';
      return;
    }

    state.filteredImages.forEach((img, index) => {
      const item = document.createElement('div');
      item.className = 'masonry-item';
      item.style.backgroundColor = img.avgColor;
      
      const imgUrl = img.paths.small || img.paths.medium;

      // Prevent layout shifts using height placeholder calculated from aspect ratio
      const width = 360;
      const height = Math.round(width / img.aspectRatio);

      item.innerHTML = `
        <img src="${imgUrl}" alt="${img.alt}" loading="lazy" style="aspect-ratio: ${img.aspectRatio}" width="${width}" height="${height}">
        <div class="masonry-info">
          <h4>${img.alt}</h4>
          <div class="masonry-tags">
            ${img.categories.map(c => `<span class="masonry-tag">${c}</span>`).join('')}
          </div>
        </div>
      `;

      item.addEventListener('click', () => {
        openLightbox(index);
      });

      portfolioGrid.appendChild(item);
    });
  }

  // Lightbox functionality
  function openLightbox(index) {
    state.lightboxIndex = index;
    updateLightbox();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
  }

  function updateLightbox() {
    const imgData = state.filteredImages[state.lightboxIndex];
    if (!imgData) return;

    // Show loading background color placeholder
    lightboxImg.src = '';
    lightboxImg.style.backgroundColor = imgData.avgColor;
    
    // Set high-res image
    const largeUrl = imgData.paths.large || imgData.paths.medium;
    lightboxImg.src = largeUrl;
    lightboxImg.alt = imgData.alt;
    
    lightboxCaption.textContent = imgData.alt;
    lightboxCounter.textContent = `${state.lightboxIndex + 1} / ${state.filteredImages.length}`;
  }

  function nextLightbox() {
    state.lightboxIndex = (state.lightboxIndex + 1) % state.filteredImages.length;
    updateLightbox();
  }

  function prevLightbox() {
    state.lightboxIndex = (state.lightboxIndex - 1 + state.filteredImages.length) % state.filteredImages.length;
    updateLightbox();
  }

  // Event Listeners for Lightbox
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxNext) lightboxNext.addEventListener('click', nextLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', prevLightbox);

  // Close lightbox on click outside the image
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
      closeLightbox();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextLightbox();
    if (e.key === 'ArrowLeft') prevLightbox();
  });

  // Load Testimonials & Companies data
  function loadTestimonialsAndCompanies() {
    state.testimonials = [
      { author: 'Seb Lafont', role: 'Producer', quote: 'Bill fixed our documentary for 3 weeks all around Uganda. From national parks to the remote Karamoja area and the vibrant but messy towns of Kampala and Jinja. He is a brilliant professional and also a great companion and human being.' },
      { author: 'Jorike Verlaan', role: 'Producer', quote: "Working with Bill was truly great! He is a very nice, kind, funny and hardworking guy. I'm a documentary producer from Amsterdam and for a documentary series that we were filming we decided last minute to come to Kenya and Uganda." },
      { author: 'Liam Hall', role: 'Producer', quote: 'Bill was a fantastic production partner and really added a lot to the final film. He provided production support, crew and much needed local knowledge. He pretty much saved the shoot when things got complicated!' },
      { author: 'Adrienne Annau', role: 'Producer', quote: 'Bill is an invaluable resource. A true industry professional, Bill understands the needs of crews and has an intimate knowledge of the geography and culture of Uganda. He speaks five languages.' },
      { author: 'arynbaker', role: 'Time Magazine', quote: 'I worked with Bill in Kampala in late September. He was just great - conscientious, reliable, and entrepreneurial when it came to a difficult assignment on a short timeline. I would recommend him to anyone.' },
      { author: 'Yaqiao', role: 'Producer', quote: "A real professional fixer and producer. We've had a great experience with him and the crew couldn't have been better assisted. Great job Bill. Thank you!!" },
      { author: 'Fiz Olajide', role: 'Lonely Leap', quote: 'We are a documentary film company based in Brooklyn, New York. We commissioned Bill to film with a few people from Makerere University. He made our entire shoot run incredibly smoothly.' },
      { author: 'Meerkat Media', role: 'Independent Crew', quote: "We had the pleasure of working with Bill while in Kampala. He was a joy to work with and made our entire shoot run incredibly smoothly. He didn't shy away from filming in challenging conditions." },
      { author: 'Ekaterina', role: 'RT Documentary', quote: 'Mr Bill Koske was contracted to help filming a documentary. Bill was always able to engage with all production needs. His insights and production experience proved invaluable.' },
      { author: 'Alora May', role: 'Rotary International', quote: 'Bill Koske was an amazing fixer who took care of everything and anything during our Rotary International 360º shoot in rural Uganda. He had all the right connections.' },
      { author: 'Paul King', role: 'Made.For.Digital', quote: 'I recommend Mr Bill Koske for his excellent production work on a series of short films I produced in Uganda. The films shot up country and in urban centers were highly successful.' },
      { author: 'Louis Leeson', role: 'Producer', quote: 'Bill was an excellent fixer during a recent shoot. He arranged kit, travel, accommodation, and organised the contributors for the documentary we were working on.' },
      { author: 'Melissa Butcher', role: 'Barcroft Productions', quote: 'Bill was amazing from the get-go. He was a constant source of advice with processes and restrictions. He made everything run smoothly, even when schedules changed.' },
      { author: 'Adam Beasley', role: 'Maverick Advertising', quote: 'Worked with Bill this December in Northern Uganda. Bill is excellent at his job and took very good care to make sure my shoot went as smoothly as possible.' },
      { author: 'Daniel Meiner', role: 'Producer', quote: 'Working with Bill Koske was a pleasure. He is a bright, attentive and very friendly team player. With him at our side we felt comfortable all the time.' },
      { author: 'Christian Schidlowski', role: 'Discovery Channel', quote: 'I am the producer and director of an equator series for Discovery/ARTE/NHK. We shot in Uganda and Bill Koske, based in Kampala, was our local producer. He organized everything perfectly.' },
      { author: 'Nikita Glushchenko', role: 'Music Video Producer', quote: "Worked with Bill to make a music video. I can totally recommend Bill. He knows what film production is and what is vital during the job on the ground." },
      { author: 'Janka Rokob', role: 'GIZ RUWASS', quote: 'The GIZ RUWASS Programme has worked with Bildad Koske and overall it was a positive experience. Within the complex Ugandan context, he performed commendably.' },
      { author: 'Sean Ackermann', role: 'Cinematographer', quote: 'I had the pleasure of working with Bill and his team in Uganda under tough conditions. The production was a success and I highly recommend him.' },
      { author: 'Wayne Habig', role: 'Creative Director', quote: 'Worked with Bildad on a film for Barclays Africa. He was our local Ugandan Producer. He has a great network and made the shoot happen beautifully.' },
      { author: 'Erik Van Berendoncks', role: 'Sputnik Media', quote: 'I can recommend Bill! He and his staff did a great job for us on 3 episodes of Jobs Without Frontiers. He made it happen.' },
      { author: 'Gladys Akurut Alupo', role: 'World Bank', quote: 'Our team from the World Bank Uganda office worked with Bill. He produced 3 video documentaries for us which were highly commendable.' },
      { author: 'Fred Snark', role: 'Snark Productions', quote: 'We worked with Bildad and it was a great experience. Professional organisation and very kind team.' }
    ];

    state.companies = [
      'Discovery Channel', 'ARTE France', 'ARTE Germany', 'NHK Japan', 'World Bank', 'GIZ', 'Barclays Africa',
      'Time Magazine', 'Caviar London', 'TV Globo Brazil', 'Sputnik Media', 'Lonely Leap NYC', 'Barcroft Productions',
      'Maverick Advertising', 'Bombay Elephants', 'Fingerprints Films', 'Idea Studios Canada'
    ];

    renderTestimonials();
    renderCompanies();
  }

  // Render Testimonials Slider
  function renderTestimonials() {
    if (!testimonialTrack) return;
    testimonialTrack.innerHTML = '';
    
    state.testimonials.forEach((test, idx) => {
      const item = document.createElement('div');
      item.className = `testimonial-item ${idx === state.testimonialIndex ? 'active' : ''}`;
      
      const initials = test.author.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

      item.innerHTML = `
        <p class="testimonial-quote">${test.quote}</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">${initials}</div>
          <div class="testimonial-info">
            <h4>${test.author}</h4>
            <p>${test.role}</p>
          </div>
        </div>
      `;
      testimonialTrack.appendChild(item);
    });

    // Render Dots
    if (carouselDots) {
      carouselDots.innerHTML = '';
      state.testimonials.forEach((_, idx) => {
        const dot = document.createElement('div');
        dot.className = `carousel-dot ${idx === state.testimonialIndex ? 'active' : ''}`;
        dot.addEventListener('click', () => {
          showTestimonial(idx);
        });
        carouselDots.appendChild(dot);
      });
    }

    updateTestimonialSlider();
  }

  function showTestimonial(index) {
    state.testimonialIndex = index;
    
    // Update active classes
    const items = testimonialTrack.querySelectorAll('.testimonial-item');
    items.forEach((item, idx) => {
      if (idx === index) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    const dots = carouselDots.querySelectorAll('.carousel-dot');
    dots.forEach((dot, idx) => {
      if (idx === index) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    updateTestimonialSlider();
  }

  function updateTestimonialSlider() {
    const width = testimonialTrack.parentElement.offsetWidth;
    const offset = -state.testimonialIndex * width;
    testimonialTrack.style.transform = `translateX(${offset}px)`;
  }

  // Next/Prev Testimonial buttons
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      let idx = state.testimonialIndex - 1;
      if (idx < 0) idx = state.testimonials.length - 1;
      showTestimonial(idx);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      let idx = (state.testimonialIndex + 1) % state.testimonials.length;
      showTestimonial(idx);
    });
  }

  // Handle window resizing for testimonials slider alignment
  window.addEventListener('resize', () => {
    updateTestimonialSlider();
  });

  // Auto-slide testimonials
  let testimonialInterval = setInterval(() => {
    let idx = (state.testimonialIndex + 1) % state.testimonials.length;
    showTestimonial(idx);
  }, 7000);

  // Pause auto-slide on hover
  const carouselContainer = document.querySelector('.testimonials-carousel');
  if (carouselContainer) {
    carouselContainer.addEventListener('mouseenter', () => clearInterval(testimonialInterval));
    carouselContainer.addEventListener('mouseleave', () => {
      testimonialInterval = setInterval(() => {
        let idx = (state.testimonialIndex + 1) % state.testimonials.length;
        showTestimonial(idx);
      }, 7000);
    });
  }

  // Render client companies scrolling marquee
  function renderCompanies() {
    if (!companyMarquee) return;
    
    const marqueeContent = document.createElement('div');
    marqueeContent.className = 'marquee-content';
    
    // Populate client list
    const companyList = [...state.companies, ...state.companies]; // Duplicate to make infinite marquee seamless
    
    marqueeContent.innerHTML = companyList.map(comp => `
      <span class="client-logo">${comp}</span>
    `).join('');
    
    companyMarquee.appendChild(marqueeContent);
  }

  // Fallback placeholder manifest generator in case photos folder is completely empty
  function createPlaceholderManifest() {
    state.images = [
      {
        filename: 'placeholder.jpg',
        aspectRatio: 1.5,
        avgColor: 'rgb(30, 30, 35)',
        categories: ['Landscapes'],
        alt: 'Beautiful Ugandan scenery and mountains',
        width: 1200,
        height: 800,
        paths: {
          small: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=480&auto=format&fit=crop&q=80',
          medium: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=960&auto=format&fit=crop&q=80',
          large: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1920&auto=format&fit=crop&q=80'
        }
      }
    ];
  }

  // -------------------------------------------------------------
  // Viewfinder Timecode Simulation
  // -------------------------------------------------------------
  function initViewfinderTimecode() {
    const timecodeElem = document.getElementById('vf-timecode');
    if (!timecodeElem) return;

    let frames = 0;
    let seconds = 0;
    let minutes = 0;
    let hours = 0;

    let lastTime = 0;
    const interval = 1000 / 24; // 24 FPS

    function animateTimecode(time) {
      if (!lastTime) lastTime = time;
      const elapsed = time - lastTime;

      if (elapsed >= interval) {
        lastTime = time - (elapsed % interval);
        
        frames++;
        if (frames >= 24) {
          frames = 0;
          seconds++;
          if (seconds >= 60) {
            seconds = 0;
            minutes++;
            if (minutes >= 60) {
              minutes = 0;
              hours++;
              if (hours >= 24) hours = 0;
            }
          }
        }

        const h = String(hours).padStart(2, '0');
        const m = String(minutes).padStart(2, '0');
        const s = String(seconds).padStart(2, '0');
        const f = String(frames).padStart(2, '0');
        timecodeElem.textContent = `${h}:${m}:${s}:${f}`;
      }
      requestAnimationFrame(animateTimecode);
    }
    requestAnimationFrame(animateTimecode);
  }

  // -------------------------------------------------------------
  // Interactive Uganda Location Map
  // -------------------------------------------------------------
  const locationData = {
    'murchison': {
      title: 'Murchison Falls National Park',
      desc: 'Where the Nile River squeezes through an 8-meter canyon to drop 43 meters. Celebrated for high-action wildlife shoots, big game herds, Nile riverboat tracking, and scenic drone capture.',
      category: 'Wildlife & Landscapes',
      keyword: 'elephant'
    },
    'queen-elizabeth': {
      title: 'Queen Elizabeth National Park',
      desc: 'Classic Savannah grasslands, volcanic crater lakes, and the Kazinga Channel channel boat safaris. Famous tree-climbing lions and vast bio-diversity. A critical location for wildlife films.',
      category: 'Wildlife',
      keyword: 'lion'
    },
    'kampala': {
      title: 'Kampala City',
      desc: 'Bustling markets, street activities, heavy traffic, and modern hubs. Ideal for documentary features, casting workshops, lifestyle commercials, and urban production coordination.',
      category: 'Cities & Culture',
      keyword: 'street'
    },
    'jinja': {
      title: 'Jinja (Source of the Nile)',
      desc: 'Adventure central of East Africa. White water rapids, forest backdrops, and historic colonial bridges over the Nile. Excellent for cinematic sports, travel, and action themes.',
      category: 'Landscapes',
      keyword: 'river'
    },
    'kibale': {
      title: 'Kibale National Forest',
      desc: 'A dense primary rainforest with a chimpanzee population of over 1,500. Ideal for forest wildlife expeditions, canopy photography, and specialized macro nature filming.',
      category: 'Wildlife',
      keyword: 'chimp'
    },
    'hoima': {
      title: 'Hoima Region',
      desc: 'Rolling countryside, oil development infrastructure, and local farms. Ideal for energy development documentaries, social narratives, and diverse agricultural backdrops.',
      category: 'Landscapes',
      keyword: 'hoima'
    }
  };

  function initInteractiveMap() {
    const hotspots = document.querySelectorAll('.map-hotspot');
    const card = document.getElementById('map-details-card');
    if (!card) return;
    
    const placeholder = card.querySelector('.map-details-placeholder');
    const content = card.querySelector('.map-details-content');
    const imgElem = document.getElementById('map-details-img');
    const titleElem = document.getElementById('map-details-title');
    const descElem = document.getElementById('map-details-desc');
    const tagElem = document.getElementById('map-details-tag');

    hotspots.forEach(hotspot => {
      hotspot.addEventListener('mouseenter', () => {
        const locKey = hotspot.getAttribute('data-location');
        const data = locationData[locKey];
        if (!data) return;

        // Search for matching image in manifest
        let matchedImage = state.images.find(img => img.filename.toLowerCase().includes(data.keyword));
        if (!matchedImage) {
          // fallback to matching categories
          matchedImage = state.images.find(img => img.categories.includes('Wildlife') || img.categories.includes('Landscapes'));
        }
        
        const imgUrl = matchedImage ? (matchedImage.paths.medium || matchedImage.paths.small) : '';
        
        titleElem.textContent = data.title;
        descElem.textContent = data.desc;
        tagElem.textContent = data.category;
        
        if (imgUrl) {
          imgElem.src = imgUrl;
          imgElem.parentNode.style.display = 'block';
        } else {
          imgElem.parentNode.style.display = 'none';
        }

        placeholder.style.display = 'none';
        content.style.display = 'flex';
      });
    });
  }

  // -------------------------------------------------------------
  // 3D Parallax Tilt Effect with Glare
  // -------------------------------------------------------------
  function init3DTiltCards() {
    // Disable tilt behavior on touchscreens to prevent drag/scroll lag
    if (!window.matchMedia('(hover: hover)').matches) return;

    const cards = document.querySelectorAll('.service-card');
    cards.forEach(card => {
      const glare = document.createElement('div');
      glare.className = 'card-glare';
      card.appendChild(glare);

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Scale tilt factor to keep subtle rotation bounds
        const rotX = ((rect.height / 2 - y) / (rect.height / 2)) * 6;
        const rotY = ((x - rect.width / 2) / (rect.width / 2)) * 6;

        card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`;
        glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.12) 0%, transparent 80%)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      });
    });
  }

  // -------------------------------------------------------------
  // Scroll Reveal System
  // -------------------------------------------------------------
  function initScrollReveals() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-active');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.02,
      rootMargin: '0px 0px -20px 0px'
    });

    reveals.forEach(el => observer.observe(el));
  }

  // -------------------------------------------------------------
  // Scroll to Top Handler
  // -------------------------------------------------------------
  function initScrollToTop() {
    const scrollTopBtn = document.getElementById('scroll-to-top');
    if (!scrollTopBtn) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        scrollTopBtn.classList.add('active');
      } else {
        scrollTopBtn.classList.remove('active');
      }
    });

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
});
