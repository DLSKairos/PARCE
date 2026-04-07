export function RestaurantNotFoundPage() {
  return (
    <div className="min-h-screen bg-azul-noche flex flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl mb-4">🍕</p>
      <h1 className="font-display text-crema text-3xl font-light italic mb-2">
        Restaurante no encontrado
      </h1>
      <p className="font-body text-texto-tenue">
        El link que usaste no corresponde a ningún restaurante activo en Parce.
      </p>
      <p className="font-body text-texto-tenue text-sm mt-4">by Kairos DLS Group S.A.S</p>
    </div>
  )
}
