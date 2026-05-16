"use client";
/**
 * TEACHER KIT TAB
 * src/components/TeacherKitTab.tsx
 *
 * Add to teacher dashboard:
 *   import TeacherKitTab from "@/components/TeacherKitTab";
 *   { key: "kit", label: "🎒 Kit & Books" }
 *   {tab === "kit" && <TeacherKitTab sectionChildren={children} teacherName={teacherName} />}
 */

import { useState } from "react";
import KitChecklist from "@/components/KitChecklist";

interface Child { id: string; child_name: string; program_id?: string; program_label?: string; }

interface Props {
  sectionChildren: Child[];
  teacherName:     string;
}

export default function TeacherKitTab({ sectionChildren, teacherName }: Props) {
  const [selectedChild, setSelectedChild] = useState<Child | null>(
    sectionChildren.length === 1 ? sectionChildren[0] : null
  );

  if (sectionChildren.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99" }}>
        <div style={{ fontSize: "36px", marginBottom: "8px" }}>🎒</div>
        No children in your section yet.
      </div>
    );
  }

  return (
    <div>
      {/* Child selector */}
      {sectionChildren.length > 1 && (
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "6px" }}>SELECT CHILD</label>
          <select
            value={selectedChild?.id || ""}
            onChange={e => setSelectedChild(sectionChildren.find(c => c.id === e.target.value) || null)}
            style={{ border: "1px solid #EDE8DF", borderRadius: "10px", padding: "9px 12px", fontSize: "13px", background: "#FAF0E8", fontFamily: "'Quicksand',sans-serif", width: "100%", outline: "none" }}>
            <option value="">— Select a child —</option>
            {sectionChildren.map(c => <option key={c.id} value={c.id}>{c.child_name} — {c.program_label}</option>)}
          </select>
        </div>
      )}

      {selectedChild ? (
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EDE8DF", padding: "18px" }}>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "16px", fontWeight: 700, color: "#178F78", marginBottom: "4px" }}>
            🎒 {selectedChild.child_name}
          </div>
          <div style={{ fontSize: "11px", color: "#6B7A99", marginBottom: "16px" }}>
            Check off items as you issue them. Parents can see this in real time.
          </div>
          <KitChecklist
            enquiryId={selectedChild.id}
            childName={selectedChild.child_name}
            programmeId={selectedChild.program_id || "nursery"}
            mode="teacher"
            issuedBy={teacherName}
          />
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99", background: "white", borderRadius: "16px", border: "1px solid #EDE8DF" }}>
          Select a child above to view their kit checklist.
        </div>
      )}
    </div>
  );
}
