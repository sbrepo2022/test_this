from django.urls import path, reverse_lazy

from django.views.generic.base import RedirectView
from django.contrib.auth.views import LogoutView
from .views import LoginViewSimple, RegisterViewSimple

urlpatterns = [
    path('login/', LoginViewSimple.as_view(redirect_authenticated_user=True), name='login'),
    path('register/', RegisterViewSimple.as_view(), name='register'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('', RedirectView.as_view(url=reverse_lazy('login')), name='auth')
]