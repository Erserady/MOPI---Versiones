from django.urls import path
from .views import RegisterView, LoginView, UsersByRoleView, VerifyPinView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="user-register"),
    path("login/", LoginView.as_view(), name="user-login"),
    path("by-role/", UsersByRoleView.as_view(), name="users-by-role"),
    path("verify-pin/", VerifyPinView.as_view(), name="verify-pin"),
]