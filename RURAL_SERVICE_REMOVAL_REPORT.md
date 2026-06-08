# Rural Service Removal Report

## Overview

The Rural Service parameter has been removed from all active AI transfer prediction, recommendation, scoring, ranking, and eligibility logic. The database schema and historical data are retained for rollback and audit purposes.

## Files Modified

- `backend/main.py`
- `backend/train_model.py`
- `frontend/src/pages/TeacherDashboard.jsx`
- `frontend/src/pages/LandingPage.jsx`

## Previous Rural Service Usage

Rural service was previously used in:

- Backend AI feature engineering and model training as `rural_service_years`
- Priority scoring in `compute_priority()`
- Transfer recommendation explanations in `get_transfer_reasons()`
- Transfer prediction feature vector in `/predict_transfer`
- User-facing priority breakdown in `TeacherDashboard.jsx`
- Teacher profile details and dashboard quick stats in `TeacherDashboard.jsx`
- Marketing/explanation content in `LandingPage.jsx`

## What Changed

### Backend

- Removed `rural_service_years` from `EXPECTED_FEATURE_COLS`
- Removed `rural_service_years` from model training data and feature column list
- Removed `rural_service_years` from `compute_priority()`
- Removed rural service reasoning from `get_transfer_reasons()`
- Removed `rural_service_years` from the prediction feature vector in `/predict_transfer`
- Removed `rural_service_years` from prediction response details

### Frontend

- Removed the rural service entry from the teacher profile summary
- Removed the rural service quick stats card
- Removed rural service from the AI priority breakdown chart
- Removed rural service from the landing page scoring explanation list

## New Scoring Logic

The active backend priority score now uses only the following criteria:

- `transfer_request` (formal transfer request)
- `medical_condition`
- `years_of_service`
- `years_in_current_school`
- `promotion_due`
- `spouse_distance`
- `subject` through encoded label
- minimum tenure penalty for `years_in_current_school < 3`

### Active `compute_priority()` weights

- Transfer Request: +30
- Medical Condition: +25
- Years of Service >= 5: +15
- Years in Current School >= 3: +20
- Promotion Due: +10
- Years of Service >= 10: +10
- Spouse Distance > 200 km: +20
- Tenure Penalty if years in current school < 3: -40 (min 0)

## New AI Feature List

The model now trains on the following input features:

- `years_of_service`
- `years_in_current_school`
- `transfer_request`
- `medical_condition`
- `spouse_distance`
- `promotion_due`
- `subject_encoded`

## Confirmation

- `rural_service_years` is no longer used in prediction, scoring, recommendation, or eligibility calculations.
- The only remaining references are in the database schema and synthetic data generation for historical retention.
- Application stability was verified by:
  - `python -m py_compile backend/main.py backend/train_model.py`
  - `cd frontend && npm run build`

## Additional Improvements

- Simplified the teacher-facing prediction breakdown by removing a hard-to-explain rural service component.
- Reduced explanation noise and focused recommendations on transparent criteria such as tenure, medical needs, spouse distance, and promotion eligibility.
- Updated the landing page content to remove rural service from the list of transfer scoring factors.

## Notes

- The `rural_service_years` column remains in the SQLite schema for backward compatibility and rollback ability.
- No authentication or user management logic was changed.
- No historical data was deleted.
