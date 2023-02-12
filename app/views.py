from django.urls import reverse_lazy
from django.views.generic.base import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

from rest_framework.viewsets import ModelViewSet
from .models import Task, Tester
from .serializers import TaskSerializer, TesterSerializer


class TasksView(LoginRequiredMixin, TemplateView):
    template_name = 'app/tasks.html'
    extra_context = {
        'page_title': 'Задачи',
        'page_name': 'tasks'
    }


class TestersView(LoginRequiredMixin, TemplateView):
    template_name = 'app/testers.html'
    extra_context = {
        'page_title': 'Тестировщики',
        'page_name': 'testers'
    }


class APITasksViewSet(ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer


class APITestersViewSet(ModelViewSet):
    queryset = Tester.objects.all()
    serializer_class = TesterSerializer
