# Memory Bond Companion

Complet is 5 cratids abd than what remaring                                     You are Lovable AI. Build a COMPLETE, WORKING, DEMO-READY web/mobile application called “MEMORY BOND”.

Do not create only a UI mockup or static prototype. Build a functional application with real navigation, working forms, database persistence, authentication, reminders, game logic, caregiver management, notifications/alerts where supported, and realistic demo data.

PROJECT CONTEXT:

Memory Bond is an AI-powered Cognitive Gaming and Memory Assistance Platform designed primarily for elderly people, especially supporting the needs described by the SIH 2026 problem statement:

“AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in North Eastern Region (NER)”

Problem Statement ID: SIH26003.

The application must strongly address:

- Memory assistance

- Cognitive gaming

- Elderly-friendly technology

- Daily routine support

- Medicine management

- Caregiver/family involvement

- Multilingual accessibility

- Low-connectivity/offline-friendly usage

- Simple and accessible interaction

IMPORTANT:

Memory Bond is NOT a medical diagnosis or treatment application. Never claim that the app cures dementia, improves memory medically, or diagnoses any disease. Cognitive games and assessments are for engagement and memory-support purposes only.

==================================================

1. CORE PRODUCT VISION

==================================================

Create an “all-in-one digital companion for seniors”.

The application should combine:

- AI Voice Assistant

- Smart Reminders

- Medicine Management

- Medicine Stock/Refill Tracking

- Cognitive Games

- Non-diagnostic Cognitive Check-ins

- Memory Cues

- Memory Journal

- Voice Notes

- Daily Routine

- Appointments

- Shopping/Task Reminders

- Family/Caregiver Management

- SOS Emergency Support

- Multilingual UI and Voice Interaction

- Offline-first essential functionality

- Caregiver Dashboard

- Progress Tracking

The experience must be extremely simple for elderly users.

The app should feel:

TRUSTWORTHY + CALM + FRIENDLY + SAFE + MODERN + AI-POWERED.

==================================================

2. USER ROLES

==================================================

Create two main roles:

A) SENIOR USER

B) FAMILY MEMBER / CAREGIVER

During signup, allow the user to select the appropriate role.

Senior users should see a simplified interface.

Family/caregivers should have additional management and monitoring features.

A family member/caregiver must be able to add/manage the senior's:

- medicines

- schedules

- reminders

- emergency contacts

- appointments

- important tasks

- refill information

- memory notes/cues

The senior should NOT be required to manually configure everything.

==================================================

3. AUTHENTICATION

==================================================

Implement functional authentication.

Support:

- Email/password authentication

- Simple onboarding

- Role selection

- Profile creation

- Secure session handling

- Logout

If Supabase is available, use Supabase Authentication.

Create proper database relationships between:

- users

- senior profiles

- caregivers

- medicines

- reminders

- appointments

- emergency contacts

- games

- game progress

- memory cues

- memory journal

- voice notes

- notifications

Never expose sensitive database credentials in frontend code.

==================================================

4. SENIOR ONBOARDING

==================================================

Create an extremely simple onboarding experience.

Ask:

- Name

- Preferred language

- Age range

- Emergency contacts

- Important daily routines

- Medicines

- Appointment preferences

- Caregiver/family connection

Use:

- Very large buttons

- Large readable typography

- High contrast

- Simple icons

- Voice guidance

- Minimal typing

- Clear Back/Home buttons

Provide a “Skip for now” option where appropriate.

==================================================

5. HOME DASHBOARD

==================================================

Create a senior-friendly home screen.

Main large cards/buttons:

1. TODAY

2. MEDICINES

3. MY REMINDERS

4. MEMORY GAMES

5. MEMORY CUES

6. VOICE NOTE

7. FAMILY

8. SOS

Also show:

- Next medicine

- Next reminder

- Today's appointments

- Pending tasks

- Medicine stock warning

- Simple daily progress

The home screen must never feel crowded.

==================================================

6. AI VOICE ASSISTANT

==================================================

Create a prominent microphone button.

The senior can say natural commands such as:

“Remind me to take my medicine at 8 PM.”

“Remind me to buy vegetables tomorrow.”

“Doctor appointment is on Friday at 10 AM.”

“Remind me to call my son tonight.”

“I took my medicine.”

“Show my medicines.”

“What's my next reminder?”

The application should interpret the command and create/update the relevant record.

Provide a visible confirmation before important actions.

Example:

