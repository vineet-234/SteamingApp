import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * uploadOnCloudinary(input, options)
 * - input: Buffer | path | data-uri | url
 * - returns: Cloudinary result object or throws error
 */
export async function uploadOnCloudinary(input, options = {}) {
  if (!input) return null;

  const timeoutMs = 30000; // 30s

  if (Buffer.isBuffer(input)) {
    return new Promise((resolve, reject) => {
      console.log("[cloudinary] upload start (buffer)", { options });

      const timer = setTimeout(() => {
        const err = new Error("Cloudinary upload timed out");
        console.error("[cloudinary] timeout");
        reject(err);
      }, timeoutMs);

      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "auto", ...options },
        (error, result) => {
          clearTimeout(timer);
          if (error) {
            console.error("[cloudinary] upload error:", error);
            return reject(error);
          }
          console.log("[cloudinary] upload success:", result?.secure_url || result?.url);
          resolve(result);
        }
      );

      try {
        streamifier.createReadStream(input).pipe(uploadStream);
      } catch (err) {
        clearTimeout(timer);
        console.error("[cloudinary] stream error:", err);
        reject(err);
      }
    });
  }

  // fallback for path / url / data-uri
  try {
    console.log("[cloudinary] upload start (fallback)", { options, inputType: typeof input });
    const result = await cloudinary.uploader.upload(input, { resource_type: "auto", ...options });
    console.log("[cloudinary] upload success (fallback):", result?.secure_url || result?.url);
    return result;
  } catch (err) {
    console.error("[cloudinary] upload error (fallback):", err);
    throw err;
  }
}

export default cloudinary;