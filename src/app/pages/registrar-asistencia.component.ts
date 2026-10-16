import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import { environment } from '../../environments/environment';
import { InstitutionBrand, InstitutionService } from '../core/institution.service';

@Component({
  selector: 'app-registrar-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="kiosk attendance-v5" [ngClass]="institution?.className || ''">
      <div class="kiosk-top attendance-top">
        <div class="kiosk-brand-logo"><img [src]="institution?.logo" [alt]="institution?.name" /></div>
        <div class="attendance-title">
          <span class="eyebrow">{{ institution?.type }}</span>
          <h1>Registro de asistencia · {{ institution?.name }}</h1>
          <p>La asistencia requiere horario vigente, GPS, fecha/hora del servidor y el rostro correctamente encuadrado.</p>
        </div>
        <div class="kiosk-top-actions">
          <div class="server-clock" *ngIf="servidor">
            <small>Hora del servidor</small>
            <b>{{ servidor.fecha }} · {{ servidor.hora }}</b>
          </div>
          <a routerLink="/asistencia" class="btn ghost">Cambiar institución</a>
          <a routerLink="/login" class="btn secondary">Administración</a>
        </div>
      </div>

      <div class="attendance-validation-bar">
        <div [class.ok]="!!personal"><span>{{ personal ? '✓' : '1' }}</span> Personal</div>
        <div [class.ok]="!!horarioId"><span>{{ horarioId ? '✓' : '2' }}</span> Horario</div>
        <div [class.ok]="!!ubicacion"><span>{{ ubicacion ? '✓' : '3' }}</span> GPS</div>
        <div [class.ok]="rostroEnGuia"><span>{{ rostroEnGuia ? '✓' : '4' }}</span> Rostro encuadrado</div>
        <div [class.ok]="fotoValida"><span>{{ fotoValida ? '✓' : '5' }}</span> Foto capturada</div>
      </div>

      <div class="kiosk-grid attendance-grid">
        <section class="card attendance-person-card">
          <div class="step-label">PASO 1</div>
          <h2>Identificar personal</h2>
          <div class="search-row">
            <input [(ngModel)]="term" placeholder="DNI, código, nombre o apellido" (keyup.enter)="buscar()" />
            <button class="btn primary" (click)="buscar()" [disabled]="buscando">{{ buscando ? 'Buscando...' : 'Buscar' }}</button>
          </div>
          <p class="muted" *ngIf="term.trim().length>0 && term.trim().length<2">Ingrese al menos 2 caracteres.</p>

          <div class="result" *ngFor="let p of personas" (click)="seleccionar(p)" [class.selected]="personal?.personal_id === p.personal_id">
            <b>{{ p.nombres }} {{ p.apellidos }}</b>
            <small>{{ p.institucion?.nombre }} · {{ p.cargo?.nombre || 'Sin cargo' }}</small>
          </div>
          <div class="empty attendance-empty" *ngIf="busquedaRealizada && !buscando && !personas.length">No se encontró personal activo con ese criterio.</div>

          <div *ngIf="personal" class="selected-person-card">
            <span class="selected-person-avatar">{{ iniciales(personal) }}</span>
            <div>
              <small>Personal seleccionado</small>
              <strong>{{ personal.nombres }} {{ personal.apellidos }}</strong>
              <span>{{ personal.cargo?.nombre || 'Sin cargo' }}</span>
            </div>
          </div>

          <div *ngIf="personal" class="schedule-block">
            <div class="step-label">PASO 2</div>
            <h3>Horario vigente de hoy</h3>
            <label class="result schedule-option" *ngFor="let h of horarios" [class.selected]="horarioId === h.horario_personal_id">
              <input type="radio" name="horario" [value]="h.horario_personal_id" [(ngModel)]="horarioId" (change)="invalidarFoto()" />
              <span>
                <b>Bloque {{ h.bloque }}</b>
                <small>{{ shortTime(h.hora_entrada) }} – {{ shortTime(h.hora_salida) }} · tolerancia {{ h.tolerancia_minutos || 0 }} min</small>
              </span>
            </label>
            <div class="attendance-warning" *ngIf="horariosCargados && !horarios.length">
              ⚠ No existe un horario vigente para hoy. No se puede marcar asistencia.
            </div>
          </div>
        </section>

        <section class="card camera-card attendance-camera-card">
          <div class="step-label">PASO 3</div>
          <h2>Ubicación y fotografía</h2>

          <div class="gps-panel" [class.ok]="!!ubicacion">
            <div>
              <b>{{ ubicacion ? '✓ Ubicación obtenida' : 'Ubicación obligatoria' }}</b>
              <span *ngIf="ubicacion">{{ ubicacion.latitud | number:'1.6-6' }}, {{ ubicacion.longitud | number:'1.6-6' }} · precisión ±{{ ubicacion.precision | number:'1.0-0' }} m</span>
              <span *ngIf="!ubicacion">Permite el acceso al GPS antes de capturar la evidencia.</span>
            </div>
            <button class="btn secondary" (click)="obtenerUbicacion()" [disabled]="obteniendoGps">
              {{ obteniendoGps ? 'Obteniendo...' : (ubicacion ? 'Actualizar GPS' : 'Obtener GPS') }}
            </button>
          </div>

          <div class="video-frame attendance-video" [class.ready]="stream && faceEngineReady">
            <video #video autoplay playsinline muted></video>

            <div
              class="face-guide"
              *ngIf="stream && !preview"
              [class.is-valid]="rostroEnGuia"
              [class.is-invalid]="faceEngineReady && !rostroEnGuia"
            >
              <span></span>
              <small>{{ rostroEnGuia ? '✓ Rostro correctamente encuadrado' : rostroMensaje }}</small>
            </div>

            <div class="camera-placeholder" *ngIf="!stream">
              <b>Cámara desactivada</b>
              <span>Actívela para encuadrar el rostro.</span>
            </div>
          </div>

          <canvas #canvas hidden></canvas>

          <div class="camera-actions attendance-camera-actions">
            <button class="btn secondary" (click)="iniciarCamara()" [disabled]="iniciandoCamara">
              {{ stream ? 'Reiniciar cámara' : (iniciandoCamara ? 'Activando...' : 'Activar cámara') }}
            </button>

            <button class="btn primary capture-face-btn" (click)="capturar()" [disabled]="!puedeCapturar() || validandoFoto">
              {{ validandoFoto ? 'Capturando...' : (rostroEnGuia ? 'Capturar ahora' : 'Centre el rostro') }}
            </button>
          </div>

          <div class="face-engine-state" [class.ok]="rostroEnGuia" [class.bad]="faceEngineError">
            <b *ngIf="rostroEnGuia">✓ Guía verde: manténgase quieto, la foto se capturará automáticamente</b>
            <b *ngIf="!rostroEnGuia && faceEngineReady && !faceEngineError">{{ rostroMensaje }}</b>
            <b *ngIf="!faceEngineReady && !faceEngineError">Inicializando detector facial...</b>
            <b *ngIf="faceEngineError">✕ Detector facial no disponible</b>
            <small *ngIf="faceEngineError">{{ faceEngineError }}</small>
          </div>

          <div class="photo-review" *ngIf="preview">
            <img [src]="preview" class="preview attendance-preview" alt="Vista previa de la evidencia" />
            <div class="photo-quality valid">
              <b>✓ Fotografía capturada</b>
              <span>{{ validacionMensaje }}</span>
              <small *ngIf="metricas">Rostro detectado {{ metricas.confianza | percent:'1.0-0' }} · correctamente encuadrado</small>
              <button class="btn ghost retake-photo-btn" type="button" (click)="repetirFoto()">Volver a tomar</button>
            </div>
          </div>
        </section>
      </div>

      <div class="attendance-final-card">
        <div>
          <b>Guardar asistencia y fotografía</b>
          <span *ngIf="!ready()">Complete personal, horario, GPS y capture la foto con la guía en verde.</span>
          <span *ngIf="ready()">✓ Todo listo. La fotografía se guardará junto con la fecha/hora oficial y ubicación GPS.</span>
        </div>
        <div class="mark-actions attendance-mark-actions">
          <button class="btn success" (click)="marcar('ENTRADA')" [disabled]="!ready() || marcando">
            Guardar ENTRADA
          </button>
          <button class="btn danger-btn" (click)="marcar('SALIDA')" [disabled]="!ready() || marcando">
            Guardar SALIDA
          </button>
        </div>
      </div>

      <div class="toast-msg" *ngIf="mensaje" [class.error-bg]="error">{{ mensaje }}</div>
    </div>
  `
})
export class RegistrarAsistenciaComponent implements OnInit, OnDestroy {
  @ViewChild('video') video!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  institution: InstitutionBrand | null = null;
  term = '';
  personas: any[] = [];
  personal: any = null;
  horarios: any[] = [];
  horarioId: any = null;
  stream: MediaStream | null = null;
  foto: Blob | null = null;
  preview = '';
  ubicacion: {latitud:number;longitud:number;precision:number} | null = null;
  servidor: any = null;
  mensaje = '';
  error = false;
  buscando = false;
  busquedaRealizada = false;
  horariosCargados = false;
  obteniendoGps = false;
  iniciandoCamara = false;
  validandoFoto = false;
  marcando = false;

  faceEngineReady = false;
  faceEngineError = '';
  rostroEnGuia = false;
  rostroMensaje = 'Ubique un solo rostro dentro de la guía.';
  fotoValida = false;
  validacionMensaje = 'La foto todavía no ha sido capturada.';
  metricas: {confianza:number;areaRostro:number} | null = null;

  private faceDetector: any = null;
  private faceLoop: ReturnType<typeof setInterval> | null = null;
  private evaluandoEnVivo = false;
  private rostroEstableFrames = 0;

  private readonly FACE_MIN_CONFIDENCE = 0.47;
  private readonly FACE_MIN_AREA = 0.045;
  private readonly FACE_MAX_AREA = 0.65;
  private readonly FACE_CENTER_X_MIN = 0.28;
  private readonly FACE_CENTER_X_MAX = 0.72;
  private readonly FACE_CENTER_Y_MIN = 0.24;
  private readonly FACE_CENTER_Y_MAX = 0.76;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private institutionService: InstitutionService
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('institucion');
    this.institution = this.institutionService.select(slug);
    if (!this.institution) {
      this.router.navigate(['/asistencia']);
      return;
    }

    this.cargarEstadoServidor();
    this.inicializarDetectorFacial();
  }

  cargarEstadoServidor(): void {
    this.http.get<any>(`${environment.apiUrl}/public/servidor/estado`).subscribe({
      next: r => this.servidor = r,
      error: () => this.servidor = null
    });
  }

  async inicializarDetectorFacial(): Promise<void> {
    try {
      this.faceEngineError = '';

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
      );

      this.faceDetector = await FaceDetector.createFromModelPath(
        vision,
        'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'
      );

      this.faceEngineReady = true;
      if (this.stream) this.iniciarSeguimientoRostro();
    } catch (e) {
      console.error('No se pudo iniciar MediaPipe Face Detector', e);
      this.faceEngineReady = false;
      this.faceEngineError = 'No se pudo cargar el detector. Verifique la conexión a internet y recargue la página.';
    }
  }

  buscar(): void {
    const q = this.term.trim();
    if (q.length < 2) return;

    this.buscando = true;
    this.busquedaRealizada = true;

    this.http.get<any[]>(`${environment.apiUrl}/public/personal/buscar`, {
      params: { q, institucion: this.institution?.slug || '' }
    }).subscribe({
      next: r => {
        this.personas = r;
        this.buscando = false;
      },
      error: e => {
        this.personas = [];
        this.buscando = false;
        this.setMsg(e.error?.message || 'No se pudo buscar personal.', true);
      }
    });
  }

  seleccionar(p: any): void {
    this.personal = p;
    this.horarioId = null;
    this.horarios = [];
    this.horariosCargados = false;
    this.invalidarFoto();

    this.http.get<any[]>(`${environment.apiUrl}/public/personal/${p.personal_id}/horarios-hoy`, {
      params: { institucion: this.institution?.slug || '' }
    }).subscribe({
      next: r => {
        this.horarios = r;
        this.horariosCargados = true;
      },
      error: e => {
        this.horarios = [];
        this.horariosCargados = true;
        this.setMsg(e.error?.message || 'No se pudo consultar el horario.', true);
      }
    });

    this.obtenerUbicacion();
  }

  async iniciarCamara(): Promise<void> {
    this.iniciandoCamara = true;

    try {
      this.detenerSeguimientoRostro();
      this.stream?.getTracks().forEach(t => t.stop());

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      this.video.nativeElement.srcObject = this.stream;
      await this.video.nativeElement.play();

      this.invalidarFoto();
      this.rostroEnGuia = false;
      this.rostroMensaje = 'Centre el rostro dentro de la guía.';

      if (this.faceEngineReady) this.iniciarSeguimientoRostro();
    } catch {
      this.stream = null;
      this.rostroEnGuia = false;
      this.setMsg('No se pudo acceder a la cámara. Revise el permiso del navegador.', true);
    } finally {
      this.iniciandoCamara = false;
    }
  }

  private iniciarSeguimientoRostro(): void {
    this.detenerSeguimientoRostro();

    this.faceLoop = setInterval(() => {
      this.validarRostroEnVivo();
    }, 150);
  }

  private detenerSeguimientoRostro(): void {
    if (this.faceLoop) {
      clearInterval(this.faceLoop);
      this.faceLoop = null;
    }
  }

  private async validarRostroEnVivo(): Promise<void> {
    if (
      this.evaluandoEnVivo ||
      this.validandoFoto ||
      !this.stream ||
      !this.faceEngineReady ||
      !this.faceDetector ||
      this.preview
    ) {
      return;
    }

    const video = this.video?.nativeElement;
    if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return;

    this.evaluandoEnVivo = true;
    let autoCapturar = false;

    try {
      const result = this.faceDetector.detect(video);
      const evaluacion = this.evaluarDetecciones(
        result?.detections || [],
        video.videoWidth,
        video.videoHeight
      );

      this.rostroEnGuia = evaluacion.valido;
      this.rostroMensaje = evaluacion.mensaje;

      if (evaluacion.metricas) {
        this.metricas = evaluacion.metricas;
      }

      if (evaluacion.valido) {
        this.rostroEstableFrames++;

        // Captura ágil: dos detecciones consecutivas (~300 ms).
        // Se mantiene la segunda verificación en el instante exacto de captura.
        if (
          this.rostroEstableFrames >= 2 &&
          !!this.ubicacion &&
          !!this.horarioId &&
          !this.foto &&
          !this.preview
        ) {
          autoCapturar = true;
          this.rostroEstableFrames = 0;
        }
      } else {
        this.rostroEstableFrames = 0;
      }
    } catch {
      this.rostroEnGuia = false;
      this.rostroEstableFrames = 0;
      this.rostroMensaje = 'No se pudo evaluar el rostro. Manténgase frente a la cámara.';
    } finally {
      this.evaluandoEnVivo = false;
    }

    if (autoCapturar) {
      await this.capturar(true);
    }
  }

  private evaluarDetecciones(
    detections: any[],
    width: number,
    height: number
  ): {
    valido: boolean;
    mensaje: string;
    metricas: {confianza:number;areaRostro:number} | null;
  } {
    if (detections.length === 0) {
      return {
        valido: false,
        mensaje: 'Ubique su rostro dentro de la guía.',
        metricas: null
      };
    }

    if (detections.length > 1) {
      return {
        valido: false,
        mensaje: 'Debe aparecer una sola persona.',
        metricas: null
      };
    }

    const detection = detections[0];
    const confianza = Number(detection.categories?.[0]?.score ?? 0);
    const box = detection.boundingBox;

    if (!box || !width || !height) {
      return {
        valido: false,
        mensaje: 'No se pudo encuadrar el rostro.',
        metricas: null
      };
    }

    const boxWidth = Number(box.width ?? 0);
    const boxHeight = Number(box.height ?? 0);
    const originX = Number(box.originX ?? 0);
    const originY = Number(box.originY ?? 0);

    const areaRostro = (boxWidth * boxHeight) / (width * height);
    const centerX = (originX + boxWidth / 2) / width;
    const centerY = (originY + boxHeight / 2) / height;

    const metricas = { confianza, areaRostro };

    if (confianza < this.FACE_MIN_CONFIDENCE) {
      return {
        valido: false,
        mensaje: 'Mire de frente a la cámara.',
        metricas
      };
    }

    if (areaRostro < this.FACE_MIN_AREA) {
      return {
        valido: false,
        mensaje: 'Acérquese un poco a la cámara.',
        metricas
      };
    }

    if (areaRostro > this.FACE_MAX_AREA) {
      return {
        valido: false,
        mensaje: 'Aléjese un poco de la cámara.',
        metricas
      };
    }

    const centrado =
      centerX >= this.FACE_CENTER_X_MIN &&
      centerX <= this.FACE_CENTER_X_MAX &&
      centerY >= this.FACE_CENTER_Y_MIN &&
      centerY <= this.FACE_CENTER_Y_MAX;

    if (!centrado) {
      return {
        valido: false,
        mensaje: 'Centre el rostro dentro de la guía.',
        metricas
      };
    }

    return {
      valido: true,
      mensaje: '✓ Rostro correctamente encuadrado.',
      metricas
    };
  }

  puedeCapturar(): boolean {
    return !!this.stream &&
      !!this.ubicacion &&
      !!this.horarioId &&
      this.faceEngineReady &&
      this.rostroEnGuia &&
      !this.preview;
  }

  async capturar(automatico = false): Promise<void> {
    if (!this.puedeCapturar()) {
      if (!automatico) this.setMsg('La foto solo puede tomarse cuando la guía del rostro esté en verde y tenga horario + GPS.', true);
      return;
    }

    this.validandoFoto = true;

    try {
      const video = this.video.nativeElement;

      // Segunda validación en el instante exacto de la captura.
      // Si el rostro salió de la guía, NO se genera ninguna fotografía.
      const result = this.faceDetector.detect(video);
      const evaluacion = this.evaluarDetecciones(
        result?.detections || [],
        video.videoWidth,
        video.videoHeight
      );

      this.rostroEnGuia = evaluacion.valido;
      this.rostroMensaje = evaluacion.mensaje;

      if (!evaluacion.valido || !evaluacion.metricas) {
        this.foto = null;
        this.fotoValida = false;
        this.metricas = evaluacion.metricas;
        this.setMsg('El rostro dejó de estar correctamente encuadrado. No se tomó ninguna foto.', true);
        return;
      }

      // Solo después de validar el encuadre se dibuja el frame en el canvas.
      const canvas = this.canvas.nativeElement;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Canvas no disponible');

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await this.canvasToBlob(canvas);

      this.foto = blob;
      this.metricas = evaluacion.metricas;

      if (this.preview) URL.revokeObjectURL(this.preview);
      this.preview = URL.createObjectURL(blob);
      this.fotoValida = true;
      this.rostroEnGuia = false;
      this.validacionMensaje = automatico
        ? 'Foto capturada automáticamente con el rostro bien encuadrado. Presione Guardar ENTRADA o Guardar SALIDA.'
        : 'Foto lista. Presione Guardar ENTRADA o Guardar SALIDA para almacenar la evidencia.';
    } catch (e) {
      console.error(e);
      this.foto = null;
      this.fotoValida = false;
      this.setMsg('No fue posible capturar la fotografía. Intente nuevamente.', true);
    } finally {
      this.validandoFoto = false;
    }
  }

  repetirFoto(): void {
    this.invalidarFoto();
    this.rostroEnGuia = false;
    this.rostroEstableFrames = 0;
    this.rostroMensaje = 'Centre el rostro dentro de la guía.';
  }

  private canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('No se pudo crear la foto')),
        'image/jpeg',
        0.9
      );
    });
  }

  obtenerUbicacion(): void {
    if (!navigator.geolocation) {
      this.setMsg('Este dispositivo no ofrece geolocalización.', true);
      return;
    }

    this.obteniendoGps = true;

    navigator.geolocation.getCurrentPosition(
      p => {
        this.ubicacion = {
          latitud: p.coords.latitude,
          longitud: p.coords.longitude,
          precision: p.coords.accuracy
        };
        this.obteniendoGps = false;
        this.invalidarFoto();
      },
      e => {
        this.ubicacion = null;
        this.obteniendoGps = false;
        this.invalidarFoto();
        this.setMsg(
          e.code === 1
            ? 'Debe permitir la ubicación para registrar asistencia.'
            : 'No se pudo obtener una ubicación válida. Intente nuevamente.',
          true
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  invalidarFoto(clearPreview = true): void {
    this.foto = null;
    this.fotoValida = false;
    this.rostroEstableFrames = 0;
    this.validacionMensaje = 'La foto todavía no ha sido capturada.';

    if (clearPreview && this.preview) {
      URL.revokeObjectURL(this.preview);
      this.preview = '';
    }
  }

  ready(): boolean {
    return !!this.personal &&
      !!this.horarioId &&
      !!this.foto &&
      this.fotoValida &&
      !!this.ubicacion &&
      this.faceEngineReady;
  }

  marcar(tipo: 'ENTRADA' | 'SALIDA'): void {
    if (!this.ready() || !this.metricas || !this.ubicacion) return;

    const fd = new FormData();
    fd.append('personal_id', String(this.personal.personal_id));
    fd.append('horario_personal_id', String(this.horarioId));
    fd.append('tipo', tipo);
    fd.append('institucion', this.institution?.slug || '');
    fd.append('foto', this.foto!, 'evidencia.jpg');
    fd.append('latitud', String(this.ubicacion.latitud));
    fd.append('longitud', String(this.ubicacion.longitud));
    fd.append('precision_gps', String(this.ubicacion.precision));
    fd.append('rostro_confianza', String(this.metricas.confianza));

    this.marcando = true;

    this.http.post<any>(`${environment.apiUrl}/public/asistencias/marcar`, fd).subscribe({
      next: r => {
        this.marcando = false;
        this.setMsg(`${r.message}. Hora oficial: ${r.hora_servidor}`, false);
        this.invalidarFoto();
        this.rostroEnGuia = false;
        this.rostroMensaje = 'Centre el rostro dentro de la guía.';
        this.cargarEstadoServidor();
      },
      error: e => {
        this.marcando = false;
        this.setMsg(this.validationError(e), true);
      }
    });
  }

  validationError(e: any): string {
    const errors = e?.error?.errors;
    if (errors) return Object.values(errors).flat().join(' · ');
    return e?.error?.message || 'No se pudo registrar la marcación.';
  }

  setMsg(message: string, isError: boolean): void {
    this.mensaje = message;
    this.error = isError;
    setTimeout(() => this.mensaje = '', 7000);
  }

  shortTime(value: any): string {
    return value ? String(value).substring(0, 5) : '-';
  }

  iniciales(person: any): string {
    return `${person?.nombres?.[0] || ''}${person?.apellidos?.[0] || ''}`.toUpperCase();
  }

  ngOnDestroy(): void {
    this.detenerSeguimientoRostro();
    this.stream?.getTracks().forEach(t => t.stop());

    if (this.preview) URL.revokeObjectURL(this.preview);

    try {
      this.faceDetector?.close?.();
    } catch {}
  }
}
