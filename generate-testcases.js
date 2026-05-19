const fs = require("fs");

const USERS = `
SAMPLE TEST USERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Role             | URL              | Username/Phone   | Password/OTP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Admin            | /admin-login     | eps_admin        | Admin@EPS123
Owner            | /admin-login     | eps_owner        | Owner@EPS123
Teacher(Infant)  | /teacher-login   | teacher_infant   | Teacher@123
Teacher(Nursery) | /teacher-login   | teacher_nursery  | Teacher@123
Teacher(Daycare) | /teacher-login   | teacher_daycare  | Teacher@123
Driver/Staff     | /teacher-login   | driver_eps       | Driver@123
Parent1          | /parent-login    | 9986620224       | OTP via SMS
Parent2          | /parent-login    | 9876543210       | OTP via SMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SAMPLE CHILDREN:
Child1: Lekhya | Infantcare | Parent:9986620224 | Transport:Permanent
Child2: Jatin  | Infantcare | Parent:9986620224 | Transport:Permanent
Child3: Arjun  | Nursery B  | Parent:9876543210 | Transport:No
Child4: Priya  | Daycare    | Parent:9876543210 | Transport:Today`;

let id = 1;
const rows = [
  ["TC_ID","Module","Sub_Module","Role","Sample_User","Test_Case_Title","Pre_Conditions","Test_Steps","Expected_Result","Test_Data","Priority","Test_Type","Status"]
];

function tc(module, sub, role, user, title, pre, steps, expected, data, priority, type) {
  rows.push([`TC${String(id++).padStart(4,"0")}`, module, sub, role, user, title, pre, steps, expected, data, priority, type, "To Test"]);
}

// ═══════════════════════════════════════════════════════════════
// 1. AUTHENTICATION
// ═══════════════════════════════════════════════════════════════
const authRoles = [
  ["Admin","eps_admin / Admin@EPS123","/admin-login","admin dashboard"],
  ["Owner","eps_owner / Owner@EPS123","/admin-login","owner portal"],
  ["Teacher","teacher_infant / Teacher@123","/teacher-login","teacher dashboard"],
  ["Driver","driver_eps / Driver@123","/teacher-login","teacher dashboard"],
];
authRoles.forEach(([role,user,url,dest]) => {
  tc("Auth","Login",role,user,`${role} valid login`,`${role} account exists in DB`,`1. Open ${url}\n2. Enter valid credentials\n3. Click Login`,`Redirect to ${dest}; session cookie set`,`user=${user}`,"Critical","Functional");
  tc("Auth","Login",role,user,`${role} wrong password`,`${role} account exists`,`1. Open ${url}\n2. Enter wrong password\n3. Click Login`,"Error shown; no redirect","password=WrongPass","Critical","Negative");
  tc("Auth","Logout",role,user,`${role} logout and back-button blocked`,`${role} logged in`,`1. Click Logout\n2. Press browser back\n3. Try navigating to protected page`,"Session cleared; redirect to login","–","Critical","Functional");
  tc("Auth","Session",role,user,`${role} protected route without login`,"No active session",`1. Visit protected route directly`,"Redirect to login page","–","Critical","Security");
});

tc("Auth","Login","Admin","–","Admin empty username","–","1. Open /admin-login\n2. Leave username blank\n3. Click Login","Validation error; form not submitted","username=blank","High","Negative");
tc("Auth","Login","Admin","–","Admin empty password","–","1. Enter username\n2. Leave password blank\n3. Click Login","Validation error","password=blank","High","Negative");
tc("Auth","Login","Admin","–","Admin SQL injection in username","–","1. Enter: ' OR 1=1 --\n2. Any password\n3. Click Login","Login fails; no SQL error exposed","' OR 1=1 --","Critical","Security");
tc("Auth","Login","Admin","–","Admin XSS in username field","–","1. Enter: <script>alert(1)</script>\n2. Click Login","Input sanitised; no JS executes","<script>alert(1)</script>","Critical","Security");
tc("Auth","Login","Parent","9986620224","Parent valid OTP login","Phone registered in enquiries",`1. Open /parent-login\n2. Enter 9986620224\n3. Click Send OTP\n4. Enter valid OTP\n5. Click Verify`,"Redirect to parent dashboard; Lekhya and Jatin visible","phone=9986620224","Critical","Functional");
tc("Auth","Login","Parent","9999999999","Parent unregistered phone","–","1. Enter 9999999999\n2. Click Send OTP","Error: phone not found","phone=9999999999","High","Negative");
tc("Auth","Login","Parent","9986620224","Parent wrong OTP","Valid phone, wrong OTP","1. Enter valid phone\n2. Enter wrong OTP\n3. Click Verify","Error: invalid OTP; no access","otp=000000","High","Negative");
tc("Auth","Login","Parent","9986620224","Parent OTP expired","OTP sent >5 min ago","1. Wait 5+ min\n2. Try to use old OTP","Error: OTP expired; request new one","–","High","Negative");
tc("Auth","Login","Parent","–","Parent empty phone field","–","1. Leave phone blank\n2. Click Send OTP","Validation error","phone=blank","Medium","Negative");
tc("Auth","Login","Parent","–","Parent non-numeric phone","–","1. Enter abcdef\n2. Click Send OTP","Validation error: must be numeric","phone=abcdef","Medium","Negative");
tc("Auth","Session","Teacher","teacher_infant / Teacher@123","Teacher session persistence across tabs","Teacher logged in","1. Open /teacher-dashboard in Tab 1\n2. Open same URL in Tab 2","Both tabs show dashboard; session shared","–","Medium","Functional");
tc("Auth","Session","Admin","eps_admin / Admin@EPS123","Admin session lasts expected duration","Just logged in","1. Login\n2. Wait 11 hours\n3. Try to use admin","Session still valid within configured timeout","–","Low","Functional");
tc("Auth","Permissions","Teacher","teacher_infant / Teacher@123","Teacher sees only permitted tabs","Only td:attendance granted","1. Set permission=[td:attendance]\n2. Login","Only Attendance tab visible; others hidden","permissions=[td:attendance]","Critical","Functional");
tc("Auth","Permissions","Teacher","teacher_infant / Teacher@123","Teacher with all permissions — all 7 tabs","All td: permissions set","1. Grant all td: permissions\n2. Login","All tabs visible: Attendance, Homework, Students, Photos, Kit, Messages, Transport","permissions=all","High","Functional");
tc("Auth","Permissions","Teacher","teacher_infant / Teacher@123","Teacher with no permissions — redirected","No td: permissions","1. Remove all permissions\n2. Login","Redirect to /admin or empty dashboard","permissions=none","High","Security");
tc("Auth","RateLimit","Public","–","Brute force login — rate limited","–","1. Try 20 failed logins in 30 seconds","Rate limit applied; account locked or CAPTCHA shown","–","High","Security");
tc("Auth","MultiLogin","Admin","eps_admin","Same admin on two browsers","–","1. Login Chrome\n2. Login Firefox same creds","Both sessions active (unless single-session enforced)","–","Low","Functional");
tc("Auth","PasswordPolicy","Admin","–","Admin password too short","–","1. Try password: abc","Validation: password too short","password=abc","Medium","Security");
tc("Auth","PasswordPolicy","Admin","–","Admin password with only letters","–","1. Try password: onlyletters","Validation: must include numbers/special chars (if enforced)","password=onlyletters","Medium","Security");

