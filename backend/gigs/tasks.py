from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import openai
from .models import HireRequest


@shared_task
def generate_hire_proposal(hire_request_id):
    """Generate AI proposal preview for hire request"""
    try:
        hire_request = HireRequest.objects.get(id=hire_request_id)
        
        # Create AI proposal using OpenAI
        if settings.OPENAI_API_KEY:
            client = openai.OpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url=getattr(settings, 'OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
                default_headers={
                    "HTTP-Referer": getattr(settings, 'FRONTEND_URL', 'http://localhost:3000'),
                    "X-Title": getattr(settings, 'SITE_NAME', "Edzio's Portfolio"),
                }
            )
            
            prompt = f"""
            Create a professional project proposal preview based on this hire request:
            
            Service: {hire_request.selected_gig.title if hire_request.selected_gig else 'Custom Development'}
            Client: {hire_request.name} ({hire_request.company if hire_request.company else 'Individual'})
            Budget: {hire_request.get_proposed_budget_display()}
            Timeline: {hire_request.get_timeline_display()}
            
            Project Description:
            {hire_request.message}
            
            Create a concise proposal that includes:
            1. Project scope (3-6 bullet points)
            2. Suggested timeline with milestones
            3. Ballpark cost estimate
            4. Next steps
            
            Keep it professional but friendly, around 200-300 words.
            """
            
            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are Edzio, a professional full-stack developer creating project proposals. Be concise and professional."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=settings.OPENAI_MAX_TOKENS,
                temperature=0.7
            )
            
            proposal = response.choices[0].message.content
            hire_request.proposal_preview = proposal
            hire_request.save(update_fields=['proposal_preview'])
            
    except Exception as e:
        print(f"Error generating proposal for hire request {hire_request_id}: {e}")


@shared_task
def send_hire_confirmation(hire_request_id):
    """Send confirmation email to client"""
    try:
        hire_request = HireRequest.objects.get(id=hire_request_id)
        
        subject = "Thanks for your project inquiry - Edzio Portfolio"
        
        html_message = f"""
        <h2>Thank you for your inquiry, {hire_request.name}!</h2>
        
        <p>I've received your project request and I'm excited to learn more about your needs.</p>
        
        <h3>Your Request Summary:</h3>
        <ul>
            <li><strong>Service:</strong> {hire_request.selected_gig.title if hire_request.selected_gig else 'Custom Development'}</li>
            <li><strong>Budget:</strong> {hire_request.get_proposed_budget_display()}</li>
            <li><strong>Timeline:</strong> {hire_request.get_timeline_display()}</li>
        </ul>
        
        <h3>Project Description:</h3>
        <p>{hire_request.message}</p>
        
        <h3>What's Next?</h3>
        <p>I'll review your request and get back to you within 24 hours with:</p>
        <ul>
            <li>A detailed project proposal</li>
            <li>Timeline breakdown with milestones</li>
            <li>Accurate pricing estimate</li>
            <li>Next steps to get started</li>
        </ul>
        
        {"<p>I'll also reach out to schedule a call as requested.</p>" if hire_request.meeting_requested else ""}
        
        <p>If you have any immediate questions or want to add more details, just reply to this email.</p>
        
        <p>Best regards,<br>Edzio</p>
        
        <hr>
        <p><small>This is an automated confirmation. I'll personally follow up soon!</small></p>
        """
        
        send_mail(
            subject=subject,
            message=f"Thank you for your inquiry, {hire_request.name}! I'll get back to you within 24 hours.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[hire_request.email],
            html_message=html_message
        )
        
        # Also notify admin
        send_mail(
            subject=f"New Hire Request from {hire_request.name}",
            message=f"New hire request received. ID: {hire_request.id}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.ADMIN_EMAIL],
            html_message=f"""
            <h3>New Hire Request</h3>
            <p><strong>From:</strong> {hire_request.name} ({hire_request.email})</p>
            <p><strong>Company:</strong> {hire_request.company}</p>
            <p><strong>Service:</strong> {hire_request.selected_gig.title if hire_request.selected_gig else 'Custom'}</p>
            <p><strong>Budget:</strong> {hire_request.get_proposed_budget_display()}</p>
            <p><strong>Timeline:</strong> {hire_request.get_timeline_display()}</p>
            <p><strong>Message:</strong></p>
            <p>{hire_request.message}</p>
            <p><a href="{settings.ADMIN_URL}gigs/hirerequest/{hire_request.id}/change/">View in Admin</a></p>
            """
        )
        
    except Exception as e:
        print(f"Error sending hire confirmation for request {hire_request_id}: {e}")