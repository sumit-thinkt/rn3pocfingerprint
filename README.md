# Digital Video Fingerprint Analysis POC

Standalone public Next.js frontend for Vercel. It visualizes the pre-generated timestamp-by-timestamp digital fingerprint evidence for one master video and three candidate videos.

## Included
- Candidate selector for Rearranged, AI Manipulated, and Pirated AI 4
- Synchronized master/candidate HTML5 video players
- Overall similarity, robust-match coverage, confidence, and classification
- Timestamp-level pHash, Hamming distance, match status, and seek-to-evidence actions
- High-confidence matched chunks with synchronized playback
- SHA-256 master integrity evidence and technical metadata
- Downloadable DOCX forensic reports and CSV evidence
- Real analysis data in `public/data/analysis.json`

## 1. Deploy to Vercel
1. Unzip this project.
2. Push it to a new GitHub repository (recommended) or import the folder into your normal Vercel workflow.
3. In Vercel, create a new project from the repository.
4. Framework Preset: Next.js. No custom build settings are required.

## 2. Put the four videos in public cloud storage
Do **not** put the MP4 files inside this repository/deployment. Upload them to Vercel Blob or another public/CDN storage endpoint that supports browser video range requests.

You need URLs for:
- Original / Reference Master
- Rearranged Version
- AI Manipulated Version
- Pirated AI 4

## 3. Add Vercel Environment Variables
In Project Settings -> Environment Variables, add:

```
NEXT_PUBLIC_MASTER_VIDEO_URL=https://.../original.mp4
NEXT_PUBLIC_REARRANGED_VIDEO_URL=https://.../rearranged.mp4
NEXT_PUBLIC_AI_MANIPULATED_VIDEO_URL=https://.../ai-manipulated.mp4
NEXT_PUBLIC_PIRATED_AI4_VIDEO_URL=https://.../pirated-ai-4.mp4
```

Apply them to Production (and Preview if desired), then redeploy.

## 4. Local test
```
npm install
cp .env.example .env.local
# edit .env.local with your video URLs
npm run dev
```
Open http://localhost:3000.

## Notes
- The POC is intentionally frontend-only. There is no database or analysis backend.
- The analysis values are pre-generated from the supplied videos and stored in JSON.
- Clicking `View evidence` seeks both players to the mapped master/candidate timestamps.
- `Sync Play` starts both players from the currently selected evidence row.
- `Matched chunks` play a synchronized evidence segment and automatically pause after that segment.
- For public POC use, anyone with the site URL can view the page and any publicly accessible video URLs.
