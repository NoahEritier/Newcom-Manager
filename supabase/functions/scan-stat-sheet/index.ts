// Edge Function: recibe la URL pública de la foto de UNA página de planilla
// (un jugador, un partido) y devuelve, para cada una de las 12 filas de
// estadística, el índice del casillero marcado (o null si no se pudo leer
// con confianza — SIEMPRE se revisa a mano en la app, esto es solo una
// sugerencia inicial, nunca la fuente de verdad final).
//
// Requiere los secrets AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION
// configurados en el proyecto de Supabase (`supabase secrets set ...`). La
// cuenta de AWS solo necesita permiso para `textract:AnalyzeDocument`.
//
// El orden de las 12 filas (STAT_FIELD_ORDER) tiene que coincidir siempre
// con src/utils/statFields.ts y con el orden de filas de la planilla PDF
// (src/utils/statSheetPdf.ts) — si se reordena una, hay que reordenar las 3.
//
// NOTA: el umbral de agrupamiento por fila (ROW_CLUSTER_THRESHOLD) es una
// estimación inicial sin validar contra fotos reales — hay que ajustarlo
// una vez que se prueble con planillas escaneadas de verdad.

import { AnalyzeDocumentCommand, TextractClient } from 'npm:@aws-sdk/client-textract@3';
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';

const STAT_FIELD_ORDER = [
  'serve_total',
  'serve_aces',
  'serve_errors',
  'reception_good',
  'reception_regular',
  'reception_bad',
  'attack_total',
  'attack_points',
  'attack_errors',
  'double_touch_faults',
  'invasion_faults',
  'flecha_faults',
];

const ROW_CLUSTER_THRESHOLD = 0.015; // fracción de la altura de página (0..1)

type Mark = { top: number; left: number; selected: boolean };

type RowResult = {
  key: string;
  recognizedValue: number | null;
  ambiguous: boolean;
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

function clusterIntoRows(marks: Mark[]): Mark[][] {
  const sorted = [...marks].sort((a, b) => a.top - b.top);
  const rows: Mark[][] = [];
  for (const mark of sorted) {
    const row = rows.find((r) => Math.abs(r[0].top - mark.top) < ROW_CLUSTER_THRESHOLD);
    if (row) row.push(mark);
    else rows.push([mark]);
  }
  rows.sort((a, b) => a[0].top - b[0].top);
  return rows;
}

function resolveRow(key: string, marks: Mark[] | undefined): RowResult {
  if (!marks || marks.length === 0) {
    return { key, recognizedValue: null, ambiguous: true };
  }
  const sortedByX = [...marks].sort((a, b) => a.left - b.left);
  const selectedIndexes = sortedByX
    .map((m, index) => (m.selected ? index : -1))
    .filter((index) => index >= 0);

  if (selectedIndexes.length === 1) {
    return { key, recognizedValue: selectedIndexes[0], ambiguous: false };
  }
  return { key, recognizedValue: null, ambiguous: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }

  try {
    const { imageUrl } = await req.json();
    if (!imageUrl || typeof imageUrl !== 'string') {
      return new Response(JSON.stringify({ error: 'Falta imageUrl' }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return new Response(JSON.stringify({ error: 'No pudimos descargar la imagen.' }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    }
    const imageBytes = new Uint8Array(await imageResponse.arrayBuffer());

    const textract = new TextractClient({
      region: Deno.env.get('AWS_REGION') ?? 'us-east-1',
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') ?? '',
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') ?? '',
      },
    });

    const result = await textract.send(
      new AnalyzeDocumentCommand({
        Document: { Bytes: imageBytes },
        FeatureTypes: ['FORMS'],
      })
    );

    const marks: Mark[] = (result.Blocks ?? [])
      .filter((b) => b.BlockType === 'SELECTION_ELEMENT')
      .map((b) => ({
        top: b.Geometry?.BoundingBox?.Top ?? 0,
        left: b.Geometry?.BoundingBox?.Left ?? 0,
        selected: b.SelectionStatus === 'SELECTED',
      }));

    const rows = clusterIntoRows(marks);
    const results: RowResult[] = STAT_FIELD_ORDER.map((key, index) => resolveRow(key, rows[index]));

    return new Response(JSON.stringify({ rows: results }), {
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    });
  }
});
