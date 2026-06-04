import type { GameState, LaneKind } from "./types";

export type DialogueSpeaker = "A" | "B";
export type DialogueTone = "neutral" | "instruction" | "success" | "danger";
export type DialogueEventType =
  | "OPENING_TUTORIAL"
  | "PANCAKE_COLLECTED"
  | "PANCAKES_4_OF_5"
  | "VILLAIN_REVEAL"
  | "FIRST_CATCH_HANDOFF"
  | "TARGET_CAUGHT"
  | "PLAYER_HIT"
  | "FIRST_OBSTACLE"
  | "REPEATED_FAILURE"
  | "TERRAIN_BREADCRUMB"
  | "FINAL_ENDING"
  | "DEFAULT";
export type DialogueTerrainTag =
  | "TRAFFIC_HEAVY"
  | "WATER_HEAVY"
  | "TRAIN_PRESENT"
  | "DIRT_HEAVY"
  | "GRASS_TOWN"
  | "MIXED_HARD"
  | "GENERIC";

export interface DialoguePanel {
  speaker: DialogueSpeaker;
  speakerLabel: string;
  text: string;
  tone: DialogueTone;
  eventType: DialogueEventType;
}

interface DialogueOptions {
  editMode: boolean;
  cheatMode: boolean;
}

interface DialogueLine {
  speaker: DialogueSpeaker;
  text: string;
  priority: number;
  tone?: DialogueTone;
  duration: number;
  eventType: DialogueEventType;
  cooldownKey?: string;
  cooldownSeconds?: number;
}

interface ActiveDialogue extends DialogueLine {
  startedAt: number;
  expiresAt: number;
}

type CatchCommentType = "FAST_CATCH" | "CLEAN_STREAK" | "FRIEND_RESCUE" | "NORMAL_CATCH";

const SPEAKER_LABELS: Record<DialogueSpeaker, string> = {
  A: "MR. AWESOME",
  B: "MR. NOT SO AWESOME",
};

export const REVEAL_LINE_DURATIONS = [4.2, 3.8, 3.4] as const;
export const REVEAL_TOTAL_SECONDS = REVEAL_LINE_DURATIONS.reduce((total, duration) => total + duration, 0);
export const FINAL_LINE_DURATIONS = [3.4, 3.1, 3.8, 3.4] as const;
const FINAL_LINE_GAP_SECONDS = 0.65;

const REVEAL_SEQUENCE: readonly DialogueLine[] = [
  line("B", "Thanks for the pancakes. I trapped your friends too!", 100, "VILLAIN_REVEAL", 4.2),
  line("A", "My friends? Give them back!", 100, "VILLAIN_REVEAL", 3.8),
  line("B", "Catch me first, hero!", 100, "VILLAIN_REVEAL", 3.4),
];

const FINAL_SEQUENCE: readonly DialogueLine[] = [
  line("B", "No! I ran out of road!", 110, "FINAL_ENDING", 3.4),
  line("A", "Then give back my friends!", 110, "FINAL_ENDING", 3.1),
  line("B", "Fine! They’re safe. Pancakes too!", 110, "FINAL_ENDING", 3.8),
  line("A", "Pancakes for everybody!", 110, "FINAL_ENDING", 3.4, "success"),
];

const PANCAKE_LINES = [
  "Pancakes!",
  "I love pancakes.",
  "Best breakfast ever.",
  "My friends will love these!",
  "One more for my friends!",
  "Almost enough for everybody!",
  "I can share these later.",
] as const;

const PANCAKE_ALMOST_LINES = [
  "One more pancake!",
  "One more for my friends!",
  "Almost got them all!",
  "Last pancake coming up!",
  "My friends will be so happy!",
] as const;

const FIRST_CATCH_LINES = [
  "Nice try, hero. Now the real chase starts!",
] as const;

const A_CATCH_LINES = [
  "Got you!",
  "Not so fast!",
  "I'm catching up!",
  "For my friends!",
  "Stay right there!",
  "No more tricks!",
  "I can do this!",
  "You can't run forever!",
  "Found you!",
  "Hero catch!",
  "Awesome catch!",
  "Back here, villain!",
  "Nice try!",
  "Not this time!",
  "I saw that shortcut!",
  "You forgot about me!",
  "Saving friends mode!",
  "Closer every time!",
  "I'm still coming!",
  "That was quick!",
  "Too easy!",
  "I can reach you!",
  "One step closer!",
  "You're not escaping!",
  "Give my friends back!",
  "Tell me where they are!",
  "Friends, I'm coming!",
  "You can't hide them forever!",
  "This is for my friends!",
  "Your plan is slipping!",
  "I'm getting faster!",
  "I knew I could catch you!",
  "Hold still!",
  "That's another catch!",
  "Hero on the move!",
  "Still awesome!",
  "Right behind you!",
  "You're slowing down!",
  "I won't give up!",
] as const;

