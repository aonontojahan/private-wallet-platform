import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, SUPPORT_EMAIL
from backend.auth import get_current_user
from backend.models import User, SupportMessage
from backend.database import get_db

router = APIRouter(prefix="/support", tags=["Support"])


class SupportRequest(BaseModel):
    subject: str = "Support Request"
    message: str


class PublicContactRequest(BaseModel):
    name: str
    email: str
    subject: str
    message: str


@router.post("/send", response_model=dict)
def send_support_email(
    payload: SupportRequest,
    current_user: User = Depends(get_current_user),
):
    if not SMTP_USER or not SMTP_PASSWORD or not SMTP_FROM:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service is not configured. Please set SMTP_USER, SMTP_PASSWORD, and SMTP_FROM in the environment.",
        )

    try:
        msg = MIMEMultipart()
        msg["From"] = SMTP_FROM
        msg["To"] = SUPPORT_EMAIL
        msg["Reply-To"] = current_user.email
        msg["Subject"] = f"[Support] {payload.subject}"

        body = f"""Support request from Private Wallet Platform

From User: {current_user.full_name} <{current_user.email}>
Subject: {payload.subject}

Message:
{payload.message}
"""
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, SUPPORT_EMAIL, msg.as_string())

        return {"message": "Email sent successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}",
        )


@router.post("/contact", response_model=dict)
def create_support_contact(
    payload: PublicContactRequest,
    db: Session = Depends(get_db),
):
    msg = SupportMessage(
        name=payload.name,
        email=payload.email,
        subject=payload.subject,
        message=payload.message,
    )
    db.add(msg)
    db.commit()
    return {"message": "Support message received. We will get back to you soon."}
