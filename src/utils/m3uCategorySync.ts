import { Channel } from '../types';

export interface PredefinedCategoryRule {
  id: string;
  category: string;
  categoryLabel: string;
  categoryBn: string;
  color: string;
  description: string;
  patterns: string[];
  channelNameHints: string[];
}

export interface CategorySyncReport {
  totalScanned: number;
  updatedCount: number;
  unchangedCount: number;
  timestamp: string;
  breakdown: Record<string, number>;
  changes: Array<{
    id: string;
    name: string;
    originalGroup: string;
    originalCategory: string;
    newCategory: string;
    newCategoryLabel: string;
    matchedRule: string;
  }>;
}

/**
 * Predefined Canonical Categories and their keyword matching rules
 * for automated M3U group-title mapping.
 */
export const PREDEFINED_CATEGORY_RULES: PredefinedCategoryRule[] = [
  {
    id: 'rule-sports',
    category: 'SPORTS',
    categoryLabel: 'Sports',
    categoryBn: 'খেলাধুলা',
    color: '#0ea5e9',
    description: 'Cricket, Football, Live Sports, Ten Sports, Willow, PTV, T Sports, BeIN, etc.',
    patterns: [
      'sport', 'cricket', 'football', 'soccer', 'tennis', 'racing', 'f1', 'motorsport',
      'wwe', 'wrestl', 'badminton', 'basketball', 'nba', 'combat', 'ufc', 'box', 'golf',
      't sport', 'tsport', 'willow', 'ptv sport', 'a sport', 'asport', 'euro sport', 'eurosport',
      'bein', 'sky sport', 'supersport', 'astro sport', 'star sport', 'sony ten', 'sony six',
      'ten sport', 'geo super', 'fan code', 'fancode', 'live match', 'premier league', 'fifa',
      'ipl', 'bpl', 'icc', 'champions league', 'world cup', 'khel', 'olympic'
    ],
    channelNameHints: [
      't sports', 'ptv', 'willow', 'euro sports', 'eurosport', 'bein', 'a sports', 'star sports',
      'sony ten', 'sony six', 'ten 1', 'ten 2', 'ten 3', 'sports 18', 'geo super', 'dd sports',
      'sky sports', 'super sport', 'astro cricket', 'fan code', 'premier sports'
    ]
  },
  {
    id: 'rule-bd',
    category: 'BANGLADESH',
    categoryLabel: 'Bangladeshi',
    categoryBn: 'বাংলাদেশী',
    color: '#10b981',
    description: 'National BD Channels, Dhaka TV, Bongo Flix, Bangla TV, Local Transmission',
    patterns: [
      'bangladesh', 'bangla', 'bd', 'bangladeshi', 'bd live', 'bdtv', 'dhaka', 'chittagong',
      'sylhet', 'deshi', 'bongo', 'bongo flix', 'local bd', 'bd channels', 'bd national'
    ],
    channelNameHints: [
      'btv', 'btv world', 'channel i', 'ntv', 'atn bangla', 'atn news', 'r tv', 'rtv',
      'boishakhi', 'banglavision', 'maasranga', 'nagorik', 'deepto', 'ananda tv', 'asian tv',
      'desh tv', 'ekattor', 'somoy', 'jamuna', 'dbc news', 'channel 24', 'independent'
    ]
  },
  {
    id: 'rule-islamic',
    category: 'ISLAMIC',
    categoryLabel: 'Islamic',
    categoryBn: 'ইসলামিক',
    color: '#059669',
    description: 'Islamic TV, Quran Live, Makkah, Madinah, Peace TV, Sunnah, Waz',
    patterns: [
      'islam', 'islamic', 'quran', 'sunnah', 'makkah', 'madinah', 'madani', 'peace tv',
      'al quran', 'deen', 'deen tv', 'hajj', 'dawah', 'azhari', 'waz', 'hadith', 'muslim',
      'islamic channels', 'saudi quran', 'saudi sunnah', 'iqra', 'paigham'
    ],
    channelNameHints: [
      'peace tv', 'makkah live', 'madina live', 'quran tv', 'sunnah tv', 'madani channel',
      'iqra', 'islam channel', 'guide us tv', 'al resalah', 'deen tv'
    ]
  },
  {
    id: 'rule-news',
    category: 'NEWS',
    categoryLabel: 'News',
    categoryBn: 'সংবাদ',
    color: '#ec4899',
    description: 'Live News, Khabar, Somoy, Jamuna, Ekattor, BBC, CNN, Al Jazeera',
    patterns: [
      'news', 'khabar', 'somoy', 'ekattor', 'jamuna', 'dbc', 'channel 24', 'independent',
      'samachar', 'headline', 'live news', '24/7 news', 'breaking news', 'current affairs',
      'al jazeera', 'bbc', 'cnn', 'ndtv', 'aaj tak', 'republic', 'abp news', 'zee news', 'geo news'
    ],
    channelNameHints: [
      'somoy', 'ekattor', 'jamuna', 'dbc news', 'channel 24', 'independent tv', 'atn news',
      'news 24', 'bbc world', 'cnn', 'al jazeera', 'dw', 'france 24', 'ndtv', 'aaj tak',
      'abp ananda', 'geo news', 'ary news'
    ]
  },
  {
    id: 'rule-movies',
    category: 'MOVIES',
    categoryLabel: 'Movies',
    categoryBn: 'মুভিজ',
    color: '#a855f7',
    description: 'Movies, Cinema, Hollywood, Bollywood, Bangla Cinema, Goldmines, Cineplex',
    patterns: [
      'movie', 'movies', 'cinema', 'film', 'cineplex', 'goldmines', 'star gold', 'zee cinema',
      'sony max', 'action movie', 'hollywood', 'bollywood', 'bangla cinema', 'classic movie',
      'cinemax', 'hbo', 'film world', 'moviebox', 'cinema hd', 'cine'
    ],
    channelNameHints: [
      'sony max', 'star gold', 'zee cinema', 'colors cineplex', 'goldmines', 'b4u movies',
      'zee bangla cinema', 'jalsha movies', 'hbo', 'wb', 'cinemax', 'movie now', '&pictures'
    ]
  },
  {
    id: 'rule-entertainment',
    category: 'ENTERTAINMENT',
    categoryLabel: 'Entertainment',
    categoryBn: 'বিনোদন',
    color: '#f59e0b',
    description: 'Dramas, Serials, Star Jalsha, Zee Bangla, Sony SAB, Colors, Natok',
    patterns: [
      'entertainment', 'natok', 'drama', 'serial', 'colors', 'star jalsha', 'zee bangla',
      'sony sub', 'sony sab', 'star plus', 'zee tv', 'mega serial', 'drama hd', 'gec', 'general',
      'comedy', 'sitcom', 'variety', 'show'
    ],
    channelNameHints: [
      'star jalsha', 'zee bangla', 'colors bangla', 'sony sab', 'star plus', 'zee tv',
      'colors tv', 'sony entertainment', 'sony tv', 'sun tv', 'star bharat', '&tv'
    ]
  },
  {
    id: 'rule-indian',
    category: 'INDIA',
    categoryLabel: 'Indian',
    categoryBn: 'ভারতীয়',
    color: '#f97316',
    description: 'Indian Regional & National Channels (Hindi, Tamil, Telugu, Zee, Sony, Star)',
    patterns: [
      'india', 'indian', 'hindi', 'tamil', 'telugu', 'punjabi', 'malayalam', 'bhojpuri',
      'kannada', 'marathi', 'gujarati', 'kolkata', 'bengal', 'dd national', 'indian channels'
    ],
    channelNameHints: [
      'star jalsha', 'zee bangla', 'colors bangla', 'sony aath', 'dd national', 'dd bangla',
      'akash aath', 'sangeet bangla', 'ruposhi bangla'
    ]
  },
  {
    id: 'rule-international',
    category: 'INTERNATIONAL',
    categoryLabel: 'International',
    categoryBn: 'আন্তর্জাতিক',
    color: '#6366f1',
    description: 'International, USA, UK, Discovery, Nat Geo, History, Kids, Cartoons, Music',
    patterns: [
      'international', 'usa', 'uk', 'world', 'global', 'discovery', 'national geographic',
      'nat geo', 'animal planet', 'history', 'tlc', 'cartoon', 'nickelodeon', 'disney',
      'pogo', 'anime', 'kids', 'english', 'music', 'songs', 'mtv', 'vh1', '9xm', 'travel'
    ],
    channelNameHints: [
      'discovery', 'nat geo', 'history tv', 'animal planet', 'cartoon network', 'nick',
      'disney', 'pogo', 'sonic', 'mtv', 'vh1', 'tlc', 'investigation discovery'
    ]
  },
  {
    id: 'rule-most-watched',
    category: 'MOST WATCHED',
    categoryLabel: '🔥 Most Watched',
    categoryBn: 'সর্বাধিক দেখা',
    color: '#ef4444',
    description: 'VIP Channels, Most Popular, Trending, High Viewership channels',
    patterns: [
      'vip', 'most watched', 'popular', 'trending', 'top channels', 'featured', 'hot', 'favourite'
    ],
    channelNameHints: [
      't sports hd', 'ptv', 'willow sports', 'euro sports', 'bein sports', 'somoy tv'
    ]
  }
];