const B_CATCH_LINES = [
  "Too close!",
  "Not again!",
  "Nope, new plan!",
  "I'm still calm.",
  "This was planned!",
  "Secret shortcut!",
  "I meant to do that.",
  "Okay, that was close.",
  "I'm not worried.",
  "Maybe a little worried.",
  "Wrong villain!",
  "Catch me again!",
  "That barely counts.",
  "Tiny problem!",
  "Villain reset!",
  "Emergency escape!",
  "You saw nothing.",
  "That was practice.",
  "That was a warm-up.",
  "I was testing you.",
  "I slipped on drama.",
  "My map lied.",
  "The road betrayed me.",
  "Okay, tiny setback.",
  "Still part of the plan.",
  "I need better shoes.",
  "I need better roads.",
  "No autograph, hero!",
  "I was taking a break.",
  "I was checking on you.",
  "Stop following so well!",
  "That catch was suspicious.",
  "I demand a redo.",
  "You are very persistent.",
  "That was almost impressive.",
  "Almost. Not quite.",
  "I'm leaving now.",
  "Good catch. Bad news.",
  "I have more plans!",
  "Villain backup plan!",
  "Plan B! Or C!",
] as const;

const B_FAST_CATCH_LINES = [
  "Already?!",
  "I just got here!",
  "That was too fast!",
  "Again already?",
  "Wait, wait, wait!",
  "I wasn't ready!",
  "Did you teleport?",
  "No fair, short chase!",
  "I blinked!",
  "Personal space, hero!",
  "Why are you so close?",
  "My escape was tiny!",
  "I need more lanes!",
  "That road was too short!",
  "Too much hero!",
  "Back up a little!",
  "New rule: stay back!",
  "That barely started!",
  "Can I get a head start?",
  "I require more distance!",
  "You are right there!",
  "How did you get here?",
  "I just escaped!",
  "That was my shortest plan!",
  "Give me five seconds!",
  "No catching so quickly!",
  "That was not dramatic enough!",
  "My villain entrance was wasted!",
  "Too soon, hero!",
  "I need a longer map!",
  "Stop speed-running me!",
  "This is not fair chasing!",
  "I was still posing!",
  "I didn't even turn around!",
  "My plan needs loading time!",
  "That catch came with no warning!",
] as const;

const B_ANNOYED_CATCH_LINES = [
  "Stop catching me!",
  "Why are you still here?",
  "Go save someone else!",
  "Shoo, hero!",
  "No more almost-catching!",
  "I said stay back!",
  "You are very annoying.",
  "This chase was easier in my head.",
  "Stop being so fast!",
  "I need a vacation.",
  "Villain work is hard.",
  "I should have stayed home.",
  "These roads are not helping.",
  "I need a better escape plan.",
  "Can you chase slower?",
  "I'm filing a complaint.",
  "That was my good shortcut!",
  "Stop ruining my villain day.",
  "You are bad for my confidence.",
  "I am trying to be mysterious!",
  "Do you mind?",
  "This is too much exercise.",
  "I am not built for this.",
  "My evil plan is sweating.",
  "Why do heroes have legs?",
  "I should have stolen a bike.",
  "Nobody told me heroes run.",
  "You are too close again.",
  "I need a snack break.",
] as const;

const B_FAKE_CALM_CATCH_LINES = [
  "I am completely calm.",
  "No panic here. None.",
  "Everything is very planned.",
  "I meant to run this way.",
  "This is my calm face.",
  "Villains do not panic.",
  "I'm simply relocating.",
  "All part of the plan.",
  "That catch meant nothing.",
  "I am still winning, probably.",
  "I expected that.",
  "Totally expected that.",
  "Still calm. Very calm.",
  "My plan has layers.",
  "That was layer one.",
  "Nothing to worry about.",
  "I am not worried at all.",
  "Only a tiny worry.",
  "Maybe medium worry.",
  "Ignore my nervous running.",
  "This is strategic fleeing.",
  "I am calmly escaping.",
  "Very normal villain behavior.",
  "I planned this accident.",
  "That was a practice catch.",
  "My confidence is fine.",
  "Absolutely fine.",
  "Fine-ish.",
  "Mostly fine.",
  "Hero pressure means nothing.",
] as const;

const B_ESCAPE_LINES = [
  "Secret shortcut!",
  "New hiding spot!",
  "You'll never guess!",
  "Follow me, maybe.",
  "Wrong way, probably.",
  "I know a hidden road.",
  "Next stop: not telling.",
  "The map is on my side.",
  "Try to keep up.",
  "I left a clue. Maybe.",
  "This way to trouble!",
  "Your friends are ahead!",
  "Your friends are close. Maybe.",
  "No friends here!",
  "I moved the friends!",
  "Find me first!",
  "One secret road, coming up.",
  "Vanishing now!",
  "Poof! Villain style!",
  "Catch the smoke!",
  "My escape is awesome. Wait.",
  "Do not follow the puff.",
  "The puff is private.",
  "Shortcut number seven!",
  "Hidden road time!",
  "I have places to flee.",
  "My secret plan continues.",
  "Follow the suspicious road!",
] as const;

