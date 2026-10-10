import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { prepareImage } from "../services/media.js";
test("Les photos panoramiques exigent un format 2:1, pas une image ordinaire", async () => {
  const ordinary = await sharp({
    create: { width: 1200, height: 900, channels: 3, background: "#006c65" },
  })
    .png()
    .toBuffer();
  await assert.rejects(prepareImage(ordinary, true), /2:1/);
  const panorama = await sharp({
    create: { width: 2048, height: 1024, channels: 3, background: "#006c65" },
  })
    .png()
    .toBuffer();
  const result = await prepareImage(panorama, true);
  assert.equal(result.width, 2048);
  assert.equal(result.height, 1024);
  assert.equal((await sharp(result.image).metadata()).format, "jpeg");
});
test("Un fichier maquillé en photo est refusé", async () => {
  await assert.rejects(
    prepareImage(Buffer.from("<script>alert(1)</script>")),
    /valide/,
  );
});
