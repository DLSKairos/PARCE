// Calcula el costo de un pedido basado en recetas — lógica determinista, sin IA
export function calculateItemCost(
  recipeItems: { quantity: number; ingredient: { costPerUnit: number } }[],
): number {
  return recipeItems.reduce((total, item) => {
    return total + Number(item.quantity) * Number(item.ingredient.costPerUnit)
  }, 0)
}
