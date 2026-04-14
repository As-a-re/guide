import { useCallback, useEffect, useState } from 'react';

/**
 * Hook to manage secondary display projection
 * Allows components to open/close projections on extended displays
 */
export const useProjection = () => {
  const [isProjectionActive, setIsProjectionActive] = useState(false);
  const [availableDisplays, setAvailableDisplays] = useState([]);

  // Fetch available displays on mount
  useEffect(() => {
    const fetchDisplays = async () => {
      if (window.api?.getProjectionDisplays) {
        const displays = await window.api.getProjectionDisplays();
        setAvailableDisplays(displays);
        console.log('[useProjection] Available displays:', displays);
      }
    };

    fetchDisplays();
  }, []);

  // Check projection status
  useEffect(() => {
    const checkStatus = async () => {
      if (window.api?.getProjectionStatus) {
        const status = await window.api.getProjectionStatus();
        setIsProjectionActive(status.isActive);
      }
    };

    checkStatus();
    // Poll every 2 seconds
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Open projection on secondary display
  const openProjection = useCallback((data, type = 'announcement') => {
    if (window.api?.openProjection) {
      console.log('[useProjection] Opening projection:', type);
      window.api.openProjection(data, type);
      setIsProjectionActive(true);
    } else {
      console.warn('[useProjection] Electron API not available');
    }
  }, []);

  // Update projection content
  const updateProjection = useCallback((data) => {
    if (window.api?.updateProjection) {
      console.log('[useProjection] Updating projection');
      window.api.updateProjection(data);
    }
  }, []);

  // Close projection
  const closeProjection = useCallback(() => {
    if (window.api?.closeProjection) {
      console.log('[useProjection] Closing projection');
      window.api.closeProjection();
      setIsProjectionActive(false);
    }
  }, []);

  // Check if secondary display is available
  const hasSecondaryDisplay = availableDisplays.length > 1;

  return {
    openProjection,
    closeProjection,
    updateProjection,
    isProjectionActive,
    availableDisplays,
    hasSecondaryDisplay,
  };
};
