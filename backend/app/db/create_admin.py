"""Create the initial Phin & Bean administrator account if it is missing."""

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.user import User

ADMIN_EMAIL = "admin@shop.com"
ADMIN_PASSWORD = "Admin@123"


def main() -> None:
    db = SessionLocal()
    try:
        existing_admin = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if existing_admin is not None:
            if existing_admin.role != "admin":
                raise RuntimeError(
                    f"{ADMIN_EMAIL} exists but does not have the admin role."
                )
            print(f"Administrator account {ADMIN_EMAIL} already exists.")
            return

        admin = User(
            full_name="Quản trị viên",
            email=ADMIN_EMAIL,
            password_hash=get_password_hash(ADMIN_PASSWORD),
            role="admin",
        )
        db.add(admin)
        db.commit()
        print(f"Created administrator account {ADMIN_EMAIL}.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
