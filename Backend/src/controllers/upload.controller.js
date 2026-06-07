import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { NodeIO } from "@gltf-transform/core";
import {
  KHRDracoMeshCompression,
  KHRTextureTransform,
  KHRMaterialsUnlit,
  KHRMaterialsPBRSpecularGlossiness,
  KHRMaterialsSpecular,
  KHRMaterialsIOR,
  KHRMaterialsTransmission,
  KHRMeshQuantization,
  EXTTextureWebP,
  EXTMeshGPUInstancing,
} from "@gltf-transform/extensions";
import { draco, dedup, prune } from "@gltf-transform/functions";
import draco3d from "draco3d";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// NodeIO instance shared (avoids recreating the WASM encoder each time)
let _io = null;
async function getIO() {
  if (_io) return _io;
  const encoderModule = await draco3d.createEncoderModule();
  const decoderModule = await draco3d.createDecoderModule();
  _io = new NodeIO()
    .registerExtensions([
      KHRDracoMeshCompression,
      KHRTextureTransform,
      KHRMaterialsUnlit,
      KHRMaterialsPBRSpecularGlossiness,
      KHRMaterialsSpecular,
      KHRMaterialsIOR,
      KHRMaterialsTransmission,
      KHRMeshQuantization,
      EXTTextureWebP,
      EXTMeshGPUInstancing,
    ])
    .registerDependencies({
      "draco3d.encoder": encoderModule,
      "draco3d.decoder": decoderModule,
    });
  return _io;
}

async function compressGLB(buffer) {
  const io = await getIO();
  const document = await io.readBinary(new Uint8Array(buffer));
  await document.transform(
    dedup(),   // Remove duplicate meshes/textures
    prune(),   // Remove unused nodes
    draco(),   // Draco geometry compression
  );
  return Buffer.from(await io.writeBinary(document));
}

export async function uploadModel(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    const originalSize = req.file.buffer.length;
    let body = req.file.buffer;
    let contentType = "model/gltf-binary";

    // Only compress GLB files (not GLTF JSON)
    const ext = req.file.originalname.toLowerCase().endsWith(".glb") ? ".glb" : ".gltf";
    if (ext === ".glb") {
      try {
        body = await compressGLB(req.file.buffer);
        const ratio = Math.round((1 - body.length / originalSize) * 100);
        console.log(`GLB compressed: ${(originalSize / 1e6).toFixed(1)}MB → ${(body.length / 1e6).toFixed(1)}MB (-${ratio}%)`);
      } catch (compressErr) {
        // Compression failed (e.g. already compressed) — upload original
        console.warn("GLB compression failed, uploading original:", compressErr.message);
        body = req.file.buffer;
      }
    }

    const key = `models/${randomUUID()}${ext}`;
    await s3.send(new PutObjectCommand({
      Bucket:      process.env.R2_BUCKET,
      Key:         key,
      Body:        body,
      ContentType: contentType,
    }));

    const url = `${process.env.R2_PUBLIC_URL}/${key}`;
    res.json({ url, originalSize, compressedSize: body.length });
  } catch (err) {
    console.error("R2 upload error:", err);
    res.status(500).json({ message: err.message });
  }
}
