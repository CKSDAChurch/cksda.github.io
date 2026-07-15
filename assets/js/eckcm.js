// @ts-nocheck

/*
    ECKCM page updates:
    This page now renders from a local 2026 archive JSON file so the content remains
    available without relying on live Google Apps Script updates.
    Language toggle switches between English and Korean fields.
*/

const ARCHIVE_DATA_URL = 'assets/data/eckcm-2026.json';

const NEWSPAPER_EN = {
    editionLabel: 'Camp Meeting Special',
    issueRange: 'June 20-28, 2026',
    location: 'East Coast Korean Camp Meeting',
    updatedText: 'Latest Press Time:',
    frontPage: 'Front Page Highlights',
    keyMoments: 'Key Moments',
    photoDesk: 'Photo Desk',
    // Static page strings
    strip: 'East Coast Korean Camp Meeting — Daily Newspaper',
    sectionLabel: 'Camp Meeting Coverage',
    nameplate: 'ECKCM Newspaper',
    subhead: 'Daily highlights, moments, and photo notes from June 20–28, 2026.',
    editionIndex: 'Edition Index',
    loadingTitle: 'Press is printing...',
    loadingBody: 'Fetching the latest news directly from the editing room.',
    errorTitle: 'Press malfunction',
    errorBody: 'Could not fetch the latest news. Please try refreshing.',
};

const NEWSPAPER_KO = {
    editionLabel: '캠프 모임 특별판',
    issueRange: '2026년 6월 20-28일',
    location: '동부 한인 캠프 모임',
    updatedText: '최신 업데이트:',
    frontPage: '주요 뉴스',
    keyMoments: '주요 일정',
    photoDesk: '포토 데스크',
    // Static page strings
    strip: '동부 한인 캐프 모임 — 매일 신문',
    sectionLabel: '캠프 모임 취재',
    nameplate: 'ECKCM 신문',
    subhead: '2026년 6월 20-28일 캠프 모임의 매일 하이라이트, 순간, 포토 노트.',
    editionIndex: '판 색인',
    loadingTitle: '인쇄 중...',
    loadingBody: '편집실에서 최신 뉴스를 가져오는 중입니다.',
    errorTitle: '인쇄 오류',
    errorBody: '최신 뉴스를 불러올 수 없습니다. 새로 고침을 해주세요.',
};

let rawData = [];

// Default to system language (Korean if device is in Korean, otherwise English)
const storedLang = localStorage.getItem('ledger-lang');
let currentLang = (storedLang === 'ko' || storedLang === 'en')
    ? storedLang
    : (navigator.language.startsWith('ko') ? 'ko' : 'en');

const getById = (id) => document.getElementById(id);

const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

// Convert a Google Drive share/view URL to its embeddable preview URL.
// Returns null if the input isn't a Drive file URL.
const toDriveEmbedUrl = (src) => {
    const m = src.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
    return m ? `https://drive.google.com/file/d/${m[1]}/preview` : null;
};

const toYouTubeEmbedUrl = (src) => {
    // Accept full URLs, youtu.be short links, or bare video IDs
    let videoId = null;
    try {
        const url = new URL(src);
        if (url.hostname === 'youtu.be') {
            videoId = url.pathname.slice(1);
        } else if (url.hostname.includes('youtube.com')) {
            videoId = url.searchParams.get('v');
        }
    } catch {
        // If it's not a URL, treat it as a raw video ID
        if (/^[A-Za-z0-9_-]{11}$/.test(src)) videoId = src;
    }
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0` : null;
};

const toVimeoEmbedUrl = (src) => {
    try {
        const url = new URL(src);
        if (url.hostname.includes('vimeo.com')) {
            const match = url.pathname.match(/\/([0-9]+)(?:\/|$)/);
            if (match) {
                return `https://player.vimeo.com/video/${match[1]}?app_id=122963&dnt=1&title=0&byline=0&portrait=0`;
            }
        }
    } catch {
        // Ignore invalid URLs
    }
    return null;
};

