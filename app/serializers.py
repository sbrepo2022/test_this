from rest_framework import serializers
from .models import Task, Tester


class TaskSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault()
    )

    class Meta:
        model = Task
        fields = ('id', 'user', 'title', 'description', 'address', 'date_time', 'testers')


class TesterSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault()
    )

    class Meta:
        model = Tester
        fields = ('id', 'user', 'firstname', 'lastname', 'description', 'photo', 'task_set')
