# Project Detail: BadQ (ระบบจัดคิวและจัดการสนามแบดมินตัน)

## 1. Tech Stack & Justification

### Core Architecture

* **Modular SPA Architecture (ES Modules):** ปรับปรุงจาก Single File Application เป็นโครงสร้างแบบแยกไฟล์ (Modular) ผ่านระบบ ES Modules (`import`/`export`) บน Browser โดยตรง เพื่อแก้ปัญหา Code บวม (Spaghetti Code) และเพิ่มความง่ายในการบำรุงรักษาโดยไม่ต้องตั้งค่า Build Tools
* **Vue 3 Components & Composables:** แยกส่วน UI ออกเป็น Components และแยก Logic การทำงานออกเป็น Composables ตาม Domain หน้าที่

### Frontend Technologies

* **Vue.js 3 (Composition API via CDN):** เลือกใช้ผ่าน CDN เพื่อเน้นความ Lightweight ไม่ต้องพึ่งพา Node.js หรือ Build Tools (เช่น Vite/Webpack) ช่วยให้เปิดใช้งานและแก้ไขโค้ดได้ทันที ใช้จัดการ Reactive Data State และ Computed Properties


* **Tailwind CSS (via CDN):** เป็น Utility-First CSS Framework ที่ช่วยให้จัดสไตล์ได้รวดเร็ว จัดวาง Layout รองรับการใช้งานบนมือถือ จัดทำ UI Modals, Buttons, Badges และ Toast Notifications


* **Progressive Web App (PWA):** รองรับการติดตั้งแอปผ่าน `manifest.json` และจัดการ Viewport สำหรับ Mobile Browser อย่างสมบูรณ์



### Backend, Database & Hosting

* **Firebase Firestore (Web SDK v10 via ES Modules):** เป็น NoSQL Cloud Database ที่รองรับ Realtime Sync ใช้จัดเก็บ `members` และ `session_history`

* **GitHub Pages (Web Hosting):** ฟรี และเชื่อมต่อกับ Public GitHub Repository สร้างโดเมนเว็บไซต์สาธารณะ (HTTPS URL) สำหรับเปิดใช้งานบนสมาร์ตโฟนได้อย่างรวดเร็ว



## 2. Deployment & Production Setup

### 2.1 Firestore Security Rules (กฎความปลอดภัยของ Database)

เพื่อป้องกันปัญหากฎหมดอายุ 30 วัน (Test Mode Expired) และอนุญาตให้เว็บแอปพลิเคชันทำการอ่าน/เขียน/ลบ ข้อมูลได้ตลอดเวลา ได้ตั้งค่า Firestore Security Rules ไว้ให้ทำงานได้เสมอ

### 2.2 การนำขึ้นระบบออนไลน์และโครงสร้างไฟล์

* **โครงสร้างไฟล์บน Repository:**
* `index.html`: ไฟล์หลักที่เก็บโครงสร้าง Layout, Modals ส่วนกลาง และดึง Components มาแสดงผล
* `app.js`: ศูนย์กลาง (Hub) ที่รวบรวม Composables และ Vue Components เข้าด้วยกัน
* `firebase-config.js`: ไฟล์ตั้งค่าการเชื่อมต่อฐานข้อมูล
* `manifest.json`: ไฟล์กำหนดคุณสมบัติ PWA
* `assets/`: โฟลเดอร์จัดเก็บไฟล์ภาพ เช่น `badQ-logo.png`, `badQ-web-icon.jpeg`
* `components/`: โฟลเดอร์เก็บ Vue Components ของแต่ละหน้าจอ (`RosterView.js`, `CheckinView.js`, `DashboardView.js`, `SummaryView.js`, `HistoryView.js`)
* `composables/`: โฟลเดอร์เก็บ Logic แยกตาม Domain (`useMembers.js`, `useQueue.js`, `useMatch.js`, `useCourt.js`, `useHistory.js`)


