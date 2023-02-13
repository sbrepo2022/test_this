from django.urls import reverse_lazy
from django.views.generic.base import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
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
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user)


class APITestersViewSet(ModelViewSet):
    serializer_class = TesterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Tester.objects.filter(user=self.request.user)