// Inline markdown: bold, italic, links, images, videos.
// Images/links are extracted before escaping so URLs aren't mangled.
const inlineMarkdown = (text) => {
    const s = String(text);
    const tokens = s.split(/(!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\(https?:\/\/[^)]+\))/g);
    return tokens.map((token, idx) => {
        if (idx % 2 === 1) {
            const imgM = token.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
            if (imgM) {
                const src = imgM[2].trim();
                const alt = escapeHtml(imgM[1]);
                const driveEmbed = toDriveEmbedUrl(src);
                if (driveEmbed) {
                    return `<a href="${src}" target="_blank" rel="noopener noreferrer" class="edition-drive-link">&#9654; Watch video on Google Drive</a>`;
                }
                const ytEmbed = toYouTubeEmbedUrl(src);
                if (ytEmbed) {
                    const videoId = ytEmbed.split('/embed/')[1]?.split('?')[0] || '';
                    const thumbUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';
                    const thumbAttr = thumbUrl ? ` style="background-image:url('${thumbUrl}')"` : '';
                    return `<button class="edition-yt-facade edition-article-yt"${thumbAttr} data-src="${ytEmbed}" aria-label="${alt || 'Play video'}"><span class="edition-yt-play" aria-hidden="true">&#9654;</span></button>`;
                }
                if (/\.(mp4|webm|mov)$/i.test(src)) {
                    return `<video src="${src}" controls playsinline class="edition-article-img" aria-label="${alt}"></video>`;
                }
                return `<img src="${src}" alt="${alt}" loading="lazy" decoding="async" class="edition-article-img">`;
            }
            const linkM = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
            if (linkM) {
                return `<a href="${linkM[2]}" target="_blank" rel="noopener noreferrer">${escapeHtml(linkM[1])}</a>`;
            }
        }
        return escapeHtml(token)
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/_(.+?)_/g, '<em>$1</em>');
    }).join('');
};

