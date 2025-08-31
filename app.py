from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
import boto3
import uuid

BUCKET = 'my-portfolio-janhvi-jathot'  # Updated to match your actual bucket
REGION = 'eu-north-1'  # Updated to match your actual region

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  
s3 = boto3.client('s3', region_name=REGION)

@app.route('/')
def home():
    # Get certificates from S3
    certs = []
    try:
        result = s3.list_objects_v2(Bucket=BUCKET, Prefix='certifications/')
        for obj in result.get('Contents', []):
            if not obj['Key'].endswith('/'):
                certs.append(obj['Key'])
    except Exception as e:
        print(f"Error fetching certificates: {e}")
        certs = []
    
    return render_template('index.html', 
                         resume_url=f'https://{BUCKET}.s3.{REGION}.amazonaws.com/resume.pdf', 
                         certs=certs, 
                         BUCKET=BUCKET, 
                         REGION=REGION)

@app.route('/upload_cert', methods=['POST'])
def upload_cert():
    # Check if file is present in the request
    if 'file' not in request.files:
        flash('No file selected. Please choose a certificate to upload.', 'error')
        return redirect(url_for('home'))
    
    file = request.files['file']
    
    # Check if file is actually selected (not empty)
    if file.filename == '' or file.filename is None:
        flash('No file selected. Please choose a certificate to upload.', 'error')
        return redirect(url_for('home'))
    
    # Check if file has content
    file.seek(0, 2)  # Seek to end of file
    file_size = file.tell()
    file.seek(0)  # Reset to beginning
    
    if file_size == 0:
        flash('Empty file detected. Please upload a valid certificate.', 'error')
        return redirect(url_for('home'))
    
    try:
        filename = f'certifications/{uuid.uuid4()}_{file.filename}'
        content_type = file.content_type  # Get the content type of the file
        s3.upload_fileobj(
            file,
            BUCKET,
            filename,
            ExtraArgs={
                "ContentType": content_type,
                "ContentDisposition": "inline"  
            }
        )
        flash('Certificate uploaded successfully!', 'success')
    except Exception as e:
        flash(f'Error uploading certificate: {str(e)}', 'error')
    
    return redirect(url_for('home'))

@app.route('/delete_cert', methods=['POST'])
def delete_cert():
    try:
        data = request.get_json()
        cert_key = data.get('cert_key')
        
        if not cert_key:
            return jsonify({'success': False, 'error': 'No certificate key provided'})
        
        # Delete the certificate from S3
        s3.delete_object(Bucket=BUCKET, Key=cert_key)
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