const A_FRIEND_RESCUE_LINES = [
  "Where are my friends?",
  "I'll find them!",
  "Friends, I'm coming!",
  "Give my friends back!",
  "This is for my friends!",
  "You can't hide them forever!",
  "Tell me where they are!",
  "My friends need me!",
  "I won't leave them!",
  "I'm saving everybody!",
  "Hold on, friends!",
  "One catch closer!",
  "I know they're ahead!",
  "I'm not stopping!",
  "Friends first!",
] as const;

const B_FRIEND_RESCUE_LINES = [
  "Your friends are this way!",
  "They're still ahead!",
  "Find me, find them!",
  "No friends here!",
  "Better hurry, hero!",
  "I hid them very well.",
  "Villain secret!",
  "They are waiting. Maybe.",
  "Your friends say hurry!",
  "They are farther ahead!",
  "Keep chasing, hero!",
  "I know where they are!",
  "You need me to find them!",
  "Good luck guessing!",
] as const;

const A_CLEAN_STREAK_LINES = [
  "I'm on a roll!",
  "Clean crossing!",
  "No bumps so far!",
  "I'm getting better!",
  "I see the pattern!",
  "I can time this!",
  "Still awesome!",
  "That was smooth.",
  "Watch, wait, go!",
  "Nice and careful.",
  "One step at a time!",
  "I've got this!",
  "Roads don't scare me!",
  "Smooth moves!",
  "I'm moving smart!",
  "Careful works!",
  "I'm catching the rhythm!",
  "That was a good run!",
  "Friends, I'm coming fast!",
  "Hero focus!",
  "Fast and careful!",
  "No stopping now!",
  "I can read the road!",
  "That timing felt good!",
  "I'm really moving now!",
] as const;

const B_CLEAN_STREAK_LINES = [
  "Stop being careful!",
  "No bumps? Rude.",
  "Can you bonk once?",
  "The traffic is fired.",
  "Cars, you had one job!",
  "Why are you good at this?",
  "Who taught you timing?",
  "Stop using your eyes!",
  "The roads were supposed to help!",
  "Okay, this is annoying.",
  "You're making this hard.",
  "I demand more obstacles!",
  "Traffic, do something!",
  "Logs, help me out!",
  "Trains, where are you?",
  "That was too smooth.",
  "I do not like this skill.",
  "You're not supposed to improve!",
  "Hero practice is unfair.",
  "I need a harder road.",
  "Can someone slow him down?",
  "Your shoes are too fast.",
  "I preferred you slower.",
  "This chase needs more chaos.",
  "Why are you still clean?",
] as const;

const FAST_CLEAN_COMBO_LINES = [
  "Already? And no bonks?",
  "This hero is too clean!",
  "No bumps and another catch?",
  "That was unfairly smooth.",
  "You caught me perfectly. Annoying.",
  "Okay, you practiced.",
  "Who gave you hero lessons?",
  "This is not normal chasing.",
  "You're too good today.",
  "Clean run, mean hero.",
  "I miss traffic already.",
  "Why is nothing stopping you?",
  "Even the roads are impressed.",
  "I am not impressed. Maybe.",
  "That was smooth. I hate it.",
  "Stop being awesome!",
  "Your name is too accurate.",
  "Fine, that was good.",
  "Do not smile, hero.",
] as const;

const A_HIT_LINES = [
  "Oops. Try again.",
  "Careful now.",
  "I need a better gap.",
  "Back up and try again.",
  "Still okay!",
  "Try again, slower.",
  "I'll watch first.",
  "I'm still awesome.",
] as const;

const A_REPEATED_HELP_LINES = [
  "Try one step at a time.",
  "Wait longer.",
  "Watch the pattern.",
  "Use the safe lane.",
  "No rush.",
  "Look before jumping.",
] as const;

const ROAD_TUTORIAL_LINES = [
  "Cars! Wait for a gap.",
  "Watch the cars.",
  "Move when it's clear.",
  "Look for the opening.",
  "Cross when it's safe.",
] as const;

const WATER_TUTORIAL_LINES = [
  "Logs float. Jump on them!",
  "Stay on the logs!",
  "Don't splash!",
  "Jump when the log comes.",
  "Water means wait for logs.",
] as const;

const TRAIN_TUTORIAL_LINES = [
  "Whoa, train! Wait!",
  "Hear that train?",
  "Rails are fast!",
  "Stop for trains.",
  "Watch the rails.",
] as const;

