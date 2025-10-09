#!/bin/bash

echo "🚀 LoL Custom Game Helper - Cloud Deployment Guide"
echo "================================================="
echo ""

echo "Alege platforma pentru deploy:"
echo "1) Vercel (Cel mai simplu pentru Next.js)"
echo "2) Railway (Cel mai bun pentru full-stack)"
echo "3) Render (Alternativă gratuită)"
echo "4) Manual setup pe VPS"
echo ""

read -p "Selectează opțiunea (1-4): " option

case $option in
    1)
        echo ""
        echo "📦 VERCEL DEPLOYMENT"
        echo "==================="
        echo "1. Mergi pe https://vercel.com și creează cont"
        echo "2. Conectează-ți repo-ul GitHub"
        echo "3. Import project: https://github.com/andreidavid03/League-Custom-Game-Helper"
        echo "4. Vercel va detecta automat Next.js"
        echo "5. Deploy!"
        echo ""
        echo "URL-ul va fi: https://your-app-name.vercel.app"
        ;;
    2)
        echo ""
        echo "🚂 RAILWAY DEPLOYMENT"
        echo "===================="
        echo "1. Mergi pe https://railway.app și creează cont"
        echo "2. New Project > Deploy from GitHub repo"
        echo "3. Selectează: https://github.com/andreidavid03/League-Custom-Game-Helper"
        echo "4. Railway va citi railway.yaml automat"
        echo "5. Deploy!"
        echo ""
        echo "Vei primi 2 URL-uri: unul pentru frontend, unul pentru backend"
        ;;
    3)
        echo ""
        echo "🎨 RENDER DEPLOYMENT"
        echo "==================="
        echo "1. Mergi pe https://render.com și creează cont"
        echo "2. New > Blueprint"
        echo "3. Connect GitHub: https://github.com/andreidavid03/League-Custom-Game-Helper"
        echo "4. Render va citi render.yaml automat"
        echo "5. Deploy!"
        echo ""
        ;;
    4)
        echo ""
        echo "⚙️ MANUAL VPS SETUP"
        echo "==================="
        echo "Pentru un VPS (Digital Ocean, Linode, etc.):"
        echo ""
        echo "# Pe server:"
        echo "sudo apt update && sudo apt install nodejs npm nginx -y"
        echo "git clone https://github.com/andreidavid03/League-Custom-Game-Helper.git"
        echo "cd League-Custom-Game-Helper"
        echo "npm run install:all"
        echo "npm run build"
        echo ""
        echo "# Setup PM2 pentru production:"
        echo "sudo npm install -g pm2"
        echo "pm2 start 'npm run start' --name lol-helper"
        echo "pm2 startup"
        echo "pm2 save"
        echo ""
        echo "# Setup Nginx reverse proxy:"
        echo "sudo nano /etc/nginx/sites-available/lol-helper"
        echo ""
        ;;
    *)
        echo "Opțiune invalidă!"
        ;;
esac

echo ""
echo "💡 RECOMANDAREA MEA:"
echo "Pentru începuturi: Vercel (cel mai simplu)"
echo "Pentru ceva mai serios: Railway (database inclus)"
echo ""
echo "După deploy, prietenii tăi vor putea accesa aplicația la URL-ul primit!"