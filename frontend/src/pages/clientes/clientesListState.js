export const CLIENTES_LIST_STATE_KEY = 'adminisgo.clientes.listState'

export function readClientesListState() {
  try {
    const raw = sessionStorage.getItem(CLIENTES_LIST_STATE_KEY)
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

export function writeClientesListState(state) {
  try {
    sessionStorage.setItem(
      CLIENTES_LIST_STATE_KEY,
      JSON.stringify({
        searchTerm: state?.searchTerm || '',
        currentPage: Number(state?.currentPage) > 0 ? Number(state.currentPage) : 1,
      }),
    )
  } catch {
    /* ignore quota / private mode */
  }
}
