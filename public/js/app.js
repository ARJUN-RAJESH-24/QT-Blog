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
    const articles = await getArticles();
    // 1. Setup Hero Carousel
    if (articles.length > 0) {
        initHeroCarousel(articles.slice(0, 5)); // Use top 5 for carousel
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

    div.innerHTML = `
        <div class="w-full md:w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800 relative">
            <img src="${article.image}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
        </div>
        <div class="flex flex-col justify-center">
            <div class="flex items-center gap-3 mb-2">
                <span class="text-xs font-bold uppercase text-qt-red bg-red-900/20 px-2 py-0.5 rounded">${article.category}</span>
                <span class="text-xs text-gray-500">${article.date}</span>
                <span class="text-xs text-gray-600">• ${article.author}</span>
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
    div.className = "bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-qt-red/50 transition-all group flex flex-col";

    div.innerHTML = `
        <div class="h-48 overflow-hidden relative">
            <img src="${article.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <span class="absolute top-2 right-2 bg-black/70 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded">${article.category}</span>
        </div>
        <div class="p-6 flex flex-col flex-grow">
            <h3 class="text-lg font-bold text-white mb-2 leading-tight group-hover:text-qt-red transition-colors">
                <a href="article.html?id=${article.id}">${article.title}</a>
            </h3>
            <p class="text-gray-400 text-sm mb-4 flex-grow">${article.summary}</p>
            <div class="flex justify-between items-center pt-4 border-t border-gray-800">
                 <span class="text-xs text-gray-500">${article.date}</span>
                 <a href="${article.isExternal ? article.url : 'article.html?id=' + article.id}" ${article.isExternal ? 'target="_blank"' : ''} class="text-xs font-bold text-white hover:text-qt-red">READ -></a>
            </div>
        </div>
    `;
    return div;
}

async function loadArticlePage() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    const article = await getArticleById(id);
    if (!article) return;

    document.title = `${article.title} | Quick Tech`;
    updateText('article-title', article.title);
    updateText('article-category', article.category);
    updateText('article-date', article.date);
    updateText('article-author', article.author);

    document.getElementById('article-image').src = article.image;
    document.getElementById('article-body').innerHTML = `
        <p class="text-xl text-gray-300 mb-8 border-l-4 border-qt-red pl-4 italic">${article.summary}</p>
        <p>${article.content}<br><br>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        <h3 class="text-2xl font-bold text-white mt-8 mb-4">Performance Analysis</h3>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
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