* การตั้งค่า GitHub Pages: ตั้งค่า Source ในแท็บ Settings -> Pages ให้ Deploy จาก Branch main (Root Directory)


* การใช้งานบนมือถือ (Mobile PWA Experience): รองรับการติดตั้งและ "เพิ่มไปยังหน้าจอโฮม" ผ่านไฟล์ Manifest ทั้งระบบ iOS (Safari) และ Android (Chrome) เพื่อเข้าใช้งานแบบ Native App เต็มหน้าจอ



## 3. Project Requirements & Feature Specifications

### 3.1 การจัดการสมาชิก (Roster Management)

* สามารถเพิ่ม (Create), แก้ไข (Update) และลบ (Delete) รายชื่อสมาชิกในระบบได้ ข้อมูลถูกจัดเก็บบน Firestore



### 3.2 การเช็กชื่อและกำหนดโหมดการเล่น (Check-in & Mode Selection)

* ต้องมีผู้เล่นอย่างน้อย 8 คน ถึงจะสามารถกดยืนยันเริ่มจัดคิวได้


* การคำนวณโหมดอัตโนมัติ: ผู้เล่นเลขคู่เข้าสู่ "โหมดคู่ (Even Mode)", ผู้เล่นเลขคี่เข้าสู่ "โหมดคี่ (Odd Mode)"


* การป้องกันปัญหา Dangling Partner: รีเซ็ตสถานะคู่ของผู้เล่นทุกคนทันทีเมื่อเริ่ม Session ใหม่ เพื่อกำจัดปัญหาสถานะคู่ตกค้าง

### 3.3 การจัดการสนามและคิวเล่น (Dashboard & Queueing System)

* ระบบต่อคิว FIFO แบบสุ่มสลับผู้เล่นจบพร้อมกัน (Shuffle-on-Requeue FIFO): อ้างอิงลำดับจากตัวแปร queuedAt โดยผู้เล่นที่เพิ่งเช็กชื่อเข้าใหม่จะไปต่อท้ายแถวทันที ส่วนผู้เล่น 4 คนที่เล่นจบเกมพร้อมกันจากสนาม ระบบจะทำการสุ่มสลับลำดับ (Shuffle) ทั้ง 4 คนก่อนแจกบัตรคิวต่อท้ายแถว เพื่อลบอคติของตำแหน่งสนาม (System Bias) กระจายโอกาสการได้ป้ายการันตี และป้องกันการเจอคู่แข่งขันกลุ่มเดิมซ้ำซาก

* การจัดคู่อัตโนมัติ (Auto Match): โหมดคู่จะการันตี 1 คู่แรก และสุ่ม 1 คู่จากคิวรอถัดไป ส่วนโหมดคี่จะการันตี 2 คนแรก และสุ่ม 2 คนจากคิวรอถัดไป

* ระบบจัดคิวด้วยตัวเอง (Drag & Drop Reorder): สำหรับทั้ง Desktop (Mouse) และ Mobile (Touch)

* ป้ายสถานะคิว (Queue Badges): แสดงผลป้าย "⭐ การันตี", "🎲 สุ่มคิว", และ "⏳ ลำดับที่ X" อย่างชัดเจน

### 3.4 สรุปผลกิจกรรมวันนี้ (Session Summary)

* แสดงสรุปจำนวนลูกแบดมินตัน และตารางจำนวนเกมที่ผู้เล่นทุกคนลงเล่น พร้อมป้าย "กลับก่อน" หากไม่ได้อยู่จนจบกิจกรรม



### 3.5 ประวัติข้อมูลการเล่น (Session History)

* บันทึกข้อมูลสรุปของแต่ละวันลง Firestore Collection `session_history` สามารถดูรายชื่อย้อนหลังและลบประวัติได้



### 3.6 การปรับปรุง UI/UX และ Layout Structure

