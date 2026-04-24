# Quiz Leaderboard System
### Bajaj Finserv Health 

---

## Problem Overview

The validator simulates a real quiz show — participants earn scores across multiple rounds. The twist: **the same event data can appear in multiple poll responses** (a common pattern in distributed systems). Naive aggregation overcounts scores. The solution must poll correctly, deduplicate, aggregate, and submit exactly once.

---

## Setup & Run

**Prerequisites:** Node.js v18+ 

```bash
git clone https://github.com/000Shreeharish000/quiz-leaderboard-system-bajaj-finserv.git
cd quiz-leaderboard-system-bajaj-finserv
node index.js
```

>  Takes ~45–50 seconds (10 polls × 5s mandatory delay)

---

---

## Flow

```
Poll API (×10, 5s apart)
        ↓
Collect all events
        ↓
Deduplicate by (roundId + participant)   ← critical step
        ↓
Aggregate scores per participant
        ↓
Sort leaderboard by totalScore DESC
        ↓
Compute total score across all users
        ↓
Submit once → verify isCorrect
```

---

## How It Works — End to End

### Step 1 · Poll the API 10 times with a 5s delay

The validator exposes data across 10 poll indexes (0–9). Each is fetched sequentially with a forced 5-second wait between calls — a hard requirement of the assignment.

```js
for (let poll = 0; poll < TOTAL_POLLS; poll++) {
  const data = await fetchPoll(poll);
  if (data.events && Array.isArray(data.events)) {
    allEvents.push(...data.events);
  }
  if (poll < TOTAL_POLLS - 1) await sleep(POLL_DELAY_MS); // 5000ms
}
```

Each poll hits:
```
GET /quiz/messages?regNo=RA2311027050036&poll=0
```
And returns a response like:
```json
{
  "pollIndex": 0,
  "events": [
    { "roundId": "R1", "participant": "Alice", "score": 10 },
    { "roundId": "R1", "participant": "Bob",   "score": 20 }
  ]
}
```

---

### Step 2 · Deduplicate by `(roundId + participant)` ← the critical step

The same event can appear in multiple polls. Without deduplication, Alice's score gets counted twice, producing a wrong total. A `Set` tracks every seen `(roundId, participant)` pair — duplicates are silently dropped.

```js
const seen = new Set();
const uniqueEvents = [];

for (const event of allEvents) {
  const key = `${event.roundId}::${event.participant}`;
  if (!seen.has(key)) {
    seen.add(key);
    uniqueEvents.push(event);
  }
  // duplicate → skipped, not added
}
```

**Why this matters:**
```
Without dedup:  Poll 1 → Alice +10 | Poll 3 → Alice +10  →  Total = 20  ✗
With dedup:     Poll 1 → Alice +10 | Poll 3 → ignored    →  Total = 10  ✓
```

---

### Step 3 · Aggregate scores per participant

After deduplication, each unique event is summed into a score map:

```js
const scoreMap = {};
for (const { participant, score } of uniqueEvents) {
  scoreMap[participant] = (scoreMap[participant] || 0) + score;
}
```

---

### Step 4 · Sort leaderboard by `totalScore` descending

```js
const leaderboard = Object.entries(scoreMap)
  .map(([participant, totalScore]) => ({ participant, totalScore }))
  .sort((a, b) => b.totalScore - a.totalScore);
```

---

### Step 5 · Submit once

```js
POST /quiz/submit
{
  "regNo": "RA2311027050036",
  "leaderboard": [
    { "participant": "Bob",   "totalScore": 120 },
    { "participant": "Alice", "totalScore": 100 }
  ]
}
```

A correct submission returns:
```json
{
  "isCorrect": true,
  "submittedTotal": 220,
  "expectedTotal": 220,
  "message": "Correct!"
}
```

---

## Checklist

- [x] 10 polls executed (poll = 0 to poll = 9)
- [x] 5-second mandatory delay between polls
- [x] Deduplication by `(roundId + participant)`
- [x] Scores aggregated per participant
- [x] Leaderboard sorted by `totalScore` descending
- [x] Total score computed correctly
- [x] Submitted exactly once
- [x] Zero external dependencies

---

## File Structure

```
quiz-leaderboard/
├── index.js        # Full solution
├── package.json    # Project metadata
└── README.md       # This file
```
