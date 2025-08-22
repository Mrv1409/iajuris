// src/lib/authOptions.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "advogado-credentials",
      name: "Advogado Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios");
        }

        try {
          // Buscar diretamente na collection advogados
          const advogadosRef = collection(db, "advogados");
          const q = query(advogadosRef, where("email", "==", credentials.email));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            throw new Error("Credenciais inválidas");
          }

          const advogadoDoc = querySnapshot.docs[0];
          const advogadoData = advogadoDoc.data();

          // Verificar senha
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            advogadoData.password
          );

          if (!isValidPassword) {
            throw new Error("Credenciais inválidas");
          }

          // Verificar status
          if (advogadoData.status !== "active") {
            throw new Error("Conta suspensa. Entre em contato com o suporte.");
          }

          // Retornar user object para NextAuth
          return {
            id: advogadoDoc.id, // ID do documento Firestore
            email: advogadoData.email,
            name: advogadoData.nome,
            role: advogadoData.role,
            slug: advogadoData.slug,
            cidade: advogadoData.cidade,
            especialidades: advogadoData.especialidades,
          };
        } catch (error) {
          console.error("Erro na autenticação:", error);
          throw new Error("Erro interno. Tente novamente.");
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id; // ✅ CORREÇÃO: Preservar o ID do Firestore
        token.role = user.role;
        token.slug = user.slug;
        token.cidade = user.cidade;
        token.especialidades = user.especialidades;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string; // ✅ CORREÇÃO: Usar token.id em vez de token.sub
        session.user.role = token.role as string;
        session.user.slug = token.slug as string;
        session.user.cidade = token.cidade as string;
        session.user.especialidades = token.especialidades as string[];
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/advogado/signin",
    error: "/auth/advogado/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};