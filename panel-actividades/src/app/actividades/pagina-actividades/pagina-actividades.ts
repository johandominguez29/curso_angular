import {
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import {
  FiltroEstado,
  FiltroPrioridad,
  Prioridad,
} from '../../modelos/actividad';


import { ResumenActividades } from '../resumen-actividades/resumen-actividades';
import { ListaActividades } from '../lista-actividades/lista-actividades';
import { FiltrosActividades } from '../filtros-actividades/filtros-actividades';
import { PanelSeccion } from '../../compartido/panel-seccion/panel-seccion';
import { ActividadesService } from '../actividades.service';

@Component({
  selector: 'app-pagina-actividades',
  standalone: true,
  imports: [
    ResumenActividades,
    ListaActividades,
    FiltrosActividades,
    PanelSeccion,
  ],
  templateUrl: './pagina-actividades.html',
  styleUrl: './pagina-actividades.css',
})
export class PaginaActividades {

  private readonly servicio =
  inject(ActividadesService);

  private readonly orden: Record<Prioridad, number> = {
    alta: 0,
    media: 1,
    baja: 2,
  };

  protected readonly actividades =
  this.servicio.actividades;
  
  protected readonly aviso =
  this.servicio.aviso;

  protected readonly sinGuardar =
  this.servicio.sinGuardar;

  protected readonly termino = signal('');

  protected readonly filtroEstado =
    signal<FiltroEstado>('todas');

  protected readonly filtroPrioridad =
    signal<FiltroPrioridad>('todas');

  protected readonly seleccionadaId =
    signal<number | null>(null);

  protected readonly total = computed(
    () => this.actividades().length,
  );

  protected readonly pendientes = computed(
    () =>
      this.actividades().filter(
        (a) => a.estado === 'pendiente',
      ).length,
  );

  protected readonly enProgreso = computed(
    () =>
      this.actividades().filter(
        (a) => a.estado === 'en_progreso',
      ).length,
  );

  protected readonly completadas = computed(
    () =>
      this.actividades().filter(
        (a) => a.estado === 'completada',
      ).length,
  );

  protected readonly porcentaje = computed(
    () =>
      this.total() === 0
        ? 0
        : Math.round(
            (this.completadas() / this.total()) * 100,
          ),
  );

  protected readonly visibles = computed(() => {
    const termino = this.termino()
      .trim()
      .toLocaleLowerCase('es');

    const estado = this.filtroEstado();
    const prioridad = this.filtroPrioridad();

    return this.actividades()
      .filter(
        (a) =>
          termino === '' ||
          a.titulo
            .toLocaleLowerCase('es')
            .includes(termino),
      )
      .filter(
        (a) =>
          estado === 'todas' ||
          a.estado === estado,
      )
      .filter(
        (a) =>
          prioridad === 'todas' ||
          a.prioridad === prioridad,
      )
      .sort(
        (primera, segunda) =>
          this.orden[primera.prioridad] -
          this.orden[segunda.prioridad],
      );
  });

  protected readonly mostradas = computed(
    () => this.visibles().length,
  );

  protected readonly hayFiltros = computed(
    () =>
      this.termino().trim() !== '' ||
      this.filtroEstado() !== 'todas' ||
      this.filtroPrioridad() !== 'todas',
  );

  protected readonly mensajeVacio = computed(
    () =>
      this.total() === 0
        ? 'Todavía no hay actividades. Crea la primera para empezar.'
        : 'Ninguna actividad coincide con los filtros aplicados.',
  );

  protected readonly seleccionada = computed(
    () =>
      this.actividades().find(
        (a) => a.id === this.seleccionadaId(),
      ) ?? null,
  );

  protected alternarDestacada(
    id: number,
  ): void {
    this.servicio.alternarDestacada(id);
  }

  protected avanzarEstado(
    id: number,
  ): void {
    this.servicio.avanzarEstado(id);
  }

  protected eliminar(
    id: number,
  ): void {
    this.servicio.eliminar(id);

    this.seleccionadaId.update(
      (actual) => (actual === id ? null : actual),
    );
  }

  protected seleccionar(
    id: number,
  ): void {
    this.seleccionadaId.update(
      (actual) => (actual === id ? null : id),
    );
  }

  protected limpiarFiltros(): void {
    this.termino.set('');
    this.filtroEstado.set('todas');
    this.filtroPrioridad.set('todas');
  }

  protected restablecer(): void {
    this.servicio.vaciar();

    this.limpiarFiltros();

    this.seleccionadaId.set(null);
  }

  constructor() {
    effect(() => {
      console.info(
        `[Tablero] ${this.mostradas()} de ${this.total()} visibles`,
      );
    });
  }
}