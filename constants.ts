
import React from 'react';
import { Level, Action, Kpi, Achievement } from './types';

export const XP_PER_RANK = 100;
export const WEEKLY_XP_REWARD_THRESHOLD = 80;
export const SOCIAL_MEDIA_PENALTY_DESC = 'Uso excesivo de redes';


export const getLevels = (name: string): Level[] => [
  { level: 1, name: `${name} 1.0`, title: "El Despertar", focus: "Reconstrucción de disciplina y hábitos", xpThreshold: 500 },
  { level: 2, name: `${name} 2.0`, title: "El Arquitecto", focus: "Diseño de sistema y consistencia", xpThreshold: 1500 },
  { level: 3, name: `${name} 3.0`, title: "El Estratega", focus: "Consolidación, marca y finanzas", xpThreshold: 3000 },
  { level: 4, name: `${name} Élite`, title: "El Dominante", focus: "Propósito, libertad, plenitud", xpThreshold: Infinity },
];

export const DEFAULT_POSITIVE_ACTIONS: Action[] = [
  { description: 'Rutina completa', xp: 10 },
  { description: 'Entrenamiento', xp: 5 },
  { description: 'Dormir antes de 00:00', xp: 5 },
  { description: 'Publicar contenido', xp: 10 },
  { description: 'Estudiar 30 min', xp: 5 },
  { description: 'Acción consciente (pareja/familia)', xp: 5 },
  { description: 'Meditar o reflexionar', xp: 3 },
  { description: 'Romper mal hábito', xp: 10 },
  { description: 'Día sin procrastinar', xp: 10 },
  { description: 'Sesión de Foco de 25 min', xp: 10 },
];

export const DEFAULT_NEGATIVE_ACTIONS: Action[] = [
  { description: 'No cumplir meta diaria', xp: -10 },
  { description: 'Dormir después de 01:00', xp: -5 },
  { description: 'Gasto impulsivo', xp: -10 },
  { description: SOCIAL_MEDIA_PENALTY_DESC, xp: -15 },
];

export const DEFAULT_KPIS: Kpi[] = [
  { area: 'Salud', indicator: 'Ejercicio 3x semana', completed: false },
  { area: 'Sueño', indicator: 'Dormir antes de 00:00 (5/7)', completed: false },
  { area: 'Finanzas', indicator: 'Ahorro semanal ₲100.000', completed: false },
  { area: 'Productividad', indicator: '4h foco real (4/5 días)', completed: false },
  { area: 'Contenido', indicator: '2 publicaciones / semana', completed: false },
  { area: 'Relaciones', indicator: '1 acción consciente semanal', completed: false },
];

export const ALL_ACHIEVEMENTS: Omit<Achievement, 'icon'>[] = [
    { id: 'first_step', name: 'Primer Paso', description: 'Completa tu primer día en Proyecto YO.' },
    { id: 'centurion', name: 'Centurión', description: 'Alcanza los 100 XP totales.' },
    { id: 'streak_3', name: 'En Racha', description: 'Mantén una racha de 3 días de check-out.' },
    { id: 'streak_7', name: 'Imparable', description: 'Mantén una racha de 7 días de check-out.' },
    { id: 'discipline_master', name: 'Maestro de la Disciplina', description: 'Completa todos tus KPIs en una semana.' },
    { id: 'early_bird', name: 'Madrugador', description: 'Realiza el check-in antes de las 7:00 a.m. 5 veces.' },
    { id: 'xp_hoarder_1k', name: 'Acumulador de XP', description: 'Alcanza los 1,000 XP totales.' },
    { id: 'planner', name: 'Planificador', description: 'Crea tu primer recordatorio personalizado.' },
];

export const SKILL_TREE = {
    categories: [
        {
            name: "Disciplina",
            skills: [
                { id: 'steel_mind_1', name: "Mente de Acero I", description: `Reduce la penalización de XP por "${SOCIAL_MEDIA_PENALTY_DESC}" en un 10%.`, cost: 1, requires: null, effect: { type: 'resistance', target: SOCIAL_MEDIA_PENALTY_DESC, value: 0.1 } },
                { id: 'steel_mind_2', name: "Mente de Acero II", description: `Reduce la penalización de XP por "No cumplir meta diaria" en un 15%.`, cost: 2, requires: 'steel_mind_1', effect: { type: 'resistance', target: 'No cumplir meta diaria', value: 0.15 } },
            ]
        }
    ]
};