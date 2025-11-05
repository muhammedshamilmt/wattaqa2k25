# Unified Result Entry System Implementation

## Overview
This enhancement implements a unified and consistent result entry system that provides appropriate interfaces for different program types while ensuring marks are calculated correctly at the right level (individual vs team).

## Key Changes

### 1. Individual Programs
- **Regular Individual (senior/junior/sub-junior)**: 
  - Shows individual participants interface
  - Marks go to individual candidates
  - Same interface as before

- **General Individual**: 
  - Shows same individual participants interface
  - Marks automatically go to teams (via chest number mapping)
  - Special blue note explains this behavior
  - Title shows "General Individual Programme"

### 2. Group Programs (All Sections)
- **All sections (senior/junior/sub-junior)**:
  - Shows team instances interface
  - Exactly 2 instances per team: "Entry 1" and "Entry 2"
  - Marks go to teams and calculated at section level
  - No individual participant interface
  - Removed the previous 3-instance system

### 3. General Programs
- **Team-based interface only**:
  - Single team entries (no instances)
  - Marks go directly to teams
  - Clear "General Programme" labeling

## Technical Implementation

### Logic Changes (`handleSectionSelection`)
```typescript
if (selectedProgramme.positionType === 'group') {
  // Always create two instances for GROUP programs in all sections
  return [
    { ...baseTeamEntry, instanceId: 1, instanceLabel: `${team?.name || pp.teamCode} - Entry 1` },
    { ...baseTeamEntry, instanceId: 2, instanceLabel: `${team?.name || pp.teamCode} - Entry 2` }
  ];
} else if (selectedProgramme.positionType === 'general') {
  // Single team entries for GENERAL programs
  return { ...baseTeamEntry, instanceId: 1, instanceLabel: team?.name || pp.teamCode };
} else {
  // Individual participants for INDIVIDUAL programs
  // No team instances, just individual participants
}
```

### UI Display Conditions
- **Team Display**: `positionType === 'group' || positionType === 'general'`
- **Individual Display**: `positionType === 'individual'`
- **Removed**: Separate team instances section for individual programs

### Special Features
1. **General Individual Note**: Blue informational box explaining that marks go to teams
2. **Dynamic Titles**: Differentiate between "Individual" and "General Individual" programmes
3. **Consistent Styling**: Team entries use gray theme, individual participants use default theme

## Scoring Logic

### Backend Processing
The existing grand-marks API already handles the scoring correctly:
- Individual programs: Uses `getTeamCodeFromChestNumber()` to map individual results to teams
- Team programs: Direct team code mapping
- No changes needed to backend scoring logic

### Mark Distribution
1. **Individual Programs**:
   - Regular: Marks → Individual candidates
   - General: Marks → Teams (automatic via chest number)

2. **Group Programs**:
   - All sections: Marks → Teams at section level
   - Two instances allow multiple team entries

3. **General Programs**:
   - Direct: Marks → Teams

## User Experience Improvements

### Clear Program Type Indication
- Titles clearly show program type and section
- Color-coded sections (blue for general individual notes)
- Consistent terminology across the interface

### Simplified Interface
- Removed confusing team instances for individual programs
- Unified team interface for group and general programs
- Clear explanatory notes where behavior differs

### Maintained Functionality
- All existing features preserved
- Backward compatibility maintained
- No breaking changes to data structure

## Testing

### Automated Tests
- Program type handling logic ✅
- UI display conditions ✅
- Team instances for group programs ✅
- General individual program handling ✅
- Data flow and logic ✅

### Manual Testing Scenarios
1. **Individual Program (senior)**: Should show participants, marks to individuals
2. **Individual Program (general)**: Should show participants with note, marks to teams
3. **Group Program (junior)**: Should show 2 team instances, marks to teams
4. **General Program**: Should show single team entries, marks to teams

## Benefits

### For Users
- Clear, consistent interface across program types
- No confusion about where marks go
- Appropriate number of team instances
- Better visual feedback and explanations

### For System
- Simplified logic flow
- Reduced complexity in individual program handling
- Consistent team instance management
- Maintained data integrity

## Migration Notes

### Existing Data
- No migration needed for existing results
- All existing functionality preserved
- Backward compatibility maintained

### New Results
- Group programs now get exactly 2 instances instead of 3
- General individual programs work seamlessly with team scoring
- Individual programs maintain same behavior

## Files Modified

1. **`src/app/admin/results/page.tsx`**:
   - Updated `handleSectionSelection` logic
   - Modified UI display conditions
   - Added general individual program note
   - Removed team instances section for individual programs
   - Updated titles and labels

2. **`scripts/test-unified-result-entry-system.js`**:
   - Comprehensive test suite for new functionality
   - Validates all program type behaviors
   - Checks UI display conditions

## Summary

This implementation provides a clean, unified result entry system that:
- Maintains familiar interfaces where appropriate
- Provides team instances where needed (group programs)
- Handles scoring correctly for all program types
- Offers clear visual feedback and explanations
- Reduces complexity while maintaining full functionality

The system now properly handles the distinction between individual and team scoring while providing appropriate interfaces for each program type.