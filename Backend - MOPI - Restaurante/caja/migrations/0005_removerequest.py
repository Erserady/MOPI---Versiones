from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('mesero', '0008_waiterorder_waiter_id_waiter_name'),
        ('caja', '0004_egreso'),
    ]

    operations = [
        migrations.CreateModel(
            name='RemoveRequest',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('item_index', models.IntegerField(help_text='Índice del item dentro del pedido serializado')),
                ('item_nombre', models.CharField(blank=True, max_length=255, null=True)),
                ('cantidad', models.DecimalField(decimal_places=2, default=1, max_digits=10)),
                ('razon', models.TextField()),
                ('solicitado_por', models.CharField(blank=True, max_length=255, null=True)),
                ('estado', models.CharField(choices=[('pendiente', 'Pendiente'), ('aprobada', 'Aprobada'), ('rechazada', 'Rechazada')], default='pendiente', max_length=20)),
                ('autorizado_por', models.CharField(blank=True, max_length=255, null=True)),
                ('rechazado_por', models.CharField(blank=True, max_length=255, null=True)),
                ('motivo_rechazo', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='remove_requests', to='mesero.waiterorder')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
