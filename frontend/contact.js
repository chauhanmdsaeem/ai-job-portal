document.addEventListener("DOMContentLoaded", () => {
    const contactForm = document.getElementById("contact-form");
    
    if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            
            const name = document.getElementById("name").value;
            const email = document.getElementById("email").value;
            const subject = document.getElementById("subject").value;
            const message = document.getElementById("message").value;
            
            submitBtn.textContent = "Sending...";
            submitBtn.disabled = true;
            
            try {
                const res = await fetch("/api/feedback", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ name, email, subject, message })
                });
                
                const data = await res.json();
                
                if (res.ok) {
                    alert("Message sent successfully! We will be in touch soon.");
                    contactForm.reset();
                } else {
                    alert(data.error || "Failed to send message. Please try again.");
                }
            } catch (err) {
                console.error(err);
                alert("A network error occurred. Please try again later.");
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});
