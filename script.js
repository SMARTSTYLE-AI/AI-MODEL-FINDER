let savedStack = JSON.parse(localStorage.getItem('modelStack')) || [];
let currentTableModels = [];
let currentBestPaid = null;
let currentBestFree = null;
let currentLang = localStorage.getItem('siteLang') || 'en';

function getModelData(model, lang) {
    if (model.i18n && model.i18n[lang]) return model.i18n[lang];
    if (model.i18n && model.i18n['en']) return model.i18n['en'];
    return model;
}

window.onload = () => {
    if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark-mode');
    setLanguage(currentLang);
};

window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 300) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
});

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('siteLang', lang);

    document.body.style.direction = (lang === 'ar') ? 'rtl' : 'ltr';

    const t = translations[lang] || translations['en'];

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            if (el.tagName === 'H1') el.innerHTML = t[key];
            else if (key === 'nav_stack') el.innerText = `${t[key]} (${savedStack.length})`;
            else if (key === 'results_title') {
                document.getElementById('resultsTitleText').innerText = t[key];
            }
            else el.innerText = t[key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) el.placeholder = t[key];
    });

    updateStackCount();
    if (document.getElementById('stackSection').style.display === 'block') {
        toggleStackView();
    } else if (document.getElementById('resultsSection').style.display === 'block') {
        findModels(true);
    }

    document.getElementById('langDropdown').classList.remove('show');
}

function toggleLanguageMenu() {
    document.getElementById('langDropdown').classList.toggle('show');
}

window.addEventListener('click', function (e) {
    if (!document.getElementById('langBtn').contains(e.target)) {
        document.getElementById('langDropdown').classList.remove('show');
    }
});

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function toggleBookmark(id) {
    const index = savedStack.indexOf(id);
    if (index > -1) savedStack.splice(index, 1);
    else savedStack.push(id);
    localStorage.setItem('modelStack', JSON.stringify(savedStack));
    updateStackCount();

    if (document.getElementById('stackSection').style.display === 'block') toggleStackView();
    else if (document.getElementById('searchInput').value) findModels(true);
}

function updateStackCount() {
    const t = translations[currentLang] || translations['en'];
    document.getElementById('stackNavBtn').innerText = `${t['nav_stack'] || 'My Stack'} (${savedStack.length})`;
}

