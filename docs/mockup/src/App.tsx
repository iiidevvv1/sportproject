/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Target, 
  Plus, 
  MoreHorizontal, 
  ChevronRight, 
  ArrowLeft, 
  Info, 
  ArrowRight,
  RotateCcw,
  RotateCw,
  Ban,
  ChevronLeft,
  Menu,
  Search,
  Star,
  Shield,
  BarChart2,
  Users,
  XCircle,
  Crosshair,
  Sigma
} from 'lucide-react';
import { Game, Team, TeamColor, TEAM_COLORS, Shot, End } from './types';

// Mock Data
const MOCK_GAMES: Game[] = [
  {
    id: '1',
    date: '19 МАРТА 2026',
    ourTeam: { name: 'Красные', color: 'red' },
    opponentTeam: { name: 'Желтые', color: 'yellow' },
    totalEnds: 8,
    currentEnd: 8,
    hammerInFirst: 'ours',
    status: 'completed',
    ends: [
      { number: 1, ourScore: 0, opponentScore: 1, shots: [] },
      { number: 2, ourScore: 2, opponentScore: 0, shots: [] },
      { number: 3, ourScore: 0, opponentScore: 2, shots: [] },
      { number: 4, ourScore: 1, opponentScore: 0, shots: [] },
      { number: 5, ourScore: 0, opponentScore: 1, shots: [] },
      { number: 6, ourScore: 1, opponentScore: 2, shots: [] },
      { number: 7, ourScore: 0, opponentScore: 2, shots: [] },
      { number: 8, ourScore: 1, opponentScore: 0, shots: [] },
    ]
  },
  {
    id: '2',
    date: '18 МАРТА 2026',
    ourTeam: { name: 'Альфа', color: 'red' },
    opponentTeam: { name: 'Омега', color: 'yellow' },
    totalEnds: 10,
    currentEnd: 10,
    hammerInFirst: 'theirs',
    status: 'completed',
    ends: []
  }
];

