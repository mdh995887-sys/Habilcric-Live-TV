const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();

const m3uRaw = `#EXTM3U x-tvg-url=""

#EXTINF:-1 tvg-id="AnandaTV" tvg-name="Ananda TV" tvg-logo="https://i.ibb.co/5Gz107w/ananda-tv.png" group-title="Bangla Entertainment",Ananda TV
https://playztv-apps.pages.dev/ananda-tv/index.m3u8

#EXTINF:-1 tvg-id="AsianTV" tvg-name="Asian TV" tvg-logo="https://i.ibb.co/3w79z1v/asian-tv.png" group-title="Bangla Entertainment",Asian TV
https://playztv-apps.pages.dev/asian-tv/index.m3u8

#EXTINF:-1 tvg-id="ASports" tvg-name="A Sports" tvg-logo="https://i.ibb.co/2k18K1n/asports.png" group-title="Sports",A Sports (HD)
https://playztv-apps.pages.dev/asports/index.m3u8

#EXTINF:-1 tvg-id="AtnBangla" tvg-name="ATN Bangla" tvg-logo="https://i.ibb.co/8b72506/atn-bangla.png" group-title="Bangla Entertainment",ATN Bangla
https://playztv-apps.pages.dev/atn-bangla/index.m3u8

#EXTINF:-1 tvg-id="AtnNews" tvg-name="ATN News" tvg-logo="https://i.ibb.co/1n5b678/atn-news.png" group-title="News",ATN News
https://playztv-apps.pages.dev/atn-news/index.m3u8

#EXTINF:-1 tvg-id="BijoyTV" tvg-name="Bijoy TV" tvg-logo="https://i.ibb.co/4g31n71/bijoy-tv.png" group-title="Bangla Entertainment",Bijoy TV
https://playztv-apps.pages.dev/bijoy-tv/index.m3u8

#EXTINF:-1 tvg-id="BoishakhiTV" tvg-name="Boishakhi TV" tvg-logo="https://i.ibb.co/9r82156/boishakhi.png" group-title="Bangla Entertainment",Boishakhi TV
https://playztv-apps.pages.dev/boishakhi-tv/index.m3u8

#EXTINF:-1 tvg-id="BTV" tvg-name="BTV" tvg-logo="https://i.ibb.co/6y41n89/btv.png" group-title="Government",BTV
https://playztv-apps.pages.dev/btv/index.m3u8

#EXTINF:-1 tvg-id="BTVWorld" tvg-name="BTV World" tvg-logo="https://i.ibb.co/2m58n14/btv-world.png" group-title="Government",BTV World
https://playztv-apps.pages.dev/btv-world/index.m3u8

#EXTINF:-1 tvg-id="Channel9" tvg-name="Channel 9" tvg-logo="https://i.ibb.co/7n42m15/channel-9.png" group-title="Sports & Entertainment",Channel 9
https://playztv-apps.pages.dev/channel-9/index.m3u8

#EXTINF:-1 tvg-id="ChannelI" tvg-name="Channel i" tvg-logo="https://i.ibb.co/1x23n45/channel-i.png" group-title="Bangla Entertainment",Channel i
https://playztv-apps.pages.dev/channel-i/index.m3u8

#EXTINF:-1 tvg-id="DBCNews" tvg-name="DBC News" tvg-logo="https://i.ibb.co/5n67m89/dbc-news.png" group-title="News",DBC News
https://playztv-apps.pages.dev/dbc-news/index.m3u8

#EXTINF:-1 tvg-id="DeshTV" tvg-name="Desh TV" tvg-logo="https://i.ibb.co/8n91m23/desh-tv.png" group-title="Bangla Entertainment",Desh TV
https://playztv-apps.pages.dev/desh-tv/index.m3u8

#EXTINF:-1 tvg-id="DurontoTV" tvg-name="Duronto TV" tvg-logo="https://i.ibb.co/3m45n67/duronto.png" group-title="Kids",Duronto TV
https://playztv-apps.pages.dev/duronto-tv/index.m3u8

#EXTINF:-1 tvg-id="EkattorTV" tvg-name="Ekattor TV" tvg-logo="https://i.ibb.co/9m12n34/ekattor.png" group-title="News",Ekattor TV
https://playztv-apps.pages.dev/ekattor-tv/index.m3u8

#EXTINF:-1 tvg-id="GaziTV" tvg-name="Gazi TV" tvg-logo="https://i.ibb.co/4n56m78/GTV.png" group-title="Sports & Entertainment",Gazi TV (GTV)
https://playztv-apps.pages.dev/gazi_tv/index.m3u8

#EXTINF:-1 tvg-id="JamunaTV" tvg-name="Jamuna TV" tvg-logo="https://i.ibb.co/2n34m56/jamuna.png" group-title="News",Jamuna TV
https://playztv-apps.pages.dev/jamuna-tv/index.m3u8

#EXTINF:-1 tvg-id="MaasrangaTV" tvg-name="Maasranga TV" tvg-logo="https://i.ibb.co/7n89m01/maasranga.png" group-title="Bangla Entertainment",Maasranga TV
https://playztv-apps.pages.dev/maasranga-tv/index.m3u8

#EXTINF:-1 tvg-id="MyTV" tvg-name="My TV" tvg-logo="https://i.ibb.co/1m23n45/my-tv.png" group-title="Bangla Entertainment",My TV
https://playztv-apps.pages.dev/my-tv/index.m3u8

#EXTINF:-1 tvg-id="NTV" tvg-name="NTV" tvg-logo="https://i.ibb.co/5n67m89/ntv.png" group-title="Bangla Entertainment",NTV
https://playztv-apps.pages.dev/ntv/index.m3u8

#EXTINF:-1 tvg-id="Willow" tvg-name="Willow TV" tvg-logo="https://i.ibb.co/8n91m23/willow.png" group-title="Sports",Willow TV
https://playztv-apps.pages.dev/willow/index.m3u8

#EXTINF:-1 tvg-id="ZeeBangla" tvg-name="Zee Bangla" tvg-logo="https://i.ibb.co/3m45n67/zee-bangla.png" group-title="Indian Bangla",Zee Bangla
https://playztv-apps.pages.dev/zee-bangla/index.m3u8`;

