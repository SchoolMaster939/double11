
import {
  fetchMe,
  loginAccount,
  logoutAccount,
  readToken,
  registerAccount,
  writeToken,
  type MeResult,
  type User,
} from './api'

export interface SessionState {
  user: User | null
  restoring: boolean
}

type Listener = (state: SessionState) => void

let state: SessionState = { user: null, restoring: false }
const listeners = new Set<Listener>()

function emit(): void {
  for (const listener of listeners) listener(state)
}

function setState(patch: Partial<SessionState>): void {
  state = { ...state, ...patch }
  emit()
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  listener(state)
  return () => listeners.delete(listener)
}

export function getSession(): SessionState {
  return state
}

export function getUser(): User | null {
  return state.user
}

function toUser(me: MeResult): User {
  return {
    id: me.id,
    account: me.account,
    name: me.name,
    avatar: me.avatar,
    created_at: me.created_at,
  }
}

export async function restoreSession(): Promise<void> {
  if (!readToken()) return

  setState({ restoring: true })
  try {
    const me = await fetchMe()
    setState({ user: toUser(me) })
  } catch {
    writeToken(null)
    setState({ user: null })
  } finally {
    setState({ restoring: false })
  }
}

export async function register(account: string, password: string, name: string): Promise<void> {
  const result = await registerAccount(account, password, name)
  writeToken(result.token)
  setState({ user: result.user })
}

export async function login(account: string, password: string): Promise<void> {
  const result = await loginAccount(account, password)
  writeToken(result.token)
  setState({ user: result.user })
}

export async function logout(): Promise<void> {
  try {
    await logoutAccount()
  } catch {
  }
  writeToken(null)
  setState({ user: null })
}
