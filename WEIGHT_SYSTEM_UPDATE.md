# Weight System Update - Enable/Disable Field Weights

## What Changed:

### 1. Database Schema

- **New Column**: `has_weight` (BOOLEAN, default: true)
- **Purpose**: Determines whether a field contributes to the submission score
- **SQL File**: [ADD_HAS_WEIGHT_COLUMN.sql](ADD_HAS_WEIGHT_COLUMN.sql)

### 2. Field Edit Modal

- **New Toggle**: "هذا الحقل يؤثر على نتيجة التقييم (له وزن)"
- **Behavior**:
  - When checked: Shows weight slider (1-10) and field contributes to score
  - When unchecked: Hides weight slider and field is excluded from score calculation
  - AI-calculated fields: Cannot toggle (always use AI scoring)

### 3. Admin Interface

- **Visual Indicators**: Added badges to show field weight status
  - **Amber badge**: "وزن: X" - Shows when field has weight enabled
  - **Blue badge**: "AI" - Shows for AI-calculated fields
  - No badge when `has_weight` is disabled

## How It Works:

### For Admins:

1. Go to: Admin → المراحل → المرحلة 1 → تعديل الحقول
2. Click Edit on any field
3. Toggle "هذا الحقل يؤثر على نتيجة التقييم (له وزن)"
   - **Enabled**: Field will contribute to score with specified weight (1-10)
   - **Disabled**: Field will NOT affect score (informational only)
4. Adjust weight slider if enabled
5. Save changes

### For Scoring System:

- When calculating submission scores:
  - Only fields with `has_weight = true` should be included
  - AI-calculated fields use their own scoring (not affected by this toggle)
  - Fields with `has_weight = false` are ignored in score calculation

## Use Cases:

**Fields that should have `has_weight = false`:**

- City selection (already fixed to Riyadh)
- Email (auto-filled, not evaluated)
- Phone number (for contact only)
- Terms acceptance checkbox
- Information fields (not evaluated)

**Fields that should have `has_weight = true`:**

- Education level
- Field of work
- Employment status
- Experience level
- Any evaluative questions

## Setup Instructions:

1. **Run the SQL script** in Supabase:

   ```sql
   -- Open Supabase Dashboard → SQL Editor
   -- Paste and run: ADD_HAS_WEIGHT_COLUMN.sql
   ```

2. **Update existing fields** (optional):

   ```sql
   -- Disable weight for informational fields
   UPDATE form_fields SET has_weight = false WHERE field_name IN ('city', 'email');
   ```

3. The changes are now live in the admin interface!

## Default Behavior:

- **New fields**: `has_weight = true` by default
- **Existing fields**: Will have `has_weight = true` after migration
- **AI fields**: Automatically set to `has_weight = false` (they have their own scoring)

## Visual Guide:

### Field with Weight Enabled:

```
[Field Name] [مطلوب] [text] [وزن: 7]
```

### Field with Weight Disabled:

```
[Field Name] [مطلوب] [text]
(no weight badge)
```

### AI-Calculated Field:

```
[Field Name] [مطلوب] [textarea] [AI]
(AI badge instead of weight)
```