// ═══════════════════════════════════════════════════════════════
// 2. ENQUIRY / ENROLLMENT
// ═══════════════════════════════════════════════════════════════
tc("Enquiry","Submit","Public","Anonymous","Submit enquiry — all fields valid","Form accessible on homepage","1. Open enquiry form\n2. Fill: Parent=Ramesh, Phone=9876500001, Child=Rahul, Age=2yr, Msg=Interested\n3. Submit","Saved to DB; confirmation shown; admin sees new enquiry","phone=9876500001","High","Functional");
tc("Enquiry","Submit","Public","–","Enquiry — missing parent name","–","1. Leave Name blank\n2. Submit","Validation error: Name required","name=blank","High","Negative");
tc("Enquiry","Submit","Public","–","Enquiry — missing phone","–","1. Leave Phone blank\n2. Submit","Validation error: Phone required","phone=blank","High","Negative");
tc("Enquiry","Submit","Public","–","Enquiry — invalid phone format","–","1. Enter phone=abc123\n2. Submit","Validation error: invalid phone","phone=abc123","Medium","Negative");
tc("Enquiry","Submit","Public","–","Enquiry — missing child name","–","1. Leave child name blank\n2. Submit","Validation error","child=blank","Medium","Negative");
tc("Enquiry","Submit","Public","–","Enquiry — XSS in name field","–","1. Enter name=<script>alert(1)</script>\n2. Submit","Saved as plain text; no JS executes in admin view","name=<script>alert(1)</script>","Critical","Security");
tc("Enquiry","Submit","Public","–","Enquiry — duplicate phone number","Phone already in DB","1. Submit enquiry with existing phone","System accepts or shows warning: phone already registered","phone=9986620224","Medium","Functional");
tc("Enquiry","View","Admin","eps_admin / Admin@EPS123","Admin views all enquiries","Enquiries exist","1. Login\n2. Open Enquiries tab","List of all enquiries with name, phone, child, date, status","–","High","Functional");
tc("Enquiry","View","Admin","eps_admin / Admin@EPS123","Admin views enquiry details","Enquiry exists","1. Click on Rahul's enquiry","Full details shown: parent, phone, child name, age, message, date, status","–","High","Functional");
tc("Enquiry","Filter","Admin","eps_admin / Admin@EPS123","Filter enquiries by status=pending","Mixed statuses","1. Apply filter: status=pending","Only pending enquiries shown","status=pending","Medium","Functional");
tc("Enquiry","Filter","Admin","eps_admin / Admin@EPS123","Filter enquiries by status=enrolled","Mixed statuses","1. Apply filter: status=enrolled","Only enrolled shown","status=enrolled","Medium","Functional");
tc("Enquiry","Filter","Admin","eps_admin / Admin@EPS123","Filter enquiries by date range","Multiple dates","1. Filter: from=2026-05-01 to=2026-05-31","Only May 2026 enquiries","–","Medium","Functional");
tc("Enquiry","Filter","Admin","eps_admin / Admin@EPS123","Search enquiry by child name","Enquiries exist","1. Search: Rahul","Rahul's enquiry appears","search=Rahul","Medium","Functional");
tc("Enquiry","Filter","Admin","eps_admin / Admin@EPS123","Search enquiry by phone","Enquiries exist","1. Search: 9876500001","Ramesh's enquiry appears","search=9876500001","Medium","Functional");
tc("Enquiry","Update","Admin","eps_admin / Admin@EPS123","Update status to Enrolled — assign section","Enquiry pending","1. Open Rahul's enquiry\n2. Set status=Enrolled\n3. Assign section=Infantcare\n4. Save","Status=enrolled; Rahul appears in teacher_infant's student list","section=Infantcare","Critical","Functional");
tc("Enquiry","Update","Admin","eps_admin / Admin@EPS123","Update status to Rejected","Enquiry pending","1. Open enquiry\n2. Set status=Rejected\n3. Save","Status=rejected; child excluded from enrollment lists","status=rejected","High","Functional");
tc("Enquiry","Update","Admin","eps_admin / Admin@EPS123","Update status to Contacted","Enquiry new","1. Set status=Contacted","Status updated; visible in filter","status=contacted","Medium","Functional");
tc("Enquiry","Update","Admin","eps_admin / Admin@EPS123","Update status to Visit Scheduled","Enquiry contacted","1. Set status=Visit Scheduled\n2. Add date","Status updated","–","Medium","Functional");
tc("Enquiry","Notes","Admin","eps_admin / Admin@EPS123","Add note to enquiry","Enquiry exists","1. Open enquiry\n2. Add note: 'Parent visited on May 10'\n3. Save","Note saved; visible in enquiry detail","note=Parent visited","Medium","Functional");
tc("Enquiry","Notes","Admin","eps_admin / Admin@EPS123","Edit existing note","Note exists","1. Edit note text\n2. Save","Note updated in DB","–","Medium","Functional");
tc("Enquiry","Documents","Admin","eps_admin / Admin@EPS123","Upload birth certificate","Child enrolled","1. Open child record\n2. Upload birth_cert.pdf\n3. Save","Document saved; link visible in profile","file=birth_cert.pdf","Medium","Functional");
tc("Enquiry","Documents","Admin","eps_admin / Admin@EPS123","Upload vaccination record","Child enrolled","1. Upload vaccination.pdf","Document saved","file=vaccination.pdf","Medium","Functional");
tc("Enquiry","Documents","Admin","eps_admin / Admin@EPS123","View uploaded documents list","Documents uploaded","1. Open child\n2. Documents tab","All docs listed with file name and download link","–","Medium","Functional");
tc("Enquiry","Documents","Admin","eps_admin / Admin@EPS123","Download uploaded document","Document exists","1. Click download link","File downloads correctly","–","Medium","Functional");
tc("Enquiry","Documents","Admin","eps_admin / Admin@EPS123","Upload invalid file type (exe)","–","1. Try to upload .exe","Error: invalid file type; not saved","file=virus.exe","High","Security");
tc("Enquiry","AIInsight","Admin","eps_admin / Admin@EPS123","AI milestone insight for 18-month-old","Child DOB filled","1. Open child record\n2. Click Get AI Insight","Developmental milestones for 18 months shown","age=18 months","Low","Functional");
tc("Enquiry","AIInsight","Admin","eps_admin / Admin@EPS123","AI insight for 3-year-old","Child DOB filled","1. Open child with age=3yr","Age-appropriate milestones shown","age=3 years","Low","Functional");
tc("Enquiry","Delete","Admin","eps_admin / Admin@EPS123","Delete test enquiry","Test enquiry exists","1. Click Delete\n2. Confirm","Enquiry removed; not recoverable","–","Medium","Functional");
tc("Enquiry","Delete","Admin","eps_admin / Admin@EPS123","Cancel delete — enquiry not removed","–","1. Click Delete\n2. Click Cancel on confirmation","Enquiry remains","–","Medium","Functional");
tc("Enquiry","Pagination","Admin","eps_admin / Admin@EPS123","Pagination — 50+ enquiries","50 enquiries in DB","1. View enquiries list","Pagination controls shown; can navigate pages","50 enquiries","Medium","Functional");
tc("Enquiry","Sort","Admin","eps_admin / Admin@EPS123","Sort enquiries by date (newest first)","Multiple enquiries","1. Click Date column header","Most recent enquiry at top","–","Low","Functional");
tc("Enquiry","Sort","Admin","eps_admin / Admin@EPS123","Sort enquiries by child name A-Z","Multiple enquiries","1. Click Name column header","Sorted alphabetically A-Z","–","Low","Functional");

