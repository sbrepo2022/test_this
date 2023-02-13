from django.urls import path, include, reverse_lazy
from django.views.generic.base import RedirectView
from .views import TasksView, TestersView, APITasksViewSet, APITestersViewSet

from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register('tasks', APITasksViewSet, 'Task')
router.register('testers', APITestersViewSet, 'Tester')


urlpatterns = [
    path('api/', include(router.urls)),

    path('tasks/', TasksView.as_view(), name='tasks'),
    path('testers/', TestersView.as_view(), name='testers'),
    path('', RedirectView.as_view(url=reverse_lazy('tasks')), name='app'),
]