/**
 * Maps an M3U 'group-title' (and optionally channel name) to a canonical predefined category.
 */
export function mapM3uGroupToPredefinedCategory(
  groupTitle?: string,
  channelName?: string,
  existingCategory?: string
): {
  category: string;
  categoryLabel: string;
  categoryBn: string;
  confidence: 'exact' | 'high' | 'medium' | 'default';
  matchedRule: string;
} {
  const cleanGroup = (groupTitle || '').trim().toLowerCase();
  const cleanName = (channelName || '').trim().toLowerCase();
  const cleanExisting = (existingCategory || '').trim().toLowerCase();

  // 1. Check if group-title or existingCategory already directly matches a canonical category name
  for (const rule of PREDEFINED_CATEGORY_RULES) {
    if (
      cleanGroup === rule.category.toLowerCase() ||
      cleanGroup === rule.categoryLabel.toLowerCase() ||
      cleanExisting === rule.category.toLowerCase()
    ) {
      return {
        category: rule.category,
        categoryLabel: rule.categoryLabel,
        categoryBn: rule.categoryBn,
        confidence: 'exact',
        matchedRule: `Exact category match: "${rule.category}"`
      };
    }
  }

  // 2. Pattern match on group-title keywords
  if (cleanGroup && cleanGroup !== 'tv' && cleanGroup !== 'iptv' && cleanGroup !== 'general') {
    for (const rule of PREDEFINED_CATEGORY_RULES) {
      for (const pattern of rule.patterns) {
        if (cleanGroup.includes(pattern)) {
          return {
            category: rule.category,
            categoryLabel: rule.categoryLabel,
            categoryBn: rule.categoryBn,
            confidence: 'high',
            matchedRule: `Group pattern "${pattern}" mapped to ${rule.categoryLabel}`
          };
        }
      }
    }
  }

  // 3. Fallback to channelName inspection (vital for playlists with empty or generic group-title)
  if (cleanName) {
    for (const rule of PREDEFINED_CATEGORY_RULES) {
      for (const hint of rule.channelNameHints) {
        if (cleanName.includes(hint)) {
          return {
            category: rule.category,
            categoryLabel: rule.categoryLabel,
            categoryBn: rule.categoryBn,
            confidence: 'medium',
            matchedRule: `Channel name hint "${hint}" mapped to ${rule.categoryLabel}`
          };
        }
      }
    }
  }

  // 4. Secondary check: regex heuristics on channelName and groupTitle
  if (/sports?|cricket|football|soccer|league|cup|tennis/i.test(cleanName + ' ' + cleanGroup)) {
    const sportsRule = PREDEFINED_CATEGORY_RULES[0];
    return {
      category: sportsRule.category,
      categoryLabel: sportsRule.categoryLabel,
      categoryBn: sportsRule.categoryBn,
      confidence: 'medium',
      matchedRule: 'Sports heuristic match'
    };
  }

  if (/news|khabar|samachar|24x7/i.test(cleanName + ' ' + cleanGroup)) {
    const newsRule = PREDEFINED_CATEGORY_RULES.find(r => r.category === 'NEWS')!;
    return {
      category: newsRule.category,
      categoryLabel: newsRule.categoryLabel,
      categoryBn: newsRule.categoryBn,
      confidence: 'medium',
      matchedRule: 'News heuristic match'
    };
  }

  if (/movie|cinema|film/i.test(cleanName + ' ' + cleanGroup)) {
    const movieRule = PREDEFINED_CATEGORY_RULES.find(r => r.category === 'MOVIES')!;
    return {
      category: movieRule.category,
      categoryLabel: movieRule.categoryLabel,
      categoryBn: movieRule.categoryBn,
      confidence: 'medium',
      matchedRule: 'Movie heuristic match'
    };
  }

  // 5. Default fallback to SPORTS for this Live Sports TV platform
  const defaultRule = PREDEFINED_CATEGORY_RULES[0];
  return {
    category: defaultRule.category,
    categoryLabel: defaultRule.categoryLabel,
    categoryBn: defaultRule.categoryBn,
    confidence: 'default',
    matchedRule: 'Default fallback to Sports category'
  };
}

