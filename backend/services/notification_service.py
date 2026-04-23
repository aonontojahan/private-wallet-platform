from sqlalchemy.orm import Session
from backend.models import Notification
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from backend.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
    )
    db.add(notification)
    db.flush()
    return notification


def send_email(to_email: str, subject: str, body: str) -> bool:
    """Send email via SMTP"""
    try:
        if not SMTP_USER or not SMTP_PASSWORD:
            print("WARNING: SMTP credentials not configured")
            return False
        
        msg = MIMEMultipart('alternative')
        msg['From'] = SMTP_FROM or SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Attach HTML body
        html_part = MIMEText(body, 'html')
        msg.attach(html_part)
        
        # Connect to SMTP server
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f"Email send failed: {str(e)}")
        return False
