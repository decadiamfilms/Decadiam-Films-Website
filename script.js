// Decadiam Films Website JavaScript
// Film Industry Standard Layout

document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    initSmoothScrolling();
    initContactForm();
    initProjectThumbnails();
});


// Mobile menu functionality
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileClose = document.getElementById('mobile-close');
    
    if (mobileMenuBtn && mobileMenu) {
        // Open mobile menu
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
        
        // Close mobile menu
        const closeMobileMenu = () => {
            mobileMenu.classList.add('hidden');
            document.body.style.overflow = '';
        };
        
        if (mobileClose) {
            mobileClose.addEventListener('click', closeMobileMenu);
        }
        
        // Close when clicking nav links
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
        
        // Close when clicking outside
        mobileMenu.addEventListener('click', (e) => {
            if (e.target === mobileMenu) {
                closeMobileMenu();
            }
        });
    }
}

// Smooth scrolling for navigation
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Project thumbnail interactions
function initProjectThumbnails() {
    const projectThumbnails = document.querySelectorAll('.project-thumbnail');
    
    projectThumbnails.forEach(thumbnail => {
        const playBtn = thumbnail.querySelector('.play-btn');
        
        if (playBtn) {
            playBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Here you would typically open a video lightbox or navigate to project page
                // For now, we'll just add a visual feedback
                playBtn.style.transform = 'scale(1.2)';
                playBtn.style.background = '#ffffff';
                
                setTimeout(() => {
                    playBtn.style.transform = 'scale(1)';
                    playBtn.style.background = 'rgba(255,255,255,0.9)';
                }, 200);
                
                // You can add actual video player logic here
                console.log('Play video for project:', thumbnail.closest('.group'));
            });
        }
        
        // Add keyboard support
        thumbnail.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (playBtn) {
                    playBtn.click();
                }
            }
        });
        
        // Make thumbnails focusable
        thumbnail.setAttribute('tabindex', '0');
    });
}

// Contact form functionality
function initContactForm() {
    const form = document.getElementById('contact-form');
    const inputs = form.querySelectorAll('input, textarea');
    
    // Simple form styling - no floating labels needed with this design
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.style.borderColor = 'white';
        });
        
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }
        });
    });
    
    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        // Loading state
        submitBtn.textContent = 'SENDING...';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        
        // Simulate form submission
        setTimeout(() => {
            // Success state
            submitBtn.textContent = 'MESSAGE SENT';
            submitBtn.style.background = 'white';
            submitBtn.style.color = 'black';
            
            setTimeout(() => {
                // Reset form
                form.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.background = '';
                submitBtn.style.color = '';
                
                // Reset input styles
                inputs.forEach(input => {
                    input.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                });
            }, 2000);
        }, 1500);
    });
}

// Video error handling
document.addEventListener('DOMContentLoaded', () => {
    const heroVideo = document.getElementById('hero-video');
    
    // Handle hero video errors
    if (heroVideo) {
        heroVideo.addEventListener('error', () => {
            console.log('Hero video failed to load');
            heroVideo.style.display = 'none';
        });
    }
});

// Intersection Observer for fade-in animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe project cards for staggered animation
    const projectCards = document.querySelectorAll('.group');
    projectCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
}

// Initialize scroll animations
initScrollAnimations();

// Keyboard navigation support
document.addEventListener('keydown', (e) => {
    // ESC key closes mobile menu
    if (e.key === 'Escape') {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }
});

// Performance optimization: Reduce motion for users who prefer it
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.setProperty('--animation-duration', '0.01ms');
    
    // Disable video autoplay for users who prefer reduced motion
    const videos = document.querySelectorAll('video[autoplay]');
    videos.forEach(video => {
        video.removeAttribute('autoplay');
    });
}