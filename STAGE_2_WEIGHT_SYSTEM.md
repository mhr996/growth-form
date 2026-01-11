# Stage 2 Weight System & Active Stage Selection

## Overview

Implemented a different weight system for Stage 2 where only one correct answer per question holds the full weight, and added global settings for selecting the active stage.

## Changes Made

### 1. New Component: Field Edit Modal for Stage 2

**File:** `components/field-edit-modal-stage2.tsx`

- **Purpose:** Separate modal for editing Stage 2 fields with different weight logic
- **Key Features:**

  - For MCQ questions: Admin selects ONE correct answer that gets the full weight
  - Visual indication of correct answer with green badge showing points
  - For AI questions: Uses same AI prompt builder as Stage 1
  - Weight field represents total points for the question (not distributed)
  - Updates options array to assign weight only to selected correct answer

- **How it works:**
  - When admin selects a correct answer, that option gets `weight: questionWeight`
  - All other options get `weight: 0`
  - User gets full points only if they choose the correct answer

### 2. Updated Stage 2 Admin Page

**File:** `app/admin/stages/stage-2/page.tsx`

- Changed import from `FieldEditModal` to `FieldEditModalStage2`
- Now uses the new Stage 2-specific modal
- Stage 1 remains unchanged and uses original modal

### 3. Active Stage Selection

**File:** `app/admin/settings/page.tsx`

- **Complete rewrite** from placeholder to functional settings page
- **Features:**

  - Visual stage selector (1, 2, or 3)
  - Saves to `stage_settings.active_stage` column
  - Shows which stage is currently active with checkmark
  - Save button with loading state and success feedback
  - Info box explaining impact of changing active stage

- **Purpose:** Determines which stage's fields are displayed in the main form

### 4. Database Migration

**File:** `supabase/migrations/add_active_stage.sql`

```sql
ALTER TABLE stage_settings
ADD COLUMN IF NOT EXISTS active_stage INTEGER DEFAULT 1;

ADD CONSTRAINT active_stage_check CHECK (active_stage BETWEEN 1 AND 3);
```

## How to Use

### For Admin - Setting Correct Answers (Stage 2)

1. Go to Stage 2 admin page
2. Click edit button on any MCQ field
3. In the modal, select the correct answer from the radio options
4. The selected answer will show a green "✓ صحيح (X نقطة)" badge
5. Save changes

### For Admin - Changing Active Stage

1. Go to Admin Settings page
2. Click on the stage number (1, 2, or 3)
3. Click "حفظ الإعدادات" (Save Settings)
4. The selected stage's fields will now appear in the main form

### For Users - Taking the Test

**Stage 1 (Original Logic):**

- Each option has a weight
- User's score = sum of weights of all selected options
- Can get partial credit

**Stage 2 (New Logic):**

- Only ONE correct answer per question
- Choose correct answer → get full points
- Choose wrong answer → get 0 points
- No partial credit

## Technical Details

### Stage 2 Weight Storage

```typescript
// Question has weight: 10
// Options after selecting "option2" as correct:
options: {
  options: [
    { value: "option1", label: "Choice A", weight: 0 },
    { value: "option2", label: "Choice B", weight: 10 }, // Correct!
    { value: "option3", label: "Choice C", weight: 0 },
    { value: "option4", label: "Choice D", weight: 0 },
  ];
}
```

### Active Stage Query

```typescript
const { data } = await supabase
  .from("stage_settings")
  .select("active_stage")
  .single();

// Returns: { active_stage: 1 } (or 2, or 3)
```

## Database Setup

Run this SQL in Supabase SQL Editor:

```sql
-- Add the active_stage column
ALTER TABLE stage_settings
ADD COLUMN IF NOT EXISTS active_stage INTEGER DEFAULT 1;

ALTER TABLE stage_settings
ADD CONSTRAINT active_stage_check CHECK (active_stage BETWEEN 1 AND 3);
```

## Next Steps

1. **Run the migration** to add `active_stage` column
2. **Test Stage 2 editing** - verify correct answer selection works
3. **Test active stage switching** - ensure main form respects the setting
4. **Update main form** (if needed) to read `active_stage` and display appropriate fields

## Notes

- Stage 1 components remain **completely unchanged**
- Stage 2 uses separate modal to avoid conflicts
- AI questions in Stage 2 work exactly like Stage 1
- Active stage defaults to 1 (Stage 1 is active by default)
- Stage selection is stored globally and affects the main form display
