import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PLACEHOLDER_URL = "https://looped-placeholder.vercel.app";
const PLACEHOLDER_ORIGIN = "https://looped-placeholder.vercel.app";

const games = [
  {
    id: "language_learning",
    title: "Language Learning",
    subtitle: "Learn words, one swipe at a time",
    description: "A micro flashcard game for building vocabulary in Spanish, French, or Japanese.",
    creatorName: "LOOPED",
    status: "active",
    primaryGenre: "learn",
    tags: JSON.stringify(["language", "education", "flashcards"]),
    sessionLengthSec: 60,
    inputModes: JSON.stringify(["tap"]),
    orientation: "portrait",
    contentRating: "E",
    lanes: JSON.stringify(["learn"]),
  },
  {
    id: "study_quiz",
    title: "Study Quiz",
    subtitle: "Test yourself fast",
    description: "Quick-fire trivia covering history, science, and pop culture.",
    creatorName: "LOOPED",
    status: "active",
    primaryGenre: "learn",
    tags: JSON.stringify(["trivia", "education", "quiz"]),
    sessionLengthSec: 45,
    inputModes: JSON.stringify(["tap"]),
    orientation: "portrait",
    contentRating: "E",
    lanes: JSON.stringify(["learn"]),
  },
  {
    id: "slithercow",
    title: "SlitherCow",
    subtitle: "Snake, but make it bovine",
    description: "Classic snake gameplay with a chaotic cow skin and power-ups.",
    creatorName: "LOOPED",
    status: "active",
    primaryGenre: "arcade",
    tags: JSON.stringify(["snake", "arcade", "casual"]),
    sessionLengthSec: 90,
    inputModes: JSON.stringify(["swipe", "tap"]),
    orientation: "portrait",
    contentRating: "E",
    lanes: JSON.stringify(["main"]),
  },
  {
    id: "word_puzzle",
    title: "Word Puzzle",
    subtitle: "Find the hidden word",
    description: "Wordle-inspired puzzle where you guess the mystery word in 6 tries.",
    creatorName: "LOOPED",
    status: "active",
    primaryGenre: "puzzle",
    tags: JSON.stringify(["word", "puzzle", "casual"]),
    sessionLengthSec: 120,
    inputModes: JSON.stringify(["tap"]),
    orientation: "portrait",
    contentRating: "E",
    lanes: JSON.stringify(["main"]),
  },
  {
    id: "blueprint_analyzer",
    title: "Blueprint Analyzer",
    subtitle: "AI-powered floor plan reader",
    description: "Upload or scan a blueprint and get instant spatial analysis.",
    creatorName: "LOOPED",
    status: "active",
    primaryGenre: "tool",
    tags: JSON.stringify(["tool", "AI", "productivity"]),
    sessionLengthSec: 300,
    inputModes: JSON.stringify(["tap", "drag"]),
    orientation: "auto",
    contentRating: "E",
    lanes: JSON.stringify(["tools"]),
  },
  {
    id: "shooter_three",
    title: "Shooter",
    subtitle: "Tap, aim, destroy",
    description: "Fast-paced wave shooter. How many waves can you survive?",
    creatorName: "LOOPED",
    status: "active",
    primaryGenre: "arcade",
    tags: JSON.stringify(["shooter", "arcade", "action"]),
    sessionLengthSec: 60,
    inputModes: JSON.stringify(["tap", "drag"]),
    orientation: "portrait",
    contentRating: "E10",
    lanes: JSON.stringify(["main"]),
  },
  {
    id: "staging_3d",
    title: "3D Staging",
    subtitle: "Design your space in 3D",
    description: "Drag and drop furniture into a 3D room to see how it looks.",
    creatorName: "LOOPED",
    status: "active",
    primaryGenre: "create",
    tags: JSON.stringify(["3D", "design", "creative"]),
    sessionLengthSec: 600,
    inputModes: JSON.stringify(["drag", "tap"]),
    orientation: "landscape",
    contentRating: "E",
    lanes: JSON.stringify(["creative"]),
  },
  {
    id: "cow_crush",
    title: "Cow Crush",
    subtitle: "Match cows, earn moos",
    description: "Match-3 puzzle with a farmyard twist. Chain combos for mega scores.",
    creatorName: "LOOPED",
    status: "active",
    primaryGenre: "puzzle",
    tags: JSON.stringify(["match3", "puzzle", "casual", "arcade"]),
    sessionLengthSec: 90,
    inputModes: JSON.stringify(["tap", "drag"]),
    orientation: "portrait",
    contentRating: "E",
    lanes: JSON.stringify(["main"]),
  },
];

const builds = games.map((g) => ({
  gameId: g.id,
  version: "1.0.0",
  url: `${PLACEHOLDER_URL}/games/${g.id}/`,
  entry: "index.html",
  allowedOrigin: PLACEHOLDER_ORIGIN,
  featuresJson: JSON.stringify({
    supports_pause: true,
    supports_resume: true,
    audio: false,
    haptics: false,
    share_snapshot: false,
  }),
  isActive: true,
}));

async function main() {
  console.log("🌱 Seeding database...");

  for (const game of games) {
    await prisma.game.upsert({
      where: { id: game.id },
      update: game,
      create: game,
    });
  }

  console.log(`✅ Seeded ${games.length} games`);

  for (const build of builds) {
    const existing = await prisma.gameBuild.findFirst({
      where: { gameId: build.gameId, version: build.version },
    });
    if (!existing) {
      await prisma.gameBuild.create({ data: build });
    }
  }

  console.log(`✅ Seeded ${builds.length} game builds`);
  console.log("🎮 LOOPED is ready to loop!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
