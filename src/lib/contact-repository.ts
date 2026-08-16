import type { ContactSubmission } from "./contact";
import type { DatabaseClient } from "./db";

export type ContactNotificationStatus = "pending" | "sent" | "failed";

export type StoredContactSubmission = {
  id: string;
  notificationStatus: ContactNotificationStatus;
  notificationMessageId: string | null;
  createdAt: Date;
};

type ContactSubmissionRow = {
  id: string;
  notification_status: ContactNotificationStatus;
  notification_message_id: string | null;
  created_at: Date;
};

function mapContactSubmissionRow(
  row: ContactSubmissionRow,
): StoredContactSubmission {
  return {
    id: row.id,
    notificationStatus: row.notification_status,
    notificationMessageId: row.notification_message_id,
    createdAt: row.created_at,
  };
}

export async function insertContactSubmission(
  sql: DatabaseClient,
  submission: ContactSubmission,
): Promise<StoredContactSubmission> {
  const rows = await sql<ContactSubmissionRow[]>`
    insert into public.contact_submissions (
      name,
      email,
      subject,
      message
    )
    values (
      ${submission.name},
      ${submission.email},
      ${submission.subject},
      ${submission.message}
    )
    returning
      id,
      notification_status,
      notification_message_id,
      created_at
  `;

  const row = rows[0];

  if (!row) {
    throw new Error("Contact submission insert returned no row.");
  }

  return mapContactSubmissionRow(row);
}

export async function markContactNotificationSent(
  sql: DatabaseClient,
  submissionId: string,
  messageId: string,
): Promise<void> {
  const rows = await sql<{ id: string }[]>`
    update public.contact_submissions
    set
      notification_status = 'sent',
      notification_message_id = ${messageId}
    where id = ${submissionId}
    returning id
  `;

  if (!rows[0]) {
    throw new Error("Contact submission was not found.");
  }
}

export async function markContactNotificationFailed(
  sql: DatabaseClient,
  submissionId: string,
): Promise<void> {
  const rows = await sql<{ id: string }[]>`
    update public.contact_submissions
    set
      notification_status = 'failed',
      notification_message_id = null
    where id = ${submissionId}
    returning id
  `;

  if (!rows[0]) {
    throw new Error("Contact submission was not found.");
  }
}
