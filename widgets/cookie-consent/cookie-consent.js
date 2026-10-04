/*!
 * Cookie Consent — drop-in, framework-agnostic, no build step, no dependencies.
 *
 * Implements the consent logic the web-compliance skill's cookie-banner
 * template describes:
 *   - Google Tag Manager Consent Mode v2 (default denied → update on choice)
 *   - Global Privacy Control honoured automatically (navigator.globalPrivacyControl)
 *   - Geo-aware model: opt-in (EU / UK / Israel) vs opt-out (US, California)
 *   - UK first-party-analytics exemption (DUAA 2025, PECR from 5 Feb 2026)
 *   - Granular categories (necessary locked, analytics, marketing)
 *   - 4 languages (he, ar, en, ru) with RTL, auto-detected
 *   - Keyboard + screen-reader accessible, WCAG 2.2 AA target sizes
 *
 * NOT LEGAL ADVICE. This is a template implementation. Have a qualified lawyer
 * in each market review it, and confirm your region detection, before relying
 * on it. Region is NOT auto-detected here (that needs a server/geo-IP service):
 * pass `region`, or the widget defaults to the strictest model (opt-in).
 *
 * Usage:
 *   <link rel="stylesheet" href="cookie-consent.css">
 *   <script src="cookie-consent.js"></script>
 *   <script>
 *     CookieConsent.init({
 *       gtmId: 'GTM-XXXXXXX',           // optional
 *       region: 'eu',                   // 'eu'|'uk'|'il'|'us'|'us-ca'|'auto'
 *       language: 'auto',               // 'he'|'ar'|'en'|'ru'|'auto'
 *       privacyPolicyUrl: '/privacy',
 *       brandColor: '#2563eb',
 *       onChange: function (consent) { }   // consent = {analytics, marketing}
 *     });
 *   </script>
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'cc_consent_v1';
  var VERSION = '1.0';
  var EXPIRY_MONTHS = 12;

  // Which markets use which consent model.
  var OPT_IN_REGIONS = ['eu', 'uk', 'il'];
  var OPT_OUT_REGIONS = ['us', 'us-ca'];

  var I18N = {
    en: {
      dir: 'ltr',
      title: 'We value your privacy',
      body: 'We use cookies to run the site and, with your consent, to measure traffic and personalise content. You can accept, reject, or choose what to allow.',
      acceptAll: 'Accept all',
      rejectAll: 'Reject all',
      customize: 'Customize',
      save: 'Save preferences',
      privacy: 'Privacy policy',
      necessary: 'Necessary',
      necessaryDesc: 'Required for core site functions. Always on. See the privacy policy for data handling.',
      analytics: 'Analytics',
      analyticsDesc: 'Measures site usage to help improve the site. See the privacy policy for the tools and data involved.',
      marketing: 'Marketing',
      marketingDesc: 'Advertising pixels — used to show relevant ads and measure campaigns.',
      always: 'Always on',
      gpcNotice: 'You have opted out of sale/sharing via your browser’s privacy signal (GPC). We are honouring it.',
      ukExemptNotice: 'First-party analytics runs without consent here, as permitted for UK visitors; you can still opt out below.',
      doNotSell: 'Do Not Sell or Share My Personal Information'
    },
    he: {
      dir: 'rtl',
      title: 'הפרטיות שלך חשובה לנו',
      body: 'אנו משתמשים בעוגיות להפעלת האתר, ובכפוף להסכמתך, למדידת תנועה והתאמת תוכן. אפשר לאשר, לדחות או לבחור מה להתיר.',
      acceptAll: 'אישור הכול',
      rejectAll: 'דחיית הכול',
      customize: 'התאמה אישית',
      save: 'שמירת העדפות',
      privacy: 'מדיניות פרטיות',
      necessary: 'הכרחיות',
      necessaryDesc: 'נדרשות לפעולות הבסיסיות באתר. תמיד פעילות. פרטי השימוש במידע מופיעים במדיניות הפרטיות.',
      analytics: 'אנליטיקה',
      analyticsDesc: 'מדידת השימוש באתר לצורך שיפורו. הכלים והמידע המעורבים מפורטים במדיניות הפרטיות.',
      marketing: 'שיווק',
      marketingDesc: 'פיקסלים פרסומיים — להצגת מודעות רלוונטיות ומדידת קמפיינים.',
      always: 'תמיד פעיל',
      gpcNotice: 'ביטלת מכירה/שיתוף באמצעות אות הפרטיות של הדפדפן (GPC). אנו מכבדים זאת.',
      ukExemptNotice: 'אנליטיקה מגורם ראשון פועלת ללא הסכמה עבור מבקרים מבריטניה; ניתן לבטל למטה.',
      doNotSell: 'אין למכור או לשתף את המידע האישי שלי'
    },
    ar: {
      dir: 'rtl',
      title: 'نحن نهتم بخصوصيتك',
      body: 'نستخدم ملفات تعريف الارتباط لتشغيل الموقع، وبموافقتك لقياس الزيارات وتخصيص المحتوى. يمكنك القبول أو الرفض أو اختيار ما تسمح به.',
      acceptAll: 'قبول الكل',
      rejectAll: 'رفض الكل',
      customize: 'تخصيص',
      save: 'حفظ التفضيلات',
      privacy: 'سياسة الخصوصية',
      necessary: 'ضرورية',
      necessaryDesc: 'مطلوبة لوظائف الموقع الأساسية. مفعّلة دائمًا. راجع سياسة الخصوصية لمعرفة كيفية التعامل مع البيانات.',
      analytics: 'تحليلات',
      analyticsDesc: 'تقيس استخدام الموقع لتحسينه. راجع سياسة الخصوصية لمعرفة الأدوات والبيانات المستخدمة.',
      marketing: 'تسويق',
      marketingDesc: 'بكسلات إعلانية — لعرض إعلانات ملائمة وقياس الحملات.',
      always: 'مفعّل دائمًا',
      gpcNotice: 'لقد ألغيت البيع/المشاركة عبر إشارة الخصوصية في متصفحك (GPC). نحن نحترمها.',
      ukExemptNotice: 'تعمل التحليلات من الطرف الأول دون موافقة لزوار المملكة المتحدة؛ يمكنك إلغاء الاشتراك أدناه.',
      doNotSell: 'عدم بيع أو مشاركة معلوماتي الشخصية'
    },
    ru: {
      dir: 'ltr',
      title: 'Мы ценим вашу конфиденциальность',
      body: 'Мы используем файлы cookie для работы сайта и, с вашего согласия, для измерения трафика и персонализации контента. Вы можете принять, отклонить или выбрать.',
      acceptAll: 'Принять все',
      rejectAll: 'Отклонить все',
      customize: 'Настроить',
      save: 'Сохранить настройки',
      privacy: 'Политика конфиденциальности',
      necessary: 'Необходимые',
      necessaryDesc: 'Нужны для основных функций сайта. Всегда включены. Обработка данных описана в политике конфиденциальности.',
      analytics: 'Аналитика',
      analyticsDesc: 'Измеряет использование сайта для его улучшения. Инструменты и данные описаны в политике конфиденциальности.',
      marketing: 'Маркетинг',
      marketingDesc: 'Рекламные пиксели — показ релевантной рекламы и оценка кампаний.',
      always: 'Всегда включено',
      gpcNotice: 'Вы отказались от продажи/передачи через сигнал приватности браузера (GPC). Мы его соблюдаем.',
      ukExemptNotice: 'Аналитика первой стороны работает без согласия для посетителей из Великобритании; отказаться можно ниже.',
      doNotSell: 'Не продавать и не передавать мои персональные данные'
    }
  };

  // ---- consent-mode helpers ------------------------------------------------

  function gtag() {
    global.dataLayer = global.dataLayer || [];
    global.dataLayer.push(arguments);
  }

  function pushConsentDefault() {
    // Deny everything until the user chooses (or GPC / region overrides).
    gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      wait_for_update: 2000
    });
  }

  function pushConsentUpdate(consent) {
    gtag('consent', 'update', {
      analytics_storage: consent.analytics ? 'granted' : 'denied',
      ad_storage: consent.marketing ? 'granted' : 'denied',
      ad_user_data: consent.marketing ? 'granted' : 'denied',
      ad_personalization: consent.marketing ? 'granted' : 'denied'
    });
    global.dataLayer = global.dataLayer || [];
    global.dataLayer.push({
      event: 'cookie_consent_update',
      consent_analytics: !!consent.analytics,
      consent_marketing: !!consent.marketing
    });
  }

  // ---- storage -------------------------------------------------------------

  function readStored(region, storageKey) {
    try {
      var raw = global.localStorage.getItem(storageKey || STORAGE_KEY);
      if (!raw || raw.length > 4096) return null;
      var data = JSON.parse(raw);
      if (!data || data.version !== VERSION) return null;
      if (typeof data.analytics !== 'boolean' || typeof data.marketing !== 'boolean') return null;
      if (typeof data.expires !== 'number' || !isFinite(data.expires) || Date.now() > data.expires) return null;
      // A choice made under a different regional model must be collected again.
      if (data.region !== region) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function writeStored(consent, region, language, storageKey) {
    try {
      var now = Date.now();
      var expires = new Date();
      expires.setMonth(expires.getMonth() + EXPIRY_MONTHS);
      global.localStorage.setItem(storageKey || STORAGE_KEY, JSON.stringify({
        version: VERSION,
        analytics: !!consent.analytics,
        marketing: !!consent.marketing,
        region: region,
        language: language,
        timestamp: new Date(now).toISOString(),
        expires: expires.getTime()
      }));
    } catch (e) {
      /* storage unavailable — keep the in-memory choice; ask again on the next visit */
    }
  }

  // ---- widget --------------------------------------------------------------

  var CookieConsent = {
    _cfg: null,
    _consent: null,
    _t: null,
    _model: 'opt_in',
    _gpc: false,
    _root: null,
    _lastFocus: null,

    init: function (config) {
      this._destroy();
      var cfg = config || {};
      this._cfg = cfg;
      this._consent = null;

      var lang = resolveLanguage(cfg.language);
      this._t = Object.assign({}, I18N[lang]);
      // Copy overrides are plain text, scoped to the active language. Keep
      // direction, categories and privacy-signal notices outside this API.
      var copy = cfg.textOverrides && cfg.textOverrides[lang];
      if (copy && typeof copy === 'object') {
        ['title', 'body', 'acceptAll', 'rejectAll', 'customize', 'save', 'privacy'].forEach(function (key) {
          var value = copy[key], limit = key === 'body' ? 1000 : key === 'title' ? 160 : 60;
          if (typeof value === 'string' && value.trim() && value.length <= limit) this._t[key] = value.trim();
        }, this);
      }
      var descriptions = cfg.categoryDescriptions && cfg.categoryDescriptions[lang];
      if (descriptions) {
        ['necessary', 'analytics', 'marketing'].forEach(function (category) {
          if (typeof descriptions[category] === 'string') this._t[category + 'Desc'] = descriptions[category];
        }, this);
      }
      var region = (cfg.region && cfg.region !== 'auto') ? cfg.region : 'auto';
      // 'auto' => we cannot geolocate client-side; default to the strictest model.
      this._model = OPT_OUT_REGIONS.indexOf(region) !== -1 ? 'opt_out' : 'opt_in';
      this._gpc = global.navigator && global.navigator.globalPrivacyControl === true;

      if (cfg.gtmId || global.dataLayer) pushConsentDefault();

      var ukExempt = region === 'uk' && cfg.ukFirstPartyAnalyticsExempt === true;

      var stored = readStored(region, cfg.storageKey);
      if (stored) {
        // Returning visitor with a valid, unexpired choice — apply, no banner.
        this._apply({ analytics: stored.analytics, marketing: stored.marketing }, false);
        return;
      }

      // First visit. Decide the starting state.
      var initial;
      if (this._model === 'opt_out') {
        // Opt-out: processing allowed until the user opts out. GPC forces marketing off.
        initial = { analytics: true, marketing: !this._gpc };
        this._apply(initial, false); // apply immediately (opt-out model)
      } else {
        // Opt-in: nothing non-essential until the user agrees...
        initial = { analytics: !!ukExempt, marketing: false }; // ...except UK first-party analytics
        this._apply(initial, false);
      }

      this._render(lang, region, ukExempt, initial);
    },

    _apply: function (consent, persist) {
      // Browser privacy signals override any previously saved choice.
      consent = { analytics: !!consent.analytics, marketing: !!consent.marketing && !this._gpc };
      this._consent = consent;
      if (this._cfg.gtmId || global.dataLayer) pushConsentUpdate(consent);
      if (persist) writeStored(consent, this._cfg.region || 'auto', resolveLanguage(this._cfg.language), this._cfg.storageKey);
      if (typeof this._cfg.onChange === 'function') {
        try { this._cfg.onChange({ analytics: !!consent.analytics, marketing: !!consent.marketing }); }
        catch (e) { /* consumer callback error — ignore */ }
      }
    },

    _choose: function (consent) {
      this._apply(consent, true);
      this._destroy();
    },

    _render: function (lang, region, ukExempt, initial) {
      var t = this._t;
      var cfg = this._cfg;
      var self = this;
      var optOut = this._model === 'opt_out';

      var root = document.createElement('div');
      root.className = 'cc-root';
      root.setAttribute('dir', t.dir);
      root.setAttribute('lang', lang);
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'false');
      root.setAttribute('aria-label', t.title);
      if (cfg.brandColor) root.style.setProperty('--cc-brand', cfg.brandColor);

      var noticeHtml = '';
      if (this._gpc) noticeHtml += '<p class="cc-notice">' + esc(t.gpcNotice) + '</p>';
      if (ukExempt) noticeHtml += '<p class="cc-notice">' + esc(t.ukExemptNotice) + '</p>';

      var privacyUrl = safePrivacyUrl(cfg.privacyPolicyUrl);
      var privacyHtml = privacyUrl
        ? '<a class="cc-link" href="' + esc(privacyUrl) + '">' + esc(t.privacy) + '</a>'
        : '';

      root.innerHTML =
        '<div class="cc-banner">' +
          '<div class="cc-text">' +
            '<h2 class="cc-title">' + esc(t.title) + '</h2>' +
            '<p class="cc-body">' + esc(t.body) + '</p>' +
            noticeHtml +
            privacyHtml +
          '</div>' +
          '<div class="cc-actions">' +
            (optOut
              ? '<button type="button" class="cc-btn cc-btn-primary" data-cc="optout">' + esc(t.doNotSell) + '</button>'
              : '<button type="button" class="cc-btn cc-btn-primary" data-cc="accept">' + esc(t.acceptAll) + '</button>' +
                '<button type="button" class="cc-btn" data-cc="reject">' + esc(t.rejectAll) + '</button>') +
            '<button type="button" class="cc-btn cc-btn-ghost" data-cc="toggle" aria-expanded="false" aria-controls="cc-panel">' + esc(t.customize) + '</button>' +
          '</div>' +
          '<div class="cc-panel" id="cc-panel" hidden>' +
            row('necessary', t.necessary, t.necessaryDesc, true, true, t.always) +
            row('analytics', t.analytics, t.analyticsDesc, !!initial.analytics, false) +
            row('marketing', t.marketing, t.marketingDesc, !!initial.marketing, false) +
            '<button type="button" class="cc-btn cc-btn-primary cc-save" data-cc="save">' + esc(t.save) + '</button>' +
          '</div>' +
        '</div>';

      this._root = root;
      document.body.appendChild(root);
      this._lastFocus = document.activeElement;

      root.addEventListener('click', function (e) {
        var el = e.target.closest('[data-cc]');
        if (!el) return;
        var action = el.getAttribute('data-cc');
        if (action === 'accept') self._choose({ analytics: true, marketing: !self._gpc });
        else if (action === 'optout') self._choose({ analytics: !!initial.analytics, marketing: false });
        else if (action === 'reject') self._choose({ analytics: false, marketing: false });
        else if (action === 'toggle') self._togglePanel(el);
        else if (action === 'save') {
          var a = root.querySelector('#cc-analytics');
          var m = root.querySelector('#cc-marketing');
          self._choose({
            analytics: a ? a.checked : !!initial.analytics,
            marketing: (m ? m.checked : false) && !self._gpc
          });
        }
      });

      // GPC forces marketing off and disables the control.
      if (this._gpc) {
        var mk = root.querySelector('#cc-marketing');
        if (mk) { mk.checked = false; mk.disabled = true; }
      }

      root.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { self._collapsePanelIfOpen(); }
      });

      // Keep keyboard targets visible in a scrollable, short-screen panel.
      root.addEventListener('focusin', function (e) {
        if (e.target && typeof e.target.scrollIntoView === 'function') {
          e.target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
      });

      // Focus the first action for keyboard users.
      var firstBtn = root.querySelector('.cc-btn');
      if (firstBtn && cfg.autoFocus !== false) firstBtn.focus();
    },

    _togglePanel: function (btn) {
      var panel = this._root.querySelector('#cc-panel');
      var open = !panel.hidden;
      panel.hidden = open;
      btn.setAttribute('aria-expanded', String(!open));
      if (!open) {
        var firstToggle = panel.querySelector('input:not([disabled])');
        if (firstToggle) firstToggle.focus();
      }
    },

    _collapsePanelIfOpen: function () {
      var panel = this._root && this._root.querySelector('#cc-panel');
      if (panel && !panel.hidden) {
        panel.hidden = true;
        var btn = this._root.querySelector('[data-cc="toggle"]');
        if (btn) { btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
      }
    },

    _destroy: function () {
      if (this._root && this._root.parentNode) this._root.parentNode.removeChild(this._root);
      this._root = null;
      if ((!this._cfg || this._cfg.autoFocus !== false) && this._lastFocus && typeof this._lastFocus.focus === 'function') this._lastFocus.focus();
    },

    // Re-open the banner (e.g. from a "Cookie settings" footer link).
    show: function () {
      if (this._root) return;
      if (!this._cfg) return;
      var lang = resolveLanguage(this._cfg.language);
      var region = (this._cfg.region && this._cfg.region !== 'auto') ? this._cfg.region : 'auto';
      var ukExempt = region === 'uk' && this._cfg.ukFirstPartyAnalyticsExempt === true;
      var stored = this._consent || readStored(region, this._cfg.storageKey) || { analytics: !!ukExempt, marketing: false };
      this._render(lang, region, ukExempt, stored);
    }
  };

  // ---- small helpers -------------------------------------------------------

  function resolveLanguage(pref) {
    if (pref && pref !== 'auto' && Object.prototype.hasOwnProperty.call(I18N, pref)) return pref;
    var pageLang = document.documentElement && (document.documentElement.lang || '').slice(0, 2).toLowerCase();
    if (Object.prototype.hasOwnProperty.call(I18N, pageLang)) return pageLang;
    var nav = (global.navigator && (global.navigator.language || '')).slice(0, 2).toLowerCase();
    return Object.prototype.hasOwnProperty.call(I18N, nav) ? nav : 'en';
  }

  // Escaping HTML alone does not make a URL safe. Validate at the rendering
  // boundary as this widget is also used outside the hosted builders.
  function safePrivacyUrl(value) {
    if (typeof value !== 'string' || !value || value.length > 2000 || /[\\\s<>\u0000-\u001f\u007f]/.test(value) || value.indexOf('//') === 0) return '';
    try {
      var url = new URL(value, 'https://consent.invalid/');
      if (!/^https?:$/.test(url.protocol) || url.username || url.password) return '';
      return value;
    } catch (e) { return ''; }
  }

  function row(id, label, desc, checked, locked, alwaysLabel) {
    return '' +
      '<div class="cc-cat">' +
        '<div class="cc-cat-head">' +
          '<span class="cc-cat-label" id="cc-' + id + '-label">' + esc(label) + '</span>' +
          (locked
            ? '<span class="cc-locked">' + esc(alwaysLabel || '') + '</span>'
            : '<label class="cc-switch"><input type="checkbox" id="cc-' + id + '" ' +
              (checked ? 'checked' : '') + ' aria-labelledby="cc-' + id + '-label"><span class="cc-slider"></span></label>') +
        '</div>' +
        '<p class="cc-cat-desc">' + esc(desc) + '</p>' +
      '</div>';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  global.CookieConsent = CookieConsent;
})(typeof window !== 'undefined' ? window : this);
