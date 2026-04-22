from sqlalchemy.orm import Session
from backend.models import Notification


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
