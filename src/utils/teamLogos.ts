// High-Resolution Crisp Vector Flags & Emblems for Match Fixtures and Sports

export function getTeamLogo(teamName: string): string {
  const t = teamName.toLowerCase().trim();

  // Namibia
  if (t.includes('namibia')) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#003580" stroke="#ffffff" stroke-width="2" />
        <clipPath id="c"><circle cx="50" cy="50" r="48"/></clipPath>
        <g clip-path="url(#c)">
          <path d="M0,0 L100,100 L100,0 Z" fill="#003580" />
          <path d="M0,0 L0,100 L100,100 Z" fill="#009543" />
          <polygon points="0,95 100,0 100,15 0,110" fill="#ffffff" />
          <polygon points="0,100 100,5 100,12 0,107" fill="#d21034" />
          <circle cx="25" cy="25" r="12" fill="#ffd100" />
          <!-- Sun rays -->
          <path d="M25,6 L27,15 L23,15 Z M25,44 L27,35 L23,35 Z M6,25 L15,27 L15,23 Z M44,25 L35,27 L35,23 Z" fill="#ffd100"/>
        </g>
      </svg>
    `);
  }

  // South Africa
  if (t.includes('south africa') || t.includes('rsa')) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#007749" stroke="#ffffff" stroke-width="2"/>
        <clipPath id="c"><circle cx="50" cy="50" r="48"/></clipPath>
        <g clip-path="url(#c)">
          <rect x="0" y="0" width="100" height="45" fill="#e03c31" />
          <rect x="0" y="55" width="100" height="45" fill="#001489" />
          <polygon points="0,0 50,50 0,100" fill="#000000" />
          <polygon points="0,8 42,50 0,92" fill="#ffb81c" />
          <polygon points="0,18 32,50 0,82" fill="#000000" />
          <polygon points="0,0 55,50 100,50 100,38 60,38 25,0" fill="#ffffff" />
          <polygon points="0,100 55,50 100,50 100,62 60,62 25,100" fill="#ffffff" />
          <polygon points="0,4 52,50 100,50 100,42 58,42 20,4" fill="#007749" />
          <polygon points="0,96 52,50 100,50 100,58 58,58 20,96" fill="#007749" />
        </g>
      </svg>
    `);
  }

  // Guyana Amazon Warriors
  if (t.includes('guyana') || t.includes('amazon warriors')) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#064e3b" stroke="#facc15" stroke-width="3"/>
        <!-- Amazon warrior arrow shape -->
        <polygon points="50,12 82,75 50,60 18,75" fill="#facc15" stroke="#dc2626" stroke-width="2"/>
        <polygon points="50,22 75,70 50,58 25,70" fill="#16a34a"/>
        <circle cx="50" cy="42" r="10" fill="#dc2626" stroke="#facc15" stroke-width="1.5"/>
        <text x="50" y="90" fill="#fde047" font-family="Arial, sans-serif" font-weight="900" font-size="11" text-anchor="middle" letter-spacing="1">GAW</text>
      </svg>
    `);
  }

  // Antigua & Barbuda Falcons
  if (t.includes('antigua') || t.includes('falcons') || t.includes('barbuda')) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#0f172a" stroke="#ef4444" stroke-width="3"/>
        <!-- Falcon wing emblem -->
        <path d="M20,65 Q35,25 75,20 Q65,45 80,60 Q55,55 35,70 Z" fill="#ef4444" stroke="#f87171" stroke-width="1.5"/>
        <path d="M28,60 Q40,32 70,30 Q58,50 70,62 Q50,55 35,66 Z" fill="#38bdf8"/>
        <circle cx="68" cy="28" r="3" fill="#ffffff"/>
        <text x="50" y="88" fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="10" text-anchor="middle" letter-spacing="1">FALCONS</text>
      </svg>
    `);
  }

  // ETPL
  if (t.includes('etpl')) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#1e1b4b" stroke="#3b82f6" stroke-width="2.5"/>
        <polygon points="50,15 80,30 80,70 50,88 20,70 20,30" fill="#2563eb" opacity="0.4"/>
        <text x="50" y="55" fill="#60a5fa" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="24" text-anchor="middle" letter-spacing="1">ETPL</text>
        <text x="50" y="70" fill="#93c5fd" font-family="Arial, sans-serif" font-weight="700" font-size="8" text-anchor="middle">PREMIER LEAGUE</text>
      </svg>
    `);
  }

  // Bangladesh / Bangladesh Women
  if (t.includes('bangladesh') || t.includes('bd') || t.includes('tigers')) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#006a4e" stroke="#ffffff" stroke-width="2.5"/>
        <circle cx="45" cy="50" r="24" fill="#f42a41" />
      </svg>
    `);
  }

  // United Arab Emirates / UAE
  if (t.includes('united arab emirates') || t.includes('uae') || t.includes('emirates')) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
        <clipPath id="c"><circle cx="50" cy="50" r="48"/></clipPath>
        <g clip-path="url(#c)">
          <rect x="0" y="0" width="100" height="33.3" fill="#00732f" />
          <rect x="0" y="33.3" width="100" height="33.3" fill="#ffffff" />
          <rect x="0" y="66.6" width="100" height="33.4" fill="#000000" />
          <rect x="0" y="0" width="28" height="100" fill="#ff0000" />
        </g>
      </svg>
    `);
  }

  // India
  if (t.includes('india') || t.includes('ind') || t.includes('bharat')) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
        <clipPath id="c"><circle cx="50" cy="50" r="48"/></clipPath>
        <g clip-path="url(#c)">
          <rect x="0" y="0" width="100" height="33.3" fill="#ff9933" />
          <rect x="0" y="33.3" width="100" height="33.3" fill="#ffffff" />
          <rect x="0" y="66.6" width="100" height="33.4" fill="#138808" />
          <circle cx="50" cy="50" r="12" fill="none" stroke="#000080" stroke-width="1.8" />
          <circle cx="50" cy="50" r="2.5" fill="#000080" />
        </g>
      </svg>
    `);
  }

  // Australia
  if (t.includes('australia') || t.includes('aus')) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#00008b" stroke="#ffffff" stroke-width="2"/>
        <clipPath id="c"><circle cx="50" cy="50" r="48"/></clipPath>
        <g clip-path="url(#c)">
          <!-- Union Jack top left mini -->
          <rect x="0" y="0" width="45" height="35" fill="#012169" />
          <path d="M0,0 L45,35 M45,0 L0,35" stroke="#ffffff" stroke-width="5" />
          <path d="M0,0 L45,35 M45,0 L0,35" stroke="#c8102e" stroke-width="2.5" />
          <path d="M22.5,0 L22.5,35 M0,17.5 L45,17.5" stroke="#ffffff" stroke-width="7" />
          <path d="M22.5,0 L22.5,35 M0,17.5 L45,17.5" stroke="#c8102e" stroke-width="4" />
          <!-- Commonwealth large star -->
          <circle cx="22.5" cy="65" r="10" fill="#ffffff" />
          <!-- Southern Cross stars -->
          <circle cx="75" cy="25" r="3" fill="#ffffff" />
          <circle cx="85" cy="45" r="3" fill="#ffffff" />
          <circle cx="75" cy="75" r="3.5" fill="#ffffff" />
          <circle cx="65" cy="50" r="3" fill="#ffffff" />
          <circle cx="78" cy="58" r="2" fill="#ffffff" />
        </g>
      </svg>
    `);
  }

  // Real Madrid
  if (t.includes('real madrid') || t.includes('madrid')) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#f59e0b" stroke-width="3"/>
        <clipPath id="c"><circle cx="50" cy="50" r="48"/></clipPath>
        <g clip-path="url(#c)">
          <!-- Diagonal purple stripe -->
          <line x1="0" y1="100" x2="100" y2="0" stroke="#7e22ce" stroke-width="24"/>
          <!-- Gold border ring -->
          <circle cx="50" cy="50" r="36" fill="none" stroke="#f59e0b" stroke-width="4"/>
          <text x="50" y="58" fill="#1e3a8a" font-family="Arial, sans-serif" font-weight="900" font-size="22" text-anchor="middle">RMCF</text>
        </g>
      </svg>
    `);
  }

  // Barcelona
  if (t.includes('barcelona') || t.includes('barca')) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#004d98" stroke="#edbb00" stroke-width="3"/>
        <clipPath id="c"><circle cx="50" cy="50" r="48"/></clipPath>
        <g clip-path="url(#c)">
          <!-- Blaugrana vertical stripes -->
          <rect x="0" y="0" width="25" height="100" fill="#a50044"/>
          <rect x="25" y="0" width="25" height="100" fill="#004d98"/>
          <rect x="50" y="0" width="25" height="100" fill="#a50044"/>
          <rect x="75" y="0" width="25" height="100" fill="#004d98"/>
          <circle cx="50" cy="50" r="22" fill="#edbb00" />
          <text x="50" y="56" fill="#a50044" font-family="Impact, Arial Black" font-weight="900" font-size="16" text-anchor="middle">FCB</text>
        </g>
      </svg>
    `);
  }

  // Sri Lanka
  if (t.includes('sri lanka')) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#ffbe29" stroke="#ffffff" stroke-width="2"/>
        <clipPath id="c"><circle cx="50" cy="50" r="48"/></clipPath>
        <g clip-path="url(#c)">
          <rect x="25" y="0" width="75" height="100" fill="#8d153a" />
          <rect x="0" y="0" width="14" height="100" fill="#00534e" />
          <rect x="14" y="0" width="14" height="100" fill="#eb7400" />
          <!-- Golden sword lion emblem -->
          <circle cx="62" cy="50" r="18" fill="#ffbe29"/>
          <text x="62" y="56" fill="#8d153a" font-family="Arial" font-weight="900" font-size="14" text-anchor="middle">SL</text>
        </g>
      </svg>
    `);
  }

  // Arsenal
  if (t.includes('arsenal')) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#ef0107" stroke="#ffffff" stroke-width="2"/>
        <circle cx="50" cy="50" r="38" fill="#023474"/>
        <rect x="30" y="46" width="40" height="8" rx="2" fill="#ffd700"/>
        <circle cx="38" cy="56" r="6" fill="#ffd700"/>
        <circle cx="62" cy="56" r="6" fill="#ffd700"/>
        <text x="50" y="36" fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="11" text-anchor="middle">ARSENAL</text>
      </svg>
    `);
  }

  // Manchester City
  if (t.includes('manchester city') || t.includes('man city')) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#6cabdd" stroke="#1c2c5b" stroke-width="3"/>
        <circle cx="50" cy="50" r="38" fill="#ffffff"/>
        <polygon points="50,22 68,48 32,48" fill="#facc15" stroke="#1c2c5b" stroke-width="1.5"/>
        <text x="50" y="74" fill="#1c2c5b" font-family="Arial, sans-serif" font-weight="900" font-size="12" text-anchor="middle">MAN CITY</text>
      </svg>
    `);
  }

  // Generic fallback with clean initial letters and sport gradient
  const initials = teamName.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase() || 'SP';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#bg)" stroke="#38bdf8" stroke-width="2.5"/>
      <text x="50" y="58" fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="22" text-anchor="middle" letter-spacing="1">${initials}</text>
    </svg>
  `);
}
