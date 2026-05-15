import type { Invitation, UserRole } from "@/types";

const DISABLED_MESSAGE =
  "Self-service invitations are disabled. Admins must assign users from Family Members.";

export const createInvitation = async (
  inviterUid: string,
  inviterName: string,
  role: UserRole = "member"
): Promise<{ id: string; token: string }> => {
  void inviterUid;
  void inviterName;
  void role;
  throw new Error(DISABLED_MESSAGE);
};

export const validateInvitation = async (
  token: string
): Promise<{ valid: false; message: string; invite?: Invitation }> => {
  void token;
  return {
    valid: false,
    message: DISABLED_MESSAGE,
  };
};

export const useInvitation = async (inviteId: string, usedByUid: string): Promise<void> => {
  void inviteId;
  void usedByUid;
  throw new Error(DISABLED_MESSAGE);
};
