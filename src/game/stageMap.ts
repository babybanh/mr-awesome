import {
  GRID,
  type Direction,
  type GroundTerrain,
  type GridPoint,
  type LaneState,
  type MoveStageObjectResult,
  type RiverTuning,
  type RoadTuning,
  type StageDefinition,
  type StageEditableAssetId,
  type StageObjectKind,
  type StageParseResult,
  type StagePlacedObject,
  type TrainTuning,
} from "./types";

export const STAGE_1_ASSET_SKIN = {
  treePrimary: "tree03",
  treeAccent: "tree05",
  buildingPrimary: "house02",
  buildingSecondary: "house01",
} as const;

const BUILDING_ASSET_TO_TOKEN = {
  house01: "1",
  house02: "2",
  house03: "3",
  house04: "4",
  shopBar: "5",
  shopCandy: "6",
  shopCasino: "7",
  shopPizza: "8",
  industrial01: "9",
  industrial02: "10",
  industrial03: "11",
} as const satisfies Partial<Record<StageEditableAssetId, string>>;

const BUILDING_FOOTPRINTS = {
  house01: { width: 2, depth: 3 },
  house02: { width: 3, depth: 3 },
  house03: { width: 3, depth: 2 },
  house04: { width: 3, depth: 3 },
  shopBar: { width: 3, depth: 3 },
  shopCandy: { width: 2, depth: 3 },
  shopCasino: { width: 4, depth: 4 },
  shopPizza: { width: 2, depth: 3 },
  industrial01: { width: 2, depth: 4 },
  industrial02: { width: 3, depth: 4 },
  industrial03: { width: 2, depth: 4 },
} as const satisfies Partial<Record<StageEditableAssetId, { width: number; depth: number }>>;

const TREE_TOKEN_TO_ASSET = {
  "#1": "tree01",
  "#2": "tree02",
  "#3": "tree03",
  "#4": "tree04",
  "#5": "tree05",
} as const satisfies Record<string, StageEditableAssetId>;

const TREE_ASSET_TO_TOKEN = {
  tree01: "1",
  tree02: "2",
  tree03: "3",
  tree04: "4",
  tree05: "5",
} as const satisfies Partial<Record<StageEditableAssetId, string>>;

const PANCAKE_ASSET_TO_TOKEN = {
  pancake: "1",
} as const satisfies Partial<Record<StageEditableAssetId, string>>;

const WARNING_TOKEN_TO_ASSET = {
  "!1": "warningSign01",
  "!2": "warningSign02",
} as const satisfies Record<string, StageEditableAssetId>;

const WARNING_ASSET_TO_TOKEN = {
  warningSign01: "1",
  warningSign02: "2",
} as const satisfies Partial<Record<StageEditableAssetId, string>>;

const BILLBOARD_TOKEN_TO_ASSET = {
  "@1": "billboard01",
  "@2": "billboard02",
} as const satisfies Record<string, StageEditableAssetId>;

const BILLBOARD_ASSET_TO_TOKEN = {
  billboard01: "1",
  billboard02: "2",
} as const satisfies Partial<Record<StageEditableAssetId, string>>;

const BILLBOARD_FOOTPRINTS = {
  billboard01: { width: 3, depth: 1 },
  billboard02: { width: 4, depth: 1 },
} as const satisfies Partial<Record<StageEditableAssetId, { width: number; depth: number }>>;

const BUILDING_VARIANTS = Object.keys(BUILDING_ASSET_TO_TOKEN) as StageEditableAssetId[];
const TREE_VARIANTS = Object.values(TREE_TOKEN_TO_ASSET);
const WARNING_VARIANTS = Object.values(WARNING_TOKEN_TO_ASSET);
const BILLBOARD_VARIANTS = Object.values(BILLBOARD_TOKEN_TO_ASSET);

