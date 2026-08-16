import type { APIRoute } from "astro";
import { getSecret } from "astro:env/server";
import { Resend } from "resend";

import {
  normalizeContactRequest,
  validateContactSubmission,
} from "../../lib/contact";
import { buildContactEmail } from "../../lib/contact-email";

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

  const apiKey = getSecret("RESEND_API_KEY");
  const contactToEmail = getSecret("CONTACT_TO_EMAIL");

  const contactFromEmail =
    getSecret("CONTACT_FROM_EMAIL") ?? "William 网站 <onboarding@resend.dev>";

  if (!apiKey || !contactToEmail) {
    console.error("Missing Resend environment variables.");

    return jsonResponse(
      {
        ok: false,
        message: "服务器邮件配置不完整。",
      },
      500,
    );
  }

  const emailContent = buildContactEmail(submission);

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: contactFromEmail,
      to: [contactToEmail],
      replyTo: emailContent.replyTo,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    if (error) {
      console.error("Resend send error:", error);

      return jsonResponse(
        {
          ok: false,
          message: "邮件服务暂时不可用，请稍后再试。",
        },
        502,
      );
    }

    return jsonResponse({
      ok: true,
      message: "留言已成功发送到我的邮箱。",
      emailId: data?.id,
    });
  } catch (error) {
    console.error("Unexpected contact API error:", error);

    return jsonResponse(
      {
        ok: false,
        message: "服务器发生异常，请稍后再试。",
      },
      500,
    );
  }
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
