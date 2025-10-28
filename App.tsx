
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { UserState, CheckinData, LogEntry, AppView, Reminder, XpAnimationData, UserGoals, Action, Kpi, DailyTask } from './types';
import { getLevels, DEFAULT_POSITIVE_ACTIONS, DEFAULT_NEGATIVE_ACTIONS, DEFAULT_KPIS, XP_PER_RANK, WEEKLY_XP_REWARD_THRESHOLD, ALL_ACHIEVEMENTS, SKILL_TREE, SOCIAL_MEDIA_PENALTY_DESC } from './constants';
import { generatePersonalizedPlan, analyzeSentiment, generateProgressReport, generateProactiveMessage } from './services/geminiService';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ActionsPanel from './components/ActionsPanel';
import KpiTracker from './components/KpiTracker';
import AiCoach from './components/AiCoach';
import NavMenu from './components/NavMenu';
import CheckinCheckout from './components/CheckinCheckout';
import Onboarding from './components/Login';
import Logbook from './components/Logbook';
import Reminders from './components/Reminders';
import Toast from './components/Toast';
import ParticleBurst from './components/ParticleBurst';
import ProgressAnalysis from './components/ProgressAnalysis';
import AiGoals from './components/AiGoals';
import Calendar from './components/Calendar';
import Achievements from './components/Achievements';
import FocusMode from './components/FocusMode';
import Settings from './components/Settings';
import BottomNav from './components/BottomNav';
import SkillTree from './components/SkillTree';
import ProgressReport from './components/ProgressReport';
import TutorialGuide from './components/TutorialGuide';