// Markdown renderer: headings, bold, italic, links, tables, bullet/ordered lists, paragraphs.
const renderMarkdown = (raw) => {
    if (!raw) return '';
    const lines = String(raw).split('\n');
    const out = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Heading: # ## ###
        const hMatch = line.match(/^(#{1,3})\s+(.+)/);
        if (hMatch) {
            const level = hMatch[1].length + 2; // # → h3, ## → h4, ### → h5
            out.push(`<h${level} class="edition-md-h${level}">${inlineMarkdown(hMatch[2])}</h${level}>`);
            i++; continue;
        }

        // Blank line — paragraph break (just skip)
        if (line.trim() === '') { i++; continue; }

        // Standalone image or video: ![alt](src)
        const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (imgMatch) {
            const alt = escapeHtml(imgMatch[1]);
            const src = imgMatch[2].trim();
            const driveEmbed = toDriveEmbedUrl(src);
            const ytEmbed = toYouTubeEmbedUrl(src);
            if (driveEmbed) {
                out.push(`<p><a href="${src}" target="_blank" rel="noopener noreferrer" class="edition-drive-link">&#9654; Watch video on Google Drive</a></p>`);
            } else if (ytEmbed) {
                const videoId = ytEmbed.split('/embed/')[1]?.split('?')[0] || '';
                const thumbUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';
                const thumbAttr = thumbUrl ? ` style="background-image:url('${thumbUrl}')"` : '';
                out.push(`<figure class="edition-article-figure"><button class="edition-yt-facade"${thumbAttr} data-src="${ytEmbed}" aria-label="${alt || 'Play video'}"><span class="edition-yt-play" aria-hidden="true">&#9654;</span></button></figure>`);
            } else if (/\.(mp4|webm|mov)$/i.test(src)) {
                out.push(`<figure class="edition-article-figure"><video src="${src}" controls playsinline class="edition-article-img" aria-label="${alt}"></video></figure>`);
            } else {
                out.push(`<figure class="edition-article-figure"><img src="${src}" alt="${alt}" loading="lazy" decoding="async" class="edition-article-img"></figure>`);
            }
            i++; continue;
        }

        // Table: line contains | and next line is a separator (---|---)
        if (line.includes('|') && lines[i + 1] && /^[\s|:-]+$/.test(lines[i + 1])) {
            const headers = line.split('|').map(c => c.trim()).filter(Boolean);
            i += 2;
            const rows = [];
            while (i < lines.length && lines[i].includes('|')) {
                rows.push(lines[i].split('|').map(c => c.trim()).filter(Boolean));
                i++;
            }
            const thead = `<tr>${headers.map(h => `<th>${inlineMarkdown(h)}</th>`).join('')}</tr>`;
            const tbody = rows.map(r => `<tr>${r.map(c => `<td>${inlineMarkdown(c)}</td>`).join('')}</tr>`).join('');
            out.push(`<table class="edition-md-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`);
            continue;
        }

        // Unordered list: - or *
        if (/^[-*]\s/.test(line)) {
            const items = [];
            while (i < lines.length && /^[-*]\s/.test(lines[i])) {
                items.push(`<li>${inlineMarkdown(lines[i].replace(/^[-*]\s/, ''))}</li>`);
                i++;
            }
            out.push(`<ul class="edition-md-list">${items.join('')}</ul>`);
            continue;
        }

        // Ordered list: 1. 2. etc.
        if (/^\d+\.\s/.test(line)) {
            const items = [];
            while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
                items.push(`<li>${inlineMarkdown(lines[i].replace(/^\d+\.\s/, ''))}</li>`);
                i++;
            }
            out.push(`<ol class="edition-md-list">${items.join('')}</ol>`);
            continue;
        }

        // Paragraph: gather consecutive non-empty, non-special lines
        const paraLines = [];
        while (i < lines.length && lines[i].trim() !== '' && !lines[i].match(/^#{1,3}\s/) && !lines[i].includes('|') && !/^[-*]\s/.test(lines[i]) && !/^\d+\.\s/.test(lines[i])) {
            paraLines.push(lines[i]);
            i++;
        }
        if (paraLines.length) {
            out.push(`<p>${inlineMarkdown(paraLines.join(' '))}</p>`);
        } else {
            // Safety fallback: if no rule matched and i didn't advance, push as plain text and move on
            out.push(`<p>${inlineMarkdown(line)}</p>`);
            i++;
        }
    }

    return out.join('');
};

const renderMediaItem = (media) => {
    const caption = media.caption ? `<figcaption>${escapeHtml(media.caption)}</figcaption>` : '';

    if (media.type === 'youtube') {
        const embedUrl = toYouTubeEmbedUrl(media.src);
        if (!embedUrl) return '';
        return `
        <figure class="edition-media edition-media--live edition-media--youtube">
            <iframe class="edition-media-el" src="${embedUrl}" title="${escapeHtml(media.alt || 'Video')}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
            ${caption}
        </figure>`;
    }

    if (media.type === 'vimeo') {
        const embedUrl = toVimeoEmbedUrl(media.src);
        if (!embedUrl) return '';
        return `
        <figure class="edition-media edition-media--live edition-media--vimeo">
            <iframe class="edition-media-el" src="${embedUrl}" title="${escapeHtml(media.alt || 'Video')}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
            ${caption}
        </figure>`;
    }

    if (media.type === 'video') {
        const poster = media.poster ? ` poster="${escapeHtml(media.poster)}"` : '';
        return `
        <figure class="edition-media edition-media--live">
            <video class="edition-media-el" src="${escapeHtml(media.src)}"${poster} muted loop autoplay playsinline preload="metadata" aria-label="${escapeHtml(media.alt || '')}"></video>
            ${caption}
        </figure>`;
    }

    return `
        <figure class="edition-media edition-media--live">
            <img class="edition-media-el" src="${escapeHtml(media.src)}" alt="${escapeHtml(media.alt || '')}" loading="lazy" decoding="async" />
            ${caption}
        </figure>`;
};

const renderPhotoMarkup = (photos) => {
    if (!photos.length) {
        return `
        <figure class="edition-media edition-media--empty" aria-label="Reserved media frame">
            <div class="edition-media-placeholder"><span>Colour photo or video clip appears here</span></div>
        </figure>`;
    }

    const items = photos.map(renderMediaItem).join('');
    return `<div class="edition-photos-grid">${items}</div>`;
};

// Renders a single article entry
const renderEntryMarkup = (entry, labels) => {
    // Skip entries with no headline
    if (!entry.headline) return '';

    const headlineMarkup = `<h3 class="edition-title">${escapeHtml(entry.headline)}</h3>`;
    const dateMarkup  = entry.date   ? `<p class="edition-date">${escapeHtml(entry.date)}</p>` : '';
    const authorMarkup = entry.author ? `<p class="edition-byline">By ${escapeHtml(entry.author)}</p>` : '';
    const photoMarkup = entry.photos.length ? `
            <section class="edition-photos" aria-label="Photo Highlights">
                <h4>${escapeHtml(labels.photoDesk)}</h4>
                ${renderPhotoMarkup(entry.photos)}
            </section>` : '';
    const articleMarkup = entry.article ? `<div class="edition-article">${renderMarkdown(entry.article)}</div>` : '';

    return `
        <div class="edition-entry">
            ${dateMarkup}
            ${headlineMarkup}
            ${authorMarkup}
            ${photoMarkup}
            ${articleMarkup}
        </div>`;
};

// Renders the outer page wrapper for a day, containing one or more entry blocks
const renderSummaryMarkup = (summary, labels) => {
    if (!summary) return '';
    const highlights = (summary.highlights || []).filter(h => String(h).trim());
    const schedule   = (summary.schedule   || []).filter(s => String(s).trim());
    if (!highlights.length && !schedule.length) return '';
    const highlightItems = highlights.map(h => `<li>${escapeHtml(h)}</li>`).join('');
    const scheduleItems  = schedule.map(s => `<li>${escapeHtml(s)}</li>`).join('');
    const dateMarkup = summary.date ? `<p class="edition-date">${escapeHtml(summary.date)}</p>` : '';
    const gridMarkup = `
        <div class="edition-grid">
            ${highlightItems ? `<section class="edition-column" aria-label="Highlights">
                <h4>${escapeHtml(labels.frontPage)}</h4>
                <ul class="edition-highlights">${highlightItems}</ul>
            </section>` : ''}
            ${scheduleItems ? `<section class="edition-column" aria-label="Schedule">
                <h4>${escapeHtml(labels.keyMoments)}</h4>
                <ol class="edition-schedule-simple edition-schedule">${scheduleItems}</ol>
            </section>` : ''}
        </div>`;
    return `<div class="edition-entry edition-entry--summary">${dateMarkup}${gridMarkup}</div>`;
};

const renderIssueMarkup = (issue, labels) => {
    const summaryMarkup = renderSummaryMarkup(issue.summary, labels);
    const entriesMarkup = issue.entries.map(e => renderEntryMarkup(e, labels)).join('');
    if (!summaryMarkup && !entriesMarkup.trim()) return '';

    return `
        <article class="edition" id="${escapeHtml(issue.anchorId)}">
            ${summaryMarkup}
            ${entriesMarkup}
        </article>
    `;
};

const buildIssueAnchors = (issues) => issues.map((issue, index) => ({
    ...issue,
    anchorId: `issue-${index + 1}`,
}));

const renderJumpMarkup = (issues, lang) => issues
    .map((issue, index) => {
        const dayId = Number(issue.dayId);
        let label = `Day ${dayId}`;
        if (String(dayId) === '0') {
            label = lang === 'ko' ? '캠프 전' : 'Pre-Camp';
        } else if (dayId > 7) {
            label = lang === 'ko' ? '캠프 후' : 'Post-Camp';
        } else if (lang === 'ko') {
            label = `제 ${dayId} 일`;
        }
        return `<a class="edition-jump-link" href="#${escapeHtml(issue.anchorId)}" data-page="${index}">${escapeHtml(label)}</a>`;
    })
    .join('');

const setupPageTurner = (container, jump, pageCount) => {
    const pages = Array.from(container.querySelectorAll('.edition'));
    const status = getById('edition-pager-status');
    const prevBtn = container.querySelector('[data-dir="prev"]');
    const nextBtn = container.querySelector('[data-dir="next"]');
    const jumpLinks = jump ? Array.from(jump.querySelectorAll('.edition-jump-link')) : [];
    let current = 0;

    const showPage = (index, { focus = false } = {}) => {
        current = Math.max(0, Math.min(pageCount - 1, index));

        pages.forEach((page, i) => {
            const isActive = i === current;
            page.classList.toggle('edition--active', isActive);
            page.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        });

        jumpLinks.forEach((link, i) => {
            link.classList.toggle('edition-jump-link--active', i === current);
            if (i === current) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });

        if (status) status.textContent = `Page ${current + 1} of ${pageCount}`;
        if (prevBtn) prevBtn.disabled = current === 0;
        if (nextBtn) nextBtn.disabled = current === pageCount - 1;

        if (focus && pages[current]) {
            const heading = pages[current].querySelector('.edition-title');
            if (heading) heading.setAttribute('tabindex', '-1');
            if (heading) heading.focus({ preventScroll: true });
        }
    };

    if (prevBtn) prevBtn.addEventListener('click', () => showPage(current - 1, { focus: true }));
    if (nextBtn) nextBtn.addEventListener('click', () => showPage(current + 1, { focus: true }));

    jumpLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const target = Number(link.getAttribute('data-page')) || 0;
            showPage(target, { focus: true });
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') showPage(current - 1, { focus: true });
        if (event.key === 'ArrowRight') showPage(current + 1, { focus: true });
    });

    // Start on the last page (newest day)
    showPage(pageCount - 1);
};