const B_TERRAIN_LINES: Record<DialogueTerrainTag, readonly string[]> = {
  TRAFFIC_HEAVY: [
    "Roads ahead. Good luck!",
    "Traffic time!",
    "Look both ways, hero!",
    "I picked the busy road.",
    "Hope you like traffic.",
  ],
  WATER_HEAVY: [
    "Logs ahead. Don't splash!",
    "The logs are moving!",
    "Wet shoes ahead!",
    "Hop carefully!",
    "Water shortcut. Maybe.",
  ],
  TRAIN_PRESENT: [
    "Hear that train?",
    "Train time!",
    "Rails ahead!",
    "Don't race that train.",
    "Mind the tracks!",
  ],
  DIRT_HEAVY: [
    "Dusty shortcut!",
    "This path is dusty.",
    "Dirt roads, villain rules.",
    "Follow the dusty clues.",
  ],
  GRASS_TOWN: [
    "Cute town. Bad shortcut!",
    "Nice grass. Bad chase!",
    "I know this town!",
    "Don't trust the cute road.",
  ],
  MIXED_HARD: [
    "Busy part ahead!",
    "Roads, logs, chaos!",
    "Pick carefully, hero.",
    "This part is tricky.",
    "Everything is happening!",
  ],
  GENERIC: [
    "I'm just ahead!",
    "Your friends are closer!",
    "Don't lose me!",
    "This way, hero!",
    "Keep chasing!",
  ],
};

export class DialogueDirector {
  private active: ActiveDialogue | undefined;
  private recentTexts: string[] = [];
  private cooldowns = new Map<string, number>();
  private oneShots = new Set<string>();
  private lowPriorityTimes: number[] = [];
  private repeatedHitCount = 0;
  private lastRunId = -1;
  private lastSpeaker: DialogueSpeaker | undefined;
  private speakerStreak = 0;
  private nextAmbientAttemptAt = 0;
  private catchesSinceLastHit = 0;
  private lastHitTime = -Infinity;
  private lastTargetRespawnTime = 0;
  private lastCleanCatchCommentAt = -Infinity;
  private lastCleanCatchCount = 0;
  private catchSpeakerBag: DialogueSpeaker[] = [];
  private lastCatchSpeaker: DialogueSpeaker | undefined;
  private sameSpeakerCatchStreak = 0;
  private recentCatchTexts: string[] = [];
  private suppressAmbientUntil = 0;

  update(previous: GameState | undefined, state: GameState, options: DialogueOptions): DialoguePanel | undefined {
    if (state.runId !== this.lastRunId) this.reset(state.runId);
    this.trackTargetRespawn(previous, state);

    const finalPanel = finalSequencePanel(state);
    if (finalPanel) {
      this.active = undefined;
      return finalPanel;
    }
    if (options.editMode) return fixedPanel("B", "Edit Mode", "instruction", "DEFAULT");
    if (options.cheatMode) return fixedPanel("B", "Cheat Mode", "instruction", "DEFAULT");
    if (state.phase === "complete") return fixedPanel("B", "Mr. Not So Awesome is temporarily impressed.", "success", "DEFAULT");
    if (state.phase === "crashed") return fixedPanel("A", state.crashReason ? `Ouch: ${state.crashReason}.` : "That was less awesome.", "danger", "DEFAULT");

    const revealPanel = revealSequencePanel(state);
    if (revealPanel) return revealPanel;

    const openingPanel = openingTutorialPanel(state);
    if (openingPanel) {
      this.active = undefined;
      return openingPanel;
    }
    if (this.active?.eventType === "OPENING_TUTORIAL") this.active = undefined;

    if (isFirstCatchHandoff(state)) {
      this.active = undefined;
      return panelFromLine(line("B", FIRST_CATCH_LINES[0], 95, "FIRST_CATCH_HANDOFF", 2.6, "instruction"), state.time + 0.3);
    }

    const firstChasePanel = firstChasePromptPanel(state);
    if (firstChasePanel) {
      this.active = undefined;
      return firstChasePanel;
    }

    const eventLine = this.eventLine(previous, state);
    if (eventLine) this.activate(eventLine, state.time);

    if (!this.active || this.active.expiresAt <= state.time) {
      this.active = undefined;
      const ambientLine = this.ambientLine(state);
      if (ambientLine) this.activate(ambientLine, state.time);
    }

    if (this.active && this.active.expiresAt > state.time) return panelFromLine(this.active, this.active.expiresAt);
    return undefined;
  }

  private reset(runId: number): void {
    this.active = undefined;
    this.recentTexts = [];
    this.cooldowns.clear();
    this.oneShots.clear();
    this.lowPriorityTimes = [];
    this.repeatedHitCount = 0;
    this.lastRunId = runId;
    this.lastSpeaker = undefined;
    this.speakerStreak = 0;
    this.nextAmbientAttemptAt = 0;
    this.catchesSinceLastHit = 0;
    this.lastHitTime = -Infinity;
    this.lastTargetRespawnTime = 0;
    this.lastCleanCatchCommentAt = -Infinity;
    this.lastCleanCatchCount = 0;
    this.catchSpeakerBag = [];
    this.lastCatchSpeaker = undefined;
    this.sameSpeakerCatchStreak = 0;
    this.recentCatchTexts = [];
    this.suppressAmbientUntil = 0;
  }

