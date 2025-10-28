
export interface Action {
  description: string;
  xp: number;
}

export interface DailyTask extends Action {
  completed: boolean;
}

export interface Kpi {
  area: string;
  indicator: string;
  completed: boolean;
}

export interface Level {
  level: number;
  name: string;
  title: string;
  focus: string;
  xpThreshold: number;
}

export interface UserGoals {
  objective: string;
  motivation: string;
  expectation: string;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
}

export interface UserState {
  userName: string;
  userGoals: UserGoals;
  levelIndex: number;
  totalXp: number;
  weeklyXp: number;
  dailyXp: number;
  hasCheckedIn: boolean;
  positiveActions: Action[];
  negativeActions: Action[];
  kpis: Kpi[];
  unlockedAchievements: string[];
  earlyBirdCheckins: number;
  currentStreak: number;
  lastCheckinDate: string | null;
  penaltyHistory: { description: string; date: string }[];
  customWeeklyReward: string;
  theme: 'light' | 'dark';
  skillPoints: number;
  unlockedSkills: string[];
  tutorialCompleted: boolean;
}

export interface CheckinData {
  priorities: string;
  status: string;
  dailyGoal: string;
  miniMission: string;
  checkinTime: string; // "HH:MM"
}

export interface LogEntry {
  id: string;
  date: string;
  dailyXp: number;
  checkin: CheckinData;
  reflection: string;
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
}

export interface Reminder {
  id: string;
  title: string;
  time: string; // "HH:MM"
  days: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
}

export interface XpAnimationData {
    id: string;
    xp: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export type AppView = 'DASHBOARD' | 'ACTIONS' | 'KPIS' | 'LOGBOOK' | 'REMINDERS' | 'COACH' | 'AI_GOALS' | 'PROGRESS_ANALYSIS' | 'CALENDAR' | 'ACHIEVEMENTS' | 'FOCUS_MODE' | 'SETTINGS' | 'SKILL_TREE' | 'PROGRESS_REPORT';

export interface SkillEffect {
  type: 'resistance';
  target: string;
  value: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  cost: number;
  requires: string | null;
  effect: SkillEffect;
}