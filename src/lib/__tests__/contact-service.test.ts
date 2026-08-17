import { afterEach, describe, expect, it, vi } from "vitest";

import { processContactSubmission } from "../contact-service";

const submission = {
  name: "William",
  email: "william@example.com",
  subject: "测试",
  message: "这是一条用于测试 Contact Service 的完整留言。",
};
afterEach(() => {
  vi.restoreAllMocks();
});

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

  it("通知失败时留言仍然视为成功并记录 submissionId", async () => {
    const persist = vi.fn().mockResolvedValue({
      id: "submission-2",
    });

    const notifyError = new Error("resend failed");

    const notify = vi.fn().mockRejectedValue(notifyError);

    const markNotificationSent = vi.fn();
    const markNotificationFailed = vi.fn().mockResolvedValue(undefined);

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

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

    expect(consoleError).toHaveBeenCalledWith("Contact notification error:", {
      submissionId: "submission-2",
      error: notifyError,
    });
  });

  it("通知状态更新失败不会让已保存留言变成提交失败并记录 submissionId", async () => {
    const persist = vi.fn().mockResolvedValue({
      id: "submission-3",
    });

    const notify = vi.fn().mockResolvedValue({
      messageId: "message-3",
    });

    const statusError = new Error("status update failed");

    const markNotificationSent = vi.fn().mockRejectedValue(statusError);

    const markNotificationFailed = vi.fn();

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

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

    expect(consoleError).toHaveBeenCalledWith(
      "Contact notification status update error:",
      {
        submissionId: "submission-3",
        error: statusError,
      },
    );
  });

  it("通知失败且 failed 状态更新也失败时记录 submissionId", async () => {
    const persist = vi.fn().mockResolvedValue({
      id: "submission-4",
    });

    const notifyError = new Error("resend failed");
    const statusError = new Error("failed status update failed");

    const notify = vi.fn().mockRejectedValue(notifyError);
    const markNotificationSent = vi.fn();
    const markNotificationFailed = vi.fn().mockRejectedValue(statusError);

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await processContactSubmission(submission, {
      persist,
      notify,
      markNotificationSent,
      markNotificationFailed,
    });

    expect(result).toEqual({
      ok: true,
      submissionId: "submission-4",
      notification: "failed",
    });

    expect(markNotificationFailed).toHaveBeenCalledWith("submission-4");

    expect(consoleError).toHaveBeenCalledWith("Contact notification error:", {
      submissionId: "submission-4",
      error: notifyError,
    });

    expect(consoleError).toHaveBeenCalledWith(
      "Contact notification failure status update error:",
      {
        submissionId: "submission-4",
        error: statusError,
      },
    );
  });
});
