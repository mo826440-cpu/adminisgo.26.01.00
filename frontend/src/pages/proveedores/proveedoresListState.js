export const PROVEEDORES_LIST_STATE_KEY = 'adminisgo.proveedores.listState'

export function readProveedoresListState() {
  try {
    const raw = sessionStorage.getItem(PROVEEDORES_LIST_STATE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      searchTerm: typeof parsed.searchTerm === 'string' ? parsed.searchTerm : '',
      currentPage: Number(parsed.currentPage) > 0 ? Number(parsed.currentPage) : 1,
    }
  } catch {
    return null
  }
}

export function writeProveedoresListState(state) {
  try {
    sessionStorage.setItem(
      PROVEEDORES_LIST_STATE_KEY,
      JSON.stringify({
        searchTerm: state?.searchTerm || '',
        currentPage: Number(state?.currentPage) > 0 ? Number(state.currentPage) : 1,
      }),
    )
  } catch {
    /* ignore quota / private mode */
  }
}
