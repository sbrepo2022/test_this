from django.urls import reverse_lazy
from django.views.generic.edit import CreateView
from django.contrib.auth.views import LoginView

from .forms import AppLoginForm, AppUserCreationForm


class LoginViewSimple(LoginView):
    template_name = 'authorization/login.html'
    form_class = AppLoginForm
    extra_context = {'page_title': 'Авторизация'}


class RegisterViewSimple(CreateView):
    template_name = 'authorization/register.html'
    form_class = AppUserCreationForm
    success_url = reverse_lazy('login')
    extra_context = {'page_title': 'Регистрация'}

    def form_valid(self, form):
        result = super(RegisterViewSimple, self).form_valid(form)
        self.object.email = ''

        self.object.is_active = True
        self.object.save()

        return result
