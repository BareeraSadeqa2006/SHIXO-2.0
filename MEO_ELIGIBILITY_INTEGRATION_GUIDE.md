# MEO Dashboard AI Eligibility Integration - Complete Guide

## Overview
This document describes the enhanced SHIXO transfer approval workflow that integrates the existing AI Transfer Eligibility system into the MEO Dashboard. MEO officers can now review teacher transfer eligibility before making approval/rejection decisions.

## What's New

### 1. "Check Eligibility" Button in MEO Dashboard
- Located in the **Requests** tab under **Pending Transfer Requests**
- Appears as a **gold button** initially
- Changes to **teal** ("✓ Eligibility Checked") after review

### 2. AI Eligibility Modal
When an MEO clicks "Check Eligibility", a detailed modal displays:
- **Transfer Recommendation**: "Transfer Recommended" or "Transfer Not Recommended"
- **Confidence Score**: Percentage confidence (0-100%)
- **Priority Score**: 0-100 scale based on teacher factors
- **Key Eligibility Factors**: List of specific factors influencing the decision
- **Teacher Details**: Years of service, tenure, medical conditions, spouse distance, etc.
- **Advisory Note**: Reminder that AI recommendation is advisory, not mandatory

### 3. Approval Workflow Changes
**Before**: MEO could directly approve/reject any pending request
**Now**: 
- ✓ MEO must check eligibility first
- ✓ Approve and Reject buttons are disabled until eligibility is reviewed
- ✓ After eligibility review, MEO can approve OR reject regardless of recommendation
- ✓ The AI recommendation is advisory only

### 4. Audit Trail
Every eligibility check is recorded with:
- MEO ID who performed the check
- Teacher ID being evaluated
- Timestamp of the check
- Full eligibility result (recommendation, confidence, factors)
- Later: Approval/rejection decision with timestamp

## Implementation Details

### Database Changes
**New Tables:**
- `eligibility_audit_trail`: Stores all eligibility checks performed by MEOs

**Modified Tables:**
- `transfer_requests`: Added three new columns:
  - `eligibility_checked`: Flag (0/1) indicating if eligibility was checked
  - `eligibility_checked_date`: Timestamp when checked
  - `eligibility_result`: JSON containing full eligibility details

### API Endpoints

#### New Endpoint: POST `/check_eligibility_meo`
**Request:**
```json
{
  "request_id": "REQ001",
  "meo_id": "MEO001"
}
```

**Response:**
```json
{
  "success": true,
  "eligibility_result": {
    "teacher_id": "TCH00001",
    "name": "Rajesh Sharma",
    "subject": "Mathematics",
    "transfer_recommended": true,
    "transfer_eligible": true,
    "confidence": 82.5,
    "priority_score": 72,
    "reasons": [
      "Teacher has submitted a formal transfer request",
      "Completed 6 years of service (≥5 years)",
      "Completed 4 years in the current school",
      "Top factors: years_in_current_school, transfer_request, spouse_distance"
    ],
    "details": {
      "years_of_service": 6,
      "transfer_request": 1,
      "medical_condition": 0,
      "spouse_distance": 250,
      "promotion_due": 0,
      "years_in_current_school": 4
    }
  },
  "audit_logged": true
}
```

#### Modified Endpoints
**POST `/approve_transfer`**
- Now requires `eligibility_checked = 1` in transfer_requests table
- Returns error if eligibility not checked: "Eligibility must be checked before approval"

**POST `/reject_transfer`**
- Now requires `eligibility_checked = 1` in transfer_requests table
- Returns error if eligibility not checked: "Eligibility must be checked before rejection"

### Frontend Components

**MEO Dashboard Changes:**
- New "Check Eligibility" button in Requests tab
- New eligibility results modal
- Disabled state for Approve/Reject buttons until eligibility checked
- Visual indicators for check status

**Teacher Dashboard:**
- NO CHANGES - Existing "Check Eligibility" feature remains unchanged
- Teachers can still check their own eligibility independently

## Workflow Example

### Step-by-Step Process
1. **Teacher Submits Request**
   - Teacher goes to Teacher Dashboard → Transfer tab
   - Clicks "Apply for Transfer" and submits request
   - Request appears in MEO Dashboard → Requests tab as "Pending"

2. **MEO Reviews Request**
   - MEO logs into MEO Dashboard
   - Goes to Requests tab
   - Sees pending transfer request card/row
   - **Approve and Reject buttons are DISABLED (grayed out)**

3. **MEO Checks Eligibility**
   - MEO clicks **"Check Eligibility"** button (gold)
   - System calls AI model to evaluate teacher
   - Modal appears showing:
     - Transfer recommendation
     - Confidence score
     - Priority score
     - Key factors explaining the decision
     - Teacher profile details
   - MEO reviews the information
   - MEO clicks "Close & Proceed"
   - **"Check Eligibility" button now shows "✓ Eligibility Checked" (teal)**
   - **Approve and Reject buttons are now ENABLED**

4. **MEO Makes Decision**
   - **Option A - APPROVE**: Click "Approve" button
     - Transfer is approved
     - Teacher gets notification
     - Transfer order PDF is generated
   - **Option B - REJECT**: Click "Reject" button
     - Select rejection reason from dropdown
     - Click "Confirm Rejection"
     - Teacher gets notification with reason

5. **Audit Trail**
   - All checks are logged to `eligibility_audit_trail` table
   - Records include: MEO ID, Teacher ID, timestamp, full eligibility result
   - Provides complete transparency for policy review

