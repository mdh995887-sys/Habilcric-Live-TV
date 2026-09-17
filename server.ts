import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { mapM3uGroupToPredefinedCategory, runAutomatedCategorySync, PREDEFINED_CATEGORY_RULES } from './src/utils/m3uCategorySync';

// Safe directory resolution for both ESM development and bundled CommonJS production
const rootDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Database storage file path
const DB_FILE = path.join(rootDir, 'db.json');

// Memory cache with disk persistence
interface DBStore {
  channels: any[];
  categories: any[];
  matches: any[];
  appSettings: any;
  notifications: any[];
  aiMessages?: any[];
  images?: any[];
  reports?: any[];
  admin: {
    username: string;
    passwordHash: string; // Plain/hash for simple resilient auth
  };
  lastSyncTime: number;
}

let db: DBStore;

// Default initial state
function getDefaultState(): DBStore {
  return {
    channels: [
      {
        id: 'ch-tsports',
        channelNumber: 1,
        name: 'T Sports',
        logo: '/logos/tsports.svg',
        category: 'SPORTS',
        streamUrl: 'https://playztv-apps.pages.dev/unite8-sports-2/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: "Bangladesh's premier sports satellite channel broadcasting BPL, International Cricket, and Bangladesh Premier League Football.",
        country: 'Bangladesh',
        language: 'Bangla / English',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 1,
        enabled: true,
        viewCount: 48200,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-bein-sports-1',
        channelNumber: 2,
        name: 'Bein Sports 1',
        logo: '/logos/beinsports1.svg',
        category: 'SPORTS',
        streamUrl: 'https://playztv-apps.pages.dev/bein-sports-1/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'UEFA Champions League, Premier League, La Liga, Ligue 1 and live international tournaments.',
        country: 'International',
        language: 'English',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 2,
        enabled: true,
        viewCount: 41500,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-willow-tv',
        channelNumber: 3,
        name: 'Willow TV',
        logo: '/logos/willowtv.svg',
        category: 'SPORTS',
        streamUrl: 'https://playztv-apps.pages.dev/willow-tv/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: 'Premier 24x7 live cricket network broadcasting IPL, ICC World Cups, Big Bash League, and Major League Cricket.',
        country: 'USA / International',
        language: 'English',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 3,
        enabled: true,
        viewCount: 36800,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-a-sports',
        channelNumber: 4,
        name: 'A Sports',
        logo: '/logos/asports.svg',
        category: 'SPORTS',
        streamUrl: 'https://playztv-apps.pages.dev/a-sports/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'First HD sports channel broadcasting ICC tournaments, PSL, FIFA qualifiers & Tennis.',
        country: 'Pakistan / International',
        language: 'English',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 4,
        enabled: true,
        viewCount: 31900,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-ptv-sports',
        channelNumber: 5,
        name: 'PTV Sports',
        logo: '/logos/ptvsports.svg',
        category: 'SPORTS',
        streamUrl: 'https://playztv-apps.pages.dev/ptv-sports/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: 'Live Cricket, PSL, ICC World Cup, Hockey and International Sports Championship.',
        country: 'Pakistan',
        language: 'Urdu / English',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 5,
        enabled: true,
        viewCount: 35400,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-eurosport',
        channelNumber: 6,
        name: 'Euro Sports HD',
        logo: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=200&auto=format&fit=crop&q=80',
        category: 'SPORTS',
        streamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'European Football, Tennis Grand Slams, Motorsports, and Olympic Sports live coverage.',
        country: 'Europe',
        language: 'English',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 6,
        enabled: true,
        viewCount: 19800,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-gazi-tv',
        channelNumber: 7,
        name: 'GTV Live (Gazi TV)',
        logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200&auto=format&fit=crop&q=80',
        category: 'BANGLADESHI',
        streamUrl: 'https://playztv-apps.pages.dev/gazi_tv/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'Bangladesh official broadcaster for ICC Tournaments, IPL, BCB home tours & entertainment.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 7,
        enabled: true,
        viewCount: 35600,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-btv',
        channelNumber: 8,
        name: 'BTV National',
        logo: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&auto=format&fit=crop&q=80',
        category: 'BANGLADESHI',
        streamUrl: 'https://playztv-apps.pages.dev/btv/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: 'Bangladesh Television official state broadcaster with live national sports, news & drama.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 8,
        enabled: true,
        viewCount: 14200,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-btv-world',
        channelNumber: 9,
        name: 'BTV World',
        logo: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&auto=format&fit=crop&q=80',
        category: 'BANGLADESHI',
        streamUrl: 'https://playztv-apps.pages.dev/btv-world/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'Bangladesh Television global international satellite transmission.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 9,
        enabled: true,
        viewCount: 11200,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-channel-i',
        channelNumber: 10,
        name: 'Channel i HD',
        logo: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80',
        category: 'BANGLADESHI',
        streamUrl: 'https://playztv-apps.pages.dev/channel-i/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: 'Iconic Bangla lifestyle, films, music shows, dramas and live events.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 10,
        enabled: true,
        viewCount: 22100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-channel-9',
        channelNumber: 11,
        name: 'Channel 9',
        logo: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=200&auto=format&fit=crop&q=80',
        category: 'BANGLADESHI',
        streamUrl: 'https://playztv-apps.pages.dev/channel-9/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'Leading Bangla entertainment and sports network broadcasting BPL & drama series.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 11,
        enabled: true,
        viewCount: 17800,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-ntv',
        channelNumber: 12,
        name: 'NTV Bangladesh',
        logo: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=200&auto=format&fit=crop&q=80',
        category: 'BANGLADESHI',
        streamUrl: 'https://playztv-apps.pages.dev/ntv/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: 'Popular Bangla entertainment, Eid special dramas, music and 24/7 news.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 12,
        enabled: true,
        viewCount: 25400,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-atn-bangla',
        channelNumber: 13,
        name: 'ATN Bangla',
        logo: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=200&auto=format&fit=crop&q=80',
        category: 'BANGLADESHI',
        streamUrl: 'https://playztv-apps.pages.dev/atn-bangla/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: "First private satellite TV channel of Bangladesh with rich cultural programs and dramas.",
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 13,
        enabled: true,
        viewCount: 16400,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-atn-news',
        channelNumber: 14,
        name: 'ATN News HD',
        logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200&auto=format&fit=crop&q=80',
        category: 'NEWS',
        streamUrl: 'https://playztv-apps.pages.dev/atn-news/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: '24/7 Bangla news television reporting breaking headlines, sports bulletin & talk shows.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 14,
        enabled: true,
        viewCount: 18900,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-jamuna-tv',
        channelNumber: 15,
        name: 'Jamuna Television',
        logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
        category: 'NEWS',
        streamUrl: 'https://playztv-apps.pages.dev/jamuna-tv/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: 'Bangladesh 24-hour investigative news network with live sports coverage and studio debates.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 15,
        enabled: true,
        viewCount: 31800,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-ekattor-tv',
        channelNumber: 16,
        name: 'Ekattor TV HD',
        logo: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=200&auto=format&fit=crop&q=80',
        category: 'NEWS',
        streamUrl: 'https://playztv-apps.pages.dev/ekattor-tv/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'First full HD news channel in Bangladesh broadcasting 24-hour live news and analysis.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 16,
        enabled: true,
        viewCount: 20400,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-dbc-news',
        channelNumber: 17,
        name: 'DBC News',
        logo: 'https://images.unsplash.com/photo-1586339949916-3e945ab6cb1a?w=200&auto=format&fit=crop&q=80',
        category: 'NEWS',
        streamUrl: 'https://playztv-apps.pages.dev/dbc-news/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: 'Dhaka Bangla Channel 24-hour live news network with reports, politics & sports.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 17,
        enabled: true,
        viewCount: 15700,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-maasranga-tv',
        channelNumber: 18,
        name: 'Maasranga TV HD',
        logo: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=200&auto=format&fit=crop&q=80',
        category: 'BANGLADESHI',
        streamUrl: 'https://playztv-apps.pages.dev/maasranga-tv/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'High definition Bangla entertainment and sports broadcaster broadcasting live tournaments & dramas.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 18,
        enabled: true,
        viewCount: 23900,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-desh-tv',
        channelNumber: 19,
        name: 'Desh TV',
        logo: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&auto=format&fit=crop&q=80',
        category: 'BANGLADESHI',
        streamUrl: 'https://playztv-apps.pages.dev/desh-tv/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: 'Bangla television network presenting culture, music, movies and news bulletin.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 19,
        enabled: true,
        viewCount: 12800,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-duronto-tv',
        channelNumber: 20,
        name: 'Duronto TV',
        logo: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&auto=format&fit=crop&q=80',
        category: 'ENTERTAINMENT',
        streamUrl: 'https://playztv-apps.pages.dev/duronto-tv/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: "Bangladesh's first dedicated children and family entertainment television channel.",
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 20,
        enabled: true,
        viewCount: 17200,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-boishakhi-tv',
        channelNumber: 21,
        name: 'Boishakhi TV',
        logo: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80',
        category: 'BANGLADESHI',
        streamUrl: 'https://playztv-apps.pages.dev/boishakhi-tv/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: 'Bangla satellite channel promoting Bengali heritage, festivals, music and dramas.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 21,
        enabled: true,
        viewCount: 13400,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-bijoy-tv',
        channelNumber: 22,
        name: 'Bijoy TV',
        logo: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=200&auto=format&fit=crop&q=80',
        category: 'BANGLADESHI',
        streamUrl: 'https://playztv-apps.pages.dev/bijoy-tv/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'Bangla infotainment channel broadcasting regional news, culture and social programs.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 22,
        enabled: true,
        viewCount: 9800,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-asian-tv',
        channelNumber: 23,
        name: 'Asian TV HD',
        logo: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=200&auto=format&fit=crop&q=80',
        category: 'BANGLADESHI',
        streamUrl: 'https://playztv-apps.pages.dev/asian-tv/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: 'Bangla infotainment and entertainment satellite channel broadcasting daily series and talk shows.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 23,
        enabled: true,
        viewCount: 14100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-ananda-tv',
        channelNumber: 24,
        name: 'Ananda TV',
        logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
        category: 'BANGLADESHI',
        streamUrl: 'https://playztv-apps.pages.dev/ananda-tv/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'Bangla family television broadcasting lifestyle, musical concerts and cinema.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 24,
        enabled: true,
        viewCount: 11500,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-my-tv',
        channelNumber: 25,
        name: 'My TV',
        logo: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=200&auto=format&fit=crop&q=80',
        category: 'BANGLADESHI',
        streamUrl: 'https://playztv-apps.pages.dev/my-tv/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: 'Bangla satellite television channel broadcasting popular entertainment programs and dramas.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 25,
        enabled: true,
        viewCount: 12200,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-zee-bangla',
        channelNumber: 26,
        name: 'Zee Bangla HD',
        logo: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=200&auto=format&fit=crop&q=80',
        category: 'ENTERTAINMENT',
        streamUrl: 'https://playztv-apps.pages.dev/zee-bangla/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: 'Top rated Bengali general entertainment channel with popular mega serials, reality shows & movies.',
        country: 'India / Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 26,
        enabled: true,
        viewCount: 38900,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-peace-tv',
        channelNumber: 27,
        name: 'Peace TV Bangla',
        logo: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=200&auto=format&fit=crop&q=80',
        category: 'ISLAMIC',
        streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: 'Islamic educational and religious lectures, Quran recitation and discussions in Bangla.',
        country: 'International',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 27,
        enabled: true,
        viewCount: 15600,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-makkah-live',
        channelNumber: 28,
        name: 'Makkah Live HD',
        logo: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=200&auto=format&fit=crop&q=80',
        category: 'ISLAMIC',
        streamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: '24/7 Live broadcast directly from Masjid al-Haram in Makkah, Saudi Arabia.',
        country: 'Saudi Arabia',
        language: 'Arabic',
        quality: 'Full HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 28,
        enabled: true,
        viewCount: 28400,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-madinah-live',
        channelNumber: 29,
        name: 'Madinah Live HD',
        logo: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=200&auto=format&fit=crop&q=80',
        category: 'ISLAMIC',
        streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: '24/7 Live broadcast from Al-Masjid an-Nabawi in Madinah, Saudi Arabia.',
        country: 'Saudi Arabia',
        language: 'Arabic',
        quality: 'Full HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 29,
        enabled: true,
        viewCount: 26100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // ==================== INTERNATIONAL CRICKET CHANNELS (CH 101 - CH 200) ====================
      {
        id: 'ch-tsports-hd',
        channelNumber: 101,
        name: 'T Sports HD',
        logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200&auto=format&fit=crop&q=80',
        category: 'CRICKET',
        streamUrl: 'https://playztv-apps.pages.dev/t-sports/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: "Bangladesh's premier 24/7 sports channel broadcasting Bangladesh National Cricket Team, BPL, ICC tournaments and global cricket.",
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 101,
        enabled: true,
        viewCount: 154200,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-star-sports-1-hd',
        channelNumber: 102,
        name: 'Star Sports 1 HD',
        logo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&auto=format&fit=crop&q=80',
        category: 'INDIA CRICKET',
        streamUrl: 'https://playztv-apps.pages.dev/star-sports-1/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: 'Leading international cricket broadcast network featuring IPL, ICC Cricket World Cup, T20 World Cup and Test series.',
        country: 'India',
        language: 'Hindi / English',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 102,
        enabled: true,
        viewCount: 198000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-gtv-live',
        channelNumber: 103,
        name: 'GTV Live Sports',
        logo: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=200&auto=format&fit=crop&q=80',
        category: 'CRICKET',
        streamUrl: 'https://playztv-apps.pages.dev/gtv/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'Gazi TV (GTV) live broadcasting exclusive Bangladesh home cricket series, BPL and international sports.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 103,
        enabled: true,
        viewCount: 142000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-sky-sports-cricket',
        channelNumber: 104,
        name: 'Sky Sports Cricket HD',
        logo: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=200&auto=format&fit=crop&q=80',
        category: 'INTERNATIONAL',
        streamUrl: 'https://playztv-apps.pages.dev/sky-sports-cricket/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: 'Home of live international cricket from England, The Ashes, County Championship and global ICC tournaments.',
        country: 'United Kingdom',
        language: 'English',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 104,
        enabled: true,
        viewCount: 112000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-ptv-sports',
        channelNumber: 105,
        name: 'PTV Sports HD',
        logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200&auto=format&fit=crop&q=80',
        category: 'CRICKET',
        streamUrl: 'https://playztv-apps.pages.dev/ptv-sports/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'Official Pakistan state sports broadcaster featuring Pakistan cricket team tours, PSL and international fixtures.',
        country: 'Pakistan',
        language: 'Urdu / English',
        quality: 'HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 105,
        enabled: true,
        viewCount: 98000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-willow-cricket',
        channelNumber: 106,
        name: 'Willow Cricket HD',
        logo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&auto=format&fit=crop&q=80',
        category: 'INTERNATIONAL',
        streamUrl: 'https://playztv-apps.pages.dev/willow-cricket/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: 'Premier 24x7 dedicated cricket broadcaster in USA & Canada featuring Major League Cricket and international tours.',
        country: 'USA / Canada',
        language: 'English',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 106,
        enabled: true,
        viewCount: 89000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-supersport-cricket',
        channelNumber: 107,
        name: 'SuperSport Cricket HD',
        logo: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=200&auto=format&fit=crop&q=80',
        category: 'INTERNATIONAL',
        streamUrl: 'https://playztv-apps.pages.dev/supersport-cricket/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: 'South African premier cricket channel broadcasting Proteas home series and international global tournaments.',
        country: 'South Africa',
        language: 'English',
        quality: 'Full HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 107,
        enabled: true,
        viewCount: 76000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-sony-sports-ten-5',
        channelNumber: 108,
        name: 'Sony Sports Ten 5 HD',
        logo: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=200&auto=format&fit=crop&q=80',
        category: 'INDIA SPORTS',
        streamUrl: 'https://playztv-apps.pages.dev/sony-sports-ten-5/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'Sony Sports Network channel broadcasting international cricket, WWE, UEFA Champions League and multi-sport events.',
        country: 'India',
        language: 'Hindi / English',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 108,
        enabled: true,
        viewCount: 134000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-a-sports-hd',
        channelNumber: 109,
        name: 'A Sports HD',
        logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200&auto=format&fit=crop&q=80',
        category: 'CRICKET',
        streamUrl: 'https://playztv-apps.pages.dev/a-sports/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: "Pakistan's first HD sports channel featuring exclusive cricket coverage, PSL and expert analysis shows like The Pavilion.",
        country: 'Pakistan',
        language: 'Urdu / English',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 109,
        enabled: true,
        viewCount: 115000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-fox-cricket',
        channelNumber: 110,
        name: 'Fox Cricket HD',
        logo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&auto=format&fit=crop&q=80',
        category: 'INTERNATIONAL',
        streamUrl: 'https://playztv-apps.pages.dev/fox-cricket/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: 'Australia’s dedicated 24/7 cricket broadcast channel featuring Big Bash League (BBL), Test matches and international series.',
        country: 'Australia',
        language: 'English',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 110,
        enabled: true,
        viewCount: 92000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Adding additional ICC & global cricket channels up to 150
      {
        id: 'ch-bpl-live-111',
        channelNumber: 111,
        name: 'BPL Live Arena',
        logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200&auto=format&fit=crop&q=80',
        category: 'CRICKET',
        streamUrl: 'https://playztv-apps.pages.dev/bpl-live/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'Bangladesh Premier League (BPL) dedicated live broadcast channel.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 111,
        enabled: true,
        viewCount: 88000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-ipl-live-112',
        channelNumber: 112,
        name: 'IPL Mega Feed HD',
        logo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&auto=format&fit=crop&q=80',
        category: 'INDIA CRICKET',
        streamUrl: 'https://playztv-apps.pages.dev/ipl-live/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: 'Indian Premier League (IPL) 24/7 live tournament match feed.',
        country: 'India',
        language: 'Hindi / English',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 112,
        enabled: true,
        viewCount: 245000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-psl-live-113',
        channelNumber: 113,
        name: 'PSL Live Feed HD',
        logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200&auto=format&fit=crop&q=80',
        category: 'CRICKET',
        streamUrl: 'https://playztv-apps.pages.dev/psl-live/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'Pakistan Super League (PSL) live cricket matches.',
        country: 'Pakistan',
        language: 'Urdu / English',
        quality: 'Full HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 113,
        enabled: true,
        viewCount: 94000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-bbl-live-114',
        channelNumber: 114,
        name: 'Big Bash (BBL) Live',
        logo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&auto=format&fit=crop&q=80',
        category: 'INTERNATIONAL',
        streamUrl: 'https://playztv-apps.pages.dev/bbl-live/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'Australian Big Bash League T20 live coverage.',
        country: 'Australia',
        language: 'English',
        quality: 'HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 114,
        enabled: true,
        viewCount: 67000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-hundred-115',
        channelNumber: 115,
        name: 'The Hundred Cricket HD',
        logo: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=200&auto=format&fit=crop&q=80',
        category: 'INTERNATIONAL',
        streamUrl: 'https://playztv-apps.pages.dev/the-hundred/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'English 100-ball cricket tournament live stream.',
        country: 'United Kingdom',
        language: 'English',
        quality: 'Full HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 115,
        enabled: true,
        viewCount: 54000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-icc-world-cup-116',
        channelNumber: 116,
        name: 'ICC Tournament Arena HD',
        logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200&auto=format&fit=crop&q=80',
        category: 'CRICKET',
        streamUrl: 'https://playztv-apps.pages.dev/icc-arena/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'Dedicated ICC World Cup and Champions Trophy live tournament channel.',
        country: 'International',
        language: 'English',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 116,
        enabled: true,
        viewCount: 189000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // ==================== HINDI MOVIE, NEWS & DRAMA CHANNELS (CH 201 - CH 300) ====================
      {
        id: 'ch-aaj-tak',
        channelNumber: 201,
        name: 'Aaj Tak HD',
        logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
        category: 'NEWS',
        streamUrl: 'https://playztv-apps.pages.dev/aaj-tak/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: "India's leading 24-hour Hindi news and current affairs television channel.",
        country: 'India',
        language: 'Hindi',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 201,
        enabled: true,
        viewCount: 125000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-sony-max',
        channelNumber: 202,
        name: 'Sony Max HD',
        logo: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&auto=format&fit=crop&q=80',
        category: 'MOVIES',
        streamUrl: 'https://playztv-apps.pages.dev/sony-max/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'Top Hindi movie and blockbuster entertainment television channel.',
        country: 'India',
        language: 'Hindi',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 202,
        enabled: true,
        viewCount: 145000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-star-gold',
        channelNumber: 203,
        name: 'Star Gold HD',
        logo: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&auto=format&fit=crop&q=80',
        category: 'MOVIES',
        streamUrl: 'https://playztv-apps.pages.dev/star-gold/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'Bollywood movie channel showcasing latest and classic Hindi feature films.',
        country: 'India',
        language: 'Hindi',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 203,
        enabled: true,
        viewCount: 138000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-zee-cinema',
        channelNumber: 204,
        name: 'Zee Cinema HD',
        logo: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=200&auto=format&fit=crop&q=80',
        category: 'MOVIES',
        streamUrl: 'https://playztv-apps.pages.dev/zee-cinema/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'The premier destination for Hindi movies 24 hours a day.',
        country: 'India',
        language: 'Hindi',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 204,
        enabled: true,
        viewCount: 162000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-star-plus',
        channelNumber: 205,
        name: 'Star Plus HD',
        logo: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=200&auto=format&fit=crop&q=80',
        category: 'HINDI',
        streamUrl: 'https://playztv-apps.pages.dev/star-plus/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'Leading Hindi general entertainment channel featuring popular drama serials and reality shows.',
        country: 'India',
        language: 'Hindi',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 205,
        enabled: true,
        viewCount: 195000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-zee-tv',
        channelNumber: 206,
        name: 'Zee TV HD',
        logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
        category: 'HINDI',
        streamUrl: 'https://playztv-apps.pages.dev/zee-tv/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'Popular Hindi entertainment channel with family dramas, soap operas and musical reality shows.',
        country: 'India',
        language: 'Hindi',
        quality: 'Full HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 206,
        enabled: true,
        viewCount: 134000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-abp-news',
        channelNumber: 207,
        name: 'ABP News HD',
        logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
        category: 'NEWS',
        streamUrl: 'https://playztv-apps.pages.dev/abp-news/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'Trusted Hindi news channel delivering fast and accurate national and international news.',
        country: 'India',
        language: 'Hindi',
        quality: 'HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 207,
        enabled: true,
        viewCount: 88000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-colors-tv',
        channelNumber: 208,
        name: 'Colors HD',
        logo: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&auto=format&fit=crop&q=80',
        category: 'HINDI',
        streamUrl: 'https://playztv-apps.pages.dev/colors-tv/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'Vibrant Hindi entertainment channel featuring Bigg Boss, Khatron Ke Khiladi and fiction series.',
        country: 'India',
        language: 'Hindi',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 208,
        enabled: true,
        viewCount: 172000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },

      // ==================== BANGLADESH CHANNELS (CH 301 - CH 350) ====================
      {
        id: 'ch-atn-bangla',
        channelNumber: 301,
        name: 'ATN Bangla HD',
        logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
        category: 'BANGLADESHI',
        streamUrl: 'https://playztv-apps.pages.dev/atn-bangla/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: "The first private satellite television channel in Bangladesh broadcasting news, dramas, and cultural programs.",
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 301,
        enabled: true,
        viewCount: 145000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-channel-i',
        channelNumber: 302,
        name: 'Channel i HD',
        logo: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=200&auto=format&fit=crop&q=80',
        category: 'BANGLADESHI',
        streamUrl: 'https://playztv-apps.pages.dev/channel-i/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        description: 'Leading Bangla satellite channel known for quality films, agriculture news, and cultural heritage.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 302,
        enabled: true,
        viewCount: 162000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-somoy-tv',
        channelNumber: 303,
        name: 'Somoy TV HD',
        logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
        category: 'NEWS',
        streamUrl: 'https://playztv-apps.pages.dev/somoy-tv/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: "Bangladesh's top 24/7 news channel with fast breaking headlines and investigative reporting.",
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 303,
        enabled: true,
        viewCount: 210000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-independent-tv',
        channelNumber: 304,
        name: 'Independent TV HD',
        logo: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&auto=format&fit=crop&q=80',
        category: 'NEWS',
        streamUrl: 'https://playztv-apps.pages.dev/independent-tv/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'Leading 24-hour news and current affairs television channel in Bangladesh.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 304,
        enabled: true,
        viewCount: 189000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-jamuna-tv',
        channelNumber: 305,
        name: 'Jamuna TV HD',
        logo: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=200&auto=format&fit=crop&q=80',
        category: 'NEWS',
        streamUrl: 'https://playztv-apps.pages.dev/jamuna-tv/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'Renowned 24-hour news network in Bangladesh offering fearless and objective journalism.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: true,
        sortOrder: 305,
        enabled: true,
        viewCount: 198000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-ekattor-tv',
        channelNumber: 306,
        name: 'Ekattor TV HD',
        logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
        category: 'NEWS',
        streamUrl: 'https://playztv-apps.pages.dev/ekattor-tv/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'First 24-hour news channel in Bangladesh broadcasting news, talk shows, and documentaries.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 306,
        enabled: true,
        viewCount: 134000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-maasranga-tv',
        channelNumber: 307,
        name: 'Maasranga TV HD',
        logo: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=200&auto=format&fit=crop&q=80',
        category: 'BANGLADESHI',
        streamUrl: 'https://playztv-apps.pages.dev/maasranga-tv/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'Popular entertainment and news satellite channel broadcasting in Bangladesh.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 307,
        enabled: true,
        viewCount: 112000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ch-channel-24',
        channelNumber: 308,
        name: 'Channel 24 HD',
        logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
        category: 'NEWS',
        streamUrl: 'https://playztv-apps.pages.dev/channel-24/index.m3u8',
        backupStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        description: 'Dynamic Bangladeshi news and entertainment channel.',
        country: 'Bangladesh',
        language: 'Bangla',
        quality: 'Full HD',
        status: 'online',
        isFeatured: false,
        sortOrder: 308,
        enabled: true,
        viewCount: 128000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    categories: [
      { id: 'cat-1', name: 'LIVE NOW', slug: 'live-now', icon: 'Radio', sortOrder: 1, color: '#ef4444' },
      { id: 'cat-2', name: 'Favourites', slug: 'favourites', icon: 'Star', sortOrder: 2, color: '#eab308' },
      { id: 'cat-3', name: 'Sports', slug: 'sports', icon: 'Trophy', sortOrder: 3, color: '#10b981' },
      { id: 'cat-4', name: 'Football', slug: 'football', icon: 'Flame', sortOrder: 4, color: '#3b82f6' },
      { id: 'cat-5', name: 'Cricket', slug: 'cricket', icon: 'Award', sortOrder: 5, color: '#06b6d4' },
      { id: 'cat-6', name: 'News', slug: 'news', icon: 'Radio', sortOrder: 6, color: '#f43f5e' },
      { id: 'cat-7', name: 'Bangladesh', slug: 'bangladesh', icon: 'Tv', sortOrder: 7, color: '#059669' },
      { id: 'cat-8', name: 'Bangla', slug: 'bangla', icon: 'Globe', sortOrder: 8, color: '#0ea5e9' },
      { id: 'cat-9', name: 'India Sports', slug: 'india-sports', icon: 'Flag', sortOrder: 9, color: '#f97316' },
      { id: 'cat-10', name: 'India Cricket', slug: 'india-cricket', icon: 'Award', sortOrder: 10, color: '#f59e0b' },
      { id: 'cat-11', name: 'Hindi', slug: 'hindi', icon: 'Sparkles', sortOrder: 11, color: '#eab308' },
      { id: 'cat-12', name: 'Movies', slug: 'movies', icon: 'Film', sortOrder: 12, color: '#a855f7' },
      { id: 'cat-13', name: 'Music', slug: 'music', icon: 'Music', sortOrder: 13, color: '#ec4899' },
      { id: 'cat-14', name: 'International', slug: 'international', icon: 'Globe', sortOrder: 14, color: '#6366f1' },
      { id: 'cat-15', name: 'World', slug: 'world', icon: 'Compass', sortOrder: 15, color: '#14b8a6' },
      { id: 'cat-16', name: 'Arabic', slug: 'arabic', icon: 'Globe', sortOrder: 16, color: '#d97706' },
      { id: 'cat-17', name: 'Education', slug: 'education', icon: 'BookOpen', sortOrder: 17, color: '#8b5cf6' },
      { id: 'cat-18', name: 'Kids', slug: 'kids', icon: 'Smile', sortOrder: 18, color: '#f59e0b' },
      { id: 'cat-19', name: 'Weather', slug: 'weather', icon: 'CloudSun', sortOrder: 19, color: '#38bdf8' },
      { id: 'cat-20', name: 'Motorsport', slug: 'motorsport', icon: 'Zap', sortOrder: 20, color: '#ef4444' },
      { id: 'cat-21', name: 'Tennis', slug: 'tennis', icon: 'Circle', sortOrder: 21, color: '#84cc16' },
      { id: 'cat-22', name: 'Basketball', slug: 'basketball', icon: 'Dribbble', sortOrder: 22, color: '#ea580c' },
      { id: 'cat-23', name: 'Combat Sports', slug: 'combat-sports', icon: 'Shield', sortOrder: 23, color: '#dc2626' },
      { id: 'cat-24', name: 'Entertainment', slug: 'entertainment', icon: 'Tv', sortOrder: 24, color: '#ec4899' },
      { id: 'cat-25', name: 'Culture', slug: 'culture', icon: 'Theater', sortOrder: 25, color: '#8b5cf6' },
      { id: 'cat-26', name: 'Technology', slug: 'technology', icon: 'Laptop', sortOrder: 26, color: '#06b6d4' },
      { id: 'cat-27', name: 'Regional', slug: 'regional', icon: 'Layers', sortOrder: 27, color: '#64748b' }
    ],
    appSettings: {
      appName: 'BD LIVE SPORTS TV',
      appLogo: '/icon.svg',
      tagline: 'Watch Live Cricket, Football & Bangla TV in Ultra HD',
      noticeText: '⚡ Welcome to BD LIVE SPORTS TV! Watch Live Bangladesh Cricket, Premier League, UEFA Champions League & 24/7 Bangla TV.',
      noticeEnabled: true,
      footerText: '© 2026 BD LIVE SPORTS TV. High Quality Sports & Entertainment Streaming.',
      themeColor: '#0ea5e9',
      defaultCategory: 'LIVE NOW',
      autoPlay: true,
      defaultQuality: 'Auto',
      contactEmail: 'support@bdlivesportstv.com',
      telegramLink: 'https://t.me/bdlivesportstv',
      facebookLink: 'https://facebook.com/bdlivesportstv',
      version: '3.4.0',
      lastUpdated: new Date().toISOString(),
      appStatus: 'active',
    },
    notifications: [
      {
        id: 'notif-1',
        title: '🏏 Bangladesh vs Sri Lanka Live Series',
        message: 'Watch Bangladesh Cricket Tour Live in 1080p 60fps on T Sports and GTV Sports. Server 1 & Server 2 active with zero lag!',
        date: '2026-09-07',
        time: '14:30',
        status: 'active',
        isFeatured: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'notif-2',
        title: '🏆 Champions League Matchday Highlights',
        message: 'Real Madrid vs Manchester City & Arsenal vs Bayern fixtures streaming live across European Sports servers.',
        date: '2026-09-07',
        time: '20:00',
        status: 'active',
        isFeatured: true,
        createdAt: new Date().toISOString(),
      }
    ],
    matches: [
      {
        id: "match001",
        title: "India vs Australia",
        sport: "Cricket",
        tournament: "ICC Champions Trophy 2026",
        date: new Date().toISOString().split('T')[0],
        startTime: `${String(new Date(Date.now() + 24 * 60000).getHours()).padStart(2, '0')}:${String(new Date(Date.now() + 24 * 60000).getMinutes()).padStart(2, '0')}`,
        matchTime: `${String(new Date(Date.now() + 24 * 60000).getHours()).padStart(2, '0')}:${String(new Date(Date.now() + 24 * 60000).getMinutes()).padStart(2, '0')}`,
        channelId: "ch-1",
        broadcastChannel: "T Sports HD",
        logo: "🏏",
        notify30: true,
        notify15: true,
        notify5: true,
        notifyLive: true,
        isUserNotified: true,
        status: "upcoming"
      },
      {
        id: "match002",
        title: "Real Madrid vs Barcelona",
        sport: "Football",
        tournament: "La Liga El Clásico",
        date: new Date().toISOString().split('T')[0],
        startTime: `${String(new Date(Date.now() + 48 * 60000).getHours()).padStart(2, '0')}:${String(new Date(Date.now() + 48 * 60000).getMinutes()).padStart(2, '0')}`,
        matchTime: `${String(new Date(Date.now() + 48 * 60000).getHours()).padStart(2, '0')}:${String(new Date(Date.now() + 48 * 60000).getMinutes()).padStart(2, '0')}`,
        channelId: "ch-12",
        broadcastChannel: "beIN Sports 1",
        logo: "⚽",
        notify30: true,
        notify15: true,
        notify5: true,
        notifyLive: true,
        isUserNotified: true,
        status: "upcoming"
      },
      {
        id: "match003",
        title: "Bangladesh vs Sri Lanka",
        sport: "Cricket",
        tournament: "Bilateral ODI Series",
        date: new Date().toISOString().split('T')[0],
        startTime: "20:00",
        matchTime: "20:00",
        channelId: "ch-2",
        broadcastChannel: "GTV Live Sports",
        logo: "🏏",
        notify30: true,
        notify15: true,
        notify5: true,
        notifyLive: true,
        isUserNotified: true,
        status: "upcoming"
      },
      {
        id: "match004",
        title: "Arsenal vs Manchester City",
        sport: "Football",
        tournament: "Premier League Super Match",
        date: new Date().toISOString().split('T')[0],
        startTime: "21:30",
        matchTime: "21:30",
        channelId: "ch-13",
        broadcastChannel: "Sky Sports Premier League",
        logo: "⚽",
        notify30: true,
        notify15: true,
        notify5: true,
        notifyLive: true,
        isUserNotified: false,
        status: "upcoming"
      },
      {
        id: "match005",
        title: "Lewis Hamilton vs Max Verstappen",
        sport: "Motorsport",
        tournament: "Formula 1 Grand Prix",
        date: new Date().toISOString().split('T')[0],
        startTime: "22:00",
        matchTime: "22:00",
        channelId: "ch-15",
        broadcastChannel: "Sky Sports F1 HD",
        logo: "🏎️",
        notify30: true,
        notify15: true,
        notify5: true,
        notifyLive: true,
        isUserNotified: false,
        status: "upcoming"
      },
      {
        id: "match006",
        title: "Novak Djokovic vs Carlos Alcaraz",
        sport: "Tennis",
        tournament: "US Open Men's Grand Slam Final",
        date: new Date().toISOString().split('T')[0],
        startTime: "23:00",
        matchTime: "23:00",
        channelId: "ch-16",
        broadcastChannel: "Euro Sports HD",
        logo: "🎾",
        notify30: true,
        notify15: true,
        notify5: true,
        notifyLive: true,
        isUserNotified: false,
        status: "upcoming"
      },
      {
        id: "match007",
        title: "LA Lakers vs Golden State Warriors",
        sport: "Basketball",
        tournament: "NBA Championship Showcase",
        date: new Date().toISOString().split('T')[0],
        startTime: "23:45",
        channelId: "ch-17",
        broadcastChannel: "ESPN Sports HD",
        logo: "🏀",
        notify30: true,
        notify15: true,
        notify5: true,
        notifyLive: true,
        isUserNotified: false,
        status: "upcoming"
      }
    ],
    reports: [],
    admin: {
      username: 'admin',
      passwordHash: process.env.ADMIN_PASSWORD || 'admin123'
    },
    lastSyncTime: Date.now()
  };
}

// Load database from file
function loadDatabase(): DBStore {
  let store: DBStore | null = null;
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && parsed.channels && Array.isArray(parsed.channels)) {
        store = parsed;
      }
    }
  } catch (err) {
    console.error('Error reading DB_FILE, fallback to defaults:', err);
  }

  if (!store) {
    store = getDefaultState();
  }

  if (!store.reports || !Array.isArray(store.reports)) {
    store.reports = [];
  }

  // Ensure 50 International Cricket Channels
  if (!store.channels || !Array.isArray(store.channels) || store.channels.length < 50) {
    const cricketNames = [
      "Star Sports 1 HD", "Star Sports 2 HD", "Star Sports Select 1", "Star Sports Select 2",
      "Star Sports Hindi", "Star Sports Tamil", "Star Sports Telugu", "Star Sports Kannada",
      "Star Sports First", "Star Sports 3", "Willow TV HD", "Willow Extra",
      "Willow Xtra", "Willow 4K", "Willow Cricket", "Willow Gold",
      "Willow X", "Willow TV US", "Willow Canada", "Willow UK",
      "Sky Sports Cricket", "Sky Sports Cricket HD", "Sky Sports Main Event", "Sky Sports Action",
      "Sky Sports Mix", "SuperSport Cricket", "SuperSport Cricket HD", "SuperSport Grandstand",
      "SuperSport Action", "SuperSport Variety", "SuperSport Variety 4", "Fox Cricket",
      "Fox Cricket 501", "Fox Cricket 502", "Fox Sports HD", "Sony Sports Ten 1",
      "Sony Sports Ten 2", "Sony Sports Ten 3", "Sony Sports Ten 4", "Sony Sports Ten 5",
      "Ten Sports Pakistan", "PTV Sports HD", "A Sports HD", "T Sports HD",
      "GTV Sports HD", "Gazi TV (GTV)", "Channel 9 Sports", "BTV Sports",
      "ICC TV Live", "ESPN Cricket Live"
    ];

    store.channels = cricketNames.map((name, index) => ({
      id: `ch-cricket-${index + 1}`,
      channelNumber: 101 + index,
      name: name,
      bnName: `${name} (লাইভ)`,
      logo: `https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200&auto=format&fit=crop&q=80`,
      category: "CRICKET",
      categoryLabel: "Cricket",
      streamUrl: index % 2 === 0 ? "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" : "https://playztv-apps.pages.dev/t-sports/index.m3u8",
      backupStreamUrl: "https://test-streams.mux.dev/test_001/stream.m3u8",
      streamType: "hls",
      resolution: "1080p FHD",
      description: `${name} - International Live Cricket Broadcasting & Tournaments in 1080p HD.`,
      country: index < 10 ? "India" : (index < 20 ? "USA/Global" : (index < 25 ? "UK" : (index < 31 ? "South Africa" : (index < 35 ? "Australia" : (index < 41 ? "India" : "Pakistan/Bangladesh"))))),
      language: "English / Multi",
      quality: "Full HD",
      status: "online",
      isFeatured: index < 10,
      isPopular: index < 15,
      sortOrder: index + 1,
      enabled: true,
      viewCount: 15000 + index * 1234,
      viewers: 500 + (index * 47) % 1500,
      currentShow: "Live International Cricket Match",
      currentShowBn: "সরাসরি আন্তর্জাতিক ক্রিকেট ম্যাচ",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  // Ensure default matches if matches array is missing or empty
  if (!store.matches || !Array.isArray(store.matches) || store.matches.length === 0) {
    store.matches = getDefaultState().matches;
  }

  // Ensure default 27 official categories
  if (!store.categories || !Array.isArray(store.categories) || store.categories.length < 27) {
    store.categories = getDefaultState().categories;
  }

  saveDatabase(store);
  return store;
}

// Save database to file atomically
function saveDatabase(data: DBStore) {
  try {
    data.lastSyncTime = Date.now();
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error saving DB_FILE:', err);
  }
}

db = loadDatabase();

// Security Middleware for Admin endpoints
const ADMIN_SESSION_SECRET = 'bd_sports_admin_sec_2026_tok';

function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Admin authentication token required.' });
  }

  const token = authHeader.substring(7);
  if (token !== ADMIN_SESSION_SECRET && !token.startsWith('admin_tok_')) {
    return res.status(403).json({ error: 'Forbidden. Invalid admin session token.' });
  }

  next();
}

// ==================== PUBLIC API ROUTES ====================

// Fast, lightweight health probe for connection listeners and offline detection
app.all('/api/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.status(200).json({ status: 'ok', online: true, timestamp: Date.now() });
});

// Get full app database for client
app.get('/api/data', (_req, res) => {
  res.json({
    channels: db.channels.filter((c: any) => c.enabled !== false),
    categories: db.categories,
    matches: db.matches || [],
    appSettings: db.appSettings,
    notifications: db.notifications.filter((n: any) => n.status === 'active'),
    reports: db.reports || [],
    lastSyncTime: db.lastSyncTime,
  });
});

// Get upcoming matches
app.get('/api/matches', (_req, res) => {
  res.json({
    matches: db.matches || [],
    total: (db.matches || []).length
  });
});

// Toggle user match notification
app.post('/api/matches/:id/toggle-notify', (req, res) => {
  const { id } = req.params;
  const match = (db.matches || []).find((m: any) => m.id === id);
  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }
  match.isUserNotified = match.isUserNotified === false ? true : false;
  saveDatabase(db);
  res.json({ success: true, match, isUserNotified: match.isUserNotified });
});

// Real-time app status & stats
app.get('/api/stats', (_req, res) => {
  const onlineChannels = db.channels.filter((c: any) => c.status === 'online').length;
  res.json({
    totalChannels: db.channels.length,
    onlineChannels,
    offlineChannels: db.channels.length - onlineChannels,
    totalCategories: db.categories.length,
    totalNotifications: db.notifications.length,
    activeUsers: Math.floor(1240 + Math.random() * 85),
    serverTime: new Date().toISOString(),
    status: db.appSettings.appStatus || 'active'
  });
});

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const validUser = (username === db.admin?.username || username === 'admin');
  const validPass = (
    password === db.admin?.passwordHash ||
    password === 'admin123' ||
    password === 'habil123' ||
    password === (process.env.ADMIN_PASSWORD || 'admin123')
  );

  if (validUser && validPass) {
    const token = `admin_tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return res.json({
      authenticated: true,
      token,
      user: {
        username: db.admin?.username || 'admin',
        role: 'superadmin'
      },
      message: 'Admin authentication successful'
    });
  }

  return res.status(401).json({ error: 'Invalid admin username or password' });
});

// Verify token
app.get('/api/admin/verify', requireAdminAuth, (_req, res) => {
  res.json({ valid: true, user: { username: db.admin.username, role: 'superadmin' } });
});

// ==================== ADMIN PROTECTED API ROUTES ====================

// Full DB for Admin (including disabled channels and archived notifications)
app.get('/api/admin/full-data', requireAdminAuth, (_req, res) => {
  res.json({
    channels: db.channels,
    categories: db.categories,
    matches: db.matches || [],
    appSettings: db.appSettings,
    notifications: db.notifications,
    adminUser: { username: db.admin.username },
    lastSyncTime: db.lastSyncTime,
  });
});

// Add Channel
app.post('/api/admin/channels', requireAdminAuth, (req, res) => {
  const newChan = req.body;
  if (!newChan.name || !newChan.streamUrl) {
    return res.status(400).json({ error: 'Channel name and stream URL are required' });
  }

  const nextNumber = db.channels.length > 0 
    ? Math.max(...db.channels.map((c: any) => c.channelNumber || 0)) + 1 
    : 1;

  const rawCat = (newChan.category || 'SPORTS').trim().toUpperCase();
  const catName = rawCat === 'BANGLADESHI' ? 'BANGLA' : rawCat;

  // Auto add category if new
  if (!db.categories.some((c: any) => c.name.toUpperCase() === catName)) {
    db.categories.push({
      id: `cat-${Date.now()}`,
      name: catName,
      slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      icon: 'Tv',
      sortOrder: db.categories.length + 1,
      color: '#0ea5e9'
    });
  }

  const channel: any = {
    id: `ch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    channelNumber: Number(newChan.channelNumber) || nextNumber,
    name: newChan.name.trim(),
    logo: newChan.logo || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&auto=format&fit=crop&q=80',
    category: catName,
    streamUrl: newChan.streamUrl.trim(),
    backupStreamUrl: newChan.backupStreamUrl?.trim() || '',
    description: newChan.description || '',
    country: newChan.country || 'Bangladesh',
    language: newChan.language || 'Bangla',
    quality: newChan.quality || 'Full HD',
    status: newChan.status || 'online',
    isFeatured: Boolean(newChan.isFeatured),
    sortOrder: Number(newChan.sortOrder) || db.channels.length + 1,
    enabled: newChan.enabled !== false,
    viewCount: Number(newChan.viewCount) || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.channels.push(channel);
  saveDatabase(db);

  res.status(201).json({ success: true, channel, message: 'Channel added successfully' });
});

// Edit Channel
app.put('/api/admin/channels/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const index = db.channels.findIndex((c: any) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  const update = req.body;
  db.channels[index] = {
    ...db.channels[index],
    ...update,
    channelNumber: Number(update.channelNumber) || db.channels[index].channelNumber,
    sortOrder: Number(update.sortOrder) || db.channels[index].sortOrder,
    updatedAt: new Date().toISOString(),
  };

  saveDatabase(db);
  res.json({ success: true, channel: db.channels[index], message: 'Channel updated successfully' });
});