/**
 * Runs the automated sync script over an array of channels, mapping their categories
 * to canonical predefined categories.
 */
export function runAutomatedCategorySync(
  channels: Channel[],
  options?: {
    forceReCategorize?: boolean; // If true, re-evaluates even if category is already standard
  }
): {
  updatedChannels: Channel[];
  report: CategorySyncReport;
} {
  const force = options?.forceReCategorize ?? false;
  let updatedCount = 0;
  let unchangedCount = 0;
  const breakdown: Record<string, number> = {};
  const changes: CategorySyncReport['changes'] = [];

  const canonicalCategories = new Set(PREDEFINED_CATEGORY_RULES.map(r => r.category.toUpperCase()));

  const updatedChannels = channels.map((channel) => {
    const currentCat = (channel.category || '').toUpperCase().trim();
    const groupTitle = channel.categoryLabel || channel.category || '';
    
    // Check if channel already has a valid canonical category and force is false
    const alreadyCanonical = canonicalCategories.has(currentCat);
    
    if (alreadyCanonical && !force) {
      unchangedCount++;
      breakdown[currentCat] = (breakdown[currentCat] || 0) + 1;
      return channel;
    }

    const mapping = mapM3uGroupToPredefinedCategory(groupTitle, channel.name, channel.category);
    const newCategory = mapping.category;
    const newCategoryLabel = mapping.categoryLabel;

    breakdown[newCategory] = (breakdown[newCategory] || 0) + 1;

    if (currentCat !== newCategory || !channel.categoryLabel) {
      updatedCount++;
      changes.push({
        id: channel.id,
        name: channel.name,
        originalGroup: groupTitle,
        originalCategory: channel.category || 'UNKNOWN',
        newCategory,
        newCategoryLabel,
        matchedRule: mapping.matchedRule
      });

      return {
        ...channel,
        category: newCategory,
        categoryLabel: newCategoryLabel,
        categoryBn: mapping.categoryBn,
        updatedAt: new Date().toISOString()
      };
    }

    unchangedCount++;
    return channel;
  });

  const report: CategorySyncReport = {
    totalScanned: channels.length,
    updatedCount,
    unchangedCount,
    timestamp: new Date().toISOString(),
    breakdown,
    changes
  };

  return {
    updatedChannels,
    report
  };
}

