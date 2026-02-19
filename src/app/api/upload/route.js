import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '300mb',
    },
  },
};

export async function POST(request) {
  try {
    console.log("📁 Upload request received");
    const formData = await request.formData();
    const file = formData.get("file");
    console.log("📄 File extracted from formData:", file ? file.name : "No file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      console.log("❌ Invalid file type:", file.type);
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }
    console.log("✅ PDF file type validated");

        const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300MB in bytes
    console.log("📏 File size check - File:", (file.size / (1024 * 1024)).toFixed(2), "MB, Max:", (MAX_FILE_SIZE / (1024 * 1024)), "MB");
    if (file.size > MAX_FILE_SIZE) {
      console.log("❌ File too large:", (file.size / (1024 * 1024)).toFixed(2), "MB");
      return NextResponse.json({ 
        error: `File too large. Maximum size is 300MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB` 
      }, { status: 400 });
    }
    console.log("✅ File size validated");

    console.log("🔄 Converting file to buffer...");
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;
    console.log("📝 Generated filename:", fileName);
    console.log("📦 Buffer size:", (buffer.length / (1024 * 1024)).toFixed(2), "MB");

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: "application/pdf",
    };
    console.log("☁️ Starting S3 upload to bucket:", process.env.AWS_S3_BUCKET_NAME);
    console.log("⬆️ Uploading to S3...");

    await s3Client.send(new PutObjectCommand(params));
    console.log("✅ S3 upload completed successfully");

    const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    console.log("🔗 Generated S3 URL:", s3Url);
    console.log("🎉 Upload process completed successfully");

    return NextResponse.json({ message: "File uploaded successfully", fileName, url: s3Url });
  } catch (error) {
    console.error("❌ Upload error occurred:");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