// ═══════════════════════════════════════════════════════════════
// 3. FEE MANAGEMENT
// ═══════════════════════════════════════════════════════════════
const feeTypes = ["Tuition","Transport","Activity","Annual Registration","Material"];
feeTypes.forEach(feeType => {
  tc("Fees","Assign","Admin","eps_admin / Admin@EPS123",`Assign ${feeType} fee to Lekhya`,"Lekhya enrolled",`1. Open Fees tab\n2. Select Lekhya\n3. Add fee: type=${feeType}, amount=Rs.2000\n4. Save`,`Fee record created; visible in Lekhya's fee list`,`type=${feeType}, amount=2000`,"High","Functional");
});
tc("Fees","Assign","Admin","eps_admin / Admin@EPS123","Assign fee with future due date","Child enrolled","1. Set due date = June 1 2026\n2. Save","Fee saved; shows as upcoming (not overdue)","due=2026-06-01","High","Functional");
tc("Fees","Assign","Admin","eps_admin / Admin@EPS123","Assign fee with past due date","Child enrolled","1. Set due date = May 1 2026 (past)\n2. Save","Fee saved; immediately shows as overdue with red indicator","due=2026-05-01","High","Functional");
tc("Fees","Assign","Admin","eps_admin / Admin@EPS123","Assign fee with amount=0","–","1. Set amount=0\n2. Save","Validation error or saved as Rs.0","amount=0","Low","Negative");
tc("Fees","Assign","Admin","eps_admin / Admin@EPS123","Assign fee with negative amount","–","1. Set amount=-500\n2. Save","Validation error: must be positive","amount=-500","Medium","Negative");
tc("Fees","Assign","Admin","eps_admin / Admin@EPS123","Assign multiple fees to same child","Child enrolled","1. Add Tuition fee\n2. Add Transport fee","Both fees shown in child's fee list","–","High","Functional");
tc("Fees","View","Admin","eps_admin / Admin@EPS123","View all fees — all sections","Multiple fee records","1. Open Fees tab","All children with fee type, amount, due date, status","–","High","Functional");
tc("Fees","View","Admin","eps_admin / Admin@EPS123","Filter fees by section","Multiple sections","1. Filter: section=Infantcare","Only Infantcare children's fees shown","section=Infantcare","Medium","Functional");
tc("Fees","View","Admin","eps_admin / Admin@EPS123","Filter fees by status=pending","Mixed statuses","1. Filter: status=pending","Only unpaid fees shown","status=pending","Medium","Functional");
tc("Fees","View","Admin","eps_admin / Admin@EPS123","Filter fees by status=overdue","Past due fees","1. Filter: status=overdue","Only overdue fees with red highlight","status=overdue","High","Functional");
tc("Fees","MarkPaid","Admin","eps_admin / Admin@EPS123","Mark fee as fully paid","Fee pending for Lekhya","1. Open Lekhya's fee\n2. Click Mark Paid\n3. Enter payment date=today\n4. Save","Status=Paid; green badge; removed from pending list","payment_date=today","Critical","Functional");
tc("Fees","MarkPaid","Admin","eps_admin / Admin@EPS123","Mark fee as partially paid","Fee Rs.5000 pending","1. Open fee\n2. Enter partial=Rs.2500\n3. Save","Partial payment recorded; balance Rs.2500 shown","partial=2500","High","Functional");
tc("Fees","MarkPaid","Admin","eps_admin / Admin@EPS123","Mark cash payment","Fee pending","1. Mark Paid\n2. Select method=Cash","Payment mode=Cash recorded","method=Cash","Medium","Functional");
tc("Fees","MarkPaid","Admin","eps_admin / Admin@EPS123","Mark UPI payment","Fee pending","1. Mark Paid\n2. Select method=UPI\n3. Enter UPI reference","Reference saved","method=UPI, ref=TXN12345","Medium","Functional");
tc("Fees","MarkPaid","Admin","eps_admin / Admin@EPS123","Mark bank transfer payment","Fee pending","1. Mark Paid\n2. Method=Bank Transfer\n3. Enter reference number","Payment recorded with reference","method=Bank Transfer","Medium","Functional");
tc("Fees","Edit","Admin","eps_admin / Admin@EPS123","Edit fee amount after creation","Fee exists","1. Open fee record\n2. Change amount from 2000 to 2500\n3. Save","Amount updated to 2500","amount=2500","Medium","Functional");
tc("Fees","Edit","Admin","eps_admin / Admin@EPS123","Edit fee due date","Fee exists","1. Change due date\n2. Save","Due date updated; overdue status recalculated","–","Medium","Functional");
tc("Fees","Delete","Admin","eps_admin / Admin@EPS123","Delete fee record","Fee exists","1. Click Delete on fee record\n2. Confirm","Fee record removed from system","–","Medium","Functional");
tc("Fees","Discount","Admin","eps_admin / Admin@EPS123","Apply sibling discount","Two children from same family","1. Open fee\n2. Apply 10% discount\n3. Save","Discounted amount shown; Rs.1800 instead of Rs.2000","discount=10%","Medium","Functional");
tc("Fees","Waiver","Admin","eps_admin / Admin@EPS123","Mark fee as waived","Fee pending","1. Open fee\n2. Set status=Waived\n3. Add reason\n4. Save","Fee marked waived; no balance due","reason=Scholarship","Low","Functional");
tc("Fees","Report","Admin","eps_admin / Admin@EPS123","Fee collection summary — total collected","Multiple paid fees","1. Open Fee Report section","Total collected amount shown (sum of all Paid fees)","–","High","Functional");
tc("Fees","Report","Admin","eps_admin / Admin@EPS123","Fee collection summary — pending total","Multiple pending fees","1. Open Fee Report","Total pending amount shown","–","High","Functional");
tc("Fees","Report","Admin","eps_admin / Admin@EPS123","Fee collection summary — overdue total","Overdue fees exist","1. Open Fee Report","Overdue total shown with count of overdue children","–","High","Functional");
tc("Fees","Report","Admin","eps_admin / Admin@EPS123","Fee report by section","Fees across sections","1. Filter report by section=Daycare","Daycare-specific fee summary","section=Daycare","High","Functional");
tc("Fees","Report","Admin","eps_admin / Admin@EPS123","Fee report export CSV","Data available","1. Click Export CSV","CSV downloads with: child name, section, fee type, amount, due date, status","–","Medium","Functional");
tc("Fees","Report","Owner","eps_owner / Owner@EPS123","Owner views consolidated fee report","Fees across sections","1. Login as owner\n2. Open Fee Report","All sections combined; total revenue metrics","–","High","Functional");
tc("Fees","Parent","Parent","9986620224","Parent views Lekhya's fee status","Tuition fee assigned","1. Login\n2. Open Fees section","Tuition Rs.2000 due, status, due date shown","–","High","Functional");
tc("Fees","Parent","Parent","9986620224","Parent sees both children's fees","Fees for Lekhya and Jatin","1. Login\n2. View Fees","Separate fee records for each child","–","High","Functional");
tc("Fees","Parent","Parent","9986620224","Parent sees Paid status after admin marks paid","Admin marks Lekhya fee paid","1. Admin marks paid\n2. Parent checks","Status shows Paid with green indicator","–","High","Integration");
tc("Fees","Parent","Parent","9876543210","Parent with no fees — empty state","No fees assigned","1. Login as 9876543210\n2. Open Fees","Empty state: 'No fees assigned'","–","Low","Functional");
tc("Fees","Notification","Admin","eps_admin / Admin@EPS123","Overdue fee alert visible on dashboard","Fee past due date","1. Login as admin\n2. View dashboard","Overdue fee count/alert shown prominently","–","Medium","Functional");