export interface M3uGroupMappingEntry {
  groupTitle: string;
  cleanGroup: string;
  mappedCategory: string;
  mappedCategoryLabel: string;
  mappedCategoryBn: string;
  color: string;
  channelCount: number;
  confidence: 'exact' | 'high' | 'medium' | 'default' | 'custom';
  matchedRule: string;
  sampleChannels: string[];
}

export interface M3uParsedChannelPreview {
  id: string;
  channelNumber: number;
  name: string;
  originalGroupTitle: string;
  category: string;
  categoryLabel: string;
  categoryBn: string;
  color: string;
  streamUrl: string;
  logo: string;
  quality: string;
  status: 'online' | 'offline';
  confidence: 'exact' | 'high' | 'medium' | 'default' | 'custom';
  matchedRule: string;
}

export interface M3uAutomatedMappingResult {
  totalChannels: number;
  distinctGroupsCount: number;
  groupMappings: M3uGroupMappingEntry[];
  channels: M3uParsedChannelPreview[];
  categoryBreakdown: Record<string, number>;
  confidenceSummary: {
    exact: number;
    high: number;
    medium: number;
    default: number;
    custom: number;
  };
  errors: string[];
  warnings: string[];
}

/**
 * Automated M3U Group-Title Mapping Function:
 * Inspects incoming M3U playlist text, extracts all 'group-title' metadata tags,
 * and assigns them to the internal canonical category system with confidence metrics,
 * preview breakdowns, and support for custom admin overrides.
 */
