import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
export const mediaDirectory = fileURLToPath(
  new URL("../uploads/", import.meta.url),
);
export async function prepareImage(buffer, panorama = false) {
  try {
    if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error("empty");
    const input = sharp(buffer, { limitInputPixels: 100000000 });
    const metadata = await input.metadata();
    if (
      !["jpeg", "png", "webp"].includes(metadata.format) ||
      metadata.pages > 1
    )
      throw new Error("format");
    const rotated = metadata.orientation >= 5;
    const width = rotated ? metadata.height : metadata.width,
      height = rotated ? metadata.width : metadata.height;
    if (panorama && (width < 1024 || Math.abs(width / height - 2) > 0.02))
      throw new Error("ratio");
    const image = await input
      .rotate()
      .resize({ width: panorama ? 8192 : 1800, withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toBuffer();
    const info = await sharp(image).metadata();
    return { image, width: info.width, height: info.height };
  } catch {
    throw Object.assign(
      new Error(
        panorama
          ? "Choisissez une vraie photo 360° équirectangulaire au format 2:1 (au moins 1024 × 512), en JPEG, PNG ou WebP."
          : "Choisissez une image JPEG, PNG ou WebP valide.",
      ),
      { status: 400 },
    );
  }
}
export async function uploadImage(req, res) {
  const result = await prepareImage(
    req.body,
    req.headers["x-media-type"] === "panorama",
  );
  await mkdir(mediaDirectory, { recursive: true });
  const name = randomUUID() + ".jpg";
  await writeFile(mediaDirectory + "/" + name, result.image);
  res.status(201).json({
    url: "/api/media/" + name,
    width: result.width,
    height: result.height,
  });
}
