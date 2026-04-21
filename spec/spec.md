# Diary Planet — State Snapshot (2026-04-21)

A point-in-time description of the codebase as it stands. Source of truth is the code under `diary_planet/`; this doc names files and line-anchored behaviors so a future reader can orient quickly. Supersedes `0420.md` (primary change: the egg → hatched path has been split into a four-state send/reply loop driven by a peer "reader" role). For the long-form rebuild rationale, see `diary-planet-rebuild-spec-v2.md`; for the conceptual model behind journals, monsters, and eggs, see `journal_monster_spec.md`.

---

## 1. Stack

- **Runtime:** Expo ~54.0.33 on React Native 0.81.5, React 19.1.0. iOS / Android / web via `react-native-web` ^0.21.0.
- **Key deps:** `react-native-gesture-handler` ~2.28, `react-native-reanimated` ~4.1, `react-native-svg` 15.12, `react-native-safe-area-context` ~5.6.
- **Entry:** `diary_planet/index.js` → `App.jsx`. No routing library — a single `navKey` state in `App.jsx` swaps screens.
- **Persistence:** none. State is in-memory `useState` in `App.jsx`, seeded from static JSON (`data/diaries.json`, `data/monsters.json`). Page refresh resets everything.

---

## 2. Top-level layout (`App.jsx`, 316 lines)

State lives here and is threaded down by props:

- `monsters`, `diaries` — arrays seeded from `data/*.json`.
- `enrichedMonsters` / `calendarDiaries` — derived via `useMemo`: monsters get `.diary`, `.dateLabel`, `.seed`; diaries get `.monster` and `.hatched`.
- `navKey` ∈ `{planet, calendar, write, profile, bag}`. Only `planet` and `calendar` are implemented; the default branch renders a "not implemented" stub (`App.jsx:212-218`). `write` is not a screen — it opens `DiaryWriter` via `onWritePress`.
- **`role` ∈ `{'author', 'reader'}`** — new. `author` is the default; `reader` is entered when the user opens peer mode from the planet (see §4.1 → PeerPortal). In reader mode the `BottomNav` is hidden (`App.jsx:227`) and `JournalReaderSheet` renders the drawn journal.
- `readerJournal` — the currently-drawn peer journal while in reader mode.
- Five overlay sheets mounted at the root: `DiaryWriter`, `DiarySheet`, `DiaryConversationSheet`, `CreatureManager`, `JournalReaderSheet`.
- Toast: single string rendered absolute-positioned above the nav; auto-clears after 2.2s (`App.jsx:41-44`).

### App actions

- `writeDiary(entry)` — assigns next id, appends diary, immediately creates a paired **egg** (`state: 'egg'`) via `createEgg`. Returns new diary id.
- `sendJournal(diaryId)` — mutates the paired monster from `egg` to `state: 'sent'`. Wired from `DiaryConversationSheet` → "Send out" and from `DiarySheet` (egg state) → "Send out".
- `replyToJournal(journal, reply)` — for monsters in `state: 'sent'`, applies a reader's reply: sets `state: 'replied'` with `attribute`, `gift`, `gift_shape`, `reply_comment`, `replied_at`. Name/colors stay null until hatch.
- `hatch(diaryId)` — operates **only on `state: 'replied'`** monsters. Calls `hatchMonster(monster, diary)` which fills `name`, `color`, `torsoColor`, `rarity` and flips to `hatched`. Auto-deploys if there's room, otherwise toasts `"Planet is full — hatched to idle"`.
- `deploy(id)` / `recall(id)` / `star(id)` — single-monster mutations. `deploy` enforces `MAX_DEPLOYED = 7`.
- `openPeerMode()` / `exitPeerMode()` — enters/exits the reader role. `openPeerMode` draws a random sent journal from `listReadable(diaries, monsters)` via `data/pool.js`; toasts if nothing sendable exists.
- `drawReaderJournal()` — redraws a different sent journal for the reader sheet ("Read another" button).
- `submitReaderReply(journal, reply)` — wired into `JournalReaderSheet` → `replyToJournal` → `exitPeerMode()` → toast.
- `updateDiary(diaryId, updates)` — still threaded through to `DiarySheet` but not surfaced in any UI affordance (see §8).

---

## 3. Data model

### Diary (`data/diaries.json`)
```
{ id, content, mood_score (1..5), emotions[], created_at (ISO) }
```
No `attribute` on the journal — see `journal_monster_spec.md`. Seed: 12 entries spanning 2026-04-02 → 2026-04-21 (up from 8 in the 0420 snapshot).

