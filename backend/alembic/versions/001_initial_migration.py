"""initial_migration

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email_encrypted', sa.String(512), nullable=False, unique=True, index=True),
        sa.Column('full_name_encrypted', sa.String(512), nullable=True),
        sa.Column('phone_encrypted', sa.String(512), nullable=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('email_verified', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    
    # Create email_verifications table
    op.create_table(
        'email_verifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('token_hash', sa.String(64), nullable=False, unique=True, index=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    
    # Create index on user_id in email_verifications
    op.create_index('ix_email_verifications_user_id', 'email_verifications', ['user_id'])


def downgrade() -> None:
    # Drop indexes and tables in reverse order
    op.drop_index('ix_email_verifications_user_id', table_name='email_verifications')
    op.drop_table('email_verifications')
    op.drop_table('users')

