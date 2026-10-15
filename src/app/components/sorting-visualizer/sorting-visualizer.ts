import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Barra {
  id: number; // identidad estable: permite animar el movimiento de cada barra
  valor: number;
}

type TipoOperacion =
  'info' | 'comparar' | 'intercambiar' | 'mover' | 'pivote' | 'seleccionar' | 'fin';

interface Operacion {
  tipo: TipoOperacion;
  texto: string;
  a?: number;
  b?: number;
  simbolo?: string;
  resultado?: string;
}

interface PasoLog {
  n: number;
  tipo: TipoOperacion;
  texto: string;
}

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-sorting-visualizer',
  styleUrl: './sorting-visualizer.css',
  templateUrl: './sorting-visualizer.html',
})
export class SortingVisualizer implements OnInit {
  constructor(private cdr: ChangeDetectorRef) {}
  readonly SLOT = 27; // ancho de barra (24) + separación (3)

  bars: Barra[] = [];
  maxValue = 0;
  length = 0;
  private nextId = 0;

  // Estados por posición: 'default' | 'comparing' | 'swapping' | 'sorted' | 'pivot' | 'selected'
  states: string[] = [];

  isSorting = false;
  selectedAlgorithm = 'burbuja';
  velocidad = 5; // 1 (lento) a 10 (rápido)
  modoPaso = false; // true = avanza solo al pulsar "Siguiente paso"
  pausado = false;
  esperandoClick = false;

  // Información visual
  operacion: Operacion = { tipo: 'info', texto: 'Elige un algoritmo y pulsa «Ordenar».' };
  log: PasoLog[] = [];
  numPaso = 0;
  comparaciones = 0;
  intercambios = 0;
  movimientos = 0;

  private cancelado = false;
  private resolverPaso?: () => void;

  algorithms = [
    { value: 'burbuja', label: 'Burbuja' },
    { value: 'insercion', label: 'Inserción' },
    { value: 'seleccion', label: 'Selección' },
    { value: 'quicksort', label: 'QuickSort' },
    { value: 'mergesort', label: 'MergeSort' },
  ];

  ngOnInit(): void {
    this.generarArray();
  }

  // ==================== TIEMPOS ====================
  get delay(): number {
    return Math.round(1200 / this.velocidad);
  }

  get animMs(): number {
    return Math.min(Math.round(this.delay * 0.8), 450);
  }

  // ==================== ARRAY ====================
  generarArray(): void {
    if (this.isSorting) return;
    this.bars = Array.from({ length: 20 }, () => ({
      id: this.nextId++,
      valor: Math.floor(Math.random() * 300) + 10,
    }));
    this.maxValue = Math.max(...this.bars.map((b) => b.valor));
    this.length = this.bars.length;
    this.states = new Array(this.length).fill('default');
    this.reiniciarInfo();
    this.cdr.detectChanges();
  }

  private reiniciarInfo(): void {
    this.log = [];
    this.numPaso = 0;
    this.comparaciones = 0;
    this.intercambios = 0;
    this.movimientos = 0;
    this.operacion = { tipo: 'info', texto: 'Elige un algoritmo y pulsa «Ordenar».' };
    this.cdr.detectChanges();
  }

  private v(i: number): number {
    return this.bars[i].valor;
  }

  // ==================== CONTROL DE EJECUCIÓN ====================
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private checkCancel(): void {
    if (this.cancelado) throw new Error('cancelado');
  }

  /** Registra un paso, lo muestra y espera (tiempo, pausa o clic en "Siguiente paso"). */
  private async paso(op: Operacion): Promise<void> {
    this.checkCancel();
    this.operacion = op;
    this.numPaso++;
    this.log.unshift({ n: this.numPaso, tipo: op.tipo, texto: op.texto });
    if (this.log.length > 300) this.log.pop();

    this.cdr.detectChanges(); //
    await this.esperar();
    this.cdr.detectChanges();
  }

