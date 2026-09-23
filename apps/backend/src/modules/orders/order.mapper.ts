import type { PublicEntitlement, PublicOrder, PublicOrderItem } from '@photography/types';
import type { PublicAlbumAsset } from '@photography/types';
import { Order } from './entities/order.entity';
import { Entitlement } from './entities/entitlement.entity';

export function toPublicOrderItem(item: Order['items'][number]): PublicOrderItem {
  return {
    id: item.id,
    albumId: item.albumId,
    albumTitle: item.albumTitle,
    pricingName: item.pricingName,
    licenseType: item.licenseType,
    unitPriceCents: item.unitPriceCents,
  };
}

export function toPublicOrder(order: Order): PublicOrder {
  return {
    id: order.id,
    invoiceNumber: order.invoiceNumber,
    status: order.status,
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    couponCents: order.couponCents,
    taxCents: order.taxCents,
    totalCents: order.totalCents,
    currency: order.currency,
    couponCode: order.couponCode,
    items: (order.items ?? []).map(toPublicOrderItem),
    paidAt: order.paidAt?.toISOString() ?? null,
    refundedAt: order.refundedAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
  };
}

export function toPublicEntitlement(
  entitlement: Entitlement,
  assets: PublicAlbumAsset[],
): PublicEntitlement {
  return {
    id: entitlement.id,
    albumId: entitlement.albumId,
    albumTitle: entitlement.album?.title ?? '',
    albumSlug: entitlement.album?.slug ?? '',
    licenseType: entitlement.licenseType,
    downloadLimit: entitlement.downloadLimit,
    downloadsUsed: entitlement.downloadsUsed,
    downloadsRemaining: entitlement.downloadsRemaining,
    includesRaw: entitlement.includesRaw,
    expiresAt: entitlement.expiresAt?.toISOString() ?? null,
    isActive: entitlement.isUsable,
    assets,
    createdAt: entitlement.createdAt.toISOString(),
  };
}