export function baselineStageMap(): string {
  return `CR_STAGE_MAP v0.1
STAGE: 1
NAME: v110B_apartment_shop_final_candidate
MODE: authored
TARGET_MODE: fixed_goal

z=462 W< | log=S speed=F gap=S |
z=461 W> | log=L speed=S gap=M |
z=460 W< | log=M speed=F gap=L |
z=459 R< | vehicle=S speed=M gap=M density=M cover=none color=mixed seed=61 |
z=458 R> | vehicle=S speed=M gap=M density=M cover=none color=mixed seed=61 |
z=457 R< | vehicle=S speed=M gap=M density=M cover=none color=mixed seed=61 |
z=456 D  | . . . B6 b6 . . . B8 b8 . . . |
z=455 G  | #4 . . b6 b6 . . . b8 b8 . . #4 |
z=454 D  | . . #4 b6 b6 #4 . #4 b8 b8 #4 . . |
z=453 G  | . . . p1 . . . . . p1 . . . |
z=452 D  | #4 . . . . . p1 . . . . . #4 |
z=451 R> | vehicle=S speed=S gap=L density=L cover=none |
z=450 T> | train=L speed=S gap=L warn=L |
z=449 T< | train=L speed=M gap=M warn=L |
z=448 R< | vehicle=S speed=S gap=L density=L cover=none |
z=447 D  | . . B1 b1 . . . . B2 b2 b2 . . |
z=446 D  | #3 . b1 b1 . #3 p1 #3 b2 b2 b2 #3 . |
z=445 D  | . #3 b1 b1 p1 . . . b2 b2 b2 . #3 |
z=444 D  | . . . . . . . . p1 . . . . |
z=443 R> | vehicle=S speed=M gap=M density=L cover=none color=mixed seed=23 |
z=442 R> | vehicle=M speed=S gap=M density=H cover=none color=mixed seed=23 |
z=441 D  | . . . . . . . . !2 . . . . |
z=440 T> | train=L speed=S gap=L warn=L |
z=439 T< | train=L speed=M gap=M warn=L |
z=438 D  | . . . . . . . . !2 . . . . |
z=437 D  | #3 . . . . . . . . . . . #3 |
z=436 R< | vehicle=S speed=M gap=M density=L cover=none color=mixed seed=23 |
z=435 R< | vehicle=M speed=S gap=M density=L cover=none color=mixed seed=23 |
z=434 D  | . . B5 b5 b5 . . . #3 B10 b10 b10 . |
z=433 D  | . . b5 b5 b5 . . . . b10 b10 b10 . |
z=432 D  | . . b5 b5 b5 #3 . p1 . b10 b10 b10 . |
z=431 D  | . #3 . . . . . . . b10 b10 b10 #3 |
z=430 W< | log=S speed=S gap=S |
z=429 W> | log=M speed=M gap=M |
z=428 W< | log=M speed=F gap=M |
z=427 W> | log=S speed=F gap=S |
z=426 W< | log=M speed=M gap=M |
z=425 W> | log=M speed=S gap=M |
z=424 G  | . . B6 b6 . . . . B8 b8 . . . |
z=423 G  | #3 . b6 b6 . . . . b8 b8 . #3 . |
z=422 G  | . . b6 b6 . p1 . p1 b8 b8 . . . |
z=421 R> | vehicle=S speed=F gap=L density=L cover=none color=mixed seed=51 |
z=420 R< | vehicle=S speed=F gap=M density=L cover=none color=mixed seed=52 |
z=419 R> | vehicle=M speed=F gap=M density=L cover=none color=mixed seed=53 |
z=418 R< | vehicle=S speed=M gap=L density=L cover=none color=mixed seed=54 |
z=417 R> | vehicle=M speed=M gap=L density=L cover=none color=mixed seed=55 |
z=416 R< | vehicle=S speed=S gap=L density=L cover=none color=mixed seed=54 |
z=415 R> | vehicle=M speed=S gap=L density=L cover=none color=mixed seed=55 |
z=414 G  | #3 . . . . . . p1 . . . . #3 |
z=413 G  | . . B1 b1 p1 . . . . B2 b2 b2 . |
z=412 G  | . #3 b1 b1 . #3 . . #3 b2 b2 b2 . |
z=411 G  | . . b1 b1 . . . . . b2 b2 b2 . |
z=410 G  | . . . . . p1 . . . p1 . . . |
z=409 W> | log=M speed=S gap=S |
z=408 W< | log=M speed=M gap=M |
z=407 W> | log=L speed=S gap=S |
z=406 D  | . #3 . . #3 . . p1 #3 . . #3 . |
z=405 D  | . #4 . . . p1 . . . . . #4 . |
z=404 W< | log=M speed=M gap=S |
z=403 W> | log=L speed=M gap=M |
z=402 W< | log=L speed=M gap=L |
z=401 G  | . B1 b1 . . . p1 . . B2 b2 b2 . |
z=400 G  | . b1 b1 . #4 . . . #4 b2 b2 b2 . |
z=399 G  | . b1 b1 . . p1 . p1 . b2 b2 b2 . |
z=398 G  | #4 . . . . . . . . . . . #4 |
z=397 R< | vehicle=M speed=S gap=L density=H cover=none color=mixed seed=32 |
z=396 R< | vehicle=M speed=S gap=L density=M cover=none color=mixed seed=32 |
z=395 R< | vehicle=S speed=M gap=L density=H cover=none color=mixed seed=31 |
z=394 R> | vehicle=M speed=S gap=L density=H cover=none color=mixed seed=34 |
z=393 R> | vehicle=M speed=S gap=L density=M cover=none color=mixed seed=32 |
z=392 R> | vehicle=S speed=M gap=L density=M cover=none color=mixed seed=31 |
z=391 G  | . B4 b4 b4 . . . p1 B3 b3 b3 . . |
z=390 G  | . b4 b4 b4 #5 . . . b3 b3 b3 . #5 |
z=389 G  | #5 b4 b4 b4 . . p1 . . . . #5 . |
z=388 R> | vehicle=S speed=S gap=L density=L cover=none color=mixed seed=51 |
z=387 G  | . . . . . . . !1 . . . . . |
z=386 T< | train=M speed=S gap=M warn=L |
z=385 T< | train=S speed=M gap=L warn=L |
z=384 T> | train=L speed=S gap=M warn=L |
z=383 T> | train=S speed=M gap=L warn=L |
z=382 G  | #1 . . . . p1 . . . . . #1 #1 |
z=381 R< | vehicle=S speed=S gap=L density=L cover=none color=mixed seed=51 |
z=380 G  | . B3 b3 b3 . . . p1 B4 b4 b4 . . |
z=379 G  | . b3 b3 b3 #5 . . . b4 b4 b4 . #5 |
z=378 G  | #5 . . #5 . . p1 . b4 b4 b4 #5 . |
z=377 R> | vehicle=S speed=S gap=M density=L cover=none color=mixed seed=31 |
z=376 R> | vehicle=M speed=M gap=L density=H cover=none color=mixed seed=32 |
z=375 R> | vehicle=S speed=M gap=L density=L cover=none color=mixed seed=33 |
z=374 G  | #5 . . . p1 . . . . . . . #5 |
z=373 G  | . . #5 . . . . p1 @1 @1 @1 . . |
z=372 R< | vehicle=M speed=S gap=L density=H cover=none color=mixed seed=34 |
z=371 R< | vehicle=M speed=S gap=L density=M cover=none color=mixed seed=32 |
z=370 R< | vehicle=S speed=M gap=L density=M cover=none color=mixed seed=31 |
z=369 D  | . #5 . . . . . . . . . #5 . |
z=368 G  | . . . B6 b6 . . . B8 b8 . . . |
z=367 D  | #5 . . b6 b6 #5 p1 . b8 b8 . . #5 |
z=366 G  | . #5 . b6 b6 . . . b8 b8 . #5 . |
z=365 D  | . . . . p1 . . . . p1 . . . |
z=364 R> | vehicle=S speed=M gap=M density=L cover=none color=mixed seed=23 |
z=363 R> | vehicle=M speed=S gap=M density=H cover=none color=mixed seed=23 |
z=362 D  | . . . !2 . . . . . !2 . . . |
z=361 T< | train=L speed=S gap=L warn=L |
z=360 T< | train=M speed=M gap=M warn=L |
z=359 T< | train=L speed=S gap=M warn=L |
z=358 D  | . . . !2 . . . . . !2 . . . |
z=357 R< | vehicle=S speed=M gap=M density=L cover=none color=mixed seed=23 |
z=356 R< | vehicle=M speed=S gap=M density=L cover=none color=mixed seed=23 |
z=355 R> | vehicle=S speed=M gap=M density=M cover=none color=mixed seed=61 |
z=354 R> | vehicle=M speed=S gap=M density=H cover=none color=mixed seed=62 |
z=353 D  | . . . . . . . . . p1 . #3 . |
z=352 W< | log=S speed=S gap=S |
z=351 W> | log=M speed=S gap=M |
z=350 W< | log=M speed=S gap=M |
z=349 G  | #3 B2 b2 b2 #3 B1 b1 . . #3 B8 b8 #3 |
z=348 D  | #3 b2 b2 b2 #3 b1 b1 . p1 #3 b8 b8 #3 |
z=347 G  | #3 b2 b2 b2 #3 b1 b1 . . #3 b8 b8 #3 |
z=346 D  | #3 . . . . . . p1 . . . . . |
z=345 G  | #3 #3 #3 p1 . . . . . . #3 #3 . |
z=344 R< | vehicle=S speed=M gap=M density=M cover=none color=mixed seed=61 |
z=343 R> | vehicle=S speed=M gap=M density=M cover=none color=mixed seed=61 |
z=342 R< | vehicle=S speed=M gap=M density=M cover=none color=mixed seed=61 |
z=341 D  | . . . B6 b6 . . . B8 b8 . . . |
z=340 G  | #4 . . b6 b6 . . . b8 b8 . . #4 |
z=339 D  | . . #4 b6 b6 #4 . #4 b8 b8 #4 . . |
z=338 G  | . . . p1 . . . . . p1 . . . |
z=337 D  | #4 . . . . . p1 . . . . . #4 |
z=336 R> | vehicle=S speed=S gap=L density=L cover=none |
z=335 T> | train=L speed=S gap=L warn=L |
z=334 R< | vehicle=S speed=S gap=L density=L cover=none |
z=333 G  | #5 B3 b3 b3 . . . . B4 b4 b4 . . |
z=332 D  | #5 b3 b3 b3 . #5 . . b4 b4 b4 . #5 |
z=331 G  | . #5 . . . #5 . p1 b4 b4 b4 #5 . |
z=330 R< | vehicle=S speed=S gap=M density=L cover=none |
z=329 R> | vehicle=S speed=S gap=M density=L cover=none |
z=328 G  | #5 . #5 . p1 . . . p1 . #5 . #5 |
z=327 D  | . . . . . . . . . . . . . |
z=326 G  | . #5 . . . p1 . . p1 . . #5 . |
z=325 R< | vehicle=S speed=S gap=L density=L cover=none |
z=324 R> | vehicle=S speed=S gap=L density=L cover=none |
z=323 G  | . . . B6 b6 . . . B8 b8 . . . |
z=322 D  | #5 . . b6 b6 #5 p1 . b8 b8 . . #5 |
z=321 G  | . #5 . b6 b6 . . . b8 b8 . #5 . |
z=320 D  | . . . . p1 . . . p1 . . . . |
z=319 W> | log=L speed=M gap=S |
z=318 W< | log=M speed=S gap=S |
z=317 W> | log=S speed=F gap=L |
z=316 W< | log=M speed=S gap=S |
z=315 G  | #5 . . . . p1 . #5 . . #5 . . |
z=314 G  | . #5 @1 @1 @1 . . . . p1 . #5 . |
z=313 R< | vehicle=S speed=M gap=L density=M cover=none color=mixed seed=31 |
z=312 R< | vehicle=S speed=M gap=L density=M cover=none color=mixed seed=31 |
z=311 R> | vehicle=S speed=M gap=L density=M cover=none color=mixed seed=31 |
z=310 R> | vehicle=S speed=M gap=L density=M cover=none color=mixed seed=31 |
z=309 G  | . #3 . . #3 . . p1 #3 p1 . #3 . |
z=308 G  | . #3 . #3 . p1 . #3 . . #3 . . |
z=307 W> | log=M speed=S gap=S |
z=306 W< | log=S speed=F gap=L |
z=305 W> | log=L speed=S gap=S |
z=304 W< | log=M speed=S gap=S |
z=303 D  | B7 b7 b7 b7 . . . . . . . . . |
z=302 D  | b7 b7 b7 b7 #3 . . . #3 B5 b5 b5 #3 |
z=301 D  | b7 b7 b7 b7 . . p1 . . b5 b5 b5 . |
z=300 D  | b7 b7 b7 b7 #3 . . . #3 b5 b5 b5 #3 |
z=299 D  | . . . . . . p1 . . . . . . |
z=298 D  | #3 . #3 . #3 . . . #3 . #3 . #3 |
z=297 R< | vehicle=M speed=S gap=L density=M cover=none color=mixed seed=32 |
z=296 R< | vehicle=M speed=S gap=L density=M cover=none color=mixed seed=32 |
z=295 R> | vehicle=S speed=M gap=L density=M cover=none color=mixed seed=31 |
z=294 R> | vehicle=S speed=M gap=L density=M cover=none color=mixed seed=31 |
z=293 D  | . . B6 b6 . . . . B8 b8 . . . |
z=292 D  | . #3 b6 b6 . p1 . . b8 b8 . #3 . |
z=291 D  | . . b6 b6 . . . . b8 b8 . . . |
z=290 R> | vehicle=S speed=M gap=L density=M cover=none color=mixed seed=31 |
z=289 R< | vehicle=S speed=M gap=L density=M cover=none color=mixed seed=31 |
z=288 R< | vehicle=M speed=S gap=L density=H cover=none color=mixed seed=34 |
z=287 R> | vehicle=M speed=S gap=L density=M cover=none color=mixed seed=32 |
z=286 D  | . B5 b5 b5 . . B8 b8 . B1 b1 . . |
z=285 G  | . b5 b5 b5 . . b8 b8 . b1 b1 . . |
z=284 D  | #4 b5 b5 b5 . #4 b8 b8 #4 b1 b1 #4 . |
z=283 G  | . . . . p1 . . . p1 . . . . |
z=282 W< | log=S speed=S gap=S |
z=281 W> | log=M speed=S gap=M |
z=280 W< | log=S speed=S gap=S |
z=279 D  | . #4 . . . . . p1 . . . #4 . |
z=278 G  | . #4 . . . p1 . . . . . #4 . |
z=277 W< | log=S speed=M gap=S |
z=276 W> | log=M speed=M gap=M |
z=275 W< | log=L speed=M gap=L |
z=274 G  | . B1 b1 . . . p1 . . B2 b2 b2 . |
z=273 G  | . b1 b1 . #4 . . . #4 b2 b2 b2 . |
z=272 G  | . b1 b1 . . p1 . p1 . b2 b2 b2 . |
z=271 G  | #4 . . . . . . . . . . . #4 |
z=270 R< | vehicle=M speed=S gap=L density=M cover=none color=mixed seed=32 |
z=269 R< | vehicle=M speed=S gap=L density=M cover=none color=mixed seed=32 |
z=268 R< | vehicle=S speed=M gap=L density=M cover=none color=mixed seed=31 |
z=267 R> | vehicle=M speed=S gap=L density=H cover=none color=mixed seed=34 |
z=266 R> | vehicle=M speed=S gap=L density=M cover=none color=mixed seed=32 |
z=265 R> | vehicle=S speed=M gap=L density=M cover=none color=mixed seed=31 |
z=264 G  | . B4 b4 b4 . . . p1 B3 b3 b3 . . |
z=263 G  | . b4 b4 b4 #5 . . . b3 b3 b3 . #5 |
z=262 G  | #5 b4 b4 b4 . . p1 . . . . #5 . |
z=261 R> | vehicle=S speed=S gap=L density=L cover=none color=mixed seed=51 |
z=260 G  | . . . . . . . !1 . . . . . |
z=259 T< | train=L speed=S gap=L warn=L |
z=258 G  | #1 . . . . p1 . . . . . #1 #1 |
z=257 R< | vehicle=S speed=S gap=L density=L cover=none color=mixed seed=51 |
z=256 G  | . B3 b3 b3 . . . p1 B4 b4 b4 . . |
z=255 G  | . b3 b3 b3 #5 . . . b4 b4 b4 . #5 |
z=254 G  | #5 . . #5 . . p1 . b4 b4 b4 #5 . |
z=253 R> | vehicle=S speed=S gap=M density=L cover=none color=mixed seed=31 |
z=252 R> | vehicle=M speed=M gap=L density=H cover=none color=mixed seed=32 |
z=251 R> | vehicle=S speed=M gap=L density=L cover=none color=mixed seed=33 |
z=250 G  | #5 . . . p1 . . . . . . . #5 |
z=249 G  | . . #5 . . . . p1 @1 @1 @1 . . |
z=248 R< | vehicle=M speed=S gap=L density=H cover=none color=mixed seed=34 |
z=247 R< | vehicle=M speed=S gap=L density=M cover=none color=mixed seed=32 |
z=246 R< | vehicle=S speed=M gap=L density=M cover=none color=mixed seed=31 |
z=245 D  | . #5 . . . . . . . . . #5 . |
z=244 G  | . . . B6 b6 . . . B8 b8 . . . |
z=243 D  | #5 . . b6 b6 #5 p1 . b8 b8 . . #5 |
z=242 G  | . #5 . b6 b6 . . . b8 b8 . #5 . |
z=241 D  | . . . . p1 . . . . p1 . . . |
z=240 R> | vehicle=S speed=M gap=M density=L cover=none color=mixed seed=23 |
z=239 R> | vehicle=M speed=S gap=M density=H cover=none color=mixed seed=23 |
z=238 D  | . . . !2 . . . . . . . !2 . |
z=237 T< | train=L speed=S gap=L warn=L |
z=236 T< | train=M speed=M gap=M warn=L |
z=235 T< | train=L speed=S gap=M warn=L |
z=234 D  | #3 . . . . . . . . . . . #3 |
z=233 R< | vehicle=S speed=M gap=M density=L cover=none color=mixed seed=23 |
z=232 R< | vehicle=M speed=S gap=M density=L cover=none color=mixed seed=23 |
z=231 D  | . . B9 b9 . . . . . #5 . . . |
z=230 G  | #5 . b9 b9 . . p1 . . . . #5 . |
z=229 D  | . . b9 b9 . . . . . B11 b11 . . |
z=228 G  | . #5 b9 b9 . . . . . b11 b11 . . |
z=227 D  | . p1 . . . . . p1 . b11 b11 . #5 |
z=226 G  | . . #5 @2 @2 @2 @2 . #5 b11 b11 . . |
z=225 D  | . . . . . . . . . p1 . . . |
z=224 W< | log=S speed=S gap=S |
z=223 W> | log=M speed=S gap=M |
z=222 W< | log=M speed=S gap=M |
z=221 G  | #1 #1 B8 b8 #1 . . #1 B1 b1 . #1 #1 |
z=220 G  | #1 #1 b8 b8 #1 . . #1 b1 b1 . #1 #1 |
z=219 G  | #1 #1 b8 b8 #1 p1 . p1 b1 b1 . #1 #1 |
z=218 R> | vehicle=S speed=S gap=M density=M cover=none color=mixed seed=21 |
z=217 R> | vehicle=M speed=M gap=L density=M cover=none color=mixed seed=22 |
z=216 R> | vehicle=S speed=M gap=L density=M cover=none color=mixed seed=23 |
z=215 G  | #1 . . . p1 . . . p1 . . . #1 |
z=214 R< | vehicle=L speed=S gap=L density=M cover=none color=mixed seed=24 |
z=213 R< | vehicle=M speed=S gap=M density=H cover=none color=mixed seed=25 |
z=212 R< | vehicle=M speed=S gap=M density=H cover=none color=mixed seed=25 |
z=211 G  | . . . . . . . . . . . . . |
z=210 G  | #1 #1 B6 b6 #1 p1 . #1 B8 b8 . #1 #1 |
z=209 G  | #1 #1 b6 b6 #1 . . #1 b8 b8 . #1 #1 |
z=208 G  | #1 #1 b6 b6 #1 . p1 #1 b8 b8 . #1 #1 |
z=207 R> | vehicle=S speed=S gap=L density=L cover=none |
z=206 R< | vehicle=S speed=S gap=L density=L cover=none |
z=205 R< | vehicle=S speed=S gap=L density=L cover=none |
z=204 G  | #1 p1 . . p1 . . . p1 . . #1 #1 |
z=203 R> | vehicle=S speed=S gap=L density=L cover=none |
z=202 R< | vehicle=S speed=S gap=L density=L cover=none |
z=201 R< | vehicle=S speed=S gap=L density=L cover=none |
z=200 G  | . . . B2 b2 b2 p1 . B1 b1 . . . |
z=199 G  | #1 #1 #1 b2 b2 b2 . . b1 b1 #1 #1 #1 |
z=198 G  | #1 #1 #1 b2 b2 b2 p1 #1 b1 b1 #1 #1 #1 |
z=197 G  | . . @1 @1 @1 . . . . . . . . |
z=196 W< | log=S speed=S gap=S |
z=195 W> | log=M speed=S gap=M |
z=194 W< | log=M speed=S gap=M |
z=193 D  | . . . . . . . . . . . . . |
z=192 D  | . . . !2 . . . . . . !2 . . |
z=191 T> | train=L speed=S gap=L warn=L |
z=190 T< | train=M speed=S gap=L warn=L |
z=189 T> | train=L speed=M gap=M warn=L |
z=188 D  | #5 . . !2 . . . . . . !2 . #5 |
z=187 D  | . . . . . . . . . . . . . |
z=186 R< | vehicle=S speed=M gap=M density=H cover=none color=mixed seed=34 |
z=185 R< | vehicle=M speed=M gap=L density=M cover=none color=mixed seed=32 |
z=184 R< | vehicle=S speed=M gap=L density=M cover=none color=mixed seed=31 |
z=183 D  | . #5 . . . . . . . . . #5 . |
z=182 D  | . . . B6 b6 . . . B8 b8 . . . |
z=181 D  | #5 . . b6 b6 #5 p1 . b8 b8 . . #5 |
z=180 D  | . #5 . b6 b6 . . . b8 b8 . #5 . |
z=179 D  | . . . . p1 . . . . p1 . . . |
z=178 R> | vehicle=S speed=M gap=M density=L cover=none color=mixed seed=23 |
z=177 R> | vehicle=M speed=S gap=M density=H cover=none color=mixed seed=23 |
z=176 D  | . . . !2 . . . . . . . !2 . |
z=175 T< | train=L speed=S gap=L warn=L |
z=174 D  | #3 . . . . . . . . . . . #3 |
z=173 R< | vehicle=S speed=M gap=M density=L cover=none color=mixed seed=23 |
z=172 R< | vehicle=M speed=S gap=M density=L cover=none color=mixed seed=23 |
z=171 R> | vehicle=S speed=M gap=M density=M cover=none color=mixed seed=61 |
z=170 R> | vehicle=M speed=S gap=M density=H cover=none color=mixed seed=62 |
z=169 D  | . . . . . . . . . p1 . #3 . |
z=168 W< | log=S speed=S gap=S |
z=167 W> | log=M speed=S gap=M |
z=166 W< | log=M speed=S gap=M |
z=165 G  | #3 B2 b2 b2 #3 B1 b1 . . #3 B8 b8 #3 |
z=164 D  | #3 b2 b2 b2 #3 b1 b1 . p1 #3 b8 b8 #3 |
z=163 G  | #3 b2 b2 b2 #3 b1 b1 . . #3 b8 b8 #3 |
z=162 D  | #3 . . . . . . p1 . . . . . |
z=161 G  | #3 #3 #3 p1 . . . . . . #3 #3 . |
z=160 R< | vehicle=S speed=M gap=M density=M cover=none color=mixed seed=61 |
z=159 R> | vehicle=S speed=M gap=M density=M cover=none color=mixed seed=61 |
z=158 R< | vehicle=S speed=M gap=M density=M cover=none color=mixed seed=61 |
z=157 D  | . . . B6 b6 . . . B8 b8 . . . |
z=156 G  | #4 . . b6 b6 . . . b8 b8 . . #4 |
z=155 D  | . . #4 b6 b6 #4 . #4 b8 b8 #4 . . |
z=154 G  | . . . p1 . . . . . p1 . . . |
z=153 D  | #4 . . . . . p1 . . . . . #4 |
z=152 R> | vehicle=S speed=S gap=L density=L cover=none |
z=151 T> | train=L speed=S gap=L warn=L |
z=150 R< | vehicle=S speed=S gap=L density=L cover=none |
z=149 D  | . . B1 b1 . . . . B2 b2 b2 . . |
z=148 D  | #3 . b1 b1 . #3 p1 #3 b2 b2 b2 #3 . |
z=147 D  | . #3 b1 b1 p1 . . . b2 b2 b2 . #3 |
z=146 D  | . . . . . . . . p1 . . . . |
z=145 R> | vehicle=S speed=M gap=L density=L cover=none color=mixed seed=23 |
z=144 R> | vehicle=M speed=M gap=L density=H cover=none color=mixed seed=23 |
z=143 R> | vehicle=M speed=M gap=L density=H cover=none color=mixed seed=21 |
z=142 D  | . . . !2 . . . . . . . . . |
z=141 T< | train=L speed=S gap=L warn=L |
z=140 T> | train=M speed=S gap=L warn=L |
z=139 D  | #3 . . . . . . . . !2 . . #3 |
z=138 R< | vehicle=S speed=M gap=M density=L cover=none color=mixed seed=23 |
z=137 R< | vehicle=S speed=M gap=M density=L cover=none color=mixed seed=25 |
z=136 R< | vehicle=M speed=S gap=M density=L cover=none color=mixed seed=23 |
z=135 G  | #3 . B2 b2 b2 . . . #3 B10 b10 b10 . |
z=134 D  | . . b2 b2 b2 . . . . b10 b10 b10 . |
z=133 G  | . . b2 b2 b2 #3 . p1 . b10 b10 b10 . |
z=132 D  | . #3 . . . . . . . b10 b10 b10 #3 |
z=131 R< | vehicle=S speed=S gap=L density=L cover=none |
z=130 R< | vehicle=S speed=S gap=L density=L cover=none |
z=129 D  | . #3 . . . . . . . . #3 . . |
z=128 G  | . . . . . . . . p1 . . . . |
z=127 D  | . . @2 @2 @2 @2 . . . . . #3 . |
z=126 R> | vehicle=S speed=S gap=L density=L cover=none |
z=125 R> | vehicle=S speed=S gap=L density=L cover=none |
z=124 G  | . B5 b5 b5 . B6 b6 . . B8 b8 . . |
z=123 G  | . b5 b5 b5 . b6 b6 . . b8 b8 . . |
z=122 G  | #4 b5 b5 b5 #4 b6 b6 . #4 b8 b8 . #4 |
z=121 G  | . . . . p1 . . . p1 . . . . |
z=120 W< | log=S speed=S gap=S |
z=119 W> | log=M speed=S gap=M |
z=118 G  | . #4 . . . p1 . p1 . . . #4 . |
z=117 W< | log=S speed=S gap=S |
z=116 W> | log=M speed=S gap=M |
z=115 G  | . B1 b1 . . . p1 . . B2 b2 b2 . |
z=114 G  | . b1 b1 . #4 . . . #4 b2 b2 b2 . |
z=113 G  | . b1 b1 . . p1 . p1 . b2 b2 b2 . |
z=112 G  | #4 . . . . . . . . . . . #4 |
z=111 R< | vehicle=M speed=S gap=L density=M cover=none color=mixed seed=32 |
z=110 R< | vehicle=S speed=M gap=L density=M cover=none color=mixed seed=31 |
z=109 R< | vehicle=M speed=S gap=L density=H cover=none color=mixed seed=34 |
z=108 R< | vehicle=M speed=S gap=L density=M cover=none color=mixed seed=32 |
z=107 R< | vehicle=S speed=M gap=L density=M cover=none color=mixed seed=31 |
z=106 G  | . B4 b4 b4 . . . p1 B3 b3 b3 . . |
z=105 G  | . b4 b4 b4 #5 . . . b3 b3 b3 . #5 |
z=104 G  | #5 b4 b4 b4 . . p1 . . . . #5 . |
z=103 R> | vehicle=S speed=S gap=L density=L cover=none color=mixed seed=51 |
z=102 G  | . . . . . . . !1 . . . . . |
z=101 T< | train=L speed=S gap=L warn=L |
z=100 G  | #1 . . . . p1 . . . . . #1 #1 |
z=99 R< | vehicle=S speed=S gap=L density=L cover=none color=mixed seed=51 |
z=98 G  | . B3 b3 b3 . . . p1 B4 b4 b4 . . |
z=97 G  | . b3 b3 b3 #5 . . . b4 b4 b4 . #5 |
z=96 G  | #5 . . #5 . . p1 . b4 b4 b4 #5 . |
z=95 R> | vehicle=S speed=S gap=M density=L cover=none color=mixed seed=31 |
z=94 R> | vehicle=M speed=M gap=L density=H cover=none color=mixed seed=32 |
z=93 R> | vehicle=S speed=M gap=L density=L cover=none color=mixed seed=33 |
z=92 G  | #5 . . . p1 . . . . . . . #5 |
z=91 G  | . . #5 . . . . p1 @1 @1 @1 . . |
z=90 R< | vehicle=M speed=S gap=L density=H cover=none color=mixed seed=34 |
z=89 R< | vehicle=M speed=S gap=L density=M cover=none color=mixed seed=32 |
z=88 R< | vehicle=S speed=M gap=L density=M cover=none color=mixed seed=31 |
z=87 D  | . #5 . . . . . . . . . #5 . |
z=86 G  | . . . B6 b6 . . . B8 b8 . . . |
z=85 D  | #5 . . b6 b6 #5 p1 . b8 b8 . . #5 |
z=84 G  | . #5 . b6 b6 . . . b8 b8 . #5 . |
z=83 D  | . . . . p1 . . . . p1 . . . |
z=82 R> | vehicle=S speed=M gap=M density=L cover=none color=mixed seed=23 |
z=81 R> | vehicle=M speed=S gap=M density=H cover=none color=mixed seed=23 |
z=80 D  | . . . !2 . . . . . . . !2 . |
z=79 T< | train=L speed=S gap=L warn=L |
z=78 D  | #3 . . . . . . . . . . . #3 |
z=77 R< | vehicle=S speed=M gap=M density=L cover=none color=mixed seed=23 |
z=76 R< | vehicle=M speed=S gap=M density=L cover=none color=mixed seed=23 |
z=75 D  | . . B9 b9 . . . . . #5 . . . |
z=74 G  | #5 . b9 b9 . . p1 . . . . #5 . |
z=73 D  | . . b9 b9 . . . . . B11 b11 . . |
z=72 G  | . #5 b9 b9 . . . . . b11 b11 . . |
z=71 D  | . p1 . . . . . p1 . b11 b11 . #5 |
z=70 G  | . . #5 @2 @2 @2 @2 . #5 b11 b11 . . |
z=69 D  | . . . . . . . . . p1 . . . |
z=68 W< | log=S speed=S gap=S |
z=67 W> | log=M speed=S gap=M |
z=66 W< | log=M speed=S gap=M |
z=65 D  | #3 . . . B7 b7 b7 b7 . . . . #3 |
z=64 D  | . . . . b7 b7 b7 b7 #3 . . . . |
z=63 D  | . B5 b5 b5 b7 b7 b7 b7 . . p1 . #3 |
z=62 D  | #3 b5 b5 b5 b7 b7 b7 b7 #3 . . . . |
z=61 D  | . b5 b5 b5 #3 . . p1 . . . #3 . |
z=60 R> | vehicle=S speed=M gap=M density=M cover=none color=mixed seed=61 |
z=59 R> | vehicle=M speed=S gap=M density=H cover=none color=mixed seed=62 |
z=58 D  | . . . . . . . . . p1 . #3 . |
z=57 W< | log=S speed=S gap=S |
z=56 W> | log=M speed=S gap=M |
z=55 W< | log=M speed=S gap=M |
z=54 G  | #3 B2 b2 b2 #3 B1 b1 . . #3 B8 b8 #3 |
z=53 D  | #3 b2 b2 b2 #3 b1 b1 . p1 #3 b8 b8 #3 |
z=52 G  | #3 b2 b2 b2 #3 b1 b1 . . #3 b8 b8 #3 |
z=51 D  | #3 . . . . . . p1 . . . . . |
z=50 G  | #3 #3 #3 p1 . . . . . . #3 #3 . |
z=49 R< | vehicle=S speed=M gap=M density=M cover=none color=mixed seed=61 |
z=48 R> | vehicle=S speed=M gap=M density=M cover=none color=mixed seed=61 |
z=47 R< | vehicle=S speed=M gap=M density=M cover=none color=mixed seed=61 |
z=46 D  | . . . B6 b6 . . . B8 b8 . . . |
z=45 G  | #4 . . b6 b6 . . . b8 b8 . . #4 |
z=44 D  | . . #4 b6 b6 #4 . #4 b8 b8 #4 . . |
z=43 G  | . . . p1 . . . . . p1 . . . |
z=42 D  | #4 . . . . . p1 . . . . . #4 |
z=41 R> | vehicle=S speed=S gap=L density=L cover=none |
z=40 T> | train=L speed=S gap=L warn=L |
z=39 R< | vehicle=S speed=S gap=L density=L cover=none |
z=38 D  | . . B1 b1 . . . . B2 b2 b2 . . |
z=37 D  | #3 . b1 b1 . #3 p1 #3 b2 b2 b2 #3 . |
z=36 D  | . #3 b1 b1 p1 . . . b2 b2 b2 . #3 |
z=35 D  | . . . . . . . . p1 . . . . |
z=34 R> | vehicle=S speed=M gap=M density=L cover=none color=mixed seed=23 |
z=33 R> | vehicle=M speed=S gap=M density=H cover=none color=mixed seed=23 |
z=32 D  | . . . !2 . . . . . . . !2 . |
z=31 T< | train=L speed=S gap=L warn=L |
z=30 D  | #3 . . . . . . . . . . . #3 |
z=29 R< | vehicle=S speed=M gap=M density=L cover=none color=mixed seed=23 |
z=28 R< | vehicle=M speed=S gap=M density=L cover=none color=mixed seed=23 |
z=27 D  | . . B5 b5 b5 . . . #3 B10 b10 b10 . |
z=26 D  | . . b5 b5 b5 . . . . b10 b10 b10 . |
z=25 D  | . . b5 b5 b5 #3 . p1 . b10 b10 b10 . |
z=24 D  | . #3 . . . . . . . b10 b10 b10 #3 |
z=23 R< | vehicle=S speed=S gap=L density=L cover=none |
z=22 R< | vehicle=S speed=S gap=L density=L cover=none |
z=21 D  | . #3 . . . p1 . . . . #3 . . |
z=20 D  | . . . #3 . . . . p1 . . #3 . |
z=19 R> | vehicle=S speed=S gap=L density=L cover=none |
z=18 R> | vehicle=S speed=S gap=L density=L cover=none |
z=17 D  | #3 . . . . . . . . B1 b1 . . |
z=16 D  | . . . . . #3 p1 . . b1 b1 . . |
z=15 D  | . @2 @2 @2 @2 . . . #3 b1 b1 . . |
z=14 R< | vehicle=S speed=S gap=L density=L cover=none |
z=13 R< | vehicle=S speed=S gap=L density=L cover=none |
z=12 W> | log=L speed=S gap=L |
z=11 W< | log=L speed=S gap=L |
z=10 W> | log=L speed=S gap=L |
z=09 G  | #1 #1 B6 b6 #1 . . #1 B8 b8 . #1 #1 |
z=08 G  | #1 #1 b6 b6 #1 . N #1 b8 b8 . #1 #1 |
z=07 G  | #1 #1 b6 b6 #1 p1 . . b8 b8 . #1 #1 |
z=06 R> | vehicle=S speed=S gap=L density=L cover=none |
z=05 G  | #1 #1 . . . . . p1 . . . #1 #1 |
z=04 R< | vehicle=S speed=S gap=L density=L cover=none |
z=03 G  | . . . B2 b2 b2 . . B1 b1 . . . |
z=02 G  | #1 #1 #1 b2 b2 b2 p1 . b1 b1 #1 #1 #1 |
z=01 G  | #1 #1 #1 b2 b2 b2 . . b1 b1 #1 #1 #1 |
z=00 G  | . . . p1 . . C . . p1 . . . |

END`;
}

