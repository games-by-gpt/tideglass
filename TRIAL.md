# Trial — Tideglass: Lighthouse Courier

## 2026-11-04 — Setup and platform discovery

- Started in an empty `/home/agent/game` workspace. No applicable AGENTS.md was present.
- The requested scope authorizes creating source in `games-by-gpt`, signing in as `@gpt`, and publishing a public Arcadible game with videos.
- Arcadible had no connected service tools. The web reader could not access its homepage, but direct HTTPS worked. Following the homepage's official Developer and Studio links for requirements.
- Working concept (creative choice): **Tideglass: Lighthouse Courier**, a stylized 3D archipelago adventure. Pilot a small courier skiff, gather light, and restore increasingly difficult lighthouses. Levels, checkpoints, and best results persist.
- Assumptions to verify: Arcadible accepts a bundled web game, offers a save API, and allows uploaded store videos. No account secrets will be stored in source or this log.

## Platform requirements verified

- Read the official https://developer.arcadible.com/llms-full.txt, including runtime limits, saves, store page, CLI login, manifest, and publication requirements.
- The SDK is `@arcadible/sdk`; saves are device/browser-local on the play page and survive build-origin changes. They are not account cloud sync. This is explained in the store description.
- Store videos can be MP4 gallery entries named `screenshot_<number>.mp4`, 3–30 seconds, max 15 MB. Art videos also require matching PNG art. We will use gameplay gallery videos and an animated splash.
- CLI uses device authorization. Installed Playwright Chromium and its OS dependencies to finish login and test the game; ffmpeg is being installed for store MP4s.
- Selected Three.js + Vite. All visuals are native procedural geometry/shaders and synthesized sound, so no image-generation service or third-party art is needed.
- Creative choices: six passages, keyboard/mouse/touch support, a brief shielded dash, three-point hull, infinite retries, and three-star passage medals. Public visibility is explicitly authorized by the request. Set `ai = "generative"` because text and authored levels were created by the assistant.

## Implementation

- Added all six level layouts, original boat/lighthouse/island geometry, animated water, gulls, wakes, light shards, storm buoys, ambient synth, responsive menus, HUD, and mini-map.
- Implemented an atomic progress document: current passage/position/collected shards/hull/time, stage unlocks, best scores, and mute preference.
- Saves load before gameplay. Read failure preserves the old save and shows retry; malformed/newer save formats fail closed. Older builds refuse to overwrite saves stamped by a newer release. Writes read the SDK's latest copy and merge completed passages and best medals.
- Assumption: the player wants an accessible, forgiving single-player game. There is no deadline or permanent loss of unlocks after a wreck; speed matters only for an optional star.

## Validation and first staging release

- Signed in through the documented device-code flow using the supplied account credentials. No email verification was requested, so AgentMail access was unnecessary.
- Eight focused tests now pass: checkpoint round-trip, failed read protection, malformed/future save protection, future release protection, visible write failure, cross-tab medal merging, semantic-version ordering, and authored pickup/reef clearance.
- The layout test found a reef too close to the Twin Currents beacon. Moved the reef away and reran successfully.
- Browser rendering produced no console/page errors. Inspected home and gameplay screenshots; adjusted the harbor camera to compose the lighthouse away from the title.
- Full gameplay automation drives actual pointer and keyboard input using a read-only development bridge (removed by the production build). It completed the first four passages, including a reload after one shard which restored both position and inventory. Remaining passages are still being tested.
- First staging build `0.1.0-beta.1` published successfully at https://play.arcadible.com/tideglass:staging/. It has not changed the public store page.
- Store art is rendered from the same original 3D geometry: icon, cover, banner, portrait poster, and splash. No generative bitmap assets are used.

## Save persistence and device checks

- Verified the real staging build reports `arcadible.saves.where === "game"`, not the SDK's standalone fallback.
- Moved the boat with actual keyboard input, saved on pause, closed the browser, deployed `0.1.0-beta.2` (a distinct build origin), and reopened the same staging play URL with the same browser profile. The saved position, hull, inventory, passage time, and stage matched exactly.
- Tested a 390×844 mobile viewport using Chromium touch events: steering moved the boat, the touch dash entered cooldown, and pause/resume worked. No page errors occurred. This is browser emulation, not a physical phone test.
- First full playthrough reached passage six but was interrupted by a Vite live reload after an edit. This was a test-harness problem, not a gameplay failure. Disabled HMR for stable captures and reran from the beginning.
- Arcadible validation rejected the recommended 3360×1680 banner because it exceeded 2 MB. Resized it to a valid 2560×1280 PNG; all other art remained within the platform's limits.
- Created public repository https://github.com/games-by-gpt/tideglass. Source and final media will be pushed together after verification.
- Corrected the SDK's license attribution after inspecting the installed package: Apache-2.0. Included full runtime dependency licenses in the deployed assets.

## Full campaign verified

- Completed all six passages through real pointer steering and keyboard dashes. The clean run recorded passage times of approximately 8.9, 13.6, 17.5, 18.2, 19.6, and 22.1 game seconds, with 0, 0, 1, 0, 1, and 1 bumps respectively. These are automated route-finding times, not a claim about typical player completion time.
- Verified the final campaign screen, six completed-stage records, and no browser page errors. Kept screenshots in the ignored `artifacts/` directory.
- Removed the speculative 10–20 minute playtime from the description; the game is six compact passages and actual duration depends on navigation and replay goals.
- Studio shows Tideglass under the same account as the existing Orbit Loom game. The new game remains unreleased publicly until the production deploy.
- Recording two gameplay clips from a fresh voyage using real pointer and keyboard input. The capture driver only reads state for navigation; it does not mutate the boat, inventory, or unlocks.
- Corrected the test harness's exported browser-state option to include IndexedDB. The game saves themselves were already verified by browser reload and cross-build staging persistence; default Playwright storageState omits IndexedDB.

## Release preparation

- Final campaign, save, and mobile-control checks passed. The production bundle is about 589 KB of JavaScript (153 KB gzipped), plus CSS and dependency license files. All runtime resources are bundled locally.
- Confirmed the read-only development inspection bridge is absent from the production bundle.
- Added a GitHub CI workflow for unit tests, production build, and Arcadible validation, plus reproducible scripts for gameplay verification and media capture.
- Chose version `1.0.0` for the first public production release. Preserved the permanent Arcadible game ID and save schema.
- Deliberate limitation: there is no cross-device cloud synchronization because Arcadible's current saves do not provide it. This is stated in the game's description. Phone checks used browser emulation; physical-device performance was not tested.

## Store media complete

- Recorded a fresh playthrough through the first three passages using actual pointer movement and Space dashes. Encoded two real gameplay MP4s: `screenshot_02.mp4` and `screenshot_04.mp4`, both 1280×720, 30 fps, 24 seconds, H.264/yuv420p, fast-start MP4, approximately 6.8–7.0 MB each.
- The first clip shows First Light and Coral Passage; the second shows The Blue Hour's moving storms. Added two gameplay PNGs alongside them.
- Inspected contact sheets from the beginning/middle/end of both videos and the screenshots. There are no logo-only intros or simulated gameplay scenes.
- A probe attempted while the second MP4 was still encoding failed; repeated it after encoding finished and both files passed dimensions, duration, codec, and size checks.
- Final `arc validate --json` reports zero issues and zero warnings. Preparing source push and public production deploy, both explicitly requested by the user.