const mapDataToIssues = (data, lang) => {
    const isKO = lang === 'ko';

    const formatDate = (rawDate) => {
        if (!rawDate) return '';
        try {
            const dateObj = new Date(rawDate);
            if (!isNaN(dateObj.getTime())) {
                return dateObj.toLocaleDateString(isKO ? 'ko-KR' : 'en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'UTC'
                });
            }
        } catch {
            // If date parsing fails, use the raw value
        }
        return String(rawDate);
    };

    const toPhoto = (item) => {
        if (!item.ImageSrc) return [];
        const caption = isKO && item.ImageCaption_KO ? item.ImageCaption_KO : (item.ImageCaption_EN || '');
        return String(item.ImageSrc).split(',').map(raw => {
            const src = raw.trim();
            if (!src) return null;
            const isVideo = /\.(mp4|webm|mov)$/i.test(src);
            const isYouTube = /youtube\.com|youtu\.be/i.test(src);
            const isVimeo = /vimeo\.com/i.test(src);
            return {
                type: isYouTube ? 'youtube' : isVimeo ? 'vimeo' : isVideo ? 'video' : 'image',
                src,
                alt: item.ImageAlt || '',
                caption
            };
        }).filter(Boolean);
    };

    // Sort by Day ID ascending, then by Date+Time ascending within the same day
    const toSortKey = (item) => {
        // Combine raw date and time into a single comparable string: "2026-06-16 14:00"
        const rawDate = String(item.Date || '').trim();
        const rawTime = String(item.Time || '').trim();
        // Normalise date to ISO-like prefix for reliable string comparison
        let datePart = rawDate;
        try {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) datePart = d.toISOString().slice(0, 10);
        } catch { /* use raw */ }
        return `${datePart} ${rawTime}`;
    };

    const sorted = [...data].sort((a, b) => {
        const dayDiff = Number(a['Day ID'] ?? a.DayID) - Number(b['Day ID'] ?? b.DayID);
        if (dayDiff !== 0) return dayDiff;
        return toSortKey(a).localeCompare(toSortKey(b));
    });

    const grouped = [];
    for (const item of sorted) {
        const dayId = item['Day ID'] !== undefined ? item['Day ID'] : item.DayID;
        const existing = grouped.find(g => String(g.dayId) === String(dayId));
        const type = String(item.Type || 'article').trim().toLowerCase();

        if (type === 'summary') {
            // Summary only uses: DayID, Date, Type, Highlights_EN/KO, KeyMoments_EN/KO
            const summary = {
                date:       formatDate(item.Date),
                highlights: isKO && item.Highlights_KO ? item.Highlights_KO : (item.Highlights_EN || []),
                schedule:   isKO && item.KeyMoments_KO ? item.KeyMoments_KO : (item.KeyMoments_EN || []),
            };
            if (existing) {
                existing.summary = summary;
            } else {
                grouped.push({ dayId, date: formatDate(item.Date), summary, entries: [] });
            }
        } else {
            // Article uses: DayID, Date, Type, Time, Headline_EN/KO, ImageSrc, ImageAlt, ImageCaption_EN/KO, Article_EN/KO
            const entry = {
                date:       formatDate(item.Date),
                headline:   isKO && item.Headline_KO ? item.Headline_KO : (item.Headline_EN || ''),
                article:    isKO && item.Article_KO  ? item.Article_KO  : (item.Article_EN  || ''),
                author:     item.Author || '',
                photos:     toPhoto(item)
            };
            if (existing) {
                existing.entries.push(entry);
            } else {
                grouped.push({ dayId, date: formatDate(item.Date), summary: null, entries: [entry] });
            }
        }
    }

    // Within each day, show newest article entry first (latest Time at top)
    grouped.forEach(g => g.entries.reverse());

    return grouped;
};

