# 🎮 LoL Custom Game Helper by David Demon

A modern, professional web application for organizing League of Legends custom games with style and efficiency.

![LoL Custom Game Helper](./Assets/icon-128.png)

## ✨ Features

### 🎨 Visual Design
- **Custom LoL-themed Icon**: Professional icon with crossed swords design
- **League of Legends Color Scheme**: Authentic gold and blue styling
- **Responsive Interface**: Clean, modern UI that scales properly

### 🎮 Game Features
- 🎡 **Interactive Wheel Spinner** - Professional wheel animation for team selection
- 👑 **Captain Draft Mode** - Strategic team building with captain picks
- 🎲 **Random Team Generator** - Fair and balanced team creation

- 🏹 **Role Assignment** - Automatic role distribution (Top, Jungle, Mid, ADC, Support)### �🎮 Game Modes

- 📊 **Match History** - Track and analyze your custom games- **5v5 Custom**: Complete Summoner's Rift experience with roles

- 🎨 **Modern UI** - Clean, responsive design with LoL theming- **ARAM**: All Random All Mid for maximum chaos

- 🔊 **Sound Effects** - Immersive audio feedback

- 📱 **Mobile Friendly** - Works perfectly on all devices### ⚙️ Game Settings

- **Random Teams**: Automatically form teams

- **Random Roles**: Randomly assign roles (Top, Jungle, Mid, ADC, Support)
- **Random Champions**: Randomly select champions for each player

### 🎯 Selection Methods
- **Random**: Complete automatic selection
- **Wheel Spinner**: Interactive spinning wheel for selections
- **Captain Draft**: Two captains pick teams alternately

### 👥 Player Management
- Add/remove players from roster
- Manage active player list
- Flexible selection for each game

### 📊 Match History
- Save game results
- Detailed per-player statistics
- History of champions and roles played

## 🚀 Tech Stack

### Frontend
- **Next.js 14** with TypeScript
- **React 18** with modern hooks
- **Tailwind CSS** for modern styling
- **Framer Motion** for smooth animations
- **React Query** for state management

### Backend
- **Node.js** with TypeScript
- **Express.js** for API routes
- **SQLite** with Drizzle ORM
- **Real-time updates** for live features

## 🏁 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "LoL Custom Game Heper by David Demon"
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Alternative: Use the startup script

For a guided setup experience:
```bash
./start-app.sh
```

This script will:
- Install all dependencies
- Start both frontend and backend servers
- Open your browser automatically

## 🎮 How to Use

1. **Add Players** - Enter player names to build your player pool

2. **Select Game Mode**:
   - **Wheel Mode**: Spin the wheel for dramatic team selection
   - **Captain Mode**: Choose captains who draft their teams
   - **Random Mode**: Instant balanced team generation

3. **Assign Roles** - Automatic or manual role distribution

4. **Start Playing** - Teams are ready for your custom game!

## 🔧 Development

### Frontend Development
```bash
cd frontend
npm run dev
```

### Backend Development
```bash
cd backend
npm run dev
```

### Database Management
```bash
cd backend
npm run db:push    # Push schema changes
npm run db:studio  # Open database browser
```

## 📦 Building for Production

```bash
npm run build
npm run start
```

## 🎨 Customization

### Adding New Champions
Edit `backend/src/data/champions.json` to add or modify champions.

### Styling
The project uses Tailwind CSS. Customize colors and styling in:
- `frontend/tailwind.config.ts`
- `frontend/src/app/globals.css`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Riot Games for League of Legends
- The React and Next.js communities
- All contributors and testers

---

**Made with ❤️ for the League of Legends community**

- All contributors and testers- **LoL Color Palette**: Gold (#C89B3C) and dark blue (#010A13)

- **Multiple Formats**: SVG source, PNG for display, various sizes

## 📞 Support- **Professional Look**: Appears in taskbar, window title, and app header



For support, email support@example.com or join our Discord server.## How to Use



---1. **Add Players**: Navigate to the Players section and add your friends

2. **Choose Game Mode**: Select 5v5 or ARAM

**Made with ❤️ by David Demon** | *Elevating custom games to the next level*3. **Configure Settings**: Choose what you want to randomize
4. **Select Method**: Random, Wheel, or Captain Draft
5. **Select Players**: Check who participates in the game
6. **Start Game**: Generate teams and enjoy the game!

## Future Features

- [ ] Advanced per-player statistics
- [ ] Export results to CSV/Excel
- [ ] Riot API integration for champion data
- [ ] Tournament mode with bracket
- [ ] Internal rating system
- [ ] Discord bot integration

## League of Legends Design

The application uses the official LoL color palette:
- **Gold Primary**: #C89B3C
- **Blue Team**: #0F2027  
- **Red Team**: #2C1810
- **Dark Background**: #010A13
- **Accent**: #F0E6D2

## Contributing

Created with ❤️ by David Demon for LoL friends!

For bug reports or feature requests, create an issue in the repository.

## License

This project is intended for personal and educational use. League of Legends is a registered trademark of Riot Games.