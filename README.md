# FlowTrack 📚✨

> My capstone project for senior year - a complete calendar and hall pass management system for schools with rotational schedules!

## What Is This?

FlowTrack is basically like if SmartPass and Google Calendar had a baby, but actually designed for schools that use rotating letter day schedules (A-G days). I built this because our school's current system is... not great lol. 

The whole thing has a cute pastel aesthetic with soft gradients because I was tired of every school app looking like it was designed in 2005 😅

## Features

### For Students 🎒
- **Hall Pass System**: Request passes to go anywhere (bathroom, nurse, guidance, etc.)
- **Bathroom Capacity Tracking**: No more awkward "bathroom is full" situations
- **Calendar View**: See all your assignments and upcoming flex blocks
- **Letter Day Schedule**: Always know if it's an A, B, C, D, E, F, or G day (This is specific to CHS)
- **Dark Mode**: Because sometimes you're checking your schedule at 2am ☠️

### For Teachers 👨‍🏫
- **Create Hall Passes**: Approve student requests with live countdown timers
- **Hall Monitoring**: See who's out and for how long in real-time
- **Calendar Management**: Post assignments and create flex block opportunities 
- **Flex Block Scheduling**: Set up extra help sessions with repeat scheduling (Specific to CHS)
- **Track Room Origins**: Know which class students are coming from

### For Administrators 🔐
- **CSV Student Assignment**: Auto-assign students to flex blocks via spreadsheet upload
- **Snow Day Scheduling**: Push back the letter day rotation when school closes
- **Semester Class Switches**: Auto-swap classes between semesters (like Western Civ → CAD)
- **Exam Scheduling**: Complete system for managing exam periods
- **Calendar Updates**: Upload .txt files to bulk-update the calendar
- **Help/Bug Reports**: Integrated with Google Sheets to track issues

## Tech Stack

Built with:
- **React** - because functional components >>> class components
- **TypeScript** - saved me from so many dumb bugs
- **Tailwind CSS** - for that pastel gradient goodness
- **localStorage** - keeps everything synced between users
- **Lucide React** - for clean, modern icons
- **Vite** - way faster than Create React App

## How The Letter Day System Works

CHS has 7 classes that rotate through letter days A-G:
- **Day A**: Period 1 → Period 2 → Period 3... etc.
- **Day B**: Period 6 → Period 7 → Period 1... etc.
- And so on!

FlowTrack automatically tracks which day it is and shows you the right schedule. It even handles holidays, snow days, and weird half-days.

## Semester Switching

One of the coolest features - classes automatically switch at semester:
- Western Civilization → CAD
- Holocaust Studies → Physical Education

This was actually really tricky to implement because I had to make sure the calendar items transferred correctly and teacher assignments updated properly.

## Test Accounts

I set up some test accounts with Genshin Impact and Persona character names because why not:

**Students:**
- Diluc (has different schedule than Diona)
- Diona

**Teachers:**
- Joker (teaches classes from Diluc's schedule)
- Ann (teaches classes from Diona's schedule)

**Admin:**
- Use the admin login to access all the backend features

## Hall Pass System

This was probably the hardest part to get right. The system:
1. Tracks bathroom capacity (max 3 students at a time)
2. Shows live countdown timers for active passes
3. Lets teachers see which room students came from
4. Auto-expires passes after the time limit
5. Stores pass history for accountability

## Setup & Deployment

Since I'm working on a school Chromebook (can't install Git 😭), I used:
- **GitHub.dev** for uploading code
- **Vercel** for deployment

The app is completely frontend-based with localStorage, so it deploys super easily!

### To Run Locally:
```bash
npm install
npm run dev
```

### Deployment Notes:

This project was built specifically for presentation via **Figma Make + GitHub**, not for production deployment. If you want to deploy it to a hosting service:

- The app is completely frontend-based with localStorage
- Works on Vercel, Netlify, GitHub Pages, etc.

## Known Issues

- localStorage means data doesn't sync between devices (would need a real backend for that)
- There is Google Sheets API integration, just a bit buggy
- Pass notifications don't persist through page refreshes
- The CSV upload only works with a specific format

## Future Improvements

If I had more access to proper programming software, I would add:
- [ ] Real backend with database (probably Firebase or Supabase)
- [ ] Push notifications for pass approvals
- [ ] Mobile app version
- [ ] Parent portal to see student passes
- [ ] Integration with actual school systems
- [ ] Better data persistence

## Why I Built This

Honestly? Our current hall pass system is literally paper slips, and our calendar is just posted PDFs on the school website. I figured for my capstone I could build something that actually solves a real problem at our school.

Plus, this was a great way to learn React, TypeScript, and build something portfolio-worthy for college apps 🎓

## Screenshots

(I should probably add screenshots here but I'm pushing this to GitHub during AP Statistics and want to get it deployed first lol)

## Credits

Built by me for my senior capstone project (2025-2026 school year)

Special thanks to:
- My capstone advisor for letting me run with this idea
- The teachers who gave feedback on the UI
- Stack Overflow for answering my 3am coding questions
- Coffee ☕

---

**Note**: This is a student project for educational purposes. FlowTrack is not affiliated with SmartPass or any official school management system. Don't use this for collecting actual student PII without proper security measures!

**Another Note**: Please do not steal and name it as your own. This is my personal project. You can take the source code and evolve it, though, don't use the name FlowTrack.
