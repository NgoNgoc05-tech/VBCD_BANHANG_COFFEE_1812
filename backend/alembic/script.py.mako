from alembic import op
import sqlalchemy as sa
import os

# helper for reflection
schema = os.getenv("SCHEMA", "None")

revision = 'REPLACE_WITH_REVISION_ID'
down_revision = 'previous_revision_id'
branch_labels = None
depend_on = None


def upgrade() -> None:
    # --- VIẾT LỆNH UPGRADE Ở ĐÂY ---
    # Ví dụ:
    # op.create_table('users',
    #   sa.Column('id', sa.Integer(), nullable=False),
    #   sa.Column('full_name', sa.String(), nullable=False),
    #   sa.Column('email', sa.String(), nullable=False),
    #   sa.Column('password_hash', sa.String(), nullable=False),
    #   sa.Column('phone', sa.String(), nullable=True),
    #   sa.Column('address', sa.String(), nullable=True),
    #   sa.Column('role', sa.String(), nullable=False),
    #   sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    #   sa.PrimaryKeyConstraint('id')
    # )
    pass


def downgrade() -> None:
    # --- VIẾT LỆNH DOWNGRADE Ở ĐÂY ---
    # Ví dụ:
    # op.drop_table('users')
    pass