export function parseStageMap(text: string): StageParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const rowRepair = repairRowZLabelsFromVisualOrder(text);
  if (rowRepair.repaired) warnings.push("INFO: Repaired z row labels from the visible top-to-bottom row order.");
  const lanes = new Map<number, LaneState>();
  const objects: StagePlacedObject[] = [];
  const expectedBuildingContinuations = new Map<string, string>();
  const lines = rowRepair.text.split(/\r?\n/);
  let sawHeader = false;
  let sawEnd = false;
  let stageId: 1 | undefined;
  let name = "tutorial_target";
  let mode = "authored";
  let targetMode = "fixed_goal";
  let playerStart: GridPoint | undefined;
  let target: GridPoint | undefined;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line === "END") {
      sawEnd = true;
      break;
    }
    if (line === "CR_STAGE_MAP v0.1") {
      sawHeader = true;
      continue;
    }
    if (line.startsWith("STAGE:")) {
      const parsed = Number.parseInt(line.slice(6).trim(), 10);
      if (parsed === 1) stageId = 1;
      else errors.push(`Invalid STAGE value: ${line.slice(6).trim()}. First pass only supports Stage 1.`);
      continue;
    }
    if (line.startsWith("NAME:")) {
      name = line.slice(5).trim() || name;
      continue;
    }
    if (line.startsWith("MODE:")) {
      mode = line.slice(5).trim();
      if (mode !== "authored") errors.push("Stage 1 MODE must be authored.");
      continue;
    }
    if (line.startsWith("TARGET_MODE:")) {
      targetMode = line.slice(12).trim();
      if (targetMode !== "fixed_goal") errors.push("Stage 1 TARGET_MODE must be fixed_goal.");
      continue;
    }

    const rowMatch = line.match(/^z=(\d+)\s+(G|D|R>|R<|TR|W>|W<|T>|T<)\s*\|\s*(.*?)\s*\|$/);
    if (!rowMatch) {
      errors.push(`Could not parse line: ${rawLine}`);
      continue;
    }

    const z = Number.parseInt(rowMatch[1] ?? "", 10);
    const code = rowMatch[2] ?? "";
    const content = rowMatch[3] ?? "";
    if (lanes.has(z)) {
      errors.push(`Duplicate lane z=${z}.`);
      continue;
    }

    const parsed = parseLane(z, code, content, expectedBuildingContinuations);
    errors.push(...parsed.errors);
    warnings.push(...parsed.warnings);
    lanes.set(z, parsed.lane);
    objects.push(...parsed.objects);
    for (const object of parsed.objects) {
      if (object.kind === "building") registerExpectedBuildingContinuations(expectedBuildingContinuations, object);
    }
    if (parsed.playerStart) {
      if (playerStart) errors.push("Exactly one C start is required; found duplicate C.");
      playerStart = parsed.playerStart;
    }
    if (parsed.target) {
      if (target) errors.push("Exactly one N target is required; found duplicate N.");
      target = parsed.target;
    }
  }

  if (!sawHeader) errors.push("Missing CR_STAGE_MAP v0.1 header.");
  if (!sawEnd) errors.push("Missing END line.");
  if (!stageId) errors.push("Missing STAGE: 1.");
  if (!playerStart) errors.push("Exactly one C start is required.");
  if (!target) errors.push("Exactly one N target is required.");

  const stage = stageId && playerStart && target
    ? rebuildStage({
        id: stageId,
        name,
        mode: "authored",
        targetMode: "fixed_goal",
        lanes,
        playerStart,
        target,
        objects,
        source: text,
        skin: STAGE_1_ASSET_SKIN,
      } satisfies StageDefinition)
    : undefined;

  if (stage) {
    const validation = validateStageDefinition(stage);
    errors.push(...validation.errors);
    warnings.push(...validation.warnings);
  }

  if (stage && errors.length === 0) {
    const normalized = serializeStageMap(stage);
    stage.source = normalized;
    return { ok: true, stage: { ...stage, source: normalized }, errors, warnings };
  }

  return { ok: errors.length === 0, stage, errors, warnings };
}

