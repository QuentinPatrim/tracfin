"use client";

import { SignIn } from "@clerk/nextjs";
import KlarisLogo from "@/components/ui/KlarisLogo";
import "./app-entry.css";

export default function AppSignIn() {
  return (
    <main className="ae">
      <div className="ae-blob ae-blob--a" aria-hidden />
      <div className="ae-blob ae-blob--b" aria-hidden />
      <div className="ae-in">
        <div className="ae-brand">
          <KlarisLogo size={56} animated />
          <span className="ae-word">klaris</span>
        </div>
        <p className="ae-lede">Vos dossiers LCB-FT, dans la poche.</p>
        <div className="ae-card">
          <SignIn
            routing="hash"
            withSignUp
            fallbackRedirectUrl="/dashboard"
            signUpFallbackRedirectUrl="/dashboard"
            appearance={{
              variables: { colorPrimary: "#2F5BFF", colorText: "#0B1435", borderRadius: "14px", fontFamily: "var(--font-sans-face), system-ui, sans-serif" },
              elements: { rootBox: { width: "100%" }, cardBox: { width: "100%", boxShadow: "none" }, card: { boxShadow: "none" } },
            }}
          />
        </div>
      </div>
    </main>
  );
}
