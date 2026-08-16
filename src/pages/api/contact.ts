import type { APIRoute } from "astro";
import { getSecret } from "astro:env/server";
import { Resend } from "resend";

import {
  normalizeContactRequest,
  validateContactSubmission,
} from "../../lib/contact";
import { buildContactEmail } from "../../lib/contact-email";
import {
  insertContactSubmission,
  markContactNotificationFailed,
  markContactNotificationSent,
} from "../../lib/contact-repository";
import { processContactSubmission } from "../../lib/contact-service";
import { withDatabase } from "../../lib/db";

export const prerender = false;

type RequestBody = Record<string, unknown>;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return jsonResponse(
      {
        ok: false,
        message: "请求格式不正确。",
      },
      415,
    );
  }

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return jsonResponse(
      {
        ok: false,
        message: "无法读取表单数据。",
      },
      400,
    );
  }

  if (
    typeof rawBody !== "object" ||
    rawBody === null ||
    Array.isArray(rawBody)
  ) {
    return jsonResponse(
      {
        ok: false,
        message: "表单数据格式不正确。",
      },
      400,
    );
  }

  const body = rawBody as RequestBody;

  const { submission, website } = normalizeContactRequest(body);

  // Honeypot policy 仍然由 route 决定。
  // 正常用户不会填写这个隐藏字段。
  if (website) {
    return jsonResponse({
      ok: true,
      message: "留言已发送。",
    });
  }

  const errors = validateContactSubmission(submission);

  if (Object.keys(errors).length > 0) {
    return jsonResponse(
      {
        ok: false,
        message: "服务端验证未通过，请检查表单。",
        errors,
      },
      400,
    );
  }

  const result = await processContactSubmission(submission, {
    persist: async (value) => {
      const stored = await withDatabase((sql) =>
        insertContactSubmission(sql, value),
      );

      return {
        id: stored.id,
      };
    },

    notify: async (value) => {
      const apiKey = getSecret("RESEND_API_KEY");
      const contactToEmail = getSecret("CONTACT_TO_EMAIL");

      const contactFromEmail =
        getSecret("CONTACT_FROM_EMAIL") ??
        "William 网站 <onboarding@resend.dev>";

      if (!apiKey || !contactToEmail) {
        throw new Error("Resend environment variables are not configured.");
      }

      const emailContent = buildContactEmail(value);

      const resend = new Resend(apiKey);

      const { data, error } = await resend.emails.send({
        from: contactFromEmail,
        to: [contactToEmail],
        replyTo: emailContent.replyTo,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      });

      if (error) {
        throw new Error("Resend failed to send contact notification.", {
          cause: error,
        });
      }

      return {
        messageId: data?.id ?? null,
      };
    },

    markNotificationSent: async (submissionId, messageId) => {
      await withDatabase((sql) =>
        markContactNotificationSent(sql, submissionId, messageId),
      );
    },

    markNotificationFailed: async (submissionId) => {
      await withDatabase((sql) =>
        markContactNotificationFailed(sql, submissionId),
      );
    },
  });

  if (!result.ok) {
    return jsonResponse(
      {
        ok: false,
        message: "留言暂时无法保存，请稍后再试。",
      },
      503,
    );
  }

  return jsonResponse({
    ok: true,
    message: "留言已收到。",
  });
};

export const GET: APIRoute = () => {
  return jsonResponse(
    {
      ok: false,
      message: "该接口只接受 POST 请求。",
    },
    405,
  );
};
