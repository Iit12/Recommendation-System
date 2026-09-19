/**
 * Live Search Controller
 * 
 * Handles authorized live search requests and live source health checks.
 * Supports query validation, geographic coordinates (lat/lon), platform filtering,
 * and structured multi-source aggregation.
 */

import { liveSourceManager } from '../collectors/liveSourceManager.js';

export const liveSearchController = {
  /**
   * Search live sources for query
   * GET /api/v1/live-search?q=iphone%2016&lat=12.9021&lon=77.6639&platforms=quickcommerce,amazon
   */
  async search(req, res) {
    try {
      const query = req.query.q || req.query.query;

      if (!query || !String(query).trim()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_QUERY',
            message: 'Query parameter "q" is required and cannot be empty.',
          },
        });
      }

      // Location parameters
      let lat = req.query.lat !== undefined ? Number(req.query.lat) : null;
      let lon = req.query.lon !== undefined ? Number(req.query.lon) : null;
      const pincode = req.query.pincode ? String(req.query.pincode).trim() : null;

      const locationProvided = lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon);

      // Validate coordinate bounds if coordinates are supplied
      if (req.query.lat !== undefined || req.query.lon !== undefined) {
        if (!locationProvided) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_LOCATION',
              message: 'Both "lat" and "lon" must be valid numeric coordinates.',
            },
          });
        }
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'COORDINATES_OUT_OF_BOUNDS',
              message: `Latitude must be between -90 and 90, and longitude between -180 and 180. (Received: lat=${lat}, lon=${lon})`,
            },
          });
        }
      }

      const platformsParam = req.query.platforms || req.query.platform;
      const platforms = platformsParam
        ? String(platformsParam).split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;

      const sourcesParam = req.query.sources || req.query.source;
      const sources = sourcesParam
        ? String(sourcesParam).split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;

      const limit = Number(req.query.limit) || 10;

      const liveResult = await liveSourceManager.search(query, {
        sources,
        platforms,
        limit,
        lat: locationProvided ? lat : undefined,
        lon: locationProvided ? lon : undefined,
        pincode: pincode || undefined,
      });

      return res.status(200).json({
        success: true,
        query: liveResult.query,
        mode: liveResult.mode,
        location: {
          provided: locationProvided,
          lat: locationProvided ? lat : null,
          lon: locationProvided ? lon : null,
          pincode: pincode || null,
        },
        requestedSources: liveResult.requestedSources,
        successfulSources: liveResult.successfulSources,
        failedSources: liveResult.failedSources,
        totalListings: liveResult.totalListings,
        sources: liveResult.sources,
        results: liveResult.results,
        collectedAt: liveResult.collectedAt,
      });
    } catch (err) {
      console.error('[LiveSearchController] Error executing live search:', err.message);
      return res.status(500).json({
        success: false,
        error: {
          code: 'LIVE_SEARCH_FAILED',
          message: 'An error occurred while executing live data search.',
        },
      });
    }
  },

  /**
   * Health status of all registered live sources
   * GET /api/v1/live-search/health
   */
  async getHealth(req, res) {
    try {
      const health = await liveSourceManager.healthCheckAll();
      return res.status(200).json({
        success: true,
        health,
      });
    } catch (err) {
      console.error('[LiveSearchController] Health check failed:', err.message);
      return res.status(500).json({
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: 'Failed to inspect live sources health.',
        },
      });
    }
  }
};
