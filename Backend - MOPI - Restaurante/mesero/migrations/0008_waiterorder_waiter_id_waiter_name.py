# Generated migration for adding waiter_id and waiter_name fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mesero', '0007_alter_waiterorder_estado'),
    ]

    operations = [
        migrations.AddField(
            model_name='waiterorder',
            name='waiter_id',
            field=models.IntegerField(blank=True, help_text='ID del mesero que creó/atiende esta orden', null=True),
        ),
        migrations.AddField(
            model_name='waiterorder',
            name='waiter_name',
            field=models.CharField(blank=True, help_text='Nombre del mesero que creó/atiende esta orden', max_length=200, null=True),
        ),
    ]
