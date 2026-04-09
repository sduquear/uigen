import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import {
  getAnonWorkData,
  clearAnonWork,
} from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAnonWorkData).mockReturnValue(null);
    vi.mocked(getProjects).mockResolvedValue([]);
    vi.mocked(createProject).mockResolvedValue({
      id: "new-project-id",
      name: "New Design",
      userId: "user-1",
      messages: "[]",
      data: "{}",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("should return signIn, signUp, and isLoading", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.signIn).toBeTypeOf("function");
    expect(result.current.signUp).toBeTypeOf("function");
    expect(result.current.isLoading).toBe(false);
  });

  describe("signIn", () => {
    it("should return the result from signInAction", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      const { result } = renderHook(() => useAuth());

      let authResult: any;
      await act(async () => {
        authResult = await result.current.signIn("test@example.com", "password123");
      });

      expect(authResult).toEqual({ success: true });
      expect(signInAction).toHaveBeenCalledWith("test@example.com", "password123");
    });

    it("should not redirect on failed sign in", async () => {
      vi.mocked(signInAction).mockResolvedValue({
        success: false,
        error: "Invalid credentials",
      });
      const { result } = renderHook(() => useAuth());

      let authResult: any;
      await act(async () => {
        authResult = await result.current.signIn("test@example.com", "wrong");
      });

      expect(authResult).toEqual({ success: false, error: "Invalid credentials" });
      expect(mockPush).not.toHaveBeenCalled();
      expect(getProjects).not.toHaveBeenCalled();
      expect(createProject).not.toHaveBeenCalled();
    });

    it("should redirect to existing project after sign in", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getProjects).mockResolvedValue([
        { id: "proj-1", name: "My Project", createdAt: new Date(), updatedAt: new Date() },
        { id: "proj-2", name: "Older Project", createdAt: new Date(), updatedAt: new Date() },
      ]);
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(mockPush).toHaveBeenCalledWith("/proj-1");
    });

    it("should create a new project if user has no projects", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getProjects).mockResolvedValue([]);
      vi.mocked(createProject).mockResolvedValue({
        id: "created-id",
        name: "New Design",
        userId: "user-1",
        messages: "[]",
        data: "{}",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [],
          data: {},
        })
      );
      expect(mockPush).toHaveBeenCalledWith("/created-id");
    });

    it("should save anonymous work as a project on sign in", async () => {
      const anonMessages = [{ role: "user", content: "hello" }];
      const anonData = { "/App.jsx": { type: "file", content: "export default () => <div/>" } };
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue({
        messages: anonMessages,
        fileSystemData: anonData,
      });
      vi.mocked(createProject).mockResolvedValue({
        id: "anon-project-id",
        name: "Design from 10:00:00 AM",
        userId: "user-1",
        messages: JSON.stringify(anonMessages),
        data: JSON.stringify(anonData),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: anonMessages,
          data: anonData,
        })
      );
      expect(clearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/anon-project-id");
      expect(getProjects).not.toHaveBeenCalled();
    });

    it("should ignore anonymous work with empty messages", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue({
        messages: [],
        fileSystemData: {},
      });
      vi.mocked(getProjects).mockResolvedValue([
        { id: "proj-1", name: "Existing", createdAt: new Date(), updatedAt: new Date() },
      ]);
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(clearAnonWork).not.toHaveBeenCalled();
      expect(getProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/proj-1");
    });

    it("should set isLoading during sign in and reset after", async () => {
      let resolveSignIn: (value: any) => void;
      vi.mocked(signInAction).mockReturnValue(
        new Promise((resolve) => { resolveSignIn = resolve; })
      );
      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("test@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignIn!({ success: false });
        await signInPromise!;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("should reset isLoading when signInAction throws", async () => {
      vi.mocked(signInAction).mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.signIn("test@example.com", "password123");
        })
      ).rejects.toThrow("Network error");

      expect(result.current.isLoading).toBe(false);
    });

    it("should reset isLoading when handlePostSignIn throws", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getProjects).mockRejectedValue(new Error("Server error"));
      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.signIn("test@example.com", "password123");
        })
      ).rejects.toThrow("Server error");

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    it("should return the result from signUpAction", async () => {
      vi.mocked(signUpAction).mockResolvedValue({ success: true });
      const { result } = renderHook(() => useAuth());

      let authResult: any;
      await act(async () => {
        authResult = await result.current.signUp("new@example.com", "password123");
      });

      expect(authResult).toEqual({ success: true });
      expect(signUpAction).toHaveBeenCalledWith("new@example.com", "password123");
    });

    it("should not redirect on failed sign up", async () => {
      vi.mocked(signUpAction).mockResolvedValue({
        success: false,
        error: "Email already exists",
      });
      const { result } = renderHook(() => useAuth());

      let authResult: any;
      await act(async () => {
        authResult = await result.current.signUp("existing@example.com", "password123");
      });

      expect(authResult).toEqual({ success: false, error: "Email already exists" });
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should redirect to existing project after sign up", async () => {
      vi.mocked(signUpAction).mockResolvedValue({ success: true });
      vi.mocked(getProjects).mockResolvedValue([
        { id: "proj-1", name: "First Project", createdAt: new Date(), updatedAt: new Date() },
      ]);
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "password123");
      });

      expect(mockPush).toHaveBeenCalledWith("/proj-1");
    });

    it("should create a new project if no projects exist after sign up", async () => {
      vi.mocked(signUpAction).mockResolvedValue({ success: true });
      vi.mocked(getProjects).mockResolvedValue([]);
      vi.mocked(createProject).mockResolvedValue({
        id: "fresh-project",
        name: "New Design",
        userId: "user-1",
        messages: "[]",
        data: "{}",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "password123");
      });

      expect(createProject).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/fresh-project");
    });

    it("should save anonymous work as a project on sign up", async () => {
      const anonMessages = [{ role: "user", content: "build a button" }];
      const anonData = { "/App.jsx": { type: "file", content: "<button/>" } };
      vi.mocked(signUpAction).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue({
        messages: anonMessages,
        fileSystemData: anonData,
      });
      vi.mocked(createProject).mockResolvedValue({
        id: "anon-proj",
        name: "Design from 3:00:00 PM",
        userId: "user-1",
        messages: JSON.stringify(anonMessages),
        data: JSON.stringify(anonData),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "password123");
      });

      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: anonMessages,
          data: anonData,
        })
      );
      expect(clearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/anon-proj");
    });

    it("should set isLoading during sign up and reset after", async () => {
      let resolveSignUp: (value: any) => void;
      vi.mocked(signUpAction).mockReturnValue(
        new Promise((resolve) => { resolveSignUp = resolve; })
      );
      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      let signUpPromise: Promise<any>;
      act(() => {
        signUpPromise = result.current.signUp("new@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignUp!({ success: false });
        await signUpPromise!;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("should reset isLoading when signUpAction throws", async () => {
      vi.mocked(signUpAction).mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.signUp("new@example.com", "password123");
        })
      ).rejects.toThrow("Network error");

      expect(result.current.isLoading).toBe(false);
    });
  });
});
