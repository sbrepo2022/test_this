from rest_framework import serializers
from .models import Task, Tester


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('id', 'title', 'description', 'address', 'date_time', 'testers')


class TesterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tester
        fields = ('id', 'firstname', 'lastname', 'description', 'photo', 'task_set')
