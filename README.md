# BigQuery Release Pulse

A premium, real-time web application designed to track Google Cloud BigQuery Release Notes and make sharing updates on social media seamless. 

Built with a modern, deep-dark glassmorphism design, the app fetches the official BigQuery feed, segments the release notes by type, and offers an integrated tweet composer with smart truncation to fit X (Twitter) character limits.

---

## ✨ Features

- 🔄 **Real-Time Sync**: Syncs live data directly from the official Google Cloud RSS feed with a simple click and visual loading spinner.
- 🏷️ **Categorized Feed**: Google's feed batches updates together. Release Pulse automatically parses, segments, and labels individual updates into clean categories:
  - `Feature` (Green)
  - `Announcement` (Purple)
  - `Breaking` (Red)
  - `Change` (Yellow)
  - `Issue` (Orange)
- 🔍 **Instant Search & Filter**: Real-time client-side search query parsing and tag filtering.
- 🐦 **Tweet Share Hub**: 
  - Dynamic tweet generator with a live character counter.
  - Smart truncation algorithm: Handles Twitter's standard link length policy (always counts URLs as 23 characters) to ensure your tweet is formatted correctly and fits the 280-character limit.
  - Quick post link directly opening the X composer.
- 📱 **Fully Responsive**: Adapts elegantly across mobile, tablet, and wide desktop screens (using grid layouts and bottom sheets).

---

## 🛠️ Tech Stack

- **Backend**: Python 3, [Flask](https://flask.palletsprojects.com/) (Web framework), [BeautifulSoup4](https://www.crummy.com/software/BeautifulSoup/) (HTML Parsing)
- **Frontend**: Vanilla HTML5, Vanilla CSS3 (Custom Variables, Keyframe Animations, Flexbox/Grid), JavaScript (ES6, Fetch API)
- **Icons**: FontAwesome 6 (CDN-loaded)
- **Fonts**: Outfit (headings), Plus Jakarta Sans (body)

---

## 📁 Project Structure

```text
├── app.py                  # Flask application & RSS XML parser
├── static/
│   ├── css/
│   │   └── styles.css      # Core styles, glassmorphism, animations
│   └── js/
│       └── app.js          # Live search, filters, tweet composer logic
├── templates/
│   └── index.html          # Main HTML structure with semantic SEO layout
├── .gitignore              # Ignores local environments, pycache, and logs
└── README.md               # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have Python 3.8+ installed on your machine.

### Installation

1. Clone this repository to your local machine:
   ```bash
   git clone https://github.com/Maz2580/mazdak-ghasemi-event-talks-app.git
   cd mazdak-ghasemi-event-talks-app
   ```

2. (Optional but recommended) Create and activate a virtual environment:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install the required dependencies:
   ```bash
   pip install Flask beautifulsoup4
   ```

### Running the App

Start the Flask development server:
```bash
python app.py
```

Open your browser and navigate to:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 📄 License

This project is licensed under the MIT License - see your choice of license for details.