  private async esperar(): Promise<void> {
    if (this.modoPaso) {
      this.esperandoClick = true;
      this.cdr.detectChanges();
      await new Promise<void>((res) => (this.resolverPaso = res));
      this.esperandoClick = false;
      this.cdr.detectChanges();
    } else {
      await this.sleep(this.delay);
      while (this.pausado && !this.cancelado) {
        await this.sleep(80);
      }
      this.cdr.detectChanges(); 
    }
    this.checkCancel();
  }

  siguientePaso(): void {
    this.resolverPaso?.();
    this.resolverPaso = undefined;
  }

  alCambiarModo(): void {
    // Si pasa a automático mientras espera un clic, lo liberamos
    if (!this.modoPaso) this.siguientePaso();
  }

  togglePausa(): void {
    this.pausado = !this.pausado;
  }

  detener(): void {
    this.cancelado = true;
    this.pausado = false;
    this.siguientePaso();
  }

  // ==================== OPERACIONES BASE ====================
  private async intercambiar(i: number, j: number, motivo = ''): Promise<void> {
    this.states[i] = 'swapping';
    this.states[j] = 'swapping';
    const a = this.v(i);
    const b = this.v(j);
    await this.paso({
      tipo: 'intercambiar',
      texto: `Intercambio ${a} (pos ${i}) ⇄ ${b} (pos ${j})${motivo ? ' — ' + motivo : ''}`,
      a,
      b,
      simbolo: '⇄',
    });
    [this.bars[i], this.bars[j]] = [this.bars[j], this.bars[i]];
    this.bars = [...this.bars];
    this.intercambios++;
    this.cdr.detectChanges();
    await this.sleep(this.animMs);
  }

  /** Saca la barra de 'from' y la inserta en 'to' (las intermedias se desplazan). */
  private async mover(from: number, to: number): Promise<void> {
    this.states[from] = 'swapping';
    const val = this.v(from);
    await this.paso({
      tipo: 'mover',
      texto: `Inserto ${val} desde la pos ${from} en la pos ${to}; los elementos intermedios se corren una posición →`,
      a: val,
      simbolo: `${from} → ${to}`,
    });
    const [x] = this.bars.splice(from, 1);
    this.bars.splice(to, 0, x);
    this.bars = [...this.bars];
    this.movimientos++;
    this.cdr.detectChanges(); // 🔑
    await this.sleep(this.animMs);
  }

  private pintarRango(a: number, b: number, estado: string): void {
    for (let k = a; k <= b; k++) this.states[k] = estado;
  }

  // ==================== ORQUESTADOR ====================
  async ordenamiento(): Promise<void> {
    if (this.isSorting) return;
    this.isSorting = true;
    this.cancelado = false;
    this.pausado = false;
    this.reiniciarInfo();
    this.states = new Array(this.length).fill('default');

    try {
      switch (this.selectedAlgorithm) {
        case 'burbuja':
          await this.bubbleSort();
          break;
        case 'insercion':
          await this.insertionSort();
          break;
        case 'seleccion':
          await this.selectionSort();
          break;
        case 'quicksort':
          await this.quickSort(0, this.length - 1);
          break;
        case 'mergesort':
          await this.mergeSort(0, this.length - 1);
          break;
      }

      this.operacion = { tipo: 'fin', texto: '¡Arreglo ordenado!' };
      this.log.unshift({ n: ++this.numPaso, tipo: 'fin', texto: '¡Arreglo ordenado!' });
      for (let i = 0; i < this.length; i++) {
        this.states[i] = 'sorted';
        this.cdr.detectChanges();
        await this.sleep(15);
      }
    } catch (e) {
      if ((e as Error).message !== 'cancelado') throw e;
      this.states = new Array(this.length).fill('default');
      this.operacion = { tipo: 'info', texto: 'Ejecución detenida.' };
    } finally {
      this.isSorting = false;
      this.pausado = false;
      this.esperandoClick = false;
    }
  }