“You want a reminder at 8:00 PM to take your medicine. Save it?”

Buttons:

YES / EDIT / CANCEL

Support multilingual voice interaction as much as the available AI/browser APIs permit.

If live AI voice functionality is unavailable in the current environment, implement a working fallback using browser speech recognition/text input and clearly structure the AI service layer so an API can be connected later.

==================================================

7. SMART REMINDERS

==================================================

Create a fully functional reminder system.

Reminder types:

- Medicine

- Appointment

- Shopping

- Daily routine

- Personal task

- Family call

- Hydration

- Meals

- Custom reminder

Features:

- Create

- Edit

- Delete

- Repeat daily/weekly/custom

- Reminder history

- Completed/missed status

- Voice confirmation

Example:

“I took my medicine.”

The app records the action with timestamp.

==================================================

8. MEDICINE MANAGEMENT

==================================================

Build a dedicated Medicine Manager.

Each medicine should support:

- Medicine name

- Dosage

- Quantity/stock

- Unit

- Frequency

- Time

- Start date

- End date

- Instructions

- Prescribing doctor (optional)

- Notes

- Refill threshold

Example:

Medicine: A

Quantity: 30 tablets

Daily usage: 2 tablets

Remaining: 6 tablets

Refill threshold: 4 tablets

Automatically calculate approximate remaining quantity based on recorded doses.

IMPORTANT FEATURE:

MEDICINE REFILL ALERT.

When remaining medicine reaches the configured refill threshold or is estimated to run out soon:

Show:

“Your medicine is running low.”

If a caregiver is connected:

Send/display a caregiver alert such as:

“[Medicine Name] may run out soon. Please arrange a refill.”

Allow configurable warning periods such as:

- 7 days

- 5 days

- 3 days

- Custom

Do not send real SMS unless a configured SMS service exists. For the working demo, implement in-app notifications and notification records, and provide an integration-ready service layer for SMS/WhatsApp/email.

Also support:

- Missed medicine alert

- Taken confirmation

- Medicine history

- Refill history

- Stock adjustment

==================================================

9. APPOINTMENT MANAGER

==================================================

Allow seniors/caregivers to create:

- Doctor appointments

- Hospital appointments

- Tests

- Family events

- Other important appointments

Include:

- Date

- Time

- Location

- Notes

- Reminder

Show upcoming appointments clearly.

==================================================

10. MEMORY CUES

==================================================

Create a “Memory Cues” section.

Users/caregivers can save important information such as:

- Family member names

- Important places

- Daily routines

- Important instructions

- Personal preferences

- Important dates

- Familiar objects

- Helpful notes

Example:

“My daughter's name is ____.”

“My morning routine starts at 7 AM.”

“Keep my keys near the entrance.”

Allow both text and voice-based memory cues.

Make the interface visual and simple.

==================================================

11. MEMORY JOURNAL + VOICE NOTES

==================================================

Create a Memory Journal.

Allow users to save:

- Short text memories

- Photos

- Voice notes

- Important moments

- Family memories

Create a simple timeline.

Example:

“Family dinner – Sunday”

Allow playback of saved voice notes.

Use secure storage where available.

==================================================

12. COGNITIVE GAMING CENTER

==================================================

This is a CORE FEATURE.

Create a dedicated “Memory Games” section.

Include multiple simple games:

GAME 1 — MEMORY CARD MATCH

Flip cards and match identical pairs.

GAME 2 — OBJECT RECALL

Show several everyday objects.

Hide them.

Ask the user which objects they remember.

GAME 3 — PATTERN RECALL

Show a simple sequence/pattern.

Ask the user to reproduce it.

GAME 4 — NUMBER/SEQUENCE MEMORY

Show a short number sequence and ask the user to remember it.

GAME 5 — DAILY ROUTINE RECALL

Ask simple questions about their routine.

GAME 6 — FAMILY PHOTO MEMORY

With user-provided family photos, create a simple recall activity.

GAME 7 — VOICE MEMORY QUIZ

Play a saved voice note or memory cue and ask a simple recall question.

GAME 8 — FIND THE DIFFERENCE / VISUAL ATTENTION

Use simple, senior-friendly visual puzzles.

GAME 9 — WORD MEMORY

Show a few simple words and ask the user to recall them.

GAME 10 — MATCH THE OBJECT

Match common household objects with their corresponding images/categories.

Rules:

- No stressful timers by default.

- Large buttons.

- Simple instructions.

