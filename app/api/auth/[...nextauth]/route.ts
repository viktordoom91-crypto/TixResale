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

        // 🛠 Make sure you are pulling the user correctly from your DB here!
        // Example for Prisma: 
        // const user = await prisma.user.findUnique({ where: { email: credentials.email }});
        // const passwordMatch = await bcrypt.compare(credentials.password, user.password);
        
        // MOCK USER (Replace with your actual database user fetching logic)
        const user = { 
          id: "1", 
          name: "Admin User", 
          email: credentials.email, 
          role: "admin" // <-- This property MUST be returned by your DB
        };

        if (user) {
          return {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.role // Explicitly attach the role to the return object
          };
        }

        return null;
      }
    })
  ],
  callbacks: {
    // 🚀 FIX 1: Pass the role from your database user into the JWT Token
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    // 🚀 FIX 2: Expose the role from the token to the client-side session
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
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
