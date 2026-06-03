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
  const stageMap = await import(new URL("stageMap.mjs", `file://${tmp}/`).href);
  const simulation = await import(new URL("simulation.mjs", `file://${tmp}/`).href);

  check("baseline map parses", () => stageMap.parseStageMap(stageMap.baselineStageMap()).ok);
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
  check("extended tree variant parses and pancake stays canonical", () => {
    const map = dirtPathTown.replace("#1", "#10").replace(" p ", " p1 ");
    const result = stageMap.parseStageMap(map);
    const serialized = result.stage ? stageMap.serializeStageMap(result.stage) : "";
    return result.ok && serialized.includes("#10") && serialized.includes("p1");
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
    .replaceAll('from "./stageMap"', 'from "./stageMap.mjs"');
  await writeFile(join(tmp, outName), output);
}

function check(name, predicate) {
  if (!predicate()) throw new Error(`Failed: ${name}`);
  console.log(`ok: ${name}`);
}
