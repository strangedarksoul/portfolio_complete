from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, UserProfile


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    terms_accepted = serializers.BooleanField(write_only=True)
    privacy_accepted = serializers.BooleanField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'username', 'full_name', 'password', 'password_confirm', 
                 'terms_accepted', 'privacy_accepted']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        
        if not attrs.get('terms_accepted'):
            raise serializers.ValidationError("You must accept the terms of service")
        
        if not attrs.get('privacy_accepted'):
            raise serializers.ValidationError("You must accept the privacy policy")
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        terms_accepted = validated_data.pop('terms_accepted')
        privacy_accepted = validated_data.pop('privacy_accepted')
        
        user = User.objects.create_user(**validated_data)
        
        # Create user profile
        UserProfile.objects.create(
            user=user,
            terms_accepted=terms_accepted,
            privacy_accepted=privacy_accepted
        )
        
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(request=self.context.get('request'),
                              username=email, password=password)
            
            if not user:
                raise serializers.ValidationError('Invalid email or password')
            
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            
            attrs['user'] = user
            return attrs
        
        raise serializers.ValidationError('Must include email and password')


class UserProfileSerializer(serializers.ModelSerializer):
    """User profile with extended information"""
    profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'full_name', 'display_name',
            'avatar', 'bio', 'role', 'is_email_verified',
            'email_notifications', 'site_notifications', 'marketing_emails',
            'date_joined', 'last_activity', 'is_staff', 'profile'
        ]
        read_only_fields = ['id', 'email', 'role', 'date_joined', 'is_staff']
    
    def get_profile(self, obj):
        try:
            profile = obj.profile
            return {
                'job_title': profile.job_title,
                'company': profile.company,
                'website': profile.website,
                'linkedin_url': profile.linkedin_url,
                'github_url': profile.github_url,
                'interested_services': profile.interested_services,
                'project_bookmarks': profile.project_bookmarks,
                'chat_preferences': profile.chat_preferences,
            }
        except UserProfile.DoesNotExist:
            return None


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user information"""
    profile_data = serializers.DictField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'full_name', 'display_name', 'avatar', 'bio',
            'email_notifications', 'site_notifications', 'marketing_emails',
            'profile_data'
        ]
    
    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile_data', {})
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update profile fields
        if profile_data:
            profile, created = UserProfile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                if hasattr(profile, attr):
                    setattr(profile, attr, value)
            profile.save()
        
        return instance


class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.CharField()
    
    def validate_token(self, value):
        try:
            user = User.objects.get(email_verification_token=value)
            if user.is_email_verified:
                raise serializers.ValidationError("Email already verified")
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid verification token")


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    
    def validate_email(self, value):
        try:
            User.objects.get(email=value, is_active=True)
            return value
        except User.DoesNotExist:
            # Don't reveal whether email exists for security
            return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(validators=[validate_password])
    password_confirm = serializers.CharField()
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user info for public display"""
    class Meta:
        model = User
        fields = ['id', 'display_name', 'avatar']