// ═══════════════════════════════════════════════════════════════
// 4. SECTION MANAGEMENT
// ═══════════════════════════════════════════════════════════════
tc("Sections","View","Admin","eps_admin / Admin@EPS123","Admin views all sections","Infantcare, Nursery B, Daycare exist","1. Login\n2. Open Sections tab","3 sections listed with name and child count","–","High","Functional");
tc("Sections","Create","Admin","eps_admin / Admin@EPS123","Create new section: Toddlers","–","1. Click Add Section\n2. Name=Toddlers, AgeGroup=2-3yr\n3. Save","Section created; appears in list","name=Toddlers","High","Functional");
tc("Sections","Create","Admin","eps_admin / Admin@EPS123","Create section — duplicate name","Infantcare exists","1. Create section name=Infantcare","Error: section name already exists","name=Infantcare","Medium","Negative");
tc("Sections","Create","Admin","eps_admin / Admin@EPS123","Create section — blank name","–","1. Leave name blank\n2. Save","Validation error","name=blank","Medium","Negative");
tc("Sections","Edit","Admin","eps_admin / Admin@EPS123","Rename section","Section exists","1. Open section\n2. Rename to Infant A\n3. Save","Name updated; teacher sees new name","name=Infant A","Medium","Functional");
tc("Sections","Assign","Admin","eps_admin / Admin@EPS123","Assign teacher to section","Section and teacher exist","1. Open Infantcare\n2. Assign teacher=teacher_infant\n3. Save","teacher_infant sees Infantcare on login","teacher=teacher_infant","Critical","Functional");
tc("Sections","Assign","Admin","eps_admin / Admin@EPS123","Assign two teachers to same section","Section exists","1. Assign teacher_infant and teacher_nursery to Infantcare","Both teachers see Infantcare","–","Medium","Functional");
tc("Sections","Assign","Admin","eps_admin / Admin@EPS123","Remove teacher from section","Teacher assigned","1. Open section\n2. Remove teacher_infant","teacher_infant no longer sees Infantcare","–","High","Functional");
tc("Sections","Children","Admin","eps_admin / Admin@EPS123","View children in Infantcare","Lekhya and Jatin assigned","1. Open Infantcare","Lekhya and Jatin listed","–","High","Functional");
tc("Sections","Children","Admin","eps_admin / Admin@EPS123","Move child to different section","Lekhya in Infantcare","1. Open Lekhya\n2. Change section=Daycare\n3. Save","Lekhya now in Daycare; not in Infantcare list","section=Daycare","High","Functional");
tc("Sections","Children","Admin","eps_admin / Admin@EPS123","Section child count badge","2 children in Infantcare","1. View sections list","Infantcare shows '2 children'","–","Medium","Functional");
tc("Sections","Delete","Admin","eps_admin / Admin@EPS123","Delete empty section","Section has no children","1. Create dummy section\n2. Delete it","Section removed from list","–","Medium","Functional");
tc("Sections","Delete","Admin","eps_admin / Admin@EPS123","Delete section with children — blocked","Section has children","1. Try to delete Infantcare (has Lekhya, Jatin)","Error: cannot delete section with enrolled children","–","High","Negative");
tc("Sections","Archive","Admin","eps_admin / Admin@EPS123","Archive inactive section","Section exists, no children","1. Mark section as archived","Section hidden from active list; archived list accessible","–","Low","Functional");