function repairRowZLabelsFromVisualOrder(text: string): { text: string; repaired: boolean } {
  const lines = text.split(/\r?\n/);
  const rowPattern = /^(\s*)z=(\d+)(\s+(?:G|D|R>|R<|TR|W>|W<|T>|T<)\s*\|.*)$/;
  const rows = lines
    .map((line, index) => {
      const match = line.match(rowPattern);
      return match ? { index, prefix: match[1] ?? "", z: Number.parseInt(match[2] ?? "0", 10), rest: match[3] ?? "" } : undefined;
    })
    .filter((row): row is { index: number; prefix: string; z: number; rest: string } => Boolean(row));

  if (!rows.length) return { text, repaired: false };

  const nextLines = [...lines];
  const maxZ = rows.length - 1;
  const needsRepair = rows.some((row, index) => row.z !== maxZ - index);
  if (!needsRepair) return { text, repaired: false };

  rows.forEach((row, index) => {
    nextLines[row.index] = `${row.prefix}z=${String(maxZ - index).padStart(2, "0")}${row.rest}`;
  });
  return { text: nextLines.join("\n"), repaired: true };
}

export function serializeStageMap(stage: StageDefinition): string {
  const rows = [
    "CR_STAGE_MAP v0.1",
    `STAGE: ${stage.id}`,
    `NAME: ${stage.name}`,
    `MODE: ${stage.mode}`,
    `TARGET_MODE: ${stage.targetMode}`,
    "",
  ];
  const maxZ = Math.max(...stage.lanes.keys());
  for (let z = maxZ; z >= 0; z -= 1) {
    const lane = stage.lanes.get(z);
    if (!lane) continue;
    rows.push(`z=${String(z).padStart(2, "0")} ${laneCode(lane)} | ${laneContent(stage, lane)} |`);
  }
  rows.push("", "END");
  return rows.join("\n");
}

