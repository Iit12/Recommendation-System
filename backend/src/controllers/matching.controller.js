/**
 * Phase 4 Matching Controller
 * Handles incoming NLP matching search requests.
 */

import { matchingService } from '../matching/matching.service.js';
import { SUPPORTED_PLATFORM_IDS } from '../collectors/index.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const matchingController = {
  /**
   * GET /api/v1/matching/search?q=<query>&platforms=<optional_comma_separated_list>
   */
  async searchAndMatch(req, res, next) {
    try {
      const { q: query, platforms: platformsParam } = req.query;

      // 1. Validate missing or empty query
      if (!query || typeof query !== 'string' || !query.trim()) {
        return sendError(
          res,
          'MISSING_SEARCH_QUERY',
          'Search query parameter "q" is required and cannot be empty.',
          400
        );
      }

      const cleanQuery = query.trim();

      // 2. Validate query length
      if (cleanQuery.length < 2) {
        return sendError(
          res,
          'INVALID_QUERY',
          'Search query must be at least 2 characters long.',
          400
        );
      }

      // 3. Parse and validate platform filter if provided
      let requestedPlatforms = [];
      if (platformsParam && typeof platformsParam === 'string') {
        requestedPlatforms = platformsParam
          .split(',')
          .map((p) => p.trim().toLowerCase())
          .filter(Boolean);

        // Check for unsupported platform IDs
        const unsupported = requestedPlatforms.filter(
          (p) => !SUPPORTED_PLATFORM_IDS.includes(p)
        );

        if (unsupported.length > 0) {
          return sendError(
            res,
            'UNSUPPORTED_PLATFORM',
            `Unsupported platform(s): ${unsupported.join(', ')}. Supported platforms are: ${SUPPORTED_PLATFORM_IDS.join(', ')}.`,
            400,
            { supportedPlatforms: SUPPORTED_PLATFORM_IDS, unsupported }
          );
        }
      }

      // 4. Run matching service pipeline
      const result = await matchingService.searchAndGroup(cleanQuery, requestedPlatforms);

      return sendSuccess(res, result.groups, {
        query: result.query,
        collectedAt: result.collectedAt,
        platformsRequested: result.platformsRequested,
        platformsSuccessful: result.platformsSuccessful,
        totalListings: result.totalListings,
        totalProductGroups: result.totalProductGroups,
        groups: result.groups,
      });
    } catch (error) {
      next(error);
    }
  }
};
