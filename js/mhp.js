/* ---------------------------------------------------------------
   MHP Centrum - consent and conversion tracking

   Nothing loads until the visitor agrees. That is not a nicety: in
   the Netherlands analytics and advertising cookies need consent
   before they are set, and the site's own privacyverklaring says so
   in artikel 8.

   Leave an ID empty and that tag is simply skipped, so this file is
   safe to ship before the accounts exist.
   --------------------------------------------------------------- */

(function () {
  'use strict';

  // -------------------------------------------------------------
  // 1. Fill these in. Empty = that platform is not loaded at all.
  // -------------------------------------------------------------
  var CONFIG = {
    ga4:       '',   // Google Analytics 4,   e.g. 'G-XXXXXXXXXX'
    adsId:     'AW-18490080782',   // Google Ads
    adsLabel:  '',   // Ads conversion label, e.g. 'AbC-D_efG'
    metaPixel: ''    // Meta pixel,           e.g. '1234567890'
  };

  var STORE = 'mhp-consent';
  var VERSION = 1;          // bump to ask everyone again
  var loaded = false;

  // -------------------------------------------------------------
  // 2. Consent Mode v2 - defaults must be set before any Google tag
  // -------------------------------------------------------------
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });

  // -------------------------------------------------------------
  // 3. Reading and writing the choice
  // -------------------------------------------------------------
  function readChoice() {
    try {
      var raw = localStorage.getItem(STORE);
      if (!raw) return null;
      var v = JSON.parse(raw);
      return (v && v.version === VERSION) ? v : null;
    } catch (e) {
      return null;           // private window, blocked storage
    }
  }

  function writeChoice(accepted) {
    try {
      localStorage.setItem(STORE, JSON.stringify({
        version: VERSION,
        accepted: !!accepted,
        at: new Date().toISOString()
      }));
    } catch (e) { /* nothing we can do, and nothing that matters */ }
  }

  // -------------------------------------------------------------
  // 4. Loading the tags, once, after consent
  // -------------------------------------------------------------
  function script(src) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
    return s;
  }

  function loadTags() {
    if (loaded) return;
    loaded = true;

    var googleId = CONFIG.ga4 || CONFIG.adsId;
    if (googleId) {
      script('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(googleId));
      gtag('js', new Date());
      if (CONFIG.ga4)   gtag('config', CONFIG.ga4);
      if (CONFIG.adsId) gtag('config', CONFIG.adsId);
    }

    if (CONFIG.metaPixel) {
      /* eslint-disable */
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
      (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
      window.fbq('init', CONFIG.metaPixel);
      window.fbq('track', 'PageView');
    }
  }

  function grant() {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted'
    });
    loadTags();
  }

  // -------------------------------------------------------------
  // 5. Conversions
  //
  // Call mhpTrack('lead', {soort: 'contactformulier'}) wherever an
  // enquiry actually succeeds. Queued if consent has not been given,
  // and simply dropped if it never is - which is the point.
  // -------------------------------------------------------------
  window.mhpTrack = function (name, params) {
    params = params || {};
    var choice = readChoice();
    if (!choice || !choice.accepted) return;

    if (CONFIG.ga4) {
      gtag('event', name, params);
    }
    if (CONFIG.adsId && CONFIG.adsLabel && name === 'lead') {
      gtag('event', 'conversion', {
        send_to: CONFIG.adsId + '/' + CONFIG.adsLabel
      });
    }
    if (window.fbq) {
      window.fbq('track', name === 'lead' ? 'Lead' : 'Contact', params);
    }
  };

  // -------------------------------------------------------------
  // 6. The banner
  // -------------------------------------------------------------
  function styles() {
    if (document.getElementById('mhp-consent-css')) return;
    var css = document.createElement('style');
    css.id = 'mhp-consent-css';
    css.textContent = [
      '.mhp-cc{position:fixed;left:0;right:0;bottom:0;z-index:9999;',
      'background:#f2f2ec;color:#1a1d18;border-top:1px solid rgba(26,29,24,.18);',
      'box-shadow:0 -6px 24px rgba(26,29,24,.12);',
      'font:14px/1.6 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
      'padding:18px max(16px,env(safe-area-inset-left)) calc(18px + env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-right));}',
      '.mhp-cc-in{max-width:1100px;margin:0 auto;display:flex;gap:20px;',
      'align-items:center;justify-content:space-between;flex-wrap:wrap;}',
      '.mhp-cc p{margin:0;max-width:62ch;}',
      '.mhp-cc a{color:#56400f;}',
      '.mhp-cc-btns{display:flex;gap:10px;flex-wrap:wrap;}',
      '.mhp-cc button{font:inherit;font-size:13px;padding:11px 20px;border-radius:2px;',
      'cursor:pointer;border:1px solid rgba(26,29,24,.28);background:transparent;color:#1a1d18;}',
      '.mhp-cc button.ok{background:#56400f;border-color:#56400f;color:#fff;}',
      '.mhp-cc button:hover{border-color:#56400f;}',
      '.mhp-cc button.ok:hover{background:#7a5c20;}',
      '@media(max-width:620px){.mhp-cc-in{gap:14px}.mhp-cc-btns{width:100%}',
      '.mhp-cc button{flex:1 1 auto}}'
    ].join('');
    document.head.appendChild(css);
  }

  function hide() {
    var el = document.querySelector('.mhp-cc');
    if (el) el.remove();
  }

  function show() {
    if (document.querySelector('.mhp-cc')) return;
    styles();

    var bar = document.createElement('div');
    bar.className = 'mhp-cc';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookies');
    bar.innerHTML =
      '<div class="mhp-cc-in">' +
        '<p>Wij gebruiken cookies om te meten hoe de site gebruikt wordt en hoe bezoekers ons ' +
        'vinden. Dat doen we alleen met uw toestemming. Weigert u, dan plaatsen wij niets en ' +
        'werkt de site gewoon. Meer hierover in onze ' +
        '<a href="/privacyverklaring.html">privacyverklaring</a>.</p>' +
        '<div class="mhp-cc-btns">' +
          '<button type="button" data-mhp="no">Weigeren</button>' +
          '<button type="button" class="ok" data-mhp="yes">Accepteren</button>' +
        '</div>' +
      '</div>';

    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-mhp]');
      if (!b) return;
      var yes = b.getAttribute('data-mhp') === 'yes';
      writeChoice(yes);
      hide();
      if (yes) grant();
    });

    document.body.appendChild(bar);
  }

  // Lets the footer offer "cookievoorkeur wijzigen".
  window.mhpConsentReopen = function () {
    try { localStorage.removeItem(STORE); } catch (e) {}
    loaded = false;
    show();
  };

  // -------------------------------------------------------------
  // 7. Start
  // -------------------------------------------------------------
  function start() {
    var choice = readChoice();
    if (choice && choice.accepted) {
      grant();
    } else if (!choice) {
      show();
    }
    // choice && !choice.accepted: they declined. Load nothing, ask nothing.

    // Footer link: change your mind.
    document.addEventListener('click', function (e) {
      var r = e.target.closest('[data-mhp-reopen]');
      if (!r) return;
      e.preventDefault();
      window.mhpConsentReopen();
    });

    // Phone and WhatsApp taps are enquiries too, and on mobile they
    // are often the only one someone makes.
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="tel:"], a[href*="wa.me"]');
      if (!a) return;
      window.mhpTrack('contact', {
        soort: a.getAttribute('href').indexOf('tel:') === 0 ? 'telefoon' : 'whatsapp'
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
