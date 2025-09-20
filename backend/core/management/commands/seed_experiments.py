from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
from experiments.models import ExperimentCategory, Experiment


class Command(BaseCommand):
    help = 'Seed database with sample experiment data'

    def handle(self, *args, **options):
        self.stdout.write('🧪 Seeding experiment data...\n')
        
        # Create experiment categories
        categories_data = [
            {
                "name": "AI & Machine Learning",
                "slug": "ai-ml",
                "description": "Experiments with artificial intelligence and machine learning",
                "icon": "brain",
                "color": "#8b5cf6"
            },
            {
                "name": "Games & Interactive",
                "slug": "games",
                "description": "Interactive games and entertainment projects",
                "icon": "gamepad2",
                "color": "#10b981"
            },
            {
                "name": "Data Visualization",
                "slug": "dataviz",
                "description": "Creative ways to visualize and interact with data",
                "icon": "palette",
                "color": "#f59e0b"
            },
            {
                "name": "Developer Tools",
                "slug": "devtools",
                "description": "Tools and utilities for developers",
                "icon": "beaker",
                "color": "#3b82f6"
            },
            {
                "name": "Web Experiments",
                "slug": "web",
                "description": "Experimental web technologies and concepts",
                "icon": "sparkles",
                "color": "#ec4899"
            }
        ]
        
        for cat_data in categories_data:
            category, created = ExperimentCategory.objects.get_or_create(
                slug=cat_data["slug"],
                defaults=cat_data
            )
            if created:
                self.stdout.write(f"✓ Created experiment category: {category.name}")
        
        # Create experiments
        ai_category = ExperimentCategory.objects.get(slug="ai-ml")
        games_category = ExperimentCategory.objects.get(slug="games")
        viz_category = ExperimentCategory.objects.get(slug="dataviz")
        tools_category = ExperimentCategory.objects.get(slug="devtools")
        web_category = ExperimentCategory.objects.get(slug="web")
        
        experiments_data = [
            {
                "title": "AI Code Review Assistant",
                "slug": "ai-code-review",
                "description": "Intelligent code review tool that provides automated feedback using GPT-4",
                "long_description": """
                <p>This experimental tool leverages GPT-4 to provide intelligent code review feedback, helping developers improve code quality and catch potential issues early.</p>
                
                <h3>Key Features:</h3>
                <ul>
                    <li>Automated code analysis and suggestions</li>
                    <li>Security vulnerability detection</li>
                    <li>Performance optimization recommendations</li>
                    <li>Code style and best practice enforcement</li>
                    <li>Integration with GitHub and GitLab</li>
                </ul>
                
                <h3>Technical Implementation:</h3>
                <p>Built using FastAPI for the backend, React for the frontend, and OpenAI's GPT-4 API for intelligent analysis. The system processes code diffs and provides contextual feedback based on best practices and security guidelines.</p>
                """,
                "category": ai_category,
                "status": "beta",
                "tech_stack": ["Python", "FastAPI", "OpenAI API", "React", "TypeScript"],
                "demo_url": "https://code-review.edzio.dev",
                "code_url": "https://github.com/edzio/ai-code-review",
                "development_time": "3 weeks",
                "inspiration": "Wanted to explore how AI could enhance the code review process and help developers learn from automated feedback",
                "lessons_learned": "AI feedback is most effective when combined with human expertise. The tool works best as an assistant rather than a replacement for human reviewers.",
                "is_featured": True,
                "is_public": True
            },
            {
                "title": "Neural Network Visualizer",
                "slug": "neural-visualizer",
                "description": "Interactive visualization of neural network architectures and training processes",
                "long_description": """
                <p>A web-based tool for visualizing neural network architectures and watching training processes unfold in real-time.</p>
                
                <h3>Capabilities:</h3>
                <ul>
                    <li>Interactive network architecture diagrams</li>
                    <li>Real-time training visualization</li>
                    <li>Weight and bias inspection</li>
                    <li>Performance metrics dashboard</li>
                    <li>Export trained models</li>
                </ul>
                """,
                "category": viz_category,
                "status": "live",
                "tech_stack": ["D3.js", "TensorFlow.js", "React", "WebGL", "Python"],
                "demo_url": "https://neural-viz.edzio.dev",
                "code_url": "https://github.com/edzio/neural-visualizer",
                "development_time": "2 months",
                "inspiration": "Making machine learning more accessible through visualization",
                "is_featured": True,
                "is_public": True
            },
            {
                "title": "Quantum Snake Game",
                "slug": "quantum-snake",
                "description": "Classic Snake game with quantum mechanics - snake exists in superposition until observed",
                "long_description": """
                <p>A playful exploration of quantum mechanics concepts through the familiar Snake game interface.</p>
                
                <h3>Quantum Features:</h3>
                <ul>
                    <li>Snake exists in multiple positions simultaneously</li>
                    <li>Observation collapses the wave function</li>
                    <li>Uncertainty principle affects movement</li>
                    <li>Quantum tunneling through walls</li>
                    <li>Entanglement with food particles</li>
                </ul>
                """,
                "category": games_category,
                "status": "live",
                "tech_stack": ["JavaScript", "Canvas API", "Web Audio API", "CSS3"],
                "demo_url": "https://quantum-snake.edzio.dev",
                "code_url": "https://github.com/edzio/quantum-snake",
                "development_time": "1 week",
                "inspiration": "Combining physics concepts with classic gaming for educational entertainment",
                "is_featured": False,
                "is_public": True
            },
            {
                "title": "API Performance Monitor",
                "slug": "api-monitor",
                "description": "Real-time API monitoring with predictive analytics and anomaly detection",
                "long_description": """
                <p>A comprehensive monitoring solution for API performance with machine learning-powered insights.</p>
                
                <h3>Monitoring Features:</h3>
                <ul>
                    <li>Real-time performance metrics</li>
                    <li>Anomaly detection algorithms</li>
                    <li>Predictive scaling recommendations</li>
                    <li>Custom alerting rules</li>
                    <li>Historical trend analysis</li>
                </ul>
                """,
                "category": tools_category,
                "status": "development",
                "tech_stack": ["Node.js", "InfluxDB", "Grafana", "Python", "Machine Learning"],
                "code_url": "https://github.com/edzio/api-monitor",
                "development_time": "In progress - 6 weeks",
                "inspiration": "Need for better API monitoring tools in production environments",
                "is_featured": False,
                "is_public": True
            },
            {
                "title": "CSS Grid Playground",
                "slug": "css-grid-playground",
                "description": "Interactive tool for learning and experimenting with CSS Grid layouts",
                "long_description": """
                <p>An educational tool that makes CSS Grid approachable through interactive examples and real-time code generation.</p>
                
                <h3>Features:</h3>
                <ul>
                    <li>Drag-and-drop grid item placement</li>
                    <li>Real-time CSS code generation</li>
                    <li>Responsive breakpoint testing</li>
                    <li>Pre-built layout templates</li>
                    <li>Export functionality</li>
                </ul>
                """,
                "category": web_category,
                "status": "live",
                "tech_stack": ["React", "CSS Grid", "TypeScript", "Framer Motion"],
                "demo_url": "https://css-grid.edzio.dev",
                "code_url": "https://github.com/edzio/css-grid-playground",
                "development_time": "2 weeks",
                "inspiration": "Making CSS Grid more accessible to developers learning layout techniques",
                "is_featured": True,
                "is_public": True
            },
            {
                "title": "Voice-Controlled Todo App",
                "slug": "voice-todo",
                "description": "Todo application controlled entirely by voice commands using Web Speech API",
                "long_description": """
                <p>An experimental todo application that demonstrates the potential of voice interfaces in productivity apps.</p>
                
                <h3>Voice Commands:</h3>
                <ul>
                    <li>"Add task: [description]" - Create new tasks</li>
                    <li>"Complete [task name]" - Mark tasks as done</li>
                    <li>"Delete [task name]" - Remove tasks</li>
                    <li>"Show completed" - Filter view</li>
                    <li>"Clear all" - Bulk operations</li>
                </ul>
                """,
                "category": web_category,
                "status": "beta",
                "tech_stack": ["JavaScript", "Web Speech API", "Local Storage", "CSS3"],
                "demo_url": "https://voice-todo.edzio.dev",
                "code_url": "https://github.com/edzio/voice-todo",
                "development_time": "1 week",
                "inspiration": "Exploring voice interfaces as the future of human-computer interaction",
                "is_featured": False,
                "is_public": True
            }
        ]
        
        for exp_data in experiments_data:
            experiment, created = Experiment.objects.get_or_create(
                slug=exp_data["slug"],
                defaults=exp_data
            )
            if created:
                self.stdout.write(f"✓ Created experiment: {experiment.title}")
        
        self.stdout.write(self.style.SUCCESS('\n✅ Experiment seeding completed!'))
        self.stdout.write(f'Created {len(experiments_data)} experiments across {len(categories_data)} categories')