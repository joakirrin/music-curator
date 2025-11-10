# 🎧 Welcome to Fonea

For Fonea to work, the user must log into spotify in the Fonea App - above anything. Otherwise the app will not verify the songs and nothing makes sense. They can access the Fonea App here https://music-curator-self.vercel.app/ 

Two pieces work together:


1) **Fonea Companion GPT** → proposes songs, according to your vibes andgenerates curated track lists in JSON
2) **Fonea Sound Curator App** → imports JSON, verifies tracks, collects your feedback, and exports it back.

> Open the Fonea Companion GPT here: [https://chatgpt.com/g/g-69095d95449c8191a6e34a297676dae2-fonea-companion-gpt](https://chatgpt.com/g/g-69095d95449c8191a6e34a297676dae2-fonea-companion-gpt)

---

## 🧠 Summary of Workflow

| Step | Action                              | Where                             |
| ---- | ----------------------------------- | --------------------------------- |
| 1    | Log Into Spotify                    | Fonea App                         |
| 2    | Describe your vibe                  | Fonea Companion GPT                         |
| 3    | Copy JSON output                    | Fonea Companion GPT                         |
| 4    | Import JSON                         | Fonea App → *Import from ChatGPT* |
| 5    | Review, Keep/Skip, Add feedback     | Fonea App                         |
| 6    | Export Feedback (JSON)              | Fonea App                         |
| 7    | Paste feedback here → get new round | Fonea Companion GPT                         |
| 8    | Repeat until the vibe feels right   | Both                              |
---

## 1) Log into your Spotify Account
Click the Log In with Spotify and verify your credentials

## 2) Start with a Vibe Brief (in GPT)
Begin here in the **Fonea Companion GPT**.
Describe the *vibe* you want — for example:

>“I want a dark synthwave playlist for late-night drives.”

>“Looking for warm indie tracks with cinematic energy.”

>“Need instrumental electronic songs for working.”


## 3) Import JSON (in the App)
Use **Import from ChatGPT** and paste the JSON block.


## 4&5) Verify & Review
- **Verified ✅** / **Unverified ⚠️** / **Failed ❌**
- Keep / Skip / Pending, plus short notes.
- Make sure to see why **Fonea Companion GPT** is recommending this song in the orange textbox


## 6) Replace Unverified
If a track is unverified:

- Click the Get Replacements button (orange).
- You’ll see a list of songs that couldn’t be verified.
- Click Copy Replacement Prompt — this copies a ready-to-paste message.
- Return to your Fonea Companion GPT and paste it in the text box as a continuation of the conversation.

Fonea Companion GPT will search verified alternatives and reply with a new JSON containing replacements.
Copy that new JSON and import it back into the app.


## 7) Export Feedback
Click **Export Feedback** and paste it back into GPT to get **Round N+1**.
**Make sure that you add some feedback of your own for Fonea Companion GPT** - this is where the magic really happens!


## 8) Iterate
Repeat import → review → export; the vibe evolves each round.


---
**Shortcuts**
- Filter by **Round**, **Status**, **Verification**.
- If errors, copy the message and paste it in GPT for a fix.



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

# **fonea** – Curate smarter. Listen deeper.
