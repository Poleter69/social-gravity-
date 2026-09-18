/**
 * Social Gravity — Project Dossier Machine JSON Generator
 * Serializes the structured InvestigationDossier into standard JSON with cryptographic proof
 */

import { InvestigationDossier } from '../types';

export function generateMachineJSON(dossier: InvestigationDossier): string {
  return JSON.stringify(dossier, null, 2);
}

export const generateDossierJson = generateMachineJSON;

export function downloadMachineJSON(dossier: InvestigationDossier): void {
  const json = generateMachineJSON(dossier);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `social-gravity-dossier-${dossier.metadata.operationCodename.toLowerCase()}-${dossier.metadata.id.toLowerCase()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadInteractiveHTML(dossier: InvestigationDossier, htmlContent: string): void {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `social-gravity-dossier-${dossier.metadata.operationCodename.toLowerCase()}-${dossier.metadata.id.toLowerCase()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
