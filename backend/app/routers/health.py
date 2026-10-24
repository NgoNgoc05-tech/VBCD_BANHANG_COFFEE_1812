"""Health check router - endpoint public để kiểm tra server + DB."""
from fastapi import APIRouter
from app.db.session import engine

router = APIRouter()


@router.get("/api/health")
def health_check():
    """Trả về trạng thái server + database.
    Hữu ích cho môi trường production và CI.
    """
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}

@router.get("/")
def root():
    """Root endpoint trả về thông tin ngắn gọn về API."""
    return {"message": "Chào mừng đến với [TÊN SHOP] API"}