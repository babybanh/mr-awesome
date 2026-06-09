import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";

const root = new URL("..", import.meta.url);
const tmp = await mkdtemp(join(tmpdir(), "awesome-stage-map-"));

const validCompactFootprintTown = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: valid_compact_footprint_town
MODE: authored
TARGET_MODE: fixed_goal

z=07 G  | . . . . . . N . . . . . . |
z=06 G  | B4 b4 b4 . . . . . . . . . . |
z=05 G  | . . . . . . . . . . . . . |
z=04 G  | . . . . . . . . . . . . . |
z=03 G  | . . . . . . . . . . . . . |
z=02 G  | . . . . . . . . . . . . . |
z=01 G  | . . . . . . p . . . . . . |
z=00 G  | . . . . . . C . . . . . . |

END`;

const validCasinoFootprintTown = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: valid_casino_footprint_town
MODE: authored
TARGET_MODE: fixed_goal

z=08 G  | . . . . . . N . . . . . . |
z=07 G  | B7 b7 b7 b7 . . . . . . . . . |
z=06 G  | . . . . . . . . . . . . . |
z=05 G  | . . . . . . . . . . . . . |
z=04 G  | . . . . . . . . . . . . . |
z=03 G  | . . . . . . . . . . . . . |
z=02 G  | . p . . . . . . . p . . . |
z=01 G  | . . . . . . p . . . . . . |
z=00 G  | . . . . . . C . . . . . . |

END`;

const noRoadFootprintTown = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: no_road_footprint_town
MODE: authored
TARGET_MODE: fixed_goal

z=07 G  | . . . . . . N . . . . . . |
z=06 G  | . . . . . . . . . B6 b6 . . |
z=05 G  | . . . . . . . . . . . . . |
z=04 G  | . . . . . . . . . . . . . |
z=03 G  | . p . . . . . . . . p . . |
z=02 G  | . . . #4 . . . . . #4 . . . |
z=01 G  | . . . . . . p . . . . . . |
z=00 G  | . . . . . . C . . . . . . |

END`;

const riverIntroTown = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: river_intro_town
MODE: authored
TARGET_MODE: fixed_goal

z=08 G  | . . . . . . N . . . . . . |
z=07 G  | . . . . . . . . . . . . . |
z=06 W> | log=M speed=S gap=L |
z=05 W< | log=L speed=M gap=M |
z=04 G  | . . . . . . . . . . . . . |
z=03 G  | . . . . . . . . . . . . . |
z=02 G  | . . . . . . . . . . . . . |
z=01 G  | . . . . . . p . . . . . . |
z=00 G  | . . . . . . C . . . . . . |

END`;

const introBlockedRiverTown = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: intro_blocked_river_town
MODE: authored
TARGET_MODE: fixed_goal

z=02 G  | . . . . . . N . . . . . . |
z=01 W> | log=M speed=S gap=L |
z=00 G  | . . . . . . C . . . . . . |

END`;

const introRoadTown = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: intro_road_town
MODE: authored
TARGET_MODE: fixed_goal

z=02 G  | . . . . . . N . . . . . . |
z=01 R> | vehicle=S speed=S gap=L density=L cover=none |
z=00 G  | . . . . . . C . . . . . . |

END`;

const trainIntroTown = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: train_intro_town
MODE: authored
TARGET_MODE: fixed_goal

z=10 G  | . . . . . . N . . . . . . |
z=09 D  | . !1 . . !1 . . . @1 . . . . |
z=08 T> | train=L speed=F gap=L warn=M |
z=07 D  | . . . !2 . . . . @2 . . . !2 |
z=06 W< | log=M speed=S gap=L |
z=05 R< | vehicle=S speed=S gap=L density=L cover=none |
z=04 G  | . . . . . . . . . . . . . |
z=03 G  | . . . . . . . . . . . . . |
z=02 G  | . . . . . . . . . . . . . |
z=01 G  | . . . . . . p . . . . . . |
z=00 G  | . . . . . . C . . . . . . |

END`;

const twoWayTrainTown = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: two_way_train_town
MODE: authored
TARGET_MODE: fixed_goal

z=08 G  | . . . . . . N . . . . . . |
z=07 T> | train=S speed=S gap=S warn=S |
z=06 T< | train=M speed=M gap=M warn=L |
z=05 G  | . . . . . . . . . . . . . |
z=04 G  | . . . . . . . . . . . . . |
z=03 G  | . . . . . . . . . . . . . |
z=02 G  | . . . . . . . . . . . . . |
z=01 G  | . . . . . . . . . . . . . |
z=00 G  | . . . . . . C . . . . . . |

END`;

const dirtPathTown = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: dirt_path_town
MODE: authored
TARGET_MODE: fixed_goal

z=06 D  | . #1 . . . . N . . . #2 . . |
z=05 D  | . . . p . . . . p . . . . |
z=04 D  | . . . . . . . . . . . . . |
z=03 D  | . B1 b1 . . . . . . . . . . |
z=02 D  | . b1 b1 . . . . . . . . . . |
z=01 D  | . b1 b1 . . . p . . . . . . |
z=00 D  | . . . . . . C . . . . . . |

END`;

const legacyAdjacentHouseTown = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: legacy_adjacent_house_town
MODE: authored
TARGET_MODE: fixed_goal

z=05 G  | . . . . . . N . . . . . . |
z=04 G  | B B . . . . . . . . . . . |
z=03 G  | . . . . . . . . . . . . . |
z=02 G  | . . . . . . . . . . . . . |
z=01 G  | . . . . . . . . . . . . . |
z=00 G  | . . . . . . C . . . . . . |

END`;

const invalidContinuationTown = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: invalid_continuation_town
MODE: authored
TARGET_MODE: fixed_goal

z=05 G  | . . . . . . N . . . . . . |
z=04 G  | b1 . . . . . . . . . . . . |
z=03 G  | . . . . . . . . . . . . . |
z=02 G  | . . . . . . . . . . . . . |
z=01 G  | . . . . . . . . . . . . . |
z=00 G  | . . . . . . C . . . . . . |

END`;

function longRow(z, token = ".") {
  return `z=${String(z).padStart(2, "0")} G  | . . . . . . ${token} . . . . . . |`;
}

const longValidTown = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: long_valid_town
MODE: authored
TARGET_MODE: fixed_goal

${Array.from({ length: 26 }, (_, index) => {
  const z = 25 - index;
  if (z === 25) return longRow(z, "N");
  if (z === 0) return longRow(z, "C");
  return longRow(z);
}).join("\n")}

END`;

const thousandRowTown = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: thousand_row_town
MODE: authored
TARGET_MODE: fixed_goal

${Array.from({ length: 1001 }, (_, index) => {
  const z = 1000 - index;
  if (z === 1000) return longRow(z, "N");
  if (z === 0) return longRow(z, "C");
  return longRow(z);
}).join("\n")}

END`;

const missingMiddleLongTown = longValidTown.replace(/^z=12.*\n/m, "");

const zLabelTypoTown = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: z_label_typo_town
MODE: authored
TARGET_MODE: fixed_goal

z=00 G  | . . . . . . N . . . . . . |
z=2 G  | . . . . . . . . . . . . . |
z=02 G  | . . . . . . p . . . . . . |
z=00 G  | . . . . . . C . . . . . . |

END`;

const warningWalkthroughTown = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: warning_walkthrough_town
MODE: authored
TARGET_MODE: fixed_goal

z=02 G  | . . . . . . N . . . . . . |
z=01 G  | . . . . . . !1 . . . . . . |
z=00 G  | . . . . . . C . . . . . . |

END`;

const billboardWalkthroughTown = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: billboard_walkthrough_town
MODE: authored
TARGET_MODE: fixed_goal

z=02 G  | . . . . . . N . . . . . . |
z=01 G  | . . . . . . @1 . . . . . . |
z=00 G  | . . . . . . C . . . . . . |

END`;

const introFivePancakeTown = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: intro_five_pancake_town
MODE: authored
TARGET_MODE: fixed_goal

z=25 G  | . . . . . . . . . . . . . |
z=24 G  | . . . . . . . . . . . . . |
z=23 G  | . . . . . . . . . . . . . |
z=22 G  | . . . . . . . . . . . . . |
z=21 G  | . . . . . . . . . . . . . |
z=20 G  | . . . . . . . . . . . . . |
z=19 G  | . . . . . . . . . . . . . |
z=18 G  | . . . . . . . . . . . . . |
z=17 G  | . . . . . . . . . . . . . |
z=16 G  | . . . . . . . . . . . . . |
z=15 G  | . . . . . . . . . . . . . |
z=14 G  | . . . . . . . . . . . . . |
z=13 G  | . . . . . . . . . . . . . |
z=12 G  | . . . . . . . . . . . . . |
z=11 G  | . . . . . . . . . . . . . |
z=10 G  | . . . . . . . . . . . . . |
z=09 G  | . . . . . . . . . . . . . |
z=08 G  | . . . . . . N . . . . . . |
z=07 G  | . . . . . . . . . . . . . |
z=06 G  | . . . . . . . . . . . . . |
z=05 G  | . . . . . . p1 . . . . . . |
z=04 G  | . . . . . . p1 . . . . . . |
z=03 G  | . . . . . . p1 . . . . . . |
z=02 G  | . . . . . . p1 . . . . . . |
z=01 G  | . . . . . . p1 . . . . . . |
z=00 G  | . . . . . . C . . . . . . |

