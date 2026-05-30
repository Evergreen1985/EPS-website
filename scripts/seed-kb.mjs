/**
 * Seeds the Knowledge Base with Evergreen Preschool school documents.
 * Calls the production Supabase REST API directly with service role key.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://mmznugcbwbjeqnmmwmxn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tem51Z2Nid2JqZXFubW13bXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzkwNzgyNSwiZXhwIjoyMDg5NDgzODI1fQ.vn8w4vbz2gVRlr5sLOrX_lhjIXK3CfC2v_t-YO6bqfs";

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── chunk helper (mirrors lib/rag.ts) ──────────────────────────────────────
function chunkText(text, size = 480, overlap = 80) {
  const words = text.split(/\s+/);
  const chunks = [];
  let i = 0;
  while (i < words.length) {
    chunks.push(words.slice(i, i + size).join(" "));
    i += size - overlap;
  }
  return chunks;
}

async function ingest(title, content, docType, target) {
  // Check if document already exists by title
  const { data: existing } = await sb
    .from("kb_documents")
    .select("id")
    .eq("title", title)
    .maybeSingle();

  let docId;
  if (existing?.id) {
    // Update existing
    const { error: upErr } = await sb
      .from("kb_documents")
      .update({ content, doc_type: docType, target, is_active: true, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (upErr) { console.error(`  ❌ doc update error for "${title}":`, upErr.message); return; }
    docId = existing.id;
  } else {
    // Insert new
    const { data: doc, error: docErr } = await sb
      .from("kb_documents")
      .insert({ title, content, doc_type: docType, target, is_active: true, uploaded_by: "system" })
      .select("id").single();
    if (docErr) { console.error(`  ❌ doc insert error for "${title}":`, docErr.message); return; }
    docId = doc.id;
  }

  // Use a local variable so the rest of the function can reference it
  const doc = { id: docId };

  if (!doc) { console.error(`  ❌ doc error for "${title}": could not get document id`); return; }

  // delete old chunks then re-insert
  await sb.from("kb_chunks").delete().eq("document_id", doc.id);

  const chunks = chunkText(content);
  const rows = chunks.map((c, i) => ({ document_id: doc.id, chunk_index: i, content: c }));
  const { error: chunkErr } = await sb.from("kb_chunks").insert(rows);

  if (chunkErr) { console.error(`  ❌ chunk error for "${title}":`, chunkErr.message); return; }
  console.log(`  ✅ "${title}" — ${chunks.length} chunks (${target})`);
}

// ── Documents ──────────────────────────────────────────────────────────────
const documents = [

  // 1. School Overview
  {
    title: "Evergreen Preschool — School Overview & About Us",
    docType: "handbook",
    target: "both",
    content: `
Evergreen Preschool & Daycare
Location: 1427, 13th Cross Road, Ananthnagar Phase 2, Electronic City, Bengaluru – 560100
Contact: 7411574504 | info@evergreenpreschool.com
School Hours: Monday–Friday 7:00 AM – 7:00 PM | Saturday 8:00 AM – 1:00 PM | Sunday Closed

OUR STORY
Evergreen Preschool and Daycare was founded with a vision to provide a nurturing and stimulating environment where children can learn, grow, and thrive. Located in Ananthnagar, Electronic City, we proudly serve families in Bengaluru with high-quality early childhood education.

MISSION
To provide a safe, caring, and stimulating environment that promotes each child's social, emotional, physical, and cognitive development while supporting their natural curiosity and love for learning.

VISION
To be recognised as a leading preschool and daycare centre that prepares children to become confident, creative, and compassionate individuals ready to embrace future challenges.

OUR VALUES
- Child-Centred: We place children at the heart of everything we do, respecting their individuality and unique developmental journey.
- Excellence in Education: High-quality educational experiences through innovative teaching methods and comprehensive curriculum.
- Partnership with Parents: Working closely with families to ensure consistent support for children both at home and at school.
- Diversity & Inclusion: We celebrate diversity and create an inclusive environment where every child and family feels valued.

OUR TEAM
- Mrs. Sharma (Principal): Over 15 years of experience in early childhood education.
- Mr. Patel (Programme Coordinator): Oversees curriculum development.
- Ms. Reddy (Daycare Head): Manages daycare services.

FACILITIES
- Modern Classrooms: Spacious, well-lit with age-appropriate learning materials.
- Outdoor Playground: Safe and engaging play area for physical development.
- Activity Room: Dedicated space for arts, crafts, music and creative expression.
- Rest Area: Comfortable quiet space for children to rest during the day.

GOOGLE RATING: 4.8★ from 123+ happy families
    `.trim()
  },

  // 2. Programs & Curriculum
  {
    title: "Evergreen Preschool — All Programs & Curriculum Guide",
    docType: "curriculum",
    target: "both",
    content: `
PROGRAMMES OFFERED AT EVERGREEN PRESCHOOL & DAYCARE

1. INFANT CARE (9 months – 2 years) | Ratio 1:3 | 9:00 AM – 3:30 PM
Gentle, responsive care in a safe, sensory-rich environment.
- Dedicated primary caregiver for each infant
- Sensory play and tummy time activities
- Language development through songs and stories
- Safe sleep and feeding routines respected
- Daily written and app-based parent updates
- Introduction to basic self-help and independence

2. PLAYGROUP (2–3 years) | Ratio 1:4 | 9:30 AM – 12:30 PM
First steps into structured learning.
- Gentle separation from parents and school adaptation
- Language and communication skill development
- Fine and gross motor skill activities
- Sensory exploration and creative play
- Music, movement, and storytelling sessions
- Basic self-help skills and independence

3. NURSERY (3–4 years) | Ratio 1:6 | 9:30 AM – 12:30 PM
Builds on Playgroup with more structured activities.
- Enhanced language development and vocabulary
- Introduction to pre-literacy and pre-numeracy
- Social skills and cooperative play
- Creative arts and self-expression
- Physical activities for coordination and balance
- Basic concept formation and cognitive skills

4. JUNIOR KG (4–5 years) | Ratio 1:8 | 9:30 AM – 1:00 PM
Structured curriculum with play-based balance.
- Introduction to alphabet recognition and phonics
- Number concepts and basic mathematical operations
- Science exploration and environmental awareness
- Enhanced fine motor skills for writing readiness
- Social studies and cultural awareness
- Problem-solving and critical thinking

5. SENIOR KG (5–6 years) | Ratio 1:10 | 9:30 AM – 1:00 PM
Prepares children for smooth transition to primary school.
- Reading and writing readiness
- Advanced number concepts and mathematical skills
- Scientific inquiry and experimentation
- Enhanced social skills and emotional regulation
- Project-based and collaborative activities
- School readiness skills and study habits

6. FULL-DAY DAYCARE (2–6 years) | Ratio 1:6 | 7:00 AM – 7:00 PM
All-day care combining education with play, rest, and meals.
- Extended hours for working parents
- Nutritious breakfast, lunch, and snacks
- Age-appropriate educational activities
- Supervised indoor and outdoor play
- Quiet rest periods during the day
- Regular progress updates for parents

7. AFTER-SCHOOL PROGRAMME (5–12 years) | Ratio 1:10 | 3:00 PM – 7:00 PM
Supportive environment for homework and enrichment.
- School pickup from selected nearby schools
- Supervised homework completion time
- Nutritious afternoon snacks
- Enrichment activities — arts, crafts, music
- Indoor and outdoor games and recreation
- Special interest clubs and activities

8. HOLIDAY CAMPS (3–12 years) | Ratio 1:8 | 8:00 AM – 5:30 PM
Special camp programmes during school holidays and breaks.
- Available during Summer, Diwali and Winter breaks
- Weekly themes and special projects
- Arts, crafts, and creative activities
- Sports and outdoor adventures
- Educational workshops and experiments
- Local field trips and special guests
    `.trim()
  },

  // 3. Daily Schedule & Routines
  {
    title: "Evergreen Preschool — Daily Schedule & Routines",
    docType: "guidelines",
    target: "both",
    content: `
DAILY SCHEDULE — FULL-DAY DAYCARE (7:00 AM – 7:00 PM)

7:00 AM  — Arrival and free play
8:30 AM  — Morning circle and learning activities
10:00 AM — Snack time
10:30 AM — Outdoor play and physical activities
12:00 PM — Lunch
1:00 PM  — Rest and quiet activities
3:00 PM  — Afternoon snack
3:30 PM  — Creative arts and crafts
5:00 PM  — Stories and songs
7:00 PM  — Pick-up

DAILY SCHEDULE — AFTER-SCHOOL PROGRAMME (3:30 PM – 7:00 PM)

3:30 PM — Arrival and snack
4:00 PM — Homework and study time
5:00 PM — Enrichment activities
6:00 PM — Outdoor play and recreation
7:00 PM — Pick-up

DAILY SCHEDULE — HOLIDAY CAMPS (8:00 AM – 5:30 PM)

8:00 AM  — Arrival and morning activities
9:00 AM  — Themed activity sessions
11:00 AM — Outdoor adventures
12:30 PM — Lunch
1:30 PM  — Afternoon camp activities
3:30 PM  — Snack break
4:00 PM  — Group games and competitions
5:30 PM  — Pick-up

PROGRAMME TIMINGS SUMMARY
- Playgroup, Nursery, Jr. KG, Sr. KG: 9:30 AM – 12:30 PM (half day) or 9:30 AM – 1:00 PM
- Full-Day Daycare: 7:00 AM – 7:00 PM
- After-School: 3:00 PM – 7:00 PM
- Infant Care: 9:00 AM – 3:30 PM
    `.trim()
  },

  // 4. Admissions & FAQ
  {
    title: "Evergreen Preschool — Admissions Process & FAQ",
    docType: "faq",
    target: "parent",
    content: `
ADMISSIONS AT EVERGREEN PRESCHOOL & DAYCARE

HOW TO APPLY
1. Submit an enquiry online or call 7411574504
2. Complete the application form
3. Submit required documents: birth certificate and immunisation records
4. Schedule a school visit
5. Admission confirmed based on availability in the appropriate age group

AGE ELIGIBILITY
- Infant Care: 9 months – 2 years
- Playgroup: 2 – 3 years
- Nursery: 3 – 4 years
- Junior KG: 4 – 5 years
- Senior KG: 5 – 6 years
- Full-Day Daycare: 2 – 6 years
- After-School: 5 – 12 years
- Holiday Camps: 3 – 12 years

FREQUENTLY ASKED QUESTIONS

Q: What are your admission requirements?
A: Complete an application form, submit required documents (birth certificate, immunisation records), and schedule a visit. We accept children based on availability in the appropriate age group.

Q: Do you provide meals and snacks?
A: Yes, nutritious meals and snacks for full-day programmes. Fresh fruits, vegetables and balanced meals daily. Special dietary requirements accommodated with advance notice.

Q: What is your teacher-to-child ratio?
A: 1:3 for Infant Care, 1:4 for Playgroup (2–3 yrs), 1:6 for Nursery (3–4 yrs), 1:8 for Jr. KG (4–5 yrs), and 1:10 for Sr. KG (5–6 yrs).

Q: What security measures do you have?
A: Controlled building access, CCTV surveillance, secure pickup procedures, regular safety drills, and staff trained in first aid and emergency procedures.

Q: Do you offer transportation?
A: Yes, transportation for our after-school programme from selected nearby schools. Transport for regular programmes can be arranged based on location and availability.

Q: What are your school hours?
A: Monday–Friday: 7:00 AM – 7:00 PM. Saturday: 8:00 AM – 1:00 PM. Sunday: Closed.

Q: How do I contact the school?
A: Phone/WhatsApp: 7411574504. Email: info@evergreenpreschool.com. Address: 1427, 13th Cross Road, Ananthnagar Phase 2, Electronic City, Bengaluru – 560100.

Q: Do you follow the National Curriculum Framework (NCF)?
A: Yes, our curriculum is aligned with India's National Curriculum Framework for Foundational Stage (NCF-FS) which emphasises play-based, activity-based and inquiry-based learning.

Q: How do parents receive updates about their child?
A: Through our parent app portal — daily photos, homework, attendance, fee receipts, teacher messages and announcements all in one place.

Q: What happens if my child is unwell?
A: If a child shows symptoms of illness, parents are notified immediately. Children must be fever-free for 24 hours before returning to school.
    `.trim()
  },

  // 5. School Policies
  {
    title: "Evergreen Preschool — School Policies & Guidelines",
    docType: "policy",
    target: "both",
    content: `
EVERGREEN PRESCHOOL & DAYCARE — SCHOOL POLICIES

ATTENDANCE POLICY
- Regular attendance is important for your child's development and learning continuity.
- Please inform the school by 9:00 AM if your child will be absent.
- Extended absences of 3+ days require a medical certificate on return.
- After 3 days of unexplained absence, the school will contact parents.

PICKUP & DROP-OFF POLICY
- Children will only be released to authorised adults listed in the school records.
- Please carry a valid photo ID for pickup.
- Any changes to pickup arrangements must be communicated to the school in writing or via the app.
- Late pickup (after programme end time) may incur a late fee.

HEALTH & ILLNESS POLICY
- Children with fever (above 99°F/37.2°C) must stay home.
- Children must be fever-free for 24 hours before returning to school.
- Inform the school immediately if your child is diagnosed with a contagious illness.
- The school reserves the right to send a child home if they appear unwell.

MEDICATION POLICY
- The school does not administer medication without written authorisation from parents.
- A completed medication authorisation form must accompany any medication.
- All medications must be in original packaging with the child's name and dosage clearly labelled.

FOOD & NUTRITION POLICY
- Nutritious meals and snacks are provided for full-day programmes.
- Parents are requested to inform the school about any food allergies or dietary restrictions in advance.
- No outside food (chips, chocolates, junk food) is permitted during school hours.
- Birthday celebrations: homemade or store-bought sweets are welcome with advance notice.

SAFETY & SECURITY POLICY
- All visitors must sign in at reception and wear a visitor badge.
- CCTV cameras are installed throughout the premises.
- Regular fire and safety drills are conducted.
- First aid kits are maintained and staff are trained in basic first aid.
- The school follows a zero-tolerance policy for bullying or physical aggression.

FEE POLICY
- Fees are due on or before the 5th of each month.
- A late fee may be charged for payments received after the 10th.
- Fees can be paid via the parent app portal (online payment) or in person.
- One month's advance notice is required for withdrawal from the programme.
- No refund of fees for absences or holidays unless the school is closed.

COMMUNICATION POLICY
- All official communication happens through the school app, WhatsApp, or email.
- Parent-Teacher meetings are scheduled termly or on request.
- Teachers are available for a brief discussion at drop-off or pickup with prior appointment.
- Emergency contact numbers must be kept updated in the school records.

MOBILE PHONE POLICY
- Mobile phones are not permitted for children in school.
- Parents are requested to step away from the school entrance when using phones during drop-off/pickup.

UNIFORM POLICY
- School uniform is mandatory for all enrolled children.
- Sports/PE days: children may come in comfortable sportswear.
- Name labels on all clothing, shoes, bags and water bottles are strongly recommended.
    `.trim()
  },

  // 6. Staff Training Guide
  {
    title: "Staff Training Guide — Teaching Methods & Classroom Management",
    docType: "sop",
    target: "staff",
    content: `
EVERGREEN PRESCHOOL — STAFF TRAINING GUIDE

TEACHING PHILOSOPHY
We follow a play-based, child-centred approach aligned with India's National Curriculum Framework for Foundational Stage (NCF-FS). Learning happens through exploration, creativity, and guided discovery — not rote memorisation.

KEY TEACHING PRINCIPLES
1. Every child learns differently — differentiate instruction based on individual needs.
2. Use positive reinforcement — praise effort, not just outcomes.
3. Create a safe, nurturing classroom environment where children feel heard and respected.
4. Integrate indoor and outdoor learning equally.
5. Involve parents as partners in their child's education.

CLASSROOM MANAGEMENT STRATEGIES
- Establish clear, consistent routines from day one.
- Use visual schedules so children know what to expect.
- Give 5-minute warnings before transitions.
- Use quiet signals (bell, clap pattern) to get attention — never raise your voice.
- Seat children in small groups to encourage collaboration.
- Have a calm-down corner with sensory tools for self-regulation.
- Address behaviour privately — never shame a child in front of peers.

DAILY CLASSROOM CHECKLIST
Morning:
□ Arrange materials for the day's activities before children arrive
□ Welcome each child by name at the door
□ Take attendance and update the app by 10:00 AM
□ Conduct morning circle — date, weather, news sharing

During the Day:
□ Observe and document children's progress (photos, notes)
□ Ensure 1:1 interactions with each child daily
□ Monitor hydration — encourage water breaks
□ Log any incidents or behaviour concerns immediately

End of Day:
□ Tidy and reset classroom for next day
□ Update parent communication on the app
□ Hand over to pickup staff; verify authorised pickups only
□ Report any health concerns to the coordinator

CHILD DEVELOPMENT MILESTONES — QUICK REFERENCE

2–3 years (Playgroup):
- Vocabulary of 200–300 words, speaking in short sentences
- Parallel play (alongside, not with peers)
- Gross motor: runs, kicks a ball, climbs stairs
- Fine motor: holds crayon, stacks blocks

3–4 years (Nursery):
- Vocabulary of 1000+ words; asks "why" and "how" questions
- Begins cooperative play
- Gross motor: hops on one foot, pedals tricycle
- Fine motor: draws circles, uses scissors with help

4–5 years (Junior KG):
- Speaks clearly; tells stories; understands rules of conversation
- Enjoys group games with rules
- Pre-literacy: recognises letters, name-writing
- Pre-numeracy: counts to 20, understands more/less

5–6 years (Senior KG):
- Reads simple words; writes name and simple sentences
- Counts to 100; basic addition and subtraction
- Understands time concepts (days, months)
- Mature cooperative play; begins resolving conflicts independently

REPORTING CONCERNS
If you observe signs of developmental delay, neglect, or abuse:
1. Document observations factually (what you saw, when, where)
2. Report immediately to the Principal (Mrs. Sharma)
3. Do NOT confront parents directly
4. Maintain confidentiality — discuss only with the Principal
    `.trim()
  },

  // 7. NCF & Curriculum Framework
  {
    title: "National Curriculum Framework (NCF-FS) — Teacher Reference Guide",
    docType: "ncf",
    target: "staff",
    content: `
NCF FOUNDATIONAL STAGE — TEACHER REFERENCE AT EVERGREEN PRESCHOOL

OVERVIEW
The National Curriculum Framework for Foundational Stage (NCF-FS) covers ages 3–8 years (Balvatika to Grade 2). It is built on the principles of the National Education Policy (NEP) 2020 and focuses on holistic development through play-based and activity-based learning.

FIVE DEVELOPMENTAL GOALS (NCF-FS)
1. Physical Development & Wellbeing — gross and fine motor, health, hygiene, nutrition
2. Social & Emotional Development — self-awareness, relationships, empathy, self-regulation
3. Cognitive Development — curiosity, creativity, problem-solving, critical thinking
4. Language & Literacy — oral language, early reading, early writing (in home language first)
5. Mathematical Thinking — number sense, patterns, shapes, measurement

OUR ALIGNMENT
At Evergreen, every activity is mapped to at least one NCF developmental goal:
- Art & Craft → Fine motor + Creative expression (Goals 1, 3)
- Circle Time → Language + Social skills (Goals 2, 4)
- Outdoor Play → Physical development + Social development (Goals 1, 2)
- Story Time → Language + Cognitive (Goals 3, 4)
- Counting Games → Mathematical thinking (Goal 5)
- Nature Walk → Cognitive + Language (Goals 3, 4)

FIVE PEDAGOGICAL APPROACHES
1. Play-Based Learning: structured and unstructured free play as the primary mode
2. Activity-Based Learning: hands-on projects, experiments, art
3. Inquiry-Based Learning: encourage questions, exploration, discovery
4. Story-Based Learning: narratives, puppets, roleplay, drama
5. Outdoor and Nature-Based Learning: garden, nature walks, physical play

LANGUAGE POLICY
- Instruction begins in the child's home language / mother tongue
- English introduced gradually as a second language from Nursery onwards
- Multilingual classroom — celebrate all languages spoken at home

ASSESSMENT APPROACH (NCF-FS)
- No formal written exams for Foundational Stage
- Observation-based assessment: portfolios, anecdotal records, photos
- Termly parent reports: narrative-style, not grades
- Focus on growth and progress, not comparison between children

PLANNING YOUR LESSONS
Weekly Plan Template:
- Theme of the week
- Monday: Circle time topic + Art activity
- Tuesday: Outdoor play + Science/nature activity
- Wednesday: Story + Dramatic play
- Thursday: Music and movement + Math game
- Friday: Review + Free choice activity + Parent sharing

Remember: Flexibility is key. Follow the child's interest and curiosity.
    `.trim()
  },

  // 8. Parent App Guide
  {
    title: "Parent Portal App — How to Use Guide",
    docType: "guidelines",
    target: "parent",
    content: `
EVERGREEN PRESCHOOL — PARENT PORTAL GUIDE

ACCESS YOUR PARENT PORTAL
Website: https://edu.intelliverify.in
Install as app: Open the link in Chrome (Android) or Safari (iPhone) → tap "Install" or Share → Add to Home Screen

FIRST-TIME LOGIN
1. Go to the Parent Portal and tap "First Time? Set up your account"
2. Enter your registered phone number (10 digits)
3. Enter your child's date of birth
4. Enter the last 4 digits of your phone number
5. Your credentials will be sent to your WhatsApp
6. Use those credentials to log in

FEATURES IN YOUR PORTAL

📸 Class Photos
- View photos taken by teachers in class
- Download photos of your child
- Updated regularly by teachers

📋 Fee Payments
- View your current fee dues and payment history
- Pay fees online securely
- Download receipts and invoices

📚 Homework & Assignments
- View homework assigned by teachers
- Mark homework as completed
- Teacher can see completion status

📣 Announcements
- School announcements, holiday notices, event updates
- Push notifications sent to your phone

🤖 Ask School AI
- Ask any question about the school, policies, fees, programs
- Get instant answers based on the school's official documents
- Available 24/7

🎵 Audio Overviews
- Listen to podcast-style school updates
- Great for busy parents on the go

FORGOT PASSWORD?
Go to the Parent Portal → tap "Forgot Password?" → verify with your child's DOB and last 4 digits of phone → your password is reset instantly.

NEED HELP?
Call: 7411574504
WhatsApp: 917411574504
Email: info@evergreenpreschool.com
    `.trim()
  },

];

// ── Run ingestion ──────────────────────────────────────────────────────────
console.log(`\n🌿 Seeding Evergreen Preschool Knowledge Base (${documents.length} documents)...\n`);

for (const doc of documents) {
  await ingest(doc.title, doc.content, doc.docType, doc.target);
}

console.log("\n✅ Knowledge Base seeded successfully!");
console.log("   Parents can now ask questions at: https://edu.intelliverify.in/parent-dashboard → Ask School AI");
console.log("   Teachers can now use training at: https://edu.intelliverify.in/teacher-dashboard → Training\n");
