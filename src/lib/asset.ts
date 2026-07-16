/** Prefix a public/ path with the deploy base (/neural-chalchitra/). */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`
