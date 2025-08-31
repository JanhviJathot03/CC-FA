// Initialize AOS (Animate On Scroll)
AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true,
    mirror: false
});

// Mobile Menu Toggle
const mobileMenu = document.querySelector('.mobile-menu');
const navMenu = document.querySelector('.nav-menu');

mobileMenu.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 30px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    }
});

// Progress bar
window.addEventListener('scroll', () => {
    const progressBar = document.querySelector('.progress-bar');
    const totalHeight = document.body.scrollHeight - window.innerHeight;
    const progress = (window.pageYOffset / totalHeight) * 100;
    progressBar.style.width = progress + '%';
});

// Scroll to top button
const scrollTopBtn = document.querySelector('.scroll-top');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        scrollTopBtn.classList.add('show');
    } else {
        scrollTopBtn.classList.remove('show');
    }
});

scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Active navigation link highlighting
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
});

// Contact form handling
const contactForm = document.querySelector('.contact-form');
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const name = formData.get('name');
    const email = formData.get('email');
    const subject = formData.get('subject');
    const message = formData.get('message');
    
    if (!name || !email || !subject || !message) {
        alert('Please fill in all fields');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
    }
    
    alert('Thank you for your message! I will get back to you soon.');
    contactForm.reset();
});

// Certificate Management Functions
function loadCertificatesFromServer() {
    const certificatesData = document.getElementById('certificates-data');
    if (certificatesData) {
        try {
            const certificates = JSON.parse(certificatesData.textContent);
            certificates.forEach(cert => {
                addCertificateToGrid(cert);
            });
        } catch (error) {
            console.error('Error loading certificates from server:', error);
        }
    }
}

async function refreshCertificates() {
    try {
        const response = await fetch('/api/certificates');
        const data = await response.json();
        
        // Clear existing certificates
        const certificatesGrid = document.getElementById('certificatesGrid');
        if (certificatesGrid) {
            certificatesGrid.innerHTML = '';
        }
        
        // Add all certificates
        data.certificates.forEach(cert => {
            addCertificateToGrid(cert);
        });
        
        return data.certificates;
    } catch (error) {
        console.error('Error refreshing certificates:', error);
        return [];
    }
}

function addCertificateToGrid(certificate) {
    const certificatesGrid = document.querySelector('#certificatesGrid');
    if (!certificatesGrid) return;
    
    const certificateCard = document.createElement('div');
    certificateCard.className = 'certificate-card';
    
    const getIcon = (url) => {
        if (url.toLowerCase().includes('.pdf')) {
            return 'fas fa-file-pdf';
        }
        return 'fas fa-image';
    };
    
    // Format date
    const formatDate = (dateStr) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        } catch {
            return dateStr;
        }
    };
    
    certificateCard.innerHTML = `
        <div class="certificate-icon">
            <i class="${getIcon(certificate.url)}"></i>
        </div>
        <div class="certificate-content">
            <h3>${certificate.title}</h3>
            <p class="certificate-issuer">${certificate.issuer}</p>
            <p class="certificate-date">${formatDate(certificate.date)}</p>
            <a href="${certificate.url}" target="_blank" class="certificate-link">
                <i class="fas fa-external-link-alt"></i> View Certificate
            </a>
        </div>
    `;
    
    certificateCard.style.opacity = '0';
    certificateCard.style.transform = 'translateY(20px)';
    certificatesGrid.appendChild(certificateCard);
    
    setTimeout(() => {
        certificateCard.style.transition = 'all 0.5s ease';
        certificateCard.style.opacity = '1';
        certificateCard.style.transform = 'translateY(0)';
    }, 100);
}

// File upload area drag and drop
const fileUploadArea = document.getElementById('fileUploadArea');
const certificateFile = document.getElementById('certificateFile');

if (fileUploadArea && certificateFile) {
    fileUploadArea.addEventListener('click', () => {
        certificateFile.click();
    });

    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });

    fileUploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
    });

    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            certificateFile.files = files;
            updateFileUploadDisplay(files[0]);
        }
    });

    certificateFile.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            updateFileUploadDisplay(e.target.files[0]);
        }
    });
}

function updateFileUploadDisplay(file) {
    const fileUploadArea = document.getElementById('fileUploadArea');
    if (fileUploadArea) {
        fileUploadArea.innerHTML = `
            <i class="fas fa-file-alt"></i>
            <p>Selected: ${file.name}</p>
            <small>Click to change file</small>
        `;
    }
}

