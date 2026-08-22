"""share_onboarding

Revision ID: 002
Revises: 001
Create Date: 2026-08-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("protected_phone_encrypted", sa.String(512), nullable=True))
    op.add_column(
        "users",
        sa.Column("protected_number_activated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("share_onboarding_completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("share_onboarding_deferred_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "trusted_contacts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("first_name_encrypted", sa.String(512), nullable=False),
        sa.Column("phone_encrypted", sa.String(512), nullable=False),
        sa.Column("relationship_encrypted", sa.String(512), nullable=True),
        sa.Column("is_selected", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_trusted_contacts_user_id", "trusted_contacts", ["user_id"])

    op.create_table(
        "contact_share_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("trusted_contact_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("message_template", sa.String(32), nullable=False, server_default="default"),
        sa.Column("custom_message_encrypted", sa.String(2048), nullable=True),
        sa.Column("sharing_status", sa.String(32), nullable=False, server_default="not_started"),
        sa.Column("last_share_action_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["trusted_contact_id"], ["trusted_contacts.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("trusted_contact_id", name="uq_contact_share_events_trusted_contact"),
    )
    op.create_index("ix_contact_share_events_user_id", "contact_share_events", ["user_id"])
    op.create_index(
        "ix_contact_share_events_trusted_contact_id",
        "contact_share_events",
        ["trusted_contact_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_contact_share_events_trusted_contact_id", table_name="contact_share_events")
    op.drop_index("ix_contact_share_events_user_id", table_name="contact_share_events")
    op.drop_table("contact_share_events")
    op.drop_index("ix_trusted_contacts_user_id", table_name="trusted_contacts")
    op.drop_table("trusted_contacts")
    op.drop_column("users", "share_onboarding_deferred_at")
    op.drop_column("users", "share_onboarding_completed_at")
    op.drop_column("users", "protected_number_activated_at")
    op.drop_column("users", "protected_phone_encrypted")