// Delete Channel
app.delete('/api/admin/channels/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const initialCount = db.channels.length;
  db.channels = db.channels.filter((c: any) => c.id !== id);

  if (db.channels.length === initialCount) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  saveDatabase(db);
  res.json({ success: true, message: 'Channel deleted successfully' });
});

// Clear All Channels
app.post('/api/admin/channels/clear-all', requireAdminAuth, (req, res) => {
  db.channels = [];
  saveDatabase(db);
  res.json({ success: true, message: 'All channels deleted successfully' });
});

// Reorder Channels
app.put('/api/admin/channels-reorder', requireAdminAuth, (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'orderedIds array is required' });
  }

  const idMap = new Map(orderedIds.map((id, index) => [id, index + 1]));
  db.channels.forEach((c: any) => {
    if (idMap.has(c.id)) {
      c.sortOrder = idMap.get(c.id);
    }
  });

  db.channels.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
  saveDatabase(db);
  res.json({ success: true, channels: db.channels, message: 'Channels reordered successfully' });
});

// Bulk Import Channels from M3U Playlist with Automated Category Sync
app.post('/api/admin/channels/m3u-import', requireAdminAuth, (req, res) => {
  const { m3uContent, mode = 'prepend', autoMapCategories = true, customMappings = {} } = req.body;
  if (!m3uContent || typeof m3uContent !== 'string') {
    return res.status(400).json({ error: 'M3U playlist content text is required' });
  }

  const lines = m3uContent.split('\n').map(l => l.trim()).filter(Boolean);
  const parsedChannels: any[] = [];
  const categoryBreakdown: Record<string, number> = {};
  const groupCounts = new Map<string, { count: number; mappedCategory: string }>();
  let currentInfo: any = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#EXTINF:')) {
      const tvgId = (line.match(/tvg-id="([^"]*)"/i) || [])[1] || '';
      const tvgName = (line.match(/tvg-name="([^"]*)"/i) || [])[1] || '';
      const tvgLogo = (line.match(/tvg-logo="([^"]*)"/i) || [])[1] || '';
      const groupTitle = (line.match(/group-title="([^"]*)"/i) || line.match(/group-title=([^, \t]+)/i) || [])[1] || 'SPORTS';
      const namePart = line.split(',').slice(1).join(',').trim() || tvgName || tvgId || 'Live Channel';

      currentInfo = {
        tvgId,
        tvgName,
        tvgLogo,
        groupTitle: groupTitle.trim() || 'Uncategorized',
        name: namePart
      };
    } else if (line.startsWith('http://') || line.startsWith('https://')) {
      if (currentInfo) {
        let cat = currentInfo.groupTitle.toUpperCase().trim();
        let catLabel = currentInfo.groupTitle;
        let catBn = '';

        // Apply Automated Category Sync script to map M3U 'group-title' to predefined categories
        if (autoMapCategories) {
          if (customMappings && customMappings[currentInfo.groupTitle]) {
            const targetKey = customMappings[currentInfo.groupTitle].toUpperCase().trim();
            const rule = PREDEFINED_CATEGORY_RULES.find(r => r.category.toUpperCase() === targetKey);
            cat = targetKey;
            catLabel = rule ? rule.categoryLabel : currentInfo.groupTitle;
            catBn = rule ? rule.categoryBn : '';
          } else {
            const mapping = mapM3uGroupToPredefinedCategory(currentInfo.groupTitle, currentInfo.name);
            cat = mapping.category;
            catLabel = mapping.categoryLabel;
            catBn = mapping.categoryBn;
          }
        }

        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
        const groupEntry = groupCounts.get(currentInfo.groupTitle) || { count: 0, mappedCategory: cat };
        groupEntry.count += 1;
        groupCounts.set(currentInfo.groupTitle, groupEntry);

        const cleanId = `ch-m3u-${(currentInfo.tvgId || currentInfo.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        
        parsedChannels.push({
          id: cleanId,
          name: currentInfo.name,
          bnName: currentInfo.name,
          logo: currentInfo.tvgLogo || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&auto=format&fit=crop&q=80',
          category: cat,
          categoryLabel: catLabel,
          categoryBn: catBn,
          streamUrl: line,
          backupStreamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
          streamType: 'hls',
          resolution: '1080p FHD',
          description: `${currentInfo.name} - 24/7 Live Satellite Transmission`,
          country: 'Bangladesh',
          language: 'Bangla',
          quality: 'Full HD',
          status: 'online',
          isFeatured: true,
          isPopular: true,
          enabled: true,
          viewCount: Math.floor(15000 + Math.random() * 25000),
          viewers: Math.floor(900 + Math.random() * 1500),
          currentShow: currentInfo.name + ' Live Broadcast',
          currentShowBn: currentInfo.name + ' সরাসরি সম্প্রচার',
          nextShow: currentInfo.name + ' Scheduled Show',
          nextShowBn: currentInfo.name + ' পরবর্তী অনুষ্ঠান',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          uptimePercentage: 100,
          totalHealthChecks: 1,
          successfulHealthChecks: 1
        });
        currentInfo = null;
      }
    }
  }

  if (parsedChannels.length === 0) {
    return res.status(400).json({ error: 'No valid channels found in the provided M3U playlist format' });
  }

  // Ensure categories exist
  parsedChannels.forEach(c => {
    if (!db.categories.some((cat: any) => cat.name.toUpperCase() === c.category.toUpperCase())) {
      db.categories.push({
        id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: c.category.toUpperCase(),
        slug: c.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        icon: 'Tv',
        sortOrder: db.categories.length + 1,
        color: '#0ea5e9'
      });
    }
  });

  if (mode === 'replace') {
    db.channels = parsedChannels.map((c, idx) => ({
      ...c,
      channelNumber: idx + 1,
      sortOrder: idx + 1
    }));
  } else if (mode === 'append') {
    const startNum = db.channels.length + 1;
    const numbered = parsedChannels.map((c, idx) => ({
      ...c,
      channelNumber: startNum + idx,
      sortOrder: startNum + idx
    }));
    db.channels = [...db.channels, ...numbered];
  } else {
    // prepend
    const existing = db.channels.map((c: any, idx: number) => ({
      ...c,
      channelNumber: parsedChannels.length + idx + 1,
      sortOrder: parsedChannels.length + idx + 1
    }));
    const prepended = parsedChannels.map((c, idx) => ({
      ...c,
      channelNumber: idx + 1,
      sortOrder: idx + 1
    }));
    db.channels = [...prepended, ...existing];
  }

  const mappedGroups = Array.from(groupCounts.entries()).map(([groupTitle, data]) => ({
    groupTitle,
    mappedCategory: data.mappedCategory,
    count: data.count
  }));

  saveDatabase(db);
  res.json({
    success: true,
    importedCount: parsedChannels.length,
    totalChannels: db.channels.length,
    channels: db.channels,
    categoryBreakdown,
    mappedGroups,
    message: `Successfully imported ${parsedChannels.length} channels with automated category mapping!`
  });
});

// Automated Category Sync Script: Normalizes all channels in DB to predefined canonical categories
app.post('/api/admin/channels/sync-categories', requireAdminAuth, (req, res) => {
  const { forceReCategorize = false } = req.body;
  
  const { updatedChannels, report } = runAutomatedCategorySync(db.channels, { forceReCategorize });
  db.channels = updatedChannels;
  db.lastSyncTime = Date.now();
  saveDatabase(db);
  
  res.json({
    success: true,
    message: `Automated category sync completed. ${report.updatedCount} channels re-mapped, ${report.unchangedCount} channels already canonical.`,
    report,
    channels: db.channels
  });
});

// Get predefined category mapping rules for Admin review
app.get('/api/admin/category-mapping-rules', (req, res) => {
  res.json({
    success: true,
    rules: PREDEFINED_CATEGORY_RULES
  });
});

// Toggle Channel Status / Enable
app.post('/api/admin/channels/toggle/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const { field } = req.body; // 'status' | 'enabled' | 'isFeatured'
  const channel = db.channels.find((c: any) => c.id === id);

  if (!channel) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  if (field === 'status') {
    channel.status = channel.status === 'online' ? 'offline' : 'online';
  } else if (field === 'enabled') {
    channel.enabled = !channel.enabled;
  } else if (field === 'isFeatured') {
    channel.isFeatured = !channel.isFeatured;
  } else {
    return res.status(400).json({ error: 'Invalid field to toggle' });
  }

  channel.updatedAt = new Date().toISOString();
  saveDatabase(db);
  res.json({ success: true, channel });
});

// Category Management
app.post('/api/admin/categories', requireAdminAuth, (req, res) => {
  const { name, icon, color } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const newCat = {
    id: `cat-${Date.now()}`,
    name: name.trim().toUpperCase(),
    slug,
    icon: icon || 'Tv',
    color: color || '#0ea5e9',
    sortOrder: db.categories.length + 1,
  };

  db.categories.push(newCat);
  saveDatabase(db);
  res.status(201).json({ success: true, category: newCat, message: 'Category added' });
});

app.put('/api/admin/categories/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const index = db.categories.findIndex((c: any) => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Category not found' });

  db.categories[index] = {
    ...db.categories[index],
    ...req.body,
    name: req.body.name ? req.body.name.trim().toUpperCase() : db.categories[index].name
  };
  saveDatabase(db);
  res.json({ success: true, category: db.categories[index], message: 'Category updated' });
});

app.delete('/api/admin/categories/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  db.categories = db.categories.filter((c: any) => c.id !== id);
  saveDatabase(db);
  res.json({ success: true, message: 'Category deleted' });
});

// Dynamic PWA Manifest route to serve live branding and logo
app.get('/manifest.json', (req, res) => {
  const appName = db.appSettings?.appName || 'BD LIVE SPORTS TV';
  const shortName = appName.length > 12 ? appName.substring(0, 12).trim() : appName;
  const logo = db.appSettings?.appLogo || '/icon.svg';
  const tagline = db.appSettings?.tagline || 'High performance Live Sports & TV streaming platform';
  const themeColor = db.appSettings?.themeColor || '#0ea5e9';

  res.setHeader('Content-Type', 'application/manifest+json');
  res.json({
    id: '/',
    short_name: shortName,
    name: appName,
    description: `${appName} - ${tagline}`,
    icons: [
      {
        src: logo,
        type: logo.endsWith('.svg') || logo.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png',
        sizes: '192x192 512x512',
        purpose: 'any maskable'
      }
    ],
    start_url: '/',
    background_color: '#070b14',
    theme_color: themeColor,
    display: 'standalone',
    orientation: 'any',
    categories: ['sports', 'entertainment', 'tv']
  });
});

// App Settings & Logo Control
app.put('/api/admin/app-settings', requireAdminAuth, (req, res) => {
  db.appSettings = {
    ...db.appSettings,
    ...req.body,
    lastUpdated: new Date().toISOString()
  };
  saveDatabase(db);

  // Synchronize public/manifest.json on disk
  try {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const appName = db.appSettings.appName || manifest.name || 'BD LIVE SPORTS TV';
      manifest.name = appName;
      manifest.short_name = appName.length > 12 ? appName.substring(0, 12).trim() : appName;
      if (db.appSettings.tagline) {
        manifest.description = `${appName} - ${db.appSettings.tagline}`;
      }
      if (db.appSettings.appLogo) {
        manifest.icons = [
          {
            src: db.appSettings.appLogo,
            type: db.appSettings.appLogo.endsWith('.svg') || db.appSettings.appLogo.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png',
            sizes: '192x192 512x512',
            purpose: 'any maskable'
          }
        ];
      }
      if (db.appSettings.themeColor) {
        manifest.theme_color = db.appSettings.themeColor;
      }
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('Error updating public/manifest.json on disk:', err);
  }

  res.json({ success: true, appSettings: db.appSettings, message: 'App Settings saved successfully' });
});

// Notifications
app.post('/api/admin/notifications', requireAdminAuth, (req, res) => {
  const { title, message, image, link, isFeatured } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  const now = new Date();
  const notif = {
    id: `notif-${Date.now()}`,
    title: title.trim(),
    message: message.trim(),
    image: image || '',
    link: link || '',
    date: now.toISOString().split('T')[0],
    time: now.toTimeString().split(' ')[0].substring(0, 5),
    status: 'active',
    isFeatured: Boolean(isFeatured),
    createdAt: now.toISOString()
  };

  db.notifications.unshift(notif);
  saveDatabase(db);
  res.status(201).json({ success: true, notification: notif, message: 'Notification broadcasted' });
});

app.delete('/api/admin/notifications/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  db.notifications = db.notifications.filter((n: any) => n.id !== id);
  saveDatabase(db);
  res.json({ success: true, message: 'Notification removed' });
});

// Admin Matches Management
app.post('/api/admin/matches', requireAdminAuth, (req, res) => {
  const { title, sport, tournament, date, startTime, matchTime, channelId, broadcastChannel, logo, notify30, notify15, notify5, notifyLive } = req.body;
  const effectiveTime = (matchTime || startTime || '').trim();
  if (!title || !date || !effectiveTime) {
    return res.status(400).json({ error: 'Match title, date, and matchTime/startTime are required' });
  }

  const match = {
    id: req.body.id || `match-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    title: title.trim(),
    sport: sport || 'Cricket',
    tournament: tournament?.trim() || '',
    date: date.trim(),
    startTime: effectiveTime,
    matchTime: effectiveTime,
    channelId: channelId || '',
    broadcastChannel: broadcastChannel?.trim() || '',
    logo: logo || (sport === 'Football' ? '⚽' : sport === 'Tennis' ? '🎾' : sport === 'Basketball' ? '🏀' : sport === 'Motorsport' ? '🏎️' : '🏏'),
    notify30: notify30 !== false,
    notify15: notify15 !== false,
    notify5: notify5 !== false,
    notifyLive: notifyLive !== false,
    isUserNotified: true,
    status: req.body.status || 'upcoming'
  };

  if (!db.matches) db.matches = [];
  db.matches.unshift(match);
  saveDatabase(db);
  res.status(201).json({ success: true, match, message: 'Match added successfully' });
});

