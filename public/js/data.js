/*
 * Quick Tech - Data Layer V3
 * Integrates with NewsService for live data, falls back to mock articles.
 */

// Fallback data - used when all RSS feeds are down and cache is empty
const MOCK_ARTICLES = [
    {
        id: "1",
        title: "RTX 5090: The New King of Rasterization?",
        summary: "Hardware Unboxed tests the limits of Nvidia's Blackwell architecture. Is the power draw justified?",
        content: "Full review pending...",
        category: "hardware",
        date: "2 Hours Ago",
        image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=1000",
        author: "Tech Steve",
        isExternal: false
    },
    {
        id: "2",
        title: "NASA Artemis II: Crew Selection Finalized",
        summary: "NASA announces the astronauts who will orbit the moon next year. Preparation enters final stages.",
        content: "Detailed biography of the crew members...",
        category: "space",
        date: "5 Hours Ago",
        image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=1000",
        author: "NASA Press",
        isExternal: false
    },
    {
        id: "3",
        title: "Windows 12 Rumors: AI Integration at Kernel Level?",
        summary: "Microsoft leaks suggest a complete rewrite of the scheduler to optimize for NPU usage.",
        content: "What does this mean for legacy x86 apps?...",
        category: "software",
        date: "6 Hours Ago",
        image: "https://images.unsplash.com/photo-1662947036644-8025268c2cc6?auto=format&fit=crop&q=80&w=1000",
        author: "MS Insider",
        isExternal: false
    },
    {
        id: "4",
        title: "DeepSeek-V3 Open Source Model Stuns Benchmark Charts",
        summary: "Beating GPT-4 on coding tasks while running on consumer hardware? The AI landscape just shifted.",
        content: "Detailed analysis...",
        category: "ai",
        date: "Yesterday",
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1000",
        author: "AI Researcher",
        isExternal: false
    },
    {
        id: "5",
        title: "Linux Kernel 6.12 Adds Rust Support for Drivers",
        summary: "A milestone for memory safety in the open source world. Torvalds approves initial merge.",
        content: "Technical breakdown of the new modules...",
        category: "software",
        date: "Yesterday",
        image: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&q=80&w=1000",
        author: "Tux Times",
        isExternal: false
    },
    {
        id: "6",
        title: "SpaceX Starship Booster Catch: Engineering Magic",
        summary: "Slow motion analysis of the chopstick maneuvering. How precision engineering made history.",
        content: "Frame by frame breakdown...",
        category: "space",
        date: "2 Days Ago",
        image: "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?auto=format&fit=crop&q=80&w=1000",
        author: "Orbit Watch",
        isExternal: false
    },
    {
        id: "7",
        title: "Android 15 Developer Preview: What's New?",
        summary: "Google drops the first look at the next OS. Privacy sandbox and satellite connectivity take center stage.",
        content: "Installation guide for Pixel users...",
        category: "software",
        date: "3 Days Ago",
        image: "https://images.unsplash.com/photo-1605236453692-07493b1f661e?auto=format&fit=crop&q=80&w=1000",
        author: "Droid Life",
        isExternal: false
    }
];

// Category fallback images (when RSS articles have no image)
const CATEGORY_FALLBACK_IMAGES = {
    'ai': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=600',
    'hardware': 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=600',
    'software': 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&q=80&w=600',
    'space': 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=600',
    'gaming': 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b28?auto=format&fit=crop&q=80&w=600',
    'tech news': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=600'
};

// Store fetched articles in memory for quick access
let _cachedArticles = null;

// Main entry: get all articles (live → cache → mock)
async function getArticles() {
    // Return memory cache if available
    if (_cachedArticles && _cachedArticles.length > 0) {
        return _cachedArticles;
    }

    try {
        const realNews = await NewsService.getLatestNews();
        if (realNews && realNews.length > 0) {
            // Fill in missing images with category fallbacks
            realNews.forEach(article => {
                if (!article.image) {
                    article.image = CATEGORY_FALLBACK_IMAGES[article.category] || CATEGORY_FALLBACK_IMAGES['tech news'];
                }
            });
            _cachedArticles = realNews;
            return realNews;
        }
    } catch (e) {
        console.warn('[Data] NewsService failed:', e);
    }

    // Fallback to mock
    console.log('[Data] Using mock articles');
    _cachedArticles = MOCK_ARTICLES;
    return MOCK_ARTICLES;
}

// Get article by ID (works for both mock and live articles)
async function getArticleById(id) {
    const articles = await getArticles();
    return articles.find(a => a.id === id) || null;
}

// Get articles by category (works with live auto-categorized articles)
async function getArticlesByCategory(category) {
    const articles = await getArticles();
    if (!category) return articles;

    return articles.filter(a => {
        const cat = a.category.toLowerCase();
        const search = category.toLowerCase();
        return cat === search || cat.includes(search);
    });
}