// ═══════════════════════════════════════════════════════════════
// 5. PROGRAMME MANAGEMENT
// ═══════════════════════════════════════════════════════════════
tc("Programme","View","Admin","eps_admin / Admin@EPS123","Admin views all programmes","Programmes configured","1. Login\n2. Open Programmes tab","All programmes listed: Daycare, Infantcare, Nursery","–","High","Functional");
tc("Programme","Create","Admin","eps_admin / Admin@EPS123","Create new programme","–","1. Click Add Programme\n2. Name=Playgroup, Age=1-2yr, Fee=1500/month\n3. Save","Programme created; available for section assignment","name=Playgroup","High","Functional");
tc("Programme","Edit","Admin","eps_admin / Admin@EPS123","Edit programme fee","Programme exists","1. Open Daycare programme\n2. Change monthly fee\n3. Save","Fee updated across all section references","–","Medium","Functional");
tc("Programme","Edit","Admin","eps_admin / Admin@EPS123","Edit programme name","Programme exists","1. Rename programme\n2. Save","Name updated","–","Medium","Functional");
tc("Programme","Delete","Admin","eps_admin / Admin@EPS123","Delete unused programme","No sections assigned to it","1. Delete programme","Removed from list","–","Low","Functional");
tc("Programme","Delete","Admin","eps_admin / Admin@EPS123","Delete programme in use — blocked","Sections assigned","1. Try to delete programme used by Infantcare","Error: programme in use","–","Medium","Negative");
tc("Programme","Assign","Admin","eps_admin / Admin@EPS123","Assign programme to section","Both exist","1. Open Infantcare section\n2. Assign programme=Infantcare Programme\n3. Save","Section linked to programme","–","High","Functional");

// ═══════════════════════════════════════════════════════════════
// 6. TEACHER DASHBOARD — ATTENDANCE
// ═══════════════════════════════════════════════════════════════
tc("Teacher","Attendance","Teacher","teacher_infant / Teacher@123","Attendance tab loads — children listed","Infantcare has Lekhya and Jatin","1. Login\n2. Click Attendance tab","Lekhya and Jatin shown; Present/Absent/Late buttons; Total=2","–","Critical","Functional");
tc("Teacher","Attendance","Teacher","teacher_infant / Teacher@123","Mark Lekhya Present — persists on reload","Not marked yet","1. Click ✅ Present for Lekhya\n2. Reload","Present count=1; Lekhya shows green Present badge","–","Critical","Functional");
tc("Teacher","Attendance","Teacher","teacher_infant / Teacher@123","Mark Jatin Absent — persists on reload","Not marked yet","1. Click ❌ Absent for Jatin\n2. Reload","Absent Today=1; Jatin shows red Absent badge","–","Critical","Functional");
tc("Teacher","Attendance","Teacher","teacher_infant / Teacher@123","Mark Lekhya Late","Not marked","1. Click ⏰ Late for Lekhya","Status=Late; Late count increments","–","High","Functional");
tc("Teacher","Attendance","Teacher","teacher_infant / Teacher@123","Change Present → Absent → Present","Lekhya=Present","1. Click Absent on Lekhya\n2. Click Present on Lekhya","Final=Present; each change saved in DB","–","High","Functional");
tc("Teacher","Attendance","Teacher","teacher_infant / Teacher@123","Change Absent → Late","Jatin=Absent","1. Click Late on Jatin","Status=Late; transport sync: absent record removed since now Late","–","High","Functional");
tc("Teacher","Attendance","Teacher","teacher_infant / Teacher@123","Change Late → Present","Lekhya=Late","1. Click Present on Lekhya","Status=Present; Late count decreases","–","High","Functional");
tc("Teacher","Attendance","Teacher","teacher_infant / Teacher@123","Mark All Present — all children","None marked","1. Click 'Mark All Present'","Both Lekhya and Jatin=Present; Present count=2","–","High","Functional");
tc("Teacher","Attendance","Teacher","teacher_infant / Teacher@123","Stats: Total count matches enrolled children","2 children","1. View stat cards","Total=2","–","High","Functional");
tc("Teacher","Attendance","Teacher","teacher_infant / Teacher@123","Stats: Present=1, Absent=1 after mixed marking","Lekhya=Present, Jatin=Absent","1. Check stat cards","Present Today=1, Absent Today=1","–","High","Functional");
tc("Teacher","Attendance","Teacher","teacher_infant / Teacher@123","Stats: Homework Active count","1 homework assigned","1. Assign homework\n2. Check stats","Homework Active=1 in stat cards","–","Medium","Functional");
tc("Teacher","Attendance","Teacher","teacher_infant / Teacher@123","Optimistic UI — status updates immediately","Normal network","1. Click ❌ Absent","UI updates instantly before API response; spinner shown","–","High","UI");
tc("Teacher","Attendance","Teacher","teacher_infant / Teacher@123","API failure — UI reverts to previous","Simulate API failure","1. Block API\n2. Click ❌ Absent","Alert shown; status reverts to previous value","–","Critical","Negative");
tc("Teacher","Attendance","Teacher","teacher_infant / Teacher@123","Attendance history — last 7 days","Data for 5 days","1. Open Attendance History\n2. Set range: last 7 days","Table shows each child's status per day","–","High","Functional");
tc("Teacher","Attendance","Teacher","teacher_infant / Teacher@123","Attendance history — custom date range","History data","1. Set from=2026-05-01 to=2026-05-15","Only records in range shown","from=2026-05-01","Medium","Functional");
tc("Teacher","Attendance","Teacher","teacher_infant / Teacher@123","Attendance history — invalid date format rejected","–","1. Enter from=abcde","Validation error: invalid date","from=abcde","Medium","Negative");
tc("Teacher","Attendance","Teacher","teacher_infant / Teacher@123","Attendance history — no data message","No records for selected range","1. Select future date range","'No records found' message shown","–","Medium","Functional");
tc("Teacher","Attendance","Teacher","teacher_infant / Teacher@123","Re-marking same day — upsert not duplicate","Lekhya already Present","1. Change Lekhya from Present to Absent","Single record updated; no duplicate created in DB","–","High","Functional");
tc("Teacher","Attendance","Teacher","teacher_nursery / Teacher@123","Teacher only sees own section","teacher_nursery has Nursery B","1. Login as teacher_nursery","Only Arjun shown; Lekhya/Jatin NOT visible","–","Critical","Security");
tc("Teacher","Attendance","Admin","eps_admin / Admin@EPS123","Admin edits child attendance for past date","Historical attendance","1. Open child\n2. Edit attendance for May 1\n3. Change to Present","Record updated for past date","date=2026-05-01","Medium","Functional");
tc("Teacher","Attendance","Admin","eps_admin / Admin@EPS123","Admin views attendance for all sections","All teachers recorded attendance","1. Admin opens attendance overview","All sections' today's attendance visible","–","High","Functional");
tc("Teacher","Attendance","Teacher","teacher_infant / Teacher@123","Low attendance alert (<75%)","Child missed 6 of 8 days","1. View student card","Yellow/red alert: attendance < 75%","attendance=25%","Medium","Functional");
tc("Teacher","Attendance","Teacher","teacher_infant / Teacher@123","Monthly attendance percentage per child","Full month data","1. View child attendance summary","% present shown: e.g. Lekhya 90% this month","–","Medium","Functional");