- Optional voice instructions.

- Adjustable difficulty.

- Positive feedback.

- Never shame the user for incorrect answers.

==================================================

13. ADAPTIVE GAME DIFFICULTY

==================================================

Track game performance.

Based on previous performance:

- Easy

- Medium

- Challenging

Adjust difficulty gradually.

For example:

If the user consistently succeeds, slightly increase the number of cards/items.

If the user struggles, reduce complexity.

Do NOT describe this as medical treatment.

Show:

- Games played

- Accuracy

- Best scores

- Recent activity

- Personal progress

Use supportive language such as:

“Great effort!”

“Let's try another one.”

“Well done!”

==================================================

14. COGNITIVE CHECK-IN

==================================================

Create a simple optional “Memory Check-in”.

It should contain short non-diagnostic activities such as:

- word recall

- number recall

- pattern recall

- simple orientation questions

- visual memory

After completion, show:

- Activity summary

- Score

- Previous activity comparison

IMPORTANT:

Clearly display:

“This is an engagement and memory-support activity, not a medical diagnosis.”

Never diagnose dementia or any medical condition.

==================================================

15. DAILY ROUTINE BUILDER

==================================================

Create a visual daily routine.

Example:

07:00 — Wake up

08:00 — Breakfast

09:00 — Medicine

10:00 — Walk

12:30 — Lunch

16:00 — Memory Game

20:00 — Medicine

22:00 — Sleep

Allow caregivers to configure routines.

Use icons and large text.

Allow voice commands to add routine activities.

==================================================

16. FAMILY / CAREGIVER DASHBOARD

==================================================

Create a dedicated caregiver dashboard.

Caregiver should be able to see:

- Senior profile

- Upcoming medicines

- Medicine stock

- Refill warnings

- Missed medicine records

- Upcoming appointments

- Reminder completion

- Cognitive game activity

- Memory journal updates

- SOS events

- Daily routine status

Provide clear status indicators.

Do not overwhelm caregivers with unnecessary medical information.

==================================================

17. FAMILY MEMBER MANAGEMENT

==================================================

Allow the senior/caregiver account owner to add multiple trusted family members.

Fields:

- Name

- Relationship

- Phone

- Email

- Priority

- Emergency contact status

Allow:

- Edit

- Remove

- Reorder priority

- Enable/disable emergency alerts

==================================================

18. SOS EMERGENCY SYSTEM

==================================================

Create a highly visible SOS button.

IMPORTANT FLOW:

Step 1:

Senior presses and holds SOS for 10 seconds.

Show:

- Progress indicator

- Vibration feedback where supported

- “Keep holding…”

Step 2:

After 10 seconds, show full-screen confirmation:

“Are you sure you want to send an emergency alert?”

Buttons:

CANCEL

SEND SOS

Step 3:

If CANCEL:

No alert is sent.

Step 4:

If SEND SOS:

Create an emergency event.

Attempt to:

- obtain current location

- store timestamp

- notify trusted family members

- initiate a phone call where browser/device permissions support it

If location permission is unavailable:

Clearly show that location could not be obtained.

If a real calling/SMS service is unavailable:

Implement a working demo emergency event and integration-ready service layer.

The emergency workflow must NOT falsely claim that a real call/SMS was successfully sent if the platform cannot actually perform it.

==================================================

19. MULTILINGUAL SUPPORT

==================================================

This is VERY IMPORTANT because the application should be usable by people across the NER and other parts of India.

Implement language selection in onboarding and Settings.

At minimum support:

- English

- Hindi

- Assamese

- Bengali

- Gujarati

- Marathi

- Tamil

- Telugu

Structure the application using translation keys so additional Indian languages can easily be added later.

Translate:

- navigation

- buttons

- reminders

- game instructions

- medicine labels

- caregiver dashboard

- alerts

- SOS flow

- onboarding

Use large readable native scripts.

Voice interaction should support available languages where browser/API support exists.

Do not hard-code English strings throughout the application.

==================================================

20. NER-FRIENDLY DESIGN

==================================================

The application is designed with the SIH problem statement's North Eastern Region context in mind.

Do NOT make the application visually stereotypical or overly regional.

Instead provide:

- Assamese and Bengali language support

- simple low-literacy-friendly UI

- voice-first interaction

- large touch targets

- low-bandwidth-friendly architecture

- offline essential features

- culturally neutral and inclusive visuals

- support for family/caregiver involvement

