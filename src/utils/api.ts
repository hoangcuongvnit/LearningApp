const API_URL = 'https://apis.aznetviet.xyz' // from BE-README; adjust if needed

export async function graphql(query: string, variables?: any, token?: string) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    },
    body: JSON.stringify({ query, variables })
  })

  const json = await res.json()
  if (json.errors) {
    throw new Error(json.errors.map((e: any) => e.message).join('\n'))
  }
  return json.data
}

export default { graphql }
