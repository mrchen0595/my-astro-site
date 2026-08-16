export type ContactSubmission = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type NormalizedContactRequest = {
  submission: ContactSubmission;
  website: string;
};

export type ContactFieldErrors = Partial<
  Record<"name" | "email" | "message", string>
>;

function readSingleLine(value: unknown, maxLength: number): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .replace(/[\r\n]+/g, " ")
    .slice(0, maxLength);
}

function readMessage(value: unknown, maxLength: number): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeContactRequest(
  body: Record<string, unknown>,
): NormalizedContactRequest {
  return {
    submission: {
      name: readSingleLine(body.name, 40),
      email: readSingleLine(body.email, 100),
      subject: readSingleLine(body.subject, 80),
      message: readMessage(body.message, 1000),
    },
    website: readSingleLine(body.website, 200),
  };
}

export function validateContactSubmission(
  submission: ContactSubmission,
): ContactFieldErrors {
  const errors: ContactFieldErrors = {};

  if (submission.name.length < 2) {
    errors.name = "姓名至少需要 2 个字符。";
  }

  if (!emailPattern.test(submission.email)) {
    errors.email = "请输入有效的邮箱地址。";
  }

  if (submission.message.length < 10) {
    errors.message = "留言至少需要 10 个字符。";
  }

  return errors;
}