// ═══════════════════════════════════════════════════════════════
// 7. TEACHER — TRANSPORT SYNC
// ═══════════════════════════════════════════════════════════════
tc("Teacher","TransportSync","Teacher","teacher_infant / Teacher@123","Mark Jatin absent → morning roster shows absent","Jatin enrolled in transport (permanent)","1. Mark Jatin ❌ Absent\n2. Open Transport tab → Morning Route","Jatin=Absent in morning roster within 5s","–","Critical","Integration");
tc("Teacher","TransportSync","Teacher","teacher_infant / Teacher@123","Mark Jatin absent → afternoon roster also absent","Jatin enrolled in transport","1. Mark Jatin absent\n2. Check Afternoon Route","Jatin=Absent in afternoon route too (both routes synced)","–","Critical","Integration");
tc("Teacher","TransportSync","Teacher","teacher_infant / Teacher@123","Correct Jatin to Present → transport absent cleared (both routes)","Jatin was auto-synced absent","1. Click ✅ Present on Jatin\n2. Check both transport routes","Jatin removed from absent; shows Waiting in both routes","–","Critical","Integration");
tc("Teacher","TransportSync","Teacher","teacher_infant / Teacher@123","Correct Jatin to Late → transport absent cleared","Jatin was auto-synced absent","1. Click ⏰ Late on Jatin\n2. Check transport","Late = not absent; transport absent removed","–","High","Integration");
tc("Teacher","TransportSync","Teacher","teacher_nursery / Teacher@123","Mark non-transport child absent — transport unchanged","Arjun NOT enrolled in transport","1. Mark Arjun absent","No ride_log created for Arjun; transport tables unchanged","–","High","Integration");
tc("Teacher","TransportSync","Teacher","teacher_infant / Teacher@123","Mark absent child with expired transport opt-in","Opt-in end_date = yesterday","1. Set Lekhya opt-in end_date=yesterday\n2. Mark Lekhya absent","No transport ride_log created (expired opt-in)","end_date=yesterday","Medium","Integration");
tc("Teacher","TransportSync","Teacher","teacher_infant / Teacher@123","Auto-sync uses checked_by=teacher-sync tag","Jatin auto-synced absent","1. Mark Jatin absent\n2. Check ride_logs in Supabase","ride_log has checked_by='teacher-sync'","–","Medium","Functional");
tc("Teacher","TransportSync","Teacher","teacher_infant / Teacher@123","Only teacher-sync records deleted on correction","Driver manually set Jatin absent earlier","1. Driver marks Jatin absent (checked_by=driver)\n2. Teacher marks Jatin absent (auto-sync)\n3. Teacher corrects to Present","Only teacher-sync record deleted; driver's record untouched","–","High","Functional");
tc("Teacher","TransportSync","Parent","9986620224","Parent sees Absent within 5s of teacher marking","Parent transport tab open (5s poll)","1. Parent opens transport\n2. Teacher marks child absent","Parent status=✗ Absent Today within 5 seconds","–","High","Integration");
tc("Teacher","TransportSync","Staff","teacher_infant / Teacher@123","Migration not run — sync still works via fallback","route_id column missing","1. Mark child absent (no route_id column)","Falls back to old constraint; ride_log saved; no crash","–","High","Negative");

// ═══════════════════════════════════════════════════════════════
// 8. TEACHER DASHBOARD — HOMEWORK
// ═══════════════════════════════════════════════════════════════
tc("Teacher","Homework","Teacher","teacher_infant / Teacher@123","Assign homework — all fields valid","Teacher in Infantcare","1. Homework tab\n2. Add: Title=Counting 1-10, Subject=Maths, Due=tomorrow\n3. Submit","Saved; in list with due date; stat card increments","title=Counting 1-10","High","Functional");
tc("Teacher","Homework","Teacher","teacher_infant / Teacher@123","Assign homework — missing title","–","1. Leave title blank\n2. Submit","Validation error; not saved","title=blank","High","Negative");
tc("Teacher","Homework","Teacher","teacher_infant / Teacher@123","Assign homework — missing subject","–","1. Leave subject blank\n2. Submit","Validation error","subject=blank","Medium","Negative");
tc("Teacher","Homework","Teacher","teacher_infant / Teacher@123","Assign homework — past due date allowed","–","1. Set due=yesterday\n2. Submit","Saved; no validation block on past date","due=yesterday","Low","Negative");
tc("Teacher","Homework","Teacher","teacher_infant / Teacher@123","View homework list","1+ homework assigned","1. Open Homework tab","All homeworks listed with title, subject, due date, status","–","High","Functional");
tc("Teacher","Homework","Teacher","teacher_infant / Teacher@123","Edit homework title","Homework exists","1. Click Edit on homework\n2. Change title\n3. Save","Title updated in DB and in list","–","Medium","Functional");
tc("Teacher","Homework","Teacher","teacher_infant / Teacher@123","Delete homework","Homework exists","1. Click Delete\n2. Confirm","Homework removed; parent can no longer see it","–","Medium","Functional");
tc("Teacher","Homework","Teacher","teacher_infant / Teacher@123","Homework visible to parent","Counting 1-10 assigned to Infantcare","1. Login as Parent 9986620224\n2. Check homework section","Counting 1-10 visible with due date","–","High","Integration");
tc("Teacher","Homework","Teacher","teacher_infant / Teacher@123","Homework not visible to other section's parent","Assigned to Infantcare only","1. Login as Parent 9876543210 (Nursery B parent)","Infantcare homework NOT shown","–","Critical","Security");
tc("Teacher","Homework","Teacher","teacher_infant / Teacher@123","Multiple homeworks — all shown","3 homeworks assigned","1. View Homework tab","All 3 listed","–","Medium","Functional");
tc("Teacher","Homework","Teacher","teacher_infant / Teacher@123","Overdue homework shown in red","Due date passed","1. View homework with past due date","Red indicator or 'Overdue' badge shown","–","Medium","UI");
tc("Teacher","Homework","Admin","eps_admin / Admin@EPS123","Admin views homework for all sections","Homeworks exist","1. Login as admin\n2. Open Homework section","All sections' homeworks listed","–","Medium","Functional");
tc("Teacher","Homework","Parent","9986620224","Parent marks homework as done","Homework visible","1. Open homework in parent view\n2. Click Mark Done","Status=Done for parent's child","–","Low","Functional");

