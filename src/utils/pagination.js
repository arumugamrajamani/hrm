const config = require('../config');

class CursorPagination {
    static encodeCursor(data) {
        try {
            const jsonStr = JSON.stringify(data);
            return Buffer.from(jsonStr).toString('base64url');
        } catch (error) {
            throw new Error('Failed to encode cursor');
        }
    }

    static decodeCursor(cursor) {
        try {
            if (!cursor) return null;
            
            const jsonStr = Buffer.from(cursor, 'base64url').toString('utf8');
            return JSON.parse(jsonStr);
        } catch (error) {
            throw new Error('Invalid cursor');
        }
    }

    static buildCursor(params) {
        const { sortBy, sortOrder = 'ASC', lastValue, lastId } = params;
        
        return this.encodeCursor({
            sortBy,
            sortOrder,
            lastValue,
            lastId,
            timestamp: Date.now()
        });
    }

    static async paginateWithCursor(options) {
        const {
            query,
            countQuery,
            params = [],
            cursor,
            limit = 10,
            maxLimit = 100,
            sortBy = 'id',
            sortOrder = 'ASC'
        } = options;

        const actualLimit = Math.min(limit, maxLimit);
        let queryParams = [...params];
        let whereClause = 'WHERE 1=1';

        if (cursor) {
            const decodedCursor = this.decodeCursor(cursor);
            
            if (decodedCursor) {
                const { lastValue, lastId, sortBy: cursorSortBy, sortOrder: cursorSortOrder } = decodedCursor;
                
                const comparison = cursorSortOrder === 'ASC' ? '>' : '<';
                const orderPart = cursorSortOrder || sortOrder;
                
                if (lastValue !== undefined && lastValue !== null) {
                    whereClause += ` AND (
                        (${cursorSortBy || sortBy} ${comparison} ?) OR
                        (${cursorSortBy || sortBy} = ? AND id ${comparison} ?)
                    )`;
                    queryParams.push(lastValue, lastValue, lastId);
                } else if (lastId !== undefined) {
                    whereClause += ` AND id ${comparison} ?`;
                    queryParams.push(lastId);
                }
            }
        }

        const orderDirection = sortOrder === 'DESC' ? 'DESC' : 'ASC';
        const paginatedQuery = query
            .replace('WHERE', whereClause)
            .replace(/ORDER BY.*?LIMIT/gi, `ORDER BY ${sortBy} ${orderDirection}, id ${orderDirection} LIMIT`);

        const finalQuery = `${paginatedQuery} LIMIT ?`;
        queryParams.push(actualLimit + 1);

        return { query: finalQuery, params: queryParams, limit: actualLimit };
    }

    static async getPaginatedResults(options) {
        const { pool, ...paginationOptions } = options;
        const { query, params, limit } = await this.paginateWithCursor(paginationOptions);

        const [rows] = await pool.execute(query, params);
        
        const hasMore = rows.length > limit;
        const data = hasMore ? rows.slice(0, limit) : rows;

        let nextCursor = null;
        let prevCursor = null;

        if (hasMore && data.length > 0) {
            const lastItem = data[data.length - 1];
            nextCursor = this.buildCursor({
                sortBy: paginationOptions.sortBy,
                sortOrder: paginationOptions.sortOrder,
                lastValue: lastItem[paginationOptions.sortBy],
                lastId: lastItem.id
            });
        }

        if (paginationOptions.cursor) {
            const decodedPrev = this.decodeCursor(paginationOptions.cursor);
            if (decodedPrev) {
                prevCursor = paginationOptions.cursor;
            }
        }

        return {
            data,
            pagination: {
                hasNextPage: hasMore,
                hasPrevPage: !!paginationOptions.cursor,
                nextCursor,
                prevCursor,
                limit,
                count: data.length
            }
        };
    }
}

class OffsetPagination {
    static paginate(page = 1, limit = 10, maxLimit = 100) {
        const actualPage = Math.max(1, parseInt(page) || 1);
        const actualLimit = Math.min(Math.max(1, parseInt(limit) || 10), maxLimit);
        const offset = (actualPage - 1) * actualLimit;

        return {
            page: actualPage,
            limit: actualLimit,
            offset
        };
    }

    static buildMeta({ page, limit, total, count }) {
        const totalPages = Math.ceil(total / limit);
        
        return {
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null
            },
            count
        };
    }

    static getPageNumbers(currentPage, totalPages, maxButtons = 7) {
        if (totalPages <= maxButtons) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages = [];
        const half = Math.floor(maxButtons / 2);
        let start = Math.max(1, currentPage - half);
        let end = Math.min(totalPages, start + maxButtons - 1);

        if (end - start + 1 < maxButtons) {
            start = Math.max(1, end - maxButtons + 1);
        }

        if (start > 1) {
            pages.push(1);
            if (start > 2) pages.push('...');
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (end < totalPages) {
            if (end < totalPages - 1) pages.push('...');
            pages.push(totalPages);
        }

        return pages;
    }
}

const createPaginatedResponse = (data, pagination, message = 'Success') => {
    return {
        success: true,
        message,
        data,
        meta: pagination
    };
};

const createCursorPaginatedResponse = (data, pagination, message = 'Success') => {
    return {
        success: true,
        message,
        data,
        ...pagination
    };
};

module.exports = {
    CursorPagination,
    OffsetPagination,
    createPaginatedResponse,
    createCursorPaginatedResponse
};
