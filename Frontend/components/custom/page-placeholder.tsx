type Props = {
  title: string
  subtitle?: string
  /** Lista opcional de funcionalidades planeadas, para que la página
   *  comunique qué irá ahí cuando se implemente. */
  todos?: readonly string[]
}

/**
 * Placeholder de página durante scaffolding. Cuando se implemente la feature
 * real, se reemplaza el contenido y se borra este componente del archivo.
 */
export function PagePlaceholder({ title, subtitle, todos }: Props) {
  return (
    <section className="container mx-auto px-4 py-10">
      <h1 className="h1 text-foreground">{title}</h1>
      {subtitle && <p className="body mt-2 text-muted-foreground">{subtitle}</p>}
      {todos && todos.length > 0 && (
        <ul className="small mt-6 list-disc space-y-1 pl-6 text-muted-foreground">
          {todos.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
