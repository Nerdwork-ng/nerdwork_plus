//auth.d.ts
import { Session, type DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

export interface CustomJWT extends JWT {
  user: {
    id: string;
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    isNewUser?: boolean;
    cProfile?: boolean;
    rProfile?: boolean;
  };
  cProfile?: boolean;
  rProfile?: boolean;
  token?: string;
}

export interface CustomSession extends Session {
  user: {
    id: string;
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    cProfile?: boolean;
    rProfile?: boolean;
  };
  cProfile?: boolean;
  rProfile?: boolean;
  expires: DefaultSession["expires"];
  token?: string;
}