  private eventLine(previous: GameState | undefined, state: GameState): DialogueLine | undefined {
    if (!previous) return undefined;

    const nextRecoveredEvent = state.stage.lastEvent?.startsWith("Recovered from") ? state.stage.lastEvent : undefined;
    const previousRecoveredEvent = previous.stage.lastEvent?.startsWith("Recovered from") ? previous.stage.lastEvent : undefined;
    const recovered = Boolean(nextRecoveredEvent && nextRecoveredEvent !== previousRecoveredEvent);
    if (recovered) {
      this.repeatedHitCount += 1;
      this.catchesSinceLastHit = 0;
      this.lastHitTime = state.time;
      const pool = this.repeatedHitCount >= 2 ? A_REPEATED_HELP_LINES : A_HIT_LINES;
      return this.pickLine("A", pool, 85, "PLAYER_HIT", state, {
        tone: "danger",
        duration: durationForText(pool[0] ?? "", "tiny"),
        cooldownKey: "hit",
        cooldownSeconds: 2.2,
      });
    }

    if (state.stage.catchCount > previous.stage.catchCount && state.stage.catchCount > 1) {
      return this.catchLine(state);
    }

    if (state.stage.mode === "introPancakes" && state.collectedPancakes.size > previous.collectedPancakes.size) {
      const introCount = countIntroPancakes(state);
      if (introCount >= 4) {
        return this.pickLine("A", PANCAKE_ALMOST_LINES, 30, "PANCAKES_4_OF_5", state, {
          tone: "instruction",
          duration: 3.1,
          cooldownKey: "pancake",
          cooldownSeconds: 3.2,
        });
      }
      return this.pickLine("A", PANCAKE_LINES, 20, "PANCAKE_COLLECTED", state, {
        tone: "neutral",
        duration: 2.2,
        cooldownKey: "pancake",
        cooldownSeconds: 4.5,
      });
    }

    return undefined;
  }

  private ambientLine(state: GameState): DialogueLine | undefined {
    if (state.phase !== "running" || isDangerLane(state) || isRevealSuppressed(state)) return undefined;
    if (state.time < this.suppressAmbientUntil) return undefined;
    if (state.time < this.nextAmbientAttemptAt) return undefined;
    this.nextAmbientAttemptAt = state.time + 4 + seededUnit(state) * 3;

    if (state.stage.mode === "introPancakes") {
      return this.pickLine("A", PANCAKE_LINES, 10, "PANCAKE_COLLECTED", state, {
        tone: "neutral",
        duration: 3.0,
        cooldownKey: "intro-ambient",
        cooldownSeconds: 4.5,
      });
    }

    if (state.stage.mode === "summoning") return undefined;
    if (state.stage.mode !== "chase") return undefined;

    const obstacle = firstUnseenObstacleAhead(state, this.oneShots);
    if (obstacle) {
      this.oneShots.add(`obstacle:${obstacle}`);
      const pool = obstacle === "road" ? ROAD_TUTORIAL_LINES : obstacle === "river" ? WATER_TUTORIAL_LINES : TRAIN_TUTORIAL_LINES;
      return this.pickLine("A", pool, 80, "FIRST_OBSTACLE", state, {
        tone: "instruction",
        duration: 3.4,
        cooldownKey: `tutorial:${obstacle}`,
        cooldownSeconds: 12,
      });
    }

    if (state.stage.catchCount < 2) return undefined;
    const cooldown = state.stage.catchCount >= 3 ? 4.5 : 6.5;
    const tag = terrainTagForState(state);
    return this.pickLine("B", B_TERRAIN_LINES[tag], 45, "TERRAIN_BREADCRUMB", state, {
      tone: "neutral",
      duration: 3.0,
      cooldownKey: "b-banter",
      cooldownSeconds: cooldown,
    });
  }

  private pickLine(
    speaker: DialogueSpeaker,
    pool: readonly string[],
    priority: number,
    eventType: DialogueEventType,
    state: GameState,
    options: { tone?: DialogueTone; duration?: number; cooldownKey?: string; cooldownSeconds?: number },
  ): DialogueLine | undefined {
    if (options.cooldownKey && (this.cooldowns.get(options.cooldownKey) ?? -Infinity) > state.time) return undefined;
    if (priority < 50 && this.tooManyLowPriorityLines(state.time)) return undefined;
    if (priority < 90 && this.lastSpeaker === speaker && this.speakerStreak >= 2) return undefined;

    const usable = pool.filter((text) => !this.recentTexts.includes(text));
    const source = usable.length ? usable : pool;
    const text = source[positiveModulo(Math.floor(state.time * 10) + state.stage.catchCount * 7 + state.score * 3, source.length)] ?? pool[0];
    return {
      speaker,
      text,
      priority,
      tone: options.tone ?? "neutral",
      duration: options.duration ?? 2.2,
      eventType,
      cooldownKey: options.cooldownKey,
      cooldownSeconds: options.cooldownSeconds,
    };
  }

