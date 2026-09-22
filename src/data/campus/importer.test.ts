import { describe, expect, it } from 'vitest';
import {
  IMPORT_TEMPLATES,
  parseEdgesCsv,
  parseLocationsCsv,
  parseNodesCsv,
} from './importer';
import { getBundledDataset, locationNameIn, nodeIdForLocationIn } from './loader';
import { validateCampusDataset } from './validator';

describe('campus import utilities', () => {
  it('parses the documented CSV templates', () => {
    const locs = parseLocationsCsv(IMPORT_TEMPLATES.locations);
    const nodes = parseNodesCsv(IMPORT_TEMPLATES.nodes);
    const edges = parseEdgesCsv(IMPORT_TEMPLATES.edges);
    expect(locs).toHaveLength(1);
    expect(locs[0]).toMatchObject({ id: 'LIBRARY', mapX: 500, mapY: 180 });
    expect(nodes).toHaveLength(1);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ from: 'NODE_GATE', distanceMeters: 180 });
  });

  it('rejects bad CSV headers with actionable messages', () => {
    expect(() => parseLocationsCsv('foo,bar\n1,2')).toThrow(/locations\.csv header/);
    expect(() => parseNodesCsv('a,b\n1,2')).toThrow(/nodes\.csv header/);
    expect(() => parseEdgesCsv('a,b\n1,2')).toThrow(/edges\.csv header/);
  });

  it('bundled dataset accessors resolve the 3 demo locations', () => {
    const d = getBundledDataset();
    expect(nodeIdForLocationIn(d, 'MAIN_GATE')).toBe('NODE_GATE');
    expect(locationNameIn(d, 'LIBRARY')).toBe('Library');
    expect(validateCampusDataset(d).valid).toBe(true);
  });
});
