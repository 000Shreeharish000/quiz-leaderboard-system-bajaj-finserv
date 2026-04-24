# Quiz Leaderboard System
### Bajaj Finserv Health — JAVA Qualifier | SRM | Internship Assignment

---

## Expected Flow

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

## Setup & Run

### Prerequisites

- Node.js v18 or higher (uses built-in `fetch` — no external dependencies)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/000Shreeharish000/quiz-leaderboard-system-bajaj-finserv.git

# 2. Navigate to the project directory
cd quiz-leaderboard-system-bajaj-finserv

# 3. Run the script
node index.js
```

> ⏱ The script takes approximately **45–50 seconds** to complete (10 polls × 5s mandatory delay).

---

## API Reference

**Base URL:** `https://devapigw.vidalhealthtpa.com/srm-quiz-task`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/quiz/messages?regNo=&poll=` | Fetch events for a given poll index (0–9) |
| `POST` | `/quiz/submit` | Submit the final leaderboard |

### Deduplication Implementation

Each `(roundId, participant)` pair is tracked in a Set. On every subsequent poll, any pair already seen is discarded — ensuring each event is counted **exactly once** regardless of how many times it appears across polls.

```js
const seen = new Set();
const uniqueEvents = [];

for (const event of allEvents) {
  const key = `${event.roundId}::${event.participant}`;
  if (!seen.has(key)) {
    seen.add(key);
    uniqueEvents.push(event);
  }
}
```

---

## Checklist

- [x] 10 polls executed (poll = 0 to poll = 9)
- [x] 5-second mandatory delay between polls
- [x] Deduplication applied by `(roundId + participant)`
- [x] Scores aggregated per participant
- [x] Leaderboard sorted by `totalScore` descending
- [x] Total score computed correctly
- [x] Submitted exactly once
- [x] No external dependencies (uses Node.js built-in `fetch`)

---

## File Structure

```
quiz-leaderboard/
├── index.js        # Main solution
├── package.json    # Project metadata
└── README.md       # This file
```
