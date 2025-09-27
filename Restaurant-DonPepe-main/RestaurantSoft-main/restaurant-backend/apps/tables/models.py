from django.db import models

class Table(models.Model):
    STATUS_CHOICES = [
        ("FREE","Libre"),
        ("OCCUPIED","Ocupada"),
        ("RESERVED","Reservada"),
    ]
    number = models.PositiveIntegerField(unique=True)
    capacity = models.PositiveSmallIntegerField(default=4)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="FREE")

    def __str__(self):
        return f"Mesa {self.number}"