  private activate(lineToShow: DialogueLine, time: number): void {
    if (this.active && this.active.expiresAt > time && this.active.priority > lineToShow.priority) return;
    this.active = { ...lineToShow, startedAt: time, expiresAt: time + lineToShow.duration };
    if (lineToShow.cooldownKey) this.cooldowns.set(lineToShow.cooldownKey, time + (lineToShow.cooldownSeconds ?? lineToShow.duration));
    if (lineToShow.priority < 50) this.lowPriorityTimes.push(time);
    this.lowPriorityTimes = this.lowPriorityTimes.filter((startedAt) => time - startedAt <= 20);
    this.recentTexts = [lineToShow.text, ...this.recentTexts.filter((text) => text !== lineToShow.text)].slice(0, 8);
    if (this.lastSpeaker === lineToShow.speaker) this.speakerStreak += 1;
    else {
      this.lastSpeaker = lineToShow.speaker;
      this.speakerStreak = 1;
    }
  }

  private trackTargetRespawn(previous: GameState | undefined, state: GameState): void {
    if (!previous) {
      if (state.stage.target.visible) this.lastTargetRespawnTime = state.time;
      return;
    }
    const targetBecameVisible = !previous.stage.target.visible && state.stage.target.visible;
    const targetMovedWhileVisible = previous.stage.target.visible
      && state.stage.target.visible
      && (previous.stage.target.x !== state.stage.target.x || previous.stage.target.z !== state.stage.target.z);
    if (targetBecameVisible || targetMovedWhileVisible) this.lastTargetRespawnTime = state.time;
  }

  private catchLine(state: GameState): DialogueLine | undefined {
    if (this.active?.eventType === "TARGET_CAUGHT" && state.time - this.active.startedAt < 1.0) return undefined;

    this.catchesSinceLastHit += 1;
    const catchType = this.catchCommentType(state);
    const speaker = this.catchSpeaker(state, catchType);
    const pool = this.catchPool(state, catchType, speaker);
    const text = this.pickCatchText(pool, state);
    if (!text) return undefined;

    if (catchType === "CLEAN_STREAK" || (catchType === "FAST_CATCH" && this.catchesSinceLastHit >= 3)) {
      this.lastCleanCatchCommentAt = state.time;
      this.lastCleanCatchCount = this.catchesSinceLastHit;
    }
    this.suppressAmbientUntil = state.time + 1.5;
    this.recentCatchTexts = [text, ...this.recentCatchTexts.filter((recent) => recent !== text)].slice(0, 12);
    this.repeatedHitCount = 0;
    if (this.lastCatchSpeaker === speaker) this.sameSpeakerCatchStreak += 1;
    else {
      this.lastCatchSpeaker = speaker;
      this.sameSpeakerCatchStreak = 1;
    }

    return {
      speaker,
      text,
      priority: 92,
      tone: "success",
      duration: durationForText(text, "catch"),
      eventType: "TARGET_CAUGHT",
      cooldownKey: "catch",
      cooldownSeconds: 1.1,
    };
  }

  private catchCommentType(state: GameState): CatchCommentType {
    const fastCatch = state.time - this.lastTargetRespawnTime < 4;
    const cleanReady = this.catchesSinceLastHit >= 3
      && (
        this.catchesSinceLastHit - this.lastCleanCatchCount >= 2
        || state.time - this.lastCleanCatchCommentAt >= 16
        || state.time - this.lastHitTime >= 18
      );
    if (fastCatch && cleanReady && seededUnit(state) < 0.6) return "CLEAN_STREAK";
    if (fastCatch) return "FAST_CATCH";
    if (cleanReady) return "CLEAN_STREAK";
    if (state.stage.catchCount >= 3 && state.stage.catchCount % 4 === 0 && seededUnit(state) < 0.55) return "FRIEND_RESCUE";
    return "NORMAL_CATCH";
  }

  private catchSpeaker(state: GameState, catchType: CatchCommentType): DialogueSpeaker {
    if (this.sameSpeakerCatchStreak >= 2 && this.lastCatchSpeaker) return this.lastCatchSpeaker === "A" ? "B" : "A";
    const roll = seededUnit(state);
    if (catchType === "FAST_CATCH") return roll < 0.82 ? "B" : "A";
    if (catchType === "CLEAN_STREAK") return roll < 0.55 ? "B" : "A";
    if (catchType === "FRIEND_RESCUE") return roll < 0.52 ? "A" : "B";
    if (state.stage.catchCount <= 2) return roll < 0.5 ? "A" : "B";
    const bagSpeaker = this.nextCatchBagSpeaker(state);
    return bagSpeaker ?? (roll < 0.7 ? "B" : "A");
  }

  private nextCatchBagSpeaker(state: GameState): DialogueSpeaker | undefined {
    if (state.stage.catchCount < 3) return undefined;
    if (!this.catchSpeakerBag.length) {
      this.catchSpeakerBag = shuffleSpeakers(["B", "B", "A", "B", "A", "B", "A"], state);
    }
    return this.catchSpeakerBag.shift();
  }

