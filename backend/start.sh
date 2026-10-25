#!/usr/bin/env bash
set -euo pipefail

python -m alembic upgrade head
python -m app.db.seed
python -m app.db.create_admin
python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-10000}"