export function serializeStageLane(stage: StageDefinition, z: number): string {
  const lane = stage.lanes.get(z);
  if (!lane) return "";
  return `z=${String(z).padStart(2, "0")} ${laneCode(lane)} | ${laneContent(stage, lane)} |`;
}

export function validateStageMap(text: string): string {
  const result = parseStageMap(text);
  const warnings = result.warnings.length ? `\n${result.warnings.join("\n")}` : "";
  if (result.ok) return `OK: Stage ${result.stage?.id} ${result.stage?.name} is valid.${warnings}`;
  return `${result.errors.join("\n")}${warnings}`;
}

export function exportStageFeedback(buildId: string, mapText: string, state: {
  player: GridPoint;
  stage: { target: GridPoint };
  collectedPancakes: Set<string>;
  score: number;
}): string {
  return [
    "CR_FEEDBACK v0.1",
    `BUILD: ${buildId}`,
    "STAGE: 1",
    "CAMERA: map_readability",
    "ZOOM: 150%",
    "SEED: authored",
    "",
    "LIKE:",
    "  ...",
    "",
    "DISLIKE:",
    "  ...",
    "",
    "PATCH_REQUEST:",
    "  ...",
    "",
    "CURRENT_MAP:",
    mapText,
    "",
    "CURRENT_STATE:",
    `PLAYER: x=${Math.round(state.player.x)} z=${Math.round(state.player.z)}`,
    `TARGET: x=${state.stage.target.x} z=${state.stage.target.z}`,
    `PANCAKES_COLLECTED: ${state.collectedPancakes.size}`,
    `SCORE: ${state.score}`,
    "",
    "END",
  ].join("\n");
}

export function objectAt(stage: StageDefinition, point: GridPoint): StagePlacedObject | undefined {
  if (stage.target.x === point.x && stage.target.z === point.z) {
    return {
      id: `target:${stage.target.z}:${stage.target.x}`,
      kind: "target",
      x: stage.target.x,
      z: stage.target.z,
      cells: [{ ...stage.target }],
    };
  }
  return stage.objects.find((object) => object.cells.some((cell) => samePoint(cell, point)));
}

export function objectKindAt(stage: StageDefinition, point: GridPoint): StageObjectKind | undefined {
  return objectAt(stage, point)?.kind;
}

export function moveStageObject(stage: StageDefinition, from: GridPoint, to: GridPoint): MoveStageObjectResult {
  const object = objectAt(stage, from);
  if (!object) return { ok: false, message: "No editable object found at the selected tile." };
  const nextObject = shiftedObjectFromGrab(object, from, to);
  return applyObjectPlacement(stage, object, nextObject, "move");
}

export function copyStageObject(stage: StageDefinition, from: GridPoint | StagePlacedObject, to: GridPoint): MoveStageObjectResult {
  const object = "cells" in from ? from : objectAt(stage, from);
  if (!object) return { ok: false, message: "No editable object found to copy." };
  if (object.kind === "target") return { ok: false, message: "Target is unique and cannot be copied." };
  const nextObject = objectFromTemplate(object, to);
  return applyObjectPlacement(stage, undefined, nextObject, "copy");
}

export function cycleStageObjectAsset(stage: StageDefinition, point: GridPoint, delta: 1 | -1): MoveStageObjectResult {
  const object = objectAt(stage, point);
  if (!object) return { ok: false, message: "Select a house, tree, warning sign, or billboard first." };
  if (object.kind !== "building" && object.kind !== "tree" && object.kind !== "warning" && object.kind !== "billboard") {
    return { ok: false, message: "Only buildings, trees, warning signs, and billboards have variants right now." };
  }

  const variants = object.kind === "building"
    ? BUILDING_VARIANTS
    : object.kind === "tree"
      ? TREE_VARIANTS
      : object.kind === "warning"
        ? WARNING_VARIANTS
        : BILLBOARD_VARIANTS;
  const current = object.assetId ?? variants[0]!;
  const index = variants.indexOf(current);
  const nextAsset = variants[(index + delta + variants.length) % variants.length]! as StageEditableAssetId;
  const nextObject = object.kind === "building"
    ? sizedObject(object, nextAsset, buildingFootprintCells(object.x, object.z, nextAsset))
    : object.kind === "billboard"
      ? sizedObject(object, nextAsset, billboardFootprintCells(object.x, object.z, nextAsset))
      : { ...object, assetId: nextAsset };
  return applyObjectPlacement(stage, object, nextObject, "variant");
}

function parseLane(z: number, code: string, content: string, expectedBuildingContinuations: Map<string, string>): {
  lane: LaneState;
  errors: string[];
  warnings: string[];
  objects: StagePlacedObject[];
  playerStart?: GridPoint;
  target?: GridPoint;
} {
  if (code === "TR") {
    return {
      lane: grassLane(z),
      errors: [`${code} is not supported in the Stage 1 first pass.`],
      warnings: [],
      objects: [],
    };
  }

  if (code === "W>" || code === "W<") {
    const parsedRiver = parseRiverProperties(content);
    return {
      lane: riverLane(z, screenDirectionToWorldDirection(code), parsedRiver.river),
      errors: parsedRiver.errors,
      warnings: [],
      objects: [],
    };
  }

  if (code === "T>" || code === "T<") {
    const parsedTrain = parseTrainProperties(content);
    return {
      lane: trainLane(z, screenDirectionToWorldDirection(code), parsedTrain.train),
      errors: parsedTrain.errors,
      warnings: [],
      objects: [],
    };
  }

  if (code === "R>" || code === "R<") {
    const parsedRoad = parseRoadProperties(content);
    return {
      lane: roadLane(z, screenDirectionToWorldDirection(code), parsedRoad.road),
      errors: parsedRoad.errors,
      warnings: [],
      objects: [],
    };
  }

  const tiles = content.split(/\s+/).filter(Boolean);
  const blockers: number[] = [];
  const buildings: number[] = [];
  const collectibles: number[] = [];
  const objects: StagePlacedObject[] = [];
  const consumed = new Set<number>();
  let playerStart: GridPoint | undefined;
  let target: GridPoint | undefined;
  const errors: string[] = [];

  if (tiles.length !== GRID.maxX - GRID.minX + 1) errors.push(`z=${z} grass row must contain 13 tile symbols.`);
  for (let index = 0; index < tiles.length; index += 1) {
    if (consumed.has(index)) continue;
    const symbol = tiles[index] ?? ".";
    const x = tokenIndexToX(index);

    if (symbol === ".") continue;
    if (symbol === "C") {
      playerStart = duplicatePoint(playerStart, { x, z }, "C", z, errors);
      continue;
    }
    if (symbol === "N") {
      target = duplicatePoint(target, { x, z }, "N", z, errors);
      continue;
    }
    if (symbol === "p" || symbol === "p1") {
      collectibles.push(x);
      objects.push(tileObject("pancake", x, z, "pancake"));
      continue;
    }
    if (/^p\d+$/.test(symbol)) {
      errors.push(`Unknown pancake symbol "${symbol}" at z=${z} x=${x}. Stage 1 only uses p or p1.`);
      continue;
    }
    if (symbol === "#" || /^#\d+$/.test(symbol)) {
      const assetId = symbol === "#" ? "tree03" : TREE_TOKEN_TO_ASSET[symbol as keyof typeof TREE_TOKEN_TO_ASSET];
      if (!assetId) {
        errors.push(`Unknown tree symbol "${symbol}" at z=${z} x=${x}.`);
        continue;
      }
      blockers.push(x);
      objects.push(tileObject("tree", x, z, assetId));
      continue;
    }
    if (/^!\d+$/.test(symbol)) {
      const assetId = WARNING_TOKEN_TO_ASSET[symbol as keyof typeof WARNING_TOKEN_TO_ASSET];
      if (!assetId) {
        errors.push(`Unknown warning sign symbol "${symbol}" at z=${z} x=${x}.`);
        continue;
      }
      objects.push(tileObject("warning", x, z, assetId));
      continue;
    }
    if (/^@\d+$/.test(symbol)) {
      const parsedBillboard = parseBillboard(index, z, tiles, consumed);
      objects.push(parsedBillboard.object);
      errors.push(...parsedBillboard.errors);
      continue;
    }
    if (symbol === "B" || /^B\d+$/.test(symbol)) {
      const parsedBuilding = parseBuilding(index, z, tiles, consumed);
      objects.push(parsedBuilding.object);
      buildings.push(...parsedBuilding.object.cells.filter((cell) => cell.z === z).map((cell) => cell.x));
      errors.push(...parsedBuilding.errors);
      continue;
    }
    if (/^b\d+$/.test(symbol)) {
      const expected = expectedBuildingContinuations.get(pointKey({ x, z }));
      if (expected === symbol) continue;
      if (expected) {
        errors.push(`Building continuation "${symbol}" at z=${z} x=${x} should be "${expected}".`);
        continue;
      }
      errors.push(`Building continuation "${symbol}" at z=${z} x=${x} needs a matching uppercase B anchor in its footprint.`);
      continue;
    }
    errors.push(`Unknown grass symbol "${symbol}" at z=${z} x=${x}.`);
  }

  return {
    lane: { ...grassLane(z, code === "D" ? "dirt" : "grass"), blockers, buildings, collectibles },
    errors,
    warnings: [],
    objects,
    playerStart,
    target,
  };
}

