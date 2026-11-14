export const PROVEEDORES_LIST_STATE_KEY = 'adminisgo.proveedores.listState'

const DEFAULTS = {
  searchTerm: '',
  currentPage: 1,
  pageSize: 100,
  filtroDeuda: 'todos',
  filtroEstado: 'activos',
  orden: 'nombre',
  scrollY: 0,
}

export function readProveedoresListState() {
  try {
    const raw = sessionStorage.getItem(PROVEEDORES_LIST_STATE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw)
    const pageSize = [25, 50, 100].includes(Number(parsed.pageSize)) ? Number(parsed.pageSize) : 100
    const filtroDeuda = ['todos', 'con_deuda', 'sin_deuda'].includes(parsed.filtroDeuda)
      ? parsed.filtroDeuda
      : 'todos'
    const filtroEstado = ['todos', 'activos', 'inactivos'].includes(parsed.filtroEstado)
      ? parsed.filtroEstado
      : 'activos'
    const orden = parsed.orden === 'deuda' ? 'deuda' : 'nombre'
    return {
      searchTerm: typeof parsed.searchTerm === 'string' ? parsed.searchTerm : '',
      currentPage: Number(parsed.currentPage) > 0 ? Number(parsed.currentPage) : 1,
      pageSize,
      filtroDeuda,
      filtroEstado,
      orden,
      scrollY: Number(parsed.scrollY) > 0 ? Number(parsed.scrollY) : 0,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function writeProveedoresListState(state) {
  try {
    const prev = readProveedoresListState()
    sessionStorage.setItem(
      PROVEEDORES_LIST_STATE_KEY,
      JSON.stringify({
        ...prev,
        ...state,
      }),
    )
  } catch {
    /* ignore quota / private mode */
  }
}
