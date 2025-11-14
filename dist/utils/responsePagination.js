const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export default function responsePaginated(res, code, message, allItems, pageRaw, pageSizeRaw, totalItemsOverride, errorCode, errors) {
    const pageSize = Math.max(1, Number(pageSizeRaw) || 10);
    const totalItems = Number.isFinite(totalItemsOverride)
        ? Number(totalItemsOverride)
        : allItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const page = clamp(Number(pageRaw) || 1, 1, totalPages);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = Number.isFinite(totalItemsOverride)
        ? allItems
        : allItems.slice(start, end);
    const hasPrev = page > 1;
    const hasNext = page < totalPages;
    const pageInfo = {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasPrev,
        hasNext,
        prevPage: hasPrev ? page - 1 : null,
        nextPage: hasNext ? page + 1 : null,
    };
    return res.status(code).json({
        message,
        data: { ...pageInfo, items },
        errorCode: errorCode ?? null,
        errors: errors ?? null,
    });
}
