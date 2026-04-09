import { describe, it, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getSession, type SessionPayload } from "@/lib/auth";

vi.mock("server-only", () => ({}));
vi.mock("next/headers");
vi.mock("jose");

describe("getSession", () => {
  const mockUserId = "user-123";
  const mockEmail = "test@example.com";
  const mockToken = "mock-jwt-token";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return session payload when token is valid", async () => {
    const mockGet = vi.fn().mockReturnValue({ value: mockToken });
    const mockCookieStore = { get: mockGet };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    const mockPayload: SessionPayload = {
      userId: mockUserId,
      email: mockEmail,
      expiresAt: new Date("2024-01-08T00:00:00Z"),
    };

    vi.mocked(jwtVerify).mockResolvedValue({
      payload: mockPayload as any,
    } as any);

    const result = await getSession();

    expect(mockGet).toHaveBeenCalledWith("auth-token");
    expect(jwtVerify).toHaveBeenCalledWith(mockToken, expect.anything());
    expect(result).toEqual(mockPayload);
  });

  it("should return null when no token exists", async () => {
    const mockGet = vi.fn().mockReturnValue(undefined);
    const mockCookieStore = { get: mockGet };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    const result = await getSession();

    expect(result).toBeNull();
    expect(jwtVerify).not.toHaveBeenCalled();
  });

  it("should return null when token verification fails", async () => {
    const mockGet = vi.fn().mockReturnValue({ value: mockToken });
    const mockCookieStore = { get: mockGet };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    vi.mocked(jwtVerify).mockRejectedValue(new Error("Invalid token"));

    const result = await getSession();

    expect(result).toBeNull();
  });

  it("should return null when token is expired", async () => {
    const mockGet = vi.fn().mockReturnValue({ value: mockToken });
    const mockCookieStore = { get: mockGet };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    vi.mocked(jwtVerify).mockRejectedValue(new Error("Token expired"));

    const result = await getSession();

    expect(result).toBeNull();
  });

  it("should return null when cookie value is empty string", async () => {
    const mockGet = vi.fn().mockReturnValue({ value: "" });
    const mockCookieStore = { get: mockGet };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    const result = await getSession();

    expect(result).toBeNull();
    expect(jwtVerify).not.toHaveBeenCalled();
  });
});