  private catchPool(state: GameState, catchType: CatchCommentType, speaker: DialogueSpeaker): readonly string[] {
    if (catchType === "FAST_CATCH") {
      if (speaker === "B" && this.catchesSinceLastHit >= 3 && seededUnit(state) < 0.35) return FAST_CLEAN_COMBO_LINES;
      return speaker === "B" ? B_FAST_CATCH_LINES : A_CATCH_LINES;
    }
    if (catchType === "CLEAN_STREAK") return speaker === "B" ? B_CLEAN_STREAK_LINES : A_CLEAN_STREAK_LINES;
    if (catchType === "FRIEND_RESCUE") return speaker === "B" ? B_FRIEND_RESCUE_LINES : A_FRIEND_RESCUE_LINES;
    if (speaker === "A") return state.stage.catchCount % 5 === 0 ? A_FRIEND_RESCUE_LINES : A_CATCH_LINES;
    if (state.stage.catchCount >= 4) {
      const roll = seededUnit(state);
      if (roll < 0.25) return B_ANNOYED_CATCH_LINES;
      if (roll < 0.5) return B_FAKE_CALM_CATCH_LINES;
      if (roll < 0.68) return B_ESCAPE_LINES;
    }
    return B_CATCH_LINES;
  }

  private pickCatchText(pool: readonly string[], state: GameState): string | undefined {
    const usable = pool.filter((text) => !this.recentCatchTexts.includes(text) && !this.recentTexts.includes(text));
    const source = usable.length ? usable : pool;
    return source[positiveModulo(Math.floor(state.time * 13) + state.stage.catchCount * 11 + state.score * 5, source.length)];
  }

  private tooManyLowPriorityLines(time: number): boolean {
    this.lowPriorityTimes = this.lowPriorityTimes.filter((startedAt) => time - startedAt <= 20);
    return this.lowPriorityTimes.length >= 5;
  }
}

export function terrainTagForState(state: GameState, lookAheadRows = 22): DialogueTerrainTag {
  const startZ = Math.round(state.player.z) + 1;
  const maxZ = Math.min(Math.max(...state.lanes.keys()), startZ + lookAheadRows);
  let roadCount = 0;
  let riverCount = 0;
  let trainCount = 0;
  let dirtCount = 0;
  let grassCount = 0;

  for (let z = startZ; z <= maxZ; z += 1) {
    const lane = state.lanes.get(z);
    if (!lane) continue;
    if (lane.kind === "road") roadCount += 1;
    else if (lane.kind === "river") riverCount += 1;
    else if (lane.kind === "train") trainCount += 1;
    else if (lane.terrain === "dirt") dirtCount += 1;
    else grassCount += 1;
  }

  const hazards = roadCount + riverCount + trainCount;
  if ((trainCount > 0 && hazards >= 3) || [roadCount, riverCount, trainCount].filter((count) => count > 0).length >= 2) return "MIXED_HARD";
  if (trainCount > 0) return "TRAIN_PRESENT";
  if (riverCount >= 2) return "WATER_HEAVY";
  if (roadCount >= 3) return "TRAFFIC_HEAVY";
  if (dirtCount > grassCount + 2) return "DIRT_HEAVY";
  if (grassCount + dirtCount > 0) return "GRASS_TOWN";
  return "GENERIC";
}

function revealSequencePanel(state: GameState): DialoguePanel | undefined {
  if (state.stage.summonStartedAt === undefined || state.stage.catchCount > 0 || state.stage.introCameraHandoffStartedAt !== undefined) return undefined;
  const elapsed = state.time - state.stage.summonStartedAt + (state.stage.revealConversationAdvanceSeconds ?? 0);
  if (elapsed < 0) return undefined;
  let cursor = 0;
  for (const revealLine of REVEAL_SEQUENCE) {
    cursor += revealLine.duration;
    if (elapsed <= cursor) return panelFromLine(revealLine, state.time + revealLine.duration);
  }
  return undefined;
}

function isFirstCatchHandoff(state: GameState): boolean {
  return state.stage.mode === "chase"
    && state.stage.catchCount === 1
    && !state.stage.introCameraHandoffDone
    && state.stage.introCameraHandoffStartedAt !== undefined
    && state.stage.introCameraHandoffReleaseAt !== undefined;
}

function firstChasePromptPanel(state: GameState): DialoguePanel | undefined {
  if (state.stage.mode !== "chase") return undefined;
  if (state.stage.catchCount !== 0 || state.stage.introCameraHandoffDone) return undefined;
  if (state.stage.summonStartedAt === undefined || !state.stage.target.visible) return undefined;
  if (state.phase !== "running") return undefined;
  return fixedPanel("B", "Come catch me, hero.", "instruction", "DEFAULT");
}

function openingTutorialPanel(state: GameState): DialoguePanel | undefined {
  if (state.stage.mode === "postVictoryTutorial") {
    return fixedPanel("A", "Hey there!\nI’m hungry for pancakes!", "instruction", "OPENING_TUTORIAL");
  }
  if (state.stage.mode !== "introPancakes" || state.phase !== "ready" && state.phase !== "running") return undefined;
  if (state.collectedPancakes.size > 0 || state.stage.firstPancakeAt !== undefined) return undefined;
  if (state.player.x !== state.stage.playerStart.x || state.player.z !== state.stage.playerStart.z || state.player.hop) return undefined;
  const text = state.time >= 5
    ? "Try the arrows!"
    : "Hey there! I'm hungry for pancakes...";
  return fixedPanel("A", text, "instruction", "OPENING_TUTORIAL");
}

