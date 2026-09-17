/**
 * BD LIVE SPORTS TV - Core Application Logic
 * Supports 500 International Sports TV Channels
 * Features HLS Stream Player, Failover, Online Verification, TV Mode, Filters & Search
 */

(function () {
  'use strict';

  // Global State
  let channels = [];
  let filteredChannels = [];
  let currentChannel = null;
  let hlsInstance = null;
  let isTvMode = false;
  let favorites = new Set();
  let osdTimeout = null;

  // Selected filters
  let searchQuery = '';
  let selectedCategory = 'ALL';
  let selectedCountry = 'ALL';
  let onlineOnly = false;
  let favoritesOnly = false;
  let sortBy = 'number-asc';

  // DOM Elements
  const videoElement = document.getElementById('main-video');
  const playerSection = document.getElementById('player-section');
  const playPauseBtn = document.getElementById('play-pause-btn');
  const muteBtn = document.getElementById('mute-btn');
  const volumeSlider = document.getElementById('volume-slider');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const prevBtn = document.getElementById('prev-channel-btn');
  const nextBtn = document.getElementById('next-channel-btn');
  const tvModeBtn = document.getElementById('tv-mode-btn');

  const playerLogo = document.getElementById('player-logo');
  const playerChNum = document.getElementById('player-ch-num');
  const playerChName = document.getElementById('player-ch-name');
  const playerLiveBadge = document.getElementById('player-live-badge');
  const playerStatusBadge = document.getElementById('player-status-badge');
  const playerQualityBadge = document.getElementById('player-quality-badge');
  const nowPlayingText = document.getElementById('now-playing-text');
  const videoOverlayMsg = document.getElementById('video-overlay-msg');
  const overlayDesc = document.getElementById('overlay-desc');
  const overlayRetryBtn = document.getElementById('overlay-retry-btn');

  // TV Mode OSD Elements
  const tvOsd = document.getElementById('tv-osd');
  const tvOsdControls = document.getElementById('tv-osd-controls');
  const tvOsdLogo = document.getElementById('tv-osd-logo');
  const tvOsdTitle = document.getElementById('tv-osd-title');
  const tvOsdSubtitle = document.getElementById('tv-osd-subtitle');
  const tvPrevBtn = document.getElementById('tv-prev-btn');
  const tvNextBtn = document.getElementById('tv-next-btn');
  const tvMuteBtn = document.getElementById('tv-mute-btn');
  const tvExitBtn = document.getElementById('tv-exit-btn');

  // Filter Elements
  const searchInput = document.getElementById('search-input');
  const countryFilter = document.getElementById('country-filter');
  const sortFilter = document.getElementById('sort-filter');
  const onlineFilterCheckbox = document.getElementById('online-filter-checkbox');
  const favFilterBtn = document.getElementById('fav-filter-btn');
  const categoryTabsContainer = document.getElementById('category-tabs');
  const channelGrid = document.getElementById('channel-grid');
  const channelCounter = document.getElementById('channel-counter');

  // Categories definition
  const CATEGORIES = [
    { name: 'ALL', label: 'All Channels', icon: '📺' },
    { name: 'Cricket', label: 'Cricket', icon: '🏏' },
    { name: 'Football', label: 'Football', icon: '⚽' },
    { name: 'Basketball', label: 'Basketball', icon: '🏀' },
    { name: 'Tennis', label: 'Tennis', icon: '🎾' },
    { name: 'Motorsport', label: 'Motorsport', icon: '🏎' },
    { name: 'Boxing', label: 'Boxing', icon: '🥊' },
    { name: 'Wrestling', label: 'Wrestling', icon: '🤼' },
    { name: 'Golf', label: 'Golf', icon: '🏌' },
    { name: 'Rugby', label: 'Rugby', icon: '🏉' },
    { name: 'Baseball', label: 'Baseball', icon: '⚾' },
    { name: 'Athletics', label: 'Athletics', icon: '🏃' },
    { name: 'Multi-Sport', label: 'Multi-Sport', icon: '🌐' }
  ];

  // Initialize Application
  async function init() {
    loadFavoritesFromStorage();
    renderCategoryTabs();
    setupEventListeners();
    await loadChannels();
    populateCountryFilter();
    applyFiltersAndRender();

    // Auto-select first online channel or first channel
    const initial = channels.find(c => c.status === 'online') || channels[0];
    if (initial) {
      loadChannel(initial, false);
    }
  }

  // Load Favorites from localStorage
  function loadFavoritesFromStorage() {
    try {
      const saved = localStorage.getItem('bd_sports_favs');
      if (saved) {
        favorites = new Set(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Storage unavailable', e);
    }
  }

  function saveFavoritesToStorage() {
    try {
      localStorage.setItem('bd_sports_favs', JSON.stringify(Array.from(favorites)));
    } catch (e) {
      console.warn('Storage unavailable', e);
    }
  }

  // Fetch Channels from channels.json
  async function loadChannels() {
    try {
      const res = await fetch('./channels.json');
      if (res.ok) {
        channels = await res.json();
      } else {
        throw new Error('channels.json fetch returned status ' + res.status);
      }
    } catch (err) {
      console.warn('Could not fetch channels.json, using fallback database:', err);
      // Fallback 12 default channels if fetch is restricted
      channels = getFallbackChannels();
    }
  }

  function getFallbackChannels() {
    const demos = [
      {
        id: 'ch-001',
        channelNumber: 1,
        name: 'T Sports HD (DEMO Live)',
        country: 'Bangladesh',
        category: 'Cricket',
        language: 'Bangla / English',
        logo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&auto=format&fit=crop&q=80',
        streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        streamType: 'HLS',
        status: 'online',
        quality: 'Full HD',
        featured: true
      },
      {
        id: 'ch-002',
        channelNumber: 2,
        name: 'GTV Sports (DEMO Live)',
        country: 'Bangladesh',
        category: 'Cricket',
        language: 'Bangla',
        logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200&auto=format&fit=crop&q=80',
        streamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        streamType: 'HLS',
        status: 'online',
        quality: 'Full HD',
        featured: true
      },
      {
        id: 'ch-003',
        channelNumber: 3,
        name: 'Akamai International Arena (DEMO)',
        country: 'International',
        category: 'Football',
        language: 'English',
        logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=200&auto=format&fit=crop&q=80',
        streamUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        streamType: 'HLS',
        status: 'online',
        quality: '4K',
        featured: true
      },
      {
        id: 'ch-004',
        channelNumber: 4,
        name: 'Mux Sports Global HD (DEMO)',
        country: 'International',
        category: 'Multi-Sport',
        language: 'English',
        logo: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=200&auto=format&fit=crop&q=80',
        streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        streamType: 'HLS',
        status: 'online',
        quality: 'Full HD',
        featured: true
      }
    ];

    // Add empty offline slots for remainder up to 500
    for (let i = 5; i <= 500; i++) {
      demos.push({
        id: `ch-${String(i).padStart(3, '0')}`,
        channelNumber: i,
        name: `Sports Broadcast Channel ${i}`,
        country: 'International',
        category: 'Multi-Sport',
        language: 'English',
        logo: '',
        streamUrl: '',
        streamType: 'HLS',
        status: 'offline',
        quality: 'HD',
        featured: false
      });
    }
    return demos;
  }

  // Populate Countries in Dropdown
  function populateCountryFilter() {
    const countries = new Set();
    channels.forEach(c => {
      if (c.country) countries.add(c.country);
    });

    const sortedCountries = Array.from(countries).sort();
    countryFilter.innerHTML = '<option value="ALL">All Countries</option>';
    sortedCountries.forEach(country => {
      const opt = document.createElement('option');
      opt.value = country;
      opt.textContent = country;
      countryFilter.appendChild(opt);
    });
  }

  // Render Category Tabs
  function renderCategoryTabs() {
    categoryTabsContainer.innerHTML = '';
    CATEGORIES.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `cat-chip ${cat.name === selectedCategory ? 'active' : ''}`;
      btn.dataset.category = cat.name;
      btn.innerHTML = `<span>${cat.icon}</span> <span>${cat.label}</span>`;
      btn.addEventListener('click', () => {
        selectedCategory = cat.name;
        document.querySelectorAll('.cat-chip').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
        applyFiltersAndRender();
      });
      categoryTabsContainer.appendChild(btn);
    });
  }

  // Filter & Sort Channels
  function applyFiltersAndRender() {
    filteredChannels = channels.filter(channel => {
      // Category filter
      if (selectedCategory !== 'ALL' && channel.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Country filter
      if (selectedCountry !== 'ALL' && channel.country !== selectedCountry) {
        return false;
      }

      // Online only
      if (onlineOnly && channel.status !== 'online') {
        return false;
      }

      // Favorites only
      if (favoritesOnly && !favorites.has(channel.id)) {
        return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchName = channel.name.toLowerCase().includes(q);
        const matchNum = String(channel.channelNumber).includes(q);
        const matchCat = channel.category.toLowerCase().includes(q);
        const matchCountry = channel.country && channel.country.toLowerCase().includes(q);
        if (!matchName && !matchNum && !matchCat && !matchCountry) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    filteredChannels.sort((a, b) => {
      if (sortBy === 'number-asc') return a.channelNumber - b.channelNumber;
      if (sortBy === 'number-desc') return b.channelNumber - a.channelNumber;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      return 0;
    });

    renderChannelGrid();
  }

  // Render Channel Cards Grid
  function renderChannelGrid() {
    channelGrid.innerHTML = '';
    channelCounter.textContent = `${filteredChannels.length} / ${channels.length} Channels`;

    if (filteredChannels.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-grid-msg';
      emptyDiv.innerHTML = `
        <div class="empty-icon">🔍</div>
        <h3 style="font-size:16px;font-weight:700;color:#fff;margin-bottom:4px;">No channels found</h3>
        <p style="font-size:13px;">Try adjusting your search or filter options</p>
      `;
      channelGrid.appendChild(emptyDiv);
      return;
    }

    filteredChannels.forEach(channel => {
      const card = document.createElement('div');
      card.className = `channel-card ${currentChannel && currentChannel.id === channel.id ? 'active' : ''}`;
      card.dataset.id = channel.id;

      const isFav = favorites.has(channel.id);
      const isOnline = channel.status === 'online';

      card.innerHTML = `
        <button class="card-fav-btn ${isFav ? 'active' : ''}" title="Favorite channel" data-fav-id="${channel.id}">
          ★
        </button>
        <div class="card-logo-wrap">
          <img 
            src="${channel.logo || generatePlaceholderLogo(channel)}" 
            alt="${channel.name}" 
            class="card-logo-img" 
            loading="lazy"
            onerror="this.onerror=null;this.src='${generatePlaceholderLogo(channel)}'"
          />
        </div>
        <span class="card-ch-num">CH ${String(channel.channelNumber).padStart(3, '0')}</span>
        <h4 class="card-ch-name" title="${channel.name}">${channel.name}</h4>
        <div class="card-meta">${channel.country} • ${channel.category}</div>
        <div class="card-status-pill ${isOnline ? 'online' : 'offline'}">
          ${isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
        </div>
      `;

      // Click card to play channel
      card.addEventListener('click', (e) => {
        if (e.target.closest('.card-fav-btn')) return;
        loadChannel(channel, true);
      });

      // Favorite toggle
      const favBtn = card.querySelector('.card-fav-btn');
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(channel.id);
      });

      channelGrid.appendChild(card);
    });
  }

  // Placeholder SVG generator for fallback
  function generatePlaceholderLogo(channel) {
    const initials = channel.name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || 'TV';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="20" fill="#0f172a" stroke="#0284c7" stroke-width="2"/>
      <text x="60" y="68" font-family="sans-serif" font-size="26" font-weight="900" fill="#38bdf8" text-anchor="middle">${initials}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // Toggle Favorite
  function toggleFavorite(channelId) {
    if (favorites.has(channelId)) {
      favorites.delete(channelId);
    } else {
      favorites.add(channelId);
    }
    saveFavoritesToStorage();
    applyFiltersAndRender();
  }

  // ================= 1. VIDEO PLAYER & HLS LOGIC =================
  function loadChannel(channel, shouldAutoPlay = true) {
    currentChannel = channel;

    // Update Player UI Headers
    playerChNum.textContent = `CH ${String(channel.channelNumber).padStart(3, '0')}`;
    playerChName.textContent = channel.name;
    playerLogo.src = channel.logo || generatePlaceholderLogo(channel);
    playerQualityBadge.textContent = channel.quality || 'HD';
    nowPlayingText.innerHTML = `Now Playing: <b>CH ${String(channel.channelNumber).padStart(3, '0')} - ${channel.name}</b> (${channel.country})`;

    // Update TV Mode OSD
    tvOsdTitle.textContent = channel.name;
    tvOsdSubtitle.textContent = `CH ${String(channel.channelNumber).padStart(3, '0')} • ${channel.country} • ${channel.category}`;
    tvOsdLogo.src = channel.logo || generatePlaceholderLogo(channel);

    // Update active highlight in Grid
    document.querySelectorAll('.channel-card').forEach(card => {
      if (card.dataset.id === channel.id) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // Check if channel has configured stream
    if (!channel.streamUrl || channel.streamUrl.trim() === '') {
      updateChannelOnlineStatus(channel, false);
      showVideoOverlay(
        '🔴 Channel Offline',
        `No authorized streaming source configured for ${channel.name}. Administrator can set an authorized stream URL in channels.json.`
      );
      cleanUpPlayer();
      return;
    }

    hideVideoOverlay();

    // Clean up previous HLS instance
    cleanUpPlayer();

    const streamUrl = channel.streamUrl;
    const isHls = streamUrl.includes('.m3u8') || channel.streamType === 'HLS';

    if (isHls) {
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 60,
          manifestLoadingTimeOut: 12000,
          manifestLoadingMaxRetry: 3
        });

        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(videoElement);

        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => {
          updateChannelOnlineStatus(channel, true);
          if (shouldAutoPlay) {
            videoElement.play().catch(e => {
              console.log('Autoplay deferred until user interaction', e);
            });
          }
        });

        hlsInstance.on(window.Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.warn('HLS stream network notice:', data.type, data.details);
            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              if (channel.backupStreamUrl && streamUrl !== channel.backupStreamUrl) {
                console.warn('Switching to backup stream URL:', channel.backupStreamUrl);
                hlsInstance.loadSource(channel.backupStreamUrl);
                hlsInstance.startLoad();
                return;
              }
              hlsInstance.startLoad();
            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              hlsInstance.recoverMediaError();
              return;
            }
            updateChannelOnlineStatus(channel, false);
            showVideoOverlay(
              '⚠️ Channel Offline',
              `The stream for ${channel.name} is currently unreachable. Press NEXT to skip to the next available online channel.`
            );
          }
        });
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Apple HLS (Safari/iOS)
        videoElement.src = streamUrl;
        videoElement.addEventListener('loadedmetadata', () => {
          updateChannelOnlineStatus(channel, true);
          if (shouldAutoPlay) {
            videoElement.play().catch(e => console.log('Autoplay deferred', e));
          }
        }, { once: true });

        videoElement.addEventListener('error', () => {
          updateChannelOnlineStatus(channel, false);
          showVideoOverlay(
            '⚠️ Stream Error',
            `Playback failed for ${channel.name}. The stream may be offline or restricted.`
          );
        }, { once: true });
      } else {
        showVideoOverlay('Browser Incompatible', 'Your browser does not support HLS playback.');
      }
    } else {
      // Standard MP4 / WebM
      videoElement.src = streamUrl;
      if (shouldAutoPlay) {
        videoElement.play().then(() => {
          updateChannelOnlineStatus(channel, true);
        }).catch(() => {
          // Autoplay interaction needed
        });
      }
    }
  }

  function cleanUpPlayer() {
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
    videoElement.pause();
    videoElement.removeAttribute('src');
    videoElement.load();
    playerLiveBadge.style.display = 'none';
  }

  function updateChannelOnlineStatus(channel, isOnline) {
    channel.status = isOnline ? 'online' : 'offline';

    // Update status badge on player
    playerStatusBadge.className = `badge-status ${isOnline ? 'online' : 'offline'}`;
    playerStatusBadge.innerHTML = isOnline ? '🟢 ONLINE' : '🔴 OFFLINE';

    // Update in DOM card if present
    const card = document.querySelector(`.channel-card[data-id="${channel.id}"] .card-status-pill`);
    if (card) {
      card.className = `card-status-pill ${isOnline ? 'online' : 'offline'}`;
      card.innerHTML = isOnline ? '🟢 ONLINE' : '🔴 OFFLINE';
    }
  }

  function showVideoOverlay(title, desc) {
    const overlayTitle = videoOverlayMsg.querySelector('.overlay-title');
    overlayTitle.textContent = title;
    overlayDesc.textContent = desc;
    videoOverlayMsg.classList.remove('hidden');
    playerLiveBadge.style.display = 'none';
  }

  function hideVideoOverlay() {
    videoOverlayMsg.classList.add('hidden');
  }

  // ================= 2. NEXT & PREVIOUS CHANNEL LOGIC (AUTO-SKIP OFFLINE) =================
  function switchToNextOnlineChannel() {
    if (!currentChannel || channels.length === 0) return;

    const currentIdx = channels.findIndex(c => c.id === currentChannel.id);
    let nextIdx = (currentIdx + 1) % channels.length;

    // Search for next ONLINE channel (Requirement 2 & 5: Automatically skip offline channels!)
    let foundChannel = null;
    let checkedCount = 0;

    while (checkedCount < channels.length) {
      const candidate = channels[nextIdx];
      if (candidate.status === 'online') {
        foundChannel = candidate;
        break;
      }
      nextIdx = (nextIdx + 1) % channels.length;
      checkedCount++;
    }

    // Fallback if no other channel is marked online yet: pick next channel in list
    if (!foundChannel) {
      foundChannel = channels[(currentIdx + 1) % channels.length];
    }

    loadChannel(foundChannel, true);
  }

  function switchToPrevOnlineChannel() {
    if (!currentChannel || channels.length === 0) return;

    const currentIdx = channels.findIndex(c => c.id === currentChannel.id);
    let prevIdx = (currentIdx - 1 + channels.length) % channels.length;

    // Search for previous ONLINE channel
    let foundChannel = null;
    let checkedCount = 0;

    while (checkedCount < channels.length) {
      const candidate = channels[prevIdx];
      if (candidate.status === 'online') {
        foundChannel = candidate;
        break;
      }
      prevIdx = (prevIdx - 1 + channels.length) % channels.length;
      checkedCount++;
    }

    if (!foundChannel) {
      prevIdx = (currentIdx - 1 + channels.length) % channels.length;
      foundChannel = channels[prevIdx];
    }

    loadChannel(foundChannel, true);
  }

  // ================= 9. TV MODE IMPLEMENTATION =================
  function toggleTvMode() {
    isTvMode = !isTvMode;

    if (isTvMode) {
      playerSection.classList.add('tv-mode-active');
      showTvOsd();

      // Request browser fullscreen on player section
      if (playerSection.requestFullscreen) {
        playerSection.requestFullscreen().catch(() => {});
      } else if (playerSection.webkitRequestFullscreen) {
        playerSection.webkitRequestFullscreen();
      }
    } else {
      playerSection.classList.remove('tv-mode-active');
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  function showTvOsd() {
    tvOsd.classList.remove('hidden');
    tvOsdControls.classList.remove('hidden');

    clearTimeout(osdTimeout);
    osdTimeout = setTimeout(() => {
      if (isTvMode && !videoElement.paused) {
        tvOsd.classList.add('hidden');
        tvOsdControls.classList.add('hidden');
      }
    }, 4000);
  }

  // ================= EVENT LISTENERS =================
  function setupEventListeners() {
    // Video Playback Events
    videoElement.addEventListener('playing', () => {
      playerLiveBadge.style.display = 'inline-flex';
      playPauseBtn.innerHTML = '⏸ Pause';
      hideVideoOverlay();
    });

    videoElement.addEventListener('pause', () => {
      playPauseBtn.innerHTML = '▶ Play';
    });

    videoElement.addEventListener('error', () => {
      if (currentChannel) {
        updateChannelOnlineStatus(currentChannel, false);
      }
    });

    // Play / Pause Toggle
    playPauseBtn.addEventListener('click', () => {
      if (videoElement.paused) {
        videoElement.play().catch(e => console.log(e));
      } else {
        videoElement.pause();
      }
    });

    // Mute / Unmute
    muteBtn.addEventListener('click', () => {
      videoElement.muted = !videoElement.muted;
      muteBtn.innerHTML = videoElement.muted ? '🔇 Unmute' : '🔊 Mute';
      if (tvMuteBtn) {
        tvMuteBtn.innerHTML = videoElement.muted ? '🔇 Unmute' : '🔊 Mute';
      }
    });

    // Volume Slider
    volumeSlider.addEventListener('input', (e) => {
      videoElement.volume = parseFloat(e.target.value);
      videoElement.muted = videoElement.volume === 0;
      muteBtn.innerHTML = videoElement.muted ? '🔇 Unmute' : '🔊 Mute';
    });

    // Fullscreen Toggle
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        playerSection.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Quick Channel Navigation Buttons
    prevBtn.addEventListener('click', switchToPrevOnlineChannel);
    nextBtn.addEventListener('click', switchToNextOnlineChannel);
    tvModeBtn.addEventListener('click', toggleTvMode);

    // TV OSD Buttons
    tvPrevBtn.addEventListener('click', switchToPrevOnlineChannel);
    tvNextBtn.addEventListener('click', switchToNextOnlineChannel);
    tvMuteBtn.addEventListener('click', () => {
      videoElement.muted = !videoElement.muted;
      tvMuteBtn.innerHTML = videoElement.muted ? '🔇 Unmute' : '🔊 Mute';
      muteBtn.innerHTML = videoElement.muted ? '🔇 Unmute' : '🔊 Mute';
    });
    tvExitBtn.addEventListener('click', toggleTvMode);

    // Overlay Retry
    overlayRetryBtn.addEventListener('click', () => {
      if (currentChannel) {
        loadChannel(currentChannel, true);
      }
    });

    // Search Input
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      applyFiltersAndRender();
    });

    // Country Filter
    countryFilter.addEventListener('change', (e) => {
      selectedCountry = e.target.value;
      applyFiltersAndRender();
    });

    // Sort Filter
    sortFilter.addEventListener('change', (e) => {
      sortBy = e.target.value;
      applyFiltersAndRender();
    });

    // Online Only Checkbox
    onlineFilterCheckbox.addEventListener('change', (e) => {
      onlineOnly = e.target.checked;
      applyFiltersAndRender();
    });

    // Favorites Filter Button
    favFilterBtn.addEventListener('click', () => {
      favoritesOnly = !favoritesOnly;
      favFilterBtn.classList.toggle('active', favoritesOnly);
      applyFiltersAndRender();
    });

    // Mouse Activity in TV Mode
    playerSection.addEventListener('mousemove', () => {
      if (isTvMode) {
        showTvOsd();
      }
    });

    // Keyboard TV Remote Navigation
    window.addEventListener('keydown', (e) => {
      if (['input', 'textarea'].includes(document.activeElement.tagName.toLowerCase())) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        switchToNextOnlineChannel();
        if (isTvMode) showTvOsd();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        switchToPrevOnlineChannel();
        if (isTvMode) showTvOsd();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        videoElement.volume = Math.min(1, videoElement.volume + 0.1);
        volumeSlider.value = videoElement.volume;
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        videoElement.volume = Math.max(0, videoElement.volume - 0.1);
        volumeSlider.value = videoElement.volume;
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (videoElement.paused) {
          videoElement.play();
        } else {
          videoElement.pause();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleTvMode();
      } else if (e.key === 'Escape' && isTvMode) {
        toggleTvMode();
      }
    });

    // Fullscreen Change detection
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && isTvMode) {
        isTvMode = false;
        playerSection.classList.remove('tv-mode-active');
      }
    });
  }

  // Start app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