* **Fixed Layout:** ปรับแต่ง UI ให้ Header, การ์ดสรุปข้อมูล, และ Footer ถูกตรึงตำแหน่งไว้ การ Scroll จะทำได้เฉพาะพื้นที่รายการข้อมูลตรงกลางเท่านั้น


* **Dynamic Internal Scroll:** หน้า "สรุปผลกิจกรรมวันนี้" และหน้าต่างรายชื่อ อนุญาตให้เลื่อน Scroll ได้เฉพาะเนื้อหาภายในตาราง ไม่ดึงเนื้อหาทั้งหน้าจอมือถือ



### 3.7 การปรับแต่ง Modals (หน้าต่างป๊อปอัป)

* **Dynamic Modal Height:** ปรับความสูงของหน้าต่างยืดหดตามตัวเลือกที่มีอยู่ หากเปิดโหมด Manual จะขยายพื้นที่กว้างขึ้นเพื่อรองรับรายการที่ยาวขึ้น


* **Queue Info Modal:** ป๊อปอัปอธิบายกติกา FIFO, หมายเหตุเงื่อนไขการสุ่มสลับลำดับผู้เล่นที่จบเกมพร้อมกันก่อนต่อท้ายแถว และความหมายของป้ายสถานะคิวแต่ละแบบ



## 4. Mobile Optimization & PWA

* **Dynamic Viewport Height (`dvh`):** ปรับคอนเทนเนอร์หลักและหน้าต่าง Modals จาก `vh` ไปใช้ `dvh` (`100dvh`, `85dvh`) เพื่อแก้ปัญหาแผงควบคุมโดน Address Bar หรือ Navigation Bar ของมือถือบัง ทำให้ปุ่ม Footer ลอยติดขอบจอด้านล่างพอดีเสมอ


* **Web App Manifest & Icons:** เชื่อมต่อไฟล์ `manifest.json` และกำหนด Meta Icons (`.jpg`) เพื่อให้ระบบมือถือ Android และ iOS ตรวจพบและดึงรูปโลโก้โปรเจกต์ไปสร้างทางลัด (Shortcut) บนหน้าจอได้อย่างสวยงาม ไม่ใช่ไอคอนค่าเริ่มต้นของเบราว์เซอร์


* **Overscroll & Pull-to-Refresh Prevention:** ล็อกพฤติกรรม Overscroll ของเบราว์เซอร์มือถือ (เช่น Chrome) ไม่ให้เกิดการดึงหน้าจอเพื่อรีเฟรช (Pull-to-refresh) โดยกำหนด `overscroll-behavior-y: none`, `position: fixed` ในหน้าเพจหลัก และล็อก `user-scalable=no` เพื่อป้องกันหน้าเว็บโหลดข้อมูลใหม่จน State สูญหายเมื่อใช้งานแบบ PWA



## 5. System Stability & Code Architecture (อัปเดตใหม่)

* **Separation of Concerns (SoC):** แยกส่วน Logic (Composables) และ UI (Components) ออกจากกันอย่างเด็ดขาด ช่วยลดโอกาสเกิดผลกระทบ (Side effects) ข้ามส่วนเมื่อมีการแก้ไขโค้ด
* **AI Context Window Efficiency:** การแยกไฟล์เป็นส่วนย่อยๆ ช่วยให้การนำโค้ดไปปรึกษาหรือทำงานร่วมกับ AI ทำได้มีประสิทธิภาพมากขึ้น ประหยัด Context Window และป้องกันอาการ AI หลงลืมบริบทย้อนหลังจนเกิดบั๊กซ้ำ
* **Event & Props Drilling Control:** บริหารจัดการการส่งข้อมูลระหว่าง Vue Components ด้วยการใช้ Props ส่งข้อมูลลงมา และใช้ Emits (`$emit`) เพื่อส่งคำสั่งกลับไปยัง Hub (`app.js`) ช่วยให้ Data Flow คาดเดาและตรวจสอบได้ง่าย