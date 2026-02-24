/*
 * Quick Tech - Main Application Logic (Tailwind Version)
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Determine Page
    const isHomePage = !!document.getElementById('hero-featured');
    const isArticlePage = !!document.getElementById('article-page');
    const isCategoryPage = !!document.getElementById('category-page');

    if (isHomePage) {
        await loadHomePage();
    } else if (isArticlePage) {
        await loadArticlePage();
    } else if (isCategoryPage) {
        await loadCategoryPage();
    }

    // Auth UI Update (Global) - Handled by auth.js but we ensure user name is set if element exists
    const userJson = localStorage.getItem('qt_user');
    if (userJson) {
        const user = JSON.parse(userJson);
        const profileEl = document.getElementById('user-profile');
        if (profileEl) {
            // Simple override to show logged in state in nav if not standard
            profileEl.innerHTML = `
                <span class="text-gray-300 text-sm hidden md:block">Cmdr. ${user.name}</span>
                <button onclick="handleLogout()" class="text-xs text-qt-red hover:text-white border border-qt-red px-3 py-1 rounded">Sign Out</button>
             `;
        }
    }
});

async function loadHomePage() {
    // Show loading skeleton immediately
    showLoadingState();

    const articles = await getArticles();

    // 1. Setup Hero Carousel
    if (articles.length > 0) {
        initHeroCarousel(articles.slice(0, 5));
    }

    // 2. Setup Latest List (Top 10)
    const latestList = document.getElementById('latest-list');
    if (latestList) {
        latestList.innerHTML = '';
        articles.slice(0, 10).forEach(article => {
            const card = createLatestCard(article);
            latestList.appendChild(card);
        });
    }

    // 3. Populate Quick Hits sidebar
    populateQuickHits(articles);
}

function showLoadingState() {
    const latestList = document.getElementById('latest-list');
    if (latestList) {
        latestList.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'flex flex-col md:flex-row gap-6 p-6 bg-gray-900 rounded-xl border border-gray-800 animate-pulse';
            skeleton.innerHTML = `
                <div class="w-full md:w-48 h-32 flex-shrink-0 rounded-lg bg-gray-800"></div>
                <div class="flex flex-col justify-center flex-grow space-y-3">
                    <div class="h-3 bg-gray-800 rounded w-1/4"></div>
                    <div class="h-5 bg-gray-800 rounded w-3/4"></div>
                    <div class="h-4 bg-gray-800 rounded w-full"></div>
                </div>
            `;
            latestList.appendChild(skeleton);
        }
    }
}

function populateQuickHits(articles) {
    const list = document.getElementById('quick-hits-list');
    if (!list || articles.length === 0) return;

    list.innerHTML = '';
    // Pick 5 articles from different categories for variety
    const seen = new Set();
    const picks = [];
    for (const article of articles) {
        if (picks.length >= 5) break;
        if (!seen.has(article.category)) {
            seen.add(article.category);
            picks.push(article);
        }
    }
    // Fill remaining slots if less than 5 unique categories
    for (const article of articles) {
        if (picks.length >= 5) break;
        if (!picks.includes(article)) picks.push(article);
    }

    picks.forEach(article => {
        const li = document.createElement('li');
        li.className = 'group cursor-pointer';
        li.onclick = () => {
            if (article.isExternal) {
                window.open(article.url, '_blank');
            } else {
                window.location.href = `article.html?id=${article.id}`;
            }
        };
        li.innerHTML = `
            <span class="text-qt-accent text-xs font-bold uppercase">${article.category}</span>
            <p class="text-sm font-medium group-hover:text-qt-red transition-colors">${article.title}</p>
        `;
        list.appendChild(li);
    });
}

// Hero Carousel Logic (V6)
let currentSlide = 0;
let slideInterval;
let heroArticles = [];

function initHeroCarousel(articles) {
    heroArticles = articles;
    const heroEl = document.getElementById('hero-featured');
    if (!heroEl) return;

    // Controls
    document.getElementById('hero-next')?.addEventListener('click', (e) => {
        e.stopPropagation();
        nextSlide();
        resetTimer();
    });

    document.getElementById('hero-prev')?.addEventListener('click', (e) => {
        e.stopPropagation();
        prevSlide();
        resetTimer();
    });

    // Click to Open
    heroEl.onclick = () => {
        const article = heroArticles[currentSlide];
        if (article.isExternal) {
            window.open(article.url, '_blank');
        } else {
            window.location.href = `article.html?id=${article.id}`;
        }
    };

    // Init First Slide
    updateSlide(0);
    resetTimer();
}

function updateSlide(index) {
    currentSlide = index;
    const article = heroArticles[currentSlide];

    // Elements
    const img = document.getElementById('hero-img');
    const title = document.getElementById('hero-title');
    const cat = document.getElementById('hero-cat');

    // Animate Out (Simple Opacity)
    if (img) img.style.opacity = 0;
    if (title) title.style.opacity = 0;

    setTimeout(() => {
        // Update Content
        if (img) {
            img.src = article.image;
            img.style.opacity = 1;
        }
        if (title) {
            title.textContent = article.title;
            title.style.opacity = 1;
        }
        if (cat) cat.textContent = article.category;
    }, 300); // Wait for fade out
}

function nextSlide() {
    let next = currentSlide + 1;
    if (next >= heroArticles.length) next = 0;
    updateSlide(next);
}

function prevSlide() {
    let prev = currentSlide - 1;
    if (prev < 0) prev = heroArticles.length - 1;
    updateSlide(prev);
}

function resetTimer() {
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 5000); // 5 Seconds
}

function createLatestCard(article) {
    const div = document.createElement('div');
    div.className = "flex flex-col md:flex-row gap-6 p-6 bg-gray-900 rounded-xl border border-gray-800 hover:border-qt-red/50 transition-colors group cursor-pointer";
    div.onclick = () => {
        if (article.isExternal) {
            window.open(article.url, '_blank');
        } else {
            window.location.href = `article.html?id=${article.id}`;
        }
    };

    const fallbackImg = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=600';

    div.innerHTML = `
        <div class="w-full md:w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800 relative">
            <img src="${article.image || fallbackImg}" onerror="this.src='${fallbackImg}'" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy">
        </div>
        <div class="flex flex-col justify-center">
            <div class="flex items-center gap-3 mb-2">
                <span class="text-xs font-bold uppercase text-qt-red bg-red-900/20 px-2 py-0.5 rounded">${article.category}</span>
                <span class="text-xs text-gray-500">${article.date}</span>
                <span class="text-xs text-gray-600">• ${article.author}</span>
                ${article.isExternal ? '<span class="text-xs text-gray-700">↗ External</span>' : ''}
            </div>
            <h3 class="text-xl font-bold text-white mb-2 group-hover:text-qt-red transition-colors">${article.title}</h3>
            <p class="text-gray-400 text-sm line-clamp-2">${article.summary}</p>
        </div>
    `;
    return div;
}

// Reuse card for grid view
function createGridCard(article) {
    const div = document.createElement('div');
    div.className = "bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-qt-red/50 transition-all group flex flex-col cursor-pointer";
    div.onclick = () => {
        if (article.isExternal) {
            window.open(article.url, '_blank');
        } else {
            window.location.href = `article.html?id=${article.id}`;
        }
    };

    const fallbackImg = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=600';

    div.innerHTML = `
        <div class="h-48 overflow-hidden relative">
            <img src="${article.image || fallbackImg}" onerror="this.src='${fallbackImg}'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
            <span class="absolute top-2 right-2 bg-black/70 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded">${article.category}</span>
        </div>
        <div class="p-6 flex flex-col flex-grow">
            <h3 class="text-lg font-bold text-white mb-2 leading-tight group-hover:text-qt-red transition-colors">
                ${article.title}
            </h3>
            <p class="text-gray-400 text-sm mb-4 flex-grow">${article.summary}</p>
            <div class="flex justify-between items-center pt-4 border-t border-gray-800">
                 <span class="text-xs text-gray-500">${article.date}</span>
                 <span class="text-xs font-bold text-white group-hover:text-qt-red">${article.isExternal ? 'READ ↗' : 'READ →'}</span>
            </div>
        </div>
    `;
    return div;
}

async function loadArticlePage() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    const article = await getArticleById(id);
    if (!article) {
        document.getElementById('article-body').innerHTML = '<p class="text-xl text-gray-400">Article not found.</p>';
        return;
    }

    // External articles: redirect to source
    if (article.isExternal && article.url) {
        document.title = `${article.title} | Quick Tech`;
        updateText('article-title', article.title);
        updateText('article-category', article.category.toUpperCase());
        updateText('article-date', article.date);
        updateText('article-author', article.author);

        const fallbackImg = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=600';
        const imgEl = document.getElementById('article-image');
        if (imgEl) {
            imgEl.src = article.image || fallbackImg;
            imgEl.onerror = function () { this.src = fallbackImg; };
        }

        document.getElementById('article-body').innerHTML = `
            <p class="text-xl text-gray-300 mb-8 border-l-4 border-qt-red pl-4 italic">${article.summary}</p>
            <div class="bg-gray-900 border border-gray-700 rounded-xl p-8 text-center">
                <p class="text-gray-400 mb-4">This article is sourced from <strong class="text-white">${article.author}</strong>.</p>
                <a href="${article.url}" target="_blank" rel="noopener"
                   class="inline-flex items-center gap-2 bg-qt-red hover:bg-red-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-colors">
                    Read Full Article ↗
                </a>
            </div>
        `;
        return;
    }

    // Internal article
    document.title = `${article.title} | Quick Tech`;
    updateText('article-title', article.title);
    updateText('article-category', article.category.toUpperCase());
    updateText('article-date', article.date);
    updateText('article-author', article.author);

    document.getElementById('article-image').src = article.image;
    document.getElementById('article-body').innerHTML = `
        <p class="text-xl text-gray-300 mb-8 border-l-4 border-qt-red pl-4 italic">${article.summary}</p>
        <p>${article.content || ''}<br><br>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    `;
}

async function loadCategoryPage() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('c');

    const titleEl = document.getElementById('category-title');
    if (category && titleEl) {
        titleEl.textContent = `${category} Archives`;
    }

    const articles = category ? await getArticlesByCategory(category) : await getArticles();
    const grid = document.getElementById('category-grid');

    if (grid) {
        grid.innerHTML = '';
        if (articles.length === 0) {
            grid.innerHTML = '<p class="text-gray-500">No signals found on this frequency.</p>';
        } else {
            articles.forEach(article => {
                grid.appendChild(createGridCard(article));
            });
        }
    }
}

function updateText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}
