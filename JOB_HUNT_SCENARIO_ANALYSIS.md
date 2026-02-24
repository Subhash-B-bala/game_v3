# Job Hunt Module - Scenario Analysis
## Permutation & Combination Based on Orientation Phase Inputs

---

## 📊 **Summary**

### User Input from Orientation Phase:
- **Role Selection:** 4 options
  - `analyst`
  - `engineer`
  - `ai_engineer`
  - `fullstack`

---

## 🎯 **Total Scenarios in Job Hunt Module**

### **Main Scenarios:** 30
- **Role-Specific (Locked):** 5 scenarios
- **Universal (Available to All):** 25 scenarios

### **Fallback Scenario:** 1
- Appears when no valid scenarios match current state
- **Total Scenarios:** 31 (30 main + 1 fallback)

---

## 📈 **Scenario Distribution by Stage**

The job hunt has 5 stages (0-4):

| Stage | Name | Scenario Count |
|-------|------|----------------|
| 0 | FOUNDATIONAL | 8 scenarios |
| 1 | GATED | 8 scenarios |
| 2 | SCAN | 7 scenarios |
| 3 | REACH | 5 scenarios |
| 4 | INTERVIEW | 2 scenarios |

**Total:** 30 scenarios

---

## 👔 **Role-Specific Breakdown**

### Scenarios Accessible Per Role:

| Role | Exclusive Scenarios | Universal Scenarios | Total Accessible |
|------|--------------------|--------------------|------------------|
| **analyst** | 2 | 25 | **27** |
| **engineer** | 2 | 25 | **27** |
| **ai_engineer** | 1 | 25 | **26** |
| **fullstack** | 2 | 25 | **27** |

### Role-Specific Scenario Distribution:

- **analyst:** 2 exclusive scenarios
- **engineer:** 2 exclusive scenarios
- **fullstack:** 2 exclusive scenarios
- **ai_engineer:** 1 exclusive scenario
- **backend:** 1 exclusive scenario (shared with engineer/fullstack)

---

## 🎲 **Choices Per Scenario**

- **Total Choices Across All 30 Scenarios:** 120
- **Average Choices per Scenario:** 4.0
- **Fallback Scenario Choices:** 4

**Each scenario consistently has 4 choices!**

---

## 🔢 **PERMUTATION & COMBINATION CALCULATIONS**

### **Question-Choice Combinations by Role:**

| Role | Scenarios Available | Total Choices |
|------|---------------------|---------------|
| analyst | 27 | **108** |
| engineer | 27 | **108** |
| ai_engineer | 26 | **104** |
| fullstack | 27 | **108** |

### **Total Unique Question-Choice Combinations:**

```
Across all 4 roles: 428 unique combinations
```

---

## 🧮 **Mathematical Breakdown**

### **Formula:**

For each role:
```
Total Choices = Σ(choices per scenario) for all accessible scenarios
```

### **Calculations:**

**analyst:**
- 27 scenarios × 4 choices/scenario = 108 combinations

**engineer:**
- 27 scenarios × 4 choices/scenario = 108 combinations

**ai_engineer:**
- 26 scenarios × 4 choices/scenario = 104 combinations

**fullstack:**
- 27 scenarios × 4 choices/scenario = 108 combinations

**Total:**
```
108 + 108 + 104 + 108 = 428 unique question-choice combinations
```

---

## 🔄 **Including Fallback Scenario**

### **Fallback Scenario:**
- **ID:** `fallback_grind`
- **Title:** "Quiet Market"
- **Choices:** 4
- **When it appears:** No valid scenarios match current state

### **Total with Fallback:**

| Role | Main Scenarios | Fallback | Total Scenarios | Total Choices |
|------|----------------|----------|-----------------|---------------|
| analyst | 27 | 1 | 28 | 112 |
| engineer | 27 | 1 | 28 | 112 |
| ai_engineer | 26 | 1 | 27 | 108 |
| fullstack | 27 | 1 | 28 | 112 |

**Grand Total: 444 unique question-choice combinations**

---

## 📝 **Key Insights**

1. **Consistent Design:** Every scenario has exactly 4 choices, making the experience uniform

2. **Role Differentiation:**
   - Analyst, Engineer, and Fullstack roles have the most content (27 scenarios each)
   - AI Engineer has slightly less (26 scenarios)

3. **Universal Content:** 83% of scenarios (25/30) are accessible to all roles

4. **Progression Gating:** Scenarios are distributed across 5 stages, unlocking as the player progresses

5. **Fallback Safety Net:** The fallback scenario ensures players never get stuck without options

---

## 🎮 **Player Experience**

### **Per Playthrough:**
- A player choosing one role will experience **27-28 unique scenarios**
- Each scenario presents **4 meaningful choices**
- Total decision points per role: **108-112 unique choices**

### **Across All Roles:**
- To experience all unique content, a player would need to play through all 4 roles
- This provides **444 total unique question-choice combinations**

---

## ✅ **Answer to Your Question**

**Total number of questions (scenarios) generated in Job Hunt Module:**

- **Base scenarios:** 30
- **Fallback scenario:** 1
- **Total:** 31 scenarios

**Total unique question-choice combinations based on orientation role selection:**

- **Including all 4 role variations:** 444 unique combinations
- **Per role playthrough:** 108-112 combinations

**Each scenario has 4 choices, totaling 120 choices across 30 scenarios (124 including fallback).**

---

*Last Updated: February 15, 2026*
*Generated from: `/client/src/engine/chapter3_job_hunt/job_hunt_scenarios.json`*
