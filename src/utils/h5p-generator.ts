import type { Content } from 'src/sections/editor/types';

// ----------------------------------------------------------------------

export async function generateH5PPackage(_title: string, _content: Content[]): Promise<Blob> {
  throw new Error('H5P-Generator nicht verfügbar');
}

export function downloadH5PPackage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.h5p`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
