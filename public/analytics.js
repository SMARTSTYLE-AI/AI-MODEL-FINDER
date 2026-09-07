/**
 * ModelFinder — Shared GA4 Key Event Tracking
 * Loaded by blog articles and all standalone pages (about, privacy, terms, disclaimer, contact).
 * index.html uses script.js instead (which contains its own GA4 key event code).
 *
 * Key events tracked:
 *   content_scroll_75  — user has read 75%+ of the page (strong AdSense signal)
 *   outbound_click     — user clicked an external link
 */

(function () {
    'use strict';

    // ── 1. content_scroll_75 ──────────────────────────────────────────────────
    // Fires once per page load when the user scrolls at least 75% down the page.
    // Passive listener keeps scroll performance unaffected.
    var fired75 = false;

    function checkScroll() {
        if (fired75) return;
        var scrolled = window.scrollY + window.innerHeight;
        var total    = document.documentElement.scrollHeight;
        if (total <= 0) return;
        var pct = (scrolled / total) * 100;
        if (pct >= 75) {
            fired75 = true;
            if (typeof gtag === 'function') {
                gtag('event', 'content_scroll_75', {
                    page_location: window.location.href,
                    page_title: document.title
                });
            }
        }
    }

    window.addEventListener('scroll', checkScroll, { passive: true });

    // Also check immediately in case the page is short and already at 75%+ on load
    window.addEventListener('load', checkScroll);


    // ── 2. outbound_click ─────────────────────────────────────────────────────
    // Fires when the user clicks a link to an external domain.
    // Uses event delegation on the document so dynamically added links are covered.
    document.addEventListener('click', function (e) {
        var link = e.target.closest('a[href]');
        if (!link) return;

        var href = link.getAttribute('href') || '';

        // Only fire for absolute URLs that are not on our own domain
        var isExternal = href.startsWith('http') &&
                         typeof window !== 'undefined' &&
                         !href.includes(window.location.hostname);

        if (isExternal && typeof gtag === 'function') {
            gtag('event', 'outbound_click', {
                link_url:  href,
                link_text: (link.innerText || link.textContent || '').trim().substring(0, 100),
                page_location: window.location.href
            });
        }
    });

}());
