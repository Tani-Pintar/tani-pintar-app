import { getSessionUser } from "@/lib/auth";

export type AuthContext = {
  userId: string;
  userRole: string;
  isMock: boolean;
};

let mockWarned = false;

function getMockContext(): AuthContext {
  if (!mockWarned) {
    console.warn(
      "[session] ⚠️  MOCK FALLBACK — auth asli gagal/dinonaktifkan. " +
        "Set ENABLE_MOCK_AUTH=false & pastikan /api/auth/* tersedia."
    );
    mockWarned = true;
  }
  return {
    userId: process.env.MOCK_AUTH_USER_ID ?? "dev-petani-001",
    userRole: process.env.MOCK_AUTH_ROLE ?? "PETANI",
    isMock: true,
  };
}

export async function requireSession(): Promise<AuthContext | null> {
  const enableMock =
    process.env.NODE_ENV !== "production" &&
    (process.env.ENABLE_MOCK_AUTH ?? "true") !== "false";

  // Coba auth asli (rekan — cooke JWT via getSessionUser)
  try {
    const user = await getSessionUser();
    if (user) {
      return {
        userId: user.id,
        userRole: user.role,
        isMock: false,
      };
    }
  } catch (err) {
    if (!enableMock) {
      console.error("[session] getSessionUser gagal:", err);
      return null;
    }
    console.warn("[session] getSessionUser gagal, fallback ke mock:", err);
  }

  if (enableMock) {
    return getMockContext();
  }

  return null;
}

export function requireRole(ctx: AuthContext, role: string): boolean {
  return ctx.userRole === role;
}