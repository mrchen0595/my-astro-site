import { describe, expect, it, vi } from "vitest";

import { processContactSubmission } from "../contact-service";

const submission = {
  name: "William",
  email: "william@example.com",
  subject: "测试",
  message: "这是一条用于测试 Contact Service 的完整留言。",
};

describe("processContactSubmission", () => {
  it("数据库保存成功并且通知成功", async () => {
    const persist = vi.fn().mockResolvedValue({
      id: "submission-1",
    });

    const notify = vi.fn().mockResolvedValue({
      messageId: "message-1",
    });

    const markNotificationSent = vi.fn().mockResolvedValue(undefined);
    const markNotificationFailed = vi.fn().mockResolvedValue(undefined);

    const result = await processContactSubmission(submission, {
      persist,
      notify,
      markNotificationSent,
      markNotificationFailed,
    });

    expect(result).toEqual({
      ok: true,
      submissionId: "submission-1",
      notification: "sent",
    });

    expect(persist).toHaveBeenCalledWith(submission);
    expect(notify).toHaveBeenCalledWith(submission);

    expect(markNotificationSent).toHaveBeenCalledWith(
      "submission-1",
      "message-1",
    );

    expect(markNotificationFailed).not.toHaveBeenCalled();
  });

  it("数据库保存失败时不会发送通知", async () => {
    const persist = vi.fn().mockRejectedValue(new Error("database failed"));

    const notify = vi.fn();
    const markNotificationSent = vi.fn();
    const markNotificationFailed = vi.fn();

    const result = await processContactSubmission(submission, {
      persist,
      notify,
      markNotificationSent,
      markNotificationFailed,
    });

    expect(result).toEqual({
      ok: false,
      reason: "persistence_failed",
    });

    expect(notify).not.toHaveBeenCalled();
    expect(markNotificationSent).not.toHaveBeenCalled();
    expect(markNotificationFailed).not.toHaveBeenCalled();
  });

  it("通知失败时留言仍然视为成功并标记 failed", async () => {
    const persist = vi.fn().mockResolvedValue({
      id: "submission-2",
    });

    const notify = vi.fn().mockRejectedValue(new Error("resend failed"));

    const markNotificationSent = vi.fn();
    const markNotificationFailed = vi.fn().mockResolvedValue(undefined);

    const result = await processContactSubmission(submission, {
      persist,
      notify,
      markNotificationSent,
      markNotificationFailed,
    });

    expect(result).toEqual({
      ok: true,
      submissionId: "submission-2",
      notification: "failed",
    });

    expect(markNotificationSent).not.toHaveBeenCalled();

    expect(markNotificationFailed).toHaveBeenCalledWith("submission-2");
  });

  it("通知状态更新失败不会让已保存留言变成提交失败", async () => {
    const persist = vi.fn().mockResolvedValue({
      id: "submission-3",
    });

    const notify = vi.fn().mockResolvedValue({
      messageId: "message-3",
    });

    const markNotificationSent = vi
      .fn()
      .mockRejectedValue(new Error("status update failed"));

    const markNotificationFailed = vi.fn();

    const result = await processContactSubmission(submission, {
      persist,
      notify,
      markNotificationSent,
      markNotificationFailed,
    });

    expect(result).toEqual({
      ok: true,
      submissionId: "submission-3",
      notification: "sent",
    });
  });
});
