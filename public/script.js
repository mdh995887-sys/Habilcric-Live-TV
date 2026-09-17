/**
 * RESPONSIVE 640×360 MOBILE TV VIDEO PLAYER (VANILLA JAVASCRIPT)
 * Supports Single Touch Show, Exact 2000ms Auto-Hide, Fullscreen, Mute/Seek, Lock, Settings
 */

(function () {
  'use strict';

  // Configurable Video Source
  const VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  const AUTO_HIDE_DELAY = 2000; // Exact 2000ms

  // DOM Elements
  const playerContainer = document.getElementById('playerContainer');
  const videoElement = document.getElementById('videoElement');
  const controlsOverlay = document.getElementById('controlsOverlay');
  const lockBanner = document.getElementById('lockBanner');
  const settingsPopup = document.getElementById('settingsPopup');

  // Controls
  const btnBack = document.getElementById('btnBack');
  const btnChannelList = document.getElementById('btnChannelList');
  const btnChannelGrid = document.getElementById('btnChannelGrid');
  const btnRefresh = document.getElementById('btnRefresh');
  const btnLock = document.getElementById('btnLock');
  const btnDisplayMode = document.getElementById('btnDisplayMode');
  const btnSettings = document.getElementById('btnSettings');
  const btnPrev = document.getElementById('btnPrev');
  const btnReplay = document.getElementById('btnReplay');
  const btnPlayPause = document.getElementById('btnPlayPause');
  const btnForward = document.getElementById('btnForward');
  const btnNext = document.getElementById('btnNext');
  const btnVolume = document.getElementById('btnVolume');
  const btnFullscreen = document.getElementById('btnFullscreen');

  // State
  let controlsVisible = true;
  let hideTimer = null;
  let isLocked = false;
  let displayModeIndex = 0;
  const displayModes = ['contain', 'cover', 'fill'];

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  // Auto-hide controls after exactly 2000ms of inactivity
  function showControls() {
    if (isLocked) return;
    controlsVisible = true;
    if (controlsOverlay) controlsOverlay.classList.remove('hidden');

    if (hideTimer) {
      clearTimeout(hideTimer);
    }

    hideTimer = setTimeout(function () {
      hideControls();
    }, AUTO_HIDE_DELAY);
  }

  function hideControls() {
    controlsVisible = false;
    if (controlsOverlay) controlsOverlay.classList.add('hidden');
    if (settingsPopup) settingsPopup.classList.add('hidden');
  }

  function onUserInteraction() {
    if (isLocked) return;
    showControls();
  }

  if (playerContainer) {
    playerContainer.addEventListener('pointerdown', onUserInteraction);
    playerContainer.addEventListener('touchstart', onUserInteraction, { passive: true });
    playerContainer.addEventListener('mousemove', onUserInteraction);
    playerContainer.addEventListener('keydown', onUserInteraction);
    playerContainer.addEventListener('click', onUserInteraction);
  }

  // Play / Pause
  function togglePlayPause() {
    if (!videoElement) return;
    if (videoElement.paused) {
      videoElement.play().catch(function () {});
    } else {
      videoElement.pause();
    }
    showControls();
  }

  if (btnPlayPause) {
    btnPlayPause.addEventListener('click', function (e) {
      e.stopPropagation();
      togglePlayPause();
    });
  }

  // Refresh
  if (btnRefresh && videoElement) {
    btnRefresh.addEventListener('click', function (e) {
      e.stopPropagation();
      const t = videoElement.currentTime;
      videoElement.load();
      videoElement.currentTime = t;
      videoElement.play().catch(function () {});
      showControls();
    });
  }

  // Lock
  if (btnLock) {
    btnLock.addEventListener('click', function (e) {
      e.stopPropagation();
      isLocked = true;
      hideControls();
      if (lockBanner) lockBanner.classList.remove('hidden');
    });
  }

  if (lockBanner) {
    lockBanner.addEventListener('click', function (e) {
      e.stopPropagation();
      isLocked = false;
      lockBanner.classList.add('hidden');
      showControls();
    });
  }

  // Fullscreen
  function toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (playerContainer.requestFullscreen) {
        playerContainer.requestFullscreen();
      } else if (playerContainer.webkitRequestFullscreen) {
        playerContainer.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
    showControls();
  }

  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleFullscreen();
    });
  }

  // Navigation handlers (Placeholders ready to connect to app)
  window.handleBackButton = function () {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }
    console.log("Back button clicked");
  };

  if (btnBack) {
    btnBack.addEventListener('click', function (e) {
      e.stopPropagation();
      window.handleBackButton();
    });
  }

  // Initial show
  showControls();

})();
