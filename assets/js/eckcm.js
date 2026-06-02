// @ts-check

/*
    ECKCM page updates:
    1) Keep newest day first in DAILY_ISSUES.
    2) Duplicate the first object and edit only text/media for each new day.
    3) Each day is a "page" the reader flips through (Previous / Next / day links / arrow keys).

    Living media frame (the one allowed splash of colour / motion per page):
    - A colour photo:
        { type: 'image', src: 'images/eckcm/day-1.jpg', alt: 'Opening worship', caption: 'Opening night worship.' }
    - A short video clip (autoplays muted, loops, like a Harry Potter moving photo):
        { type: 'video', src: 'images/eckcm/day-1.mp4', poster: 'images/eckcm/day-1.jpg', alt: 'Opening worship', caption: 'Opening night worship.' }
    Put one entry in the `photos` array to feature it. Everything else on the page stays authentic black-and-white print.
*/

const NEWSPAPER = {
    editionLabel: 'Camp Meeting Special',
    issueRange: 'June 21-28, 2026',
    location: 'Eastern Korean Camp Meeting',
    updatedText: 'Latest Press Time:',
};

const DAILY_ISSUES = [
    {
        date: 'Day 1 - Sunday, June 21, 2026',
        theme: 'Opening Rally',
        headline: 'Camp Meeting Opens With Song, Testimony, and a Full House',
        lede: 'From first arrivals to evening worship, the opening day carried that classic camp meeting spirit: warm welcomes, joyful music, and messages of hope.',
        highlights: [
            'Welcome teams greeted families and helped them settle into lodging and meeting spaces.',
            'Opening worship featured praise, testimonies, and a clear invitation to spiritual renewal.',
            'Evening fellowship brought visitors, students, and long-time members together around prayer.',
        ],
        schedule: [
            { time: '3:30 PM', title: 'Arrival & Check-In', detail: 'Hospitality teams welcomed guests across campus.' },
            { time: '6:45 PM', title: 'Opening Worship', detail: 'Praise set, scripture reading, and keynote launch.' },
            { time: '8:30 PM', title: 'Prayer & Fellowship', detail: 'Small groups closed the night in prayer.' },
        ],
        quote: '"Tonight felt like homecoming and mission launch at the same time."',
        photos: [
            {
                type: 'image',
                src: 'images/logo-mid.png',
                alt: 'ECKCM Daily Dispatch living frame demo',
                caption: 'Demo frame: replace with a nightly colour photo or short muted video clip.',
            },
        ],
    },
    {
        date: 'Preview Edition - Saturday, June 20, 2026',
        theme: 'Press Preview',
        headline: 'Volunteers Set the Stage for a Week of Worship and Community',
        lede: 'A full day of preparation turned classrooms, worship spaces, and welcome tables into a ready newsroom of ministry for the week ahead.',
        highlights: [
            'Audio, projection, and translation systems completed final checks.',
            'Children and youth ministries arranged lesson spaces and activity kits.',
            'Registration and hospitality teams finalized evening arrival plans.',
        ],
        schedule: [
            { time: '10:00 AM', title: 'Campus Setup', detail: 'Signage, room layouts, and welcome stations prepared.' },
            { time: '2:00 PM', title: 'Leadership Prayer', detail: 'Team leaders gathered for dedication and prayer.' },
            { time: '6:00 PM', title: 'Final Walkthrough', detail: 'Last readiness checks before opening day.' },
        ],
        quote: '"Every detail prepared today becomes someone else\'s blessing tomorrow."',
        photos: [],
    },
];

const getById = (id) => document.getElementById(id);

const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const renderMediaItem = (media) => {
    const caption = media.caption ? `<figcaption>${escapeHtml(media.caption)}</figcaption>` : '';

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

const renderIssueMarkup = (issue) => {
    const highlights = issue.highlights
        .map((highlight) => `<li>${escapeHtml(highlight)}</li>`)
        .join('');

    const schedule = issue.schedule
        .map((item) => `<li><time>${escapeHtml(item.time)}</time><strong>${escapeHtml(item.title)}</strong> - ${escapeHtml(item.detail)}</li>`)
        .join('');

    return `
        <article class="edition" id="${escapeHtml(issue.anchorId)}">
            <header class="edition-header">
                <div class="edition-tagline">
                    <span class="edition-extra">Extra! Extra!</span>
                    <p class="edition-date">${escapeHtml(issue.date)}</p>
                </div>
                <p class="edition-theme">${escapeHtml(issue.theme)}</p>
            </header>
            <h3 class="edition-title">${escapeHtml(issue.headline)}</h3>
            <p class="edition-lede">${escapeHtml(issue.lede)}</p>
            <div class="edition-grid">
                <section class="edition-column" aria-label="Highlights">
                    <h4>Front Page Highlights</h4>
                    <ul class="edition-highlights">${highlights}</ul>
                </section>
                <section class="edition-column" aria-label="Schedule">
                    <h4>Key Moments</h4>
                    <ol class="edition-schedule">${schedule}</ol>
                </section>
            </div>
            <blockquote class="edition-quote">${escapeHtml(issue.quote)}</blockquote>
            <section class="edition-photos" aria-label="Photo Highlights">
                <h4>Photo Desk</h4>
                ${renderPhotoMarkup(issue.photos)}
            </section>
        </article>
    `;
};

const buildIssueAnchors = () => DAILY_ISSUES.map((issue, index) => ({
    ...issue,
    anchorId: `issue-${index + 1}`,
}));

const renderJumpMarkup = (issues) => issues
    .map((issue, index) => `<a class="edition-jump-link" href="#${escapeHtml(issue.anchorId)}" data-page="${index}">Day ${index + 1}</a>`)
    .join('');

const renderDailyDispatch = () => {
    const editionLabel = getById('gazette-edition-label');
    const issueRange = getById('gazette-issue-range');
    const location = getById('gazette-location');
    const updated = getById('gazette-updated');
    const jump = getById('edition-jump');
    const container = getById('eckcm-edition-list');
    const issues = buildIssueAnchors();

    if (!container) return;

    if (editionLabel) editionLabel.textContent = NEWSPAPER.editionLabel;
    if (issueRange) issueRange.textContent = NEWSPAPER.issueRange;
    if (location) location.textContent = NEWSPAPER.location;
    if (updated) {
        const today = new Date();
        const formattedDate = today.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        updated.textContent = `${NEWSPAPER.updatedText} ${formattedDate}`;
    }
    if (jump) jump.innerHTML = renderJumpMarkup(issues);

    container.innerHTML = `
        <div class="edition-pages">${issues.map(renderIssueMarkup).join('')}</div>
        <nav class="edition-pager" aria-label="Newspaper pages">
            <button type="button" class="edition-pager-btn" data-dir="prev" aria-label="Previous page">&#8592; Previous Page</button>
            <span class="edition-pager-status" id="edition-pager-status" aria-live="polite"></span>
            <button type="button" class="edition-pager-btn" data-dir="next" aria-label="Next page">Next Page &#8594;</button>
        </nav>`;

    setupPageTurner(container, jump, issues.length);
};

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

    showPage(0);
};

renderDailyDispatch();