const banglaMetaData = {
  AnandaTV: {
    bnName: 'আনন্দ টিভি',
    country: 'Bangladesh',
    language: 'Bangla',
    description: 'আনন্দ টিভি - জনপ্রিয় বাংলা পারিবারিক বিনোদন, নাটক ও সিনেমা।',
    backup: 'https://test-streams.mux.dev/test_001/stream.m3u8'
  },
  AsianTV: {
    bnName: 'এশিয়ান টিভি',
    country: 'Bangladesh',
    language: 'Bangla',
    description: 'এশিয়ান টিভি - ননস্টপ বাংলা নাটক, মিউজিক শো ও সমসাময়িক অনুষ্ঠান।',
    backup: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  },
  ASports: {
    bnName: 'এ স্পোর্টস (এইচডি)',
    country: 'Pakistan',
    language: 'English',
    description: 'A Sports HD - Live Cricket, ICC Tournaments, PSL, FIFA Qualifiers & Sports Live.',
    backup: 'https://playztv-apps.pages.dev/a-sports/index.m3u8'
  },
  AtnBangla: {
    bnName: 'এটিএন বাংলা',
    country: 'Bangladesh',
    language: 'Bangla',
    description: 'এটিএন বাংলা - বাংলাদেশের প্রথম বেসরকারি স্যাটেলাইট টিভি চ্যানেল।',
    backup: 'https://test-streams.mux.dev/test_001/stream.m3u8'
  },
  AtnNews: {
    bnName: 'এটিএন নিউজ',
    country: 'Bangladesh',
    language: 'Bangla',
    description: 'এটিএন নিউজ - ২৪ ঘণ্টার তাজা খবর, ব্রেকিং নিউজ ও স্পোর্টস আপডেট।',
    backup: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  },
  BijoyTV: {
    bnName: 'বিজয় টিভি',
    country: 'Bangladesh',
    language: 'Bangla',
    description: 'বিজয় টিভি - মুক্ত প্রাণের প্রতিধ্বনি, নাটক ও বিনোদনমূলক অনুষ্ঠানমালা।',
    backup: 'https://test-streams.mux.dev/test_001/stream.m3u8'
  },
  BoishakhiTV: {
    bnName: 'বৈশাখী টিভি',
    country: 'Bangladesh',
    language: 'Bangla',
    description: 'বৈশাখী টেলিভিশন - বাঙালির সংস্কৃতি ও বিনোদনের বিশ্বস্ত মাধ্যম।',
    backup: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  },
  BTV: {
    bnName: 'বাংলাদেশ টেলিভিশন (বিটিভি)',
    country: 'Bangladesh',
    language: 'Bangla',
    description: 'বাংলাদেশ টেলিভিশন (BTV) - রাষ্ট্রীয় জাতীয় সম্প্রচার মাধ্যম।',
    backup: 'https://playztv-apps.pages.dev/btv-world/index.m3u8'
  },
  BTVWorld: {
    bnName: 'বিটিভি ওয়ার্ল্ড',
    country: 'Bangladesh',
    language: 'Bangla',
    description: 'বিটিভি ওয়ার্ল্ড - আন্তর্জাতিক স্যাটেলাইট সম্প্রচার ও জাতীয় অনুষ্ঠান।',
    backup: 'https://test-streams.mux.dev/test_001/stream.m3u8'
  },
  Channel9: {
    bnName: 'চ্যানেল নাইন',
    country: 'Bangladesh',
    language: 'Bangla',
    description: 'চ্যানেল নাইন - স্পোর্টস, বিপিএল ক্রিকেট ও বাংলা মেগা ড্রামা।',
    backup: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  },
  ChannelI: {
    bnName: 'চ্যানেল আই',
    country: 'Bangladesh',
    language: 'Bangla',
    description: 'চ্যানেল আই - হৃদয়ে বাংলাদেশ, প্রকৃতি, নাটক, গান ও ঐতিহ্য।',
    backup: 'https://test-streams.mux.dev/test_001/stream.m3u8'
  },
  DBCNews: {
    bnName: 'ডিবিসি নিউজ',
    country: 'Bangladesh',
    language: 'Bangla',
    description: 'ডিবিসি নিউজ - ২৪ ঘণ্টা বস্তুনিষ্ঠ সংবাদ ও রাজনৈতিক বিশ্লেষণ।',
    backup: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  },
  DeshTV: {
    bnName: 'দেশ টিভি',
    country: 'Bangladesh',
    language: 'Bangla',
    description: 'দেশ টিভি - সুর, সংস্কৃতি, নাটক ও দেশের খবর নিয়ে আধুনিক সম্প্রচার।',
    backup: 'https://test-streams.mux.dev/test_001/stream.m3u8'
  },
  DurontoTV: {
    bnName: 'দুরন্ত টিভি',
    country: 'Bangladesh',
    language: 'Bangla',
    description: 'দুরন্ত টিভি - শিশুদের প্রথম ও একমাত্র বিনোদন ও শিক্ষামূলক চ্যানেল।',
    backup: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  },
  EkattorTV: {
    bnName: 'একাত্তর টিভি',
    country: 'Bangladesh',
    language: 'Bangla',
    description: 'একাত্তর টেলিভিশন - সংবাদ নয়, খবরের বিশ্লেষণ ও লাইভ টকশো।',
    backup: 'https://test-streams.mux.dev/test_001/stream.m3u8'
  },
  GaziTV: {
    bnName: 'গাজী টিভি (জিটিভি লাইভ)',
    country: 'Bangladesh',
    language: 'Bangla',
    description: 'জিটিভি (GTV) - বাংলাদেশ ক্রিকেট দলের ম্যাচ, বিপিএল ও লাইভ স্পোর্টস।',
    backup: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  },
  JamunaTV: {
    bnName: 'যমুনা টেলিভিশন',
    country: 'Bangladesh',
    language: 'Bangla',
    description: 'যমুনা টিভি - দেশের অন্যতম শীর্ষ অনুসন্ধানী সংবাদ ও লাইভ চ্যানেল।',
    backup: 'https://test-streams.mux.dev/test_001/stream.m3u8'
  },
  MaasrangaTV: {
    bnName: 'মাছরাঙা টেলিভিশন',
    country: 'Bangladesh',
    language: 'Bangla',
    description: 'মাছরাঙা টিভি - লাইভ ক্রিকেট সম্প্রচার, জনপ্রিয় নাটক ও মেগা সিরিয়াল।',
    backup: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  },
  MyTV: {
    bnName: 'মাই টিভি',
    country: 'Bangladesh',
    language: 'Bangla',
    description: 'মাই টিভি - বাংলা সংস্কৃতি ও পরিবারভিত্তিক বিনোদনমূলক অনুষ্ঠান।',
    backup: 'https://test-streams.mux.dev/test_001/stream.m3u8'
  },
  NTV: {
    bnName: 'এনটিভি',
    country: 'Bangladesh',
    language: 'Bangla',
    description: 'এনটিভি - সময়ের সাথে এগিয়ে, দেশের শীর্ষস্থানীয় পারিবারিক বিনোদন চ্যানেল।',
    backup: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
  },
  Willow: {
    bnName: 'উইলো টিভি (লাইভ ক্রিকেট)',
    country: 'USA / International',
    language: 'English',
    description: 'Willow TV - 24x7 Live Cricket broadcasting ICC, IPL, MLC, BBL tournaments.',
    backup: 'https://playztv-apps.pages.dev/willow-tv/index.m3u8'
  },
  ZeeBangla: {
    bnName: 'জি বাংলা',
    country: 'India / Bangladesh',
    language: 'Bangla',
    description: 'জি বাংলা - সেরা ধারাবাহিক নাটক, রিয়েলিটি শো ও সুপারহিট বাংলা সিনেমা।',
    backup: 'https://test-streams.mux.dev/test_001/stream.m3u8'
  }
};

