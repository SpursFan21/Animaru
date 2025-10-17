//extract-audio.ts

import { extractAudioAll } from "../src/utils/extractAudio";


(async () => {
  await extractAudioAll();
})();

// run npx tsx extract-audio.ts in termial to trigger process