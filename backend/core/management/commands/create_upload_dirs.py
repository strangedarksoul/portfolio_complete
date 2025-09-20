from django.core.management.base import BaseCommand
from django.conf import settings
import os


class Command(BaseCommand):
    help = 'Create upload directories for file storage'

    def handle(self, *args, **options):
        upload_dirs = [
            'uploads/hire-requests/',
            'uploads/testimonials/',
            'uploads/general/',
        ]

        media_root = settings.MEDIA_ROOT
        
        for upload_dir in upload_dirs:
            full_path = os.path.join(media_root, upload_dir)
            
            if not os.path.exists(full_path):
                os.makedirs(full_path, mode=0o755, exist_ok=True)
                self.stdout.write(
                    self.style.SUCCESS(f'Created directory: {full_path}')
                )
            else:
                self.stdout.write(f'Directory already exists: {full_path}')

        self.stdout.write(
            self.style.SUCCESS('Upload directories setup complete')
        )