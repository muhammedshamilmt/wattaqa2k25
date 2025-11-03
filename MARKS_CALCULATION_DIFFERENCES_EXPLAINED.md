# 🔍 Why Grand Marks and Filtered Summary Show Different Numbers

## 📊 **Understanding the Different Calculations**

When you filter by team in Programme Breakdown, you see **three different numbers** that serve different purposes:

---

## **1. 📊 Filtered Results Summary (Blue Box)**

**Purpose**: Shows **aggregate statistics** for all teams in the filtered programmes

**What it calculates**:
- **Total Programmes**: Number of programmes matching filters
- **Total Winners**: All winners across all teams in those programmes  
- **Total Distributed**: Sum of position points distributed (NO grade points)
- **Teams Involved**: Number of different teams that won in those programmes

**Example Calculation**:
```
Programme A: 1st=15pts, 2nd=10pts, 3rd=5pts → Total: 30pts
Programme B: 1st=15pts, 2nd=10pts → Total: 25pts
Programme C: 1st=3pts, 2nd=2pts, 3rd=1pt → Total: 6pts
---
Filtered Summary Total: 61pts (position points only, all teams)
```

---

## **2. 🔵 Team Filtered Points (Blue Team Card)**

**Purpose**: Shows **specific team's performance** in filtered programmes only

**What it calculates**:
- **Individual/Group/General**: Team's points by category in filtered programmes
- **Total**: Team's total points from filtered programmes
- **Includes**: Position points + Grade points for that team only

**Example Calculation**:
```
Team AQS in filtered programmes:
- Programme A: 1st place (15pts) + Grade A (5pts) = 20pts
- Programme C: 2nd place (2pts) + Grade B (3pts) = 5pts
---
Team Filtered Total: 25pts (position + grade points, AQS only)
```

---

## **3. 🟣 Team Grand Total (Purple Team Card)**

**Purpose**: Shows **team's complete performance** across ALL published results

**What it calculates**:
- **Individual/Group/General**: Team's points by category from all programmes
- **Total**: Team's total points from all published programmes
- **Includes**: Position points + Grade points for that team only

**Example Calculation**:
```
Team AQS in ALL programmes:
- 33 programmes with various positions and grades
- Total across all: 173pts (position + grade points, AQS only)
```

---

## **🎯 Why Numbers Are Different**

| Metric | Scope | Grade Points | Teams |
|--------|-------|--------------|-------|
| **Filtered Summary** | Filtered programmes | ❌ No | 🌐 All teams |
| **Team Filtered** | Filtered programmes | ✅ Yes | 👤 One team |
| **Team Grand Total** | All programmes | ✅ Yes | 👤 One team |

---

## **📈 Real Example from Your Data**

**SMD Team Results**:
- **Grand Total**: 208 points (all 40 programmes, SMD only, with grades)
- **Filtered Summary**: 191 points (31 programmes, all teams, no grades)
- **Team Filtered**: Would show SMD's points from those 31 programmes with grades

**Why 208 ≠ 191**:
1. **Scope**: 208 includes 9 more programmes (40 vs 31)
2. **Grade Points**: 208 includes grade bonuses, 191 doesn't
3. **Team Focus**: 208 is SMD only, 191 includes all teams' base points

---

## **✅ This is Correct Behavior!**

The different numbers serve different analytical purposes:

- **📊 Filtered Summary**: "How many points were distributed in these programmes?"
- **🔵 Team Filtered**: "How many points did this team earn in these programmes?"  
- **🟣 Team Grand Total**: "How many points did this team earn overall?"

---

## **🔍 Verification Tools**

1. **🔍 Verify Marks**: Main dashboard button - shows overall calculation details
2. **🔍 Verify Team**: Team card button - shows specific team breakdown
3. **Console Logs**: Detailed programme-by-programme breakdown

---

## **📋 Quick Reference**

**When filtering by team, expect**:
- Filtered Summary ≠ Team Filtered (different scope and grade inclusion)
- Team Filtered ≠ Team Grand Total (different programme count)
- All calculations are mathematically correct for their intended purpose

The system is working as designed to provide comprehensive analytical insights! 🎉