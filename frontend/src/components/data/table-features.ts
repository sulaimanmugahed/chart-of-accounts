/**
 * مجموعات خصائص TanStack Table v9 (Feature Bundles).
 *
 * في الإصدار 9 أصبحت خصائص الجدول إضافات (plugins) صريحة، ويجب تعريفها خارج
 * المكوّن (module scope) للحفاظ على ثبات مراجع الأعمدة ونماذج الصفوف.
 */
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createExpandedRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
} from '@tanstack/react-table'

/** جدول مسطّح: فرز، فلترة عمودية، بحث عام، ترقيم، إظهار/إخفاء الأعمدة */
export const clientTableFeatures = tableFeatures({
  rowSortingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  columnVisibilityFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
})

/** جدول شجري: كل ما سبق + توسيع الصفوف الفرعية (شجرة الحسابات) */
export const treeTableFeatures = tableFeatures({
  rowSortingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  columnVisibilityFeature,
  rowExpandingFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  expandedRowModel: createExpandedRowModel(),
})