const applyStaticStrings = (labels) => {
    const set = (id, text) => { const el = getById(id); if (el) el.textContent = text; };
    set('ledger-strip-text',   labels.strip);
    set('ledger-section-label', labels.sectionLabel);
    set('ledger-nameplate',    labels.nameplate);
    set('ledger-subhead',      labels.subhead);
    set('ledger-jump-title',   labels.editionIndex);
    set('ledger-update-title', labels.loadingTitle);
    set('ledger-loading-body', labels.loadingBody);
};

const renderDailyDispatch = () => {
    const editionLabel = getById('gazette-edition-label');
    const issueRange = getById('gazette-issue-range');
    const location = getById('gazette-location');
    const updated = getById('gazette-updated');
    const jump = getById('edition-jump');
    const container = getById('eckcm-edition-list');
    
    const labels = currentLang === 'ko' ? NEWSPAPER_KO : NEWSPAPER_EN;

    if (!container) return;

    applyStaticStrings(labels);
    
    // Map raw sheet data to issues
    const formattedData = mapDataToIssues(rawData, currentLang);
    const issues = buildIssueAnchors(formattedData);

    if (editionLabel) editionLabel.textContent = labels.editionLabel;
    if (issueRange) issueRange.textContent = labels.issueRange;
    if (location) location.textContent = labels.location;
    if (updated) {
        const today = new Date();
        const formattedDate = today.toLocaleDateString(currentLang === 'ko' ? 'ko-KR' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        updated.textContent = `${labels.updatedText} ${formattedDate}`;
    }
    
    const loadingNote = getById('loading-note');
    if (loadingNote) loadingNote.style.display = 'none';

    if (jump) jump.innerHTML = renderJumpMarkup(issues, currentLang);

    container.innerHTML = `
        <div class="edition-pages">${issues.map(issue => renderIssueMarkup(issue, labels)).join('')}</div>
        <nav class="edition-pager" aria-label="Newspaper pages">
            <button type="button" class="edition-pager-btn" data-dir="prev" aria-label="Previous page">&#8592; Previous</button>
            <span class="edition-pager-status" id="edition-pager-status" aria-live="polite"></span>
            <button type="button" class="edition-pager-btn" data-dir="next" aria-label="Next page">Next &#8594;</button>
        </nav>`;

    setupPageTurner(container, jump, issues.length);

    // YouTube facade: swap poster button for real iframe on click
    container.querySelectorAll('.edition-yt-facade').forEach(btn => {
        btn.addEventListener('click', () => {
            const src = btn.getAttribute('data-src');
            const label = btn.getAttribute('aria-label') || 'Video';
            const iframe = document.createElement('iframe');
            iframe.className = 'edition-media-el';
            iframe.src = src + (src.includes('?') ? '&' : '?') + 'autoplay=1';
            iframe.title = label;
            iframe.frameBorder = '0';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            btn.replaceWith(iframe);
        }, { once: true });
    });
};

const effectivelyDark = () => {
    const stored = localStorage.getItem('ledger-theme');
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    // No override — follow the system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const applyTheme = () => {
    document.documentElement.dataset.theme = effectivelyDark() ? 'dark' : 'light';
};

const setupThemeToggle = () => {
    const btn = getById('ledger-theme-btn');
    if (!btn) return;

    const syncBtn = () => {
        const dark = effectivelyDark();
        btn.textContent = dark ? 'Light' : 'Dark';
        btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    };

    btn.addEventListener('click', () => {
        // Toggle between explicit light/dark; clear override to restore system
        const stored = localStorage.getItem('ledger-theme');
        const dark = effectivelyDark();
        if (stored) {
            // Already has an explicit override — flip it
            localStorage.setItem('ledger-theme', dark ? 'light' : 'dark');
        } else {
            // First manual press — set explicit opposite of current system theme
            localStorage.setItem('ledger-theme', dark ? 'light' : 'dark');
        }
        applyTheme();
        syncBtn();
    });

    // Keep in sync if system theme changes while the page is open
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (!localStorage.getItem('ledger-theme')) {
            applyTheme();
            syncBtn();
        }
    });

    syncBtn();
};

