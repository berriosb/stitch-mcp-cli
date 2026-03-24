const mockDb = {
  prepare: () => ({
    run: () => ({ changes: 0, lastInsertRowid: 0 }),
    get: () => null,
    all: () => [],
  }),
  exec: () => {},
  close: () => {},
  pragma: () => [],
};

export default function Database() {
  return mockDb;
}