// ═══════════════════════════════════════════════════════════════
// 9. TEACHER DASHBOARD — STUDENTS
// ═══════════════════════════════════════════════════════════════
tc("Teacher","Students","Teacher","teacher_infant / Teacher@123","View Students tab — Infantcare children","Lekhya and Jatin enrolled","1. Login\n2. Click Students tab","Lekhya and Jatin cards shown with name, DOB, parent phone","–","High","Functional");
tc("Teacher","Students","Teacher","teacher_infant / Teacher@123","Student count matches enrolled","2 children","1. View Students tab","2 students shown","–","High","Functional");
tc("Teacher","Students","Teacher","teacher_infant / Teacher@123","View Lekhya's full profile","Complete record","1. Click Lekhya's card","Full details: name, DOB, age, parent, phone, section, enrollment date","–","Medium","Functional");
tc("Teacher","Students","Teacher","teacher_infant / Teacher@123","Students tab empty when no children","Section with no children","1. Create empty section\n2. Assign teacher\n3. View Students","Empty state: 'No students enrolled'","–","Medium","Functional");
tc("Teacher","Students","Teacher","teacher_nursery / Teacher@123","Teacher sees only own section students","Nursery B has Arjun","1. Login as teacher_nursery\n2. Students tab","Only Arjun shown; Lekhya/Jatin NOT visible","–","Critical","Security");
tc("Teacher","Students","Teacher","teacher_infant / Teacher@123","Search student by name","2 students","1. Type 'Lek' in search box","Only Lekhya shown","search=Lek","Medium","Functional");
tc("Teacher","Students","Teacher","teacher_infant / Teacher@123","Child medical notes visible to teacher","Medical note added by admin","1. Click child card\n2. View medical info","Medical notes shown for teacher awareness","–","Medium","Functional");
tc("Teacher","Students","Admin","eps_admin / Admin@EPS123","Admin views all children across sections","Multiple sections","1. Login as admin\n2. Open Students/Children section","All children from all sections listed","–","High","Functional");

// ═══════════════════════════════════════════════════════════════
// 10. TEACHER DASHBOARD — PHOTOS
// ═══════════════════════════════════════════════════════════════
tc("Teacher","Photos","Teacher","teacher_infant / Teacher@123","Upload photo — valid JPG","–","1. Photos tab\n2. Click Upload\n3. Select activity.jpg\n4. Submit","Photo saved; appears in gallery","file=activity.jpg","High","Functional");
tc("Teacher","Photos","Teacher","teacher_infant / Teacher@123","Upload photo — valid PNG","–","1. Upload image.png","Photo saved in gallery","file=image.png","High","Functional");
tc("Teacher","Photos","Teacher","teacher_infant / Teacher@123","Upload photo — large file (>5MB)","–","1. Upload 8MB photo","Either accepted or clear size limit error shown","file=large_photo.jpg (8MB)","Medium","Negative");
tc("Teacher","Photos","Teacher","teacher_infant / Teacher@123","Upload invalid file — exe","–","1. Try upload virus.exe","Error: invalid file type","file=virus.exe","Critical","Security");
tc("Teacher","Photos","Teacher","teacher_infant / Teacher@123","Upload invalid file — PDF","–","1. Try upload document.pdf","Error: only images allowed (if restriction exists)","file=document.pdf","Medium","Security");
tc("Teacher","Photos","Teacher","teacher_infant / Teacher@123","View uploaded photos — gallery","Photos exist","1. Open Photos tab","Up to 20 recent photos shown in grid","–","High","Functional");
tc("Teacher","Photos","Teacher","teacher_infant / Teacher@123","Photos sorted by newest first","Multiple photos uploaded at diff times","1. View gallery","Most recent photo at top-left","–","Medium","Functional");
tc("Teacher","Photos","Teacher","teacher_infant / Teacher@123","Delete own uploaded photo","Photo exists","1. Click delete on photo\n2. Confirm","Photo removed from gallery and storage","–","Medium","Functional");
tc("Teacher","Photos","Teacher","teacher_infant / Teacher@123","Add caption to photo","Photo uploaded","1. Click photo\n2. Add caption: 'Art class'\n3. Save","Caption shown below photo","caption=Art class","Low","Functional");
tc("Teacher","Photos","Parent","9986620224","Parent sees section photos in parent view","Photos uploaded to Infantcare","1. Login as parent\n2. Open Photos","Infantcare activity photos visible","–","High","Functional");
tc("Teacher","Photos","Parent","9986620224","Parent cannot see other section photos","Photos for Nursery B only","1. Login as parent (Infantcare parent)\n2. Check photos","Nursery B photos NOT shown","–","Critical","Security");
tc("Teacher","Photos","Teacher","teacher_infant / Teacher@123","Face auto-tag — labels children in class photo","Photo with faces","1. Upload class photo\n2. Click Auto-Tag Faces","AI detects and labels faces with child names","file=class_photo.jpg","Low","Functional");
tc("Teacher","Photos","Teacher","teacher_infant / Teacher@123","Gallery pagination — 30 photos","30 photos uploaded","1. View gallery","Paginated or scroll loads more photos","30 photos","Medium","Functional");

// ═══════════════════════════════════════════════════════════════
// 11. TEACHER DASHBOARD — KIT
// ═══════════════════════════════════════════════════════════════
tc("Teacher","Kit","Teacher","teacher_infant / Teacher@123","View kit list for section","Kit items configured for Infantcare","1. Open Kit tab","Kit items listed: Water Bottle, School Bag, etc.","–","Medium","Functional");
tc("Teacher","Kit","Teacher","teacher_infant / Teacher@123","Mark kit item received — Lekhya's water bottle","Kit not received","1. Click checkbox/button for Lekhya → Water Bottle","Status=received; checkbox checked","–","Medium","Functional");
tc("Teacher","Kit","Teacher","teacher_infant / Teacher@123","Unmark kit item — revert to not received","Item marked received","1. Click again to unmark","Status=not received","–","Medium","Functional");
tc("Teacher","Kit","Teacher","teacher_infant / Teacher@123","Kit summary count","2 items received out of 5","1. View kit stats","'2/5 received' shown","–","Low","Functional");
tc("Teacher","Kit","Admin","eps_admin / Admin@EPS123","Admin configures kit items for section","Section exists","1. Open section\n2. Add kit items: Water Bottle, School Bag, Art Kit\n3. Save","Kit items assigned to section","–","Medium","Functional");
tc("Teacher","Kit","Parent","9986620224","Parent views kit checklist for child","Kit configured","1. Login as parent\n2. Open Kit section","Kit items listed with received/pending status","–","Medium","Functional");
tc("Teacher","Kit","Parent","9986620224","Parent acknowledges kit item sent","Kit item pending","1. Click Mark Sent for Water Bottle","Status=sent from parent side","–","Low","Functional");

