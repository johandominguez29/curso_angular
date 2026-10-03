import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import {
  Actividad,
  FiltroEstado,
  FiltroPrioridad,
  Prioridad,
} from '../../modelos/actividad';

import {
  toObservable,
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';

import {
  debounceTime,
  switchMap,
  of,
} from 'rxjs';

import { ResumenActividades } from '../resumen-actividades/resumen-actividades';
import { ListaActividades } from '../lista-actividades/lista-actividades';
import { FiltrosActividades } from '../filtros-actividades/filtros-actividades';
import { PanelSeccion } from '../../compartido/panel-seccion/panel-seccion';
import { ActividadesService } from '../actividades.service';
import { ActividadesApi } from '../../api/actividades-api';

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

  private readonly router =
    inject(Router);

  private readonly ruta =
    inject(ActivatedRoute);

  protected readonly cargando =
    this.servicio.cargando;

  protected readonly errorCarga =
    this.servicio.error;

  private readonly orden: Record<
    Prioridad,
    number
  > = {
    alta: 0,
    media: 1,
    baja: 2,
  };

  protected readonly actividades =
    this.servicio.actividades;

  readonly buscar =
    input<string | undefined>('');

  readonly estado =
    input<FiltroEstado | undefined>(
      'todas',
    );

  readonly prioridad =
    input<FiltroPrioridad | undefined>(
      'todas',
    );

  private readonly api =
  inject(ActividadesApi);

  protected readonly termino =
    computed(
      () => this.buscar() ?? '',
    );

  protected readonly filtroEstado =
    computed(
      () => this.estado() ?? 'todas',
    );

  protected readonly filtroPrioridad =
    computed(
      () => this.prioridad() ?? 'todas',
    );

  protected readonly seleccionadaId =
    signal<number | null>(null);

  protected readonly total =
    computed(
      () => this.actividades().length,
    );

  protected readonly pendientes =
    computed(
      () =>
        this.actividades().filter(
          (a) =>
            a.estado === 'pendiente',
        ).length,
    );

  protected readonly enProgreso =
    computed(
      () =>
        this.actividades().filter(
          (a) =>
            a.estado ===
            'en_progreso',
        ).length,
    );

  protected readonly completadas =
    computed(
      () =>
        this.actividades().filter(
          (a) =>
            a.estado ===
            'completada',
        ).length,
    );

  protected readonly porcentaje =
    computed(
      () =>
        this.total() === 0
          ? 0
          : Math.round(
              (this.completadas() /
                this.total()) *
                100,
            ),
    );

  protected readonly visibles =
    computed(() => {
      const termino =
        this.termino()
          .trim()
          .toLocaleLowerCase('es');

      const estado =
        this.filtroEstado();

      const prioridad =
        this.filtroPrioridad();

      return this.actividades()
        .filter(
          (a) =>
            termino === '' ||
            a.titulo
              .toLocaleLowerCase(
                'es',
              )
              .includes(
                termino,
              ),
        )
        .filter(
          (a) =>
            estado ===
              'todas' ||
            a.estado === estado,
        )
        .filter(
          (a) =>
            prioridad ===
              'todas' ||
            a.prioridad ===
              prioridad,
        )
        .sort(
          (
            primera,
            segunda,
          ) =>
            this.orden[
              primera.prioridad
            ] -
            this.orden[
              segunda.prioridad
            ],
        );
    });

  protected readonly mostradas =
    computed(
      () => this.visibles().length,
    );

  protected readonly hayFiltros =
    computed(
      () =>
        this.termino().trim() !==
          '' ||
        this.filtroEstado() !==
          'todas' ||
        this.filtroPrioridad() !==
          'todas',
    );

  protected readonly mensajeVacio =
    computed(
      () =>
        this.total() === 0
          ? 'Todavía no hay actividades. Crea la primera para empezar.'
          : 'Ninguna actividad coincide con los filtros aplicados.',
    );

  protected readonly seleccionada =
    computed(
      () =>
        this.actividades().find(
          (a) =>
            a.id ===
            this.seleccionadaId(),
        ) ?? null,
    );

    protected readonly resultados =
  signal<Actividad[] | null>(
    null,
  );

  constructor() {
  effect(() => {
    console.info(
      `[Tablero] ${this.mostradas()} de ${this.total()} visibles`,
    );
  });

  toObservable(
    this.termino,
  )
    .pipe(
      debounceTime(300),

      switchMap((t) =>
        t.trim() === ''
          ? of(null)
          : this.api.buscar(t),
      ),

      takeUntilDestroyed(),
    )
    .subscribe((r) =>
      this.resultados.set(r),
    );
}

  protected recargar(): void {
    this.servicio.cargar();
  }

  protected alternarDestacada(
    id: number,
  ): void {
    this.servicio.alternarDestacada(
      id,
    );
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
      (actual) =>
        actual === id
          ? null
          : actual,
    );
  }

  protected seleccionar(
    id: number,
  ): void {
    this.seleccionadaId.update(
      (actual) =>
        actual === id
          ? null
          : id,
    );
  }

  protected cambiarBuscar(
    valor: string,
  ): void {
    this.actualizar({
      buscar:
        valor.trim() === ''
          ? null
          : valor,
    });
  }

  protected cambiarEstado(
    valor: FiltroEstado,
  ): void {
    this.actualizar({
      estado:
        valor === 'todas'
          ? null
          : valor,
    });
  }

  protected cambiarPrioridad(
    valor: FiltroPrioridad,
  ): void {
    this.actualizar({
      prioridad:
        valor === 'todas'
          ? null
          : valor,
    });
  }

  protected limpiarFiltros(): void {
    this.actualizar({
      buscar: null,
      estado: null,
      prioridad: null,
    });
  }

  protected restablecer(): void {
    this.servicio.vaciar();

    this.limpiarFiltros();

    this.seleccionadaId.set(null);
  }

  private actualizar(
    cambios: Record<
      string,
      string | null
    >,
  ): void {
    this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams:
        cambios,
      queryParamsHandling:
        'merge',
      replaceUrl: true,
    });
  }
}