function parseBillboard(index: number, z: number, tiles: string[], consumed: Set<number>): { object: StagePlacedObject; errors: string[] } {
  const symbol = tiles[index] ?? "@1";
  const x = tokenIndexToX(index);
  const errors: string[] = [];
  const assetId = BILLBOARD_TOKEN_TO_ASSET[symbol as keyof typeof BILLBOARD_TOKEN_TO_ASSET];
  if (!assetId) errors.push(`Unknown billboard symbol "${symbol}" at z=${z} x=${x}.`);
  const footprint = billboardFootprint(assetId ?? "billboard01");
  const cells = billboardFootprintCells(x, z, assetId ?? "billboard01");

  if (index + footprint.width > tiles.length) {
    errors.push(`Billboard "${symbol}" at z=${z} x=${x} needs ${footprint.width} horizontal cells.`);
  }

  for (let offset = 1; offset < footprint.width; offset += 1) {
    const next = index + offset;
    const nextSymbol = tiles[next] ?? ".";
    if (next >= tiles.length) continue;
    if (nextSymbol === "." || nextSymbol === symbol) {
      consumed.add(next);
      continue;
    }
    errors.push(`Billboard "${symbol}" at z=${z} x=${x} needs "${symbol}" continuation at x=${tokenIndexToX(next)}.`);
  }

  return {
    object: {
      id: objectId("billboard", x, z, assetId, cells),
      kind: "billboard",
      x,
      z,
      cells,
      assetId: assetId ?? "billboard01",
    },
    errors,
  };
}

function parseBuilding(index: number, z: number, tiles: string[], consumed: Set<number>): { object: StagePlacedObject; errors: string[] } {
  const symbol = tiles[index] ?? "B";
  const x = tokenIndexToX(index);
  const errors: string[] = [];
  const assetId = symbol === "B" ? "house01" : buildingAssetFromToken(symbol);
  if (!assetId) errors.push(`Unknown building symbol "${symbol}" at z=${z} x=${x}.`);
  const cells = buildingFootprintCells(x, z, assetId ?? "house01");
  const token = assetId ? BUILDING_ASSET_TO_TOKEN[assetId as keyof typeof BUILDING_ASSET_TO_TOKEN] ?? "1" : "1";
  const footprint = buildingFootprint(assetId ?? "house01");

  for (let offset = 1; offset < footprint.width; offset += 1) {
    const next = index + offset;
    const expected = symbol === "B" ? "B" : `b${token}`;
    if ((tiles[next] ?? ".") === expected) {
      consumed.add(next);
    }
  }

  return {
    object: {
      id: objectId("building", x, z, assetId, cells),
      kind: "building",
      x,
      z,
      cells,
      assetId: assetId ?? "house01",
    },
    errors,
  };
}

function registerExpectedBuildingContinuations(expected: Map<string, string>, object: StagePlacedObject): void {
  const variant = BUILDING_ASSET_TO_TOKEN[(object.assetId ?? "house01") as keyof typeof BUILDING_ASSET_TO_TOKEN] ?? "1";
  for (const cell of object.cells) {
    if (cell.z >= object.z) continue;
    expected.set(pointKey(cell), `b${variant}`);
  }
}

function duplicatePoint<T>(existing: T | undefined, next: T, label: string, z: number, errors: string[]): T {
  if (existing) errors.push(`z=${z} contains duplicate ${label} symbols.`);
  return next;
}

function buildingAssetFromToken(token: string): StageEditableAssetId | undefined {
  const variant = token.slice(1);
  return BUILDING_VARIANTS.find((asset) => BUILDING_ASSET_TO_TOKEN[asset as keyof typeof BUILDING_ASSET_TO_TOKEN] === variant);
}

function grassLane(z: number, terrain: GroundTerrain = "grass"): LaneState {
  return {
    z,
    kind: "grass",
    terrain,
    direction: 1,
    blockers: [],
    buildings: [],
    collectibles: [],
    speed: 0,
    gap: 0,
    length: 0,
    phase: 0,
  };
}

const ROAD_SPEED_MULTIPLIER = 0.8 * 1.3;
const ROAD_MEDIUM_VEHICLE_SPEED_MULTIPLIER = 1.15;
const ROAD_GAP_MULTIPLIER = 1.7;
const RIVER_SPEED_MULTIPLIER = 1.2 * 1.2 * 0.7;
const RIVER_FAST_SPEED_MULTIPLIER = 1.2 * 0.7;
const RIVER_GAP_MULTIPLIER = 0.56;
const TRAIN_SPEED_MULTIPLIER = 1.2 * 1.5;
const TRAIN_GAP_MULTIPLIER = 2 * 1.2;
const POST_NICE_TRY_BILLBOARD_Z = 70;
const POST_NICE_TRY_SPEED_MULTIPLIER = 1.1;
const POST_NICE_TRY_GAP_MULTIPLIER = 0.9;
const POST_WATCH_FOR_GATORS_BILLBOARD_Z = 127;
const POST_WATCH_FOR_GATORS_SPEED_MULTIPLIER = 1.2;
const POST_WATCH_FOR_GATORS_GAP_MULTIPLIER = 0.8;
const POST_BIG_LAKES_BILLBOARD_Z = 197;
const POST_BIG_LAKES_ROAD_SPEED_MULTIPLIER = 1.2;
const POST_BIG_LAKES_ROAD_GAP_MULTIPLIER = 1.2;
const POST_BIG_LAKES_TRAIN_GAP_MULTIPLIER = 0.9;
const POST_BIG_LAKES_RIVER_SPEED_MULTIPLIER = 1.2;
const POST_FINAL_BILLBOARD_Z = 373;
const POST_FINAL_BILLBOARD_ROAD_SPEED_MULTIPLIER = 1.1;
const POST_FINAL_BILLBOARD_ROAD_GAP_MULTIPLIER = 1.1;

function sharedRoadTrainDifficultyMultiplier(z: number): { speed: number; gap: number } {
  let speed = 1;
  let gap = 1;
  if (z > POST_NICE_TRY_BILLBOARD_Z) {
    speed *= POST_NICE_TRY_SPEED_MULTIPLIER;
    gap *= POST_NICE_TRY_GAP_MULTIPLIER;
  }
  if (z > POST_WATCH_FOR_GATORS_BILLBOARD_Z) {
    speed *= POST_WATCH_FOR_GATORS_SPEED_MULTIPLIER;
    gap *= POST_WATCH_FOR_GATORS_GAP_MULTIPLIER;
  }
  return { speed, gap };
}

function roadDifficultyMultiplier(z: number): { speed: number; gap: number } {
  const difficulty = sharedRoadTrainDifficultyMultiplier(z);
  if (z > POST_BIG_LAKES_BILLBOARD_Z) {
    difficulty.speed *= POST_BIG_LAKES_ROAD_SPEED_MULTIPLIER;
    difficulty.gap *= POST_BIG_LAKES_ROAD_GAP_MULTIPLIER;
  }
  if (z > POST_FINAL_BILLBOARD_Z) {
    difficulty.speed *= POST_FINAL_BILLBOARD_ROAD_SPEED_MULTIPLIER;
    difficulty.gap *= POST_FINAL_BILLBOARD_ROAD_GAP_MULTIPLIER;
  }
  return difficulty;
}

function trainDifficultyMultiplier(z: number): { speed: number; gap: number } {
  const difficulty = sharedRoadTrainDifficultyMultiplier(z);
  if (z > POST_BIG_LAKES_BILLBOARD_Z) {
    difficulty.gap *= POST_BIG_LAKES_TRAIN_GAP_MULTIPLIER;
  }
  return difficulty;
}

function roadLane(z: number, direction: Direction, road: RoadTuning): LaneState {
  const difficulty = roadDifficultyMultiplier(z);
  const speed = (road.speedCode === "F" ? 3.25 : road.speedCode === "M" ? 2.35 : 1.55)
    * ROAD_SPEED_MULTIPLIER
    * (road.vehicleSize === "M" ? ROAD_MEDIUM_VEHICLE_SPEED_MULTIPLIER : 1)
    * difficulty.speed;
  const baseGap = road.gapCode === "S" ? 3.4 : road.gapCode === "M" ? 4.5 : 5.8;
  const densityFactor = road.densityCode === "H" ? 0.66 : road.densityCode === "M" ? 0.82 : 1;
  const gap = baseGap * densityFactor * ROAD_GAP_MULTIPLIER * difficulty.gap;
  const length = road.vehicleSize === "L" ? 3.3 : road.vehicleSize === "M" ? 2.2 : 1.35;
  return {
    z,
    kind: "road",
    direction,
    blockers: [],
    buildings: [],
    collectibles: [],
    road,
    speed,
    gap,
    length,
    phase: stablePhase(z, direction),
  };
}

function riverLane(z: number, direction: Direction, river: RiverTuning): LaneState {
  const speedDifficulty = z > POST_BIG_LAKES_BILLBOARD_Z ? POST_BIG_LAKES_RIVER_SPEED_MULTIPLIER : 1;
  const speed = (river.speedCode === "F" ? 2.8 : river.speedCode === "M" ? 2 : 1.4)
    * (river.speedCode === "F" ? RIVER_FAST_SPEED_MULTIPLIER : RIVER_SPEED_MULTIPLIER)
    * speedDifficulty;
  const gap = (river.gapCode === "S" ? 3.4 : river.gapCode === "L" ? 7 : 5) * RIVER_GAP_MULTIPLIER;
  const length = river.logSize === "L" ? 4.4 : river.logSize === "S" ? 1.85 : 3;
  return {
    z,
    kind: "river",
    direction,
    blockers: [],
    buildings: [],
    collectibles: [],
    river,
    speed,
    gap,
    length,
    phase: stablePhase(z, direction),
  };
}

function trainLane(z: number, direction: Direction, train: TrainTuning): LaneState {
  const difficulty = trainDifficultyMultiplier(z);
  const speed = (train.speedCode === "F" ? 4.8 : train.speedCode === "M" ? 3.4 : 2.2)
    * TRAIN_SPEED_MULTIPLIER
    * difficulty.speed;
  const gap = (train.gapCode === "S" ? 4.8 : train.gapCode === "M" ? 6.8 : 9.2) * TRAIN_GAP_MULTIPLIER * difficulty.gap;
  const length = train.trainSize === "L" ? 6.2 : train.trainSize === "M" ? 4.6 : 3.1;
  return {
    z,
    kind: "train",
    direction,
    blockers: [],
    buildings: [],
    collectibles: [],
    train,
    speed,
    gap,
    length,
    phase: stablePhase(z, direction),
  };
}

