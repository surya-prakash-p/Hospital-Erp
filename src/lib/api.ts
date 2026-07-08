// Thin Frappe REST client. All calls go through the Vite/Express proxy at /api.
// Frappe resource API: GET/POST /api/resource/<DocType>, PUT /api/resource/<DocType>/<name>

async function frappe<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    ...init,
  })
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`
    try {
      const body = await res.json()
      msg = body.exception || body.message || body._server_messages || msg
    } catch {
      /* non-JSON error body */
    }
    throw new Error(String(msg))
  }
  return res.json()
}

export async function login(usr: string, pwd: string): Promise<void> {
  await frappe("method/login", {
    method: "POST",
    body: JSON.stringify({ usr, pwd }),
  })
}

export async function getList<T>(doctype: string, orderBy = "creation desc"): Promise<T[]> {
  const params = new URLSearchParams({
    fields: '["*"]',
    limit_page_length: "200",
    order_by: orderBy,
  })
  const { data } = await frappe<{ data: T[] }>(
    `resource/${encodeURIComponent(doctype)}?${params}`
  )
  return data
}

export async function insertDoc<T>(doctype: string, doc: object): Promise<T> {
  const { data } = await frappe<{ data: T }>(`resource/${encodeURIComponent(doctype)}`, {
    method: "POST",
    body: JSON.stringify(doc),
  })
  return data
}

export async function updateDoc<T>(doctype: string, name: string, doc: object): Promise<T> {
  const { data } = await frappe<{ data: T }>(
    `resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    { method: "PUT", body: JSON.stringify(doc) }
  )
  return data
}
