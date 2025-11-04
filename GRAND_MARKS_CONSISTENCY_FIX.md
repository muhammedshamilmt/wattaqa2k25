# Grand Marks Consistency Fix

## Problem
The admin teams page and team admin portal were showing different grand marks for teams:
- **Admin teams page**: Showing static `team.points` field from database
- **Team admin portal**: Calculating points from published results only

This inconsistency caused confusion as the values didn't match.

## Solution
Updated the admin teams page to calculate grand marks the same way as the team admin portal:

### Changes Made

#### 1. Admin Teams Page (`src/app/admin/teams/page.tsx`)
- Added imports for `Result`, `Candidate` types and `getGradePoints` utility
- Added state for `allResults` and `allCandidates`
- Updated `fetchTeams()` to also fetch published results and candidates
- Added `calculateTeamPoints()` function that:
  - Filters for published results only
  - Calculates points from both team and individual wins
  - Uses the same logic as team admin portal
- Updated display to show calculated points instead of static `team.points`
- Changed label from "Points" to "Grand Marks" for clarity
- Added info section explaining grand marks are from published results only

#### 2. Team Admin Portal (`src/app/team-admin/results/page.tsx`)
- Already correctly calculating from published results only
- No changes needed

### Key Features
- **Consistency**: Both pages now show identical grand marks
- **Published Results Only**: Only published results contribute to grand marks
- **Real-time Calculation**: Points are calculated dynamically, not stored statically
- **Same Logic**: Both pages use identical calculation methods

### Calculation Logic
```javascript
const calculateTeamPoints = (team) => {
  // 1. Get team candidates
  const teamCandidates = allCandidates.filter(c => c.teamCode === team.code);
  
  // 2. Filter for published results that include team members
  const teamResults = allResults.filter(result => {
    if (result.status !== 'published') return false;
    // Check team results + individual results
  });
  
  // 3. Calculate total points
  const totalPoints = teamResults.reduce((sum, result) => {
    // Team points + Individual points + Grade bonuses
  }, 0);
  
  return totalPoints;
};
```

### Benefits
1. **Accurate Reporting**: Grand marks reflect only finalized (published) results
2. **Consistency**: Same values shown in both admin and team portals
3. **Transparency**: Clear indication that only published results count
4. **Real-time**: Updates automatically when results are published

### Testing
Run the test script to verify consistency:
```bash
node scripts/test-grand-marks-consistency.js
```

This will show:
- Current grand marks for each team
- Comparison between static and calculated points
- Verification that both pages use the same calculation

## Impact
- ✅ Admin teams page now shows correct grand marks
- ✅ Team admin portal continues to show correct grand marks
- ✅ Both pages display identical values
- ✅ Only published results contribute to grand marks
- ✅ Clear labeling and documentation for users