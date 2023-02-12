from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.forms.widgets import TextInput, PasswordInput
from django.template.loader import render_to_string


class CustomTextInput(TextInput):
    template_name_extra = 'components/text_input_widget.html'
    extra_context = {}

    def render(self, *args, **kwargs):
        result = render_to_string(self.template_name_extra, self.extra_context)
        result += super(CustomTextInput, self).render(*args, **kwargs)
        return result


class CustomPasswordInput(PasswordInput):
    template_name_extra = 'components/password_input_widget.html'
    extra_context = {}

    def render(self, *args, **kwargs):
        result = render_to_string(self.template_name_extra, self.extra_context)
        result += super(CustomPasswordInput, self).render(*args, **kwargs)
        return result


class AppLoginForm(AuthenticationForm):
    def __init__(self, *args, **kwargs):
        super(AppLoginForm, self).__init__(*args, **kwargs)

        self.fields['username'].label = 'Логин'
        self.fields['username'].widget = CustomTextInput()
        self.fields['username'].widget.attrs['placeholder'] = 'Логин'

        self.fields['password'].label = 'Ваш пароль'
        self.fields['password'].widget = CustomPasswordInput()
        self.fields['password'].widget.attrs['placeholder'] = 'Пароль'


class AppUserCreationForm(UserCreationForm):
    def __init__(self, *args, **kwargs):
        super(AppUserCreationForm, self).__init__(*args, **kwargs)

        self.fields['username'].label = 'Ваш e-mail'
        self.fields['username'].widget = CustomTextInput()
        self.fields['username'].widget.attrs['placeholder'] = 'Логин'

        self.fields['password1'].label = 'Ваш пароль'
        self.fields['password1'].widget = CustomPasswordInput()
        self.fields['password1'].widget.attrs['placeholder'] = 'Пароль'

        self.fields['password2'].label = 'Повтор пароля'
        self.fields['password2'].widget = CustomPasswordInput()
        self.fields['password2'].widget.attrs['placeholder'] = 'Повтор пароля'