function parseRoadProperties(content: string): { road: RoadTuning; errors: string[] } {
  const props = Object.fromEntries(content.split(/\s+/).map((part) => part.split("=")).filter((part) => part.length === 2));
  const unknownKeys = Object.keys(props).filter((key) => key !== "vehicle" && key !== "speed" && key !== "gap" && key !== "density" && key !== "cover" && key !== "color" && key !== "seed");
  const cover = typeof props.cover === "string" ? props.cover : "none";
  const errors = [
    ...unknownKeys.map((key) => `Unknown road property "${key}". Use vehicle, speed, gap, density, cover, color, and seed.`),
  ];
  if (cover !== "none") errors.push("Stage 1 road cover must be cover=none.");
  if (props.vehicle && props.vehicle !== "S" && props.vehicle !== "M" && props.vehicle !== "L") errors.push(`Invalid road vehicle value "${props.vehicle}". Use S, M, or L.`);
  if (props.speed && props.speed !== "S" && props.speed !== "M" && props.speed !== "F") errors.push(`Invalid road speed value "${props.speed}". Use S, M, or F.`);
  if (props.gap && props.gap !== "S" && props.gap !== "M" && props.gap !== "L") errors.push(`Invalid road gap value "${props.gap}". Use S, M, or L.`);
  if (props.density && props.density !== "L" && props.density !== "M" && props.density !== "H") errors.push(`Invalid road density value "${props.density}". Use L, M, or H.`);
  if (props.color && !isRoadColorScheme(props.color)) errors.push(`Invalid road color value "${props.color}". Use direction, mixed, red, blue, yellow, mint, purple, or orange.`);
  const parsedSeed = Number(props.seed ?? 0);
  if (props.seed && (!Number.isInteger(parsedSeed) || parsedSeed < 0 || parsedSeed > 99)) errors.push(`Invalid road seed value "${props.seed}". Use an integer from 0 to 99.`);
  if (containsGrassObjectSymbol(content)) errors.push("Objects, C, and N cannot be placed on road lanes.");
  return {
    road: {
      vehicleSize: props.vehicle === "M" || props.vehicle === "L" ? props.vehicle : "S",
      speedCode: props.speed === "M" || props.speed === "F" ? props.speed : "S",
      gapCode: props.gap === "S" || props.gap === "M" ? props.gap : "L",
      densityCode: props.density === "M" || props.density === "H" ? props.density : "L",
      colorScheme: isRoadColorScheme(props.color) ? props.color : "direction",
      seed: Number.isInteger(parsedSeed) ? Math.max(0, Math.min(99, parsedSeed)) : 0,
      cover: "none",
    },
    errors,
  };
}

function isRoadColorScheme(value: string): value is RoadTuning["colorScheme"] {
  return value === "direction" || value === "mixed" || value === "red" || value === "blue" || value === "yellow" || value === "mint" || value === "purple" || value === "orange";
}

function parseTrainProperties(content: string): { train: TrainTuning; errors: string[] } {
  const props = Object.fromEntries(content.split(/\s+/).map((part) => part.split("=")).filter((part) => part.length === 2));
  const unknownKeys = Object.keys(props).filter((key) => key !== "train" && key !== "speed" && key !== "gap" && key !== "warn");
  const errors = [
    ...unknownKeys.map((key) => `Unknown train property "${key}". Use train, speed, gap, and warn.`),
  ];
  if (props.train && props.train !== "S" && props.train !== "M" && props.train !== "L") errors.push(`Invalid train size value "${props.train}". Use S, M, or L.`);
  if (props.speed && props.speed !== "S" && props.speed !== "M" && props.speed !== "F") errors.push(`Invalid train speed value "${props.speed}". Use S, M, or F.`);
  if (props.gap && props.gap !== "S" && props.gap !== "M" && props.gap !== "L") errors.push(`Invalid train gap value "${props.gap}". Use S, M, or L.`);
  if (props.warn && props.warn !== "S" && props.warn !== "M" && props.warn !== "L") errors.push(`Invalid train warn value "${props.warn}". Use S, M, or L.`);
  if (containsGrassObjectSymbol(content)) errors.push("Objects, C, and N cannot be placed on train lanes.");
  return {
    train: {
      trainSize: props.train === "S" || props.train === "M" ? props.train : "L",
      speedCode: props.speed === "M" || props.speed === "F" ? props.speed : "S",
      gapCode: props.gap === "S" || props.gap === "M" ? props.gap : "L",
      warnCode: props.warn === "S" || props.warn === "L" ? props.warn : "M",
    },
    errors,
  };
}

function parseRiverProperties(content: string): { river: RiverTuning; errors: string[] } {
  const props = Object.fromEntries(content.split(/\s+/).map((part) => part.split("=")).filter((part) => part.length === 2));
  const unknownKeys = Object.keys(props).filter((key) => key !== "log" && key !== "speed" && key !== "gap");
  const errors = [
    ...unknownKeys.map((key) => `Unknown river property "${key}". Use log, speed, and gap.`),
  ];
  if (props.log && props.log !== "S" && props.log !== "M" && props.log !== "L") errors.push(`Invalid river log value "${props.log}". Use S, M, or L.`);
  if (props.speed && props.speed !== "S" && props.speed !== "M" && props.speed !== "F") errors.push(`Invalid river speed value "${props.speed}". Use S, M, or F.`);
  if (props.gap && props.gap !== "S" && props.gap !== "M" && props.gap !== "L") errors.push(`Invalid river gap value "${props.gap}". Use S, M, or L.`);
  if (containsGrassObjectSymbol(content)) errors.push("Objects, C, and N cannot be placed on river lanes.");
  return {
    river: {
      logSize: props.log === "S" || props.log === "L" ? props.log : "M",
      speedCode: props.speed === "M" || props.speed === "F" ? props.speed : "S",
      gapCode: props.gap === "S" || props.gap === "L" ? props.gap : "M",
    },
    errors,
  };
}

function containsGrassObjectSymbol(content: string): boolean {
  return content.split(/\s+/).some((token) => (
    token === "C" ||
    token === "N" ||
    token === "B" ||
    /^B\d+$/.test(token) ||
    /^b\d+$/.test(token) ||
    token === "#" ||
    /^#\d+$/.test(token) ||
    /^!\d+$/.test(token) ||
    /^@\d+$/.test(token) ||
    token === "p" ||
    /^p\d+$/.test(token)
  ));
}

function validateStageDefinition(stage: StageDefinition): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const startLane = stage.lanes.get(stage.playerStart.z);
  const targetLane = stage.lanes.get(stage.target.z);
  const occupied = new Map<string, StagePlacedObject>();
  const maxZ = Math.max(...stage.lanes.keys());

  if (startLane?.kind !== "grass") errors.push("C must be on a ground row.");
  if (targetLane?.kind !== "grass") errors.push("N must be on a ground row.");
  for (let z = 0; z <= maxZ; z += 1) {
    if (!stage.lanes.has(z)) errors.push(`Missing authored row z=${String(z).padStart(2, "0")}; long maps must be continuous from z=00 to z=${String(maxZ).padStart(2, "0")}.`);
  }

  for (const object of stage.objects) {
    if (object.kind === "building" && !isBuildingFootprint(object)) errors.push(`Building at x=${object.x} z=${object.z} must match its asset footprint.`);
    for (const cell of object.cells) {
      const lane = stage.lanes.get(cell.z);
      if (cell.x < GRID.minX || cell.x > GRID.maxX || lane?.kind !== "grass") {
        errors.push(`${object.kind} at x=${cell.x} z=${cell.z} must be on a ground tile inside the Stage 1 grid.`);
      }
      const key = pointKey(cell);
      const previous = occupied.get(key);
      if (previous && previous.id !== object.id) errors.push(`Multiple objects occupy x=${cell.x} z=${cell.z}.`);
      occupied.set(key, object);
    }
  }

  if (occupied.has(pointKey(stage.playerStart))) errors.push("C start must not overlap an editable object.");
  if (occupied.has(pointKey(stage.target))) errors.push("Target must not be on a blocker, building, or pancake.");
  if (isTargetBoxed(stage)) errors.push("Target is boxed in by blockers or buildings.");
  if (!hasRoughPath(stage)) errors.push("No rough forward path from C to N; check full blocker walls.");

  for (const lane of stage.lanes.values()) {
    if (lane.kind !== "grass") continue;
    const blocked = new Set([...lane.blockers, ...lane.buildings]);
    if (blocked.size >= GRID.maxX - GRID.minX + 1) errors.push(`ERROR: Full blocker wall detected at z=${lane.z}.`);
    for (const x of lane.buildings) {
      const front = stage.lanes.get(lane.z - 1);
      if (front?.kind === "grass" && (front.blockers.includes(x) || front.buildings.includes(x))) {
        warnings.push(`WARNING: Tree/building directly in front of a house at x=${x} z=${lane.z}.`);
      }
    }
  }

  return { errors, warnings };
}

function isTargetBoxed(stage: StageDefinition): boolean {
  const neighbors = [
    { x: stage.target.x, z: stage.target.z - 1 },
    { x: stage.target.x, z: stage.target.z + 1 },
    { x: stage.target.x - 1, z: stage.target.z },
    { x: stage.target.x + 1, z: stage.target.z },
  ];
  return neighbors.every((neighbor) => isBlockedTile(stage, neighbor));
}

function isBlockedTile(stage: StageDefinition, point: GridPoint): boolean {
  if (point.x < GRID.minX || point.x > GRID.maxX || point.z < 0) return true;
  const lane = stage.lanes.get(point.z);
  if (!lane) return true;
  return lane.kind === "grass" && (lane.blockers.includes(point.x) || lane.buildings.includes(point.x));
}

function hasRoughPath(stage: StageDefinition): boolean {
  let reachable = new Set([stage.playerStart.x]);
  for (let z = stage.playerStart.z + 1; z <= stage.target.z; z += 1) {
    const lane = stage.lanes.get(z);
    const blocked = new Set(lane?.kind === "grass" ? [...lane.blockers, ...lane.buildings] : []);
    const next = new Set<number>();
    for (const x of reachable) {
      for (const nx of [x - 1, x, x + 1]) {
        if (nx < GRID.minX || nx > GRID.maxX || blocked.has(nx)) continue;
        next.add(nx);
      }
    }
    if (!next.size) return false;
    reachable = next;
  }
  return reachable.has(stage.target.x);
}

function laneCode(lane: LaneState): string {
  if (lane.kind === "grass") return lane.terrain === "dirt" ? "D " : "G ";
  if (lane.kind === "river") return lane.direction === -1 ? "W>" : "W<";
  if (lane.kind === "train") return lane.direction === -1 ? "T>" : "T<";
  return lane.direction === -1 ? "R>" : "R<";
}

function laneContent(stage: StageDefinition, lane: LaneState): string {
  if (lane.kind === "road") {
    const road = lane.road ?? { vehicleSize: "S", speedCode: "S", gapCode: "L", densityCode: "L", colorScheme: "direction", seed: 0, cover: "none" };
    const parts = [
      `vehicle=${road.vehicleSize}`,
      `speed=${road.speedCode}`,
      `gap=${road.gapCode}`,
      `density=${road.densityCode}`,
      "cover=none",
    ];
    if (road.colorScheme !== "direction") parts.push(`color=${road.colorScheme}`);
    if (road.seed !== 0) parts.push(`seed=${road.seed}`);
    return parts.join(" ");
  }
  if (lane.kind === "river") {
    const river = lane.river ?? { logSize: "M", speedCode: "S", gapCode: "M" };
    return `log=${river.logSize} speed=${river.speedCode} gap=${river.gapCode}`;
  }
  if (lane.kind === "train") {
    const train = lane.train ?? { trainSize: "L", speedCode: "S", gapCode: "L", warnCode: "M" };
    return `train=${train.trainSize} speed=${train.speedCode} gap=${train.gapCode} warn=${train.warnCode}`;
  }

  const tiles = Array.from({ length: GRID.maxX - GRID.minX + 1 }, () => ".");
  for (const object of stage.objects.filter((item) => item.cells.some((cell) => cell.z === lane.z))) {
    writeObjectTokens(tiles, object, lane.z);
  }
  if (stage.playerStart.z === lane.z) tiles[xToTokenIndex(stage.playerStart.x)] = "C";
  if (stage.target.z === lane.z) tiles[xToTokenIndex(stage.target.x)] = "N";
  return tiles.join(" ");
}