export default function App() {
  const [screen, setScreen] = useState<'dashboard' | 'new-game' | 'in-game' | 'stats'>('dashboard');
  const [statsTab, setStatsTab] = useState<'overall' | 'positions'>('overall');
  const [games, setGames] = useState<Game[]>(MOCK_GAMES);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [currentShot, setCurrentShot] = useState<Partial<Shot>>({
    type: 'draw',
    rotation: 'inturn',
    score: 100,
    isHogged: false
  });

  const Header = ({ 
    leftIcon, 
    centerContent, 
    rightIcon 
  }: { 
    leftIcon?: React.ReactNode, 
    centerContent: React.ReactNode, 
    rightIcon?: React.ReactNode 
  }) => (
    <header className="fixed top-0 w-full z-50 bg-white flex items-center justify-between px-6 py-4 shadow-sm border-b border-slate-100/50">
      <div className="w-12 flex items-center justify-start">
        {leftIcon}
      </div>
      <div className="flex-1 flex justify-center overflow-hidden">
        {centerContent}
      </div>
      <div className="w-12 flex items-center justify-end">
        {rightIcon}
      </div>
    </header>
  );

  // Derived state for current shot tracking
  const getCurrentShotInfo = (): { team: 'ours' | 'theirs', player: Shot['playerPos'], stone: number } => {
    if (!activeGame) return { team: 'ours', player: 'lead', stone: 1 };
    const currentEnd = activeGame.ends[activeGame.currentEnd - 1];
    const shotCount = currentEnd.shots.length;
    
    // 16 shots per end (8 per team)
    const team = shotCount % 2 === 0 
      ? (activeGame.hammerInFirst === 'ours' ? 'theirs' : 'ours')
      : (activeGame.hammerInFirst === 'ours' ? 'ours' : 'theirs');
    
    // This is a simplification, in real curling it depends on who has hammer in current end
    // For now let's just use the shot count to determine player and stone
    const stoneIndex = Math.floor(shotCount / 2); // 0 to 7
    const playerPos: Shot['playerPos'] = stoneIndex < 2 ? 'lead' : stoneIndex < 4 ? 'second' : stoneIndex < 6 ? 'third' : 'skip';
    
    return { team, player: playerPos, stone: stoneIndex + 1 };
  };

  const handleNextShot = () => {
    if (!activeGame) return;
    
    const info = getCurrentShotInfo();
    const newShot: Shot = {
      type: currentShot.type || 'draw',
      rotation: currentShot.rotation || 'inturn',
      score: currentShot.isHogged ? 0 : (currentShot.score || 0),
      isHogged: currentShot.isHogged || false,
      playerPos: info.player,
      stoneNum: info.stone
    };

    const updatedEnds = [...activeGame.ends];
    const currentEndIndex = activeGame.currentEnd - 1;
    updatedEnds[currentEndIndex].shots.push(newShot);

    const updatedGame = { ...activeGame, ends: updatedEnds };

    // Check if end is finished (16 shots)
    if (updatedEnds[currentEndIndex].shots.length === 16) {
      // For now, we'll just increment end and add a new end object if not at totalEnds
      if (updatedGame.currentEnd < updatedGame.totalEnds) {
        updatedGame.currentEnd += 1;
        updatedGame.ends.push({
          number: updatedGame.currentEnd,
          ourScore: 0,
          opponentScore: 0,
          shots: []
        });
      } else {
        updatedGame.status = 'completed';
        setGames(prev => prev.map(g => g.id === updatedGame.id ? updatedGame : g));
        setSelectedGameId(updatedGame.id);
        setActiveGame(null);
        setScreen('stats');
        return;
      }
    }

    setActiveGame(updatedGame);
    setGames(prev => prev.map(g => g.id === updatedGame.id ? updatedGame : g));
    setCurrentShot({ type: 'draw', rotation: 'inturn', score: 100, isHogged: false });
  };

  // New Game Form State
  const [newGameData, setNewGameData] = useState({
    ourName: '',
    ourColor: 'red' as TeamColor,
    oppName: '',
    oppColor: 'yellow' as TeamColor,
    hammer: 'ours' as 'ours' | 'theirs',
    ends: 10
  });

  const handleCreateGame = () => {
    const newGame: Game = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(),
      ourTeam: { name: newGameData.ourName || 'Наша команда', color: newGameData.ourColor },
      opponentTeam: { name: newGameData.oppName || 'Противник', color: newGameData.oppColor },
      totalEnds: newGameData.ends,
      currentEnd: 1,
      hammerInFirst: newGameData.hammer,
      status: 'live',
      ends: [{ number: 1, ourScore: 0, opponentScore: 0, shots: [] }]
    };
    setGames([newGame, ...games]);
    setActiveGame(newGame);
    setScreen('in-game');
  };

  const renderDashboard = () => (
    <div className="min-h-screen pb-20">
      <Header 
        leftIcon={<Target className="text-primary" size={24} />}
        centerContent={<h1 className="font-headline font-bold tracking-tight text-lg text-primary">Керлинг Стат</h1>}
      />

      <main className="pt-20 px-6 py-8 space-y-8">
        <header className="space-y-1">
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-[#0d1c2e]">Центр игры</h2>
          <p className="text-slate-500 text-sm">Точность на льду под контролем</p>
        </header>

        <section className="space-y-4">
          {activeGame && (
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-primary">ТЕКУЩИЙ МАТЧ</h3>
            </div>
          )}

          {activeGame ? (
            <div className="bg-white rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
              <div className="bg-slate-50/50 px-5 py-3 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider shrink-0 text-primary">
                  <span>Энд {activeGame.currentEnd}/{activeGame.totalEnds}</span>
                  <div className="h-1 w-1 rounded-full bg-primary/30 shrink-0"></div>
                  <span>Камень {getCurrentShotInfo().stone}</span>
                </div>
              </div>
              <div className="p-5">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-5 h-5 rounded-full stone-shadow shrink-0 shadow-sm" style={{ backgroundColor: TEAM_COLORS[activeGame.ourTeam.color] }}></div>
                        <h4 className="font-headline font-bold text-lg text-[#0d1c2e] leading-tight truncate">{activeGame.ourTeam.name}</h4>
                      </div>
                      <div className="text-4xl font-black text-[#0d1c2e] tabular-nums tracking-tighter">3</div>
                    </div>
                    <div className="flex items-center gap-3 py-1">
                      <div className="h-px bg-slate-100 flex-1"></div>
                      <span className="text-[9px] font-black text-slate-300 tracking-widest uppercase">vs</span>
                      <div className="h-px bg-slate-100 flex-1"></div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-5 h-5 rounded-full stone-shadow shrink-0 shadow-sm" style={{ backgroundColor: TEAM_COLORS[activeGame.opponentTeam.color] }}></div>
                        <h4 className="font-headline font-bold text-lg text-[#0d1c2e] leading-tight truncate">{activeGame.opponentTeam.name}</h4>
                      </div>
                      <div className="text-4xl font-black text-[#0d1c2e] tabular-nums tracking-tighter">2</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setScreen('in-game')}
                    className="group w-full bg-primary text-white py-4 rounded-xl font-headline font-bold text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 shadow-primary/20"
                  >
                    <span>Продолжить игру</span>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setScreen('new-game')}
              className="w-full border-2 border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center gap-3 group hover:bg-slate-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="text-primary" size={20} />
              </div>
              <span className="font-headline font-bold text-sm text-slate-500">Новая игра</span>
            </button>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-primary">ПРОШЕДШИЕ МАТЧИ</h3>
          <div className="space-y-4">
            {games.filter(g => g.status === 'completed').map(game => (
              <div 
                key={game.id} 
                className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm space-y-4 cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => {
                  setSelectedGameId(game.id);
                  setScreen('stats');
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{game.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center w-20">
                    <div className="w-3 h-3 rounded-full mb-1 shadow-sm" style={{ backgroundColor: TEAM_COLORS[game.ourTeam.color] }}></div>
                    <span className="text-xs font-bold text-[#0d1c2e] truncate w-full text-center">{game.ourTeam.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-black text-[#0d1c2e]">{game.ends.reduce((acc, e) => acc + e.ourScore, 0)}</span>
                    <div className="h-px w-4 bg-slate-200"></div>
                    <span className="text-3xl font-black text-[#0d1c2e]">{game.ends.reduce((acc, e) => acc + e.opponentScore, 0)}</span>
                  </div>
                  <div className="flex flex-col items-center w-20">
                    <div className="w-3 h-3 rounded-full mb-1 shadow-sm" style={{ backgroundColor: TEAM_COLORS[game.opponentTeam.color] }}></div>
                    <span className="text-xs font-bold text-[#0d1c2e] truncate w-full text-center">{game.opponentTeam.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );

  const renderNewGame = () => (
    <div className="min-h-screen bg-white">
      <Header 
        leftIcon={
          <button onClick={() => setScreen('dashboard')} className="text-primary active:scale-95 transition-transform">
            <ChevronLeft size={28} />
          </button>
        }
        centerContent={<h1 className="font-headline font-bold tracking-tight text-lg text-primary">Новая игра</h1>}
      />

      <main className="pt-24 pb-32 px-6 max-w-md mx-auto space-y-10">
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full transition-colors" style={{ backgroundColor: TEAM_COLORS[newGameData.ourColor] }}></div>
            <h2 className="font-headline font-bold text-xl tracking-tight text-[#0d1c2e]">{newGameData.ourName || 'Наша команда'}</h2>
          </div>
          <div className="bg-slate-50 p-6 rounded-xl space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Название команды</label>
              <input 
                type="text" 
                value={newGameData.ourName}
                onChange={e => setNewGameData({...newGameData, ourName: e.target.value})}
                className="w-full bg-white border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 text-[#0d1c2e] placeholder:text-slate-300"
                placeholder="Введите название..."
              />
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Цвет камней</label>
              <div className="flex gap-3">
                {(Object.keys(TEAM_COLORS) as TeamColor[]).map(color => (
                    <button 
                      key={color}
                      onClick={() => setNewGameData({...newGameData, ourColor: color})}
                      className={`w-10 h-10 rounded-full transition-all shadow-sm flex items-center justify-center ${newGameData.ourColor === color ? 'scale-110' : 'hover:scale-105'}`}
                      style={{ 
                        backgroundColor: TEAM_COLORS[color],
                        boxShadow: newGameData.ourColor === color ? `0 0 0 4px ${TEAM_COLORS[color]}66` : 'none'
                      }}
                    >
                      {newGameData.ourColor === color && <ArrowRight size={14} className="text-white rotate-90" />}
                    </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full transition-colors" style={{ backgroundColor: TEAM_COLORS[newGameData.oppColor] }}></div>
            <h2 className="font-headline font-bold text-xl tracking-tight text-[#0d1c2e]">Команда противника</h2>
          </div>
          <div className="bg-slate-50 p-6 rounded-xl space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Название команды</label>
              <input 
                type="text" 
                value={newGameData.oppName}
                onChange={e => setNewGameData({...newGameData, oppName: e.target.value})}
                className="w-full bg-white border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 text-[#0d1c2e] placeholder:text-slate-300"
                placeholder="Введите название..."
              />
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Цвет камней</label>
              <div className="flex gap-3">
                {(Object.keys(TEAM_COLORS) as TeamColor[]).map(color => (
                    <button 
                      key={color}
                      onClick={() => setNewGameData({...newGameData, oppColor: color})}
                      className={`w-10 h-10 rounded-full transition-all shadow-sm flex items-center justify-center ${newGameData.oppColor === color ? 'scale-110' : 'hover:scale-105'}`}
                      style={{ 
                        backgroundColor: TEAM_COLORS[color],
                        boxShadow: newGameData.oppColor === color ? `0 0 0 4px ${TEAM_COLORS[color]}66` : 'none'
                      }}
                    >
                      {newGameData.oppColor === color && <ArrowRight size={14} className="text-white rotate-90" />}
                    </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-headline font-bold text-lg text-[#0d1c2e] px-1">Хаммер в 1-м энде</h2>
          <div className="bg-slate-50 p-1.5 rounded-xl flex gap-1">
            <button 
              onClick={() => setNewGameData({...newGameData, hammer: 'ours'})}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${newGameData.hammer === 'ours' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              {newGameData.ourName || 'Наша команда'}
            </button>
            <button 
              onClick={() => setNewGameData({...newGameData, hammer: 'theirs'})}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${newGameData.hammer === 'theirs' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              {newGameData.oppName || 'Противник'}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 italic px-2 flex items-center gap-1">
            <Info size={12} />
            Команда с хаммером бросает последней
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-headline font-bold text-lg text-[#0d1c2e] px-1">Количество эндов</h2>
          <div className="grid grid-cols-2 gap-4">
            {[8, 10].map(num => (
              <button 
                key={num}
                onClick={() => setNewGameData({...newGameData, ends: num})}
                className={`py-4 rounded-xl font-bold text-lg transition-all ${newGameData.ends === num ? 'bg-primary/10 text-primary border-2 border-primary/20 shadow-inner' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              >
                {num}
              </button>
            ))}
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-white via-white to-transparent pt-12">
        <button 
          onClick={handleCreateGame}
          className="w-full py-5 rounded-xl bg-primary hover:bg-primary/90 text-white font-headline font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
        >
          Начать игру
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );

  const renderInGame = () => {
    if (!activeGame) return null;
    return (
      <div className="min-h-screen bg-[#f8f9ff] pb-32">
        <Header 
          leftIcon={
            <button onClick={() => setScreen('dashboard')} className="text-primary active:scale-95 transition-transform">
              <ChevronLeft size={28} />
            </button>
          }
          centerContent={
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: TEAM_COLORS[activeGame.ourTeam.color] }}></div>
                {activeGame.hammerInFirst === 'ours' && <span className="text-[10px] font-bold" style={{ color: TEAM_COLORS[activeGame.ourTeam.color] }}>Х</span>}
              </div>
              <h1 
                onClick={() => {
                  const ourScore = prompt(`Счет команды ${activeGame.ourTeam.name} в этом энде:`, activeGame.ends[activeGame.currentEnd-1].ourScore.toString());
                  const oppScore = prompt(`Счет команды ${activeGame.opponentTeam.name} в этом энде:`, activeGame.ends[activeGame.currentEnd-1].opponentScore.toString());
                  if (ourScore !== null && oppScore !== null) {
                    const updatedEnds = [...activeGame.ends];
                    updatedEnds[activeGame.currentEnd-1].ourScore = parseInt(ourScore) || 0;
                    updatedEnds[activeGame.currentEnd-1].opponentScore = parseInt(oppScore) || 0;
                    const updatedGame = { ...activeGame, ends: updatedEnds };
                    setActiveGame(updatedGame);
                    setGames(prev => prev.map(g => g.id === updatedGame.id ? updatedGame : g));
                  }
                }}
                className="font-headline font-extrabold tracking-widest text-xl cursor-pointer hover:scale-105 transition-transform text-primary"
              >
                {activeGame.ends.reduce((acc, e) => acc + e.ourScore, 0)} : {activeGame.ends.reduce((acc, e) => acc + e.opponentScore, 0)}
              </h1>
              <div className="flex items-center gap-1">
                {activeGame.hammerInFirst === 'theirs' && <span className="text-[10px] font-bold" style={{ color: TEAM_COLORS[activeGame.opponentTeam.color] }}>Х</span>}
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: TEAM_COLORS[activeGame.opponentTeam.color] }}></div>
              </div>
            </div>
          }
        />

        <main className="pt-24 px-6 max-w-2xl mx-auto space-y-8">
          <section className="text-center space-y-4">
            <div className="flex flex-col items-center">
              <h2 className="font-headline flex items-center gap-2">
                <span className="text-2xl font-extrabold text-[#0d1c2e]">
                  {getCurrentShotInfo().player === 'lead' ? 'Лид' : 
                   getCurrentShotInfo().player === 'second' ? 'Второй' : 
                   getCurrentShotInfo().player === 'third' ? 'Третий' : 'Скип'}
                </span>
                <span className="text-xl font-extrabold text-slate-300">•</span>
                <span 
                  className="text-2xl font-extrabold"
                  style={{ color: getCurrentShotInfo().team === 'ours' ? TEAM_COLORS[activeGame.ourTeam.color] : TEAM_COLORS[activeGame.opponentTeam.color] }}
                >
                  {getCurrentShotInfo().team === 'ours' ? activeGame.ourTeam.name : activeGame.opponentTeam.name}
                </span>
              </h2>
              <div className="flex items-center gap-3 mt-6">
                <div className="inline-flex items-center px-5 py-2.5 rounded-2xl bg-blue-50">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary opacity-70">Энд</span>
                    <span className="text-2xl font-black font-headline leading-none mt-1 text-primary">
                      {activeGame.currentEnd}<span className="text-xs opacity-40 ml-0.5">/{activeGame.totalEnds}</span>
                    </span>
                  </div>
                </div>
                <div className="inline-flex items-center px-5 py-2.5 bg-slate-100 rounded-2xl">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Камень</span>
                    <span className="text-2xl font-black font-headline text-slate-600 leading-none mt-1">
                      {getCurrentShotInfo().stone}<span className="text-xs opacity-40 ml-0.5">/8</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400">Тип броска</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setCurrentShot({...currentShot, type: 'draw', isHogged: false})}
                  className={`flex flex-col items-center justify-center p-6 rounded-xl transition-all active:scale-[0.98] ${currentShot.type === 'draw' && !currentShot.isHogged ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
                >
                  <Crosshair size={32} className="mb-2" />
                  <span className="font-bold tracking-wide">Draw</span>
                </button>
                <button 
                  onClick={() => setCurrentShot({...currentShot, type: 'takeout', isHogged: false})}
                  className={`flex flex-col items-center justify-center p-6 rounded-xl transition-all active:scale-[0.98] ${currentShot.type === 'takeout' && !currentShot.isHogged ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
                >
                  <XCircle size={32} className="mb-2" />
                  <span className="font-bold tracking-wide">Takeout</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400">Вращение</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setCurrentShot({...currentShot, rotation: 'inturn'})}
                  className={`flex flex-col items-center justify-center p-6 rounded-xl transition-all active:scale-[0.98] ${currentShot.rotation === 'inturn' ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
                >
                  <RotateCw size={32} className="mb-2" />
                  <span className="font-bold tracking-wide">In</span>
                </button>
                <button 
                  onClick={() => setCurrentShot({...currentShot, rotation: 'outturn'})}
                  className={`flex flex-col items-center justify-center p-6 rounded-xl transition-all active:scale-[0.98] ${currentShot.rotation === 'outturn' ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
                >
                  <RotateCcw size={32} className="mb-2" />
                  <span className="font-bold tracking-wide">Out</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400">Оценка выполнения</h3>
              <div className="flex justify-between items-center gap-2">
                {[0, 25, 50, 75, 100].map(val => (
                  <button 
                    key={val}
                    onClick={() => setCurrentShot({...currentShot, score: val, isHogged: false})}
                    className={`flex-1 aspect-square flex items-center justify-center rounded-xl text-white font-bold text-sm transition-all ${currentShot.score === val && !currentShot.isHogged ? 'scale-110 ring-4 ring-white shadow-xl opacity-100' : 'opacity-40 hover:opacity-100'}`}
                    style={{ backgroundColor: val === 0 ? '#ba1a1a' : val === 25 ? '#f97316' : val === 50 ? '#fbcd17' : val === 75 ? '#84cc16' : '#16a34a' }}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 space-y-14">
              <button 
                onClick={() => setCurrentShot({...currentShot, isHogged: !currentShot.isHogged})}
                className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all active:scale-[0.99] ${currentShot.isHogged ? 'bg-red-50 border-red-200 text-red-500' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
              >
                <Ban size={20} />
                <span className="font-headline font-bold uppercase tracking-widest text-sm">Проброс</span>
              </button>
              <button 
                onClick={() => {
                  if (activeGame) {
                    const updatedGames = games.map(g => g.id === activeGame.id ? {...g, status: 'completed' as const} : g);
                    setGames(updatedGames);
                    setSelectedGameId(activeGame.id);
                    setActiveGame(null);
                    setScreen('stats');
                  }
                }}
                className="w-full flex items-center justify-center p-4 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 font-headline font-bold uppercase tracking-widest text-[10px] transition-colors"
              >
                Завершить досрочно
              </button>
            </div>
          </div>
        </main>

        <footer className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-4 bg-white/80 backdrop-blur-md border-t border-slate-100">
          <button 
            onClick={() => {
              // Logic to undo last shot
              if (!activeGame) return;
              const updatedEnds = [...activeGame.ends];
              let currentEndIndex = activeGame.currentEnd - 1;
              
              if (updatedEnds[currentEndIndex].shots.length > 0) {
                updatedEnds[currentEndIndex].shots.pop();
              } else if (activeGame.currentEnd > 1) {
                // Go back to previous end if current end is empty
                currentEndIndex -= 1;
                updatedEnds.pop();
                activeGame.currentEnd -= 1;
                updatedEnds[currentEndIndex].shots.pop();
              } else {
                return;
              }

              const updatedGame = { ...activeGame, ends: updatedEnds };
              setActiveGame(updatedGame);
              setGames(prev => prev.map(g => g.id === updatedGame.id ? updatedGame : g));
            }}
            className="flex items-center justify-center text-primary transition-colors"
          >
            <ChevronLeft size={32} />
          </button>
          <button 
            onClick={handleNextShot}
            className="flex items-center justify-center text-primary transition-colors"
          >
            <ChevronRight size={32} />
          </button>
        </footer>
      </div>
    );
  };

  const renderStats = () => {
    const game = games.find(g => g.id === selectedGameId) || games[0];
    if (!game) return null;

    const ourTotal = game.ends.reduce((acc, e) => acc + e.ourScore, 0);
    const oppTotal = game.ends.reduce((acc, e) => acc + e.opponentScore, 0);

    // Calculate player percentages
    const calculatePlayerStats = (playerPos: Shot['playerPos']) => {
      const ourShots = game.ends.flatMap(e => e.shots).filter(s => s.playerPos === playerPos);
      
      const getStatsByType = (type: 'draw' | 'takeout') => {
        const typeShots = ourShots.filter(s => s.type === type);
        const inShots = typeShots.filter(s => s.rotation === 'inturn');
        const outShots = typeShots.filter(s => s.rotation === 'outturn');
        
        const inAvg = inShots.length > 0 ? inShots.reduce((acc, s) => acc + s.score, 0) / inShots.length : 0;
        const outAvg = outShots.length > 0 ? outShots.reduce((acc, s) => acc + s.score, 0) / outShots.length : 0;
        const totalAvg = typeShots.length > 0 ? typeShots.reduce((acc, s) => acc + s.score, 0) / typeShots.length : 0;
        
        const totalCount = typeShots.length;
        const inDist = totalCount > 0 ? Math.round((inShots.length / totalCount) * 100) : 0;
        const outDist = totalCount > 0 ? 100 - inDist : 0; // Ensure they sum to 100
        
        return {
          in: Math.round(inAvg),
          out: Math.round(outAvg),
          inDist,
          outDist,
          avg: Math.round(totalAvg),
          inCount: inShots.length,
          outCount: outShots.length
        };
      };

      if (ourShots.length === 0) return { 
        pct: 0, 
        count: 0, 
        draw: { in: 0, out: 0, inDist: 0, outDist: 0, avg: 0, inCount: 0, outCount: 0 },
        takeout: { in: 0, out: 0, inDist: 0, outDist: 0, avg: 0, inCount: 0, outCount: 0 }
      };
      
      const totalScore = ourShots.reduce((acc, s) => acc + s.score, 0);
      
      return {
        pct: Math.round(totalScore / ourShots.length),
        count: ourShots.length,
        draw: getStatsByType('draw'),
        takeout: getStatsByType('takeout')
      };
    };

    const leadStats = calculatePlayerStats('lead');
    const secondStats = calculatePlayerStats('second');
    const thirdStats = calculatePlayerStats('third');
    const skipStats = calculatePlayerStats('skip');

    return (
      <div className="min-h-screen bg-[#f8f9ff] pb-24">
        <Header 
          leftIcon={
            <button onClick={() => setScreen('dashboard')} className="text-primary active:scale-95 transition-transform">
              <ChevronLeft size={28} />
            </button>
          }
          centerContent={<h1 className="font-headline font-bold tracking-tight text-lg text-[#0d1c2e]">{statsTab === 'overall' ? 'Статистика матча' : 'Моя команда'}</h1>}
          rightIcon={<Search className="text-primary cursor-pointer" size={24} />}
        />

        <div className="fixed top-[60px] w-full z-40 bg-white border-b border-slate-100 px-6 py-2">
          <nav className="flex items-center gap-8 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setStatsTab('overall')}
              className={`pb-1 font-semibold text-sm whitespace-nowrap transition-all ${statsTab === 'overall' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-primary'}`}
            >
              Общая таблица
            </button>
            <button 
              onClick={() => setStatsTab('positions')}
              className={`pb-1 font-semibold text-sm whitespace-nowrap transition-all ${statsTab === 'positions' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-primary'}`}
            >
              Моя команда
            </button>
          </nav>
        </div>

        <main className="max-w-7xl mx-auto px-4 pt-28 pb-8 space-y-8">
          {statsTab === 'overall' ? (
            <>
              <section className="bg-white rounded-3xl p-6 relative overflow-hidden shadow-sm border border-slate-100">
                <div className="flex flex-col items-center space-y-6 relative z-10">
                  <div className="flex w-full items-center justify-between gap-2">
                    <div className="flex flex-1 flex-col items-center text-center">
                      <div className="flex items-center gap-1.5 mb-1">
                        <h2 className="font-headline text-lg font-extrabold text-[#0d1c2e] truncate max-w-[120px]">{game.ourTeam.name}</h2>
                        <Star style={{ color: TEAM_COLORS[game.ourTeam.color], fill: TEAM_COLORS[game.ourTeam.color] }} size={16} />
                      </div>
                      <span className="font-headline text-5xl font-extrabold text-primary">{ourTotal}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-headline text-xs text-slate-300 font-bold uppercase tracking-widest px-2">vs</span>
                    </div>
                    <div className="flex flex-1 flex-col items-center text-center">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Shield style={{ color: TEAM_COLORS[game.opponentTeam.color], fill: TEAM_COLORS[game.opponentTeam.color] }} size={16} />
                        <h2 className="font-headline text-lg font-extrabold text-[#0d1c2e] truncate max-w-[120px]">{game.opponentTeam.name}</h2>
                      </div>
                      <span className="font-headline text-5xl font-extrabold text-primary">{oppTotal}</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-headline text-lg font-bold text-[#0d1c2e] flex items-center gap-2 px-2">
                  <BarChart2 className="text-primary" size={20} />
                  Счет по эндам
                </h3>
                <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100">
                  <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-3 py-3 text-center"><Users size={16} className="text-primary mx-auto" /></th>
                        {Array.from({ length: game.totalEnds }).map((_, i) => (
                          <th key={i} className="px-1 py-3 text-center font-headline text-xs font-bold text-slate-400">{i + 1}</th>
                        ))}
                        <th className="px-3 py-3 text-right font-headline text-xs font-extrabold text-primary">
                          <Sigma size={20} strokeWidth={3} className="ml-auto" />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      <tr>
                        <td className="px-3 py-4 text-center"><Star size={20} style={{ color: TEAM_COLORS[game.ourTeam.color], fill: TEAM_COLORS[game.ourTeam.color] }} className="mx-auto" /></td>
                        {Array.from({ length: game.totalEnds }).map((_, i) => {
                          const end = game.ends.find(e => e.number === i + 1);
                          const s = end ? end.ourScore : 0;
                          return <td key={i} className={`px-1 py-4 text-center text-sm ${s > 0 ? 'text-primary font-bold' : 'text-slate-400'}`}>{s}</td>;
                        })}
                        <td className="px-3 py-4 text-right font-headline text-xl font-black text-primary" style={{ backgroundColor: `${TEAM_COLORS[game.ourTeam.color]}15` }}>{ourTotal}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-4 text-center"><Shield size={20} style={{ color: TEAM_COLORS[game.opponentTeam.color], fill: TEAM_COLORS[game.opponentTeam.color] }} className="mx-auto" /></td>
                        {Array.from({ length: game.totalEnds }).map((_, i) => {
                          const end = game.ends.find(e => e.number === i + 1);
                          const s = end ? end.opponentScore : 0;
                          return <td key={i} className={`px-1 py-4 text-center text-sm ${s > 0 ? 'text-primary font-bold' : 'text-slate-400'}`}>{s}</td>;
                        })}
                        <td className="px-3 py-4 text-right font-headline text-xl font-black text-primary" style={{ backgroundColor: `${TEAM_COLORS[game.opponentTeam.color]}15` }}>{oppTotal}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="font-headline text-lg font-bold text-[#0d1c2e] flex items-center gap-2 px-2">
                  <Users className="text-primary" size={20} />
                  Сравнение игроков
                </h3>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed min-w-[360px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-2 py-4 text-[11px] font-bold uppercase tracking-tight text-slate-500 w-[16%]">Поз</th>
                          <th className="px-1 py-4 text-[11px] font-bold uppercase tracking-tight text-center w-[14%] text-primary">
                            <div className="flex items-center justify-center space-x-1">
                              <Star size={16} style={{ color: TEAM_COLORS[game.ourTeam.color], fill: TEAM_COLORS[game.ourTeam.color] }} />
                              <span>%</span>
                            </div>
                          </th>
                          <th className="px-1 py-4 text-[11px] font-bold uppercase tracking-tight text-center w-[14%] text-primary">D</th>
                          <th className="px-1 py-4 text-[11px] font-bold uppercase tracking-tight text-center w-[14%] text-primary">T</th>
                          <th className="px-1 py-4 text-[11px] font-bold uppercase tracking-tight text-center w-[14%] text-primary bg-primary/5">
                            <div className="flex items-center justify-center space-x-1">
                              <Shield size={16} style={{ color: TEAM_COLORS[game.opponentTeam.color], fill: TEAM_COLORS[game.opponentTeam.color] }} />
                              <span>%</span>
                            </div>
                          </th>
                          <th className="px-1 py-4 text-[11px] font-bold uppercase tracking-tight text-center w-[14%] text-primary bg-primary/5">D</th>
                          <th className="px-1 py-4 text-[11px] font-bold uppercase tracking-tight text-center w-[14%] text-primary bg-primary/5">T</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {[
                          { pos: 'ЛИД', stats: leadStats, opp: '72%', oppD: '78%', oppT: '66%' },
                          { pos: '2-Й', stats: secondStats, opp: '65%', oppD: '68%', oppT: '62%' },
                          { pos: '3-Й', stats: thirdStats, opp: '70%', oppD: '72%', oppT: '68%' },
                          { pos: 'СКИП', stats: skipStats, opp: '78%', oppD: '80%', oppT: '76%' },
                        ].map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-2 py-4 font-semibold text-xs border-r border-slate-50 text-slate-600">{row.pos}</td>
                            <td className="px-1 py-4 text-center font-headline font-bold text-sm text-slate-900">{row.stats.pct}%</td>
                            <td className="px-1 py-4 text-center text-xs text-slate-600">{row.stats.draw.avg}%</td>
                            <td className="px-1 py-4 text-center text-xs text-slate-600">{row.stats.takeout.avg}%</td>
                            <td className="px-1 py-4 text-center font-headline font-bold text-sm text-slate-900" style={{ backgroundColor: `${TEAM_COLORS[game.opponentTeam.color]}10` }}>{row.opp}</td>
                            <td className="px-1 py-4 text-center text-xs text-slate-600" style={{ backgroundColor: `${TEAM_COLORS[game.opponentTeam.color]}10` }}>{row.oppD}</td>
                            <td className="px-1 py-4 text-center text-xs text-slate-600" style={{ backgroundColor: `${TEAM_COLORS[game.opponentTeam.color]}10` }}>{row.oppT}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-primary/10 border-t border-primary/20 font-bold">
                          <td className="px-2 py-4 text-center border-r border-primary/10">
                            <Sigma size={20} strokeWidth={3} className="mx-auto text-primary" />
                          </td>
                          <td className="px-1 py-4 text-center text-sm text-slate-900">
                            {Math.round((leadStats.pct + secondStats.pct + thirdStats.pct + skipStats.pct) / 4)}%
                          </td>
                          <td className="px-1 py-4 text-[10px] text-slate-500 italic text-center" colSpan={2}>
                            Бросков: {leadStats.count + secondStats.count + thirdStats.count + skipStats.count}
                          </td>
                          <td className="px-1 py-4 text-center text-sm text-slate-900">71%</td>
                          <td className="px-1 py-4 text-[10px] text-slate-500 italic text-center" colSpan={2}>Бросков: 61</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div className="space-y-6">
              {[
                { pos: 'Лид', stats: leadStats },
                { pos: 'Второй', stats: secondStats },
                { pos: 'Третий', stats: thirdStats },
                { pos: 'Скип', stats: skipStats },
              ].map((player, idx) => (
                <div key={idx} className="relative bg-white rounded-xl p-6 shadow-sm border border-slate-100 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="font-headline text-2xl font-bold text-[#0d1c2e]">{player.pos}</h3>
                    <div className="text-right">
                      <p className="text-4xl font-extrabold font-headline text-primary">{player.stats.pct}<span className="text-lg opacity-60">%</span></p>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{player.stats.count} ВСЕГО БРОСКОВ</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8 relative">
                    <div className="absolute left-1/2 top-4 bottom-0 w-[1px] bg-slate-100 -translate-x-1/2"></div>
                    
                    {/* Draw Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Crosshair className="text-primary" size={14} />
                          <span className="font-bold text-[10px] uppercase tracking-widest text-[#0d1c2e]">Draw</span>
                        </div>
                        <span className="text-xs font-black text-primary">{player.stats.draw.avg}%</span>
                      </div>
                      <div className="space-y-3">
                        <SplitProgressBar 
                          inValue={player.stats.draw.inDist} 
                          outValue={player.stats.draw.outDist} 
                          inColor={TEAM_COLORS['blue']} 
                          outColor={`${TEAM_COLORS['blue']}4d`} 
                        />
                        <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                          <span>Бросков: {player.stats.draw.inCount}</span>
                          <span>Бросков: {player.stats.draw.outCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Takeout Section */}
                    <div className="space-y-4 pl-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <XCircle className="text-primary" size={14} />
                          <span className="font-bold text-[10px] uppercase tracking-widest text-[#0d1c2e]">Takeout</span>
                        </div>
                        <span className="text-xs font-black text-primary">{player.stats.takeout.avg}%</span>
                      </div>
                      <div className="space-y-3">
                        <SplitProgressBar 
                          inValue={player.stats.takeout.inDist} 
                          outValue={player.stats.takeout.outDist} 
                          inColor={TEAM_COLORS['blue']} 
                          outColor={`${TEAM_COLORS['blue']}4d`} 
                        />
                        <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                          <span>Бросков: {player.stats.takeout.inCount}</span>
                          <span>Бросков: {player.stats.takeout.outCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-[#f8f9ff] min-h-screen relative shadow-2xl overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {screen === 'dashboard' && renderDashboard()}
          {screen === 'new-game' && renderNewGame()}
          {screen === 'in-game' && renderInGame()}
          {screen === 'stats' && renderStats()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SplitProgressBar({ inValue, outValue, inColor, outColor, dark }: { inValue: number, outValue: number, inColor: string, outColor: string, dark?: boolean }) {
  return (
    <div>
      <div className="flex justify-between items-center text-[10px] mb-1.5 font-bold">
        <div className="flex items-center gap-1">
          <RotateCw size={10} className={dark ? 'text-white/60' : 'text-slate-400'} />
          <span className={dark ? 'text-white/80' : 'text-slate-500'}>In: {inValue}%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={dark ? 'text-white/80' : 'text-slate-500'}>Out: {outValue}%</span>
          <RotateCcw size={10} className={dark ? 'text-white/60' : 'text-slate-400'} />
        </div>
      </div>
      <div className={`w-full ${dark ? 'bg-white/10' : 'bg-slate-100'} h-2 rounded-full overflow-hidden flex`}>
        <div className="h-full transition-all duration-500" style={{ width: `${inValue}%`, backgroundColor: inColor }}></div>
        <div className="h-full transition-all duration-500" style={{ width: `${outValue}%`, backgroundColor: outColor }}></div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, color, dark, icon, labelRight }: { label: string, value: number, color: string, dark?: boolean, icon?: React.ReactNode, labelRight?: boolean }) {
  return (
    <div>
      <div className={`flex ${labelRight ? 'flex-row-reverse' : 'flex-row'} justify-between items-center text-[10px] mb-1.5`}>
        <div className={`flex ${labelRight ? 'flex-row-reverse' : 'flex-row'} items-center gap-1`}>
          {icon}
          <span className={`${dark ? 'text-sky-200/80' : 'text-slate-500'} font-medium`}>{label}</span>
        </div>
        <span className={`font-bold ${dark ? 'text-white' : 'text-[#0d1c2e]'}`}>{value}%</span>
      </div>
      <div className={`w-full ${dark ? 'bg-white/10' : 'bg-slate-100'} h-1.5 rounded-full overflow-hidden`}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color }}></div>
      </div>
    </div>
  );
}