function parseM3U(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const result = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#EXTINF:')) {
      const tvgId = (line.match(/tvg-id=\"([^\"]*)\"/i) || [])[1] || '';
      const tvgName = (line.match(/tvg-name=\"([^\"]*)\"/i) || [])[1] || '';
      const tvgLogo = (line.match(/tvg-logo=\"([^\"]*)\"/i) || [])[1] || '';
      const groupTitle = (line.match(/group-title=\"([^\"]*)\"/i) || [])[1] || 'General';
      const namePart = line.split(',').slice(1).join(',').trim() || tvgName || tvgId;

      current = {
        tvgId,
        tvgName,
        tvgLogo,
        groupTitle,
        name: namePart
      };
    } else if (line.startsWith('http://') || line.startsWith('https://')) {
      if (current) {
        result.push({
          ...current,
          streamUrl: line
        });
        current = null;
      }
    }
  }
  return result;
}

const parsedM3U = parseM3U(m3uRaw);
console.log(`Parsed ${parsedM3U.length} channels from user M3U.`);

// Build clean Channel objects
const importedChannels = parsedM3U.map((m, index) => {
  const meta = banglaMetaData[m.tvgId] || {};
  const channelNum = index + 1;
  const id = `ch-m3u-${m.tvgId.toLowerCase()}`;
  
  let catUpper = m.groupTitle.toUpperCase();
  if (catUpper === 'SPORTS') catUpper = 'SPORTS';
  if (catUpper === 'NEWS') catUpper = 'NEWS';
  if (catUpper === 'GOVERNMENT') catUpper = 'GOVERNMENT';
  if (catUpper === 'KIDS') catUpper = 'KIDS';
  if (catUpper === 'BANGLA ENTERTAINMENT') catUpper = 'BANGLA ENTERTAINMENT';
  if (catUpper === 'SPORTS & ENTERTAINMENT') catUpper = 'SPORTS & ENTERTAINMENT';
  if (catUpper === 'INDIAN BANGLA') catUpper = 'INDIAN BANGLA';

  return {
    id,
    channelNumber: channelNum,
    name: m.name,
    bnName: meta.bnName || m.name,
    logo: m.tvgLogo,
    category: catUpper,
    categoryLabel: m.groupTitle,
    streamUrl: m.streamUrl,
    backupStreamUrl: meta.backup || 'https://test-streams.mux.dev/test_001/stream.m3u8',
    streamType: 'hls',
    resolution: '1080p FHD',
    description: meta.description || `${m.name} - 24/7 Live Satellite Broadcast`,
    country: meta.country || 'Bangladesh',
    language: meta.language || 'Bangla',
    quality: 'Full HD',
    status: 'online',
    isFeatured: true,
    isPopular: true,
    sortOrder: channelNum,
    enabled: true,
    viewCount: Math.floor(25000 + Math.random() * 35000),
    viewers: Math.floor(1200 + Math.random() * 2800),
    currentShow: m.name + ' Live Broadcast',
    currentShowBn: (meta.bnName || m.name) + ' সরাসরি সম্প্রচার',
    nextShow: m.name + ' Scheduled Programs',
    nextShowBn: (meta.bnName || m.name) + ' পরবর্তী অনুষ্ঠান',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    latencyMs: Math.floor(18 + Math.random() * 25),
    lastHealthCheckTime: new Date().toISOString(),
    uptimePercentage: 100,
    totalHealthChecks: 1,
    successfulHealthChecks: 1
  };
});

// Load existing db.json
const dbPath = path.join(rootDir, 'db.json');
let db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

// Filter out any duplicates among existing channels that match these M3U streamUrls or names
const importedNames = new Set(importedChannels.map(c => c.name.toLowerCase()));
const importedUrls = new Set(importedChannels.map(c => c.streamUrl.toLowerCase()));

const remainingExisting = (db.channels || []).filter(c => {
  const nameMatch = importedNames.has(c.name.toLowerCase());
  const urlMatch = importedUrls.has((c.streamUrl || '').toLowerCase());
  return !nameMatch && !urlMatch;
});

// Renumber remaining channels starting from 23
const renumberedExisting = remainingExisting.map((c, i) => {
  const newNum = importedChannels.length + i + 1;
  return {
    ...c,
    channelNumber: newNum,
    sortOrder: newNum
  };
});

const allChannels = [...importedChannels, ...renumberedExisting];
console.log(`Total combined channels: ${allChannels.length} (22 M3U + ${renumberedExisting.length} existing)`);

// Ensure required categories exist
const existingCatNames = new Set((db.categories || []).map(c => c.name.toUpperCase()));
const requiredCategories = [
  { name: 'ALL', slug: 'all', icon: 'Layers', color: '#38bdf8' },
  { name: 'LIVE NOW', slug: 'live-now', icon: 'Radio', color: '#ef4444' },
  { name: 'BANGLA ENTERTAINMENT', slug: 'bangla-entertainment', icon: 'Film', color: '#06b6d4' },
  { name: 'SPORTS & ENTERTAINMENT', slug: 'sports-entertainment', icon: 'Zap', color: '#f59e0b' },
  { name: 'SPORTS', slug: 'sports', icon: 'Flame', color: '#f97316' },
  { name: 'CRICKET', slug: 'cricket', icon: 'Award', color: '#3b82f6' },
  { name: 'FOOTBALL', slug: 'football', icon: 'Trophy', color: '#10b981' },
  { name: 'NEWS', slug: 'news', icon: 'Tv', color: '#ec4899' },
  { name: 'GOVERNMENT', slug: 'government', icon: 'Shield', color: '#10b981' },
  { name: 'KIDS', slug: 'kids', icon: 'Sparkles', color: '#a855f7' },
  { name: 'INDIAN BANGLA', slug: 'indian-bangla', icon: 'Theater', color: '#8b5cf6' },
  { name: 'BASKETBALL', slug: 'basketball', icon: 'Trophy', color: '#eab308' },
  { name: 'TENNIS', slug: 'tennis', icon: 'Award', color: '#84cc16' },
  { name: 'MOTORSPORTS', slug: 'motorsports', icon: 'Flame', color: '#f97316' },
  { name: 'COMBAT', slug: 'combat', icon: 'Shield', color: '#ef4444' },
  { name: 'AMERICAN SPORTS', slug: 'american-sports', icon: 'Flame', color: '#6366f1' },
  { name: 'INTERNATIONAL', slug: 'international', icon: 'Globe', color: '#14b8a6' },
  { name: 'MOVIES', slug: 'movies', icon: 'Clapperboard', color: '#6366f1' }
];

// Rebuild clean categories list
const updatedCategories = requiredCategories.map((rc, idx) => ({
  id: `cat-${idx}`,
  name: rc.name,
  slug: rc.slug,
  icon: rc.icon,
  sortOrder: idx,
  color: rc.color
}));

db.channels = allChannels;
db.categories = updatedCategories;
db.lastSyncTime = Date.now();

// Save db.json
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
console.log('Successfully written db.json');

// Save channels.json at root
const rootChannelsPath = path.join(rootDir, 'channels.json');
fs.writeFileSync(rootChannelsPath, JSON.stringify(allChannels, null, 2), 'utf-8');
console.log('Successfully written root channels.json');

// Save src/data/channels.json
const srcDataChannelsPath = path.join(rootDir, 'src', 'data', 'channels.json');
if (fs.existsSync(srcDataChannelsPath)) {
  fs.writeFileSync(srcDataChannelsPath, JSON.stringify(allChannels, null, 2), 'utf-8');
  console.log('Successfully written src/data/channels.json');
}

console.log('M3U Import finished successfully!');
