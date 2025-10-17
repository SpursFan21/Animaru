//scripts\attachSubtitles.ts

import { uploadSubtitleToMux } from "../src/utils/uploadSubtitleToMux.js";

(async () => {
  const subtitleUrl =
    "https://mmestcvtpgtqifmfnrwi.supabase.co/storage/v1/object/public/subtitles/frieren-dub-s1-e1.vtt";

    // manually add episode asset ids here for now for which episode it getting the subs added to it
    //will change to input variables later for admin dashboard
  const dubAsset = "Uk02DXUjg7Fjt99UeGSKPtK8tO7qJyHA4tkOtjyxnQFk";
  const subAsset = "hun6Clwx9SGL700SPU01l01J02SyF8M12pFDwrh7IYJ7d2Y";

  try {
    console.log("Attaching to DUB …");
    const dub = await uploadSubtitleToMux(dubAsset, subtitleUrl, "en", "English CC (Dub)");
    console.log("DUB track added:", dub);

    console.log("Attaching to SUB …");
    const sub = await uploadSubtitleToMux(subAsset, subtitleUrl, "en", "English CC (Sub)");
    console.log("SUB track added:", sub);
  } catch (err) {
    console.error("Upload failed:", err);
  }
})();
