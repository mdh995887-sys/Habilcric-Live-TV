// Authentic Broadcast Channel Logo Provider (Ultra HD Vector SVGs)
import { Channel } from '../types';

export function getCleanChannelLogo(channel: Channel): string {
  const name = (channel.name || '').toLowerCase();
  const id = (channel.id || '').toLowerCase();
  const cat = (channel.category || '').toLowerCase();

  // Helper to wrap SVG in data URL
  const wrapSvg = (svgContent: string) => 
    'data:image/svg+xml;utf8,' + encodeURIComponent(svgContent.trim().replace(/\s+/g, ' '));

  // 1. ANANDA TV (আনন্দ টিভি)
  if (name.includes('ananda') || id.includes('ananda')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <defs>
          <linearGradient id="ananda-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#047857"/>
            <stop offset="60%" stop-color="#065f46"/>
            <stop offset="100%" stop-color="#064e3b"/>
          </linearGradient>
        </defs>
        <rect width="200" height="120" rx="16" fill="url(#ananda-bg)"/>
        <!-- Ananda TV Sun & Leaf Crest -->
        <circle cx="100" cy="40" r="24" fill="#facc15" stroke="#f59e0b" stroke-width="2"/>
        <path d="M 88 44 C 88 28 112 28 112 44 C 112 56 88 56 88 44 Z" fill="#047857"/>
        <text x="100" y="84" fill="#ffffff" font-family="'Impact', Arial Black, sans-serif" font-weight="900" font-size="22" text-anchor="middle" letter-spacing="1">ANANDA TV</text>
        <rect x="55" y="92" width="90" height="18" rx="4" fill="#facc15"/>
        <text x="100" y="105" fill="#064e3b" font-family="Arial, sans-serif" font-weight="900" font-size="10" text-anchor="middle" letter-spacing="1">আনন্দ টিভি HD</text>
      </svg>
    `);
  }

  // 2. ASIAN TV (এশিয়ান টিভি)
  if (name.includes('asian') || id.includes('asian')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <defs>
          <linearGradient id="asian-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#991b1b"/>
            <stop offset="60%" stop-color="#7f1d1d"/>
            <stop offset="100%" stop-color="#450a0a"/>
          </linearGradient>
        </defs>
        <rect width="200" height="120" rx="16" fill="url(#asian-bg)"/>
        <!-- Asian TV Stylized A Logo -->
        <polygon points="100,16 122,54 78,54" fill="#facc15"/>
        <polygon points="100,28 112,48 88,48" fill="#991b1b"/>
        <circle cx="100" cy="48" r="4" fill="#ffffff"/>
        <text x="100" y="82" fill="#ffffff" font-family="'Impact', Arial Black, sans-serif" font-weight="900" font-size="24" text-anchor="middle" letter-spacing="2">ASIAN TV</text>
        <rect x="60" y="90" width="80" height="18" rx="4" fill="#ffffff"/>
        <text x="100" y="103" fill="#991b1b" font-family="Arial, sans-serif" font-weight="900" font-size="10" text-anchor="middle" letter-spacing="1">এশিয়ান টিভি HD</text>
      </svg>
    `);
  }

  // 3. A SPORTS HD (asports / a-sports)
  if (name.includes('a sports') || name.includes('asports') || id.includes('asports')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100" width="160" height="100">
        <!-- A Sports 3D Red Badge -->
        <rect x="52" y="10" width="56" height="52" rx="8" fill="#e11d48"/>
        <text x="80" y="48" fill="#ffffff" font-family="'Impact', 'Arial Black', sans-serif" font-weight="900" font-size="40" text-anchor="middle">A</text>
        <rect x="94" y="12" width="18" height="12" rx="2" fill="#0284c7"/>
        <text x="103" y="21" fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="8" text-anchor="middle">HD</text>
        <rect x="42" y="66" width="76" height="18" rx="4" fill="#0284c7"/>
        <text x="80" y="79" fill="#ffffff" font-family="'Arial Black', sans-serif" font-weight="900" font-size="11" text-anchor="middle" letter-spacing="1">SPORTS</text>
      </svg>
    `);
  }

  // 4. ATN BANGLA (এটিএন বাংলা)
  if ((name.includes('atn') && name.includes('bangla')) || id.includes('atn-bangla')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <defs>
          <linearGradient id="atn-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0284c7"/>
            <stop offset="60%" stop-color="#0369a1"/>
            <stop offset="100%" stop-color="#075985"/>
          </linearGradient>
        </defs>
        <rect width="200" height="120" rx="16" fill="url(#atn-bg)"/>
        <!-- ATN Bold Oval Crest -->
        <ellipse cx="100" cy="38" rx="45" ry="22" fill="#ffffff"/>
        <text x="100" y="47" fill="#dc2626" font-family="'Impact', Arial Black, sans-serif" font-weight="900" font-size="26" text-anchor="middle" letter-spacing="3">ATN</text>
        <text x="100" y="82" fill="#ffffff" font-family="'Arial Black', sans-serif" font-weight="900" font-size="20" text-anchor="middle" letter-spacing="1">BANGLA</text>
        <rect x="50" y="90" width="100" height="18" rx="4" fill="#dc2626"/>
        <text x="100" y="103" fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="10" text-anchor="middle" letter-spacing="1">এটিএন বাংলা HD</text>
      </svg>
    `);
  }

  // 5. ATN NEWS (এটিএন নিউজ)
  if ((name.includes('atn') && name.includes('news')) || id.includes('atn-news')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <defs>
          <linearGradient id="atnn-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#991b1b"/>
            <stop offset="60%" stop-color="#7f1d1d"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
        </defs>
        <rect width="200" height="120" rx="16" fill="url(#atnn-bg)"/>
        <ellipse cx="100" cy="36" rx="45" ry="20" fill="#ffffff"/>
        <text x="100" y="44" fill="#dc2626" font-family="'Impact', Arial Black, sans-serif" font-weight="900" font-size="24" text-anchor="middle" letter-spacing="3">ATN</text>
        <rect x="35" y="64" width="130" height="24" rx="4" fill="#dc2626"/>
        <text x="100" y="81" fill="#ffffff" font-family="'Impact', Arial Black, sans-serif" font-weight="900" font-size="18" text-anchor="middle" letter-spacing="2">NEWS 24/7</text>
        <text x="100" y="105" fill="#facc15" font-family="Arial, sans-serif" font-weight="900" font-size="11" text-anchor="middle">এটিএন নিউজ LIVE</text>
      </svg>
    `);
  }

  // 6. BIJOY TV (বিজয় টিভি)
  if (name.includes('bijoy') || id.includes('bijoy')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <defs>
          <linearGradient id="bijoy-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#065f46"/>
            <stop offset="60%" stop-color="#047857"/>
            <stop offset="100%" stop-color="#064e3b"/>
          </linearGradient>
        </defs>
        <rect width="200" height="120" rx="16" fill="url(#bijoy-bg)"/>
        <!-- Red Sun Symbol for Victory -->
        <circle cx="100" cy="40" r="24" fill="#dc2626" stroke="#facc15" stroke-width="2"/>
        <polygon points="100,22 106,34 118,34 108,42 112,54 100,46 88,54 92,42 82,34 94,34" fill="#facc15"/>
        <text x="100" y="84" fill="#ffffff" font-family="'Impact', Arial Black, sans-serif" font-weight="900" font-size="22" text-anchor="middle" letter-spacing="2">BIJOY TV</text>
        <rect x="55" y="92" width="90" height="18" rx="4" fill="#dc2626"/>
        <text x="100" y="105" fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="10" text-anchor="middle" letter-spacing="1">বিজয় টিভি HD</text>
      </svg>
    `);
  }

  // 7. BOISHAKHI TV (বৈশাখী টিভি)
  if (name.includes('boishakhi') || id.includes('boishakhi')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <defs>
          <linearGradient id="boishakhi-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#c2410c"/>
            <stop offset="60%" stop-color="#ea580c"/>
            <stop offset="100%" stop-color="#7c2d12"/>
          </linearGradient>
        </defs>
        <rect width="200" height="120" rx="16" fill="url(#boishakhi-bg)"/>
        <!-- Ektara / Cultural Motif -->
        <circle cx="100" cy="38" r="22" fill="#facc15"/>
        <circle cx="100" cy="38" r="10" fill="#c2410c"/>
        <text x="100" y="82" fill="#ffffff" font-family="'Arial Black', sans-serif" font-weight="900" font-size="18" text-anchor="middle" letter-spacing="1">BOISHAKHI</text>
        <rect x="50" y="90" width="100" height="18" rx="4" fill="#ffffff"/>
        <text x="100" y="103" fill="#c2410c" font-family="Arial, sans-serif" font-weight="900" font-size="10" text-anchor="middle" letter-spacing="1">বৈশাখী টেলিভিশন</text>
      </svg>
    `);
  }

  // 8. BTV WORLD (বিটিভি ওয়ার্ল্ড)
  if (name.includes('btv world') || id.includes('btv-world')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <defs>
          <linearGradient id="btvw-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#064e3b"/>
            <stop offset="60%" stop-color="#047857"/>
            <stop offset="100%" stop-color="#022c22"/>
          </linearGradient>
        </defs>
        <rect width="200" height="120" rx="16" fill="url(#btvw-bg)"/>
        <circle cx="100" cy="38" r="22" fill="#047857" stroke="#facc15" stroke-width="2"/>
        <circle cx="100" cy="38" r="12" fill="#dc2626"/>
        <text x="100" y="80" fill="#ffffff" font-family="'Impact', Arial Black, sans-serif" font-weight="900" font-size="22" text-anchor="middle" letter-spacing="1">BTV WORLD</text>
        <rect x="50" y="88" width="100" height="18" rx="4" fill="#facc15"/>
        <text x="100" y="101" fill="#064e3b" font-family="Arial, sans-serif" font-weight="900" font-size="10" text-anchor="middle" letter-spacing="1">বিটিভি ওয়ার্ল্ড HD</text>
      </svg>
    `);
  }

  // 9. BTV NATIONAL (বিটিভি)
  if (name === 'btv' || name.includes('btv national') || (name.includes('btv') && !name.includes('world') && !name.includes('sports')) || id === 'ch-btv' || id.includes('btv-national')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <defs>
          <linearGradient id="btv-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#065f46"/>
            <stop offset="60%" stop-color="#047857"/>
            <stop offset="100%" stop-color="#022c22"/>
          </linearGradient>
        </defs>
        <rect width="200" height="120" rx="16" fill="url(#btv-bg)"/>
        <!-- National Emblem Motif -->
        <circle cx="100" cy="38" r="22" fill="#047857" stroke="#facc15" stroke-width="2"/>
        <circle cx="100" cy="38" r="12" fill="#dc2626"/>
        <text x="100" y="80" fill="#ffffff" font-family="'Impact', Arial Black, sans-serif" font-weight="900" font-size="24" text-anchor="middle" letter-spacing="2">BTV</text>
        <rect x="50" y="88" width="100" height="18" rx="4" fill="#facc15"/>
        <text x="100" y="101" fill="#064e3b" font-family="Arial, sans-serif" font-weight="900" font-size="10" text-anchor="middle" letter-spacing="1">বাংলাদেশ টেলিভিশন</text>
      </svg>
    `);
  }

  // 10. CHANNEL 9 (চ্যানেল ৯)
  if (name.includes('channel 9') || name.includes('channel9') || id.includes('channel-9') || id.includes('channel9')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <defs>
          <linearGradient id="ch9-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e1b4b"/>
            <stop offset="60%" stop-color="#312e81"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
        </defs>
        <rect width="200" height="120" rx="16" fill="url(#ch9-bg)" stroke="#6366f1" stroke-width="2"/>
        <!-- Big 9 Badge -->
        <circle cx="60" cy="56" r="28" fill="#4f46e5"/>
        <text x="60" y="68" fill="#ffffff" font-family="'Impact', Arial Black, sans-serif" font-weight="900" font-size="36" text-anchor="middle">9</text>
        <text x="136" y="52" fill="#ffffff" font-family="'Arial Black', sans-serif" font-weight="900" font-size="16" text-anchor="middle">CHANNEL</text>
        <rect x="96" y="64" width="80" height="20" rx="4" fill="#facc15"/>
        <text x="136" y="78" fill="#1e1b4b" font-family="Arial, sans-serif" font-weight="900" font-size="11" text-anchor="middle">চ্যানেল ৯ HD</text>
      </svg>
    `);
  }

  // 11. CHANNEL I (চ্যানেল আই)
  if (name.includes('channel i') || name.includes('channel-i') || name.includes('channeli') || id.includes('channel-i') || id.includes('channeli')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <defs>
          <linearGradient id="chi-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#831843"/>
            <stop offset="60%" stop-color="#9d174d"/>
            <stop offset="100%" stop-color="#500724"/>
          </linearGradient>
        </defs>
        <rect width="200" height="120" rx="16" fill="url(#chi-bg)"/>
        <!-- Red/Yellow lower case 'i' emblem -->
        <circle cx="60" cy="38" r="8" fill="#facc15"/>
        <rect x="54" y="50" width="12" height="28" rx="4" fill="#ffffff"/>
        <text x="136" y="52" fill="#ffffff" font-family="'Arial Black', sans-serif" font-weight="900" font-size="17" text-anchor="middle">CHANNEL</text>
        <text x="136" y="78" fill="#facc15" font-family="'Impact', Arial Black, sans-serif" font-weight="900" font-size="28" text-anchor="middle">i HD</text>
        <text x="100" y="104" fill="#fbcfe8" font-family="Arial, sans-serif" font-weight="800" font-size="11" text-anchor="middle">হৃদয়ে বাংলাদেশ</text>
      </svg>
    `);
  }

  // 12. DBC NEWS (ডিবিসি নিউজ)
  if (name.includes('dbc') || id.includes('dbc')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <defs>
          <linearGradient id="dbc-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#991b1b"/>
            <stop offset="60%" stop-color="#b91c1c"/>
            <stop offset="100%" stop-color="#7f1d1d"/>
          </linearGradient>
        </defs>
        <rect width="200" height="120" rx="16" fill="url(#dbc-bg)"/>
        <rect x="25" y="20" width="150" height="42" rx="8" fill="#000000"/>
        <text x="100" y="50" fill="#ffffff" font-family="'Impact', Arial Black, sans-serif" font-weight="900" font-size="32" text-anchor="middle" letter-spacing="3">DBC</text>
        <rect x="40" y="68" width="120" height="22" rx="4" fill="#ffffff"/>
        <text x="100" y="84" fill="#991b1b" font-family="'Impact', sans-serif" font-weight="900" font-size="16" text-anchor="middle" letter-spacing="2">NEWS 24/7</text>
        <text x="100" y="106" fill="#fef08a" font-family="Arial, sans-serif" font-weight="900" font-size="11" text-anchor="middle">ডিবিসি নিউজ LIVE</text>
      </svg>
    `);
  }

  // 13. DESH TV (দেশ টিভি)
  if (name.includes('desh') || id.includes('desh')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <defs>
          <linearGradient id="desh-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#064e3b"/>
            <stop offset="60%" stop-color="#047857"/>
            <stop offset="100%" stop-color="#022c22"/>
          </linearGradient>
        </defs>
        <rect width="200" height="120" rx="16" fill="url(#desh-bg)"/>
        <!-- Red Sun with White Flag -->
        <circle cx="100" cy="38" r="22" fill="#dc2626"/>
        <polygon points="100,24 116,34 100,44" fill="#ffffff"/>
        <text x="100" y="82" fill="#ffffff" font-family="'Impact', Arial Black, sans-serif" font-weight="900" font-size="24" text-anchor="middle" letter-spacing="2">DESH TV</text>
        <rect x="55" y="90" width="90" height="18" rx="4" fill="#facc15"/>
        <text x="100" y="103" fill="#064e3b" font-family="Arial, sans-serif" font-weight="900" font-size="10" text-anchor="middle" letter-spacing="1">দেশ টিভি HD</text>
      </svg>
    `);
  }

  // 14. DURONTO TV (দুরন্ত টিভি)
  if (name.includes('duronto') || id.includes('duronto')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <defs>
          <linearGradient id="duronto-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f59e0b"/>
            <stop offset="50%" stop-color="#ea580c"/>
            <stop offset="100%" stop-color="#dc2626"/>
          </linearGradient>
        </defs>
        <rect width="200" height="120" rx="16" fill="url(#duronto-bg)"/>
        <!-- Cheerful Kid Kite Shape -->
        <polygon points="100,16 126,38 100,60 74,38" fill="#ffffff"/>
        <polygon points="100,18 122,38 100,56 78,38" fill="#0284c7"/>
        <text x="100" y="84" fill="#ffffff" font-family="'Impact', Arial Black, sans-serif" font-weight="900" font-size="22" text-anchor="middle" letter-spacing="2">DURONTO</text>
        <rect x="50" y="92" width="100" height="18" rx="4" fill="#ffffff"/>
        <text x="100" y="105" fill="#ea580c" font-family="Arial, sans-serif" font-weight="900" font-size="11" text-anchor="middle">দুরন্ত টিভি KIDS</text>
      </svg>
    `);
  }

  // 15. EKATTOR TV (৭১ টিভি / Ekattor)
  if (name.includes('ekattor') || name.includes('71') || id.includes('ekattor')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <defs>
          <linearGradient id="ekattor-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#064e3b"/>
            <stop offset="60%" stop-color="#022c22"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
        </defs>
        <rect width="200" height="120" rx="16" fill="url(#ekattor-bg)"/>
        <!-- Red 71 Circle -->
        <circle cx="56" cy="58" r="30" fill="#dc2626" stroke="#facc15" stroke-width="2"/>
        <text x="56" y="70" fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="34" text-anchor="middle">৭১</text>
        <text x="136" y="54" fill="#ffffff" font-family="'Impact', sans-serif" font-weight="900" font-size="22" text-anchor="middle">EKATTOR</text>
        <rect x="96" y="66" width="80" height="20" rx="4" fill="#dc2626"/>
        <text x="136" y="80" fill="#ffffff" font-family="'Impact', sans-serif" font-weight="900" font-size="13" text-anchor="middle">TV HD</text>
        <text x="136" y="100" fill="#34d399" font-family="Arial, sans-serif" font-weight="800" font-size="10" text-anchor="middle">সংবাদ ও বিশ্লেষণ</text>
      </svg>
    `);
  }

  // 16. GAZI TV / GTV (গাজী টিভি)
  if (name.includes('gazi') || name.includes('gtv') || id.includes('gazi') || id.includes('gtv')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <defs>
          <linearGradient id="gtv-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e3a8a"/>
            <stop offset="50%" stop-color="#2563eb"/>
            <stop offset="100%" stop-color="#0284c7"/>
          </linearGradient>
        </defs>
        <rect width="200" height="120" rx="16" fill="url(#gtv-bg)"/>
        <circle cx="56" cy="60" r="32" fill="#1d4ed8" stroke="#38bdf8" stroke-width="3"/>
        <path d="M 40 60 Q 56 36 72 60 Q 56 84 40 60 Z" fill="#38bdf8" opacity="0.8"/>
        <text x="56" y="70" fill="#ffffff" font-family="'Impact', Arial Black, sans-serif" font-size="34" font-weight="900" text-anchor="middle">G</text>
        <text x="136" y="58" fill="#ffffff" font-family="'Arial Black', sans-serif" font-weight="900" font-size="28" text-anchor="middle">TV</text>
        <rect x="96" y="72" width="82" height="20" rx="4" fill="#facc15"/>
        <text x="137" y="87" fill="#0f172a" font-family="Arial, sans-serif" font-weight="900" font-size="11" text-anchor="middle" letter-spacing="1">LIVE SPORTS</text>
      </svg>
    `);
  }

  // 17. JAMUNA TV (যমুনা টিভি)
  if (name.includes('jamuna') || id.includes('jamuna')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <defs>
          <linearGradient id="jamuna-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#991b1b"/>
            <stop offset="60%" stop-color="#dc2626"/>
            <stop offset="100%" stop-color="#7f1d1d"/>
          </linearGradient>
        </defs>
        <rect width="200" height="120" rx="16" fill="url(#jamuna-bg)"/>
        <rect x="25" y="20" width="150" height="42" rx="8" fill="#000000"/>
        <text x="100" y="50" fill="#ffffff" font-family="'Impact', sans-serif" font-weight="900" font-size="30" text-anchor="middle">JAMUNA</text>
        <text x="100" y="84" fill="#ffffff" font-family="Arial Black, sans-serif" font-weight="900" font-size="16" text-anchor="middle">TELEVISION</text>
        <rect x="50" y="92" width="100" height="18" rx="4" fill="#facc15"/>
        <text x="100" y="105" fill="#991b1b" font-family="Arial, sans-serif" font-weight="900" font-size="10" text-anchor="middle">যমুনা টিভি 24/7</text>
      </svg>
    `);
  }

  // 18. MAASRANGA TV (মাছরাঙা টেলিভিশন)
  if (name.includes('maasranga') || id.includes('maasranga')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <defs>
          <linearGradient id="ms-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#022c22"/>
            <stop offset="100%" stop-color="#064e3b"/>
          </linearGradient>
        </defs>
        <rect width="200" height="120" rx="16" fill="url(#ms-bg)"/>
        <!-- Kingfisher feathers plume -->
        <path d="M 42 70 C 40 38 70 30 75 48 C 65 60 52 68 42 70 Z" fill="#059669"/>
        <path d="M 52 70 C 52 35 84 32 86 52 C 78 62 64 68 52 70 Z" fill="#0284c7"/>
        <path d="M 62 70 C 65 38 96 38 95 56 C 88 64 74 68 62 70 Z" fill="#eab308"/>
        <path d="M 72 70 C 78 44 106 46 102 62 C 94 67 82 70 72 70 Z" fill="#dc2626"/>
        <text x="100" y="86" fill="#ffffff" font-family="'Arial Black', sans-serif" font-weight="900" font-size="15" text-anchor="middle" letter-spacing="1.5">MAASRANGA</text>
        <text x="100" y="104" fill="#34d399" font-family="Arial, sans-serif" font-weight="900" font-size="11" text-anchor="middle" letter-spacing="2">মাছরাঙা টিভি HD</text>
      </svg>
    `);
  }

  // 19. MY TV (মাই টিভি)
  if (name === 'my tv' || name.includes('my-tv') || name.includes('mytv') || id.includes('my-tv') || id.includes('mytv')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <defs>
          <linearGradient id="mytv-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0284c7"/>
            <stop offset="60%" stop-color="#0369a1"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
        </defs>
        <rect width="200" height="120" rx="16" fill="url(#mytv-bg)"/>
        <!-- Dynamic Curved Wave Emblem -->
        <circle cx="100" cy="38" r="22" fill="#ffffff"/>
        <text x="100" y="47" fill="#0284c7" font-family="'Impact', Arial Black, sans-serif" font-weight="900" font-size="24" text-anchor="middle">my</text>
        <text x="100" y="82" fill="#ffffff" font-family="'Impact', Arial Black, sans-serif" font-weight="900" font-size="24" text-anchor="middle" letter-spacing="2">MY TV HD</text>
        <rect x="55" y="90" width="90" height="18" rx="4" fill="#facc15"/>
        <text x="100" y="103" fill="#0f172a" font-family="Arial, sans-serif" font-weight="900" font-size="10" text-anchor="middle">মাই টিভি লাইভ</text>
      </svg>
    `);
  }

  // 20. NTV (এনটিভি)
  if (name.includes('ntv') || id.includes('ntv')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <defs>
          <linearGradient id="ntv-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e3a8a"/>
            <stop offset="60%" stop-color="#1d4ed8"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
        </defs>
        <rect width="200" height="120" rx="16" fill="url(#ntv-bg)"/>
        <!-- Classic NTV Red & Blue Emblem -->
        <polygon points="100,16 130,38 100,60 70,38" fill="#dc2626"/>
        <circle cx="100" cy="38" r="8" fill="#ffffff"/>
        <text x="100" y="84" fill="#ffffff" font-family="'Impact', Arial Black, sans-serif" font-weight="900" font-size="28" text-anchor="middle" letter-spacing="3">NTV</text>
        <rect x="50" y="92" width="100" height="18" rx="4" fill="#facc15"/>
        <text x="100" y="105" fill="#1e3a8a" font-family="Arial, sans-serif" font-weight="900" font-size="10" text-anchor="middle">সময়ের সাথে আগামীর পথে</text>
      </svg>
    `);
  }

  // 21. WILLOW CRICKET HD (উইলো)
  if (name.includes('willow') || id.includes('willow')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 80" width="160" height="80">
        <!-- WILLOW with red cricket ball -->
        <text x="70" y="48" fill="#111827" font-family="'Impact', 'Arial Black', sans-serif" font-weight="900" font-size="28" letter-spacing="1">WILL</text>
        <circle cx="112" cy="40" r="9" fill="#dc2626"/>
        <path d="M 106 38 Q 112 35 118 38" stroke="#ffffff" stroke-width="1.5" fill="none"/>
        <text x="124" y="48" fill="#111827" font-family="'Impact', 'Arial Black', sans-serif" font-weight="900" font-size="28" letter-spacing="1">W</text>
      </svg>
    `);
  }

  // 22. ZEE BANGLA (জি বাংলা)
  if (name.includes('zee bangla') || name.includes('zeebangla') || id.includes('zee-bangla') || id.includes('zeebangla')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <defs>
          <linearGradient id="zeeb-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6b21a8"/>
            <stop offset="60%" stop-color="#581c87"/>
            <stop offset="100%" stop-color="#3b0764"/>
          </linearGradient>
        </defs>
        <rect width="200" height="120" rx="16" fill="url(#zeeb-bg)"/>
        <!-- Zee Golden Ribbon Circle -->
        <circle cx="100" cy="38" r="22" fill="#f59e0b" stroke="#fef08a" stroke-width="2"/>
        <text x="100" y="46" fill="#3b0764" font-family="'Arial Black', sans-serif" font-weight="900" font-size="22" text-anchor="middle">ZEE</text>
        <text x="100" y="80" fill="#ffffff" font-family="'Arial Black', sans-serif" font-weight="900" font-size="20" text-anchor="middle" letter-spacing="1">BANGLA</text>
        <rect x="50" y="88" width="100" height="18" rx="4" fill="#f59e0b"/>
        <text x="100" y="101" fill="#3b0764" font-family="Arial, sans-serif" font-weight="900" font-size="10" text-anchor="middle">জি বাংলা HD LIVE</text>
      </svg>
    `);
  }

  // T Sports HD
  if (name.includes('t sports') || name.includes('tsports') || id.includes('tsports')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 100" width="220" height="100">
        <circle cx="45" cy="50" r="32" fill="#e11d48"/>
        <path d="M 28 35 L 62 35 L 62 43 L 49 43 L 49 65 L 41 65 L 41 43 L 28 43 Z" fill="#ffffff"/>
        <text x="84" y="46" fill="#0f172a" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="24" letter-spacing="1">SPORTS</text>
        <rect x="85" y="52" width="46" height="18" rx="4" fill="#e11d48"/>
        <text x="108" y="65" fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="11" text-anchor="middle">HD</text>
      </svg>
    `);
  }

  // PTV Sports HD
  if (name.includes('ptv')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100" width="160" height="100">
        <!-- PTV Sports Golden Crest & Ribbon -->
        <g transform="translate(40, 6) scale(0.8)">
          <!-- Golden Crescent Structure -->
          <path d="M 50 10 C 68 10 82 24 82 42 C 82 60 68 74 50 74 C 40 74 32 70 26 62 C 36 68 48 64 54 54 C 60 44 58 30 48 22 C 40 16 30 18 24 22 C 30 14 40 10 50 10 Z" fill="#d97706"/>
          <path d="M 50 14 C 64 14 76 26 76 40 C 76 54 64 66 50 66 C 44 66 38 64 34 60 C 42 62 50 58 54 50 C 58 42 56 30 48 24 C 44 20 38 18 34 20 C 38 16 44 14 50 14 Z" fill="#facc15"/>
          <polygon points="46,30 49,38 58,38 51,43 54,51 46,46 38,51 41,43 34,38 43,38" fill="#ffffff"/>
        </g>
        <rect x="25" y="70" width="110" height="20" rx="4" fill="#14532d"/>
        <text x="80" y="84" fill="#facc15" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="12" text-anchor="middle" letter-spacing="1">SPORTS HD</text>
      </svg>
    `);
  }

  // Star Sports
  if (name.includes('star sports') || name.includes('star')) {
    const isHindi = name.includes('hindi');
    const isSelect = name.includes('select');
    const sub = isSelect ? 'SELECT 1 HD' : (isHindi ? '1 HINDI HD' : '1 HD LIVE');
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <defs>
          <linearGradient id="ss-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#03254c"/>
            <stop offset="50%" stop-color="#1167b1"/>
            <stop offset="100%" stop-color="#021b35"/>
          </linearGradient>
        </defs>
        <rect width="200" height="120" rx="16" fill="url(#ss-bg)"/>
        <polygon points="100,10 106,30 126,30 110,42 116,61 100,49 84,61 90,42 74,30 94,30" fill="#facc15"/>
        <text x="100" y="78" fill="#ffffff" font-family="'Arial Black', sans-serif" font-weight="900" font-size="18" text-anchor="middle" letter-spacing="1.5">STAR SPORTS</text>
        <rect x="52" y="86" width="96" height="20" rx="4" fill="#dc2626"/>
        <text x="100" y="100" fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="11" text-anchor="middle" letter-spacing="1">${sub}</text>
      </svg>
    `);
  }

  // Sony Ten / Sports
  if (name.includes('sony') || name.includes('ten')) {
    let tenNum = '1';
    if (name.includes('2')) tenNum = '2';
    if (name.includes('3')) tenNum = '3';
    if (name.includes('4')) tenNum = '4';
    if (name.includes('5')) tenNum = '5';
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <rect width="200" height="120" rx="16" fill="#0f172a" stroke="#0284c7" stroke-width="2"/>
        <rect x="25" y="18" width="150" height="34" rx="6" fill="#000000"/>
        <text x="100" y="42" fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="22" text-anchor="middle" letter-spacing="3">SONY</text>
        <rect x="25" y="58" width="150" height="46" rx="6" fill="#0284c7"/>
        <text x="75" y="88" fill="#ffffff" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="18" text-anchor="middle">SPORTS</text>
        <rect x="122" y="64" width="44" height="34" rx="4" fill="#facc15"/>
        <text x="144" y="88" fill="#0f172a" font-family="'Impact', Arial Black, sans-serif" font-weight="900" font-size="22" text-anchor="middle">TEN ${tenNum}</text>
      </svg>
    `);
  }

  // Sky Sports
  if (name.includes('sky sports') || name.includes('sky')) {
    let subName = 'MAIN EVENT';
    if (name.includes('premier')) subName = 'PREMIER LEAGUE';
    if (name.includes('football')) subName = 'FOOTBALL';
    if (name.includes('cricket')) subName = 'CRICKET';
    if (name.includes('f1') || name.includes('formula')) subName = 'F1 LIVE';
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <rect width="200" height="120" rx="16" fill="#0b1329" stroke="#dc2626" stroke-width="2"/>
        <g transform="translate(18, 26)">
          <rect x="0" y="0" width="70" height="42" rx="8" fill="#0284c7"/>
          <text x="35" y="30" fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="26" text-anchor="middle">sky</text>
          <rect x="74" y="0" width="90" height="42" rx="8" fill="#dc2626"/>
          <text x="119" y="28" fill="#ffffff" font-family="'Arial Black', sans-serif" font-weight="900" font-size="18" text-anchor="middle">SPORTS</text>
        </g>
        <rect x="25" y="80" width="150" height="22" rx="4" fill="#1e293b"/>
        <text x="100" y="95" fill="#facc15" font-family="Arial, sans-serif" font-weight="900" font-size="11" text-anchor="middle" letter-spacing="1">${subName} HD</text>
      </svg>
    `);
  }

  // beIN Sports
  if (name.includes('bein')) {
    let beNum = '1';
    if (name.includes('2')) beNum = '2';
    if (name.includes('3')) beNum = '3';
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <defs>
          <linearGradient id="bein-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4c1d95"/>
            <stop offset="60%" stop-color="#581c87"/>
            <stop offset="100%" stop-color="#2e1065"/>
          </linearGradient>
        </defs>
        <rect width="200" height="120" rx="16" fill="url(#bein-bg)"/>
        <text x="100" y="54" fill="#ffffff" font-family="'Arial Black', sans-serif" font-weight="900" font-size="34" text-anchor="middle" letter-spacing="1">beIN</text>
        <rect x="36" y="68" width="128" height="28" rx="6" fill="#facc15"/>
        <text x="100" y="88" fill="#3b0764" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="16" text-anchor="middle" letter-spacing="1.5">SPORTS ${beNum} HD</text>
      </svg>
    `);
  }

  // Eurosport
  if (name.includes('eurosport') || name.includes('euro sports')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <rect width="200" height="120" rx="16" fill="#0f172a"/>
        <circle cx="50" cy="54" r="28" fill="none" stroke="#facc15" stroke-width="2" stroke-dasharray="4,4"/>
        <text x="50" y="62" fill="#ffffff" font-family="Arial Black, sans-serif" font-weight="900" font-size="24" text-anchor="middle">E</text>
        <text x="132" y="52" fill="#ffffff" font-family="'Arial Black', sans-serif" font-weight="900" font-size="18" text-anchor="middle">EURO</text>
        <text x="132" y="72" fill="#0284c7" font-family="'Arial Black', sans-serif" font-weight="900" font-size="16" text-anchor="middle">SPORT</text>
        <rect x="92" y="82" width="80" height="18" rx="4" fill="#0284c7"/>
        <text x="132" y="95" fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="10" text-anchor="middle" letter-spacing="1">1 HD LIVE</text>
      </svg>
    `);
  }

  // Somoy TV
  if (name.includes('somoy')) {
    return wrapSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
        <rect width="200" height="120" rx="16" fill="#0f172a"/>
        <circle cx="54" cy="58" r="28" fill="#dc2626"/>
        <polygon points="54,36 68,58 40,58" fill="#facc15"/>
        <text x="134" y="54" fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="24" text-anchor="middle">সময়</text>
        <text x="134" y="78" fill="#facc15" font-family="Arial Black, sans-serif" font-weight="900" font-size="14" text-anchor="middle">SOMOY</text>
        <rect x="94" y="86" width="80" height="18" rx="4" fill="#dc2626"/>
        <text x="134" y="99" fill="#ffffff" font-family="Arial, sans-serif" font-weight="900" font-size="10" text-anchor="middle">HD LIVE</text>
      </svg>
    `);
  }

  // If channel already has a custom image URL provided
  if (channel.logo && channel.logo.trim().length > 10 && !channel.logo.includes('data:image/svg+xml;utf8,%3Csvg')) {
    return channel.logo;
  }

  // Fallback badge
  const initials = channel.name
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .slice(0, 3)
    .map(w => w[0])
    .join('')
    .toUpperCase() || 'TV';

  return wrapSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
      <rect width="200" height="120" rx="16" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
      <circle cx="170" cy="22" r="6" fill="#ef4444"/>
      <text x="100" y="58" fill="#38bdf8" font-family="'Impact', Arial Black, sans-serif" font-weight="900" font-size="32" text-anchor="middle" letter-spacing="2">${initials}</text>
      <rect x="30" y="74" width="140" height="24" rx="6" fill="#090f1f" opacity="0.8"/>
      <text x="100" y="90" fill="#ffffff" font-family="Arial, sans-serif" font-weight="800" font-size="11" text-anchor="middle">${channel.name.slice(0, 18)}</text>
    </svg>
  `);
}
