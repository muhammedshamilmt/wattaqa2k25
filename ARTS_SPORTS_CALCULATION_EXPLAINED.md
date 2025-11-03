# Arts & Sports Calculation - Complete Explanation

## Overview
This document explains exactly how the Arts and Sports programme counts are calculated for each candidate in the candidates page.

## Step-by-Step Process

### Step 1: Find Team Registrations
```javascript
const candidateParticipations = participantsData.filter(teamRegistration =>
  teamRegistration.participants &&
  teamRegistration.participants.includes(candidate.chestNumber)
);
```

**What happens:**
- Look through all team registrations in `programme_participants` collection
- Find registrations where the candidate's chest number appears in the `participants` array
- Each team registration represents one programme that the candidate is participating in

**Example:**
- Candidate: Musthafa (chest number: "201")
- Found 22 team registrations containing "201" in participants array
- Each registration links to a specific programme

### Step 2: Initialize Counters
```javascript
const registeredProgrammes = {
  arts: {
    individual: 0,
    group: 0,
    general: 0,
    total: 0
  },
  sports: {
    individual: 0,
    group: 0,
    general: 0,
    total: 0
  },
  total: candidateParticipations.length
};
```

**What happens:**
- Start with all counters at zero
- Set overall total to the number of team registrations found

### Step 3: Process Each Registration
```javascript
candidateParticipations.forEach(teamRegistration => {
  const programme = programmesData.find(p =>
    p._id?.toString() === teamRegistration.programmeId?.toString()
  );

  if (programme) {
    const category = programme.category?.toLowerCase();
    const positionType = programme.positionType?.toLowerCase();

    if (category === 'arts') {
      registeredProgrammes.arts.total++;
      if (positionType === 'individual') {
        registeredProgrammes.arts.individual++;
      } else if (positionType === 'group') {
        registeredProgrammes.arts.group++;
      } else if (positionType === 'general') {
        registeredProgrammes.arts.general++;
      }
    } else if (category === 'sports') {
      registeredProgrammes.sports.total++;
      if (positionType === 'individual') {
        registeredProgrammes.sports.individual++;
      } else if (positionType === 'group') {
        registeredProgrammes.sports.group++;
      } else if (positionType === 'general') {
        registeredProgrammes.sports.general++;
      }
    }
  }
});
```

**What happens for each registration:**
1. **Find Programme Details**: Use `programmeId` to look up programme in `programmes` collection
2. **Check Category**: Look at `programme.category` field
   - If "arts" → increment arts counters
   - If "sports" → increment sports counters
3. **Check Position Type**: Look at `programme.positionType` field
   - If "individual" → increment individual counter
   - If "group" → increment group counter
   - If "general" → increment general counter
4. **Update Totals**: Increment both category total and overall total

## Real Example: Musthafa (201)

### Input Data
- **Candidate**: Musthafa, chest number "201"
- **Team Registrations Found**: 22 registrations containing "201"

### Processing Results
| Registration | Programme Name | Category | Position Type | Action |
|-------------|----------------|----------|---------------|---------|
| 1 | Extemporary speech Urdu | arts | individual | Arts Individual +1 |
| 2 | Handwriting Malayalam | arts | individual | Arts Individual +1 |
| 3 | Speech Urdu | arts | individual | Arts Individual +1 |
| ... | (7 more arts individual) | arts | individual | Arts Individual +7 |
| 11 | High Jump | sports | individual | Sports Individual +1 |
| 12 | Long Jump | sports | individual | Sports Individual +1 |
| ... | (2 more sports individual) | sports | individual | Sports Individual +2 |
| 15 | Water Balloon Throw | sports | group | Sports Group +1 |
| 16 | Head Basket Race | sports | group | Sports Group +1 |
| ... | (5 more sports group) | sports | group | Sports Group +5 |
| 22 | Podcast | arts | group | Arts Group +1 |

### Final Results
```
🎨 Arts: 11 total
   Individual: 10
   Group: 1
   General: 0

🏃 Sports: 11 total
   Individual: 4
   Group: 7
   General: 0

📋 Total: 22 registrations
```

## Database Structure

### programme_participants Collection
```json
{
  "_id": "...",
  "teamCode": "SMD",
  "programmeId": "69033cd456cf5c29cc165164",
  "participants": ["201", "202", "203"],
  "status": "registered"
}
```

### programmes Collection
```json
{
  "_id": "69033cd456cf5c29cc165164",
  "name": "Extemporary speech Urdu",
  "category": "arts",
  "positionType": "individual",
  "section": "senior"
}
```

## Key Points

### Team-Based System
- **Not Individual Registrations**: The system uses team-based registrations
- **Participants Array**: Each registration contains an array of chest numbers
- **Candidate Matching**: Candidates are found by checking if their chest number exists in the participants array

### Categorization Fields
- **programme.category**: Determines Arts vs Sports
  - "arts" → Arts programmes (essays, speeches, drawing, etc.)
  - "sports" → Sports programmes (running, jumping, cricket, etc.)
- **programme.positionType**: Determines Individual/Group/General
  - "individual" → Single participant competitions
  - "group" → Team-based competitions
  - "general" → Open competitions

### Counting Logic
- **Each Registration = One Programme**: Every team registration counts as one programme participation
- **Dual Classification**: Each programme is counted in both category (arts/sports) and position type (individual/group/general)
- **Hierarchical Totals**: Category totals are sum of their individual + group + general counts

## Programme Distribution

### Arts Programmes (223 total)
- **Individual**: 197 programmes (88%) - Essays, speeches, drawing, etc.
- **Group**: 25 programmes (11%) - Group discussions, team presentations
- **General**: 1 programme (1%) - Open competitions

### Sports Programmes (95 total)
- **Individual**: 79 programmes (83%) - Running, jumping, individual sports
- **Group**: 16 programmes (17%) - Team sports like cricket, football
- **General**: 0 programmes (0%) - No general sports programmes

## Validation

### Data Integrity Checks
1. **Programme Lookup**: Every `programmeId` must exist in programmes collection
2. **Category Validation**: Only "arts" and "sports" categories are counted
3. **Position Type Validation**: Only "individual", "group", and "general" are counted
4. **Participant Matching**: Chest numbers must match exactly (string comparison)

### Error Handling
- **Missing Programmes**: If programme not found, registration is skipped
- **Invalid Categories**: Unknown categories are ignored
- **Invalid Position Types**: Unknown position types are ignored
- **Empty Participants**: Registrations without participants array are skipped

This calculation provides a comprehensive view of each candidate's programme participation, showing both what types of programmes they're in (Arts vs Sports) and how they participate (Individual vs Group vs General).