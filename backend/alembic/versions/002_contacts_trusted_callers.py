"""contacts_trusted_callers

Revision ID: 002
Revises: 001
Create Date: 2026-09-21 00:00:00.000000

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
    op.create_table(
        "google_contacts_connections",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("google_account_email_encrypted", sa.String(512), nullable=True),
        sa.Column("refresh_token_encrypted", sa.Text(), nullable=True),
        sa.Column("access_token_encrypted", sa.Text(), nullable=True),
        sa.Column("token_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("scopes", sa.String(512), nullable=False, server_default=""),
        sa.Column("status", sa.String(32), nullable=False, server_default="disconnected"),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sync_cursor", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(
        "ix_google_contacts_connections_user_id",
        "google_contacts_connections",
        ["user_id"],
    )

    op.create_table(
        "user_contacts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("google_contact_id", sa.String(255), nullable=True),
        sa.Column("display_name", sa.String(512), nullable=False, server_default=""),
        sa.Column("first_name", sa.String(256), nullable=True),
        sa.Column("last_name", sa.String(256), nullable=True),
        sa.Column("primary_phone", sa.String(64), nullable=True),
        sa.Column("normalized_phone", sa.String(32), nullable=True),
        sa.Column(
            "additional_phone_numbers",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("email", sa.String(512), nullable=True),
        sa.Column("photo_url", sa.Text(), nullable=True),
        sa.Column("source", sa.String(32), nullable=False, server_default="manual"),
        sa.Column("is_trusted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("trust_level", sa.String(32), nullable=True),
        sa.Column("relationship", sa.String(64), nullable=True),
        sa.Column(
            "source_contact_deleted",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("merged_into_contact_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["merged_into_contact_id"], ["user_contacts.id"], ondelete="SET NULL"
        ),
        sa.UniqueConstraint(
            "user_id", "google_contact_id", name="uq_user_contacts_google_id"
        ),
    )
    op.create_index("ix_user_contacts_user_id", "user_contacts", ["user_id"])
    op.create_index(
        "ix_user_contacts_normalized_phone", "user_contacts", ["normalized_phone"]
    )
    op.create_index(
        "ix_user_contacts_user_normalized_phone",
        "user_contacts",
        ["user_id", "normalized_phone"],
    )
    op.create_index(
        "ix_user_contacts_user_is_trusted",
        "user_contacts",
        ["user_id", "is_trusted"],
    )
    op.create_index(
        "ix_user_contacts_user_google_id",
        "user_contacts",
        ["user_id", "google_contact_id"],
    )

    op.create_table(
        "trusted_callers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("contact_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("normalized_phone", sa.String(32), nullable=False),
        sa.Column("trust_status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("relationship", sa.String(64), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["contact_id"], ["user_contacts.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_trusted_callers_user_id", "trusted_callers", ["user_id"])
    op.create_index("ix_trusted_callers_contact_id", "trusted_callers", ["contact_id"])
    op.create_index(
        "ix_trusted_callers_user_normalized_phone",
        "trusted_callers",
        ["user_id", "normalized_phone"],
    )

    op.create_table(
        "contact_duplicate_suggestions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("contact_id_a", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("contact_id_b", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("reason", sa.String(128), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["contact_id_a"], ["user_contacts.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["contact_id_b"], ["user_contacts.id"], ondelete="CASCADE"
        ),
        sa.UniqueConstraint(
            "user_id",
            "contact_id_a",
            "contact_id_b",
            name="uq_contact_duplicate_pair",
        ),
    )
    op.create_index(
        "ix_contact_duplicate_suggestions_user_id",
        "contact_duplicate_suggestions",
        ["user_id"],
    )

    op.create_table(
        "oauth_states",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("state", sa.String(128), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.String(64), nullable=False, server_default="google_contacts"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("state"),
    )
    op.create_index("ix_oauth_states_state", "oauth_states", ["state"])
    op.create_index("ix_oauth_states_user_id", "oauth_states", ["user_id"])
    op.create_index("ix_oauth_states_expires_at", "oauth_states", ["expires_at"])


def downgrade() -> None:
    op.drop_table("oauth_states")
    op.drop_table("contact_duplicate_suggestions")
    op.drop_table("trusted_callers")
    op.drop_table("user_contacts")
    op.drop_table("google_contacts_connections")