const App: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const [userState, setUserState] = useState<UserState | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [currentCheckinData, setCurrentCheckinData] = useState<CheckinData | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('DASHBOARD');
  const [toast, setToast] = useState<string | null>(null);
  const [xpAnimations, setXpAnimations] = useState<XpAnimationData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [xpTargetPosition, setXpTargetPosition] = useState<{x: number, y: number} | null>(null);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [hasPlayedRewardAnimation, setHasPlayedRewardAnimation] = useState(false);
  const [proactiveMessage, setProactiveMessage] = useState<string | null>(null);
  
  const showToast = (message: string) => {
      setToast(message);
  };

  const applyTheme = (theme: 'light' | 'dark') => {
      if (theme === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  };

  const handleChangeTheme = (theme: 'light' | 'dark') => {
      setUserState(prev => prev ? { ...prev, theme } : null);
      applyTheme(theme);
  };
  
  const checkAndUnlockAchievements = useCallback((state: UserState): UserState => {
      let newState = { ...state };
      const unlocked = new Set(newState.unlockedAchievements);
      let newAchievementUnlocked = false;

      const unlock = (achievementId: string) => {
          if (!unlocked.has(achievementId)) {
              unlocked.add(achievementId);
              const achievement = ALL_ACHIEVEMENTS.find(a => a.id === achievementId);
              if (achievement) {
                showToast(`🏆 Logro Desbloqueado: ${achievement.name}`);
              }
              newAchievementUnlocked = true;
          }
      };
      
      // Check achievements
      if (logEntries.length > 0) unlock('first_step');
      if (newState.totalXp >= 100) unlock('centurion');
      if (newState.totalXp >= 1000) unlock('xp_hoarder_1k');
      if (newState.currentStreak >= 3) unlock('streak_3');
      if (newState.currentStreak >= 7) unlock('streak_7');
      if (newState.kpis.length > 0 && newState.kpis.every(k => k.completed)) unlock('discipline_master');
      if (newState.earlyBirdCheckins >= 5) unlock('early_bird');
      if (reminders.length > 0) unlock('planner');


      if (newAchievementUnlocked) {
          newState.unlockedAchievements = Array.from(unlocked);
      }

      return newState;
  }, [logEntries.length, reminders.length]);

  // Load data from localStorage on initial mount
  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    const storedState = localStorage.getItem('userState');
    const storedLog = localStorage.getItem('logEntries');
    const storedReminders = localStorage.getItem('reminders');
    const storedTasks = localStorage.getItem('dailyTasks');
    const storedCheckin = localStorage.getItem('currentCheckinData');

    if (storedName) {
      setUserName(storedName);
      if (storedState) {
        const parsedState = JSON.parse(storedState) as UserState;
        setUserState(parsedState);
        applyTheme(parsedState.theme || 'dark');
        if (parsedState.weeklyXp >= WEEKLY_XP_REWARD_THRESHOLD) {
            setHasPlayedRewardAnimation(true);
        }
      }
      if (storedLog) setLogEntries(JSON.parse(storedLog));
      if (storedReminders) setReminders(JSON.parse(storedReminders));
      if (storedTasks) setDailyTasks(JSON.parse(storedTasks));
      if (storedCheckin) setCurrentCheckinData(JSON.parse(storedCheckin));
    }
    setIsLoading(false);
  }, []);

  // Persist state to localStorage
  useEffect(() => {
    if (userState) localStorage.setItem('userState', JSON.stringify(userState));
  }, [userState]);

  useEffect(() => {
    if (logEntries.length > 0) localStorage.setItem('logEntries', JSON.stringify(logEntries));
  }, [logEntries]);

  useEffect(() => {
    localStorage.setItem('reminders', JSON.stringify(reminders));
  }, [reminders]);
  
  useEffect(() => {
    localStorage.setItem('dailyTasks', JSON.stringify(dailyTasks));
  }, [dailyTasks]);
  
  useEffect(() => {
      if (currentCheckinData) localStorage.setItem('currentCheckinData', JSON.stringify(currentCheckinData));
      else localStorage.removeItem('currentCheckinData');
  }, [currentCheckinData]);

  // Reminder notification logic
  useEffect(() => {
    const checkReminders = () => {
        const now = new Date();
        const currentTime = now.toTimeString().substring(0, 5); // HH:MM
        const currentDayIndex = (now.getDay() + 6) % 7; // 0=Monday, 6=Sunday
        const dayKeys: (keyof Reminder['days'])[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        reminders.forEach(reminder => {
            if (reminder.time === currentTime && reminder.days[dayKeys[currentDayIndex]]) {
                if (Notification.permission === 'granted') {
                    new Notification('Proyecto YO - Recordatorio', {
                        body: reminder.title,
                        icon: '/vite.svg',
                    });
                }
            }
        });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [reminders]);
  
  // Reward animation logic
  useEffect(() => {
    if (userState) {
        if (userState.weeklyXp >= WEEKLY_XP_REWARD_THRESHOLD && !hasPlayedRewardAnimation) {
            setShowRewardAnimation(true);
            setHasPlayedRewardAnimation(true);
        }
    }
  }, [userState?.weeklyXp, hasPlayedRewardAnimation]);

  // Proactive Coaching Logic
    useEffect(() => {
        if (!userState || !userState.penaltyHistory || proactiveMessage) return;

        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const recentSocialMediaPenalties = userState.penaltyHistory
            .filter(p => p.description === SOCIAL_MEDIA_PENALTY_DESC && new Date(p.date) > fiveDaysAgo);
        
        const uniqueDays = new Set(recentSocialMediaPenalties.map(p => new Date(p.date).toISOString().split('T')[0]));

        if (uniqueDays.size >= 3) {
            (async () => {
                try {
                    const message = await generateProactiveMessage('repeated_social_media_penalty', userState.userGoals);
                    setProactiveMessage(message);
                } catch (error) {
                    console.error("Failed to generate proactive message:", error);
                }
            })();
        }

    }, [userState, proactiveMessage]);

  const handleRewardAnimationComplete = useCallback(() => {
    setShowRewardAnimation(false);
  }, []);

  const handleOnboardingComplete = useCallback(async (name: string, goals: UserGoals) => {
    setIsLoading(true);
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
    
    try {
        const plan = await generatePersonalizedPlan(goals);
        const newUserState: UserState = {
            userName: capitalizedName,
            userGoals: goals,
            levelIndex: 0,
            totalXp: 0,
            weeklyXp: 0,
            dailyXp: 0,
            hasCheckedIn: false,
            positiveActions: plan.positiveActions,
            negativeActions: plan.negativeActions,
            kpis: plan.kpis.map(kpi => ({...kpi, completed: false})),
            unlockedAchievements: [],
            earlyBirdCheckins: 0,
            currentStreak: 0,
            lastCheckinDate: null,
            theme: 'dark', // Default theme
            customWeeklyReward: '',
            penaltyHistory: [],
            skillPoints: 0,
            unlockedSkills: [],
            tutorialCompleted: false, // Start the tutorial
        };
        setUserState(newUserState);
        setUserName(capitalizedName);
        localStorage.setItem('userName', capitalizedName);
        localStorage.setItem('userState', JSON.stringify(newUserState));
    } catch (error) {
        console.error("Failed to generate personalized plan, using defaults.", error);
        const newUserState: UserState = {
            userName: capitalizedName,
            userGoals: goals,
            levelIndex: 0,
            totalXp: 0,
            weeklyXp: 0,
            dailyXp: 0,
            hasCheckedIn: false,
            positiveActions: DEFAULT_POSITIVE_ACTIONS,
            negativeActions: DEFAULT_NEGATIVE_ACTIONS,
            kpis: DEFAULT_KPIS,
            unlockedAchievements: [],
            earlyBirdCheckins: 0,
            currentStreak: 0,
            lastCheckinDate: null,
            theme: 'dark', // Default theme
            customWeeklyReward: '',
            penaltyHistory: [],
            skillPoints: 0,
            unlockedSkills: [],
            tutorialCompleted: false, // Start the tutorial
        };
        setUserState(newUserState);
        setUserName(capitalizedName);
        localStorage.setItem('userName', capitalizedName);
        localStorage.setItem('userState', JSON.stringify(newUserState));
        showToast("Error de IA, usando plan estándar.");
    } finally {
        setLogEntries([]);
        setReminders([]);
        setDailyTasks([]);
        localStorage.removeItem('logEntries');
        localStorage.removeItem('reminders');
        localStorage.removeItem('dailyTasks');
        setCurrentView('DASHBOARD');
        setIsLoading(false);
    }
  }, []);
  
  const handleTutorialComplete = () => {
    setUserState(prev => prev ? { ...prev, tutorialCompleted: true } : null);
  };

  const handleLogout = useCallback(() => {
    localStorage.clear();
    setUserName(null);
    setUserState(null);
    setLogEntries([]);
    setReminders([]);
    setDailyTasks([]);
  }, []);

  const handleXpChange = useCallback((xp: number, penaltyAction?: Action) => {
    setUserState(prevState => {
      if (!prevState) return null;

      let finalXp = xp;

      // Apply skill resistances if it's a penalty
      if (xp < 0 && penaltyAction) {
          prevState.unlockedSkills.forEach(skillId => {
              const skill = SKILL_TREE.categories.flatMap(c => c.skills).find(s => s.id === skillId);
              if (skill && skill.effect.type === 'resistance' && skill.effect.target === penaltyAction.description) {
                  finalXp *= (1 - skill.effect.value);
              }
          });
          finalXp = Math.round(finalXp);
      }
      
      const prevTotalXp = prevState.totalXp;
      const newTotalXp = Math.max(0, prevState.totalXp + finalXp);
      const newWeeklyXp = prevState.weeklyXp + finalXp;
      const newDailyXp = prevState.dailyXp + finalXp;
      
      // Calculate earned skill points
      const prevSkillPointsEarned = Math.floor(prevTotalXp / XP_PER_RANK);
      const newSkillPointsEarned = Math.floor(newTotalXp / XP_PER_RANK);
      const newSkillPoints = prevState.skillPoints + (newSkillPointsEarned - prevSkillPointsEarned);
      
      const userLevels = getLevels(prevState.userName);
      let newLevelIndex = prevState.levelIndex;
      while (newLevelIndex < userLevels.length - 1 && newTotalXp >= userLevels[newLevelIndex].xpThreshold) {
        newLevelIndex++;
      }
      while (newLevelIndex > 0 && newTotalXp < userLevels[newLevelIndex - 1].xpThreshold) {
        newLevelIndex--;
      }
      
      const intermediateState = { ...prevState, totalXp: newTotalXp, weeklyXp: newWeeklyXp, dailyXp: newDailyXp, levelIndex: newLevelIndex, skillPoints: newSkillPoints };
      return checkAndUnlockAchievements(intermediateState);
    });
  }, [checkAndUnlockAchievements]);
  
  const handleTriggerXpAnimation = useCallback((xp: number, event: React.MouseEvent) => {
    if (!xpTargetPosition) return;
    const newAnimation: XpAnimationData = {
        id: Date.now().toString() + Math.random(),
        xp,
        startX: event.clientX,
        startY: event.clientY,
        endX: xpTargetPosition.x,
        endY: xpTargetPosition.y,
    };
    setXpAnimations(prev => [...prev, newAnimation]);
  }, [xpTargetPosition]);

  const handleAnimationEnd = useCallback((id: string) => {
    setXpAnimations(prev => prev.filter(anim => anim.id !== id));
  }, []);

  const handleKpiToggle = useCallback((indicator: string) => {
    setUserState(prevState => {
      if (!prevState) return null;
      const intermediateState = {
        ...prevState,
        kpis: prevState.kpis.map(kpi => kpi.indicator === indicator ? { ...kpi, completed: !kpi.completed } : kpi),
      };
      return checkAndUnlockAchievements(intermediateState);
    });
  }, [checkAndUnlockAchievements]);

  const handleResetWeek = useCallback(() => {
    setUserState(prevState => {
      if (!prevState) return null;
      return { ...prevState, weeklyXp: 0, dailyXp: 0, hasCheckedIn: false, kpis: prevState.kpis.map(k => ({...k, completed: false})) };
    });
    setHasPlayedRewardAnimation(false);
    setDailyTasks([]);
  }, []);

  const handleFullReset = useCallback(() => {
    if (window.confirm('¿Estás seguro de que quieres reiniciar todo tu progreso? Esta acción no se puede deshacer.')) {
        if (userState) {
            const goals = userState.userGoals;
            const name = userState.userName;
            handleOnboardingComplete(name, goals);
        }
    }
  }, [userState, handleOnboardingComplete]);

  const handleCheckin = useCallback((data: CheckinData) => {
    if (!userState) return;
    setCurrentCheckinData(data);
    const initialTasks = userState.positiveActions.map(action => ({ ...action, completed: false }));
    setDailyTasks(initialTasks);
    setUserState(prevState => {
        if(!prevState) return null;
        let newEarlyBirdCheckins = prevState.earlyBirdCheckins;
        if (data.checkinTime < '07:00') {
            newEarlyBirdCheckins++;
        }
        const intermediateState = { ...prevState, hasCheckedIn: true, earlyBirdCheckins: newEarlyBirdCheckins };
        return checkAndUnlockAchievements(intermediateState);
    });
  }, [userState, checkAndUnlockAchievements]);

  const handleCheckout = useCallback(async (reflection: string) => {
    const today = new Date();
    const todayKey = today.toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split('T')[0];

    const sentiment = await analyzeSentiment(reflection);

    setUserState(prevState => {
        if (!prevState) return null;

        let newStreak = prevState.currentStreak;
        if (prevState.lastCheckinDate === yesterdayKey) {
            newStreak++;
        } else if (prevState.lastCheckinDate !== todayKey) {
            newStreak = 1;
        }

        if (currentCheckinData) {
            const newLogEntry: LogEntry = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                dailyXp: prevState.dailyXp,
                checkin: currentCheckinData,
                reflection: reflection,
                sentiment: sentiment,
            };
            setLogEntries(prevEntries => [newLogEntry, ...prevEntries]);
        }
        
        const intermediateState = { ...prevState, dailyXp: 0, hasCheckedIn: false, currentStreak: newStreak, lastCheckinDate: todayKey };
        return checkAndUnlockAchievements(intermediateState);
    });
    
    setCurrentCheckinData(null);
    setDailyTasks([]);
  }, [currentCheckinData, checkAndUnlockAchievements]);

  const handleAddReminder = useCallback((reminder: Omit<Reminder, 'id'>) => {
    const newReminder: Reminder = { ...reminder, id: Date.now().toString() };
    setReminders(prev => {
        const newState = [...prev, newReminder];
        if (userState) {
            setUserState(checkAndUnlockAchievements(userState));
        }
        return newState;
    });
    showToast('Recordatorio añadido con éxito');
  }, [userState, checkAndUnlockAchievements]);

  const handleDeleteReminder = useCallback((id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    showToast('Recordatorio eliminado');
  }, []);

  const handleUpdateActions = (positive: Action[], negative: Action[]) => {
      setUserState(prev => prev ? {...prev, positiveActions: positive, negativeActions: negative} : null);
      showToast("Acciones actualizadas");
  };

  const handleUpdateKpis = (kpis: Kpi[]) => {
      setUserState(prev => prev ? {...prev, kpis: kpis} : null);
      showToast("KPIs actualizados");
  };
  
  const handleTaskToggle = useCallback((taskDescription: string, event: React.MouseEvent) => {
      let taskAction: DailyTask | undefined;
      const newTasks = dailyTasks.map(task => {
          if (task.description === taskDescription) {
              taskAction = task;
              return { ...task, completed: !task.completed };
          }
          return task;
      });
      if (taskAction) {
        const xpChange = taskAction.completed ? -taskAction.xp : taskAction.xp;
        setDailyTasks(newTasks);
        handleXpChange(xpChange);
        if (xpChange > 0) {
            handleTriggerXpAnimation(xpChange, event);
        }
      }
  }, [dailyTasks, handleXpChange, handleTriggerXpAnimation]);

  const handlePenalty = useCallback((action: Action, event: React.MouseEvent) => {
      handleXpChange(action.xp, action);
      handleTriggerXpAnimation(action.xp, event);
      setUserState(prev => {
          if (!prev) return null;
          const newHistory = [...prev.penaltyHistory, { description: action.description, date: new Date().toISOString() }];
          // Keep history from growing indefinitely
          if (newHistory.length > 20) newHistory.shift();
          return { ...prev, penaltyHistory: newHistory };
      });
  }, [handleXpChange, handleTriggerXpAnimation]);

  const handleFocusSessionComplete = useCallback(() => {
    if (!userState) return;
    const focusAction = userState.positiveActions.find(action => action.description.toLowerCase().includes('foco'));
    if (focusAction) {
        handleXpChange(focusAction.xp);
        showToast(`+${focusAction.xp} XP por completar una sesión de foco!`);
    }
  }, [userState, handleXpChange]);
  
  const handleSetCustomReward = (reward: string) => {
      setUserState(prev => prev ? {...prev, customWeeklyReward: reward} : null);
      showToast("Recompensa actualizada");
  };

  const handleUpdateUserName = (newName: string) => {
    if (!newName.trim()) return;
    const capitalizedName = newName.charAt(0).toUpperCase() + newName.slice(1);
    setUserState(prev => prev ? {...prev, userName: capitalizedName} : null);
    setUserName(capitalizedName);
    localStorage.setItem('userName', capitalizedName);
    showToast("Nombre de Héroe actualizado");
  };

  const handleUnlockSkill = (skillId: string) => {
      setUserState(prev => {
          if (!prev) return null;
          const skill = SKILL_TREE.categories.flatMap(c => c.skills).find(s => s.id === skillId);
          if (!skill || prev.skillPoints < skill.cost || prev.unlockedSkills.includes(skillId)) {
              return prev;
          }
          if (skill.requires && !prev.unlockedSkills.includes(skill.requires)) {
              return prev;
          }
          showToast(`Habilidad desbloqueada: ${skill.name}`);
          return {
              ...prev,
              skillPoints: prev.skillPoints - skill.cost,
              unlockedSkills: [...prev.unlockedSkills, skillId],
          };
      });
  };

  const userLevels = useMemo(() => userName ? getLevels(userName) : [], [userName]);

  const progressAnalysisData = useMemo(() => {
    if (!userState || !userState.kpis || userState.kpis.length === 0) {
        return { kpiData: [], sentimentData: [] };
    }
    const kpiData = userState.kpis.reduce((acc, kpi) => {
        if (!acc[kpi.area]) {
            acc[kpi.area] = { total: 0, completed: 0 };
        }
        acc[kpi.area].total += 1;
        if (kpi.completed) {
            acc[kpi.area].completed += 1;
        }
        return acc;
    }, {} as Record<string, { total: number, completed: number }>);
    
    const sentimentData = logEntries.slice(0, 30).reverse().map(entry => {
        const date = new Date(entry.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        let value = 0;
        if (entry.sentiment === 'POSITIVE') value = 1;
        if (entry.sentiment === 'NEGATIVE') value = -1;
        return { date, value };
    });

    return {
        kpiData: Object.entries(kpiData).map(([area, data]) => ({
            area,
            completion: data.total > 0 ? (data.completed / data.total) * 100 : 0,
        })),
        sentimentData
    };
  }, [userState, logEntries]);

  if (isLoading) {
    return <div className="min-h-screen bg-brand-bg flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary"></div></div>
  }

  if (!userName || !userState) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }
  
  const currentLevel = userLevels[userState.levelIndex] || userLevels[userLevels.length - 1];
  const rankProgress = (userState.totalXp % XP_PER_RANK) / XP_PER_RANK * 100;
  const weeklyProgress = Math.min((userState.weeklyXp / WEEKLY_XP_REWARD_THRESHOLD) * 100, 100);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return (
          <div className="flex flex-col gap-6">
            <Dashboard 
              level={currentLevel}
              totalXp={userState.totalXp}
              weeklyXp={userState.weeklyXp}
              rankProgress={rankProgress}
              weeklyProgress={weeklyProgress}
              customWeeklyReward={userState.customWeeklyReward}
              onSetCustomReward={handleSetCustomReward}
              onXpTargetReady={setXpTargetPosition}
              showRewardAnimation={showRewardAnimation}
              onRewardAnimationComplete={handleRewardAnimationComplete}
              miniMission={userState.hasCheckedIn ? currentCheckinData?.miniMission : undefined}
              proactiveMessage={proactiveMessage}
              onDismissProactiveMessage={() => setProactiveMessage(null)}
              onNavigate={setCurrentView}
            />
            <CheckinCheckout 
              userGoals={userState.userGoals}
              hasCheckedIn={userState.hasCheckedIn}
              dailyXp={userState.dailyXp}
              dailyTasks={dailyTasks}
              negativeActions={userState.negativeActions}
              onCheckin={handleCheckin}
              onCheckout={handleCheckout}
              onTaskToggle={handleTaskToggle}
              onPenalty={handlePenalty}
              onNavigate={setCurrentView}
            />
          </div>
        );
      case 'ACTIONS':
        return <ActionsPanel 
                positiveActions={userState.positiveActions}
                negativeActions={userState.negativeActions}
                onXpChange={handleXpChange}
                onTriggerAnimation={handleTriggerXpAnimation}
                onUpdateActions={handleUpdateActions}
               />;
      case 'KPIS':
        return <KpiTracker 
                kpis={userState.kpis} 
                onToggle={handleKpiToggle} 
                onUpdateKpis={handleUpdateKpis}
               />;
      case 'LOGBOOK':
        return <Logbook entries={logEntries} />;
       case 'CALENDAR':
        return <Calendar entries={logEntries} />;
       case 'REMINDERS':
        return <Reminders 
                 reminders={reminders}
                 onAdd={handleAddReminder}
                 onDelete={handleDeleteReminder}
               />;
      case 'ACHIEVEMENTS':
        return <Achievements unlockedAchievementIds={userState.unlockedAchievements} />;
      case 'AI_GOALS':
        return <AiGoals userGoals={userState.userGoals} plan={{positiveActions: userState.positiveActions, negativeActions: userState.negativeActions, kpis: userState.kpis}} onNavigate={setCurrentView} />;
      case 'PROGRESS_ANALYSIS':
        return <ProgressAnalysis kpiData={progressAnalysisData.kpiData} sentimentData={progressAnalysisData.sentimentData} />;
      case 'PROGRESS_REPORT':
        return <ProgressReport userState={userState} logEntries={logEntries} />;
      case 'FOCUS_MODE':
        return <FocusMode onFocusSessionComplete={handleFocusSessionComplete} />;
      case 'SKILL_TREE':
        return <SkillTree userState={userState} onUnlockSkill={handleUnlockSkill} />;
      case 'SETTINGS':
        return <Settings currentTheme={userState.theme || 'dark'} onThemeChange={handleChangeTheme} currentName={userState.userName} onNameChange={handleUpdateUserName} />;
      case 'COACH':
        return <AiCoach />;
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 bg-brand-bg-light dark:bg-brand-bg text-brand-text-primary-light dark:text-brand-text-primary`}>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24">
        <div className="flex justify-between items-start">
            <Header />
            <NavMenu 
              userName={userState.userName}
              userLevel={currentLevel.name}
              currentView={currentView}
              onNavigate={setCurrentView}
              onWeekReset={handleResetWeek}
              onFullReset={handleFullReset}
              onLogout={handleLogout}
            />
        </div>
        <main className="mt-6">
          {renderCurrentView()}
        </main>
      </div>
      <BottomNav currentView={currentView} onNavigate={setCurrentView} />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {xpAnimations.map(anim => (
        <ParticleBurst
            key={anim.id}
            {...anim}
            onEnd={() => handleAnimationEnd(anim.id)}
        />
      ))}
      {userState.tutorialCompleted === false && <TutorialGuide onComplete={handleTutorialComplete} />}
    </div>
  );
};

export default App;