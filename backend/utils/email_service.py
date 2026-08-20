import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_verification_email(to_email, otp):
    smtp_email = os.environ.get("SMTP_EMAIL")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    
    if not smtp_email or not smtp_password:
        print(f"\n--- [TEST MODE] 2FA OTP for {to_email}: {otp} ---\n", flush=True)
        return {"success": True, "test_mode": True, "otp": otp}
        
    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_email
        msg['To'] = to_email
        msg['Subject'] = "Your Fieldnote Careers Verification Code"
        
        body = f"Hello!\n\nYour verification code is: {otp}\n\nPlease enter this code to complete your login.\n\nThanks,\nThe Fieldnote Team"
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(smtp_email, smtp_password)
        text = msg.as_string()
        server.sendmail(smtp_email, to_email, text)
        server.quit()
        
        return {"success": True, "test_mode": False}
    except Exception as e:
        print(f"Failed to send email: {e}")
        return {"success": False, "error": str(e)}
