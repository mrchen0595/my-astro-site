import type { ContactSubmission } from "./contact";

export type StoredContact = {
  id: string;
};

export type ContactServiceDependencies = {
  persist: (submission: ContactSubmission) => Promise<StoredContact>;

  notify: (submission: ContactSubmission) => Promise<{
    messageId: string | null;
  }>;

  markNotificationSent: (
    submissionId: string,
    messageId: string | null,
  ) => Promise<void>;

  markNotificationFailed: (submissionId: string) => Promise<void>;
};

export type ContactServiceResult =
  | {
      ok: true;
      submissionId: string;
      notification: "sent" | "failed";
    }
  | {
      ok: false;
      reason: "persistence_failed";
    };

export async function processContactSubmission(
  submission: ContactSubmission,
  dependencies: ContactServiceDependencies,
): Promise<ContactServiceResult> {
  let stored: StoredContact;

  try {
    stored = await dependencies.persist(submission);
  } catch (error) {
    console.error("Contact persistence error:", error);

    return {
      ok: false,
      reason: "persistence_failed",
    };
  }

  try {
    const notification = await dependencies.notify(submission);

    try {
      await dependencies.markNotificationSent(
        stored.id,
        notification.messageId,
      );
    } catch (error) {
      console.error("Contact notification status update error:", error);
    }

    return {
      ok: true,
      submissionId: stored.id,
      notification: "sent",
    };
  } catch (error) {
    console.error("Contact notification error:", error);

    try {
      await dependencies.markNotificationFailed(stored.id);
    } catch (statusError) {
      console.error(
        "Contact notification failure status update error:",
        statusError,
      );
    }

    return {
      ok: true,
      submissionId: stored.id,
      notification: "failed",
    };
  }
}
