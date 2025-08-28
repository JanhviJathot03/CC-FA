import express from "express";
import multer from "multer";
import AWS from "aws-sdk";
import path from "path";
import fs from "fs";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Configure AWS S3 client using IAM roles (recommended for EC2)
// This will automatically use the IAM role attached to your EC2 instance
const s3 = new AWS.S3({
  region: 'eu-north-1' // Replace with your preferred region
});

// Middleware to serve static files (HTML, CSS, JS)
app.use(express.static(path.join(process.cwd(), "public")));

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

// Upload certificate endpoint
app.post("/api/upload-certificate", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Prepare S3 upload params
  const fileContent = fs.readFileSync(req.file.path);
  const bucketName = 'your-portfolio-certificates-bucket'; // Replace with your bucket name
  const params = {
    Bucket: bucketName,
    Key: req.body.fileName || req.file.originalname,
    Body: fileContent,
    ContentType: req.file.mimetype,
    ACL: 'public-read' // Makes the uploaded files publicly accessible
  };

  // Upload to S3
  s3.upload(params, (err, data) => {
    // Clean up temp file
    fs.unlinkSync(req.file.path);

    if (err) {
      console.error("S3 Upload Error:", err);
      return res.status(500).json({ error: "Failed to upload to S3" });
    }

    res.json({ url: data.Location });
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});