# <p style="text-align:center;">🚀 URL Shortener</p>

### A modern, full-featured URL Shortener built using Node.js + Express, with clean EJS templates and real-time analytics.

>⚠️ Note:
The app is deployed on Render (Free Tier), which goes into sleep mode after ~15–20 minutes of inactivity.
The first request may take 20–60 seconds to load.
Please wait during the cold start.

## ✨ Features

🔗 Create short URLs with custom or auto-generated codes

📊 Track total clicks + analytics

🕒 View timestamps of visitor access

📈 Dashboard

💻 Clean UI with EJS templates

📱 Fully responsive

## 🛠️ Tech Stack

Node.js + Express

PostgreSQL (Neon)

EJS (templates)

Render (deployment)

## 🚀 Local Development

### Clone the repo:
```
git clone https://github.com/RishabhSinghBhadoriya/url-shortener.git
cd url-shortener
```

### Install dependencies:
```
npm install
```

### Setup environment variables:
```
Copy .env.example .env
```
#### Add your Neon DB URL:

DATABASE_URL="your-postgres-url"


### Run the app:
```
npm start
```

Open in browser:
```
http://localhost:3000
```

### 📦 Deployment (Render)

- Hosted on Render Free Tier

- Database on Neon PostgreSQL

- Expect cold start delays (20–60s)

### 📁 Folder Structure
```markdown
project/
├── views/        # EJS templates
├── public/       # CSS, client JS
├── routes/       # Express routes
├── db/           # Database queries
├── utils/        # Helper utilities
├── app.js        # Main entry file
└── README.md
```

## 🤝 Contributions

Contributions, issues, and feature requests are welcome!
Feel free to open an issue or submit a PR.

> ⭐ If You Like This Project