function writeObjectTokens(tiles: string[], object: StagePlacedObject, laneZ: number): void {
  if (object.kind === "pancake") {
    const token = PANCAKE_ASSET_TO_TOKEN[(object.assetId ?? "pancake") as keyof typeof PANCAKE_ASSET_TO_TOKEN] ?? "1";
    tiles[xToTokenIndex(object.x)] = `p${token}`;
    return;
  }
  if (object.kind === "tree") {
    const asset = object.assetId === "tree05" ? "tree05" : "tree03";
    const token = TREE_ASSET_TO_TOKEN[(object.assetId ?? asset) as keyof typeof TREE_ASSET_TO_TOKEN] ?? TREE_ASSET_TO_TOKEN.tree03;
    tiles[xToTokenIndex(object.x)] = `#${token}`;
    return;
  }
  if (object.kind === "warning") {
    const token = WARNING_ASSET_TO_TOKEN[(object.assetId ?? "warningSign01") as keyof typeof WARNING_ASSET_TO_TOKEN] ?? WARNING_ASSET_TO_TOKEN.warningSign01;
    tiles[xToTokenIndex(object.x)] = `!${token}`;
    return;
  }
  if (object.kind === "billboard") {
    const token = BILLBOARD_ASSET_TO_TOKEN[(object.assetId ?? "billboard01") as keyof typeof BILLBOARD_ASSET_TO_TOKEN] ?? BILLBOARD_ASSET_TO_TOKEN.billboard01;
    const cells = object.cells
      .filter((cell) => cell.z === laneZ)
      .sort((a, b) => xToTokenIndex(a.x) - xToTokenIndex(b.x));
    cells.forEach((cell) => {
      tiles[xToTokenIndex(cell.x)] = `@${token}`;
    });
    return;
  }
  if (object.kind !== "building") return;
  const variant = BUILDING_ASSET_TO_TOKEN[(object.assetId ?? "house01") as keyof typeof BUILDING_ASSET_TO_TOKEN] ?? BUILDING_ASSET_TO_TOKEN.house01;
  const cells = object.cells
    .filter((cell) => cell.z === laneZ)
    .sort((a, b) => xToTokenIndex(a.x) - xToTokenIndex(b.x));
  cells.forEach((cell) => {
    tiles[xToTokenIndex(cell.x)] = cell.x === object.x && cell.z === object.z ? `B${variant}` : `b${variant}`;
  });
}

function applyObjectPlacement(
  stage: StageDefinition,
  existing: StagePlacedObject | undefined,
  nextObject: StagePlacedObject,
  mode: "move" | "copy" | "variant",
): MoveStageObjectResult {
  const validation = canPlaceObject(stage, nextObject, existing);
  if (!validation.ok) return { ok: false, message: validation.message };

  if (nextObject.kind === "target") {
    const nextStage = rebuildStage({
      ...stage,
      target: { x: nextObject.x, z: nextObject.z },
      objects: cloneObjects(stage.objects),
    });
    const mapText = serializeStageMap(nextStage);
    return { ok: true, message: "Moved target.", stage: { ...nextStage, source: mapText }, mapText, object: nextObject };
  }

  const nextObjects = existing
    ? stage.objects.map((object) => object.id === existing.id ? nextObject : cloneObject(object))
    : [...cloneObjects(stage.objects), nextObject];
  const nextStage = rebuildStage({ ...stage, objects: nextObjects });
  const mapText = serializeStageMap(nextStage);
  const message = mode === "copy" ? "Copied object." : mode === "variant" ? "Changed asset variant." : "Moved object.";
  return { ok: true, message, stage: { ...nextStage, source: mapText }, mapText, object: nextObject };
}

function canPlaceObject(stage: StageDefinition, object: StagePlacedObject, existing?: StagePlacedObject): { ok: boolean; message: string } {
  if (!object.cells.length) return { ok: false, message: "Object has no footprint." };
  if (object.kind === "building" && !isBuildingFootprint(object)) return { ok: false, message: "Building footprint does not match its asset size." };
  if (object.kind === "billboard" && !isBillboardFootprint(object)) return { ok: false, message: "Billboard footprint does not match its asset size." };

  const existingKeys = new Set(existing?.cells.map(pointKey) ?? []);
  const seen = new Set<string>();
  for (const cell of object.cells) {
    if (cell.x < GRID.minX || cell.x > GRID.maxX || cell.z < 0) return { ok: false, message: "Target tile is outside the Stage 1 grid." };
    const lane = stage.lanes.get(cell.z);
    if (!lane || lane.kind !== "grass") return { ok: false, message: "Objects can only be placed on ground rows." };
    const key = pointKey(cell);
    if (seen.has(key)) return { ok: false, message: "Object footprint contains duplicate tiles." };
    seen.add(key);
    if (!existingKeys.has(key) && stage.playerStart.x === cell.x && stage.playerStart.z === cell.z) return { ok: false, message: "Objects cannot overlap Mr. Awesome's start tile." };
    if (!existingKeys.has(key) && stage.target.x === cell.x && stage.target.z === cell.z && object.kind !== "target") return { ok: false, message: "Objects cannot overlap Mr. Not So Awesome." };
    const occupied = objectAt(stage, cell);
    if (occupied && occupied.id !== existing?.id) return { ok: false, message: "That tile is occupied or invalid for this object." };
  }
  return { ok: true, message: "OK" };
}

function rebuildStage(stage: StageDefinition): StageDefinition {
  const lanes = cloneLanesWithoutObjects(stage.lanes);
  for (const lane of lanes.values()) {
    lane.blockers = [];
    lane.buildings = [];
    lane.collectibles = [];
  }

  for (const object of stage.objects) {
    for (const cell of object.cells) {
      const lane = lanes.get(cell.z);
      if (!lane || lane.kind !== "grass") continue;
      if (object.kind === "tree" || object.kind === "billboard") lane.blockers.push(cell.x);
      if (object.kind === "building") lane.buildings.push(cell.x);
      if (object.kind === "pancake") lane.collectibles.push(cell.x);
    }
  }

  for (const lane of lanes.values()) {
    lane.blockers.sort((a, b) => a - b);
    lane.buildings.sort((a, b) => a - b);
    lane.collectibles.sort((a, b) => a - b);
  }

  return { ...stage, lanes, objects: cloneObjects(stage.objects) };
}

function shiftedObjectFromGrab(object: StagePlacedObject, grabbed: GridPoint, to: GridPoint): StagePlacedObject {
  const dx = to.x - grabbed.x;
  const dz = to.z - grabbed.z;
  const cells = object.cells.map((cell) => ({ x: cell.x + dx, z: cell.z + dz }));
  return {
    ...object,
    x: object.x + dx,
    z: object.z + dz,
    cells,
    id: objectId(object.kind, object.x + dx, object.z + dz, object.assetId, cells),
  };
}

function objectFromTemplate(object: StagePlacedObject, to: GridPoint): StagePlacedObject {
  const dx = to.x - object.x;
  const dz = to.z - object.z;
  const cells = object.cells.map((cell) => ({ x: cell.x + dx, z: cell.z + dz }));
  return {
    ...object,
    x: to.x,
    z: to.z,
    cells,
    id: objectId(object.kind, to.x, to.z, object.assetId, cells),
  };
}

function sizedObject(object: StagePlacedObject, assetId: StageEditableAssetId, cells: GridPoint[]): StagePlacedObject {
  return {
    ...object,
    assetId,
    cells,
    id: objectId(object.kind, object.x, object.z, assetId, cells),
  };
}

function tileObject(kind: "tree" | "pancake" | "warning" | "billboard", x: number, z: number, assetId?: StageEditableAssetId): StagePlacedObject {
  const cells = [{ x, z }];
  return {
    id: objectId(kind, x, z, assetId, cells),
    kind,
    x,
    z,
    cells,
    assetId,
  };
}

function objectId(kind: StageObjectKind, x: number, z: number, assetId: StageEditableAssetId | undefined, cells: GridPoint[]): string {
  const footprint = cells.map((cell) => `${cell.x}:${cell.z}`).join(",");
  return `${kind}:${assetId ?? "default"}:${x}:${z}:${footprint}`;
}

function isBuildingFootprint(object: StagePlacedObject): boolean {
  const expected = buildingFootprintCells(object.x, object.z, object.assetId ?? "house01").map(pointKey).sort();
  const actual = object.cells.map(pointKey).sort();
  return expected.length === actual.length && expected.every((key, index) => key === actual[index]);
}

function isBillboardFootprint(object: StagePlacedObject): boolean {
  const expected = billboardFootprintCells(object.x, object.z, object.assetId ?? "billboard01").map(pointKey).sort();
  const actual = object.cells.map(pointKey).sort();
  return expected.length === actual.length && expected.every((key, index) => key === actual[index]);
}

function buildingFootprint(assetId: StageEditableAssetId): { width: number; depth: number } {
  return BUILDING_FOOTPRINTS[assetId as keyof typeof BUILDING_FOOTPRINTS] ?? BUILDING_FOOTPRINTS.house01;
}

function billboardFootprint(assetId: StageEditableAssetId): { width: number; depth: number } {
  return BILLBOARD_FOOTPRINTS[assetId as keyof typeof BILLBOARD_FOOTPRINTS] ?? BILLBOARD_FOOTPRINTS.billboard01;
}

function buildingFootprintCells(x: number, z: number, assetId: StageEditableAssetId): GridPoint[] {
  const footprint = buildingFootprint(assetId);
  const cells: GridPoint[] = [];
  for (let dz = 0; dz < footprint.depth; dz += 1) {
    for (let dx = 0; dx < footprint.width; dx += 1) {
      cells.push({ x: x - dx, z: z - dz });
    }
  }
  return cells;
}

function billboardFootprintCells(x: number, z: number, assetId: StageEditableAssetId): GridPoint[] {
  const footprint = billboardFootprint(assetId);
  const cells: GridPoint[] = [];
  for (let dx = 0; dx < footprint.width; dx += 1) {
    cells.push({ x: x - dx, z });
  }
  return cells;
}

function tokenIndexToX(index: number): number {
  return GRID.maxX - index;
}

function xToTokenIndex(x: number): number {
  return GRID.maxX - x;
}

function cloneLanesWithoutObjects(lanes: Map<number, LaneState>): Map<number, LaneState> {
  return new Map(Array.from(lanes.entries()).map(([z, lane]) => [z, {
    ...lane,
    blockers: [...lane.blockers],
      buildings: [...lane.buildings],
      collectibles: [...lane.collectibles],
      road: lane.road ? { ...lane.road } : undefined,
      river: lane.river ? { ...lane.river } : undefined,
      train: lane.train ? { ...lane.train } : undefined,
    }]));
}

function cloneObjects(objects: StagePlacedObject[]): StagePlacedObject[] {
  return objects.map(cloneObject);
}

function cloneObject(object: StagePlacedObject): StagePlacedObject {
  return {
    ...object,
    cells: object.cells.map((cell) => ({ ...cell })),
  };
}

function samePoint(a: GridPoint, b: GridPoint): boolean {
  return a.x === b.x && a.z === b.z;
}

function pointKey(point: GridPoint): string {
  return `${point.x}:${point.z}`;
}

function screenDirectionToWorldDirection(code: string): Direction {
  return code.endsWith(">") ? -1 : 1;
}

function stablePhase(z: number, direction: Direction): number {
  const raw = Math.sin((z + 3) * 12.9898) * 43758.5453;
  return (raw - Math.floor(raw)) * 7 * direction;
}