function toggleStackView() {
    hideAllSections();
    const stackSection = document.getElementById('stackSection');
    const stackGrid = document.getElementById('stackGrid');
    const t = translations[currentLang] || translations['en'];

    const stackModels = modelDatabase.filter(m => savedStack.includes(m.id));

    if (stackModels.length === 0) {
        stackGrid.innerHTML = `<p style="color:var(--text-muted);">${t['empty_stack']}</p>`;
    } else {
        stackGrid.innerHTML = stackModels.map(m => renderCard(m, false, true)).join('');
    }

    stackSection.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideAllSections() {
    document.getElementById('landingContent').style.display = 'none';
    document.getElementById('errorSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('stackSection').style.display = 'none';
    document.getElementById('resourcesSection').style.display = 'none';
    document.getElementById('aboutSection').style.display = 'none';
    document.getElementById('privacySection').style.display = 'none';
}

function toggleResourcesView() {
    hideAllSections();
    document.getElementById('resourcesSection').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showAboutPage() {
    hideAllSections();
    document.getElementById('aboutSection').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showPrivacyPage() {
    hideAllSections();
    document.getElementById('privacySection').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function togglePAA(button) {
    const item = button.parentElement;
    const isActive = item.classList.contains('active');

    // Close all other open questions
    document.querySelectorAll('.paa-item').forEach(el => el.classList.remove('active'));

    // Toggle current question
    if (!isActive) {
        item.classList.add('active');
    }
}

function renderRelatedQuestions(questionsList) {
    const container = document.getElementById('paaContainer');
    container.innerHTML = ''; // Clear previous questions

    questionsList.forEach(q => {
        const paaItem = document.createElement('div');
        paaItem.className = 'paa-item';
        paaItem.innerHTML = `
            <button class="paa-question" onclick="togglePAA(this)">
                <span>${q.question}</span>
                <span class="paa-icon">▾</span>
            </button>
            <div class="paa-answer">
                <p>${q.answer}</p>
            </div>
        `;
        container.appendChild(paaItem);
    });
}

function populateSearch(query) {
    document.getElementById('searchInput').value = query;
    findModels();
}

function populateSearchKey(key) {
    const t = translations[currentLang] || translations['en'];
    document.getElementById('searchInput').value = t[key] || translations['en'][key];
    findModels();
}

function renderCard(model, isOptimal, isStackView = false) {
    const t = translations[currentLang] || translations['en'];
    const optimalClass = isOptimal ? 'is-optimal' : '';
    const badgeHTML = isOptimal ? `<div class="optimal-badge">${t['optimal_pick'] || '★ Optimal Pick'}</div>` : '';
    const shineHTML = isOptimal ? `<div class="shine-layer"></div>` : '';
    const graffitiHTML = isOptimal ? `<div class="graffiti-bg">${model.provider}</div>` : '';

    const isSaved = savedStack.includes(model.id);
    let actionBtnHTML = '';

    if (isStackView) {
        actionBtnHTML = `<div class="unstack-btn" onclick="toggleBookmark('${model.id}')" title="Remove from Stack">${t['unstack'] || '✕ Unstack'}</div>`;
    } else {
        actionBtnHTML = `<div class="bookmark-btn ${isSaved ? 'saved' : ''}" onclick="toggleBookmark('${model.id}')" title="Save to Stack">${isSaved ? '★' : '🔖'}</div>`;
    }

    const activeData = getModelData(model, currentLang);
    const typeStr = activeData.type || model.type;
    const descStr = activeData.desc || model.desc;

    const freeText = t['badge_free'] ? t['badge_free'].split('/')[0].trim() : 'Free';
    const displayCost = model.costString === 'Free' ? freeText : (model.id === 'midjourney-v6' ? (t['cost_sub'] || model.costString) : model.costString);

    return `
        <div class="card ${optimalClass}">
            ${actionBtnHTML}
            ${shineHTML}
            ${graffitiHTML}
            ${badgeHTML}
            <div class="card-content">
                <div class="model-type">${typeStr}</div>
                <h3>${model.name}</h3>
                <p>${descStr}</p>
            </div>
            <div class="card-footer card-content">
                <span>${model.provider}</span>
                <span><strong>${displayCost}</strong></span>
            </div>
        </div>
    `;
}

function updateTableCosts() {
    const tokenInput = parseInt(document.getElementById('tokenInput').value) || 0;
    const comparisonBody = document.getElementById('comparisonBody');
    const t = translations[currentLang] || translations['en'];
    const freeText = t['badge_free'] ? t['badge_free'].split('/')[0].trim() : 'Free';
    const tokenTxt = t['tokens'] || 'tokens';

    comparisonBody.innerHTML = currentTableModels.map(m => {
        const isOverallBest = (m === currentBestPaid) || (m === currentBestFree);
        let calculatedCost = m.costString === 'Free' ? freeText : (m.id === 'midjourney-v6' ? (t['cost_sub'] || m.costString) : m.costString);

        if (m.pricePerM !== null) {
            if (m.pricePerM === 0) calculatedCost = freeText;
            else {
                const cost = (m.pricePerM / 1000000) * tokenInput;
                calculatedCost = '$' + cost.toFixed(2);
            }
        }

        const activeData = getModelData(m, currentLang);

        return `
            <tr class="${isOverallBest ? 'highlight-row' : ''}">
                <td>${m.name} ${isOverallBest ? '★' : ''}</td>
                <td>${activeData.type || m.type}</td>
                <td>${activeData.specialty || m.specialty}</td>
                <td>${m.context.replace('tokens', tokenTxt)}</td>
                <td>${calculatedCost}</td>
            </tr>
        `;
    }).join('');
}

function findModels(skipScroll = false) {
    const input = document.getElementById('searchInput').value.toLowerCase().trim();
    const stickyInput = document.getElementById('stickySearchInput');
    if (stickyInput.value !== input) stickyInput.value = input;

    hideAllSections();
    if (!input) {
        document.getElementById('landingContent').style.display = 'block';
        return;
    }

    const searchTerms = input.split(' ');
    let hasValidMatch = false;

    const scoredModels = modelDatabase.map(m => {
        let score = 0;
        const activeData = getModelData(m, currentLang);

        const typeStr = (activeData.type || m.type || '').toLowerCase();
        const descStr = (activeData.desc || m.desc || '').toLowerCase();
        const specStr = (activeData.specialty || m.specialty || '').toLowerCase();

        searchTerms.forEach(term => {
            if (term.length < 2) return;
            if (m.tags.some(tag => tag.includes(term))) score += 10;
            if (m.name.toLowerCase().includes(term)) score += 5;
            if (typeStr.includes(term)) score += 3;
            if (descStr.includes(term) || specStr.includes(term)) score += 1;
        });

        if (score > 0) hasValidMatch = true;
        score += Math.random() * 0.1;
        return { model: m, score: score };
    });

    if (!hasValidMatch) {
        document.getElementById('errorSection').style.display = 'block';
        if (!skipScroll) window.scrollTo({ top: 300, behavior: 'smooth' });
        return;
    }

    const sortedPaid = scoredModels.filter(m => m.model.isPaid).sort((a, b) => b.score - a.score).map(m => m.model);
    const sortedFree = scoredModels.filter(m => !m.model.isPaid).sort((a, b) => b.score - a.score).map(m => m.model);

    const topPaid = sortedPaid.slice(0, 4);
    const topFree = sortedFree.slice(0, 4);
    currentBestPaid = topPaid[0];
    currentBestFree = topFree[0];

    document.getElementById('paidGrid').innerHTML = topPaid.map(m => renderCard(m, m === currentBestPaid)).join('');
    document.getElementById('freeGrid').innerHTML = topFree.map(m => renderCard(m, m === currentBestFree)).join('');

    if (currentBestPaid && currentBestFree) {
        const wantsFree = input.includes('free') || input.includes('local') || input.includes('open') || input.includes('cheap');
        const overallWinner = wantsFree ? currentBestFree : currentBestPaid;
        const t = translations[currentLang] || translations['en'];

        document.getElementById('verdictTitle').innerHTML = `${currentBestPaid.name} <span style="font-size:1.25rem;">${t['vs']}</span> ${currentBestFree.name}`;

        const verdictMsg = t['winner_prompt'] || 'Overall Winner for your prompt';
        const overallData = getModelData(overallWinner, currentLang);
        const rSum = overallData.rationale ? overallData.rationale.summary : overallWinner.rationale.summary;
        const rPts = overallData.rationale ? overallData.rationale.points : overallWinner.rationale.points;

        document.getElementById('verdictContent').innerHTML = `<strong>${verdictMsg}: <span style="color: var(--text-main);">${overallWinner.name}</span>.</strong><br><br>${rSum}`;

        document.getElementById('whyPoints').innerHTML = rPts.map(pt => `
            <div class="why-point-card">
                <h4>${pt.title}</h4>
                <p>${pt.desc}</p>
            </div>
        `).join('');

        document.getElementById('verdictSection').style.display = 'block';
    }

    currentTableModels = [...topPaid, ...topFree];
    updateTableCosts();

    document.getElementById('resultsQueryText').innerText = ` ("${input}")`;

    // Populate People Also Ask section based on search
    const sampleQuestions = [
        {
            question: "Which AI model is best for long-context document analysis?",
            answer: "Models like Gemini 1.5 Pro and Llama 3 offer large context windows capable of ingesting full books and repositories with high retrieval accuracy."
        },
        {
            question: "How do open-source models compare to commercial APIs in cost?",
            answer: "Open-source models hosted locally remove per-token API fees but require upfront hardware investment, whereas APIs offer zero setup cost but bill per usage."
        },
        {
            question: "Can I run these recommended models locally on consumer hardware?",
            answer: "Yes, quantized versions (GGUF/EXL2) of 7B to 14B models can easily run on modern consumer GPUs or Apple Silicon devices using tools like Ollama or LM Studio."
        }
    ];
    renderRelatedQuestions(sampleQuestions);

    document.getElementById('resultsSection').style.display = 'block';
    if (!skipScroll) window.scrollTo({ top: 300, behavior: 'smooth' });
}
