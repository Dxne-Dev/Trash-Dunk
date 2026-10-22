export interface TrainingLevel {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  targetSeconds: number;
  targetBaskets?: number;
  targetSwishes?: number;
  targetStreak?: number;
  targetCold?: boolean;
}

export const TRAINING_LEVELS: TrainingLevel[] = [
  {
    id: 1,
    title: "Niveau 1 : Les Fondations",
    subtitle: "Rookie",
    description: "Marquez 5 paniers avant la fin du chronomètre.",
    targetSeconds: 60,
    targetBaskets: 5,
  },
  {
    id: 2,
    title: "Niveau 2 : Tireur d'Élite",
    subtitle: "Sniper",
    description: "Réussissez 3 Swishs parfaits (écart ≤ 2%).",
    targetSeconds: 40,
    targetSwishes: 3,
  },
  {
    id: 3,
    title: "Niveau 3 : Combo Master",
    subtitle: "En Feu",
    description: "Atteignez une série (Streak) de 4 tirs d'affilée sans rater.",
    targetSeconds: 35,
    targetStreak: 4,
  },
  {
    id: 4,
    title: "Niveau 4 : Sous Zéro",
    subtitle: "Cold Ice",
    description: "Déclenchez le mode Cold Ice ❄️ (2 swishs consécutifs).",
    targetSeconds: 30,
    targetCold: true,
  },
  {
    id: 5,
    title: "Niveau 5 : Le Boss Final",
    subtitle: "MVP All-Star",
    description: "Marquez 8 paniers dont au moins 4 swishs parfaits !",
    targetSeconds: 45,
    targetBaskets: 8,
    targetSwishes: 4,
  },
];