export function parseM3uWithAutomatedMapping(
  m3uContent: string,
  customOverrides?: Record<string, string>
): M3uAutomatedMappingResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!m3uContent || typeof m3uContent !== 'string' || !m3uContent.trim()) {
    return {
      totalChannels: 0,
      distinctGroupsCount: 0,
      groupMappings: [],
      channels: [],
      categoryBreakdown: {},
      confidenceSummary: { exact: 0, high: 0, medium: 0, default: 0, custom: 0 },
      errors: ['M3U playlist content is empty.'],
      warnings: []
    };
  }

  const trimmed = m3uContent.trim();
  if (!trimmed.startsWith('#EXTM3U') && !trimmed.includes('#EXTINF:')) {
    warnings.push('Playlist does not start with #EXTM3U tag, attempting loose EXTINF parsing.');
  }

  const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const channels: M3uParsedChannelPreview[] = [];
  const groupStats = new Map<string, {
    count: number;
    sampleChannels: string[];
    rawGroup: string;
  }>();

  let currentExtinf: {
    tvgId: string;
    tvgName: string;
    tvgLogo: string;
    groupTitle: string;
    name: string;
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('#EXTINF:')) {
      const tvgId = (line.match(/tvg-id="([^"]*)"/i) || [])[1] || '';
      const tvgName = (line.match(/tvg-name="([^"]*)"/i) || [])[1] || '';
      const tvgLogo = (line.match(/tvg-logo="([^"]*)"/i) || [])[1] || '';
      
      // Robust group-title match supporting quotes or unquoted tags
      const groupMatch = line.match(/group-title="([^"]*)"/i) || line.match(/group-title=([^, \t]+)/i);
      const rawGroupTitle = groupMatch ? groupMatch[1].trim() : '';
      const normalizedGroup = rawGroupTitle || 'Uncategorized';

      const commaIdx = line.indexOf(',');
      const rawName = commaIdx !== -1 ? line.slice(commaIdx + 1).trim() : '';
      const finalName = rawName || tvgName || tvgId || `Channel ${channels.length + 1}`;

      currentExtinf = {
        tvgId,
        tvgName,
        tvgLogo,
        groupTitle: normalizedGroup,
        name: finalName
      };
    } else if (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('rtmp://')) {
      if (currentExtinf) {
        const streamUrl = line;
        const group = currentExtinf.groupTitle;
        const channelName = currentExtinf.name;

        // Group frequency tracking
        const stat = groupStats.get(group) || { count: 0, sampleChannels: [], rawGroup: group };
        stat.count += 1;
        if (stat.sampleChannels.length < 3) {
          stat.sampleChannels.push(channelName);
        }
        groupStats.set(group, stat);

        // Determine category assignment
        let assignedCategory: string;
        let assignedLabel: string;
        let assignedBn: string;
        let color: string;
        let confidence: 'exact' | 'high' | 'medium' | 'default' | 'custom';
        let matchedRule: string;

        // Check if admin provided an explicit override for this group-title
        if (customOverrides && customOverrides[group]) {
          const targetKey = customOverrides[group].toUpperCase().trim();
          const foundRule = PREDEFINED_CATEGORY_RULES.find(r => r.category === targetKey);
          if (foundRule) {
            assignedCategory = foundRule.category;
            assignedLabel = foundRule.categoryLabel;
            assignedBn = foundRule.categoryBn;
            color = foundRule.color;
          } else {
            assignedCategory = targetKey;
            assignedLabel = targetKey;
            assignedBn = targetKey;
            color = '#0ea5e9';
          }
          confidence = 'custom';
          matchedRule = `Admin custom override to "${assignedLabel}"`;
        } else {
          // Automated mapping function based on group-title heuristics and channel hints
          const mapping = mapM3uGroupToPredefinedCategory(group, channelName);
          const foundRule = PREDEFINED_CATEGORY_RULES.find(r => r.category === mapping.category) || PREDEFINED_CATEGORY_RULES[0];
          assignedCategory = mapping.category;
          assignedLabel = mapping.categoryLabel;
          assignedBn = mapping.categoryBn;
          color = foundRule.color;
          confidence = mapping.confidence;
          matchedRule = mapping.matchedRule;
        }

        channels.push({
          id: `ch-m3u-${channels.length + 1}`,
          channelNumber: channels.length + 1,
          name: channelName,
          originalGroupTitle: group,
          category: assignedCategory,
          categoryLabel: assignedLabel,
          categoryBn: assignedBn,
          color,
          streamUrl,
          logo: currentExtinf.tvgLogo,
          quality: 'Full HD',
          status: 'online',
          confidence,
          matchedRule
        });

        currentExtinf = null;
      }
    }
  }

  if (channels.length === 0) {
    errors.push('No valid stream URLs found associated with #EXTINF directives.');
  }

  // Build the Group Mapping Matrix
  const groupMappings: M3uGroupMappingEntry[] = [];
  const categoryBreakdown: Record<string, number> = {};
  const confidenceSummary = { exact: 0, high: 0, medium: 0, default: 0, custom: 0 };

  channels.forEach(ch => {
    categoryBreakdown[ch.category] = (categoryBreakdown[ch.category] || 0) + 1;
    confidenceSummary[ch.confidence] = (confidenceSummary[ch.confidence] || 0) + 1;
  });

  groupStats.forEach((stat, groupKey) => {
    // Representative mapping for this group
    let mappedCategory: string;
    let mappedCategoryLabel: string;
    let mappedCategoryBn: string;
    let color: string;
    let confidence: 'exact' | 'high' | 'medium' | 'default' | 'custom';
    let matchedRule: string;

    if (customOverrides && customOverrides[groupKey]) {
      const targetKey = customOverrides[groupKey].toUpperCase().trim();
      const foundRule = PREDEFINED_CATEGORY_RULES.find(r => r.category === targetKey);
      mappedCategory = foundRule ? foundRule.category : targetKey;
      mappedCategoryLabel = foundRule ? foundRule.categoryLabel : targetKey;
      mappedCategoryBn = foundRule ? foundRule.categoryBn : targetKey;
      color = foundRule ? foundRule.color : '#0ea5e9';
      confidence = 'custom';
      matchedRule = `Admin custom override: ${mappedCategoryLabel}`;
    } else {
      const mapping = mapM3uGroupToPredefinedCategory(groupKey, stat.sampleChannels[0] || '');
      const foundRule = PREDEFINED_CATEGORY_RULES.find(r => r.category === mapping.category) || PREDEFINED_CATEGORY_RULES[0];
      mappedCategory = mapping.category;
      mappedCategoryLabel = mapping.categoryLabel;
      mappedCategoryBn = mapping.categoryBn;
      color = foundRule.color;
      confidence = mapping.confidence;
      matchedRule = mapping.matchedRule;
    }

    groupMappings.push({
      groupTitle: groupKey,
      cleanGroup: groupKey.toLowerCase(),
      mappedCategory,
      mappedCategoryLabel,
      mappedCategoryBn,
      color,
      channelCount: stat.count,
      confidence,
      matchedRule,
      sampleChannels: stat.sampleChannels
    });
  });

  // Sort group mappings: higher channel counts first
  groupMappings.sort((a, b) => b.channelCount - a.channelCount);

  return {
    totalChannels: channels.length,
    distinctGroupsCount: groupMappings.length,
    groupMappings,
    channels,
    categoryBreakdown,
    confidenceSummary,
    errors,
    warnings
  };
}

