/**
 * Dynamic Marking System for Wattaqa Festival 2K25
 * Calculates points based on programme section, position type, and grades
 */

export interface MarkingRules {
  section: 'senior' | 'junior' | 'sub-junior' | 'general';
  positionType: 'individual' | 'group' | 'general';
}

export interface PositionPoints {
  first: number;
  second: number;
  third: number;
}

export interface GradePoints {
  A: number;
  B: number;
  C: number;
}

/**
 * Grade points mapping (universal across all programmes)
 */
export const GRADE_POINTS: GradePoints = {
  A: 5,
  B: 3,
  C: 1
};

/**
 * Calculate position points based on programme section, position type, and category
 */
export function getPositionPoints(section: string, positionType: string, category?: string): PositionPoints {
  // Normalize inputs
  const normalizedSection = section.toLowerCase();
  const normalizedPositionType = positionType.toLowerCase();
  const normalizedCategory = category?.toLowerCase();

  // Sports programmes have different marking system
  if (normalizedCategory === 'sports') {
    // Sports marking system: Individual 3,2,1 | Groups (all sections) 5,3,1 | General 15,10,5
    if (normalizedSection === 'general') {
      return { first: 15, second: 10, third: 5 };
    } else if (normalizedPositionType === 'individual') {
      return { first: 3, second: 2, third: 1 };
    } else if (normalizedPositionType === 'group') {
      return { first: 5, second: 3, third: 1 };
    }
  }

  // Arts programmes (original marking system)
  // General section programmes
  if (normalizedSection === 'general') {
    if (normalizedPositionType === 'individual') {
      return { first: 10, second: 6, third: 3 };
    } else if (normalizedPositionType === 'group' || normalizedPositionType === 'general') {
      return { first: 15, second: 10, third: 5 };
    }
  }
  
  // Senior, Junior, Sub-Junior sections
  if (['senior', 'junior', 'sub-junior'].includes(normalizedSection)) {
    if (normalizedPositionType === 'individual') {
      return { first: 3, second: 2, third: 1 };
    } else if (normalizedPositionType === 'group' || normalizedPositionType === 'general') {
      return { first: 5, second: 3, third: 1 };
    }
  }

  // Fallback for unknown combinations
  console.warn(`Unknown section/positionType combination: ${section}/${positionType}`);
  return { first: 1, second: 1, third: 1 };
}

/**
 * Get grade points for a specific grade
 */
export function getGradePoints(grade: string): number {
  const normalizedGrade = grade.toUpperCase().charAt(0); // Take first character and uppercase
  return GRADE_POINTS[normalizedGrade as keyof GradePoints] || 0;
}

/**
 * Calculate total points for a winner (position + grade)
 */
export function calculateTotalPoints(
  section: string,
  positionType: string,
  position: 'first' | 'second' | 'third',
  grade?: string,
  category?: string
): number {
  const positionPoints = getPositionPoints(section, positionType, category);
  const gradePoints = grade ? getGradePoints(grade) : 0;
  
  let basePoints = 0;
  switch (position) {
    case 'first':
      basePoints = positionPoints.first;
      break;
    case 'second':
      basePoints = positionPoints.second;
      break;
    case 'third':
      basePoints = positionPoints.third;
      break;
  }
  
  return basePoints + gradePoints;
}

/**
 * Get marking rules summary for display
 */
export function getMarkingRulesSummary(category?: string): string {
  if (category?.toLowerCase() === 'sports') {
    return `
📊 SPORTS MARKING SYSTEM RULES:

Position Points (No Grades for Sports):
• Individual (all sections): 1st=3, 2nd=2, 3rd=1
• Groups (all sections): 1st=5, 2nd=3, 3rd=1
• General: 1st=15, 2nd=10, 3rd=5

Note: Sports programmes do not use performance grades.
Total Points = Position Points only
    `.trim();
  }

  return `
📊 ARTS MARKING SYSTEM RULES:

Position Points:
• Senior/Junior/Sub-Junior Individual: 1st=3, 2nd=2, 3rd=1
• Senior/Junior/Sub-Junior Group: 1st=5, 2nd=3, 3rd=1
• General Individual: 1st=10, 2nd=6, 3rd=3
• General Group: 1st=15, 2nd=10, 3rd=5

Grade Points (Added to Position Points):
• A Grade: +5 points
• B Grade: +3 points  
• C Grade: +1 point

Total Points = Position Points + Grade Points
  `.trim();
}

/**
 * Validate if a programme has valid marking configuration
 */
export function validateProgrammeMarking(programme: { section: string; positionType: string }): boolean {
  const validSections = ['senior', 'junior', 'sub-junior', 'general'];
  const validPositionTypes = ['individual', 'group', 'general'];
  
  return validSections.includes(programme.section.toLowerCase()) && 
         validPositionTypes.includes(programme.positionType.toLowerCase());
}

/**
 * Get all possible point combinations for a programme
 */
export function getProgrammePointCombinations(section: string, positionType: string, category?: string) {
  const positionPoints = getPositionPoints(section, positionType, category);
  const grades = Object.keys(GRADE_POINTS);
  
  const combinations: Array<{
    position: string;
    grade: string;
    positionPoints: number;
    gradePoints: number;
    totalPoints: number;
  }> = [];
  
  ['first', 'second', 'third'].forEach(position => {
    const basePoints = positionPoints[position as keyof PositionPoints];
    
    // Without grade (always include this)
    combinations.push({
      position,
      grade: 'None',
      positionPoints: basePoints,
      gradePoints: 0,
      totalPoints: basePoints
    });
    
    // With each grade (only for arts programmes)
    if (category?.toLowerCase() !== 'sports') {
      grades.forEach(grade => {
        const gradePoints = GRADE_POINTS[grade as keyof GradePoints];
        combinations.push({
          position,
          grade,
          positionPoints: basePoints,
          gradePoints,
          totalPoints: basePoints + gradePoints
        });
      });
    }
  });
  
  return combinations;
}