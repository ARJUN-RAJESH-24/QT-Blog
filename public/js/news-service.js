/**
 * Quick Tech - News Service
 * Handles fetching real-time news from external APIs with caching.
 */

const NewsService = {
    API_URL: 'http://localhost:5000/api/news', // Local Flask Backend
    CACHE_KEY: 'qt_news_cache',
    CACHE_DURATION: 2 * 60 * 60 * 1000, // 2 Hours in ms

    async getLatestNews() {
        console.log('[NewsService] Requesting data...');

        // 1. Check Cache
        const cached = localStorage.getItem(this.CACHE_KEY);
        if (cached) {
            const data = JSON.parse(cached);
            const now = new Date().getTime();

            if (now - data.timestamp < this.CACHE_DURATION) {
                console.log('[NewsService] Serving from Cache');
                return data.articles;
            } else {
                console.log('[NewsService] Cache expired');
            }
        }

        // 2. Fetch Fresh Data
        try {
            console.log('[NewsService] Fetching from API...');
            const response = await fetch(this.API_URL);
            if (!response.ok) throw new Error('Network response was not ok');

            const json = await response.json();

            // Map to our internal format
            const articles = json.articles
                .filter(a => a.title) // Only require Title
                .map((a, index) => ({
                    id: 'ext-' + index, // Temp ID
                    title: a.title,
                    summary: a.description || 'Click to read full story...', // Fallback
                    category: 'Tech News', // Default for external
                    author: a.source.name || 'Unknown',
                    date: new Date(a.publishedAt).toLocaleDateString(),
                    image: a.urlToImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=600', // Generic Tech Fallback
                    url: a.url, // Original Link
                    isExternal: true
                }));

            // Save to Cache
            localStorage.setItem(this.CACHE_KEY, JSON.stringify({
                timestamp: new Date().getTime(),
                articles: articles
            }));

            return articles;

        } catch (error) {
            console.error('[NewsService] Error:', error);
            // Fallback to empty array (will cause app to use local mock data)
            return [];
        }
    },

    clearCache() {
        localStorage.removeItem(this.CACHE_KEY);
        console.log('[NewsService] Cache cleared');
    }
};
