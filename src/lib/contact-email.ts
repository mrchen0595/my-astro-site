import type { ContactSubmission } from "./contact";

export type ContactEmailContent = {
  replyTo: string;
  subject: string;
  text: string;
  html: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[character];
  });
}

export function buildContactEmail(
  submission: ContactSubmission,
): ContactEmailContent {
  const { name, email, subject, message } = submission;

  const displaySubject = subject || "无主题";

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(displaySubject);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

  return {
    replyTo: email,

    subject: `[网站留言] ${displaySubject}`,

    text: [
      `姓名：${name}`,
      `邮箱：${email}`,
      `主题：${displaySubject}`,
      "",
      "留言：",
      message,
    ].join("\n"),

    html: `
      <h2>收到一条网站留言</h2>

      <p><strong>姓名：</strong>${safeName}</p>
      <p><strong>邮箱：</strong>${safeEmail}</p>
      <p><strong>主题：</strong>${safeSubject}</p>

      <hr />

      <p><strong>留言内容：</strong></p>
      <p>${safeMessage}</p>
    `,
  };
}