function finalSequencePanel(state: GameState): DialoguePanel | undefined {
  if (state.stage.mode !== "finalSequence" || state.stage.finalStartedAt === undefined) return undefined;
  const elapsed = state.time - state.stage.finalStartedAt;
  if (elapsed < 0) return undefined;
  let cursor = 0;
  for (let index = 0; index < FINAL_SEQUENCE.length; index += 1) {
    const finalLine = FINAL_SEQUENCE[index];
    if (!finalLine) continue;
    const lineEnd = cursor + finalLine.duration;
    if (elapsed <= lineEnd) return panelFromLine(finalLine, state.time + finalLine.duration);
    cursor = lineEnd + FINAL_LINE_GAP_SECONDS;
    if (elapsed < cursor) return panelFromLine(finalLine, state.time + (cursor - elapsed));
  }
  const lastLine = FINAL_SEQUENCE[FINAL_SEQUENCE.length - 1];
  return lastLine ? panelFromLine(lastLine, state.time + 0.5) : undefined;
}

function isDangerLane(state: GameState): boolean {
  const lane = state.lanes.get(Math.round(state.player.z));
  return lane?.kind === "road" || lane?.kind === "river" || lane?.kind === "train";
}

function firstUnseenObstacleAhead(state: GameState, seen: Set<string>): Extract<LaneKind, "road" | "river" | "train"> | undefined {
  const startZ = Math.round(state.player.z) + 1;
  const maxZ = Math.min(Math.max(...state.lanes.keys()), startZ + 2);
  for (let z = startZ; z <= maxZ; z += 1) {
    const kind = state.lanes.get(z)?.kind;
    if ((kind === "road" || kind === "river" || kind === "train") && !seen.has(`obstacle:${kind}`)) return kind;
  }
  return undefined;
}

function panelFromLine(lineToShow: DialogueLine, _expiresAt: number): DialoguePanel {
  return fixedPanel(lineToShow.speaker, lineToShow.text, lineToShow.tone ?? "neutral", lineToShow.eventType);
}

function fixedPanel(speaker: DialogueSpeaker, text: string, tone: DialogueTone, eventType: DialogueEventType): DialoguePanel {
  return {
    speaker,
    speakerLabel: SPEAKER_LABELS[speaker],
    text,
    tone,
    eventType,
  };
}

function line(
  speaker: DialogueSpeaker,
  text: string,
  priority: number,
  eventType: DialogueEventType,
  duration: number,
  tone: DialogueTone = "neutral",
): DialogueLine {
  return { speaker, text, priority, eventType, duration, tone };
}

function countIntroPancakes(state: GameState): number {
  let count = 0;
  for (const lane of state.lanes.values()) {
    if (lane.z > state.stage.summonMarker.z) continue;
    for (const x of lane.collectibles) {
      if (state.collectedPancakes.has(`${lane.z}:${x}`)) count += 1;
    }
  }
  return count;
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function durationForText(text: string, kind: "tiny" | "normal" | "tutorial" | "reveal" | "catch"): number {
  const length = text.length;
  if (kind === "tiny") return clamp(1.6 + length * 0.025, 1.8, 2.4);
  if (kind === "catch") return clamp(1.75 + length * 0.018, 1.8, 2.8);
  if (kind === "tutorial") return clamp(2.7 + length * 0.025, 3.0, 4.2);
  if (kind === "reveal") return clamp(3.2 + length * 0.025, 3.6, 4.8);
  return clamp(2.3 + length * 0.025, 2.6, 3.6);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function seededUnit(state: GameState): number {
  const seed = Math.sin((state.time + 1) * 12.9898 + state.score * 78.233 + state.stage.catchCount * 37.719) * 43758.5453;
  return seed - Math.floor(seed);
}

function shuffleSpeakers(source: readonly DialogueSpeaker[], state: GameState): DialogueSpeaker[] {
  const shuffled = [...source];
  let seed = Math.floor(seededUnit(state) * 100000) + state.stage.catchCount * 97 + state.score * 31;
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    seed = positiveModulo(seed * 1103515245 + 12345, 2147483647);
    const swapIndex = seed % (index + 1);
    const current = shuffled[index];
    const swap = shuffled[swapIndex];
    if (current === undefined || swap === undefined) continue;
    shuffled[index] = swap;
    shuffled[swapIndex] = current;
  }
  return shuffled;
}

function isRevealSuppressed(state: GameState): boolean {
  if (state.stage.summonStartedAt === undefined) return false;
  return state.time + (state.stage.revealConversationAdvanceSeconds ?? 0) < state.stage.summonStartedAt + REVEAL_TOTAL_SECONDS + 3;
}
