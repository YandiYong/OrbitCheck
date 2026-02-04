export function generateInstances(item: any): any[] {
  const instances: any[] = [];
  const perSize = Array.isArray(item?.items) ? item.items : undefined;
  const legacyVariants = Array.isArray(item?.variants) ? item.variants : undefined;

  if (Array.isArray(perSize) && perSize.length) {
    for (let vi = 0; vi < perSize.length; vi++) {
      const v = perSize[vi];
      instances.push({
        ...item,
        id: (item.id ?? 0) * 1000 + vi,
        expiryDate: v?.expiryDate ?? null,
        name: item.name,
        description: v?.description ?? v?.size ?? null,
        _itemIndex: vi
      });
    }
  } else if (Array.isArray(legacyVariants) && legacyVariants.length) {
    for (let vi = 0; vi < legacyVariants.length; vi++) {
      const v = legacyVariants[vi];
      instances.push({
        ...item,
        id: (item.id ?? 0) * 1000 + vi,
        expiryDate: v?.expiryDate ?? null,
        name: item.name,
        description: v?.description ?? null,
        _variantIndex: vi
      });
    }
  } else {
    instances.push({
      ...item,
      id: (item.id ?? 0) * 1000 + 0,
      expiryDate: item.expiryDate ?? null,
      name: item.name,
      description: null
    });
  }

  return instances;
}