END`;

const duplicateStartTown = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: duplicate_start_town
MODE: authored
TARGET_MODE: fixed_goal

z=03 G  | . . . . . . N . . . . . . |
z=02 G  | . . . . . . . . . . . . . |
z=01 G  | . . . . . . . . . . . . . |
z=00 G  | C . . . . . C . . . . . . |

END`;

const duplicateTargetTown = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: duplicate_target_town
MODE: authored
TARGET_MODE: fixed_goal

z=03 G  | N . . . . . N . . . . . . |
z=02 G  | . . . . . . . . . . . . . |
z=01 G  | . . . . . . . . . . . . . |
z=00 G  | . . . . . . C . . . . . . |

END`;

const blockedTargetTown = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: blocked_target_town
MODE: authored
TARGET_MODE: fixed_goal

z=04 G  | . . . . . #1 N #1 . . . . . |
z=03 G  | . . . . . . #1 . . . . . . |
z=02 G  | . . . . . . . . . . . . . |
z=01 G  | . . . . . . . . . . . . . |
z=00 G  | . . . . . . C . . . . . . |

END`;

const noRoughPathTown = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: no_rough_path_town
MODE: authored
TARGET_MODE: fixed_goal

z=04 G  | . . . . . . N . . . . . . |
z=03 G  | #1 #1 #1 #1 #1 #1 #1 #1 #1 #1 #1 #1 #1 |
z=02 G  | . . . . . . . . . . . . . |
z=01 G  | . . . . . . . . . . . . . |
z=00 G  | . . . . . . C . . . . . . |

END`;

const footprintOverlapTown = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: footprint_overlap_town
MODE: authored
TARGET_MODE: fixed_goal

z=07 G  | . . . . . . N . . . . . . |
z=06 G  | B4 b4 b4 . . . . . . . . . . |
z=05 G  | . #5 . . . . . . . . . . . |
z=04 G  | . . . . . . . . . . . . . |
z=03 G  | . . . . . . . . . . . . . |
z=02 G  | . . . . . . . . . . . . . |
z=01 G  | . . . . . . . . . . . . . |
z=00 G  | . . . . . . C . . . . . . |

END`;

const compactApartmentTreeRows = `CR_STAGE_MAP v0.1
STAGE: 1
NAME: v54_compact_apartment_tree_rows
MODE: authored
TARGET_MODE: fixed_goal

z=11 G  | B3 b3 b3 . . . . . B4 b4 b4 . . |
z=10 G  | #5 . #5 . . . . . . #5 . #5 . |
z=09 G  | . . . . . . N . . . . . . |
z=08 G  | . . . . . . p . . . . . . |
z=07 R> | vehicle=S speed=S gap=L density=L cover=none |
z=06 G  | . p . #5 . . . . . #5 p . . |
z=05 R< | vehicle=S speed=S gap=L density=L cover=none |
z=04 G  | . . . . . . p . . . . . . |
z=03 G  | . B1 b1 . . . . . . . B2 b2 . |
z=02 G  | . . . p . . . . . . . . . |
z=01 G  | . . . . . . . . . . . . . |
z=00 G  | . . . . . . C . . . . . . |

END`;

