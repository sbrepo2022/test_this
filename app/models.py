from django.db import models
from django.contrib.auth.models import User


class Tester(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    firstname = models.CharField(max_length=32)
    lastname = models.CharField(max_length=32)
    description = models.CharField(max_length=32, blank=True)
    photo = models.ImageField(upload_to='testers_photos', null=True)


class Task(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=32)
    description = models.TextField(max_length=256, blank=True)
    address = models.CharField(max_length=64, blank=True)
    date_time = models.DateTimeField()
    testers = models.ManyToManyField(Tester, blank=True)
