from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.validators import validate_email
from django.db import transaction

User = get_user_model()



class UserSerializer(serializers.ModelSerializer):
    """Serializer para respuestas completas (incluye PIN para administración)."""
    full_name = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "role", "color", "pin", "full_name", "is_active", "date_joined", "password")
        read_only_fields = ("id", "date_joined")
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }
    
    def get_full_name(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        elif obj.first_name:
            return obj.first_name
        return obj.username
    
    def create(self, validated_data):
        password = validated_data.pop('password', 'password123')
        usuario = validated_data.get('username', '')
        
        # Crear usuario con create_user para hashear la contraseña
        user = User.objects.create_user(
            username=validated_data.get('username'),
            email=validated_data.get('email', f"{usuario}@restaurant.com"),
            password=password,
            usuario=usuario,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'waiter'),
            pin=validated_data.get('pin', '0000'),
            color=validated_data.get('color', '#3b82f6'),
        )
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para creación de usuarios.
    Solo acepta los campos en inglés: 'username', 'email', 'password'.
    """
    password = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password")
        read_only_fields = ("id",)

    def validate(self, data):
        username = data.get("username")
        password = data.get("password")
        email = data.get("email")

        if not username:
            raise serializers.ValidationError({"username": "El campo 'username' es obligatorio."})

        if not password:
            raise serializers.ValidationError({"password": "El campo 'password' es obligatorio."})

        # validar email
        try:
            validate_email(email)
        except Exception:
            raise serializers.ValidationError({"email": "Email inválido."})

        # validar password con validators de Django
        try:
            validate_password(password)
        except Exception as e:
            msgs = getattr(e, "messages", None)
            raise serializers.ValidationError({"password": msgs if msgs else str(e)})

        # unicidad username/email
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({"username": "Ya existe un usuario con ese username."})

        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "Ya existe un usuario con ese email."})

        return data

    @transaction.atomic
    def create(self, validated_data):
        username = validated_data.get("username")
        email = validated_data.get("email")
        password = validated_data.get("password")

        # Preparar kwargs extras si el modelo User tiene un campo 'usuario'
        extra = {}
        user_field_names = [f.name for f in User._meta.get_fields()]
        if "usuario" in user_field_names:
            extra["usuario"] = username

        # create_user recibirá 'usuario' si corresponde al modelo
        user = User.objects.create_user(username=username, email=email, password=password, **extra)
        return user


class LoginSerializer(serializers.Serializer):
    """
    Acepta solo 'username' y 'password' (inglés).
    """
    username = serializers.CharField(required=True, allow_blank=False)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        import logging
        logger = logging.getLogger(__name__)
        
        username = data.get("username")
        password = data.get("password")
        
        logger.warning(f"[LOGIN DEBUG] Intentando login con username: {username}")
        logger.warning(f"[LOGIN DEBUG] Data recibida: {list(data.keys())}")

        if not username or not password:
            logger.error("[LOGIN DEBUG] Faltan username o password")
            raise serializers.ValidationError("Se requieren 'username' y 'password'.")

        request = self.context.get("request")
        user = authenticate(request=request, username=username, password=password)
        
        if not user:
            logger.error(f"[LOGIN DEBUG] Autenticación fallida para username: {username}")
            # Verificar si el usuario existe
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                user_exists = User.objects.filter(username=username).exists()
                logger.warning(f"[LOGIN DEBUG] ¿Usuario existe en BD? {user_exists}")
            except Exception as e:
                logger.error(f"[LOGIN DEBUG] Error al verificar usuario: {e}")
            raise serializers.ValidationError("Credenciales incorrectas.")

        logger.warning(f"[LOGIN DEBUG] Login exitoso para user: {user.username}")
        return {"user": user}


class UserByRoleSerializer(serializers.ModelSerializer):
    """Serializer para listar usuarios por rol con información básica."""
    name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ("id", "name", "role", "color")
        
    def get_name(self, obj):
        # Retornar el nombre completo o el username si no hay nombre
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        elif obj.first_name:
            return obj.first_name
        return obj.username


class PinVerificationSerializer(serializers.Serializer):
    """Serializer para verificar el PIN de un usuario."""
    user_id = serializers.IntegerField(required=True)
    pin = serializers.CharField(required=True, max_length=6)
    
    def validate(self, data):
        user_id = data.get("user_id")
        pin = data.get("pin")
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({"user_id": "Usuario no encontrado."})
        
        if user.pin != pin:
            raise serializers.ValidationError({"pin": "PIN incorrecto."})
        
        data["user"] = user
        return data