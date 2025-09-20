import openai
from django.conf import settings
from django.utils import timezone
from core.models import SiteConfiguration
from projects.models import Project, CaseStudy, Skill
from gigs.models import Gig
from .models import ChatKnowledgeBase


class ChatAIService:
    """Service for handling AI chat interactions"""
    
    def __init__(self):
        if settings.OPENAI_API_KEY:
            self.client = openai.OpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url=getattr(settings, 'OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
                default_headers={
                    "HTTP-Referer": getattr(settings, 'FRONTEND_URL', 'http://localhost:3000'),
                    "X-Title": getattr(settings, 'SITE_NAME', "Edzio's Portfolio"),
                }
            )
        else:
            self.client = None
        self.site_config = SiteConfiguration.load()
    
    def generate_response(self, query, session, context=None, audience='general', depth='medium', tone='professional'):
        """Generate AI response to user query"""
        if not self.client:
            return {
                'response': "I apologize, but the AI assistant is currently unavailable. Please try contacting directly via email.",
                'sources': [],
                'tokens_used': 0,
                'model_used': 'none'
            }
        
        # Build context from portfolio data
        portfolio_context = self.build_portfolio_context(context)
        
        # Get persona prompt
        persona_prompt = self.get_persona_prompt(audience, tone)
        
        # Build system message
        system_message = self.build_system_message(persona_prompt, portfolio_context, depth)
        
        # Get conversation history
        conversation_history = self.get_conversation_history(session)
        
        # Build messages
        messages = [
            {"role": "system", "content": system_message},
            *conversation_history,
            {"role": "user", "content": query}
        ]
        
        try:
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                max_tokens=settings.OPENAI_MAX_TOKENS,
                temperature=0.7,
                presence_penalty=0.1,
                frequency_penalty=0.1
            )
            
            ai_response = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            
            # Extract sources from response
            sources = self.extract_sources(ai_response, context)
            
            return {
                'response': ai_response,
                'sources': sources,
                'tokens_used': tokens_used,
                'model_used': settings.OPENAI_MODEL
            }
            
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return {
                'response': "I'm having trouble processing your request. Please try rephrasing your question or contact me directly.",
                'sources': [],
                'tokens_used': 0,
                'model_used': 'error'
            }
    
    def build_portfolio_context(self, context=None):
        """Build context from portfolio data"""
        context_data = {
            'site_info': {
                'name': self.site_config.site_name,
                'tagline': self.site_config.site_tagline,
                'email': self.site_config.email,
                'location': self.site_config.location,
                'about_short': self.site_config.about_short,
                'about_medium': self.site_config.about_medium,
            },
            'projects': [],
            'skills': [],
            'gigs': []
        }
        
        # Get projects
        projects = Project.objects.filter(visibility='public').select_related().prefetch_related('skills')
        for project in projects[:10]:  # Limit to top 10 projects
            project_data = {
                'id': project.id,
                'title': project.title,
                'short_tagline': project.short_tagline,
                'description_short': project.description_short,
                'role': project.role,
                'start_date': project.start_date.isoformat(),
                'end_date': project.end_date.isoformat() if project.end_date else None,
                'skills': [skill.name for skill in project.skills.all()],
                'repo_url': project.repo_url,
                'live_demo_url': project.live_demo_url,
                'metrics': project.metrics,
                'url': f'/projects/{project.slug}'
            }
            context_data['projects'].append(project_data)
        
        # Get skills
        skills = Skill.objects.filter(projects__visibility='public').distinct()
        for skill in skills:
            skill_data = {
                'name': skill.name,
                'category': skill.category,
                'proficiency_level': skill.proficiency_level,
                'description': skill.description,
                'project_count': skill.projects.filter(visibility='public').count()
            }
            context_data['skills'].append(skill_data)
        
        # Get gigs
        gigs = Gig.objects.filter(status='open')
        for gig in gigs:
            gig_data = {
                'id': gig.id,
                'title': gig.title,
                'short_description': gig.short_description,
                'price_display': gig.price_display,
                'delivery_display': gig.delivery_time_display,
                'url': f'/gigs/{gig.slug}'
            }
            context_data['gigs'].append(gig_data)
        
        # Add specific context if provided
        if context:
            if 'project_id' in context:
                try:
                    project = Project.objects.get(id=context['project_id'], visibility='public')
                    context_data['focused_project'] = {
                        'id': project.id,
                        'title': project.title,
                        'description_long': project.description_long,
                        'role': project.role,
                        'skills': [skill.name for skill in project.skills.all()],
                        'metrics': project.metrics,
                        'has_case_study': hasattr(project, 'case_study')
                    }
                    
                    if hasattr(project, 'case_study') and project.case_study.is_published:
                        case_study = project.case_study
                        context_data['focused_project']['case_study'] = {
                            'problem_statement': case_study.problem_statement,
                            'approach': case_study.approach,
                            'results': case_study.results
                        }
                except Project.DoesNotExist:
                    pass
        
        return context_data
    
    def get_persona_prompt(self, audience, tone):
        """Get persona prompt based on audience and tone"""
        base_prompt = f"""You are an AI assistant for {self.site_config.site_name}, a portfolio website showcasing Edzio's work as a full-stack developer and AI enthusiast."""
        
        if tone == 'professional':
            persona = self.site_config.chatbot_persona_professional
        elif tone == 'technical':
            persona = self.site_config.chatbot_persona_technical
        elif tone == 'casual':
            persona = self.site_config.chatbot_persona_casual
        else:
            persona = self.site_config.chatbot_persona_professional
        
        audience_prompts = {
            'recruiter': "The user is a recruiter or hiring manager. Focus on skills, experience, achievements, and career fit.",
            'developer': "The user is a fellow developer. You can be more technical and discuss architecture, implementation details, and code quality.",
            'founder': "The user is a founder or product person. Focus on business impact, product thinking, and project outcomes.",
            'client': "The user is a potential client. Focus on services, deliverables, process, and how Edzio can help solve their problems.",
            'general': "The user is a general visitor. Provide helpful information about Edzio's work and capabilities."
        }
        
        return f"{base_prompt}\n\n{persona}\n\nAudience context: {audience_prompts.get(audience, audience_prompts['general'])}"
    
    def build_system_message(self, persona_prompt, portfolio_context, depth):
        """Build comprehensive system message for AI"""
        depth_instructions = {
            'short': "Keep responses concise and to the point (1-2 sentences for simple questions, 1-2 paragraphs for complex ones).",
            'medium': "Provide balanced responses with good detail (2-3 paragraphs typically).",
            'long': "Provide comprehensive, detailed responses with examples and context."
        }
        
        system_message = f"""{persona_prompt}

{depth_instructions[depth]}

CRITICAL REQUIREMENTS:
1. You must ALWAYS cite sources when making factual claims about projects, skills, or achievements
2. When mentioning a project, include a link like: "See Project: [Title] - /projects/[slug]"
3. When mentioning a service, include a link like: "Learn more: /gigs/[slug]"
4. If you don't have information in the portfolio data, say so honestly and offer to connect them directly
5. Never invent project details, metrics, or capabilities not present in the provided data

Portfolio Data:
{str(portfolio_context)}

Example response format:
"Based on the portfolio, Edzio has extensive experience with React and Django, as demonstrated in the Realtime Chat App project (See Project: Realtime Chat App - /projects/realtime-chat). This project achieved 99.9% uptime and served over 10,000 users."

Remember: Always be helpful, accurate, and cite your sources with internal links!"""
        
        return system_message
    
    def get_conversation_history(self, session, max_messages=10):
        """Get recent conversation history"""
        messages = session.messages.order_by('-created_at')[:max_messages]
        
        history = []
        for msg in reversed(messages):
            role = "user" if msg.is_from_user else "assistant"
            history.append({"role": role, "content": msg.content})
        
        return history
    
    def extract_sources(self, response, context=None):
        """Extract source links from AI response"""
        sources = []
        
        # Look for project references in the response
        import re
        project_pattern = r'/projects/([a-zA-Z0-9-]+)'
        project_matches = re.findall(project_pattern, response)
        
        for slug in project_matches:
            try:
                project = Project.objects.get(slug=slug, visibility='public')
                sources.append({
                    'type': 'project',
                    'title': project.title,
                    'url': f'/projects/{project.slug}',
                    'description': project.short_tagline
                })
            except Project.DoesNotExist:
                pass
        
        # Look for gig references
        gig_pattern = r'/gigs/([a-zA-Z0-9-]+)'
        gig_matches = re.findall(gig_pattern, response)
        
        for slug in gig_matches:
            try:
                gig = Gig.objects.get(slug=slug)
                sources.append({
                    'type': 'gig',
                    'title': gig.title,
                    'url': f'/gigs/{gig.slug}',
                    'description': gig.short_description
                })
            except Gig.DoesNotExist:
                pass
        
        return sources