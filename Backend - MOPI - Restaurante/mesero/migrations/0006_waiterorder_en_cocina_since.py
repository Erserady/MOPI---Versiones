from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("mesero", "0005_table_assigned_waiter"),
    ]

    operations = [
        migrations.AddField(
            model_name="waiterorder",
            name="en_cocina_since",
            field=models.DateTimeField(
                blank=True,
                help_text="Momento exacto en que la orden entró a cocina",
                null=True,
            ),
        ),
    ]
