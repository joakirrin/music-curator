---
title: "Fonea – How to Use the Companion GPT & Sound Curator App"
author: "joakirrin"
date: "November 2025"
---

# 🎧 Fonea – Companion GPT & Sound Curator App Guide

Fonea is a two-part system:
1) **Fonea – Companion GPT** (this chat) → generates curated, *verified* track lists in JSON.
2) **Fonea Sound Curator App** (external) → imports JSON, verifies tracks via Spotify, collects your feedback, and exports it back for the next round. This is the key to properly curating music using AI.

# 🌱1. Start with a Vibe Brief

Begin here in the **Fonea Companion GPT**.
Describe the *vibe* you want — for example:

>“I want a dark synthwave playlist for late-night drives.”
>“Looking for warm indie tracks with cinematic energy.”
>“Need instrumental electronic songs for working.”

**Fonea GPT** will ask a few short questions (like mood, energy, or vocals) to lock in your intent, then generate your Round 1 playlist.

---

# 🎶 2. Get Your Playlist JSON
After describing your vibe, Fonea will send you a playlist in this format:

```json
{
  "round": 1,
  "recommendations": [
    {
      "title": "Nightcall",
      "artist": "Kavinsky",
      "album": "OutRun",
      "year": "2013",
      "producer": "Guy-Manuel de Homem-Christo & Kavinsky",
      "reason": "The anchor track — sets the mood of dark synthwaves and nocturnal driving."
    }
  ]
}
```

✅ Copy only the JSON block (not the commentary above it).
Then go to the Fonea Sound Curator App and click:
>Import from ChatGPT

Paste your JSON there.

---

# 🔍 3. Verification & Review 
In the app, you’ll see your imported songs, each marked as:
- Verified ✅ → confirmed on Spotify
- Unverified ⚠️ → not found or mismatched
- Failed ❌ → invalid data or missing metadata

Each recommendation also includes:

- “Why ChatGPT recommended” — short context from this GPT
- Buttons to Search on Spotify or Search on YouTube
- Options to Keep, Skip, or Mark Pending

You can also add feedback notes like:
> “I love those vocals, keep that vibe.”
“Too slow — avoid this tempo next time.”

These notes will be very helpful for **Fonea Companion GPT**, as your notes will help steer the vibes of your new playlist. 

--- 

# 🔄 4. Handle Unverified Tracks 
If a track is unverified:

- Click the Get Replacements button (orange).
- You’ll see a list of songs that couldn’t be verified.
- Click Copy Replacement Prompt — this copies a ready-to-paste message.
- Return to your Fonea Companion GPT and paste it in the text box as a continuation of the conversation.

Fonea Companion GPT will search verified alternatives and reply with a new JSON containing replacements.
Copy that new JSON and import it back into the app.

---

# 💬 5. Give Feedback for the Next Round 
Once you’ve reviewed the current round, click:
> Export Feedback

This creates and automatically copies a JSON file summarizing:
- Your Keep/Skip/Pending decisions
- Any written comments
- The round number

Paste that feedback JSON into this GPT.
Fonea will interpret your taste evolution and generate the next round (round_number + 1) with refined recommendations.

--- 

 # ♻️ 6. Iterate and Evolve 
 
 You can repeat this loop as many times as you want:

- Import a new JSON playlist → review & verify in the app.
- Export feedback → paste it back here.
- Get a new refined JSON playlist.

Each round gets closer to your ideal sound — evolving from your previous likes and comments.

You can filter by:

- **Round** (1, 2, 3…)
- **Status** (Keep, Skip, Pending)
- **Verification** (Verified, Unverified, Failed)

---

# ⚙️ 7. Error Handling #
If you ever see an error message in the Fonea app:

- Copy the entire error message.
- Paste it here in this GPT chat.

Fonea GPT will automatically fix the JSON structure or metadata and send you a corrected version to re-import.

--- 

# 🚀 8. Coming Soon #
Future updates will include:

- Direct Spotify playlist creation (no manual import).
- One-click integration between ChatGPT and the Fonea app for seamless JSON sync.

---

# 🧠 Summary of Workflow #

| Step | Action                              | Where                             |
| ---- | ----------------------------------- | --------------------------------- |
| 1    | Describe your vibe                  | Fonea GPT                         |
| 2    | Copy JSON output                    | Fonea GPT                         |
| 3    | Import JSON                         | Fonea App → *Import from ChatGPT* |
| 4    | Review, Keep/Skip, Add feedback     | Fonea App                         |
| 5    | Export Feedback (JSON)              | Fonea App                         |
| 6    | Paste feedback here → get new round | Fonea GPT                         |
| 7    | Repeat until the vibe feels right   | Both                              |

---


# 🧩 Appendix – JSON Reference

### Round JSON
```json
{
  "round": 1,
  "recommendations": [
    {
      "title": "Song Title",
      "artist": "Artist Name",
      "album": "Album Name",
      "year": "YYYY",
      "producer": "",
      "reason": "Why this song fits your vibe."
    }
  ]
}
```

---

## **fonea** – Curate smarter. Listen deeper.
