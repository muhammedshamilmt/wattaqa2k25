'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface TeamGrandMark {
  teamCode: string;
  name: string;
  points: number;
  results: number;
  color?: string;
}

interface GrandMarksContextType {
  grandMarks: TeamGrandMark[];
  setGrandMarks: (marks: TeamGrandMark[]) => void;
  isCalculationActive: boolean;
  setIsCalculationActive: (active: boolean) => void;
}

const GrandMarksContext = createContext<GrandMarksContextType | undefined>(undefined);

export function GrandMarksProvider({ children }: { children: ReactNode }) {
  const [grandMarks, setGrandMarks] = useState<TeamGrandMark[]>([]);
  const [isCalculationActive, setIsCalculationActive] = useState(false);

  return (
    <GrandMarksContext.Provider value={{
      grandMarks,
      setGrandMarks,
      isCalculationActive,
      setIsCalculationActive
    }}>
      {children}
    </GrandMarksContext.Provider>
  );
}

export function useGrandMarks() {
  const context = useContext(GrandMarksContext);
  if (context === undefined) {
    throw new Error('useGrandMarks must be used within a GrandMarksProvider');
  }
  return context;
}