from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from backend.database import get_db
from backend.auth import get_current_user
from backend.models import User
from backend.services.notification_service import send_email
from backend.config import SUPPORT_EMAIL

router = APIRouter()


class FeedbackRequest(BaseModel):
    rating: int  # 1-5 stars
    experience: str  # Text feedback about experience
    improvements: Optional[str] = ""  # What to improve


@router.post("/feedback", status_code=status.HTTP_200_OK)
def submit_feedback(
    feedback: FeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit feedback from logged-in user"""
    
    # Validate rating
    if feedback.rating < 1 or feedback.rating > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be between 1 and 5",
        )
    
    # Convert rating to text
    rating_text = {
        1: "⭐ - Very Poor",
        2: "⭐⭐ - Poor",
        3: "⭐⭐⭐ - Average",
        4: "⭐⭐⭐⭐ - Good",
        5: "⭐⭐⭐⭐⭐ - Excellent",
    }
    
    # Prepare email content
    subject = f"User Feedback - {rating_text[feedback.rating]}"
    
    email_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                New User Feedback
            </h2>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3 style="margin-top: 0; color: #1e293b;">User Information</h3>
                <p><strong>Name:</strong> {current_user.full_name or 'N/A'}</p>
                <p><strong>Email:</strong> {current_user.email}</p>
                <p><strong>User ID:</strong> {current_user.id}</p>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3 style="margin-top: 0; color: #92400e;">Rating</h3>
                <p style="font-size: 24px; margin: 10px 0;">{rating_text[feedback.rating]}</p>
            </div>
            
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3 style="margin-top: 0; color: #166534;">User Experience</h3>
                <p style="white-space: pre-wrap;">{feedback.experience}</p>
            </div>
            
            {f'''
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3 style="margin-top: 0; color: #991b1b;">Suggested Improvements</h3>
                <p style="white-space: pre-wrap;">{feedback.improvements}</p>
            </div>
            ''' if feedback.improvements else ''}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
                <p>This feedback was submitted from the Private Wallet Platform.</p>
                <p>Timestamp: {feedback.__dict__.get('_timestamp', 'N/A')}</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        # Send email to support
        success = send_email(
            to_email=SUPPORT_EMAIL,
            subject=subject,
            body=email_body,
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send feedback email",
            )
        
        return {
            "message": "Feedback submitted successfully. Thank you for your input!",
            "rating": feedback.rating,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit feedback: {str(e)}",
        )
