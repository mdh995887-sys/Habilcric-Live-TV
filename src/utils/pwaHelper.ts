import { AppSettings } from '../types';

/**
 * Dynamically updates the browser favicon, apple-touch-icon, title, and PWA manifest
 * whenever the application branding or logo changes.
 */
export function applyDynamicAppBranding(appSettings: AppSettings) {
  if (typeof document === 'undefined') return;

  const appName = appSettings.appName || 'BD LIVE SPORTS TV';
  const logo = appSettings.appLogo || '/icon.svg';
  const tagline = appSettings.tagline || 'High performance Live Sports & TV streaming platform';
  const themeColor = appSettings.themeColor || '#070b14';

  // 1. Update Document Title
  document.title = appName;

  // 2. Update Meta Description and OpenGraph
  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) descMeta.setAttribute('content', `${appName} - ${tagline}`);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', appName);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', `${appName} - ${tagline}`);

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) {
    ogImage.setAttribute('content', logo);
  } else {
    const meta = document.createElement('meta');
    meta.setAttribute('property', 'og:image');
    meta.setAttribute('content', logo);
    document.head.appendChild(meta);
  }

  // 3. Update Theme Color Meta Tag
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute('content', themeColor);

  // 4. Update Favicon & Apple Touch Icon
  let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    document.head.appendChild(favicon);
  }
  favicon.type = logo.endsWith('.svg') || logo.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png';
  favicon.href = logo;

  let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
  if (!appleTouchIcon) {
    appleTouchIcon = document.createElement('link');
    appleTouchIcon.rel = 'apple-touch-icon';
    document.head.appendChild(appleTouchIcon);
  }
  appleTouchIcon.href = logo;

  // 5. Dynamically Update Web App Manifest
  try {
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    const shortName = appName.length > 12 ? appName.substring(0, 12).trim() : appName;

    const manifestData = {
      id: '/',
      short_name: shortName,
      name: appName,
      description: `${appName} - ${tagline}`,
      icons: [
        {
          src: logo,
          sizes: '192x192 512x512',
          type: logo.endsWith('.svg') || logo.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png',
          purpose: 'any maskable'
        }
      ],
      start_url: '/',
      background_color: '#070b14',
      theme_color: themeColor,
      display: 'standalone',
      orientation: 'any',
      categories: ['sports', 'entertainment', 'tv']
    };

    const manifestBlob = new Blob([JSON.stringify(manifestData)], { type: 'application/manifest+json' });
    const manifestObjectUrl = URL.createObjectURL(manifestBlob);

    if (manifestLink) {
      manifestLink.href = manifestObjectUrl;
    } else {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = manifestObjectUrl;
      document.head.appendChild(link);
    }
  } catch (err) {
    console.warn('[PWA] Could not dynamically inject manifest blob:', err);
  }
}