const setupLanguageToggle = () => {
    const langBtn = getById('ledger-lang-btn');
    if (!langBtn) return;
    
    langBtn.textContent = currentLang === 'ko' ? 'EN' : 'KO';
    
    langBtn.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'ko' : 'en';
        localStorage.setItem('ledger-lang', currentLang);
        langBtn.textContent = currentLang === 'ko' ? 'EN' : 'KO';
        document.documentElement.lang = currentLang;
        
        renderDailyDispatch();
    });
};

const setupLightbox = () => {
    const lightbox = getById('eckcm-lightbox');
    const lightboxImg = getById('eckcm-lightbox-img');
    const closeBtn = lightbox && lightbox.querySelector('.eckcm-lightbox-close');
    if (!lightbox || !lightboxImg) return;

    const open = (src, alt) => {
        lightboxImg.src = src;
        lightboxImg.alt = alt || '';
        lightbox.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    };

    const close = () => {
        lightbox.classList.remove('is-open');
        document.body.style.overflow = '';
        lightboxImg.src = '';
    };

    // Delegate clicks on any content image
    document.addEventListener('click', (e) => {
        const img = e.target.closest('.edition-photos-grid img, .edition-article-img');
        if (img) {
            e.preventDefault();
            open(img.src || img.getAttribute('data-src'), img.alt);
        }
    });

    if (closeBtn) closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox || e.target === lightboxImg) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
};