### Monster (`data/monsters.json`)
```
{ id, diary_id,
  state: 'egg' | 'sent' | 'replied' | 'hatched',
  name, attribute: 'A|B|C|D|U',
  color, torsoColor,
  gift, gift_shape: 'gem' | 'sphere' | null,
  rarity: 'common' | 'rare' | null,
  reply_comment: string | null,
  replied_at: ISO string | null,
  pat_count, is_displayed, starred }
```

Seed: 12 monsters total — 6 hatched, 2 replied (eggs awaiting hatch, with author-visible reply comments), 2 sent (awaiting reply), 2 egg.

### State machine (extended since 0420)

```
 writeDiary    sendJournal      replyToJournal          hatch
 ──────────▶  ───────────▶     ─────────────────▶      ──────▶
 egg          sent             replied                  hatched
 white        white, dimmed    white + ready badge      colored
 no attr      no attr          attr + gift + comment    name + rarity
```

Per-state invariants (also enforced in `generateCreature.js`):
- **egg** — `name: null`, `attribute: 'U'`, `color: #FFFFFF`, `torsoColor: #FFFFFF`, `gift: null`, `gift_shape: null`, `rarity: null`, `reply_comment: null`, `replied_at: null`, `is_displayed: false`.
- **sent** — same as egg, but `state: 'sent'` (`sendMonster` only flips the state field).
- **replied** — `attribute`, `gift`, `gift_shape`, `reply_comment`, `replied_at` populated. `name`, `color`, `torsoColor` still null/white (author shouldn't see identity until hatch).
- **hatched** — `hatchMonster` fills `name` (from 24-name pool, seeded by `diary-${id}-gift-${virtue}`), `color`/`torsoColor` (mood-tiered pick from `ATTRIBUTES[attribute]`), and `rarity` (`rare` if `mood_score === 5 && emotions.length ≥ 3 && rand() > 0.7`, else `common`).

### Attributes (`theme.js`)
`A = Self` (violet), `B = Relation` (pink), `C = Achieve` (green), `D = Meaning` (amber), `U = Unhatched` (white/grey). Each has `{hi, mid, lo}` color tiers driving `badge`, `cardBg`, `pillActive/Idle`, `palette`. `VIRTUES` is 6 virtues per attribute (the set of possible gift values).

### Category concealment rule

The author must not see the incoming attribute until hatch. Anywhere a monster with `state !== 'hatched'` is rendered, the `cat` used for coloring is forced to `'U'` (`DiarySheet.jsx:51-54`, `CreatureCard.jsx:13-14`, `CreatureManager.jsx:243`). This is why `replied` eggs look neutral-white even though `monster.attribute` is already set internally.

### Reader pool (`data/pool.js`)

```
listReadable(diaries, monsters) → diaries whose paired monster is state === 'sent'
drawRandom(list, excludeId?)    → random pick from list, excluding id if given
```

Local mock for the peer-assigned hatch flow. There are no seeded peer journals — the "peer" is always the same user acting through the `reader` role.

---

## 4. Screens

### 4.1 Planet (`components/planet/PlanetScreen.jsx`, 750 lines — still the biggest file)

Unchanged physics / world model vs 0420. "Cosmic fishbowl" scene: flat left/right/bottom walls, curved top ceiling traced from the planet's upper arc (`topCircleY`, `clampToBounds`). World is scaled by a `scale` shared value; wheel (web) and pinch (native) drive zoom between `MIN_ZOOM = 0.6` and `MAX_ZOOM = 2.5`.

Rendered layers: `Sky` → three `OrbitingBody` moons (250 / 150 / 10 px) → `Planet` → deployed creatures.

Overlay chrome:
- `PlanetMenu` (top-left) — opens `CreatureManager` when `monsters` selected. Other items (Planet / Pokédex / Items / Shop) disabled.
- `ModeToggle` (top-right) — `slingshot` ↔ `move`.
- `ChordToggle` — `major` / `minor` / `secret` (controls audio response to collisions).
- Hit counter pill (top-center) — increments on launch-driven collisions.
- **`PeerPortal` (right-center, new)** — a dashed-border 64×64 button with a book icon and `SIM` tag. Tap → `onMenuSelect('reader')` → `App.openPeerMode()`. It's the entry point into peer/reader mode while that's the only place to access it (the `PlanetMenu` does not currently list a "Reader" item).

Creature physics / collisions / chime system: unchanged — see 0420.md §4.1 and `diary-planet-rebuild-spec-v2.md` §7.1 / §9 for details. Key constants still: `COLLISION_DIST = 100`, `MAX_PULL = 200`, `LAUNCH_K = 0.4`, `LAUNCH_DURATION = 3000`, `WALL_BOUNCE = 0.3`, `CREATURE_BASE = 100`, `SPIN_DURATION_MIN/MAX = 1000/2000`.

### 4.2 Calendar (`components/diary/DiaryCalendar.jsx`, 344 lines)

Month grid + ordered list. Up to 3 avatars/eggs preview per day cell. Tap either to open `DiarySheet` with `source='calendar'`.

List order changed: now sorted by `STATE_RANK = { replied: 0, hatched: 1, egg: 2, sent: 2 }` then by newest `created_at` (`DiaryCalendar.jsx:16, 46-51`). Replied eggs float to the top so the author notices a reply is waiting.

### 4.3 Stub screens

`profile` and `bag` tabs in `BottomNav.jsx` are `disabled: true` (`BottomNav.jsx:9-10`). No-op.

---

## 5. Sheets / overlays

### 5.1 `DiaryWriter` (257 lines)

Same composer as 0420 (content `TextInput`, 1–5 mood dots, 16-option emotion chip row at `DiaryWriter.jsx:50-54`). Now includes a 4-frame `WalkingCreature` sprite at the top, driven by a 160 ms interval over `creature1.svg`. Submit → `writeDiary(entry)` in `App.jsx` → auto-opens `DiaryConversationSheet` on the new diary id.

### 5.2 `DiaryConversationSheet` (241 lines — rewritten)

Was a stub in 0420 ("Talk to me more" → toast). Now the post-write moment-of-intent:

- Top: the same 4-frame `WalkingCreature` (flipped) with a speech-bubble `Pressable` reading **"Want to talk about it?"** (`DiaryConversationSheet.jsx:66-84`). Hover state uses `DECIDE_BLUE` as the border color.
- Egg header (white `EggIcon`, `EGG_NAME = "Egg"`, date, `U` attribute pill, emotion tags, mood dots — all in U/neutral colors).
- Scrollable body showing the diary content.
- Footer: two buttons — **"Keep as egg"** (calls `onSave`, dismisses) and **"Send out"** (calls `onSendOut` → `sendJournal(diary.id)`, dismisses, toasts "Sent out — waiting for a reply"). No AI / chat.

### 5.3 `DiarySheet` (324 lines)

State-aware detail sheet for an existing diary, opened either from Planet (overlay body at top third of screen) or Calendar (inline body). The single sheet now handles all four monster states:

| state       | header                                    | body action                                                 |
|-------------|-------------------------------------------|-------------------------------------------------------------|
| `egg`       | white `EggIcon`, `Egg`, U pill            | **"Send out"** → `onSendOut(diary.id)` (primary blue)       |
| `sent`      | dimmed white `EggIcon` (`pending`), U pill| **"Waiting for a response from the universe…"** (muted box) |
| `replied`   | ready `EggIcon` (`ready` → purple sparkle), still U pill | **"Someone replied: hatch to see it."** (primary purple) |
| `hatched`   | `CreatureAvatar`, name, attribute + gift pill (`GiftSymbol` + virtue name) | no action; if `reply_comment` present, render it as a bordered italic quote (`commentBox`) |

Recall affordance: for `hatched && is_displayed`, a spaceship-icon button sits between the header text and the right-side emotion/mood column (`DiarySheet.jsx:110-131`); its size is bound to the rendered height of that right column via `onLayout`. Idle/non-displayed hatched creatures render the icon in a muted style but disable press.

The author-facing gift picker that existed in the 0420 version is gone: hatching no longer takes a `gift` argument. The gift is now assigned by the reader via `JournalReaderSheet`.

`onUpdateDiary` is still threaded in but not surfaced — edit UI not wired.

### 5.4 `JournalReaderSheet` (348 lines — new)

Bottom sheet rendered when `role === 'reader' && readerJournal` is truthy. Implements the peer's reply flow:

1. Title: "Someone sent you their journal".
2. Scrollable body: `fmtDate(created_at)`, diary content, emotion tags (fixed `cat="U"`), mood dots (`cat="U"`).
3. **Shape picker** (`heroGemWrap`, new this release) — two large side-by-side `Pressable`s:
   - **Gem → "Witnessing"** — right-aligned prompt ("What value do you see in this entry?"), paired with a spinning `Gem` at `size={72}`, category-tinted.
   - **Sphere → "Blessing"** — left `Sphere` at `size={86}`, paired with a prompt ("What blessing would you like to send?").
   - Picking one highlights the chosen side and dims the other (`shapeChoiceSel` / `shapeChoiceDim`).
4. Category pills (A/B/C/D — no `all`, no `U`) — choosing a category re-tints the gem/sphere preview and swaps the virtue grid.
5. 3-column virtue grid built from `VIRTUES[pickerCat]` with a measured `gridW`.
6. Optional comment `TextInput`, placeholder text varies by selected shape: gem → "What do you see from this?"; sphere → "Leave a few words of blessing…"; neither → "Say something back (optional)…".
7. Footer: **"Read another"** (redraws) and **"Send {virtue}"** (disabled until both shape and gift are picked). Submission packs `{ cat, virtue, shape, comment }` into `applyReply`.

Sheet uses `KeyboardAvoidingView` (iOS padding) and a `rgba(14,7,38,0.97)` background.

### 5.5 `CreatureManager` (367 lines)

Bottom sheet reached from `PlanetMenu`. Since 0420 it has gained **egg-awareness**:

- New state `showEggs` (default `false`) — when off, `CreatureManager` filters to `state === 'hatched'` only; when on, includes eggs / sent / replied. Toggle button appears between the search input and the sort button, labelled `Show eggs (N)` or `Hide eggs` (`CreatureManager.jsx:144-157`). Active style when shown.
- When `showEggs` is on, a fifth `U` category pill is appended to the A/B/C/D filter row.
- `attrCounts` now counts `U` as well.
- `DetailPanel` uses a `hintByState` map for non-hatched monsters: `egg → "Send this out from the diary to start hatching"`; `sent → "Awaiting a response from a reader"`; `replied → "Ready to hatch — open the diary to reveal"`.

Otherwise unchanged: 4-col grid, `PAGE_SIZE = 20`, `GAP = 6`, sort cycle `Deployed → Newest → Oldest`, per-attribute counts on the category pills, status row (`all / deployed / idle / starred`), dark `BG.SHEET` theme.

---

## 6. Shared UI (`components/ui/`)

- `Modal.jsx` — unchanged dual-variant primitive.
- `CreatureAvatar.jsx` — body/torso/walk-phase/shadow/in-space/rotation — unchanged.
- `EggIcon.jsx` — **extended**: new props `pending` (dims body + shadow to 35% / 8% — used for `sent`) and `ready` (adds a white-on-purple sparkle badge at top-right — used for `replied`). See §5.3.
- **`GiftSymbol.jsx`** (new) — 14-line dispatcher that picks between `Gem` and `Sphere` based on `shape` prop. Used in `DiarySheet`, `CreatureCard`, `CreatureManager` detail panel.
- **`Sphere.jsx`** (new, 131 lines) — reanimated lat/lon polygon sphere (5 lat × 10 lon). Back-face culling via per-vertex Z. Spinning mode does a 5s linear loop. Attribute-keyed: upper hemisphere uses `lighten(hi, 0.1)`, lower uses `mid`.
- `Gem.jsx` — unchanged from 0420 (crown/pavilion/table faceted diamond, reanimated rotation).
- **`PentaGem.jsx`** (166 lines) — a second, more geometric faceted gem (6-waist, pitched pavilion). **Currently unused.** Present in the tree but no importer outside itself. Candidate for cleanup or future use.
- `MoodDots.jsx`, `EmotionTag.jsx`, `CategoryPill.jsx` — unchanged small atoms.

---

## 7. Navigation (`components/nav/BottomNav.jsx`, 100 lines)

5 tabs, absolute-positioned bar. `write` is the center floating button opening `DiaryWriter`. `profile` and `bag` are disabled placeholders.

**New:** the nav is now conditionally rendered — `App.jsx:227` only mounts it when `role === 'author'`. In peer/reader mode the nav is hidden and `JournalReaderSheet` owns the screen.

---

## 8. Known gaps / unwired capability

- **No persistence.** All diary / monster / role mutations are lost on reload.
- **Peer is a simulated self.** The "reader" is the same user in a different role, reading their own sent journals (`data/pool.js` comment is explicit about this). The `SIM` tag on `PeerPortal` makes that visible in the UI. No real networking.
- **`onUpdateDiary` is threaded through but unused.** Edit affordance not present in `DiarySheet` (same as 0420).
- **`pat_count` is dead data.** Persisted on monsters but nothing reads or writes it.
- **`PentaGem.jsx` is unused.** No importer.
- **`DECIDE_BLUE` constant in `theme.js`** — used now (hover border on the `DiaryConversationSheet` speech bubble). No longer in the dead-constants list.
- **Profile / Bag tabs are disabled placeholders.**
- **`PlanetMenu` has no "Reader" item.** Peer mode is only reachable via the `PeerPortal` button. If `PeerPortal` is removed, peer mode becomes unreachable (the callback wiring in `App.handlePlanetMenuSelect` still handles the `'reader'` key).
- **`role: 'reader'` has no way to look at your own creatures.** The nav is hidden, so while in reader mode the only affordance is to submit, skip to another, or dismiss.
- **Root directory noise:** `notinuse/` holds v1a/v1b rebuild specs; not part of the Expo app build.

---

## 9. File map (lines ≥ 100)

```
components/planet/PlanetScreen.jsx       750   physics loop, zoom, gestures, PeerPortal mount
components/creatures/CreatureManager.jsx 367   monster list + filters + show-eggs toggle
components/journal/JournalReaderSheet.jsx 348  peer reply flow (gem/sphere + virtue + comment)
components/diary/DiaryCalendar.jsx       344   month grid + state-ranked entry list
components/diary/DiarySheet.jsx          324   state-aware diary detail (egg/sent/replied/hatched)
App.jsx                                  316   root: role, peer flow, send/reply/hatch callbacks
components/diary/DiaryWriter.jsx         257   composer with walking creature
components/diary/DiaryConversationSheet.jsx 241 post-write egg sheet (Keep / Send out)
assets/MoonCanvas.tsx                    209   canvas crater moon
components/ui/PentaGem.jsx               166   unused faceted gem
components/ui/Gem.jsx                    142   crown/pavilion/table gem
components/ui/Sphere.jsx                 131   lat/lon animated sphere (new)
theme.js                                 130   colors, attributes, VIRTUES, helpers
components/ui/Modal.jsx                  128   modal/sheet primitive
components/planet/PlanetMenu.jsx         124   top-left hamburger menu
components/creatures/CreatureCard.jsx    113   grid card (state-aware egg rendering)
components/ui/CreatureAvatar.jsx         106   creature body renderer
components/nav/BottomNav.jsx             100   bottom tabs (hidden in reader role)
```

## 10. What changed since `0420.md`

- **Monster state machine.** `'egg' | 'hatched'` → `'egg' | 'sent' | 'replied' | 'hatched'`. New persisted fields on `Monster`: `gift_shape`, `reply_comment`, `replied_at`.
- **Peer / reader role.** New `role` in `App.jsx`. `PeerPortal` on the planet + `JournalReaderSheet` implement a self-peer reply flow, backed by `data/pool.js`. `BottomNav` is hidden in reader role.
- **Gift picker moved.** The author-visible gift picker in `DiarySheet` is gone. The reader now assigns `{cat, virtue, shape, comment}` via `JournalReaderSheet`; the author only sees "Send out" → (wait) → "Someone replied: hatch to see it."
- **`EggIcon` has `pending` / `ready` states**, used to disambiguate `sent` and `replied` eggs visually while keeping the category hidden from the author.
- **Shape dualism.** Every gift now has a `gift_shape` of `'gem'` or `'sphere'`. `GiftSymbol` picks the renderer. `Sphere.jsx` is new; `PentaGem.jsx` also added but currently unused.
- **`DiaryConversationSheet` rewritten** from toast-stub to the send-vs-keep decision point (WalkingCreature + speech bubble + two-button footer).
- **`DiarySheet` gains reply-comment display** (quoted italic box with a `#6a60c4` left border) once hatched.
- **`DiaryCalendar` list ordering** is now state-ranked (replied first, then hatched, then egg/sent), so replies surface at the top.
- **`CreatureManager` egg visibility.** Default view hides non-hatched monsters; a `Show eggs (N)` toggle plus a conditional `U` category pill let the user inspect eggs/sent/replied with per-state hints.
- **Data reshuffle.** `data/pool.js` added (reader pool helpers). Seeds extended from 8 diaries / 8 monsters to 12 diaries / 12 monsters spanning all four states.
- **`DECIDE_BLUE`** is no longer dead — used as the hover border on the conversation sheet's speech bubble.
