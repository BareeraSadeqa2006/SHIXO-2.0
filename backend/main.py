"""
SHIXO - AI-Powered Government Teacher Transfer & Workforce Management Platform
FastAPI Backend
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
import os
import json
import uuid
import ast
import hashlib
from datetime import datetime

import pandas as pd
import numpy as np
import joblib

from database import get_db, init_db, seed_db, DB_PATH, hash_password
from database import ist_now_str, compute_expected_teachers, compute_shortage_for_school

app = FastAPI(title="SHIXO API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
PDF_DIR = os.path.join(os.path.dirname(__file__), "pdfs")
model = None
le_subject = None
feature_cols = None
le_mandal = None
le_district = None
le_schoolcat = None

MIN_YEARS_IN_CURRENT_SCHOOL_FOR_TRANSFER = 3
# Minimum tenure to normally allow transfer recommendations
MIN_TENURE_PENALTY = 50
EXPECTED_FEATURE_COLS = [
    'years_of_service', 'years_in_current_school', 'transfer_request', 'medical_condition',
    'spouse_distance', 'promotion_due', 'subject_encoded', 'subject_vacancy', 'shortage',
    'student_teacher_ratio', 'school_cat_enc', 'mandal_enc', 'district_enc'
]


# ── Pydantic Models ──────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    user_id: str
    password: str
    role: str

class PredictRequest(BaseModel):
    teacher_id: str

class ApplyTransferRequest(BaseModel):
    teacher_id: str
    requested_school: str
    transfer_reason: str

class ApproveTransferRequest(BaseModel):
    request_id: str
    meo_id: str

class RejectTransferRequest(BaseModel):
    request_id: str
    meo_id: str
    rejection_reason: str

class RecommendSchoolRequest(BaseModel):
    teacher_id: str

class SubmitAppealRequest(BaseModel):
    teacher_id: str
    original_request_id: str
    appeal_reason: str
    appeal_type: str = "standard"
    is_emergency: bool = False

class ReviewAppealRequest(BaseModel):
    appeal_id: str
    meo_id: str
    action: str  # 'approve' or 'reject'
    review_notes: str = ""

class ReapplyTransferRequest(BaseModel):
    teacher_id: str
    requested_school: str
    transfer_reason: str


# ── Startup ──────────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup():
    global model, le_subject, feature_cols
    init_db()
    seed_db()
    os.makedirs(MODEL_DIR, exist_ok=True)
    os.makedirs(PDF_DIR, exist_ok=True)

    model_path = os.path.join(MODEL_DIR, "transfer_model.pkl")
    feature_cols_path = os.path.join(MODEL_DIR, "feature_cols.pkl")
    should_train = False

    if not os.path.exists(model_path) or not os.path.exists(feature_cols_path):
        should_train = True
    else:
        try:
            saved_feature_cols = joblib.load(feature_cols_path)
            if any(feature not in saved_feature_cols for feature in EXPECTED_FEATURE_COLS):
                should_train = True
        except Exception:
            should_train = True

    if should_train:
        # Delegate training to the separate script which also writes encoders
        try:
            from train_model import train as train_entry
            train_entry()
        except Exception:
            try:
                # fallback to existing trainer function if present
                train_model_from_db()
            except Exception:
                pass

    model = joblib.load(model_path)
    le_subject = joblib.load(os.path.join(MODEL_DIR, "label_encoder_subject.pkl"))
    feature_cols = joblib.load(feature_cols_path)
    # optional encoders
    try:
        le_mandal = joblib.load(os.path.join(MODEL_DIR, "label_encoder_mandal.pkl"))
    except Exception:
        le_mandal = None
    try:
        le_district = joblib.load(os.path.join(MODEL_DIR, "label_encoder_district.pkl"))
    except Exception:
        le_district = None
    try:
        le_schoolcat = joblib.load(os.path.join(MODEL_DIR, "label_encoder_schoolcat.pkl"))
    except Exception:
        le_schoolcat = None


def train_model_from_db():
    # For legacy compatibility, call train_model.py's train() if available
    try:
        from train_model import train as train_entry
        train_entry()
    except Exception as e:
        print('Training failed via train_model.train():', e)


# ── Helpers ──────────────────────────────────────────────────────────────────

def compute_priority(row: dict) -> float:
    score = 0
    if row.get("transfer_request", 0) == 1:
        score += 30
    if row.get("medical_condition", 0) == 1:
        score += 25
    if row.get("years_of_service", 0) >= 5:
        score += 15
    if row.get("years_in_current_school", 0) >= MIN_YEARS_IN_CURRENT_SCHOOL_FOR_TRANSFER:
        score += 20
    if row.get("promotion_due", 0) == 1:
        score += 10
    if row.get("years_of_service", 0) >= 10:
        score += 10
    if row.get("spouse_distance", 0) > 200:
        score += 20

    if row.get("years_in_current_school", 0) < MIN_YEARS_IN_CURRENT_SCHOOL_FOR_TRANSFER:
        score = max(score - MIN_TENURE_PENALTY, 0)

    return min(score, 100)


def get_transfer_reasons(row: dict) -> list:
    reasons = []
    if row.get("transfer_request", 0) == 1:
        reasons.append("Teacher has submitted a formal transfer request")
    if row.get("medical_condition", 0) == 1:
        reasons.append("Medical condition requires transfer consideration")
    if row.get("years_of_service", 0) >= 5:
        reasons.append(f"Completed {row['years_of_service']} years of service (≥5 years)")
    if row.get("years_in_current_school", 0) >= MIN_YEARS_IN_CURRENT_SCHOOL_FOR_TRANSFER:
        reasons.append(f"Completed {row['years_in_current_school']} years in the current school")
    if row.get("years_in_current_school", 0) < MIN_YEARS_IN_CURRENT_SCHOOL_FOR_TRANSFER:
        reasons.append(f"Current school tenure below minimum requirement of {MIN_YEARS_IN_CURRENT_SCHOOL_FOR_TRANSFER} years")
    if row.get("promotion_due", 0) == 1:
        reasons.append("Promotion due — eligible for upgraded posting")
    if row.get("spouse_distance", 0) > 200:
        reasons.append(f"Spouse located {row['spouse_distance']} km away")
    if not reasons:
        reasons.append("Routine transfer cycle review")
    return reasons


def add_notification(teacher_id: str, message: str, ntype: str = "info"):
    conn = get_db()
    conn.execute(
        "INSERT INTO notifications (teacher_id, message, type) VALUES (?, ?, ?)",
        (teacher_id, message, ntype)
    )
    conn.commit()
    conn.close()


def generate_transfer_pdf(request_id: str) -> str:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm, cm
    from reportlab.lib.colors import HexColor
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    from reportlab.platypus.flowables import KeepTogether

    conn = get_db()
    req = conn.execute(
        "SELECT * FROM transfer_requests WHERE request_id = ?", (request_id,)
    ).fetchone()
    if not req:
        conn.close()
        return ""

    teacher = conn.execute(
        "SELECT * FROM teachers WHERE teacher_id = ?", (req["teacher_id"],)
    ).fetchone()

    old_school = conn.execute(
        "SELECT * FROM schools WHERE school_id = ?", (req["current_school"],)
    ).fetchone()

    new_school = conn.execute(
        "SELECT * FROM schools WHERE school_id = ?", (req["requested_school"],)
    ).fetchone()

    meo = conn.execute(
        "SELECT * FROM meos WHERE meo_id = ?", (req["assigned_meo"],)
    ).fetchone()
    conn.close()

    if not teacher or not old_school or not new_school:
        return ""

    pdf_filename = f"transfer_order_{request_id}.pdf"
    pdf_path = os.path.join(PDF_DIR, pdf_filename)
    now = ist_now_str(fmt="%d-%m-%Y")

    # Colors
    navy = HexColor('#0B3C5D')
    teal = HexColor('#328CC1')
    gold = HexColor('#D4AF37')
    dark = HexColor('#1a1a1a')
    gray = HexColor('#555555')
    light_bg = HexColor('#F5F7FA')

    doc = SimpleDocTemplate(
        pdf_path, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=1.5*cm, bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle('GovHeader', parent=styles['Title'], fontSize=16,
                              textColor=navy, alignment=TA_CENTER, spaceAfter=2))
    styles.add(ParagraphStyle('GovSubHeader', parent=styles['Normal'], fontSize=11,
                              textColor=teal, alignment=TA_CENTER, spaceAfter=4))
    styles.add(ParagraphStyle('OrderTitle', parent=styles['Title'], fontSize=18,
                              textColor=navy, alignment=TA_CENTER, spaceBefore=8, spaceAfter=4))
    styles.add(ParagraphStyle('OrderNo', parent=styles['Normal'], fontSize=10,
                              textColor=gray, alignment=TA_CENTER, spaceAfter=12))
    styles.add(ParagraphStyle('SectionHead', parent=styles['Heading3'], fontSize=11,
                              textColor=navy, spaceBefore=14, spaceAfter=6,
                              borderPadding=(0, 0, 2, 0)))
    styles.add(ParagraphStyle('FieldLabel', parent=styles['Normal'], fontSize=10,
                              textColor=gray))
    styles.add(ParagraphStyle('FieldValue', parent=styles['Normal'], fontSize=10,
                              textColor=dark, fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle('BodyText2', parent=styles['Normal'], fontSize=10,
                              textColor=dark, spaceBefore=6, spaceAfter=6))
    styles.add(ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8,
                              textColor=gray, alignment=TA_CENTER))
    styles.add(ParagraphStyle('SignLabel', parent=styles['Normal'], fontSize=10,
                              textColor=dark, alignment=TA_CENTER))
    styles.add(ParagraphStyle('SignName', parent=styles['Normal'], fontSize=10,
                              textColor=dark, alignment=TA_CENTER, fontName='Helvetica-Bold'))

    elements = []

    # Gold top line
    elements.append(HRFlowable(width="100%", thickness=3, color=gold, spaceAfter=8))

    # Government header
    elements.append(Paragraph("GOVERNMENT OF TELANGANA", styles['GovHeader']))
    elements.append(Paragraph("Department of School Education", styles['GovSubHeader']))
    elements.append(Paragraph("SHIXO — AI-Powered Teacher Transfer Management System", styles['GovSubHeader']))

    elements.append(HRFlowable(width="100%", thickness=1.5, color=navy, spaceBefore=8, spaceAfter=6))

    # Title
    elements.append(Paragraph("TRANSFER ORDER", styles['OrderTitle']))
    elements.append(Paragraph(f"Order No: SHIXO/TO/{request_id}&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;Date: {now}", styles['OrderNo']))

    elements.append(HRFlowable(width="100%", thickness=0.5, color=teal, spaceAfter=6))

    # Preamble
    elements.append(Paragraph(
        "This is to certify that the following teacher transfer has been reviewed, evaluated, "
        "and approved under the Government Teacher Transfer Management System (SHIXO).",
        styles['BodyText2']
    ))

    # Teacher Details
    elements.append(Paragraph("TEACHER DETAILS", styles['SectionHead']))
    teacher_data = [
        ["Name", teacher['name'], "Teacher ID", teacher['teacher_id']],
        ["Subject", teacher['subject'], "Gender", teacher['gender']],
        ["Years of Service", str(teacher['years_of_service']), "Mandal", teacher['mandal']],
    ]
    t1 = Table(teacher_data, colWidths=[3.5*cm, 5*cm, 3.5*cm, 5*cm])
    t1.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
        ('FONTNAME', (3, 0), (3, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), gray),
        ('TEXTCOLOR', (2, 0), (2, -1), gray),
        ('TEXTCOLOR', (1, 0), (1, -1), dark),
        ('TEXTCOLOR', (3, 0), (3, -1), dark),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BACKGROUND', (0, 0), (-1, -1), light_bg),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#D9E2EC')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(t1)

    # Transfer Details
    elements.append(Paragraph("TRANSFER DETAILS", styles['SectionHead']))
    transfer_data = [
        ["From School", f"{old_school['school_name']} ({old_school['school_id']})"],
        ["From Mandal / District", f"{old_school['mandal']}, {old_school['district']}"],
        ["To School", f"{new_school['school_name']} ({new_school['school_id']})"],
        ["To Mandal / District", f"{new_school['mandal']}, {new_school['district']}"],
        ["Transfer Reason", req['transfer_reason']],
        ["Priority Score", str(req['priority_score'])],
        ["Request Date", req['request_date']],
        ["Approval Date", req['approval_date'] or now],
    ]
    t2 = Table(transfer_data, colWidths=[4.5*cm, 12.5*cm])
    t2.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), gray),
        ('TEXTCOLOR', (1, 0), (1, -1), dark),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BACKGROUND', (0, 0), (-1, -1), light_bg),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#D9E2EC')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(t2)

    # Approval section
    elements.append(Paragraph("APPROVAL DETAILS", styles['SectionHead']))
    meo_name = meo['name'] if meo else 'N/A'
    meo_mandal = meo['assigned_mandal'] if meo else 'N/A'
    approval_data = [
        ["Approved By (MEO)", f"{meo_name} ({req['assigned_meo']})"],
        ["MEO Mandal", meo_mandal],
        ["Status", "APPROVED"],
    ]
    t3 = Table(approval_data, colWidths=[4.5*cm, 12.5*cm])
    t3.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), gray),
        ('TEXTCOLOR', (1, 0), (1, -1), dark),
        ('TEXTCOLOR', (1, 2), (1, 2), HexColor('#2E8B57')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BACKGROUND', (0, 0), (-1, -1), light_bg),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#D9E2EC')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(t3)

    elements.append(Spacer(1, 20))

    # Signature section
    elements.append(HRFlowable(width="100%", thickness=0.5, color=HexColor('#D9E2EC'), spaceAfter=12))
    sig_data = [
        ["", ""],
        ["", ""],
        ["_________________________", "_________________________"],
        ["Teacher Acknowledgment", "Mandal Education Officer"],
        [f"{teacher['name']}", f"{meo_name}"],
        [f"({teacher['teacher_id']})", f"({req['assigned_meo']})"],
    ]
    sig_table = Table(sig_data, colWidths=[8.5*cm, 8.5*cm])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 2), (-1, 2), 'Helvetica'),
        ('FONTNAME', (0, 3), (-1, 3), 'Helvetica'),
        ('FONTNAME', (0, 4), (-1, 4), 'Helvetica-Bold'),
        ('FONTNAME', (0, 5), (-1, 5), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 3), (-1, 3), gray),
        ('TEXTCOLOR', (0, 4), (-1, 4), dark),
        ('TEXTCOLOR', (0, 5), (-1, 5), gray),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, 1), 12),
    ]))
    elements.append(sig_table)

    elements.append(Spacer(1, 20))
    elements.append(HRFlowable(width="100%", thickness=2, color=gold, spaceAfter=6))

    # Footer
    elements.append(Paragraph(
        "This transfer order has been generated electronically through the SHIXO platform.",
        styles['Footer']
    ))
    elements.append(Paragraph(
        "Department of School Education | Government of Telangana | SHIXO v2.0",
        styles['Footer']
    ))

    doc.build(elements)

    conn2 = get_db()
    conn2.execute(
        "UPDATE transfer_requests SET generated_pdf_path = ? WHERE request_id = ?",
        (pdf_path, request_id)
    )
    conn2.commit()
    conn2.close()

    return pdf_path


# ── Auth Endpoints ───────────────────────────────────────────────────────────

@app.post("/login")
def login(req: LoginRequest):
    conn = get_db()
    hashed = hash_password(req.password)

    if req.role == "teacher":
        user = conn.execute(
            "SELECT * FROM teachers WHERE teacher_id = ? AND password = ?",
            (req.user_id, hashed)
        ).fetchone()
        if not user:
            conn.close()
            raise HTTPException(status_code=401, detail="Invalid credentials")
        conn.close()
        return {
            "success": True,
            "role": "teacher",
            "user_id": user["teacher_id"],
            "name": user["name"],
            "mandal": user["mandal"],
        }
    elif req.role == "meo":
        user = conn.execute(
            "SELECT * FROM meos WHERE meo_id = ? AND password = ?",
            (req.user_id, hashed)
        ).fetchone()
        if not user:
            conn.close()
            raise HTTPException(status_code=401, detail="Invalid credentials")
        conn.close()
        return {
            "success": True,
            "role": "meo",
            "user_id": user["meo_id"],
            "name": user["name"],
            "assigned_mandal": user["assigned_mandal"],
        }
    else:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid role")


# ── Teacher Endpoints ────────────────────────────────────────────────────────

@app.get("/teacher/{teacher_id}")
def get_teacher_profile(teacher_id: str):
    conn = get_db()
    teacher = conn.execute(
        "SELECT * FROM teachers WHERE teacher_id = ?", (teacher_id,)
    ).fetchone()
    if not teacher:
        conn.close()
        raise HTTPException(status_code=404, detail="Teacher not found")

    school = conn.execute(
        "SELECT * FROM schools WHERE school_id = ?", (teacher["current_school"],)
    ).fetchone()

    t = dict(teacher)
    refresh_years_of_service(conn, t)
    refresh_years_in_current_school(conn, t)
    conn.close()

    del t["password"]
    t["school_name"] = school["school_name"] if school else "N/A"
    t["school_district"] = school["district"] if school else "N/A"
    t["school_student_strength"] = school["student_strength"] if school else 0
    t["school_teacher_count"] = school["current_teacher_count"] if school else 0
    return t


def calculate_years_from_date(date_str: str) -> int:
    try:
        if not date_str:
            return 0
        start = datetime.strptime(date_str, "%Y-%m-%d")
        return max(0, (datetime.now() - start).days // 365)
    except Exception:
        return 0


def refresh_years_of_service(conn, teacher: dict):
    if not teacher:
        return 0

    years = teacher.get("years_of_service", 0)
    appointment_date = teacher.get("date_of_first_appointment")
    if appointment_date:
        years = calculate_years_from_date(appointment_date)
        if years != teacher.get("years_of_service", 0):
            conn.execute(
                "UPDATE teachers SET years_of_service = ? WHERE teacher_id = ?",
                (years, teacher["teacher_id"])
            )
            conn.commit()
            teacher["years_of_service"] = years
    return years


def refresh_years_in_current_school(conn, teacher: dict):
    """
    Calculate years in current school using date_joined_current_school where available.
    Fallback to last_transfer_date when join date is absent. Otherwise use years_of_service.
    """
    if not teacher:
        return 0

    join_date = teacher.get("date_joined_current_school")
    if join_date:
        elapsed = calculate_years_from_date(join_date)
        if elapsed != teacher.get("years_in_current_school", 0):
            conn.execute(
                "UPDATE teachers SET years_in_current_school = ? WHERE teacher_id = ?",
                (elapsed, teacher["teacher_id"])
            )
            conn.commit()
            teacher["years_in_current_school"] = elapsed
        return elapsed

    if teacher.get("last_transfer_date"):
        try:
            last = datetime.strptime(teacher["last_transfer_date"], "%Y-%m-%d")
            elapsed = (datetime.now() - last).days // 365
            if elapsed != teacher.get("years_in_current_school", 0):
                conn.execute(
                    "UPDATE teachers SET years_in_current_school = ? WHERE teacher_id = ?",
                    (elapsed, teacher["teacher_id"])
                )
                conn.commit()
                teacher["years_in_current_school"] = elapsed
            return elapsed
        except Exception:
            pass

    teacher["years_in_current_school"] = teacher.get("years_of_service", 0)
    return teacher.get("years_of_service", 0)


def check_transfer_cooling_period(teacher: dict) -> tuple:
    """
    Check if teacher meets 180-day minimum service period in current school.
    Returns: (is_eligible: bool, days_remaining: int, reason: str)
    """
    COOLING_PERIOD_DAYS = 180
    
    if not teacher or not teacher.get("last_transfer_date"):
        # No transfer history, eligible for transfer
        return True, 0, ""
    
    try:
        last_transfer = datetime.strptime(teacher["last_transfer_date"], "%Y-%m-%d")
        days_since_transfer = (datetime.now() - last_transfer).days
        
        if days_since_transfer < COOLING_PERIOD_DAYS:
            days_remaining = COOLING_PERIOD_DAYS - days_since_transfer
            reason = f"Recently transferred. Minimum service period of 180 days in the current school has not been completed. Days remaining: {days_remaining}."
            return False, days_remaining, reason
        
        return True, 0, ""
    except Exception:
        # Invalid date format, allow transfer
        return True, 0, ""


@app.post("/predict_transfer")
def predict_transfer(req: PredictRequest):
    import traceback, os
    try:
        conn = get_db()
        teacher = conn.execute(
            "SELECT * FROM teachers WHERE teacher_id = ?", (req.teacher_id,)
        ).fetchone()
        if not teacher:
            conn.close()
            raise HTTPException(status_code=404, detail="Teacher not found")

        t = dict(teacher)
        refresh_years_of_service(conn, t)
        refresh_years_in_current_school(conn, t)
        conn.close()

        # Check cooling-period eligibility first
        is_eligible, days_remaining, cooling_period_reason = check_transfer_cooling_period(t)
        
        if not is_eligible:
            # Teacher is in cooling period - NOT eligible for transfer
            return {
                "teacher_id": req.teacher_id,
                "name": t["name"],
                "subject": t["subject"],
                "transfer_recommended": False,
                "transfer_eligible": False,
                "eligibility_reason": cooling_period_reason,
                "confidence": 0.0,
                "priority_score": 0,
                "reasons": [cooling_period_reason],
                "details": {
                    "years_of_service": t["years_of_service"],
                    "transfer_request": t["transfer_request"],
                    "medical_condition": t["medical_condition"],
                    "spouse_distance": t["spouse_distance"],
                    "promotion_due": t["promotion_due"],
                    "years_in_current_school": t.get("years_in_current_school", 0),
                    "last_transfer_date": t.get("last_transfer_date"),
                    "days_since_last_transfer": (datetime.now() - datetime.strptime(t["last_transfer_date"], "%Y-%m-%d")).days if t.get("last_transfer_date") else None,
                }
            }
        
        priority = compute_priority(t)
        reasons = get_transfer_reasons(t)
        min_tenure_met = t.get("years_in_current_school", 0) >= MIN_YEARS_IN_CURRENT_SCHOOL_FOR_TRANSFER

        if not min_tenure_met:
            tenure_warning = f"Current school tenure is {t.get('years_in_current_school', 0)} year(s), below the required {MIN_YEARS_IN_CURRENT_SCHOOL_FOR_TRANSFER} years."
            if tenure_warning not in reasons:
                reasons.append(tenure_warning)

        prediction = False
        confidence = 0.0

        if model and le_subject and feature_cols:
            # build feature vector including school-level features
            conn2 = get_db()
            school = conn2.execute("SELECT * FROM schools WHERE school_id = ?", (t.get('current_school'),)).fetchone()
            conn2.close()
            if school:
                school = dict(school)
            else:
                school = {}

            subj_vacancy = 0
            shortage = 0
            ratio = 0
            school_cat_enc = 0
            mandal_enc = 0
            district_enc = 0

            if school:
                try:
                    vac = json.loads(school['subject_wise_vacancy'] or '{}')
                    subj_vacancy = int(vac.get(t.get('subject'), 0))
                except Exception:
                    subj_vacancy = 0
                shortage = max(0, (school.get('required_teacher_count') or 0) - (school.get('current_teacher_count') or 0))
                ratio = school.get('student_teacher_ratio') or 0
                # encode school category
                st = school.get('student_strength') or 0
                if st < 300:
                    cat = 'small'
                elif st < 800:
                    cat = 'medium'
                else:
                    cat = 'large'
                try:
                    if le_schoolcat:
                        school_cat_enc = int(le_schoolcat.transform([cat])[0])
                except Exception:
                    school_cat_enc = 0
                try:
                    if le_mandal:
                        mandal_enc = int(le_mandal.transform([school.get('mandal') or t.get('mandal')])[0])
                except Exception:
                    mandal_enc = 0
                try:
                    if le_district:
                        district_enc = int(le_district.transform([school.get('district') or t.get('current_district')])[0])
                except Exception:
                    district_enc = 0

            try:
                subj_enc = int(le_subject.transform([t.get('subject')])[0])
            except Exception:
                subj_enc = 0

            feat_map = {
                'years_of_service': t.get('years_of_service', 0),
                'years_in_current_school': t.get('years_in_current_school', 0),
                'transfer_request': t.get('transfer_request', 0),
                'medical_condition': t.get('medical_condition', 0),
                'spouse_distance': t.get('spouse_distance', 0),
                'promotion_due': t.get('promotion_due', 0),
                'subject_encoded': subj_enc,
                'subject_vacancy': subj_vacancy,
                'shortage': shortage,
                'student_teacher_ratio': ratio,
                'school_cat_enc': school_cat_enc,
                'mandal_enc': mandal_enc,
                'district_enc': district_enc,
            }

            X = pd.DataFrame([[feat_map.get(c, 0) for c in feature_cols]], columns=feature_cols)
            pred = int(model.predict(X)[0])
            proba = model.predict_proba(X)[0]
            prediction = bool(pred)
            # calibrate probability to realistic range (avoid 0/100)
            raw_prob = float(proba[pred])
            calibrated = max(0.01, min(0.99, raw_prob))
            confidence = round(calibrated * 100, 1)
            # map extreme confidences away from absolute 100
            if confidence >= 99.5:
                confidence = 95.0
            # Add explainability reasons from features
            try:
                if subj_vacancy > 0:
                    reasons.append(f"Subject vacancy in current school: {subj_vacancy} opening(s)")
                if shortage > 0:
                    reasons.append(f"School has a shortage of {shortage} teacher(s)")
                if ratio and ratio > 35:
                    reasons.append(f"High student-teacher ratio ({ratio}:1) at current school")
                if t.get('years_in_current_school', 0) >= MIN_YEARS_IN_CURRENT_SCHOOL_FOR_TRANSFER:
                    reasons.append(f"Required tenure completed: {t.get('years_in_current_school', 0)} year(s) at current school")
                if t.get('medical_condition') == 1:
                    reasons.append('Medical grounds reported')
                if t.get('spouse_distance', 0) > 200:
                    reasons.append(f"Spouse located {t.get('spouse_distance')} km away")
            except Exception:
                pass

            # Add top contributing features from model feature importance (audit)
            try:
                metrics_path = os.path.join(MODEL_DIR, 'metrics.json')
                if os.path.exists(metrics_path):
                    m = json.load(open(metrics_path))
                    fi = m.get('feature_importance') or {}
                else:
                    fi = dict(zip(feature_cols, model.feature_importances_.tolist()))
                topk = sorted(fi.items(), key=lambda x: x[1], reverse=True)[:3]
                contrib = ', '.join([f"{k}" for k, _ in topk])
                reasons.append(f"Top factors: {contrib}")
            except Exception:
                pass
        else:
            prediction = priority >= 45
            confidence = min(priority + 20, 95)

        # Enforce minimum tenure rule: generally do not recommend transfers for low-tenure teachers
        if not min_tenure_met:
            # allow exceptions for medical or spouse relocation or explicit transfer request
            if not (t.get('medical_condition') == 1 or t.get('spouse_distance', 0) > 200 or t.get('transfer_request') == 1):
                prediction = False
                confidence = min(confidence, 40.0)
                if "Current school tenure" not in " ".join(reasons):
                    reasons.append(f"Current school tenure is {t.get('years_in_current_school', 0)} year(s), below the required {MIN_YEARS_IN_CURRENT_SCHOOL_FOR_TRANSFER} years.")

        return {
            "teacher_id": req.teacher_id,
            "name": t["name"],
            "subject": t["subject"],
            "transfer_recommended": prediction,
            "transfer_eligible": True,
            "confidence": confidence,
            "priority_score": priority,
        "reasons": reasons,
        "details": {
            "years_of_service": t["years_of_service"],
            "date_of_first_appointment": t.get("date_of_first_appointment"),
            "date_joined_current_school": t.get("date_joined_current_school"),
            "transfer_request": t["transfer_request"],
            "medical_condition": t["medical_condition"],
            "spouse_distance": t["spouse_distance"],
            "promotion_due": t["promotion_due"],
            "years_in_current_school": t.get("years_in_current_school", 0),
            "last_transfer_date": t.get("last_transfer_date"),
            "days_since_last_transfer": (datetime.now() - datetime.strptime(t["last_transfer_date"], "%Y-%m-%d")).days if t.get("last_transfer_date") else None,
        }
    }
    except Exception as e:
        import traceback, os
        os.makedirs(os.path.join(os.path.dirname(__file__), "logs"), exist_ok=True)
        with open(os.path.join(os.path.dirname(__file__), "logs", "predict_error.log"), "a", encoding="utf-8") as fh:
            fh.write("--- PREDICT TRANSFER EXCEPTION ---\n")
            traceback.print_exc(file=fh)
            fh.write("\n")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recommend_school")
def recommend_school(req: RecommendSchoolRequest):
    conn = get_db()
    teacher = conn.execute(
        "SELECT * FROM teachers WHERE teacher_id = ?", (req.teacher_id,)
    ).fetchone()
    if not teacher:
        conn.close()
        raise HTTPException(status_code=404, detail="Teacher not found")

    t = dict(teacher)
    subject = t["subject"]
    current_school = t["current_school"]

    schools = conn.execute(
        "SELECT * FROM schools WHERE school_id != ?", (current_school,)
    ).fetchall()
    conn.close()

    results = []
    for s in schools:
        sd = dict(s)
        shortage = sd["required_teacher_count"] - sd["current_teacher_count"]
        if shortage < 0:
            continue

        subj_vacancy = 0
        try:
            vac = json.loads(sd["subject_wise_vacancy"])
            subj_vacancy = vac.get(subject, 0)
        except Exception:
            pass

        score = shortage * 2 + subj_vacancy * 5 - sd["student_teacher_ratio"] * 0.1
        sd["shortage"] = shortage
        sd["subject_vacancy"] = subj_vacancy
        sd["allocation_score"] = round(score, 2)
        results.append(sd)

    results.sort(key=lambda x: x["allocation_score"], reverse=True)
    top = results[:5]

    return {
        "teacher_id": req.teacher_id,
        "name": t["name"],
        "subject": subject,
        "recommended_schools": top
    }


@app.post("/apply_transfer")
def apply_transfer(req: ApplyTransferRequest):
    conn = get_db()
    teacher = conn.execute(
        "SELECT * FROM teachers WHERE teacher_id = ?", (req.teacher_id,)
    ).fetchone()
    if not teacher:
        conn.close()
        raise HTTPException(status_code=404, detail="Teacher not found")

    existing = conn.execute(
        "SELECT * FROM transfer_requests WHERE teacher_id = ? AND status = 'Pending'",
        (req.teacher_id,)
    ).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="You already have a pending transfer request")

    school = conn.execute(
        "SELECT * FROM schools WHERE school_id = ?", (req.requested_school,)
    ).fetchone()
    if not school:
        conn.close()
        raise HTTPException(status_code=404, detail="Requested school not found")

    t = dict(teacher)
    priority = compute_priority(t)
    request_id = f"REQ{uuid.uuid4().hex[:8].upper()}"
    now = ist_now_str()

    # use requested school's mandal and assign MEO responsible for that mandal
    mandal_for_req = school["mandal"]
    assigned_meo_row = conn.execute("SELECT meo_id FROM meos WHERE assigned_mandal = ?", (mandal_for_req,)).fetchone()
    assigned_meo = assigned_meo_row["meo_id"] if assigned_meo_row else None

    conn.execute(
        "INSERT INTO transfer_requests (request_id, teacher_id, current_school, requested_school, mandal, request_date, transfer_reason, priority_score, status, assigned_meo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)",
        (request_id, req.teacher_id, t["current_school"], req.requested_school, mandal_for_req, now, req.transfer_reason, priority, assigned_meo)
    )

    conn.execute(
        "UPDATE teachers SET transfer_status = 'Pending', requested_school = ? WHERE teacher_id = ?",
        (req.requested_school, req.teacher_id)
    )
    conn.commit()
    conn.close()

    add_notification(
        req.teacher_id,
        f"Your transfer request ({request_id}) has been submitted and is pending review.",
        "info"
    )

    # create MEO notification so the MEO UI can show an alert
    if assigned_meo:
        conn2 = get_db()
        conn2.execute(
            "INSERT INTO meo_notifications (meo_id, message, read, created_at) VALUES (?, ?, 0, ?)",
            (assigned_meo, f"New transfer request {request_id} for school {req.requested_school}", ist_now_str())
        )
        conn2.commit()
        conn2.close()

    return {"success": True, "request_id": request_id, "message": "Transfer request submitted successfully"}


@app.get("/transfer_history/{teacher_id}")
def transfer_history(teacher_id: str):
    conn = get_db()
    requests = conn.execute(
        "SELECT * FROM transfer_requests WHERE teacher_id = ? ORDER BY request_date DESC",
        (teacher_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in requests]


@app.get("/transfer_history_records/{teacher_id}")
def transfer_history_records(teacher_id: str):
    conn = get_db()
    records = conn.execute(
        "SELECT * FROM transfer_history WHERE teacher_id = ? ORDER BY transfer_date DESC",
        (teacher_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in records]


@app.get("/notifications/{teacher_id}")
def get_notifications(teacher_id: str):
    conn = get_db()
    notifs = conn.execute(
        "SELECT * FROM notifications WHERE teacher_id = ? ORDER BY created_at DESC",
        (teacher_id,)
    ).fetchall()
    conn.close()
    return [dict(n) for n in notifs]


@app.put("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int):
    conn = get_db()
    conn.execute("UPDATE notifications SET read = 1 WHERE id = ?", (notification_id,))
    conn.commit()
    conn.close()
    return {"success": True}


# ── MEO Endpoints ────────────────────────────────────────────────────────────

@app.get("/meo/{meo_id}/dashboard")
def meo_dashboard(meo_id: str):
    conn = get_db()
    meo = conn.execute("SELECT * FROM meos WHERE meo_id = ?", (meo_id,)).fetchone()
    if not meo:
        conn.close()
        raise HTTPException(status_code=404, detail="MEO not found")

    mandal = meo["assigned_mandal"]

    schools = conn.execute(
        "SELECT * FROM schools WHERE mandal = ?", (mandal,)
    ).fetchall()

    teachers_rows = conn.execute(
        "SELECT * FROM teachers WHERE mandal = ?", (mandal,)
    ).fetchall()

    teachers = []
    for t in teachers_rows:
        teacher = dict(t)
        refresh_years_in_current_school(conn, teacher)
        teachers.append(teacher)

    pending = conn.execute(
        "SELECT * FROM transfer_requests WHERE mandal = ? AND status = 'Pending' ORDER BY priority_score DESC",
        (mandal,)
    ).fetchall()

    approved = conn.execute(
        "SELECT * FROM transfer_requests WHERE mandal = ? AND status = 'Approved' ORDER BY approval_date DESC",
        (mandal,)
    ).fetchall()

    rejected = conn.execute(
        "SELECT * FROM transfer_requests WHERE mandal = ? AND status = 'Rejected' ORDER BY approval_date DESC",
        (mandal,)
    ).fetchall()
    conn.close()

    schools_list = [dict(s) for s in schools]
    teachers_list = [dict(t) for t in teachers]

    total_teachers = len(teachers_list)
    total_schools = len(schools_list)
    shortage_schools = sum(1 for s in schools_list if s["current_teacher_count"] < s["required_teacher_count"])
    surplus_schools = sum(1 for s in schools_list if s["current_teacher_count"] > s["required_teacher_count"])

    subject_dist = {}
    for t in teachers_list:
        subject_dist[t["subject"]] = subject_dist.get(t["subject"], 0) + 1

    avg_ratio = round(
        sum(s["student_teacher_ratio"] for s in schools_list) / max(len(schools_list), 1), 2
    )

    return {
        "meo_name": meo["name"],
        "mandal": mandal,
        "total_teachers": total_teachers,
        "total_schools": total_schools,
        "shortage_schools": shortage_schools,
        "surplus_schools": surplus_schools,
        "avg_student_teacher_ratio": avg_ratio,
        "pending_requests": [dict(r) for r in pending],
        "approved_requests": [dict(r) for r in approved],
        "rejected_requests": [dict(r) for r in rejected],
        "subject_distribution": subject_dist,
        "schools": schools_list,
        "teachers": teachers_list,
    }


@app.get("/meo/{meo_id}/schools")
def meo_schools(meo_id: str):
    conn = get_db()
    meo = conn.execute("SELECT * FROM meos WHERE meo_id = ?", (meo_id,)).fetchone()
    if not meo:
        conn.close()
        raise HTTPException(status_code=404, detail="MEO not found")

    schools = conn.execute(
        "SELECT * FROM schools WHERE mandal = ?", (meo["assigned_mandal"],)
    ).fetchall()
    conn.close()
    return [dict(s) for s in schools]


@app.get("/meo/{meo_id}/notifications")
def meo_notifications(meo_id: str):
    conn = get_db()
    notifs = conn.execute(
        "SELECT * FROM meo_notifications WHERE meo_id = ? ORDER BY created_at DESC",
        (meo_id,)
    ).fetchall()
    conn.close()
    return [dict(n) for n in notifs]


@app.post("/approve_transfer")
def approve_transfer(req: ApproveTransferRequest):
    conn = get_db()
    request = conn.execute(
        "SELECT * FROM transfer_requests WHERE request_id = ?", (req.request_id,)
    ).fetchone()
    if not request:
        conn.close()
        raise HTTPException(status_code=404, detail="Transfer request not found")

    if request["status"] != "Pending":
        conn.close()
        raise HTTPException(status_code=400, detail="Request is not pending")

    meo = conn.execute("SELECT * FROM meos WHERE meo_id = ?", (req.meo_id,)).fetchone()
    if not meo:
        conn.close()
        raise HTTPException(status_code=404, detail="MEO not found")

    if meo["assigned_mandal"] != request["mandal"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized for this mandal")

    now = ist_now_str()
    teacher_id = request["teacher_id"]
    old_school = request["current_school"]
    new_school = request["requested_school"]

    # Update request status
    conn.execute(
        "UPDATE transfer_requests SET status = 'Approved', approval_date = ? WHERE request_id = ?",
        (now, req.request_id)
    )

    new_school_record = conn.execute(
        "SELECT * FROM schools WHERE school_id = ?", (new_school,)
    ).fetchone()
    if not new_school_record:
        conn.close()
        raise HTTPException(status_code=404, detail="Requested school not found")

    new_mandal = new_school_record["mandal"]
    new_district = new_school_record["district"]
    assigned_meo_record = conn.execute(
        "SELECT meo_id FROM meos WHERE assigned_mandal = ?", (new_mandal,)
    ).fetchone()
    new_assigned_meo = assigned_meo_record["meo_id"] if assigned_meo_record else meo["meo_id"]

    conn.execute(
        """UPDATE teachers SET current_school = ?, current_mandal = ?, current_district = ?, mandal = ?, assigned_meo = ?, transfer_status = 'Approved',
           requested_school = NULL, transfer_request = 0,
           last_transfer_date = ?, years_in_current_school = 0, reapply_eligible = 0,
           transfer_attempt_count = transfer_attempt_count + 1
           WHERE teacher_id = ?""",
        (new_school, new_mandal, new_district, new_mandal, new_assigned_meo, now, teacher_id)
    )

    conn.execute(
        "INSERT INTO transfer_history (teacher_id, request_id, old_school, new_school, transfer_date, transfer_reason, approved_by, priority_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (teacher_id, req.request_id, old_school, new_school, now, request["transfer_reason"], req.meo_id, request["priority_score"])
    )

    # Update old school count
    conn.execute(
        """UPDATE schools SET current_teacher_count = MAX(0, current_teacher_count - 1)
           WHERE school_id = ?""",
        (old_school,)
    )

    # Update new school count
    conn.execute(
        "UPDATE schools SET current_teacher_count = current_teacher_count + 1 WHERE school_id = ?",
        (new_school,)
    )

    # Recalculate ratios
    for sid in [old_school, new_school]:
        s = conn.execute("SELECT * FROM schools WHERE school_id = ?", (sid,)).fetchone()
        if s:
            ratio = round(s["student_strength"] / max(s["current_teacher_count"], 1), 2)
            conn.execute(
                "UPDATE schools SET student_teacher_ratio = ? WHERE school_id = ?",
                (ratio, sid)
            )

    conn.commit()
    conn.close()

    pdf_path = generate_transfer_pdf(req.request_id)

    add_notification(
        teacher_id,
        f"Your transfer request ({req.request_id}) has been APPROVED. Transfer order is ready for download.",
        "success"
    )

    return {
        "success": True,
        "message": "Transfer approved successfully",
        "pdf_path": pdf_path
    }


@app.post("/reject_transfer")
def reject_transfer(req: RejectTransferRequest):
    conn = get_db()
    request = conn.execute(
        "SELECT * FROM transfer_requests WHERE request_id = ?", (req.request_id,)
    ).fetchone()
    if not request:
        conn.close()
        raise HTTPException(status_code=404, detail="Transfer request not found")

    if request["status"] != "Pending":
        conn.close()
        raise HTTPException(status_code=400, detail="Request is not pending")

    meo = conn.execute("SELECT * FROM meos WHERE meo_id = ?", (req.meo_id,)).fetchone()
    if not meo:
        conn.close()
        raise HTTPException(status_code=404, detail="MEO not found")

    if meo["assigned_mandal"] != request["mandal"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized for this mandal")

    now = ist_now_str()
    conn.execute(
        """UPDATE transfer_requests SET status = 'Rejected', approval_date = ?,
           rejection_reason = ? WHERE request_id = ?""",
        (now, req.rejection_reason, req.request_id)
    )

    conn.execute(
        """UPDATE teachers SET transfer_status = 'Rejected', requested_school = NULL,
           transfer_attempt_count = transfer_attempt_count + 1
           WHERE teacher_id = ?""",
        (request["teacher_id"],)
    )
    conn.commit()
    conn.close()

    add_notification(
        request["teacher_id"],
        f"Your transfer request ({req.request_id}) has been REJECTED. Reason: {req.rejection_reason}",
        "error"
    )

    return {"success": True, "message": "Transfer rejected"}


# ── Dashboard Stats ──────────────────────────────────────────────────────────

@app.get("/dashboard_stats")
def dashboard_stats():
    conn = get_db()
    teachers = conn.execute("SELECT * FROM teachers").fetchall()
    schools = conn.execute("SELECT * FROM schools").fetchall()
    requests = conn.execute("SELECT * FROM transfer_requests").fetchall()
    conn.close()

    total_teachers = len(teachers)
    total_schools = len(schools)
    pending_requests = sum(1 for r in requests if r["status"] == "Pending")
    approved_requests = sum(1 for r in requests if r["status"] == "Approved")
    rejected_requests = sum(1 for r in requests if r["status"] == "Rejected")

    shortage = sum(1 for s in schools if compute_shortage_for_school(dict(s)) > 0)
    surplus = sum(1 for s in schools if s["current_teacher_count"] > s["required_teacher_count"])
    avg_ratio = round(sum(s["student_teacher_ratio"] for s in schools) / max(len(schools), 1), 2)

    subject_dist = {}
    for t in teachers:
        subject_dist[t["subject"]] = subject_dist.get(t["subject"], 0) + 1

    mandal_dist = {}
    for t in teachers:
        mandal_dist[t["mandal"]] = mandal_dist.get(t["mandal"], 0) + 1

    metrics = {}
    metrics_path = os.path.join(MODEL_DIR, "metrics.json")
    if os.path.exists(metrics_path):
        with open(metrics_path) as f:
            metrics = json.load(f)

    return {
        "total_teachers": total_teachers,
        "total_schools": total_schools,
        "pending_requests": pending_requests,
        "approved_requests": approved_requests,
        "rejected_requests": rejected_requests,
        "shortage_schools": shortage,
        "surplus_schools": surplus,
        "avg_student_teacher_ratio": avg_ratio,
        "subject_distribution": subject_dist,
        "mandal_distribution": mandal_dist,
        "model_accuracy": metrics.get("accuracy", 0),
    }


@app.get("/download_transfer_pdf/{request_id}")
def download_pdf(request_id: str):
    conn = get_db()
    req = conn.execute(
        "SELECT * FROM transfer_requests WHERE request_id = ?", (request_id,)
    ).fetchone()
    conn.close()

    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req["status"] != "Approved":
        raise HTTPException(status_code=400, detail="Transfer not yet approved")

    pdf_path = req["generated_pdf_path"]
    if not pdf_path or not os.path.exists(pdf_path):
        pdf_path = generate_transfer_pdf(request_id)

    if not pdf_path or not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF not found")

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"transfer_order_{request_id}.pdf"
    )


@app.get("/schools")
def list_schools(mandal: Optional[str] = None):
    conn = get_db()
    if mandal:
        schools = conn.execute("SELECT * FROM schools WHERE mandal = ?", (mandal,)).fetchall()
    else:
        schools = conn.execute("SELECT * FROM schools").fetchall()
    conn.close()
    return [dict(s) for s in schools]


@app.get("/workforce_stats")
def workforce_stats():
    conn = get_db()
    schools = conn.execute("SELECT * FROM schools").fetchall()
    teachers = conn.execute("SELECT * FROM teachers").fetchall()
    conn.close()

    schools_list = [dict(s) for s in schools]
    teachers_list = [dict(t) for t in teachers]

    mandal_stats = {}
    for s in schools_list:
        m = s["mandal"]
        if m not in mandal_stats:
            mandal_stats[m] = {
                "mandal": m, "district": s["district"],
                "schools": 0, "teachers": 0, "required": 0,
                "shortage": 0, "surplus": 0
            }
        mandal_stats[m]["schools"] += 1
        mandal_stats[m]["teachers"] += s["current_teacher_count"]
        mandal_stats[m]["required"] += s["required_teacher_count"]
        diff = s["current_teacher_count"] - s["required_teacher_count"]
        if compute_shortage_for_school(s) > 0:
            mandal_stats[m]["shortage"] += 1
        elif diff > 0:
            mandal_stats[m]["surplus"] += 1

    for m in mandal_stats:
        mandal_stats[m]["gap"] = mandal_stats[m]["required"] - mandal_stats[m]["teachers"]

    top_shortage = sorted(schools_list, key=lambda s: s["current_teacher_count"] - s["required_teacher_count"])[:10]
    top_surplus = sorted(schools_list, key=lambda s: s["current_teacher_count"] - s["required_teacher_count"], reverse=True)[:10]

    return {
        "mandal_stats": list(mandal_stats.values()),
        "top_shortage_schools": top_shortage,
        "top_surplus_schools": top_surplus,
        "total_teachers": len(teachers_list),
        "total_schools": len(schools_list),
    }


# ── Appeal / Re-Apply Endpoints ──────────────────────────────────────────────

MIN_WAITING_DAYS = 180  # 6 months minimum waiting period


@app.get("/check_reapply_eligibility/{teacher_id}")
def check_reapply_eligibility(teacher_id: str):
    conn = get_db()
    teacher = conn.execute(
        "SELECT * FROM teachers WHERE teacher_id = ?", (teacher_id,)
    ).fetchone()
    if not teacher:
        conn.close()
        raise HTTPException(status_code=404, detail="Teacher not found")

    # Check for pending transfer or appeal
    pending_transfer = conn.execute(
        "SELECT * FROM transfer_requests WHERE teacher_id = ? AND status = 'Pending'",
        (teacher_id,)
    ).fetchone()
    pending_appeal = conn.execute(
        "SELECT * FROM appeals WHERE teacher_id = ? AND status = 'Pending'",
        (teacher_id,)
    ).fetchone()

    # Get rejected requests for appeal eligibility
    rejected_requests = conn.execute(
        "SELECT * FROM transfer_requests WHERE teacher_id = ? AND status = 'Rejected' ORDER BY request_date DESC",
        (teacher_id,)
    ).fetchall()
    conn.close()

    t = dict(teacher)
    last_transfer = t.get("last_transfer_date")
    attempt_count = t.get("transfer_attempt_count", 0)
    has_medical = t.get("medical_condition", 0) == 1
    spouse_far = t.get("spouse_distance", 0) > 200

    # Calculate waiting period
    eligible = True
    days_remaining = 0
    can_bypass = False
    bypass_reason = ""

    if pending_transfer:
        eligible = False
        reason = "You have a pending transfer request"
    elif pending_appeal:
        eligible = False
        reason = "You have a pending appeal"
    elif last_transfer:
        from datetime import datetime as dt
        last_date = dt.strptime(last_transfer, "%Y-%m-%d")
        days_since = (dt.now() - last_date).days
        days_remaining = max(0, MIN_WAITING_DAYS - days_since)

        if days_remaining > 0:
            eligible = False
            reason = f"Minimum waiting period not completed. {days_remaining} days remaining."
            if has_medical:
                can_bypass = True
                bypass_reason = "Medical emergency — eligible for waiting period bypass"
            elif spouse_far:
                can_bypass = True
                bypass_reason = "Spouse relocation (>200km) — eligible for waiting period bypass"
        else:
            reason = "Eligible for reapplication"
    else:
        reason = "Eligible for transfer application"

    return {
        "teacher_id": teacher_id,
        "eligible": eligible,
        "can_bypass_waiting": can_bypass,
        "bypass_reason": bypass_reason,
        "reason": reason,
        "days_remaining": days_remaining,
        "last_transfer_date": last_transfer,
        "transfer_attempt_count": attempt_count,
        "has_rejected_requests": len(rejected_requests) > 0,
        "rejected_requests": [dict(r) for r in rejected_requests],
        "has_medical_condition": has_medical,
        "has_spouse_relocation": spouse_far,
    }


@app.post("/submit_appeal")
def submit_appeal(req: SubmitAppealRequest):
    conn = get_db()
    teacher = conn.execute(
        "SELECT * FROM teachers WHERE teacher_id = ?", (req.teacher_id,)
    ).fetchone()
    if not teacher:
        conn.close()
        raise HTTPException(status_code=404, detail="Teacher not found")

    # Verify the original request exists and was rejected
    original = conn.execute(
        "SELECT * FROM transfer_requests WHERE request_id = ?", (req.original_request_id,)
    ).fetchone()
    if not original:
        conn.close()
        raise HTTPException(status_code=404, detail="Original transfer request not found")
    if original["status"] != "Rejected":
        conn.close()
        raise HTTPException(status_code=400, detail="Can only appeal rejected transfer requests")
    if original["teacher_id"] != req.teacher_id:
        conn.close()
        raise HTTPException(status_code=403, detail="This request does not belong to you")

    # Check for existing pending appeal on same request
    existing = conn.execute(
        "SELECT * FROM appeals WHERE original_request_id = ? AND status = 'Pending'",
        (req.original_request_id,)
    ).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="An appeal is already pending for this request")

    t = dict(teacher)
    appeal_id = f"APL{uuid.uuid4().hex[:8].upper()}"
    now = ist_now_str()

    conn.execute(
        """INSERT INTO appeals
        (appeal_id, teacher_id, original_request_id, appeal_reason, appeal_type,
         is_emergency, status, submitted_date, assigned_meo, mandal)
        VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?)""",
        (appeal_id, req.teacher_id, req.original_request_id, req.appeal_reason,
         req.appeal_type, 1 if req.is_emergency else 0, now,
         t["assigned_meo"], t["mandal"])
    )
    conn.commit()
    conn.close()

    add_notification(
        req.teacher_id,
        f"Your appeal ({appeal_id}) for request {req.original_request_id} has been submitted for review.",
        "info"
    )

    return {
        "success": True,
        "appeal_id": appeal_id,
        "message": "Appeal submitted successfully"
    }


@app.post("/reapply_transfer")
def reapply_transfer(req: ReapplyTransferRequest):
    conn = get_db()
    teacher = conn.execute(
        "SELECT * FROM teachers WHERE teacher_id = ?", (req.teacher_id,)
    ).fetchone()
    if not teacher:
        conn.close()
        raise HTTPException(status_code=404, detail="Teacher not found")

    t = dict(teacher)

    # Check for pending request
    pending = conn.execute(
        "SELECT * FROM transfer_requests WHERE teacher_id = ? AND status = 'Pending'",
        (req.teacher_id,)
    ).fetchone()
    if pending:
        conn.close()
        raise HTTPException(status_code=400, detail="You already have a pending transfer request")

    # Check waiting period
    last_transfer = t.get("last_transfer_date")
    has_medical = t.get("medical_condition", 0) == 1
    spouse_far = t.get("spouse_distance", 0) > 200

    if last_transfer:
        from datetime import datetime as dt
        last_date = dt.strptime(last_transfer, "%Y-%m-%d")
        days_since = (dt.now() - last_date).days
        if days_since < MIN_WAITING_DAYS and not (has_medical or spouse_far):
            conn.close()
            raise HTTPException(
                status_code=400,
                detail=f"Minimum waiting period not completed. {MIN_WAITING_DAYS - days_since} days remaining."
            )

    # Verify school exists
    school = conn.execute(
        "SELECT * FROM schools WHERE school_id = ?", (req.requested_school,)
    ).fetchone()
    if not school:
        conn.close()
        raise HTTPException(status_code=404, detail="Requested school not found")

    priority = compute_priority(t)
    request_id = f"REQ{uuid.uuid4().hex[:8].upper()}"
    now = ist_now_str()

    # Use requested school's mandal and assign its MEO
    mandal_for_req = school["mandal"]
    assigned_meo_row = conn.execute("SELECT meo_id FROM meos WHERE assigned_mandal = ?", (mandal_for_req,)).fetchone()
    assigned_meo = assigned_meo_row["meo_id"] if assigned_meo_row else None

    conn.execute(
        "INSERT INTO transfer_requests (request_id, teacher_id, current_school, requested_school, mandal, request_date, transfer_reason, priority_score, status, assigned_meo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)",
        (request_id, req.teacher_id, t["current_school"], req.requested_school, mandal_for_req, now, req.transfer_reason, priority, assigned_meo)
    )

    conn.execute(
        "UPDATE teachers SET transfer_status = 'Pending', requested_school = ?, reapply_eligible = 0 WHERE teacher_id = ?",
        (req.requested_school, req.teacher_id)
    )
    conn.commit()
    conn.close()

    add_notification(
        req.teacher_id,
        f"Your re-application ({request_id}) has been submitted and is pending review.",
        "info"
    )

    if assigned_meo:
        conn2 = get_db()
        conn2.execute(
            "INSERT INTO meo_notifications (meo_id, message, read, created_at) VALUES (?, ?, 0, ?)",
            (assigned_meo, f"New re-application {request_id} for school {req.requested_school}", ist_now_str())
        )
        conn2.commit()
        conn2.close()

    return {"success": True, "request_id": request_id, "message": "Transfer re-application submitted successfully"}


@app.get("/appeals/{teacher_id}")
def get_teacher_appeals(teacher_id: str):
    conn = get_db()
    appeals = conn.execute(
        "SELECT * FROM appeals WHERE teacher_id = ? ORDER BY submitted_date DESC",
        (teacher_id,)
    ).fetchall()
    conn.close()
    return [dict(a) for a in appeals]


@app.post("/review_appeal")
def review_appeal(req: ReviewAppealRequest):
    conn = get_db()
    appeal = conn.execute(
        "SELECT * FROM appeals WHERE appeal_id = ?", (req.appeal_id,)
    ).fetchone()
    if not appeal:
        conn.close()
        raise HTTPException(status_code=404, detail="Appeal not found")

    if appeal["status"] != "Pending":
        conn.close()
        raise HTTPException(status_code=400, detail="Appeal is not pending")

    meo = conn.execute("SELECT * FROM meos WHERE meo_id = ?", (req.meo_id,)).fetchone()
    if not meo:
        conn.close()
        raise HTTPException(status_code=404, detail="MEO not found")

    if meo["assigned_mandal"] != appeal["mandal"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized for this mandal")

    now = ist_now_str()
    teacher_id = appeal["teacher_id"]
    original_request_id = appeal["original_request_id"]

    if req.action == "approve":
        # Approve the appeal: reopen the original transfer request
        conn.execute(
            "UPDATE appeals SET status = 'Approved', reviewed_date = ?, reviewed_by = ?, review_notes = ? WHERE appeal_id = ?",
            (now, req.meo_id, req.review_notes, req.appeal_id)
        )

        # Reset the original transfer request back to Pending
        conn.execute(
            "UPDATE transfer_requests SET status = 'Pending', rejection_reason = NULL, approval_date = NULL WHERE request_id = ?",
            (original_request_id,)
        )

        conn.execute(
            "UPDATE teachers SET transfer_status = 'Pending', reapply_eligible = 0 WHERE teacher_id = ?",
            (teacher_id,)
        )
        conn.commit()
        conn.close()

        add_notification(
            teacher_id,
            f"Your appeal ({req.appeal_id}) has been APPROVED. Your transfer request ({original_request_id}) has been reopened for review.",
            "success"
        )

        return {"success": True, "message": "Appeal approved — transfer request reopened"}

    elif req.action == "reject":
        conn.execute(
            "UPDATE appeals SET status = 'Rejected', reviewed_date = ?, reviewed_by = ?, review_notes = ? WHERE appeal_id = ?",
            (now, req.meo_id, req.review_notes, req.appeal_id)
        )

        conn.execute(
            "UPDATE teachers SET reapply_eligible = 1 WHERE teacher_id = ?",
            (teacher_id,)
        )
        conn.commit()
        conn.close()

        add_notification(
            teacher_id,
            f"Your appeal ({req.appeal_id}) has been REJECTED. Reason: {req.review_notes or 'No additional notes'}",
            "error"
        )

        return {"success": True, "message": "Appeal rejected"}
    else:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid action. Use 'approve' or 'reject'.")


@app.get("/meo/{meo_id}/appeals")
def meo_appeals(meo_id: str):
    conn = get_db()
    meo = conn.execute("SELECT * FROM meos WHERE meo_id = ?", (meo_id,)).fetchone()
    if not meo:
        conn.close()
        raise HTTPException(status_code=404, detail="MEO not found")

    mandal = meo["assigned_mandal"]
    pending = conn.execute(
        "SELECT * FROM appeals WHERE mandal = ? AND status = 'Pending' ORDER BY submitted_date DESC",
        (mandal,)
    ).fetchall()
    reviewed = conn.execute(
        "SELECT * FROM appeals WHERE mandal = ? AND status != 'Pending' ORDER BY reviewed_date DESC",
        (mandal,)
    ).fetchall()
    conn.close()

    return {
        "pending_appeals": [dict(a) for a in pending],
        "reviewed_appeals": [dict(a) for a in reviewed],
    }


@app.get("/test_credentials")
def test_credentials():
    """Returns sample credentials for testing/demo purposes"""
    conn = get_db()
    teachers = conn.execute("SELECT teacher_id FROM teachers LIMIT 5").fetchall()
    meos = conn.execute("SELECT meo_id, assigned_mandal FROM meos LIMIT 5").fetchall()
    conn.close()

    return {
        "teachers": [
            {"id": t["teacher_id"], "password": f"tch{t['teacher_id'][3:]}", "role": "teacher"}
            for t in teachers
        ],
        "meos": [
            {"id": m["meo_id"], "password": f"meo{m['meo_id'][3:]}", "role": "meo",
             "mandal": m["assigned_mandal"]}
            for m in meos
        ]
    }
