import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { db } from "@/lib/db"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

callbacks: {
  async signIn({ user }) {
    const existingUser = await db.user.findUnique({
      where: { email: user.email! }
    })

    if (!existingUser) {
      const count = await db.user.count()

      await db.user.create({
        data: {
          email: user.email!,
          name: user.name,
          role: count === 0 ? "ADMIN" : "VIEWER"
        }
      })
    }

    return true
  },

  async session({ session }) {
    if (session.user?.email) {
      const dbUser = await db.user.findUnique({
        where: { email: session.user.email }
      })

      session.user.role = dbUser?.role
    }
    return session
  }
}

}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
