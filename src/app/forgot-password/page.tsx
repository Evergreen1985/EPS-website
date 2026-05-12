import { Suspense } from "react";
import ForgotPasswordContent from "./ForgotPasswordContent";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#1A2F4A,#0f6b5a)" }} />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}