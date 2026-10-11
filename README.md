# @gaggz.styles — production log

Working record for the @gaggz.styles Instagram account (AI influencer Gagan Deep Kaur, Amazon Associates India, tracking ID `gaggzstyles-21`, no dot). It tracks verified products, approved OpenArt assets, every paid generation, and what to do next.

Rule: no paid generation runs without explicit approval of the model, settings and exact credit cost.

## Verified products

| Use | Amazon listing | Verified title / colour |
|---|---|---|
| Reel 1, outfit A (blue) | [B0FDWB8BZ5](https://www.amazon.in/dp/B0FDWB8BZ5) | KLOSIA Women Printed Anarkali Kurta and Pant Set with Dupatta, Viscose, colour **Teal Blue** (model `Sugandha_Blue_01`). `B0FDWK7PK9` opens the same listing. |
| Reel 1, outfit B (plum) | [B0DFP525RL](https://www.amazon.in/dp/B0DFP525RL) | GoSriKi Women's Rayon Blend Anarkali Printed Kurta with Pant & Dupatta ("Gangori Wine"), round neck, Amazon colour **Wine** |
| Carousel | [B0G6ZSVLPZ](https://www.amazon.in/dp/B0G6ZSVLPZ) | Nermosa Women Embroidery Solid A-Line Kurta and Pant Set with Dupatta, Viscose Silk, colour **Morepeach** (peach) |
| Carousel | [B0CRVV7J4M](https://www.amazon.in/dp/B0CRVV7J4M) | GoSriKi Cotton Blend Printed Anarkali ("Berlin Wine"), colour **Wine** |
| Carousel | [B0D87NYJTK](https://www.amazon.in/dp/B0D87NYJTK) | INDO ERA Viscose Embroidered Straight Kurta Pant with Dupatta Set. Link opens the **Purple** variant (child ASIN `B0D87NWMHX`); listing also offers Black and Teal. No white option — the 🤍 Linktree label needs checking. |

## OpenArt

Project `gaggz-styles` (`ydJcQhP2bhU4K4xYn0ff`). All new work goes here.

### Approved references

| Purpose | Asset ID |
|---|---|
| Identity — headshot (primary) | `sZdmw05JGXh0CUtUPlbx` |
| Identity — full body (proportions) | `x7zNoI0JbG798BdHdBpb` |
| Blue garment, faces cropped out | `kWQX3wvayNUBAWSBhnnH` |
| Plum garment, faces cropped out | `9R2782kOHPw5sLA8tZFW` |

Retired, do not use as identity references: `Buggi.png`, `Buggi FullLength2.png`, `gaggz-headshot.jpg`, `gaggz-full-length.png`, `gagan-turn-front/back.png`.

Original product uploads (default project) contain other models' faces; use the cropped versions above instead.

### Approved stills

| Still | Asset | Status |
|---|---|---|
| Gagan in blue KLOSIA, full body, 9:16 1K | [I9LXb4vODiRIdqoZvenD](https://cdn.openart.ai/openart-ai/production/2026-10/create-image/4XGNlLVl4BHlu6uyLsGg/image_1791717114081_93120721_1791717114144_fdd8e358.png) | Approved 2026-10-11 |
| Gagan in plum GoSriKi, full body, 9:16 1K | [QF0uqXNIrLNe3u7Y75QB](https://cdn.openart.ai/openart-ai/production/2026-10/create-image/4XGNlLVl4BHlu6uyLsGg/image_1791717681048_459994ab_1791717681093_b078d003.png) | Approved 2026-10-11 as is (watch on right wrist accepted) |

### OpenArt characters

Through the connector, a character only takes effect when it is passed as a `visualReferences` entry of type `character` with its internal ID, and the prompt mentions it as `@<characterId>` (e.g. `@4gaD3y398wSOkxvuT0Xc`). Typing the display name `@gagan` alone is plain text.

Only some modes accept characters (e.g. Veo 3.1 `element2video`, Seedance `element2video`). Image-to-image and image-to-video forms do not; there the approved still or headshot is the identity lock.

| Character | ID | Built from | Status |
|---|---|---|---|
| "Gagandeep kaur" | `4gaD3y398wSOkxvuT0Xc` | Retired Buggi images | Do not use; delete in OpenArt |
| `@gagan` | unknown — needed from user | should be approved headshot + full body | To confirm |

### Reel 1 plan — "Blue or Plum?"

Two separate image-to-video clips, one per approved still, each using the same still as both start and end frame so her face returns to the approved look. Subtle motion only — no full twirls (the earlier PixVerse twirl test drifted mid-spin and the dupatta flew). Clips are joined with text overlays locally with ffmpeg, which costs nothing.

Test the blue clip first; generate plum only after blue passes review.

| Option | Settings | Credits per clip |
|---|---|---:|
| Veo 3.1 image2video (recommended) | lite, 720p, 4 s, 9:16, no audio, start = end = still | 80 |
| PixVerse V6 image2video | 720p, 5 s, no audio, start = end = still | 70 |
| PixVerse V6 image2video | 540p, 5 s, no audio | 50 |

### Recipe that preserved identity

Nano Banana 2, `image2image`, 9:16, 1K (20 credits). References in this order: headshot, full body, face-free garment crop. The prompt names image 1 as the face, image 2 as proportions only, image 3 as the exact outfit, and lists the accessories (left-nostril stud, squiggle pendant + mole, pearl double drops, rose-gold watch left wrist only, right wrist bare).

## Credit ledger

| Date | Item | Model / settings | Credits | Result | Balance |
|---|---|---|---:|---|---:|
| before 2026-10-11 | Earlier experiments, incl. Wan 2.7 Blue/Plum video | various | ~1,200 | Rejected | 2,735 |
| 2026-10-11 | Test still, blue KLOSIA | Nano Banana 2 i2i, 9:16, 1K | 20 | Approved | 2,715 |
| 2026-10-11 | Plum still, GoSriKi | Nano Banana 2 i2i, 9:16, 1K | 20 | Identity and outfit good; watch on wrong wrist | 2,695 |
