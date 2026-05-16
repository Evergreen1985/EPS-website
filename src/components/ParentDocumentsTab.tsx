"use client";
/**
 * PARENT DOCUMENTS TAB
 * src/components/ParentDocumentsTab.tsx
 *
 * Add to parent dashboard:
 *   import ParentDocumentsTab from "@/components/ParentDocumentsTab";
 *   { in the tabs array: { key: "documents", label: "📁 Documents" } }
 *   {activeTab === "documents" && <ParentDocumentsTab child={selectedChild} supabase={sb} parentName={parentName} />}
 */

import { useState, useEffect } from "react";
import DocumentManager from "@/components/DocumentManager";

interface Props {
  child:      any;
  supabase:   any;
  parentName: string;
}

export default function ParentDocumentsTab({ child, supabase, parentName }: Props) {
  if (!child?.id) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99" }}>
        <div style={{ fontSize: "36px", marginBottom: "8px" }}>📁</div>
        No child selected.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "16px" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#178F78,#0F766E)", borderRadius: "16px", padding: "16px 20px", marginBottom: "16px", color: "white" }}>
        <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>
          📁 {child.child_name}'s Documents
        </div>
        <div style={{ fontSize: "12px", opacity: 0.85 }}>
          Upload required documents so the school can verify them digitally. No need to submit hardcopies or send on WhatsApp.
        </div>
      </div>

      {/* Info banner */}
      <div style={{ background: "rgba(245,184,41,0.12)", border: "1px solid rgba(245,184,41,0.3)", borderRadius: "12px", padding: "10px 14px", marginBottom: "16px", fontSize: "12px", color: "#B08000" }}>
        📋 <strong>Required:</strong> Birth Certificate and Parent Aadhaar must be uploaded for admission. Child Aadhaar is optional but recommended.
      </div>

      <DocumentManager
        enquiryId={child.id}
        childName={child.child_name}
        mode="parent"
        uploadedBy={parentName}
        supabase={supabase}
      />
    </div>
  );
}
