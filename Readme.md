# Quiz Leaderboard System
### Bajaj Finserv Health 

---

## Setup & Run

### Prerequisites
- Node.js v18 or higher (uses built-in `fetch`)

### Steps

```bash
clone the repository or download zip
#2. Enter the Directory 
cd quiz-leaderboard-system-bajaj-finserv
# 3. Run
node index.js
```

> ⏱ The script takes ~45 seconds (10 polls × 5s delay)

---

## Problem Overview

A backend integration challenge: poll a validator API 10 times, deduplicate events by `(roundId + participant)`, aggregate scores, and submit a correct leaderboard — once.

---

## Solution Design

```
Poll API (x10, 5s apart)
        ↓
Collect all events
        ↓
Deduplicate by (roundId + participant)  ← key step
        ↓
Aggregate scores per participant
        ↓
Sort leaderboard by totalScore DESC
        ↓
Submit once → verify isCorrect
```

---

## Key Insight: Deduplication

The same API response data can appear in multiple polls. If processed naively, scores would be double/triple-counted. The fix:

```js
const seen = new Set();
for (const event of allEvents) {
  const key = `${event.roundId}::${event.participant}`;
  if (!seen.has(key)) {
    seen.add(key);
    uniqueEvents.push(event);  // only count first occurrence
  }
}
```

This ensures each `(roundId, participant)` pair is counted exactly once, regardless of how many times it appears across polls.

---


## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/quiz/messages?regNo=&poll=` | Fetch events for a poll index (0–9) |
| POST | `/quiz/submit` | Submit the final leaderboard |

**Base URL:** `https://devapigw.vidalhealthtpa.com/srm-quiz-task`

## Checklist

- [x] 10 polls executed (poll=0 to poll=9)
- [x] 5-second mandatory delay between polls
- [x] Deduplication by `(roundId + participant)`
- [x] Scores aggregated per participant
- [x] Leaderboard sorted by `totalScore` descending
- [x] Submitted exactly once
- [x] No external dependencies (uses Node.js built-in `fetch`)

---

## File Structure

```
quiz-leaderboard/
├── index.js       # Main solution
├── package.json   # Project metadata
└── README.md      # This file
```