function resetFileUploadDisplay() {
    const fileUploadArea = document.getElementById('fileUploadArea');
    if (fileUploadArea) {
        fileUploadArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Click to select or drag and drop your certificate</p>
        `;
    }
}

// Enhanced Certificate Upload
async function uploadCertificate(formData) {
    try {
        console.log('Starting certificate upload...');
        
        const response = await fetch('/api/upload-certificate', {
            method: 'POST',
            body: formData
        });
        
        console.log('Response status:', response.status);
        
        let result;
        try {
            result = await response.json();
            console.log('Response data:', result);
        } catch (e) {
            const text = await response.text();
            console.log('Response text:', text);
            throw new Error(`Server returned non-JSON response: ${text.substring(0, 200)}`);
        }
        
        if (!response.ok) {
            throw new Error(result.error || `HTTP error! status: ${response.status}`);
        }
        
        return result;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

// Certificate form submission
const certificateForm = document.getElementById('certificateUploadForm');
const loadingOverlay = document.getElementById('loadingOverlay');

if (certificateForm && loadingOverlay) {
    certificateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(certificateForm);
        const title = formData.get('title');
        const issuer = formData.get('issuer');
        const date = formData.get('date');
        const file = formData.get('file');
        
        // Validation
        if (!title || !issuer || !date || !file) {
            alert('Please fill in all fields and select a file');
            return;
        }
        
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            alert('Please upload a PDF or image file (JPG, PNG)');
            return;
        }
        
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert('File size must be less than 5MB');
            return;
        }
        
        try {
            loadingOverlay.classList.add('show');
            
            // Upload the file
            const result = await uploadCertificate(formData);
            
            if (result.certificate) {
                // Add certificate to display
                addCertificateToGrid(result.certificate);
            }
            
            // Reset form
            certificateForm.reset();
            resetFileUploadDisplay();
            alert('Certificate uploaded successfully!');
            
        } catch (error) {
            console.error('Upload error:', error);
            let errorMessage = 'Failed to upload certificate. ';
            
            if (error.message.includes('S3')) {
                errorMessage += 'There was an issue with the storage service. ';
            } else if (error.message.includes('credentials')) {
                errorMessage += 'Server configuration issue. ';
            } else if (error.message.includes('bucket')) {
                errorMessage += 'Storage bucket not accessible. ';
            } else {
                errorMessage += error.message || 'Unknown error occurred. ';
            }
            
            errorMessage += 'Please try again later or contact support.';
            alert(errorMessage);
        } finally {
            loadingOverlay.classList.remove('show');
        }
    });
}

// Typing effect for hero subtitle
const subtitle = document.querySelector('.hero .subtitle');
if (subtitle) {
    const roles = ['Software Developer', 'Problem Solver', 'Full Stack Developer', 'MERN Stack Enthusiast'];
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeEffect() {
        const currentRole = roles[roleIndex];
        
        if (!isDeleting && charIndex <= currentRole.length) {
            subtitle.textContent = currentRole.substring(0, charIndex);
            charIndex++;
            setTimeout(typeEffect, 100);
        } else if (isDeleting && charIndex >= 0) {
            subtitle.textContent = currentRole.substring(0, charIndex);
            charIndex--;
            setTimeout(typeEffect, 50);
        } else if (!isDeleting && charIndex > currentRole.length) {
            setTimeout(() => {
                isDeleting = true;
                typeEffect();
            }, 2000);
        } else if (isDeleting && charIndex < 0) {
            isDeleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            setTimeout(typeEffect, 200);
        }
    }

    setTimeout(typeEffect, 2000);
}

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    
    if (hero && heroContent && scrolled < hero.offsetHeight) {
        heroContent.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Skills animation on scroll
const skillCategories = document.querySelectorAll('.skill-category');
if (skillCategories.length > 0) {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationDelay = '0s';
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    skillCategories.forEach(category => {
        skillObserver.observe(category);
    });
}

// Project cards hover effect
const projectCards = document.querySelectorAll('.project-card');
projectCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-15px) rotateX(5deg)';
        card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.2)';
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) rotateX(0)';
        card.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
    });
});

// Enhanced certificate cards hover effect
document.addEventListener('click', (e) => {
    if (e.target.closest('.certificate-card')) {
        const card = e.target.closest('.certificate-card');
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
            card.style.transform = 'scale(1)';
        }, 150);
    }
});

// Scroll reveal animation
const revealElements = document.querySelectorAll('.project-card, .skill-category, .certificate-card, .about-content > *');
if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.15 });

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });
}

// Server health check
async function checkServerHealth() {
    try {
        const response = await fetch('/api/health');
        const health = await response.json();
        console.log('Server health:', health);
        
        if (!health.s3_available) {
            console.warn('S3 service is not available');
        }
        
        if (!health.bucket_accessible) {
            console.warn('S3 bucket is not accessible');
        }
    } catch (error) {
        console.warn('Could not check server health:', error);
    }
}

// Load certificates on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load certificates from server data
    loadCertificatesFromServer();
    
    // Check server health
    checkServerHealth();
});

// Dynamic year in footer
const currentYear = new Date().getFullYear();
const footerYear = document.querySelector('.footer p');
if (footerYear) {
    footerYear.innerHTML = `&copy; ${currentYear} Janhvi Jathot. All rights reserved.`;
}

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Unexpected error:', e.message, e.filename, e.lineno, e.colno);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});