  // ==================== BURBUJA ====================
  private async bubbleSort(): Promise<void> {
    const n = this.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        this.states[j] = 'comparing';
        this.states[j + 1] = 'comparing';
        const mayor = this.v(j) > this.v(j + 1);
        this.comparaciones++;
        await this.paso({
          tipo: 'comparar',
          texto: `¿${this.v(j)} (pos ${j}) > ${this.v(j + 1)} (pos ${j + 1})? ${mayor ? 'Sí' : 'No'}`,
          a: this.v(j),
          b: this.v(j + 1),
          simbolo: mayor ? '>' : '≤',
          resultado: mayor ? 'Sí → hay que intercambiarlos' : 'No → ya están en orden',
        });
        if (mayor) {
          await this.intercambiar(j, j + 1, 'el mayor "burbujea" a la derecha');
        }
        this.states[j] = 'default';
        this.states[j + 1] = 'default';
      }
      this.states[n - i - 1] = 'sorted';
    }
    this.states[0] = 'sorted';
  }

  // ==================== INSERCIÓN ====================
  private async insertionSort(): Promise<void> {
    this.states[0] = 'sorted';
    for (let i = 1; i < this.length; i++) {
      this.states[i] = 'selected';
      await this.paso({
        tipo: 'seleccionar',
        texto: `Tomo ${this.v(i)} (pos ${i}) para insertarlo en la parte ordenada de la izquierda`,
        a: this.v(i),
        simbolo: '↶',
      });

      let j = i; // posición actual del elemento que se está insertando
      while (j > 0) {
        this.states[j - 1] = 'comparing';
        const mayor = this.v(j - 1) > this.v(j);
        this.comparaciones++;
        await this.paso({
          tipo: 'comparar',
          texto: `¿${this.v(j - 1)} (pos ${j - 1}) > ${this.v(j)} (pos ${j})? ${mayor ? 'Sí' : 'No'}`,
          a: this.v(j - 1),
          b: this.v(j),
          simbolo: mayor ? '>' : '≤',
          resultado: mayor ? 'Sí → el elemento retrocede una posición' : 'No → encontró su lugar',
        });
        if (mayor) {
          await this.intercambiar(j - 1, j, 'retrocede una posición');
          this.states[j] = 'sorted';
          this.states[j - 1] = 'selected';
          j--;
        } else {
          this.states[j - 1] = 'sorted';
          break;
        }
      }
      this.states[j] = 'sorted';
    }
  }

  // ==================== SELECCIÓN ====================
  private async selectionSort(): Promise<void> {
    const n = this.length;
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      this.states[minIdx] = 'selected';
      await this.paso({
        tipo: 'seleccionar',
        texto: `Busco el mínimo desde la pos ${i}. Candidato inicial: ${this.v(i)}`,
        a: this.v(i),
        simbolo: 'mín',
      });

      for (let j = i + 1; j < n; j++) {
        this.states[j] = 'comparing';
        const menor = this.v(j) < this.v(minIdx);
        this.comparaciones++;
        await this.paso({
          tipo: 'comparar',
          texto: `¿${this.v(j)} (pos ${j}) < ${this.v(minIdx)} (mín actual, pos ${minIdx})? ${menor ? 'Sí' : 'No'}`,
          a: this.v(j),
          b: this.v(minIdx),
          simbolo: menor ? '<' : '≥',
          resultado: menor ? `Sí → nuevo mínimo: ${this.v(j)}` : 'No → el mínimo se mantiene',
        });

        if (menor) {
          if (minIdx !== i) this.states[minIdx] = 'default';
          minIdx = j;
          this.states[minIdx] = 'selected';
        } else {
          this.states[j] = 'default';
        }
      }

      if (minIdx !== i) {
        await this.intercambiar(i, minIdx, 'el mínimo va a su posición final');
      }

      this.states[minIdx] = 'default';
      this.states[i] = 'sorted';
    }
    this.states[n - 1] = 'sorted';
  }

  // ==================== QUICKSORT ====================
  private async quickSort(low: number, high: number): Promise<void> {
    if (low < high) {
      await this.paso({
        tipo: 'info',
        texto: `QuickSort sobre las posiciones [${low} … ${high}]`,
      });
      const pi = await this.partition(low, high);
      this.states[pi] = 'sorted';
      await this.quickSort(low, pi - 1);
      await this.quickSort(pi + 1, high);
    } else if (low >= 0 && low < this.length) {
      this.states[low] = 'sorted';
    }
  }

  private async partition(low: number, high: number): Promise<number> {
    const pivot = this.v(high);
    this.states[high] = 'pivot';
    await this.paso({
      tipo: 'pivote',
      texto: `Pivote = ${pivot} (última posición, pos ${high})`,
      a: pivot,
      simbolo: 'pivote',
    });

    let i = low - 1;

    for (let j = low; j < high; j++) {
      this.states[j] = 'comparing';
      const menor = this.v(j) < pivot;
      this.comparaciones++;
      await this.paso({
        tipo: 'comparar',
        texto: `¿${this.v(j)} (pos ${j}) < pivote ${pivot}? ${menor ? 'Sí' : 'No'}`,
        a: this.v(j),
        b: pivot,
        simbolo: menor ? '<' : '≥',
        resultado: menor ? 'Sí → va a la zona izquierda' : 'No → se queda a la derecha',
      });

      if (menor) {
        i++;
        if (i !== j) {
          await this.intercambiar(i, j, 'pasa a la zona de menores');
        }
        this.states[i] = 'default';
      }
      if (j !== i) this.states[j] = 'default';
    }

    if (i + 1 !== high) {
      await this.intercambiar(i + 1, high, 'el pivote va a su posición final');
    } else {
      await this.paso({
        tipo: 'info',
        texto: `El pivote ${pivot} ya está en su posición final (pos ${high})`,
      });
    }
    this.states[high] = 'default';
    this.states[i + 1] = 'sorted';

    return i + 1;
  }

  // ==================== MERGESORT ====================
  private async mergeSort(left: number, right: number): Promise<void> {
    if (left >= right) return;

    const mid = Math.floor((left + right) / 2);
    await this.mergeSort(left, mid);
    await this.mergeSort(mid + 1, right);
    await this.merge(left, mid, right);
  }

  /** Mezcla in-place: inserta los elementos de la derecha en su lugar dentro de la izquierda. */
  private async merge(left: number, mid: number, right: number): Promise<void> {
    this.pintarRango(left, right, 'selected');
    await this.paso({
      tipo: 'info',
      texto: `Mezclo [${left} … ${mid}] con [${mid + 1} … ${right}]`,
    });

    let i = left; // inicio de lo que queda de la mitad izquierda
    let j = mid + 1; // inicio de lo que queda de la mitad derecha

    while (i < j && j <= right) {
      this.states[i] = 'comparing';
      this.states[j] = 'comparing';
      const menorIgual = this.v(i) <= this.v(j);
      this.comparaciones++;
      await this.paso({
        tipo: 'comparar',
        texto: `¿${this.v(i)} (pos ${i}) ≤ ${this.v(j)} (pos ${j})? ${menorIgual ? 'Sí' : 'No'}`,
        a: this.v(i),
        b: this.v(j),
        simbolo: menorIgual ? '≤' : '>',
        resultado: menorIgual
          ? 'Sí → ya está en su lugar'
          : `No → ${this.v(j)} se inserta en la pos ${i}`,
      });

      if (menorIgual) {
        i++;
      } else {
        await this.mover(j, i);
        i++;
        j++;
      }
      this.pintarRango(left, right, 'selected');
    }

    this.pintarRango(left, right, 'default');
  }

  // ==================== VISTA ====================
  getAlturaBarra(valor: number): number {
    if (this.maxValue === 0) return valor;
    return (valor / this.maxValue) * 480;
  }

  getStateClass(estado: string): string {
    return `estado-${estado}`;
  }

  getTransform(i: number): string {
    const lift = this.states[i] === 'swapping' ? -18 : 0;
    return `translate(${i * this.SLOT}px, ${lift}px)`;
  }
}
