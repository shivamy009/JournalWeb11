import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

/* ✅ REQUIRED for large uploads in App Router */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    console.log("📁 Upload request received");

    const formData = await request.formData();
    const file = formData.get("file");

    console.log("📄 File extracted:", file ? file.name : "No file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      console.log("❌ Invalid file type:", file.type);
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    console.log("✅ PDF file type validated");

    const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300MB

    console.log(
      "📏 File size:",
      (file.size / (1024 * 1024)).toFixed(2),
      "MB"
    );

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large. Max 300MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        },
        { status: 400 }
      );
    }

    console.log("🔄 Converting file to buffer...");
    const buffer = Buffer.from(await file.arrayBuffer());

    const fileName = `${Date.now()}-${file.name}`;

    console.log("☁️ Uploading to S3...");

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: "application/pdf",
    };

    await s3Client.send(new PutObjectCommand(params));

    console.log("✅ S3 upload completed");

    const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    return NextResponse.json({
      message: "File uploaded successfully",
      fileName,
      url,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}