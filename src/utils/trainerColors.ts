// Utility functions for generating consistent trainer colors

const TRAINER_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-purple-100 text-purple-800 border-purple-200', 
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-lime-100 text-lime-800 border-lime-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
];

// Simple hash function to convert string to number
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function getTrainerColor(trainerId: string): string {
  const hash = simpleHash(trainerId);
  const colorIndex = hash % TRAINER_COLORS.length;
  return TRAINER_COLORS[colorIndex];
}

export function getAllTrainerColors(): string[] {
  return TRAINER_COLORS;
}