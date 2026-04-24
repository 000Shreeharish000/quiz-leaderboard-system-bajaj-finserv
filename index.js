const BASE_URL = "https://devapigw.vidalhealthtpa.com/srm-quiz-task";
const REG_NO = "RA2311027050036"; 
const TOTAL_POLLS = 10;
const POLL_DELAY_MS = 5000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPoll(pollIndex) {
  const url = `${BASE_URL}/quiz/messages?regNo=${REG_NO}&poll=${pollIndex}`;
  console.log(`[Poll ${pollIndex}] Fetching: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Poll ${pollIndex} failed: HTTP ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  console.log(
    `[Poll ${pollIndex}] Received ${data.events?.length ?? 0} events`
  );
  return data;
}

async function submitLeaderboard(leaderboard) {
  const url = `${BASE_URL}/quiz/submit`;
  const payload = { regNo: REG_NO, leaderboard };

  console.log("\n[Submit] Posting leaderboard to:", url);
  console.log("[Submit] Payload:", JSON.stringify(payload, null, 2));

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  return result;
}

async function main() {
  console.log("=".repeat(60));
  console.log("  Quiz Leaderboard System");
  console.log(`  Registration No: ${REG_NO}`);
  console.log("=".repeat(60));

 // Poll API 10 times and collect all events
  const allEvents = [];

  for (let poll = 0; poll < TOTAL_POLLS; poll++) {
    const data = await fetchPoll(poll);

    if (data.events && Array.isArray(data.events)) {
      allEvents.push(...data.events);
    }

    // 5s delay between polls (skip after the last one)
    if (poll < TOTAL_POLLS - 1) {
      console.log(`[Poll ${poll}] Waiting ${POLL_DELAY_MS / 1000}s...\n`);
      await sleep(POLL_DELAY_MS);
    }
  }

  console.log(`\n[Dedup] Total raw events collected: ${allEvents.length}`);

  // Deduplicate by (roundId + participant)
  const seen = new Set();
  const uniqueEvents = [];

  for (const event of allEvents) {
    const key = `${event.roundId}::${event.participant}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueEvents.push(event);
    } else {
      console.log(
        `[Dedup] Duplicate skipped → roundId=${event.roundId}, participant=${event.participant}`
      );
    }
  }

  console.log(`[Dedup] Unique events after deduplication: ${uniqueEvents.length}`);

  // Aggregate scores per participant
  const scoreMap = {};

  for (const event of uniqueEvents) {
    const { participant, score } = event;
    scoreMap[participant] = (scoreMap[participant] || 0) + score;
  }

  // Building leaderboard sorted by totalScore descending
  const leaderboard = Object.entries(scoreMap)
    .map(([participant, totalScore]) => ({ participant, totalScore }))
    .sort((a, b) => b.totalScore - a.totalScore);

  // Compute total score
  const totalScore = leaderboard.reduce((sum, p) => sum + p.totalScore, 0);

  console.log("\n" + "=".repeat(60));
  console.log("  LEADERBOARD");
  console.log("=".repeat(60));
  leaderboard.forEach((entry, i) => {
    console.log(
      `  #${i + 1}  ${entry.participant.padEnd(20)} ${entry.totalScore}`
    );
  });
  console.log("-".repeat(60));
  console.log(`  Combined Total Score: ${totalScore}`);
  console.log("=".repeat(60));

  // Submit leaderboard once
  const result = await submitLeaderboard(leaderboard);

  console.log("\n[Submit] Response:");
  console.log(JSON.stringify(result, null, 2));

  if (result.isCorrect) {
    console.log("\n Leaderboard is correct.");
  } else {
    console.log("\n MISMATCH! Check deduplication logic.");
    console.log(
      `    Submitted total: ${result.submittedTotal}, Expected: ${result.expectedTotal}`
    );
  }
}

main().catch((err) => {
  console.error("\n[FATAL]", err.message);
  process.exit(1);
});