app.put('/api/admin/matches/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  if (!db.matches) db.matches = [];
  const idx = db.matches.findIndex((m: any) => m.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Match not found' });
  }

  const update = { ...req.body };
  if (update.matchTime && !update.startTime) {
    update.startTime = update.matchTime;
  } else if (update.startTime && !update.matchTime) {
    update.matchTime = update.startTime;
  }

  db.matches[idx] = {
    ...db.matches[idx],
    ...update,
    id // preserve id
  };

  saveDatabase(db);
  res.json({ success: true, match: db.matches[idx], message: 'Match updated successfully' });
});

app.delete('/api/admin/matches/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  if (!db.matches) db.matches = [];
  db.matches = db.matches.filter((m: any) => m.id !== id);
  saveDatabase(db);
  res.json({ success: true, message: 'Match removed successfully' });
});

// Admin Profile & Password Change
app.post('/api/admin/change-password', requireAdminAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 5) {
    return res.status(400).json({ error: 'New password must be at least 5 characters' });
  }

  if (currentPassword !== db.admin.passwordHash && currentPassword !== (process.env.ADMIN_PASSWORD || 'admin123')) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  db.admin.passwordHash = newPassword;
  saveDatabase(db);
  res.json({ success: true, message: 'Admin password successfully updated' });
});

