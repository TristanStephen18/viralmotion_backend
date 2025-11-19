declare global {
  namespace Express {
    interface User {
      googleId?: string;
      name?: string;
      email?: string;
      photo?: string;
      userId?: number;
    }

    interface Request {
      user?: User;
      logout(callback: (err: any) => void): void;
      login(user: User, callback: (err: any) => void): void;
      isAuthenticated(): boolean;
    }
  }
}

export {};