The application should also remain useful outside NER.

==================================================

21. OFFLINE-FIRST SUPPORT

==================================================

Essential functionality should continue to work without internet where technically possible.

Offline:

- saved reminders

- medicine schedules

- basic routine

- downloaded game assets

- saved memory cues

- basic cognitive games

- locally stored essential information

Online features:

- cloud synchronization

- advanced AI processing

- remote caregiver updates

- external notification services

- cloud backup

Implement local storage/cache and synchronization logic where practical.

Show a small connection indicator:

ONLINE / OFFLINE / SYNCING

Do not pretend an online AI request worked while offline.

==================================================

22. NOTIFICATION SYSTEM

==================================================

Create an internal notification center.

Notification categories:

- Medicine due

- Medicine missed

- Medicine running low

- Appointment

- Routine

- Caregiver alert

- SOS

- Game reminder

- Memory activity

Allow notifications to be marked:

- Read

- Unread

- Completed

Use browser notifications where permissions and environment support them.

==================================================

23. DATA STORAGE

==================================================

ALL IMPORTANT USER DATA MUST BE PERSISTED.

Prefer Supabase.

Create a clean relational database.

Suggested tables:

profiles

senior_profiles

caregiver_relationships

medicines

medicine_logs

medicine_refills

reminders

reminder_logs

appointments

daily_routines

memory_cues

memory_journal

voice_notes

emergency_contacts

sos_events

games

game_sessions

game_progress

notifications

user_settings

Add:

- created_at

- updated_at

- user ownership

- appropriate relationships

Use Row Level Security where supported.

A user must only be able to access their own private information and authorized linked senior/caregiver information.

==================================================

24. DASHBOARDS & ANALYTICS

==================================================

Senior dashboard:

Keep it extremely simple.

Caregiver dashboard:

Show useful summaries such as:

- today's completed reminders

- pending medicines

- low-stock medicines

- missed reminders

- games played

- recent memory activities

- upcoming appointments

- emergency events

Use simple charts only where genuinely useful.

Do not fabricate medical analytics.

==================================================

25. SETTINGS

==================================================

Include:

- Language

- Font size

- High contrast mode

- Voice settings

- Notification settings

- Reminder settings

- Emergency contacts

- Privacy

- Account

- Caregiver management

Provide:

NORMAL TEXT

LARGE TEXT

EXTRA LARGE TEXT

==================================================

26. ACCESSIBILITY

==================================================

This is one of the highest priorities.

Implement:

- very large touch targets

- large typography

- high contrast

- simple icons

- minimal nested menus

- clear labels

- voice guidance

- readable cards

- consistent navigation

- no tiny buttons

- no complicated gestures

- confirmation before destructive actions

The app should be usable by an elderly person with limited smartphone experience.

==================================================

27. UI / VISUAL DESIGN

==================================================

Use a premium “AURORA CALM” design system.

Colors:

- Deep Midnight Navy

- Soft Teal

- Aurora Cyan

- Subtle Mint

- Warm Ivory/White

Design:

- rounded cards

- soft shadows

- subtle glassmorphism

- clean icons

- large typography

- generous spacing

- subtle gradients

- calm animations

Do NOT make it cyberpunk.

Do NOT use excessive neon.

Do NOT make it look like a gaming-only application.

The product should visually communicate:

CARE + MEMORY + SAFETY + AI + FAMILY.

Use high-quality realistic Indian senior imagery where appropriate.

==================================================

28. RESPONSIVE DESIGN

==================================================

The application must work properly on:

- mobile

- tablet

- desktop

Mobile is the PRIMARY experience.

Ensure:

- no horizontal overflow

- responsive cards

- accessible buttons

- readable text

- responsive navigation

==================================================

29. DEMO MODE

==================================================

Create a realistic demo mode so the complete application can be demonstrated even without connecting real external services.

Include sample demo data for:

- senior user

- caregiver

- medicines

- reminders

- appointments

- memory cues

- games

- progress

- notifications

Clearly label demo data where necessary.

Allow judges to experience:

1. Add medicine

2. Set medicine schedule

3. Reduce medicine stock

4. Trigger low-stock warning

5. Show caregiver alert

6. Play a cognitive game

7. View progress

8. Create a voice/text reminder

9. Add a family member

10. Trigger the SOS flow safely in demo mode

==================================================

30. ERROR HANDLING

===============================================

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d4ef14f7-6ba1-4db5-8da1-059326481699).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
