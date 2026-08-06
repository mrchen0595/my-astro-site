import type { APIRoute } from "astro";
import { getSecret } from "astro:env/server";
import { Resend } from "resend";

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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const name = readSingleLine(body.name, 40);

  const email = readSingleLine(body.email, 100);

  const subject = readSingleLine(body.subject, 80);

  const message = readMessage(body.message, 1000);

  // 隐藏字段：正常用户不会填写。
  // 自动化垃圾程序经常会填写它。
  const website = readSingleLine(body.website, 200);

  // 对疑似机器人返回假成功，
  // 但不真正发送邮件。
  if (website) {
    return jsonResponse({
      ok: true,
      message: "留言已发送。",
    });
  }

  const errors: Record<string, string> = {};

  if (name.length < 2) {
    errors.name = "姓名至少需要 2 个字符。";
  }

  if (!emailPattern.test(email)) {
    errors.email = "请输入有效的邮箱地址。";
  }

  if (message.length < 10) {
    errors.message = "留言至少需要 10 个字符。";
  }

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

  const resend = new Resend(apiKey);

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject || "无主题");
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

  try {
    const { data, error } = await resend.emails.send({
      from: contactFromEmail,
      to: [contactToEmail],
      replyTo: email,
      subject: `[网站留言] ${subject || "无主题"}`,
      text: [
        `姓名：${name}`,
        `邮箱：${email}`,
        `主题：${subject || "无主题"}`,
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
