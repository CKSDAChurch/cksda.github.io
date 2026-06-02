// @ts-check

/*
    ECKCM page updates:
    1) Keep newest day first in DAILY_ISSUES.
    2) Duplicate the first object and edit only text/photos for each new day.
    3) Photo paths can point to files in images/ (example: images/eckcm/day-2-evening.jpg).
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
        photos: [],
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

const renderPhotoMarkup = (photos) => {
    if (!photos.length) {
        return '<p class="edition-empty-photos">Photo highlights will be added after tonight\'s sessions.</p>';
    }

    const items = photos.map((photo) => `
        <figure class="edition-photo">
            <img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.alt)}" loading="lazy" decoding="async" />
            <figcaption>${escapeHtml(photo.caption)}</figcaption>
        </figure>
    `).join('');

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
    .map((issue, index) => `<a class="edition-jump-link" href="#${escapeHtml(issue.anchorId)}">Day ${index + 1}</a>`)
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

    container.innerHTML = issues.map(renderIssueMarkup).join('');
};

renderDailyDispatch();