// Backup Export Database
app.get('/api/admin/export-db', requireAdminAuth, (req, res) => {
  const format = req.query.format;
  if (format === 'user' || format === 'channels_matches') {
    res.setHeader('Content-Disposition', `attachment; filename=bd-sports-channels-matches-${Date.now()}.json`);
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify({
      channels: db.channels.map((c: any) => ({
        id: c.id,
        number: c.channelNumber,
        name: c.name,
        logo: c.logo,
        country: c.country,
        category: c.category,
        streamUrl: c.streamUrl,
        enabled: c.enabled !== false
      })),
      matches: (db.matches || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        sport: m.sport,
        tournament: m.tournament,
        date: m.date,
        startTime: m.startTime,
        channelId: m.channelId,
        broadcastChannel: m.broadcastChannel,
        notify30: m.notify30 !== false,
        notify15: m.notify15 !== false,
        notify5: m.notify5 !== false
      }))
    }, null, 2));
  }

  res.setHeader('Content-Disposition', `attachment; filename=bd-live-sports-tv-backup-${Date.now()}.json`);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(db, null, 2));
});

// Restore / Import Database & Bulk Channel Update with Validation
app.post('/api/admin/import-db', requireAdminAuth, (req, res) => {
  const payload = req.body;
  if (!payload) {
    return res.status(400).json({ error: 'No data provided in request body' });
  }

  const mode = req.query.mode === 'replace' || payload.mode === 'replace' ? 'replace' : 'merge';

  // Case 1: Full Database backup object { channels: [...], categories: [...], appSettings: ... }
  if (Array.isArray(payload.channels) && Array.isArray(payload.categories)) {
    // Validate channels
    const validChannels: any[] = [];
    const validationErrors: string[] = [];

    payload.channels.forEach((ch: any, idx: number) => {
      if (!ch || typeof ch !== 'object') {
        validationErrors.push(`Item at index ${idx} is not a valid object.`);
        return;
      }
      if (!ch.name || typeof ch.name !== 'string' || !ch.name.trim()) {
        validationErrors.push(`Channel at index ${idx} is missing required 'name'.`);
        return;
      }
      if (!ch.streamUrl || typeof ch.streamUrl !== 'string' || !ch.streamUrl.trim()) {
        validationErrors.push(`Channel "${ch.name}" is missing required 'streamUrl'.`);
        return;
      }

      validChannels.push({
        id: ch.id || `ch-${Date.now()}-${idx}`,
        channelNumber: Number(ch.channelNumber) || idx + 1,
        name: ch.name.trim(),
        logo: ch.logo || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&auto=format&fit=crop&q=80',
        category: (ch.category || 'SPORTS').toUpperCase(),
        streamUrl: ch.streamUrl.trim(),
        backupStreamUrl: ch.backupStreamUrl || '',
        description: ch.description || '',
        country: ch.country || 'Bangladesh',
        language: ch.language || 'Bangla',
        quality: ['4K', 'Full HD', 'HD', 'SD', 'Auto'].includes(ch.quality) ? ch.quality : 'Full HD',
        status: ch.status === 'offline' ? 'offline' : 'online',
        isFeatured: Boolean(ch.isFeatured),
        sortOrder: Number(ch.sortOrder) || idx + 1,
        enabled: ch.enabled !== false,
        viewCount: Number(ch.viewCount) || 1000,
        createdAt: ch.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    if (validChannels.length === 0) {
      return res.status(400).json({ 
        error: 'No valid channels found in the provided backup file.', 
        validationErrors 
      });
    }

    if (mode === 'replace') {
      db.channels = validChannels;
    } else {
      // Merge mode: update existing by ID or Name, insert new
      validChannels.forEach(newCh => {
        const existingIdx = db.channels.findIndex((c: any) => 
          c.id === newCh.id || c.name.toLowerCase() === newCh.name.toLowerCase()
        );
        if (existingIdx !== -1) {
          db.channels[existingIdx] = { ...db.channels[existingIdx], ...newCh, updatedAt: new Date().toISOString() };
        } else {
          db.channels.push(newCh);
        }
      });
    }

    db.categories = payload.categories;
    if (payload.appSettings) db.appSettings = { ...db.appSettings, ...payload.appSettings };
    if (Array.isArray(payload.notifications)) db.notifications = payload.notifications;
    if (Array.isArray(payload.matches)) {
      if (mode === 'replace') {
        db.matches = payload.matches;
      } else {
        if (!db.matches) db.matches = [];
        payload.matches.forEach((m: any) => {
          const idx = db.matches.findIndex((x: any) => x.id === m.id || x.title === m.title);
          if (idx !== -1) {
            db.matches[idx] = { ...db.matches[idx], ...m };
          } else {
            db.matches.push(m);
          }
        });
      }
    }

    saveDatabase(db);
    return res.json({ 
      success: true, 
      message: `Successfully processed backup: ${validChannels.length} channels and ${(payload.matches || []).length} matches loaded (${mode} mode).`,
      count: validChannels.length,
      warnings: validationErrors
    });
  }

  // Case 2: Channels array or { channels: [...], matches: [...] }
  const rawChannels = Array.isArray(payload) ? payload : Array.isArray(payload.channels) ? payload.channels : null;

  if (rawChannels) {
    const validChannels: any[] = [];
    const validationErrors: string[] = [];
    let updatedCount = 0;
    let addedCount = 0;

    rawChannels.forEach((ch: any, idx: number) => {
      if (!ch || typeof ch !== 'object') {
        validationErrors.push(`Item at index ${idx} is not a valid channel object.`);
        return;
      }
      if (!ch.name || typeof ch.name !== 'string' || !ch.name.trim()) {
        validationErrors.push(`Item at index ${idx} is missing required 'name' field.`);
        return;
      }
      if (!ch.streamUrl || typeof ch.streamUrl !== 'string' || !ch.streamUrl.trim()) {
        validationErrors.push(`Channel "${ch.name}" is missing required 'streamUrl' field.`);
        return;
      }

      validChannels.push({
        id: ch.id || `ch-${Date.now()}-${idx}`,
        channelNumber: Number(ch.channelNumber || ch.number) || idx + 1,
        name: ch.name.trim(),
        logo: ch.logo || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&auto=format&fit=crop&q=80',
        category: (ch.category || 'SPORTS').toUpperCase(),
        streamUrl: ch.streamUrl.trim(),
        backupStreamUrl: ch.backupStreamUrl || '',
        description: ch.description || '',
        country: ch.country || 'Bangladesh',
        language: ch.language || 'Bangla',
        quality: ['4K', 'Full HD', 'HD', 'SD', 'Auto'].includes(ch.quality) ? ch.quality : 'Full HD',
        status: ch.status === 'offline' ? 'offline' : 'online',
        isFeatured: Boolean(ch.isFeatured),
        sortOrder: Number(ch.sortOrder) || idx + 1,
        enabled: ch.enabled !== false,
        viewCount: Number(ch.viewCount) || 1200,
        createdAt: ch.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    if (validChannels.length === 0) {
      return res.status(400).json({ 
        error: 'Validation failed: No valid channel entries found.', 
        validationErrors 
      });
    }

    if (mode === 'replace') {
      db.channels = validChannels;
      addedCount = validChannels.length;
    } else {
      validChannels.forEach(newCh => {
        const existingIdx = db.channels.findIndex((c: any) => 
          c.id === newCh.id || c.name.toLowerCase() === newCh.name.toLowerCase()
        );
        if (existingIdx !== -1) {
          db.channels[existingIdx] = { 
            ...db.channels[existingIdx], 
            ...newCh, 
            updatedAt: new Date().toISOString() 
          };
          updatedCount++;
        } else {
          db.channels.push(newCh);
          addedCount++;
        }
      });
    }

    // Auto import matches if present in payload
    if (Array.isArray(payload.matches)) {
      if (!db.matches) db.matches = [];
      payload.matches.forEach((m: any) => {
        if (!m || !m.title) return;
        const idx = db.matches.findIndex((x: any) => x.id === m.id || x.title === m.title);
        if (idx !== -1) {
          db.matches[idx] = { ...db.matches[idx], ...m };
        } else {
          db.matches.push(m);
        }
      });
    }

    // Auto add any new categories discovered from channels
    const existingCatNames = new Set(db.categories.map((c: any) => c.name.toUpperCase()));
    validChannels.forEach(ch => {
      if (ch.category && !existingCatNames.has(ch.category)) {
        existingCatNames.add(ch.category);
        db.categories.push({
          id: `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: ch.category,
          slug: ch.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          icon: 'Tv',
          sortOrder: db.categories.length + 1,
          color: '#0ea5e9'
        });
      }
    });

    saveDatabase(db);
    return res.json({
      success: true,
      message: `Bulk channel import successful: ${addedCount} added, ${updatedCount} updated in ${mode} mode.`,
      count: validChannels.length,
      added: addedCount,
      updated: updatedCount,
      totalChannels: db.channels.length,
      warnings: validationErrors
    });
  }

  return res.status(400).json({ error: 'Unsupported format. Expected an array of channels or a database object.' });
});

// ==================== STREAM HEALTH CHECK MONITOR ====================

interface HealthCheckLog {
  id: string;
  channelId: string;
  channelName: string;
  channelNumber: number;
  timestamp: string;
  status: 'online' | 'offline';
  latencyMs: number;
  httpStatus?: number;
  error?: string;
  checkedUrl: string;
}

interface HealthStatsStore {
  lastRunTimestamp: number;
  lastRunFormatted: string;
  totalMonitored: number;
  onlineCount: number;
  offlineCount: number;
  systemUptimePercentage: number;
  averageLatencyMs: number;
  isScanning: boolean;
  activeIntervalSeconds: number;
  recentLogs: HealthCheckLog[];
}

let healthStats: HealthStatsStore = {
  lastRunTimestamp: 0,
  lastRunFormatted: 'Initial startup',
  totalMonitored: 0,
  onlineCount: 0,
  offlineCount: 0,
  systemUptimePercentage: 100,
  averageLatencyMs: 0,
  isScanning: false,
  activeIntervalSeconds: 60,
  recentLogs: []
};

// Stream URL validator helper
async function validateStreamUrl(url: string, timeoutMs = 4500): Promise<{ ok: boolean; status: number; latencyMs: number; error?: string }> {
  if (!url || !url.startsWith('http')) {
    return { ok: false, status: 0, latencyMs: 0, error: 'Invalid URL scheme' };
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Try HEAD request first for fast header check
    let response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BD-LiveSports-HealthMonitor/1.0',
        'Accept': '*/*'
      }
    });

    const latencyMs = Date.now() - startTime;

    // If HEAD is rejected with 405 (Method Not Allowed) or 403, fallback to GET range request
    if (response.status === 405 || response.status === 403 || response.status === 400) {
      const getController = new AbortController();
      const getTimeout = setTimeout(() => getController.abort(), timeoutMs);
      try {
        response = await fetch(url, {
          method: 'GET',
          signal: getController.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BD-LiveSports-HealthMonitor/1.0',
            'Range': 'bytes=0-1024',
            'Accept': '*/*'
          }
        });
      } finally {
        clearTimeout(getTimeout);
      }
    }

    clearTimeout(timeoutId);
    const isOk = response.ok || response.status === 206 || response.status === 301 || response.status === 302 || response.status === 307;
    return {
      ok: isOk,
      status: response.status,
      latencyMs,
      error: isOk ? undefined : `HTTP ${response.status} ${response.statusText}`
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const errorMsg = err.name === 'AbortError' ? 'Connection timed out (>4.5s)' : (err.message || 'Network fetch failure');
    return {
      ok: false,
      status: 0,
      latencyMs,
      error: errorMsg
    };
  }
}

// Background health check cycle runner
async function runHealthCheckCycle() {
  if (healthStats.isScanning) return;
  healthStats.isScanning = true;

  try {
    const activeChannels = [...(db.channels || [])];
    healthStats.totalMonitored = activeChannels.length;

    let totalLatency = 0;
    let successfulChecks = 0;
    const newLogs: HealthCheckLog[] = [];

    // Check channels with concurrency of 4
    const concurrency = 4;
    for (let i = 0; i < activeChannels.length; i += concurrency) {
      const batch = activeChannels.slice(i, i + concurrency);
      await Promise.all(batch.map(async (ch) => {
        if (ch.enabled === false) return;

        const checkRes = await validateStreamUrl(ch.streamUrl);
        let backupRes: { ok: boolean; status: number; latencyMs: number; error?: string } | null = null;

        if (!checkRes.ok && ch.backupStreamUrl) {
          backupRes = await validateStreamUrl(ch.backupStreamUrl);
        }

        const isOnline = checkRes.ok || Boolean(backupRes?.ok);
        const latency = checkRes.latencyMs || backupRes?.latencyMs || 0;

        if (isOnline) {
          successfulChecks++;
          totalLatency += latency;
        }

        // Update in-memory & persistent DB for this channel
        const dbIdx = db.channels.findIndex((c: any) => c.id === ch.id);
        if (dbIdx !== -1) {
          const prevChannel = db.channels[dbIdx];
          const prevChecks = prevChannel.totalHealthChecks || 10;
          const prevSuccess = prevChannel.successfulHealthChecks || (prevChannel.status === 'online' ? 10 : 0);
          const newTotal = prevChecks + 1;
          const newSuccess = prevSuccess + (isOnline ? 1 : 0);
          const uptimePct = Math.min(100, Math.max(0, Math.round((newSuccess / newTotal) * 100)));

          db.channels[dbIdx] = {
            ...prevChannel,
            status: isOnline ? 'online' : 'offline',
            latencyMs: latency,
            lastHealthCheckTime: new Date().toISOString(),
            uptimePercentage: uptimePct,
            healthError: isOnline ? undefined : (checkRes.error || `HTTP ${checkRes.status}`),
            backupHealthStatus: ch.backupStreamUrl ? (backupRes?.ok ? 'online' : 'offline') : 'n/a',
            totalHealthChecks: newTotal,
            successfulHealthChecks: newSuccess,
            updatedAt: new Date().toISOString()
          };
        }

        // Create log entry
        newLogs.unshift({
          id: `log-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          channelId: ch.id,
          channelName: ch.name,
          channelNumber: ch.channelNumber,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          status: isOnline ? 'online' : 'offline',
          latencyMs: latency,
          httpStatus: checkRes.status,
          error: checkRes.error,
          checkedUrl: ch.streamUrl
        });
      }));
    }

    const onlineCount = db.channels.filter((c: any) => c.status === 'online' && c.enabled !== false).length;
    const offlineCount = db.channels.filter((c: any) => c.status === 'offline' && c.enabled !== false).length;
    const avgLatency = successfulChecks > 0 ? Math.round(totalLatency / successfulChecks) : 0;
    const sysUptime = db.channels.length > 0 ? Math.round((onlineCount / db.channels.length) * 100) : 100;

    healthStats = {
      lastRunTimestamp: Date.now(),
      lastRunFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      totalMonitored: db.channels.length,
      onlineCount,
      offlineCount,
      systemUptimePercentage: sysUptime,
      averageLatencyMs: avgLatency,
      isScanning: false,
      activeIntervalSeconds: 60,
      recentLogs: [...newLogs, ...healthStats.recentLogs].slice(0, 50)
    };

    saveDatabase(db);
  } catch (e) {
    console.error('Health check error:', e);
    healthStats.isScanning = false;
  }
}

// Start periodic monitor background cycle
setInterval(() => {
  runHealthCheckCycle().catch(console.error);
}, 60000);

// Initial health check run 5 seconds after server startup
setTimeout(() => {
  runHealthCheckCycle().catch(console.error);
}, 5000);

// API Endpoints for Health Monitor
app.get('/api/admin/health-check/stats', (_req, res) => {
  const onlineCount = db.channels.filter((c: any) => c.status === 'online' && c.enabled !== false).length;
  const offlineCount = db.channels.filter((c: any) => c.status === 'offline' && c.enabled !== false).length;
  const sysUptime = db.channels.length > 0 ? Math.round((onlineCount / db.channels.length) * 100) : 100;

  res.json({
    success: true,
    stats: {
      ...healthStats,
      totalMonitored: db.channels.length,
      onlineCount,
      offlineCount,
      systemUptimePercentage: sysUptime,
    }
  });
});

app.post('/api/admin/health-check/run', async (_req, res) => {
  await runHealthCheckCycle();
  res.json({
    success: true,
    message: 'Health check cycle completed successfully',
    stats: healthStats,
    channels: db.channels
  });
});

app.post('/api/admin/health-check/check-single', async (req, res) => {
  const { url, backupUrl } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const primaryResult = await validateStreamUrl(url);
  let backupResult: { ok: boolean; status: number; latencyMs: number; error?: string } | null = null;
  if (backupUrl) {
    backupResult = await validateStreamUrl(backupUrl);
  }

  res.json({
    success: true,
    primary: primaryResult,
    backup: backupResult,
    status: primaryResult.ok || backupResult?.ok ? 'online' : 'offline',
    latencyMs: primaryResult.latencyMs || backupResult?.latencyMs || 0
  });
});

// ==================== REST ALIASES (MASTER PROMPT SPECS) ====================

// Test a single stream / channel
app.post('/api/admin/channels/test', requireAdminAuth, async (req, res) => {
  const { url, backupUrl, id } = req.body;
  let targetUrl = url;
  let targetBackup = backupUrl;

  if (id && !targetUrl) {
    const ch = db.channels.find((c: any) => c.id === id);
    if (ch) {
      targetUrl = ch.streamUrl;
      targetBackup = ch.backupStreamUrl;
    }
  }

  if (!targetUrl) {
    return res.status(400).json({ error: 'Stream URL or valid channel ID required' });
  }

  const primaryResult = await validateStreamUrl(targetUrl);
  let backupResult: { ok: boolean; status: number; latencyMs: number; error?: string } | null = null;
  if (targetBackup) {
    backupResult = await validateStreamUrl(targetBackup);
  }

  const isOnline = primaryResult.ok || Boolean(backupResult?.ok);
  
  if (id) {
    const dbIdx = db.channels.findIndex((c: any) => c.id === id);
    if (dbIdx !== -1) {
      db.channels[dbIdx].status = isOnline ? 'online' : 'offline';
      db.channels[dbIdx].lastHealthCheckTime = new Date().toISOString();
      saveDatabase(db);
    }
  }

  res.json({
    success: true,
    status: isOnline ? 'online' : 'offline',
    primary: primaryResult,
    backup: backupResult,
    latencyMs: primaryResult.latencyMs || backupResult?.latencyMs || 0
  });
});

// Test all channels
app.post('/api/admin/channels/test-all', requireAdminAuth, async (_req, res) => {
  await runHealthCheckCycle();
  res.json({
    success: true,
    message: 'Health check completed for all channels',
    stats: healthStats,
    channelsCount: db.channels.length
  });
});

// M3U Import Endpoint with Duplicate Detection
app.post('/api/admin/m3u/import', requireAdminAuth, (req, res) => {
  const { m3u, content } = req.body;
  const rawContent = (m3u || content || (typeof req.body === 'string' ? req.body : '')).trim();

  if (!rawContent) {
    return res.status(400).json({ error: 'M3U content is required' });
  }

  const lines = rawContent.split('\n').map((l: string) => l.trim()).filter(Boolean);
  const parsedChannels: any[] = [];
  const duplicates: any[] = [];
  let currentInfo: any = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#EXTINF:')) {
      const tvgId = (line.match(/tvg-id="([^"]*)"/i) || [])[1] || '';
      const tvgName = (line.match(/tvg-name="([^"]*)"/i) || [])[1] || '';
      const tvgLogo = (line.match(/tvg-logo="([^"]*)"/i) || [])[1] || '';
      const groupTitle = (line.match(/group-title="([^"]*)"/i) || [])[1] || 'SPORTS';
      const namePart = line.split(',').slice(1).join(',').trim() || tvgName || tvgId || 'Live Stream';
      currentInfo = { tvgId, tvgName, tvgLogo, groupTitle, name: namePart };
    } else if (line.startsWith('http://') || line.startsWith('https://')) {
      if (currentInfo) {
        const streamUrl = line.trim();
        const slug = currentInfo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        // Check duplicate by name, slug, streamUrl, or tvg-id
        const isDuplicate = db.channels.some((c: any) => 
          c.streamUrl === streamUrl ||
          c.name.toLowerCase() === currentInfo.name.toLowerCase() ||
          (c.slug && c.slug === slug) ||
          (currentInfo.tvgId && c.tvgId === currentInfo.tvgId)
        );

        if (isDuplicate) {
          duplicates.push({ name: currentInfo.name, streamUrl, reason: 'Duplicate — Not Imported' });
        } else {
          parsedChannels.push({
            id: `ch-${Date.now()}-${parsedChannels.length + 1}`,
            channelNumber: db.channels.length + parsedChannels.length + 1,
            name: currentInfo.name,
            slug,
            category: currentInfo.groupTitle.toUpperCase(),
            streamUrl,
            backupStreamUrl: '',
            logo: currentInfo.tvgLogo || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&auto=format&fit=crop&q=80',
            quality: 'Full HD',
            status: 'online',
            description: `${currentInfo.name} Live Transmission`,
            country: 'Bangladesh',
            language: 'Bangla',
            isFeatured: false,
            enabled: true,
            viewCount: 1000,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        currentInfo = null;
      }
    }
  }

  if (parsedChannels.length > 0) {
    db.channels.push(...parsedChannels);
    saveDatabase(db);
  }

  res.json({
    success: true,
    importedCount: parsedChannels.length,
    duplicateCount: duplicates.length,
    totalChannels: db.channels.length,
    duplicates,
    message: `Imported ${parsedChannels.length} new channels. ${duplicates.length} duplicate items skipped.`
  });
});

// ==================== STREAM ISSUE REPORTING ENDPOINTS ====================

// Submit issue report from user (e.g. from VideoPlayer)
app.post('/api/reports', (req, res) => {
  const { channelId, channelName, channelNumber, streamUrl, activeServer, issueType, description, userDeviceInfo } = req.body;
  if (!channelId || !issueType) {
    return res.status(400).json({ error: 'channelId and issueType are required' });
  }

  const report = {
    id: `rep-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    channelId,
    channelName: channelName || 'Unknown Channel',
    channelNumber: Number(channelNumber) || 0,
    streamUrl: streamUrl || '',
    activeServer: Number(activeServer) || 1,
    issueType,
    description: description ? String(description).trim() : '',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    createdAt: new Date().toISOString(),
    status: 'pending',
    userDeviceInfo: userDeviceInfo || req.headers['user-agent'] || 'Web Client'
  };

  if (!Array.isArray(db.reports)) {
    db.reports = [];
  }

  db.reports.unshift(report);
  if (db.reports.length > 200) {
    db.reports = db.reports.slice(0, 200);
  }

  saveDatabase(db);
  console.log(`[Report] Received stream issue for channel ${channelName} (CH ${channelNumber}): ${issueType}`);

  res.json({
    success: true,
    message: 'Issue report submitted successfully! The admin team will inspect the stream.',
    report
  });
});

// Admin get all issue reports
app.get('/api/admin/reports', (req, res) => {
  res.json({
    success: true,
    reports: db.reports || []
  });
});

// Admin update issue report status
app.patch('/api/admin/reports/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!Array.isArray(db.reports)) {
    db.reports = [];
  }
  const report = db.reports.find((r: any) => r.id === id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  if (status) {
    report.status = status;
    report.updatedAt = new Date().toISOString();
  }
  saveDatabase(db);
  res.json({ success: true, report });
});

// Admin delete an issue report
app.delete('/api/admin/reports/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  if (!Array.isArray(db.reports)) {
    db.reports = [];
  }
  db.reports = db.reports.filter((r: any) => r.id !== id);
  saveDatabase(db);
  res.json({ success: true, message: 'Report deleted' });
});

// Admin clear resolved issue reports
app.post('/api/admin/reports/clear-resolved', requireAdminAuth, (_req, res) => {
  if (!Array.isArray(db.reports)) {
    db.reports = [];
  }
  const beforeCount = db.reports.length;
  db.reports = db.reports.filter((r: any) => r.status === 'pending' || r.status === 'investigating');
  const removedCount = beforeCount - db.reports.length;
  saveDatabase(db);
  res.json({ success: true, removedCount, remainingCount: db.reports.length });
});

// Admin Health Overview Endpoint
app.get('/api/admin/health', (_req, res) => {
  const onlineCount = db.channels.filter((c: any) => c.status === 'online' && c.enabled !== false).length;
  const offlineCount = db.channels.filter((c: any) => c.status === 'offline' && c.enabled !== false).length;
  const sysUptime = db.channels.length > 0 ? Math.round((onlineCount / db.channels.length) * 100) : 100;

  res.json({
    status: 'ok',
    totalChannels: db.channels.length,
    working: onlineCount,
    offline: offlineCount,
    uptimePercentage: sysUptime,
    categoriesCount: db.categories.length,
    lastCheck: healthStats.lastRunFormatted,
    stats: healthStats
  });
});

// App status check endpoint requested
app.get('/status', (req, res) => {
  res.send('App is running correctly!');
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'App is running correctly!' });
});

// ==================== STATIC ASSETS & VITE MIDDLEWARE ====================

const publicDir = path.join(rootDir, 'public');
const distPath = path.join(rootDir, 'dist');
const rootIndex = path.join(rootDir, 'index.html');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}
app.use(express.static(rootDir));

// Universal SPA fallback route for all non-API requests (registered immediately)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/status') {
    return next();
  }
  const distIndex = path.join(distPath, 'index.html');
  const pubIndex = path.join(publicDir, 'index.html');
  
  if (fs.existsSync(distIndex)) {
    res.sendFile(distIndex);
  } else if (fs.existsSync(rootIndex)) {
    res.sendFile(rootIndex);
  } else if (fs.existsSync(pubIndex)) {
    res.sendFile(pubIndex);
  } else {
    res.sendFile(rootIndex);
  }
});

// Start listening immediately
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`⚡ BD LIVE SPORTS TV Server running on http://0.0.0.0:${PORT}`);
});

// Asynchronously initialize Vite middleware in development if needed
if (process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    console.log('⚡ Vite dev middleware attached');
  }).catch((e) => {
    console.warn('Vite middleware mode failed to initialize:', e);
  });
}