## Key Features & Benefits

### Transparency
- MEO can see exactly why the AI recommends or doesn't recommend a transfer
- Clear factor-based explanation helps with policy compliance

### Flexibility
- AI recommendation is advisory only
- MEO can override any recommendation based on local knowledge, policy, or circumstances
- No mandatory approval/rejection based on AI output

### Auditability
- Complete audit trail of all eligibility checks
- Records show which MEO reviewed what teacher and when
- Supports compliance and appeals

### User Experience
- Simple one-click "Check Eligibility" process
- Comprehensive modal with all relevant information
- Clear visual states (button colors indicate status)
- Helpful tooltips explain why buttons are disabled

## Testing Instructions

### Setup
1. Database will auto-initialize on backend startup
2. New tables/columns added automatically
3. No manual migration needed

### Test Scenario 1: Happy Path
1. Create a test teacher in database
2. Create a test transfer request
3. Login as MEO
4. Go to Requests tab
5. Verify "Check Eligibility" button is gold and enabled
6. Verify Approve/Reject buttons are grayed out
7. Click "Check Eligibility"
8. Verify modal displays with eligibility information
9. Close modal
10. Verify button now shows "✓ Eligibility Checked" (teal)
11. Verify Approve/Reject buttons are now enabled
12. Click Approve
13. Verify transfer is approved
14. Verify audit trail entry exists

### Test Scenario 2: Eligibility Check Constraint
1. Create test transfer request
2. Try to call `POST /approve_transfer` directly without checking eligibility
3. Verify error: "Eligibility must be checked before approval"
4. Do the same for `POST /reject_transfer`

### Test Scenario 3: Teacher Dashboard Unaffected
1. Login as teacher
2. Go to Dashboard → Transfer tab
3. Verify "Check Eligibility" button still exists and works
4. Verify no changes to teacher functionality

### Test Scenario 4: Override Recommendation
1. Check eligibility for a teacher
2. Even if recommendation is "Not Recommended", MEO should be able to approve
3. Verify Approve button works
4. Verify transfer goes through
5. Verify audit trail shows the check

## Troubleshooting

### Issue: "Eligibility must be checked before approval" error
**Solution**: Click "Check Eligibility" button first, then try again

### Issue: Check Eligibility button not working
**Possible Causes**:
- Network connectivity issue
- Backend not running
- MEO not authorized for that mandal
**Solution**: Check browser console for error details, ensure MEO is assigned to correct mandal

### Issue: Modal shows old data
**Solution**: Refresh page and try again

### Issue: Audit trail not recording
**Possible Cause**: Database permissions issue
**Solution**: Verify database write permissions

## Database Schema Reference

### eligibility_audit_trail Table
```sql
CREATE TABLE eligibility_audit_trail (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT REFERENCES transfer_requests(request_id),
    teacher_id TEXT REFERENCES teachers(teacher_id),
    meo_id TEXT REFERENCES meos(meo_id),
    checked_at TEXT DEFAULT (datetime('now')),
    eligibility_result TEXT NOT NULL,  -- JSON
    transfer_recommended INTEGER,
    confidence_score REAL,
    priority_score REAL,
    key_factors TEXT,  -- JSON array
    explanation TEXT
);
```

### transfer_requests Table (New Columns)
```sql
ALTER TABLE transfer_requests ADD COLUMN eligibility_checked INTEGER DEFAULT 0;
ALTER TABLE transfer_requests ADD COLUMN eligibility_checked_date TEXT;
ALTER TABLE transfer_requests ADD COLUMN eligibility_result TEXT;
```

## FAQ

**Q: Can MEO approve a transfer that the AI says is not recommended?**
A: Yes. The AI recommendation is advisory only. MEO can make their own decision.

**Q: What if MEO doesn't like the AI recommendation?**
A: MEO can still approve or reject. The purpose is transparency, not enforcement.

**Q: Does Teacher Dashboard change?**
A: No. Teacher's existing "Check Eligibility" feature is unchanged.

**Q: Can MEO check eligibility multiple times?**
A: Yes. Each check is recorded as a separate audit trail entry.

**Q: What if a teacher is in cooling-off period?**
A: The eligibility check will show "Transfer Not Recommended" with reason "Cooling-off period active". MEO still has choice to approve or reject.

**Q: Are the audit trails searchable?**
A: Currently, they're stored in the database. Can be queried for reporting later.

**Q: What factors does the AI consider?**
A: Years of service, tenure, medical conditions, spouse distance, promotion status, subject vacancies, school shortages, student-teacher ratios, etc.

## Files Modified
- `backend/database.py` - Added tables and columns
- `backend/main.py` - Added endpoint and validation
- `frontend/src/api.js` - Added API call
- `frontend/src/pages/MEODashboard.jsx` - Added UI components

## Backward Compatibility
All changes are backward compatible:
- Existing transfer requests work with new columns (defaulting to unchecked)
- Teacher Dashboard functionality completely unchanged
- Existing API endpoints still work with added validation
- Database migration is automatic on startup

## Performance Considerations
- Eligibility check uses same AI model as Teacher Dashboard
- Modal is client-side rendered (no additional server calls)
- Audit trail stored locally (no external dependencies)
- No impact on existing system performance

---

**Version**: 1.0
**Last Updated**: 2026-06-12
**Status**: Implementation Complete
