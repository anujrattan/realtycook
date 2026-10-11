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

#### Blue clip prompt (user runs it in the OpenArt UI)

Settings: Veo 3.1, image-to-video, start frame and end frame = approved blue still, 720p, 4 s, 9:16, audio off, lite. Save into `gaggz-styles`.

```text
@gagan stays exactly as in the start frame: same face, hair, jewellery and outfit throughout. Photorealistic smartphone video, static camera on a tripod at chest height, full body head to toe in frame, bright Indian home interior with soft window daylight.

She gives a soft, natural smile at the camera, shifts her weight gently, then turns slowly about a quarter to her left so the flare of the blue printed Anarkali and the maroon hem border are visible, and turns back to face the camera, ending in the same pose as the start frame. Slow, relaxed, real-person movement.

The dupatta stays draped on her shoulder and moves only slightly. Hands natural, five fingers. Face fully visible at all times, no blur. No camera movement, no zoom, no cuts, no text, no extra people, no change to the outfit's colours or print.
```

### Recipe that preserved identity

Nano Banana 2, `image2image`, 9:16, 1K (20 credits). References in this order: headshot, full body, face-free garment crop. The prompt names image 1 as the face, image 2 as proportions only, image 3 as the exact outfit, and lists the accessories (left-nostril stud, squiggle pendant + mole, pearl double drops, rose-gold watch left wrist only, right wrist bare).

## Tooling notes (checked 2026-10-11)

- OpenArt Starter ($14/mo, 4,000 credits): the pricing page lists commercial use rights from Plus ($34/mo, 12,000 credits) upward, not on Starter. Affiliate content is commercial — confirm with OpenArt or upgrade before publishing.
- Kling AI direct: Standard $8.80/mo renewal ($6.99 first month; ₹999 via India App Store) for 660 credits; Pro $32.56/mo for 3,000; Premier $80.96/mo for 8,000. Commercial use on all paid tiers. Monthly credits expire; top-ups last 2 years.
- Kling 3.0 image-to-video, 5 s, 720p, no audio: 30 Kling credits direct vs 125 OpenArt credits for the same model on OpenArt.
- Kling Elements binds a character from 2–4 reference images and is referenced by `@name` in the prompt, alongside start/end frames.
- Runway: Standard $15/mo (625 credits), Pro $35/mo (2,250), Max $95/mo (9,500, one-month rollover); 20% off yearly. Gen-4.5 = 12 credits/s (60 per 5 s clip); Gen-4 Turbo = 5 credits/s. Free plan: 125 one-time credits, watermarked, no Gen-4.5.
- Cost per 5 s clip at monthly billing: Kling 3.0 direct $0.30–0.40; OpenArt Veo 3.1 lite (4 s) $0.23–0.28; OpenArt Kling 3.0 $0.35–0.44; Runway Gen-4.5 $0.60–1.44; Runway Gen-4 Turbo $0.25–0.60.
- Decision: test Kling (free trial) first; consider Runway only if Kling fails to hold Gagan's identity.
- Kling Motion Control (approved still + 3–30 s reference video; output length = reference length): 3.0 Standard 720p 9 credits/s, 3.0 Pro 1080p 12 credits/s, 2.6 Standard 5 credits/s. Clothing, hair and props come from the still; the face element only works with "orientation matches video". Reference must be one person, full body, static camera, no cuts; fast or complex motion can be truncated and is not refunded. Not available through the OpenArt connector.
- Motion references: record our own (phone on tripod, flowy kurta/Anarkali, 4–8 s) or use Kling's Motion Library. Do not download other creators' Reels as references.

### Free-trial test plan (66 Kling credits)

| Test | Settings | Credits |
|---|---|---:|
| Image-to-video | Kling 3.0, blue still as start + end frame, `@gagan`, 5 s, 720p, no sound | 30 |
| Motion control | Kling 3.0 Standard, blue still + self-recorded 4.0 s reference, orientation matches video, `@gagan` face element | 36 |

## Credit ledger

| Date | Item | Model / settings | Credits | Result | Balance |
|---|---|---|---:|---|---:|
| before 2026-10-11 | Earlier experiments, incl. Wan 2.7 Blue/Plum video | various | ~1,200 | Rejected | 2,735 |
| 2026-10-11 | Test still, blue KLOSIA | Nano Banana 2 i2i, 9:16, 1K | 20 | Approved | 2,715 |
| 2026-10-11 | Plum still, GoSriKi | Nano Banana 2 i2i, 9:16, 1K | 20 | Identity and outfit good; watch on wrong wrist | 2,695 |
