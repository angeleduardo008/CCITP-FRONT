import { Injectable, signal } from '@angular/core';

export type InstitutionSlug = 'ccitp' | 'divertimundo' | 'pitagoras';

export interface InstitutionBrand {
  slug: InstitutionSlug;
  name: string;
  shortName: string;
  type: string;
  subtitle: string;
  logo: string;
  className: string;
  accent: string;
  accentDark: string;
}

const INSTITUTIONS: InstitutionBrand[] = [
  {
    slug: 'ccitp',
    name: 'CCITP',
    shortName: 'CCITP',
    type: 'CETPRO',
    subtitle: 'Centro Técnico Productivo de la Amazonía',
    logo: '/logos/ccitp.png',
    className: 'theme-ccitp',
    accent: '#1458a6',
    accentDark: '#0d3f78'
  },
  {
    slug: 'divertimundo',
    name: 'Divertimundo',
    shortName: 'DIVERTIMUNDO',
    type: 'GUARDERÍA',
    subtitle: 'Guardería Divertimundo',
    logo: '/logos/divertimundo.svg',
    className: 'theme-divertimundo',
    accent: '#2f9b78',
    accentDark: '#17634f'
  },
  {
    slug: 'pitagoras',
    name: 'Pitágoras School',
    shortName: 'PITÁGORAS',
    type: 'ESCUELA',
    subtitle: 'Institución Educativa Pitágoras School',
    logo: '/logos/pitagoras-school.png',
    className: 'theme-pitagoras',
    accent: '#159ec2',
    accentDark: '#25265f'
  }
];

@Injectable({ providedIn: 'root' })
export class InstitutionService {
  readonly institutions = INSTITUTIONS;
  readonly selected = signal<InstitutionBrand | null>(this.readStored());

  select(slug: string | null | undefined): InstitutionBrand | null {
    const institution = this.get(slug);
    if (institution) {
      localStorage.setItem('institucion', institution.slug);
      this.selected.set(institution);
    }
    return institution;
  }

  get(slug: string | null | undefined): InstitutionBrand | null {
    if (!slug) return null;
    return INSTITUTIONS.find(i => i.slug === slug.toLowerCase()) ?? null;
  }

  findByName(name: string | null | undefined): InstitutionBrand | null {
    if (!name) return null;
    const value = this.normalize(name);
    return INSTITUTIONS.find(i => {
      const candidates = [i.name, i.shortName, i.subtitle, i.slug];
      return candidates.some(candidate => {
        const normalized = this.normalize(candidate);
        return normalized.includes(value) || value.includes(normalized);
      });
    }) ?? null;
  }

  selectByName(name: string | null | undefined): InstitutionBrand | null {
    const institution = this.findByName(name);
    return institution ? this.select(institution.slug) : null;
  }

  clear(): void {
    localStorage.removeItem('institucion');
    this.selected.set(null);
  }

  private readStored(): InstitutionBrand | null {
    try {
      return this.get(localStorage.getItem('institucion'));
    } catch {
      return null;
    }
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }
}
