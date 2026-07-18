"""trusted contact verification

Revision ID: 002
Revises: 001
Create Date: 2026-07-18 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

INTERACTION_TYPES = (
    "call",
    "text",
    "email",
    "website",
    "payment_request",
    "other",
)

VERIFICATION_STATUSES = (
    "pending",
    "likely_safe",
    "suspicious",
    "confirmed_scam",
    "needs_discussion",
)


def upgrade() -> None:
    op.create_table(
        "trusted_contacts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("contact_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("label", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["contact_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint(
            "user_id", "contact_user_id", name="uq_trusted_contacts_pair"
        ),
        sa.CheckConstraint(
            "user_id <> contact_user_id", name="ck_trusted_contacts_not_self"
        ),
    )
    op.create_index("ix_trusted_contacts_user_id", "trusted_contacts", ["user_id"])
    op.create_index(
        "ix_trusted_contacts_contact_user_id", "trusted_contacts", ["contact_user_id"]
    )

    op.create_table(
        "trusted_verification_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("trusted_contact_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("interaction_type", sa.String(50), nullable=False),
        sa.Column("sender_name", sa.String(200), nullable=True),
        sa.Column("sender_contact", sa.String(200), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("requested_action", sa.Text(), nullable=True),
        sa.Column("amount_requested", sa.Numeric(12, 2), nullable=True),
        sa.Column("screenshot_url", sa.String(1024), nullable=True),
        sa.Column("risk_score", sa.Integer(), nullable=True),
        sa.Column(
            "risk_reasons",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column(
            "status",
            sa.String(50),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("reviewer_notes", sa.Text(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["trusted_contact_id"], ["trusted_contacts.id"], ondelete="CASCADE"
        ),
        sa.CheckConstraint(
            "interaction_type IN ('call','text','email','website','payment_request','other')",
            name="ck_verification_interaction_type",
        ),
        sa.CheckConstraint(
            "status IN ('pending','likely_safe','suspicious','confirmed_scam','needs_discussion')",
            name="ck_verification_status",
        ),
        sa.CheckConstraint(
            "risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100)",
            name="ck_verification_risk_score",
        ),
    )
    op.create_index(
        "ix_trusted_verification_requests_user_id",
        "trusted_verification_requests",
        ["user_id"],
    )
    op.create_index(
        "ix_trusted_verification_requests_trusted_contact_id",
        "trusted_verification_requests",
        ["trusted_contact_id"],
    )
    op.create_index(
        "ix_trusted_verification_requests_status",
        "trusted_verification_requests",
        ["status"],
    )
    op.create_index(
        "ix_trusted_verification_requests_created_at",
        "trusted_verification_requests",
        ["created_at"],
    )

    op.create_table(
        "in_app_notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type", sa.String(100), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column(
            "payload",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_in_app_notifications_user_id", "in_app_notifications", ["user_id"]
    )
    op.create_index(
        "ix_in_app_notifications_created_at", "in_app_notifications", ["created_at"]
    )

    # Row Level Security — policies use app.current_user_id session setting
    op.execute("ALTER TABLE trusted_contacts ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE trusted_contacts FORCE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE trusted_verification_requests ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE trusted_verification_requests FORCE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE in_app_notifications FORCE ROW LEVEL SECURITY")

    op.execute("""
        CREATE POLICY trusted_contacts_select ON trusted_contacts
        FOR SELECT
        USING (
            user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
            OR contact_user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        )
        """)
    op.execute("""
        CREATE POLICY trusted_contacts_insert ON trusted_contacts
        FOR INSERT
        WITH CHECK (
            user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        )
        """)
    op.execute("""
        CREATE POLICY trusted_contacts_delete ON trusted_contacts
        FOR DELETE
        USING (
            user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        )
        """)

    op.execute("""
        CREATE POLICY verification_requests_select ON trusted_verification_requests
        FOR SELECT
        USING (
            user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
            OR EXISTS (
                SELECT 1 FROM trusted_contacts tc
                WHERE tc.id = trusted_verification_requests.trusted_contact_id
                  AND tc.contact_user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
            )
        )
        """)
    op.execute("""
        CREATE POLICY verification_requests_insert ON trusted_verification_requests
        FOR INSERT
        WITH CHECK (
            user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        )
        """)
    op.execute("""
        CREATE POLICY verification_requests_update ON trusted_verification_requests
        FOR UPDATE
        USING (
            user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
            OR EXISTS (
                SELECT 1 FROM trusted_contacts tc
                WHERE tc.id = trusted_verification_requests.trusted_contact_id
                  AND tc.contact_user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
            )
        )
        """)

    op.execute("""
        CREATE POLICY in_app_notifications_select ON in_app_notifications
        FOR SELECT
        USING (
            user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        )
        """)
    op.execute("""
        CREATE POLICY in_app_notifications_insert ON in_app_notifications
        FOR INSERT
        WITH CHECK (true)
        """)
    op.execute("""
        CREATE POLICY in_app_notifications_update ON in_app_notifications
        FOR UPDATE
        USING (
            user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
        )
        """)


def downgrade() -> None:
    op.execute(
        "DROP POLICY IF EXISTS in_app_notifications_update ON in_app_notifications"
    )
    op.execute(
        "DROP POLICY IF EXISTS in_app_notifications_insert ON in_app_notifications"
    )
    op.execute(
        "DROP POLICY IF EXISTS in_app_notifications_select ON in_app_notifications"
    )
    op.execute(
        "DROP POLICY IF EXISTS verification_requests_update ON trusted_verification_requests"
    )
    op.execute(
        "DROP POLICY IF EXISTS verification_requests_insert ON trusted_verification_requests"
    )
    op.execute(
        "DROP POLICY IF EXISTS verification_requests_select ON trusted_verification_requests"
    )
    op.execute("DROP POLICY IF EXISTS trusted_contacts_delete ON trusted_contacts")
    op.execute("DROP POLICY IF EXISTS trusted_contacts_insert ON trusted_contacts")
    op.execute("DROP POLICY IF EXISTS trusted_contacts_select ON trusted_contacts")

    op.execute("ALTER TABLE in_app_notifications NO FORCE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE in_app_notifications DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE trusted_verification_requests NO FORCE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE trusted_verification_requests DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE trusted_contacts NO FORCE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE trusted_contacts DISABLE ROW LEVEL SECURITY")

    op.drop_index(
        "ix_in_app_notifications_created_at", table_name="in_app_notifications"
    )
    op.drop_index("ix_in_app_notifications_user_id", table_name="in_app_notifications")
    op.drop_table("in_app_notifications")

    op.drop_index(
        "ix_trusted_verification_requests_created_at",
        table_name="trusted_verification_requests",
    )
    op.drop_index(
        "ix_trusted_verification_requests_status",
        table_name="trusted_verification_requests",
    )
    op.drop_index(
        "ix_trusted_verification_requests_trusted_contact_id",
        table_name="trusted_verification_requests",
    )
    op.drop_index(
        "ix_trusted_verification_requests_user_id",
        table_name="trusted_verification_requests",
    )
    op.drop_table("trusted_verification_requests")

    op.drop_index("ix_trusted_contacts_contact_user_id", table_name="trusted_contacts")
    op.drop_index("ix_trusted_contacts_user_id", table_name="trusted_contacts")
    op.drop_table("trusted_contacts")
