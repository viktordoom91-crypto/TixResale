// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// 🚀 TYPE AUGMENTATION: Tells TypeScript that 'role' exists on your User and Token
declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: User & {
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 🚀 1. SUPER ADMIN CHECK (From your Vercel Environment Variables)
        if (
          credentials.email === process.env.ADMIN_EMAIL &&
          credentials.password === process.env.ADMIN_PASSWORD
        ) {
          return {
            id: "admin-1",
            name: "Super Admin",
            email: credentials.email,
            role: "admin", // This is the golden ticket for your proxy.ts
          };
        }

        // 🛠 2. STANDARD USER CHECK (Your normal database logic goes here)
        // Example:
        // const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        // const isValid = await bcrypt.compare(credentials.password, user.password);
        // if (user && isValid) {
        //   return {
        //     id: user.id.toString(),
        //     name: user.name,
        //     email: user.email,
        //     role: user.role || "user",
        //   };
        // }

        return null; // Reject if neither admin nor standard user matched
      }
    })
  ],
  callbacks: {
    // Pass the role from the user object into the JWT Token
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    // Expose the role from the token to the client-side session
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt", // MUST be JWT for proxy interception to work securely
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  // Ensure this is set in Vercel, otherwise the cookie cannot be read!
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