// ═══════════════════════════════════════════════════════════════
// 12. TEACHER DASHBOARD — MESSAGES
// ═══════════════════════════════════════════════════════════════
tc("Teacher","Messages","Teacher","teacher_infant / Teacher@123","Send message to owner","–","1. Messages tab\n2. Subject=Field Trip Request\n3. Body=May we do a park trip on May 30?\n4. Send","Message saved; appears in sent list; owner can see it","subject=Field Trip Request","High","Functional");
tc("Teacher","Messages","Teacher","teacher_infant / Teacher@123","Send message — missing subject","–","1. Leave subject blank\n2. Send","Validation error; not sent","subject=blank","Medium","Negative");
tc("Teacher","Messages","Teacher","teacher_infant / Teacher@123","Send message — missing body","–","1. Leave body blank\n2. Send","Validation error","body=blank","Medium","Negative");
tc("Teacher","Messages","Teacher","teacher_infant / Teacher@123","View sent messages list","Message sent","1. Open Messages tab","All sent messages with subject, date, read status","–","High","Functional");
tc("Teacher","Messages","Teacher","teacher_infant / Teacher@123","Unread/new message indicator","Owner replied","1. Open Messages tab","Reply shows as unread/new indicator","–","High","UI");
tc("Teacher","Messages","Teacher","teacher_infant / Teacher@123","Read owner reply in thread","Owner replied","1. Click on sent message","Owner's reply shown in thread below original","reply=Approved for May 30","High","Functional");
tc("Teacher","Messages","Teacher","teacher_infant / Teacher@123","Send multiple messages — all listed","3 messages sent","1. View Messages tab","All 3 messages listed","–","Medium","Functional");
tc("Teacher","Messages","Owner","eps_owner / Owner@EPS123","Owner receives teacher message","Message sent","1. Login as owner\n2. Open Messages","Field Trip Request visible with sender=teacher_infant","–","High","Integration");
tc("Teacher","Messages","Owner","eps_owner / Owner@EPS123","Owner replies to teacher","Message received","1. Open message\n2. Reply: Approved\n3. Send","Reply saved; teacher sees it in thread","reply=Approved","High","Functional");
tc("Teacher","Messages","Owner","eps_owner / Owner@EPS123","Owner marks message as read","Unread message","1. Open message","Message marked read; unread counter decreases","–","Medium","Functional");
tc("Teacher","Messages","Admin","eps_admin / Admin@EPS123","Admin views all teacher messages","Messages from multiple teachers","1. Open Messages section","All teacher messages visible regardless of section","–","Medium","Functional");
tc("Teacher","Messages","Teacher","teacher_infant / Teacher@123","Delete sent message","Message sent","1. Click Delete on sent message","Message removed from teacher's sent list","–","Low","Functional");

// ═══════════════════════════════════════════════════════════════
// 13. TEACHER DASHBOARD — CLOCK IN/OUT
// ═══════════════════════════════════════════════════════════════
tc("Teacher","Clock","Teacher","teacher_infant / Teacher@123","Clock in — first time today","No clock record today","1. Click Clock In","Clock-in time saved; button changes to Clock Out; timestamp shown","–","High","Functional");
tc("Teacher","Clock","Teacher","teacher_infant / Teacher@123","Clock out — end of day","Already clocked in","1. Click Clock Out","Clock-out time saved; duration calculated and shown","–","High","Functional");
tc("Teacher","Clock","Teacher","teacher_infant / Teacher@123","Cannot clock in twice same day","Already clocked in","1. Try Clock In again","Clock In button disabled or hidden after first clock-in","–","High","Negative");
tc("Teacher","Clock","Teacher","teacher_infant / Teacher@123","Cannot clock out without clock-in","No clock-in today","1. Clock Out button state","Clock Out button hidden/disabled if not clocked in","–","High","Negative");
tc("Teacher","Clock","Teacher","teacher_infant / Teacher@123","Clock records persist on reload","Clocked in at 9:00","1. Clock in\n2. Reload page","Clock-in time still shown; Clock Out button visible","–","High","Functional");
tc("Teacher","Clock","Teacher","teacher_infant / Teacher@123","Duration calculated correctly","Clocked in 9:00, out 17:00","1. Clock out after 8 hours","Duration shown as 8h 0m","–","High","Functional");
tc("Teacher","Clock","Teacher","teacher_infant / Teacher@123","Clock records for multiple days","Teacher clocked in past 5 days","1. View clock history","Last 5 days' clock-in/out/duration shown","–","Medium","Functional");
tc("Teacher","Clock","Admin","eps_admin / Admin@EPS123","Admin views all staff clock records for today","All teachers clocked in","1. Open Staff Attendance report","All teachers' clock-in/out times listed","–","High","Functional");
tc("Teacher","Clock","Admin","eps_admin / Admin@EPS123","Admin views staff clock history — date range","Historical data","1. Set from=May 1 to=May 31","All staff clock records for May shown","–","High","Functional");
tc("Teacher","Clock","Admin","eps_admin / Admin@EPS123","Admin exports staff attendance","Data available","1. Click Export","CSV with: teacher name, date, clock-in, clock-out, duration","–","Medium","Functional");
tc("Teacher","Clock","Owner","eps_owner / Owner@EPS123","Owner views staff attendance report","Clock records exist","1. Login as owner\n2. Open Staff Attendance","All staff records with total hours per week","–","High","Functional");
tc("Teacher","Clock","Admin","eps_admin / Admin@EPS123","Admin edits incorrect clock record","Teacher clocked wrong time","1. Open clock record\n2. Edit clock-in time\n3. Save","Clock record corrected; duration recalculated","–","Medium","Functional");

console.log(`Part 1 done — ${rows.length - 1} test cases so far`);

// WRITE CSV (will be overwritten by later parts appending rows)
module.exports = { rows, tc, id, setId: (v) => { id = v; } };
