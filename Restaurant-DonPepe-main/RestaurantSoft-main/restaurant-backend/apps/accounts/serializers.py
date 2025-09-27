from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth import get_user_model

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ["id","username","email","first_name","last_name","role"]
