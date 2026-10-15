# VisualSortingAlgorithms

Visualizador interactivo de algoritmos de ordenamiento construido con **Angular**. Permite ver paso a paso cómo funcionan distintos algoritmos, con animaciones, estadísticas en tiempo real y un historial detallado de cada operación.

---

## ✨ Características

- **5 algoritmos de ordenamiento**:
  - Burbuja (Bubble Sort)
  - Inserción (Insertion Sort)
  - Selección (Selection Sort)
  - QuickSort
  - MergeSort (in-place)

- **Visualización animada** de cada barra con transiciones suaves (transform, height, background-color).

- **Modo paso a paso**: avanza manualmente pulsando «Siguiente paso ▶» para analizar cada comparación, intercambio o movimiento.

- **Control de velocidad** (1 a 10) para acelerar o frenar la animación.

- **Pausar / Continuar / Detener** en cualquier momento durante la ejecución.

- **Panel de operación actual** que muestra:
  - El tipo de operación (comparar, intercambiar, mover, pivote, seleccionar, fin).
  - Los valores involucrados y el símbolo de la comparación.
  - El resultado de la decisión tomada.

- **Estadísticas en vivo**: número de comparaciones, intercambios y movimientos.

- **Historial de pasos** con los últimos 300 eventos registrados.

- **Leyenda de colores** para identificar visualmente cada estado:

  | Color           | Estado                |
  |-----------------|-----------------------|
  | Azul            | Por defecto           |
  | Naranja         | Comparando            |
  | Rojo            | Intercambiando/moviendo |
  | Morado          | Pivote                |
  | Verde azulado   | Seleccionado          |
  | Verde           | Ordenado              |

---

## 🚀 Inicio rápido

### Requisitos previos

- Node.js (versión 18 o superior recomendada)
- Angular CLI 22.2.2 o superior

### Instalación
```
git clone <url-del-repositorio>
cd VisualSortingAlgorithms
npm install
```

### Servidor de desarrollo
```
ng serve
```
Abre tu navegador en http://localhost:4200/. La aplicación se recargará automáticamente al modificar cualquier archivo fuente.

---

## 🧠 Cómo funciona

El componente principal SortingVisualizer mantiene:

- bars: arreglo de objetos { id, valor }. El id es una identidad estable que permite animar el desplazamiento de cada barra mediante transform: translateX(...).
- states: arreglo paralelo con el estado visual de cada posición.
- operacion: descripción de la operación que se está ejecutando actualmente.
- log: historial de pasos.
- Contadores: comparaciones, intercambios, movimientos.

Cada algoritmo se implementa como un método async que va llamando a paso(), el cual:

1. Actualiza el panel de operación y el historial.
2. Llama a detectChanges() para refrescar la vista.
3. Espera según el modo (paso a paso, pausa o delay automático).

El método intercambiar(i, j) y mover(from, to) mutan el arreglo bars y fuerzan la detección de cambios para que la animación se reproduzca correctamente.

---

## 📁 Estructura del proyecto

src/
├── app/
│   ├── sorting-visualizer/
│   │   ├── sorting-visualizer.ts     # Lógica del componente y algoritmos
│   │   ├── sorting-visualizer.html   # Plantilla (barras, controles, panel)
│   │   └── sorting-visualizer.css    # Estilos (barras, animaciones, panel)
│   └── app.component.ts
└── main.ts

---

## 🎮 Uso

1. Selecciona un algoritmo en el desplegable.
2. Ajusta la velocidad con el slider (1 = lento, 10 = rápido).
3. Activa Paso a paso si quieres analizar cada operación manualmente.
4. Pulsa Ordenar para iniciar la visualización.
5. Durante la ejecución puedes:
   - Pausar / Continuar (modo automático).
   - Siguiente paso ▶ (modo paso a paso).
   - Detener ■ para cancelar.
6. Pulsa Nuevo Array para generar un arreglo aleatorio nuevo.

---

## 🛠️ Comandos disponibles

### Servidor de desarrollo
```
ng serve
```

### Generar componentes
```
ng generate component component-name
ng generate --help
```

### Compilar
```
ng build
```
Los artefactos se guardan en dist/. La compilación de producción optimiza el rendimiento y la velocidad.

### Tests unitarios
```
ng test
```
Ejecuta los tests con Vitest (https://vitest.dev/).

### Tests end-to-end
```
ng e2e
```
Angular CLI no incluye un framework de e2e por defecto; puedes elegir el que prefieras.

---

## 🧩 Tecnologías

- Angular 22 (standalone components, nueva sintaxis de control de flujo @for / @if)
- TypeScript
- RxJS / Zone.js (o detección de cambios zoneless, según configuración)
- CSS con animaciones (@keyframes pop, aparecer) y transiciones

---

## 📚 Recursos adicionales

- Angular CLI Overview and Command Reference: https://angular.dev/tools/cli
- Documentación oficial de Angular: https://angular.dev

---

## 📄 Licencia

Este proyecto está disponible bajo la licencia que elijas (MIT, Apache 2.0, etc.). Añade aquí el archivo LICENSE correspondiente.