from flask import Flask, render_template, request, redirect, url_for, jsonify
import boto3
import uuid
import traceback
from botocore.exceptions import ClientError, NoCredentialsError

# Hardcoded bucket and region for simplicity
BUCKET = 'janhvi-portfolio-certificates'  # replace with your bucket
REGION = 'eu-north-1'                     # replace with your region

app = Flask(__name__)

# Initialize S3 client with error handling
try:
    s3 = boto3.client('s3', region_name=REGION)
    # Test S3 connection
    s3.head_bucket(Bucket=BUCKET)
    print(f"Successfully connected to S3 bucket: {BUCKET}")
except NoCredentialsError:
    print("ERROR: AWS credentials not found. Please configure your credentials.")
    s3 = None
except ClientError as e:
    print(f"ERROR: Cannot access S3 bucket {BUCKET}: {e}")
    s3 = None
except Exception as e:
    print(f"ERROR: S3 initialization failed: {e}")
    s3 = None

@app.route('/')
def home():
    # List certificates with error handling
    certs = []
    if s3:
        try:
            cert_result = s3.list_objects_v2(Bucket=BUCKET, Prefix='certificates/')
            # Check if any objects were found
            if 'Contents' in cert_result:
                for obj in cert_result['Contents']:
                    # Skip folder markers and only include actual files
                    if not obj['Key'].endswith('/') and obj['Key'] != 'certificates/':
                        certs.append(obj['Key'])
            else:
                print("No certificates found in bucket")
        except ClientError as e:
            print(f"Error listing certificates: {e}")
            # Continue without certificates list
        except Exception as e:
            print(f"Unexpected error listing certificates: {e}")
    
    return render_template(
        'index.html',
        resume_url=f'https://{BUCKET}.s3.{REGION}.amazonaws.com/Resume+Janhvi.pdf',
        certs=certs,
        BUCKET=BUCKET,
        REGION=REGION
    )

@app.route('/api/upload_certificate', methods=['POST'])
# This function should not be a route – just call it on startup
def ensure_certificates_folder():
    """Ensure the certificates folder exists in S3"""
    try:
        if s3:
            s3.put_object(Bucket=BUCKET, Key='certificates/', Body='')
            print("Certificates folder ensured in S3")
    except Exception as e:
        print(f"Warning: Could not ensure certificates folder: {e}")


# This is your actual upload endpoint
@app.route('/api/upload-certificate', methods=['POST'])
def upload_cert():
    try:
        if not s3:
            return jsonify({"error": "S3 service is not available. Please check AWS configuration."}), 503

        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400

        file = request.files['file']
        if file.filename == "":
            return jsonify({"error": "No selected file"}), 400

        allowed_extensions = {'.pdf', '.jpg', '.jpeg', '.png'}
        filename_lower = file.filename.lower()
        file_ext = '.' + filename_lower.split('.')[-1] if '.' in filename_lower else ''

        if file_ext not in allowed_extensions:
            return jsonify({"error": f"File type {file_ext} not allowed. Use: {', '.join(allowed_extensions)}"}), 400

        file.seek(0, 2)
        file_size = file.tell()
        file.seek(0)
        max_size = 5 * 1024 * 1024
        if file_size > max_size:
            return jsonify({"error": f"File too large ({file_size} bytes). Maximum size is {max_size} bytes."}), 400

        unique_id = str(uuid.uuid4())
        filename = f'certificates/{unique_id}_{file.filename}'

        content_type_map = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png'
        }
        content_type = content_type_map.get(file_ext, 'application/octet-stream')

        print(f"Uploading file: {filename} (Size: {file_size} bytes, Type: {content_type})")

        s3.upload_fileobj(
            file,
            BUCKET,
            filename,
            ExtraArgs={
                "ContentType": content_type
            }
        )

        file_url = f'https://{BUCKET}.s3.{REGION}.amazonaws.com/{filename}'
        print(f"Successfully uploaded: {file_url}")
        return jsonify({"success": True, "url": file_url, "message": "Certificate uploaded successfully"}), 200

    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        print(f"AWS S3 Error ({error_code}): {error_message}")
        return jsonify({"error": f"S3 upload failed: {error_message}"}), 500

    except NoCredentialsError:
        print("AWS credentials not found")
        return jsonify({"error": "AWS credentials not configured properly"}), 500

    except Exception as e:
        print(f"Unexpected error during upload: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify service status"""
    status = {
        "status": "OK",
        "s3_available": s3 is not None,
        "bucket": BUCKET,
        "region": REGION
    }
    
    if s3:
        try:
            s3.head_bucket(Bucket=BUCKET)
            status["bucket_accessible"] = True
        except Exception as e:
            status["bucket_accessible"] = False
            status["bucket_error"] = str(e)
    
    return jsonify(status)

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    print(f"Starting Flask app...")
    print(f"S3 Bucket: {BUCKET}")
    print(f"S3 Region: {REGION}")
    print(f"S3 Client Status: {'Available' if s3 else 'Not Available'}")
    
    # Ensure certificates folder exists
    ensure_certificates_folder()
    
    app.run(host='0.0.0.0', port=5000, debug=True)