try {
  await transpile("src/game/types.ts", "types.mjs");
  await transpile("src/game/stageMap.ts", "stageMap.mjs");
  await transpile("src/game/simulation.ts", "simulation.mjs");
  await transpile("src/game/dialogue.ts", "dialogue.mjs");
  const stageMap = await import(new URL("stageMap.mjs", `file://${tmp}/`).href);
  const simulation = await import(new URL("simulation.mjs", `file://${tmp}/`).href);
  const dialogue = await import(new URL("dialogue.mjs", `file://${tmp}/`).href);
  const openingTutorialLines = new Set([
    "Use arrows. Grab pancakes!",
    "Pancakes, please!",
    "Try the arrow keys — I see pancakes!",
    "Let’s get pancakes!",
  ]);

  check("baseline map parses", () => stageMap.parseStageMap(stageMap.baselineStageMap()).ok);
  check("v112 compact baseline map parses and serializes", () => {
    const result = stageMap.parseStageMap(stageMap.baselineStageMap());
    const serialized = result.stage ? stageMap.serializeStageMap(result.stage) : "";
    return result.ok
      && result.stage?.name === "v112_cut_138_lane_candidate"
      && serialized.includes("z=324 W<")
      && serialized.includes("z=00 G");
  });
  check("compact baseline keeps planned billboard rows", () => {
    const result = stageMap.parseStageMap(stageMap.baselineStageMap());
    const billboardRows = result.stage?.objects
      .filter((object) => object.kind === "billboard")
      .map((object) => object.z)
      .sort((a, b) => a - b)
      .join(",");
    return billboardRows === "15,70,127,150,176,235";
  });
  check("baseline multi-row river chunks alternate direction", () => {
    const result = stageMap.parseStageMap(stageMap.baselineStageMap());
    if (!result.ok || !result.stage) return false;
    const lanes = [...result.stage.lanes].sort((a, b) => a.z - b.z);
    let chunk = [];
    const flush = () => {
      if (chunk.length < 3) return true;
      for (let index = 1; index < chunk.length; index += 1) {
        if (chunk[index].direction === chunk[index - 1].direction) return false;
      }
      return true;
    };
    for (const lane of lanes) {
      const previous = chunk[chunk.length - 1];
      const continuesRiver = lane.kind === "river" && previous && previous.z + 1 === lane.z;
      if (continuesRiver) {
        chunk.push(lane);
        continue;
      }
      if (!flush()) return false;
      chunk = lane.kind === "river" ? [lane] : [];
    }
    return flush();
  });
  check("generated z=1000 map parses with continuous row order", () => {
    const result = stageMap.parseStageMap(thousandRowTown);
    const serialized = result.stage ? stageMap.serializeStageMap(result.stage) : "";
    return result.ok
      && serialized.includes("z=1000 G")
      && serialized.includes("z=00 G")
      && !result.warnings.some((warning) => warning.includes("Repaired z row labels"));
  });
  check("long z=25 map parses and serializes", () => {
    const result = stageMap.parseStageMap(longValidTown);
    const serialized = result.stage ? stageMap.serializeStageMap(result.stage) : "";
    return result.ok && serialized.includes("z=25 G") && serialized.includes("z=00 G");
  });
  check("cut middle row normalizes to a shorter continuous map", () => {
    const result = stageMap.parseStageMap(missingMiddleLongTown);
    const serialized = result.stage ? stageMap.serializeStageMap(result.stage) : "";
    return result.ok
      && result.warnings.some((warning) => warning.includes("Repaired z row labels"))
      && serialized.includes("z=24 G")
      && serialized.includes("z=00 G")
      && !serialized.includes("z=25 G");
  });
  check("z row label typos repair from visual order", () => {
    const result = stageMap.parseStageMap(zLabelTypoTown);
    const serialized = result.stage ? stageMap.serializeStageMap(result.stage) : "";
    return result.ok
      && result.warnings.some((warning) => warning.includes("Repaired z row labels"))
      && serialized.includes("z=03 G")
      && serialized.includes("z=00 G");
  });
  check("legacy adjacent B B normalizes to expanded footprint", () => {
    const result = stageMap.parseStageMap(legacyAdjacentHouseTown);
    const serialized = result.stage ? stageMap.serializeStageMap(result.stage) : "";
    return result.ok && serialized.includes("B1 b1") && serialized.includes("b1 b1");
  });
  check("building variants serialize", () => {
    const map = validCompactFootprintTown.replace("B4 b4 b4", "B2 b2 b2");
    const result = stageMap.parseStageMap(map);
    return result.ok && stageMap.serializeStageMap(result.stage).includes("B2 b2");
  });
  check("extended building variants parse", () => {
    const map = validCompactFootprintTown.replace("B4 b4 b4", "B11 b11 .");
    const result = stageMap.parseStageMap(map);
    return result.ok && stageMap.serializeStageMap(result.stage).includes("B11 b11");
  });
  check("tree variants parse", () => {
    const result = stageMap.parseStageMap(dirtPathTown);
    return result.ok && stageMap.serializeStageMap(result.stage).includes("#1") && stageMap.serializeStageMap(result.stage).includes("#2");
  });
  check("park/Kenney tree symbols stay removed", () => {
    const map = dirtPathTown.replace("#1", "#10");
    return !stageMap.parseStageMap(map).ok;
  });
  check("pancake p1 stays canonical", () => {
    const map = dirtPathTown.replace(" p ", " p1 ");
    const result = stageMap.parseStageMap(map);
    const serialized = result.stage ? stageMap.serializeStageMap(result.stage) : "";
    return result.ok && serialized.includes("p1");
  });
  check("compact one-row B4 normalizes to 3x3 rows", () => {
    const result = stageMap.parseStageMap(validCompactFootprintTown);
    const serialized = result.stage ? stageMap.serializeStageMap(result.stage) : "";
    return result.ok
      && serialized.includes("z=06 G  | B4 b4 b4")
      && serialized.includes("z=05 G  | b4 b4 b4")
      && serialized.includes("z=04 G  | b4 b4 b4");
  });
  check("compact one-row B7 normalizes to 4x4 rows", () => {
    const result = stageMap.parseStageMap(validCasinoFootprintTown);
    const serialized = result.stage ? stageMap.serializeStageMap(result.stage) : "";
    return result.ok
      && serialized.includes("z=07 G  | B7 b7 b7 b7")
      && serialized.includes("z=04 G  | b7 b7 b7 b7");
  });
  check("no-road clean footprint town parses", () => {
    const result = stageMap.parseStageMap(noRoadFootprintTown);
    return result.ok && stageMap.serializeStageMap(result.stage).includes("z=07 G");
  });
  check("river rows parse and serialize", () => {
    const result = stageMap.parseStageMap(riverIntroTown);
    const serialized = result.stage ? stageMap.serializeStageMap(result.stage) : "";
    return result.ok
      && serialized.includes("z=06 W> | log=M speed=S gap=L |")
      && serialized.includes("z=05 W< | log=L speed=M gap=M |");
  });
  check("train rows parse and serialize", () => {
    const result = stageMap.parseStageMap(twoWayTrainTown);
    const serialized = result.stage ? stageMap.serializeStageMap(result.stage) : "";
    return result.ok
      && serialized.includes("z=07 T> | train=S speed=S gap=S warn=S |")
      && serialized.includes("z=06 T< | train=M speed=M gap=M warn=L |");
  });
  check("single lane serializer returns ground, road, river, and train rows", () => {
    const result = stageMap.parseStageMap(trainIntroTown);
    if (!result.stage) return false;
    return stageMap.serializeStageLane(result.stage, 9).startsWith("z=09 D")
      && stageMap.serializeStageLane(result.stage, 8) === "z=08 T> | train=L speed=F gap=L warn=M |"
      && stageMap.serializeStageLane(result.stage, 6) === "z=06 W< | log=M speed=S gap=L |"
      && stageMap.serializeStageLane(result.stage, 5) === "z=05 R< | vehicle=S speed=S gap=L density=L cover=none |";
  });
  check("traffic tuning multipliers apply to road, river, and train lanes", () => {
    const roadResult = stageMap.parseStageMap(introRoadTown);
    const mediumRoadResult = stageMap.parseStageMap(introRoadTown.replace("vehicle=S speed=S", "vehicle=M speed=S"));
    const riverResult = stageMap.parseStageMap(riverIntroTown);
    const fastRiverResult = stageMap.parseStageMap(riverIntroTown.replace("log=M speed=S gap=L", "log=M speed=F gap=L"));
    const trainResult = stageMap.parseStageMap(trainIntroTown);
    const twoWayTrainResult = stageMap.parseStageMap(twoWayTrainTown);
    const road = roadResult.stage?.lanes.get(1);
    const mediumRoad = mediumRoadResult.stage?.lanes.get(1);
    const river = riverResult.stage?.lanes.get(6);
    const fastRiver = fastRiverResult.stage?.lanes.get(6);
    const train = trainResult.stage?.lanes.get(8);
    const slowTrain = twoWayTrainResult.stage?.lanes.get(7);
    const mediumTrain = twoWayTrainResult.stage?.lanes.get(6);
    return road?.kind === "road"
      && mediumRoad?.kind === "road"
      && river?.kind === "river"
      && fastRiver?.kind === "river"
      && train?.kind === "train"
      && slowTrain?.kind === "train"
      && mediumTrain?.kind === "train"
      && approx(road.speed, 1.55 * 0.8 * 1.3)
      && approx(road.gap, 5.8 * 1.7)
      && approx(mediumRoad.speed, 1.55 * 0.8 * 1.3 * 1.15)
      && approx(mediumRoad.gap, 5.8 * 1.7)
      && approx(river.speed, 1.4 * 1.2 * 1.2 * 0.7)
      && approx(river.gap, 7 * 0.56)
      && approx(fastRiver.speed, 2.8 * 1.2 * 0.7)
      && approx(fastRiver.gap, 7 * 0.56)
      && approx(train.speed, 4.8 * 1.2 * 1.5)
      && approx(train.gap, 9.2 * 2 * 1.2)
      && approx(slowTrain.speed, 2.2 * 1.2 * 1.5)
      && approx(slowTrain.gap, 4.8 * 2 * 1.2)
      && approx(mediumTrain.speed, 3.4 * 1.2 * 1.5)
      && approx(mediumTrain.gap, 6.8 * 2 * 1.2);
  });
  check("post Nice Try billboard ramps road and train difficulty", () => {
    const result = stageMap.parseStageMap(stageMap.baselineStageMap());
    const beforeRoad = result.stage?.lanes.get(60);
    const afterRoad = result.stage?.lanes.get(76);
    const afterTrain = result.stage?.lanes.get(79);
    const lateRoad = result.stage?.lanes.get(141);
    const lateTrain = result.stage?.lanes.get(138);
    const bigLakesRoad = result.stage?.lanes.get(152);
    const bigLakesTrain = result.stage?.lanes.get(160);
    const bigLakesRiver = result.stage?.lanes.get(180);
    const beforeFinalBillboardRoad = result.stage?.lanes.get(234);
    const afterFinalBillboardRoad = result.stage?.lanes.get(238);
    return beforeRoad?.kind === "road"
      && afterRoad?.kind === "road"
      && afterTrain?.kind === "train"
      && lateRoad?.kind === "road"
      && lateTrain?.kind === "train"
      && bigLakesRoad?.kind === "road"
      && bigLakesTrain?.kind === "train"
      && bigLakesRiver?.kind === "river"
      && beforeFinalBillboardRoad?.kind === "road"
      && afterFinalBillboardRoad?.kind === "road"
      && approx(beforeRoad.speed, 2.35 * 0.8 * 1.3)
      && approx(beforeRoad.gap, 4.5 * 0.82 * 1.7)
      && approx(afterRoad.speed, 1.55 * 0.8 * 1.3 * 1.15 * 1.1)
      && approx(afterRoad.gap, 4.5 * 1.7 * 0.9)
      && approx(afterTrain.speed, 2.2 * 1.2 * 1.5 * 1.1)
      && approx(afterTrain.gap, 9.2 * 2 * 1.2 * 0.9)
      && approx(lateRoad.speed, 2.35 * 0.8 * 1.3 * 1.1 * 1.2)
      && approx(lateRoad.gap, 4.5 * 1.7 * 0.9 * 0.8)
      && approx(lateTrain.speed, 2.2 * 1.2 * 1.5 * 1.1 * 1.2)
      && approx(lateTrain.gap, 9.2 * 2 * 1.2 * 0.9 * 0.8)
      && approx(bigLakesRoad.speed, 2.35 * 0.8 * 1.3 * 1.1 * 1.2 * 1.2)
      && approx(bigLakesRoad.gap, 5.8 * 1.7 * 0.9 * 0.8 * 1.2)
      && approx(bigLakesTrain.speed, 2.2 * 1.2 * 1.5 * 1.1 * 1.2)
      && approx(bigLakesTrain.gap, 9.2 * 2 * 1.2 * 0.9 * 0.8 * 0.9)
      && approx(bigLakesRiver.speed, 1.4 * 1.2 * 1.2 * 0.7 * 1.2)
      && approx(bigLakesRiver.gap, 3.4 * 0.56)
      && approx(beforeFinalBillboardRoad.speed, 1.55 * 0.8 * 1.3 * 1.15 * 1.1 * 1.2 * 1.2)
      && approx(afterFinalBillboardRoad.speed, 2.35 * 0.8 * 1.3 * 1.15 * 1.1 * 1.2 * 1.2 * 1.1)
      && approx(afterFinalBillboardRoad.gap, 5.8 * 0.66 * 1.7 * 0.9 * 0.8 * 1.2 * 1.1);
  });
  check("warning signs and billboards parse and serialize", () => {
    const result = stageMap.parseStageMap(trainIntroTown);
    const serialized = result.stage ? stageMap.serializeStageMap(result.stage) : "";
    return result.ok
      && serialized.includes("!1")
      && serialized.includes("!2")
      && serialized.includes("@1 @1 @1")
      && serialized.includes("@2 @2 @2 @2");
  });
  check("legacy single @1 normalizes to three reserved cells", () => {
    const result = stageMap.parseStageMap(billboardWalkthroughTown);
    const serialized = result.stage ? stageMap.serializeStageMap(result.stage) : "";
    return result.ok && serialized.includes("@1 @1 @1");
  });
  check("legacy single @2 normalizes to four reserved cells", () => {
    const result = stageMap.parseStageMap(trainIntroTown);
    const serialized = result.stage ? stageMap.serializeStageMap(result.stage) : "";
    return result.ok && serialized.includes("@2 @2 @2 @2");
  });
  check("billboard footprint overlap fails", () => {
    const map = billboardWalkthroughTown.replace("@1 . .", "@1 #5 .");
    return !stageMap.parseStageMap(map).ok;
  });
  check("warning signs do not block rough path", () => stageMap.parseStageMap(warningWalkthroughTown).ok);
  check("billboards block their full footprint but preserve alternate rough path", () => {
    const result = stageMap.parseStageMap(billboardWalkthroughTown);
    const blockers = result.stage?.lanes.get(1)?.blockers ?? [];
    return result.ok && [-2, -1, 0].every((x) => blockers.includes(x));
  });
  check("train sample keeps authored warning props near train lane", () => {
    const result = stageMap.parseStageMap(trainIntroTown);
    if (!result.stage) return false;
    const warnings = result.stage.objects.filter((object) => object.kind === "warning");
    const billboards = result.stage.objects.filter((object) => object.kind === "billboard");
    return result.ok
      && warnings.length === 4
      && billboards.some((object) => object.assetId === "billboard01")
      && billboards.some((object) => object.assetId === "billboard02");
  });
  check("dirt rows parse and serialize", () => {
    const result = stageMap.parseStageMap(dirtPathTown);
    const serialized = result.stage ? stageMap.serializeStageMap(result.stage) : "";
    return result.ok
      && serialized.includes("z=06 D  |")
      && serialized.includes("z=00 D  |");
  });
  check("dirt rows allow normal map objects", () => {
    const result = stageMap.parseStageMap(dirtPathTown);
    const serialized = result.stage ? stageMap.serializeStageMap(result.stage) : "";
    return result.ok
      && serialized.includes("B1 b1")
      && serialized.includes("#1")
      && serialized.includes("p1")
      && serialized.includes("C")
      && serialized.includes("N");
  });
  check("dirt rows count as rough-path ground", () => stageMap.parseStageMap(dirtPathTown).ok);
  check("old grass rows remain valid", () => stageMap.parseStageMap(noRoadFootprintTown).ok);
  check("objects on river rows fail", () => {
    const map = riverIntroTown.replace("z=06 W> | log=M speed=S gap=L |", "z=06 W> | log=M speed=S gap=L B1 |");
    return !stageMap.parseStageMap(map).ok;
  });
  check("pancake on river row fails", () => {
    const map = riverIntroTown.replace("z=06 W> | log=M speed=S gap=L |", "z=06 W> | log=M speed=S gap=L p1 |");
    return !stageMap.parseStageMap(map).ok;
  });
  check("start on river row fails", () => {
    const map = riverIntroTown
      .replace("z=06 W> | log=M speed=S gap=L |", "z=06 W> | log=M speed=S gap=L C |")
      .replace("z=00 G  | . . . . . . C . . . . . . |", "z=00 G  | . . . . . . . . . . . . . |");
    return !stageMap.parseStageMap(map).ok;
  });
  check("target on river row fails", () => {
    const map = riverIntroTown
      .replace("z=06 W> | log=M speed=S gap=L |", "z=06 W> | log=M speed=S gap=L N |")
      .replace("z=08 G  | . . . . . . N . . . . . . |", "z=08 G  | . . . . . . . . . . . . . |");
    return !stageMap.parseStageMap(map).ok;
  });
  check("invalid river tuning fails", () => !stageMap.parseStageMap(riverIntroTown.replace("log=M", "log=XL")).ok);
  check("invalid train tuning fails", () => !stageMap.parseStageMap(trainIntroTown.replace("train=L", "train=XL")).ok);
  check("unknown train property fails", () => !stageMap.parseStageMap(trainIntroTown.replace("warn=M", "warn=M horn=on")).ok);
  check("objects on train rows fail", () => !stageMap.parseStageMap(trainIntroTown.replace("train=L speed=F gap=L warn=M", "train=L speed=F gap=L warn=M !1")).ok);
  check("warning signs only on ground rows", () => !stageMap.parseStageMap(riverIntroTown.replace("z=06 W> | log=M speed=S gap=L |", "z=06 W> | log=M speed=S gap=L !1 |")).ok);
  check("billboards only on ground rows", () => !stageMap.parseStageMap(trainIntroTown.replace("z=05 R< | vehicle=S speed=S gap=L density=L cover=none |", "z=05 R< | vehicle=S speed=S gap=L density=L cover=none @1 |")).ok);
  check("tree inside expanded footprint fails", () => !stageMap.parseStageMap(footprintOverlapTown).ok);
  check("v54 apartment tree rows fails until trees move out of footprints", () => !stageMap.parseStageMap(compactApartmentTreeRows).ok);
  check("missing C fails", () => !stageMap.parseStageMap(stageMap.baselineStageMap().replace("C", ".")).ok);
  check("duplicate C fails", () => !stageMap.parseStageMap(duplicateStartTown).ok);
  check("missing N fails", () => !stageMap.parseStageMap(stageMap.baselineStageMap().replace("N", ".")).ok);
  check("duplicate N fails", () => !stageMap.parseStageMap(duplicateTargetTown).ok);
  check("invalid continuation fails", () => !stageMap.parseStageMap(invalidContinuationTown).ok);
  check("invalid row width fails", () => !stageMap.parseStageMap(dirtPathTown.replace("z=04 D  | . . . . . . . . . . . . . |", "z=04 D  | . . . . . . . . . . . . |")).ok);
  check("invalid Stage 1 train row fails", () => !stageMap.parseStageMap(dirtPathTown.replace("z=04 D", "z=04 TR")).ok);
  check("movement cannot go below z=00", () => {
    const state = simulation.createInitialState(riverIntroTown, 0, 0);
    const moved = simulation.applyAction(state, "backward");
    return moved.player.hop?.toZ === 0;
  });
  check("movement cannot go above highest authored row", () => {
    const state = simulation.createInitialState(riverIntroTown, 0, 0);
    const staged = { ...state, phase: "running", player: { x: 0, z: 8, maxZ: 8 } };
    const moved = simulation.applyAction(staged, "forward");
    return moved.player.hop?.toZ === 8;
  });
  check("movement can pass through warning signs", () => {
    const state = simulation.createInitialState(warningWalkthroughTown, 0, 0);
    const moved = simulation.applyAction(state, "forward");
    return moved.player.hop?.toZ === 1;
  });
  check("movement cannot pass through billboards", () => {
    const state = simulation.createInitialState(billboardWalkthroughTown, 0, 0);
    const moved = simulation.applyAction(state, "forward");
    return moved.player.hop === undefined && moved.player.z === 0;
  });
  check("intro mode bumps in place before river/log lanes", () => {
    const state = simulation.createInitialState(introBlockedRiverTown, 0, 0);
    const moved = simulation.applyAction(state, "forward");
    return moved.player.hop?.toZ === 0 && moved.player.z === 0 && moved.stage.mode === "introPancakes";
  });
  check("intro mode can move forward into road lanes", () => {
    const state = simulation.createInitialState(introRoadTown, 0, 0);
    const moved = simulation.applyAction(state, "forward");
    return moved.player.hop?.toZ === 1
      && moved.stage.mode === "introPancakes"
      && approx(moved.player.hop.duration, 0.19 / 1.1);
  });
  check("pre-first-catch chase river lock pulls hero back to start", () => {
    const state = simulation.createInitialState(riverIntroTown, 0, 0);
    const staged = {
      ...state,
      phase: "running",
      player: { x: 0, z: 4, maxZ: 4 },
      stage: {
        ...state.stage,
        mode: "chase",
        target: { x: 0, z: 8, visible: true },
        targetSpawnHistory: [{ x: 0, z: 8 }],
        catchCount: 0,
        introCameraHandoffDone: false,
      },
    };
    const moved = simulation.applyAction(staged, "forward");
    const panel = new dialogue.DialogueDirector().update(staged, moved, { editMode: false, cheatMode: false });
    return moved.player.hop?.kind === "targetPullback"
      && moved.player.hop?.toZ === 0
      && moved.player.z === 4
      && moved.stage.mode === "chase"
      && moved.stage.catchCount === 0
      && moved.stage.target.visible === true
      && moved.stage.lastEvent === "Target missed"
      && panel?.eventType === "TARGET_MISSED";
  });
  check("hero hop speeds up after the second difficulty ramp", () => {
    const state = simulation.createInitialState(stageMap.baselineStageMap(), 0, 0);
    const beforeRamp = {
      ...state,
      phase: "running",
      player: { x: 0, z: 127, maxZ: 127 },
      stage: { ...state.stage, mode: "chase", target: { x: 0, z: 140, visible: true }, introCameraHandoffDone: true },
    };
    const afterRamp = {
      ...state,
      phase: "running",
      player: { x: 0, z: 128, maxZ: 128 },
      stage: { ...state.stage, mode: "chase", target: { x: 0, z: 140, visible: true }, introCameraHandoffDone: true },
    };
    const beforeMove = simulation.applyAction(beforeRamp, "right");
    const afterMove = simulation.applyAction(afterRamp, "right");
    return approx(beforeMove.player.hop?.duration ?? 0, 0.19)
      && approx(afterMove.player.hop?.duration ?? 0, 0.19 / 1.1);
  });
  check("cheat mode bypasses intro river lock and moves three times faster", () => {
    const state = simulation.enterCheatMode(simulation.createInitialState(introBlockedRiverTown, 0, 0));
    const moved = simulation.applyAction(state, "forward", { cheatMode: true });
    const normalMoved = simulation.applyAction(simulation.enterCheatMode(simulation.createInitialState(introBlockedRiverTown, 0, 0)), "forward");
    return moved.stage.mode === "chase"
      && moved.player.hop?.toZ === 1
      && normalMoved.player.hop
      && Math.abs(moved.player.hop.duration - (normalMoved.player.hop.duration / 3)) < 0.0001;
  });
  check("intro target starts hidden", () => {
    const state = simulation.createInitialState(introFivePancakeTown, 0, 0);
    return state.stage.mode === "introPancakes" && state.stage.target.visible === false;
  });
  check("opening tutorial uses Mr Awesome and replaces old suspicious fallback", () => {
    const state = simulation.createInitialState(introFivePancakeTown, 0, 0);
    const director = new dialogue.DialogueDirector();
    const panel = director.update(undefined, state, { editMode: false, cheatMode: false });
    return panel.speaker === "A"
      && panel.eventType === "OPENING_TUTORIAL"
      && openingTutorialLines.has(panel.text)
      && !panel.text.includes("Nothing suspicious");
  });
  check("opening tutorial keeps one instruction line while idle", () => {
    let state = simulation.createInitialState(introFivePancakeTown, 0, 0);
    for (let index = 0; index < 104; index += 1) state = simulation.tickGame(state, 0.05, { hazardsEnabled: false });
    const director = new dialogue.DialogueDirector();
    const panel = director.update(undefined, state, { editMode: false, cheatMode: false });
    return panel.speaker === "A"
      && panel.eventType === "OPENING_TUTORIAL"
      && openingTutorialLines.has(panel.text);
  });
  check("opening tutorial does not return after first valid move", () => {
    const state = simulation.createInitialState(introRoadTown, 0, 0);
    const moved = simulation.applyAction(state, "forward");
    const director = new dialogue.DialogueDirector();
    const panel = director.update(state, moved, { editMode: false, cheatMode: false });
    return panel?.eventType !== "OPENING_TUTORIAL";
  });
  check("intro pancake reminders wait eight seconds and alternate", () => {
    const reminderLines = new Set(["More pancakes, please!", "I'm still hungry for pancakes..."]);
    let state = simulation.createInitialState(introFivePancakeTown, 0, 0);
    const director = new dialogue.DialogueDirector();
    let previous;
    director.update(undefined, state, { editMode: false, cheatMode: false });
    for (let index = 0; index < 3; index += 1) {
      previous = state;
      state = moveAndSettle(simulation, state);
      director.update(previous, state, { editMode: false, cheatMode: false });
    }
    const countThreeAt = state.time;
    let sawEarlyReminder = false;
    while (state.time < countThreeAt + 7.9) {
      previous = state;
      state = simulation.tickGame(state, 0.05, { hazardsEnabled: false });
      const panel = director.update(previous, state, { editMode: false, cheatMode: false });
      sawEarlyReminder ||= panel?.eventType === "PANCAKE_REMINDER";
    }
    if (sawEarlyReminder) return false;

    const seen = [];
    while (state.time < countThreeAt + 16.4 && seen.length < 2) {
      previous = state;
      state = simulation.tickGame(state, 0.05, { hazardsEnabled: false });
      const panel = director.update(previous, state, { editMode: false, cheatMode: false });
      if (panel?.eventType === "PANCAKE_REMINDER" && panel.text !== seen[seen.length - 1]) seen.push(panel.text);
    }
    return seen.length === 2
      && reminderLines.has(seen[0])
      && reminderLines.has(seen[1])
      && seen[0] !== seen[1];
  });
  check("intro pancake reminder resets when another pancake is collected", () => {
    let state = simulation.createInitialState(introFivePancakeTown, 0, 0);
    const director = new dialogue.DialogueDirector();
    let previous;
    director.update(undefined, state, { editMode: false, cheatMode: false });
    for (let index = 0; index < 3; index += 1) {
      previous = state;
      state = moveAndSettle(simulation, state);
      director.update(previous, state, { editMode: false, cheatMode: false });
    }
    const countThreeAt = state.time;
    let reminderSeen = false;
    while (state.time < countThreeAt + 8.4 && !reminderSeen) {
      previous = state;
      state = simulation.tickGame(state, 0.05, { hazardsEnabled: false });
      const panel = director.update(previous, state, { editMode: false, cheatMode: false });
      reminderSeen = panel?.eventType === "PANCAKE_REMINDER";
    }
    if (!reminderSeen) return false;

    previous = state;
    state = moveAndSettle(simulation, state);
    const countFourAt = state.time;
    const collectionPanel = director.update(previous, state, { editMode: false, cheatMode: false });
    if (collectionPanel?.eventType === "PANCAKE_REMINDER") return false;
    while (state.time < countFourAt + 7.9) {
      previous = state;
      state = simulation.tickGame(state, 0.05, { hazardsEnabled: false });
      const panel = director.update(previous, state, { editMode: false, cheatMode: false });
      if (panel?.eventType === "PANCAKE_REMINDER") return false;
    }
    return true;
  });
  check("fifth intro pancake summons without counting the trigger pancake", () => {
    let state = simulation.createInitialState(introFivePancakeTown, 0, 0);
    for (let index = 0; index < 5; index += 1) state = moveAndSettle(simulation, state);
    return state.stage.mode === "summoning"
      && state.stage.target.visible
      && state.stage.target.x === 0
      && state.stage.target.z === 8
      && state.collectedPancakes.size === 4
      && state.stage.stolenPancakes.has("5:0")
      && (state.stage.stolenPancakesStartedAt ?? 0) > state.time
      && state.player.hop?.toZ === 2
      && state.player.hop.fromZ - state.player.hop.toZ === 3
      && state.player.hop.duration >= 0.8;
  });
  check("intro pancake reminder does not fire after the stolen fifth pancake", () => {
    let state = simulation.createInitialState(introFivePancakeTown, 0, 0);
    const director = new dialogue.DialogueDirector();
    let previous;
    director.update(undefined, state, { editMode: false, cheatMode: false });
    for (let index = 0; index < 5; index += 1) {
      previous = state;
      state = moveAndSettle(simulation, state);
      director.update(previous, state, { editMode: false, cheatMode: false });
    }
    if (state.stage.mode !== "summoning" || state.collectedPancakes.size !== 4) return false;
    for (let index = 0; index < 140; index += 1) {
      previous = state;
      state = simulation.tickGame(state, 0.05, { hazardsEnabled: false });
      const panel = director.update(previous, state, { editMode: false, cheatMode: false });
      if (panel?.eventType === "PANCAKE_REMINDER") return false;
    }
    return true;
  });
  check("five-second intro trigger uses the next pancake without counting it", () => {
    let state = simulation.createInitialState(introFivePancakeTown, 0, 0);
    state = moveAndSettle(simulation, state);
    for (let index = 0; index < 110; index += 1) state = simulation.tickGame(state, 0.05, { hazardsEnabled: false });
    state = moveAndSettle(simulation, state);
    return state.stage.mode === "summoning"
      && state.collectedPancakes.size === 1
      && state.collectedPancakes.has("1:0")
      && state.stage.stolenPancakes.has("2:0");
  });
  check("summon timer starts chase after the bump-back line", () => {
    let state = simulation.createInitialState(introFivePancakeTown, 0, 0);
    for (let index = 0; index < 5; index += 1) state = moveAndSettle(simulation, state);
    for (let index = 0; index < 30; index += 1) state = simulation.tickGame(state, 0.05, { hazardsEnabled: false });
    return state.stage.mode === "chase" && state.player.z === 2 && state.stage.target.visible;
  });
  check("reveal conversation blocks movement and arrow taps advance after a minimum", () => {
    let state = simulation.createInitialState(introFivePancakeTown, 0, 0);
    for (let index = 0; index < 5; index += 1) state = moveAndSettle(simulation, state);
    const tooEarly = simulation.applyAction(state, "forward");
    if (tooEarly.player.hop?.toZ !== state.player.hop?.toZ || (tooEarly.stage.revealConversationAdvanceSeconds ?? 0) !== 0) return false;
    for (let index = 0; index < 24; index += 1) state = simulation.tickGame(state, 0.05, { hazardsEnabled: false });
    const nudged = simulation.applyAction(state, "forward");
    if (nudged.player.hop || (nudged.stage.revealConversationAdvanceSeconds ?? 0) <= 0) return false;
    state = nudged;
    for (let index = 0; index < 230; index += 1) state = simulation.tickGame(state, 0.05, { hazardsEnabled: false });
    const released = simulation.applyAction(state, "forward");
    return released.player.hop?.toZ === 3;
  });
  check("target catch queues a forward respawn instead of stage clear", () => {
    const state = simulation.createInitialState(introFivePancakeTown, 0, 0);
    const staged = {
      ...state,
      phase: "running",
      player: { x: 0, z: 8, maxZ: 8 },
      stage: {
        ...state.stage,
        mode: "chase",
        target: { x: 0, z: 8, visible: true },
        targetSpawnHistory: [{ x: 0, z: 8 }],
      },
    };
    const ticked = simulation.tickGame(staged, 0.05, { hazardsEnabled: false });
    return ticked.phase === "running"
      && ticked.stage.target.visible === false
      && ticked.stage.targetEscape?.z === 8
      && ticked.stage.targetPending
      && ticked.stage.targetPending.z >= 22
      && ticked.stage.targetPending.z <= 31
      && ticked.stage.introCameraHandoffStartedAt !== undefined
      && ticked.stage.introCameraHandoffReleaseAt !== undefined
      && ticked.stage.catchCount === 1;
  });
  check("target catch spawns farther after the Big Lakes ramp", () => {
    const state = simulation.createInitialState(stageMap.baselineStageMap(), 0, 0);
    const staged = {
      ...state,
      phase: "running",
      player: { x: 0, z: 152, maxZ: 152 },
      stage: {
        ...state.stage,
        mode: "chase",
        target: { x: 0, z: 152, visible: true },
        targetSpawnHistory: [{ x: 0, z: 152 }],
        catchCount: 8,
        introCameraHandoffDone: true,
      },
    };
    const ticked = simulation.tickGame(staged, 0.05, { hazardsEnabled: false });
    return ticked.stage.targetPending !== undefined
      && ticked.stage.targetPending.z >= 186
      && ticked.stage.targetPending.z <= 202
      && approx((ticked.stage.targetRevealAt ?? 0) - ticked.time, 0.62 * (50 / 23))
      && ticked.stage.catchCount === 9;
  });
  check("target catch starts spawning farther after the first ramp", () => {
    const state = simulation.createInitialState(stageMap.baselineStageMap(), 0, 0);
    const staged = {
      ...state,
      phase: "running",
      player: { x: 0, z: 76, maxZ: 76 },
      stage: {
        ...state.stage,
        mode: "chase",
        target: { x: 0, z: 76, visible: true },
        targetSpawnHistory: [{ x: 0, z: 76 }],
        catchCount: 3,
        introCameraHandoffDone: true,
      },
    };
    const ticked = simulation.tickGame(staged, 0.05, { hazardsEnabled: false });
    return ticked.stage.targetPending !== undefined
      && ticked.stage.targetPending.z >= 97
      && ticked.stage.targetPending.z <= 109
      && approx((ticked.stage.targetRevealAt ?? 0) - ticked.time, 0.62 * (33 / 23))
      && ticked.stage.catchCount === 4;
  });
  check("target spawn distance increases gently with catch count", () => {
    const state = simulation.createInitialState(stageMap.baselineStageMap(), 0, 0);
    const earlyCatch = {
      ...state,
      phase: "running",
      player: { x: 0, z: 76, maxZ: 76 },
      stage: {
        ...state.stage,
        mode: "chase",
        target: { x: 0, z: 76, visible: true },
        targetSpawnHistory: [{ x: 0, z: 76 }],
        catchCount: 1,
        introCameraHandoffDone: true,
      },
    };
    const laterCatch = {
      ...earlyCatch,
      stage: {
        ...earlyCatch.stage,
        catchCount: 2,
      },
    };
    const early = simulation.tickGame(earlyCatch, 0.05, { hazardsEnabled: false });
    const later = simulation.tickGame(laterCatch, 0.05, { hazardsEnabled: false });
    return early.stage.targetPending !== undefined
      && later.stage.targetPending !== undefined
      && later.stage.targetPending.z > early.stage.targetPending.z
      && later.stage.targetPending.z >= 97
      && approx((later.stage.targetRevealAt ?? 0) - later.time, 0.62 * (33 / 23))
      && later.stage.catchCount === 3;
  });
  check("target spawns skip billboard rows and the two rows behind them", () => {
    const state = simulation.createInitialState(stageMap.baselineStageMap(), 0, 0);
    const staged = {
      ...state,
      phase: "running",
      player: { x: 0, z: 109, maxZ: 109 },
      stage: {
        ...state.stage,
        mode: "chase",
        target: { x: 0, z: 109, visible: true },
        targetSpawnHistory: [{ x: 0, z: 109 }],
        catchCount: 0,
        introCameraHandoffDone: true,
      },
    };
    const ticked = simulation.tickGame(staged, 0.05, { hazardsEnabled: false });
    return ticked.stage.targetPending !== undefined
      && ![127, 128, 129].includes(ticked.stage.targetPending.z)
      && ticked.stage.targetPending.z === 130;
  });
  check("first target catch blocks movement until camera handoff releases", () => {
    const state = simulation.createInitialState(introFivePancakeTown, 0, 0);
    const staged = {
      ...state,
      phase: "running",
      player: { x: 0, z: 8, maxZ: 8 },
      stage: {
        ...state.stage,
        mode: "chase",
        target: { x: 0, z: 8, visible: true },
        targetSpawnHistory: [{ x: 0, z: 8 }],
      },
    };
    let ticked = simulation.tickGame(staged, 0.05, { hazardsEnabled: false });
    const blocked = simulation.applyAction(ticked, "forward");
    if (blocked.player.hop) return false;
    for (let index = 0; index < 44; index += 1) ticked = simulation.tickGame(ticked, 0.05, { hazardsEnabled: false });
    const released = simulation.applyAction(ticked, "forward");
    return ticked.stage.introCameraHandoffDone
      && ticked.stage.target.visible
      && released.player.hop?.toZ === 9;
  });
  check("later target catches do not trigger intro camera handoff", () => {
    const state = simulation.createInitialState(introFivePancakeTown, 0, 0);
    const staged = {
      ...state,
      phase: "running",
      player: { x: 0, z: 8, maxZ: 8 },
      stage: {
        ...state.stage,
        mode: "chase",
        target: { x: 0, z: 8, visible: true },
        targetSpawnHistory: [{ x: 0, z: 8 }],
        catchCount: 1,
        introCameraHandoffDone: true,
      },
    };
    const ticked = simulation.tickGame(staged, 0.05, { hazardsEnabled: false });
    return ticked.stage.target.visible === false
      && ticked.stage.introCameraHandoffDone
      && ticked.stage.introCameraHandoffStartedAt === undefined
      && ticked.stage.targetRevealAt < ticked.time + 0.7;
  });
  check("missed target pulls hero back without counting a catch", () => {
    const state = simulation.createInitialState(stageMap.baselineStageMap(), 0, 0);
    const staged = {
      ...state,
      phase: "running",
      player: { x: 0, z: 14, maxZ: 14 },
      stage: {
        ...state.stage,
        mode: "chase",
        target: { x: 0, z: 6, visible: true },
        targetSpawnHistory: [{ x: 0, z: 6 }],
        catchCount: 1,
        autoTargetCatchCount: 3,
        introCameraHandoffDone: true,
      },
    };
    const ticked = simulation.tickGame(staged, 0.05, { hazardsEnabled: false });
    let settled = ticked;
    for (let index = 0; index < 20; index += 1) settled = simulation.tickGame(settled, 0.05, { hazardsEnabled: false });
    const panel = new dialogue.DialogueDirector().update(staged, ticked, { editMode: false, cheatMode: false });
    const missLines = new Set([
      "You forgot to catch me, young hero!",
      "Wrong way, hero. I'm over here!",
      "Pancakes later. Catch me first!",
      "Catch me to keep going!",
    ]);
    return ticked.player.hop?.kind === "targetPullback"
      && ticked.queuedMove === undefined
      && ticked.stage.catchCount === 1
      && ticked.stage.autoTargetCatchCount === 3
      && ticked.stage.target.visible === true
      && ticked.stage.target.z === 6
      && ticked.stage.targetPending === undefined
      && ticked.stage.targetEscape === undefined
      && settled.player.z < ticked.stage.target.z
      && settled.stage.catchCount === 1
      && panel?.speaker === "B"
      && panel.eventType === "TARGET_MISSED"
      && missLines.has(panel.text);
  });
  check("near-final target respawns at z315 before the final conversation", () => {
    const state = simulation.createInitialState(stageMap.baselineStageMap(), 0, 0);
    const staged = {
      ...state,
      phase: "running",
      player: { x: 0, z: 295, maxZ: 295 },
      stage: {
        ...state.stage,
        mode: "chase",
        target: { x: 0, z: 295, visible: true },
        targetSpawnHistory: [{ x: 0, z: 295 }],
        catchCount: 18,
        introCameraHandoffDone: true,
      },
    };
    const ticked = simulation.tickGame(staged, 0.05, { hazardsEnabled: false });
    const finalCatch = simulation.tickGame(
      {
        ...ticked,
        player: { x: ticked.stage.targetPending?.x ?? 0, z: 315, maxZ: 315 },
        stage: {
          ...ticked.stage,
          target: { x: ticked.stage.targetPending?.x ?? 0, z: 315, visible: true },
          targetPending: undefined,
          targetRevealAt: undefined,
          targetEscape: undefined,
        },
      },
      0.05,
      { hazardsEnabled: false },
    );
    return ticked.stage.targetPending?.z === 315
      && ticked.stage.targetPending.x === 0
      && finalCatch.stage.mode === "finalSequence"
      && finalCatch.stage.finalStartedAt !== undefined;
  });
  check("final ending starts when no safe forward target respawn exists", () => {
    const state = simulation.createInitialState(riverIntroTown, 0, 0);
    const staged = {
      ...state,
      phase: "running",
      player: { x: 0, z: 8, maxZ: 8 },
      stage: {
        ...state.stage,
        mode: "chase",
        target: { x: 0, z: 8, visible: true },
        targetSpawnHistory: [{ x: 0, z: 8 }],
        catchCount: 2,
        introCameraHandoffDone: true,
      },
    };
    const ticked = simulation.tickGame(staged, 0.05, { hazardsEnabled: false });
    const blocked = simulation.applyAction(ticked, "backward");
    const director = new dialogue.DialogueDirector();
    const panel = director.update(staged, ticked, { editMode: false, cheatMode: false });
    return ticked.stage.mode === "finalSequence"
      && ticked.stage.target.visible === false
      && ticked.stage.targetEscape?.z === 8
      && ticked.stage.targetPending === undefined
      && ticked.stage.finalStartedAt !== undefined
      && ticked.stage.finalRescueStartedAt !== undefined
      && ticked.stage.finalPoofStartedAt !== undefined
      && ticked.stage.finalFadeStartedAt !== undefined
      && ticked.stage.catchCount === 3
      && blocked.player.hop === undefined
      && panel.speaker === "B"
      && panel.text === "No! I forgot to build an exit!";
  });
  check("final first line holds through the two-second final theme cue", () => (
    approx(dialogue.FINAL_LINE_DURATIONS[0], 2.0)
    && approx(dialogue.FINAL_LINE_DURATIONS[0] + dialogue.FINAL_LINE_GAP_SECONDS, 2.4)
  ));
  check("final ending fades to black and restarts from the beginning", () => {
    const state = simulation.createInitialState(riverIntroTown, 0, 0);
    let staged = {
      ...state,
      phase: "running",
      player: { x: 0, z: 8, maxZ: 8 },
      stage: {
        ...state.stage,
        mode: "chase",
        target: { x: 0, z: 8, visible: true },
        targetSpawnHistory: [{ x: 0, z: 8 }],
        catchCount: 2,
        introCameraHandoffDone: true,
      },
    };
    staged = simulation.tickGame(staged, 0.05, { hazardsEnabled: false });
    const finalRunId = staged.runId;
    const finalFadeAt = staged.stage.finalFadeStartedAt;
    for (let index = 0; index < 380; index += 1) staged = simulation.tickGame(staged, 0.05, { hazardsEnabled: false });
    return finalFadeAt !== undefined
      && staged.runId === finalRunId + 1
      && staged.stage.mode === "introPancakes"
      && staged.stage.target.visible === false
      && staged.score === 0
      && staged.phase === "ready";
  });
  check("cheat mode skips intro camera handoff", () => {
    const state = simulation.enterCheatMode(simulation.createInitialState(introFivePancakeTown, 0, 0));
    return state.stage.mode === "chase" && state.stage.introCameraHandoffDone;
  });
  check("leaving cheat mode can advance the target to the next spawn", () => {
    const state = simulation.enterCheatMode(simulation.createInitialState(stageMap.baselineStageMap(), 0, 0));
    const staged = {
      ...state,
      player: { x: 0, z: 76, maxZ: 76 },
      stage: {
        ...state.stage,
        target: { x: 0, z: 76, visible: true },
        targetSpawnHistory: [{ x: 0, z: 76 }],
        catchCount: 2,
        introCameraHandoffDone: true,
      },
    };
    const advanced = simulation.advanceTargetToNextSpawn(staged);
    return advanced.stage.mode === "chase"
      && advanced.stage.target.visible === true
      && advanced.stage.target.z >= 97
      && advanced.stage.target.z <= 109
      && advanced.stage.catchCount === staged.stage.catchCount
      && advanced.stage.targetSpawnHistory.length === 2
      && advanced.stage.lastEvent === "Cheat Target Advanced";
  });
  check("cheat ending jump puts the hero near the final target", () => {
    const state = simulation.enterCheatMode(simulation.createInitialState(stageMap.baselineStageMap(), 0, 0));
    const jumped = simulation.jumpCheatToEnding(state);
    return jumped.stage.mode === "chase"
      && jumped.phase === "running"
      && jumped.player.hop === undefined
      && jumped.queuedMove === undefined
      && jumped.stage.target.visible === true
      && jumped.stage.target.z === 315
      && jumped.player.z < jumped.stage.target.z
      && jumped.stage.target.z - jumped.player.z <= 20
      && jumped.stage.lastEvent === "Cheat Ending Jump";
  });
  check("first obstacle tutorial waits until after the first target catch", () => {
    const state = simulation.createInitialState(introRoadTown, 0, 0);
    const baseChaseState = {
      ...state,
      phase: "running",
      time: 10,
      stage: {
        ...state.stage,
        mode: "chase",
        target: { x: 0, z: 2, visible: true },
        introCameraHandoffDone: true,
      },
    };
    const beforeFirstCatch = new dialogue.DialogueDirector().update(undefined, baseChaseState, { editMode: false, cheatMode: false });
    const afterFirstCatch = new dialogue.DialogueDirector().update(
      undefined,
      { ...baseChaseState, stage: { ...baseChaseState.stage, catchCount: 1 } },
      { editMode: false, cheatMode: false },
    );
    return beforeFirstCatch?.eventType !== "FIRST_OBSTACLE"
      && afterFirstCatch?.eventType === "FIRST_OBSTACLE";
  });
  check("reveal dialogue suppresses lower-priority comments", () => {
    let state = simulation.createInitialState(introFivePancakeTown, 0, 0);
    for (let index = 0; index < 5; index += 1) state = moveAndSettle(simulation, state);
    const director = new dialogue.DialogueDirector();
    const panel = director.update(undefined, state, { editMode: false, cheatMode: false });
    return panel.speaker === "B"
      && panel.eventType === "VILLAIN_REVEAL"
      && panel.text === "Thanks for the pancakes. I trapped your friends too!";
  });
  check("first-stage target reminder waits three seconds after reveal", () => {
    const state = simulation.createInitialState(riverIntroTown, 0, 0);
    const baseStage = {
      ...state.stage,
      mode: "chase",
      target: { x: 0, z: 8, visible: true },
      targetSpawnHistory: [{ x: 0, z: 8 }],
      summonStartedAt: 0,
      catchCount: 0,
      introCameraHandoffDone: false,
    };
    const early = {
      ...state,
      phase: "running",
      time: dialogue.REVEAL_TOTAL_SECONDS + 2.95,
      player: { x: 0, z: 4, maxZ: 4 },
      stage: baseStage,
    };
    const ready = { ...early, time: dialogue.REVEAL_TOTAL_SECONDS + 3.05 };
    const earlyPanel = new dialogue.DialogueDirector().update(undefined, early, { editMode: false, cheatMode: false });
    const readyPanel = new dialogue.DialogueDirector().update(undefined, ready, { editMode: false, cheatMode: false });
    return earlyPanel === undefined
      && readyPanel?.speaker === "B"
      && readyPanel.eventType === "TARGET_MISSED";
  });
  check("first-stage river pullback keeps active target reminder", () => {
    const state = simulation.createInitialState(riverIntroTown, 0, 0);
    const staged = {
      ...state,
      phase: "running",
      time: dialogue.REVEAL_TOTAL_SECONDS + 3.05,
      player: { x: 0, z: 4, maxZ: 4 },
      stage: {
        ...state.stage,
        mode: "chase",
        target: { x: 0, z: 8, visible: true },
        targetSpawnHistory: [{ x: 0, z: 8 }],
        summonStartedAt: 0,
        catchCount: 0,
        introCameraHandoffDone: false,
      },
    };
    const director = new dialogue.DialogueDirector();
    const reminder = director.update(undefined, staged, { editMode: false, cheatMode: false });
    const pulled = simulation.applyAction(staged, "forward");
    const afterPullback = director.update(staged, pulled, { editMode: false, cheatMode: false });
    return reminder?.eventType === "TARGET_MISSED"
      && pulled.player.hop?.kind === "targetPullback"
      && pulled.player.hop.toZ === 0
      && afterPullback?.eventType === "TARGET_MISSED"
      && afterPullback.text === reminder.text;
  });
  check("first catch handoff dialogue happens once", () => {
    const state = simulation.createInitialState(introFivePancakeTown, 0, 0);
    const staged = {
      ...state,
      phase: "running",
      player: { x: 0, z: 8, maxZ: 8 },
      stage: {
        ...state.stage,
        mode: "chase",
        target: { x: 0, z: 8, visible: true },
        targetSpawnHistory: [{ x: 0, z: 8 }],
      },
    };
    const ticked = simulation.tickGame(staged, 0.05, { hazardsEnabled: false });
    const director = new dialogue.DialogueDirector();
    const panel = director.update(staged, ticked, { editMode: false, cheatMode: false });
    return panel.speaker === "B"
      && panel.eventType === "FIRST_CATCH_HANDOFF"
      && panel.text.includes("real chase");
  });
  check("later catches use normal catch barks", () => {
    const state = simulation.createInitialState(introFivePancakeTown, 0, 0);
    const staged = {
      ...state,
      phase: "running",
      player: { x: 0, z: 8, maxZ: 8 },
      stage: {
        ...state.stage,
        mode: "chase",
        target: { x: 0, z: 8, visible: true },
        targetSpawnHistory: [{ x: 0, z: 8 }],
        catchCount: 1,
        introCameraHandoffDone: true,
      },
    };
    const ticked = simulation.tickGame(staged, 0.05, { hazardsEnabled: false });
    const director = new dialogue.DialogueDirector();
    const panel = director.update(staged, ticked, { editMode: false, cheatMode: false });
    return panel.eventType === "TARGET_CAUGHT" && !panel.text.includes("real chase");
  });
  check("hit helper lines beat villain terrain teases", () => {
    const state = simulation.createInitialState(trainIntroTown, 0, 0);
    const trainLane = state.lanes.get(8);
    const span = simulation.getMovingSpans(trainLane, 0, -6, 6).find((item) => Math.abs(item.centerX) <= 6);
    if (!span) return false;
    const staged = {
      ...state,
      phase: "running",
      time: 0,
      player: { x: span.centerX, z: 8, maxZ: 8 },
      stage: {
        ...state.stage,
        mode: "chase",
        catchCount: 3,
        target: { x: 0, z: 20, visible: true },
        introCameraHandoffDone: true,
      },
    };
    const ticked = simulation.tickGame(staged, 0, { hazardsEnabled: true });
    const director = new dialogue.DialogueDirector();
    const panel = director.update(staged, ticked, { editMode: false, cheatMode: false });
    return panel.speaker === "A" && panel.eventType === "PLAYER_HIT" && panel.tone === "danger";
  });
  check("repeated failure stays as helper dialogue", () => {
    const state = simulation.createInitialState(trainIntroTown, 0, 0);
    const trainLane = state.lanes.get(8);
    const span = simulation.getMovingSpans(trainLane, 0, -6, 6).find((item) => Math.abs(item.centerX) <= 6);
    if (!span) return false;
    const director = new dialogue.DialogueDirector();
    const staged = { ...state, phase: "running", time: 0, player: { x: span.centerX, z: 8, maxZ: 8 } };
    const firstHit = simulation.tickGame(staged, 0, { hazardsEnabled: true });
    const firstPanel = director.update(staged, firstHit, { editMode: false, cheatMode: false });
    const stagedAgain = {
      ...firstHit,
      time: firstHit.time + 1,
      player: { x: span.centerX, z: 8, maxZ: 8 },
      stage: { ...firstHit.stage, lastEvent: "The chase is on" },
    };
    const secondHit = simulation.tickGame(stagedAgain, 0, { hazardsEnabled: true });
    const secondPanel = director.update(stagedAgain, secondHit, { editMode: false, cheatMode: false });
    return firstPanel.eventType === "PLAYER_HIT"
      && secondPanel.eventType === "PLAYER_HIT"
      && secondPanel.speaker === "A";
  });
  check("villain terrain teasing increases after catch count two", () => {
    const state = simulation.createInitialState(longValidTown, 0, 0);
    const staged = {
      ...state,
      phase: "running",
      time: 20,
      player: { x: 0, z: 5, maxZ: 5 },
      stage: {
        ...state.stage,
        mode: "chase",
        catchCount: 2,
        target: { x: 0, z: 22, visible: true },
        introCameraHandoffDone: true,
      },
    };
    const director = new dialogue.DialogueDirector();
    const panel = director.update(undefined, staged, { editMode: false, cheatMode: false });
    return panel.speaker === "B" && panel.eventType === "TERRAIN_BREADCRUMB";
  });
  check("terrain tags identify mixed road river train sections", () => {
    const state = simulation.createInitialState(trainIntroTown, 0, 0);
    const staged = { ...state, player: { x: 0, z: 4, maxZ: 4 } };
    return dialogue.terrainTagForState(staged, 5) === "MIXED_HARD";
  });
  check("landing on z13 triggers a hero relief comment", () => {
    const state = simulation.createInitialState(stageMap.baselineStageMap(), 0, 0);
    const staged = {
      ...state,
      phase: "running",
      time: 30,
      player: { ...state.player, z: 13, maxZ: 13 },
      stage: {
        ...state.stage,
        mode: "chase",
        catchCount: 1,
        target: { ...state.stage.summonMarker, visible: true },
        introCameraHandoffDone: true,
      },
    };
    const ticked = simulation.tickGame(staged, 0.05, { hazardsEnabled: false });
    const director = new dialogue.DialogueDirector();
    const panel = director.update(staged, ticked, { editMode: false, cheatMode: false });
    return ticked.stage.firstRiverClearedAt !== undefined
      && panel?.eventType === "FIRST_RIVER_CLEARED"
      && panel.speaker === "A";
  });
  check("applying a map can preserve the current edit position", () => {
    const state = simulation.createInitialState(longValidTown, 0, 0);
    const parsed = stageMap.parseStageMap(longValidTown);
    if (!parsed.stage) return false;
    const staged = { ...state, phase: "running", player: { x: 3, z: 17, maxZ: 17 }, score: 17 };
    const applied = simulation.applyStage(staged, parsed.stage, parsed.stage.source, { preservePlayer: true });
    return applied.player.x === 3 && applied.player.z === 17 && applied.score === 17 && applied.phase === "running";
  });
  check("preserved edit position falls back when the tile becomes blocked", () => {
    const state = simulation.createInitialState(dirtPathTown, 0, 0);
    const parsed = stageMap.parseStageMap(dirtPathTown);
    if (!parsed.stage) return false;
    const blockedX = parsed.stage.lanes.get(6)?.blockers[0];
    if (blockedX === undefined) return false;
    const staged = { ...state, phase: "running", player: { x: blockedX, z: 6, maxZ: 6 }, score: 6 };
    const applied = simulation.applyStage(staged, parsed.stage, parsed.stage.source, { preservePlayer: true });
    return applied.player.x === parsed.stage.playerStart.x && applied.player.z === parsed.stage.playerStart.z && applied.score === 0;
  });
  check("train collision recovers at least three ground lanes back in normal play", () => {
    const state = simulation.createInitialState(trainIntroTown, 0, 0);
    const trainLane = state.lanes.get(8);
    const span = simulation.getMovingSpans(trainLane, 0, -6, 6).find((item) => Math.abs(item.centerX) <= 6);
    if (!span) return false;
    const staged = { ...state, phase: "running", time: 0, player: { x: span.centerX, z: 8, maxZ: 8 } };
    const ticked = simulation.tickGame(staged, 0, { hazardsEnabled: true });
    return ticked.phase === "running" && ticked.crashReason === "Train" && ticked.player.z === 3;
  });
  check("train hazards are disabled in edit mode", () => {
    const state = simulation.createInitialState(trainIntroTown, 0, 0);
    const trainLane = state.lanes.get(8);
    const span = simulation.getMovingSpans(trainLane, 0, -6, 6).find((item) => Math.abs(item.centerX) <= 6);
    if (!span) return false;
    const staged = { ...state, phase: "running", time: 0, player: { x: span.centerX, z: 8, maxZ: 8 } };
    const ticked = simulation.tickGame(staged, 0, { hazardsEnabled: false });
    return ticked.phase === "running";
  });
  check("traffic collision recovers at least three ground lanes back in normal play", () => {
    const state = simulation.createInitialState(trainIntroTown, 0, 0);
    const roadLane = state.lanes.get(5);
    const span = simulation.getMovingSpans(roadLane, 0, -6, 6).find((item) => Math.abs(item.centerX) <= 6);
    if (!span) return false;
    const staged = { ...state, phase: "running", time: 0, player: { x: span.centerX, z: 5, maxZ: 5 } };
    const ticked = simulation.tickGame(staged, 0, { hazardsEnabled: true });
    return ticked.phase === "running" && ticked.crashReason === "Traffic" && ticked.player.z === 2;
  });
  check("river without platform recovers at least three ground lanes back in normal play", () => {
    const state = simulation.createInitialState(trainIntroTown, 0, 0);
    const riverLane = state.lanes.get(6);
    const spans = simulation.getMovingSpans(riverLane, 0, -6, 6);
    const waterX = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].find((x) => !spans.some((span) => Math.abs(x - span.centerX) <= span.length / 2 + 0.29));
    if (waterX === undefined) return false;
    const staged = { ...state, phase: "running", time: 0, player: { x: waterX, z: 6, maxZ: 6 } };
    const ticked = simulation.tickGame(staged, 0, { hazardsEnabled: true });
    return ticked.phase === "running" && ticked.crashReason === "Water" && ticked.player.z === 2;
  });
  check("hazard recovery preserves a far target for miss pullback logic", () => {
    const state = simulation.createInitialState(trainIntroTown, 0, 0);
    const trainLane = state.lanes.get(8);
    const span = simulation.getMovingSpans(trainLane, 0, -6, 6).find((item) => Math.abs(item.centerX) <= 6);
    if (!span) return false;
    const staged = {
      ...state,
      phase: "running",
      time: 0,
      player: { x: span.centerX, z: 8, maxZ: 8 },
      stage: {
        ...state.stage,
        mode: "chase",
        target: { x: 0, z: 35, visible: true },
        targetSpawnHistory: [{ x: 0, z: 20 }, { x: 0, z: 35 }],
      },
    };
    const ticked = simulation.tickGame(staged, 0, { hazardsEnabled: true });
    return ticked.crashReason === "Train"
      && ticked.stage.target.visible
      && ticked.stage.target.z === 35
      && ticked.stage.targetSpawnHistory.length === 2;
  });
  check("direction signs are screen directions for cars, trains, and logs", () => {
    const state = simulation.createInitialState(trainIntroTown, 0, 0);
    return state.lanes.get(5)?.direction === 1
      && state.lanes.get(6)?.direction === 1
      && state.lanes.get(8)?.direction === -1;
  });
  check("blocked target fails", () => !stageMap.parseStageMap(blockedTargetTown).ok);
  check("no rough path fails", () => !stageMap.parseStageMap(noRoughPathTown).ok);

  console.log("stage-map checks passed");
} finally {
  await rm(tmp, { recursive: true, force: true });
}

async function transpile(sourcePath, outName) {
  const source = await readFile(new URL(sourcePath, root), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      isolatedModules: true,
      strict: true,
    },
  }).outputText
    .replaceAll('from "./types"', 'from "./types.mjs"')
    .replaceAll('from "./stageMap"', 'from "./stageMap.mjs"')
    .replaceAll('from "./dialogue"', 'from "./dialogue.mjs"');
  await writeFile(join(tmp, outName), output);
}

function check(name, predicate) {
  if (!predicate()) throw new Error(`Failed: ${name}`);
  console.log(`ok: ${name}`);
}

function approx(actual, expected, epsilon = 0.0001) {
  return Math.abs(actual - expected) <= epsilon;
}

function tickUntilSettled(simulation, state, steps = 8) {
  let next = state;
  for (let index = 0; index < steps; index += 1) {
    next = simulation.tickGame(next, 0.05, { hazardsEnabled: false });
  }
  return next;
}

function moveAndSettle(simulation, state, move = "forward") {
  return tickUntilSettled(simulation, simulation.applyAction(state, move));
}
