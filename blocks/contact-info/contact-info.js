const REGIONS = ['Americas', 'Asia', 'Europe'];

/* ─── Content data ──────────────────────────────────────────────────────────
 * Each region is an array of 3 column definitions.
 * Each column is an array of section objects:
 *   type 'hq'     → NVIDIA Corporate block with address, map links, tel, email, extras
 *   type 'region' → large section heading + groups of {name, cities[]}
 *   type 'states' → no heading, groups of {name, cities[]} (plain list)
 * ─────────────────────────────────────────────────────────────────────────── */
const CONTENT = {
  Americas: [
    // ── Column 1 ──────────────────────────────────────────────────────────
    [
      {
        type: 'hq',
        heading: 'NVIDIA Corporate',
        address: '2788 San Tomas Expressway\nSanta Clara, CA 95051',
        mapLinks: [
          { text: 'View Directions Map', href: 'https://www.google.com/maps/place/NVIDIA+Corporation/@37.3705396,-121.968938,17z/data=!3m1!4b1!4m5!3m4!1s0x808fca2702c480db:0x76527847b95e08c9!8m2!3d37.3705354!4d-121.9667493' },
          { text: 'View Campus Map', href: 'https://www.nvidia.com/content/dam/en-zz/Solutions/support/VisitoMap.pdf' },
        ],
        tel: '+1 (408) 486-2000',
        email: 'info@nvidia.com',
        extras: [
          { label: 'Investor Inquiries:', text: '(877) 7-NVIDIA' },
          {
            label: 'Product Support:',
            html: 'Visit our <a href="https://www.nvidia.com/en-us/support/">Support</a> page or chat with a <a href="https://www.nvidia.com/en-us/support/consumer/">Customer Care</a> agent.',
          },
        ],
      },
      {
        type: 'region',
        heading: 'South America',
        groups: [
          { name: 'Brazil', cities: ['São Paulo, SP'] },
        ],
      },
    ],

    // ── Column 2 ──────────────────────────────────────────────────────────
    [
      {
        type: 'region',
        heading: 'North America',
        groups: [
          { name: 'Canada', cities: ['Toronto, Ontario'] },
          { name: 'U.S.', cities: [] },
          { name: 'Alabama', cities: ['Madison'] },
          { name: 'California', cities: ['Santa Clara', 'San Dimas', 'Sunnyvale'] },
          { name: 'Colorado', cities: ['Boulder'] },
          { name: 'Illinois', cities: ['Champaign'] },
          { name: 'Massachusetts', cities: ['Westford'] },
        ],
      },
    ],

    // ── Column 3 (U.S. states continued, no section heading) ──────────────
    [
      {
        type: 'states',
        groups: [
          { name: 'Missouri', cities: ['St. Louis'] },
          { name: 'New Jersey', cities: ['Holmdel'] },
          { name: 'New York', cities: ['New York'] },
          { name: 'North Carolina', cities: ['Durham'] },
          { name: 'Oregon', cities: ['Hillsboro'] },
          { name: 'Texas', cities: ['Austin'] },
          { name: 'Utah', cities: ['Salt Lake City'] },
          { name: 'Virginia', cities: ['Charlottesville', 'Herndon'] },
          { name: 'Washington', cities: ['Redmond', 'Seattle'] },
        ],
      },
    ],
  ],

  Asia: [
    // ── Column 1 ──────────────────────────────────────────────────────────
    [
      {
        type: 'states',
        groups: [
          { name: 'Hong Kong', cities: ['Shatin'] },
          { name: 'India', cities: ['Bengaluru', 'Gurugram', 'Hyderabad', 'Mumbai', 'New Delhi', 'Pune'] },
        ],
      },
    ],

    // ── Column 2 ──────────────────────────────────────────────────────────
    [
      {
        type: 'states',
        groups: [
          { name: 'Japan', cities: ['Tokyo'] },
          { name: 'Korea', cities: ['Seoul'] },
          { name: 'Mainland China', cities: ['Beijing', 'Guangzhou', 'Shanghai', 'Shenzhen'] },
        ],
      },
    ],

    // ── Column 3 ──────────────────────────────────────────────────────────
    [
      {
        type: 'states',
        groups: [
          { name: 'Singapore', cities: ['Singapore'] },
          { name: 'Taiwan', cities: ['Hsinchu City', 'Taipei City'] },
          { name: 'Vietnam', cities: ['Hanoi City', 'Ho Chi Minh City'] },
        ],
      },
    ],
  ],

  Europe: [
    // ── Column 1 ──────────────────────────────────────────────────────────
    [
      {
        type: 'states',
        groups: [
          { name: 'Armenia', cities: ['Yerevan'] },
          { name: 'Belgium', cities: ['Ghent'] },
          { name: 'Denmark', cities: ['Roskilde'] },
          { name: 'Finland', cities: ['Helsinki'] },
          { name: 'France', cities: ['Courbevoie'] },
          { name: 'Germany', cities: ['Berlin', 'Munich', 'Würselen'] },
          { name: 'Greece', cities: ['Athens'] },
        ],
      },
    ],

    // ── Column 2 ──────────────────────────────────────────────────────────
    [
      {
        type: 'states',
        groups: [
          { name: 'Hungary', cities: ['Budapest'] },
          { name: 'Israel', cities: ['Beer Sheva', 'Raanana', 'Tel Aviv', 'Tel Hai', 'Yokneam'] },
          { name: 'Netherlands', cities: ['Amsterdam'] },
          { name: 'Palestinian Authority', cities: ['Hebron', 'Nablus', 'Rawabi'] },
          { name: 'Poland', cities: ['Warsaw'] },
          { name: 'Romania', cities: ['Iasi'] },
        ],
      },
    ],

    // ── Column 3 ──────────────────────────────────────────────────────────
    [
      {
        type: 'states',
        groups: [
          { name: 'Sweden', cities: ['Gothenburg', 'Lund'] },
          { name: 'Switzerland', cities: ['Zurich'] },
          { name: 'United Kingdom', cities: ['Belfast', 'Bristol', 'Cambridge', 'London', 'Reading'] },
          { name: 'United Arab Emirates', cities: ['Dubai'] },
          { name: 'Ukraine', cities: ['Kyiv'] },
        ],
      },
    ],
  ],
};