/**
 * Reassigns a specific M3U group-title to a target category and updates all channels within that group.
 */
export function assignGroupMappingOverride(
  currentResult: M3uAutomatedMappingResult,
  groupTitle: string,
  targetCategoryKey: string
): M3uAutomatedMappingResult {
  const targetKey = targetCategoryKey.toUpperCase().trim();
  const rule = PREDEFINED_CATEGORY_RULES.find(r => r.category === targetKey) || PREDEFINED_CATEGORY_RULES[0];

  const updatedChannels = currentResult.channels.map(ch => {
    if (ch.originalGroupTitle === groupTitle) {
      return {
        ...ch,
        category: rule.category,
        categoryLabel: rule.categoryLabel,
        categoryBn: rule.categoryBn,
        color: rule.color,
        confidence: 'custom' as const,
        matchedRule: `Admin manually assigned to ${rule.categoryLabel}`
      };
    }
    return ch;
  });

  const updatedGroupMappings = currentResult.groupMappings.map(gm => {
    if (gm.groupTitle === groupTitle) {
      return {
        ...gm,
        mappedCategory: rule.category,
        mappedCategoryLabel: rule.categoryLabel,
        mappedCategoryBn: rule.categoryBn,
        color: rule.color,
        confidence: 'custom' as const,
        matchedRule: `Admin manually assigned to ${rule.categoryLabel}`
      };
    }
    return gm;
  });

  const categoryBreakdown: Record<string, number> = {};
  const confidenceSummary = { exact: 0, high: 0, medium: 0, default: 0, custom: 0 };

  updatedChannels.forEach(ch => {
    categoryBreakdown[ch.category] = (categoryBreakdown[ch.category] || 0) + 1;
    confidenceSummary[ch.confidence] = (confidenceSummary[ch.confidence] || 0) + 1;
  });

  return {
    ...currentResult,
    channels: updatedChannels,
    groupMappings: updatedGroupMappings,
    categoryBreakdown,
    confidenceSummary
  };
}
