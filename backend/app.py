from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Mock Data (taken from public/js/data.js)
MOCK_ARTICLES = [
    {
        "id": "1",
        "title": "RTX 5090: The New King of Rasterization?",
        "summary": "Hardware Unboxed tests the limits of Nvidia's Blackwell architecture. Is the power draw justified?",
        "content": "Full review pending...",
        "category": "hardware",
        "date": "2 Hours Ago",
        "image": "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=1000",
        "author": "Tech Steve"
    },
    {
        "id": "2",
        "title": "NASA Artemis II: Crew Selection Finalized",
        "summary": "NASA announces the astronauts who will orbit the moon next year. Preparation enters final stages.",
        "content": "Detailed biography of the crew members...",
        "category": "space",
        "date": "5 Hours Ago",
        "image": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=1000",
        "author": "NASA Press"
    },
    {
        "id": "3",
        "title": "Windows 12 Rumors: AI Integration at Kernel Level?",
        "summary": "Microsoft leaks suggest a complete rewrite of the scheduler to optimize for NPU usage.",
        "content": "What does this mean for legacy x86 apps?...",
        "category": "software",
        "date": "6 Hours Ago",
        "image": "https://images.unsplash.com/photo-1662947036644-8025268c2cc6?auto=format&fit=crop&q=80&w=1000",
        "author": "MS Insider"
    },
    {
        "id": "4",
        "title": "DeepSeek-V3 Open Source Model Stuns Benchmark Charts",
        "summary": "Beating GPT-4 on coding tasks while running on consumer hardware? The AI landscape just shifted.",
        "content": "Detailed analysis...",
        "category": "ai",
        "date": "Yesterday",
        "image": "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1000",
        "author": "AI Researcher"
    },
    {
        "id": "5",
        "title": "Linux Kernel 6.12 Adds Rust Support for Drivers",
        "summary": "A milestone for memory safety in the open source world. Torvalds approves initial merge.",
        "content": "Technical breakdown of the new modules...",
        "category": "software",
        "date": "Yesterday",
        "image": "https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&q=80&w=1000",
        "author": "Tux Times"
    },
    {
        "id": "6",
        "title": "SpaceX Starship Booster Catch: Engineering Magic",
        "summary": "Slow motion analysis of the chopstick maneuvering. How precision engineering made history.",
        "content": "Frame by frame breakdown...",
        "category": "space",
        "date": "2 Days Ago",
        "image": "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?auto=format&fit=crop&q=80&w=1000",
        "author": "Orbit Watch"
    },
    {
        "id": "7",
        "title": "Android 15 Developer Preview: What's New?",
        "summary": "Google drops the first look at the next OS. Privacy sandbox and satellite connectivity take center stage.",
        "content": "Installation guide for Pixel users...",
        "category": "software",
        "date": "3 Days Ago",
        "image": "https://images.unsplash.com/photo-1605236453692-07493b1f661e?auto=format&fit=crop&q=80&w=1000",
        "author": "Droid Life"
    }
]

@app.route('/api/news', methods=['GET'])
def get_news():
    return jsonify({"articles": MOCK_ARTICLES})

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "backend"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
