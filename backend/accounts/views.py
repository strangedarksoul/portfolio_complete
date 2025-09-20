from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
import uuid

from .models import User, PasswordResetToken
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    UserUpdateSerializer, EmailVerificationSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer
)
from analytics.tasks import track_event
from .tasks import send_verification_email, send_password_reset_email


class UserRegistrationView(APIView):
    """User registration endpoint"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate email verification token
            verification_token = str(uuid.uuid4())
            user.email_verification_token = verification_token
            user.save()
            
            # Send verification email
            send_verification_email.delay(user.id, verification_token)
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Track registration
            track_event.delay(
                'user_registration',
                metadata={'registration_date': timezone.now().isoformat()},
                user_id=user.id,
                session_key=request.session.session_key
            )
            
            return Response({
                'user': UserProfileSerializer(user, context={'request': request}).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                },
                'message': 'Registration successful. Please check your email to verify your account.'
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


class UserLoginView(APIView):
    """User login endpoint"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Update login tracking
            user.login_count += 1
            user.last_activity = timezone.now()
            user.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Track login
            track_event.delay(
                'user_login',
                metadata={'login_date': timezone.now().isoformat()},
                user_id=user.id,
                session_key=request.session.session_key
            )
            
            return Response({
                'user': UserProfileSerializer(user, context={'request': request}).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLogoutView(APIView):
    """User logout endpoint"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            # Track logout
            track_event.delay(
                'user_logout',
                metadata={'logout_date': timezone.now().isoformat()},
                user_id=request.user.id,
                session_key=request.session.session_key
            )
            
            return Response({'message': 'Successfully logged out'})
        except Exception as e:
            return Response({'error': 'Invalid refresh token'}, 
                          status=status.HTTP_400_BAD_REQUEST)


class EmailVerificationView(APIView):
    """Email verification endpoint"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            try:
                user = User.objects.get(email_verification_token=token)
                user.is_email_verified = True
                user.email_verification_token = ''
                user.save()
                
                return Response({'message': 'Email verified successfully'})
            except User.DoesNotExist:
                return Response({'error': 'Invalid verification token'}, 
                              status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    """Password reset request endpoint"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email, is_active=True)
                
                # Create reset token
                reset_token = PasswordResetToken.objects.create(
                    user=user,
                    token=str(uuid.uuid4())
                )
                
                # Send reset email
                send_password_reset_email.delay(user.id, reset_token.token)
                
            except User.DoesNotExist:
                pass  # Don't reveal if email exists
            
            return Response({
                'message': 'If an account with that email exists, a password reset link has been sent.'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    """Password reset confirmation endpoint"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            password = serializer.validated_data['password']
            
            try:
                reset_token = PasswordResetToken.objects.get(
                    token=token, 
                    is_used=False,
                    created_at__gte=timezone.now() - timezone.timedelta(hours=1)
                )
                
                user = reset_token.user
                user.set_password(password)
                user.save()
                
                reset_token.is_used = True
                reset_token.save()
                
                return Response({'message': 'Password reset successful'})
                
            except PasswordResetToken.DoesNotExist:
                return Response({'error': 'Invalid or expired reset token'}, 
                              status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    """User profile management"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)
    
    def put(self, request):
        serializer = UserUpdateSerializer(
            request.user, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(UserProfileSerializer(request.user, context={'request': request}).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class UserAvatarUpdateView(APIView):
    """Update user avatar"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        avatar_file = request.FILES.get('avatar')
        if not avatar_file:
            return Response(
                {'error': 'No avatar file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if avatar_file.content_type not in allowed_types:
            return Response(
                {'error': f'File type {avatar_file.content_type} not allowed. Use JPEG, PNG, GIF, or WebP.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (5MB limit)
        max_size = 5 * 1024 * 1024  # 5MB
        if avatar_file.size > max_size:
            return Response(
                {'error': f'File size exceeds 5MB limit'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Update user avatar
            request.user.avatar = avatar_file
            request.user.save(update_fields=['avatar'])
            
            # Track avatar update
            track_event.delay(
                'avatar_updated',
                metadata={
                    'file_size': avatar_file.size,
                    'file_type': avatar_file.content_type,
                },
                user_id=request.user.id,
                session_key=request.session.session_key
            )
            
            return Response(UserProfileSerializer(request.user, context={'request': request}).data)
            
        except Exception as e:
            return Response(
                {'error': f'Avatar upload failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )