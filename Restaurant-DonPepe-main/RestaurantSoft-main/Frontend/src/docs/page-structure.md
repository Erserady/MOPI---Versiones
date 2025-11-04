# Componente de `Cualquier vista`

En `Cualquier vista` se define la estructura principal utilizando un contenedor que organiza el **header**, **contenido principal** y **footer**.

### Estructura

1. **HeaderComponent**

   - **Posición:** Arriba.
   - **Función:** Renderiza el encabezado de la página.

2. **Sección de contenido**

   - Todo el contenido de dicho componente.
   - Debe sí o sí estar envuelto en una etiqueta `<main>`.

3. **FooterComponent**

   - **Posición:** Al final.
   - **Función:** Renderiza el pie de página.

4. **MainComponent**
   - **Posición:** Cubre al header, al contenido y al footer.
   - **Función:** Componente padre donde mapear todo el contenido.

### Ejemplo

```javascript
return (
  <MainComponent>
    <HeaderComponent></HeaderComponent>
    <main>
      <section>contenido</section>
    </main>
    <FooterComponent></FooterComponent>
  </MainComponent>
);
```