/* ─── DOM builders ─────────────────────────────────────────────────────────── */

const EXT_ICON = `<svg class="ext-link-icon" xmlns="http://www.w3.org/2000/svg"
  width="12" height="12" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
  <path d="M5 1H1v12h12V9m0-8H7m6 0L7 7"
    fill="none" stroke="currentColor" stroke-width="1.5"
    stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function buildHQSection(data) {
  const section = document.createElement('div');
  section.classList.add('contact-section');

  const h3 = document.createElement('h3');
  h3.classList.add('contact-section-heading');
  h3.textContent = data.heading;
  section.appendChild(h3);

  const addr = document.createElement('p');
  addr.classList.add('contact-address');
  addr.innerHTML = data.address.replace(/\n/g, '<br>');
  section.appendChild(addr);

  data.mapLinks.forEach((link) => {
    const a = document.createElement('a');
    a.href = link.href;
    a.classList.add('contact-map-link');
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = link.text;
    section.appendChild(a);
  });

  const details = document.createElement('div');
  details.classList.add('contact-hq-details');

  if (data.tel) {
    const p = document.createElement('p');
    p.classList.add('contact-tel');
    p.textContent = `Tel: ${data.tel}`;
    details.appendChild(p);
  }

  if (data.email) {
    const a = document.createElement('a');
    a.href = `mailto:${data.email}`;
    a.classList.add('contact-email-link');
    a.textContent = data.email;
    details.appendChild(a);
  }

  (data.extras || []).forEach((extra) => {
    const p = document.createElement('p');
    p.classList.add('contact-extra');

    const strong = document.createElement('strong');
    strong.textContent = extra.label;
    p.appendChild(strong);

    if (extra.html) {
      const span = document.createElement('span');
      span.innerHTML = extra.html;
      p.appendChild(span);
    } else if (extra.text) {
      p.appendChild(document.createTextNode(extra.text));
    }

    details.appendChild(p);
  });

  section.appendChild(details);
  return section;
}

function buildGroupsSection(data) {
  const section = document.createElement('div');
  section.classList.add('contact-section');

  if (data.heading) {
    const h3 = document.createElement('h3');
    h3.classList.add('contact-section-heading');
    h3.textContent = data.heading;
    section.appendChild(h3);
  }

  (data.groups || []).forEach((group) => {
    const groupDiv = document.createElement('div');
    groupDiv.classList.add('contact-group');

    const nameP = document.createElement('p');
    nameP.classList.add('contact-group-name');
    nameP.textContent = group.name;
    groupDiv.appendChild(nameP);

    (group.cities || []).forEach((city) => {
      const a = document.createElement('a');
      a.href = `https://maps.google.com/?q=NVIDIA+${encodeURIComponent(city)}`;
      a.classList.add('contact-city-link');
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = city;
      groupDiv.appendChild(a);
    });

    section.appendChild(groupDiv);
  });

  return section;
}

