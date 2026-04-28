# Monster Drifting System

## 1a. How a Monster Drifts

A monster's state is tracked on `monster.state`. Finishing a diary creates an **egg**; the writer can release it adrift (**sent**), which enters it into the drifting pool.

## 1b. The Drifting Pool Distribution and Exit

Monsters are distributed evenly across readers, with those near deadline (<6hr) prioritized. The same monster can be read and gifted by multiple readers.

A drifting diary leaves the pool when either:

- A reader replies with a gift, or
- ~24hr passes with no feedback (minus some buffer) — the AI steps in and replies.

Either way, it returns to the writer as **replied**.

## 2. Draw Through the Reading Portal

Opening the reading portal draws a batch of 3 monsters that must be:

- In the drifting pool
- Not written by the reader
- Not seen by this reader before

## 3. Refresh Rules

Reading is intentional, not endless scrolling. A 6hr countdown starts when a batch is drawn and is shown in the portal; the reader can only refresh after it ends. **Absolute maximum per day per reader:** 4 batches, 12 diaries.

## 4. Reply Rules

Each gift belongs to exactly one category. For now:

- **Gem** — to witness
- **Sphere** — to bless

### Limits

- 1 gift per diary, per reader (as by the *"Not seen by this reader before"* rule)
- Authors can't gift their own diaries (as by the *"Not written by the reader"* rule)
- 3 gifts per reader per day, resetting at local 00:00 *(global vs. local — TBD)*

## 5. Multiple Gifts on the Same Monster

- All gifts are saved in the reader's record and count against their quota.
- The **earliest** gift becomes the primary gift — this is what the author sees, and this triggers hatching.
- Once the primary gift is decided, the monster leaves the drifting pool.

## 6. After the Quota Runs Out

When a reader has used all 3 gifts for the day: previously-shown diaries remain readable, the gift button is disabled, and seen diaries stay seen.

## 7. How Hatching Happens

The moment a monster receives its first feedback (reader or AI), its attributes — species, appearance, rarity, etc. — are decided and saved. **The result is locked at this moment, not when the animation plays.**

- **Reader side:** sees visual feedback (e.g., a rough outline of the monster?) on pressing reply.
- **Writer side:** presses *hatch* to reveal the monster — the animation is just the reveal.