const CACHE_KEY = 'eckcm-data-2026-archive-v1';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const loadFromCache = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (stored && Date.now() - stored.ts < CACHE_TTL) return stored.data;
    } catch { /* ignore parse errors */ }
    return null;
};

const saveToCache = (data) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch { /* ignore storage errors (e.g. private mode quota) */ }
};

const init = async () => {
    applyTheme();
    document.documentElement.lang = currentLang;
    setupThemeToggle();
    setupLanguageToggle();
    setupLightbox();

    // Show cached data immediately so returning visitors see content instantly
    const cached = loadFromCache();
    if (cached) {
        rawData = cached;
        renderDailyDispatch();
    }

    // Load the archived 2026 data locally so the page works without live updates.
    try {
        const res = await fetch(ARCHIVE_DATA_URL);
        if (!res.ok) throw new Error(`Unable to load archived ECKCM data (${res.status})`);
        const archiveData = await res.json();
        saveToCache(archiveData);
        if (JSON.stringify(archiveData) !== JSON.stringify(rawData)) {
            rawData = archiveData;
            renderDailyDispatch();
        }
    } catch (err) {
        console.error('Failed to load archived ECKCM news', err);
        if (!rawData.length) {
            const labels = currentLang === 'ko' ? NEWSPAPER_KO : NEWSPAPER_EN;
            applyStaticStrings(labels);
            const loadingNote = getById('loading-note');
            if (loadingNote) {
                loadingNote.innerHTML = `<h2 id="ledger-update-title">${labels.errorTitle}</h2><p id="ledger-loading-body">${labels.errorBody}</p>`;
                loadingNote.style.display = 'block';
            }
        }
    }
};

init();