function buildSection(sectionData) {
  if (sectionData.type === 'hq') return buildHQSection(sectionData);
  return buildGroupsSection(sectionData);
}

function buildPanel(region, isActive) {
  const panel = document.createElement('div');
  panel.classList.add('contact-info-panel');
  panel.id = `panel-${region.toLowerCase()}`;
  panel.setAttribute('role', 'tabpanel');
  panel.hidden = !isActive;

  const columnsEl = document.createElement('div');
  columnsEl.classList.add('contact-panel-columns');

  CONTENT[region].forEach((colSections) => {
    const col = document.createElement('div');
    col.classList.add('contact-panel-column');
    colSections.forEach((s) => col.appendChild(buildSection(s)));
    columnsEl.appendChild(col);
  });

  panel.appendChild(columnsEl);
  return panel;
}

/* ─── Main decorate function ───────────────────────────────────────────────── */

export default function decorate(block) {
  let activeRegion = 'Americas';

  // ── Tab navigation ────────────────────────────────────────────────────
  const tabNav = document.createElement('nav');
  tabNav.classList.add('contact-info-tabs');
  tabNav.setAttribute('aria-label', 'Regional offices');

  const tabList = document.createElement('ul');
  tabList.setAttribute('role', 'tablist');

  REGIONS.forEach((region) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', region === activeRegion ? 'true' : 'false');
    btn.setAttribute('aria-controls', `panel-${region.toLowerCase()}`);
    btn.textContent = region;
    if (region === activeRegion) btn.classList.add('active');

    btn.addEventListener('click', () => {
      activeRegion = region;
      tabList.querySelectorAll('[role="tab"]').forEach((b) => {
        const on = b.textContent === region;
        b.setAttribute('aria-selected', String(on));
        b.classList.toggle('active', on);
      });
      panelsContainer.querySelectorAll('.contact-info-panel').forEach((p) => {
        p.hidden = p.id !== `panel-${region.toLowerCase()}`;
      });
    });

    li.appendChild(btn);
    tabList.appendChild(li);
  });

  tabNav.appendChild(tabList);

  // ── Panels ────────────────────────────────────────────────────────────
  const panelsContainer = document.createElement('div');
  panelsContainer.classList.add('contact-info-panels');

  REGIONS.forEach((region) => {
    panelsContainer.appendChild(buildPanel(region, region === activeRegion));
  });

  // ── Speak Up Line footer note ─────────────────────────────────────────
  const note = document.createElement('p');
  note.classList.add('contact-speak-up');
  note.innerHTML = `To confidentially report a concern, visit our <a href="http://nvidiaat.ethicspoint.com/" class="contact-speak-up-link" target="_blank" rel="noopener">Speak Up Line ${EXT_ICON}</a>.`;

  block.textContent = '';
  block.appendChild(tabNav);
  block.appendChild(panelsContainer);
  block.appendChild(note);
}
